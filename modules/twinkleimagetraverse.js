/*
 ****************************************
 *** twinkleimagetraverse.js: Image traverse module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("Traverse")
 * Active on:              Categories
 * Config directives in:   TwinkleConfig
 */

Twinkle.imagetraverse = function twinkleimagetraverse() {
	if( userIsInGroup( 'sysop' ) && wgNamespaceNumber == Namespace.CATEGORY ) {
		$(twAddPortletLink("#", "Traverse", "tw-imagetraverse", "Traverse category", "")).click(Twinkle.imagetraverse.callback);
	}
};

Twinkle.imagetraverse.basequery = {
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
Twinkle.imagetraverse.callback = function() {
	var Window = new SimpleWindow( 1200, 650 );
	Window.setTitle( "Image traverse" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#imagetraverse" );

	var form = new QuickForm( Twinkle.imagetraverse.callback.evaluate );
	form.append( {
			type: 'button',
			label: 'Skip',
			event: Twinkle.imagetraverse.callbacks.skip
		} );
	form.append( {
			type: 'button',
			label: 'Delete',
			event: Twinkle.imagetraverse.callbacks.deleteMain
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
	row = root.appendChild( document.createElement( 'tr' ) );
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
	row = root.appendChild( document.createElement( 'tr' ) );
	var ostatus = row.appendChild(  document.createElement( 'td' ) );
	ostatus.style.borderTop = '1px solid gray';
	ostatus.setAttribute( 'colspan', 2 );
	var status = ostatus.appendChild(  document.createElement( 'div' ) );
	ostatus.style.verticalAlign = 'top';
	status.style.height = '180px';
	status.style.overflow = 'auto';
	Wikipedia.actionCompleted.event = function() {}; // just avoid it
	var wikipedia_api = new Wikipedia.api( 'Grabbing images', Twinkle.imagetraverse.basequery, Twinkle.imagetraverse.callbacks.main );
	wikipedia_api.params = { root:root, view:view, histbox:histbox, status:status, Window:Window };
	root.params = wikipedia_api.params;
	wikipedia_api.post();

	Status.init( status );
	Window.setContent( root );
	Window.display();
};

Twinkle.imagetraverse.callback.evaluate = function() {
};

function make_wikilink( page, title, oldid, diff ) {
	var query = {
		'title': page,
		'diff': diff,
		'oldid': oldid
	};
	var url = wgScriptPath + '/index.php?' + QueryString.create( query );
	var a = document.createElement( 'a' );
	a.setAttribute( 'href', url );
	a.setAttribute( 'title', page );
	a.appendChild( document.createTextNode( title ) );
	return a;
}

Twinkle.imagetraverse.callbacks = {
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

		var i, cur, tmp, link;
		for( i = 0; i < pagehistory.snapshotLength; ++i ) {
			cur = pagehistory.snapshotItem(i);
			tmp = entry.cloneNode(false);
			tmp.appendChild( make_wikilink( image, cur.getAttribute( 'timestamp' ), cur.getAttribute( 'revid' ) ) );
			tmp.appendChild( document.createTextNode( ' ' ) );
			tmp.appendChild( make_wikilink( 'User:' + cur.getAttribute( 'user' ), cur.getAttribute( 'user' ) ) );
			tmp.appendChild( document.createTextNode( ' (' + ( new Bytes( cur.getAttribute( 'size' ) ) ).toString() + ') (' ) );
			tmp.appendChild( document.createElement( 'em' ) ).appendChild(document.createTextNode( cur.getAttribute( 'comment' ) ) );
			tmp.appendChild( document.createTextNode( ')' ) );
			pagehistorylist.appendChild( tmp );
		}
		
		for( i = 0; i < filehistory.snapshotLength; ++i ) {
			cur = filehistory.snapshotItem(i);
			tmp = entry.cloneNode(false);
			link = document.createElement( 'a' );
			link.setAttribute( 'href', cur.getAttribute( 'url' ) );
			link.appendChild( document.createTextNode( cur.getAttribute( 'timestamp' ) ) );
			tmp.appendChild( link );
			tmp.appendChild( document.createTextNode( ' ' ) );
			tmp.appendChild( make_wikilink( 'User:' + cur.getAttribute( 'user' ), cur.getAttribute( 'user' ) ) );
			tmp.appendChild( document.createTextNode( ' (' + ( new Bytes( cur.getAttribute( 'size' ) ) ).toString() + ') (' ) );
			tmp.appendChild( document.createElement( 'em' ) ).appendChild(document.createTextNode( cur.getAttribute( 'comment' ) ) );
			tmp.appendChild( document.createTextNode( ')' ) );
			filehistorylist.appendChild( tmp );
		}

		for( i = 0; i < categories.snapshotLength; ++i ) {
			cur = categories.snapshotItem(i);
			tmp = entry.cloneNode(false);
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
			'text': '{{Wikipedia:WikiProject User scripts/Scripts/Twinkle/Template|' + image.replace(/^File:/, '') + '}}',
			'prop': 'text'
		};
		var wikipedia_api = new Wikipedia.api( 'Rendering', query, Twinkle.imagetraverse.callbacks.render1 );
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
		};
		var wikipedia_api = new Wikipedia.api( 'Rendering', query, Twinkle.imagetraverse.callbacks.render2 );
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
		Twinkle.imagetraverse.basequery.gcmcontinue = params.next;
		var wikipedia_api = new Wikipedia.api( 'Grabbing images', Twinkle.imagetraverse.basequery, Twinkle.imagetraverse.callbacks.main );
		wikipedia_api.params = params;
		wikipedia_api.post();
	},
	skip: function( event ) {
		var form = event.target.form;
		var params = form.root.params;
		Twinkle.imagetraverse.callbacks.next( params );
		Status.info( 'Skipped', params.image );
	},
	deleteMain: function( event ) {
		var form = event.target.form;
		var params = form.root.params;
		params.reason = form.reason.value;

		var query;
		if( form.unlink.checked ) {
			query = {
				'action': 'query',
				'list': 'imageusage',
				'titles': params.image,
				'iulimit': 5000,
				'iufilterredir': 'nonredirects'
			};
			var wikipedia_api = new Wikipedia.api( 'Grabbing image links', query, Twinkle.imagetraverse.callbacks.unlinkImageInstancesMain );
			wikipedia_api.params = params;

			wikipedia_api.post();
		}
		var imagepage = new Wikipedia.page( params.image, 'Deleting image');
		imagepage.setEditSummary( "Deleted because \"" + params.reason + "\"." + Twinkle.getPref('deletionSummaryAd'));
		imagepage.setCallbackParameters({'image': params.image});
		imagepage.deletePage();
	},
	unlinkImageInstancesMain: function( self ) {
		var xmlDoc = self.responseXML;
		var instances = [];
		$(xmlDoc).find('imageusage iu').each(function(){
			instances.push($(this).attr('title'));
		});
		if( instances.length === 0 ) {
			return;
		}

		$.each( instances, function(k,title) {
			page = new Wikipedia.page(title, "Unlinking instances on " + title);
			page.setFollowRedirect(true);
			page.setCallbackParameters({'image': self.params.image, 'reason': self.params.reason});
			page.load(Twinkle.imagetraverse.callbacks.unlinkImageInstances);

		});
	},
	unlinkImageInstances: function( self ) {
		var params = self.getCallbackParameters();
		var statelem = self.getStatusElement();

		var image = params.image.replace( /^(?:Image|File):/, '' );
		var old_text = self.getPageText();
		var wikiPage = new Mediawiki.Page( old_text );
		wikiPage.commentOutImage( image , 'Commented out because image was deleted' );
		var text = wikiPage.getText();

		if( text === old_text ) {
			statelem.error( 'failed to unlink image ' + image +' from ' + self.getPageName() );
			return;
		}
		self.setPageText(text);
		self.setEditSummary('Removing instance of file ' + image + " that has been deleted because \"" + params.reason + "\")" + "; " + Twinkle.getPref('deletionSummaryAd'));
		self.setCreateOption('nocreate');
		self.save();
	}
};
