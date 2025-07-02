# Helpful information for Twinkle devs

## Reviewing and merging pull requests (WIP)

Collaborators are encouraged to thoroughly review and [test](./CONTRIBUTING.md#testing-your-code) each pull request, including their own. Unless urgent or obvious, it can be helpful to leave PRs open for folks to opine.

Things to watch out for:

- Items and processes laid out in [CONTRIBUTING.md](./CONTRIBUTING.md) are followed.
- Twinkle is meant to run on the latest weekly version of MediaWiki as rolled out every Thursday on the English Wikipedia. Backwards compatibility is not guaranteed.
- The goal is for Twinkle and Morebits to support the same [browsers for which MediaWiki provides Grade A support](https://www.mediawiki.org/wiki/Browser_compatibility). The Twinkle gadget on enwiki is configured so that we can use up to JavaScript version ES6. However, due to the MediaWiki minifier, we must not use keywords from ES2016 or later, such as async/await and RegEx /s flag. New functions from ES2016 or later, such as Array.includes() should be okay since these will not break the minifier.
- Certain positional jQuery selectors like `:first`, `:last`, and `:eq` were [deprecated in jQuery version 3.4.0](https://blog.jquery.com/2019/04/10/jquery-3-4-0-released/) and should probably not be reintroduced. Instead, use methods like `.first()`, `.last()`, or `.eq()`.

## Updating scripts on Wikipedia

There are two ways to upload Twinkle scripts to Wikipedia or another destination. You can do it with a [Perl script](#synchronization-using-syncpl) (recommended) or [manually](#manual-synchronization).

After the files are synced, ensure that [MediaWiki:Gadgets-definition][] contains the gadget definition found in [gadget.txt](./gadget.txt) (`deploy.pl` will report its status). In addition to the `Twinkle` definition, the gadget installs the `morebits` library as a hidden gadget, making it efficiently available for other tools to use. `Twinkle-pagestyles` is a hidden [peer gadget](https://www.mediawiki.org/wiki/ResourceLoader/Migration_guide_(users)#Gadget_peers) of Twinkle. Before Twinkle has loaded, it adds space where the TW menu would go in the Vector skin, so that the top bar does not "jump".

[select2][] is also uploaded as a hidden gadget for better menus and to take advantage of the Resource Loader over the [Toolforge CDN](https://tools.wmflabs.org/cdnjs/); it is done so under the [MIT license](https://github.com/select2/select2/blob/develop/LICENSE.md). Loading via the ResourceLoader causes it to register as a nodejs/commonjs environment with `module.exports`, so a slight tweak has been made, eliminating that check. Ideally, this will be handled differently (see [external libraries](https://www.mediawiki.org/wiki/ResourceLoader/Migration_guide_for_extension_developers#Special_case_of_external_libraries) and [T108655](https://phabricator.wikimedia.org/T108655). As such, be careful when updating select2 from upstream.

### Manual synchronization

Each Twinkle module and dependency lives on the wiki as a separate file. The list of modules and what pages they should be on are as follows:

- `twinkle.js` &rarr; [MediaWiki:Gadget-Twinkle.js][]
- `twinkle.css` &rarr; [MediaWiki:Gadget-Twinkle.css][]
- `twinkle-pagestyles.css` &rarr; [MediaWiki:Gadget-Twinkle-pagestyles.css][]
- `morebits.js` &rarr; [MediaWiki:Gadget-morebits.js][]
- `morebits.css` &rarr; [MediaWiki:Gadget-morebits.css][]
- `select2.min.js` &rarr; [MediaWiki:Gadget-select2.min.js][]
- `select2.min.css` &rarr; [MediaWiki:Gadget-select2.min.css][]
- `modules/twinklearv.js` &rarr; [MediaWiki:Gadget-twinklearv.js][]
- `modules/twinklebatchdelete.js` &rarr; [MediaWiki:Gadget-twinklebatchdelete.js][]
- `modules/twinklebatchprotect.js` &rarr; [MediaWiki:Gadget-twinklebatchprotect.js][]
- `modules/twinklebatchundelete.js` &rarr; [MediaWiki:Gadget-twinklebatchundelete.js][]
- `modules/twinkleblock.js` &rarr; [MediaWiki:Gadget-twinkleblock.js][]
- `modules/twinkleconfig.js` &rarr; [MediaWiki:Gadget-twinkleconfig.js][]
- `modules/twinkledeprod.js` &rarr; [MediaWiki:Gadget-twinkledeprod.js][]
- `modules/twinklediff.js` &rarr; [MediaWiki:Gadget-twinklediff.js][]
- `modules/twinkleimage.js` &rarr; [MediaWiki:Gadget-twinkleimage.js][]
- `modules/twinkleprod.js` &rarr; [MediaWiki:Gadget-twinkleprod.js][]
- `modules/twinkleprotect.js` &rarr; [MediaWiki:Gadget-twinkleprotect.js][]
- `modules/twinklerollback.js` &rarr; [MediaWiki:Gadget-twinklerollback.js][]
- `modules/twinkleshared.js` &rarr; [MediaWiki:Gadget-twinkleshared.js][]
- `modules/twinklespeedy.js` &rarr; [MediaWiki:Gadget-twinklespeedy.js][]
- `modules/twinkletag.js` &rarr; [MediaWiki:Gadget-twinkletag.js][]
- `modules/twinkletalkback.js` &rarr; [MediaWiki:Gadget-twinkletalkback.js][]
- `modules/twinkleunlink.js` &rarr; [MediaWiki:Gadget-twinkleunlink.js][]
- `modules/twinklewarn.js` &rarr; [MediaWiki:Gadget-twinklewarn.js][]
- `modules/twinklewelcome.js` &rarr; [MediaWiki:Gadget-twinklewelcome.js][]
- `modules/twinklexfd.js` &rarr; [MediaWiki:Gadget-twinklexfd.js][]

### Deployment using `deploy.js`

[Interface administrators][intadmin] can use the deployment script to deploy updates to on-wiki gadgets. For full details, run `node deploy.js --help`.

You will need to set up either a bot password at [Special:BotPasswords][special_botpass] or an [owner-only OAuth2 token](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose/oauth2?wpownerOnly=1). Ensure to check the "Edit sitewide and user CSS/JS" permission in the grants. It is recommended to save your credentials to the `scripts/credentials.json`, in this format:

```json
{
	"site": "https://test.wikipedia.org/w/api.php",
	"username": "",
	"password": "",
	"accessToken": ""
}
```

All parameters can also be passed as cli params. Use either the BotPassword credentials (`--username` and `--password`) or the OAuth 2 token (`--accessToken`). For --site, you can use `testwiki` or `enwiki` as shortcuts instead of using the full URLs. Your working directory must be clean while deploying; if not, stash or commit your changes. The script can be run from any subdirectory of the repository.

To perform the deployment:

    node deploy.js

To do a dry run and see diffs of changes instead of deploying:

	node deploy.js --dry

The script will parse the latest on-wiki edit summary for last deployed commit hash, and auto-generate an edit summary from the new commit messages. If it cannot find the commit hash in edit summary, it will give you the most recent commits for each file and prompt you to enter an edit summary manually.

[MediaWiki:Gadgets-definition]: https://en.wikipedia.org/wiki/MediaWiki:Gadgets-definition
[MediaWiki:Gadget-Twinkle.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle.js
[MediaWiki:Gadget-Twinkle.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle.css
[MediaWiki:Gadget-Twinkle-pagestyles.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle-pagestyles.css
[MediaWiki:Gadget-morebits.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.js
[MediaWiki:Gadget-morebits.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.css
[MediaWiki:Gadget-select2.min.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-select2.min.js
[MediaWiki:Gadget-select2.min.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-select2.min.css
[MediaWiki:Gadget-twinklearv.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklearv.js
[MediaWiki:Gadget-twinklebatchdelete.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklebatchdelete.js
[MediaWiki:Gadget-twinklebatchprotect.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklebatchprotect.js
[MediaWiki:Gadget-twinklebatchundelete.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklebatchundelete.js
[MediaWiki:Gadget-twinkleblock.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleblock.js
[MediaWiki:Gadget-twinkleconfig.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleconfig.js
[MediaWiki:Gadget-twinkledeprod.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkledeprod.js
[MediaWiki:Gadget-twinklediff.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklediff.js
[MediaWiki:Gadget-twinkleimage.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleimage.js
[MediaWiki:Gadget-twinkleprod.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleprod.js
[MediaWiki:Gadget-twinkleprotect.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleprotect.js
[MediaWiki:Gadget-twinklerollback.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklerollback.js
[MediaWiki:Gadget-twinkleshared.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleshared.js
[MediaWiki:Gadget-twinklespeedy.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklespeedy.js
[MediaWiki:Gadget-twinkletag.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkletag.js
[MediaWiki:Gadget-twinkletalkback.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkletalkback.js
[MediaWiki:Gadget-twinkleunlink.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleunlink.js
[MediaWiki:Gadget-twinklewarn.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklewarn.js
[MediaWiki:Gadget-twinklewelcome.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklewelcome.js
[MediaWiki:Gadget-twinklexfd.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklexfd.js
[select2]: https://github.com/select2/select2
[intadmin]: https://en.wikipedia.org/wiki/Wikipedia:Interface_administrators
[special_botpass]: https://en.wikipedia.org/wiki/Special:BotPasswords

### Dependencies

All the dependencies that Twinkle uses are JavaScript **dev** dependencies. They are not used at all on-wiki and are just used during development. Here's what they are and what they do.

- eslint - Used by continuous integration for enforcing code linting rules.
- jest - Used by continuous integration for unit testing.
- jest-environment-jsdom - Needed for Jest to work.
- mock-mediawiki - Used by continuous integration for unit testing.
- mwn - Used when you run `npm start`. `npm start` is what enables localhost testing.

When updating dependencies, CI should take care of testing most of that. Manually testing `npm start` should be the only additional check needed.

### Adding a CSD

Here is a checklist for writing a patch to add a speedy deletion criteria:

* make sure Template:Db-XX exists onwiki. This template will be placed on the page when tagging
    * make sure this template also exists on testwiki when you're testing, to avoid the error "The "reason" for deleting was not provided, or Twinkle was unable to compute it. Aborting."
* modules/twinklespeedy.js -> add it to one of the "lists", such as "articleList", "talkList", or "templateList"
	* If you create a new list, make sure to add the new list to the `Twinkle.speedy.callback.modeChanged()` function, as a case in the `switch (namespace)` statement
* add to modules/twinklespeedy.js -> `normalizeHash`
* To allow the preference "add tagged/deleted page to watchlist" (should usually do this), add to:
    * modules/twinkleconfig.js -> `csdCriteria`
    * modules/twinkleconfig.js -> `csdCriteriaDisplayOrder`
* To allow the preferences "allow editing of deletion summary" and "do not create a userspace log entry" (should usually do this), add to:
    * modules/twinkleconfig.js -> `csdAndImageDeletionCriteria`
    * modules/twinkleconfig.js -> `csdAndImageDeletionCriteriaDisplayOrder`
* To allow the preferences "welcome page creator when notifying", "notify page creator when tagging", and "notify page creator when deleting" (should usually do this, unless it's an uncontroversial maintenance CSD, sockpuppet CSD, etc.), add to:
    * modules/twinkleconfig.js -> `csdCriteriaNotification`
    * modules/twinkleconfig.js -> `csdCriteriaNotificationDisplayOrder`
    * create Template:Db-XX-notice onwiki, which will be placed on the user talk page of the author when tagging
    * create Template:Db-XX-deleted onwiki, which will be placed on the user talk page of the author when deleting
* If you want some of the config options to be on by default (instead of off by default), add to:
	* twinkle.js -> `Twinkle.defaultConfig`

Example patch: https://github.com/wikimedia-gadgets/twinkle/pull/2097/files
