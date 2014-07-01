//<nowiki>


(function($){


/*
****************************************
*** twinkledelimages.js: Batch deletion of images (sysops only)
****************************************
* Mode of invocation:     Tab ("Deli-batch")
* Active on:              Existing non-special pages
* Config directives in:   TwinkleConfig
*/

Twinkle.delimages = function twinkledeli() {
	if( mw.config.get( 'wgNamespaceNumber' ) < 0 || !mw.config.get( 'wgCurRevisionId' ) ) {
		return;
	}
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		Twinkle.addPortletLink( Twinkle.delimages.callback, "Deli-batch", "tw-deli", "Delete files found on page" );
	}
};

Twinkle.delimages.unlinkCache = {};
Twinkle.delimages.callback = function twinkledeliCallback() {
	var Window = new Morebits.simpleWindow( 800, 400 );
	Window.setTitle( "Batch file deletion" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#delimages" );

	var form = new Morebits.quickForm( Twinkle.delimages.callback.evaluate );
	form.append( {
		type: 'checkbox',
		list: [
			{
				label: 'Delete files',
				name: 'delete_image',
				value: 'delete',
				checked: true
			},
			{
				label: 'Unlink uses of this file',
				name: 'unlink_image',
				value: 'unlink',
				checked: true
			}
		]
	} );
	form.append( {
		type: 'textarea',
		name: 'reason',
		label: 'Reason: '
	} );
	var query;
	if( mw.config.get( 'wgNamespaceNumber' ) === 14 ) {  // Category:
		query = {
			'action': 'query',
			'generator': 'categorymembers',
			'gcmtitle': mw.config.get( 'wgPageName' ),
			'gcmnamespace': 6,  // File:
			'gcmlimit' : Twinkle.getPref('deliMax'), 
			'prop': [ 'imageinfo', 'categories', 'revisions' ],
			'grvlimit': 1,
			'grvprop': [ 'user' ]
		};
	} else {
		// prepare for a possible merge with batchdelete
		alert('Dear admin,  \n\n' +
			'We are planning to overhaul the "Deli-batch" module; we are particularly wondering if it is worthwhile to maintain the functionality that allows "Deli-batch" to be used from pages other than category pages. \n\n' +
			'Since you are invoking "Deli-batch" from a non-category page, we would appreciate it if you could inform the Twinkle team at [[WT:TW]]. If no-one responds to say they are using it, this functionality may soon be removed or altered.  \n\n' +
			'Thanks, \nThe Twinkle team');
	//form.append({ type:'div', style:'color:red;font-weight:bold;font-size:larger', label: 'This module is going away. Please use "D-batch" (batch deletion) instead.' });
		query = {
			'action': 'query',
			'generator': 'images',
			'titles': mw.config.get( 'wgPageName' ),
			'prop': [ 'imageinfo', 'categories', 'revisions' ],
			'gimlimit': 'max'
		};
	}
	var wikipedia_api = new Morebits.wiki.api( 'Grabbing files', query, function( self ) {
		var xmlDoc = self.responseXML;
		var images = $(xmlDoc).find('page[imagerepository="local"]');
		var list = [];

		$.each(images, function() {
			var $self = $(this);
			var image = $self.attr('title');
			var user = $self.find('imageinfo ii').attr('user');
			var last_edit = $self.find('revisions rev').attr('user');
			var disputed = $self.find('categories cl[title="Category:Contested candidates for speedy deletion"]').size() > 0;
			list.push( {
				'label': image + ' - author: ' + user + ', last edit from: ' + last_edit + ( disputed ? ' DISPUTED' : '' ),
				'value': image,
				'checked': !disputed
			});
		});

		self.params.form.append({
			type: 'checkbox',
			name: 'images',
			list: list
		});
		self.params.form.append( { type:'submit' } );

		var result = self.params.form.render();
		self.params.Window.setContent( result );
	});

	wikipedia_api.params = { form:form, Window:Window };
	wikipedia_api.post();
	var root = document.createElement( 'div' );
	Morebits.status.init( root );
	Window.setContent( root );
	Window.display();
};

Twinkle.delimages.currentDeleteCounter = 0;
Twinkle.delimages.currentUnlinkCounter = 0;
Twinkle.delimages.currentdeletor = 0;
Twinkle.delimages.callback.evaluate = function twinkledeliCallbackEvaluate(event) {
	var images = event.target.getChecked( 'images' );
	var reason = event.target.reason.value;
	var delete_image = event.target.delete_image.checked;
	var unlink_image = event.target.unlink_image.checked;
	if( ! reason ) {
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( event.target );

	function toCall( work ) {
		if( work.length === 0 && Twinkle.delimages.currentDeleteCounter <= 0 && Twinkle.delimages.currentUnlinkCounter <= 0 ) {
			window.clearInterval( Twinkle.delimages.currentdeletor );
			Morebits.wiki.removeCheckpoint();
			return;
		} else if( work.length !== 0 && Twinkle.delimages.currentDeleteCounter <= Twinkle.getPref('batchDeleteMinCutOff') && Twinkle.delimages.currentUnlinkCounter <= Twinkle.getPref('batchDeleteMinCutOff') ) {
			Twinkle.delimages.unlinkCache = []; // Clear the cache
			var images = work.shift();
			Twinkle.delimages.currentDeleteCounter = images.length;
			Twinkle.delimages.currentUnlinkCounter = images.length;
			var i;
			for( i = 0; i < images.length; ++i ) {
				var image = images[i];
				var query = {
					'action': 'query',
					'titles': image
				};
				var wikipedia_api = new Morebits.wiki.api( 'Checking if file ' + image + ' exists', query, Twinkle.delimages.callbacks.main );
				wikipedia_api.params = { image:image, reason:reason, unlink_image:unlink_image, delete_image:delete_image };
				wikipedia_api.post();
			}
		}
	}
	var work = Morebits.array.chunk( images, Twinkle.getPref('deliChunks') );
	Morebits.wiki.addCheckpoint();
	Twinkle.delimages.currentdeletor = window.setInterval( toCall, 1000, work );
};
Twinkle.delimages.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;
		var $data = $(xmlDoc);

		var normal = $data.find('normalized n').attr('to');

		if( normal ) {
			self.params.image = normal;
		}

		var exists = $data.find('pages page[title="'+self.params.image.replace( /"/g, '\\"')+'"]:not([missing])').size() > 0;

		if( ! exists ) {
			self.statelem.error( "It seems that the page doesn't exists, perhaps it has already been deleted" );
			return;
		}
		if( self.params.unlink_image ) {
			var query = {
				'action': 'query',
				'list': 'imageusage',
				'iutitle': self.params.image,
				'iulimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
			};
			var wikipedia_api = new Morebits.wiki.api( 'Grabbing file links', query, Twinkle.delimages.callbacks.unlinkImageInstancesMain );
			wikipedia_api.params = self.params;
			wikipedia_api.post();
		}
		if( self.params.delete_image ) {

			var imagepage = new Morebits.wiki.page( self.params.image, 'Deleting image');
			imagepage.setEditSummary( "File deleted: " + self.params.reason + Twinkle.getPref('deletionSummaryAd'));
			imagepage.deletePage();
		}
	},
	unlinkImageInstancesMain: function( self ) {
		var xmlDoc = self.responseXML;
		var instances = [];
		$(xmlDoc).find('imageusage iu').each(function(){
			instances.push($(this).attr('title'));
		});
		if( instances.length === 0 ) {
			--Twinkle.delimages.currentUnlinkCounter;
			return;
		}

		$.each( instances, function(k,title) {
			var page = new Morebits.wiki.page(title, "Unlinking instances on " + title);
			page.setFollowRedirect(true);
			page.setCallbackParameters({'image': self.params.image, 'reason': self.params.reason});
			page.load(Twinkle.delimages.callbacks.unlinkImageInstances);

		});
	},
	unlinkImageInstances: function( self ) {
		var params = self.getCallbackParameters();
		var statelem = self.getStatusElement();

		var image = params.image.replace( /^(?:Image|File):/, '' );
		var old_text = self.getPageText();
		var wikiPage = new Morebits.wikitext.page( old_text );
		wikiPage.commentOutImage( image , 'Commented out because image was deleted' );
		var text = wikiPage.getText();

		if( text === old_text ) {
			statelem.error( 'failed to unlink image ' + image +' from ' + self.getPageName() );
			return;
		}
		self.setPageText(text);
		self.setEditSummary('Removing instance of file ' + image + " that has been deleted because \"" + params.reason + "\")" + "; " + Twinkle.getPref('deletionSummaryAd'));
		self.setCreateOption('nocreate');
		self.save();
	}
};
})(jQuery);


//</nowiki>
