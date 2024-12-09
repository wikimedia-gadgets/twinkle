// <nowiki>

(function() {

/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("PROD")
 * Active on:              Existing articles, files which are not redirects
 */

Twinkle.prod = function twinkleprod() {
	if ((![0, 6].includes(mw.config.get('wgNamespaceNumber'))) ||
		!mw.config.get('wgCurRevisionId') ||
		Morebits.isPageRedirect()) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.prod.callback, 'PROD', 'tw-prod', 'Propose deletion via WP:PROD');
};

// Used in edit summaries, for comparisons, etc.
let namespace;

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	switch (mw.config.get('wgNamespaceNumber')) {
		case 0:
			namespace = 'article';
			break;
		case 6:
			namespace = 'file';
			break;
		// no default
	}

	const Window = new Morebits.SimpleWindow(800, 410);
	Window.setTitle('Proposed deletion (PROD)');
	Window.setScriptName('Twinkle');

	const form = new Morebits.QuickForm(Twinkle.prod.callback.evaluate);

	if (namespace === 'article') {
		Window.addFooterLink('Proposed deletion policy', 'WP:PROD');
		Window.addFooterLink('BLP PROD policy', 'WP:BLPPROD');
	} else { // if file
		Window.addFooterLink('Proposed deletion policy', 'WP:PROD');
	}

	const field = form.append({
		type: 'field',
		label: 'PROD type',
		id: 'prodtype_fieldset'
	});

	field.append({
		type: 'div',
		label: '', // Added later by Twinkle.makeFindSourcesDiv()
		id: 'twinkle-prod-findsources',
		style: 'margin-bottom: 5px; margin-top: -5px;'
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

	Window.addFooterLink('PROD prefs', 'WP:TW/PREF#prod');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#prod');
	Window.addFooterLink('Give feedback', 'WT:TW');

	form.append({ type: 'submit', label: 'Propose deletion' });

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// Hide fieldset for File PROD type since only normal PROD is allowed
	if (namespace !== 'article') {
		$(result).find('#prodtype_fieldset').hide();
	}

	// Fake a change event on the first prod type radio, to initialize the type-dependent controls
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.prodtype[0].dispatchEvent(evt);

};

Twinkle.prod.callback.prodtypechanged = function(event) {
	// prepare frame for prod type dependant controls
	const field = new Morebits.QuickForm.Element({
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

	Twinkle.makeFindSourcesDiv('#twinkle-prod-findsources');

	event.target.form.replaceChild(field.render(), $(event.target.form).find('fieldset[name="parameters"]')[0]);
};

// global params object, initially set in evaluate(), and
// modified in various callback functions
let params = {};

Twinkle.prod.callbacks = {
	checkPriors: function twinkleprodcheckPriors() {
		const talk_title = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
		// Talk page templates for PROD-able discussions
		const blocking_templates = 'Template:Old XfD multi|Template:Old MfD|Template:Oldffdfull|' + // Common prior XfD talk page templates
			'Template:Oldpuffull|' + // Legacy prior XfD template
			'Template:Olddelrev|' + // Prior DRV template
			'Template:Old prod';
		const query = {
			action: 'query',
			titles: talk_title,
			prop: 'templates',
			tltemplates: blocking_templates,
			format: 'json'
		};

		const wikipedia_api = new Morebits.wiki.Api('Checking talk page for prior nominations', query);
		return wikipedia_api.post().then((apiobj) => {
			const statelem = apiobj.statelem;

			// Check talk page for templates indicating prior XfD or PROD
			const templates = apiobj.getResponse().query.pages[0].templates;
			const numTemplates = templates && templates.length;
			if (numTemplates) {
				const template = templates[0].title;
				if (numTemplates === 1 && template === 'Template:Old prod') {
					params.oldProdPresent = true; // Mark for reference later, when deciding if to endorse
				// if there are multiple templates, at least one of them would be a prior xfd template
				} else {
					statelem.warn('Previous XfD template found on talk page, aborting procedure');
					return $.Deferred().reject();
				}
			}
		});
	},

	fetchCreationInfo: function twinkleprodFetchCreationInfo() {
		const def = $.Deferred();
		const ts = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Looking up page creator');
		ts.setFollowRedirect(true); // for NPP, and also because redirects are ineligible for PROD
		ts.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
		ts.lookupCreation((pageobj) => {
			params.initialContrib = pageobj.getCreator();
			params.creation = pageobj.getCreationTimestamp();
			pageobj.getStatusElement().info('Done, found ' + params.initialContrib);
			def.resolve();
		}, def.reject);
		return def;
	},

	taggingPage: function twinkleprodTaggingPage() {
		const def = $.Deferred();

		const wikipedia_page = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Tagging page');
		wikipedia_page.setFollowRedirect(true); // for NPP, and also because redirects are ineligible for PROD
		wikipedia_page.load((pageobj) => {
			const statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist. Perhaps it has already been deleted.");
				// reject, so that all dependent actions like notifyAuthor() and
				// addToLog() are cancelled
				return def.reject();
			}

			let text = pageobj.getPageText();

			// Check for already existing deletion tags
			const tag_re = /{{(?:article for deletion\/dated|AfDM|ffd\b)|#invoke:RfD/i;
			if (tag_re.test(text)) {
				statelem.warn('Page already tagged with a deletion template, aborting procedure');
				return def.reject();
			}

			// Remove tags that become superfluous with this action
			text = text.replace(/{{\s*(userspace draft|mtc|(copy|move) to wikimedia commons|(copy |move )?to ?commons)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi, '');
			const prod_re = /{{\s*(?:Prod blp|Proposed deletion)\/dated(?: files)?\s*\|(?:{{[^{}]*}}|[^{}])*}}/i;
			let summaryText;

			if (!prod_re.test(text)) {

				// Page previously PROD-ed
				if (params.oldProdPresent) {
					if (params.blp) {
						if (!confirm('Previous PROD nomination found on talk page. Do you still want to continue applying BLPPROD? ')) {
							statelem.warn('Previous PROD found on talk page, aborted by user');
							return def.reject();
						}
						statelem.info('Previous PROD found on talk page, continuing');
					} else {
						statelem.warn('Previous PROD found on talk page, aborting procedure');
						return def.reject();
					}
				}

				let tag;
				if (params.blp) {
					summaryText = 'Proposing article for deletion per [[WP:BLPPROD]].';
					tag = '{{subst:prod blp' + (params.usertalk ? '|help=off' : '') + '}}';
				} else {
					summaryText = 'Proposing ' + namespace + ' for deletion per [[WP:PROD]].';
					tag = '{{subst:prod|1=' + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? '|help=off' : '') + '}}';
				}

				// Insert tag after short description or any hatnotes
				const wikipage = new Morebits.wikitext.Page(text);
				text = wikipage.insertAfterTemplates(tag + '\n', Twinkle.hatnoteRegex).getText();

			} else { // already tagged for PROD, so try endorsing it
				const prod2_re = /{{(?:Proposed deletion endorsed|prod-?2).*?}}/i;
				if (prod2_re.test(text)) {
					statelem.warn('Page already tagged with {{proposed deletion}} and {{proposed deletion endorsed}} templates, aborting procedure');
					return def.reject();
				}
				let confirmtext = 'A {{proposed deletion}} tag was already found on this page. \nWould you like to add a {{proposed deletion endorsed}} tag with your explanation?';
				if (params.blp && !/{{\s*Prod blp\/dated/.test(text)) {
					confirmtext = 'A non-BLP {{proposed deletion}} tag was found on this article.\nWould you like to add a {{proposed deletion endorsed}} tag with explanation "article is a biography of a living person with no sources"?';
				}
				if (!confirm(confirmtext)) {
					statelem.warn('Aborted per user request');
					return def.reject();
				}

				summaryText = 'Endorsing proposed deletion per [[WP:' + (params.blp ? 'BLP' : '') + 'PROD]].';
				text = text.replace(prod_re, text.match(prod_re) + '\n{{Proposed deletion endorsed|1=' + (params.blp ?
					'article is a [[WP:BLPPROD|biography of a living person with no sources]]' :
					Morebits.string.formatReasonText(params.reason)) + '}}\n');

				params.logEndorsing = true;
			}

			// curate/patrol the page
			if (Twinkle.getPref('markProdPagesAsPatrolled')) {
				pageobj.triage();
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary(summaryText);
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('watchProdPages'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(def.resolve, def.reject);

		}, def.reject);
		return def;
	},

	addOldProd: function twinkleprodAddOldProd() {
		const def = $.Deferred();

		if (params.oldProdPresent || params.blp) {
			return def.resolve();
		}

		// Add {{Old prod}} to the talk page
		const oldprodfull = '{{Old prod|nom=' + mw.config.get('wgUserName') + '|nomdate={{subst:#time: Y-m-d}}}}\n';
		const talktitle = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
		const talkpage = new Morebits.wiki.Page(talktitle, 'Placing {{Old prod}} on talk page');
		talkpage.setPrependText(oldprodfull);
		talkpage.setEditSummary('Adding {{Old prod}}');
		talkpage.setChangeTags(Twinkle.changeTags);
		talkpage.setFollowRedirect(true); // match behavior for page tagging
		talkpage.setCreateOption('recreate');
		talkpage.prepend(def.resolve, def.reject);
		return def;
	},

	notifyAuthor: function twinkleprodNotifyAuthor() {
		const def = $.Deferred();

		if (!params.blp && !params.usertalk) {
			return def.resolve();
		}

		// Disallow warning yourself
		if (params.initialContrib === mw.config.get('wgUserName')) {
			Morebits.Status.info('Notifying creator', 'You (' + params.initialContrib + ') created this page; skipping user notification');
			return def.resolve();
		}
		// [[Template:Proposed deletion notify]] supports File namespace
		let notifyTemplate;
		if (params.blp) {
			notifyTemplate = 'prodwarningBLP';
		} else {
			notifyTemplate = 'proposed deletion notify';
		}
		const notifytext = '\n{{subst:' + notifyTemplate + '|1=' + Morebits.pageNameNorm + '|concern=' + params.reason + '}} ~~~~';

		const usertalkpage = new Morebits.wiki.Page('User talk:' + params.initialContrib, 'Notifying initial contributor (' + params.initialContrib + ')');
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary('Notification: proposed deletion of [[:' + Morebits.pageNameNorm + ']].');
		usertalkpage.setChangeTags(Twinkle.changeTags);
		usertalkpage.setCreateOption('recreate');
		usertalkpage.setFollowRedirect(true, false);
		usertalkpage.append(() => {
			// add nomination to the userspace log, if the user has enabled it
			params.logInitialContrib = params.initialContrib;
			def.resolve();
		}, def.resolve); // resolves even if notification was unsuccessful

		return def;
	},

	addToLog: function twinkleprodAddToLog() {
		if (!Twinkle.getPref('logProdPages')) {
			return $.Deferred().resolve();
		}
		const usl = new Morebits.UserspaceLogger(Twinkle.getPref('prodLogPageName'));
		usl.initialText =
			"This is a log of all [[WP:PROD|proposed deletion]] tags applied or endorsed by this user using [[WP:TW|Twinkle]]'s PROD module.\n\n" +
			'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
			'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].';

		let logText = '# [[:' + Morebits.pageNameNorm + ']]';
		let summaryText;
		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		logText += namespace === 'file' ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log]): ' : ': ';
		if (params.logEndorsing) {
			logText += 'endorsed ' + (params.blp ? 'BLP ' : '') + 'PROD. ~~~~~';
			if (params.reason) {
				logText += "\n#* '''Reason''': " + params.reason + '\n';
			}
			summaryText = 'Logging endorsement of PROD nomination of [[:' + Morebits.pageNameNorm + ']].';
		} else {
			logText += (params.blp ? 'BLP ' : '') + 'PROD';
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

		return usl.log(logText, summaryText);
	}

};

Twinkle.prod.callback.evaluate = function twinkleprodCallbackEvaluate(e) {
	const form = e.target;
	const input = Morebits.QuickForm.getInputData(form);

	params = {
		usertalk: input.notify || input.prodtype === 'prodblp',
		blp: input.prodtype === 'prodblp',
		reason: input.reason || '' // using an empty string here as fallback will help with prod-2.
	};

	if (!params.blp && !params.reason) {
		if (!confirm('You left the reason blank, do you really want to continue without providing one?')) {
			return;
		}
	}

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	const tm = new Morebits.TaskManager();
	const cbs = Twinkle.prod.callbacks; // shortcut reference, cbs for `callbacks`

	// Disable Morebits.wiki.numberOfActionsLeft system
	Morebits.wiki.numberOfActionsLeft = 1000;

	// checkPriors() and fetchCreationInfo() have no dependencies, they'll run first
	tm.add(cbs.checkPriors, []);
	tm.add(cbs.fetchCreationInfo, []);
	// tag the page once we're clear of the pre-requisites
	tm.add(cbs.taggingPage, [ cbs.checkPriors, cbs.fetchCreationInfo ]);
	// notify the author once we know who's the author, and also wait for the
	// taggingPage() as we don't need to notify if tagging was not done, such as
	// there was already a tag and the user chose not to endorse.
	tm.add(cbs.notifyAuthor, [ cbs.fetchCreationInfo, cbs.taggingPage ]);
	// oldProd needs to be added only if there wasn't one before, so need to wait
	// for checkPriors() to finish. Also don't add oldProd if tagging itself was
	// aborted or unsuccessful
	tm.add(cbs.addOldProd, [ cbs.taggingPage, cbs.checkPriors ]);
	// add to log only after notifying author so that the logging can be adjusted if
	// notification wasn't successful. Also, don't run if tagging was not done.
	tm.add(cbs.addToLog, [ cbs.notifyAuthor, cbs.taggingPage ]);
	// All set, go!
	tm.execute().then(() => {
		Morebits.Status.actionCompleted('Tagging complete');
		setTimeout(() => {
			window.location.href = mw.util.getUrl(mw.config.get('wgPageName'));
		}, Morebits.wiki.actionCompleted.timeOut);
	});
};

Twinkle.addInitCallback(Twinkle.prod, 'prod');
}());

// </nowiki>
