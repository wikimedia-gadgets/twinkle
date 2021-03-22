// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklexfd.js: XFD module
 ****************************************
 * Mode of invocation:     Tab ("XFD")
 * Active on:              Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
 */

Twinkle.xfd = function twinklexfd() {
	// Disable on:
	// * special pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2, or R4 if it's a redirect)
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId') || (mw.config.get('wgNamespaceNumber') === 6 && document.getElementById('mw-sharedupload'))) {
		return;
	}

	var tooltip = 'Maak een verwijdernominatie aan';
	if (mw.config.get('wgIsRedirect')) {
		tooltip += ' of verplaats deze doorverwijzing';
	} else {
		switch (mw.config.get('wgNamespaceNumber')) {
			case 0:
				tooltip += ' of verplaats dit artikel';
				break;
			case 10:
				tooltip += ' of verplaats dit sjabloon';
				break;
			case 828:
				tooltip += ' of verplaats deze module';
				break;
			case 14:
				tooltip += ', of hernoem deze categorie';
				break;
			default:
				tooltip += ' voor deze pagina';
				break;
		}
	}
	Twinkle.addPortletLink(Twinkle.xfd.callback, 'TBx', 'tw-xfd', tooltip);
};


var utils = {
	/** Get ordinal number figure */
	num2order: function(num) {
		switch (num) {
			case 1: return '1ste';
			default: return num + 'e';
		}
	},

	/**
	 * Remove namespace name from title if present
	 * Exception-safe wrapper around mw.Title
	 * @param {string} title
	 */
	stripNs: function(title) {
		var title_obj = mw.Title.newFromUserInput(title);
		if (!title_obj) {
			return title; // user entered invalid input; do nothing
		}
		return title_obj.getNameText();
	},

	/**
	 * Add namespace name to page title if not already given
	 * CAUTION: namespace name won't be added if a namespace (*not* necessarily
	 * the same as the one given) already is there in the title
	 * @param {string} title
	 * @param {number} namespaceNumber
	 */
	addNs: function(title, namespaceNumber) {
		var title_obj = mw.Title.newFromUserInput(title, namespaceNumber);
		if (!title_obj) {
			return title;  // user entered invalid input; do nothing
		}
		return title_obj.toText();
	},

	/**
	 * Provide Wikipedian TLA style: AfD, RfD, CfDS, RM, SfD, etc.
	 * @param {string} venue
	 * @returns {string}
	 */
	toTLACase: function(venue) {
		return venue
			.toString()
			// Everybody up, inclduing rm and the terminal s in cfds
			.toUpperCase()
			// Lowercase the central f in a given TLA and normalize sfd-t and sfr-t
			.replace(/(.)F(.)(?:-.)?/, '$1f$2');
	}
};

Twinkle.xfd.currentRationale = null;

// error callback on Morebits.status.object
Twinkle.xfd.printRationale = function twinklexfdPrintRationale() {
	if (Twinkle.xfd.currentRationale) {
		Morebits.status.printUserText(Twinkle.xfd.currentRationale, 'Je nominatiereden wordt hieronder weergeven, welke je kunt kopiëren-en-plakken naar een nieuw TBx scherm voor als je overnieuw wil beginnen:');
		// only need to print the rationale once
		Twinkle.xfd.currentRationale = null;
	}
};

Twinkle.xfd.callback = function twinklexfdCallback() {
	var Window = new Morebits.simpleWindow(700, 400);
	Window.setTitle('Maak verwijdernominatie (TBx)');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Over verwijdernominaties', 'WP:XFD');
	Window.addFooterLink('TBx voorkeuren', 'WP:TW/PREF#xfd');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#xfd');
	Window.addFooterLink('Geef feedback', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.xfd.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'venue',
		label: 'Locatie voor nominatie:',
		tooltip: 'Indien ingeschakeld, wordt standaard de relevante naamruimte geselecteerd. In veel gevallen is deze standaard keuze de meest geschikte keuze.',
		event: Twinkle.xfd.callback.change_category
	});
	var namespace = mw.config.get('wgNamespaceNumber');

	categories.append({
		type: 'option',
		label: 'TBP (Te Beoordelen Pagina\'s)',
		selected: namespace === 0,  // Main namespace
		value: 'afd'
	});
	categories.append({
		type: 'option',
		label: 'TBS (Te Beoordelen Sjablonen)',
		selected: namespace === 10,  // Template namespace
		value: 'tfd'
	});
	categories.append({
		type: 'option',
		label: 'TBC (Te Beoordelen Categorieën)',
		selected: namespace === 14,  // Category namespace
		value: 'cfd'
	});

	form.append({
		type: 'div',
		id: 'wrong-venue-warn',
		style: 'color: red; font-style: italic'
	});

	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Breng aanmaker op de hoogte (indien mogelijk)',
				value: 'notify',
				name: 'notifycreator',
				tooltip: "Een mededeling van nominatie wordt op de overlegpagina van de aanmaker geplaatst.",
				checked: true
			}
		]
	});
	form.append({
		type: 'field',
		label: 'Werk gebied',
		name: 'work_area'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.xfd.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Voorvertoning';
	form.append({ type: 'div', id: 'xfdpreview', label: [ previewlink ] });
	form.append({ type: 'div', id: 'twinklexfd-previewbox', style: 'display: none' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklexfd-previewbox').last()[0]);

	// We must init the controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.venue.dispatchEvent(evt);
};

Twinkle.xfd.callback.wrongVenueWarning = function twinklexfdWrongVenueWarning(venue) {
	var text = '';
	var namespace = mw.config.get('wgNamespaceNumber');

	switch (venue) {
		case 'afd':
			if (namespace === 10 || namespace === 14) {
				text = 'De TBP wordt NIET voor sjablonen of categorieën gebruikt.';
			}
			break;
		case 'tfd':
			if (namespace !== 10) {
				text = 'De TBS wordt ALLEEN voor sjablonen gebruikt.';
			}
			break;
		case 'cfd':
			if (namespace !== 14) {
				text = 'De TBC wordt ALLEEN voor categorieën gebruikt.';
			}
			break;
		default:
			break;
	}

	$('#wrong-venue-warn').text(text);

};

Twinkle.xfd.callback.change_category = function twinklexfdCallbackChangeCategory(e) {
	var value = e.target.value;
	var form = e.target.form;
	var old_area = Morebits.quickForm.getElements(e.target.form, 'work_area')[0];
	var work_area = null;

	var oldreasontextbox = form.getElementsByTagName('textarea')[0];
	var oldreason = oldreasontextbox ? oldreasontextbox.value : '';

	var appendReasonBox = function twinklexfdAppendReasonBox() {
		work_area.append({
			type: 'textarea',
			name: 'reason',
			label: 'Reden: ',
			value: oldreason,
			tooltip: 'Je kunt wikiopmaak gebruiken in je reden.'
		});
	};

	Twinkle.xfd.callback.wrongVenueWarning(value);

	form.previewer.closePreview();

	switch (value) {
		case 'afd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Artikel nomineren voor verwijdering',
				name: 'work_area'
			});

			var sjabloon_select = work_area.append({
				type: 'select',
				label: 'Sjabloon:',
				name: 'sjabloon'
			});
			sjabloon_select.append({ type: 'option', label: '{{wiu}} Werk in uitvoering', value: 'wiu', selected: true });
			sjabloon_select.append({ type: 'option', label: '{{ne}} Niet encyclopedisch', value: 'ne' });
			sjabloon_select.append({ type: 'option', label: '{{wb}} Woordenboekdefinitie', value: 'wb' });
			sjabloon_select.append({ type: 'option', label: '{{reclame}} Promotionele uiting', value: 'reclame' });
			sjabloon_select.append({ type: 'option', label: '{{auteur}} Schending auteursrechten', value: 'auteur' });

			if ((mw.config.get('wgNamespaceNumber') === 2 /* Gebruiker: */ || mw.config.get('wgNamespaceNumber') === 3 /* Overleg gebruiker: */) && mw.config.exists('wgRelevantUserName')) {
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: 'Breng eigenaar van paginaruimte op de hoogte (indien dit niet je eigen paginaruimte is)',
							value: 'notifyuserspace',
							name: 'notifyuserspace',
							checked: true
						}
					]
				});
			}
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'tfd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Sjabloon nomineren voor verwijdering',
				name: 'work_area'
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'cfd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Categorie nomineren voor verwijdering',
				name: 'work_area'
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Nomineer niets',
				name: 'work_area'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}

	// Return to checked state when switching, but no creator notification for CFDS or RM
	form.notifycreator.disabled = value === 'cfds' || value === 'rm';
	form.notifycreator.checked = !form.notifycreator.disabled;
};


Twinkle.xfd.callbacks = {
	// Requires having the tag text (params.tagText) set ahead of time
	autoEditRequest: function(pageobj, params) {
		var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
		if (talkName === pageobj.getPageName()) {
			pageobj.getStatusElement().error('Pagina beveiligd, nominatie sjabloon kan daarom niet geplaatst worden. Nominatie afgebroken');
		} else {
			pageobj.getStatusElement().warn('Pagina beveiligd, bewerking aangevraagd');

			var editRequest = '{{subst:Xfd edit protected|page=' + pageobj.getPageName() +
				'|discussion=' + params.discussionpage + (params.venue === 'rfd' ? '|rfd=yes' : '') +
				'|tag=<nowiki>' + params.tagText + '\u003C/nowiki>}}'; // U+003C: <

			var talk_page = new Morebits.wiki.page(talkName, 'Bewerkingsverzoek op overlegpagina plaatsen');
			talk_page.setNewSectionTitle('Bewerkingsverzoek om ' + utils.toTLACase(params.venue) + ' te nomineren');
			talk_page.setNewSectionText(editRequest);
			talk_page.setCreateOption('recreate');
			talk_page.setWatchlist(Twinkle.getPref('xfdWatchPage'));
			talk_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
			talk_page.setChangeTags(Twinkle.changeTags);
			talk_page.setCallbackParameters(params);
			talk_page.newSection(null, function() {
				talk_page.getStatusElement().warn('Verzoek plaatsen mislukt, misschien is de overlegpagina ook beveiligd');
			});
		}
	},
	getDiscussionWikitext: function(venue, params) {
		if (venue === 'afd') {
			var text = '{{' + params.sjabloon;
			text += '|1=' + params.reason;
			text += '|2={{subst:LOCALYEAR}}|3={{subst:LOCALMONTH}}|4={{subst:LOCALDAY2}}}}';
			return text;
		} else if (venue === 'cfd') {
			var text = '{{categorieweg';
			text += '|1=' + params.reason;
			text += '|2={{subst:LOCALYEAR}}|3={{subst:LOCALMONTH}}|4={{subst:LOCALDAY2}}}}';
			return text;
		} else {
			var text = '{{sjabloonweg';
			text += '|1=' + params.reason;
			text += '|2={{subst:LOCALYEAR}}|3={{subst:LOCALMONTH}}|4={{subst:LOCALDAY2}}}}';
			return text;
		}
	},
	showPreview: function(form, venue, params) {
		var templatetext = Twinkle.xfd.callbacks.getDiscussionWikitext(venue, params);
		form.previewer.beginRender(templatetext, 'WP:TW'); // Force wikitext
	},
	preview: function(form) {
		// venue, reason, xfdcat, tfdtarget, cfdtarget, cfdtarget2, cfdstarget, delsortCats, newname
		var params = Morebits.quickForm.getInputData(form);

		var venue = params.venue;

		// Remove CfD or TfD namespace prefixes if given
		if (params.tfdtarget) {
			params.tfdtarget = utils.stripNs(params.tfdtarget);
		} else if (params.cfdtarget) {
			params.cfdtarget = utils.stripNs(params.cfdtarget);
			if (params.cfdtarget2) {
				params.cfdtarget2 = utils.stripNs(params.cfdtarget2);
			}
		} else if (params.cfdstarget) { // Add namespace if not given (CFDS)
			params.cfdstarget = utils.addNs(params.cfdstarget, 14);
		}

		if (venue === 'cfd') { // Swap in CfD subactions
			Twinkle.xfd.callbacks.showPreview(form, params.xfdcat, params);
		} else {
			Twinkle.xfd.callbacks.showPreview(form, venue, params);
		}
	},
	/**
	 * Unified handler for sending {{Xfd notice}} notifications
	 * Also handles userspace logging
	 * @param {object} params
	 * @param {string} notifyTarget The user or page being notified
	 * @param {boolean} [noLog=false] Whether to skip logging to userspace
	 * XfD log, especially useful in cases in where multiple notifications
	 * may be sent out (MfD, TfM, RfD)
	 * @param {string} [actionName] Alternative description of the action
	 * being undertaken. Required if not notifying a user talk page.
	 */
	notifyUser: function(params, notifyTarget, noLog, actionName) {
		// Ensure items with User talk or no namespace prefix both end
		// up at user talkspace as expected, but retain the
		// prefix-less username for addToLog
		notifyTarget = mw.Title.newFromText(notifyTarget, 3);
		var targetNS = notifyTarget.getNamespaceId();
		var usernameOrTarget = notifyTarget.getRelativeText(3);
		notifyTarget = notifyTarget.toText();
		if (targetNS === 3) {
			// Disallow warning yourself
			if (usernameOrTarget === mw.config.get('wgUserName')) {
				Morebits.status.warn('Jij (' + usernameOrTarget + ') hebt deze pagina aangemaakt; notificatie overgeslagen');

				// if we thought we would notify someone but didn't,
				// then jump to logging.
				Twinkle.xfd.callbacks.addToLog(params, null);
				return;
			}
			// Default is notifying the initial contributor, but MfD also
			// notifies userspace page owner
			actionName = actionName || 'Notificeer originele aanmaker (' + usernameOrTarget + ')';
		}

		var notifytext = '\n{{subst:' + params.venue + ' notice';
		// Venue-specific parameters
		switch (params.venue) {
			case 'afd':
				notifytext += params.numbering !== '' ? '|order=&#32;' + params.numbering : '';
				break;
			case 'cfd':
				notifytext += '|action=' + params.action + (mw.config.get('wgNamespaceNumber') === 10 ? '|stub=yes' : '');
				break;
			default: // tfd
				break;
		}
		notifytext += '|1=' + Morebits.pageNameNorm + '}} ~~~~';

		// Link to the venue; object used here rather than repetitive items in switch
		var venueNames = {
			afd: 'Te Beoordelen Pagina\'s',
			tfd: 'Te Beoordelen Sjablonen',
			cfd: 'Te Beoordelen Categorieën',
		};
		var editSummary = 'Notificatie: [[' + params.discussionpage + '|nominatie]] van [[:' +
			Morebits.pageNameNorm + ']] op [[WP:' + venueNames[params.venue] + ']].';

		var usertalkpage = new Morebits.wiki.page(notifyTarget, actionName);
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary(editSummary);
		usertalkpage.setChangeTags(Twinkle.changeTags);
		usertalkpage.setCreateOption('recreate');
		usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchUser'));
		usertalkpage.setFollowRedirect(true, false);

		if (noLog) {
			usertalkpage.append();
		} else {
			usertalkpage.append(function onNotifySuccess() {
				// Don't treat RfD target or MfD userspace owner as initialContrib in log
				if (!params.notifycreator) {
					notifyTarget = null;
				}
				// add this nomination to the user's userspace log
				Twinkle.xfd.callbacks.addToLog(params, usernameOrTarget);
			}, function onNotifyError() {
				// if user could not be notified, log nomination without mentioning that notification was sent
				Twinkle.xfd.callbacks.addToLog(params, null);
			});
		}
	},
	addToLog: function(params, initialContrib) {
		if (!Twinkle.getPref('logXfdNominations') || Twinkle.getPref('noLogOnXfdNomination').indexOf(params.venue) !== -1) {
			return;
		}

		var usl = new Morebits.userspaceLogger(Twinkle.getPref('xfdLogPageName'));// , 'Adding entry to userspace log');

		usl.initialText =
			"Dit is een logboek voor alle [[WP:TBP|verwijdernominaties]] die door deze gebruiker met [[WP:TW|Twinkle]] zijn gemaakt.\n\n" +
			'Indien je dit logboek niet langer wil behouden, kun je het uitschakelen via het [[Wikipedia:Twinkle/Preferences|configuratiescherm]], ' +
			'en deze pagina nomineren voor directe verwijdering.' +
			(Morebits.userIsSysop ? '\n\nDit logboek bewaard niet jouw moderatorafhandeling van een TBP-nominatie!' : '');

		var editsummary = 'Loggen van ' + utils.toTLACase(params.venue) + ' nominatie van [[:' + Morebits.pageNameNorm + ']].';

		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';
		// CFD/S and RM don't have canonical links
		var nominatedLink = params.discussionpage ? '[[' + params.discussionpage + '|genomineerd]]' : 'genomineerd';

		var appendText = '# [[:' + Morebits.pageNameNorm + ']]:' + fileLogLink + ' ' + nominatedLink + ' op [[WP:' + params.venue.toUpperCase() + '|' + utils.toTLACase(params.venue) + ']]';

		switch (params.venue) {
			case 'cfd':
				appendText += ' (' + utils.toTLACase(params.xfdcat) + ')';
				if (params.cfdtarget) {
					var categoryOrTemplate = params.xfdcat.charAt(0) === 's' ? 'Sjabloon:' : ':Categorie:';
					appendText += '; ' + params.action + ' to [[' + categoryOrTemplate + params.cfdtarget + ']]';
					if (params.xfdcat === 'cfs' && params.cfdtarget2) {
						appendText += ', [[' + categoryOrTemplate + params.cfdtarget2 + ']]';
					}
				}
				break;
			default: // afd, tfd
				break;
		}

		if (initialContrib && params.notifycreator) {
			appendText += '; {{gebruiker|1=' + initialContrib + '}} genotificeerd';
		}
		appendText += ' ~~~~~';
		if (params.reason) {
			appendText += "\n#* '''Reden''': " + Morebits.string.formatReasonForLog(params.reason);
		}

		usl.changeTags = Twinkle.changeTags;
		usl.log(appendText, editsummary);
	},

	afd: {
		main: function(apiobj) {
			var response = apiobj.getResponse();
			var titles = response.query.allpages;

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].title;

					// First, simple test, is there an instance with this exact name?
					if (title === 'Wikipedia:Te Beoordelen Pagina\'s/' + Morebits.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var order_re = new RegExp('^' +
						Morebits.string.escapeRegExp('Wikipedia:Te Beoordelen Pagina\'s/' + Morebits.pageNameNorm) +
						'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				apiobj.params.number = utils.num2order(parseInt(number, 10) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Articles for deletion/' + Morebits.pageNameNorm + apiobj.params.numbering;

			Morebits.status.info('Next discussion page', '[[' + apiobj.params.discussionpage + ']]');

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			Morebits.wiki.actionCompleted.notice = 'Nominatie voltooit, je wordt doorgestuurd naar de discussiepagina';

			// Tagging article
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Nominatie aan artikel toevoegen ');
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
			wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.taggingArticle);
		},
		// Tagging needs to happen before everything else: this means we can check if there is an AfD tag already on the page
		taggingArticle: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("Het lijkt erop dat de pagina niet bestaat; misschien is de pagina al verwijderd?");
				return;
			}

			// Check for existing AfD tag, for the benefit of new page patrollers
			var textNoAfd = text.replace(/<!--.*AfD.*\n\{\{(?:Article for deletion\/dated|AfDM).*\}\}\n<!--.*(?:\n<!--.*)?AfD.*(?:\s*\n)?/g, '');
			if (text !== textNoAfd) {
				if (confirm('Een TBP sjabloon is al gevonden op dit artikel. Misschien was iemand sneller.  \nKlik op OK om de nominatie te vervangen met jouw nominatie (niet verstandig), of Cancel om je nominatie af te breken.')) {
					text = textNoAfd;
				} else {
					statelem.error('Artikel al genomineerd, en jij hebt gekozen je nominatie af te breken');
					window.location.reload();
					return;
				}
			}

			// Now we know we want to go ahead with it, trigger the other AJAX requests

			// Mark the page as curated/patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				new Morebits.wiki.page(Morebits.pageNameNorm).triage();
			}

			// Start discussion page, will also handle pagetriage and delsort listings
			var wikipedia_page = new Morebits.wiki.page(params.discussionpage, 'Maak een verwijdernominatie aan');
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.discussionPage);

			// Today's list
			var date = new Morebits.date(pageobj.getLoadTime());
			wikipedia_page = new Morebits.wiki.page('Wikipedia:Te beoordelen pagina\'s/Toegevoegd ' +
				date.format('YYYYMMDD', 'cet-cest'), "Toevoegen aan nominatiepagina");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.todaysList);
			// Notification to first contributor
			if (params.notifycreator) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
				thispage.lookupCreation(function(pageobj) {
					Twinkle.xfd.callbacks.notifyUser(pageobj.getCallbackParameters(), pageobj.getCreator());
				});
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}

			params.tagText = (params.noinclude ? '<noinclude>{{' : '{{') + (params.number === '' ? 'subst:afd|help=off' : 'subst:afdx|' +
					params.number + '|help=off') + (params.noinclude ? '}}</noinclude>\n' : '}}\n');

			if (pageobj.canEdit()) {
			// Remove some tags that should always be removed on AfD.
				text = text.replace(/\{\{\s*(dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated|prod2|Proposed deletion endorsed|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
				// Then, test if there are speedy deletion-related templates on the article.
				var textNoSd = text.replace(/\{\{\s*(db(-\w*)?|delete|(?:hang|hold)[- ]?on)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
				if (text !== textNoSd && confirm('Een nuweg nominatie was gevonden op de pagina. Moet deze vervangen worden?')) {
					text = textNoSd;
				}

				// Insert tag after short description or any hatnotes
				var wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(params.tagText, Twinkle.hatnoteRegex).getText();

				pageobj.setPageText(text);
				pageobj.setEditSummary('Genomineerd voor verwijdering; zie [[:' + params.discussionpage + ']].');
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('nocreate');
				pageobj.save();
			} else {
				Twinkle.xfd.callbacks.autoEditRequest(pageobj, params);
			}
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(Twinkle.xfd.callbacks.getDiscussionWikitext('afd', params));
			pageobj.setEditSummary('Verwijdernominatie voor [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki

				// Actions that should wait on the discussion page actually being created
				// and whose errors shouldn't output the user rationale
				// List at deletion sorting pages
				if (params.delsortCats) {
					params.delsortCats.forEach(function (cat) {
						var delsortPage = new Morebits.wiki.page('Wikipedia:WikiProject Deletion sorting/' + cat, 'Adding to list of ' + cat + '-related deletion discussions');
						delsortPage.setFollowRedirect(true); // In case a category gets renamed
						delsortPage.setCallbackParameters({discussionPage: params.discussionpage});
						delsortPage.load(Twinkle.xfd.callbacks.afd.delsortListing);
					});
				}
			});
		},
		todaysList: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = '{{subst:afd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}\n';
			var text;

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:AfD log}}\n' + added_data;
			} else {
				var old_text = pageobj.getPageText() + '\n';  // MW strips trailing blanks, but we like them, so we add a fake one

				text = old_text.replace(/(<!-- Add new entries to the TOP of the following list -->\n+)/, '$1' + added_data);
				if (text === old_text) {
					var linknode = document.createElement('a');
					linknode.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing AFD') + '?action=purge');
					linknode.appendChild(document.createTextNode('How to fix AFD'));
					statelem.error([ 'Could not find the target spot for the discussion. To fix this problem, please see ', linknode, '.' ]);
					return;
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		delsortListing: function(pageobj) {
			var discussionPage = pageobj.getCallbackParameters().discussionPage;
			var text = pageobj.getPageText().replace('directly below this line -->', 'directly below this line -->\n{{' + discussionPage + '}}');
			pageobj.setPageText(text);
			pageobj.setEditSummary('Listing [[:' + discussionPage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		}
	},


	tfd: {
		main: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			var date = new Morebits.date(pageobj.getLoadTime());
			params.logpage = 'Wikipedia:Te beoordelen sjablonen/Toegevoegd ' + date.format('YYYY', 'cet-cest') + ' week ' + date.format('W', 'cet-cest'),
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;
			// Add log/discussion page params to the already-loaded page object
			pageobj.setCallbackParameters(params);

			// Defined here rather than below to reduce duplication
			var watchModule, watch_query;
			if (params.scribunto) {
				var watchPref = Twinkle.getPref('xfdWatchPage');
				// action=watch has no way to rely on user
				// preferences (T262912), so we do it manually.
				// The watchdefault pref appears to reliably return '1' (string),
				// but that's not consistent among prefs so might as well be "correct"
				watchModule = watchPref !== 'no' && (watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
				if (watchModule) {
					watch_query = {
						action: 'watch',
						titles: [ mw.config.get('wgPageName') ],
						token: mw.user.tokens.get('watchToken')
					};
					// Only add the expiry if page is unwatched or already temporarily watched
					if (pageobj.getWatched() !== true && watchPref !== 'default' && watchPref !== 'yes') {
						watch_query.expiry = watchPref;
					}
				}
			}

			// Tagging template(s)/module(s)
			if (params.xfdcat === 'tfm') { // Merge
				var wikipedia_otherpage;
				if (params.scribunto) {
					wikipedia_otherpage = new Morebits.wiki.page(params.otherTemplateName + '/doc', 'Tagging other module documentation with merge tag');

					// Watch tagged module pages as well
					if (watchModule) {
						watch_query.titles.push(params.otherTemplateName);
						new Morebits.wiki.api('Adding Modules to watchlist', watch_query).post();
					}
				} else {
					wikipedia_otherpage = new Morebits.wiki.page(params.otherTemplateName, 'Tagging other template with merge tag');
				}
				// Tag this template/module
				Twinkle.xfd.callbacks.tfd.taggingTemplateForMerge(pageobj);

				// Tag other template/module
				wikipedia_otherpage.setFollowRedirect(true);
				var otherParams = $.extend({}, params);
				otherParams.otherTemplateName = Morebits.pageNameNorm;
				wikipedia_otherpage.setCallbackParameters(otherParams);
				wikipedia_otherpage.load(Twinkle.xfd.callbacks.tfd.taggingTemplateForMerge);
			} else { // delete
				if (params.scribunto && Twinkle.getPref('xfdWatchPage') !== 'no') {
					// Watch tagged module page as well
					if (watchModule) {
						new Morebits.wiki.api('Adding Module to watchlist', watch_query).post();
					}
				}
				Twinkle.xfd.callbacks.tfd.taggingTemplate(pageobj);
			}


			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = params.logpage;
			Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion
			var wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's log");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.tfd.todaysList);

			// Notification to first contributors
			if (params.notifycreator) {
				var involvedpages = [];
				var seenusers = [];
				involvedpages.push(new Morebits.wiki.page(mw.config.get('wgPageName')));
				if (params.xfdcat === 'tfm') {
					if (params.scribunto) {
						involvedpages.push(new Morebits.wiki.page('Module:' + params.tfdtarget));
					} else {
						involvedpages.push(new Morebits.wiki.page('Template:' + params.tfdtarget));
					}
				}
				involvedpages.forEach(function(page) {
					page.setCallbackParameters(params);
					page.lookupCreation(function(innerpage) {
						var username = innerpage.getCreator();
						if (seenusers.indexOf(username) === -1) {
							seenusers.push(username);
							// Only log once on merge nominations, for the initial template
							Twinkle.xfd.callbacks.notifyUser(innerpage.getCallbackParameters(), username,
								params.xfdcat === 'tfm' && innerpage.getPageName() !== Morebits.pageNameNorm);
						}
					});
				});
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}

			// Notify developer(s) of script(s) that use(s) the nominated template
			if (params.devpages) {
				var inCategories = mw.config.get('wgCategories');
				var categoryNotificationPageMap = {
					'Templates used by Twinkle': 'Wikipedia talk:Twinkle',
					'Templates used by AutoWikiBrowser': 'Wikipedia talk:AutoWikiBrowser',
					'Templates used by RedWarn': 'Wikipedia talk:RedWarn'
				};
				$.each(categoryNotificationPageMap, function(category, page) {
					if (inCategories.indexOf(category) !== -1) {
						Twinkle.xfd.callbacks.notifyUser(params, page, true, 'Notifying ' + page + ' of template nomination');
					}
				});
			}

		},
		taggingTemplate: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			params.tagText = '{{subst:template for discussion|help=off' + (params.templatetype !== 'standard' ? '|type=' + params.templatetype : '') + '}}';

			if (pageobj.getContentModel() === 'sanitized-css') {
				params.tagText = '/* ' + params.tagText + ' */';
			} else {
				if (params.noinclude) {
					params.tagText = '<noinclude>' + params.tagText + '</noinclude>';
				}
				params.tagText += params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : ''; // No newline for inline
			}

			if (pageobj.canEdit() && ['wikitext', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				if (params.scribunto) {
					pageobj.setCreateOption('recreate'); // Module /doc might not exist
				}
				pageobj.save();
			} else {
				Twinkle.xfd.callbacks.autoEditRequest(pageobj, params);
			}
		},
		taggingTemplateForMerge: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			params.tagText = '{{subst:tfm|help=off|' + (params.templatetype !== 'standard' ? 'type=' + params.templatetype + '|' : '') +
				'1=' + params.otherTemplateName.replace(new RegExp('^' + Morebits.namespaceRegex([10, 828]) + ':'), '') + '}}';

			if (pageobj.getContentModel() === 'sanitized-css') {
				params.tagText = '/* ' + params.tagText + ' */';
			} else {
				if (params.noinclude) {
					params.tagText = '<noinclude>' + params.tagText + '</noinclude>';
				}
				params.tagText += params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : ''; // No newline for inline
			}

			if (pageobj.canEdit() && ['wikitext', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Listed for merging with [[:' + params.otherTemplateName + ']]; see [[:' + params.discussionpage + ']].');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				if (params.scribunto) {
					pageobj.setCreateOption('recreate'); // Module /doc might not exist
				}
				pageobj.save();
			} else {
				Twinkle.xfd.callbacks.autoEditRequest(pageobj, params);
			}
		},
		todaysList: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = Twinkle.xfd.callbacks.getDiscussionWikitext(params.xfdcat, params);
			var text;

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:TfD log}}\n' + added_data;
			} else {
				var old_text = pageobj.getPageText();

				text = old_text.replace('-->', '-->\n' + added_data);
				if (text === old_text) {
					statelem.error('failed to find target spot for the discussion');
					return;
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding ' + (params.xfdcat === 'tfd' ? 'deletion nomination' : 'merge listing') + ' of [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	},


	mfd: {
		main: function(apiobj) {
			var response = apiobj.getResponse();
			var titles = response.query.allpages;

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].title;

					// First, simple test, is there an instance with this exact name?
					if (title === 'Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var order_re = new RegExp('^' +
							Morebits.string.escapeRegExp('Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm) +
							'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				apiobj.params.number = utils.num2order(parseInt(number, 10) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm + apiobj.params.numbering;

			apiobj.statelem.info('next in order is [[' + apiobj.params.discussionpage + ']]');

			// Tagging page
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page with deletion tag');
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.taggingPage);

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Discussion page
			wikipedia_page = new Morebits.wiki.page(apiobj.params.discussionpage, 'Creating deletion discussion page');
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.discussionPage);

			// Today's list
			wikipedia_page = new Morebits.wiki.page('Wikipedia:Miscellany for deletion', "Adding discussion to today's list");
			wikipedia_page.setPageSection(2);
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.todaysList);

			// Notification to first contributor and/or notification to owner of userspace
			if (apiobj.params.notifycreator || apiobj.params.notifyuserspace) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(apiobj.params);
				thispage.lookupCreation(Twinkle.xfd.callbacks.mfd.sendNotifications);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(apiobj.params, null);
			}
		},
		taggingPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			params.tagText = '{{' + (params.number === '' ? 'mfd' : 'mfdx|' + params.number) + '|help=off}}';

			if (['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1) {
				params.tagText = '/* ' + params.tagText + ' */\n';
			} else {
				params.tagText += '\n';
				if (params.noinclude) {
					params.tagText = '<noinclude>' + params.tagText + '</noinclude>';
				}
			}

			if (pageobj.canEdit() && ['wikitext', 'javascript', 'css', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('nocreate');
				pageobj.save();
			} else {
				Twinkle.xfd.callbacks.autoEditRequest(pageobj, params);
			}
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(Twinkle.xfd.callbacks.getDiscussionWikitext('mfd', params));
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var date = new Morebits.date(pageobj.getLoadTime());
			var date_header = date.format('===MMMM D, YYYY===\n', 'utc');
			var date_header_regex = new RegExp(date.format('(===[\\s]*MMMM[\\s]+D,[\\s]+YYYY[\\s]*===)', 'utc'));
			var added_data = '{{subst:mfd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}';

			if (date_header_regex.test(text)) { // we have a section already
				statelem.info('Found today\'s section, proceeding to add new entry');
				text = text.replace(date_header_regex, '$1\n' + added_data);
			} else { // we need to create a new section
				statelem.info('No section for today found, proceeding to create one');
				text = text.replace('===', date_header + added_data + '\n\n===');
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		sendNotifications: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Notify the creator
			if (params.notifycreator) {
				Twinkle.xfd.callbacks.notifyUser(params, initialContrib);
			}

			// Notify the user who owns the subpage if they are not the creator
			params.userspaceOwner = mw.config.get('wgRelevantUserName');
			if (params.notifyuserspace) {
				if (params.userspaceOwner !== initialContrib) {
					// Don't log if notifying creator above, will log then
					Twinkle.xfd.callbacks.notifyUser(params, params.userspaceOwner, params.notifycreator, 'Notifying owner of userspace (' + params.userspaceOwner + ')');
				} else if (!params.notifycreator) {
					// If we thought we would notify the owner but didn't,
					// then we need to log if we didn't notify the creator
					// Twinkle.xfd.callbacks.addToLog(params, null);
					Twinkle.xfd.callbacks.addToLog(params, initialContrib);
				}
			}
		}
	},

	cfd: {
		main: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			var date = new Morebits.date(pageobj.getLoadTime());
			params.logpage = 'Wikipedia:Categories for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;
			// Add log/discussion page params to the already-loaded page object
			pageobj.setCallbackParameters(params);

			// Tagging category
			Twinkle.xfd.callbacks.cfd.taggingCategory(pageobj);

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = params.logpage;
			Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion to list
			var wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.cfd.todaysList);

			// Notification to first contributor
			if (params.notifycreator) {
				wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.lookupCreation(function(pageobj) {
					Twinkle.xfd.callbacks.notifyUser(pageobj.getCallbackParameters(), pageobj.getCreator());
				});
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}
		},
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			params.tagText = '{{subst:' + params.xfdcat;
			var editsummary = (mw.config.get('wgNamespaceNumber') === 14 ? 'Category' : 'Stub template') +
				' being considered for ' + params.action;
			switch (params.xfdcat) {
				case 'cfd':
				case 'sfd-t':
					break;
				case 'cfc':
					editsummary += ' to an article';
					// falls through
				case 'cfm':
				case 'cfr':
				case 'sfr-t':
					params.tagText += '|' + params.cfdtarget;
					break;
				case 'cfs':
					params.tagText += '|' + params.cfdtarget + '|' + params.cfdtarget2;
					break;
				default:
					alert('twinklexfd in taggingCategory(): unknown CFD action');
					break;
			}
			params.tagText += '}}\n';
			editsummary += '; see [[:' + params.discussionpage + ']].';

			if (pageobj.canEdit()) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary(editsummary);
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
				pageobj.save();
			} else {
				Twinkle.xfd.callbacks.autoEditRequest(pageobj, params);
			}
		},
		todaysList: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = Twinkle.xfd.callbacks.getDiscussionWikitext(params.xfdcat, params);
			var text;

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:CfD log}}\n' + added_data;
			} else {
				var old_text = pageobj.getPageText();

				text = old_text.replace('below this line -->', 'below this line -->\n' + added_data);
				if (text === old_text) {
					statelem.error('failed to find target spot for the discussion');
					return;
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding ' + params.action + ' nomination of [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	}
};



Twinkle.xfd.callback.evaluate = function(e) {
	var form = e.target;

	var params = Morebits.quickForm.getInputData(form);

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Twinkle.xfd.currentRationale = params.reason;
	Morebits.status.onError(Twinkle.xfd.printRationale);

	var query, wikipedia_page, wikipedia_api;
	switch (params.venue) {

		case 'afd': // AFD
			query = {
				action: 'query',
				list: 'allpages',
				apprefix: 'Articles for deletion/' + Morebits.pageNameNorm,
				apnamespace: 4,
				apfilterredir: 'nonredirects',
				aplimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			};
			wikipedia_api = new Morebits.wiki.api('Tagging article with deletion tag', query, Twinkle.xfd.callbacks.afd.main);
			wikipedia_api.params = params;
			wikipedia_api.post();
			break;

		case 'tfd': // TFD
			if (params.tfdtarget) { // remove namespace name
				params.tfdtarget = utils.stripNs(params.tfdtarget);
			}

			// Modules can't be tagged, TfD instructions are to place on /doc subpage
			params.scribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
			if (params.xfdcat === 'tfm') { // Merge
				// Tag this template/module
				if (params.scribunto) {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging this module documentation with merge tag');
					params.otherTemplateName = 'Module:' + params.tfdtarget;
				} else {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging this template with merge tag');
					params.otherTemplateName = 'Template:' + params.tfdtarget;
				}
			} else { // delete
				if (params.scribunto) {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging module documentation with deletion tag');
				} else {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging template with deletion tag');
				}
			}
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.tfd.main);
			break;


		case 'cfd':
			if (params.cfdtarget) {
				params.cfdtarget = utils.stripNs(params.cfdtarget);
			} else {
				params.cfdtarget = ''; // delete
			}
			if (params.cfdtarget2) { // split
				params.cfdtarget2 = utils.stripNs(params.cfdtarget2);
			}

			// Used for customized actions in edit summaries and the notification template
			var summaryActions = {
				'cfd': 'deletion',
				'sfd-t': 'deletion',
				'cfm': 'merging',
				'cfr': 'renaming',
				'sfr-t': 'renaming',
				'cfs': 'splitting',
				'cfc': 'conversion'
			};
			params.action = summaryActions[params.xfdcat];

			// Tagging category
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging category with ' + params.action + ' tag');
			wikipedia_page.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.cfd.main);
			break;

		default:
			alert('twinklexfd: unknown XFD discussion venue');
			break;
	}
};

Twinkle.addInitCallback(Twinkle.xfd, 'xfd');
})(jQuery);


// </nowiki>
