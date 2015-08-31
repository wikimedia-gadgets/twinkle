/**
 * +-------------------------------------------------------------------------+
 * |                  === WARNING: GLOBAL GADGET FILE ===                    |
 * |                Changes to this page affect many users.                  |
 * |           Please discuss changes at [[WT:TW]] before editing.           |
 * +-------------------------------------------------------------------------+
 *
 * Imported from github [https://github.com/azatoth/twinkle].
 * All changes should be made in the repository, otherwise they will be lost.
 *
 * To update this script from github, you must have a local repository set up. Then
 * follow the instructions at [https://github.com/azatoth/twinkle/blob/master/README.md].
 *
 * ----------
 *
 * This is AzaToth's Twinkle, the popular script sidekick for newbies, admins, and
 * every Wikipedian in between. Visit [[WP:TW]] for more information.
 */

//<nowiki>

( function ( window, document, $, undefined ) { // Wrap with anonymous function

var Twinkle = {};
window.Twinkle = Twinkle;  // allow global access

// Check if account is experienced enough to use Twinkle
Twinkle.userAuthorized = Morebits.userIsInGroup( "autoconfirmed" ) || Morebits.userIsInGroup( "confirmed" );

// for use by custom modules (normally empty)
Twinkle.initCallbacks = [];
Twinkle.addInitCallback = function twinkleAddInitCallback( func ) {
	Twinkle.initCallbacks.push( func );
};

Twinkle.defaultConfig = {};
/**
 * Twinkle.defaultConfig.twinkle and Twinkle.defaultConfig.friendly
 *
 * This holds the default set of preferences used by Twinkle. (The |friendly| object holds preferences stored in the FriendlyConfig object.)
 * It is important that all new preferences added here, especially admin-only ones, are also added to
 * |Twinkle.config.sections| in twinkleconfig.js, so they are configurable via the Twinkle preferences panel.
 * For help on the actual preferences, see the comments in twinkleconfig.js.
 */
Twinkle.defaultConfig.twinkle = {
	 // General
	summaryAd: " ([[WP:TW|TW]])",
	deletionSummaryAd: " ([[WP:TW|TW]])",
	protectionSummaryAd: " ([[WP:TW|TW]])",
	userTalkPageMode: "window",
	dialogLargeFont: false,
	 // ARV
	spiWatchReport: "yes",
	 // Block
	blankTalkpageOnIndefBlock: false,
	 // Fluff (revert and rollback)
	openTalkPage: [ "agf", "norm", "vand" ],
	openTalkPageOnAutoRevert: false,
	markRevertedPagesAsMinor: [ "vand" ],
	watchRevertedPages: [ "agf", "norm", "vand", "torev" ],
	offerReasonOnNormalRevert: true,
	confirmOnFluff: false,
	showRollbackLinks: [ "diff", "others" ],
	 // DI (twinkleimage)
	notifyUserOnDeli: true,
	deliWatchPage: "default",
	deliWatchUser: "default",
	 // PROD
	watchProdPages: true,
	prodReasonDefault: "",
	logProdPages: false,
	prodLogPageName: "PROD log",
	 // CSD
	speedySelectionStyle: "buttonClick",
	watchSpeedyPages: [ "g3", "g5", "g10", "g11", "g12" ],
	markSpeedyPagesAsPatrolled: true,
	// these next two should probably be identical by default
	notifyUserOnSpeedyDeletionNomination:    [ "db", "g1", "g2", "g3", "g4", "g6", "g10", "g11", "g12", "g13", "a1", "a2", "a3", "a5", "a7", "a9", "a10", "a11", "f1", "f2", "f3", "f7", "f9", "f10", "u3", "u5", "t2", "t3", "p1", "p2" ],
	welcomeUserOnSpeedyDeletionNotification: [ "db", "g1", "g2", "g3", "g4", "g6", "g10", "g11", "g12", "g13", "a1", "a2", "a3", "a5", "a7", "a9", "a10", "a11", "f1", "f2", "f3", "f7", "f9", "f10", "u3", "u5", "t2", "t3", "p1", "p2" ],
	promptForSpeedyDeletionSummary: [ "db", "g1", "g2", "g3", "g4", "g6", "g7", "g8", "g10", "g11", "g12", "a1", "a2", "a3", "a5", "a7", "a9", "a10", "a11", "f2", "f4", "f7", "f8", "f10", "u5", "t2", "t3", "p1", "p2" ],
	openUserTalkPageOnSpeedyDelete: [ "db", "g1", "g2", "g3", "g4", "g5", "g10", "g11", "g12", "a1", "a3", "a7", "a9", "a10", "a11", "f3", "f7", "f9", "u3", "u5", "t2", "p1" ],
	deleteTalkPageOnDelete: false,
	deleteRedirectsOnDelete: true,
	deleteSysopDefaultToTag: false,
	speedyWindowHeight: 500,
	speedyWindowWidth: 800,
	logSpeedyNominations: false,
	speedyLogPageName: "CSD log",
	noLogOnSpeedyNomination: [ "u1" ],
	 // Unlink
	unlinkNamespaces: [ "0", "10", "100", "118" ],
	 // Warn
	defaultWarningGroup: "1",
	showSharedIPNotice: true,
	watchWarnings: true,
	customWarningList: [],
	 // XfD
	xfdWatchDiscussion: "default",
	xfdWatchList: "no",
	xfdWatchPage: "default",
	xfdWatchUser: "default",
	markXfdPagesAsPatrolled: true,
	 // Hidden preferences
	revertMaxRevisions: 50,
	batchdeleteChunks: 50,
	batchMax: 5000,
	batchProtectChunks: 50,
	batchundeleteChunks: 50,
	deliChunks: 500,
	deliMax: 5000,
	proddeleteChunks: 50
};

// now some skin dependent config.
if ( mw.config.get( "skin" ) === "vector" ) {
	Twinkle.defaultConfig.twinkle.portletArea = "right-navigation";
	Twinkle.defaultConfig.twinkle.portletId   = "p-twinkle";
	Twinkle.defaultConfig.twinkle.portletName = "TW";
	Twinkle.defaultConfig.twinkle.portletType = "menu";
	Twinkle.defaultConfig.twinkle.portletNext = "p-search";
} else {
	Twinkle.defaultConfig.twinkle.portletArea =  null;
	Twinkle.defaultConfig.twinkle.portletId   = "p-cactions";
	Twinkle.defaultConfig.twinkle.portletName = null;
	Twinkle.defaultConfig.twinkle.portletType = null;
	Twinkle.defaultConfig.twinkle.portletNext = null;
}

Twinkle.defaultConfig.friendly = {
	 // Tag
	groupByDefault: true,
	watchTaggedPages: true,
	watchMergeDiscussions: true,
	markTaggedPagesAsMinor: false,
	markTaggedPagesAsPatrolled: true,
	tagArticleSortOrder: "cat",
	customTagList: [],
	 // Welcome
	topWelcomes: false,
	watchWelcomes: true,
	welcomeHeading: "Welcome",
	insertHeadings: true,
	insertUsername: true,
	insertSignature: true,  // sign welcome templates, where appropriate
	quickWelcomeMode: "norm",
	quickWelcomeTemplate: "welcome",
	customWelcomeList: [],
	customWelcomeSignature: true,
	 // Talkback
	markTalkbackAsMinor: true,
	insertTalkbackSignature: true,  // always sign talkback templates
	talkbackHeading: "Talkback",
	adminNoticeHeading: "Notice",
	mailHeading: "You've got mail!",
	 // Shared
	markSharedIPAsMinor: true
};

Twinkle.getPref = function twinkleGetPref( name ) {
	var result;
	if ( typeof Twinkle.prefs === "object" && typeof Twinkle.prefs.twinkle === "object" ) {
		// look in Twinkle.prefs (twinkleoptions.js)
		result = Twinkle.prefs.twinkle[name];
	} else if ( typeof window.TwinkleConfig === "object" ) {
		// look in TwinkleConfig
		result = window.TwinkleConfig[name];
	}

	if ( result === undefined ) {
		return Twinkle.defaultConfig.twinkle[name];
	}
	return result;
};

Twinkle.getFriendlyPref = function twinkleGetFriendlyPref(name) {
	var result;
	if ( typeof Twinkle.prefs === "object" && typeof Twinkle.prefs.friendly === "object" ) {
		// look in Twinkle.prefs (twinkleoptions.js)
		result = Twinkle.prefs.friendly[ name ];
	} else if ( typeof window.FriendlyConfig === "object" ) {
		// look in FriendlyConfig
		result = window.FriendlyConfig[ name ];
	}

	if ( result === undefined ) {
		return Twinkle.defaultConfig.friendly[ name ];
	}
	return result;
};



/**
 * **************** Twinkle.addPortlet() ****************
 *
 * Adds a portlet menu to one of the navigation areas on the page.
 * This is necessarily quite a hack since skins, navigation areas, and
 * portlet menu types all work slightly different.
 *
 * Available navigation areas depend on the skin used.
 * Monobook:
 *  "column-one", outer div class "portlet", inner div class "pBody". Existing portlets: "p-cactions", "p-personal", "p-logo", "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *  Special layout of p-cactions and p-personal through specialized styles.
 * Vector:
 *  "mw-panel", outer div class "portal", inner div class "body". Existing portlets/elements: "p-logo", "p-navigation", "p-interaction", "p-tb", "p-coll-print_export"
 *  "left-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-namespaces", "p-variants" (menu)
 *  "right-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-views", "p-cactions" (menu), "p-search"
 *  Special layout of p-personal portlet (part of "head") through specialized styles.
 * Modern:
 *  "mw_contentwrapper" (top nav), outer div class "portlet", inner div class "pBody". Existing portlets or elements: "p-cactions", "mw_content"
 *  "mw_portlets" (sidebar), outer div class "portlet", inner div class "pBody". Existing portlets: "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *
 * @param String navigation -- id of the target navigation area (skin dependant, on vector either of "left-navigation", "right-navigation", or "mw-panel")
 * @param String id -- id of the portlet menu to create, preferably start with "p-".
 * @param String text -- name of the portlet menu to create. Visibility depends on the class used.
 * @param String type -- type of portlet. Currently only used for the vector non-sidebar portlets, pass "menu" to make this portlet a drop down menu.
 * @param Node nextnodeid -- the id of the node before which the new item should be added, should be another item in the same list, or undefined to place it at the end.
 *
 * @return Node -- the DOM node of the new item (a DIV element) or null
 */
Twinkle.addPortlet = function( navigation, id, text, type, nextnodeid )
{
	//sanity checks, and get required DOM nodes
	var root = document.getElementById( navigation );
	if ( !root ) {
		return null;
	}

	var item = document.getElementById( id );
	if ( item ) {
		if ( item.parentNode && item.parentNode === root ) {
			return item;
		}
		return null;
	}

	var nextnode;
	if ( nextnodeid ) {
		nextnode = document.getElementById(nextnodeid);
	}

	//verify/normalize input
	var skin = mw.config.get("skin");
	type = ( skin === "vector" && type === "menu" && ( navigation === "left-navigation" || navigation === "right-navigation" )) ? "menu" : "";
	var outerDivClass;
	var innerDivClass;
	switch ( skin )
	{
		case "vector":
			if ( navigation !== "portal" && navigation !== "left-navigation" && navigation !== "right-navigation" ) {
				navigation = "mw-panel";
			}
			outerDivClass = ( navigation === "mw-panel" ) ? "portal" : ( type === "menu" ? "vectorMenu" : "vectorTabs" );
			innerDivClass = ( navigation === "mw-panel" ) ? "body" : ( type === "menu" ? "menu" : "" );
			break;
		case "modern":
			if ( navigation !== "mw_portlets" && navigation !== "mw_contentwrapper" ) {
				navigation = "mw_portlets";
			}
			outerDivClass = "portlet";
			innerDivClass = "pBody";
			break;
		default:
			navigation = "column-one";
			outerDivClass = "portlet";
			innerDivClass = "pBody";
			break;
	}

	// Build the DOM elements.
	var outerDiv = document.createElement( "div" );
	outerDiv.className = outerDivClass + " emptyPortlet";
	outerDiv.id = id;
	if ( nextnode && nextnode.parentNode === root ) {
		root.insertBefore( outerDiv, nextnode );
	} else {
		root.appendChild( outerDiv );
	}

	var h5 = document.createElement( "h3" );
	if ( type === "menu" ) {
		var span = document.createElement( "span" );
		span.appendChild( document.createTextNode( text ) );
		h5.appendChild( span );

		var a = document.createElement( "a" );
		a.href = "#";

		$( a ).click(function ( e ) {
			e.preventDefault();

			if ( !Twinkle.userAuthorized ) {
				alert("Sorry, your account is too new to use Twinkle.");
			}
		});

		h5.appendChild( a );
	} else {
		h5.appendChild( document.createTextNode( text ) );
	}
	outerDiv.appendChild( h5 );

	if ( type === "menu" ) {
		var innerDiv = document.createElement( "div" );
		innerDiv.className = innerDivClass;
		outerDiv.appendChild(innerDiv);
	}

	var ul = document.createElement( "ul" );
	(innerDiv || outerDiv).appendChild( ul );

	return outerDiv;
};


/**
 * **************** Twinkle.addPortletLink() ****************
 * Builds a portlet menu if it doesn't exist yet, and add the portlet link.
 * @param task: Either a URL for the portlet link or a function to execute.
 */
Twinkle.addPortletLink = function( task, text, id, tooltip )
{
	if ( Twinkle.getPref("portletArea") !== null ) {
		Twinkle.addPortlet( Twinkle.getPref( "portletArea" ), Twinkle.getPref( "portletId" ), Twinkle.getPref( "portletName" ), Twinkle.getPref( "portletType" ), Twinkle.getPref( "portletNext" ));
	}
	var link = mw.util.addPortletLink( Twinkle.getPref( "portletId" ), typeof task === "string" ? task : "#", text, id, tooltip );
	if ( $.isFunction( task ) ) {
		$( link ).click(function ( ev ) {
			task();
			ev.preventDefault();
		});
	}
	if ( $.collapsibleTabs ) {
		$.collapsibleTabs.handleResize();
	}
	return link;
};


/**
 * **************** General initialization code ****************
 */

var scriptpathbefore = mw.util.wikiScript( "index" ) + "?title=",
    scriptpathafter = "&action=raw&ctype=text/javascript&happy=yes";

// Retrieve the user's Twinkle preferences
$.ajax({
	url: scriptpathbefore + "User:" + encodeURIComponent( mw.config.get("wgUserName")) + "/twinkleoptions.js" + scriptpathafter,
	dataType: "text"
})
	.fail(function () {	mw.util.jsMessage( "Could not load twinkleoptions.js" ); })
	.done(function ( optionsText ) {

		// Quick pass if user has no options
		if ( optionsText === "" ) {
			return;
		}

		// Twinkle options are basically a JSON object with some comments. Strip those:
		optionsText = optionsText.replace( /(?:^(?:\/\/[^\n]*\n)*\n*|(?:\/\/[^\n]*(?:\n|$))*$)/g, "" );

		// First version of options had some boilerplate code to make it eval-able -- strip that too. This part may become obsolete down the line.
		if ( optionsText.lastIndexOf( "window.Twinkle.prefs = ", 0 ) === 0 ) {
			optionsText = optionsText.replace( /(?:^window.Twinkle.prefs = |;\n*$)/g, "" );
		}

		try {
			var options = $.parseJSON( optionsText );

			// Assuming that our options evolve, we will want to transform older versions:
			//if ( options.optionsVersion === undefined ) {
			// ...
			// options.optionsVersion = 1;
			//}
			//if ( options.optionsVersion === 1 ) {
			// ...
			// options.optionsVersion = 2;
			//}
			// At the same time, twinkleconfig.js needs to be adapted to write a higher version number into the options.

			if ( options ) {
				Twinkle.prefs = options;
			}
		}
		catch ( e ) {
			mw.util.jsMessage("Could not parse twinkleoptions.js");
		}
	})
	.always(function () {
		$( Twinkle.load );
	});

// Developers: you can import custom Twinkle modules here
// For example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

Twinkle.load = function () {
	// Initialize i18n
	$.i18n.init( {
		locale : mw.config.get('wgUserLanguage')
	} );
	
	// Later, this object will be moved to a separate file
	$.i18n.load( {
		'en' : {
			'tw-core-portlet-name' : 'TW',
			'tw-core-summary' : ' ([[WP:TW|TW]])',
			'tw-core-summary-del' : ' ([[WP:TW|TW]])',
			'tw-core-summary-prot' : ' ([[WP:TW|TW]])',
			'tw-core-script-name' : 'Twinkle',
			'tw-core-help' : 'Twinkle Help',
			'tw-core-help-page' : 'WP:TW/DOC#shared',
			'tw-morebits-info' : 'Info',
			'tw-sharedip-label' : 'Shared IP',
			'tw-sharedip-label-hover' : 'Shared IP tagging',
			'tw-sharedip-window-title' : 'Shared IP address tagging',
			'tw-sharedip-templates' : 'Shared IP address templates',
			'tw-sharedip-field-label' : 'Fill in other details (optional) and click \"Submit\"',
			'tw-sharedip-owner' : 'IP address owner/operator',
			'tw-sharedip-owner-tooltip' : 'You can optionally enter the name of the organization that owns/operates the IP address.  You can use wikimarkup if necessary.',
			'tw-sharedip-host' : 'Host name (optional)',
			'tw-sharedip-host-tooltip' : 'The host name (for example, proxy.example.com) can be optionally entered here and will be linked by the template.',
			'tw-sharedip-contact' : 'Contact information (only if requested)',
			'tw-sharedip-contact-tooltip' : 'You can optionally enter some contact details for the organization.  Use this parameter only if the organization has specifically requested that it be added.  You can use wikimarkup if necessary.',
			'tw-sharedip-shared-ip' : 'Shared IP',
			'tw-sharedip-shared-ip-label' : '{{Shared IP}}: standard shared IP address template',
			'tw-sharedip-shared-ip-tooltip' : 'IP user talk page template that shows helpful information to IP users and those wishing to warn, block or ban them',
			'tw-sharedip-shared-ip-edu' : 'Shared IP edu',
			'tw-sharedip-shared-ip-edu-label' : '{{Shared IP edu}}: shared IP address template modified for educational institutions',
			'tw-sharedip-shared-ip-corp' : 'Shared IP corp',
			'tw-sharedip-shared-ip-corp-label' : '{{Shared IP corp}}: shared IP address template modified for businesses',
			'tw-sharedip-shared-ip-public' : 'Shared IP public',
			'tw-sharedip-shared-ip-public-label' : '{{Shared IP public}}: shared IP address template modified for public terminals',
			'tw-sharedip-shared-ip-gov' : 'Shared IP gov',
			'tw-sharedip-shared-ip-gov-label' : '{{Shared IP gov}}: shared IP address template modified for government agencies or facilities',
			'tw-sharedip-dynamic-ip' : 'Dynamic IP',
			'tw-sharedip-dynamic-ip-label' : '{{Dynamic IP}}: shared IP address template modified for organizations with dynamic addressing',
			'tw-sharedip-static-ip' : 'Static IP',
			'tw-sharedip-static-ip-label' : '{{Static IP}}: shared IP address template modified for static IP addresses',
			'tw-sharedip-isp' : 'ISP',
			'tw-sharedip-isp-label' : '{{ISP}}: shared IP address template modified for ISP organizations (specifically proxies)',
			'tw-sharedip-mobile-ip' : 'Mobile IP',
			'tw-sharedip-mobile-ip-label' : '{{Mobile IP}}: shared IP address template modified for mobile phone companies and their customers',
			'tw-sharedip-whois' : 'Whois',
			'tw-sharedip-whois-label' : '{{Whois}}: template for IP addresses in need of monitoring, but unknown whether static, dynamic or shared',
			'tw-sharedip-will-add' : 'Will add the shared IP address template to the top of the user\'s talk page.',
			'tw-sharedip-aborting' : 'Found {{%s}} on the user\'s talk page already...aborting',
			'tw-sharedip-added' : 'Added {{[[Template:%s|%s]]}} template.',
			'tw-sharedip-alert-template' : 'You must select a shared IP address template to use!',
			'tw-sharedip-alert-organization' : 'You must input an organization for the {{%s}} template!',
			'tw-sharedip-done' : 'Tagging complete, reloading talk page in a few seconds',
			'tw-sharedip-action' : 'User talk page modification',
		},
		'de' : {
			'tw-core-portlet-name' : 'DE TW',
		}
	} );
	
	// Override default config that depends on i18n
	Twinkle.defaultConfig.twinkle.portletName = $.i18n._('tw-core-portlet-name');
	
	// User can override the default configs of modules
	// For example a DE WP user will load the following lines to modify how the SharedIP
	// module looks like. Ideally, we would want to move these to the same file as the i18n
	// mode above, and put it in a function called Twinkle.i18n.localize()
	// Then we would just replace the following lines (and the ones above where the dictionary
	// is defined) with just a call to this localize() function
	if( mw.config.get('wgUserLanguage') == 'de' ){
		Twinkle.shared.standardList = [
			{
				label: $.i18n._('tw-sharedip-shared-ip-label'),
				value: $.i18n._('tw-sharedip-shared-ip'),
				tooltip: $.i18n._('tw-sharedip-share-ip-tooltip')
			},
			{
				label: $.i18n._('tw-sharedip-shared-ip-edu-label'),
				value: $.i18n._('tw-sharedip-shared-ip-edu')
			},
		];
	}

	// Don't activate on special pages other than "Contributions" so that they load faster, especially the watchlist.
	var isSpecialPage = ( mw.config.get('wgNamespaceNumber') === -1
	    	&& mw.config.get('wgCanonicalSpecialPageName') !== "Contributions"
	    	&& mw.config.get('wgCanonicalSpecialPageName') !== "Prefixindex" ),

	// Also, Twinkle is incompatible with Internet Explorer versions 8 or lower, so don't load there either.
	isOldIE = ( $.client.profile().name === 'msie' && $.client.profile().versionNumber < 9 );

	// Prevent users that are not autoconfirmed from loading Twinkle as well.
	if ( isSpecialPage || isOldIE || !Twinkle.userAuthorized ) {
		return;
	}

	// Set custom Api-User-Agent header, for server-side logging purposes
	Morebits.wiki.api.setApiUserAgent( 'Twinkle/2.0 (' + mw.config.get( 'wgDBname' ) + ')' );

	// Load the modules in the order that the tabs should appears
	// User/user talk-related
	Twinkle.arv();
	Twinkle.warn();
	Twinkle.welcome();
	Twinkle.shared();
	Twinkle.talkback();
	if ( Morebits.userIsInGroup('sysop') ) {
		Twinkle.block();
	}
	// Deletion
	Twinkle.speedy();
	Twinkle.prod();
	Twinkle.xfd();
	Twinkle.image();
	// Maintenance
	Twinkle.protect();
	Twinkle.tag();
	// Misc. ones last
	Twinkle.diff();
	Twinkle.unlink();
	Twinkle.config.init();
	Twinkle.fluff.init();
	if ( Morebits.userIsInGroup('sysop') ) {
		Twinkle.delimages();
		Twinkle.deprod();
		Twinkle.batchdelete();
		Twinkle.batchprotect();
		Twinkle.batchundelete();
	}
	// Run the initialization callbacks for any custom modules
	$( Twinkle.initCallbacks ).each(function ( k, v ) { v(); });
	Twinkle.addInitCallback = function ( func ) { func(); };

	// Increases text size in Twinkle dialogs, if so configured
	if ( Twinkle.getPref( "dialogLargeFont" ) ) {
		mw.util.addCSS( ".morebits-dialog-content, .morebits-dialog-footerlinks { font-size: 100% !important; } " +
			".morebits-dialog input, .morebits-dialog select, .morebits-dialog-content button { font-size: inherit !important; }" );
	}
};

} ( window, document, jQuery )); // End wrap with anonymous function

// </nowiki>
