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
		Twinkle.addPortletLink( function(){ Twinkle.shared.callback(username); }, $.i18n._('tw-sharedip-label'), "friendly-shared", 'tw-sharedip-label-hover' );
	}
};

Twinkle.shared.callback = function friendlysharedCallback() {
	var Window = new Morebits.simpleWindow( 600, 420 );
	Window.setTitle( $.i18n._('tw-sharedip-window-title') );
	Window.setScriptName( $.i18n._('tw-core-script-name') );
	Window.addFooterLink( $.i18n._('tw-core-help'), $.i18n._('tw-core-help-page') );
	
	Twinkle.shared.initialize();

	var form = new Morebits.quickForm( Twinkle.shared.callback.evaluate );

	var div = form.append( {
			type: 'div',
			id: 'sharedip-templatelist',
			className: 'morebits-scrollbox'
		}
	);
	div.append( { type: 'header', label: $.i18n._('tw-sharedip-templates') } );
	div.append( { type: 'radio', name: 'shared', list: Twinkle.shared.standardList,
		event: function( e ) {
			Twinkle.shared.callback.change_shared( e );
			e.stopPropagation();
		}
	} );

	var org = form.append( { type:'field', label: $.i18n._('tw-sharedip-field-label') } );
	org.append( {
			type: 'input',
			name: 'organization',
			label: $.i18n._('tw-sharedip-owner'),
			disabled: true,
			tooltip: $.i18n._('tw-sharedip-owner-tooltip')
		}
	);
	org.append( {
			type: 'input',
			name: 'host',
			label: $.i18n._('tw-sharedip-host'),
			disabled: true,
			tooltip: $.i18n._('tw-sharedip-host-tooltip')
		}
	);
	org.append( {
			type: 'input',
			name: 'contact',
			label: $.i18n._('tw-sharedip-contact'),
			disabled: true,
			tooltip: $.i18n._('tw-sharedip-contact-tooltip')
		}
	);

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
};

Twinkle.shared.initialize = function() {
	if( typeof Twinkle.shared.standardList === 'undefined' ) {
		Twinkle.shared.standardList = [
			{
				label: $.i18n._('tw-sharedip-shared-ip-label'),
				value: $.i18n._('tw-sharedip-shared-ip'),
				tooltip: $.i18n._('tw-sharedip-share-ip-tooltip')
			},
			{
				label: $.i18n._('tw-sharedip-shared-ip-edu-label'),
				value: $.i18n._('tw-sharedip-shared-ip-edu')
			},
			{
				label: $.i18n._('tw-sharedip-shared-ip-corp-label'),
				value: $.i18n._('tw-sharedip-shared-ip-corp')
			},
			{
				label: $.i18n._('tw-sharedip-shared-ip-public-label'),
				value: $.i18n._('tw-sharedip-shared-ip-public')
			},
			{
				label: $.i18n._('tw-sharedip-shared-ip-gov-label'),
				value: $.i18n._('tw-sharedip-shared-ip-gov')
			},
			{
				label: $.i18n._('tw-sharedip-dynamic-ip-label'),
				value: $.i18n._('tw-sharedip-dynamic-ip')
			},
			{
				label: $.i18n._('tw-sharedip-static-ip-label'),
				value: $.i18n._('tw-sharedip-static-ip')
			},
			{
				label: $.i18n._('tw-sharedip-isp-label'),
				value: $.i18n._('tw-sharedip-isp')
			},
			{
				label: $.i18n._('tw-sharedip-mobile-ip-label'),
				value: $.i18n._('tw-sharedip-mobile-ip')
			},
			{
				label: $.i18n._('tw-sharedip-whois-label'),
				value: $.i18n._('tw-sharedip-whois')
			}
		];
	}
}

Twinkle.shared.callback.change_shared = function friendlysharedCallbackChangeShared(e) {
	e.target.form.contact.disabled = (e.target.value !== 'Shared IP edu');  // only supported by {{Shared IP edu}}
	e.target.form.organization.disabled = false;
	e.target.form.host.disabled = (e.target.value === 'Whois');  // host= not supported by {{Whois}}
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
				Morebits.status.warn( $.i18n._('tw-morebits-info'), $.i18n._('tw-sharedip-aborting', Twinkle.shared.standardList[i].value) );
				found = true;
			}
		}

		if( found ) {
			return;
		}

		Morebits.status.info( $.i18n._('morebits-info'), $.i18n._('tw-sharedip-will-add') );
		text += params.value + '|' + params.organization;
		if( params.value === 'Shared IP edu' && params.contact !== '') {
			text += '|' + params.contact;
		}
		if( params.value !== 'Whois' && params.host !== '' ) {
			text += '|host=' + params.host;
		}
		text += '}}\n\n';

		var summaryText = $.i18n._('tw-sharedip-added', params.value, params.value);
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
		alert( $.i18n._('tw-sharedip-alert-template') );
		return;
	}

	var value = shared[0];

	if( e.target.organization.value === '') {
		alert( $.i18n._('tw-sharedip-alert-organization'), value );
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
	Morebits.wiki.actionCompleted.notice = $.i18n._('tw-sharedip-done');

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), $.i18n._('tw-sharedip-action'));
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.shared.callbacks.main);
};
})(jQuery);


//</nowiki>
