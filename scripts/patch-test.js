/* eslint-env node, es6 */

/**
 * Creates a file patch-test-loader.js with the necessary import statements
 * to test the changes made in a pull request or in the current working state
 *
 * How to use:
 * - Run `npm run patchtest` which generates patch-test-loader.js
 * - Set up a localhost server (such as by using npm run server or by running
 *   php -S 127.0.0.1:5500) and load patch-test-loader.js in the wiki environment,
 *   using the browser console or the common.js page.
 * - You can provide a different port by running `npm run patchtest -- 1234`
 */

const fs = require('fs');
const {execSync} = require('child_process');

const port = isNaN(Number(process.argv[2])) ? '5500' : process.argv[2];
const server = 'http://127.0.0.1:' + port;

// find the last common commit between this branch and master, and get the list
// of files changed since that commit
try {
	let lastCommonCommit = execSync('git merge-base HEAD master').toString().trim();
	let changedFiles = execSync(`git diff ${lastCommonCommit} --name-only`).toString().split(/\r?\n/);
	createTestLoader(changedFiles);
} catch (err) {
	console.log(err.toString());
}

/** @param {string[]} changedFiles */
function createTestLoader(changedFiles) {

	let importsCount = 0; // for the message written to the console in the ends
	let importLine = function(file) {
		if (!changedFiles.includes(file)) {
			return '';
		}
		if (file.endsWith('.js')) {
			importsCount++;
			if (file.startsWith('modules/')) {
				return `mw.loader.getScript('${server}/${file}');`;
			}
			return `return mw.loader.getScript('${server}/${file}');`;
		} else if (file.endsWith('.css')) {
			importsCount++;
			return `mw.loader.load('${server}/${file}', 'text/css');`;
		}
		return '';
	};

	let jsLoaderSource = `// Wait for Twinkle gadget to load, so that we can then overwrite it
	mw.loader.using('ext.gadget.Twinkle').then(function() {
		${importLine('morebits.css')}
		${importLine('morebits.js')}

	}).then(function() {
		${importLine('twinkle.css')}
		${importLine('twinkle.js')}

	}).then(function() {
		${importLine('modules/friendlyshared.js')}
		${importLine('modules/friendlytag.js')}
		${importLine('modules/friendlytalkback.js')}
		${importLine('modules/friendlywelcome.js')}
		${importLine('modules/twinklearv.js')}
		${importLine('modules/twinklebatchdelete.js')}
		${importLine('modules/twinklebatchprotect.js')}
		${importLine('modules/twinklebatchundelete.js')}
		${importLine('modules/twinkleblock.js')}
		${importLine('modules/twinkleconfig.js')}
		${importLine('modules/twinkledeprod.js')}
		${importLine('modules/twinklediff.js')}
		${importLine('modules/twinklerollback.js')}
		${importLine('modules/twinkleimage.js')}
		${importLine('modules/twinkleprod.js')}
		${importLine('modules/twinkleprotect.js')}
		${importLine('modules/twinklespeedy.js')}
		${importLine('modules/twinkleunlink.js')}
		${importLine('modules/twinklewarn.js')}
		${importLine('modules/twinklexfd.js')}
	});`.replace(/^\t/mg, '').replace(/^\s*$/mg, '');

	fs.writeFileSync('./scripts/patch-test-loader.js', jsLoaderSource, console.log);

	console.log(`Wrote import statements for ${importsCount} modified file${importsCount > 1 ? 's' : ''} to scripts/patch-test-loader.js`);
}
