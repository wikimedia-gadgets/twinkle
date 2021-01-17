QUnit.module('Morebits.date');
// Allow off-by-one values in milliseconds for not-quite-simultaneous date contructions
QUnit.assert.pmOne = function(actual, expected, message) {
	this.pushResult({
		result: actual === expected || actual === expected+1 || actual === expected-1,
		actual: actual,
		expected: expected,
		message: message
	});
};

var now = Date.now();
var timestamp = '16:26, 7 November 2020 (UTC)', ts_iso = '2020-11-07T16:26:00.000Z', naive = 20201107162600;
QUnit.test('Construction', assert => {
	// getTime and toISOString imply testing of inherited methods
	assert.pmOne(new Morebits.date().getTime(), new Date().getTime(), 'Basic constructor');

	assert.strictEqual(new Morebits.date(now).getTime(), new Date(now).getTime(), 'Constructor from timestring');
	assert.strictEqual(new Morebits.date(2020, 11, 7, 16, 26).getTime(), new Date(2020, 11, 7, 16, 26).getTime(), 'Constructor from parts');
	assert.strictEqual(new Morebits.date(timestamp).toISOString(), ts_iso, 'enWiki timestamp format');
	assert.strictEqual(new Morebits.date(naive).toISOString(), ts_iso, 'MediaWiki 14-digit number');
	assert.strictEqual(new Morebits.date(naive.toString()).toISOString(), ts_iso, 'MediaWiki 14-digit string');
	assert.strictEqual(new Morebits.date(parseInt(naive / 10, 10)).toISOString(), new Date(parseInt(naive / 10, 10)).toISOString(), 'native 13 digit');
	assert.strictEqual(new Morebits.date(naive * 10).toISOString(), new Date(naive * 10).toISOString(), 'native 15 digit');
});
var date = new Morebits.date(timestamp);
QUnit.test('Methods', assert => {
	assert.true(date.isValid(), 'Valid');
	// Logs a message; not a failure, but annoying
	assert.false(new Morebits.date('no').isValid(), 'Invalid');

	// Ideally we would test the differences between UTC and non-UTC dates
	assert.strictEqual(date.getDayName(), 'Saturday', 'getDayName');
	assert.strictEqual(date.getDayNameAbbrev(), 'Sat', 'DayNameAbbrev');
	assert.strictEqual(date.getMonthName(), 'November', 'MonthName');
	assert.strictEqual(date.getMonthNameAbbrev(), 'Nov', 'MonthNameAbbrev');

	assert.true(new Morebits.date(now).isAfter(date), 'isAfter');
	assert.true(date.isBefore(new Date(now)), 'isBefore');
});
QUnit.test('RegEx headers', assert => {
	assert.strictEqual(date.monthHeader(), '== November 2020 ==', 'Month header default');
	assert.strictEqual(date.monthHeader(3), '=== November 2020 ===', 'Month header 3');
	assert.strictEqual(date.monthHeader(0), 'November 2020', 'Month header text');

	assert.true(date.monthHeaderRegex().test('==November 2020=='), 'Header RegEx');
	assert.true(date.monthHeaderRegex().test('====November 2020===='), 'Deeper');
	assert.true(date.monthHeaderRegex().test('== Nov 2020 =='), 'Shortened month');
	assert.false(date.monthHeaderRegex().test('=== Nov 2020 =='), 'Mismatched level');
	assert.false(date.monthHeaderRegex().test('==December 2020=='), 'Wrong month');
});
QUnit.test('add/subtract', assert => {
	assert.strictEqual(new Morebits.date(timestamp).add(1, 'day').toISOString(), '2020-11-08T16:26:00.000Z', 'Add 1 day');
	assert.strictEqual(new Morebits.date(timestamp).add(1, 'DaY').toISOString(), '2020-11-08T16:26:00.000Z', 'Loudly add 1 day');
	assert.strictEqual(new Morebits.date(timestamp).subtract(1, 'day').toISOString(), '2020-11-06T16:26:00.000Z', 'Subtract 1 day');
	assert.throws(() => new Morebits.date(timestamp).add(1), 'throws: no unit');
	assert.throws(() => new Morebits.date(timestamp).subtract(1, 'dayo'), 'throws: bad unit');
});
QUnit.test('Formats', assert => {
	assert.strictEqual(new Morebits.date(now).format('YYYY-MM-DDTHH:mm:ss.SSSZ', 'utc'), new Date(now).toISOString(), 'ISO format');
	assert.strictEqual(date.format('dddd D MMMM YY h:mA', 'utc'), 'Saturday 7 November 20 4:26PM', 'Some weirder stuff');
	assert.strictEqual(date.format('MMt[h month], [d]a[y] D, h [o\'clock] A', 'utc'), '11th month, day 7, 4 o\'clock PM', 'Format escapes');
	assert.strictEqual(date.format('dddd D MMMM YY h:mA', 600), 'Sunday 8 November 20 2:26AM', 'non-UTC formatting');
	assert.strictEqual(date.format('MMt[h month], [d]a[y] D, h [o\'clock] A', 600), '11th month, day 8, 2 o\'clock AM', 'non-UTC escapes');
});
QUnit.test('Calendar', assert => {
	assert.strictEqual(date.calendar('utc'), '2020-11-07', 'Old calendar');
	assert.strictEqual(date.calendar(600), '2020-11-08', 'Old non-UTC');
	assert.strictEqual(new Morebits.date(now).calendar('utc'), 'Today at ' + new Morebits.date(now).format('h:mm A', 'utc'), 'New calendar');
	assert.strictEqual(new Morebits.date(now).subtract(1, 'day').calendar('utc'), 'Yesterday at ' + new Morebits.date(now).format('h:mm A', 'utc'), 'Close calendar');
});
