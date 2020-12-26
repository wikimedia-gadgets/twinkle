const {obj_values} = Twinkle.shims;

interface tagData {
	tag: string
	description?: string
	subgroup?: tagSubgroupType | tagSubgroupType[]
	excludeMI?: boolean
}
interface tagSubgroupType extends quickFormElementData {
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
	flatObject: Record<string, tagData>
	existingTags: string[] = []

	Window: Morebits.simpleWindow
	form: Morebits.quickForm
	result: HTMLFormElement
	scrollbox: Morebits.quickForm.element
	params: Record<string, any>

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

	makeExistingTagList(container: Morebits.quickForm.element) {
		if (!this.existingTags.length) {
			return;
		}
		container.append({ type: 'header', label: 'Tags already present' });
		this.makeTagListGroup(this.existingTags.map((tag) => {
			return this.flatObject[tag] || { tag };
		}), container, true);
	}

	// helper function for makeTagList()
	makeTagListGroup(list: tagData[], container?: Morebits.quickForm.element | Morebits.quickForm,
		forExistingTags?: boolean) {

		let excludeTags = new Set(forExistingTags ? [] : this.existingTags);
		container.append({
			type: 'checkbox',
			name: 'tags',
			list: list.filter(item => !excludeTags.has(item.tag)).map((item) => ({
				label: '{{' + item.tag + '}}' + (item.description ? ': ' + item.description : ''),
				value: item.tag,
				checked: !!forExistingTags,
				subgroup: item.subgroup,
				style: forExistingTags ? 'font-style: italic' : ''
			}))
		});
	}

	/**
	 * Parse existing tags. This is NOT asynchronous.
	 * Should be overridden for tag modes where removalSupported is true
	 */
	parseExistingTags() {
		return;
	}

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
		return this.flatObject;
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

	formAppendSubmitButton() {
		this.form.append({
			type: 'submit',
			className: 'tw-tag-submit'
		});
	}

	formRender() {
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
		if (this.validateInput()) {
			this.action();
		}
	}

	captureFormData() {
		this.params = Morebits.quickForm.getInputData(this.result);
		this.params.tagsToRemove = this.result.getUnchecked('existingTags'); // XXX: Morebits-defined function
		this.params.tagsToRetain = this.params.existingTags || [];
	}

	validateInput(): boolean {
		// File/redirect: return if no tags selected
		// Article: return if no tag is selected and no already present tag is deselected
		if (this.params.tags.length === 0 && (!this.canRemove() || this.params.tagsToRemove.length === 0)) {
			alert('You must select at least one tag!');
			return false;
		}
		return true;
	}

	// Lousy name. This function is for the actions that take place when the form is submitted,
	// assuming the validations are all clear.
	// Should be extended in the child classes, needless to say.
	action() {
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(this.result);

		Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
		Morebits.wiki.actionCompleted.notice = `Tagging complete, reloading ${this.name} in a few seconds```;
		if (this.name === 'redirect') {
			Morebits.wiki.actionCompleted.followRedirect = false;
		}
	}

	getParameterText(tagName: string) {
		let parameterText = '';
		let subgroupObj = this.flatObject[tagName] && this.flatObject[tagName].subgroup;
		if (subgroupObj) {
			let subgroups = Array.isArray(subgroupObj) ? subgroupObj : [ subgroupObj ];
			subgroups.forEach((gr) => {
				if (gr.parameter && (this.params[gr.name] || gr.required)) {
					parameterText += '|' + gr.parameter + '=' + (this.params[gr.name] || '');
				}
			});
		}
		return parameterText;
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
	tagList = redirectTagList;

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
		this.formAppendSubmitButton();
	}

	action() {
		super.action();

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

			tags.forEach((tagName) => {
				tagText += '\n{{' + tagName + this.getParameterText(tagName) + '}}';
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
			pageobj.save();

			if (this.params.patrol) {
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.triage();
			}

		});
	}

}

class FileMode extends TagMode {
	name = 'file';
	tagList = fileTagList;

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
		this.formAppendSubmitButton();
	}

	validateInput() {
		// Given an array of incompatible tags, check if we have two or more selected
		var params = this.params, tags = this.params.tags;
		var checkIncompatible = function(conflicts: string[], extra?: string) {
			var count = conflicts.reduce(function(sum, tag) {
				return sum += Number(tags.indexOf(tag) !== -1);
			}, 0);
			if (count > 1) {
				var message = 'Please select only one of: {{' + conflicts.join('}}, {{') + '}}.';
				message += extra ? ' ' + extra : '';
				alert(message);
				return true;
			}
		};

		if (checkIncompatible(['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format']) ||
			checkIncompatible(['Should be PNG', 'Should be SVG', 'Should be text']) ||
			checkIncompatible(['Bad SVG', 'Vector version available']) ||
			checkIncompatible(['Bad JPEG', 'Overcompressed JPEG']) ||
			checkIncompatible(['PNG version available', 'Vector version available'])
		) {
			return false;
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
				alert(suggestion);
				return false;
			}
			// Should be PNG|SVG
			if ((tags.toString().indexOf('Should be ') !== -1) && (tags.indexOf('Should be ' + extensionUpper) !== -1)) {
				alert('This is already a ' + extension + ' file, so {{Should be ' + extensionUpper + '}} is inappropriate.');
				return false;
			}

			// Overcompressed JPEG
			if (tags.indexOf('Overcompressed JPEG') !== -1 && extensionUpper !== 'JPEG') {
				alert('This appears to be a ' + extension + ' file, so {{Overcompressed JPEG}} probably doesn\'t apply.');
				return false;
			}
			// Bad trace and Bad font
			if (extensionUpper !== 'SVG') {
				if (tags.indexOf('Bad trace') !== -1) {
					alert('This appears to be a ' + extension + ' file, so {{Bad trace}} probably doesn\'t apply.');
					return false;
				} else if (tags.indexOf('Bad font') !== -1) {
					alert('This appears to be a ' + extension + ' file, so {{Bad font}} probably doesn\'t apply.');
					return false;
				}
			}
		}

		if (tags.indexOf('Do not move to Commons') !== -1 && params.DoNotMoveToCommons_expiry &&
			(!/^2\d{3}$/.test(params.DoNotMoveToCommons_expiry) || parseInt(params.DoNotMoveToCommons_expiry, 10) <= new Date().getFullYear())) {
			alert('Must be a valid future year.');
			return false;
		}

		return true;
	}

	action() {
		super.action();
		var pageobj = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
		pageobj.load((pageobj: Morebits.wiki.page) => {
			var text = pageobj.getPageText();
			var params = this.params;

			// Add maintenance tags
			if (params.tags.length) {

				var tagtext = '', currentTag;
				params.tags.forEach((tag) => {
					// when other commons-related tags are placed, remove "move to Commons" tag
					if (['Keep local', 'Now Commons', 'Do not move to Commons'].indexOf(tag) !== -1) {
						text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
					}

					currentTag = tag + this.getParameterText(tag);

					switch (tag) {
						case 'Now Commons':
							currentTag = 'subst:' + currentTag; // subst
							break;
						case 'Vector version available':
							text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, '');
							break;
						case 'Orphaned non-free revisions':
							currentTag = 'subst:' + currentTag; // subst
							// remove {{non-free reduce}} and redirects
							text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
							break;
						default:
							break;
					}

					currentTag = '{{' + currentTag + '}}\n';

					tagtext += currentTag;
				});

				if (!tagtext) {
					pageobj.getStatusElement().warn('User canceled operation; nothing to do');
					return;
				}

				text = tagtext + text;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary(Tag.makeEditSummary(params.tags));
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();

			if (params.patrol) {
				pageobj.triage();
			}
		});

	}
}

class ArticleMode extends TagMode {
	name = 'article';
	tagList = articleTagList;
	removalSupported = true;

	pageName: string

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
		this.formAppendSubmitButton();
	}

	parseExistingTags() {
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

	evaluate() {
		super.evaluate();

		var wikipedia_page = new Morebits.wiki.page(this.pageName || Morebits.pageNameNorm,
			this.pageName ? `Tagging other page "${this.pageName}"` :'Tagging ' + this.name);
		wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
		wikipedia_page.load((pageobj: Morebits.wiki.page) => {

			// Remove tags that become superfluous with this action
			var pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
			var params = this.params;

			/**
			 * Saves the page following the removal of tags if any. The last step.
			 * Called from removeTags()
			 */
			var postRemoval = () => {
				if (params.tagsToRemove.length) {
					// Remove empty {{multiple issues}} if found
					pageText = pageText.replace(/\{\{(multiple ?issues|article ?issues|mi)\s*\|\s*\}\}\n?/im, '');
					// Remove single-element {{multiple issues}} if found
					pageText = pageText.replace(/\{\{(?:multiple ?issues|article ?issues|mi)\s*\|\s*(\{\{[^}]+\}\})\s*\}\}/im, '$1');
				}

				pageobj.setPageText(pageText);
				pageobj.setEditSummary(Tag.makeEditSummary(params.tags, params.tagsToRemove, params.reason));
				pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
				pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
				pageobj.setCreateOption('nocreate');
				pageobj.save(this.postSave);

				if (params.patrol) {
					pageobj.triage();
				}
			};

			/**
			 * Removes the existing tags that were deselected (if any)
			 * Calls postRemoval() when done
			 */
			var removeTags = function removeTags() {

				if (params.tagsToRemove.length === 0) {
					postRemoval();
					return;
				}

				Morebits.status.info('Info', 'Removing deselected tags that were already present');

				var getRedirectsFor = [];

				// Remove the tags from the page text, if found in its proper name,
				// otherwise moves it to `getRedirectsFor` array earmarking it for
				// later removal
				params.tagsToRemove.forEach(function removeTag(tag) {
					var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');

					if (tag_re.test(pageText)) {
						pageText = pageText.replace(tag_re, '');
					} else {
						getRedirectsFor.push('Template:' + tag);
					}
				});

				if (!getRedirectsFor.length) {
					postRemoval();
					return;
				}

				// Remove tags which appear in page text as redirects
				var api = new Morebits.wiki.api('Getting template redirects', {
					'action': 'query',
					'prop': 'linkshere',
					'titles': getRedirectsFor.join('|'),
					'redirects': 1,  // follow redirect if the class name turns out to be a redirect page
					'lhnamespace': '10',  // template namespace only
					'lhshow': 'redirect',
					'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
				}, function removeRedirectTag(apiobj) {

					$(apiobj.responseXML).find('page').each(function(idx, page) {
						var removed = false;
						$(page).find('lh').each(function(idx, el) {
							var tag = $(el).attr('title').slice(9);
							var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
							if (tag_re.test(pageText)) {
								pageText = pageText.replace(tag_re, '');
								removed = true;
								return false;   // break out of $.each
							}
						});
						if (!removed) {
							Morebits.status.warn('Info', 'Failed to find {{' +
								$(page).attr('title').slice(9) + '}} on the page... excluding');
						}

					});

					postRemoval();

				});
				api.post();

			};

			if (!params.tags.length) {
				removeTags();
				return;
			}

			var tagRe, tagText = '', tags = [], groupableTags = [], groupableExistingTags = [];
			// Executes first: addition of selected tags

			/**
			 * Updates `tagText` with the syntax of `tagName` template with its parameters
			 * @param {number} tagIndex
			 * @param {string} tagName
			 */
			var addTag = (tagIndex, tagName) => {
				var currentTag = '';
				if (tagName === 'Uncategorized' || tagName === 'Improve categories') {
					pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
				} else {
					currentTag += '{{' + tagName;
					// fill in other parameters, based on the tag

					var subgroupObj = this.flatObject[tagName] &&
						this.flatObject[tagName].subgroup;
					if (subgroupObj) {
						var subgroups = Array.isArray(subgroupObj) ? subgroupObj : [ subgroupObj ];
						subgroups.forEach(function(gr) {
							if (gr.parameter && (params[gr.name] || gr.required)) {
								currentTag += '|' + gr.parameter + '=' + params[gr.name];
							}
						});
					}

					switch (tagName) {
						case 'Not English':
						case 'Rough translation':
							if (params.translationPostAtPNT) {
								currentTag += '|listed=yes';
							}
							break;
						case 'Merge':
						case 'Merge to':
						case 'Merge from':
							params.mergeTag = tagName;
							// normalize the merge target for now and later
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

							currentTag += '|' + params.mergeTarget;

							// link to the correct section on the talk page, for article space only
							if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle = tagName === 'Merge to' ? params.mergeTarget : mw.config.get('wgTitle');
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle = tagName === 'Merge to' ? mw.config.get('wgTitle') : params.mergeTarget;
									var direction = '[[' + params.nonDiscussArticle + ']]' + (params.mergeTag === 'Merge' ? ' with ' : ' into ') + '[[' + params.discussArticle + ']]';
									params.talkDiscussionTitleLinked = 'Proposed merge of ' + direction;
									params.talkDiscussionTitle = params.talkDiscussionTitleLinked.replace(/\[\[(.*?)\]\]/g, '$1');
								}
								currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
							}
							break;
						default:
							break;
					}

					currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
					tagText += currentTag;
				}
			};

			/**
			 * Adds the tags which go outside {{multiple issues}}, either because
			 * these tags aren't supported in {{multiple issues}} or because
			 * {{multiple issues}} is not being added to the page at all
			 */
			var addUngroupedTags = function() {
				$.each(tags, addTag);

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
				pageText = wikipage.insertAfterTemplates(tagText, templatesAfter, null, afdRegex).getText();

				removeTags();
			};

			// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
			params.tags.forEach((tag) => {
				tagRe = new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
				// regex check for preexistence of tag can be skipped if in canRemove mode
				if (this.canRemove() || !tagRe.exec(pageText)) {
					// condition this.flatObject[tag] to ensure that its not a custom tag
					// Custom tags are assumed non-groupable, since we don't know whether MI template supports them
					if (this.flatObject[tag] && !this.flatObject[tag].excludeMI) {
						groupableTags.push(tag);
					} else {
						tags.push(tag);
					}
				} else {
					if (tag === 'Merge from' || tag === 'History merge') {
						tags.push(tag);
					} else {
						Morebits.status.warn('Info', 'Found {{' + tag +
							'}} on the article already...excluding');
						// don't do anything else with merge tags
						if (['Merge', 'Merge to'].indexOf(tag) !== -1) {
							params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
						}
					}
				}
			});

			// To-be-retained existing tags that are groupable
			params.tagsToRemain.forEach((tag) => {
				// If the tag is unknown to us, we consider it non-groupable
				if (this.flatObject[tag] && !this.flatObject[tag].excludeMI) {
					groupableExistingTags.push(tag);
				}
			});

			var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

			if (miTest && groupableTags.length > 0) {
				Morebits.status.info('Info', 'Adding supported tags inside existing {{multiple issues}} tag');

				tagText = '';
				$.each(groupableTags, addTag);

				var miRegex = new RegExp('(\\{\\{\\s*' + miTest[1] + '\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*', 'im');
				pageText = pageText.replace(miRegex, '$1' + tagText + '}}\n');
				tagText = '';

				addUngroupedTags();

			} else if (params.group && !miTest && (groupableExistingTags.length + groupableTags.length) >= 2) {
				Morebits.status.info('Info', 'Grouping supported tags inside {{multiple issues}}');

				tagText += '{{Multiple issues|\n';

				/**
				 * Adds newly added tags to MI
				 */
				var addNewTagsToMI = function() {
					$.each(groupableTags, addTag);
					tagText += '}}\n';

					addUngroupedTags();
				};


				var getRedirectsFor = [];

				// Reposition the tags on the page into {{multiple issues}}, if found with its
				// proper name, else moves it to `getRedirectsFor` array to be handled later
				groupableExistingTags.forEach(function repositionTagIntoMI(tag) {
					var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?)');
					if (tag_re.test(pageText)) {
						tagText += tag_re.exec(pageText)[1];
						pageText = pageText.replace(tag_re, '');
					} else {
						getRedirectsFor.push('Template:' + tag);
					}
				});

				if (!getRedirectsFor.length) {
					addNewTagsToMI();
					return;
				}

				var api = new Morebits.wiki.api('Getting template redirects', {
					'action': 'query',
					'prop': 'linkshere',
					'titles': getRedirectsFor.join('|'),
					'redirects': 1,
					'lhnamespace': '10', // template namespace only
					'lhshow': 'redirect',
					'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
				}, function replaceRedirectTag(apiobj) {
					$(apiobj.responseXML).find('page').each(function(idx, page) {
						var found = false;
						$(page).find('lh').each(function(idx, el) {
							var tag = $(el).attr('title').slice(9);
							var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?)');
							if (tag_re.test(pageText)) {
								tagText += tag_re.exec(pageText)[1];
								pageText = pageText.replace(tag_re, '');
								found = true;
								return false;   // break out of $.each
							}
						});
						if (!found) {
							Morebits.status.warn('Info', 'Failed to find the existing {{' +
								$(page).attr('title').slice(9) + '}} on the page... skip repositioning');
						}
					});
					addNewTagsToMI();
				});
				api.post();

			} else {
				tags = tags.concat(groupableTags);
				addUngroupedTags();
			}
		});

	}

	postSave(pageobj: Morebits.wiki.page) {
		let params = this.params;

		// special functions for merge tags
		if (params.mergeReason) {
			// post the rationale on the talk page (only operates in main namespace)
			var talkpage = new Morebits.wiki.page('Talk:' + params.discussArticle, 'Posting rationale on talk page');
			talkpage.setNewSectionText(params.mergeReason.trim() + ' ~~~~');
			talkpage.setNewSectionTitle(params.talkDiscussionTitleLinked);
			talkpage.setChangeTags(Twinkle.changeTags);
			talkpage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
			talkpage.setCreateOption('recreate');
			talkpage.newSection();
		}

		if (params.mergeTagOther) {
			// tag the target page if requested
			var otherTagName = 'Merge';
			if (params.mergeTag === 'Merge from') {
				otherTagName = 'Merge to';
			} else if (params.mergeTag === 'Merge to') {
				otherTagName = 'Merge from';
			}
			var newParams = {
				tags: [otherTagName],
				tagsToRemove: [],
				tagsToRemain: [],
				mergeTarget: Morebits.pageNameNorm,
				discussArticle: params.discussArticle,
				talkDiscussionTitle: params.talkDiscussionTitle,
				talkDiscussionTitleLinked: params.talkDiscussionTitleLinked
			};
			var otherpageTagging = new ArticleMode();
			otherpageTagging.params = newParams;
			otherpageTagging.pageName = params.mergeTarget;
			otherpageTagging.evaluate();

			// var otherpage = new Morebits.wiki.page(params.mergeTarget, 'Tagging other page (' +
			// 	params.mergeTarget + ')');
			// otherpage.setChangeTags(Twinkle.changeTags);
			// otherpage.setCallbackParameters(newParams);
			// otherpage.load(Twinkle.tag.callbacks.article);
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
				pageobj.save();
			});
		}

		if (params.translationNotify) {
			pageobj.lookupCreation(function(innerPageobj) {
				var initialContrib = innerPageobj.getCreator();

				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					innerPageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
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
				userTalkPage.newSection();
			});
		}
	}
}

// Override to change modes available,
// each mode is a class extending TagMode
Tag.modeList = [
	RedirectMode,
	ArticleMode,
	FileMode
];

Twinkle.addInitCallback(function() { new Tag(); }, 'Tag');
