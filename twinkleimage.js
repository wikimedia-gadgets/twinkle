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
 TwinkleConfig.notifyUserOnDeli (boolean)
 If the user should be notified after placing a file deletion tag
 */
if( typeof( TwinkleConfig.notifyUserOnDeli ) == 'undefined' ) {
	TwinkleConfig.notifyUserOnDeli = true;
}

/**
 TwinkleConfig.deliWatchPage (string)
 The watchlist setting of the page tagged for deletion. Either "yes", "no", or "default". Default is "default" (Duh).
 */
if( typeof( TwinkleConfig.deliWatchPage) == 'undefined' ) {
	TwinkleConfig.deliWatchPage = "default";
}


/**
 TwinkleConfig.deliWatchUser (string)
 The watchlist setting of the user if he receives a notification. Either "yes", "no", or "default". Default is "default" (Duh).
 */
if( typeof( TwinkleConfig.deliWatchUser ) == 'undefined' ) {
	TwinkleConfig.deliWatchUser = "default";
}

/**
 TwinkleConfig.deliWatchUsages (string)
 The watchlist setting of usages of the tagged image. Either "yes", "no", or "default". Default is "no".
 */
if( typeof( TwinkleConfig.deliWatchUsages ) == 'undefined' ) {
	TwinkleConfig.deliWatchUsages = "no";
}


function twinkleimage() {
	if( wgNamespaceNumber == 6 && !(document.getElementById("mw-sharedupload"))) {
		twAddPortletLink( (twinkleConfigExists ? "javascript:twinkleimage.callback()" : 'javascript:alert("Your account is too new to use Twinkle.");'), "DI", "tw-di", "Nominate file for relative speedy deletion", "");
	}
}

window.TwinkleInit = (window.TwinkleInit || []).concat(twinkleimage); //schedule initializer

twinkleimage.callback = function twinkleimageCallback() {
	var Window = new SimpleWindow( 600, 300 );
	Window.setTitle( "File for pseudo-speedy deletion" );
	var form = new QuickForm( twinkleimage.callback.evaluate );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Notify original uploader',
					value: 'notify',
					name: 'notify',
					tooltip: 'Uncheck this if you are planning to make multiple nominations from the same user, and dont want your ass to be spanked.',
					checked: TwinkleConfig.notifyUserOnDeli
				}
			]
		}
	);
	var field = form.append( {
			type: 'field',
			label: 'Type of action wanted'
		} );
	field.append( {
			type: 'radio',
			name: 'type',
			event: twinkleimage.callback.choice,
			list: [
				{
					label: 'No source',
					value: 'no source',
					checked: true,
					tooltip: 'Image or media has no source information'
				},
				{
					label: 'No license',
					value: 'no license',
					tooltip: 'Image or media does not have information on its copyright status'
				},
				{
					label: 'No source and no license',
					value: 'no source no license',
					tooltip: 'Image or media has neither information on source nor its copyright status'
				},
				{
					label: 'No permission',
					value: 'no permission',
					tooltip: 'Image or media does not have proof that the author agreed to licence the file'
				},
				{
					label: 'No fair use rationale',
					value: 'no fair use rationale',
					tooltip: 'Image or media is claimed to be used under Wikipedia\'s fair use policy but has no explanation as to why it is permitted under the policy'
				},
				{
					label: 'Disputed fair use rationale',
					value: 'disputed fair use rationale',
					tooltip: 'Image or media has a fair use rationale that is disputed'
				},

				{
					label: 'Orphaned fair use',
					value: 'orphaned fair use',
					tooltip: 'Image or media is unlicensed for use on Wikipedia and allowed only under a claim of fair use per Wikipedia:Non-free content, but it is not used in any articles'
				},
				{
					label: 'Replaceable fair use',
					value: 'replaceable fair use',
					tooltip: 'Image or media may fail Wikipedia\'s first non-free content criterion in that it illustrates a subject for which a free image might reasonably be found or created that adequately provides the same information'
				}
			]
		} );
	form.append( {
			type: 'div',
			label: 'Work area',
			name: 'work_area'
		} );
	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.type[0].dispatchEvent( evt );
}

twinkleimage.callback.choice = function twinkleimageCallbackChoose(event) {
	var value = event.target.value;
	var root = event.target.form;
	var work_area = new QuickForm.element( {
			type: 'div',
			name: 'work_area'
		} );

	switch( value ) {
		case 'no source no license':
		case 'no source':
			work_area.append( {
					type: 'checkbox',
					name: 'non_free',
					list: [
						{
							label: 'Non-free',
							tooltip: 'Image is licensed under a fair use claim'
						}
					]
				} );
			break;
		case 'no permission':
			work_area.append( {
					type: 'input',
					name: 'source',
					label: 'Source: '
				} );
			break;
		case 'disputed fair use rationale':
			work_area.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Concern: '
				} );
			break;
		case 'orphaned fair use':
			work_area.append( {
					type: 'input',
					name: 'replacement',
					label: 'Replacement: '
				} );
			break;
		case 'replaceable fair use':
			work_area.append( {
					type: 'checkbox',
					name: 'old_image',
					list: [
						{
							label: 'Old image',
							tooltip: 'Image was uploaded before 2006-07-13'
						}
					]
				} );
			break;
		default:
			break;
	};
	work_area.append( { type:'submit' } );
	work_area = work_area.render();
	root.replaceChild( work_area, root.lastChild );
}

twinkleimage.callback.evaluate = function twinkleimageCallbackEvaluate(event) {
	var notify = event.target.notify.checked;
	var types = event.target.type;
	for( var i = 0; i < types.length; ++i ) {
		if( types[i].checked ) {
			var type = types[i].value;
			break;
		}
	}
	if( event.target.non_free ) {
		var non_free = event.target.non_free.checked;
	}
	if( event.target.source ) {
		var source = event.target.source.value;
	}
	if( event.target.reason ) {
		var reason = event.target.reason.value;
	}
	if( event.target.replacement ) {
		var replacement = event.target.replacement.value;
	}
	if( event.target.old_image ) {
		var old_image = event.target.old_image.checked;
	}

	var params = {
		type: type,
		non_free: non_free,
		source: source,
		reason: reason,
		replacement: replacement,
		old_image: old_image
	};
	Status.init( event.target );

	// Tagging image
	var query = {
		'title': wgPageName,
		'action': 'submit'
	};

	var wikipedia_wiki = new Wikipedia.wiki( 'Tagging file with deletion tag', query, twinkleimage.callbacks.taggingImage );
	wikipedia_wiki.params = params;
	wikipedia_wiki.get();

	// Notifying uploader
	if( notify ) {
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
			var wikipedia_wiki = new Wikipedia.wiki( 'Notifying of initial contributor (' + user + ')', query, twinkleimage.callbacks.userNotification );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = true;
			wikipedia_wiki.get();
		}
		var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
		wikipedia_api.params = params;
		wikipedia_api.post();
	} else {
		// No auto-notifiaction, display what was going to be added.
		var noteData = document.createElement( 'pre' );
		noteData.appendChild( document.createTextNode( "\{\{subst:di-" + type + "-notice|1=" + wgTitle + "\}\} \~\~\~\~" ) );
		Status.info( 'Notification', [ 'Following/Similar data should be pasted to the original uploader:', document.createElement( 'br' ),  noteData ] );

	}

	// adding tag to captions
	var query = {
		'action': 'query',
		'list': 'imageusage',
		'iutitle': wgPageName,
		'iulimit': userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
	};

	//Disabled, we let [[User:Sambot]] do that now. Also see [[WP:TW/BUG#333]] and [[WP:TW/BUG#285]]:
	//var wikipedia_api = new Wikipedia.api( 'Grabbing file links', query, twinkleimage.callbacks.tagInstancesMain );
	//wikipedia_api.params = params;
	//wikipedia_api.post();
}

twinkleimage.callbacks = {
	taggingImage: function( self ) {
		var form = self.responseXML.getElementById('editform');
		var text = "\{\{di-" + self.params.type + "|date=\{\{subst:#time:j F Y\}\}";
		switch( self.params.type ) {
			case 'no source no license':
			case 'no source':
				text += self.params.non_free ? "|non-free=yes" : "";
				break;
			case 'no permission':
				text += self.params.source ? "|source=" + self.params.source : "";
				break;
			case 'disputed fair use rationale':
				text += self.params.reason ? "|concern=" + self.params.reason : "";
				break;
			case 'orphaned fair use':
				text += self.params.replacement ? "|replacement=" + self.params.replacement : "";
				break;
			case 'replaceable fair use':
				text += self.params.old_image ? "|old image=yes" : "";
				break;
			default:
				break;
		};
		text += "\}\}\n";
		var postData = {
			'wpMinoredit': undefined, // Per
			'wpWatchthis': (TwinkleConfig.deliWatchPage=="yes" || (TwinkleConfig.deliWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSection': '',
			'wpSummary': "This file is up for deletion per \[\[WP:CSD\]\]." + TwinkleConfig.summaryAd,
			'wpTextbox1': text + form.wpTextbox1.value
		};
		self.post( postData );
	},
	userNotification: function( self ) {
		var form = self.responseXML.getElementById( 'editform' );
		var text = form.wpTextbox1.value;
		text += "\n\{\{subst:di-" + self.params.type + "-notice|1=" + wgTitle + "\}\} \~\~\~\~";
		var postData = {
			'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
			'wpWatchthis': (TwinkleConfig.deliWatchUser=="yes" || (TwinkleConfig.deliWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSection': '',
			'wpSummary': 'Notification: Deletion of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
			'wpTextbox1': text
		};
		self.post( postData );
	},
	tagInstancesMain: function( self ) {
		var statusIndicator = new Status('Tagging file instances', '0%');
		var xmlDoc = self.responseXML;
		var nsResolver = xmlDoc.createNSResolver( xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
		var snapshot = xmlDoc.evaluate('//imageusage/iu/@title', xmlDoc, nsResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

		var total = snapshot.snapshotLength * 2;

		imageTaggingCounter = 0;
		var onsuccess = function( self ) {
			var obj = self.params.obj;
			var total = self.params.total;
			var now = parseInt( 100 * ++imageTaggingCounter/total ) + '%';
			obj.update( now );
			self.statelem.unlink();
			if( imageTaggingCounter == total ) {
				obj.info( now + ' (completed)' );
				Wikipedia.removeCheckpoint();
			}
		}
		var onloaded = onsuccess;

		var onloading = function( self ) {}


		Wikipedia.addCheckpoint();
		for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
			var title = snapshot.snapshotItem(i).value;
			var query = {
				'title': title,
				'action': 'submit'
			}
			var wikipedia_wiki = new Wikipedia.wiki( "Tagging " + title, query, twinkleimage.callbacks.tagInstances );
			wikipedia_wiki.params = { title:title, total:total, obj:statusIndicator, days: self.params.old_image ? 2 : 7 };
			wikipedia_wiki.onloading = onloading;
			wikipedia_wiki.onloaded = onloaded;
			wikipedia_wiki.onsuccess = onsuccess;
			wikipedia_wiki.get();
		}
	},
	tagInstances: function( self ) {
		var form = self.responseXML.getElementById('editform');
		var text = form.wpTextbox1.value;
		var old_text = text;
		var wikiPage = new Mediawiki.Page( text );

		var tag = "\{\{deletable image-caption|1=\{\{subst:#time:l, j F Y| + " + self.params.days + " days\}\}\}\}";
		wikiPage.addToImageComment( wgTitle, tag );

		text = wikiPage.getText();
		if( text == old_text ) {
			// Nothing to do, return
			self.onsuccess( self );
			Wikipedia.actionCompleted( self );
			return;
		}
		var postData = {
			'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
			'wpWatchthis': (TwinkleConfig.deliWatchUsages=="yes"||(TwinkleConfig.deliWatchUsages=="default"&&form.wpWatchthis.checked) ? '' : undefined),
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSection': '',
			'wpSummary': 'Tagging [[:File:' + wgTitle + "]] which is up for deletion per [[WP:CSD|CSD]] " + TwinkleConfig.summaryAd,
			'wpTextbox1': text
		};
		self.post( postData );
	}
}