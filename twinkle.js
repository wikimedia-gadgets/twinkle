/* Twinkle loader
 * --------------
 *
 * Manages the loading and initialization of all Twinkle modules.
 * While this is more complex than blindly loading each module, it has several advantages:
 *   1. Allows morebits to load in parallel with all other modules for best performance.
 *   2. Insures that no module is initialized until morebits and the DOM are both ready.
 *   3. Provides consistent ordering of modules in the Twinkle menu for ease of use.
 *   4. Tolerant of modules that are missing or have errors, although initialization will be delayed.
 *   5. Provides consistent, error-free intialization in all supported browsers.
 *   6. Detects improper direct importing of modules to prevent unexplained errors.
 *   7. Allows multiple user scripts to load and utilitize the common morebits library.
 *   8. Completely event driven. No busy waiting or periodic timers.
 */

var Twinkle = {};  // don't pollute the global namespace

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
	 // CSD
	speedyPromptOnG7: false,
	watchSpeedyPages: [ "g3", "g5", "g10", "g11", "g12" ],
	markSpeedyPagesAsPatrolled: true,
	// these two should probably be identical by default
	notifyUserOnSpeedyDeletionNomination:    [ "db", "g1", "g2", "g3", "g4", "g10", "g11", "g12", "a1", "a2", "a3", "a5", "a7", "a9", "a10", "f1", "f2", "f3", "f7", "f9", "f10", "u3", "t2", "t3", "p1", "p2" ],
	welcomeUserOnSpeedyDeletionNotification: [ "db", "g1", "g2", "g3", "g4", "g10", "g11", "g12", "a1", "a2", "a3", "a5", "a7", "a9", "a10", "f1", "f2", "f3", "f7", "f9", "f10", "u3", "t2", "t3", "p1", "p2" ],
	// XXX admin CSD is broken, uncomment this when it is fixed
	//openUserTalkPageOnSpeedyDelete: [ "db", "g1", "g2", "g3", "g4", "g5", "g10", "g11", "g12", "a1", "a3", "a7", "a9", "a10", "f3", "f7", "f9", "u3", "t2", "p1" ],
	//deleteTalkPageOnDelete: false,
	//orphanBacklinksOnSpeedyDelete: { exclude: [ "g6" ], orphan: true },  // XXX needs to be un-hashed, and made into two separate prefs
	deleteSysopDefaultToTag: true,
	speedyWindowHeight: 500,
	speedyWindowWidth: 800,
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
	proddeleteChunks: 50,
};

Twinkle.defaultConfig.friendly = {
	 // Tag
	groupByDefault: true,
	watchTaggedPages: true,
	markTaggedPagesAsMinor: false,
	markTaggedPagesAsPatrolled: true,
	 // Welcome
	topWelcomes: false,
	watchWelcomes: true,
	welcomeHeading: "Welcome",
	insertUsername: true,
	insertSignature: true,  // sign welcome templates, where appropriate
	markWelcomesAsMinor: true,
	quickWelcomeMode: "semiauto",
	quickWelcomeTemplate: "Welcome",
	maskTemplateInSummary: true,
	 // Talkback
	markTalkbackAsMinor: true,
	insertTalkbackSignature: true,  // always sign talkback templates
	talkbackHeading: "Talkback",
	 // Talkback + welcome
	insertHeadings: true,
	 // Shared
	markSharedIPAsMinor: true,
};

Twinkle.init = {

	modulesAreReady: false,
	domIsReady: false,
	modulesHaveStarted: false,
	loadTimeHasElapsed: false,
	useLocalServer: false,  // loads modules from the local webserver for development use

	loadModules: function() {

		var defaultDir = "User:UncleDouggie";  // contains full set of modules
		if (this.useLocalServer) {
			defaultDir = "twinkle";  // override path for testing on local server
		}

		/* The order of the modules in the TW menu is determined from the order in the following list.
		   Undesired modules may be removed from this list without requiring any other code changes.
		   To override the location of a module for debugging, just change the "dir" property. */

		// modules that everyone can use
		this.modules = [
			{ dir: "User:" + wgUserName, name: "twinkleoptions" },  // mandatory and must be first or nothing will work
			{ dir: defaultDir, name: "morebits" },  // mandatory and must be second or nothing will work
			{ dir: defaultDir, name: "twinklewarn" },
			{ dir: defaultDir, name: "twinklespeedy" },
			{ dir: defaultDir, name: "twinklearv" },
			{ dir: defaultDir, name: "twinklefluff" },
			{ dir: defaultDir, name: "twinklediff" },
			{ dir: defaultDir, name: "twinkleprotect" },
			{ dir: defaultDir, name: "twinkleprod" },
			{ dir: defaultDir, name: "twinklexfd" },
			{ dir: defaultDir, name: "twinklecloser" },  // newly discovered module
			{ dir: defaultDir, name: "twinkleimage" },
			{ dir: defaultDir, name: "twinkleunlink" },
			{ dir: defaultDir, name: "friendlywelcome" },
			{ dir: defaultDir, name: "friendlyshared" },
			{ dir: defaultDir, name: "friendlytag" },
			{ dir: defaultDir, name: "friendlytalkback" }
		];

		// define admin modules separately so that non-admins don't have to wait for them to load
		var adminModules = [
			{ dir: defaultDir, name: "twinkledelimages" },
			{ dir: defaultDir, name: "twinkledeprod" },
			{ dir: defaultDir, name: "twinklebatchdelete" },
			{ dir: defaultDir, name: "twinklebatchprotect" },
			{ dir: defaultDir, name: "twinkleimagetraverse" },
			{ dir: defaultDir, name: "twinklebatchundelete" },
			{ dir: defaultDir, name: "twinkleundelete" },  // newly discovered module
		];

		// special purpose modules used to debug Twinkle
		var debugModules = [
			{ dir: defaultDir, name: "morebits-test" }
		];

		// check if user is an admin
		if (wgUserGroups != null && wgUserGroups.indexOf( "sysop" ) != -1) {

			// add the admin modules to the end of the module list
			this.modules.push.apply( this.modules, adminModules );
		}

		if (typeof(twinkleLoadDebugModules) !== "undefined") {

			// add the debug modules to the end of the module list
			this.modules.push.apply( this.modules, debugModules );
		}

		// in userspace and project space, load twinkleconfig
		// XXX this check should be refined once [[Wikipedia:Twinkle/Preferences]] is created and established
		if (wgNamespaceNumber == 2 || wgNamespaceNumber == 4) {
			this.modules.push({ dir: defaultDir, name: "twinkleconfig" });
		}

		var skipMorebits = false;  // load all modules by default

		// check if morebits has already been loaded by another script
		if ( typeof(morebits_v2_js_loaded) !== "undefined" ) {
			skipMorebits = true;  // don't reload morebits
			this.modules[1].callback = function() {};  // indicate that morebits is ready
		}

		/* Load all modules using the deprecated importScript() function.
		   See http://en.wikipedia.org/wiki/Wikipedia_talk:WikiProject_User_scripts#Replacing_importScript.28.29
		   for more imformation on loading methods. */

		for (var i = 0; i < this.modules.length; i++) {
			if (skipMorebits && i == 1) {
				continue;
			}
			var modulePath = this.modules[i].dir + "/" + this.modules[i].name + ".js";
			if (this.useLocalServer) {
				importScriptURI('http://localhost/' + modulePath);
			} else {
				importScript( modulePath );  // load from Wikipedia
			}
		}

		if( typeof( twinkleModuleLoadTime ) === 'undefined') {
			twinkleModuleLoadTime = 20;  // seconds to wait for modules to load
		}

		// setup timer callback in case all modules don't load
		window.setTimeout( function() {
				Twinkle.init.loadTimeout();
			},
			twinkleModuleLoadTime * 1000 );
	},

	// timer callback after module loading started
	loadTimeout: function() {
		Twinkle.init.loadTimeHasElapsed = true;
		Twinkle.init.attemptStart();
	},

	// After each module is loaded, it calls this function
	moduleReady: function( moduleName, moduleCallback ) {

		var moduleFound = false;
		var modulesAreReady = true;

		// traverse list of modules
		for (var i = 0; i < this.modules.length; i++) {
			if (this.modules[i].name === moduleName) {

				// check if any module other than twinkleoptions or morebits tries to register twice
				if (typeof(this.modules[i].callback) !== "undefined" && i > 1) {
					alert("Twinkle.init.moduleReady: attempt to register duplicate module " + moduleName);
					return;
				}
				this.modules[i].callback = moduleCallback;
				moduleFound = true;

				// check for late registration
				if (this.modulesHaveStarted) {
					moduleCallback();  // start module immediately
				}
			}
			// check to see if all the other modules have loaded (except twinkleoptions, which is allowed to be missing)
			else if (typeof(this.modules[i].callback) === "undefined" && i > 0) {
				modulesAreReady = false;
			}
		}

		if (!moduleFound) {
			alert("Twinkle.init.moduleReady: attempt to register unknown module " + moduleName);
			return;
		}

		this.modulesAreReady = modulesAreReady;
		this.attemptStart();
	},

	// DOM ready callback
	domReady: function () {
		Twinkle.init.domIsReady = true;
		Twinkle.init.attemptStart();
	},

	// start all modules if ready
	attemptStart: function() {

		// check if the document and all Twinkle modules have finished loading
		// if we have waiting long enough, start what is ready, so long as morebits is loaded
		if ( !this.modulesHaveStarted && this.domIsReady &&
		     (this.modulesAreReady || (this.loadTimeHasElapsed && this.modules[1].callback) ) ) {

			// set up TwinkleConfig and FriendlyConfig
			// look for the unqualified names to start with, to support legacy installations of the scripts
			// XXX this hopes that the user's twinkleoptions.js has actually loaded by now if it exists
			var usingDefaults = false;
			if (typeof(TwinkleConfig) === "undefined") {
				if (typeof(Twinkle.prefs) === "undefined" || typeof(Twinkle.prefs.twinkle) === "undefined") {
					// this should really be a cloning operation, but since TwinkleConfig should 
					// never be modified, that doesn't matter
					TwinkleConfig = Twinkle.defaultConfig.twinkle;  // intentional use of global namespace (TwinkleConfig)
					usingDefaults = true;
				} else {
					TwinkleConfig = Twinkle.prefs.twinkle;  // intentional use of global namespace (TwinkleConfig)
				}
			}
			if (!usingDefaults) {
				$.each(Twinkle.defaultConfig.twinkle, function(key, value) {
					if (typeof(TwinkleConfig[key]) === "undefined") {
						TwinkleConfig[key] = value;
					}
				});
			}

			usingDefaults = false;
			if (typeof(FriendlyConfig) === "undefined") {
				if (typeof(Twinkle.prefs) === "undefined" || typeof(Twinkle.prefs.friendly) === "undefined") {
					FriendlyConfig = Twinkle.defaultConfig.friendly;  // intentional use of global namespace (FriendlyConfig)
					usingDefaults = true;
				} else {
					FriendlyConfig = Twinkle.prefs.friendly;  // intentional use of global namespace (FriendlyConfig)
				}
			}
			if (!usingDefaults) {
				$.each(Twinkle.defaultConfig.friendly, function(key, value) {
					if (typeof(FriendlyConfig[key]) === "undefined") {
						FriendlyConfig[key] = value;
					}
				});
			}

			// initialize all Twinkle modules in the predefined sequence
			for (var i = 0; i < this.modules.length; i++) {
				if (typeof(this.modules[i].callback) === "function") {
					this.modules[i].callback();
				}
			}
			this.modulesHaveStarted = true;  // lockout another attempt in case the browser calls .ready() again
		}
	}
}

// don't activate on special pages other than "Contributions" so they load faster, especially the watchlist
if ( wgNamespaceNumber != -1 || wgTitle == "Contributions" ) {

	Twinkle.init.loadModules();

	$(document).ready(Twinkle.init.domReady);
}