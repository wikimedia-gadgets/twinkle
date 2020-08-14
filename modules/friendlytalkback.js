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

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.talkback.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', id: 'talkbackpreview', label: [ previewlink ] });
	form.append({ type: 'div', id: 'friendlytalkback-previewbox', style: 'display: none' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.previewer = new Morebits.wiki.preview($(result).find('div#friendlytalkback-previewbox').last()[0]);

	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.tbtarget[0].dispatchEvent(evt);

	// Check whether the user has opted out from talkback
	var query = {
		action: 'query',
		prop: 'extlinks',
		titles: 'User talk:' + mw.config.get('wgRelevantUserName'),
		elquery: 'userjs.invalid/noTalkback',
		ellimit: '1'
	};
	var wpapi = new Morebits.wiki.api('Fetching talkback opt-out status', query, Twinkle.talkback.callback.optoutStatus);
	wpapi.post();
};

Twinkle.talkback.optout = '';

Twinkle.talkback.callback.optoutStatus = function(apiobj) {
	var $el = $(apiobj.getXML()).find('el');
	if ($el.length) {
		Twinkle.talkback.optout = mw.config.get('wgRelevantUserName') + ' prefers not to receive talkbacks';
		var url = $el.text();
		var reason = mw.util.getParamValue('reason', url);
		Twinkle.talkback.optout += reason ? ': ' + reason : '.';
	}
	$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
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

	root.previewer.closePreview();

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
				label: 'User (required)',
				tooltip: 'The username of the user on whose talk page you left a message. Required.',
				value: prev_page,
				required: true
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
				label: 'Full page name (required)',
				tooltip: "The full page name where you left the message. For example: 'Wikipedia talk:Twinkle'. Required.",
				value: prev_page,
				required: true
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
				label: 'Full page name (required)',
				tooltip: "The full page name of where the discussion is being held. For example: 'Wikipedia talk:Twinkle'. Required.",
				value: prev_page,
				required: true
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

	$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
};

Twinkle.talkback.noticeboards = {
	'an': {
		label: "WP:AN (Administrators' noticeboard)",
		text: '== ' + Twinkle.getPref('adminNoticeHeading') + ' ==\n' +
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
		text: '== ' + Twinkle.getPref('adminNoticeHeading') + ' ==\n' +
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
	'effp': {
		label: 'WP:EFFP/R (Edit filter false positive report)',
		text: '{{EFFPReply|1=$SECTION|2=~~~~}}',
		editSummary: 'You have replies to your [[Wikipedia:Edit filter/False positives/Reports|edit filter false positive report]]'
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
	var input = Morebits.quickForm.getInputData(e.target);

	var fullUserTalkPageName = new mw.Title(mw.config.get('wgRelevantUserName'), 3).toText();
	var talkpage = new Morebits.wiki.page(fullUserTalkPageName, 'Adding talkback');

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = fullUserTalkPageName;
	Morebits.wiki.actionCompleted.notice = 'Talkback complete; reloading talk page in a few seconds';

	// Not used for notice or mail
	input.page = input.page || mw.config.get('wgUserName');

	switch (input.tbtarget) {
		case 'notice':
			talkpage.setEditSummary(Twinkle.talkback.noticeboards[input.noticeboard].editSummary);
			break;
		case 'mail':
			talkpage.setEditSummary("Notification: You've got mail");
			break;
		case 'see':
			talkpage.setEditSummary('Please check the discussion at [[:' + input.page +
			(input.section ? '#' + input.section : '') + ']]');
			break;
		default:  // tbtarget one of mytalk, usertalk, other
			var editSummary = 'Talkback ([[:';
			if (input.tbtarget !== 'other' && !/^\s*user talk:/i.test(input.page)) {
				editSummary += 'User talk:';
			}
			talkpage.setEditSummary(editSummary + input.page + (input.section ? '#' + input.section : '') + ']])');
	}

	talkpage.setAppendText('\n\n' + Twinkle.talkback.getNoticeWikitext(input));
	talkpage.setChangeTags(Twinkle.changeTags);
	talkpage.setCreateOption('recreate');
	talkpage.setMinorEdit(Twinkle.getPref('markTalkbackAsMinor'));
	talkpage.setFollowRedirect(true);
	talkpage.append();
};

Twinkle.talkback.preview = function(form) {
	var input = Morebits.quickForm.getInputData(form);

	if (input.tbtarget !== 'notice') {
		// usertalk, other, see
		input.page = input.page || mw.config.get('wgUserName');
	}

	var noticetext = Twinkle.talkback.getNoticeWikitext(input);
	form.previewer.beginRender(noticetext, 'User_talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
};

Twinkle.talkback.getNoticeWikitext = function(input) {
	var text;

	switch (input.tbtarget) {
		case 'notice':
			text = Morebits.string.safeReplace(Twinkle.talkback.noticeboards[input.noticeboard].text, '$SECTION', input.section);
			break;
		case 'mail':
			text =
				'==' + Twinkle.getPref('mailHeading') + '==\n' +
				"{{You've got mail|subject=" + input.section + '|ts=~~~~~}}';

			if (input.message) {
				text += '\n' + input.message + '  ~~~~';
			} else if (Twinkle.getPref('insertTalkbackSignature')) {
				text += '\n~~~~';
			}
			break;
		case 'see':
			text = '{{subst:Please see|location=' + input.page + (input.section ? '#' + input.section : '') + '|more=' + input.message + '}}';
			break;
		default:  // tbtarget one of mytalk, usertalk, other
			// clean talkback heading: strip section header markers that were erroneously suggested in the documentation
			text =
				'==' + Twinkle.getPref('talkbackHeading').replace(/^\s*=+\s*(.*?)\s*=+$\s*/, '$1') + '==\n' +
				'{{talkback|' + input.page + (input.section ? '|' + input.section : '') + '|ts=~~~~~}}';

			if (input.message) {
				text += '\n' + input.message + ' ~~~~';
			} else if (Twinkle.getPref('insertTalkbackSignature')) {
				text += '\n~~~~';
			}
	}
	return text;
};

Twinkle.addInitCallback(Twinkle.talkback, 'talkback');
})(jQuery);


// </nowiki>
