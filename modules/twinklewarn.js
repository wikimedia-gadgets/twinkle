/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              User talk pages
 * Config directives in:   TwinkleConfig
 */

Twinkle.warn = function twinklewarn() {
	if( mw.config.get('wgNamespaceNumber') === 3 ) {
			twAddPortletLink( Twinkle.warn.callback, "Warn", "tw-warn", "Warn/notify user" );
	}

	// modify URL of talk page on rollback success pages
	if( mw.config.get('wgAction') === 'rollback' ) {
		var $vandalTalkLink = $("#mw-rollback-success .mw-usertoollinks a").first();
		$vandalTalkLink.css("font-weight", "bold");
		$vandalTalkLink.wrapInner($("<span/>").attr("title", "If appropriate, you can use Twinkle to warn the user about their edits to this page."));

		var extraParam = "vanarticle=" + mw.util.rawurlencode(mw.config.get("wgPageName").replace(/_/g, " "));
		var href = $vandalTalkLink.attr("href");
		if (href.indexOf("?") === -1) {
			$vandalTalkLink.attr("href", href + "?" + extraParam);
		} else {
			$vandalTalkLink.attr("href", href + "&" + extraParam);
		}
	}
};

Twinkle.warn.callback = function twinklewarnCallback() {
	if ( !twinkleUserAuthorized ) {
		alert("Your account is too new to use Twinkle.");
		return;
	}
	if( mw.config.get('wgTitle').split( '/' )[0] === mw.config.get('wgUserName') &&
			!confirm( 'Warning yourself can be seen as a sign of mental instability! Are you sure you want to proceed?' ) ) {
		return;
	}
	
	var Window = new Morebits.simpleWindow( 600, 440 );
	Window.setTitle( "Warn/notify user" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Choosing a warning level", "WP:UWUL#Levels" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#warn" );

	var form = new Morebits.quickForm( Twinkle.warn.callback.evaluate );
	var main_select = form.append( {
			type:'field',
			label:'Choose type of warning/notice to issue',
			tooltip:'First choose a main warning group, then the specific warning to issue.'
		} );

	var main_group = main_select.append( {
			type:'select',
			name:'main_group',
			event:Twinkle.warn.callback.change_category
		} );

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append( { type:'option', label:'General note (1)', value:'level1', selected: ( defaultGroup === 1 || defaultGroup < 1 || ( Morebits.userIsInGroup( 'sysop' ) ? defaultGroup > 8 : defaultGroup > 7 ) ) } );
	main_group.append( { type:'option', label:'Caution (2)', value:'level2', selected: ( defaultGroup === 2 ) } );
	main_group.append( { type:'option', label:'Warning (3)', value:'level3', selected: ( defaultGroup === 3 ) } );
	main_group.append( { type:'option', label:'Final warning (4)', value:'level4', selected: ( defaultGroup === 4 ) } );
	main_group.append( { type:'option', label:'Only warning (4im)', value:'level4im', selected: ( defaultGroup === 5 ) } );
	main_group.append( { type:'option', label:'Single issue notices', value:'singlenotice', selected: ( defaultGroup === 6 ) } );
	main_group.append( { type:'option', label:'Single issue warnings', value:'singlewarn', selected: ( defaultGroup === 7 ) } );
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		main_group.append( { type:'option', label:'Blocking', value:'block', selected: ( defaultGroup === 8 ) } );
	}

	main_select.append( { type:'select', name:'sub_group', event:Twinkle.warn.callback.change_subcategory } ); //Will be empty to begin with.

	form.append( {
			type:'input',
			name:'article',
			label:'Linked article',
			value:( Morebits.queryString.exists( 'vanarticle' ) ? Morebits.queryString.get( 'vanarticle' ) : '' ),
			tooltip:'An article can be linked within the notice, perhaps because it was a revert to said article that dispatched this notice. Leave empty for no article to be linked.'
		} );

	var more = form.append( { type: 'field', name: 'reasonGroup', label: 'Warning information' } );
	more.append( { type:'textarea', label:'Optional message:', name:'reason', tooltip:'Perhaps a reason, or that a more detailed notice must be appended' } );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'Preview';
	more.append( { type: 'div', id: 'warningpreview', label: [ previewlink ] } );
	more.append( { type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' } );

	more.append( { type:'submit', label:'Submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// We must init the first choice (General Note);
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.main_group.dispatchEvent( evt );
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	level1: {
		"uw-vandalism1": {
			label:"Vandalism",
			summary:"General note: Nonconstructive editing"
		},
		"uw-test1": {
			label:"Editing tests",
			summary:"General note: Editing tests"
		},
		"uw-delete1": {
			label:"Removal of content, blanking",
			summary:"General note: Removal of content, blanking"
		},
		"uw-redirect1": { 
			label:"Creating malicious redirects", 
			summary:"General note: Creating malicious redirects" 
		},
		"uw-tdel1": { 
			label:"Removal of maintenance templates", 
			summary:"General note: Removal of maintenance templates" 
		},
		"uw-joke1": { 
			label:"Using improper humor", 
			summary:"General note: Using improper humor" 
		},
		"uw-create1": { 
			label:"Creating inappropriate pages", 
			summary:"General note: Creating inappropriate pages" 
		},
		"uw-upload1": { 
			label:"Uploading unencyclopedic images", 
			summary:"General note: Uploading unencyclopedic images" 
		},
		"uw-image1": { 
			label:"Image-related vandalism", 
			summary:"General note: Image-related vandalism" 
		},
		"uw-ics1": { 
			label:"Uploading files missing copyright status", 
			summary:"General note: Uploading files missing copyright status" 
		},
		"uw-idt1": { 
			label:"Removing file deletion tags", 
			summary:"General note: Removing file deletion tags" 
		},
		"uw-spam1": { 
			label:"Adding spam links", 
			summary:"General note: Adding spam links" 
		},
		"uw-advert1": { 
			label:"Using Wikipedia for advertising or promotion", 
			summary:"General note: Using Wikipedia for advertising or promotion" 
		},
		"uw-npov1": { 
			label:"Not adhering to neutral point of view", 
			summary:"General note: Not adhering to neutral point of view" 
		},
		"uw-unsourced1": { 
			label:"Addition of unsourced or improperly cited material", 
			summary:"General note: Addition of unsourced or improperly cited material" 
		},
		"uw-error1": { 
			label:"Introducing deliberate factual errors", 
			summary:"General note: Introducing factual errors" 
		},
		"uw-nor1": { 
			label:"Adding original research, including unpublished syntheses of source material", 
			summary:"General note: Adding original research, including unpublished syntheses of source material" 
		},
		"uw-biog1": { 
			label:"Adding unreferenced controversial information about living persons", 
			summary:"General note: Adding unreferenced controversial information about living persons" 
		},
		"uw-defam1": { 
			label:"Addition of defamatory content", 
			summary:"General note: Addition of defamatory content" 
		},
		"uw-uncen1": { 
			label:"Censorship of material", 
			summary:"General note: Censorship of material" 
		},
		"uw-mos1": { 
			label:"Manual of style", 
			summary:"General note: Formatting, date, language, etc (Manual of style)" 
		},
		"uw-move1": { 
			label:"Page moves against naming conventions or consensus", 
			summary:"General note: Page moves against naming conventions or consensus" 
		},
		"uw-chat1": { 
			label:"Using talk page as forum", 
			summary:"General note: Using talk page as forum" 
		},
		"uw-tpv1": { 
			label:"Refactoring others' talk page comments", 
			summary:"General note: Refactoring others' talk page comments" 
		},
		"uw-afd1": { 
			label:"Removing {{afd}} templates",
			summary:"General note: Removing {{afd}} templates"
		},
		"uw-speedy1": { 
			label:"Removing {{speedy deletion}} templates",
			summary:"General note: Removing {{speedy deletion}} templates"
		},
		"uw-blpprod1": { 
			label:"Removing {{blp prod}} templates",
			summary:"General note: Removing {{blp prod}} templates"
		},
		"uw-npa1": { 
			label:"Personal attack directed at a specific editor", 
			summary:"General note: Personal attack directed at a specific editor" 
		},
		"uw-agf1": { 
			label:"Not assuming good faith", 
			summary:"General note: Not assuming good faith" 
		},
		"uw-own1": { 
			label:"Ownership of articles", 
			summary:"General note: Ownership of articles"
		},
		"uw-tempabuse1": { 
			label:"Improper use of warning or blocking template", 
			summary:"General note: Improper use of warning or blocking template"
		},
		"uw-genre1": { 
			label:"Frequent or mass changes to genres without consensus or references", 
			summary:"General note: Frequent or mass changes to genres without consensus or references"
		}
	},
	level2: {
		"uw-vandalism2": { 
			label:"Vandalism", 
			summary:"Caution: Vandalism" 
		},
		"uw-test2": { 
			label:"Editing tests", 
			summary:"Caution: Editing tests" 
		},
		"uw-delete2": { 
			label:"Removal of content, blanking",
			summary:"Caution: Removal of content, blanking"
		},
		"uw-redirect2": { 
			label:"Creating malicious redirects", 
			summary:"Caution: Creating malicious redirects" 
		},
		"uw-tdel2": { 
			label:"Removal of maintenance templates", 
			summary:"Caution: Removal of maintenance templates" 
		},
		"uw-joke2": { 
			label:"Using improper humor", 
			summary:"Caution: Using improper humor" 
		},
		"uw-create2": { 
			label:"Creating inappropriate pages", 
			summary:"Caution: Creating inappropriate pages" 
		},
		"uw-upload2": { 
			label:"Uploading unencyclopedic images", 
			summary:"Caution: Uploading unencyclopedic images" 
		},
		"uw-image2": { 
			label:"Image-related vandalism", 
			summary:"Caution: Image-related vandalism" 
		},
		"uw-ics2": { 
			label:"Uploading files missing copyright status", 
			summary:"Caution: Uploading files missing copyright status" 
		},
		"uw-idt2": { 
			label:"Removing file deletion tags", 
			summary:"Caution: Removing file deletion tags" 
		},
		"uw-spam2": { 
			label:"Adding spam links", 
			summary:"Caution: Adding spam links" 
		},
		"uw-advert2": { 
			label:"Using Wikipedia for advertising or promotion", 
			summary:"Caution: Using Wikipedia for advertising or promotion" 
		},
		"uw-npov2": { 
			label:"Not adhering to neutral point of view", 
			summary:"Caution: Not adhering to neutral point of view" 
		},
		"uw-unsourced2": { 
			label:"Addition of unsourced or improperly cited material", 
			summary:"Caution: Addition of unsourced or improperly cited material" 
		},
		"uw-error2": { 
			label:"Introducing deliberate factual errors", 
			summary:"Caution: Introducing factual errors" 
		},
		"uw-nor2": { 
			label:"Adding original research, including unpublished syntheses of sourced material", 
			summary:"Caution: Adding original research, including unpublished syntheses of sourced material"
		},
		"uw-biog2": { 
			label:"Adding unreferenced controversial information about living persons", 
			summary:"Caution: Adding unreferenced controversial information about living persons" 
		},
		"uw-defam2": { 
			label:"Addition of defamatory content", 
			summary:"Caution: Addition of defamatory content" 
		},
		"uw-uncen2": { 
			label:"Censorship of material", 
			summary:"Caution: Censorship of material" 
		},
		"uw-mos2": { 
			label:"Manual of style", 
			summary:"Caution: Formatting, date, language, etc (Manual of style)" 
		},
		"uw-move2": { 
			label:"Page moves against naming conventions or consensus", 
			summary:"Caution: Page moves against naming conventions or consensus" 
		},
		"uw-chat2": { 
			label:"Using talk page as forum", 
			summary:"Caution: Using talk page as forum" 
		},
		"uw-tpv2": { 
			label:"Refactoring others' talk page comments", 
			summary:"Caution: Refactoring others' talk page comments" 
		},
		"uw-afd2": { 
			label:"Removing {{afd}} templates",
			summary:"Caution: Removing {{afd}} templates"
		},
		"uw-speedy2": { 
			label:"Removing {{speedy deletion}} templates",
			summary:"Caution: Removing {{speedy deletion}} templates"
		},
		"uw-blpprod2": { 
			label:"Removing {{blp prod}} templates",
			summary:"Caution: Removing {{blp prod}} templates"
		},
		"uw-npa2": { 
			label:"Personal attack directed at a specific editor", 
			summary:"Caution: Personal attack directed at a specific editor" 
		},
		"uw-agf2": { 
			label:"Not assuming good faith", 
			summary:"Caution: Not assuming good faith" 
		},
		"uw-own2": { 
			label:"Ownership of articles", 
			summary:"Caution: Ownership of articles"
		},
		"uw-tempabuse2": { 
			label:"Improper use of warning or blocking template", 
			summary:"Caution: Improper use of warning or blocking template"
		},
		"uw-genre2": { 
			label:"Frequent or mass changes to genres without consensus or references", 
			summary:"Caution: Frequent or mass changes to genres without consensus or references"
		}
	},
	level3: {
		"uw-vandalism3": { 
			label:"Vandalism", 
			summary:"Warning: Vandalism" 
		},
		"uw-test3": { 
			label:"Editing tests", 
			summary:"Warning: Editing tests" 
		},
		"uw-delete3": { 
			label:"Removal of content, blanking", 
			summary:"Warning: Removal of content, blanking"
		},
		"uw-redirect3": { 
			label:"Creating malicious redirects", 
			summary:"Warning: Creating malicious redirects" 
		},
		"uw-tdel3": { 
			label:"Removal of maintenance templates", 
			summary:"Warning: Removal of maintenance templates" 
		},
		"uw-joke3": { 
			label:"Using improper humor", 
			summary:"Warning: Using improper humor" 
		},
		"uw-create3": { 
			label:"Creating inappropriate pages", 
			summary:"Warning: Creating inappropriate pages" 
		},
		"uw-upload3": { 
			label:"Uploading unencyclopedic images", 
			summary:"Warning: Uploading unencyclopedic images" 
		},
		"uw-image3": { 
			label:"Image-related vandalism", 
			summary:"Warning: Image-related vandalism" 
		},
		"uw-ics3": { 
			label:"Uploading files missing copyright status", 
			summary:"Warning: Uploading files missing copyright status" 
		},
		"uw-idt3": { 
			label:"Removing file deletion tags", 
			summary:"Warning: Removing file deletion tags" 
		},
		"uw-spam3": { 
			label:"Adding spam links", 
			summary:"Warning: Adding spam links" 
		},
		"uw-advert3": { 
			label:"Using Wikipedia for advertising or promotion", 
			summary:"Warning: Using Wikipedia for advertising or promotion" 
		},
		"uw-npov3": { 
			label:"Not adhering to neutral point of view", 
			summary:"Warning: Not adhering to neutral point of view" 
		},
		"uw-unsourced3": { 
			label:"Addition of unsourced or improperly cited material", 
			summary:"Warning: Addition of unsourced or improperly cited material" 
		},
		"uw-error3": { 
			label:"Introducing deliberate factual errors", 
			summary:"Warning: Introducing deliberate factual errors" 
		},
		"uw-nor3": { 
			label:"Adding original research, including unpublished syntheses of sourced material", 
			summary:"Warning: Adding original research, including unpublished syntheses of sourced material"
		},
		"uw-biog3": { 
			label:"Adding unreferenced controversial or defamatory information about living persons", 
			summary:"Warning: Adding unreferenced controversial information about living persons" 
		},
		"uw-defam3": { 
			label:"Addition of defamatory content", 
			summary:"Warning: Addition of defamatory content" 
		},
		"uw-uncen3": { 
			label:"Censorship of material", 
			summary:"Warning: Censorship of material" 
		},
		"uw-mos3": { 
			label:"Manual of style", 
			summary:"Warning: Formatting, date, language, etc (Manual of style)" 
		},
		"uw-move3": { 
			label:"Page moves against naming conventions or consensus", 
			summary:"Warning: Page moves against naming conventions or consensus" 
		},
		"uw-chat3": { 
			label:"Using talk page as forum", 
			summary:"Warning: Using talk page as forum" 
		},
		"uw-tpv3": { 
			label:"Refactoring others' talk page comments", 
			summary:"Warning: Refactoring others' talk page comments" 
		},
		"uw-afd3": { 
			label:"Removing {{afd}} templates",
			summary:"Warning: Removing {{afd}} templates"
		},
		"uw-speedy3": { 
			label:"Removing {{speedy deletion}} templates",
			summary:"Warning: Removing {{speedy deletion}} templates"
		},
		"uw-blpprod3": { 
			label:"Removing {{blpprod}} templates",
			summary:"Warning: Removing {{blpprod}} templates"
		},
		"uw-npa3": { 
			label:"Personal attack directed at a specific editor", 
			summary:"Warning: Personal attack directed at a specific editor" 
		},
		"uw-agf3": { 
			label:"Not assuming good faith", 
			summary:"Warning: Not assuming good faith" 
		},
		"uw-own3": { 
			label:"Ownership of articles", 
			summary:"Warning: Ownership of articles"
		},
		"uw-genre3": { 
			label:"Frequent or mass changes to genres without consensus or reference", 
			summary:"Warning: Frequent or mass changes to genres without consensus or reference"
		}

	},
	level4: {
		"uw-generic4": { 
			label:"Generic warning (for template series missing level 4)", 
			summary:"Final warning notice" 
		},
		"uw-vandalism4": { 
			label:"Vandalism", 
			summary:"Final warning: Vandalism" 
		},
		"uw-test4": { 
			label:"Editing tests", 
			summary:"Final warning: Editing tests" 
		},
		"uw-delete4": { 
			label:"Removal of content, blanking", 
			summary:"Final warning: Removal of content, blanking" 
		},
		"uw-redirect4": { 
			label:"Creating malicious redirects", 
			summary:"Final warning: Creating malicious redirects" 
		},
		"uw-tdel4": { 
			label:"Removal of maintenance templates", 
			summary:"Final warning: Removal of maintenance templates" 
		},
		"uw-joke4": { 
			label:"Using improper humor", 
			summary:"Final warning: Using improper humor" 
		},
		"uw-create4": { 
			label:"Creating inappropriate pages", 
			summary:"Final warning: Creating inappropriate pages" 
		},
		"uw-upload4": { 
			label:"Uploading unencyclopedic images", 
			summary:"Final warning: Uploading unencyclopedic images" 
		},
		"uw-image4": { 
			label:"Image-related vandalism", 
			summary:"Final warning: Image-related vandalism" 
		},
		"uw-ics4": { 
			label:"Uploading files missing copyright status", 
			summary:"Final warning: Uploading files missing copyright status" 
		},
		"uw-idt4": { 
			label:"Removing file deletion tags", 
			summary:"Final warning: Removing file deletion tags" 
		},
		"uw-spam4": { 
			label:"Adding spam links", 
			summary:"Final warning: Adding spam links" 
		},
		"uw-advert4": { 
			label:"Using Wikipedia for advertising or promotion", 
			summary:"Final warning: Using Wikipedia for advertising or promotion" 
		},
		"uw-npov4": { 
			label:"Not adhering to neutral point of view", 
			summary:"Final warning: Not adhering to neutral point of view" 
		},
		"uw-error4": { 
			label:"Introducing deliberate factual errors", 
			summary:"Final Warning: Introducing deliberate factual errors"
		},
		"uw-nor4": { 
			label:"Adding original research, including unpublished syntheses of sourced material", 
			summary:"Final Warning: Adding original research, including unpublished syntheses of sourced material"
		},
		"uw-biog4": { 
			label:"Adding unreferenced defamatory information about living persons", 
			summary:"Final warning: Adding unreferenced controversial information about living persons" 
		},
		"uw-defam4": { 
			label:"Addition of defamatory content", 
			summary:"Final warning: Addition of defamatory content" 
		},
		"uw-uncen4": { 
			label:"Censorship of material", 
			summary:"Final warning: Censorship of material" 
		},
		"uw-mos4": { 
			label:"Manual of style", 
			summary:"Final warning: Formatting, date, language, etc (Manual of style)" 
		},
		"uw-move4": { 
			label:"Page moves against naming conventions or consensus", 
			summary:"Final warning: Page moves against naming conventions or consensus" 
		},
		"uw-chat4": { 
			label:"Using talk page as forum", 
			summary:"Final warning: Using talk page as forum" 
		},
		"uw-tpv4": { 
			label:"Refactoring others' talk page comments", 
			summary:"Final warning: Refactoring others' talk page comments" 
		},
		"uw-afd4": { 
			label:"Removing {{afd}} templates",
			summary:"Final warning: Removing {{afd}} templates"
		},
		"uw-speedy4": { 
			label:"Removing {{speedy deletion}} templates",
			summary:"Final warning: Removing {{speedy deletion}} templates"
		},
		"uw-blpprod4": { 
			label:"Removing {{blpprod}} templates",
			summary:"Final warning: Removing {{blpprod}} templates"
		},
		"uw-npa4": { 
			label:"Personal attack directed at a specific editor", 
			summary:"Final warning: Personal attack directed at a specific editor"
		}

	},
	level4im: {
		"uw-vandalism4im": { 
			label:"Vandalism", 
			summary:"Only warning: Vandalism" 
		},
		"uw-delete4im": { 
			label:"Removal of content, blanking", 
			summary:"Only warning: Removal of content, blanking" 
		},
		"uw-redirect4im": { 
			label:"Creating malicious redirects", 
			summary:"Only warning: Creating malicious redirects" 
		},
		"uw-joke4im": { 
			label:"Using improper humor", 
			summary:"Only warning: Using improper humor" 
		},
		"uw-create4im": { 
			label:"Creating inappropriate pages", 
			summary:"Only warning: Creating inappropriate pages" 
		},
		"uw-upload4im": { 
			label:"Uploading unencyclopedic images", 
			summary:"Only warning: Uploading unencyclopedic images" 
		},
		"uw-image4im": { 
			label:"Image-related vandalism", 
			summary:"Only warning: Image-related vandalism" 
		},
		"uw-spam4im": { 
			label:"Adding spam links", 
			summary:"Only warning: Adding spam links" 
		},
		"uw-advert4im": { 
			label:"Using Wikipedia for advertising or promotion", 
			summary:"Only warning: Using Wikipedia for advertising or promotion" 
		},
		"uw-biog4im": { 
			label:"Adding unreferenced defamatory information about living persons", 
			summary:"Only warning: Adding unreferenced controversial information about living persons" 
		},
		"uw-defam4im": { 
			label:"Addition of defamatory content", 
			summary:"Only warning: Addition of defamatory content" 
		},
		"uw-move4im": { 
			label:"Page moves against naming conventions or consensus", 
			summary:"Only warning: Page moves against naming conventions or consensus" 
		},
		"uw-npa4im": { 
			label:"Personal attack directed at a specific editor", 
			summary:"Only warning: Personal attack directed at a specific editor"
		}
	},
	singlenotice: {
		"uw-2redirect": { 
			label:"Creating double redirects through bad page moves", 
			summary:"Notice: Creating double redirects through bad page moves" 
		},
		"uw-aiv": { 
			label:"Bad AIV report", 
			summary:"Notice: Bad AIV report" 
		},
		"uw-articlesig": { 
			label:"Adding signatures to article space", 
			summary:"Notice: Adding signatures to article space" 
		},
		"uw-autobiography": { 
			label:"Creating autobiographies", 
			summary:"Notice: Creating autobiographies" 
		},
		"uw-badcat": { 
			label:"Adding incorrect categories", 
			summary:"Notice: Adding incorrect categories" 
		},
		"uw-badlistentry": {
			label:"Adding inappropriate entries to lists",
			summary:"Notice: Adding inappropriate entries to lists"
		},
		"uw-bite": { 
			label:"\"Biting\" newcomers", 
			summary:"Notice: \"Biting\" newcomers" 
		},
		"uw-coi": { 
			label:"Conflict of Interest", 
			summary:"Notice: Conflict of Interest" 
		},
		"uw-controversial": { 
			label:"Introducing controversial material", 
			summary:"Notice: Introducing controversial material" 
		},
		"uw-copying": {
			label:"Copying text to another page",
			summary:"Notice: Copying text to another page"
		},
		"uw-crystal": {
			label:"Adding speculative or unconfirmed information",
			summary:"Notice: Adding speculative or unconfirmed information"
		},
		"uw-csd": {
			label:"Speedy deletion declined",
			summary:"Notice: Speedy deletion declined"
		},
		"uw-c&pmove": { 
			label:"Cut and paste moves", 
			summary:"Notice: Cut and paste moves" 
		},
		"uw-dab": {
			label:"Incorrect edit to a disambiguation page",
			summary:"Notice: Incorrect edit to a disambiguation page"
		},
		"uw-date": { 
			label:"Unnecessarily changing date formats", 
			summary:"Notice: Unnecessarily changing date formats" 
		},
		"uw-deadlink": { 
			label:"Removing proper sources containing dead links", 
			summary:"Notice: Removing proper sources containing dead links" 
		},
		"uw-directcat": { 
			label:"Applying stub categories manually", 
			summary:"Notice: Applying stub categories manually" 
		},
		"uw-draftfirst": { 
			label:"User should draft in userspace without the risk of speedy deletion", 
			summary:"Notice: Consider drafting your article in [[Help:Userspace draft|userspace]]"
		},
		"uw-editsummary": { 
			label:"Not using edit summary", 
			summary:"Notice: Not using edit summary" 
		},
		"uw-english": { 
			label:"Not communicating in English", 
			summary:"Notice: Not communicating in English" 
		},
		"uw-fuir": { 
			label:"Fair use image has been removed from your userpage", 
			summary:"Notice: A fair use image has been removed from your userpage" 
		},
		"uw-hasty": { 
			label:"Hasty addition of speedy deletion tags", 
			summary:"Notice: Allow creators time to improve their articles before tagging them for deletion"
		},
		"uw-imageuse": {
			label:"Incorrect image linking",
			summary:"Notice: Incorrect image linking"
		},
		"uw-incompleteAFD": {
			label:"Incomplete AFD",
			summary:"Notice: Incomplete AFD"
		},
		"uw-italicize": { 
			label:"Italicize books, films, albums, magazines, TV series, etc within articles", 
			summary:"Notice: Italicize books, films, albums, magazines, TV series, etc within articles" 
		},
		"uw-lang": { 
			label:"Unnecessarily changing between British and American English", 
			summary:"Notice: Unnecessarily changing between British and American English" 
		},
		"uw-linking": { 
			label:"Excessive addition of redlinks or repeated blue links", 
			summary:"Notice: Excessive addition of redlinks or repeated blue links" 
		},
		"uw-minor": { 
			label:"Incorrect use of minor edits check box", 
			summary:"Notice: Incorrect use of minor edits check box" 
		},
		"uw-nonfree": { 
			label:"Uploading replaceable non-free images", 
			summary:"Notice: Uploading replaceable non-free images" 
		},
		"uw-notaiv": { 
			label:"Do not report complex abuse to AIV", 
			summary:"Notice: Do not report complex abuse to AIV" 
		},
		"uw-notenglish": {
			label:"Creating non-English articles",
			summary:"Notice: Creating non-English articles"
		},
		"uw-notifysd": { 
			label:"Notify authors of speedy deletion tagged articles", 
			summary:"Notice: Please notify authors of articles tagged for speedy deletion"
		},
		"uw-notvand": {
			label:"Mislabelling edits as vandalism",
			summary:"Notice: Misidentifying edits as vandalism"
		},
		"uw-notvote": {
			label:"We use consensus, not voting", 
			summary:"Notice: We use consensus, not voting" 
		},
		"uw-patrolled": { 
			label:"Mark newpages as patrolled when patrolling", 
			summary:"Notice: Mark newpages as patrolled when patrolling" 
		},
		"uw-plagiarism": { 
			label:"Copying from public domain sources without attribution", 
			summary:"Notice: Copying from public domain sources without attribution" 
		},
		"uw-preview": { 
			label:"Use preview button to avoid mistakes", 
			summary:"Notice: Use preview button to avoid mistakes" 
		},
		"uw-probation": { 
			label:"Article is on probation", 
			summary:"Notice: Article is on probation" 
		},
		"uw-refimprove": {
			label:"Creating unverifiable articles",
			summary:"Notice: Creating unverifiable articles"
		},
		"uw-removevandalism": {
			label:"Incorrect vandalism removal",
			summary:"Notice: Incorrect vandalism removal"
		},
		"uw-repost": { 
			label:"Recreating material previously deleted via XfD process", 
			summary:"Notice: Recreating previously deleted material" 
		},
		"uw-salt": { 
			label:"Recreating salted articles under a different title", 
			summary:"Notice: Recreating salted articles under a different title" 
		},
		"uw-samename": { 
			label:"Rename request impossible", 
			summary:"Notice: Rename request impossible"
		},
		"uw-selfrevert": { 
			label:"Reverting self tests", 
			summary:"Notice: Reverting self tests" 
		},
		"uw-skype": {
			label:"Skype interfering with editing",
			summary:"Notice: Skype interfering with editing"
		},
		"uw-socialnetwork": { 
			label:"Wikipedia is not a social network", 
			summary:"Notice: Wikipedia is not a social network" 
		},
		"uw-sofixit": { 
			label:"Be bold and fix things yourself",
			summary:"Notice: You can be bold and fix things yourself" 
		},
		"uw-spoiler": {
			label:"Adding spoiler alerts or removing supposed spoilers from appropriate sections",
			summary:"Notice: Don't delete or flag potential 'spoilers' in Wikipedia articles"
		},
		"uw-subst": { 
			label:"Remember to subst: templates", 
			summary:"Notice: Remember to subst: templates" 
		},
		"uw-talkinarticle": { 
			label:"Talk in article", 
			summary:"Notice: Talk in article" 
		},
		"uw-tilde": { 
			label:"Not signing posts", 
			summary:"Notice: Not signing posts" 
		},
		"uw-toppost": { 
			label:"Posting at the top of talk pages", 
			summary:"Notice: Posting at the top of talk pages" 
		},
		"uw-uaa": { 
			label:"Reporting of username to WP:UAA not accepted", 
			summary:"Notice: Reporting of username to WP:UAA not accepted" 
		},
		"uw-upincat": { 
			label:"Informing user that one of his/her pages had accidentally been included in a content category", 
			summary:"Notice: Informing user that one of his/her pages had accidentally been included in a content category" 
		},
		"uw-uploadfirst": { 
			label:"Attempting to display an external image on a page", 
			summary:"Notice: Attempting to display an external image on a page" 
		},
		"uw-userspace draft finish": { 
			label:"Stale userspace draft", 
			summary:"Notice: Stale userspace draft" 
		},
		"uw-userspacenoindex": { 
			label:"User page/subpage isn't appropriate for search engine indexing", 
			summary:"Notice: User (sub)page isn't appropriate for search engine indexing" 
		},
		"uw-vgscope": {
			label:"Adding video game walkthroughs, cheats or instructions",
			summary:"Notice: Adding video game walkthroughs, cheats or instructions"
		},
		"uw-warn": { 
			label:"Place user warning templates when reverting vandalism", 
			summary:"Notice: You can use user warning templates when reverting vandalism"
		}
	},
	singlewarn: {
		"uw-3rr": { 
			label:"Violating the three-revert rule; see also uw-ew",
			summary:"Warning: Violating the three-revert rule"
		},
		"uw-affiliate": { 
			label:"Affiliate marketing", 
			summary:"Warning: Affiliate marketing"
		},
		"uw-agf-sock": { 
			label:"Use of multiple accounts (assuming good faith)", 
			summary:"Warning: Using multiple accounts"
		},
		"uw-attack": {
			label:"Creating attack pages",
			summary:"Warning: Creating attack pages",
			suppressArticleInSummary: true
		},
		"uw-attempt": {
			label:"Triggering the edit filter",
			summary:"Warning: Triggering the edit filter"
		},
		"uw-bizlist": {
			label:"Business promotion",
			summary:"Warning: Promoting a business"
		},
		"uw-botun": {
			label:"Bot username",
			summary:"Warning: Bot username"
		},
		"uw-canvass": {
			label:"Canvassing",
			summary:"Warning: Canvassing"
		},
		"uw-copyright": {
			label:"Copyright violation",
			summary:"Warning: Copyright violation"
		},
		"uw-copyright-link": { 
			label:"Linking to copyrighted works violation",
			summary:"Warning: Linking to copyrighted works violation" 
		},
		"uw-copyright-remove": {
			label:"Removing {{copyvio}} template from articles",
			summary:"Warning: Removing {{copyvio}} templates"
		},
		"uw-efsummary": {
			label:"Edit summary triggering the edit filter",
			summary:"Warning: Edit summary triggering the edit filter"
		},
		"uw-ew": {
			label:"Edit warring; see also uw-3rr",
			summary:"Warning: Edit warring"
		},
		"uw-hoax": { 
			label:"Creating hoaxes", 
			summary:"Warning: Creating hoaxes" 
		},
		"uw-legal": { 
			label:"Making legal threats", 
			summary:"Warning: Making legal threats" 
		},
		"uw-longterm": { 
			label:"Long term pattern of vandalism", 
			summary:"Warning: Long term pattern of vandalism" 
		},
		"uw-multipleIPs": { 
			label:"Usage of multiple IPs", 
			summary:"Warning: Usage of multiple IPs" 
		},
		"uw-pinfo": { 
			label:"Personal info", 
			summary:"Warning: Personal info" 
		},
		"uw-protect": { 
			label:"Attempting to pursue an inappropriate relationship with another user", 
			summary:"Warning: Attempting to pursue an inappropriate relationship with another user" 
		},
		"uw-socksuspect": {
			label:"Sockpuppetry",
			summary:"Warning: You are a suspected [[WP:SOCK|sockpuppet]]"  // of User:...
		},
		"uw-upv": { 
			label:"Userpage vandalism", 
			summary:"Warning: Userpage vandalism"
		},
		"uw-username": { 
			label:"Username is against policy", 
			summary:"Warning: Your username might be against policy"
		},
		"uw-coi-username": { 
			label:"Username is against policy, and conflict of interest", 
			summary:"Warning: Username and conflict of interest policy"
		},
		"uw-userpage": { 
			label:"Userpage or subpage is against policy", 
			summary:"Warning: Userpage or subpage is against policy"
		},
		"uw-wrongsummary": { 
			label:"Using inaccurate or inappropriate edit summaries", 
			summary:"Warning: Using inaccurate or inappropriate edit summaries"
		}
	},
	block: {
		"uw-block": {
			label: "Block",
			summary: "You have been blocked from editing",
			pageParam: true,
			reasonParam: true  // allows editing of reason for generic templates
		},
		"uw-blocknotalk": {
			label: "Block - talk page disabled",
			summary: "You have been blocked from editing and your user talk page has been disabled",
			pageParam: true,
			reasonParam: true
		},
		"uw-blockindef": {
			label: "Block - indefinite",
			summary: "You have been indefinitely blocked from editing",
			indefinite: true,
			pageParam: true,
			reasonParam: true
		},
		"uw-ablock": {
			label: "Block - IP address",
			summary: "Your IP address has been blocked from editing",
			pageParam: true
		},
		"uw-vblock": {
			label: "Vandalism block",
			summary: "You have been blocked from editing for persistent [[WP:VAND|vandalism]]",
			pageParam: true
		},
		"uw-voablock": {
			label: "Vandalism-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]]",
			indefinite: true,
			pageParam: true
		},
		"uw-bioblock": {
			label: "BLP violations block",
			summary: "You have been blocked from editing for violations of Wikipedia's [[WP:BLP|biographies of living persons policy]]",
			pageParam: true
		},
		"uw-sblock": {
			label: "Spam block",
			summary: "You have been blocked from editing for using Wikipedia for [[WP:SPAM|spam]] purposes"
		},
		"uw-adblock": {
			label: "Advertising block",
			summary: "You have been blocked from editing for [[WP:SOAP|advertising or self-promotion]]",
			pageParam: true
		},
		"uw-soablock": {
			label: "Spam/advertising-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam, advertising, or promotion]]",
			indefinite: true,
			pageParam: true
		},
		"uw-npblock": {
			label: "Creating nonsense pages block",
			summary: "You have been blocked from editing for creating [[WP:PN|nonsense pages]]",
			pageParam: true
		},
		"uw-copyrightblock": {
			label: "Copyright violation block",
			summary: "You have been blocked from editing for continued [[WP:COPYVIO|copyright infringement]]",
			pageParam: true
		},
		"uw-spoablock": {
			label: "Sockpuppet account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SOCK|sock puppetry]]",
			indefinite: true
		},
		"uw-hblock": {
			label: "Harassment block",
			summary: "You have been blocked from editing for attempting to [[WP:HARASS|harass]] other users",
			pageParam: true
		},
		"uw-ewblock": {
			label: "Edit warring block",
			summary: "You have been blocked from editing to prevent further [[WP:DE|disruption]] caused by your engagement in an [[WP:EW|edit war]]",
			pageParam: true
		},
		"uw-3block": {
			label: "Three-revert rule violation block",
			summary: "You have been blocked from editing for violation of the [[WP:3RR|three-revert rule]]",
			pageParam: true
		},
		"uw-disruptblock": {
			label: "Disruptive editing block",
			summary: "You have been blocked from editing for [[WP:DE|disruptive editing]]",
			pageParam: true
		},
		"uw-deoablock": {
			label: "Disruption/trolling-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:DE|trolling, disruption or harassment]]",
			indefinite: true,
			pageParam: true
		},
		"uw-lblock": {
			label: "Legal threat block (indefinite)",
			summary: "You have been indefinitely blocked from editing for making [[WP:NLT|legal threats or taking legal action]]",
			indefinite: true
		},
		"uw-aeblock": {
			label: "Arbitration enforcement block",
			summary: "You have been blocked from editing for violating an [[WP:Arbitration|arbitration decision]] with your edits",
			pageParam: true,
			reasonParam: true
		},
		"uw-efblock": {
			label: "Edit filter-related block",
			summary: "You have been blocked from editing for making disruptive edits that repeatedly triggered the [[WP:EF|edit filter]]"
		},
		"uw-myblock": {
			label: "Social networking block",
			summary: "You have been blocked from editing for using user and/or article pages as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]",
			pageParam: true
		},
		"uw-dblock": {
			label: "Deletion/removal of content block",
			summary: "You have been blocked from editing for continued [[WP:VAND|removal of material]]",
			pageParam: true
		},
		"uw-compblock": {
			label: "Possible compromised account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because it is believed that your [[WP:SECURE|account has been compromised]]",
			indefinite: true
		},
		"uw-botblock": {
			label: "Unapproved bot block",
			summary: "You have been blocked from editing because it appears you are running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]",
			pageParam: true
		},
		"uw-ublock": {
			label: "Username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your username is a violation of the [[WP:U|username policy]]",
			indefinite: true,
			reasonParam: true
		},
		"uw-uhblock": {
			label: "Username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]]",
			indefinite: true,
			reasonParam: true
		},
		"uw-softerblock": {
			label: "Promotional username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website",
			indefinite: true
		},
		"uw-causeblock": {
			label: "Promotional username soft block, for charitable causes (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website",
			indefinite: true
		},
		"uw-botublock": {
			label: "Bot username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this is a [[WP:BOT|bot]] account, which is currently not approved",
			indefinite: true
		},
		"uw-memorialblock": {
			label: "Memorial username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this account may be used as a memorial or tribute to someone",
			indefinite: true
		},
		"uw-ublock-famous": {
			label: "Famous username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] matches the name of a well-known living individual",
			indefinite: true
		},
		"uw-ublock-double": {
			label: "Similar username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] is too similar to the username of another Wikipedia user",
			indefinite: true
		},
		"uw-uhblock-double": {
			label: "Username impersonation hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] appears to impersonate another established Wikipedia user",
			indefinite: true
		},
		"uw-vaublock": {
			label: "Vandalism-only account and username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]] and your username is a blatant violation of the [[WP:U|username policy]]",
			indefinite: true,
			pageParam: true
		},
		"uw-spamublock": {
			label: "Spam-only account and promotional username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam or advertising]] and your username is a violation of the [[WP:U|username policy]]",
			indefinite: true
		}
	}
};

Twinkle.warn.prev_block_timer = null;
Twinkle.warn.prev_block_reason = null;
Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	var messages = Twinkle.warn.messages[ value ];
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if( old_subvalue ) {
		old_subvalue = old_subvalue.replace(/\d*(im)?$/, '' );
		old_subvalue_re = new RegExp( RegExp.escape( old_subvalue ) + "(\\d*(?:im)?)$" );
	}

	while( sub_group.hasChildNodes() ){
		sub_group.removeChild( sub_group.firstChild );
	}

	for( var i in messages ) {
		var selected = false;
		if( old_subvalue && old_subvalue_re.test( i ) ) {
			selected = true;
		}
		var elem = new Morebits.quickForm.element( { type:'option', label:"{{" + i + "}}: " + messages[i].label, value:i, selected: selected } );
		
		sub_group.appendChild( elem.render() );
	}

	if( value === 'block' ) {
		// create the block-related fields
		var more = new Morebits.quickForm.element( { type: 'div', id: 'block_fields' } );
		more.append( {
			type: 'input',
			name: 'block_timer',
			label: 'Period of blocking: ',
			tooltip: 'The period the blocking is due for, for example 24 hours, 2 weeks, indefinite etc...'
		} );
		more.append( {
			type: 'input',
			name: 'block_reason',
			label: '"You have been blocked for ..." ',
			tooltip: 'An optional reason, to replace the default generic reason. Only available for the generic block templates.'
		} );
		e.target.root.insertBefore( more.render(), e.target.root.lastChild );

		// restore saved values of fields
		if(Twinkle.warn.prev_block_timer !== null) {
			e.target.root.block_timer.value = Twinkle.warn.prev_block_timer;
			Twinkle.warn.prev_block_timer = null;
		}
		if(Twinkle.warn.prev_block_reason !== null) {
			e.target.root.block_reason.value = Twinkle.warn.prev_block_reason;
			Twinkle.warn.prev_block_reason = null;
		}
		if(Twinkle.warn.prev_article === null) {
			Twinkle.warn.prev_article = e.target.root.article.value;
		}
		e.target.root.article.disabled = false;

		$(e.target.root.reason).parent().hide();
		e.target.root.previewer.closePreview();
	} else if( e.target.root.block_timer ) {
		// hide the block-related fields
		if(!e.target.root.block_timer.disabled && Twinkle.warn.prev_block_timer === null) {
			Twinkle.warn.prev_block_timer = e.target.root.block_timer.value;
		}
		if(!e.target.root.block_reason.disabled && Twinkle.warn.prev_block_reason === null) {
			Twinkle.warn.prev_block_reason = e.target.root.block_reason.value;
		}
		$(e.target.root).find("#block_fields").remove();

		if(e.target.root.article.disabled && Twinkle.warn.prev_article !== null) {
			e.target.root.article.value = Twinkle.warn.prev_article;
			Twinkle.warn.prev_article = null;
		}
		e.target.root.article.disabled = false;

		$(e.target.root.reason).parent().show();
		e.target.root.previewer.closePreview();
	}
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	if( main_group === 'singlewarn' ) {
		if( value === 'uw-username' ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.disabled = true;
			e.target.form.article.value = '';
		} else if( e.target.form.article.disabled ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.disabled = false;
		}
	} else if( main_group === 'block' ) {
		if( Twinkle.warn.messages.block[value].indefinite ) {
			if(Twinkle.warn.prev_block_timer === null) {
				Twinkle.warn.prev_block_timer = e.target.form.block_timer.value;
			}
			e.target.form.block_timer.disabled = true;
			e.target.form.block_timer.value = 'indefinite';
		} else if( e.target.form.block_timer.disabled ) {
			if(Twinkle.warn.prev_block_timer !== null) {
				e.target.form.block_timer.value = Twinkle.warn.prev_block_timer;
				Twinkle.warn.prev_block_timer = null;
			}
			e.target.form.block_timer.disabled = false;
		}

		if( Twinkle.warn.messages.block[value].pageParam ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.disabled = false;
		} else if( !e.target.form.article.disabled ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.disabled = true;
			e.target.form.article.value = '';
		}

		if( Twinkle.warn.messages.block[value].reasonParam ) {
			if(Twinkle.warn.prev_block_reason !== null) {
				e.target.form.block_reason.value = Twinkle.warn.prev_block_reason;
				Twinkle.warn.prev_block_reason = null;
			}
			e.target.form.block_reason.disabled = false;
		} else if( !e.target.form.block_reason.disabled ) {
			if(Twinkle.warn.prev_block_reason === null) {
				Twinkle.warn.prev_block_reason = e.target.form.block_reason.value;
			}
			e.target.form.block_reason.disabled = true;
			e.target.form.block_reason.value = '';
		}
	}

	var $article = $(e.target.form.article);
	if (main_group === "singlewarn" && value === "uw-socksuspect") {
		$article.prev().hide();
		$article.before('<span id="tw-spi-article-username">Username of sock master, if known (without User:) </span>');
	} else {
		$("span#tw-spi-article-username").remove();
		$article.prev().show();
	}
};

Twinkle.warn.callbacks = {
	preview: function(form) {
		var templatename = form.sub_group.value;
		
		var templatetext = '{{subst:' + templatename;
		var linkedarticle = form.article.value;
		if (templatename in Twinkle.warn.messages.block) {
			if( linkedarticle && Twinkle.warn.messages.block[templatename].pageParam ) {
				templatetext += '|page=' + linkedarticle;
			}

			var blocktime = form.block_timer.value;
			if( /te?mp|^\s*$|min/.exec( blocktime ) || Twinkle.warn.messages.block[templatename].indefinite ) {
				; // nothing
			} else if( /indef|\*|max/.exec( blocktime ) ) {
				templatetext += '|indef=yes';
			} else {
				templatetext += '|time=' + blocktime;
			}

			var blockreason = form.block_reason.value;
			if( blockreason ) {
				templatetext += '|reason=' + blockreason;
			}

			templatetext += "|sig=true}}";
		} else {
			if (linkedarticle) {
				// add linked article for user warnings (non-block templates)
				templatetext += '|1=' + linkedarticle;
			}
			templatetext += '}}';

			// add extra message for non-block templates
			var reason = form.reason.value;
			if (reason) {
				templatetext += " ''" + reason + "''";
			}
		}

		form.previewer.beginRender(templatetext);
	},
	main: function( pageobj ) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var messageData = Twinkle.warn.messages[params.main_group][params.sub_group];

		var history_re = /<!-- Template:(uw-.*?) -->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4}) \(UTC\)/g;
		var history = {};
		var latest = { date:new Date( 0 ), type:'' };
		var current;

		while( ( current = history_re.exec( text ) ) ) {
			var current_date = new Date( current[2] + ' UTC' );
			if( !( current[1] in history ) ||  history[ current[1] ] < current_date ) {
				history[ current[1] ] = current_date;
			}
			if( current_date > latest.date ) {
				latest.date = current_date;
				latest.type = current[1];
			}
		}

		var date = new Date();

		if( params.sub_group in history ) {
			var temp_time = new Date( history[ params.sub_group ] );
			temp_time.setUTCHours( temp_time.getUTCHours() + 24 );

			if( temp_time > date ) {
				if( !confirm( "An identical " + params.sub_group + " has been issued in the last 24 hours.  \nWould you still like to add this warning/notice?" ) ) {
					pageobj.statelem.info( 'aborted per user request' );
					return;
				}
			}
		}

		latest.date.setUTCMinutes( latest.date.getUTCMinutes() + 1 ); // after long debate, one minute is max

		if( latest.date > date ) {
			if( !confirm( "A " + latest.type + " has been issued in the last minute.  \nWould you still like to add this warning/notice?" ) ) {
				pageobj.statelem.info( 'aborted per user request' );
				return;
			}
		}
		
		var mainheaderRe = new RegExp("==+\\s*Warnings\\s*==+");
		var headerRe = new RegExp( "^==+\\s*(?:" + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +  ")\\s+" + date.getUTCFullYear() + "\\s*==+", 'm' );

		if( text.length > 0 ) {
			text += "\n\n";
		}

		if( params.main_group === 'block' ) {
			var article = '', reason = '', time = null;
			
			if( Twinkle.getPref('blankTalkpageOnIndefBlock') && params.sub_group !== 'uw-lblock' && ( Twinkle.warn.messages.block[params.sub_group].indefinite || (/indef|\*|max/).exec( params.block_timer ) ) ) {
				Morebits.status.info( 'Info', 'Blanking talk page per preferences and creating a new level 2 heading for the date' );
				text = "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			} else if( !headerRe.exec( text ) ) {
				Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}
			
			if( params.article && Twinkle.warn.messages.block[params.sub_group].pageParam ) {
				article = '|page=' + params.article;
			}
			
			if( params.reason && Twinkle.warn.messages.block[params.sub_group].reasonParam ) {
				reason = '|reason=' + params.reason;
			}
			
			if( /te?mp|^\s*$|min/.exec( params.block_timer ) || Twinkle.warn.messages.block[params.sub_group].indefinite ) {
				time = '';
			} else if( /indef|\*|max/.exec( params.block_timer ) ) {
				time = '|indef=yes';
			} else {
				time = '|time=' + params.block_timer;
			}

			text += "{{subst:" + params.sub_group + article + time + reason + "|sig=true|subst=subst:}}";
		} else {
			if( !headerRe.exec( text ) ) {
				Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}

			switch( params.sub_group ) {
				case 'uw-username':
					text += "{{subst:" + params.sub_group + ( params.reason ? '|1=' + params.reason : '' ) + "|subst=subst:}} ~~~~";
					break;
				default:
					text += "{{subst:" + params.sub_group + ( params.article ? '|1=' + params.article : '' ) + "|subst=subst:}}" + (params.reason ? " ''" + params.reason + "'' ": ' ' ) + "~~~~";
					break;
			}
		}
		
		if ( Twinkle.getPref('showSharedIPNotice') && Morebits.isIPAddress( mw.config.get('wgTitle') ) ) {
			Morebits.status.info( 'Info', 'Adding a shared IP notice' );
			text +=  "\n{{subst:SharedIPAdvice}}";
		}

		var summary = messageData.summary;
		if ( messageData.suppressArticleInSummary !== true && params.article ) {
			if ( params.sub_group === "uw-socksuspect" ) {  // this template requires a username
				summary += " of [[User:" + params.article + "]]";
			} else {
				summary += " on [[" + params.article + "]]";
			}
		}
		summary += "." + Twinkle.getPref("summaryAd");

		pageobj.setPageText( text );
		pageobj.setEditSummary( summary );
		pageobj.setWatchlist( Twinkle.getPref('watchWarnings') );
		pageobj.save();
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {

	// First, check to make sure a reason was filled in if uw-username was selected
	
	if(e.target.sub_group.value === 'uw-username' && e.target.reason.value.trim() === '') {
		alert("You must supply a reason for the {{uw-username}} template.");
		return;
	}

	// Then, grab all the values provided by the form
	
	var params = {
		reason: e.target.block_reason ? e.target.block_reason.value : e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value,  // .replace( /^(Image|Category):/i, ':$1:' ),  -- apparently no longer needed...
		block_timer: e.target.block_timer ? e.target.block_timer.value : null
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Warning complete, reloading talk page in a few seconds";

	var wikipedia_page = new Morebits.wiki.page( mw.config.get('wgPageName'), 'User talk page modification' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.warn.callbacks.main );
};
