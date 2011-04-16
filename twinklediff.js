if ( typeof(Twinkle) === "undefined" ) {
	alert( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function twinklediff() { 
	if( wgNamespaceNumber < 0 ) {
		return;
	}

	var query = {
		'title': wgPageName,
		'diff': 'cur',
		'oldid': 'prev'
	};

	twAddPortletLink( wgServer + wgScriptPath + '/index.php?' + QueryString.create( query ), 'Last', 'tw-lastdiff', 'Show most recent diff' );

	// Show additional tabs only on diff pages
	if(!QueryString.exists('diff')) return;

	twAddPortletLink( "javascript:twinklediff.evaluate(false);", 'Since', 'tw-since', 'Show difference between last diff and the revision made by previous user' );

	twAddPortletLink( "javascript:twinklediff.evaluate(true);", 'Since mine', 'tw-sincemine', 'Show difference between last diff and my last revision' );

	var oldid = /oldid=(.+)/.exec($('div#mw-diff-ntitle1 strong a').first().attr("href"))[1];
	var query = {
		'title': wgPageName,
		'diff': 'cur',
		'oldid' : oldid
	};
	twAddPortletLink( wgServer + wgScriptPath + '/index.php?' + QueryString.create( query ), 'Current', 'tw-curdiff', 'Show difference to current revision' );
}

twinklediff.evaluate = function twinklediffEvaluate(me) {
	var ntitle = getElementsByClassName( document.getElementById('bodyContent'), 'td' , 'diff-ntitle' )[0];

	var user;
	if( me ) {
		user = wgUserName;
	} else {
		var node = document.getElementById( 'mw-diff-ntitle2' );
		if( ! node ) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	var query = {
		'prop': 'revisions',
		'action': 'query',
		'titles': wgPageName,
		'rvlimit': 1, 
		'rvprop': [ 'ids', 'user' ],
		'rvstartid': wgCurRevisionId - 1, // i.e. not the current one
		'rvuser': user
	};
	Status.init( document.getElementById('bodyContent') );
	var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, twinklediff.callbacks.main );
	wikipedia_api.params = { user: user };
	wikipedia_api.post();
}

twinklediff.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;
		var revid = xmlDoc.evaluate( '//rev/@revid', xmlDoc, null, XPathResult.NUMBER_TYPE, null ).numberValue;

		if( ! revid ) {
			self.statelem.error( 'no suitable earlier revision found, or ' + self.params.user + ' is the only contributor. Aborting.' );
			return;
		}
		var query = {
			'title': wgPageName,
			'oldid': revid,
			'diff': wgCurRevisionId
		};
		window.location = wgServer + wgScriptPath + '/index.php?' + QueryString.create( query );
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinklediff", twinklediff );