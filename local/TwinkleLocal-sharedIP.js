//<nowiki>


(function( $, str ){



/*
 ****************************************
 *** TwinkleLocal-sharedIP.js: Shared IP address tagging module
 ****************************************
 * Mode of invocation:     Tab
 * Active on:              Existing IP user talk pages
 */

TwinkleLocal.sharedIP = {
	init: function TwinkleLocal_sharedIP_init() {
		if (
			mw.config.get( 'wgNamespaceNumber' ) === 3 &&
			Morebits.isIPAddress( mw.config.get( 'wgTitle' ) )
		) {
			TwinkleLocal.addPortletLink( 'sharedIP' );
		}
	},

	callback: function TwinkleLocal_sharedIP_callback() {
		var dialog = TwinkleLocal.createDialog( 'sharedIP', 'main' );
		var factory = dialog.quickFormFactory;
		var form = factory.getForm( TwinkleLocal.sharedIP.evaluate );

		// Scrollbox with template radio buttons
		var div = form.append( {
			type: 'div',
			id: 'sharedip-templatelist',
			className: 'morebits-scrollbox'
		} );
		div.append( factory.getElement( 'template-list-header', {
			type: 'header',
		} ) );
		div.append( factory.getListElement( 'template-list', {
			type: 'radio',
			name: 'shared',
			event: TwinkleLocal.sharedIP.changeShared
		} ) );

		// Free-text information fields
		var org = form.append( factory.getElement( 'other-details', {
			type: 'field'
		} ) );
		org.append( factory.getElement( 'other-details-organization', {
			type: 'input',
			name: 'organization',
			disabled: true
		} ) );
		org.append( factory.getElement( 'other-details-host', {
			type: 'input',
			name: 'host',
			disabled: true
		} ) );
		org.append( factory.getElement( 'other-details-contact', {
			type: 'input',
			name: 'contact',
			disabled: true
		} ) );
		
		form.append( { type: 'submit' } );

		var result = form.render();
		dialog.setContent( result );
		dialog.display();
	},

	changeShared: function TwinkleLocal_sharedIP_changeShared( e ) {
		e.target.form.contact.disabled = e.target.extra && !e.target.extra["contact-enabled"];
		e.target.form.organization.disabled = e.target.extra && !e.target.extra["organization-enabled"];
		e.target.form.host.disabled = e.target.extra && !e.target.extra["host-enabled"];
		e.stopPropagation();
	},

	processPageCallback: function TwinkleLocal_sharedIP_processPageCallback( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var pageText = pageobj.getPageText();

		// is the template already on the page?
		var templates = TwinkleLocal.getQuickFormElement( 'sharedIP', 'template-list' ).list;
		var found = templates.every( function( template ) {
			var tagRe = new RegExp( '(\\{\\{' + RegExp.escape( template.value, true ) + '(\\||\\}\\}))', 'im' );
			if ( tagRe.test( pageText ) ) {
				Morebits.status.warn( str( 'info' ), str( 'found-template', template.value ) );
				return false;
			}
			return true;
		} );
		if ( found ) {
			return;
		}

		pageobj.setPageText( params.templateText + '\n\n' + pageText );
		pageobj.setEditSummary( params.summaryText + TwinkleLocal.getPref( 'summaryAd' ) );
		pageobj.setMinorEdit( TwinkleLocal.getPref( 'markSharedIPAsMinor' ) );
		pageobj.setCreateOption( 'recreate' );
		pageobj.save();
	},

	evaluate: function TwinkleLocal_sharedIP_evaluate( e ) {
		var shared = e.target.getChecked( 'shared' );
		if( !shared || shared.length <= 0 ) {
			alert( str( 'must-select-one' ) );
			return;
		}

		var value = shared[0];

		if( !e.target.organization.disabled && e.target.organization.value === '' ) {
			alert( str( 'must-input-organization' ) );
			return;
		}

		var params = {
			template: value,
			organization: e.target.organization.value,
			host: e.target.host.value,
			contact: e.target.contact.value
		};

		Morebits.simpleWindow.setButtonsEnabled( false );
		Morebits.status.init( e.target );

		Morebits.wiki.actionCompleted.redirect = mw.config.get( 'wgPageName' );
		Morebits.wiki.actionCompleted.notice = str( 'complete-reloading' );

		var wikipedia_page = new Morebits.wiki.page( mw.config.get( 'wgPageName' ),
			str( 'user-talk-modification' ) );
		wikipedia_page.setFollowRedirect( true );
		wikipedia_page.setCallbackParameters( params );
		wikipedia_page.load( TwinkleLocal.sharedIP.processPageCallback );
	}
};
})( jQuery, TwinkleLocal.getL10nFunction( 'sharedIP' ) );


//</nowiki>
