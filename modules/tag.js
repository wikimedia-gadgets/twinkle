var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TwinkleModule = /** @class */ (function () {
    function TwinkleModule() {
    }
    TwinkleModule.prototype.addMenu = function () {
        Twinkle.addPortletLink(this.makeWindow, this.portletName, this.portletId, this.portletTooltip);
    };
    return TwinkleModule;
}());
var Tag = /** @class */ (function (_super) {
    __extends(Tag, _super);
    function Tag() {
        var _this = _super.call(this) || this;
        _this.makeWindow = function () {
            var Window = new Morebits.simpleWindow(630, 500);
            Window.setScriptName('Twinkle');
            // anyone got a good policy/guideline/info page/instructional page link??
            Window.addFooterLink('Twinkle help', 'WP:TW/DOC#tag');
            _this.mode.makeForm(Window);
            _this.mode.formRender();
            _this.mode.postRender();
        };
        for (var _i = 0, _a = Tag.modeList; _i < _a.length; _i++) {
            var mode = _a[_i];
            if (mode.isActive()) {
                // @ts-ignore
                _this.mode = new mode();
                break;
            }
        }
        _this.portletName = 'Tag';
        _this.portletId = 'friendly-tag';
        _this.portletTooltip = _this.mode.getMenuTooltip();
        _this.addMenu();
        return _this;
    }
    return Tag;
}(TwinkleModule));
var TagMode = /** @class */ (function () {
    function TagMode() {
    }
    TagMode.isActive = function () {
        return false;
    };
    Object.defineProperty(TagMode.prototype, "canRemove", {
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    TagMode.prototype.getMenuTooltip = function () {
        return 'Add maintenance tags to the page';
    };
    TagMode.prototype.getWindowTitle = function () {
        return 'Add maintenance tags';
    };
    TagMode.prototype.makeForm = function (Window) {
        var _this = this;
        this.Window = Window;
        this.Window.setTitle(this.getWindowTitle());
        this.form = new Morebits.quickForm(function () { _this.evaluate(); });
        this.formAppendQuickFilter();
        return this.form;
    };
    TagMode.prototype.formAppendQuickFilter = function () {
        this.form.append({
            type: 'input',
            label: 'Filter tag list: ',
            name: 'quickfilter',
            size: '30px',
            event: QuickFilter.onInputChange
        });
    };
    TagMode.prototype.formAppendPatrolLink = function () {
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
    };
    TagMode.prototype.formAppendSubmitButton = function () {
        this.form.append({
            type: 'submit',
            className: 'tw-tag-submit'
        });
    };
    TagMode.prototype.formRender = function () {
        this.result = this.form.render();
        this.Window.setContent(this.result);
        this.Window.display();
        QuickFilter.init(this.result);
    };
    TagMode.prototype.postRender = function () {
        Morebits.quickForm.getElements(this.result, 'tags').forEach(generateLinks);
    };
    TagMode.prototype.evaluate = function () {
        this.captureFormData();
        if (this.validateInput()) {
            this.action();
        }
    };
    TagMode.prototype.captureFormData = function () {
        this.params = Morebits.quickForm.getInputData(this.result);
    };
    TagMode.prototype.validateInput = function () {
        // File/redirect: return if no tags selected
        // Article: return if no tag is selected and no already present tag is deselected
        if (this.params.tags.length === 0 && (this.name !== 'article' || this.params.tagsToRemove.length === 0)) {
            alert('You must select at least one tag!');
            return false;
        }
        return true;
    };
    // Lousy name. This function is for the actions that take place when the form is submitted,
    // assuming the validations are all clear.
    // Should be extended in the child classes, needless to say.
    TagMode.prototype.action = function () {
        Morebits.simpleWindow.setButtonsEnabled(false);
        Morebits.status.init(this.result);
        Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
        Morebits.wiki.actionCompleted.notice = 'Tagging complete, reloading article in a few seconds';
        if (this.name === 'redirect') {
            Morebits.wiki.actionCompleted.followRedirect = false;
        }
    };
    return TagMode;
}());
/**
 * Adds a link to each template's description page
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
function generateLinks(checkbox) {
    var link = Morebits.htmlNode('a', '>');
    link.setAttribute('class', 'tag-template-link');
    var tagname = checkbox.values;
    link.setAttribute('href', mw.util.getUrl((tagname.indexOf(':') === -1 ? 'Template:' : '') +
        (tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))));
    link.setAttribute('target', '_blank');
    $(checkbox).parent().append(['\u00A0', link]);
}
var QuickFilter = /** @class */ (function () {
    function QuickFilter() {
    }
    QuickFilter.init = function (result) {
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
    };
    QuickFilter.onInputChange = function () {
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
        }
        else {
            QuickFilter.$allCheckboxDivs.show();
            QuickFilter.$allHeaders.show();
        }
    };
    return QuickFilter;
}());
var RedirectMode = /** @class */ (function (_super) {
    __extends(RedirectMode, _super);
    function RedirectMode() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'redirect';
        return _this;
    }
    RedirectMode.isActive = function () {
        return Morebits.isPageRedirect();
    };
    RedirectMode.prototype.getMenuTooltip = function () {
        return 'Tag redirect';
    };
    RedirectMode.prototype.getWindowTitle = function () {
        return 'Redirect tagging';
    };
    RedirectMode.prototype.makeForm = function (Window) {
        var form = _super.prototype.makeForm.call(this, Window);
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
            $.each(group, function (subgroupName, subgroup) {
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
    };
    RedirectMode.prototype.captureFormData = function () {
        _super.prototype.captureFormData.call(this);
    };
    RedirectMode.prototype.action = function () {
        var _this = this;
        _super.prototype.action.call(this);
        var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
        wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
        wikipedia_page.load(function (pageobj) {
            var pageText = pageobj.getPageText(), tagRe, tagText = '', summaryText = 'Added', tags = [], i;
            for (i = 0; i < _this.params.tags.length; i++) {
                tagRe = new RegExp('(\\{\\{' + _this.params.tags[i] + '(\\||\\}\\}))', 'im');
                if (!tagRe.exec(pageText)) {
                    tags.push(_this.params.tags[i]);
                }
                else {
                    Morebits.status.warn('Info', 'Found {{' + _this.params.tags[i] +
                        '}} on the redirect already...excluding');
                }
            }
            var addTag = function (tagIndex, tagName) {
                tagText += '\n{{' + tagName;
                if (tagName === 'R from alternative language') {
                    if (_this.params.altLangFrom) {
                        tagText += '|from=' + _this.params.altLangFrom;
                    }
                    if (_this.params.altLangTo) {
                        tagText += '|to=' + _this.params.altLangTo;
                    }
                }
                else if (tagName === 'R avoided double redirect' && _this.params.doubleRedirectTarget) {
                    tagText += '|1=' + _this.params.doubleRedirectTarget;
                }
                tagText += '}}';
                if (tagIndex > 0) {
                    if (tagIndex === (tags.length - 1)) {
                        summaryText += ' and';
                    }
                    else if (tagIndex < (tags.length - 1)) {
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
            }
            else {
                // Fold any pre-existing Rcats into taglist and under Rcatshell
                var pageTags = pageText.match(/\s*{{R(?:edirect)? .*?}}/img);
                var oldPageTags = '';
                if (pageTags) {
                    pageTags.forEach(function (pageTag) {
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
            if (_this.params.patrol) {
                pageobj.triage();
            }
        });
    };
    RedirectMode.redirectList = redirectTagList;
    return RedirectMode;
}(TagMode));
// Override to change modes available,
// each mode is a class extending TagMode
Tag.modeList = [
    // ArticleMode,
    RedirectMode,
];
Twinkle.addInitCallback(function () { new Tag(); }, 'Tag');
//# sourceMappingURL=tag.js.map