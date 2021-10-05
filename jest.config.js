/* eslint-env node */

module.exports = {
	testMatch: ['**/tests/morebits*.js'],
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['mock-mediawiki', '<rootDir>/tests/jest.setup.js']
};
