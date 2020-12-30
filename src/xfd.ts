const {obj_entries, arr_includes} = Twinkle.shims;

class Xfd extends TwinkleModule {
	mode: XfdMode
	static modeList: (typeof XfdMode)[]

	Window: Morebits.simpleWindow;
	fieldset: Morebits.quickForm.element;
	result: HTMLFormElement;

	constructor() {
		super();
		for (let mode of Xfd.modeList) {
			if (mode.isDefaultChoice()) {
				// @ts-ignore
				this.mode = new mode();
				break;
			}
		}
		this.portletName = 'XFD';
		this.portletId = 'twinkle-xfd';
		this.portletTooltip = this.getMenuTooltip();
		this.addMenu();
	}

	getMenuTooltip() {
		if (this.mode) {
			return this.mode.getMenuTooltip();
		} else {
			return 'Start a deletion discussion';
		}
	}

	makeWindow = () => {
		var Window = new Morebits.simpleWindow(700, 400);
		Window.setTitle('Start a deletion discussion (XfD)');
		Window.setScriptName('Twinkle');
		Window.addFooterLink('About deletion discussions', 'WP:XFD');
		Window.addFooterLink('XfD prefs', 'WP:TW/PREF#xfd');
		Window.addFooterLink('Twinkle help', 'WP:TW/DOC#xfd');
		this.makeForm(Window);
	}

	// invoked only once
	makeForm(Window) {
		this.Window = Window;
		let form = new Morebits.quickForm(() => { this.mode.evaluate(); });

		form.append({
			type: 'select',
			name: 'venue',
			label: 'Deletion discussion venue:',
			tooltip: 'When activated, a default choice is made, based on what namespace you are in. This default should be the most appropriate.',
			event: this.onCategoryChange.bind(this),
			list: Xfd.modeList.map((mode) => ({
				type: 'option',
				label: mode.venueLabel,
				selected: this.mode instanceof mode,
				value: mode.venueCode
			}))
		});

		form.append({
			type: 'div',
			id: 'wrong-venue-warn',
			style: 'color: red; font-style: italic'
		});

		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Notify page creator if possible',
					value: 'notify',
					name: 'notifycreator',
					tooltip: "A notification template will be placed on the creator's talk page if this is true.",
					checked: true
				}
			]
		});

		this.fieldset = form.append({
			type: 'field',
			label: 'Work area',
			name: 'work_area'
		});

		var previewlink = document.createElement('a');
		$(previewlink).click(() => {
			this.mode.preview(this.result);  // |result| is defined below
		});
		previewlink.style.cursor = 'pointer';
		previewlink.textContent = 'Preview';
		form.append({ type: 'div', id: 'xfdpreview', label: [ previewlink ] });
		form.append({ type: 'div', id: 'twinklexfd-previewbox', style: 'display: none' });

		form.append({ type: 'submit' });

		this.result = form.render();
		Window.setContent(this.result);
		Window.display();
		this.result.previewer = new Morebits.wiki.preview(document.getElementById('twinklexfd-previewbox'));

		// We must init the controls
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		this.result.venue.dispatchEvent(evt);

		return form;
	}

	// invoked on every mode change
	onCategoryChange(evt) {
		var venueCode = evt.target.value;
		var form = evt.target.form;

		let mode = Xfd.modeList.filter((mode) => {
			return mode.venueCode === venueCode;
		})[0];
		if (!mode) {
			throw new Error('Unrecognized venue: ' +  venueCode); // should never happen
		}
		// @ts-ignore
		this.mode = new mode();
		this.mode.result = this.result;
		this.mode.Window = this.Window;

		$('#wrong-venue-warn').text(this.mode.getVenueWarning() || '');
		form.previewer.closePreview();

		let renderedFieldset = this.mode.generateFieldset().render();
		$(this.result).find('fieldset[name=work_area]')
			.replaceWith(renderedFieldset);
		this.mode.postRender(renderedFieldset as HTMLFieldSetElement);
	}
}


abstract class XfdMode {
	static venueCode: string
	static venueLabel: string

	// must be overridden, unless the venue is never the default choice
	static isDefaultChoice(): boolean {
		return false;
	}

	Window: Morebits.simpleWindow
	fieldset: Morebits.quickForm.element
	result: HTMLFormElement
	params: Record<string, any>
	tm: Morebits.taskManager

	/**
	 * Used in determineDiscussionPage(), applicable only if in the XfD process, each page is
	 * discussed on a separate page (like AfD and MfD). Otherwise this can be skipped.
	 */
	discussionPagePrefix: string;

	getMenuTooltip(): string {
		return 'Nominate page for deletion';
	}

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = new Morebits.quickForm.element({
			type: 'field',
			label: this.getFieldsetLabel(),
			name: 'work_area'
		});
		return this.fieldset;
	}
	appendReasonArea() {
		this.fieldset.append({
			type: 'textarea',
			name: 'reason',
			label: 'Reason: ',
			value: $(this.result).find('textarea').val() as string || '',
			tooltip: 'You can use wikimarkup in your reason. Twinkle will automatically sign your post.'
		});
	}

	// Used as the label for the fieldset in the UI, and in the default notification edit summary
	abstract getFieldsetLabel()

	postRender(renderedFieldset: HTMLFieldSetElement) {}

	getVenueWarning(): string | void {}

	// Overridden for tfd, cfd, cfds
	/**
	 * Pre-process parameters, called from evaluate() and preview().
	 */
	preprocessParams(): void {}

	// Overridden for ffd and rfd, which need special treatment
	preview(form: HTMLFormElement) {
		this.params = Morebits.quickForm.getInputData(form);
		this.preprocessParams();
		this.showPreview(form);
	}

	// This is good enough to use without override for all venues except rm
	showPreview(form: HTMLFormElement) {
		let templatetext = this.getDiscussionWikitext();
		form.previewer.beginRender(templatetext, 'WP:TW'); // Force wikitext
	}

	abstract getDiscussionWikitext(): string

	evaluate(): void {
		this.params = Morebits.quickForm.getInputData(this.result);
		this.preprocessParams();
		if (!this.validateInput()) {
			return;
		}
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(this.result);

		this.tm = new Morebits.taskManager(this);
	}

	/**
	 * Hook for form validation. If this returns false, form submission is aborted
	 */
	validateInput(): boolean {
		return true;
	}

	/**
	 * Print reason text if we fail to post the reason to the designated place on the wiki, so that
	 * the user can reuse the text.
	 * Should be invoked as a onFailure method in Morebits.taskManager.
	 * This function shouldn't need to be overridden.
	 */
	printReasonText() {
		Morebits.status.printUserText(this.params.reason, 'Your deletion rationale is provided below, which you can copy and paste into a new XFD dialog if you wish to try again:');
	}

	/**
	 * Callback to redirect to the discussion page when everything is done. Relies on the discussion page
	 * being known as either `this.params.discussionpage` or `this.params.logpage`.
	 */
	redirectToDiscussion() {
		let redirPage = this.params.discussionpage || this.params.logpage;
		Morebits.status.actionCompleted("Nomination complete, now redirecting to the discussion page");
		setTimeout(() => {
			window.location.href = mw.util.getUrl(redirPage);
		}, Morebits.wiki.actionCompleted.timeOut);
	}

	/**
	 * Only applicable for XFD processes that use separate discussion pages for every page.
	 */
	determineDiscussionPage() {
		let params = this.params;
		let wikipedia_api = new Morebits.wiki.api('Looking for prior nominations of this page', {
			'action': 'query',
			'list': 'allpages',
			'apprefix': new mw.Title(this.discussionPagePrefix).getMain() + '/' + Morebits.pageNameNorm,
			'apnamespace': 4,
			'apfilterredir': 'nonredirects',
			'aplimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'format': 'json'
		});
		return wikipedia_api.post().then((apiobj) => {
			var response = apiobj.getResponse();
			var titles = response.query.allpages;

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				params.numbering = params.number = '';
			} else {
				var number = 0;
				var order_re = new RegExp('^' +
					Morebits.string.escapeRegExp(this.discussionPagePrefix + '/' + Morebits.pageNameNorm) +
					'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].title;

					// First, simple test, is there an instance with this exact name?
					if (title === this.discussionPagePrefix + '/' + Morebits.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				params.number = utils.num2order(number + 1);
				params.numbering = number > 0 ? ' (' + params.number + ' nomination)' : '';
			}
			params.discussionpage = this.discussionPagePrefix + '/' + Morebits.pageNameNorm + params.numbering;

			apiobj.getStatusElement().info('next in order is ' + params.discussionpage);
		});
	}

	autoEditRequest(pageobj) {
		let params = this.params;

		var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
		if (talkName === pageobj.getPageName()) {
			pageobj.getStatusElement().error('Page protected and nowhere to add an edit request, aborting');
			return $.Deferred().reject();
		}
		pageobj.getStatusElement().warn('Page protected, requesting edit');

		var editRequest = '{{subst:Xfd edit protected|page=' + pageobj.getPageName() +
			'|discussion=' + params.discussionpage + '|tag=<no' + 'wiki>' + params.tagText + '<no' + 'wiki>}}';

		var talk_page = new Twinkle.page(talkName, 'Automatically posting edit request on talk page');
		talk_page.setNewSectionTitle('Edit request to complete ' + utils.toTLACase(params.venue) + ' nomination');
		talk_page.setNewSectionText(editRequest);
		talk_page.setCreateOption('recreate');
		talk_page.setWatchlist(Twinkle.getPref('xfdWatchPage'));
		talk_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect

		return talk_page.newSection().catch(function() {
			talk_page.getStatusElement().warn('Unable to add edit request, the talk page may be protected');
			return $.Deferred().reject();
		});

	}

	fetchCreatorInfo() {

		let thispage = new Twinkle.page(Morebits.pageNameNorm, 'Finding page creator');
		thispage.setLookupNonRedirectCreator(this.params.lookupNonRedirectCreator);
		return thispage.lookupCreation().then((pageobj) => {
			this.params.initialContrib = pageobj.getCreator();
			pageobj.getStatusElement().info('Found ' + pageobj.getCreator());
		});

	}

	notifyTalkPage(notifyTarget: string, statusElement?: Morebits.status): JQuery.Promise<void> {
		// Ensure items with User talk or no namespace prefix both end
		// up at user talkspace as expected, but retain the
		// prefix-less username for addToLog
		let params = this.params;

		var notifyTitle = mw.Title.newFromText(notifyTarget, 3); // 3: user talk
		var targetNS = notifyTitle.getNamespaceId();
		var usernameOrTarget = notifyTitle.getRelativeText(3);
		statusElement = statusElement || new Morebits.status('Notifying initial contributor (' + usernameOrTarget + ')');

		let notifyPageTitle = notifyTitle.toText();
		if (targetNS === 3) {
			// Disallow warning yourself
			if (usernameOrTarget === mw.config.get('wgUserName')) {
				params.initialContrib = null; // disable initial contributor logging in userspace log
				statusElement.warn('You (' + usernameOrTarget + ') created this page; skipping user notification');
				return $.Deferred().resolve();
			}
		}

		var usertalkpage = new Twinkle.page(notifyPageTitle, statusElement);
		usertalkpage.setAppendText('\n\n' + this.getNotifyText());
		usertalkpage.setEditSummary(this.getNotifyEditSummary());
		usertalkpage.setCreateOption('recreate');
		// Different pref for RfD target notifications: XXX: handle this better!
		if (params.venue === 'rfd' && targetNS !== 3) {
			usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchRelated'));
		} else {
			usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchUser'));
		}
		usertalkpage.setFollowRedirect(true, false);
		return usertalkpage.append().catch(() => {
			// if user could not be notified, null this out for correct userspace logging,
			// but don't reject the promise
			params.initialContrib = null;
		});

	}

	// Overridden for all venues except FFD and RFD
	getNotifyText(): string {
		return `{{subst:${this.params.venue} notice|1=${Morebits.pageNameNorm}}} ~~~~`;
	}

	// Not overridden for any venue
	getNotifyEditSummary(): string {
		return 'Notification: [[' + this.params.discussionpage + '|listing]] of [[:' +
		Morebits.pageNameNorm + ']] at [[WP:' + this.getFieldsetLabel() + ']].';
	}

	notifyCreator(): JQuery.Promise<void> {
		if (!this.params.notifycreator) {
			this.params.intialContrib = null;
			return $.Deferred().resolve();
		}
		return this.notifyTalkPage(this.params.initialContrib);
	}

	// Should be called after notifyTalkPage() which may unset this.params.intialContrib
	addToLog() {
		let params = this.params;

		if (!Twinkle.getPref('logXfdNominations') ||
			Twinkle.getPref('noLogOnXfdNomination').indexOf(params.venue) !== -1) {
			return $.Deferred().resolve();
		}

		var usl = new Morebits.userspaceLogger(Twinkle.getPref('xfdLogPageName'));// , 'Adding entry to userspace log');

		usl.initialText =
			"This is a log of all [[WP:XFD|deletion discussion]] nominations made by this user using [[WP:TW|Twinkle]]'s XfD module.\n\n" +
			'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
			'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
			(Morebits.userIsSysop ? '\n\nThis log does not track XfD-related deletions made using Twinkle.' : '');

		usl.changeTags = Twinkle.changeTags;
		return usl.log(this.getUserspaceLoggingText(), this.getUserspaceLoggingEditSummary());
	}

	getUserspaceLoggingEditSummary() {
		return 'Logging ' + utils.toTLACase(this.params.venue) + ' nomination of [[:' + Morebits.pageNameNorm + ']].';
	}

	getUserspaceLoggingText(): string {
		let params = this.params;

		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';
		// CFD/S and RM don't have canonical links
		var nominatedLink = params.discussionpage ? '[[' + params.discussionpage + '|nominated]]' : 'nominated';

		var appendText = '# [[:' + Morebits.pageNameNorm + ']]:' + fileLogLink + ' ' + nominatedLink + ' at [[WP:' + params.venue.toUpperCase() + '|' + utils.toTLACase(params.venue) + ']]';

		appendText += this.getUserspaceLoggingExtraInfo();

		if (params.initialContrib && params.notifycreator) {
			appendText += '; notified {{user|1=' + params.initialContrib + '}}';
		}
		appendText += ' ~~~~~';
		if (params.reason) {
			appendText += "\n#* '''Reason''': " + Morebits.string.formatReasonForLog(params.reason);
		}
		return appendText;
	}

	getUserspaceLoggingExtraInfo() {
		return '';
	}

}

class Afd extends XfdMode {
	static venueCode = 'afd';
	static venueLabel = 'AfD (Articles for deletion)';

	static isDefaultChoice() {
		return mw.config.get('wgNamespaceNumber') === 0 && !Morebits.isPageRedirect();
	}

	discussionPagePrefix = 'Wikipedia:Articles for deletion';

	getFieldsetLabel() {
		return 'Articles for deletion';
	}

	getVenueWarning() {
		if (mw.config.get('wgNamespaceNumber') !== 0) {
			return 'AfD is generally appropriate only for articles.';
		} else if (mw.config.get('wgIsRedirect')) {
			return 'Please use RfD for redirects.';
		}
	}

	getMenuTooltip() {
		return 'Nominate article for deletion or move';
	}

	generateFieldset() {
		this.fieldset = super.generateFieldset();
		this.fieldset.append({
			type: 'div',
			label: Twinkle.makeFindSourcesDiv(),
			style: 'margin-bottom: 5px;'
		});

		this.fieldset.append({
			type: 'checkbox',
			list: [
				{
					label: 'Wrap deletion tag with <noinclude>',
					value: 'noinclude',
					name: 'noinclude',
					tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t transclude. This option is not normally required.'
				}
			]
		});
		this.fieldset.append({
			type: 'select',
			name: 'xfdcat',
			label: 'Choose what category this nomination belongs in:',
			list: [
				{ type: 'option', label: 'Unknown', value: '?', selected: true },
				{ type: 'option', label: 'Media and music', value: 'M' },
				{ type: 'option', label: 'Organisation, corporation, or product', value: 'O' },
				{ type: 'option', label: 'Biographical', value: 'B' },
				{ type: 'option', label: 'Society topics', value: 'S' },
				{ type: 'option', label: 'Web or internet', value: 'W' },
				{ type: 'option', label: 'Games or sports', value: 'G' },
				{ type: 'option', label: 'Science and technology', value: 'T' },
				{ type: 'option', label: 'Fiction and the arts', value: 'F' },
				{ type: 'option', label: 'Places and transportation', value: 'P' },
				{ type: 'option', label: 'Indiscernible or unclassifiable topic', value: 'I' },
				{ type: 'option', label: 'Debate not yet sorted', value: 'U' }
			]
		});

		// delsort categories taken from [[WP:DS/C]], inspired by off [[User:Enterprisey/delsort.js]]
		var delsortCategories = {
			'People': ['People', 'Academics and educators', 'Actors and filmmakers', 'Artists', 'Authors', 'Bands and musicians', 'Businesspeople', 'Politicians', 'Sportspeople', 'Women', 'Lists of people'],
			'Arts': ['Arts', 'Fictional elements', 'Science fiction and fantasy'],
			'Arts/Culinary': ['Food and drink', 'Wine'],
			'Arts/Language': ['Language', 'Academic journals', 'Bibliographies', 'Journalism', 'Literature', 'Logic', 'News media', 'Philosophy', 'Poetry'],
			'Arts/Performing': ['Albums and songs', 'Dance', 'Film', 'Magic', 'Music', 'Radio', 'Television', 'Theatre', 'Video games'],
			'Arts/Visual arts': ['Visual arts', 'Architecture', 'Fashion', 'Photography'],
			'Arts/Comics and animation': ['Comics and animation', 'Anime and manga', 'Webcomics'],
			'Places of interest': ['Museums and libraries', 'Shopping malls'],
			'Topical': ['Animal', 'Bilateral relations', 'Conservatism', 'Conspiracy theories', 'Crime', 'Disability', 'Discrimination', 'Entertainment', 'Ethnic groups', 'Events', 'Finance', 'Games', 'Health and fitness', 'History', 'Law', 'Military', 'Organizations', 'Paranormal', 'Piracy', 'Politics', 'Terrorism'],
			'Topical/Business': ['Business', 'Advertising', 'Companies', 'Management', 'Products'],
			'Topical/Culture': ['Beauty pageants', 'Fashion', 'Mythology', 'Popular culture', 'Sexuality and gender'],
			'Topical/Education': ['Education', 'Fraternities and sororities', 'Schools'],
			'Topical/Religion': ['Religion', 'Atheism', 'Bible', 'Buddhism', 'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Paganism', 'Sikhism', 'Spirituality'],
			'Topical/Science': ['Science', 'Archaeology', 'Astronomy', 'Behavioural science', 'Biology', 'Economics', 'Engineering', 'Environment', 'Geography', 'Mathematics', 'Medicine', 'Organisms', 'Psychiatry', 'Psychology', 'Social science'],
			'Topical/Sports': ['Sports', 'American football', 'Baseball', 'Basketball', 'Bodybuilding', 'Boxing', 'Cricket', 'Cycling', 'Football', 'Golf', 'Handball', 'Horse racing', 'Ice hockey', 'Motorsport', 'Rugby union', 'Softball', 'Martial arts', 'Wrestling'],
			'Topical/Technology': ['Technology', 'Aviation', 'Computing', 'Firearms', 'Internet', 'Software', 'Transportation', 'Websites'],
			'Wikipedia page type': ['Disambiguations', 'Lists'],
			'Geographic/Africa': ['Africa', 'Algeria', 'Democratic Republic of the Congo', 'Egypt', 'Ethiopia', 'Ghana', 'Kenya', 'Libya', 'Mauritius', 'Morocco', 'Nigeria', 'Somalia', 'South Africa', 'Zimbabwe'],
			'Geographic/Asia': ['Asia', 'Afghanistan', 'Bangladesh', 'Brunei', 'Cambodia', 'China', 'Hong Kong', 'Indonesia', 'Japan', 'Korea', 'Laos', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'Pakistan', 'Philippines', 'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan', 'Thailand', 'Vietnam'],
			'Geographic/Asia/Central Asia': ['Central Asia', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'],
			'Geographic/Asia/Middle East': ['Middle East', 'Bahrain', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Libya', 'Palestine', 'Qatar', 'Saudi Arabia', 'Syria', 'United Arab Emirates', 'Yemen'],
			'Geographic/Asia/India': ['India', 'Kerala'],
			'Geographic/Europe': ['Europe', 'Albania', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Georgia (country)', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Jersey', 'Kosovo', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'Yugoslavia'],
			'Geographic/Europe/United Kingdom': ['United Kingdom', 'England', 'Northern Ireland', 'Scotland', 'Wales'],
			'Geographic/Oceania': ['Oceania', 'Antarctica', 'Australia', 'New Zealand'],
			'Geographic/Americas/Canada': ['Canada', 'Alberta', 'British Columbia', 'Manitoba', 'Nova Scotia', 'Ontario', 'Quebec'],
			'Geographic/Americas/Latin America': ['Latin America', 'Caribbean', 'South America', 'Argentina', 'Barbados', 'Belize', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'Grenada', 'Guatemala', 'Haiti', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Puerto Rico', 'Trinidad and Tobago', 'Uruguay', 'Venezuela'],
			'Geographic/Americas/USA': ['United States of America', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia (U.S. state)', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'Washington, D.C.', 'West Virginia', 'Wisconsin', 'Wyoming'],
			'Geographic/Unsorted': ['Islands']
		};

		var delsort = this.fieldset.append({
			type: 'select',
			multiple: true,
			name: 'delsortCats',
			label: 'Choose deletion sorting categories: ',
			tooltip: 'Select a few categories that are specifically relevant to the subject of the article. Be as precise as possible; categories like People and USA should only be used when no other categories apply.'
		});

		$.each(delsortCategories, function(groupname, list) {
			var group = delsort.append({ type: 'optgroup', label: groupname });
			list.forEach(function(item) {
				group.append({ type: 'option', label: item, value: item });
			});
		});

		this.appendReasonArea();
		return this.fieldset;
	}

	postRender(renderedFieldset: HTMLFieldSetElement) {
		$(renderedFieldset).find('[name=delsortCats]')
			.attr('data-placeholder', 'Select delsort pages')
			.select2({
				width: '100%',
				matcher: Morebits.select2.matchers.optgroupFull,
				templateResult: Morebits.select2.highlightSearchMatches,
				language: {
					searching: Morebits.select2.queryInterceptor
				},
				// Link text to the page itself
				templateSelection: function(choice) {
					return $('<a>').text(choice.text).attr({
						href: mw.util.getUrl('Wikipedia:WikiProject_Deletion_sorting/' + choice.text),
						target: '_blank'
					});
				}
			});

		mw.util.addCSS(
			// Remove black border
			'.select2-container--default.select2-container--focus .select2-selection--multiple { border: 1px solid #aaa; }' +

			// Reduce padding
			'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
			'.select2-results .select2-results__group { padding-top: 1px; padding-bottom: 1px; } ' +

			// Adjust font size
			'.select2-container .select2-dropdown .select2-results { font-size: 13px; }' +
			'.select2-container .selection .select2-selection__rendered { font-size: 13px; }' +

			// Make the tiny cross larger
			'.select2-selection__choice__remove { font-size: 130%; }'
		);
	}

	evaluate() {
		super.evaluate();
		this.tm.add(this.checkPage, []);
		this.tm.add(this.determineDiscussionPage, []);
		this.tm.add(this.createDiscussionPage, [this.checkPage, this.determineDiscussionPage], this.printReasonText);
		// create discussion page before linking or transcluding it from anywhere, so that
		// there's no need to do any purging later (#364)
		this.tm.add(this.tagPage, [this.checkPage, this.createDiscussionPage]); // tagPage has an arg coming from checkPage
		this.tm.add(this.addToList, [this.createDiscussionPage]);
		this.tm.add(this.addToDelsortLists, [this.createDiscussionPage]);
		this.tm.add(this.patrolPage, [this.checkPage]);
		this.tm.add(this.fetchCreatorInfo, []);
		this.tm.add(this.notifyCreator, [this.createDiscussionPage, this.fetchCreatorInfo]);
		this.tm.add(this.addToLog, [this.notifyCreator]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	preprocessParams() {
		this.params.lookupNonRedirectCreator = true; // for this.fetchCreatorInfo()
	}

	/**
	 * Check to see that the page still exists, is not already tagged for AfD, etc.
	 */
	checkPage() {

		var pageobj = new Twinkle.page(mw.config.get('wgPageName'), 'Adding deletion tag to article');
		pageobj.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
		return pageobj.load().then((pageobj) => {
			var text = pageobj.getPageText();
			var statelem = pageobj.getStatusElement();

			this.params.articleLoadTime = pageobj.getLoadTime();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return $.Deferred().reject(); // Cancel future operations
			}

			// Check for existing AfD tag, for the benefit of new page patrollers
			var textNoAfd = text.replace(/<!--.*AfD.*\n\{\{(?:Article for deletion\/dated|AfDM).*\}\}\n<!--.*(?:\n<!--.*)?AfD.*(?:\s*\n)?/g, '');
			if (text !== textNoAfd) {
				if (confirm('An AfD tag was found on this article. Maybe someone beat you to it.  \nClick OK to replace the current AfD tag (not recommended), or Cancel to abandon your nomination.')) {
					pageobj.setPageText(textNoAfd);
				} else {
					statelem.error('Article already tagged with AfD tag, and you chose to abort');
					window.location.reload();
					return $.Deferred().reject(); // Cancel future operations
				}
			}
			return pageobj;
		});

	}

	tagPage(pageobj) {
		let params = this.params;

		params.tagText = (params.noinclude ? '<noinclude>{{' : '{{') + (params.number === '' ? 'subst:afd|help=off' : 'subst:afdx|' +
			params.number + '|help=off') + (params.noinclude ? '}}</noinclude>\n' : '}}\n');

		if (pageobj.canEdit()) {
			var text = pageobj.getPageText();

			// Remove some tags that should always be removed on AfD.
			text = text.replace(/\{\{\s*(dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated|prod2|Proposed deletion endorsed|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			// Then, test if there are speedy deletion-related templates on the article.
			var textNoSd = text.replace(/\{\{\s*(db(-\w*)?|delete|(?:hang|hold)[- ]?on)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			if (text !== textNoSd && confirm('A speedy deletion tag was found on this page. Should it be removed?')) {
				text = textNoSd;
			}

			// Insert tag after short description or any hatnotes
			var wikipage = new Morebits.wikitext.page(text);
			text = wikipage.insertAfterTemplates(params.tagText, Twinkle.hatnoteRegex).getText();

			pageobj.setPageText(text);
			pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
			pageobj.setCreateOption('nocreate');
			return pageobj.save();
		} else {
			return this.autoEditRequest(pageobj);
		}

	}

	getDiscussionWikitext(): string {
		let params = this.params;
		return utils.makeTemplate('subst:afd2', {
			text: Morebits.string.formatReasonText(params.reason, true),
			pg: Morebits.pageNameNorm,
			cat: params.xfdcat
		}) + params.delsortCats.map(function (cat) {
			return '\n{{subst:delsort|' + cat + '|~~~~}}';
		}).join('');
	}

	createDiscussionPage() {
		let params = this.params;
		var pageobj = new Twinkle.page(params.discussionpage, 'Creating article deletion discussion page');
		return pageobj.load().then((pageobj) => {
			pageobj.setPageText(this.getDiscussionWikitext());
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			return pageobj.save();
		});

	}

	addToList() {
		let params = this.params;

		var date = new Morebits.date(params.articleLoadTime);
		var pageobj = new Twinkle.page('Wikipedia:Articles for deletion/Log/' +
			date.format('YYYY MMMM D', 'utc'), "Adding discussion to today's list");
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var statelem = pageobj.getStatusElement();

			var added_data = '{{subst:afd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}\n';
			var text;

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:AfD log}}\n' + added_data;
			} else {
				var old_text = pageobj.getPageText() + '\n';  // MW strips trailing blanks, but we like them, so we add a fake one

				text = old_text.replace(/(<!-- Add new entries to the TOP of the following list -->\n+)/, '$1' + added_data);
				if (text === old_text) {
					var linknode = document.createElement('a');
					linknode.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing AFD') + '?action=purge');
					linknode.appendChild(document.createTextNode('How to fix AFD'));
					statelem.error([ 'Could not find the target spot for the discussion. To fix this problem, please see ', linknode, '.' ]);
					return $.Deferred().reject();
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			return pageobj.save();
		});

	}

	addToDelsortLists() {
		let params = this.params;
		let promises = params.delsortCats.map((cat, idx) => {
			var delsortPage = new Twinkle.page('Wikipedia:WikiProject Deletion sorting/' + cat, 'Adding to list of ' + cat + '-related deletion discussions');
			delsortPage.setFollowRedirect(true); // In case a category gets renamed
			return delsortPage.load().then((pageobj) => {
				var discussionPage = params.discussionpage;
				var text = pageobj.getPageText().replace('directly below this line -->', 'directly below this line -->\n{{' + discussionPage + '}}');
				pageobj.setPageText(text);
				pageobj.setEditSummary('Listing [[:' + discussionPage + ']].');

				pageobj.setCreateOption('nocreate');
				return pageobj.save().catch(function() {}); // failures aren't important
			});
		});

		return $.when.apply($, promises);
	}

	patrolPage() {
		if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
			new Twinkle.page(Morebits.pageNameNorm).triage();
		}
		return $.Deferred().resolve(); // XXX
	}

	getNotifyText(): string {
		return utils.makeTemplate('subst:afd notice', {
			1: Morebits.pageNameNorm,
			order: this.params.numbering ? `|order=&#32;${this.params.numbering}` : ''
		}) + ' ~~~~';
	}

}


class Tfd extends XfdMode {
	static venueCode = 'tfd';
	static venueLabel = 'TfD (Templates for discussion)';

	getFieldsetLabel() {
		return 'Templates for discussion';
	}

	getMenuTooltip(): string {
		return 'Start a discussion for deleting or merging this template';
	}

	static isDefaultChoice() {
		return [ 10, 828 ].indexOf(mw.config.get('wgNamespaceNumber')) !== -1;
	}

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = super.generateFieldset();
		var templateOrModule = mw.config.get('wgPageContentModel') === 'Scribunto' ? 'module' : 'template';
		this.fieldset.append({
			type: 'select',
			label: 'Choose type of action wanted: ',
			name: 'xfdcat',
			event: function(e) {
				var target = e.target,
					tfdtarget = target.form.tfdtarget;
				// add/remove extra input box
				if (target.value === 'tfm' && !tfdtarget) {
					tfdtarget = new Morebits.quickForm.element({
						name: 'tfdtarget',
						type: 'input',
						label: 'Other ' + templateOrModule + ' to be merged: ',
						tooltip: 'Required. Should not include the ' + Morebits.string.toUpperCaseFirstChar(templateOrModule) + ': namespace prefix.',
						required: true
					});
					target.parentNode.appendChild(tfdtarget.render());
				} else {
					$(Morebits.quickForm.getElementContainer(tfdtarget)).remove();
					tfdtarget = null;
				}
			},
			list: [
				{ type: 'option', label: 'Deletion', value: 'tfd', selected: true },
				{ type: 'option', label: 'Merge', value: 'tfm' }
			]
		});
		this.fieldset.append({
			type: 'select',
			name: 'templatetype',
			label: 'Deletion tag display style: ',
			tooltip: 'Which <code>type=</code> parameter to pass to the TfD tag template.',
			list: templateOrModule === 'module' ? [
				{ type: 'option', value: 'module', label: 'Module', selected: true }
			] : [
				{ type: 'option', value: 'standard', label: 'Standard', selected: true },
				{ type: 'option', value: 'sidebar', label: 'Sidebar/infobox', selected: !!$('.infobox').length },
				{ type: 'option', value: 'inline', label: 'Inline template', selected: !!$('.mw-parser-output > p .Inline-Template').length },
				{ type: 'option', value: 'tiny', label: 'Tiny inline' }
			]
		});

		this.fieldset.append({
			type: 'checkbox',
			list: [
				{
					label: 'Wrap deletion tag with <noinclude> (for substituted templates only)',
					value: 'noinclude',
					name: 'noinclude',
					tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t get substituted along with the template.',
					disabled: templateOrModule === 'module',
					checked: !!$('.box-Subst_only').length // Default to checked if page carries {{subst only}}
				}
			]
		});

		this.fieldset.append({
			type: 'checkbox',
			list: [
				{
					label: 'Notify users of the template',
					value: 'devpages',
					name: 'devpages',
					tooltip: 'A notification template will be sent to Twinkle, AWB, and RedWarn if this is true.',
					checked: true
				}
			]
		});

		this.appendReasonArea();
		return this.fieldset;
	}

	preprocessParams() {
		if (this.params.tfdtarget) {
			this.params.tfdtarget = utils.stripNs(this.params.tfdtarget);
		}
		// Modules can't be tagged, TfD instructions are to place on /doc subpage
		this.params.scribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
		if (this.params.xfdcat === 'tfm') {
			this.params.otherTemplateName = (this.params.scribunto ? 'Module:' : 'Template:') + this.params.tfdtarget;
		}
	}

	evaluate() {
		super.evaluate();
		this.tm.add(this.tagPage, []);
		this.tm.add(this.addToList, [this.tagPage], this.printReasonText);
		this.tm.add(this.watchModule, []);
		this.tm.add(this.fetchCreatorInfo, []);
		this.tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
		this.tm.add(this.notifyOtherCreator, [this.fetchCreatorInfo]);
		this.tm.add(this.notifyDevs, [this.addToList]);
		this.tm.add(this.addToLog, [this.notifyCreator]);
		this.tm.execute().then(() => this.redirectToDiscussion());

	}

	tagPage() {
		return this.params.xfdcat === 'tfm' ? this.tagPagesForMerge() : this.tagPageForDeletion();
	}

	// One of the oddities due to our choice of not relying on the local time.
	setLogPageAndDiscussionPage(timestamp) {
		var date = new Morebits.date(timestamp);
		this.params.logpage = 'Wikipedia:Templates for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
		this.params.discussionpage = this.params.logpage + '#' + Morebits.pageNameNorm;
	}

	tagPageForDeletion() {
		let params = this.params;
		let pageobj = new Twinkle.page(Morebits.pageNameNorm + (params.scribunto ? '/doc' : ''),
			'Tagging ' + (params.scribunto ? 'module documentation' : 'template') + ' with ' +
			'deletion tag');
		pageobj.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect

		return pageobj.load().then(pageobj => {
			this.setLogPageAndDiscussionPage(pageobj.getLoadTime());
			var text = pageobj.getPageText();

			params.tagText = '{{subst:template for discussion|help=off' + (params.templatetype !== 'standard' ? '|type=' + params.templatetype : '') + '}}';

			if (pageobj.getContentModel() === 'sanitized-css') {
				params.tagText = '/* ' + params.tagText + ' */';
			} else {
				if (params.noinclude) {
					params.tagText = '<noinclude>' + params.tagText + '</noinclude>';
				}
				// No newline for inline
				params.tagText += params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : '';
			}

			if (pageobj.canEdit() && ['wikitext', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				if (params.scribunto) {
					pageobj.setCreateOption('recreate'); // Module /doc might not exist
				}
				return pageobj.save();
			} else {
				return this.autoEditRequest(pageobj);
			}
		});

	}

	tagPagesForMerge() {
		let params = this.params;

		let docOrNot = params.scribunto ? '/doc' : '';
		let moduleDocOrTemplate = params.scribunto ? 'module documentation' : 'template';

		let pageobj = new Twinkle.page(`${Morebits.pageNameNorm}${docOrNot}`,
			`Tagging ${moduleDocOrTemplate} with merge tag`);
		pageobj.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect

		let thispageTagging = pageobj.load().then((pageobj) => {
			this.setLogPageAndDiscussionPage(pageobj.getLoadTime());
			return this.tagForMerge(pageobj, this.params);
		});

		let otherpageobj = new Twinkle.page(`${params.otherTemplateName}${docOrNot}`,
			`Tagging other ${moduleDocOrTemplate} with merge tag`);
		otherpageobj.setFollowRedirect(true);

		let otherpageTagging = otherpageobj.load().then((otherpageobj) => {
			this.setLogPageAndDiscussionPage(pageobj.getLoadTime());
			return this.tagForMerge(otherpageobj, $.extend({}, params, {
				otherTemplateName: Morebits.pageNameNorm
			}));
		});

		return $.when(thispageTagging, otherpageTagging);
	}

	/**
	 * @param {Twinkle.page} pageobj - pageobj should be already loaded
	 * @param {Object} params - we can't just use this.params since
	 * that would be incorrect when tagging the "other" page
	 */
	tagForMerge(pageobj, params) {

		var text = pageobj.getPageText();

		params.tagText = '{{subst:tfm|help=off|' + (params.templatetype !== 'standard' ? 'type=' + params.templatetype + '|' : '') +
			'1=' + params.otherTemplateName.replace(/^(?:Template|Module):/, '') + '}}';

		if (pageobj.getContentModel() === 'sanitized-css') {
			params.tagText = '/* ' + params.tagText + ' */';
		} else {
			if (params.noinclude) {
				params.tagText = '<noinclude>' + params.tagText + '</noinclude>';
			}

			// No newline for inline
			params.tagText += params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : '';
		}

		if (pageobj.canEdit() && ['wikitext', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
			pageobj.setPageText(params.tagText + text);
			pageobj.setEditSummary('Listed for merging with [[:' + params.otherTemplateName + ']]; see [[:' + params.discussionpage + ']].');

			pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
			if (params.scribunto) {
				pageobj.setCreateOption('recreate'); // Module /doc might not exist
			}
			return pageobj.save();
		} else {
			return this.autoEditRequest(pageobj);
		}

	}

	addToList() {
		let params = this.params;

		var pageobj = new Twinkle.page(params.logpage, "Adding discussion to today's log");
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var statelem = pageobj.getStatusElement();

			var added_data = this.getDiscussionWikitext();
			var text;

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:TfD log}}\n' + added_data;
			} else {
				var old_text = pageobj.getPageText();

				text = old_text.replace('-->', '-->\n' + added_data);
				if (text === old_text) {
					statelem.error('failed to find target spot for the discussion');
					return $.Deferred().reject();
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding ' + (params.xfdcat === 'tfd' ? 'deletion nomination' : 'merge listing') + ' of [[:' + Morebits.pageNameNorm + ']].');

			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			return pageobj.save();
		});

	}

	notifyOtherCreator() {
		if (!this.params.otherTemplateName) {
			return $.Deferred().resolve();
		}
		return new Twinkle.page(this.params.otherTemplateName, 'Finding other page creator').lookupCreation().then(page => {
			let otherpagecreator = page.getCreator();
			page.getStatusElement().info('Found ' + otherpagecreator);
			if (otherpagecreator === this.params.initialContrib) {
				return;
			}
			return this.notifyTalkPage(otherpagecreator);
		});

	}

	notifyDevs() {
		if (!this.params.devpages) {
			return $.Deferred().resolve();
		}
		var inCategories = mw.config.get('wgCategories');
		var categoryNotificationPageMap = {
			'Templates used by Twinkle': 'Wikipedia talk:Twinkle',
			'Templates used by AutoWikiBrowser': 'Wikipedia talk:AutoWikiBrowser',
			'Templates used by RedWarn': 'Wikipedia talk:RedWarn'
		};

		return $.when.apply($, obj_entries(categoryNotificationPageMap).filter(([cat, page]) => {
			return arr_includes(inCategories, cat);
		}).map(([cat, page]) => {
			return this.notifyTalkPage(page, new Morebits.status('Notifying ' + page + ' of template nomination'));
		}));
	}

	watchModule() {
		let params = this.params;
		if (!params.scribunto) {
			return $.Deferred().resolve();
		}
		var watchPref = Twinkle.getPref('xfdWatchPage');
		// action=watch has no way to rely on user
		// preferences (T262912), so we do it manually.
		// The watchdefault pref appears to reliably return '1' (string),
		// but that's not consistent among prefs so might as well be "correct"
		var watchModule = watchPref !== 'no' && (watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
		if (!watchModule) {
			return $.Deferred().resolve();
		}
		var watch_query = {
			action: 'watch',
			titles: [ mw.config.get('wgPageName') ],
			token: mw.user.tokens.get('watchToken'),
			// Expiry (note: mb.w.api delete params with value false)
			watchlistexpiry: watchPref !== 'default' && watchPref !== 'yes' && watchPref
		};
		if (params.xfdcat === 'tfm' ) {
			// Watch other module too
			watch_query.titles.push(params.otherTemplateName);
		}
		return new Morebits.wiki.api('Adding Module to watchlist', watch_query).post();
	}

	getDiscussionWikitext(): string {
		return utils.makeTemplate('subst:' + this.params.xfdcat + '2', {
			text: Morebits.string.formatReasonText(this.params.reason, true),
			1: mw.config.get('wgTitle'),
			module: this.params.scribunto ? 'Module:' : '',
			2: this.params.tfdtarget
		});
	}

	getNotifyText(): string {
		let text = `{{subst:tfd notice`;
		if (this.params.xfdcat === 'tfm') {
			text = '\n{{subst:Tfm notice|2=' + this.params.tfdtarget;
		}
		text += `|1=${Morebits.pageNameNorm}}} ~~~~`;
		return text;
	}

	getUserspaceLoggingExtraInfo() {
		let params = this.params, text = '';
		if (params.xfdcat === 'tfm') {
			text += ' (merge)';
			if (params.tfdtarget) {
				var contentModel = mw.config.get('wgPageContentModel') === 'Scribunto' ? 'Module:' : 'Template:';
				text += '; Other ' + contentModel.toLowerCase() + ' [[';
				if (!/^:?(?:template|module):/i.test(params.tfdtarget)) {
					text += contentModel;
				}
				text += params.tfdtarget + ']]';
			}
		}
		return text;
	}

}


class Ffd extends XfdMode {
	static venueCode = 'ffd';
	static venueLabel = 'FfD (Files for discussion)';

	static isDefaultChoice() {
		return mw.config.get('wgNamespaceNumber') === 6;
	}

	getFieldsetLabel() {
		return 'Files for discussion';
	}

	getMenuTooltip(): string {
		return 'Start a discussion for deleting this file';
	}

	getVenueWarning() {
		if (mw.config.get('wgNamespaceNumber') !== 6) {
			return 'FFD is selected but this page doesn\'t look like a file!';
		}
	}

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = super.generateFieldset();
		this.appendReasonArea();
		return this.fieldset;
	}

	preview(form: HTMLFormElement) {
		this.params = Morebits.quickForm.getInputData(form);
		this.preprocessParams();
		this.fetchCreatorInfo().then(() => {
			this.showPreview(form);
		});
	}

	evaluate() {
		super.evaluate();
		this.tm.add(this.fetchCreatorInfo, []);
		this.tm.add(this.tagPage, []);
		this.tm.add(this.addToList, [this.fetchCreatorInfo, this.tagPage], this.printReasonText);
		this.tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
		this.tm.add(this.addToLog, [this.notifyCreator]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	tagPage() {
		let params = this.params;
		let pageobj = new Twinkle.page(mw.config.get('wgPageName'), 'Adding deletion tag to file page');
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var text = pageobj.getPageText();

			var date = new Morebits.date(pageobj.getLoadTime()).format('YYYY MMMM D', 'utc');
			params.logpage = 'Wikipedia:Files for discussion/' + date;
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;

			params.tagText = '{{ffd|log=' + date + '|help=off}}\n';
			if (pageobj.canEdit()) {
				text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].');
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
				return pageobj.save();
			} else {
				return this.autoEditRequest(pageobj);
			}
		});

	}

	addToList() {
		let params = this.params;
		var wikipedia_page = new Twinkle.page(params.logpage, "Adding discussion to today's list");
		wikipedia_page.setFollowRedirect(true);
		return wikipedia_page.load().then((pageobj) => {
			var text = pageobj.getPageText();

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:FfD log}}';
			}

			pageobj.setPageText(text + '\n\n' + this.getDiscussionWikitext());
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			return pageobj.save();
		});
	}

	getDiscussionWikitext(): string {
		return utils.makeTemplate('subst:ffd2', {
			Reason: Morebits.string.formatReasonText(this.params.reason, true),
			1: mw.config.get('wgTitle'),
			Uploader: this.params.initialContrib
		});
	}

}


class Cfd extends XfdMode {
	static venueCode = 'cfd';
	static venueLabel = 'CfD (Categories for discussion)';

	static isDefaultChoice() {
		return mw.config.get('wgNamespaceNumber') === 14 ||
			(mw.config.get('wgNamespaceNumber') === 10 && /-stub$/.test(Morebits.pageNameNorm));
	}

	getFieldsetLabel() {
		return 'Categories for discussion';
	}

	getMenuTooltip(): string {
		return 'Nominate article for deletion or move';
	}

	getVenueWarning(): string {
		if ([ 10, 14 ].indexOf(mw.config.get('wgNamespaceNumber')) === -1) {
			return 'CfD is only for categories and stub templates.';
		}
	}

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = super.generateFieldset();
		var isCategory = mw.config.get('wgNamespaceNumber') === 14;
		this.fieldset.append({
			type: 'select',
			label: 'Choose type of action wanted: ',
			name: 'xfdcat',
			list: isCategory ? [
				{ type: 'option', label: 'Deletion', value: 'cfd', selected: true },
				{ type: 'option', label: 'Merge', value: 'cfm' },
				{ type: 'option', label: 'Renaming', value: 'cfr' },
				{ type: 'option', label: 'Split', value: 'cfs' },
				{ type: 'option', label: 'Convert into article', value: 'cfc' }
			] : [
				{ type: 'option', label: 'Stub Deletion', value: 'sfd-t', selected: true },
				{ type: 'option', label: 'Stub Renaming', value: 'sfr-t' }
			],
			event: function(e) {
				var value = e.target.value,
					cfdtarget = e.target.form.cfdtarget,
					cfdtarget2 = e.target.form.cfdtarget2;

				// update enabled status
				cfdtarget.disabled = value === 'cfd' || value === 'sfd-t';

				if (isCategory) {
					// update label
					if (value === 'cfs') {
						Morebits.quickForm.setElementLabel(cfdtarget, 'Target categories: ');
					} else if (value === 'cfc') {
						Morebits.quickForm.setElementLabel(cfdtarget, 'Target article: ');
					} else {
						Morebits.quickForm.setElementLabel(cfdtarget, 'Target category: ');
					}
					// add/remove extra input box
					if (value === 'cfs') {
						if (cfdtarget2) {
							cfdtarget2.disabled = false;
							$(cfdtarget2).show();
						} else {
							cfdtarget2 = document.createElement('input');
							cfdtarget2.setAttribute('name', 'cfdtarget2');
							cfdtarget2.setAttribute('type', 'text');
							cfdtarget2.setAttribute('required', 'true');
							cfdtarget.parentNode.appendChild(cfdtarget2);
						}
					} else {
						$(cfdtarget2).prop('disabled', true);
						$(cfdtarget2).hide();
					}
				} else { // Update stub template label
					Morebits.quickForm.setElementLabel(cfdtarget, 'Target stub template: ');
				}
			}
		});

		this.fieldset.append({
			type: 'input',
			name: 'cfdtarget',
			label: 'Target category: ', // default, changed above
			disabled: true,
			required: true, // only when enabled
			value: ''
		});
		this.appendReasonArea();
		return this.fieldset;
	}

	preprocessParams() {
		if (this.params.cfdtarget) {
			this.params.cfdtarget = utils.stripNs(this.params.cfdtarget);
		}
		if (this.params.cfdtarget2) {
			this.params.cfdtarget2 = utils.stripNs(this.params.cfdtarget2);
		}
		// Used for customized actions in edit summaries and the notification template
		let summaryActions = {
			'cfd': 'deletion',
			'sfd-t': 'deletion',
			'cfm': 'merging',
			'cfr': 'renaming',
			'sfr-t': 'renaming',
			'cfs': 'splitting',
			'cfc': 'conversion'
		};
		this.params.action = summaryActions[this.params.xfdcat];
		this.params.stub = mw.config.get('wgNamespaceNumber') !== 14;
	}

	evaluate() {
		super.evaluate();
		this.tm.add(this.tagPage, []);
		this.tm.add(this.addToList, [this.tagPage], this.printReasonText);
		this.tm.add(this.fetchCreatorInfo, []);
		this.tm.add(this.notifyCreator, [this.fetchCreatorInfo, this.tagPage]);
		this.tm.add(this.addToLog, [this.notifyCreator]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	tagPage() {
		var params = this.params;
		var pageobj = new Twinkle.page(mw.config.get('wgPageName'), 'Tagging category with ' + params.action + ' tag');
		pageobj.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
		return pageobj.load().then((pageobj) => {

			// Set data for future actions first
			var date = new Morebits.date(pageobj.getLoadTime());
			params.logpage = 'Wikipedia:Categories for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;

			var text = pageobj.getPageText();
			params.tagText = utils.makeTemplate('subst:' + params.xfdcat, {
				1: params.cfdtarget, // for cfm, cfr, cfc, cfs, sfr-t
				2: params.cfdtarget2 // for cfs
			}) + '\n';

			var editsummary = (params.stub ? 'Stub template' : 'Category') +
				' being considered for ' + params.action + (params.xfdcat === 'cfc' ? ' to an article' : '') +
				'; see [[:' + params.discussionpage + ']].';

			if (pageobj.canEdit()) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary(editsummary);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
				return pageobj.save();
			} else {
				return this.autoEditRequest(pageobj);
			}
		});
	}

	addToList() {
		var params = this.params;
		var pageobj = new Twinkle.page(params.logpage, "Adding discussion to today's list");
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var statelem = pageobj.getStatusElement();

			var added_data = this.getDiscussionWikitext();
			var text;

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:CfD log}}\n' + added_data;
			} else {
				var old_text = pageobj.getPageText();

				text = old_text.replace('below this line -->', 'below this line -->\n' + added_data);
				if (text === old_text) {
					statelem.error('failed to find target spot for the discussion');
					return $.Deferred().reject();
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding ' + params.action + ' nomination of [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			return pageobj.save();
		});
	}

	getDiscussionWikitext(): string {
		return utils.makeTemplate('subst:' + this.params.xfdcat + '2', {
			text: Morebits.string.formatReasonText(this.params.reason, true),
			1: mw.config.get('wgTitle'),
			2: this.params.cfdtarget,
			3: this.params.cfdtarget2
		});
	}

	getNotifyText(): string {
		return utils.makeTemplate('subst:cfd notice', {
			action: this.params.action,
			1: Morebits.pageNameNorm,
			stub: mw.config.get('wgNamespaceNumber') === 10 ? 'yes' : null
		}) + ' ~~~~';
	}

	getUserspaceLoggingExtraInfo() {
		let params = this.params, text = '';
		text += ' (' + utils.toTLACase(params.xfdcat) + ')';
		if (params.cfdtarget) {
			var categoryOrTemplate = params.xfdcat.charAt(0) === 's' ? 'Template:' : ':Category:';
			text += '; ' + params.action + ' to [[' + categoryOrTemplate + params.cfdtarget + ']]';
			if (params.xfdcat === 'cfs' && params.cfdtarget2) {
				text += ', [[' + categoryOrTemplate + params.cfdtarget2 + ']]';
			}
		}
		return text;
	}


}


class Cfds extends XfdMode {
	static venueCode = 'cfds';
	static venueLabel = 'CfDS (Categories for speedy renaming)';

	getMenuTooltip(): string {
		return 'Nominate article for deletion or move';
	}

	getFieldsetLabel() {
		return 'Categories for speedy renaming';
	}

	getVenueWarning() {
		if ([ 10, 14 ].indexOf(mw.config.get('wgNamespaceNumber')) === -1) {
			return 'CfD is only for categories and stub templates.';
		}
	}

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = super.generateFieldset();
		this.fieldset.append({
			type: 'select',
			label: 'C2 sub-criterion: ',
			name: 'xfdcat',
			tooltip: 'See WP:CFDS for full explanations.',
			list: [
				{ type: 'option', label: 'C2A: Typographic and spelling fixes', value: 'C2A', selected: true },
				{ type: 'option', label: 'C2B: Naming conventions and disambiguation', value: 'C2B' },
				{ type: 'option', label: 'C2C: Consistency with names of similar categories', value: 'C2C' },
				{ type: 'option', label: 'C2D: Rename to match article name', value: 'C2D' },
				{ type: 'option', label: 'C2E: Author request', value: 'C2E' },
				{ type: 'option', label: 'C2F: One eponymous article', value: 'C2F' }
			]
		});

		this.fieldset.append({
			type: 'input',
			name: 'cfdstarget',
			label: 'New name: ',
			required: true
		});
		this.appendReasonArea();
		return this.fieldset;
	}

	preprocessParams() {
		if (this.params.cfdstarget) { // Add namespace if not given (CFDS)
			this.params.cfdstarget = utils.addNs(this.params.cfdstarget, 14);
		}
	}

	evaluate() {
		super.evaluate();
		Twinkle.tm = this.tm;
		this.tm.add(this.tagPage, []);
		this.tm.add(this.addToList, [], this.printReasonText);
		this.tm.add(this.addToLog, [this.addToList]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	tagPage() {
		let params = this.params;
		let pageobj = new Twinkle.page(mw.config.get('wgPageName'), 'Tagging category with rename tag');
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var text = pageobj.getPageText();
			params.tagText = '{{subst:cfr-speedy|1=' + params.cfdstarget.replace(/^:?Category:/, '') + '}}\n';
			if (pageobj.canEdit()) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Listed for speedy renaming; see [[WP:CFDS|Categories for discussion/Speedy]].');
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
				return pageobj.save();
			} else {
				return this.autoEditRequest(pageobj);
			}
		});
	}

	addToList() {
		let pageobj = new Twinkle.page('Wikipedia:Categories for discussion/Speedy', 'Adding discussion to the list');
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var old_text = pageobj.getPageText();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace('BELOW THIS LINE -->', 'BELOW THIS LINE -->\n' + this.getDiscussionWikitext());
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return $.Deferred().reject();
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			return pageobj.save();
		});
	}

	getDiscussionWikitext(): string {
		let params = this.params;
		return '* [[:' + Morebits.pageNameNorm + ']] to [[:' + params.cfdstarget + ']]\u00A0\u2013 ' +
			params.xfdcat + (params.reason ? ': ' + Morebits.string.formatReasonText(params.reason) : '.') + ' ~~~~';
		// U+00A0 NO-BREAK SPACE; U+2013 EN RULE
	}

	getUserspaceLoggingExtraInfo() {
		let params = this.params, text = '';
		text += ' (' + utils.toTLACase(params.xfdcat) + ')';
		// Ensure there's more than just 'Category:'
		if (params.cfdstarget && params.cfdstarget.length > 9) {
			text += '; New name: [[:' + params.cfdstarget + ']]';
		}
		return text;
	}

}


class Mfd extends XfdMode {
	static venueCode = 'mfd';
	static venueLabel = 'MfD (Miscellany for deletion)';

	static isDefaultChoice() {
		return [ 0, 6, 10, 14, 828 ].indexOf(mw.config.get('wgNamespaceNumber')) === -1 ||
			Morebits.pageNameNorm.indexOf('Template:User ', 0) === 0;
	}

	getMenuTooltip(): string {
		return 'Nominate article for deletion or move';
	}

	getFieldsetLabel() {
		return 'Miscellany for deletion';
	}

	discussionPagePrefix = 'Wikipedia:Miscellany for deletion';

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = super.generateFieldset();
		this.fieldset.append({
			type: 'checkbox',
			list: [
				{
					label: 'Wrap deletion tag with <noinclude>',
					value: 'noinclude',
					name: 'noinclude',
					tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t transclude. Select this option for userboxes.'
				}
			]
		});
		if ((mw.config.get('wgNamespaceNumber') === 2 /* User: */ || mw.config.get('wgNamespaceNumber') === 3 /* User talk: */) && mw.config.exists('wgRelevantUserName')) {
			this.fieldset.append({
				type: 'checkbox',
				list: [
					{
						label: 'Notify owner of userspace (if they are not the page creator)',
						value: 'notifyuserspace',
						name: 'notifyuserspace',
						tooltip: 'If the user in whose userspace this page is located is not the page creator (for example, the page is a rescued article stored as a userspace draft), notify the userspace owner as well.',
						checked: true
					}
				]
			});
		}
		this.appendReasonArea();
		return this.fieldset;
	}

	preprocessParams() {
		this.params.userspaceOwner = mw.config.get('wgRelevantUserName');
	}

	evaluate() {
		super.evaluate();
		this.tm.add(this.determineDiscussionPage, [])
		this.tm.add(this.tagPage, [this.determineDiscussionPage]);
		this.tm.add(this.addToList, [this.determineDiscussionPage]);
		this.tm.add(this.createDiscussionPage, [this.determineDiscussionPage], this.printReasonText);
		this.tm.add(this.fetchCreatorInfo, []);
		this.tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
		this.tm.add(this.notifyUserspaceOwner, [this.fetchCreatorInfo]);
		this.tm.add(this.addToLog, [this.notifyCreator, this.notifyUserspaceOwner]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	tagPage() {
		let params = this.params;
		var pageobj = new Twinkle.page(mw.config.get('wgPageName'), 'Tagging page with deletion tag');
		pageobj.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
		return pageobj.load().then((pageobj) => {
			var text = pageobj.getPageText();

			params.tagText = '{{' + (params.number === '' ? 'mfd' : 'mfdx|' + params.number) + '|help=off}}';

			if (['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1) {
				params.tagText = '/* ' + params.tagText + ' */\n';
			} else {
				params.tagText += '\n';
				if (params.noinclude) {
					params.tagText = '<noinclude>' + params.tagText + '</noinclude>';
				}
			}

			if (pageobj.canEdit() && ['wikitext', 'javascript', 'css', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('nocreate');
				return pageobj.save();
			} else {
				return this.autoEditRequest(pageobj);
			}
		});
	}

	createDiscussionPage() {
		let params = this.params;
		let pageobj = new Twinkle.page(params.discussionpage, 'Creating deletion discussion page');
		return pageobj.load().then(pageobj => {
			pageobj.setPageText(this.getDiscussionWikitext());
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			return pageobj.save();
		});
	}

	getDiscussionWikitext(): string {
		return utils.makeTemplate('subst:mfd2', {
			text: Morebits.string.formatReasonText(this.params.reason, true),
			pg: Morebits.pageNameNorm
		});
	}

	addToList() {
		let params = this.params;
		let pageobj = new Twinkle.page('Wikipedia:Miscellany for deletion', "Adding discussion to today's list");
		pageobj.setPageSection(2);
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var text = pageobj.getPageText();
			var statelem = pageobj.getStatusElement();

			var date = new Morebits.date(pageobj.getLoadTime());
			var date_header = date.format('===MMMM D, YYYY===\n', 'utc');
			var date_header_regex = new RegExp(date.format('(===[\\s]*MMMM[\\s]+D,[\\s]+YYYY[\\s]*===)', 'utc'));
			var added_data = '{{subst:mfd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}';

			if (date_header_regex.test(text)) { // we have a section already
				statelem.info('Found today\'s section, proceeding to add new entry');
				text = text.replace(date_header_regex, '$1\n' + added_data);
			} else { // we need to create a new section
				statelem.info('No section for today found, proceeding to create one');
				text = text.replace('===', date_header + added_data + '\n\n===');
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			return pageobj.save();
		});
	}

	notifyUserspaceOwner() {
		let params = this.params;
		// Notify the user who owns the subpage if they are not the creator
		if (params.notifyuserspace && params.userspaceOwner !== params.initialContrib) {
			// Don't log if notifying creator above, will log then
			return this.notifyTalkPage(params.userspaceOwner, new Morebits.status('Notifying owner of userspace (' + params.userspaceOwner + ')'));
		} else {
			return $.Deferred().resolve();
		}
	}

	getNotifyText(): string {
		let text = `{{subst:mfd notice`;
		if (this.params.numbering) {
			text += `|order=&#32;${this.params.numbering}`;
		}
		text += `|1=${Morebits.pageNameNorm}}} ~~~~`;
		return text;
	}

	getUserspaceLoggingExtraInfo() {
		let params = this.params, text = '';
		if (params.notifyuserspace && params.userspaceOwner && params.userspaceOwner !== params.initialContrib) {
			text += '; notified {{user|1=' + params.userspaceOwner + '}}';
		}
		return text;
	}

}


class Rfd extends XfdMode {
	static venueCode = 'rfd';
	static venueLabel = 'RfD (Redirects for discussion)';

	static isDefaultChoice() {
		return mw.config.get('wgIsRedirect') || !!document.getElementById('softredirect');
	}

	getFieldsetLabel() {
		return 'Redirects for discussion';
	}

	getMenuTooltip(): string {
		return 'Nominate redirect to be deleted or retargeted';
	}

	getUserspaceLoggingExtraInfo() {
		let params = this.params, text = '';
		if (params.rfdtarget) {
			text += '; Target: [[:' + params.rfdtarget + ']]';
			if (params.relatedpage) {
				text += ' (notified)';
			}
		}
		return text;
	}

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = super.generateFieldset();
		this.fieldset.append({
			type: 'checkbox',
			list: [
				{
					label: 'Notify target page if possible',
					value: 'relatedpage',
					name: 'relatedpage',
					tooltip: "A notification template will be placed on the talk page of this redirect's target if this is true.",
					checked: true
				}
			]
		});
		this.appendReasonArea();
		return this.fieldset;
	}

	preview(form: HTMLFormElement) {
		this.params = Morebits.quickForm.getInputData(form);
		this.findTarget().then(() => {
			this.showPreview(form);
		});
	}

	evaluate() {
		super.evaluate();
		let tm = new Morebits.taskManager(this);
		this.tm.add(this.findTarget, []);
		this.tm.add(this.tagPage, [this.findTarget]);
		this.tm.add(this.addToList, [this.findTarget, this.tagPage], this.printReasonText);
		this.tm.add(this.fetchCreatorInfo, []);
		this.tm.add(this.notifyCreator, [this.fetchCreatorInfo, this.tagPage]);
		this.tm.add(this.notifyTargetTalk, [this.fetchCreatorInfo, this.tagPage]);
		this.tm.add(this.addToLog, [this.notifyCreator]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	// Creates: params.rfdtarget, params.curtimestamp, params.section, params.logpage, params.discussionpage
	findTarget(): JQuery.Promise<void> {
		// Used by regular redirects to find the target, but for all redirects,
		// avoid relying on the client clock to build the log page
		let isSoftRedirect = !!document.getElementById('softredirect');
		var query = {
			'action': 'query',
			'curtimestamp': true,
			'format': 'json',
			// Find current target of redirect (for hard redirects only)
			'titles': !isSoftRedirect && mw.config.get('wgPageName'),
			'redirects': !isSoftRedirect
		};
		if (isSoftRedirect) {
			// For soft redirects, define the target early
			// to skip target checks in findTargetCallback
			this.params.rfdtarget = document.getElementById('softredirect').textContent.replace(/^:+/, '');
		}
		var wikipedia_api = new Morebits.wiki.api('Finding target of redirect', query);
		return wikipedia_api.post().then((apiobj) => {
			var response = apiobj.getResponse();
			this.params.curtimestamp = response.curtimestamp;
			var date = new Morebits.date(this.params.curtimestamp);
			this.params.logpage = 'Wikipedia:Redirects for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
			this.params.discussionpage = this.params.logpage + '#' + Morebits.pageNameNorm;

			if (!isSoftRedirect) {
				var target = response.query.redirects && response.query.redirects[0].to;
				if (!target) {
					var message = 'No target found. this page does not appear to be a redirect, aborting';
					if (mw.config.get('wgAction') === 'history') {
						message += '. If this is a soft redirect, try again from the content page, not the page history.';
					}
					apiobj.getStatusElement().error(message);
					return $.Deferred().reject();
				}
				this.params.rfdtarget = target;
				this.params.section = response.query.redirects[0].tofragment;
			}
		});
	}

	tagPage(): JQuery.Promise<void> {
		let params = this.params;

		var pageobj = new Twinkle.page(mw.config.get('wgPageName'), 'Adding deletion tag to redirect');
		pageobj.setFollowRedirect(false);
		return pageobj.load().then((pageobj) => {
			var text = pageobj.getPageText();
			// Imperfect for edit request but so be it
			params.tagText = '{{subst:rfd|' + (mw.config.get('wgNamespaceNumber') === 10 ? 'showontransclusion=1|' : '') + 'content=\n';

			if (pageobj.canEdit()) {
				pageobj.setPageText(params.tagText + text + '\n}}');
				pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].');
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('nocreate');
				return pageobj.save();
			} else {
				return this.autoEditRequest(pageobj);
			}
		});
	}

	getDiscussionWikitext(): string {
		let params = this.params;
		return utils.makeTemplate('subst:rfd2', {
			text: (params.reason ? Morebits.string.formatReasonText(params.reason) : '') + ' ~~~~',
			redirect: Morebits.pageNameNorm,
			target: params.rfdtarget && (params.rfdtarget + (params.section ? '#' + params.section : ''))
		});
	}

	addToList(): JQuery.Promise<void> {
		let params = this.params;
		let pageobj = new Twinkle.page(params.logpage, 'Adding discussion to today\'s log');
		pageobj.setFollowRedirect(true);
		return pageobj.load().then((pageobj) => {
			var statelem = pageobj.getStatusElement();
			var added_data = this.getDiscussionWikitext();
			var text;

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:RfD log}}' + added_data;
			} else {
				var old_text = pageobj.getPageText();
				text = old_text.replace(/(<!-- Add new entries directly below this line\.? -->)/, '$1\n' + added_data);
				if (text === old_text) {
					statelem.error('failed to find target spot for the discussion');
					return $.Deferred().reject();
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			return pageobj.save();
		});
	}

	notifyTargetTalk(): JQuery.Promise<void> {
		if (!this.params.relatedpage) {
			return $.Deferred().resolve();
		}
		var targetTalk = new mw.Title(this.params.rfdtarget).getTalkPage();
		let statelem = new Morebits.status('Notifying target talk page', 'doing');

		// On the offchance it's a circular redirect
		if (this.params.rfdtarget === mw.config.get('wgPageName')) {
			statelem.warn('Circular redirect; skipping target page notification');
			return $.Deferred().resolve();
		}
		if (document.getElementById('softredirect')) {
			statelem.warn('Soft redirect; skipping target page notification');
			return $.Deferred().resolve();
		}
		// Don't issue if target talk is the initial contributor's talk or your own
		if (targetTalk.getNamespaceId() === 3 && targetTalk.getNameText() === this.params.initialContrib) {
			statelem.warn('Target is initial contributor; skipping target page notification');
			return $.Deferred().resolve();
		}
		if (targetTalk.getNamespaceId() === 3 && targetTalk.getNameText() === mw.config.get('wgUserName')) {
			statelem.warn('You (' + mw.config.get('wgUserName') + ') are the target; skipping target page notification');
			return $.Deferred().resolve();
		}
		return this.notifyTalkPage(targetTalk.toText(), statelem);
	}
}


class Rm extends XfdMode {
	static venueCode = 'rm';
	static venueLabel = 'RM (Requested moves)';

	getFieldsetLabel() {
		return 'Requested moves';
	}

	getVenueWarning(): string | void {
		if (mw.config.get('wgNamespaceNumber') === 14) { // category
			return 'Please use CfD or CfDS for category renames.';
		}
	}

	generateFieldset(): Morebits.quickForm.element {
		this.fieldset = super.generateFieldset();
		this.fieldset.append({
			type: 'checkbox',
			list: [
				{
					label: 'Uncontroversial technical request',
					value: 'rmtr',
					name: 'rmtr',
					tooltip: 'Use this option when you are unable to perform this uncontroversial move yourself because of a technical reason (e.g. a page already exists at the new title, or the page is protected)',
					checked: false,
					event: (evt) => {
						this.result.newname.required = evt.target.checked;
					}
				}
			]
		});
		this.fieldset.append({
			type: 'input',
			name: 'newname',
			label: 'New title: ',
			tooltip: 'Required for technical requests. Otherwise, if unsure of the appropriate title, you may leave it blank.'
		});

		this.appendReasonArea();
		return this.fieldset;
	}

	getDiscussionWikitext(): string {
		let pageName = new mw.Title(Morebits.pageNameNorm).getSubjectPage().toText();
		let params = this.params;
		return (params.rmtr ?
			'{{subst:RMassist|1=' + pageName + '|2=' + params.newname :
			'{{subst:Requested move|current1=' + pageName + '|new1=' + params.newname)
			+ '|reason=' + params.reason + '}}';
	}

	preprocessParams() {
		this.params.discussionpage = this.params.rmtr ?
			'Wikipedia:Requested moves/Technical requests' :
			new mw.Title(Morebits.pageNameNorm).getTalkPage().toText();
	}

	showPreview(form: HTMLFormElement) {
		let templatetext = this.getDiscussionWikitext();
		form.previewer.beginRender(templatetext, this.params.discussionpage);
	}

	evaluate() {
		super.evaluate();
		this.tm.add(this.addToList, [], this.printReasonText);
		this.tm.add(this.addToLog, [this.addToList]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	addToList() {
		return this.params.rmtr ? this.listAtRMTR() : this.listAtTalk();
	}

	listAtTalk() {
		let params = this.params;
		let pageobj = new Twinkle.page(params.discussionpage, 'Adding entry on talk page');
		pageobj.setAppendText('\n\n' + this.getDiscussionWikitext());
		pageobj.setFollowRedirect(true);
		pageobj.setEditSummary('Proposing move' + (params.newname ? ' to [[:' + params.newname + ']]' : ''));

		pageobj.setCreateOption('recreate'); // since the talk page need not exist
		pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
		return pageobj.append();
	}

	listAtRMTR() {
		let pageobj = new Twinkle.page(this.params.discussionpage, 'Adding entry at WP:RM/TR');
		pageobj.setFollowRedirect(true);
		pageobj.setPageSection(2);
		return pageobj.load().then((pageobj) => {
			var text = pageobj.getPageText();
			var statelem = pageobj.getStatusElement();
			var hiddenCommentRE = /---- and enter on a new line.* -->/;
			var newtext = text.replace(hiddenCommentRE, '$&\n' + this.getDiscussionWikitext());
			if (text === newtext) {
				statelem.error('failed to find target spot for the entry');
				return $.Deferred().reject();
			}
			pageobj.setPageText(newtext);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');

			return pageobj.save();
		});
	}

	getUserspaceLoggingExtraInfo() {
		let params = this.params, text = '';
		if (params.rmtr) {
			text += ' (technical)';
		}
		if (params.newname) {
			text += '; New name: [[:' + params.newname + ']]';
		}
		return text;
	}

}

let utils = {
	/** Get ordinal number figure */
	num2order(num: number): string {
		switch (num) {
			case 1: return '';
			case 2: return '2nd';
			case 3: return '3rd';
			default: return num + 'th';
		}
	},

	/**
	 * Remove namespace name from title if present
	 * Exception-safe wrapper around mw.Title
	 * @param {string} title
	 */
	stripNs(title: string): string {
		var title_obj = mw.Title.newFromUserInput(title);
		if (!title_obj) {
			return title; // user entered invalid input; do nothing
		}
		return title_obj.getNameText();
	},

	/**
	 * Add namespace name to page title if not already given
	 * CAUTION: namespace name won't be added if a namespace (*not* necessarily
	 * the same as the one given) already is there in the title
	 * @param {string} title
	 * @param {number} namespaceNumber
	 */
	addNs(title: string, namespaceNumber: number): string {
		var title_obj = mw.Title.newFromUserInput(title, namespaceNumber);
		if (!title_obj) {
			return title;  // user entered invalid input; do nothing
		}
		return title_obj.toText();
	},

	/**
	 * Provide Wikipedian TLA style: AfD, RfD, CfDS, RM, SfD, etc.
	 * @param {string} venue
	 * @returns {string}
	 */
	toTLACase(venue: string): string {
		return venue
			.toString()
			// Everybody up, including rm and the terminal s in cfds
			.toUpperCase()
			// Lowercase the central f in a given TLA and normalize sfd-t and sfr-t
			.replace(/(.)F(.)(?:-.)?/, '$1f$2');
	},

	/**
	 * Make template wikitext from the template name and parameters
	 * @param {string} name - name of the template. Include "subst:" if necessary
	 * @param {Object} parameters - object with keys and values being the template param names and values.
	 * Use numbers as keys for unnamed parameters.
	 * If a value is falsy (undefined or null or empty string), the param doesn't appear in output.
	 * @returns {string}
	 */
	makeTemplate(name: string, parameters: Record<string | number, string>): string {
		let parameterText = obj_entries(parameters)
			.filter(([k, v]) => !!v) // ignore params with no value
			.map(([name, value]) => `|${name}=${value}`)
			.join('');
		return '{{' + name + parameterText + '}}';
	}
};


Xfd.modeList = [ Afd, Rfd, Cfd, Cfds, Tfd, Ffd, Mfd, Rm ];

Twinkle.addInitCallback(function() { new Xfd(); }, 'XFD');
