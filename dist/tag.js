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
        if (!_this.mode) { // no mode is active
            return _this;
        }
        _this.portletName = 'Tag';
        _this.portletId = 'friendly-tag';
        _this.portletTooltip = _this.mode.getMenuTooltip();
        _this.addMenu();
        return _this;
    }
    /**
     * Adds a link to each template's description page
     * @param {Morebits.quickForm.element} checkbox  associated with the template
     */
    Tag.makeArrowLinks = function (checkbox) {
        var link = Morebits.htmlNode('a', '>');
        link.setAttribute('class', 'tag-template-link');
        var tagname = checkbox.values;
        link.setAttribute('href', mw.util.getUrl((tagname.indexOf(':') === -1 ? 'Template:' : '') +
            (tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))));
        link.setAttribute('target', '_blank');
        $(checkbox).parent().append(['\u00A0', link]);
    };
    Tag.makeEditSummary = function (addedTags, removedTags, reason) {
        var makeTemplateLink = function (tag) {
            var text = '{{[[';
            // if it is a custom tag with a parameter
            if (tag.indexOf('|') !== -1) {
                tag = tag.slice(0, tag.indexOf('|'));
            }
            text += tag.indexOf(':') !== -1 ? tag : 'Template:' + tag + '|' + tag;
            return text + ']]}}';
        };
        var summaryText;
        if (addedTags.length) {
            summaryText = 'Added ' + mw.language.listToText(addedTags.map(makeTemplateLink));
            summaryText += (removedTags === null || removedTags === void 0 ? void 0 : removedTags.length) ? '; and removed ' +
                mw.language.listToText(removedTags.map(makeTemplateLink)) : '';
        }
        else {
            summaryText = 'Removed ' + mw.language.listToText(removedTags);
        }
        summaryText += ' tag' + (addedTags.length + (removedTags === null || removedTags === void 0 ? void 0 : removedTags.length) > 1 ? 's' : '');
        if (reason) {
            summaryText += ': ' + reason;
        }
        // avoid long summaries
        if (summaryText.length > 499) {
            summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
        }
        return summaryText;
    };
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
        this.constructFlatObject();
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
    TagMode.prototype.makeTagList = function () {
        var _this = this;
        if (Array.isArray(this.tagList)) {
            this.makeTagListGroup(this.tagList, this.form);
        }
        else {
            $.each(this.tagList, function (groupName, group) {
                _this.form.append({ type: 'header', label: groupName });
                if (Array.isArray(group)) { // if group is a list of tags
                    _this.makeTagListGroup(group, _this.form);
                }
                else { // if group is a list of subgroups
                    var subdiv_1 = _this.form.append({ type: 'div' });
                    $.each(group, function (subgroupName, subgroup) {
                        subdiv_1.append({ type: 'div', label: [Morebits.htmlNode('b', subgroupName)] });
                        _this.makeTagListGroup(subgroup, subdiv_1);
                    });
                }
            });
        }
    };
    // helper function for makeTagList()
    TagMode.prototype.makeTagListGroup = function (list, container) {
        if (container === void 0) { container = this.form; }
        container.append({
            type: 'checkbox',
            name: 'tags',
            list: list.map(function (item) { return ({
                label: '{{' + item.tag + '}}' + (item.description ? ': ' + item.description : ''),
                value: item.tag,
                subgroup: item.subgroup
            }); })
        });
    };
    TagMode.prototype.constructFlatObject = function () {
        var _this = this;
        var obj_values = Object.values || function (obj) {
            return Object.keys(obj).map(function (key) {
                return obj[key];
            });
        };
        this.flatObject = {};
        if (Array.isArray(this.tagList)) {
            // this.tagList is of type tagData[]
            this.tagList.forEach(function (item) {
                _this.flatObject[item.tag] = item;
            });
        }
        else {
            obj_values(this.tagList).forEach(function (group) {
                obj_values(group).forEach(function (subgroup) {
                    if (Array.isArray(subgroup)) {
                        subgroup.forEach(function (item) {
                            _this.flatObject[item.tag] = item;
                        });
                    }
                    else {
                        _this.flatObject[subgroup.tag] = subgroup;
                    }
                });
            });
        }
        return this.flatObject;
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
        Morebits.quickForm.getElements(this.result, 'tags').forEach(Tag.makeArrowLinks);
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
        if (this.params.tags.length === 0 && (!this.canRemove || this.params.tagsToRemove.length === 0)) {
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
    TagMode.prototype.getParameterText = function (tagName) {
        var _this = this;
        var parameterText = '';
        var subgroupObj = this.flatObject[tagName] && this.flatObject[tagName].subgroup;
        if (subgroupObj) {
            var subgroups = Array.isArray(subgroupObj) ? subgroupObj : [subgroupObj];
            subgroups.forEach(function (gr) {
                if (gr.parameter && (_this.params[gr.name] || gr.required)) {
                    parameterText += '|' + gr.parameter + '=' + (_this.params[gr.name] || '');
                }
            });
        }
        return parameterText;
    };
    return TagMode;
}());
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
        _this.tagList = redirectTagList;
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
        _super.prototype.makeForm.call(this, Window);
        this.makeTagList();
        if (Twinkle.getPref('customRedirectTagList').length) {
            this.form.append({ type: 'header', label: 'Custom tags' });
            this.form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customRedirectTagList') });
        }
        this.formAppendPatrolLink();
        this.formAppendSubmitButton();
        return this.form;
    };
    RedirectMode.prototype.action = function () {
        var _this = this;
        _super.prototype.action.call(this);
        var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
        wikipedia_page.load(function (pageobj) {
            var pageText = pageobj.getPageText(), tagRe, tagText = '', tags = [], i;
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
            if (!tags.length) {
                Morebits.status.warn('Info', 'No tags remaining to apply');
                return;
            }
            tags.forEach(function (tagName) {
                tagText += '\n{{' + tagName + _this.getParameterText(tagName) + '}}';
            });
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
            pageobj.setPageText(pageText);
            pageobj.setEditSummary(Tag.makeEditSummary(tags));
            pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
            pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
            pageobj.setCreateOption('nocreate');
            pageobj.save();
            if (_this.params.patrol) {
                pageobj.setChangeTags(Twinkle.changeTags);
                pageobj.triage();
            }
        });
    };
    return RedirectMode;
}(TagMode));
var FileMode = /** @class */ (function (_super) {
    __extends(FileMode, _super);
    function FileMode() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'file';
        _this.tagList = fileTagList;
        return _this;
    }
    FileMode.isActive = function () {
        return mw.config.get('wgNamespaceNumber') === 6 &&
            !document.getElementById('mw-sharedupload') &&
            !!document.getElementById('mw-imagepage-section-filehistory');
    };
    FileMode.prototype.getMenuTooltip = function () {
        return 'Add maintenance tags to file';
    };
    FileMode.prototype.getWindowTitle = function () {
        return 'File maintenance tagging';
    };
    FileMode.prototype.makeForm = function (Window) {
        _super.prototype.makeForm.call(this, Window);
        this.makeTagList();
        if (Twinkle.getPref('customFileTagList').length) {
            this.form.append({ type: 'header', label: 'Custom tags' });
            this.form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customFileTagList') });
        }
        this.formAppendPatrolLink();
        this.formAppendSubmitButton();
        return this.form;
    };
    FileMode.prototype.validateInput = function () {
        // Given an array of incompatible tags, check if we have two or more selected
        var params = this.params, tags = this.params.tags;
        var checkIncompatible = function (conflicts, extra) {
            var count = conflicts.reduce(function (sum, tag) {
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
            checkIncompatible(['PNG version available', 'Vector version available'])) {
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
                }
                else {
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
                }
                else if (tags.indexOf('Bad font') !== -1) {
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
    };
    FileMode.prototype.action = function () {
        var _this = this;
        _super.prototype.action.call(this);
        var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + this.name);
        wikipedia_page.load(function (pageobj) {
            var text = pageobj.getPageText();
            var params = _this.params;
            // Add maintenance tags
            if (params.tags.length) {
                var tagtext = '', currentTag;
                $.each(params.tags, function (k, tag) {
                    // when other commons-related tags are placed, remove "move to Commons" tag
                    if (['Keep local', 'Now Commons', 'Do not move to Commons'].indexOf(tag) !== -1) {
                        text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
                    }
                    currentTag = tag + _this.getParameterText(tag);
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
                            break; // don't care
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
    };
    return FileMode;
}(TagMode));
var ArticleMode = /** @class */ (function (_super) {
    __extends(ArticleMode, _super);
    function ArticleMode() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'article';
        _this.tagList = articleTagList;
        return _this;
    }
    ArticleMode.isActive = function () {
        return [0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 &&
            mw.config.get('wgCurRevisionId');
    };
    Object.defineProperty(ArticleMode.prototype, "canRemove", {
        get: function () {
            return (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
                // Disabled on latest diff because the diff slider could be used to slide
                // away from the latest diff without causing the script to reload
                !mw.config.get('wgDiffNewId');
        },
        enumerable: false,
        configurable: true
    });
    ArticleMode.prototype.getMenuTooltip = function () {
        return 'Add or remove article maintenance tags';
    };
    ArticleMode.prototype.getWindowTitle = function () {
        return 'Article maintenance tagging';
    };
    ArticleMode.prototype.makeForm = function (Window) {
        var form = _super.prototype.makeForm.call(this, Window);
        form.append({
            type: 'select',
            name: 'sortorder',
            label: 'View this list:',
            tooltip: 'You can change the default view order in your Twinkle preferences (WP:TWPREFS).',
            event: this.updateSortOrder,
            list: [{
                    type: 'option',
                    value: 'cat',
                    label: 'By categories',
                    selected: Twinkle.getPref('tagArticleSortOrder') === 'cat'
                },
                {
                    type: 'option',
                    value: 'alpha',
                    label: 'In alphabetical order',
                    selected: Twinkle.getPref('tagArticleSortOrder') === 'alpha'
                }
            ]
        });
        if (!this.canRemove) {
            var divElement = document.createElement('div');
            divElement.innerHTML = 'For removal of existing tags, please open Tag menu from the current version of article';
            form.append({
                type: 'div',
                name: 'untagnotice',
                label: divElement
            });
        }
        form.append({
            type: 'div',
            id: 'tagWorkArea',
            className: 'morebits-scrollbox',
            style: 'max-height: 28em'
        });
        form.append({
            type: 'checkbox',
            list: [{
                    label: 'Group inside {{multiple issues}} if possible',
                    value: 'group',
                    name: 'group',
                    tooltip: 'If applying two or more templates supported by {{multiple issues}} and this box is checked, all supported templates will be grouped inside a {{multiple issues}} template.',
                    checked: Twinkle.getPref('groupByDefault')
                }]
        });
        form.append({
            type: 'input',
            label: 'Reason',
            name: 'reason',
            tooltip: 'Optional reason to be appended in edit summary. Recommended when removing tags.',
            size: '60px'
        });
        this.formAppendPatrolLink();
        this.formAppendSubmitButton();
        return this.form;
    };
    ArticleMode.prototype.postRender = function () {
        var _this = this;
        this.alreadyPresentTags = [];
        if (this.canRemove) {
            // Look for existing maintenance tags in the lead section and put them in array
            // All tags are HTML table elements that are direct children of .mw-parser-output,
            // except when they are within {{multiple issues}}
            $('.mw-parser-output').children().each(function (i, e) {
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
                        $(e).find('.ambox').each(function (idx, e) {
                            var tag = e.classList[0].slice(4).replace(/_/g, ' ');
                            _this.alreadyPresentTags.push(tag);
                        });
                        return; // continue
                    }
                    var tag = e.classList[0].slice(4).replace(/_/g, ' ');
                    _this.alreadyPresentTags.push(tag);
                }
            });
            // {{Uncategorized}} and {{Improve categories}} are usually placed at the end
            if ($('.box-Uncategorized').length) {
                this.alreadyPresentTags.push('Uncategorized');
            }
            if ($('.box-Improve_categories').length) {
                this.alreadyPresentTags.push('Improve categories');
            }
        }
        // Add status text node after Submit button
        var statusNode = document.createElement('small');
        statusNode.id = 'tw-tag-status';
        this.status = {
            // initial state; defined like this because these need to be available for reference
            // in the click event handler
            numAdded: 0,
            numRemoved: 0
        };
        $('button.tw-tag-submit').after(statusNode);
        // fake a change event on the sort dropdown, to initialize the tag list
        var evt = document.createEvent('Event');
        evt.initEvent('change', true, true);
        this.result.sortorder.dispatchEvent(evt);
    };
    ArticleMode.prototype.updateSortOrder = function (e) {
        var _this = this;
        var form = e.target.form;
        var sortorder = e.target.value;
        this.checkedTags = form.getChecked('tags');
        var container = new Morebits.quickForm.element({ type: 'fragment' });
        // function to generate a checkbox, with appropriate subgroup if needed
        var makeCheckbox = function (item) {
            return {
                value: item.tag,
                label: '{{' + item.tag + '}}: ' + item.description,
                checked: _this.checkedTags.indexOf(item.tag) !== -1,
                subgroup: item.subgroup
            };
        };
        var makeCheckboxesForAlreadyPresentTags = function () {
            container.append({ type: 'header', label: 'Tags already present' });
            var subdiv = container.append({ type: 'div' });
            var unCheckedTags = e.target.form.getUnchecked('existingTags');
            subdiv.append({
                type: 'checkbox',
                name: 'existingTags',
                list: _this.alreadyPresentTags.map(function (tag) {
                    return {
                        value: tag,
                        label: '{{' + tag + '}}' + (_this.flatObject[tag] ? ': ' + _this.flatObject[tag].description : ''),
                        checked: unCheckedTags.indexOf(tag) === -1,
                        style: 'font-style: italic'
                    };
                })
            });
        };
        if (sortorder === 'cat') { // categorical sort order
            // function to iterate through the tags and create a checkbox for each one
            var doCategoryCheckboxes = function (subdiv, subgroup) {
                var checkboxes = [];
                $.each(subgroup, function (k, item) {
                    if (_this.alreadyPresentTags.indexOf(item.tag) === -1) {
                        checkboxes.push(makeCheckbox(item));
                    }
                });
                subdiv.append({
                    type: 'checkbox',
                    name: 'tags',
                    list: checkboxes
                });
            };
            if (this.alreadyPresentTags.length > 0) {
                makeCheckboxesForAlreadyPresentTags();
            }
            // go through each category and sub-category and append lists of checkboxes
            $.each(this.tagList, function (groupName, group) {
                container.append({ type: 'header', label: groupName });
                var subdiv = container.append({ type: 'div' });
                if (Array.isArray(group)) {
                    doCategoryCheckboxes(subdiv, group);
                }
                else {
                    $.each(group, function (subgroupName, subgroup) {
                        subdiv.append({ type: 'div', label: [Morebits.htmlNode('b', subgroupName)] });
                        doCategoryCheckboxes(subdiv, subgroup);
                    });
                }
            });
        }
        else { // alphabetical sort order
            if (this.alreadyPresentTags.length > 0) {
                makeCheckboxesForAlreadyPresentTags();
                container.append({ type: 'header', label: 'Available tags' });
            }
            // Avoid repeatedly resorting
            this.alphabeticalList = this.alphabeticalList || Object.keys(this.flatObject).sort();
            var checkboxes = [];
            this.alphabeticalList.forEach(function (tag) {
                if (_this.alreadyPresentTags.indexOf(tag) === -1) {
                    checkboxes.push(makeCheckbox(_this.flatObject[tag]));
                }
            });
            container.append({
                type: 'checkbox',
                name: 'tags',
                list: checkboxes
            });
        }
        // append any custom tags
        if (Twinkle.getPref('customTagList').length) {
            container.append({ type: 'header', label: 'Custom tags' });
            container.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customTagList').map(function (el) {
                    el.checked = _this.checkedTags.indexOf(el.value) !== -1;
                    return el;
                })
            });
        }
        var $workarea = $(form).find('#tagWorkArea');
        var rendered = container.render();
        $workarea.empty().append(rendered);
        // for quick filter:
        QuickFilter.$allCheckboxDivs = $workarea.find('[name=tags], [name=existingTags]').parent();
        QuickFilter.$allHeaders = $workarea.find('h5, .quickformDescription');
        form.quickfilter.value = ''; // clear search, because the search results are not preserved over mode change
        form.quickfilter.focus();
        // style adjustments
        $workarea.find('h5').css({ 'font-size': '110%' });
        $workarea.find('h5:not(:first-child)').css({ 'margin-top': '1em' });
        $workarea.find('div').filter(':has(span.quickformDescription)').css({ 'margin-top': '0.4em' });
        Morebits.quickForm.getElements(form, 'existingTags').forEach(Tag.makeArrowLinks);
        Morebits.quickForm.getElements(form, 'tags').forEach(Tag.makeArrowLinks);
        // tally tags added/removed, update statusNode text
        var statusNode = document.getElementById('tw-tag-status');
        $('[name=tags], [name=existingTags]').click(function (e) {
            var checkbox = e.target;
            if (checkbox.name === 'tags') {
                _this.status.numAdded += checkbox.checked ? 1 : -1;
            }
            else if (checkbox.name === 'existingTags') {
                _this.status.numRemoved += checkbox.checked ? -1 : 1;
            }
            var firstPart = 'Adding ' + _this.status.numAdded + ' tag' + (_this.status.numAdded > 1 ? 's' : '');
            var secondPart = 'Removing ' + _this.status.numRemoved + ' tag' + (_this.status.numRemoved > 1 ? 's' : '');
            statusNode.textContent =
                (_this.status.numAdded ? '  ' + firstPart : '') +
                    (_this.status.numRemoved ? (_this.status.numAdded ? '; ' : '  ') + secondPart : '');
        });
    };
    ArticleMode.prototype.evaluate = function () {
        var _this = this;
        var wikipedia_page = new Morebits.wiki.page(this.pageName || Morebits.pageNameNorm, this.pageName ? "Tagging other page \"" + this.pageName + "\"" : 'Tagging ' + this.name);
        wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
        wikipedia_page.load(function (pageobj) {
            // Remove tags that become superfluous with this action
            var pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
            var params = _this.params;
            /**
             * Saves the page following the removal of tags if any. The last step.
             * Called from removeTags()
             */
            var postRemoval = function () {
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
                pageobj.save(function () {
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
                        }
                        else if (params.mergeTag === 'Merge to') {
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
                        var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English', 'Listing article at Wikipedia:Pages needing translation into English');
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
                            }
                            else {
                                text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/, '\n\n' + templateText + '\n\n$1');
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
                        pageobj.lookupCreation(function (innerPageobj) {
                            var initialContrib = innerPageobj.getCreator();
                            // Disallow warning yourself
                            if (initialContrib === mw.config.get('wgUserName')) {
                                innerPageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
                                return;
                            }
                            var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
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
                });
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
                    }
                    else {
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
                    'redirects': 1,
                    'lhnamespace': '10',
                    'lhshow': 'redirect',
                    'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
                }, function removeRedirectTag(apiobj) {
                    $(apiobj.responseXML).find('page').each(function (idx, page) {
                        var removed = false;
                        $(page).find('lh').each(function (idx, el) {
                            var tag = $(el).attr('title').slice(9);
                            var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
                            if (tag_re.test(pageText)) {
                                pageText = pageText.replace(tag_re, '');
                                removed = true;
                                return false; // break out of $.each
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
            var addTag = function (tagIndex, tagName) {
                var currentTag = '';
                if (tagName === 'Uncategorized' || tagName === 'Improve categories') {
                    pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
                }
                else {
                    currentTag += '{{' + tagName;
                    // fill in other parameters, based on the tag
                    var subgroupObj = _this.flatObject[tagName] &&
                        _this.flatObject[tagName].subgroup;
                    if (subgroupObj) {
                        var subgroups = Array.isArray(subgroupObj) ? subgroupObj : [subgroupObj];
                        subgroups.forEach(function (gr) {
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
            var addUngroupedTags = function () {
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
            params.tags.forEach(function (tag) {
                tagRe = new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
                // regex check for preexistence of tag can be skipped if in canRemove mode
                if (_this.canRemove || !tagRe.exec(pageText)) {
                    // condition this.flatObject[tag] to ensure that its not a custom tag
                    // Custom tags are assumed non-groupable, since we don't know whether MI template supports them
                    if (_this.flatObject[tag] && !_this.flatObject[tag].excludeMI) {
                        groupableTags.push(tag);
                    }
                    else {
                        tags.push(tag);
                    }
                }
                else {
                    if (tag === 'Merge from' || tag === 'History merge') {
                        tags.push(tag);
                    }
                    else {
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
            params.tagsToRemain.forEach(function (tag) {
                // If the tag is unknown to us, we consider it non-groupable
                if (_this.flatObject[tag] && !_this.flatObject[tag].excludeMI) {
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
            }
            else if (params.group && !miTest && (groupableExistingTags.length + groupableTags.length) >= 2) {
                Morebits.status.info('Info', 'Grouping supported tags inside {{multiple issues}}');
                tagText += '{{Multiple issues|\n';
                /**
                 * Adds newly added tags to MI
                 */
                var addNewTagsToMI = function () {
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
                    }
                    else {
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
                    'lhnamespace': '10',
                    'lhshow': 'redirect',
                    'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
                }, function replaceRedirectTag(apiobj) {
                    $(apiobj.responseXML).find('page').each(function (idx, page) {
                        var found = false;
                        $(page).find('lh').each(function (idx, el) {
                            var tag = $(el).attr('title').slice(9);
                            var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?)');
                            if (tag_re.test(pageText)) {
                                tagText += tag_re.exec(pageText)[1];
                                pageText = pageText.replace(tag_re, '');
                                found = true;
                                return false; // break out of $.each
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
            }
            else {
                tags = tags.concat(groupableTags);
                addUngroupedTags();
            }
        });
    };
    return ArticleMode;
}(TagMode));
// Override to change modes available,
// each mode is a class extending TagMode
Tag.modeList = [
    // ArticleMode,
    RedirectMode,
    FileMode
];
Twinkle.addInitCallback(function () { new Tag(); }, 'Tag');
//# sourceMappingURL=tag.js.map