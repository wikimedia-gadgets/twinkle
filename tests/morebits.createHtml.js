QUnit.module('Morebits.createHtml');
QUnit.test('renderWikilinks', assert => {
	assert.strictEqual(
		Morebits.createHtml.renderWikilinks('[[Main Page]]'),
		`<a target="_blank" href="/wiki/Main_Page" title="Main Page">Main Page</a>`,
		'simple link'
	);
	assert.strictEqual(
		Morebits.createHtml.renderWikilinks('surrounding text [[Main Page|the main page]]'),
		`surrounding text <a target="_blank" href="/wiki/Main_Page" title="Main Page">the main page</a>`,
		'link with display text'
	);
	assert.strictEqual(
		Morebits.createHtml.renderWikilinks('surrounding text [["Weird Al" Yankovic]]'),
		`surrounding text <a target="_blank" href="/wiki/%22Weird_Al%22_Yankovic" title="&#34;Weird Al&#34; Yankovic">"Weird Al" Yankovic</a>`,
		// jsdom in node turns " in title attribute into &#34; whereas Chrome seems turns it into &quot;
		// but it works either way
		'link with double quote'
	);
});
