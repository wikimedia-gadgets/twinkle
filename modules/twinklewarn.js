// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              Any page with relevant user name (userspace, contribs,
 *                         etc.) (not IP ranges), as well as the rollback success page
 */

Twinkle.warn = function twinklewarn() {

	// Users and IPs but not IP ranges
	if (mw.config.exists('wgRelevantUserName') && !Morebits.ip.isRange(mw.config.get('wgRelevantUserName'))) {
		Twinkle.addPortletLink(Twinkle.warn.callback, 'Dossier', 'tw-warn', 'Gebruikersdossier aanmaken');
		if (Twinkle.getPref('autoMenuAfterRollback') &&
			mw.config.get('wgNamespaceNumber') === 3 &&
			mw.util.getParamValue('vanarticle') &&
			!mw.util.getParamValue('friendlywelcome') &&
			!mw.util.getParamValue('noautowarn')) {
			Twinkle.warn.callback();
		}
	}

	// Modify URL of talk page on rollback success pages, makes use of a
	// custom message box in [[MediaWiki:Rollback-success]]
	if (mw.config.get('wgAction') === 'rollback') {
		var $vandalTalkLink = $('#mw-rollback-success').find('.mw-usertoollinks a').first();
		if ($vandalTalkLink.length) {
			$vandalTalkLink.css('font-weight', 'bold');
			$vandalTalkLink.wrapInner($('<span/>').attr('title', 'Indien gepast, kun je de gebruiker een waarschuwing geven voor de bewerkingen op deze pagina.'));

			// Can't provide vanarticlerevid as only wgCurRevisionId is provided
			var extraParam = 'vanarticle=' + mw.util.rawurlencode(Morebits.pageNameNorm);
			var href = $vandalTalkLink.attr('href');
			if (href.indexOf('?') === -1) {
				$vandalTalkLink.attr('href', href + '?' + extraParam);
			} else {
				$vandalTalkLink.attr('href', href + '&' + extraParam);
			}
		}
	}
};

// Used to close window when switching to ARV in autolevel
Twinkle.warn.dialog = null;

Twinkle.warn.callback = function twinklewarnCallback() {
	if (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
		!confirm('Je staat op het punt een dossier tegen jezelf te maken.\nWeet je zeker dat je door wil gaan?')) {
		return;
	}

	var dialog;
	Twinkle.warn.dialog = new Morebits.simpleWindow(600, 440);
	dialog = Twinkle.warn.dialog;
	dialog.setTitle('Gebruikersdossier aanmaken');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Kies waarschuwingsniveau', 'WP:UWUL#Levels');
	dialog.addFooterLink('Dossier voorkeuren', 'WP:TW/PREF#warn');
	dialog.addFooterLink('Twinkle help', 'WP:TW/DOC#warn');
	dialog.addFooterLink('Geef feedback', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.warn.callback.evaluate);
	var main_select = form.append({
		type: 'field',
		label: 'Kies het type waarschuwing dat je aan het dossier wil toevoegen',
		tooltip: 'Kies eerst de groep, en dan de specifieke waarschuwing.'
	});

	var main_group = main_select.append({
		type: 'select',
		name: 'main_group',
		tooltip: 'Je kunt de standaardkeuze aanpassen op het Twinkle configuratiescherm',
		event: Twinkle.warn.callback.change_category
	});

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append({ type: 'option', label: 'Automatisch selecteren (Niveau 1-4)', value: 'autolevel', selected: defaultGroup === 11 });
	main_group.append({ type: 'option', label: 'Niveau 1: Mededeling', value: 'level1', selected: defaultGroup === 1 });
	main_group.append({ type: 'option', label: 'Niveau 2: Berisping', value: 'level2', selected: defaultGroup === 2 });
	main_group.append({ type: 'option', label: 'Niveau 3: Waarschuwing', value: 'level3', selected: defaultGroup === 3 });
	main_group.append({ type: 'option', label: 'Niveau 4: Laatste waarschuwing', value: 'level4', selected: defaultGroup === 4 });
	main_group.append({ type: 'option', label: 'Niveau E: Enige waarschuwing', value: 'level4im', selected: defaultGroup === 5 });
	if (Twinkle.getPref('customWarningList').length) {
		main_group.append({ type: 'option', label: 'Aangepaste dossier-sjablonen', value: 'custom', selected: defaultGroup === 9 });
	}
	main_group.append({ type: 'option', label: 'Alle dossier-sjablonen', value: 'kitchensink', selected: defaultGroup === 10 });

	main_select.append({ type: 'select', name: 'sub_group', event: Twinkle.warn.callback.change_subcategory }); // Will be empty to begin with.

	form.append({
		type: 'input',
		name: 'article',
		label: 'Betrokken pagina',
		value: mw.util.getParamValue('vanarticle') || '',
		tooltip: 'Welke pagina, waarop de gebruiker een bewerking heeft gedaan, is de aanleiding geweest om het dossier aan te maken.'
	});

	form.append({
		type: 'div',
		label: '',
		style: 'color: red',
		id: 'twinkle-warn-warning-messages'
	});


	var more = form.append({ type: 'field', name: 'reasonGroup', label: 'Dossier informatie' });
	more.append({ type: 'textarea', label: 'Extra informatie (optioneel):', name: 'reason', tooltip: 'Bijvoorbeeld een meer gedetailleerde uitleg' });

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Voorvertoning';
	more.append({ type: 'div', id: 'warningpreview', label: [ previewlink ] });
	more.append({ type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' });

	more.append({ type: 'submit', label: 'Publiceren' });

	var result = form.render();
	dialog.setContent(result);
	dialog.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// Potential notices for staleness and missed reverts
	var vanrevid = mw.util.getParamValue('vanarticlerevid');
	if (vanrevid) {
		var message = '';
		var query = {};

		// If you tried reverting, check if *you* actually reverted
		if (!mw.util.getParamValue('noautowarn') && mw.util.getParamValue('vanarticle')) { // Via fluff link
			query = {
				action: 'query',
				titles: mw.util.getParamValue('vanarticle'),
				prop: 'revisions',
				rvstartid: vanrevid,
				rvlimit: 2,
				rvdir: 'newer',
				rvprop: 'user',
				format: 'json'
			};

			new Morebits.wiki.api('Checking if you successfully reverted the page', query, function(apiobj) {
				var rev = apiobj.getResponse().query.pages[0].revisions;
				var revertUser = rev && rev[1].user;
				if (revertUser && revertUser !== mw.config.get('wgUserName')) {
					message += ' Iemand anders heeft de terugdraaiing uitgevoerd, en heeft de gebruiker hier mogelijk al voor gewaarschuwd.';
					$('#twinkle-warn-warning-messages').text('Note:' + message);
				}
			}).post();
		}

		// Confirm edit wasn't too old for a warning
		var checkStale = function(vantimestamp) {
			var revDate = new Morebits.date(vantimestamp);
			if (vantimestamp && revDate.isValid()) {
				if (revDate.add(72, 'hours').isBefore(new Date())) {
					message += ' Deze bewerking was meer dan 3 dagen geleden, het is misschien een beetje laat om hiervoor nog te waarschuwen.';
					$('#twinkle-warn-warning-messages').text('Note:' + message);
				}
			}
		};

		var vantimestamp = mw.util.getParamValue('vantimestamp');
		// Provided from a fluff module-based revert, no API lookup necessary
		if (vantimestamp) {
			checkStale(vantimestamp);
		} else {
			query = {
				action: 'query',
				prop: 'revisions',
				rvprop: 'timestamp',
				revids: vanrevid,
				format: 'json'
			};
			new Morebits.wiki.api('Tijdstempel van bewerking ophalen', query, function(apiobj) {
				var rev = apiobj.getResponse().query.pages[0].revisions;
				vantimestamp = rev && rev[0].timestamp;
				checkStale(vantimestamp);
			}).post();
		}
	}


	// We must init the first choice (General Note);
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.main_group.dispatchEvent(evt);
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with "."
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	levels: {
		'Veel voorkomend': {
			'ws-vandalisme': {
				level1: {
					label: 'Geen positieve bijdrage',
					summary: '+ws1 vandalisme'
				},
				level2: {
					label: 'Geen positieve bijdrage',
					summary: '+ws2 vandalisme'
				},
				level3: {
					label: 'Vandalisme',
					summary: '+ws3 vandalisme'
				},
				level4: {
					label: 'Herhaald vandalisme',
					summary: '+ws4 vandalisme'
				}
			},
			'ws-onzinpagina': {
				level1: {
					label: 'Aanmaken onzinpagina',
					summary: '+ws1 onzinpagina'
				},
				level2: {
					label: 'Aanmaken onzinpagina',
					summary: '+ws2 onzinpagina'
				},
				level3: {
					label: 'Herhaald aanmaken onzinpagina',
					summary: '+ws3 onzinpagina'
				},
				level4: {
					label: 'Herhaald aanmaken onzinpagina',
					summary: '+ws4 onzinpagina'
				}
			},
			'ws-zelfpromotie': {
				level1: {
					label: 'Zelfpromotie/Reclame',
					summary: '+ws1 zelfpromotie'
				},
				level2: {
					label: 'Zelfpromotie/Reclame',
					summary: '+ws2 zelfpromotie'
				},
				level3: {
					label: 'Spammen',
					summary: '+ws3 zelfpromotie'
				},
				level4: {
					label: 'Herhaald/doorgaand spammen',
					summary: '+ws4 zelfpromotie'
				}
			},
			'ws-geklieder': {
				level1: {
					label: 'Ongewenste oefenbewerking',
					summary: '+ws1 geklieder'
				},
				level2: {
					label: 'Geklieder',
					summary: '+ws2 geklieder'
				}
			},
			'ws-leeghalen': {
				level1: {
					label: 'Content weghalen',
					summary: '+ws1 leeghalen'
				},
				level2: {
					label: 'Content weghalen/pagina leeghalen',
					summary: '+ws2 leeghalen'
				},
				level3: {
					label: 'Herhaald content weghalen/pagina leeghalen',
					summary: '+ws3 leeghalen'
				},
				level4: {
					label: 'Herhaald leeghalen',
					summary: '+ws4 leeghalen'
				}
			},
			'ws-cyberpesten': {
				level2: {
					label: 'Cyberpesten',
					summary: '+ws2 cyberpesten'
				},
				level3: {
					label: 'Cyberpesten',
					summary: '+ws3 cyberpesten'
				},
				level4: {
					label: 'Cyberpesten',
					summary: '+ws4 cyberpesten'
				},
				level4im: {
					label: 'Vergaand cyberpesten',
					summary: '+wsE cyberpesten'
				}
			}
		},
		'Overig': {
			'ws-blp': {
				level1: {
					label: 'Onbebronde informatie over levende personen',
					summary: '+ws1 blp'
				},
				level2: {
					label: 'Onbebronde informatie over levende personen',
					summary: '+ws2 blp'
				},
				level3: {
					label: 'Onbebronde informatie over levende personen',
					summary: '+ws3 blp'
				}
			},
			'ws-bwo': {
				level1: {
					label: 'Ongewenste terugdraaiing',
					summary: '+ws1 ongewenste terugdraaiing'
				},
				level2: {
					label: 'Ongewenste terugdraaiing',
					summary: '+ws2 ongewenste terugdraaiing'
				},
				level3: {
					label: 'Bewerkingsoorlog',
					summary: '+ws3 bewerkingsoorlog'
				},
				level4: {
					label: 'Bewerkingsoorlog',
					summary: '+ws4 bewerkingsoorlog'
				},
				level4im: {
					label: 'Vergaande bewerkingsoorlog',
					summary: '+wsE bewerkingsoorlog'
				}
			},
			'ws-copyvio': {
				level1: {
					label: 'Auteursrechtenschening',
					summary: '+ws1 copyvio'
				},
				level2: {
					label: 'Auteursrechtenschening',
					summary: '+ws2 copyvio'
				},
				level3: {
					label: 'Herhaalde auteursrechtenschening',
					summary: '+ws3 copyvio'
				},
				level4: {
					label: 'Herhaalde auteursrechtenschening',
					summary: '+ws4 copyvio'
				}
			},
			'ws-verstoring': {
				level1: {
					label: 'Projectverstorend gedrag',
					summary: '+ws1 verstoring'
				},
				level2: {
					label: 'Projectverstorend gedrag',
					summary: '+ws2 verstoring'
				},
				level3: {
					label: 'Projectverstorend gedrag',
					summary: '+ws3 verstoring'
				},
				level4: {
					label: 'Herhaald projectverstorend gedrag',
					summary: '+ws4 verstoring'
				},
				level4im: {
					label: 'Ernstig projectverstorend gedrag',
					summary: '+wsE verstoring'
				}
			},
			'ws-aanval': {
				level4im: {
					label: 'Persoonsaanval/Bedreiging',
					summary: '+wsE persoonsaanval/bedreiging'
				}
			}
		}
	}
};

// Used repeatedly below across menu rebuilds
Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;
Twinkle.warn.talkpageObj = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if (old_subvalue) {
		if (value === 'kitchensink') { // Exact match possible in kitchensink menu
			old_subvalue_re = new RegExp(mw.util.escapeRegExp(old_subvalue));
		} else {
			old_subvalue = old_subvalue.replace(/\d*(im)?$/, '');
			old_subvalue_re = new RegExp(mw.util.escapeRegExp(old_subvalue) + '(\\d*(?:im)?)$');
		}
	}

	while (sub_group.hasChildNodes()) {
		sub_group.removeChild(sub_group.firstChild);
	}

	var selected = false;
	// worker function to create the combo box entries
	var createEntries = function(contents, container, wrapInOptgroup, val) {
		val = typeof val !== 'undefined' ? val : value; // IE doesn't support default parameters
		// level2->2, singlewarn->''; also used to distinguish the
		// scaled levels from singlenotice, singlewarn, and custom
		var level = val.replace(/^\D+/g, '');
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if (wrapInOptgroup && $.client.profile().platform === 'iphone') {
			var wrapperOptgroup = new Morebits.quickForm.element({
				type: 'optgroup',
				label: 'Available templates'
			});
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild(wrapperOptgroup);
			container = wrapperOptgroup;
		}

		$.each(contents, function(itemKey, itemProperties) {
			// Skip if the current template doesn't have a version for the current level
			if (!!level && !itemProperties[val]) {
				return;
			}
			var key = typeof itemKey === 'string' ? itemKey : itemProperties.value;
			var template = key + level;

			var elem = new Morebits.quickForm.element({
				type: 'option',
				label: '{{' + template + '}}: ' + (level ? itemProperties[val].label : itemProperties.label),
				value: template
			});

			// Select item best corresponding to previous selection
			if (!selected && old_subvalue && old_subvalue_re.test(template)) {
				elem.data.selected = selected = true;
			}
			var elemRendered = container.appendChild(elem.render());
			$(elemRendered).data('messageData', itemProperties);
		});
	};
	var createGroup = function(warnGroup, label, wrapInOptgroup, val) {
		wrapInOptgroup = typeof wrapInOptgroup !== 'undefined' ? wrapInOptgroup : true;
		var optgroup = new Morebits.quickForm.element({
			type: 'optgroup',
			label: label
		});
		optgroup = optgroup.render();
		sub_group.appendChild(optgroup);
		createEntries(warnGroup, optgroup, wrapInOptgroup, val);
	};

	switch (value) {
		case 'custom':
			createEntries(Twinkle.getPref('customWarningList'), sub_group, true);
			break;
		case 'kitchensink':
			['level1', 'level2', 'level3', 'level4', 'level4im'].forEach(function(lvl) {
				$.each(Twinkle.warn.messages.levels, function(levelGroupLabel, levelGroup) {
					createGroup(levelGroup, 'Level ' + lvl.slice(5) + ': ' + levelGroupLabel, true, lvl);
				});
			});
			createGroup(Twinkle.getPref('customWarningList'), 'Aangepaste sjablonen');
			break;
		case 'level1':
		case 'level2':
		case 'level3':
		case 'level4':
		case 'level4im':
			// Creates subgroup regardless of whether there is anything to place in it;
			// leaves "Removal of deletion tags" empty for 4im
			$.each(Twinkle.warn.messages.levels, function(groupLabel, groupContents) {
				createGroup(groupContents, groupLabel, false);
			});
			break;
		case 'autolevel':
			// Check user page to determine appropriate level
			var autolevelProc = function() {
				var wikitext = Twinkle.warn.talkpageObj.getPageText();
				// history not needed for autolevel
				var latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
				// Pseudo-params with only what's needed to parse the level i.e. no messageData
				var params = {
					sub_group: old_subvalue,
					article: e.target.root.article.value
				};
				var lvl = 'niveau' + Twinkle.warn.callbacks.autolevelParseWikitext(wikitext, params, latest)[1];

				// Identical to level1, etc. above but explicitly provides the level
				$.each(Twinkle.warn.messages.levels, function(groupLabel, groupContents) {
					createGroup(groupContents, groupLabel, false, lvl);
				});

				// Trigger subcategory change, add select menu, etc.
				Twinkle.warn.callback.postCategoryCleanup(e);
			};


			if (Twinkle.warn.talkpageObj) {
				autolevelProc();
			} else {
				var usertalk_page = new Morebits.wiki.page('User_talk:' + mw.config.get('wgRelevantUserName'), 'Voorgaande waarschuwingen laden');
				usertalk_page.setFollowRedirect(true, false);
				usertalk_page.load(function(pageobj) {
					Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj
					autolevelProc();
				}, function() {
					// Catch and warn if the talkpage can't load,
					// most likely because it's a cross-namespace redirect
					// Supersedes the typical $autolevelMessage added in autolevelParseWikitext
					var $noTalkPageNode = $('<strong/>', {
						text: 'Overlegpagina kan niet worden geladen; mogelijk heeft de overlegpagina een crosswiki/crossnaamruimte doorverwijzing.',
						id: 'twinkle-warn-autolevel-message',
						css: {color: 'red' }
					});
					$noTalkPageNode.insertBefore($('#twinkle-warn-warning-messages'));
					// If a preview was opened while in a different mode, close it
					// Should nullify the need to catch the error in preview callback
					e.target.root.previewer.closePreview();
				});
			}
			break;
		default:
			alert('Waarschuwing onbekent in twinklewarn');
			break;
	}

	// Trigger subcategory change, add select menu, etc.
	// Here because of the async load for autolevel
	if (value !== 'autolevel') {
		// reset any autolevel-specific messages while we're here
		$('#twinkle-warn-autolevel-message').remove();

		Twinkle.warn.callback.postCategoryCleanup(e);
	}
};

Twinkle.warn.callback.postCategoryCleanup = function twinklewarnCallbackPostCategoryCleanup(e) {
	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);
	// Trigger custom label/change on main category change
	Twinkle.warn.callback.change_subcategory(e);

	// Use select2 to make the select menu searchable
	if (!Twinkle.getPref('oldSelect')) {
		$('select[name=sub_group]')
			.select2({
				width: '100%',
				matcher: Morebits.select2.matchers.optgroupFull,
				templateResult: Morebits.select2.highlightSearchMatches,
				language: {
					searching: Morebits.select2.queryInterceptor
				}
			})
			.change(Twinkle.warn.callback.change_subcategory);

		$('.select2-selection').keydown(Morebits.select2.autoStart).focus();

		mw.util.addCSS(
			// Increase height
			'.select2-container .select2-dropdown .select2-results > .select2-results__options { max-height: 350px; }' +

			// Reduce padding
			'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
			'.select2-results .select2-results__group { padding-top: 1px; padding-bottom: 1px; } ' +

			// Adjust font size
			'.select2-container .select2-dropdown .select2-results { font-size: 13px; }' +
			'.select2-container .selection .select2-selection__rendered { font-size: 13px; }'
		);
	}
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	// Tags that don't take a linked article, but something else (often a username).
	// The value of each tag is the label next to the input field
	var notLinkedArticle = {
		'uw-agf-sock': 'Optional username of other account (without User:) ',
		'uw-bite': "Username of 'bitten' user (without User:) ",
		'uw-socksuspect': 'Username of sock master, if known (without User:) ',
		'uw-username': 'Username violates policy because... ',
		'uw-aiv': 'Optional username that was reported (without User:) '
	};

	if (['singlenotice', 'singlewarn', 'singlecombined', 'kitchensink'].indexOf(main_group) !== -1) {
		if (notLinkedArticle[value]) {
			if (Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';

			// change form labels according to the warning selected
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
			Morebits.quickForm.overrideElementLabel(e.target.form.article, notLinkedArticle[value]);
		} else if (e.target.form.article.notArticle) {
			if (Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
			Morebits.quickForm.resetElementLabel(e.target.form.article);
		}
	}

	// add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
	$('#tw-warn-red-notice').remove();
	var $redWarning;
	if (value === 'uw-username') {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			'{{uw-username}} should only be used in edge cases in order to engage in discussion with the user.</div>');
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	} else if (value === 'uw-coi-username') {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-coi-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			'{{uw-coi-username}} should only be used in edge cases in order to engage in discussion with the user.</div>');
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	}
};

Twinkle.warn.callbacks = {
	getWarningWikitext: function(templateName, article, reason, isCustom) {
		var text = '{{subst:' + templateName;

		// add linked article for user warnings
		if (article) {
			// c&pmove has the source as the first parameter
			if (templateName === 'uw-c&pmove') {
				text += '|to=' + article;
			} else {
				text += '|1=' + article;
			}
		}
		if (reason && !isCustom) {
			// add extra message
			if (templateName === 'uw-csd' || templateName === 'uw-probation' ||
				templateName === 'uw-userspacenoindex' || templateName === 'uw-userpage') {
				text += "|3=''" + reason + "''";
			} else {
				text += "|2=''" + reason + "''";
			}
		}
		text += '}}';

		if (reason && isCustom) {
			// we assume that custom warnings lack a {{{2}}} parameter
			text += " ''" + reason + "''";
		}

		return text + ' ~~~~';
	},
	showPreview: function(form, templatename) {
		var input = Morebits.quickForm.getInputData(form);
		// Provided on autolevel, not otherwise
		templatename = templatename || input.sub_group;
		var linkedarticle = input.article;
		var templatetext;

		templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle,
			input.reason, input.main_group === 'custom');

		form.previewer.beginRender(templatetext, 'Overleg_gebruiker:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
	},
	// Just a pass-through unless the autolevel option was selected
	preview: function(form) {
		if (form.main_group.value === 'autolevel') {
			// Always get a new, updated talkpage for autolevel processing
			var usertalk_page = new Morebits.wiki.page('Overleg_gebruiker:' + mw.config.get('wgRelevantUserName'), 'Voorgaande waarschuwingen inladen');
			usertalk_page.setFollowRedirect(true, false);
			// Will fail silently if the talk page is a cross-ns redirect,
			// removal of the preview box handled when loading the menu
			usertalk_page.load(function(pageobj) {
				Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj

				var wikitext = pageobj.getPageText();
				// history not needed for autolevel
				var latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
				var params = {
					sub_group: form.sub_group.value,
					article: form.article.value,
					messageData: $(form.sub_group).find('option[value="' + $(form.sub_group).val() + '"]').data('messageData')
				};
				var template = Twinkle.warn.callbacks.autolevelParseWikitext(wikitext, params, latest)[0];
				Twinkle.warn.callbacks.showPreview(form, template);

				// If the templates have diverged, fake a change event
				// to reload the menu with the updated pageobj
				if (form.sub_group.value !== template) {
					var evt = document.createEvent('Event');
					evt.initEvent('change', true, true);
					form.main_group.dispatchEvent(evt);
				}
			});
		} else {
			Twinkle.warn.callbacks.showPreview(form);
		}
	},
	/**
	* Used in the main and autolevel loops to determine when to warn
	* about excessively recent, stale, or identical warnings.
	* @param {string} wikitext  The text of a user's talk page, from getPageText()
	* @returns {Object[]} - Array of objects: latest contains most recent
	* warning and date; history lists all prior warnings
	*/
	dateProcessing: function(wikitext) {
		var history_re = /<!--\s?Template:([uU]w-.*?)\s?-->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4} \(UTC\))/g;
		var history = {};
		var latest = { date: new Morebits.date(0), type: '' };
		var current;

		while ((current = history_re.exec(wikitext)) !== null) {
			var template = current[1], current_date = new Morebits.date(current[2]);
			if (!(template in history) || history[template].isBefore(current_date)) {
				history[template] = current_date;
			}
			if (!latest.date.isAfter(current_date)) {
				latest.date = current_date;
				latest.type = template;
			}
		}
		return [latest, history];
	},
	/**
	* Main loop for deciding what the level should increment to. Most of
	* this is really just error catching and updating the subsequent data.
	* May produce up to two notices in a twinkle-warn-autolevel-messages div
	*
	* @param {string} wikitext  The text of a user's talk page, from getPageText() (required)
	* @param {Object} params  Params object: sub_group is the template (required);
	* article is the user-provided article (form.article) used to link ARV on recent level4 warnings;
	* messageData is only necessary if getting the full template, as it's
	* used to ensure a valid template of that level exists
	* @param {Object} latest  First element of the array returned from
	* dateProcessing. Provided here rather than processed within to avoid
	* repeated call to dateProcessing
	* @param {(Date|Morebits.date)} date  Date from which staleness is determined
	* @param {Morebits.status} statelem  Status element, only used for handling error in final execution
	*
	* @returns {Array} - Array that contains the full template and just the warning level
	*/
	autolevelParseWikitext: function(wikitext, params, latest, date, statelem) {
		var level; // undefined rather than '' means the isNaN below will return true
		if (/\d(?:im)?$/.test(latest.type)) { // level1-4im
			level = parseInt(latest.type.replace(/.*(\d)(?:im)?$/, '$1'), 10);
		} else if (latest.type) { // Non-numbered warning
			// Try to leverage existing categorization of
			// warnings, all but one are universally lowercased
			var loweredType = /uw-multipleIPs/i.test(latest.type) ? 'uw-multipleIPs' : latest.type.toLowerCase();
			// It would be nice to account for blocks, but in most
			// cases the hidden message is terminal, not the sig
			if (Twinkle.warn.messages.singlewarn[loweredType]) {
				level = 3;
			} else {
				level = 1; // singlenotice or not found
			}
		}

		var $autolevelMessage = $('<div/>', {id: 'twinkle-warn-autolevel-message'});

		if (isNaN(level)) { // No prior warnings found, this is the first
			level = 1;
		} else if (level > 4 || level < 1) { // Shouldn't happen
			var message = 'Vorig waarschuwingsniveau kan niet worden geladen, kies niveau handmatig.';
			if (statelem) {
				statelem.error(message);
			} else {
				alert(message);
			}
			return;
		} else {
			date = date || new Date();
			var autoTimeout = new Morebits.date(latest.date.getTime()).add(parseInt(Twinkle.getPref('autolevelStaleDays'), 14), 'days');
			if (autoTimeout.isAfter(date)) {
				if (level === 4) {
					level = 4;
					// Basically indicates whether we're in the final Main evaluation or not,
					// and thus whether we can continue or need to display the warning and link
					if (!statelem) {
						var $link = $('<a/>', {
							href: '#',
							text: 'klik hier om deze gebruiker te melden.',
							css: { fontWeight: 'bold' },
							click: function() {
								Morebits.wiki.actionCompleted.redirect = null;
								Twinkle.warn.dialog.close();
								Twinkle.arv.callback(mw.config.get('wgRelevantUserName'));
								$('input[name=page]').val(params.article); // Target page
								$('input[value=final]').prop('checked', true); // Vandalism after final
							}
						});
						var statusNode = $('<div/>', {
							text: mw.config.get('wgRelevantUserName') + ' heeft recent een niveau 4 (' + latest.type + ') waarschuwing ontvangen, dus misschien is een blokverzoek zinvoller; ',
							css: {color: 'red' }
						});
						statusNode.append($link[0]);
						$autolevelMessage.append(statusNode);
					}
				} else { // Automatically increase severity
					level += 1;
				}
			} else { // Reset warning level if most-recent warning is too old
				level = 1;
			}
		}

		$autolevelMessage.prepend($('<div>Een <span style="font-weight: bold;">niveau ' + level + '</span> sjabloon wordt gebruikt.</div>'));
		// Place after the stale and other-user-reverted (text-only) messages
		$('#twinkle-warn-autolevel-message').remove(); // clean slate
		$autolevelMessage.insertAfter($('#twinkle-warn-warning-messages'));

		var template = params.sub_group.replace(/(.*)\d$/, '$1');
		// Validate warning level, falling back to the uw-generic series.
		// Only a few items are missing a level, and in all but a handful
		// of cases, the uw-generic series is explicitly used elsewhere per WP:UTM.
		if (params.messageData && !params.messageData['level' + level]) {
			template = 'uw-generic';
		}
		template += level;

		return [template, level];
	},
	main: function(pageobj) {
		var text = pageobj.getPageText();
		var statelem = pageobj.getStatusElement();
		var params = pageobj.getCallbackParameters();
		var messageData = params.messageData;

		// JS somehow didn't get destructured assignment until ES6 so of course IE doesn't support it
		var warningHistory = Twinkle.warn.callbacks.dateProcessing(text);
		var latest = warningHistory[0];
		var history = warningHistory[1];

		var now = new Morebits.date(pageobj.getLoadTime());

		Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj, just in case
		if (params.main_group === 'autolevel') {
			// [template, level]
			var templateAndLevel = Twinkle.warn.callbacks.autolevelParseWikitext(text, params, latest, now, statelem);

			// Only if there's a change from the prior display/load
			if (params.sub_group !== templateAndLevel[0] && !confirm('Sjabloon {{' + templateAndLevel[0] + '}} wordt toegevoegd aan dossier, oké?')) {
				statelem.error('afgebroken door gebruiker');
				return;
			}
			// Update params now that we've selected a warning
			params.sub_group = templateAndLevel[0];
			messageData = params.messageData['level' + templateAndLevel[1]];
		} else if (params.sub_group in history) {
			if (new Morebits.date(history[params.sub_group]).add(1, 'day').isAfter(now)) {
				if (!confirm('Een identieke ' + params.sub_group + ' is de afgelopen 24uur geplaatst.  \nWeet je zeker dat je dit wil toevoegen?')) {
					statelem.error('afgebroken door gebruiker');
					return;
				}
			}
		}

		latest.date.add(1, 'minute'); // after long debate, one minute is max

		if (latest.date.isAfter(now)) {
			if (!confirm('Een ' + latest.type + ' is de afgelopen minuut geplaatst.  \nWeet je zeker dat je dit wil toevoegen?')) {
				statelem.error('afgebroken door gebruiker');
				return;
			}
		}

		// build the edit summary
		// Function to handle generation of summary prefix for custom templates
		var customProcess = function(template) {
			template = template.split('|')[0];
			var prefix;
			switch (template.substr(-1)) {
				case '1':
					prefix = 'Mededeling';
					break;
				case '2':
					prefix = 'Berisping';
					break;
				case '3':
					prefix = 'Waarschuwing';
					break;
				case '4':
					prefix = 'Laatste waarschuwing';
					break;
				case 'm':
					if (template.substr(-3) === '4im') {
						prefix = 'Enige waarschuwing';
						break;
					}
					// falls through
				default:
					prefix = 'Mededeling';
					break;
			}
			return prefix + ': ' + Morebits.string.toUpperCaseFirstChar(messageData.label);
		};

		var summary;
		if (params.main_group === 'custom') {
			summary = customProcess(params.sub_group);
		} else {
			// Normalize kitchensink to the 1-4im style
			if (params.main_group === 'kitchensink' && !/^D+$/.test(params.sub_group)) {
				var sub = params.sub_group.substr(-1);
				if (sub === 'm') {
					sub = params.sub_group.substr(-3);
				}
				// Don't overwrite uw-3rr, technically unnecessary
				if (/\d/.test(sub)) {
					params.main_group = 'level' + sub;
				}
			}
			// singlet || level1-4im, no need to /^\D+$/.test(params.main_group)
			summary = messageData.summary || (messageData[params.main_group] && messageData[params.main_group].summary);
			// Not in Twinkle.warn.messages, assume custom template
			if (!summary) {
				summary = customProcess(params.sub_group);
			}
			if (messageData.suppressArticleInSummary !== true && params.article) {
				if (params.sub_group === 'uw-agf-sock' ||
						params.sub_group === 'uw-socksuspect' ||
						params.sub_group === 'uw-aiv') {  // these templates require a username
					summary += ' of [[:Gebruiker:' + params.article + ']]';
				} else {
					summary += ' on [[:' + params.article + ']]';
				}
			}
		}

		pageobj.setEditSummary(summary + '.');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));


		// Get actual warning text
		var warningText = Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article,
			params.reason, params.main_group === 'custom');
		if (Twinkle.getPref('showSharedIPNotice') && mw.util.isIPAddress(mw.config.get('wgTitle'))) {
			Morebits.status.info('Info', 'Voeg gedeeld IP mededeling toe');
			warningText += '\n{{subst:Shared IP advice}}';
		}

		var sectionExists = false, sectionNumber = 0;
		// Only check sections if there are sections or there's a chance we won't create our own
		if (!messageData.heading && text.length) {
			// Get all sections
			var sections = text.match(/^(==*).+\1/gm);
			if (sections && sections.length !== 0) {
				// Find the index of the section header in question
				var dateHeaderRegex = now.monthHeaderRegex();
				sectionNumber = 0;
				// Find this month's section among L2 sections, preferring the bottom-most
				sectionExists = sections.reverse().some(function(sec, idx) {
					return /^(==)[^=].+\1/m.test(sec) && dateHeaderRegex.test(sec) && typeof (sectionNumber = sections.length - 1 - idx) === 'number';
				});
			}
		}

		if (sectionExists) { // append to existing section
			pageobj.setPageSection(sectionNumber + 1);
			pageobj.setAppendText('\n\n' + warningText);
			pageobj.append();
		} else {
			if (messageData.heading) { // create new section
				pageobj.setNewSectionTitle(messageData.heading);
			} else {
				Morebits.status.info('Info', 'Overlegpagina wordt aangemaakt omdat geen bestaande overlegpagina is gevonden');
				pageobj.setNewSectionTitle(now.monthHeader());
			}
			pageobj.setNewSectionText(warningText);
			pageobj.newSection();
		}
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {
	var userTalkPage = 'Overleg_gebruiker:' + mw.config.get('wgRelevantUserName');

	// reason, main_group, sub_group, article
	var params = Morebits.quickForm.getInputData(e.target);

	// Check that a reason was filled in if uw-username was selected
	if (params.sub_group === 'uw-username' && !params.article) {
		alert('Je moet een reden opgeven voor het {{uw-username}} sjabloon.');
		return;
	}

	// The autolevel option will already know by now if a user talk page
	// is a cross-namespace redirect (via !!Twinkle.warn.talkpageObj), so
	// technically we could alert an error here, but the user will have
	// already ignored the bold red error above.  Moreover, they probably
	// *don't* want to actually issue a warning, so the error handling
	// after the form is submitted is probably preferable

	// Find the selected <option> element so we can fetch the data structure
	var $selectedEl = $(e.target.sub_group).find('option[value="' + $(e.target.sub_group).val() + '"]');
	params.messageData = $selectedEl.data('messageData');

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Dossier bijgewerkt, pagina wordt over enkele seconde ververst';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'Overlegpagina bijwerken');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.setFollowRedirect(true, false);
	wikipedia_page.load(Twinkle.warn.callbacks.main);
};

Twinkle.addInitCallback(Twinkle.warn, 'warn');
})(jQuery);


// </nowiki>
