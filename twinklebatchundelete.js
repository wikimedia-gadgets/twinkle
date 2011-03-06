// If TwinkleConfig aint exist.
if( typeof( TwinkleConfig ) == 'undefined' ) {
	TwinkleConfig = {};
}

/**
 TwinkleConfig.deletionSummaryAd (string)
 If ad should be added or not to deletion summary, default [[WP:TWINKLE|TWINKLE]]
 */
if( typeof( TwinkleConfig.deletionSummaryAd ) == 'undefined' ) {
	TwinkleConfig.deletionSummaryAd = " using [[WP:TW|TW]]";
}
/**
 TwinkleConfig.batchundeleteChunks (integer)
 How many pages should be processed at a time
 */
if( typeof( TwinkleConfig.batchUndeleteChunks ) == 'undefined' ) {
	TwinkleConfig.batchundeleteChunks = 50;
}

/**
 TwinkleConfig.batchUndeleteMinCutOff (integer)
 How many pages left in the process of being completed should allow a new batch to be initialized
 */
if( typeof( TwinkleConfig.batchUndeleteMinCutOff ) == 'undefined' ) {
	TwinkleConfig.batchUndeleteMinCutOff = 5;
}
/**
 TwinkleConfig.batchMax (integer)
 How many pages should be processed maximum
 */
if( typeof( TwinkleConfig.batchMax ) == 'undefined' ) {
	TwinkleConfig.batchMax = 5000;
}

function twinklebatchundelete() {
	if( wgNamespaceNumber != Namespace.USER ) {
		return;
	}
	if( userIsInGroup( 'sysop' ) ) {
		twAddPortletLink( "javascript:twinklebatchundelete.callback()", "Und-batch", "tw-batch-undel", "Undelete 'em all", "");
	}
}
window.TwinkleInit = (window.TwinkleInit || []).concat( twinklebatchundelete ); //schedule initializer.

twinklebatchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new SimpleWindow( 800, 400 );
	var form = new QuickForm( twinklebatchundelete.callback.evaluate );
	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason: ',
			value: 'Twinkle batch undelete API testing'  // #################### testing only ###################
		} );

	var query = {
		'action': 'query',
		'generator': 'links',
		'titles': wgPageName,
		'gpllimit' : TwinkleConfig.batchMax, // the max for sysops
		'prop' : 'info',
		'intoken' : 'delete',  // It appears that edit, move, and delete tokens are identical, but "delete" seems appropriate for this function
	};
	var wikipedia_api = new Wikipedia.api( 'Grabbing pages', query, function( apiobj ) {
			var xmlDoc =apiobj.responseXML;

			var deletetoken = $(xmlDoc).find('page').attr('deletetoken');

			// Get a list of referenced redlinked pages and build a list to be displayed as checkboxes
			var list = $(xmlDoc).find('page[missing*=""]').map( function() {
				var page = $(this).attr('title');
				return { label:page, value:page, checked: true };
			});

			apiobj.params.form.append( {
					type: 'checkbox',
					name: 'pages',
					list: list
				}
			)
			apiobj.params.form.append( {
					type: 'hidden',
					name: 'deletetoken',
					value: deletetoken
				}
			)
			apiobj.params.form.append( { type:'submit' } );

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent( result );


		}  );
	wikipedia_api.params = { form:form, Window:Window };
	wikipedia_api.post();
	var root = document.createElement( 'div' );
	Status.init( root );
	Window.setContent( root );
	Window.display();
}
twinklebatchundelete.currentUndeleteCounter = 0;
twinklebatchundelete.currentundeleteor;
twinklebatchundelete.callback.evaluate = function( event ) {
	Wikipedia.actionCompleted.notice = 'Status';
	Wikipedia.actionCompleted.postfix = 'batch undeletion is now completed';

	var pages = event.target.getChecked( 'pages' );
	var reason = event.target.reason.value;
        var deletetoken = event.target.deletetoken.value;
	if( ! reason ) {
		return;
	}
	Status.init( event.target );

	if( !pages ) {
		Status.error( 'Error', 'nothing to undelete, aborting' );
		return;
	}

	var work = pages.chunk( TwinkleConfig.batchUndeleteChunks );
	Wikipedia.addCheckpoint();
	twinklebatchundelete.currentundeleteor = window.setInterval( twinklebatchundelete.callbacks.main, 1000, work, reason, deletetoken );
}

twinklebatchundelete.callbacks = {
	main: function( work, reason, deletetoken ) 	{
		if( work.length == 0 && twinklebatchundelete.currentUndeleteCounter <= 0 ) {
			Status.info( 'work done' );
			window.clearInterval( twinklebatchundelete.currentundeleteor );
			Wikipedia.removeCheckpoint();
			return;
		} else if( work.length != 0 && twinklebatchundelete.currentUndeleteCounter <= TwinkleConfig.batchUndeleteMinCutOff ) {
			var pages = work.shift();
			twinklebatchundelete.currentUndeleteCounter += pages.length;
			for( var i = 0; i < pages.length; ++i ) {
				var title = pages[i];

				var query = {
					'action': 'undelete',
					'title': title,
					'reason ': reason + '.' +  TwinkleConfig.deletionSummaryAd,
					'token': deletetoken
				};
				var wikipedia_api = new Wikipedia.api( "Undeleting " + title, query, twinklebatchundelete.callbacks.UndeleteComplete);
				wikipedia_api.params = { 'title' : title };
				wikipedia_api.post();

			}
		}
	},
	UndeleteComplete: function(apiobj) {
		var xmlDoc = apiobj.responseXML;
		//alert("TRACE: Undelete completion callback: xmlString= \n" + (new XMLSerializer()).serializeToString(apiobj.responseXML) + "[END]");

		var link = document.createElement( 'a' );
		link.setAttribute( 'href', wgArticlePath.replace( '$1', apiobj.params.title ) );
		link.setAttribute( 'title', apiobj.params.title );
		link.appendChild( document.createTextNode( apiobj.params.title ) );
		apiobj.statelem.info( [ 'completed (' , link , ')' ] );
	}
};