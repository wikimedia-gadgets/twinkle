// Tweak some mw.configs as needed by tests
mw.config.set({
	wgPageName: 'Macbeth,_King_of_Scotland',
	wgUserGroups: ['interface-admin', 'sysop', '*', 'user', 'autoconfirmed'],
	wgArticlePath: "/wiki/$1",
	wgScriptPath: "/w"
});

require('../morebits.js');
global.Morebits = window.Morebits;

global.assert = require('assert');

// Node.js assert doesn't support these functions unlike Qunit assert,
// so temporarily monkey-patch them
assert.true = function (arg, message) {
	if (arg !== true) {
		throw new Error(message);
	}
}
assert.false = function (arg, message) {
	if (arg !== false) {
		throw new Error(message);
	}
}
