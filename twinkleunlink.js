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
TwinkleConfig.unlinkNamespaces (array)
In what namespaces unlink should happen, default in 0 and 100
*/
if( typeof( TwinkleConfig.unlinkNamespaces) == 'undefined' ) {
	TwinkleConfig.unlinkNamespaces = [0,100];
}

function getChecked2( nodelist ) {
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

function twinkleunlink() {
	if( wgNamespaceNumber < 0 ) {
		return;
	}
	twAddPortletLink( "javascript:twinkleunlink.callback()", "Unlink", "tw-unlink", "Unlink backlinks", "");
}
window.TwinkleInit = (window.TwinkleInit || []).concat(twinkleunlink); //schedule initializer

twinkleunlink.callback = function twinklesunlinkCallback() {
	var Window = new SimpleWindow( 800, 400 );
	Window.setTitle( "Unlink backlinks" );

	var form = new QuickForm( twinkleunlink.callback.evaluate );
	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason: '
		} );

	if(wgNamespaceNumber == Namespace.IMAGE) {
		var query = {
			'action': 'query',
			'list': [ 'backlinks', 'imageusage' ],
			'bltitle': wgPageName,
			'iutitle': wgPageName,
			'bllimit': userIsInGroup( 'sysop' ) ? 5000 : 500, // 500 is max for normal users, 5000 for bots and sysops
			'iulimit': userIsInGroup( 'sysop' ) ? 5000 : 500, // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': TwinkleConfig.unlinkNamespaces // Main namespace and portal namespace only, keep on talk pages.
		};
	} else {
		var query = {
			'action': 'query',
			'list': 'backlinks',
			'bltitle': wgPageName,
			'blfilterredir': 'nonredirects',
			'bllimit': userIsInGroup( 'sysop' ) ? 5000 : 500, // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': TwinkleConfig.unlinkNamespaces // Main namespace and portal namespace only, keep on talk pages.
		};
	}
	var wikipedia_api = new Wikipedia.api( 'Grabbing backlinks', query, twinkleunlink.callbacks.display.backlinks );
	wikipedia_api.params = { form:form, Window:Window, image: wgNamespaceNumber == Namespace.IMAGE };
	wikipedia_api.post();

	var root = document.createElement( 'div' );
	Status.init( root );
	Window.setContent( root );
	Window.display();
}

twinkleunlink.callback.evaluate = function twinkleunlinkCallbackEvaluate(event) {
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!

	var reason = event.target.reason.value;
	if( event.target.backlinks ) {
		var backlinks = getChecked( event.target.backlinks );
	}
	if( event.target.imageusage ) {
		var imageusage = getChecked( event.target.imageusage );
	}
	Status.init( event.target );

	if( imageusage ) {
		var statusIndicator = new Status('Unlinking instances image', '0%');
		var total = imageusage.length * 2;

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

		if( imageusage.length == 0 ) {
			statusIndicator.info( '100% (completed)' );
			Wikipedia.removeCheckpoint();
			return;
		}
		var params = { reason: reason, obj: statusIndicator, current: 0, total: total };
		for ( var i = 0; i < imageusage.length; ++i ) {
			var title = imageusage[i];
			var query = {
				'title': title,
				'action': 'submit'
			}
			var wikipedia_wiki = new Wikipedia.wiki( "Unlinking on " + title, query, twinkleunlink.callbacks.unlinkImageInstances );
			wikipedia_wiki.params = clone( params );
			wikipedia_wiki.params.title = title;
			wikipedia_wiki.onloading = onloading;
			wikipedia_wiki.onloaded = onloaded;
			wikipedia_wiki.onsuccess = onsuccess;
			wikipedia_wiki.get();
		}
	}

	if( backlinks ) {
		var statusIndicator = new Status('Unlinking instances image', '0%');
		var total = backlinks.length * 2;

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

		if( backlinks.length == 0 ) {
			statusIndicator.info( '100% (completed)' );
			Wikipedia.removeCheckpoint();
			return;
		}
		var params = { reason: reason, obj: statusIndicator, current: 0, total: total };
		for ( var i = 0; i < backlinks.length; ++i ) {
			var title = backlinks[i];
			var query = {
				'title': title,
				'action': 'submit'
			}
			var wikipedia_wiki = new Wikipedia.wiki( "Unlinking on " + title, query, twinkleunlink.callbacks.unlinkBacklinks );
			wikipedia_wiki.params = clone( params );
			wikipedia_wiki.params.title = title;
			wikipedia_wiki.onloading = onloading;
			wikipedia_wiki.onloaded = onloaded;
			wikipedia_wiki.onsuccess = onsuccess;
			wikipedia_wiki.get();
		}
	}
}
twinkleunlink.callbacks = {
	display: {
		backlinks: function( self ) {
			var xmlDoc = self.responseXML;
			if( self.params.image ) {
				var imageusage = xmlDoc.evaluate('//query/imageusage/iu/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
				var list = [];
				for ( var i = 0; i < imageusage.snapshotLength; ++i ) {
					var title = imageusage.snapshotItem(i).value;
					list.push( { label: title, value: title, checked: true } );
				}
				self.params.form.append( { type:'header', label: 'Image usage' } );
				self.params.form.append( {
						type: 'checkbox',
						name: 'imageusage',
						list: list
					}
				);
			}

			var backlinks = xmlDoc.evaluate('//query/backlinks/bl/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			if( backlinks.snapshotLength > 0 ) {
				var list = [];
				for ( var i = 0; i < backlinks.snapshotLength; ++i ) {
					var title = backlinks.snapshotItem(i).value;
					list.push( { label: title, value: title, checked: true } );
				}
				self.params.form.append( { type:'header', label: 'Backlinks' } );
				self.params.form.append( {
						type: 'checkbox',
						name: 'backlinks',
						list: list
					}
				);
			}

			self.params.form.append( { type:'submit' } );

			var result = self.params.form.render();
			self.params.Window.setContent( result );
		}
	},
	unlinkBacklinks: function( self ) {
		var form = self.responseXML.getElementById('editform');
		var text = form.wpTextbox1.value;
		var old_text = text;
		var wikiPage = new Mediawiki.Page( text );
		wikiPage.removeLink( wgPageName );

		text = wikiPage.getText();
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
			'wpSummary': 'Removing backlinks to ' + wgTitle + " because \"" + self.params.reason.toUpperCaseFirstChar() + "\";" + TwinkleConfig.deletionSummaryAd,
			'wpTextbox1': text
		};
		self.post( postData );
	},
	unlinkImageInstances: function( self ) {
		var form = self.responseXML.getElementById('editform');
		var text = form.wpTextbox1.value;
		var old_text = text;
		var wikiPage = new Mediawiki.Page( text );
		wikiPage.commentOutImage( wgTitle, 'Commented out' );

		text = wikiPage.getText();
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
			'wpSummary': 'Removing instances of image ' + wgTitle + " because \"" + self.params.reason.toUpperCaseFirstChar() + "\";" + TwinkleConfig.deletionSummaryAd,
			'wpTextbox1': text
		};
		self.post( postData );
	}
}