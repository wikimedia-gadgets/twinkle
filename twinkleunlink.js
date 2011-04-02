function twinkleunlink() {
	if( wgNamespaceNumber < 0 ) {
		return;
	}
	twAddPortletLink( "javascript:twinkleunlink.callback()", "Unlink", "tw-unlink", "Unlink backlinks", "");

	/**
	TwinkleConfig.unlinkNamespaces (array)
	In what namespaces unlink should happen, default in 0 (article) and 100 (portal)
	*/
	if( typeof( TwinkleConfig.unlinkNamespaces) == 'undefined' ) {
		TwinkleConfig.unlinkNamespaces = [0,100];
	}
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
	wikipedia_api.params = { form: form, Window: Window, image: wgNamespaceNumber == Namespace.IMAGE };
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
		var total = pages.length;  // removing doubling of this number - no apparent reason for it

		Wikipedia.addCheckpoint();

		if( pages.length == 0 ) {
			statusIndicator.info( '100% (completed)' );
			Wikipedia.removeCheckpoint();
			return;
		}

		// get an edit token
		var params = { reason: reason, imageusage: imageusage, globalstatus: statusIndicator, current: 0, total: total };
		for (var i = 0; i < pages.length; ++i)
		{
			var myparams = clone(params);
			var articlepage = new Wikipedia.page(pages[i], 'Unlinking in article "' + pages[i] + '"');
			articlepage.setCallbackParameters(myparams);
			articlepage.load(imageusage ? twinkleunlink.callbacks.unlinkImageInstances : twinkleunlink.callbacks.unlinkBacklinks);
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
		backlinks: function twinkleunlinkCallbackDisplayBacklinks(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var havecontent = false;

			if( apiobj.params.image ) {
				var imageusage = xmlDoc.evaluate('//query/imageusage/iu/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
				var list = [];
				for ( var i = 0; i < imageusage.snapshotLength; ++i ) {
					var title = imageusage.snapshotItem(i).value;
					list.push( { label: title, value: title, checked: true } );
				}
				if (list.length == 0)
				{
					apiobj.params.form.append( { type: 'header', label: 'No instances of image usage found.' } );
				}
				else
				{
					apiobj.params.form.append( { type:'header', label: 'Image usage' } );
					apiobj.params.form.append( {
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
				apiobj.params.form.append( { type:'header', label: 'Backlinks' } );
				apiobj.params.form.append( {
					type: 'checkbox',
					name: 'backlinks',
					list: list
				});
				havecontent = true;
			}
			else
			{
				apiobj.params.form.append( { type: 'header', label: 'No backlinks found.' } );
			}

			if (havecontent) apiobj.params.form.append( { type:'submit' } );

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent( result );
		}
	},
	unlinkBacklinks: function twinkleunlinkCallbackUnlinkBacklinks(pageobj) {
		var text, oldtext;
		text = oldtext = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var wikiPage = new Mediawiki.Page(text);
		wikiPage.removeLink(wgPageName);
		text = wikiPage.getText();
		if (text == oldtext) {
			// Nothing to do, return
			twinkleunlink.callbacks.success(pageobj);
			Wikipedia.actionCompleted();
			return;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary("Removing link(s) to \"" + wgPageName + "\": " + params.reason + "." + TwinkleConfig.summaryAd);
		pageobj.setCreateOption('nocreate');
		pageobj.save(twinkleunlink.callbacks.success);
	},
	unlinkImageInstances: function twinkleunlinkCallbackUnlinkImageInstances(pageobj) {
		var text, oldtext;
		text = oldtext = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var wikiPage = new Mediawiki.Page(text);
		wikiPage.commentOutImage(wgTitle, 'Commented out');
		text = wikiPage.getText();
		if (text == oldtext) {
			// Nothing to do, return
			twinkleunlink.callbacks.success(pageobj);
			Wikipedia.actionCompleted();
			return;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary("Commenting out use(s) of image \"" + wgPageName + "\": " + params.reason + "." + TwinkleConfig.summaryAd);
		pageobj.setCreateOption('nocreate');
		pageobj.save(twinkleunlink.callbacks.success);
	},
	success: function twinkleunlinkCallbackSuccess(pageobj) {
		var statelem = pageobj.getStatusElement();
		statelem.info('done');

		var params = pageobj.getCallbackParameters();
		var total = params.total;
		var now = parseInt( 100 * (params.imageusage ? ++(twinkleunlink.imageusagedone) : ++(twinkleunlink.backlinksdone))/total ) + '%';
		params.globalstatus.update( now );
		if((params.imageusage ? twinkleunlink.imageusagedone : twinkleunlink.backlinksdone) >= total) {
			params.globalstatus.info( now + ' (completed)' );
			Wikipedia.removeCheckpoint();
		}
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinkleunlink", twinkleunlink );