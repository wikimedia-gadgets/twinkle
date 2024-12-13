'use strict';

describe('modules/twinkleblock', () => {
	describe('combineFormDataAndFieldTemplateOptions', () => {
		// https://github.com/wikimedia-gadgets/twinkle/issues/2106
		test('regression test: merging true and undefined should return true', () => {
			const formData = {disabletalk: true};
			const messageData = undefined;
			const reason = undefined;
			const disabletalk = undefined;
			const noemail = undefined;
			const nocreate = undefined;
			const expected = {disabletalk: true};
			expect(Twinkle.block.combineFormDataAndFieldTemplateOptions(formData, messageData, reason, disabletalk, noemail, nocreate)).toStrictEqual(expected);
		});
	});
});
