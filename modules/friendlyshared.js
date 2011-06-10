/*
 ****************************************
 *** friendlyshared.js: Shared IP tagging module
 ****************************************
 * Mode of invocation:     Tab ("Shared")
 * Active on:              Existing IP user talk pages
 * Config directives in:   FriendlyConfig
 */

Twinkle.shared = function friendlyshared() {
	if( mw.config.get('wgNamespaceNumber') === 3 && isIPAddress(mw.config.get('wgTitle')) ) {
		var username = mw.config.get('wgTitle').split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes
		$(twAddPortletLink("#", "Shared IP", "friendly-shared", "Shared IP tagging", "")).click(function() { Twinkle.shared.callback(username); });
	}
};

Twinkle.shared.callback = function friendlysharedCallback( uid ) {
	var Window = new SimpleWindow( 600, 400 );
	Window.setTitle( "Shared IP address tagging" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#shared" );

	var form = new QuickForm( Twinkle.shared.callback.evaluate );

	form.append( { type:'header', label:'Shared IP address templates' } );
	form.append( { type: 'radio', name: 'shared', list: Twinkle.shared.standardList,
		event: function( e ) {
			Twinkle.shared.callback.change_shared( e );
			e.stopPropagation();
		} } );

	var org = form.append( { type:'field', label:'Fill in IP address owner/operator, hostname and contact information (if applicable) and hit \"Submit\"' } );
	org.append( {
			type: 'input',
			name: 'organization',
			label: 'Organization name',
			disabled: true,
			tooltip: 'Some of these templates support an optional parameter for the organization name that owns/operates the IP address.  The organization name can be entered here for those templates, including wikimarkup if necessary.'
		}
	);
	org.append( {
			type: 'input',
			name: 'host',
			label: 'Host name (optional)',
			disabled: true,
			tooltip: 'These templates support an optional parameter for the host name.  The host name (for example, proxy.example.com) can be entered here and will be linked by the template.'
		}
	);
	org.append( {
			type: 'input',
			name: 'contact',
			label: 'Contact information (only if requested)',
			disabled: true,
			tooltip: 'Some of these templates support an optional parameter for the organization\'s contact information.  Use this parameter only if the organization has specifically request that it be added.  This contact information can be entered here for those templates, including wikimarkup if necessary.'
		}
	);
	
	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
};

Twinkle.shared.standardList = [
	{
		label: '{{shared IP}}: standard shared IP address template',
		value: 'shared IP',
		tooltip: 'IP user talk page template that shows helpful information to IP users and those wishing to warn or ban them'
	},
	{ 
		label: '{{shared IP edu}}: shared IP address template modified for educational institutions',
		value: 'shared IP edu'
	},
	{
		label: '{{shared IP corp}}: shared IP address template modified for businesses',
		value: 'shared IP corp'
	},
	{
		label: '{{shared IP public}}: shared IP address template modified for public terminals',
		value: 'shared IP public'
	},
	{
		label: '{{shared IP gov}}: shared IP address template modified for government agencies or facilities',
		value: 'shared IP gov'
	},
	{
		label: '{{dynamicIP}}: shared IP address template modified for organizations with dynamic addressing',
		value: 'dynamicIP'
	},
	{ 
		label: '{{ISP}}: shared IP address template modified for ISP organizations (specifically proxies)',
		value: 'ISP'
	},
	{ 
		label: '{{mobileIP}}: shared IP address template modified mobile phone company and their customers',
		value: 'mobileIP'
	}
];

Twinkle.shared.callback.change_shared = function friendlytagCallbackChangeShared(e) {
	if( e.target.value === 'shared IP edu' ) {
		e.target.form.contact.disabled = false;
	} else {
		e.target.form.contact.disabled = true;
	}
	e.target.form.organization.disabled=false;
	e.target.form.host.disabled=false;
};

Twinkle.shared.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var pageText = pageobj.getPageText();
		var found = false;
		var text = '{{';

		for( var i=0; i < Twinkle.shared.standardList.length; i++ ) {
			tagRe = new RegExp( '(\\{\\{' + Twinkle.shared.standardList[i].value + '(\\||\\}\\}))', 'im' );
			if( tagRe.exec( pageText ) ) {
				Status.warn( 'Info', 'Found {{' + Twinkle.shared.standardList[i].value + '}} on the user\'s talk page already...aborting' );
				found = true;
			}
		}

		if( found ) {
			return;
		}

		Status.info( 'Info', 'Will add the shared IP address template to the top of the user\'s talk page.' );
		text += params.value + '|' + params.organization;
		if( params.value === 'shared IP edu' && params.contact !== '') {
			text += '|' + params.contact;
		}
		if( params.host !== '' ) {
			text += '|host=' + params.host;
		}
		text += '}}\n\n';

		var summaryText = 'Added {{[[Template:' + params.value + '|' + params.value + ']]}} template.';
		pageobj.setPageText(text + pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markSharedIPAsMinor'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.shared.callback.evaluate = function friendlysharedCallbackEvaluate(e) {
	var shared = e.target.getChecked( 'shared' );
	if( !shared || shared.length <= 0 ) {
		alert( 'You must select a shared IP address template to use!' );
		return;
	}
	
	var value = shared[0];
	
	if( e.target.organization.value === '') {
		alert( 'You must input an organization for the {{' + value + '}} template!' );
		return;
	}
	
	var params = {
		value: value,
		organization: e.target.organization.value,
		host: e.target.host.value,
		contact: e.target.contact.value
	};

	SimpleWindow.setButtonsEnabled( false );
	Status.init( e.target );

	Wikipedia.actionCompleted.redirect = mw.config.get('wgPageName');
	Wikipedia.actionCompleted.notice = "Tagging complete, reloading talk page in a few seconds";

	var wikipedia_page = new Wikipedia.page(mw.config.get('wgPageName'), "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.shared.callbacks.main);
};
