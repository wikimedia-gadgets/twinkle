QUnit.module('Morebits.batchOperation');
QUnit.test('Contruction', assert => {
	assert.true(new Morebits.batchOperation() instanceof Morebits.batchOperation, 'Correct instance');
});
var batch = new Morebits.batchOperation();
var pageList = ['Macbeth', 'Hamlet', 'Romeo and Juliet', 'Much Ado About Nothing', 'Tempest'];
batch.setPageList(pageList);
var chunkLength = 2;
batch.setOption('chunkSize', chunkLength);
QUnit.test('Run', assert => {
	var all = '';
	var runFunc = function(page) {
		all += page;
		batch.workerSuccess();
	};
	batch.run(runFunc);
	assert.strictEqual(all, pageList.join(''), 'batch run');
});
// Will leave a run hanging, who cares?
QUnit.test('Chunksize', assert => {
	var list = [];
	var runFunc = function(page) {
		list.push(page);
	};
	batch.run(runFunc);
	assert.strictEqual(list.length, chunkLength, 'Chunk length');
});
