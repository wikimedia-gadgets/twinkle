describe('modules/twinklewarn', () => {
	describe('getTemplateProperty', () => {
		test('leveled templates: should read property', () => {
			expect(Twinkle.warn.getTemplateProperty('uw-vandalism1', 'label')).toBe('Vandalism');
		});

		test('leveled templates: non-existent property should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty('uw-vandalism1', 'abc')).toBe(undefined);
		});

		test('leveled templates: non-existent template should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty('abc1', 'def')).toBe(undefined);
		});

		test('non-level template: should read property', () => {
			expect(Twinkle.warn.getTemplateProperty('uw-attack', 'suppressArticleInSummary')).toBe(true);
		});

		test('non-level template: non-existent property should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty('uw-attack', 'abc')).toBe(undefined);
		});

		test('non-level template: non-existent template should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty('abc', 'def')).toBe(undefined);
		});

		test('non-level template ending in number should read property', () => {
			expect(Twinkle.warn.getTemplateProperty('uw-editsummary2', 'hideLinkedPage')).toBe(true);
		});
	});
});