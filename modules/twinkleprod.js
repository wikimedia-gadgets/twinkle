//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("Đề nghị xóa")
 * Active on:              Existing articles which are not redirects
 * Config directives in:   TwinkleConfig
 */

Twinkle.prod = function twinkleprod() {
	if( mw.config.get('wgNamespaceNumber') !== 0 || !mw.config.get('wgCurRevisionId') || Morebits.wiki.isPageRedirect() ) {
		return;
	}

	Twinkle.addPortletLink( Twinkle.prod.callback, "Đề nghị xóa", "tw-prod", "Đề nghị xóa theo WP:PROD" );
};

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	var Window = new Morebits.simpleWindow( 800, 410 );
	Window.setTitle( "Đề nghị xóa (PROD)" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Quy định xóa", "WP:PROD" );
	Window.addFooterLink( "Quy định xóa về BLP", "WP:BLPPROD" );
	Window.addFooterLink( "Trợ giúp Twinkle", "WP:TW/DOC#prod" );

	var form = new Morebits.quickForm( Twinkle.prod.callback.evaluate );

	var field = form.append( {
			type: 'field',
			label: 'PROD type'
		} );
	field.append( {
			type: 'radio',
			name: 'prodtype',
			event: Twinkle.prod.callback.prodtypechanged,
			list: [
				{
					label: 'PROD (đề nghị xóa)',
					value: 'prod',
					checked: true,
					tooltip: 'Đề nghị xóa thông thường, theo [[WP:PROD]]'
				},
				{
					label: 'BLP PROD (đề nghị xóa về người còn sống không nguồn)',
					value: 'prodblp',
					tooltip: 'Đề nghị xóa về bài viết mới về người còn sống hoàn toàn không nguồn, theo [[WP:BLPPROD]]'
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

	// fake a change event on the first prod type radio, to initialize the type-dependent controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.prodtype[0].dispatchEvent( evt );
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
							label: 'Thông báo cho ngược tạo trang nếu có thể',
							value: 'notify',
							name: 'notify',
							tooltip: "Chèn một bản mẫu thông báo vào trang thảo luận của người tạo trang nếu thỏa.",
							checked: true
						}
					]
				}
			);
			field.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Lý do đề nghị xóa:',
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
							label: 'Thông báo cho người tạo trang nếu có thể',
							value: 'notify',
							name: 'notify',
							tooltip: 'Cần thông báo cho người tạo trang.',
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
			if (mw.config.get('wgArticleId') < 26596183) {
				field.append({
					type: 'header',
					label: 'Có thể thấy rằng bài viết này được tạo trước ngày 18 tháng 3 năm 2010, và nó không thõa nãm các tiêu chuẩn về đề nghị xóa đối với bài viết về tiểu sử người còn sống (BLP PROD). Hãy chắc chắn rằng trường hợp này là ngoại lệ, hoặc có thể sử dụng đề nghị xóa thông thường.'
				});
			}
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
			statelem.error( "Có thể bài chưa không tồn tại, hoặc có thể nó đã bị xóa." );
			return;
		}

		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var tag_re = /(\{\{(?:db-?|delete|[aitcmrs]fd|md1)[^{}]*?\|?[^{}]*?\}\})/i;
		if( tag_re.test( text ) ) {
			statelem.warn( 'Một bản mẫu xóa đã được chèn vào trang này, bỏ qua tác vụ' );
			return;
		}

		// Remove tags that become superfluous with this action
		text = text.replace(/\{\{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");

		var prod_re = /\{\{\s*(?:dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated)\s*\|(?:\{\{[^\{\}]*\}\}|[^\}\{])*\}\}/i;
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

			summaryText = "Bài viết được đề nghị xóa theo [[WP:" + (params.blp ? "BLP" : "") + "PROD]].";
			text = "{{subst:prod" + (params.blp ? " blp" : ("|1=" + Morebits.string.formatReasonText(params.reason))) + "}}\n" + text;
		}
		else {  // already tagged for PROD, so try endorsing it
			var prod2_re = /\{\{(?:Proposed deletion endorsed|prod-?2).*?\}\}/;
			if( prod2_re.test( text ) ) {
				statelem.warn( 'Bài viết đã được chèn bản mẫu {{prod}} và {{prod-2}}, bỏ qua tác vụ' );
				return;
			}
			var confirmtext = "Bản mẫu {{prod}} đã có trong bài viết này. \nBạn có muốn thêm bản mẫu {{prod-2}} (PROD endorsement) kèm theo giải thích của bạn?";
			if (params.blp) {
				confirmtext = "Bản mẫu {{prod}} không phải BLP đã có trong bài viết này. \nBạn có muốn them bản mẫu {{prod-2}} (PROD endorsement) kèm theo lời giải thích \"article is a biography of a living person with no sources\"?";
			}
			if( !confirm( confirmtext ) ) {
				statelem.warn( 'Aborted per user request' );
				return;
			}

			summaryText = "Endorsing proposed deletion per [[WP:" + (params.blp ? "BLP" : "") + "PROD]].";
			text = text.replace( prod_re, text.match( prod_re ) + "\n{{prod-2|1=" + (params.blp ?
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

		var usertalkpage = new Morebits.wiki.page('Thảo luận Thành viên:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
		var notifytext = "\n{{subst:prodwarning" + (params.blp ? "BLP" : "") + "|1=" + Morebits.pageNameNorm + "|concern=" + params.reason + "}} ~~~~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Notification: proposed deletion of [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
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
				"nominate this page for speedy deletion under [[WP:XN#U1|XN U1]].\n";
		}

		// create monthly header
		var date = new Date();
		var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
		if (!headerRe.exec(text)) {
			text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
		}

		var summarytext;
		if (params.logEndorsing) {
			text += "\n# [[" + Morebits.pageNameNorm + "]]: endorsed " + (params.blp ? "BLP " : "") + "PROD. ~~~~~";
			if (params.reason) {
				text += "\n#* '''Lý do''': " + params.reason + "\n";
			}
			summarytext = "Logging endorsement of PROD nomination of [[" + Morebits.pageNameNorm + "]].";
		} else {
			text += "\n# [[" + Morebits.pageNameNorm + "]]: " + (params.blp ? "BLP " : "") + "PROD";
			if (params.logInitialContrib) {
				text += "; notified {{user|" + params.logInitialContrib + "}}";
			}
			text += " ~~~~~\n";
			if (!params.blp) {
				text += "#* '''Lý do''': " + params.reason + "\n";
			}
			summarytext = "Logging PROD nomination of [[" + Morebits.pageNameNorm + "]].";
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

	if (prodtype === 'prodblp' && mw.config.get('wgArticleId') < 26596183) {
		if (!confirm( "It appears that this article was created before March 18, 2010, and is thus ineligible for a BLP PROD. Do you want to continue tagging it?" )) {
			Morebits.status.warn( 'Notice', 'Aborting per user input.' );
			return;
		}
	}

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Thêm thông báo hoàn tất";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging page");
	wikipedia_page.setFollowRedirect(true);  // for NPP, and also because redirects are ineligible for PROD
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.prod.callbacks.main);
};
})(jQuery);


//</nowiki>
