// <nowiki>


(function($) {


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
	var Window = new Morebits.simpleWindow(600, 440);
	Window.setTitle('Unlink backlinks' + (mw.config.get('wgNamespaceNumber') === 6 ? ' and file usages' : ''));
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#unlink');

	var form = new Morebits.quickForm(Twinkle.unlink.callback.evaluate);

	// prepend some basic documentation
	var node1 = Morebits.htmlNode('code', '[[' + Morebits.pageNameNorm + '|link text]]');
	var node2 = Morebits.htmlNode('code', 'link text');
	node1.style.fontFamily = node2.style.fontFamily = 'monospace';
	node1.style.fontStyle = node2.style.fontStyle = 'normal';
	form.append({
		type: 'div',
		style: 'margin-bottom: 0.5em',
		label: [
			'This tool allows you to unlink all incoming links ("backlinks") that point to this page' +
				(mw.config.get('wgNamespaceNumber') === 6 ? ', and/or hide all inclusions of this file by wrapping them in <!-- --> comment markup' : '') +
				'. For instance, ',
			node1,
			' would become ',
			node2,
			'. Use it with caution.'
		]
	});

	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reason: ',
		value: presetReason ? presetReason : '',
		size: 60
	});

	var query;
	if (mw.config.get('wgNamespaceNumber') === 6) {  // File:
		query = {
			'action': 'query',
			'list': [ 'backlinks', 'imageusage' ],
			'bltitle': mw.config.get('wgPageName'),
			'iutitle': mw.config.get('wgPageName'),
			'bllimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'iulimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': Twinkle.getPref('unlinkNamespaces'),
			'iunamespace': Twinkle.getPref('unlinkNamespaces'),
			'rawcontinue': true
		};
	} else {
		query = {
			'action': 'query',
			'list': 'backlinks',
			'bltitle': mw.config.get('wgPageName'),
			'blfilterredir': 'nonredirects',
			'bllimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': Twinkle.getPref('unlinkNamespaces'),
			'rawcontinue': true
		};
	}
	var wikipedia_api = new Morebits.wiki.api('Grabbing backlinks', query, Twinkle.unlink.callbacks.display.backlinks);
	wikipedia_api.params = { form: form, Window: Window, image: mw.config.get('wgNamespaceNumber') === 6 };
	wikipedia_api.post();

	var root = document.createElement('div');
	root.style.padding = '15px';  // just so it doesn't look broken
	Morebits.status.init(root);
	wikipedia_api.statelem.status('loading...');
	Window.setContent(root);
	Window.display();
};

Twinkle.unlink.callback.evaluate = function twinkleunlinkCallbackEvaluate(event) {
	var form = event.target;
	var input = Morebits.quickForm.getInputData(form);

	if (!input.reason) {
		alert('You must specify a reason for unlinking.');
		return;
	}

	input.backlinks = input.backlinks || [];
	input.imageusage = input.imageusage || [];
	var pages = Morebits.array.uniq(input.backlinks.concat(input.imageusage));
	if (!pages.length) {
		alert('You must select at least one item to unlink.');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	var unlinker = new Morebits.batchOperation('Unlinking ' + (input.backlinks.length ? 'backlinks' +
			(input.imageusage.length ? ' and instances of file usage' : '') : 'instances of file usage'));
	unlinker.setOption('preserveIndividualStatusLines', true);
	unlinker.setPageList(pages);
	var params = { reason: input.reason, unlinker: unlinker };
	unlinker.run(function(pageName) {
		var wikipedia_page = new Morebits.wiki.page(pageName, 'Unlinking in page "' + pageName + '"');
		wikipedia_page.setBotEdit(true);  // unlink considered a floody operation
		wikipedia_page.setCallbackParameters($.extend({
			doBacklinks: input.backlinks.indexOf(pageName) !== -1,
			doImageusage: input.imageusage.indexOf(pageName) !== -1
		}, params));
		wikipedia_page.load(Twinkle.unlink.callbacks.unlinkBacklinks);
	});
};

Twinkle.unlink.callbacks = {
	display: {
		backlinks: function twinkleunlinkCallbackDisplayBacklinks(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var havecontent = false;
			var list, namespaces, i;

			if (apiobj.params.image) {
				var imageusage = $(xmlDoc).find('query imageusage iu');
				list = [];
				for (i = 0; i < imageusage.length; ++i) {
					var usagetitle = imageusage[i].getAttribute('title');
					list.push({ label: usagetitle, value: usagetitle, checked: true });
				}
				if (!list.length) {
					apiobj.params.form.append({ type: 'div', label: 'No instances of file usage found.' });
				} else {
					apiobj.params.form.append({ type: 'header', label: 'File usage' });
					namespaces = [];
					$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
						namespaces.push(v === '0' ? '(Article)' : mw.config.get('wgFormattedNamespaces')[v]);
					});
					apiobj.params.form.append({
						type: 'div',
						label: 'Selected namespaces: ' + namespaces.join(', '),
						tooltip: 'You can change this with your Twinkle preferences, at [[WP:TWPREFS]]'
					});
					if ($(xmlDoc).find('query-continue').length) {
						apiobj.params.form.append({
							type: 'div',
							label: 'First ' + mw.language.convertNumber(list.length) + ' file usages shown.'
						});
					}
					apiobj.params.form.append({
						type: 'button',
						label: 'Select All',
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, 'imageusage')).prop('checked', true);
						}
					});
					apiobj.params.form.append({
						type: 'button',
						label: 'Deselect All',
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, 'imageusage')).prop('checked', false);
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

			var backlinks = $(xmlDoc).find('query backlinks bl');
			if (backlinks.length > 0) {
				list = [];
				for (i = 0; i < backlinks.length; ++i) {
					var title = backlinks[i].getAttribute('title');
					list.push({ label: title, value: title, checked: true });
				}
				apiobj.params.form.append({ type: 'header', label: 'Backlinks' });
				namespaces = [];
				$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
					namespaces.push(v === '0' ? '(Article)' : mw.config.get('wgFormattedNamespaces')[v]);
				});
				apiobj.params.form.append({
					type: 'div',
					label: 'Selected namespaces: ' + namespaces.join(', '),
					tooltip: 'You can change this with your Twinkle preferences, at [[WP:TWPREFS]]'
				});
				if ($(xmlDoc).find('query-continue').length) {
					apiobj.params.form.append({
						type: 'div',
						label: 'First ' + mw.language.convertNumber(list.length) + ' backlinks shown.'
					});
				}
				apiobj.params.form.append({
					type: 'button',
					label: 'Select All',
					event: function(e) {
						$(Morebits.quickForm.getElements(e.target.form, 'backlinks')).prop('checked', true);
					}
				});
				apiobj.params.form.append({
					type: 'button',
					label: 'Deselect All',
					event: function(e) {
						$(Morebits.quickForm.getElements(e.target.form, 'backlinks')).prop('checked', false);
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

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent(result);

		}
	},
	unlinkBacklinks: function twinkleunlinkCallbackUnlinkBacklinks(pageobj) {
		var oldtext = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var wikiPage = new Morebits.wikitext.page(oldtext);

		var summaryText = '', warningString = false;
		var text;

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
})(jQuery);


// </nowiki>
