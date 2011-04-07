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

Twinkle = {};  // don't pollute the global namespace

Twinkle.init = {

	modulesAreReady: false,
	documentIsReady: false,
	modulesHaveStarted: false,
	loadTimeHasElapsed: false,

	loadModules: function() {

		var defaultDir = "User:UncleDouggie";
		
		/* The order of the modules in the TW menu is determined from the order in the following list.
		   Undesired modules may be removed from this list without requiring any other code changes.
		   To override the location of a module for debugging, just change the "dir" property. */

		// modules that everyone can use
		this.modules = [	
			{ dir: defaultDir, name: "morebits" }, // mandatory and must be first or nothing will work
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
			{ dir: defaultDir, name: "twinkleunlink" }
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
		
		if (TwinkleConfig.loadDebugModules) {

			// add the debug modules to the end of the module list
			this.modules.push.apply( this.modules, debugModules );
		}

		var startingModule = 0;  // load all modules by default
		
		// check if morebits has already been loaded by another script
		if ( typeof(morebits_v2_js_loaded) !== "undefined" ) {
			startingModule = 1;  // don't reload morebits
			this.modules[0].callback = function() {};  // indicate that morebits is ready
		}
		
		/* Load all modules using the deprecated importScript() function. 
		   See http://en.wikipedia.org/wiki/Wikipedia_talk:WikiProject_User_scripts#Replacing_importScript.28.29 
		   for more imformation on loading methods. */
		
		for (var i = startingModule; i < this.modules.length; i++) {
			var modulePath = this.modules[i].dir + "/" + this.modules[i].name + ".js";
			importScript( modulePath );
		}

		if( typeof( TwinkleConfig.moduleLoadTime ) == 'undefined' ) {
			TwinkleConfig.moduleLoadTime = 20;  // seconds to wait for modules to load
		}
		
		// setup timer callback in case all modules don't load
		window.setTimeout( function() { 
				Twinkle.init.loadTimeout();
			}, 
			TwinkleConfig.moduleLoadTime * 1000 );
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
			
				// check if any module other than morebits tries to register twice
				if (typeof(this.modules[i].callback) !== "undefined" && i > 0) {
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
			else if (typeof(this.modules[i].callback) === "undefined") {
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
		Twinkle.init.documentIsReady = true;
		Twinkle.init.attemptStart();
	},

	// start all modules if ready
	attemptStart: function() {

		// check if the document and all Twinkle modules have finished loading
		// if we have waiting long enough, start what is ready
		if ( !this.modulesHaveStarted && this.documentIsReady && 
		     (this.modulesAreReady || this.loadTimeHasElapsed) ) {
		
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

// Create configuration object if not provided by the user's custom .js file
if ( typeof( TwinkleConfig ) === 'undefined' ) {
	TwinkleConfig = {};
}

Twinkle.init.loadModules();

$(document).ready(Twinkle.init.domReady);