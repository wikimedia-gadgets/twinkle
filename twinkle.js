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

// now some skin dependent config.
switch (mw.config.get('skin')) {
	case 'vector':
	case 'vector-2022':
		Twinkle.defaultConfig.portletArea = 'right-navigation';
		Twinkle.defaultConfig.portletId = 'p-twinkle';
		Twinkle.defaultConfig.portletName = 'TW';
		Twinkle.defaultConfig.portletType = 'menu';
		Twinkle.defaultConfig.portletNext = 'p-search';
		break;
	case 'timeless':
		Twinkle.defaultConfig.portletArea = '#page-tools .sidebar-inner';
		Twinkle.defaultConfig.portletId = 'p-twinkle';
		Twinkle.defaultConfig.portletName = 'Twinkle';
		Twinkle.defaultConfig.portletType = null;
		Twinkle.defaultConfig.portletNext = 'p-userpagetools';
		break;
	default:
		Twinkle.defaultConfig.portletArea = null;
		Twinkle.defaultConfig.portletId = 'p-cactions';
		Twinkle.defaultConfig.portletName = null;
		Twinkle.defaultConfig.portletType = null;
		Twinkle.defaultConfig.portletNext = null;
}


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


/**
 * **************** Twinkle.addPortlet() ****************
 *
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
 * @param {String} navigation id of the target navigation area (skin dependant, on vector either of "left-navigation", "right-navigation", or "mw-panel")
 * @param {String} id id of the portlet menu to create, preferably start with "p-".
 * @param {String} text name of the portlet menu to create. Visibility depends on the class used.
 * @param {String} type type of portlet. Currently only used for the vector non-sidebar portlets, pass "menu" to make this portlet a drop down menu.
 * @param {Node} nextnodeid the id of the node before which the new item should be added, should be another item in the same list, or undefined to place it at the end.
 *
 * @return Node -- the DOM node of the new item (a DIV element) or null
 */
Twinkle.addPortlet = function(navigation, id, text, type, nextnodeid) {
	// sanity checks, and get required DOM nodes
	var root = document.getElementById(navigation) || document.querySelector(navigation);
	if (!root) {
		return null;
	}

	var item = document.getElementById(id);
	if (item) {
		if (item.parentNode && item.parentNode === root) {
			return item;
		}
		return null;
	}

	if (type === 'menu') {
		// In order to get mw.util.addPortlet to generate a dropdown menu in vector and vector-2022, the nextnodeid must be p-cactions. Any other nextnodeid will generate a non-dropdown portlet instead.
		nextnodeid = 'p-cactions';
	}

	var portlet = mw.util.addPortlet(id, text, '#' + nextnodeid);

	// The Twinkle dropdown menu has been added to the left of p-cactions, since that is the only spot that will create a dropdown menu. But we want it on the right. Move it to the right.
	if (mw.config.get('skin') === 'vector') {
		$('#p-twinkle').insertAfter('#p-cactions');
	} else if (mw.config.get('skin') === 'vector-2022') {
		var $landmark = $('#right-navigation > .vector-page-tools-landmark');
		$('#p-twinkle-dropdown').insertAfter($landmark);

		// .vector-page-tools-landmark is unstable and could change. If so, log it to console, to hopefully get someone's attention.
		if (!$landmark) {
			mw.log.warn('Unexpected change in DOM');
		}
	}

	return portlet;
};

/**
 * **************** Twinkle.addPortletLink() ****************
 * Builds a portlet menu if it doesn't exist yet, and add the portlet link.
 * @param task: Either a URL for the portlet link or a function to execute.
 */
Twinkle.addPortletLink = function(task, text, id, tooltip) {
	if (Twinkle.getPref('portletArea') !== null) {
		Twinkle.addPortlet(Twinkle.getPref('portletArea'), Twinkle.getPref('portletId'), Twinkle.getPref('portletName'), Twinkle.getPref('portletType'), Twinkle.getPref('portletNext'));
	}
	var link = mw.util.addPortletLink(Twinkle.getPref('portletId'), typeof task === 'string' ? task : '#', text, id, tooltip);
	$('.client-js .skin-vector #p-cactions').css('margin-right', 'initial');
	if (typeof task === 'function') {
		$(link).click(function (ev) {
			task();
			ev.preventDefault();
		});
	}
	if ($.collapsibleTabs) {
		$.collapsibleTabs.handleResize();
	}
	return link;
};


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
		Twinkle.addPortletLink(mw.util.getUrl('Wikipedia:Twinkle/Preferences'), 'Config', 'tw-config', 'Open Twinkle preferences page');
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
