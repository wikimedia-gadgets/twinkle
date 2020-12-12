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
var Xfd = /** @class */ (function (_super) {
    __extends(Xfd, _super);
    function Xfd() {
        var _this = _super.call(this) || this;
        _this.makeWindow = function () {
            var Window = new Morebits.simpleWindow(700, 400);
            Window.setTitle('Start a deletion discussion (XfD)');
            Window.setScriptName('Twinkle');
            Window.addFooterLink('About deletion discussions', 'WP:XFD');
            Window.addFooterLink('XfD prefs', 'WP:TW/PREF#xfd');
            Window.addFooterLink('Twinkle help', 'WP:TW/DOC#xfd');
            _this.makeForm(Window);
        };
        for (var _i = 0, _a = Xfd.modeList; _i < _a.length; _i++) {
            var mode = _a[_i];
            if (mode.isDefaultChoice()) {
                // @ts-ignore
                _this.mode = new mode();
                break;
            }
        }
        _this.portletName = 'XFD';
        _this.portletId = 'twinkle-xfd';
        _this.portletTooltip = _this.getMenuTooltip();
        _this.addMenu();
        return _this;
    }
    Xfd.prototype.getMenuTooltip = function () {
        if (this.mode) {
            return this.mode.getMenuTooltip();
        }
        else {
            return 'Start a deletion discussion';
        }
    };
    // invoked only once
    Xfd.prototype.makeForm = function (Window) {
        var _this = this;
        this.Window = Window;
        var form = new Morebits.quickForm(function () { _this.mode.evaluate(); });
        form.append({
            type: 'select',
            name: 'venue',
            label: 'Deletion discussion venue:',
            tooltip: 'When activated, a default choice is made, based on what namespace you are in. This default should be the most appropriate.',
            event: this.onCategoryChange.bind(this),
            list: Xfd.modeList.map(function (mode) { return ({
                type: 'option',
                label: mode.venueLabel,
                selected: _this.mode instanceof mode,
                value: mode.venueCode
            }); })
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
        $(previewlink).click(function () {
            _this.mode.preview(_this.result); // |result| is defined below
        });
        previewlink.style.cursor = 'pointer';
        previewlink.textContent = 'Preview';
        form.append({ type: 'div', id: 'xfdpreview', label: [previewlink] });
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
    };
    // invoked on every mode change
    Xfd.prototype.onCategoryChange = function (evt) {
        // @ts-ignore
        var venueCode = evt.target.value;
        // @ts-ignore
        var form = evt.target.form;
        var mode = Xfd.modeList.filter(function (mode) {
            return mode.venueCode === venueCode;
        })[0];
        if (!mode) {
            throw new Error('Unrecognized venue: ' + venueCode); // should never happen
        }
        // @ts-ignore
        this.mode = new mode();
        this.mode.result = this.result;
        this.mode.Window = this.Window;
        $('#wrong-venue-warn').text(this.mode.getVenueWarning());
        form.previewer.closePreview();
        var fieldset = this.mode.generateFieldset();
        var renderedFieldset = fieldset.render();
        $(this.result).find('fieldset[name=work_area]')
            .replaceWith(renderedFieldset);
        this.mode.postRender(renderedFieldset);
    };
    return Xfd;
}(TwinkleModule));
var XfdMode = /** @class */ (function () {
    function XfdMode() {
    }
    // must be overridden, unless the venue is never the default choice
    XfdMode.isDefaultChoice = function () {
        return false;
    };
    XfdMode.prototype.getMenuTooltip = function () {
        return 'Nominate page for deletion';
    };
    XfdMode.prototype.generateFieldset = function () {
        this.fieldset = new Morebits.quickForm.element({
            type: 'field',
            label: this.getFieldsetLabel(),
            name: 'work_area'
        });
        return this.fieldset;
    };
    XfdMode.prototype.appendReasonArea = function () {
        this.fieldset.append({
            type: 'textarea',
            name: 'reason',
            label: 'Reason: ',
            value: $(this.result).find('textarea').val() || '',
            tooltip: 'You can use wikimarkup in your reason. Twinkle will automatically sign your post.'
        });
    };
    XfdMode.prototype.postRender = function (renderedFieldset) { };
    XfdMode.prototype.getVenueWarning = function () {
        return '';
    };
    // Overridden for tfd, cfd, cfds
    XfdMode.prototype.preprocessParams = function () { };
    // Overridden for ffd and rfd, which need special treatment
    XfdMode.prototype.preview = function (form) {
        this.params = Morebits.quickForm.getInputData(form);
        this.preprocessParams();
        this.showPreview(form);
    };
    // This is good enough to use without override for all venues except rm
    XfdMode.prototype.showPreview = function (form) {
        var templatetext = this.getDiscussionWikitext();
        form.previewer.beginRender(templatetext, 'WP:TW'); // Force wikitext
    };
    XfdMode.prototype.evaluate = function () {
        this.params = Morebits.quickForm.getInputData(this.result);
        this.preprocessParams();
        Morebits.simpleWindow.setButtonsEnabled(false);
        Morebits.status.init(this.result);
    };
    XfdMode.prototype.fetchCreatorInfo = function () {
        var _this = this;
        var def = $.Deferred();
        var thispage = new Morebits.wiki.page(Morebits.pageNameNorm, 'Finding page creator');
        thispage.lookupCreation(function (pageobj) {
            _this.params.initialContrib = pageobj.getCreator();
            pageobj.getStatusElement().info('Found ' + pageobj.getCreator());
            def.resolve();
        });
        return def;
    };
    XfdMode.prototype.notifyTalkPage = function (notifyTarget, statusElement) {
        // Ensure items with User talk or no namespace prefix both end
        // up at user talkspace as expected, but retain the
        // prefix-less username for addToLog
        var params = this.params;
        var def = $.Deferred();
        var notifyTitle = mw.Title.newFromText(notifyTarget, 3); // 3: user talk
        var targetNS = notifyTitle.getNamespaceId();
        var usernameOrTarget = notifyTitle.getRelativeText(3);
        statusElement = statusElement || new Morebits.status('Notifying initial contributor (' + usernameOrTarget + ')');
        var notifyPageTitle = notifyTitle.toText();
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
        }
        else {
            usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchUser'));
        }
        usertalkpage.setFollowRedirect(true, false);
        usertalkpage.append(def.resolve, function onNotifyError() {
            // if user could not be notified, null this out for correct userspace logging
            params.initialContrib = null;
            def.resolve();
        });
        return def;
    };
    // Overridden for all venues except FFD and RFD
    XfdMode.prototype.getNotifyText = function () {
        return "{{subst:" + this.params.venue + " notice|1=" + Morebits.pageNameNorm + "}} ~~~~";
    };
    // Not overridden for any venue
    XfdMode.prototype.getNotifyEditSummary = function () {
        return 'Notification: [[' + this.params.discussionpage + '|listing]] of [[:' +
            Morebits.pageNameNorm + ']] at [[WP:' + this.getFieldsetLabel() + ']].';
    };
    // Should be called after notifyTalkPage() which may unset this.params.intialContrib
    XfdMode.prototype.addToLog = function () {
        var params = this.params, initialContrib = params.initialContrib;
        if (!Twinkle.getPref('logXfdNominations') ||
            Twinkle.getPref('noLogOnXfdNomination').indexOf(params.venue) !== -1) {
            return $.Deferred().resolve();
        }
        var usl = new Morebits.userspaceLogger(Twinkle.getPref('xfdLogPageName')); // , 'Adding entry to userspace log');
        usl.initialText =
            "This is a log of all [[WP:XFD|deletion discussion]] nominations made by this user using [[WP:TW|Twinkle]]'s XfD module.\n\n" +
                'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
                'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
                (Morebits.userIsSysop ? '\n\nThis log does not track XfD-related deletions made using Twinkle.' : '');
        usl.changeTags = Twinkle.changeTags;
        return usl.log(this.getUserspaceLoggingText(), this.getUserspaceLoggingEditSummary());
    };
    XfdMode.prototype.getUserspaceLoggingEditSummary = function () {
        return 'Logging ' + utils.toTLACase(this.params.venue) + ' nomination of [[:' + Morebits.pageNameNorm + ']].';
    };
    XfdMode.prototype.getUserspaceLoggingText = function () {
        var params = this.params;
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
    };
    XfdMode.prototype.getUserspaceLoggingExtraInfo = function () {
        return '';
    };
    return XfdMode;
}());
var Tfd = /** @class */ (function (_super) {
    __extends(Tfd, _super);
    function Tfd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Tfd.prototype.getFieldsetLabel = function () {
        return 'Templates for discussion';
    };
    Tfd.isDefaultChoice = function () {
        return [10, 828].indexOf(mw.config.get('wgNamespaceNumber')) !== -1;
    };
    Tfd.prototype.getUserspaceLoggingExtraInfo = function () {
        var params = this.params, text = '';
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
    };
    Tfd.prototype.getMenuTooltip = function () {
        return 'Nominate article for deletion or move';
    };
    Tfd.prototype.preprocessParams = function () {
        if (this.params.tfdtarget) {
            this.params.tfdtarget = utils.stripNs(this.params.tfdtarget);
        }
    };
    Tfd.prototype.getDiscussionWikitext = function () {
        return '';
    };
    Tfd.prototype.getNotifyText = function () {
        var text = "{{subst:tfd notice";
        if (this.params.xfdcat === 'tfm') {
            text = '\n{{subst:Tfm notice|2=' + this.params.tfdtarget;
        }
        text += "|1=" + Morebits.pageNameNorm + "}} ~~~~";
        return text;
    };
    Tfd.venueCode = 'tfd';
    Tfd.venueLabel = 'TfD (Templates for discussion)';
    return Tfd;
}(XfdMode));
var Ffd = /** @class */ (function (_super) {
    __extends(Ffd, _super);
    function Ffd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ffd.isDefaultChoice = function () {
        return mw.config.get('wgNamespaceNumber') === 6;
    };
    Ffd.prototype.getMenuTooltip = function () {
        return 'Nominate article for deletion or move';
    };
    Ffd.prototype.preview = function (form) {
        var _this = this;
        this.params = Morebits.quickForm.getInputData(form);
        this.preprocessParams();
        var page = new Morebits.wiki.page(mw.config.get('wgPageName'));
        page.lookupCreation(function () {
            _this.params.uploader = page.getCreator();
            _this.showPreview(form);
        });
    };
    Ffd.prototype.getDiscussionWikitext = function () {
        return '';
    };
    Ffd.prototype.getFieldsetLabel = function () {
        return 'Files for discussion';
    };
    Ffd.venueCode = 'ffd';
    Ffd.venueLabel = 'FfD (Files for discussion)';
    return Ffd;
}(XfdMode));
var Cfd = /** @class */ (function (_super) {
    __extends(Cfd, _super);
    function Cfd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Cfd.isDefaultChoice = function () {
        return mw.config.get('wgNamespaceNumber') === 14 ||
            (mw.config.get('wgNamespaceNumber') === 10 && /-stub$/.test(Morebits.pageNameNorm));
    };
    Cfd.prototype.getFieldsetLabel = function () {
        return 'Categories for discussion';
    };
    Cfd.prototype.getMenuTooltip = function () {
        return 'Nominate article for deletion or move';
    };
    Cfd.prototype.generateFieldset = function () {
        this.fieldset = _super.prototype.generateFieldset.call(this);
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
            event: function (e) {
                var value = e.target.value, cfdtarget = e.target.form.cfdtarget, cfdtarget2 = e.target.form.cfdtarget2;
                // update enabled status
                cfdtarget.disabled = value === 'cfd' || value === 'sfd-t';
                if (isCategory) {
                    // update label
                    if (value === 'cfs') {
                        Morebits.quickForm.setElementLabel(cfdtarget, 'Target categories: ');
                    }
                    else if (value === 'cfc') {
                        Morebits.quickForm.setElementLabel(cfdtarget, 'Target article: ');
                    }
                    else {
                        Morebits.quickForm.setElementLabel(cfdtarget, 'Target category: ');
                    }
                    // add/remove extra input box
                    if (value === 'cfs') {
                        if (cfdtarget2) {
                            cfdtarget2.disabled = false;
                            $(cfdtarget2).show();
                        }
                        else {
                            cfdtarget2 = document.createElement('input');
                            cfdtarget2.setAttribute('name', 'cfdtarget2');
                            cfdtarget2.setAttribute('type', 'text');
                            cfdtarget2.setAttribute('required', 'true');
                            cfdtarget.parentNode.appendChild(cfdtarget2);
                        }
                    }
                    else {
                        $(cfdtarget2).prop('disabled', true);
                        $(cfdtarget2).hide();
                    }
                }
                else { // Update stub template label
                    Morebits.quickForm.setElementLabel(cfdtarget, 'Target stub template: ');
                }
            }
        });
        this.fieldset.append({
            type: 'input',
            name: 'cfdtarget',
            label: 'Target category: ',
            disabled: true,
            required: true,
            value: ''
        });
        this.appendReasonArea();
        return this.fieldset;
    };
    Cfd.prototype.preprocessParams = function () {
        if (this.params.cfdtarget) {
            this.params.cfdtarget = utils.stripNs(this.params.cfdtarget);
        }
        if (this.params.cfdtarget2) {
            this.params.cfdtarget2 = utils.stripNs(this.params.cfdtarget2);
        }
    };
    Cfd.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        // Used for customized actions in edit summaries and the notification template
        var summaryActions = {
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
        var tm = new Morebits.taskManager(this);
        tm.add(this.tagPage, []);
        tm.add(this.addToList, [this.tagPage]);
        tm.add(this.fetchCreatorInfo, []);
        tm.add(this.notifyCreator, [this.fetchCreatorInfo, this.tagPage]);
        tm.add(this.addToLog, [this.notifyCreator]);
        tm.execute().then(function () {
            Morebits.status.actionCompleted("Nomination completed, now redirecting to today's log");
            setTimeout(function () {
                window.location.href = mw.util.getUrl(_this.params.logpage);
            }, 50000);
        });
    };
    Cfd.prototype.tagPage = function () {
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging category with ' + params.action + ' tag');
        pageobj.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
        pageobj.load(function (pageobj) {
            // Set data for future actions first
            var date = new Morebits.date(pageobj.getLoadTime());
            params.logpage = 'Wikipedia:Categories for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
            params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;
            var text = pageobj.getPageText();
            params.tagText = new Template('subst:' + params.xfdcat, {
                1: params.cfdtarget,
                2: params.cfdtarget2 // for cfs
            }).toString() + '\n';
            var editsummary = (params.stub ? 'Stub template' : 'Category') +
                ' being considered for ' + params.action + (params.xfdcat === 'cfc' ? ' to an article' : '') +
                '; see [[:' + params.discussionpage + ']].';
            if (pageobj.canEdit()) {
                pageobj.setPageText(params.tagText + text);
                pageobj.setEditSummary(editsummary);
                pageobj.setChangeTags(Twinkle.changeTags);
                pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
                pageobj.setCreateOption('recreate'); // since categories can be populated without an actual page at that title
                pageobj.save(def.resolve, def.reject);
            }
            else {
                Xfd.autoEditRequest(pageobj, params);
            }
        });
        return def;
    };
    Cfd.prototype.addToList = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
            var statelem = pageobj.getStatusElement();
            var added_data = _this.getDiscussionWikitext();
            var text;
            // add date header if the log is found to be empty (a bot should do this automatically)
            if (!pageobj.exists()) {
                text = '{{subst:CfD log}}\n' + added_data;
            }
            else {
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
            pageobj.save(function () {
                Xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
                def.resolve();
            }, def.reject);
        });
        return def;
    };
    Cfd.prototype.getDiscussionWikitext = function () {
        return new Template('subst:' + this.params.xfdcat + '2', {
            text: Morebits.string.formatReasonText(this.params.reason, true),
            1: mw.config.get('wgTitle'),
            2: this.params.cfdtarget,
            3: this.params.cfdtarget2
        }).toString();
    };
    Cfd.prototype.notifyCreator = function () {
        if (!this.params.notifycreator) {
            this.params.intialContrib = null;
            return $.Deferred().resolve();
        }
        return this.notifyTalkPage(this.params.initialContrib);
    };
    Cfd.prototype.getNotifyText = function () {
        return new Template('subst:cfd notice', {
            action: this.params.action,
            1: Morebits.pageNameNorm,
            stub: mw.config.get('wgNamespaceNumber') === 10 ? 'yes' : null
        }).toString() + ' ~~~~';
    };
    Cfd.prototype.getUserspaceLoggingExtraInfo = function () {
        var params = this.params, text = '';
        text += ' (' + utils.toTLACase(params.xfdcat) + ')';
        if (params.cfdtarget) {
            var categoryOrTemplate = params.xfdcat.charAt(0) === 's' ? 'Template:' : ':Category:';
            text += '; ' + params.action + ' to [[' + categoryOrTemplate + params.cfdtarget + ']]';
            if (params.xfdcat === 'cfs' && params.cfdtarget2) {
                text += ', [[' + categoryOrTemplate + params.cfdtarget2 + ']]';
            }
        }
        return text;
    };
    Cfd.venueCode = 'cfd';
    Cfd.venueLabel = 'CfD (Categories for discussion)';
    return Cfd;
}(XfdMode));
var Cfds = /** @class */ (function (_super) {
    __extends(Cfds, _super);
    function Cfds() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Cfds.prototype.getMenuTooltip = function () {
        return 'Nominate article for deletion or move';
    };
    Cfds.prototype.getFieldsetLabel = function () {
        return 'Categories for speedy renaming';
    };
    Cfds.prototype.preprocessParams = function () {
        if (this.params.cfdstarget) { // Add namespace if not given (CFDS)
            this.params.cfdstarget = utils.addNs(this.params.cfdstarget, 14);
        }
    };
    Cfds.prototype.getUserspaceLoggingExtraInfo = function () {
        var params = this.params, text = '';
        text += ' (' + utils.toTLACase(params.xfdcat) + ')';
        // Ensure there's more than just 'Category:'
        if (params.cfdstarget && params.cfdstarget.length > 9) {
            text += '; New name: [[:' + params.cfdstarget + ']]';
        }
        return text;
    };
    Cfds.prototype.getDiscussionWikitext = function () {
        var params = this.params;
        return '* [[:' + Morebits.pageNameNorm + ']] to [[:' + params.cfdstarget + ']]\u00A0\u2013 ' +
            params.xfdcat + (params.reason ? ': ' + Morebits.string.formatReasonText(params.reason) : '.') + ' ~~~~';
        // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
    };
    Cfds.venueCode = 'cfds';
    Cfds.venueLabel = 'CfDS (Categories for speedy renaming)';
    return Cfds;
}(XfdMode));
var Mfd = /** @class */ (function (_super) {
    __extends(Mfd, _super);
    function Mfd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Mfd.isDefaultChoice = function () {
        return [0, 6, 10, 14, 828].indexOf(mw.config.get('wgNamespaceNumber')) === -1 ||
            Morebits.pageNameNorm.indexOf('Template:User ', 0) === 0;
    };
    Mfd.prototype.getMenuTooltip = function () {
        return 'Nominate article for deletion or move';
    };
    Mfd.prototype.getFieldsetLabel = function () {
        return 'Miscellany for deletion';
    };
    Mfd.prototype.getDiscussionWikitext = function () {
        return '';
    };
    Mfd.prototype.getUserspaceLoggingExtraInfo = function () {
        var params = this.params, text = '';
        if (params.notifyuserspace && params.userspaceOwner && params.userspaceOwner !== params.initialContrib) {
            text += '; notified {{user|1=' + params.userspaceOwner + '}}';
        }
        return text;
    };
    Mfd.prototype.getNotifyText = function () {
        var text = "{{subst:afd notice";
        if (this.params.numbering) {
            text += "|order=&#32;" + this.params.numbering;
        }
        text += "|1=" + Morebits.pageNameNorm + "}} ~~~~";
        return text;
    };
    Mfd.venueCode = 'mfd';
    Mfd.venueLabel = 'MfD (Miscellany for deletion)';
    return Mfd;
}(XfdMode));
var Rfd = /** @class */ (function (_super) {
    __extends(Rfd, _super);
    function Rfd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rfd.isDefaultChoice = function () {
        return mw.config.get('wgIsRedirect') || document.getElementById('softredirect');
    };
    Rfd.prototype.getFieldsetLabel = function () {
        return 'Redirects for discussion';
    };
    Rfd.prototype.getMenuTooltip = function () {
        return 'Nominate redirect to be deleted or retargeted';
    };
    Rfd.prototype.getUserspaceLoggingExtraInfo = function () {
        var params = this.params, text = '';
        if (params.rfdtarget) {
            text += '; Target: [[:' + params.rfdtarget + ']]';
            if (params.relatedpage) {
                text += ' (notified)';
            }
        }
        return text;
    };
    Rfd.prototype.generateFieldset = function () {
        this.fieldset = _super.prototype.generateFieldset.call(this);
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
    };
    Rfd.prototype.preview = function (form) {
        var _this = this;
        this.params = Morebits.quickForm.getInputData(form);
        this.findTarget().then(function () {
            _this.showPreview(form);
        });
    };
    Rfd.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        var tm = new Morebits.taskManager(this);
        tm.add(this.findTarget, []);
        tm.add(this.tagPage, [this.findTarget]);
        tm.add(this.addToList, [this.tagPage]);
        tm.add(this.fetchCreatorInfo, []);
        tm.add(this.notifyCreator, [this.fetchCreatorInfo, this.tagPage]);
        tm.add(this.notifyTargetTalk, [this.fetchCreatorInfo, this.tagPage]);
        tm.add(this.addToLog, [this.notifyCreator]);
        tm.execute().then(function () {
            Morebits.status.actionCompleted("Nomination completed, now redirecting to today's log");
            setTimeout(function () {
                window.location.href = mw.util.getUrl(_this.params.logpage);
            }, Morebits.wiki.actionCompleted.timeOut);
        });
    };
    // Creates: params.rfdtarget, params.curtimestamp, params.section, params.logpage, params.discussionpage
    Rfd.prototype.findTarget = function () {
        var _this = this;
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
        }
        else {
            // Find current target of redirect
            query.titles = mw.config.get('wgPageName');
            query.redirects = true;
        }
        var wikipedia_api = new Morebits.wiki.api('Finding target of redirect', query);
        return wikipedia_api.post().then(function (apiobj) {
            var $xmlDoc = $(apiobj.responseXML);
            _this.params.curtimestamp = $xmlDoc.find('api').attr('curtimestamp');
            var date = new Morebits.date(_this.params.curtimestamp);
            _this.params.logpage = 'Wikipedia:Redirects for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
            _this.params.discussionpage = _this.params.logpage + '#' + Morebits.pageNameNorm;
            if (!_this.params.rfdtarget) { // Not a softredirect
                var target = $xmlDoc.find('redirects r').first().attr('to');
                if (!target) {
                    var message = 'No target found. this page does not appear to be a redirect, aborting';
                    if (mw.config.get('wgAction') === 'history') {
                        message += '. If this is a soft redirect, try again from the content page, not the page history.';
                    }
                    apiobj.getStatusElement().error(message);
                    return $.Deferred().reject();
                }
                _this.params.rfdtarget = target;
                _this.params.section = $xmlDoc.find('redirects r').first().attr('tofragment');
            }
        });
    };
    // Creates: params.tagText
    Rfd.prototype.tagPage = function () {
        var def = $.Deferred();
        var params = this.params;
        var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to redirect');
        pageobj.setFollowRedirect(false);
        pageobj.load(function (pageobj) {
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
            }
            else {
                Xfd.autoEditRequest(pageobj, params).then(def.resolve, def.reject);
            }
        });
        return def;
    };
    Rfd.prototype.getDiscussionWikitext = function () {
        var params = this.params;
        return new Template('subst:rfd2', {
            text: (params.reason ? Morebits.string.formatReasonText(params.reason) : '') + ' ~~~~',
            redirect: Morebits.pageNameNorm,
            target: params.rfdtarget && (params.rfdtarget + (params.section ? '#' + params.section : ''))
        }).toString();
    };
    Rfd.prototype.addToList = function () {
        var _this = this;
        var def = $.Deferred();
        var params = this.params;
        var pageobj = new Morebits.wiki.page(params.logpage, 'Adding discussion to today\'s log');
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
            var statelem = pageobj.getStatusElement();
            var added_data = _this.getDiscussionWikitext();
            var text;
            // add date header if the log is found to be empty (a bot should do this automatically)
            if (!pageobj.exists()) {
                text = '{{subst:RfD log}}' + added_data;
            }
            else {
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
            pageobj.save(function () {
                def.resolve();
                Xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
            }, def.reject);
        });
        return def;
    };
    Rfd.prototype.notifyCreator = function () {
        if (!this.params.notifycreator) {
            this.params.intialContrib = null;
            return $.Deferred().resolve();
        }
        return this.notifyTalkPage(this.params.initialContrib);
    };
    Rfd.prototype.notifyTargetTalk = function () {
        if (!this.params.relatedpage) {
            return $.Deferred().resolve();
        }
        var targetTalk = new mw.Title(this.params.rfdtarget).getTalkPage();
        var statelem = new Morebits.status('Notifying target talk page', 'doing');
        // On the offchance it's a circular redirect
        if (this.params.rfdtarget === mw.config.get('wgPageName')) {
            statelem.warn('Circular redirect; skipping target page notification');
            return $.Deferred().resolve();
        }
        else if (document.getElementById('softredirect')) {
            statelem.warn('Soft redirect; skipping target page notification');
            return $.Deferred().resolve();
            // Don't issue if target talk is the initial contributor's talk or your own
        }
        else if (targetTalk.getNamespaceId() === 3 && targetTalk.getNameText() === this.params.initialContrib) {
            statelem.warn('Target is initial contributor; skipping target page notification');
            return $.Deferred().resolve();
        }
        else if (targetTalk.getNamespaceId() === 3 && targetTalk.getNameText() === mw.config.get('wgUserName')) {
            statelem.warn('You (' + mw.config.get('wgUserName') + ') are the target; skipping target page notification');
            return $.Deferred().resolve();
        }
        else {
            return this.notifyTalkPage(targetTalk.toText(), statelem);
        }
    };
    Rfd.venueCode = 'rfd';
    Rfd.venueLabel = 'RfD (Redirects for discussion)';
    return Rfd;
}(XfdMode));
var Rm = /** @class */ (function (_super) {
    __extends(Rm, _super);
    function Rm() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rm.prototype.getFieldsetLabel = function () {
        return 'Requested moves';
    };
    Rm.prototype.generateFieldset = function () {
        var _this = this;
        this.fieldset = _super.prototype.generateFieldset.call(this);
        this.fieldset.append({
            type: 'checkbox',
            list: [
                {
                    label: 'Uncontroversial technical request',
                    value: 'rmtr',
                    name: 'rmtr',
                    tooltip: 'Use this option when you are unable to perform this uncontroversial move yourself because of a technical reason (e.g. a page already exists at the new title, or the page is protected)',
                    checked: false,
                    event: function (evt) {
                        _this.result.newname.required = evt.target.checked;
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
    };
    Rm.prototype.getDiscussionWikitext = function () {
        var pageName = new mw.Title(Morebits.pageNameNorm).getSubjectPage().toText();
        var params = this.params;
        return (params.rmtr ?
            '{{subst:RMassist|1=' + pageName + '|2=' + params.newname :
            '{{subst:Requested move|current1=' + pageName + '|new1=' + params.newname)
            + '|reason=' + params.reason + '}}';
    };
    Rm.prototype.showPreview = function (form) {
        var templatetext = this.getDiscussionWikitext();
        form.previewer.beginRender(templatetext, this.params.rmtr ?
            'Wikipedia:Requested moves/Technical requests' :
            new mw.Title(Morebits.pageNameNorm).getTalkPage().toText());
    };
    Rm.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        var nomPageName = this.params.rmtr ?
            'Wikipedia:Requested moves/Technical requests' :
            new mw.Title(Morebits.pageNameNorm).getTalkPage().toText();
        Morebits.wiki.actionCompleted.redirect = nomPageName;
        Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';
        var pageobj = new Morebits.wiki.page(nomPageName, this.params.rmtr ? 'Adding entry at WP:RM/TR' : 'Adding entry on talk page');
        pageobj.setFollowRedirect(true);
        if (this.params.rmtr) {
            pageobj.setPageSection(2);
            pageobj.load(function (pageobj) {
                var text = pageobj.getPageText();
                var statelem = pageobj.getStatusElement();
                var hiddenCommentRE = /---- and enter on a new line.* -->/;
                var newtext = text.replace(hiddenCommentRE, '$&\n' + _this.getDiscussionWikitext());
                if (text === newtext) {
                    statelem.error('failed to find target spot for the entry');
                    return;
                }
                pageobj.setPageText(newtext);
                pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
                pageobj.setChangeTags(Twinkle.changeTags);
                pageobj.save(function () {
                    Xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
                    // add this nomination to the user's userspace log
                    _this.addToLog();
                });
            });
        }
        else {
            // listAtTalk uses .append(), so no need to load the page
            this.listAtTalk(pageobj);
        }
    };
    Rm.prototype.listAtTalk = function (pageobj) {
        var _this = this;
        var params = this.params;
        pageobj.setAppendText('\n\n' + this.getDiscussionWikitext());
        pageobj.setEditSummary('Proposing move' + (params.newname ? ' to [[:' + params.newname + ']]' : ''));
        pageobj.setChangeTags(Twinkle.changeTags);
        pageobj.setCreateOption('recreate'); // since the talk page need not exist
        pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
        pageobj.append(function () {
            Xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
            // add this nomination to the user's userspace log
            _this.addToLog();
        });
    };
    Rm.prototype.getUserspaceLoggingExtraInfo = function () {
        var params = this.params, text = '';
        if (params.rmtr) {
            text += ' (technical)';
        }
        if (params.newname) {
            text += '; New name: [[:' + params.newname + ']]';
        }
        return text;
    };
    Rm.venueCode = 'rm';
    Rm.venueLabel = 'RM (Requested moves)';
    return Rm;
}(XfdMode));
var obj_entries = Twinkle.shims.obj_entries;
var Template = /** @class */ (function (_super) {
    __extends(Template, _super);
    function Template(name, parameters) {
        if (parameters === void 0) { parameters = {}; }
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.parameters = obj_entries(parameters).filter(function (_a) {
            var k = _a[0], v = _a[1];
            return !!v;
        });
        return _this;
    }
    Template.prototype.addParam = function (name, value) {
        this.parameters.push([name, value]);
    };
    Template.prototype.toString = function () {
        return "{{" + this.name +
            this.parameters.map(function (_a) {
                var name = _a[0], value = _a[1];
                return "|" + name + "=" + value;
            }).join('') + '}}';
    };
    return Template;
}(String));
var utils = {
    /** Get ordinal number figure */
    num2order: function (num) {
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
    stripNs: function (title) {
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
    addNs: function (title, namespaceNumber) {
        var title_obj = mw.Title.newFromUserInput(title, namespaceNumber);
        if (!title_obj) {
            return title; // user entered invalid input; do nothing
        }
        return title_obj.toText();
    },
    /**
     * Provide Wikipedian TLA style: AfD, RfD, CfDS, RM, SfD, etc.
     * @param {string} venue
     * @returns {string}
     */
    toTLACase: function (venue) {
        return venue
            .toString()
            // Everybody up, inclduing rm and the terminal s in cfds
            .toUpperCase()
            // Lowercase the central f in a given TLA and normalize sfd-t and sfr-t
            .replace(/(.)F(.)(?:-.)?/, '$1f$2');
    }
};
Xfd.modeList = [
    Rfd,
    Cfd,
    Rm
];
Twinkle.addInitCallback(function () { new Xfd(); }, 'XFD');
//# sourceMappingURL=xfd.js.map