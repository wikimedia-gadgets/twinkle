// <nowiki>


(function($) {


/*
****************************************
*** twinkledeprod.js: Batch deletion of expired PRODs (sysops only)
****************************************
* Mode of invocation:     Tab ("Deprod")
* Active on:              Categories whose name contains "proposed_deletion"
*/

Twinkle.deprod = function() {
	if (
		!Morebits.userIsSysop ||
		mw.config.get('wgNamespaceNumber') !== 14 ||
		!(/proposed_deletion/i).test(mw.config.get('wgPageName'))
	) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.deprod.callback, 'Deprod', 'tw-deprod', 'Delete prod pages found in this category');
};

let concerns = {};

Twinkle.deprod.callback = function() {
	let Window = new Morebits.simpleWindow(800, 400);
	Window.setTitle('PROD cleaning');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Proposed deletion', 'WP:PROD');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#deprod');
	Window.addFooterLink('Give feedback', 'WT:TW');

	let form = new Morebits.quickForm(callback_commit);

	let statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	let query = {
		action: 'query',
		generator: 'categorymembers',
		gcmtitle: mw.config.get('wgPageName'),
		gcmlimit: Twinkle.getPref('batchMax'),
		gcmnamespace: '0|2', // only display articles or user pages
		prop: 'info|revisions',
		rvprop: 'content',
		inprop: 'protection',
		format: 'json'
	};

	let statelem = new Morebits.status('Grabbing list of pages');
	let wikipedia_api = new Morebits.wiki.api('loading...', query, function(apiobj) {
		let response = apiobj.getResponse();
		let pages = (response.query && response.query.pages) || [];
		let list = [];
		let re = /\{\{Proposed deletion/;
		pages.sort(Twinkle.sortByNamespace);
		pages.forEach(function(page) {
			let metadata = [];

			let content = page.revisions[0].content;
			let res = re.exec(content);
			let title = page.title;
			if (res) {
				let parsed = Morebits.wikitext.parseTemplate(content, res.index);
				concerns[title] = parsed.parameters.concern || '';
				metadata.push(concerns[title]);
			}

			let editProt = page.protection.filter(function(pr) {
				return pr.type === 'edit' && pr.level === 'sysop';
			}).pop();
			if (editProt) {
				metadata.push('fully protected' +
					(editProt.expiry === 'infinity' ? ' indefinitely' : ', expires ' + editProt.expiry));
			}

			list.push({
				label: metadata.length ? '(' + metadata.join('; ') + ')' : '',
				value: title,
				checked: concerns[title] !== '',
				style: editProt ? 'color:red' : ''
			});
		});
		apiobj.params.form.append({ type: 'header', label: 'Pages to delete' });
		apiobj.params.form.append({
			type: 'button',
			label: 'Select All',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		apiobj.params.form.append({
			type: 'button',
			label: 'Deselect All',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		apiobj.params.form.append({
			type: 'checkbox',
			name: 'pages',
			list: list
		});
		apiobj.params.form.append({
			type: 'submit'
		});

		let rendered = apiobj.params.form.render();
		apiobj.params.Window.setContent(rendered);
		Morebits.quickForm.getElements(rendered, 'pages').forEach(Twinkle.generateBatchPageLinks);
	}, statelem);

	wikipedia_api.params = { form: form, Window: Window };
	wikipedia_api.post();
};

var callback_commit = function(event) {
		let pages = Morebits.quickForm.getInputData(event.target).pages;
		Morebits.status.init(event.target);

		let batchOperation = new Morebits.batchOperation('Deleting pages');
		batchOperation.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		batchOperation.setOption('preserveIndividualStatusLines', true);
		batchOperation.setPageList(pages);
		batchOperation.run(function(pageName) {
			let params = { page: pageName, reason: concerns[page] };

			let query = {
				action: 'query',
				titles: pageName,
				prop: 'redirects',
				rdlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			};
			let wikipedia_api = new Morebits.wiki.api('Grabbing redirects', query, callback_deleteRedirects);
			wikipedia_api.params = params;
			wikipedia_api.post();

			let pageTitle = mw.Title.newFromText(pageName);
			// Don't delete user talk pages, limiting this to Talk: pages since only article and user pages appear in deprod
			if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
				pageTitle.namespace++;  // now pageTitle is the talk page title!
				query = {
					action: 'query',
					titles: pageTitle.toText(),
					format: 'json'
				};
				wikipedia_api = new Morebits.wiki.api('Checking whether ' + pageName + ' has a talk page', query,
					callback_deleteTalk);
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			var page = new Morebits.wiki.page(pageName, 'Deleting page ' + pageName);
			page.setEditSummary('Expired [[WP:PROD|PROD]], concern was: ' + concerns[pageName]);
			page.setChangeTags(Twinkle.changeTags);
			page.suppressProtectWarning();
			page.deletePage(batchOperation.workerSuccess, batchOperation.workerFailure);
		});
	},
	callback_deleteTalk = function(apiobj) {
		// no talk page; forget about it
		if (apiobj.getResponse().query.pages[0].missing) {
			return;
		}

		let page = new Morebits.wiki.page('Talk:' + apiobj.params.page, 'Deleting talk page of page ' + apiobj.params.page);
		page.setEditSummary('[[WP:CSD#G8|G8]]: [[Help:Talk page|Talk page]] of deleted page "' + apiobj.params.page + '"');
		page.setChangeTags(Twinkle.changeTags);
		page.deletePage();
	},
	callback_deleteRedirects = function(apiobj) {
		let response = apiobj.getResponse();
		let redirects = response.query.pages[0].redirects || [];
		redirects.forEach(function(rd) {
			let title = rd.title;
			let page = new Morebits.wiki.page(title, 'Deleting redirecting page ' + title);
			page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page "' + apiobj.params.page + '"');
			page.setChangeTags(Twinkle.changeTags);
			page.deletePage();
		});
	};

Twinkle.addInitCallback(Twinkle.deprod, 'deprod');
}(jQuery));


// </nowiki>
