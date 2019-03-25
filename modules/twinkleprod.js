//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("PROD")
 * Active on:              Existing articles and files which are not redirects
 * Config directives in:   TwinkleConfig
 */

Twinkle.prod = function twinkleprod() {
	if( [0, 6, 108].indexOf(mw.config.get('wgNamespaceNumber')) === -1 || !mw.config.get('wgCurRevisionId') || Morebits.wiki.isPageRedirect() ) {
		return;
	}

	Twinkle.addPortletLink( Twinkle.prod.callback, "PROD", "tw-prod", "Propose deletion via WP:PROD" );
};

// Used in edit summaries, for comparisons, etc.
var namespace;

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	switch (mw.config.get('wgNamespaceNumber')) {
		case 0:
			namespace = 'article';
			break;
		case 6:
			namespace = 'file';
			break;
		case 108:
			namespace = 'book';
			break;
	}

	var Window = new Morebits.simpleWindow( 800, 410 );
	Window.setTitle( "Proposed deletion (PROD)" );
	Window.setScriptName( "Twinkle" );

	var form = new Morebits.quickForm( Twinkle.prod.callback.evaluate );

	if (namespace === 'article') {
		Window.addFooterLink( "Proposed deletion policy", "WP:PROD" );
		Window.addFooterLink( "BLP PROD policy", "WP:BLPPROD" );
	} else if ( namespace === 'file' ) {
		Window.addFooterLink( "Proposed deletion policy", "WP:PROD" );
	} else {	// if namespace === 'book'
		Window.addFooterLink( "Proposed deletion (books) policy", "WP:BOOKPROD" );
	}

	var field = form.append( {
		type: 'field',
		label: 'PROD type',
		id: 'prodtype_fieldset'
	} );

	field.append( {
			type: 'radio',
			name: 'prodtype',
			event: Twinkle.prod.callback.prodtypechanged,
			list: [
				{
					label: 'PROD (proposed deletion)',
					value: 'prod',
					checked: true,
					tooltip: 'Normal proposed deletion, per [[WP:PROD]]'
				},
				{
					label: 'BLP PROD (proposed deletion of unsourced BLPs)',
					value: 'prodblp',
					tooltip: 'Proposed deletion of new, completely unsourced biographies of living persons, per [[WP:BLPPROD]]'
				}
			]
		} );

	// Placeholder fieldset to be replaced in Twinkle.prod.callback.prodtypechanged
	form.append( {
		type: 'field',
		name: 'parameters'
	} );

	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#prod" );

	form.append( { type:'submit', label:'Propose deletion' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// Hide fieldset for PROD type in File and Book namespaces since only normal PROD is allowed
	if(namespace !== 'article') {
		$(result).find('#prodtype_fieldset').hide();
	}
	
	// Fake a change event on the first prod type radio, to initialize the type-dependent controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.prodtype[0].dispatchEvent( evt );

};


Twinkle.prod.callback.prodtypechanged = function(event) {
	//prepare frame for prod type dependant controls
	var field = new Morebits.quickForm.element( {
			type: 'field',
			label: 'Parameters',
			name: 'parameters'
		} );
	// create prod type dependant controls
	switch( event.target.values ) {
		case 'prod':
			field.append( {
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
				} );
			field.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Reason for proposed deletion:',
					value: Twinkle.prod.defaultReason
				} );
			break;

		case 'prodblp':
			// first, remember the prod value that the user entered in the textarea, in case they want to switch back. We can abuse the config field for that.
			if (event.target.form.reason) {
				Twinkle.prod.defaultReason = event.target.form.reason.value;
			}

			field.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Notify page creator if possible',
							value: 'notify',
							name: 'notify',
							tooltip: 'Creator of article has to be notified.',
							checked: true,
							disabled: true
						}
					]
				} );
			//temp warning, can be removed down the line once BLPPROD is more established. Amalthea, May 2010.
			var boldtext = document.createElement('b');
			boldtext.appendChild(document.createTextNode('Please note that only unsourced biographies of living persons are eligible for this tag, narrowly construed.'));
			field.append({
				type: 'div',
				label: boldtext
			});
			break;

		default:
			break;
	}

	event.target.form.replaceChild( field.render(), $(event.target.form).find('fieldset[name="parameters"]')[0] );
};

Twinkle.prod.callbacks = {
	main: function(pageobj) {
		var statelem = pageobj.getStatusElement();

		if( !pageobj.exists() ) {
			statelem.error( "It seems that the page doesn't exist. Perhaps it has already been deleted." );
			return;
		}

		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// Check for already existing deletion tags
		var tag_re = /({{(?:db-?|delete|[aitcmrs]fd|md1)[^{}]*?\|?[^{}]*?}})/i;
		if( tag_re.test( text ) ) {
			statelem.warn( 'Page already tagged with a deletion template, aborting procedure' );
			return;
		}

		// Alert if article is not in Category:Living people and BLPPROD is selected
		if( params.blp ) {
			var blpcheck_re = /\[\[Category:Living people\]\]/i;
			if( !blpcheck_re.test( text ) ) {
				if( ! confirm("Please note that the article is not in Category:Living people and hence may be ineligible for BLPPROD. Are you sure you want to continue? \n\nYou may wish to add the category if you proceed, unless the article is about a recently deceased person." ) ) {
					return;
				}
			}
		}

		// Remove tags that become superfluous with this action
		text = text.replace(/{{\s*(userspace draft|mtc|(copy|move) to wikimedia commons|(copy |move )?to ?commons)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi, "");
		var prod_re = /{{\s*(?:Prod blp|Proposed deletion|book-prod)\/dated( files)?\s*\|(?:{{[^{}]*}}|[^{}])*}}/i;
		var summaryText;
		if( !prod_re.test( text ) ) {
			// Notification to first contributor
			if( params.usertalk ) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreator(Twinkle.prod.callbacks.userNotification);
			}
			// If not notifying, log this PROD
			else if( Twinkle.getPref('logProdPages') ) {
				Twinkle.prod.callbacks.addToLog(params);
			}
			if(params.blp) {
				summaryText = "Proposing article for deletion per [[WP:BLPPROD]].";
				text = "{{subst:prod blp" + (params.usertalk ? "|help=off" : "") + "}}\n" + text;
			}
			else if(params.book) {
				summaryText = "Proposing book for deletion per [[WP:BOOKPROD]].";
				text = "{{subst:book-prod|1=" + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? "|help=off" : "") + "}}\n" + text;
			}
			else {
				summaryText = "Proposing " + namespace + " for deletion per [[WP:PROD]].";
				text = "{{subst:prod|1=" + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? "|help=off" : "") + "}}\n" + text;
			}
		}
		else {  // already tagged for PROD, so try endorsing it
			var prod2_re = /{{(?:Proposed deletion endorsed|prod-?2).*?}}/;
			if( prod2_re.test( text ) ) {
				statelem.warn( 'Page already tagged with {{proposed deletion}} and {{proposed deletion endorsed}} templates, aborting procedure' );
				return;
			}
			var confirmtext = "A {{proposed deletion}} tag was already found on this page. \nWould you like to add a {{proposed deletion endorsed}} tag with your explanation?";
			if (params.blp) {
				confirmtext = "A non-BLP {{proposed deletion}} tag was found on this article.\nWould you like to add a {{proposed deletion endorsed}} tag with explanation \"article is a biography of a living person with no sources\"?";	
				// FIXME: this msg is shown even if it was a BLPPROD tag. 
			}
			if( !confirm( confirmtext ) ) {
				statelem.warn( 'Aborted per user request' );
				return;
			}

			summaryText = "Endorsing proposed deletion per [[WP:" + (params.blp ? "BLP" : (params.book ? "BOOK" : "")) + "PROD]].";
			text = text.replace( prod_re, text.match( prod_re ) + "\n{{proposed deletion endorsed|1=" + (params.blp ?
				"article is a [[WP:BLPPROD|biography of a living person with no sources]]" :
				Morebits.string.formatReasonText(params.reason)) + "}}\n" );

			if( Twinkle.getPref('logProdPages') ) {
				params.logEndorsing = true;
				Twinkle.prod.callbacks.addToLog(params);
			}
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getPref('watchProdPages'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},

	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// Disallow warning yourself
		if (initialContrib === mw.config.get("wgUserName")) {
			pageobj.getStatusElement().warn("You (" + initialContrib + ") created this page; skipping user notification");
			if (Twinkle.getPref("logProdPages")) {
				Twinkle.prod.callbacks.addToLog(params);
			}
			return;
		}

		// [[Template:Proposed deletion notify]] supports File namespace
		var notifyTemplate;
		if(params.blp) {
			notifyTemplate = 'prodwarningBLP';
		} else if (params.book) {
			notifyTemplate = 'bprodwarning';
		} else {
			notifyTemplate = 'proposed deletion notify';
		}
		var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
		var notifytext = "\n{{subst:" + notifyTemplate + "|1=" + Morebits.pageNameNorm + "|concern=" + params.reason + "}} ~~~~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Notification: proposed deletion of [[:" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
		usertalkpage.setCreateOption('recreate');
		usertalkpage.setFollowRedirect(true);
		usertalkpage.append();
		if (Twinkle.getPref('logProdPages')) {
			params.logInitialContrib = initialContrib;
			Twinkle.prod.callbacks.addToLog(params);
		}
	},

	addToLog: function(params) {
		var wikipedia_page = new Morebits.wiki.page("User:" + mw.config.get('wgUserName') + "/" + Twinkle.getPref('prodLogPageName'), "Adding entry to userspace log");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.prod.callbacks.saveLog);
	},

	saveLog: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// add blurb if log page doesn't exist
		if (!pageobj.exists()) {
			text =
				"This is a log of all [[WP:PROD|proposed deletion]] tags applied or endorsed by this user using [[WP:TW|Twinkle]]'s PROD module.\n\n" +
				"If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and " +
				"nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].\n";
		}

		// create monthly header if it doesn't exist already
		var date = new Date();
		var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
		if (!headerRe.exec(text)) {
			text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
		}

		var summarytext;
		if (params.logEndorsing) {
			text += "\n# [[:" + Morebits.pageNameNorm + "]]: endorsed " + (params.blp ? "BLP " : (params.book ? "BOOK" : "")) + "PROD. ~~~~~";
			if (params.reason) {
				text += "\n#* '''Reason''': " + params.reason + "\n";
			}
			summarytext = "Logging endorsement of PROD nomination of [[:" + Morebits.pageNameNorm + "]].";
		} else {
			text += "\n# [[:" + Morebits.pageNameNorm + "]]: " + (params.blp ? "BLP " : (params.book ? "BOOK" : "")) + "PROD";
			if (params.logInitialContrib) {
				text += "; notified {{user|" + params.logInitialContrib + "}}";
			}
			text += " ~~~~~\n";
			if (!params.blp) {
				text += "#* '''Reason''': " + params.reason + "\n";
			}
			summarytext = "Logging PROD nomination of [[:" + Morebits.pageNameNorm + "]].";
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summarytext + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption("recreate");
		pageobj.save();
	}
};

Twinkle.prod.callback.evaluate = function twinkleprodCallbackEvaluate(e) {
	var form = e.target;
	var prodtype;
	
	if( namespace === 'article' ) {
		var prodtypes = form.prodtype;
		for( var i = 0; i < prodtypes.length; i++ ) {
			if( prodtypes[i].checked ) {
				prodtype = prodtypes[i].values;
				break;
			}
		}
	}

	var params = {
		usertalk: form.notify.checked,
		blp: prodtype === 'prodblp',
		book: namespace === 'book',
		reason: prodtype === 'prodblp' ? '' : form.reason.value  // using an empty string here as fallback will help with prod-2.
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Tagging complete";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging page");
	wikipedia_page.setFollowRedirect(true);  // for NPP, and also because redirects are ineligible for PROD
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.prod.callbacks.main);
};
})(jQuery);


//</nowiki>
