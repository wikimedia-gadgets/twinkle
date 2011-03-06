// If TwinkleConfig aint exist.
if( typeof( TwinkleConfig ) == 'undefined' ) {
	TwinkleConfig = {};
}

/**
TwinkleConfig.summaryAd (string)
If ad should be added or not to summary, default "([[WP:TW|TW]])"
*/
if( typeof( TwinkleConfig.summaryAd ) == 'undefined' ) {
	TwinkleConfig.summaryAd = "([[WP:TW|TW]])";
}

/**
TwinkleConfig.unlinkNamespaces (array)
In what namespaces unlink should happen, default in 0 (article) and 100 (portal)
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

twinkleunlink.callback = function twinkleunlinkCallback() {
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

	twinkleunlink.backlinksdone = 0;
	twinkleunlink.imageusagedone = 0;

	function processunlink(pages, imageusage) {
		var statusIndicator = new Status((imageusage ? 'Unlinking instances of image usage' : 'Unlinking instances'), '0%');
		var total = pages.length; // removing doubling of this number - no apparent reason for it

		Wikipedia.addCheckpoint();

		if( pages.length == 0 ) {
			statusIndicator.info( '100% (completed)' );
			Wikipedia.removeCheckpoint();
			return;
		}

		// get an edit token
		var params = { reason: reason, globalstatus: statusIndicator, current: 0, total: total };
		for (var i = 0; i < pages.length; ++i)
		{
			var myparams = clone(params);
			Wikipedia.page.edit('Unlinking in article "' + pages[i] + '"', pages[i], myparams,
				(imageusage ? twinkleunlink.callbacks.unlinkImageInstances : twinkleunlink.callbacks.unlinkBacklinks),
				twinkleunlink.callbacks.success);
		}
	}

	var reason = event.target.reason.value;
	if( event.target.backlinks ) {
		var backlinks = getChecked(event.target.backlinks);
	}
	if( event.target.imageusage ) {
		var imageusage = getChecked(event.target.imageusage);
	}
	Status.init( event.target );
	if (backlinks) processunlink(backlinks, false);
	if (imageusage) processunlink(imageusage, true);
}

twinkleunlink.backlinksdone = 0;
twinkleunlink.imageusagedone = 0;

twinkleunlink.callbacks = {
	display: {
		backlinks: function twinkleunlinkCallbackDisplayBacklinks( self ) {
			var xmlDoc = self.responseXML;
			var havecontent = false;

			if( self.params.image ) {
				var imageusage = xmlDoc.evaluate('//query/imageusage/iu/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
				var list = [];
				for ( var i = 0; i < imageusage.snapshotLength; ++i ) {
					var title = imageusage.snapshotItem(i).value;
					list.push( { label: title, value: title, checked: true } );
				}
				if (list.length == 0)
				{
					self.params.form.append( { type: 'header', label: 'No instances of image usage found.' } );
				}
				else
				{
					self.params.form.append( { type:'header', label: 'Image usage' } );
					self.params.form.append( {
						type: 'checkbox',
						name: 'imageusage',
						list: list
					} );
					havecontent = true;
				}
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
				});
				havecontent = true;
			}
			else
			{
				self.params.form.append( { type: 'header', label: 'No backlinks found.' } );
			}

			if (havecontent) self.params.form.append( { type:'submit' } );

			var result = self.params.form.render();
			self.params.Window.setContent( result );
		}
	},
	unlinkBacklinks: function twinkleunlinkCallbackUnlinkBacklinks(self) {
		var text, oldtext;
		text = oldtext = self.pagetext;

		var wikiPage = new Mediawiki.Page(text);
		wikiPage.removeLink(wgPageName);
		text = wikiPage.getText();
		if (text == oldtext) {
			// Nothing to do, return
			twinkleunlink.callbacks.success(self);
			Wikipedia.actionCompleted(self);
			return;
		}

		self.params.imageusage = false;
		var query = {
			'text': text,
			'summary': 'Removing backlinks to ' + wgTitle + " because \"" + self.params.reason.toUpperCaseFirstChar() + "\". " + TwinkleConfig.summaryAd,
			'nocreate': '',  // don't recreate a deleted page
			'watchlist': 'nochange'  // if already watchlisted, leave it, but don't add page to watchlist
		};
		return query;
	},
	unlinkImageInstances: function twinkleunlinkCallbackUnlinkImageInstances( self ) {
		var text, oldtext;
		text = oldtext = self.pagetext;

		var wikiPage = new Mediawiki.Page(text);
		wikiPage.commentOutImage(wgTitle, 'Commented out');
		text = wikiPage.getText();
		if (text == oldtext) {
			// Nothing to do, return
			twinkleunlink.callbacks.success(self);
			Wikipedia.actionCompleted(self);
			return;
		}

		self.params.imageusage = true;
		var query = {
			'text': text,
			'summary': 'Removing instances of image ' + wgTitle + " because \"" + self.params.reason.toUpperCaseFirstChar() + "\". " + TwinkleConfig.summaryAd,
			'nocreate': '',  // don't recreate a deleted page
			'watchlist': 'nochange'  // if already watchlisted, leave it, but don't add page to watchlist
		};
		return query;
	},
	success: function twinkleunlinkCallbackSuccess( self ) {
		var total = self.params.total;
		var now = parseInt( 100 * (self.params.imageusage ? ++(twinkleunlink.imageusagedone) : ++(twinkleunlink.backlinksdone))/total ) + '%';
		self.params.globalstatus.update( now );
		if((self.params.imageusage ? twinkleunlink.imageusagedone : twinkleunlink.backlinksdone) >= total) {
			self.params.globalstatus.info( now + ' (completed)' );
			Wikipedia.removeCheckpoint();
		}
	}
}