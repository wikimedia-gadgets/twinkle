// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlytalkback.js: Talkback module
 ****************************************
 * Mode of invocation:     Tab ("TB")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.) except IP ranges
 * Config directives in:   FriendlyConfig
 */

Twinkle.talkback = function() {
	if (!mw.config.exists('wgRelevantUserName') || Morebits.ip.isRange(mw.config.get('wgRelevantUserName'))) {
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
	Window.addFooterLink('Talkback prefs', 'WP:TW/PREF#talkback');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#talkback');
	Window.addFooterLink('Give feedback', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.talkback.evaluate);

	form.append({ type: 'radio', name: 'tbtarget',
		list: [
			{
				label: 'Talkback',
				value: 'talkback',
				checked: 'true'
			},
			{
				label: 'Please see',
				value: 'see'
			},
			{
				label: 'Noticeboard notification',
				value: 'notice'
			},
			{
				label: "You've got mail",
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
		Twinkle.talkback.callbacks.preview(result);  // |result| is defined below
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
		ellimit: '1',
		format: 'json'
	};
	var wpapi = new Morebits.wiki.api('Fetching talkback opt-out status', query, Twinkle.talkback.callback.optoutStatus);
	wpapi.post();
};

Twinkle.talkback.optout = '';

Twinkle.talkback.callback.optoutStatus = function(apiobj) {
	var el = apiobj.getResponse().query.pages[0].extlinks;
	if (el && el.length) {
		Twinkle.talkback.optout = mw.config.get('wgRelevantUserName') + ' prefers not to receive talkbacks';
		var url = el[0].url;
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
		case 'talkback':
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
				name: 'page',
				label: 'Page name of the discussion',
				tooltip: "The page name where the discussion is being held. For example: 'User talk:Jimbo Wales' or Wikipedia talk:Twinkle'. Limited to all talks, Wikipedia-space, and Template-space.",
				value: prev_page || 'User talk:' + mw.config.get('wgUserName')
			});
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Linked section (optional)',
				tooltip: "The section heading where the discussion is being held. For example: 'Merge proposal'.",
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
						Morebits.quickForm.overrideElementLabel(root.section, 'Title of draft (excluding the prefix): ');
						Morebits.quickForm.setElementTooltipVisibility(root.section, false);
					} else {
						Morebits.quickForm.resetElementLabel(root.section);
						Morebits.quickForm.setElementTooltipVisibility(root.section, true);
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
		case 'mail':
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Subject of email (optional)',
				tooltip: 'The subject line of the email you sent.'
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
	an: {
		label: "WP:AN (Administrators' noticeboard)",
		text: '{{subst:AN-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Administrators\' noticeboard]]'
	},
	an3: {
		label: "WP:AN3 (Administrators' noticeboard/Edit warring)",
		text: '{{subst:An3-notice|$SECTION}} ~~~~',
		editSummary: "Notice of discussion at [[Wikipedia:Administrators' noticeboard/Edit warring]]"
	},
	ani: {
		label: "WP:ANI (Administrators' noticeboard/Incidents)",
		text: "== Notice of Administrators' noticeboard/Incidents discussion ==\n" +
		'{{subst:ANI-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Administrators\' noticeboard/Incidents]]',
		defaultSelected: true
	},
	// let's keep AN and its cousins at the top
	afchd: {
		label: 'WP:AFCHD (Articles for creation/Help desk)',
		text: '{{subst:AFCHD/u|$SECTION}} ~~~~',
		editSummary: 'You have replies at the [[Wikipedia:AFCHD|Articles for Creation Help Desk]]'
	},
	blpn: {
		label: 'WP:BLPN (Biographies of living persons noticeboard)',
		text: '{{subst:BLPN-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Biographies of living persons/Noticeboard]]'
	},
	coin: {
		label: 'WP:COIN (Conflict of interest noticeboard)',
		text: '{{subst:Coin-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Conflict of interest/Noticeboard]]'
	},
	drn: {
		label: 'WP:DRN (Dispute resolution noticeboard)',
		text: '{{subst:DRN-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Dispute resolution noticeboard]]'
	},
	effp: {
		label: 'WP:EFFP/R (Edit filter false positive report)',
		text: '{{EFFPReply|1=$SECTION|2=~~~~}}',
		editSummary: 'You have replies to your [[Wikipedia:Edit filter/False positives/Reports|edit filter false positive report]]'
	},
	eln: {
		label: 'WP:ELN (External links noticeboard)',
		text: '{{subst:ELN-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:External links/Noticeboard]]'
	},
	ftn: {
		label: 'WP:FTN (Fringe theories noticeboard)',
		text: '{{subst:Ftn-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Fringe theories/Noticeboard]]'
	},
	hd: {
		label: 'WP:HD (Help desk)',
		text: '== Your question at the Help desk ==\n' + '{{helpdeskreply|1=$SECTION|ts=~~~~~}}',
		editSummary: 'You have replies at the [[Wikipedia:Help desk|Wikipedia help desk]]'
	},
	norn: {
		label: 'WP:NORN (Reliable sources noticeboard)',
		text: '{{subst:Norn-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Reliable sources/Noticeboard]]'
	},
	npovn: {
		label: 'WP:NPOVN (Neutral point of view noticeboard)',
		text: '{{subst:NPOVN-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Neutral point of view/Noticeboard]]'
	},
	rsn: {
		label: 'WP:RSN (Reliable sources noticeboard)',
		text: '{{subst:RSN-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Reliable sources/Noticeboard]]'
	},
	th: {
		label: 'WP:THQ (Teahouse question forum)',
		text: "== Teahouse talkback: you've got messages! ==\n{{WP:Teahouse/Teahouse talkback|WP:Teahouse/Questions|$SECTION|ts=~~~~}}",
		editSummary: 'You have replies at the [[Wikipedia:Teahouse/Questions|Teahouse question board]]'
	},
	otrs: {
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

	switch (input.tbtarget) {
		case 'notice':
			talkpage.setEditSummary(Twinkle.talkback.noticeboards[input.noticeboard].editSummary);
			break;
		case 'mail':
			talkpage.setEditSummary("Notification: You've got mail");
			break;
		case 'see':
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
			talkpage.setEditSummary('Please check the discussion at [[:' + input.page +
			(input.section ? '#' + input.section : '') + ']]');
			break;
		default:  // talkback
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
			talkpage.setEditSummary('Talkback ([[:' + input.page +
			(input.section ? '#' + input.section : '') + ']])');
			break;
	}

	talkpage.setAppendText('\n\n' + Twinkle.talkback.callbacks.getNoticeWikitext(input));
	talkpage.setChangeTags(Twinkle.changeTags);
	talkpage.setCreateOption('recreate');
	talkpage.setMinorEdit(Twinkle.getPref('markTalkbackAsMinor'));
	talkpage.setFollowRedirect(true);
	talkpage.append();
};

Twinkle.talkback.callbacks = {
	// Not used for notice or mail, default to user page
	normalizeTalkbackPage: function(page) {
		page = page || mw.config.get('wgUserName');

		// Assume no prefix is a username, convert to user talk space
		var normal = mw.Title.newFromText(page, 3);
		// Normalize erroneous or likely mis-entered items
		if (normal) {
			// Only allow talks and WPspace, as well as Template-space for DYK
			if (normal.namespace !== 4 && normal.namespace !== 10) {
				normal = normal.getTalkPage();
			}
			page = normal.getPrefixedText();
		}
		return page;
	},

	preview: function(form) {
		var input = Morebits.quickForm.getInputData(form);

		if (input.tbtarget === 'talkback' || input.tbtarget === 'see') {
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
		}

		var noticetext = Twinkle.talkback.callbacks.getNoticeWikitext(input);
		form.previewer.beginRender(noticetext, 'User talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
	},

	getNoticeWikitext: function(input) {
		var text;

		switch (input.tbtarget) {
			case 'notice':
				text = Morebits.string.safeReplace(Twinkle.talkback.noticeboards[input.noticeboard].text, '$SECTION', input.section);
				break;
			case 'mail':
				text = '==' + Twinkle.getPref('mailHeading') + '==\n' +
					"{{You've got mail|subject=" + input.section + '|ts=~~~~~}}';

				if (input.message) {
					text += '\n' + input.message + '  ~~~~';
				} else if (Twinkle.getPref('insertTalkbackSignature')) {
					text += '\n~~~~';
				}
				break;
			case 'see':
				var heading = Twinkle.getPref('talkbackHeading');
				text = '{{subst:Please see|location=' + input.page + (input.section ? '#' + input.section : '') +
				'|more=' + input.message + '|heading=' + heading + '}}';
				break;
			default:  // talkback
				text = '==' + Twinkle.getPref('talkbackHeading') + '==\n' +
					'{{talkback|' + input.page + (input.section ? '|' + input.section : '') + '|ts=~~~~~}}';

				if (input.message) {
					text += '\n' + input.message + ' ~~~~';
				} else if (Twinkle.getPref('insertTalkbackSignature')) {
					text += '\n~~~~';
				}
		}
		return text;
	}
};
Twinkle.addInitCallback(Twinkle.talkback, 'talkback');
})(jQuery);


// </nowiki>
