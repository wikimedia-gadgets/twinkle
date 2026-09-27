'use strict';

describe('modules/twinkleconfig', () => {
	describe('Twinkle.config global variables', () => {
		test('Should match snapshot', () => {
			expect(Twinkle.config.commonSets.csdCriteria).toMatchSnapshot();
			expect(Twinkle.config.commonSets.csdCriteriaDisplayOrder).toMatchSnapshot();
			expect(Twinkle.config.commonSets.csdCriteriaNotification).toMatchSnapshot();
			expect(Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder).toMatchSnapshot();
			expect(Twinkle.config.commonSets.csdAndImageDeletionCriteria).toMatchSnapshot();
			expect(Twinkle.config.commonSets.csdAndImageDeletionCriteriaDisplayOrder).toMatchSnapshot();
		});
	});
});
