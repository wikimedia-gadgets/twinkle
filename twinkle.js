// Twinkle loader

// Create configuration object if not provided by the user
if ( typeof( TwinkleConfig ) === 'undefined' ) {
	TwinkleConfig = {};
}

if ( typeof( TwinkleConfig.debug ) === 'undefined' ) {
	TwinkleConfig.debug = false;
}

if ( typeof( TwinkleConfig.debugLoad ) === 'undefined' ) {
	TwinkleConfig.debugLoad = false;
}

if (TwinkleConfig.debug) {
	// set debug mode to stop minification of scripts, which is important for JS debugging!
	mediaWiki.config.set("debug", "true");
}

Twinkle = {};  // don't pollute the global namespace

Twinkle.init = {

	modulesAreReady: false,
	documentIsReady: false,
	modulesHaveStarted: false,

	loadModules: function() {

		var defaultDir = "User:UncleDouggie";
		
		/* The order of the modules in the TW menu is determined from the order in the following list.
		   Undesired modules may be removed from this list without requiring any other code changes.
		   To override the location of a module for debugging, just change the "dir" property. */

		this.modules = new Array (	
			{ dir: defaultDir, name: "morebits" }, // mandatory and must be first or nothing will work
			{ dir: defaultDir, name: "twinklewarn" },
			{ dir: defaultDir, name: "twinklespeedy" },
			{ dir: defaultDir, name: "twinklearv" },
			{ dir: defaultDir, name: "twinklefluff" },
			{ dir: defaultDir, name: "twinklediff" },
			{ dir: defaultDir, name: "twinkleprotect" },
			{ dir: defaultDir, name: "twinkleprod" },
			{ dir: defaultDir, name: "twinklexfd" },
			{ dir: defaultDir, name: "twinkleimage" },
			{ dir: defaultDir, name: "twinkleunlink" },
			{ dir: defaultDir, name: "twinkledelimages" },
			{ dir: defaultDir, name: "twinkledeprod" },
			{ dir: defaultDir, name: "twinklebatchdelete" },
			{ dir: defaultDir, name: "twinklebatchprotect" },
			{ dir: defaultDir, name: "twinkleimagetraverse" },
			{ dir: defaultDir, name: "twinklebatchundelete" },
			{ dir: defaultDir, name: "morebits-test" }
		);
		
		/* Load all modules asynchronously for best performance.
		
		   For mw.loader documentation, see: 
			   http://www.mediawiki.org/wiki/ResourceLoader/Default_modules#mediaWiki.loader
		   We don't use mw.loader.using() because it seems to only work with registered
		   MediaWiki module dependencies, not with user scripts such as morebits.js.
		   
		   Using mw.loader.load() for morebits.js may not be as good as the deprecated importScript()
		   because it doesn't seem to filter multiple load requests in the event that other
		   user scripts also need to load morebits. However, it's all we've got now so we will
		   just hope that the user's browser performs some optimization. */
		
		var smaxage, maxage;
		
		if (TwinkleConfig.debug) {
			smaxage = 1;  // no caching for modules in debug mode
			maxage = 1;  // no caching for modules in debug mode
		}
		else {
			// normal usage without debug - note that scripts may be minified
			smaxage = 7200; // permit 2 hour module cache
			maxage = 7200; // permit 2 hour module cache
		}
		
		for (var i = 0; i < this.modules.length; i++) {
			var modulePath = this.modules[i].dir + "/" + this.modules[i].name + ".js";
			
			if (TwinkleConfig.debugLoad) {
				// Firefox doesn't support debugging or logging of errors to the console when using mw.loader.load!
				// For developer use, load the module the old fashioned way until MediaWiki gives us something better
				importScript( modulePath );
			}
			else {
				// normal module loader
				var url = wgServer + wgScript + "?title=" + modulePath + "&action=raw&ctype=text/javascript&smaxage=" + smaxage + "&maxage=" + maxage;
				mw.loader.load( url );
			}
		}
	},

	// After each module is loaded, it calls this function
	moduleReady: function( moduleName, moduleCallback ) {

		var moduleFound = false;
		var modulesAreReady = true;
		
		for (var i = 0; i < this.modules.length; i++) {
			if (this.modules[i].name === moduleName) {
			
				if (typeof(this.modules[i].callback) !== "undefined") {
					alert("Twinkle.init.moduleReady: attempt to register duplicate module " + moduleName);
					return;
				}
				this.modules[i].callback = moduleCallback;
				moduleFound = true;
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

	documentReady: function () {
		Twinkle.init.documentIsReady = true;
		Twinkle.init.attemptStart();
	},

	attemptStart: function() {

		// check if the document and all Twinkle modules have finished loading
		if (!this.modulesHaveStarted && this.documentIsReady && this.modulesAreReady) {
		
			// initialize all Twinkle modules in the predefined sequence
			for (var i = 0; i < this.modules.length; i++) {
				this.modules[i].callback();
			}
			this.modulesHaveStarted = true;  // lockout another attempt in case the browser calls .ready() again
		}
	}
}

Twinkle.init.loadModules();

$(document).ready(Twinkle.init.documentReady);