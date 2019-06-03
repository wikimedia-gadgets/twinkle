// <nowiki>


(function($){


/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              Any page with relevant user name (userspace, contribs,
 *                         etc.), as well as diffs and the rollback success page
 * Config directives in:   TwinkleConfig
 */

Twinkle.warn = function twinklewarn() {
	if(mw.config.get('wgRelevantUserName')) {
			Twinkle.addPortletLink(Twinkle.warn.callback, "Warn", "tw-warn", "Warn/notify user");
			if (Twinkle.getPref('autoMenuAfterRollback') && mw.config.get('wgNamespaceNumber') === 3 &&
				mw.util.getParamValue('vanarticle') && !mw.util.getParamValue('friendlywelcome') && !mw.util.getParamValue('noautowarn')) {
				Twinkle.warn.callback();
			}
	}

	// Modify URL of talk page on rollback success pages, makes use of a
	// custom message box in [[MediaWiki:Rollback-success]]
	if(mw.config.get('wgAction') === 'rollback') {
		var $vandalTalkLink = $("#mw-rollback-success").find(".mw-usertoollinks a").first();
		if ($vandalTalkLink.length) {
			$vandalTalkLink.css("font-weight", "bold");
			$vandalTalkLink.wrapInner($("<span/>").attr("title", "If appropriate, you can use Twinkle to warn the user about their edits to this page."));

			var extraParam = "vanarticle=" + mw.util.rawurlencode(Morebits.pageNameNorm);
			var href = $vandalTalkLink.attr("href");
			if (href.indexOf("?") === -1) {
				$vandalTalkLink.attr("href", href + "?" + extraParam);
			} else {
				$vandalTalkLink.attr("href", href + "&" + extraParam);
			}
		}
	} else if (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId')) {
		// Autofill user talk links on diffs with vanarticle for easy
		// warning, but don't autowarn
		var warnFromTalk = function(talkLink) {
			if (talkLink.length) {
				var extraParams = 'vanarticle=' + mw.util.rawurlencode(Morebits.pageNameNorm) + '&' + 'noautowarn=true';
				var href = talkLink.attr('href');
				if (href.indexOf('?') === -1) {
					talkLink.attr('href', href + '?' + extraParams);
				} else {
					talkLink.attr('href', href + '&' + extraParams);
				}
			}
		};

		warnFromTalk($('#mw-diff-otitle2 .mw-usertoollinks a').first());
		warnFromTalk($('#mw-diff-ntitle2 .mw-usertoollinks a').first());
	}
};

Twinkle.warn.callback = function twinklewarnCallback() {
	if(mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
			!confirm('You are about to warn yourself! Are you sure you want to proceed?')) {
		return;
	}

	var Window = new Morebits.simpleWindow(600, 440);
	Window.setTitle("Warn/notify user");
	Window.setScriptName("Twinkle");
	Window.addFooterLink("Choosing a warning level", "WP:UWUL#Levels");
	Window.addFooterLink("Twinkle help", "WP:TW/DOC#warn");

	var form = new Morebits.quickForm(Twinkle.warn.callback.evaluate);
	var main_select = form.append({
			type: 'field',
			label: 'Choose type of warning/notice to issue',
			tooltip: 'First choose a main warning group, then the specific warning to issue.'
		});

	var main_group = main_select.append({
			type: 'select',
			name: 'main_group',
			event: Twinkle.warn.callback.change_category
		});

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append({ type: 'option', label: '1: General note', value: 'level1', selected: (defaultGroup === 1) });
	main_group.append({ type: 'option', label: '2: Caution', value: 'level2', selected: (defaultGroup === 2) });
	main_group.append({ type: 'option', label: '3: Warning', value: 'level3', selected: (defaultGroup === 3) });
	main_group.append({ type: 'option', label: '4: Final warning', value: 'level4', selected: (defaultGroup === 4) });
	main_group.append({ type: 'option', label: '4im: Only warning', value: 'level4im', selected: (defaultGroup === 5) });
	main_group.append({ type: 'option', label: 'Single-issue notices', value: 'singlenotice', selected: (defaultGroup === 6) });
	main_group.append({ type: 'option', label: 'Single-issue warnings', value: 'singlewarn', selected: (defaultGroup === 7) });
	if(Twinkle.getPref('customWarningList').length) {
		main_group.append({ type: 'option', label: 'Custom warnings', value: 'custom', selected: (defaultGroup === 9) });
	}

	main_select.append({ type: 'select', name: 'sub_group', event:Twinkle.warn.callback.change_subcategory }); // Will be empty to begin with.

	form.append({
			type: 'input',
			name: 'article',
			label: 'Linked page',
			value:(Morebits.queryString.exists('vanarticle') ? Morebits.queryString.get('vanarticle') : ''),
			tooltip: 'A page can be linked within the notice, perhaps because it was a revert to said page that dispatched this notice. Leave empty for no page to be linked.'
		});

	var more = form.append({ type: 'field', name: 'reasonGroup', label: 'Warning information' });
	more.append({ type: 'textarea', label: 'Optional message:', name: 'reason', tooltip: 'Perhaps a reason, or that a more detailed notice must be appended' });

	var previewlink = document.createElement('a');
	$(previewlink).click(function(){
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'Preview';
	more.append({ type: 'div', id: 'warningpreview', label: [ previewlink ] });
	more.append({ type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' });

	more.append({ type: 'submit', label: 'Submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// We must init the first choice (General Note);
	var evt = document.createEvent("Event");
	evt.initEvent('change', true, true);
	result.main_group.dispatchEvent(evt);
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	levels: {
		"Common warnings": {
			"uw-vandalism": {
				level1: {
					label: "Vandalism",
					summary: "General note: Unconstructive editing"
				},
				level2: {
					label: "Vandalism",
					summary: "Caution: Unconstructive editing"
				},
				level3: {
					label: "Vandalism",
					summary: "Warning: Vandalism"
				},
				level4: {
					label: "Vandalism",
					summary: "Final warning: Vandalism"
				},
				level4im: {
					label: "Vandalism",
					summary: "Only warning: Vandalism"
				}
			},
			"uw-disruptive": {
				level1: {
					label: "Disruptive editing",
					summary: "General note: Unconstructive editing"
				},
				level2: {
					label: "Disruptive editing",
					summary: "Caution: Unconstructive editing"
				},
				level3: {
					label: "Disruptive editing",
					summary: "Warning: Disruptive editing"
				}
			},
			"uw-test": {
				level1: {
					label: "Editing tests",
					summary: "General note: Editing tests"
				},
				level2: {
					label: "Editing tests",
					summary: "Caution: Editing tests"
				},
				level3: {
					label: "Editing tests",
					summary: "Warning: Editing tests"
				}
			},
			"uw-delete": {
				level1: {
					label: "Removal of content, blanking",
					summary: "General note: Removal of content, blanking"
				},
				level2: {
					label: "Removal of content, blanking",
					summary: "Caution: Removal of content, blanking"
				},
				level3: {
					label: "Removal of content, blanking",
					summary: "Warning: Removal of content, blanking"
				},
				level4: {
					label: "Removal of content, blanking",
					summary: "Final warning: Removal of content, blanking"
				},
				level4im: {
					label: "Removal of content, blanking",
					summary: "Only warning: Removal of content, blanking"
				}
			},
			"uw-generic": {
				level4: {
					label: "Generic warning (for template series missing level 4)",
					summary: "Final warning notice"
				}
			},
		},
		"Behavior in articles": {
			"uw-biog": {
				level1: {
					label: "Adding unreferenced controversial information about living persons",
					summary: "General note: Adding unreferenced controversial information about living persons"
				},
				level2: {
					label: "Adding unreferenced controversial information about living persons",
					summary: "Caution: Adding unreferenced controversial information about living persons"
				},
				level3: {
					label: "Adding unreferenced controversial/defamatory information about living persons",
					summary: "Warning: Adding unreferenced controversial information about living persons"
				},
				level4: {
					label: "Adding unreferenced defamatory information about living persons",
					summary: "Final warning: Adding unreferenced controversial information about living persons"
				},
				level4im: {
					label: "Adding unreferenced defamatory information about living persons",
					summary: "Only warning: Adding unreferenced controversial information about living persons"
				}
			},
			"uw-defamatory": {
				level1: {
					label: "Addition of defamatory content",
					summary: "General note: Addition of defamatory content"
				},
				level2: {
					label: "Addition of defamatory content",
					summary: "Caution: Addition of defamatory content"
				},
				level3: {
					label: "Addition of defamatory content",
					summary: "Warning: Addition of defamatory content"
				},
				level4: {
					label: "Addition of defamatory content",
					summary: "Final warning: Addition of defamatory content"
				},
				level4im: {
					label: "Addition of defamatory content",
					summary: "Only warning: Addition of defamatory content"
				}
			},
			"uw-error": {
				level1: {
					label: "Introducing deliberate factual errors",
					summary: "General note: Introducing factual errors"
				},
				level2: {
					label: "Introducing deliberate factual errors",
					summary: "Caution: Introducing factual errors"
				},
				level3: {
					label: "Introducing deliberate factual errors",
					summary: "Warning: Introducing deliberate factual errors"
				},
				level4: {
					label: "Introducing deliberate factual errors",
					summary: "Final warning: Introducing deliberate factual errors"
				}
			},
			"uw-genre": {
				level1: {
					label: "Frequent or mass changes to genres without consensus or references",
					summary: "General note: Frequent or mass changes to genres without consensus or references"
				},
				level2: {
					label: "Frequent or mass changes to genres without consensus or references",
					summary: "Caution: Frequent or mass changes to genres without consensus or references"
				},
				level3: {
					label: "Frequent or mass changes to genres without consensus or reference",
					summary: "Warning: Frequent or mass changes to genres without consensus or reference"
				},
				level4: {
					label: "Frequent or mass changes to genres without consensus or reference",
					summary: "Final warning: Frequent or mass changes to genres without consensus or reference"
				}
			},
			"uw-image": {
				level1: {
					label: "Image-related vandalism in articles",
					summary: "General note: Image-related vandalism in articles"
				},
				level2: {
					label: "Image-related vandalism in articles",
					summary: "Caution: Image-related vandalism in articles"
				},
				level3: {
					label: "Image-related vandalism in articles",
					summary: "Warning: Image-related vandalism in articles"
				},
				level4: {
					label: "Image-related vandalism in articles",
					summary: "Final warning: Image-related vandalism in articles"
				},
				level4im: {
					label: "Image-related vandalism",
					summary: "Only warning: Image-related vandalism"
				}
			},
			"uw-joke": {
				level1: {
					label: "Using improper humor in articles",
					summary: "General note: Using improper humor in articles"
				},
				level2: {
					label: "Using improper humor in articles",
					summary: "Caution: Using improper humor in articles"
				},
				level3: {
					label: "Using improper humor in articles",
					summary: "Warning: Using improper humor in articles"
				},
				level4: {
					label: "Using improper humor in articles",
					summary: "Final warning: Using improper humor in articles"
				},
				level4im: {
					label: "Using improper humor",
					summary: "Only warning: Using improper humor"
				}
			},
			"uw-nor": {
				level1: {
					label: "Adding original research, including unpublished syntheses of sources",
					summary: "General note: Adding original research, including unpublished syntheses of sources"
				},
				level2: {
					label: "Adding original research, including unpublished syntheses of sources",
					summary: "Caution: Adding original research, including unpublished syntheses of sources"
				},
				level3: {
					label: "Adding original research, including unpublished syntheses of sources",
					summary: "Warning: Adding original research, including unpublished syntheses of sources"
				},
				level4: {
					label: "Adding original research, including unpublished syntheses of sources",
					summary: "Final warning: Adding original research, including unpublished syntheses of sources"
				}
			},
			"uw-notcensored": {
				level1: {
					label: "Censorship of material",
					summary: "General note: Censorship of material"
				},
				level2: {
					label: "Censorship of material",
					summary: "Caution: Censorship of material"
				},
				level3: {
					label: "Censorship of material",
					summary: "Warning: Censorship of material"
				}
			},
			"uw-own": {
				level1: {
					label: "Ownership of articles",
					summary: "General note: Ownership of articles"
				},
				level2: {
					label: "Ownership of articles",
					summary: "Caution: Ownership of articles"
				},
				level3: {
					label: "Ownership of articles",
					summary: "Warning: Ownership of articles"
				},
				level4im: {
					label: "Ownership of articles",
					summary: "Only warning: Ownership of articles"
				}
			},
			"uw-tdel": {
				level1: {
					label: "Removal of maintenance templates",
					summary: "General note: Removal of maintenance templates"
				},
				level2: {
					label: "Removal of maintenance templates",
					summary: "Caution: Removal of maintenance templates"
				},
				level3: {
					label: "Removal of maintenance templates",
					summary: "Warning: Removal of maintenance templates"
				},
				level4: {
					label: "Removal of maintenance templates",
					summary: "Final warning: Removal of maintenance templates"
				}
			},
			"uw-unsourced": {
				level1: {
					label: "Addition of unsourced or improperly cited material",
					summary: "General note: Addition of unsourced or improperly cited material"
				},
				level2: {
					label: "Addition of unsourced or improperly cited material",
					summary: "Caution: Addition of unsourced or improperly cited material"
				},
				level3: {
					label: "Addition of unsourced or improperly cited material",
					summary: "Warning: Addition of unsourced or improperly cited material"
				},
				level4: {
					label: "Addition of unsourced or improperly cited material",
					summary: "Final warning: Addition of unsourced or improperly cited material"
				}
			},
		},
		"Promotions and spam": {
			"uw-advert": {
				level1: {
					label: "Using Wikipedia for advertising or promotion",
					summary: "General note: Using Wikipedia for advertising or promotion"
				},
				level2: {
					label: "Using Wikipedia for advertising or promotion",
					summary: "Caution: Using Wikipedia for advertising or promotion"
				},
				level3: {
					label: "Using Wikipedia for advertising or promotion",
					summary: "Warning: Using Wikipedia for advertising or promotion"
				},
				level4: {
					label: "Using Wikipedia for advertising or promotion",
					summary: "Final warning: Using Wikipedia for advertising or promotion"
				},
				level4im: {
					label: "Using Wikipedia for advertising or promotion",
					summary: "Only warning: Using Wikipedia for advertising or promotion"
				}
			},
			"uw-npov": {
				level1: {
					label: "Not adhering to neutral point of view",
					summary: "General note: Not adhering to neutral point of view"
				},
				level2: {
					label: "Not adhering to neutral point of view",
					summary: "Caution: Not adhering to neutral point of view"
				},
				level3: {
					label: "Not adhering to neutral point of view",
					summary: "Warning: Not adhering to neutral point of view"
				},
				level4: {
					label: "Not adhering to neutral point of view",
					summary: "Final warning: Not adhering to neutral point of view"
				}
			},
			"uw-paid": {
				level1: {
					label: "Paid editing without disclosure under the Wikimedia Terms of Use",
					summary: "General note: Paid editing without disclosure under the Wikimedia Terms of Use"
				},
				level2: {
					label: "Paid editing without disclosure under the Wikimedia Terms of Use",
					summary: "Caution: Paid editing without disclosure under the Wikimedia Terms of Use"
				},
				level3: {
					label: "Paid editing without disclosure under the Wikimedia Terms of Use",
					summary: "Warning: Paid editing without disclosure under the Wikimedia Terms of Use"
				},
				level4: {
					label: "Paid editing without disclosure under the Wikimedia Terms of Use",
					summary: "Final warning: Paid editing without disclosure under the Wikimedia Terms of Use"
				}
			},
			"uw-spam": {
				level1: {
					label: "Adding inappropriate external links",
					summary: "General note: Adding inappropriate external links"
				},
				level2: {
					label: "Adding spam links",
					summary: "Caution: Adding spam links"
				},
				level3: {
					label: "Adding spam links",
					summary: "Warning: Adding spam links"
				},
				level4: {
					label: "Adding spam links",
					summary: "Final warning: Adding spam links"
				},
				level4im: {
					label: "Adding spam links",
					summary: "Only warning: Adding spam links"
				}
			},
		},
		"Behavior towards other editors": {
			"uw-agf": {
				level1: {
					label: "Not assuming good faith",
					summary: "General note: Not assuming good faith"
				},
				level2: {
					label: "Not assuming good faith",
					summary: "Caution: Not assuming good faith"
				},
				level3: {
					label: "Not assuming good faith",
					summary: "Warning: Not assuming good faith"
				}
			},
			"uw-harass": {
				level1: {
					label: "Harassment of other users",
					summary: "General note: Harassment of other users"
				},
				level2: {
					label: "Harassment of other users",
					summary: "Caution: Harassment of other users"
				},
				level3: {
					label: "Harassment of other users",
					summary: "Warning: Harassment of other users"
				},
				level4: {
					label: "Harassment of other users",
					summary: "Final warning: Harassment of other users"
				},
				level4im: {
					label: "Harassment of other users",
					summary: "Only warning: Harassment of other users"
				}
			},
			"uw-npa": {
				level1: {
					label: "Personal attack directed at a specific editor",
					summary: "General note: Personal attack directed at a specific editor"
				},
				level2: {
					label: "Personal attack directed at a specific editor",
					summary: "Caution: Personal attack directed at a specific editor"
				},
				level3: {
					label: "Personal attack directed at a specific editor",
					summary: "Warning: Personal attack directed at a specific editor"
				},
				level4: {
					label: "Personal attack directed at a specific editor",
					summary: "Final warning: Personal attack directed at a specific editor"
				},
				level4im: {
					label: "Personal attack directed at a specific editor",
					summary: "Only warning: Personal attack directed at a specific editor"
				}
			},
			"uw-tempabuse": {
				level1: {
					label: "Improper use of warning or blocking template",
					summary: "General note: Improper use of warning or blocking template"
				},
				level2: {
					label: "Improper use of warning or blocking template",
					summary: "Caution: Improper use of warning or blocking template"
				}
			},
		},
		"Removal of deletion tags": {
			"uw-afd": {
				level1: {
					label: "Removing {{afd}} templates",
					summary: "General note: Removing {{afd}} templates"
				},
				level2: {
					label: "Removing {{afd}} templates",
					summary: "Caution: Removing {{afd}} templates"
				},
				level3: {
					label: "Removing {{afd}} templates",
					summary: "Warning: Removing {{afd}} templates"
				},
				level4: {
					label: "Removing {{afd}} templates",
					summary: "Final warning: Removing {{afd}} templates"
				}
			},
			"uw-blpprod": {
				level1: {
					label: "Removing {{blp prod}} templates",
					summary: "General note: Removing {{blp prod}} templates"
				},
				level2: {
					label: "Removing {{blp prod}} templates",
					summary: "Caution: Removing {{blp prod}} templates"
				},
				level3: {
					label: "Removing {{blp prod}} templates",
					summary: "Warning: Removing {{blp prod}} templates"
				},
				level4: {
					label: "Removing {{blp prod}} templates",
					summary: "Final warning: Removing {{blp prod}} templates"
				}
			},
			"uw-idt": {
				level1: {
					label: "Removing file deletion tags",
					summary: "General note: Removing file deletion tags"
				},
				level2: {
					label: "Removing file deletion tags",
					summary: "Caution: Removing file deletion tags"
				},
				level3: {
					label: "Removing file deletion tags",
					summary: "Warning: Removing file deletion tags"
				},
				level4: {
					label: "Removing file deletion tags",
					summary: "Final warning: Removing file deletion tags"
				}
			},
			"uw-speedy": {
				level1: {
					label: "Removing speedy deletion tags",
					summary: "General note: Removing speedy deletion tags"
				},
				level2: {
					label: "Removing speedy deletion tags",
					summary: "Caution: Removing speedy deletion tags"
				},
				level3: {
					label: "Removing speedy deletion tags",
					summary: "Warning: Removing speedy deletion tags"
				},
				level4: {
					label: "Removing speedy deletion tags",
					summary: "Final warning: Removing speedy deletion tags"
				}
			},
		},
		"Other": {
			"uw-attempt": {
				level1: {
					label: "Triggering the edit filter",
					summary: "General note: Triggering the edit filter"
				},
				level2: {
					label: "Triggering the edit filter",
					summary: "Caution: Triggering the edit filter"
				},
				level3: {
					label: "Triggering the edit filter",
					summary: "Warning: Triggering the edit filter"
				},
				level4: {
					label: "Triggering the edit filter",
					summary: "Final warning: Triggering the edit filter"
				}
			},
			"uw-chat": {
				level1: {
					label: "Using talk page as forum",
					summary: "General note: Using talk page as forum"
				},
				level2: {
					label: "Using talk page as forum",
					summary: "Caution: Using talk page as forum"
				},
				level3: {
					label: "Using talk page as forum",
					summary: "Warning: Using talk page as forum"
				},
				level4: {
					label: "Using talk page as forum",
					summary: "Final warning: Using talk page as forum"
				}
			},
			"uw-create": {
				level1: {
					label: "Creating inappropriate pages",
					summary: "General note: Creating inappropriate pages"
				},
				level2: {
					label: "Creating inappropriate pages",
					summary: "Caution: Creating inappropriate pages"
				},
				level3: {
					label: "Creating inappropriate pages",
					summary: "Warning: Creating inappropriate pages"
				},
				level4: {
					label: "Creating inappropriate pages",
					summary: "Final warning: Creating inappropriate pages"
				},
				level4im: {
					label: "Creating inappropriate pages",
					summary: "Only warning: Creating inappropriate pages"
				}
			},
			"uw-mos": {
				level1: {
					label: "Manual of style",
					summary: "General note: Formatting, date, language, etc (Manual of style)"
				},
				level2: {
					label: "Manual of style",
					summary: "Caution: Formatting, date, language, etc (Manual of style)"
				},
				level3: {
					label: "Manual of style",
					summary: "Warning: Formatting, date, language, etc (Manual of style)"
				},
				level4: {
					label: "Manual of style",
					summary: "Final warning: Formatting, date, language, etc (Manual of style)"
				}
			},
			"uw-move": {
				level1: {
					label: "Page moves against naming conventions or consensus",
					summary: "General note: Page moves against naming conventions or consensus"
				},
				level2: {
					label: "Page moves against naming conventions or consensus",
					summary: "Caution: Page moves against naming conventions or consensus"
				},
				level3: {
					label: "Page moves against naming conventions or consensus",
					summary: "Warning: Page moves against naming conventions or consensus"
				},
				level4: {
					label: "Page moves against naming conventions or consensus",
					summary: "Final warning: Page moves against naming conventions or consensus"
				},
				level4im: {
					label: "Page moves against naming conventions or consensus",
					summary: "Only warning: Page moves against naming conventions or consensus"
				}
			},
			"uw-tpv": {
				level1: {
					label: "Refactoring others' talk page comments",
					summary: "General note: Refactoring others' talk page comments"
				},
				level2: {
					label: "Refactoring others' talk page comments",
					summary: "Caution: Refactoring others' talk page comments"
				},
				level3: {
					label: "Refactoring others' talk page comments",
					summary: "Warning: Refactoring others' talk page comments"
				},
				level4: {
					label: "Refactoring others' talk page comments",
					summary: "Final warning: Refactoring others' talk page comments"
				}
			},
			"uw-upload": {
				level1: {
					label: "Uploading unencyclopedic images",
					summary: "General note: Uploading unencyclopedic images"
				},
				level2: {
					label: "Uploading unencyclopedic images",
					summary: "Caution: Uploading unencyclopedic images"
				},
				level3: {
					label: "Uploading unencyclopedic images",
					summary: "Warning: Uploading unencyclopedic images"
				},
				level4: {
					label: "Uploading unencyclopedic images",
					summary: "Final warning: Uploading unencyclopedic images"
				},
				level4im: {
					label: "Uploading unencyclopedic images",
					summary: "Only warning: Uploading unencyclopedic images"
				}
			}
		}
	},

	singlenotice: {
		"uw-aiv": {
			label: "Bad AIV report",
			summary: "Notice: Bad AIV report"
		},
		"uw-autobiography": {
			label: "Creating autobiographies",
			summary: "Notice: Creating autobiographies"
		},
		"uw-badcat": {
			label: "Adding incorrect categories",
			summary: "Notice: Adding incorrect categories"
		},
		"uw-badlistentry": {
			label: "Adding inappropriate entries to lists",
			summary: "Notice: Adding inappropriate entries to lists"
		},
		"uw-bite": {
			label: "\"Biting\" newcomers",
			summary: "Notice: \"Biting\" newcomers",
			suppressArticleInSummary: true  // non-standard (user name, not article), and not necessary
		},
		"uw-coi": {
			label: "Conflict of interest",
			summary: "Notice: Conflict of interest",
			heading: "Managing a conflict of interest"
		},
		"uw-controversial": {
			label: "Introducing controversial material",
			summary: "Notice: Introducing controversial material"
		},
		"uw-copying": {
			label: "Copying text to another page",
			summary: "Notice: Copying text to another page"
		},
		"uw-crystal": {
			label: "Adding speculative or unconfirmed information",
			summary: "Notice: Adding speculative or unconfirmed information"
		},
		"uw-c&pmove": {
			label: "Cut and paste moves",
			summary: "Notice: Cut and paste moves"
		},
		"uw-dab": {
			label: "Incorrect edit to a disambiguation page",
			summary: "Notice: Incorrect edit to a disambiguation page"
		},
		"uw-date": {
			label: "Unnecessarily changing date formats",
			summary: "Notice: Unnecessarily changing date formats"
		},
		"uw-deadlink": {
			label: "Removing proper sources containing dead links",
			summary: "Notice: Removing proper sources containing dead links"
		},
		"uw-draftfirst": {
			label: "User should draft in userspace without the risk of speedy deletion",
			summary: "Notice: Consider drafting your article in [[Help:Userspace draft|userspace]]"
		},
		"uw-editsummary": {
			label: "Not using edit summary",
			summary: "Notice: Not using edit summary"
		},
		"uw-english": {
			label: "Not communicating in English",
			summary: "Notice: Not communicating in English"
		},
		"uw-hasty": {
			label: "Hasty addition of speedy deletion tags",
			summary: "Notice: Allow creators time to improve their articles before tagging them for deletion"
		},
		"uw-inline-el": {
			label: "Adding external links to the body of an article",
			summary: "Notice: Keep external links to External links sections at the bottom of an article"
		},
		"uw-italicize": {
			label: "Italicize books, films, albums, magazines, TV series, etc within articles",
			summary: "Notice: Italicize books, films, albums, magazines, TV series, etc within articles"
		},
		"uw-lang": {
			label: "Unnecessarily changing between British and American English",
			summary: "Notice: Unnecessarily changing between British and American English",
			heading: "National varieties of English"
		},
		"uw-linking": {
			label: "Excessive addition of redlinks or repeated blue links",
			summary: "Notice: Excessive addition of redlinks or repeated blue links"
		},
		"uw-minor": {
			label: "Incorrect use of minor edits check box",
			summary: "Notice: Incorrect use of minor edits check box"
		},
		"uw-notenglish": {
			label: "Creating non-English articles",
			summary: "Notice: Creating non-English articles"
		},
		"uw-notvote": {
			label: "We use consensus, not voting",
			summary: "Notice: We use consensus, not voting"
		},
		"uw-plagiarism": {
			label: "Copying from public domain sources without attribution",
			summary: "Notice: Copying from public domain sources without attribution"
		},
		"uw-preview": {
			label: "Use preview button to avoid mistakes",
			summary: "Notice: Use preview button to avoid mistakes"
		},
		"uw-redlink": {
			label: "Indiscriminate removal of redlinks",
			summary: "Notice: Be careful when removing redlinks"
		},
		"uw-selfrevert": {
			label: "Reverting self tests",
			summary: "Notice: Reverting self tests"
		},
		"uw-socialnetwork": {
			label: "Wikipedia is not a social network",
			summary: "Notice: Wikipedia is not a social network"
		},
		"uw-sofixit": {
			label: "Be bold and fix things yourself",
			summary: "Notice: You can be bold and fix things yourself"
		},
		"uw-spoiler": {
			label: "Adding spoiler alerts or removing spoilers from appropriate sections",
			summary: "Notice: Don't delete or flag potential 'spoilers' in Wikipedia articles"
		},
		"uw-talkinarticle": {
			label: "Talk in article",
			summary: "Notice: Talk in article"
		},
		"uw-tilde": {
			label: "Not signing posts",
			summary: "Notice: Not signing posts"
		},
		"uw-toppost": {
			label: "Posting at the top of talk pages",
			summary: "Notice: Posting at the top of talk pages"
		},
		"uw-userspace draft finish": {
			label: "Stale userspace draft",
			summary: "Notice: Stale userspace draft"
		},
		"uw-vgscope": {
			label: "Adding video game walkthroughs, cheats or instructions",
			summary: "Notice: Adding video game walkthroughs, cheats or instructions"
		},
		"uw-warn": {
			label: "Place user warning templates when reverting vandalism",
			summary: "Notice: You can use user warning templates when reverting vandalism"
		}
	},

	singlewarn: {
		"uw-3rr": {
			label: "Potential three-revert rule violation; see also uw-ew",
			summary: "Warning: Three-revert rule"
		},
		"uw-affiliate": {
			label: "Affiliate marketing",
			summary: "Warning: Affiliate marketing"
		},
		"uw-agf-sock": {
			label: "Use of multiple accounts (assuming good faith)",
			summary: "Warning: Using multiple accounts"
		},
		"uw-attack": {
			label: "Creating attack pages",
			summary: "Warning: Creating attack pages",
			suppressArticleInSummary: true
		},
		"uw-bizlist": {
			label: "Business promotion",
			summary: "Warning: Promoting a business"
		},
		"uw-botun": {
			label: "Bot username",
			summary: "Warning: Bot username"
		},
		"uw-canvass": {
			label: "Canvassing",
			summary: "Warning: Canvassing"
		},
		"uw-copyright": {
			label: "Copyright violation",
			summary: "Warning: Copyright violation"
		},
		"uw-copyright-link": {
			label: "Linking to copyrighted works violation",
			summary: "Warning: Linking to copyrighted works violation"
		},
		"uw-copyright-new": {
			label: "Copyright violation (with explanation for new users)",
			summary: "Notice: Avoiding copyright problems",
			heading: "Wikipedia and copyright"
		},
		"uw-copyright-remove": {
			label: "Removing {{copyvio}} template from articles",
			summary: "Warning: Removing {{copyvio}} templates"
		},
		"uw-efsummary": {
			label: "Edit summary triggering the edit filter",
			summary: "Warning: Edit summary triggering the edit filter"
		},
		"uw-ew": {
			label: "Edit warring (stronger wording)",
			summary: "Warning: Edit warring"
		},
		"uw-ewsoft": {
			label: "Edit warring (softer wording for newcomers)",
			summary: "Warning: Edit warring"
		},
		"uw-hoax": {
			label: "Creating hoaxes",
			summary: "Warning: Creating hoaxes"
		},
		"uw-legal": {
			label: "Making legal threats",
			summary: "Warning: Making legal threats"
		},
		"uw-login": {
			label: "Editing while logged out",
			summary: "Warning: Editing while logged out"
		},
		"uw-multipleIPs": {
			label: "Usage of multiple IPs",
			summary: "Warning: Usage of multiple IPs"
		},
		"uw-pinfo": {
			label: "Personal info",
			summary: "Warning: Personal info"
		},
		"uw-salt": {
			label: "Recreating salted articles under a different title",
			summary: "Notice: Recreating creation-protected articles under a different title"
		},
		"uw-socksuspect": {
			label: "Sockpuppetry",
			summary: "Warning: You are a suspected [[WP:SOCK|sockpuppet]]"  // of User:...
		},
		"uw-upv": {
			label: "Userpage vandalism",
			summary: "Warning: Userpage vandalism"
		},
		"uw-username": {
			label: "Username is against policy",
			summary: "Warning: Your username might be against policy",
			suppressArticleInSummary: true  // not relevant for this template
		},
		"uw-coi-username": {
			label: "Username is against policy, and conflict of interest",
			summary: "Warning: Username and conflict of interest policy",
			heading: "Your username"
		},
		"uw-userpage": {
			label: "Userpage or subpage is against policy",
			summary: "Warning: Userpage or subpage is against policy"
		},
		"uw-wrongsummary": {
			label: "Using inaccurate or inappropriate edit summaries",
			summary: "Warning: Using inaccurate or inappropriate edit summaries"
		}
	}
};

Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	if (!Twinkle.getPref('oldSelect')) {
		$("select[name=sub_group]").chosen("destroy");
	}

	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if(old_subvalue) {
		old_subvalue = old_subvalue.replace(/\d*(im)?$/, '');
		old_subvalue_re = new RegExp(mw.RegExp.escape(old_subvalue) + "(\\d*(?:im)?)$");
	}

	while(sub_group.hasChildNodes()){
		sub_group.removeChild(sub_group.firstChild);
	}

	// worker function to create the combo box entries
	var createEntries = function(contents, container, wrapInOptgroup) {
		// level2->2, singlewarn->''; also used to distinguish the
		// scaled levels from singlenotice, singlewarn, and custom
		var level = value.replace(/^\D+/g,'');
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if (wrapInOptgroup && $.client.profile().platform === "iphone") {
			var wrapperOptgroup = new Morebits.quickForm.element({
				type: 'optgroup',
				label: 'Available templates'
			});
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild(wrapperOptgroup);
			container = wrapperOptgroup;
		}

		$.each(contents, function(itemKey, itemProperties) {
			// Skip if the current template doesn't have a version for the current level
			if (!!level && !itemProperties[value]) {
				return;
			}
			var key = (typeof itemKey === "string") ? itemKey : itemProperties.value;

			var selected = false;
			if(old_subvalue && old_subvalue_re.test(key)) {
				selected = true;
			}

			// Slice out leading uw- from the menu display
			var elem = new Morebits.quickForm.element({
				type: 'option',
				label: "{{" + key + level + "}}: " + (level ? itemProperties[value].label : itemProperties.label),
				value: key + level,
				selected: selected
			});
			var elemRendered = container.appendChild(elem.render());
			$(elemRendered).data("messageData", itemProperties);
		});
	};

	if(value === "singlenotice" || value === "singlewarn") {
		// no categories, just create the options right away
		createEntries(Twinkle.warn.messages[ value ], sub_group, true);
	} else if(value === "custom") {
		createEntries(Twinkle.getPref("customWarningList"), sub_group, true);
	} else {
		// create the option-groups
		$.each(Twinkle.warn.messages.levels, function(groupLabel, groupContents) {
			// Creates subgroup regardless of whether there is anything to place in it;
			// leaves "Removal of deletion tags" empty for 4im
			var optgroup = new Morebits.quickForm.element({
				type: 'optgroup',
				label: groupLabel
			});
			optgroup = optgroup.render();
			sub_group.appendChild(optgroup);
			// create the options
			createEntries(groupContents, optgroup, false);
		});
	}

	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);
	// hide the big red notice
	$("#tw-warn-red-notice").remove();
	// Trigger custom label/change on main category change
	Twinkle.warn.callback.change_subcategory(e);

	// Build select menu with jquery.chosen
	if (!Twinkle.getPref('oldSelect')) {
		$('select[name=sub_group]')
			.chosen({width: '100%', search_contains: true})
			.change(Twinkle.warn.callback.change_subcategory);

		mw.util.addCSS(
			// Force chosen select menu to display over the dialog while overflowing
			// based on https://github.com/harvesthq/chosen/issues/1390#issuecomment-21397245
			'.ui-dialog.morebits-dialog .morebits-dialog-content { overflow:visible !important;}' +
			'.ui-dialog.morebits-dialog { overflow: inherit !important; }' +

			// Increase height to match that of native select
			'.morebits-dialog .chosen-drop .chosen-results { max-height: 300px; }' +
			'.morebits-dialog .chosen-drop { height: 338px; }' +

			// Remove padding
			'.morebits-dialog .chosen-drop .chosen-results li { padding-top: 0px; padding-bottom: 0px; }'
		);
	}
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	// Tags that don't take a linked article, but something else (often a username).
	// The value of each tag is the label next to the input field
	var notLinkedArticle = {
		"uw-agf-sock": "Optional username of other account (without User:) ",
		"uw-bite": "Username of 'bitten' user (without User:) ",
		"uw-socksuspect": "Username of sock master, if known (without User:) ",
		"uw-username": "Username violates policy because... ",
		"uw-aiv": "Optional username that was reported (without User:) "
	};

	if(main_group === 'singlenotice' || main_group === 'singlewarn') {
		if(notLinkedArticle[value]) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';

			// change form labels according to the warning selected
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
			Morebits.quickForm.overrideElementLabel(e.target.form.article, notLinkedArticle[value]);
		} else if(e.target.form.article.notArticle) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
			Morebits.quickForm.resetElementLabel(e.target.form.article);
		}
	}

	// add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
	$("#tw-warn-red-notice").remove();

	var $redWarning;
	if (value === "uw-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{uw-username}} should only be used in edge cases in order to engage in discussion with the user.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	} else if (value === "uw-coi-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-coi-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{uw-coi-username}} should only be used in edge cases in order to engage in discussion with the user.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	}
};

Twinkle.warn.callbacks = {
	getWarningWikitext: function(templateName, article, reason, isCustom) {
		var text = "{{subst:" + templateName;

		if (article) {
			// add linked article for user warnings
			text += '|1=' + article;
		}
		if (reason && !isCustom) {
			// add extra message
			if (templateName === 'uw-csd' || templateName === 'uw-probation' ||
				templateName === 'uw-userspacenoindex' || templateName === 'uw-userpage') {
				text += "|3=''" + reason + "''";
			} else {
				text += "|2=''" + reason + "''";
			}
		}
		text += '}}';

		if (reason && isCustom) {
			// we assume that custom warnings lack a {{{2}}} parameter
			text += " ''" + reason + "''";
		}

		return text + ' ~~~~';
	},
	preview: function(form) {
		var templatename = form.sub_group.value;
		var linkedarticle = form.article.value;
		var templatetext;

		templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle,
			form.reason.value, form.main_group.value === 'custom');

		form.previewer.beginRender(templatetext, 'User_talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
	},
	main: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var messageData = params.messageData;

		var history_re = /<!-- Template:(uw-.*?) -->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4}) \(UTC\)/g;
		var history = {};
		var latest = { date: new Date(0), type: '' };
		var current;

		while((current = history_re.exec(text))) {
			var current_date = new Date(current[2] + ' UTC');
			if(!(current[1] in history) ||  history[ current[1] ] < current_date) {
				history[ current[1] ] = current_date;
			}
			if(current_date > latest.date) {
				latest.date = current_date;
				latest.type = current[1];
			}
		}

		var date = new Date();

		if(params.sub_group in history) {
			var temp_time = new Date(history[ params.sub_group ]);
			temp_time.setUTCHours(temp_time.getUTCHours() + 24);

			if(temp_time > date) {
				if(!confirm("An identical " + params.sub_group + " has been issued in the last 24 hours.  \nWould you still like to add this warning/notice?")) {
					pageobj.statelem.info('aborted per user request');
					return;
				}
			}
		}

		latest.date.setUTCMinutes(latest.date.getUTCMinutes() + 1); // after long debate, one minute is max

		if(latest.date > date) {
			if(!confirm("A " + latest.type + " has been issued in the last minute.  \nWould you still like to add this warning/notice?")) {
				pageobj.statelem.info('aborted per user request');
				return;
			}
		}

		var dateHeaderRegex = new RegExp("^==+\\s*(?:" + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +
			")\\s+" + date.getUTCFullYear() + "\\s*==+", 'mg');
		var dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec(text)) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf("\n==") + 1;

		if(text.length > 0) {
			text += "\n\n";
		}

		if(messageData.heading) {
			text += "== " + messageData.heading + " ==\n";
		} else if(!dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex) {
			Morebits.status.info('Info', 'Will create a new level 2 heading for the date, as none was found for this month');
			text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
		}
		text += Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article,
			params.reason, params.main_group === 'custom');

		if (Twinkle.getPref('showSharedIPNotice') && mw.util.isIPAddress(mw.config.get('wgTitle'))) {
			Morebits.status.info('Info', 'Adding a shared IP notice');
			text +=  "\n{{subst:Shared IP advice}}";
		}

		// build the edit summary
		var summary;
		if(params.main_group === 'custom') {
			switch(params.sub_group.substr(-1)) {
				case "1":
					summary = "General note";
					break;
				case "2":
					summary = "Caution";
					break;
				case "3":
					summary = "Warning";
					break;
				case "4":
					summary = "Final warning";
					break;
				case "m":
					if(params.sub_group.substr(-3) === "4im") {
						summary = "Only warning";
						break;
					}
					summary = "Notice";
					break;
				default:
					summary = "Notice";
					break;
			}
			summary += ": " + Morebits.string.toUpperCaseFirstChar(messageData.label);
		} else {
			summary = (/^\D+$/.test(params.main_group) ? messageData.summary : messageData[params.main_group].summary);
			if (messageData.suppressArticleInSummary !== true && params.article) {
				if (params.sub_group === "uw-agf-sock" ||
						params.sub_group === "uw-socksuspect" ||
						params.sub_group === "uw-aiv") {  // these templates require a username
					summary += " of [[:User:" + params.article + "]]";
				} else {
					summary += " on [[:" + params.article + "]]";
				}
			}
		}
		summary += "." + Twinkle.getPref("summaryAd");

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary);
		pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));
		pageobj.save();
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	// First, check to make sure a reason was filled in if uw-username was selected

	if(e.target.sub_group.value === 'uw-username' && e.target.article.value.trim() === '') {
		alert("You must supply a reason for the {{uw-username}} template.");
		return;
	}

	// Find the selected <option> element so we can fetch the data structure
	var selectedEl = $(e.target.sub_group).find('option[value="' + $(e.target.sub_group).val() + '"]');

	// Then, grab all the values provided by the form
	var params = {
		reason: e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value,  // .replace( /^(Image|Category):/i, ':$1:' ),  -- apparently no longer needed...
		messageData: selectedEl.data("messageData")
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = "Warning complete, reloading talk page in a few seconds";

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'User talk page modification');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.load(Twinkle.warn.callbacks.main);
};
})(jQuery);


// </nowiki>
