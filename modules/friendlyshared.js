//<nowiki>


(function($){


/*
 ****************************************
 *** friendlyshared.js: Shared IP tagging module
 ****************************************
 * Mode of invocation:     Tab ("Shared")
 * Active on:              Existing IP user talk pages
 * Config directives in:   FriendlyConfig
 */

Twinkle.shared = function friendlyshared() {
	if( mw.config.get('wgNamespaceNumber') === 3 && Morebits.isIPAddress(mw.config.get('wgTitle')) ) {
		var username = mw.config.get('wgTitle').split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes
		Twinkle.addPortletLink( function(){ Twinkle.shared.callback(username); }, $.i18n('tw-sharedip-label'), "friendly-shared", 'tw-sharedip-label-hover' );
	}
};

Twinkle.shared.callback = function friendlysharedCallback( uid ) {
	var Window = new Morebits.simpleWindow( 600, 420 );
	Window.setTitle( $.i18n('tw-sharedip-window-title') );
	Window.setScriptName( $.i18n('tw-core-script-name') );
	Window.addFooterLink( $.i18n('tw-core-help'), $.i18n('tw-core-help-page') );
	
	Twinkle.shared.initialize();

	var form = new Morebits.quickForm( Twinkle.shared.callback.evaluate );

	var div = form.append( {
			type: 'div',
			id: 'sharedip-templatelist',
			className: 'morebits-scrollbox'
		}
	);
	div.append( { type: 'header', label: $.i18n('tw-sharedip-templates') } );
	div.append( { type: 'radio', name: 'shared', list: Twinkle.shared.standardList,
		event: function( e ) {
			Twinkle.shared.callback.change_shared( e );
			e.stopPropagation();
		}
	} );

	var org = form.append( { type:'field', label: $.i18n('tw-sharedip-field-label') } );
	org.append( {
			type: 'input',
			name: 'organization',
			label: $.i18n('tw-sharedip-owner'),
			disabled: true,
			tooltip: $.i18n('tw-sharedip-owner-tooltip')
		}
	);
	org.append( {
			type: 'input',
			name: 'host',
			label: $.i18n('tw-sharedip-host'),
			disabled: true,
			tooltip: $.i18n('tw-sharedip-host-tooltip')
		}
	);
	org.append( {
			type: 'input',
			name: 'contact',
			label: $.i18n('tw-sharedip-contact'),
			disabled: true,
			tooltip: $.i18n('tw-sharedip-contact-tooltip')
		}
	);

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
};

Twinkle.shared.initialize = function() {
	Twinkle.shared.standardList = [
		{
			label: '{{Shared IP}}: standard shared IP address template',
			value: $.i18n('tw-sharedip-shared-ip'),
			tooltip: 'IP user talk page template that shows helpful information to IP users and those wishing to warn, block or ban them'
		},
		{
			label: '{{Shared IP edu}}: shared IP address template modified for educational institutions',
			value: $.i18n('tw-sharedip-shared-ip-edu')
		},
		{
			label: '{{Shared IP corp}}: shared IP address template modified for businesses',
			value: $.i18n('tw-sharedip-shared-ip-corp')
		},
		{
			label: '{{Shared IP public}}: shared IP address template modified for public terminals',
			value: $.i18n('tw-sharedip-shared-ip-public')
		},
		{
			label: '{{Shared IP gov}}: shared IP address template modified for government agencies or facilities',
			value: $.i18n('tw-sharedip-shared-ip-gov')
		},
		{
			label: '{{Dynamic IP}}: shared IP address template modified for organizations with dynamic addressing',
			value: $.i18n('tw-sharedip-dynamic-ip')
		},
		{
			label: '{{Static IP}}: shared IP address template modified for static IP addresses',
			value: $.i18n('tw-sharedip-static-ip')
		},
		{
			label: '{{ISP}}: shared IP address template modified for ISP organizations (specifically proxies)',
			value: $.i18n('tw-sharedip-isp')
		},
		{
			label: '{{Mobile IP}}: shared IP address template modified for mobile phone companies and their customers',
			value: $.i18n('tw-sharedip-mobile-ip')
		},
		{
			label: '{{Whois}}: template for IP addresses in need of monitoring, but unknown whether static, dynamic or shared',
			value: $.i18n('tw-sharedip-whois')
		}
	];
}

Twinkle.shared.callback.change_shared = function friendlysharedCallbackChangeShared(e) {
	e.target.form.contact.disabled = (e.target.value !== $.i18n('tw-sharedip-shared-ip-edu'));  // only supported by {{Shared IP edu}}
	e.target.form.organization.disabled = false;
	e.target.form.host.disabled = (e.target.value === $.i18n('tw-sharedip-whois'));  // host= not supported by {{Whois}}
};

Twinkle.shared.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var pageText = pageobj.getPageText();
		var found = false;
		var text = '{{';

		for( var i=0; i < Twinkle.shared.standardList.length; i++ ) {
			var tagRe = new RegExp( '(\\{\\{' + Twinkle.shared.standardList[i].value + '(\\||\\}\\}))', 'im' );
			if( tagRe.exec( pageText ) ) {
				Morebits.status.warn( 'Info', 'Found {{' + Twinkle.shared.standardList[i].value + '}} on the user\'s talk page already...aborting' );
				found = true;
			}
		}

		if( found ) {
			return;
		}

		Morebits.status.info( $.i18n('tw-core-morebits-info'), $.i18n('tw-sharedip-will-add') );
		text += params.value + '|' + params.organization;
		if( params.value === 'Shared IP edu' && params.contact !== '') {
			text += '|' + params.contact;
		}
		if( params.value !== 'Whois' && params.host !== '' ) {
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

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Tagging complete, reloading talk page in a few seconds";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.shared.callbacks.main);
};
})(jQuery);


//</nowiki>
