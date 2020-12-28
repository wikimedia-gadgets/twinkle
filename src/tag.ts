const {obj_entries, obj_values, arr_includes} = Twinkle.shims;

interface tagData {
	// name of the tag template, without namespace prefix (required)
	tag: string

	// brief description
	description?: string

	// list of quickForm inputs to query from the user if tag is added
	subgroup?: tagSubgroup | tagSubgroup[]

	// should the tag not be included in grouping template (default: false)
	excludeInGroup?: boolean

	// should the tag be substed instead of transcluded (default: false)
	subst?: boolean

	// should the tag be allowed to be added a second time (default: false)
	dupeAllowed?: boolean

	// should the tag be placed at the bottom of the page instead of top (default: false)
	placeBottom?: boolean
}

interface tagSubgroup extends quickFormElementData {
	parameter?: string
}

type tagListType = tagData[] | Record<string, (tagData[] | Record<string, tagData[]>)>

class Tag extends TwinkleModule {
	mode: TagMode
	static modeList: (typeof TagMode)[]

	constructor() {
		super();
		for (let mode of Tag.modeList) {
			if (mode.isActive()) {
				// @ts-ignore
				this.mode = new mode();
				break;
			}
		}
		if (!this.mode) { // no mode is active
			return;
		}
		this.portletName = 'Tag';
		this.portletId = 'friendly-tag';
		this.portletTooltip = this.mode.getMenuTooltip();
		this.addMenu();
	}

	makeWindow = () => {
		var Window = new Morebits.simpleWindow(630, 500);
		Window.setScriptName('Twinkle');
		// anyone got a good policy/guideline/info page/instructional page link??
		Window.addFooterLink('Twinkle help', 'WP:TW/DOC#tag');
		this.mode.makeForm(Window);
		this.mode.formRender();
		this.mode.postRender();
	}

	/**
	 * Adds a link to each template's description page
	 * @param {Morebits.quickForm.element} checkbox  associated with the template
	 */
	static makeArrowLinks(checkbox: HTMLInputElement) {
		var link = Morebits.htmlNode('a', '>');
		link.setAttribute('class', 'tag-template-link');
		var tagname = checkbox.values;
		link.setAttribute('href', mw.util.getUrl(
			(tagname.indexOf(':') === -1 ? 'Template:' : '') +
			(tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))
		));
		link.setAttribute('target', '_blank');
		$(checkbox).parent().append(['\u00A0', link]);
	}

	static makeEditSummary(addedTags: string[], removedTags?: string[], reason?: string): string {
		let makeTemplateLink = function(tag: string) {
			let text = '{{[[';
			// if it is a custom tag with a parameter
			if (tag.indexOf('|') !== -1) {
				tag = tag.slice(0, tag.indexOf('|'));
			}
			text += tag.indexOf(':') !== -1 ? tag : 'Template:' + tag + '|' + tag;
			return text + ']]}}';
		};
		let summaryText;
		if (addedTags.length) {
			summaryText = 'Added ' + mw.language.listToText(addedTags.map(makeTemplateLink));
			summaryText += removedTags?.length ? '; and removed ' +
				mw.language.listToText(removedTags.map(makeTemplateLink)) : '';
		} else {
			summaryText = 'Removed ' + mw.language.listToText(removedTags);
		}
		summaryText += ' tag' + (addedTags.length + removedTags?.length > 1 ? 's' : '');
		if (reason) {
			summaryText += ': ' + reason;
		}
		// avoid long summaries
		if (summaryText.length > 499) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
		}
		return summaryText;
	}
}

abstract class TagMode {
	abstract name: string
	abstract tagList: tagListType
	static tagList: tagListType; //
	flatObject: Record<string, tagData>
	existingTags: string[] = []

	Window: Morebits.simpleWindow
	form: Morebits.quickForm
	result: HTMLFormElement
	scrollbox: Morebits.quickForm.element
	params: Record<string, any>
	templateParams: Record<string, Record<string, string>>;
	pageText: string;

	static isActive() { // must be overridden
		return false;
	}

	removalSupported = false; // Override to true for modes that support untagging

	canRemove() {
		return this.removalSupported &&
			// Only on latest version of pages
			(mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
	}


	getMenuTooltip() {
		return 'Add maintenance tags to the page';
	}

	getWindowTitle() {
		return 'Add maintenance tags';
	}

	makeForm(Window) {
		this.Window = Window;
		this.Window.setTitle(this.getWindowTitle());
		this.form = new Morebits.quickForm(() => this.evaluate());

		this.constructFlatObject();

		this.form.append({
			type: 'input',
			label: 'Filter tag list: ',
			name: 'quickfilter',
			size: '30px',
			event: QuickFilter.onInputChange
		});

		if (this.removalSupported && !this.canRemove()) {
			this.form.append({
				type: 'div',
				name: 'untagnotice',
				label: Morebits.htmlNode('div',  'For removal of existing tags, please open Tag menu from the current version of article')
			});
		}

		this.scrollbox = this.form.append({
			type: 'div',
			id: 'tagWorkArea',
			className: 'morebits-scrollbox',
			style: 'max-height: 28em'
		});

		this.parseExistingTags();
		this.makeExistingTagList(this.scrollbox);
		this.makeTagList(this.scrollbox);
	}

	makeTagList(container: Morebits.quickForm.element) {
		if (Array.isArray(this.tagList)) {
			this.makeTagListGroup(this.tagList, container);
		} else {
			$.each(this.tagList, (groupName, group) => {
				container.append({ type: 'header', label: groupName });
				if (Array.isArray(group)) { // if group is a list of tags
					this.makeTagListGroup(group, container);
				} else { // if group is a list of subgroups
					let subdiv = container.append({ type: 'div' });
					$.each(group, (subgroupName: string, subgroup: any[]) => {
						subdiv.append({ type: 'div', label: [Morebits.htmlNode('b', subgroupName)] });
						this.makeTagListGroup(subgroup, subdiv);
					});
				}
			});
		}
	}

	// helper function for makeTagList()
	makeTagListGroup(list: tagData[], container?: Morebits.quickForm.element | Morebits.quickForm) {

		let excludeTags = new Set(this.existingTags.filter(t => !this.flatObject[t]?.dupeAllowed));
		container.append({
			type: 'checkbox',
			name: 'tags',
			list: list.filter(item => !excludeTags.has(item.tag)).map((item) => ({
				label: '{{' + item.tag + '}}' + (item.description ? ': ' + item.description : ''),
				value: item.tag,
				subgroup: item.subgroup
			}))
		});
	}

	makeExistingTagList(container: Morebits.quickForm.element) {
		if (!this.existingTags.length) {
			return;
		}
		container.append({ type: 'header', label: 'Tags already present' });

		let tagConfigs = this.existingTags.map((tag) => {
			return this.flatObject[tag] || { tag };
		});
		container.append({
			type: 'checkbox',
			name: 'existingTags',
			list: tagConfigs.map((item) => ({
				label: '{{' + item.tag + '}}' + (item.description ? ': ' + item.description : ''),
				value: item.tag,
				checked: true,
				style: 'font-style: italic'
			}))
		});
	}

	/**
	 * Parse existing tags. This is NOT asynchronous.
	 * Should be overridden for tag modes where removalSupported is true
	 */
	parseExistingTags() {}

	constructFlatObject() {
		this.flatObject = {};

		if (Array.isArray(this.tagList)) {
			// this.tagList is of type tagData[]
			this.tagList.forEach((item) => {
				this.flatObject[item.tag] = item;
			});
		} else {
			obj_values(this.tagList).forEach((group: tagData[] | Record<string, tagData[]>) => {
				obj_values(group).forEach((subgroup: tagData | tagData[]) => {
					if (Array.isArray(subgroup)) {
						subgroup.forEach((item) => {
							this.flatObject[item.tag] = item;
						});
					} else {
						this.flatObject[subgroup.tag] = subgroup;
					}
				});
			});
		}
	}

	formAppendPatrolLink() {
		if (!document.getElementsByClassName('patrollink').length) {
			return;
		}
		this.form.append({
			type: 'checkbox',
			list: [{
				label: 'Mark the page as patrolled/reviewed',
				value: 'patrol',
				name: 'patrol',
				checked: Twinkle.getPref('markTaggedPagesAsPatrolled')
			}]
		});
	}

	formRender() {
		this.form.append({
			type: 'submit',
			className: 'tw-tag-submit'
		});
		this.result = this.form.render();
		this.Window.setContent(this.result);
		this.Window.display();
	}

	postRender() {
		QuickFilter.init(this.result);
		Morebits.quickForm.getElements(this.result, 'tags').forEach(Tag.makeArrowLinks);
		Morebits.quickForm.getElements(this.result, 'existingTags').forEach(Tag.makeArrowLinks);

		// style adjustments
		$(this.scrollbox).find('h5').css({ 'font-size': '110%' });
		$(this.scrollbox).find('h5:not(:first-child)').css({ 'margin-top': '1em' });
		$(this.scrollbox).find('div').filter(':has(span.quickformDescription)').css({ 'margin-top': '0.4em' });

		// Add status text node after Submit button
		let $status = $('<small>').attr('id', 'tw-tag-status');
		$status.insertAfter($('button.tw-tag-submit'));
		let addedCount = 0, removedCount = 0;

		// tally tags added/removed, update statusNode text
		$('[name=tags], [name=existingTags]').on('click', (e) => {
			let checkbox = e.target as HTMLInputElement;
			if (checkbox.name === 'tags') {
				addedCount += checkbox.checked ? 1 : -1;
			} else if (checkbox.name === 'existingTags') {
				removedCount += checkbox.checked ? -1 : 1;
			}

			let firstPart = `Adding ${addedCount} tag${addedCount > 1 ? 's' : ''}`;
			let secondPart = `Removing ${removedCount} tag${removedCount > 1 ? 's' : ''}`;
			let statusText = (addedCount ? firstPart : '') + (removedCount ? (addedCount ? '; ' : '') + secondPart : '');
			$status.text('  ' + statusText);
		});
	}

	evaluate() {
		this.captureFormData();
		let validationMessage = this.checkInputs();
		if (validationMessage) {
			return alert(validationMessage);
		}
		this.preprocessParams();
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(this.result);
		this.action().then(() => {
			Morebits.status.actionCompleted(`Tagging complete, reloading ${this.name} in a few seconds`);
			setTimeout(() => {
				window.location.href = mw.util.getUrl(Morebits.pageNameNorm, {redirect: 'no'});
			}, 1e9);
		});
	}

	captureFormData() {
		this.params = Morebits.quickForm.getInputData(this.result);
		this.params.tagsToRemove = this.result.getUnchecked('existingTags'); // XXX: Morebits-defined function
		this.params.tagsToRetain = this.params.existingTags || [];
	}

	checkInputs(): string | void {
		// Check if any tag is selected or if any already present tag is deselected
		if (this.params.tags.length === 0 && (!this.canRemove() || this.params.tagsToRemove.length === 0)) {
			return 'You must select at least one tag!';
		}
		return this.validateInput();
	}

	/**
	 * If inputs are invalid, return a string that is shown to the user via alert().
	 * If inputs are valid, don't return anything.
	 */
	validateInput(): string | void {}

	preprocessParams() {
		this.getTemplateParameters();
	}

	getTemplateParameters() {
		this.templateParams = {};
		this.params.tags.forEach(tag => {
			this.templateParams[tag] = {};
			let subgroupObj = this.flatObject[tag] && this.flatObject[tag].subgroup;
			makeArray(subgroupObj).forEach((gr) => {
				if (gr.parameter && (this.params[gr.name] || gr.required)) {
					this.templateParams[tag][gr.parameter] = this.params[gr.name] || '';
				}
			});
		});
	}

	/**
	 * This function is for the actions that take place when the form is submitted,
	 * assuming the validations are all clear.
	 * Must be extended in the child classes.
	 */
	abstract action(): JQuery.Promise<void>;

	getTagText(tag: string) {
		let subst = this.flatObject[tag] && this.flatObject[tag].subst ? 'subst:' : '';
		return '{{' + subst + tag + this.getParameterText(tag) + '}}';
	}

	getParameterText(tag: string) {
		if (!this.templateParams[tag]) {
			mw.log.warn('this.templateParams[tag] undefined');
			return '';
		}
		return obj_entries(this.templateParams[tag]).map(([key, value]) => {
			return `|${key}=${value}`;
		}).join('');
	}

	makeTagSetText(tags: string[]) {
		return tags.map(tag => this.getTagText(tag) + '\n').join('');
	}

}

class QuickFilter {
	static $allCheckboxDivs: JQuery
	static $allHeaders: JQuery

	static init(result: HTMLFormElement) {
		QuickFilter.$allCheckboxDivs = $(result).find('[name=tags], [name=existingTags]').parent();
		QuickFilter.$allHeaders = $(result).find('h5, .quickformDescription');
		result.quickfilter.focus(); // place cursor in the quick filter field as soon as window is opened
		result.quickfilter.autocomplete = 'off'; // disable browser suggestions
		result.quickfilter.addEventListener('keypress', function (e) {
			if (e.keyCode === 13) { // prevent enter key from accidentally submitting the form
				e.preventDefault();
				return false;
			}
		});
	}
	static onInputChange(this: HTMLInputElement) {
		// flush the DOM of all existing underline spans
		QuickFilter.$allCheckboxDivs.find('.search-hit').each(function (i, e) {
			var label_element = e.parentElement;
			// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
			// to <label>Hello world</label>
			label_element.innerHTML = label_element.textContent;
		});

		if (this.value) {
			QuickFilter.$allCheckboxDivs.hide();
			QuickFilter.$allHeaders.hide();
			var searchString = this.value;
			var searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');

			QuickFilter.$allCheckboxDivs.find('label').each(function () {
				var label_text = this.textContent;
				var searchHit = searchRegex.exec(label_text);
				if (searchHit) {
					var range = document.createRange();
					var textnode = this.childNodes[0];
					range.selectNodeContents(textnode);
					range.setStart(textnode, searchHit.index);
					range.setEnd(textnode, searchHit.index + searchString.length);
					var underline_span = $('<span>').addClass('search-hit').css('text-decoration', 'underline')[0];
					range.surroundContents(underline_span);
					this.parentElement.style.display = 'block'; // show
				}
			});
		} else {
			QuickFilter.$allCheckboxDivs.show();
			QuickFilter.$allHeaders.show();
		}
	}
}


class RedirectMode extends TagMode {
	name = 'redirect';
	tagList = Twinkle.RedirectModeTagList;

	static isActive() {
		return Morebits.isPageRedirect();
	}

	getMenuTooltip() {
		return 'Tag redirect';
	}

	getWindowTitle() {
		return 'Redirect tagging';
	}

	makeForm(Window) {
		super.makeForm(Window);

		if (Twinkle.getPref('customRedirectTagList').length) {
			this.scrollbox.append({ type: 'header', label: 'Custom tags' });
			this.scrollbox.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customRedirectTagList') });
		}

		this.formAppendPatrolLink();
	}

	action() {
		let def = $.Deferred();
		var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
		wikipedia_page.load((pageobj: Morebits.wiki.page) => {
			var pageText = pageobj.getPageText(),
				tagRe, tagText = '', tags = [], i;

			for (i = 0; i < this.params.tags.length; i++) {
				tagRe = new RegExp('(\\{\\{' + this.params.tags[i] + '(\\||\\}\\}))', 'im');
				if (!tagRe.exec(pageText)) {
					tags.push(this.params.tags[i]);
				} else {
					Morebits.status.warn('Info', 'Found {{' + this.params.tags[i] +
						'}} on the redirect already...excluding');
				}
			}

			if (!tags.length) {
				Morebits.status.warn('Info', 'No tags remaining to apply');
				return;
			}

			tags.forEach((tag) => {
				tagText += '\n' + this.getTagText(tag);
			});

			// Check for all Rcat shell redirects (from #433)
			if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
				// Regex inspired by [[User:Kephir/gadgets/sagittarius.js]] ([[Special:PermaLink/831402893]])
				var oldTags = pageText.match(/(\s*{{[A-Za-z ]+\|)((?:[^|{}]*|{{[^}]*}})+)(}})\s*/i);
				pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
			} else {
				// Fold any pre-existing Rcats into taglist and under Rcatshell
				var pageTags = pageText.match(/\s*{{R(?:edirect)? .*?}}/img);
				var oldPageTags = '';
				if (pageTags) {
					pageTags.forEach(function(pageTag) {
						var pageRe = new RegExp(pageTag, 'img');
						pageText = pageText.replace(pageRe, '');
						pageTag = pageTag.trim();
						oldPageTags += '\n' + pageTag;
					});
				}
				pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(Tag.makeEditSummary(tags));
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.save(def.resolve, def.reject);

			if (this.params.patrol) {
				pageobj.triage();
			}

		});
		return def;
	}

}

class FileMode extends TagMode {
	name = 'file';
	tagList = Twinkle.FileModeTagList;

	static isActive() {
		return mw.config.get('wgNamespaceNumber') === 6 &&
			!document.getElementById('mw-sharedupload') &&
			!!document.getElementById('mw-imagepage-section-filehistory');
	}

	getMenuTooltip() {
		return 'Add maintenance tags to file';
	}

	getWindowTitle() {
		return 'File maintenance tagging';
	}

	makeForm(Window) {
		super.makeForm(Window);

		if (Twinkle.getPref('customFileTagList').length) {
			this.scrollbox.append({ type: 'header', label: 'Custom tags' });
			this.scrollbox.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customFileTagList') });
		}

		this.formAppendPatrolLink();
	}

	validateInput() {
		// Given an array of incompatible tags, check if we have two or more selected
		var params = this.params, tags = this.params.tags;

		let incompatibleSets = [
			['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'],
			['Should be PNG', 'Should be SVG', 'Should be text'],
			['Bad SVG', 'Vector version available'],
			['Bad JPEG', 'Overcompressed JPEG'],
			['PNG version available', 'Vector version available']
		];
		for (let set of incompatibleSets) {
			if (set.filter(t => arr_includes(tags, t)).length > 1) {
				return 'Please select only one of: {{' + set.join('}}, {{') + '}}.';
			}
		}

		// Get extension from either mime-type or title, if not present (e.g., SVGs)
		var extension = ((extension = $('.mime-type').text()) && extension.split(/\//)[1]) ||
			mw.Title.newFromText(Morebits.pageNameNorm).getExtension();
		if (extension) {
			var extensionUpper = extension.toUpperCase();
			// What self-respecting file format has *two* extensions?!
			if (extensionUpper === 'JPG') {
				extension = 'JPEG';
			}

			// Check that selected templates make sense given the file's extension.

			// Bad GIF|JPEG|SVG
			var badIndex; // Keep track of where the offending template is so we can reference it below
			if ((extensionUpper !== 'GIF' && ((badIndex = tags.indexOf('Bad GIF')) !== -1)) ||
				(extensionUpper !== 'JPEG' && ((badIndex = tags.indexOf('Bad JPEG')) !== -1)) ||
				(extensionUpper !== 'SVG' && ((badIndex = tags.indexOf('Bad SVG')) !== -1))) {
				var suggestion = 'This appears to be a ' + extension + ' file, ';
				if (['GIF', 'JPEG', 'SVG'].indexOf(extensionUpper) !== -1) {
					suggestion += 'please use {{Bad ' + extensionUpper + '}} instead.';
				} else {
					suggestion += 'so {{' + tags[badIndex] + '}} is inappropriate.';
				}
				return suggestion;
			}
			// Should be PNG|SVG
			if ((tags.toString().indexOf('Should be ') !== -1) && (tags.indexOf('Should be ' + extensionUpper) !== -1)) {
				return 'This is already a ' + extension + ' file, so {{Should be ' + extensionUpper + '}} is inappropriate.';
			}

			// Overcompressed JPEG
			if (tags.indexOf('Overcompressed JPEG') !== -1 && extensionUpper !== 'JPEG') {
				return 'This appears to be a ' + extension + ' file, so {{Overcompressed JPEG}} probably doesn\'t apply.';
			}
			// Bad trace and Bad font
			if (extensionUpper !== 'SVG') {
				if (tags.indexOf('Bad trace') !== -1) {
					return 'This appears to be a ' + extension + ' file, so {{Bad trace}} probably doesn\'t apply.';
				} else if (tags.indexOf('Bad font') !== -1) {
					return 'This appears to be a ' + extension + ' file, so {{Bad font}} probably doesn\'t apply.';
				}
			}
		}

		if (tags.indexOf('Do not move to Commons') !== -1 && params.DoNotMoveToCommons_expiry &&
			(!/^2\d{3}$/.test(params.DoNotMoveToCommons_expiry) || parseInt(params.DoNotMoveToCommons_expiry, 10) <= new Date().getFullYear())) {
			return 'Must be a valid future year.';
		}
	}

	initialCleanup() {
		this.params.tags.forEach((tag) => {
			switch (tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				case 'Keep local':
				case 'Now Commons':
				case 'Do not move to Commons':
					this.pageText = this.pageText.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
					break;

				case 'Vector version available':
					this.pageText = this.pageText.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, '');
					break;

				case 'Orphaned non-free revisions':
					// remove {{non-free reduce}} and redirects
					this.pageText = this.pageText.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
					break;

				default:
					break;
			}
		});
	}

	action() {
		let params = this.params;
		let def = $.Deferred();
		let pageobj = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
		pageobj.load((pageobj: Morebits.wiki.page) => {
			this.pageText = pageobj.getPageText();
			this.initialCleanup();
			this.pageText = this.makeTagSetText(params.tags) + '\n' + this.pageText;

			pageobj.setPageText(this.pageText);
			pageobj.setEditSummary(Tag.makeEditSummary(params.tags));
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(def.resolve, def.reject);

			if (params.patrol) {
				pageobj.triage();
			}
		}, def.reject);
		return def;

	}
}

class ArticleMode extends TagMode {
	name = 'article';
	tagList = Twinkle.ArticleModeTagList;
	removalSupported = true;

	pageobj: Morebits.wiki.page
	params: {
		newTags: string[]
		existingTags: string[]
		tagsToRemove: string[]
		tagsToRetain: string[]
		groupableExistingTags: string[]
		groupableNewTags: string[]
		nonGroupableNewTags: string[]
		groupableExistingTagsText: string
		[paramName: string]: any
	}

	// Configurations
	groupTemplateNameRegex = '(?:multiple ?issues|article ?issues|mi)(?!\\s*\\|\\s*section\\s*=)';
	groupTemplateNameRegexFlags = 'i';
	groupMinSize = 2;

	static isActive() {
		return [0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 &&
			mw.config.get('wgCurRevisionId'); // check if page exists
	}

	getMenuTooltip() {
		return 'Add or remove article maintenance tags';
	}

	getWindowTitle() {
		return 'Article maintenance tagging';
	}

	makeForm(Window) {
		super.makeForm(Window);

		// append any custom tags
		if (Twinkle.getPref('customTagList').length) {
			this.scrollbox.append({ type: 'header', label: 'Custom tags' });
			this.scrollbox.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customTagList') });
		}

		this.form.append({
			type: 'checkbox',
			list: [{
				label: 'Group inside {{multiple issues}} if possible',
				value: 'group',
				name: 'group',
				tooltip: 'If applying two or more templates supported by {{multiple issues}} and this box is checked, all supported templates will be grouped inside a {{multiple issues}} template.',
				checked: Twinkle.getPref('groupByDefault')
			}]
		});

		this.form.append({
			type: 'input',
			label: 'Reason',
			name: 'reason',
			tooltip: 'Optional reason to be appended in edit summary. Recommended when removing tags.',
			size: '60px'
		});

		this.formAppendPatrolLink();
	}

	parseExistingTags() {
		this.existingTags = [];
		if (!this.canRemove()) {
			return;
		}

		// All tags are HTML table elements that are direct children of .mw-parser-output,
		// except when they are within {{multiple issues}}
		$('.mw-parser-output').children().each((i, e) => {

			// break out on encountering the first heading, which means we are no
			// longer in the lead section
			if (e.tagName === 'H2') {
				return false;
			}

			// The ability to remove tags depends on the template's {{ambox}} |name=
			// parameter bearing the template's correct name (preferably) or a name that at
			// least redirects to the actual name

			// All tags have their first class name as "box-" + template name
			if (e.className.indexOf('box-') === 0) {
				if (e.classList[0] === 'box-Multiple_issues') {
					$(e).find('.ambox').each( (idx, e) => {
						var tag = e.classList[0].slice(4).replace(/_/g, ' ');
						this.existingTags.push(tag);
					});
					return; // continue
				}

				var tag = e.classList[0].slice(4).replace(/_/g, ' ');
				this.existingTags.push(tag);
			}
		});

		// {{Uncategorized}} and {{Improve categories}} are usually placed at the end
		if ($('.box-Uncategorized').length) {
			this.existingTags.push('Uncategorized');
		}
		if ($('.box-Improve_categories').length) {
			this.existingTags.push('Improve categories');
		}
	}

	// Tagging process:
	/// Initial cleanup
	/// Checking if group is present, or if it needs to be added
	/// Adding selected tags
	/// Putting existing tags into group if it's being added
	/// Removing unselected existing tags
	/// Final cleanup
	/// Save

	validateInput() {
		let params = this.params, tags = params.tags;
		if (['Merge', 'Merge from', 'Merge to'].filter(t => arr_includes(tags, t)).length > 1) {
			return 'Please select only one of {{Merge}}, {{Merge from}} and {{Merge to}}. If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).';
		}
		if ((params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1) {
			return 'Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.';
		}
		if (['Not English', 'Rough translation'].filter(t => arr_includes(tags, t)).length > 1) {
			return 'Please select only one of {{Not English}} and {{Rough translation}}..';
		}
	}

	preprocessParams() {
		super.preprocessParams();
		let params = this.params;

		params.tags.forEach(tag => {
			switch (tag) {
				case 'Not English':
				case 'Rough translation':
					if (params.translationPostAtPNT) {
						this.templateParams[tag].listed = 'yes';
					}
					break;
				case 'Merge':
				case 'Merge to':
				case 'Merge from':
					params.mergeTag = tag;
					// normalize the merge target for now and later
					params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

					this.templateParams[tag]['1'] = params.mergeTarget;

					// link to the correct section on the talk page, for article space only
					if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
						if (!params.discussArticle) {
							// discussArticle is the article whose talk page will contain the discussion
							params.discussArticle = tag === 'Merge to' ? params.mergeTarget : mw.config.get('wgTitle');
							// nonDiscussArticle is the article which won't have the discussion
							params.nonDiscussArticle = tag === 'Merge to' ? mw.config.get('wgTitle') : params.mergeTarget;
							var direction = '[[' + params.nonDiscussArticle + ']]' + (params.mergeTag === 'Merge' ? ' with ' : ' into ') + '[[' + params.discussArticle + ']]';
							params.talkDiscussionTitleLinked = 'Proposed merge of ' + direction;
							params.talkDiscussionTitle = params.talkDiscussionTitleLinked.replace(/\[\[(.*?)\]\]/g, '$1');
						}
						this.templateParams[tag].discuss = 'Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
					}
					break;
				default:
					break;
			}
		});
	}

	action() {
		let def = $.Deferred();
		this.pageobj = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
		this.pageobj.load((pageobj) => {
			this.pageText = pageobj.getPageText();
			this.initialCleanup();
			this.sortTags();
			$.when(this.addAndRearrangeTags(), this.removeTags()).then(() => {
				this.finalCleanup();
				this.savePage().then(def.resolve, def.reject);
			}, def.reject);
		}, def.reject);
		return def;
	}

	initialCleanup() {
		this.pageText = this.pageText
			.replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
	}

	getTagSearchRegex(tag) {
		return new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
	}

	getTagRemovalRegex(tag) {
		return new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
	}

	/**
	 * Create params.newTags, params.groupableNewTags, params.groupableExistingTags
	 * Any tags to be added at the bottom of the page get added in this function itself.
	 */
	sortTags() {
		let params = this.params;
		params.newTags = params.tags.filter(tag => {
			let exists = this.getTagSearchRegex(tag).test(this.pageText);
			if (exists && (!this.flatObject[tag] || !this.flatObject[tag].dupeAllowed)) {
				Morebits.status.warn('Info', `Found {{${tag}}} on the article already...excluding`);

				// XXX: don't do anything else with merge tags: handle this better!
				if (['Merge', 'Merge to'].indexOf(tag) !== -1) {
					params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
				}
			} else {
				return true;
			}
		});
		params.groupableExistingTags = params.tagsToRetain.filter(tag => {
			// If the tag is unknown to us (not in flatObject), we consider it non-groupable
			return this.flatObject[tag] && !this.flatObject[tag].excludeInGroup;
		});
		params.groupableNewTags = [];
		params.nonGroupableNewTags = [];
		params.newTags.forEach(tag => {
			// Custom tags are assumed non-groupable
			if (this.flatObject[tag] && !this.flatObject[tag].excludeInGroup) {
				params.groupableNewTags.push(tag);
			} else {
				if (this.flatObject[tag] && this.flatObject[tag].placeBottom) {
					this.addBottom(this.getTagText(tag));
				} else {
					params.nonGroupableNewTags.push(tag);
				}
			}
		});
	}

	addBottom(tagText) {
		this.pageText += '\n\n' + tagText;
	}

	groupRegex() {
		let regexString = '\\{\\{\\s*(' + this.groupTemplateNameRegex + ')\\s*(?:\\||\\}\\})';
		return new RegExp(regexString, this.groupTemplateNameRegexFlags);
	}

	shouldAddGroup() {
		let params = this.params;
		return params.group &&
			(params.groupableExistingTags.length + params.groupableNewTags.length) >= this.groupMinSize;
	}

	/**
	 * Adds new tags to pageText. If there are existing tags which are groupable but outside the
	 * group, they are put into it.
	 */
	addAndRearrangeTags() {
		let params = this.params;

		/// Case 1. Group exists. New groupable tags put into group. Existing groupable tags that were outside are also put in.
		if (this.groupRegex().test(this.pageText)) {
			Morebits.status.info('Info', 'Adding supported tags inside existing {{multiple issues}} tag');

			this.addTagsOutsideGroup(params.nonGroupableNewTags);

			// ensure all groupable existing tags are in group
			return this.spliceGroupableExistingTags().then((groupableExistingTagsText) => {
				this.addTagsIntoGroup(groupableExistingTagsText + this.makeTagSetText(params.groupableNewTags));
			});

		/// Case 2. No group exists, but should be added. Group created. Existing groupable tags are put in it. New groupable tags also put in it.
		} else if (this.shouldAddGroup()) {
			Morebits.status.info('Info', 'Grouping supported tags inside {{multiple issues}}');

			return this.spliceGroupableExistingTags().then(groupableExistingTagsText => {
				let groupedTagsText = '{{Multiple issues|\n' +
					this.makeTagSetText(params.groupableNewTags) +
					groupableExistingTagsText +
					'}}';
				let ungroupedTagsText = this.makeTagSetText(params.nonGroupableNewTags);
				this.pageText = this.insertTagText(groupedTagsText + '\n' + ungroupedTagsText,
					this.pageText);
			});

		/// Case 3. No group exists, no group to be added
		} else {
			this.addTagsOutsideGroup(params.groupableNewTags.concat(params.nonGroupableNewTags));
			return $.Deferred().resolve();
		}
		// If group needs to be removed because of removal of tags, that's handled in final cleanup, not here.
	}

	/**
	 * Given that the group exists on `pageText` (either added by us now or existed before),
	 * move given `tagText` into the group
	 */
	addTagsIntoGroup(tagText: string) {
		if (!tagText) {
			if (tagText === undefined) throw new Error('tagText undefined');
			return;
		}
		let groupRgxExec = this.groupRegex().exec(this.pageText);
		// Add new tags into group, and put the updated group wikitext into this.pageText
		let miRegex = new RegExp(
			'(\\{\\{\\s*' + // Opening braces
			groupRgxExec[1] + // template name
			'\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)' +
			'\\}\\}\\s*' // Closing braces, followed by spaces/newlines
			, 'im');
		this.pageText = this.pageText.replace(miRegex, '$1' + tagText + '}}\n');
	}

	addTagsOutsideGroup(tags) {
		let tagText = this.makeTagSetText(tags);
		this.pageText = this.insertTagText(tagText, this.pageText);
	}

	/**
	 * If the tag is present in pageText, removes it from pageText and adds it to
	 * params.groupableExistingTagsText.
	 * @param tag
	 */
	shiftTag(tag): boolean {
		let isShifted = false; // Avoid a .test() before the .replace() causing 2 regex searches
		this.pageText = this.pageText.replace(this.getTagRemovalRegex(tag), (tagText) => {
			isShifted = true;
			this.params.groupableExistingTagsText += tagText.trim() + '\n'; // add to groupableExistingTagsText
			return ''; // remove from pageText
		});
		return isShifted;
	}

	spliceGroupableExistingTags(): JQuery.Promise<string> {
		this.params.groupableExistingTagsText = '';
		let tagsToShiftAsync = this.params.groupableExistingTags.filter(tag => {
			return !this.shiftTag(tag);
		});
		if (tagsToShiftAsync.length === 0) {
			return $.Deferred().resolve(this.params.groupableExistingTagsText);
		}

		let api = new Morebits.wiki.api('Getting template redirects', this.getRedirectsQuery(tagsToShiftAsync));
		return api.post().then((apiobj) => {
			var pages = apiobj.getResponse().query.pages.filter(function(p) {
				return !p.missing && !!p.linkshere;
			});
			pages.forEach(page => {
				let shifted: boolean = this.shiftTag(stripNs(page.title));
				if (!shifted) {
					shifted = page.linkshere.some(template => {
						let tag = stripNs(template.title);
						return this.shiftTag(tag);
					});
				}
				if (!shifted) { // unnecessary message?
					new Morebits.status('Note', 'Failed to find {{' +
						stripNs(page.title) + '}} on the page... skip repositioning');
				}
			});
			return this.params.groupableExistingTagsText;
		});
	}

	/**
	 * Inserts `tagText` (the combined wikitext of one or more tags) to the top of the
	 * pageText at the correct position, taking account of any existing hatnote templates.
	 * @param tagText
	 * @param pageText
	 */
	insertTagText(tagText: string, pageText: string) {
		// Insert tag after short description or any hatnotes,
		// as well as deletion/protection-related templates
		var wikipage = new Morebits.wikitext.page(pageText);
		var templatesAfter = Twinkle.hatnoteRegex +
			// Protection templates
			'pp|pp-.*?|' +
			// CSD
			'db|delete|db-.*?|speedy deletion-.*?|' +
			// PROD
			'(?:proposed deletion|prod blp)\\/dated(?:\\s*\\|(?:concern|user|timestamp|help).*)+|' +
			// not a hatnote, but sometimes under a CSD or AfD
			'salt|proposed deletion endorsed';
		// AfD is special, as the tag includes html comments before and after the actual template
		// trailing whitespace/newline needed since this subst's a newline
		var afdRegex = '(?:<!--.*AfD.*\\n\\{\\{(?:Article for deletion\\/dated|AfDM).*\\}\\}\\n<!--.*(?:\\n<!--.*)?AfD.*(?:\\s*\\n))?';
		return wikipage.insertAfterTemplates(tagText, templatesAfter, null, afdRegex).getText();
	}

	getTagText(tag) {
		return '{{' + tag + this.getParameterText(tag) +
			'|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
	}

	/**
	 * Remove tag from pageText, if it exists.
	 * @param tag
	 * @returns true if tag was removed, false otherwise
	 */
	removeTemplate(tag): boolean {
		let isRemoved = false; // Avoid a .test() before the .replace() causing 2 regex searches
		this.pageText = this.pageText.replace(this.getTagRemovalRegex(tag), () => {
			isRemoved = true;
			return '';
		});
		return isRemoved;
	}

	getRedirectsQuery(tags: string[]) {
		return {
			'action': 'query',
			'prop': 'linkshere',
			'titles': tags.map(pg => 'Template:' + pg),
			'redirects': 1,  // follow redirect if the class name turns out to be a redirect page
			'lhnamespace': '10',  // template namespace only
			'lhshow': 'redirect',
			'lhlimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'format': 'json'
		};
	}

	/**
	 * Remove tags from pageText
	 */
	removeTags(): JQuery.Promise<void> {
		let def = $.Deferred();
		let params = this.params;
		if (!params.tagsToRemove.length) {
			return def.resolve();
		}
		Morebits.status.info('Untagging', 'Already present tags: removing de-selected tags');

		let tagsToRemoveAsync = params.tagsToRemove.filter(tag => {
			return !this.removeTemplate(tag);
		});

		if (tagsToRemoveAsync.length === 0) {
			return def.resolve();
		}

		// Remove tags which appear in page text as redirects
		let statusMessage = `Getting redirects for ${mw.language.listToText(tagsToRemoveAsync.map(t => '{{' + t + '}}'))}`;
		let api = new Morebits.wiki.api(statusMessage, this.getRedirectsQuery(tagsToRemoveAsync));
		return api.post().then((apiobj) => {
			let pages = apiobj.getResponse().query.pages.filter(p => {
				return (!p.missing && !!p.linkshere) || Morebits.status.warn('Info', 'Failed to find {{' +
						stripNs(p.title) + '}} on the page... excluding');
			});
			(apiobj.getResponse().query.redirects || []).forEach(({from,  to}) => {
				new Morebits.status('Note', `Resolved template redirect {{${stripNs(from)}}} to {{${stripNs(to)}}}`);
			});
			pages.forEach(page => {
				let removed: boolean = this.removeTemplate(stripNs(page.title));
				if (!removed) {
					removed = page.linkshere.some(template => {
						let tag = stripNs(template.title);
						return this.removeTemplate(tag);
					});
				}
				if (!removed) {
					Morebits.status.warn('Note', 'Failed to find {{' +
						stripNs(page.title) + '}} on the page... cannot remove');
				}
			});
		});
	}

	finalCleanup() {
		// Remove any groups containing less than minGroupSize tags

		// XXX: This might misbehave if existing tags in the MI have parameters
		// that contain nested templates.
		// TODO: use regex-less parsing.

		const nItemGroupRegex = (n: number) => {
			let start = '\\{\\{\\s*' + this.groupTemplateNameRegex + '\\s*\\|\\s*(';
			let tags = '(?:\\{\\{[^}]+\\}\\}\\s*){' + n + '}';
			let end = ')\\}\\}\\n?';
			let regexString = start + tags + end;
			return new RegExp(regexString, this.groupTemplateNameRegexFlags);
		}

		// unbind substs of time parser functions
		let unbinder = new Morebits.unbinder(this.pageText);
		unbinder.unbind('\\{\\{subst:CURRENT', '\\}\\}');

		for (let i = 0; i < this.groupMinSize; i++) {
			unbinder.content = unbinder.content.replace(nItemGroupRegex(i), '$1');
		}
		this.pageText = unbinder.rebind();
	}



	savePage() {
		let def = $.Deferred();
		this.pageobj.setPageText(this.pageText);
		this.pageobj.setEditSummary(Tag.makeEditSummary(this.params.tags, this.params.tagsToRemove, this.params.reason));
		this.pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		this.pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		this.pageobj.setCreateOption('nocreate');
		this.pageobj.setChangeTags(Twinkle.changeTags);
		this.pageobj.save((pageobj) => {
			this.postSave(pageobj).then(def.resolve, def.reject);
		}, def.reject);

		if (this.params.patrol) {
			this.pageobj.triage();
		}
		return def;
	}

	postSave(pageobj: Morebits.wiki.page) {
		let params = this.params;
		let def = $.Deferred();

		// special functions for merge tags
		if (params.mergeReason) {
			// post the rationale on the talk page (only operates in main namespace)
			var talkpage = new Morebits.wiki.page('Talk:' + params.discussArticle, 'Posting rationale on talk page');
			talkpage.setNewSectionText(params.mergeReason.trim() + ' ~~~~');
			talkpage.setNewSectionTitle(params.talkDiscussionTitleLinked);
			talkpage.setChangeTags(Twinkle.changeTags);
			talkpage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
			talkpage.setCreateOption('recreate');
			talkpage.newSection(def.resolve, def.reject);
		}

		if (params.mergeTagOther) {
			// tag the target page if requested
			var otherTagName = 'Merge';
			if (params.mergeTag === 'Merge from') {
				otherTagName = 'Merge to';
			} else if (params.mergeTag === 'Merge to') {
				otherTagName = 'Merge from';
			}
			var otherpage = new Morebits.wiki.page(params.mergeTarget, 'Tagging other page (' +
				params.mergeTarget + ')');
			otherpage.setChangeTags(Twinkle.changeTags);
			otherpage.load((otherpage) => {
				this.templateParams[otherTagName] = { // these will be accessed by this.getTagText()
					1: Morebits.pageNameNorm,
					discuss: this.templateParams[params.mergeTag].discuss || ''
				};
				// XXX: check if {{Merge from}} or {{Merge}} tag already exists?
				let pageText = this.insertTagText(this.getTagText(otherTagName) + '\n',
					otherpage.getPageText());
				otherpage.setPageText(pageText);
				otherpage.setEditSummary(Tag.makeEditSummary([otherTagName], []));
				otherpage.setWatchlist(Twinkle.getPref('watchTaggedPages'));
				otherpage.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
				otherpage.setCreateOption('nocreate');
				otherpage.save(def.resolve, def.reject);
			}, def.reject);
		}

		// post at WP:PNT for {{not English}} and {{rough translation}} tag
		if (params.translationPostAtPNT) {
			var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
				'Listing article at Wikipedia:Pages needing translation into English');
			pntPage.setFollowRedirect(true);
			pntPage.load(function friendlytagCallbacksTranslationListPage(pageobj) {
				var old_text = pageobj.getPageText();

				var template = params.tags.indexOf('Rough translation') !== -1 ? 'duflu' : 'needtrans';
				var lang = params.translationLanguage;
				var reason = params.translationComments;

				var templateText = '{{subst:' + template + '|pg=' + Morebits.pageNameNorm + '|Language=' +
					(lang || 'uncertain') + '|Comments=' + reason.trim() + '}} ~~~~';

				var text, summary;
				if (template === 'duflu') {
					text = old_text + '\n\n' + templateText;
					summary = 'Translation cleanup requested on ';
				} else {
					text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
						'\n\n' + templateText + '\n\n$1');
					summary = 'Translation' + (lang ? ' from ' + lang : '') + ' requested on ';
				}

				if (text === old_text) {
					pageobj.getStatusElement().error('failed to find target spot for the discussion');
					return;
				}
				pageobj.setPageText(text);
				pageobj.setEditSummary(summary + ' [[:' + Morebits.pageNameNorm + ']]');
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setCreateOption('recreate');
				pageobj.save(def.resolve, def.reject);
			}, def.reject);
		}

		if (params.translationNotify) {
			let statElem = new Morebits.status('Looking up creator');
			pageobj.setStatusElement(statElem);
			pageobj.lookupCreation(function(pageobj) {
				var initialContrib = pageobj.getCreator();
				statElem.info(`Found ${initialContrib}`);

				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					statElem.warn('You (' + initialContrib + ') created this page; skipping user notification');
					return;
				}

				var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
					'Notifying initial contributor (' + initialContrib + ')');
				userTalkPage.setNewSectionTitle('Your article [[' + Morebits.pageNameNorm + ']]');
				userTalkPage.setNewSectionText('{{subst:uw-notenglish|1=' + Morebits.pageNameNorm +
					(params.translationPostAtPNT ? '' : '|nopnt=yes') + '}} ~~~~');
				userTalkPage.setEditSummary('Notice: Please use English when contributing to the English Wikipedia.');
				userTalkPage.setChangeTags(Twinkle.changeTags);
				userTalkPage.setCreateOption('recreate');
				userTalkPage.setFollowRedirect(true, false);
				userTalkPage.newSection(def.resolve, def.reject);
			});
		}
		return def;
	}

}

function stripNs(title) {
	return new mw.Title(title).getMainText();
}

function makeArray<T>(obj: T | Array<T> | undefined | null): Array<T> {
	if (!obj) {
		return [];
	}
	if (Array.isArray(obj)) {
		return obj;
	}
	return [ obj ];
}


// Override to change modes available,
// each mode is a class extending TagMode
Tag.modeList = [
	RedirectMode,
	ArticleMode,
	FileMode
];

Twinkle.addInitCallback(function() { new Tag(); }, 'Tag');
