var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Diff = /** @class */ (function (_super) {
    __extends(Diff, _super);
    function Diff() {
        var _this = _super.call(this) || this;
        if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
            return _this;
        }
        Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {
            diff: 'cur',
            oldid: 'prev'
        }), 'Last', 'tw-lastdiff', 'Show most recent diff');
        // Show additional tabs only on diff pages
        if (!mw.util.getParamValue('diff')) {
            return _this;
        }
        Twinkle.addPortletLink(function () { return _this.evaluate(false); }, 'Since', 'tw-since', 'Show difference between last diff and the revision made by previous user');
        Twinkle.addPortletLink(function () { return _this.evaluate(true); }, 'Since mine', 'tw-sincemine', 'Show difference between last diff and my last revision');
        Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {
            diff: 'cur',
            oldid: /oldid=(.+)/.exec($('#mw-diff-ntitle1').find('strong a').first().attr('href'))[1]
        }), 'Current', 'tw-curdiff', 'Show difference to current revision');
        return _this;
    }
    Diff.prototype.evaluate = function (me) {
        var user;
        if (me) {
            user = mw.config.get('wgUserName');
        }
        else {
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
            rvprop: ['ids', 'user'],
            rvstartid: mw.config.get('wgCurRevisionId') - 1,
            rvuser: user,
            format: 'json'
        });
        wikipedia_api.post().then(function (apiobj) {
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
    };
    return Diff;
}(TwinkleModule));
Twinkle.addInitCallback(function () { new Diff(); }, 'diff');
//# sourceMappingURL=diff.js.map