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
        $('#wrong-venue-warn').text(this.mode.getVenueWarning() || '');
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
    XfdMode.prototype.getVenueWarning = function () { };
    // Overridden for tfd, cfd, cfds
    /**
     * Pre-process parameters, called from evaluate() and preview().
     */
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
        // XXX: Copied from the original twinklexfd, but this isn't great.
        // Errors in tasks that execute early but don't affect creation of discussion page
        // such as fetchCreatorInfo() should not print trigger this.
        // But fetchCreatorInfo() is unlikely to error out so we're good for now.
        Xfd.currentRationale = this.params.reason;
        Morebits.status.onError(function () {
            if (Xfd.currentRationale) {
                Morebits.status.printUserText(Xfd.currentRationale, 'Your deletion rationale is provided below, which you can copy and paste into a new XFD dialog if you wish to try again:');
                // only need to print the rationale once
                Xfd.currentRationale = null;
            }
        });
    };
    XfdMode.prototype.autoEditRequest = function (pageobj) {
        var params = this.params;
        var def = $.Deferred();
        var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
        if (talkName === pageobj.getPageName()) {
            pageobj.getStatusElement().error('Page protected and nowhere to add an edit request, aborting');
            return def.reject();
        }
        else {
            pageobj.getStatusElement().warn('Page protected, requesting edit');
            var editRequest = '{{subst:Xfd edit protected|page=' + pageobj.getPageName() +
                '|discussion=' + params.discussionpage + '|tag=<nowiki>' + params.tagText + '\u003C/nowiki>}}'; // U+003C: <
            var talk_page = new Morebits.wiki.page(talkName, 'Automatically posting edit request on talk page');
            talk_page.setNewSectionTitle('Edit request to complete ' + utils.toTLACase(params.venue) + ' nomination');
            talk_page.setNewSectionText(editRequest);
            talk_page.setCreateOption('recreate');
            talk_page.setWatchlist(Twinkle.getPref('xfdWatchPage'));
            talk_page.setFollowRedirect(true); // should never be needed, but if the article is moved, we would want to follow the redirect
            talk_page.setChangeTags(Twinkle.changeTags);
            talk_page.newSection(def.resolve, function () {
                talk_page.getStatusElement().warn('Unable to add edit request, the talk page may be protected');
                def.reject();
            });
        }
        return def;
    };
    XfdMode.prototype.fetchCreatorInfo = function () {
        var _this = this;
        var def = $.Deferred();
        var thispage = new Morebits.wiki.page(Morebits.pageNameNorm, 'Finding page creator');
        thispage.setLookupNonRedirectCreator(this.params.lookupNonRedirectCreator);
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
    XfdMode.prototype.notifyCreator = function () {
        if (!this.params.notifycreator) {
            this.params.intialContrib = null;
            return $.Deferred().resolve();
        }
        return this.notifyTalkPage(this.params.initialContrib);
    };
    // Should be called after notifyTalkPage() which may unset this.params.intialContrib
    XfdMode.prototype.addToLog = function () {
        var params = this.params;
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
var Afd = /** @class */ (function (_super) {
    __extends(Afd, _super);
    function Afd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Afd.isDefaultChoice = function () {
        return mw.config.get('wgNamespaceNumber') === 0;
    };
    Afd.prototype.getFieldsetLabel = function () {
        return 'Articles for deletion';
    };
    Afd.prototype.getVenueWarning = function () {
        if (mw.config.get('wgNamespaceNumber') !== 0) {
            return 'AfD is generally appropriate only for articles.';
        }
        else if (mw.config.get('wgIsRedirect')) {
            return 'Please use RfD for redirects.';
        }
    };
    Afd.prototype.getMenuTooltip = function () {
        return 'Nominate article for deletion or move';
    };
    Afd.prototype.generateFieldset = function () {
        this.fieldset = _super.prototype.generateFieldset.call(this);
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
        $.each(delsortCategories, function (groupname, list) {
            var group = delsort.append({ type: 'optgroup', label: groupname });
            list.forEach(function (item) {
                group.append({ type: 'option', label: item, value: item });
            });
        });
        this.appendReasonArea();
        return this.fieldset;
    };
    Afd.prototype.postRender = function (renderedFieldset) {
        $(renderedFieldset).find('[name=delsortCats]')
            .attr('data-placeholder', 'Select delsort pages')
            .select2({
            width: '100%',
            matcher: Morebits.select2.matcher,
            templateResult: Morebits.select2.highlightSearchMatches,
            language: {
                searching: Morebits.select2.queryInterceptor
            },
            // Link text to the page itself
            templateSelection: function (choice) {
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
            '.select2-selection__choice__remove { font-size: 130%; }');
    };
    Afd.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        var tm = new Morebits.taskManager(this);
        tm.add(this.checkPage, []);
        tm.add(this.determineDiscussionPage, []);
        tm.add(this.createDiscussionPage, [this.checkPage, this.determineDiscussionPage]);
        // create discussion page before linking or transcluding it from anywhere, so that
        // there's no need to do any purging to prevent the red links
        tm.add(this.tagPage, [this.createDiscussionPage]);
        tm.add(this.addToList, [this.createDiscussionPage]);
        tm.add(this.addToDelsortLists, [this.createDiscussionPage]);
        tm.add(this.patrolPage, [this.checkPage]);
        tm.add(this.fetchCreatorInfo, []);
        tm.add(this.notifyCreator, [this.createDiscussionPage, this.fetchCreatorInfo]);
        tm.add(this.addToLog, [this.notifyCreator]);
        tm.execute().then(function () {
            Morebits.status.actionCompleted('Nomination completed, now redirecting to the discussion page');
            setTimeout(function () {
                window.location.href = mw.util.getUrl(_this.params.discussionpage);
            }, Morebits.wiki.actionCompleted.timeOut);
        });
    };
    Afd.prototype.preprocessParams = function () {
        this.params.lookupNonRedirectCreator = true; // for this.fetchCreatorInfo()
    };
    Afd.prototype.determineDiscussionPage = function () {
        var params = this.params;
        return new Morebits.wiki.api('Determining discussion page', {
            'action': 'query',
            'list': 'allpages',
            'apprefix': 'Articles for deletion/' + Morebits.pageNameNorm,
            'apnamespace': 4,
            'apfilterredir': 'nonredirects',
            'aplimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
        }).post().then(function (apiobj) {
            var xmlDoc = apiobj.responseXML;
            var titles = $(xmlDoc).find('allpages p');
            // There has been no earlier entries with this prefix, just go on.
            if (titles.length <= 0) {
                params.numbering = params.number = '';
            }
            else {
                var number = 0;
                for (var i = 0; i < titles.length; ++i) {
                    var title = titles[i].getAttribute('title');
                    // First, simple test, is there an instance with this exact name?
                    if (title === 'Wikipedia:Articles for deletion/' + Morebits.pageNameNorm) {
                        number = Math.max(number, 1);
                        continue;
                    }
                    var order_re = new RegExp('^' +
                        Morebits.string.escapeRegExp('Wikipedia:Articles for deletion/' + Morebits.pageNameNorm) +
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
            params.discussionpage = 'Wikipedia:Articles for deletion/' + Morebits.pageNameNorm + params.numbering;
            apiobj.getStatusElement().info(params.discussionpage);
        });
    };
    /**
     * Check to see that the page still exists, is not already tagged for AfD, etc.
     */
    Afd.prototype.checkPage = function () {
        var _this = this;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to article');
        pageobj.setFollowRedirect(true); // should never be needed, but if the article is moved, we would want to follow the redirect
        pageobj.setChangeTags(Twinkle.changeTags); // Here to apply to triage
        pageobj.load(function (pageobj) {
            var text = pageobj.getPageText();
            var statelem = pageobj.getStatusElement();
            _this.params.articleLoadTime = pageobj.getLoadTime();
            if (!pageobj.exists()) {
                statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
                return def.reject(); // Cancel future operations
            }
            // Check for existing AfD tag, for the benefit of new page patrollers
            var textNoAfd = text.replace(/<!--.*AfD.*\n\{\{(?:Article for deletion\/dated|AfDM).*\}\}\n<!--.*(?:\n<!--.*)?AfD.*(?:\s*\n)?/g, '');
            if (text !== textNoAfd) {
                if (confirm('An AfD tag was found on this article. Maybe someone beat you to it.  \nClick OK to replace the current AfD tag (not recommended), or Cancel to abandon your nomination.')) {
                    pageobj.setPageText(textNoAfd);
                }
                else {
                    statelem.error('Article already tagged with AfD tag, and you chose to abort');
                    window.location.reload();
                    return def.reject(); // Cancel future operations
                }
            }
            def.resolve(pageobj);
        });
        return def;
    };
    Afd.prototype.tagPage = function (pageobj) {
        var params = this.params;
        var def = $.Deferred();
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
            pageobj.save(def.resolve, def.reject);
        }
        else {
            this.autoEditRequest(pageobj).then(def.resolve, def.reject);
        }
        return def;
    };
    Afd.prototype.getDiscussionWikitext = function () {
        var params = this.params;
        return utils.makeTemplate('subst:afd2', {
            text: Morebits.string.formatReasonText(params.reason, true),
            pg: Morebits.pageNameNorm,
            cat: params.xfdcat
        }) + params.delsortCats.map(function (cat) {
            return '\n{{subst:delsort|' + cat + '|~~~~}}';
        }).join('');
    };
    Afd.prototype.createDiscussionPage = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(params.discussionpage, 'Creating article deletion discussion page');
        pageobj.load(function (pageobj) {
            pageobj.setPageText(_this.getDiscussionWikitext());
            pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
            pageobj.setChangeTags(Twinkle.changeTags);
            pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
            pageobj.setCreateOption('createonly');
            pageobj.save(function () {
                Xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
                def.resolve();
            }, def.reject);
        });
        return def;
    };
    Afd.prototype.addToList = function () {
        var params = this.params;
        var def = $.Deferred();
        var date = new Morebits.date(params.articleLoadTime);
        var pageobj = new Morebits.wiki.page('Wikipedia:Articles for deletion/Log/' +
            date.format('YYYY MMMM D', 'utc'), "Adding discussion to today's list");
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
            var statelem = pageobj.getStatusElement();
            var added_data = '{{subst:afd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}\n';
            var text;
            // add date header if the log is found to be empty (a bot should do this automatically)
            if (!pageobj.exists()) {
                text = '{{subst:AfD log}}\n' + added_data;
            }
            else {
                var old_text = pageobj.getPageText() + '\n'; // MW strips trailing blanks, but we like them, so we add a fake one
                text = old_text.replace(/(<!-- Add new entries to the TOP of the following list -->\n+)/, '$1' + added_data);
                if (text === old_text) {
                    var linknode = document.createElement('a');
                    linknode.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing AFD') + '?action=purge');
                    linknode.appendChild(document.createTextNode('How to fix AFD'));
                    statelem.error(['Could not find the target spot for the discussion. To fix this problem, please see ', linknode, '.']);
                    return def.reject();
                }
            }
            pageobj.setPageText(text);
            pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].');
            pageobj.setChangeTags(Twinkle.changeTags);
            pageobj.setWatchlist(Twinkle.getPref('xfdWatchList'));
            pageobj.setCreateOption('recreate');
            pageobj.save(def.resolve, def.reject);
        });
        return def;
    };
    Afd.prototype.addToDelsortLists = function () {
        var params = this.params;
        var defs = new Array(params.delsortCats.length);
        for (var i = 0; i < defs.length; i++) {
            // ugly, would be a lot better when mb.w.page#load and #save return promises
            defs[i] = $.Deferred();
        }
        params.delsortCats.forEach(function (cat, idx) {
            var delsortPage = new Morebits.wiki.page('Wikipedia:WikiProject Deletion sorting/' + cat, 'Adding to list of ' + cat + '-related deletion discussions');
            delsortPage.setFollowRedirect(true); // In case a category gets renamed
            delsortPage.load(function (pageobj) {
                var discussionPage = params.discussionpage;
                var text = pageobj.getPageText().replace('directly below this line -->', 'directly below this line -->\n{{' + discussionPage + '}}');
                pageobj.setPageText(text);
                pageobj.setEditSummary('Listing [[:' + discussionPage + ']].');
                pageobj.setChangeTags(Twinkle.changeTags);
                pageobj.setCreateOption('nocreate');
                pageobj.save(defs[idx].resolve, defs[idx].resolve); // failures aren't important
            });
        });
        return $.when.apply($, defs);
    };
    Afd.prototype.patrolPage = function () {
        if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
            new Morebits.wiki.page(Morebits.pageNameNorm).triage();
        }
        return $.Deferred().resolve(); // XXX
    };
    Afd.prototype.getNotifyText = function () {
        return utils.makeTemplate('subst:afd notice', {
            1: Morebits.pageNameNorm,
            order: this.params.numbering ? "|order=&#32;" + this.params.numbering : ''
        }) + ' ~~~~';
    };
    Afd.venueCode = 'afd';
    Afd.venueLabel = 'AfD (Articles for deletion)';
    return Afd;
}(XfdMode));
var Tfd = /** @class */ (function (_super) {
    __extends(Tfd, _super);
    function Tfd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Tfd.prototype.getFieldsetLabel = function () {
        return 'Templates for discussion';
    };
    Tfd.prototype.getMenuTooltip = function () {
        return 'Start a discussion for deleting or merging this template';
    };
    Tfd.isDefaultChoice = function () {
        return [10, 828].indexOf(mw.config.get('wgNamespaceNumber')) !== -1;
    };
    Tfd.prototype.generateFieldset = function () {
        this.fieldset = _super.prototype.generateFieldset.call(this);
        var templateOrModule = mw.config.get('wgPageContentModel') === 'Scribunto' ? 'module' : 'template';
        this.fieldset.append({
            type: 'select',
            label: 'Choose type of action wanted: ',
            name: 'xfdcat',
            event: function (e) {
                var target = e.target, tfdtarget = target.form.tfdtarget;
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
                }
                else {
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
        this.appendReasonArea();
        return this.fieldset;
    };
    Tfd.prototype.preprocessParams = function () {
        if (this.params.tfdtarget) {
            this.params.tfdtarget = utils.stripNs(this.params.tfdtarget);
        }
        // Modules can't be tagged, TfD instructions are to place on /doc subpage
        this.params.scribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
        if (this.params.xfdcat === 'tfm') {
            this.params.otherTemplateName = (this.params.scribunto ? 'Module:' : 'Template:') + this.params.tfdtarget;
        }
    };
    Tfd.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        var tm = new Morebits.taskManager(this);
        tm.add(this.tagPage, []);
        tm.add(this.addToList, [this.tagPage]);
        tm.add(this.watchModule, []);
        tm.add(this.fetchCreatorInfo, []);
        tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
        tm.add(this.notifyOtherCreator, [this.fetchCreatorInfo]);
        tm.add(this.addToLog, [this.notifyCreator]);
        tm.execute().then(function () {
            Morebits.status.actionCompleted("Nomination completed, now redirecting to today's log");
            setTimeout(function () {
                window.location.href = mw.util.getUrl(_this.params.logpage);
            }, Morebits.wiki.actionCompleted.timeOut);
        });
    };
    Tfd.prototype.tagPage = function () {
        return this.params.xfdcat === 'tfm' ? this.tagPagesForMerge() : this.tagPageForDeletion();
    };
    // One of the oddities due to our choice of not relying on the local time.
    Tfd.prototype.setLogPageAndDiscussionPage = function (timestamp) {
        var date = new Morebits.date(timestamp);
        this.params.logpage = 'Wikipedia:Templates for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
        this.params.discussionpage = this.params.logpage + '#' + Morebits.pageNameNorm;
    };
    Tfd.prototype.tagPageForDeletion = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(Morebits.pageNameNorm + (params.scribunto ? '/doc' : ''), 'Tagging ' + (params.scribunto ? 'module documentation' : 'template') + ' with ' +
            'deletion tag');
        pageobj.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
        pageobj.load(function (pageobj) {
            _this.setLogPageAndDiscussionPage(pageobj.getLoadTime());
            var text = pageobj.getPageText();
            var tableNewline = params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : ''; // No newline for inline
            params.tagText = (params.noinclude ? '<noinclude>' : '') + '{{subst:template for discussion|help=off' +
                (params.templatetype !== 'standard' ? '|type=' + params.templatetype : '') +
                (params.noinclude ? '}}</noinclude>' : '}}') + tableNewline;
            if (pageobj.canEdit()) {
                pageobj.setPageText(params.tagText + text);
                pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
                pageobj.setChangeTags(Twinkle.changeTags);
                pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
                if (params.scribunto) {
                    pageobj.setCreateOption('recreate'); // Module /doc might not exist
                }
                pageobj.save(def.resolve, def.reject);
            }
            else {
                _this.autoEditRequest(pageobj).then(def.resolve, def.reject);
            }
        });
        return def;
    };
    Tfd.prototype.tagPagesForMerge = function () {
        var _this = this;
        var params = this.params;
        var defs = [$.Deferred(), $.Deferred()];
        var docOrNot = params.scribunto ? '/doc' : '';
        var moduleDocOrTemplate = params.scribunto ? 'module documentation' : 'template';
        var pageobj = new Morebits.wiki.page("" + Morebits.pageNameNorm + docOrNot, "Tagging " + moduleDocOrTemplate + " with merge tag");
        pageobj.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
        pageobj.load(function (pageobj) {
            _this.setLogPageAndDiscussionPage(pageobj.getLoadTime());
            _this.tagForMerge(pageobj, _this.params).then(defs[0].resolve, defs[0].reject);
        });
        var otherpageobj = new Morebits.wiki.page("" + params.otherTemplateName + docOrNot, "Tagging other " + moduleDocOrTemplate + " with merge tag");
        otherpageobj.setFollowRedirect(true);
        otherpageobj.load(function (otherpageobj) {
            _this.setLogPageAndDiscussionPage(pageobj.getLoadTime());
            _this.tagForMerge(otherpageobj, $.extend({}, params, {
                otherTemplateName: Morebits.pageNameNorm
            })).then(defs[1].resolve, defs[1].reject);
        });
        return $.when.apply($, defs);
    };
    /**
     * @param {Morebits.wiki.page} pageobj - pageobj should be already loaded
     * @param {Object} params - we can't just use this.params since
     * that would be incorrect when tagging the "other" page
     */
    Tfd.prototype.tagForMerge = function (pageobj, params) {
        var def = $.Deferred();
        var text = pageobj.getPageText();
        var tableNewline = params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : ''; // No newline for inline
        params.tagText = (params.noinclude ? '<noinclude>' : '') + '{{subst:tfm|help=off|' +
            (params.templatetype !== 'standard' ? 'type=' + params.templatetype + '|' : '') + '1=' + params.otherTemplateName.replace(/^(?:Template|Module):/, '') +
            (params.noinclude ? '}}</noinclude>' : '}}') + tableNewline;
        if (pageobj.canEdit()) {
            pageobj.setPageText(params.tagText + text);
            pageobj.setEditSummary('Listed for merging with [[:' + params.otherTemplateName + ']]; see [[:' + params.discussionpage + ']].');
            pageobj.setChangeTags(Twinkle.changeTags);
            pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
            if (params.scribunto) {
                pageobj.setCreateOption('recreate'); // Module /doc might not exist
            }
            pageobj.save(def.resolve, def.reject);
        }
        else {
            this.autoEditRequest(pageobj).then(def.resolve, def.reject);
        }
        return def;
    };
    Tfd.prototype.addToList = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(params.logpage, "Adding discussion to today's log");
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
            var statelem = pageobj.getStatusElement();
            var added_data = _this.getDiscussionWikitext();
            var text;
            // add date header if the log is found to be empty (a bot should do this automatically)
            if (!pageobj.exists()) {
                text = '{{subst:TfD log}}\n' + added_data;
            }
            else {
                var old_text = pageobj.getPageText();
                text = old_text.replace('-->', '-->\n' + added_data);
                if (text === old_text) {
                    statelem.error('failed to find target spot for the discussion');
                    return;
                }
            }
            pageobj.setPageText(text);
            pageobj.setEditSummary('Adding ' + (params.xfdcat === 'tfd' ? 'deletion nomination' : 'merge listing') + ' of [[:' + Morebits.pageNameNorm + ']].');
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
    Tfd.prototype.notifyOtherCreator = function () {
        var _this = this;
        var def = $.Deferred();
        if (!this.params.otherTemplateName) {
            return def.resolve();
        }
        new Morebits.wiki.page(this.params.otherTemplateName, 'Finding other page creator').lookupCreation(function (page) {
            var otherpagecreator = page.getCreator();
            page.getStatusElement().info('Found ' + otherpagecreator);
            if (otherpagecreator === _this.params.initialContrib) {
                return def.resolve();
            }
            _this.notifyTalkPage(otherpagecreator).then(def.resolve, def.reject);
        });
        return def;
    };
    Tfd.prototype.watchModule = function () {
        var params = this.params;
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
            titles: [mw.config.get('wgPageName')],
            token: mw.user.tokens.get('watchToken'),
            // Expiry (note: mb.w.api delete params with value false)
            watchlistexpiry: watchPref !== 'default' && watchPref !== 'yes' && watchPref
        };
        if (params.xfdcat === 'tfm') {
            // Watch other module too
            watch_query.titles.push(params.otherTemplateName);
        }
        return new Morebits.wiki.api('Adding Module to watchlist', watch_query).post();
    };
    Tfd.prototype.getDiscussionWikitext = function () {
        return utils.makeTemplate('subst:' + this.params.xfdcat + '2', {
            text: Morebits.string.formatReasonText(this.params.reason, true),
            1: mw.config.get('wgTitle'),
            module: this.params.scribunto ? 'Module:' : '',
            2: this.params.tfdtarget
        });
    };
    Tfd.prototype.getNotifyText = function () {
        var text = "{{subst:tfd notice";
        if (this.params.xfdcat === 'tfm') {
            text = '\n{{subst:Tfm notice|2=' + this.params.tfdtarget;
        }
        text += "|1=" + Morebits.pageNameNorm + "}} ~~~~";
        return text;
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
    Ffd.prototype.getFieldsetLabel = function () {
        return 'Files for discussion';
    };
    Ffd.prototype.getMenuTooltip = function () {
        return 'Start a discussion for deleting this file';
    };
    Ffd.prototype.getVenueWarning = function () {
        if (mw.config.get('wgNamespaceNumber') !== 6) {
            return 'FFD is selected but this page doesn\'t look like a file!';
        }
    };
    Ffd.prototype.generateFieldset = function () {
        this.fieldset = _super.prototype.generateFieldset.call(this);
        this.appendReasonArea();
        return this.fieldset;
    };
    Ffd.prototype.preview = function (form) {
        var _this = this;
        this.params = Morebits.quickForm.getInputData(form);
        this.preprocessParams();
        this.fetchCreatorInfo().then(function () {
            _this.showPreview(form);
        });
    };
    Ffd.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        var tm = new Morebits.taskManager(this);
        tm.add(this.fetchCreatorInfo, []);
        tm.add(this.tagPage, []);
        tm.add(this.addToList, [this.fetchCreatorInfo, this.tagPage]);
        tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
        tm.add(this.addToLog, [this.notifyCreator]);
        tm.execute().then(function () {
            Morebits.status.actionCompleted("Nomination completed, now redirecting to today's log");
            setTimeout(function () {
                window.location.href = mw.util.getUrl(_this.params.logpage);
            }, Morebits.wiki.actionCompleted.timeOut);
        });
    };
    Ffd.prototype.tagPage = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to file page');
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
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
                pageobj.setCreateOption('recreate'); // it might be possible for a file to exist without a description page
                pageobj.save(def.resolve, def.reject);
            }
            else {
                _this.autoEditRequest(pageobj).then(def.resolve, def.reject);
            }
        });
        return def;
    };
    Ffd.prototype.addToList = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
        wikipedia_page.setFollowRedirect(true);
        wikipedia_page.load(function (pageobj) {
            var text = pageobj.getPageText();
            // add date header if the log is found to be empty (a bot should do this automatically)
            if (!pageobj.exists()) {
                text = '{{subst:FfD log}}';
            }
            pageobj.setPageText(text + '\n\n' + _this.getDiscussionWikitext());
            pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
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
    Ffd.prototype.getDiscussionWikitext = function () {
        return utils.makeTemplate('subst:ffd2', {
            Reason: Morebits.string.formatReasonText(this.params.reason, true),
            1: mw.config.get('wgTitle'),
            Uploader: this.params.initialContrib
        });
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
    Cfd.prototype.getVenueWarning = function () {
        if ([10, 14].indexOf(mw.config.get('wgNamespaceNumber')) === -1) {
            return 'CfD is only for categories and stub templates.';
        }
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
    };
    Cfd.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
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
            }, Morebits.wiki.actionCompleted.timeOut);
        });
    };
    Cfd.prototype.tagPage = function () {
        var _this = this;
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
            params.tagText = utils.makeTemplate('subst:' + params.xfdcat, {
                1: params.cfdtarget,
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
                pageobj.setCreateOption('recreate'); // since categories can be populated without an actual page at that title
                pageobj.save(def.resolve, def.reject);
            }
            else {
                _this.autoEditRequest(pageobj).then(def.resolve, def.reject);
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
        return utils.makeTemplate('subst:' + this.params.xfdcat + '2', {
            text: Morebits.string.formatReasonText(this.params.reason, true),
            1: mw.config.get('wgTitle'),
            2: this.params.cfdtarget,
            3: this.params.cfdtarget2
        });
    };
    Cfd.prototype.getNotifyText = function () {
        return utils.makeTemplate('subst:cfd notice', {
            action: this.params.action,
            1: Morebits.pageNameNorm,
            stub: mw.config.get('wgNamespaceNumber') === 10 ? 'yes' : null
        }) + ' ~~~~';
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
    Cfds.prototype.getVenueWarning = function () {
        if ([10, 14].indexOf(mw.config.get('wgNamespaceNumber')) === -1) {
            return 'CfD is only for categories and stub templates.';
        }
    };
    Cfds.prototype.generateFieldset = function () {
        this.fieldset = _super.prototype.generateFieldset.call(this);
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
    };
    Cfds.prototype.preprocessParams = function () {
        if (this.params.cfdstarget) { // Add namespace if not given (CFDS)
            this.params.cfdstarget = utils.addNs(this.params.cfdstarget, 14);
        }
    };
    Cfds.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        var tm = new Morebits.taskManager(this);
        tm.add(this.tagPage, []);
        tm.add(this.addToList, []);
        tm.add(this.addToLog, [this.addToList]);
        tm.execute().then(function () {
            Morebits.status.actionCompleted('Nomination completed, now redirecting to the discussion page');
            setTimeout(function () {
                window.location.href = mw.util.getUrl(_this.params.logpage);
            }, Morebits.wiki.actionCompleted.timeOut);
        });
    };
    Cfds.prototype.tagPage = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging category with rename tag');
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
            var text = pageobj.getPageText();
            params.tagText = '{{subst:cfr-speedy|1=' + params.cfdstarget.replace(/^:?Category:/, '') + '}}\n';
            if (pageobj.canEdit()) {
                pageobj.setPageText(params.tagText + text);
                pageobj.setEditSummary('Listed for speedy renaming; see [[WP:CFDS|Categories for discussion/Speedy]].');
                pageobj.setChangeTags(Twinkle.changeTags);
                pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
                pageobj.setCreateOption('recreate'); // since categories can be populated without an actual page at that title
                pageobj.save(def.resolve, def.reject);
            }
            else {
                _this.autoEditRequest(pageobj).then(def.resolve, def.reject);
            }
        });
        return def;
    };
    Cfds.prototype.addToList = function () {
        var _this = this;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page('Wikipedia:Categories for discussion/Speedy', 'Adding discussion to the list');
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
            var old_text = pageobj.getPageText();
            var statelem = pageobj.getStatusElement();
            var text = old_text.replace('BELOW THIS LINE -->', 'BELOW THIS LINE -->\n' + _this.getDiscussionWikitext());
            if (text === old_text) {
                statelem.error('failed to find target spot for the discussion');
                return def.reject();
            }
            pageobj.setPageText(text);
            pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
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
    Cfds.prototype.getDiscussionWikitext = function () {
        var params = this.params;
        return '* [[:' + Morebits.pageNameNorm + ']] to [[:' + params.cfdstarget + ']]\u00A0\u2013 ' +
            params.xfdcat + (params.reason ? ': ' + Morebits.string.formatReasonText(params.reason) : '.') + ' ~~~~';
        // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
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
    Mfd.prototype.generateFieldset = function () {
        this.fieldset = _super.prototype.generateFieldset.call(this);
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
    };
    Mfd.prototype.preprocessParams = function () {
        this.params.userspaceOwner = mw.config.get('wgRelevantUserName');
    };
    Mfd.prototype.evaluate = function () {
        var _this = this;
        _super.prototype.evaluate.call(this);
        var tm = new Morebits.taskManager(this);
        tm.add(this.determineDiscussionPage, []);
        tm.add(this.tagPage, [this.determineDiscussionPage]);
        tm.add(this.addToList, [this.determineDiscussionPage]);
        tm.add(this.createDiscussionPage, [this.determineDiscussionPage]);
        tm.add(this.fetchCreatorInfo, []);
        tm.add(this.notifyCreator, [this.fetchCreatorInfo]);
        tm.add(this.notifyUserspaceOwner, [this.fetchCreatorInfo]);
        tm.add(this.addToLog, [this.notifyCreator, this.notifyUserspaceOwner]);
        tm.execute().then(function () {
            Morebits.status.actionCompleted('Nomination completed, now redirecting to the discussion page');
            setTimeout(function () {
                window.location.href = mw.util.getUrl(_this.params.discussionpage);
            }, Morebits.wiki.actionCompleted.timeOut);
        });
    };
    Mfd.prototype.determineDiscussionPage = function () {
        var params = this.params;
        var wikipedia_api = new Morebits.wiki.api('Looking for prior nominations of this page', {
            'action': 'query',
            'list': 'allpages',
            'apprefix': 'Miscellany for deletion/' + Morebits.pageNameNorm,
            'apnamespace': 4,
            'apfilterredir': 'nonredirects',
            'aplimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
        });
        return wikipedia_api.post().then(function (apiobj) {
            var xmlDoc = apiobj.responseXML;
            var titles = $(xmlDoc).find('allpages p');
            // There has been no earlier entries with this prefix, just go on.
            if (titles.length <= 0) {
                params.numbering = params.number = '';
            }
            else {
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
    };
    Mfd.prototype.tagPage = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page with deletion tag');
        pageobj.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
        pageobj.load(function (pageobj) {
            var text = pageobj.getPageText();
            params.tagText = '{{' + (params.number === '' ? 'mfd' : 'mfdx|' + params.number) + '|help=off}}';
            if (['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1) {
                params.tagText = '/* ' + params.tagText + ' */\n';
            }
            else {
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
            }
            else {
                _this.autoEditRequest(pageobj).then(def.resolve, def.reject);
            }
        });
        return def;
    };
    Mfd.prototype.createDiscussionPage = function () {
        var _this = this;
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(params.discussionpage, 'Creating deletion discussion page');
        pageobj.load(function (pageobj) {
            pageobj.setPageText(_this.getDiscussionWikitext());
            pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
            pageobj.setChangeTags(Twinkle.changeTags);
            pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
            pageobj.setCreateOption('createonly');
            pageobj.save(function () {
                Xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
                def.resolve();
            }, def.reject);
        });
        return def;
    };
    Mfd.prototype.getDiscussionWikitext = function () {
        return utils.makeTemplate('subst:mfd2', {
            text: Morebits.string.formatReasonText(this.params.reason, true),
            pg: Morebits.pageNameNorm
        });
    };
    Mfd.prototype.addToList = function () {
        var params = this.params;
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page('Wikipedia:Miscellany for deletion', "Adding discussion to today's list");
        pageobj.setPageSection(2);
        pageobj.setFollowRedirect(true);
        pageobj.load(function (pageobj) {
            var text = pageobj.getPageText();
            var statelem = pageobj.getStatusElement();
            var date = new Morebits.date(pageobj.getLoadTime());
            var date_header = date.format('===MMMM D, YYYY===\n', 'utc');
            var date_header_regex = new RegExp(date.format('(===[\\s]*MMMM[\\s]+D,[\\s]+YYYY[\\s]*===)', 'utc'));
            var added_data = '{{subst:mfd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}';
            if (date_header_regex.test(text)) { // we have a section already
                statelem.info('Found today\'s section, proceeding to add new entry');
                text = text.replace(date_header_regex, '$1\n' + added_data);
            }
            else { // we need to create a new section
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
    };
    Mfd.prototype.notifyUserspaceOwner = function () {
        var params = this.params;
        // Notify the user who owns the subpage if they are not the creator
        if (params.notifyuserspace && params.userspaceOwner !== params.initialContrib) {
            // Don't log if notifying creator above, will log then
            return this.notifyTalkPage(params.userspaceOwner, new Morebits.status('Notifying owner of userspace (' + params.userspaceOwner + ')'));
        }
        else {
            return $.Deferred().resolve();
        }
    };
    Mfd.prototype.getNotifyText = function () {
        var text = "{{subst:mfd notice";
        if (this.params.numbering) {
            text += "|order=&#32;" + this.params.numbering;
        }
        text += "|1=" + Morebits.pageNameNorm + "}} ~~~~";
        return text;
    };
    Mfd.prototype.getUserspaceLoggingExtraInfo = function () {
        var params = this.params, text = '';
        if (params.notifyuserspace && params.userspaceOwner && params.userspaceOwner !== params.initialContrib) {
            text += '; notified {{user|1=' + params.userspaceOwner + '}}';
        }
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
    Rfd.prototype.tagPage = function () {
        var _this = this;
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
                _this.autoEditRequest(pageobj).then(def.resolve, def.reject);
            }
        });
        return def;
    };
    Rfd.prototype.getDiscussionWikitext = function () {
        var params = this.params;
        return utils.makeTemplate('subst:rfd2', {
            text: (params.reason ? Morebits.string.formatReasonText(params.reason) : '') + ' ~~~~',
            redirect: Morebits.pageNameNorm,
            target: params.rfdtarget && (params.rfdtarget + (params.section ? '#' + params.section : ''))
        });
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
    Rm.prototype.getVenueWarning = function () {
        if (mw.config.get('wgNamespaceNumber') === 14) { // category
            return 'Please use CfD or CfDS for category renames.';
        }
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
    makeTemplate: function (name, parameters) {
        var parameterText = obj_entries(parameters)
            .filter(function (_a) {
            var k = _a[0], v = _a[1];
            return !!v;
        }) // ignore params with no value
            .map(function (_a) {
            var name = _a[0], value = _a[1];
            return "|" + name + "=" + value;
        })
            .join('');
        return '{{' + name + parameterText + '}}';
    }
};
Xfd.modeList = [Rfd, Afd, Cfd, Tfd, Rm, Cfds, Mfd, Ffd];
Twinkle.addInitCallback(function () { new Xfd(); }, 'XFD');
//# sourceMappingURL=xfd.js.map