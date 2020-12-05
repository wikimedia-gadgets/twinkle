QUnit.module('Morebits.wikitext');
QUnit.test('parseTemplate', assert => {
	// Function to help build a template from a sample object
	var makeTemplate = function(data) {
		var template = '{{' + data.name;
		Object.keys(data.parameters).forEach(function(key) {
			template += '|' + key + '=' + data.parameters[key];
		});
		return template + '}}';
	};

	var simple = {
		name: 'prod',
		parameters: {
			reason: 'because',
			morereason: 'I said so',
			timestamp: '42'
		}};
	assert.deepEqual(Morebits.wikitext.parseTemplate('Template: ' + makeTemplate(simple) + ' in text', 10), simple, 'Basic parameter test');

	var involved = {
		name: 'Proposed deletion/dated',
		parameters: {
			concern: 'Text (paren) then [[piped|link]] and [[WP:WP/LINK]] {{{plural|with|a|template}}} then question?',
			timestamp: '20380119031407',
			nom: 'Jimbo Wales',
			help: 'off'
		}};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(involved)), involved, 'Involved parameter test');

	// Try a variety of whitespace options
	var whitespace = '{{' + involved.name + ' |concern = ' + involved.parameters.concern + ' | timestamp =' + involved.parameters.timestamp + '| nom= ' + involved.parameters.nom + '|help = ' + involved.parameters.help + ' }}';
	assert.deepEqual(Morebits.wikitext.parseTemplate(whitespace), involved, 'Involved parameters with whitespace');

	var unnamed = {
		name: 'db-meta',
		parameters: {
			criterion: 'G13',
			1: ' reason ', // Note the surrounding whitespace, unnamed parameters can retain these
			middle: '',
			2: 'extra'
		}
	};
	var unnamedTemplate = '{{' + unnamed.name + '|criterion=' + unnamed.parameters.criterion + '||' + unnamed.parameters['1'] + '| middle =|2= ' + unnamed.parameters['2'] + '|}}';
	assert.deepEqual(Morebits.wikitext.parseTemplate(unnamedTemplate), unnamed, 'Unnamed and empty parameters');
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
