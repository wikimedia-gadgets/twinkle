describe('modules/twinkletag', () => {
	describe('checkIncompatible', () => {
		test('no conflicts', () => {
			const conflictsToCheckFor = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Better source requested'];
			const expected = undefined;
			expect(Twinkle.tag.checkIncompatible(conflictsToCheckFor, tagsToCheck)).toBe(expected);
		});

		test('conflictsToCheckFor, tagsToCheck in alphabetical order', () => {
			const conflictsToCheckFor = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Bad GIF', 'Bad JPEG'];
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(conflictsToCheckFor, tagsToCheck)).toBe(expected);
		});

		test('conflictsToCheckFor, tagsToCheck not in alphabetical order', () => {
			const conflictsToCheckFor = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Bad JPEG', 'Bad GIF'];
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(conflictsToCheckFor, tagsToCheck)).toBe(expected);
		});

		test('conflicts mixed with non-conflicts', () => {
			const conflictsToCheckFor = ['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'];
			const tagsToCheck = ['Better source requested', 'Bad GIF', 'Maybe free media', 'Bad JPEG', 'Copy to Commons'];
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(conflictsToCheckFor, tagsToCheck)).toBe(expected);
		});

		test('extra param, no conflicts', () => {
			const conflictsToCheckFor = ['Merge', 'Merge from', 'Merge to'];
			const tagsToCheck = ['One source'];
			const extraMessage = 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).';
			const expected = undefined;
			expect(Twinkle.tag.checkIncompatible(conflictsToCheckFor, tagsToCheck, extraMessage)).toBe(expected);
		});

		test('extra param, conflicts', () => {
			const conflictsToCheckFor = ['Merge', 'Merge from', 'Merge to'];
			const tagsToCheck = ['Merge from', 'Merge to'];
			const extraMessage = 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).';
			const expected = true;
			expect(Twinkle.tag.checkIncompatible(conflictsToCheckFor, tagsToCheck, extraMessage)).toBe(expected);
		});
	});
});
