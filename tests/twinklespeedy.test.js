'use strict';

describe('modules/twinklespeedy', () => {
	describe('Twinkle.speedy global variables', () => {
		test('Should match snapshot', () => {
			expect(Twinkle.speedy.customRationale).toMatchSnapshot();
			expect(Twinkle.speedy.talkList).toMatchSnapshot();
			expect(Twinkle.speedy.fileList).toMatchSnapshot();
			expect(Twinkle.speedy.articleList).toMatchSnapshot();
			expect(Twinkle.speedy.categoryList).toMatchSnapshot();
			expect(Twinkle.speedy.templateList).toMatchSnapshot();
			expect(Twinkle.speedy.userList).toMatchSnapshot();
			expect(Twinkle.speedy.generalList).toMatchSnapshot();
			expect(Twinkle.speedy.redirectList).toMatchSnapshot();
			expect(Twinkle.speedy.timedTextList).toMatchSnapshot();
			expect(Twinkle.speedy.normalizeHash).toMatchSnapshot();
		});
	});
});
