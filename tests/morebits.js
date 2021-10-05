describe('constants', () => {
	test('userIsSysop', () => {
		assert.true(Morebits.userIsSysop, 'Is sysop');
	});
	test('pageNameNorm', () => {
		assert.strictEqual(Morebits.pageNameNorm, 'Macbeth, King of Scotland', 'Normalized page title');
	});
});
describe('methods', () => {
	test('userIsInGroup', () => {
		assert.true(Morebits.userIsInGroup('sysop'), 'Sysop');
		assert.true(Morebits.userIsInGroup('interface-admin'), 'Int-Admin');
		assert.false(Morebits.userIsInGroup('Founder'), 'Founder');
	});

	test('pageNameRegex', () => {
		assert.strictEqual(Morebits.pageNameRegex(mw.config.get('wgPageName')), '[Mm]acbeth,[_ ]King[_ ]of[_ ]Scotland', 'First character and spaces');
		assert.strictEqual(Morebits.pageNameRegex(''), '', 'Empty');
		assert.strictEqual(Morebits.pageNameRegex('a'), '[Aa]', 'Single character');
		assert.strictEqual(Morebits.pageNameRegex('#'), '#', 'Single same-case');
		assert.strictEqual(Morebits.pageNameRegex('*$, \{}(a) |.?+-^ [ ]'), '\\*\\$,[_ ]\\{\\}\\(a\\)[_ ]\\|\\.\\?\\+\\-\\^\[_ ]\\[[_ ]\\]', 'Special characters');
	});
	test('namespaceRegex', () => {
		assert.strictEqual(Morebits.namespaceRegex([6]), '(?:[Ff][Ii][Ll][Ee]|[Ii][Mm][Aa][Gg][Ee])', 'Files');
		assert.strictEqual(Morebits.namespaceRegex(10), '[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee]', 'Non-array singlet');
		assert.strictEqual(Morebits.namespaceRegex([4, 5]), '(?:[Ww][Ii][Kk][Ii][Pp][Ee][Dd][Ii][Aa]|[Ww][Ii][Kk][Ii][Pp][Ee][Dd][Ii][Aa][_ ][Tt][Aa][Ll][Kk]|[Ww][Pp]|[Ww][Tt]|[Pp][Rr][Oo][Jj][Ee][Cc][Tt]|[Pp][Rr][Oo][Jj][Ee][Cc][Tt][_ ][Tt][Aa][Ll][Kk])', 'Project and project talk');
		assert.strictEqual(Morebits.namespaceRegex(0), '', 'Main');
		assert.strictEqual(Morebits.namespaceRegex(), '', 'Empty');
	});

	test('isPageRedirect', () => {
		assert.false(Morebits.isPageRedirect(), 'Is redirect');
	});
});
