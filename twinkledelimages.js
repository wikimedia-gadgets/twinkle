/*
 ****************************************
 *** twinkledelimages.js: Batch deletion of images (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("Deli-batch")
 * Active on:              Existing non-special pages
 * Config directives in:   TwinkleConfig
 */

Twinkle.delimages = function twinkledeli() {
	if( wgNamespaceNumber < 0 || wgCurRevisionId === false ) {
		return;
	}
	if( userIsInGroup( 'sysop' ) ) {
		twAddPortletLink( "javascript:Twinkle.delimages.callback()", "Deli-batch", "tw-deli", "Delete file found on page", "");
	}
}

Twinkle.delimages.unlinkCache = {};
Twinkle.delimages.callback = function twinkledeliCallback() {
	var Window = new SimpleWindow( 800, 400 );
	Window.setTitle( "Batch file deletion" );

	var form = new QuickForm( Twinkle.delimages.callback.evaluate );
	form.append( {
			type: 'checkbox',
			list: [
				{ 
					label: 'Delete files',
					name: 'delete_image',
					value: 'delete',
					checked: true
				},
				{
					label: 'Unlink uses of this file',
					name: 'unlink_image',
					value: 'unlink',
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
			'gcmnamespace': Namespace.IMAGE,
			'gcmlimit' : Twinkle.getPref('deliMax'), 
			'prop': [ 'imageinfo', 'categories', 'revisions' ],
			'grvlimit': 1,
			'grvprop': [ 'user' ]
		};
	} else {
		var query = {
			'action': 'query',
			'generator': 'images',
			'titles': wgPageName,
			'prop': [ 'imageinfo', 'categories', 'revisions' ],
			'gimlimit': 'max',
		};
	}
	var wikipedia_api = new Wikipedia.api( 'Grabbing files', query, function( self ) {
			var xmlDoc = self.responseXML;
			var snapshot = xmlDoc.evaluate('//page[@imagerepository="local"]', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			var list = [];
			for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
				var object = snapshot.snapshotItem(i);
				var image = xmlDoc.evaluate( '@title', object, null, XPathResult.STRING_TYPE, null ).stringValue;
				var user = xmlDoc.evaluate( 'imageinfo/ii/@user', object, null, XPathResult.STRING_TYPE, null ).stringValue;
				var last_edit = xmlDoc.evaluate( 'revisions/rev/@user', object, null, XPathResult.STRING_TYPE, null ).stringValue;

				var disputed = xmlDoc.evaluate( 'boolean(categories/cl[@title="Category:Contested candidates for speedy deletion"])', object, null, XPathResult.BOOLEAN_TYPE, null ).booleanValue || user == last_edit;
				list.push( {label:(i+1) + ": " + image + ' (' + user + ')[' + last_edit + ']' + ( disputed ? ' DISPUTED' : '' ), value:image, checked:!disputed });
			}
			self.params.form.append( {
					type: 'checkbox',
					name: 'images',
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

Twinkle.delimages.currentDeleteCounter = 0;
Twinkle.delimages.currentUnlinkCounter = 0;
Twinkle.delimages.currentdeletor = 0;
Twinkle.delimages.callback.evaluate = function twinkledeliCallbackEvaluate(event) {
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!
	var images = event.target.getChecked( 'images' );
	var reason = event.target.reason.value;
	var delete_image = event.target.delete_image.checked;
	var unlink_image = event.target.unlink_image.checked;
	if( ! reason ) {
		return;
	}
	Status.init( event.target );
	function toCall( work ) {
		if( work.length == 0 && Twinkle.delimages.currentDeleteCounter <= 0 && Twinkle.delimages.currentUnlinkCounter <= 0 ) {
			Status.info( 'work done' );
			window.clearInterval( Twinkle.delimages.currentdeletor );
			Wikipedia.removeCheckpoint();
			return;
		} else if( Twinkle.delimages.currentDeleteCounter <= 0 && Twinkle.delimages.currentUnlinkCounter <= 0 ) {
			Twinkle.delimages.unlinkCache = []; // Clear the cache
			var images = work.shift();
			Twinkle.delimages.currentDeleteCounter = images.length; // can be less than the number of elements in deliChunks
			for( var i = 0; i < images.length; ++i ) {
				var image = images[i];
				var query = {
					'action': 'query',
					'titles': image
				}
				var wikipedia_api = new Wikipedia.api( 'Checking if file ' + image + ' exists', query, Twinkle.delimages.callbacks.main );
				wikipedia_api.params = { image:image, reason:reason, unlink_image:unlink_image, delete_image:delete_image };
				wikipedia_api.post();
			}
		}
	}
	var work = images.chunk( Twinkle.getPref('deliChunks') );
	Wikipedia.addCheckpoint();
	Twinkle.delimages.currentdeletor = window.setInterval( toCall, 1000, work );
}
Twinkle.delimages.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;
		var normal = xmlDoc.evaluate( '//normalized/n/@to', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
		if( normal ) {
			self.params.image = normal;
		}
		var exists = xmlDoc.evaluate( 'boolean(//pages/page[@title="' + self.params.image.replace( /"/g, '\\"') + '" and not(@missing)])', xmlDoc, null, XPathResult.BOOLEAN_TYPE, null ).booleanValue;

		if( ! exists ) {
			self.statelem.error( "It seems that the page doesn't exists, perhaps it has already been deleted" );
			return;
		}
		if( self.params.unlink_image ) {
			var query = {
				'action': 'query',
				'list': 'imageusage',
				'titles': self.params.image,
				'iulimit': userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
			};
			var wikipedia_api = new Wikipedia.api( 'Grabbing file links', query, Twinkle.delimages.callbacks.unlinkImageInstancesMain );
			wikipedia_api.params = self.params;
			wikipedia_api.post();
		}
		if( self.params.delete_image ) {
			var query = { 
				'title': self.params.image, 
				'action': 'delete'
			};
			var wikipedia_wiki = new Wikipedia.wiki( 'Deleting file ' + self.params.image, query, Twinkle.delimages.callbacks.deleteImage, function( self ) { 
					--Twinkle.delimages.currentDeleteCounter;
					var link = document.createElement( 'a' );
					link.setAttribute( 'href', wgArticlePath.replace( '$1', self.query['title'] ) );
					link.setAttribute( 'title', self.query['title'] );
					link.appendChild( document.createTextNode( self.query['title'] ) );
					self.statelem.info( [ 'completed (' , link , ')' ] );

				} );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = false;
			wikipedia_wiki.get();		
		}
	},
	deleteImage: function( self ) {
		var form = this.responseXML.getElementById( 'deleteconfirm' );
		if( ! form ) { // Hell, file deletion is b0rked :(
			form = this.responseXML.getElementsByTagName( 'form' )[0];
			var postData = {
				'wpDeleteReasonList': 'other',
				'wpReason': "Deleted because \"" + self.params.reason + "\"." + Twinkle.getPref('deletionSummaryAd'),
				'wpEditToken': form.wpEditToken.value
			}
			self.post( postData );
		} else {

			var postData = {
				'wpWatch': form.wpWatch.checked ? '' : undefined,
				'wpDeleteReasonList': 'other',
				'wpReason': "Deleted because \"" + self.params.reason + "\"." + Twinkle.getPref('deletionSummaryAd'),
				'wpEditToken': form.wpEditToken.value
			}
			self.post( postData );
		}
	},
	unlinkImageInstancesMain: function( self ) {
		var xmlDoc = self.responseXML;
		var snapshot = xmlDoc.evaluate('//imageusage/iu/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

		if( snapshot.snapshotLength == 0 ) {
			--twinklebatchdelete.currentUnlinkCounter;
			return;
		}

		var statusIndicator = new Status('Unlinking file instances ', '0%');

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
			var wikipedia_wiki = new Wikipedia.wiki( "Unlinking on " + title, query, Twinkle.delimages.callbacks.unlinkImageInstances );
			var params = clone( self.params );
			params.title = title;

			wikipedia_wiki.params = params;
			wikipedia_wiki.onloading = onloading;
			wikipedia_wiki.onloaded = onloaded;
			wikipedia_wiki.onsuccess = onsuccess;
			wikipedia_wiki.get();
		}
	},
	unlinkImageInstances: function( self ) {
		var image = self.params.image.replace( /^(?:Image|File):/, '' );
		var form = self.responseXML.getElementById('editform');
		var text;

		if( self.params.title in Twinkle.delimages.unlinkCache ) {
			text = Twinkle.delimages.unlinkCache[ self.params.title ];
		} else {
			text = form.wpTextbox1.value;
		}
		var old_text = text;
		var wikiPage = new Mediawiki.Page( text );
		wikiPage.commentOutImage( image , 'Commented out because image was deleted' );

		text = wikiPage.getText();
		Twinkle.delimages.unlinkCache[ self.params.title ] = text;
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
			'wpSummary': 'Removing instance of file ' + image + " that has been deleted because \"" + self.params.reason + "\")" + "; " + Twinkle.getPref('deletionSummaryAd'),
			'wpTextbox1': text
		};
		self.post( postData );
	}
}
