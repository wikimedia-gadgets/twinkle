function twinkleundelete() {
	if ( wgNamespaceNumber < 0 || wgCurRevisionId != false ) {
		return;
	}
	if ( userIsInGroup( 'sysop' ) ) {
		addPortletLink( 'p-cactions', "javascript:twinkleundelete.callback()", "undel", "tw-undel", "Undelete em all", "");
	}
}

twinkleundelete.callback = function twinkleundeleteCallback() {
	var Window = new SimpleWindow( 800, 400 );
	var div = document.createElement( 'div' );
	Status.init( div );
	Window.setContent( div );
	Window.display();
	var query = {
		'title': 'Special:Undelete',
		'target': 'Wikipedia:NeverToBeRestored',
		'action': 'submit'
	};


	var wikipedia_wiki = new Wikipedia.wiki( 'Undeleting page', query, twinkleundelete.callbacks.undeletePage );
	wikipedia_wiki.params = self.params;
	wikipedia_wiki.followRedirect = false;
	wikipedia_wiki.get();

}

twinkleundelete.callbacks = {
	undeletePage: function( self ) {
		var form = self.responseXML.getElementById('undelete');
		var postData = {
			'wpComment': "Speedly undeleted." + TwinkleConfig.deletionSummaryAd,
			'target': wgPageName,
			'wpEditToken': form.wpEditToken.value,
			'restore': 1
		}
		self.post( postData );

	}
};

// register initialization callback
Twinkle.init.moduleReady( "twinkleundelete", twinkleundelete );