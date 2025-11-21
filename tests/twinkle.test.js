'use strict';

describe('modules/twinkle', () => {
	describe('Twinkle.defaultConfig global variables', () => {
		test('Should match snapshot', () => {
			expect(Twinkle.defaultConfig.welcomeUserOnSpeedyDeletionNotification).toMatchSnapshot();
			expect(Twinkle.defaultConfig.notifyUserOnSpeedyDeletionNomination).toMatchSnapshot();
			expect(Twinkle.defaultConfig.warnUserOnSpeedyDelete).toMatchSnapshot();
		});
	});

	describe('removeMoveToCommonsTagsFromWikicode( wikicode )', () => {
		test('Should remove "Move To Commons" templates with no parameters', () => {
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Mtc}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy to commons}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Move to commons}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy to Wikimedia Commons}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Move to Wikimedia Commons}}')).toBe('');
			// TODO: Can modify the RegEx to support additional templates that redirect to the main template {{Copy to Wikimedia Commons}}. See https://en.wikipedia.org/wiki/Special:WhatLinksHere?target=Template%3ACopy+to+Wikimedia+Commons&namespace=&hidetrans=1&hidelinks=1&limit=50 for a list.
		});

		test('Should remove "Move To Commons" templates with parameters', () => {
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy to Wikimedia Commons|date=June 2012}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy to Wikimedia Commons|bot=Fbot|priority=true}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy to Wikimedia Commons|bot=Fbot}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy to Wikimedia Commons}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Move to Wikimedia Commons}}')).toBe('');
		});

		test('Should not remove unrelated templates', () => {
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Move to}}')).toBe('{{Move to}}');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy}}')).toBe('{{Copy}}');
		});

		test('Should not remove text around templates', () => {
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Mtc}} text')).toBe(' text');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('text {{Mtc}} text')).toBe('text  text');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('text {{Mtc}}')).toBe('text ');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Mtc}}\ntext')).toBe('\ntext');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('text\n{{Mtc}}\ntext')).toBe('text\n\ntext');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('text\n{{Mtc}}')).toBe('text\n');
		});

		test('Should be case insensitive', () => {
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Mtc}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{mtc}}')).toBe('');
		});

		test('Should handle multiple templates', () => {
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Mtc}}{{Copy to commons}}')).toBe('');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Mtc}}\n{{Copy to commons}}')).toBe('\n');
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Mtc}}\n{{Copy}}\n{{Copy to commons}}')).toBe('\n{{Copy}}\n');
		});

		test('Should handle whitespace after the template name but before the closing brackets', () => {
			expect(Twinkle.removeMoveToCommonsTagsFromWikicode('{{Copy to Wikimedia Commons |date=July 2024}}')).toBe('');
		});
	});
});
