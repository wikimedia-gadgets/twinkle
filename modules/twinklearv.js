//<nowiki>


(function($){


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Existing and non-existing user pages, user talk pages, contributions pages
 * Config directives in:   TwinkleConfig
 */

Twinkle.arv = function twinklearv() {

	var username = Morebits.getPageAssociatedUser();
	if ( username === false ) {
		return;
	}

	var title = Morebits.isIPAddress( username ) ? 'Report IP to administrators' : 'Report user to administrators';

	Twinkle.addPortletLink( function(){ Twinkle.arv.callback(username); }, "ARV", "tw-arv", title );
};

Twinkle.arv.callback = function ( uid ) {
	if ( uid === mw.config.get('wgUserName') ) {
		alert( 'You don\'t want to report yourself, do you?' );
		return;
	}

	var Window = new Morebits.simpleWindow( 600, 500 );
	Window.setTitle( "Advance Reporting and Vetting" ); //Backronym
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Guide to AIV", "WP:GAIV" );
	Window.addFooterLink( "UAA instructions", "WP:UAAI" );
	Window.addFooterLink( "About SPI", "WP:SPI" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#arv" );

	var form = new Morebits.quickForm( Twinkle.arv.callback.evaluate );
	var categories = form.append( {
			type: 'select',
			name: 'category',
			label: 'Select report type: ',
			event: Twinkle.arv.callback.changeCategory
		} );
	categories.append( {
			type: 'option',
			label: 'Vandalism (WP:AIV)',
			value: 'aiv'
		} );
	categories.append( {
			type: 'option',
			label: 'Username (WP:UAA)',
			value: 'username'
		} );
	categories.append( {
			type: 'option',
			label: 'Sockpuppeteer (WP:SPI)',
			value: 'sock'
		} );
	categories.append( {
			type: 'option',
			label: 'Sockpuppet (WP:SPI)',
			value: 'puppet'
		} );
	categories.append( {
		  type: 'option',
		  label: 'Edit warring (WP:AN3)',
		  value: 'an3'
		} );
	form.append( {
			type: 'field',
			label:'Work area',
			name: 'work_area'
		} );
	form.append( { type:'submit' } );
	form.append( {
			type: 'hidden',
			name: 'uid',
			value: uid
		} );
	
	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.category.dispatchEvent( evt );
};

Twinkle.arv.callback.changeCategory = function (e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area = Morebits.quickForm.getElements(root, "work_area")[0];
	var work_area = null;

	switch( value ) {
	case 'aiv':
		/* falls through */
	default:
		work_area = new Morebits.quickForm.element( { 
				type: 'field',
				label: 'Report user for vandalism',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'input',
				name: 'page',
				label: 'Primary linked page: ',
				tooltip: 'Leave blank to not link to the page in the report',
				value: Morebits.queryString.exists( 'vanarticle' ) ? Morebits.queryString.get( 'vanarticle' ) : '',
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					if( value === '' ) {
						root.badid.disabled = root.goodid.disabled = true;
					} else {
						root.badid.disabled = false;
						root.goodid.disabled = root.badid.value === '';
					}
				}
			} );
		work_area.append( {
				type: 'input',
				name: 'badid',
				label: 'Revision ID for target page when vandalised: ',
				tooltip: 'Leave blank for no diff link',
				value: Morebits.queryString.exists( 'vanarticlerevid' ) ? Morebits.queryString.get( 'vanarticlerevid' ) : '',
				disabled: !Morebits.queryString.exists( 'vanarticle' ),
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					root.goodid.disabled = value === '';
				}
			} );
		work_area.append( {
				type: 'input',
				name: 'goodid',
				label: 'Last good revision ID before vandalism of target page: ',
				tooltip: 'Leave blank for diff link to previous revision',
				value: Morebits.queryString.exists( 'vanarticlegoodrevid' ) ? Morebits.queryString.get( 'vanarticlegoodrevid' ) : '',
				disabled: !Morebits.queryString.exists( 'vanarticle' ) || Morebits.queryString.exists( 'vanarticlerevid' )
			} );
		work_area.append( {
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{ 
						label: 'Vandalism after final (level 4 or 4im) warning given',
						value: 'final'
					},
					{ 
						label: 'Vandalism after recent (within 1 day) release of block',
						value: 'postblock'
					},
					{ 
						label: 'Evidently a vandalism-only account',
						value: 'vandalonly',
						disabled: Morebits.isIPAddress( root.uid.value )
					},
					{ 
						label: 'Account is evidently a spambot or a compromised account',
						value: 'spambot'
					},
					{ 
						label: 'Account is a promotion-only account',
						value: 'promoonly'
					}
				]
			} );
		work_area.append( {
				type: 'textarea',
				name: 'reason',
				label: 'Comment: '
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'username':
		work_area = new Morebits.quickForm.element( { 
				type: 'field',
				label: 'Report username violation',
				name: 'work_area'
			} );
		work_area.append ( { 
				type:'header', 
				label:'Type(s) of inappropriate username',
				tooltip: 'Wikipedia does not allow usernames that are misleading, promotional, offensive or disruptive. Domain names and email addresses are likewise prohibited. These criteria apply to both usernames and signatures. Usernames that are inappropriate in another language, or that represent an inappropriate name with misspellings and substitutions, or do so indirectly or by implication, are still considered inappropriate.'
			} );
		work_area.append( {
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: 'Misleading username',
						value: 'misleading',
						tooltip: 'Misleading usernames imply relevant, misleading things about the contributor. For example, misleading points of fact, an impression of undue authority, or the suggestion that the account is operated by a group, project or collective rather than one individual.'
					},
					{ 
						label: 'Promotional username',
						value: 'promotional',
						tooltip: 'Promotional usernames are advertisements for a company, website or group. Please do not report these names to UAA unless the user has also made promotional edits related to the name.'
					},
					{ 
						label: 'Offensive username',
						value: 'offensive',
						tooltip: 'Offensive usernames make harmonious editing difficult or impossible.'
					},
					{ 
						label: 'Disruptive username',
						value: 'disruptive',
						tooltip: 'Disruptive usernames include outright trolling or personal attacks, or otherwise show a clear intent to disrupt Wikipedia.'
					}
				]
			} );
		work_area.append( {
				type: 'textarea',
				name: 'reason',
				label: 'Comment:'
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;

	case 'puppet':
		work_area = new Morebits.quickForm.element( { 
				type: 'field',
				label: 'Report suspected sockpuppet',
				name: 'work_area'
			} );
		work_area.append(
			{
				type: 'input',
				name: 'sockmaster',
				label: 'Sockpuppeteer',
				tooltip: 'The username of the sockpuppeteer (sockmaster) without the User:-prefix'
			}
		);
		work_area.append( {
				type: 'textarea',
				label: 'Evidence:',
				name: 'evidence',
				tooltip: 'Enter your evidence. It should make clear that each of these users is likely to be abusing multiple accounts. Usually this means diffs, page histories or other information that justifies why the users are a) the same and b) disruptive. This should purely be evidence and information needed to judge the matter. Avoid all other discussion that is not evidence of sockpuppetry or other multiple account abuse.'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Request CheckUser evidence',
						name: 'checkuser',
						tooltip: 'CheckUser is a tool used to obtain technical evidence related to a sock-puppetry allegation. It will not be used without good cause, which you must clearly demonstrate. Make sure your evidence explains why CheckUser is appropriate.'
					},
					{
						label: 'Notify reported users',
						name: 'notify',
						tooltip: 'Notification is not mandatory. In many cases, especially of chronic sockpuppeteers, notification may be counterproductive. However, especially in less egregious cases involving users who has not been reported before, notification may make the cases fairer and also appear to be fairer in the eyes of the accused. Use your judgment.'
					}
				]
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'sock':
		work_area = new Morebits.quickForm.element( { 
				type: 'field',
				label: 'Report suspected sockpuppeteer',
				name: 'work_area'
			} );
		work_area.append(
			{
				type: 'dyninput',
				name: 'sockpuppet',
				label: 'Sockpuppets',
				sublabel: 'Sock: ',
				tooltip: 'The username of the sockpuppet without the User:-prefix',
				min: 2
			}
		);
		work_area.append( {
				type: 'textarea',
				label: 'Evidence:',
				name: 'evidence',
				tooltip: 'Enter your evidence. It should make clear that each of these users is likely to be abusing multiple accounts. Usually this means diffs, page histories or other information that justifies why the users are a) the same and b) disruptive. This should purely be evidence and information needed to judge the matter. Avoid all other discussion that is not evidence of sockpuppetry or other multiple account abuse.'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [ {
					label: 'Request CheckUser evidence',
					name: 'checkuser',
					tooltip: 'CheckUser is a tool used to obtain technical evidence related to a sock-puppetry allegation. It will not be used without good cause, which you must clearly demonstrate. Make sure your evidence explains why CheckUser is appropriate.'
				}, {
					label: 'Notify reported users',
					name: 'notify',
					tooltip: 'Notification is not mandatory. In many cases, especially of chronic sockpuppeteers, notification may be counterproductive. However, especially in less egregious cases involving users who has not been reported before, notification may make the cases fairer and also appear to be fairer in the eyes of the accused. Use your judgment.'
				} ]
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
        break;
	  case 'an3':
		work_area = new Morebits.quickForm.element( {
		  type: 'field',
		  label: 'Report edit warring',
		  name: 'work_area'
		} );

		work_area.append(
		  {
			type: 'input',
			name: 'page',
			label: 'Page',
			tooltip: 'The page edit warring took place'

		  });
		  work_area.append(
			{
			  type: 'button',
			  name: 'load',
			  label: 'Load',
			  event: function(e) {
				var root = e.target.form;
				var value = root.page.value;
				var uid = root.uid.value;
				var $diffs = $(root).find('[name=diffs]');
				$diffs.find('.entry').remove();
				var api = new mw.Api();
				api.get({
				  action: 'query',
				  prop: 'revisions',
				  format: 'json',
				  rvprop: 'sha1|ids|timestamp|parsedcomment|comment',
				  rvlimit: 10,
				  rvuser: uid,
				  indexpageids: true,
				  redirects: true,
				  titles: value
				}).done(function(data){
				  var pageid = data.query.pageids[0];
				  var page = data.query.pages[pageid];
				  if(!page.revisions) {
					return;
				  }
				  for(var i = 0; i < page.revisions.length; ++i) {
					var rev = page.revisions[i];
					var $entry = $('<div/>', {
					  'class': 'entry',
					});
					var $input = $('<input/>', {
					  'type': 'checkbox',
					  'name': 's_diffs',
					  'value': rev.revid
					});
					$input.data('revinfo',rev);
					$input.appendTo($entry);
					$entry.append('<span>"'+rev.parsedcomment+'" at <a href="'+mw.config.get('wgScript')+'?diff='+rev.revid+'">'+rev.timestamp+'</a></span>').appendTo($diffs);


				  }

				}).fail(function(data){
				  console.log( 'API failed :(', error );
				});
				var $warnings = $(root).find('[name=warnings]');
				$warnings.find('.entry').remove();

				api.get({
				  action: 'query',
				  prop: 'revisions',
				  format: 'json',
				  rvprop: 'sha1|ids|timestamp|parsedcomment|comment',
				  rvlimit: 10,
				  rvuser: mw.config.get('wgUserName'),
				  indexpageids: true,
				  redirects: true,
				  titles: 'User talk:' + uid
				}).done(function(data){
				  var pageid = data.query.pageids[0];
				  var page = data.query.pages[pageid];
				  if(!page.revisions) {
					return;
				  }
				  for(var i = 0; i < page.revisions.length; ++i) {
					var rev = page.revisions[i];
					var $entry = $('<div/>', {
					  'class': 'entry',
					});
					var $input = $('<input/>', {
					  'type': 'checkbox',
					  'name': 's_warnings',
					  'value': rev.revid
					});
					$input.data('revinfo',rev);
					$input.appendTo($entry);
					$entry.append('<span>"'+rev.parsedcomment+'" at <a href="'+mw.config.get('wgScript')+'?diff='+rev.revid+'">'+rev.timestamp+'</a></span>').appendTo($warnings);


				  }

				}).fail(function(data){
				  console.log( 'API failed :(', error );
				});


				var $resolves = $(root).find('[name=resolves]');
				$resolves.find('.entry').remove();

				api.get({
				  action: 'query',
				  prop: 'revisions',
				  format: 'json',
				  rvprop: 'sha1|ids|timestamp|parsedcomment|comment',
				  rvlimit: 10,
				  rvuser: mw.config.get('wgUserName'),
				  indexpageids: true,
				  redirects: true,
				  titles: 'Talk:' + value
				}).done(function(data){
				  var pageid = data.query.pageids[0];
				  var page = data.query.pages[pageid];
				  if(!page.revisions) {
					return;
				  }
				  for(var i = 0; i < page.revisions.length; ++i) {
					var rev = page.revisions[i];
					var $entry = $('<div/>', {
					  'class': 'entry',
					});
					var $input = $('<input/>', {
					  'type': 'checkbox',
					  'name': 's_resolves',
					  'value': rev.revid
					});
					$input.data('revinfo',rev);
					$input.appendTo($entry);
					$entry.append('<span>"'+rev.parsedcomment+'" at <a href="'+mw.config.get('wgScript')+'?diff='+rev.revid+'">'+rev.timestamp+'</a></span>').appendTo($resolves);


				  }

				}).fail(function(data){
				  console.log( 'API failed :(', error );
				});
			  }

			});
			work_area.append(
			  {
				type: 'field',
				name: 'diffs',
				label: 'Edits which constitute edit warring',
				tooltip: 'Select the edits which you acuse the subject for edit warring with',
			  }
			);
			work_area.append(
			  {
				type: 'field',
				name: 'warnings',
				label: 'Indications of warnings given to subject',
				tooltip: 'You must have warned the subject before reporting',
			  }
			);
			work_area.append(
			  {
				type: 'field',
				name: 'resolves',
				label: 'Resolution initiatives',
				tooltip: 'You should have tried to resolve the issue on the talk page first',
			  }
			);

			work_area.append( {
			  type: 'textarea',
			  label: 'Comment:',
			  name: 'comment'
			} );
			work_area = work_area.render();
			old_area.parentNode.replaceChild( work_area, old_area );
			break;

	}
};

Twinkle.arv.callback.evaluate = function(e) {

	var form = e.target;
	var reason = "";
	var comment = "";
	if ( form.reason ) {
		comment = form.reason.value;
	}
	var uid = form.uid.value;

	var types;
	switch( form.category.value ) {

		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			types = form.getChecked( 'arvtype' );
			if( !types.length && comment === '' ) {
				alert( 'You must specify some reason' );
				return;
			}

			types = types.map( function(v) {
					switch(v) {
						case 'final':
							return 'vandalism after final warning';
						case 'postblock':
							return 'vandalism after recent release of block';
						case 'spambot':
							return 'account is evidently a spambot or a compromised account';
						case 'vandalonly':
							return 'actions evidently indicate a vandalism-only account';
						case 'promoonly':
							return 'account is being used only for promotional purposes';
						default:
							return 'unknown reason';
					}
				} ).join( '; ' );


			if ( form.page.value !== '' ) {
			
				// add a leading : on linked page namespace to prevent transclusion
				reason = 'On [[' + form.page.value.replace( /^(Image|Category|File):/i, ':$1:' ) + ']]';

				if ( form.badid.value !== '' ) {
					var query = {
						'title': form.page.value,
						'diff': form.badid.value,
						'oldid': form.goodid.value
					};
					reason += ' ({{diff|' + form.page.value + '|' + form.badid.value + '|' + form.goodid.value + '|diff}})';
				}
				reason += ':';
			}

			if ( types ) {
				reason += " " + types;
			}
			if (comment !== "" ) {
				reason += (reason === "" ? "" : ". ") + comment;
			}
			reason += ". ~~~~";
			reason = reason.replace(/\r?\n/g, "\n*:");  // indent newlines

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			Morebits.wiki.actionCompleted.redirect = "Wikipedia:Administrator intervention against vandalism";
			Morebits.wiki.actionCompleted.notice = "Reporting complete";

			var aivPage = new Morebits.wiki.page( 'Wikipedia:Administrator intervention against vandalism', 'Processing AIV request' );
			aivPage.setPageSection( 1 );
			aivPage.setFollowRedirect( true );
			
			aivPage.load( function() {
				var text = aivPage.getPageText();

				// check if user has already been reported
				if (new RegExp( "\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*" + RegExp.escape( uid, true ) + "\\s*\\}\\}" ).test(text)) {
					aivPage.getStatusElement().info( 'Report already present, will not add a new one' );
					return;
				}
				aivPage.getStatusElement().status( 'Adding new report...' );
				aivPage.setEditSummary( 'Reporting [[Special:Contributions/' + uid + '|' + uid + ']].' + Twinkle.getPref('summaryAd') );
				aivPage.setAppendText( '\n*{{' + ( Morebits.isIPAddress( uid ) ? 'IPvandal' : 'vandal' ) + '|' + (/\=/.test( uid ) ? '1=' : '' ) + uid + '}} &ndash; ' + reason );
				aivPage.append();
			} );
			break;
			
		// Report inappropriate username
		case 'username':
			types = form.getChecked( 'arvtype' );
			if( !types.length ) {
				alert( 'You must specify at least one breached violation' );
				return;
			}
			types = types.map( Morebits.string.toLowerCaseFirstChar );

			if ( types.length <= 2 ) {
				types = types.join( ' and ' );
			} else {
				types = [ types.slice( 0, -1 ).join( ', ' ), types.slice( -1 ) ].join( ' and ' );
			}
			var article = 'a';
			if ( /[aeiouwyh]/.test( types[0] ) ) { // non 100% correct, but whatever, inlcuding 'h' for Cockney
				article = 'an';
			}
			reason = "*{{user-uaa|1=" + uid + "}} &ndash; Violation of the username policy as " + article + " " + types + " username. ";
			if (comment !== '' ) {
				reason += Morebits.string.toUpperCaseFirstChar(comment) + ". ";
			}
			reason += "~~~~";
			reason = reason.replace(/\r?\n/g, "\n*:");  // indent newlines

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			Morebits.wiki.actionCompleted.redirect = "Wikipedia:Usernames for administrator attention";
			Morebits.wiki.actionCompleted.notice = "Reporting complete";

			var uaaPage = new Morebits.wiki.page( 'Wikipedia:Usernames for administrator attention', 'Processing UAA request' );
			uaaPage.setFollowRedirect( true );

			uaaPage.load( function() {
				var text = uaaPage.getPageText();
				
				// check if user has already been reported
				if (new RegExp( "\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?" + RegExp.escape(uid, true) + "\\s*(\\||\\})" ).test(text)) {
					uaaPage.getStatusElement().error( 'User is already listed.' );
					return;
				}
				uaaPage.getStatusElement().status( 'Adding new report...' );
				uaaPage.setEditSummary( 'Reporting [[Special:Contributions/' + uid + '|' + uid + ']].'+ Twinkle.getPref('summaryAd') );
				uaaPage.setPageText( text.replace( /List begins below this line.\s*-->\s*/, "List begins below this line.\n-->\n" + reason + "\n\n" ) );  // add at top
				uaaPage.save();
			} );
			break;
			
		// WP:SPI
		case "sock":
			/* falls through */
		case "puppet":
			var sockParameters = {
				evidence: form.evidence.value.trimRight(), 
				checkuser: form.checkuser.checked, 
				notify: form.notify.checked
			};

			var puppetReport = form.category.value === "puppet";
			if (puppetReport && !(form.sockmaster.value.trim())) {
				if (!confirm("You have not entered a sockmaster account for this puppet. Do you want to report this account as a sockpuppeteer instead?")) {
					return;
				}
				puppetReport = false;
			}

			sockParameters.uid = puppetReport ? form.sockmaster.value.trimRight() : uid;
			sockParameters.sockpuppets = puppetReport ? [uid] : $.map( $('input:text[name=sockpuppet]',form), function(o){ return $(o).val(); });

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );
			Twinkle.arv.processSock( sockParameters );
			break;

		  case 'an3':

			function extractDiffID(diff) {
			  var matched = diff.match(/diff=(\d+)/);
			  if(!matched) {
				diffid = diff.replace(/\D/g,'');
			  } else {
				diffid = matched[1];
			  }
			  return diffid;
			}

			var an3Parameters = {
			  'uid': uid,
			  'page': form.page.value.trim(),
			  'comment': form.comment.value.trim(),
			  'diffs': $.map( $('input:checkbox[name=s_diffs]:checked',form), function(o){ return $(o).data('revinfo'); }),
			  'warnings': $.map( $('input:checkbox[name=s_warnings]:checked',form), function(o){ return $(o).data('revinfo'); }),
			  'resolves': $.map( $('input:checkbox[name=s_resolves]:checked',form), function(o){ return $(o).data('revinfo'); })
			}
			console.log("Result:", an3Parameters);

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );
			Twinkle.arv.processAN3( an3Parameters );
			break;
	}
};

Twinkle.arv.processSock = function( params ) {
	Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"
	
	// notify all user accounts if requested
	if (params.notify && params.sockpuppets.length>0) {
	
		var notifyEditSummary = "Notifying about suspicion of sockpuppeteering." + Twinkle.getPref('summaryAd');
		var notifyText = "\n\n{{subst:socksuspectnotice|1=" + params.uid + "}} ~~~~";
		
		// notify user's master account
		var masterTalkPage = new Morebits.wiki.page( 'User talk:' + params.uid, 'Notifying suspected sockpuppeteer' );
		masterTalkPage.setFollowRedirect( true );
		masterTalkPage.setEditSummary( notifyEditSummary );
		masterTalkPage.setAppendText( notifyText );
		masterTalkPage.append();

		var statusIndicator = new Morebits.status( 'Notifying suspected sockpuppets', '0%' );
		var total = params.sockpuppets.length;
		var current =   0;
		
		// display status of notifications as they progress
		var onSuccess = function( sockTalkPage ) {
			var now = parseInt( 100 * ++(current)/total, 10 ) + '%';
			statusIndicator.update( now );
			sockTalkPage.getStatusElement().unlink();
			if ( current >= total ) {
				statusIndicator.info( now + ' (completed)' );
			}
		};
		
		var socks = params.sockpuppets;

		// notify each puppet account
		for( var i = 0; i < socks.length; ++i ) {
			var sockTalkPage = new Morebits.wiki.page( 'User talk:' + socks[i], "Notification for " +  socks[i] );
			sockTalkPage.setFollowRedirect( true );
			sockTalkPage.setEditSummary( notifyEditSummary );
			sockTalkPage.setAppendText( notifyText );
			sockTalkPage.append( onSuccess );
		}
	}

	// prepare the SPI report
	var text = "\n\n{{subst:SPI report|socksraw=" +
		params.sockpuppets.map( function(v) { 
				return "* {{" + ( Morebits.isIPAddress( v ) ? "checkip" : "checkuser" ) + "|1=" + v + "}}";
			} ).join( "\n" ) + "\n|evidence=" + params.evidence + " \n";
		
	if ( params.checkuser ) {
		text += "|checkuser=yes";
	}
	text += "}}";

	var reportpage = 'Wikipedia:Sockpuppet investigations/' + params.uid;

	Morebits.wiki.actionCompleted.redirect = reportpage;
	Morebits.wiki.actionCompleted.notice = "Reporting complete";

	var spiPage = new Morebits.wiki.page( reportpage, 'Retrieving discussion page' );
	spiPage.setFollowRedirect( true );
	spiPage.setEditSummary( 'Adding new report for [[Special:Contributions/' + params.uid + '|' + params.uid + ']].'+ Twinkle.getPref('summaryAd') );
	spiPage.setAppendText( text );
	spiPage.append();
	
	Morebits.wiki.removeCheckpoint();  // all page updates have been started
};

Twinkle.arv.processAN3 = function( params ) {
  // prepare the AN3 report
  var sha1, minid;
  for(var i = 0; i < params.diffs.length; ++i) {
	if( params.diffs[i].parentid && (!minid || params.diffs[i].parentid < minid)) {
	  minid = params.diffs[i].parentid;
	  sha1 = params.diffs[i].sha1;
	}
  }

  var api = new mw.Api();
  api.get({
	action: 'query',
	prop: 'revisions',
	format: 'json',
	rvprop: 'sha1|ids|timestamp|comment',
	rvlimit: 100,
	rvstartid: minid,
	rvexcludeuser: params.uid,
	indexpageids: true,
	redirects: true,
	titles: params.page
  }).done(function(data){
	Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"
	var orig;
	for(var i = 0; i < data.length; ++i) {
	  if(data[i].sha1 == sha1) {
		orig = data[i];
		break;
	  }
	}

	origtext = "";
	if(orig) {
	  origtext = '{{diff2|' + orig.revid + '|' + orig.timestamp + '}} "' + orig.comment + '"';
	}

	var difftext = params.diffs.map(function(v){
	  return '# ' + ' {{diff2|' + v.revid + '|' + v.timestamp + '}} "' + v.comment + '"'
	}).join("\n");
	var warningtext = params.warnings.map(function(v){
	  return '# ' + ' {{diff2|' + v.revid + '|' + v.timestamp + '}} "' + v.comment + '"'
	}).join("\n");
	var resolvetext = params.resolves.map(function(v){
	  return '# ' + ' {{diff2|' + v.revid + '|' + v.timestamp + '}} "' + v.comment + '"'
	}).join("\n");

	var text = "\n\n"+'{{subst:AN3 report|diffs='+difftext+'|warnings='+warningtext+'|resolves='+resolvetext+'|pagename='+params.page+'|orig='+origtext+'|comment='+params.comment+'|uid='+params.uid+'}}';

	var reportpage = 'Wikipedia:Administrators\' noticeboard/Edit warring';

	Morebits.wiki.actionCompleted.redirect = reportpage;
	Morebits.wiki.actionCompleted.notice = "Reporting complete";

	var an3Page = new Morebits.wiki.page( reportpage, 'Retrieving discussion page' );
	an3Page.setFollowRedirect( true );
	an3Page.setEditSummary( 'Adding new report for [[Special:Contributions/' + params.uid + '|' + params.uid + ']].'+ Twinkle.getPref('summaryAd') );
	an3Page.setAppendText( text );
	an3Page.append();

	// notify user

	var notifyEditSummary = "Notifying about edit warring noticeboard discussion." + Twinkle.getPref('summaryAd');
	var notifyText = "\n\n{{subst:an3-notice|1=" + params.uid + "|auto=1}} ~~~~";

	var talkPage = new Morebits.wiki.page( 'User talk:' + params.uid, 'Notifying edit warrior' );
	talkPage.setFollowRedirect( true );
	talkPage.setEditSummary( notifyEditSummary );
	talkPage.setAppendText( notifyText );
	talkPage.append();
	Morebits.wiki.removeCheckpoint();  // all page updates have been started
  }).fail(function(data){
	console.log( 'API failed :(', error );
  });

}
})(jQuery);


//</nowiki>
