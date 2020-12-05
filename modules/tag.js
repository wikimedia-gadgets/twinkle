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
        var form = _super.prototype.makeForm.call(this, Window);
        var i = 1;
        $.each(this.tagList, function (groupName, group) {
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
    // public captureFormData() {
    // 	super.captureFormData();
    // }
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
        var form = _super.prototype.makeForm.call(this, Window);
        $.each(this.tagList, function (groupName, group) {
            form.append({
                type: 'header',
                label: groupName
            });
            form.append({
                type: 'checkbox',
                name: 'tags',
                list: group.map(function (item) { return ({
                    label: '{{' + item.tag + '}}' + (item.description ? ': ' + item.description : ''),
                    value: item.tag,
                    subgroup: item.subgroup
                }); })
            });
        });
        if (Twinkle.getPref('customFileTagList').length) {
            form.append({
                type: 'header',
                label: 'Custom tags'
            });
            form.append({
                type: 'checkbox',
                name: 'tags',
                list: Twinkle.getPref('customFileTagList')
            });
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
                    currentTag = tag;
                    switch (tag) {
                        case 'Now Commons':
                            currentTag = 'subst:' + currentTag; // subst
                            if (params.nowcommonsName !== '') {
                                currentTag += '|1=' + params.nowcommonsName;
                            }
                            break;
                        case 'Keep local':
                            if (params.keeplocalName !== '') {
                                currentTag += '|1=' + params.keeplocalName;
                            }
                            break;
                        case 'Rename media':
                            if (params.renamemediaNewname !== '') {
                                currentTag += '|1=' + params.renamemediaNewname;
                            }
                            if (params.renamemediaReason !== '') {
                                currentTag += '|2=' + params.renamemediaReason;
                            }
                            break;
                        case 'Cleanup image':
                            currentTag += '|1=' + params.cleanupimageReason;
                            break;
                        case 'Image-Poor-Quality':
                            currentTag += '|1=' + params.ImagePoorQualityReason;
                            break;
                        case 'Image hoax':
                            currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}';
                            break;
                        case 'Low quality chem':
                            currentTag += '|1=' + params.lowQualityChemReason;
                            break;
                        case 'Vector version available':
                            text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, '');
                        /* falls through */
                        case 'PNG version available':
                        /* falls through */
                        case 'Obsolete':
                            currentTag += '|1=' + params[tag.replace(/ /g, '_') + 'File'];
                            break;
                        case 'Do not move to Commons':
                            currentTag += '|reason=' + params.DoNotMoveToCommons_reason;
                            if (params.DoNotMoveToCommons_expiry) {
                                currentTag += '|expiry=' + params.DoNotMoveToCommons_expiry;
                            }
                            break;
                        case 'Orphaned non-free revisions':
                            currentTag = 'subst:' + currentTag; // subst
                            // remove {{non-free reduce}} and redirects
                            text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
                            currentTag += '|date={{subst:date}}';
                            break;
                        case 'Copy to Commons':
                            currentTag += '|human=' + mw.config.get('wgUserName');
                            break;
                        case 'Should be SVG':
                            currentTag += '|' + params.svgCategory;
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
// Override to change modes available,
// each mode is a class extending TagMode
Tag.modeList = [
    // ArticleMode,
    RedirectMode,
    FileMode
];
Twinkle.addInitCallback(function () { new Tag(); }, 'Tag');
