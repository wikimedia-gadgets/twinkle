/*
 ****************************************
 *** friendlytalkback.js: Talkback module
 ****************************************
 * Mode of invocation:     Tab ("TB")
 * Active on:              Existing user talk pages
 * Config directives in:   FriendlyConfig
 */
;(function(){

	Twinkle.talkback = function() {
	
		if ( Morebits.getPageAssociatedUser() === false ) {
			return;
		}
	
		twAddPortletLink( callback, "TB", "friendly-talkback", "Easy talkback" );
	};
	
	var callback = function( ) {
		if( Morebits.getPageAssociatedUser() === mw.config.get("wgUserName") && !confirm("Is it really so bad that you're talking back to yourself?") ){
			return;
		}
	
		var Window = new Morebits.simpleWindow( 600, 350 );
		Window.setTitle("Talkback");
		Window.setScriptName("Twinkle");
		Window.addFooterLink( "About {{talkback}}", "Template:Talkback" );
		Window.addFooterLink( "Twinkle help", "WP:TW/DOC#talkback" );
	
		var form = new Morebits.quickForm( callback_evaluate );
	
		form.append({ type: "radio", name: "tbtarget",
					list: [
						{
							label: "Talkback: my talk page",
							value: "mytalk",
							checked: "true" 
						},
						{
							label: "Talkback: other user talk page",
							value: "usertalk"
						},
						{
							label: "Talkback: other page",
							value: "other"
						},
						{
							label: "Noticeboard notification",
							value: "notice"
						},
						{
							label: "\"You've got mail\"",
							value: "mail"
						}
					],
					event: callback_change_target
				});
	
		form.append({
				type: "field",
				label: "Work area",
				name: "work_area"
			});
	
		form.append({ type: "submit" });
	
		var result = form.render();
		Window.setContent( result );
		Window.display();
	
		// We must init the
		var evt = document.createEvent("Event");
		evt.initEvent( "change", true, true );
		result.tbtarget[0].dispatchEvent( evt );
	};
	
	var prev_page = "";
	var prev_section = "";
	var prev_message = "";
	
	var callback_change_target = function( e ) {
		var value = e.target.values;
		var root = e.target.form;
		var old_area = Morebits.quickForm.getElements(root, "work_area")[0];
	
		if(root.section) {
			prev_section = root.section.value;
		}
		if(root.message) {
			prev_message = root.message.value;
		}
		if(root.page) {
			prev_page = root.page.value;
		}

		var work_area = new Morebits.quickForm.element({
				type: "field",
				label: "Talkback information",
				name: "work_area"
			});
	
		switch( value ) {
			case "mytalk":
				/* falls through */
			default:
				work_area.append({
						type:"input",
						name:"section",
						label:"Linked section (optional)",
						tooltip:"The section heading on your talk page where you left a message. Leave empty for no section to be linked.",
						value: prev_section
					});
				break;
			case "usertalk":
				work_area.append({
						type:"input",
						name:"page",
						label:"User",
						tooltip:"The username of the user on whose talk page you left a message.",
						value: prev_page
					});
				
				work_area.append({
						type:"input",
						name:"section",
						label:"Linked section (optional)",
						tooltip:"The section heading on the page where you left a message. Leave empty for no section to be linked.",
						value: prev_section
					});
				break;
			case "notice":
				var noticeboard = work_area.append({
						type: "select",
						name: "noticeboard",
						label: "Noticeboard:"
					});
				noticeboard.append({
						type: "option",
						label: "WP:AN (Administrators' noticeboard)",
						value: "an"
					});
				noticeboard.append({
						type: "option",
						label: "WP:AN3 (Administrators' noticeboard/Edit warring)",
						selected: true,
						value: "an3"
					});
				noticeboard.append({
						type: "option",
						label: "WP:ANI (Administrators' noticeboard/Incidents)",
						selected: true,
						value: "ani"
					});
				noticeboard.append({
						type: "option",
						label: "WP:COIN (Conflict of interest noticeboard)",
						value: "coin"
					});
				noticeboard.append({
						type: "option",
						label: "WP:DRN (Dispute resolution noticeboard)",
						value: "drn"
					});
				noticeboard.append({
						type: "option",
						label: "WP:OTRS/N (OTRS noticeboard)",
						value: "otrs"
					});
				noticeboard.append({
						type: "option",
						label: "WP:HD (Help desk)",
						value: "hd"
					});
				noticeboard.append({
						type: "option",
						label: "WP:THQ (Teahouse question forum)",
						value: "th"
					});
				work_area.append({
						type:"input",
						name:"section",
						label:"Linked thread",
						tooltip:"The heading of the relevant thread on the noticeboard page.",
						value: prev_section
					});
				break;
			case "other":
				work_area.append({
						type:"input",
						name:"page",
						label:"Full page name",
						tooltip:"The full page name where you left the message. For example: 'Wikipedia talk:Twinkle'.",
						value: prev_page
					});
				
				work_area.append({
						type:"input",
						name:"section",
						label:"Linked section (optional)",
						tooltip:"The section heading on the page where you left a message. Leave empty for no section to be linked.",
						value: prev_section
					});
				break;
			case "mail":
				work_area.append({
						type:"input",
						name:"section",
						label:"Subject of email (optional)",
						tooltip:"The subject line of the email you sent."
					});
				break;
		}
	
		if (value !== "notice") {
			work_area.append({ type:"textarea", label:"Additional message (optional):", name:"message", tooltip:"An additional message that you would like to leave below the talkback template. Your signature will be added to the end of the message if you leave one." });
		}
	
		work_area = work_area.render();
		root.replaceChild( work_area, old_area );
		if (root.message) {
			root.message.value = prev_message;
		}
	};
	
	var callback_evaluate = function( e ) {
	
		var tbtarget = e.target.getChecked( "tbtarget" )[0];
		var page = null;
		var section = e.target.section.value;
		var fullUserTalkPageName = mw.config.get("wgFormattedNamespaces")[ mw.config.get("wgNamespaceIds").user_talk ] + ":" + Morebits.getPageAssociatedUser();
	
		if( tbtarget === "usertalk" || tbtarget === "other" ) {
			page = e.target.page.value;
			
			if( tbtarget === "usertalk" ) {
				if( !page ) {
					alert("You must specify the username of the user whose talk page you left a message on.");
					return;
				}
			} else {
				if( !page ) {
					alert("You must specify the full page name when your message is not on a user talk page.");
					return;
				}
			}
		} else if (tbtarget === "notice") {
			page = e.target.noticeboard.value;
		}
	
		var message;
		if (e.target.message) {
			message = e.target.message.value;
		}
	
		Morebits.simpleWindow.setButtonsEnabled( false );
		Morebits.status.init( e.target );
	
		Morebits.wiki.actionCompleted.redirect = fullUserTalkPageName;
		Morebits.wiki.actionCompleted.notice = "Talkback complete; reloading talk page in a few seconds";
	
		var talkpage = new Morebits.wiki.page(fullUserTalkPageName, "Adding talkback");
		var tbPageName = (tbtarget === "mytalk") ? mw.config.get("wgUserName") : page;
	
		var text;
		if ( tbtarget === "notice" ) {
			switch (page) {
				case "an":
					text = "\n\n== " + Twinkle.getFriendlyPref("adminNoticeHeading") + " ==\n";
					text += "{{subst:ANI-notice|thread=" + section + "|noticeboard=Wikipedia:Administrators' noticeboard}} ~~~~";
					talkpage.setEditSummary( "Notice of discussion at [[Wikipedia:Administrators' noticeboard]]" + Twinkle.getPref("summaryAd") );
					break;
				case "an3":
					text = "\n\n{{subst:An3-notice|" + section + "}} ~~~~";
					talkpage.setEditSummary( "Notice of discussion at [[Wikipedia:Administrators' noticeboard/Edit warring]]" + Twinkle.getPref("summaryAd") );
					break;
				case "ani":
					text = "\n\n== " + Twinkle.getFriendlyPref("adminNoticeHeading") + " ==\n";
					text += "{{subst:ANI-notice|thread=" + section + "|noticeboard=Wikipedia:Administrators' noticeboard/Incidents}} ~~~~";
					talkpage.setEditSummary( "Notice of discussion at [[Wikipedia:Administrators' noticeboard/Incidents]]" + Twinkle.getPref("summaryAd") );
					break;
				case "coin":
					text = "\n\n{{subst:Coin-notice|thread=" + section + "}} ~~~~";
					talkpage.setEditSummary( "Notice of discussion at [[Wikipedia:Conflict of interest noticeboard]]" + Twinkle.getPref("summaryAd") );
					break;
				case "drn":
					text = "\n\n{{subst:DRN-notice|thread=" + section + "}} ~~~~";
					talkpage.setEditSummary( "Notice of discussion at [[Wikipedia:Dispute resolution noticeboard]]" + Twinkle.getPref("summaryAd") );
					break;
				case "hd":
					text = "\n\n== Your question at the Help desk ==\n";
					text += "{{helpdeskreply|1=" + section + "|ts=~~~~~}}";
					talkpage.setEditSummary( "You have replies at the [[Wikipedia:Help desk|Wikipedia help desk]]" + Twinkle.getPref("summaryAd") );
					break;
				case "otrs":
					text = "\n\n{{OTRSreply|1=" + section + "|2=~~~~}}";
					talkpage.setEditSummary( "You have replies at the [[Wikipedia:OTRS noticeboard|OTRS noticeboard]]" + Twinkle.getPref("summaryAd") );
					break;
				case "th":
					text = "\n\n== Teahouse talkback: you've got messages! ==\n{{WP:Teahouse/Teahouse talkback|WP:Teahouse/Questions|" + section + "|ts=~~~~}}";
					talkpage.setEditSummary( "You have replies at the [[Wikipedia:Teahouse/Questions|Teahouse question board]]" + Twinkle.getPref("summaryAd") );
					break;
				default:
					throw "Twinkle.talkback, function callback_evaluate: default case reached";
			}

		} else if ( tbtarget === "mail" ) {
			text = "\n\n==" + Twinkle.getFriendlyPref("mailHeading") + "==\n{{you've got mail|subject=";
			text += section + "|ts=~~~~~}}";

			if( message ) {
				text += "\n" + message + "  ~~~~";
			} else if( Twinkle.getFriendlyPref("insertTalkbackSignature") ) {
				text += "\n~~~~";
			}

			talkpage.setEditSummary("Notification: You've got mail" + Twinkle.getPref("summaryAd"));

		} else {
			//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
			text = "\n\n==" + Twinkle.getFriendlyPref("talkbackHeading").replace( /^\s*=+\s*(.*?)\s*=+$\s*/, "$1" ) + "==\n{{talkback|";
			text += tbPageName;

			if( section ) {
				text += "|" + section;
			}
	
			text += "|ts=~~~~~}}";
	
			if( message ) {
				text += "\n" + message + "  ~~~~";
			} else if( Twinkle.getFriendlyPref("insertTalkbackSignature") ) {
				text += "\n~~~~";
			}
	
			talkpage.setEditSummary("Talkback ([[" + (tbtarget === "other" ? "" : "User talk:") + tbPageName +
				(section ? ("#" + section) : "") + "]])" + Twinkle.getPref("summaryAd"));
		}
	
		talkpage.setAppendText( text );
		talkpage.setCreateOption("recreate");
		talkpage.setMinorEdit(Twinkle.getFriendlyPref("markTalkbackAsMinor"));
		talkpage.setFollowRedirect( true );
		talkpage.append();
	};

}());
