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
	Twinkle.addPortletLink(Twinkle.batchundelete.callback, 'Und-batch', 'tw-batch-undel', "Undelete 'em all");
};

Twinkle.batchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new Morebits.simpleWindow(600, 400);
	Window.setScriptName('Twinkle');
	Window.setTitle('Batch undelete');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#batchundelete');

	var form = new Morebits.quickForm(Twinkle.batchundelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Restore talk pages of undeleted pages if they existed',
				name: 'undel_talk',
				value: 'undel_talk',
				checked: true
			}
		]
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reason: ',
		size: 60
	});

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var query = {
		'action': 'query',
		'generator': 'links',
		'prop': 'info',
		'inprop': 'protection',
		'titles': mw.config.get('wgPageName'),
		'gpllimit': Twinkle.getPref('batchMax')
	};
	var statelem = new Morebits.status('Grabbing list of pages');
	var wikipedia_api = new Morebits.wiki.api('loading...', query, function(apiobj) {
		var xml = apiobj.responseXML;
		var $pages = $(xml).find('page[missing]');
		var list = [];
		$pages.each(function(index, page) {
			var $page = $(page);
			var title = $page.attr('title');
			var $editprot = $page.find('pr[type="create"][level="sysop"]');
			var isProtected = $editprot.length > 0;

			list.push({
				label: title + (isProtected ? ' (fully create protected' +
					($editprot.attr('expiry') === 'infinity' ? ' indefinitely' : ', expires ' + new Morebits.date($editprot.attr('expiry')).calendar('utc') + ' (UTC)') + ')' : ''),
				value: title,
				checked: true,
				style: isProtected ? 'color:red' : ''
			});
		});
		apiobj.params.form.append({ type: 'header', label: 'Pages to undelete' });
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
			shiftClickSupport: true,
			list: list
		});
		apiobj.params.form.append({ type: 'submit' });

		var result = apiobj.params.form.render();
		apiobj.params.Window.setContent(result);

	}, statelem);
	wikipedia_api.params = { form: form, Window: Window };
	wikipedia_api.post();
};

Twinkle.batchundelete.callback.evaluate = function(event) {
	Morebits.wiki.actionCompleted.notice = 'Batch undeletion is now complete';

	var numProtected = Morebits.quickForm.getElements(event.target, 'pages').filter(function(element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('You are about to undelete ' + numProtected + ' fully create protected page(s). Are you sure?')) {
		return;
	}

	var input = Morebits.quickForm.getInputData(event.target);

	if (!input.reason) {
		alert('You need to give a reason, you cabal crony!');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);

	if (!input.pages || !input.pages.length) {
		Morebits.status.error('Error', 'nothing to undelete, aborting');
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

		var wikipedia_page = new Morebits.wiki.page(pageName, 'Undeleting page ' + pageName);
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
					'action': 'query',
					'prop': 'deletedrevisions',
					'drvprop': 'ids',
					'drvlimit': 1,
					'titles': talkpagename
				};
				wikipedia_api = new Morebits.wiki.api('Checking talk page for deleted revisions', query, Twinkle.batchundelete.callbacks.undeleteTalk);
				wikipedia_api.params = params;
				wikipedia_api.params.talkPage = talkpagename;
				wikipedia_api.post();
			}
		}
	},
	undeleteTalk: function(apiobj) {
		var xml = apiobj.responseXML;
		var exists = $(xml).find('page:not([missing])').length > 0;
		var delrevs = $(xml).find('rev').attr('revid');

		if (exists || !delrevs) {
			// page exists or has no deleted revisions; forget about it
			return;
		}

		var page = new Morebits.wiki.page(apiobj.params.talkPage, 'Undeleting talk page of ' + apiobj.params.page);
		page.setEditSummary('Undeleting [[Help:Talk page|talk page]] of "' + apiobj.params.page + '"');
		page.setChangeTags(Twinkle.changeTags);
		page.undeletePage();
	}
};

Twinkle.addInitCallback(Twinkle.batchundelete, 'batchundelete');
})(jQuery);


// </nowiki>
