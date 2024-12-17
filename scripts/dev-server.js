/* eslint-env node, es6 */

/**
 * Script to load local version of Twinkle on-wiki for testing.
 * Run via `node dev-server.js` or `npm start`.
 * Requires Node.js v12 or above.
 */

const http = require('http');
const fs = require('fs/promises');

async function readFiles(filePaths) {
	return Promise.all(filePaths.map(path => fs.readFile(__dirname + '/../' + path).then(blob => blob.toString())));
}
const server = http.createServer(async (request, response) => {
	const moduleFiles = (await fs.readdir('./modules')).filter(f => f.endsWith('.js'));
	const jsFiles = ['morebits.js', 'twinkle.js'].concat(moduleFiles.map(f => 'modules/' + f));
	const cssFiles = ['morebits.css', 'twinkle.css'];

	let jsCode = `mw.loader.using(['jquery.ui', 'ext.gadget.select2']).then(function () {\n`;

	if (process.argv[2] !== '--no-sysop') {
		// Pretend to be a sysop, if not one already - enables testing of sysop modules by non-sysops
		jsCode += `if (mw.config.get('wgUserGroups').indexOf('sysop') === -1) mw.config.get('wgUserGroups').push('sysop');\n`;
	}

	const [scripts, styles] = await Promise.all([
		readFiles(jsFiles),
		readFiles(cssFiles)
	]);
	for (let script of scripts) {
		jsCode += script;
	}
	for (let stylesheet of styles) {
		let css = stylesheet.replace(/\s+/g, ' ');
		css = JSON.stringify(css); // escape double quotes and backslashes
		jsCode += `;mw.loader.addStyleTag(${css});`;
	}
	jsCode += `;console.log('Loaded debug version of Twinkle.');`;
	jsCode += `});`; // End mw.loader.using
	response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
	response.end(jsCode, 'utf-8');
});

const hostname = '127.0.0.1';
const port = process.env.PORT || '5500';
const GADGET_NAME = 'Twinkle';

server.listen(port, hostname, async () => {
	console.log(`Server running at http://${hostname}:${port}/`);
	console.log(`Please add "mw.loader.load('http://${hostname}:${port}');" to your on-wiki common.js file to begin testing.`);

	if (!process.env.MW_OAUTH2_TOKEN && (!process.env.MW_USERNAME || !process.env.MW_PASSWORD)) {
		return console.log("Ensure the Twinkle gadget version is disabled. If you provide your credentials as environment variables (either the BotPassword credentials as MW_USERNAME and MW_PASSWORD, or an owner-only OAuth2 consumer token as MW_OAUTH2_TOKEN), we'll try to automatically disable the gadget for you and re-enable it when you're done testing.");
	}
	let mwn, user, initTime;
	try {
		mwn = require('mwn').mwn;
	} catch (_) {
		return console.error("Failed to load mwn. Please run `npm install` and retry.");
	}
	try {
		user = await mwn.init({
			"apiUrl": "https://en.wikipedia.org/w/api.php",
			"username": process.env.MW_USERNAME,
			"password": process.env.MW_PASSWORD,
			"OAuth2AccessToken": process.env.MW_OAUTH2_TOKEN,
			"silent": true
		});
		initTime = Date.now();
	} catch (e) {
		if (e instanceof mwn.Error) {
			console.log(`[mwn]: can't disable twinkle as gadget: login failure: ${e}`);
			console.log(e.stack);
		}
		return;
	}
	await user.saveOption('gadget-' + GADGET_NAME, '0');
	console.log('[i] Disabled twinkle as gadget.');

	// Allow async operations in exit hook
	process.stdin.resume();

	// Catch ^C
	process.on('SIGINT', async () => {
		try {
			if ((Date.now() - initTime)/1000/60 >= 15) {
				// More than 15 minutes passed, preemptively fetch new token
				await user.getTokens();
			}
			await user.saveOption('gadget-' + GADGET_NAME, '1');
			console.log('[i] Re-enabled twinkle as gadget.');
		} catch (e) {
			console.log(`[i] failed to re-enable twinkle gadget: ${e}`);
			console.log(e.stack);
		} finally {
			process.exit();
		}
	});
});
