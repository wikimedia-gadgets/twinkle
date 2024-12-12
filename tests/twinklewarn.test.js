'use strict';

describe('modules/twinklewarn', () => {
	describe('getTemplateProperty', () => {
		const templates = {
			levels: {
				'Common warnings': {
					'uw-vandalism': {
						level1: {
							label: 'Vandalism',
							summary: 'General note: Unconstructive editing'
						},
						level2: {
							label: 'Vandalism',
							summary: 'Caution: Unconstructive editing'
						},
						level3: {
							label: 'Vandalism',
							summary: 'Warning: Vandalism'
						},
						level4: {
							label: 'Vandalism',
							summary: 'Final warning: Vandalism'
						},
						level4im: {
							label: 'Vandalism',
							summary: 'Only warning: Vandalism'
						}
					}
				}
			},

			singlenotice: {
				'uw-editsummary2': {
					label: 'Experienced user not using edit summary',
					summary: 'Notice: Not using edit summary',
					hideLinkedPage: true,
					hideReason: true
				}
			},

			singlewarn: {
				'uw-attack': {
					label: 'Creating attack pages',
					summary: 'Warning: Creating attack pages',
					suppressArticleInSummary: true
				}
			}
		};

		test('leveled templates: should read property', () => {
			expect(Twinkle.warn.getTemplateProperty(templates, 'uw-vandalism1', 'label')).toBe('Vandalism');
		});

		test('leveled templates: non-existent property should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty(templates, 'uw-vandalism1', 'abc')).toBe(undefined);
		});

		test('leveled templates: non-existent template should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty(templates, 'abc1', 'def')).toBe(undefined);
		});

		test('non-level template: should read property', () => {
			expect(Twinkle.warn.getTemplateProperty(templates, 'uw-attack', 'suppressArticleInSummary')).toBe(true);
		});

		test('non-level template: non-existent property should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty(templates, 'uw-attack', 'abc')).toBe(undefined);
		});

		test('non-level template: non-existent template should be undefined', () => {
			expect(Twinkle.warn.getTemplateProperty(templates, 'abc', 'def')).toBe(undefined);
		});

		test('non-level template ending in number should read property', () => {
			expect(Twinkle.warn.getTemplateProperty(templates, 'uw-editsummary2', 'hideLinkedPage')).toBe(true);
		});
	});
});
