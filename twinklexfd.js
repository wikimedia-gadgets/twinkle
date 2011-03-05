// If TwinkleConfig aint exist.
if( typeof( TwinkleConfig ) == 'undefined' ) {
	TwinkleConfig = {};
}

/**
 TwinkleConfig.xfdWatchDiscussion (string)
 The watchlist setting of the newly created XfD page. Either "yes", "no", or "default". Default is "default" (Duh).
 */
if( typeof( TwinkleConfig.xfdWatchDiscussion ) == 'undefined' ) {
	TwinkleConfig.xfdWatchDiscussion = "default";
}

/**
 TwinkleConfig.xfdWatchPage (string)
 The watchlist setting of the page listed for XfD. Either "yes", "no", or "default". Default is "default" (Duh).
 */
if( typeof( TwinkleConfig.xfdWatchPage) == 'undefined' ) {
	TwinkleConfig.xfdWatchPage= "default";
}

/**
 TwinkleConfig.xfdWatchUser (string)
 The watchlist setting of the user if he receives a notification. Either "yes", "no", or "default". Default is "default" (Duh).
 */
if( typeof( TwinkleConfig.xfdWatchUser ) == 'undefined' ) {
	TwinkleConfig.xfdWatchUser = "default";
}

/**
 TwinkleConfig.xfdWatchList (string)
 The watchlist setting of xfd list page, *if* the discussion is on a separate page. Either "yes", "no", or "default". Default is "no" (Hehe. Seriously though, who wants to watch it? Sorry in advance for any false positives.).
 */
if( typeof( TwinkleConfig.xfdWatchList ) == 'undefined' ) {
	TwinkleConfig.xfdWatchList = "no";
}

/**
 TwinkleConfig.xfdWatchUsages (string)
 The watchlist setting of usages of the tagged page (image, usually). Either "yes", "no", or "default". Default is "no".
 */
if( typeof( TwinkleConfig.xfdWatchUsages ) == 'undefined' ) {
	TwinkleConfig.xfdWatchUsages = "no";
}


/**
 TwinkleConfig.summaryAd (string)
 If ad should be added or not to summary, default [[WP:TWINKLE|TWINKLE]]
 */
if( typeof( TwinkleConfig.summaryAd ) == 'undefined' ) {
	TwinkleConfig.summaryAd = " using [[WP:TW|TW]]";
}

function num2order( num ) {
	switch( num ) {
	case 1: return '';
	case 2: return '2nd';
	case 3: return '3rd';
	default: return num + 'th';
	}
}
function twinklexfd() {
	if( wgNamespaceNumber < 0 || wgCurRevisionId == false ) {
		return;
	}
	if (twinkleConfigExists)
	{
		twAddPortletLink( "javascript:twinklexfd.callback()", "XFD", "tw-xfd", "Anything for deletion", "");
	}
	else
	{
		twAddPortletLink( 'javascript:alert("Your account is too new to use Twinkle.");', 'XFD', 'tw-xfd', 'Anything for deletion', '');
	}
}
window.TwinkleInit = (window.TwinkleInit || []).concat(twinklexfd); //schedule initializer

twinklexfd.callback = function twinklexfdCallback() {

	var Window = new SimpleWindow( 600, 325 );
	Window.setTitle( "Anything for deletion" );
	var form = new QuickForm( twinklexfd.callback.evaluate );
	var categories = form.append( {
			type: 'select',
			name: 'category',
			label: 'Select wanted type of category: ',
			tooltip: 'When activated, a default choice is made, based on what namespace you are in. This default should be the most appropriate',
			event: twinklexfd.callback.change_category
		} );
	categories.append( {
			type: 'option',
			label: 'Afd',
			selected: wgNamespaceNumber == Namespace.MAIN,
			value: 'afd'
		} );
	categories.append( {
			type: 'option',
			label: 'Tfd',
			selected: wgNamespaceNumber == Namespace.TEMPLATE,
			value: 'tfd'
		} );
	categories.append( {
			type: 'option',
			label: 'Ffd/PUF',
			selected: wgNamespaceNumber == Namespace.IMAGE,
			value: 'ifd'
		} );
	categories.append( {
			type: 'option',
			label: 'Cfd',
			selected: wgNamespaceNumber == Namespace.CATEGORY,
			value: 'cfd'
		} );
	categories.append( {
			type: 'option',
			label: 'Mfd',
			selected: [ Namespace.IMAGE, Namespace.MAIN, Namespace.TEMPLATE, Namespace.CATEGORY ].indexOf( wgNamespaceNumber ) == -1 ,
			value: 'mfd'
		} );
	categories.append( {
			type: 'option',
			label: 'Rfd',
			selected: QueryString.equals('redirect', 'no') && (document.evaluate( "//span[@class='redirectText']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null ).snapshotLength>0),
			value: 'rfd'
		} );
	categories.append( {
			type: 'option',
			label: 'Sfd',
			disabled: true,
			value: 'sfd'
		} );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Notify if possible',
					value: 'notify',
					name: 'notify',
					tooltip: 'If a notification if defined in the configuration, then notify if this is true, else no notify',
					checked: true
				}
			]
		}
	);
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
	case 'afd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Articles for deletion',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Wrap <noinclude>',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Will wrap the template in <noinclude> tags, so that it won\'t transclude'
						}
					]
		} );
		var afd_category = work_area.append( {
				type:'select',
				name:'xfdcat',
				label:'Choose what category this nomination belongs in'
			} );

		afd_category.append( { type:'option', label:'Unknown', value:'?', selected:true } );
		afd_category.append( { type:'option', label:'Media and music', value:'M' } );
		afd_category.append( { type:'option', label:'Organisation, corporation, or product', value:'O' } );
		afd_category.append( { type:'option', label:'Biographical', value:'B' } );
		afd_category.append( { type:'option', label:'Society topics', value:'S' } );
		afd_category.append( { type:'option', label:'Web or internet', value:'W' } );
		afd_category.append( { type:'option', label:'Games or sports', value:'G' } );
		afd_category.append( { type:'option', label:'Science and technology', value:'T' } );
		afd_category.append( { type:'option', label:'Fiction and the arts', value:'F' } );
		afd_category.append( { type:'option', label:'Places and transportation', value:'P' } );
		afd_category.append( { type:'option', label:'Indiscernible or unclassifiable topic', value:'I' } );
		afd_category.append( { type:'option', label:'Debate not yet sorted', value:'U' } );

		work_area.append( {
				type: 'textarea',
				name: 'xfdreason',
				label: 'Reason: '
			} );
		work_area.append( { type:'submit' } );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'tfd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Templates for discussion',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Wrap <noinclude>',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Will wrap the template in <noinclude> tags, so that it won\'t transclude',
							disabled: true,
							checked: false
						}
					]
		} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Inline template',
							value: 'tfdinline',
							name: 'tfdinline',
							tooltip: 'Use \{\{tfd|type=inline\}\} to tag the page instead of \{\{tfd\}\}.',
							checked: false
						}
					]
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
	case 'mfd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Miscellany for deletion',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Wrap <noinclude>',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Will wrap the template in <noinclude> tags, so that it won\'t transclude'
						}
					]
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
	case 'ifd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Files for deletion',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'checkbox',
				name: 'puf',
				list: [
					{
						label: 'Possibly unfree file',
						value: 'puf',
						tooltip: 'File has disputed source or licensing information'
					}
				]
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
	case 'cfd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Categories for discussion',
				name: 'work_area'
			} );
		var cfd_category = work_area.append( {
				type: 'select',
				label: 'Choose type of action wanted: ',
				name: 'xfdcat',
				event: function(e) {
					var value = e.target.value;
					var target = e.target.form.xfdtarget;
					if( value == 'cfd' ) {
						target.disabled = true;
					} else {
						target.disabled = false;
					}
				}
			} );
		cfd_category.append( { type:'option', label: 'Deletion', value: 'cfd', selected:true } );
		cfd_category.append( { type:'option', label:'Merge', value:'cfm' } );
		cfd_category.append( { type:'option', label:'Renaming', value:'cfr' } );
		cfd_category.append( { type:'option', label:'Convert into article', value:'cfc' } );

		work_area.append( {
				type: 'input',
				name: 'xfdtarget',
				label: 'Target page: ',
				disabled: true,
				value: ''
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
	case 'rfd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Redirects for discussion',
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
	afd: {
		main: function ( self ) {
			var xmlDoc = self.responseXML;
			var titles = xmlDoc.evaluate( '//allpages/p/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

			// There has been no earlier entries with this prefix, just go on.
			if( titles.snapshotLength <= 0 ) {
				self.params.numbering = self.params.number = '';
				numbering = number = '';
			} else {
				var number = 0;
				for( var i = 0; i < titles.snapshotLength; ++i ) {
					var title = titles.snapshotItem(i).value;

					// First, simple test, is there an instance with this exact name?
					if( title == 'Wikipedia:Articles for deletion/' + wgPageName ) {
						number = Math.max( number, 1 );
						continue;
					}

					var order_re = new RegExp( '^' +
							RegExp.escape( 'Wikipedia:Articles for deletion/' + wgPageName, true ) +
							'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$'
					);
					var match = order_re.exec( title );

					// No match; A non-good value
					if( match == null ) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max( number, Number(match[1]) );
				}
				self.params.number = num2order( parseInt( number ) + 1);
				self.params.numbering = number > 0 ? ' (' + self.params.number + ' nomination)' : '';
			}

			Status.info( 'Next discussion page","[[Wikipedia:Articles for deletion/' + wgPageName + self.params.numbering + ']]' );

			// Discussion page
			var query = {
				'title': 'Wikipedia:Articles for deletion/' + wgPageName + self.params.numbering,
				'action': 'submit'
			};

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = query['title'];
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

			var wikipedia_wiki = new Wikipedia.wiki( 'Creating article deletion discussion page', query, twinklexfd.callbacks.afd.discussionPage );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.get();

			// Tagging article
			var query = {
				'title': wgPageName,
				'action': 'submit'
			};
			var wikipedia_wiki = new Wikipedia.wiki( 'Adding deletion tag to article', query, twinklexfd.callbacks.afd.article );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.get();

			// Today's list
			var date = new Date();

			query = {
				'title': 'Wikipedia:Articles for deletion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate(),
				'action': 'submit'
			};

			var wikipedia_wiki = new Wikipedia.wiki( 'Adding discussion to today\'s list', query, twinklexfd.callbacks.afd.todaysList );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = true;
			wikipedia_wiki.get();

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
				var wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + user + ')', query, twinklexfd.callbacks.afd.userNotification );
				wikipedia_wiki.params = self.params;
				wikipedia_wiki.followRedirect = true;
				wikipedia_wiki.get();
			}

			if( self.params.usertalk ) {
				var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
				wikipedia_api.params = self.params;
				wikipedia_api.post();
			}
		},
		article: function( self ) {
			var form = self.responseXML.getElementById('editform');

			//remove some tags that should always be removed on AfD.
			text = form.wpTextbox1.value.replace(/{\{\s*(dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated|prod2|Proposed deletion endorsed|New unreviewed article|Userspace draft)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/ig, "");
			//then, test if there are SD related templates on the article.
			textNoSd = text.replace(/{\{\s*(db(-\w*)?|delete|(?:hang|hold)[- ]?on)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/ig, "");
			if (text!=textNoSd && confirm("Speedy Deletion templates were found on this page. Should they be removed?")) text=textNoSd;
			form.wpTextbox1.value = text;

			var postData = {
				'wpMinoredit': undefined, // Per memo
				'wpWatchthis': (TwinkleConfig.xfdWatchPage=="yes" || (TwinkleConfig.xfdWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Nominated for deletion; see [[Wikipedia:Articles for deletion/" + wgPageName + self.params.numbering + ']].'+ TwinkleConfig.summaryAd,
				'wpTextbox1': ( self.params.noinclude ? "<noinclude>" : "" ) + "\{\{" + ( self.params.number == '' ? "subst:afd|help=off\}\}\n" : 'subst:afdx|' + self.params.number + "|help=off}}\n" ) + ( self.params.noinclude ? "</noinclude>" : "" ) + form.wpTextbox1.value
			};
			self.post( postData );
		},
		discussionPage: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchDiscussion=="yes" || (TwinkleConfig.xfdWatchDiscussion=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Creating deletion discussion page for \[\[" + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': "\{\{subst:afd2|pg=" + wgPageName + "|cat=" + self.params.xfdcat + "|text=" + self.params.reason + " \~\~\~\~\}\}\n"
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var old_text = form.wpTextbox1.value;

			var text = old_text.replace( /(<\!-- Add new entries to the TOP of the following list -->\n+)/, "$1\{\{subst:afd3|pg=" + wgPageName + self.params.numbering + "\}\}\n");
			if( text == old_text ) {
				self.statelem.error( 'failed to find target spot for the discussion' );
				return;
			}
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchList=="yes" || (TwinkleConfig.xfdWatchList=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Adding \[\[WP:Articles for deletion/" + wgPageName + self.params.numbering + '\|AfD\]\] for \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			text += "\n\{\{subst:AFDWarning|1=" + wgPageName + ( self.params.numbering != '' ? '|order=&#32;' + self.params.numbering : '' ) + "\}\} \~\~\~\~";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUser=="yes" || (TwinkleConfig.xfdWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'AfD nomination of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}
	},
	tfd: {
		taggingTemplate: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': undefined, // Per memo
				'wpWatchthis': (TwinkleConfig.xfdWatchPage=="yes" || (TwinkleConfig.xfdWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Nominated for deletion; see \[\[Wikipedia:Templates for discussion#" + wgPageName + '\]\].'+ TwinkleConfig.summaryAd,
				'wpTextbox1': "\{\{tfd"+(self.params.tfdinline?"|type=inline":"")+"|" + wgTitle + "\}\}\n" + form.wpTextbox1.value
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var old_text = form.wpTextbox1.value;
			text = old_text.replace( '-->', "-->\n\{\{subst:tfd2|" + wgTitle + "|text=" + self.params.reason + " \~\~\~\~\}\}");
			if( text == old_text ) {
				self.statelem.error( 'failed to find target spot for the discussion' );
				return;
			}
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchDiscussion=="yes" || (TwinkleConfig.xfdWatchDiscussion=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Adding [[Template:" + wgTitle + ']].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			text += "\n\{\{subst:tfdnotice|1=" + wgTitle + "\}\} \~\~\~\~";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUser=="yes" || (TwinkleConfig.xfdWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'TfD nomination of \[\[Template:' + wgTitle + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}
	},
	mfd: {
		main: function( self ) {
			var xmlDoc = self.responseXML;
			var titles = xmlDoc.evaluate( '//allpages/p/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

			// There has been no earlier entries with this prefix, just go on.
			if( titles.snapshotLength <= 0 ) {
				self.params.numbering = self.params.number = '';
				numbering = number = '';
			} else {
				var number = 0;
				for( var i = 0; i < titles.snapshotLength; ++i ) {
					var title = titles.snapshotItem(i).value;

					// First, simple test, is there an instance with this exact name?
					if( title == 'Wikipedia:Miscellany for deletion/' + wgPageName ) {
						number = Math.max( number, 1 );
						continue;
					}

					var order_re = new RegExp( '^' +
							RegExp.escape( 'Wikipedia:Miscellany for deletion/' + wgPageName, true ) +
							'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$'
					);
					var match = order_re.exec( title );

					// No match; A non-good value
					if( match == null ) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max( number, Number(match[1]) );
				}
				self.params.number = num2order( parseInt( number ) + 1);
				self.params.numbering = number > 0 ? ' (' + self.params.number + ' nomination)' : '';
			}


			self.statelem.info( 'next in order is [[Wikipedia:Miscellany for deletion/' + wgPageName + self.params.numbering + ']]');

			// Tagging article
			var query = {
				'title': wgPageName,
				'action': 'submit'
			};

			var wikipedia_wiki = new Wikipedia.wiki( 'Tagging page with deletion tag', query, twinklexfd.callbacks.mfd.taggingPage );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.get();

			// Discussion page
			var query = {
				'title': 'Wikipedia:Miscellany for deletion/' + wgPageName + self.params.numbering,
				'action': 'submit'
			};

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = query['title'];
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

			wikipedia_wiki = new Wikipedia.wiki( 'Creating page deletion discussion page', query, twinklexfd.callbacks.mfd.discussionPage );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.get();

			// Today's list
			var query = {
				'title': 'Wikipedia:Miscellany for deletion',
				'action': 'submit',
				'section': 2
			};

			wikipedia_wiki = new Wikipedia.wiki( 'Adding deletion discussion to today\'s list', query, twinklexfd.callbacks.mfd.todaysList );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = true;
			wikipedia_wiki.get();

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
				var wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + user + ')', query, twinklexfd.callbacks.mfd.userNotification );
				wikipedia_wiki.params = self.params;
				wikipedia_wiki.followRedirect = true;
				wikipedia_wiki.get();
			}

			if( self.params.usertalk ) {
				var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
				wikipedia_api.params = self.params;
				wikipedia_api.post();
			}
		},
		taggingPage: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': undefined, // Per memo
				'wpWatchthis': (TwinkleConfig.xfdWatchPage=="yes" || (TwinkleConfig.xfdWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Nominated for deletion; see [[Wikipedia:Miscellany for deletion/" + wgPageName + self.params.numbering + ']].'+ TwinkleConfig.summaryAd,
				'wpTextbox1': ( self.params.noinclude ? "<noinclude>" : "" ) + "\{\{" + ( self.params.number == '' ? "mfd\}\}\n" : 'mfdx|' + self.params.number + "}}\n" ) + ( self.params.noinclude ? "</noinclude>" : "" ) + form.wpTextbox1.value
			};
			self.post( postData );
		},
		discussionPage: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchDiscussion=="yes" || (TwinkleConfig.xfdWatchDiscussion=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Creating deletion discussion page for \[\[" + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': "\{\{subst:mfd2|pg=" + wgPageName + "|text=" + self.params.reason + " \~\~\~\~\}\}\n"
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');

			var text = form.wpTextbox1.value;
			var date = new Date();

			var date_header = "==="+date.getUTCMonthName() + ' ' + date.getUTCDate()+', '+date.getUTCFullYear()+"===";
			var date_header_regex = new RegExp( "(===\\s*" + date.getUTCMonthName() + '\\s+' + date.getUTCDate()+',\\s+'+date.getUTCFullYear() + "\\s*===)" );
			var new_data = "\n\{\{subst:mfd3|pg=" + wgPageName + self.params.numbering + "\}\}";

			if( date_header_regex.test( text ) ) { // we have a section already
				self.statelem.info( 'Found today\'s section, proceeding to add new entry' );
				text = text.replace( date_header_regex, "$1\n" + new_data );
			} else { // we need to create a new section
				self.statelem.info( 'No section for today found, proceeding to create one' );
				text = date_header + new_data + "\n\n" + text;
			}

			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchList=="yes" || (TwinkleConfig.xfdWatchList=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Adding \[\[WP:Miscellany for deletion/" + wgPageName + self.params.numbering + '\|MfD\]\] for \[\['+wgPageName+'\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			text += "\n\{\{subst:MFDWarning|1=" + wgPageName + ( self.params.numbering != '' ? '|order=&#32;' + self.params.numbering : '' ) + "\}\} \~\~\~\~";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUser=="yes" || (TwinkleConfig.xfdWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'MfD nomination of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}
	},
	ifd: {
		main: function( self ) {
			var xmlDoc = self.responseXML;
			var user = xmlDoc.evaluate( '//rev/@user', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
			self.params.uploader = user;
			var query = {
				'title': 'Wikipedia:Files for deletion/' + self.params.date,
				'action': 'submit'
			};

			wikipedia_wiki = new Wikipedia.wiki( 'Adding deletion discussion to today\'s list', query, twinklexfd.callbacks.ifd.todaysList );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = true;
			wikipedia_wiki.get();

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = query['title'];
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

			// Notification to first contributor

			if( self.params.usertalk ) {
				var query = {
					'title': 'User talk:' + self.params.uploader,
					'action': 'submit'
				};
				wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + self.params.uploader + ')', query, twinklexfd.callbacks.ifd.userNotification );
				wikipedia_wiki.followRedirect = true;
				wikipedia_wiki.get();
			}
		},
		taggingImage: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': undefined, // Per
				'wpWatchthis': (TwinkleConfig.xfdWatchPage=="yes" || (TwinkleConfig.xfdWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "This file is being considered for deletion in accordance with Wikipedia's [[Wikipedia:Deletion policy|Deletion policy]]; See \[\[Wikipedia:Files for deletion#" + wgPageName + '\]\].'+ TwinkleConfig.summaryAd,
				'wpTextbox1': "\{\{ifd|log=" + self.params.date + "\}\}\n" + form.wpTextbox1.value
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchDiscussion=="yes" || (TwinkleConfig.xfdWatchDiscussion=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Adding discussion for \[\[:" + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': form.wpTextbox1.value + "\n\{\{subst:ifd2|1=" + wgTitle + "|Uploader=" + self.params.uploader + "|Reason=" + self.params.reason + "\}\} \~\~\~\~"
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			text += "\n\{\{subst:idw|1=" + wgTitle + "\}\}";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUser=="yes" || (TwinkleConfig.xfdWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'Notification: FfD nomination of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		tagInstancesMain: function( self ) {
			var xmlDoc = self.responseXML;
			var nsResolver = xmlDoc.createNSResolver( xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
			var snapshot = xmlDoc.evaluate('//imageusage/iu/@title', xmlDoc, nsResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

			if( snapshot.snapshotLength == 0 ) {
				return;
			}

			var statusIndicator = new Status('Tagging file instances ', '0%');
			var total = snapshot.snapshotLength * 2;

			var date = new Date();
			var dateString = date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

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
				var wikipedia_wiki = new Wikipedia.wiki( "Tagging of " + title, query, twinklexfd.callbacks.ifd.tagInstances );
				wikipedia_wiki.params = { title:title, total:total, obj:statusIndicator, date:dateString };
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

			var tag = "\{\{ifdc|1=" + wgTitle + "|log=" + self.params.date + "\}\}";
			wikiPage.addToImageComment( wgTitle, tag );

			text = wikiPage.getText();
			if( text == old_text ) {
				// Nothing to do, return
				self.onsuccess( self );
				Wikipedia.actionCompleted();
				return;
			}
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUsages=="yes" || (TwinkleConfig.xfdWatchUsages=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'Tagging [[:File:' + wgTitle + "]] which is up for deletion at [[WP:FFD|Files for deletion]]" + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}
	},
	puf: {
		taggingImage: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': undefined, // Per
				'wpWatchthis': (TwinkleConfig.xfdWatchPage=="yes" || (TwinkleConfig.xfdWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "This file has been listed on [[Wikipedia:Possibly unfree files]] because the information on its source or copyright status is disputed; See \[\[Wikipedia:Possibly unfree files#" + wgPageName + '\]\].'+ TwinkleConfig.summaryAd,
				'wpTextbox1': "\{\{puf|log=" + self.params.date + "\}\}\n" + form.wpTextbox1.value
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchDiscussion=="yes" || (TwinkleConfig.xfdWatchDiscussion=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Adding discussion for \[\[:" + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': form.wpTextbox1.value + "\n\{\{subst:puf2|image=" + wgTitle + "|reason=" + self.params.reason + "\}\} \~\~\~\~"
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			text += "\n\{\{subst:idw-puf|1=" + wgTitle + "\}\} --\~\~\~\~";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUser=="yes" || (TwinkleConfig.xfdWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'Notification: PUF posting of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		tagInstancesMain: function( self ) {
			var xmlDoc = self.responseXML;
			var nsResolver = xmlDoc.createNSResolver( xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
			var snapshot = xmlDoc.evaluate('//imageusage/iu/@title', xmlDoc, nsResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

			if( snapshot.snapshotLength == 0 ) {
				return;
			}
			var statusIndicator = new Status('Tagging file instances', '0%');
			var total = snapshot.snapshotLength * 2;

			var date = new Date();
			var dateString = date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

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

			var onloading = function( wikipedia_wiki ) {}


			Wikipedia.addCheckpoint();
			for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
				var title = snapshot.snapshotItem(i).value;
				var query = {
					'title': title,
					'action': 'submit'
				}
				var wikipedia_wiki = new Wikipedia.wiki( "Tagging " + title, query, twinklexfd.callbacks.puf.tagInstances );
				wikipedia_wiki.params = { title:title, total:total, obj:statusIndicator, date:dateString };
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

			var tag = "\{\{pufc|1=" + wgTitle + "|log=" + self.params.date + "\}\}";
			wikiPage.addToImageComment( wgTitle, tag );

			text = wikiPage.getText();
			if( text == old_text ) {
				// Nothing to do, return
				self.onsuccess( self );
				Wikipedia.actionCompleted();
				return;
			}
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUsages=="yes" || (TwinkleConfig.xfdWatchUsages=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'Tagging [[:File:' + wgTitle + "]] which has been listed on [[WP:PUF|Possible unfree files]]" + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}

	},
	cfd: {
		taggingCategory: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var added_data = "";
			var summary = "";
			switch( self.params.xfdcat ) {
			case 'cfd':
				added_data = "\{\{subst:cfd\}\}";
				summary = "This category is being considered for deletion in accordance with [[WP:CDP|CDP]];" + TwinkleConfig.summaryAd;
				break;
			case 'cfm':
				added_data = "\{\{subst:cfm|" + self.params.target.replace('Category:','') + "\}\}";
				summary = "This category is being considered for merging in accordance with [[WP:CDP|CDP]];" + TwinkleConfig.summaryAd;
				break;
			case 'cfr':
				added_data = "\{\{subst:cfr|" + self.params.target.replace('Category:','') + "\}\}";
				summary = "This category is being considered for renaming in accordance with [[WP:CDP|CDP]];" + TwinkleConfig.summaryAd;
				break;
			case 'cfc':
				added_data = "\{\{subst:cfc|" + self.params.target + "\}\}";
				summary = "This category is being considered for conversion in accordance with [[WP:CDP|CDP]];" + TwinkleConfig.summaryAd;
				break;
			}
			var postData = {
				'wpMinoredit': undefined, // Per the cabal
				'wpWatchthis': (TwinkleConfig.xfdWatchPage=="yes" || (TwinkleConfig.xfdWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': summary,
				'wpTextbox1': added_data + "\n" + form.wpTextbox1.value
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var added_data = "";
			var summary = "";
			switch( self.params.xfdcat ) {
			case 'cfd':
				added_data = "\{\{subst:cfd2|1=" + wgTitle + "|text=" + self.params.reason + " \~\~\~\~\}\}";
				summary = "Added delete nomination of [[:" + wgPageName + "]];" + TwinkleConfig.summaryAd;
				break;
			case 'cfm':
				added_data = "\{\{subst:cfm2|1=" + wgTitle + "|2=" + self.params.target + "|text=" + self.params.reason + " \~\~\~\~\}\}";
				summary = "Added merge nomination of [[:" + wgPageName + "]];" + TwinkleConfig.summaryAd;
				break;
			case 'cfr':
				added_data = "\{\{subst:cfr2|1=" + wgTitle + "|2=" + self.params.target + "|text=" + self.params.reason + " \~\~\~\~\}\}";
				summary = "Added rename nomination of [[:" + wgPageName + "]];" + TwinkleConfig.summaryAd;
				break;
			case 'cfc':
				added_data = "\{\{subst:cfc2|1=" + wgTitle + "|2=" + self.params.target + "|text=" + self.params.reason + " \~\~\~\~\}\}";
				summary = "Added convert nomination of [[:" + wgPageName + "]];" + TwinkleConfig.summaryAd;
				break;
			}
			var old_text = form.wpTextbox1.value;

			text = old_text.replace( '-->', "-->\n" + added_data );
			if( text == old_text ) {
				self.statelem.error( 'failed to find target spot for the discussion' );
				return;
			}
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchDiscussion=="yes" || (TwinkleConfig.xfdWatchDiscussion=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': summary,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			var intext = "";
			switch( self.params.xfdcat ) {
			case 'cfd':
				intext = 'for deletion';
				break;
			case 'cfm':
				intext = 'for merging into \{\{lc|' + self.params.target + "\}\}" ;
				break;
			case 'cfr':
				intext = 'for renaming to \{\{lc|' + self.params.target + "\}\}" ;
				break;
			case 'cfc':
				intext = 'for converting into an article named \{\{lc|' + self.params.target + "\}\}" ;
				break;
			}
			text += "\n\{\{subst:CFDNote|1=" + wgPageName + "\}\} \~\~\~\~";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUser=="yes" || (TwinkleConfig.xfdWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'Notification: CfD nomination of \[\[:' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}
	},
	rfd: {
		main: function( self ) {
			var xmlDoc = self.responseXML;
			var target = xmlDoc.evaluate( '//redirects/r/@to', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
			if( !target ) {
				self.statelem.error( 'no target of this redirect, aborting' );
				return;
			}
			self.params.target = target;

			// Tagging redirect
			var query = {
				'title': wgPageName,
				'action': 'submit'
			};

			wikipedia_wiki = new Wikipedia.wiki( 'Tagging redirect with rfd tag', query, twinklexfd.callbacks.rfd.taggingRedirect );
			wikipedia_wiki.followRedirect = false;
			wikipedia_wiki.get();

			var date = new Date();
			var today = date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();
			var query = {
				'title': 'Wikipedia:Redirects for discussion/Log/' + today,
				'action': 'submit'
			};

			wikipedia_wiki = new Wikipedia.wiki( 'Adding deletion discussion to today\'s list', query, twinklexfd.callbacks.rfd.todaysList );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = true;
			wikipedia_wiki.get();

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = query['title'];
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

			self.params.todaysPage = query['title'];

			// Notifying initial contributor
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
				var wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + user + ')', query, twinklexfd.callbacks.rfd.userNotification );
				wikipedia_wiki.params = self.params;
				wikipedia_wiki.followRedirect = true;
				wikipedia_wiki.get();
			}

			if( self.params.usertalk ) {
				var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
				wikipedia_api.params = self.params;
				wikipedia_api.post();
			}
		},
		taggingRedirect: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var postData = {
				'wpMinoredit': undefined, // Per
				'wpWatchthis': (TwinkleConfig.xfdWatchPage=="yes" || (TwinkleConfig.xfdWatchPage=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "This redirect has been listed on \[\[Wikipedia:Redirects for discussion\]\]." + TwinkleConfig.summaryAd,
				'wpTextbox1': "\{\{rfd\}\}\n" + form.wpTextbox1.value
			};
			self.post( postData );
		},
		todaysList: function( self ) {
			var form = self.responseXML.getElementById('editform');
			var old_text = form.wpTextbox1.value;
			var text = old_text.replace( /(<\!-- Add new entries directly below this line -->\n+)/, "$1\{\{subst:rfd2|redirect="+ wgPageName + "|target=" + self.params.target + "|text=" + self.params.reason.toUpperCaseFirstChar() +"\}\} \~\~\~\~\n" );
			if( text == old_text ) {
				self.statelem.error( 'failed to find target spot for the discussion' );
				return;
			}

			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchDiscussion=="yes" || (TwinkleConfig.xfdWatchDiscussion=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': "Adding [[" + wgPageName + ']].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		},
		userNotification: function( self ) {
			var form = self.responseXML.getElementById( 'editform' );
			var text = form.wpTextbox1.value;
			text += "\n\{\{subst:RFDNote|1=" + wgPageName + "\}\} \~\~\~\~";
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': (TwinkleConfig.xfdWatchUser=="yes" || (TwinkleConfig.xfdWatchUser=="default"&&form.wpWatchthis.checked) ? '' : undefined),
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSection': form.wpSection.value,
				'wpSummary': 'Notification: RFD posting of \[\[' + wgPageName + '\]\].' + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};
			self.post( postData );
		}
	}
}

twinklexfd.callback.evaluate = function(e) {

	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!

	var type =  e.target.category.value;
	var usertalk = e.target.notify.checked;
	var reason = e.target.xfdreason.value;
	if( type in {'afd':'','cfd':''} ) {
		var xfdcat = e.target.xfdcat.value;
	}
	if( type == 'ifd' ) {
		var puf = e.target.puf.checked;
	}
	if( type in {'afd':'','mfd':''} ) {
		var noinclude = e.target.noinclude.checked;
	}
	if( type == 'tfd' ) {
		var tfdinline = e.target.tfdinline.checked;
	}

	Status.init( e.target );

	if( type == null ) {
		Status.error( 'Error', 'no action given' );
		return;
	}

	switch( type ) {
	case 'afd': // AFD
		var query = {
			'action': 'query',
			'list': 'allpages',
			'apprefix': 'Articles for deletion/' + wgPageName,
			'apnamespace': 4,
			'apfilterredir': 'nonredirects',
			'aplimit': userIsInGroup( 'sysop' ) ? 5000 : 500
		};
		var wikipedia_api = new Wikipedia.api( 'Tagging article with deletion tag', query, twinklexfd.callbacks.afd.main );
		wikipedia_api.params = { usertalk:usertalk, reason:reason, noinclude:noinclude, xfdcat:xfdcat };
		wikipedia_api.post();
		break;
	case 'tfd': // TFD
		Wikipedia.addCheckpoint();
		// Tagging article
		var query = {
			'title': wgPageName,
			'action': 'submit'
		};
		wikipedia_wiki = new Wikipedia.wiki( 'Tagging template with deletion tag', query, twinklexfd.callbacks.tfd.taggingTemplate );
		wikipedia_wiki.params = { tfdinline:tfdinline };
		wikipedia_wiki.get();

		// Adding discussion
		var date = new Date();

		query = {
			'title': 'Wikipedia:Templates for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate(),
			'action': 'submit',
			'section': 1
		};

		// Updating data for the action completed event
		Wikipedia.actionCompleted.redirect = query['title'];
		Wikipedia.actionCompleted.notice = "Nomination completed, redirecting now to the list of today";

		wikipedia_wiki = new Wikipedia.wiki( 'Adding discussion to today\'s list', query, twinklexfd.callbacks.tfd.todaysList );
		wikipedia_wiki.params = { reason:reason };
		wikipedia_wiki.followRedirect = true;
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
			var wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + user + ')', query, twinklexfd.callbacks.tfd.userNotification );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = true;
			wikipedia_wiki.get();
		}
		if( usertalk ) {
			var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
			wikipedia_api.params = self.params;
			wikipedia_api.post();
		}

		Wikipedia.removeCheckpoint();
		break;
	case 'mfd': // MFD

		var query = {
			'action': 'query',
			'list': 'allpages',
			'apprefix': 'Miscellany for deletion/' + wgPageName,
			'apnamespace': 4,
			'apfilterredir': 'nonredirects',
			'aplimit': userIsInGroup( 'sysop' ) ? 5000 : 500
		};
		var wikipedia_api = new Wikipedia.api( 'Querying allpages', query, twinklexfd.callbacks.mfd.main );
		wikipedia_api.params = { usertalk:usertalk, reason:reason, noinclude:noinclude, xfdcat:xfdcat };
		wikipedia_api.post();
		break;
	case 'ifd': // IFD

		var date = new Date();
		var dateString = date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();
		var params = { usertalk: usertalk, reason: reason, date: dateString };

		Wikipedia.addCheckpoint();
		if( puf ) {
			// Tagging file
			var query = {
				'title': wgPageName,
				'action': 'submit'
			};

			var wikipedia_wiki = new Wikipedia.wiki( 'Tagging file with PUF tag', query, twinklexfd.callbacks.puf.taggingImage );
			wikipedia_wiki.params = params;
			wikipedia_wiki.get();
			// Adding discussion

			query = {
				'title': 'Wikipedia:Possibly unfree files/' + dateString,
				'action': 'submit'
			};

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = query['title'];
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to today\'s list";

			wikipedia_wiki = new Wikipedia.wiki( 'Adding discussion to today\'s list', query, twinklexfd.callbacks.puf.todaysList );
			wikipedia_wiki.params = params;
			wikipedia_wiki.followRedirect = true;
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
				var wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + user + ')', query, twinklexfd.callbacks.puf.userNotification );
				wikipedia_wiki.params = self.params;
				wikipedia_wiki.followRedirect = true;
				wikipedia_wiki.get();
			}
			if( usertalk ) {
				var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			Wikipedia.removeCheckpoint();

			// adding tag to captions
			var query = {
				'action': 'query',
				'list': 'imageusage',
				'iutitle': wgPageName,
				'iulimit': userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
			};

			//Disabled, we let [[User:Sambot]] do that now. Also see [[WP:TW/BUG#333]] and [[WP:TW/BUG#285]]:
			//var wikipedia_api = new Wikipedia.api( 'Grabbing file links', query, twinklexfd.callbacks.puf.tagInstancesMain );
			//wikipedia_api.post();

		} else {
			// Tagging file
			var query = {
				'title': wgPageName,
				'action': 'submit'
			};

			var wikipedia_wiki = new Wikipedia.wiki( 'Tagging file with deletion tag', query, twinklexfd.callbacks.ifd.taggingImage );
			wikipedia_wiki.params = params;
			wikipedia_wiki.get();

			// Contributor specific edits
			var query = {
				'action': 'query',
				'prop': 'revisions',
				'titles': wgPageName,
				'rvlimit': 1,
				'rvprop': 'user',
				'rvdir': 'newer'
			}
			var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, twinklexfd.callbacks.ifd.main );
			wikipedia_api.params = params;
			wikipedia_api.post();

			// adding tag to captions
			var query = {
				'action': 'query',
				'list': 'imageusage',
				'iutitle': wgPageName,
				'iulimit': userIsInGroup( 'sysop' ) ? 5000 : 500 // 500 is max for normal users, 5000 for bots and sysops
			};

			//Disabled, we let [[User:Sambot]] do that now. Also see [[WP:TW/BUG#333]] and [[WP:TW/BUG#285]]:
			//var wikipedia_api = new Wikipedia.api( 'Grabbing file links', query, twinklexfd.callbacks.ifd.tagInstancesMain );
			//wikipedia_api.post();
		}
		Wikipedia.removeCheckpoint();
		break;
	case 'cfd':
		Wikipedia.addCheckpoint();
		if( e.target.xfdtarget ) {
			var target = e.target.xfdtarget.value.replace( /^\:?Category\:/, '' );
		} else {
			var target = '';
		}

		var date = new Date();
		var todaysPage = 'Wikipedia:Categories for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

		// Updating data for the action completed event
		Wikipedia.actionCompleted.redirect = todaysPage;
		Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

		// Tagging category

		var query = {
			'title': wgPageName,
			'action': 'submit'
		};
		var params = { reason:reason, xfdcat:xfdcat, target:target };

		var wikipedia_wiki = new Wikipedia.wiki( 'Tagging category with tag', query, twinklexfd.callbacks.cfd.taggingCategory );
		wikipedia_wiki.params = params;
		wikipedia_wiki.get();

		// Today's list
		var query = {
			'title': todaysPage,
			'action': 'submit',
			'section': 2
		};

		var wikipedia_wiki = new Wikipedia.wiki( 'Adding discussion to today\'s list', query, twinklexfd.callbacks.cfd.todaysList );
		wikipedia_wiki.params = params;
		wikipedia_wiki.followRedirect = true;
		wikipedia_wiki.get();

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
			var wikipedia_wiki = new Wikipedia.wiki( 'Notifying initial contributor (' + user + ')', query, twinklexfd.callbacks.cfd.userNotification );
			wikipedia_wiki.params = self.params;
			wikipedia_wiki.followRedirect = true;
			wikipedia_wiki.get();
		}
		if( usertalk ) {
			var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, callback );
			wikipedia_api.params = { xfdcat:xfdcat, target:target, todaysPage:todaysPage };
			wikipedia_api.post();
		}

		Wikipedia.removeCheckpoint();
		break;
	case 'rfd':
		var query = {
			'action': 'query',
			'titles': wgPageName,
			'redirects': true
		};
		var wikipedia_api = new Wikipedia.api( 'Querying redirect', query, twinklexfd.callbacks.rfd.main );
		wikipedia_api.params = { usertalk:usertalk, reason:reason };
		wikipedia_api.post();
		break;
	}
}