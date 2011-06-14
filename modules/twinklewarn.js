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
		if(twinkleUserAuthorized) {
			$(twAddPortletLink("#", "Warn", "tw-warn", "Warn/notify user", "")).click(Twinkle.warn.callback);
		} else {
			$(twAddPortletLink("#", "Warn", "tw-warn", "Warn/notify user", "")).click(function() {
				alert("Your account is too new to use Twinkle.");
			});
		}
	}
};

Twinkle.warn.callback = function twinklewarnCallback() {
	var Window = new SimpleWindow( 600, 440 );
	Window.setTitle( "Warn/notify user" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Choosing a warning level", "WP:UWUL#Levels" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#warn" );

	var form = new QuickForm( Twinkle.warn.callback.evaluate );
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
	main_group.append( { type:'option', label:'General Note (1)', value:'level1', selected: ( defaultGroup === 1 || defaultGroup < 1 || ( userIsInGroup( 'sysop' ) ? defaultGroup > 8 : defaultGroup > 7 ) ) } );
	main_group.append( { type:'option', label:'Caution (2)', value:'level2', selected: ( defaultGroup === 2 ) } );
	main_group.append( { type:'option', label:'Warning (3)', value:'level3', selected: ( defaultGroup === 3 ) } );
	main_group.append( { type:'option', label:'Final warning (4)', value:'level4', selected: ( defaultGroup === 4 ) } );
	main_group.append( { type:'option', label:'Only warning (4im)', value:'level4im', selected: ( defaultGroup === 5 ) } );
	main_group.append( { type:'option', label:'Single issue notices', value:'singlenotice', selected: ( defaultGroup === 6 ) } );
	main_group.append( { type:'option', label:'Single issue warnings', value:'singlewarn', selected: ( defaultGroup === 7 ) } );
	if( userIsInGroup( 'sysop' ) ) {
		main_group.append( { type:'option', label:'Blocking', value:'block', selected: ( defaultGroup === 8 ) } );
	}

	main_select.append( { type:'select', name:'sub_group', event:Twinkle.warn.callback.change_subcategory } ); //Will be empty to begin with.

	form.append( {
			type:'input',
			name:'article',
			label:'Linked article',
			value:( QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '' ),
			tooltip:'An article might be linked to the notice, either it was a revert to said article that dispatched this notice. Leave empty for no article to be linked'
		} );


	var more = form.append( { type:'field', label:'Fill in an optional reason and hit \"Submit\"' } );
	more.append( { type:'textarea', label:'More:', name:'reason', tooltip:'Perhaps a reason, or that a more detailed notice must be appended' } );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.warn.callbacks.preview();
	});
	previewlink.textContent = 'Preview';
	more.append( { type: 'div', name: 'warningpreview', label: [ previewlink ] } );

	more.append( { type:'submit', label:'Submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.main_group.root = result;

	// We must init the first choice (General Note);
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.main_group.dispatchEvent( evt );
};

// This is all the messages that might be dispatched by the code
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
			label:"Page blanking, removal of content",
			summary:"General note: Page blanking, removal of content"
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
			label:"Adding original research, including unpublished syntheses of sourced material", 
			summary:"General note: Adding original research, including unpublished syntheses of sourced material" 
		},
		"uw-biog1": { 
			label:"Adding unreferenced controversial information about living persons", 
			summary:"General note: Adding unreferenced controversial information about living persons" 
		},
		"uw-defam1": { 
			label:"Defamation not specifically directed", 
			summary:"General note: Defamation not specifically directed" 
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
			label:"Page blanking, removal of content", 
			summary:"Caution: Page blanking, removal of content" 
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
			label:"Defamation not specifically directed", 
			summary:"Caution: Defamation not specifically directed" 
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
			label:"Page blanking, removal of content", 
			summary:"Warning: Page blanking, removal of content" 
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
			label:"Defamation not specifically directed", 
			summary:"Warning: Defamation not specifically directed" 
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
			label:"Page blanking, removal of content", 
			summary:"Final warning: Page blanking, removal of content" 
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
			label:"Defamation not specifically directed", 
			summary:"Final warning: Defamation not specifically directed" 
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
			label:"Page blanking, removal of content", 
			summary:"Only warning: Page blanking, removal of content" 
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
			label:"Defamation not specifically directed", 
			summary:"Only warning: Defamation not specifically directed" 
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
			label:"Draft in userspace without the risk of speedy deletion", 
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
		"uw-hangon": { 
			label:"User forgets to place a hang-on reasoning to the talk page", 
			summary:"Notice: User forgets to place a hang-on reasoning to the talk page" 
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
			summary:"Warning: Creating attack pages"
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
		"uw-socksuspect": {
			label:"Sockpuppetry",
			summary:"Warning: Sockpuppetry"
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
			'label':"Block",
			'summary':"You have been blocked from editing"
		},
		"uw-blocknotalk": {
			'label':"Block (talk page disabled)",
			'summary':"You have been blocked from editing and your user talk page has been disabled"
		},
		"uw-blockindef": {
			'label':"Block (indefinite)",
			'summary':"You have been indefinitely blocked from editing"
		},
		"uw-ablock": {
			'label':"Anonymous block",
			'summary':"Your IP address has been blocked from editing"
		},
		"uw-aeblock": {
			'label':"Arbitration enforcement block",
			'summary':"You have been blocked from editing for violating an [[WP:Arbitration|arbitration decision]] with your edits"
		},
		"uw-adblock": {
			'label':"Advertising block",
			'summary':"You have been blocked from editing for [[WP:SOAP|advertising or self-promotion]]"
		},
		"uw-sblock": {
			'label':"Spam block",
			'summary':"You have been blocked from editing for continuing to add [[WP:SPAM|spam links]]"
		},
		"uw-soablock": {
			'label':"Spam/advertising-only account block",
			'summary':"You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam, advertising, or promotion]]"
		},
		"uw-vblock": {
			'label':"Vandalism block",
			'summary':"You have been blocked from editing for persistent [[WP:VAND|vandalism]]"
		},
		"uw-voablock": {
			'label':"Vandalism-only account block",
			'summary':"You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]]"
		},
		"uw-bioblock": {
			'label':"BLP violations",
			'summary':"You have been blocked from editing for violations of Wikipedia's [[WP:BLP|biographies of living persons policy]]"
		},
		"uw-npblock": {
			'label':"Creating nonsense pages block",
			'summary':"You have been blocked from editing for creating [[WP:PN|nonsense pages]]"
		},
		"uw-myblock": {
			'label':"Social networking block",
			'summary':"You have been blocked from editing for using user and/or article pages as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]"
		},
		"uw-copyrightblock": {
			'label':"Copyright violation block",
			'summary':"You have been blocked from editing for continued [[WP:COPYVIO|copyright infringement]]"
		},
		"uw-dblock": {
			'label':"Deletion/removal of content block",
			'summary':"You have been blocked from editing for continued [[WP:VAND|removal of material]]"
		},
		"uw-efblock": {
			'label':"Edit filter-related block",
			'summary':"You have been blocked from editing for making disruptive edits that repeatedly triggered the [[WP:EF|edit filter]]"
		},
		"uw-ewblock": {
			'label':"Edit warring block",
			'summary':"You have been blocked from editing to prevent further [[WP:DE|disruption]] caused by your engagement in an [[WP:EW|edit war]]"
		},
		"uw-3block": {
			'label':"Three-revert rule violation block",
			'summary':"You have been blocked from editing for your [[WP:DE|disruption]] caused by [[WP:EW|edit warring]] and violation of the [[WP:3RR|three-revert rule]]"
		},
		"uw-botblock": {
			'label':"Unapproved bot block",
			'summary':"You have been blocked from editing because it appears you are running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]"
		},
		"uw-ublock": {
			'label':"Username soft block",
			'summary':"You have been indefinitely blocked from editing because your username is a violation of the [[WP:U|username policy]]"
		},
		"uw-uhblock": {
			'label':"Username hard block",
			'summary':"You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]]"
		},
		"uw-softerblock": {
			'label':"Promotional username soft block",
			'summary':"You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website"
		},
		"uw-causeblock": {
			'label':"Promotional username soft block, for charitable causes and social service organizations",
			'summary':"You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website"
		},
		"uw-botublock": {
			'label':"Bot username soft block",
			'summary':"You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this is a [[WP:BOT|bot]] account, which is currently not approved"
		},
		"uw-memorialblock": {
			'label':"Memorial username soft block",
			'summary':"You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this account may be used as a memorial or tribute to someone"
		},
		"uw-ublock-famous": {
			'label':"Famous username soft block",
			'summary':"You have been indefinitely blocked from editing because your [[WP:U|username]] matches the name of a well-known living individual"
		},
		"uw-ublock-double": {
			'label':"Similar username soft block",
			'summary':"You have been indefinitely blocked from editing because your [[WP:U|username]] is too similar to the username of another Wikipedia user"
		},
		"uw-uhblock-double": {
			'label':"Username impersonation hard block",
			'summary':"You have been indefinitely blocked from editing because your [[WP:U|username]] appears to impersonate another Wikipedia user"
		},
		"uw-vaublock": {
			'label':"Vandalism-only account and username hard block",
			'summary':"You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]] and your username is a blatant violation of the [[WP:U|username policy]]"
		},
		"uw-spamublock": {
			'label':"Spam/advertising-only account and promotional username hard block",
			'summary':"You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam or advertising]] and your username is a violation of the [[WP:U|username policy]]"
		},
		"uw-compblock": {
			'label':"Possible compromised account block",
			'summary':"You have been indefinitely blocked from editing because it is believed that your [[WP:SECURE|account has been compromised]]"
		},
		"uw-lblock": {
			'label':"Legal threat block",
			'summary':"You have been blocked from editing for making [[WP:NLT|legal threats or taking legal action]]"
		},
		"uw-hblock": {
			'label':"Harassment block",
			'summary':"You have been blocked from editing for attempting to [[WP:HARASS|harass]] other users"
		},
		"uw-pinfoblock": {
			'label':"Personal information exposure block",
			'summary':"You have been blocked from editing for [[WP:OUTING|posting personal information]] of another editor"
		},
		"uw-deoablock": {
			'label':"Disruption/trolling only account block",
			'summary':"You have been indefinitely blocked from editing because your account is being used only for [[WP:DE|trolling, disruption or harassment]]"
		},
		"uw-block-onlyfor": {
			'label':"Bad-faith single purpose account",
			'summary':"You have been indefinitely blocked from editing because your account is a [[WP:SPA|single purpose account]] being [[WP:DE|used only for disruptive editing]]"
		},
		"uw-spoablock": {
			'label':"Sockpuppet account block",
			'summary':"You have been indefinitely blocked from editing because your account is being used only for [[WP:SOCK|sock puppetry or meat puppetry]]"
		},
		"schoolblock": {
			'label':"School IP block",
			'summary':"Anonymous users from this [[IP]] have been blocked from editing because of [[WP:VANDALISM|persistant vandalism]].  To edit, please make yourself an [[Wikipedia:Account|account]]"
		}
	}
};

// Set to true if the template is always for an indef block
Twinkle.warn.indefBlockHash = {
	'uw-block': false,
	'uw-3block': false,
	'uw-ablock': false,
	'uw-adblock': false,
	'uw-aeblock': false,
	'uw-bioblock': false,
	'uw-blocknotalk': false,
	'uw-botblock': false,
	'uw-copyrightblock': false,
	'uw-dblock': false,
	'uw-efblock': false,
	'uw-ewblock': false,
	'uw-hblock': false,
	'uw-myblock': false,
	'uw-npblock': false,
	'uw-pinfoblock': false,
	'uw-sblock': false,
	'uw-pblock': false,
	'uw-blockindef': true,
	'uw-block-onlyfor': true,
	'uw-botublock': true,
	'uw-causeblock': true,
	'uw-compblock': true,
	'uw-deoablock': true,
	'uw-lblock': true,
	'uw-memorialblock': true,
	'uw-soablock': true,
	'uw-softerblock': true,
	'uw-spamublock': true,
	'uw-spoablock': true,
	'uw-ublock': true,
	'uw-ublock-famous': true,
	'uw-uhblock': true,
	'uw-uhblock-double': true,
	'uw-ublock-double': true,
	'uw-vaublock': true,
	'uw-voablock': true,
	'schoolblock': false
};

// Set to true if the template supports the page parameter
Twinkle.warn.pageHash = {
	'uw-block': true,
	'uw-3block': true,
	'uw-ablock': true,
	'uw-adblock': true,
	'uw-aeblock': true,
	'uw-bioblock': true,
	'uw-blocknotalk': true,
	'uw-botblock': true,
	'uw-copyrightblock': true,
	'uw-dblock': true,
	'uw-efblock': true,
	'uw-ewblock': true,
	'uw-hblock': true,
	'uw-myblock': true,
	'uw-npblock': true,
	'uw-pinfoblock': true,
	'uw-sblock': true,
	'uw-vblock': true,
	'uw-blockindef': true,
	'uw-block-onlyfor': true,
	'uw-botublock': false,
	'uw-causeblock': false,
	'uw-compblock': true,
	'uw-deoablock': true,
	'uw-lblock': true,
	'uw-memorialblock': false,
	'uw-soablock': true,
	'uw-softerblock': false,
	'uw-spamublock': false,
	'uw-spoablock': true,
	'uw-ublock': false,
	'uw-ublock-famous': false,
	'uw-uhblock': false,
	'uw-uhblock-double': false,
	'uw-ublock-double': false,
	'uw-vaublock': true,
	'uw-voablock': true,
	'schoolblock': false
};

// Set to true if the template supports the reason parameter and isn't the same as its super-template when a reason is provided
Twinkle.warn.reasonHash = {
	'uw-block': true,
	'uw-3block': false,
	'uw-ablock': true,
	'uw-adblock': false,
	'uw-aeblock': true,
	'uw-bioblock': false,
	'uw-blocknotalk': true,
	'uw-botblock': false,
	'uw-copyrightblock': false,
	'uw-dblock': false,
	'uw-efblock': false,
	'uw-ewblock': false,
	'uw-hblock': false,
	'uw-myblock': false,
	'uw-npblock': false,
	'uw-pinfoblock': true,
	'uw-sblock': false,
	'uw-vblock': false,
	'uw-blockindef': true,
	'uw-block-onlyfor': true,
	'uw-botublock': true,
	'uw-causeblock': false,
	'uw-compblock': false,
	'uw-deoablock': false,
	'uw-lblock': false,
	'uw-memorialblock': false,
	'uw-soablock': false,
	'uw-softerblock': false,
	'uw-spamublock': false,
	'uw-spoablock': false,
	'uw-ublock': true,
	'uw-ublock-famous': false,
	'uw-uhblock': true,
	'uw-uhblock-double': false,
	'uw-ublock-double': false,
	'uw-vaublock': false,
	'uw-voablock': false,
	'schoolblock': false
};

Twinkle.warn.prev_block_timer = null;
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
		var elem = new QuickForm.element( { type:'option', label:"[" + i + "]: " + messages[i].label, value:i, selected: selected } );
		
		sub_group.appendChild( elem.render() );
	}

	if( value === 'block' ) {
		var more = new QuickForm.element( {
				type: 'input',
				name: 'block_timer',
				label: 'Period of blocking: ',
				tooltip: 'The period the blocking is due for, for example 24 hours, 2 weeks, indefinite etc...'
			} );
		e.target.root.insertBefore( more.render(), e.target.root.lastChild );
		if(Twinkle.warn.prev_block_timer !== null) {
			e.target.root.block_timer.value = Twinkle.warn.prev_block_timer;
			Twinkle.warn.prev_block_timer = null;
		}		
		if(Twinkle.warn.prev_article === null) {
			Twinkle.warn.prev_article = e.target.root.article.value;
		}
		e.target.root.article.disabled = true;
		e.target.root.article.value = '';
	} else if( e.target.root.block_timer ) {
		if(!e.target.root.block_timer.disabled && Twinkle.warn.prev_block_timer === null) {
			Twinkle.warn.prev_block_timer = e.target.root.block_timer.value;
		}
		e.target.root.removeChild( e.target.root.block_timer.parentNode );
		if(e.target.root.article.disabled && Twinkle.warn.prev_article !== null) {
			e.target.root.article.value = Twinkle.warn.prev_article;
			Twinkle.warn.prev_article = null;
		}
		e.target.root.article.disabled = false;
		if(e.target.root.reason.disabled && Twinkle.warn.prev_reason !== null) {
			e.target.root.reason.value = Twinkle.warn.prev_reason;
			Twinkle.warn.prev_reason = null;
		}
		e.target.root.reason.disabled = false;
	}
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.main_group;
	var value = e.target.value;

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
		if( Twinkle.warn.indefBlockHash[ value ] ) {
			if(Twinkle.warn.prev_block_timer === null) {
				Twinkle.warn.prev_block_timer = e.target.form.block_timer.value;
			}
			e.target.form.block_timer.disabled = true;
			e.target.form.block_timer.value = 'indef';
		} else if( e.target.form.block_timer.disabled ) {
			if(Twinkle.warn.prev_block_timer !== null) {
				e.target.form.block_timer.value = Twinkle.warn.prev_block_timer;
				Twinkle.warn.prev_block_timer = null;
			}
			e.target.form.block_timer.disabled = false;
		}

		if( Twinkle.warn.pageHash[ value ] ) {
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

		if( Twinkle.warn.reasonHash[ value ] ) {
			if(Twinkle.warn.prev_reason !== null) {
				e.target.form.reason.value = Twinkle.warn.prev_reason;
				Twinkle.warn.prev_reason = null;
			}
			e.target.form.reason.disabled = false;
		} else if( !e.target.form.reason.disabled ) {
			if(Twinkle.warn.prev_reason === null) {
				Twinkle.warn.prev_reason = e.target.form.reason.value;
			}
			e.target.form.reason.disabled = true;
			e.target.form.reason.value = '';
		}
	}
};

Twinkle.warn.callbacks = {
	preview: function() {
		// XXX cannot preview block templates as yet...
		var templatename = $('select[name="sub_group"]:visible').last()[0].value;
		if (templatename in Twinkle.warn.messages.block) {
			alert("Cannot preview block templates at the moment, unfortunately");
			return;
		}

		var previewdiv = $('div[name="warningpreview"]:visible').last();
		if (!previewdiv.length) {
			return;  // just give up
		}
		previewdiv = previewdiv[0];

		var previewbox = $('div#twinklewarn-previewbox:visible').last();
		if (!previewbox.length) {
			previewbox = document.createElement('div');
			previewbox.style.background = "white";
			previewbox.style.border = "2px inset";
			previewbox.style.marginTop = "0.4em";
			previewbox.style.padding = "0.2em 0.4em";
			previewbox.setAttribute('id', 'twinklewarn-previewbox');
			previewdiv.parentNode.appendChild(previewbox);
		} else {
			previewbox = previewbox[0];
		}

		var statusspan = document.createElement('span');
		previewbox.appendChild(statusspan);
		Status.init(statusspan);
		var templatetext = '{{subst:' + templatename;
		var linkedarticle = $('input[name="article"]:visible').last();
		if (linkedarticle.length) {
			templatetext += '|1=' + linkedarticle[0].value;
		}
		templatetext += '}}';
		var reason = $('textarea[name="reason"]:visible').last();
		if (reason.length && reason[0].value) {
			templatetext += " ''" + reason[0].value + "''";
		}
		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',  // PST = pre-save transform; this makes substitution work properly
			text: templatetext,
			title: mw.config.get('wgPageName')
		};
		var wikipedia_api = new Wikipedia.api("loading...", query, Twinkle.warn.callbacks.previewRender, new Status("Preview"));
		wikipedia_api.params = { previewbox: previewbox };
		wikipedia_api.post();
	},
	previewRender: function( apiobj ) {
		var params = apiobj.params;
		var xml = apiobj.getXML();
		var html = $(xml).find('text').text();
		if (!html) {
			apiobj.statelem.error("failed to retrieve preview, or warning template was blanked");
			return;
		}
		params.previewbox.innerHTML = html;
		// fix vertical alignment
		$(params.previewbox).find(':not(img)').css('vertical-align', 'baseline');
	},
	main: function( pageobj ) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

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
			
			if( Twinkle.getPref('blankTalkpageOnIndefBlock') && params.sub_group !== 'uw-lblock' && ( Twinkle.warn.indefBlockHash[ params.sub_group ] || (/indef|\*|max/).exec( params.block_timer ) ) ) {
				Status.info( 'Info', 'Blanking talk page per preferences and creating a new level 2 heading for the date' );
				text = "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			} else if( !headerRe.exec( text ) ) {
				Status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}
			
			if( params.article && Twinkle.warn.pageHash[ params.sub_group ] ) {
				article = '|page=' + params.article;
			}
			
			if( params.reason && Twinkle.warn.reasonHash[ params.sub_group ] ) {
				reason = '|reason=' + params.reason;
			}
			
			if( /te?mp|^\s*$|min/.exec( params.block_timer ) || Twinkle.warn.indefBlockHash[ params.sub_group ] ) {
				time = '';
			} else if( /indef|\*|max/.exec( params.block_timer ) ) {
				time = '|indef=yes';
			} else {
				time = '|time=' + params.block_timer;
			}

			text += "{{subst:" + params.sub_group + article + time + reason + "|sig=true|subst=subst:}}";
		} else {
			if( !headerRe.exec( text ) ) {
				Status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}

			if( params.sub_group === 'uw-username' ) {
				text += "{{subst:" + params.sub_group + ( params.reason ? '|1=' + params.reason : '' ) + "|subst=subst:}} ~~~~";
			} else {
				text += "{{subst:" + params.sub_group + ( params.article ? '|1=' + params.article : '' ) + "|subst=subst:}}" + (params.reason ? " ''" + params.reason + "'' ": ' ' ) + "~~~~";
			}
		}
		
		if ( Twinkle.getPref('showSharedIPNotice') && isIPAddress( mw.config.get('wgTitle') ) ) {
			Status.info( 'Info', 'Adding a shared ip notice' );
			if( QueryString.get( 'type' ) === 'vand' ) {
				text +=  "\n:''If this is a shared [[IP address]], and you didn't make any [[Wikipedia:vandalism|unconstructive]] edits, consider [[Wikipedia:Why create an account?|creating an account]] for yourself so you can avoid further irrelevant warnings.'' ";
			} else {
				text +=  "\n:''If this is a shared [[IP address]], and you didn't make the edit, consider [[Wikipedia:Why create an account?|creating an account]] for yourself so you can avoid further irrelevant notices.'' ";
			}
		}
		
		pageobj.setPageText( text );
		pageobj.setEditSummary( Twinkle.warn.messages[params.main_group][params.sub_group].summary + ( params.article ? ' on [[' + params.article + ']]'  : '' ) + '.' + Twinkle.getPref('summaryAd') );
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
		reason: e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value.replace( /^(Image|Category):/i, ':$1:' ),
		block_timer: e.target.block_timer ? e.target.block_timer.value : null
	};

	SimpleWindow.setButtonsEnabled( false );
	Status.init( e.target );

	Wikipedia.actionCompleted.redirect = mw.config.get('wgPageName');
	Wikipedia.actionCompleted.notice = "Warning complete, reloading talk page in a few seconds";

	var wikipedia_page = new Wikipedia.page( mw.config.get('wgPageName'), 'User talk page modification' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.warn.callbacks.main );
};
