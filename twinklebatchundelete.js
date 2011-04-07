if ( typeof(Twinkle) === "undefined" ) {
	alert( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function twinklebatchundelete() {
	if( wgNamespaceNumber != Namespace.USER ) {
		return;
	}
	if( userIsInGroup( 'sysop' ) ) {
		twAddPortletLink( "javascript:twinklebatchundelete.callback()", "Und-batch", "tw-batch-undel", "Undelete 'em all", "");
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
	}
}

twinklebatchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new SimpleWindow( 800, 400 );
	var form = new QuickForm( twinklebatchundelete.callback.evaluate );
	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason: '
		} );

	var query = {
		'action': 'query',
		'generator': 'links',
		'titles': wgPageName,
		'gpllimit' : TwinkleConfig.batchMax, // the max for sysops
	};
	var wikipedia_api = new Wikipedia.api( 'Grabbing pages', query, function( self ) {
			var xmlDoc = self.responseXML;
			var snapshot = xmlDoc.evaluate('//page[@missing]', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			var list = [];
			for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
				var object = snapshot.snapshotItem(i);
				var page = xmlDoc.evaluate( '@title', object, null, XPathResult.STRING_TYPE, null ).stringValue;
				list.push( {label:page, value:page, checked: true });
			}
			self.params.form.append( {
					type: 'checkbox',
					name: 'pages',
					list: list
				}
			)
			self.params.form.append( { type:'submit' } );

			var result = self.params.form.render();
			self.params.Window.setContent( result );


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
	twinklebatchundelete.currentundeleteor = window.setInterval( twinklebatchundelete.callbacks.main, 1000, work, reason );
}

twinklebatchundelete.callbacks = {
	main: function( work, reason ) 	{
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
					'title': 'Special:Undelete',
					'target': title,
					'action': 'submit'
				};
				var wikipedia_wiki = new Wikipedia.wiki( "Undeleting " + title, query, twinklebatchundelete.callbacks.undeletePage, function( self ) { 
						--twinklebatchundelete.currentUndeleteCounter;
						var link = document.createElement( 'a' );
						link.setAttribute( 'href', wgArticlePath.replace( '$1', self.params.title ) );
						link.setAttribute( 'title', self.params.title );
						link.appendChild( document.createTextNode( self.params.title ) );
						self.statelem.info( [ 'completed (' , link , ')' ] );

					});
				wikipedia_wiki.params = { title:title, reason: reason };
				wikipedia_wiki.get();

			}
		}
	},
	undeletePage: function( self ) {
		var form = self.responseXML.getElementById('undelete');
		var postData = {
			'wpComment': self.params.reason + '.' +  TwinkleConfig.deletionSummaryAd,
			'target': self.params.image,
			'wpEditToken': form.wpEditToken.value,
			'restore': 1
		}
		self.post( postData );

	}
};

// register initialization callback
Twinkle.init.moduleReady( "twinklebatchundelete", twinklebatchundelete );