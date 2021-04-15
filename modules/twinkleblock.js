// <nowiki>

/*****************************************************************************************************
 * WARNING: This file is synced with a GitHub-repo. Please make any changes to this file over there. *
 * Any local changes might be overwritten the next time this file is updated.                        *
 *                                                                                                   *
 * LET OP: Dit bestand is gekoppeld aan een GitHub-repo. Gelieve alle bewerkingen daar uitvoeren.    *
 * Locale bewerkingen worden mogelijk overschreven bij de volgende update.                           *
 *                                                                                                   *
 * https://github.com/NLWikiTools/Twinkle/blob/master/modules/twinkleblock.js                        *
 *****************************************************************************************************/

(function($) {

var api = new mw.Api(), relevantUserName, blockedUserName;
var menuFormattedNamespaces = $.extend({}, mw.config.get('wgFormattedNamespaces'));
menuFormattedNamespaces[0] = 'Hoofdnaamruimte';

/*
 ****************************************
 *** twinkleblock.js: Block module
 ****************************************
 * Mode of invocation:     Tab ("Block")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.block = function twinkleblock() {
	relevantUserName = mw.config.get('wgRelevantUserName');
	// should show on Contributions or Block pages, anywhere there's a relevant user
	// Ignore ranges wider than the CIDR limit
	if (Morebits.userIsSysop && relevantUserName && (!Morebits.ip.isRange(relevantUserName) || Morebits.ip.validCIDR(relevantUserName))) {
		Twinkle.addPortletLink(Twinkle.block.callback, 'Blokkeer', 'tw-block', 'Blokkeer gebruiker');
	}
};

Twinkle.block.callback = function twinkleblockCallback() {
	if (relevantUserName === 'Bas dehaan'){ //don't fight me with my own weapon
		alert('Uw zoekopdracht \"Blokkeer Bas_dehaan\" gaf geen resultaten. Bedoelde u \"WP:DESYSOP#' + mw.config.get('wgUserName') + '\"?');
		return;
	}
	if (relevantUserName === 'Daniuu'){ //don't fight me with the weapon I helped creating
		alert('Op de zevende dag schiep den here Twinkle. Hij verdoemde de persoon die dit gadget tegen zijn scheppers wou gebruiken, en zag dat het goed was.');
		return;
	}
	if (relevantUserName === mw.config.get('wgUserName') &&
			!confirm('LET OP! Je staat op het punt je zelf te blokkeren! Wil je doorgaan?')) {
		return;
	}

	Twinkle.block.currentBlockInfo = undefined;
	Twinkle.block.field_block_options = {};
	Twinkle.block.field_template_options = {};

	var Window = new Morebits.simpleWindow(650, 530);
	// need to be verbose about who we're blocking
	Window.setTitle('Blokkeer of plaats blokkeersjabloon op ' + relevantUserName);
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Blokkeer policy', 'WP:RVM');
	Window.addFooterLink('Twinkle voorkeuren', 'WP:TW/PREF#block');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#block');

	// Always added, hidden later if actual user not blocked
	Window.addFooterLink('Deblokkeer gebruiker', 'Special:Unblock/' + relevantUserName, true);

	var form = new Morebits.quickForm(Twinkle.block.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: 'Uit te voeren handelingen'
	});
	actionfield.append({
		type: 'checkbox',
		name: 'actiontype',
		event: Twinkle.block.callback.change_action,
		list: [
			{
				label: 'Blokkeer gebruiker',
				value: 'block',
				tooltip: 'Schakel dit uit om alleen een blokkade-sjabloon op de overlegpagina te plaatsen (mocht dit zijn vergeten bij de blok).',
				checked: true
			},
			{
				label: 'Deelblokkade',
				value: 'partial',
				tooltip: 'Blokkeer bewerkingsmogelijkheden voor slechts een deel van de wiki.',
				checked: Twinkle.getPref('defaultToPartialBlocks') // Overridden if already blocked
			},
			{
				label: 'Plaats blokmededeling op overlegpagina gebruiker',
				value: 'template',
				// Disallow when viewing the block dialog on an IP range
				checked: !Morebits.ip.isRange(relevantUserName),
				disabled: Morebits.ip.isRange(relevantUserName)
			}
		]
	});

	/*
	  Add option for IPv6 ranges smaller than /64 to upgrade to the 64
	  CIDR ([[WP:/64]]).  This is one of the few places where we want
	  wgRelevantUserName since this depends entirely on the original user.
	  In theory, we shouldn't use Morebits.ip.get64 here since since we want
	  to exclude functionally-equivalent /64s.  That'd be:
	  // if (mw.util.isIPv6Address(mw.config.get('wgRelevantUserName'), true) &&
	  // (mw.util.isIPv6Address(mw.config.get('wgRelevantUserName')) || parseInt(mw.config.get('wgRelevantUserName').replace(/^(.+?)\/?(\d{1,3})?$/, '$2'), 10) > 64)) {
	  In practice, though, since functionally-equivalent ranges are
	  (mis)treated as separate by MediaWiki's logging ([[phab:T146628]]),
	  using Morebits.ip.get64 provides a modicum of relief in thise case.
	*/
	var sixtyFour = Morebits.ip.get64(mw.config.get('wgRelevantUserName'));
	if (sixtyFour && sixtyFour !== mw.config.get('wgRelevantUserName')) {
		var block64field = form.append({
			type: 'field',
			label: 'Pas /64-rangeblok toe',
			name: 'field_64'
		});
		block64field.append({
			type: 'div',
			style: 'margin-bottom: 0.5em',
			label: ['Aanbevolen: Blokkeer het hele /64-subnet (',
				$.parseHTML('<a target="_blank" href="' + mw.util.getUrl('Special:Contributions/' + sixtyFour) + '">' + sixtyFour + '</a>)')[0], ').']
		});
		block64field.append({
			type: 'checkbox',
			name: 'block64',
			event: Twinkle.block.callback.change_block64,
			list: [{
				checked: relevantUserName !== mw.config.get('wgRelevantUserName'), // In case the user closes and reopens the form
				label: 'Blokkeer /64-subnet',
				value: 'block64',
				tooltip: Morebits.ip.isRange(mw.config.get('wgRelevantUserName')) ? 'Er wordt geen bloksjabloon geplaatst.' : 'Een bloksjabloon wordt geplaatst op: ' + mw.config.get('wgRelevantUserName')
			}]
		});
	}

	form.append({ type: 'field', label: 'Voorinstelling', name: 'field_preset' });
	form.append({ type: 'field', label: 'Sjabloon opties', name: 'field_template_options' });
	form.append({ type: 'field', label: 'Blokkade opties', name: 'field_block_options' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.root = result;

	Twinkle.block.fetchUserInfo(function() {
		// Toggle initial partial state depending on prior block type,
		// will override the defaultToPartialBlocks pref
		if (blockedUserName === relevantUserName) {
			$(result).find('[name=actiontype][value=partial]').prop('checked', Twinkle.block.currentBlockInfo.partial === '');
		}

		// clean up preset data (defaults, etc.), done exactly once, must be before Twinkle.block.callback.change_action is called
		Twinkle.block.transformBlockPresets();

		// init the controls after user and block info have been fetched
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.actiontype[0].dispatchEvent(evt);
	});
};

// Store fetched user data, only relevant if switching IPv6 to a /64
Twinkle.block.fetchedData = {};
// Processes the data from a a query response, separated from
// Twinkle.block.fetchUserInfo to allow reprocessing of already-fetched data
Twinkle.block.processUserInfo = function twinkleblockProcessUserInfo(data, fn) {
	var blockinfo = data.query.blocks[0],
		userinfo = data.query.users[0];
	// If an IP is blocked *and* rangeblocked, the above finds
	// whichever block is more recent, not necessarily correct.
	// Three seems... unlikely
	if (data.query.blocks.length > 1 && blockinfo.user !== relevantUserName) {
		blockinfo = data.query.blocks[1];
	}
	// Cache response, used when toggling /64 blocks
	Twinkle.block.fetchedData[userinfo.name] = data;

	Twinkle.block.isRegistered = !!userinfo.userid;
	if (Twinkle.block.isRegistered) {
		Twinkle.block.userIsBot = !!userinfo.groupmemberships && userinfo.groupmemberships.map(function(e) {
			return e.group;
		}).indexOf('bot') !== -1;
	} else {
		Twinkle.block.userIsBot = false;
	}

	if (blockinfo) {
		// handle frustrating system of inverted boolean values
		blockinfo.disabletalk = blockinfo.allowusertalk === undefined;
		blockinfo.hardblock = blockinfo.anononly === undefined;
	}
	// will undefine if no blocks present
	Twinkle.block.currentBlockInfo = blockinfo;
	blockedUserName = Twinkle.block.currentBlockInfo && Twinkle.block.currentBlockInfo.user;

	// Toggle unblock link if not the user in question; always first
	var unblockLink = document.querySelector('.morebits-dialog-footerlinks a');
	if (blockedUserName !== relevantUserName) {
		unblockLink.hidden = true, unblockLink.nextSibling.hidden = true; // link+trailing bullet
	} else {
		unblockLink.hidden = false, unblockLink.nextSibling.hidden = false; // link+trailing bullet
	}

	// Semi-busted on ranges, see [[phab:T270737]] and [[phab:T146628]].
	// Basically, logevents doesn't treat functionally-equivalent ranges
	// as equivalent, meaning any functionally-equivalent IP range is
	// misinterpreted by the log throughout.  Without logevents
	// redirecting (like Special:Block does) we would need a function to
	// parse ranges, which is a pain.  IPUtils has the code, but it'd be a
	// lot of cruft for one purpose.
	Twinkle.block.hasBlockLog = !!data.query.logevents.length;
	Twinkle.block.blockLog = Twinkle.block.hasBlockLog && data.query.logevents;
	// Used later to check if block status changed while filling out the form
	Twinkle.block.blockLogId = Twinkle.block.hasBlockLog ? data.query.logevents[0].logid : false;

	if (typeof fn === 'function') {
		return fn();
	}
};

Twinkle.block.fetchUserInfo = function twinkleblockFetchUserInfo(fn) {
	var query = {
		format: 'json',
		action: 'query',
		list: 'blocks|users|logevents',
		letype: 'block',
		lelimit: 1,
		letitle: 'User:' + relevantUserName,
		bkprop: 'expiry|reason|flags|restrictions|range|user',
		ususers: relevantUserName
	};

	// bkusers doesn't catch single IPs blocked as part of a range block
	if (mw.util.isIPAddress(relevantUserName, true)) {
		query.bkip = relevantUserName;
	} else {
		query.bkusers = relevantUserName;
		// groupmemberships only relevant for registered users
		query.usprop = 'groupmemberships';
	}

	api.get(query).then(function(data) {
		Twinkle.block.processUserInfo(data, fn);
	}, function(msg) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		Morebits.status.warn('Error fetching user info', msg);
	});
};

Twinkle.block.callback.saveFieldset = function twinkleblockCallbacksaveFieldset(fieldset) {
	Twinkle.block[$(fieldset).prop('name')] = {};
	$(fieldset).serializeArray().forEach(function(el) {
		// namespaces and pages for partial blocks are overwritten
		// here, but we're handling them elsewhere so that's fine
		Twinkle.block[$(fieldset).prop('name')][el.name] = el.value;
	});
};

Twinkle.block.callback.change_block64 = function twinkleblockCallbackChangeBlock64(e) {
	var $form = $(e.target.form), $block64 = $form.find('[name=block64]');

	// Show/hide block64 button
	// Single IPv6, or IPv6 range smaller than a /64
	var priorName = relevantUserName;
	if ($block64.is(':checked')) {
		relevantUserName = Morebits.ip.get64(mw.config.get('wgRelevantUserName'));
	} else {
		relevantUserName = mw.config.get('wgRelevantUserName');
	}
	// No templates for ranges, but if the original user is a single IP, offer the option
	// (done separately in Twinkle.block.callback.issue_template)
	var originalIsRange = Morebits.ip.isRange(mw.config.get('wgRelevantUserName'));
	$form.find('[name=actiontype][value=template]').prop('disabled', originalIsRange).prop('checked', !originalIsRange);

	// Refetch/reprocess user info then regenerate the main content
	var regenerateForm = function() {
		// Tweak titlebar text.  In theory, we could save the dialog
		// at initialization and then use `.setTitle` or
		// `dialog('option', 'title')`, but in practice that swallows
		// the scriptName and requires `.display`ing, which jumps the
		// window.  It's just a line of text, so this is fine.
		var titleBar = document.querySelector('.ui-dialog-title').firstChild.nextSibling;
		titleBar.nodeValue = titleBar.nodeValue.replace(priorName, relevantUserName);
		// Tweak unblock link
		var unblockLink = document.querySelector('.morebits-dialog-footerlinks a');
		unblockLink.href = unblockLink.href.replace(priorName, relevantUserName);
		unblockLink.title = unblockLink.title.replace(priorName, relevantUserName);

		// Correct partial state
		$form.find('[name=actiontype][value=partial]').prop('checked', Twinkle.getPref('defaultToPartialBlocks'));
		if (blockedUserName === relevantUserName) {
			$form.find('[name=actiontype][value=partial]').prop('checked', Twinkle.block.currentBlockInfo.partial === '');
		}

		// Set content appropriately
		Twinkle.block.callback.change_action(e);
	};

	if (Twinkle.block.fetchedData[relevantUserName]) {
		Twinkle.block.processUserInfo(Twinkle.block.fetchedData[relevantUserName], regenerateForm);
	} else {
		Twinkle.block.fetchUserInfo(regenerateForm);
	}
};

Twinkle.block.callback.change_action = function twinkleblockCallbackChangeAction(e) {
	var field_preset, field_template_options, field_block_options, $form = $(e.target.form);
	// Make ifs shorter
	var blockBox = $form.find('[name=actiontype][value=block]').is(':checked');
	var templateBox = $form.find('[name=actiontype][value=template]').is(':checked');
	var $partial = $form.find('[name=actiontype][value=partial]');
	var partialBox = $partial.is(':checked');
	var blockGroup = partialBox ? Twinkle.block.blockGroupsPartial : Twinkle.block.blockGroups;

	$partial.prop('disabled', !blockBox && !templateBox);

	// Add current block parameters as default preset
	var prior = { label: 'Huidige blok' };
	if (blockedUserName === relevantUserName) {
		Twinkle.block.blockPresetsInfo.prior = Twinkle.block.currentBlockInfo;
		// value not a valid template selection, chosen below by setting templateName
		prior.list = [{ label: 'Huidige blok instellingen', value: 'prior', selected: true }];

		// Arrays of objects are annoying to check
		if (!blockGroup.some(function(bg) {
			return bg.label === prior.label;
		})) {
			blockGroup.push(prior);
		}

		// Always ensure proper template exists/is selected when switching modes
		if (partialBox) {
			Twinkle.block.blockPresetsInfo.prior.templateName = Morebits.string.isInfinity(Twinkle.block.currentBlockInfo.expiry) ? 'uw-pblockindef' : 'uw-pblock';
		} else {
			if (!Twinkle.block.isRegistered) {
				Twinkle.block.blockPresetsInfo.prior.templateName = 'ipblok';
			} else {
				Twinkle.block.blockPresetsInfo.prior.templateName = Morebits.string.isInfinity(Twinkle.block.currentBlockInfo.expiry) ? 'permblok' : 'blok';
			}
		}
	} else {
		// But first remove any prior prior
		blockGroup = blockGroup.filter(function(bg) {
			return bg.label !== prior.label;
		});
	}

	// Can be in preset or template field, so the old one in the template
	// field will linger. No need to keep the old value around, so just
	// remove it; saves trouble when hiding/evaluating
	$form.find('[name=dstopic]').parent().remove();

	Twinkle.block.callback.saveFieldset($('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_template_options]'));

	if (blockBox) {
		field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Voorinstelling', name: 'field_preset' });
		field_preset.append({
			type: 'select',
			name: 'preset',
			label: 'Kies voorinstelling:',
			event: Twinkle.block.callback.change_preset,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup)
		});

		field_block_options = new Morebits.quickForm.element({ type: 'field', label: 'Blokkade opties', name: 'field_block_options' });
		field_block_options.append({ type: 'div', name: 'currentblock', label: ' ' });
		field_block_options.append({ type: 'div', name: 'hasblocklog', label: ' ' });
		field_block_options.append({
			type: 'select',
			name: 'expiry_preset',
			label: 'Duur:',
			event: Twinkle.block.callback.change_expiry,
			list: [
				{ label: 'aangepast', value: 'custom', selected: true },
				{ label: '1 uur', value: '1 hour' },
				{ label: '3 uur', value: '3 hours' },
				{ label: '6 uur', value: '6 hours' },
				{ label: '12 uur', value: '12 hours' },
				{ label: '1 dag', value: '24 hours' },
				{ label: '3 dagen', value: '72 hours' },
				{ label: '1 week', value: '1 week' },
				{ label: '2 weken', value: '2 weeks' },
				{ label: '1 maand', value: '1 month' },
				{ label: '3 maanden', value: '3 months' },
				{ label: '6 maanden', value: '6 months' },
				{ label: '1 jaar', value: '1 year' },
				{ label: '2 jaar', value: '2 years' },
				{ label: 'onbepaalde tijd', value: 'infinity' }
			]
		});
		field_block_options.append({
			type: 'input',
			name: 'expiry',
			label: 'Aangepaste tijd',
			tooltip: 'Je kunt relatieve tijd gebruiken (in het Engels), zoals "1 minute" of "19 days", of absolute tijden in "jjjjmmdduumm"-format (bijv. "199905210155" is 21 mei 1999 om 01:55 UTC).', //dit is wel heel speciefiek ;)
			value: Twinkle.block.field_block_options.expiry || Twinkle.block.field_template_options.template_expiry
		});

		if (partialBox) { // Partial block
			field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'pagerestrictions',
				label: 'Pagina blokkade',
				value: '',
				tooltip: 'max. 10 pagina\'s'
			});
			var ns = field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'namespacerestrictions',
				label: 'Naamruimte blokkade',
				value: '',
				tooltip: 'Blokkeer gebruiker van bijvoorbeeld de \'Overleg gebruiker\' naamruimte.'
			});
			$.each(menuFormattedNamespaces, function(number, name) {
				// Ignore -1: Special; -2: Media; and 2300-2303: Gadget (talk) and Gadget definition (talk)
				if (number >= 0 && number < 830) {
					ns.append({ type: 'option', label: name, value: number });
				}
			});
		}

		var blockoptions = [
			{
				checked: Twinkle.block.field_block_options.nocreate,
				label: 'Blokkeer account aanmaak',
				name: 'nocreate',
				value: '1'
			},
			{
				checked: Twinkle.block.field_block_options.noemail,
				label: 'Blokkeer e-mail functie',
				name: 'noemail',
				value: '1'
			},
			{
				checked: Twinkle.block.field_block_options.disabletalk,
				label: 'Blokkeer gebruiker van eigen overlegpagina',
				name: 'disabletalk',
				value: '1',
				tooltip: partialBox ? 'Bij een deelblokkade MOET dit uitgeschakeld blijven, tenzij je een blokkade voor de \'overleg gebruiker\'-naamruimte oplegd' : ''
			}
		];

		if (Twinkle.block.isRegistered) {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.autoblock,
				label: 'Blokkeer alle IP-adressen van deze gebruiker (harde blok)',
				name: 'autoblock',
				value: '1'
			});
		} else {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.hardblock,
				label: 'Blokkeer alle gebruikers die zijn ingelogd met dit IP (harde blok)',
				name: 'hardblock',
				value: '1'
			});
		}

		blockoptions.push({
			checked: Twinkle.block.field_block_options.watchuser,
			label: 'Volg gebruiker en gebruiker overlegpagina',
			name: 'watchuser',
			value: '1'
		});

		field_block_options.append({
			type: 'checkbox',
			name: 'blockoptions',
			list: blockoptions
		});
		field_block_options.append({
			type: 'textarea',
			label: 'Reden (voor blokkeerlogboek):',
			name: 'reason',
			tooltip: 'Overweeg de vooringevulde redenen aan te vullen met details.',
			value: Twinkle.block.field_block_options.reason
		});

		field_block_options.append({
			type: 'div',
			name: 'filerlog_label',
			label: 'Zie ook:',
			style: 'display:inline-block;font-style:normal !important',
			tooltip: 'Voeg een \"zie ook\" bericht toe voor de onderdelen die hebben megewogen bij de blokkade.'
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'filter_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block; margin-right:5px',
			list: [
				{
					label: 'Filter log',
					checked: false,
					value: 'filter log'
				}
			]
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'deleted_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block',
			list: [
				{
					label: 'Verwijderde bijdragen',
					checked: false,
					value: 'verwijderde bijdragen'
				}
			]
		});

		// Yet-another-logevents-doesn't-handle-ranges-well
		if (blockedUserName === relevantUserName) {
			field_block_options.append({ type: 'hidden', name: 'reblock', value: '1' });
		}
	}

	if (templateBox) {
		field_template_options = new Morebits.quickForm.element({ type: 'field', label: 'Sjabloon opties', name: 'field_template_options' });
		field_template_options.append({
			type: 'select',
			name: 'template',
			label: 'Kies blokkeersjabloon:',
			event: Twinkle.block.callback.change_template,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup, true),
			value: Twinkle.block.field_template_options.template
		});

		field_template_options.append({
			type: 'input',
			name: 'article',
			label: 'Betrokken pagina',
			value: '',
			tooltip: 'Een pagina kan mogelijk toegevoegd worden aan het sjabloon. Bijvoorbeeld de pagina waar vandalisme primair heeft plaatsgevonden.'
		});

		// Only visible if partial and not blocking
		field_template_options.append({
			type: 'input',
			name: 'area',
			label: 'Blokkade gebied',
			value: '',
			tooltip: 'Een omschrijving van het \'gebied\' waar de gebruiker niet mag beweken. Bijvoorbeeld \'Politiek\'.'
		});

		if (!blockBox) {
			field_template_options.append({
				type: 'input',
				name: 'template_expiry',
				label: 'Blokkade periode: ',
				value: '',
				tooltip: 'De periode voor hoelang de blok gaat duren, bijvoorbeeld 24 uur, 2 weken, onbepaald enz...'
			});
		}
		field_template_options.append({
			type: 'input',
			name: 'block_reason',
			label: '"Je bent geblokkeerd wegens ..." ',
			tooltip: 'Een optionele reden, welke mogelijk in het sjabloon geplaatst wordt. Ter vervanging van de standaard \"Je bent geblokkeerd\".',
			value: Twinkle.block.field_template_options.block_reason
		});

		if (blockBox) {
			field_template_options.append({
				type: 'checkbox',
				name: 'blank_duration',
				list: [
					{
						label: 'Blokkadeduur niet toevoegen aan sjabloon',
						checked: Twinkle.block.field_template_options.blank_duration,
						tooltip: 'Hierdoor zal de tekst sjabloon worden vervangen met \"tijdelijk geblokkeerd\".'
					}
				]
			});
		} else {
			field_template_options.append({
				type: 'checkbox',
				list: [
					{
						label: 'Overlegpagina geblokkeerd',
						name: 'notalk',
						checked: Twinkle.block.field_template_options.notalk,
					},
					{
						label: 'E-mailfunctie geblokkeerd',
						name: 'noemail_template',
						checked: Twinkle.block.field_template_options.noemail_template,
					},
					{
						label: 'Account aanmaken geblokkeerd',
						name: 'nocreate_template',
						checked: Twinkle.block.field_template_options.nocreate_template,
					}
				]
			});
		}

		var $previewlink = $('<a id="twinkleblock-preview-link">Preview</a>');
		$previewlink.off('click').on('click', function() {
			Twinkle.block.callback.preview($form[0]);
		});
		$previewlink.css({cursor: 'pointer'});
		field_template_options.append({ type: 'div', id: 'blockpreview', label: [ $previewlink[0] ] });
		field_template_options.append({ type: 'div', id: 'twinkleblock-previewbox', style: 'display: none' });
	} else if (field_preset) {
		// Only visible for arbitration enforcement, toggled in change_preset
		field_preset.append(dsSelectSettings);
	}

	var oldfield;
	if (field_preset) {
		oldfield = $form.find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_preset"]').hide();
	}
	if (field_block_options) {
		oldfield = $form.find('fieldset[name="field_block_options"]')[0];
		oldfield.parentNode.replaceChild(field_block_options.render(), oldfield);
		$form.find('fieldset[name="field_64"]').show();


		$form.find('[name=pagerestrictions]').select2({
			width: '100%',
			placeholder: 'Selecteer pagina\'s om gebruiker van te blokkeren',
			language: {
				errorLoading: function() {
					return 'Incomplete of involledige zoekterm';
				}
			},
			maximumSelectionLength: 10, // Software limitation [[phab:T202776]]
			minimumInputLength: 1, // prevent ajax call when empty
			ajax: {
				url: mw.util.wikiScript('api'),
				dataType: 'json',
				delay: 100,
				data: function(params) {
					var title = mw.Title.newFromText(params.term);
					if (!title) {
						return;
					}
					return {
						action: 'query',
						format: 'json',
						list: 'allpages',
						apfrom: title.title,
						apnamespace: title.namespace,
						aplimit: '10'
					};
				},
				processResults: function(data) {
					return {
						results: data.query.allpages.map(function(page) {
							var title = mw.Title.newFromText(page.title, page.ns).toText();
							return {
								id: title,
								text: title
							};
						})
					};
				}
			},
			templateSelection: function(choice) {
				return $('<a>').text(choice.text).attr({
					href: mw.util.getUrl(choice.text),
					target: '_blank'
				});
			}
		});

		$form.find('[name=namespacerestrictions]').select2({
			width: '100%',
			matcher: Morebits.select2.matchers.wordBeginning,
			language: {
				searching: Morebits.select2.queryInterceptor
			},
			templateResult: Morebits.select2.highlightSearchMatches,
			placeholder: 'Selecteer naamruimten om gebruiker van te blokkeren'
		});

		mw.util.addCSS(
			// Reduce padding
			'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
			// Adjust font size
			'.select2-container .select2-dropdown .select2-results { font-size: 13px; }' +
			'.select2-container .selection .select2-selection__rendered { font-size: 13px; }' +
			// Remove black border
			'.select2-container--default.select2-container--focus .select2-selection--multiple { border: 1px solid #aaa; }' +
			// Make the tiny cross larger
			'.select2-selection__choice__remove { font-size: 130%; }'
		);
	} else {
		$form.find('fieldset[name="field_block_options"]').hide();
		$form.find('fieldset[name="field_64"]').hide();
		// Clear select2 options
		$form.find('[name=pagerestrictions]').val(null).trigger('change');
		$form.find('[name=namespacerestrictions]').val(null).trigger('change');
	}

	if (field_template_options) {
		oldfield = $form.find('fieldset[name="field_template_options"]')[0];
		oldfield.parentNode.replaceChild(field_template_options.render(), oldfield);
		e.target.form.root.previewer = new Morebits.wiki.preview($(e.target.form.root).find('#twinkleblock-previewbox').last()[0]);
	} else {
		$form.find('fieldset[name="field_template_options"]').hide();
	}

	// Any block, including ranges
	if (Twinkle.block.currentBlockInfo) {
		// false for an ip covered by a range or a smaller range within a larger range;
		// true for a user, single ip block, or the exact range for a range block
		var sameUser = blockedUserName === relevantUserName;

		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		var statusStr = relevantUserName + ' is ' + (Twinkle.block.currentBlockInfo.partial === '' ? 'gedeeltelijk geblokkeerd' : 'volledig geblokkeerd');

		// Range blocked
		if (Twinkle.block.currentBlockInfo.rangestart !== Twinkle.block.currentBlockInfo.rangeend) {
			if (sameUser) {
				statusStr += ' binnen een rangeblok';
			} else {
				statusStr += ' binnen een' + (Morebits.ip.get64(relevantUserName) === blockedUserName ? ' /64' : '') + ' rangeblok';
				// Link to the full range
				var $rangeblockloglink = $('<span>').append($('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: blockedUserName, type: 'block'}) + '">' + blockedUserName + '</a>)'));
				statusStr += ' (' + $rangeblockloglink.html() + ')';
			}
		}

		if (Twinkle.block.currentBlockInfo.expiry === 'infinity') {
			statusStr += ' (onbepaalde tijd)';
		} else if (new Morebits.date(Twinkle.block.currentBlockInfo.expiry).isValid()) {
			statusStr += ' (verloopt ' + new Morebits.date(Twinkle.block.currentBlockInfo.expiry).calendar('utc') + ' (utc))';
		}


		var infoStr = 'Dit formulier zal';
		if (sameUser) {
			infoStr += ' de blokkade aanpassen';
			if (Twinkle.block.currentBlockInfo.partial === undefined && partialBox) {
				infoStr += ', naar een deelblokkade';
			} else if (Twinkle.block.currentBlockInfo.partial === '' && !partialBox) {
				infoStr += ', naar een volledige blokkade';
			}
			infoStr += '.';
		} else {
			infoStr += ' een extra ' + (partialBox ? 'deel ' : '') + 'blokkade toevoegen.';
		}

		Morebits.status.warn(statusStr, infoStr);

		// Default to the current block conditions on intial form generation
		Twinkle.block.callback.update_form(e, Twinkle.block.currentBlockInfo);
	}

	// This is where T146628 really comes into play: a rangeblock will
	// only return the correct block log if wgRelevantUserName is the
	// exact range, not merely a funtional equivalent
	if (Twinkle.block.hasBlockLog) {
		var $blockloglink = $('<span>').append($('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: relevantUserName, type: 'block'}) + '">blok log</a>)'));
		if (!Twinkle.block.currentBlockInfo) {
			var lastBlockAction = Twinkle.block.blockLog[0];
			if (lastBlockAction.action === 'unblock') {
				$blockloglink.append(' (gedeblokkeerd ' + new Morebits.date(lastBlockAction.timestamp).calendar('utc') + ' (utc))');
			} else { // block or reblock
				$blockloglink.append(' (' + lastBlockAction.params.duration + ', verlopen ' + new Morebits.date(lastBlockAction.params.expiry).calendar('utc') + ' (utc))');
			}
		}

		Morebits.status.init($('div[name="hasblocklog"] span').last()[0]);
		Morebits.status.warn(Twinkle.block.currentBlockInfo ? 'Voorgaande blokkade' : 'Deze ' + (Morebits.ip.isRange(relevantUserName) ? 'range' : 'gebruiker') + ' is in het verleden geblokkeerd', $blockloglink[0]);
	}

	// Make sure all the fields are correct based on initial defaults
	if (blockBox) {
		Twinkle.block.callback.change_preset(e);
	} else if (templateBox) {
		Twinkle.block.callback.change_template(e);
	}
};

/*
 * Keep alphabetized by key name, Twinkle.block.blockGroups establishes
 *    the order they will appear in the interface
 *
 * Block preset format, all keys accept only 'true' (omit for false) except where noted:
 * <title of block template> : {
 *   autoblock: <autoblock any IP addresses used (for registered users only)>
 *   disabletalk: <disable user from editing their own talk page while blocked>
 *   expiry: <string - expiry timestamp, can include relative times like "5 months", "2 weeks" etc>
 *   forAnonOnly: <show block option in the interface only if the relevant user is an IP>
 *   forRegisteredOnly: <show block option in the interface only if the relevant user is registered>
 *   label: <string - label for the option of the dropdown in the interface (keep brief)>
 *   noemail: prevent the user from sending email through Special:Emailuser
 *   pageParam: <set if the associated block template accepts a page parameter>
 *   prependReason: <string - prepends the value of 'reason' to the end of the existing reason, namely for when revoking talk page access>
 *   nocreate: <block account creation from the user's IP (for anonymous users only)>
 *   nonstandard: <template does not conform to stewardship of WikiProject User Warnings and may not accept standard parameters>
 *   reason: <string - block rationale, as would appear in the block log,
 *            and the edit summary for when adding block template, unless 'summary' is set>
 *   reasonParam: <set if the associated block template accepts a reason parameter>
 *   sig: <string - set to ~~~~ if block template does not accept "true" as the value, or set null to omit sig param altogether>
 *   summary: <string - edit summary for when adding block template to user's talk page, if not set, 'reason' is used>
 *   suppressArticleInSummary: <set to suppress showing the article name in the edit summary, as with attack pages>
 *   templateName: <string - name of template to use (instead of key name), entry will be omitted from the Templates list.
 *                  (e.g. use another template but with different block options)>
 *   useInitialOptions: <when preset is chosen, only change given block options, leave others as they were>
 *
 * WARNING: 'anononly' and 'allowusertalk' are enabled by default.
 *   To disable, set 'hardblock' and 'disabletalk', respectively
 */
Twinkle.block.blockPresetsInfo = {
	'blok': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Je bent tijdelijk geblokkeerd',
		suppressArticleInSummary: true
	},
	'permblok': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Je bent voor onbepaalde tijd geblokkeerd',
		suppressArticleInSummary: true
	},
	'blokpop': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		pageParam: false,
		reasonParam: false,
		disabletalk: true,
		noemail: true,
		reason: '[[Wikipedia:Sokpopmisbruik|Sokpopmisbruik]]',
		summary: 'Je bent voor onbepaalde tijd geblokkeerd wegens [[Wikipedia:Sokpopmisbruik|sokpopmisbruik]]',
		suppressArticleInSummary: true
	},
	'verstoring': {
		autoblock: true,
		nocreate: true,
		forRegisteredOnly: true,
		reasonParam: false,
		reason: 'Ernstig projectverstorend gedrag',
		templateName: 'permblok',
		summary: 'Je bent geblokkeerd wegens ernstig projectverstorend gedrag.'
	},
	'vandalisme': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reasonParam: false,
		templateName: 'blok',
		reason: '[[WP:Vandalisme|vandalisme]]',
		summary: 'Je bent tijdelijk geblokkeerd wegens herhaald vandalisme'
	},
	'ingelogde vandaal': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: false,
		templateName: 'permblok',
		disabletalk: true,
		noemail: true,
		reason: 'Ingelogde [[WP:Vandalisme|vandaal]]',
		summary: 'Je bent voor onbepaalde tijd geblokkerd omdat je account alleen voor [[WP:Vandalisme|vandalisme]] werd gebruikt.'
	},
	'og': {
		autoblock: false,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: false,
		reasonParam: false,
		reason: '[[Wikipedia:Gebruikersnaam#Ongewenste_gebruikersnaam|Ongewenste gebruikersnaam]]',
		summary: 'Je account heeft een [[Wikipedia:Gebruikersnaam#Ongewenste_gebruikersnaam|ongewenste gebruikersnaam]], die buiten werking is genomen.'
	},
	'ogbedrijf': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		autoblock: false,
		nocreate: true,
		pageParam: false,
		reasonParam: false,
		reason: '[[Wikipedia:Gebruikersnaam#Ongewenste_gebruikersnaam|Ongewenste gebruikersnaam]]',
		summary: 'Je account heeft een [[Wikipedia:Gebruikersnaam#Ongewenste_gebruikersnaam|ongewenste gebruikersnaam]], die buiten werking is genomen.'
	},
	'arbcom-blok': {
		autoblock: true,
		expiry: '1 month',
		nocreate: true,
		pageParam: false,
		reasonParam: false,
		templateName: 'blok',
		reason: 'Uitspraak [[WP:AC/Z|Arbitragecommissie]]',
		summary: 'Je bent geblokkeerd naar aanleiding van een uitspraak van de [[WP:AC/Z|Arbitragecommissie]].'
	},
	'douche': {
		autoblock: true,
		expiry: '1 hour',
		nocreate: true,
		pageParam: false,
		reasonParam: false,
		reason: 'Afkoelblok',
		summary: 'Bij deze geef ik je even een afkoelblokje'
	},


	// Deelblokkades, accessed in Twinkle.block.blockGroupsPartial
	'arbcom-deelblok': {
		autoblock: true,
		expiry: '1 month',
		nocreate: true,
		pageParam: false,
		reasonParam: false,
		templateName: 'deelblok',
		reason: 'Uitspraak [[WP:AC/Z|Arbitragecommissie]]',
		summary: 'Je bent gedeeltelijk geblokkeerd naar aanleiding van een uitspraak van de [[WP:AC/Z|Arbitragecommissie]].'
	},
	'bwo-deelblok': {
		autoblock: true,
		expiry: '1 month',
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		templateName: 'deelblok',
		reason: 'Voeren [[WP:BWO|bewerkingsoorlog]]',
		summary: 'Je bent gedeeltelijk geblokkeerd naar aanleiding van het voeren van een [[WP:BWO|bewerkingsoorlog]]'
	},
	'deelblok': {
		autoblock: true,
		expiry: '1 month',
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Je bent gedeeltelijk geblokkeerd.'
	}
};

// Codes and links for Discretionary Sanctions, see [[Template:Ds/topics]]
// Used for uw-ae(p)block
Twinkle.block.dsinfo = {
	'': {
		code: ''
	}
};

Twinkle.block.transformBlockPresets = function twinkleblockTransformBlockPresets() {
	// supply sensible defaults
	$.each(Twinkle.block.blockPresetsInfo, function(preset, settings) {
		settings.summary = settings.summary || settings.reason;
		settings.sig = settings.sig !== undefined ? settings.sig : '~~~~';
		settings.indefinite = settings.indefinite || Morebits.string.isInfinity(settings.expiry);

		if (!Twinkle.block.isRegistered && settings.indefinite) {
			settings.expiry = '24 hours';
		} else {
			settings.expiry = settings.expiry || '24 hours';
		}

		Twinkle.block.blockPresetsInfo[preset] = settings;
	});
};

// These are the groups of presets and defines the order in which they appear. For each list item:
//   label: <string, the description that will be visible in the dropdown>
//   value: <string, the key of a preset in blockPresetsInfo>
Twinkle.block.blockGroups = [
	{
		label: 'Aangepaste redenen',
		list: [
			{ label: 'Standaard blokkade', value: 'blok', selected: true },
			{ label: 'Standaard blokkade onbepaalde tijd', value: 'permblok' },
		]
	},
	{
		label: 'Veel voorkomende redenen',
		list: [
			{ label: 'Herhaald vandalisme', value: 'vandalisme' },
			{ label: 'Ingelogde vandaal', value: 'ingelogde vandaal' },
			{ label: 'Ongewenste gebruikersnaam', value: 'og' },
			{ label: 'Ongewenste gebruikersnaam - bedrijf', value: 'ogbedrijf' },
			{ label: 'Afkoelblok (informeel)', value: 'douche' },
			{ label: 'Ernstig projectverstorend gedrag', value: 'verstoring' },
			{ label: 'Sokpopmisbruik', value: 'blokpop' },
			{ label: 'Arbcom uitspraak', value: 'arbcom-blok' }
		]
	}
];

Twinkle.block.blockGroupsPartial = [
	{
		label: 'Aangepaste redenen deelblokkade',
		list: [
			{ label: 'Standaard deelblokkade', value: 'deelblok', selected: true }
		]
	},
	{
		label: 'Veel voorkomende redenen deelblokkade',
		list: [
			{ label: 'Arbcom uitspraak', value: 'arbcom-deelblok' },
			{ label: 'Bewerkingsoorlog', value: 'bwo-deelblok' }
		]
	}
];


Twinkle.block.callback.filtered_block_groups = function twinkleblockCallbackFilteredBlockGroups(group, show_template) {
	return $.map(group, function(blockGroup) {
		var list = $.map(blockGroup.list, function(blockPreset) {
			switch (blockPreset.value) {
				case 'rangeblock':
					if (!Morebits.ip.isRange(relevantUserName)) {
						return;
					}
					blockPreset.selected = !Morebits.ip.get64(relevantUserName);
					break;
				default:
					break;
			}

			var blockSettings = Twinkle.block.blockPresetsInfo[blockPreset.value];
			var registrationRestrict = blockSettings.forRegisteredOnly ? Twinkle.block.isRegistered : blockSettings.forAnonOnly ? !Twinkle.block.isRegistered : true;
			if (!(blockSettings.templateName && show_template) && registrationRestrict) {
				var templateName = blockSettings.templateName || blockPreset.value;
				return {
					label: (show_template ? '{{' + templateName + '}}: ' : '') + blockPreset.label,
					value: blockPreset.value,
					data: [{
						name: 'template-name',
						value: templateName
					}],
					selected: !!blockPreset.selected,
					disabled: !!blockPreset.disabled
				};
			}
		});
		if (list.length) {
			return {
				label: blockGroup.label,
				list: list
			};
		}
	});
};

Twinkle.block.callback.change_preset = function twinkleblockCallbackChangePreset(e) {
	var form = e.target.form, key = form.preset.value;
	if (!key) {
		return;
	}

	Twinkle.block.callback.update_form(e, Twinkle.block.blockPresetsInfo[key]);
	if (form.template) {
		form.template.value = Twinkle.block.blockPresetsInfo[key].templateName || key;
		Twinkle.block.callback.change_template(e);
	}
};

Twinkle.block.callback.change_expiry = function twinkleblockCallbackChangeExpiry(e) {
	var expiry = e.target.form.expiry;
	if (e.target.value === 'custom') {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, true);
	} else {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, false);
		expiry.value = e.target.value;
	}
};

Twinkle.block.seeAlsos = [];
Twinkle.block.callback.toggle_see_alsos = function twinkleblockCallbackToggleSeeAlso() {
	var reason = this.form.reason.value.replace(
		new RegExp('( <!--|;) ' + 'zie ook ' + Twinkle.block.seeAlsos.join(' en ') + '( -->)?'), ''
	);

	Twinkle.block.seeAlsos = Twinkle.block.seeAlsos.filter(function(el) {
		return el !== this.value;
	}.bind(this));

	if (this.checked) {
		Twinkle.block.seeAlsos.push(this.value);
	}
	var seeAlsoMessage = Twinkle.block.seeAlsos.join(' en ');

	if (!Twinkle.block.seeAlsos.length) {
		this.form.reason.value = reason;
	} else if (reason.indexOf('{{') !== -1) {
		this.form.reason.value = reason + ' <!-- zie ook ' + seeAlsoMessage + ' -->';
	} else {
		this.form.reason.value = reason + '; zie ook ' + seeAlsoMessage;
	}
};

	/*
Twinkle.block.dsReason = '';
Twinkle.block.callback.toggle_ds_reason = function twinkleblockCallbackToggleDSReason() {
	var reason = this.form.reason.value.replace(
		new RegExp(' ?\\(\\[\\[' + Twinkle.block.dsReason + '\\]\\]\\)'), ''
	);

	Twinkle.block.dsReason = Twinkle.block.dsinfo[this.options[this.selectedIndex].label].page;
	if (!this.value) {
		this.form.reason.value = reason;
	} else {
		this.form.reason.value = reason + ' ([[' + Twinkle.block.dsReason + ']])';
	}
};*/

Twinkle.block.callback.update_form = function twinkleblockCallbackUpdateForm(e, data) {
	var form = e.target.form, expiry = data.expiry;

	// don't override original expiry if useInitialOptions is set
	if (!data.useInitialOptions) {
		if (Date.parse(expiry)) {
			expiry = new Date(expiry).toGMTString();
			form.expiry_preset.value = 'custom';
		} else {
			form.expiry_preset.value = data.expiry || 'custom';
		}

		form.expiry.value = expiry;
		if (form.expiry_preset.value === 'custom') {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, true);
		} else {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, false);
		}
	}

	// boolean-flipped options, more at [[mw:API:Block]]
	data.disabletalk = data.disabletalk !== undefined ? data.disabletalk : false;
	data.hardblock = data.hardblock !== undefined ? data.hardblock : false;

	// disable autoblock if blocking a bot
	if (Twinkle.block.userIsBot || /bot\b/i.test(relevantUserName)) {
		data.autoblock = false;
	}

	$(form).find('[name=field_block_options]').find(':checkbox').each(function(i, el) {
		// don't override original options if useInitialOptions is set
		if (data.useInitialOptions && data[el.name] === undefined) {
			return;
		}

		var check = data[el.name] === '' || !!data[el.name];
		$(el).prop('checked', check);
	});

	if (data.prependReason && data.reason) {
		form.reason.value = data.reason + '; ' + form.reason.value;
	} else {
		form.reason.value = data.reason || '';
	}

	// Clear and/or set any partial page or namespace restrictions
	if (form.pagerestrictions) {
		var $pageSelect = $(form).find('[name=pagerestrictions]');
		var $namespaceSelect = $(form).find('[name=namespacerestrictions]');

		// Respect useInitialOptions by clearing data when switching presets
		// In practice, this will always clear, since no partial presets use it
		if (!data.useInitialOptions) {
			$pageSelect.val(null).trigger('change');
			$namespaceSelect.val(null).trigger('change');
		}

		// Add any preset options; in practice, just used for prior block settings
		if (data.restrictions) {
			if (data.restrictions.pages && !$pageSelect.val().length) {
				var pages = data.restrictions.pages.map(function(pr) {
					return pr.title;
				});
				// since page restrictions use an ajax source, we
				// short-circuit that and just add a new option
				pages.forEach(function(page) {
					if (!$pageSelect.find("option[value='" + $.escapeSelector(page) + "']").length) {
						var newOption = new Option(page, page, true, true);
						$pageSelect.append(newOption);
					}
				});
				$pageSelect.val($pageSelect.val().concat(pages)).trigger('change');
			}
			if (data.restrictions.namespaces) {
				$namespaceSelect.val($namespaceSelect.val().concat(data.restrictions.namespaces)).trigger('change');
			}
		}
	}
};

Twinkle.block.callback.change_template = function twinkleblockcallbackChangeTemplate(e) {
	var form = e.target.form, value = form.template.value, settings = Twinkle.block.blockPresetsInfo[value];

	var blockBox = $(form).find('[name=actiontype][value=block]').is(':checked');
	var partialBox = $(form).find('[name=actiontype][value=partial]').is(':checked');
	var templateBox = $(form).find('[name=actiontype][value=template]').is(':checked');

	// Block form is not present
	if (!blockBox) {
		if (settings.indefinite || settings.nonstandard) {
			if (Twinkle.block.prev_template_expiry === null) {
				Twinkle.block.prev_template_expiry = form.template_expiry.value || '';
			}
			form.template_expiry.parentNode.style.display = 'none';
			form.template_expiry.value = 'infinity';
		} else if (form.template_expiry.parentNode.style.display === 'none') {
			if (Twinkle.block.prev_template_expiry !== null) {
				form.template_expiry.value = Twinkle.block.prev_template_expiry;
				Twinkle.block.prev_template_expiry = null;
			}
			form.template_expiry.parentNode.style.display = 'block';
		}
		if (Twinkle.block.prev_template_expiry) {
			form.expiry.value = Twinkle.block.prev_template_expiry;
		}
		Morebits.quickForm.setElementVisibility(form.notalk.parentNode, !settings.nonstandard);
		// Partial
		Morebits.quickForm.setElementVisibility(form.noemail_template.parentNode, partialBox);
		Morebits.quickForm.setElementVisibility(form.nocreate_template.parentNode, partialBox);
	} else if (templateBox) { // Only present if block && template forms both visible
		Morebits.quickForm.setElementVisibility(
			form.blank_duration.parentNode,
			!settings.indefinite && !settings.nonstandard
		);
	}

	// Only particularly relevant if template form is present
	Morebits.quickForm.setElementVisibility(form.article.parentNode, settings && !!settings.pageParam);
	Morebits.quickForm.setElementVisibility(form.block_reason.parentNode, settings && !!settings.reasonParam);

	// Partial block
	Morebits.quickForm.setElementVisibility(form.area.parentNode, partialBox && !blockBox);

	form.root.previewer.closePreview();
};
Twinkle.block.prev_template_expiry = null;

Twinkle.block.callback.preview = function twinkleblockcallbackPreview(form) {
	var params = {
		article: form.article.value,
		blank_duration: form.blank_duration ? form.blank_duration.checked : false,
		disabletalk: form.disabletalk.checked || (form.notalk ? form.notalk.checked : false),
		expiry: form.template_expiry ? form.template_expiry.value : form.expiry.value,
		hardblock: Twinkle.block.isRegistered ? form.autoblock.checked : form.hardblock.checked,
		indefinite: Morebits.string.isInfinity(form.template_expiry ? form.template_expiry.value : form.expiry.value),
		reason: form.block_reason.value,
		template: form.template.value,
		partial: $(form).find('[name=actiontype][value=partial]').is(':checked'),
		pagerestrictions: $(form.pagerestrictions).val() || [],
		namespacerestrictions: $(form.namespacerestrictions).val() || [],
		noemail: form.noemail.checked || (form.noemail_template ? form.noemail_template.checked : false),
		nocreate: form.nocreate.checked || (form.nocreate_template ? form.nocreate_template.checked : false),
		area: form.area.value
	};

	var templateText = Twinkle.block.callback.getBlockNoticeWikitext(params);

	form.previewer.beginRender(templateText, 'Overleg_gebruiker:' + relevantUserName); // Force wikitext/correct username
};

Twinkle.block.callback.evaluate = function twinkleblockCallbackEvaluate(e) {
	var $form = $(e.target),
		toBlock = $form.find('[name=actiontype][value=block]').is(':checked'),
		toWarn = $form.find('[name=actiontype][value=template]').is(':checked'),
		toPartial = $form.find('[name=actiontype][value=partial]').is(':checked'),
		blockoptions = {}, templateoptions = {};

	Twinkle.block.callback.saveFieldset($form.find('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_template_options]'));

	blockoptions = Twinkle.block.field_block_options;

	templateoptions = Twinkle.block.field_template_options;

	templateoptions.disabletalk = !!(templateoptions.disabletalk || blockoptions.disabletalk);
	templateoptions.hardblock = !!blockoptions.hardblock;

	delete blockoptions.expiry_preset; // remove extraneous

	// Partial API requires this to be gone, not false or 0
	if (toPartial) {
		blockoptions.partial = templateoptions.partial = true;
	}
	templateoptions.pagerestrictions = $form.find('[name=pagerestrictions]').val() || [];
	templateoptions.namespacerestrictions = $form.find('[name=namespacerestrictions]').val() || [];
	// Format for API here rather than in saveFieldset
	blockoptions.pagerestrictions = templateoptions.pagerestrictions.join('|');
	blockoptions.namespacerestrictions = templateoptions.namespacerestrictions.join('|');

	// use block settings as warn options where not supplied
	templateoptions.summary = templateoptions.summary || blockoptions.reason;
	templateoptions.expiry = templateoptions.template_expiry || blockoptions.expiry;

	if (toBlock) {
		if (blockoptions.partial) {
			if (blockoptions.disabletalk && blockoptions.namespacerestrictions.indexOf('3') === -1) {
				return alert('Deelblokkades kunnen de overlegpagina niet blokkeren, tenzij de \'Overleg gebruiker\' naamruimte ook geblokkeerd wordt!');
			}
			if (!blockoptions.namespacerestrictions && !blockoptions.pagerestrictions) {
				if (!blockoptions.noemail && !blockoptions.nocreate) { // Blank entries technically allowed [[phab:T208645]]
					return alert('Geen pagina\'s of naamruimtes zijn geselecteerd, noch is e-mail of account aanmaken geselecteerd. Selecteer tenminste iets om te blokkeren!');
				}
			}
		}
		if (!blockoptions.expiry) {
			return alert('Geef een blokkadeduur!');
		} else if (Morebits.string.isInfinity(blockoptions.expiry) && !Twinkle.block.isRegistered) {
			return alert("Een IP-adres kan niet voor onbepaalde tijd geblokkeerd worden!");
		}
		if (!blockoptions.reason) {
			return alert('Geef een rede voor de blokkade!');
		}

		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		var statusElement = new Morebits.status('Blokkade uitvoeren');
		blockoptions.action = 'block';

		blockoptions.user = relevantUserName;

		// boolean-flipped options
		blockoptions.anononly = blockoptions.hardblock ? undefined : true;
		blockoptions.allowusertalk = blockoptions.disabletalk ? undefined : true;

		/*
		  Check if block status changed while processing the form.

		  There's a lot to consider here. list=blocks provides the
		  current block status, but there are at least two issues with
		  relying on it. First, the id doesn't update on a reblock,
		  meaning the individual parameters need to be compared. This
		  can be done roughly with JSON.stringify - we can thankfully
		  rely on order from the server, although sorting would be
		  fine if not - but falsey values are problematic and is
		  non-ideal. More importantly, list=blocks won't indicate if a
		  non-blocked user is blocked then unblocked. This should be
		  exceedingy rare, but regardless, we thus need to check
		  list=logevents, which has a nicely updating logid
		  parameter. We can't rely just on that, though, since it
		  doesn't account for blocks that have expired on their own.

		  As such, we use both. Using some ternaries, the logid
		  variables are false if there's no logevents, so if they
		  aren't equal we defintely have a changed entry (send
		  confirmation). If they are equal, then either the user was
		  never blocked (the block statuses will be equal, no
		  confirmation) or there's no new block, in which case either
		  a block expired (different statuses, confirmation) or the
		  same block is still active (same status, no confirmation).
		*/
		var query = {
			format: 'json',
			action: 'query',
			list: 'blocks|logevents',
			letype: 'block',
			lelimit: 1,
			letitle: 'User:' + blockoptions.user
		};
		// bkusers doesn't catch single IPs blocked as part of a range block
		if (mw.util.isIPAddress(blockoptions.user, true)) {
			query.bkip = blockoptions.user;
		} else {
			query.bkusers = blockoptions.user;
		}
		api.get(query).then(function(data) {
			var block = data.query.blocks[0];
			// As with the initial data fetch, if an IP is blocked
			// *and* rangeblocked, this would only grab whichever
			// block is more recent, which would likely mean a
			// mismatch.  However, if the rangeblock is updated
			// while filling out the form, this won't detect that,
			// but that's probably fine.
			if (data.query.blocks.length > 1 && block.user !== relevantUserName) {
				block = data.query.blocks[1];
			}
			var logevents = data.query.logevents[0];
			var logid = data.query.logevents.length ? logevents.logid : false;

			if (logid !== Twinkle.block.blockLogId || !!block !== !!Twinkle.block.currentBlockInfo) {
				var message = 'De blokkade van ' + blockoptions.user + ' is aangepast. ';
				if (block) {
					message += 'Nieuwe blok: ';
				} else {
					message += 'Vorige blok: ';
				}

				var logExpiry = '';
				if (logevents.params.duration) {
					if (logevents.params.duration === 'infinity') {
						logExpiry = 'indefinitely';
					} else {
						var expiryDate = new Morebits.date(logevents.params.expiry);
						logExpiry += (expiryDate.isBefore(new Date()) ? ', verlopen ' : ' tot ') + expiryDate.calendar();
					}
				} else { // no duration, action=unblock, just show timestamp
					logExpiry = ' ' + new Morebits.date(logevents.timestamp).calendar();
				}
				message += Morebits.string.toUpperCaseFirstChar(logevents.action) + 'ed door ' + logevents.user + logExpiry +
					' voor "' + logevents.comment + '". Wil je dit omzetten naar jouw blokinstellingen?';

				if (!confirm(message)) {
					Morebits.status.info('Blokkade uitvoeren', 'Afgebroken door gebruiker');
					return;
				}
				blockoptions.reblock = 1; // Writing over a block will fail otherwise
			}

			// execute block
			blockoptions.tags = Twinkle.changeTags;
			blockoptions.token = mw.user.tokens.get('csrfToken');
			var mbApi = new Morebits.wiki.api('Blokkade uitvoeren', blockoptions, function() {
				statusElement.info('done');
				if (toWarn) {
					Twinkle.block.callback.issue_template(templateoptions);
				}
			});
			mbApi.post();
		});
	} else if (toWarn) {
		Morebits.simpleWindow.setButtonsEnabled(false);

		Morebits.status.init(e.target);
		Twinkle.block.callback.issue_template(templateoptions);
	} else {
		return alert('Geef Twinkle iets te doen!');
	}
};

Twinkle.block.callback.issue_template = function twinkleblockCallbackIssueTemplate(formData) {
	// Use wgRelevantUserName to ensure the block template goes to a single IP and not to the
	// "talk page" of an IP range (which does not exist)
	var userTalkPage = 'Overleg_gebruiker:' + mw.config.get('wgRelevantUserName');

	var params = $.extend(formData, {
		messageData: Twinkle.block.blockPresetsInfo[formData.template],
		reason: Twinkle.block.field_template_options.block_reason,
		disabletalk: Twinkle.block.field_template_options.notalk,
		noemail: Twinkle.block.field_template_options.noemail_template,
		nocreate: Twinkle.block.field_template_options.nocreate_template
	});

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Handelingen voltooid, overlegpagina wordt geladen...';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'Overlegpagina bewerken');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.block.callback.main);
};

Twinkle.block.callback.getBlockNoticeWikitext = function(params) {
	var text = '\n{{', settings = Twinkle.block.blockPresetsInfo[params.template];
	if (!settings.nonstandard) {
		text += params.template;
		if (params.article && settings.pageParam) {
			text += '|pagina=' + params.article;
		}
		if (params.dstopic) {
			text += '|onderwerp=' + params.dstopic;
		}

		if (!/te?mp|^\s*$|min/.exec(params.expiry)) {
			if (params.indefinite) {
				text += '|ot=true';
			} else if (!params.blank_duration && !new Morebits.date(params.expiry).isValid()) {
				// Block template wants a duration, not date
				text += '|duur=' + params.expiry;
			}
		}

		if (!Twinkle.block.isRegistered && !params.hardblock) {
			text += '|ip=true';
		}

		if (params.reason) {
			text += '|reden=' + params.reason;
		}
		if (params.disabletalk) {
			text += '|overlegblok=true';
		}

		// Currently, all partial block templates are "standard"
		// Building the template, however, takes a fair bit of logic
		if (params.partial) {
			if (params.pagerestrictions.length || params.namespacerestrictions.length) {
				var makeSentence = function (array) {
					if (array.length < 3) {
						return array.join(' en ');
					}
					var last = array.pop();
					return array.join(', ') + ', en ' + last;

				};
				text += '|gebied=' + (params.indefinite ? 'bepaalde ' : 'van bepaalde ');
				if (params.pagerestrictions.length) {
					text += 'pagina\'s (' + makeSentence(params.pagerestrictions.map(function(p) {
						return '[[:' + p + ']]';
					}));
					text += params.namespacerestrictions.length ? ') en bepaalde ' : ')';
				}
				if (params.namespacerestrictions.length) {
					// 1 => Talk, 2 => User, etc.
					var namespaceNames = params.namespacerestrictions.map(function(id) {
						return menuFormattedNamespaces[id];
					});
					text += '[[Help:Naamruimte|naamruimes]] (' + makeSentence(namespaceNames) + ')';
				}
			} else if (params.area) {
				text += '|gebied=' + params.area;
			} else {
				if (params.noemail) {
					text += '|email=ja';
				}
				if (params.nocreate) {
					text += '|accountaanmaak=ja';
				}
			}
		}
	} else {
		text += params.template;
	}

	text += '}}';

	if (settings.sig) {
		text += ' ' + settings.sig;
	}

	return text;
};

Twinkle.block.callback.main = function twinkleblockcallbackMain(pageobj) {
	var params = pageobj.getCallbackParameters(),
		date = new Morebits.date(pageobj.getLoadTime()),
		messageData = params.messageData,
		text;

	params.indefinite = Morebits.string.isInfinity(params.expiry);

	if (Twinkle.getPref('blankTalkpageOnIndefBlock') && params.indefinite) {
		Morebits.status.info('Info', 'Per Twinkle voorkeuren: overlegpagina leeghalen en nieuwe sectie aanmaken voor deze maand');
		text = date.monthHeader() + '\n';
	} else {
		text = pageobj.getPageText();

		var dateHeaderRegex = date.monthHeaderRegex(), dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec(text)) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf('\n==') + 1;

		if (text.length > 0) {
			text += '\n\n';
		}

		if (!dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex) {
			Morebits.status.info('Info', 'Nieuwe sectie op overlegpagina aanmaken voor deze maand');
			text += date.monthHeader() + '\n';
		}
	}

	params.expiry = typeof params.template_expiry !== 'undefined' ? params.template_expiry : params.expiry;

	text += Twinkle.block.callback.getBlockNoticeWikitext(params);

	// build the edit summary
	var summary = messageData.summary;
	if (messageData.suppressArticleInSummary !== true && params.article) {
		summary += ' op [[:' + params.article + ']]';
	}
	summary += '.';

	pageobj.setPageText(text);
	pageobj.setEditSummary(summary);
	pageobj.setChangeTags(Twinkle.changeTags);
	pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));
	pageobj.save();
};

Twinkle.addInitCallback(Twinkle.block, 'block');
})(jQuery);


// </nowiki>
