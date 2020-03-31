/* global Morebits */
/* eslint-disable no-redeclare, brace-style, no-console */


/**
 * Snippets of testing code that you can copy-paste into the console.
 * TODO: Convert to unit tests?
 */

(function() {

// callbacks passed in constructor:
var successCallback = function() {
	console.log('callback-onSuccess', this, arguments);
};
var failureCallback = function() { console.log('callback-onFailure', this, arguments); };

// promise callbacks:
var doneCallback = function() { console.log('done', this, arguments); };
var thenCallback = function() { console.log('then', this, arguments); };
var failCallback = function() { console.log('fail', this, arguments); };
var catchCallback = function() { console.log('catch', this, arguments); };
var alwaysCallback = function() { console.log('always', this, arguments); };


/** Creates a simple window that shows Morebits status messages */
var initStatusWindow = function() {
	if ($('#morebits-dialog-content').length && !Morebits.status.root) {
		Morebits.status.init($('#morebits-dialog-content')[0]);
	} else {
		var w = new Morebits.simpleWindow(600, 600);
		w.display();
		Morebits.status.init(w.content);
	}
};


// MOREBITS.WIKI.API

initStatusWindow();

/* disable internet from the network tab to trigger the other type of error */
var apiobj = new Morebits.wiki.api(
	'',
	{
		action: 'query', /* change to something random to make the API return an error */
		titles: 'Main Page'
	},
	successCallback, null, failureCallback
).post();

apiobj.then(thenCallback);
apiobj.done(doneCallback);
apiobj.fail(failCallback);
apiobj.catch(catchCallback);
apiobj.always(alwaysCallback);

/**
 * Chainings: note on jQuery deferred handler types:
 * .then() and .catch() return *new* promises, that may be resolved or rejected, according to
 * the return value of the function in the handler
 * .done() and .fail() simply return the original promise, regardless of what the function within
 * the handler returns
 */
apiobj.then(thenCallback).fail(failCallback).always(alwaysCallback);
apiobj.catch(catchCallback).then(thenCallback).always(alwaysCallback);


// MOREBITS.WIKI.PAGE:


/** Load */

var p1 = new Morebits.wiki.page(Morebits.pageNameNorm);
p1.save(successCallback, failureCallback).done(doneCallback).then(function() {
	console.log(p1.getPageText());
}).fail(failCallback);


var p2 = new Morebits.wiki.page('<scrip'); // invalid page name
p2.save(successCallback, failureCallback).done(doneCallback).fail(failCallback);

/** Save */

initStatusWindow();

// save without edit summary
var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Trying to save w/o edit sum');
p1.load().then(function() {
	var text = p1.getPageText() + '\n\nxxxxxx';
	p1.setPageText(text);
	p1.save(successCallback, failureCallback).done(doneCallback).fail(failCallback);
});

// API error (save on non-existing page with nocreate option)
// Unrecoverable error
var p2 = new Morebits.wiki.page('Morebits-test/' + Math.random(), 'Trying save (should give API error)');
p2.load().then(function() {
	p2.setPageText(p2.getPageText() + '\n\nxxxx');
	p2.setEditSummary('test (morebits.js)');
	p2.setCreateOption('nocreate');
	p2.save(successCallback, failureCallback).done(doneCallback).fail(failCallback);
});

// save (should succeed)
var p3 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Editing current page');
p3.load().then(function() {
	var text = p3.getPageText() + '\n\nxxxxxx';
	p3.setPageText(text);
	p3.setEditSummary('test (morebits.js)');
	p3.save(successCallback, failureCallback).done(doneCallback).fail(failCallback);
});

// to test notoken error, do the above, but after modifying the code:
// remove the token property in query object in this.save.


/** Prepend, Append */

initStatusWindow();

var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Prepending');
p1.setPrependText('xxxxx\n\n');
p1.setEditSummary('test prepend (morebits.js)');
p1.prepend(successCallback, failureCallback).done(doneCallback).fail(failCallback);

var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Appending');
p1.setAppendText('\n\nxxxxx');
p1.setEditSummary('test append (morebits.js)');
p1.append(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// try this on protected and non-protected pages to test both code paths in this.append()
// gives unrecoverable error articleexists
var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Appending');
p1.setAppendText('\n\nxxxxx');
p1.setCreateOption('createonly');
p1.setEditSummary('test append (morebits.js)');
p1.append(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// append with error
var p1 = new Morebits.wiki.page('Morebits-test/' + Math.random(), 'Appending');
p1.setAppendText('\n\nxxxxx');
p1.setCreateOption('nocreate');
p1.setEditSummary('test append (morebits.js)');
p1.append(successCallback, failureCallback).done(doneCallback).fail(failCallback);


/** Revert */

var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Reverting');
p1.setOldID('410977');
p1.load().then(function() {
	p1.setEditSummary('test revert (morebits.js)');
	p1.revert();
});


/** Lookup creation */

initStatusWindow();

var p1 = new Morebits.wiki.page(Morebits.pageNameNorm);
p1.lookupCreation(function() {
	console.log('First revision creator', p1.getCreator());
	console.log('Creation timestamp: ' + p1.getCreationTimestamp());
});
var p2 = new Morebits.wiki.page(Morebits.pageNameNorm);
p2.setLookupNonRedirectCreator(true);
p2.lookupCreation(function() {
	console.log('First non-redirect revision creator: ' + p2.getCreator());
});


/** Delete page */

initStatusWindow();

// action fails in this.deletePage
var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Trying to delete without edit summary');
p1.deletePage(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action fails in fnProcessDelete
var nonExistingPageName = 'Morebits-test/' + Math.random(); // Lord be damned if that page exists
var p2 = new Morebits.wiki.page(nonExistingPageName, 'Trying to delete non-existent page (delete after fetching token)');
p2.setEditSummary('test');
p2.deletePage(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action fails in fnProcessDeleteFailure
var p3 = new Morebits.wiki.page(nonExistingPageName, 'Trying to delete non-existent page (direct deletion with local token)');
p3.suppressProtectWarning();
p3.setEditSummary('test');
p3.deletePage(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action succeeds
var testPageName = 'User:Morebits-test/' + Math.random();
var p4 = new Morebits.wiki.page(testPageName, 'Testing deletion (should succeed)');
p4.setAppendText('Page for testing deletion by morebits.js'); // create the page first
p4.setEditSummary('Creating test page for deletion');
p4.append(function() {
	p4.setEditSummary('Testing deletion (morebits.js)');
	p4.deletePage(successCallback, failureCallback).done(doneCallback).fail(failCallback);
});


/** Move page */

initStatusWindow();

// action fails in this.move
var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Trying to move page without setting destination');
p1.move(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action fails in fnProcessMove
var p2 = new Morebits.wiki.page('Morebits-test/' + Math.random(), 'Trying to move non-existent page');
p2.setEditSummary('test');
p2.setMoveDestination('xxxxx');
p2.move(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action fails server-side
var p3 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Trying to move (should give API error)');
p3.setEditSummary('test');
p3.setMoveDestination('de:xxxxx'); // invalid title to trigger API error
p3.move(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action succeeds
var p4 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Trying to move current page (should succeed)');
p4.setEditSummary('test (morebits.js)');
p4.setMoveDestination(p3.getPageName() + '/1');
p4.move(successCallback, failureCallback).done(doneCallback).fail(failCallback);

/** Protect page */

initStatusWindow();

// action fails in this.protect
var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Testing protection (without edit sum)');
p1.protect(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// actions fails in fnProcessProtect
var p2 = new Morebits.wiki.page('Morebits-test/' + Math.random(), "Testing protection (page doesn't exist");
p2.setEditSummary('test (morebits.js)');
p2.setEditProtection('sysop', 'infinite');
p2.protect(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action fails server-side
var p3 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Testing protection (API error: past expiry)');
p3.setEditSummary('test (morebits.js)');
p3.setEditProtection('sysop', '2012-09-28');
p3.protect(successCallback, failureCallback).done(doneCallback).fail(failCallback);

// action succeeds
var p4 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Testing protection (should succeed)');
p4.setEditSummary('test (morebits.js)');
p4.setEditProtection('sysop', 'infinite');
p4.protect(successCallback, failureCallback).done(doneCallback).fail(failCallback);



})();
