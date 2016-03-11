Twinkle
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

There are two ways to upload Twinkle scripts to Wikipedia or another destination.

### Manual concatenation

**These instructions are outdated! Don't do what it says here or you'll probably blow things up.**

To generate a concatenated Twinkle script, use the following `bash` command:

    awk 'FNR==1{print ""}{print}' twinkle.js modules/*.js > alltwinkle.js

Then you will be able to upload `alltwinkle.js` to [MediaWiki:Gadget-Twinkle.js][]. The concatenation does not include `morebits.js` and `morebits.css`; these have to be uploaded separately.

If `morebits.js` and/or `morebits.css` need to be updated, they should be synched to [MediaWiki:Gadget-morebits.js][] and [MediaWiki:Gadget-morebits.css][].

[MediaWiki:Gadgets-definition][] would then contain the following line:

    * Twinkle[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.RegExp,jquery.ui.dialog,jquery.tipsy,moment|rights=autoconfirmed]|morebits.js|morebits.css|Twinkle.js|twinkleprod.js|twinkleimage.js|twinklebatchundelete.js|twinklewarn.js|twinklespeedy.js|friendlyshared.js|twinklediff.js|twinkleunlink.js|twinkledelimages.js|friendlytag.js|twinkledeprod.js|friendlywelcome.js|twinklexfd.js|twinklebatchdelete.js|twinklebatchprotect.js|twinkleconfig.js|twinklefluff.js|twinkleprotect.js|twinklearv.js|twinkleblock.js|friendlytalkback.js

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
[User:AzaToth/twinkle.js]: https://en.wikipedia.org/wiki/User:AzaToth/twinkle.js
[MediaWiki:Gadget-morebits.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.js
[MediaWiki:Gadget-morebits.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.css
[MediaWiki:Gadgets-definition]: https://en.wikipedia.org/wiki/MediaWiki:Gadgets-definition
[Git::Repository]: http://search.cpan.org/perldoc?Git%3A%3ARepository
[MediaWiki::Bot]: http://search.cpan.org/perldoc?MediaWiki%3A%3ABot
[App::cpanminus]: http://search.cpan.org/perldoc?App%3A%3Acpanminus
[jq_style]: http://contribute.jquery.org/style-guide/js/
