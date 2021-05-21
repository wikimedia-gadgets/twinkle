describe('Morebits.createHtml', () => {

	test('createHtml', () => {
		let fragment = Morebits.createHtml('string');
		assert.strictEqual(fragment.childNodes.length, 1);
		assert.strictEqual(fragment.childNodes[0].nodeName, '#text');

		fragment = Morebits.createHtml(Morebits.htmlNode('a', 'Anchor'));
		assert.strictEqual(fragment.childNodes.length, 1);
		assert.strictEqual(fragment.childNodes[0].nodeName, 'A');

		fragment = Morebits.createHtml(['text', document.createElement('b')]);
		assert.strictEqual(fragment.childNodes.length, 2);
		assert.strictEqual(fragment.childNodes[0].nodeName, '#text');
		assert.strictEqual(fragment.childNodes[1].nodeName, 'B');

		fragment = Morebits.createHtml('Hi <script>alert("boom!")</script>');
		assert.strictEqual(fragment.childNodes.length, 1);
		assert.strictEqual(fragment.childNodes[0].nodeName, '#text');

	});

	test('renderWikilinks', () => {
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

		assert.strictEqual(
			Morebits.createHtml.renderWikilinks('<code>[[CODE]]</code> [[Yankovic]]'),
			`<code>[[CODE]]</code> <a target="_blank" href="/wiki/Yankovic" title="Yankovic">Yankovic</a>`,
			'wikilink in <code> tag'
		);
	});

});
