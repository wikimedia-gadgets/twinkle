/* globals it, describe, before, Morebits */

var expect = window.chai.expect;

describe('Morebits.wiki.api', function() {

	var successApiCallback = function() {
		expect(this).to.equal(window);
		expect(arguments).to.be.of.length(1);
		expect(arguments[0]).to.be.instanceOf(Morebits.wiki.api);
	};

	var failApiCallback = function() {
		expect(this).to.equal(window);
		expect(arguments).to.be.of.length(1);
		expect(arguments[0]).to.be.instanceOf(Morebits.wiki.api);
	};

	before(function() {
		return mw.loader.getScript('http://127.0.0.1:5500/morebits.js');
	});

	it('success callback works correctly', function(done) {
		new Morebits.wiki.api('', {action: 'query', titles: 'Main Page'},
			function onSuccess() {
				successApiCallback.apply(this, arguments);
				done();
			}).post();
	});
	it('then promise callback works correctly', function(done) {
		var apiobj = new Morebits.wiki.api('', {action: 'query', titles: 'Main Page'}).post();
		apiobj.then(function() {
			successApiCallback.apply(this, arguments);
			done();
		});
	});
	it('done promise callback works correctly', function(done) {
		var apiobj = new Morebits.wiki.api('', {action: 'query', titles: 'Main Page'}).post();
		apiobj.done(function() {
			successApiCallback.apply(this, arguments);
			done();
		});
	});

	it('works correctly when both a success callback and a promise callback are given', function(done) {

		// Variable to test execution order. The callback passed in the constructor
		// executes first, then the promise callbacks
		var key = 42;

		new Morebits.wiki.api('', {action: 'query', titles: 'Main Page'},
			function onSuccess() {
				expect(key).to.equal(42);
				key = 84;
				successApiCallback.apply(this, arguments);
			}).post()
			.then(function() {
				expect(key).to.equal(84);
				successApiCallback.apply(this, arguments);
				done();
			});
	});

	it('works correctly even when a success callback and multiple promise callbacks are given', function(done) {
		this.timeout(3000);

		new Morebits.wiki.api('', {action: 'query', titles: 'Main Page'},
			function onSuccess() {
				successApiCallback.apply(this, arguments);
			}).post()
			.then(function() {
				successApiCallback.apply(this, arguments);
			})
			.done(function() {
				successApiCallback.apply(this, arguments);
			});

		// Call done after 2 seconds by which time the above should have finished.
		// I don't know whether then() or done() callback is executed first, or even
		// if it is deterministic.
		setTimeout(function() {
			done();
		}, 2000);
	});

	it('failure callback works correctly', function(done) {

		// trigger API error by using unrecognised action
		new Morebits.wiki.api('', {action: 'qwerrwqer', titles: 'Main Page'}, null, null, function onFailure() {
			failApiCallback.apply(this, arguments);
			done();
		}).post();
	});
	it('fail promise callback works correctly', function(done) {
		new Morebits.wiki.api('', {action: 'qwerrwqer', titles: 'Main Page'}).post()
			.fail(function() {
				failApiCallback.apply(this, arguments);
				done();
			});
	});
	it('catch promise callback works correctly', function(done) {
		new Morebits.wiki.api('', {action: 'qwerrwqer', titles: 'Main Page'}).post()
			.catch(function() {
				failApiCallback.apply(this, arguments);
				done();
			});
	});

	it('works correctly when both a failure callback and a promise callback are given', function(done) {

		// Variable to test execution order. The callback passed in the constructor
		// executes first, then the promise callbacks
		var key = 42;

		new Morebits.wiki.api('', {action: 'qwerrwqer', titles: 'Main Page'},
			null, null,
			function onFailure() {
				expect(key).to.equal(42);
				key = 84;
				successApiCallback.apply(this, arguments);
			}).post()
			.catch(function() {
				expect(key).to.equal(84);
				successApiCallback.apply(this, arguments);
				done();
			});
	});

});

// These tests modify the wiki.
// To skip these, change `describe` below to `describe.skip`
describe('Morebits.wiki.page', function() {
	this.timeout(3000);

	var successPageCallback = function() {
		expect(this).to.be.instanceOf(Morebits.wiki.page);
		expect(arguments).to.of.length(1);
		expect(arguments[0]).to.be.instanceOf(Morebits.wiki.page);
	};

	var failPageCallback = function() {
		expect(this).to.be.instanceOf(Morebits.wiki.page);
		expect(arguments).to.of.length(3);
		expect(arguments[0]).to.be.instanceOf(Morebits.wiki.page);
		expect(arguments[1]).to.be.a('string');
		expect(arguments[2]).to.be.a('string');
	};

	var notExecuted = function() {
		expect(2 + 2).to.equal(5); // make mocha throw if possible
		throw new Error('This shouldn\'t have executed, wtf?');
	};

	before(function() {
		return mw.loader.getScript('http://127.0.0.1:5500/morebits.js');
	});

	/** Load */

	it('loads a page', function(done) {
		var p1 = new Morebits.wiki.page(Morebits.pageNameNorm);
		p1.load(function() {
			successPageCallback.apply(this, arguments);
			done();
		});
	});

	it('fails to load a page with bad name', function(done) {
		var p2 = new Morebits.wiki.page('<scrip'); // invalid page name
		p2.load(notExecuted, failPageCallback).fail(function() {
			failPageCallback.apply(this, arguments);
			done();
		});
	});

	/** Save */

	var userSandbox = 'User:' + mw.config.get('wgUserName') + '/sandbox';

	it("can't save without an edit summary", function(done) {
		var p1 = new Morebits.wiki.page(userSandbox, 'Trying to save w/o edit sum');
		p1.load().then(function() {
			var text = p1.getPageText() + '\n\nxxxxxx';
			p1.setPageText(text);
			p1.save(notExecuted, failPageCallback)
				.fail(function(pageobj, errorCode) {
					expect(errorCode).to.equal('int-noreason');
					failPageCallback.apply(this, arguments);
					done();
				});
		});
	});

	it('correctly reports API errors on save', function(done) {
		// API error (save on non-existing page with nocreate option)
		// Unrecoverable error
		var p2 = new Morebits.wiki.page('Morebits-test/' + Math.random(), 'Trying save (should give API error)');
		p2.load().then(function() {
			p2.setPageText(p2.getPageText() + '\n\nxxxx');
			p2.setEditSummary('test (morebits.js)');
			p2.setCreateOption('nocreate');
			p2.save(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
				.catch(function(pageobj, errorCode) {
					expect(errorCode).to.equal('missingtitle');
					failPageCallback.apply(this, arguments);
					done();
				});
		});
	});

	it('edits a page (user sandbox)', function(done) {
		var p3 = new Morebits.wiki.page(userSandbox, 'Editing sandbox');
		p3.load().then(function() {
			var text = p3.getPageText() + '\n\nxxxxxx';
			p3.setPageText(text);
			p3.setEditSummary('test (morebits.js)');
			p3.save(successPageCallback, notExecuted).done(successPageCallback).fail(notExecuted)
				.then(function() {
					done();
				});
		});
	});


	/** Prepend, Append */

	it('successfully prepends to a sandbox', function(done) {
		var p1 = new Morebits.wiki.page(userSandbox, 'Prepending');
		p1.setPrependText('xxxxx\n\n');
		p1.setEditSummary('test prepend (morebits.js)');
		p1.prepend(successPageCallback, notExecuted).done(successPageCallback).fail(notExecuted)
			.then(function() {
				successPageCallback.apply(this, arguments);
				done();
			});
	});

	it('successfully appends to a sandbox', function(done) {
		var p1 = new Morebits.wiki.page(userSandbox, 'Appending');
		p1.setAppendText('xxxxx\n\n');
		p1.setEditSummary('test append (morebits.js)');
		p1.append(successPageCallback, notExecuted).done(successPageCallback).fail(notExecuted)
			.then(function() {
				successPageCallback.apply(this, arguments);
				done();
			});
	});

	it('fails to edit an existing page with createonly=1 (non-protected page)', function(done) {
		var p1 = new Morebits.wiki.page('Wikipedia:Twinkle/ExampleNonProtectedPage', 'Appending');
		p1.setAppendText('\n\nxxxxx');
		p1.setCreateOption('createonly');
		p1.setEditSummary('test append (morebits.js)');
		p1.append(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('articleexists');
				done();
			});
	});

	it('fails to edit an existing page with createonly=1 (protected page)', function(done) {
		var p1 = new Morebits.wiki.page('Wikipedia:Twinkle/ExampleProtectedPage', 'Appending');
		p1.setAppendText('\n\nxxxxx');
		p1.setCreateOption('createonly');
		p1.setEditSummary('test append (morebits.js)');
		p1.append(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('articleexists');
				done();
			});
	});

	it('fails to create (using append) a page with nocreate=1', function(done) {
		var p1 = new Morebits.wiki.page('Morebits-test/' + Math.random(), 'Appending');
		p1.setAppendText('\n\nxxxxx');
		p1.setCreateOption('nocreate');
		p1.setEditSummary('test append (morebits.js)');
		p1.append(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('missingtitle');
				done();
			});
	});


	/** Lookup creation */

	it('correctly looks up page creator', function(done) {
		var p1 = new Morebits.wiki.page('Wikipedia:Twinkle/ExampleNonProtectedPage');
		p1.lookupCreation(function() {
			expect(p1.getCreator()).be.a('string');
			expect(new Date(p1.getCreationTimestamp()).getDate()).to.not.be.NaN;
			expect(p1.getCreator()).to.equal('SD0001');
			expect(p1.getCreationTimestamp()).to.equal('2020-04-21T16:42:39Z');
			done();
		});
	});

	it('correctly looks up page creator of page created as redirect', function(done) {

		// do this better
		var p2 = new Morebits.wiki.page('Main Page');
		p2.setLookupNonRedirectCreator(true);
		p2.lookupCreation(function() {
			expect(p2.getCreator()).to.be.a('string');
			expect(p2.getCreationTimestamp()).to.be.a('string');
			done();
		});
	});

	/** Delete page */

	it('correctly fails to delete page when no summary is provided', function (done) {
		var p1 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Trying to delete without edit summary');
		p1.deletePage(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('int-noreason');
				done();
			});
	});

	it('correctly fails in fnProcessDelete: trying to delete non-existent page (delete after fetching token)', function (done) {
		var nonExistingPageName = 'Morebits-test/' + Math.random(); // Lord be damned if that page exists
		var p2 = new Morebits.wiki.page(nonExistingPageName);
		p2.setEditSummary('test');
		p2.deletePage(notExecuted, failPageCallback).done(notExecuted)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('missingtitle');
				done();
			});
	});

	it('correctly fails in fnProcessDeleteFailure: trying to delete non-existent page (direct deletion with local token)', function (done) {
		var nonExistingPageName = 'Morebits-test/' + Math.random();
		var p3 = new Morebits.wiki.page(nonExistingPageName);
		p3.suppressProtectWarning(); // trigger alternate code path
		p3.setEditSummary('test');
		p3.deletePage(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('missingtitle');
				done();
			});
	});

	it('successfully deletes a page (after creating it)', function(done) {
		this.timeout(4000); // has 2 api calls

		var p4 = new Morebits.wiki.page('User:Morebits-test/' + Math.random());
		p4.setAppendText('Page for testing deletion by morebits.js'); // create the page first
		p4.setEditSummary('Creating test page for deletion');
		p4.append(function() {
			p4.setEditSummary('Testing deletion (morebits.js)');
			p4.deletePage(successPageCallback, notExecuted).done(successPageCallback).fail(notExecuted).then(function() {
				successPageCallback.apply(this, arguments);
				done();
			});
		}, notExecuted);
	});


	/** Move page */

	it('correctly fails to move page without setting destination', function (done) {
		var p1 = new Morebits.wiki.page(Morebits.pageNameNorm);
		p1.move(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('int-noreason');
				done();
			});
	});

	it('correctly fails in fnProcessMove: Trying to move non-existent page', function (done) {
		var p2 = new Morebits.wiki.page('Morebits-test/' + Math.random());
		p2.setEditSummary('test');
		p2.setMoveDestination('xxxxx');
		p2.move(notExecuted, failPageCallback).done(notExecuted)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('missingtitle');
				done();
			});
	});

	it('correcty fails server-side (after API call is sent in fnProcessMove)', function(done) {
		var p3 = new Morebits.wiki.page(Morebits.pageNameNorm, 'Trying to move (should give API error)');
		p3.setEditSummary('test');
		p3.setMoveDestination('de:xxxxx'); // invalid title to trigger API error
		p3.move(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('invalidtitle');
				done();
			});
	});

	// Used for testing move and protect
	var testPageName = 'User:Morebits-test/' + Math.random();

	it('successfully move pages', function(done) {
		this.timeout(4000);

		var p4 = new Morebits.wiki.page(testPageName);
		p4.setAppendText('Page for testing move by morebits.js'); // create the page first
		p4.setEditSummary('Creating test page for move');
		p4.setMoveSuppressRedirect(true);
		p4.append(function() {
			p4.setEditSummary('Testing move (morebits.js)');
			p4.setMoveDestination(p4.getPageName() + '/1');
			p4.move(successPageCallback, notExecuted).done(successPageCallback).fail(notExecuted).then(function() {
				successPageCallback.apply(this, arguments);
				testPageName = testPageName + '/1'; // update name for later use
				done();
			});
		}, notExecuted);
	});

	/** Protect page */

	it('correctly fails to protect without protection settings (failure in this.protect)', function(done) {
		var p1 = new Morebits.wiki.page(Morebits.pageNameNorm);
		p1.protect(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('int-nosetting');
				done();
			});
	});

	it('correctly fails to protect a non-existing page (failure in fnProcessProtect', function(done) {
		var p2 = new Morebits.wiki.page('Morebits-test/' + Math.random(), "Testing protection (page doesn't exist");
		p2.setEditSummary('test (morebits.js)');
		p2.setEditProtection('sysop', 'infinite');
		p2.protect(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('missingtitle');
				done();
			});
	});

	it('correctly fails to protect with already passed expiry date - server-side error after API call sent in fnProcessProtect', function(done) {
		var p3 = new Morebits.wiki.page('Wikipedia:Twinkle/ExampleNonProtectedPage');
		p3.setEditSummary('test (morebits.js)');
		p3.setEditProtection('sysop', '2012-09-28');
		p3.protect(notExecuted, failPageCallback).done(notExecuted).fail(failPageCallback)
			.catch(function(pageobj, errorCode) {
				expect(errorCode).to.equal('pastexpiry');
				done();
			});
	});

	it('successfully protects a page & deletes it to cleanup', function(done) {
		// depends on testPageName to exist, created above in move testing
		var p4 = new Morebits.wiki.page(testPageName);
		p4.setEditSummary('test (morebits.js)');
		p4.setEditProtection('sysop', 'infinite');
		p4.protect(successPageCallback, notExecuted).done(successPageCallback).fail(notExecuted)
			.then(function() {
				successPageCallback.apply(this, arguments);
				done();
				p4.setEditSummary('delete page (morebits.js)');
				p4.deletePage();
			});
	});

});
