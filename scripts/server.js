/* eslint-env node, es6 */

const http = require('http');
const fs = require('fs');

const server = http.createServer((request, response) => {
	const filePath = '.' + request.url;
	let contentType;
	if (request.url.endsWith('.js')) {
		contentType = 'text/javascript';
	} else if (request.url.endsWith('.css')) {
		contentType = 'text/css';
	} else {
		contentType = 'text/plain';
	}
	fs.readFile(filePath, function(error, content) {
		if (error) {
			response.end('Oops, something went wrong: ' + error.code + ' ..\n');
		} else {
			response.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
			response.end(content, 'utf-8');
		}
	});
});

const hostname = '127.0.0.1';
const port = isNaN(Number(process.argv[2])) ? '5500' : process.argv[2];

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
