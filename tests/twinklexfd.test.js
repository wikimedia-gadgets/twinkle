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
});
