QUnit.module('Morebits.string');
QUnit.test('escapeRegExp', assert => {
	assert.strictEqual(Morebits.string.escapeRegExp('Four score and seven years ago'), 'Four[_ ]score[_ ]and[_ ]seven[_ ]years[_ ]ago', 'Spaces');
	assert.strictEqual(Morebits.string.escapeRegExp('Four_score_and_seven_years_ago'), 'Four[_ ]score[_ ]and[_ ]seven[_ ]years[_ ]ago', 'Underscores');
});
QUnit.test('formatReasonForLog', assert => {
	var reason = 'They were wrong';
	assert.strictEqual(Morebits.string.formatReasonForLog(reason), reason, 'Simple, unchanged');
	var more = 'Really wrong';
	assert.strictEqual(Morebits.string.formatReasonForLog(reason + '\n' + more), reason + '{{pb}}' + more, '\n -> {{pb}}');
	assert.strictEqual(Morebits.string.formatReasonForLog('#' + reason + '\n' + more), '##' + reason + '{{pb}}' + more, 'Prepend extra #');
	assert.strictEqual(Morebits.string.formatReasonForLog('*' + reason + '\n' + more), '#*' + reason + '{{pb}}' + more, 'Prepend extra #');
});
QUnit.test('formatReasonText', assert => {
	var reason = 'They were correct';
	assert.strictEqual(Morebits.string.formatReasonText(reason), reason, 'Simple, unchanged');
	assert.strictEqual(Morebits.string.formatReasonText(reason, true), reason + ' ~~~~', 'Simple');
	var more = 'Technically correct';
	assert.strictEqual(Morebits.string.formatReasonText(reason + '|' + more ), reason + '{{subst:!}}' + more, 'Replace pipe');
	assert.strictEqual(Morebits.string.formatReasonText(reason + '|' + more, true), reason + '{{subst:!}}' + more + ' ~~~~', 'Replace pipe');
	reason += 'The <nowiki>{{best|kind|of}}</nowiki> correct: ';
	assert.strictEqual(Morebits.string.formatReasonText(reason + more ), reason + more, 'No replace in nowiki');
	assert.strictEqual(Morebits.string.formatReasonText(), '', 'Empty');
	var alreadySigned = 'already signed ~~~~';
	assert.strictEqual(Morebits.string.formatReasonText(alreadySigned, true), alreadySigned, 'No sig duplication');
	assert.strictEqual(Morebits.string.formatReasonText('alreadySigned~~~~  ', true), 'alreadySigned~~~~', 'trims and avoids duplicating sig');
	assert.strictEqual(Morebits.string.formatReasonText('Wow', true), 'Wow ~~~~', '3-letter reason');
	assert.strictEqual(Morebits.string.formatReasonText('', true), '~~~~', 'Empty');
	assert.strictEqual(Morebits.string.formatReasonText(undefined, true), '~~~~', 'Undefined');
});
QUnit.test('isInfinity', assert => {
	assert.true(Morebits.string.isInfinity('infinity'), 'Infinity');
	assert.true(Morebits.string.isInfinity('infinity'), 'Indefinite');
	assert.true(Morebits.string.isInfinity('never'), 'Never');
	assert.true(Morebits.string.isInfinity('infinite'), 'Infinite');
	assert.false(Morebits.string.isInfinity('always'), 'Always');
	assert.false(Morebits.string.isInfinity('2 weeks'), 'Relative date');
	assert.false(Morebits.string.isInfinity('2020-04-17T09:31:00.000Z'), 'ISO string');
});
QUnit.test('safeReplace', assert => {
	var string = '{{subst:board|thread=$SECTION|but=$NOTTHIS}} ~~~~';
	assert.strictEqual(Morebits.string.safeReplace(string, '$SECTIONAL', 'thread$'), string, 'No replacement');
	assert.strictEqual(Morebits.string.safeReplace(string, '$SECTION', 'thread$'), '{{subst:board|thread=thread$|but=$NOTTHIS}} ~~~~', 'Replacement');
});
QUnit.test('splitWeightedByKeys', assert => {
	var split = ['{{thisis|one|template}}', '{{another|one}}', '[[heresalink]]', '[[thislink|ispiped]]'];
	var text = split.join(' also ');
	assert.deepEqual(Morebits.string.splitWeightedByKeys(text, '{{', '}}'), split.slice(0, 2), 'Templates');
	assert.deepEqual(Morebits.string.splitWeightedByKeys(text, '[[', ']]'), split.slice(2), 'Links');
	assert.deepEqual(Morebits.string.splitWeightedByKeys(text, '{{', '}}', split[0]), [split[1]], 'Skiplist, non-array');
	assert.deepEqual(Morebits.string.splitWeightedByKeys(text, '[[', ']]', split[2]), [split[3]], 'Skiplist, array');
	assert.deepEqual(Morebits.string.splitWeightedByKeys(text, '[[', ']]', split.slice(2)), [], 'Skiplist, multi-array');
	assert.throws(() => Morebits.string.splitWeightedByKeys (text, '{{', '}'), 'throws: not same length');
	assert.throws(() => Morebits.string.splitWeightedByKeys(text, '[[', ']]', {}), 'throws: skiplist not string or array');
});
QUnit.test('toLowerCaseFirstChar', assert => {
	assert.strictEqual(Morebits.string.toLowerCaseFirstChar('River tam'), 'river tam', 'Lower first');
});
QUnit.test('toUpperCaseFirstChar', assert => {
	assert.strictEqual(Morebits.string.toUpperCaseFirstChar('river Song'), 'River Song', 'Upperfirst');
});
