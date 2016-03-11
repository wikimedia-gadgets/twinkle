// Script depends on jQuery dialog widget
mw.loader.using( 'jquery.ui.dialog', function() {
	// Construct object (to prevent namespace conflicts)
	Twinkle.morebitsTest = {

		launchDialog: function( userInterface ) {
			userInterface.dialog('open');
		},

		initSimpleWindow: function() {
			var Window = new Morebits.simpleWindow( 600, 400 );
			Window.setTitle( "Test morebits.js" );
			Window.display();
			var form = new Morebits.quickForm( null );
			var main_group = form.append( {
				type:'select',
				name:'main_group',
				event:null
			} );
			var result = form.render();
			Window.setContent( result );
			Window.display();
			result.main_group.root = result;
			Morebits.status.init( result );
			Morebits.wiki.actionCompleted.redirect = wgPageName;
			Morebits.wiki.actionCompleted.notice = "Test complete, reloading talk page in a few seconds";
		},

		setPageOptions: function(page) {
			page.setEditSummary( $('#editSummary').val() );
			if ( $('#runTestForm input[name="followRedirect"]').attr('checked') ) {
				page.setFollowRedirect(true);
			}
			if ( $('#runTestForm input[name="minorEdit"]').attr('checked') ) {
				page.setMinorEdit(true);
			}
			if ( $('#runTestForm input[name="watchlist"]').attr('checked') ) {
				page.setWatchlist(true);
			}
			if ( $('#runTestForm input[name="watchlistFromPreferences"]').attr('checked') ) {
				page.setWatchlistFromPreferences(true);
			}
			if ( $('#runTestForm input[name="noRetries"]').attr('checked') ) {
				page.setMaxConflictRetries(0);
				page.setMaxRetries(0);
			}
			var section = $('#runTestForm input[name="sectionNumber"]').val();
			if ( section != "" ) {
				page.setPageSection( Number( section ) );
			}
			page.setCreateOption(morebits_test_createOption);

			if ( $('#runTestForm input[name="lookupCreator"]').attr('checked') ) {
				page.lookupCreator(Twinkle.morebitsTest.lookupCreatorCallback);
			}
		},

		loadCallbackInsert: function(page) {
			var params = page.getCallbackParameters();
			var text = page.getPageText();
			var pos = text.indexOf(params['beforeText']);
			if (pos == -1) {
				alert('Search text "' + params['beforeText'] + '" not found!');
				return;
			}
			page.setPageText(text.substr(0, pos) + params['newText'] + text.substr(pos));
			page.save(Twinkle.morebitsTest.finalSaveCallback);
		},

		loadCallbackReplace: function(page) {
			var params = page.getCallbackParameters();
			page.setPageText(params['newText']);
			page.save(Twinkle.morebitsTest.finalSaveCallback);
		},

		lookupCreatorCallback: function(page) {
			alert("Page was created by: " + page.getCreator());
		},

		finalSaveCallback: function(page) {
			Morebits.wiki.actionCompleted.redirect = page.getPageName(); // get result of redirects
		},

		initialize: function() {

			// Define runTest interface
			// Can also use alternative syntax new to jQuery 1.4:
			//    $('<div style="margin-top:0.4em;"></div>').html( 'Text to be added:' )
			//  → $('<div/>', { css: { 'margin-top': '0.4em' }, text: 'Text to be added:' } )

			morebits_test_createOption = null;

			Twinkle.morebitsTest.$runTests = $('<div id="runTestForm" style="position:relative;"></div>')
				.append( $('<div style="margin-top:0.4em;"></div>').html( 'Text to be added:<br/>' ).append( $('<textarea id="message" id="runTestMessage" style="width:99%" rows="4" cols="60"></textarea>') ) )
				.append( $('<div style="margin-top:0.4em;"></div>').html( 'Insert text before (for insert mode only):<br/>' ).append( $('<textarea id="beforeText" style="width:99%" rows="4" cols="60"></textarea>') ) )
				.append( $('<div style="margin-top:0.4em;"></div>').html( 'Edit summary:<br/>' ).append( $('<textarea id="editSummary" style="width:99%" rows="4" cols="60"></textarea>') ) )
				.append( $('<div style="margin-top:0.4em;"></div>').html( 'Section number: <input type="text" name="sectionNumber" size="3">' ) )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="followRedirect"/> Follow redirect') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="minorEdit"/> Minor edit') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="watchlist"/> Add to watchlist') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="watchlistFromPreferences"/> Add to watchlist based on preference settings') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="noRetries"/> Disable retries') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="lookupCreator"/> Lookup page creator<hr/>') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="" onclick="morebits_test_createOption=value" checked/> Create page if needed, unless deleted since loaded<br>') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="recreate" onclick="morebits_test_createOption=value"/> Create page if needed<br>') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="createonly" onclick="morebits_test_createOption=value"/> Only create a new page<br>') )
				.append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="nocreate" onclick="morebits_test_createOption=value"/> Do not create a new page<br>') )
				.dialog({
					width: 500,
					autoOpen: false,
					title: 'Test Morebits.wiki.page class',
					modal: true,
					buttons: {
						"Append": function() {
							$(this).dialog('close');
							Twinkle.morebitsTest.initSimpleWindow();

							var page = new Morebits.wiki.page(wgPageName);
							page.setAppendText( $('#message').val() );
							Twinkle.morebitsTest.setPageOptions(page);
							page.append(Twinkle.morebitsTest.finalSaveCallback);
						},
						"Prepend": function(e) {
							$(this).dialog('close');
							Twinkle.morebitsTest.initSimpleWindow();

							var page = new Morebits.wiki.page(wgPageName);
							page.setPrependText( $('#message').val() );
							Twinkle.morebitsTest.setPageOptions(page);
							page.prepend(Twinkle.morebitsTest.finalSaveCallback);
						},
						"Insert": function(e) {
							if ( $('#beforeText').val() == "" ) {
								alert ("Text to insert before must be specified!");
								return;
							}
							$(this).dialog('close');
							Twinkle.morebitsTest.initSimpleWindow();

							var page = new Morebits.wiki.page(wgPageName);
							page.setCallbackParameters( {
								beforeText: $('#beforeText').val(),
								newText: $('#message').val()
								});
							Twinkle.morebitsTest.setPageOptions(page);
							page.load(Twinkle.morebitsTest.loadCallbackInsert);
						},
						"Replace": function(e) {
							$(this).dialog('close');
							Twinkle.morebitsTest.initSimpleWindow();

							var page = new Morebits.wiki.page(wgPageName);
							page.setCallbackParameters( {
								newText: $('#message').val()
								});
							Twinkle.morebitsTest.setPageOptions(page);
							page.load(Twinkle.morebitsTest.loadCallbackReplace);
						}
					}
				}); // close .dialog

		} // close initialize function

	} // close Twinkle.morebitsTest object

	Twinkle.morebitsTest.initialize();
}); // close mw.loader

Twinkle.morebitsTestInit = function () {
	if ( wgAction == 'view' && skin == 'vector' && wgNamespaceNumber >= 0 ) {
		twAddPortletLink( ("javascript:Twinkle.morebitsTest.launchDialog(Twinkle.morebitsTest.$runTests)"), "Test", "tw-test", "Test morebits.js", "");
	}
}

// register initialization callback
var Twinkle;
if ( typeof Twinkle === 'undefined' ) {
	throw new Error( 'Attempt to load module "morebits-test" without having loaded Twinkle previously.' );
};
Twinkle.addInitCallback( Twinkle.morebitsTestInit );
