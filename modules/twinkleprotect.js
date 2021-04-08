// <nowiki>


(function($) {


/*
 ****************************************
 *** twinkleprotect.js: Protect/RPP module
 ****************************************
 * Mode of invocation:     Tab ("PP"/"RPP")
 * Active on:              Non-special, non-MediaWiki pages
 */

// Note: a lot of code in this module is re-used/called by batchprotect.

Twinkle.protect = function twinkleprotect() {
	if (mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgNamespaceNumber') === 8) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.protect.callback, 'Beveilig', 'tw-rpp', Morebits.userIsSysop ? 'Beveilig pagina' : 'Verzoek pagina beveiliging');
};

Twinkle.protect.callback = function twinkleprotectCallback() {
	var Window = new Morebits.simpleWindow(620, 530);
	Window.setTitle(Morebits.userIsSysop ? 'Plaats of verzoek een paginabeveiliging' : 'Verzoek een paginabeveiliging');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Beveilig beleid', 'WP:RVM#Een_pagina_beveiligen');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#protect');

	var form = new Morebits.quickForm(Twinkle.protect.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: 'Type handeling'
	});
	if (Morebits.userIsSysop) {
		actionfield.append({
			type: 'radio',
			name: 'actiontype',
			event: Twinkle.protect.callback.changeAction,
			list: [
				{
					label: 'Beveilig pagina',
					value: 'protect',
					tooltip: 'Plaats een beveiliging op de pagina.',
					checked: true
				}
			]
		});
	}
	actionfield.append({
		type: 'radio',
		name: 'actiontype',
		event: Twinkle.protect.callback.changeAction,
		list: [
			{
				label: 'Verzoek om beveiliging van pagina',
				value: 'request',
				tooltip: 'Indien je beveiliging wil aanvragen via WP:BV' + (Morebits.userIsSysop ? ' inplaats van het zelf beveiligen.' : '.'),
				checked: !Morebits.userIsSysop
			},
			{
				label: 'Plaats beveilig sjabloon (n.v.t. op nlwiki)',
				value: 'tag',
				disabled: true //kan vooralsnog niet weg (want JavaScript), dus voorlopig dan maar zo.
			}
		]
	});

	form.append({ type: 'field', label: 'Preset', name: 'field_preset' });
	form.append({ type: 'field', label: '1', name: 'field1' });
	form.append({ type: 'field', label: '2', name: 'field2' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.actiontype[0].dispatchEvent(evt);

	// get current protection level asynchronously
	Twinkle.protect.fetchProtectionLevel();
};


// A list of bots who may be the protecting sysop, for whom we shouldn't
// remind the user contact before requesting unprotection (evaluate)
Twinkle.protect.trustedBots = ['Nlwikibot']; //hier moet iets staan, dus dan maar het meest onschuldige botje

// Customizable namespace and FlaggedRevs settings
// In theory it'd be nice to have restrictionlevels defined here,
// but those are only available via a siteinfo query

// mw.loader.getState('ext.flaggedRevs.review') returns null if the
// FlaggedRevs extension is not registered.  Previously, this was done with
// wgFlaggedRevsParams, but after 1.34-wmf4 it is no longer exported if empty
// (https://gerrit.wikimedia.org/r/c/mediawiki/extensions/FlaggedRevs/+/508427)
var hasFlaggedRevs = mw.loader.getState('ext.flaggedRevs.review') &&
// FlaggedRevs only valid in some namespaces, hardcoded until [[phab:T218479]]
(mw.config.get('wgNamespaceNumber') === 0 || mw.config.get('wgNamespaceNumber') === 4);
// Limit template editor; a Twinkle restriction, not a site setting
var isTemplate = mw.config.get('wgNamespaceNumber') === 10 || mw.config.get('wgNamespaceNumber') === 828;


// Contains the current protection level in an object
// Once filled, it will look something like:
// { edit: { level: "sysop", expiry: <some date>, cascade: true }, ... }
Twinkle.protect.currentProtectionLevels = {};

// returns a jQuery Deferred object, usage:
//   Twinkle.protect.fetchProtectingAdmin(apiObject, pageName, protect/stable).done(function(admin_username) { ...code... });
Twinkle.protect.fetchProtectingAdmin = function twinkleprotectFetchProtectingAdmin(api, pageName, protType, logIds) {
	logIds = logIds || [];

	return api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letitle: pageName,
		letype: protType
	}).then(function(data) {
		// don't check log entries that have already been checked (e.g. don't go into an infinite loop!)
		var event = data.query ? $.grep(data.query.logevents, function(le) {
			return $.inArray(le.logid, logIds);
		})[0] : null;
		if (!event) {
			// fail gracefully
			return null;
		} else if (event.action === 'move_prot' || event.action === 'move_stable') {
			return twinkleprotectFetchProtectingAdmin(api, protType === 'protect' ? event.params.oldtitle_title : event.params.oldtitle, protType, logIds.concat(event.logid));
		}
		return event.user;
	});
};

Twinkle.protect.fetchProtectionLevel = function twinkleprotectFetchProtectionLevel() {

	var api = new mw.Api();
	var protectDeferred = api.get({
		format: 'json',
		indexpageids: true,
		action: 'query',
		list: 'logevents',
		letype: 'protect',
		letitle: mw.config.get('wgPageName'),
		prop: hasFlaggedRevs ? 'info|flagged' : 'info',
		inprop: 'protection|watched',
		titles: mw.config.get('wgPageName')
	});
	var stableDeferred = api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letype: 'stable',
		letitle: mw.config.get('wgPageName')
	});

	var earlyDecision = [protectDeferred];
	if (hasFlaggedRevs) {
		earlyDecision.push(stableDeferred);
	}

	$.when.apply($, earlyDecision).done(function(protectData, stableData) {
		// $.when.apply is supposed to take an unknown number of promises
		// via an array, which it does, but the type of data returned varies.
		// If there are two or more deferreds, it returns an array (of objects),
		// but if there's just one deferred, it retuns a simple object.
		// This is annoying.
		protectData = $(protectData).toArray();

		var pageid = protectData[0].query.pageids[0];
		var page = protectData[0].query.pages[pageid];
		var current = {}, adminEditDeferred;

		// Save requested page's watched status for later in case needed when filing request
		Twinkle.protect.watched = page.watchlistexpiry || page.watched === '';

		$.each(page.protection, function(index, protection) {
			// Don't overwrite actual page protection with cascading protection
			if (!protection.source) {
				current[protection.type] = {
					level: protection.level,
					expiry: protection.expiry,
					cascade: protection.cascade === ''
				};
				// logs report last admin who made changes to either edit/move/create protection, regardless if they only modified one of them
				if (!adminEditDeferred) {
					adminEditDeferred = Twinkle.protect.fetchProtectingAdmin(api, mw.config.get('wgPageName'), 'protect');
				}
			} else {
				// Account for the page being covered by cascading protection
				current.cascading = {
					expiry: protection.expiry,
					source: protection.source,
					level: protection.level // should always be sysop, unused
				};
			}
		});

		if (page.flagged) {
			current.stabilize = {
				level: page.flagged.protection_level,
				expiry: page.flagged.protection_expiry
			};
			adminEditDeferred = Twinkle.protect.fetchProtectingAdmin(api, mw.config.get('wgPageName'), 'stable');
		}

		// show the protection level and log info
		Twinkle.protect.hasProtectLog = !!protectData[0].query.logevents.length;
		Twinkle.protect.protectLog = Twinkle.protect.hasProtectLog && protectData[0].query.logevents;
		Twinkle.protect.hasStableLog = hasFlaggedRevs ? !!stableData[0].query.logevents.length : false;
		Twinkle.protect.stableLog = Twinkle.protect.hasStableLog && stableData[0].query.logevents;
		Twinkle.protect.currentProtectionLevels = current;

		if (adminEditDeferred) {
			adminEditDeferred.done(function(admin) {
				if (admin) {
					$.each(['edit', 'move', 'create', 'stabilize', 'cascading'], function(i, type) {
						if (Twinkle.protect.currentProtectionLevels[type]) {
							Twinkle.protect.currentProtectionLevels[type].admin = admin;
						}
					});
				}
				Twinkle.protect.callback.showLogAndCurrentProtectInfo();
			});
		} else {
			Twinkle.protect.callback.showLogAndCurrentProtectInfo();
		}
	});
};

Twinkle.protect.callback.showLogAndCurrentProtectInfo = function twinkleprotectCallbackShowLogAndCurrentProtectInfo() {
	var currentlyProtected = !$.isEmptyObject(Twinkle.protect.currentProtectionLevels);

	if (Twinkle.protect.hasProtectLog || Twinkle.protect.hasStableLog) {
		var $linkMarkup = $('<span>');

		if (Twinkle.protect.hasProtectLog) {
			$linkMarkup.append(
				$('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'protect'}) + '">beveiligingslogboek</a>'));
			if (!currentlyProtected || (!Twinkle.protect.currentProtectionLevels.edit && !Twinkle.protect.currentProtectionLevels.move)) {
				var lastProtectAction = Twinkle.protect.protectLog[0];
				if (lastProtectAction.action === 'unprotect') {
					$linkMarkup.append(' (onbeveiligd ' + new Morebits.date(lastProtectAction.timestamp).calendar('utc') + ' (utc))');
				} else { // protect or modify
					$linkMarkup.append(' (verliep ' + new Morebits.date(lastProtectAction.params.details[0].expiry).calendar('utc') + ' (utc)');
				}
			}
			$linkMarkup.append(Twinkle.protect.hasStableLog ? $('<span> &bull; </span>') : null);
		}

		if (Twinkle.protect.hasStableLog) {
			$linkMarkup.append($('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'stable'}) + '">pending changes log</a>)'));
			if (!currentlyProtected || !Twinkle.protect.currentProtectionLevels.stabilize) {
				var lastStabilizeAction = Twinkle.protect.stableLog[0];
				if (lastStabilizeAction.action === 'reset') {
					$linkMarkup.append(' (reset ' + new Morebits.date(lastStabilizeAction.timestamp).calendar('utc') + ' (utc))');
				} else { // config or modify
					$linkMarkup.append(' (verliep ' + new Morebits.date(lastStabilizeAction.params.expiry).calendar('utc') + ' (utc)');
				}
			}
		}

		Morebits.status.init($('div[name="hasprotectlog"] span')[0]);
		Morebits.status.warn(
			currentlyProtected ? 'Voorgaande beveiligingen' : 'Deze pagina is in het verleden beveiligd',
			$linkMarkup[0]
		);
	}

	Morebits.status.init($('div[name="currentprot"] span')[0]);
	var protectionNode = [], statusLevel = 'info';

	if (currentlyProtected) {
		$.each(Twinkle.protect.currentProtectionLevels, function(type, settings) {
			var label = type === 'stabilize' ? 'Pending Changes' : Morebits.string.toUpperCaseFirstChar(type);

			if (type === 'cascading') { // Covered by another page
				label = 'Cascade beveiliging ';
				protectionNode.push($('<b>' + label + '</b>')[0]);
				if (settings.source) { // Should by definition exist
					var sourceLink = '<a target="_blank" href="' + mw.util.getUrl(settings.source) + '">' + settings.source + '</a>';
					protectionNode.push($('<span>van ' + sourceLink + '</span>')[0]);
				}
			} else {
				var level = settings.level;
				// Make cascading protection more prominent
				if (settings.cascade) {
					level += ' (cascade)';
				}
				protectionNode.push($('<b>' + label + ': ' + level + '</b>')[0]);
			}

			if (settings.expiry === 'infinity') {
				protectionNode.push(' (onbepaalde tijd) ');
			} else {
				protectionNode.push(' (verloopt ' + new Morebits.date(settings.expiry).calendar('utc') + ' (utc)) ');
			}
			if (settings.admin) {
				var adminLink = '<a target="_blank" href="' + mw.util.getUrl('Overleg_gebruiker:' + settings.admin) + '">' + settings.admin + '</a>';
				protectionNode.push($('<span>by ' + adminLink + '</span>')[0]);
			}
			protectionNode.push($('<span> \u2022 </span>')[0]);
		});
		protectionNode = protectionNode.slice(0, -1); // remove the trailing bullet
		statusLevel = 'warn';
	} else {
		protectionNode.push($('<b>geen beveiliging</b>')[0]);
	}

	Morebits.status[statusLevel]('Huidige beveiliging', protectionNode);
};

Twinkle.protect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Voorinstelling', name: 'field_preset' });
			field_preset.append({
				type: 'select',
				name: 'category',
				label: 'Kies voorinstelling:',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate
			});

			field2 = new Morebits.quickForm.element({ type: 'field', label: 'Beveiligingsopties', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field2.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			// for existing pages
			if (mw.config.get('wgArticleId')) {
				field2.append({
					type: 'checkbox',
					event: Twinkle.protect.formevents.editmodify,
					list: [
						{
							label: 'Verander bewerk beveiliging',
							name: 'editmodify',
							tooltip: 'Indien uitgeschakeld, zal het bewerk-beveiligingsniveau en verlooptijd ongewijzigd blijven.',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'editlevel',
					label: 'Bewerk beveiliging:',
					event: Twinkle.protect.formevents.editlevel,
					list: Twinkle.protect.protectionLevels.filter(function(level) {
						// Filter TE outside of templates and modules
						return isTemplate || level.value !== 'templateeditor';
					})
				});
				field2.append({
					type: 'select',
					name: 'editexpiry',
					label: 'Verloopt:',
					event: function(e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (2 days) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
				field2.append({
					type: 'checkbox',
					event: Twinkle.protect.formevents.movemodify,
					list: [
						{
							label: 'Verander verplaats beveiliging',
							name: 'movemodify',
							tooltip: 'Indien uitgeschakeld, zal het verplaats-beveiligingsniveau en verlooptijd ongewijzigd blijven.',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'movelevel',
					label: 'Verplaats beveiliging:',
					event: Twinkle.protect.formevents.movelevel,
					list: Twinkle.protect.protectionLevels.filter(function(level) {
						// Autoconfirmed is required for a move, redundant
						return level.value !== 'autoconfirmed' && (isTemplate || level.value !== 'templateeditor');
					})
				});
				field2.append({
					type: 'select',
					name: 'moveexpiry',
					label: 'Verloopt:',
					event: function(e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (2 days) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
				if (hasFlaggedRevs) {
					field2.append({
						type: 'checkbox',
						event: Twinkle.protect.formevents.pcmodify,
						list: [
							{
								label: 'Modify pending changes protection',
								name: 'pcmodify',
								tooltip: 'If this is turned off, the pending changes level, and expiry time, will be left as is.',
								checked: true
							}
						]
					});
					field2.append({
						type: 'select',
						name: 'pclevel',
						label: 'Pending changes:',
						event: Twinkle.protect.formevents.pclevel,
						list: [
							{ label: 'None', value: 'none' },
							{ label: 'Pending change', value: 'autoconfirmed', selected: true }
						]
					});
					field2.append({
						type: 'select',
						name: 'pcexpiry',
						label: 'Expires:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						// default expiry selection (1 month) is conditionally set in Twinkle.protect.callback.changePreset
						list: Twinkle.protect.protectionLengths
					});
				}
			} else {  // for non-existing pages
				field2.append({
					type: 'select',
					name: 'createlevel',
					label: 'Aanmaak beveiliging:',
					event: Twinkle.protect.formevents.createlevel,
					list: Twinkle.protect.protectionLevels.filter(function(level) {
						// Filter TE always
						return level.value !== 'templateeditor';
					})
				});
				field2.append({
					type: 'select',
					name: 'createexpiry',
					label: 'Verloopt:',
					event: function(e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (indefinite) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
			}
			field2.append({
				type: 'textarea',
				name: 'protectReason',
				label: 'Reden (voor beveiligingslogboek):'
			});
			field2.append({
				type: 'div',
				name: 'protectReason_notes',
				label: 'Note:',
				style: 'display:inline-block; margin-top:4px;',
				tooltip: 'Voeg een notitie toe dat de beveiliging is aangevraagd op WP:BV.'
			});
			field2.append({
				type: 'checkbox',
				event: Twinkle.protect.callback.annotateProtectReason,
				style: 'display:inline-block; margin-top:4px;',
				list: [
					{
						label: 'WP:BV verzoek',
						name: 'protectReason_notes_rfpp',
						checked: false,
						value: 'aangevraagd op [[WP:BV]]'
					}
				]
			});
			field2.append({
				type: 'input',
				event: Twinkle.protect.callback.annotateProtectReason,
				label: 'WP:BV oldid (optioneel)',
				name: 'protectReason_notes_rfppRevid',
				value: '',
				tooltip: 'Optioneel: Verwijs naar de aanvraag middels de oldid waarin de aanvraag is gedaan.'
			});
			
			break;

		case 'request':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Type of protection', name: 'field_preset' });
			field_preset.append({
				type: 'select',
				name: 'category',
				label: 'Type en reden:',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate
			});

			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Opties', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			field1.append({
				type: 'select',
				name: 'expiry',
				label: 'Duur: ',
				list: [
					{ label: '', selected: true, value: '' },
					{ label: 'Tijdelijk', value: 'temporary' },
					{ label: 'Permanent', value: 'infinity' }
				]
			});
			field1.append({
				type: 'textarea',
				name: 'reason',
				label: 'Reden: '
			});
			break;
		default:
			alert("Hmmm... Daar ging iets mis (ERROR: module_protect/line_534)");
			break;
	}

	var oldfield;

	if (field_preset) {
		oldfield = $(e.target.form).find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field_preset"]').css('display', 'none');
	}
	if (field1) {
		oldfield = $(e.target.form).find('fieldset[name="field1"]')[0];
		oldfield.parentNode.replaceChild(field1.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field1"]').css('display', 'none');
	}
	if (field2) {
		oldfield = $(e.target.form).find('fieldset[name="field2"]')[0];
		oldfield.parentNode.replaceChild(field2.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field2"]').css('display', 'none');
	}

	if (e.target.values === 'protect') {
		// fake a change event on the preset dropdown
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		e.target.form.category.dispatchEvent(evt);

		// reduce vertical height of dialog
		$(e.target.form).find('fieldset[name="field2"] select').parent().css({ display: 'inline-block', marginRight: '0.5em' });
		$(e.target.form).find('fieldset[name="field2"] input[name="protectReason_notes_rfppRevid"]').parent().css({display: 'inline-block', marginLeft: '15px'}).hide();
	}

	// re-add protection level and log info, if it's available
	Twinkle.protect.callback.showLogAndCurrentProtectInfo();
};

// NOTE: This function is used by batchprotect as well
Twinkle.protect.formevents = {
	editmodify: function twinkleprotectFormEditmodifyEvent(e) {
		e.target.form.editlevel.disabled = !e.target.checked;
		e.target.form.editexpiry.disabled = !e.target.checked || (e.target.form.editlevel.value === 'all');
		e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	editlevel: function twinkleprotectFormEditlevelEvent(e) {
		e.target.form.editexpiry.disabled = e.target.value === 'all';
	},
	movemodify: function twinkleprotectFormMovemodifyEvent(e) {
		// sync move settings with edit settings if applicable
		if (e.target.form.movelevel.disabled && !e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = e.target.form.editlevel.value;
			e.target.form.moveexpiry.value = e.target.form.editexpiry.value;
		} else if (e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = 'sysop';
			e.target.form.moveexpiry.value = 'infinity';
		}
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	movelevel: function twinkleprotectFormMovelevelEvent(e) {
		e.target.form.moveexpiry.disabled = e.target.value === 'all';
	},
	pcmodify: function twinkleprotectFormPcmodifyEvent(e) {
		e.target.form.pclevel.disabled = !e.target.checked;
		e.target.form.pcexpiry.disabled = !e.target.checked || (e.target.form.pclevel.value === 'none');
		e.target.form.pclevel.style.color = e.target.form.pcexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	pclevel: function twinkleprotectFormPclevelEvent(e) {
		e.target.form.pcexpiry.disabled = e.target.value === 'none';
	},
	createlevel: function twinkleprotectFormCreatelevelEvent(e) {
		e.target.form.createexpiry.disabled = e.target.value === 'all';
	},
	tagtype: function twinkleprotectFormTagtypeEvent(e) {
		e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
	}
};

Twinkle.protect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('Voer aangepaste beveiliging in.  \nJe kunt relative tijden in het engels gebruiken, zoals "1 minute" en "19 days", of absolute tijden in "yyyymmddhhmm"-format (bijv: "199905210105" is 21 mei 1999 om 01:05 UTC).', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	} else {
		target.selectedIndex = 0;
	}
};

// NOTE: This list is used by batchprotect as well
Twinkle.protect.protectionLevels = [
	{ label: 'Alle gebruikers', value: 'all' },
	{ label: 'Bevestigde gebruikers', value: 'autoconfirmed' },
	{ label: 'Moderatoren', value: 'sysop', selected: true }
];

// default expiry selection is conditionally set in Twinkle.protect.callback.changePreset
// NOTE: This list is used by batchprotect as well
Twinkle.protect.protectionLengths = [
	{ label: 'aangepast', value: 'custom' },
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
];

Twinkle.protect.protectionTypes = [
	{ label: 'Beveiliging opheffen', value: 'unprotect' },
	{
		label: 'Volledige beveiliging',
		list: [
			{ label: 'Algemeen (full)', value: 'full-algemeen' },
			{ label: 'Bewerkingsoorlog (full)', value: 'full-bwo' },
			{ label: 'Herhaald vandalisme (full)', value: 'full-vandalisme' },
			{ label: 'Recente gebeurtenissen (full)', value: 'full-recent' },
			{ label: 'Veelbezochte pagina (full)', value: 'full-veelbezocht' },
			{ label: 'Reclame/zelfpromotie (full)', value: 'full-spam' },
			{ label: 'Archiefpagina (full)', value: 'full-archief' }
		]
	},
	{
		label: 'Semi-beveiliging',
		list: [
			{ label: 'Algemeen (semi)', value: 'semi-algemeen' },
			{ label: 'Herhaald vandalisme (semi)', selected: true, value: 'semi-vandalisme' },
			{ label: 'BLP schendingen (semi)', value: 'semi-blp' },
			{ label: 'Sokpopperij (semi)', value: 'semi-sokpop' },
			{ label: 'Recente gebeurtenissen (semi)', value: 'semi-recent' },
			{ label: 'Veelbezochte pagina (semi)', value: 'semi-veelbezocht' },
			{ label: 'Reclame/zelfpromotie (semi)', value: 'semi-spam' }
		]
	},/*
	{
		label: 'Pending changes',
		list: [
			{ label: 'Generic (PC)', value: 'pp-pc-protected' },
			{ label: 'Persistent vandalism (PC)', value: 'pp-pc-vandalism' },
			{ label: 'Disruptive editing (PC)', value: 'pp-pc-disruptive' },
			{ label: 'Adding unsourced content (PC)', value: 'pp-pc-unsourced' },
			{ label: 'BLP policy violations (PC)', value: 'pp-pc-blp' }
		]
	},*/
	{
		label: 'Verplaats beveiliging',
		list: [
			{ label: 'Algemeen (move)', value: 'move-algemeen' },
			{ label: 'Verplaatsingsoorlog (move)', value: 'move-bwo' },
			{ label: 'Verplaatsingsvandalisme (move)', value: 'move-vandalisme' },
			{ label: 'Veelbezochte pagina (move)', value: 'move-veelbezocht' }
		]
	}
].filter(function(type) {
	// Filter for templates and flaggedrevs
	return (isTemplate || type.label !== 'Template protection') && (hasFlaggedRevs || type.label !== 'Pending changes');
});

Twinkle.protect.protectionTypesCreate = [
	{ label: 'Beveiliging opheffen', value: 'unprotect' },
	{
		label: 'Aanmaak beveiliging',
		list: [
			{ label: 'Algemeen (aanmaak)', value: 'aanmaak-algemeen' },
			{ label: 'Ongewenste titel (aanmaak)', value: 'aanmaak-titel' },
			{ label: 'Herhaaldelijk heraangemaakt (aanmaak)', selected: true, value: 'aanmaak-heraanmaak' },
			{ label: 'Reclame/zelfpromotie (aanmaak)', selected: true, value: 'aanmaak-spam' },
			{ label: 'Recent verwijderde BLP (aanmaak)', value: 'aanmaak-blp' }
		]
	}
];

// A page with both regular and PC protection will be assigned its regular
// protection weight plus 2
Twinkle.protect.protectionWeight = {
	sysop: 40,
	templateeditor: 30,
	extendedconfirmed: 20,
	autoconfirmed: 10,
	flaggedrevs_autoconfirmed: 5,  // Pending Changes protection alone
	all: 0,
	flaggedrevs_none: 0  // just in case
};

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
// expiry will override any defaults
/**
 * @Params
 * edit: required level to edit
 * move: required level to move
 * create: required level to create
 * stabilize: required level for pending changes
 * expiry: default protection duration
 * reason: defailt reason to add to pendingchange log
 * template: template to add to the page
 **/
Twinkle.protect.protectionPresetsInfo = {
	'full-algemeen': {
		edit: 'sysop',
		move: 'sysop',
		reason: null
	},
	'full-bwo': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:BWO|Bewerkingsoorlog]]'
	},
	'full-vandalisme': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Voortdurend [[WP:Vandalisme|vandalisme]]'
	},
	'full-recent': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Naar aanleiding van actualiteiten en recente ontwikkelingen'
	},
	'full-veelbezocht': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Preventieve beveiliging veelbezochte pagina'
	},
	'full-spam': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Herhaaldelijke expliciete reclame, werving, propaganda of zelfpromotie'
	},
	'full-archief': {
		edit: 'sysop',
		move: 'sysop',
		expiry: 'infinity',
		reason: 'Archiefpagina'
	},
	'semi-algemeen': {
		edit: 'autoconfirmed',
		reason: null
	},
	'semi-vandalisme': {
		edit: 'autoconfirmed',
		reason: 'Voortdurend [[WP:Vandalisme|vandalisme]]'
	},
	'semi-blp': {
		edit: 'autoconfirmed',
		expiry: 'infinity',
		reason: 'Herhaaldelijke schending van richtlijn [[WP:BLP]]'
	},
	'semi-sokpop': {
		edit: 'autoconfirmed',
		expiry: 'infinity',
		reason: 'Misbruik door sokpoppen'
	},
	'semi-recent': {
		edit: 'autoconfirmed',
		reason: 'Naar aanleiding van actualiteiten en recente ontwikkelingen'
	},
	'semi-veelbezocht': {
		edit: 'autoconfirmed',
		reason: 'Preventieve beveiliging veelbezochte pagina'
	},
	'semi-spam': {
		edit: 'autoconfirmed',
		reason: 'Herhaaldelijke expliciete reclame, werving, propaganda of zelfpromotie'
	},
	'move-algemeen': {
		move: 'sysop',
		reason: null
	},
	'move-bwo': {
		move: 'sysop',
		reason: '[[WP:BWO|Verplaatsingsoorlog]]'
	},
	'move-vandalisme': {
		move: 'sysop',
		reason: 'Voortdurend vandalisme'
	},
	'move-veelbezocht': {
		move: 'sysop',
		expiry: 'infinity',
		reason: 'Preventieve beveiliging veelbezochte pagina'
	},
	'unprotect': {
		edit: 'all',
		move: 'all',
		stabilize: 'none',
		create: 'all',
		reason: null,
		template: 'none'
	},
	'aanmaak-algemeen': {
		create: 'autoconfirmed',
		reason: null
	},
	'aanmaak-titel': {
		create: 'autoconfirmed',
		reason: 'Voortdurende aanmaak van pagina met deze ongeschikte titel'
	},
	'aanmaak-heraanmaak': {
		create: 'autoconfirmed',
		reason: 'Herhaaldelijk heraanmaken van verwijderde pagina'
	},
	'aanmaak-spam': {
		create: 'autoconfirmed',
		reason: 'Herhaaldelijke expliciete reclame, werving, propaganda of zelfpromotie'
	},
	'aanmaak-blp': {
		create: 'autoconfirmed',
		reason: 'Herhaaldelijke schending van richtlijn [[WP:BLP]]'
	}
};

Twinkle.protect.callback.changePreset = function twinkleprotectCallbackChangePreset(e) {
	var form = e.target.form;

	var actiontypes = form.actiontype;
	var actiontype;
	for (var i = 0; i < actiontypes.length; i++) {
		if (!actiontypes[i].checked) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if (actiontype === 'protect') {  // actually protecting the page
		var item = Twinkle.protect.protectionPresetsInfo[form.category.value];

		if (mw.config.get('wgArticleId')) {
			if (item.edit) {
				form.editmodify.checked = true;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
				form.editlevel.value = item.edit;
				Twinkle.protect.formevents.editlevel({ target: form.editlevel });
			} else {
				form.editmodify.checked = false;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
			}

			if (item.move) {
				form.movemodify.checked = true;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
				form.movelevel.value = item.move;
				Twinkle.protect.formevents.movelevel({ target: form.movelevel });
			} else {
				form.movemodify.checked = false;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
			}

			form.editexpiry.value = form.moveexpiry.value = item.expiry || '2 weeks';


			if (form.pcmodify) {
				if (item.stabilize) {
					form.pcmodify.checked = true;
					Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
					form.pclevel.value = item.stabilize;
					Twinkle.protect.formevents.pclevel({ target: form.pclevel });
				} else {
					form.pcmodify.checked = false;
					Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
				}
				form.pcexpiry.value = item.expiry || '1 month';
			}
		} else {
			if (item.create) {
				form.createlevel.value = item.create;
				Twinkle.protect.formevents.createlevel({ target: form.createlevel });
			}
			form.createexpiry.value = item.expiry || 'infinity';
		}

		var reasonField = actiontype === 'protect' ? form.protectReason : form.reason;
		if (item.reason) {
			reasonField.value = item.reason;
		} else {
			reasonField.value = '';
		}
		// Add any annotations
		Twinkle.protect.callback.annotateProtectReason(e);

		// sort out tagging options, disabled if nonexistent or lua
		if (mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto') {
			if (form.category.value === 'unprotect') {
				form.tagtype.value = 'none';
			} else {
				form.tagtype.value = item.template ? item.template : form.category.value;
			}
			Twinkle.protect.formevents.tagtype({ target: form.tagtype });

			// We only have one TE template at the moment, so this
			// should be expanded if more are added (e.g. pp-semi-template)
			if (mw.config.get('wgNamespaceNumber') !== 10) {
				form.noinclude.checked = false;
			}
		}

	} else {  // RPP request
		if (form.category.value === 'unprotect') {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.value = '';
			form.expiry.disabled = false;
		}
	}
};

Twinkle.protect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;
	var input = Morebits.quickForm.getInputData(form);

	var tagparams;
	if (input.actiontype === 'tag' || (input.actiontype === 'protect' && mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto')) {
		tagparams = {
			tag: input.tagtype,
			reason: (input.tagtype === 'full-agemeen' || input.tagtype === 'semi-algemeen' || input.tagtype === 'move-algemeen') && input.protectReason,
			small: input.small,
			noinclude: input.noinclude
		};
	}

	switch (input.actiontype) {
		case 'protect':
			// protect the page
			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = 'Beveiligen voltooid';

			var statusInited = false;
			var thispage;

			var allDone = function twinkleprotectCallbackAllDone() {
				if (thispage) {
					thispage.getStatusElement().info('done');
				}
			};

			var protectIt = function twinkleprotectCallbackProtectIt(next) {
				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Pagina beveiligen');
				if (mw.config.get('wgArticleId')) {
					if (input.editmodify) {
						thispage.setEditProtection(input.editlevel, input.editexpiry);
					}
					if (input.movemodify) {
						// Ensure a level has actually been chosen
						if (input.movelevel) {
							thispage.setMoveProtection(input.movelevel, input.moveexpiry);
						} else {
							alert('You must chose a move protection level!');
							return;
						}
					}
					thispage.setWatchlist(Twinkle.getPref('watchProtectedPages'));
				} else {
					thispage.setCreateProtection(input.createlevel, input.createexpiry);
					thispage.setWatchlist(false);
				}

				if (input.protectReason) {
					thispage.setEditSummary(input.protectReason);
				} else {
					alert('Je moet een reden opgeven, welke in het beveiligingslogboek wordt opgeslagen.');
					return;
				}

				if (input.protectReason_notes_rfppRevid && !/^\d+$/.test(input.protectReason_notes_rfppRevid)) {
					alert('Het gegeven oldid is onjuist, controleer het opgegeven oldid (ook wel revisionid genoemd).');
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.setChangeTags(Twinkle.changeTags);
				thispage.protect(next);
			};

			var stabilizeIt = function twinkleprotectCallbackStabilizeIt() {
				if (thispage) {
					thispage.getStatusElement().info('done');
				}

				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Applying pending changes protection');
				thispage.setFlaggedRevs(input.pclevel, input.pcexpiry);

				if (input.protectReason) {
					thispage.setEditSummary(input.protectReason + Twinkle.summaryAd); // flaggedrevs tag support: [[phab:T247721]]
				} else {
					alert('Je moet een reden opgeven, welke in het beveiligingslogboek wordt opgeslagen.');
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.setWatchlist(Twinkle.getPref('watchProtectedPages'));
				thispage.stabilize(allDone, function(error) {
					if (error.errorCode === 'stabilize_denied') { // [[phab:T234743]]
						thispage.getStatusElement().error('Failed trying to modify pending changes settings, likely due to a mediawiki bug. Other actions (tagging or regular protection) may have taken place. Please reload the page and try again.');
					}
				});
			};

			if (input.editmodify || input.movemodify || !mw.config.get('wgArticleId')) {
				if (input.pcmodify) {
					protectIt(stabilizeIt);
				} else {
					protectIt(allDone);
				}
			} else if (input.pcmodify) {
				stabilizeIt();
			} else {
				alert("Geef Twinkle iets te doen!");
			}

			break;


		case 'request':
			// file request at RFPP
			var typename, typereason;
			switch (input.category) {
				case 'full-algemeen':
				case 'full-bwo':
				case 'full-vandalisme':
				case 'full-recent':
				case 'full-veelbezocht':
				case 'full-spam':
				case 'full-archief':
					typename = 'volledige beveiliging';
					break;
				case 'semi-algemeen':
				case 'semi-vandalisme':
				case 'semi-blp':
				case 'semi-sokpop':
				case 'semi-recent':
				case 'semi-veelbezocht':
				case 'semi-spam':
					typename = 'semi-beveiliging';
					break;
				case 'move-algemeen':
				case 'move-bwo':
				case 'move-vandalisme':
				case 'move-veelbezocht':
					typename = 'verplaatsingsbeveiliging';
					break;
				case 'aanmaak-algemeen':
				case 'aanmaak-titel':
				case 'aanmaak-heraanmaak':
				case 'aanmaak-spam':
				case 'aanmaak-blp':
					typename = 'heraanmaakbeveiliging';
					break;
				case 'unprotect':
					var admins = $.map(Twinkle.protect.currentProtectionLevels, function(pl) {
						if (!pl.admin || Twinkle.protect.trustedBots.indexOf(pl.admin) !== -1) {
							return null;
						}
						return 'Gebruiker:' + pl.admin;
					});
					if (admins.length && !confirm('Heb je geprobeerd contact op te nemen met één van de mods die de beveiliging heeft uitgevoerd (' + Morebits.array.uniq(admins).join(', ') + ')?')) {
						return false;
					}
					// otherwise falls through
				default:
					typename = 'unprotection';
					break;
			}
			switch (input.category) {
				case 'full-bwo':
				case 'move-bwo':
					typereason = '[[WP:BWO|Bewerkingsoorlog]]';
					break;
				case 'full-vandalisme':
				case 'semi-vandalisme':
				case 'move-vandalisme':
					typereason = 'Voortdurend [[WP:Vandalisme|vandalisme]]';
					break;
				case 'full-spam':
				case 'semi-spam':
				case 'aanmaak-spam':
					typereason = 'Herhaaldelijke expliciete reclame, werving, propaganda of zelfpromotie';
					break;
				case 'full-recent':
				case 'semi-recent':
					typereason = 'Naar aanleiding van actualiteiten en recente ontwikkelingen';
					break;
				case 'aanmaak-titel':
					typereason = 'Voortdurende aanmaak van pagina met deze ongeschikte titel';
					break;
				case 'aanmaak-heraanmaak':
					typereason = 'Herhaaldelijk heraanmaken van verwijderde pagina';
					break;
				case 'semi-blp':
				case 'aanmaak-blp':
					typereason = 'Herhaaldelijke schending van richtlijn [[WP:BLP]]';
					break;
				case 'semi-sokpop':
					typereason = 'Misbruik door sokpoppen';
					break;
				case 'full-veelbezocht':
				case 'semi-veelbezocht':
				case 'move-veelbezocht':
					typereason = 'Preventieve beveiliging veelbezochte pagina';
					break;
				case 'full-archief':
					typereason = 'Archiefpagina';
					break;
				case 'unprotection':
					typereason = 'Beveiliging opheffen';
					break;
				default:
					typereason = '';
					break;
			}

			var reason = typereason;
			if (input.reason !== '') {
				if (typereason !== '') {
					reason += '\u00A0\u2013 ';  // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
				}
				reason += input.reason;
			}
			if (reason !== '' && reason.charAt(reason.length - 1) !== '.') {
				reason += '.';
			}

			var rppparams = {
				reason: reason,
				typename: typename,
				category: input.category,
				expiry: input.expiry
			};

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			var rppName = 'Wikipedia:Verzoekpagina voor moderatoren/Beveiligen';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = rppName;
			Morebits.wiki.actionCompleted.notice = 'Verzoek voltooid, doorsturen naar verzoekpagina';

			var rppPage = new Morebits.wiki.page(rppName, 'Beveiligingsverzoek indienen');
			rppPage.setFollowRedirect(true);
			rppPage.setCallbackParameters(rppparams);
			rppPage.load(Twinkle.protect.callbacks.fileRequest);
			break;
		default:
			alert('twinkleprotect: unknown kind of action');
			break;
	}
};

Twinkle.protect.protectReasonAnnotations = [];
Twinkle.protect.callback.annotateProtectReason = function twinkleprotectCallbackAnnotateProtectReason(e) {
	var form = e.target.form;
	var protectReason = form.protectReason.value.replace(new RegExp('(?:; )?' + mw.util.escapeRegExp(Twinkle.protect.protectReasonAnnotations.join(': '))), '');

	if (this.name === 'protectReason_notes_rfpp') {
		if (this.checked) {
			Twinkle.protect.protectReasonAnnotations.push(this.value);
			$(form.protectReason_notes_rfppRevid).parent().show();
		} else {
			Twinkle.protect.protectReasonAnnotations = [];
			form.protectReason_notes_rfppRevid.value = '';
			$(form.protectReason_notes_rfppRevid).parent().hide();
		}
	} else if (this.name === 'protectReason_notes_rfppRevid') {
		Twinkle.protect.protectReasonAnnotations = Twinkle.protect.protectReasonAnnotations.filter(function(el) {
			return el.indexOf('[[Speciaal:Permalink') === -1;
		});
		if (e.target.value.length) {
			var permalink = '[[Speciaal:Permalink/' + e.target.value + '#' + Morebits.pageNameNorm + ']]';
			Twinkle.protect.protectReasonAnnotations.push(permalink);
		}
	}

	if (!Twinkle.protect.protectReasonAnnotations.length) {
		form.protectReason.value = protectReason;
	} else {
		form.protectReason.value = (protectReason ? protectReason + '; ' : '') + Twinkle.protect.protectReasonAnnotations.join(': ');
	}
};

Twinkle.protect.callbacks = {
	fileRequest: function(rppPage) {

		var params = rppPage.getCallbackParameters();
		var text = rppPage.getPageText();
		var statusElement = rppPage.getStatusElement();

		var rppRe = new RegExp('==\\s*(\\[\\[)?\\s*:?\\s*' + Morebits.string.escapeRegExp(Morebits.pageNameNorm) + '\\s*(\\]\\])?\\s*==', 'm');
		var tag = rppRe.exec(text);

		var rppLink = document.createElement('a');
		rppLink.setAttribute('href', mw.util.getUrl(rppPage.getPageName()));
		rppLink.appendChild(document.createTextNode(rppPage.getPageName()));

		if (tag) {
			statusElement.error([ 'Er is al een verzoek voor deze pagina op ', rppLink, ', afbreken.' ]);
			return;
		}

		var newtag = '== [[:' + Morebits.pageNameNorm + ']] ==\n';
		if (new RegExp('^' + mw.util.escapeRegExp(newtag).replace(/\s+/g, '\\s*'), 'm').test(text)) {
			statusElement.error([ 'Er is al een verzoek voor deze pagina op  ', rppLink, ', afbreken.' ]);
			return;
		}
		//newtag += '* {{pagelinks|1=' + Morebits.pageNameNorm + '}}\n\n';

		var words;
		switch (params.expiry) {
			case 'temporary':
				words = 'Tijdelijke ';
				break;
			case 'infinity':
				words = 'Permanente ';
				break;
			default:
				words = '';
				break;
		}

		words += params.typename;

		newtag += "'''" + Morebits.string.toUpperCaseFirstChar(words) + (params.reason !== '' ? ":''' " +
			Morebits.string.formatReasonText(params.reason) : ".'''") + ' ~~~~';

		// If either protection type results in a increased status, then post it under increase
		// else we post it under decrease
		var increase = false;
		var protInfo = Twinkle.protect.protectionPresetsInfo[params.category];

		// function to compute protection weights (see comment at Twinkle.protect.protectionWeight)
		var computeWeight = function(mainLevel, stabilizeLevel) {
			var result = Twinkle.protect.protectionWeight[mainLevel || 'all'];
			if (stabilizeLevel) {
				if (result) {
					if (stabilizeLevel.level === 'autoconfirmed') {
						result += 2;
					}
				} else {
					result = Twinkle.protect.protectionWeight['flaggedrevs_' + stabilizeLevel];
				}
			}
			return result;
		};

		// compare the page's current protection weights with the protection we are requesting
		var editWeight = computeWeight(Twinkle.protect.currentProtectionLevels.edit &&
			Twinkle.protect.currentProtectionLevels.edit.level,
		Twinkle.protect.currentProtectionLevels.stabilize &&
			Twinkle.protect.currentProtectionLevels.stabilize.level);
		if (computeWeight(protInfo.edit, protInfo.stabilize) > editWeight ||
			computeWeight(protInfo.move) > computeWeight(Twinkle.protect.currentProtectionLevels.move &&
			Twinkle.protect.currentProtectionLevels.move.level) ||
			computeWeight(protInfo.create) > computeWeight(Twinkle.protect.currentProtectionLevels.create &&
			Twinkle.protect.currentProtectionLevels.create.level)) {
			increase = true;
		}

		var reg = /(\n=\s*Behandelde verzoeken\s*=)/;

		var originalTextLength = text.length;
		text = text.replace(reg, '\n' + newtag + '\n$1');
		if (text.length === originalTextLength) {
			var linknode = document.createElement('a');
			linknode.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing RPP'));
			linknode.appendChild(document.createTextNode('How to fix RPP'));
			statusElement.error([ 'Could not find relevant heading on WP:RPP. To fix this problem, please see ', linknode, '.' ]);
			return;
		}
		statusElement.status('Nieuw verzoek toevoegen...');
		rppPage.setEditSummary('/* ' + Morebits.pageNameNorm + ' */ Verzoek om ' + params.typename + (params.typename === 'pending changes' ? ' op [[:' : ' van [[:') +
			Morebits.pageNameNorm + ']].');
		rppPage.setChangeTags(Twinkle.changeTags);
		rppPage.setPageText(text);
		rppPage.setCreateOption('recreate');
		rppPage.save(function() {
			// Watch the page being requested
			var watchPref = Twinkle.getPref('watchRequestedPages');
			// action=watch has no way to rely on user preferences (T262912), so we do it manually.
			// The watchdefault pref appears to reliably return '1' (string),
			// but that's not consistent among prefs so might as well be "correct"
			var watch = watchPref !== 'no' && (watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
			if (watch) {
				var watch_query = {
					action: 'watch',
					titles: mw.config.get('wgPageName'),
					token: mw.user.tokens.get('watchToken')
				};
				// Only add the expiry if page is unwatched or already temporarily watched
				if (Twinkle.protect.watched !== true && watchPref !== 'default' && watchPref !== 'yes') {
					watch_query.expiry = watchPref;
				}
				new Morebits.wiki.api('Verzoekpagina op volglijst plaatsen', watch_query).post();
			}
		});
	}
};

Twinkle.addInitCallback(Twinkle.protect, 'protect');
})(jQuery);


// </nowiki>
