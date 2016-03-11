//<nowiki>


(function($){


/*
 ****************************************
 *** twinklebatchdelete.js: Batch delete module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("D-batch")
 * Active on:              Existing non-articles, and Special:PrefixIndex
 * Config directives in:   TwinkleConfig
 */

Twinkle.batchdelete = function twinklebatchdelete() {
	if(
		Morebits.userIsInGroup( 'sysop' ) && (
			( mw.config.get( 'wgCurRevisionId' ) && mw.config.get( 'wgNamespaceNumber' ) > 0 ) ||
			mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Prefixindex'
		)
	) {
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
					checked: true,
					subgroup: {
						type: 'checkbox',
						list: [
							{
								label: 'Delete associated talk pages (except user talk pages)',
								name: 'delete_talk',
								value: 'delete_talk',
								checked: true
							},
							{
								label: 'Delete redirects to deleted pages',
								name: 'delete_redirects',
								value: 'delete_redirects',
								checked: true
							}
						]
					}
				},
				{
					label: 'Unlink backlinks to each page (in Main and Portal namespaces only)',
					name: 'unlink_page',
					value: 'unlink',
					checked: false
				},
				{
					label: 'Remove usages of each file (in all namespaces)',
					name: 'unlink_file',
					value: 'unlink_file',
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

	var query = {
		'action': 'query',
		'prop': 'revisions|info|imageinfo',
		'inprop': 'protection',
		'rvprop': 'size|user'
	};
	if( mw.config.get( 'wgNamespaceNumber' ) === 14 ) {  // Category:
		query.generator = 'categorymembers';
		query.gcmtitle = mw.config.get('wgPageName');
		query.gcmlimit = Twinkle.getPref('batchMax'); // the max for sysops
	} else if( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Prefixindex' ) {

		query.generator = 'allpages';
		query.gaplimit = Twinkle.getPref('batchMax'); // the max for sysops
		if(Morebits.queryString.exists( 'prefix' ) )
		{
			query.gapnamespace = Morebits.queryString.get( 'namespace' );
			query.gapprefix = Morebits.string.toUpperCaseFirstChar( Morebits.queryString.get( 'prefix' ) );
		}
		else
		{
			var pathSplit = decodeURIComponent(location.pathname).split('/');
			if (pathSplit.length < 3 || pathSplit[2] !== "Special:PrefixIndex") {
				return;
			}
			var titleSplit = pathSplit[3].split(':');
			query.gapnamespace = mw.config.get("wgNamespaceIds")[titleSplit[0].toLowerCase()];
			if ( titleSplit.length < 2 || typeof query.gapnamespace === 'undefined' )
			{
				query.gapnamespace = 0;  // article namespace
				query.gapprefix = pathSplit.splice(3).join('/');
			}
			else
			{
				pathSplit = pathSplit.splice(4);
				pathSplit.splice(0,0,titleSplit.splice(1).join(':'));
				query.gapprefix = pathSplit.join('/');
			}
		}
	} else {
		query.generator = 'links';
		query.titles = mw.config.get('wgPageName');
		query.gpllimit = Twinkle.getPref('batchMax'); // the max for sysops
	}

	var statusdiv = document.createElement( 'div' );
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var statelem = new Morebits.status("Grabbing list of pages");
	var wikipedia_api = new Morebits.wiki.api( 'loading...', query, function( apiobj ) {
			var xml = apiobj.responseXML;
			var $pages = $(xml).find('page').filter(':not([missing])');  // :not([imagerepository="shared"])
			var list = [];
			$pages.each(function(index, page) {
				var $page = $(page);
				var ns = $page.attr('ns');
				var title = $page.attr('title');
				var isRedir = $page.attr('redirect') === "";
				var $editprot = $page.find('pr[type="edit"][level="sysop"]');
				var isProtected = $editprot.length > 0;
				var size = $page.find('rev').attr('size');

				var metadata = [];
				if (isRedir) {
					metadata.push("redirect");
				}
				if (isProtected) {
					metadata.push("fully protected" +
						($editprot.attr('expiry') === 'infinity' ? ' indefinitely' : (', expires ' + $editprot.attr('expiry'))));
				}
				if (ns === "6") {  // mimic what delimages used to show for files
					metadata.push("uploader: " + $page.find('ii').attr('user'));
					metadata.push("last edit from: " + $page.find('rev').attr('user'));
				} else {
					metadata.push(size + " bytes");
				}
				list.push({
					label: title + (metadata.length ? (' (' + metadata.join('; ') + ')') : ''),
					value: title,
					checked: true,
					style: (isProtected ? 'color:red' : '')
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
	var delete_talk = event.target.delete_talk && event.target.delete_talk.checked;
	var delete_redirects = event.target.delete_redirects && event.target.delete_redirects.checked;
	var unlink_page = event.target.unlink_page.checked;
	var unlink_file = event.target.unlink_file.checked;
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

	var pageDeleter = new Morebits.batchOperation(delete_page ? "Deleting pages" : "Initiating requested tasks");
	pageDeleter.setOption("chunkSize", Twinkle.getPref('batchdeleteChunks'));
	// we only need the initial status lines if we're deleting the pages in the pages array
	pageDeleter.setOption("preserveIndividualStatusLines", delete_page);
	pageDeleter.setPageList(pages);
	pageDeleter.run(function(pageName) {
		var params = {
			page: pageName,
			delete_page: delete_page,
			delete_talk: delete_talk,
			delete_redirects: delete_redirects,
			unlink_page: unlink_page,
			unlink_file: unlink_file && /^(File|Image)\:/i.test(pageName),
			reason: reason,
			pageDeleter: pageDeleter
		};

		var wikipedia_page = new Morebits.wiki.page( pageName, 'Deleting page ' + pageName );
		wikipedia_page.setCallbackParameters(params);
		if( delete_page ) {
			wikipedia_page.setEditSummary(reason + Twinkle.getPref('deletionSummaryAd'));
			wikipedia_page.suppressProtectWarning();
			wikipedia_page.deletePage(Twinkle.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
		} else {
			Twinkle.batchdelete.callbacks.doExtras(wikipedia_page);
		}
	});
};

Twinkle.batchdelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of Morebits.wiki.* callback parameters
	doExtras: function( thingWithParameters ) {
		var params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() :
			thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageDeleter.workerSuccess(thingWithParameters);

		var query, wikipedia_api;

		if( params.unlink_page ) {
			Twinkle.batchdelete.unlinkCache = {};
			query = {
				'action': 'query',
				'list': 'backlinks',
				'blfilterredir': 'nonredirects',
				'blnamespace': [0, 100], // main space and portal space only
				'bltitle': params.page,
				'bllimit': 5000  // 500 is max for normal users, 5000 for bots and sysops
			};
			wikipedia_api = new Morebits.wiki.api( 'Grabbing backlinks', query, Twinkle.batchdelete.callbacks.unlinkBacklinksMain );
			wikipedia_api.params = params;
			wikipedia_api.post();
		}

		if( params.unlink_file ) {
			query = {
				'action': 'query',
				'list': 'imageusage',
				'iutitle': params.page,
				'iulimit': 5000  // 500 is max for normal users, 5000 for bots and sysops
			};
			wikipedia_api = new Morebits.wiki.api( 'Grabbing file links', query, Twinkle.batchdelete.callbacks.unlinkImageInstancesMain );
			wikipedia_api.params = params;
			wikipedia_api.post();
		}

		if( params.delete_page ) {
			if ( params.delete_redirects ) {
				query = {
					'action': 'query',
					'titles': params.page,
					'prop': 'redirects',
					'rdlimit': 5000  // 500 is max for normal users, 5000 for bots and sysops
				};
				wikipedia_api = new Morebits.wiki.api( 'Grabbing redirects', query, Twinkle.batchdelete.callbacks.deleteRedirectsMain );
				wikipedia_api.params = params;
				wikipedia_api.post();
			}
			if ( params.delete_talk ) {
				var pageTitle = mw.Title.newFromText(params.page);
				if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
					pageTitle.namespace++;  // now pageTitle is the talk page title!
					query = {
						'action': 'query',
						'titles': pageTitle.toText()
					};
					wikipedia_api = new Morebits.wiki.api( 'Checking whether talk page exists', query, Twinkle.batchdelete.callbacks.deleteTalk );
					wikipedia_api.params = params;
					wikipedia_api.params.talkPage = pageTitle.toText();
					wikipedia_api.post();
				}
			}
		}
	},
	deleteRedirectsMain: function( apiobj ) {
		var xml = apiobj.responseXML;
		var pages = $(xml).find('rd').map(function() { return $(this).attr('title'); }).get();
		if (!pages.length) {
			return;
		}

		var redirectDeleter = new Morebits.batchOperation("Deleting redirects to " + apiobj.params.page);
		redirectDeleter.setOption("chunkSize", Twinkle.getPref('batchdeleteChunks'));
		redirectDeleter.setPageList(pages);
		redirectDeleter.run(function(pageName) {
			var wikipedia_page = new Morebits.wiki.page(pageName, "Deleting " + pageName);
			wikipedia_page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page "' + apiobj.params.page + '"' + Twinkle.getPref('deletionSummaryAd'));
			wikipedia_page.deletePage(redirectDeleter.workerSuccess, redirectDeleter.workerFailure);
		});
	},
	deleteTalk: function( apiobj ) {
		var xml = apiobj.responseXML;
		var exists = $(xml).find('page:not([missing])').length > 0;

		if( !exists ) {
			// no talk page; forget about it
			return;
		}

		var page = new Morebits.wiki.page(apiobj.params.talkPage, "Deleting talk page of article " + apiobj.params.page);
		page.setEditSummary("[[WP:CSD#G8|G8]]: [[Help:Talk page|Talk page]] of deleted page \"" + apiobj.params.page + "\"" + Twinkle.getPref('deletionSummaryAd'));
		page.deletePage();
	},
	unlinkBacklinksMain: function( apiobj ) {
		var xml = apiobj.responseXML;
		var pages = $(xml).find('bl').map(function() { return $(this).attr('title'); }).get();
		if (!pages.length) {
			return;
		}

		var unlinker = new Morebits.batchOperation("Unlinking backlinks to " + apiobj.params.page);
		unlinker.setOption("chunkSize", Twinkle.getPref('batchdeleteChunks'));
		unlinker.setPageList(pages);
		unlinker.run(function(pageName) {
			var wikipedia_page = new Morebits.wiki.page(pageName, "Unlinking on " + pageName);
			var params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.batchdelete.callbacks.unlinkBacklinks);
		});
	},
	unlinkBacklinks: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		if( ! pageobj.exists() ) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
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
			params.unlinker.workerSuccess(pageobj);
			return;
		}
		pageobj.setEditSummary('Removing link(s) to deleted page ' + params.page + Twinkle.getPref('deletionSummaryAd'));
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	},
	unlinkImageInstancesMain: function( apiobj ) {
		var xml = apiobj.responseXML;
		var pages = $(xml).find('iu').map(function() { return $(this).attr('title'); }).get();
		if (!pages.length) {
			return;
		}

		var unlinker = new Morebits.batchOperation("Unlinking backlinks to " + apiobj.params.page);
		unlinker.setOption("chunkSize", Twinkle.getPref('batchdeleteChunks'));
		unlinker.setPageList(pages);
		unlinker.run(function(pageName) {
			var wikipedia_page = new Morebits.wiki.page(pageName, "Removing file usages on " + pageName);
			var params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.batchdelete.callbacks.unlinkImageInstances);
		});
	},
	unlinkImageInstances: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		if( ! pageobj.exists() ) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
			return;
		}

		var image = params.image.replace( /^(?:Image|File):/, '' );
		var text;
		if( params.title in Twinkle.batchdelete.unlinkCache ) {
			text = Twinkle.batchdelete.unlinkCache[ params.title ];
		} else {
			text = pageobj.getPageText();
		}
		var old_text = text;
		var wikiPage = new Morebits.wikitext.page( text );
		wikiPage.commentOutImage( image , 'Commented out because image was deleted' );

		text = wikiPage.getText();
		Twinkle.batchdelete.unlinkCache[ params.title ] = text;
		if( text === old_text ) {
			pageobj.getStatusElement().error( 'failed to unlink image ' + image + ' from ' + pageobj.getPageName() );
			params.unlinker.workerFailure(pageobj);
			return;
		}
		pageobj.setEditSummary('Removing instance of file ' + image + " that has been deleted because \"" + params.reason + "\")" + Twinkle.getPref('deletionSummaryAd'));
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};
})(jQuery);


//</nowiki>
