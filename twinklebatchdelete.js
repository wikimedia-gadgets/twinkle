// If TwinkleConfig aint exist.
if( typeof( TwinkleConfig ) == 'undefined' ) {
	TwinkleConfig = {};
}

/**
 TwinkleConfig.summaryAd (string)
 If ad should be added or not to summary, default [[WP:TWINKLE|TWINKLE]]
 */
if( typeof( TwinkleConfig.summaryAd ) == 'undefined' ) {
	TwinkleConfig.summaryAd = " using [[WP:TW|TW]]";
}

/**
 TwinkleConfig.deletionSummaryAd (string)
 If ad should be added or not to deletion summary, default [[WP:TWINKLE|TWINKLE]]
 */
if( typeof( TwinkleConfig.deletionSummaryAd ) == 'undefined' ) {
	TwinkleConfig.deletionSummaryAd = " using [[WP:TW|TW]]";
}

/**
 TwinkleConfig.batchdeleteChunks (integer)
 How many pages should be processed at a time
 */
if( typeof( TwinkleConfig.batchDeleteChunks ) == 'undefined' ) {
	TwinkleConfig.batchdeleteChunks = 1;
}

/**
 TwinkleConfig.batchDeleteMinCutOff (integer)
 How many pages left in the process of being completed should allow a new batch to be initialized
 */
if( typeof( TwinkleConfig.batchDeleteMinCutOff ) == 'undefined' ) {
	TwinkleConfig.batchDeleteMinCutOff = 0;
}
/**
 TwinkleConfig.batchMax (integer)
 How many pages should be processed maximum
 */
if( typeof( TwinkleConfig.batchMax ) == 'undefined' ) {
	TwinkleConfig.batchMax = 5000;
}

function twinklebatchdelete() {
	if( userIsInGroup( 'sysop' ) && (wgNamespaceNumber > 0 || wgCanonicalSpecialPageName == 'Prefixindex') ) {
	  twAddPortletLink( "javascript:twinklebatchdelete.callback()", "D-batch", "tw-batch", "Delete pages found in this category/on this page", "");
        }
}

twinklebatchdelete.unlinkCache = {};
twinklebatchdelete.callback = function twinklesbatchdeleteCallback() {
	var Window = new SimpleWindow( 800, 400 );
	Window.setTitle( "Batch deletion" );

	var form = new QuickForm( twinklebatchdelete.callback.evaluate );
	form.append( {
			type: 'checkbox',
			list: [
				{ 
					label: 'Delete pages',
					name: 'delete_page',
					value: 'delete',
					checked: true
				},
				{
					label: 'Remove backlinks to the page',
					name: 'unlink_page',
					value: 'unlink',
					checked: true
				},
				{
					label: 'Delete redirects to deleted pages',
					name: 'delete_redirects',
					value: 'delete_redirects',
					checked: true
				}
			]
		} );
	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason: '
		} );
	if( wgNamespaceNumber == Namespace.CATEGORY ) {

		var query = {
			'action': 'query',
			'generator': 'categorymembers',
			'gcmtitle': wgPageName,
			'gcmlimit' : TwinkleConfig.batchMax, // the max for sysops
			'prop': [ 'categories', 'revisions' ],
			'rvprop': [ 'size' ]
		};
	} else if( wgCanonicalSpecialPageName == 'Prefixindex' ) {

		if(QueryString.exists( 'from' ) )
		{
			var gapnamespace = QueryString.get( 'namespace' );
			var gapprefix = QueryString.get( 'from' ).toUpperCaseFirstChar();
		}
		else
		{
			var pathSplit = location.pathname.split('/');
			if (pathSplit.length<3 || pathSplit[2]!="Special:PrefixIndex") return;
			var titleSplit = pathSplit[3].split(':');
			var gapnamespace = Namespace[titleSplit[0].toUpperCase()];
			if ( titleSplit.length<2 || typeof(gapnamespace)=='undefined' )
			{
				var gapnamespace = Namespace.MAIN;
				var gapprefix = pathSplit.splice(3).join('/');
			}
			else
			{
				pathSplit = pathSplit.splice(4);
				pathSplit.splice(0,0,titleSplit.splice(1).join(':'));
				var gapprefix = pathSplit.join('/');
			}
		}

		var query = {
			'action': 'query',
			'generator': 'allpages',
			'gapnamespace': gapnamespace ,
			'gapprefix': gapprefix,
			'gaplimit' : TwinkleConfig.batchMax, // the max for sysops
			'prop' : ['categories', 'revisions' ],
			'rvprop': [ 'size' ]
		}
	} else {
		var query = {
			'action': 'query',
			'generator': 'links',
			'titles': wgPageName,
			'gpllimit' : TwinkleConfig.batchMax, // the max for sysops
			'prop': [ 'categories', 'revisions' ],
			'rvprop': [ 'size' ]
		};
	}

	var wikipedia_api = new Wikipedia.api( 'Grabbing pages', query, function( self ) {
			var xmlDoc = self.responseXML;
			var snapshot = xmlDoc.evaluate('//page[@ns != "' + Namespace.IMAGE + '" and not(@missing)]', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			var list = [];
			for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
				var object = snapshot.snapshotItem(i);
				var page = xmlDoc.evaluate( '@title', object, null, XPathResult.STRING_TYPE, null ).stringValue;
				var size = xmlDoc.evaluate( 'revisions/rev/@size', object, null, XPathResult.NUMBER_TYPE, null ).numberValue;

				var disputed = xmlDoc.evaluate( 'boolean(categories/cl[@title="Category:Contested candidates for speedy deletion"])', object, null, XPathResult.BOOLEAN_TYPE, null ).booleanValue;
				list.push( {label:page + ' (' + size + ')' + ( disputed ? ' DISPUTED' : '' ), value:page, checked:!disputed });
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

twinklebatchdelete.currentDeleteCounter = 0;
twinklebatchdelete.currentUnlinkCounter = 0;
twinklebatchdelete.currentdeletor;
twinklebatchdelete.callback.evaluate = function twinklebatchdeleteCallbackEvaluate(event) {
	Wikipedia.actionCompleted.notice = 'Status';
	Wikipedia.actionCompleted.postfix = 'batch deletion is now complete';
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!
	var pages = event.target.getChecked( 'pages' );
	var reason = event.target.reason.value;
	var delete_page = event.target.delete_page.checked;
	var unlink_page = event.target.unlink_page.checked;
	var delete_redirects = event.target.delete_redirects.checked;
	if( ! reason ) {
		return;
	}
	Status.init( event.target );
	if( !pages ) {
		Status.error( 'Error', 'nothing to delete, aborting' );
		return;
	}

	function toCall( work ) {
		if( work.length == 0 &&  twinklebatchdelete.currentDeleteCounter <= 0 && twinklebatchdelete.currentUnlinkCounter <= 0 ) {
			window.clearInterval( twinklebatchdelete.currentdeletor );
			Wikipedia.removeCheckpoint();
			return;
		} else if( work.length != 0 && ( twinklebatchdelete.currentDeleteCounter <= TwinkleConfig.batchDeleteMinCutOff || twinklebatchdelete.currentUnlinkCounter <= TwinkleConfig.batchDeleteMinCutOff  ) ) {
			twinklebatchdelete.unlinkCache = []; // Clear the cache
			var pages = work.shift();
			twinklebatchdelete.currentDeleteCounter += pages.length;
			twinklebatchdelete.currentUnlinkCounter += pages.length;
			for( var i = 0; i < pages.length; ++i ) {
				var page = pages[i];
				var query = {
					'action': 'query',
					'titles': page
				}
				var wikipedia_api = new Wikipedia.api( 'Checking if page ' + page + ' exists', query, twinklebatchdelete.callbacks.main );
				wikipedia_api.params = { page:page, reason:reason, unlink_page:unlink_page, delete_page:delete_page, delete_redirects:delete_redirects };
				wikipedia_api.post();
			}
		}
	}
	var work = pages.chunk( TwinkleConfig.batchdeleteChunks );
	Wikipedia.addCheckpoint();
	twinklebatchdelete.currentdeletor = window.setInterval( toCall, 1000, work );
}
twinklebatchdelete.callbacks = {
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
		if( self.params.unlink_page ) {
			var query = {
				'action': 'query',
				'list': 'backlinks',
				'blfilterredir': 'nonredirects',
				'blnamespace': [0, 100], // main space and portal space only
				'bltitle': self.params.page,
				'bllimit': userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
			};
			var wikipedia_api = new Wikipedia.api( 'Grabbing backlinks', query, twinklebatchdelete.callbacks.unlinkBacklinksMain );
			wikipedia_api.params = self.params;
			wikipedia_api.post();
		} else {
			--twinklebatchdelete.currentUnlinkCounter;
		}
		if( self.params.delete_page ) {
			if (self.params.delete_redirects)
			{
				var query = {
					'action': 'query',
					'list': 'backlinks',
					'blfilterredir': 'redirects',
					'bltitle': self.params.page,
					'bllimit': userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
				};
				var wikipedia_api = new Wikipedia.api( 'Grabbing backlinks', query, twinklebatchdelete.callbacks.deleteRedirectsMain );
				wikipedia_api.params = self.params;
				wikipedia_api.post();
			}

			var query = { 
				'title': self.params.page, 
				'action': 'delete'
			};
			var wikipedia_wiki = new Wikipedia.wiki( 'Deleting page ' + self.params.page, query, twinklebatchdelete.callbacks.deletePage, function( self ) { 
					--twinklebatchdelete.currentDeleteCounter;
					var link = document.createElement( 'a' );
					link.setAttribute( 'href', wgArticlePath.replace( '$1', self.query['title'] ) );
					link.setAttribute( 'title', self.query['title'] );
					link.appendChild( document.createTextNode( self.query['title'] ) );
					self.statelem.info( [ 'completed (' , link , ')' ] );

				} );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = false;
			wikipedia_wiki.get();		
		} else {
			--twinklebatchdelete.currentDeleteCounter;
		}
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
			var wikipedia_wiki = new Wikipedia.wiki( "Deleting " + title, query, twinklebatchdelete.callbacks.deleteRedirects );
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
				'wpReason': "Speedy deleted per ([[WP:CSD#G8|CSD G8]]), Redirect to deleted page \"" + self.params.page + "\"." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
		} else {

			var postData = {
				'wpWatch': form.wpWatch.checked ? '' : undefined,
				'wpReason': "Speedy deleted per ([[WP:CSD#G8|CSD G8]]), Redirect to deleted page \"" + self.params.page + "\"." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
		}
		self.post( postData );
	},
	deletePage: function( self ) {
		var form = this.responseXML.getElementById( 'deleteconfirm' );
		var postData = {
			'wpWatch': form.wpWatch.checked ? '' : undefined,
			'wpReason': "Deleted because \"" + self.params.reason + "\"." + TwinkleConfig.deletionSummaryAd,
			'wpEditToken': form.wpEditToken.value
		}
		self.post( postData );
	},
	unlinkBacklinksMain: function( self ) {
		var xmlDoc = self.responseXML;
		var snapshot = xmlDoc.evaluate('//backlinks/bl/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

		if( snapshot.snapshotLength == 0 ) {
			--twinklebatchdelete.currentUnlinkCounter;
			return;
		}

		var statusIndicator = new Status('Unlinking backlinks', '0%');

		var total = snapshot.snapshotLength * 2;

		var onsuccess = function( self ) {
			var obj = self.params.obj;
			var total = self.params.total;
			var now = parseInt( 100 * ++(self.params.current)/total ) + '%';
			obj.update( now );
			self.statelem.unlink();
			if( self.params.current >= total ) {
				obj.info( now + ' (completed)' );
				--twinklebatchdelete.currentUnlinkCounter;
				Wikipedia.removeCheckpoint();
			}
		}
		var onloaded = onsuccess;

		var onloading = function( self ) {}


		Wikipedia.addCheckpoint();
		if( snapshot.snapshotLength == 0 ) {
			statusIndicator.info( '100% (completed)' );
			--twinklebatchdelete.currentUnlinkCounter;
			Wikipedia.removeCheckpoint();
			return;
		}
		self.params.total = total;
		self.params.obj = statusIndicator;
		self.params.current =   0;

		for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
			var title = snapshot.snapshotItem(i).value;
			var query = {
				'title': title,
				'action': 'submit'
			}
			var wikipedia_wiki = new Wikipedia.wiki( "Unlinking on " + title, query, twinklebatchdelete.callbacks.unlinkBacklinks );
			var params = clone( self.params );
			params.title = title;

			wikipedia_wiki.params = params;
			wikipedia_wiki.onloading = onloading;
			wikipedia_wiki.onloaded = onloaded;
			wikipedia_wiki.onsuccess = onsuccess;
			wikipedia_wiki.get();
		}
	},
	unlinkBacklinks: function( self ) {
		var form = self.responseXML.getElementById('editform');
		if( ! form ) {
			// we probably just deleted it, as a recursive backlink
			self.onsuccess( self );
			Wikipedia.actionCompleted( self );
			return;
		}
		var text;

		if( self.params.title in twinklebatchdelete.unlinkCache ) {
			text = twinklebatchdelete.unlinkCache[ self.params.title ];
		} else {
			text = form.wpTextbox1.value;
		}
		var old_text = text;
		var wikiPage = new Mediawiki.Page( text );
		wikiPage.removeLink( self.params.page );

		text = wikiPage.getText();
		twinklebatchdelete.unlinkCache[ self.params.title ] = text;
		if( text == old_text ) {
			// Nothing to do, return
			self.onsuccess( self );
			Wikipedia.actionCompleted( self );
			return;
		}
		var postData = {
			'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
			'wpWatchthis': undefined,
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSection': '',
			'wpSummary': 'Removing backlinks to page ' + self.params.page + " that has been deleted because \"" + self.params.reason + "\")" + "; " + TwinkleConfig.deletionSummaryAd,
			'wpTextbox1': text
		};
		self.post( postData );
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinklebatchdelete", twinklebatchdelete );