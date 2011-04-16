// If FriendlyConfig aint exist.
if( typeof( FriendlyConfig ) == 'undefined' ) {
	FriendlyConfig = {};
}

/**
 FriendlyConfig.summaryAd ( string )
 If ad should be added or not to summary, default [[WP:TW|TW]]
 */
if( typeof( FriendlyConfig.summaryAd ) == 'undefined' ) {
	FriendlyConfig.summaryAd = " using [[WP:TW|TW]]";
}

/**
 FriendlyConfig.markTalkbackAsMinor ( boolean )
 */
if( typeof( FriendlyConfig.markTalkbackAsMinor ) == 'undefined' ) {
	FriendlyConfig.markTalkbackAsMinor = true;
}

/**
 FriendlyConfig.insertHeadings ( boolean )
 */
if( typeof( FriendlyConfig.insertHeadings ) == 'undefined' ) {
	FriendlyConfig.insertHeadings = true;
}

/**
 FriendlyConfig.insertTalkbackSignature ( boolean )
 */
if( typeof( FriendlyConfig.insertTalkbackSignature ) == 'undefined' ) {
	FriendlyConfig.insertTalkbackSignature = false;
}

/**
 FriendlyConfig.talkbackHeading ( String )
 */
if( typeof( FriendlyConfig.talkbackHeading ) == 'undefined' ) {
	FriendlyConfig.talkbackHeading = 'Talkback'
}

addOnloadHook(friendlytalkback);

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
	
	work_area.append( { type:'submit' } );
	work_area = work_area.render();
	old_area.parentNode.replaceChild( work_area, old_area );
	root.message.value = friendlytalkback.prev_message;
}

friendlytalkback.callbacks = {
	main: function( self ) {
		self.statelem.status( 'Grabbing edit token...' );
		var xmlDoc = self.responseXML;
		var editToken = xmlDoc.evaluate( '//page/@edittoken', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
		
		var tbPageName = (self.params.tbtarget == 'mytalk')?wgUserName:self.params.page;

		//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
		var text = '\n==' + FriendlyConfig.talkbackHeading.replace(/^\s*=+\s*(.*?)\s*=+$\s*/, "$1") + '==\n{\{talkback|';
		text += tbPageName;

		if( self.params.section != '' ) {
			text += '|' + self.params.section;
		}

		text += '|ts=\~\~\~\~\~\}\}';
		
		if( self.params.message != '' ) {
			text += '\n' + self.params.message + '  \~\~\~\~';
		} else if( FriendlyConfig.insertTalkbackSignature ) {
			text += '\n\~\~\~\~';
		}

		var query = {
			'action': 'edit',
			'title': wgPageName,
			'appendtext': text,
			'token': editToken,
			'summary': 'Talkback ([\['+ (self.params.tbtarget == 'other'?'':'User talk:') + tbPageName + (self.params.section?('#'+self.params.section):'') +']])',
			'minor': FriendlyConfig.markTalkbackAsMinor ? 1 : undefined
		};

		var wikipedia_api = new Wikipedia.api( 'Edit token grabbed; adding talkback notification to user talk page...', query, null, self.statelem );
		wikipedia_api.post();
	}
}

friendlytalkback.callback.evaluate = function friendlytalkbackCallbackEvaluate(e) {
	var tbtarget = e.target.getChecked( 'tbtarget' )[0];
	var page = null;
	var section = e.target.section.value;
	if( tbtarget == 'usertalk' || tbtarget == 'other' ) {
		page = e.target.page.value;
		
		if( tbtarget == 'usertalk' ) {
			if( page == '' ) {
				alert( 'You must specify the username of the user whose talk page you left a message on' );
				return;
			}
		} else {
			if( page == '' ) {
				alert( 'You must specify the full page name when your message is not on a user talk page' );
				return;
			}			
		}
	}
	
	var params = {
		tbtarget: tbtarget,
		page: page,
		section: section,
		message: e.target.message.value
	};

	Status.init( e.target );

	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Talkback notification complete; reloading talk page in a few seconds";
	
	var query = {
		'action': 'query',
		'prop': 'info',
		'intoken': 'edit',
		'titles': wgPageName
	};

	var wikipedia_api = new Wikipedia.api( 'Status', query, friendlytalkback.callbacks.main );
	wikipedia_api.params = params;
	wikipedia_api.post();
}