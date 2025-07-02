'use strict';

describe('Morebits.taskManager', () => {
	test('Contruction', () => {
		const tm = new Morebits.TaskManager();
		assert.true(tm instanceof Morebits.TaskManager, 'Correct instance');
	});

	// Helper to generate functions as well as testing output in proper order;
	// verifySteps not used because it would require some extra duplication
	const data = {};
	const generateFuncs = () => {
		data.out = [];
		['one', 'two', 'three', 'four'].forEach((step) => {
			data[step] = () => {
				data.out.push(step);
				return jQuery.Deferred().resolve();
			};
		});
	};

	test('Simple', () => {
		generateFuncs();
		const simple = new Morebits.TaskManager();
		simple.add(data.one, []);
		simple.add(data.two, [data.one]);
		simple.add(data.three, [data.two]);
		simple.add(data.four, [data.three]);
		return simple.execute().then(() => {
			assert.deepEqual(data.out, ['one', 'two', 'three', 'four'], 'Simple order');
		});
	});
	test('Complex', () => {
		generateFuncs();
		const complex = new Morebits.TaskManager();
		complex.add(data.one, [data.two]);
		complex.add(data.two, [data.three, data.four]);
		complex.add(data.three, []);
		complex.add(data.four, [data.three]);
		return complex.execute().then(() => {
			assert.deepEqual(data.out, ['three', 'four', 'two', 'one'], 'Complex order');
		});
	});
});
