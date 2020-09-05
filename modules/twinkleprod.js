// <nowiki>


(function($) {


/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("PROD")
 * Active on:              Existing articles, files, books which are not redirects,
 *                         and user pages in [[:Category:Wikipedia books (user books)]]
 */

Twinkle.prod = function twinkleprod() {
	if ((([0, 6, 108].indexOf(mw.config.get('wgNamespaceNumber')) === -1) && (mw.config.get('wgNamespaceNumber') !== 2 || mw.config.get('wgCategories').indexOf('Wikipedia books (user books)') === -1))
		|| !mw.config.get('wgCurRevisionId') || Morebits.wiki.isPageRedirect()) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.prod.callback, 'PROD', 'tw-prod', 'Propose deletion via WP:PROD');
};

// Used in edit summaries, for comparisons, etc.
var namespace;

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	switch (mw.config.get('wgNamespaceNumber')) {
		case 0:
			namespace = 'article';
			break;
		case 6:
			namespace = 'file';
			break;
		case 2:
		case 108:
			namespace = 'book';
			break;
		// no default
	}

	var Window = new Morebits.simpleWindow(800, 410);
	Window.setTitle('Proposed deletion (PROD)');
	Window.setScriptName('Twinkle');

	var form = new Morebits.quickForm(Twinkle.prod.callback.evaluate);

	if (namespace === 'article') {
		Window.addFooterLink('Proposed deletion policy', 'WP:PROD');
		Window.addFooterLink('BLP PROD policy', 'WP:BLPPROD');
	} else if (namespace === 'file') {
		Window.addFooterLink('Proposed deletion policy', 'WP:PROD');
	} else { // if book
		Window.addFooterLink('Proposed deletion (books) policy', 'WP:BOOKPROD');
	}

	var field = form.append({
		type: 'field',
		label: 'PROD type',
		id: 'prodtype_fieldset'
	});

	field.append({
		type: 'div',
		label: Twinkle.makeFindSourcesDiv(),
		style: 'margin-bottom: 5px;'
	});

	field.append({
		type: 'radio',
		name: 'prodtype',
		event: Twinkle.prod.callback.prodtypechanged,
		list: [
			{
				label: 'PROD (proposed deletion)',
				value: 'prod',
				checked: true,
				tooltip: 'Normal proposed deletion, per [[WP:PROD]]'
			},
			{
				label: 'BLP PROD (proposed deletion of unsourced BLPs)',
				value: 'prodblp',
				tooltip: 'Proposed deletion of new, completely unsourced biographies of living persons, per [[WP:BLPPROD]]'
			}
		]
	});

	// Placeholder fieldset to be replaced in Twinkle.prod.callback.prodtypechanged
	form.append({
		type: 'field',
		name: 'parameters'
	});

	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#prod');

	form.append({ type: 'submit', label: 'Propose deletion' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// Hide fieldset for File and Book PROD types since only normal PROD is allowed
	if (namespace !== 'article') {
		$(result).find('#prodtype_fieldset').hide();
	}

	// Fake a change event on the first prod type radio, to initialize the type-dependent controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.prodtype[0].dispatchEvent(evt);

};


Twinkle.prod.callback.prodtypechanged = function(event) {
	// prepare frame for prod type dependant controls
	var field = new Morebits.quickForm.element({
		type: 'field',
		label: 'Parameters',
		name: 'parameters'
	});
	// create prod type dependant controls
	switch (event.target.values) {
		case 'prod':
			field.append({
				type: 'checkbox',
				list: [
					{
						label: 'Notify page creator if possible',
						value: 'notify',
						name: 'notify',
						tooltip: "A notification template will be placed on the creator's talk page if this is true.",
						checked: true
					}
				]
			});
			field.append({
				type: 'textarea',
				name: 'reason',
				label: 'Reason for proposed deletion:',
				value: Twinkle.prod.defaultReason
			});
			break;

		case 'prodblp':
			// first, remember the prod value that the user entered in the textarea, in case they want to switch back. We can abuse the config field for that.
			if (event.target.form.reason) {
				Twinkle.prod.defaultReason = event.target.form.reason.value;
			}

			field.append({
				type: 'checkbox',
				list: [
					{
						label: 'Notify page creator if possible',
						value: 'notify',
						name: 'notify',
						tooltip: 'Creator of article has to be notified.',
						checked: true,
						disabled: true
					}
				]
			});
			// temp warning, can be removed down the line once BLPPROD is more established. Amalthea, May 2010.
			var boldtext = document.createElement('b');
			boldtext.appendChild(document.createTextNode('Please note that only unsourced biographies of living persons are eligible for this tag, narrowly construed.'));
			field.append({
				type: 'div',
				label: boldtext
			});
			break;

		default:
			break;
	}

	event.target.form.replaceChild(field.render(), $(event.target.form).find('fieldset[name="parameters"]')[0]);
};

Twinkle.prod.callbacks = {
	checkpriors: function(apiobj) {
		var xmlDoc = apiobj.responseXML;
		var statelem = apiobj.statelem;
		var params = apiobj.params;

		// Check talk page for templates indicating prior XfD or PROD
		var numTemplates = $(xmlDoc).find('templates tl').length;
		if (numTemplates) {
			var template = $(xmlDoc).find('templates tl')[0].getAttribute('title');
			if (numTemplates === 1 && template === 'Template:Old prod') {
				params.oldProdPresent = true; // Mark for reference later, when deciding if to endorse
			// if there are multiple templates, at least one of them would be a prior xfd template
			} else {
				statelem.warn('Previous XfD template found on talk page, aborting procedure');
				return;
			}
		}

		var ts = new Morebits.wiki.page(mw.config.get('wgPageName'));
		ts.setFollowRedirect(true);  // for NPP, and also because redirects are ineligible for PROD
		ts.setCallbackParameters(params);
		ts.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
		ts.lookupCreation(Twinkle.prod.callbacks.creationInfo);
	},

	creationInfo: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		params.initialContrib = pageobj.getCreator();
		params.creation = pageobj.getCreationTimestamp();

		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = 'Tagging complete';

		var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page');
		wikipedia_page.setFollowRedirect(true);  // for NPP, and also because redirects are ineligible for PROD
		wikipedia_page.setChangeTags(Twinkle.changeTags);  // Here to apply to triage
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.prod.callbacks.main);
	},

	main: function(pageobj) {
		var statelem = pageobj.getStatusElement();

		if (!pageobj.exists()) {
			statelem.error("It seems that the page doesn't exist. Perhaps it has already been deleted.");
			return;
		}

		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// Check for already existing deletion tags
		var tag_re = /{{(?:db-?|delete|article for deletion\/dated|AfDM|ffd\b)|#invoke:RfD/i;
		if (tag_re.test(text)) {
			statelem.warn('Page already tagged with a deletion template, aborting procedure');
			return;
		}


		// Remove tags that become superfluous with this action
		text = text.replace(/{{\s*(userspace draft|mtc|(copy|move) to wikimedia commons|(copy |move )?to ?commons)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi, '');
		var prod_re = /{{\s*(?:Prod blp|Proposed deletion|book-prod)\/dated(?: files)?\s*\|(?:{{[^{}]*}}|[^{}])*}}/i;
		var summaryText;

		if (!prod_re.test(text)) {

			// Page previously PROD-ed
			if (params.oldProdPresent) {
				if (params.blp) {
					if (!confirm('Previous PROD nomination found on talk page. Do you still want to continue applying BLPPROD? ')) {
						statelem.warn('Previous PROD found on talk page, aborted by user');
						return;
					}
					statelem.info('Previous PROD found on talk page, continuing');
				} else {
					statelem.warn('Previous PROD found on talk page, aborting procedure');
					return;
				}
			}

			// Alert if article is at least three days old, not in Category:Living people, and BLPPROD is selected
			if (params.blp) {
				var isMoreThan3DaysOld = new Morebits.date(params.creation).add(3, 'days').isAfter(new Date(pageobj.getLoadTime()));
				var blpcheck_re = /\[\[Category:Living people\]\]/i;
				if (!blpcheck_re.test(text) && isMoreThan3DaysOld) {
					if (!confirm('Please note that the article is not in Category:Living people and hence may be ineligible for BLPPROD. Are you sure you want to continue? \n\nYou may wish to add the category if you proceed, unless the article is about a recently deceased person.')) {
						return;
					}
				}
			}

			// Notification to first contributor
			if (params.usertalk) {
				// Disallow warning yourself
				if (params.initialContrib === mw.config.get('wgUserName')) {
					statelem.warn('You (' + params.initialContrib + ') created this page; skipping user notification');
					if (Twinkle.getPref('logProdPages')) {
						Twinkle.prod.callbacks.addToLog(params);
					}
				} else {
					// [[Template:Proposed deletion notify]] supports File namespace
					var notifyTemplate;
					if (params.blp) {
						notifyTemplate = 'prodwarningBLP';
					} else if (params.book) {
						notifyTemplate = 'bprodwarning';
					} else {
						notifyTemplate = 'proposed deletion notify';
					}
					var notifytext = '\n{{subst:' + notifyTemplate + '|1=' + Morebits.pageNameNorm + '|concern=' + params.reason + '}} ~~~~';

					var usertalkpage = new Morebits.wiki.page('User talk:' + params.initialContrib, 'Notifying initial contributor (' + params.initialContrib + ')');
					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary('Notification: proposed deletion of [[:' + Morebits.pageNameNorm + ']].');
					usertalkpage.setChangeTags(Twinkle.changeTags);
					usertalkpage.setCreateOption('recreate');
					usertalkpage.setFollowRedirect(true, false);
					usertalkpage.setCallbackParameters(params);
					usertalkpage.append(function onNotifySuccess() {
						// add nomination to the userspace log, if the user has enabled it
						if (Twinkle.getPref('logProdPages')) {
							params.logInitialContrib = params.initialContrib;
							Twinkle.prod.callbacks.addToLog(params);
						}
					}, function onNotifyError() {
						// if user could not be notified, log nomination without mentioning that notification was sent
						if (Twinkle.getPref('logProdPages')) {
							Twinkle.prod.callbacks.addToLog(params);
						}
					});
				}
			} else if (Twinkle.getPref('logProdPages')) { // If not notifying, log this PROD
				Twinkle.prod.callbacks.addToLog(params);
			}
			var tag;
			if (params.blp) {
				summaryText = 'Proposing article for deletion per [[WP:BLPPROD]].';
				tag = '{{subst:prod blp' + (params.usertalk ? '|help=off' : '') + '}}';
			} else if (params.book) {
				summaryText = 'Proposing book for deletion per [[WP:BOOKPROD]].';
				tag = '{{subst:book-prod|1=' + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? '|help=off' : '') + '}}';
			} else {
				summaryText = 'Proposing ' + namespace + ' for deletion per [[WP:PROD]].';
				tag = '{{subst:prod|1=' + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? '|help=off' : '') + '}}';
			}

			// Insert tag after short description or any hatnotes
			var wikipage = new Morebits.wikitext.page(text);
			text = wikipage.insertAfterTemplates(tag + '\n', Twinkle.hatnoteRegex).getText();

			// Add {{Old prod}} to the talk page
			if (!params.oldProdPresent) {
				var oldprodfull = '{{Old prod|nom=' + mw.config.get('wgUserName') + '|nomdate={{subst:#time: Y-m-d}}}}\n';
				var talktitle = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
				var talkpage = new Morebits.wiki.page(talktitle, 'Placing {{Old prod}} on talk page');
				talkpage.setPrependText(oldprodfull);
				talkpage.setEditSummary('Adding {{Old prod}}');
				talkpage.setChangeTags(Twinkle.changeTags);
				talkpage.setFollowRedirect(true);  // match behavior for page tagging
				talkpage.setCreateOption('recreate');
				talkpage.prepend();
			}
		} else {  // already tagged for PROD, so try endorsing it
			var prod2_re = /{{(?:Proposed deletion endorsed|prod-?2).*?}}/i;
			if (prod2_re.test(text)) {
				statelem.warn('Page already tagged with {{proposed deletion}} and {{proposed deletion endorsed}} templates, aborting procedure');
				return;
			}
			var confirmtext = 'A {{proposed deletion}} tag was already found on this page. \nWould you like to add a {{proposed deletion endorsed}} tag with your explanation?';
			if (params.blp && !/{{\s*Prod blp\/dated/.test(text)) {
				confirmtext = 'A non-BLP {{proposed deletion}} tag was found on this article.\nWould you like to add a {{proposed deletion endorsed}} tag with explanation "article is a biography of a living person with no sources"?';
			}
			if (!confirm(confirmtext)) {
				statelem.warn('Aborted per user request');
				return;
			}

			summaryText = 'Endorsing proposed deletion per [[WP:' + (params.blp ? 'BLP' : params.book ? 'BOOK' : '') + 'PROD]].';
			text = text.replace(prod_re, text.match(prod_re) + '\n{{Proposed deletion endorsed|1=' + (params.blp ?
				'article is a [[WP:BLPPROD|biography of a living person with no sources]]' :
				Morebits.string.formatReasonText(params.reason)) + '}}\n');

			if (Twinkle.getPref('logProdPages')) {
				params.logEndorsing = true;
				Twinkle.prod.callbacks.addToLog(params);
			}
		}

		// curate/patrol the page
		if (Twinkle.getPref('markProdPagesAsPatrolled')) {
			pageobj.triage();
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText);
		pageobj.setWatchlist(Twinkle.getPref('watchProdPages'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},

	addToLog: function(params) {
		var usl = new Morebits.userspaceLogger(Twinkle.getPref('prodLogPageName'));
		usl.initialText =
			"This is a log of all [[WP:PROD|proposed deletion]] tags applied or endorsed by this user using [[WP:TW|Twinkle]]'s PROD module.\n\n" +
			'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
			'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].\n';

		var logText = '# [[:' + Morebits.pageNameNorm + ']]';
		var summaryText;
		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		logText += namespace === 'file' ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log]): ' : ': ';
		if (params.logEndorsing) {
			logText += 'endorsed ' + (params.blp ? 'BLP ' : params.book ? 'BOOK' : '') + 'PROD. ~~~~~';
			if (params.reason) {
				logText += "\n#* '''Reason''': " + params.reason + '\n';
			}
			summaryText = 'Logging endorsement of PROD nomination of [[:' + Morebits.pageNameNorm + ']].';
		} else {
			logText += (params.blp ? 'BLP ' : params.book ? 'BOOK' : '') + 'PROD';
			if (params.logInitialContrib) {
				logText += '; notified {{user|' + params.logInitialContrib + '}}';
			}
			logText += ' ~~~~~\n';
			if (!params.blp && params.reason) {
				logText += "#* '''Reason''': " + Morebits.string.formatReasonForLog(params.reason) + '\n';
			}
			summaryText = 'Logging PROD nomination of [[:' + Morebits.pageNameNorm + ']].';
		}
		usl.changeTags = Twinkle.changeTags;

		usl.log(logText, summaryText);
	}

};

Twinkle.prod.callback.evaluate = function twinkleprodCallbackEvaluate(e) {
	var form = e.target;
	var input = Morebits.quickForm.getInputData(form);

	var params = {
		usertalk: input.notify || input.prodtype === 'prodblp',
		blp: input.prodtype === 'prodblp',
		book: namespace === 'book',
		reason: input.reason || '' // using an empty string here as fallback will help with prod-2.
	};

	if (!params.blp && !params.reason) {
		if (!confirm('You left the reason blank, do you really want to continue without providing one?')) {
			return;
		}
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	var talk_title = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
	// Talk page templates for PROD-able discussions
	var blocking_templates = 'Template:Old XfD multi|Template:Old MfD|Template:Oldffdfull|' + // Common prior XfD talk page templates
		'Template:Oldpuffull|' + // Legacy prior XfD template
		'Template:Olddelrev|' + // Prior DRV template
		'Template:Old prod';
	var query = {
		'action': 'query',
		'titles': talk_title,
		'prop': 'templates',
		'tltemplates': blocking_templates
	};

	var wikipedia_api = new Morebits.wiki.api('Checking talk page for prior nominations', query, Twinkle.prod.callbacks.checkpriors);
	wikipedia_api.params = params;
	wikipedia_api.post();
};

Twinkle.addInitCallback(Twinkle.prod, 'prod');
})(jQuery);


// </nowiki>
