'use strict';

describe('modules/twinkletag', () => {
	describe('checkIncompatible', () => {
		test('no conflicts, 0 tags to check', () => {
			const incompatibleTags = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = [];
			const expected = undefined;
			expect(Twinkle.tag.checkIncompatible(incompatibleTags, tagsToCheck)).toBe(expected);
		});

		test('no conflicts, 1 tag to check', () => {
			const incompatibleTags = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Better source requested'];
			const expected = undefined;
			expect(Twinkle.tag.checkIncompatible(incompatibleTags, tagsToCheck)).toBe(expected);
		});

		test('incompatibleTags, tagsToCheck in alphabetical order', () => {
			const incompatibleTags = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Bad GIF', 'Bad JPEG'];
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(incompatibleTags, tagsToCheck)).toBe(expected);
		});

		test('incompatibleTags, tagsToCheck not in alphabetical order', () => {
			const incompatibleTags = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Bad JPEG', 'Bad GIF'];
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(incompatibleTags, tagsToCheck)).toBe(expected);
		});

		test('conflicts mixed with non-conflicts', () => {
			const incompatibleTags = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Better source requested', 'Bad GIF', 'Maybe free media', 'Bad JPEG', 'Copy to Commons'];
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(incompatibleTags, tagsToCheck)).toBe(expected);
		});

		test('extra param, no conflicts', () => {
			const incompatibleTags = ['Merge', 'Merge from', 'Merge to'];
			const tagsToCheck = ['One source'];
			const extraMessage = 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).';
			const expected = undefined;
			expect(Twinkle.tag.checkIncompatible(incompatibleTags, tagsToCheck, extraMessage)).toBe(expected);
		});

		test('extra param, conflicts', () => {
			const incompatibleTags = ['Merge', 'Merge from', 'Merge to'];
			const tagsToCheck = ['Merge from', 'Merge to'];
			const extraMessage = 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).';
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(incompatibleTags, tagsToCheck, extraMessage)).toBe(expected);
		});
	});
});
