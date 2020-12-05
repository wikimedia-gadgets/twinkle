
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
}

abstract class TagMode {
	abstract name: string
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
		Morebits.quickForm.getElements(this.result, 'tags').forEach(generateLinks);
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
		if (this.params.tags.length === 0 && (this.name !== 'article' || this.params.tagsToRemove.length === 0)) {
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
}

/**
 * Adds a link to each template's description page
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
function generateLinks(checkbox) {
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
	static isActive() {
		return Morebits.isPageRedirect();
	}
	static redirectList = redirectTagList
	getMenuTooltip() {
		return 'Tag redirect';
	}
	getWindowTitle() {
		return 'Redirect tagging';
	}
	makeForm(Window) {
		let form = super.makeForm(Window);
		var i = 1;
		$.each(RedirectMode.redirectList, function (groupName, group) {
			form.append({
				type: 'header',
				id: 'tagHeader' + i,
				label: groupName
			});
			var subdiv = form.append({
				type: 'div',
				id: 'tagSubdiv' + i++
			});
			$.each(group, function (subgroupName: string, subgroup: any[]) {
				subdiv.append({
					type: 'div',
					label: [Morebits.htmlNode('b', subgroupName)]
				});
				subdiv.append({
					type: 'checkbox',
					name: 'tags',
					list: subgroup.map(function (item) {
						return {
							value: item.tag,
							label: '{{' + item.tag + '}}: ' + item.description,
							subgroup: item.subgroup
						};
					})
				});
			});
		});

		if (Twinkle.getPref('customRedirectTagList').length) {
			form.append({
				type: 'header',
				label: 'Custom tags'
			});
			form.append({
				type: 'checkbox',
				name: 'tags',
				list: Twinkle.getPref('customRedirectTagList')
			});
		}

		this.formAppendPatrolLink();
		this.formAppendSubmitButton();
		return this.form;
	}

	public captureFormData() {
		super.captureFormData();
	}

	action() {
		super.action();

		var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
		wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
		wikipedia_page.load((pageobj) => {
			var pageText = pageobj.getPageText(),
				tagRe, tagText = '', summaryText = 'Added',
				tags = [], i;

			for (i = 0; i < this.params.tags.length; i++) {
				tagRe = new RegExp('(\\{\\{' + this.params.tags[i] + '(\\||\\}\\}))', 'im');
				if (!tagRe.exec(pageText)) {
					tags.push(this.params.tags[i]);
				} else {
					Morebits.status.warn('Info', 'Found {{' + this.params.tags[i] +
						'}} on the redirect already...excluding');
				}
			}

			var addTag = (tagIndex, tagName) => {
				tagText += '\n{{' + tagName;
				if (tagName === 'R from alternative language') {
					if (this.params.altLangFrom) {
						tagText += '|from=' + this.params.altLangFrom;
					}
					if (this.params.altLangTo) {
						tagText += '|to=' + this.params.altLangTo;
					}
				} else if (tagName === 'R avoided double redirect' && this.params.doubleRedirectTarget) {
					tagText += '|1=' + this.params.doubleRedirectTarget;
				}
				tagText += '}}';

				if (tagIndex > 0) {
					if (tagIndex === (tags.length - 1)) {
						summaryText += ' and';
					} else if (tagIndex < (tags.length - 1)) {
						summaryText += ',';
					}
				}

				summaryText += ' {{[[:' + (tagName.indexOf(':') !== -1 ? tagName : 'Template:' + tagName + '|' + tagName) + ']]}}';
			};

			if (!tags.length) {
				Morebits.status.warn('Info', 'No tags remaining to apply');
			}

			tags.sort();
			$.each(tags, addTag);

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

			summaryText += (tags.length > 0 ? ' tag' + (tags.length > 1 ? 's' : ' ') : 'rcat shell') + ' to redirect';

			// avoid truncated summaries
			if (summaryText.length > 499) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText);
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();

			if (this.params.patrol) {
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
	// FileMode
];

Twinkle.addInitCallback(function() { new Tag(); }, 'Tag');
