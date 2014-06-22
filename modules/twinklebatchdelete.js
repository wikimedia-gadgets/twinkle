//<nowiki>


(function($){


/*
 ****************************************
 *** twinklebatchdelete.js: Batch delete module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("D-batch")
 * Active on:              Existing and non-existing non-articles, and Special:PrefixIndex
 * Config directives in:   TwinkleConfig
 */


Twinkle.batchdelete = function twinklebatchdelete() {
	if( Morebits.userIsInGroup( 'sysop' ) && (mw.config.get( 'wgNamespaceNumber' ) > 0 || mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Prefixindex') ) {
		Twinkle.addPortletLink( Twinkle.batchdelete.callback, "D-batch", "tw-batch", "Delete pages found in this category/on this page" );
	}
};

Twinkle.batchdelete.unlinkCache = {};
Twinkle.batchdelete.callback = function twinklebatchdeleteCallback() {
	var Window = new Morebits.simpleWindow( 600, 400 );
	Window.setTitle( "Batch deletion" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#batchdelete" );

	var form = new Morebits.quickForm( Twinkle.batchdelete.callback.evaluate );
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
			type: 'input',
			name: 'reason',
			label: 'Reason: ',
			size: 60
		} );

	var query;
	if( mw.config.get( 'wgNamespaceNumber' ) === 14 ) {  // Category:

		query = {
			'action': 'query',
			'generator': 'categorymembers',
			'gcmtitle': mw.config.get( 'wgPageName' ),
			'gcmlimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'prop': [ 'categories', 'revisions' ],
			'rvprop': [ 'size' ]
		};
	} else if( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Prefixindex' ) {

		var gapnamespace, gapprefix;
		if(Morebits.queryString.exists( 'prefix' ) )
		{
			gapnamespace = Morebits.queryString.get( 'namespace' );
			gapprefix = Morebits.string.toUpperCaseFirstChar( Morebits.queryString.get( 'prefix' ) );
		}
		else
		{
			var pathSplit = decodeURIComponent(location.pathname).split('/');
			if (pathSplit.length < 3 || pathSplit[2] !== "Special:PrefixIndex") {
				return;
			}
			var titleSplit = pathSplit[3].split(':');
			gapnamespace = mw.config.get("wgNamespaceIds")[titleSplit[0].toLowerCase()];
			if ( titleSplit.length < 2 || typeof gapnamespace === 'undefined' )
			{
				gapnamespace = 0;  // article namespace
				gapprefix = pathSplit.splice(3).join('/');
			}
			else
			{
				pathSplit = pathSplit.splice(4);
				pathSplit.splice(0,0,titleSplit.splice(1).join(':'));
				gapprefix = pathSplit.join('/');
			}
		}

		query = {
			'action': 'query',
			'generator': 'allpages',
			'gapnamespace': gapnamespace ,
			'gapprefix': gapprefix,
			'gaplimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'prop' : 'revisions|info',
			'inprop': 'protection',
			'rvprop': 'size'
		};
	} else {
		query = {
			'action': 'query',
			'generator': 'links',
			'titles': mw.config.get( 'wgPageName' ),
			'gpllimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'prop': 'revisions|info',
			'inprop': 'protection',
			'rvprop': 'size'
		};
	}

	var statusdiv = document.createElement( 'div' );
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var statelem = new Morebits.status("Grabbing list of pages");
	var wikipedia_api = new Morebits.wiki.api( 'loading...', query, function( apiobj ) {
			var xml = apiobj.responseXML;
			var $pages = $(xml).find('page').filter(':not([missing])');
			var list = [];
			$pages.each(function(index, page) {
				var $page = $(page);
				var title = $page.attr('title');
				var isRedir = $page.attr('redirect') === "";
				var $editprot = $page.find('pr[type="edit"][level="sysop"]');
				var protected = $editprot.length > 0;
				var size = $page.find('rev').attr('size');

				var metadata = [];
				if (isRedir) {
					metadata.push("redirect");
				}
				if (protected) {
					metadata.push("fully protected" + 
						($editprot.attr('expiry') === 'infinity' ? ' indefinitely' : (', expires ' + $editprot.attr('expiry'))));
				}
				metadata.push(size + " bytes");
				list.push({
					label: title + (metadata.length ? (' (' + metadata.join('; ') + ')') : ''),
					value: title,
					checked: true,
					style: (protected ? 'color:red' : '')
				});
			});

			apiobj.params.form.append({ type: 'header', label: 'Pages to delete' });
			apiobj.params.form.append({
					type: 'button',
					label: "Select All",
					event: function(e) {
						$(Morebits.quickForm.getElements(e.target.form, "pages")).prop('checked', true);
					}
				});
			apiobj.params.form.append({
					type: 'button',
					label: "Deselect All",
					event: function(e) {
						$(Morebits.quickForm.getElements(e.target.form, "pages")).prop('checked', false);
					}
				});
			apiobj.params.form.append( {
					type: 'checkbox',
					name: 'pages',
					list: list
				} );
			apiobj.params.form.append( { type:'submit' } );

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent( result );

			Morebits.checkboxShiftClickSupport(Morebits.quickForm.getElements(result, 'pages'));
		}, statelem );

	wikipedia_api.params = { form:form, Window:Window };
	wikipedia_api.post();
};

Twinkle.batchdelete.currentDeleteCounter = 0;
Twinkle.batchdelete.currentUnlinkCounter = 0;
Twinkle.batchdelete.currentdeletor = 0;
Twinkle.batchdelete.callback.evaluate = function twinklebatchdeleteCallbackEvaluate(event) {
	Morebits.wiki.actionCompleted.notice = 'Status';
	Morebits.wiki.actionCompleted.postfix = 'batch deletion is now complete';

	var numProtected = $(Morebits.quickForm.getElements(event.target, 'pages')).filter(function(index, element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm("You are about to delete " + numProtected + " fully protected page(s). Are you sure?")) {
		return;
	}

	var pages = event.target.getChecked( 'pages' );
	var reason = event.target.reason.value;
	var delete_page = event.target.delete_page.checked;
	var unlink_page = event.target.unlink_page.checked;
	var delete_redirects = event.target.delete_redirects.checked;
	if( ! reason ) {
		alert("You need to give a reason, you cabal crony!");
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( event.target );
	if( !pages ) {
		Morebits.status.error( 'Error', 'nothing to delete, aborting' );
		return;
	}

	function toCall( work ) {
		if( work.length === 0 &&  Twinkle.batchdelete.currentDeleteCounter <= 0 && Twinkle.batchdelete.currentUnlinkCounter <= 0 ) {
			window.clearInterval( Twinkle.batchdelete.currentdeletor );
			Morebits.wiki.removeCheckpoint();
			return;
		} else if( work.length !== 0 && ( Twinkle.batchdelete.currentDeleteCounter <= Twinkle.getPref('batchDeleteMinCutOff') || Twinkle.batchdelete.currentUnlinkCounter <= Twinkle.getPref('batchDeleteMinCutOff')  ) ) {
			Twinkle.batchdelete.unlinkCache = []; // Clear the cache
			var pages = work.shift();
			Twinkle.batchdelete.currentDeleteCounter += pages.length;
			Twinkle.batchdelete.currentUnlinkCounter += pages.length;
			for( var i = 0; i < pages.length; ++i ) {
				var page = pages[i];
				var params = { page:page, reason:reason };
				
				var query, wikipedia_api;
				if( unlink_page ) {
					query = {
						'action': 'query',
						'list': 'backlinks',
						'blfilterredir': 'nonredirects',
						'blnamespace': [0, 100], // main space and portal space only
						'bltitle': page,
						'bllimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
					};
					wikipedia_api = new Morebits.wiki.api( 'Grabbing backlinks', query, Twinkle.batchdelete.callbacks.unlinkBacklinksMain );
					wikipedia_api.params = params;
					wikipedia_api.post();
				} else {
					--Twinkle.batchdelete.currentUnlinkCounter;
				}
				if( delete_page ) {
					if (delete_redirects)
					{
						query = {
							'action': 'query',
							'list': 'backlinks',
							'blfilterredir': 'redirects',
							'bltitle': page,
							'bllimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
						};
						wikipedia_api = new Morebits.wiki.api( 'Grabbing redirects', query, Twinkle.batchdelete.callbacks.deleteRedirectsMain );
						wikipedia_api.params = params;
						wikipedia_api.post();
					}

					var wikipedia_page = new Morebits.wiki.page( page, 'Deleting page ' + page );
					wikipedia_page.setEditSummary(reason + Twinkle.getPref('deletionSummaryAd'));
					wikipedia_page.suppressProtectWarning();
					wikipedia_page.deletePage(function( apiobj ) {
							--Twinkle.batchdelete.currentDeleteCounter;
							var link = document.createElement( 'a' );
							link.setAttribute( 'href', mw.util.getUrl(page) );
							link.setAttribute( 'title', page );
							link.appendChild( document.createTextNode( page ) );
							apiobj.statelem.info( [ 'completed (' , link , ')' ] );
						} );
				} else {
					--Twinkle.batchdelete.currentDeleteCounter;
				}
			}
		}
	}
	var work = Morebits.array.chunk( pages, Twinkle.getPref('batchdeleteChunks') );
	Morebits.wiki.addCheckpoint();
	Twinkle.batchdelete.currentdeletor = window.setInterval( toCall, 1000, work );
};

Twinkle.batchdelete.callbacks = {
	deleteRedirectsMain: function( self ) {
		var xmlDoc = self.responseXML;
		var snapshot = xmlDoc.evaluate('//backlinks/bl/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

		var total = snapshot.snapshotLength;

		if( snapshot.snapshotLength === 0 ) {
			return;
		}

		var statusIndicator = new Morebits.status('Deleting redirects for ' + self.params.page, '0%');

		var onsuccess = function( self ) {
			var obj = self.params.obj;
			var total = self.params.total;
			var now = parseInt( 100 * ++(self.params.current)/total, 10 ) + '%';
			obj.update( now );
			self.statelem.unlink();
			if( self.params.current >= total ) {
				obj.info( now + ' (completed)' );
				Morebits.wiki.removeCheckpoint();
			}
		};


		Morebits.wiki.addCheckpoint();
		if( snapshot.snapshotLength === 0 ) {
			statusIndicator.info( '100% (completed)' );
			Morebits.wiki.removeCheckpoint();
			return;
		}

		var params = $.extend({}, self.params);
		params.current = 0;
		params.total = total;
		params.obj = statusIndicator;


		for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
			var title = snapshot.snapshotItem(i).value;
			var wikipedia_page = new Morebits.wiki.page( title, "Deleting " + title );
			wikipedia_page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page "' + self.params.page + '"' + Twinkle.getPref('deletionSummaryAd'));
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.deletePage(onsuccess);
		}
	},
	unlinkBacklinksMain: function( self ) {
		var xmlDoc = self.responseXML;
		var snapshot = xmlDoc.evaluate('//backlinks/bl/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

		if( snapshot.snapshotLength === 0 ) {
			--Twinkle.batchdelete.currentUnlinkCounter;
			return;
		}

		var statusIndicator = new Morebits.status('Unlinking backlinks to ' + self.params.page, '0%');

		var total = snapshot.snapshotLength * 2;

		var onsuccess = function( self ) {
			var obj = self.params.obj;
			var total = self.params.total;
			var now = parseInt( 100 * ++(self.params.current)/total, 10 ) + '%';
			obj.update( now );
			self.statelem.unlink();
			if( self.params.current >= total ) {
				obj.info( now + ' (completed)' );
				--Twinkle.batchdelete.currentUnlinkCounter;
				Morebits.wiki.removeCheckpoint();
			}
		};

		Morebits.wiki.addCheckpoint();
		if( snapshot.snapshotLength === 0 ) {
			statusIndicator.info( '100% (completed)' );
			--Twinkle.batchdelete.currentUnlinkCounter;
			Morebits.wiki.removeCheckpoint();
			return;
		}
		self.params.total = total;
		self.params.obj = statusIndicator;
		self.params.current =   0;

		for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
			var title = snapshot.snapshotItem(i).value;
			var wikipedia_page = new Morebits.wiki.page( title, "Unlinking on " + title );
			var params = $.extend( {}, self.params );
			params.title = title;
			params.onsuccess = onsuccess;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.batchdelete.callbacks.unlinkBacklinks);
		}
	},
	unlinkBacklinks: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		if( ! pageobj.exists() ) {
			// we probably just deleted it, as a recursive backlink
			params.onsuccess( { params: params, statelem: pageobj.getStatusElement() } );
			Morebits.wiki.actionCompleted();
			return;
		}
		var text;

		if( params.title in Twinkle.batchdelete.unlinkCache ) {
			text = Twinkle.batchdelete.unlinkCache[ params.title ];
		} else {
			text = pageobj.getPageText();
		}
		var old_text = text;
		var wikiPage = new Morebits.wikitext.page( text );
		wikiPage.removeLink( params.page );

		text = wikiPage.getText();
		Twinkle.batchdelete.unlinkCache[ params.title ] = text;
		if( text === old_text ) {
			// Nothing to do, return
			params.onsuccess( { params: params, statelem: pageobj.getStatusElement() } );
			Morebits.wiki.actionCompleted();
			return;
		}
		pageobj.setEditSummary('Removing link(s) to deleted page ' + params.page + Twinkle.getPref('deletionSummaryAd'));
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.save(params.onsuccess);
	}
};
})(jQuery);


//</nowiki>
