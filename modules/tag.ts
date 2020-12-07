
class TwinkleModule {
	moduleName: string
	portletName: string
	portletId: string
	portletTooltip: string
	makeWindow: string | (() => void)
	addMenu() {
		Twinkle.addPortletLink(this.makeWindow, this.portletName, this.portletId,
			this.portletTooltip)
	}
}

interface tagSubgroupType extends quickFormElementData {
	parameter: string
}
type tagData = {
	tag: string
	description?: string
	subgroup?: tagSubgroupType | tagSubgroupType[]
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

	static makeEditSummary(addedTags: string[], removedTags?: string[], reason?: string) {
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

	Window: Morebits.simpleWindow
	form: Morebits.quickForm
	result: HTMLFormElement
	params: Record<string, any>

	static isActive() { // must be overridden
		return false;
	}
	get canRemove() {
		return false;
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
		this.form = new Morebits.quickForm(() => { this.evaluate() });
		this.formAppendQuickFilter();

		this.constructFlatObject();
		return this.form;
	}
	formAppendQuickFilter() {
		this.form.append({
			type: 'input',
			label: 'Filter tag list: ',
			name: 'quickfilter',
			size: '30px',
			event: QuickFilter.onInputChange
		});
	}
	makeTagList() {
		if (Array.isArray(this.tagList)) {
			this.makeTagListGroup(this.tagList, this.form);
		} else {
			$.each(this.tagList, (groupName, group) => {
				this.form.append({ type: 'header', label: groupName });
				if (Array.isArray(group)) { // if group is a list of tags
					this.makeTagListGroup(group, this.form);
				} else { // if group is a list of subgroups
					let subdiv = this.form.append({ type: 'div' });
					$.each(group, (subgroupName: string, subgroup: any[]) => {
						subdiv.append({ type: 'div', label: [Morebits.htmlNode('b', subgroupName)] });
						this.makeTagListGroup(subgroup, subdiv);
					});
				}
			});
		}
	}

	// helper function for makeTagList()
	makeTagListGroup(list: tagData[], container: quickFormElement | Morebits.quickForm = this.form) {
		container.append({
			type: 'checkbox',
			name: 'tags',
			list: list.map((item) => ({
				label: '{{' + item.tag + '}}' + (item.description ? ': ' + item.description : ''),
				value: item.tag,
				subgroup: item.subgroup
			}))
		});
	}

	constructFlatObject() {	// Object.values is unavailable in IE 11
		var obj_values = Object.values || function (obj) {
			return Object.keys(obj).map(function (key) {
				return obj[key];
			});
		};
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
		QuickFilter.init(this.result);
	}
	postRender() {
		Morebits.quickForm.getElements(this.result, 'tags').forEach(Tag.makeArrowLinks);
	}
	evaluate() {
		this.captureFormData();
		if (this.validateInput()) {
			this.action();
		}
	}
	captureFormData() {
		this.params = Morebits.quickForm.getInputData(this.result);
	}
	validateInput(): boolean {
		// File/redirect: return if no tags selected
		// Article: return if no tag is selected and no already present tag is deselected
		if (this.params.tags.length === 0 && (!this.canRemove || this.params.tagsToRemove.length === 0)) {
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
		Morebits.wiki.actionCompleted.notice = 'Tagging complete, reloading article in a few seconds';
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
		QuickFilter.$allCheckboxDivs = $(result).find('[name$=tags]').parent();
		QuickFilter.$allHeaders = $(result).find('h5');
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
		this.makeTagList();

		if (Twinkle.getPref('customRedirectTagList').length) {
			this.form.append({ type: 'header', label: 'Custom tags' });
			this.form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customRedirectTagList') });
		}

		this.formAppendPatrolLink();
		this.formAppendSubmitButton();
		return this.form;
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
		this.makeTagList();

		if (Twinkle.getPref('customFileTagList').length) {
			this.form.append({ type: 'header', label: 'Custom tags' });
			this.form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customFileTagList') });
		}

		this.formAppendPatrolLink();
		this.formAppendSubmitButton();
		return this.form;
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
		var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
		wikipedia_page.load((pageobj: Morebits.wiki.page) => {
			var text = pageobj.getPageText();
			var params = this.params;

			// Add maintenance tags
			if (params.tags.length) {

				var tagtext = '', currentTag;
				$.each(params.tags, (k, tag) => {
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
							break;  // don't care
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
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.triage();
			}
		});

	}
}

// Override to change modes available,
// each mode is a class extending TagMode
Tag.modeList = [
	// ArticleMode,
	RedirectMode,
	FileMode
];

Twinkle.addInitCallback(function() { new Tag(); }, 'Tag');
