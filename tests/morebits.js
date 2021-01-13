QUnit.module('constants');
QUnit.test('userIsSysop', assert => {
	assert.true(Morebits.userIsSysop, 'Is sysop');
});
QUnit.test('pageNameNorm', assert => {
	assert.strictEqual(Morebits.pageNameNorm, 'Macbeth, King of Scotland', 'Normalized page title');
});

QUnit.module('methods');
QUnit.test('userIsInGroup', assert => {
	assert.true(Morebits.userIsInGroup('sysop'), 'Sysop');
	assert.true(Morebits.userIsInGroup('interface-admin'), 'Int-Admin');
	assert.false(Morebits.userIsInGroup('Founder'), 'Founder');
});

QUnit.test('sanitizeIPv6', assert => {
	assert.strictEqual(Morebits.sanitizeIPv6('2001:0db8:0001:0000:0000:0ab9:C0A8:0102'), '2001:DB8:1:0:0:AB9:C0A8:102', 'Shorten IPv6');
	assert.strictEqual(Morebits.sanitizeIPv6('2001:0db8:0001::1'), '2001:DB8:1:0:0:0:0:1', 'Condensed form');
	assert.strictEqual(Morebits.sanitizeIPv6('2001:0db8:0001:0000:0000:0ab9:C0A8:0102/42'), '2001:DB8:1:0:0:AB9:C0A8:102/42', 'Subnet');
	assert.strictEqual(Morebits.sanitizeIPv6('127.0.0.1'), '127.0.0.1', 'Home sweet home');
});

QUnit.test('pageNameRegex', assert => {
	assert.strictEqual(Morebits.pageNameRegex(mw.config.get('wgPageName')), '[Mm]acbeth,[_ ]King[_ ]of[_ ]Scotland', 'First character and spaces');
	assert.strictEqual(Morebits.pageNameRegex(''), '', 'Empty');
	assert.strictEqual(Morebits.pageNameRegex('a'), '[Aa]', 'Single character');
	assert.strictEqual(Morebits.pageNameRegex('#'), '#', 'Single same-case');
	assert.strictEqual(Morebits.pageNameRegex('*$, \{}(a) |.?+-^ [ ]'), '\\*\\$,[_ ]\\{\\}\\(a\\)[_ ]\\|\\.\\?\\+\\-\\^\[_ ]\\[[_ ]\\]', 'Special characters');
});
QUnit.test('namespaceRegex', assert => {
	assert.strictEqual(Morebits.namespaceRegex([6]), '(?:[Ff][Ii][Ll][Ee]|[Ii][Mm][Aa][Gg][Ee])', 'Files');
	assert.strictEqual(Morebits.namespaceRegex(10), '[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee]', 'Non-array singlet');
	assert.strictEqual(Morebits.namespaceRegex([4, 5]), '(?:[Ww][Ii][Kk][Ii][Pp][Ee][Dd][Ii][Aa]|[Ww][Ii][Kk][Ii][Pp][Ee][Dd][Ii][Aa][_ ][Tt][Aa][Ll][Kk]|[Ww][Pp]|[Ww][Tt]|[Pp][Rr][Oo][Jj][Ee][Cc][Tt]|[Pp][Rr][Oo][Jj][Ee][Cc][Tt][_ ][Tt][Aa][Ll][Kk])', 'Project and project talk');
	assert.strictEqual(Morebits.namespaceRegex(0), '', 'Main');
	assert.strictEqual(Morebits.namespaceRegex(), '', 'Empty');
});

QUnit.test('isPageRedirect', assert => {
	assert.false(Morebits.isPageRedirect(), 'Is redirect');
});
