// <nowiki>

(function() {

/*
 ****************************************
 *** twinkleimage.js: Image CSD module
 ****************************************
 * Mode of invocation:     Tab ("DI")
 * Active on:              Local nonredirect file pages (not on Commons) - Only file pages that exist locally; Files that exist on Commons do not trigger this module.
 */

Twinkle.image = function twinkleimage() {
	if (mw.config.get('wgNamespaceNumber') === 6 && mw.config.get('wgArticleId') && !document.getElementById('mw-sharedupload') && !Morebits.isPageRedirect()) {
		Twinkle.addPortletLink(Twinkle.image.callback, 'DI', 'tw-di', 'Nominate file for delayed speedy deletion');
	}
};

Twinkle.image.callback = function twinkleimageCallback() {
	const Window = new Morebits.SimpleWindow(600, 330);
	Window.setTitle('File for dated speedy deletion');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Speedy deletion policy', 'WP:CSD#Files');
	Window.addFooterLink('Image prefs', 'WP:TW/PREF#image');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#image');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.image.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Notify original uploader',
				value: 'notify',
				name: 'notify',
				tooltip: "Uncheck this if you are planning to make multiple nominations from the same user, and don't want to overload their talk page with too many notifications.",
				checked: Twinkle.getPref('notifyUserOnDeli')
			}
		]
	}
	);
	const field = form.append({
		type: 'field',
		label: 'Type of action wanted'
	});
	field.append({
		type: 'radio',
		name: 'type',
		event: Twinkle.image.callback.choice,
		list: [
			{
				label: 'No source (CSD F4)',
				value: 'no source',
				checked: true,
				tooltip: 'Image or media has no source information'
			},
			{
				label: 'No license (CSD F4)',
				value: 'no license',
				tooltip: 'Image or media does not have information on its copyright status'
			},
			{
				label: 'No source and no license (CSD F4)',
				value: 'no source no license',
				tooltip: 'Image or media has neither information on source nor its copyright status'
			},
			{
				label: 'Orphaned non-free use (CSD F5)',
				value: 'orphaned non-free use',
				tooltip: 'Image or media is unlicensed for use on Wikipedia and allowed only under a claim of fair use per Wikipedia:Non-free content, but it is not used in any articles'
			},
			{
				label: 'No non-free use rationale (CSD F6)',
				value: 'no non-free use rationale',
				tooltip: 'Image or media is claimed to be used under Wikipedia\'s fair use policy but has no explanation as to why it is permitted under the policy'
			},
			{
				label: 'Disputed non-free use rationale (CSD F7)',
				value: 'disputed non-free use rationale',
				tooltip: 'Image or media has a fair use rationale that is disputed or invalid, such as a {{Non-free logo}} tag on a photograph of a mascot'
			},
			{
				label: 'Replaceable non-free use (CSD F7)',
				value: 'replaceable non-free use',
				tooltip: 'Image or media may fail Wikipedia\'s first non-free content criterion ([[WP:NFCC#1]]) in that it illustrates a subject for which a free image might reasonably be found or created that adequately provides the same information'
			},
			{
				label: 'No evidence of permission (CSD F11)',
				value: 'no permission',
				tooltip: 'Image or media does not have proof that the author agreed to licence the file'
			}
		]
	});
	form.append({
		type: 'div',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit' });

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the parameters
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type[0].dispatchEvent(evt);
};

Twinkle.image.callback.choice = function twinkleimageCallbackChoose(event) {
	const value = event.target.values;
	const root = event.target.form;
	const work_area = new Morebits.QuickForm.Element({
		type: 'div',
		name: 'work_area'
	});

	switch (value) {
		case 'no source no license':
		case 'no source':
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Non-free',
						name: 'non_free',
						tooltip: 'File is licensed under a fair use claim'
					}
				]
			});
		/* falls through */
		case 'no license':
			work_area.append({
				type: 'checkbox',
				list: [
					{
						name: 'derivative',
						label: 'Derivative work which lacks a source for incorporated works',
						tooltip: 'File is a derivative of one or more other works whose source is not specified'
					}
				]
			});
			break;
		case 'no permission':
			work_area.append({
				type: 'input',
				name: 'source',
				label: 'Source:'
			});
			break;
		case 'disputed non-free use rationale':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Concern:'
			});
			break;
		case 'orphaned non-free use':
			work_area.append({
				type: 'input',
				name: 'replacement',
				label: 'Replacement:',
				tooltip: 'Optional file that replaces this one.  The "File:" prefix is optional.'
			});
			break;
		case 'replaceable non-free use':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Reason:'
			});
			break;
		default:
			break;
	}

	root.replaceChild(work_area.render(), $(root).find('div[name="work_area"]')[0]);
};

Twinkle.image.callback.evaluate = function twinkleimageCallbackEvaluate(event) {

	const input = Morebits.QuickForm.getInputData(event.target);
	if (input.replacement) {
		input.replacement = (new RegExp('^' + Morebits.namespaceRegex(6) + ':', 'i').test(input.replacement) ? '' : 'File:') + input.replacement;
	}

	let csdcrit;
	switch (input.type) {
		case 'no source no license':
		case 'no source':
		case 'no license':
			csdcrit = 'F4';
			break;
		case 'orphaned non-free use':
			csdcrit = 'F5';
			break;
		case 'no non-free use rationale':
			csdcrit = 'F6';
			break;
		case 'disputed non-free use rationale':
		case 'replaceable non-free use':
			csdcrit = 'F7';
			break;
		case 'no permission':
			csdcrit = 'F11';
			break;
		default:
			throw new Error('Twinkle.image.callback.evaluate: unknown criterion');
	}

	const lognomination = Twinkle.getPref('logSpeedyNominations') && !Twinkle.getPref('noLogOnSpeedyNomination').includes(csdcrit.toLowerCase());
	const templatename = input.derivative ? 'dw ' + input.type : input.type;

	const params = $.extend({
		templatename: templatename,
		normalized: csdcrit,
		lognomination: lognomination
	}, input);

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(event.target);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete';

	// Tagging image
	const wikipedia_page = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Tagging file with deletion tag');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.image.callbacks.taggingImage);

	// Notifying uploader
	if (input.notify) {
		wikipedia_page.lookupCreation(Twinkle.image.callbacks.userNotification);
	} else {
		// add to CSD log if desired
		if (lognomination) {
			Twinkle.image.callbacks.addToLog(params, null);
		}
		// No auto-notification, display what was going to be added.
		const noteData = document.createElement('pre');
		noteData.appendChild(document.createTextNode('{{subst:di-' + templatename + '-notice|1=' + mw.config.get('wgTitle') + '}} ~~~~'));
		Morebits.Status.info('Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement('br'), noteData ]);
	}
};

Twinkle.image.callbacks = {
	taggingImage: function(pageobj) {
		let text = pageobj.getPageText();
		const params = pageobj.getCallbackParameters();

		// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
		text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

		let tag = '{{di-' + params.templatename + '|date={{subst:#time:j F Y}}';
		switch (params.type) {
			case 'no source no license':
			case 'no source':
				tag += params.non_free ? '|non-free=yes' : '';
				break;
			case 'no permission':
				tag += params.source ? '|source=' + params.source : '';
				break;
			case 'disputed non-free use rationale':
				tag += params.reason ? '|concern=' + params.reason : '';
				break;
			case 'orphaned non-free use':
				tag += params.replacement ? '|replacement=' + params.replacement : '';
				break;
			case 'replaceable non-free use':
				tag += params.reason ? '|1=' + params.reason : '';
				break;
			default:
				break; // doesn't matter
		}
		tag += '|help=off}}\n';

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary('This file is up for deletion, per [[WP:CSD#' + params.normalized + '|CSD ' + params.normalized + ']] (' + params.type + ').');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('deliWatchPage'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: function(pageobj) {
		const params = pageobj.getCallbackParameters();
		const initialContrib = pageobj.getCreator();

		// disallow warning yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
		} else {
			const usertalkpage = new Morebits.wiki.Page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			let notifytext = '\n{{subst:di-' + params.templatename + '-notice|1=' + mw.config.get('wgTitle');
			if (params.type === 'no permission') {
				notifytext += params.source ? '|source=' + params.source : '';
			}
			notifytext += '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: tagging for deletion of [[:' + Morebits.pageNameNorm + ']].');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('deliWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append();
		}

		// add this nomination to the user's userspace log, if the user has enabled it
		if (params.lognomination) {
			Twinkle.image.callbacks.addToLog(params, initialContrib);
		}
	},
	addToLog: function(params, initialContrib) {
		const usl = new Morebits.UserspaceLogger(Twinkle.getPref('speedyLogPageName'));
		usl.initialText =
			"This is a log of all [[WP:CSD|speedy deletion]] nominations made by this user using [[WP:TW|Twinkle]]'s CSD module.\n\n" +
			'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
			'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
			(Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');

		const formatParamLog = function(normalize, csdparam, input) {
			if (normalize === 'F5' && csdparam === 'replacement') {
				input = '[[:' + input + ']]';
			}
			return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
		};

		let extraInfo = '';

		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		const fileLogLink = ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])';

		let appendText = '# [[:' + Morebits.pageNameNorm + ']]' + fileLogLink + ': DI [[WP:CSD#' + params.normalized.toUpperCase() + '|CSD ' + params.normalized.toUpperCase() + ']] ({{tl|di-' + params.templatename + '}})';

		['reason', 'replacement', 'source'].forEach((item) => {
			if (params[item]) {
				extraInfo += formatParamLog(params.normalized.toUpperCase(), item, params[item]);
				return false;
			}
		});

		if (extraInfo) {
			appendText += '; additional information:' + extraInfo;
		}
		if (initialContrib) {
			appendText += '; notified {{user|1=' + initialContrib + '}}';
		}
		appendText += ' ~~~~~\n';

		const editsummary = 'Logging speedy deletion nomination of [[:' + Morebits.pageNameNorm + ']].';

		usl.changeTags = Twinkle.changeTags;
		usl.log(appendText, editsummary);
	}
};

Twinkle.addInitCallback(Twinkle.image, 'image');
}());

// </nowiki>
