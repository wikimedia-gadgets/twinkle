// <nowiki>

(function() {

/*
 ****************************************
 *** twinkletalkback.js: Talkback module
 ****************************************
 * Mode of invocation:     Tab ("TB")
 * Active on:              Pages with a relevant user name (except IP ranges), and WikiProject talk pages
 */
const isWikiProjectTalkPage = function() {
	const title = (mw.config.get('wgTitle') || '').replace(/_/g, ' ');

	return mw.config.get('wgNamespaceNumber') === 5 &&
		/^WikiProject(?:[\s:]|$)/i.test(title);
};

Twinkle.talkback = function() {
	const relevantUserName = mw.config.get('wgRelevantUserName');

	if ((!relevantUserName || Morebits.ip.isRange(relevantUserName)) &&
		!isWikiProjectTalkPage()) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.talkback.callback, 'TB', 'twinkle-talkback', 'Easy talkback');
};

Twinkle.talkback.callback = function() {
	const onWikiProjectTalkPage = isWikiProjectTalkPage();
	if (!onWikiProjectTalkPage && mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') && !confirm("Is it really so bad that you're talking back to yourself?")) {
		return;
	}

	const Window = new Morebits.SimpleWindow(600, 350);
	Window.setTitle('Talkback');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Talkback prefs', 'WP:TW/PREF#talkback');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#talkback');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.talkback.evaluate);

	if (onWikiProjectTalkPage) {
		// The current page already determines the only valid notification type.
		// Store it as a hidden QuickForm field instead of showing a redundant radio.
		form.append({
			type: 'hidden',
			name: 'tbtarget',
			value: 'wikiproject'
		});
	} else {
		form.append({
			type: 'radio',
			name: 'tbtarget',
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
	}

	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});

	const previewlink = document.createElement('a');
	$(previewlink).on('click', () => {
		Twinkle.talkback.callbacks.preview(result); // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', id: 'talkbackpreview', label: [previewlink] });
	form.append({ type: 'div', id: 'twinkletalkback-previewbox', style: 'display: none' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.previewer = new Morebits.wiki.Preview($(result).find('div#twinkletalkback-previewbox').last()[0]);

	// Initialize the work area. WikiProject pages use a hidden tbtarget field,
	// so there is no radio-button change event to build their form automatically.
	if (onWikiProjectTalkPage) {
		Twinkle.talkback.renderTarget('wikiproject', result);
	} else {
		const evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		const selectedTarget = result.querySelector('input[name="tbtarget"]:checked') ||
			result.querySelector('input[name="tbtarget"]');
		if (selectedTarget) {
			selectedTarget.dispatchEvent(evt);
		}
	}

	// The opt-out preference applies to user-talk notifications, not WikiProject notices.
	const relevantUserName = mw.config.get('wgRelevantUserName');
	if (!onWikiProjectTalkPage && relevantUserName) {
		const query = {
			action: 'query',
			prop: 'extlinks',
			titles: 'User talk:' + relevantUserName,
			elquery: 'userjs.invalid/noTalkback',
			ellimit: '1',
			format: 'json'
		};
		const wpapi = new Morebits.wiki.Api('Fetching talkback opt-out status', query, Twinkle.talkback.callback.optoutStatus);
		wpapi.post();
	}
};

Twinkle.talkback.optout = '';

Twinkle.talkback.callback.optoutStatus = function(apiobj) {
	const response = apiobj.getResponse();
	const pages = response && response.query && response.query.pages;
	const page = Array.isArray(pages) ? pages[0] : pages && Object.values(pages)[0];
	const el = page && page.extlinks;
	Twinkle.talkback.optout = '';
	if (el && el.length) {
		Twinkle.talkback.optout = mw.config.get('wgRelevantUserName') + ' prefers not to receive talkbacks';
		const url = el[0].url;
		const reason = mw.util.getParamValue('reason', url);
		Twinkle.talkback.optout += reason ? ': ' + reason : '.';
	}
	$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
};

let prev_page = '';
let prev_section = '';
let prev_message = '';
let prev_wikiproject_page = '';
let prev_wikiproject_section = '';
let prev_wikiproject_message = '';
let previousTarget = '';

Twinkle.talkback.changeTarget = function(e) {
	Twinkle.talkback.renderTarget(e.target.values, e.target.form);
};

// Build the dynamic fields for a notification type. This is also called
// directly for WikiProject pages, where the notification type is fixed.
Twinkle.talkback.renderTarget = function(value, root) {
	const old_area = Morebits.QuickForm.getElements(root, 'work_area')[0];
	if (!old_area) {
		return;
	}

	// Preserve values for the form that is being replaced.
	const getField = (name) => root.elements.namedItem(name);
	if (previousTarget === 'wikiproject') {
		const pageField = getField('page');
		const sectionField = getField('section');
		const messageField = getField('message');
		if (pageField) {
			prev_wikiproject_page = pageField.value;
		}
		if (sectionField) {
			prev_wikiproject_section = sectionField.value;
		}
		if (messageField) {
			prev_wikiproject_message = messageField.value;
		}
	} else {
		const pageField = getField('page');
		const sectionField = getField('section');
		const messageField = getField('message');
		if (pageField) {
			prev_page = pageField.value;
		}
		if (sectionField) {
			prev_section = sectionField.value;
		}
		if (messageField) {
			prev_message = messageField.value;
		}
	}

	let work_area = new Morebits.QuickForm.Element({
		type: 'field',
		label: 'Talkback information',
		name: 'work_area'
	});

	if (root.previewer) {
		root.previewer.closePreview();
	}

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
				tooltip: "The page name where the discussion is being held. For example: 'User talk:Jimbo Wales' or 'Wikipedia talk:Twinkle'. Limited to talk pages, Wikipedia-space, and Template-space.",
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
						Morebits.QuickForm.overrideElementLabel(root.section, 'Title of draft (excluding the prefix): ');
						Morebits.QuickForm.setElementTooltipVisibility(root.section, false);
					} else {
						Morebits.QuickForm.resetElementLabel(root.section);
						Morebits.QuickForm.setElementTooltipVisibility(root.section, true);
					}
				}
			});

			$.each(Twinkle.talkback.noticeboards, (value, data) => {
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
		case 'wikiproject':
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'Page name of the discussion',
				tooltip: "The page name where the discussion is being held. For example: 'User talk:Jimbo Wales' or 'Wikipedia talk:Twinkle'. Limited to talk pages, Wikipedia-space, and Template-space.",
				value: prev_wikiproject_page,
				required: true
			});
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'Linked section (optional)',
				tooltip: "The section heading where the discussion is being held. For example: 'Merge proposal'.",
				value: prev_wikiproject_section
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
		work_area.append({
			type: 'textarea',
			label: 'Additional message (optional):',
			name: 'message',
			tooltip: value === 'wikiproject' ?
				'Optional additional context for the WikiProject invitation. The template automatically adds your signature; do not add one here.' :
				'An additional message that you would like to leave below the talkback template. Your signature will be added to the end of the message if you leave one.'
		});
	}

	work_area = work_area.render();
	root.replaceChild(work_area, old_area);
	const messageField = root.elements.namedItem('message');
	if (messageField) {
		messageField.value = value === 'wikiproject' ? prev_wikiproject_message : prev_message;
	}

	previousTarget = value;
	$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
};

Twinkle.talkback.noticeboards = {
	ae: {
		label: 'WP:AE (Arbitration/Requests/Enforcement)',
		text: '{{subst:AE-notice|$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:Arbitration/Requests/Enforcement]]'
	},
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
		text: '== Your question at the Help desk ==\n{{helpdeskreply|1=$SECTION|ts=~~~~~}}',
		editSummary: 'You have replies at the [[Wikipedia:Help desk|Wikipedia help desk]]'
	},
	norn: {
		label: 'WP:NORN (No original research noticeboard)',
		text: '{{subst:Norn-notice|thread=$SECTION}} ~~~~',
		editSummary: 'Notice of discussion at [[Wikipedia:No original research/Noticeboard]]'
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
		label: 'WP:TH (Teahouse)',
		text: "== Teahouse talkback: you've got messages! ==\n{{WP:Teahouse/Teahouse talkback|WP:Teahouse|$SECTION|ts=~~~~}}",
		editSummary: 'You have replies at the [[Wikipedia:Teahouse|Teahouse question board]]'
	},
	vrt: {
		label: 'WP:VRTN (VRT noticeboard)',
		text: '{{subst:VRTreply|1=$SECTION}}\n~~~~',
		editSummary: 'You have replies at the [[Wikipedia:VRT noticeboard|VRT noticeboard]]'
	}
};

Twinkle.talkback.evaluate = function(e) {
	const input = Morebits.QuickForm.getInputData(e.target);
	const isWikiProjectNotification = input.tbtarget === 'wikiproject';
	let destinationPageName;

	if (isWikiProjectNotification) {
		destinationPageName = Twinkle.talkback.callbacks.getCurrentWikiProjectTalkPage();
		// Read the visible controls directly as well as QuickForm's collected data.
		// This keeps the separate section field even if it is omitted from input data.
		input.page = Twinkle.talkback.callbacks.getWikiProjectDiscussionLocation(e.target, input);
		if (!destinationPageName) {
			Morebits.Status.init(e.target);
			new Morebits.Status('Invalid destination', 'WikiProject please see can only be posted from a WikiProject talk page.', 'error');
			return;
		}
		if (!input.page) {
			Morebits.Status.init(e.target);
			new Morebits.Status('Invalid discussion page', 'Enter a valid discussion page title.', 'error');
			return;
		}
	} else {
		const relevantUserName = mw.config.get('wgRelevantUserName');
		if (!relevantUserName || Morebits.ip.isRange(relevantUserName)) {
			Morebits.Status.init(e.target);
			new Morebits.Status('Invalid recipient', 'A user-talk recipient could not be determined for this notification.', 'error');
			return;
		}
		destinationPageName = new mw.Title(relevantUserName, 3).toText();
	}

	const talkpage = new Morebits.wiki.Page(destinationPageName, 'Adding talkback');

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = destinationPageName;
	Morebits.wiki.actionCompleted.notice = isWikiProjectNotification ?
		'WikiProject notification complete; reloading talk page in a few seconds' :
		'Talkback complete; reloading talk page in a few seconds';

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
		case 'wikiproject':
			talkpage.setEditSummary('Invite to [[:' + input.page + '|discussion]]');
			break;
		default: // talkback
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
			talkpage.setEditSummary('Talkback ([[:' + input.page +
			(input.section ? '#' + input.section : '') + ']])');
			break;
	}

	talkpage.setFollowRedirect(true);

	talkpage.load((pageobj) => {
		const whitespaceToPrepend = pageobj.exists() && pageobj.getPageText() !== '' ? '\n\n' : '';
		talkpage.setAppendText(whitespaceToPrepend + Twinkle.talkback.callbacks.getNoticeWikitext(input));
		talkpage.setChangeTags(Twinkle.changeTags);
		talkpage.setCreateOption('recreate');
		talkpage.setMinorEdit(Twinkle.getPref('markTalkbackAsMinor'));
		talkpage.append();
	});
};

Twinkle.talkback.callbacks = {
	// Normalize the discussion page used by ordinary user-talk notifications.
	normalizeTalkbackPage: function(page) {
		page = page || mw.config.get('wgUserName');

		// Assume no prefix is a username, convert to user talk space
		let normal = mw.Title.newFromText(page, 3);
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

	getCurrentWikiProjectTalkPage: function() {
		if (!isWikiProjectTalkPage()) {
			return null;
		}
		const title = mw.Title.newFromText(mw.config.get('wgPageName'));
		return title && title.namespace === 5 ? title.getPrefixedText() : null;
	},

	getWikiProjectDiscussionLocation: function(form, input) {
		// Read the live controls so page and section are combined identically
		// for preview and submission. Fall back to collected data if needed.
		const pageField = form && form.elements && form.elements.namedItem('page');
		const sectionField = form && form.elements && form.elements.namedItem('section');
		const page = pageField ? pageField.value : input.page;
		const section = sectionField ? sectionField.value : input.section;
		return Twinkle.talkback.callbacks.normalizeWikiProjectDiscussionPage(page, section);
	},

	normalizeWikiProjectDiscussionPage: function(page, section) {
		if (typeof page !== 'string' || !page.trim()) {
			return null;
		}
		page = page.trim();

		// Split a section fragment from the page title before passing it to mw.Title.
		// If both fields are filled, an explicit #fragment in the page field wins.
		const fragmentIndex = page.indexOf('#');
		const pageTitle = fragmentIndex === -1 ? page : page.slice(0, fragmentIndex).trim();
		const inlineSection = fragmentIndex === -1 ? '' : page.slice(fragmentIndex + 1).trim();
		if (!pageTitle) {
			return null;
		}

		// The default namespace is Talk (1), so entering 'Cats' becomes 'Talk:Cats'.
		let normal;
		try {
			normal = mw.Title.newFromText(pageTitle, 1);
		} catch {
			return null;
		}
		if (!normal || normal.namespace < 0 || !normal.getPrefixedText()) {
			return null;
		}

		// Match the normal Talkback convention: bare article titles become talk
		// pages, while explicit talk pages, Wikipedia pages and templates are kept.
		if (normal.namespace !== 4 && normal.namespace !== 10 && normal.namespace % 2 === 0) {
			normal = normal.getTalkPage();
		}
		if (!normal) {
			return null;
		}

		const separateSection = typeof section === 'string' ? section.trim().replace(/^#+/, '') : '';
		const sectionText = inlineSection || separateSection;
		return normal.getPrefixedText() + (sectionText ? '#' + sectionText : '');
	},

	preview: function(form) {
		const input = Morebits.QuickForm.getInputData(form);
		let previewPage = 'User talk:' + mw.config.get('wgRelevantUserName'); // Use a talk-page context for user notifications

		if (input.tbtarget === 'wikiproject') {
			input.page = Twinkle.talkback.callbacks.getWikiProjectDiscussionLocation(form, input);
			if (!input.page) {
				form.previewer.closePreview();
				return;
			}
			previewPage = Twinkle.talkback.callbacks.getCurrentWikiProjectTalkPage() || mw.config.get('wgPageName');
		} else if (input.tbtarget === 'talkback' || input.tbtarget === 'see') {
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
		}

		const noticetext = Twinkle.talkback.callbacks.getNoticeWikitext(input);
		form.previewer.beginRender(noticetext, previewPage);
	},

	getNoticeWikitext: function(input) {
		let text;

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
			case 'wikiproject':
				text = '{{subst:WikiProject please see|location=' + input.page +
				(input.message ? '|more=' + input.message : '') + '}}';
				break;
			default: // talkback
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
}());

// </nowiki>
