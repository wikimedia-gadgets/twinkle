/* eslint-env node */

module.exports = {
	testMatch: ['**/tests/morebits*.js'],
	setupFilesAfterEnv: ['mock-mediawiki', '<rootDir>/tests/jest.setup.js']
};
