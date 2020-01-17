## Reviewing and merging pull requests

(WIP)

Collaborators are encouraged to thoroughly review and [test](./CONTRIBUTING.md) each pull request, including their own.  Unless urgent or obvious, it can be helpful to leave PRs open for folks to opine.

Things to watch out for:

- Items and processes laid out in [CONTRIBUTING.md](./CONTRIBUTING.md) are followed.
- Twinkle is meant to run on the latest weekly version of MediaWiki as rolled out every Thursday on the English Wikipedia.  Backwards compatibility is not guaranteed.
- The goal is for Twinkle and Morebits to support the same [browsers that MediaWiki supports](https://www.mediawiki.org/wiki/Browser_compatibility).  In particular, collaborators should look out for [unsupported additions](https://kangax.github.io/compat-table/es6/) from ES6 (aka ES2015); `.includes` and `.find` are among the most likely to show up, although the jQuery `$.find()` is fine.
- Certain positional jQuery selectors like `:first`, `:last`, and `:eq` were [deprecated in jQuery version 3.4.0](https://blog.jquery.com/2019/04/10/jquery-3-4-0-released/) and should probably not be reintroduced.  Instead, use methods like `.first()`, `.last()`, or `.eq()`.

## Updating scripts on Wikipedia

There are two ways to upload Twinkle scripts to Wikipedia or another destination. You can do it with a [Perl script](#synchronization-using-syncpl) (recommended) or [manually](#manual-synchronization).

After the files are synced, ensure that [MediaWiki:Gadgets-definition][] contains the following lines:

    * Twinkle[ResourceLoader|dependencies=mediawiki.notify,jquery.chosen,moment,ext.gadget.morebits|rights=autoconfirmed|type=general|peers=Twinkle-pagestyles]|Twinkle.js|twinkleprod.js|twinkleimage.js|twinklebatchundelete.js|twinklewarn.js|twinklespeedy.js|friendlyshared.js|twinklediff.js|twinkleunlink.js|friendlytag.js|twinkledeprod.js|friendlywelcome.js|twinklexfd.js|twinklebatchdelete.js|twinklebatchprotect.js|twinkleconfig.js|twinklefluff.js|twinkleprotect.js|twinklearv.js|twinkleblock.js|friendlytalkback.js|Twinkle.css
    * morebits[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,jquery.ui,jquery.tipsy|hidden]|morebits.js|morebits.css
    * Twinkle-pagestyles[hidden|skins=vector]|Twinkle-pagestyles.css

This loads the `morebits` library as a hidden gadget, making it efficiently available for other tools to use. `Twinkle-pagestyles` is a hidden [peer gadget](https://www.mediawiki.org/wiki/ResourceLoader/Migration_guide_(users)#Gadget_peers) of Twinkle. Before Twinkle has loaded, it adds space where the TW menu would go in the Vector skin, so that the top bar does not "jump".

### Manual synchronization

Each Twinkle module and dependency lives on the wiki as a separate file. The list of modules and what pages they should be on are as follows:

* `twinkle.js` &rarr; [MediaWiki:Gadget-Twinkle.js][]
* `twinkle.css` &rarr; [MediaWiki:Gadget-Twinkle.css][]
* `twinkle-pagestyles.css` &rarr; [MediaWiki:Gadget-Twinkle-pagestyles.css][]
* `morebits.js` &rarr; [MediaWiki:Gadget-morebits.js][]
* `morebits.css` &rarr; [MediaWiki:Gadget-morebits.css][]
* `modules/twinkleprod.js` &rarr; [MediaWiki:Gadget-twinkleprod.js][]
* `modules/twinkleimage.js` &rarr; [MediaWiki:Gadget-twinkleimage.js][]
* `modules/twinklebatchundelete.js` &rarr; [MediaWiki:Gadget-twinklebatchundelete.js][]
* `modules/twinklewarn.js` &rarr; [MediaWiki:Gadget-twinklewarn.js][]
* `modules/twinklespeedy.js` &rarr; [MediaWiki:Gadget-twinklespeedy.js][]
* `modules/friendlyshared.js` &rarr; [MediaWiki:Gadget-friendlyshared.js][]
* `modules/twinklediff.js` &rarr; [MediaWiki:Gadget-twinklediff.js][]
* `modules/twinkleunlink.js` &rarr; [MediaWiki:Gadget-twinkleunlink.js][]
* `modules/friendlytag.js` &rarr; [MediaWiki:Gadget-friendlytag.js][]
* `modules/twinkledeprod.js` &rarr; [MediaWiki:Gadget-twinkledeprod.js][]
* `modules/friendlywelcome.js` &rarr; [MediaWiki:Gadget-friendlywelcome.js][]
* `modules/twinklexfd.js` &rarr; [MediaWiki:Gadget-twinklexfd.js][]
* `modules/twinklebatchdelete.js` &rarr; [MediaWiki:Gadget-twinklebatchdelete.js][]
* `modules/twinklebatchprotect.js` &rarr; [MediaWiki:Gadget-twinklebatchprotect.js][]
* `modules/twinkleconfig.js` &rarr; [MediaWiki:Gadget-twinkleconfig.js][]
* `modules/twinklefluff.js` &rarr; [MediaWiki:Gadget-twinklefluff.js][]
* `modules/twinkleprotect.js` &rarr; [MediaWiki:Gadget-twinkleprotect.js][]
* `modules/twinklearv.js` &rarr; [MediaWiki:Gadget-twinklearv.js][]
* `modules/friendlytalkback.js` &rarr; [MediaWiki:Gadget-friendlytalkback.js][]
* `modules/twinkleblock.js` &rarr; [MediaWiki:Gadget-twinkleblock.js][]

### Synchronization using `sync.pl`

There is a synchronization script called `sync.pl`, which can be used to update on-wiki gadgets, or update the repository based on on-wiki changes.

The program depends on a few Perl modules, namely [`MediaWiki::API`][MediaWiki::API], [`Git::Repository`][Git::Repository], [`File::Slurper`][File::Slurper], and [`Getopt::Long::Descriptive`][Getopt::Long::Descriptive]. These can be installed easily using [`App::cpanminus`][App::cpanminus]:

    cpanm --sudo install MediaWiki::API Git::Repository File::Slurper Getopt::Long::Descriptive

You may prefer to install them through your operating system's packaing tool (e.g. `apt-get install libgetopt-long-descriptive-perl`) although you can install them through cpanm too.

When running the program, you can enter your credentials on the command line using the `--username` and `--password` parameters, but it is recommended to save them in a file called `~/.twinklerc` using the following format:

    username = username
    password = password
    lang     = en
    family   = wikipedia
    base     = User:Username

where `base` is the wiki path to prefix the files for `pull` and `push`. The script ignores the `modules/` part of the file path when downloading/uploading.

Note that your working directory **must** be clean; if not, either `stash` or `commit` your changes.

To `pull` user Foobar's changes (i.e. `User:Foobar/morebits.js`) down from the wiki, do:

    ./sync.pl --base User:Foobar --pull twinkle.js morebits.js ...

To `push` your changes to user Foobar's wiki page, do:

    ./sync.pl --base User:Foobar --push twinkle.js morebits.js ...

#### Deploying to the sitewide gadget

There is also a `deploy` command for [interface-admins][intadmin] to deploy Twinkle files live to their MediaWiki:Gadget locations. You will need to set up a bot password at [Special:BotPasswords][special_botpass].

    ./sync.pl --deploy twinkle.js morebits.js ...

You may also `deploy` all files via

    make deploy

Note that for syncing to a non-Enwiki project, you will also need to specify the --lang and/or --family parameters. For instance, to sync the files with `test.wmflabs.org` you should specify `--lang=test --family=wmflabs`. If you intend to use `make deploy` to deploy all the files at once, you may also need to pass the necessary parameters through the makefile to the sync script like this example:

    make ARGS="--lang=test --family=wmflabs" deploy

When `deploy`ing or `push`ing, the script will attempt to parse the latest on-wiki edit summary for the commit of the last update, and will use that to create an edit summary using the changes committed since then. If it cannot find anything that looks like a commit hash, it will give you the most recent commits for each file and prompt you to enter an edit summary manually.

[MediaWiki:Gadgets-definition]: https://en.wikipedia.org/wiki/MediaWiki:Gadgets-definition
[MediaWiki:Gadget-Twinkle.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle.js
[MediaWiki:Gadget-Twinkle.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle.css
[MediaWiki:Gadget-Twinkle-pagestyles.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle-pagestyles.css
[MediaWiki:Gadget-morebits.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.js
[MediaWiki:Gadget-morebits.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.css
[MediaWiki:Gadget-twinkleprod.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleprod.js
[MediaWiki:Gadget-twinkleimage.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleimage.js
[MediaWiki:Gadget-twinklebatchundelete.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklebatchundelete.js
[MediaWiki:Gadget-twinklewarn.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklewarn.js
[MediaWiki:Gadget-twinklespeedy.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklespeedy.js
[MediaWiki:Gadget-friendlyshared.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-friendlyshared.js
[MediaWiki:Gadget-twinklediff.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklediff.js
[MediaWiki:Gadget-twinkleunlink.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleunlink.js
[MediaWiki:Gadget-friendlytag.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-friendlytag.js
[MediaWiki:Gadget-twinkledeprod.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkledeprod.js
[MediaWiki:Gadget-friendlywelcome.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-friendlywelcome.js
[MediaWiki:Gadget-twinklexfd.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklexfd.js
[MediaWiki:Gadget-twinklebatchdelete.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklebatchdelete.js
[MediaWiki:Gadget-twinklebatchprotect.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklebatchprotect.js
[MediaWiki:Gadget-twinkleconfig.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleconfig.js
[MediaWiki:Gadget-twinklefluff.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklefluff.js
[MediaWiki:Gadget-twinkleprotect.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleprotect.js
[MediaWiki:Gadget-twinklearv.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklearv.js
[MediaWiki:Gadget-friendlytalkback.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-friendlytalkback.js
[MediaWiki:Gadget-twinkleblock.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleblock.js
[User:AzaToth/twinkle.js]: https://en.wikipedia.org/wiki/User:AzaToth/twinkle.js
[MediaWiki:Gadgets-definition]: https://en.wikipedia.org/wiki/MediaWiki:Gadgets-definition
[MediaWiki::API]: https://metacpan.org/pod/MediaWiki::API
[Git::Repository]: https://metacpan.org/pod/Git::Repository
[File::Slurper]: https://metacpan.org/pod/File::Slurper
[Getopt::Long::Descriptive]: https://metacpan.org/pod/Getopt::Long::Descriptive
[App::cpanminus]: https://metacpan.org/pod/App::cpanminus
[intadmin]: https://en.wikipedia.org/wiki/Wikipedia:Interface_administrators
[special_botpass]: https://en.wikipedia.org/wiki/Special:BotPasswords
