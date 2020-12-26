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
var _a = Twinkle.shims, arr_includes = _a.arr_includes, obj_entries = _a.obj_entries;
var Speedy = /** @class */ (function (_super) {
    __extends(Speedy, _super);
    function Speedy() {
        var _this = _super.call(this) || this;
        _this.makeWindow = function () {
            _this.dialog = new Morebits.simpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
            _this.dialog.setTitle('Choose criteria for speedy deletion');
            _this.dialog.setScriptName('Twinkle');
            _this.dialog.addFooterLink('Speedy deletion policy', 'WP:CSD');
            _this.dialog.addFooterLink('CSD prefs', 'WP:TW/PREF#speedy');
            _this.dialog.addFooterLink('Twinkle help', 'WP:TW/DOC#speedy');
            _this.hasCSD = !!$('#delete-reason').length;
            _this.makeFlatObject();
            var form = new Morebits.quickForm(function (e) { return _this.evaluate(e); }, Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);
            _this.form = form;
            if (Morebits.userIsSysop) {
                form.append({
                    type: 'checkbox',
                    list: [
                        {
                            label: 'Tag page only, don\'t delete',
                            value: 'tag_only',
                            name: 'tag_only',
                            tooltip: 'If you just want to tag the page, instead of deleting it now',
                            checked: !(_this.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
                            event: function (event) {
                                var cForm = event.target.form;
                                var cChecked = event.target.checked;
                                // enable talk page checkbox
                                if (cForm.deleteTalkPage) {
                                    cForm.deleteTalkPage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
                                }
                                // enable redirects checkbox
                                cForm.deleteRedirects.checked = !cChecked;
                                // enable delete multiple
                                cForm.delmultiple.checked = false;
                                // enable notify checkbox
                                cForm.notify.checked = cChecked;
                                // enable deletion notification checkbox
                                cForm.warnusertalk.checked = !cChecked && !_this.hasCSD;
                                // enable multiple
                                cForm.multiple.checked = false;
                                // enable requesting creation protection
                                cForm.requestsalt.checked = false;
                                _this.modeChanged(cForm);
                                event.stopPropagation();
                            }
                        }
                    ]
                });
                var deleteOptions = form.append({
                    type: 'div',
                    name: 'delete_options'
                });
                deleteOptions.append({
                    type: 'header',
                    label: 'Delete-related options'
                });
                if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) { // hide option for user pages, to avoid accidentally deleting user talk page
                    deleteOptions.append({
                        type: 'checkbox',
                        list: [
                            {
                                label: 'Also delete talk page',
                                value: 'deleteTalkPage',
                                name: 'deleteTalkPage',
                                tooltip: "This option deletes the page's talk page in addition. If you choose the F8 (moved to Commons) criterion, this option is ignored and the talk page is *not* deleted.",
                                checked: Twinkle.getPref('deleteTalkPageOnDelete'),
                                event: function (event) { return event.stopPropagation(); }
                            }
                        ]
                    });
                }
                deleteOptions.append({
                    type: 'checkbox',
                    list: [
                        {
                            label: 'Also delete all redirects',
                            value: 'deleteRedirects',
                            name: 'deleteRedirects',
                            tooltip: 'This option deletes all incoming redirects in addition. Avoid this option for procedural (e.g. move/merge) deletions.',
                            checked: Twinkle.getPref('deleteRedirectsOnDelete'),
                            event: function (event) { return event.stopPropagation(); }
                        },
                        {
                            label: 'Delete under multiple criteria',
                            value: 'delmultiple',
                            name: 'delmultiple',
                            tooltip: 'When selected, you can select several criteria that apply to the page. For example, G11 and A7 are a common combination for articles.',
                            event: function (event) {
                                _this.modeChanged(event.target.form);
                                event.stopPropagation();
                            }
                        },
                        {
                            label: 'Notify page creator of page deletion',
                            value: 'warnusertalk',
                            name: 'warnusertalk',
                            tooltip: 'A notification template will be placed on the talk page of the creator, IF you have a notification enabled in your Twinkle preferences ' +
                                'for the criterion you choose AND this box is checked. The creator may be welcomed as well.',
                            checked: !_this.hasCSD,
                            event: function (event) { return event.stopPropagation(); }
                        }
                    ]
                });
            }
            var tagOptions = form.append({
                type: 'div',
                name: 'tag_options'
            });
            if (Morebits.userIsSysop) {
                tagOptions.append({
                    type: 'header',
                    label: 'Tag-related options'
                });
            }
            tagOptions.append({
                type: 'checkbox',
                list: [
                    {
                        label: 'Notify page creator if possible',
                        value: 'notify',
                        name: 'notify',
                        tooltip: 'A notification template will be placed on the talk page of the creator, IF you have a notification enabled in your Twinkle preferences ' +
                            'for the criterion you choose AND this box is checked. The creator may be welcomed as well.',
                        checked: !Morebits.userIsSysop || !(_this.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
                        event: function (event) { return event.stopPropagation(); }
                    },
                    {
                        label: 'Tag for creation protection (salting) as well',
                        value: 'requestsalt',
                        name: 'requestsalt',
                        tooltip: 'When selected, the speedy deletion tag will be accompanied by a {{salt}} tag requesting that the deleting administrator apply creation protection. Only select if this page has been repeatedly recreated.',
                        event: function (event) { return event.stopPropagation(); }
                    },
                    {
                        label: 'Tag with multiple criteria',
                        value: 'multiple',
                        name: 'multiple',
                        tooltip: 'When selected, you can select several criteria that apply to the page. For example, G11 and A7 are a common combination for articles.',
                        event: function (event) {
                            _this.modeChanged(event.target.form);
                            event.stopPropagation();
                        }
                    }
                ]
            });
            form.append({
                type: 'div',
                id: 'prior-deletion-count',
                style: 'font-style: italic'
            });
            form.append({
                type: 'div',
                name: 'work_area',
                label: 'Failed to initialize the CSD module. Please try again, or tell the Twinkle developers about the issue.'
            });
            if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
                form.append({ type: 'submit', className: 'tw-speedy-submit' }); // Renamed in modeChanged
            }
            _this.result = form.render();
            _this.dialog.setContent(_this.result);
            _this.dialog.display();
            _this.modeChanged(_this.result);
            // Check for prior deletions.  Just once, upon init
            _this.priorDeletionCount();
        };
        _this.portletName = 'CSD';
        _this.portletId = 'twinkle-csd';
        _this.portletTooltip = Morebits.userIsSysop ? 'Delete page according to WP:CSD' : 'Request speedy deletion according to WP:CSD';
        _this.addMenu();
        return _this;
    }
    Speedy.prototype.priorDeletionCount = function () {
        var query = {
            action: 'query',
            format: 'json',
            list: 'logevents',
            letype: 'delete',
            leaction: 'delete/delete',
            letitle: mw.config.get('wgPageName'),
            leprop: '',
            lelimit: 5 // A little bit goes a long way
        };
        new Morebits.wiki.api('Checking for past deletions', query, function (apiobj) {
            var response = apiobj.getResponse();
            var delCount = response.query.logevents.length;
            if (delCount) {
                var message = delCount + ' previous deletion';
                if (delCount > 1) {
                    message += 's';
                    if (response.continue) {
                        message = 'More than ' + message;
                    }
                    // 3+ seems problematic
                    if (delCount >= 3) {
                        $('#prior-deletion-count').css('color', 'red');
                    }
                }
                // Provide a link to page logs (CSD templates have one for sysops)
                var link = Morebits.htmlNode('a', '(logs)');
                link.setAttribute('href', mw.util.getUrl('Special:Log', { page: mw.config.get('wgPageName') }));
                link.setAttribute('target', '_blank');
                $('#prior-deletion-count').text(message + ' '); // Space before log link
                $('#prior-deletion-count').append(link);
            }
        }).post();
    };
    Speedy.prototype.getMode = function () {
        var form = this.result;
        return this.mode = {
            isSysop: !!form.tag_only && !form.tag_only.checked,
            isMultiple: form.tag_only && !form.tag_only.checked ? form.delmultiple.checked : form.multiple.checked,
            isRadioClick: Twinkle.getPref('speedySelectionStyle') === 'radioClick'
        };
    };
    Speedy.prototype.modeChanged = function (form) {
        var _this = this;
        // first figure out what mode we're in
        this.getMode();
        $('[name=delete_options]').toggle(this.mode.isSysop);
        $('[name=tag_options]').toggle(!this.mode.isSysop);
        $('button.tw-speedy-submit').text(this.mode.isSysop ? 'Delete page' : 'Tag page');
        var work_area = new Morebits.quickForm.element({
            type: 'div',
            name: 'work_area'
        });
        if (this.mode.isMultiple && this.mode.isRadioClick) {
            work_area.append({
                type: 'div',
                label: 'When finished choosing criteria, click:'
            });
            work_area.append({
                type: 'button',
                name: 'submit-multiple',
                label: this.mode.isSysop ? 'Delete page' : 'Tag page',
                event: function (event) {
                    _this.evaluate(event);
                    event.stopPropagation();
                }
            });
        }
        this.appendCriteriaLists(work_area);
        $(form).find('[name=work_area]').replaceWith(work_area.render());
        // if sysop, check if CSD is already on the page and fill in custom rationale
        if (this.mode.isSysop && this.hasCSD) {
            var customOption = $('input[name=csd][value=reason]')[0];
            if (customOption) {
                if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
                    // force listeners to re-init
                    customOption.click();
                }
                var deleteReason = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
                $('input[name="csd.reason_1"]').val(deleteReason);
            }
        }
    };
    Speedy.prototype.appendCriteriaLists = function (work_area) {
        var _this = this;
        this.namespace = mw.config.get('wgNamespaceNumber');
        this.isRedirect = Morebits.isPageRedirect();
        var inputType = (this.mode.isMultiple ? 'checkbox' : 'radio');
        Speedy.criteriaLists.forEach(function (criteriaList) {
            if (criteriaList.visible(_this)) {
                work_area.append({ type: 'header', label: criteriaList.label });
                work_area.append({ type: inputType, name: 'csd', list: _this.generateCsdList(criteriaList.list) });
            }
        });
    };
    Speedy.prototype.generateCsdList = function (list) {
        var _this = this;
        var mode = this.mode;
        var openSubgroupHandler = function (e) {
            $(e.target.form).find('input').prop('disabled', true);
            $(e.target.form).children().css('color', 'gray');
            $(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
            $(e.target).parent().find('input:text')[0].focus();
            e.stopPropagation();
        };
        var submitSubgroupHandler = function (e) {
            var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';
            _this[evaluateType](e);
            e.stopPropagation();
        };
        return list.map(function (critElement) {
            var criterion = $.extend({}, critElement);
            if (mode.isMultiple) {
                if (criterion.hideWhenMultiple) {
                    return null;
                }
                if (criterion.hideSubgroupWhenMultiple) {
                    criterion.subgroup = null;
                }
            }
            else {
                if (criterion.hideWhenSingle) {
                    return null;
                }
                if (criterion.hideSubgroupWhenSingle) {
                    criterion.subgroup = null;
                }
            }
            if (mode.isSysop) {
                if (criterion.hideWhenSysop) {
                    return null;
                }
                if (criterion.hideSubgroupWhenSysop) {
                    criterion.subgroup = null;
                }
            }
            else {
                if (criterion.hideWhenUser) {
                    return null;
                }
                if (criterion.hideSubgroupWhenUser) {
                    criterion.subgroup = null;
                }
            }
            if (Morebits.isPageRedirect() && criterion.hideWhenRedirect) {
                return null;
            }
            if (criterion.showInNamespaces && criterion.showInNamespaces.indexOf(_this.namespace) < 0) {
                return null;
            }
            if (criterion.hideInNamespaces && criterion.hideInNamespaces.indexOf(_this.namespace) > -1) {
                return null;
            }
            if (criterion.subgroup && !mode.isMultiple && mode.isRadioClick) {
                criterion.subgroup = makeArray(criterion.subgroup).concat({
                    type: 'button',
                    name: 'submit',
                    label: mode.isSysop ? 'Delete page' : 'Tag page',
                    event: submitSubgroupHandler
                });
                // FIXME: does this do anything?
                criterion.event = openSubgroupHandler;
            }
            return criterion;
        }).filter(function (e) { return e; }); // don't include items that have been made null
    };
    Speedy.prototype.makeFlatObject = function () {
        var _this = this;
        this.flatObject = {};
        Speedy.criteriaLists.forEach(function (criteria) {
            criteria.list.forEach(function (criterion) {
                _this.flatObject[criterion.value] = criterion;
            });
        });
    };
    // UI creation ends here!
    Speedy.prototype.evaluate = function (e) {
        var _this = this;
        if (e.target.type === 'checkbox' || e.target.type === 'text' ||
            e.target.type === 'select') {
            return;
        }
        this.params = Morebits.quickForm.getInputData(this.result);
        if (!this.params.csd || !this.params.csd.length) {
            return alert('Please select a criterion!');
        }
        this.preprocessParams();
        var validationMessage = this.validateInputs();
        if (validationMessage) {
            return alert(validationMessage);
        }
        Morebits.simpleWindow.setButtonsEnabled(false);
        Morebits.status.init(this.result);
        var tm = new Morebits.taskManager(this);
        tm.add(this.fetchCreatorInfo, []);
        if (this.mode.isSysop) {
            // Sysop mode deletion
            tm.add(this.parseDeletionReason, []);
            tm.add(this.deletePage, [this.parseDeletionReason]);
            tm.add(this.deleteTalk, [this.deletePage]);
            tm.add(this.deleteRedirects, [this.deletePage]);
            tm.add(this.noteToCreator, [this.deletePage, this.fetchCreatorInfo]);
        }
        else {
            // Tagging
            tm.add(this.checkPage, []);
            tm.add(this.tagPage, [this.checkPage]); // checkPage passes pageobj to tagPage
            tm.add(this.patrolPage, [this.checkPage]);
            tm.add(this.noteToCreator, [this.checkPage, this.fetchCreatorInfo]);
            tm.add(this.addToLog, [this.noteToCreator]);
        }
        tm.execute().then(function () {
            Morebits.status.actionCompleted(_this.mode.isSysop ? 'Deletion completed' : 'Tagging completed');
            setTimeout(function () {
                window.location.href = mw.util.getUrl(Morebits.pageNameNorm);
            }, 50000);
        });
    };
    Speedy.prototype.preprocessParams = function () {
        var _this = this;
        var params = this.params;
        params.csd = makeArray(params.csd);
        params.normalizeds = params.csd.map(function (critValue) {
            return _this.flatObject[critValue].code;
        });
        this.getTemplateParameters();
        this.getMode(); // likely not needed
        if (this.mode.isSysop) {
            params.promptForSummary = params.normalizeds.some(function (norm) {
                return Twinkle.getPref('promptForSpeedyDeletionSummary').indexOf(norm) !== -1;
            });
            params.warnUser = params.warnusertalk && params.normalizeds.some(function (norm, index) {
                return Twinkle.getPref('warnUserOnSpeedyDelete').indexOf(norm) !== -1 &&
                    !(norm === 'g6' && params.values[index] !== 'copypaste');
            });
        }
        else {
            params.notifyUser = params.notify && params.normalizeds.some(function (norm, index) {
                return Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1 &&
                    !(norm === 'g6' && params.csd[index] !== 'copypaste');
            });
            params.redactContents = params.csd.some(function (csd) {
                return _this.flatObject[csd].redactContents;
            });
        }
        params.watch = params.normalizeds.some(function (norm) {
            return Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1 && Twinkle.getPref('watchSpeedyExpiry');
        });
        params.welcomeuser = (params.notifyUser || params.warnUser) && params.normalizeds.some(function (norm) {
            return Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1;
        });
        this.preprocessParamInputs();
    };
    Speedy.prototype.preprocessParamInputs = function () {
        var params = this.params; // shortcut reference
        if (params.banned_user) {
            params.banned_user = params.banned_user.replace(/^\s*User:/i, '');
        }
        if (params.redundantimage_filename) {
            params.redundantimage_filename = new mw.Title(params.redundantimage_filename, 6).toText();
        }
        if (params.commons_filename && params.commons_filename !== Morebits.pageNameNorm) {
            params.commons_filename = new mw.Title(params.commons_filename, 6).toText();
        }
    };
    /**
     * Creates this.params.templateParams, an array of objects each object
     * representing the template parameters for a criterion.
     */
    Speedy.prototype.getTemplateParameters = function () {
        var _this = this;
        this.params.templateParams = new Array(this.params.csd.length);
        this.params.csd.forEach(function (value, idx) {
            var crit = _this.flatObject[value];
            var params = {};
            makeArray(crit.subgroup).forEach(function (subgroup) {
                if (subgroup.parameter && _this.params[subgroup.name]) {
                    params[subgroup.parameter] = _this.params[subgroup.name];
                }
            });
            _this.params.templateParams[idx] = params;
        });
    };
    /**
     * Gets wikitext of the tag to be added to the page being nominated.
     * @returns {string}
     */
    Speedy.prototype.getTaggingCode = function () {
        var params = this.params;
        var code = '';
        if (params.normalizeds.length > 1) {
            code = '{{db-multiple';
            params.normalizeds.forEach(function (norm, idx) {
                code += '|' + norm.toUpperCase();
                obj_entries(params.templateParams[idx]).forEach(function (_a) {
                    var param = _a[0], value = _a[1];
                    // skip numeric parameters - {{db-multiple}} doesn't understand them
                    if (!parseInt(param, 10)) {
                        code += '|' + param + '=' + value;
                    }
                });
            });
            code += '}}';
        }
        else {
            code = '{{db-' + params.csd[0];
            obj_entries(params.templateParams[0]).forEach(function (_a) {
                var param = _a[0], value = _a[1];
                code += '|' + param + '=' + value;
            });
            if (params.notifyUser) {
                code += '|help=off';
            }
            code += '}}';
        }
        return code;
    };
    /**
     * Creates this.params.utparams, object of parameters for the user notification
     * template
     */
    Speedy.prototype.getUserTalkParameters = function () {
        var _this = this;
        var utparams = {};
        this.params.csd.forEach(function (csd) {
            var subgroups = makeArray(_this.flatObject[csd].subgroup);
            subgroups.forEach(function (subgroup, idx) {
                if (subgroup.utparam && _this.params[subgroup.name]) {
                    // For {{db-csd-notice-custom}} (single criterion selected)
                    utparams['key' + (idx + 1)] = subgroup.utparam;
                    utparams['value' + (idx + 1)] = _this.params[subgroup.name];
                    // For {{db-notice-multiple}} (multiple criterion selected)
                    utparams[subgroup.utparam] = _this.params[subgroup.name];
                }
            });
        });
        this.params.utparams = utparams;
    };
    Speedy.prototype.getUserNotificationText = function () {
        var params = this.params;
        var notifytext = '';
        // special cases: "db" and "db-multiple"
        if (params.normalizeds.length > 1) {
            notifytext = '\n{{subst:db-' + (params.warnUser ? 'deleted' : 'notice') + '-multiple|1=' + Morebits.pageNameNorm;
            params.normalizeds.forEach(function (norm, idx) {
                notifytext += '|' + (idx + 2) + '=' + norm.toUpperCase();
            });
        }
        else if (params.normalizeds[0] === 'db') {
            notifytext = '\n{{subst:db-reason-' + (params.warnUser ? 'deleted' : 'notice') + '|1=' + Morebits.pageNameNorm;
        }
        else {
            notifytext = '\n{{subst:db-csd-' + (params.warnUser ? 'deleted' : 'notice') + '-custom|1=';
            // Get rid of this by tweaking the template!
            if (params.csd[0] === 'copypaste') {
                notifytext += params.templateParams[0].sourcepage;
            }
            else {
                notifytext += Morebits.pageNameNorm;
            }
            notifytext += '|2=' + params.csd[0];
        }
        this.getUserTalkParameters();
        obj_entries(params.utparams).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            notifytext += '|' + key + '=' + value;
        });
        notifytext += (params.welcomeuser ? '' : '|nowelcome=yes') + '}} ~~~~';
        return notifytext;
    };
    Speedy.prototype.fetchCreatorInfo = function () {
        var _this = this;
        var def = $.Deferred();
        // No user notification being made, no need to fetch creator
        if (!this.params.notifyUser && !this.params.warnUser) {
            return def.resolve();
        }
        var thispage = new Morebits.wiki.page(Morebits.pageNameNorm, 'Finding page creator');
        thispage.lookupCreation(function (pageobj) {
            _this.params.initialContrib = pageobj.getCreator();
            pageobj.getStatusElement().info('Found ' + pageobj.getCreator());
            def.resolve();
        });
        return def;
    };
    Speedy.prototype.patrolPage = function () {
        if (Twinkle.getPref('markSpeedyPagesAsPatrolled')) {
            new Morebits.wiki.page(Morebits.pageNameNorm).triage();
        }
        return $.Deferred().resolve();
    };
    Speedy.prototype.checkPage = function () {
        var def = $.Deferred();
        var pageobj = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page');
        pageobj.setChangeTags(Twinkle.changeTags);
        pageobj.load(function (pageobj) {
            var statelem = pageobj.getStatusElement();
            if (!pageobj.exists()) {
                statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
                return def.reject();
            }
            var text = pageobj.getPageText();
            statelem.status('Checking for tags on the page...');
            // check for existing speedy deletion tags
            var tag = /(?:\{\{\s*(db|delete|db-.*?|speedy deletion-.*?)(?:\s*\||\s*\}\}))/.exec(text);
            // This won't make use of the db-multiple template but it probably should
            if (tag && !confirm('The page already has the CSD-related template {{' + tag[1] + '}} on it.  Do you want to add another CSD template?')) {
                return def.reject();
            }
            // check for existing XFD tags
            var xfd = /\{\{((?:article for deletion|proposed deletion|prod blp|template for discussion)\/dated|[cfm]fd\b)/i.exec(text) || /#invoke:(RfD)/.exec(text);
            if (xfd && !confirm('The deletion-related template {{' + xfd[1] + '}} was found on the page. Do you still want to add a CSD template?')) {
                return def.reject();
            }
            def.resolve(pageobj);
        }, def.reject);
        return def;
    };
    Speedy.prototype.tagPage = function (pageobj) {
        var def = $.Deferred();
        var params = this.params;
        var text = pageobj.getPageText();
        var code = this.getTaggingCode();
        // Set the correct value for |ts= parameter in {{db-g13}}
        if (params.normalizeds.indexOf('g13') !== -1) {
            code = code.replace('$TIMESTAMP', pageobj.getLastEditTime());
        }
        if (params.requestsalt) {
            code = '{{salt}}\n' + code;
        }
        // Post on talk if it is not possible to tag
        if (!pageobj.canEdit() || ['wikitext', 'Scribunto', 'javascript', 'css', 'sanitized-css'].indexOf(pageobj.getContentModel()) === -1) { // Attempt to place on talk page
            var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
            if (talkName === pageobj.getPageName()) {
                pageobj.getStatusElement().error('Page protected and nowhere to add an edit request, aborting');
                return def.reject();
            }
            pageobj.getStatusElement().warn('Unable to edit page, placing tag on talk page');
            var talk_page = new Morebits.wiki.page(talkName, 'Automatically placing tag on talk page');
            talk_page.setNewSectionTitle(pageobj.getPageName() + ' nominated for CSD, request deletion');
            talk_page.setNewSectionText(code + '\n\nI was unable to tag ' + pageobj.getPageName() + ' so please delete it. ~~~~');
            talk_page.setCreateOption('recreate');
            talk_page.setFollowRedirect(true);
            talk_page.setWatchlist(params.watch);
            talk_page.setChangeTags(Twinkle.changeTags);
            talk_page.newSection(def.resolve, def.reject);
            return def;
        }
        // Remove tags that become superfluous with this action
        text = text.replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
        if (mw.config.get('wgNamespaceNumber') === 6) {
            // remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
            text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
        }
        // Wrap SD template in noinclude tags if we are in template space.
        // Won't work with userboxes in userspace, or any other transcluded page outside template space
        if (mw.config.get('wgNamespaceNumber') === 10) { // Template:
            code = '<noinclude>' + code + '</noinclude>';
        }
        if (mw.config.get('wgPageContentModel') === 'Scribunto') {
            // Scribunto isn't parsed like wikitext, so CSD templates on modules need special handling to work
            var equals = '';
            while (code.indexOf(']' + equals + ']') !== -1) {
                equals += '=';
            }
            code = "require('Module:Module wikitext')._addText([" + equals + '[' + code + ']' + equals + ']);';
        }
        else if (['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1) {
            // Likewise for JS/CSS pages
            code = '/* ' + code + ' */';
        }
        // Generate edit summary for edit
        var editsummary;
        if (params.normalizeds[0] === 'db') {
            editsummary = 'Requesting [[WP:CSD|speedy deletion]] with rationale "' + params.templateParams[0]['1'] + '".';
        }
        else {
            var criteriaText = params.normalizeds.map(function (norm) {
                return '[[WP:CSD#' + norm.toUpperCase() + '|CSD ' + norm.toUpperCase() + ']]';
            }).join(', ');
            editsummary = 'Requesting speedy deletion (' + criteriaText + ').';
        }
        // Blank attack pages
        if (params.redactContents) {
            text = code;
        }
        else {
            // Insert tag after short description or any hatnotes
            var wikipage = new Morebits.wikitext.page(text);
            text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
        }
        pageobj.setPageText(text);
        pageobj.setEditSummary(editsummary);
        pageobj.setWatchlist(params.watch);
        pageobj.save(def.resolve, def.reject);
        return def;
    };
    Speedy.prototype.noteToCreator = function () {
        var def = $.Deferred();
        var params = this.params;
        var initialContrib = params.initialContrib;
        // User notification not chosen
        if (!initialContrib) {
            return def.resolve();
            // disallow notifying yourself
        }
        else if (initialContrib === mw.config.get('wgUserName')) {
            Morebits.status.warn('Note', 'You (' + initialContrib + ') created this page; skipping user notification');
            initialContrib = null;
            // don't notify users when their user talk page is nominated/deleted
        }
        else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
            Morebits.status.warn('Note', 'Notifying initial contributor: this user created their own user talk page; skipping notification');
            initialContrib = null;
            // quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
        }
        else if ((initialContrib === 'Cyberbot I' || initialContrib === 'SoxBot') && params.normalizeds[0] === 'f2') {
            Morebits.status.warn('Note', 'Notifying initial contributor: page created procedurally by bot; skipping notification');
            initialContrib = null;
            // Check for already existing tags
        }
        else if (this.hasCSD && params.warnUser && !confirm('The page is has a deletion-related tag, and thus the creator has likely been notified.  Do you want to notify them for this deletion as well?')) {
            Morebits.status.info('Notifying initial contributor', 'canceled by user; skipping notification.');
            initialContrib = null;
        }
        if (!initialContrib) {
            params.initialContrib = null;
            return def.resolve();
        }
        var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
        var editsummary = 'Notification: speedy deletion' + (params.warnUser ? '' : ' nomination');
        if (!params.redactContents) { // no article name in summary for attack page taggings
            editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
        }
        else {
            editsummary += ' of an attack page.';
        }
        usertalkpage.setAppendText(this.getUserNotificationText());
        usertalkpage.setEditSummary(editsummary);
        usertalkpage.setChangeTags(Twinkle.changeTags);
        usertalkpage.setCreateOption('recreate');
        usertalkpage.setFollowRedirect(true, false);
        usertalkpage.append(def.resolve, def.reject);
        return def;
    };
    Speedy.prototype.parseWikitext = function (wikitext) {
        var statusIndicator = new Morebits.status('Building deletion summary');
        var api = new Morebits.wiki.api('Parsing deletion template', {
            action: 'parse',
            prop: 'text',
            pst: 'true',
            text: wikitext,
            contentmodel: 'wikitext',
            title: mw.config.get('wgPageName'),
            disablelimitreport: true,
            format: 'json'
        });
        api.setStatusElement(statusIndicator);
        return api.post().then(function (apiobj) {
            var reason = decodeURIComponent($(apiobj.getResponse().parse.text).find('#delete-reason').text()).replace(/\+/g, ' ');
            if (!reason) {
                statusIndicator.warn('Unable to generate summary from deletion template');
            }
            else {
                statusIndicator.info('complete');
            }
            return reason;
        });
    };
    Speedy.prototype.parseDeletionReason = function () {
        var params = this.params;
        if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
            params.deleteReason = prompt('Enter the deletion summary to use, which will be entered into the deletion log:', '');
            return $.Deferred().resolve();
        }
        else {
            var code = this.getTaggingCode();
            return this.parseWikitext(code).then(function (reason) {
                if (params.promptForSummary) {
                    reason = prompt('Enter the deletion summary to use, or press OK to accept the automatically generated one.', reason);
                }
                params.deleteReason = reason;
            });
        }
    };
    Speedy.prototype.deletePage = function () {
        var def = $.Deferred();
        var params = this.params;
        var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Deleting page');
        if (params.deleteReason === null) {
            Morebits.status.error('Asking for reason', 'User cancelled');
            return def.reject();
        }
        else if (!params.deleteReason || !params.deleteReason.trim()) {
            Morebits.status.error('Asking for reason', "you didn't give one.  I don't know... what with admins and their apathetic antics... I give up...");
            return def.reject();
        }
        thispage.setEditSummary(params.deleteReason);
        thispage.setChangeTags(Twinkle.changeTags);
        thispage.setWatchlist(params.watch);
        thispage.deletePage(function () {
            thispage.getStatusElement().info('done');
            def.resolve();
        }, def.reject);
        return def;
    };
    Speedy.prototype.deleteTalk = function () {
        var def = $.Deferred();
        var params = this.params;
        if (params.deleteTalkPage &&
            document.getElementById('ca-talk').className !== 'new') {
            var talkpage = new Morebits.wiki.page(new mw.Title(Morebits.pageNameNorm).getTalkPage().toText(), 'Deleting talk page');
            talkpage.setEditSummary('[[WP:CSD#G8|G8]]: Talk page of deleted page "' + Morebits.pageNameNorm + '"');
            talkpage.setChangeTags(Twinkle.changeTags);
            talkpage.deletePage(function () {
                talkpage.getStatusElement().info('done');
                def.resolve();
            }, def.reject);
        }
        else {
            def.resolve();
        }
        return def;
    };
    Speedy.prototype.deleteRedirects = function () {
        var _this = this;
        var def = $.Deferred();
        var params = this.params;
        if (params.deleteRedirects) {
            var wikipedia_api = new Morebits.wiki.api('getting list of redirects...', {
                action: 'query',
                titles: mw.config.get('wgPageName'),
                prop: 'redirects',
                rdlimit: 'max',
                format: 'json'
            });
            wikipedia_api.setStatusElement(new Morebits.status('Deleting redirects'));
            wikipedia_api.post().then(function (apiobj) {
                var response = apiobj.getResponse();
                var snapshot = response.query.pages[0].redirects || [];
                var total = snapshot.length;
                var statusIndicator = apiobj.getStatusElement();
                if (!total) {
                    statusIndicator.status('no redirects found');
                    return;
                }
                statusIndicator.status('0%');
                var current = 0;
                var onsuccess = function (apiobjInner) {
                    var now = Math.round(100 * ++current / total) + '%';
                    statusIndicator.update(now);
                    apiobjInner.getStatusElement().unlink();
                    if (current >= total) {
                        statusIndicator.info(now + ' (completed)');
                        def.resolve();
                        Morebits.wiki.removeCheckpoint();
                    }
                };
                Morebits.wiki.addCheckpoint();
                snapshot.forEach(function (value) {
                    var title = value.title;
                    var page = new Morebits.wiki.page(title, 'Deleting redirect "' + title + '"');
                    page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page "' + Morebits.pageNameNorm + '"');
                    page.setChangeTags(Twinkle.changeTags);
                    page.deletePage(onsuccess);
                });
            });
        }
        else {
            def.resolve();
        }
        // promote Unlink tool
        var $link, $bigtext;
        var isFile = mw.config.get('wgNamespaceNumber') === 6;
        $link = $('<a>', {
            href: '#',
            text: 'click here to go to the Unlink tool',
            css: { fontSize: '130%', fontWeight: 'bold' },
            click: function () {
                Morebits.wiki.actionCompleted.redirect = null;
                _this.dialog.close();
                Twinkle.unlink.callback(isFile ? 'Removing usages of and/or links to deleted file ' + Morebits.pageNameNorm : 'Removing links to deleted page ' + Morebits.pageNameNorm);
            }
        });
        $bigtext = $('<span>', {
            text: isFile ? 'To orphan backlinks and remove instances of file usage' : 'To orphan backlinks',
            css: { fontSize: '130%', fontWeight: 'bold' }
        });
        Morebits.status.info($bigtext[0], $link[0]);
        return def;
    };
    Speedy.prototype.addToLog = function () {
        var _this = this;
        var params = this.params;
        var shouldLog = Twinkle.getPref('logSpeedyNominations') && params.normalizeds.some(function (norm) {
            return Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1;
        });
        if (!shouldLog) {
            return $.Deferred().resolve();
        }
        var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
        usl.initialText =
            "This is a log of all [[WP:CSD|speedy deletion]] nominations made by this user using [[WP:TW|Twinkle]]'s CSD module.\n\n" +
                'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
                'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
                (Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');
        var extraInfo = '';
        // If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
        var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';
        var editsummary = 'Logging speedy deletion nomination';
        var appendText = '# [[:' + Morebits.pageNameNorm;
        if (!params.redactContents) { // no article name in log for attack page taggings
            appendText += ']]' + fileLogLink + ': ';
            editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
        }
        else {
            appendText += '|This]] attack page' + fileLogLink + ': ';
            editsummary += ' of an attack page.';
        }
        if (params.normalizeds.length > 1) {
            var criteriaText = params.normalizeds.map(function (norm) {
                return '[[WP:CSD#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']]';
            }).join(', ');
            appendText += 'multiple criteria (' + criteriaText + ')';
        }
        else if (params.normalizeds[0] === 'db') {
            appendText += '{{tl|db-reason}}';
        }
        else {
            appendText += '[[WP:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']] ({{tl|db-' + params.csd[0] + '}})';
        }
        // Treat custom rationale individually
        if (params.normalizeds[0] === 'db') {
            extraInfo += " {Custom rationale: " + params.templateParams[0]['1'] + "}";
        }
        else {
            params.csd.forEach(function (crit) {
                var critObject = _this.flatObject[crit];
                var critCode = critObject.code.toUpperCase();
                var subgroups = makeArray(critObject.subgroup);
                subgroups.forEach(function (subgroup) {
                    var value = params[subgroup.name];
                    if (!value || !subgroup.parameter) {
                        // no value was entered, or it's a hidden field or something
                        return;
                    }
                    if (subgroup.log) {
                        value = Morebits.string.safeReplace(subgroup.log, /\$1/g, value);
                    }
                    else if (subgroup.log === null) {
                        // logging is disabled
                        return;
                    }
                    extraInfo += " {" + critCode + " " + subgroup.parameter + ": " + value + "}";
                });
            });
        }
        if (params.requestsalt) {
            appendText += '; requested creation protection ([[WP:SALT|salting]])';
        }
        if (extraInfo) {
            appendText += '; additional information:' + extraInfo;
        }
        if (params.initialContrib) {
            appendText += '; notified {{user|1=' + params.initialContrib + '}}';
        }
        appendText += ' ~~~~~\n';
        usl.changeTags = Twinkle.changeTags;
        return usl.log(appendText, editsummary);
    };
    /**
     * If validation fails, returns a string to be shown to user via alert(), if validation
     * succeeds, doesn't return anything.
     */
    Speedy.prototype.validateInputs = function () {
        var input = this.params;
        var csd = new Set(input.csd); // optimise look-ups
        if (csd.has('userreq') &&
            mw.config.get('wgNamespaceNumber') === 3 &&
            !(/\//).test(mw.config.get('wgTitle')) &&
            !input.userreq_rationale) {
            return 'CSD U1:  Please specify a rationale when nominating user talk pages.';
        }
        if (csd.has('repost') &&
            input.repost_xfd &&
            !/^(?:wp|wikipedia):/i.test(input.repost_xfd)) {
            return 'CSD G4:  The deletion discussion page name, if provided, must start with "Wikipedia:".';
        }
        if (csd.has('xfd') &&
            input.xfd_fullvotepage &&
            !/^(?:wp|wikipedia):/i.test(input.xfd_fullvotepage)) {
            return 'CSD G6 (XFD):  The deletion discussion page name, if provided, must start with "Wikipedia:".';
        }
        if (csd.has('imgcopyvio') &&
            !input.imgcopyvio_url && !input.imgcopyvio_rationale) {
            return 'CSD F9: You must enter a url or reason (or both) when nominating a file under F9.';
        }
    };
    return Speedy;
}(TwinkleModule));
Speedy.criteriaLists = [
    {
        label: 'Custom rationale',
        visible: function (self) { return !self.mode.isMultiple; },
        list: [
            {
                label: 'Custom rationale' + (Morebits.userIsSysop ? ' (custom deletion reason)' : ' using {{db}} template'),
                value: 'reason',
                code: 'db',
                tooltip: '{{db}} is short for "delete because". At least one of the other deletion criteria must still apply to the page, and you must make mention of this in your rationale. This is not a "catch-all" for when you can\'t find any criteria that fit.',
                subgroup: {
                    name: 'reason_1',
                    parameter: '1',
                    utparam: '2',
                    type: 'input',
                    label: 'Rationale: ',
                    size: 60
                },
                hideWhenMultiple: true
            }
        ]
    },
    {
        label: 'Talk pages',
        // show on talk pages, but not user talk pages
        visible: function (self) { return self.namespace % 2 === 1 && self.namespace !== 3; },
        list: [
            {
                label: 'G8: Talk pages with no corresponding subject page',
                value: 'talk',
                code: 'g8',
                tooltip: 'This excludes any page that is useful to the project - in particular, user talk pages, talk page archives, and talk pages for files that exist on Wikimedia Commons.'
            }
        ]
    },
    {
        label: 'Files',
        visible: function (self) { return !self.isRedirect && arr_includes([6, 7], self.namespace); },
        list: [
            {
                label: 'F1: Redundant file',
                value: 'redundantimage',
                code: 'f1',
                tooltip: 'Any file that is a redundant copy, in the same file format and same or lower resolution, of something else on Wikipedia. Likewise, other media that is a redundant copy, in the same format and of the same or lower quality. This does not apply to files duplicated on Wikimedia Commons, because of licence issues; these should be tagged with {{subst:ncd|Image:newname.ext}} or {{subst:ncd}} instead',
                subgroup: {
                    name: 'redundantimage_filename',
                    parameter: 'filename',
                    log: '[[:$1]]',
                    type: 'input',
                    label: 'File this is redundant to: ',
                    tooltip: 'The "File:" prefix can be left off.'
                }
            },
            {
                label: 'F2: Corrupt, missing, or empty file',
                value: 'noimage',
                code: 'f2',
                tooltip: 'Before deleting this type of file, verify that the MediaWiki engine cannot read it by previewing a resized thumbnail of it. This also includes empty (i.e., no content) file description pages for Commons files'
            },
            {
                label: 'F2: Unneeded file description page for a file on Commons',
                value: 'fpcfail',
                code: 'f2',
                tooltip: 'An image, hosted on Commons, but with tags or information on its English Wikipedia description page that are no longer needed. (For example, a failed featured picture candidate.)',
                hideWhenMultiple: true
            },
            {
                label: 'F3: Improper license',
                value: 'noncom',
                code: 'f3',
                tooltip: 'Files licensed as "for non-commercial use only", "non-derivative use" or "used with permission" that were uploaded on or after 2005-05-19, except where they have been shown to comply with the limited standards for the use of non-free content. This includes files licensed under a "Non-commercial Creative Commons License". Such files uploaded before 2005-05-19 may also be speedily deleted if they are not used in any articles'
            },
            {
                label: 'F4: Lack of licensing information',
                value: 'unksource',
                code: 'f4',
                tooltip: 'Files in category "Files with unknown source", "Files with unknown copyright status", or "Files with no copyright tag" that have been tagged with a template that places them in the category for more than seven days, regardless of when uploaded. Note, users sometimes specify their source in the upload summary, so be sure to check the circumstances of the file.',
                hideWhenUser: true
            },
            {
                label: 'F5: Unused non-free copyrighted file',
                value: 'f5',
                code: 'f5',
                tooltip: 'Files that are not under a free license or in the public domain that are not used in any article, whose only use is in a deleted article, and that are very unlikely to be used on any other article. Reasonable exceptions may be made for files uploaded for an upcoming article. For other unused non-free files, use the "Orphaned fair use" option in Twinkle\'s DI tab.',
                hideWhenUser: true
            },
            {
                label: 'F6: Missing fair-use rationale',
                value: 'norat',
                code: 'f6',
                tooltip: 'Any file without a fair use rationale may be deleted seven days after it is uploaded.  Boilerplate fair use templates do not constitute a fair use rationale.  Files uploaded before 2006-05-04 should not be deleted immediately; instead, the uploader should be notified that a fair-use rationale is needed.  Files uploaded after 2006-05-04 can be tagged using the "No fair use rationale" option in Twinkle\'s DI module. Such files can be found in the dated subcategories of Category:Files with no fair use rationale.',
                hideWhenUser: true
            },
            {
                label: 'F7: Clearly invalid fair-use tag',
                value: 'badfairuse1',
                code: 'f7',
                tooltip: 'This is only for files with a clearly invalid fair-use tag, such as a {{Non-free logo}} tag on a photograph of a mascot. For cases that require a waiting period (replaceable images or otherwise disputed rationales), use the options on Twinkle\'s DI tab.',
                subgroup: {
                    name: 'badfairuse_rationale',
                    parameter: 'rationale',
                    type: 'input',
                    label: 'Optional explanation: ',
                    size: 60
                }
            },
            {
                label: 'F7: Fair-use media from a commercial image agency which is not the subject of sourced commentary',
                value: 'badfairuse2',
                code: 'f7',
                tooltip: 'Non-free images or media from a commercial source (e.g., Associated Press, Getty), where the file itself is not the subject of sourced commentary, are considered an invalid claim of fair use and fail the strict requirements of WP:NFCC.',
                subgroup: {
                    name: 'badfairuse_rationale',
                    parameter: 'rationale',
                    type: 'input',
                    label: 'Optional explanation: ',
                    size: 60
                },
                hideWhenMultiple: true
            },
            {
                label: 'F8: File available as an identical or higher-resolution copy on Wikimedia Commons',
                value: 'commons',
                code: 'f8',
                tooltip: 'Provided the following conditions are met: 1: The file format of both images is the same. 2: The file\'s license and source status is beyond reasonable doubt, and the license is undoubtedly accepted at Commons. 3: All information on the file description page is present on the Commons file description page. That includes the complete upload history with links to the uploader\'s local user pages. 4: The file is not protected, and the file description page does not contain a request not to move it to Commons. 5: If the file is available on Commons under a different name than locally, all local references to the file must be updated to point to the title used at Commons. 6: For {{c-uploaded}} files: They may be speedily deleted as soon as they are off the Main Page',
                subgroup: {
                    name: 'commons_filename',
                    parameter: 'filename',
                    log: '[[commons:$1]]',
                    type: 'input',
                    label: 'Filename on Commons: ',
                    value: Morebits.pageNameNorm,
                    tooltip: 'This can be left blank if the file has the same name on Commons as here. The "File:" prefix is optional.'
                },
                hideWhenMultiple: true
            },
            {
                label: 'F9: Unambiguous copyright infringement',
                value: 'imgcopyvio',
                code: 'f9',
                tooltip: 'The file was copied from a website or other source that does not have a license compatible with Wikipedia, and the uploader neither claims fair use nor makes a credible assertion of permission of free use. Sources that do not have a license compatible with Wikipedia include stock photo libraries such as Getty Images or Corbis. Non-blatant copyright infringements should be discussed at Wikipedia:Files for deletion',
                subgroup: [
                    {
                        name: 'imgcopyvio_url',
                        parameter: 'url',
                        utparam: 'url',
                        type: 'input',
                        label: 'URL of the copyvio, including the "http://".  If the copyvio is of a non-internet source and you cannot provide a URL, you must use the deletion rationale box. ',
                        size: 60
                    },
                    {
                        name: 'imgcopyvio_rationale',
                        parameter: 'rationale',
                        type: 'input',
                        label: 'Deletion rationale for non-internet copyvios: ',
                        size: 60
                    }
                ]
            },
            {
                label: 'F10: Useless non-media file',
                value: 'badfiletype',
                code: 'f10',
                tooltip: 'Files uploaded that are neither image, sound, nor video files (e.g. .doc, .pdf, or .xls files) which are not used in any article and have no foreseeable encyclopedic use'
            },
            {
                label: 'F11: No evidence of permission',
                value: 'nopermission',
                code: 'f11',
                tooltip: 'If an uploader has specified a license and has named a third party as the source/copyright holder without providing evidence that this third party has in fact agreed, the item may be deleted seven days after notification of the uploader',
                hideWhenUser: true
            },
            {
                label: 'G8: File description page with no corresponding file',
                value: 'imagepage',
                code: 'g8',
                tooltip: 'This is only for use when the file doesn\'t exist at all. Corrupt files, and local description pages for files on Commons, should use F2; implausible redirects should use R3; and broken Commons redirects should use R4.'
            }
        ]
    },
    {
        label: 'Articles',
        visible: function (self) { return !self.isRedirect && arr_includes([0, 1], self.namespace); },
        list: [
            {
                label: 'A1: No context. Articles lacking sufficient context to identify the subject of the article.',
                value: 'nocontext',
                code: 'a1',
                tooltip: 'Example: "He is a funny man with a red car. He makes people laugh." This applies only to very short articles. Context is different from content, treated in A3, below.'
            },
            {
                label: 'A2: Foreign language articles that exist on another Wikimedia project',
                value: 'foreign',
                code: 'a2',
                tooltip: 'If the article in question does not exist on another project, the template {{notenglish}} should be used instead. All articles in a non-English language that do not meet this criteria (and do not meet any other criteria for speedy deletion) should be listed at Pages Needing Translation (PNT) for review and possible translation',
                subgroup: {
                    name: 'foreign_source',
                    parameter: 'source',
                    utparam: 'source',
                    log: '[[:$1]]',
                    type: 'input',
                    label: 'Interwiki link to the article on the foreign-language wiki: ',
                    tooltip: 'For example, fr:Bonjour'
                }
            },
            {
                label: 'A3: No content whatsoever',
                value: 'nocontent',
                code: 'a3',
                tooltip: 'Any article consisting only of links elsewhere (including hyperlinks, category tags and "see also" sections), a rephrasing of the title, and/or attempts to correspond with the person or group named by its title. This does not include disambiguation pages'
            },
            {
                label: 'A5: Transwikied articles',
                value: 'transwiki',
                code: 'a5',
                tooltip: 'Any article that has been discussed at Articles for Deletion (et al), where the outcome was to transwiki, and where the transwikification has been properly performed and the author information recorded. Alternately, any article that consists of only a dictionary definition, where the transwikification has been properly performed and the author information recorded',
                subgroup: {
                    name: 'transwiki_location',
                    parameter: 'location',
                    utparam: 'location',
                    type: 'input',
                    label: 'Link to where the page has been transwikied: ',
                    tooltip: 'For example, https://en.wiktionary.org/wiki/twinkle or [[wikt:twinkle]]'
                }
            },
            {
                label: 'A7: No indication of importance (people, groups, companies, web content, individual animals, or organized events)',
                value: 'a7',
                code: 'a7',
                tooltip: 'An article about a real person, group of people, band, club, company, web content, individual animal, tour, or party that does not assert the importance or significance of its subject. If controversial, or if a previous AfD has resulted in the article being kept, the article should be nominated for AfD instead',
                hideWhenSingle: true
            },
            {
                label: 'A7: No indication of importance (person)',
                value: 'person',
                code: 'a7',
                tooltip: 'An article about a real person that does not assert the importance or significance of its subject. If controversial, or if there has been a previous AfD that resulted in the article being kept, the article should be nominated for AfD instead',
                hideWhenMultiple: true
            },
            {
                label: 'A7: No indication of importance (musician(s) or band)',
                value: 'band',
                code: 'a7',
                tooltip: 'Article about a band, singer, musician, or musical ensemble that does not assert the importance or significance of the subject',
                hideWhenMultiple: true
            },
            {
                label: 'A7: No indication of importance (club, society or group)',
                value: 'club',
                code: 'a7',
                tooltip: 'Article about a club, society or group that does not assert the importance or significance of the subject',
                hideWhenMultiple: true
            },
            {
                label: 'A7: No indication of importance (company or organization)',
                value: 'corp',
                code: 'a7',
                tooltip: 'Article about a company or organization that does not assert the importance or significance of the subject',
                hideWhenMultiple: true
            },
            {
                label: 'A7: No indication of importance (website or web content)',
                value: 'web',
                code: 'a7',
                tooltip: 'Article about a web site, blog, online forum, webcomic, podcast, or similar web content that does not assert the importance or significance of its subject',
                hideWhenMultiple: true
            },
            {
                label: 'A7: No indication of importance (individual animal)',
                value: 'animal',
                code: 'a7',
                tooltip: 'Article about an individual animal (e.g. pet) that does not assert the importance or significance of its subject',
                hideWhenMultiple: true
            },
            {
                label: 'A7: No indication of importance (organized event)',
                value: 'event',
                code: 'a7',
                tooltip: 'Article about an organized event (tour, function, meeting, party, etc.) that does not assert the importance or significance of its subject',
                hideWhenMultiple: true
            },
            {
                label: 'A9: Unremarkable musical recording where artist\'s article doesn\'t exist',
                value: 'a9',
                code: 'a9',
                tooltip: 'An article about a musical recording which does not indicate why its subject is important or significant, and where the artist\'s article has never existed or has been deleted'
            },
            {
                label: 'A10: Recently created article that duplicates an existing topic',
                value: 'a10',
                code: 'a10',
                tooltip: 'A recently created article with no relevant page history that does not aim to expand upon, detail or improve information within any existing article(s) on the subject, and where the title is not a plausible redirect. This does not include content forks, split pages or any article that aims at expanding or detailing an existing one.',
                subgroup: {
                    name: 'a10_article',
                    parameter: 'article',
                    utparam: 'article',
                    log: '[[:$1]]',
                    type: 'input',
                    label: 'Article that is duplicated: '
                }
            },
            {
                label: 'A11: Obviously made up by creator, and no claim of significance',
                value: 'madeup',
                code: 'a11',
                tooltip: 'An article which plainly indicates that the subject was invented/coined/discovered by the article\'s creator or someone they know personally, and does not credibly indicate why its subject is important or significant'
            }
        ]
    },
    {
        label: 'Categories',
        visible: function (self) { return !self.isRedirect && arr_includes([14, 15], self.namespace); },
        list: [
            {
                label: 'C1: Empty categories',
                value: 'catempty',
                code: 'c1',
                tooltip: 'Categories that have been unpopulated for at least seven days. This does not apply to categories being discussed at WP:CFD, disambiguation categories, and certain other exceptions. If the category isn\'t relatively new, it possibly contained articles earlier, and deeper investigation is needed'
            },
            {
                label: 'G8: Categories populated by a deleted or retargeted template',
                value: 'templatecat',
                code: 'g8',
                tooltip: 'This is for situations where a category is effectively empty, because the template(s) that formerly placed pages in that category are now deleted. This excludes categories that are still in use.',
                subgroup: {
                    name: 'templatecat_rationale',
                    parameter: 'rationale',
                    type: 'input',
                    label: 'Optional explanation: ',
                    size: 60
                }
            },
            {
                label: 'G8: Redirects to non-existent targets',
                value: 'redirnone',
                code: 'g8',
                tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
                hideWhenMultiple: true
            }
        ]
    },
    {
        label: 'User pages',
        visible: function (self) { return arr_includes([2, 3], self.namespace); },
        list: [
            {
                label: 'U1: User request',
                value: 'userreq',
                code: 'u1',
                tooltip: 'Personal subpages, upon request by their user. In some rare cases there may be administrative need to retain the page. Also, sometimes, main user pages may be deleted as well. See Wikipedia:User page for full instructions and guidelines',
                subgroup: mw.config.get('wgNamespaceNumber') === 3 && mw.config.get('wgTitle').indexOf('/') === -1 ? {
                    name: 'userreq_rationale',
                    parameter: 'rationale',
                    type: 'input',
                    label: 'A mandatory rationale to explain why this user talk page should be deleted: ',
                    tooltip: 'User talk pages are deleted only in highly exceptional circumstances. See WP:DELTALK.',
                    size: 60
                } : null,
                hideSubgroupWhenMultiple: true
            },
            {
                label: 'U2: Nonexistent user',
                value: 'nouser',
                code: 'u2',
                tooltip: 'User pages of users that do not exist (Check Special:Listusers)'
            },
            {
                label: 'U3: Non-free galleries',
                value: 'gallery',
                code: 'u3',
                tooltip: 'Galleries in the userspace which consist mostly of "fair use" or non-free files. Wikipedia\'s non-free content policy forbids users from displaying non-free files, even ones they have uploaded themselves, in userspace. It is acceptable to have free files, GFDL-files, Creative Commons and similar licenses along with public domain material, but not "fair use" files',
                hideWhenRedirect: true
            },
            {
                label: 'U5: Blatant WP:NOTWEBHOST violations',
                value: 'notwebhost',
                code: 'u5',
                tooltip: 'Pages in userspace consisting of writings, information, discussions, and/or activities not closely related to Wikipedia\'s goals, where the owner has made few or no edits outside of userspace, with the exception of plausible drafts and pages adhering to WP:UPYES.',
                hideWhenRedirect: true
            },
            {
                label: 'G11: Promotional user page under a promotional user name',
                value: 'spamuser',
                code: 'g11',
                tooltip: 'A promotional user page, with a username that promotes or implies affiliation with the thing being promoted. Note that simply having a page on a company or product in one\'s userspace does not qualify it for deletion. If a user page is spammy but the username is not, then consider tagging with regular G11 instead.',
                hideWhenMultiple: true,
                hideWhenRedirect: true
            },
            {
                label: 'G13: AfC draft submission or a blank draft, stale by over 6 months',
                value: 'afc',
                code: 'g13',
                tooltip: 'Any rejected or unsubmitted AfC draft submission or a blank draft, that has not been edited in over 6 months (excluding bot edits).',
                hideWhenMultiple: true,
                hideWhenRedirect: true,
                subgroup: {
                    type: 'hidden',
                    name: 'g13timestamp',
                    parameter: 'ts',
                    value: '$TIMESTAMP' // replaced with the actual timestamp elsewhere
                }
            }
        ],
    },
    {
        label: 'Portals',
        visible: function (self) { return !self.isRedirect && arr_includes([100, 101], self.namespace); },
        list: [
            {
                label: 'P1: Portal that would be subject to speedy deletion if it were an article',
                value: 'p1',
                code: 'p1',
                tooltip: 'You must specify a single article criterion that applies in this case (A1, A3, A7, or A10).',
                subgroup: {
                    name: 'p1_criterion',
                    parameter: 'criterion',
                    utparam: 'criterion',
                    log: '[[WP:CSD#:$1]]',
                    type: 'input',
                    label: 'Article criterion that would apply: '
                }
            },
            {
                label: 'P2: Underpopulated portal (fewer than three non-stub articles)',
                value: 'emptyportal',
                code: 'p2',
                tooltip: 'Any Portal based on a topic for which there is not a non-stub header article, and at least three non-stub articles detailing subject matter that would be appropriate to discuss under the title of that Portal'
            }
        ]
    },
    {
        label: 'General criteria',
        visible: function (self) { return true; },
        list: [
            {
                label: 'G1: Patent nonsense. Pages consisting purely of incoherent text or gibberish with no meaningful content or history.',
                value: 'nonsense',
                code: 'g1',
                tooltip: 'This does not include poor writing, partisan screeds, obscene remarks, vandalism, fictional material, material not in English, poorly translated material, implausible theories, or hoaxes. In short, if you can understand it, G1 does not apply.',
                hideInNamespaces: [2] // Not applicable in userspace
            },
            {
                label: 'G2: Test page',
                value: 'test',
                code: 'g2',
                tooltip: 'A page created to test editing or other Wikipedia functions. Pages in the User namespace are not included, nor are valid but unused or duplicate templates (although criterion T3 may apply).',
                hideInNamespaces: [2] // Not applicable in userspace
            },
            {
                label: 'G3: Pure vandalism',
                value: 'vandalism',
                code: 'g3',
                tooltip: 'Plain pure vandalism (including redirects left behind from pagemove vandalism)'
            },
            {
                label: 'G3: Blatant hoax',
                value: 'hoax',
                code: 'g3',
                tooltip: 'Blatant and obvious hoax, to the point of vandalism',
                hideWhenMultiple: true
            },
            {
                label: 'G4: Recreation of material deleted via a deletion discussion',
                value: 'repost',
                code: 'g4',
                tooltip: 'A copy, by any title, of a page that was deleted via an XfD process or Deletion review, provided that the copy is substantially identical to the deleted version. This clause does not apply to content that has been "userfied", to content undeleted as a result of Deletion review, or if the prior deletions were proposed or speedy deletions, although in this last case, other speedy deletion criteria may still apply',
                subgroup: {
                    name: 'repost_xfd',
                    parameter: 'xfd',
                    utparam: 'xfd',
                    log: '[[:$1]]',
                    type: 'input',
                    label: 'Page where the deletion discussion took place: ',
                    tooltip: 'Must start with "Wikipedia:"',
                    size: 60
                }
            },
            {
                label: 'G5: Created by a banned or blocked user',
                value: 'banned',
                code: 'g5',
                tooltip: 'Pages created by banned or blocked users in violation of their ban or block, and which have no substantial edits by others',
                subgroup: {
                    name: 'banned_user',
                    parameter: 'user',
                    log: '[[:User:$1]]',
                    type: 'input',
                    label: 'Username of banned user (if available): ',
                    tooltip: 'Should not start with "User:"'
                }
            },
            {
                label: 'G6: Move',
                value: 'move',
                code: 'g6',
                tooltip: 'Making way for an uncontroversial move like reversing a redirect',
                subgroup: [
                    {
                        name: 'move_page',
                        parameter: 'page',
                        log: '[[:$1]]',
                        type: 'input',
                        label: 'Page to be moved here: '
                    },
                    {
                        name: 'move_reason',
                        parameter: 'reason',
                        type: 'input',
                        label: 'Reason: ',
                        size: 60
                    }
                ],
                hideWhenMultiple: true
            },
            {
                label: 'G6: XfD',
                value: 'xfd',
                code: 'g6',
                tooltip: 'A deletion discussion (at AfD, FfD, RfD, TfD, CfD, or MfD) was closed as "delete", but the page wasn\'t actually deleted.',
                subgroup: {
                    name: 'xfd_fullvotepage',
                    parameter: 'fullvotepage',
                    log: '[[:$1]]',
                    type: 'input',
                    label: 'Page where the deletion discussion was held: ',
                    tooltip: 'Must start with "Wikipedia:"',
                    size: 40
                },
                hideWhenMultiple: true
            },
            {
                label: 'G6: Copy-and-paste page move',
                value: 'copypaste',
                code: 'g6',
                tooltip: 'This only applies for a copy-and-paste page move of another page that needs to be temporarily deleted to make room for a clean page move.',
                subgroup: [{
                        name: 'copypaste_sourcepage',
                        parameter: 'sourcepage',
                        log: '[[:$1]]',
                        type: 'input',
                        label: 'Original page that was copy-pasted here: '
                    }, {
                        name: 'copypaste_topage',
                        type: 'hidden',
                        value: Morebits.pageNameNorm,
                        utparam: 'to'
                    }],
                hideWhenMultiple: true
            },
            {
                label: 'G6: Housekeeping and non-controversial cleanup',
                value: 'g6',
                code: 'g6',
                tooltip: 'Other routine maintenance tasks',
                subgroup: {
                    name: 'g6_rationale',
                    parameter: 'rationale',
                    type: 'input',
                    label: 'Rationale: ',
                    size: 60
                }
            },
            {
                label: 'G7: Author requests deletion, or author blanked',
                value: 'author',
                code: 'g7',
                tooltip: 'Any page for which deletion is requested by the original author in good faith, provided the page\'s only substantial content was added by its author. If the author blanks the page, this can also be taken as a deletion request.',
                subgroup: {
                    name: 'author_rationale',
                    parameter: 'rationale',
                    type: 'input',
                    label: 'Optional explanation: ',
                    tooltip: 'Perhaps linking to where the author requested this deletion.',
                    size: 60
                },
                hideSubgroupWhenSysop: true
            },
            {
                label: 'G8: Pages dependent on a non-existent or deleted page',
                value: 'g8',
                code: 'g8',
                tooltip: 'such as talk pages with no corresponding subject page; subpages with no parent page; file pages without a corresponding file; redirects to non-existent targets; or categories populated by deleted or retargeted templates. This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
                subgroup: {
                    name: 'g8_rationale',
                    parameter: 'rationale',
                    type: 'input',
                    label: 'Optional explanation: ',
                    size: 60
                },
                hideSubgroupWhenSysop: true
            },
            {
                label: 'G8: Subpages with no parent page',
                value: 'subpage',
                code: 'g8',
                tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
                hideWhenMultiple: true,
                hideInNamespaces: [0, 6, 8] // hide in main, file, and mediawiki-spaces
            },
            {
                label: 'G10: Attack page',
                value: 'attack',
                redactContents: true,
                code: 'g10',
                tooltip: 'Pages that serve no purpose but to disparage or threaten their subject or some other entity (e.g., "John Q. Doe is an imbecile"). This includes a biography of a living person that is negative in tone and unsourced, where there is no NPOV version in the history to revert to. Administrators deleting such pages should not quote the content of the page in the deletion summary!',
                subgroup: {
                    type: 'hidden',
                    name: 'attackBlanked',
                    parameter: 'blanked',
                    value: 'yes'
                }
            },
            {
                label: 'G10: Wholly negative, unsourced BLP',
                value: 'negublp',
                redactContents: true,
                code: 'g10',
                tooltip: 'A biography of a living person that is entirely negative in tone and unsourced, where there is no neutral version in the history to revert to.',
                hideWhenMultiple: true
            },
            {
                label: 'G11: Unambiguous advertising or promotion',
                value: 'spam',
                code: 'g11',
                tooltip: 'Pages which exclusively promote a company, product, group, service, or person and which would need to be fundamentally rewritten in order to become encyclopedic. Note that an article about a company or a product which describes its subject from a neutral point of view does not qualify for this criterion; an article that is blatant advertising should have inappropriate content as well'
            },
            {
                label: 'G12: Unambiguous copyright infringement',
                value: 'copyvio',
                code: 'g12',
                tooltip: 'Either: (1) Material was copied from another website that does not have a license compatible with Wikipedia, or is photography from a stock photo seller (such as Getty Images or Corbis) or other commercial content provider; (2) There is no non-infringing content in the page history worth saving; or (3) The infringement was introduced at once by a single person rather than created organically on wiki and then copied by another website such as one of the many Wikipedia mirrors',
                subgroup: [
                    {
                        name: 'copyvio_url',
                        parameter: 'url',
                        utparam: 'url',
                        type: 'input',
                        label: 'URL (if available): ',
                        tooltip: 'If the material was copied from an online source, put the URL here, including the "http://" or "https://" protocol.',
                        size: 60
                    },
                    {
                        name: 'copyvio_url2',
                        parameter: 'url2',
                        utparam: 'url2',
                        type: 'input',
                        label: 'Additional URL: ',
                        tooltip: 'Optional. Should begin with "http://" or "https://"',
                        size: 60
                    },
                    {
                        name: 'copyvio_url3',
                        parameter: 'url3',
                        utparam: 'url3',
                        type: 'input',
                        label: 'Additional URL: ',
                        tooltip: 'Optional. Should begin with "http://" or "https://"',
                        size: 60
                    }
                ]
            },
            {
                label: 'G13: Page in draft namespace or userspace AfC submission, stale by over 6 months',
                value: 'afc',
                code: 'g13',
                tooltip: 'Any rejected or unsubmitted AfC submission in userspace or any non-redirect page in draft namespace, that has not been edited for more than 6 months. Blank drafts in either namespace are also included.',
                hideWhenRedirect: true,
                showInNamespaces: [2, 118] // user, draft namespaces only
            },
            {
                label: 'G14: Unnecessary disambiguation page',
                value: 'disambig',
                code: 'g14',
                tooltip: 'This only applies for orphaned disambiguation pages which either: (1) disambiguate only one existing Wikipedia page and whose title ends in "(disambiguation)" (i.e., there is a primary topic); or (2) disambiguate no (zero) existing Wikipedia pages, regardless of its title.  It also applies to orphan "Foo (disambiguation)" redirects that target pages that are not disambiguation or similar disambiguation-like pages (such as set index articles or lists)'
            }
        ]
    },
    {
        label: 'Redirects',
        visible: function (self) { return self.isRedirect; },
        list: [
            {
                label: 'R2: Redirect from mainspace to any other namespace except the Category:, Template:, Wikipedia:, Help: and Portal: namespaces',
                value: 'rediruser',
                code: 'r2',
                tooltip: 'This does not include the pseudo-namespace shortcuts. If this was the result of a page move, consider waiting a day or two before deleting the redirect',
                showInNamespaces: [0]
            },
            {
                label: 'R3: Recently created redirect from an implausible typo or misnomer',
                value: 'redirtypo',
                code: 'r3',
                tooltip: 'However, redirects from common misspellings or misnomers are generally useful, as are redirects in other languages'
            },
            {
                label: 'R4: File namespace redirect with a name that matches a Commons page',
                value: 'redircom',
                code: 'r4',
                tooltip: 'The redirect should have no incoming links (unless the links are cleary intended for the file or redirect at Commons).',
                showInNamespaces: [6]
            },
            {
                label: 'G6: Redirect to malplaced disambiguation page',
                value: 'movedab',
                code: 'g6',
                tooltip: 'This only applies for redirects to disambiguation pages ending in (disambiguation) where a primary topic does not exist.',
                hideWhenMultiple: true
            },
            {
                label: 'G8: Redirects to non-existent targets',
                value: 'redirnone',
                code: 'g8',
                tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
                hideWhenMultiple: true
            }
        ]
    }
];
function makeArray(obj) {
    if (!obj) {
        return [];
    }
    if (Array.isArray(obj)) {
        return obj;
    }
    return [obj];
}
Twinkle.addInitCallback(function () { new Speedy(); }, 'CSD');
//# sourceMappingURL=speedy.js.map