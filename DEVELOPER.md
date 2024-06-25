# Helpful information for Twinkle devs

## Reviewing and merging pull requests (WIP)

Collaborators are encouraged to thoroughly review and [test](./CONTRIBUTING.md#testing-your-code) each pull request, including their own. Unless urgent or obvious, it can be helpful to leave PRs open for folks to opine.

Things to watch out for:

- Items and processes laid out in [CONTRIBUTING.md](./CONTRIBUTING.md) are followed.
- Twinkle is meant to run on the latest weekly version of MediaWiki as rolled out every Thursday on the English Wikipedia. Backwards compatibility is not guaranteed.
- The goal is for Twinkle and Morebits to support the same [browsers for which MediaWiki provides Grade A support](https://www.mediawiki.org/wiki/Browser_compatibility), except IE 11. The Twinkle gadget on enwiki is configured so that we can use up to JavaScript version ES6. However, due to the MediaWiki minifier, we must not use keywords from ES2016 or later, such as async/await and RegEx /s flag. New functions from ES2016 or later, such as Array.includes() should be okay since these will not break the minifier.
- Certain positional jQuery selectors like `:first`, `:last`, and `:eq` were [deprecated in jQuery version 3.4.0](https://blog.jquery.com/2019/04/10/jquery-3-4-0-released/) and should probably not be reintroduced. Instead, use methods like `.first()`, `.last()`, or `.eq()`.

## Updating scripts on Wikipedia

There are two ways to upload Twinkle scripts to Wikipedia or another destination. You can do it with a [Perl script](#synchronization-using-syncpl) (recommended) or [manually](#manual-synchronization).

After the files are synced, ensure that [MediaWiki:Gadgets-definition][] contains the gadget definition found in [gadget.txt](./gadget.txt) (`sync.pl` will report its status). In addition to the `Twinkle` definition, the gadget installs the `morebits` library as a hidden gadget, making it efficiently available for other tools to use. `Twinkle-pagestyles` is a hidden [peer gadget](https://www.mediawiki.org/wiki/ResourceLoader/Migration_guide_(users)#Gadget_peers) of Twinkle. Before Twinkle has loaded, it adds space where the TW menu would go in the Vector skin, so that the top bar does not "jump".

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
- `modules/twinkleprod.js` &rarr; [MediaWiki:Gadget-twinkleprod.js][]
- `modules/twinkleimage.js` &rarr; [MediaWiki:Gadget-twinkleimage.js][]
- `modules/twinklebatchundelete.js` &rarr; [MediaWiki:Gadget-twinklebatchundelete.js][]
- `modules/twinklewarn.js` &rarr; [MediaWiki:Gadget-twinklewarn.js][]
- `modules/twinklespeedy.js` &rarr; [MediaWiki:Gadget-twinklespeedy.js][]
- `modules/friendlyshared.js` &rarr; [MediaWiki:Gadget-friendlyshared.js][]
- `modules/twinklediff.js` &rarr; [MediaWiki:Gadget-twinklediff.js][]
- `modules/twinkleunlink.js` &rarr; [MediaWiki:Gadget-twinkleunlink.js][]
- `modules/friendlytag.js` &rarr; [MediaWiki:Gadget-friendlytag.js][]
- `modules/twinkledeprod.js` &rarr; [MediaWiki:Gadget-twinkledeprod.js][]
- `modules/friendlywelcome.js` &rarr; [MediaWiki:Gadget-friendlywelcome.js][]
- `modules/twinklexfd.js` &rarr; [MediaWiki:Gadget-twinklexfd.js][]
- `modules/twinklebatchdelete.js` &rarr; [MediaWiki:Gadget-twinklebatchdelete.js][]
- `modules/twinklebatchprotect.js` &rarr; [MediaWiki:Gadget-twinklebatchprotect.js][]
- `modules/twinkleconfig.js` &rarr; [MediaWiki:Gadget-twinkleconfig.js][]
- `modules/twinklerollback.js` &rarr; [MediaWiki:Gadget-twinklerollback.js][]
- `modules/twinkleprotect.js` &rarr; [MediaWiki:Gadget-twinkleprotect.js][]
- `modules/twinklearv.js` &rarr; [MediaWiki:Gadget-twinklearv.js][]
- `modules/friendlytalkback.js` &rarr; [MediaWiki:Gadget-friendlytalkback.js][]
- `modules/twinkleblock.js` &rarr; [MediaWiki:Gadget-twinkleblock.js][]

### Synchronization using `sync.pl`

There is a synchronization script called `sync.pl`, which can be used to deploy updates to on-wiki gadgets, or update the repository based on on-wiki changes. For full details, run `perl sync.pl --help`.

The program depends on a few Perl modules, namely [`MediaWiki::API`][MediaWiki::API], [`Git::Repository`][Git::Repository], [`File::Slurper`][File::Slurper], and [`Config::General`][Config::General]. These can be installed easily using [`App::cpanminus`][App::cpanminus]:

    cpanm install MediaWiki::API Git::Repository File::Slurper Config::General

You may prefer to install them through your operating system's packaing tool (e.g. `apt-get install libconfig-general-perl`) although you can install them through cpanm too.

When running the program, you can enter your credentials on the command line using the `--username` and `--password` parameters, but it is recommended to save them in a `.twinklerc` file, either in this directory or in your `~` home, using the following format (also the defaults):

    username = username
    password = password
    mode     = deploy|push|pull
    lang     = en
    family   = wikipedia
    url      =
    base     = User:AzaToth/

`username`, `password`, and `mode` (one of `deploy`, `push`, or `pull`) are required, either through the command line or configuration file; lang and family default to `en.wikipedia`. Note that your working directory **must** be clean; if not, either `stash` or `commit` your changes. The script automatically handles the directory (e.g. `modules/`) from the file path when downloading/uploading. It can be run from any subdirectory of the repository.

Using the `deploy` mode, [interface-admins][intadmin] can deploy Twinkle files live to their MediaWiki:Gadget locations. You will need to set up a bot password at [Special:BotPasswords][special_botpass].

    sync.pl --mode=deploy twinkle.js morebits.js ...

If no files are provided, it will just report the status of the gadget. You may also `deploy` **all** files via

    sync.pl --mode=deploy --all

Note that for syncing to a non-Enwiki project, you will also need to specify the --lang and/or --family parameters. For instance, to sync the files with `fr.wikiquote.org` you should specify `--lang=fr --family=wikiquote`, such as

    sync.pl --mode=deploy --lang=fr --family=wikiquote --all

When `deploy`ing or `push`ing, the script will attempt to parse the latest on-wiki edit summary for the commit of the last update, and will use that to create an edit summary using the changes committed since then. If it cannot find anything that looks like a commit hash, it will give you the most recent commits for each file and prompt you to enter an edit summary manually.

To `pull` user Foobar's changes (i.e. `User:Foobar/morebits.js`) down from the wiki, do:

    sync.pl --base User:Foobar/ --mode=pull twinkle.js morebits.js ...

To `push` your changes to user Foobar's wiki page, do:

    sync.pl --base User:Foobar/ --mode=push twinkle.js morebits.js ...

The `--base` flag operates as a *prefix*; note the presence of the trailing `/`.

[MediaWiki:Gadgets-definition]: https://en.wikipedia.org/wiki/MediaWiki:Gadgets-definition
[MediaWiki:Gadget-Twinkle.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle.js
[MediaWiki:Gadget-Twinkle.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle.css
[MediaWiki:Gadget-Twinkle-pagestyles.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-Twinkle-pagestyles.css
[MediaWiki:Gadget-morebits.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.js
[MediaWiki:Gadget-morebits.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-morebits.css
[MediaWiki:Gadget-select2.min.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-select2.min.js
[MediaWiki:Gadget-select2.min.css]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-select2.min.css
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
[MediaWiki:Gadget-twinklerollback.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklerollback.js
[MediaWiki:Gadget-twinkleprotect.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleprotect.js
[MediaWiki:Gadget-twinklearv.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinklearv.js
[MediaWiki:Gadget-friendlytalkback.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-friendlytalkback.js
[MediaWiki:Gadget-twinkleblock.js]: https://en.wikipedia.org/wiki/MediaWiki:Gadget-twinkleblock.js
[select2]: https://github.com/select2/select2
[MediaWiki::API]: https://metacpan.org/pod/MediaWiki::API
[Git::Repository]: https://metacpan.org/pod/Git::Repository
[File::Slurper]: https://metacpan.org/pod/File::Slurper
[Config::General]: https://metacpan.org/pod/Config::General
[App::cpanminus]: https://metacpan.org/pod/App::cpanminus
[intadmin]: https://en.wikipedia.org/wiki/Wikipedia:Interface_administrators
[special_botpass]: https://en.wikipedia.org/wiki/Special:BotPasswords

#### Work instruction

If you are an interface admin on English Wikipedia and you want to deploy Twinkle's master branch, and you aren't interested in sync.pl's fancy options, here's a simple work instruction. Don't forget to change the username and password.

Microsoft Windows:
```
First time:
- download and install strawberry perl. https://strawberryperl.com/
- open powershell
- `cd` to your twinkle/scripts directory
- `cpanm install MediaWiki::API File::Slurper Config::General`
- `cpanm install Git::Repository --force`
- create a bot password at [[Special:BotPasswords]] with the following permissions: edit existing pages; edit the mediawiki namespace and sitewide/user json; edit sitewide and user css/js; create, edit and move pages
- create a file called .twinklerc in the root directory. populate it with the following data

username = yourUsernameHere (as provided by Special:BotPasswords, should have @ in it)
password = yourPasswordHere
mode     = deploy
lang     = en
family   = wikipedia
url      =
base     = MediaWiki:Gadget-

Every time:
- `cd` to your twinkle directory
- `git checkout master`
- In your browser, go to GitHub, go to your Twinkle fork, and check if it says it is out of date. If so, click "Sync fork"
- `git pull`
- `cd scripts`
- `perl sync.pl --mode=deploy --all`
- it'll ask yes/no. type y
- if it prompts you for any edit summaries, just hit enter to skip
- there will be lots of "Warning: unable to close filehandle" messages, and some other problems such as displaying ←[0m←[96m for line breaks. you can ignore these. shouldn't be a problem.
```

### Dependencies

All the dependencies that Twinkle uses are JavaScript **dev** dependencies. They are not used at all on-wiki and are just used during development. Here's what they are and what they do. This may help with evaluating dependabot patches (dependabot is a GitHub bot that helps keep libraries up to date by submitting pull requests).

- eslint - Used by continuous integration for enforcing code linting rules.
- jest - Used by continuous integration for unit testing.
- jest-environment-jsdom - Needed for Jest to work.
- mock-mediawiki - Used by continuous integration for unit testing.
- mwn - Used when you run `npm start`. `npm start` is what enables localhost testing.
- Everything else - Dependabot will not usually try to update these unless one of the 5 above dependencies gets out of date. It is probably best to update the above dependencies instead.
