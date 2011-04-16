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
 FriendlyConfig.markSharedIPAsMinor ( boolean )
 */
if( typeof( FriendlyConfig.markSharedIPAsMinor ) == 'undefined' ) {
	FriendlyConfig.markSharedIPAsMinor = true;
}

addOnloadHook(friendlyshared);

function friendlyshared() {
	if( wgNamespaceNumber == 3 && isIPAddress( wgTitle ) ) {
		var username = wgTitle.split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes

		twAddPortletLink( "javascript:friendlyshared.callback(\"" + username + "\")", "Shared IP", "friendly-shared", "Shared IP tagging", "");
	}
}

friendlyshared.callback = function friendlysharedCallback( uid ) {
	var Window = new SimpleWindow( 600, 400 );
	Window.setTitle( "Choose a shared IP address template" ); 
	var form = new QuickForm( friendlyshared.callback.evaluate );

	form.append( { type:'header', label:'Shared IP address templates' } );
	form.append( { type: 'radio', name: 'shared', list: friendlyshared.standardList,
		event: function( e ) {
			friendlyshared.callback.change_shared( e );
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
}

friendlyshared.standardList = [
	{
		label: '{{sharedip}}: standard shared IP address template',
		value: 'sharedip',
		tooltip: 'IP user talk page template that shows helpful information to IP users and those wishing to warn or ban them' },
	{ 
		label: '{{sharedipedu}}: shared IP address template modified for educational institutions',
		value: 'sharedipedu' },
	{
		label: '{{sharedippublic}}: shared IP address template modified for public terminals',
		value: 'sharedippublic' },
	{
		label: '{{sharedipusmilitary}}: shared IP address template modified for the US military',
		value: 'sharedipusmilitary' },
	{
		label: '{{dynamicip}}: shared IP address template modified for organizations with dynamic addressing',
		value: 'dynamicip' },
	{ 
		label: '{{isp}}: shared IP address template modified for ISP organizations',
		value: 'isp' },
	{ 
		label: '{{mobileip}}: shared IP address template modified mobile phone company and their customers',
		value: 'mobileip' }
]

friendlyshared.callback.change_shared = function friendlytagCallbackChangeShared(e) {
	if( e.target.value == 'sharedipedu' ) {
		e.target.form.contact.disabled = false;
	} else {
		e.target.form.contact.disabled = true;
	}
	e.target.form.organization.disabled=false;
	e.target.form.host.disabled=false;
}

friendlyshared.callbacks = {
	main: function( self ) {
		var form = self.responseXML.getElementById( 'editform' );
		var found = false;
		var text = '{{';

		for( var i=0; i < friendlyshared.standardList.length; i++ ) {
			tagRe = new RegExp( '(\{\{' + friendlyshared.standardList[i].value + '(\||\}\}))', 'im' );
			if( tagRe.exec( form.wpTextbox1.value ) ) {
				Status.info( 'Info', 'Found {{' + friendlyshared.standardList[i].value + '}} on the user\'s talk page already...aborting' );
				found = true;
				text = form.wpTextbox1.value;
			}
		}
		
		if( !found ) {
			Status.info( 'Info', 'Will add the shared IP address template to the top of the user\'s talk page.' );
			text += self.params.value + '|' + self.params.organization;
			if( self.params.value == 'sharedipedu' && self.params.contact != '') {
				text += '|' + self.params.contact;
			}
			if( self.params.host != '' ) {
				text += '|host=' + self.params.host;
			}
			text += '}}\n\n' + form.wpTextbox1.value;
		}
		
		var postData = {
			'wpMinoredit': FriendlyConfig.markSharedIPAsMinor ? 1 : undefined,
			'wpWatchthis': form.wpWatchthis.checked ? 1 : undefined,
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSummary': 'Added \{\{[[Template:' + self.params.value + '|' + self.params.value + ']]\}\} template to user talk page.' + FriendlyConfig.summaryAd,
			'wpTextbox1': text
		};
 
		self.post( postData );
	}
}

friendlyshared.callback.evaluate = function friendlysharedCallbackEvaluate(e) {
	var shared = e.target.getChecked( 'shared' );
	if( !shared || shared.length <= 0 ) {
		alert( 'You must select a shared IP address template to use!' );
		return;
	}
	
	var value = shared[0];
	
	if( e.target.organization.value == '') {
		alert( 'You must input an organization for the {{' + value + '}} template!' );
		return;
	}
	
	var params = {
		value: value,
		organization: e.target.organization.value,
		host: e.target.host.value,
		contact: e.target.contact.value
	};

	Status.init( e.target );
	
	var query = { 
		'title': wgPageName, 
		'action': 'submit'
	};
	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Shared IP tagging complete, reloading talk page in some seconds";
	var wikipedia_wiki = new Wikipedia.wiki( 'User talk page modification', query, friendlyshared.callbacks.main );
	wikipedia_wiki.params = params;
	wikipedia_wiki.followRedirect = true;
	wikipedia_wiki.get();
}
// </nowiki>