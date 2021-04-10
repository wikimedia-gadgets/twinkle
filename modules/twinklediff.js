// <nowiki>

/*****************************************************************************************************
 * WARNING: This file is synced with a GitHub-repo. Please make any changes to this file over there. *
 * Any local changes might be overwritten the next time this file is updated.                        *
 *                                                                                                   *
 * LET OP: Dit bestand is gekoppeld aan een GitHub-repo. Gelieve alle bewerkingen daar uitvoeren.    *
 * Locale bewerkingen worden mogelijk overschreven bij de volgende update.                           *
 *                                                                                                   *
 * https://github.com/NLWikiTools/Twinkle/blob/master/modules/twinklediff.js                         *
 *****************************************************************************************************/

(function($) {


/*
 ****************************************
 *** twinklediff.js: Diff module
 ****************************************
 * Mode of invocation:     Tab on non-diff pages ("Last"); tabs on diff pages ("Since", "Since mine", "Current")
 * Active on:              Existing non-special pages
 */

Twinkle.diff = function twinklediff() {
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}
	Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'huidig', oldid: 'vorige'}), 'Laatste', 'tw-lastdiff', 'Toon meest recente wijz');

	// Show additional tabs only on diff pages
	if (mw.util.getParamValue('diff')) {
		Twinkle.addPortletLink(function() {
			Twinkle.diff.evaluate(false);
		}, 'Sinds', 'tw-since', 'Toon verschillen tussen de huidige versie en de versie van de vorige gebruiker');
		Twinkle.addPortletLink(function() {
			Twinkle.diff.evaluate(true);
		}, 'Sinds mijn', 'tw-sincemine', 'Toon verschillen de huidige versie en mijn laatste bewerking');

		var oldid = /oldid=(.+)/.exec($('#mw-diff-ntitle1').find('strong a').first().attr('href'))[1];
		Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: oldid}), 'Huidige', 'tw-curdiff', 'Toon verschil met huidige versie');
	}
};

Twinkle.diff.evaluate = function twinklediffEvaluate(me) {

	var user;
	if (me) {
		user = mw.config.get('wgUserName');
	} else {
		var node = document.getElementById('mw-diff-ntitle2');
		if (!node) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	var query = {
		prop: 'revisions',
		action: 'query',
		titles: mw.config.get('wgPageName'),
		rvlimit: 1,
		rvprop: [ 'ids', 'user' ],
		rvstartid: mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
		rvuser: user,
		format: 'json'
	};
	Morebits.status.init(document.getElementById('mw-content-text'));
	var wikipedia_api = new Morebits.wiki.api('Data ophalen over aanmaker', query, Twinkle.diff.callbacks.main);
	wikipedia_api.params = { user: user };
	wikipedia_api.post();
};

Twinkle.diff.callbacks = {
	main: function(self) {
		var rev = self.response.query.pages[0].revisions;
		var revid = rev && rev[0].revid;

		if (!revid) {
			self.statelem.error('Geen geschikte voorgaande versies gevonden, of ' + self.params.user + ' is de enige bewerken. Afbreken...');
			return;
		}
		window.location = mw.util.getUrl(mw.config.get('wgPageName'), {
			diff: mw.config.get('wgCurRevisionId'),
			oldid: revid
		});
	}
};

Twinkle.addInitCallback(Twinkle.diff, 'diff');
})(jQuery);


// </nowiki>
