/*
 ****************************************
 *** twinkleimagetraverse.js: Image traverse module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("Traverse")
 * Active on:              Categories
 * Config directives in:   TwinkleConfig
 */

function twinkleimagetraverse() {
	if( userIsInGroup( 'sysop' ) && wgNamespaceNumber == Namespace.CATEGORY ) {
		twAddPortletLink( "javascript:twinkleimagetraverse.callback()", "Traverse", "tw-imagetraverse", "Traverse category", "");
	}
}

twinkleimagetraverse.basequery = {
	'action': 'query',
	'generator': 'categorymembers',
	'gcmtitle': wgPageName,
	'gcmnamespace': Namespace.IMAGE,
	'gcmlimit' : 1, 
	'prop': [ 'imageinfo', 'categories', 'revisions' ],
	'rvlimit': 20,
	'iihistory': true,
	'rvprop': [ 'user', 'size', 'flags', 'ids', 'comment', 'timestamp' ],
	'iiprop': [ 'timestamp', 'user', 'url', 'size', 'comment' ]
};
twinkleimagetraverse.callback = function() {
	var Window = new SimpleWindow( 1200, 650 );
	Window.setTitle( "Image traverse" );
	var form = new QuickForm( twinkleimagetraverse.callback.evaluate );
	form.append( {
			type: 'button',
			label: 'Skip',
			event: twinkleimagetraverse.callbacks.skip
		} );
	form.append( {
			type: 'button',
			label: 'Delete',
			event: twinkleimagetraverse.callbacks.deleteMain
		} );
	form.append( {
			type: 'input',
			label: 'Reason',
			name: 'reason',
			value: 'Speedy deleted',
			size: 80
		} );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Remove image instances to the image',
					name: 'unlink',
					value: 'unlink',
					checked: true
				}
			]
		} );
	var root = document.createElement( 'table' );

	root.style.background = 'transparent';
	root.style.height = '780px';
	var row = root.appendChild( document.createElement( 'tr' ) );
	var options = row.appendChild(  document.createElement( 'td' ) );
	options.setAttribute( 'colspan', 2 );
	var rendered = form.render();
	options.appendChild( rendered );

	rendered.root = root;

	
	options.style.borderBottom = '1px solid gray';
	options.style.height = '80px';
	var row = root.appendChild( document.createElement( 'tr' ) );
	var oview = row.appendChild(  document.createElement( 'td' ) );
	var ohistbox = row.appendChild(  document.createElement( 'td' ) );
	ohistbox.style.width = '250px';
	ohistbox.style.verticalAlign = 'top';
	var histbox = ohistbox.appendChild(  document.createElement( 'div' ) );
	histbox.style.overflow = 'auto';
	histbox.style.height = '500px';
	oview.style.verticalAlign = 'top';
	var view = oview.appendChild(  document.createElement( 'div' ) );
	view.style.height = '500px';
	view.style.overflow = 'auto';
	var row = root.appendChild( document.createElement( 'tr' ) );
	var ostatus = row.appendChild(  document.createElement( 'td' ) );
	ostatus.style.borderTop = '1px solid gray';
	ostatus.setAttribute( 'colspan', 2 );
	var status = ostatus.appendChild(  document.createElement( 'div' ) );
	ostatus.style.verticalAlign = 'top';
	status.style.height = '180px';
	status.style.overflow = 'auto';
	Wikipedia.actionCompleted.event = function() {} // just avoid it
	var wikipedia_api = new Wikipedia.api( 'Grabbing images', twinkleimagetraverse.basequery, twinkleimagetraverse.callbacks.main );
	wikipedia_api.params = { root:root, view:view, histbox:histbox, status:status, Window:Window };
	root.params = wikipedia_api.params;
	wikipedia_api.post();

	Status.init( status );
	Window.setContent( root );
	Window.display();
}

twinkleimagetraverse.callback.evaluate = function() {
}

function make_wikilink( page, title, oldid, diff ) {
	var query = {
		'title': page,
		'diff': diff,
		'oldid': oldid
	}
	var url = wgScriptPath + '/index.php?' + QueryString.create( query );
	var a = document.createElement( 'a' );
	a.setAttribute( 'href', url );
	a.setAttribute( 'title', page );
	a.appendChild( document.createTextNode( title ) );
	return a;
}

twinkleimagetraverse.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;

		var image = xmlDoc.evaluate( '//pages/page/@title', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;

		if( !image ) {
			alert( 'no more images' );
			return;
		}
		var next = xmlDoc.evaluate( '//query-continue/categorymembers/@gcmcontinue', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
		var pagehistory = xmlDoc.evaluate( '//pages/page/revisions/rev', xmlDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		var filehistory = xmlDoc.evaluate( '//pages/page/imageinfo/ii', xmlDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		var categories = xmlDoc.evaluate( '//pages/page/categories/cl', xmlDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

		var pagehistorylist = document.createElement( 'ul' );
		var filehistorylist = document.createElement( 'ul' );
		var categorylist = document.createElement( 'ul' );

		var entry = document.createElement( 'li' );

		for( var i = 0; i < pagehistory.snapshotLength; ++i ) {
			var cur = pagehistory.snapshotItem(i);
			var tmp = entry.cloneNode(false);
			tmp.appendChild( make_wikilink( image, cur.getAttribute( 'timestamp' ), cur.getAttribute( 'revid' ) ) );
			tmp.appendChild( document.createTextNode( ' ' ) );
			tmp.appendChild( make_wikilink( 'User:' + cur.getAttribute( 'user' ), cur.getAttribute( 'user' ) ) );
			tmp.appendChild( document.createTextNode( ' \(' + ( new Bytes( cur.getAttribute( 'size' ) ) ).toString() + '\) \(' ) );
			tmp.appendChild( document.createElement( 'em' ) ).appendChild(document.createTextNode( cur.getAttribute( 'comment' ) ) );
			tmp.appendChild( document.createTextNode( '\)' ) );
			pagehistorylist.appendChild( tmp );
		}
		
		for( var i = 0; i < filehistory.snapshotLength; ++i ) {
			var cur = filehistory.snapshotItem(i);
			var tmp = entry.cloneNode(false);
			var link = document.createElement( 'a' );
			link.setAttribute( 'href', cur.getAttribute( 'url' ) );
			link.appendChild( document.createTextNode( cur.getAttribute( 'timestamp' ) ) );
			tmp.appendChild( link );
			tmp.appendChild( document.createTextNode( ' ' ) );
			tmp.appendChild( make_wikilink( 'User:' + cur.getAttribute( 'user' ), cur.getAttribute( 'user' ) ) );
			tmp.appendChild( document.createTextNode( ' \(' + ( new Bytes( cur.getAttribute( 'size' ) ) ).toString() + '\) \(' ) );
			tmp.appendChild( document.createElement( 'em' ) ).appendChild(document.createTextNode( cur.getAttribute( 'comment' ) ) );
			tmp.appendChild( document.createTextNode( '\)' ) );
			filehistorylist.appendChild( tmp );
		}

		for( var i = 0; i < categories.snapshotLength; ++i ) {
			var cur = categories.snapshotItem(i);
			var tmp = entry.cloneNode(false);
			tmp.appendChild( make_wikilink( cur.getAttribute( 'title' ), cur.getAttribute( 'title' ).replace( /Category:/, '' ) ) );
			categorylist.appendChild( tmp );
		}
		self.params.next = next;
		self.params.image = image;
		var hist = self.params.histbox;
		while( hist.hasChildNodes() ) {
			hist.removeChild( hist.lastChild );
		}
		hist.appendChild( document.createElement( 'h2' ) ).appendChild( document.createTextNode( 'Image usage' ) );
		var placeholder = hist.appendChild( document.createElement( 'div' ));
		placeholder.appendChild( document.createTextNode( 'Grabbing data...' ) );
		self.params.imageusageplaceholder = placeholder;
		hist.appendChild( document.createElement( 'h2' ) ).appendChild( document.createTextNode( 'Page history' ) );
		hist.appendChild( pagehistorylist );
		hist.appendChild( document.createElement( 'h2' ) ).appendChild( document.createTextNode( 'File history' ) );
		hist.appendChild( filehistorylist );
		hist.appendChild( document.createElement( 'h2' ) ).appendChild( document.createTextNode( 'Categories' ) );
		hist.appendChild( categorylist );

		var query = {
			'action': 'parse',
			'title': image,
			'text': '\{\{Wikipedia:WikiProject User scripts/Scripts/Twinkle/Template|' + image.replace(/^File:/, '') + '\}\}',
			'prop': 'text'
		}
		var wikipedia_api = new Wikipedia.api( 'Rendering', query, twinkleimagetraverse.callbacks.render1 );
		wikipedia_api.params = self.params;
		wikipedia_api.post();
	},
	render1: function( self ) {
		var xmlDoc = self.responseXML;
		var html = xmlDoc.evaluate( '//parse/text', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
		self.params.view.innerHTML = html; // gah!

		// add instance usage
		var query = {
			'action': 'query',
			'list': 'imageusage',
			'iutitle': self.params.image,
			'iulimit': 20,
			'iufilterredir': 'nonredirects'
		}
		var wikipedia_api = new Wikipedia.api( 'Rendering', query, twinkleimagetraverse.callbacks.render2 );
		wikipedia_api.params = self.params;
		wikipedia_api.post();
	},
	render2: function( self ) {
		var xmlDoc = self.responseXML;
		var usage = xmlDoc.evaluate( '//imageusage/iu', xmlDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

		var usagelist = document.createElement( 'ul' );

		var entry = document.createElement( 'li' );

		for( var i = 0; i < usage.snapshotLength; ++i ) {
			var cur = usage.snapshotItem(i);
			var tmp = entry.cloneNode(false);
			tmp.appendChild( make_wikilink( cur.getAttribute( 'title' ), cur.getAttribute( 'title' ) ) );
			usagelist.appendChild( tmp );
		}
		var hist = self.params.histbox;
		hist.replaceChild( usagelist, self.params.imageusageplaceholder );

	},
	next: function( params ) {
		twinkleimagetraverse.basequery['gcmcontinue'] = params.next;
		var wikipedia_api = new Wikipedia.api( 'Grabbing images', twinkleimagetraverse.basequery, twinkleimagetraverse.callbacks.main );
		wikipedia_api.params = params;
		wikipedia_api.post();
	},
	skip: function( event ) {
		var form = event.target.form;
		var params = form.root.params;
		twinkleimagetraverse.callbacks.next( params );
		Status.info( 'Skipped', params.image );
	},
	deleteMain: function( event ) {
		var form = event.target.form;
		var params = form.root.params;
		params.reason = form.reason.value;

		if( form.unlink.checked ) {
			var query = {
				'action': 'query',
				'list': 'imageusage',
				'titles': params.image,
				'iulimit': 5000,
				'iufilterredir': 'nonredirects'
			};
			var wikipedia_api = new Wikipedia.api( 'Grabbing image links', query, twinkleimagetraverse.callbacks.unlinkImageInstancesMain );
			wikipedia_api.params = params;

			wikipedia_api.post();
		}
		var query = { 
			'title': params.image, 
			'action': 'delete'
		};
		var wikipedia_wiki = new Wikipedia.wiki( 'Deleting image ' + params.image, query, twinkleimagetraverse.callbacks.deleteImage, function( self ) {
				twinkleimagetraverse.callbacks.next( self.params );
				self.statelem.unlink();
				Status.info( 'Deleted', self.params.image );

			});
		wikipedia_wiki.params = params;
		wikipedia_wiki.followRedirect = false;
		wikipedia_wiki.get();	
	},
	deleteImage: function( self ) {
		var form = this.responseXML.getElementById( 'deleteconfirm' );
		if( ! form ) { // Hell, image deletion is b0rked :(
			form = this.responseXML.getElementsByTagName( 'form' )[0];
			var postData = {
				'wpDeleteReasonList': 'other',
				'wpReason': "Deleted because \"" + self.params.reason + "\"." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
			self.post( postData );
		} else {

			var postData = {
				'wpWatch': form.wpWatch.checked ? '' : undefined,
				'wpDeleteReasonList': 'other',
				'wpReason': "Deleted because \"" + self.params.reason + "\"." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
			self.post( postData );
		}
	},
	unlinkImageInstancesMain: function( self ) {
		var xmlDoc = self.responseXML;
		var snapshot = xmlDoc.evaluate('//imageusage/iu/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

		if( snapshot.snapshotLength == 0 ) {
			return;
		}

		var statusIndicator = new Status('Unlinking instances image', '0%');

		var total = snapshot.snapshotLength * 2;

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
		self.params.total = total;
		self.params.obj = statusIndicator;
		self.params.current =   0;

		for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
			var title = snapshot.snapshotItem(i).value;
			var query = {
				'title': title,
				'action': 'submit'
			}
			var wikipedia_wiki = new Wikipedia.wiki( "Unlinking on " + title, query, twinkleimagetraverse.callbacks.unlinkImageInstances );
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
		var image = self.params.image.replace( /^File:/, '' );
		var form = self.responseXML.getElementById('editform');
		var text;

		if( self.params.title in twinkledeli.unlinkCache ) {
			text = twinkledeli.unlinkCache[ self.params.title ];
		} else {
			text = form.wpTextbox1.value;
		}
		var old_text = text;
		var wikiPage = new Mediawiki.Page( text );
		wikiPage.commentOutImage( image , 'Commented out because image was deleted' );

		text = wikiPage.getText();
		twinkledeli.unlinkCache[ self.params.title ] = text;
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
			'wpSummary': 'Removing instance of image ' + image + " that has been deleted because \"" + self.params.reason + "\")" + "; " + TwinkleConfig.deletionSummaryAd,
			'wpTextbox1': text
		};
		self.post( postData );
	}
}
