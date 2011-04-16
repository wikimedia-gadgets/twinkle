// <nowiki>
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
 FriendlyConfig.topWelcomes ( boolean )
 */
if( typeof( FriendlyConfig.topWelcomes ) == 'undefined' ) {
	FriendlyConfig.topWelcomes = false;
}

/**
 FriendlyConfig.watchWelcomes ( boolean )
 */
if( typeof( FriendlyConfig.watchWelcomes ) == 'undefined' ) {
	FriendlyConfig.watchWelcomes = true;
}

/**
 FriendlyConfig.insertHeadings ( boolean )
 */
if( typeof( FriendlyConfig.insertHeadings ) == 'undefined' ) {
	FriendlyConfig.insertHeadings = true;
}

/**
 FriendlyConfig.welcomeHeading ( string )
 */
if( typeof( FriendlyConfig.welcomeHeading ) == 'undefined' ) {
	FriendlyConfig.welcomeHeading = "== Welcome ==";
}

/**
 FriendlyConfig.insertUsername ( boolean )
 */
if( typeof( FriendlyConfig.insertUsername ) == 'undefined' ) {
	FriendlyConfig.insertUsername = true;
}

/**
 FriendlyConfig.insertSignature ( boolean )
 */
if( typeof( FriendlyConfig.insertSignature ) == 'undefined' ) {
	FriendlyConfig.insertSignature = true;
}

/**
 FriendlyConfig.markWelcomesAsMinor ( boolean )
 */
if( typeof( FriendlyConfig.markWelcomesAsMinor ) == 'undefined' ) {
	FriendlyConfig.markWelcomesAsMinor = true;
}

/**
 FriendlyConfig.quickWelcomeMode ( String )
 */
if( typeof( FriendlyConfig.quickWelcomeMode ) == 'undefined' ) {
	FriendlyConfig.quickWelcomeMode = "semiauto";
}

/**
 FriendlyConfig.quickWelcomeTemplate ( String )
 */
if( typeof( FriendlyConfig.quickWelcomeTemplate ) == 'undefined' ) {
	FriendlyConfig.quickWelcomeTemplate = "Welcome";
}

/**
 FriendlyConfig.maskTemplateInSummary ( boolean )
 */
if( typeof( FriendlyConfig.maskTemplateInSummary ) == 'undefined' ) {
	FriendlyConfig.maskTemplateInSummary = true;
}

friendlywelcome = {
	auto: function() {
		if( QueryString.get( 'action' ) != 'edit' ) {
			// userpage not empty, aborting auto-welcome
			return;
		}
		
		return friendlywelcome.welcome();
	},
	semiauto: function()  {
		friendlywelcome.callback( wgTitle.split( '/' )[0].replace( /\"/, "\\\"") );
	},
	normal: function() {
		if( QueryString.exists( 'diff' ) ) {
			var oXPath = '//div[@id="mw-diff-otitle2"]/span[@class="mw-usertoollinks"]/a[1][@class="new"]';
			var nXPath = '//div[@id="mw-diff-ntitle2"]/span[@class="mw-usertoollinks"]/a[1][@class="new"]';
			var oList = document.evaluate( oXPath, document, null,  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			var nList = document.evaluate( nXPath, document, null,  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			
			if( oList.snapshotLength > 0 || nList.snapshotLength > 0 ) {
				var spanTag = function( color, content ) {
					var span = document.createElement( 'span' );
					span.style.color = color;
					span.appendChild( document.createTextNode( content ) );
					return span;
				}

				var welcomeNode = document.createElement('strong');
				var welcomeLink = document.createElement('a');
				welcomeLink.appendChild( spanTag( 'Black', '[' ) );
				welcomeLink.appendChild( spanTag( 'Goldenrod', 'welcome' ) );
				welcomeLink.appendChild( spanTag( 'Black', ']' ) );
				welcomeNode.appendChild(welcomeLink);

				if( oList.snapshotLength > 0 ) {
					var oTalkNode = oList.snapshotItem(0);
					
					var oHref = document.evaluate( '@href', oTalkNode, null, XPathResult.STRING_TYPE, null ).stringValue;
					
					var oWelcomeNode = welcomeNode.cloneNode( true );
					oWelcomeNode.firstChild.setAttribute( 'href', oHref + '&' + QueryString.create( { 'friendlywelcome': FriendlyConfig.quickWelcomeMode=='auto'?'auto':'norm' } ) + '&' + QueryString.create( { 'vanarticle': wgPageName.replace(/_/g, ' ') } ) );
					oTalkNode.parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
					oTalkNode.parentNode.parentNode.appendChild( oWelcomeNode );
				}
				
				if( nList.snapshotLength > 0 ) {
					var nTalkNode = nList.snapshotItem(0);
					
					var nHref = document.evaluate( '@href', nTalkNode, null, XPathResult.STRING_TYPE, null ).stringValue;
					
					var nWelcomeNode = welcomeNode.cloneNode( true );
					nWelcomeNode.firstChild.setAttribute( 'href', nHref + '&' + QueryString.create( { 'friendlywelcome': FriendlyConfig.quickWelcomeMode=='auto'?'auto':'norm' } ) + '&' + QueryString.create( { 'vanarticle': wgPageName.replace(/_/g, ' ') } ) );
					nTalkNode.parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
					nTalkNode.parentNode.parentNode.appendChild( nWelcomeNode );
				}
			}
		}
		if( wgNamespaceNumber == 3 ) {
			var username = wgTitle.split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes

			twAddPortletLink("javascript:friendlywelcome.callback(\"" + username + "\")", "Wel", "friendly-welcome", "Welcome user", "");
		}
	}
}

friendlywelcome.welcome = function welcomeUser() {
	Status.init( document.getElementById('bodyContent') );

	var params = {
		value: FriendlyConfig.quickWelcomeTemplate,
		article: QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '',
		mode: 'auto'
	};

	var query = { 
		'title': wgPageName, 
		'action': 'submit'
	};
	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Welcoming complete, reloading talk page in some seconds";
	var wikipedia_wiki = new Wikipedia.wiki( 'User talk page modification', query, friendlywelcome.callbacks.main );
	wikipedia_wiki.followRedirect = true;
	wikipedia_wiki.params = params;
	wikipedia_wiki.get();
}

friendlywelcome.callback = function friendlywelcomeCallback( uid ) {
	var Window = new SimpleWindow( 600, 400 );
	Window.setTitle( "Choose a welcome template" ); 
	var form = new QuickForm( friendlywelcome.callback.evaluate, 'change' );

	form.append( {
			type: 'input',
			name: 'article',
			label: 'Linked article (if supported by template)',
			value:( QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '' ),
			tooltip: 'An article might be linked to the welcome if the template supports it. Leave empty for no artice to be linked.  Templates that support a linked article are marked with an asterisk.  Ignored for templates that do not support a linked article.',
			event: function( event ) {
				event.stopPropagation();
			}
		}
	);

	form.append( { type:'header', label:'Simple templates' } );
	form.append( { type: 'radio', name: 'simple', list: friendlywelcome.standardList } );

	if( typeof( FriendlyConfig.customWelcomeList ) == 'object' ) {
		form.append( { type:'header', label:'Custom templates' } );
		form.append( { type: 'radio', name: 'custom', list: FriendlyConfig.customWelcomeList } );
	}

	form.append( { type:'header', label:'Welcoming committee templates' } );
	form.append( { type: 'radio', name: 'welcomingCommittee', list: friendlywelcome.welcomingCommitteeList } );

	form.append( { type:'header', label:'Potential problem user templates' } );
	form.append( { type: 'radio', name: 'problem', list: friendlywelcome.problemList } );

	form.append( { type:'header', label:'Anonymous user templates' } );
	form.append( { type: 'radio', name: 'anonymous', list: friendlywelcome.anonymousList } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
}

friendlywelcome.standardList = [
	{
		label: '{{Welcome}}: standard welcome*',
		value: 'Welcome' },
	{ 
		label: '{{Welcomeshort}}: short welcome',
		value: 'Welcomeshort',
		tooltip: 'Includes section heading.' },
	{ 
		label: '{{WelcomeSimple}}: simple welcome',
		value: 'WelcomeSimple',
		tooltip: 'Won\'t overwhelm new users.  Includes section heading.' },
	{
		label: '{{Welcome-personal}}: includes a plate of cookies',
		value: 'Welcome-personal',
		tooltip: 'A personal welcome with an introduction from you and a plate of cookies.  Includes section heading and signature.' },
	{ 
		label: '{{WelcomeMenu}}: welcome with menu of links',
		value: 'WelcomeMenu',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.' },
	{ 
		label: '{{Welcomeg}}: similar to {{WelcomeMenu}}',
		value: 'Welcomeg',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.' },
	{ 
		label: '{{Welcomeh}}: same as {{Welcomeg}} but with a section heading',
		value: 'Welcomeh',
		tooltip: 'Contains a section heading, a welcome message and many useful links broken up into different sections.  Includes section heading and signature.' }
]

friendlywelcome.welcomingCommitteeList = [
	{ 
		label: '{{Wel}}: similar to {{Welcome}}, but automatically identifies anonymous and registered users*',
		value: 'Wel',
		tooltip: 'This template checks whether the username contains any letters. If there are any, {{Welcome-reg}} will be shown. If there are none, {{Welcome-anon}} will be shown.' },
	{ 
		label: '{{W-basic}}: standard template, similar to {{Welcome}} with additional options',
		value: 'W-basic',
		tooltip: 'This template is similar to {{Welcome}} but supports many different options.  Includes a signature.' },
	{ 
		label: '{{W-shout}}: extroverted message with bold advice',
		value: 'W-shout',
		tooltip: 'This template is similar to {{WelcomeShout}} but supports many different options.  Includes a signature.' },
	{ 
		label: '{{W-short}}: concise; won\'t overwhelm',
		value: 'W-short||',
		tooltip: 'This template is similar to {{Welcomeshort}} but supports many different options.  Includes a signature.' },
	{ 
		label: '{{W-link}}: shortest greeting, links to Welcoming committee\'s greetings page',
		value: 'W-link',
		tooltip: 'This template is similar to {{Welcom}} but supports many different options.  Includes a signature.' },
	{ 
		label: '{{W-graphical}}: graphical menu format to ease transition from the graphic-heavy web',
		value: 'W-graphical',
		tooltip: 'This template is similar to {{Welcomeg}} but has fewer links.  Supports many different options.  Includes a signature.' },
	{ 
		label: '{{W-screen}}: graphical; designed to fit the size of the user\'s screen',
		value: 'W-screen',
		tooltip: 'This template is a nice graphical welcome with many different options.  Includes a signature.' }
]

friendlywelcome.problemList = [
	{ 
		label: '{{Welcomelaws}}: welcome with information about copyrights, npov, the sandbox, and vandalism',
		value: 'Welcomelaws' },
	{ 
		label: '{{Firstarticle}}: for someone whose first article did not meet page creation guidelines*',
		value: 'Firstarticle' },
	{ 
		label: '{{Welcomevandal}}: for someone whose initial efforts appear to be vandalism*',
		value: 'Welcomevandal',
		tooltip: 'Includes a section heading.' },
	{ 
		label: '{{Welcomenpov}}: for someone whose initial efforts do not adhere to the neutral point of view policy*',
		value: 'Welcomenpov' },
	{ 
		label: '{{Welcomespam}}: welcome with additional discussion of anti-spamming polices*',
		value: 'Welcomespam' },
	{ 
		label: '{{Welcomeunsourced}}: for someone whose initial efforts are uncited*',
		value: 'Welcomeunsourced' },
	{ 
		label: '{{Welcomeauto}}: for someone who created an autobiographical article*',
		value: 'Welcomeauto' },
	{ 
		label: '{{Welcome-COI}}: for someone who created an article about a subject with which they have a conflict of interest*',
		value: 'Welcome-COI' }
]

friendlywelcome.anonymousList = [
	{
		label: '{{Welcome-anon}}: for anonymous users; encourages getting a username*',
		value: 'Welcome-anon' },
	{
		label: '{{Welcomeanon2}}: similar to {{Welcome-anon}} but with hints and tips*',
		value: 'Welcomeanon2',
		tooltip: 'Includes section heading.' },
	{
		label: '{{Welc-anon}}: similar to {{Welcome-anon}} but with a border and section heading',
		value: 'Welc-anon||',
		tooltip: 'Includes section heading.' },
	{
		label: '{{Welcome-anon-vandal}}: for anonymous users who have vandalized a page*',
		value: 'Welcome-anon-vandal',
		tooltip: 'Includes a section heading and signature.' },
	{
		label: '{{Welcome-anon-vandalism-fighter}}: for anonymous users who fight vandalism, urging them to create an account*',
		value: 'Welcome-anon-vandalism-fighter', 
		tooltip: 'Includes section heading.',
	},
]

// Set to true if template does not already have heading
friendlywelcome.headingHash = {
	'Welcome': true,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': true,
	'Welcomeg': true,
	'Welcomeh': false,
	'Wel': false,
	'W-basic': true,
	'W-shout': true,
	'W-short||': true,
	'W-link': true,
	'W-graphical': true,
	'W-screen': true,
	'Welcomelaws': true,
	'Firstarticle': true,
	'Welcomevandal': false,
	'Welcomenpov': true,
	'Welcomespam': true,
	'Welcomeunsourced': true,
	'Welcomeauto': false,
	'Welcome-COI': true,
	'Welcome-anon': true,
	'Welcomeanon2': false,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': false
}

// Set to true if template already has signature
friendlywelcome.signatureHash = {
	'Welcome': false,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': true,
	'Welcome-personal': false,
	'WelcomeMenu': true,
	'Welcomeg': true,
	'Welcomeh': true,
	'Wel': false,
	'W-basic': true,
	'W-shout': true,
	'W-short||': true,
	'W-link': true,
	'W-graphical': true,
	'W-screen': true,
	'Welcomelaws': false,
	'Firstarticle': true,
	'Welcomevandal': true,
	'Welcomenpov': false,
	'Welcomespam': false,
	'Welcomeunsourced': false,
	'Welcomeunsourced': false,
	'Welcome-COI': false,
	'Welcome-anon': false,
	'Welcomeanon2': false,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': true
}

/* Set to true if template supports article
 * name from art template parameter 
 */
friendlywelcome.artHash = {
	'Welcome': true,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': false,
	'Welcomeg': false,
	'Welcomeh': false,
	'Wel': true,
	'W-basic': false,
	'W-shout': false,
	'W-short||': false,
	'W-link': false,
	'W-graphical': false,
	'W-screen': false,
	'Welcomelaws': false,
	'Firstarticle': false,
	'Welcomevandal': false,
	'Welcomenpov': false,
	'Welcomespam': false,
	'Welcomeunsourced': false,
	'Welcomeauto': true,
	'Welcome-COI': false,
	'Welcome-anon': true,
	'Welcomeanon2': true,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': true,
	'Welcome-anon-vandal': false
}

/* Set to true if template supports article
 * name from vanarticle template parameter 
 */
friendlywelcome.vandalHash = {
	'Welcome': false,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': false,
	'Welcomeg': false,
	'Welcomeh': false,
	'Wel': false,
	'W-basic': false,
	'W-shout': false,
	'W-short||': false,
	'W-link': false,
	'W-graphical': false,
	'W-screen': false,
	'Welcomelaws': false,
	'Firstarticle': true,
	'Welcomevandal': true,
	'Welcomenpov': true,
	'Welcomespam': true,
	'Welcomeunsourced': true,
	'Welcomeauto': false,
	'Welcome-COI': false,
	'Welcome-anon': false,
	'Welcomeanon2': false,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': true
}

friendlywelcome.callbacks = {
	main: function( self ) {
		var form = self.responseXML.getElementById( 'editform' );
		
		// abort if mode is auto and form is not empty
		if( form.wpTextbox1.value != '' && self.params.mode == 'auto' ) {
			Status.info( 'Warning', 'User talk page not empty; aborting automatic welcome' );
			Wikipedia.actionCompleted.event();
			return;
		}
		
		var text = '';
		Status.info( 'Info', 'Will add the welcome template to the '
				+ ( FriendlyConfig.topWelcomes ? 'top' : 'bottom' )
				+ ' of the user\'s talk page.' );
		if( !FriendlyConfig.topWelcomes ) {
			text += form.wpTextbox1.value + '\n';
		}
		
		if( friendlywelcome.headingHash[ self.params.value ] && FriendlyConfig.insertHeadings ) {
			Status.info( 'Info', 'Will create a new heading for the welcome' );
			text += FriendlyConfig.welcomeHeading + "\n";
		}
		
		Status.info( 'Info', 'Will substitute the {{' + self.params.value + '}} welcome template' );
		text += '\{\{subst:' + self.params.value;
		
		if( friendlywelcome.artHash[ self.params.value ] ) {
			if( FriendlyConfig.insertUsername && self.params.value.substring(2,0) != 'W-' ) {
				Status.info( 'Info', 'Will add your username to the template' );
				text += '|' + wgUserName;
			}
			
			if( self.params.article != '' ) {
				Status.info( 'Info', 'Will add article link to the template' );
				text += '|art=' + self.params.article;
			}
		} else if( friendlywelcome.vandalHash[ self.params.value ] ) {
			if( self.params.article != '' ) {
				Status.info( 'Info', 'Will add article link to the template' );
			}
			text += '|' + self.params.article;
			
			if( FriendlyConfig.insertUsername ) {
				Status.info( 'Info', 'Will add your username to the template' );
				text += '|' + wgUserName;
			}
		} else if( FriendlyConfig.insertUsername ) {
			Status.info( 'Info', 'Will add your username to the template' );
			text += '|' + wgUserName;
		} 
		
		text += '\}\}';
		
		if( !friendlywelcome.signatureHash[ self.params.value ] && FriendlyConfig.insertSignature ) {
			Status.info( 'Info', 'Will add your signature after the welcome' );
			text += ' \n\~\~\~\~';
		}
		
		if( FriendlyConfig.topWelcomes ) {
			text += '\n\n' + form.wpTextbox1.value;
		}
		
		var postData = {
			'wpMinoredit': FriendlyConfig.markWelcomesAsMinor ? 1 : undefined,
			'wpWatchthis': form.wpWatchthis.checked ? 1 : (FriendlyConfig.watchWelcomes ? 1 : undefined),
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSummary': 'Added ' + ( FriendlyConfig.maskTemplateInSummary ? 'welcome' : ( '\{\{[[Template:' + self.params.value + '|' + self.params.value + ']]\}\}' ) )
					+ ' template to user talk page' + FriendlyConfig.summaryAd,
			'wpTextbox1': text
		};
 
		self.post( postData );
	}
}

friendlywelcome.callback.evaluate = function friendlywelcomeCallbackEvaluate(e) {
	// Ignore if a change to the text field triggered this event
	if( e.target.name == 'article' ) {
		return;
	}
	
	var params = {
		value: e.target.value,
		article: e.target.form.article.value,
		mode: 'manual'
	};

	Status.init( e.target.form );
	
	var query = { 
		'title': wgPageName, 
		'action': 'submit'
	};
	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Welcoming complete, reloading talk page in some seconds";
	var wikipedia_wiki = new Wikipedia.wiki( 'User talk page modification', query, friendlywelcome.callbacks.main );
	wikipedia_wiki.followRedirect = true;
	wikipedia_wiki.params = params;
	wikipedia_wiki.get();
}

window.TwinkleInit = (window.TwinkleInit || []).concat( function() {
	if( QueryString.exists( 'friendlywelcome' ) ) {
		if( QueryString.get( 'friendlywelcome' ) == 'auto' ) {
			friendlywelcome.auto();
		} else {
			friendlywelcome.semiauto();
		}
	} else {
		friendlywelcome.normal();
	}
}); //schedule initializer

// </nowiki>