function twinkleprotect() {
	if( wgNamespaceNumber < 0 ) {
		return;
	}

	if( userIsInGroup( 'sysop' ) ) {
		twAddPortletLink( "javascript:twinkleprotect.callback()", "PP", "tw-rpp", "Protect page", "");
	} 
	else if (Twinkle.authorizedUser) {
		twAddPortletLink( "javascript:twinkleprotect.callback()", "RPP", "tw-rpp", "Request page protection", "");
	}
	else {
		twAddPortletLink( 'javascript:alert("Your account is too new to use Twinkle.");', 'RPP', 'tw-rpp', 'Request page protection', '');
	}
	
	/**
	 TwinkleConfig.protectionSummaryAd (string)
	 If ad should be added or not to protection summary
	 */
	if( typeof( TwinkleConfig.protectionSummaryAd ) === 'undefined' ) {
		TwinkleConfig.protectionSummaryAd = TwinkleConfig.summaryAd;
	}
}

twinkleprotect.callback = function twinkleprotectCallback() {
	var Window = new SimpleWindow( 600, 400 );
	Window.setTitle( "Protection of pages" );
	var form = new QuickForm( twinkleprotect.callback.evaluate );
	if( userIsInGroup( 'sysop' ) ) {
		form.append( {
				type: 'checkbox',
				name: 'request_only',
				event: twinkleprotect.callback.disabledefaults,
				list: [
					{
						label: 'Request protection',
						value: 'request_only',
						tooltip: 'If you want to request protection via WP:RPP instead of doing the protection by your self.'
					}
				]
			} );
	}
	form.append( {
			type: 'select',
			name: 'category',
			label: 'Type of protection: ',
			event: twinkleprotect.callback.disabledefaults,
			list: [
				{
					label: 'Full protection',
					list: [
						{ label: 'Generic', value: 'pp-protected' },
						{ label: 'Dispute', selected: wgCurRevisionId != false, value: 'pp-dispute' },
						{ label: 'Vandalism', value: 'pp-vandalism' },
						{ label: 'High-visibility template', value: 'pp-template' },
						{ label: 'User talk of blocked user', value: 'pp-usertalk' }
					]
				},
				{
					label: 'Semi-protection',
					list: [
						{ label: 'Generic', value: 'pp-semi-protected' },
						{ label: 'Vandalism', value: 'pp-semi-vandalism' },
						{ label: 'High-visibility template', value: 'pp-semi-template' },
						{ label: 'User talk of blocked user', value: 'pp-semi-usertalk' },
						{ label: 'Spambot target', value: 'pp-semi-spambot' }
					]
				},
				{
					label: 'Other',
					list: [
						{ label: 'Move-protection', value: 'pp-move' },
						{ label: 'Create-protection', selected: wgCurRevisionId == false , value: 'pp-create' },
						{ label: 'Unprotection', value: 'unprotect' }
					]
				}
			]
		} );
	var flags = form.append( {
			type: 'field',
			label: 'Options'
		} );

	flags.append( {
			type: 'checkbox',
			list: [
				{
					name: 'noinclude',
					label: 'Wrap <noinclude>',
					tooltip: 'Will wrap the template in <noinclude> tags, so that it won\'t transclude',
					disabled:!userIsInGroup( 'sysop' ),
					checked:(wgNamespaceNumber==10),
					adminonly: true
				},
				{ 
					name: 'small',
					label: 'Iconify',
					tooltip: 'Will use the |small=yes feature of the template, and only render it as a keylock',
					disabled:!userIsInGroup( 'sysop' ),
					adminonly: true
				},
				{
					name: 'cascade',
					label: 'Cascade protection',
					tooltip: 'Cascade protection will protect all pages that is transcluded into said page'
				}
			]
		} );

	if( userIsInGroup( 'sysop' ) ) {
		form.append( {
				type: 'select',
				name: 'expiry',
				label: 'Expiration: ',
				list: [
					{ label: '1 hour', value: '1 hour' },
					{ label: '2 hours', value: '2 hours' },
					{ label: '3 hours', value: '3 hours' },
					{ label: '6 hours', value: '6 hours' },
					{ label: '12 hours', value: '12 hours' },
					{ label: '1 day', value: '1 day' },
					{ label: '2 days', value: '2 days' },
					{ label: '3 days', value: '3 days' },
					{ label: '4 days', value: '4 days' },
					{ label: '5 days', value: '5 days' },
					{ label: '6 days', value: '6 days' },
					{ label: '1 week', value: '1 week' },
					{ label: '2 weeks', value: '2 weeks' },
					{ label: '1 month', value: '1 month' },
					{ label: '2 months', value: '2 months' },
					{ label: '3 months', value: '3 months' },
					{ label: '6 months', value: '6 months' },
					{ label: '1 year', value: '1 year' },
					{ label: 'indefinite', selected: true, value:'indefinite' }
				]
			} );
	} else {
		form.append( {
				type: 'select',
				name: 'expiry',
				label: 'Expiration: ',
				list: [
					{ label: 'temporary', value: 'temporary' },
					{ label: 'indefinite', value: 'indefinite' },
					{ label: '', selected: true, value:'' }
				]
			} );
	}
	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason: '
		} );
	form.append( { type:'submit' } );
	var result = form.render();
	Window.setContent( result );
	Window.display();
}


twinkleprotect.callback.disabledefaults = function twinkleprotectCallbackDisableDefaults(e) {
	var root = e.target.form;
	if( e.target.value == 'unprotect' ) {
		root.noinclude.disabled = true;
		root.cascade.disabled = true;
		root.expiry.disabled = true;
		root.small.disabled = true;
	} else {
		root.noinclude.disabled = true;
		root.cascade.disabled = false;
		root.expiry.disabled = false;
		root.small.disabled = true;
		if( userIsInGroup( 'sysop' ) && !root.request_only.checked )
		{
			root.small.disabled = false;
			root.noinclude.disabled = false;
		}
	}

	if( /template/.test( e.target.value ) ) {
		root.noinclude.checked = true;
		root.expiry.disabled = true;
	} else {
		root.noinclude.checked = false;
	}

}

twinkleprotect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;

	var params = {
		noinclude: form.noinclude.checked,
		cascade: form.cascade.checked,
		small: form.small.checked,
		reason: form.reason.value,
		expiry: form.expiry.value,
		type: form.category.value
	}

	if( userIsInGroup( 'sysop') ) {
		var request_only = form.request_only.checked;
		if( request_only && params.expiry != 'indefinite' ) {
			params.expiry = 'temporary';
		}
	}

	Status.init( form );

	if( userIsInGroup( 'sysop' ) && ! request_only ) {

		var edit, move, tag = params.type, reason, create = '';
		switch( tag ) {
		case 'pp-dispute':
			edit = 'sysop';
			move = 'sysop';
			reason = 'Full protection: dispute';
			break;
		case 'pp-vandalism':
			edit = 'sysop';
			move = 'sysop';
			reason = 'Full protection: vandalism';
			break;
		case 'pp-template':
			edit = 'sysop';
			move = 'sysop';
			reason = 'Full protection: high-visibility template';
			break;
		case 'pp-usertalk':
			edit = 'sysop';
			move = 'sysop';
			reason = 'Full protection: user talk of blocked user';
			break;
		case 'pp-protected':
			edit = 'sysop';
			move = 'sysop';
			if( params.reason ) {
				tag += '|reason=' + params.reason;
				params.reason = undefined;
			}
			reason = 'Full protection';
			break;
		case 'pp-semi-vandalism':
			edit = 'autoconfirmed';
			move = 'autoconfirmed';
			reason = 'Semi-protection: vandalism';
			break;
		case 'pp-semi-usertalk':
			edit = 'autoconfirmed';
			move = 'autoconfirmed';
			reason = 'Semi-protection: user talk of blocked user';
			break;
		case 'pp-semi-template':
			edit = 'autoconfirmed';
			move = 'autoconfirmed';
			reason = 'Semi-protection: high-visibility template';
			break;
		case 'pp-semi-spambot':
			edit = 'autoconfirmed';
			move = 'autoconfirmed';
			reason = 'Semi-protection: spambot target';
			break;
		case 'pp-semi-protected':
			edit = 'autoconfirmed';
			move = 'autoconfirmed';
			if( params.reason ) {
				tag += '|reason=' + params.reason;
				params.reason = undefined;
			}
			reason = 'Semi-protection';
			break;
		case 'pp-move':
			edit = '';
			move = 'sysop';
			reason = 'Move-protection';
			break;
		case 'pp-create':
			edit = '';
			move = '';
			create = 'sysop';
			reason = 'Create-protection';
			break;

		case 'unprotect':
		default:
			edit = '';
			move = '';
			reason = 'Unprotection';
			break;
		}
		if( params.reason ) {
			reason += ', ' + params.reason;
		}
		if( reason != '' && reason.charAt( reason.length - 1 ) != '.' ) {
			reason += '.';
		}

		params.reason = reason;
		params.tag = tag;
		params.edit = edit;
		params.move = move;
		params.create = create;
		
		var query = {
			'title': wgPageName,
			'action': 'protect'
		};

		// Updating data for the action completed event
		Wikipedia.actionCompleted.redirect = query['title'];
		Wikipedia.actionCompleted.notice = "Done...";
		
		var wikipedia_wiki = new Wikipedia.wiki( 'Protecting page', query, twinkleprotect.callbacks.sysop.protectingPage );
		wikipedia_wiki.params = params;
		wikipedia_wiki.get();
	} else {	
		var typename, reason;
			switch( params.type ) {
			case 'pp-dispute':
			case 'pp-vandalism':
			case 'pp-template':
			case 'pp-usertalk':
			case 'pp-protected':
				typename = 'full protection';
				break;
			case 'pp-semi-vandalism':
			case 'pp-semi-usertalk':
			case 'pp-semi-template':
			case 'pp-semi-spambot':
			case 'pp-semi-protected':
				typename = 'semi-protection';
				break;
			case 'pp-move':
				typename = 'move-protection';
				break;
			case 'pp-create':
				typename = 'create-protection';
				break;
			case 'unprotect':
			default:
				typename = 'Unprotection';
				break;
		}
		
		switch( params.type ) {
			case 'pp-dispute':
				reason = 'dispute';
				break;
			case 'pp-vandalism':
			case 'pp-semi-vandalism':
				reason = 'vandalism';
				break;
			case 'pp-template':
			case 'pp-semi-template':
				reason = 'high-visibility template';
				break;
			case 'pp-usertalk':
			case 'pp-semi-usertalk':
				reason = 'user talk of blocked user';
				break;
			case 'pp-semi-spambot':
				reason = 'spambot target';
				break;
			case 'pp-protected':
			case 'pp-semi-protected':
			case 'pp-move':
			case 'pp-create':
			case 'unprotect':
			default:
				reason = '';
				break;
		}
		
		if( reason != '' ) {
			reason = " ''" + reason + "''";
		}
		if( params.reason ) {
			reason += ', ' + params.reason;
		}
		if( reason != '' && reason.charAt( reason.length - 1 ) != '.' ) {
			reason += '.';
		}

		params.reason = reason;
		params.typename = typename;

		var query = {
			'title': 'Wikipedia:Requests for page protection',
			'action': 'submit'
		};
		// Updating data for the action completed event
		Wikipedia.actionCompleted.redirect = query['title'];
		Wikipedia.actionCompleted.notice = "Nomination completed, redirecting now to the discussion page";

		var wikipedia_wiki = new Wikipedia.wiki( 'Requesting protection of page', query, twinkleprotect.callbacks.user );
		wikipedia_wiki.params = params;
		wikipedia_wiki.followRedirect = true;
		wikipedia_wiki.get();
	}
}

twinkleprotect.callbacks = {
	sysop: {
		taggingPage: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var oldtag_re = /\s*(?:<noinclude>)?\s*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;

			var text = form.wpTextbox1.value;

			text = text.replace( oldtag_re, '' );

			if( self.params.type != 'unprotect' && self.params.expiry != 'indefinite' ) {
				self.params.tag += '|expiry={' + '{subst:#time:F j, Y|+' + self.params.expiry +'}}';
				if( self.params.small ) {
					self.params.tag += '|small=yes';
				}
			}

			var summary;
			if( self.params.type == 'unprotect' ) {
				summary = 'removing protection template' + TwinkleConfig.summaryAd;
			} else {
				if( self.params.noinclude ) {
					text = "<noinclude>\{\{" + self.params.tag + "\}\}</noinclude>" + text;
				} else {
					text = "\{\{" + self.params.tag + "\}\}\n" + text;
				}
				summary = "adding \{\{" + self.params.tag + "\}\}" + TwinkleConfig.summaryAd;

			}
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSummary': summary,
				'wpTextbox1': text
			};

			self.post( postData );
		},
		protectingPage: function( self ){
			var form  = self.responseXML.getElementById( 'mw-Protect-Form' );
			var postData;
			
			if( self.params.type == 'pp-move' ) {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-move': self.params.move,
					'wpProtectExpirySelection-move': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-move': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};
			
			} else if( self.params.type == 'pp-create' ) {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-create': self.params.create,
					'wpProtectExpirySelection-create': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-create': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};
			
			} else if( self.params.type == 'unprotect' ) {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-edit': self.params.edit,
					'wpProtectExpirySelection-edit': 'indefinite',
					'mwProtect-level-move': self.params.move,
					'wpProtectExpirySelection-move': 'indefinite',
					'mwProtect-level-create': self.params.create,
					'wpProtectExpirySelection-create': 'indefinite',
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};
			} else {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-edit': self.params.edit,
					'wpProtectExpirySelection-edit': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-edit': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-level-move': self.params.move,
					'wpProtectExpirySelection-move': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-move': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};
			}

			self.post( postData );
		
			var query = {
				'title': wgPageName,
				'action': 'submit'
			};
			if( self.params.create == '' ) {
				var wikipedia_wiki = new Wikipedia.wiki( 'Tagging page', query, twinkleprotect.callbacks.sysop.taggingPage );
				wikipedia_wiki.params = self.params;
				wikipedia_wiki.get();
			}
		}
	},
	user: function( self ) {
		var form = self.responseXML.getElementById( 'editform' );

		var text = form.wpTextbox1.value;

		var ns2tag	=	{
			'0'	:	'la',
			'1'	:	'lat',
			'2'	:	'lu',
			'3'	:	'lut',
			'4'	:	'lw',
			'5'	:	'lwt',
			'6'	:	'li',
			'7'	:	'lit',
			'8'	:	'lm',
			'9'	:	'lmt',
			'10':	'lt',
			'11':	'ltt',
			'12':	'lh',
			'13':	'lht',
			'14':	'lc',
			'15':	'lct',
			'100':	'lp',
			'101':	'lpt'
		};

		var rppRe = new RegExp( '====\\s*\\{\\{\\s*' + ns2tag[ wgNamespaceNumber ] + '\\s*\\|\\s*' + RegExp.escape( wgTitle, true ) + '\\s*\\}\\}\\s*====', 'm' );
		var tag = rppRe.exec( text );

		if( tag ) {
			self.statelem.warn( [ htmlNode( 'strong', tag[0] ) , " is already placed on the page." ] )
			return false;
		}

		var newtag = '==== \{\{' + ns2tag[ wgNamespaceNumber ] + '|' + wgTitle +  '\}\} ====' + "\n";
		if( ( new RegExp( '^' + RegExp.escape( newtag ).replace( /\s+/g, '\\s*' ), 'm' ) ).test( text ) ) {
			self.statelem.error( 'There are already a protection request for this page, aborting.' );
			return;
		}
		var words = [];
		switch( self.params.expiry ) {
		case 'temporary':
			words.push( "Temporary" );
			break;
		case 'indefinite':
			words.push( "Indefinite" );
			break;
		}
		if( self.params.cascade ) {
			words.push( "cascading" );
		}

		words.push( self.params.typename );

		newtag += "'''" + words.join( ' ' ) + "'''" + ( self.params.reason != '' ? self.params.reason : '' ) + " \~\~\~\~";

		if( self.params.type == 'unprotect' ) {
			var reg = /(\n==\s*Current requests for unprotection\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		} else {
			var reg = /(\n==\s*Current requests for protection\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		}
		var originalTextLength= text.length;
		text = text.replace( reg, "$1" + newtag + "\n");
		if (text.length==originalTextLength)
		{
			self.statelem.error( 'The marker that identifies where the protection request is supposed to be added on WP:RFPP could not be found. Aborting ...' );
			return;
		}
		var postData = {
			'wpMinoredit': undefined,
			'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
			'wpStarttime': form.wpStarttime.value,
			'wpEdittime': form.wpEdittime.value,
			'wpAutoSummary': form.wpAutoSummary.value,
			'wpEditToken': form.wpEditToken.value,
			'wpSection': '',
			'wpSummary': "Requesting " + self.params.typename + ' of [[' + wgPageName.replace(/_/g, ' ') + ']].' + TwinkleConfig.summaryAd,
			'wpTextbox1': text
		};

		self.post( postData );
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinkleprotect", twinkleprotect );