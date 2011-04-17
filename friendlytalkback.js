if ( typeof(Twinkle) === "undefined" ) {
	alert( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function friendlytalkback() {
	if( wgNamespaceNumber == 3 ) {
		var username = wgTitle.split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes

		twAddPortletLink( "javascript:friendlytalkback.callback(\"" + username + "\")", "TB", "friendly-talkback", "Easy talkback", "");
	}
}

friendlytalkback.callback = function friendlytalkbackCallback( uid ) {
	if( uid == wgUserName ){
		alert( 'Is it really so bad that you\'re talking back to yourself?' );
		return;
	}

	var Window = new SimpleWindow( 600, 350 );
	Window.setTitle( "Talkback" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "About \{\{talkback}}", "Template:Talkback" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#talkback" );

	var form = new QuickForm( friendlytalkback.callback.evaluate );

	form.append( { type: 'radio', name: 'tbtarget',
				list: [ {
						label: 'My talk page',
						value: 'mytalk',
						checked: 'true' },
					{
						label: 'Other user talk page',
						value: 'usertalk' },
					{
						label: 'Other page',
						value: 'other' } ],
				event: friendlytalkback.callback.change_target
			} );

	form.append( {
			type: 'field',
			label: 'Work area',
			name: 'work_area'
		} );

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.tbtarget[0].dispatchEvent( evt );
}

friendlytalkback.prev_page = '';
friendlytalkback.prev_section = '';
friendlytalkback.prev_message = '';

friendlytalkback.callback.change_target = function friendlytagCallbackChangeTarget(e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area;

	if(root.section) {
		friendlytalkback.prev_section = root.section.value;
	}
	if(root.message) {
		friendlytalkback.prev_message = root.message.value;
	}
	if(root.page) {
		friendlytalkback.prev_page = root.page.value;
	}

	for( var i = 0; i < root.childNodes.length; ++i ) {
		var node = root.childNodes[i];
		if( 
			node instanceof Element &&
			node.getAttribute( 'name' ) == 'work_area' 
		) {
			old_area = node;
			break;
		}
	}
	var work_area = new QuickForm.element( { 
			type: 'field',
			label: 'Talkback information',
			name: 'work_area'
		} );

	switch( value ) {
		default:
		case 'mytalk':
			work_area.append( { 
					type:'input',
					name:'section',
					label:'Linked section (optional)',
					tooltip:'The section heading on your talk page where you left a message. Leave empty for no section to be linked.',
					value: friendlytalkback.prev_section
				} );
			break;
		case 'usertalk':
			work_area.append( { 
					type:'input',
					name:'page',
					label:'User',
					tooltip:'The username of the user on whose talk page you left a message.',
					value: friendlytalkback.prev_page
				} );
			
			work_area.append( { 
					type:'input',
					name:'section',
					label:'Linked section (optional)',
					tooltip:'The section heading on the page where you left a message. Leave empty for no section to be linked.',
					value: friendlytalkback.prev_section
				} );
			break;
		case 'other':
			work_area.append( { 
					type:'input',
					name:'page',
					label:'Full page name',
					tooltip:'The full page name where you left the message.  For example: "Wikipedia talk:Friendly".',
					value: friendlytalkback.prev_page
				} );
			
			work_area.append( { 
					type:'input',
					name:'section',
					label:'Linked section (optional)',
					tooltip:'The section heading on the page where you left a message. Leave empty for no section to be linked.',
					value: friendlytalkback.prev_section
				} );
			break;
	}
	
	work_area.append( { type:'textarea', label:'Additional message (optional):', name:'message', tooltip:'An additional message that you would like to leave below the talkback template.  Your signature will be added to the end of the message if you leave one.' } );

	work_area = work_area.render();
	root.replaceChild( work_area, old_area );
	root.message.value = friendlytalkback.prev_message;
}

friendlytalkback.callback.evaluate = function friendlytalkbackCallbackEvaluate(e) {
	var tbtarget = e.target.getChecked( 'tbtarget' )[0];
	var page = null;
	var section = e.target.section.value;
	if( tbtarget == 'usertalk' || tbtarget == 'other' ) {
		page = e.target.page.value;
		
		if( tbtarget == 'usertalk' ) {
			if( page == '' ) {
				alert( 'You must specify the username of the user whose talk page you left a message on.' );
				return;
			}
		} else {
			if( page == '' ) {
				alert( 'You must specify the full page name when your message is not on a user talk page.' );
				return;
			}			
		}
	}

	SimpleWindow.setButtonsEnabled( false );
	Status.init( e.target );

	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Talkback complete; reloading talk page in a few seconds";

	var talkpage = new Wikipedia.page(wgPageName, "Adding talkback");
	var tbPageName = (tbtarget == 'mytalk') ? wgUserName : page;

	//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
	var text = '\n==' + FriendlyConfig.talkbackHeading.replace(/^\s*=+\s*(.*?)\s*=+$\s*/, "$1") + '==\n{\{talkback|';
	text += tbPageName;

	if( section != '' ) {
		text += '|' + section;
	}

	text += '|ts=\~\~\~\~\~\}\}';
	
	if( e.target.message.value != '' ) {
		text += '\n' + e.target.message.value + '  \~\~\~\~';
	} else if( FriendlyConfig.insertTalkbackSignature ) {
		text += '\n\~\~\~\~';
	}

	talkpage.setAppendText(text);
	talkpage.setEditSummary("Talkback ([[" + (tbtarget == 'other' ? '' : 'User talk:') + tbPageName +
		(section ? ('#' + section) : '') + "]])" + TwinkleConfig.summaryAd);
	talkpage.setCreateOption('recreate');
	talkpage.setFollowRedirect(true);
	talkpage.append();
}

// register initialization callback
Twinkle.init.moduleReady( "friendlytalkback", friendlytalkback );
