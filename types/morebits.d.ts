/**
 * Type definitions for morebits.js
 */

interface FormSubmitEvent extends Event {
	target: HTMLFormElement
}

declare namespace Morebits {

	function userIsInGroup(group: string): boolean
	const userIsSysop: boolean

	function sanitizeIPv6(address: string): string | null

	function isPageRedirect(): boolean

	const pageNameNorm: string

	function pageNameRegex(pageName: string): string

	class quickForm {
		constructor(event: ((e: FormSubmitEvent) => void), eventType?: string)
		render(): HTMLFormElement
		append(data: quickFormElementData): quickFormElement
		static getInputData(form: HTMLFormElement): Record<string, string>
		static getElements(form: HTMLFormElement, fieldName: string): HTMLElement[]
		static getCheckboxOrRadio(elementArray: HTMLInputElement[], value: string): HTMLInputElement
		static getElementContainer(element: HTMLElement): HTMLElement
		static getElementLabelObject(element: HTMLElement): HTMLElement
		static getElementLabel(element: HTMLElement): string
		static setElementLabel(element: HTMLElement): boolean
		static overrideElementLabel(element: HTMLElement, temporaryLabelText: string): boolean
		static resetElementLabel(element: HTMLElement): boolean | null
		static setElementVisibility(element: HTMLElement | JQuery | string): void
		static setElementTooltipVisibility(element: HTMLElement | JQuery | string, visibility?: boolean): void
		static element: typeof quickFormElement
	}

	namespace string {
		function toUpperCaseFirstChar(str: string): string
		function toLowerCaseFirstChar(str: string): string
		function splitWeightedByKeys(str: string, start: string, end: string, skiplist: string | string[]): string[]
		function formatReasonText(str: string): string
		function formatReasonForLog(str: string): string
		function safeReplace(string: string, pattern: string | RegExp, replacement: string): string
		function isInfinity(expiry: string): boolean
		function escapeRegExp(text: string): string
	}

	namespace array {
		function uniq<T>(arr: T[]): T[]
		function dups<T>(arr: T[]): T[]
		function chunk<T>(arr: T[], size: number): T[][]
	}

	class unbinder {
		// has some properties too but they're not supposed to be public
		unbind(prefix: string, postfix: string): void
		rebind(): string
	}

	class date extends Date {
		private _d: Date
		isValid(): boolean
		isBefore(date: Morebits.date | Date): boolean
		isAfter(date: Morebits.date | Date): boolean
		getDayName(): string
		getDayNameAbbrev(): string
		getUTCDayName(): string
		getUTCDayNameAbbrev(): string
		getMonthName(): string
		getMonthNameAbbrev(): string
		getUTCMonthName(): string
		getUTCMonthNameAbbrev(): string
		add(number: number, unit: string): Morebits.date
		subtract(number: number, unit: string): Morebits.date
		format(formatstr: string, zone: number | 'utc' | 'system'): string
		calendar(zone: number | 'utc' | 'system'): string
		monthHeaderRegex(): RegExp
		monthHeader(level?: number): string
	}

	namespace wiki {
		let numberOfActionsLeft: number
		let nbrOfCheckpointsLeft: number
		let actionCompleted: {
			(): void
			event: (() => void)
			timeout: number
			redirect: string
			notice: string
			followRedirect: boolean
		}
		function addCheckpoint(): void
		function removeCheckpoint(): void

		class api {
			constructor(currentAction: string, query: any, onSuccess?: ((apiobj: api) => any),
						statusElement?: string, onFailure?: ((apiobj: api) => any))
			responseXML: XMLDocument
			setParent(parent: any): void
			setStatusElement(statusElement: Morebits.status): void
			post(callerAjaxParameters?: JQuery.AjaxSettings): JQuery.Promise<api>
			private returnError(callerAjaxParameters: JQuery.AjaxSettings): JQuery.Promise<api>
			getStatusElement(): Morebits.status
			getErrorCode(): string
			getErrorText(): string
			getXML(): XMLDocument
			getResponse(): any
			static setApiUserAgent(ua: string): void
			static getToken(): JQuery.Promise<string>
		}

		class page {
			constructor(pageName: string, currentAction?: string)
			load(onSuccess: ((pageobj: page) => void)): void
			save(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			append(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			prepend(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			newSection(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			getPageName(): string
			getPageText(): string
			setPageText(pageText: string)
			setAppendText(appendText: string)
			setPrependText(prependText: string)
			setNewSectionText(newSectionText: string)
			setNewSectionTitle(newSectionTitle: string)
			setEditSummary(summary: string): void
			setChangeTags(tags: string | string[]): void
			setCreateOption(createOption: string): void
			setMinorEdit(minorEdit: string): void
			setBotEdit(botEdit: boolean): void
			setPageSection(pageSection: string): void
			setMaxConflictRetries(maxConflictRetries: number): void
			setMaxRetries(maxRetries: number): void
			setWatchlist(watchlistOption: string): void
			setWatchlistExpiry(watchlistExpiry: string): void
			setWatchlistFromPreferences(watchlistOption: string): void
			setFollowRedirect(followRedirect, followCrossNsRedirect: string): void
			setLookupNonRedirectCreator(flag: boolean): void
			setMoveDestination(destination: string): void
			setMoveTalkPage(flag: boolean): void
			setMoveSubpages(flag: boolean): void
			setMoveSuppressRedirect(flag: boolean): void
			setEditProtection(level: string, expiry: string): void
			setMoveProtection(level: string, expiry: string): void
			setCreateProtection(level: string, expiry: string): void
			setCascadingProtection(flag: boolean): void
			suppressProtectWarning(): void
			setOldID(oldID: string): void
			getCurrentID(): string
			getRevisionUser(): string
			getLastEditTime(): string
			setCallbackParameters(callbackParameters: any)
			getCallbackParameters(): any
			getStatusElement(): Morebits.status
			setFlaggedRevs(level: string, expiry: string)
			exists(): boolean
			getPageID(): string
			getLoadTime(): string
			getCreator(): string
			getCreationTimestamp(): string
			canEdit(): boolean
			lookupCreation(onSuccess: ((pageobj: page) => void)): void
			revert(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			move(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			patrol(): void
			triage(): void
			deletePage(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			undeletePage(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			protect(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
			stabilize(onSuccess?: ((pageobj: page) => void), onFailure?: ((pageobj: page) => void)): void
		}

		class preview {
			constructor(previewbox: HTMLElement)
			previewbox: HTMLElement
			beginRender(wikitext: string, pageTitle: string, sectionTitle: string): void
			closePreview(): void
		}

	}

	namespace wikitext {
		function parseTemplate(text: string, start: number): {name: string, parameters: {[key: string]: string}}
		class page {
			text: string
			removeLink(link_target: string)
			commentOutImage(image: string, reason: string)
			addToImageComment(image: string, data: string)
			removeTemplate(template: string)
			insertAfterTemplates(tag: string, regex: string | string[], flags: string, preRegex: string | string[])
			getText(): string
		}
	}

	class userspaceLogger {
		initialText: string
		headerLevel: number
		changeTags: string | string[]
		log(logText: string, summaryText: string): void
	}


	class status {
		textRaw: string
		text: DocumentFragment
		type: 'status' | 'info' | 'warn' | 'error'
		static init(root: HTMLElement): void
		static root: HTMLElement
		onError(handler: ((arg: any) => any)): void // XXX: check handler types
		link(): void
		unlink(): void
		codify(obj: (string | HTMLElement)[])
		update(status: string, type: 'status' | 'info' | 'warn' | 'error')
		generate(): void
		render(): void
		status(status: string)
		info(status: string)
		warn(status: string)
		error(status: string)
		static info(text: string, status: string): void
		static warn(text: string, status: string): void
		static error(text: string, status: string): void
		static actionCompleted(text: string): void
		static printUserText(comments: string, message: string)
	}

	function htmlNode(type: string, content: string, color?: string): HTMLElement
	function checkboxShiftClickSupport(jQuerySelector: string | JQuery, jQueryContext: string | JQuery)

	class batchOperation<T> {
		getStatusElement(): Morebits.status
		setPageList(pageList: T[]): void

		// Overloaded definition
		setOption(optionName: 'chunkSize', optionValue: number)
		setOption(optionName: 'preserveIndividualStatusLines', optionValue: boolean)

		run(worker: ((item: T) => any), postFinish: (() => any)): void
		workerSuccess(arg: any): void
		workerFailure(arg: any): void
	}

	class taskManager {
		taskDependencyMap: Map<Function, Function[]>
		deferreds: Map<Function, JQuery.Deferred<any>[]>
		allDeferreds: JQuery.Deferred<any>[]
		add(func: Function, deps: Function[])
		execute(): JQuery.Promise<void>
	}

	class simpleWindow {
		constructor(width: number, height: number)
		buttons: Array<any>
		height: number
		hasFooterLinks: boolean
		scriptName: string
		focus(): Morebits.simpleWindow
		close(event: Event): Morebits.simpleWindow
		display(): Morebits.simpleWindow
		setTitle(title: string): Morebits.simpleWindow
		setScriptName(name: string): Morebits.simpleWindow
		setWidth(width: number): Morebits.simpleWindow
		setHeight(height: number): Morebits.simpleWindow
		setContent(content: HTMLElement): Morebits.simpleWindow
		addContent(content: HTMLElement): Morebits.simpleWindow
		purgeContent(): Morebits.simpleWindow
		addFooterLink(text: string, wikiPage: string, prep?: boolean): Morebits.simpleWindow
		setModality(modal: boolean): Morebits.simpleWindow
		static setButtonsEnabled(enabled: boolean)
	}

}

// TypeScript's handling of nested classes is pathetic ...
declare class quickFormElement {
	constructor(data: any)
	static id: number
	append(data: quickFormElementData): quickFormElement
	render(): HTMLElement
	private compute(data: quickFormElementData): [HTMLElement, HTMLElement]
	static generateTooltip(node: HTMLElement, data: any): void
}

interface quickFormElementData {
	type?: 'input' | 'textarea' | 'submit' | 'checkbox' | 'radio' | 'select' |
		'option' | 'optgroup' | 'field' | 'dyninput' | 'hidden' | 'header' |
		'div' | 'button' | 'fragment'
	name?: string
	id?: string
	className?: string
	style?: string
	tooltip?: string
	extra?: any
	adminonly?: boolean
	label?: string | HTMLElement
	value?: string
	size?: string // for input
	multiple?: boolean // for select
	checked?: boolean
	disabled?: boolean
	event?: ((event?: Event) => void)
	list?: quickFormElementData[]
	subgroup?: quickFormElementData | quickFormElementData[]
	required?: boolean // for input, textarea
	readonly?: boolean // for input, textarea
	maxlength?: number // for input, textarea
}

