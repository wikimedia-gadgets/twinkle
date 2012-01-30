Twinkle
=======

Twinkle is a JavaScript library and application that gives Wikipedians a quick way of performing common maintenance tasks, such as nominating pages for deletion and cleaning up vandalism.

It is based upon the `morebits.js` library, which forms the basis for many Wikipedia scripts and editing tools.

See [Wikipedia:Twinkle][] on the English Wikipedia for more information.

[AzaToth][] is the original author and maintainer of the tool, as well as the `morebits.js` library.

Updating scripts on Wikipedia
-----------------------------

To generate the concatenated Twinkle script, use the following `bash` command:

    awk 'FNR==1{print ""}{print}' twinkle.header.js modules/*.js twinkle.footer.js > alltwinkle.js

Then you will be able to upload `alltwinkle.js` to [MediaWiki:Gadget-Twinkle.js][]. This does not include `morebits.js` and `morebits.css`; these have to be uploaded separately.

If `morebits.js` and/or `morebits.css` need to be updated, they should be synched to these places:

* _morebits.js_ at [MediaWiki:Gadget-morebits.js][] and [User:AzaToth/morebits.js][]
* _morebits.css_ at [MediaWiki:Gadget-morebits.css][] and [User:AzaToth/morebits.css][]

[MediaWiki:Gadgets-definition][] should contain the following line:

    * Twinkle[ResourceLoader|dependencies=jquery.ui.dialog,jquery.tipsy]|morebits.js|morebits.css|Twinkle.js

Synchronization (for developers)
--------------------------------

There is a synchronization script called `sync.pl`, which can be used to pull and push files to Wikipedia. 

The program depends on Perl 5.10 and the modules [`Git::Repository`][Git::Repository] and [`MediaWiki::Bot`][MediaWiki::Bot], which can be installed easily using [`App::cpanminus`][App::cpanminus]:

    cpanm --sudo install Git::Repository MediaWiki::Bot

When running the program, you can enter your credentials on the command line using the `--username` and `--password` parameters, but it is recommended to save them in a file called `~/.mwbotrc` using the following format:

    username => "Username",
    password => "password",
    base     => "User::Username"

where `base` is the wiki path to prefix the files for `pull` and `push`.

Notice that your working directory **must** be clean; if not, either `stash` or `commit` your changes.

To `pull` user Foobar's changes, do:

    ./sync.pl --base User:Foobar --pull morebits.js

To `push` your changes to Foobar's wiki page, do:

    ./sync.pl --base User:Foobar --push morebits.js

There is also an `deploy` command to deploy the new files live.

    ./sync.pl --deploy twinkle.js
    make deploy

The edit summary will contain the branch, the last commit sha, and the oneliner for that commit.

Style guideline
---------------

While old legacy code has many different and incoherent styles, it has been decided to utilize a more coherent style throughout the code.

The [jQuery Core Style Guideline][jq_style] is what we will hereafter use as our style guideline.

[Wikipedia:Twinkle]: http://en.wikipedia.org/wiki/Wikipedia:Twinkle
[AzaToth]: http://en.wikipedia.org/wiki/User:AzaToth
[MediaWiki:Gadget-Twinkle.js]: http://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle.js
[User:AzaToth/twinkle.js]: http://en.wikipedia.org/wiki/User:AzaToth/twinkle.js
[MediaWiki:Gadget-morebits.js]: http://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.js
[User:AzaToth/morebits.js]: http://en.wikipedia.org/wiki/User:AzaToth/morebits.js
[MediaWiki:Gadget-morebits.css]: http://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.css
[User:AzaToth/morebits.css]: http://en.wikipedia.org/wiki/User:AzaToth/morebits.css
[MediaWiki:Gadgets-definition]: http://en.wikipedia.org/wiki/MediaWiki:Gadgets-definition
[Git::Repository]: http://search.cpan.org/~book/Git-Repository-1.17/lib/Git/Repository.pm
[Mediawiki::Bot]: http://search.cpan.org/~lifeguard/MediaWiki-Bot-3.2.7/lib/MediaWiki/Bot.pm
[App::cpanminus]: http://search.cpan.org/~miyagawa/App-cpanminus-1.4001/lib/App/cpanminus.pm
[jq_style]: http://docs.jquery.com/JQuery_Core_Style_Guidelines
