Twinkle
=======

Twinkle is a JavaScript library and application that gives Wikipedians a quick way of performing common maintenance tasks, such as nominating pages for deletion and cleaning up vandalism.

It is based upon the `morebits.js` library, which forms the basis for many Wikipedia scripts and editing tools.

See [Wikipedia:Twinkle][] on English Wikipedia for more information.

[AzaToth][] is the original author and maintainer of the tool, as well as the `morebits.js` library.

Synchronization
---------------

There is a synchronization script called `sync.pl`, which can be used to pull and push files to wikipedia. 

The program depends on Perl 5.10 and the modules [`Git::Repository`][Git::Repository] and [`Mediawiki::Bot`][Mediawiki::Bot], which can be installed easy using [`App::cpanminus`][App::cpanminus]:

    cpanm -sudo install Git::Repository Mediawiki::Bot

When running the program, you can either enter your credentials on the command line using the `--username` and `--password` parameters, but it is recommended to save them in a file called `~/.mwbotrc` using following format:

    username => "Username",
    password => "password",
    base     => "User::Username"

where `base` is the wiki path to prefix the files for `pull` and `push`;

Notice that your working directory **must** be clean, if not, either `stash` or `commit` your changes.

To `pull` user Foobar's changes, do:

    ./sync.pl --base User:Foobar --push morebits.js 

To `push` your changes to Foobar's wiki page, do:

    ./sync.pl --base User:Foobar --pull morebits.js 

The edit summary will contain the `branch`, the last `commit sha`, and the `oneliner` for that commit.

Style Guideline
---------------

While old legacy code has many different and inhorerent styles, it's decided to utilize a more coherent style through the code.

The [jQuery Core Style Guideline][jq_style] is what we will hereafter use as our style guideline.

[Wikipedia:Twinkle]: http://en.wikipedia.org/wiki/Wikipedia:Twinkle
[AzaToth]: http://en.wikipedia.org/wiki/User:AzaToth
[Git::Repository]: http://search.cpan.org/~book/Git-Repository-1.17/lib/Git/Repository.pm
[Mediawiki::Bot]: http://search.cpan.org/~lifeguard/MediaWiki-Bot-3.2.7/lib/MediaWiki/Bot.pm
[App::cpanminus]: http://search.cpan.org/~miyagawa/App-cpanminus-1.4001/lib/App/cpanminus.pm
[jq_style]: http://docs.jquery.com/JQuery_Core_Style_Guidelines
