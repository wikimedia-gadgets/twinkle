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

var concerns = {};

Twinkle.deprod.callback = function() {
	var Window = new Morebits.simpleWindow(800, 400);
	Window.setTitle('PROD cleaning');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Proposed deletion', 'WP:PROD');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#deprod');
  Window.addFooterLink('Give feedback', 'WT:TW');

	var form = new Morebits.quickForm(callback_commit);

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var query = {
		'action': 'query',
		'generator': 'categorymembers',
		'gcmtitle': mw.config.get('wgPageName'),
		'gcmlimit': Twinkle.getPref('batchMax'),
		'gcmnamespace': '0|6|108|2', // mostly to ignore categories
		'prop': [ 'info', 'revisions' ],
		'rvprop': [ 'content' ],
		'inprop': [ 'protection' ]
	};

	var statelem = new Morebits.status('Grabbing list of pages');
	var wikipedia_api = new Morebits.wiki.api('loading...', query, function(apiobj) {
		var $doc = $(apiobj.responseXML);
		var $pages = $doc.find('page[ns!="6"]');  // all non-files
		var list = [];
		var re = /\{\{Proposed deletion/;
		$pages.each(function() {
			var $page = $(this);
			var title = $page.attr('title');
			var content = $page.find('revisions rev').text();
			var $editprot = $page.find('pr[type="edit"][level="sysop"]');
			var isProtected = $editprot.length > 0;

			var metadata = [];
			var res = re.exec(content);
			if (res) {
				var parsed = Morebits.wikitext.parseTemplate(content, res.index);
				concerns[title] = parsed.parameters.concern || '';
				metadata.push(concerns[title]);
			}
			if (isProtected) {
				metadata.push('fully protected' +
					($editprot.attr('expiry') === 'infinity' ? ' indefinitely' : ', expires ' + $editprot.attr('expiry')));
			}
			list.push({
				label: metadata.length ? '(' + metadata.join('; ') + ')' : '',
				value: title,
				checked: concerns[title] !== '',
				style: isProtected ? 'color:red' : ''
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
			'type': 'checkbox',
			'name': 'pages',
			'list': list
		});
		apiobj.params.form.append({
			'type': 'submit'
		});

		var rendered = apiobj.params.form.render();
		apiobj.params.Window.setContent(rendered);
		Morebits.quickForm.getElements(rendered, 'pages').forEach(function(checkbox) {
			var $checkbox = $(checkbox);
			var link = Morebits.htmlNode('a', $checkbox.val());
			link.setAttribute('class', 'deprod-page-link');
			link.setAttribute('href', mw.util.getUrl($checkbox.val()));
			link.setAttribute('target', '_blank');
			$checkbox.next().prepend([link, ' ']);
		});
	}, statelem);

	wikipedia_api.params = { form: form, Window: Window };
	wikipedia_api.post();
};

var callback_commit = function(event) {
		var pages = Morebits.quickForm.getInputData(event.target).pages;
		Morebits.status.init(event.target);

		var batchOperation = new Morebits.batchOperation('Deleting pages');
		batchOperation.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		batchOperation.setOption('preserveIndividualStatusLines', true);
		batchOperation.setPageList(pages);
		batchOperation.run(function(pageName) {
			var params = { page: pageName, reason: concerns[page] };

			var query = {
				'action': 'query',
				'titles': pageName,
				'prop': 'redirects',
				'rdlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
			};
			var wikipedia_api = new Morebits.wiki.api('Grabbing redirects', query, callback_deleteRedirects);
			wikipedia_api.params = params;
			wikipedia_api.post();

			var pageTitle = mw.Title.newFromText(pageName);
			// Don't delete user talk pages, essentially limiting this to Talk: and Book talk:
			if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
				pageTitle.namespace++;  // now pageTitle is the talk page title!
				query = {
					'action': 'query',
					'titles': pageTitle.toText()
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
		var $doc = $(apiobj.responseXML);
		var exists = $doc.find('page:not([missing])').length > 0;

		if (!exists) {
		// no talk page; forget about it
			return;
		}

		var page = new Morebits.wiki.page('Talk:' + apiobj.params.page, 'Deleting talk page of page ' + apiobj.params.page);
		page.setEditSummary('[[WP:CSD#G8|G8]]: [[Help:Talk page|Talk page]] of deleted page "' + apiobj.params.page + '"');
		page.setChangeTags(Twinkle.changeTags);
		page.deletePage();
	},
	callback_deleteRedirects = function(apiobj) {
		var $doc = $(apiobj.responseXML);
		$doc.find('redirects rd').each(function() {
			var title = $(this).attr('title');
			var page = new Morebits.wiki.page(title, 'Deleting redirecting page ' + title);
			page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page "' + apiobj.params.page + '"');
			page.setChangeTags(Twinkle.changeTags);
			page.deletePage();
		});
	};

Twinkle.addInitCallback(Twinkle.deprod, 'deprod');
})(jQuery);


// </nowiki>
