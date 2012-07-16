/*
****************************************
*** twinkledeprod.js: Batch deletion of expired PRODs (sysops only)
****************************************
* Mode of invocation:     Tab ("Deprod")
* Active on:              Categories whose name starts with "Category:Proposed deletion as of"
* Config directives in:   TwinkleConfig
*/

;(function(){
	Twinkle.deprod = function() {
		if( mw.config.get( 'wgNamespaceNumber' ) !== 14 || ! Morebits.userIsInGroup( 'sysop' ) || !((/^Category:Proposed_deletion_as_of/).test(mw.config.get( 'wgPageName' ))) ) {
			return;
		}
		twAddPortletLink( callback, "Deprod", "tw-deprod", "Delete prod pages found in this category");
	};

	var unlinkCache = {},
	concerns = {},
	currentDeleteCounter = 0,
	currentUnlinkCounter = 0,
	currentDeletor = null,

	callback = function() {
		var Window = new Morebits.simpleWindow( 800, 400 );
		Window.setTitle( "PROD cleaning" );
		Window.setScriptName( "Twinkle" );
		Window.addFooterLink( "Proposed deletion", "WP:PROD" );
		Window.addFooterLink( "Twinkle help", "WP:TW/DOC#deprod" );

		var form = new Morebits.quickForm( callback_commit );

		var query = {
			'action': 'query',
			'generator': 'categorymembers',
			'gcmtitle': mw.config.get( 'wgPageName' ),
			'gcmlimit' : 5000, // the max for sysops
			'prop': [ 'categories', 'revisions' ],
			'rvprop': [ 'content' ]
		};

		var wikipedia_api = new Morebits.wiki.api( 'Grabbing pages', query,
			function( self ) {
				var $doc = $(self.responseXML);
				var $pages = $doc.find('page[ns!="6"]');  // all non-files
				var list = [];
				var re = /\{\{Proposed deletion/;
				$pages.each(function() {
					var $self = $(this);
					var page = $self.attr('title');
					var content = $self.find('revisions rev').text();
					var concern = '';
					var res = re.exec(content);
					if( res ) {
						var parsed = Morebits.wikitext.template.parse( content, res.index );
						concern = parsed.parameters.concern || '';
					}
					list.push( {label:page + ' (' + concern + ')' , value:page, checked:concern !== '' });
					concerns[page] = concern;

				});
				self.params.form.append({
					'type': 'checkbox',
					'name': 'pages',
					'list': list
				});
				self.params.form.append({
					'type': 'submit'
				});
				self.params.Window.setContent(  self.params.form.render() );
			});

			wikipedia_api.params = { form:form, Window:Window };
			wikipedia_api.post();
			var root = document.createElement( 'div' );
			Morebits.simpleWindow.setButtonsEnabled( true );

			Morebits.status.init( root );
			Window.setContent( root );
			Window.display();
	},

	callback_commit = function(event) {
		var pages = event.target.getChecked( 'pages' );
		Morebits.status.init( event.target );
		function toCall( work ) {
			if( work.length === 0 ) {
				Morebits.status.info( 'work done' );
				window.clearInterval( currentDeletor );
				Morebits.wiki.removeCheckpoint();
				return;
			} else if( currentDeleteCounter <= 0 || currentUnlinkCounter <= 0 ) {
				unlinkCache = []; // Clear the cache
				var pages = work.pop(), i;
				for( i = 0; i < pages.length; ++i ) {
					var page = pages[i];
					var query = {
						'action': 'query',
						'prop': 'revisions',
						'rvprop': [ 'content' ],
						'rvlimit': 1,
						'titles': page
					};
					var wikipedia_api = new Morebits.wiki.api( 'Checking if page ' + page + ' exists', query, callback_check );
					wikipedia_api.params = { page:page, reason: concerns[page] };
					wikipedia_api.post();
				}
			}
		}
		var work = Morebits.array.chunk( pages, Twinkle.getPref('proddeleteChunks') );
		Morebits.wiki.addCheckpoint();
		currentDeletor = window.setInterval( toCall, 1000, work );
	},
	callback_check = function( self ) {
		var $doc  = $(self.responseXML);
		var normal = $doc.find('normalized n').attr('to');
		if( normal ) {
			self.params.page = normal;
		}
		var exists = $doc.find('pages page:not([missing])').size() > 0;

		if( ! exists ) {
			self.statelem.error( "It seems that the page doesn't exist, perhaps it has already been deleted" );
			return;
		}

		var query = {
			'action': 'query',
			'list': 'backlinks',
			'blfilterredir': 'redirects',
			'bltitle': self.params.page,
			'bllimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
		};
		var wikipedia_api = new Morebits.wiki.api( 'Grabbing redirects', query, callback_deleteRedirects );
		wikipedia_api.params = self.params;
		wikipedia_api.post();

		var page = new Morebits.wiki.page('Talk:' + self.params.page, "Deleting talk page");
		page.setEditSummary("[[WP:CSD#G8|G8]]: [[Help:Talk page|Talk page]] of deleted page \"" + self.params.page + "\"" + Twinkle.getPref('deletionSummaryAd'));
		page.deletePage();

		page = new Morebits.wiki.page(self.params.page, "Deleting article");
		page.setEditSummary("Expired [[WP:PROD|PROD]], concern was: " + self.params.reason + Twinkle.getPref('deletionSummaryAd'));
		page.deletePage();


	},
	callback_deleteRedirects = function( self ) {
		$doc = $(self.responseXML);
		$doc.find("backlinks bl").each(function(){
			var title = $(this).attr('title');
			var page = new Morebits.wiki.page(title, "Deleting redirecting page " + title);
			page.setEditSummary("[[WP:CSD#R1|R1]]: Redirect to deleted page \"" + self.params.page + "\"" + Twinkle.getPref('deletionSummaryAd'));
			page.deletePage();
		});
	};
}());
