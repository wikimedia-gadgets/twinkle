// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlytalkback.js: Talkback module
 ****************************************
 * Mode of invocation:     Tab ("TB")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 * Config directives in:   FriendlyConfig
 */

Twinkle.talkback = function() {

	if (!mw.config.get('wgRelevantUserName')) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.talkback.callback, 'TB', 'friendly-talkback', 'Easy talkback');
};

Twinkle.talkback.callback = function() {
	if (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') && !confirm("Is it really so bad that you're talking back to yourself?")) {
		return;
	}

	var Window = new Morebits.simpleWindow(600, 350);
	Window.setTitle('Talkback');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('About {{talkback}}', 'Template:Talkback');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#talkback');

	var form = new Morebits.quickForm(Twinkle.talkback.evaluate);

	form.append({ type: 'radio', name: 'tbtarget',
		list: [
			{
				label: 'Talkback: my talk page',
				value: 'mytalk',
				checked: 'true'
			},
			{
				label: 'Talkback: other user talk page',
				value: 'usertalk'
			},
			{
				label: 'Talkback: other page',
				value: 'other'
			},
			{
				label: '"Please see"',
				value: 'see'
			},
			{
				label: 'Noticeboard notification',
				value: 'notice'
			},
			{
				label: "\"You've got mail\"",
				value: 'mail'
			}
		],
		event: Twinkle.talkback.changeTarget
	});

	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.tbtarget[0].dispatchEvent(evt);

	// Check whether the user has opted out from talkback
	var query = {
		action: 'query',
		prop: 'extlinks',
		titles: mw.config.get('wgPageName'),
		elquery: 'userjs.invalid/noTalkback',
		ellimit: '1'
	};
	var wpapi = new Morebits.wiki.api('Fetching talkback opt-out status', query, Twinkle.talkback.callback.optoutStatus);
	wpapi.post();
};

Twinkle.talkback.optout = null;

Twinkle.talkback.callback.optoutStatus = function(apiobj) {
	var xml = apiobj.getXML();
	var $el = $(xml).find('el');

	if ($el.length) {
		Twinkle.talkback.optout = mw.config.get('wgRelevantUserName') + ' prefers not to receive talkbacks';
		var url = $el.text();
		if (url.indexOf('reason=') > -1) {
			Twinkle.talkback.optout += ': ' + decodeURIComponent(url.substring(url.indexOf('reason=') + 7)) + '.';
		} else {
			Twinkle.talkback.optout += '.';
		}
	} else {
		Twinkle.talkback.optout = false;
	}

	var $status = $('#twinkle-talkback-optout-message');
	if ($status.length) {
		$status.append(Twinkle.talkback.optout);
	}
};

var prev_page = '';
var prev_section = '';
var prev_message = '';

Twinkle.talkback.changeTarget = function(e) {
	var value = e.target.values;
	var root = e.target.form;
	var old_area = Morebits.quickForm.getElements(root, 'work_area')[0];

	if (root.section) {
		prev_section = root.section.value;
	}
	if (root.message) {
		prev_message = root.message.value;
	}
	if (root.page) {
		prev_page = root.page.value;
	}

	var work_area = new Morebits.quickForm.element({
		type: 'field',
		label: 'Talkback information',
		name: 'work_area'
	});

	switch (value) {
		case 'mytalk':
			/* falls through */
		default:
			work_area.append({
				type: 'div',
				label: '',
				style: 'color: red',
				id: 'twinkle-talkback-optout-message'
			});
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Linked section (optional)',
				tooltip: 'The section heading on your talk page where you left a message. Leave empty for no section to be linked.',
				value: prev_section
			});
			break;

		case 'usertalk':
			work_area.append({
				type: 'div',
				label: '',
				style: 'color: red',
				id: 'twinkle-talkback-optout-message'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'User',
				tooltip: 'The username of the user on whose talk page you left a message.',
				value: prev_page
			});

			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Linked section (optional)',
				tooltip: 'The section heading on the page where you left a message. Leave empty for no section to be linked.',
				value: prev_section
			});
			break;

		case 'notice':
			var noticeboard = work_area.append({
				type: 'select',
				name: 'noticeboard',
				label: 'Noticeboard:',
				event: function(e) {
					if (e.target.value === 'afchd') {
						Morebits.quickForm.overrideElementLabel(e.target.form.section, 'Title of draft (excluding the prefix): ');
						Morebits.quickForm.setElementTooltipVisibility(e.target.form.section, false);
					} else {
						Morebits.quickForm.resetElementLabel(e.target.form.section);
						Morebits.quickForm.setElementTooltipVisibility(e.target.form.section, true);
					}
				}
			});

			$.each(Twinkle.talkback.noticeboards, function(value, data) {
				noticeboard.append({
					type: 'option',
					label: data.label,
					value: value,
					selected: !!data.defaultSelected
				});
			});

			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Linked thread',
				tooltip: 'The heading of the relevant thread on the noticeboard page.',
				value: prev_section
			});
			break;

		case 'other':
			work_area.append({
				type: 'div',
				label: '',
				style: 'color: red',
				id: 'twinkle-talkback-optout-message'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'Full page name',
				tooltip: "The full page name where you left the message. For example: 'Wikipedia talk:Twinkle'.",
				value: prev_page
			});

			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Linked section (optional)',
				tooltip: 'The section heading on the page where you left a message. Leave empty for no section to be linked.',
				value: prev_section
			});
			break;

		case 'mail':
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Subject of email (optional)',
				tooltip: 'The subject line of the email you sent.'
			});
			break;

		case 'see':
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'Full page name',
				tooltip: "The full page name of where the discussion is being held. For example: 'Wikipedia talk:Twinkle'.",
				value: prev_page
			});
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Linked section (optional)',
				tooltip: "The section heading where the discussion is being held. For example: 'Merge proposal'.",
				value: prev_section
			});
			break;
	}

	if (value !== 'notice') {
		work_area.append({ type: 'textarea', label: 'Additional message (optional):', name: 'message', tooltip: 'An additional message that you would like to leave below the talkback template. Your signature will be added to the end of the message if you leave one.' });
	}

	work_area = work_area.render();
	root.replaceChild(work_area, old_area);
	if (root.message) {
		root.message.value = prev_message;
	}

	if (Twinkle.talkback.optout) {
		$('#twinkle-talkback-optout-message').append(Twinkle.talkback.optout);
	}
};

Twinkle.talkback.noticeboards = {
	'an': {
		label: "WP:AN (Administrators' noticeboard)",
		text: '== ' + Twinkle.getFriendlyPref('adminNoticeHeading') + ' ==\n' +
		"{{subst:ANI-notice|thread=$SECTION|noticeboard=Wikipedia:Administrators' noticeboard}} ~~~~",
		editSummary: 'Notice of discussion at [[Wikipedia:Administrators\' noticeboard]]'
	},
	'an3': {
		label: "WP:AN3 (Administrators' noticeboard/Edit warring)",
		text: '{{subst:An3-notice|$SECTION}} ~~~~',
		editSummary: "Notice of discussion at [[Wikipedia:Administrators' noticeboard/Edit warring]]"
	},
	'ani': {
		label: "WP:ANI (Administrators' noticeboard/Incidents)",
		text: '== ' + Twinkle.getFriendlyPref('adminNoticeHeading') + ' ==\n' +
		"{{subst:ANI-notice|thread=$SECTION|noticeboard=Wikipedia:Administrators' noticeboard/Incidents}} ~~~~",
		editSummary: 'Notice of discussion at [[Wikipedia:Administrators\' noticeboard/Incidents]]',
		defaultSelected: true
	},
	// let's keep AN and its cousins at the top
	'afchd': {
		label: 'WP:AFCHD (Articles for creation/Help desk)',
		text: '{{subst:AFCHD/u|$SECTION}} ~~~~',
		editSummary: 'You have replies at the [[Wikipedia:AFCHD|Articles for Creation Help Desk]]'
	},
	'coin': {
		label: 'WP:COIN (Conflict of interest noticeboard)',
		text: '{{subst:Coin-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Conflict of interest noticeboard]]'
	},
	'drn': {
		label: 'WP:DRN (Dispute resolution noticeboard)',
		text: '{{subst:DRN-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Dispute resolution noticeboard]]'
	},
	'hd': {
		label: 'WP:HD (Help desk)',
		text: '== Your question at the Help desk ==\n' + '{{helpdeskreply|1=$SECTION|ts=~~~~~}}',
		editSummary: 'You have replies at the [[Wikipedia:Help desk|Wikipedia help desk]]'
	},
	'th': {
		label: 'WP:THQ (Teahouse question forum)',
		text: "== Teahouse talkback: you've got messages! ==\n{{WP:Teahouse/Teahouse talkback|WP:Teahouse/Questions|$SECTION|ts=~~~~}}",
		editSummary: 'You have replies at the [[Wikipedia:Teahouse/Questions|Teahouse question board]]'
	},
	'otrs': {
		label: 'WP:OTRS/N (OTRS noticeboard)',
		text: '{{OTRSreply|1=$SECTION|2=~~~~}}',
		editSummary: 'You have replies at the [[Wikipedia:OTRS noticeboard|OTRS noticeboard]]'
	}
};

Twinkle.talkback.evaluate = function(e) {

	var tbtarget = e.target.getChecked('tbtarget')[0];
	var page = null;
	var section = e.target.section.value;
	var fullUserTalkPageName = mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user_talk] + ':' + mw.config.get('wgRelevantUserName');

	if (tbtarget === 'usertalk' || tbtarget === 'other' || tbtarget === 'see') {
		page = e.target.page.value;

		if (tbtarget === 'usertalk') {
			if (!page) {
				alert('You must specify the username of the user whose talk page you left a message on.');
				return;
			}
		} else {
			if (!page) {
				alert('You must specify the full page name when your message is not on a user talk page.');
				return;
			}
		}
	} else if (tbtarget === 'notice') {
		page = e.target.noticeboard.value;
	}

	var message;
	if (e.target.message) {
		message = e.target.message.value;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = fullUserTalkPageName;
	Morebits.wiki.actionCompleted.notice = 'Talkback complete; reloading talk page in a few seconds';

	var talkpage = new Morebits.wiki.page(fullUserTalkPageName, 'Adding talkback');
	var tbPageName = tbtarget === 'mytalk' ? mw.config.get('wgUserName') : page;

	var text = '\n\n';
	if (tbtarget === 'notice') {
		text += Morebits.string.safeReplace(Twinkle.talkback.noticeboards[page].text, '$SECTION', section);
		talkpage.setEditSummary(Twinkle.talkback.noticeboards[page].editSummary + Twinkle.getPref('summaryAd'));

	} else if (tbtarget === 'mail') {
		text +=
			'==' + Twinkle.getFriendlyPref('mailHeading') + '==\n' +
			"{{You've got mail|subject=" + section + '|ts=~~~~~}}';

		if (message) {
			text += '\n' + message.trim() + '  ~~~~';
		} else if (Twinkle.getFriendlyPref('insertTalkbackSignature')) {
			text += '\n~~~~';
		}

		talkpage.setEditSummary("Notification: You've got mail" + Twinkle.getPref('summaryAd'));

	} else if (tbtarget === 'see') {
		text += '{{subst:Please see|location=' + tbPageName + (section ? '#' + section : '') + '|more=' + message.trim() + '}}';

		talkpage.setEditSummary('Please check the discussion at [[:' + tbPageName +
			(section ? '#' + section : '') + ']]' + Twinkle.getPref('summaryAd'));

	} else {  // tbtarget one of mytalk, usertalk, other
		// clean talkback heading: strip section header markers that were erroneously suggested in the documentation
		text +=
			'==' + Twinkle.getFriendlyPref('talkbackHeading').replace(/^\s*=+\s*(.*?)\s*=+$\s*/, '$1') + '==\n' +
			'{{talkback|' + tbPageName + (section ? '|' + section : '') + '|ts=~~~~~}}';

		if (message) {
			text += '\n' + message.trim() + ' ~~~~';
		} else if (Twinkle.getFriendlyPref('insertTalkbackSignature')) {
			text += '\n~~~~';
		}

		var editSummary = 'Talkback ([[:';
		if (tbtarget !== 'other' && !/^\s*user talk:/i.test(tbPageName)) {
			editSummary += 'User talk:';
		}
		editSummary += tbPageName + (section ? '#' + section : '') + ']])';
		talkpage.setEditSummary(editSummary + Twinkle.getPref('summaryAd'));
	}

	talkpage.setAppendText(text);
	talkpage.setCreateOption('recreate');
	talkpage.setMinorEdit(Twinkle.getFriendlyPref('markTalkbackAsMinor'));
	talkpage.setFollowRedirect(true);
	talkpage.append();
};

})(jQuery);


// </nowiki>
