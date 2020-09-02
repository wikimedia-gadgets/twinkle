// <nowiki>


(function($) {

var api = new mw.Api(), relevantUserName;
var menuFormattedNamespaces = $.extend({}, mw.config.get('wgFormattedNamespaces'));
menuFormattedNamespaces[0] = '(Article)';

/*
 ****************************************
 *** twinkleblock.js: Block module
 ****************************************
 * Mode of invocation:     Tab ("Block")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.block = function twinkleblock() {
	// should show on Contributions or Block pages, anywhere there's a relevant user
	if (Morebits.userIsSysop && mw.config.get('wgRelevantUserName')) {
		Twinkle.addPortletLink(Twinkle.block.callback, 'Block', 'tw-block', 'Block relevant user');
	}
};

Twinkle.block.callback = function twinkleblockCallback() {
	if (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
			!confirm('You are about to block yourself! Are you sure you want to proceed?')) {
		return;
	}

	Twinkle.block.currentBlockInfo = undefined;
	Twinkle.block.field_block_options = {};
	Twinkle.block.field_template_options = {};

	var Window = new Morebits.simpleWindow(650, 530);
	// need to be verbose about who we're blocking
	Window.setTitle('Block or issue block template to ' + mw.config.get('wgRelevantUserName'));
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Block templates', 'Template:Uw-block/doc/Block_templates');
	Window.addFooterLink('Block policy', 'WP:BLOCK');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#block');

	var form = new Morebits.quickForm(Twinkle.block.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: 'Type of action'
	});
	actionfield.append({
		type: 'checkbox',
		name: 'actiontype',
		event: Twinkle.block.callback.change_action,
		list: [
			{
				label: 'Block user',
				value: 'block',
				tooltip: 'Block the relevant user with the given options. If partial block is unchecked, this will be a sitewide block.',
				checked: true
			},
			{
				label: 'Partial block',
				value: 'partial',
				tooltip: 'Enable partial blocks and partial block templates.',
				checked: Twinkle.getPref('defaultToPartialBlocks')
			},
			{
				label: 'Add block template to user talk page',
				value: 'template',
				tooltip: 'If the blocking admin forgot to issue a block template, or you have just blocked the user without templating them, you can use this to issue the appropriate template. Check the partial block box for partial block templates.',
				checked: true
			}
		]
	});

	form.append({ type: 'field', label: 'Preset', name: 'field_preset' });
	form.append({ type: 'field', label: 'Template options', name: 'field_template_options' });
	form.append({ type: 'field', label: 'Block options', name: 'field_block_options' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.root = result;

	Twinkle.block.fetchUserInfo(function() {
		// clean up preset data (defaults, etc.), done exactly once, must be before Twinkle.block.callback.change_action is called
		Twinkle.block.transformBlockPresets();
		if (Twinkle.block.currentBlockInfo) {
			Window.addFooterLink('Unblock this user', 'Special:Unblock/' + mw.config.get('wgRelevantUserName'), true);
		}

		// init the controls after user and block info have been fetched
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.actiontype[0].dispatchEvent(evt);
	});
};

Twinkle.block.fetchUserInfo = function twinkleblockFetchUserInfo(fn) {
	api.get({
		format: 'json',
		action: 'query',
		list: 'blocks|users|logevents',
		letype: 'block',
		lelimit: 1,
		bkusers: mw.config.get('wgRelevantUserName'),
		ususers: mw.config.get('wgRelevantUserName'),
		usprop: 'groupmemberships',
		letitle: 'User:' + mw.config.get('wgRelevantUserName')
	})
		.then(function(data) {
			var blockinfo = data.query.blocks[0],
				userinfo = data.query.users[0];

			Twinkle.block.isRegistered = !!userinfo.userid;
			if (Twinkle.block.isRegistered) {
				relevantUserName = 'User:' + mw.config.get('wgRelevantUserName');
				Twinkle.block.userIsBot = !!userinfo.groupmemberships && userinfo.groupmemberships.map(function(e) {
					return e.group;
				}).indexOf('bot') !== -1;
			} else {
				relevantUserName = mw.config.get('wgRelevantUserName');
				Twinkle.block.userIsBot = false;
			}

			if (blockinfo) {
			// handle frustrating system of inverted boolean values
				blockinfo.disabletalk = blockinfo.allowusertalk === undefined;
				blockinfo.hardblock = blockinfo.anononly === undefined;
				Twinkle.block.currentBlockInfo = blockinfo;
			}

			Twinkle.block.hasBlockLog = !!data.query.logevents.length;
			// Used later to check if block status changed while filling out the form
			Twinkle.block.blockLogId = Twinkle.block.hasBlockLog ? data.query.logevents[0].logid : false;

			if (typeof fn === 'function') {
				return fn();
			}
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

Twinkle.block.callback.change_action = function twinkleblockCallbackChangeAction(e) {
	var field_preset, field_template_options, field_block_options, $form = $(e.target.form);
	// Make ifs shorter
	var blockBox = $form.find('[name=actiontype][value=block]').is(':checked');
	var templateBox = $form.find('[name=actiontype][value=template]').is(':checked');
	var partial = $form.find('[name=actiontype][value=partial]');
	var partialBox = partial.is(':checked');
	var blockGroup = partialBox ? Twinkle.block.blockGroupsPartial : Twinkle.block.blockGroups;

	partial.prop('disabled', !blockBox && !templateBox);

	Twinkle.block.callback.saveFieldset($('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_template_options]'));

	if (blockBox) {
		field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Preset', name: 'field_preset' });
		field_preset.append({
			type: 'select',
			name: 'preset',
			label: 'Choose a preset:',
			event: Twinkle.block.callback.change_preset,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup)
		});

		field_block_options = new Morebits.quickForm.element({ type: 'field', label: 'Block options', name: 'field_block_options' });
		field_block_options.append({ type: 'div', name: 'hasblocklog', label: ' ' });
		field_block_options.append({ type: 'div', name: 'currentblock', label: ' ' });
		field_block_options.append({
			type: 'select',
			name: 'expiry_preset',
			label: 'Expiry:',
			event: Twinkle.block.callback.change_expiry,
			list: [
				{ label: 'custom', value: 'custom', selected: true },
				{ label: 'indefinite', value: 'infinity' },
				{ label: '3 hours', value: '3 hours' },
				{ label: '12 hours', value: '12 hours' },
				{ label: '24 hours', value: '24 hours' },
				{ label: '31 hours', value: '31 hours' },
				{ label: '36 hours', value: '36 hours' },
				{ label: '48 hours', value: '48 hours' },
				{ label: '60 hours', value: '60 hours' },
				{ label: '72 hours', value: '72 hours' },
				{ label: '1 week', value: '1 week' },
				{ label: '2 weeks', value: '2 weeks' },
				{ label: '1 month', value: '1 month' },
				{ label: '3 months', value: '3 months' },
				{ label: '6 months', value: '6 months' },
				{ label: '1 year', value: '1 year' },
				{ label: '2 years', value: '2 years' },
				{ label: '3 years', value: '3 years' }
			]
		});
		field_block_options.append({
			type: 'input',
			name: 'expiry',
			label: 'Custom expiry',
			tooltip: 'You can use relative times, like "1 minute" or "19 days", or absolute timestamps, "yyyymmddhhmm" (e.g. "200602011405" is Feb 1, 2006, at 14:05 UTC).',
			value: Twinkle.block.field_block_options.expiry || Twinkle.block.field_template_options.template_expiry
		});

		if (partialBox) { // Partial block
			field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'pagerestrictions',
				label: 'Specific pages to block from editing',
				value: '',
				tooltip: '10 page max.'
			});
			var ns = field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'namespacerestrictions',
				label: 'Namespace blocks',
				value: '',
				tooltip: 'Block from editing these namespaces.'
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
				label: 'Block account creation',
				name: 'nocreate',
				value: '1'
			},
			{
				checked: Twinkle.block.field_block_options.noemail,
				label: 'Block user from sending email',
				name: 'noemail',
				value: '1'
			},
			{
				checked: Twinkle.block.field_block_options.disabletalk,
				label: 'Prevent this user from editing their own talk page while blocked',
				name: 'disabletalk',
				value: '1',
				tooltip: partialBox ? 'If issuing a partial block, this MUST remain unchecked unless you are also preventing them from editing User talk space' : ''
			}
		];

		if (Twinkle.block.isRegistered) {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.autoblock,
				label: 'Autoblock any IP addresses used (hardblock)',
				name: 'autoblock',
				value: '1'
			});
		} else {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.hardblock,
				label: 'Block logged-in users from using this IP address (hardblock)',
				name: 'hardblock',
				value: '1'
			});
		}

		blockoptions.push({
			checked: Twinkle.block.field_block_options.watchuser,
			label: 'Watch user and user talk pages',
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
			label: 'Reason (for block log):',
			name: 'reason',
			tooltip: 'Consider adding helpful details to the default message.',
			value: Twinkle.block.field_block_options.reason
		});

		field_block_options.append({
			type: 'div',
			name: 'filerlog_label',
			label: 'See also:',
			style: 'display:inline-block;font-style:normal !important',
			tooltip: 'Insert a "see also" message to indicate whether the filter log or deleted contributions played a role in the decision to block.'
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
					label: 'Deleted contribs',
					checked: false,
					value: 'deleted contribs'
				}
			]
		});

		if (Twinkle.block.currentBlockInfo) {
			field_block_options.append({ type: 'hidden', name: 'reblock', value: '1' });
		}
	}

	if (templateBox) {
		field_template_options = new Morebits.quickForm.element({ type: 'field', label: 'Template options', name: 'field_template_options' });
		field_template_options.append({
			type: 'select',
			name: 'template',
			label: 'Choose talk page template:',
			event: Twinkle.block.callback.change_template,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup, true),
			value: Twinkle.block.field_template_options.template
		});
		field_template_options.append({
			type: 'input',
			name: 'article',
			display: 'none',
			label: 'Linked page',
			value: '',
			tooltip: 'A page can be linked within the notice, perhaps if it was the primary target of disruption. Leave empty for no page to be linked.'
		});

		// Only visible if partial and not blocking
		field_template_options.append({
			type: 'input',
			name: 'area',
			display: 'none',
			label: 'Area blocked from',
			value: '',
			tooltip: 'Optional explanation of the pages or namespaces the user was blocked from editing.'
		});

		if (!blockBox) {
			field_template_options.append({
				type: 'input',
				name: 'template_expiry',
				display: 'none',
				label: 'Period of blocking: ',
				value: '',
				tooltip: 'The period the blocking is due for, for example 24 hours, 2 weeks, indefinite etc...'
			});
		}
		field_template_options.append({
			type: 'input',
			name: 'block_reason',
			label: '"You have been blocked for ..." ',
			display: 'none',
			tooltip: 'An optional reason, to replace the default generic reason. Only available for the generic block templates.',
			value: Twinkle.block.field_template_options.block_reason
		});

		if (blockBox) {
			field_template_options.append({
				type: 'checkbox',
				name: 'blank_duration',
				list: [
					{
						label: 'Do not include expiry in template',
						checked: Twinkle.block.field_template_options.blank_duration,
						tooltip: 'Instead of including the duration, make the block template read "You have been blocked temporarily..."'
					}
				]
			});
		} else {
			field_template_options.append({
				type: 'checkbox',
				list: [
					{
						label: 'Talk page access disabled',
						name: 'notalk',
						checked: Twinkle.block.field_template_options.notalk,
						tooltip: 'Make the block template state that the user\'s talk page access has been removed'
					},
					{
						label: 'User blocked from sending email',
						name: 'noemail_template',
						checked: Twinkle.block.field_template_options.noemail_template,
						tooltip: 'If the area is not provided, make the block template state that the user\'s email access has been removed'
					},
					{
						label: 'User blocked from creating accounts',
						name: 'nocreate_template',
						checked: Twinkle.block.field_template_options.nocreate_template,
						tooltip: 'If the area is not provided, make the block template state that the user\'s ability to create accounts has been removed'
					}
				]
			});
		}

		var $previewlink = $('<a id="twinkleblock-preivew-link">Preview</a>');
		$previewlink.off('click').on('click', function() {
			Twinkle.block.callback.preview($form[0]);
		});
		$previewlink.css({cursor: 'pointer'});
		field_template_options.append({ type: 'div', id: 'blockpreview', label: [ $previewlink[0] ] });
		field_template_options.append({ type: 'div', id: 'twinkleblock-previewbox', style: 'display: none' });
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


		$form.find('[name=pagerestrictions]').select2({
			width: '100%',
			placeholder: 'Select pages to block user from',
			language: {
				errorLoading: function() {
					return 'Incomplete or invalid search term';
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
						'action': 'query',
						'format': 'json',
						'list': 'allpages',
						'apfrom': title.title,
						'apnamespace': title.namespace,
						'aplimit': '10'
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
			placeholder: 'Select namespaces to block user from'
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

	if (Twinkle.block.hasBlockLog) {
		var $blockloglink = $('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgRelevantUserName'), type: 'block'}) + '">block log</a>)');

		Morebits.status.init($('div[name="hasblocklog"] span').last()[0]);
		Morebits.status.warn('This user has been blocked in the past', $blockloglink[0]);
	}

	if (Twinkle.block.currentBlockInfo) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		// list=blocks without bkprops (as we do in fetchUerInfo)
		// returns partial: '' if the user is partially blocked
		var statusStr = relevantUserName + ' is ' + (Twinkle.block.currentBlockInfo.partial === '' ? 'partially blocked' : 'blocked sitewide');
		if (Twinkle.block.currentBlockInfo.expiry === 'infinity') {
			statusStr += ' (indef)';
		} else if (new Morebits.date(Twinkle.block.currentBlockInfo.expiry).isValid()) {
			statusStr += ' (expires ' + new Morebits.date(Twinkle.block.currentBlockInfo.expiry).calendar('utc') + ')';
		}
		var infoStr = 'Submit query to change the block';
		if (Twinkle.block.currentBlockInfo.partial === undefined && partialBox) {
			infoStr += ', converting to a partial block';
		} else if (Twinkle.block.currentBlockInfo.partial === '' && !partialBox) {
			infoStr += ', converting to a sitewide block';
		}
		Morebits.status.warn(statusStr, infoStr);
		Twinkle.block.callback.update_form(e, Twinkle.block.currentBlockInfo);
	}
	if (templateBox) {
		// make sure all the fields are correct based on defaults
		if (blockBox) {
			Twinkle.block.callback.change_preset(e);
		} else {
			Twinkle.block.callback.change_template(e);
		}
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
	'anonblock': {
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}}',
		sig: '~~~~'
	},
	'anonblock - school': {
		expiry: '36 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}} <!-- Likely a school based on behavioral evidence -->',
		templateName: 'anonblock',
		sig: '~~~~'
	},
	'blocked proxy': {
		expiry: '1 year',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		hardblock: true,
		reason: '{{blocked proxy}}',
		sig: null
	},
	'CheckUser block': {
		expiry: '1 week',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{CheckUser block}}',
		sig: '~~~~'
	},
	'checkuserblock-account': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{checkuserblock-account}}',
		sig: '~~~~'
	},
	'checkuserblock-wide': {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{checkuserblock-wide}}',
		sig: '~~~~'
	},
	'colocationwebhost': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{colocationwebhost}}',
		sig: null
	},
	'oversightblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		nonstandard: true,
		reason: '{{OversightBlock}}',
		sig: '~~~~'
	},
	'school block': {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{school block}}',
		sig: '~~~~'
	},
	'spamblacklistblock': {
		forAnonOnly: true,
		expiry: '1 month',
		disabletalk: true,
		nocreate: true,
		reason: '{{spamblacklistblock}} <!-- editor only attempts to add blacklisted links, see [[Special:Log/spamblacklist]] -->'
	},
	// Placeholder for when we add support for rangeblocks
	// 'rangeblock' : {
	//   reason: '{{rangeblock}}',
	//   nocreate: true,
	//   nonstandard: true,
	//   forAnonOnly: true,
	//   sig: '~~~~'
	// },
	'tor': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{Tor}}',
		sig: null
	},
	'webhostblock': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{webhostblock}}',
		sig: null
	},
	// uw-prefixed
	'uw-3block': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Violation of the [[WP:Three-revert rule|three-revert rule]]',
		summary: 'You have been blocked from editing for violation of the [[WP:3RR|three-revert rule]]'
	},
	'uw-ablock': {
		autoblock: true,
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Your IP address has been blocked from editing',
		suppressArticleInSummary: true
	},
	'uw-adblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Using Wikipedia for [[WP:Spam|spam]] or [[WP:NOTADVERTISING|advertising]] purposes',
		summary: 'You have been blocked from editing for [[WP:SOAP|advertising or self-promotion]]'
	},
	'uw-aeblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Arbitration enforcement|Arbitration enforcement]]',
		reasonParam: true,
		summary: 'You have been blocked from editing for violating an [[WP:Arbitration|arbitration decision]]'
	},
	'uw-bioblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Violations of the [[WP:Biographies of living persons|biographies of living persons]] policy',
		summary: 'You have been blocked from editing for violations of Wikipedia\'s [[WP:BLP|biographies of living persons policy]]'
	},
	'uw-block': {
		autoblock: true,
		expiry: '24 hours',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'You have been blocked from editing',
		suppressArticleInSummary: true
	},
	'uw-blockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing',
		suppressArticleInSummary: true
	},
	'uw-blocknotalk': {
		disabletalk: true,
		pageParam: true,
		reasonParam: true,
		summary: 'You have been blocked from editing and your user talk page access has been disabled',
		suppressArticleInSummary: true
	},
	'uw-botblock': {
		forRegisteredOnly: true,
		pageParam: true,
		reason: 'Running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]',
		summary: 'You have been blocked from editing because it appears you are running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]'
	},
	'uw-botublock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-botublock}} <!-- Username implies a bot, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this is a [[WP:BOT|bot]] account, which is currently not approved'
	},
	'uw-botuhblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-botuhblock}} <!-- Username implies a bot, hard block -->',
		summary: 'You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]].'
	},
	'uw-causeblock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-causeblock}} <!-- Username represents a non-profit, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website'
	},
	'uw-compblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Compromised account',
		summary: 'You have been indefinitely blocked from editing because it is believed that your [[WP:SECURE|account has been compromised]]'
	},
	'uw-copyrightblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Copyright violations|Copyright violations]]',
		summary: 'You have been blocked from editing for continued [[WP:COPYVIO|copyright infringement]]'
	},
	'uw-dblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Persistent removal of content',
		pageParam: true,
		summary: 'You have been blocked from editing for continued [[WP:VAND|removal of material]]'
	},
	'uw-disruptblock': {
		autoblock: true,
		nocreate: true,
		reason: '[[WP:Disruptive editing|Disruptive editing]]',
		summary: 'You have been blocked from editing for [[WP:DE|disruptive editing]]'
	},
	'uw-efblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Deliberately triggering the [[WP:Edit filter|Edit filter]]',
		summary: 'You have been blocked from editing for making disruptive edits that repeatedly triggered the [[WP:EF|edit filter]]'
	},
	'uw-ewblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Edit warring|Edit warring]]',
		summary: 'You have been blocked from editing to prevent further [[WP:DE|disruption]] caused by your engagement in an [[WP:EW|edit war]]'
	},
	'uw-hblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:No personal attacks|Personal attacks]] or [[WP:Harassment|harassment]]',
		summary: 'You have been blocked from editing for attempting to [[WP:HARASS|harass]] other users'
	},
	'uw-ipevadeblock': {
		forAnonOnly: true,
		nocreate: true,
		reason: '[[WP:Blocking policy#Evasion of blocks|Block evasion]]',
		summary: 'Your IP address has been blocked from editing because it has been used to [[WP:EVADE|evade a previous block]]'
	},
	'uw-lblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Making [[WP:No legal threats|legal threats]]',
		summary: 'You have been blocked from editing for making [[WP:NLT|legal threats or taking legal action]]'
	},
	'uw-nothereblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Clearly [[WP:NOTHERE|not here to build an encyclopedia]]',
		forRegisteredOnly: true,
		summary: 'You have been indefinitely blocked from editing because it appears that you are not here to [[WP:NOTHERE|build an encyclopedia]]'
	},
	'uw-npblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Creating [[WP:Patent nonsense|patent nonsense]] or other inappropriate pages',
		summary: 'You have been blocked from editing for creating [[WP:PN|nonsense pages]]'
	},
	'uw-pablock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		reason: '[[WP:No personal attacks|Personal attacks]] or [[WP:Harassment|harassment]]',
		summary: 'You have been blocked from editing for making [[WP:NPA|personal attacks]] toward other users'
	},
	'uw-sblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Using Wikipedia for [[WP:SPAM|spam]] purposes',
		summary: 'You have been blocked from editing for using Wikipedia for [[WP:SPAM|spam]] purposes'
	},
	'uw-soablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Spam|Spam]] / [[WP:NOTADVERTISING|advertising]]-only account',
		summary: 'You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam, advertising, or promotion]]'
	},
	'uw-socialmediablock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Using Wikipedia as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]',
		summary: 'You have been blocked from editing for using user and/or article pages as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]'
	},
	'uw-sockblock': {
		autoblock: true,
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Abusing [[WP:Sock puppetry|multiple accounts]]',
		summary: 'You have been blocked from editing for abusing [[WP:SOCK|multiple accounts]]'
	},
	'uw-softerblock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-softerblock}} <!-- Promotional username, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website'
	},
	'uw-spamublock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-spamublock}} <!-- Promotional username, promotional edits -->',
		summary: 'You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam or advertising]] and your username is a violation of the [[WP:U|username policy]]'
	},
	'uw-spoablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '[[WP:SOCK|Sock puppetry]]',
		summary: 'This account has been blocked as a [[WP:SOCK|sock puppet]] created to violate Wikipedia policy'
	},
	'uw-talkrevoked': {
		disabletalk: true,
		reason: 'Revoking talk page access: inappropriate use of user talk page while blocked',
		prependReason: true,
		summary: 'Your user talk page access has been disabled',
		useInitialOptions: true
	},
	'uw-ublock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-ublock}} <!-- Username violation, soft block -->',
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing because your username is a violation of the [[WP:U|username policy]]'
	},
	'uw-ublock-double': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-ublock-double}} <!-- Username closely resembles another user, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] is too similar to the username of another Wikipedia user'
	},
	'uw-ucblock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Persistent addition of [[WP:INTREF|unsourced content]]',
		summary: 'You have been blocked from editing for persistent addition of [[WP:INTREF|unsourced content]]'
	},
	'uw-uhblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-uhblock}} <!-- Username violation, hard block -->',
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]]'
	},
	'uw-ublock-wellknown': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-ublock-wellknown}} <!-- Username represents a well-known person, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] matches the name of a well-known living individual'
	},
	'uw-uhblock-double': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-ublock-double}} <!-- Username closely resembles another user, hard block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] appears to impersonate another established Wikipedia user'
	},
	'uw-upeblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:PAID|Undisclosed paid editing]] in violation of the WMF [[WP:TOU|Terms of Use]]',
		summary: 'You have been indefinitely blocked from editing because your account is being used in violation of [[WP:PAID|Wikipedia policy on undisclosed paid advocacy]]'
	},
	'uw-vaublock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '{{uw-vaublock}} <!-- Username violation, vandalism-only account -->',
		summary: 'You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]] and your username is a blatant violation of the [[WP:U|username policy]]'
	},
	'uw-vblock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Vandalism|Vandalism]]',
		summary: 'You have been blocked from editing to prevent further [[WP:VAND|vandalism]]'
	},
	'uw-voablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Vandalism-only account|Vandalism-only account]]',
		summary: 'You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]]'
	},
	'zombie proxy': {
		expiry: '1 month',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{zombie proxy}}',
		sig: null
	},

	// Begin partial block templates, accessed in Twinkle.block.blockGroupsPartial
	'uw-acpblock': {
		autoblock: true,
		expiry: '48 hours',
		nocreate: true,
		pageParam: false,
		reasonParam: true,
		reason: 'Misusing [[WP:Sock puppetry|multiple accounts]]',
		summary: 'You have been [[WP:PB|blocked]] from creating accounts for misusing [[WP:SOCK|multiple accounts]]'
	},
	'uw-acpblockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: false,
		reasonParam: true,
		reason: 'Misusing [[WP:Sock puppetry|multiple accounts]]',
		summary: 'You have been indefinitely [[WP:PB|blocked]] from creating accounts for misusing [[WP:SOCK|multiple accounts]]'
	},
	'uw-aepblock': {
		autoblock: true,
		nocreate: false,
		pageParam: false,
		reason: '[[WP:Arbitration enforcement|Arbitration enforcement]]',
		reasonParam: true,
		summary: 'You have been [[WP:PB|blocked]] from editing for violating an [[WP:Arbitration|arbitration decision]]'
	},
	'uw-epblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: false,
		noemail: true,
		pageParam: false,
		reasonParam: true,
		reason: 'Email [[WP:Harassment|harassment]]',
		summary: 'You have been [[WP:PB|blocked]] from emailing other editors for [[WP:Harassment|harassment]]'
	},
	'uw-ewpblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		reason: '[[WP:Edit warring|Edit warring]]',
		summary: 'You have been [[WP:PB|blocked]] from editing certain areas of the encyclopedia to prevent further [[WP:DE|disruption]] due to [[WP:EW|edit warring]]'
	},
	'uw-pblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		summary: 'You have been [[WP:PB|partially blocked]] from certain areas of the encyclopedia'
	},
	'uw-pblockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		summary: 'You have been indefinitely [[WP:PB|partially blocked]] from certain areas of the encyclopedia'
	}
};

Twinkle.block.transformBlockPresets = function twinkleblockTransformBlockPresets() {
	// supply sensible defaults
	$.each(Twinkle.block.blockPresetsInfo, function(preset, settings) {
		settings.summary = settings.summary || settings.reason;
		settings.sig = settings.sig !== undefined ? settings.sig : 'yes';
		settings.indefinite = settings.indefinite || Morebits.string.isInfinity(settings.expiry);

		if (!Twinkle.block.isRegistered && settings.indefinite) {
			settings.expiry = '31 hours';
		} else {
			settings.expiry = settings.expiry || '31 hours';
		}

		Twinkle.block.blockPresetsInfo[preset] = settings;
	});
};

// These are the groups of presets and defines the order in which they appear. For each list item:
//   label: <string, the description that will be visible in the dropdown>
//   value: <string, the key of a preset in blockPresetsInfo>
Twinkle.block.blockGroups = [
	{
		label: 'Common block reasons',
		list: [
			{ label: 'anonblock', value: 'anonblock' },
			{ label: 'anonblock - likely a school', value: 'anonblock - school' },
			{ label: 'school block', value: 'school block' },
			{ label: 'Generic block (custom reason)', value: 'uw-block' }, // ends up being default for registered users
			{ label: 'Generic block (custom reason) - IP', value: 'uw-ablock', selected: true }, // set only when blocking IP
			{ label: 'Generic block (custom reason) - indefinite', value: 'uw-blockindef' },
			{ label: 'Disruptive editing', value: 'uw-disruptblock' },
			{ label: 'Inappropriate use of user talk page while blocked', value: 'uw-talkrevoked' },
			{ label: 'Not here to build an encyclopedia', value: 'uw-nothereblock' },
			{ label: 'Unsourced content', value: 'uw-ucblock' },
			{ label: 'Vandalism', value: 'uw-vblock' },
			{ label: 'Vandalism-only account', value: 'uw-voablock' }
		]
	},
	{
		label: 'Extended reasons',
		list: [
			{ label: 'Advertising', value: 'uw-adblock' },
			{ label: 'Arbitration enforcement', value: 'uw-aeblock' },
			{ label: 'Block evasion - IP', value: 'uw-ipevadeblock' },
			{ label: 'BLP violations', value: 'uw-bioblock' },
			{ label: 'Copyright violations', value: 'uw-copyrightblock' },
			{ label: 'Creating nonsense pages', value: 'uw-npblock' },
			{ label: 'Edit filter-related', value: 'uw-efblock' },
			{ label: 'Edit warring', value: 'uw-ewblock' },
			{ label: 'Generic block with talk page access revoked', value: 'uw-blocknotalk' },
			{ label: 'Harassment', value: 'uw-hblock' },
			{ label: 'Legal threats', value: 'uw-lblock' },
			{ label: 'Personal attacks or harassment', value: 'uw-pablock' },
			{ label: 'Possible compromised account', value: 'uw-compblock' },
			{ label: 'Removal of content', value: 'uw-dblock' },
			{ label: 'Sock puppetry (master)', value: 'uw-sockblock' },
			{ label: 'Sock puppetry (puppet)', value: 'uw-spoablock' },
			{ label: 'Social networking', value: 'uw-socialmediablock' },
			{ label: 'Spam', value: 'uw-sblock' },
			{ label: 'Spam/advertising-only account', value: 'uw-soablock' },
			{ label: 'Unapproved bot', value: 'uw-botblock' },
			{ label: 'Undisclosed paid editing', value: 'uw-upeblock' },
			{ label: 'Violating the three-revert rule', value: 'uw-3block' }
		]
	},
	{
		label: 'Username violations',
		list: [
			{ label: 'Bot username, soft block', value: 'uw-botublock' },
			{ label: 'Bot username, hard block', value: 'uw-botuhblock' },
			{ label: 'Promotional username, hard block', value: 'uw-spamublock' },
			{ label: 'Promotional username, soft block', value: 'uw-softerblock' },
			{ label: 'Similar username soft block', value: 'uw-ublock-double' },
			{ label: 'Username violation, soft block', value: 'uw-ublock' },
			{ label: 'Username violation, hard block', value: 'uw-uhblock' },
			{ label: 'Username impersonation hard block', value: 'uw-uhblock-double' },
			{ label: 'Username represents a well-known person, soft block', value: 'uw-ublock-wellknown' },
			{ label: 'Username represents a non-profit, soft block', value: 'uw-causeblock' },
			{ label: 'Username violation, vandalism-only account', value: 'uw-vaublock' }
		]
	},
	{
		label: 'Templated reasons',
		list: [
			{ label: 'blocked proxy', value: 'blocked proxy' },
			{ label: 'CheckUser block', value: 'CheckUser block', disabled: !Morebits.userIsInGroup('checkuser') },
			{ label: 'checkuserblock-account', value: 'checkuserblock-account', disabled: !Morebits.userIsInGroup('checkuser') },
			{ label: 'checkuserblock-wide', value: 'checkuserblock-wide', disabled: !Morebits.userIsInGroup('checkuser') },
			{ label: 'colocationwebhost', value: 'colocationwebhost' },
			{ label: 'oversightblock', value: 'oversightblock', disabled: !Morebits.userIsInGroup('oversight') },
			// { label: 'rangeblock', value: 'rangeblock' }, // placeholder for when we add support for rangeblocks
			{ label: 'spamblacklistblock', value: 'spamblacklistblock' },
			{ label: 'tor', value: 'tor' },
			{ label: 'webhostblock', value: 'webhostblock' },
			{ label: 'zombie proxy', value: 'zombie proxy' }
		]
	}
];

Twinkle.block.blockGroupsPartial = [
	{
		label: 'Common partial block reasons',
		list: [
			{ label: 'Generic partial block (custom reason)', value: 'uw-pblock', selected: true },
			{ label: 'Generic partial block (custom reason) - indefinite', value: 'uw-pblockindef' },
			{ label: 'Edit warring', value: 'uw-ewpblock' }
		]
	},
	{
		label: 'Extended partial block reasons',
		list: [
			{ label: 'Arbitration enforcement', value: 'uw-aepblock' },
			{ label: 'Email harassment', value: 'uw-epblock' },
			{ label: 'Misusing multiple accounts', value: 'uw-acpblock' },
			{ label: 'Misusing multiple accounts - indefinite', value: 'uw-acpblockindef' }
		]
	}
];


Twinkle.block.callback.filtered_block_groups = function twinkleblockCallbackFilteredBlockGroups(group, show_template) {
	return $.map(group, function(blockGroup) {
		var list = $.map(blockGroup.list, function(blockPreset) {
			// only show uw-talkrevoked if reblocking
			if (!Twinkle.block.currentBlockInfo && blockPreset.value === 'uw-talkrevoked') {
				return;
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
	var key = e.target.form.preset.value;
	if (!key) {
		return;
	}

	e.target.form.template.value = Twinkle.block.blockPresetsInfo[key].templateName || key;
	Twinkle.block.callback.update_form(e, Twinkle.block.blockPresetsInfo[key]);
	Twinkle.block.callback.change_template(e);
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
		new RegExp('( <!--|;) ' + 'see also ' + Twinkle.block.seeAlsos.join(' and ') + '( -->)?'), ''
	);

	Twinkle.block.seeAlsos = Twinkle.block.seeAlsos.filter(function(el) {
		return el !== this.value;
	}.bind(this));

	if (this.checked) {
		Twinkle.block.seeAlsos.push(this.value);
	}
	var seeAlsoMessage = Twinkle.block.seeAlsos.join(' and ');

	if (!Twinkle.block.seeAlsos.length) {
		this.form.reason.value = reason;
	} else if (reason.indexOf('{{') !== -1) {
		this.form.reason.value = reason + ' <!-- see also ' + seeAlsoMessage + ' -->';
	} else {
		this.form.reason.value = reason + '; see also ' + seeAlsoMessage;
	}
};

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
};

Twinkle.block.callback.change_template = function twinkleblockcallbackChangeTemplate(e) {
	var form = e.target.form, value = form.template.value, settings = Twinkle.block.blockPresetsInfo[value];
	if (!$(form).find('[name=actiontype][value=block]').is(':checked')) {
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
		Morebits.quickForm.setElementVisibility(form.noemail_template.parentNode, $(form).find('[name=actiontype][value=partial]').is(':checked') && !$(form).find('[name=actiontype][value=block]').is(':checked'));
		Morebits.quickForm.setElementVisibility(form.nocreate_template.parentNode, $(form).find('[name=actiontype][value=partial]').is(':checked') && !$(form).find('[name=actiontype][value=block]').is(':checked'));
	} else {
		Morebits.quickForm.setElementVisibility(
			form.blank_duration.parentNode,
			!settings.indefinite && !settings.nonstandard
		);
	}
	Morebits.quickForm.setElementVisibility(form.article.parentNode, !!settings.pageParam);
	Morebits.quickForm.setElementVisibility(form.block_reason.parentNode, !!settings.reasonParam);

	// Partial block
	Morebits.quickForm.setElementVisibility(form.area.parentNode, $(form).find('[name=actiontype][value=partial]').is(':checked') && !$(form).find('[name=actiontype][value=block]').is(':checked'));

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

	form.previewer.beginRender(templateText, 'User_talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
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
				return alert('Partial blocks cannot prevent talk page access unless also restricting them from editing User talk space!');
			}
			if (!blockoptions.namespacerestrictions && !blockoptions.pagerestrictions) {
				if (!blockoptions.noemail && !blockoptions.nocreate) { // Blank entries technically allowed [[phab:T208645]]
					return alert('No pages or namespaces were selected, nor were email or account creation restrictions applied; please select at least one option to apply a partial block!');
				} else if ((templateoptions.template !== 'uw-epblock' || $form.find('select[name="preset"]').val() !== 'uw-epblock') &&
					// Don't require confirmation if email harassment defaults are set
					!confirm('You are about to block with no restrictions on page or namespace editing, are you sure you want to proceed?')) {
					return;
				}
			}
		}
		if (!blockoptions.expiry) {
			return alert('Please provide an expiry!');
		} else if (Morebits.string.isInfinity(blockoptions.expiry) && !Twinkle.block.isRegistered) {
			return alert("Can't indefinitely block an IP address!");
		}
		if (!blockoptions.reason) {
			return alert('Please provide a reason for the block!');
		}

		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		var statusElement = new Morebits.status('Executing block');
		blockoptions.action = 'block';
		blockoptions.user = mw.config.get('wgRelevantUserName');

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
		api.get({
			format: 'json',
			action: 'query',
			list: 'blocks|logevents',
			letype: 'block',
			lelimit: 1,
			letitle: 'User:' + blockoptions.user,
			bkusers: blockoptions.user
		}).then(function(data) {
			var block = data.query.blocks[0];
			var logevents = data.query.logevents[0];
			var logid = data.query.logevents.length ? logevents.logid : false;

			if (logid !== Twinkle.block.blockLogId || !!block !== !!Twinkle.block.currentBlockInfo) {
				var message = 'The block status of ' + mw.config.get('wgRelevantUserName') + ' has changed. ';
				if (block) {
					message += 'New status: ';
				} else {
					message += 'Last entry: ';
				}

				var logExpiry = '';
				if (logevents.params.duration) {
					if (logevents.params.duration === 'infinity') {
						logExpiry = 'indefinitely';
					} else {
						var expiryDate = new Morebits.date(logevents.params.expiry);
						logExpiry += (expiryDate.isBefore(new Date()) ? ', expired ' : ' until ') + expiryDate.calendar();
					}
				} else { // no duration, action=unblock, just show timestamp
					logExpiry = ' ' + new Morebits.date(logevents.timestamp).calendar();
				}
				message += Morebits.string.toUpperCaseFirstChar(logevents.action) + 'ed by ' + logevents.user + logExpiry +
					' for "' + logevents.comment + '". Do you want to override with your settings?';

				if (!confirm(message)) {
					Morebits.status.info('Executing block', 'Canceled by user');
					return;
				}
				blockoptions.reblock = 1; // Writing over a block will fail otherwise
			}

			// execute block
			blockoptions.tags = Twinkle.changeTags;
			blockoptions.token = mw.user.tokens.get('csrfToken');
			var mbApi = new Morebits.wiki.api('Executing block', blockoptions, function() {
				statusElement.info('Completed');
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
		return alert('Please give Twinkle something to do!');
	}
};

Twinkle.block.callback.issue_template = function twinkleblockCallbackIssueTemplate(formData) {
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	var params = $.extend(formData, {
		messageData: Twinkle.block.blockPresetsInfo[formData.template],
		reason: Twinkle.block.field_template_options.block_reason,
		disabletalk: Twinkle.block.field_template_options.notalk,
		noemail: Twinkle.block.field_template_options.noemail_template,
		nocreate: Twinkle.block.field_template_options.nocreate_template
	});

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Actions complete, loading user talk page in a few seconds';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'User talk page modification');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.block.callback.main);
};

Twinkle.block.callback.getBlockNoticeWikitext = function(params) {
	var text = '{{', settings = Twinkle.block.blockPresetsInfo[params.template];
	if (!settings.nonstandard) {
		text += 'subst:' + params.template;
		if (params.article && settings.pageParam) {
			text += '|page=' + params.article;
		}

		if (!/te?mp|^\s*$|min/.exec(params.expiry)) {
			if (params.indefinite) {
				text += '|indef=yes';
			} else if (!params.blank_duration) {
				text += '|time=' + params.expiry;
			}
		}

		if (!Twinkle.block.isRegistered && !params.hardblock) {
			text += '|anon=yes';
		}

		if (params.reason) {
			text += '|reason=' + params.reason;
		}
		if (params.disabletalk) {
			text += '|notalk=yes';
		}

		// Currently, all partial block templates are "standard"
		// Building the template, however, takes a fair bit of logic
		if (params.partial) {
			if (params.pagerestrictions.length || params.namespacerestrictions.length) {
				var makeSentence = function (array) {
					if (array.length < 3) {
						return array.join(' and ');
					}
					var last = array.pop();
					return array.join(', ') + ', and ' + last;

				};
				text += '|area=' + (params.indefinite ? 'certain ' : 'from certain ');
				if (params.pagerestrictions.length) {
					text += 'pages (' + makeSentence(params.pagerestrictions.map(function(p) {
						return '[[:' + p + ']]';
					}));
					text += params.namespacerestrictions.length ? ') and certain ' : ')';
				}
				if (params.namespacerestrictions.length) {
					// 1 => Talk, 2 => User, etc.
					var namespaceNames = params.namespacerestrictions.map(function(id) {
						return menuFormattedNamespaces[id];
					});
					text += '[[Wikipedia:Namespace|namespaces]] (' + makeSentence(namespaceNames) + ')';
				}
			} else if (params.area) {
				text += '|area=' + params.area;
			} else {
				if (params.noemail) {
					text += '|email=yes';
				}
				if (params.nocreate) {
					text += '|accountcreate=yes';
				}
			}
		}
	} else {
		text += params.template;
	}

	if (settings.sig) {
		text += '|sig=' + settings.sig;
	}
	return text + '}}';
};

Twinkle.block.callback.main = function twinkleblockcallbackMain(pageobj) {
	var text = pageobj.getPageText(),
		params = pageobj.getCallbackParameters(),
		messageData = params.messageData,
		date = new Morebits.date(pageobj.getLoadTime());

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

	params.indefinite = Morebits.string.isInfinity(params.expiry);

	if (Twinkle.getPref('blankTalkpageOnIndefBlock') && params.template !== 'uw-lblock' && params.indefinite) {
		Morebits.status.info('Info', 'Blanking talk page per preferences and creating a new level 2 heading for the date');
		text = date.monthHeader() + '\n';
	} else if (!dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex) {
		Morebits.status.info('Info', 'Will create a new level 2 heading for the date, as none was found for this month');
		text += date.monthHeader() + '\n';
	}

	params.expiry = typeof params.template_expiry !== 'undefined' ? params.template_expiry : params.expiry;

	text += Twinkle.block.callback.getBlockNoticeWikitext(params);

	// build the edit summary
	var summary = messageData.summary;
	if (messageData.suppressArticleInSummary !== true && params.article) {
		summary += ' on [[:' + params.article + ']]';
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
