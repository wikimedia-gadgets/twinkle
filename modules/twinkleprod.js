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
	if( [0, 6].indexOf(mw.config.get('wgNamespaceNumber')) === -1 || !mw.config.get('wgCurRevisionId') || Morebits.wiki.isPageRedirect() ) {
		return;
	}

	Twinkle.addPortletLink( Twinkle.prod.callback, "PROD", "tw-prod", "Propose deletion via WP:PROD" );
};

// Used in edit summaries, for comparisons, etc.
var namespace;

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	// TODO: add 'book' as well, namespace number 108
	switch (mw.config.get('wgNamespaceNumber')) {
		case 0:
			namespace = 'article';
			break;
		case 6:
			namespace = 'file';
			break;
	}

	var Window = new Morebits.simpleWindow( 800, 410 );
	Window.setTitle( "Proposed deletion (PROD)" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Proposed deletion policy", "WP:PROD" );

	if (namespace === 'article') {
		Window.addFooterLink( "BLP PROD policy", "WP:BLPPROD" );
	}

	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#prod" );

	var form = new Morebits.quickForm( Twinkle.prod.callback.evaluate );

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

	form.append( {
			type: 'field',
			label:'Work area',
			name: 'work_area'
		} );

	form.append( { type:'submit', label:'Propose deletion' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// Fake a change event on the first prod type radio, to initialize the type-dependent controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.prodtype[0].dispatchEvent( evt );

	// Hide fieldset for PROD type if File namespace since only normal PROD is allowed
	if (namespace === 'file') {
		$('#prodtype_fieldset').hide();
	}
};

Twinkle.prod.callback.prodtypechanged = function(event) {
	//prepare frame for prod type dependant controls
	var field = new Morebits.quickForm.element( {
			type: 'field',
			label: 'Parameters',
			name: 'work_area'
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
				}
			);
			field.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Reason for proposed deletion:',
					value: Twinkle.prod.defaultReason
				} );
			break;

		case 'prodblp':
			// first, remember the prod value that the user entered in the textarea, in case he wants to switch back. We can abuse the config field for that.
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
							tooltip: 'Creator of ' + namespace + ' has to be notified.',
							checked: true,
							disabled: true
						}
					]
				}
			);
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

	event.target.form.replaceChild( field.render(), $(event.target.form).find('fieldset[name="work_area"]')[0] );
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

		var tag_re = /({{(?:db-?|delete|[aitcmrs]fd|md1)[^{}]*?\|?[^{}]*?}})/i;
		if( tag_re.test( text ) ) {
			statelem.warn( 'Page already tagged with a deletion template, aborting procedure' );
			return;
		}

		// Remove tags that become superfluous with this action
		text = text.replace(/{{\s*(new unreviewed article|unreviewed|userspace draft|mtc|(copy|move) to wikimedia commons|(copy |move )?to ?commons)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi, "");
		var prod_re = /{{\s*(?:dated prod|dated files|dated prod blp|Prod blp\/dated|Proposed deletion\/dated)\s*\|(?:{{[^{}]*}}|[^{}])*}}/i;
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

			summaryText = "Proposing " + namespace + " for deletion per [[WP:" + (params.blp ? "BLP" : "") + "PROD]].";
			text = "{{subst:prod" + (params.blp ? " blp" : ("|1=" + Morebits.string.formatReasonText(params.reason))) + "}}\n" + text;
		}
		else {  // already tagged for PROD, so try endorsing it
			var prod2_re = /{{(?:Proposed deletion endorsed|prod-?2).*?}}/;
			if( prod2_re.test( text ) ) {
				statelem.warn( 'Page already tagged with {{proposed deletion}} and {{proposed deletion endorsed}} templates, aborting procedure' );
				return;
			}
			var confirmtext = "A {{proposed deletion}} tag was already found on this " + namespace + ". \nWould you like to add a {{proposed deletion endorsed}} tag with your explanation?";
			if (params.blp) {
				confirmtext = "A non-BLP {{proposed deletion}} tag was found on this article.\nWould you like to add a {{proposed deletion endorsed}} tag with explanation \"article is a biography of a living person with no sources\"?";
			}
			if( !confirm( confirmtext ) ) {
				statelem.warn( 'Aborted per user request' );
				return;
			}

			summaryText = "Endorsing proposed deletion per [[WP:" + (params.blp ? "BLP" : "") + "PROD]].";
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
		var notifyTemplate = params.blp ? 'prodwarningBLP' : 'proposed deletion notify';

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

		// create monthly header
		var date = new Date();
		var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
		if (!headerRe.exec(text)) {
			text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
		}

		var summarytext;
		if (params.logEndorsing) {
			text += "\n# [[:" + Morebits.pageNameNorm + "]]: endorsed " + (params.blp ? "BLP " : "") + "PROD. ~~~~~";
			if (params.reason) {
				text += "\n#* '''Reason''': " + params.reason + "\n";
			}
			summarytext = "Logging endorsement of PROD nomination of [[:" + Morebits.pageNameNorm + "]].";
		} else {
			text += "\n# [[:" + Morebits.pageNameNorm + "]]: " + (params.blp ? "BLP " : "") + "PROD";
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

	var prodtypes = form.prodtype;
	for( var i = 0; i < prodtypes.length; i++ ) {
		if( !prodtypes[i].checked ) {
			continue;
		}
		prodtype = prodtypes[i].values;
		break;
	}

	var params = {
		usertalk: form.notify.checked,
		blp: prodtype === 'prodblp',
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
