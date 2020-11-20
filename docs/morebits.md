<a name="Morebits"></a>

## Morebits : <code>object</code>
A library full of lots of goodness for user scripts on MediaWiki wikis, including Wikipedia.

The highlights include:
- [api](#Morebits.wiki.api) - make calls to the MediaWiki API
- [page](#Morebits.wiki.page) - modify pages on the wiki (edit, revert, delete, etc.)
- [date](#Morebits.date) - enhanced date object processing, sort of a light moment.js
- [quickForm](#Morebits.quickForm) - generate quick HTML forms on the fly
- [simpleWindow](#Morebits.simpleWindow) - a wrapper for jQuery UI Dialog with a custom look and extra features
- [status](#Morebits.status) - a rough-and-ready status message displayer, used by the Morebits.wiki classes
- [wikitext](#Morebits.wikitext) - utilities for dealing with wikitext
- [string](#Morebits.string) - utilities for manipulating strings
- [array](#Morebits.array) - utilities for manipulating arrays
- [ip](#Morebits.ip) - utilities to help process IP addresses

Dependencies:
- The whole thing relies on jQuery.  But most wikis should provide this by default.
- [quickForm](#Morebits.quickForm), [simpleWindow](#Morebits.simpleWindow), and [status](#Morebits.status) rely on the "morebits.css" file for their styling.
- [simpleWindow](#Morebits.simpleWindow) and [quickForm](#Morebits.quickForm) tooltips rely on jQuery UI Dialog (from ResourceLoader module name 'jquery.ui').
- To create a gadget based on morebits.js, use this syntax in MediaWiki:Gadgets-definition:
    - `*GadgetName[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.Title,jquery.ui]|morebits.js|morebits.css|GadgetName.js`
- Alternatively, you can configure morebits.js as a hidden gadget in MediaWiki:Gadgets-definition:
    - `*morebits[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.Title,jquery.ui|hidden]|morebits.js|morebits.css`
    and then load ext.gadget.morebits as one of the dependencies for the new gadget.

All the stuff here works on all browsers for which MediaWiki provides JavaScript support.

This library is maintained by the maintainers of Twinkle.
For queries, suggestions, help, etc., head to [Wikipedia talk:Twinkle on English Wikipedia](http://en.wikipedia.org/wiki/WT:TW).
The latest development source is available at [GitHub](https://github.com/wikimedia-gadgets/twinkle/blob/master/morebits.js).

**Kind**: global namespace  

* [Morebits](#Morebits) : <code>object</code>
    * [.quickForm](#Morebits.quickForm)
        * [new quickForm(event, [eventType])](#new_Morebits.quickForm_new)
        * _instance_
            * [.render()](#Morebits.quickForm+render) ⇒ <code>HTMLElement</code>
            * [.append(data)](#Morebits.quickForm+append) ⇒ [<code>element</code>](#Morebits.quickForm.element)
        * _static_
            * [.element](#Morebits.quickForm.element)
                * [new Morebits.quickForm.element(data)](#new_Morebits.quickForm.element_new)
                * _instance_
                    * [.append(data)](#Morebits.quickForm.element+append) ⇒ [<code>element</code>](#Morebits.quickForm.element)
                    * [.render()](#Morebits.quickForm.element+render) ⇒ <code>HTMLElement</code>
                    * [.compute()](#Morebits.quickForm.element+compute)
                * _static_
                    * [.id](#Morebits.quickForm.element.id) : <code>number</code>
                    * [.generateTooltip(node, data)](#Morebits.quickForm.element.generateTooltip)
            * [.getInputData(form)](#Morebits.quickForm.getInputData) ⇒ <code>object</code>
            * [.getElements(form, fieldName)](#Morebits.quickForm.getElements) ⇒ <code>Array.&lt;HTMLElement&gt;</code>
            * [.getCheckboxOrRadio(elementArray, value)](#Morebits.quickForm.getCheckboxOrRadio) ⇒ <code>HTMLInputElement</code>
            * [.getElementContainer(element)](#Morebits.quickForm.getElementContainer) ⇒ <code>HTMLElement</code>
            * [.getElementLabelObject(element)](#Morebits.quickForm.getElementLabelObject) ⇒ <code>HTMLElement</code>
            * [.getElementLabel(element)](#Morebits.quickForm.getElementLabel) ⇒ <code>string</code>
            * [.setElementLabel(element, labelText)](#Morebits.quickForm.setElementLabel) ⇒ <code>boolean</code>
            * [.overrideElementLabel(element, temporaryLabelText)](#Morebits.quickForm.overrideElementLabel) ⇒ <code>boolean</code>
            * [.resetElementLabel(element)](#Morebits.quickForm.resetElementLabel) ⇒ <code>boolean</code>
            * [.setElementVisibility(element, [visibility])](#Morebits.quickForm.setElementVisibility)
            * [.setElementTooltipVisibility(element, [visibility])](#Morebits.quickForm.setElementTooltipVisibility)
    * [.unbinder](#Morebits.unbinder)
        * [new Morebits.unbinder(string)](#new_Morebits.unbinder_new)
        * _instance_
            * [.content](#Morebits.unbinder+content)
            * [.unbind(prefix, postfix)](#Morebits.unbinder+unbind)
            * [.rebind()](#Morebits.unbinder+rebind) ⇒ <code>string</code>
        * _static_
            * [.getCallback()](#Morebits.unbinder.getCallback)
    * [.date](#Morebits.date)
        * [new Morebits.date()](#new_Morebits.date_new)
        * _instance_
            * [.isValid()](#Morebits.date+isValid) ⇒ <code>boolean</code>
            * [.isBefore(date)](#Morebits.date+isBefore) ⇒ <code>boolean</code>
            * [.isAfter(date)](#Morebits.date+isAfter) ⇒ <code>boolean</code>
            * [.getUTCMonthName()](#Morebits.date+getUTCMonthName) ⇒ <code>string</code>
            * [.getUTCMonthNameAbbrev()](#Morebits.date+getUTCMonthNameAbbrev) ⇒ <code>string</code>
            * [.getMonthName()](#Morebits.date+getMonthName) ⇒ <code>string</code>
            * [.getMonthNameAbbrev()](#Morebits.date+getMonthNameAbbrev) ⇒ <code>string</code>
            * [.getUTCDayName()](#Morebits.date+getUTCDayName) ⇒ <code>string</code>
            * [.getUTCDayNameAbbrev()](#Morebits.date+getUTCDayNameAbbrev) ⇒ <code>string</code>
            * [.getDayName()](#Morebits.date+getDayName) ⇒ <code>string</code>
            * [.getDayNameAbbrev()](#Morebits.date+getDayNameAbbrev) ⇒ <code>string</code>
            * [.add(number, unit)](#Morebits.date+add) ⇒ [<code>date</code>](#Morebits.date)
            * [.subtract(number, unit)](#Morebits.date+subtract) ⇒ [<code>date</code>](#Morebits.date)
            * [.format(formatstr, [zone])](#Morebits.date+format) ⇒ <code>string</code>
            * [.calendar([zone])](#Morebits.date+calendar) ⇒ <code>string</code>
            * [.monthHeaderRegex()](#Morebits.date+monthHeaderRegex) ⇒ <code>RegExp</code>
            * [.monthHeader([level])](#Morebits.date+monthHeader) ⇒ <code>string</code>
        * _static_
            * [.unitMap](#Morebits.date.unitMap) : <code>object.&lt;string, string&gt;</code>
    * [.userspaceLogger](#Morebits.userspaceLogger)
        * [new Morebits.userspaceLogger(logPageName)](#new_Morebits.userspaceLogger_new)
        * [.initialText](#Morebits.userspaceLogger+initialText) : <code>string</code>
        * [.headerLevel](#Morebits.userspaceLogger+headerLevel) : <code>number</code>
        * [.log(logText, summaryText)](#Morebits.userspaceLogger+log) ⇒ <code>JQuery.Promise</code>
    * [.status](#Morebits.status)
        * [new Morebits.status(text, stat, [type])](#new_Morebits.status_new)
        * _instance_
            * [.link()](#Morebits.status+link)
            * [.unlink()](#Morebits.status+unlink)
            * [.codify(obj)](#Morebits.status+codify) ⇒ <code>DocumentFragment</code>
            * [.update(status, type)](#Morebits.status+update)
            * [.generate()](#Morebits.status+generate)
            * [.render()](#Morebits.status+render)
        * _static_
            * [.init(root)](#Morebits.status.init)
            * [.onError(handler)](#Morebits.status.onError)
            * [.status(text, status)](#Morebits.status.status) ⇒ [<code>status</code>](#Morebits.status)
            * [.info(text, status)](#Morebits.status.info) ⇒ [<code>status</code>](#Morebits.status)
            * [.warn(text, status)](#Morebits.status.warn) ⇒ [<code>status</code>](#Morebits.status)
            * [.error(text, status)](#Morebits.status.error) ⇒ [<code>status</code>](#Morebits.status)
            * [.actionCompleted(text)](#Morebits.status.actionCompleted)
            * [.printUserText(comments, message)](#Morebits.status.printUserText)
    * [.batchOperation](#Morebits.batchOperation)
        * [new Morebits.batchOperation([currentAction])](#new_Morebits.batchOperation_new)
        * [.setPageList(pageList)](#Morebits.batchOperation+setPageList)
        * [.setOption(optionName, optionValue)](#Morebits.batchOperation+setOption)
        * [.run(worker, [postFinish])](#Morebits.batchOperation+run)
        * [.workerSuccess(arg)](#Morebits.batchOperation+workerSuccess)
    * [.taskManager](#Morebits.taskManager)
        * [new Morebits.taskManager()](#new_Morebits.taskManager_new)
        * [.add(func, deps, [onFailure])](#Morebits.taskManager+add)
        * [.execute()](#Morebits.taskManager+execute) ⇒ <code>jQuery.Promise</code>
    * [.simpleWindow](#Morebits.simpleWindow)
        * [new Morebits.simpleWindow(width, height)](#new_Morebits.simpleWindow_new)
        * _instance_
            * [.focus()](#Morebits.simpleWindow+focus) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.close([event])](#Morebits.simpleWindow+close) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.display()](#Morebits.simpleWindow+display) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.setTitle(title)](#Morebits.simpleWindow+setTitle) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.setScriptName(name)](#Morebits.simpleWindow+setScriptName) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.setWidth(width)](#Morebits.simpleWindow+setWidth) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.setHeight(height)](#Morebits.simpleWindow+setHeight) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.setContent(content)](#Morebits.simpleWindow+setContent) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.addContent(content)](#Morebits.simpleWindow+addContent) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.purgeContent()](#Morebits.simpleWindow+purgeContent) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.addFooterLink(text, wikiPage, [prep])](#Morebits.simpleWindow+addFooterLink) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
            * [.setModality([modal])](#Morebits.simpleWindow+setModality) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * _static_
            * [.setButtonsEnabled(enabled)](#Morebits.simpleWindow.setButtonsEnabled)
    * [.userIsSysop](#Morebits.userIsSysop) : <code>boolean</code>
    * [.pageNameNorm](#Morebits.pageNameNorm) : <code>string</code>
    * [.ip](#Morebits.ip) : <code>object</code>
        * [.sanitizeIPv6(address)](#Morebits.ip.sanitizeIPv6) ⇒ <code>string</code>
        * [.isRange(ip)](#Morebits.ip.isRange) ⇒ <code>boolean</code>
        * [.validCIDR()](#Morebits.ip.validCIDR) ⇒ <code>boolean</code>
        * [.get64(ipv6)](#Morebits.ip.get64) ⇒ <code>boolean</code> \| <code>string</code>
    * [.string](#Morebits.string) : <code>object</code>
        * [.toUpperCaseFirstChar(str)](#Morebits.string.toUpperCaseFirstChar) ⇒ <code>string</code>
        * [.toLowerCaseFirstChar(str)](#Morebits.string.toLowerCaseFirstChar) ⇒ <code>string</code>
        * [.splitWeightedByKeys(str, start, end, [skiplist])](#Morebits.string.splitWeightedByKeys) ⇒ <code>Array.&lt;string&gt;</code>
        * [.formatReasonText(str, [addSig])](#Morebits.string.formatReasonText) ⇒ <code>string</code>
        * [.formatReasonForLog(str)](#Morebits.string.formatReasonForLog) ⇒ <code>string</code>
        * [.safeReplace(string, pattern, replacement)](#Morebits.string.safeReplace) ⇒ <code>string</code>
        * [.isInfinity(expiry)](#Morebits.string.isInfinity) ⇒ <code>boolean</code>
        * [.escapeRegExp(text)](#Morebits.string.escapeRegExp) ⇒ <code>string</code>
    * [.array](#Morebits.array) : <code>object</code>
        * [.uniq(arr)](#Morebits.array.uniq) ⇒ <code>Array</code>
        * [.dups(arr)](#Morebits.array.dups) ⇒ <code>Array</code>
        * [.chunk(arr, size)](#Morebits.array.chunk) ⇒ <code>Array.&lt;Array&gt;</code>
    * [.select2](#Morebits.select2) : <code>object</code>
        * [.highlightSearchMatches()](#Morebits.select2.highlightSearchMatches)
        * [.queryInterceptor()](#Morebits.select2.queryInterceptor)
        * [.autoStart()](#Morebits.select2.autoStart)
    * [.wiki](#Morebits.wiki) : <code>object</code>
        * [.api](#Morebits.wiki.api)
            * [new Morebits.wiki.api(currentAction, query, [onSuccess], [statusElement], [onError])](#new_Morebits.wiki.api_new)
            * _instance_
                * [.setParent(parent)](#Morebits.wiki.api+setParent)
                * [.setStatusElement(statusElement)](#Morebits.wiki.api+setStatusElement)
                * [.post(callerAjaxParameters)](#Morebits.wiki.api+post) ⇒ <code>promise</code>
            * _static_
                * [.morebitsWikiChangeTag](#Morebits.wiki.api.morebitsWikiChangeTag) : <code>string</code>
                * [.setApiUserAgent([ua])](#Morebits.wiki.api.setApiUserAgent)
                * [.getToken()](#Morebits.wiki.api.getToken) ⇒ <code>string</code>
        * [.page](#Morebits.wiki.page)
            * [new Morebits.wiki.page(pageName, [status])](#new_Morebits.wiki.page_new)
            * _instance_
                * [.load(onSuccess, [onFailure])](#Morebits.wiki.page+load)
                * [.save([onSuccess], [onFailure])](#Morebits.wiki.page+save)
                * [.append([onSuccess], [onFailure])](#Morebits.wiki.page+append)
                * [.prepend([onSuccess], [onFailure])](#Morebits.wiki.page+prepend)
                * [.newSection([onSuccess], [onFailure])](#Morebits.wiki.page+newSection)
                * [.getPageName()](#Morebits.wiki.page+getPageName) ⇒ <code>string</code>
                * [.getPageText()](#Morebits.wiki.page+getPageText) ⇒ <code>string</code>
                * [.setPageText(pageText)](#Morebits.wiki.page+setPageText)
                * [.setAppendText(appendText)](#Morebits.wiki.page+setAppendText)
                * [.setPrependText(prependText)](#Morebits.wiki.page+setPrependText)
                * [.setNewSectionText(newSectionText)](#Morebits.wiki.page+setNewSectionText)
                * [.setNewSectionTitle(newSectionTitle)](#Morebits.wiki.page+setNewSectionTitle)
                * [.setEditSummary(summary)](#Morebits.wiki.page+setEditSummary)
                * [.setChangeTags(tags)](#Morebits.wiki.page+setChangeTags)
                * [.setCreateOption([createOption])](#Morebits.wiki.page+setCreateOption)
                * [.setMinorEdit(minorEdit)](#Morebits.wiki.page+setMinorEdit)
                * [.setBotEdit(botEdit)](#Morebits.wiki.page+setBotEdit)
                * [.setPageSection(pageSection)](#Morebits.wiki.page+setPageSection)
                * [.setMaxConflictRetries(maxConflictRetries)](#Morebits.wiki.page+setMaxConflictRetries)
                * [.setMaxRetries(maxRetries)](#Morebits.wiki.page+setMaxRetries)
                * [.setWatchlist([watchlistOption], [watchlistExpiry])](#Morebits.wiki.page+setWatchlist)
                * [.setWatchlistExpiry([watchlistExpiry])](#Morebits.wiki.page+setWatchlistExpiry)
                * <del>[.setWatchlistFromPreferences([watchlistOption])](#Morebits.wiki.page+setWatchlistFromPreferences)</del>
                * [.setFollowRedirect([followRedirect], [followCrossNsRedirect])](#Morebits.wiki.page+setFollowRedirect)
                * [.setLookupNonRedirectCreator(flag)](#Morebits.wiki.page+setLookupNonRedirectCreator)
                * [.setMoveDestination(destination)](#Morebits.wiki.page+setMoveDestination)
                * [.setMoveTalkPage(flag)](#Morebits.wiki.page+setMoveTalkPage)
                * [.setMoveSubpages(flag)](#Morebits.wiki.page+setMoveSubpages)
                * [.setMoveSuppressRedirect(flag)](#Morebits.wiki.page+setMoveSuppressRedirect)
                * [.setEditProtection(level, [expiry])](#Morebits.wiki.page+setEditProtection)
                * [.getCurrentID()](#Morebits.wiki.page+getCurrentID) ⇒ <code>string</code>
                * [.getRevisionUser()](#Morebits.wiki.page+getRevisionUser) ⇒ <code>string</code>
                * [.getLastEditTime()](#Morebits.wiki.page+getLastEditTime) ⇒ <code>string</code>
                * [.setCallbackParameters(callbackParameters)](#Morebits.wiki.page+setCallbackParameters)
                * [.getCallbackParameters()](#Morebits.wiki.page+getCallbackParameters) ⇒ <code>object</code>
                * [.setStatusElement(statusElement)](#Morebits.wiki.page+setStatusElement)
                * [.getStatusElement()](#Morebits.wiki.page+getStatusElement) ⇒ [<code>status</code>](#Morebits.status)
                * [.setFlaggedRevs(level, [expiry])](#Morebits.wiki.page+setFlaggedRevs)
                * [.exists()](#Morebits.wiki.page+exists) ⇒ <code>boolean</code>
                * [.getPageID()](#Morebits.wiki.page+getPageID) ⇒ <code>string</code>
                * [.getContentModel()](#Morebits.wiki.page+getContentModel) ⇒ <code>string</code>
                * [.getWatched()](#Morebits.wiki.page+getWatched) ⇒ <code>boolean</code> \| <code>string</code>
                * [.getLoadTime()](#Morebits.wiki.page+getLoadTime) ⇒ <code>string</code>
                * [.getCreator()](#Morebits.wiki.page+getCreator) ⇒ <code>string</code>
                * [.getCreationTimestamp()](#Morebits.wiki.page+getCreationTimestamp) ⇒ <code>string</code>
                * [.canEdit()](#Morebits.wiki.page+canEdit) ⇒ <code>boolean</code>
                * [.lookupCreation(onSuccess, [onFailure])](#Morebits.wiki.page+lookupCreation)
                * [.revert([onSuccess], [onFailure])](#Morebits.wiki.page+revert)
                * [.move([onSuccess], [onFailure])](#Morebits.wiki.page+move)
                * [.patrol()](#Morebits.wiki.page+patrol)
                * [.triage()](#Morebits.wiki.page+triage)
                * [.deletePage([onSuccess], [onFailure])](#Morebits.wiki.page+deletePage)
                * [.undeletePage([onSuccess], [onFailure])](#Morebits.wiki.page+undeletePage)
                * [.protect([onSuccess], [onFailure])](#Morebits.wiki.page+protect)
                * [.stabilize([onSuccess], [onFailure])](#Morebits.wiki.page+stabilize)
            * _inner_
                * [~fnCanUseMwUserToken([action])](#Morebits.wiki.page..fnCanUseMwUserToken) ⇒ <code>boolean</code>
                * [~fnNeedTokenInfoQuery(action)](#Morebits.wiki.page..fnNeedTokenInfoQuery) ⇒ <code>object</code>
                * [~fnApplyWatchlistExpiry()](#Morebits.wiki.page..fnApplyWatchlistExpiry) ⇒ <code>boolean</code>
                * [~fnPreflightChecks(action, onFailure)](#Morebits.wiki.page..fnPreflightChecks) ⇒ <code>boolean</code>
                * [~fnProcessChecks(action, onFailure, response)](#Morebits.wiki.page..fnProcessChecks) ⇒ <code>boolean</code>
        * [.preview](#Morebits.wiki.preview)
            * [new Morebits.wiki.preview(previewbox)](#new_Morebits.wiki.preview_new)
            * [.beginRender(wikitext, [pageTitle], [sectionTitle])](#Morebits.wiki.preview+beginRender) ⇒ <code>jQuery.promise</code>
            * [.closePreview()](#Morebits.wiki.preview+closePreview)
        * [.numberOfActionsLeft](#Morebits.wiki.numberOfActionsLeft) : <code>number</code>
        * [.nbrOfCheckpointsLeft](#Morebits.wiki.nbrOfCheckpointsLeft) : <code>number</code>
        * <del>[.isPageRedirect()](#Morebits.wiki.isPageRedirect) ⇒ <code>boolean</code></del>
        * [.actionCompleted()](#Morebits.wiki.actionCompleted)
            * [.timeOut](#Morebits.wiki.actionCompleted.timeOut)
            * [.redirect](#Morebits.wiki.actionCompleted.redirect)
            * [.notice](#Morebits.wiki.actionCompleted.notice)
            * [.event()](#Morebits.wiki.actionCompleted.event)
        * [.addCheckpoint()](#Morebits.wiki.addCheckpoint)
        * [.removeCheckpoint()](#Morebits.wiki.removeCheckpoint)
    * [.wikitext](#Morebits.wikitext) : <code>object</code>
        * [.page](#Morebits.wikitext.page)
            * [new Morebits.wikitext.page(text)](#new_Morebits.wikitext.page_new)
            * [.removeLink(link_target)](#Morebits.wikitext.page+removeLink) ⇒ [<code>page</code>](#Morebits.wikitext.page)
            * [.commentOutImage(image, [reason])](#Morebits.wikitext.page+commentOutImage) ⇒ [<code>page</code>](#Morebits.wikitext.page)
            * [.addToImageComment(image, data)](#Morebits.wikitext.page+addToImageComment) ⇒ [<code>page</code>](#Morebits.wikitext.page)
            * [.removeTemplate(template)](#Morebits.wikitext.page+removeTemplate) ⇒ [<code>page</code>](#Morebits.wikitext.page)
            * [.insertAfterTemplates(tag, regex, [flags], [preRegex])](#Morebits.wikitext.page+insertAfterTemplates) ⇒ [<code>page</code>](#Morebits.wikitext.page)
            * [.getText()](#Morebits.wikitext.page+getText) ⇒ <code>string</code>
        * [.parseTemplate(text, [start])](#Morebits.wikitext.parseTemplate) ⇒ <code>object</code>
            * [~findParam([final])](#Morebits.wikitext.parseTemplate..findParam)
    * [.userIsInGroup(group)](#Morebits.userIsInGroup) ⇒ <code>boolean</code>
    * <del>[.sanitizeIPv6(address)](#Morebits.sanitizeIPv6) ⇒ <code>string</code></del>
    * [.isPageRedirect()](#Morebits.isPageRedirect) ⇒ <code>boolean</code>
    * [.pageNameRegex(pageName)](#Morebits.pageNameRegex) ⇒ <code>string</code>
    * [.namespaceRegex(namespaces)](#Morebits.namespaceRegex) ⇒ <code>string</code>
    * [.htmlNode(type, content, [color])](#Morebits.htmlNode) ⇒ <code>HTMLElement</code>
    * [.checkboxShiftClickSupport(jQuerySelector, jQueryContext)](#Morebits.checkboxShiftClickSupport)

<a name="Morebits.quickForm"></a>

### Morebits.quickForm
**Kind**: static class of [<code>Morebits</code>](#Morebits)  

* [.quickForm](#Morebits.quickForm)
    * [new quickForm(event, [eventType])](#new_Morebits.quickForm_new)
    * _instance_
        * [.render()](#Morebits.quickForm+render) ⇒ <code>HTMLElement</code>
        * [.append(data)](#Morebits.quickForm+append) ⇒ [<code>element</code>](#Morebits.quickForm.element)
    * _static_
        * [.element](#Morebits.quickForm.element)
            * [new Morebits.quickForm.element(data)](#new_Morebits.quickForm.element_new)
            * _instance_
                * [.append(data)](#Morebits.quickForm.element+append) ⇒ [<code>element</code>](#Morebits.quickForm.element)
                * [.render()](#Morebits.quickForm.element+render) ⇒ <code>HTMLElement</code>
                * [.compute()](#Morebits.quickForm.element+compute)
            * _static_
                * [.id](#Morebits.quickForm.element.id) : <code>number</code>
                * [.generateTooltip(node, data)](#Morebits.quickForm.element.generateTooltip)
        * [.getInputData(form)](#Morebits.quickForm.getInputData) ⇒ <code>object</code>
        * [.getElements(form, fieldName)](#Morebits.quickForm.getElements) ⇒ <code>Array.&lt;HTMLElement&gt;</code>
        * [.getCheckboxOrRadio(elementArray, value)](#Morebits.quickForm.getCheckboxOrRadio) ⇒ <code>HTMLInputElement</code>
        * [.getElementContainer(element)](#Morebits.quickForm.getElementContainer) ⇒ <code>HTMLElement</code>
        * [.getElementLabelObject(element)](#Morebits.quickForm.getElementLabelObject) ⇒ <code>HTMLElement</code>
        * [.getElementLabel(element)](#Morebits.quickForm.getElementLabel) ⇒ <code>string</code>
        * [.setElementLabel(element, labelText)](#Morebits.quickForm.setElementLabel) ⇒ <code>boolean</code>
        * [.overrideElementLabel(element, temporaryLabelText)](#Morebits.quickForm.overrideElementLabel) ⇒ <code>boolean</code>
        * [.resetElementLabel(element)](#Morebits.quickForm.resetElementLabel) ⇒ <code>boolean</code>
        * [.setElementVisibility(element, [visibility])](#Morebits.quickForm.setElementVisibility)
        * [.setElementTooltipVisibility(element, [visibility])](#Morebits.quickForm.setElementTooltipVisibility)

<a name="new_Morebits.quickForm_new"></a>

#### new quickForm(event, [eventType])
Creation of simple and standard forms without much specific coding.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>event</td><td><code>event</code></td><td></td><td><p>Function to execute when form is submitted.</p>
</td>
    </tr><tr>
    <td>[eventType]</td><td><code>string</code></td><td><code>&quot;submit&quot;</code></td><td><p>Type of the event.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm+render"></a>

#### quickForm.render() ⇒ <code>HTMLElement</code>
Renders the HTML output of the quickForm.

**Kind**: instance method of [<code>quickForm</code>](#Morebits.quickForm)  
<a name="Morebits.quickForm+append"></a>

#### quickForm.append(data) ⇒ [<code>element</code>](#Morebits.quickForm.element)
Append element to the form.

**Kind**: instance method of [<code>quickForm</code>](#Morebits.quickForm)  
**Returns**: [<code>element</code>](#Morebits.quickForm.element) - - Same as what is passed to the function.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>data</td><td><code>object</code> | <code><a href="#Morebits.quickForm.element">element</a></code></td><td><p>A quickform element, or the object with which
a quickform element is constructed.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.element"></a>

#### quickForm.element
**Kind**: static class of [<code>quickForm</code>](#Morebits.quickForm)  

* [.element](#Morebits.quickForm.element)
    * [new Morebits.quickForm.element(data)](#new_Morebits.quickForm.element_new)
    * _instance_
        * [.append(data)](#Morebits.quickForm.element+append) ⇒ [<code>element</code>](#Morebits.quickForm.element)
        * [.render()](#Morebits.quickForm.element+render) ⇒ <code>HTMLElement</code>
        * [.compute()](#Morebits.quickForm.element+compute)
    * _static_
        * [.id](#Morebits.quickForm.element.id) : <code>number</code>
        * [.generateTooltip(node, data)](#Morebits.quickForm.element.generateTooltip)

<a name="new_Morebits.quickForm.element_new"></a>

##### new Morebits.quickForm.element(data)
Create a new element for the the form.

Index to Morebits.quickForm.element types:
- Global attributes: id, className, style, tooltip, extra, adminonly
- `select`: A combo box (aka drop-down).
    - Attributes: name, label, multiple, size, list, event, disabled
 - `option`: An element for a combo box.
     - Attributes: value, label, selected, disabled
 - `optgroup`: A group of "option"s.
     - Attributes: label, list
 - `field`: A fieldset (aka group box).
     - Attributes: name, label, disabled
 - `checkbox`: A checkbox. Must use "list" parameter.
     - Attributes: name, list, event
     - Attributes (within list): name, label, value, checked, disabled, event, subgroup
 - `radio`: A radio button. Must use "list" parameter.
     - Attributes: name, list, event
     - Attributes (within list): name, label, value, checked, disabled, event, subgroup
 - `input`: A text input box.
     - Attributes: name, label, value, size, placeholder, maxlength, disabled, required, readonly, event
 - `number`: A number input box.
     - Attributes: Everything the text `input` has, as well as: min, max, step, list
 - `dyninput`: A set of text boxes with "Remove" buttons and an "Add" button.
     - Attributes: name, label, min, max, sublabel, value, size, maxlength, event
 - `hidden`: An invisible form field.
     - Attributes: name, value
 - `header`: A level 5 header.
     - Attributes: label
 - `div`: A generic placeholder element or label.
     - Attributes: name, label
 - `submit`: A submit button. Morebits.simpleWindow moves these to the footer of the dialog.
     - Attributes: name, label, disabled
 - `button`: A generic button.
     - Attributes: name, label, disabled, event
 - `textarea`: A big, multi-line text box.
     - Attributes: name, label, value, cols, rows, disabled, required, readonly
 - `fragment`: A DocumentFragment object.
     - No attributes, and no global attributes except adminonly.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>data</td><td><code>object</code></td><td><p>Object representing the quickform element. Should
specify one of the available types from the index above, as well as any
relevant and available attributes.</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
new Morebits.quickForm.element({
    name: 'target',
    type: 'input',
    label: 'Your target:',
    tooltip: 'Enter your target. Required.',
    required: true
});
```
<a name="Morebits.quickForm.element+append"></a>

##### element.append(data) ⇒ [<code>element</code>](#Morebits.quickForm.element)
Appends an element to current element.

**Kind**: instance method of [<code>element</code>](#Morebits.quickForm.element)  
**Returns**: [<code>element</code>](#Morebits.quickForm.element) - The same element passed in.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>data</td><td><code><a href="#Morebits.quickForm.element">element</a></code></td><td><p>A quickForm element or the object required to
create the quickForm element.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.element+render"></a>

##### element.render() ⇒ <code>HTMLElement</code>
Renders the HTML output for the quickForm element.  This should be called
without parameters: `form.render()`.

**Kind**: instance method of [<code>element</code>](#Morebits.quickForm.element)  
<a name="Morebits.quickForm.element+compute"></a>

##### element.compute()
**Kind**: instance method of [<code>element</code>](#Morebits.quickForm.element)  
<a name="Morebits.quickForm.element.id"></a>

##### element.id : <code>number</code>
**Kind**: static property of [<code>element</code>](#Morebits.quickForm.element)  
<a name="Morebits.quickForm.element.generateTooltip"></a>

##### element.generateTooltip(node, data)
Create a jQuery UI-based tooltip.

**Kind**: static method of [<code>element</code>](#Morebits.quickForm.element)  
**Requires**: <code>module:jquery.ui</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>node</td><td><code>HTMLElement</code></td><td><p>The HTML element beside which a tooltip is to be generated.</p>
</td>
    </tr><tr>
    <td>data</td><td><code>object</code></td><td><p>Tooltip-related configuration data.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.getInputData"></a>

#### quickForm.getInputData(form) ⇒ <code>object</code>
Returns an object containing all filled form data entered by the user, with the object
keys being the form element names. Disabled fields will be ignored, but not hidden fields.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
**Returns**: <code>object</code> - With field names as keys, input data as values.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>form</td><td><code>HTMLFormElement</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.getElements"></a>

#### quickForm.getElements(form, fieldName) ⇒ <code>Array.&lt;HTMLElement&gt;</code>
Returns all form elements with a given field name or ID.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
**Returns**: <code>Array.&lt;HTMLElement&gt;</code> - - Array of matching form elements.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>form</td><td><code>HTMLFormElement</code></td><td></td>
    </tr><tr>
    <td>fieldName</td><td><code>string</code></td><td><p>The name or id of the fields.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.getCheckboxOrRadio"></a>

#### quickForm.getCheckboxOrRadio(elementArray, value) ⇒ <code>HTMLInputElement</code>
Searches the array of elements for a checkbox or radio button with a certain
`value` attribute, and returns the first such element. Returns null if not found.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>elementArray</td><td><code>Array.&lt;HTMLInputElement&gt;</code></td><td><p>Array of checkbox or radio elements.</p>
</td>
    </tr><tr>
    <td>value</td><td><code>string</code></td><td><p>Value to search for.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.getElementContainer"></a>

#### quickForm.getElementContainer(element) ⇒ <code>HTMLElement</code>
Returns the &lt;div> containing the form element, or the form element itself
May not work as expected on checkboxes or radios.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.getElementLabelObject"></a>

#### quickForm.getElementLabelObject(element) ⇒ <code>HTMLElement</code>
Gets the HTML element that contains the label of the given form element
(mainly for internal use).

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code> | <code><a href="#Morebits.quickForm.element">element</a></code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.getElementLabel"></a>

#### quickForm.getElementLabel(element) ⇒ <code>string</code>
Gets the label text of the element.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code> | <code><a href="#Morebits.quickForm.element">element</a></code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.setElementLabel"></a>

#### quickForm.setElementLabel(element, labelText) ⇒ <code>boolean</code>
Sets the label of the element to the given text.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
**Returns**: <code>boolean</code> - True if succeeded, false if the label element is unavailable.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code> | <code><a href="#Morebits.quickForm.element">element</a></code></td>
    </tr><tr>
    <td>labelText</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.overrideElementLabel"></a>

#### quickForm.overrideElementLabel(element, temporaryLabelText) ⇒ <code>boolean</code>
Stores the element's current label, and temporarily sets the label to the given text.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
**Returns**: <code>boolean</code> - `true` if succeeded, `false` if the label element is unavailable.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code> | <code><a href="#Morebits.quickForm.element">element</a></code></td>
    </tr><tr>
    <td>temporaryLabelText</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.resetElementLabel"></a>

#### quickForm.resetElementLabel(element) ⇒ <code>boolean</code>
Restores the label stored by overrideElementLabel.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
**Returns**: <code>boolean</code> - True if succeeded, false if the label element is unavailable.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code> | <code><a href="#Morebits.quickForm.element">element</a></code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.setElementVisibility"></a>

#### quickForm.setElementVisibility(element, [visibility])
Shows or hides a form element plus its label and tooltip.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code> | <code>jQuery</code> | <code>string</code></td><td><p>HTML/jQuery element, or jQuery selector string.</p>
</td>
    </tr><tr>
    <td>[visibility]</td><td><code>boolean</code></td><td><p>Skip this to toggle visibility.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.quickForm.setElementTooltipVisibility"></a>

#### quickForm.setElementTooltipVisibility(element, [visibility])
Shows or hides the question mark icon (which displays the tooltip) next to a form element.

**Kind**: static method of [<code>quickForm</code>](#Morebits.quickForm)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>element</td><td><code>HTMLElement</code> | <code>jQuery</code></td><td></td>
    </tr><tr>
    <td>[visibility]</td><td><code>boolean</code></td><td><p>Skip this to toggle visibility.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.unbinder"></a>

### Morebits.unbinder
**Kind**: static class of [<code>Morebits</code>](#Morebits)  

* [.unbinder](#Morebits.unbinder)
    * [new Morebits.unbinder(string)](#new_Morebits.unbinder_new)
    * _instance_
        * [.content](#Morebits.unbinder+content)
        * [.unbind(prefix, postfix)](#Morebits.unbinder+unbind)
        * [.rebind()](#Morebits.unbinder+rebind) ⇒ <code>string</code>
    * _static_
        * [.getCallback()](#Morebits.unbinder.getCallback)

<a name="new_Morebits.unbinder_new"></a>

#### new Morebits.unbinder(string)
Temporarily hide a part of a string while processing the rest of it.
Used by [Morebits.wikitext.page.commentOutImage](#Morebits.wikitext.page+commentOutImage).

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>string</td><td><code>string</code></td><td><p>The initial text to process.</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
var u = new Morebits.unbinder('Hello world <!-- world --> world');
u.unbind('<!--', '-->'); // text inside comment remains intact
u.content = u.content.replace(/world/g, 'earth');
u.rebind(); // gives 'Hello earth <!-- world --> earth'
```
<a name="Morebits.unbinder+content"></a>

#### unbinder.content
The text being processed.

**Kind**: instance property of [<code>unbinder</code>](#Morebits.unbinder)  
<a name="Morebits.unbinder+unbind"></a>

#### unbinder.unbind(prefix, postfix)
Hide the region encapsulated by the `prefix` and `postfix` from
string processing.  `prefix` and `postfix` will be used in a
RegExp, so items that need escaping should be use `\\`.

**Kind**: instance method of [<code>unbinder</code>](#Morebits.unbinder)  
**Throws**:

- If either `prefix` or `postfix` is missing.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>prefix</td><td><code>string</code></td>
    </tr><tr>
    <td>postfix</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.unbinder+rebind"></a>

#### unbinder.rebind() ⇒ <code>string</code>
Restore the hidden portion of the `content` string.

**Kind**: instance method of [<code>unbinder</code>](#Morebits.unbinder)  
**Returns**: <code>string</code> - The processed output.  
<a name="Morebits.unbinder.getCallback"></a>

#### unbinder.getCallback()
**Kind**: static method of [<code>unbinder</code>](#Morebits.unbinder)  
<a name="Morebits.date"></a>

### Morebits.date
**Kind**: static class of [<code>Morebits</code>](#Morebits)  

* [.date](#Morebits.date)
    * [new Morebits.date()](#new_Morebits.date_new)
    * _instance_
        * [.isValid()](#Morebits.date+isValid) ⇒ <code>boolean</code>
        * [.isBefore(date)](#Morebits.date+isBefore) ⇒ <code>boolean</code>
        * [.isAfter(date)](#Morebits.date+isAfter) ⇒ <code>boolean</code>
        * [.getUTCMonthName()](#Morebits.date+getUTCMonthName) ⇒ <code>string</code>
        * [.getUTCMonthNameAbbrev()](#Morebits.date+getUTCMonthNameAbbrev) ⇒ <code>string</code>
        * [.getMonthName()](#Morebits.date+getMonthName) ⇒ <code>string</code>
        * [.getMonthNameAbbrev()](#Morebits.date+getMonthNameAbbrev) ⇒ <code>string</code>
        * [.getUTCDayName()](#Morebits.date+getUTCDayName) ⇒ <code>string</code>
        * [.getUTCDayNameAbbrev()](#Morebits.date+getUTCDayNameAbbrev) ⇒ <code>string</code>
        * [.getDayName()](#Morebits.date+getDayName) ⇒ <code>string</code>
        * [.getDayNameAbbrev()](#Morebits.date+getDayNameAbbrev) ⇒ <code>string</code>
        * [.add(number, unit)](#Morebits.date+add) ⇒ [<code>date</code>](#Morebits.date)
        * [.subtract(number, unit)](#Morebits.date+subtract) ⇒ [<code>date</code>](#Morebits.date)
        * [.format(formatstr, [zone])](#Morebits.date+format) ⇒ <code>string</code>
        * [.calendar([zone])](#Morebits.date+calendar) ⇒ <code>string</code>
        * [.monthHeaderRegex()](#Morebits.date+monthHeaderRegex) ⇒ <code>RegExp</code>
        * [.monthHeader([level])](#Morebits.date+monthHeader) ⇒ <code>string</code>
    * _static_
        * [.unitMap](#Morebits.date.unitMap) : <code>object.&lt;string, string&gt;</code>

<a name="new_Morebits.date_new"></a>

#### new Morebits.date()
Create a date object with enhanced processing capabilities, a la
[moment.js](https://momentjs.com/). MediaWiki timestamp format is also
acceptable, in addition to everything that JS Date() accepts.

<a name="Morebits.date+isValid"></a>

#### date.isValid() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+isBefore"></a>

#### date.isBefore(date) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>date</td><td><code>Date</code> | <code><a href="#Morebits.date">date</a></code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.date+isAfter"></a>

#### date.isAfter(date) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>date</td><td><code>Date</code> | <code><a href="#Morebits.date">date</a></code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.date+getUTCMonthName"></a>

#### date.getUTCMonthName() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+getUTCMonthNameAbbrev"></a>

#### date.getUTCMonthNameAbbrev() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+getMonthName"></a>

#### date.getMonthName() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+getMonthNameAbbrev"></a>

#### date.getMonthNameAbbrev() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+getUTCDayName"></a>

#### date.getUTCDayName() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+getUTCDayNameAbbrev"></a>

#### date.getUTCDayNameAbbrev() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+getDayName"></a>

#### date.getDayName() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+getDayNameAbbrev"></a>

#### date.getDayNameAbbrev() ⇒ <code>string</code>
**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+add"></a>

#### date.add(number, unit) ⇒ [<code>date</code>](#Morebits.date)
Add a given number of minutes, hours, days, weeks, months, or years to the date.
This is done in-place. The modified date object is also returned, allowing chaining.

**Kind**: instance method of [<code>date</code>](#Morebits.date)  
**Throws**:

- If invalid or unsupported unit is given.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>number</td><td><code>number</code></td><td><p>Should be an integer.</p>
</td>
    </tr><tr>
    <td>unit</td><td><code>string</code></td><td></td>
    </tr>  </tbody>
</table>

<a name="Morebits.date+subtract"></a>

#### date.subtract(number, unit) ⇒ [<code>date</code>](#Morebits.date)
Subtracts a given number of minutes, hours, days, weeks, months, or years to the date.
This is done in-place. The modified date object is also returned, allowing chaining.

**Kind**: instance method of [<code>date</code>](#Morebits.date)  
**Throws**:

- If invalid or unsupported unit is given.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>number</td><td><code>number</code></td><td><p>Should be an integer.</p>
</td>
    </tr><tr>
    <td>unit</td><td><code>string</code></td><td></td>
    </tr>  </tbody>
</table>

<a name="Morebits.date+format"></a>

#### date.format(formatstr, [zone]) ⇒ <code>string</code>
Format the date into a string per the given format string.
Replacement syntax is a subset of that in moment.js:

| Syntax | Output |
|--------|--------|
| H | Hours (24-hour) |
| HH | Hours (24-hour, padded) |
| h | Hours (12-hour) |
| hh | Hours (12-hour, padded) |
| A | AM or PM |
| m | Minutes |
| mm | Minutes (padded) |
| s | Seconds |
| ss | Seconds (padded) |
| SSS | Milliseconds fragment, padded |
| d | Day number of the week (Sun=0) |
| ddd | Abbreviated day name |
| dddd | Full day name |
| D | Date |
| DD | Date (padded) |
| M | Month number (0-indexed) |
| MM | Month number (0-indexed, padded) |
| MMM | Abbreviated month name |
| MMMM | Full month name |
| Y | Year |
| YY | Final two digits of year (20 for 2020, 42 for 1942) |
| YYYY | Year (same as `Y`) |

**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>formatstr</td><td><code>string</code></td><td></td><td><p>Format the date into a string, using
the replacement syntax.  Use <code>[</code> and <code>]</code> to escape items.  If not
provided, will return the ISO-8601-formatted string.</p>
</td>
    </tr><tr>
    <td>[zone]</td><td><code>string</code> | <code>number</code></td><td><code>&quot;system&quot;</code></td><td><p><code>system</code> (for browser-default time zone),
<code>utc</code>, or specify a time zone as number of minutes relative to UTC.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.date+calendar"></a>

#### date.calendar([zone]) ⇒ <code>string</code>
Gives a readable relative time string such as "Yesterday at 6:43 PM" or "Last Thursday at 11:45 AM".
Similar to `calendar` in moment.js, but with time zone support.

**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[zone]</td><td><code>string</code> | <code>number</code></td><td><code>&quot;system&quot;</code></td><td><p>&#39;system&#39; (for browser-default time zone),
&#39;utc&#39; (for UTC), or specify a time zone as number of minutes past UTC.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.date+monthHeaderRegex"></a>

#### date.monthHeaderRegex() ⇒ <code>RegExp</code>
Get a regular expression that matches wikitext section titles, such
as `==December 2019==` or `=== Jan 2018 ===`.

**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<a name="Morebits.date+monthHeader"></a>

#### date.monthHeader([level]) ⇒ <code>string</code>
Creates a wikitext section header with the month and year.

**Kind**: instance method of [<code>date</code>](#Morebits.date)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[level]</td><td><code>number</code></td><td><code>2</code></td><td><p>Header level.  Pass 0 for just the text
with no wikitext markers (==).</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.date.unitMap"></a>

#### date.unitMap : <code>object.&lt;string, string&gt;</code>
Map units with getter/setter function names, for `add` and `subtract`
methods.

**Kind**: static property of [<code>date</code>](#Morebits.date)  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>seconds</td><td><code>string</code></td>
    </tr><tr>
    <td>minutes</td><td><code>string</code></td>
    </tr><tr>
    <td>hours</td><td><code>string</code></td>
    </tr><tr>
    <td>days</td><td><code>string</code></td>
    </tr><tr>
    <td>weeks</td><td><code>string</code></td>
    </tr><tr>
    <td>months</td><td><code>string</code></td>
    </tr><tr>
    <td>years</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.userspaceLogger"></a>

### Morebits.userspaceLogger
**Kind**: static class of [<code>Morebits</code>](#Morebits)  

* [.userspaceLogger](#Morebits.userspaceLogger)
    * [new Morebits.userspaceLogger(logPageName)](#new_Morebits.userspaceLogger_new)
    * [.initialText](#Morebits.userspaceLogger+initialText) : <code>string</code>
    * [.headerLevel](#Morebits.userspaceLogger+headerLevel) : <code>number</code>
    * [.log(logText, summaryText)](#Morebits.userspaceLogger+log) ⇒ <code>JQuery.Promise</code>

<a name="new_Morebits.userspaceLogger_new"></a>

#### new Morebits.userspaceLogger(logPageName)
Handles logging actions to a userspace log.
Used in CSD, PROD, and XFD.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>logPageName</td><td><code>string</code></td><td><p>Title of the subpage of the current user&#39;s log.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.userspaceLogger+initialText"></a>

#### userspaceLogger.initialText : <code>string</code>
The text to prefix the log with upon creation, defaults to empty.

**Kind**: instance property of [<code>userspaceLogger</code>](#Morebits.userspaceLogger)  
<a name="Morebits.userspaceLogger+headerLevel"></a>

#### userspaceLogger.headerLevel : <code>number</code>
The header level to use for months, defaults to 3 (`===`).

**Kind**: instance property of [<code>userspaceLogger</code>](#Morebits.userspaceLogger)  
<a name="Morebits.userspaceLogger+log"></a>

#### userspaceLogger.log(logText, summaryText) ⇒ <code>JQuery.Promise</code>
Log the entry.

**Kind**: instance method of [<code>userspaceLogger</code>](#Morebits.userspaceLogger)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>logText</td><td><code>string</code></td><td><p>Doesn&#39;t include leading <code>#</code> or <code>*</code>.</p>
</td>
    </tr><tr>
    <td>summaryText</td><td><code>string</code></td><td><p>Edit summary.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status"></a>

### Morebits.status
**Kind**: static class of [<code>Morebits</code>](#Morebits)  

* [.status](#Morebits.status)
    * [new Morebits.status(text, stat, [type])](#new_Morebits.status_new)
    * _instance_
        * [.link()](#Morebits.status+link)
        * [.unlink()](#Morebits.status+unlink)
        * [.codify(obj)](#Morebits.status+codify) ⇒ <code>DocumentFragment</code>
        * [.update(status, type)](#Morebits.status+update)
        * [.generate()](#Morebits.status+generate)
        * [.render()](#Morebits.status+render)
    * _static_
        * [.init(root)](#Morebits.status.init)
        * [.onError(handler)](#Morebits.status.onError)
        * [.status(text, status)](#Morebits.status.status) ⇒ [<code>status</code>](#Morebits.status)
        * [.info(text, status)](#Morebits.status.info) ⇒ [<code>status</code>](#Morebits.status)
        * [.warn(text, status)](#Morebits.status.warn) ⇒ [<code>status</code>](#Morebits.status)
        * [.error(text, status)](#Morebits.status.error) ⇒ [<code>status</code>](#Morebits.status)
        * [.actionCompleted(text)](#Morebits.status.actionCompleted)
        * [.printUserText(comments, message)](#Morebits.status.printUserText)

<a name="new_Morebits.status_new"></a>

#### new Morebits.status(text, stat, [type])
Create and show status messages of varying urgency.
[Morebits.status.init()](#Morebits.status.init) must be called before
any status object is created, otherwise those statuses won't be visible.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td></td><td><p>Text before the the colon <code>:</code>.</p>
</td>
    </tr><tr>
    <td>stat</td><td><code>string</code></td><td></td><td><p>Text after the colon <code>:</code>.</p>
</td>
    </tr><tr>
    <td>[type]</td><td><code>string</code></td><td><code>&quot;status&quot;</code></td><td><p>Determine the font color of the status
line, allowable values are: <code>status</code> (blue), <code>info</code> (green), <code>warn</code> (red),
or <code>error</code> (bold red).</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status+link"></a>

#### status.link()
Add the status element node to the DOM.

**Kind**: instance method of [<code>status</code>](#Morebits.status)  
<a name="Morebits.status+unlink"></a>

#### status.unlink()
Remove the status element node from the DOM.

**Kind**: instance method of [<code>status</code>](#Morebits.status)  
<a name="Morebits.status+codify"></a>

#### status.codify(obj) ⇒ <code>DocumentFragment</code>
Create a document fragment with the status text, parsing as HTML.
Runs upon construction for text (part before colon) and upon
render/update for status (part after colon).

**Kind**: instance method of [<code>status</code>](#Morebits.status)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>obj</td><td><code>string</code> | <code>Element</code> | <code>Array</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.status+update"></a>

#### status.update(status, type)
Update the status.

**Kind**: instance method of [<code>status</code>](#Morebits.status)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>status</td><td><code>string</code></td><td><p>Part of status message after colon.</p>
</td>
    </tr><tr>
    <td>type</td><td><code>string</code></td><td><p>&#39;status&#39; (blue), &#39;info&#39; (green), &#39;warn&#39;
(red), or &#39;error&#39; (bold red).</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status+generate"></a>

#### status.generate()
Produce the html for first part of the status message.

**Kind**: instance method of [<code>status</code>](#Morebits.status)  
<a name="Morebits.status+render"></a>

#### status.render()
Complete the html, for the second part of the status message.

**Kind**: instance method of [<code>status</code>](#Morebits.status)  
<a name="Morebits.status.init"></a>

#### status.init(root)
Specify an area for status message elements to be added to.

**Kind**: static method of [<code>status</code>](#Morebits.status)  
**Throws**:

- If `root` is not an `HTMLElement`.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>root</td><td><code>HTMLElement</code></td><td><p>Usually a div element.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status.onError"></a>

#### status.onError(handler)
**Kind**: static method of [<code>status</code>](#Morebits.status)  
**Throws**:

- When `handler` is not a function.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>handler</td><td><code>function</code></td><td><p>Function to execute on error.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status.status"></a>

#### status.status(text, status) ⇒ [<code>status</code>](#Morebits.status)
**Kind**: static method of [<code>status</code>](#Morebits.status)  
**Returns**: [<code>status</code>](#Morebits.status) - - `status`-type (blue)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td><p>Before colon</p>
</td>
    </tr><tr>
    <td>status</td><td><code>string</code></td><td><p>After colon</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status.info"></a>

#### status.info(text, status) ⇒ [<code>status</code>](#Morebits.status)
**Kind**: static method of [<code>status</code>](#Morebits.status)  
**Returns**: [<code>status</code>](#Morebits.status) - - `info`-type (green)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td><p>Before colon</p>
</td>
    </tr><tr>
    <td>status</td><td><code>string</code></td><td><p>After colon</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status.warn"></a>

#### status.warn(text, status) ⇒ [<code>status</code>](#Morebits.status)
**Kind**: static method of [<code>status</code>](#Morebits.status)  
**Returns**: [<code>status</code>](#Morebits.status) - - `warn`-type (red)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td><p>Before colon</p>
</td>
    </tr><tr>
    <td>status</td><td><code>string</code></td><td><p>After colon</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status.error"></a>

#### status.error(text, status) ⇒ [<code>status</code>](#Morebits.status)
**Kind**: static method of [<code>status</code>](#Morebits.status)  
**Returns**: [<code>status</code>](#Morebits.status) - - `error`-type (bold red)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td><p>Before colon</p>
</td>
    </tr><tr>
    <td>status</td><td><code>string</code></td><td><p>After colon</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.status.actionCompleted"></a>

#### status.actionCompleted(text)
For the action complete message at the end, create a status line without
a colon separator.

**Kind**: static method of [<code>status</code>](#Morebits.status)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.status.printUserText"></a>

#### status.printUserText(comments, message)
Display the user's rationale, comments, etc. Back to them after a failure,
so that they may re-use it.

**Kind**: static method of [<code>status</code>](#Morebits.status)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>comments</td><td><code>string</code></td>
    </tr><tr>
    <td>message</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.batchOperation"></a>

### Morebits.batchOperation
**Kind**: static class of [<code>Morebits</code>](#Morebits)  

* [.batchOperation](#Morebits.batchOperation)
    * [new Morebits.batchOperation([currentAction])](#new_Morebits.batchOperation_new)
    * [.setPageList(pageList)](#Morebits.batchOperation+setPageList)
    * [.setOption(optionName, optionValue)](#Morebits.batchOperation+setOption)
    * [.run(worker, [postFinish])](#Morebits.batchOperation+run)
    * [.workerSuccess(arg)](#Morebits.batchOperation+workerSuccess)

<a name="new_Morebits.batchOperation_new"></a>

#### new Morebits.batchOperation([currentAction])
Iterates over a group of pages (or arbitrary objects) and executes a worker function
for each.

`setPageList(pageList)`: Sets the list of pages to work on. It should be an
array of page names strings.

`setOption(optionName, optionValue)`: Sets a known option:
- `chunkSize` (integer): The size of chunks to break the array into (default
50). Setting this to a small value (<5) can cause problems.
- `preserveIndividualStatusLines` (boolean): Keep each page's status element
visible when worker is complete? See note below.

`run(worker, postFinish)`: Runs the callback `worker` for each page in the
list.  The callback must call `workerSuccess` when succeeding, or
`workerFailure` when failing.  If using [api](#Morebits.wiki.api) or
[page](#Morebits.wiki.page), this is easily done by passing these two
functions as parameters to the methods on those objects: for instance,
`page.save(batchOp.workerSuccess, batchOp.workerFailure)`.  Make sure the
methods are called directly if special success/failure cases arise.  If you
omit to call these methods, the batch operation will stall after the first
chunk!  Also ensure that either workerSuccess or workerFailure is called no
more than once.  The second callback `postFinish` is executed when the
entire batch has been processed.

If using `preserveIndividualStatusLines`, you should try to ensure that the
`workerSuccess` callback has access to the page title.  This is no problem for
[page](#Morebits.wiki.page) objects.  But when using the API, please set the
|pageName| property on the [api](#Morebits.wiki.api) object.

There are sample batchOperation implementations using Morebits.wiki.page in
twinklebatchdelete.js, twinklebatchundelete.js, and twinklebatchprotect.js.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[currentAction]</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.batchOperation+setPageList"></a>

#### batchOperation.setPageList(pageList)
Sets the list of pages to work on.

**Kind**: instance method of [<code>batchOperation</code>](#Morebits.batchOperation)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>pageList</td><td><code>Array</code></td><td><p>Array of objects over which you wish to execute the worker function
This is usually the list of page names (strings).</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.batchOperation+setOption"></a>

#### batchOperation.setOption(optionName, optionValue)
Sets a known option.

**Kind**: instance method of [<code>batchOperation</code>](#Morebits.batchOperation)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>optionName</td><td><code>string</code></td><td><p>Name of the option:</p>
<ul>
<li>chunkSize (integer): The size of chunks to break the array into
(default 50). Setting this to a small value (&lt;5) can cause problems.</li>
<li>preserveIndividualStatusLines (boolean): Keep each page&#39;s status
element visible when worker is complete?</li>
</ul>
</td>
    </tr><tr>
    <td>optionValue</td><td><code>number</code> | <code>boolean</code></td><td><p>Value to which the option is
to be set. Should be an integer for chunkSize and a boolean for
preserveIndividualStatusLines.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.batchOperation+run"></a>

#### batchOperation.run(worker, [postFinish])
Runs the first callback for each page in the list.
The callback must call workerSuccess when succeeding, or workerFailure when failing.
Runs the optional second callback when the whole batch has been processed.

**Kind**: instance method of [<code>batchOperation</code>](#Morebits.batchOperation)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>worker</td><td><code>function</code></td>
    </tr><tr>
    <td>[postFinish]</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.batchOperation+workerSuccess"></a>

#### batchOperation.workerSuccess(arg)
To be called by worker before it terminates succesfully.

**Kind**: instance method of [<code>batchOperation</code>](#Morebits.batchOperation)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>arg</td><td><code><a href="#Morebits.wiki.page">page</a></code> | <code><a href="#Morebits.wiki.api">api</a></code> | <code>string</code></td><td><p>This should be the <code>Morebits.wiki.page</code> or <code>Morebits.wiki.api</code> object used by worker
(for the adjustment of status lines emitted by them).
If no Morebits.wiki.* object is used (e.g. you&#39;re using <code>mw.Api()</code> or something else), and
<code>preserveIndividualStatusLines</code> option is on, give the page name (string) as argument.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.taskManager"></a>

### Morebits.taskManager
**Kind**: static class of [<code>Morebits</code>](#Morebits)  

* [.taskManager](#Morebits.taskManager)
    * [new Morebits.taskManager()](#new_Morebits.taskManager_new)
    * [.add(func, deps, [onFailure])](#Morebits.taskManager+add)
    * [.execute()](#Morebits.taskManager+execute) ⇒ <code>jQuery.Promise</code>

<a name="new_Morebits.taskManager_new"></a>

#### new Morebits.taskManager()
Given a set of asynchronous functions to run along with their dependencies,
run them in an efficient sequence so that multiple functions
that don't depend on each other are triggered simultaneously. Where
dependencies exist, it ensures that the dependency functions finish running
before the dependent function runs. The values resolved by the dependencies
are made available to the dependant as arguments.

<a name="Morebits.taskManager+add"></a>

#### taskManager.add(func, deps, [onFailure])
Register a task along with its dependencies (tasks which should have finished
execution before we can begin this one). Each task is a function that must return
a promise. The function will get the values resolved by the dependency functions
as arguments.

**Kind**: instance method of [<code>taskManager</code>](#Morebits.taskManager)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>func</td><td><code>function</code></td><td><p>A task.</p>
</td>
    </tr><tr>
    <td>deps</td><td><code>Array.&lt;function()&gt;</code></td><td><p>Its dependencies.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>a failure callback that&#39;s run if the task or any one
of its dependencies fail.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.taskManager+execute"></a>

#### taskManager.execute() ⇒ <code>jQuery.Promise</code>
Run all the tasks. Multiple tasks may be run at once.

**Kind**: instance method of [<code>taskManager</code>](#Morebits.taskManager)  
**Returns**: <code>jQuery.Promise</code> - - Resolved if all tasks succeed, rejected otherwise.  
<a name="Morebits.simpleWindow"></a>

### Morebits.simpleWindow
**Kind**: static class of [<code>Morebits</code>](#Morebits)  
**Requires**: <code>module:jquery.ui.dialog</code>  

* [.simpleWindow](#Morebits.simpleWindow)
    * [new Morebits.simpleWindow(width, height)](#new_Morebits.simpleWindow_new)
    * _instance_
        * [.focus()](#Morebits.simpleWindow+focus) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.close([event])](#Morebits.simpleWindow+close) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.display()](#Morebits.simpleWindow+display) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.setTitle(title)](#Morebits.simpleWindow+setTitle) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.setScriptName(name)](#Morebits.simpleWindow+setScriptName) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.setWidth(width)](#Morebits.simpleWindow+setWidth) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.setHeight(height)](#Morebits.simpleWindow+setHeight) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.setContent(content)](#Morebits.simpleWindow+setContent) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.addContent(content)](#Morebits.simpleWindow+addContent) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.purgeContent()](#Morebits.simpleWindow+purgeContent) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.addFooterLink(text, wikiPage, [prep])](#Morebits.simpleWindow+addFooterLink) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
        * [.setModality([modal])](#Morebits.simpleWindow+setModality) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
    * _static_
        * [.setButtonsEnabled(enabled)](#Morebits.simpleWindow.setButtonsEnabled)

<a name="new_Morebits.simpleWindow_new"></a>

#### new Morebits.simpleWindow(width, height)
A simple draggable window, now a wrapper for jQuery UI's dialog feature.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>width</td><td><code>number</code></td><td></td>
    </tr><tr>
    <td>height</td><td><code>number</code></td><td><p>The maximum allowable height for the content area.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+focus"></a>

#### simpleWindow.focus() ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Focuses the dialog. This might work, or on the contrary, it might not.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<a name="Morebits.simpleWindow+close"></a>

#### simpleWindow.close([event]) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Closes the dialog. If this is set as an event handler, it will stop the event
from doing anything more.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[event]</td><td><code>event</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+display"></a>

#### simpleWindow.display() ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Shows the dialog. Calling display() on a dialog that has previously been closed
might work, but it is not guaranteed.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<a name="Morebits.simpleWindow+setTitle"></a>

#### simpleWindow.setTitle(title) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Sets the dialog title.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>title</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+setScriptName"></a>

#### simpleWindow.setScriptName(name) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Sets the script name, appearing as a prefix to the title to help users determine which
user script is producing which dialog. For instance, Twinkle modules set this to "Twinkle".

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>name</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+setWidth"></a>

#### simpleWindow.setWidth(width) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Sets the dialog width.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>width</td><td><code>number</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+setHeight"></a>

#### simpleWindow.setHeight(height) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Sets the dialog's maximum height. The dialog will auto-size to fit its contents,
but the content area will grow no larger than the height given here.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>height</td><td><code>number</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+setContent"></a>

#### simpleWindow.setContent(content) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Sets the content of the dialog to the given element node, usually from rendering
a [quickForm](#Morebits.quickForm).
Re-enumerates the footer buttons, but leaves the footer links as they are.
Be sure to call this at least once before the dialog is displayed...

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>content</td><td><code>HTMLElement</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+addContent"></a>

#### simpleWindow.addContent(content) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Adds the given element node to the dialog content.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>content</td><td><code>HTMLElement</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+purgeContent"></a>

#### simpleWindow.purgeContent() ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Removes all contents from the dialog, barring any footer links.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<a name="Morebits.simpleWindow+addFooterLink"></a>

#### simpleWindow.addFooterLink(text, wikiPage, [prep]) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Adds a link in the bottom-right corner of the dialog.
This can be used to provide help or policy links.
For example, Twinkle's CSD module adds a link to the CSD policy page,
as well as a link to Twinkle's documentation.

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td></td><td><p>Display text.</p>
</td>
    </tr><tr>
    <td>wikiPage</td><td><code>string</code></td><td></td><td><p>Link target.</p>
</td>
    </tr><tr>
    <td>[prep]</td><td><code>boolean</code></td><td><code>false</code></td><td><p>Set true to prepend rather than append.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow+setModality"></a>

#### simpleWindow.setModality([modal]) ⇒ [<code>simpleWindow</code>](#Morebits.simpleWindow)
Sets whether the window should be modal or not. Modal dialogs create
an overlay below the dialog but above other page elements. This
must be used (if necessary) before calling display().

**Kind**: instance method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[modal]</td><td><code>boolean</code></td><td><code>false</code></td><td><p>If set to true, other items on the
page will be disabled, i.e., cannot be interacted with.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.simpleWindow.setButtonsEnabled"></a>

#### simpleWindow.setButtonsEnabled(enabled)
Enables or disables all footer buttons on all [simpleWindow](#Morebits.simpleWindow)s in the current page.
This should be called with `false` when the button(s) become irrelevant (e.g. just before
[init](#Morebits.status.init) is called).
This is not an instance method so that consumers don't have to keep a reference to the
original `Morebits.simpleWindow` object sitting around somewhere. Anyway, most of the time
there will only be one `Morebits.simpleWindow` open, so this shouldn't matter.

**Kind**: static method of [<code>simpleWindow</code>](#Morebits.simpleWindow)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>enabled</td><td><code>boolean</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.userIsSysop"></a>

### Morebits.userIsSysop : <code>boolean</code>
Hardcodes whether the user is a sysop, used a lot.

**Kind**: static property of [<code>Morebits</code>](#Morebits)  
<a name="Morebits.pageNameNorm"></a>

### Morebits.pageNameNorm : <code>string</code>
Stores a normalized (underscores converted to spaces) version of the
`wgPageName` variable.

**Kind**: static property of [<code>Morebits</code>](#Morebits)  
<a name="Morebits.ip"></a>

### Morebits.ip : <code>object</code>
Utilities to help process IP addresses.

**Kind**: static namespace of [<code>Morebits</code>](#Morebits)  

* [.ip](#Morebits.ip) : <code>object</code>
    * [.sanitizeIPv6(address)](#Morebits.ip.sanitizeIPv6) ⇒ <code>string</code>
    * [.isRange(ip)](#Morebits.ip.isRange) ⇒ <code>boolean</code>
    * [.validCIDR()](#Morebits.ip.validCIDR) ⇒ <code>boolean</code>
    * [.get64(ipv6)](#Morebits.ip.get64) ⇒ <code>boolean</code> \| <code>string</code>

<a name="Morebits.ip.sanitizeIPv6"></a>

#### ip.sanitizeIPv6(address) ⇒ <code>string</code>
Converts an IPv6 address to the canonical form stored and used by MediaWiki.
JavaScript translation of the [`IP::sanitizeIP()`](https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/8eb6ac3e84ea3312d391ca96c12c49e3ad0753bb/includes/utils/IP.php#131)
function from the IPUtils library.  Adddresses are verbose, uppercase,
normalized, and expanded to 8 words.

**Kind**: static method of [<code>ip</code>](#Morebits.ip)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>address</td><td><code>string</code></td><td><p>The IPv6 address, with or without CIDR.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.ip.isRange"></a>

#### ip.isRange(ip) ⇒ <code>boolean</code>
Determine if the given IP address is a range.  Just conjoins
`mw.util.isIPAddress` with and without the `allowBlock` option.

**Kind**: static method of [<code>ip</code>](#Morebits.ip)  
**Returns**: <code>boolean</code> - - True if given a valid IP address range, false otherwise.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>ip</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.ip.validCIDR"></a>

#### ip.validCIDR() ⇒ <code>boolean</code>
Check that an IP range is within the CIDR limits.  Most likely to be useful
in conjunction with `wgRelevantUserName`.  CIDR limits are harcoded as /16
for IPv4 and /32 for IPv6.

**Kind**: static method of [<code>ip</code>](#Morebits.ip)  
**Returns**: <code>boolean</code> - - True for valid ranges within the CIDR limits,
otherwise false (ranges outside the limit, single IPs, non-IPs).  
<a name="Morebits.ip.get64"></a>

#### ip.get64(ipv6) ⇒ <code>boolean</code> \| <code>string</code>
Get the /64 subnet for an IPv6 address.

**Kind**: static method of [<code>ip</code>](#Morebits.ip)  
**Returns**: <code>boolean</code> \| <code>string</code> - - False if not IPv6 or bigger than a 64,
otherwise the (sanitized) /64 address.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>ipv6</td><td><code>string</code></td><td><p>The IPv6 address, with or without a subnet.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.string"></a>

### Morebits.string : <code>object</code>
Helper functions to manipulate strings.

**Kind**: static namespace of [<code>Morebits</code>](#Morebits)  

* [.string](#Morebits.string) : <code>object</code>
    * [.toUpperCaseFirstChar(str)](#Morebits.string.toUpperCaseFirstChar) ⇒ <code>string</code>
    * [.toLowerCaseFirstChar(str)](#Morebits.string.toLowerCaseFirstChar) ⇒ <code>string</code>
    * [.splitWeightedByKeys(str, start, end, [skiplist])](#Morebits.string.splitWeightedByKeys) ⇒ <code>Array.&lt;string&gt;</code>
    * [.formatReasonText(str, [addSig])](#Morebits.string.formatReasonText) ⇒ <code>string</code>
    * [.formatReasonForLog(str)](#Morebits.string.formatReasonForLog) ⇒ <code>string</code>
    * [.safeReplace(string, pattern, replacement)](#Morebits.string.safeReplace) ⇒ <code>string</code>
    * [.isInfinity(expiry)](#Morebits.string.isInfinity) ⇒ <code>boolean</code>
    * [.escapeRegExp(text)](#Morebits.string.escapeRegExp) ⇒ <code>string</code>

<a name="Morebits.string.toUpperCaseFirstChar"></a>

#### string.toUpperCaseFirstChar(str) ⇒ <code>string</code>
**Kind**: static method of [<code>string</code>](#Morebits.string)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>str</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.string.toLowerCaseFirstChar"></a>

#### string.toLowerCaseFirstChar(str) ⇒ <code>string</code>
**Kind**: static method of [<code>string</code>](#Morebits.string)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>str</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.string.splitWeightedByKeys"></a>

#### string.splitWeightedByKeys(str, start, end, [skiplist]) ⇒ <code>Array.&lt;string&gt;</code>
Gives an array of substrings of `str` - starting with `start` and
ending with `end` - which is not in `skiplist`.  Intended for use
on wikitext with templates or links.

**Kind**: static method of [<code>string</code>](#Morebits.string)  
**Throws**:

- If the `start` and `end` strings aren't of the same length.
- If `skiplist` isn't an array or string

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>str</td><td><code>string</code></td>
    </tr><tr>
    <td>start</td><td><code>string</code></td>
    </tr><tr>
    <td>end</td><td><code>string</code></td>
    </tr><tr>
    <td>[skiplist]</td><td><code>Array.&lt;string&gt;</code> | <code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.string.formatReasonText"></a>

#### string.formatReasonText(str, [addSig]) ⇒ <code>string</code>
Formats freeform "reason" (from a textarea) for deletion/other
templates that are going to be substituted, (e.g. PROD, XFD, RPP).
Handles `|` outside a nowiki tag.
Optionally, also adds a signature if not present already.

**Kind**: static method of [<code>string</code>](#Morebits.string)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>str</td><td><code>string</code></td>
    </tr><tr>
    <td>[addSig]</td><td><code>boolean</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.string.formatReasonForLog"></a>

#### string.formatReasonForLog(str) ⇒ <code>string</code>
Formats a "reason" (from a textarea) for inclusion in a userspace
log.  Replaces newlines with {{Pb}}, and adds an extra `#` before
list items for proper formatting.

**Kind**: static method of [<code>string</code>](#Morebits.string)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>str</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.string.safeReplace"></a>

#### string.safeReplace(string, pattern, replacement) ⇒ <code>string</code>
Like `String.prototype.replace()`, but escapes any dollar signs in
the replacement string.  Useful when the the replacement string is
arbitrary, such as a username or freeform user input, and could
contain dollar signs.

**Kind**: static method of [<code>string</code>](#Morebits.string)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>string</td><td><code>string</code></td><td><p>Text in which to replace.</p>
</td>
    </tr><tr>
    <td>pattern</td><td><code>string</code> | <code>RegExp</code></td><td></td>
    </tr><tr>
    <td>replacement</td><td><code>string</code></td><td></td>
    </tr>  </tbody>
</table>

<a name="Morebits.string.isInfinity"></a>

#### string.isInfinity(expiry) ⇒ <code>boolean</code>
Determine if the user-provided expiration will be considered an
infinite-length by MW.

**Kind**: static method of [<code>string</code>](#Morebits.string)  
**See**: [https://phabricator.wikimedia.org/T68646](https://phabricator.wikimedia.org/T68646)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>expiry</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.string.escapeRegExp"></a>

#### string.escapeRegExp(text) ⇒ <code>string</code>
Escapes a string to be used in a RegExp, replacing spaces and
underscores with `[_ ]` as they are often equivalent.
Replaced RegExp.escape September 2020.

**Kind**: static method of [<code>string</code>](#Morebits.string)  
**Returns**: <code>string</code> - - The escaped text.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td><p>String to be escaped.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.array"></a>

### Morebits.array : <code>object</code>
Helper functions to manipulate arrays.

**Kind**: static namespace of [<code>Morebits</code>](#Morebits)  

* [.array](#Morebits.array) : <code>object</code>
    * [.uniq(arr)](#Morebits.array.uniq) ⇒ <code>Array</code>
    * [.dups(arr)](#Morebits.array.dups) ⇒ <code>Array</code>
    * [.chunk(arr, size)](#Morebits.array.chunk) ⇒ <code>Array.&lt;Array&gt;</code>

<a name="Morebits.array.uniq"></a>

#### array.uniq(arr) ⇒ <code>Array</code>
Remove duplicated items from an array.

**Kind**: static method of [<code>array</code>](#Morebits.array)  
**Returns**: <code>Array</code> - A copy of the array with duplicates removed.  
**Throws**:

- When provided a non-array.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>arr</td><td><code>Array</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.array.dups"></a>

#### array.dups(arr) ⇒ <code>Array</code>
Remove non-duplicated items from an array.

**Kind**: static method of [<code>array</code>](#Morebits.array)  
**Returns**: <code>Array</code> - A copy of the array with the first instance of each value
removed; subsequent instances of those values (duplicates) remain.  
**Throws**:

- When provided a non-array.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>arr</td><td><code>Array</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.array.chunk"></a>

#### array.chunk(arr, size) ⇒ <code>Array.&lt;Array&gt;</code>
Break up an array into smaller arrays.

**Kind**: static method of [<code>array</code>](#Morebits.array)  
**Returns**: <code>Array.&lt;Array&gt;</code> - An array containing the smaller, chunked arrays.  
**Throws**:

- When provided a non-array.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>arr</td><td><code>Array</code></td><td></td>
    </tr><tr>
    <td>size</td><td><code>number</code></td><td><p>Size of each chunk (except the last, which could be different).</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.select2"></a>

### Morebits.select2 : <code>object</code>
Utilities to enhance select2 menus. See twinklewarn, twinklexfd,
twinkleblock for sample usages.

**Kind**: static namespace of [<code>Morebits</code>](#Morebits)  
**Requires**: <code>module:jquery.select2</code>  
**See**: [https://select2.org/](https://select2.org/)  

* [.select2](#Morebits.select2) : <code>object</code>
    * [.highlightSearchMatches()](#Morebits.select2.highlightSearchMatches)
    * [.queryInterceptor()](#Morebits.select2.queryInterceptor)
    * [.autoStart()](#Morebits.select2.autoStart)

<a name="Morebits.select2.highlightSearchMatches"></a>

#### select2.highlightSearchMatches()
Underline matched part of options.

**Kind**: static method of [<code>select2</code>](#Morebits.select2)  
<a name="Morebits.select2.queryInterceptor"></a>

#### select2.queryInterceptor()
Intercept query as it is happening, for use in highlightSearchMatches.

**Kind**: static method of [<code>select2</code>](#Morebits.select2)  
<a name="Morebits.select2.autoStart"></a>

#### select2.autoStart()
Open dropdown and begin search when the `.select2-selection` has
focus and a key is pressed.

**Kind**: static method of [<code>select2</code>](#Morebits.select2)  
**See**: [https://github.com/select2/select2/issues/3279#issuecomment-442524147](https://github.com/select2/select2/issues/3279#issuecomment-442524147)  
<a name="Morebits.wiki"></a>

### Morebits.wiki : <code>object</code>
Various objects for wiki editing and API access, including
[api](#Morebits.wiki.api) and [page](#Morebits.wiki.page).

**Kind**: static namespace of [<code>Morebits</code>](#Morebits)  

* [.wiki](#Morebits.wiki) : <code>object</code>
    * [.api](#Morebits.wiki.api)
        * [new Morebits.wiki.api(currentAction, query, [onSuccess], [statusElement], [onError])](#new_Morebits.wiki.api_new)
        * _instance_
            * [.setParent(parent)](#Morebits.wiki.api+setParent)
            * [.setStatusElement(statusElement)](#Morebits.wiki.api+setStatusElement)
            * [.post(callerAjaxParameters)](#Morebits.wiki.api+post) ⇒ <code>promise</code>
        * _static_
            * [.morebitsWikiChangeTag](#Morebits.wiki.api.morebitsWikiChangeTag) : <code>string</code>
            * [.setApiUserAgent([ua])](#Morebits.wiki.api.setApiUserAgent)
            * [.getToken()](#Morebits.wiki.api.getToken) ⇒ <code>string</code>
    * [.page](#Morebits.wiki.page)
        * [new Morebits.wiki.page(pageName, [status])](#new_Morebits.wiki.page_new)
        * _instance_
            * [.load(onSuccess, [onFailure])](#Morebits.wiki.page+load)
            * [.save([onSuccess], [onFailure])](#Morebits.wiki.page+save)
            * [.append([onSuccess], [onFailure])](#Morebits.wiki.page+append)
            * [.prepend([onSuccess], [onFailure])](#Morebits.wiki.page+prepend)
            * [.newSection([onSuccess], [onFailure])](#Morebits.wiki.page+newSection)
            * [.getPageName()](#Morebits.wiki.page+getPageName) ⇒ <code>string</code>
            * [.getPageText()](#Morebits.wiki.page+getPageText) ⇒ <code>string</code>
            * [.setPageText(pageText)](#Morebits.wiki.page+setPageText)
            * [.setAppendText(appendText)](#Morebits.wiki.page+setAppendText)
            * [.setPrependText(prependText)](#Morebits.wiki.page+setPrependText)
            * [.setNewSectionText(newSectionText)](#Morebits.wiki.page+setNewSectionText)
            * [.setNewSectionTitle(newSectionTitle)](#Morebits.wiki.page+setNewSectionTitle)
            * [.setEditSummary(summary)](#Morebits.wiki.page+setEditSummary)
            * [.setChangeTags(tags)](#Morebits.wiki.page+setChangeTags)
            * [.setCreateOption([createOption])](#Morebits.wiki.page+setCreateOption)
            * [.setMinorEdit(minorEdit)](#Morebits.wiki.page+setMinorEdit)
            * [.setBotEdit(botEdit)](#Morebits.wiki.page+setBotEdit)
            * [.setPageSection(pageSection)](#Morebits.wiki.page+setPageSection)
            * [.setMaxConflictRetries(maxConflictRetries)](#Morebits.wiki.page+setMaxConflictRetries)
            * [.setMaxRetries(maxRetries)](#Morebits.wiki.page+setMaxRetries)
            * [.setWatchlist([watchlistOption], [watchlistExpiry])](#Morebits.wiki.page+setWatchlist)
            * [.setWatchlistExpiry([watchlistExpiry])](#Morebits.wiki.page+setWatchlistExpiry)
            * <del>[.setWatchlistFromPreferences([watchlistOption])](#Morebits.wiki.page+setWatchlistFromPreferences)</del>
            * [.setFollowRedirect([followRedirect], [followCrossNsRedirect])](#Morebits.wiki.page+setFollowRedirect)
            * [.setLookupNonRedirectCreator(flag)](#Morebits.wiki.page+setLookupNonRedirectCreator)
            * [.setMoveDestination(destination)](#Morebits.wiki.page+setMoveDestination)
            * [.setMoveTalkPage(flag)](#Morebits.wiki.page+setMoveTalkPage)
            * [.setMoveSubpages(flag)](#Morebits.wiki.page+setMoveSubpages)
            * [.setMoveSuppressRedirect(flag)](#Morebits.wiki.page+setMoveSuppressRedirect)
            * [.setEditProtection(level, [expiry])](#Morebits.wiki.page+setEditProtection)
            * [.getCurrentID()](#Morebits.wiki.page+getCurrentID) ⇒ <code>string</code>
            * [.getRevisionUser()](#Morebits.wiki.page+getRevisionUser) ⇒ <code>string</code>
            * [.getLastEditTime()](#Morebits.wiki.page+getLastEditTime) ⇒ <code>string</code>
            * [.setCallbackParameters(callbackParameters)](#Morebits.wiki.page+setCallbackParameters)
            * [.getCallbackParameters()](#Morebits.wiki.page+getCallbackParameters) ⇒ <code>object</code>
            * [.setStatusElement(statusElement)](#Morebits.wiki.page+setStatusElement)
            * [.getStatusElement()](#Morebits.wiki.page+getStatusElement) ⇒ [<code>status</code>](#Morebits.status)
            * [.setFlaggedRevs(level, [expiry])](#Morebits.wiki.page+setFlaggedRevs)
            * [.exists()](#Morebits.wiki.page+exists) ⇒ <code>boolean</code>
            * [.getPageID()](#Morebits.wiki.page+getPageID) ⇒ <code>string</code>
            * [.getContentModel()](#Morebits.wiki.page+getContentModel) ⇒ <code>string</code>
            * [.getWatched()](#Morebits.wiki.page+getWatched) ⇒ <code>boolean</code> \| <code>string</code>
            * [.getLoadTime()](#Morebits.wiki.page+getLoadTime) ⇒ <code>string</code>
            * [.getCreator()](#Morebits.wiki.page+getCreator) ⇒ <code>string</code>
            * [.getCreationTimestamp()](#Morebits.wiki.page+getCreationTimestamp) ⇒ <code>string</code>
            * [.canEdit()](#Morebits.wiki.page+canEdit) ⇒ <code>boolean</code>
            * [.lookupCreation(onSuccess, [onFailure])](#Morebits.wiki.page+lookupCreation)
            * [.revert([onSuccess], [onFailure])](#Morebits.wiki.page+revert)
            * [.move([onSuccess], [onFailure])](#Morebits.wiki.page+move)
            * [.patrol()](#Morebits.wiki.page+patrol)
            * [.triage()](#Morebits.wiki.page+triage)
            * [.deletePage([onSuccess], [onFailure])](#Morebits.wiki.page+deletePage)
            * [.undeletePage([onSuccess], [onFailure])](#Morebits.wiki.page+undeletePage)
            * [.protect([onSuccess], [onFailure])](#Morebits.wiki.page+protect)
            * [.stabilize([onSuccess], [onFailure])](#Morebits.wiki.page+stabilize)
        * _inner_
            * [~fnCanUseMwUserToken([action])](#Morebits.wiki.page..fnCanUseMwUserToken) ⇒ <code>boolean</code>
            * [~fnNeedTokenInfoQuery(action)](#Morebits.wiki.page..fnNeedTokenInfoQuery) ⇒ <code>object</code>
            * [~fnApplyWatchlistExpiry()](#Morebits.wiki.page..fnApplyWatchlistExpiry) ⇒ <code>boolean</code>
            * [~fnPreflightChecks(action, onFailure)](#Morebits.wiki.page..fnPreflightChecks) ⇒ <code>boolean</code>
            * [~fnProcessChecks(action, onFailure, response)](#Morebits.wiki.page..fnProcessChecks) ⇒ <code>boolean</code>
    * [.preview](#Morebits.wiki.preview)
        * [new Morebits.wiki.preview(previewbox)](#new_Morebits.wiki.preview_new)
        * [.beginRender(wikitext, [pageTitle], [sectionTitle])](#Morebits.wiki.preview+beginRender) ⇒ <code>jQuery.promise</code>
        * [.closePreview()](#Morebits.wiki.preview+closePreview)
    * [.numberOfActionsLeft](#Morebits.wiki.numberOfActionsLeft) : <code>number</code>
    * [.nbrOfCheckpointsLeft](#Morebits.wiki.nbrOfCheckpointsLeft) : <code>number</code>
    * <del>[.isPageRedirect()](#Morebits.wiki.isPageRedirect) ⇒ <code>boolean</code></del>
    * [.actionCompleted()](#Morebits.wiki.actionCompleted)
        * [.timeOut](#Morebits.wiki.actionCompleted.timeOut)
        * [.redirect](#Morebits.wiki.actionCompleted.redirect)
        * [.notice](#Morebits.wiki.actionCompleted.notice)
        * [.event()](#Morebits.wiki.actionCompleted.event)
    * [.addCheckpoint()](#Morebits.wiki.addCheckpoint)
    * [.removeCheckpoint()](#Morebits.wiki.removeCheckpoint)

<a name="Morebits.wiki.api"></a>

#### wiki.api
**Kind**: static class of [<code>wiki</code>](#Morebits.wiki)  

* [.api](#Morebits.wiki.api)
    * [new Morebits.wiki.api(currentAction, query, [onSuccess], [statusElement], [onError])](#new_Morebits.wiki.api_new)
    * _instance_
        * [.setParent(parent)](#Morebits.wiki.api+setParent)
        * [.setStatusElement(statusElement)](#Morebits.wiki.api+setStatusElement)
        * [.post(callerAjaxParameters)](#Morebits.wiki.api+post) ⇒ <code>promise</code>
    * _static_
        * [.morebitsWikiChangeTag](#Morebits.wiki.api.morebitsWikiChangeTag) : <code>string</code>
        * [.setApiUserAgent([ua])](#Morebits.wiki.api.setApiUserAgent)
        * [.getToken()](#Morebits.wiki.api.getToken) ⇒ <code>string</code>

<a name="new_Morebits.wiki.api_new"></a>

##### new Morebits.wiki.api(currentAction, query, [onSuccess], [statusElement], [onError])
An easy way to talk to the MediaWiki API.  Accepts either json or xml
(default) formats; if json is selected, will default to `formatversion=2`
unless otherwise specified.  Similarly, enforces newer `errorformat`s,
defaulting to `html` if unspecified.  `uselang` enforced to the wiki's
content language.

In new code, the use of the last 3 parameters should be avoided, instead
use [setStatusElement()](#Morebits.wiki.api+setStatusElement) to bind
the status element (if needed) and use `.then()` or `.catch()` on the
promise returned by `post()`, rather than specify the `onSuccess` or
`onFailure` callbacks.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>currentAction</td><td><code>string</code></td><td><p>The current action (required).</p>
</td>
    </tr><tr>
    <td>query</td><td><code>object</code></td><td><p>The query (required).</p>
</td>
    </tr><tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>The function to call when request is successful.</p>
</td>
    </tr><tr>
    <td>[statusElement]</td><td><code><a href="#Morebits.status">status</a></code></td><td><p>A Morebits.status object to use for status messages.</p>
</td>
    </tr><tr>
    <td>[onError]</td><td><code>function</code></td><td><p>The function to call if an error occurs.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.api+setParent"></a>

##### api.setParent(parent)
Keep track of parent object for callbacks.

**Kind**: instance method of [<code>api</code>](#Morebits.wiki.api)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>parent</td><td><code>*</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.api+setStatusElement"></a>

##### api.setStatusElement(statusElement)
**Kind**: instance method of [<code>api</code>](#Morebits.wiki.api)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>statusElement</td><td><code><a href="#Morebits.status">status</a></code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.api+post"></a>

##### api.post(callerAjaxParameters) ⇒ <code>promise</code>
Carry out the request.

**Kind**: instance method of [<code>api</code>](#Morebits.wiki.api)  
**Returns**: <code>promise</code> - - A jQuery promise object that is resolved or rejected with the api object.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>callerAjaxParameters</td><td><code>object</code></td><td><p>Do not specify a parameter unless you really
really want to give jQuery some extra parameters.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.api.morebitsWikiChangeTag"></a>

##### api.morebitsWikiChangeTag : <code>string</code>
Change/revision tag applied to Morebits actions when no other tags are specified.
Unused by default per [EnWiki consensus](https://en.wikipedia.org/w/index.php?oldid=970618849#Adding_tags_to_Twinkle_edits_and_actions).

**Kind**: static constant of [<code>api</code>](#Morebits.wiki.api)  
<a name="Morebits.wiki.api.setApiUserAgent"></a>

##### api.setApiUserAgent([ua])
Set the custom user agent header, which is used for server-side logging.
Note that doing so will set the useragent for every `Morebits.wiki.api`
process performed thereafter.

**Kind**: static method of [<code>api</code>](#Morebits.wiki.api)  
**See**: [https://lists.wikimedia.org/pipermail/mediawiki-api-announce/2014-November/000075.html](https://lists.wikimedia.org/pipermail/mediawiki-api-announce/2014-November/000075.html)
for original announcement.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[ua]</td><td><code>string</code></td><td><code>&quot;morebits.js ([[w:WT:TW]])&quot;</code></td><td><p>User agent.  The default
value of <code>morebits.js ([[w:WT:TW]])</code> will be appended to any provided
value.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.api.getToken"></a>

##### api.getToken() ⇒ <code>string</code>
Get a new CSRF token on encountering token errors.

**Kind**: static method of [<code>api</code>](#Morebits.wiki.api)  
**Returns**: <code>string</code> - MediaWiki CSRF token.  
<a name="Morebits.wiki.page"></a>

#### wiki.page
**Kind**: static class of [<code>wiki</code>](#Morebits.wiki)  

* [.page](#Morebits.wiki.page)
    * [new Morebits.wiki.page(pageName, [status])](#new_Morebits.wiki.page_new)
    * _instance_
        * [.load(onSuccess, [onFailure])](#Morebits.wiki.page+load)
        * [.save([onSuccess], [onFailure])](#Morebits.wiki.page+save)
        * [.append([onSuccess], [onFailure])](#Morebits.wiki.page+append)
        * [.prepend([onSuccess], [onFailure])](#Morebits.wiki.page+prepend)
        * [.newSection([onSuccess], [onFailure])](#Morebits.wiki.page+newSection)
        * [.getPageName()](#Morebits.wiki.page+getPageName) ⇒ <code>string</code>
        * [.getPageText()](#Morebits.wiki.page+getPageText) ⇒ <code>string</code>
        * [.setPageText(pageText)](#Morebits.wiki.page+setPageText)
        * [.setAppendText(appendText)](#Morebits.wiki.page+setAppendText)
        * [.setPrependText(prependText)](#Morebits.wiki.page+setPrependText)
        * [.setNewSectionText(newSectionText)](#Morebits.wiki.page+setNewSectionText)
        * [.setNewSectionTitle(newSectionTitle)](#Morebits.wiki.page+setNewSectionTitle)
        * [.setEditSummary(summary)](#Morebits.wiki.page+setEditSummary)
        * [.setChangeTags(tags)](#Morebits.wiki.page+setChangeTags)
        * [.setCreateOption([createOption])](#Morebits.wiki.page+setCreateOption)
        * [.setMinorEdit(minorEdit)](#Morebits.wiki.page+setMinorEdit)
        * [.setBotEdit(botEdit)](#Morebits.wiki.page+setBotEdit)
        * [.setPageSection(pageSection)](#Morebits.wiki.page+setPageSection)
        * [.setMaxConflictRetries(maxConflictRetries)](#Morebits.wiki.page+setMaxConflictRetries)
        * [.setMaxRetries(maxRetries)](#Morebits.wiki.page+setMaxRetries)
        * [.setWatchlist([watchlistOption], [watchlistExpiry])](#Morebits.wiki.page+setWatchlist)
        * [.setWatchlistExpiry([watchlistExpiry])](#Morebits.wiki.page+setWatchlistExpiry)
        * <del>[.setWatchlistFromPreferences([watchlistOption])](#Morebits.wiki.page+setWatchlistFromPreferences)</del>
        * [.setFollowRedirect([followRedirect], [followCrossNsRedirect])](#Morebits.wiki.page+setFollowRedirect)
        * [.setLookupNonRedirectCreator(flag)](#Morebits.wiki.page+setLookupNonRedirectCreator)
        * [.setMoveDestination(destination)](#Morebits.wiki.page+setMoveDestination)
        * [.setMoveTalkPage(flag)](#Morebits.wiki.page+setMoveTalkPage)
        * [.setMoveSubpages(flag)](#Morebits.wiki.page+setMoveSubpages)
        * [.setMoveSuppressRedirect(flag)](#Morebits.wiki.page+setMoveSuppressRedirect)
        * [.setEditProtection(level, [expiry])](#Morebits.wiki.page+setEditProtection)
        * [.getCurrentID()](#Morebits.wiki.page+getCurrentID) ⇒ <code>string</code>
        * [.getRevisionUser()](#Morebits.wiki.page+getRevisionUser) ⇒ <code>string</code>
        * [.getLastEditTime()](#Morebits.wiki.page+getLastEditTime) ⇒ <code>string</code>
        * [.setCallbackParameters(callbackParameters)](#Morebits.wiki.page+setCallbackParameters)
        * [.getCallbackParameters()](#Morebits.wiki.page+getCallbackParameters) ⇒ <code>object</code>
        * [.setStatusElement(statusElement)](#Morebits.wiki.page+setStatusElement)
        * [.getStatusElement()](#Morebits.wiki.page+getStatusElement) ⇒ [<code>status</code>](#Morebits.status)
        * [.setFlaggedRevs(level, [expiry])](#Morebits.wiki.page+setFlaggedRevs)
        * [.exists()](#Morebits.wiki.page+exists) ⇒ <code>boolean</code>
        * [.getPageID()](#Morebits.wiki.page+getPageID) ⇒ <code>string</code>
        * [.getContentModel()](#Morebits.wiki.page+getContentModel) ⇒ <code>string</code>
        * [.getWatched()](#Morebits.wiki.page+getWatched) ⇒ <code>boolean</code> \| <code>string</code>
        * [.getLoadTime()](#Morebits.wiki.page+getLoadTime) ⇒ <code>string</code>
        * [.getCreator()](#Morebits.wiki.page+getCreator) ⇒ <code>string</code>
        * [.getCreationTimestamp()](#Morebits.wiki.page+getCreationTimestamp) ⇒ <code>string</code>
        * [.canEdit()](#Morebits.wiki.page+canEdit) ⇒ <code>boolean</code>
        * [.lookupCreation(onSuccess, [onFailure])](#Morebits.wiki.page+lookupCreation)
        * [.revert([onSuccess], [onFailure])](#Morebits.wiki.page+revert)
        * [.move([onSuccess], [onFailure])](#Morebits.wiki.page+move)
        * [.patrol()](#Morebits.wiki.page+patrol)
        * [.triage()](#Morebits.wiki.page+triage)
        * [.deletePage([onSuccess], [onFailure])](#Morebits.wiki.page+deletePage)
        * [.undeletePage([onSuccess], [onFailure])](#Morebits.wiki.page+undeletePage)
        * [.protect([onSuccess], [onFailure])](#Morebits.wiki.page+protect)
        * [.stabilize([onSuccess], [onFailure])](#Morebits.wiki.page+stabilize)
    * _inner_
        * [~fnCanUseMwUserToken([action])](#Morebits.wiki.page..fnCanUseMwUserToken) ⇒ <code>boolean</code>
        * [~fnNeedTokenInfoQuery(action)](#Morebits.wiki.page..fnNeedTokenInfoQuery) ⇒ <code>object</code>
        * [~fnApplyWatchlistExpiry()](#Morebits.wiki.page..fnApplyWatchlistExpiry) ⇒ <code>boolean</code>
        * [~fnPreflightChecks(action, onFailure)](#Morebits.wiki.page..fnPreflightChecks) ⇒ <code>boolean</code>
        * [~fnProcessChecks(action, onFailure, response)](#Morebits.wiki.page..fnProcessChecks) ⇒ <code>boolean</code>

<a name="new_Morebits.wiki.page_new"></a>

##### new Morebits.wiki.page(pageName, [status])
Use the MediaWiki API to load a page and optionally edit it, move it, etc.

Callers are not permitted to directly access the properties of this class!
All property access is through the appropriate get___() or set___() method.

Callers should set [notice](#Morebits.wiki.actionCompleted.notice) and [redirect](#Morebits.wiki.actionCompleted.redirect)
before the first call to [Morebits.wiki.page.load()](Morebits.wiki.page.load()).

Each of the callback functions takes one parameter, which is a
reference to the Morebits.wiki.page object that registered the callback.
Callback functions may invoke any Morebits.wiki.page prototype method using this reference.


Call sequence for common operations (optional final user callbacks not shown):

- Edit current contents of a page (no edit conflict):
`.load(userTextEditCallback) -> ctx.loadApi.post() ->
ctx.loadApi.post.success() -> ctx.fnLoadSuccess() -> userTextEditCallback() ->
.save() -> ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveSuccess()`

- Edit current contents of a page (with edit conflict):
`.load(userTextEditCallback) -> ctx.loadApi.post() ->
ctx.loadApi.post.success() -> ctx.fnLoadSuccess() -> userTextEditCallback() ->
.save() -> ctx.saveApi.post() -> ctx.loadApi.post.success() ->
ctx.fnSaveError() -> ctx.loadApi.post() -> ctx.loadApi.post.success() ->
ctx.fnLoadSuccess() -> userTextEditCallback() -> .save() ->
ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveSuccess()`

- Append to a page (similar for prepend and newSection):
`.append() -> ctx.loadApi.post() -> ctx.loadApi.post.success() ->
ctx.fnLoadSuccess() -> ctx.fnAutoSave() -> .save() -> ctx.saveApi.post() ->
ctx.loadApi.post.success() -> ctx.fnSaveSuccess()`

Notes:
1. All functions following Morebits.wiki.api.post() are invoked asynchronously from the jQuery AJAX library.
2. The sequence for append/prepend/newSection could be slightly shortened,
but it would require significant duplication of code for little benefit.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>pageName</td><td><code>string</code></td><td><p>The name of the page, prefixed by the namespace (if any).
For the current page, use <code>mw.config.get(&#39;wgPageName&#39;)</code>.</p>
</td>
    </tr><tr>
    <td>[status]</td><td><code>string</code> | <code><a href="#Morebits.status">status</a></code></td><td><p>A string describing the action about to be undertaken,
or a Morebits.status object</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+load"></a>

##### page.load(onSuccess, [onFailure])
Loads the text for the page.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>onSuccess</td><td><code>function</code></td><td><p>Callback function which is called when the load has succeeded.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function which is called when the load fails.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+save"></a>

##### page.save([onSuccess], [onFailure])
Saves the text for the page to Wikipedia.
Must be preceded by successfully calling `load()`.

Warning: Calling `save()` can result in additional calls to the
previous `load()` callbacks to recover from edit conflicts! In this
case, callers must make the same edit to the new pageText and
reinvoke `save()`.  This behavior can be disabled with
`setMaxConflictRetries(0)`.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function which is called when the save has succeeded.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function which is called when the save fails.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+append"></a>

##### page.append([onSuccess], [onFailure])
Adds the text provided via `setAppendText()` to the end of the
page.  Does not require calling `load()` first, unless a watchlist
expiry is used.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function which is called when the method has succeeded.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function which is called when the method fails.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+prepend"></a>

##### page.prepend([onSuccess], [onFailure])
Adds the text provided via `setPrependText()` to the start of the
page.  Does not require calling `load()` first, unless a watchlist
expiry is used.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function which is called when the method has succeeded.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function which is called when the method fails.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+newSection"></a>

##### page.newSection([onSuccess], [onFailure])
Creates a new section with the text provided by `setNewSectionText()`
and section title from `setNewSectionTitle()`.
If `editSummary` is provided, that will be used instead of the
autogenerated "->Title (new section" edit summary.
Does not require calling `load()` first, unless a watchlist expiry
is used.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function which is called when the method has succeeded.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function which is called when the method fails.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+getPageName"></a>

##### page.getPageName() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - The name of the loaded page, including the namespace  
<a name="Morebits.wiki.page+getPageText"></a>

##### page.getPageText() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - The text of the page after a successful load()  
<a name="Morebits.wiki.page+setPageText"></a>

##### page.setPageText(pageText)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>pageText</td><td><code>string</code></td><td><p>Updated page text that will be saved when <code>save()</code> is called</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setAppendText"></a>

##### page.setAppendText(appendText)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>appendText</td><td><code>string</code></td><td><p>Text that will be appended to the page when <code>append()</code> is called</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setPrependText"></a>

##### page.setPrependText(prependText)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>prependText</td><td><code>string</code></td><td><p>Text that will be prepended to the page when <code>prepend()</code> is called</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setNewSectionText"></a>

##### page.setNewSectionText(newSectionText)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>newSectionText</td><td><code>string</code></td><td><p>Text that will be added in a new section on the page when <code>newSection()</code> is called</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setNewSectionTitle"></a>

##### page.setNewSectionTitle(newSectionTitle)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>newSectionTitle</td><td><code>string</code></td><td><p>Title for the new section created when <code>newSection()</code> is called
If missing, <code>ctx.editSummary</code> will be used. Issues may occur if a substituted template is used.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setEditSummary"></a>

##### page.setEditSummary(summary)
Set the edit summary that will be used when `save()` is called.
Unnecessary if editMode is 'new' and newSectionTitle is provided.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>summary</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setChangeTags"></a>

##### page.setChangeTags(tags)
Set any custom tag(s) to be applied to the API action.
A number of actions don't support it, most notably watch, review,
and stabilize ([T247721](https://phabricator.wikimedia.org/T247721)), and
pagetriageaction ([T252980](https://phabricator.wikimedia.org/T252980)).

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>tags</td><td><code>string</code> | <code>Array.&lt;string&gt;</code></td><td><p>String or array of tag(s).</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setCreateOption"></a>

##### page.setCreateOption([createOption])
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[createOption]</td><td><code>string</code></td><td><code>null</code></td><td><p>Can take the following four values:</p>
<ul>
<li>recreate: create the page if it does not exist, or edit it if it exists.</li>
<li>createonly: create the page if it does not exist, but return an
error if it already exists.</li>
<li>nocreate: don&#39;t create the page, only edit it if it already exists.</li>
<li><code>null</code>: create the page if it does not exist, unless it was deleted
in the moment between loading the page and saving the edit (default).</li>
</ul>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setMinorEdit"></a>

##### page.setMinorEdit(minorEdit)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>minorEdit</td><td><code>boolean</code></td><td><p>Set true to mark the edit as a minor edit.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setBotEdit"></a>

##### page.setBotEdit(botEdit)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>botEdit</td><td><code>boolean</code></td><td><p>Set true to mark the edit as a bot edit</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setPageSection"></a>

##### page.setPageSection(pageSection)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>pageSection</td><td><code>number</code></td><td><p>Integer specifying the section number to load or save.
If specified as <code>null</code>, the entire page will be retrieved.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setMaxConflictRetries"></a>

##### page.setMaxConflictRetries(maxConflictRetries)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>maxConflictRetries</td><td><code>number</code></td><td><p>Number of retries for save errors involving an edit conflict or
loss of token. Default: 2.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setMaxRetries"></a>

##### page.setMaxRetries(maxRetries)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>maxRetries</td><td><code>number</code></td><td><p>Number of retries for save errors not involving an edit conflict or
loss of token. Default: 2.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setWatchlist"></a>

##### page.setWatchlist([watchlistOption], [watchlistExpiry])
Set whether and how to watch the page, including setting an expiry.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[watchlistOption]</td><td><code>boolean</code> | <code>string</code> | <code><a href="#Morebits.date">date</a></code> | <code>Date</code></td><td><code>false</code></td><td><p>Basically a mix of MW API and Twinkley options available pre-expiry:</p>
<ul>
<li><code>true</code>|<code>&#39;yes&#39;</code>|<code>&#39;watch&#39;</code>: page will be added to the user&#39;s
watchlist when the action is called. Defaults to an indefinite
watch unless <code>watchlistExpiry</code> is provided.</li>
<li><code>false</code>|<code>&#39;no&#39;</code>|<code>&#39;nochange&#39;</code>: watchlist status of the page (including expiry) will not be changed.</li>
<li><code>&#39;default&#39;</code>|<code>&#39;preferences&#39;</code>: watchlist status of the page will be
set based on the user&#39;s preference settings when the action is
called. Defaults to an indefinite watch unless <code>watchlistExpiry</code> is
provided.</li>
<li><code>&#39;unwatch&#39;</code>: explicitly unwatch the page.</li>
<li>Any other <code>string</code> or <code>number</code>, or a <code>Morebits.date</code> or <code>Date</code>
object: watch page until the specified time, deferring to
<code>watchlistExpiry</code> if provided.</li>
</ul>
</td>
    </tr><tr>
    <td>[watchlistExpiry]</td><td><code>string</code> | <code>number</code> | <code><a href="#Morebits.date">date</a></code> | <code>Date</code></td><td><code>&quot;infinity&quot;</code></td><td><p>A date-like string or number, or a date object.  If a string or number,
can be relative (2 weeks) or other similarly date-like (i.e. NOT &quot;potato&quot;):
ISO 8601: 2038-01-09T03:14:07Z
MediaWiki: 20380109031407
UNIX: 2147483647
SQL: 2038-01-09 03:14:07
Can also be <code>infinity</code> or infinity-like (<code>infinite</code>, <code>indefinite</code>, and <code>never</code>).
See <a href="https://phabricator.wikimedia.org/source/mediawiki-libs-Timestamp/browse/master/src/ConvertibleTimestamp.php;4e53b859a9580c55958078f46dd4f3a44d0fcaa0$57-109?as=source&amp;blame=off">https://phabricator.wikimedia.org/source/mediawiki-libs-Timestamp/browse/master/src/ConvertibleTimestamp.php;4e53b859a9580c55958078f46dd4f3a44d0fcaa0$57-109?as=source&amp;blame=off</a></p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setWatchlistExpiry"></a>

##### page.setWatchlistExpiry([watchlistExpiry])
Set a watchlist expiry. setWatchlist can mostly handle this by
itself, so this is here largely for completeness and compatibility
with the full suite of options.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[watchlistExpiry]</td><td><code>string</code> | <code>number</code> | <code><a href="#Morebits.date">date</a></code> | <code>Date</code></td><td><code>&quot;infinity&quot;</code></td><td><p>A date-like string or number, or a date object.  If a string or number,
can be relative (2 weeks) or other similarly date-like (i.e. NOT &quot;potato&quot;):
ISO 8601: 2038-01-09T03:14:07Z
MediaWiki: 20380109031407
UNIX: 2147483647
SQL: 2038-01-09 03:14:07
Can also be <code>infinity</code> or infinity-like (<code>infinite</code>, <code>indefinite</code>, and <code>never</code>).
See <a href="https://phabricator.wikimedia.org/source/mediawiki-libs-Timestamp/browse/master/src/ConvertibleTimestamp.php;4e53b859a9580c55958078f46dd4f3a44d0fcaa0$57-109?as=source&amp;blame=off">https://phabricator.wikimedia.org/source/mediawiki-libs-Timestamp/browse/master/src/ConvertibleTimestamp.php;4e53b859a9580c55958078f46dd4f3a44d0fcaa0$57-109?as=source&amp;blame=off</a></p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setWatchlistFromPreferences"></a>

##### <del>page.setWatchlistFromPreferences([watchlistOption])</del>
***Deprecated***

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[watchlistOption]</td><td><code>boolean</code></td><td><code>false</code></td><td><ul>
<li><code>True</code>: page watchlist status will be set based on the user&#39;s
preference settings when <code>save()</code> is called.</li>
<li><code>False</code>: watchlist status of the page will not be changed.</li>
</ul>
<p>Watchlist notes:</p>
<ol>
<li>The MediaWiki API value of &#39;unwatch&#39;, which explicitly removes
the page from the user&#39;s watchlist, is not used.</li>
<li>If both <code>setWatchlist()</code> and <code>setWatchlistFromPreferences()</code> are
called, the last call takes priority.</li>
<li>Twinkle modules should use the appropriate preference to set the watchlist options.</li>
<li>Most Twinkle modules use <code>setWatchlist()</code>. <code>setWatchlistFromPreferences()</code>
is only needed for the few Twinkle watchlist preferences that
accept a string value of <code>default</code>.</li>
</ol>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setFollowRedirect"></a>

##### page.setFollowRedirect([followRedirect], [followCrossNsRedirect])
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[followRedirect]</td><td><code>boolean</code></td><td><code>false</code></td><td><ul>
<li><code>true</code>: a maximum of one redirect will be followed. In the event
of a redirect, a message is displayed to the user and the redirect
target can be retrieved with getPageName().</li>
<li><code>false</code>: (default) the requested pageName will be used without regard to any redirect.</li>
</ul>
</td>
    </tr><tr>
    <td>[followCrossNsRedirect]</td><td><code>boolean</code></td><td><code>true</code></td><td><p>Not applicable if <code>followRedirect</code> is not set true.</p>
<ul>
<li><code>true</code>: (default) follow redirect even if it is a cross-namespace redirect</li>
<li><code>false</code>: don&#39;t follow redirect if it is cross-namespace, edit the redirect itself.</li>
</ul>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setLookupNonRedirectCreator"></a>

##### page.setLookupNonRedirectCreator(flag)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>flag</td><td><code>boolean</code></td><td><p>If set true, the author and timestamp of
the first non-redirect version of the page is retrieved.</p>
<p>Warning:</p>
<ol>
<li>If there are no revisions among the first 50 that are
non-redirects, or if there are less 50 revisions and all are
redirects, the original creation is retrived.</li>
<li>Revisions that the user is not privileged to access
(revdeled/suppressed) will be treated as non-redirects.</li>
<li>Must not be used when the page has a non-wikitext contentmodel
such as Modulespace Lua or user JavaScript/CSS.</li>
</ol>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setMoveDestination"></a>

##### page.setMoveDestination(destination)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>destination</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setMoveTalkPage"></a>

##### page.setMoveTalkPage(flag)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>flag</td><td><code>boolean</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setMoveSubpages"></a>

##### page.setMoveSubpages(flag)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>flag</td><td><code>boolean</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setMoveSuppressRedirect"></a>

##### page.setMoveSuppressRedirect(flag)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>flag</td><td><code>boolean</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+setEditProtection"></a>

##### page.setEditProtection(level, [expiry])
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>level</td><td><code>string</code></td><td></td><td><p>The right required for the specific action
e.g. autoconfirmed, sysop, templateeditor, extendedconfirmed
(enWiki-only).</p>
</td>
    </tr><tr>
    <td>[expiry]</td><td><code>string</code></td><td><code>&quot;infinity&quot;</code></td><td></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+getCurrentID"></a>

##### page.getCurrentID() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - The current revision ID of the page  
<a name="Morebits.wiki.page+getRevisionUser"></a>

##### page.getRevisionUser() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - Last editor of the page  
<a name="Morebits.wiki.page+getLastEditTime"></a>

##### page.getLastEditTime() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - ISO 8601 timestamp at which the page was last edited.  
<a name="Morebits.wiki.page+setCallbackParameters"></a>

##### page.setCallbackParameters(callbackParameters)
Define an object for use in a callback function.

`callbackParameters` is for use by the caller only. The parameters
allow a caller to pass the proper context into its callback
function.  Callers must ensure that any changes to the
callbackParameters object within a `load()` callback still permit a
proper re-entry into the `load()` callback if an edit conflict is
detected upon calling `save()`.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>callbackParameters</td><td><code>object</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+getCallbackParameters"></a>

##### page.getCallbackParameters() ⇒ <code>object</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>object</code> - - The object previously set by `setCallbackParameters()`.  
<a name="Morebits.wiki.page+setStatusElement"></a>

##### page.setStatusElement(statusElement)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>statusElement</td><td><code><a href="#Morebits.status">status</a></code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+getStatusElement"></a>

##### page.getStatusElement() ⇒ [<code>status</code>](#Morebits.status)
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: [<code>status</code>](#Morebits.status) - Status element created by the constructor.  
<a name="Morebits.wiki.page+setFlaggedRevs"></a>

##### page.setFlaggedRevs(level, [expiry])
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>level</td><td><code>string</code></td><td></td><td><p>The right required for edits not to require
review. Possible options: none, autoconfirmed, review (not on enWiki).</p>
</td>
    </tr><tr>
    <td>[expiry]</td><td><code>string</code></td><td><code>&quot;infinity&quot;</code></td><td></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+exists"></a>

##### page.exists() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>boolean</code> - True if the page existed on the wiki when it was last loaded.  
<a name="Morebits.wiki.page+getPageID"></a>

##### page.getPageID() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - Page ID of the page loaded. 0 if the page doesn't
exist.  
<a name="Morebits.wiki.page+getContentModel"></a>

##### page.getContentModel() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - - Content model of the page.  Possible values
include (but may not be limited to): `wikitext`, `javascript`,
`css`, `json`, `Scribunto`, `sanitized-css`, `MassMessageListContent`.
Also gettable via `mw.config.get('wgPageContentModel')`.  
<a name="Morebits.wiki.page+getWatched"></a>

##### page.getWatched() ⇒ <code>boolean</code> \| <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>boolean</code> \| <code>string</code> - - Watched status of the page. Boolean
unless it's being watched temporarily, in which case returns the
expiry string.  
<a name="Morebits.wiki.page+getLoadTime"></a>

##### page.getLoadTime() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - ISO 8601 timestamp at which the page was last loaded.  
<a name="Morebits.wiki.page+getCreator"></a>

##### page.getCreator() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - The user who created the page following `lookupCreation()`.  
<a name="Morebits.wiki.page+getCreationTimestamp"></a>

##### page.getCreationTimestamp() ⇒ <code>string</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>string</code> - The ISOString timestamp of page creation following `lookupCreation()`.  
<a name="Morebits.wiki.page+canEdit"></a>

##### page.canEdit() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>boolean</code> - whether or not you can edit the page  
<a name="Morebits.wiki.page+lookupCreation"></a>

##### page.lookupCreation(onSuccess, [onFailure])
Retrieves the username of the user who created the page as well as
the timestamp of creation.  The username can be retrieved using the
`getCreator()` function; the timestamp can be retrieved using the
`getCreationTimestamp()` function.
Prior to June 2019 known as `lookupCreator()`.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>onSuccess</td><td><code>function</code></td><td><p>Callback function to be called when
the username and timestamp are found within the callback.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function to be called when
the lookup fails</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+revert"></a>

##### page.revert([onSuccess], [onFailure])
Reverts a page to `revertOldID` set by `setOldID`.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function to run on success.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function to run on failure.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+move"></a>

##### page.move([onSuccess], [onFailure])
Moves a page to another title.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function to run on success.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function to run on failure.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+patrol"></a>

##### page.patrol()
Marks the page as patrolled, using `rcid` (if available) or `revid`.

Patrolling as such doesn't need to rely on loading the page in
question; simply passing a revid to the API is sufficient, so in
those cases just using [api](#Morebits.wiki.api) is probably preferable.

No error handling since we don't actually care about the errors.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<a name="Morebits.wiki.page+triage"></a>

##### page.triage()
Marks the page as reviewed by the PageTriage extension.

Will, by it's nature, mark as patrolled as well. Falls back to
patrolling if not in an appropriate namespace.

Doesn't inherently rely on loading the page in question; simply
passing a `pageid` to the API is sufficient, so in those cases just
using [api](#Morebits.wiki.api) is probably preferable.

Will first check if the page is queued via
[fnProcessTriageList](Morebits.wiki.page~fnProcessTriageList).

No error handling since we don't actually care about the errors.

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**See**: [https://www.mediawiki.org/wiki/Extension:PageTriage](https://www.mediawiki.org/wiki/Extension:PageTriage) Referred to as "review" on-wiki.  
<a name="Morebits.wiki.page+deletePage"></a>

##### page.deletePage([onSuccess], [onFailure])
Deletes a page (for admins only).

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function to run on success.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function to run on failure.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+undeletePage"></a>

##### page.undeletePage([onSuccess], [onFailure])
Undeletes a page (for admins only).

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function to run on success.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function to run on failure.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+protect"></a>

##### page.protect([onSuccess], [onFailure])
Protects a page (for admins only).

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td><td><p>Callback function to run on success.</p>
</td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td><td><p>Callback function to run on failure.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page+stabilize"></a>

##### page.stabilize([onSuccess], [onFailure])
Apply FlaggedRevs protection settings.  Only works on wikis where
the extension is installed (`$wgFlaggedRevsProtection = true`
i.e. where FlaggedRevs settings appear on the "protect" tab).

**Kind**: instance method of [<code>page</code>](#Morebits.wiki.page)  
**See**: [https://www.mediawiki.org/wiki/Extension:FlaggedRevs](https://www.mediawiki.org/wiki/Extension:FlaggedRevs)
Referred to as "pending changes" on-wiki.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[onSuccess]</td><td><code>function</code></td>
    </tr><tr>
    <td>[onFailure]</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page..fnCanUseMwUserToken"></a>

##### page~fnCanUseMwUserToken([action]) ⇒ <code>boolean</code>
Determines whether we can save an API call by using the csrf token
sent with the page HTML, or whether we need to ask the server for
more info (e.g. protection or watchlist expiry).

Currently used for `append`, `prepend`, `newSection`, `move`,
`stabilize`, `deletePage`, and `undeletePage`. Not used for
`protect` since it always needs to request protection status.

**Kind**: inner method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[action]</td><td><code>string</code></td><td><code>&quot;edit&quot;</code></td><td><p>The action being undertaken, e.g.
&quot;edit&quot; or &quot;delete&quot;. In practice, only &quot;edit&quot; or &quot;notedit&quot; matters.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page..fnNeedTokenInfoQuery"></a>

##### page~fnNeedTokenInfoQuery(action) ⇒ <code>object</code>
When functions can't use
[fnCanUseMwUserToken](#Morebits.wiki.page..fnCanUseMwUserToken)
or require checking protection or watched status, maintain the query
in one place. Used for [delete](#Morebits.wiki.page+deletePage),
[undelete](#Morebits.wiki.page+undeletePage),
{@link* Morebits.wiki.page#protect|protect},
[stabilize](#Morebits.wiki.page+stabilize),
and [move](#Morebits.wiki.page+move)
(basically, just not [load](#Morebits.wiki.page+load)).

**Kind**: inner method of [<code>page</code>](#Morebits.wiki.page)  
**Returns**: <code>object</code> - Appropriate query.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>action</td><td><code>string</code></td><td><p>The action being undertaken, e.g. &quot;edit&quot; or
&quot;delete&quot;.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page..fnApplyWatchlistExpiry"></a>

##### page~fnApplyWatchlistExpiry() ⇒ <code>boolean</code>
Determine whether we should provide a watchlist expiry.  Will not
do so if the page is currently permanently watched, or the current
expiry is *after* the new, provided expiry.  Only handles strings
recognized by [date](#Morebits.date) or relative timeframes with
unit it can process.  Relies on the fact that fnCanUseMwUserToken
requires page loading if a watchlistexpiry is provided, so we are
ensured of knowing the watch status by the use of this.

**Kind**: inner method of [<code>page</code>](#Morebits.wiki.page)  
<a name="Morebits.wiki.page..fnPreflightChecks"></a>

##### page~fnPreflightChecks(action, onFailure) ⇒ <code>boolean</code>
Common checks for action methods. Used for move, undelete, delete,
protect, stabilize.

**Kind**: inner method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>action</td><td><code>string</code></td><td><p>The action being checked.</p>
</td>
    </tr><tr>
    <td>onFailure</td><td><code>string</code></td><td><p>Failure callback.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.page..fnProcessChecks"></a>

##### page~fnProcessChecks(action, onFailure, response) ⇒ <code>boolean</code>
Common checks for fnProcess functions (`fnProcessDelete`, `fnProcessMove`, etc.
Used for move, undelete, delete, protect, stabilize.

**Kind**: inner method of [<code>page</code>](#Morebits.wiki.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>action</td><td><code>string</code></td><td><p>The action being checked.</p>
</td>
    </tr><tr>
    <td>onFailure</td><td><code>string</code></td><td><p>Failure callback.</p>
</td>
    </tr><tr>
    <td>response</td><td><code>string</code></td><td><p>The response document from the API call.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.preview"></a>

#### wiki.preview
**Kind**: static class of [<code>wiki</code>](#Morebits.wiki)  

* [.preview](#Morebits.wiki.preview)
    * [new Morebits.wiki.preview(previewbox)](#new_Morebits.wiki.preview_new)
    * [.beginRender(wikitext, [pageTitle], [sectionTitle])](#Morebits.wiki.preview+beginRender) ⇒ <code>jQuery.promise</code>
    * [.closePreview()](#Morebits.wiki.preview+closePreview)

<a name="new_Morebits.wiki.preview_new"></a>

##### new Morebits.wiki.preview(previewbox)
Use the API to parse a fragment of wikitext and render it as HTML.

The suggested implementation pattern (in [simpleWindow](#Morebits.simpleWindow) and
[quickForm](#Morebits.quickForm) situations) is to construct a
`Morebits.wiki.preview` object after rendering a `Morebits.quickForm`, and
bind the object to an arbitrary property of the form (e.g. |previewer|).
For an example, see twinklewarn.js.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>previewbox</td><td><code>HTMLElement</code></td><td><p>The element that will contain the rendered HTML,
usually a <div> element.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.preview+beginRender"></a>

##### preview.beginRender(wikitext, [pageTitle], [sectionTitle]) ⇒ <code>jQuery.promise</code>
Displays the preview box, and begins an asynchronous attempt
to render the specified wikitext.

**Kind**: instance method of [<code>preview</code>](#Morebits.wiki.preview)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>wikitext</td><td><code>string</code></td><td><p>Wikitext to render; most things should work, including <code>subst:</code> and <code>~~~~</code>.</p>
</td>
    </tr><tr>
    <td>[pageTitle]</td><td><code>string</code></td><td><p>Optional parameter for the page this should be rendered as being on, if omitted it is taken as the current page.</p>
</td>
    </tr><tr>
    <td>[sectionTitle]</td><td><code>string</code></td><td><p>If provided, render the text as a new section using this as the title.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wiki.preview+closePreview"></a>

##### preview.closePreview()
Hides the preview box and clears it.

**Kind**: instance method of [<code>preview</code>](#Morebits.wiki.preview)  
<a name="Morebits.wiki.numberOfActionsLeft"></a>

#### wiki.numberOfActionsLeft : <code>number</code>
**Kind**: static property of [<code>wiki</code>](#Morebits.wiki)  
<a name="Morebits.wiki.nbrOfCheckpointsLeft"></a>

#### wiki.nbrOfCheckpointsLeft : <code>number</code>
**Kind**: static property of [<code>wiki</code>](#Morebits.wiki)  
<a name="Morebits.wiki.isPageRedirect"></a>

#### <del>wiki.isPageRedirect() ⇒ <code>boolean</code></del>
***Deprecated***

**Kind**: static method of [<code>wiki</code>](#Morebits.wiki)  
<a name="Morebits.wiki.actionCompleted"></a>

#### wiki.actionCompleted()
Display message and/or redirect to page upon completion of tasks.

Every call to Morebits.wiki.api.post() results in the dispatch of an
asynchronous callback. Each callback can in turn make an additional call to
Morebits.wiki.api.post() to continue a processing sequence. At the
conclusion of the final callback of a processing sequence, it is not
possible to simply return to the original caller because there is no call
stack leading back to the original context. Instead,
Morebits.wiki.actionCompleted.event() is called to display the result to
the user and to perform an optional page redirect.

The determination of when to call Morebits.wiki.actionCompleted.event() is
managed through the globals Morebits.wiki.numberOfActionsLeft and
Morebits.wiki.nbrOfCheckpointsLeft. Morebits.wiki.numberOfActionsLeft is
incremented at the start of every Morebits.wiki.api call and decremented
after the completion of a callback function. If a callback function does
not create a new Morebits.wiki.api object before exiting, it is the final
step in the processing chain and Morebits.wiki.actionCompleted.event() will
then be called.

Optionally, callers may use Morebits.wiki.addCheckpoint() to indicate that
processing is not complete upon the conclusion of the final callback
function.  This is used for batch operations. The end of a batch is
signaled by calling Morebits.wiki.removeCheckpoint().

**Kind**: static method of [<code>wiki</code>](#Morebits.wiki)  

* [.actionCompleted()](#Morebits.wiki.actionCompleted)
    * [.timeOut](#Morebits.wiki.actionCompleted.timeOut)
    * [.redirect](#Morebits.wiki.actionCompleted.redirect)
    * [.notice](#Morebits.wiki.actionCompleted.notice)
    * [.event()](#Morebits.wiki.actionCompleted.event)

<a name="Morebits.wiki.actionCompleted.timeOut"></a>

##### actionCompleted.timeOut
**Kind**: static property of [<code>actionCompleted</code>](#Morebits.wiki.actionCompleted)  
<a name="Morebits.wiki.actionCompleted.redirect"></a>

##### actionCompleted.redirect
**Kind**: static property of [<code>actionCompleted</code>](#Morebits.wiki.actionCompleted)  
<a name="Morebits.wiki.actionCompleted.notice"></a>

##### actionCompleted.notice
**Kind**: static property of [<code>actionCompleted</code>](#Morebits.wiki.actionCompleted)  
<a name="Morebits.wiki.actionCompleted.event"></a>

##### actionCompleted.event()
**Kind**: static method of [<code>actionCompleted</code>](#Morebits.wiki.actionCompleted)  
<a name="Morebits.wiki.addCheckpoint"></a>

#### wiki.addCheckpoint()
**Kind**: static method of [<code>wiki</code>](#Morebits.wiki)  
<a name="Morebits.wiki.removeCheckpoint"></a>

#### wiki.removeCheckpoint()
**Kind**: static method of [<code>wiki</code>](#Morebits.wiki)  
<a name="Morebits.wikitext"></a>

### Morebits.wikitext : <code>object</code>
Wikitext manipulation.

**Kind**: static namespace of [<code>Morebits</code>](#Morebits)  

* [.wikitext](#Morebits.wikitext) : <code>object</code>
    * [.page](#Morebits.wikitext.page)
        * [new Morebits.wikitext.page(text)](#new_Morebits.wikitext.page_new)
        * [.removeLink(link_target)](#Morebits.wikitext.page+removeLink) ⇒ [<code>page</code>](#Morebits.wikitext.page)
        * [.commentOutImage(image, [reason])](#Morebits.wikitext.page+commentOutImage) ⇒ [<code>page</code>](#Morebits.wikitext.page)
        * [.addToImageComment(image, data)](#Morebits.wikitext.page+addToImageComment) ⇒ [<code>page</code>](#Morebits.wikitext.page)
        * [.removeTemplate(template)](#Morebits.wikitext.page+removeTemplate) ⇒ [<code>page</code>](#Morebits.wikitext.page)
        * [.insertAfterTemplates(tag, regex, [flags], [preRegex])](#Morebits.wikitext.page+insertAfterTemplates) ⇒ [<code>page</code>](#Morebits.wikitext.page)
        * [.getText()](#Morebits.wikitext.page+getText) ⇒ <code>string</code>
    * [.parseTemplate(text, [start])](#Morebits.wikitext.parseTemplate) ⇒ <code>object</code>
        * [~findParam([final])](#Morebits.wikitext.parseTemplate..findParam)

<a name="Morebits.wikitext.page"></a>

#### wikitext.page
**Kind**: static class of [<code>wikitext</code>](#Morebits.wikitext)  

* [.page](#Morebits.wikitext.page)
    * [new Morebits.wikitext.page(text)](#new_Morebits.wikitext.page_new)
    * [.removeLink(link_target)](#Morebits.wikitext.page+removeLink) ⇒ [<code>page</code>](#Morebits.wikitext.page)
    * [.commentOutImage(image, [reason])](#Morebits.wikitext.page+commentOutImage) ⇒ [<code>page</code>](#Morebits.wikitext.page)
    * [.addToImageComment(image, data)](#Morebits.wikitext.page+addToImageComment) ⇒ [<code>page</code>](#Morebits.wikitext.page)
    * [.removeTemplate(template)](#Morebits.wikitext.page+removeTemplate) ⇒ [<code>page</code>](#Morebits.wikitext.page)
    * [.insertAfterTemplates(tag, regex, [flags], [preRegex])](#Morebits.wikitext.page+insertAfterTemplates) ⇒ [<code>page</code>](#Morebits.wikitext.page)
    * [.getText()](#Morebits.wikitext.page+getText) ⇒ <code>string</code>

<a name="new_Morebits.wikitext.page_new"></a>

##### new Morebits.wikitext.page(text)
Adjust and manipulate the wikitext of a page.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td><p>Wikitext to be manipulated.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wikitext.page+removeLink"></a>

##### page.removeLink(link_target) ⇒ [<code>page</code>](#Morebits.wikitext.page)
Removes links to `link_target` from the page text.

**Kind**: instance method of [<code>page</code>](#Morebits.wikitext.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>link_target</td><td><code>string</code></td>
    </tr>  </tbody>
</table>

<a name="Morebits.wikitext.page+commentOutImage"></a>

##### page.commentOutImage(image, [reason]) ⇒ [<code>page</code>](#Morebits.wikitext.page)
Comments out images from page text; if used in a gallery, deletes the whole line.
If used as a template argument (not necessarily with `File:` prefix), the template parameter is commented out.

**Kind**: instance method of [<code>page</code>](#Morebits.wikitext.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>image</td><td><code>string</code></td><td><p>Image name without <code>File:</code> prefix.</p>
</td>
    </tr><tr>
    <td>[reason]</td><td><code>string</code></td><td><p>Reason to be included in comment, alongside the commented-out image.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wikitext.page+addToImageComment"></a>

##### page.addToImageComment(image, data) ⇒ [<code>page</code>](#Morebits.wikitext.page)
Converts uses of [[File:`image`]] to [[File:`image`|`data`]].

**Kind**: instance method of [<code>page</code>](#Morebits.wikitext.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>image</td><td><code>string</code></td><td><p>Image name without File: prefix.</p>
</td>
    </tr><tr>
    <td>data</td><td><code>string</code></td><td><p>The display options.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wikitext.page+removeTemplate"></a>

##### page.removeTemplate(template) ⇒ [<code>page</code>](#Morebits.wikitext.page)
Remove all transclusions of a template from page text.

**Kind**: instance method of [<code>page</code>](#Morebits.wikitext.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>template</td><td><code>string</code></td><td><p>Page name whose transclusions are to be removed,
include namespace prefix only if not in template namespace.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wikitext.page+insertAfterTemplates"></a>

##### page.insertAfterTemplates(tag, regex, [flags], [preRegex]) ⇒ [<code>page</code>](#Morebits.wikitext.page)
Smartly insert a tag atop page text but after specified templates,
such as hatnotes, short description, or deletion and protection templates.
Notably, does *not* insert a newline after the tag.

**Kind**: instance method of [<code>page</code>](#Morebits.wikitext.page)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>tag</td><td><code>string</code></td><td></td><td><p>The tag to be inserted.</p>
</td>
    </tr><tr>
    <td>regex</td><td><code>string</code> | <code>Array.&lt;string&gt;</code></td><td></td><td><p>Templates after which to insert tag,
given as either as a (regex-valid) string or an array to be joined by pipes.</p>
</td>
    </tr><tr>
    <td>[flags]</td><td><code>string</code></td><td><code>&quot;i&quot;</code></td><td><p>Regex flags to apply.  <code>&#39;&#39;</code> to provide no flags;
other falsey values will default to <code>i</code>.</p>
</td>
    </tr><tr>
    <td>[preRegex]</td><td><code>string</code> | <code>Array.&lt;string&gt;</code></td><td></td><td><p>Optional regex string or array to match
before any template matches (i.e. before <code>{{</code>), such as html comments.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wikitext.page+getText"></a>

##### page.getText() ⇒ <code>string</code>
Get the manipulated wikitext.

**Kind**: instance method of [<code>page</code>](#Morebits.wikitext.page)  
<a name="Morebits.wikitext.parseTemplate"></a>

#### wikitext.parseTemplate(text, [start]) ⇒ <code>object</code>
Get the value of every parameter found in the wikitext of a given template.

**Kind**: static method of [<code>wikitext</code>](#Morebits.wikitext)  
**Returns**: <code>object</code> - `{name: templateName, parameters: {key: value}}`.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>string</code></td><td></td><td><p>Wikitext containing a template.</p>
</td>
    </tr><tr>
    <td>[start]</td><td><code>number</code></td><td><code>0</code></td><td><p>Index noting where in the text the template begins.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.wikitext.parseTemplate..findParam"></a>

##### parseTemplate~findParam([final])
Function to handle finding parameter values.

**Kind**: inner method of [<code>parseTemplate</code>](#Morebits.wikitext.parseTemplate)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[final]</td><td><code>boolean</code></td><td><code>false</code></td><td><p>Whether this is the final
parameter and we need to remove the trailing <code>}}</code>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.userIsInGroup"></a>

### Morebits.userIsInGroup(group) ⇒ <code>boolean</code>
Simple helper function to see what groups a user might belong.

**Kind**: static method of [<code>Morebits</code>](#Morebits)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>group</td><td><code>string</code></td><td><p>e.g. <code>sysop</code>, <code>extendedconfirmed</code>, etc.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.sanitizeIPv6"></a>

### <del>Morebits.sanitizeIPv6(address) ⇒ <code>string</code></del>
***Deprecated***

Deprecated as of February 2021, use [sanitizeIPv6](#Morebits.ip.sanitizeIPv6).

**Kind**: static method of [<code>Morebits</code>](#Morebits)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>address</td><td><code>string</code></td><td><p>The IPv6 address, with or without CIDR.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.isPageRedirect"></a>

### Morebits.isPageRedirect() ⇒ <code>boolean</code>
Determines whether the current page is a redirect or soft redirect. Fails
to detect soft redirects on edit, history, etc. pages.  Will attempt to
detect [[Module:Redirect for discussion]], with the same failure points.

**Kind**: static method of [<code>Morebits</code>](#Morebits)  
<a name="Morebits.pageNameRegex"></a>

### Morebits.pageNameRegex(pageName) ⇒ <code>string</code>
Create a string for use in regex matching a page name.  Accounts for
leading character's capitalization, underscores as spaces, and special
characters being escaped.  See also [namespaceRegex](#Morebits.namespaceRegex).

**Kind**: static method of [<code>Morebits</code>](#Morebits)  
**Returns**: <code>string</code> - - For a page name `Foo bar`, returns the string `[Ff]oo[_ ]bar`.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>pageName</td><td><code>string</code></td><td><p>Page name without namespace.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.namespaceRegex"></a>

### Morebits.namespaceRegex(namespaces) ⇒ <code>string</code>
Create a string for use in regex matching all namespace aliases, regardless
of the capitalization and underscores/spaces.  Doesn't include the optional
leading `:`, but if there's more than one item, wraps the list in a
non-capturing group.  This means you can do `Morebits.namespaceRegex([4]) +
':' + Morebits.pageNameRegex('Twinkle')` to match a full page.  Uses
[pageNameRegex](#Morebits.pageNameRegex).

**Kind**: static method of [<code>Morebits</code>](#Morebits)  
**Returns**: <code>string</code> - - Regex-suitable string of all namespace aliases.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>namespaces</td><td><code>Array.&lt;number&gt;</code></td><td><p>Array of namespace numbers.  Unused/invalid
namespace numbers are silently discarded.</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
// returns '(?:[Ff][Ii][Ll][Ee]|[Ii][Mm][Aa][Gg][Ee])'
Morebits.namespaceRegex([6])
```
<a name="Morebits.htmlNode"></a>

### Morebits.htmlNode(type, content, [color]) ⇒ <code>HTMLElement</code>
Simple helper function to create a simple node.

**Kind**: static method of [<code>Morebits</code>](#Morebits)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>type</td><td><code>string</code></td><td><p>Type of HTML element.</p>
</td>
    </tr><tr>
    <td>content</td><td><code>string</code></td><td><p>Text content.</p>
</td>
    </tr><tr>
    <td>[color]</td><td><code>string</code></td><td><p>Font color.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Morebits.checkboxShiftClickSupport"></a>

### Morebits.checkboxShiftClickSupport(jQuerySelector, jQueryContext)
Add shift-click support for checkboxes. The wikibits version
(`window.addCheckboxClickHandlers`) has some restrictions, and doesn't work
with checkboxes inside a sortable table, so let's build our own.

**Kind**: static method of [<code>Morebits</code>](#Morebits)  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>jQuerySelector</td>
    </tr><tr>
    <td>jQueryContext</td>
    </tr>  </tbody>
</table>

**documentation generated on Tue Mar 09 2021**
