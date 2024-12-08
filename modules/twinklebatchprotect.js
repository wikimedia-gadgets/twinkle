// <nowiki>

(function() {

/*
 ****************************************
 *** twinklebatchprotect.js: Batch protect module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("P-batch")
 * Active on:              Existing project pages and user pages; existing and
 *                         non-existing categories; Special:PrefixIndex
 */

Twinkle.batchprotect = function twinklebatchprotect() {
	if (Morebits.userIsSysop && ((mw.config.get('wgArticleId') > 0 && (mw.config.get('wgNamespaceNumber') === 2 ||
		mw.config.get('wgNamespaceNumber') === 4)) || mw.config.get('wgNamespaceNumber') === 14 ||
		mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex')) {
		Twinkle.addPortletLink(Twinkle.batchprotect.callback, 'P-batch', 'tw-pbatch', 'Protect pages linked from this page');
	}
};

Twinkle.batchprotect.unlinkCache = {};
Twinkle.batchprotect.callback = function twinklebatchprotectCallback() {
	const Window = new Morebits.SimpleWindow(600, 400);
	Window.setTitle('Batch protection');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Protection policy', 'WP:PROT');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#protect');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.batchprotect.callback.evaluate);
	form.append({
		type: 'checkbox',
		event: Twinkle.protect.formevents.editmodify,
		list: [
			{
				label: 'Modify edit protection',
				value: 'editmodify',
				name: 'editmodify',
				tooltip: 'Only for existing pages.',
				checked: true
			}
		]
	});
	form.append({
		type: 'select',
		name: 'editlevel',
		label: 'Edit protection:',
		event: Twinkle.protect.formevents.editlevel,
		list: Twinkle.protect.protectionLevels
	});
	form.append({
		type: 'select',
		name: 'editexpiry',
		label: 'Expires:',
		event: function(e) {
			if (e.target.value === 'custom') {
				Twinkle.protect.doCustomExpiry(e.target);
			}
		},
		list: Twinkle.protect.protectionLengths // Default (2 days) set after render
	});

	form.append({
		type: 'checkbox',
		event: Twinkle.protect.formevents.movemodify,
		list: [
			{
				label: 'Modify move protection',
				value: 'movemodify',
				name: 'movemodify',
				tooltip: 'Only for existing pages.',
				checked: true
			}
		]
	});
	form.append({
		type: 'select',
		name: 'movelevel',
		label: 'Move protection:',
		event: Twinkle.protect.formevents.movelevel,
		// Autoconfirmed is required for a move, redundant
		list: Twinkle.protect.protectionLevels.filter((level) => level.value !== 'autoconfirmed')
	});
	form.append({
		type: 'select',
		name: 'moveexpiry',
		label: 'Expires:',
		event: function(e) {
			if (e.target.value === 'custom') {
				Twinkle.protect.doCustomExpiry(e.target);
			}
		},
		list: Twinkle.protect.protectionLengths // Default (2 days) set after render
	});

	form.append({
		type: 'checkbox',
		event: function twinklebatchprotectFormCreatemodifyEvent(e) {
			e.target.form.createlevel.disabled = !e.target.checked;
			e.target.form.createexpiry.disabled = !e.target.checked || (e.target.form.createlevel.value === 'all');
			e.target.form.createlevel.style.color = e.target.form.createexpiry.style.color = e.target.checked ? '' : 'transparent';
		},
		list: [
			{
				label: 'Modify create protection',
				value: 'createmodify',
				name: 'createmodify',
				tooltip: 'Only for pages that do not exist.',
				checked: true
			}
		]
	});
	form.append({
		type: 'select',
		name: 'createlevel',
		label: 'Create protection:',
		event: Twinkle.protect.formevents.createlevel,
		list: Twinkle.protect.protectionLevels
	});
	form.append({
		type: 'select',
		name: 'createexpiry',
		label: 'Expires:',
		event: function(e) {
			if (e.target.value === 'custom') {
				Twinkle.protect.doCustomExpiry(e.target);
			}
		},
		list: Twinkle.protect.protectionLengths // Default (indefinite) set after render
	});

	form.append({
		type: 'header',
		label: '' // horizontal rule
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reason:',
		size: 60,
		tooltip: 'For the protection log and page history.'
	});

	const query = {
		action: 'query',
		prop: 'revisions|info|imageinfo',
		rvprop: 'size|user',
		inprop: 'protection',
		format: 'json'
	};

	if (mw.config.get('wgNamespaceNumber') === 14) { // categories
		query.generator = 'categorymembers';
		query.gcmtitle = mw.config.get('wgPageName');
		query.gcmlimit = Twinkle.getPref('batchMax');
	} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex') {
		query.generator = 'allpages';
		query.gapnamespace = mw.util.getParamValue('namespace') || $('select[name=namespace]').val();
		query.gapprefix = mw.util.getParamValue('prefix') || $('input[name=prefix]').val();
		query.gaplimit = Twinkle.getPref('batchMax');
	} else {
		query.generator = 'links';
		query.titles = mw.config.get('wgPageName');
		query.gpllimit = Twinkle.getPref('batchMax');
	}

	const statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px'; // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.Status.init(statusdiv);
	Window.display();

	const statelem = new Morebits.Status('Grabbing list of pages');

	const wikipedia_api = new Morebits.wiki.Api('loading...', query, ((apiobj) => {
		const response = apiobj.getResponse();
		const pages = (response.query && response.query.pages) || [];
		const list = [];
		pages.sort(Twinkle.sortByNamespace);
		pages.forEach((page) => {
			const metadata = [];
			const missing = !!page.missing;
			let editProt;

			if (missing) {
				metadata.push('page does not exist');
				editProt = page.protection.filter((pr) => pr.type === 'create' && pr.level === 'sysop').pop();
			} else {
				if (page.redirect) {
					metadata.push('redirect');
				}

				if (page.ns === 6) {
					metadata.push('uploader: ' + page.imageinfo[0].user);
					metadata.push('last edit from: ' + page.revisions[0].user);
				} else {
					metadata.push(mw.language.convertNumber(page.revisions[0].size) + ' bytes');
				}

				editProt = page.protection
					.filter((pr) => pr.type === 'edit' && pr.level === 'sysop')
					.pop();
			}
			if (editProt) {
				metadata.push('fully' + (missing ? ' create' : '') + ' protected' +
				(editProt.expiry === 'infinity' ? ' indefinitely' : ', expires ' + new Morebits.Date(editProt.expiry).calendar('utc') + ' (UTC)'));
			}

			const title = page.title;
			list.push({ label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''), value: title, checked: true, style: editProt ? 'color:red' : '' });
		});
		form.append({ type: 'header', label: 'Pages to protect' });
		form.append({
			type: 'button',
			label: 'Select All',
			event: function(e) {
				$(Morebits.QuickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		form.append({
			type: 'button',
			label: 'Deselect All',
			event: function(e) {
				$(Morebits.QuickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		form.append({
			type: 'checkbox',
			name: 'pages',
			shiftClickSupport: true,
			list: list
		});
		form.append({ type: 'submit' });

		const result = form.render();
		Window.setContent(result);

		// Set defaults
		result.editexpiry.value = '2 days';
		result.moveexpiry.value = '2 days';
		result.createexpiry.value = 'infinity';

		Morebits.QuickForm.getElements(result, 'pages').forEach(Twinkle.generateArrowLinks);

	}), statelem);

	wikipedia_api.post();
};

Twinkle.batchprotect.currentProtectCounter = 0;
Twinkle.batchprotect.currentprotector = 0;
Twinkle.batchprotect.callback.evaluate = function twinklebatchprotectCallbackEvaluate(event) {
	Morebits.wiki.actionCompleted.notice = 'Batch protection is now complete';

	const form = event.target;

	const numProtected = $(Morebits.QuickForm.getElements(form, 'pages'))
		.filter((index, element) => element.checked && element.nextElementSibling.style.color === 'red')
		.length;
	if (numProtected > 0 && !confirm('You are about to act on ' + mw.language.convertNumber(numProtected) + ' fully protected page(s). Are you sure?')) {
		return;
	}

	const input = Morebits.QuickForm.getInputData(form);

	if (!input.reason) {
		alert("You've got to give a reason, you rouge admin!");
		return;
	}

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	if (input.pages.length === 0) {
		Morebits.Status.error('Error', 'Nothing to protect, aborting');
		return;
	}

	const batchOperation = new Morebits.BatchOperation('Applying protection settings');
	batchOperation.setOption('chunkSize', Twinkle.getPref('batchChunks'));
	batchOperation.setOption('preserveIndividualStatusLines', true);
	batchOperation.setPageList(input.pages);
	batchOperation.run((pageName) => {
		const query = {
			action: 'query',
			titles: pageName,
			format: 'json'
		};
		const wikipedia_api = new Morebits.wiki.Api('Checking if page ' + pageName + ' exists', query,
			Twinkle.batchprotect.callbacks.main, null, batchOperation.workerFailure);
		wikipedia_api.params = $.extend({
			page: pageName,
			batchOperation: batchOperation
		}, input);
		wikipedia_api.post();
	});
};

Twinkle.batchprotect.callbacks = {
	main: function(apiobj) {
		const response = apiobj.getResponse();

		if (response.query.normalized) {
			apiobj.params.page = response.query.normalized[0].to;
		}

		const exists = !response.query.pages[0].missing;

		const page = new Morebits.wiki.Page(apiobj.params.page, 'Protecting ' + apiobj.params.page);
		let takenAction = false;
		if (exists && apiobj.params.editmodify) {
			page.setEditProtection(apiobj.params.editlevel, apiobj.params.editexpiry);
			takenAction = true;
		}
		if (exists && apiobj.params.movemodify) {
			page.setMoveProtection(apiobj.params.movelevel, apiobj.params.moveexpiry);
			takenAction = true;
		}
		if (!exists && apiobj.params.createmodify) {
			page.setCreateProtection(apiobj.params.createlevel, apiobj.params.createexpiry);
			takenAction = true;
		}
		if (!takenAction) {
			Morebits.Status.warn('Protecting ' + apiobj.params.page, 'page ' + (exists ? 'exists' : 'does not exist') + '; nothing to do, skipping');
			apiobj.params.batchOperation.workerFailure(apiobj);
			return;
		}

		page.setEditSummary(apiobj.params.reason);
		page.setChangeTags(Twinkle.changeTags);
		page.protect(apiobj.params.batchOperation.workerSuccess, apiobj.params.batchOperation.workerFailure);
	}
};

Twinkle.addInitCallback(Twinkle.batchprotect, 'batchprotect');
}());

// </nowiki>
