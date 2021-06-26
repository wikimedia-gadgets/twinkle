/* eslint-env node, es6 */

const http = require('http');
const fs = require('fs/promises');
const { mwn } = require('mwn');

async function readFile(filepath) {
	return (await fs.readFile(__dirname + '/../' + filepath)).toString();
}
const server = http.createServer(async (request, response) => {
	const moduleFiles = (await fs.readdir('./modules')).filter(f => f.endsWith('.js'));
	const jsFiles = ['morebits.js', 'twinkle.js'].concat(moduleFiles.map(f => 'modules/' + f));
	const cssFiles = ['morebits.css', 'twinkle.css'];

	let jsCode = `mw.loader.load(['jquery.ui', 'ext.gadget.select2']);`;
	for (let file of jsFiles) {
		jsCode += await readFile(file);
	}
	for (let file of cssFiles) {
		let css = (await readFile(file)).replace(/\s+/g, ' ');
		jsCode += `;mw.loader.addStyleTag('${css}');`;
	}
	response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
	response.end(jsCode, 'utf-8');
});

const hostname = '127.0.0.1';
const port = process.env.PORT || '5500';

const credentialsProvided = process.env.MW_USERNAME && process.env.MW_PASSWORD;
server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
	console.log(`Please add "mw.loader.load('http://${hostname}:${port}');" to your on-wiki common.js file to begin testing.` + (!credentialsProvided ? `\nEnsure the Twinkle gadget version is disabled. If you provide your MW_USERNAME and MW_PASSWORD as environment variables, we'll try to automatically disable the gadget for you and re-enable it when you're done testing.` : ''));
});

const GADGET_NAME = 'Twinkle';

// Disable the deployed gadget version when we begin our testing,
// enable it back again when we stop testing.
(async () => {
	if (!credentialsProvided) return;
	let user;
	try {
		user = await mwn.init({
			"apiUrl": "https://en.wikipedia.org/w/api.php",
			"username": process.env.MW_USERNAME,
			"password": process.env.MW_PASSWORD,
			"silent": true
		});
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
			await user.saveOption('gadget-' + GADGET_NAME, '1');
			console.log('[i] Re-enabled twinkle as gadget.');
		} catch (e) {
			console.log(`[i] failed to re-enable twinkle gadget: ${e}`);
			console.log(e.stack);
		} finally {
			process.exit();
		}
	});
})();
