'use strict';
/* eslint-env node, jest */

// Tweak some mw.configs as needed by tests
mw.config.set({
	wgPageName: 'Macbeth,_King_of_Scotland',
	wgUserGroups: ['interface-admin', 'sysop', '*', 'user', 'autoconfirmed']
});

require('./src/morebits.js');
require('./src/twinkle.js');
require('./src/modules/twinkleblock.js');
require('./src/modules/twinklespeedy.js');
// Load this after twinklespeedy.js. Needs to read Twinkle.speedy.data.
require('./src/modules/twinkleconfig.js');
require('./src/modules/twinkletag.js');
require('./src/modules/twinklewarn.js');
require('./src/modules/twinklexfd.js');
global.Morebits = window.Morebits;

const assert = require('assert');
global.assert = assert;

// Node.js assert doesn't support these functions unlike Qunit assert,
// so temporarily monkey-patch them
assert.true = function (arg, message) {
	if (arg !== true) {
		throw new Error(message);
	}
};
assert.false = function (arg, message) {
	if (arg !== false) {
		throw new Error(message);
	}
};
