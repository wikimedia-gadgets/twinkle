// <nowiki>

(function($) {


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
	if (Morebits.wiki.isPageRedirect()) {
		Twinkle.tag.mode = 'redirect';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'friendly-tag', 'Tag redirect');
	// file tagging
	} else if (mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById('mw-sharedupload') && document.getElementById('mw-imagepage-section-filehistory')) {
		Twinkle.tag.mode = 'file';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'friendly-tag', 'Add maintenance tags to file');
	// article/draft article tagging
	} else if ([0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 && mw.config.get('wgCurRevisionId')) {
		Twinkle.tag.mode = 'article';
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove = (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'friendly-tag', 'Add or remove article maintenance tags');
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow(630, Twinkle.tag.mode === 'article' ? 500 : 400);
	Window.setScriptName('Twinkle');
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#tag');

	var form = new Morebits.quickForm(Twinkle.tag.callback.evaluate);

	if (document.getElementsByClassName('patrollink').length) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Mark the page as patrolled',
					value: 'patrolPage',
					name: 'patrolPage',
					checked: Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled')
				}
			]
		});
	}

	switch (Twinkle.tag.mode) {
		case 'article':
			Window.setTitle('Article maintenance tagging');

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
				type: 'input',
				label: 'Quick filter: ',
				name: 'quickfilter',
				size: '30px',
				event: function twinkletagquickfilter() {
					var $form = $('#tagWorkArea');
					// flush the DOM of all existing underline spans
					$form.find('.search-hit').each(function(i, e) {
						var label_element = e.parentElement;
						// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
						// to <label>Hello world</label>
						label_element.innerHTML = label_element.textContent;
					});
					// allCheckboxDivs and allHeaders are defined globally, rather than in
					// this function, to avoid having to recompute them on every keydown.
					if (this.value) {
						allCheckboxDivs.hide();
						allHeaders.hide();
						var searchString = this.value;
						var searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');

						$form.find('label').each(function() {
							var label_text = this.textContent;
							var searchHit = searchRegex.exec(label_text);
							if (searchHit) {
								var range = document.createRange();
								var textnode = this.childNodes[0];
								range.selectNodeContents(textnode);
								range.setStart(textnode, searchHit.index);
								range.setEnd(textnode, searchHit.index + searchString.length);
								var underline_span = $('<span>').addClass('search-hit').css('text-decoration', 'underline')[0];
								range.surroundContents(underline_span);
								this.parentElement.style.display = 'block'; // un-hide
							}
						});
					} else {
						allCheckboxDivs.show();
						allHeaders.show();
					}
				}
			});

			if (!Twinkle.tag.canRemove) {
				var divElement = document.createElement('div');
				divElement.innerHTML = 'For removal of existing tags, please open Tag menu from the current version of article';
				form.append({
					type: 'div',
					name: 'untagnotice',
					label: divElement
				});
			}

			form.append({
				type: 'div',
				id: 'tagWorkArea',
				className: 'morebits-scrollbox',
				style: 'max-height: 28em'
			});

			form.append({
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
			Window.setTitle('File maintenance tagging');

			form.append({ type: 'header', label: 'License and sourcing problem tags' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.licenseList });

			form.append({ type: 'header', label: 'Wikimedia Commons-related tags' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.commonsList });

			form.append({ type: 'header', label: 'Cleanup tags' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.cleanupList });

			form.append({ type: 'header', label: 'Image quality tags' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.qualityList });

			form.append({ type: 'header', label: 'Replacement tags' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.replacementList });

			if (Twinkle.getFriendlyPref('customFileTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.getFriendlyPref('customFileTagList') });
			}
			break;

		case 'redirect':
			Window.setTitle('Redirect tagging');

			form.append({ type: 'header', label: 'Spelling, misspelling, tense and capitalization templates' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.spellingList });

			form.append({ type: 'header', label: 'Alternative name templates' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.alternativeList });

			form.append({ type: 'header', label: 'Miscellaneous and administrative redirect templates' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.administrativeList });

			if (Twinkle.getFriendlyPref('customRedirectTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.getFriendlyPref('customRedirectTagList') });
			}
			break;

		default:
			alert('Twinkle.tag: unknown mode ' + Twinkle.tag.mode);
			break;
	}

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	if (Twinkle.tag.mode === 'article') {

		result.quickfilter.focus();  // place cursor in the Quick filter field as soon as window is opened

		Twinkle.tag.alreadyPresentTags = [];

		if (Twinkle.tag.canRemove) {
			// Look for existing maintenance tags in the lead section and put them in array

			// All tags are HTML table elements that are direct children of .mw-parser-output,
			// except when they are within {{multiple issues}}
			$('.mw-parser-output').children().each(function parsehtml(i, e) {

				// break out on encountering the first heading, which means we are no
				// longer in the lead section
				if (e.tagName === 'H2') {
					return false;
				}

				// The ability to remove tags depends on the template's {{ambox}} |name=
				// parameter bearing the template's correct name (preferably) or a name that at
				// least redirects to the actual name

				// All tags have their first class name as "box-" + template name
				if (e.className.indexOf('box-') === 0) {
					if (e.classList[0] === 'box-Multiple_issues') {
						$(e).find('.ambox').each(function(idx, e) {
							var tag = e.classList[0].slice(4).replace(/_/g, ' ');
							Twinkle.tag.alreadyPresentTags.push(tag);
						});
						return true; // continue
					}

					var tag = e.classList[0].slice(4).replace(/_/g, ' ');
					Twinkle.tag.alreadyPresentTags.push(tag);
				}
			});

			// {{Uncategorized}} and {{Improve categories}} are usually placed at the end
			if ($('.box-Uncategorized').length) {
				Twinkle.tag.alreadyPresentTags.push('Uncategorized');
			}
			if ($('.box-Improve_categories').length) {
				Twinkle.tag.alreadyPresentTags.push('Improve categories');
			}

		}

		// Add status text node after Submit button
		var statusNode = document.createElement('small');
		statusNode.id = 'tw-tag-status';
		Twinkle.tag.status = {
			// initial state; defined like this because these need to be available for reference
			// in the click event handler
			numAdded: 0,
			numRemoved: 0
		};
		$(Window.buttons[0]).after(statusNode);

		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.sortorder.dispatchEvent(evt);

	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.quickForm.getElements(result, Twinkle.tag.mode + 'Tags').forEach(generateLinks);
	}
};

// Used in Quick Filter event function
var allCheckboxDivs, allHeaders;

Twinkle.tag.updateSortOrder = function(e) {
	var sortorder = e.target.value;
	Twinkle.tag.checkedTags = e.target.form.getChecked('articleTags') || [];

	var container = new Morebits.quickForm.element({ type: 'fragment' });

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function(tag, description) {
		var checkbox = { value: tag, label: '{{' + tag + '}}: ' + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		switch (tag) {
			case 'Cleanup':
				checkbox.subgroup = {
					name: 'cleanup',
					type: 'input',
					label: 'Specific reason why cleanup is needed: ',
					tooltip: 'Required.',
					size: 35
				};
				break;
			case 'Close paraphrasing':
				checkbox.subgroup = {
					name: 'closeParaphrasing',
					type: 'input',
					label: 'Source: ',
					tooltip: 'Source that has been closely paraphrased'
				};
				break;
			case 'Copy edit':
				checkbox.subgroup = {
					name: 'copyEdit',
					type: 'input',
					label: '"This article may require copy editing for..." ',
					tooltip: 'e.g. "consistent spelling". Optional.',
					size: 35
				};
				break;
			case 'Copypaste':
				checkbox.subgroup = {
					name: 'copypaste',
					type: 'input',
					label: 'Source URL: ',
					tooltip: 'If known.',
					size: 50
				};
				break;
			case 'Expand language':
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
				}
				];
				break;
			case 'Expert needed':
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
			case 'Globalize':
				checkbox.subgroup = {
					name: 'globalizeRegion',
					type: 'input',
					label: 'Over-represented country or region'
				};
				break;
			case 'History merge':
				checkbox.subgroup = [
					{
						name: 'histmergeOriginalPage',
						type: 'input',
						label: 'Other article: ',
						tooltip: 'Name of the page that should be merged into this one (required).'
					},
					{
						name: 'histmergeReason',
						type: 'input',
						label: 'Reason: ',
						tooltip: 'Short explanation describing the reason a history merge is needed. Should probably begin with "because" and end with a period.'
					},
					{
						name: 'histmergeSysopDetails',
						type: 'input',
						label: 'Extra details: ',
						tooltip: 'For complex cases, provide extra instructions for the reviewing administrator.'
					}
				];
				break;
			case 'Merge':
			case 'Merge from':
			case 'Merge to':
				var otherTagName = 'Merge';
				switch (tag) {
					case 'Merge from':
						otherTagName = 'Merge to';
						break;
					case 'Merge to':
						otherTagName = 'Merge from';
						break;
					// no default
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
							(tag === 'Merge to' ? 'the other article\'s' : 'this article\'s') + ' talk page):',
						tooltip: 'Optional, but strongly recommended. Leave blank if not wanted. Only available if a single article name is entered.'
					});
				}
				break;
			case 'Not English':
			case 'Rough translation':
				checkbox.subgroup = [
					{
						name: 'translationLanguage',
						type: 'input',
						label: 'Language of article (if known): ',
						tooltip: 'Consider looking at [[WP:LRC]] for help. If listing the article at PNT, please try to avoid leaving this box blank, unless you are completely unsure.'
					}
				];
				if (tag === 'Not English') {
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
				if (mw.config.get('wgNamespaceNumber') === 0) {
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
				}
				break;
			case 'Notability':
				checkbox.subgroup = {
					name: 'notability',
					type: 'select',
					list: [
						{ label: "{{notability}}: article's subject may not meet the general notability guideline", value: 'none' },
						{ label: '{{notability|Academics}}: notability guideline for academics', value: 'Academics' },
						{ label: '{{notability|Biographies}}: notability guideline for biographies', value: 'Biographies' },
						{ label: '{{notability|Books}}: notability guideline for books', value: 'Books' },
						{ label: '{{notability|Companies}}: notability guidelines for companies and organizations', value: 'Companies' },
						{ label: '{{notability|Events}}: notability guideline for events', value: 'Events' },
						{ label: '{{notability|Films}}: notability guideline for films', value: 'Films' },
						{ label: '{{notability|Places}}: notability guideline for places', value: 'Places' },
						{ label: '{{notability|Music}}: notability guideline for music', value: 'Music' },
						{ label: '{{notability|Neologisms}}: notability guideline for neologisms', value: 'Neologisms' },
						{ label: '{{notability|Numbers}}: notability guideline for numbers', value: 'Numbers' },
						{ label: '{{notability|Products}}: notability guideline for products and services', value: 'Products' },
						{ label: '{{notability|Sport}}: notability guideline for sports and athletics', value: 'Sport' },
						{ label: '{{notability|Television}}: notability guideline for television shows', value: 'Television' },
						{ label: '{{notability|Web}}: notability guideline for web content', value: 'Web' }
					]
				};
				break;
			default:
				break;
		}
		return checkbox;
	};

	var makeCheckboxesForAlreadyPresentTags = function() {
		container.append({ type: 'header', id: 'tagHeader0', label: 'Tags already present' });
		var subdiv = container.append({ type: 'div', id: 'tagSubdiv0' });
		var checkboxes = [];
		var unCheckedTags = e.target.form.getUnchecked('alreadyPresentArticleTags') || [];
		Twinkle.tag.alreadyPresentTags.forEach(function(tag) {
			var description = Twinkle.tag.article.tags[tag];
			var checkbox =
				{
					value: tag,
					label: '{{' + tag + '}}' + (description ? ': ' + description : ''),
					checked: unCheckedTags.indexOf(tag) === -1
					// , subgroup: { type: 'input', name: 'removeReason', label: 'Reason', tooltip: 'Enter reason for removing this tag' }
					// TODO: add option for providing reason for removal
				};

			checkboxes.push(checkbox);
		});
		subdiv.append({
			type: 'checkbox',
			name: 'alreadyPresentArticleTags',
			list: checkboxes
		});
	};

	if (sortorder === 'cat') { // categorical sort order
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, array) {
			var checkboxes = [];
			$.each(array, function(k, tag) {
				var description = Twinkle.tag.article.tags[tag];
				if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
					checkboxes.push(makeCheckbox(tag, description));
				}
			});
			subdiv.append({
				type: 'checkbox',
				name: 'articleTags',
				list: checkboxes
			});
		};

		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
		}
		var i = 1;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			container.append({ type: 'header', id: 'tagHeader' + i, label: title });
			var subdiv = container.append({ type: 'div', id: 'tagSubdiv' + i++ });
			if (Array.isArray(content)) {
				doCategoryCheckboxes(subdiv, content);
			} else {
				$.each(content, function(subtitle, subcontent) {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subtitle) ] });
					doCategoryCheckboxes(subdiv, subcontent);
				});
			}
		});
	} else { // alphabetical sort order
		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
			container.append({ type: 'header', id: 'tagHeader1', label: 'Available tags' });
		}
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
				checkboxes.push(makeCheckbox(tag, description));
			}
		});
		container.append({
			type: 'checkbox',
			name: 'articleTags',
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getFriendlyPref('customTagList').length) {
		container.append({ type: 'header', label: 'Custom tags' });
		container.append({ type: 'checkbox', name: 'articleTags',
			list: Twinkle.getFriendlyPref('customTagList').map(function(el) {
				el.checked = Twinkle.tag.checkedTags.indexOf(el.value) !== -1;
				return el;
			})
		});
	}

	var $workarea = $(e.target.form).find('div#tagWorkArea');
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// Used in quick filter event function
	allCheckboxDivs = $workarea.find('[name=articleTags], [name=alreadyPresentArticleTags]').parent();
	allHeaders = $workarea.find('h5, .quickformDescription');

	// clear search, because the search results are not preserved over mode change
	e.target.form.quickfilter.value = '';

	// style adjustments
	$workarea.find('h5').css({ 'font-size': '110%' });
	$workarea.find('h5:not(:first-child)').css({ 'margin-top': '1em' });
	$workarea.find('div').filter(':has(span.quickformDescription)').css({ 'margin-top': '0.4em' });

	Morebits.quickForm.getElements(e.target.form, 'articleTags').forEach(generateLinks);
	var alreadyPresentTags = Morebits.quickForm.getElements(e.target.form, 'alreadyPresentArticleTags');
	if (alreadyPresentTags) {
		alreadyPresentTags.forEach(generateLinks);
	}

	// tally tags added/removed, update statusNode text
	var statusNode = document.getElementById('tw-tag-status');
	$('[name=articleTags], [name=alreadyPresentArticleTags]').click(function() {
		if (this.name === 'articleTags') {
			if (this.checked) {
				Twinkle.tag.status.numAdded++;
			} else {
				Twinkle.tag.status.numAdded--;
			}
		} else if (this.name === 'alreadyPresentArticleTags') {
			if (this.checked) {
				Twinkle.tag.status.numRemoved--;
			} else {
				Twinkle.tag.status.numRemoved++;
			}
		}

		var firstPart = 'Adding ' + Twinkle.tag.status.numAdded + ' tag' + (Twinkle.tag.status.numAdded > 1 ? 's' : '');
		var secondPart = 'Removing ' + Twinkle.tag.status.numRemoved + ' tag' + (Twinkle.tag.status.numRemoved > 1 ? 's' : '');
		statusNode.textContent =
			(Twinkle.tag.status.numAdded ? '  ' + firstPart : '') +
			(Twinkle.tag.status.numRemoved ? (Twinkle.tag.status.numAdded ? '; ' : '  ') + secondPart : '');
	});
};

/**
 * Adds a link to each template's description page
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
var generateLinks = function(checkbox) {
	var link = Morebits.htmlNode('a', '>');
	link.setAttribute('class', 'tag-template-link');
	var tagname = checkbox.values;
	link.setAttribute('href', mw.util.getUrl(
		(tagname.indexOf(':') === -1 ? 'Template:' : '') +
		(tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))
	));
	link.setAttribute('target', '_blank');
	$(checkbox).parent().append(['\u00A0', link]);
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = {
	'Advert': 'written like an advertisement',
	'All plot': 'almost entirely a plot summary',
	'Autobiography': 'autobiography and may not be written neutrally',
	'BLP sources': 'BLP that needs additional sources for verification',
	'BLP unsourced': 'BLP that has no sources at all (use BLP PROD instead for new articles)',
	'Citation style': 'unclear or inconsistent citation style',
	'Cleanup': 'requires cleanup',
	'Cleanup bare URLs': 'uses bare URLs for references, which are prone to link rot',
	'Cleanup-PR': 'reads like a press release or news article',
	'Cleanup reorganize': "needs reorganization to comply with Wikipedia's layout guidelines",
	'Cleanup rewrite': "needs to be rewritten entirely to comply with Wikipedia's quality standards",
	'Cleanup tense': 'does not follow guidelines on use of different tenses.',
	'Close paraphrasing': 'contains close paraphrasing of a non-free copyrighted source',
	'COI': 'creator or major contributor may have a conflict of interest',
	'Condense': 'too many section headers dividing up content',
	'Confusing': 'confusing or unclear',
	'Context': 'insufficient context for those unfamiliar with the subject',
	'Copy edit': 'requires copy editing for grammar, style, cohesion, tone, or spelling',
	'Copypaste': 'appears to have been copied and pasted from another location',
	'Current': 'documents a current event',
	'Dead end': 'article has no links to other articles',
	'Disputed': 'questionable factual accuracy',
	'Essay-like': 'written like a personal reflection, personal essay, or argumentative essay',
	'Expand language': 'should be expanded with text translated from a foreign-language article',
	'Expert needed': 'needs attention from an expert on the subject',
	'External links': 'external links may not follow content policies or guidelines',
	'Fanpov': "written from a fan's point of view",
	'Fiction': 'fails to distinguish between fact and fiction',
	'Globalize': 'may not represent a worldwide view of the subject',
	'GOCEinuse': 'currently undergoing a major copy edit by the Guild of Copy Editors',
	'History merge': 'another page should be history merged into this one',
	'Hoax': 'may partially or completely be a hoax',
	'Improve categories': 'needs additional or more specific categories',
	'Incomprehensible': 'very hard to understand or incomprehensible',
	'In-universe': 'subject is fictional and needs rewriting to provide a non-fictional perspective',
	'In use': 'undergoing a major edit for a short while',
	'Lead missing': 'no lead section',
	'Lead rewrite': 'lead section needs to be rewritten to comply with guidelines',
	'Lead too long': 'lead section is too long for the length of the article',
	'Lead too short': 'lead section is too short and should be expanded to summarize key points',
	'Like resume': 'written like a resume',
	'Long plot': 'plot summary is too long or excessively detailed',
	'Manual': 'written like a manual or guidebook',
	'Merge': 'should be merged with another given article',
	'Merge from': 'another given article should be merged into this one',
	'Merge to': 'should be merged into another given article',
	'More citations needed': 'needs additional references or sources for verification',
	'More footnotes': 'has some references, but insufficient inline citations',
	'No footnotes': 'has references, but lacks inline citations',
	'No plot': 'needs a plot summary',
	'Non-free': 'may contain excessive or improper use of copyrighted materials',
	'Notability': 'subject may not meet the general notability guideline',
	'Not English': 'written in a language other than English and needs translation',
	'One source': 'relies largely or entirely on a single source',
	'Original research': 'contains original research',
	'Orphan': 'linked to from no other articles',
	'Over-coverage': 'extensive bias or disproportional coverage towards one or more specific regions',
	'Overlinked': 'too many duplicate and/or irrelevant links to other articles',
	'Overly detailed': 'excessive amount of intricate detail',
	'Over-quotation': 'too many or too-lengthy quotations for an encyclopedic entry',
	'Peacock': 'contains wording that promotes the subject in a subjective manner without adding information',
	'POV': 'does not maintain a neutral point of view',
	'Primary sources': 'relies too much on references to primary sources, and needs secondary sources',
	'Prose': 'written in a list format but may read better as prose',
	'Recentism': 'slanted towards recent events',
	'Rough translation': 'poor translation from another language',
	'Sections': 'needs to be divided into sections by topic',
	'Self-published': 'contains excessive or inappropriate references to self-published sources',
	'Sources exist': 'notable topic, sources are available that could be added to article',
	'Technical': 'too technical for most readers to understand',
	'Third-party': 'relies too heavily on sources too closely associated with the subject',
	'Tone': 'tone or style may not reflect the encyclopedic tone used on Wikipedia',
	'Too few opinions': 'may not include all significant viewpoints',
	'Uncategorized': 'not added to any categories',
	'Under construction': 'in the process of an expansion or major restructuring',
	'Underlinked': 'needs more wikilinks to other articles',
	'Undue weight': 'lends undue weight to certain ideas, incidents, or controversies',
	'Unfocused': 'lacks focus or is about more than one topic',
	'Unreferenced': 'does not cite any sources at all',
	'Unreliable sources': 'some references may not be reliable',
	'Undisclosed paid': 'may have been created or edited in return for undisclosed payments',
	'Update': 'needs additional up-to-date information added',
	'Very long': 'too long to read and navigate comfortably',
	'Weasel': 'neutrality or verifiability is compromised by the use of weasel words'
};

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = {
	'Cleanup and maintenance tags': {
		'General cleanup': [
			'Cleanup',  // has a subgroup with text input
			'Cleanup rewrite',
			'Copy edit'  // has a subgroup with text input
		],
		'Potentially unwanted content': [
			'Close paraphrasing',
			'Copypaste',  // has a subgroup with text input
			'External links',
			'Non-free'
		],
		'Structure, formatting, and lead section': [
			'Cleanup reorganize',
			'Condense',
			'Lead missing',
			'Lead rewrite',
			'Lead too long',
			'Lead too short',
			'Sections',
			'Very long'
		],
		'Fiction-related cleanup': [
			'All plot',
			'Fiction',
			'In-universe',
			'Long plot',
			'No plot'
		]
	},
	'General content issues': {
		'Importance and notability': [
			'Notability'  // has a subgroup with subcategories
		],
		'Style of writing': [
			'Advert',
			'Cleanup tense',
			'Essay-like',
			'Fanpov',
			'Like resume',
			'Manual',
			'Cleanup-PR',
			'Over-quotation',
			'Prose',
			'Technical',
			'Tone'
		],
		'Sense (or lack thereof)': [
			'Confusing',
			'Incomprehensible',
			'Unfocused'
		],
		'Information and detail': [
			'Context',
			'Expert needed',
			'Overly detailed',
			'Undue weight'
		],
		'Timeliness': [
			'Current',
			'Update'
		],
		'Neutrality, bias, and factual accuracy': [
			'Autobiography',
			'COI',
			'Disputed',
			'Hoax',
			'Globalize',
			'Over-coverage',
			'Peacock',
			'POV',
			'Recentism',
			'Too few opinions',
			'Undisclosed paid',
			'Weasel'
		],
		'Verifiability and sources': [
			'BLP sources',
			'BLP unsourced',
			'More citations needed',
			'One source',
			'Original research',
			'Primary sources',
			'Self-published',
			'Sources exist',
			'Third-party',
			'Unreferenced',
			'Unreliable sources'
		]
	},
	'Specific content issues': {
		'Language': [
			'Not English',  // has a subgroup with several options
			'Rough translation',  // has a subgroup with several options
			'Expand language'
		],
		'Links': [
			'Dead end',
			'Orphan',
			'Overlinked',
			'Underlinked'
		],
		'Referencing technique': [
			'Citation style',
			'Cleanup bare URLs',
			'More footnotes',
			'No footnotes'
		],
		'Categories': [
			'Improve categories',
			'Uncategorized'
		]
	},
	'Merging': [
		'History merge',
		'Merge',   // these three have a subgroup with several options
		'Merge from',
		'Merge to'
	],
	'Informational': [
		'GOCEinuse',
		'In use',
		'Under construction'
	]
};

// Contains those article tags that *do not* work inside {{multiple issues}}.
Twinkle.tag.multipleIssuesExceptions = [
	'Copypaste',
	'Expand language',
	'GOCEinuse',
	'History merge',
	'Improve categories',
	'In use',
	'Merge',
	'Merge from',
	'Merge to',
	'Not English',
	'Rough translation',
	'Uncategorized',
	'Under construction'
];

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
		subgroup: [
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
	{
		label: '{{Do not move to Commons}} (other reason)',
		value: 'Do not move to Commons_reason',
		subgroup: {
			type: 'input',
			name: 'DoNotMoveToCommons',
			label: 'Reason: ',
			tooltip: 'Enter the reason why this image should not be moved to Commons (required)'
		}
	},
	{
		label: '{{Keep local}}: request to keep local copy of a Commons file',
		value: 'Keep local',
		subgroup: {
			type: 'input',
			name: 'keeplocalName',
			label: 'Commons image name if different: ',
			tooltip: 'Name of the image on Commons (if different from local name), excluding the File: prefix:'
		}
	},
	{
		label: '{{Now Commons}}: file has been copied to Commons',
		value: 'subst:ncd',
		subgroup: {
			type: 'input',
			name: 'ncdName',
			label: 'Commons image name if different: ',
			tooltip: 'Name of the image on Commons (if different from local name), excluding the File: prefix:'
		}
	}
];

Twinkle.tag.file.cleanupList = [
	{ label: '{{Artifacts}}: PNG contains residual compression artifacts', value: 'Artifacts' },
	{ label: '{{Bad font}}: SVG uses fonts not available on the thumbnail server', value: 'Bad font' },
	{ label: '{{Bad format}}: PDF/DOC/... file should be converted to a more useful format', value: 'Bad format' },
	{ label: '{{Bad GIF}}: GIF that should be PNG, JPEG, or SVG', value: 'Bad GIF' },
	{ label: '{{Bad JPEG}}: JPEG that should be PNG or SVG', value: 'Bad JPEG' },
	{ label: '{{Bad trace}}: auto-traced SVG requiring cleanup', value: 'Bad trace' },
	{
		label: '{{Cleanup image}}: general cleanup', value: 'Cleanup image',
		subgroup: {
			type: 'input',
			name: 'cleanupimageReason',
			label: 'Reason: ',
			tooltip: 'Enter the reason for cleanup (required)'
		}
	},
	{ label: '{{ClearType}}: image (not screenshot) with ClearType anti-aliasing', value: 'ClearType' },
	{ label: '{{Imagewatermark}}: image contains visible or invisible watermarking', value: 'Imagewatermark' },
	{ label: '{{NoCoins}}: image using coins to indicate scale', value: 'NoCoins' },
	{ label: '{{Overcompressed JPEG}}: JPEG with high levels of artifacts', value: 'Overcompressed JPEG' },
	{ label: '{{Opaque}}: opaque background should be transparent', value: 'Opaque' },
	{ label: '{{Remove border}}: unneeded border, white space, etc.', value: 'Remove border' },
	{
		label: '{{Rename media}}: file should be renamed according to the criteria at [[WP:FMV]]',
		value: 'Rename media',
		subgroup: [
			{
				type: 'input',
				name: 'renamemediaNewname',
				label: 'New name: ',
				tooltip: 'Enter the new name for the image (optional)'
			},
			{
				type: 'input',
				name: 'renamemediaReason',
				label: 'Reason: ',
				tooltip: 'Enter the reason for the rename (optional)'
			}
		]
	},
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
	{
		label: '{{Image-Poor-Quality}}', value: 'Image-Poor-Quality',
		subgroup: {
			type: 'input',
			name: 'ImagePoorQualityReason',
			label: 'Reason: ',
			tooltip: 'Enter the reason why this image is so bad (required)'
		}
	},
	{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
	{
		label: '{{Low quality chem}}: disputed chemical structures', value: 'Low quality chem',
		subgroup: {
			type: 'input',
			name: 'lowQualityChemReason',
			label: 'Reason: ',
			tooltip: 'Enter the reason why the diagram is disputed (required)'
		}
	}
];

Twinkle.tag.file.replacementList = [
	{ label: '{{Duplicate}}: exact duplicate of another file, but not yet orphaned', value: 'Duplicate' },
	{ label: '{{Obsolete}}: improved version available', value: 'Obsolete' },
	{ label: '{{PNG version available}}', value: 'PNG version available' },
	{ label: '{{Vector version available}}', value: 'Vector version available' }
];
Twinkle.tag.file.replacementList.forEach(function(el) {
	el.subgroup = {
		type: 'input',
		label: 'Replacement file: ',
		tooltip: 'Enter the name of the file which replaces this one (required)',
		name: el.value.replace(/ /g, '_') + 'File'
	};
});


Twinkle.tag.callbacks = {
	article: function articleCallback(pageobj) {

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
		var summaryText;
		var params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		var postRemoval = function() {

			if (params.tagsToRemove.length) {
				// Finish summary text
				summaryText += ' tag' + (params.tagsToRemove.length > 1 ? 's' : '') + ' from article';

				// Remove empty {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(multiple ?issues|article ?issues|mi)\s*\|\s*\}\}\n?/im, '');
				// Remove single-element {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(?:multiple ?issues|article ?issues|mi)\s*\|\s*(\{\{[^}]+\}\})\s*\}\}/im, '$1');
			}

			// avoid truncated summaries
			if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
			pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(function() {
				// special functions for merge tags
				if (params.mergeReason) {
					// Use same language for talkpage header and edit summary
					var direction = 'Proposing to merge [[:' + params.nonDiscussArticle + ']] ' + (params.mergeTag === 'Merge' ? 'with' : 'into') + ' [[:' + params.discussArticle + ']]';
					// post the rationale on the talk page (only operates in main namespace)
					var talkpageText = '\n\n== ' + direction + '  ==\n\n';
					talkpageText += params.mergeReason.trim() + ' ~~~~';

					var talkpage = new Morebits.wiki.page('Talk:' + params.discussArticle, 'Posting rationale on talk page');
					talkpage.setAppendText(talkpageText);
					talkpage.setEditSummary(direction + Twinkle.getPref('summaryAd'));
					talkpage.setWatchlist(Twinkle.getFriendlyPref('watchMergeDiscussions'));
					talkpage.setCreateOption('recreate');
					talkpage.append();
				}
				if (params.mergeTagOther) {
					// tag the target page if requested
					var otherTagName = 'Merge';
					if (params.mergeTag === 'Merge from') {
						otherTagName = 'Merge to';
					} else if (params.mergeTag === 'Merge to') {
						otherTagName = 'Merge from';
					}
					var newParams = {
						tags: [otherTagName],
						tagsToRemove: [],
						tagsToRemain: [],
						mergeTarget: Morebits.pageNameNorm,
						discussArticle: params.discussArticle,
						talkDiscussionTitle: params.talkDiscussionTitle
					};
					var otherpage = new Morebits.wiki.page(params.mergeTarget, 'Tagging other page (' +
						params.mergeTarget + ')');
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
				}

				// post at WP:PNT for {{not English}} and {{rough translation}} tag
				if (params.translationPostAtPNT) {
					var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
						'Listing article at Wikipedia:Pages needing translation into English');
					pntPage.setFollowRedirect(true);
					pntPage.setCallbackParameters({
						template: params.tags.indexOf('Rough translation') !== -1 ? 'duflu' : 'needtrans',
						lang: params.translationLanguage,
						reason: params.translationComments
					});
					pntPage.load(function friendlytagCallbacksTranslationListPage(pageobj) {
						var old_text = pageobj.getPageText();
						var params = pageobj.getCallbackParameters();
						var statelem = pageobj.getStatusElement();

						var templateText = '{{subst:' + params.template + '|pg=' + Morebits.pageNameNorm + '|Language=' +
							(params.lang || 'uncertain') + '|Comments=' + params.reason.trim() + '}} ~~~~';

						var text, summary;
						if (params.template === 'duflu') {
							text = old_text + '\n\n' + templateText;
							summary = 'Translation cleanup requested on ';
						} else {
							text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
								'\n\n' + templateText + '\n\n$1');
							summary = 'Translation' + (params.lang ? ' from ' + params.lang : '') + ' requested on ';
						}

						if (text === old_text) {
							statelem.error('failed to find target spot for the discussion');
							return;
						}
						pageobj.setPageText(text);
						pageobj.setEditSummary(summary + ' [[:' + Morebits.pageNameNorm + ']]' + Twinkle.getPref('summaryAd'));
						pageobj.setCreateOption('recreate');
						pageobj.save();
					});
				}
				if (params.translationNotify) {
					pageobj.lookupCreation(function(innerPageobj) {
						var initialContrib = innerPageobj.getCreator();

						// Disallow warning yourself
						if (initialContrib === mw.config.get('wgUserName')) {
							innerPageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
							return;
						}

						var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
							'Notifying initial contributor (' + initialContrib + ')');
						var notifytext = '\n\n== Your article [[' + Morebits.pageNameNorm + ']]==\n' +
							'{{subst:uw-notenglish|1=' + Morebits.pageNameNorm +
							(params.translationPostAtPNT ? '' : '|nopnt=yes') + '}} ~~~~';
						userTalkPage.setAppendText(notifytext);
						userTalkPage.setEditSummary('Notice: Please use English when contributing to the English Wikipedia.' +
							Twinkle.getPref('summaryAd'));
						userTalkPage.setCreateOption('recreate');
						userTalkPage.setFollowRedirect(true);
						userTalkPage.append();
					});
				}
			});

			if (params.patrol) {
				pageobj.patrol();
			}
		};

		/**
		 * Removes the existing tags that were deselected (if any)
		 * Calls postRemoval() when done
		 */
		var removeTags = function removeTags() {

			if (params.tagsToRemove.length === 0) {
				// finish summary text from adding of tags, in this case where there are
				// no tags to be removed
				summaryText += ' tag' + (tags.length > 1 ? 's' : '') + ' to article';

				postRemoval();
				return;
			}

			Morebits.status.info('Info', 'Removing deselected tags that were already present');

			if (params.tags.length > 0) {
				summaryText += (tags.length ? ' tag' + (tags.length > 1 ? 's' : '') : '') + ', and removed';
			} else {
				summaryText = 'Removed';
			}

			var getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach(function removeTag(tag, tagIndex) {
				var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');

				if (tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}

				// Producing summary text for current tag removal
				if (tagIndex > 0) {
					if (tagIndex === (params.tagsToRemove.length - 1)) {
						summaryText += ' and';
					} else if (tagIndex < (params.tagsToRemove.length - 1)) {
						summaryText += ',';
					}
				}
				summaryText += ' {{[[Template:' + tag + '|' + tag + ']]}}';
			});

			if (!getRedirectsFor.length) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			var api = new Morebits.wiki.api('Getting template redirects', {
				'action': 'query',
				'prop': 'linkshere',
				'titles': getRedirectsFor.join('|'),
				'redirects': 1,  // follow redirect if the class name turns out to be a redirect page
				'lhnamespace': '10',  // template namespace only
				'lhshow': 'redirect',
				'lhlimit': 'max'
			}, function removeRedirectTag(apiobj) {

				$(apiobj.responseXML).find('page').each(function(idx, page) {
					var removed = false;
					$(page).find('lh').each(function(idx, el) {
						var tag = $(el).attr('title').slice(9);
						var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
						if (tag_re.test(pageText)) {
							pageText = pageText.replace(tag_re, '');
							removed = true;
							return false;   // break out of $.each
						}
					});
					if (!removed) {
						Morebits.status.warn('Info', 'Failed to find {{' +
						$(page).attr('title').slice(9) + '}} on the page... excluding');
					}

				});

				postRemoval();

			});
			api.post();

		};

		if (!params.tags.length) {
			removeTags();
			return;
		}

		// Executes first: addition of selected tags
		summaryText = 'Added';
		var tagRe, tagText = '', tags = [], groupableTags = [], groupableExistingTags = [], totalTags;

		/**
		 * Updates `tagText` with the syntax of `tagName` template with its parameters
		 * @param {number} tagIndex
		 * @param {string} tagName
		 */
		var addTag = function articleAddTag(tagIndex, tagName) {
			var currentTag = '';
			if (tagName === 'Uncategorized' || tagName === 'Improve categories') {
				pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				currentTag += '{{' + tagName;
				// fill in other parameters, based on the tag
				switch (tagName) {
					case 'Cleanup':
						currentTag += '|reason=' + params.cleanup;
						break;
					case 'Close paraphrasing':
						currentTag += '|source=' + params.closeParaphrasing;
						break;
					case 'Copy edit':
						if (params.copyEdit) {
							currentTag += '|for=' + params.copyEdit;
						}
						break;
					case 'Copypaste':
						if (params.copypaste) {
							currentTag += '|url=' + params.copypaste;
						}
						break;
					case 'Expand language':
						currentTag += '|topic=';
						currentTag += '|langcode=' + params.expandLanguageLangCode;
						if (params.expandLanguageArticle !== null) {
							currentTag += '|otherarticle=' + params.expandLanguageArticle;
						}
						break;
					case 'Expert needed':
						if (params.expertNeeded) {
							currentTag += '|1=' + params.expertNeeded;
						}
						if (params.expertNeededTalk) {
							currentTag += '|talk=' + params.expertNeededTalk;
						}
						if (params.expertNeededReason) {
							currentTag += '|reason=' + params.expertNeededReason;
						}
						break;
					case 'Globalize':
						currentTag += '|1=article';
						if (params.globalizeRegion) {
							currentTag += '|2=' + params.globalizeRegion;
						}
						break;
					case 'News release':
						currentTag += '|1=article';
						break;
					case 'Notability':
						if (params.notability !== 'none') {
							currentTag += '|' + params.notability;
						}
						break;
					case 'Not English':
					case 'Rough translation':
						if (params.translationLanguage) {
							currentTag += '|1=' + params.translationLanguage;
						}
						if (params.translationPostAtPNT) {
							currentTag += '|listed=yes';
						}
						break;
					case 'History merge':
						currentTag += '|originalpage=' + params.histmergeOriginalPage;
						if (params.histmergeReason) {
							currentTag += '|reason=' + params.histmergeReason;
						}
						if (params.histmergeSysopDetails) {
							currentTag += '|details=' + params.histmergeSysopDetails;
						}
						break;
					case 'Merge':
					case 'Merge to':
					case 'Merge from':
						params.mergeTag = tagName;
						if (params.mergeTarget) {
							// normalize the merge target for now and later
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

							currentTag += '|' + params.mergeTarget;

							// link to the correct section on the talk page, for article space only
							if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle = tagName === 'Merge to' ? params.mergeTarget : mw.config.get('wgTitle');
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle = tagName === 'Merge to' ? mw.config.get('wgTitle') : params.mergeTarget;
									params.talkDiscussionTitle = 'Proposed merge with ' + params.nonDiscussArticle;
								}
								currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
							}
						}
						break;
					default:
						break;
				}

				currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}

			if (tagIndex > 0) {
				if (tagIndex === (totalTags - 1)) {
					summaryText += ' and';
				} else if (tagIndex < (totalTags - 1)) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[';
			// if it is a custom tag with a parameter
			if (tagName.indexOf('|') !== -1) {
				tagName = tagName.slice(0, tagName.indexOf('|'));
			}
			summaryText += tagName.indexOf(':') !== -1 ? tagName : 'Template:' + tagName + '|' + tagName;
			summaryText += ']]}}';

		};

		/**
		 * Adds the tags which go outside {{multiple issues}}, either because
		 * these tags aren't supported in {{multiple issues}} or because
		 * {{multiple issues}} is not being added to the page at all
		 */
		var addUngroupedTags = function() {
			totalTags = tags.length;
			$.each(tags, addTag);

			// Smartly insert the new tags after any hatnotes or
			// afd, csd, or prod templates or hatnotes. Regex is
			// extra complicated to allow for templates with
			// parameters and to handle whitespace properly.
			pageText = pageText.replace(
				new RegExp(
					// leading whitespace
					'^\\s*' +
					// capture template(s)
					'(?:((?:\\s*' +
					// AfD is special, as the tag includes html comments before and after the actual template
					'(?:<!--.*AfD.*\\n\\{\\{(?:Article for deletion\\/dated|AfDM).*\\}\\}\\n<!--.*(?:\\n<!--.*)?AfD.*(?:\\s*\\n))?|' + // trailing whitespace/newline needed since this subst's a newline
					// begin template format
					'\\{\\{\\s*(?:' +
					// CSD
					'db|delete|db-.*?|speedy deletion-.*?|' +
					// PROD
					'(?:proposed deletion|prod blp)\\/dated(?:\\s*\\|(?:concern|user|timestamp|help).*)+|' +
					// various hatnote templates
					'about|correct title|dablink|distinguish|for|other\\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\\s?(?:also|wiktionary)|selfref|short description|the' +
					// not a hatnote, but sometimes under a CSD or AfD
					'|salt|proposed deletion endorsed' +
					// end main template name, optionally with a number (such as redirect2)
					')\\d*\\s*' +
					// template parameters
					'(\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?' +
					// end template format
					'\\}\\})+' +
					// end capture
					'(?:\\s*\\n)?)' +
					// trailing whitespace
					'\\s*)?',
					'i'), '$1' + tagText
			);

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach(function(tag) {
			tagRe = new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
			// regex check for preexistence of tag can be skipped if in canRemove mode
			if (Twinkle.tag.canRemove || !tagRe.exec(pageText)) {
				// condition Twinkle.tag.article.tags[tag] to ensure that its not a custom tag
				// Custom tags are assumed non-groupable, since we don't know whether MI template supports them
				if (Twinkle.tag.article.tags[tag] && Twinkle.tag.multipleIssuesExceptions.indexOf(tag) === -1) {
					groupableTags.push(tag);
				} else {
					tags.push(tag);
				}
			} else {
				if (tag === 'Merge from' || tag === 'History merge') {
					tags.push(tag);
				} else {
					Morebits.status.warn('Info', 'Found {{' + tag +
						'}} on the article already...excluding');
					// don't do anything else with merge tags
					if (['Merge', 'Merge to'].indexOf(tag) !== -1) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		// To-be-retained existing tags that are groupable
		params.tagsToRemain.forEach(function(tag) {
			if (Twinkle.tag.multipleIssuesExceptions.indexOf(tag) === -1) {
				groupableExistingTags.push(tag);
			}
		});

		var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

		if (miTest && groupableTags.length > 0) {
			Morebits.status.info('Info', 'Adding supported tags inside existing {{multiple issues}} tag');

			tagText = '';

			totalTags = groupableTags.length;
			$.each(groupableTags, addTag);

			summaryText += ' tag' + (groupableTags.length > 1 ? 's' : '') + ' (within {{[[Template:multiple issues|multiple issues]]}})';
			if (tags.length > 0) {
				summaryText += ', and';
			}

			var miRegex = new RegExp('(\\{\\{\\s*' + miTest[1] + '\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*', 'im');
			pageText = pageText.replace(miRegex, '$1' + tagText + '}}\n');
			tagText = '';

			addUngroupedTags();

		} else if (params.group && !miTest && (groupableExistingTags.length + groupableTags.length) >= 2) {
			Morebits.status.info('Info', 'Grouping supported tags inside {{multiple issues}}');

			tagText += '{{Multiple issues|\n';

			/**
			 * Adds newly added tags to MI
			 */
			var addNewTagsToMI = function() {
				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);
				if (groupableTags.length) {
					summaryText += ' tags (within {{[[Template:multiple issues|multiple issues]]}})';
				} else {
					summaryText += ' {{[[Template:multiple issues|multiple issues]]}}';
				}
				if (tags.length > 0) {
					summaryText += ', and';
				}
				tagText += '}}\n';

				addUngroupedTags();
			};


			var getRedirectsFor = [];

			// Reposition the tags on the page into {{multiple issues}}, if found with its
			// proper name, else moves it to `getRedirectsFor` array to be handled later
			groupableExistingTags.forEach(function repositionTagIntoMI(tag) {
				var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?)');
				if (tag_re.test(pageText)) {
					tagText += tag_re.exec(pageText)[1];
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				addNewTagsToMI();
				return;
			}

			var api = new Morebits.wiki.api('Getting template redirects', {
				'action': 'query',
				'prop': 'linkshere',
				'titles': getRedirectsFor.join('|'),
				'redirects': 1,
				'lhnamespace': '10', // template namespace only
				'lhshow': 'redirect',
				'lhlimit': 'max'
			}, function replaceRedirectTag(apiobj) {
				$(apiobj.responseXML).find('page').each(function(idx, page) {
					var found = false;
					$(page).find('lh').each(function(idx, el) {
						var tag = $(el).attr('title').slice(9);
						var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?)');
						if (tag_re.test(pageText)) {
							tagText += tag_re.exec(pageText)[1];
							pageText = pageText.replace(tag_re, '');
							found = true;
							return false;   // break out of $.each
						}
					});
					if (!found) {
						Morebits.status.warn('Info', 'Failed to find the existing {{' +
						$(page).attr('title').slice(9) + '}} on the page... skip repositioning');
					}
				});
				addNewTagsToMI();
			});
			api.post();

		} else {
			tags = tags.concat(groupableTags);
			addUngroupedTags();
		}

	},

	redirect: function redirect(pageobj) {
		var params = pageobj.getCallbackParameters(),
			pageText = pageobj.getPageText(),
			tagRe, tagText = '', summaryText = 'Added',
			tags = [], i;

		for (i = 0; i < params.tags.length; i++) {
			tagRe = new RegExp('(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im');
			if (!tagRe.exec(pageText)) {
				tags.push(params.tags[i]);
			} else {
				Morebits.status.warn('Info', 'Found {{' + params.tags[i] +
					'}} on the redirect already...excluding');
			}
		}

		var addTag = function redirectAddTag(tagIndex, tagName) {
			tagText += '\n{{' + tagName;
			if (tagName === 'R from alternative language') {
				if (params.altLangFrom) {
					tagText += '|from=' + params.altLangFrom;
				}
				if (params.altLangTo) {
					tagText += '|to=' + params.altLangTo;
				}
			}
			tagText += '}}';

			if (tagIndex > 0) {
				if (tagIndex === (tags.length - 1)) {
					summaryText += ' and';
				} else if (tagIndex < (tags.length - 1)) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[:' + (tagName.indexOf(':') !== -1 ? tagName : 'Template:' + tagName + '|' + tagName) + ']]}}';
		};

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
			// Regex courtesy [[User:Kephir/gadgets/sagittarius.js]] at [[Special:PermaLink/831402893]]
			var oldTags = pageText.match(/(\s*{{[A-Za-z ]+\|)((?:[^|{}]*|{{[^|}]*}})+)(}})\s*/i);
			pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			var pageTags = pageText.match(/\n{{R(?:edirect)? .*?}}/img);
			var oldPageTags = '';
			if (pageTags) {
				pageTags.forEach(function(pageTag) {
					var pageRe = new RegExp(pageTag, 'img');
					pageText = pageText.replace(pageRe, '');
					oldPageTags += pageTag;
				});
			}
			pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
		}

		summaryText += (tags.length > 0 ? ' tag' + (tags.length > 1 ? 's' : '') : '') + ' to redirect';

		// avoid truncated summaries
		if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.patrol();
		}

	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = 'Adding ';

		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = '', currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (['Keep local', 'subst:ncd', 'Do not move to Commons_reason', 'Do not move to Commons',
					'Now Commons'].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}

				currentTag = '{{' + (tag === 'Do not move to Commons_reason' ? 'Do not move to Commons' : tag);

				switch (tag) {
					case 'subst:ncd':
						if (params.ncdName !== '') {
							currentTag += '|1=' + params.ncdName;
						}
						break;
					case 'Keep local':
						if (params.keeplocalName !== '') {
							currentTag += '|1=' + params.keeplocalName;
						}
						break;
					case 'Rename media':
						if (params.renamemediaNewname !== '') {
							currentTag += '|1=' + params.renamemediaNewname;
						}
						if (params.renamemediaReason !== '') {
							currentTag += '|2=' + params.renamemediaReason;
						}
						break;
					case 'Cleanup image':
						currentTag += '|1=' + params.cleanupimageReason;
						break;
					case 'Image-Poor-Quality':
						currentTag += '|1=' + params.ImagePoorQualityReason;
						break;
					case 'Low quality chem':
						currentTag += '|1=' + params.lowQualityChemReason;
						break;
					case 'Vector version available':
						text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, '');
						/* falls through */
					case 'PNG version available':
						/* falls through */
					case 'Obsolete':
						/* falls through */
					case 'Duplicate':
						currentTag += '|1=' + params[tag.replace(/ /g, '_') + 'File'];
						break;
					case 'Do not move to Commons_reason':
						currentTag += '|reason=' + params.DoNotMoveToCommons;
						break;
					case 'subst:orfurrev':
						// remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
						currentTag += '|date={{subst:date}}';
						break;
					case 'Copy to Commons':
						currentTag += '|human=' + mw.config.get('wgUserName');
						break;
					case 'Should be SVG':
						currentTag += '|' + params.svgCategory;
						break;
					default:
						break;  // don't care
				}

				currentTag += '}}\n';

				tagtext += currentTag;
				summary += '{{' + tag + '}}, ';
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn('User canceled operation; nothing to do');
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

		if (params.patrol) {
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

	params.tags = form.getChecked(Twinkle.tag.mode + 'Tags');

	// Save values of input fields into params object. This works as quickform input
	// fields within subgroups of elements with name 'articleTags' (say) have their
	// name attribute as 'articleTags.' + name of the subgroup element

	var name_prefix = Twinkle.tag.mode + 'Tags.';
	$(form).find("[name^='" + name_prefix + "']:not(div)").each(function(idx, el) {
		// el are the HTMLInputElements, el.name gives the name attribute
		params[el.name.slice(name_prefix.length)] =
			el.type === 'checkbox' ? form[el.name].checked : form[el.name].value;
	});

	switch (Twinkle.tag.mode) {
		case 'article':
			params.tagsToRemove = form.getUnchecked('alreadyPresentArticleTags') || [];
			params.tagsToRemain = form.getChecked('alreadyPresentArticleTags') || [];

			params.group = form.group.checked;

			// Validation
			if ((params.tags.indexOf('Merge') !== -1) || (params.tags.indexOf('Merge from') !== -1) ||
				(params.tags.indexOf('Merge to') !== -1)) {
				if (((params.tags.indexOf('Merge') !== -1) + (params.tags.indexOf('Merge from') !== -1) +
					(params.tags.indexOf('Merge to') !== -1)) > 1) {
					alert('Please select only one of {{merge}}, {{merge from}}, and {{merge to}}. If several merges are required, use {{merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).');
					return;
				}
				if (!params.mergeTarget) {
					alert('Please specify the title of the other article for use in the merge template.');
					return;
				}
				if ((params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1) {
					alert('Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.');
					return;
				}
			}
			if ((params.tags.indexOf('Not English') !== -1) && (params.tags.indexOf('Rough translation') !== -1)) {
				alert('Please select only one of {{not English}} and {{rough translation}}.');
				return;
			}
			if (params.tags.indexOf('History merge') !== -1 && params.histmergeOriginalPage.trim() === '') {
				alert('You must specify a page to be merged for the {{history merge}} tag.');
				return;
			}
			if (params.tags.indexOf('Cleanup') !== -1 && params.cleanup.trim() === '') {
				alert('You must specify a reason for the {{cleanup}} tag.');
				return;
			}
			if (params.tags.indexOf('Expand language') !== -1 && params.expandLanguageLangCode.trim() === '') {
				alert('You must specify language code for the {{expand language}} tag.');
				return;
			}
			break;

		case 'file':

			if (params.tags.indexOf('Cleanup image') !== -1 && params.cleanupimageReason === '') {
				alert('You must specify a reason for the cleanup tag.');
				return;
			}
			if (params.tags.indexOf('Image-Poor-Quality') !== -1 && params.ImagePoorQualityReason === '') {
				alert('You must specify a reason for the {{Image-Poor-Quality}} tag');
				return;
			}
			if (params.tags.indexOf('Low Quality Chem') !== -1 && params.lowQualityChemReason === '') {
				alert('You must specify a reason for the {{Low Quality Chem}} tag');
				return;
			}
			if ((params.tags.indexOf('Duplicate') !== -1 && params.DuplicateFile === '') ||
				(params.tags.indexOf('Obsolete') !== -1 && params.ObsoleteFile === '') ||
				(params.tags.indexOf('PNG version available') !== -1 && params.PNG_version_availableFile === '') ||
				(params.tags.indexOf('Vector version available') !== -1 && params.Vector_version_availableFile === '')
			) {
				alert('You must specify the replacement file name for a tag in the Replacement tags list');
				return;
			}
			if (params.tags.indexOf('Do not move to Commons_reason') !== -1 && params.DoNotMoveToCommons === '') {
				alert('You must specify a reason for the {{Do not move to Commons}} tag');
				return;
			}
			break;

		case 'redirect':
			break;

		default:
			alert('Twinkle.tag: unknown mode ' + Twinkle.tag.mode);
			break;
	}

	// File/redirect: return if no tags selected
	// Article: return if no tag is selected and no already present tag is deselected
	if (params.tags.length === 0 && (Twinkle.tag.mode !== 'article' || params.tagsToRemove.length === 0)) {
		alert('You must select at least one tag!');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = 'Tagging complete, reloading article in a few seconds';
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Tagging ' + Twinkle.tag.mode);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);

};

})(jQuery);
// </nowiki>
