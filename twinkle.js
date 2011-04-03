// Twinkle loader

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
			{ dir: defaultDir, name: "twinkleimage" },
			{ dir: defaultDir, name: "twinkleunlink" },
			{ dir: defaultDir, name: "twinkledelimages" },
			{ dir: defaultDir, name: "twinkledeprod" },
			{ dir: defaultDir, name: "twinklebatchdelete" },
			{ dir: defaultDir, name: "twinklebatchprotect" },
			{ dir: defaultDir, name: "twinkleimagetraverse" },
			{ dir: defaultDir, name: "twinklebatchundelete" },
			{ dir: defaultDir, name: "twinklecloser" },  // newly discovered module
			{ dir: defaultDir, name: "twinkleundelete" },  // newly discovered module
			{ dir: defaultDir, name: "morebits-test" }
		];
		
		/* Load all modules using the deprecated importScript() function. 
		   See [[Wikipedia talk:WikiProject User scripts#Replacing importScript.28.29]] 
		   for more imformation on loading methods. */
		
		for (var i = 0; i < this.modules.length; i++) {
			var modulePath = this.modules[i].dir + "/" + this.modules[i].name + ".js";
			importScript( modulePath );
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

// Create configuration object if not provided by the user's custom .js file
if ( typeof( TwinkleConfig ) === 'undefined' ) {
	TwinkleConfig = {};
}

Twinkle.init.loadModules();

$(document).ready(Twinkle.init.documentReady);