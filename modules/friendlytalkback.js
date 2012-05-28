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
	
		var uid = Morebits.getPageAssociatedUser();
		if ( uid === false ) {
			return;
		}
	
		twAddPortletLink( function(){ callback( uid ); }, "TB", "friendly-talkback", "Easy talkback" );
	};
	
	var callback = function( uid ) {
		if( uid === mw.config.get("wgUserName") && !confirm("Is it really so bad that you're talking back to yourself?") ){
			return;
		}
	
		var Window = new SimpleWindow( 600, 350 );
		Window.setTitle("Talkback");
		Window.setScriptName("Twinkle");
		Window.addFooterLink( "About {{talkback}}", "Template:Talkback" );
		Window.addFooterLink( "Twinkle help", "WP:TW/DOC#talkback" );
	
		var form = new QuickForm( callback_evaluate );
	
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
		form.append({ name: "uid", value: uid, type: "hidden" });
	
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
		var old_area;
	
		if(root.section) {
			prev_section = root.section.value;
		}
		if(root.message) {
			prev_message = root.message.value;
		}
		if(root.page) {
			prev_page = root.page.value;
		}
	
		for( var i = 0; i < root.childNodes.length; ++i ) {
			var node = root.childNodes[i];
			if (node instanceof Element && node.getAttribute( "name" ) === "work_area" ) {
				old_area = node;
				break;
			}
		}
		var work_area = new QuickForm.element({
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
						value: "Wikipedia:Administrators' noticeboard"
					});
				noticeboard.append({
						type: "option",
						label: "WP:ANI (Administrators' noticeboard/Incidents)",
						selected: true,
						value: "Wikipedia:Administrators' noticeboard/Incidents"
					});
				noticeboard.append({
						type: "option",
						label: "WP:DRN (Dispute resolution noticeboard)",
						value: "Wikipedia:Dispute resolution noticeboard"
					});
				noticeboard.append({
						type: "option",
						label: "WP:AN3 (Administrators' noticeboard/Edit warring)",
						value: "Wikipedia:Administrators' noticeboard/Edit warring"
					});
				noticeboard.append({
						type: "option",
						label: "WP:WQA (Wikiquette assistance)",
						value: "Wikipedia:Wikiquette assistance"
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
						label:"Subject of e-mail (optional)",
						tooltip:"The subject line of the e-mail you sent.",
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
		var uid = e.target.uid.value;
		var fullUserTalkPageName = mw.config.get("wgFormattedNamespaces")[mw.config.get("wgNamespaceIds")["user_talk"]] + ":" + uid;
	
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
	
		SimpleWindow.setButtonsEnabled( false );
		Status.init( e.target );
	
		Wikipedia.actionCompleted.redirect = fullUserTalkPageName;
		Wikipedia.actionCompleted.notice = "Talkback complete; reloading talk page in a few seconds";
	
		var talkpage = new Wikipedia.page(fullUserTalkPageName, "Adding talkback");
		var tbPageName = (tbtarget === "mytalk") ? mw.config.get("wgUserName") : page;
	
		var text;
		if ( tbtarget === "notice" ) {
			text = "\n== " + Twinkle.getFriendlyPref("adminNoticeHeading") + " ==\n{{subst:ANI-notice|thread=";
			text += section + "|noticeboard=" + tbPageName + "}} ~~~~";
	
			talkpage.setEditSummary( "Notice of discussion at [[" + tbPageName + "]]" + Twinkle.getPref("summaryAd") );

		} else if ( tbtarget === "mail" ) {
			text = "\n==" + Twinkle.getFriendlyPref("mailHeading") + "==\n{{you've got mail|subject=";
			text += section + "|ts=~~~~~}}";

			if( message ) {
				text += "\n" + message + "  ~~~~";
			} else if( Twinkle.getFriendlyPref("insertTalkbackSignature") ) {
				text += "\n~~~~";
			}

			talkpage.setEditSummary("Notification: You've got mail" + Twinkle.getPref("summaryAd"));

		} else {
			//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
			text = "\n==" + Twinkle.getFriendlyPref("talkbackHeading").replace( /^\s*=+\s*(.*?)\s*=+$\s*/, "$1" ) + "==\n{{talkback|";
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
