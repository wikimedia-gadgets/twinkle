/**
 * +-------------------------------------------------------------------------+
 * |                  === WARNING: GLOBAL GADGET FILE ===                    |
 * |                Changes to this page affect many users.                  |
 * |           Please discuss changes at [[WT:TW]] before editing.           |
 * +-------------------------------------------------------------------------+
 *
 * Imported from github [https://github.com/azatoth/twinkle]
 * To update this script from github, you must have a local repository set up. Then
 * follow the instructions at [https://github.com/azatoth/twinkle/blob/master/README.md].
 *
 * ----------
 *
 * This is AzaToth's Twinkle. See [[WP:TW]].
 * It needs a better header comment than this one.
 */

var Twinkle = {};
window.Twinkle = Twinkle;  // allow global access

// for use by custom modules (normally empty)
Twinkle.initCallbacks = [];
Twinkle.addInitCallback = function twinkleAddInitCallback(func) {
	Twinkle.initCallbacks.push(func);
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
	 // ARV
	markAIVReportAsMinor: true,
	markUAAReportAsMinor: true,
	markSockReportAsMinor: true,
	 // Fluff (revert and rollback)
	openTalkPage: [ "agf", "norm", "vand" ],
	openTalkPageOnAutoRevert: false,
	markRevertedPagesAsMinor: [ "vand" ],
	watchRevertedPages: [ "agf", "norm", "vand", "torev" ],
	offerReasonOnNormalRevert: true,
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
	speedyPromptOnG7: false,
	watchSpeedyPages: [ "g3", "g5", "g10", "g11", "g12" ],
	markSpeedyPagesAsPatrolled: true,
	// these two should probably be identical by default
	notifyUserOnSpeedyDeletionNomination:    [ "db", "g1", "g2", "g3", "g4", "g10", "g11", "g12", "a1", "a2", "a3", "a5", "a7", "a9", "a10", "f1", "f2", "f3", "f7", "f9", "f10", "u3", "t2", "t3", "p1", "p2" ],
	welcomeUserOnSpeedyDeletionNotification: [ "db", "g1", "g2", "g3", "g4", "g10", "g11", "g12", "a1", "a2", "a3", "a5", "a7", "a9", "a10", "f1", "f2", "f3", "f7", "f9", "f10", "u3", "t2", "t3", "p1", "p2" ],
	openUserTalkPageOnSpeedyDelete: [ "db", "g1", "g2", "g3", "g4", "g5", "g10", "g11", "g12", "a1", "a3", "a7", "a9", "a10", "f3", "f7", "f9", "u3", "t2", "p1" ],
	deleteTalkPageOnDelete: false,
	deleteSysopDefaultToTag: false,
	speedyWindowHeight: 500,
	speedyWindowWidth: 800,
	logSpeedyNominations: false,
	noLogOnSpeedyNomination: [ "u1" ],
	speedyLogPageName: "CSD log",
	 // Unlink
	unlinkNamespaces: [ "0", "100" ],
	 // Warn
	defaultWarningGroup: "1",
	showSharedIPNotice: true,
	watchWarnings: true,
	blankTalkpageOnIndefBlock: false,
	 // XfD
	xfdWatchDiscussion: "default",
	xfdWatchList: "no",
	xfdWatchPage: "default",
	xfdWatchUser: "default",
	 // Hidden preferences
	revertMaxRevisions: 50,
	batchdeleteChunks: 50,
	batchDeleteMinCutOff: 5,
	batchMax: 5000,
	batchProtectChunks: 50,
	batchProtectMinCutOff: 5,
	batchundeleteChunks: 50,
	batchUndeleteMinCutOff: 5,
	deliChunks: 500,
	deliMax: 5000,
	proddeleteChunks: 50
};

Twinkle.defaultConfig.friendly = {
	 // Tag
	groupByDefault: true,
	watchTaggedPages: true,
	markTaggedPagesAsMinor: false,
	markTaggedPagesAsPatrolled: true,
	customTagList: [],
	 // Welcome
	topWelcomes: false,
	watchWelcomes: true,
	welcomeHeading: "Welcome",
	insertHeadings: true,
	insertUsername: true,
	insertSignature: true,  // sign welcome templates, where appropriate
	markWelcomesAsMinor: true,
	quickWelcomeMode: "norm",
	quickWelcomeTemplate: "welcome",
	maskTemplateInSummary: true,
	customWelcomeList: [],
	 // Talkback
	markTalkbackAsMinor: true,
	insertTalkbackSignature: true,  // always sign talkback templates
	talkbackHeading: "Talkback",
	adminNoticeHeading: "Notice",
	 // Shared
	markSharedIPAsMinor: true
};

Twinkle.getPref = function twinkleGetPref(name) {
	var result;
	if (typeof(window.TwinkleConfig) === "object") {
		// look in TwinkleConfig
		result = window.TwinkleConfig[name];
	} else if (typeof(Twinkle.prefs) === "object" && typeof(Twinkle.prefs.twinkle) === "object") {
		// look in Twinkle.prefs (twinkleoptions.js)
		result = Twinkle.prefs.twinkle[name];
	}

	if (typeof(result) === "undefined") {
		return Twinkle.defaultConfig.twinkle[name];
	}
	return result;
};

Twinkle.getFriendlyPref = function twinkleGetFriendlyPref(name) {
	var result;
	if (typeof(window.FriendlyConfig) === "object") {
		// look in FriendlyConfig
		result = window.FriendlyConfig[name];
	} else if (typeof(Twinkle.prefs) === "object" && typeof(Twinkle.prefs.friendly) === "object") {
		// look in Twinkle.prefs (twinkleoptions.js)
		result = Twinkle.prefs.friendly[name];
	}

	if (typeof(result) === "undefined") {
		return Twinkle.defaultConfig.friendly[name];
	}
	return result;
};
