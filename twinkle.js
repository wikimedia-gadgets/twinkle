/**
 * +-------------------------------------------------------------------------+
 * |                  === WARNING: GLOBAL GADGET FILE ===                    |
 * |                Changes to this page affect many users.                  |
 * |           Please discuss changes at [[WT:TW]] before editing.           |
 * +-------------------------------------------------------------------------+
 *
 * Imported from github [https://github.com/wikimedia-gadgets/twinkle].
 * All changes should be made in the repository, otherwise they will be lost.
 *
 * ----------
 *
 * This is AzaToth's Twinkle, the popular script sidekick for newbies, admins, and
 * every Wikipedian in between. Visit [[WP:TW]] for more information.
 */
// <nowiki>

/* global Morebits */

(function (window, document, $) { // Wrap with anonymous function

// Check if account is experienced enough to use Twinkle
if (!Morebits.userIsInGroup('autoconfirmed') && !Morebits.userIsInGroup('confirmed')) {
	return;
}

var Twinkle = {};
window.Twinkle = Twinkle;  // allow global access

Twinkle.initCallbacks = [];
/**
 * Adds a callback to execute when Twinkle has loaded.
 * @param {function} func
 * @param {string} [name] - name of module used to check if is disabled.
 * If name is not given, module is loaded unconditionally.
 */
Twinkle.addInitCallback = function twinkleAddInitCallback(func, name) {
	Twinkle.initCallbacks.push({ func: func, name: name });
};

Twinkle.defaultConfig = {};
/**
 * This holds the default set of preferences used by Twinkle.
 * It is important that all new preferences added here, especially admin-only ones, are also added to
 * |Twinkle.config.sections| in twinkleconfig.js, so they are configurable via the Twinkle preferences panel.
 * For help on the actual preferences, see the comments in twinkleconfig.js.
 *
 * Formerly Twinkle.defaultConfig.twinkle and Twinkle.defaultConfig.friendly
 */
Twinkle.defaultConfig = {
	// General
	userTalkPageMode: 'tab',
	dialogLargeFont: false,
	disabledModules: [],
	disabledSysopModules: [],

	// ARV
	spiWatchReport: 'yes',

	// Block
	defaultToBlock64: false,
	defaultToPartialBlocks: false,
	blankTalkpageOnIndefBlock: false,

	// Fluff (revert and rollback)
	autoMenuAfterRollback: false,
	openTalkPage: [ 'agf', 'norm', 'vand' ],
	openTalkPageOnAutoRevert: false,
	rollbackInPlace: false,
	markRevertedPagesAsMinor: [ 'vand' ],
	watchRevertedPages: [ 'agf', 'norm', 'vand', 'torev' ],
	watchRevertedExpiry: '1 month',
	offerReasonOnNormalRevert: true,
	confirmOnFluff: false,
	confirmOnMobileFluff: true,
	showRollbackLinks: [ 'diff', 'others' ],

	// DI (twinkleimage)
	notifyUserOnDeli: true,
	deliWatchPage: '1 month',
	deliWatchUser: '1 month',

	// Protect
	watchRequestedPages: 'yes',
	watchPPTaggedPages: 'default',
	watchProtectedPages: 'default',

	// PROD
	watchProdPages: '1 month',
	markProdPagesAsPatrolled: false,
	prodReasonDefault: '',
	logProdPages: false,
	prodLogPageName: 'PROD log',

	// CSD
	speedySelectionStyle: 'buttonClick',
	watchSpeedyPages: [ 'g3', 'g5', 'g10', 'g11', 'g12' ],
	watchSpeedyExpiry: '1 month',
	markSpeedyPagesAsPatrolled: false,
	watchSpeedyUser: '1 month',

	// these next two should probably be identical by default
	welcomeUserOnSpeedyDeletionNotification: [ 'db', 'g1', 'g2', 'g3', 'g4', 'g6', 'g10', 'g11', 'g12', 'g13', 'g14', 'a1', 'a2', 'a3', 'a7', 'a9', 'a10', 'a11', 'c1', 'f1', 'f2', 'f3', 'f7', 'f9', 'r3', 'u5' ],
	notifyUserOnSpeedyDeletionNomination: [ 'db', 'g1', 'g2', 'g3', 'g4', 'g6', 'g10', 'g11', 'g12', 'g13', 'g14', 'a1', 'a2', 'a3', 'a7', 'a9', 'a10', 'a11', 'c1', 'f1', 'f2', 'f3', 'f7', 'f9', 'r3', 'u5' ],
	warnUserOnSpeedyDelete: [ 'db', 'g1', 'g2', 'g3', 'g4', 'g6', 'g10', 'g11', 'g12', 'g13', 'g14', 'a1', 'a2', 'a3', 'a7', 'a9', 'a10', 'a11', 'c1', 'f1', 'f2', 'f3', 'f7', 'f9', 'r3', 'u5' ],
	promptForSpeedyDeletionSummary: [],
	deleteTalkPageOnDelete: true,
	deleteRedirectsOnDelete: true,
	deleteSysopDefaultToDelete: false,
	speedyWindowHeight: 500,
	speedyWindowWidth: 800,
	logSpeedyNominations: false,
	speedyLogPageName: 'CSD log',
	noLogOnSpeedyNomination: [ 'u1' ],

	// Unlink
	unlinkNamespaces: [ '0', '10', '100', '118' ],

	// Warn
	defaultWarningGroup: '10',
	combinedSingletMenus: false,
	showSharedIPNotice: true,
	watchWarnings: '1 month',
	oldSelect: false,
	customWarningList: [],

	// XfD
	logXfdNominations: false,
	xfdLogPageName: 'XfD log',
	noLogOnXfdNomination: [],
	xfdWatchDiscussion: 'default',
	xfdWatchList: 'no',
	xfdWatchPage: '1 month',
	xfdWatchUser: '1 month',
	xfdWatchRelated: '1 month',
	markXfdPagesAsPatrolled: true,

	// Hidden preferences
	autolevelStaleDays: 3, // Huggle is 3, CBNG is 2
	revertMaxRevisions: 50, // intentionally limited
	batchMax: 5000,
	batchChunks: 50,

	// Deprecated options, as a fallback for add-on scripts/modules
	summaryAd: ' ([[WP:TW|TW]])',
	deletionSummaryAd: ' ([[WP:TW|TW]])',
	protectionSummaryAd: ' ([[WP:TW|TW]])',

	// Formerly defaultConfig.friendly:
	// Tag
	groupByDefault: true,
	watchTaggedVenues: ['articles', 'drafts', 'redirects', 'files'],
	watchTaggedPages: '1 month',
	watchMergeDiscussions: '1 month',
	markTaggedPagesAsMinor: false,
	markTaggedPagesAsPatrolled: false,
	tagArticleSortOrder: 'cat',
	customTagList: [],
	customFileTagList: [],
	customRedirectTagList: [],

	// Welcome
	topWelcomes: false,
	watchWelcomes: '3 months',
	insertUsername: true,
	quickWelcomeMode: 'norm',
	quickWelcomeTemplate: 'welcome',
	customWelcomeList: [],
	customWelcomeSignature: true,

	// Talkback
	markTalkbackAsMinor: true,
	insertTalkbackSignature: true,  // always sign talkback templates
	talkbackHeading: 'New message from ' + mw.config.get('wgUserName'),
	mailHeading: "You've got mail!",

	// Shared
	markSharedIPAsMinor: true
};

Twinkle.getPref = function twinkleGetPref(name) {
	if (typeof Twinkle.prefs === 'object' && Twinkle.prefs[name] !== undefined) {
		return Twinkle.prefs[name];
	}
	// Old preferences format, used before twinkleoptions.js was a thing
	if (typeof window.TwinkleConfig === 'object' && window.TwinkleConfig[name] !== undefined) {
		return window.TwinkleConfig[name];
	}
	if (typeof window.FriendlyConfig === 'object' && window.FriendlyConfig[name] !== undefined) {
		return window.FriendlyConfig[name];
	}
	return Twinkle.defaultConfig[name];
};

class TwinkleMenuBuilder {
	/**
	 * @param {String} skin MediaWiki skin name, e.g. vector, vector-2022, monobook, etc.
	 * @param {Object} document DOM
	 * @param {function} $ JQuery
	 * @param {Object} collapsibleTabs A global related to something in the Vector Legacy skin
	 * @param {Object} mwUtil The mw.util global
	 */
	constructor(skin, document, $, collapsibleTabs, mwUtil) {
		/** @type {String} MediaWiki skin name, e.g. vector, vector-2022, monobook, etc. */
		this.skin = skin;

		/** @type {Object} DOM */
		this.document = document;

		/** @type {function} JQuery */
		this.$ = $;

		/** @type {Object} collapsibleTabs A global related to something in the Vector Legacy skin */
		this.collapsibleTabs = collapsibleTabs;

		/** @type {Object} The mw.util global */
		this.mwUtil = mwUtil;

		/** @type {String} id of the target navigation area (skin dependant, on vector either of "left-navigation", "right-navigation", or "mw-panel") */
		this.navigation = '';

		/** @type {String} id of the portlet menu to create, preferably start with "p-". */
		this.id = '';

		/** @type {String} name of the portlet menu to create. Visibility depends on the class used. */
		this.text = '';

		/** @type {String} type of portlet. Currently only used for the vector non-sidebar portlets, pass "menu" to make this portlet a drop down menu. */
		this.type = '';

		/** @type {Node} the id of the node before which the new item should be added, should be another item in the same list, or undefined to place it at the end. */
		this.nextnodeid = {};

		switch (this.skin) {
			case 'vector':
			case 'vector-2022':
				this.navigation = 'right-navigation';
				this.id = 'p-twinkle';
				this.text = 'TW';
				this.type = 'menu';
				this.nextnodeid = 'p-search';
				break;
			case 'timeless':
				this.navigation = '#page-tools .sidebar-inner';
				this.id = 'p-twinkle';
				this.text = 'Twinkle';
				this.type = null;
				this.nextnodeid = 'p-userpagetools';
				break;
			default:
				this.navigation = null;
				this.id = 'p-cactions';
				this.text = null;
				this.type = null;
				this.nextnodeid = null;
		}
	}

	/**
	* Adds a portlet menu to one of the navigation areas on the page.
	* This is necessarily quite a hack since skins, navigation areas, and
	* portlet menu types all work slightly different.
	*
	* Available navigation areas depend on the skin used.
	* Vector:
	*  For each option, the outer nav class contains "vector-menu", the inner div class is "vector-menu-content", and the ul is "vector-menu-content-list"
	*  "mw-panel", outer nav class contains "vector-menu-portal". Existing portlets/elements: "p-logo", "p-navigation", "p-interaction", "p-tb", "p-coll-print_export"
	*  "left-navigation", outer nav class contains "vector-menu-tabs" or "vector-menu-dropdown". Existing portlets: "p-namespaces", "p-variants" (menu)
	*  "right-navigation", outer nav class contains "vector-menu-tabs" or "vector-menu-dropdown". Existing portlets: "p-views", "p-cactions" (menu), "p-search"
	*  Special layout of p-personal portlet (part of "head") through specialized styles.
	* Monobook:
	*  "column-one", outer nav class "portlet", inner div class "pBody". Existing portlets: "p-cactions", "p-personal", "p-logo", "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
	*  Special layout of p-cactions and p-personal through specialized styles.
	* Modern:
	*  "mw_contentwrapper" (top nav), outer nav class "portlet", inner div class "pBody". Existing portlets or elements: "p-cactions", "mw_content"
	*  "mw_portlets" (sidebar), outer nav class "portlet", inner div class "pBody". Existing portlets: "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
	*
	* @return {Node} -- the DOM node of the new item (a DIV element) or null
	*/
	addPortlet() {
		if (this.navigation === null) {
			return;
		}

		// sanity checks, and get required DOM nodes
		var root = this.document.getElementById(this.navigation) || this.document.querySelector(this.navigation);
		if (!root) {
			return null;
		}

		var item = this.document.getElementById(this.id);
		if (item) {
			if (item.parentNode && item.parentNode === root) {
				return item;
			}
			return null;
		}

		var nextnode;
		if (this.nextnodeid) {
			nextnode = this.document.getElementById(this.nextnodeid);
		}

		// verify/normalize input
		if ((this.skin !== 'vector' && this.skin !== 'vector-2022') || (this.navigation !== 'left-navigation' && this.navigation !== 'right-navigation')) {
			this.type = null; // menu supported only in vector's #left-navigation & #right-navigation
		}
		var outerNavClass, innerDivClass;
		switch (this.skin) {
			case 'vector':
			case 'vector-2022':
				var panel = false;

				// XXX: portal doesn't work
				if (
					this.navigation !== 'portal' &&
					this.navigation !== 'left-navigation' &&
					this.navigation !== 'right-navigation'
				) {
					panel = true;
				}

				outerNavClass = 'mw-portlet vector-menu';
				if (panel) {
					outerNavClass += ' vector-menu-portal';
				} else if (this.type === 'menu') {
					outerNavClass += ' vector-menu-dropdown vector-dropdown vector-menu-dropdown-noicon';
				} else {
					outerNavClass += ' vector-menu-tabs';
				}

				innerDivClass = 'vector-menu-content vector-dropdown-content';
				break;
			case 'modern':
				outerNavClass = 'portlet';
				break;
			case 'timeless':
				outerNavClass = 'mw-portlet';
				innerDivClass = 'mw-portlet-body';
				break;
			default:
				outerNavClass = 'portlet';
				break;
		}

		// Build the DOM elements.
		var outerNav, heading;
		if (this.skin === 'vector-2022') {
			outerNav = this.document.createElement('div');
			heading = this.document.createElement('label');
		} else {
			outerNav = this.document.createElement('nav');
			heading = this.document.createElement('h3');
		}

		outerNav.setAttribute('aria-labelledby', this.id + '-label');
		outerNav.className = outerNavClass + ' emptyPortlet';
		outerNav.id = this.id;
		if (nextnode && nextnode.parentNode === root) {
			root.insertBefore(outerNav, nextnode);
		} else {
			root.appendChild(outerNav);
		}

		heading.id = this.id + '-label';
		var ul = this.document.createElement('ul');

		if (this.skin === 'vector' || this.skin === 'vector-2022') {
			heading.setAttribute('for', this.id + '-dropdown-checkbox');
			ul.className = 'vector-menu-content-list';
			heading.className = 'vector-menu-heading vector-dropdown-label';

			// add invisible checkbox to keep menu open when clicked
			// similar to the p-cactions ("More") menu
			if (outerNavClass.indexOf('vector-menu-dropdown') !== -1) {
				var chkbox = this.document.createElement('input');
				chkbox.id = this.id + '-dropdown-checkbox';
				chkbox.className = 'vector-menu-checkbox vector-dropdown-checkbox';
				chkbox.setAttribute('type', 'checkbox');
				chkbox.setAttribute('aria-labelledby', this.id + '-label');
				outerNav.appendChild(chkbox);

				// Vector gets its title in a span; all others except
				// timeless have no title, and it has no span
				var span = this.document.createElement('span');
				span.appendChild(this.document.createTextNode(this.text));
				heading.appendChild(span);

				var a = this.document.createElement('a');
				a.href = '#';

				this.$(a).click(function(e) {
					e.preventDefault();
				});

				heading.appendChild(a);
			}
		} else {
			// Basically just Timeless
			heading.appendChild(this.document.createTextNode(this.text));
		}

		outerNav.appendChild(heading);

		if (innerDivClass) {
			var innerDiv = this.document.createElement('div');
			innerDiv.className = innerDivClass;
			innerDiv.appendChild(ul);
			outerNav.appendChild(innerDiv);
		} else {
			outerNav.appendChild(ul);
		}

		return outerNav;
	}

	/**
	* Builds a portlet menu if it doesn't exist yet, and add the portlet link.
	* @param task: Either a URL for the portlet link or a function to execute.
	*/
	addPortletLink(task, text, id, tooltip) {
		this.addPortlet(mw.config.get('skin'));
		var link = this.mwUtil.addPortletLink(
			this.id,
			typeof task === 'string' ? task : '#',
			text,
			id,
			tooltip
		);
		this.$('.client-js .skin-vector #p-cactions').css('margin-right', 'initial');
		if (typeof task === 'function') {
			this.$(link).click(function (ev) {
				task();
				ev.preventDefault();
			});
		}
		if (this.collapsibleTabs) {
			this.collapsibleTabs.handleResize();
		}
		return link;
	}
}

Twinkle.MenuBuilder = new TwinkleMenuBuilder(mw.config.get('skin'), document, $, $.collapsibleTabs, mw.util);

/**
 * **************** General initialization code ****************
 */

var scriptpathbefore = mw.util.wikiScript('index') + '?title=',
	scriptpathafter = '&action=raw&ctype=text/javascript&happy=yes';

// Retrieve the user's Twinkle preferences
$.ajax({
	url: scriptpathbefore + 'User:' + encodeURIComponent(mw.config.get('wgUserName')) + '/twinkleoptions.js' + scriptpathafter,
	dataType: 'text'
})
	.fail(function () {
		mw.notify('Could not load your Twinkle preferences, resorting to default preferences');
	})
	.done(function (optionsText) {

		// Quick pass if user has no options
		if (optionsText === '') {
			return;
		}

		// Twinkle options are basically a JSON object with some comments. Strip those:
		optionsText = optionsText.replace(/(?:^(?:\/\/[^\n]*\n)*\n*|(?:\/\/[^\n]*(?:\n|$))*$)/g, '');

		// First version of options had some boilerplate code to make it eval-able -- strip that too. This part may become obsolete down the line.
		if (optionsText.lastIndexOf('window.Twinkle.prefs = ', 0) === 0) {
			optionsText = optionsText.replace(/(?:^window.Twinkle.prefs = |;\n*$)/g, '');
		}

		try {
			var options = JSON.parse(optionsText);
			if (options) {
				if (options.twinkle || options.friendly) { // Old preferences format
					Twinkle.prefs = $.extend(options.twinkle, options.friendly);
				} else {
					Twinkle.prefs = options;
				}
				// v2 established after unification of Twinkle/Friendly objects
				Twinkle.prefs.optionsVersion = Twinkle.prefs.optionsVersion || 1;
			}
		} catch (e) {
			mw.notify('Could not parse your Twinkle preferences', {type: 'error'});
		}
	})
	.always(function () {
		$(Twinkle.load);
	});

// Developers: you can import custom Twinkle modules here
// For example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

Twinkle.load = function () {
	// Don't activate on special pages other than those listed here, so
	// that others load faster, especially the watchlist.
	var activeSpecialPageList = [ 'Block', 'Contributions', 'Recentchanges', 'Recentchangeslinked' ]; // wgRelevantUserName defined for non-sysops on Special:Block
	if (Morebits.userIsSysop) {
		activeSpecialPageList = activeSpecialPageList.concat([ 'DeletedContributions', 'Prefixindex' ]);
	}
	if (mw.config.get('wgNamespaceNumber') === -1 &&
		activeSpecialPageList.indexOf(mw.config.get('wgCanonicalSpecialPageName')) === -1) {
		return;
	}

	// Prevent clickjacking
	if (window.top !== window.self) {
		return;
	}

	// Set custom Api-User-Agent header, for server-side logging purposes
	Morebits.wiki.api.setApiUserAgent('Twinkle (' + mw.config.get('wgWikiID') + ')');

	Twinkle.disabledModules = Twinkle.getPref('disabledModules').concat(Twinkle.getPref('disabledSysopModules'));

	// Redefine addInitCallback so that any modules being loaded now on are directly
	// initialised rather than added to initCallbacks array
	Twinkle.addInitCallback = function(func, name) {
		if (!name || Twinkle.disabledModules.indexOf(name) === -1) {
			func();
		}
	};
	// Initialise modules that were saved in initCallbacks array
	Twinkle.initCallbacks.forEach(function(module) {
		Twinkle.addInitCallback(module.func, module.name);
	});

	// Increases text size in Twinkle dialogs, if so configured
	if (Twinkle.getPref('dialogLargeFont')) {
		mw.util.addCSS('.morebits-dialog-content, .morebits-dialog-footerlinks { font-size: 100% !important; } ' +
			'.morebits-dialog input, .morebits-dialog select, .morebits-dialog-content button { font-size: inherit !important; }');
	}

	// Hide the lingering space if the TW menu is empty
	var isVector = mw.config.get('skin') === 'vector' || mw.config.get('skin') === 'vector-2022';
	if (isVector && Twinkle.getPref('portletType') === 'menu' && $('#p-twinkle').length === 0) {
		$('#p-cactions').css('margin-right', 'initial');
	}

	// If using a skin with space for lots of modules, display a link to Twinkle Preferences
	var usingSkinWithDropDownMenu = mw.config.get('skin') === 'vector' || mw.config.get('skin') === 'vector-2022' || mw.config.get('skin') === 'timeless';
	if (usingSkinWithDropDownMenu) {
		Twinkle.MenuBuilder.addPortletLink(mw.util.getUrl('Wikipedia:Twinkle/Preferences'), 'Config', 'tw-config', 'Open Twinkle preferences page');
	}
};


/**
 * Twinkle-specific data shared by multiple modules
 * Likely customized per installation
 */

// Custom change tag(s) to be applied to all Twinkle actions, create at Special:Tags
Twinkle.changeTags = 'twinkle';
// Available for actions that don't (yet) support tags
// currently: FlaggedRevs and PageTriage
Twinkle.summaryAd = ' ([[WP:TW|TW]])';

// Various hatnote templates, used when tagging (csd/xfd/tag/prod/protect) to
// ensure MOS:ORDER
Twinkle.hatnoteRegex = 'short description|hatnote|main|correct title|dablink|distinguish|for|further|selfref|year dab|similar names|highway detail hatnote|broader|about(?:-distinguish| other people)?|other\\s?(?:hurricane(?: use)?s|people|persons|places|ships|uses(?: of)?)|redirect(?:-(?:distinguish|synonym|multi))?|see\\s?(?:wiktionary|also(?: if exists)?)';

/**
 * When performing rollbacks with fluff [rollback] links, then visiting a user talk page, some data such as page name can be prefilled into Wel/AIV/Warn. Twinkle calls this a "prefill". This method gets a prefill, either from URL parameters (e.g. &vanarticle=Test) or from data previously stored using Twinkle.setPrefill()
 */
Twinkle.getPrefill = function (key) {
	Twinkle.prefill = Twinkle.prefill || {};
	if (!Object.prototype.hasOwnProperty.call(Twinkle.prefill, key)) {
		Twinkle.prefill[key] = mw.util.getParamValue(key);
	}
	return Twinkle.prefill[key];
};

/**
 * When performing rollbacks with fluff [rollback] links, then visiting a user talk page, some data such as page name can be prefilled into Wel/AIV/Warn. Twinkle calls this a "prefill". This method sets a prefill. This data will be lost if the page is refreshed, unless it is added to the URL as a parameter.
 */
Twinkle.setPrefill = function (key, value) {
	Twinkle.prefill = Twinkle.prefill || {};
	Twinkle.prefill[key] = value;
};

// Used in XFD and PROD
Twinkle.makeFindSourcesDiv = function makeSourcesDiv(divID) {
	if (!$(divID).length) {
		return;
	}
	if (!Twinkle.findSources) {
		var parser = new Morebits.wiki.preview($(divID)[0]);
		parser.beginRender('({{Find sources|' + Morebits.pageNameNorm + '}})', 'WP:AFD').then(function() {
			// Save for second-time around
			Twinkle.findSources = parser.previewbox.innerHTML;
			$(divID).removeClass('morebits-previewbox');
		});
	} else {
		$(divID).html(Twinkle.findSources);
	}
};

/** Twinkle-specific utility functions shared by multiple modules */
// Used in batch, unlink, and deprod to sort pages by namespace, as
// json formatversion=2 sorts by pageid instead (#1251)
Twinkle.sortByNamespace = function(first, second) {
	return first.ns - second.ns || (first.title > second.title ? 1 : -1);
};

// Used in batch listings to link to the page in question with >
Twinkle.generateArrowLinks = function (checkbox) {
	var link = Morebits.htmlNode('a', ' >');
	link.setAttribute('class', 'tw-arrowpage-link');
	link.setAttribute('href', mw.util.getUrl(checkbox.value));
	link.setAttribute('target', '_blank');
	checkbox.nextElementSibling.append(link);
};

// Used in deprod and unlink listings to link the page title
Twinkle.generateBatchPageLinks = function (checkbox) {
	var $checkbox = $(checkbox);
	var link = Morebits.htmlNode('a', $checkbox.val());
	link.setAttribute('class', 'tw-batchpage-link');
	link.setAttribute('href', mw.util.getUrl($checkbox.val()));
	link.setAttribute('target', '_blank');
	$checkbox.next().prepend([link, ' ']);
};

}(window, document, jQuery)); // End wrap with anonymous function

// </nowiki>
