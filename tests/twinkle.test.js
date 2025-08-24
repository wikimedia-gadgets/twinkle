'use strict';

describe('modules/twinkle', () => {
	describe('Twinkle.defaultConfig global variables', () => {
		test('Should match snapshot', () => {
			expect(Twinkle.defaultConfig.welcomeUserOnSpeedyDeletionNotification).toMatchSnapshot();
			expect(Twinkle.defaultConfig.notifyUserOnSpeedyDeletionNomination).toMatchSnapshot();
			expect(Twinkle.defaultConfig.warnUserOnSpeedyDelete).toMatchSnapshot();
		});
	});
});
