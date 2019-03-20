//<nowiki>


(function($){


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles and drafts; file pages with a corresponding file
 *                         which is local (not on Commons); all redirects
 * Config directives in:   FriendlyConfig
 */

Twinkle.tag = function friendlytag() {
	// redirect tagging
	if( Morebits.wiki.isPageRedirect() ) {
		Twinkle.tag.mode = 'redirect';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Tag redirect" );
	}
	// file tagging
	else if( mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById("mw-sharedupload") && document.getElementById("mw-imagepage-section-filehistory") ) {
		Twinkle.tag.mode = 'file';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Add maintenance tags to file" );
	}
	// article/draft article tagging
	else if( ( [0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 ) && mw.config.get('wgCurRevisionId') ) {
		Twinkle.tag.mode = 'article';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Add maintenance tags to article" );
	}
};

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow( 630, (Twinkle.tag.mode === "article") ? 500 : 400 );
	Window.setScriptName( "Twinkle" );
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#tag" );

	var form = new Morebits.quickForm( Twinkle.tag.callback.evaluate );

	if (document.getElementsByClassName("patrollink").length) {
		form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Mark the page as patrolled',
					value: 'patrolPage',
					name: 'patrolPage',
					checked: Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled')
				}
			]
		} );
	}

	switch( Twinkle.tag.mode ) {
		case 'article':
			Window.setTitle( "Article maintenance tagging" );

			form.append({
				type: 'select',
				name: 'sortorder',
				label: 'View this list:',
				tooltip: 'You can change the default view order in your Twinkle preferences (WP:TWPREFS).',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'By categories', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'In alphabetical order', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'alpha' }
				]
			});

			form.append({
				type: 'div',
				id: 'tagWorkArea',
				className: 'morebits-scrollbox',
				style: 'max-height: 28em'
			});

			form.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Group inside {{multiple issues}} if possible',
							value: 'group',
							name: 'group',
							tooltip: 'If applying two or more templates supported by {{multiple issues}} and this box is checked, all supported templates will be grouped inside a {{multiple issues}} template.',
							checked: Twinkle.getFriendlyPref('groupByDefault')
						}
					]
				}
			);

			break;

		case 'file':
			Window.setTitle( "File maintenance tagging" );

			form.append({ type: 'header', label: 'License and sourcing problem tags' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.licenseList } );

			form.append({ type: 'header', label: 'Wikimedia Commons-related tags' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.commonsList } );

			form.append({ type: 'header', label: 'Cleanup tags' } );
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.cleanupList } );

			form.append({ type: 'header', label: 'Image quality tags' } );
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.qualityList } );

			form.append({ type: 'header', label: 'Replacement tags' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.replacementList } );

			if (Twinkle.getFriendlyPref('customFileTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.getFriendlyPref('customFileTagList') });
			}
			break;

		case 'redirect':
			Window.setTitle( "Redirect tagging" );

			form.append({ type: 'header', label:'Spelling, misspelling, tense and capitalization templates' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.spellingList });

			form.append({ type: 'header', label:'Alternative name templates' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.alternativeList });

			form.append({ type: 'header', label:'Miscellaneous and administrative redirect templates' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.administrativeList });

			if (Twinkle.getFriendlyPref('customRedirectTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.getFriendlyPref('customRedirectTagList') });
			}
			break;

		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	if (Twinkle.tag.mode === "article") {
		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent("Event");
		evt.initEvent("change", true, true);
		result.sortorder.dispatchEvent(evt);
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.updateSortOrder = function(e) {
	var sortorder = e.target.value;

	Twinkle.tag.checkedTags = e.target.form.getChecked("articleTags");
	if (!Twinkle.tag.checkedTags) {
		Twinkle.tag.checkedTags = [];
	}

	var container = new Morebits.quickForm.element({ type: "fragment" });

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function(tag, description) {
		var checkbox = { value: tag, label: "{{" + tag + "}}: " + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		switch (tag) {
			case "cleanup":
				checkbox.subgroup = {
					name: 'cleanup',
					type: 'input',
					label: 'Specific reason why cleanup is needed: ',
					tooltip: 'Required.',
					size: 35
				};
				break;
			case "close paraphrasing":
				checkbox.subgroup = {
					name: 'closeParaphrasing',
					type: 'input',
					label: 'Source: ',
					tooltip: 'Source that has been closely paraphrased'
				};
				break;
			case "copy edit":
				checkbox.subgroup = {
					name: 'copyEdit',
					type: 'input',
					label: '"This article may require copy editing for..." ',
					tooltip: 'e.g. "consistent spelling". Optional.',
					size: 35
				};
				break;
			case "copypaste":
				checkbox.subgroup = {
					name: 'copypaste',
					type: 'input',
					label: 'Source URL: ',
					tooltip: 'If known.',
					size: 50
				};
				break;
			case "expand language":
				checkbox.subgroup = [ {
						name: 'expandLanguageLangCode',
						type: 'input',
						label: 'Language code: ',
						tooltip: 'Language code of the language from which article is to be expanded from'
					}, {
						name: 'expandLanguageArticle',
						type: 'input',
						label: 'Name of article: ',
						tooltip: 'Name of article to be expanded from, without the interwiki prefix'
					},
				];
				break;
			case "expert needed":
				checkbox.subgroup = [
					{
					name: 'expertNeeded',
					type: 'input',
					label: 'Name of relevant WikiProject: ',
					tooltip: 'Optionally, enter the name of a WikiProject which might be able to help recruit an expert. Don\'t include the "WikiProject" prefix.'
				},
				{
					name: 'expertNeededReason',
					type: 'input',
					label: 'Reason: ',
					tooltip: 'Short explanation describing the issue. Either Reason or Talk link is required.'
				},
				{
					name: 'expertNeededTalk',
					type: 'input',
					label: 'Talk discussion: ',
					tooltip: 'Name of the section of this article\'s talk page where the issue is being discussed. Do not give a link, just the name of the section. Either Reason or Talk link is required.'
				}
				];
				break;
			case "globalize":
				checkbox.subgroup = {
					name: 'globalize',
					type: 'select',
					list: [
						{ label: "{{globalize}}: article may not represent a worldwide view of the subject", value: "globalize" },
						{
							label: "Region-specific {{globalize}} subtemplates",
							list: [
								{ label: "{{globalize/Australia}}: article deals primarily with the Australian viewpoint", value: "globalize/Australia" },
								{ label: "{{globalize/Canada}}: article deals primarily with the Canadian viewpoint", value: "globalize/Canada" },
								{ label: "{{globalize/China}}: article deals primarily with the Chinese viewpoint", value: "globalize/China" },
								{ label: "{{globalize/Common law}}: article deals primarily with the viewpoint of common law countries", value: "globalize/Common law" },
								{ label: "{{globalize/Eng}}: article deals primarily with the English-speaking viewpoint", value: "globalize/Eng" },
								{ label: "{{globalize/Europe}}: article deals primarily with the European viewpoint", value: "globalize/Europe" },
								{ label: "{{globalize/France}}: article deals primarily with the French viewpoint", value: "globalize/France" },
								{ label: "{{globalize/Germany}}: article deals primarily with the German viewpoint", value: "globalize/Germany" },
								{ label: "{{globalize/India}}: article deals primarily with the Indian viewpoint", value: "globalize/India" },
								{ label: "{{globalize/Middle East}}: article deals primarily with the Middle Eastern viewpoint", value: "globalize/Middle East" },
								{ label: "{{globalize/North America}}: article deals primarily with the North American viewpoint", value: "globalize/North America" },
								{ label: "{{globalize/Northern}}: article deals primarily with the northern hemisphere viewpoint", value: "globalize/Northern" },
								{ label: "{{globalize/Southern}}: article deals primarily with the southern hemisphere viewpoint", value: "globalize/Southern" },
								{ label: "{{globalize/South Africa}}: article deals primarily with the South African viewpoint", value: "globalize/South Africa" },
								{ label: "{{globalize/UK}}: article deals primarily with the British viewpoint", value: "globalize/UK" },
								{ label: "{{globalize/UK and Canada}}: article deals primarily with the British and Canadian viewpoints", value: "globalize/UK and Canada" },
								{ label: "{{globalize/US}}: article deals primarily with the USA viewpoint", value: "globalize/US" },
								{ label: "{{globalize/West}}: article deals primarily with the viewpoint of Western countries", value: "globalize/West" }
							]
						}
					]
				};
				break;
			case "merge":
			case "merge from":
			case "merge to":
				var otherTagName = "merge";
				switch (tag)
				{
					case "merge from":
						otherTagName = "merge to";
						break;
					case "merge to":
						otherTagName = "merge from";
						break;
				}
				checkbox.subgroup = [
					{
						name: 'mergeTarget',
						type: 'input',
						label: 'Other article(s): ',
						tooltip: 'If specifying multiple articles, separate them with pipe characters: Article one|Article two'
					},
					{
						name: 'mergeTagOther',
						type: 'checkbox',
						list: [
							{
								label: 'Tag the other article with a {{' + otherTagName + '}} tag',
								checked: true,
								tooltip: 'Only available if a single article name is entered.'
							}
						]
					}
				];
				if (mw.config.get('wgNamespaceNumber') === 0) {
					checkbox.subgroup.push({
						name: 'mergeReason',
						type: 'textarea',
						label: 'Rationale for merge (will be posted on ' +
							(tag === "merge to" ? 'the other article\'s' : 'this article\'s') + ' talk page):',
						tooltip: 'Optional, but strongly recommended. Leave blank if not wanted. Only available if a single article name is entered.'
					});
				}
				break;
			case "not English":
			case "rough translation":
				checkbox.subgroup = [
					{
						name: 'translationLanguage',
						type: 'input',
						label: 'Language of article (if known): ',
						tooltip: 'Consider looking at [[WP:LRC]] for help. If listing the article at PNT, please try to avoid leaving this box blank, unless you are completely unsure.'
					}
				];
				if (tag === "not English") {
					checkbox.subgroup.push({
						name: 'translationNotify',
						type: 'checkbox',
						list: [
							{
								label: 'Notify article creator',
								checked: true,
								tooltip: "Places {{uw-notenglish}} on the creator's talk page."
							}
						]
					});
				}
				checkbox.subgroup.push({
					name: 'translationPostAtPNT',
					type: 'checkbox',
					list: [
						{
							label: 'List this article at Wikipedia:Pages needing translation into English (PNT)',
							checked: true
						}
					]
				});
				checkbox.subgroup.push({
					name: 'translationComments',
					type: 'textarea',
					label: 'Additional comments to post at PNT',
					tooltip: 'Optional, and only relevant if "List this article ..." above is checked.'
				});
				break;
			case "notability":
				checkbox.subgroup = {
					name: 'notability',
					type: 'select',
					list: [
						{ label: "{{notability}}: article's subject may not meet the general notability guideline", value: "none" },
						{ label: "{{notability|Academics}}: notability guideline for academics", value: "Academics" },
						{ label: "{{notability|Biographies}}: notability guideline for biographies", value: "Biographies" },
						{ label: "{{notability|Books}}: notability guideline for books", value: "Books" },
						{ label: "{{notability|Companies}}: notability guidelines for companies and organizations", value: "Companies" },
						{ label: "{{notability|Events}}: notability guideline for events", value: "Events" },
						{ label: "{{notability|Films}}: notability guideline for films", value: "Films" },
						{ label: "{{notability|Places}}: notability guideline for places", value: "Places" },
						{ label: "{{notability|Music}}: notability guideline for music", value: "Music" },
						{ label: "{{notability|Neologisms}}: notability guideline for neologisms", value: "Neologisms" },
						{ label: "{{notability|Numbers}}: notability guideline for numbers", value: "Numbers" },
						{ label: "{{notability|Products}}: notability guideline for products and services", value: "Products" },
						{ label: "{{notability|Sport}}: notability guideline for sports and athletics", value: "Sport" },
						{ label: "{{notability|Television}}: notability guideline for television shows", value: "Television" },
						{ label: "{{notability|Web}}: notability guideline for web content", value: "Web" }
					]
				};
				break;
			default:
				break;
		}
		return checkbox;
	};

	// categorical sort order
	if (sortorder === "cat") {
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, array) {
			var checkboxes = [];
			$.each(array, function(k, tag) {
				var description = Twinkle.tag.article.tags[tag];
				checkboxes.push(makeCheckbox(tag, description));
			});
			subdiv.append({
				type: "checkbox",
				name: "articleTags",
				list: checkboxes
			});
		};

		var i = 0;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			container.append({ type: "header", id: "tagHeader" + i, label: title });
			var subdiv = container.append({ type: "div", id: "tagSubdiv" + i++ });
			if (Array.isArray(content)) {
				doCategoryCheckboxes(subdiv, content);
			} else {
				$.each(content, function(subtitle, subcontent) {
					subdiv.append({ type: "div", label: [ Morebits.htmlNode("b", subtitle) ] });
					doCategoryCheckboxes(subdiv, subcontent);
				});
			}
		});
	}
	// alphabetical sort order
	else {
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			checkboxes.push(makeCheckbox(tag, description));
		});
		container.append({
			type: "checkbox",
			name: "articleTags",
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getFriendlyPref('customTagList').length) {
		container.append({ type: 'header', label: 'Custom tags' });
		container.append({ type: 'checkbox', name: 'articleTags', list: Twinkle.getFriendlyPref('customTagList') });
	}

	var $workarea = $(e.target.form).find("div#tagWorkArea");
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// style adjustments
	$workarea.find("h5").css({ 'font-size': '110%' });
	$workarea.find("h5:not(:first-child)").css({ 'margin-top': '1em' });
	$workarea.find("div").filter(":has(span.quickformDescription)").css({ 'margin-top': '0.4em' });

	// add a link to each template's description page
	$.each(Morebits.quickForm.getElements(e.target.form, "articleTags"), function(index, checkbox) {
		var $checkbox = $(checkbox);
		var link = Morebits.htmlNode("a", ">");
		link.setAttribute("class", "tag-template-link");
		var linkto = Morebits.string.toUpperCaseFirstChar(checkbox.values);
		link.setAttribute("href", mw.util.getUrl(
			(linkto.indexOf(":") === -1 ? "Template:" : "") +
			(linkto.indexOf("|") === -1 ? linkto : linkto.slice(0,linkto.indexOf("|")))
		));
		link.setAttribute("target", "_blank");
		$checkbox.parent().append(["\u00A0", link]);
	});
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = {
	"advert": "article is written like an advertisement",
	"all plot": "article is almost entirely a plot summary",
	"autobiography": "article is an autobiography and may not be written neutrally",
	"BLP sources": "BLP article needs additional sources for verification",
	"BLP unsourced": "BLP article has no sources at all (use BLP PROD instead for new articles)",
	"citation style": "article has unclear or inconsistent inline citations",
	"cleanup": "article may require cleanup",
	"cleanup rewrite": "article may need to be rewritten entirely to comply with Wikipedia's quality standards",
	"cleanup-reorganize": "article may be in need of reorganization to comply with Wikipedia's layout guidelines",
	"close paraphrasing": "article contains close paraphrasing of a non-free copyrighted source",
	"COI": "article creator or major contributor may have a conflict of interest",
	"condense": "article may have too many section headers dividing up its content",
	"confusing": "article may be confusing or unclear",
	"context": "article provides insufficient context",
	"copy edit": "article needs copy editing for grammar, style, cohesion, tone, and/or spelling",
	"copypaste": "article appears to have been copied and pasted from a source",
	"current": "article documents a current event",
	"disputed": "article has questionable factual accuracy",
	"essay-like": "article is written like a personal reflection or opinion essay",
	"expand language": "article can be expanded with material from a foreign-language Wikipedia",
	"expert needed": "article needs attention from an expert on the subject",
	"external links": "article's external links may not follow content policies or guidelines",
	"fansite": "article resembles a fansite",
	"fiction": "article fails to distinguish between fact and fiction",
	"globalize": "article may not represent a worldwide view of the subject",
	"GOCEinuse": "article is currently undergoing a major copy edit by the Guild of Copy Editors",
	"hoax": "article may be a complete hoax",
	"improve categories": "article may require additional categories",
	"incomprehensible": "article is very hard to understand or incomprehensible",
	"in-universe": "article subject is fictional and needs rewriting from a non-fictional perspective",
	"in use": "article is undergoing a major edit for a short while",
	"lead missing": "article has no lead section and one should be written",
	"lead rewrite": "article lead section needs to be rewritten to comply with guidelines",
	"lead too long": "article lead section is too long and should be shortened",
	"lead too short": "article lead section is too short and should be expanded",
	"linkrot": "article uses bare URLs for references, which are prone to link rot",
	"manual": "article is written like a manual or guidebook",
	"merge": "article should be merged with another given article",
	"merge from": "another given article should be merged into this one",
	"merge to": "article should be merged into another given article",
	"more citations needed": "article needs additional references or sources for verification",
	"more footnotes": "article has some references, but insufficient in-text citations",
	"news release": "article reads like a news release",
	"no footnotes": "article has references, but no in-text citations",
	"non-free": "article may contain excessive or improper use of copyrighted materials",
	"notability": "article's subject may not meet the notability guideline",
	"not English": "article is written in a language other than English and needs translation",
	"one source": "article relies largely or entirely upon a single source",
	"original research": "article has original research or unverified claims",
	"orphan": "article is linked to from no other articles",
	"overcoverage": "article has an extensive bias or disproportional coverage towards one or more specific regions",
	"overlinked": "article may have too many duplicate and/or irrelevant links",
	"overly detailed": "article contains an excessive amount of intricate detail",
	"over-quotation": "article contains too many or too-lengthy quotations for an encyclopedic entry",
	"peacock": "article may contain peacock terms that promote the subject without adding information",
	"plot": "plot summary in article is too long",
	"POV": "article does not maintain a neutral point of view",
	"primary sources": "article relies too heavily on primary sources, and needs secondary sources",
	"prose": "article is in a list format that may be better presented using prose",
	"recentism": "article is slanted towards recent events",
	"rough translation": "article is poorly translated and needs cleanup",
	"sections": "article needs to be broken into sections",
	"self-published": "article may contain improper references to self-published sources",
	"technical": "article may be too technical for the uninitiated reader",
	"tense": "article is written in an incorrect tense",
	"third-party": "article relies too heavily on affiliated sources, and needs third-party sources",
	"tone": "tone of article is not appropriate",
	"too few opinions": "article may not include all significant viewpoints",
	"uncategorized": "article is uncategorized",
	"under construction": "article is currently in the middle of an expansion or major revamping",
	"underlinked": "article may require additional wikilinks",
	"undue": "article lends undue weight to certain aspects of the subject but not others",
	"unfocused": "article lacks focus or is about more than one topic",
	"unreferenced": "article has no references at all",
	"unreliable sources": "article's references may not be reliable sources",
	"undisclosed paid": "article may have been created or edited in return for undisclosed payments",
	"update": "article needs additional up-to-date information added",
	"very long": "article is too long",
	"weasel": "article neutrality is compromised by the use of weasel words"
};

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = {
	"Cleanup and maintenance tags": {
		"General cleanup": [
			"cleanup",  // has a subgroup with text input
			"cleanup rewrite",
			"copy edit"  // has a subgroup with text input
		],
		"Potentially unwanted content": [
			"close paraphrasing",
			"copypaste",  // has a subgroup with text input
			"external links",
			"non-free"
		],
		"Structure, formatting, and lead section": [
			"cleanup-reorganize",
			"condense",
			"lead missing",
			"lead rewrite",
			"lead too long",
			"lead too short",
			"sections",
			"very long"
		],
		"Fiction-related cleanup": [
			"all plot",
			"fiction",
			"in-universe",
			"plot"
		]
	},
	"General content issues": {
		"Importance and notability": [
			"notability"  // has a subgroup with subcategories
		],
		"Style of writing": [
			"advert",
			"essay-like",
			"fansite",
			"manual",
			"news release",
			"over-quotation",
			"prose",
			"technical",
			"tense",
			"tone"
		],
		"Sense (or lack thereof)": [
			"confusing",
			"incomprehensible",
			"unfocused"
		],
		"Information and detail": [
			"context",
			"expert needed",
			"overly detailed",
			"undue"
		],
		"Timeliness": [
			"current",
			"update"
		],
		"Neutrality, bias, and factual accuracy": [
			"autobiography",
			"COI",
			"disputed",
			"hoax",
			"globalize",  // has a subgroup with subcategories
			"overcoverage",
			"peacock",
			"POV",
			"recentism",
			"too few opinions",
			"undisclosed paid",
			"weasel"
		],
		"Verifiability and sources": [
			"BLP sources",
			"BLP unsourced",
			"more citations needed",
			"one source",
			"original research",
			"primary sources",
			"self-published",
			"third-party",
			"unreferenced",
			"unreliable sources"
		]
	},
	"Specific content issues": {
		"Language": [
			"not English",  // has a subgroup with several options
			"rough translation",  // has a subgroup with several options
			"expand language"
		],
		"Links": [
			"orphan",
			"overlinked",
			"underlinked"
		],
		"Referencing technique": [
			"citation style",
			"linkrot",
			"more footnotes",
			"no footnotes"
		],
		"Categories": [
			"improve categories",
			"uncategorized"
		]
	},
	"Merging": [  // these three have a subgroup with several options
		"merge",
		"merge from",
		"merge to"
	],
	"Informational": [
		"GOCEinuse",
		"in use",
		"under construction"
	]
};

// Tags for REDIRECTS start here

Twinkle.tag.spellingList = [
	{
		label: '{{R from acronym}}: redirect from an acronym (e.g. POTUS) to its expanded form',
		value: 'R from acronym'
	},
	{
		label: '{{R from alternative spelling}}: redirect from a title with a different spelling',
		value: 'R from alternative spelling'
	},
	{
		label: '{{R from initialism}}: redirect from an initialism (e.g. AGF) to its expanded form',
		value: 'R from initialism'
	},
	{
		label: '{{R from member}}: redirect from a member of a group to a related topic such as the group, organization, or team of membership',
		value: 'R from member'
	},
	{
		label: '{{R from misspelling}}: redirect from a misspelling or typographical error',
		value: 'R from misspelling'
	},
	{
		label: '{{R from other capitalisation}}: redirect from a title with another method of capitalisation',
		value: 'R from other capitalisation'
	},
	{
		label: '{{R from plural}}: redirect from a plural word to the singular equivalent',
		value: 'R from plural'
	},
	{
		label: '{{R from related word}}: redirect from a related word',
		value: 'R from related word'
	},
	{
		label: '{{R to list entry}}: redirect to a "list of minor entities"-type article which contains brief descriptions of subjects not notable enough to have separate articles',
		value: 'R to list entry'
	},
	{
		label: '{{R to section}}: similar to {{R to list entry}}, but when list is organized in sections, such as list of characters in a fictional universe.',
		value: 'R to section'
	},
	{
		label: '{{R with possibilities}}: redirect from a more specific title to a more general, less detailed article, hence something which can and should be expanded',
		value: 'R with possibilities'
	}
];

Twinkle.tag.alternativeList = [
	{
		label: '{{R from alternative language}}: redirect from an English name to a name in another language, or vice-versa',
		value: 'R from alternative language',
		subgroup : [
			{
				name: 'altLangFrom',
				type: 'input',
				label: 'From language (two-letter code): ',
				tooltip: 'Enter the two-letter code of the language the redirect name is in; such as en for English, de for German'
			},
			{
				name: 'altLangTo',
				type: 'input',
				label: 'To language (two-letter code): ',
				tooltip: 'Enter the two-letter code of the language the target name is in; such as en for English, de for German'
			},
			{
				name: 'altLangInfo',
				type: 'div',
				label: $.parseHTML('<p>For a list of language codes, see <a href="/wiki/Wp:Template_messages/Redirect_language_codes">Wikipedia:Template messages/Redirect language codes</a></p>')
			}
		]
	},
	{
		label: '{{R from alternative name}}: redirect from a title that is another name, a pseudonym, a nickname, or a synonym',
		value: 'R from alternative name'
	},
	{
		label: '{{R from ASCII}}: redirect from a title in basic ASCII to the formal article title, with differences that are not diacritical marks (accents, umlauts, etc.)',
		value: 'R from ASCII'
	},
	{
		label: '{{R from historic name}}: redirect from another name with a significant historic past as a region, state, city or such, but which is no longer known by that title or name',
		value: 'R from historic name'
	},
	{
		label: '{{R from incorrect name}}: redirect from an erroneus name that is unsuitable as a title',
		value: 'R from incorrect name'
	},
	{
		label: '{{R from long name}}: redirect from a title that is a complete or more complete name',
		value: 'R from long name'
	},
	{
		label: '{{R from name and country}}: redirect from the specific name to the briefer name',
		value: 'R from name and country'
	},
	{
		label: '{{R from phrase}}: redirect from a phrase to a more general relevant article covering the topic',
		value: 'R from phrase'
	},
	{
		label: '{{R from scientific name}}: redirect from the scientific name to the common name',
		value: 'R from scientific name'
	},
	{
		label: '{{R from surname}}: redirect from a title that is a surname',
		value: 'R from surname'
	},
	{
		label: '{{R to diacritics}}: redirect to the article title with diacritical marks (accents, umlauts, etc.)',
		value: 'R to diacritics'
	},
	{
		label: '{{R to scientific name}}: redirect from the common name to the scientific name',
		value: 'R to scientific name'
	}
];

Twinkle.tag.administrativeList = [
	{
		label: '{{R from CamelCase}}: redirect from a CamelCase title',
		value: 'R from CamelCase'
	},
	{
		label: '{{R from duplicated article}}: redirect to a similar article in order to preserve its edit history',
		value: 'R from duplicated article'
	},
	{
		label: '{{R from EXIF}}: redirect of a wikilink created from JPEG EXIF information (i.e. the "metadata" section on some image description pages)',
		value: 'R from EXIF'
	},
	{
		label: '{{R from merge}}: redirect from a merged page in order to preserve its edit history',
		value: 'R from merge'
	},
	{
		label: '{{R from school}}: redirect from a school article that had very little information',
		value: 'R from school'
	},
	{
		label: '{{R from shortcut}}: redirect from a Wikipedia shortcut',
		value: 'R from shortcut'
	},
	{
		label: '{{R to decade}}: redirect from a year to the decade article',
		value: 'R to decade'
	},
	{
		label: '{{R to disambiguation page}}: redirect to a disambiguation page',
		value: 'R to disambiguation page'
	}
];

// maintenance tags for FILES start here

Twinkle.tag.file = {};

Twinkle.tag.file.licenseList = [
	{ label: '{{Bsr}}: source info consists of bare image URL/generic base URL only', value: 'Bsr' },
	{ label: '{{Non-free reduce}}: non-low-resolution fair use image (or too-long audio clip, etc)', value: 'Non-free reduce' },
	{ label: '{{Orphaned non-free revisions}}: fair use media with old revisions that need to be deleted', value: 'subst:orfurrev' }
];

Twinkle.tag.file.commonsList = [
	{ label: '{{Copy to Commons}}: free media that should be copied to Commons', value: 'Copy to Commons' },
	{ label: '{{Do not move to Commons}} (PD issue): file is PD in the US but not in country of origin', value: 'Do not move to Commons' },
	{ label: '{{Do not move to Commons}} (other reason)', value: 'Do not move to Commons_reason' },
	{ label: '{{Keep local}}: request to keep local copy of a Commons file', value: 'Keep local' },
	{ label: '{{Now Commons}}: file has been copied to Commons', value: 'subst:ncd' }
];

Twinkle.tag.file.cleanupList = [
	{ label: '{{Artifacts}}: PNG contains residual compression artifacts', value: 'Artifacts' },
	{ label: '{{Bad font}}: SVG uses fonts not available on the thumbnail server', value: 'Bad font' },
	{ label: '{{Bad format}}: PDF/DOC/... file should be converted to a more useful format', value: 'Bad format' },
	{ label: '{{Bad GIF}}: GIF that should be PNG, JPEG, or SVG', value: 'Bad GIF' },
	{ label: '{{Bad JPEG}}: JPEG that should be PNG or SVG', value: 'Bad JPEG' },
	{ label: '{{Bad trace}}: auto-traced SVG requiring cleanup', value: 'Bad trace' },
	{ label: '{{Cleanup image}}: general cleanup', value: 'Cleanup image' },
	{ label: '{{Cleanup SVG}}: SVG needing code and/or appearance cleanup', value: 'Cleanup SVG' },
	{ label: '{{ClearType}}: image (not screenshot) with ClearType anti-aliasing', value: 'ClearType' },
	{ label: '{{Imagewatermark}}: image contains visible or invisible watermarking', value: 'Imagewatermark' },
	{ label: '{{NoCoins}}: image using coins to indicate scale', value: 'NoCoins' },
	{ label: '{{Overcompressed JPEG}}: JPEG with high levels of artifacts', value: 'Overcompressed JPEG' },
	{ label: '{{Opaque}}: opaque background should be transparent', value: 'Opaque' },
	{ label: '{{Remove border}}: unneeded border, white space, etc.', value: 'Remove border' },
	{ label: '{{Rename media}}: file should be renamed according to the criteria at [[WP:FMV]]', value: 'Rename media' },
	{ label: '{{Should be PNG}}: GIF or JPEG should be lossless', value: 'Should be PNG' },
	{
		label: '{{Should be SVG}}: PNG, GIF or JPEG should be vector graphics', value: 'Should be SVG',
		subgroup: {
			name: 'svgCategory',
			type: 'select',
			list: [
				{ label: '{{Should be SVG|other}}', value: 'other' },
				{ label: '{{Should be SVG|alphabet}}: character images, font examples, etc.', value: 'alphabet' },
				{ label: '{{Should be SVG|chemical}}: chemical diagrams, etc.', value: 'chemical' },
				{ label: '{{Should be SVG|circuit}}: electronic circuit diagrams, etc.', value: 'circuit' },
				{ label: '{{Should be SVG|coat of arms}}: coats of arms', value: 'coat of arms' },
				{ label: '{{Should be SVG|diagram}}: diagrams that do not fit any other subcategory', value: 'diagram' },
				{ label: '{{Should be SVG|emblem}}: emblems, free/libre logos, insignias, etc.', value: 'emblem' },
				{ label: '{{Should be SVG|fair use}}: fair-use images, fair-use logos', value: 'fair use' },
				{ label: '{{Should be SVG|flag}}: flags', value: 'flag' },
				{ label: '{{Should be SVG|graph}}: visual plots of data', value: 'graph' },
				{ label: '{{Should be SVG|logo}}: logos', value: 'logo' },
				{ label: '{{Should be SVG|map}}: maps', value: 'map' },
				{ label: '{{Should be SVG|music}}: musical scales, notes, etc.', value: 'music' },
				{ label: '{{Should be SVG|physical}}: "realistic" images of physical objects, people, etc.', value: 'physical' },
				{ label: '{{Should be SVG|symbol}}: miscellaneous symbols, icons, etc.', value: 'symbol' }
			]
		}
	},
	{ label: '{{Should be text}}: image should be represented as text, tables, or math markup', value: 'Should be text' }
];

Twinkle.tag.file.qualityList = [
	{ label: '{{Image-blownout}}', value: 'Image-blownout' },
	{ label: '{{Image-out-of-focus}}', value: 'Image-out-of-focus' },
	{ label: '{{Image-Poor-Quality}}', value: 'Image-Poor-Quality' },
	{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
	{ label: '{{Low quality chem}}: disputed chemical structures', value: 'Low quality chem' }
];

Twinkle.tag.file.replacementList = [
	{ label: '{{Duplicate}}: exact duplicate of another file, but not yet orphaned', value: 'Duplicate' },
	{ label: '{{Obsolete}}: improved version available', value: 'Obsolete' },
	{ label: '{{PNG version available}}', value: 'PNG version available' },
	{ label: '{{Vector version available}}', value: 'Vector version available' }
];


// Contains those article tags that *do not* work inside {{multiple issues}}.
Twinkle.tag.multipleIssuesExceptions = [
	'copypaste',
	'expand language',
	'GOCEinuse',
	'improve categories',
	'in use',
	'merge',
	'merge from',
	'merge to',
	'not English',
	'rough translation',
	'uncategorized',
	'under construction'
];


Twinkle.tag.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters(),
			tagRe, tagText = '', summaryText = 'Added',
			tags = [], groupableTags = [], i, totalTags;

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");

		var addTag = function friendlytagAddTag( tagIndex, tagName ) {
			var currentTag = "";
			if( tagName === 'uncategorized' || tagName === 'improve categories' ) {
				pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				if( tagName === 'globalize' ) {
					currentTag += '{{' + params.tagParameters.globalize;
				} else {
					currentTag += ( Twinkle.tag.mode === 'redirect' ? '\n' : '' ) + '{{' + tagName;
				}

				if( tagName === 'notability' && params.tagParameters.notability !== 'none' ) {
					currentTag += '|' + params.tagParameters.notability;
				}

				// prompt for other parameters, based on the tag
				switch( tagName ) {
					case 'cleanup':
						currentTag += '|reason=' + params.tagParameters.cleanup;
						break;
					case 'close paraphrasing':
						currentTag += '|source=' + params.tagParameters.closeParaphrasing;
						break;
					case 'copy edit':
						if (params.tagParameters.copyEdit) {
							currentTag += '|for=' + params.tagParameters.copyEdit;
						}
						break;
					case 'copypaste':
						if (params.tagParameters.copypaste) {
							currentTag += '|url=' + params.tagParameters.copypaste;
						}
						break;
					case 'expand language':
						currentTag += '|topic=';
						currentTag += '|langcode=' + params.tagParameters.expandLanguageLangCode;
						if (params.tagParameters.expandLanguageArticle !== null) {
							currentTag += '|otherarticle=' + params.tagParameters.expandLanguageArticle;
						}
						break;
					case 'expert needed':
						if (params.expertNeeded) {
							currentTag += '|1=' + params.expertNeeded;
						}
						if(params.expertNeededTalk) {
							currentTag += '|talk=' + params.expertNeededTalk;
						}
						if(params.expertNeededReason) {
							currentTag += '|reason=' + params.expertNeededReason;
						}
						break;
					case 'news release':
						currentTag += '|1=article';
						break;
					case 'not English':
					case 'rough translation':
						if (params.translationLanguage) {
							currentTag += '|1=' + params.translationLanguage;
						}
						if (params.translationPostAtPNT) {
							currentTag += '|listed=yes';
						}
						break;
					case 'merge':
					case 'merge to':
					case 'merge from':
						if (params.mergeTarget) {
							// normalize the merge target for now and later
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

							currentTag += '|' + params.mergeTarget;

							// link to the correct section on the talk page, for article space only
							if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle = (tagName === "merge to" ? params.mergeTarget : mw.config.get('wgTitle'));
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle = (tagName === "merge to" ? mw.config.get('wgTitle') : params.mergeTarget);
									params.talkDiscussionTitle = 'Proposed merge with ' + params.nonDiscussArticle;
								}
								currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
							}
						}
						break;
					case 'R from alternative language':
						if(params.altLangFrom) {
							currentTag += '|from=' + params.altLangFrom;
						}
						if(params.altLangTo) {
							currentTag += '|to=' + params.altLangTo;
						}
						break;
					default:
						break;
				}

				currentTag += (Twinkle.tag.mode === 'redirect') ? '}}' : '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}

			if ( tagIndex > 0 ) {
				if( tagIndex === (totalTags - 1) ) {
					summaryText += ' and';
				} else if ( tagIndex < (totalTags - 1) ) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[:';
			if( tagName === 'globalize' ) {
				summaryText += "Template:" + params.tagParameters.globalize + '|' + params.tagParameters.globalize;
			} else if( tagName.indexOf("|") !== -1 ) {
				//if it is a custom tag with a parameter
				var slicedTagName = tagName.slice(0,tagName.indexOf("|"));
				if( tagName.indexOf(":") !== -1 ) {
					summaryText += slicedTagName;
				} else {
					summaryText += "Template:" + slicedTagName + "|" + slicedTagName;
				}
			} else if( tagName.indexOf(":") !== -1 ) {
				summaryText += tagName;
			} else {
				summaryText += "Template:" + tagName + "|" + tagName;
			}
			summaryText += ']]}}';
		};

		if( Twinkle.tag.mode !== 'redirect' ) {
			// Check for preexisting tags and separate tags into groupable and non-groupable arrays
			params.tags.forEach(function(tag) {
				tagRe = new RegExp ( '\\{\\{' + tag + '(\\||\\}\\})', 'im' );
				if( !tagRe.exec( pageText ) ) {
					if( Twinkle.tag.multipleIssuesExceptions.indexOf(tag) === -1 ) {
						groupableTags = groupableTags.concat( tag );
					} else {
						tags = tags.concat( tag );
					}
				} else {
					if(tag === 'merge from') {
						tags = tags.concat( tag );
					} else {
						Morebits.status.warn( 'Info', 'Found {{' + tag +
							'}} on the article already...excluding' );
						// don't do anything else with merge tags
						if ( ['merge', 'merge to'].indexOf(tag) !== -1 ) {
							params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
						}
					}
				}
			});

			var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

			if( miTest && groupableTags.length > 0 ) {
				Morebits.status.info( 'Info', 'Adding supported tags inside existing {{multiple issues}} tag' );

				groupableTags.sort();
				tagText = "";

				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);

				summaryText += ' tag' + ( groupableTags.length > 1 ? 's' : '' ) + ' (within {{[[Template:multiple issues|multiple issues]]}})';
				if( tags.length > 0 ) {
					summaryText += ', and';
				}

				var miRegex = new RegExp("(\\{\\{\\s*" + miTest[1] + "\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*", "im");
				pageText = pageText.replace(miRegex, "$1" + tagText + "}}\n");
				tagText = "";

			} else if( params.group && groupableTags.length >= 2 ) {
				Morebits.status.info( 'Info', 'Grouping supported tags inside {{multiple issues}}' );

				groupableTags.sort();
				tagText += '{{multiple issues|\n';

				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);

				summaryText += ' tags (within {{[[Template:multiple issues|multiple issues]]}})';
				if( tags.length > 0 ) {
					summaryText += ', and';
				}
				tagText += '}}\n';
			} else {
				tags = tags.concat( groupableTags );
			}
		} else {
			// Redirect tagging: Check for pre-existing tags
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
				if( !tagRe.exec( pageText ) ) {
					tags = tags.concat( params.tags[i] );
				} else {
					Morebits.status.warn( 'Info', 'Found {{' + params.tags[i] +
						'}} on the redirect already...excluding' );
				}
			}
		}

		tags.sort();
		totalTags = tags.length;
		$.each(tags, addTag);

		if( Twinkle.tag.mode === 'redirect' ) {
			// Check for all Rcat shell redirects (from #433)
			if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
				// Regex courtesy [[User:Kephir/gadgets/sagittarius.js]] at [[Special:PermaLink/831402893]]
				var oldTags = pageText.match(/(\s*{{[A-Za-z ]+\|)((?:[^|{}]*|{{[^|}]*}})+)(}})\s*/i);
				pageText = pageText.replace(oldTags[0], oldTags[1]+tagText+oldTags[2]+oldTags[3]);
			} else {
				// Fold any pre-existing Rcats into taglist and under Rcatshell
				var pageTags = pageText.match(/\n{{R(?:edirect)? .*?}}/img);
				var oldPageTags ='';
				if (pageTags) {
					pageTags.forEach(function(pageTag) {
						var pageRe = new RegExp(pageTag, 'img');
						pageText = pageText.replace(pageRe,'');
						oldPageTags = oldPageTags.concat(pageTag);
					});
				}
				pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
			}
		} else {
			// smartly insert the new tags after any hatnotes. Regex is a bit more
			// complicated than it'd need to be, to allow templates as parameters,
			// and to handle whitespace properly.
			pageText = pageText.replace(/^\s*(?:((?:\s*\{\{\s*(?:about|correct title|dablink|distinguish|for|other\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\s?(?:also|wiktionary)|selfref|the)\d*\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\})+(?:\s*\n)?)\s*)?/i,
				"$1" + tagText);
		}
		summaryText += ( tags.length > 0 ? ' tag' + ( tags.length > 1 ? 's' : '' ) : '' ) +
			' to ' + Twinkle.tag.mode;

		// avoid truncated summaries
		if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, "$1");
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save(function() {
			// special functions for merge tags
			if (params.mergeReason) {
				// post the rationale on the talk page (only operates in main namespace)
				var talkpageText = "\n\n== Proposed merge with [[" + params.nonDiscussArticle + "]] ==\n\n";
				talkpageText += params.mergeReason.trim() + " ~~~~";

				var talkpage = new Morebits.wiki.page("Talk:" + params.discussArticle, "Posting rationale on talk page");
				talkpage.setAppendText(talkpageText);
				talkpage.setEditSummary('Proposing to merge [[:' + params.nonDiscussArticle + ']] ' +
					(tags.indexOf("merge") !== -1 ? 'with' : 'into') + ' [[:' + params.discussArticle + ']]' +
					Twinkle.getPref('summaryAd'));
				talkpage.setWatchlist(Twinkle.getFriendlyPref('watchMergeDiscussions'));
				talkpage.setCreateOption('recreate');
				talkpage.append();
			}
			if (params.mergeTagOther) {
				// tag the target page if requested
				var otherTagName = "merge";
				if (tags.indexOf("merge from") !== -1) {
					otherTagName = "merge to";
				} else if (tags.indexOf("merge to") !== -1) {
					otherTagName = "merge from";
				}
				var newParams = {
					tags: [otherTagName],
					mergeTarget: Morebits.pageNameNorm,
					discussArticle: params.discussArticle,
					talkDiscussionTitle: params.talkDiscussionTitle
				};
				var otherpage = new Morebits.wiki.page(params.mergeTarget, "Tagging other page (" +
					params.mergeTarget + ")");
				otherpage.setCallbackParameters(newParams);
				otherpage.load(Twinkle.tag.callbacks.main);
			}

			// post at WP:PNT for {{not English}} and {{rough translation}} tag
			if (params.translationPostAtPNT) {
				var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
					"Listing article at Wikipedia:Pages needing translation into English");
				pntPage.setFollowRedirect(true);
				pntPage.setCallbackParameters({
					template: params.tags.indexOf("rough translation") !== -1 ? "duflu" : "needtrans",
					lang: params.translationLanguage,
					reason: params.translationComments
				});
				pntPage.load(Twinkle.tag.callbacks.translationListPage);
			}
			if (params.translationNotify) {
				pageobj.lookupCreator(function(innerPageobj) {
					var initialContrib = innerPageobj.getCreator();

					// Disallow warning yourself
					if (initialContrib === mw.config.get('wgUserName')) {
						innerPageobj.getStatusElement().warn("You (" + initialContrib + ") created this page; skipping user notification");
						return;
					}

					var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
						'Notifying initial contributor (' + initialContrib + ')');
					var notifytext = "\n\n== Your article [[" + Morebits.pageNameNorm + "]]==\n" +
						"{{subst:uw-notenglish|1=" + Morebits.pageNameNorm +
						(params.translationPostAtPNT ? "" : "|nopnt=yes") + "}} ~~~~";
					userTalkPage.setAppendText(notifytext);
					userTalkPage.setEditSummary("Notice: Please use English when contributing to the English Wikipedia." +
						Twinkle.getPref('summaryAd'));
					userTalkPage.setCreateOption('recreate');
					userTalkPage.setFollowRedirect(true);
					userTalkPage.append();
				});
			}
		});

		if( params.patrol ) {
			pageobj.patrol();
		}
	},

	translationListPage: function friendlytagCallbacksTranslationListPage(pageobj) {
		var old_text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var statelem = pageobj.getStatusElement();

		var templateText = "{{subst:" + params.template + "|pg=" + Morebits.pageNameNorm + "|Language=" +
			(params.lang || "uncertain") + "|Comments=" + params.reason.trim() + "}} ~~~~";

		var text, summary;
		if (params.template === "duflu") {
			text = old_text + "\n\n" + templateText;
			summary = "Translation cleanup requested on ";
		} else {
			text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
				"\n\n" + templateText + "\n\n$1");
			summary = "Translation" + (params.lang ? (" from " + params.lang) : "") + " requested on ";
		}

		if (text === old_text) {
			statelem.error('failed to find target spot for the discussion');
			return;
		}
		pageobj.setPageText(text);
		pageobj.setEditSummary(summary + " [[:" + Morebits.pageNameNorm + "]]" + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = "Adding ";

		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = "", currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (["Keep local", "subst:ncd", "Do not move to Commons_reason", "Do not move to Commons",
					"Now Commons"].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");
				}
				if (tag === "Vector version available") {
					text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, "");
				}

				currentTag = "{{" + (tag === "Do not move to Commons_reason" ? "Do not move to Commons" : tag);

				var input;
				switch (tag) {
					case "subst:ncd":
						/* falls through */
					case "Keep local":
						input = prompt( "{{" + (tag === "subst:ncd" ? "Now Commons" : tag) +
							"}} - Enter the name of the image on Commons (if different from local name), excluding the File: prefix:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += '|1=' + input;
						}
						break;
					case "Rename media":
						input = prompt( "{{Rename media}} - Enter the new name for the image (optional):", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						input = prompt( "{{Rename media}} - Enter the reason for the rename (optional):", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|2=" + input;
						}
						break;
					case "Cleanup image":
						/* falls through */
					case "Cleanup SVG":
						input = prompt( "{{" + tag + "}} - Enter the reason for cleanup (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Image-Poor-Quality":
						input = prompt( "{{Image-Poor-Quality}} - Enter the reason why this image is so bad (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Low quality chem":
						input = prompt( "{{Low quality chem}} - Enter the reason why the diagram is disputed (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "PNG version available":
						/* falls through */
					case "Vector version available":
						/* falls through */
					case "Obsolete":
						/* falls through */
					case "Duplicate":
						input = prompt( "{{" + tag + "}} - Enter the name of the file which replaces this one (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Do not move to Commons_reason":
						input = prompt( "{{Do not move to Commons}} - Enter the reason why this image should not be moved to Commons (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|reason=" + input;
						}
						break;
					case "subst:orfurrev":
						//remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
						currentTag += "|date={{subst:date}}";
						break;
					case "Copy to Commons":
						currentTag += "|human=" + mw.config.get("wgUserName");
						break;
					default:
						break;  // don't care
				}

				if (tag === "Should be SVG") {
					currentTag += "|" + params.svgSubcategory;
				}

				currentTag += "}}\n";

				tagtext += currentTag;
				summary += "{{" + tag + "}}, ";

				return true;  // continue
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn("User canceled operation; nothing to do");
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 2) + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if( params.patrol ) {
			pageobj.patrol();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var params = {};
	if (form.patrolPage) {
		params.patrol = form.patrolPage.checked;
	}

	switch (Twinkle.tag.mode) {
		case 'article':
			params.tags = form.getChecked( 'articleTags' );
			params.group = form.group.checked;
			params.tagParameters = {
				cleanup: form["articleTags.cleanup"] ? form["articleTags.cleanup"].value : null,
				closeParaphrasing: form["articleTags.closeParaphrasing"] ? form["articleTags.closeParaphrasing"].value : null,
				copyEdit: form["articleTags.copyEdit"] ? form["articleTags.copyEdit"].value : null,
				copypaste: form["articleTags.copypaste"] ? form["articleTags.copypaste"].value : null,
				expandLanguageLangCode: form["articleTags.expandLanguageLangCode"] ? form["articleTags.expandLanguageLangCode"].value : null,
				expandLanguageArticle: form["articleTags.expandLanguageArticle"] ? form["articleTags.expandLanguageArticle"].value : null,
				globalize: form["articleTags.globalize"] ? form["articleTags.globalize"].value : null,
				notability: form["articleTags.notability"] ? form["articleTags.notability"].value : null
			};
			// {{expert needed}} parameters:
			params.expertNeeded = form["articleTags.expertNeeded"] ? form["articleTags.expertNeeded"].value : null,
			params.expertNeededTalk = form["articleTags.expertNeededTalk"] ? form["articleTags.expertNeededTalk"].value : null,
			params.expertNeededReason = form["articleTags.expertNeededReason"] ? form["articleTags.expertNeededReason"].value : null,
			// common to {{merge}}, {{merge from}}, {{merge to}}
			params.mergeTarget = form["articleTags.mergeTarget"] ? form["articleTags.mergeTarget"].value : null;
			params.mergeReason = form["articleTags.mergeReason"] ? form["articleTags.mergeReason"].value : null;
			params.mergeTagOther = form["articleTags.mergeTagOther"] ? form["articleTags.mergeTagOther"].checked : false;
			// common to {{not English}}, {{rough translation}}
			params.translationLanguage = form["articleTags.translationLanguage"] ? form["articleTags.translationLanguage"].value : null;
			params.translationNotify = form["articleTags.translationNotify"] ? form["articleTags.translationNotify"].checked : null;
			params.translationPostAtPNT = form["articleTags.translationPostAtPNT"] ? form["articleTags.translationPostAtPNT"].checked : null;
			params.translationComments = form["articleTags.translationComments"] ? form["articleTags.translationComments"].value : null;
			break;
		case 'file':
			params.svgSubcategory = form["imageTags.svgCategory"] ? form["imageTags.svgCategory"].value : null;
			params.tags = form.getChecked( 'imageTags' );
			break;
		case 'redirect':
			params.tags = form.getChecked( 'redirectTags' );
			params.altLangFrom = form["redirectTags.altLangFrom"] ? form["redirectTags.altLangFrom"].value : null;
			params.altLangTo = form["redirectTags.altLangTo"] ? form["redirectTags.altLangTo"].value : null;
			break;
		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}

	// form validation
	if( !params.tags.length ) {
		alert( 'You must select at least one tag!' );
		return;
	}
	if ((params.tags.indexOf("merge") !== -1) || (params.tags.indexOf("merge from") !== -1) || (params.tags.indexOf("merge to") !== -1)) {
		if( ((params.tags.indexOf("merge") !== -1) + (params.tags.indexOf("merge from") !== -1) +
			(params.tags.indexOf("merge to") !== -1)) > 1 ) {
			alert( 'Please select only one of {{merge}}, {{merge from}}, and {{merge to}}. If several merges are required, use {{merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).' );
			return;
		}
		if ( !params.mergeTarget ) {
			alert( 'Please specify the title of the other article for use in the merge template.' );
			return;
		}
		if( (params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1 ) {
			alert( 'Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.' );
			return;
		}
	}
	if( (params.tags.indexOf("not English") !== -1) && (params.tags.indexOf("rough translation") !== -1) ) {
		alert( 'Please select only one of {{not English}} and {{rough translation}}.' );
		return;
	}
	if( params.tags.indexOf('cleanup') !== -1 && params.tagParameters.cleanup.trim() === '') {
		alert( 'You must specify a reason for the {{cleanup}} tag.' );
		return;
	}
	if( params.tags.indexOf('expand language') !== -1 && params.tagParameters.expandLanguageLangCode.trim() === '') {
		alert('You must specify language code for the {{expand language}} tag.');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = "Tagging complete, reloading article in a few seconds";
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, "Tagging " + Twinkle.tag.mode);
	wikipedia_page.setCallbackParameters(params);
	switch (Twinkle.tag.mode) {
		case 'article':
			/* falls through */
		case 'redirect':
			wikipedia_page.load(Twinkle.tag.callbacks.main);
			return;
		case 'file':
			wikipedia_page.load(Twinkle.tag.callbacks.file);
			return;
		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}
};
})(jQuery);

//</nowiki>
