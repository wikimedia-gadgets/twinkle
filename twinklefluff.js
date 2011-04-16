if ( typeof(Twinkle) === "undefined" ) {
	alert( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

/**
 Twinklefluff revert and antivandalism utility
 */

var twinklefluff = {
	auto: function() {
		if( QueryString.get( 'oldid' ) != wgCurRevisionId ) {
			// not latest revision
			return;
		}

		var ntitle = getElementsByClassName( document.getElementById('bodyContent'), 'td' , 'diff-ntitle' )[0];
		if( ntitle.getElementsByTagName('a')[0].firstChild.nodeValue.indexOf( 'Current revision' ) != 0 ) {
			// not latest revision
			return;
		}

		vandal = ntitle.getElementsByTagName('a')[3].firstChild.nodeValue;

		if( !TwinkleConfig.openTalkPageOnAutoRevert ) {
			TwinkleConfig.openTalkPage = [];
		}

		twinklefluff.revert( QueryString.get( 'twinklerevert' ), vandal );
	},
	normal: function() {

		var spanTag = function( color, content ) {
			var span = document.createElement( 'span' );
			span.style.color = color;
			span.appendChild( document.createTextNode( content ) );
			return span;
		}

		if( wgNamespaceNumber == -1 && wgCanonicalSpecialPageName == "Contributions" ) {
			//Get the username these contributions are for
			username = decodeURIComponent(/user=(.+)/.exec($('div#contentSub a[title="Special:Log"]').last().attr("href").replace(/\+/g, "%20"))[1]);
			if( TwinkleConfig.showRollbackLinks.indexOf('contribs') != -1 || ( wgUserName != username && TwinkleConfig.showRollbackLinks.indexOf('others') != -1 ) || ( wgUserName == username && TwinkleConfig.showRollbackLinks.indexOf('mine') != -1 ) ) {
				var list = $("div#bodyContent ul li:has(span.mw-uctop)");

				var revNode = document.createElement('strong');
				var revLink = document.createElement('a');
				revLink.appendChild( spanTag( 'Black', '[' ) );
				revLink.appendChild( spanTag( 'SteelBlue', 'rollback' ) );
				revLink.appendChild( spanTag( 'Black', ']' ) );
				revNode.appendChild(revLink);

				var revVandNode = document.createElement('strong');
				var revVandLink = document.createElement('a');
				revVandLink.appendChild( spanTag( 'Black', '[' ) );
				revVandLink.appendChild( spanTag( 'Red', 'vandalism' ) );
				revVandLink.appendChild( spanTag( 'Black', ']' ) );
				revVandNode.appendChild(revVandLink);

				list.each(function(key, current) {
					var href = $(current).find("a:nth-child(2)").attr("href");
					current.appendChild( document.createTextNode(' ') );
					var tmpNode = revNode.cloneNode( true );
					tmpNode.firstChild.setAttribute( 'href', href + '&' + QueryString.create( { 'twinklerevert': 'norm' } ) );
					current.appendChild( tmpNode );
					current.appendChild( document.createTextNode(' ') );
					var tmpNode = revVandNode.cloneNode( true );
					tmpNode.firstChild.setAttribute( 'href', href + '&' + QueryString.create( { 'twinklerevert': 'vand' } ) );
					current.appendChild( tmpNode );
				});
			}
		} else {
                        
			if( wgCanonicalSpecialPageName == "Special:Undelete" ) {
				//You can't rollback deleted pages!
				return;
			}


			var body = document.getElementById('bodyContent');

			var firstRev = $("div.firstrevisionheader").length;
			if( firstRev ) {
				// we have first revision here, nothing to do.
				return;
			}

			try {
				var otitle1 = document.getElementById('mw-diff-otitle1'); 
				var ntitle1 = document.getElementById('mw-diff-ntitle1'); 
				if (!otitle1 || !ntitle1) return;
				var otitle = otitle1.parentNode;
				var ntitle = ntitle1.parentNode;
			} catch( e ) {
				// no old, nor new title, nothing to do really, return;
				return;
			}

			var old_rev_url = $("div#mw-diff-otitle1 strong a").attr("href");

			// Lets first add a [edit this revision] link
			var query = new QueryString( old_rev_url.split( '?', 2 )[1] );

			var oldrev = query.get( 'oldid' );

			var revertToRevision = document.createElement('div');
			revertToRevision.setAttribute( 'id', 'tw-revert-to-orevision' );
			revertToRevision.style.fontWeight = 'bold';

			var revertToRevisionLink = revertToRevision.appendChild( document.createElement('a') );
			revertToRevisionLink.href = "javascript:twinklefluff.revertToRevision('" + oldrev + "')";
			revertToRevisionLink.appendChild( spanTag( 'Black', '[' ) );
			revertToRevisionLink.appendChild( spanTag( 'SaddleBrown', 'restore this version' ) );
			revertToRevisionLink.appendChild( spanTag( 'Black', ']' ) );

			otitle.insertBefore( revertToRevision, otitle.firstChild );

			if( document.getElementById('differences-nextlink') ) {
				// Not latest revision
				curVersion = false;

				var new_rev_url = $("div#mw-diff-ntitle1 strong a").attr("href");
				var query = new QueryString( new_rev_url.split( '?', 2 )[1] );
				var newrev = query.get( 'oldid' );
				var revertToRevision = document.createElement('div');
				revertToRevision.setAttribute( 'id', 'tw-revert-to-nrevision' );
				revertToRevision.style.fontWeight = 'bold';
				var revertToRevisionLink = revertToRevision.appendChild( document.createElement('a') );
				revertToRevisionLink.href = "javascript:twinklefluff.revertToRevision('" + newrev + "')";
				revertToRevisionLink.appendChild( spanTag( 'Black', '[' ) );
				revertToRevisionLink.appendChild( spanTag( 'SaddleBrown', 'restore this version' ) );
				revertToRevisionLink.appendChild( spanTag( 'Black', ']' ) );
				ntitle.insertBefore( revertToRevision, ntitle.firstChild );

				return;
			}
			if( TwinkleConfig.showRollbackLinks.indexOf('diff') != -1 ) {
				var vandal = $("#mw-diff-ntitle2 a").first().text().replace("'", "\\'");

				var revertNode = document.createElement('div');
				revertNode.setAttribute( 'id', 'tw-revert' );

				var agfNode = document.createElement('strong');
				var vandNode = document.createElement('strong');
				var normNode = document.createElement('strong');

				var agfLink = document.createElement('a');
				var vandLink = document.createElement('a');
				var normLink = document.createElement('a');

				agfLink.href = "javascript:twinklefluff.revert('agf' , '" + vandal + "')"; 
				vandLink.href = "javascript:twinklefluff.revert('vand' , '" + vandal + "')"; 
				normLink.href = "javascript:twinklefluff.revert('norm' , '" + vandal + "')"; 

				agfLink.appendChild( spanTag( 'Black', '[' ) );
				agfLink.appendChild( spanTag( 'DarkOliveGreen', 'rollback (AGF)' ) );
				agfLink.appendChild( spanTag( 'Black', ']' ) );

				vandLink.appendChild( spanTag( 'Black', '[' ) );
				vandLink.appendChild( spanTag( 'Red', 'rollback (VANDAL)' ) );
				vandLink.appendChild( spanTag( 'Black', ']' ) );

				normLink.appendChild( spanTag( 'Black', '[' ) );
				normLink.appendChild( spanTag( 'SteelBlue', 'rollback' ) );
				normLink.appendChild( spanTag( 'Black', ']' ) );

				agfNode.appendChild(agfLink);
				vandNode.appendChild(vandLink);
				normNode.appendChild(normLink);

				revertNode.appendChild( agfNode );
				revertNode.appendChild( document.createTextNode(' || ') );
				revertNode.appendChild( normNode );
				revertNode.appendChild( document.createTextNode(' || ') );
				revertNode.appendChild( vandNode );

				ntitle.insertBefore( revertNode, ntitle.firstChild );
			}
		}
	}
}

twinklefluff.revert = function revertPage( type, vandal, rev, page ) {

	wgPageName = page || wgPageName;
	wgCurRevisionId = rev || wgCurRevisionId;

	Status.init( document.getElementById('bodyContent') );
	var params = {
		type: type,
		user: vandal
	}
	var query = {
		'action': 'query',
		'prop': ['info', 'revisions'],
		'titles': wgPageName,
		'rvlimit': 50, // max possible
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'intoken': 'edit'
	}
	var wikipedia_api = new Wikipedia.api( 'Grabbing data of earlier revisions', query, twinklefluff.callbacks.main );
	wikipedia_api.params = params;
	wikipedia_api.post();
}

twinklefluff.revertToRevision = function revertToRevision( oldrev ) {

	Status.init( document.getElementById('bodyContent') );

	var query = {
		'action': 'query',
		'prop': ['info',  'revisions'],
		'titles': wgPageName,
		'rvlimit': 1,
		'rvstartid': oldrev,
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'intoken': 'edit',
		'format': 'xml'
	}

	var wikipedia_api = new Wikipedia.api( 'Grabbing data of the earlier revision', query, twinklefluff.callbacks.toRevision.main );
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
}

twinklefluff.userIpLink = function( user ) {
	return (isIPAddress(user)?"[[Special:Contributions/":"[[User:")+user+"|"+user+"]]";
}

twinklefluff.callbacks = {
	toRevision: {
		main: function( self ) {
			//alert("TRACE: revertTorevision getrevs callback: xmlString= \n" + (new XMLSerializer()).serializeToString(self.responseXML) + "[END]");
			var xmlDoc = self.responseXML;

			var lastrevid = $(xmlDoc).find('page').attr('lastrevid');
			var touched = $(xmlDoc).find('page').attr('touched');
			var starttimestamp = $(xmlDoc).find('page').attr('starttimestamp');
			var edittoken = $(xmlDoc).find('page').attr('edittoken');
			var revertToRevID = $(xmlDoc).find('rev').attr('revid');
			var revertToUser = $(xmlDoc).find('rev').attr('user');

			if (revertToRevID != self.params.rev) {
				self.statitem.error( 'The retrieved revision does not match the requested revision.  Aborting.' );
				return;
			}

			var optional_summary = prompt( "Please specify a reason for the revert, if possible:" );
			if (optional_summary == null)
			{
				self.statelem.error( 'Aborted by user.' );
				return;
			}
			var summary = sprintf( "Reverted to revision %d by %s%s.%s", 
				revertToRevID,
				revertToUser,
				optional_summary ? "; " + optional_summary : '',
				TwinkleConfig.summaryAd
			);
		
			var query = {  // ##################################### New stuff ######################################
				'action': 'edit',
				'title': wgPageName,
				'summary': summary,
				'token': edittoken,
				'undo': lastrevid,
				'undoafter': revertToRevID,
				'basetimestamp': touched,
				'starttimestamp': starttimestamp,
				'watchlist' :  TwinkleConfig.watchRevertedPages.indexOf( self.params.type ) != -1 ? 'watch' : undefined,
				'minor': TwinkleConfig.markRevertedPagesAsMinor.indexOf( self.params.type ) != -1  ? true : undefined
			};

			Wikipedia.actionCompleted.redirect = wgPageName;
			Wikipedia.actionCompleted.notice = "Reversion completed";

			var wikipedia_api = new Wikipedia.api( 'Saving reverted contents', query, twinklefluff.callbacks.toRevision.complete, self.statelem);
			wikipedia_api.params = self.params;
			wikipedia_api.post();

		},
		complete: function (self) {
			//alert("TRACE: revertPage getrevs callback: xmlString= \n" + (new XMLSerializer()).serializeToString(self.responseXML) + "[END]");
		}
	},
	main: function( self ) {
		//alert("TRACE: revertPage getrevs callback: xmlString= \n" + (new XMLSerializer()).serializeToString(self.responseXML) + "[END]");
		var xmlDoc = self.responseXML;

		var lastrevid = $(xmlDoc).find('page').attr('lastrevid');
		var touched = $(xmlDoc).find('page').attr('touched');
		var starttimestamp = $(xmlDoc).find('page').attr('starttimestamp');
		var edittoken = $(xmlDoc).find('page').attr('edittoken');
		var lastuser = $(xmlDoc).find('rev').attr('user');

		var revs = xmlDoc.evaluate( '//rev', xmlDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

		if( revs.snapshotLength < 1 ) {
			self.statitem.error( 'We have less than one additional revision, thus impossible to revert' );
			return;
		}
		var top = revs.snapshotItem(0);
		if( lastrevid < wgCurRevisionId ) {
			Status.error( 'Error', [ 'The most recent revision ID received from the server, ', htmlNode( 'strong', lastrevid ), ', is less than the ID of the displayed revision. This could indicate that the current revision has been deleted, the server is lagging, or that bad data has been received. Will stop proceeding at this point.' ] );
			return;
		}
		var index = 1;
		if( wgCurRevisionId != lastrevid  ) {
			Status.warn( 'Warning', [ 'Latest revision ', htmlNode( 'strong', lastrevid ), ' doesn\'t equal our revision ', htmlNode( 'strong', wgCurRevisionId) ] );
			if( lastuser == self.params.user ) {
				switch( self.params.type ) {
				case 'vand':
					Status.info( 'Info', [ 'Latest revision was made by ', htmlNode( 'strong', self.params.user ) , '. As we assume vandalism, we continue to revert' ]);
					break;
				case 'agf':
					Status.warn( 'Warning', [ 'Latest revision was made by ', htmlNode( 'strong', self.params.user ) , '. As we assume good faith, we stop reverting, as the problem might have been fixed.' ]);
					return;
				default:
					Status.warn( 'Notice', [ 'Latest revision was made by ', htmlNode( 'strong', self.params.user ) , ', but we will stop reverting anyway.' ] );
					return;
				}
			}
			else if( 
				self.params.type == 'vand' && 
				twinklefluff.whiteList.indexOf( top.getAttribute( 'user' ) ) != -1 && revs.snapshotLength > 1 &&
				revs.snapshotItem(1).getAttribute( 'pageId' ) == wgCurRevisionId 
			) {
				Status.info( 'Info', [ 'Latest revision was made by ', htmlNode( 'strong', lastuser ), ', a trusted bot, and the revision before was made by our vandal, so we proceed with the revert.' ] );
				index = 2;
			} else {
				Status.error( 'Error', [ 'Latest revision was made by ', htmlNode( 'strong', lastuser ), ', so it might have already been reverted, stopping  reverting.'] );
				return;
			}

		}

		if( twinklefluff.whiteList.indexOf( self.params.user ) != -1  ) {
			switch( self.params.type ) {
			case 'vand':
				Status.info( 'Info', [ 'Vandalism revert was chosen on ', htmlNode( 'strong', self.params.user ), '. As this is a whitelisted bot, we assume you wanted to revert vandalism made by the previous user instead.' ] );
				index = 2;
				vandal = revs.snapshotItem(1).getAttribute( 'user' );
				self.params.user = revs.snapshotItem(1).getAttribute( 'user' );
				break;
			case 'agf':
				Status.warn( 'Notice', [ 'Good faith revert was chosen on ', htmlNode( 'strong', self.params.user ), '. This is a whitelisted bot, it makes no sense at all to revert it as a good faith edit, will stop reverting.' ] );
				return;

				break;
			case 'norm':
			default:
				var cont = confirm( 'Normal revert was chosen, but the most recent edit was made by a whitelisted bot (' + self.params.user + '). Do you want to revert the revision before instead?' );
				if( cont ) {
					Status.info( 'Info', [ 'Normal revert was chosen on ', htmlNode( 'strong', self.params.user ), '. This is a whitelisted bot, and per confirmation, we\'ll revert the previous revision instead.' ] );
					index = 2;
					self.params.user = revs.snapshotItem(1).getAttribute( 'user' );
				} else {
					Status.warn( 'Notice', [ 'Normal revert was chosen on ', htmlNode( 'strong', self.params.user ), '. This is a whitelisted bot, but per confirmation, revert on top revision will proceed.' ] );
				}
				break;
			}
		}
		var found = false;
		var count = 0;

		for( var i = index; i < revs.snapshotLength; ++i ) {
			++count;
			if( revs.snapshotItem(i).getAttribute( 'user' ) != self.params.user ) {
				found = i;
				break;
			}
		}


		if( ! found ) {
			self.statelem.error( [ 'No previous revision found. Perhaps ', htmlNode( 'strong', self.params.user ), ' is the only contributor, or that the user has made more than ' + TwinkleConfig.revertMaxRevisions + ' edits in a row.' ] );
			return;

		}

		if( count == 0 ) {
			Status.error( 'Error', "We were to revert zero revisions. As that makes no sense, we'll stop reverting this time. It could be that the edit has already been reverted, but the revision ID was still the same." );
			return;
		}

		var good_revision = revs.snapshotItem( found );

		if( 
			self.params.type != 'vand' && 
			count > 1  && 
			!confirm( self.params.user + ' has made ' + count + ' edits in a row. Are you sure you want to revert them all?' ) 
		) {
			Status.info( 'Notice', 'Stopping reverting per user input' );
			return;
		}

		self.params.count = count;

		self.params.goodid = good_revision.getAttribute( 'revid' );
		self.params.gooduser = good_revision.getAttribute( 'user' );

		self.statelem.status( [ ' revision ', htmlNode( 'strong', self.params.goodid ), ' that was made ', htmlNode( 'strong', count ), ' revisions ago by ', htmlNode( 'strong', self.params.gooduser ) ] );

		var summary;

		switch( self.params.type ) {
		case 'agf':
			var extra_summary = prompt( "An optional comment for the edit summary:" );
			if (extra_summary == null)
			{
				self.statelem.error( 'Aborted by user.' );
				return;
			}

			summary = sprintf( "Reverted [[WP:AGF|good faith]] edits by [[Special:Contributions/%s|%1$s]] ([[User talk:%1$s|talk]])%s%s", 
				self.params.user.replace("\\'", "'"), 
				twinklefluff.formatSummaryPostfix(extra_summary),
				TwinkleConfig.summaryAd
			);
			break;
		case 'vand':
			summary = sprintf( "Reverted %d %s by [[Special:Contributions/%s|%3$s]] ([[User talk:%3$s|talk]]) identified as [[WP:VAND|vandalism]] to last revision by %s.%s", 
				self.params.count, 
				self.params.count > 1 ? 'edits': 'edit',
				self.params.user.replace("\\'", "'"),
				self.params.gooduser.replace("\\'", "'"),
				TwinkleConfig.summaryAd
			);
			break;
		case 'norm':
			if( TwinkleConfig.offerReasonOnNormalRevert ) {
				var extra_summary = prompt( "An optional comment for the edit summary:" );
				if (extra_summary == null)
				{
					self.statelem.error( 'Aborted by user.' );
					return;
				}
			}
			summary = sprintf( "Reverted %d %s by [[Special:Contributions/%s|%3$s]] ([[User talk:%3$s|talk]])%s%s", 
				self.params.count, 
				self.params.count > 1 ? 'edits': 'edit',
				self.params.user.replace("\\'", "'"),
				twinklefluff.formatSummaryPostfix(extra_summary),
				TwinkleConfig.summaryAd 
			);
		}

		if( TwinkleConfig.openTalkPage.indexOf( self.params.type ) != -1 ) {
			Status.info( 'Info', [ 'Opening user talk page edit form for user ', htmlNode( 'strong', self.params.user ) ] );
			
			var query = {
				'title': 'User talk:' + self.params.user,
				'action': 'edit',
				'preview': 'yes',
				'vanarticle': wgPageName.replace(/_/g, ' '),
				'vanarticlerevid': wgCurRevisionId,
				'vanarticlegoodrevid': self.params.goodid,
				'type': self.params.type,
				'count': self.params.count
			};

			switch( TwinkleConfig.userTalkPageMode ) {
			case 'tab':
				window.open( wgServer + wgScriptPath + '/index.php?' + QueryString.create( query ), '_tab' );
				break;
			case 'blank':
				window.open( wgServer + wgScriptPath + '/index.php?' + QueryString.create( query ), '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			case 'window':
			default:
				window.open( wgServer + wgScriptPath + '/index.php?' + QueryString.create( query ), 'twinklewarnwindow', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			}
		}
		
		var query = {  // ##################################### New stuff ######################################
			'action': 'edit',
			'title': wgPageName,
			'summary': summary,
			'token': edittoken,
			'undo': lastrevid,
			'undoafter': self.params.goodid,
			'basetimestamp': touched,
			'starttimestamp': starttimestamp,
			'watchlist' :  TwinkleConfig.watchRevertedPages.indexOf( self.params.type ) != -1 ? 'watch' : undefined,
			'minor': TwinkleConfig.markRevertedPagesAsMinor.indexOf( self.params.type ) != -1  ? true : undefined
		};

		Wikipedia.actionCompleted.redirect = wgPageName;
		Wikipedia.actionCompleted.notice = "Reversion completed";

		var wikipedia_api = new Wikipedia.api( 'Saving reverted contents', query, twinklefluff.callbacks.complete, self.statelem);
		wikipedia_api.params = self.params;
		wikipedia_api.post();

	},
	complete: function (self) {
		//alert("TRACE: revertPage completion callback: xmlString= \n" + (new XMLSerializer()).serializeToString(self.responseXML) + "[END]");
		self.statelem.info("done");
	}
}

twinklefluff.formatSummaryPostfix = function(stringToAdd) {
	if (stringToAdd) {
		stringToAdd = '; ' + stringToAdd.toUpperCaseFirstChar();
		if (stringToAdd.search(/[.?!;]$/) == -1) {
			stringToAdd = stringToAdd + '.';
		}
		return stringToAdd;
	}
	else {
		return '.';
	}
}

function twinklefluffinit() {
	if (twinkleUserAuthorized)
	{
		// a list of usernames, usually only bots, that vandalism revert is jumped over, that is
		// if vandalism revert was chosen on such username, then it's target is on the revision before.
		// This is for handeling quick bots that makes edits seconds after the original edit is made.
		// This only affect vandalism rollback, for good faith rollback, it will stop, indicating a bot 
		// has no faith, and for normal rollback, it will rollback that edit.
		twinklefluff.whiteList = [
			'HagermanBot',
			'SineBot',
			'HBC AIV helperbot',
			'HBC AIV helperbot2',
			'HBC AIV helperbot3',
		]

		if ( QueryString.exists( 'twinklerevert' ) ) {
			twinklefluff.auto();
		} else {
			twinklefluff.normal();
		}
	}
};

// register initialization callback
Twinkle.init.moduleReady( "twinklefluff", twinklefluffinit );