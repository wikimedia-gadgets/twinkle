//<nowiki>
if (( wgAction == 'view' && skin == 'vector' )) {
  // Script depends on jQuery dialog widget
  mw.loader.using( 'jquery.ui.dialog', function() {
    // Construct object (to prevent namespace conflicts)
    morebitsTest = {

      launchDialog: function( interface ) {
        interface.dialog('open');
      },
	  
	  initSimpleWindow: function() {
		var Window = new SimpleWindow( 600, 400 );
		Window.setTitle( "Test morebits.js" );
		Window.display();
		var form = new QuickForm( null );
		var main_group = form.append( {
				type:'select',
				name:'main_group',
				event:null
			} );
		var result = form.render();
		Window.setContent( result );
		Window.display();
		result.main_group.root = result;
		Status.init( result );
		Wikipedia.actionCompleted.redirect = wgPageName;
		Wikipedia.actionCompleted.notice = "Test complete, reloading talk page in a few seconds";
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
		page.save();
	  },
	  
	  loadCallbackReplace: function(page) {
	    var params = page.getCallbackParameters();
		page.setPageText(params['newText']);
		page.save();
	  },

      initialize: function() {

        // Define runTest interface
		// Can also use alternative syntax new to jQuery 1.4:
		//    $('<div style="margin-top:0.4em;"></div>').html( 'Text to be added:' ) 
		//  → $('<div/>', { css: { 'margin-top': '0.4em' }, text: 'Text to be added:' } )
		
		morebits_test_createOption = null;
		
        $runTests = $('<div id="runTestForm" style="position:relative;"></div>')
          .append( $('<div style="margin-top:0.4em;"></div>').html( 'Text to be added:<br/>' ).append( $('<textarea id="message" id="runTestMessage" style="width:99%" rows="4" cols="60"></textarea>') ) )
          .append( $('<div style="margin-top:0.4em;"></div>').html( 'Insert text before (for insert mode only):<br/>' ).append( $('<textarea id="beforeText" style="width:99%" rows="4" cols="60"></textarea>') ) )
          .append( $('<div style="margin-top:0.4em;"></div>').html( 'Edit summary:<br/>' ).append( $('<textarea id="editSummary" style="width:99%" rows="4" cols="60"></textarea>') ) )
          .append( $('<div style="margin-top:0.4em;"></div>').html( 'Section number: <input type="text" name="sectionNumber" size="3">' ) )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="followRedirect"/> Follow redirect') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="minorEdit"/> Minor edit') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="watchlist"/> Add to watchlist') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="watchlistFromPreferences"/> Add to watchlist based on preference settings') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="noRetries"/> Disable retries<hr/>') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="" onclick="morebits_test_createOption=value" checked/> Create page if needed, unless deleted since loaded<br>') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="recreate" onclick="morebits_test_createOption=value"/> Create page if needed<br>') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="createonly" onclick="morebits_test_createOption=value"/> Only create a new page<br>') )
		  .append( $('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="nocreate" onclick="morebits_test_createOption=value"/> Do not create a new page<br>') )
		  .dialog({
            width: 500,
            autoOpen: false,
            title: 'Test morebits.js',
            modal: true,
            buttons: { 
				"Append": function() { 
					$(this).dialog('close');
					morebitsTest.initSimpleWindow();
					
					var page = new Wikipedia.page(wgPageName);
					page.setAppendText( $('#message').val() );
					morebitsTest.setPageOptions(page);
					page.append();
				},
				"Prepend": function(e) { 
					$(this).dialog('close');
					morebitsTest.initSimpleWindow();
					
					var page = new Wikipedia.page(wgPageName);
					page.setPrependText( $('#message').val() );
					morebitsTest.setPageOptions(page);
					page.prepend();
				},
				"Insert": function(e) { 
					if ( $('#beforeText').val() == "" ) {
						alert ("Text to insert before must be specified!");
						return;
					}
					$(this).dialog('close');
					morebitsTest.initSimpleWindow();
					
					var page = new Wikipedia.page(wgPageName);
					page.setCallbackParameters( {
						beforeText: $('#beforeText').val(), 
						newText: $('#message').val()
						});
					morebitsTest.setPageOptions(page);
					page.load(morebitsTest.loadCallbackInsert);
				},
				"Replace": function(e) { 
					$(this).dialog('close');
					morebitsTest.initSimpleWindow();
					
					var page = new Wikipedia.page(wgPageName);
					page.setCallbackParameters( {
						newText: $('#message').val()
						});
					morebitsTest.setPageOptions(page);
					page.load(morebitsTest.loadCallbackReplace);
				}
            }
          });
    
      } // close initialize function

    } // close morebitsTest object
    morebitsTest.initialize();
	twAddPortletLink( ("javascript:morebitsTest.launchDialog($runTests)"), "Test", "tw-test", "Test morebits.js", "");
  }) // close mw.loader
} // close if
//</nowiki>
