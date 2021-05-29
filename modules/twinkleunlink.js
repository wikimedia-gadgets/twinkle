// <nowiki>


/*****************************************************************************************************
 * WARNING: This file is synced with a GitHub-repo. Please make any changes to this file over there. *
 * Any local changes might be overwritten the next time this file is updated.                        *
 *                                                                                                   *
 * LET OP: Dit bestand is gekoppeld aan een GitHub-repo. Gelieve alle bewerkingen daar uitvoeren.    *
 * Locale bewerkingen worden mogelijk overschreven bij de volgende update.                           *
 *                                                                                                   *
 * https://github.com/NLWikiTools/Twinkle/blob/master/modules/twinkleunlink.js                       *
 *****************************************************************************************************/

(function($) {


/*
 ****************************************
 *** twinkleunlink.js: Unlink module
 ****************************************
 * Mode of invocation:     Tab ("Unlink")
 * Active on:              Non-special pages, except Wikipedia:Sandbox
 */

Twinkle.unlink = function twinkleunlink() {
	if (mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgPageName') === 'Wikipedia:Zandbak' ||
		//Restrict to rollbacker and sysop
		(!Morebits.userIsInGroup('rollbacker') && !Morebits.userIsSysop)) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.unlink.callback, 'Ontlink', 'tw-unlink', 'Ontlink deze pagina');
};

// the parameter is used when invoking unlink from admin speedy
Twinkle.unlink.callback = function(presetReason) {
	var fileSpace = mw.config.get('wgNamespaceNumber') === 6;

	var Window = new Morebits.simpleWindow(600, 440);
	Window.setTitle('Ontlink pagina' + (fileSpace ? ' en bestandsgebruik' : ''));
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Ontlink voorkeuren', 'WP:TW/PREF#unlink');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#unlink');

	var form = new Morebits.quickForm(Twinkle.unlink.callback.evaluate);

	// prepend some documentation: files are commented out, while any
	// display text is preserved for links (otherwise the link itself is used)
	var linkTextBefore = Morebits.htmlNode('code', '[[' + (fileSpace ? ':' : '') + Morebits.pageNameNorm + '|link tekst]]');
	var linkTextAfter = Morebits.htmlNode('code', 'link tekst');
	var linkPlainBefore = Morebits.htmlNode('code', '[[' + Morebits.pageNameNorm + ']]');
	var linkPlainAfter;
	if (fileSpace) {
		linkPlainAfter = Morebits.htmlNode('code', '<!-- [[' + Morebits.pageNameNorm + ']] -->');
	} else {
		linkPlainAfter = Morebits.htmlNode('code', Morebits.pageNameNorm);
	}

	form.append({
		type: 'div',
		style: 'margin-bottom: 0.5em',
		label: [
			'Deze tool ontlinkt deze pagina, dat wil zeggen dat het alle links naar deze pagina verwijdert' +
				(fileSpace ? ', en/of al het gebruik van dit bestand verbergt door er <!-- --> omheen te plaatsen' : '') +
				'. Bijvoorbeeld, ',
			linkTextBefore, ' wordt ', linkTextAfter, ' en ',
			linkPlainBefore, ' wordt ', linkPlainAfter, '. Wees voorzichtig met het gebruik van deze tool.'
		]
	});

	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reden: ',
		value: presetReason ? presetReason : '',
		size: 60
	});

	var query = {
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
	var wikipedia_api = new Morebits.wiki.api('Paginalinks ophalen', query, Twinkle.unlink.callbacks.display.backlinks);
	wikipedia_api.params = { form: form, Window: Window, image: fileSpace };
	wikipedia_api.post();

	var root = document.createElement('div');
	root.style.padding = '15px';  // just so it doesn't look broken
	Morebits.status.init(root);
	wikipedia_api.statelem.status('laden...');
	Window.setContent(root);
	Window.display();
};

Twinkle.unlink.callback.evaluate = function twinkleunlinkCallbackEvaluate(event) {
	var form = event.target;
	var input = Morebits.quickForm.getInputData(form);

	if (!input.reason) {
		alert('Je moet een reden opgeven voor het ontlinken.');
		return;
	}

	input.backlinks = input.backlinks || [];
	input.imageusage = input.imageusage || [];
	var pages = Morebits.array.uniq(input.backlinks.concat(input.imageusage));
	if (!pages.length) {
		alert('Je moet tenminste een item geven om te ontlinken.');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	var unlinker = new Morebits.batchOperation('Ontlinken van ' + (input.backlinks.length ? 'links' +
			(input.imageusage.length ? ' en bestandsgebruik' : '') : 'bestandsgebruik'));
	unlinker.setOption('preserveIndividualStatusLines', true);
	unlinker.setPageList(pages);
	var params = { reason: input.reason, unlinker: unlinker };
	unlinker.run(function(pageName) {
		var wikipedia_page = new Morebits.wiki.page(pageName, 'Ontlinken op pagina "' + pageName + '"');
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
			var response = apiobj.getResponse();
			var havecontent = false;
			var list, namespaces, i;

			if (apiobj.params.image) {
				var imageusage = response.query.imageusage.sort(Twinkle.sortByNamespace);
				list = [];
				for (i = 0; i < imageusage.length; ++i) {
					// Label made by Twinkle.generateBatchPageLinks
					list.push({ label: '', value: imageusage[i].title, checked: true });
				}
				if (!list.length) {
					apiobj.params.form.append({ type: 'div', label: 'Geen gebruik van dit bestand gevonden.' });
				} else {
					apiobj.params.form.append({ type: 'header', label: 'Bestandsgebruik' });
					namespaces = [];
					$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
						namespaces.push(v === '0' ? '(Article)' : mw.config.get('wgFormattedNamespaces')[v]);
					});
					apiobj.params.form.append({
						type: 'div',
						label: 'Geselecteerde naamruimtes: ' + namespaces.join(', '),
						tooltip: 'Je kunt dit aanpassen op het [[WP:TW/PREFS|Twinkle configuratiescherm]]'
					});
					if (response['query-continue'] && response['query-continue'].imageusage) {
						apiobj.params.form.append({
							type: 'div',
							label: 'Eerste ' + mw.language.convertNumber(list.length) + ' pagina\'s die dit bestand gebruiken getoond.'
						});
					}
					apiobj.params.form.append({
						type: 'button',
						label: 'Selecteer alles',
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, 'imageusage')).prop('checked', true);
						}
					});
					apiobj.params.form.append({
						type: 'button',
						label: 'Deselecteer alles',
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

			var backlinks = response.query.backlinks.sort(Twinkle.sortByNamespace);
			if (backlinks.length > 0) {
				list = [];
				for (i = 0; i < backlinks.length; ++i) {
					// Label made by Twinkle.generateBatchPageLinks
					list.push({ label: '', value: backlinks[i].title, checked: true });
				}
				apiobj.params.form.append({ type: 'header', label: 'Links' });
				namespaces = [];
				$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
					namespaces.push(v === '0' ? '(Artikel)' : mw.config.get('wgFormattedNamespaces')[v]);
				});
				apiobj.params.form.append({
					type: 'div',
					label: 'Geselecteerde naamruimtes: ' + namespaces.join(', '),
					tooltip: 'Je kunt dit aanpassen op het [[WP:TW/PREFS|Twinkle configuratiescherm]]'
				});
				if (response['query-continue'] && response['query-continue'].backlinks) {
					apiobj.params.form.append({
						type: 'div',
						label: 'Eerste ' + mw.language.convertNumber(list.length) + ' links getoond.'
					});
				}
				apiobj.params.form.append({
					type: 'button',
					label: 'Selecteer alles',
					event: function(e) {
						$(Morebits.quickForm.getElements(e.target.form, 'backlinks')).prop('checked', true);
					}
				});
				apiobj.params.form.append({
					type: 'button',
					label: 'Deselecteer alles',
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
				apiobj.params.form.append({ type: 'div', label: 'Geen links gevonden. ' });
			}

			if (havecontent) {
				apiobj.params.form.append({ type: 'submit' });
			}

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent(result);

			Morebits.quickForm.getElements(result, 'backlinks').forEach(Twinkle.generateBatchPageLinks);
			Morebits.quickForm.getElements(result, 'imageusage').forEach(Twinkle.generateBatchPageLinks);

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
			text = wikiPage.commentOutImage(mw.config.get('wgTitle'), 'Uitgeschakeld').getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = 'bestandsgebruik';
			} else {
				summaryText = 'Uitschakelen van bestandsgebruik';
				oldtext = text;
			}
		}

		// remove backlinks
		if (params.doBacklinks) {
			text = wikiPage.removeLink(Morebits.pageNameNorm).getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = warningString ? 'bestandsgebruik en links' : 'links';
			} else {
				summaryText = (summaryText ? summaryText + ' / ' : '') + 'Verwijderen van link(s) naar';
				oldtext = text;
			}
		}

		if (warningString) {
			// nothing to do!
			pageobj.getStatusElement().error("Geen " + warningString + ' op de pagina gevonden.');
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
