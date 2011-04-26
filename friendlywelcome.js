if ( typeof(Twinkle) === "undefined" ) {
	throw ( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function friendlywelcome() {
	if( QueryString.exists( 'friendlywelcome' ) ) {
		if( QueryString.get( 'friendlywelcome' ) == 'auto' ) {
			friendlywelcome.auto();
		} else {
			friendlywelcome.semiauto();
		}
	} else {
		friendlywelcome.normal();
	}
}

friendlywelcome.auto = function() {
	if( QueryString.get( 'action' ) != 'edit' ) {
		// userpage not empty, aborting auto-welcome
		return;
	}

	return friendlywelcome.welcome();
};

friendlywelcome.semiauto = function() {
	friendlywelcome.callback( wgTitle.split( '/' )[0].replace( /\"/, "\\\"") );
}

friendlywelcome.normal = function() {
	if( QueryString.exists( 'diff' ) ) {
		// check whether the contributors' talk pages exist yet
		var $oList = $("div#mw-diff-otitle2 span.mw-usertoollinks a.new:contains(talk)").first();
		var $nList = $("div#mw-diff-ntitle2 span.mw-usertoollinks a.new:contains(talk)").first();

		if( $oList.length > 0 || $nList.length > 0 ) {
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

			if( $oList.length > 0 ) {
				var oHref = $oList.attr("href");

				var oWelcomeNode = welcomeNode.cloneNode( true );
				oWelcomeNode.firstChild.setAttribute( 'href', oHref + '&' + QueryString.create( { 'friendlywelcome': FriendlyConfig.quickWelcomeMode=='auto'?'auto':'norm' } ) + '&' + QueryString.create( { 'vanarticle': wgPageName.replace(/_/g, ' ') } ) );
				$oList[0].parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
				$oList[0].parentNode.parentNode.appendChild( oWelcomeNode );
			}

			if( $nList.length > 0 ) {
				var nHref = $nList.attr("href");

				var nWelcomeNode = welcomeNode.cloneNode( true );
				nWelcomeNode.firstChild.setAttribute( 'href', nHref + '&' + QueryString.create( { 'friendlywelcome': FriendlyConfig.quickWelcomeMode=='auto'?'auto':'norm' } ) + '&' + QueryString.create( { 'vanarticle': wgPageName.replace(/_/g, ' ') } ) );
				$nList[0].parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
				$nList[0].parentNode.parentNode.appendChild( nWelcomeNode );
			}
		}
	}
	if( wgNamespaceNumber == 3 ) {
		var username = wgTitle.split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes

		twAddPortletLink("javascript:friendlywelcome.callback(\"" + username + "\")", "Wel", "friendly-welcome", "Welcome user", "");
	}
}

friendlywelcome.welcome = function welcomeUser() {
	Status.init( document.getElementById('bodyContent') );

	var params = {
		value: FriendlyConfig.quickWelcomeTemplate,
		article: QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '',
		mode: 'auto'
	};

	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Welcoming complete, reloading talk page in a few seconds";

	var wikipedia_page = new Wikipedia.page(wgPageName, "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(friendlywelcome.callbacks.main);
}

friendlywelcome.callback = function friendlywelcomeCallback( uid ) {
	var Window = new SimpleWindow( 600, 400 );
	Window.setTitle( "Welcome user" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Welcoming Committee", "WP:WC" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#welcome" );

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
		} );

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
		label: '\{\{Welcome}}: standard welcome*',
		value: 'Welcome' },
	{ 
		label: '\{\{Welcomeshort}}: short welcome',
		value: 'Welcomeshort',
		tooltip: 'Includes section heading.' },
	{ 
		label: '\{\{WelcomeSimple}}: simple welcome',
		value: 'WelcomeSimple',
		tooltip: 'Won\'t overwhelm new users.  Includes section heading.' },
	{
		label: '\{\{Welcome-personal}}: includes a plate of cookies',
		value: 'Welcome-personal',
		tooltip: 'A personal welcome with an introduction from you and a plate of cookies.  Includes section heading and signature.' },
	{ 
		label: '\{\{WelcomeMenu}}: welcome with menu of links',
		value: 'WelcomeMenu',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.' },
	{ 
		label: '\{\{Welcomeg}}: similar to \{\{WelcomeMenu}}',
		value: 'Welcomeg',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.' },
	{ 
		label: '\{\{Welcomeh}}: same as \{\{Welcomeg}} but with a section heading',
		value: 'Welcomeh',
		tooltip: 'Contains a section heading, a welcome message and many useful links broken up into different sections.  Includes section heading and signature.' },
	{ 
		label: '\{\{Welcome-belated}}: welcome for users with more substantial contributions',
		value: 'Welcome-belated' },
]

friendlywelcome.welcomingCommitteeList = [
	{ 
		label: '\{\{Wel}}: similar to \{\{Welcome}}, but automatically identifies anonymous and registered users*',
		value: 'Wel',
		tooltip: 'This template checks whether the username contains any letters. If there are any, \{\{Welcome-reg}} will be shown. If there are none, \{\{Welcome-anon}} will be shown.' },
	{ 
		label: '\{\{W-basic}}: standard template, similar to \{\{Welcome}} with additional options',
		value: 'W-basic',
		tooltip: 'This template is similar to \{\{Welcome}} but supports many different options.  Includes a signature.' },
	{ 
		label: '\{\{W-shout}}: extroverted message with bold advice',
		value: 'W-shout',
		tooltip: 'This template is similar to \{\{WelcomeShout}} but supports many different options.  Includes a signature.' },
	{ 
		label: '\{\{W-short}}: concise; won\'t overwhelm',
		value: 'W-short||',
		tooltip: 'This template is similar to \{\{Welcomeshort}} but supports many different options.  Includes a signature.' },
	{ 
		label: '\{\{W-link}}: shortest greeting, links to Welcoming committee\'s greetings page',
		value: 'W-link',
		tooltip: 'This template is similar to \{\{Welcom}} but supports many different options.  Includes a signature.' },
	{ 
		label: '\{\{W-graphical}}: graphical menu format to ease transition from the graphic-heavy web',
		value: 'W-graphical',
		tooltip: 'This template is similar to \{\{Welcomeg}} but has fewer links.  Supports many different options.  Includes a signature.' },
	{ 
		label: '\{\{W-screen}}: graphical; designed to fit the size of the user\'s screen',
		value: 'W-screen',
		tooltip: 'This template is a nice graphical welcome with many different options.  Includes a signature.' }
]

friendlywelcome.problemList = [
	{ 
		label: '\{\{Welcomelaws}}: welcome with information about copyrights, npov, the sandbox, and vandalism',
		value: 'Welcomelaws' },
	{ 
		label: '\{\{Firstarticle}}: for someone whose first article did not meet page creation guidelines*',
		value: 'Firstarticle' },
	{ 
		label: '\{\{Welcomevandal}}: for someone whose initial efforts appear to be vandalism*',
		value: 'Welcomevandal',
		tooltip: 'Includes a section heading.'},
	{ 
		label: '\{\{Welcomenpov}}: for someone whose initial efforts do not adhere to the neutral point of view policy*',
		value: 'Welcomenpov' },
	{ 
		label: '\{\{Welcomespam}}: welcome with additional discussion of anti-spamming polices*',
		value: 'Welcomespam' },
	{ 
		label: '\{\{Welcomeunsourced}}: for someone whose initial efforts are uncited*',
		value: 'Welcomeunsourced' },
	{ 
		label: '\{\{Welcomeauto}}: for someone who created an autobiographical article*',
		value: 'Welcomeauto' },
	{ 
		label: '\{\{Welcome-COI}}: for someone who created an article about a subject with which they have a conflict of interest*',
		value: 'Welcome-COI' }
]

friendlywelcome.anonymousList = [
	{
		label: '\{\{Welcome-anon}}: for anonymous users; encourages getting a username*',
		value: 'Welcome-anon' },
	{
		label: '\{\{Welcomeanon2}}: similar to \{\{Welcome-anon}} but with hints and tips*',
		value: 'Welcomeanon2',
		tooltip: 'Includes section heading.' },
	{
		label: '\{\{Welc-anon}}: similar to \{\{Welcome-anon}} but with a border and section heading',
		value: 'Welc-anon||',
		tooltip: 'Includes section heading.' },
	{
		label: '\{\{Welcome-anon-vandal}}: for anonymous users who have vandalized a page*',
		value: 'Welcome-anon-vandal',
		tooltip: 'Includes a section heading and signature.' },
	{
		label: '\{\{Welcome-anon-vandalism-fighter}}: for anonymous users who fight vandalism, urging them to create an account*',
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
	'Welcome-belated': false,
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
	'Welcome-belated': true,
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
	'Welcome-belated': false,
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
	'Welcome-belated': false,
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
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var oldText = pageobj.getPageText();
		
		// abort if mode is auto and form is not empty
		if( pageobj.exists() && params.mode == 'auto' ) {
			Status.info( 'Warning', 'User talk page not empty; aborting automatic welcome' );
			Wikipedia.actionCompleted.event();
			return;
		}
		
		var text = '';
		Status.info( 'Info', 'Will add the welcome template to the '
				+ ( FriendlyConfig.topWelcomes ? 'top' : 'bottom' )
				+ ' of the user\'s talk page.' );
		if( !FriendlyConfig.topWelcomes ) {
			text += oldText + '\n';
		}
		
		if( friendlywelcome.headingHash[ params.value ] && FriendlyConfig.insertHeadings ) {
			Status.info( 'Info', 'Will create a new heading for the welcome' );
			// strip section header markers from pref, to preserve backwards compatibility
			text += "== " + FriendlyConfig.welcomeHeading.replace(/^\s*=+\s*(.*?)\s*=+$\s*/, "$1") + " ==\n";
		}
		
		Status.info( 'Info', 'Will substitute the \{\{' + params.value + '}} welcome template' );
		text += '\{\{subst:' + params.value;
		
		if( friendlywelcome.artHash[ params.value ] ) {
			if( FriendlyConfig.insertUsername && params.value.substring(2,0) != 'W-' ) {
				Status.info( 'Info', 'Will add your username to the template' );
				text += '|' + wgUserName;
			}
			
			if( params.article != '' ) {
				Status.info( 'Info', 'Will add article link to the template' );
				text += '|art=' + params.article;
			}
		} else if( friendlywelcome.vandalHash[ params.value ] ) {
			if( params.article != '' ) {
				Status.info( 'Info', 'Will add article link to the template' );
			}
			text += '|' + params.article;
			
			if( FriendlyConfig.insertUsername ) {
				Status.info( 'Info', 'Will add your username to the template' );
				text += '|' + wgUserName;
			}
		} else if( FriendlyConfig.insertUsername ) {
			Status.info( 'Info', 'Will add your username to the template' );
			text += '|' + wgUserName;
		} 
		
		text += '\}\}';
		
		if( !friendlywelcome.signatureHash[ params.value ] && FriendlyConfig.insertSignature ) {
			Status.info( 'Info', 'Will add your signature after the welcome' );
			text += ' \n\~\~\~\~';
		}
		
		if( FriendlyConfig.topWelcomes ) {
			text += '\n\n' + oldText;
		}
 
		var summaryText = "Added " + ( FriendlyConfig.maskTemplateInSummary ? 'welcome' : ( '\{\{[[Template:' + params.value + '|' + params.value + ']]\}\}' ) ) +
			" template to user talk page";
		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + TwinkleConfig.summaryAd);
		pageobj.setMinorEdit(FriendlyConfig.markWelcomesAsMinor);
		pageobj.setWatchlist(FriendlyConfig.watchWelcomes);
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
}

friendlywelcome.callback.evaluate = function friendlywelcomeCallbackEvaluate(e) {
	// Ignore if a change to the text field triggered this event
	if( e.target.name == 'article' ) {
		return;
	}
	
	var params = {
		value: e.target.values,
		article: e.target.form.article.value,
		mode: 'manual'
	};

	SimpleWindow.setButtonsEnabled( false );
	Status.init( e.target.form );

	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Welcoming complete, reloading talk page in a few seconds";

	var wikipedia_page = new Wikipedia.page(wgPageName, "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(friendlywelcome.callbacks.main);
}

// register initialization callback
Twinkle.init.moduleReady( "friendlywelcome", friendlywelcome );
