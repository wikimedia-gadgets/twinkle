// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.speedy.callback, 'Nuweg', 'tw-csd', Morebits.userIsSysop ? 'Delete page according to WP:CSD' : 'Request speedy deletion according to WP:CSD');
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsSysop ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

// Used by unlink feature
Twinkle.speedy.dialog = null;
// Used throughout
Twinkle.speedy.hasCSD = !!$('#delete-reason').length;

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	Twinkle.speedy.dialog = new Morebits.simpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
	dialog = Twinkle.speedy.dialog;
	dialog.setTitle('Kies een reden voor directe verwijdering');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Directe verwijderingsrichtlijnen', 'WP:RVM#Een_pagina_direct_verwijderen');
	dialog.addFooterLink('Nuweg voorkeuren', 'WP:TW/PREF#speedy');
	dialog.addFooterLink('Twinkle help', 'WP:TW/DOC#speedy');
	dialog.addFooterLink('Geef feedback', 'WT:TW');

	var form = new Morebits.quickForm(callbackfunc, Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);
	if (Morebits.userIsSysop) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Enkel nomineren, niet zelf verwijderen',
					value: 'tag_only',
					name: 'tag_only',
					tooltip: 'Voor als je een collega-mod het vuile werk wil laten opknappen...',
					checked: !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
					event: function(event) {
						var cForm = event.target.form;
						var cChecked = event.target.checked;
						// enable talk page checkbox
						if (cForm.talkpage) {
							cForm.talkpage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
						}
						// enable redirects checkbox
						cForm.redirects.checked = !cChecked;
						// enable delete multiple
						cForm.delmultiple.checked = false;
						// enable notify checkbox
						cForm.notify.checked = cChecked;
						// enable deletion notification checkbox
						cForm.warnusertalk.checked = !cChecked && !Twinkle.speedy.hasCSD;
						// enable multiple
						cForm.multiple.checked = false;
						// enable requesting creation protection
						cForm.salting.checked = false;

						Twinkle.speedy.callback.modeChanged(cForm);

						event.stopPropagation();
					}
				}
			]
		});

		var deleteOptions = form.append({
			type: 'div',
			name: 'delete_options'
		});
		deleteOptions.append({
			type: 'header',
			label: 'Verwijder opties'
		});
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) {  // hide option for user pages, to avoid accidentally deleting user talk page
			deleteOptions.append({
				type: 'checkbox',
				list: [
					{
						label: 'Verwijder ook overlegpagina',
						value: 'talkpage',
						name: 'talkpage',
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						event: function(event) {
							event.stopPropagation();
						}
					}
				]
			});
		}
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: 'Verwijder alle doorverwijzingen',
					value: 'redirects',
					name: 'redirects',
					tooltip: 'Verwijder alle inkomende doorverwijzingen. Gebruik dit NIET bij verplaatsingen/samenvoegingen.',
					checked: Twinkle.getPref('deleteRedirectsOnDelete'),
					event: function (event) {
						event.stopPropagation();
					}
				},
				{
					label: 'Verwijder voor meerdere redenen',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: 'When selected, you can select several criteria that apply to the page. For example, G11 and A7 are a common combination for articles.',
					event: function(event) {
						Twinkle.speedy.callback.modeChanged(event.target.form);
						event.stopPropagation();
					}
				},
				{
					label: 'Notificeer aanmaker',
					value: 'warnusertalk',
					name: 'warnusertalk',
					tooltip: 'A notification template will be placed on the talk page of the creator, IF you have a notification enabled in your Twinkle preferences ' +
						'for the criterion you choose AND this box is checked. The creator may be welcomed as well.',
					checked: !Twinkle.speedy.hasCSD,
					event: function(event) {
						event.stopPropagation();
					}
				}
			]
		});
	}

	var tagOptions = form.append({
		type: 'div',
		name: 'tag_options'
	});

	if (Morebits.userIsSysop) {
		tagOptions.append({
			type: 'header',
			label: 'Nominatie opties'
		});
	}

	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'Notificeer aanmaker',
				value: 'notify',
				name: 'notify',
				tooltip: 'A notification template will be placed on the talk page of the creator, IF you have a notification enabled in your Twinkle preferences ' +
						'for the criterion you choose AND this box is checked. The creator may be welcomed as well.',
				checked: !Morebits.userIsSysop || !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
				event: function(event) {
					event.stopPropagation();
				}
			},
			{
				label: 'Nomineer voor meerdere redenen',
				value: 'multiple',
				name: 'multiple',
				tooltip: 'When selected, you can select several criteria that apply to the page. For example, G11 and A7 are a common combination for articles.',
				event: function(event) {
					Twinkle.speedy.callback.modeChanged(event.target.form);
					event.stopPropagation();
				}
			}
		]
	});

	form.append({
		type: 'div',
		id: 'prior-deletion-count',
		style: 'font-style: italic'
	});

	form.append({
		type: 'div',
		name: 'work_area',
		label: 'Failed to initialize the CSD module. Please try again, or tell the Twinkle developers about the issue.'
	});

	if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
		form.append({ type: 'submit', className: 'tw-speedy-submit' }); // Renamed in modeChanged
	}

	var result = form.render();
	dialog.setContent(result);
	dialog.display();

	Twinkle.speedy.callback.modeChanged(result);

	// Check for prior deletions.  Just once, upon init
	Twinkle.speedy.callback.priorDeletionCount();
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	var namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	var mode = {
		isSysop: !!form.tag_only && !form.tag_only.checked,
		isMultiple: form.tag_only && !form.tag_only.checked ? form.delmultiple.checked : form.multiple.checked,
		isRadioClick: Twinkle.getPref('speedySelectionStyle') === 'radioClick'
	};

	if (mode.isSysop) {
		$('[name=delete_options]').show();
		$('[name=tag_options]').hide();
		$('button.tw-speedy-submit').text('Delete page');
	} else {
		$('[name=delete_options]').hide();
		$('[name=tag_options]').show();
		$('button.tw-speedy-submit').text('Tag page');
	}

	var work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	if (mode.isMultiple && mode.isRadioClick) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';

		work_area.append({
			type: 'div',
			label: 'When finished choosing criteria, click:'
		});
		work_area.append({
			type: 'button',
			name: 'submit-multiple',
			label: mode.isSysop ? 'Verwijder pagina' : 'Nomineer pagina',
			event: function(event) {
				Twinkle.speedy.callback[evaluateType](event);
				event.stopPropagation();
			}
		});
	}

	var appendList = function(headerLabel, csdList) {
		work_area.append({ type: 'header', label: headerLabel });
		work_area.append({ type: mode.isMultiple ? 'checkbox' : 'radio', name: 'csd', list: Twinkle.speedy.generateCsdList(csdList, mode) });
	};

	if (mode.isSysop && !mode.isMultiple) {
		appendList('Custom rationale', Twinkle.speedy.customRationale);
	}

	if (!Morebits.isPageRedirect()) {
		switch (namespace) {
			case 2:  // user
			case 3:  // user talk
				appendList('User pages', Twinkle.speedy.userList);
				break;

			default:
				break;
		}
	} else {
		if (namespace === 2 || namespace === 3) {
			appendList('User pages', Twinkle.speedy.userList);
		}
	}

	var generalCriteria = Twinkle.speedy.generalList;

	// custom rationale lives under general criteria when tagging
	if (!mode.isSysop) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	appendList('General criteria', generalCriteria);

	var old_area = Morebits.quickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (mode.isSysop && Twinkle.speedy.hasCSD) {
		var customOption = $('input[name=csd][value=reason]')[0];
		if (customOption) {
			if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
				// force listeners to re-init
				customOption.click();
				customOption.parentNode.appendChild(customOption.subgroup);
			}
			customOption.subgroup.querySelector('input').value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
		}
	}
};

Twinkle.speedy.callback.priorDeletionCount = function () {
	var query = {
		action: 'query',
		format: 'json',
		list: 'logevents',
		letype: 'delete',
		leaction: 'delete/delete', // Just pure page deletion, no redirect overwrites or revdel
		letitle: mw.config.get('wgPageName'),
		leprop: '', // We're just counting we don't actually care about the entries
		lelimit: 5  // A little bit goes a long way
	};

	new Morebits.wiki.api('Checking for past deletions', query, function(apiobj) {
		var response = apiobj.getResponse();
		var delCount = response.query.logevents.length;
		if (delCount) {
			var message = delCount + ' voorgaande verwijderingen';
			if (delCount > 1) {
				message += 's';
				if (response.continue) {
					message = 'Meer dan ' + message;
				}

				// 3+ seems problematic
				if (delCount >= 3) {
					$('#prior-deletion-count').css('color', 'red');
				}
			}

			// Provide a link to page logs (CSD templates have one for sysops)
			var link = Morebits.htmlNode('a', '(logs)');
			link.setAttribute('href', mw.util.getUrl('Special:Log', {page: mw.config.get('wgPageName')}));
			link.setAttribute('target', '_blank');

			$('#prior-deletion-count').text(message + ' '); // Space before log link
			$('#prior-deletion-count').append(link);
		}
	}).post();
};


Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {

	var pageNamespace = mw.config.get('wgNamespaceNumber');

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (mode.isMultiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (mode.isSysop) {
			if (criterion.hideWhenSysop) {
				return null;
			}
			if (criterion.hideSubgroupWhenSysop) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenUser) {
				return null;
			}
			if (criterion.hideSubgroupWhenUser) {
				criterion.subgroup = null;
			}
		}

		if (Morebits.isPageRedirect() && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.showInNamespaces && criterion.showInNamespaces.indexOf(pageNamespace) < 0) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.indexOf(pageNamespace) > -1) {
			return null;
		}

		if (criterion.subgroup && !mode.isMultiple && mode.isRadioClick) {
			if (Array.isArray(criterion.subgroup)) {
				criterion.subgroup = criterion.subgroup.concat({
					type: 'button',
					name: 'submit',
					label: mode.isSysop ? 'Delete page' : 'Tag page',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: mode.isSysop ? 'Verwijder pagina' : 'Nomineer pagina',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		return criterion;
	});
};

Twinkle.speedy.customRationale = [
	{
		label: 'Custom rationale' + (Morebits.userIsSysop ? ' (custom deletion reason)' : ' using {{db}} template'),
		value: 'reason',
		tooltip: '{{db}} is short for "delete because". At least one of the other deletion criteria must still apply to the page, and you must make mention of this in your rationale. This is not a "catch-all" for when you can\'t find any criteria that fit.',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'Rationale: ',
			size: 60
		},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.talkList = [
	{
		label: 'G8: Talk pages with no corresponding subject page',
		value: 'talk',
		tooltip: 'This excludes any page that is useful to the project - in particular, user talk pages, talk page archives, and talk pages for files that exist on Wikimedia Commons.'
	}
];

Twinkle.speedy.userList = [
	{
		label: 'Pagina in de eigen naamruimte op eigen verzoek',
		value: 'userreq',
		tooltip: 'Personal subpages, upon request by their user. In some rare cases there may be administrative need to retain the page. Also, sometimes, main user pages may be deleted as well. See Wikipedia:User page for full instructions and guidelines',
		subgroup: mw.config.get('wgNamespaceNumber') === 3 && mw.config.get('wgTitle').indexOf('/') === -1 ? {
			name: 'userreq_rationale',
			type: 'input',
			label: 'Waarom moet deze pagina worden verwijderd: ',
			tooltip: 'Gebruikersoverleg-pagina\'s worden alleen onder zeer uitzonderlijke omstandigheden verwijderd.',
			size: 60
		} : null,
		hideSubgroupWhenMultiple: true
	}
];

Twinkle.speedy.generalList = [
	{
		label: 'Pagina zonder inhoud',
		value: 'empty',
		tooltip: 'Een lege pagina, of een aantal losse letters die geen woorden vormen.',
		
	},
	{
		label: 'Pagina met inhoud zonder zinvolle informatie.',
		value: 'nonsense',
		tooltip: 'Wees er zeker van dat het volstrekte nonsens is. Als er ook maar de geringste twijfel bestaat, is het beter de pagina te plaatsen op de TBP.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		label: 'Machinevertaling of niet in het Nederlands geschreven',
		value: 'language',
	},
	{
		label: 'Overduidelijke reclame',
		value: 'spam',
	},
	{
		label: 'Cyberpesten',
		value: 'attack',
	},
	{
		label: 'Overduidelijke zelfpromotie',
		value: 'selfpromo',
		tooltip: 'Op grond van de geboortedatum is het onmogelijk dat de persoon opmerkelijke dingen heeft gedaan en/of na een zoektocht op internet worden geen relevante verwijzingen gevonden',
	},
	{
		label: 'Overduidelijke auteursrechtenschending',
		value: 'copyvio',
		subgroup: [
			{
				name: 'copyvio_url',
				type: 'input',
				label: 'URL (indien beschikbaar): ',
				tooltip: 'Indien het materiaal is gekopieerd uit een online bron, voeg dan hier de links toe, inclusief het "http://" of "https://" protocol.',
				size: 60
			},
			{
				name: 'copyvio_url2',
				type: 'input',
				label: 'Extra URL: ',
				tooltip: 'Optioneel. Dient te beginnen met "http://" of "https://"',
				size: 60
			},
			{
				name: 'copyvio_url3',
				type: 'input',
				label: 'Extra URL: ',
				tooltip: 'Optioneel. Dient te beginnen met "http://" of "https://"',
				size: 60
			}
		]
	},
	{
		label: 'Vanwege een verplaatsing',
		value: 'move',
		subgroup: [
			{
				name: 'move_page',
				type: 'input',
				label: 'Wordt overschreven met (artikelnaam): '
			},
			{
				name: 'move_reason',
				type: 'input',
				label: 'Reason: ',
				size: 60
			}
		],
		hideWhenMultiple: true
	}
];
	
Twinkle.speedy.normalizeHash = {
	reason: 'db',
	empty: 'g1',
	nonsense: 'g2',
	language: 'g3',
	selfpromo: 'g4',
	move: 'g6',
	attack: 'g10',
	spam: 'g11',
	copyvio: 'g12',
	userreq: 'u1',
};

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		var code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = '{{db-multiple';
			params.utparams = {};
			$.each(params.normalizeds, function(index, norm) {
				code += '|' + norm.toUpperCase();
				parameters = params.templateParams[index] || [];
				for (var i in parameters) {
					if (typeof parameters[i] === 'string' && !parseInt(i, 10)) {  // skip numeric parameters - {{db-multiple}} doesn't understand them
						code += '|' + i + '=' + parameters[i];
					}
				}
				$.extend(params.utparams, Twinkle.speedy.getUserTalkParameters(norm, parameters));
			});
			code += '}}';
		} else {
			parameters = params.templateParams[0] || [];
			code = '{{db-' + params.values[0];
			for (i in parameters) {
				if (typeof parameters[i] === 'string') {
					code += '|' + i + '=' + parameters[i];
				}
			}
			if (params.usertalk) {
				code += '|help=off';
			}
			code += '}}';
			params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalizeds[0], parameters);
		}

		return [code, params.utparams];
	},

	parseWikitext: function(wikitext, callback) {
		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',
			text: wikitext,
			contentmodel: 'wikitext',
			title: mw.config.get('wgPageName'),
			disablelimitreport: true,
			format: 'json'
		};

		var statusIndicator = new Morebits.status('Building deletion summary');
		var api = new Morebits.wiki.api('Parsing deletion template', query, function(apiobj) {
			var reason = decodeURIComponent($(apiobj.getResponse().parse.text).find('#delete-reason').text()).replace(/\+/g, ' ');
			if (!reason) {
				statusIndicator.warn('Unable to generate summary from deletion template');
			} else {
				statusIndicator.info('done');
			}
			callback(reason);
		}, statusIndicator);
		api.post();
	},

	noteToCreator: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// disallow notifying yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			Morebits.status.warn('You (' + initialContrib + ') created this page; skipping user notification');
			initialContrib = null;

		// don't notify users when their user talk page is nominated/deleted
		} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
			Morebits.status.warn('Notifying initial contributor: this user created their own user talk page; skipping notification');
			initialContrib = null;

		// quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
		} else if ((initialContrib === 'Cyberbot I' || initialContrib === 'SoxBot') && params.normalizeds[0] === 'f2') {
			Morebits.status.warn('Notifying initial contributor: page created procedurally by bot; skipping notification');
			initialContrib = null;

		// Check for already existing tags
		} else if (Twinkle.speedy.hasCSD && params.warnUser && !confirm('The page is has a deletion-related tag, and thus the creator has likely been notified.  Do you want to notify them for this deletion as well?')) {
			Morebits.status.info('Notifying initial contributor', 'canceled by user; skipping notification.');
			initialContrib = null;
		}

		if (initialContrib) {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')'),
				notifytext, i, editsummary;

			// special cases: "db" and "db-multiple"
			if (params.normalizeds.length > 1) {
				notifytext = '\n{{subst:db-' + (params.warnUser ? 'deleted' : 'notice') + '-multiple|1=' + Morebits.pageNameNorm;
				var count = 2;
				$.each(params.normalizeds, function(index, norm) {
					notifytext += '|' + count++ + '=' + norm.toUpperCase();
				});
			} else if (params.normalizeds[0] === 'db') {
				notifytext = '\n{{subst:db-reason-' + (params.warnUser ? 'deleted' : 'notice') + '|1=' + Morebits.pageNameNorm;
			} else {
				notifytext = '\n{{subst:db-csd-' + (params.warnUser ? 'deleted' : 'notice') + '-custom|1=';
				if (params.values[0] === 'copypaste') {
					notifytext += params.templateParams[0].sourcepage;
				} else {
					notifytext += Morebits.pageNameNorm;
				}
				notifytext += '|2=' + params.values[0];
			}

			for (i in params.utparams) {
				if (typeof params.utparams[i] === 'string') {
					notifytext += '|' + i + '=' + params.utparams[i];
				}
			}
			notifytext += (params.welcomeuser ? '' : '|nowelcome=yes') + '}} ~~~~';

			editsummary = 'Notification: speedy deletion' + (params.warnUser ? '' : ' nomination');
			if (params.normalizeds.indexOf('g10') === -1) {  // no article name in summary for G10 taggings
				editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			} else {
				editsummary += ' of an attack page.';
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(editsummary);
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('watchSpeedyUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(function onNotifySuccess() {
				// add this nomination to the user's userspace log, if the user has enabled it
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
				}
			}, function onNotifyError() {
				// if user could not be notified, log nomination without mentioning that notification was sent
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, null);
				}
			});
		} else if (params.lognomination) {
			// log nomination even if the user notification wasn't sent
			Twinkle.speedy.callbacks.user.addToLog(params, null);
		}
	},

	sysop: {
		main: function(params) {
			var reason;
			if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
				reason = prompt('Enter the deletion summary to use, which will be entered into the deletion log:', '');
				Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
			} else {
				var code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(code, function(reason) {
					if (params.promptForSummary) {
						reason = prompt('Enter the deletion summary to use, or press OK to accept the automatically generated one.', reason);
					}
					Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
				});
			}
		},
		deletePage: function(reason, params) {
			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Deleting page');

			if (reason === null) {
				return Morebits.status.error('Asking for reason', 'User cancelled');
			} else if (!reason || !reason.replace(/^\s*/, '').replace(/\s*$/, '')) {
				return Morebits.status.error('Asking for reason', "you didn't give one.  I don't know... what with sysops and their apathetic antics... I give up...");
			}

			var deleteMain = function(callback) {
				thispage.setEditSummary(reason);
				thispage.setChangeTags(Twinkle.changeTags);
				thispage.setWatchlist(params.watch);
				thispage.deletePage(function() {
					thispage.getStatusElement().info('done');
					typeof callback === 'function' && callback();
					Twinkle.speedy.callbacks.sysop.deleteTalk(params);
				});
			};

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if (params.warnUser) {
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(function(pageobj) {
					deleteMain(function() {
						Twinkle.speedy.callbacks.noteToCreator(pageobj);
					});
				});
			} else {
				deleteMain();
			}
		},
		deleteTalk: function(params) {
			// delete talk page
			if (params.deleteTalkPage &&
					params.normalized !== 'f8' &&
					document.getElementById('ca-talk').className !== 'new') {
				var talkpage = new Morebits.wiki.page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), 'Deleting talk page');
				talkpage.setEditSummary('[[WP:CSD#G8|G8]]: Talk page of deleted page "' + Morebits.pageNameNorm + '"');
				talkpage.setChangeTags(Twinkle.changeTags);
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(function() {
					Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
				}, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
			}
		},
		deleteRedirects: function(params) {
			// delete redirects
			if (params.deleteRedirects) {
				var query = {
					action: 'query',
					titles: mw.config.get('wgPageName'),
					prop: 'redirects',
					rdlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
					format: 'json'
				};
				var wikipedia_api = new Morebits.wiki.api('lijst met doorverwijzingen ophalen...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.status('Doorverwijzingen verwijderen'));
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// promote Unlink tool
			var $link, $bigtext;
			if (mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'f8') {
				$link = $('<a/>', {
					href: '#',
					text: 'klik hier om naar de Ontlink tool te gaan',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing usages of and/or links to deleted file ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					text: 'To orphan backlinks and remove instances of file usage',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f8') {
				$link = $('<a/>', {
					href: '#',
					text: 'click here to go to the Unlink tool',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing links to deleted page ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					text: 'To orphan backlinks',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}
		},
		deleteRedirectsMain: function(apiobj) {
			var response = apiobj.getResponse();
			var snapshot = response.query.pages[0].redirects || [];
			var total = snapshot.length;
			var statusIndicator = apiobj.statelem;

			if (!total) {
				statusIndicator.status('no redirects found');
				return;
			}

			statusIndicator.status('0%');

			var current = 0;
			var onsuccess = function(apiobjInner) {
				var now = parseInt(100 * ++current / total, 10) + '%';
				statusIndicator.update(now);
				apiobjInner.statelem.unlink();
				if (current >= total) {
					statusIndicator.info(now + ' (completed)');
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			snapshot.forEach(function(value) {
				var title = value.title;
				var page = new Morebits.wiki.page(title, 'Doorverwijzing verwijderen "' + title + '"');
				page.setEditSummary('Doorverwijzing naar verwijderde pagina "' + Morebits.pageNameNorm + '"');
				page.setChangeTags(Twinkle.changeTags);
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			var params = pageobj.getCallbackParameters();

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			var buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0];
			params.utparams = buildData[1];

			// Set the correct value for |ts= parameter in {{db-g13}}
			if (params.normalizeds.indexOf('g13') !== -1) {
				code = code.replace('$TIMESTAMP', pageobj.getLastEditTime());
			}

			// Tag if possible, post on talk if not
			if (pageobj.canEdit() && ['wikitext', 'Scribunto', 'javascript', 'css', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				var text = pageobj.getPageText();

				statelem.status('Checking for tags on the page...');

				// check for existing deletion tags
				var tag = /(?:\{\{\s*(nuweg|delete)(?:\s*\||\s*\}\}))/.exec(text);
				// This won't make use of the db-multiple template but it probably should
				if (tag && !confirm('De pagina heeft al een {{' + tag[1] + '}} nominatie.  Wil je een extra nominatie toevoegen?')) {
					return;
				}

				var xfd = /\{\{((?:article for deletion|proposed deletion|prod blp|template for discussion)\/dated|[cfm]fd\b)/i.exec(text) || /#invoke:(Redirect for discussion)/.exec(text);
				if (xfd && !confirm('The deletion-related template {{' + xfd[1] + '}} was found on the page. Do you still want to add a CSD template?')) {
					return;
				}

				// curate/patrol the page
				if (Twinkle.getPref('markSpeedyPagesAsPatrolled')) {
					pageobj.triage();
				}

				// Wrap SD template in noinclude tags if we are in template space.
				// Won't work with userboxes in userspace, or any other transcluded page outside template space
				if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
					code = '<noinclude>' + code + '</noinclude>';
				}

				// Remove tags that become superfluous with this action
				text = text.replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
				if (mw.config.get('wgNamespaceNumber') === 6) {
					// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}


				if (mw.config.get('wgPageContentModel') === 'Scribunto') {
					// Scribunto isn't parsed like wikitext, so CSD templates on modules need special handling to work
					var equals = '';
					while (code.indexOf(']' + equals + ']') !== -1) {
						equals += '=';
					}
					code = "require('Module:Module wikitext')._addText([" + equals + '[' + code + ']' + equals + ']);';
				} else if (['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1) {
					// Likewise for JS/CSS pages
					code = '/* ' + code + ' */';
				}

				// Generate edit summary for edit
				var editsummary;
				if (params.normalizeds.length > 1) {
					editsummary = 'Verzoek voor directe verwijdering (';
					$.each(params.normalizeds, function(index, norm) {
						editsummary += '[[WP:CSD#' + norm.toUpperCase() + '|CSD ' + norm.toUpperCase() + ']], ';
					});
					editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
					editsummary += ').';
				} else if (params.normalizeds[0] === 'db') {
					editsummary = 'Verzoek voor directe verwijdering wegens "' + params.templateParams[0]['1'] + '".';
				} else {
					editsummary = 'Verzoek om directe verwijdering ([[WP:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']]).';
				}

				// Blank attack pages
				if (params.normalizeds.indexOf('g10') !== -1) {
					text = code;
				} else {
					// Insert tag after short description or any hatnotes
					var wikipage = new Morebits.wikitext.page(text);
					text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
				}


				pageobj.setPageText(text);
				pageobj.setEditSummary(editsummary);
				pageobj.setWatchlist(params.watch);
				pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
			} else { // Attempt to place on talk page
				var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
				if (talkName !== pageobj.getPageName()) {
					if (params.requestsalt) {
						code += '\n{{salt}}';
					}

					pageobj.getStatusElement().warn('Unable to edit page, placing tag on talk page');

					var talk_page = new Morebits.wiki.page(talkName, 'Automatically placing tag on talk page');
					talk_page.setNewSectionTitle(pageobj.getPageName() + ' nominated for CSD, request deletion');
					talk_page.setNewSectionText(code + '\n\nI was unable to tag ' + pageobj.getPageName() + ' so please delete it. ~~~~');
					talk_page.setCreateOption('recreate');
					talk_page.setFollowRedirect(true);
					talk_page.setWatchlist(params.watch);
					talk_page.setChangeTags(Twinkle.changeTags);
					talk_page.setCallbackParameters(params);
					talk_page.newSection(Twinkle.speedy.callbacks.user.tagComplete);
				} else {
					pageobj.getStatusElement().error('Page protected and nowhere to add an edit request, aborting');
				}
			}
		},

		tagComplete: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			// Notification to first contributor, will also log nomination to the user's userspace log
			if (params.usertalk) {
				var thispage = new Morebits.wiki.page(Morebits.pageNameNorm);
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(Twinkle.speedy.callbacks.noteToCreator);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},

		addToLog: function(params, initialContrib) {
			var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
			usl.initialText =
				"This is a log of all [[WP:CSD|speedy deletion]] nominations made by this user using [[WP:TW|Twinkle]]'s CSD module.\n\n" +
				'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
				'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
				(Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');

			var formatParamLog = function(normalize, csdparam, input) {
				if (normalize === 'G12' && csdparam.lastIndexOf('url', 0) === 0 && input.lastIndexOf('http', 0) === 0) {
					input = '[' + input + ' ' + input + ']';
				}
				return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
			};

			var extraInfo = '';

			// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
			var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';

			var editsummary = 'Logging speedy deletion nomination';
			var appendText = '# [[:' + Morebits.pageNameNorm;

			if (params.normalizeds.indexOf('g10') === -1) {  // no article name in log for G10 taggings
				appendText += ']]' + fileLogLink + ': ';
				editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			} else {
				appendText += '|This]] attack page' + fileLogLink + ': ';
				editsummary += ' of an attack page.';
			}
			if (params.normalizeds.length > 1) {
				appendText += 'multiple criteria (';
				$.each(params.normalizeds, function(index, norm) {
					appendText += '[[WP:CSD#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']], ';
				});
				appendText = appendText.substr(0, appendText.length - 2);  // remove trailing comma
				appendText += ')';
			} else if (params.normalizeds[0] === 'db') {
				appendText += '{{tl|db-reason}}';
			} else {
				appendText += '[[WP:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']] ({{tl|db-' + params.values[0] + '}})';
			}

			// If params is "empty" it will still be full of empty arrays, but ask anyway
			if (params.templateParams) {
				// Treat custom rationale individually
				if (params.normalizeds[0] && params.normalizeds[0] === 'db') {
					extraInfo += formatParamLog('Custom', 'rationale', params.templateParams[0]['1']);
				} else {
					params.templateParams.forEach(function(item, index) {
						var keys = Object.keys(item);
						if (keys[0] !== undefined && keys[0].length > 0) {
							// Second loop required since some items (G12, F9) may have multiple keys
							keys.forEach(function(key, keyIndex) {
								if (keys[keyIndex] === 'blanked' || keys[keyIndex] === 'ts') {
									return true; // Not worth logging
								}
								extraInfo += formatParamLog(params.normalizeds[index].toUpperCase(), keys[keyIndex], item[key]);
							});
						}
					});
				}
			}

			if (extraInfo) {
				appendText += '; additional information:' + extraInfo;
			}
			if (initialContrib) {
				appendText += '; notified {{user|1=' + initialContrib + '}}';
			}
			appendText += ' ~~~~~\n';

			usl.changeTags = Twinkle.changeTags;
			usl.log(appendText, editsummary);
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	var parameters = [];

	$.each(values, function(index, value) {
		var currentParams = [];
		switch (value) {
			case 'reason':
				if (form['csd.reason_1']) {
					var dbrationale = form['csd.reason_1'].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert('Custom rationale:  Please specify a rationale.');
						parameters = null;
						return false;
					}
					currentParams['1'] = dbrationale;
				}
				break;

			case 'userreq':  // U1
				if (form['csd.userreq_rationale']) {
					var u1rationale = form['csd.userreq_rationale'].value;
					if (mw.config.get('wgNamespaceNumber') === 3 && !(/\//).test(mw.config.get('wgTitle')) &&
							(!u1rationale || !u1rationale.trim())) {
						alert('CSD U1:  Please specify a rationale when nominating user talk pages.');
						parameters = null;
						return false;
					}
					currentParams.rationale = u1rationale;
				}
				break;

			case 'move':  // G6
				if (form['csd.move_page'] && form['csd.move_reason']) {
					var movepage = form['csd.move_page'].value,
						movereason = form['csd.move_reason'].value;
					if (!movepage || !movepage.trim()) {
						alert('Geef de pagina op die hier naartoe verplaatst wordt.');
						parameters = null;
						return false;
					}
					if (!movereason || !movereason.trim()) {
						alert('Geef de reden van verplaatsing op.');
						parameters = null;
						return false;
					}
					currentParams.page = movepage;
					currentParams.reason = movereason;
				}
				break;


			case 'g6':  // G6
				if (form['csd.g6_rationale'] && form['csd.g6_rationale'].value) {
					currentParams.rationale = form['csd.g6_rationale'].value;
				}
				break;


			case 'g8':  // G8
				if (form['csd.g8_rationale'] && form['csd.g8_rationale'].value) {
					currentParams.rationale = form['csd.g8_rationale'].value;
				}
				break;

			case 'attack':  // G10
				currentParams.blanked = 'yes';
				// it is actually blanked elsewhere in code, but setting the flag here
				break;

			case 'copyvio':  // G12
				if (form['csd.copyvio_url'] && form['csd.copyvio_url'].value) {
					currentParams.url = form['csd.copyvio_url'].value;
				}
				if (form['csd.copyvio_url2'] && form['csd.copyvio_url2'].value) {
					currentParams.url2 = form['csd.copyvio_url2'].value;
				}
				if (form['csd.copyvio_url3'] && form['csd.copyvio_url3'].value) {
					currentParams.url3 = form['csd.copyvio_url3'].value;
				}
				break;

			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

// Function for processing talk page notification template parameters
// key1/value1: for {{db-criterion-[notice|deleted]}} (via {{db-csd-[notice|deleted]-custom}})
// utparams.param: for {{db-[notice|deleted]-multiple}}
Twinkle.speedy.getUserTalkParameters = function twinklespeedyGetUserTalkParameters(normalized, parameters) {
	var utparams = [];

	// Special cases
	if (normalized === 'db') {
		utparams['2'] = parameters['1'];
	} else if (normalized === 'g6') {
		utparams.key1 = 'to';
		utparams.value1 = Morebits.pageNameNorm;
	} else if (normalized === 'g12') {
		['url', 'url2', 'url3'].forEach(function(item, idx) {
			if (parameters[item]) {
				idx++;
				utparams['key' + idx] = item;
				utparams['value' + idx] = utparams[item] = parameters[item];
			}
		});
	} else {
		// Handle the rest
		var param;
		switch (normalized) {
			default:
				break;
		}
		// No harm in providing a usertalk template with the others' parameters
		if (param && parameters[param]) {
			utparams.key1 = param;
			utparams.value1 = utparams[param] = parameters[param];
		}
	}
	return utparams;
};

/**
 * @param {Event} e
 * @returns {Array}
 */
Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert('Geef een reden op a.u.b.!');
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var tag_only = form.tag_only;
	if (tag_only && tag_only.checked) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
	var watchPage, promptForSummary;
	normalizeds.forEach(function(norm) {
		if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
			watchPage = Twinkle.getPref('watchSpeedyExpiry');
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').indexOf(norm) !== -1) {
			promptForSummary = true;
		}
	});

	var warnusertalk = form.warnusertalk.checked && normalizeds.some(function (norm, index) {
		return Twinkle.getPref('warnUserOnSpeedyDelete').indexOf(norm) !== -1 &&
			!(norm === 'g6' && values[index] !== 'copypaste');
	});

	var welcomeuser = warnusertalk && normalizeds.some(function (norm) {
		return Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1;
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked,
		warnUser: warnusertalk,
		welcomeuser: welcomeuser,
		promptForSummary: promptForSummary,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Twinkle.speedy.callbacks.sysop.main(params);
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	// var multiple = form.multiple.checked;

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page/notify the creator
	var watchPage = normalizeds.some(function(norm) {
		return Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1 && Twinkle.getPref('watchSpeedyExpiry');
	});
	var notifyuser = form.notify.checked && normalizeds.some(function(norm, index) {
		return Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1 &&
			!(norm === 'g6' && values[index] !== 'copypaste');
	});
	var welcomeuser = notifyuser && normalizeds.some(function(norm) {
		return Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1;
	});
	var csdlog = Twinkle.getPref('logSpeedyNominations') && normalizeds.some(function(norm) {
		return Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1;
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog,
		requestsalt: form.salting.checked,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Nomineren voltooit';

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Pagina nomineren');
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
})(jQuery);


// </nowiki>
