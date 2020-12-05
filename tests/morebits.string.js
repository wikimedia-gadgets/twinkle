QUnit.module('Morebits.string');
QUnit.test('escapeRegExp', assert => {
	assert.strictEqual(Morebits.string.escapeRegExp('Four score and seven years ago'), 'Four[_ ]score[_ ]and[_ ]seven[_ ]years[_ ]ago', 'Spaces');
	assert.strictEqual(Morebits.string.escapeRegExp('Four_score_and_seven_years_ago'), 'Four[_ ]score[_ ]and[_ ]seven[_ ]years[_ ]ago', 'Underscores');
});

// QUnit.test('formatReasonForLog', assert => {
// 	assert.strictEqual(Morebits.string.formatReasonForLog(), '', '');
// });
// QUnit.test('formatReasonText', assert => {
// 	assert.strictEqual(Morebits.string.formatReasonText(), '', '');
// });

QUnit.test('isInfinity', assert => {
	assert.true(Morebits.string.isInfinity('infinity'), 'Infinity');
	assert.true(Morebits.string.isInfinity('infinity'), 'Indefinite');
	assert.true(Morebits.string.isInfinity('never'), 'Never');
	assert.true(Morebits.string.isInfinity('infinite'), 'Infinite');
	assert.false(Morebits.string.isInfinity('always'), 'Always');
	assert.false(Morebits.string.isInfinity('2 weeks'), 'Relative date');
	assert.false(Morebits.string.isInfinity('2020-04-17T09:31:00.000Z'), 'ISO string');
});

// QUnit.test('safeReplace', assert => {
// 	assert.strictEqual(Morebits.string.safeReplace(), '', '');
// });
// QUnit.test('splitWeightedByKeys', assert => {
// 	assert.strictEqual(Morebits.string.splitWeightedByKeys(), '', '');
// });

QUnit.test('toLowerCaseFirstChar', assert => {
	assert.strictEqual(Morebits.string.toLowerCaseFirstChar('River tam'), 'river tam', 'Lower first');
});
QUnit.test('toUpperCaseFirstChar', assert => {
	assert.strictEqual(Morebits.string.toUpperCaseFirstChar('river Song'), 'River Song', 'Upperfirst');
});
