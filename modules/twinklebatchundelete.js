//<nowiki>


(function($){


/*
 ****************************************
 *** twinklebatchundelete.js: Batch undelete module
 ****************************************
 * Mode of invocation:     Tab ("Und-batch")
 * Active on:              Existing user pages
 * Config directives in:   TwinkleConfig
 */


Twinkle.batchundelete = function twinklebatchundelete() {
	if( mw.config.get("wgNamespaceNumber") !== mw.config.get("wgNamespaceIds").user || 
		!mw.config.get("wgArticleId") ) {
		return;
	}
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		Twinkle.addPortletLink( Twinkle.batchundelete.callback, "Und-batch", "tw-batch-undel", "Undelete 'em all" );
	}
};

Twinkle.batchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new Morebits.simpleWindow( 600, 400 );
	Window.setScriptName("Twinkle");
	Window.setTitle("Batch undelete");
	var form = new Morebits.quickForm( Twinkle.batchundelete.callback.evaluate );
	form.append( {
			type: 'input',
			name: 'reason',
			label: 'Reason: ',
			size: 60
		} );

	var query = {
		'action': 'query',
		'generator': 'links',
		'titles': mw.config.get("wgPageName"),
		'gpllimit' : Twinkle.getPref('batchMax') // the max for sysops
	};
	var wikipedia_api = new Morebits.wiki.api( 'Grabbing pages', query, function( apiobj ) {
			var xml = apiobj.responseXML;
			var $pages = $(xml).find('page[missing]');
			var list = [];
			$pages.each(function(index, page) {
				var $page = $(page);
				var title = $page.attr('title');
				list.push({ label: title, value: title, checked: true });
			});
			apiobj.params.form.append({ type: 'header', label: 'Pages to undelete' });
			apiobj.params.form.append({
					type: 'button',
					label: "Select All",
					event: function(e) {
						$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
					}
				});
			apiobj.params.form.append({
					type: 'button',
					label: "Deselect All",
					event: function(e) {
						$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
					}
				});
			apiobj.params.form.append( {
					type: 'checkbox',
					name: 'pages',
					list: list
				});
			apiobj.params.form.append( { type:'submit' } );

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent( result );

			Morebits.checkboxShiftClickSupport(Morebits.quickForm.getElements(result, 'pages'));
		} );
	wikipedia_api.params = { form:form, Window:Window };
	wikipedia_api.post();
	var root = document.createElement( 'div' );
	Morebits.status.init( root );
	Window.setContent( root );
	Window.display();
};
Twinkle.batchundelete.currentUndeleteCounter = 0;
Twinkle.batchundelete.currentundeletor = 0;
Twinkle.batchundelete.callback.evaluate = function( event ) {
	Morebits.wiki.actionCompleted.notice = 'Status';
	Morebits.wiki.actionCompleted.postfix = 'batch undeletion is now completed';

	var pages = event.target.getChecked( 'pages' );
	var reason = event.target.reason.value;
	if( ! reason ) {
		alert("You need to give a reason, you cabal crony!");
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init( event.target );

	if( !pages ) {
		Morebits.status.error( 'Error', 'nothing to undelete, aborting' );
		return;
	}

	var work = Morebits.array.chunk( pages, Twinkle.getPref('batchUndeleteChunks') );
	Morebits.wiki.addCheckpoint();
	Twinkle.batchundelete.currentundeletor = window.setInterval( Twinkle.batchundelete.callbacks.main, 1000, work, reason );
};

Twinkle.batchundelete.callbacks = {
	main: function( work, reason ) {
		if( work.length === 0 && Twinkle.batchundelete.currentUndeleteCounter <= 0 ) {
			Morebits.status.info( 'work done' );
			window.clearInterval( Twinkle.batchundelete.currentundeletor );
			Morebits.wiki.removeCheckpoint();
			return;
		} else if( work.length !== 0 && Twinkle.batchundelete.currentUndeleteCounter <= Twinkle.getPref('batchUndeleteMinCutOff') ) {
			var pages = work.shift();
			Twinkle.batchundelete.currentUndeleteCounter += pages.length;
			for( var i = 0; i < pages.length; ++i ) {
				var title = pages[i];
				var query = { 
					'token': mw.user.tokens.get().editToken,
					'title': title,
					'action': 'undelete',
					'reason': reason + Twinkle.getPref('deletionSummaryAd')
				};
				var wikipedia_api = new Morebits.wiki.api( "Undeleting " + title, query, function( self ) { 
						--Twinkle.batchundelete.currentUndeleteCounter;
						var link = document.createElement( 'a' );
						link.setAttribute( 'href', mw.util.getUrl(self.itsTitle) );
						link.setAttribute( 'title', self.itsTitle );
						link.appendChild( document.createTextNode(self.itsTitle) );
						self.statelem.info( ['completed (',link,')'] );

					});
				wikipedia_api.itsTitle = title;
				wikipedia_api.post();

			}
		}
	}
};
})(jQuery);


//</nowiki>
