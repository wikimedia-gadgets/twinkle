// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklebatchundelete.js: Batch undelete module
 ****************************************
 * Mode of invocation:     Tab ("Und-batch")
 * Active on:              Existing user and project pages
 */


Twinkle.batchundelete = function twinklebatchundelete() {
	if (!Morebits.userIsSysop || !mw.config.get('wgArticleId') || (
		mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').user &&
		mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').project)) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.batchundelete.callback, 'Batch undel', 'tw-batch-undel', "Undelete 'em all");
};

Twinkle.batchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new Morebits.simpleWindow(600, 400);
	Window.setScriptName('Twinkle');
	Window.setTitle('Batch Terugzetten');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#batchundelete');
	Window.addFooterLink('Give feedback', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.batchundelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Overlegpagina\'s van verwijderde pagina\'s terugzetten',
				name: 'undel_talk',
				value: 'undel_talk',
				checked: true
			}
		]
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reden: ',
		size: 60
	});

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var query = {
		action: 'query',
		generator: 'links',
		prop: 'info',
		inprop: 'protection',
		titles: mw.config.get('wgPageName'),
		gpllimit: Twinkle.getPref('batchMax'),
		format: 'json'
	};
	var statelem = new Morebits.status('Pagina lijst ophalen');
	var wikipedia_api = new Morebits.wiki.api('laden...', query, function(apiobj) {
		var response = apiobj.getResponse();
		var pages = (response.query && response.query.pages) || [];
		pages = pages.filter(function(page) {
			return page.missing;
		});
		var list = [];
		pages.sort(Twinkle.sortByNamespace);
		pages.forEach(function(page) {
			var editProt = page.protection.filter(function(pr) {
				return pr.type === 'create' && pr.level === 'sysop';
			}).pop();

			var title = page.title;
			list.push({
				label: title + (editProt ? ' (heraanmaak ' +
					(editProt.expiry === 'infinity' ? ' voor onbepaalde tijd' : ', verloopt ' + new Morebits.date(editProt.expiry).calendar('utc') + ' (UTC),') + ' beveiligd)' : ''),
				value: title,
				checked: true,
				style: editProt ? 'color:red' : ''
			});
		});
		apiobj.params.form.append({ type: 'header', label: 'Pagina\'s om terug te zetten' });
		apiobj.params.form.append({
			type: 'button',
			label: 'Selecteer alles',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		apiobj.params.form.append({
			type: 'button',
			label: 'Deselecteer alles',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		apiobj.params.form.append({
			type: 'checkbox',
			name: 'pages',
			shiftClickSupport: true,
			list: list
		});
		apiobj.params.form.append({ type: 'submit' });

		var result = apiobj.params.form.render();
		apiobj.params.Window.setContent(result);

		Morebits.quickForm.getElements(result, 'pages').forEach(Twinkle.generateArrowLinks);

	}, statelem);
	wikipedia_api.params = { form: form, Window: Window };
	wikipedia_api.post();
};

Twinkle.batchundelete.callback.evaluate = function(event) {
	Morebits.wiki.actionCompleted.notice = 'Batch terugzetten voltooid';

	var numProtected = Morebits.quickForm.getElements(event.target, 'pages').filter(function(element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('Je staat op het punt om ' + numProtected + ' volledigbeveiligde pagina(\'s) terug te zetten. Weet je het zeker?')) {
		return;
	}

	var input = Morebits.quickForm.getInputData(event.target);

	if (!input.reason) {
		alert('Je moet een reden geven, jij inclusionist!');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);

	if (!input.pages || !input.pages.length) {
		Morebits.status.error('Error', 'niets om terug te zetten, Afbreken');
		return;
	}

	var pageUndeleter = new Morebits.batchOperation('Undeleting pages');
	pageUndeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
	pageUndeleter.setOption('preserveIndividualStatusLines', true);
	pageUndeleter.setPageList(input.pages);
	pageUndeleter.run(function(pageName) {
		var params = {
			page: pageName,
			undel_talk: input.undel_talk,
			reason: input.reason,
			pageUndeleter: pageUndeleter
		};

		var wikipedia_page = new Morebits.wiki.page(pageName, 'Terugzetten pagina ' + pageName);
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.setEditSummary(input.reason);
		wikipedia_page.setChangeTags(Twinkle.changeTags);
		wikipedia_page.suppressProtectWarning();
		wikipedia_page.setMaxRetries(3); // temporary increase from 2 to make batchundelete more likely to succeed [[phab:T222402]] #613
		wikipedia_page.undeletePage(Twinkle.batchundelete.callbacks.doExtras, pageUndeleter.workerFailure);
	});
};

Twinkle.batchundelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of Morebits.wiki.* callback parameters
	doExtras: function(thingWithParameters) {
		var params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() :
			thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageUndeleter.workerSuccess(thingWithParameters);

		var query, wikipedia_api;

		if (params.undel_talk) {
			var talkpagename = new mw.Title(params.page).getTalkPage().getPrefixedText();
			if (talkpagename !== params.page) {
				query = {
					action: 'query',
					prop: 'deletedrevisions',
					drvprop: 'ids',
					drvlimit: 1,
					titles: talkpagename,
					format: 'json'
				};
				wikipedia_api = new Morebits.wiki.api('Overlegpagina controleren op verwijderde versies', query, Twinkle.batchundelete.callbacks.undeleteTalk);
				wikipedia_api.params = params;
				wikipedia_api.params.talkPage = talkpagename;
				wikipedia_api.post();
			}
		}
	},
	undeleteTalk: function(apiobj) {
		var page = apiobj.getResponse().query.pages[0];
		var exists = !page.missing;
		var delrevs = page.deletedrevisions && page.deletedrevisions[0].revid;

		if (exists || !delrevs) {
			// page exists or has no deleted revisions; forget about it
			return;
		}

		var talkpage = new Morebits.wiki.page(apiobj.params.talkPage, 'Terugzetten van overlegpagina van ' + apiobj.params.page);
		talkpage.setEditSummary('Terugzetten van overlegpagina van "' + apiobj.params.page + '"');
		talkpage.setChangeTags(Twinkle.changeTags);
		talkpage.undeletePage();
	}
};

Twinkle.addInitCallback(Twinkle.batchundelete, 'batchundelete');
})(jQuery);


// </nowiki>
