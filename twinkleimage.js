if ( typeof(Twinkle) === "undefined" ) {
	alert( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function twinkleimage() {
	if( wgNamespaceNumber == 6 && !(document.getElementById("mw-sharedupload"))) {
		twAddPortletLink( (twinkleUserAuthorized ? "javascript:twinkleimage.callback()" : 'javascript:alert("Your account is too new to use Twinkle.");'), "DI", "tw-di", "Nominate file for relative speedy deletion", "");
	}
}

twinkleimage.callback = function twinkleimageCallback() {
	var Window = new SimpleWindow( 600, 300 );
	Window.setTitle( "File for dated speedy deletion" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Speedy deletion policy", "WP:CSD" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#image" );

	var form = new QuickForm( twinkleimage.callback.evaluate );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Notify original uploader',
					value: 'notify',
					name: 'notify',
					tooltip: "Uncheck this if you are planning to make multiple nominations from the same user, and don't want to overload their talk page with too many notifications.",
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
					label: 'No source (CSD F4)',
					value: 'no source',
					checked: true,
					tooltip: 'Image or media has no source information'
				},
				{
					label: 'No license (CSD F4)',
					value: 'no license',
					tooltip: 'Image or media does not have information on its copyright status'
				},
				{
					label: 'No source and no license (CSD F4)',
					value: 'no source no license',
					tooltip: 'Image or media has neither information on source nor its copyright status'
				},
				{
					label: 'Orphaned fair use (CSD F5)',
					value: 'orphaned fair use',
					tooltip: 'Image or media is unlicensed for use on Wikipedia and allowed only under a claim of fair use per Wikipedia:Non-free content, but it is not used in any articles'
				},
				{
					label: 'No fair use rationale (CSD F6)',
					value: 'no fair use rationale',
					tooltip: 'Image or media is claimed to be used under Wikipedia\'s fair use policy but has no explanation as to why it is permitted under the policy'
				},
				{
					label: 'Disputed fair use rationale (CSD F7)',
					value: 'disputed fair use rationale',
					tooltip: 'Image or media has a fair use rationale that is disputed'
				},
				{
					label: 'Replaceable fair use (CSD F7)',
					value: 'replaceable fair use',
					tooltip: 'Image or media may fail Wikipedia\'s first non-free content criterion ([[WP:NFCC#1]]) in that it illustrates a subject for which a free image might reasonably be found or created that adequately provides the same information'
				},
				{
					label: 'No permission (CSD F11)',
					value: 'no permission',
					tooltip: 'Image or media does not have proof that the author agreed to licence the file'
				}
			]
		} );
	form.append( {
			type: 'div',
			label: 'Work area',
			name: 'work_area'
		} );
	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the parameters
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

	root.replaceChild( work_area.render(), $(root).find('div[name="work_area"]')[0] );
}

twinkleimage.callback.evaluate = function twinkleimageCallbackEvaluate(event) {
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!

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
	SimpleWindow.setButtonsEnabled( false );
	Status.init( event.target );

	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Tagging complete";

	// Tagging image
	var wikipedia_page = new Wikipedia.page( wgPageName, 'Tagging file with deletion tag' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.load( twinkleimage.callbacks.taggingImage );

	// Notifying uploader
	if( notify ) {
		wikipedia_page.lookupCreator(twinkleimage.callbacks.userNotification);
	} else {
		// No auto-notifiaction, display what was going to be added.
		var noteData = document.createElement( 'pre' );
		noteData.appendChild( document.createTextNode( "\{\{subst:di-" + type + "-notice|1=" + wgTitle + "\}\} \~\~\~\~" ) );
		Status.info( 'Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement( 'br' ),  noteData ] );
	}
}

twinkleimage.callbacks = {
	taggingImage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var tag = "\{\{di-" + params.type + "|date=\{\{subst:#time:j F Y\}\}";
		var csdcrit = "";
		switch( params.type ) {
			case 'no source no license':
			case 'no source':
				tag += params.non_free ? "|non-free=yes" : "";
				csdcrit = "F4";
				break;
			case 'no permission':
				tag += params.source ? "|source=" + params.source : "";
				csdcrit = "F11";
				break;
			case 'disputed fair use rationale':
				tag += params.reason ? "|concern=" + params.reason : "";
				csdcrit = "F7";
				break;
			case 'orphaned fair use':
				tag += params.replacement ? "|replacement=" + params.replacement : "";
				csdcrit = "F5";
				break;
			case 'replaceable fair use':
				tag += params.old_image ? "|old image=yes" : "";
				csdcrit = "F7";
				break;
			case 'no license':
				csdcrit = "F4";
				break;
			case 'no fair use rationale':
				csdcrit = "F6";
				break;
			default:
				break;
		};
		tag += "\}\}\n";

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary("This file is up for deletion, per [[WP:CSD#" + csdcrit + "|CSD " + csdcrit + "]] (" + params.type + ")." + TwinkleConfig.summaryAd);
		switch (TwinkleConfig.deliWatchPage) {
			case 'yes':
				pageobj.setWatchlist(true);
				break;
			case 'no':
				pageobj.setWatchlistFromPreferences(false);
				break;
			default:
				pageobj.setWatchlistFromPreferences(true);
				break;
		}
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();
		var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
		var notifytext = "\n\{\{subst:di-" + params.type + "-notice|1=" + wgTitle + "\}\} \~\~\~\~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Notification: tagging for deletion of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
		usertalkpage.setCreateOption('recreate');
		switch (TwinkleConfig.deliWatchUser) {
			case 'yes':
				usertalkpage.setWatchlist(true);
				break;
			case 'no':
				usertalkpage.setWatchlistFromPreferences(false);
				break;
			default:
				usertalkpage.setWatchlistFromPreferences(true);
				break;
		}
		usertalkpage.setFollowRedirect(true);
		usertalkpage.append();
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinkleimage", twinkleimage );
