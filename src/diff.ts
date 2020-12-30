class Diff extends TwinkleModule {
	moduleName: 'diff';

	constructor() {
		super();
		if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
			return;
		}

		Twinkle.addPortletLink(
			mw.util.getUrl(mw.config.get('wgPageName'), {
				diff: 'cur',
				oldid: 'prev'
			}),
			'Last',
			'tw-lastdiff',
			'Show most recent diff'
		);

		// Show additional tabs only on diff pages
		if (!mw.util.getParamValue('diff')) {
			return;
		}

		Twinkle.addPortletLink(
			() => this.evaluate(false),
			'Since',
			'tw-since',
			'Show difference between last diff and the revision made by previous user'
		);

		Twinkle.addPortletLink(
			() => this.evaluate(true),
			'Since mine',
			'tw-sincemine',
			'Show difference between last diff and my last revision'
		);

		Twinkle.addPortletLink(
			mw.util.getUrl(mw.config.get('wgPageName'), {
				diff: 'cur',
				oldid: /oldid=(.+)/.exec($('#mw-diff-ntitle1').find('strong a').first().attr('href'))[1]
			}),
			'Current',
			'tw-curdiff',
			'Show difference to current revision'
		);
	}

	evaluate(me) {
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
		Morebits.status.init(document.getElementById('mw-content-text'));
		var wikipedia_api = new Morebits.wiki.api('Grabbing data of initial contributor', {
			prop: 'revisions',
			action: 'query',
			titles: mw.config.get('wgPageName'),
			rvlimit: 1,
			rvprop: [ 'ids', 'user' ],
			rvstartid: mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
			rvuser: user,
			format: 'json'
		});
		wikipedia_api.post().then(apiobj => {
			var rev = apiobj.getResponse().query.pages[0].revisions;
			var revid = rev && rev[0].revid;

			if (!revid) {
				apiobj.getStatusElement().error('no suitable earlier revision found, or ' + user + ' is the only contributor. Aborting.');
				return;
			}
			window.location.href = mw.util.getUrl(mw.config.get('wgPageName'), {
				diff: mw.config.get('wgCurRevisionId'),
				oldid: revid
			});
		});
		wikipedia_api.post();
	}
}

Twinkle.addInitCallback(() => { new Diff(); }, 'diff');
