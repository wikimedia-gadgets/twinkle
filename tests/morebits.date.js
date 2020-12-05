QUnit.module('Morebits.date');
var now = Date.now();
var timestamp = '16:26, 7 November 2020 (UTC)';
QUnit.test('Construction', assert => {
	assert.strictEqual(new Morebits.date().getTime(), new Date().getTime(), 'Basic constructor');
	assert.strictEqual(new Morebits.date(now).getTime(), new Date(now).getTime(), 'Constructor from timestring');
	assert.strictEqual(new Morebits.date(2020, 11, 7, 16, 26).getTime(), new Date(2020, 11, 7, 16, 26).getTime(), 'Constructor from parts');
	assert.strictEqual(new Morebits.date(timestamp).toISOString(), '2020-11-07T16:26:00.000Z', 'enWiki timestamp format');
});
var date = new Morebits.date(timestamp);
QUnit.test('Formats', assert => {
	assert.strictEqual(new Morebits.date(now).format('YYYY-MM-DDTHH:mm:ss.SSSZ', 'utc'), new Date(now).toISOString(), 'ISO format');
	assert.strictEqual(date.format('dddd D MMMM YY h:mA', 'utc'), 'Saturday 7 November 20 4:26PM', 'Some weirder stuff');
	assert.strictEqual(date.format('MMt[h month], [d]a[y] D, h [o\'clock] A', 'utc'), '11th month, day 7, 4 o\'clock PM', 'Format escapes');
});
QUnit.test('add/subtract', assert => {
	assert.strictEqual(new Morebits.date(timestamp).add(1, 'day').toISOString(), '2020-11-08T16:26:00.000Z', 'Add 1 day');
	assert.strictEqual(new Morebits.date(timestamp).subtract(1, 'day').toISOString(), '2020-11-06T16:26:00.000Z', 'Subtract 1 day');
	assert.throws(() => new Morebits.date(timestamp).add(1), 'throws: no unit');
	assert.throws(() => new Morebits.date(timestamp).subtract(1, 'date'), 'throws: bad unit');
});
QUnit.test('Calendar', assert => {
	assert.strictEqual(date.calendar('utc'), '2020-11-07', 'Old calendar');
	assert.strictEqual(new Morebits.date(now).calendar('utc'), 'Today at ' + new Morebits.date(now).format('h:mm A', 'utc'), 'New calendar');
	assert.strictEqual(new Morebits.date(now).subtract(1, 'day').calendar('utc'), 'Yesterday at ' + new Morebits.date(now).format('h:mm A', 'utc'), 'Close calendar');
});
