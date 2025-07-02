'use strict';

describe('Morebits.batchOperation', () => {
	test('Contruction', () => {
		assert.true(new Morebits.BatchOperation() instanceof Morebits.BatchOperation, 'Correct instance');
	});
	const batch = new Morebits.BatchOperation();
	const pageList = ['Macbeth', 'Hamlet', 'Romeo and Juliet', 'Much Ado About Nothing', 'Tempest'];
	batch.setPageList(pageList);
	const chunkLength = 2;
	batch.setOption('chunkSize', chunkLength);
	test('Run', () => {
		let all = '';
		const runFunc = function (page) {
			all += page;
			batch.workerSuccess();
		};
		batch.run(runFunc);
		assert.strictEqual(all, pageList.join(''), 'batch run');
	});
	// Will leave a run hanging, who cares?
	test('Chunksize', () => {
		const list = [];
		const runFunc = function (page) {
			list.push(page);
		};
		batch.run(runFunc);
		assert.strictEqual(list.length, chunkLength, 'Chunk length');
	});
});
