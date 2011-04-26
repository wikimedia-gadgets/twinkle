if ( typeof(Twinkle) === "undefined" ) {
	throw ( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function twinklexfd() {
	// Disable on:
	// * special pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2)
	// * file pages without actual files (these are eligible for CSD G8)
	if ( wgNamespaceNumber < 0 || !wgArticleId || (wgNamespaceNumber === 6 && (document.getElementById('mw-sharedupload') || (!document.getElementById('mw-imagepage-section-filehistory') && !document.getElementsByClassName('redirectText').length))) ) {
		return;
	}
	if (twinkleUserAuthorized) {
		twAddPortletLink( "javascript:twinklexfd.callback()", "XFD", "tw-xfd", "Anything for deletion", "");
	} else {
		twAddPortletLink( 'javascript:alert("Your account is too new to use Twinkle.");', 'XFD', 'tw-xfd', 'Anything for deletion', '');
	}
}

function num2order( num ) {
	switch( num ) {
	case 1: return '';
	case 2: return '2nd';
	case 3: return '3rd';
	default: return num + 'th';
	}
}

twinklexfd.callback = function twinklexfdCallback() {

	var Window = new SimpleWindow( 600, 350 );
	Window.setTitle( "Nominate for deletion (XfD)" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "About deletion discussions", "WP:XFD" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#xfd" );

	var form = new QuickForm( twinklexfd.callback.evaluate );
	var categories = form.append( {
			type: 'select',
			name: 'category',
			label: 'Deletion discussion venue:',
			tooltip: 'When activated, a default choice is made, based on what namespace you are in. This default should be the most appropriate',
			event: twinklexfd.callback.change_category
		} );
	categories.append( {
			type: 'option',
			label: 'AfD (Articles for deletion)',
			selected: wgNamespaceNumber == Namespace.MAIN,
			value: 'afd'
		} );
	categories.append( {
			type: 'option',
			label: 'TfD (Templates for discussion)',
			selected: wgNamespaceNumber == Namespace.TEMPLATE,
			value: 'tfd'
		} );
	categories.append( {
			type: 'option',
			label: 'FfD (Files for deletion)/PUF (Possibly unfree files)',
			selected: wgNamespaceNumber == Namespace.IMAGE,
			value: 'ffd'
		} );
	categories.append( {
			type: 'option',
			label: 'CfD (Categories for discussion)',
			selected: wgNamespaceNumber == Namespace.CATEGORY,
			value: 'cfd'
		} );
	categories.append( {
			type: 'option',
			label: 'MfD (Miscellany for deletion)',
			selected: [ Namespace.IMAGE, Namespace.MAIN, Namespace.TEMPLATE, Namespace.CATEGORY ].indexOf( wgNamespaceNumber ) == -1 ,
			value: 'mfd'
		} );
	categories.append( {
			type: 'option',
			label: 'RfD (Redirects for discussion)',
			selected: QueryString.equals('redirect', 'no') && ($("span.redirectText").length > 0),
			value: 'rfd'
		} );
	//categories.append( {
	//		type: 'option',
	//		label: 'SfD (Stub types for deletion)',
	//		disabled: true,
	//		value: 'sfd'
	//	} );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Notify page creator if possible',
					value: 'notify',
					name: 'notify',
					tooltip: "A notification template will be placed on the creator's talk page if this is true.",
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
	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the controls
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

	var oldreasontextbox = e.target.form.getElementsByTagName('textarea')[0];
	var oldreason = (oldreasontextbox ? oldreasontextbox.value : '');

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
							label: 'Wrap deletion tag with <noinclude>',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Will wrap the deletion tag in <noinclude> tags, so that it won\'t transclude. This option is not normally required.'
						}
					]
		} );
		var afd_category = work_area.append( {
				type:'select',
				name:'xfdcat',
				label:'Choose what category this nomination belongs in:'
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
				label: 'Reason: ',
				value: oldreason
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'tfd':
		work_area = new QuickForm.element( {
				type: 'field',
				label: 'Templates for discussion',
				name: 'work_area'
			} );
		var linknode = document.createElement('a');
		linknode.setAttribute("href", "/wiki/WP:SFD");
		linknode.appendChild(document.createTextNode('WP:SFD'));
		work_area.append( {
				type: 'div',
				label: [ 'Stub types and userboxes are not eligible for TfD. Stub types go to ', linknode, ', and userboxes go to MfD.' ]
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Inline deletion tag',
							value: 'tfdinline',
							name: 'tfdinline',
							tooltip: 'Use \{\{tfd|type=inline\}\} to tag the page instead of \{\{tfd\}\}. Good for inline templates (those that appear amongst the words of text).',
							checked: false
						}
					]
		} );
		work_area.append( {
				type: 'textarea',
				name: 'xfdreason',
				label: 'Reason: ',
				value: oldreason
			} );
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
							label: 'Wrap deletion tag with <noinclude>',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Will wrap the deletion tag in <noinclude> tags, so that it won\'t transclude. Select this option for userboxes.'
						}
					]
		} );
		if (wgNamespaceNumber == Namespace.USER || wgNamespaceNumber == Namespace.USER_TALK) {
			work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Also notify owner of userspace if they are not the page creator',
							value: 'notifyuserspace',
							name: 'notifyuserspace',
							tooltip: 'If the user in whose userspace this page is located, is not the page creator (for example, the page is a rescued article stored as a userspace draft), notify the userspace owner as well.',
							checked: true
						}
					]
			} );
		}
		work_area.append( {
				type: 'textarea',
				name: 'xfdreason',
				label: 'Reason: ',
				value: oldreason
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'ffd':
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
				label: 'Reason: ',
				value: oldreason
			} );
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
		cfd_category.append( { type: 'option', label: 'Deletion', value: 'cfd', selected: true } );
		cfd_category.append( { type: 'option', label: 'Merge', value: 'cfm' } );
		cfd_category.append( { type: 'option', label: 'Renaming', value: 'cfr' } );
		cfd_category.append( { type: 'option', label: 'Convert into article', value: 'cfc' } );

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
				label: 'Reason: ',
				value: oldreason
			} );
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
				label: 'Reason: ',
				value: oldreason
			} );
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
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if( titles.length <= 0 ) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for( var i = 0; i < titles.length; ++i ) {
					var title = titles[i].getAttribute('title');

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
				apiobj.params.number = num2order( parseInt( number ) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Articles for deletion/' + wgPageName + apiobj.params.numbering;

			Status.info( "Next discussion page", "[[" + apiobj.params.discussionpage + "]]" );

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = apiobj.params.discussionpage;
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

			// Tagging article
			var wikipedia_page = new Wikipedia.page(wgPageName, "Adding deletion tag to article");
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(twinklexfd.callbacks.afd.taggingArticle);
		},
		// Tagging needs to happen before everything else: this means we can check if there is an AfD tag already on the page
		taggingArticle: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			// Check for existing AfD tag, for the benefit of new page patrollers
			var textNoAfd = text.replace(/{\{\s*(Article for deletion\/dated|AfDM)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/g, "");
			if (text != textNoAfd) {
				if (confirm("An AfD tag was found on this article. Maybe someone beat you to it.  \nClick OK to replace the current AfD tag (not recommended), or Cancel to abandon your nomination.")) {
					text = textNoAfd;
				} else {
					statelem.error("Article already tagged with AfD tag, and you chose to abort");
					window.location.reload();
					return;
				}
			}

			// Now we know we want to go ahead with it, trigger the other AJAX requests

			// Starting discussion page
			var wikipedia_page = new Wikipedia.page(params.discussionpage, "Creating article deletion discussion page");
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(twinklexfd.callbacks.afd.discussionPage);

			// Today's list
			var date = new Date();
			wikipedia_page = new Wikipedia.page('Wikipedia:Articles for deletion/Log/' + date.getUTCFullYear() + ' ' +
				date.getUTCMonthName() + ' ' + date.getUTCDate(), "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(twinklexfd.callbacks.afd.todaysList);

			// Notification to first contributor
			if (params.usertalk) {
				var thispage = new Wikipedia.page(wgPageName);
				thispage.setCallbackParameters(params);
				thispage.lookupCreator(twinklexfd.callbacks.afd.userNotification);
			}

			// Remove some tags that should always be removed on AfD.
			text = text.replace(/{\{\s*(dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated|prod2|Proposed deletion endorsed|New unreviewed article|Userspace draft)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/ig, "");
			// Then, test if there are speedy deletion-related templates on the article.
			var textNoSd = text.replace(/{\{\s*(db(-\w*)?|delete|(?:hang|hold)[- ]?on)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/ig, "");
			if (text != textNoSd && confirm("A speedy deletion tag was found on this page. Should it be removed?")) {
				text = textNoSd;
			}

			pageobj.setPageText((params.noinclude ? "<noinclude>\{\{" : "\{\{") + (params.number == '' ? "subst:afd|help=off" : ('subst:afdx|' +
				params.number + "|help=off")) + (params.noinclude ? "}}</noinclude>\n" : "}}\n") + text);
			pageobj.setEditSummary("Nominated for deletion; see [[" + params.discussionpage + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchPage) {
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
		discussionPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("\{\{subst:afd2|pg=" + wgPageName + "|cat=" + params.xfdcat + "|text=" + params.reason + " \~\~\~\~\}\}\n");
			pageobj.setEditSummary("Creating deletion discussion page for [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchDiscussion) {
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
			pageobj.setCreateOption('createonly');
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace( /(<\!-- Add new entries to the TOP of the following list -->\n+)/, "$1\{\{subst:afd3|pg=" + wgPageName + params.numbering + "\}\}\n");
			if( text == old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary("Adding [[" + params.discussionpage + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchList) {
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
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();
			var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n\{\{subst:AFDWarning|1=" + wgPageName + ( params.numbering != '' ? '|order=&#32;' + params.numbering : '' ) + "\}\} \~\~\~\~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:AFD|articles for deletion]] of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			usertalkpage.setCreateOption('recreate');
			switch (TwinkleConfig.xfdWatchUser) {
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
	},


	tfd: {
		taggingTemplate: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("\{\{tfd" + (params.tfdinline ? "|type=inline" : "") + "|" + wgTitle + "\}\}\n" + text);
			pageobj.setEditSummary("Nominated for deletion; see [[" + params.logpage + "#" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchPage) {
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
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace( '-->', "-->\n\{\{subst:tfd2|" + wgTitle + "|text=" + params.reason + " \~\~\~\~\}\}");
			if( text == old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary("Adding [[Template:" + wgTitle + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchDiscussion) {
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
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n\{\{subst:tfdnotice|1=" + wgTitle + "\}\} \~\~\~\~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: nomination at [[WP:TFD|templates for discussion]] of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			usertalkpage.setCreateOption('recreate');
			switch (TwinkleConfig.xfdWatchUser) {
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
	},


	mfd: {
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if( titles.length <= 0 ) {
				apiobj.params.numbering = apiobj.params.number = '';
				numbering = number = '';
			} else {
				var number = 0;
				for( var i = 0; i < titles.length; ++i ) {
					var title = titles[i].getAttribute('title');

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
				apiobj.params.number = num2order( parseInt( number ) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = "Wikipedia:Miscellany for deletion/" + wgPageName + apiobj.params.numbering;

			apiobj.statelem.info( "next in order is [[" + apiobj.params.discussionpage + ']]');

			// Tagging page
			var wikipedia_page = new Wikipedia.page(wgPageName, "Tagging page with deletion tag");
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(twinklexfd.callbacks.mfd.taggingPage);

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = apiobj.params.discussionpage;
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

			// Discussion page
			wikipedia_page = new Wikipedia.page(apiobj.params.discussionpage, "Creating deletion discussion page");
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(twinklexfd.callbacks.mfd.discussionPage);

			// Today's list
			wikipedia_page = new Wikipedia.page("Wikipedia:Miscellany for deletion", "Adding discussion to today's list");
			//wikipedia_page.setPageSection(2);
				// pageSection has been disabled - the API seems to throw up with nonexistent edit conflicts
				// it can be turned on again once the problem is fixed, to save bandwidth
			//wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(twinklexfd.callbacks.mfd.todaysList);

			// Notification to first contributor, and notification to owner of userspace (if applicable and required)
			if (apiobj.params.usertalk) {
				var thispage = new Wikipedia.page(wgPageName);
				thispage.setCallbackParameters(apiobj.params);
				thispage.lookupCreator(twinklexfd.callbacks.mfd.userNotification);
			}
		},
		taggingPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText((params.noinclude ? "<noinclude>" : "") + "\{\{" + ((params.number == '') ? "mfd\}\}\n" : ('mfdx|' + params.number + "}}\n")) +
				(params.noinclude ? "</noinclude>" : "") + text);
			pageobj.setEditSummary("Nominated for deletion; see [[" + params.discussionpage + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchPage) {
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
		discussionPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("\{\{subst:mfd2|pg=" + wgPageName + "|text=" + params.reason + " \~\~\~\~\}\}\n");
			pageobj.setEditSummary("Creating deletion discussion page for [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchDiscussion) {
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
			pageobj.setCreateOption('createonly');
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var date = new Date();
			var date_header = "===" + date.getUTCMonthName() + ' ' + date.getUTCDate() + ', ' + date.getUTCFullYear() + "===";
			var date_header_regex = new RegExp( "(===\\s*" + date.getUTCMonthName() + '\\s+' + date.getUTCDate() + ',\\s+' + date.getUTCFullYear() + "\\s*===)" );
			var new_data = "\{\{subst:mfd3|pg=" + wgPageName + params.numbering + "\}\}";

			if( date_header_regex.test( text ) ) { // we have a section already
				statelem.info( 'Found today\'s section, proceeding to add new entry' );
				text = text.replace( date_header_regex, "$1\n" + new_data );
			} else { // we need to create a new section
				statelem.info( 'No section for today found, proceeding to create one' );
				text = text.replace("===", date_header + new_data + "\n\n===");
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary("Adding [[" + params.discussionpage + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchList) {
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
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Really notify the creator
			twinklexfd.callbacks.mfd.userNotificationMain(params, initialContrib, "Notifying initial contributor");

			// Also notify the user who owns the subpage if they are not the creator
			if (params.notifyuserspace) {
				var userspaceOwner = ((wgTitle.indexOf('/') == -1) ? wgTitle : wgTitle.substring(0, wgTitle.indexOf('/')));
				if (userspaceOwner != initialContrib) {
					twinklexfd.callbacks.mfd.userNotificationMain(params, userspaceOwner, "Notifying owner of userspace");
				}
			}
		},
		userNotificationMain: function(params, initialContrib, actionName)
		{
			var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, actionName + " (" + initialContrib + ")");
			var notifytext = "\n\{\{subst:MFDWarning|1=" + wgPageName + ( params.numbering != '' ? '|order=&#32;' + params.numbering : '' ) + "\}\} \~\~\~\~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:MFD|miscellany for deletion]] of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			usertalkpage.setCreateOption('recreate');
			switch (TwinkleConfig.xfdWatchUser) {
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
	},


	ffd: {
		main: function(pageobj) {
			// this is coming in from lookupCreator...!
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();
			params.uploader = initialContrib;

			// Adding discussion
			wikipedia_page = new Wikipedia.page(params.logpage, "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(twinklexfd.callbacks.ffd.todaysList);

			// Notification to first contributor
			var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n\{\{subst:idw|1=" + wgTitle + "\}\}";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:FFD|files for deletion]] of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			usertalkpage.setCreateOption('recreate');
			switch (TwinkleConfig.xfdWatchUser) {
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
		},
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("\{\{ffd|log=" + params.date + "\}\}\n" + text);
			pageobj.setEditSummary("Nominated for deletion at [[" + params.logpage + "#" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchPage) {
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
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// add date header if the log is found to be empty (a bot should do this automatically, but it sometimes breaks down)
			if (!pageobj.exists()) {
				text = "\{\{subst:Ffd log}}";
			}

			pageobj.setPageText(text + "\n\{\{subst:ffd2|1=" + wgTitle + "|Uploader=" + params.uploader + "|Reason=" + params.reason + "\}\} \~\~\~\~");
			pageobj.setEditSummary("Adding [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchDiscussion) {
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
			pageobj.setCreateOption('recreate');
			pageobj.save();
		}
	},


	puf: {
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("\{\{puf|help=off|log=" + params.date + "\}\}\n" + text);
			pageobj.setEditSummary("Listed at [[WP:PUF|possibly unfree files]]: [[" + params.logpage + "#" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchPage) {
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
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(text + "\n\{\{subst:puf2|image=" + wgTitle + "|reason=" + params.reason + "\}\} \~\~\~\~");
			pageobj.setEditSummary("Adding [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchDiscussion) {
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
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n\{\{subst:idw-puf|1=" + wgTitle + "\}\}";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:PUF|possibly unfree files]] of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			usertalkpage.setCreateOption('recreate');
			switch (TwinkleConfig.xfdWatchUser) {
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
	},


	cfd: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			var added_data = "";
			var editsummary = "";
			switch( params.xfdcat ) {
			case 'cfd':
				added_data = "\{\{subst:cfd\}\}";
				editsummary = "Category being considered for deletion in accordance with [[WP:CDP|CDP]].";
				break;
			case 'cfm':
				added_data = "\{\{subst:cfm|" + params.target.replace('Category:','') + "\}\}";
				editsummary = "Category being considered for merging in accordance with [[WP:CDP|CDP]].";
				break;
			case 'cfr':
				added_data = "\{\{subst:cfr|" + params.target.replace('Category:','') + "\}\}";
				editsummary = "Category being considered for renaming in accordance with [[WP:CDP|CDP]].";
				break;
			case 'cfc':
				added_data = "\{\{subst:cfc|" + params.target + "\}\}";
				editsummary = "Category being considered for conversion to an article in accordance with [[WP:CDP|CDP]].";
				break;
			}

			pageobj.setPageText(added_data + "\n" + text);
			pageobj.setEditSummary(editsummary + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchPage) {
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
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = "";
			var editsummary = "";
			switch( params.xfdcat ) {
			case 'cfd':
				added_data = "\{\{subst:cfd2|1=" + wgTitle + "|text=" + params.reason + " \~\~\~\~\}\}";
				editsummary = "Added delete nomination of [[:" + wgPageName + "]].";
				break;
			case 'cfm':
				added_data = "\{\{subst:cfm2|1=" + wgTitle + "|2=" + params.target + "|text=" + params.reason + " \~\~\~\~\}\}";
				editsummary = "Added merge nomination of [[:" + wgPageName + "]].";
				break;
			case 'cfr':
				added_data = "\{\{subst:cfr2|1=" + wgTitle + "|2=" + params.target + "|text=" + params.reason + " \~\~\~\~\}\}";
				editsummary = "Added rename nomination of [[:" + wgPageName + "]].";
				break;
			case 'cfc':
				added_data = "\{\{subst:cfc2|1=" + wgTitle + "|2=" + params.target + "|text=" + params.reason + " \~\~\~\~\}\}";
				editsummary = "Added convert nomination of [[:" + wgPageName + "]].";
				break;
			}

			text = old_text.replace( 'below this line -->', "below this line -->\n" + added_data );
			if( text == old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary(editsummary + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchDiscussion) {
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
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();
			var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n\{\{subst:CFDNote|1=" + wgPageName + "\}\} \~\~\~\~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:CFD|categories for discussion]] of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			usertalkpage.setCreateOption('recreate');
			switch (TwinkleConfig.xfdWatchUser) {
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
	},


	rfd: {
		// This is a callback from an API request, which gets the target of the redirect
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var target = $(xmlDoc).find('redirects r').first().attr('to');
			if( !target ) {
				apiobj.statelem.error( "This page is currently not a redirect, aborting" );
				return;
			}
			apiobj.params.target = target;

			var date = new Date();
			apiobj.params.logpage = 'Wikipedia:Redirects for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

			// Tagging redirect
			var wikipedia_page = new Wikipedia.page(wgPageName, "Adding deletion tag to redirect");
			wikipedia_page.setFollowRedirect(false);
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(twinklexfd.callbacks.rfd.taggingRedirect);

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = apiobj.params.logpage;
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion
			wikipedia_page = new Wikipedia.page(apiobj.params.logpage, "Adding discussion to today's log");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(twinklexfd.callbacks.rfd.todaysList);

			// Notifying initial contributor
			if (apiobj.params.usertalk) {
				var thispage = new Wikipedia.page(wgPageName);
				thispage.setCallbackParameters(apiobj.params);
				thispage.lookupCreator(twinklexfd.callbacks.rfd.userNotification);
			}
		},
		taggingRedirect: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("\{\{rfd\}\}\n" + text);
			pageobj.setEditSummary("Listed for discussion at [[" + params.logpage + "#" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchPage) {
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
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace( /(<\!-- Add new entries directly below this line -->)/, "$1\n\{\{subst:rfd2|redirect="+ wgPageName + "|target=" +
				params.target + "|text=" + params.reason.toUpperCaseFirstChar() +"\}\} \~\~\~\~\n" );
			if( text == old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary("Adding [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			switch (TwinkleConfig.xfdWatchDiscussion) {
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
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n\{\{subst:RFDNote|1=" + wgPageName + "\}\} \~\~\~\~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:RFD|redirects for discussion]] of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
			usertalkpage.setCreateOption('recreate');
			switch (TwinkleConfig.xfdWatchUser) {
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
}



twinklexfd.callback.evaluate = function(e) {
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!

	var type =  e.target.category.value;
	var usertalk = e.target.notify.checked;
	var reason = e.target.xfdreason.value;
	if( type in {'afd':'','cfd':''} ) {
		var xfdcat = e.target.xfdcat.value;
	}
	if( type == 'ffd' ) {
		var puf = e.target.puf.checked;
	}
	if( type in {'afd':'','mfd':''} ) {
		var noinclude = e.target.noinclude.checked;
	}
	if( type == 'tfd' ) {
		var tfdinline = e.target.tfdinline.checked;
	}
	if( type == 'mfd' ) {
		var notifyuserspace = e.target.notifyuserspace.checked;
	}

	SimpleWindow.setButtonsEnabled( false );
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

		var date = new Date();
		var logpage = 'Wikipedia:Templates for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

		// Tagging template
		var wikipedia_page = new Wikipedia.page(wgPageName, "Tagging template with deletion tag");
		wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
		wikipedia_page.setCallbackParameters({ tfdinline: tfdinline, logpage: logpage });
		wikipedia_page.load(twinklexfd.callbacks.tfd.taggingTemplate);

		// Updating data for the action completed event
		Wikipedia.actionCompleted.redirect = logpage;
		Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

		// Adding discussion
		wikipedia_page = new Wikipedia.page(logpage, "Adding discussion to today's log");
		wikipedia_page.setFollowRedirect(true);
		wikipedia_page.setCallbackParameters({ reason: reason });
		wikipedia_page.load(twinklexfd.callbacks.tfd.todaysList);

		// Notification to first contributor
		if (usertalk) {
			var thispage = new Wikipedia.page(wgPageName);
			thispage.lookupCreator(twinklexfd.callbacks.tfd.userNotification);
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
		var wikipedia_api = new Wikipedia.api( "Looking for prior nominations of this page", query, twinklexfd.callbacks.mfd.main );
		wikipedia_api.params = { usertalk: usertalk, notifyuserspace: notifyuserspace, reason: reason, noinclude: noinclude, xfdcat: xfdcat };
		wikipedia_api.post();
		break;

	case 'ffd': // FFD
		var date = new Date();
		var dateString = date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();
		var logpage = 'Wikipedia:Files for deletion/' + dateString;
		var params = { usertalk: usertalk, reason: reason, date: dateString, logpage: logpage };

		Wikipedia.addCheckpoint();
		if( puf ) {
			params.logpage = logpage = 'Wikipedia:Possibly unfree files/' + dateString;

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = logpage;
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to today's list";

			// Tagging file
			var wikipedia_page = new Wikipedia.page(wgPageName, "Tagging file with PUF tag");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(twinklexfd.callbacks.puf.taggingImage);

			// Adding discussion
			wikipedia_page = new Wikipedia.page(params.logpage, "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(twinklexfd.callbacks.puf.todaysList);

			// Notification to first contributor
			if (usertalk) {
				wikipedia_page = new Wikipedia.page(wgPageName);
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.lookupCreator(twinklexfd.callbacks.puf.userNotification);
			}

			Wikipedia.removeCheckpoint();

		} else {
			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = logpage;
			Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

			// Tagging file
			var wikipedia_page = new Wikipedia.page(wgPageName, "Adding deletion tag to file page");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(twinklexfd.callbacks.ffd.taggingImage);

			// Contributor specific edits
			wikipedia_page = new Wikipedia.page(wgPageName);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.lookupCreator(twinklexfd.callbacks.ffd.main);
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
		var logpage = 'Wikipedia:Categories for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

		var params = { reason: reason, xfdcat: xfdcat, target: target, logpage: logpage };

		// Updating data for the action completed event
		Wikipedia.actionCompleted.redirect = logpage;
		Wikipedia.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

		// Tagging category
		var wikipedia_page = new Wikipedia.page(wgPageName, "Tagging category with deletion tag");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(twinklexfd.callbacks.cfd.taggingCategory);

		// Adding discussion to list
		wikipedia_page = new Wikipedia.page(logpage, "Adding discussion to today's list");
		//wikipedia_page.setPageSection(2);
			// pageSection has been disabled - the API seems to throw up with nonexistent edit conflicts
			// it can be turned on again once the problem is fixed, to save bandwidth
		//wikipedia_page.setFollowRedirect(true);
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(twinklexfd.callbacks.cfd.todaysList);

		// Notification to first contributor
		if (usertalk) {
			wikipedia_page = new Wikipedia.page(wgPageName);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.lookupCreator(twinklexfd.callbacks.cfd.userNotification);
		}

		Wikipedia.removeCheckpoint();
		break;

	case 'rfd':
		// Find current target of redirect
		var query = {
			'action': 'query',
			'titles': wgPageName,
			'redirects': true
		};
		var wikipedia_api = new Wikipedia.api( "Finding target of redirect", query, twinklexfd.callbacks.rfd.main );
		wikipedia_api.params = { usertalk: usertalk, reason: reason };
		wikipedia_api.post();
		break;
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinklexfd", twinklexfd );