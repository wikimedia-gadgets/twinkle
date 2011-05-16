
/**
 * General initialization code
 */

var scriptpathbefore = mw.config.get('wgServer') + mw.config.get('wgScript') + "?title=";
var scriptpathafter = "&action=raw&ctype=text/javascript&happy=yes";
mw.loader.load(scriptpathbefore + "User:" + mw.util.wikiUrlencode(mw.config.get('wgUserName')) + "/twinkleoptions.js" + scriptpathafter);

// Developers: you can import custom Twinkle modules here
// for example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

Twinkle.load = function twinkleload() {
	// don't activate on special pages other than "Contributions", so that they load faster, especially the watchlist
	// also, can't theoretically run Twinkle on old Internet Explorer, just die...!
	if ( (mw.config.get('wgNamespaceNumber') === -1 && mw.config.get('wgTitle') !== "Contributions") || 
		($.client.profile().name === 'msie' && $.client.profile().versionBase < 9) ) {
		return;
	}

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
};

$(document).ready(Twinkle.load);
