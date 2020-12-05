QUnit.module('Morebits.array');
QUnit.test('chunk', assert => {
	assert.deepEqual(Morebits.array.chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3), [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]], '10 over 3');
	assert.deepEqual(Morebits.array.chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 42), [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], 'Size > length');
	assert.deepEqual(Morebits.array.chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], 'No size');
	assert.throws(() => Morebits.array.chunk(42), 'throws');
});
QUnit.test('dups', assert => {
	assert.deepEqual(Morebits.array.dups([1, 1, 2, 3, 5, 8, 13, 5, 13, 42, 42, 2]), [1, 5, 13, 42, 2], 'Duplicates');
	assert.throws(() => Morebits.array.dups(42), 'throws');
});
QUnit.test('uniq', assert => {
	assert.deepEqual(Morebits.array.uniq([1, 1, 2, 3, 5, 8, 13, 5, 13, 42, 42, 2]), [1, 2, 3, 5, 8, 13, 42], 'Remove duplicates');
	assert.throws(() => Morebits.array.uniq(42), 'throws');
});
