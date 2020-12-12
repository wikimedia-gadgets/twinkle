
class Xfd extends TwinkleModule {
	mode: XfdMode
	static modeList: (typeof XfdMode)[]

	Window: Morebits.simpleWindow;
	fieldset: quickFormElement;
	result: HTMLFormElement;

	static currentRationale: string;

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
	onCategoryChange(evt: Event) {
		// @ts-ignore
		var venueCode = evt.target.value;
		// @ts-ignore
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

		$('#wrong-venue-warn').text(this.mode.getVenueWarning());
		form.previewer.closePreview();

		let fieldset = this.mode.generateFieldset();
		let renderedFieldset = fieldset.render();
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
	fieldset: quickFormElement
	result: HTMLFormElement
	params: Record<string, any>

	getMenuTooltip(): string {
		return 'Nominate page for deletion';
	}

	generateFieldset(): quickFormElement {
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

	getVenueWarning(): string {
		return '';
	}

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

	evaluate() {
		this.params = Morebits.quickForm.getInputData(this.result);
		this.preprocessParams();
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(this.result);
	}

	autoEditRequest(pageobj: Morebits.wiki.page) {
		let params = this.params;
		let def = $.Deferred();
		var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
		if (talkName === pageobj.getPageName()) {
			pageobj.getStatusElement().error('Page protected and nowhere to add an edit request, aborting');
			return def.reject();
		} else {
			pageobj.getStatusElement().warn('Page protected, requesting edit');

			var editRequest = '{{subst:Xfd edit protected|page=' + pageobj.getPageName() +
				'|discussion=' + params.discussionpage + '|tag=<nowiki>' + params.tagText + '\u003C/nowiki>}}'; // U+003C: <

			var talk_page = new Morebits.wiki.page(talkName, 'Automatically posting edit request on talk page');
			talk_page.setNewSectionTitle('Edit request to complete ' + utils.toTLACase(params.venue) + ' nomination');
			talk_page.setNewSectionText(editRequest);
			talk_page.setCreateOption('recreate');
			talk_page.setWatchlist(Twinkle.getPref('xfdWatchPage'));
			talk_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
			talk_page.setChangeTags(Twinkle.changeTags);
			talk_page.newSection(def.resolve, function() {
				talk_page.getStatusElement().warn('Unable to add edit request, the talk page may be protected');
				def.reject();
			});
		}
		return def;
	}

	fetchCreatorInfo() {
		let def = $.Deferred();
		let thispage = new Morebits.wiki.page(Morebits.pageNameNorm, 'Finding page creator');
		thispage.lookupCreation((pageobj) => {
			this.params.initialContrib = pageobj.getCreator();
			pageobj.getStatusElement().info('Found ' + pageobj.getCreator());
			def.resolve();
		});
		return def;
	}

	notifyTalkPage(notifyTarget: string, statusElement?: Morebits.status) {
		// Ensure items with User talk or no namespace prefix both end
		// up at user talkspace as expected, but retain the
		// prefix-less username for addToLog
		let params = this.params;
		let def = $.Deferred();

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
				return def.resolve();
			}
		}

		var usertalkpage = new Morebits.wiki.page(notifyPageTitle, statusElement);
		usertalkpage.setAppendText('\n\n' + this.getNotifyText());
		usertalkpage.setEditSummary(this.getNotifyEditSummary());
		usertalkpage.setChangeTags(Twinkle.changeTags);
		usertalkpage.setCreateOption('recreate');
		// Different pref for RfD target notifications: XXX: handle this better!
		if (params.venue === 'rfd' && targetNS !== 3) {
			usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchRelated'));
		} else {
			usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchUser'));
		}
		usertalkpage.setFollowRedirect(true, false);
		usertalkpage.append(def.resolve, function onNotifyError() {
			// if user could not be notified, null this out for correct userspace logging
			params.initialContrib = null;
			def.resolve();
		});
		return def;
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
		let params = this.params,
			initialContrib = params.initialContrib;

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

class Tfd extends XfdMode {
	static venueCode = 'tfd';
	static venueLabel = 'TfD (Templates for discussion)';

	getFieldsetLabel() {
		return 'Templates for discussion';
	}
	static isDefaultChoice() {
		return [ 10, 828 ].indexOf(mw.config.get('wgNamespaceNumber')) !== -1;
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

	getMenuTooltip(): string {
		return 'Nominate article for deletion or move';
	}

	preprocessParams() {
		if (this.params.tfdtarget) {
			this.params.tfdtarget = utils.stripNs(this.params.tfdtarget);
		}
	}

	getDiscussionWikitext(): string {
		return '';
	}
	public getNotifyText(): string {
		let text = `{{subst:tfd notice`;
		if (this.params.xfdcat === 'tfm') {
			text = '\n{{subst:Tfm notice|2=' + this.params.tfdtarget;
		}
		text += `|1=${Morebits.pageNameNorm}}} ~~~~`;
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

	public generateFieldset(): quickFormElement {
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

	public evaluate() {
		super.evaluate();

		let tm = new Morebits.taskManager(this);
		tm.add(this.fetchCreatorInfo, []);
		tm.add(this.tagPage, []);
		tm.add(this.addToList, [this.fetchCreatorInfo, this.tagPage]);
		tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
		tm.add(this.addToLog, [this.notifyCreator]);
		tm.execute().then(() => {
			Morebits.status.actionCompleted("Nomination completed, now redirecting to today's log");
			setTimeout(() => {
				window.location.href = mw.util.getUrl(this.params.logpage);
			}, 50000);
		});
	}

	tagPage() {
		let params = this.params;
		let def = $.Deferred();
		let pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to file page');
		pageobj.setFollowRedirect(true);
		pageobj.load((pageobj) => {
			var text = pageobj.getPageText();

			var date = new Morebits.date(pageobj.getLoadTime()).format('YYYY MMMM D', 'utc');
			params.logpage = 'Wikipedia:Files for discussion/' + date;
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;

			params.tagText = '{{ffd|log=' + date + '|help=off}}\n';
			if (pageobj.canEdit()) {
				text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
				pageobj.save(def.resolve, def.reject);
			} else {
				this.autoEditRequest(pageobj).then(def.resolve, def.reject);
			}
		});
		return def;
	}

	addToList() {
		let params = this.params;
		let def = $.Deferred();
		var wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
		wikipedia_page.setFollowRedirect(true);
		wikipedia_page.load((pageobj) => {
			var text = pageobj.getPageText();

			// add date header if the log is found to be empty (a bot should do this automatically)
			if (!pageobj.exists()) {
				text = '{{subst:FfD log}}';
			}

			pageobj.setPageText(text + '\n\n' + this.getDiscussionWikitext());
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
				def.resolve();
			}, def.reject);
		});
		return def;
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

	public generateFieldset(): quickFormElement {
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
	}

	evaluate() {
		super.evaluate();

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

		let tm = new Morebits.taskManager(this);
		tm.add(this.tagPage, []);
		tm.add(this.addToList, [this.tagPage]);
		tm.add(this.fetchCreatorInfo, []);
		tm.add(this.notifyCreator, [this.fetchCreatorInfo, this.tagPage]);
		tm.add(this.addToLog, [this.notifyCreator]);
		tm.execute().then(() => {
			Morebits.status.actionCompleted("Nomination completed, now redirecting to today's log");
			setTimeout(() => {
				window.location.href = mw.util.getUrl(this.params.logpage);
			}, 50000);
		});
	}

	tagPage() {
		var params = this.params;
		var def = $.Deferred();
		var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging category with ' + params.action + ' tag');
		pageobj.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
		pageobj.load((pageobj) => {

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
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
				pageobj.save(def.resolve, def.reject);
			} else {
				this.autoEditRequest(pageobj).then(def.resolve, def.reject);
			}
		});
		return def;
	}

	addToList() {
		var params = this.params;
		var def = $.Deferred();
		var pageobj = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
		pageobj.setFollowRedirect(true);
		pageobj.load((pageobj) => {
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
					return def.reject();
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding ' + params.action + ' nomination of [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
				def.resolve();
			}, def.reject);
		});
		return def;
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

	public generateFieldset(): quickFormElement {
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

		let tm = new Morebits.taskManager(this);
		tm.add(this.tagPage, []);
		tm.add(this.addToList, []);
		tm.add(this.addToLog, [this.addToList]);
		tm.execute().then(() => {
			Morebits.status.actionCompleted('Nomination completed, now redirecting to the discussion page');
			setTimeout(() => {
				window.location.href = mw.util.getUrl(this.params.logpage);
			}, 50000);
		});

	}

	tagPage() {
		let params = this.params;
		let def = $.Deferred();
		let pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging category with rename tag');
		pageobj.setFollowRedirect(true);
		pageobj.load((pageobj) => {
			var text = pageobj.getPageText();
			params.tagText = '{{subst:cfr-speedy|1=' + params.cfdstarget.replace(/^:?Category:/, '') + '}}\n';
			if (pageobj.canEdit()) {
				pageobj.setPageText(params.tagText + text);
				pageobj.setEditSummary('Listed for speedy renaming; see [[WP:CFDS|Categories for discussion/Speedy]].');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
				pageobj.save(def.resolve, def.reject);
			} else {
				this.autoEditRequest(pageobj).then(def.resolve, def.reject);
			}
		});
		return def;
	}

	addToList() {
		let params = this.params;
		let def = $.Deferred();
		let pageobj = new Morebits.wiki.page('Wikipedia:Categories for discussion/Speedy', 'Adding discussion to the list');
		pageobj.setFollowRedirect(true);
		pageobj.load((pageobj) => {
			var old_text = pageobj.getPageText();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace('BELOW THIS LINE -->', 'BELOW THIS LINE -->\n' + this.getDiscussionWikitext());
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return def.reject();
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
				def.resolve();
			}, def.reject);
		});
		return def;
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

	generateFieldset(): quickFormElement {
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

		let tm = new Morebits.taskManager(this);
		tm.add(this.determineDiscussionPage, [])
		tm.add(this.tagPage, [this.determineDiscussionPage]);
		tm.add(this.addToList, [this.determineDiscussionPage]);
		tm.add(this.createDiscussionPage, [this.determineDiscussionPage]);
		tm.add(this.fetchCreatorInfo, []);
		tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
		tm.add(this.notifyUserspaceOwner, [this.fetchCreatorInfo]);
		tm.add(this.addToLog, [this.notifyCreator, this.notifyUserspaceOwner]);
		tm.execute().then(() => {
			Morebits.status.actionCompleted('Nomination completed, now redirecting to the discussion page');
			setTimeout(() => {
				window.location.href = mw.util.getUrl(this.params.discussionpage);
			}, 50000);
		});
	}

	determineDiscussionPage() {
		let params = this.params;
		let wikipedia_api = new Morebits.wiki.api('Looking for prior nominations of this page', {
			'action': 'query',
			'list': 'allpages',
			'apprefix': 'Miscellany for deletion/' + Morebits.pageNameNorm,
			'apnamespace': 4,
			'apfilterredir': 'nonredirects',
			'aplimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
		});
		return wikipedia_api.post().then((apiobj) => {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				params.numbering = params.number = '';
			} else {
				var number = 0;
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].getAttribute('title');

					// First, simple test, is there an instance with this exact name?
					if (title === 'Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var order_re = new RegExp('^' +
						Morebits.string.escapeRegExp('Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm) +
						'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				params.number = utils.num2order(parseInt(number, 10) + 1);
				params.numbering = number > 0 ? ' (' + params.number + ' nomination)' : '';
			}
			params.discussionpage = 'Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm + params.numbering;

			apiobj.getStatusElement().info('next in order is [[' + params.discussionpage + ']]');
		});
	}

	tagPage() {
		let params = this.params;
		let def = $.Deferred();
		var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page with deletion tag');
		pageobj.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
		pageobj.load((pageobj) => {
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
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('nocreate');
				pageobj.save(def.resolve, def.reject);
			} else {
				this.autoEditRequest(pageobj).then(def.resolve, def.reject);
			}
		});
		return def;
	}

	createDiscussionPage() {
		let params = this.params;
		let def = $.Deferred();
		let pageobj = new Morebits.wiki.page(params.discussionpage, 'Creating deletion discussion page');
		pageobj.load((pageobj) => {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(this.getDiscussionWikitext());
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				Xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
				def.resolve();
			}, def.reject);
		});
		return def;
	}

	getDiscussionWikitext(): string {
		return utils.makeTemplate('subst:mfd2', {
			text: Morebits.string.formatReasonText(this.params.reason, true),
			pg: Morebits.pageNameNorm
		});
	}

	addToList() {
		let params = this.params;
		let def = $.Deferred();
		let pageobj = new Morebits.wiki.page('Wikipedia:Miscellany for deletion', "Adding discussion to today's list");
		pageobj.setPageSection(2);
		pageobj.setFollowRedirect(true);
		pageobj.load((pageobj) => {
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
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			pageobj.save(def.resolve, def.reject);
		});
		return def;
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
		return mw.config.get('wgIsRedirect') || document.getElementById('softredirect');
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

	public generateFieldset(): quickFormElement {
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

	public evaluate() {
		super.evaluate();
		let tm = new Morebits.taskManager(this);
		tm.add(this.findTarget, []);
		tm.add(this.tagPage, [this.findTarget]);
		tm.add(this.addToList, [this.tagPage]);
		tm.add(this.fetchCreatorInfo, []);
		tm.add(this.notifyCreator, [this.fetchCreatorInfo, this.tagPage]);
		tm.add(this.notifyTargetTalk, [this.fetchCreatorInfo, this.tagPage]);
		tm.add(this.addToLog, [this.notifyCreator]);
		tm.execute().then(() => {
			Morebits.status.actionCompleted("Nomination completed, now redirecting to today's log");
			setTimeout(() => {
				window.location.href = mw.util.getUrl(this.params.logpage);
			}, Morebits.wiki.actionCompleted.timeOut);
		});
	}

	// Creates: params.rfdtarget, params.curtimestamp, params.section, params.logpage, params.discussionpage
	findTarget(): JQuery.Promise<void> {
		// Used by regular redirects to find the target, but for all redirects,
		// avoid relying on the client clock to build the log page
		var query = {
			'action': 'query',
			'curtimestamp': true
		};
		if (document.getElementById('softredirect')) {
			// For soft redirects, define the target early
			// to skip target checks in findTargetCallback
			this.params.rfdtarget = document.getElementById('softredirect').textContent.replace(/^:+/, '');
		} else {
			// Find current target of redirect
			query.titles = mw.config.get('wgPageName');
			query.redirects = true;
		}
		var wikipedia_api = new Morebits.wiki.api('Finding target of redirect', query);
		return wikipedia_api.post().then((apiobj) => {
			var $xmlDoc = $(apiobj.responseXML);
			this.params.curtimestamp = $xmlDoc.find('api').attr('curtimestamp');
			var date = new Morebits.date(this.params.curtimestamp);
			this.params.logpage = 'Wikipedia:Redirects for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
			this.params.discussionpage = this.params.logpage + '#' + Morebits.pageNameNorm;

			if (!this.params.rfdtarget) { // Not a softredirect
				var target = $xmlDoc.find('redirects r').first().attr('to');
				if (!target) {
					var message = 'No target found. this page does not appear to be a redirect, aborting';
					if (mw.config.get('wgAction') === 'history') {
						message += '. If this is a soft redirect, try again from the content page, not the page history.';
					}
					apiobj.getStatusElement().error(message);
					return $.Deferred().reject();
				}
				this.params.rfdtarget = target;
				this.params.section = $xmlDoc.find('redirects r').first().attr('tofragment');
			}
		});
	}

	// Creates: params.tagText
	tagPage(): JQuery.Promise<void> {
		let def = $.Deferred();
		let params = this.params;

		var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to redirect');
		pageobj.setFollowRedirect(false);
		pageobj.load((pageobj) => {
			var text = pageobj.getPageText();
			// Imperfect for edit request but so be it
			params.tagText = '{{subst:rfd|' + (mw.config.get('wgNamespaceNumber') === 10 ? 'showontransclusion=1|' : '') + 'content=\n';

			if (pageobj.canEdit()) {
				pageobj.setPageText(params.tagText + text + '\n}}');
				pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('nocreate');
				pageobj.save(def.resolve, def.reject);
			} else {
				Xfd.autoEditRequest(pageobj, params).then(def.resolve, def.reject);
			}
		});
		return def;
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
		let def = $.Deferred();
		let params = this.params;
		let pageobj = new Morebits.wiki.page(params.logpage, 'Adding discussion to today\'s log');
		pageobj.setFollowRedirect(true);
		pageobj.load((pageobj) => {
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
					return;
				}
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				def.resolve();
				Xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			}, def.reject);
		});
		return def;
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
		} else if (document.getElementById('softredirect')) {
			statelem.warn('Soft redirect; skipping target page notification');
			return $.Deferred().resolve();
			// Don't issue if target talk is the initial contributor's talk or your own
		} else if (targetTalk.getNamespaceId() === 3 && targetTalk.getNameText() === this.params.initialContrib) {
			statelem.warn('Target is initial contributor; skipping target page notification');
			return $.Deferred().resolve();
		} else if (targetTalk.getNamespaceId() === 3 && targetTalk.getNameText() === mw.config.get('wgUserName')) {
			statelem.warn('You (' + mw.config.get('wgUserName') + ') are the target; skipping target page notification');
			return $.Deferred().resolve();
		} else {
			return this.notifyTalkPage(targetTalk.toText(), statelem);
		}
	}
}


class Rm extends XfdMode {
	static venueCode = 'rm';
	static venueLabel = 'RM (Requested moves)';

	public getFieldsetLabel() {
		return 'Requested moves';
	}

	public generateFieldset(): quickFormElement {
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

	public getDiscussionWikitext(): string {
		let pageName = new mw.Title(Morebits.pageNameNorm).getSubjectPage().toText();
		let params = this.params;
		return (params.rmtr ?
			'{{subst:RMassist|1=' + pageName + '|2=' + params.newname :
			'{{subst:Requested move|current1=' + pageName + '|new1=' + params.newname)
			+ '|reason=' + params.reason + '}}';
	}

	showPreview(form: HTMLFormElement) {
		let templatetext = this.getDiscussionWikitext();
		form.previewer.beginRender(templatetext, this.params.rmtr ?
			'Wikipedia:Requested moves/Technical requests' :
			new mw.Title(Morebits.pageNameNorm).getTalkPage().toText());
	}

	evaluate() {
		super.evaluate();
		var nomPageName = this.params.rmtr ?
			'Wikipedia:Requested moves/Technical requests' :
			new mw.Title(Morebits.pageNameNorm).getTalkPage().toText();

		Morebits.wiki.actionCompleted.redirect = nomPageName;
		Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

		let pageobj = new Morebits.wiki.page(nomPageName, this.params.rmtr ? 'Adding entry at WP:RM/TR' : 'Adding entry on talk page');
		pageobj.setFollowRedirect(true);

		if (this.params.rmtr) {
			pageobj.setPageSection(2);
			pageobj.load((pageobj) => {
				var text = pageobj.getPageText();
				var statelem = pageobj.getStatusElement();
				var hiddenCommentRE = /---- and enter on a new line.* -->/;
				var newtext = text.replace(hiddenCommentRE, '$&\n' + this.getDiscussionWikitext());
				if (text === newtext) {
					statelem.error('failed to find target spot for the entry');
					return;
				}
				pageobj.setPageText(newtext);
				pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.save(() => {
					Xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
					// add this nomination to the user's userspace log
					this.addToLog();
				});
			});
		} else {
			// listAtTalk uses .append(), so no need to load the page
			this.listAtTalk(pageobj);
		}
	}

	listAtTalk(pageobj) {
		var params = this.params;
		pageobj.setAppendText('\n\n' + this.getDiscussionWikitext());
		pageobj.setEditSummary('Proposing move' + (params.newname ? ' to [[:' + params.newname + ']]' : ''));
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('recreate'); // since the talk page need not exist
		pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
		pageobj.append(() => {
			Xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			// add this nomination to the user's userspace log
			this.addToLog();
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

const {obj_entries} = Twinkle.shims;

class Template extends String {
	parameters: [name: string, value: string][]
	name: string
	constructor(name: string, parameters: any = {}) {
		super();
		this.name = name;
		this.parameters = obj_entries(parameters).filter(([k, v]) => !!v);
	}
	addParam(name: string, value: string) {
		this.parameters.push([name, value]);
	}
	toString() {
		return `{{${this.name}` +
			this.parameters.map(([name, value]) => {
				return `|${name}=${value}`;
			}).join('') + '}}';
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
			// Everybody up, inclduing rm and the terminal s in cfds
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


Xfd.modeList = [
	Rfd,
	Cfd,
	Rm,
	Cfds,
	Mfd,
	Ffd
];

Twinkle.addInitCallback(function() { new Xfd(); }, 'XFD');
