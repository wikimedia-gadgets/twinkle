/*
 ****************************************
 *** twinklebatchundelete.js: Batch undelete module
 ****************************************
 * Mode of invocation:     Tab ("Und-batch")
 * Active on:              Existing and non-existing user pages (??? why?)
 * Config directives in:   TwinkleConfig
 */


Twinkle.batchundelete = function twinklebatchundelete() {
	if( wgNamespaceNumber != Namespace.USER ) {
		return;
	}
	if( userIsInGroup( 'sysop' ) ) {
		$(twAddPortletLink("#", "Und-batch", "tw-batch-undel", "Undelete 'em all", "")).click(Twinkle.batchundelete.callback);
	}
};

Twinkle.batchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new SimpleWindow( 800, 400 );
	var form = new QuickForm( Twinkle.batchundelete.callback.evaluate );
	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason: '
		} );

	var query = {
		'action': 'query',
		'generator': 'links',
		'titles': wgPageName,
		'gpllimit' : Twinkle.getPref('batchMax') // the max for sysops
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
			);
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
};
Twinkle.batchundelete.currentUndeleteCounter = 0;
Twinkle.batchundelete.currentundeletor = 0;
Twinkle.batchundelete.callback.evaluate = function( event ) {
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

	var work = Morebits.array.chunk( pages, Twinkle.getPref('batchUndeleteChunks') );
	Wikipedia.addCheckpoint();
	Twinkle.batchundelete.currentundeletor = window.setInterval( Twinkle.batchundelete.callbacks.main, 1000, work, reason );
};

Twinkle.batchundelete.callbacks = {
	main: function( work, reason ) {
		if( work.length === 0 && Twinkle.batchundelete.currentUndeleteCounter <= 0 ) {
			Status.info( 'work done' );
			window.clearInterval( Twinkle.batchundelete.currentundeletor );
			Wikipedia.removeCheckpoint();
			return;
		} else if( work.length !== 0 && Twinkle.batchundelete.currentUndeleteCounter <= Twinkle.getPref('batchUndeleteMinCutOff') ) {
			var pages = work.shift();
			Twinkle.batchundelete.currentUndeleteCounter += pages.length;
			for( var i = 0; i < pages.length; ++i ) {
				var title = pages[i];
				var query = { 
					'title': 'Special:Undelete',
					'target': title,
					'action': 'submit'
				};
				var wikipedia_wiki = new Wikipedia.wiki( "Undeleting " + title, query, Twinkle.batchundelete.callbacks.undeletePage, function( self ) { 
						--Twinkle.batchundelete.currentUndeleteCounter;
						var link = document.createElement( 'a' );
						link.setAttribute( 'href', mw.util.wikiGetlink(self.params.title) );
						link.setAttribute( 'title', self.params.title );
						link.appendChild( document.createTextNode(self.params.title) );
						self.statelem.info( ['completed (',link,')'] );

					});
				wikipedia_wiki.params = { title:title, reason: reason };
				wikipedia_wiki.get();

			}
		}
	},
	undeletePage: function( self ) {
		var form = self.responseXML.getElementById('undelete');
		var postData = {
			'wpComment': self.params.reason + '.' +  Twinkle.getPref('deletionSummaryAd'),
			'target': self.params.image,
			'wpEditToken': form.wpEditToken.value,
			'restore': 1
		};
		self.post( postData );

	}
};
