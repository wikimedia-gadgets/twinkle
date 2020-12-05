/**
 * Open the node REPL then `require('./path/to/mb_repl')`
 * Used in QUnit tests.
 */

// Consistent environment stuff (mw, window/document via jsdom, jQuery)
require(__dirname + '/mb_repl_head.js');

// Load mw.config data
require(__dirname + '/mw_config_data.js');

require(__dirname + '/../../morebits.js');
global.Morebits = window.Morebits;
