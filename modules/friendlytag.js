/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles, all redirects
 * Config directives in:   FriendlyConfig
 */

Twinkle.tag = function friendlytag() {
	if( QueryString.exists( 'redirect' ) && QueryString.get( 'redirect' ) === 'no' && $("span.redirectText").length > 0 ) {
		Twinkle.tag.isRedirect = true;
		$(twAddPortletLink("#", "Tag", "friendly-tag", "Tag redirect", "")).click(Twinkle.tag.callback);
	} else if( mw.config.get('wgNamespaceNumber') !== 0 || !mw.config.get('wgCurRevisionId') ) {
		return;
	} else {
		$(twAddPortletLink("#", "Tag", "friendly-tag", "Add maintenance tags to article", "")).click(Twinkle.tag.callback);
	}
};

Twinkle.tag.callback = function friendlytagCallback( uid ) {
	var Window = new SimpleWindow( 630, 400 );
	Window.setScriptName( "Twinkle" );
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#tag" );

	var form = new QuickForm( Twinkle.tag.callback.evaluate );

	if( !Twinkle.tag.isRedirect ) {
		Window.setTitle( "Article maintenance tagging" );

		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Group into {{multiple issues}} if possible',
						value: 'group',
						name: 'group',
						tooltip: 'If applying three or more templates supported by {{multiple issues}} and this box is checked, all supported templates will be grouped into a single {{multiple issues}} template.',
						checked: Twinkle.getFriendlyPref('groupByDefault')
					}
				]
			}
		);

		form.append( { type:'header', label:'Maintenance templates' } );
		form.append( { type:'checkbox', name: 'maintenance', list: Twinkle.tag.maintenanceList } );

		form.append( { type:'header', label:'Problem templates' } );
		form.append( { type:'checkbox', name: 'problem', list: Twinkle.tag.problemList } );

		form.append( { type:'header', label:'Notice templates' } );
		form.append( { type:'checkbox', name: 'notice', list: Twinkle.tag.noticeList } );

		if( Twinkle.getFriendlyPref('customTagList').length ) {
			form.append( { type:'header', label:'Custom templates' } );
			form.append( { type: 'checkbox', name: 'custom', list: Twinkle.getFriendlyPref('customTagList') } );
		}
	} else {
		Window.setTitle( "Redirect tagging" );

		form.append( { type:'header', label:'Spelling, misspelling, tense and capitalization templates' } );
		form.append( { type:'checkbox', name: 'spelling', list: Twinkle.tag.spellingList } );

		form.append( { type:'header', label:'Alternative name templates' } );
		form.append( { type:'checkbox', name: 'alternative', list: Twinkle.tag.alternativeList } );

		form.append( { type:'header', label:'Miscellaneous and administrative redirect templates' } );
		form.append( { type:'checkbox', name: 'administrative', list: Twinkle.tag.administrativeList } );
	}

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
};

Twinkle.tag.maintenanceList = [
	{
		label: '{{allplot}}: article is almost entirely a plot summary',
		value: 'allplot' 
	},
	{
		label: '{{catimprove}}: article may require additional categories.',
		value: 'catimprove'
	},
	{
		label: '{{cleanup}}: article may require cleanup',
		value: 'cleanup'
	},
	{
		label: '{{confusing}}: article may be confusing or unclear',
		value: 'confusing'
	},
	{
		label: '{{copyedit}}: article needs copy editing for grammar, style, cohesion, tone, and/or spelling',
		value: 'copyedit'
	},
	{
		label: '{{citation style}}: article has unclear or inconsistent inline citations',
		value: 'citation style'
	},
	{
		label: '{{deadend}}: article has few or no links to other articles',
		value: 'deadend'
	},
	{
		label: '{{essay-like}}: article is written like an essay and needs cleanup',
		value: 'essay-like'
	},
	{
		label: '{{expert}}: article needs attention from an expert on the subject',
		value: 'expert'
	},
	{
		label: '{{fansite}}: article  resembles a fansite',
		value: 'fansite'
	},
	{
		label: '{{in-universe}}: article subject is fictional and needs rewriting from a non-fictional perspective',
		value: 'in-universe'
	},
	{
		label: '{{lead missing}}: article has no lead section and one should be written',
		value: 'lead missing'
	},
	{
		label: '{{lead too long}}: article lead section is too long and should be shortened',
		value: 'lead too long'
	},
	{
		label: '{{lead too short}}: article lead section is too short and should be expanded',
		value: 'lead too short'
	},
	{
		label: '{{lead rewrite}}: article lead section needs to be rewritten to comply with guidelines',
		value: 'lead rewrite'
	},
	{
		label: '{{linkrot}}: article uses bare URLs for references, which are prone to link rot',
		value: 'linkrot'
	},
	{
		label: '{{merge}}: article should be merged with another given article',
		value: 'merge'
	},
	{
		label: '{{merge from}}: another given article should be merged into this one',
		value: 'merge from'
	},
	{
		label: '{{merge to}}: article should be merged into another given article',
		value: 'merge to'
	},
	{
		label: '{{morefootnotes}}: article has some references, but insufficient in-text citations',
		value: 'morefootnotes'
	},
	{
		label: '{{nofootnotes}}: article has references, but no in-text citations',
		value: 'nofootnotes'
	},
	{
		label: '{{notenglish}}: article is written in a language other than English and needs translation',
		value: 'notenglish'
	},
	{
		label: '{{orphan}}: article has few or no other articles that link to it',
		value: 'orphan' 
	},
	{
		label: '{{plot}}: plot summary in article is too long',
		value: 'plot' 
	},
	{
		label: '{{prose}}: article is in a list format that may be better presented using prose',
		value: 'prose'
	},
	{
		label: '{{pov-check}}: nominate article to be checked for neutrality',
		value: 'pov-check'
	},
	{
		label: '{{sections}}: article needs to be broken into sections',
		value: 'sections'
	},
	{
		label: '{{tense}}: article is written in an incorrect tense',
		value: 'tense'
	},
	{
		label: '{{tone}}: tone of article is not appropriate',
		value: 'tone'
	},
	{
		label: '{{uncategorized}}: article is uncategorized',
		value: 'uncategorized'
	},
	{
		label: '{{verylong}}: article is too long',
		value: 'verylong'
	},
	{
		label: '{{wikify}}: article needs to be wikified',
		value: 'wikify'
	}
];


Twinkle.tag.problemList = [
	{
		label: '{{advert}}: article is written like an advertisement',
		value: 'advert'
	},
	{
		label: '{{autobiography}}: article is an autobiography and may not be of NPOV',
		value: 'autobiography'
	},
	{
		label: '{{close paraphrase}}: article contains close paraphrasing of a non-free copyrighted source',
		value: 'close paraphrase'
	},
	{
		label: '{{coi}}: article creator or major contributor may have a conflict of interest',
		value: 'coi'
	},
	{
		label: '{{context}}: article provides insufficient context',
		value: 'context'
	},
	{
		label: '{{copypaste}}: article appears to have been copied and pasted from a source',
		value: 'copypaste'
	},
	{
		label: '{{disputed}}: article has questionable factual accuracy',
		value: 'disputed'
	},
	{
		label: '{{external links}}: article\'s external links may not follow content policies or guidelines',
		value: 'external links'
	},
	{
		label: '{{globalize}}: article may not represent a worldwide view of the subject',
		value: 'globalize',
		subgroup: {
			name: 'globalize',
			type: 'select',
			list: [
				{
					label: "{{globalize}}: article may not represent a worldwide view of the subject",
					value: "globalize"
				},
				{
					label: "Region-specific {{globalize}} subtemplates",
					list: [
						{
							label: "{{globalize/Australia}}: article deals primarily with the Australian viewpoint",
							value: "globalize/Australia"
						},
						{
							label: "{{globalize/Belgium}}: article deals primarily with the Belgian viewpoint",
							value: "globalize/Belgium"
						},
						{
							label: "{{globalize/Canada}}: article deals primarily with the Canadian viewpoint",
							value: "globalize/Canada"
						},
						{
							label: "{{globalize/Common law}}: article deals primarily with the viewpoint of common law countries",
							value: "globalize/Common law"
						},
						{
							label: "{{globalize/Eng}}: article deals primarily with the English-speaking viewpoint",
							value: "globalize/Eng"
						},
						{
							label: "{{globalize/Europe}}: article deals primarily with the European viewpoint",
							value: "globalize/Europe"
						},
						{
							label: "{{globalize/France}}: article deals primarily with the French viewpoint",
							value: "globalize/France"
						},
						{
							label: "{{globalize/Germany}}: article deals primarily with the German viewpoint",
							value: "globalize/Germany"
						},
						{
							label: "{{globalize/Greece}}: article deals primarily with the Greek viewpoint",
							value: "globalize/Greece"
						},
						{
							label: "{{globalize/Luxembourg}}: article deals primarily with the Luxembourgish viewpoint",
							value: "globalize/Luxembourg"
						},
						{
							label: "{{globalize/Netherlands}}: article deals primarily with the Dutch viewpoint",
							value: "globalize/Netherlands"
						},
						{
							label: "{{globalize/North America}}: article deals primarily with the North American viewpoint",
							value: "globalize/North America"
						},
						{
							label: "{{globalize/Northern}}: article deals primarily with the northern hemisphere viewpoint",
							value: "globalize/Northern"
						},
						{
							label: "{{globalize/Russia}}: article deals primarily with the Russian viewpoint",
							value: "globalize/Russia"
						},
						{
							label: "{{globalize/Southern}}: article deals primarily with the southern hemisphere viewpoint",
							value: "globalize/Southern"
						},
						{
							label: "{{globalize/UK}}: article deals primarily with the British viewpoint",
							value: "globalize/UK"
						},
						{
							label: "{{globalize/UK and Canada}}: article deals primarily with the British and Canadian viewpoints",
							value: "globalize/UK and Canada"
						},
						{
							label: "{{globalize/USA}}: article deals primarily with the American viewpoint",
							value: "globalize/USA"
						}
					]
				}
			]
		}
	},
	{
		label: '{{hoax}}: article may be a complete hoax',
		value: 'hoax'
	},
	{
		label: '{{non-free}}: article may contain excessive or improper use of copyrighted materials',
		value: 'non-free'
	},
	{
		label: '{{notability}}: article\'s subject may not meet the notability guideline',
		value: 'notability',
		subgroup: {
			name: 'notability',
			type: 'select',
			list: [
				{
					label: "{{notability}}: article\'s subject may not meet the notability guideline",
					value: "none"
				},
				{
					label: "{{notability|Academics}}: notability guideline for academics",
					value: "Academics"
				},
				{
					label: "{{notability|Biographies}}: notability guideline for biographies",
					value: "Biographies"
				},
				{
					label: "{{notability|Books}}: notability guideline for books",
					value: "Books"
				},
				{
					label: "{{notability|Companies}}: notability guideline for companies and organizations",
					value: "Companies"
				},
				{
					label: "{{notability|Episode}}: notability guideline for television episodes",
					value: "Episode"
				},
				{
					label: "{{notability|Fiction}}: notability guideline for fiction",
					value: "Fiction"
				},
				{
					label: "{{notability|Films}}: notability guideline for films",
					value: "Films"
				},
				{
					label: "{{notability|Institutions}}: synonym of \"Companies\"",
					value: "Institutions"
				},
				{
					label: "{{notability|Music}}: notability guideline for music",
					value: "Music"
				},
				{
					label: "{{notability|Neologisms}}: notability guideline for neologisms",
					value: "Neologisms"
				},
				{
					label: "{{notability|Numbers}}: notability guideline for numbers",
					value: "Numbers"
				},
				{
					label: "{{notability|Organizations}}: synonym of \"Companies\"",
					value: "Organizations"
				},
				{
					label: "{{notability|Products}}: notability guideline for products and services",
					value: "Products"
				},
				{
					label: "{{notability|Web}}: notability guideline for web content",
					value: "Web"
				}
			]
		}
	},
	{
		label: '{{npov}}: article does not maintain a neutral point of view',
		value: 'npov'
	},
	{
		label: '{{one source}}: article relies largely or entirely upon a single source',
		value: 'one source'
	},
	{
		label: '{{original research}}: article has original research or unverified claims',
		value: 'original research'
	},
	{
		label: '{{overcoverage}}: Examples and perspectives in the article might have an extensive bias or disproportional coverage towards one or more specific regions',
		value: 'overcoverage'
	},
	{
		label: '{{peacock}}: article may contain peacock terms that promotes the subject in a subjective manner without adding information',
		value: 'peacock'
	},
	{
		label: '{{primarysources}}: article needs reliable, third-party sources',
		value: 'primarysources'
	},
	{
		label: "{{overdetailed}}: article contains an excessive amount of intricate detail",
		value: "overdetailed"
	},
	{
		label: "{{recentism}}: article is slanted towards recent events",
		value: "recentism"
	},
	{ 
		label: '{{refimprove}}: article needs additional references or sources for verification',
		value: 'refimprove' 
	},
	{ 
		label: '{{refimproveBLP}}: BLP article needs additional references or sources for verification',
		value: 'refimproveBLP' 
	},
	{
		label: '{{self-published}}: article may contain improper references to self-published sources',
		value: 'self-published'
	},
	{
		label: '{{synthesis}}: article may contain unpublished synthesis of published material that conveys unattributable ideas',
		value: 'synthesis'
	},
	{
		label: "{{toofewopinions}}: article may not include all significant viewpoints",
		value: "toofewopinions"
	},
	{
		label: '{{unencyclopedic}}: article contains unencyclopedic material',
		value: 'unencyclopedic'
	},
	{
		label: '{{unreferenced}}: article has no references at all',
		value: 'unreferenced'
	},
	{
		label: '{{unreferencedBLP}}: BLP article has no references at all',
		value: 'unreferencedBLP'
	},
	{
		label: '{{update}}: article information is out of date',
		value: 'update'
	},
	{
		label: '{{weasel}}: article quality may be compromised by the use of weasel words',
		value: 'weasel'
	}
];

Twinkle.tag.noticeList = [
	{
		label: '{{goceinuse}}: article is currently undergoing a major copy edit by the Guild of Copy Editors',
		value: 'goceinuse' },
	{
		label: '{{inuse}}: article is undergoing a major edit for a short while',
		value: 'inuse' },
	{
		label: '{{new unreviewed article}}: mark article for later review',
		value: 'new unreviewed article' },
	{
		label: '{{underconstruction}}: article is currently in the middle of an expansion or major revamping',
		value: 'underconstruction' }
];


Twinkle.tag.spellingList = [
	{
		label: '{{R from abbreviation}}: redirect from a title with an abbreviation',
		value: 'R from abbreviation' 
	},
	{
		label: '{{R to list entry}}: redirect to a \"list of minor entities\"-type article which is a collection of brief descriptions for subjects not notable enough to have separate articles',
		value: 'R to list entry' 
	},
	{
		label: '{{R to section}}: sames as {{R to list entry}}, but when list is more sectionlike in organization, such as list of fictional characters in a fictional universe.',
		value: 'R to section' 
	},
	{
		label: '{{R from misspelling}}: redirect from a misspelling or typographical error',
		value: 'R from misspelling' 
	},
	{
		label: '{{R from alternative spelling}}: redirect from a title with a different spelling',
		value: 'R from alternative spelling' 
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
		label: '{{R with possibilities}}: redirect from a title for a topic more detailed than what is currently provided on the target page, or section of that page, hence something which can and should be expanded',
		value: 'R with possibilities' 
	},
	{
		label: '{{R from member}}: redirect from a person who is a member of a group to more general related topics, such as the group, organization, ensemble or team that he or she belongs to',
		value: 'R from member' 
	},
	{
		label: '{{R from other capitalisation}}: redirect from a title with another method of capitalisation',
		value: 'R from other capitalisation'
	}
];

Twinkle.tag.alternativeList = [
	{
		label: '{{R from alternative name}}: redirect from a title that is another name, a pseudonym, a nickname, or a synonym',
		value: 'R from alternative name' 
	},
	{
		label: '{{R from full name}}: redirect from a title that is a complete or more complete name',
		value: 'R from full name' 
	},
	{
		label: '{{R from surname}}: redirect from a title that is a surname',
		value: 'R from surname' 
	},
	{
		label: '{{R from historic name}}: redirect from a title that is another name, a pseudonym, a nickname, or a synonym that has a significant historic past as a region, state, principate\'s holding, city, city-state or such, but which region has been subsumed into a modern era municipality, district or state, or otherwise suffered from a name change over time',
		value: 'R from historic name' 
	},
	{
		label: '{{R from scientific name}}: redirect from the scientific name to the common name',
		value: 'R from scientific name' 
	},
	{
		label: '{{R to scientific name}}: redirect from the common name to the scientific name',
		value: 'R to scientific name' 
	},
	{
		label: '{{R from name and country}}: redirect from the specific name to the briefer name',
		value: 'R from name and country' 
	},
	{
		label: '{{R from alternative language}}: redirect from an English name to a name in another language, or vice-versa',
		value: 'R from alternative language' 
	},
	{
		label: '{{R from ASCII}}: redirect from a title in basic ASCII to the formal article title, with differences that are not diacritical marks (accents, umlauts, etc.)',
		value: 'R from ASCII' 
	},
	{
		label: '{{R from title without diacritics}}: redirect to the article title with diacritical marks (accents, umlauts, etc.)',
		value: 'R from title without diacritics'
	}
];

Twinkle.tag.administrativeList = [
	{
		label: '{{R from merge}}: redirect from a merged page in order to preserve its edit history',
		value: 'R from merge' 
	},
	{
		label: '{{R to disambiguation page}}: redirect to a disambiguation page',
		value: 'R to disambiguation page' 
	},
	{
		label: '{{R from duplicated article}}: redirect to a similar article in order to preserve its edit history',
		value: 'R from duplicated article' 
	},
	{
		label: '{{R to decade}}: redirect from a year to the decade article',
		value: 'R to decade' 
	},
	{
		label: '{{R from shortcut}}: redirect from a Wikipedia shortcut',
		value: 'R from shortcut' 
	},
	{
		label: '{{R from CamelCase}}: redirect from a CamelCase title',
		value: 'R from CamelCase' 
	},
	{
		label: '{{R from EXIF}}: redirect of a wikilink created from JPEG EXIF information (i.e. the \"metadata\" section on some image description pages)',
		value: 'R from EXIF' 
	},
	{
		label: '{{R from school}}: redirect from a school article that had very little information',
		value: 'R from school'
	}
];

// Set to true if template can be grouped into {{articleissues}}
Twinkle.tag.groupHash = {
	'3O': true,
	'advert': true,
	'autobiography': true,
	'biased': true,
	'blpdispute': true,
	'BLPrefimprove': true,
	'BLPsources': true,
	'BLP sources': true,
	'BLPunsourced': true,
	'BLPunreferenced': true,
	'BLPunref': true,
	'citations missing': true,
	'citationstyle': true,
	'citecheck': true,
	'cleanup': true,
	'COI': true,
	'coi': true,
	'colloquial': true,
	'confusing': true,
	'context': true,
	'contradict': true,
	'copyedit': true,
	'citation style': true,
	'criticisms': true,
	'crystal': true,
	'deadend': true,
	'disputed': true,
	'essay': true,
	'essay-like': true,
	'examplefarm': true,
	'expert': false,
	'external links': true,
	'fancruft': true,
	'fansite': true,
	'fiction': true,
	'gameguide': true,
	'globalize': true,
	'grammar': true,
	'histinfo': true,
	'hoax': true,
	'howto': true,
	'importance': true,
	'inappropriate person': true,
	'incomplete': true,
	'lead missing': true,
	'lead rewrite': true,
	'lead too long': true,
	'lead too short': true,
	'in-universe': true,
	'jargon': true,
	'laundry': true,
	'laundrylists': true,
	'likeresume': true,
	'long': true,
	'newsrelease': true,
	'notability': true,
	'notable': true,
	'NPOV': true,
	'npov': true,
	'one source': true,
	'OR': true,
	'or': true,
	'original research': true,
	'orphan': true,
	'out of date': true,
	'peacock': true,
	'plot': true,
	'POV': true,
	'pov': true,
	'primarysources': true,
	'prose': true,
	'proseline': true,
	'quotefarm': true,
	'recentism': true,
	'refimprove': true,
	'refimproveBLP': true,
	'restructure': true,
	'review': true,
	'rewrite': true,
	'roughtranslation': true,
	'sections': true,
	'self-published': true,
	'spam': true,
	'story': true,
	'synthesis': true,
	'technical': true,
	'tone': true,
	'toolong': true,
	'tooshort': true,
	'travelguide': true,
	'trivia': true,
	'unbalanced': true,
	'unencyclopedic': true,
	'unref': true,
	'unreferenced': true,
	'unrefBLP': true,
	'unreferencedBLP': true,
	'update': true,
	'verylong': true,
	'weasel': true,
	'wikify': true
};

Twinkle.tag.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var tagRe, tagText = '', summaryText = 'Added';
		var tags = [], groupableTags = [];

		//Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*(New unreviewed article|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");

		var i;
		if( !Twinkle.tag.isRedirect ) {
			// Check for preexisting tags and separate tags into groupable and non-groupable arrays
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
				if( !tagRe.exec( pageText ) ) {
					if( Twinkle.tag.groupHash[ params.tags[i] ] && 
							(params.tags[i] !== 'globalize' || params.globalizeSubcategory === 'globalize' ) &&
							(params.tags[i] !== 'notability' || params.notabilitySubcategory === 'none' )) {
						// don't add to multipleissues for globalize/notability subcats
						groupableTags = groupableTags.concat( params.tags[i] );
					} else {
						tags = tags.concat( params.tags[i] );
					}
				} else {
					Status.info( 'Info', 'Found {{' + params.tags[i] +
						'}} on the article already...excluding' );
				}
			}

			if( params.group && groupableTags.length >= 3 ) {
				Status.info( 'Info', 'Grouping supported tags into {{multiple issues}}' );

				groupableTags.sort();
				tagText += '{{multiple issues';
				summaryText += ' {{[[Template:multiple issues|multiple issues]]}} with parameters';
				for( i = 0; i < groupableTags.length; i++ ) {
					tagText += '|' + groupableTags[i] +
						'={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}';

					if( i === (groupableTags.length - 1) ) {
						summaryText += ' and';
					} else if ( i < (groupableTags.length - 1) && i > 0 ) {
						summaryText += ',';
					}
					summaryText += ' ' + groupableTags[i];
				}
				tagText += '}}\n';
			} else {
				tags = tags.concat( groupableTags );
			}
		} else {
			// Check for pre-existing tags
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
				if( !tagRe.exec( pageText ) ) {
					tags = tags.concat( params.tags[i] );
				} else {
					Status.info( 'Info', 'Found {{' + params.tags[i] +
						'}} on the redirect already...excluding' );
				}
			}
		}

		tags.sort();
		for( i = 0; i < tags.length; i++ ) {
			var currentTag = "";
			if( tags[i] === 'uncategorized' || tags[i] === 'catimprove' ) {
				pageText += '\n\n{{' + tags[i] +
					'|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				if( tags[i] === 'globalize' ) {
					currentTag += '{{' + params.globalizeSubcategory;
				} else {
					currentTag += ( Twinkle.tag.isRedirect ? '\n' : '' ) + '{{' + tags[i];
				}

				if( tags[i] === 'notability' && params.notabilitySubcategory !== 'none' ) {
					currentTag += '|' + params.notabilitySubcategory;
				}

				// prompt for other parameters, based on the tag
				switch( tags[i] ) {
					case 'cleanup':
						var reason = prompt('You can optionally enter a more specific reason why the article requires cleanup.  \n' +
							"Just click OK if you don't wish to enter this.  To skip the {{cleanup}} tag, click Cancel.", "");
						if (reason === null) {
							continue;
						} else if (reason !== "") {
							currentTag += '|reason=' + reason;
						}
						break;
					case 'notenglish':
						var langname = prompt('Please enter the name of the language the article is thought to be written in.  \n' +
							"Just click OK if you don't know.  To skip the {{notenglish}} tag, click Cancel.", "");
						if (langname === null) {
							continue;
						} else if (langname !== "") {
							currentTag += '|1=' + langname;
						}
						break;
					case 'roughtranslation':
						var roughlang = prompt('Please enter the name of the language the article is thought to have been translated from.  \n' +
							"Just click OK if you don't know.  To skip the {{roughtranslation}} tag, click Cancel.", "");
						if (roughlang === null) {
							continue;
						} else if (roughlang !== "") {
							currentTag += '|1=' + roughlang;
						}
						break;
					case 'merge':
					case 'merge to':
					case 'merge from':
						var param = prompt('Please enter the name of the other article(s) involved in the merge.  \n' +
							"To specify multiple articles, separate them with a vertical pipe (|) character.  \n" +
							"This information is required.  Click OK when done, or click Cancel to skip the merge tag.", "");
						if (param === null) {
							continue;
						} else if (param !== "") {
							currentTag += '|' + param;
						}
						break;
					default:
						break;
				}
				
				currentTag += Twinkle.tag.isRedirect ? '}}' : '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}

			if ( i > 0 || groupableTags.length > 3 ) {
				if( i === (tags.length - 1) ) {
					summaryText += ' and';
				} else if ( i < (tags.length - 1) ) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[Template:';
			if( tags[i] === 'globalize' ) {
				summaryText += params.globalizeSubcategory + '|' + params.globalizeSubcategory;
			} else {
				summaryText += tags[i] + '|' + tags[i];
			}
			summaryText += ']]}}';
		}

		if( Twinkle.tag.isRedirect ) {
			pageText += tagText;
		} else {
			// smartly insert the new tags after any hatnotes. Regex is a bit more
			// complicated than it'd need to be, to allow templates as parameters,
			// and to handle whitespace properly.
			pageText = pageText.replace(/^\s*(?:((?:\s*\{\{\s*(?:about|correct title|dablink|distinguish|for|other\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\s?(?:also|wiktionary)|selfref|the)\d*\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\})+(?:\s*\n)?)\s*)?/i,
				"$1" + tagText);
		}
		summaryText += ' tag' + ( ( tags.length + ( groupableTags.length > 3 ? 1 : 0 ) ) > 1 ? 's' : '' ) +
			' to ' + ( Twinkle.tag.isRedirect ? 'redirect' : 'article' ) + Twinkle.getPref('summaryAd');

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText);
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
		
		if( Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled') ) {
			pageobj.patrol();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var tags, globalizeSubcategory, notabilitySubcategory;
	if( Twinkle.tag.isRedirect ) {
		tags = form.getChecked( 'administrative' ).concat( form.getChecked( 'alternative' ) ).concat( form.getChecked( 'spelling' ) );
	} else {
		if( Twinkle.getFriendlyPref('customTagList').length ) {
			tags = form.getChecked( 'notice' ).concat( form.getChecked( 'problem' ) ).concat( form.getChecked( 'maintenance' ) ).concat( form.getChecked( 'custom' ) );
		} else {
			tags = form.getChecked( 'notice' ).concat( form.getChecked( 'problem' ) ).concat( form.getChecked( 'maintenance' ) );
		}
		globalizeSubcategory = form.getChecked( 'problem.globalize' );
		notabilitySubcategory = form.getChecked( 'problem.notability' );
	}
	var params;

	if( !tags.length ) {
		alert( 'You must select at least one tag!' );
		return;
	}
	if( !Twinkle.tag.isRedirect ) {
		params = {
			tags: tags,
			group: form.group.checked,
			globalizeSubcategory: globalizeSubcategory ? globalizeSubcategory[0] : null,
			notabilitySubcategory: notabilitySubcategory ? notabilitySubcategory[0] : null
		};
	} else {
		params = {
			tags: tags
		};
	}

	SimpleWindow.setButtonsEnabled( false );
	Status.init( form );

	Wikipedia.actionCompleted.redirect = mw.config.get('wgPageName');
	Wikipedia.actionCompleted.notice = "Tagging complete, reloading article in a few seconds";
	if (Twinkle.tag.isRedirect) {
		Wikipedia.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Wikipedia.page(mw.config.get('wgPageName'), Twinkle.tag.isRedirect ? "Tagging redirect" : "Tagging article");
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.tag.callbacks.main);
};
