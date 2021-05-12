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
	assert.deepEqual(Morebits.wikitext.parseTemplate('Template: ' + makeTemplate(simple) + ' in text', 10), simple, 'Basic parameters');

	var involved = {
		name: 'Proposed deletion/dated',
		parameters: {
			concern: 'Text (paren) then [[piped|link]] and [[WP:WP/LINK]] {{{plural|with|a|template}}} then question?',
			timestamp: '20380119031407',
			nom: 'Jimbo Wales',
			help: 'off'
		}};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(involved)), involved, 'Involved parameters');

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

	var multiLevel = {
		name: 'toplevel',
		parameters: {
			named: '{{namedtop}}',
			other: '{{{namedintro|{{{3|asd}}}|really=yes|a}}}',
			1: 'onetop',
			final: '{{last|iswear}}'
		}
	};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(multiLevel)), multiLevel, 'Multiple levels');
	var parser = {
		name: 'toplevel',
		parameters: {
			named: '{{namedtop}}',
			other: '{{#if:{{{namedintro|{{{3|asd}}}|really=yes|a}}}|true|false}}',
			1: 'onetop',
			final: '{{last|iswear}}'
		}
	};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(parser)), parser, 'Parser function');

	var internal = {
		name: 'internal',
		parameters: {
			named: 'parameter {{tq|with an internal}} template',
			other: '{{#if:{{{namedintro|{{{3|asd}}}|really=yes|a}}}|true|false}}',
			1: 'onetop',
			final: '{{last|iswear}}'
		}
	};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(internal)), internal, 'Internal templates');
});

QUnit.test('Morebits.wikitext.page', assert => {
	var text = '{{short description}}{{about}}[[File:Fee.svg]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!';
	var page = new Morebits.wikitext.page(text);
	assert.true(page instanceof Morebits.wikitext.page, 'Correct instance');
	assert.strictEqual(page.getText(), text, 'Got text');

	// Throws
	assert.throws(() => new Morebits.wikitext.page(text).insertAfterTemplates(), 'throws: no tag');
	assert.throws(() => new Morebits.wikitext.page(text).insertAfterTemplates('tag'), 'throws: no regex');

	// Define all the tests individually, with the appropriate method,
	// input, expected output, and (spreaded) parameters.
	var tests = [
		{
			name: 'simple',
			method: 'removeLink',
			input: text,
			expected: '{{short description}}{{about}}[[File:Fee.svg]]O, she doth {{plural|teach}} the torches to burn bright!',
			params: ['juliet']
		},
		{
			name: 'simple',
			method: 'commentOutImage',
			input: text,
			expected: '{{short description}}{{about}}<!-- too pretty: [[File:Fee.svg]] -->O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['Fee.svg', 'too pretty']
		},
		{
			name: 'simple gallery',
			method: 'commentOutImage',
			input: '<gallery>\nFile:Fee.svg|1\nFile:Gvs.eef|2\n</gallery>',
			expected: '<gallery>\n<!-- too pretty: File:Fee.svg|1 -->\nFile:Gvs.eef|2\n</gallery>',
			params: ['Fee.svg', 'too pretty']
		},
		{
			name: 'simple',
			method: 'addToImageComment',
			input: text,
			expected: '{{short description}}{{about}}[[File:Fee.svg|thumb|size=42]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['Fee.svg', 'thumb|size=42']
		},
		{
			name: 'simple',
			method: 'removeTemplate',
			input: text,
			expected: '{{short description}}{{about}}[[File:Fee.svg]]O, [[Juliet|she]] doth  the torches to burn bright!',
			params: ['plural']
		},
		{
			name: 'simple',
			method: 'insertAfterTemplates',
			input: text,
			expected: '{{short description}}{{about}}{{newtag}}[[File:Fee.svg]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['{{newtag}}', 'short description|about']
		},
		{
			name: 'no linktext',
			method: 'removeLink',
			input: 'O, [[Juliet]] she doth {{plural|teach}} [[Romeo|the]] torches to burn bright!',
			expected: 'O, Juliet she doth {{plural|teach}} [[Romeo|the]] torches to burn bright!',
			params: ['juliet']
		},
		{
			name: 'multiple',
			method: 'removeLink',
			input: 'O, [[Juliet]] she [[juliet|doth]] {{plural|teach}} [[Romeo|the]] [[:Juliet|torches]] [[juliet]] to burn bright!',
			expected: 'O, Juliet she doth {{plural|teach}} [[Romeo|the]] torches juliet to burn bright!',
			params: ['juliet']
		},
		{
			name: 'multiple',
			method: 'commentOutImage',
			input: 'O, [[File:Fee.svg]] she [[File:Fee.svg|doth|teach]] the [[File:Fee.svg|torches]] to burn bright!',
			expected: 'O, <!-- [[File:Fee.svg]] --> she <!-- [[File:Fee.svg|doth|teach]] --> the <!-- [[File:Fee.svg|torches]] --> to burn bright!',
			params: ['Fee.svg']
		},
		{
			name: 'multiple gallery',
			method: 'commentOutImage',
			input: '<gallery>\nFile:Fee.svg|1\nFile:Gvs.eef|2\nFile:Fee.svg    |\n</gallery>',
			expected: '<gallery>\n<!-- too pretty: File:Fee.svg|1 -->\nFile:Gvs.eef|2\n<!-- too pretty: File:Fee.svg    | -->\n</gallery>',
			params: ['Fee.svg', 'too pretty']
		},
		{
			name: 'multiple',
			method: 'addToImageComment',
			input: 'O, [[File:Fee.svg]] she [[File:Fee.svg|doth|teach]] the [[File:Fee.svg|torches]] to burn bright!',
			expected: 'O, [[File:Fee.svg|thumb|size=42|test]] she [[File:Fee.svg|doth|teach|thumb|size=42|test]] the [[File:Fee.svg|torches|thumb|size=42|test]] to burn bright!',
			params: ['Fee.svg', ['thumb', 'size=42', 'test'].join('|')]
		},
		{
			name: 'multiple',
			method: 'removeTemplate',
			input: '{{O}}, {{she|doth}} teach the t{{o}}rches to burn bright!{{o}}',
			expected: ', {{she|doth}} teach the trches to burn bright!',
			params: ['o']
		},
		{
			name: 'no flag',
			method: 'insertAfterTemplates',
			input: '{{short description}}{{About}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			expected: '{{short description}}{{newtag}}{{About}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['{{newtag}}', 'short description|about|Juliet', '']
		},
		{
			name: 'preRegex',
			method: 'insertAfterTemplates',
			input: '{{short description}}{{About}}<!-- random -->{{xfd}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			expected: '{{short description}}{{About}}<!-- random -->{{xfd}}{{newtag}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['{{newtag}}', 'short description|about|Juliet|xfd', null, ['<!-- random -->', '<!-- comment -->']]
		},
		{
			name: 'Forgot the preRegex',
			method: 'insertAfterTemplates',
			input: '{{short description}}{{About}}<!-- random -->{{xfd}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			expected: '{{short description}}{{About}}{{newtag}}<!-- random -->{{xfd}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['{{newtag}}', 'short description|about|Juliet|xfd']
		},
		{
			name: 'File links not displays',
			method: 'removeLink',
			input: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg]] the [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, she [[File:Fee.svg|doth]] {{plural|teach}} File:Fee.svg the [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			params: ['File:Fee.svg']
		},
		{
			name: 'Category links not categorizations',
			method: 'removeLink',
			input: 'O, [[:Category:Romeo|she]] doth teach [[:Category:Romeo]] the torches to burn bright![[Category:Romeo]]',
			expected: 'O, she doth teach Category:Romeo the torches to burn bright![[Category:Romeo]]',
			params: ['Category:Romeo']
		},
		{
			name: 'File displays not links',
			method: 'commentOutImage',
			input: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, [[:File:Fee.svg|she]] <!-- reason: [[File:Fee.svg|doth]] --> {{plural|teach}} [[:File:Fee.svg|the]] <!-- reason: [[File:Fee.svg|torches]] --> [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg', 'reason']
		},
		{
			name: 'File displays not links',
			method: 'addToImageComment',
			input: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth|size=42]] {{plural|teach}} [[:File:Fee.svg|the]] [[File:Fee.svg|torches|size=42]] [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg', 'size=42']
		},
		{
			name: 'Image or file',
			method: 'commentOutImage',
			input: 'O, [[File:Fee.svg|she]] [[Image:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[Image:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, <!-- [[File:Fee.svg|she]] --> <!-- [[Image:Fee.svg|doth]] --> {{plural|teach}} [[:File:Fee.svg|the]] <!-- [[Image:Fee.svg|torches]] --> [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg']
		},
		{
			name: 'Image or file',
			method: 'addToImageComment',
			input: 'O, [[File:Fee.svg|she]] [[Image:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[Image:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, [[File:Fee.svg|she|size=42]] [[Image:Fee.svg|doth|size=42]] {{plural|teach}} [[:File:Fee.svg|the]] [[Image:Fee.svg|torches|size=42]] [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg', 'size=42']
		},
		{
			name: 'Underscores',
			method: 'removeLink',
			input: 'O, [[Romeo and Juliet|she]] [[Romeo_and Juliet|doth]] {{plural|teach}} [[Romeo|the]] [[:Romeo_and_Juliet|torches]] [[Romeo and_Juliet|to]] burn [[Romeo_and_Juliet]] bright!',
			expected: 'O, she doth {{plural|teach}} [[Romeo|the]] torches to burn Romeo_and_Juliet bright!',
			params: ['Romeo and Juliet']
		},
		{
			name: 'Underscores',
			method: 'commentOutImage',
			input: 'O, [[File:Fee cool.svg]] she [[File:Fee_cool.svg|doth|teach]] the torches to burn bright!',
			expected: 'O, <!-- [[File:Fee cool.svg]] --> she <!-- [[File:Fee_cool.svg|doth|teach]] --> the torches to burn bright!',
			params: ['Fee cool.svg']
		},
		{
			name: 'Underscores',
			method: 'addToImageComment',
			input: 'O, [[File:Fee cool.svg]] she [[File:Fee_cool.svg|doth|teach]] the torches to burn bright!',
			expected: 'O, [[File:Fee cool.svg|thumb|size=42]] she [[File:Fee_cool.svg|doth|teach|thumb|size=42]] the torches to burn bright!',
			params: ['Fee cool.svg', 'thumb|size=42']
		},
		{
			name: 'Underscores',
			method: 'removeTemplate',
			input: 'O, {{plural_template|she}} doth {{plural template|teach}} the {{Plural_template|torches}} to burn bright!',
			expected: 'O,  doth  the  to burn bright!',
			params: ['plural_template']
		},
		{
			name: 'Alt namespace',
			method: 'removeTemplate',
			input: 'O, she doth {{User:ThisIsaTest/plural|teach}} the torches to burn bright!',
			expected: 'O, she doth  the torches to burn bright!',
			params: ['User:ThisIsaTest/plural']
		},
		{
			name: 'Template namespace',
			method: 'removeTemplate',
			input: 'O, {{plural|she}} doth {{Template:plural|teach}} the {{template:plural|torches}} to burn bright!',
			expected: 'O,  doth  the  to burn bright!',
			params: ['plural']
		},
		{
			name: 'Similar names',
			method: 'commentOutImage',
			input: 'O, [[File:Fee.tif|she]] doth [[File:Fee.tiff|teach]] the [[File:Fee.tifff]] torches to burn bright!',
			expected: 'O, <!-- [[File:Fee.tif|she]] --> doth [[File:Fee.tiff|teach]] the [[File:Fee.tifff]] torches to burn bright!',
			params: ['Fee.tif']
		},
		{
			name: 'Similar gallery',
			method: 'commentOutImage',
			input: '<gallery>\nFile:Fee.tif|1\nFile:Fee.tiff|2\nFile:Fee.tifff    |\n</gallery>',
			expected: '<gallery>\n<!-- File:Fee.tif|1 -->\nFile:Fee.tiff|2\nFile:Fee.tifff    |\n</gallery>',
			params: ['Fee.tif']
		},
		{
			name: 'Similar names',
			method: 'addToImageComment',
			input: 'O, [[File:Fee.tif|she]] doth [[File:Fee.tiff|teach]] the [[File:Fee.tifff]] torches to burn bright!',
			expected: 'O, [[File:Fee.tif|she|thumb|size=42]] doth [[File:Fee.tiff|teach]] the [[File:Fee.tifff]] torches to burn bright!',
			params: ['Fee.tif', 'thumb|size=42']
		},
		{
			name: 'Similar names',
			method: 'removeTemplate',
			input: 'O, {{plural|she|}} doth {{pluralize|teach}} the {{plural  | torches}} t{{plural \n\n |}}o {{plural temp|burn}} bright!',
			expected: 'O,  doth {{pluralize|teach}} the  to {{plural temp|burn}} bright!',
			params: ['plural']
		},
		{
			name: 'AltCaps',
			method: 'removeLink',
			input: 'O, [[WP:Juliet]] she [[wp:juliet|doth]] {{plural|teach}} [[Romeo|the]] [[wikipedia:Juliet|torches]] [[Wikipedia:juliet]] to burn bright!',
			expected: 'O, WP:Juliet she doth {{plural|teach}} [[Romeo|the]] torches Wikipedia:juliet to burn bright!',
			params: ['wikipedia:juliet']
		},
		{
			name: 'AltCaps',
			method: 'commentOutImage',
			input: 'O, [[File:Fee.svg]] she [[file:Fee.svg|doth|teach]] the [[File:fee.svg|torches]] to burn [[file:fee.svg]] bright!',
			expected: 'O, <!-- [[File:Fee.svg]] --> she <!-- [[file:Fee.svg|doth|teach]] --> the <!-- [[File:fee.svg|torches]] --> to burn <!-- [[file:fee.svg]] --> bright!',
			params: ['fee.svg']
		},
		{
			name: 'AltCaps gallery',
			method: 'commentOutImage',
			input: '<gallery>\nFile:Fee.svg|1\nfile:Fee.svg|2\nFile:fee.svg|3\nfile:fee.svg|4\n</gallery>',
			expected: '<gallery>\n<!-- File:Fee.svg|1 -->\n<!-- file:Fee.svg|2 -->\n<!-- File:fee.svg|3 -->\n<!-- file:fee.svg|4 -->\n</gallery>',
			params: ['Fee.svg']
		},
		{
			name: 'AltCaps',
			method: 'addToImageComment',
			input: 'O, [[File:Fee.svg]] she [[file:Fee.svg|doth|teach]] the [[File:fee.svg|torches]] to burn [[file:fee.svg]] bright!',
			expected: 'O, [[File:Fee.svg|thumb]] she [[file:Fee.svg|doth|teach|thumb]] the [[File:fee.svg|torches|thumb]] to burn [[file:fee.svg|thumb]] bright!',
			params: ['Fee.svg', 'thumb']
		}
	];

	tests.forEach((test) => {
		var page = new Morebits.wikitext.page(test.input);
		assert.strictEqual(page[test.method](...test.params).getText(), test.expected, test.method + ' - ' + test.name);
	});
});
