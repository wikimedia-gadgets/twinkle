/**
 * Type definitions for mediawiki modules
 */

type title = string | mw.Title
type namespaceId = number

declare namespace mw {

	class Api {
		constructor(options?: any)
		abort(): void
		get(parameters: any, ajaxOptions?: JQuery.AjaxSettings): JQuery.Promise<any>
		post(parameters: any, ajaxOptions?: JQuery.AjaxSettings): JQuery.Promise<any>

		preprocessParameters( parameters: any, useUS: boolean ): void

		// index.js
		ajax(parameters: any, ajaxOptions?: JQuery.AjaxSettings): JQuery.Promise<any>
		postWithToken(tokenType: string, params: any, ajaxOptions?: JQuery.AjaxSettings): JQuery.Promise<any>
		getToken( type: string, additionalParams?: any | string ): JQuery.Promise<string>
		badToken(type: string): void
		getErrorMessage(data: any): JQuery

		// edit.js
		postWithEditToken(params: any, ajaxOptions?: JQuery.AjaxSettings): JQuery.Promise<any>
		getEditToken(): JQuery.Promise<string>
		create(title: title, params: any, content: string): JQuery.Promise<any>
		edit(title: title, transform: (data: {
			timestamp: string,
			content: string
		}) => any | string): JQuery.Promise<any>
		newSection(title: title, header: string, message: string, additionalParams?: any): JQuery.Promise<any>

		// user.js
		getUserInfo(): JQuery.Promise<{
			groups: string[],
			rights: string[]
		}>
		assertCurrentUser(query: any): JQuery.Promise<{
			assert: 'anon' | 'user'
			assertUser: string
		}>

		// options.js
		saveOption(name: string, value: string): JQuery.Promise<any>
		saveOptions(options: {[optionName: string]: string}): JQuery.Promise<any>

		// watch.js
		watch(pages: title | title[]): JQuery.Promise<{
			watch: {title: string, watched: boolean} | {title: string, watched: boolean}[]
		}>
		unwatch(pages: title | title[]): JQuery.Promise<{
			watch: {title: string, watched: boolean} | {title: string, watched: boolean}[]
		}>

		// parse.js
		parse(content: string | Title, additionalParams?: any): JQuery.Promise<any>

		// messages.js
		getMessages(messages: string[], options?: any): JQuery.Promise<any>
		loadMessages(messages: string[], options?: any): JQuery.Promise<any>
		loadMessagesIfMissing(messages: string[], options?: any): JQuery.Promise<any>


		// TODO
		// category.js
		// login.js
		// rollback.js
		// upload.js

	}

	class Title {
		constructor(title: string, namespace?: namespaceId)
		static newFromText(title: string, namespace?: namespaceId): mw.Title | null
		static makeTitle(title: string, namespace?: namespaceId): mw.Title | null
		static newFromUserInput(title: string, namespace?: namespaceId, options?: any): mw.Title
		static newFromFileName(uncleanName: string): mw.Title
		static newFromImg(img: HTMLElement | JQuery): mw.Title
		static isTalkNamespace(namespaceId: namespaceId): boolean
		static wantSignatureNamespace(namespaceId: namespaceId): boolean
		static exists(title: title): boolean | null
		static exist: {
		    pages: {[title: string]: boolean},
		    set: (titles: string | string[], state?: boolean) => boolean
		}
		static normalizeExtension(extension: string): string
		static phpCharToUpper(chr: string): string

		getNamespaceId(): namespaceId
		getNamespacePrefix(): string
		getName(): string
		getNameText(): string
		getExtension(): string | null
		getDotExtension(): string
		getMain(): string
		getMainText(): string
		getPrefixedDb(): string
		getPrefixedText(): string
		getRelativeText(namespace: namespaceId): string
		getFragment(): string | null
		getUrl(params: any): string
		isTalkPage(): boolean
		getTalkPage(): Title | null
		getSubjectPage(): Title | null
		canHaveTalkPage(): boolean
		exists(): boolean | null
		toString(): string
		toText(): string
	}

	namespace util {
		const $content: JQuery;
		function rawurlencode(str: string): string;
		function escapeIdForAttribute(str: string): string;
		function escapeIdForLink(str: string): string;
		function debounce(delay: number, callback: Function): (...args: any[]) => void;
		function wikiUrlencode(str: string): string;
		function getUrl(pageName: string, params?: {[param: string]: string}): string;
		function wikiScript(str: string): string;
		function addCSS(text: string): any;
		function getParamValue(param: string, url?: string): string;
		function hidePortlet(portletId: string): void;
		function isPortletVisible(portletId: string): boolean;
		function showPortlet(portletId: string): void;
		function addPortletLink(portletId: string, href: string, text: string, id?: string,
			tooltip?: string, accesskey?: string, nextnode?: string): HTMLLIElement;
		function validateEmail(mailtxt: string): boolean;
		function isIPv4Address(address: string, allowBlock?: boolean): boolean;
		function isIPv6Address(address: string, allowBlock?: boolean): boolean;
		function isIPAddress(address: string, allowBlock?: boolean): boolean;
		function parseImageUrl(url: string): {
			name: string;
			width: number | null;
			resizeUrl: (w: any) => string;
		} | null;
		function escapeRegExp(str: string): string;
	}

	namespace Map {
		function get(selection: string | string[], fallback?: any): any
		function set(selection: string | Record<string, any>, value?: any): boolean
		function exists(selection: string): boolean
	}

	namespace user {
		const options: typeof mw.Map
		const tokens: typeof mw.Map
		function generateRandomSessionId(): string
		function getPageviewToken(): string
		function getId(): number
		function getName(): string | null
		function getRegistration(): boolean | null | Date
		function isAnon(): boolean
		function sessionId(): string
		function id(): string
		function getGroups(callback?: Function): JQuery.Promise<string[]>
		function getRights(callback?: Function): JQuery.Promise<string[]>
	}

	const config: typeof mw.Map

	// Not everything is included
	namespace loader {
		/**
		 * Execute a function after one or more modules are ready.
		 *
		 * @param dependencies
		 * @param {Function} ready Callback to execute when all dependencies are
		 * ready.
		 * @param {Function} error Callback to execute if one or more dependencies
		 * failed.
		 */
		function using(dependencies: string[] | string, ready?: Function, error?: Function): JQuery.Promise<any>;

		/**
		 * Load an external script or one or more modules.
		 *
		 * @param {string|Array} modules Either the name of a module, array of modules,
		 *  or a URL of an external script or style
		 * @param {string} [type='text/javascript'] MIME type to use if calling with a URL of an
		 *  external script or style; acceptable values are "text/css" and
		 *  "text/javascript"; if no type is provided, text/javascript is assumed.
		 * @throws {Error} If type is invalid
		 */
		function load(modules: string | string[], type?: string): () => void;
		/**
		 * Get the loading state of the module.
		 * On of 'registered', 'loaded', 'loading', 'ready', 'error', or 'missing'.
		 *
		 * @param module
		 */
		function getState(module: string): string | null;
	}

	/**
	 * Loads the specified i18n message string.
	 * Shortcut for `mw.message( key, parameters... ).text()`.
	 *
	 * @param messageName i18n message name
	 */
	function msg(messageName: string | null): string;

	/**
	 * Notification
	 * @param {HTMLElement|HTMLElement[]|jQuery|string} message
	 * @param {Object} [options] See mw.notification#defaults for the defaults.
	 * @return {jQuery.Promise}
	 */
	function notify(message: string | JQuery | HTMLElement | HTMLElement[],
		options?: { tag?: string, type?: string, title?: string }): JQuery.Promise<any>;

	// Incomplete
	namespace language {
		function listToText(list: string[]): string
	}

}

