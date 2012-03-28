/*
 ****************************************
 *** friendlywelcome.js: Welcome module
 ****************************************
 * Mode of invocation:     Tab ("Wel"), or from links on diff pages
 * Active on:              Existing user talk pages, diff pages
 * Config directives in:   FriendlyConfig
 */

Twinkle.welcome = function friendlywelcome() {
	if( QueryString.exists( 'friendlywelcome' ) ) {
		if( QueryString.get( 'friendlywelcome' ) === 'auto' ) {
			Twinkle.welcome.auto();
		} else {
			Twinkle.welcome.semiauto();
		}
	} else {
		Twinkle.welcome.normal();
	}
};

Twinkle.welcome.auto = function() {
	if( QueryString.get( 'action' ) !== 'edit' ) {
		// userpage not empty, aborting auto-welcome
		return;
	}

	Twinkle.welcome.welcomeUser();
};

Twinkle.welcome.semiauto = function() {
	Twinkle.welcome.callback( mw.config.get( 'wgTitle' ).split( '/' )[0].replace( /\"/, "\\\"") );
};

Twinkle.welcome.normal = function() {
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
			};

			var welcomeNode = document.createElement('strong');
			var welcomeLink = document.createElement('a');
			welcomeLink.appendChild( spanTag( 'Black', '[' ) );
			welcomeLink.appendChild( spanTag( 'Goldenrod', 'welcome' ) );
			welcomeLink.appendChild( spanTag( 'Black', ']' ) );
			welcomeNode.appendChild(welcomeLink);

			if( $oList.length > 0 ) {
				var oHref = $oList.attr("href");

				var oWelcomeNode = welcomeNode.cloneNode( true );
				oWelcomeNode.firstChild.setAttribute( 'href', oHref + '&' + QueryString.create( { 'friendlywelcome': Twinkle.getFriendlyPref('quickWelcomeMode')==='auto'?'auto':'norm' } ) + '&' + QueryString.create( { 'vanarticle': mw.config.get( 'wgPageName' ).replace(/_/g, ' ') } ) );
				$oList[0].parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
				$oList[0].parentNode.parentNode.appendChild( oWelcomeNode );
			}

			if( $nList.length > 0 ) {
				var nHref = $nList.attr("href");

				var nWelcomeNode = welcomeNode.cloneNode( true );
				nWelcomeNode.firstChild.setAttribute( 'href', nHref + '&' + QueryString.create( { 'friendlywelcome': Twinkle.getFriendlyPref('quickWelcomeMode')==='auto'?'auto':'norm' } ) + '&' + QueryString.create( { 'vanarticle': mw.config.get( 'wgPageName' ).replace(/_/g, ' ') } ) );
				$nList[0].parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
				$nList[0].parentNode.parentNode.appendChild( nWelcomeNode );
			}
		}
	}
	if( mw.config.get( 'wgNamespaceNumber' ) === 3 ) {
		var username = mw.config.get( 'wgTitle' ).split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes
		twAddPortletLink( function(){ Twinkle.welcome.callback(username); }, "Wel", "friendly-welcome", "Welcome user" );
	}
};

Twinkle.welcome.welcomeUser = function welcomeUser() {
	Status.init( document.getElementById('bodyContent') );

	var params = {
		value: Twinkle.getFriendlyPref('quickWelcomeTemplate'),
		article: QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '',
		mode: 'auto'
	};

	Wikipedia.actionCompleted.redirect = mw.config.get('wgPageName');
	Wikipedia.actionCompleted.notice = "Welcoming complete, reloading talk page in a few seconds";

	var wikipedia_page = new Wikipedia.page(mw.config.get('wgPageName'), "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.welcome.callback = function friendlywelcomeCallback( uid ) {
	if( uid === mw.config.get('wgUserName') ){
		alert( 'You\'re very welcome! Very welcome indeed!' );
		return;
	}
	
	var Window = new SimpleWindow( 600, 400 );
	Window.setTitle( "Welcome user" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Welcoming Committee", "WP:WC" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#welcome" );

	var form = new QuickForm( Twinkle.welcome.callback.evaluate, 'change' );

	form.append( {
			type: 'input',
			name: 'article',
			label: 'Linked article (if supported by template)',
			value:( QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '' ),
			tooltip: 'An article might be linked to the welcome if the template supports it. Leave empty for no article to be linked.  Templates that support a linked article are marked with an asterisk.  Ignored for templates that do not support a linked article.',
			event: function( event ) {
				event.stopPropagation();
			}
		} );

	form.append( { type:'header', label:'Simple templates' } );
	form.append( { type: 'radio', name: 'simple', list: Twinkle.welcome.standardList } );

	if( Twinkle.getFriendlyPref('customWelcomeList').length ) {
		form.append( { type:'header', label:'Custom templates' } );
		form.append( { type: 'radio', name: 'custom', list: Twinkle.getFriendlyPref('customWelcomeList') } );
	}

	form.append( { type:'header', label:'Welcoming committee templates' } );
	form.append( { type: 'radio', name: 'welcomingCommittee', list: Twinkle.welcome.welcomingCommitteeList } );

	form.append( { type:'header', label:'Potential problem user templates' } );
	form.append( { type: 'radio', name: 'problem', list: Twinkle.welcome.problemList } );

	form.append( { type:'header', label:'Anonymous user templates' } );
	form.append( { type: 'radio', name: 'anonymous', list: Twinkle.welcome.anonymousList } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
};

Twinkle.welcome.standardList = [
	{
		label: '{{Welcome}}: standard welcome*',
		value: 'Welcome'
	},
	{ 
		label: '{{Welcomeshort}}: short welcome',
		value: 'Welcomeshort',
		tooltip: 'Includes section heading.'
	},
	{ 
		label: '{{WelcomeSimple}}: simple welcome',
		value: 'WelcomeSimple',
		tooltip: 'Won\'t overwhelm new users.  Includes section heading.'
	},
	{
		label: '{{Welcome-personal}}: includes a plate of cookies',
		value: 'Welcome-personal',
		tooltip: 'A personal welcome with an introduction from you and a plate of cookies.  Includes section heading and signature.'
	},
	{ 
		label: '{{WelcomeMenu}}: welcome with menu of links',
		value: 'WelcomeMenu',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.' 
	},
	{ 
		label: '{{Welcomeg}}: similar to {{WelcomeMenu}}',
		value: 'Welcomeg',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.'
	},
	{ 
		label: '{{Welcomeh}}: same as {{Welcomeg}} but with a section heading',
		value: 'Welcomeh',
		tooltip: 'Contains a section heading, a welcome message and many useful links broken up into different sections.  Includes section heading and signature.'
	},
	{ 
		label: '{{Welcome-belated}}: welcome for users with more substantial contributions',
		value: 'Welcome-belated'
	},
	{ 
		label: '{{Welcome student}}: welcome for students editing as part of an educational class project',
		value: 'Welcome student'
	},
	{ 
		label: '{{Welcome teacher}}: welcome for course instructors involved in an educational class project',
		value: 'Welcome teacher'
	}
];

Twinkle.welcome.welcomingCommitteeList = [
	{ 
		label: '{{Wel}}: similar to {{Welcome}}, but automatically identifies anonymous and registered users*',
		value: 'Wel',
		tooltip: 'This template checks whether the username contains any letters. If there are any, {{Welcome-reg}} will be shown. If there are none, {{Welcome-anon}} will be shown.'
	},
	{ 
		label: '{{W-basic}}: standard template, similar to {{Welcome}} with additional options',
		value: 'W-basic',
		tooltip: 'This template is similar to {{Welcome}} but supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{W-shout}}: extroverted message with bold advice',
		value: 'W-shout',
		tooltip: 'This template is similar to {{WelcomeShout}} but supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{W-short}}: concise; won\'t overwhelm',
		value: 'W-short||',
		tooltip: 'This template is similar to {{Welcomeshort}} but supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{W-link}}: shortest greeting, links to Welcoming committee\'s greetings page',
		value: 'W-link',
		tooltip: 'This template is similar to {{Welcom}} but supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{W-graphical}}: graphical menu format to ease transition from the graphic-heavy web',
		value: 'W-graphical',
		tooltip: 'This template is similar to {{Welcomeg}} but has fewer links.  Supports many different options.  Includes a signature.'
	},
		{ 
		label: '{{W-graphic}}: another version of {{W-graphical}}',
		value: 'W-graphic',
		tooltip: 'This template is similar to {{W-graphic}} but with more powerful colours and changes in text.  Supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{W-screen}}: graphical; designed to fit the size of the user\'s screen',
		value: 'W-screen',
		tooltip: 'This template is a nice graphical welcome with many different options.  Includes a signature.'
	}
];

Twinkle.welcome.problemList = [
	{ 
		label: '{{Welcomelaws}}: welcome with information about copyrights, npov, the sandbox, and vandalism',
		value: 'Welcomelaws'
	},
	{ 
		label: '{{Firstarticle}}: for someone whose first article did not meet page creation guidelines*',
		value: 'Firstarticle'
	},
	{ 
		label: '{{Welcomevandal}}: for someone whose initial efforts appear to be vandalism*',
		value: 'Welcomevandal',
		tooltip: 'Includes a section heading.'
	},
	{ 
		label: '{{Welcomenpov}}: for someone whose initial efforts do not adhere to the neutral point of view policy*',
		value: 'Welcomenpov'
	},
	{ 
		label: '{{Welcomespam}}: welcome with additional discussion of anti-spamming policies*',
		value: 'Welcomespam'
	},
	{ 
		label: '{{Welcomeunsourced}}: for someone whose initial efforts are uncited*',
		value: 'Welcomeunsourced'
	},
	{ 
		label: '{{Welcomeauto}}: for someone who created an autobiographical article*',
		value: 'Welcomeauto'
	},
	{ 
		label: '{{Welcome-COI}}: for someone who created or edited an article about a subject with which they have a conflict of interest*',
		value: 'Welcome-COI'
	}
];

Twinkle.welcome.anonymousList = [
	{
		label: '{{Welcome-anon}}: for anonymous users; encourages getting a username*',
		value: 'Welcome-anon'
	},
	{
		label: '{{Welcomeanon2}}: similar to {{Welcome-anon}} but with hints and tips*',
		value: 'Welcomeanon2',
		tooltip: 'Includes section heading.'
	},
	{
		label: '{{Welc-anon}}: similar to {{Welcome-anon}} but with a border and section heading',
		value: 'Welc-anon||',
		tooltip: 'Includes section heading.'
	},
	{
		label: '{{Welcome-anon-test}}: for anonymous users who have performed test edits*',
		value: 'Welcome-anon-test',
		tooltip: 'Includes a section heading.'
	},
	{
		label: '{{Welcome-anon-vandal}}: for anonymous users who have vandalized a page*',
		value: 'Welcome-anon-vandal',
		tooltip: 'Includes a section heading and signature.'
	},
	{
		label: '{{Welcome-anon-vandalism-fighter}}: for anonymous users who fight vandalism, urging them to create an account*',
		value: 'Welcome-anon-vandalism-fighter', 
		tooltip: 'Includes section heading.'
	},
	{
		label: '{{Wel-constructive-anon}}: for anonymous users who have helped in vandal fighting and have made constructive edits. Also urges them to create an account*' ,
		value: 'Wel-constructive-anon', 
		tooltip: 'Includes section heading.'
	}
];

// Set to true if template does not already have heading
Twinkle.welcome.headingHash = {
	'Welcome': false,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': true,
	'Welcomeg': true,
	'Welcomeh': false,
	'Welcome-belated': false,
	'Welcome student': true,
	'Welcome teacher': true,
	'Wel': false,
	'W-basic': true,
	'W-shout': true,
	'W-short||': true,
	'W-link': true,
	'W-graphical': true,
	'W-graphic': true,
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
	'Welcome-anon-test': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': false,
	'Wel-constructive-anon' : false
};

// Set to true if template already has signature
Twinkle.welcome.signatureHash = {
	'Welcome': false,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': true,
	'Welcome-personal': false,
	'WelcomeMenu': true,
	'Welcomeg': true,
	'Welcomeh': true,
	'Welcome-belated': true,
	'Welcome student': false,
	'Welcome teacher': false,
	'Wel': false,
	'W-basic': true,
	'W-shout': true,
	'W-short||': true,
	'W-link': true,
	'W-graphical': true,
	'W-graphic': true,
	'W-screen': true,
	'Welcomelaws': false,
	'Firstarticle': true,
	'Welcomevandal': true,
	'Welcomenpov': false,
	'Welcomespam': false,
	'Welcomeunsourced': false,
	'Welcome-COI': false,
	'Welcome-anon': false,
	'Welcomeanon2': false,
	'Welc-anon||': false,
	'Welcome-anon-test': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': true,
	'Wel-constructive-anon' : false
};

/* Set to true if template supports article
 * name from art template parameter 
 */
Twinkle.welcome.artHash = {
	'Welcome': true,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': false,
	'Welcomeg': false,
	'Welcomeh': false,
	'Welcome-belated': false,
	'Welcome student': false,
	'Welcome teacher': false,
	'Wel': true,
	'W-basic': false,
	'W-shout': false,
	'W-short||': false,
	'W-link': false,
	'W-graphical': false,
	'W-graphic': false,
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
	'Welcome-anon-test': false,
	'Welcome-anon-vandalism-fighter': true,
	'Welcome-anon-vandal': false,
	'Wel-constructive-anon' : true
};

/* Set to true if template supports article
 * name from vanarticle template parameter 
 */
Twinkle.welcome.vandalHash = {
	'Welcome': false,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': false,
	'Welcomeg': false,
	'Welcomeh': false,
	'Welcome-belated': false,
	'Welcome student': false,
	'Welcome teacher': false,
	'Wel': false,
	'W-basic': false,
	'W-shout': false,
	'W-short||': false,
	'W-link': false,
	'W-graphical': false,
	'W-graphic': false,
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
	'Welcome-anon-test': true,  // even though not a vandalism warning
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': true,
	'Wel-constructive-anon': false
};

Twinkle.welcome.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var oldText = pageobj.getPageText();
		
		// abort if mode is auto and form is not empty
		if( pageobj.exists() && params.mode === 'auto' ) {
			Status.info( 'Warning', 'User talk page not empty; aborting automatic welcome' );
			Wikipedia.actionCompleted.event();
			return;
		}
		
		var text = '';
		Status.info( 'Info', 'Will add the welcome template to the ' +
			( Twinkle.getFriendlyPref('topWelcomes') ? 'top' : 'bottom' ) +
			' of the user\'s talk page.' );
		if( !Twinkle.getFriendlyPref('topWelcomes') ) {
			text += oldText + '\n';
		}
		
		if( Twinkle.welcome.headingHash[ params.value ] && Twinkle.getFriendlyPref('insertHeadings') ) {
			Status.info( 'Info', 'Will create a new heading for the welcome' );
			// strip section header markers from pref, to preserve backwards compatibility
			text += "== " + Twinkle.getFriendlyPref('welcomeHeading').replace(/^\s*=+\s*(.*?)\s*=+$\s*/, "$1") + " ==\n";
		}
		
		Status.info( 'Info', 'Will substitute the {{' + params.value + '}} welcome template' );
		text += '{{subst:' + params.value;
		
		if( Twinkle.welcome.artHash[ params.value ] ) {
			if( Twinkle.getFriendlyPref('insertUsername') && params.value.substring(2,0) !== 'W-' ) {
				Status.info( 'Info', 'Will add your username to the template' );
				text += '|' + mw.config.get('wgUserName');
			}
			
			if( params.article ) {
				Status.info( 'Info', 'Will add article link to the template' );
				text += '|art=' + params.article;
			}
		} else if( Twinkle.welcome.vandalHash[ params.value ] ) {
			if( params.article ) {
				Status.info( 'Info', 'Will add article link to the template' );
			}
			text += '|' + params.article;
			
			if( Twinkle.getFriendlyPref('insertUsername') && params.value.substring(2,0) !== 'W-' ) {
				Status.info( 'Info', 'Will add your username to the template' );
				text += '|' + mw.config.get('wgUserName');
			}
		} else if( Twinkle.getFriendlyPref('insertUsername') && params.value.substring(2,0) !== 'W-' ) {
			Status.info( 'Info', 'Will add your username to the template' );
			text += '|' + mw.config.get('wgUserName');
		} 
		
		text += '}}';
		
		if( !Twinkle.welcome.signatureHash[ params.value ] && Twinkle.getFriendlyPref('insertSignature') ) {
			Status.info( 'Info', 'Will add your signature after the welcome' );
			text += ' \n~~~~';
		}
		
		if( Twinkle.getFriendlyPref('topWelcomes') ) {
			text += '\n\n' + oldText;
		}
 
		var summaryText = "Added " + ( Twinkle.getFriendlyPref('maskTemplateInSummary') ? 'welcome' : ( '{{[[Template:' + params.value + '|' + params.value + ']]}}' ) ) +
			" template to user talk page";
		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setMinorEdit(false);
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchWelcomes'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.welcome.callback.evaluate = function friendlywelcomeCallbackEvaluate(e) {
	// Ignore if a change to the text field triggered this event
	if( e.target.name === 'article' ) {
		return;
	}
	
	var params = {
		value: e.target.values,
		article: e.target.form.article.value,
		mode: 'manual'
	};

	SimpleWindow.setButtonsEnabled( false );
	Status.init( e.target.form );

	Wikipedia.actionCompleted.redirect = mw.config.get('wgPageName');
	Wikipedia.actionCompleted.notice = "Welcoming complete, reloading talk page in a few seconds";

	var wikipedia_page = new Wikipedia.page(mw.config.get('wgPageName'), "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};
