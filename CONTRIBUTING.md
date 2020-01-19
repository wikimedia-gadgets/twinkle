# Contributing to Twinkle

:tada::tada: Thanks for taking the time to contribute! :tada::tada:

There are many ways to help out!

## Bug reports and feature requests

If you think you've found a bug or have a great idea for a new feature, great!  You can [open a new GitHub issue here](https://github.com/azatoth/twinkle/issues/new) (GitHub account required) or report it at [Wikipedia talk:Twinkle][].  Bigger changes or more complicated requests should be made on-wiki so other users can take part in the discussion of your feature proposal.  If you're unsure if something is a bug, other editors may be able to help identify the issue.  Be sure to search the talk page archives and GitHub issues to see if your request has already been discussed in the past.

Whatever the case, the more detailed your description the easier it will be to respond to your report or request.

### Reporting a bug

A good bug report will include:
- A brief, descriptive title that mentions the module you were using (tag, CSD, xfd, etc.).
- The steps leading up to the issue so we can replicate it.  This should include the page and revision you were on, the action you were performing, and the options you selected.
- Any errors or messages that Twinkle reported an error when it got stuck.
- What you think *should* have happened.
- Anything you can find in your [browser's console window][jserrors].

If you believe you have found a security issue, follow the guidelines in [SECURITY.md](./SECURITY.md).

## Contributing a pull request
### Getting started

If you'd like to help with Twinkle's development, wonderful!  Anyone can contribute, and it's easy to get set up to do so.

First, familiarize yourself with the code; most likely, the changes you want are to one of the [modules](./modules); you can also check out the [individual Gadget pages][twinkle_gadget] onwiki.  If you want to propose changes yourself, [fork the repository](https://help.github.com/articles/fork-a-repo/) to make sure you always have the latest versions.  If you're new to GitHub or Git in general, you probably want to read [Getting started with GitHub](https://help.github.com/en/github/getting-started-with-github) first.

Once you've got a local fork up and running, commit your changes!


### Testing your code

Testing Twinkle can be tricky, but the most straightforward way to test your code is to open up your [browser's console window][jserrors] and paste in your new code.  You'll have to load the new version by running the corresponding function in your console, e.g., `Twinkle.protect()` for twinkleprotect.js.

Some things to watch out for:
- If your tests have any chance of making actual edits, consider making them in a sandbox; be aware that some things may not work properly outside the appropriate namespace.  An even better place to test is on the [test wiki](http://test.wikipedia.org)!  Some parts of Twinkle rely on specific template code or on certain wiki-preferences, so testing certain things outside of enWiki may be difficlut (e.g., pending changes).
- The non-module scripts `morebits.js` and `twinkle.js` are usually more complicated to test.
- The `twinkleconfig` pseudo-module holds the code to save and determine user preferences, while `twinkle.js` holds the defaults.
- There is some variety in how the individual modules are written, in particular among the `friendly` family as well as with `twinkleconfig.js`.

As Twinkle is used many thousands of times a day, changes to how Twinkle works may be confusing or disruptive to editors.  Significant or major changes to workflow, design, or functionality should gain some modicum of consensus before being proposed or suggested, either through discussion at [Wikipedia talk:Twinkle][] or elsewhere.


### Submitting your pull request

When you are ready to submit, commit your changes on a new branch, then [initiate a pull request (PR)](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork).  The title of your pull request should be the module you are proposing changes to, followed by a brief but descriptive explanation of what the changes do, such as:

    xfd: Prevent sysops from deleting the main page

The usual rule of thumb is that a good subject line will complete the sentence "*If applied, this commit will...*"  The full commit message is a good place to explain further details, both for reviewers and anyone in the future, specifically focusing on *why* the changes are being made, not *how*.  There are many guides to writing good commit messages, one particularly helpful one is by @cbeams: https://chris.beams.io/posts/git-commit/

If you made multiple commits while working on the same feature, it's a good idea to [squash and rebase your commits](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History) before submitting your PR; a good policy is that every commit should be capable of replacing the live on-wiki Gadget file for all users.  Separate ideas or enhancements should be different commits, and entirely separate concepts should be different pull requests.  For example, if you made three commits while changing the pulldown options in `twinkleprotect.js` and `twinklebatchprotect.js`, those should be squashed into one commit, but if you also disabled loading `twinklespeedy.js` and `twinklexfd.js` on the mainpage, that should be a separate pull request.  See also [how to file a bug report or feature request](README.md#how-to-file-a-bug-report-or-feature-request).


### Style guideline

For consistency and to cut down on potential errors, we've recently decided to utilize a more coherent style throughout the code.  [eslint][eslint.org] can be used to check your code before submission and even repair many common issues.  To install via `npm`, just run `npm install` from the main Twinkle directory in your terminal.  You can then freely check your code by running `npm run lint`, and if you run `npm run lint:fix` then `eslint` will clean up some (but not all!) style differences.  More information on specific style rules can be seen in [issue #500][fivehundred] and in `.eslintrc.json`, but the best advice is to just follow the style of surrounding code!  Some specific examples and deviations are elucidated below.

- Quotes: Single quotes should be used around strings, such as when using `mw.config.get('wgUserName')`
- Spacing: `if (condition) {`
- Each: The `array.forEach(function(item) {` method is preferable to `$.each(array, function(index, item) {`


## Expectations of Participants

Everyone is welcome and encouraged to join in, regardless of experience.  Anybody submitting issues, code, reviews, or comments to the repository is expected to do so while complying with the principles of Wikimedia's [Code of Conduct for technical spaces][conduct].

[Wikipedia talk:Twinkle]: https://en.wikipedia.org/wiki/Wikipedia_talk:Twinkle
[jserrors]: https://en.wikipedia.org/wiki/Wikipedia:Reporting_JavaScript_errors
[twinkle_gadget]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle/Gadget
[Wikipedia:Twinkle]: https://en.wikipedia.org/wiki/Wikipedia:Twinkle
[eslint.org]: https://eslint.org/
[fivehundred]: https://github.com/azatoth/twinkle/issues/500
[conduct]: https://www.mediawiki.org/wiki/Code_of_Conduct
