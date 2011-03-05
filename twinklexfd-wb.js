// If TwinkleConfig aint exist.
if( typeof( TwinkleConfig ) == 'undefined' ) {
	TwinkleConfig = function() {};
}

/**
 TwinkleConfig.summaryAd (string)
 If ad should be added or not to summary, default [[WP:TWINKLE|TWINKLE]]
 */
if( typeof( TwinkleConfig.summaryAd ) == 'undefined' ) {
	TwinkleConfig.summaryAd = " using [[WP:TW|TW]]";
}
function twinklexfd() {
	if( wgNamespaceNumber < 0 || wgCurRevisionId == false ) {
		return;
	}
	if (twinkleConfigExists)
	{
		addPortletLink( 'p-cactions', "javascript:twinklexfd.callback()", "xfd", "tw-xfd", "Anything for deletion", "");
	}
	else
	{
		addPortletLink('p-cactions', 'javascript:alert("Your account is too new to use Twinkle.");', 'xfd', 'tw-xfd', 'Anything for deletion', '');
	}
}
addOnloadHook(twinklexfd);

twinklexfd.callback = function twinklexfdCallback() {

	var Window = new SimpleWindow( 600, 300 );
	Window.setTitle( "Anything for deletion" );
	var form = new QuickForm( twinklexfd.callback.evaluate );
	var categories = form.append( {
			type: 'select',
			name: 'category',
			label: 'Select wanted type of deletion: ',
			event: twinklexfd.callback.change_category
		} );
	categories.append( {
			type: 'option',
			label: 'VfD',
			value: 'vfd',
			tooltip: 'Votes for deletion'
		} );
	categories.append( {
			type: 'option',
			label: 'Speedy',
			value: 'speedy',
			tooltip: 'Speedy deletions'
		} );

	form.append( {
			type: 'field',
			label:'Work area',
			name: 'work_area'
		} );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.category.dispatchEvent( evt );

}

twinklexfd.callback.change_category = function twinklexfdCallbackChangeCategory(e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area;
	var childNodes = root.childNodes;
	for( var i = 0; i < childNodes.length; ++i ) {
		var node = childNodes[i];
		if(
			node instanceof Element &&
			node.getAttribute( 'name' ) == 'work_area'
		) {
			old_area = node;
			break;
		}
	}
	var work_area = null;

	switch( value ) {
	case 'vfd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Votes for deletion',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'textarea',
				name: 'xfdreason',
				label: 'Reason: '
			} );
		work_area.append( { type:'submit' } );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'speedy_todo':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Speedy deletion',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'textarea',
				name: 'xfdreason',
				label: 'Reason: '
			} );
		work_area.append( { type:'submit' } );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	default:
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Nothing for anything',
				name: 'work_area'
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	}
}

twinklexfd.callbacks = {
	vfd: {
		taggingPage: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': undefined, // Per memo
				'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSummary': "Nominated for deletion; see \[\[Wikibooks:Votes for deletion#" + wgPageName + '\]\].'+ TwinkleConfig.summaryAd,
				'wpTextbox1': "<noinclude>\{\{vfd\}\}\n</noinclude>" + form.wpTextbox1.value
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var text = form.wpTextbox1.value;
			text +=  "\n\{\{subst:vfd2|" + wgPageName + "|text=" + self.params.reason + ". \~\~\~\~\}\}";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSummary': "Adding [[" + wgPageName + ']].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			text += "\n\{\{subst:Vfd warning|1=" + wgPageName + "|2=\~\~\~\~\}\}";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSummary': 'VfD nomination of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}
	}
}

twinklexfd.callback.evaluate = function(e) {

	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!

	var type =  e.target.category.value;
	var reason = e.target.xfdreason.value;

	Status.init( e.target );

	if( type == null ) {
		Status.error( 'Error', 'no action given' );
		return;
	}

	switch( type ) {

	case 'vfd': // VfD

		Wikipedia.addCheckpoint();
		// Tagging page
		var query = {
			'title': wgPageName,
			'action': 'submit'
		};
		wikipedia_wiki = new Wikipedia.wiki( 'Tagging page with deletion tag', query, twinklexfd.callbacks.vfd.taggingPage );
		wikipedia_wiki.get();

		// Adding discussion

		query = {
			'title': 'Wikibooks:Votes for deletion',
			'action': 'submit',
		};

		// Updating data for the action completed event
		Wikipedia.actionCompleted.redirect = query['title'];
		Wikipedia.actionCompleted.notice = "Nomination completed, redirecting now to the list of today";

		wikipedia_wiki = new Wikipedia.wiki( 'Adding discussion to todays list', query, twinklexfd.callbacks.vfd.todaysList );
		wikipedia_wiki.params = { reason:reason };
		wikipedia_wiki.get();

		var query = {
			'action': 'query',
			'prop': 'revisions',
			'titles': wgPageName,
			'rvlimit': 1,
			'rvprop': 'user',
			'rvdir': 'newer'
		}
		var callback = function( self ) {
			var xmlDoc = self.responseXML;
			var user = xmlDoc.evaluate( '//rev/@user', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
			var query = {
				'title': 'User talk:' + user,
				'action': 'submit'
			};
			var wikipedia_wiki = new Wikipedia.wiki( 'Notifying of initial contributor (' + user + ')', query, twinklexfd.callbacks.vfd.userNotification );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.get();
		}
		var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
		wikipedia_api.params = self.params;
		wikipedia_api.post();

		Wikipedia.removeCheckpoint();
		break;
	}
}

