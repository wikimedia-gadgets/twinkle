if ( typeof(Twinkle) === "undefined" ) {
	throw ( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function twinkleproddelete() {
	if( wgNamespaceNumber != Namespace.CATEGORY || ! userIsInGroup( 'sysop' ) || ! /^Category:Proposed_deletion_as_of/.test(wgPageName) ) {
		return;
	}
	twAddPortletLink( "javascript:twinkleproddelete.callback()", "Deprod", "tw-deprod", "Delete prod pages found in this category", "");
}

function getChecked( nodelist ) {
	if( !( nodelist instanceof NodeList ) ) {
		return nodelist.checked ? [ nodelist.value ] : [];
	}
	var result = [];
	for(var i  = 0; i < nodelist.length; ++i ) {
		if( nodelist[i].checked ) {
			result.push( nodelist[i].value );
		}
	}
	return result;
}

twinkleproddelete.unlinkCache = {};
twinkleproddelete.concerns = {};
twinkleproddelete.callback = function twinklesproddeleteCallback() {
	var Window = new SimpleWindow( 800, 400 );
	Window.setTitle( "PROD cleaning" );

	var form = new QuickForm( twinkleproddelete.callback.evaluate );

	var query = {
		'action': 'query',
		'generator': 'categorymembers',
		'gcmtitle': wgPageName,
		'gcmlimit' : 5000, // the max for sysops
		'prop': [ 'categories', 'revisions' ],
		'rvprop': [ 'content' ]
	};

	var wikipedia_api = new Wikipedia.api( 'Grabbing pages', query, function( self ) {
			var xmlDoc = self.responseXML;
			var snapshot = xmlDoc.evaluate('//page[@ns != "' + Namespace.IMAGE + '"]', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			var list = [];
			for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
				var object = snapshot.snapshotItem(i);
				var page = xmlDoc.evaluate( '@title', object, null, XPathResult.STRING_TYPE, null ).stringValue;
				var content = xmlDoc.evaluate( 'revisions/rev', object, null, XPathResult.STRING_TYPE, null ).stringValue;
				var prod_re = /[Dd]ated[ _]prod/;
				var index =  content.indexOf( '\{\{dated prod' ); //\}\}
				var concern = '';
				if( index != -1 ) {
					var parsed = Mediawiki.Template.parse( content, index );
					var concern = parsed.parameters.concern || '';
				}
				list.push( {label:page + ' (' + concern + ')' , value:page, checked:concern != '' });
				twinkleproddelete.concerns[page] = concern;
			}
			self.params.form.append( {
					type: 'checkbox',
					name: 'pages',
					list: list
				}
			)
			self.params.form.append( { type:'submit' } );

			var result = self.params.form.render();
			self.params.Window.setContent( result );


		}  );

	wikipedia_api.params = { form:form, Window:Window };
	wikipedia_api.post();
	var root = document.createElement( 'div' );
	Status.init( root );
	Window.setContent( root );
	Window.display();
}

twinkleproddelete.currentDeleteCounter = 0;
twinkleproddelete.currentUnlinkCounter = 0;
twinkleproddelete.currentdeletor;
twinkleproddelete.callback.evaluate = function twinkleproddeleteCallbackEvaluate(event) {
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!
	var pages = getChecked( event.target.pages );
	Status.init( event.target );
	function toCall( work ) {
		if( work.length == 0 ) {
			Status.info( 'work done' );
			window.clearInterval( twinkleproddelete.currentdeletor );
			Wikipedia.removeCheckpoint();
			return;
		} else if( twinkleproddelete.currentDeleteCounter <= 0 || twinkleproddelete.currentUnlinkCounter <= 0 ) {
			twinkleproddelete.currentcounter = TwinkleConfig.proddeleteChunks;
			twinkleproddelete.unlinkCache = []; // Clear the cache
			var pages = work.pop();
			for( var i = 0; i < pages.length; ++i ) {
				var page = pages[i];
				var query = {
					'action': 'query',
					'prop': 'revisions',
					'rvprop': [ 'content' ],
					'rvlimit': 1,
					'titles': page
				}
				var wikipedia_api = new Wikipedia.api( 'Checking if page ' + page + ' exists', query, twinkleproddelete.callbacks.main );
				wikipedia_api.params = { page:page, reason: twinkleproddelete.concerns[page] };
				wikipedia_api.post();
			}
		}
	}
	var work = pages.chunk( TwinkleConfig.proddeleteChunks );
	Wikipedia.addCheckpoint();
	twinkleproddelete.currentdeletor = window.setInterval( toCall, 1000, work );
}
twinkleproddelete.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;
		var normal = xmlDoc.evaluate( '//normalized/n/@to', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
		if( normal ) {
			self.params.page = normal;
		}
		var exists = xmlDoc.evaluate( 'boolean(//pages/page[not(@missing)])', xmlDoc, null, XPathResult.BOOLEAN_TYPE, null ).booleanValue;

		if( ! exists ) {
			self.statelem.error( "It seems that the page doesn't exists, perhaps it has already been deleted" );
			return;
		}

		var query = {
			'action': 'query',
			'list': 'backlinks',
			'blfilterredir': 'redirects',
			'bltitle': self.params.page,
			'bllimit': userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
		};
		var wikipedia_api = new Wikipedia.api( 'Grabbing redirects', query, twinkleproddelete.callbacks.deleteRedirectsMain );
		wikipedia_api.params = self.params;
		wikipedia_api.post();

		var query = { 
			'title': 'Talk:' + self.params.page,
			'action': 'delete'
		};
		var wikipedia_wiki = new Wikipedia.wiki( 'Deleting talk page of page' + self.params.page, query, twinkleproddelete.callbacks.deleteTalkPage );
		wikipedia_wiki.followRedirect = false;
		wikipedia_wiki.get();		

		var query = { 
			'title': self.params.page, 
			'action': 'delete'
		};
		var wikipedia_wiki = new Wikipedia.wiki( 'Deleting page ' + self.params.page, query, twinkleproddelete.callbacks.deletePage, function( self ) { 
				--twinkleproddelete.currentDeleteCounter;
				var link = document.createElement( 'a' );
				link.setAttribute( 'href', wgArticlePath.replace( '$1', self.query['title'] ) );
				link.setAttribute( 'title', self.query['title'] );
				link.appendChild( document.createTextNode( self.query['title'] ) );
				self.statelem.info( [ 'completed (' , link , ')' ] );

			} );
		wikipedia_wiki.params = self.params;
		wikipedia_wiki.followRedirect = false;
		wikipedia_wiki.get();		

	},
	deleteRedirectsMain: function( self ) {
		var xmlDoc = self.responseXML;
		var snapshot = xmlDoc.evaluate('//backlinks/bl/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

		var total = snapshot.snapshotLength * 2;

		if( snapshot.snapshotLength == 0 ) {
			return;
		}

		var statusIndicator = new Status('Deleting redirects', '0%');

		var onsuccess = function( self ) {
			var obj = self.params.obj;
			var total = self.params.total;
			var now = parseInt( 100 * ++(self.params.current)/total ) + '%';
			obj.update( now );
			self.statelem.unlink();
			if( self.params.current >= total ) {
				obj.info( now + ' (completed)' );
				Wikipedia.removeCheckpoint();
			}
		}
		var onloaded = onsuccess;

		var onloading = function( self ) {}


		Wikipedia.addCheckpoint();
		if( snapshot.snapshotLength == 0 ) {
			statusIndicator.info( '100% (completed)' );
			Wikipedia.removeCheckpoint();
			return;
		}

		var params = clone( self.params );
		params.current = 0;
		params.total = total;
		params.obj = statusIndicator;


		for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
			var title = snapshot.snapshotItem(i).value;
			var query = {
				'title': title,
				'action': 'delete'
			}
			var wikipedia_wiki = new Wikipedia.wiki( "Deleting " + title, query, twinkleproddelete.callbacks.deleteRedirects );
			wikipedia_wiki.params = params;
			wikipedia_wiki.onloading = onloading;
			wikipedia_wiki.onloaded = onloaded;
			wikipedia_wiki.onsuccess = onsuccess;
			wikipedia_wiki.followRedirect = false;
			wikipedia_wiki.get();
		}
	},
	deleteRedirects: function( self ) {
		var form = this.responseXML.getElementById( 'deleteconfirm' );
		if( ! form ) { // Hell, image deletion is b0rked :(
			form = this.responseXML.getElementsByTagName( 'form' )[0];
			var postData = {
				'wpReason': "Speedy deleted per ([[WP:CSD#R1|CSD R1]]), Redirect to deleted page \"" + self.params.page + "\"." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
		} else {

			var postData = {
				'wpWatch': form.wpWatch.checked ? '' : undefined,
				'wpReason': "Speedy deleted per ([[WP:CSD#R1|CSD R1]]), Redirect to deleted page \"" + self.params.page + "\"." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
		}
		self.post( postData );
	},
	deletePage: function( self ) {
		var form = this.responseXML.getElementById( 'deleteconfirm' );
		var postData = {
			'wpWatch': form.wpWatch.checked ? '' : undefined,
			'wpReason': "Deleted because expired \[\[WP:PROD\]\]; Reason given: " + self.params.reason + "." + TwinkleConfig.deletionSummaryAd,
			'wpEditToken': form.wpEditToken.value
		}
		self.post( postData );
	},
	deleteTalkPage: function( self ) {
		var form = this.responseXML.getElementById( 'deleteconfirm' );
		if( ! form ) {
			var link = document.createElement( 'a' );
			link.setAttribute( 'href', wgArticlePath.replace( '$1', self.query['title'] ) );
			link.setAttribute( 'title', self.query['title'] );
			link.appendChild( document.createTextNode( self.query['title'] ) );

			self.statelem.info( [ 'completed (' , link , ')' ] );
			Wikipedia.actionCompleted();
			return;
		}
		var postData = {
			'wpWatch': form.wpWatch.checked ? '' : undefined,
			'wpReason': "Deleted talk page of a page because expired \[\[WP:PROD\]\]." + TwinkleConfig.deletionSummaryAd,
			'wpEditToken': form.wpEditToken.value
		}
		self.post( postData );
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinkledeprod", twinkleproddelete );