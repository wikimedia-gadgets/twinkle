// If TwinkleConfig aint exist.
if( typeof( TwinkleConfig ) == 'undefined' ) {
	TwinkleConfig = {};
}

/**
 TwinkleConfig.summaryAd (string)
 If ad should be added or not to summary, default [[WP:TWINKLE|TWINKLE]]
 */
if( typeof( TwinkleConfig.summaryAd ) == 'undefined' ) {
	TwinkleConfig.summaryAd = " using [[WP:TW|TW]]";
}

/**
 TwinkleConfig.watchProdPages (boolean)
 If, when applying prod template to page, watch it, default true
 */
if( typeof( TwinkleConfig.watchProdPages ) == 'undefined' ) {
	TwinkleConfig.watchProdPages = true;
}

/**
 TwinkleConfig.prodReasonDefault (string)
 The prefilled PROD reason.
 */
if( typeof( TwinkleConfig.prodReasonDefault ) == 'undefined' ) {
	TwinkleConfig.prodReasonDefault = "";
}

function twinkleprod() {
	if( wgNamespaceNumber != 0 || wgCurRevisionId == false ) {
		return;
	}
	if (twinkleConfigExists)
	{
		twAddPortletLink( "javascript:twinkleprod.callback()", "PROD", "tw-prod", "Propose deletion via WP:PROD", "");
	}
	else
	{
		twAddPortletLink( 'javascript:alert("Your account is too new to use Twinkle.");', 'PROD', 'tw-prod', 'Propose deletion via WP:PROD', '');
	}
}
window.TwinkleInit = (window.TwinkleInit || []).concat(twinkleprod); //schedule initializer

twinkleprod.callback = function twinkleprodCallback() {
	var Window = new SimpleWindow( 800, 410 );
	Window.setTitle( "WP:PROD" );
	var form = new QuickForm( twinkleprod.callback.evaluate );
	
	var field = form.append( {
			type: 'field',
			label: 'PROD type'
		} );
	field.append( {
			type: 'radio',
			name: 'prodtype',
			event: twinkleprod.callback.prodtypechanged,
			list: [
				{
					label: 'PROD',
					value: 'prod',
					checked: true,
					tooltip: 'Normal proposed deletion, per [[WP:PROD]]'
				},
				{
					label: 'BLP PROD',
					value: 'prodblp',
					tooltip: 'Proposed deletion of new, completely unsourced biographies of living persons, per [[WP:BLPPROD]]'
				}
			]
		} );
	
	//Note: This needs to be the form's lastchild! It will be replaced in callback.prodtypechanged!
	form.append( {
			type: 'div',
		} );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	
	// fake a change event on the first prod type radio to initialize the type dependant controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.prodtype[0].dispatchEvent( evt );
}

twinkleprod.callback.prodtypechanged = function(event)
{
  //prepare frame for prod type dependant controls
	var work_area = new QuickForm.element( {
			type: 'div',
		} );

	var field = work_area.append( {
			type: 'field',
			label: 'Parameters'
		} );
  //create prod type dependant controls
	switch( event.target.value )
	{
		case 'prod':
    	field.append( {
    			type: 'checkbox',
    			list: [
    				{
    					label: 'Notify if possible',
    					value: 'notify',
    					name: 'notify',
    					tooltip: 'If a notification is defined in the configuration, then notify if this is true, else no notify',
    					checked: true
    				}
    			]
    		}
    	);
    	field.append( {
    			type: 'textarea',
    			name: 'reason',
    			label: 'Reason for proposed deletion:',
    			value: TwinkleConfig.prodReasonDefault,
    		} );
			break;

		case 'prodblp':
		  //first, remember the prod value that the user entered in the textarea, in case he wants to switch back. We can abuse the config field for that.
		  if (event.target.form.reason) TwinkleConfig.prodReasonDefault = event.target.form.reason.value;
		
    	field.append( {
    			type: 'checkbox',
    			list: [
    				{
    					label: 'Notify if possible',
    					value: 'notify',
    					name: 'notify',
    					tooltip: 'Creator of article has to be notified.',
    					checked: true,
    					disabled: true
    				}
    			]
    		}
    	);
    	//temp warning, can be removed down the line once BLPPROD is more established. Amalthea, May 2010.
    	field.append({
    	  type: 'header',
    	  label:'Please note that only unsourced biographies of living persons are eligible for this tag, narrowly construed.',
    	});
    	if (wgArticleId<26596183)
    	{
    	  field.append({
    	    type: 'header',
    	    label:'It appears that this article was created before March 18, 2010, and is thus ineligible for a BLP PROD. Please make sure that this is not the case, or use normal PROD instead.',
    	  });
    	}
			break;
			
		default: break;
	};
	
	work_area.append( { type:'submit', label:'Propose deletion' } );	
	
	event.target.form.replaceChild( work_area.render(), event.target.form.lastChild );
}


twinkleprod.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;
		var exists = xmlDoc.evaluate( 'boolean(//pages/page[not(@missing)])', xmlDoc, null, XPathResult.BOOLEAN_TYPE, null ).booleanValue;

		if( ! exists ) {
			self.statelem.error( "It seems that the page doesn't exist.  Perhaps it has already been deleted." );
			return;
		}
		
		var query = {
			'title': wgPageName,
			'action': 'submit'
		};
		
		var wikipedia_wiki = new Wikipedia.wiki( 'Tagging page', query, twinkleprod.callbacks.tagPage );
		wikipedia_wiki.params = self.params;
		wikipedia_wiki.followRedirect = false;
		wikipedia_wiki.get();
	},
	tagPage: function( self ) {
		var form = self.responseXML.getElementById('editform');
		var text = form.wpTextbox1.value;

		var tag_re = /(\{\{(?:db-?|delete|[aitcmrs]fd|md1)[^{}]*?\|?[^{}]*?\}\})/i;
		if( tag_re.test( text ) ) {
			self.statelem.warn( 'Page already tagged with a deletion template, aborting procedure' );
			return;
		}

		//Remove tags that become superfluous with this action
		text = text.replace(/{\{\s*(New unreviewed article|Userspace draft)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/ig, "");

		var prod_re = /\{\{\s*(?:dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated)\s*\|(?:\{\{[^\{\}]*\}\}|[^\}\{])*\}\}/i;
		if( !prod_re.test( text ) ) {
			// Notification to first contributor
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
				var wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + user + ')', query, twinkleprod.callbacks.userNotification );
				wikipedia_wiki.params = self.params;
				wikipedia_wiki.followRedirect = true;
				wikipedia_wiki.get();
			}

			if( self.params.usertalk ) {
				var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
				wikipedia_api.params = self.params;
				wikipedia_api.post();
			}
			
			var summaryText = "Proposing article for deletion per [[WP:"+(self.params.blp?"BLP":"")+"PROD]].";
			text = "\{\{subst:prod"+(self.params.blp?" blp":"")+"|1=" + self.params.reason + "\}\}\n" + text;
		} else {
			var prod2_re = /\{\{(?:Proposed deletion endorsed|prod-?2).*?\}\}/;
			if( prod2_re.test( text ) ) {
				self.statelem.warn( 'Page already tagged with \{\{prod\}\} and \{\{prod-2\}\} templates, aborting procedure' );
				return;
			}
			self.statelem.info( "A \{\{prod\}\} tag was already found on this article" );
			if( !confirm( "Would you like to add a \{\{prod-2\}\} tag with your explanation?" ) ) {
				self.statelem.info( 'Aborted per user request' );
				return;
			}
			
			var summaryText = "Endorsing proposed deletion per [[WP:"+(self.params.blp?"BLP":"")+"PROD]].";
			text = text.replace( prod_re, text.match( prod_re ) + "\n\{\{prod-2|1=" + self.params.reason + "\}\}\n" );
		}

		var postData = {
			'wpMinoredit': undefined, // Per memo
			'wpWatchthis': TwinkleConfig.watchProdPages ? '' : form.wpWatchthis.checked ? '' : undefined,
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSection': '',
			'wpSummary': summaryText + TwinkleConfig.summaryAd,
			'wpTextbox1': text
		};

		self.post( postData );
	},
	userNotification: function( self ) {
		var form = this.responseXML.getElementById( 'editform' );
		var text = form.wpTextbox1.value;
		text += "\n\{\{subst:prodwarning"+(self.params.blp?"BLP":"")+"|1=" + wgPageName + "|concern=" + self.params.reason + "\}\} \~\~\~\~";
		var postData = {
			'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
			'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSection': '',
			'wpSummary': 'Proposed deletion of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
			'wpTextbox1': text
		};

		self.post ( postData );
	}
}

twinkleprod.callback.evaluate = function twinkleprodCallbackEvaluate(e)
{
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!
	var form = e.target;

	var prodtypes = form.prodtype;
	for( var i=0; i<prodtypes.length; i++ )
	{
		if( !prodtypes[i].checked ) continue;
		var prodtype = prodtypes[i].value;
		break;
	}

	var params = {
		usertalk: form.notify.checked,
		blp: prodtype=='prodblp',
		reason:   prodtype=='prodblp'?'':form.reason.value //using an empty string here as fallback will help with prod-2.
	};

	Status.init( form );

	if (prodtype=='prodblp' && wgArticleId<26596183)
	{
		if (!confirm( "It appears that this article was created before March 18, 2010, and is thus ineligible for a BLP PROD. Do you want to continue tagging it?" ))
		{
			Status.info( 'Notice', 'Aborting per user input.' );
			return;
		}
	}

	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Tagging complete";

	var query = {
		'action': 'query',
		'titles': wgPageName
	};

	var wikipedia_api = new Wikipedia.api( 'Checking if page exists', query, twinkleprod.callbacks.main );
	wikipedia_api.params = params;
	wikipedia_api.post();
}