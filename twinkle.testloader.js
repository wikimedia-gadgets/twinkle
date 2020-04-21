/* globals mocha */

$.when(
	mw.loader.using(['mediawiki.api', 'mediawiki.util', 'mediawiki.user', 'mediawiki.Title']),
	$.ready
).then(function() {

	mw.util.$content.prepend(
		$('<div>').attr('id', 'mocha')
	);

	mw.loader.load('https://unpkg.com/mocha/mocha.css', 'text/css');

	// Some CSS adjustments for mocha to look better in Wikipedia environment
	mw.util.addCSS(
		'#mocha-stats { position: relative }' +
		'#mocha { margin: 10px 20px 20px 20px }' +
		'#mocha .test.pass::before, #mocha .test.fail::before, #mocha .test.pending::before { font-size: 20px }'
	);

	return $.when(
		// TODO: download these and put in a lib directory
		mw.loader.getScript('https://unpkg.com/chai/chai.js'),
		mw.loader.getScript('https://unpkg.com/mocha/mocha.js')
	);

}).then(function() {
	mocha.setup('bdd');

	return mw.loader.getScript('http://127.0.0.1:5500/morebits.test.js');

}).then(function() {

	$('#mocha').append(
		$('<button>').text('Run Twinkle unit tests').click(function() {
			$(this).remove(); // remove button after being clicked, as it can't be used again
			mocha.run();
		})
	);
});
