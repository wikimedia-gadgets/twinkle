describe('Morebits.unbinder', () => {
	test('Construction', () => {
		assert.throws(() => new Morebits.unbinder(), 'throws: no string');
		assert.throws(() => new Morebits.unbinder([42]), 'throws: not a string');
		var u = new Morebits.unbinder('Hello world');
		assert.true(u instanceof Morebits.unbinder, 'Correct instance');
		assert.throws(() => u.unbind(), 'throws: Missing prefix');
		assert.throws(() => u.unbind('w'), 'throws: Missing postfix');
	});
	test('Run', () => {
		var u = new Morebits.unbinder('Hello world <!-- world --> world');
		u.unbind('<!--', '-->');
		u.content = u.content.replace(/world/g, 'earth');
		assert.strictEqual(u.rebind(), 'Hello earth <!-- world --> earth', 'Simple replace');

		u = new Morebits.unbinder('Hello world <!-- world --> world [link link] [[link|link]]');
		assert.true(u instanceof Morebits.unbinder, 'Correct instance');
		u.unbind('<!--', '-->');
		u.unbind('\\[\\[', '\\]\\]');
		u.content = u.content.replace(/world/g, 'earth').replace(/link/g, 'url');
		assert.strictEqual(u.rebind(), 'Hello earth <!-- world --> earth [url url] [[link|link]]', 'Double replace');
	});
});
