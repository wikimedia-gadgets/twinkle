//<nowiki>


(function($){


/*
 ****************************************
 *** twinklebatchundelete.js: Batch undelete module
 ****************************************
 * Mode of invocation:     Tab ("Und-batch")
 * Active on:              Existing user and project pages
 * Config directives in:   TwinkleConfig
 */


Twinkle.batchundelete = function twinklebatchundelete() {
	if( ( mw.config.get("wgNamespaceNumber") !== mw.config.get("wgNamespaceIds").user &&
		mw.config.get("wgNamespaceNumber") !== mw.config.get("wgNamespaceIds").project ) ||
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
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#batchundelete" );

	var form = new Morebits.quickForm( Twinkle.batchundelete.callback.evaluate );
	form.append( {
			type: 'input',
			name: 'reason',
			label: 'Reason: ',
			size: 60
		} );

	var statusdiv = document.createElement( 'div' );
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var query = {
		'action': 'query',
		'generator': 'links',
		'titles': mw.config.get("wgPageName"),
		'gpllimit' : Twinkle.getPref('batchMax') // the max for sysops
	};
	var statelem = new Morebits.status("Grabbing list of pages");
	var wikipedia_api = new Morebits.wiki.api( "loading...", query, function( apiobj ) {
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
		}, statelem );
	wikipedia_api.params = { form:form, Window:Window };
	wikipedia_api.post();
};

Twinkle.batchundelete.callback.evaluate = function( event ) {
	Morebits.wiki.actionCompleted.notice = 'Status';
	Morebits.wiki.actionCompleted.postfix = 'batch undeletion is now complete';

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

	var batchOperation = new Morebits.batchOperation("Undeleting pages");
	batchOperation.setOption("chunkSize", Twinkle.getPref('batchUndeleteChunks'));
	batchOperation.setOption("preserveIndividualStatusLines", true);
	batchOperation.setPageList(pages);
	batchOperation.run(function(pageName) {
		var query = {
			'token': mw.user.tokens.get().editToken,
			'title': pageName,
			'action': 'undelete',
			'reason': reason + Twinkle.getPref('deletionSummaryAd')
		};
		var wikipedia_api = new Morebits.wiki.api( "Undeleting page " + pageName, query,
			batchOperation.workerSuccess, null, batchOperation.workerFailure );
		wikipedia_api.statelem.status("undeleting...");
		wikipedia_api.pageName = pageName;
		wikipedia_api.post();
	});
};

})(jQuery);


//</nowiki>
