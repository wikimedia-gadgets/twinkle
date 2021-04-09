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

		Twinkle.addPortletLink(Twinkle.speedy.callback, 'Nuweg', 'tw-csd', Morebits.userIsSysop ? 'Verwijder pagina\'s in overeenstemming met WP:RVM' : 'Verzoek directe verwijdering in overeenstemming met WP:RVM');
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
						tooltip: 'Verwijder alle pagina\'s die doorverwijzingen naar deze pagina. Gebruik dit NIET bij verplaatsingen/samenvoegingen.',
						checked: Twinkle.getPref('deleteRedirectsOnDelete'),
						event: function (event) {
							event.stopPropagation();
						}
					},
					{
						label: 'Verwijder wegens meerdere redenen',
						value: 'delmultiple',
						name: 'delmultiple',
						tooltip: 'Indien geselecteerd kun je de pagina voor meerdere RVM criteria verwijderen.',
						event: function(event) {
							Twinkle.speedy.callback.modeChanged(event.target.form);
							event.stopPropagation();
						}
					},
					{
						label: 'Breng aanmaker op de hoogte (indien mogelijk)',
						value: 'warnusertalk',
						name: 'warnusertalk',
						tooltip: 'Een mededeling van nominatie wordt op de overlegpagina van de aanmaker geplaatst, OOK moet je dit inschakelen op het Twinkle configuratiescherm ',
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
					label: 'Breng aanmaker op de hoogte (indien mogelijk)',
					value: 'notify',
					name: 'notify',
					tooltip: 'Een mededeling van nominatie wordt op de overlegpagina van de aanmaker geplaatst, OOK moet je dit inschakelen op het Twinkle configuratiescherm ',
					checked: !Morebits.userIsSysop || !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
					event: function(event) {
						event.stopPropagation();
					}
				},
				{
					label: 'Nomineer wegens meerdere redenen ',
					value: 'multiple',
					name: 'multiple',
					tooltip: 'Indien geselecteerd kun je de pagina voor meerdere RVM criteria nomineren.',
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
			label: 'Inladen nuweg-module mislukt. Probeer nogmaals, of meld het bij de Twinkle ontwikkelaars.'
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
			$('button.tw-speedy-submit').text('Verwijder pagina');
		} else {
			$('[name=delete_options]').hide();
			$('[name=tag_options]').show();
			$('button.tw-speedy-submit').text('Nomineer pagina');
		}

		var work_area = new Morebits.quickForm.element({
			type: 'div',
			name: 'work_area'
		});

		if (mode.isMultiple && mode.isRadioClick) {
			var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';

			work_area.append({
				type: 'div',
				label: 'Alle gewenste criteria geselecteerd?, klik:'
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

		if (!Morebits.isPageRedirect()) {
			switch (namespace) {
				case 2:  // user
				case 3:  // user talk
					appendList('Gebruikersnaamruimte', Twinkle.speedy.userList);
					break;
				default:
					break;
			}
		} else {
			if (namespace === 2 || namespace === 3) {
				appendList('Gebruikersnaamruimte', Twinkle.speedy.userList);
			}
		}

		var generalCriteria = Twinkle.speedy.generalList;

		// custom rationale lives under general criteria when tagging
		appendList('RVM criteria', generalCriteria);

		var old_area = Morebits.quickForm.getElements(form, 'work_area')[0];
		form.replaceChild(work_area.render(), old_area);

		// if sysop, check if CSD is already on the page and fill in custom rationale
		if (mode.isSysop && Twinkle.speedy.hasCSD) {
			var customOption = $('input[name=nuweg][value=reason]')[0];
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

		new Morebits.wiki.api('Controleren op voorgaande verwijderingen', query, function(apiobj) {
			var response = apiobj.getResponse();
			var delCount = response.query.logevents.length;
			// noinspection JSJQueryEfficiency
			if (delCount) {
				var message = delCount + ' voorgaande verwijdering';
				if (delCount > 1) {
					message += 'en';
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
						label: mode.isSysop ? 'Verwijder pagina' : 'Nomineer pagina',
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

	Twinkle.speedy.userList = [
		{
			label: 'Pagina in de eigen naamruimte op eigen verzoek',
			value: 'eigennaamruimte',
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
			value: 'leeg',
			tooltip: 'Een lege pagina, of een aantal losse letters die geen woorden vormen.',

		},
		{
			label: 'Pagina met inhoud zonder zinvolle informatie.',
			value: 'nonsense',
			tooltip: 'Wees er zeker van dat het volstrekte nonsense is. Als er ook maar de geringste twijfel bestaat, is het beter de pagina te nomineren via TBx.',
			hideInNamespaces: [ 2 ] // Not applicable in userspace
		},
		{
			label: 'Machinevertaling of niet in het Nederlands geschreven',
			value: 'vertaling',
		},
		{
			label: 'Overduidelijke reclame',
			value: 'reclame',
		},
		{
			label: 'Cyberpesten',
			value: 'cyberpesten',
		},
		{
			label: 'Overduidelijke zelfpromotie',
			value: 'zelfpromotie',
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
			],
		},
		{
			label: 'Afhandelen TBx nominatie',
			value: 'tbx',
			hideWhenUser: true,
			hideWhenMultiple: true,
			subgroup: [
				{
					name: 'venue',
					type: 'select',
					label: 'Nominatiepagina: ',
					list: [
						{
							value: 'TBP',
							type: 'option',
							label: 'Te Beoordelen Pagina',
							selected: true
						},
						{
							value: 'TBS',
							type: 'option',
							label: 'Te Beoordelen Sjabloon'
						},
						{
							value: 'TBC',
							type: 'option',
							label: 'Te Beoordelen Categorie'
						}
					],
				},
				{
					name: 'daypage',
					type: 'number',
					label: 'Dagpagina: ',
					tooltip: 'De datum van nominatie, in het formaat JJJJMMDD',
					placeholder: 'JJJJMMDD',
					size: 8,
					min: 20000101,
					max: 21001231,
				},
			],
		},
		{
			label: 'Verwijdering wegens verplaatsing/naamwijziging',
			value: 'verplaatsing',
			hideWhenUser: true,
			hideWhenMultiple: true
		},
	];

	Twinkle.speedy.normalizeHash = {
		leeg: 'g1',
		nonsense: 'g2',
		vertaling: 'g3',
		zelfpromotie: 'g4',
		cyberpesten: 'g5',
		reclame: 'g6',
		copyvio: 'g7',
		eigennaamruimte: 'u1',
		tbx: 's1',
		verplaatsing: 's2',
	};

	Twinkle.speedy.templateReason = {
		leeg: 'Lege pagina',
		nonsense: 'Geen zinvolle inhoud',
		vertaling: 'Niet-Nederlandstalig of resultaat van een computervertaling',
		zelfpromotie: 'Overduidelijke zelfpromotie',
		cyberpesten: 'Cyberpesten',
		reclame: 'Overduidelijke reclame',
		copyvio: 'Schending van [[Wikipedia:Auteursrechten|auteursrechten]] of geplaatst zonder [[Help:Toestemming|toestemming]]',
		eigennaamruimte: 'Verzoek in eigen naamruimte',
	};

	Twinkle.speedy.deleteReason = {
		leeg: 'Lege pagina',
		nonsense: 'Geen zinvolle inhoud',
		vertaling: 'Niet-Nederlandstalig of resultaat van een computervertaling',
		zelfpromotie: 'Overduidelijke zelfpromotie',
		cyberpesten: 'Cyberpesten',
		reclame: 'Expliciete reclame, werving of propaganda',
		copyvio: 'Schending van [[Wikipedia:Auteursrechten|auteursrechten]] of geplaatst zonder [[Help:Toestemming|toestemming]]',
		eigennaamruimte: 'Verzoek in eigen naamruimte',
		tbx: 'afhandelen TBx nominatie',
		verplaatsing: 'verplaatsing/naamwijziging',
	};


	Twinkle.speedy.callbacks = {
		getTemplateCodeAndParams: function(params) {
			var code, parameters, i;
			if (params.normalizeds.length > 1) {
				code = '{{nuweg|';
				params.utparams = {};
				$.each(params.normalizeds, function(index, norm) {
					code += params.templateReason[index] + '; ';
					parameters = params.templateParams[index] || [];
					for (var i in parameters) {
						if (typeof parameters[i] === 'string' && !parseInt(i, 10)) {  // skip numeric parameters - {{db-multiple}} doesn't understand them
							code += ' ' + parameters[i];
						}
					}
					$.extend(params.utparams, Twinkle.speedy.getUserTalkParameters(norm, parameters));
				});
				code += '}}';
			} else {
				parameters = params.templateParams[0] || [];
				code = '{{nuweg|' + params.templateReason[0];
				for (i in parameters) {
					if (typeof parameters[i] === 'string') {
						code += ' ' + parameters[i];
					}
				}
				code += '}}';
				params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalizeds[0], parameters);
			}

			return [code, params.utparams];
		},

		noteToCreator: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();

			// disallow notifying yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				Morebits.status.warn('Jij (' + initialContrib + ') hebt deze pagina aangemaakt; notificatie overgeslagen');
				initialContrib = null;

				// don't notify users when their user talk page is nominated/deleted
			} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
				Morebits.status.warn('Notificeer originele aanmaker: deze gebruiker heeft zijn/haar eigen overlegpagina gemaakt; notificatie overgeslagen');
				initialContrib = null;

				// quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
			} else if ((initialContrib === 'Nlwikibot' || initialContrib === 'SoxBot') && params.normalizeds[0] === 'f2') {
				Morebits.status.warn('Notificeer originele aanmaker: pagina is door een bot aangemaakt, notificatie overgeslagen');
				initialContrib = null;

				// Check for already existing tags
			} else if (Twinkle.speedy.hasCSD && params.warnUser && !confirm('De pagina heeft al een nominatie, dus de aanmaker is waarschijnlijk al gewaarschuwd.  Wil je de aanmaker ook voor deze nominatie waarschuwen?')) {
				Morebits.status.info('Notificeer originele aanmaker', 'geannuleerd door gebruiker.');
				initialContrib = null;
			}

			if (initialContrib) {
				var usertalkpage = new Morebits.wiki.page('Overleg gebruiker:' + initialContrib, 'Notificeer originele aanmaker (' + initialContrib + ')'),
					notifytext, i, editsummary;


				notifytext = '\n{{subst:'+ (params.warnUser ? 'pdv' : 'vvn4') + '|1=';
				if (params.values[0] === 'copypaste') {
					notifytext += params.templateParams[0].sourcepage;
				} else {
					notifytext += Morebits.pageNameNorm;
				}
				notifytext += '|2=' + params.values[0];

				for (i in params.utparams) {
					if (typeof params.utparams[i] === 'string') {
						notifytext += params.utparams[i] + ';';
					}
				}
				notifytext += (params.welcomeuser ? '' : '|3=false') + '}}';

				if (params.normalizeds.indexOf('s1') === -1) {
					editsummary = 'Mededeling: ' + (params.warnUser ? 'Directe verwijdering' : ' Nuweg nominatie');
					if (params.normalizeds.indexOf('g5') === -1) {  // no article name in summary for cyberbullying
						editsummary += ' van [[' + Morebits.pageNameNorm + ']].';
					} else {
						editsummary += ' van een cyberpestpagina.';
					}
				} else {
					editsummary = 'Mededeling: Verwijdering van [[' + Morebits.pageNameNorm + ']] n.a.v. TBP nominatie';
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

				if (params.normalizeds.length > 1) {
					reason = "Direct verwijderd om de volgende redenen: "
					$.each(params.normalizeds, function(index) {
						reason += params.deleteReason[index] + '; ';
					});
				} else {
					if (params.normalizeds.indexOf('s1') !== -1) { //TBx afhandeling
						reason = 'Per beoordelingssessie [[WP:' + params.templateParams[0]['1'] + '/Toegevoegd ' + params.templateParams[0]['2'] + '#' + Morebits.pageNameNorm + ']]';
					} else {
						reason = 'Direct verwijderd wegens ' + params.deleteReason;
					}
				}

				Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
			},
			deletePage: function(reason, params) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Pagina verwijderen...');

				if (reason === null) {
					return Morebits.status.error('Verwijderen afgebroken', 'Gebruiker annuleert');
				} else if (!reason) {
					return Morebits.status.error('Verwijderen afgebroken', "Stiekem pagina's verwijderen zonder reden? Dat is vragen om een desysop...");
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
					var talkpage = new Morebits.wiki.page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), 'Overlegpagina verwijderen');
					talkpage.setEditSummary('Overlegpagina van verwijderde pagina "' + Morebits.pageNameNorm + '"');
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
			},
			deleteRedirectsMain: function(apiobj) {
				var response = apiobj.getResponse();
				var snapshot = response.query.pages[0].redirects || [];
				var total = snapshot.length;
				var statusIndicator = apiobj.statelem;

				if (!total) {
					statusIndicator.status('geen doorverwijzingen gevonden');
					return;
				}

				statusIndicator.status('0%');

				var current = 0;
				var onsuccess = function(apiobjInner) {
					var now = parseInt(100 * ++current / total, 10) + '%';
					statusIndicator.update(now);
					apiobjInner.statelem.unlink();
					if (current >= total) {
						statusIndicator.info(now + ' (voltooid)');
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
					statelem.error("Het lijkt er op dat de pagina niet meer bestaat, misschien is hij al verwijderd?");
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

					statelem.status('Controleren op bestaande nominaties...');

					// check for existing deletion tags
					var tag = /(?:\{\{\s*(nuweg|delete)(?:\s*\||\s*\}\}))/.exec(text);
					// This won't make use of the db-multiple template but it probably should
					if (tag && !confirm('De pagina heeft al een {{nuweg}} nominatie. Wil je een extra nominatie toevoegen?')) {
						return;
					}

					var xfd = /(?:\{\{\s*(wiu|ne|wb|auteur|reclame|weg)(?:\s*\||\s*\}\}))/.exec(text);
					if (xfd && !confirm('De pagina heeft al een {{' + xfd[1] + '}} nominatie. Weet je zeker dat je een nuweg-nominatie wil toevoegen?')) {
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
					var editsummary = 'Verzoek om directe verwijdering (' + params.values + ').';

					// Blank attack pages
					if (params.normalizeds.indexOf('g5') !== -1) {
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

						pageobj.getStatusElement().warn('Plaatsen op pagina mislukt, proberen op het op de overlegpagina te plaaten');

						var talk_page = new Morebits.wiki.page(talkName, 'Automatisch op overlegpagina geplaatst');
						talk_page.setNewSectionTitle(pageobj.getPageName() + ' genomineerd voor directe verwijdering');
						talk_page.setNewSectionText(code + '\n\nHet is me niet gelukt ' + pageobj.getPageName() + ' te bewerken, dus wil ik langs deze weg verzoeken het direct te verwijderen. ~~~~');
						talk_page.setCreateOption('recreate');
						talk_page.setFollowRedirect(true);
						talk_page.setWatchlist(params.watch);
						talk_page.setChangeTags(Twinkle.changeTags);
						talk_page.setCallbackParameters(params);
						talk_page.newSection(Twinkle.speedy.callbacks.user.tagComplete);
					} else {
						pageobj.getStatusElement().error('Pagina beveiligd en geen plek gevonden om een verwijderverzoek in te dienen, afbreken...');
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
					"Dit is een log van alle nuweg-nominaties gemaakt door deze gebruiker middels [[WP:TW|Twinkle]].\n\n" +
					'Indien je dit logboek niet langer wenst bij te houden, pas dan je instellingen aan op het [[Wikipedia:Twinkle/Preferences|configuratiescherm]].' +
					'Eventueel kun je deze pagina vervolgens nomineren voor directe verwijdering.' +
					(Morebits.userIsSysop ? '\n\nDit logboek bewaard niet je moderatorafhandelingen gemaakt met Twinkle.' : '');

				var formatParamLog = function(normalize, csdparam, input) {
					if (normalize === 'G7' && csdparam.lastIndexOf('url', 0) === 0 && input.lastIndexOf('http', 0) === 0) {
						input = '[' + input + ' ' + input + ']';
					}
					return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
				};

				var extraInfo = '';

				// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
				var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';

				var editsummary = 'Logging speedy deletion nomination';
				var appendText = '# [[:' + Morebits.pageNameNorm;

				if (params.normalizeds.indexOf('g5') === -1) {  // no article name in log for G5 taggings
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
								// Second loop required since some items (G7) may have multiple keys
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
				case 'tbx': //S1
					if (form['csd.venue']) {
						var s1venue = form['csd.venue'].value;
						if (!s1venue || !s1venue.trim()) {
							alert('Geef de nominatiepagina op.');
							parameters = null;
							return false;
						}
						currentParams['1'] = s1venue;
					}
					if (form['csd.daypage']){
						var s1daypage = form['csd.daypage'].value;
						if (!s1daypage || !s1daypage.trim()) {
							alert('Geef een dagpagina op in JJJJMMDD stijl.');
							parameters = null;
							return false;
						}
						currentParams['2'] = s1daypage;
					}
					break;

				case 'eigennaamruimte':  // U1
					if (form['csd.userreq_rationale']) {
						var u1rationale = form['csd.userreq_rationale'].value;
						if (mw.config.get('wgNamespaceNumber') === 3 && !(/\//).test(mw.config.get('wgTitle')) &&
							(!u1rationale || !u1rationale.trim())) {
							alert('Geef een reden op om een gebruikersoverlegpagina te nomineren.');
							parameters = null;
							return false;
						}
						currentParams.rationale = u1rationale;
					}
					break;

				case 'copyvio':  // G7
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
		if (normalized === 'g6') {
			utparams.key1 = 'to';
			utparams.value1 = Morebits.pageNameNorm;
		} else if (normalized === 'g7') {
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

		var templateReason = values.map(function(value) {
			return Twinkle.speedy.templateReason[value];
		});

		var deleteReason = values.map(function(value) {
			return Twinkle.speedy.deleteReason[value];
		});

		// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
		var watchPage;
		normalizeds.forEach(function(norm) {
			if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
				watchPage = Twinkle.getPref('watchSpeedyExpiry');
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
			templateReason: templateReason,
			deleteReason: deleteReason,
			watch: watchPage,
			deleteTalkPage: form.talkpage && form.talkpage.checked,
			deleteRedirects: form.redirects.checked,
			warnUser: warnusertalk,
			welcomeuser: welcomeuser,
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

		var templateReason = values.map(function(value) {
			return Twinkle.speedy.templateReason[value];
		});

		var deleteReason = values.map(function(value) {
			return Twinkle.speedy.deleteReason[value];
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
			deleteReason: deleteReason,
			templateReason: templateReason,
			watch: watchPage,
			usertalk: notifyuser,
			welcomeuser: welcomeuser,
			lognomination: csdlog,
			templateParams: templateParams
		};

		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(form);

		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = 'Nomineren voltooid. Pagina wordt herladen...';

		var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Pagina nomineren');
		wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
	};

	Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
})(jQuery);


// </nowiki>
