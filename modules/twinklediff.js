// <nowiki>

(function() {

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
	Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: 'prev'}), 'Last', 'tw-lastdiff', 'Show most recent diff');

	// Show additional tabs only on diff pages
	if (mw.config.get('wgDiffNewId')) {
		Twinkle.addPortletLink(() => {
			Twinkle.diff.evaluate(false);
		}, 'Since', 'tw-since', 'Show difference between last diff and the revision made by previous user');
		Twinkle.addPortletLink(() => {
			Twinkle.diff.evaluate(true);
		}, 'Since mine', 'tw-sincemine', 'Show difference between last diff and my last revision');

		Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: mw.config.get('wgDiffNewId')}), 'Current', 'tw-curdiff', 'Show difference to current revision');
	}
};

Twinkle.diff.evaluate = function twinklediffEvaluate(me) {

	let user;
	if (me) {
		user = mw.config.get('wgUserName');
	} else {
		const node = document.getElementById('mw-diff-ntitle2');
		if (!node) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	const query = {
		prop: 'revisions',
		action: 'query',
		titles: mw.config.get('wgPageName'),
		rvlimit: 1,
		rvprop: [ 'ids', 'user' ],
		rvstartid: mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
		rvuser: user,
		format: 'json'
	};
	Morebits.Status.init(document.getElementById('mw-content-text'));
	const wikipedia_api = new Morebits.wiki.Api('Grabbing data of initial contributor', query, Twinkle.diff.callbacks.main);
	wikipedia_api.params = { user: user };
	wikipedia_api.post();
};

Twinkle.diff.callbacks = {
	main: function(self) {
		const rev = self.response.query.pages[0].revisions;
		const revid = rev && rev[0].revid;

		if (!revid) {
			self.statelem.error('no suitable earlier revision found, or ' + self.params.user + ' is the only contributor. Aborting.');
			return;
		}
		window.location = mw.util.getUrl(mw.config.get('wgPageName'), {
			diff: mw.config.get('wgCurRevisionId'),
			oldid: revid
		});
	}
};

Twinkle.addInitCallback(Twinkle.diff, 'diff');
}());

// </nowiki>
