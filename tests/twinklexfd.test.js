'use strict';

describe('modules/twinklexfd', () => {
	describe('insertRMTR', () => {
		test('0 rows, 1 line breaks', () => {
			const pageWikitext =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
==== Requests to revert undiscussed moves ====`;
			const wikitextToInsert = '* {{RMassist/core}}';
			const expected =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core}}

==== Requests to revert undiscussed moves ====`;
			expect(Twinkle.xfd.insertRMTR(pageWikitext, wikitextToInsert)).toBe(expected);
		});

		test('0 rows, 1 line breaks', () => {
			const pageWikitext =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->

==== Requests to revert undiscussed moves ====`;
			const wikitextToInsert = '* {{RMassist/core}}';
			const expected =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core}}

==== Requests to revert undiscussed moves ====`;
			expect(Twinkle.xfd.insertRMTR(pageWikitext, wikitextToInsert)).toBe(expected);
		});

		test('0 rows, 2 line breaks', () => {
			const pageWikitext =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->


==== Requests to revert undiscussed moves ====`;
			const wikitextToInsert = '* {{RMassist/core}}';
			const expected =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core}}

==== Requests to revert undiscussed moves ====`;
			expect(Twinkle.xfd.insertRMTR(pageWikitext, wikitextToInsert)).toBe(expected);
		});

		test('1 rows, 0 line breaks', () => {
			const pageWikitext =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}
==== Requests to revert undiscussed moves ====`;
			const wikitextToInsert = '* {{RMassist/core}}';
			const expected =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}
* {{RMassist/core}}

==== Requests to revert undiscussed moves ====`;
			expect(Twinkle.xfd.insertRMTR(pageWikitext, wikitextToInsert)).toBe(expected);
		});

		test('2 rows, 0 line breaks', () => {
			const pageWikitext =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}
* {{RMassist/core3}}
==== Requests to revert undiscussed moves ====`;
			const wikitextToInsert = '* {{RMassist/core}}';
			const expected =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}
* {{RMassist/core3}}
* {{RMassist/core}}

==== Requests to revert undiscussed moves ====`;
			expect(Twinkle.xfd.insertRMTR(pageWikitext, wikitextToInsert)).toBe(expected);
		});

		test('1 rows, 1 line breaks', () => {
			const pageWikitext =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}

==== Requests to revert undiscussed moves ====`;
			const wikitextToInsert = '* {{RMassist/core}}';
			const expected =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}
* {{RMassist/core}}

==== Requests to revert undiscussed moves ====`;
			expect(Twinkle.xfd.insertRMTR(pageWikitext, wikitextToInsert)).toBe(expected);
		});

		test('1 rows, 2 line breaks', () => {
			const pageWikitext =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}


==== Requests to revert undiscussed moves ====`;
			const wikitextToInsert = '* {{RMassist/core}}';
			const expected =
`<!-- Insert the following code below, filling in page names and reason: {{subst:RMassist| current page title | new title | reason = reason for move}} and enter on a new line, at the bottom of the existing list; do not add spare lines between entries; do not add a bullet point; if you do not wish the request to be converted into an RM if contested, then add |discuss=no -->
* {{RMassist/core2}}
* {{RMassist/core}}

==== Requests to revert undiscussed moves ====`;
			expect(Twinkle.xfd.insertRMTR(pageWikitext, wikitextToInsert)).toBe(expected);
		});
	});

	describe('generateArticleTagWikitext', () => {
		test('deletion, 1st nomination', () => {
			const noinclude = false;
			const outcome = 'deletion';
			const afdtarget = '';
			const number = '';
			const expected = '{{subst:afd|help=off}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('deletion, 1st nomination, noinclude', () => {
			const noinclude = true;
			const outcome = 'deletion';
			const afdtarget = '';
			const number = '';
			const expected = '<noinclude>{{subst:afd|help=off}}</noinclude>\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('deletion, nth nomination', () => {
			const noinclude = false;
			const outcome = 'deletion';
			const afdtarget = '';
			const number = '24th';
			const expected = '{{subst:afdx|24th|help=off}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('merging, 1st nomination, blank target', () => {
			const noinclude = false;
			const outcome = 'merging';
			const afdtarget = '';
			const number = '';
			const expected = '{{subst:afd|help=off|outcome=merging}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('merging, 1st nomination, target specified', () => {
			const noinclude = false;
			const outcome = 'merging';
			const afdtarget = 'TargetPage';
			const number = '';
			const expected = '{{subst:afd|help=off|outcome=merging|target=TargetPage}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('merging, nth nomination, target specified', () => {
			const noinclude = false;
			const outcome = 'merging';
			const afdtarget = 'TargetPage';
			const number = '4th';
			const expected = '{{subst:afdx|4th|help=off|outcome=merging|target=TargetPage}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('redirect, 1st nomination, blank target', () => {
			const noinclude = false;
			const outcome = 'redirecting';
			const afdtarget = '';
			const number = '';
			const expected = '{{subst:afd|help=off|outcome=redirecting}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('redirect, 1st nomination, target specified', () => {
			const noinclude = false;
			const outcome = 'redirecting';
			const afdtarget = 'TargetPage';
			const number = '';
			const expected = '{{subst:afd|help=off|outcome=redirecting|target=TargetPage}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
		test('draftify, 1st nomination', () => {
			const noinclude = false;
			const outcome = 'draftification';
			const afdtarget = '';
			const number = '';
			const expected = '{{subst:afd|help=off|outcome=draftification}}\n';
			expect(Twinkle.xfd.callbacks.afd.generateArticleTagWikitext(noinclude, outcome, afdtarget, number)).toBe(expected);
		});
	});

	describe('generateUserTalkNoticeWikitext', () => {
		test('afd, deletion, 1st nomination', () => {
			const venue = 'afd';
			const outcome = 'deletion';
			const afdtarget = '';
			const numbering = '';
			const xfdcat = '?';
			const tfdtarget = undefined;
			const action = undefined;
			const namespaceNumber = 0;
			const pageTitle = 'NovemTest110';
			const expected = '\n{{subst:afd notice|1=NovemTest110}} ~~~~';
			expect(Twinkle.xfd.callbacks.generateUserTalkNoticeWikitext(venue, outcome, afdtarget, numbering, xfdcat, tfdtarget, action, namespaceNumber, pageTitle)).toBe(expected);
		});
		test('afd, deletion, nth nomination', () => {
			const venue = 'afd';
			const outcome = 'deletion';
			const afdtarget = '';
			const numbering = ' (4th nomination)';
			const xfdcat = '?';
			const tfdtarget = undefined;
			const action = undefined;
			const namespaceNumber = 0;
			const pageTitle = 'NovemTest110';
			const expected = '\n{{subst:afd notice|order=&#32; (4th nomination)|1=NovemTest110}} ~~~~';
			expect(Twinkle.xfd.callbacks.generateUserTalkNoticeWikitext(venue, outcome, afdtarget, numbering, xfdcat, tfdtarget, action, namespaceNumber, pageTitle)).toBe(expected);
		});
		test('afd, merging, 1st nomination, blank target', () => {
			const venue = 'afd';
			const outcome = 'merging';
			const afdtarget = '';
			const numbering = '';
			const xfdcat = '?';
			const tfdtarget = undefined;
			const action = undefined;
			const namespaceNumber = 0;
			const pageTitle = 'NovemTest110';
			const expected = '\n{{subst:afd notice|outcome=merging|1=NovemTest110}} ~~~~';
			expect(Twinkle.xfd.callbacks.generateUserTalkNoticeWikitext(venue, outcome, afdtarget, numbering, xfdcat, tfdtarget, action, namespaceNumber, pageTitle)).toBe(expected);
		});
		test('afd, merging, 1st nomination, with target', () => {
			const venue = 'afd';
			const outcome = 'merging';
			const afdtarget = 'Testing 123';
			const numbering = '';
			const xfdcat = '?';
			const tfdtarget = undefined;
			const action = undefined;
			const namespaceNumber = 0;
			const pageTitle = 'NovemTest110';
			const expected = '\n{{subst:afd notice|outcome=merging|target=Testing 123|1=NovemTest110}} ~~~~';
			expect(Twinkle.xfd.callbacks.generateUserTalkNoticeWikitext(venue, outcome, afdtarget, numbering, xfdcat, tfdtarget, action, namespaceNumber, pageTitle)).toBe(expected);
		});
		test('afd, redirecting, 1st nomination, blank target', () => {
			const venue = 'afd';
			const outcome = 'redirecting';
			const afdtarget = '';
			const numbering = '';
			const xfdcat = '?';
			const tfdtarget = undefined;
			const action = undefined;
			const namespaceNumber = 0;
			const pageTitle = 'NovemTest110';
			const expected = '\n{{subst:afd notice|outcome=redirecting|1=NovemTest110}} ~~~~';
			expect(Twinkle.xfd.callbacks.generateUserTalkNoticeWikitext(venue, outcome, afdtarget, numbering, xfdcat, tfdtarget, action, namespaceNumber, pageTitle)).toBe(expected);
		});
		test('afd, redirecting, 1st nomination, with target', () => {
			const venue = 'afd';
			const outcome = 'redirecting';
			const afdtarget = 'Testing 123';
			const numbering = '';
			const xfdcat = '?';
			const tfdtarget = undefined;
			const action = undefined;
			const namespaceNumber = 0;
			const pageTitle = 'NovemTest110';
			const expected = '\n{{subst:afd notice|outcome=redirecting|target=Testing 123|1=NovemTest110}} ~~~~';
			expect(Twinkle.xfd.callbacks.generateUserTalkNoticeWikitext(venue, outcome, afdtarget, numbering, xfdcat, tfdtarget, action, namespaceNumber, pageTitle)).toBe(expected);
		});
		test('afd, draftification, 1st nomination', () => {
			const venue = 'afd';
			const outcome = 'draftification';
			const afdtarget = '';
			const numbering = '';
			const xfdcat = '?';
			const tfdtarget = undefined;
			const action = undefined;
			const namespaceNumber = 0;
			const pageTitle = 'NovemTest110';
			const expected = '\n{{subst:afd notice|outcome=draftification|1=NovemTest110}} ~~~~';
			expect(Twinkle.xfd.callbacks.generateUserTalkNoticeWikitext(venue, outcome, afdtarget, numbering, xfdcat, tfdtarget, action, namespaceNumber, pageTitle)).toBe(expected);
		});
		// TODO: add tests for tfd, cfd, mfd, ffd, rfd
	});
});
