
/**
 * General initialization code
 */

var scriptpathbefore = mw.config.get('wgServer') + mw.config.get('wgScript') + "?title=";
var scriptpathafter = "&action=raw&ctype=text/javascript&happy=yes";

// retrieve the user's Twinkle preferences
$.ajax({
	url: scriptpathbefore + "User:" + encodeURIComponent(mw.config.get('wgUserName')) + "/twinkleoptions.js" + scriptpathafter,
	dataType: 'text',
	error: function(){ jsMsg("Could not load twinkleoptions.js"); },
	success: function(optionsText){

		//quick pass if user has no options
		if ( optionsText === "" ) {
			return;
		}

		//twinkle options are basically a JSON object with some comments. Strip those:
		optionsText = optionsText.replace(/(?:^(?:\/\/[^\n]*\n)*\n*|(?:\/\/[^\n]*(?:\n|$))*$)/g, "");

		//first version of options had some boilerplate code to make it eval-able -- strip that too. This part may become obsolete down the line.
		if (optionsText.lastIndexOf("window.Twinkle.prefs = ", 0) === 0) {
			optionsText = optionsText.replace(/(?:^window.Twinkle.prefs = |;\n*$)/g, "");
		}

		try {
			var options = $.parseJSON(optionsText);

			// Assuming that our options evolve, we will want to transform older versions:
			//if (options.optionsVersion === undefined) {
			// ...
			// options.optionsVersion = 1;
			//}
			//if (options.optionsVersion === 1) {
			// ...
			// options.optionsVersion = 2;
			//}
			// At the same time, twinkleconfig.js needs to be adapted to write a higher version number into the options.

			if( options ) {
				Twinkle.prefs = options;
			}
		}
		catch (e) {
			jsMsg("Could not parse twinkleoptions.js");
		}
	},
	complete: function(){
		$(document).ready(Twinkle.load);
	}
});

// Developers: you can import custom Twinkle modules here
// for example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

Twinkle.load = function(){
	// Don't activate on special pages other than "Contributions" so that they load faster, especially the watchlist.
	// Also, Twinkle is incompatible with Internet Explorer versions 8 or lower, so don't load there either.
	if ( (mw.config.get('wgNamespaceNumber') === -1 && mw.config.get('wgCanonicalSpecialPageName') !== "Contributions" && mw.config.get('wgCanonicalSpecialPageName') !== "Prefixindex") ||
		($.client.profile().name === 'msie' && $.client.profile().versionNumber < 9) ) {
		return;
	}

	// load the modules in the order that the tabs should appears
	// user/user talk-related
	Twinkle.arv();
	Twinkle.warn();
	Twinkle.welcome();
	Twinkle.shared();
	Twinkle.talkback();
	// deletion
	Twinkle.speedy();
	Twinkle.prod();
	Twinkle.xfd();
	Twinkle.image();
	// maintenance
	Twinkle.protect();
	Twinkle.tag();
	// misc. ones last
	Twinkle.diff();
	Twinkle.unlink();
	Twinkle.config.init();
	Twinkle.fluff.init();
	if (userIsInGroup('sysop')) {
		//Twinkle.closer();  -- disabled for the moment, as it is disliked among Twinkle users -- TTO 2011-05-30
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

	// increates text size in Twinkle dialogs bigger, if so configured
	if (Twinkle.getPref("dialogLargeFont")) {
		mw.util.addCSS(".morebits-dialog-content, .morebits-dialog-footerlinks { font-size: 100% !important; } " +
			".morebits-dialog input, .morebits-dialog select, .morebits-dialog-content button { font-size: inherit !important; }");
	}
};

// </nowiki>
