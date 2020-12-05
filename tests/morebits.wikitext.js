QUnit.module('Morebits.wikitext');
// Skip until fixing a bug in parseTemplate (#1214)
QUnit.skip('parseTemplate', assert => {
	// Function to help build a template from a sample object
	var makeTemplate = function(data) {
		var template = '{{' + data.name;
		Object.keys(data.parameters).forEach(function(key) {
			template += '|' + key + '=' + data.parameters[key];
		});
		return template + '}}';
	};

	var simpleTemplate = {
		name: 'prod',
		parameters: {
			reason: 'because',
			morereason: 'I said so',
			timestamp: '42'
		}};
	assert.deepEqual(Morebits.wikitext.parseTemplate('Template: ' + makeTemplate(simpleTemplate) + ' in text', 10), simpleTemplate, 'Basic parameter test');

	var involvedTemplate = {
		name: 'Proposed deletion/dated',
		parameters: {
			concern: 'Text (paren) then [[piped|link]] and [[WP:WP/LINK]] {{{plural|with|a|template}}} then question?',
			timestamp: '20380119031407',
			nom: 'Jimbo Wales',
			help: 'off'
		}};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(involvedTemplate)), involvedTemplate, 'Involved parameter test');
});
QUnit.test('Morebits.wikitext.page', assert => {
	var text = '{{short description}}{{about}}[[File:Fee.svg]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!';
	var page = new Morebits.wikitext.page(text);
	assert.strictEqual(page.getText(), text, 'text');
	assert.strictEqual(page.addToImageComment('Fee.svg', 'thumb|size=42').getText(), '{{short description}}{{about}}[[File:Fee.svg|thumb|size=42]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!', 'Add data');
	assert.strictEqual(page.commentOutImage('Fee.svg', 'too pretty').getText(), '{{short description}}{{about}}<!-- too pretty: [[File:Fee.svg|thumb|size=42]] -->O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!', 'Comment out');
	assert.strictEqual(page.removeLink('juliet').getText(), '{{short description}}{{about}}<!-- too pretty: [[File:Fee.svg|thumb|size=42]] -->O, she doth {{plural|teach}} the torches to burn bright!', 'Remove link');
	assert.strictEqual(page.removeTemplate('plural').getText(), '{{short description}}{{about}}<!-- too pretty: [[File:Fee.svg|thumb|size=42]] -->O, she doth  the torches to burn bright!', 'Remove template');

	assert.strictEqual(page.insertAfterTemplates('{{newtag}}', 'short description|about').getText(), '{{short description}}{{about}}{{newtag}}<!-- too pretty: [[File:Fee.svg|thumb|size=42]] -->O, she doth  the torches to burn bright!', 'Remove template');
	assert.throws(() => page.insertAfterTemplates(), 'throws: no tag');
	assert.throws(() => page.insertAfterTemplates('{{newtag}}'), 'throws: no regex');
});
