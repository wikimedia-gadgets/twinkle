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

There are two ways to upload Twinkle scripts to Wikipedia or another destination. You can do it [manually](#manual-synchronization) or with a [Python script](synchronization-using-syncpl).

After the files are synced, [MediaWiki:Gadgets-definition][] should contain the following lines:

    * Twinkle[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.RegExp,jquery.ui.dialog,jquery.tipsy,moment|rights=autoconfirmed|type=general|peers=Twinkle-pagestyles]|morebits.js|morebits.css|Twinkle.js|twinkleprod.js|twinkleimage.js|twinklebatchundelete.js|twinklewarn.js|twinklespeedy.js|friendlyshared.js|twinklediff.js|twinkleunlink.js|friendlytag.js|twinkledeprod.js|friendlywelcome.js|twinklexfd.js|twinklebatchdelete.js|twinklebatchprotect.js|twinkleconfig.js|twinklefluff.js|twinkleprotect.js|twinklearv.js|twinkleblock.js|friendlytalkback.js|Twinkle.css
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

The program depends on Perl 5.10 and the modules [`Git::Repository`][Git::Repository] and [`MediaWiki::Bot`][MediaWiki::Bot], which can be installed easily using [`App::cpanminus`][App::cpanminus]:

    cpanm --sudo install Git::Repository MediaWiki::Bot

Note: On some systems, additional modules such as `File::Slurp`, `Getopt::Long::Descriptive` and other dependencies may need to be installed as well. It is preferred that you install them through your operating system's packaing tool (e.g. `apt-get install libgetopt-long-descriptive-perl`) although you can install them through cpanm too.

When running the program, you can enter your credentials on the command line using the `--username` and `--password` parameters, but it is recommended to save them in a file called `~/.mwbotrc` using the following format:

    username => "Username",
    password => "password",
    base     => "User::Username"

where `base` is the wiki path to prefix the files for `pull` and `push`. If you do not specify the `base` parameter, files will be pushed into the MediaWiki namespace.

Notice that your working directory **must** be clean; if not, either `stash` or `commit` your changes.

To `pull` user Foobar's changes (i.e. `User:Foobar/morebits.js`), do:

    ./sync.pl --base User:Foobar --pull morebits.js

To `push` your changes to Foobar's wiki page, do:

    ./sync.pl --base User:Foobar --push morebits.js

There is also a `deploy` command to deploy all Twinkle files live.

    ./sync.pl --deploy twinkle.js
    make deploy

Note that for syncing to a custom wiki, you will also need to specify the --lang and --family parameters too. For instance, to sync the files with `test.wmflabs.org` you should specify `--lang=test --family=wmflabs`. If you intend to use `make deploy` to deploy all the files at once, you may also need to pass the necessary parameters through the makefile to the sync script like this example:

    make ARGS="--lang=test --family=wmflabs" deploy

The edit summary will contain the branch, the last commit sha, and the oneliner for that commit.

Style guideline
---------------

While old legacy code has many different and incoherent styles, it has been decided to utilize a more coherent style throughout the code.

The [jQuery Core Style Guideline][jq_style] is what we will hereafter use as our style guideline.

Needless to say, there are exceptions. The main sticking point is spacing around parentheses. Older Twinkle code looks like `if ( condition ) {`, but newer code tends to use `if (condition) {`. The best convention here is to follow the style of surrounding code.

[Wikipedia:Twinkle]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle
[AzaToth]: https://en.wikipedia.org/wiki/User:AzaToth
[Twinkle documentation]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle/doc
[WP:TWPREFS]: https://en.wikipedia.org/wiki/WP:TWPREFS
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
[Git::Repository]: http://search.cpan.org/perldoc?Git%3A%3ARepository
[MediaWiki::Bot]: http://search.cpan.org/perldoc?MediaWiki%3A%3ABot
[App::cpanminus]: http://search.cpan.org/perldoc?App%3A%3Acpanminus
[jq_style]: http://contribute.jquery.org/style-guide/js/
