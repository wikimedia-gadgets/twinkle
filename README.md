Twinkle [![Build Status](https://travis-ci.org/azatoth/twinkle.svg?branch=master)](https://travis-ci.org/azatoth/twinkle)
=======

Twinkle is a JavaScript library and application that gives Wikipedians a quick way of performing common maintenance tasks, such as nominating pages for deletion and cleaning up vandalism.

It is based upon the `morebits.js` library, which forms the basis for many Wikipedia scripts and editing tools.

See [Wikipedia:Twinkle][] on the English Wikipedia for more information.

[AzaToth][] is the original author and maintainer of the tool, as well as the `morebits.js` library.

Layout of this repository
-------------------------

* `morebits.js`: The central library used by Twinkle and many other scripts. Contains code to interact with the MediaWiki API, display forms and dialogs, generate status logs, and do various other useful things. The vast majority of code in here is not Twinkle-specific.
* `morebits.css`: Styling to accompany `morebits.js`. The portlet styles relating to the Modern skin are Twinkle-specific and should arguably be in a `twinkle.css` file.
* `sync.pl`: A Perl script to update on-wiki gadgets, or update the repository based on on-wiki changes. See below for full documentation.
* `twinkle.js`: General Twinkle-specific code, mostly related to preferences and exposing Twinkle in the UI. Significantly, it contains the default set of preferences of Twinkle.
* `modules`: Contains the individual Twinkle modules. Descriptions for these can be found in header comments or in the [Twinkle documentation][]. The module `twinkleconfig.js` powers the [Twinkle preferences panel][WP:TWPREFS].

Other files not mentioned here are probably obsolete.

Updating scripts on Wikipedia
-----------------------------

There are two ways to upload Twinkle scripts to Wikipedia or another destination. You can do it [manually](#manual-synchronization) (recommended) or with a [Perl script](#synchronization-using-syncpl).

After the files are synced, [MediaWiki:Gadgets-definition][] should contain the following lines:

    * Twinkle[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.notify,jquery.ui,jquery.tipsy,jquery.chosen,moment|rights=autoconfirmed|type=general|peers=Twinkle-pagestyles]|morebits.js|morebits.css|Twinkle.js|twinkleprod.js|twinkleimage.js|twinklebatchundelete.js|twinklewarn.js|twinklespeedy.js|friendlyshared.js|twinklediff.js|twinkleunlink.js|friendlytag.js|twinkledeprod.js|friendlywelcome.js|twinklexfd.js|twinklebatchdelete.js|twinklebatchprotect.js|twinkleconfig.js|twinklefluff.js|twinkleprotect.js|twinklearv.js|twinkleblock.js|friendlytalkback.js|Twinkle.css
    * Twinkle-pagestyles[hidden|skins=vector]|Twinkle-pagestyles.css

`Twinkle-pagestyles` is a hidden [peer gadget](https://www.mediawiki.org/wiki/ResourceLoader/Migration_guide_(users)#Gadget_peers) of Twinkle. Before Twinkle has loaded, it adds space where the TW menu would go in the Vector skin, so that the top bar does not "jump".

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

There is a synchronization script called `sync.pl`, which can be used to pull and push files to Wikipedia.

The program depends on a few modules, namely [`MediaWiki::API`][MediaWiki::API], [`Git::Repository`][Git::Repository], [`File::Slurper`][File::Slurper], and [`Getopt::Long::Descriptive`][Getopt::Long::Descriptive]. These can be installed easily using [`App::cpanminus`][App::cpanminus]:

    cpanm --sudo install MediaWiki::API Git::Repository File::Slurper Getopt::Long::Descriptive

You may prefer to install them through your operating system's packaing tool (e.g. `apt-get install libgetopt-long-descriptive-perl`) although you can install them through cpanm too.

When running the program, you can enter your credentials on the command line using the `--username` and `--password` parameters, but it is recommended to save them in a file called `~/.twinklerc` using the following format:

    username = username
    password = password
    lang     = en
    family   = wikipedia
    base     = User:Username

where `base` is the wiki path to prefix the files for `pull` and `push`. The script ignores the `modules/` part of the file path when downloading/uploading.

Notice that your working directory **must** be clean; if not, either `stash` or `commit` your changes.

To `pull` user Foobar's changes (i.e. `User:Foobar/morebits.js`), do:

    ./sync.pl --base User:Foobar --pull twinkle.js morebits.js ...

To `push` your changes to Foobar's wiki page, do:

    ./sync.pl --base User:Foobar --push twinkle.js morebits.js ...

There is also a `deploy` command for interface-admins to deploy Twinkle files live to their MediaWiki:Gadget locations. You will need to set up a bot password at [Special:BotPasswords][special_botpass].

    ./sync.pl --deploy twinkle.js morebits.js ...

You may also `deploy` all files via

    make deploy

Note that for syncing to a custom wiki (read: not the English Wikipedia), you will also need to specify the --lang and --family parameters too. For instance, to sync the files with `test.wmflabs.org` you should specify `--lang=test --family=wmflabs`. If you intend to use `make deploy` to deploy all the files at once, you may also need to pass the necessary parameters through the makefile to the sync script like this example:

    make ARGS="--lang=test --family=wmflabs" deploy

When `deploy`ing or `push`ing, the script will attempt to parse the latest on-wiki edit summary to find the most recently used commit, and will use that to create an edit summary from the commits since then. If it cannot find anything that looks like a commit hash, it will prompt you to enter one for each file.

Style guideline
---------------

While old legacy code previously had many different and incoherent styles, it has been decided to utilize a more coherent style throughout the code, both for consistency and to cut down on potential errors.  [eslint][eslint.org] can be used to check your code before submission and even repair many common issues.  To install via `npm`, just run `npm install` from the main Twinkle directory in your terminal.  You can then freely check your code by running `npm run lint`, and if you run `npm run lint -- --fix` then `eslint` will clean up some (but not all!) style differences.  More information on specific style rules can be seen in [issue #500][fivehundred] and in `.eslintrc.json`, but the best advice is to just follow the style of surrounding code!

[Wikipedia:Twinkle]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle
[AzaToth]: https://en.wikipedia.org/wiki/User:AzaToth
[Twinkle documentation]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle/doc
[WP:TWPREFS]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle/Preferences
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
[special_botpass]: https://en.wikipedia.org/wiki/Special:BotPasswords
[eslint.org]: https://eslint.org/
[fivehundred]: https://github.com/azatoth/twinkle/issues/500
