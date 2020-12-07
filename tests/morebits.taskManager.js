QUnit.module('Morebits.taskManager');
QUnit.test('Contruction', assert => {
	var tm = new Morebits.taskManager();
	assert.true(tm instanceof Morebits.taskManager, 'Correct instance');
});

// Helper to generate functions as well as testing output in proper order;
// verifySteps not used because it would require some extra duplication
var data = {};
var generateFuncs = () => {
	data.out = [];
	['one', 'two', 'three', 'four'].forEach((step) => {
		data[step] = () => {
			data.out.push(step);
			return jQuery.Deferred().resolve();
		};
	});
};

QUnit.test('Simple', assert => {
	generateFuncs();
	var simple = new Morebits.taskManager();
	simple.add(data.one, []);
	simple.add(data.two, [data.one]);
	simple.add(data.three, [data.two]);
	simple.add(data.four, [data.three]);
	return simple.execute().then(() => {
		assert.deepEqual(data.out, ['one', 'two', 'three', 'four'], 'Simple order');
	});
});
QUnit.test('Complex', assert => {
	generateFuncs();
	var complex = new Morebits.taskManager();
	complex.add(data.one, [data.two]);
	complex.add(data.two, [data.three, data.four]);
	complex.add(data.three, []);
	complex.add(data.four, [data.three]);
	return complex.execute().then(() => {
		assert.deepEqual(data.out, ['three', 'four', 'two', 'one'], 'Complex order');
	});
});
