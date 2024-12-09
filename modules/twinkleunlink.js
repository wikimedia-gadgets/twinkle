// <nowiki>

(function() {

/*
 ****************************************
 *** twinkleunlink.js: Unlink module
 ****************************************
 * Mode of invocation:     Tab ("Unlink")
 * Active on:              Non-special pages, except Wikipedia:Sandbox
 */

Twinkle.unlink = function twinkleunlink() {
	if (mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgPageName') === 'Wikipedia:Sandbox' ||
		// Restrict to extended confirmed users (see #428)
		(!Morebits.userIsInGroup('extendedconfirmed') && !Morebits.userIsSysop)) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.unlink.callback, 'Unlink', 'tw-unlink', 'Unlink backlinks');
};

// the parameter is used when invoking unlink from admin speedy
Twinkle.unlink.callback = function(presetReason) {
	const fileSpace = mw.config.get('wgNamespaceNumber') === 6;

	const Window = new Morebits.SimpleWindow(600, 440);
	Window.setTitle('Unlink backlinks' + (fileSpace ? ' and file usages' : ''));
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Unlink prefs', 'WP:TW/PREF#unlink');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#unlink');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.unlink.callback.evaluate);

	// prepend some documentation: files are commented out, while any
	// display text is preserved for links (otherwise the link itself is used)
	const linkTextBefore = Morebits.htmlNode('code', '[[' + (fileSpace ? ':' : '') + Morebits.pageNameNorm + '|link text]]');
	const linkTextAfter = Morebits.htmlNode('code', 'link text');
	const linkPlainBefore = Morebits.htmlNode('code', '[[' + Morebits.pageNameNorm + ']]');
	let linkPlainAfter;
	if (fileSpace) {
		linkPlainAfter = Morebits.htmlNode('code', '<!-- [[' + Morebits.pageNameNorm + ']] -->');
	} else {
		linkPlainAfter = Morebits.htmlNode('code', Morebits.pageNameNorm);
	}

	form.append({
		type: 'div',
		style: 'margin-bottom: 0.5em',
		label: [
			'This tool allows you to unlink all incoming links ("backlinks") from the checked pages below that point to this page' +
				(fileSpace ? ', and/or hide all inclusions of this file by wrapping them in <!-- --> comment markup' : '') +
				'. For instance, ',
			linkTextBefore, ' would become ', linkTextAfter, ' and ',
			linkPlainBefore, ' would become ', linkPlainAfter, '. This tool will not unlink redirects or links within this page ("selflinks") that point to this page. Use it with caution.'
		]
	});

	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reason:',
		value: presetReason || '',
		size: 60
	});

	const query = {
		action: 'query',
		list: 'backlinks',
		bltitle: mw.config.get('wgPageName'),
		bllimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
		blnamespace: Twinkle.getPref('unlinkNamespaces'),
		rawcontinue: true,
		format: 'json'
	};
	if (fileSpace) {
		query.list += '|imageusage';
		query.iutitle = query.bltitle;
		query.iulimit = query.bllimit;
		query.iunamespace = query.blnamespace;
	} else {
		query.blfilterredir = 'nonredirects';
	}
	const wikipedia_api = new Morebits.wiki.Api('Grabbing backlinks', query, Twinkle.unlink.callbacks.display.backlinks);
	wikipedia_api.params = { form: form, Window: Window, image: fileSpace };
	wikipedia_api.post();

	const root = document.createElement('div');
	root.style.padding = '15px'; // just so it doesn't look broken
	Morebits.Status.init(root);
	wikipedia_api.statelem.status('loading...');
	Window.setContent(root);
	Window.display();
};

Twinkle.unlink.callback.evaluate = function twinkleunlinkCallbackEvaluate(event) {
	const form = event.target;
	const input = Morebits.QuickForm.getInputData(form);

	if (!input.reason) {
		alert('You must specify a reason for unlinking.');
		return;
	}

	input.backlinks = input.backlinks || [];
	input.imageusage = input.imageusage || [];
	const pages = Morebits.array.uniq(input.backlinks.concat(input.imageusage));
	if (!pages.length) {
		alert('You must select at least one item to unlink.');
		return;
	}

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	const unlinker = new Morebits.BatchOperation('Unlinking ' + (input.backlinks.length ? 'backlinks' +
			(input.imageusage.length ? ' and instances of file usage' : '') : 'instances of file usage'));
	unlinker.setOption('preserveIndividualStatusLines', true);
	unlinker.setPageList(pages);
	const params = { reason: input.reason, unlinker: unlinker };
	unlinker.run((pageName) => {
		const wikipedia_page = new Morebits.wiki.Page(pageName, 'Unlinking in page "' + pageName + '"');
		wikipedia_page.setBotEdit(true); // unlink considered a floody operation
		wikipedia_page.setCallbackParameters($.extend({
			doBacklinks: input.backlinks.includes(pageName),
			doImageusage: input.imageusage.includes(pageName)
		}, params));
		wikipedia_page.load(Twinkle.unlink.callbacks.unlinkBacklinks);
	});
};

Twinkle.unlink.callbacks = {
	display: {
		backlinks: function twinkleunlinkCallbackDisplayBacklinks(apiobj) {
			const response = apiobj.getResponse();
			let havecontent = false;
			let list, namespaces, i;

			if (apiobj.params.image) {
				const imageusage = response.query.imageusage.sort(Twinkle.sortByNamespace);
				list = [];
				for (i = 0; i < imageusage.length; ++i) {
					// Label made by Twinkle.generateBatchPageLinks
					list.push({ label: '', value: imageusage[i].title, checked: true });
				}
				if (!list.length) {
					apiobj.params.form.append({ type: 'div', label: 'No instances of file usage found.' });
				} else {
					apiobj.params.form.append({ type: 'header', label: 'File usage' });
					namespaces = [];
					$.each(Twinkle.getPref('unlinkNamespaces'), (k, v) => {
						namespaces.push(v === '0' ? '(Article)' : mw.config.get('wgFormattedNamespaces')[v]);
					});
					apiobj.params.form.append({
						type: 'div',
						label: 'Selected namespaces: ' + namespaces.join(', '),
						tooltip: 'You can change this with your Twinkle preferences, at [[WP:TWPREFS]]'
					});
					if (response['query-continue'] && response['query-continue'].imageusage) {
						apiobj.params.form.append({
							type: 'div',
							label: 'First ' + mw.language.convertNumber(list.length) + ' file usages shown.'
						});
					}
					apiobj.params.form.append({
						type: 'button',
						label: 'Select All',
						event: function(e) {
							$(Morebits.QuickForm.getElements(e.target.form, 'imageusage')).prop('checked', true);
						}
					});
					apiobj.params.form.append({
						type: 'button',
						label: 'Deselect All',
						event: function(e) {
							$(Morebits.QuickForm.getElements(e.target.form, 'imageusage')).prop('checked', false);
						}
					});
					apiobj.params.form.append({
						type: 'checkbox',
						name: 'imageusage',
						shiftClickSupport: true,
						list: list
					});
					havecontent = true;
				}
			}

			const backlinks = response.query.backlinks.sort(Twinkle.sortByNamespace);
			if (backlinks.length > 0) {
				list = [];
				for (i = 0; i < backlinks.length; ++i) {
					// Label made by Twinkle.generateBatchPageLinks
					list.push({ label: '', value: backlinks[i].title, checked: true });
				}
				apiobj.params.form.append({ type: 'header', label: 'Backlinks' });
				namespaces = [];
				$.each(Twinkle.getPref('unlinkNamespaces'), (k, v) => {
					namespaces.push(v === '0' ? '(Article)' : mw.config.get('wgFormattedNamespaces')[v]);
				});
				apiobj.params.form.append({
					type: 'div',
					label: 'Selected namespaces: ' + namespaces.join(', '),
					tooltip: 'You can change this with your Twinkle preferences, linked at the bottom of this Twinkle window'
				});
				if (response['query-continue'] && response['query-continue'].backlinks) {
					apiobj.params.form.append({
						type: 'div',
						label: 'First ' + mw.language.convertNumber(list.length) + ' backlinks shown.'
					});
				}
				apiobj.params.form.append({
					type: 'button',
					label: 'Select All',
					event: function(e) {
						$(Morebits.QuickForm.getElements(e.target.form, 'backlinks')).prop('checked', true);
					}
				});
				apiobj.params.form.append({
					type: 'button',
					label: 'Deselect All',
					event: function(e) {
						$(Morebits.QuickForm.getElements(e.target.form, 'backlinks')).prop('checked', false);
					}
				});
				apiobj.params.form.append({
					type: 'checkbox',
					name: 'backlinks',
					shiftClickSupport: true,
					list: list
				});
				havecontent = true;
			} else {
				apiobj.params.form.append({ type: 'div', label: 'No backlinks found.' });
			}

			if (havecontent) {
				apiobj.params.form.append({ type: 'submit' });
			}

			const result = apiobj.params.form.render();
			apiobj.params.Window.setContent(result);

			Morebits.QuickForm.getElements(result, 'backlinks').forEach(Twinkle.generateBatchPageLinks);
			Morebits.QuickForm.getElements(result, 'imageusage').forEach(Twinkle.generateBatchPageLinks);

		}
	},
	unlinkBacklinks: function twinkleunlinkCallbackUnlinkBacklinks(pageobj) {
		let oldtext = pageobj.getPageText();
		const params = pageobj.getCallbackParameters();
		const wikiPage = new Morebits.wikitext.Page(oldtext);

		let summaryText = '', warningString = false;
		let text;

		// remove image usages
		if (params.doImageusage) {
			text = wikiPage.commentOutImage(mw.config.get('wgTitle'), 'Commented out').getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = 'file usages';
			} else {
				summaryText = 'Commenting out use(s) of file';
				oldtext = text;
			}
		}

		// remove backlinks
		if (params.doBacklinks) {
			text = wikiPage.removeLink(Morebits.pageNameNorm).getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = warningString ? 'backlinks or file usages' : 'backlinks';
			} else {
				summaryText = (summaryText ? summaryText + ' / ' : '') + 'Removing link(s) to';
				oldtext = text;
			}
		}

		if (warningString) {
			// nothing to do!
			pageobj.getStatusElement().error("Didn't find any " + warningString + ' on the page.');
			params.unlinker.workerFailure(pageobj);
			return;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + ' "' + Morebits.pageNameNorm + '": ' + params.reason + '.');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('nocreate');
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};

Twinkle.addInitCallback(Twinkle.unlink, 'unlink');
}());

// </nowiki>
