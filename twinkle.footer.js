
/**
 * General initialization code
 */

var TwinkleConfig, FriendlyConfig;

if ( typeof window.wikipedia_script_sentry_load === 'undefined' ) {
	window.wikipedia_script_sentry_load = [];  // necessary evil!
};
window.wikipedia_script_sentry_load.push(function() {
	// don't activate on special pages other than "Contributions" so they load faster, especially the watchlist
	// also, can't theoretically run Twinkle on old Internet Explorer, just die...!
	if( (mw.config.get('wgNamespaceNumber') === -1 && mw.config.get('wgTitle') !== "Contributions") || 
		($.client.profile().name === 'msie' && $.client.profile().versionBase < 9) ) {
		return;
	}

	$(document).ready(function() {
		// set up TwinkleConfig and FriendlyConfig
		// look for the unqualified names to start with, to support legacy installations of the scripts
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
		Twinkle.TwinkleConfig = TwinkleConfig;  // allow global access, mainly for debugging

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
		Twinkle.FriendlyConfig = FriendlyConfig;  // allow global access, mainly for debugging

		// load the modules in the order that the tabs should appears
		// misc. ones first
		Twinkle.config.init();
		Twinkle.unlink();
		Twinkle.diff();
		Twinkle.fluff.init();
		// deletion
		Twinkle.speedy();
		Twinkle.prod();
		Twinkle.xfd();
		Twinkle.image();
		// maintenance
		Twinkle.protect();
		Twinkle.tag();
		// user/user talk-related
		Twinkle.arv();
		Twinkle.warn();
		Twinkle.welcome();
		Twinkle.shared();
		Twinkle.talkback();
		if (userIsInGroup('sysop')) {
			Twinkle.closer();
			Twinkle.delimages();
			Twinkle.deprod();
			Twinkle.batchdelete();
			Twinkle.batchprotect();
			Twinkle.imagetraverse();
			Twinkle.batchundelete();
		}
		// run the initialization callbacks for any custom modules
		$(Twinkle.initCallbacks).each(function(k, v) { v(); });
		Twinkle.addInitCallback = function(func) { func(); };
	});
});

var scriptpathbefore = mw.config.get('wgServer') + mw.config.get('wgScript') + "?title=";
var scriptpathafter = "&action=raw&ctype=text/javascript&happy=yes";
mw.loader.load(scriptpathbefore + "User:" + mw.util.wikiUrlencode(mw.config.get('wgUserName')) + "/twinkleoptions.js" + scriptpathafter);

// Developers: you can import custom Twinkle modules here
// for example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

mw.loader.load(scriptpathbefore + "Wikipedia:WikiProject_User_scripts/Scripts/Load_sentry" + scriptpathafter);  // leave this last
