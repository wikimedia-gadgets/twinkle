/* eslint-env node */

module.exports = {
	testMatch: ['**/tests/morebits*.js', '**/tests/twinkle*.js'],
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['mock-mediawiki', '<rootDir>/tests/jest.setup.js'],
	collectCoverageFrom: [
		'morebits.js',
		'modules/**/*.{js,jsx,ts,tsx}'
	]
};
