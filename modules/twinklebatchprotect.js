// <nowiki>


(function($) {


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
		Twinkle.addPortletLink(Twinkle.batchprotect.callback, 'Batch Bev', 'tw-pbatch', 'Beveilig pagina\'s gelinkt op deze pagina');
	}
};

Twinkle.batchprotect.unlinkCache = {};
Twinkle.batchprotect.callback = function twinklebatchprotectCallback() {
	var Window = new Morebits.simpleWindow(600, 400);
	Window.setTitle('Batch protection');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('RVM', 'WP:RVM');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#protect');

	var form = new Morebits.quickForm(Twinkle.batchprotect.callback.evaluate);
	form.append({
		type: 'checkbox',
		event: Twinkle.protect.formevents.editmodify,
		list: [
			{
				label: 'Beveilig bewerken',
				value: 'editmodify',
				name: 'editmodify',
				tooltip: 'Alleen voor bestaande pagina\'s.',
				checked: true
			}
		]
	});
	form.append({
		type: 'select',
		name: 'editlevel',
		label: 'Beveiligingsniveau:',
		event: Twinkle.protect.formevents.editlevel,
		list: Twinkle.protect.protectionLevels
	});
	form.append({
		type: 'select',
		name: 'editexpiry',
		label: 'Verloopt:',
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
				label: 'Beveilig hernoemen',
				value: 'movemodify',
				name: 'movemodify',
				tooltip: 'Alleen voor bestaande pagina\'s.',
				checked: true
			}
		]
	});
	form.append({
		type: 'select',
		name: 'movelevel',
		label: 'Beveiligingsniveau:',
		event: Twinkle.protect.formevents.movelevel,
		list: Twinkle.protect.protectionLevels.filter(function(level) {
			// Autoconfirmed is required for a move, redundant
			return level.value !== 'autoconfirmed';
		})
	});
	form.append({
		type: 'select',
		name: 'moveexpiry',
		label: 'Verloopt:',
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
				label: 'Aanmaak beveilliging',
				value: 'createmodify',
				name: 'createmodify',
				tooltip: 'Alleen voor pagina\'s die nog niet bestaan.',
				checked: true
			}
		]
	});
	form.append({
		type: 'select',
		name: 'createlevel',
		label: 'Beveiligingsniveau:',
		event: Twinkle.protect.formevents.createlevel,
		list: Twinkle.protect.protectionLevels
	});
	form.append({
		type: 'select',
		name: 'createexpiry',
		label: 'Verloopt:',
		event: function(e) {
			if (e.target.value === 'custom') {
				Twinkle.protect.doCustomExpiry(e.target);
			}
		},
		list: Twinkle.protect.protectionLengths // Default (indefinite) set after render
	});

	form.append({
		type: 'header',
		label: ''  // horizontal rule
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reden: ',
		size: 60,
		tooltip: 'Om weer te geven in logboek en pagina geschiedenis.'
	});

	var query = {
		action: 'query',
		prop: 'revisions|info|imageinfo',
		rvprop: 'size|user',
		inprop: 'protection',
		format: 'json'
	};

	if (mw.config.get('wgNamespaceNumber') === 14) {  // categories
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

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var statelem = new Morebits.status('Lijst met pagina\'s ophalen');

	var wikipedia_api = new Morebits.wiki.api('laden...', query, function(apiobj) {
		var response = apiobj.getResponse();
		var pages = (response.query && response.query.pages) || [];
		var list = [];
		pages.sort(Twinkle.sortByNamespace);
		pages.forEach(function(page) {
			var metadata = [];
			var missing = !!page.missing, editProt;

			if (missing) {
				metadata.push('pagina bestaat niet');
				editProt = page.protection.filter(function(pr) {
					return pr.type === 'create' && pr.level === 'sysop';
				}).pop();
			} else {
				if (page.redirect) {
					metadata.push('redirect');
				}

				if (page.ns === 6) {
					metadata.push('uploader: ' + page.imageinfo[0].user);
					metadata.push('laatste bewerking van: ' + page.revisions[0].user);
				} else {
					metadata.push(mw.language.convertNumber(page.revisions[0].size) + ' bytes');
				}

				editProt = page.protection.filter(function(pr) {
					return pr.type === 'edit' && pr.level === 'sysop';
				}).pop();
			}
			if (editProt) {
				metadata.push('volledig' + (missing ? ' tegen aanmaak' : '') + ' beveiligd' +
				(editProt.expiry === 'infinity' ? ' voor onbepaalde tijd' : ', verloopt ' + new Morebits.date(editProt.expiry).calendar('utc') + ' (UTC)'));
			}

			var title = page.title;
			list.push({ label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''), value: title, checked: true, style: editProt ? 'color:red' : '' });
		});
		form.append({ type: 'header', label: 'Pagina\'s om te beveiligen' });
		form.append({
			type: 'button',
			label: 'Selecteer alles',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		form.append({
			type: 'button',
			label: 'Deselecteer alles',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		form.append({
			type: 'checkbox',
			name: 'pages',
			shiftClickSupport: true,
			list: list
		});
		form.append({ type: 'submit' });

		var result = form.render();
		Window.setContent(result);

		// Set defaults
		result.editexpiry.value = '2 weeks';
		result.moveexpiry.value = '2 weeks';
		result.createexpiry.value = 'infinity';

		Morebits.quickForm.getElements(result, 'pages').forEach(Twinkle.generateArrowLinks);

	}, statelem);

	wikipedia_api.post();
};

Twinkle.batchprotect.currentProtectCounter = 0;
Twinkle.batchprotect.currentprotector = 0;
Twinkle.batchprotect.callback.evaluate = function twinklebatchprotectCallbackEvaluate(event) {
	Morebits.wiki.actionCompleted.notice = 'Batch beveiligen is voltooid';

	var form = event.target;

	var numProtected = $(Morebits.quickForm.getElements(form, 'pages')).filter(function(index, element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('Je staat op het punt om ' + mw.language.convertNumber(numProtected) + ' volledig beveiligde pagina(\'s) te bewerken. Weet je dat zeker?')) {
		return;
	}

	var input = Morebits.quickForm.getInputData(form);

	if (!input.reason) {
		alert("Je moet wel een reden opgeven, jij protectionist!");
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	if (input.pages.length === 0) {
		Morebits.status.error('Error', 'Niets te doen, afbreken...');
		return;
	}

	var batchOperation = new Morebits.batchOperation('Beveiliging uitvoeren');
	batchOperation.setOption('chunkSize', Twinkle.getPref('batchChunks'));
	batchOperation.setOption('preserveIndividualStatusLines', true);
	batchOperation.setPageList(input.pages);
	batchOperation.run(function(pageName) {
		var query = {
			action: 'query',
			titles: pageName,
			format: 'json'
		};
		var wikipedia_api = new Morebits.wiki.api('Checken of ' + pageName + ' bestaat', query,
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
		var response = apiobj.getResponse();

		if (response.query.normalized) {
			apiobj.params.page = response.query.normalized[0].to;
		}

		var exists = !response.query.pages[0].missing;

		var page = new Morebits.wiki.page(apiobj.params.page, 'Beveiligen ' + apiobj.params.page);
		var takenAction = false;
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
			Morebits.status.warn('Beveiligen ' + apiobj.params.page, 'pagina ' + (exists ? 'bestaat' : 'bestaat niet') + '; niets te doen, overslaan');
			apiobj.params.batchOperation.workerFailure(apiobj);
			return;
		}

		page.setEditSummary(apiobj.params.reason);
		page.setChangeTags(Twinkle.changeTags);
		page.protect(apiobj.params.batchOperation.workerSuccess, apiobj.params.batchOperation.workerFailure);
	}
};

Twinkle.addInitCallback(Twinkle.batchprotect, 'batchprotect');
})(jQuery);


// </nowiki>
