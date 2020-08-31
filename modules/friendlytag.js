// <nowiki>

(function($) {


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles and drafts; file pages with a corresponding file
 *                         which is local (not on Commons); all redirects
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

	form.append({
		type: 'input',
		label: 'Filter tag list: ',
		name: 'quickfilter',
		size: '30px',
		event: function twinkletagquickfilter() {
			// flush the DOM of all existing underline spans
			$allCheckboxDivs.find('.search-hit').each(function(i, e) {
				var label_element = e.parentElement;
				// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
				// to <label>Hello world</label>
				label_element.innerHTML = label_element.textContent;
			});

			if (this.value) {
				$allCheckboxDivs.hide();
				$allHeaders.hide();
				var searchString = this.value;
				var searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');

				$allCheckboxDivs.find('label').each(function () {
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
						this.parentElement.style.display = 'block'; // show
					}
				});
			} else {
				$allCheckboxDivs.show();
				$allHeaders.show();
			}
		}
	});

	switch (Twinkle.tag.mode) {
		case 'article':
			Window.setTitle('Article maintenance tagging');


			// Build sorting and lookup object flatObject, which is always
			// needed but also used to generate the alphabetical list
			// Would be infinitely better with Object.values, but, alas, IE 11
			Twinkle.tag.article.flatObject = {};
			Object.keys(Twinkle.tag.article.tagList).forEach(function(group) {
				Object.keys(Twinkle.tag.article.tagList[group]).forEach(function(subgroup) {
					if (Array.isArray(Twinkle.tag.article.tagList[group][subgroup])) {
						Twinkle.tag.article.tagList[group][subgroup].forEach(function(item) {
							Twinkle.tag.article.flatObject[item.tag] = { description: item.description, excludeMI: !!item.excludeMI };
						});
					} else {
						Twinkle.tag.article.flatObject[Twinkle.tag.article.tagList[group][subgroup].tag] = {description: Twinkle.tag.article.tagList[group][subgroup].description, excludeMI: !!Twinkle.tag.article.tagList[group][subgroup].excludeMI };
					}
				});
			});


			form.append({
				type: 'select',
				name: 'sortorder',
				label: 'View this list:',
				tooltip: 'You can change the default view order in your Twinkle preferences (WP:TWPREFS).',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'By categories', selected: Twinkle.getPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'In alphabetical order', selected: Twinkle.getPref('tagArticleSortOrder') === 'alpha' }
				]
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
						checked: Twinkle.getPref('groupByDefault')
					}
				]
			});

			form.append({
				type: 'input',
				label: 'Reason',
				name: 'reason',
				tooltip: 'Optional reason to be appended in edit summary. Recommended when removing tags.',
				size: '60px'
			});

			break;

		case 'file':
			Window.setTitle('File maintenance tagging');

			$.each(Twinkle.tag.fileList, function(groupName, group) {
				form.append({ type: 'header', label: groupName });
				form.append({ type: 'checkbox', name: 'tags', list: group });
			});

			if (Twinkle.getPref('customFileTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customFileTagList') });
			}
			break;

		case 'redirect':
			Window.setTitle('Redirect tagging');

			var i = 1;
			$.each(Twinkle.tag.redirectList, function(groupName, group) {
				form.append({ type: 'header', id: 'tagHeader' + i, label: groupName });
				var subdiv = form.append({ type: 'div', id: 'tagSubdiv' + i++ });
				$.each(group, function(subgroupName, subgroup) {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subgroupName) ] });
					subdiv.append({
						type: 'checkbox',
						name: 'tags',
						list: subgroup.map(function (item) {
							return { value: item.tag, label: '{{' + item.tag + '}}: ' + item.description, subgroup: item.subgroup };
						})
					});
				});
			});

			if (Twinkle.getPref('customRedirectTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customRedirectTagList') });
			}
			break;

		default:
			alert('Twinkle.tag: unknown mode ' + Twinkle.tag.mode);
			break;
	}

	if (document.getElementsByClassName('patrollink').length) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Mark the page as patrolled/reviewed',
					value: 'patrol',
					name: 'patrol',
					checked: Twinkle.getPref('markTaggedPagesAsPatrolled')
				}
			]
		});
	}
	form.append({ type: 'submit', className: 'tw-tag-submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// for quick filter:
	$allCheckboxDivs = $(result).find('[name$=tags]').parent();
	$allHeaders = $(result).find('h5');
	result.quickfilter.focus();  // place cursor in the quick filter field as soon as window is opened
	result.quickfilter.autocomplete = 'off'; // disable browser suggestions
	result.quickfilter.addEventListener('keypress', function(e) {
		if (e.keyCode === 13) { // prevent enter key from accidentally submitting the form
			e.preventDefault();
			return false;
		}
	});

	if (Twinkle.tag.mode === 'article') {

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
		$('button.tw-tag-submit').after(statusNode);

		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.sortorder.dispatchEvent(evt);

	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.quickForm.getElements(result, 'tags').forEach(generateLinks);
	}
};


// $allCheckboxDivs and $allHeaders are defined globally, rather than in the
// quickfilter event function, to avoid having to recompute them on every keydown
var $allCheckboxDivs, $allHeaders;

Twinkle.tag.updateSortOrder = function(e) {
	var form = e.target.form;
	var sortorder = e.target.value;
	Twinkle.tag.checkedTags = form.getChecked('tags');

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
						{ label: '{{notability|Astro}}: notability guideline for astronomical objects', value: 'Astro' },
						{ label: '{{notability|Biographies}}: notability guideline for biographies', value: 'Biographies' },
						{ label: '{{notability|Books}}: notability guideline for books', value: 'Books' },
						{ label: '{{notability|Companies}}: notability guidelines for companies and organizations', value: 'Companies' },
						{ label: '{{notability|Events}}: notability guideline for events', value: 'Events' },
						{ label: '{{notability|Films}}: notability guideline for films', value: 'Films' },
						{ label: '{{notability|Geographic}}: notability guideline for geographic features', value: 'Geographic' },
						{ label: '{{notability|Lists}}: notability guideline for stand-alone lists', value: 'Lists' },
						{ label: '{{notability|Music}}: notability guideline for music', value: 'Music' },
						{ label: '{{notability|Neologisms}}: notability guideline for neologisms', value: 'Neologisms' },
						{ label: '{{notability|Numbers}}: notability guideline for numbers', value: 'Numbers' },
						{ label: '{{notability|Products}}: notability guideline for products and services', value: 'Products' },
						{ label: '{{notability|Sports}}: notability guideline for sports and athletics', value: 'Sports' },
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
		var unCheckedTags = e.target.form.getUnchecked('existingTags');
		Twinkle.tag.alreadyPresentTags.forEach(function(tag) {
			var checkbox =
				{
					value: tag,
					label: '{{' + tag + '}}' + (Twinkle.tag.article.flatObject[tag] ? ': ' + Twinkle.tag.article.flatObject[tag].description : ''),
					checked: unCheckedTags.indexOf(tag) === -1,
					style: 'font-style: italic'
				};

			checkboxes.push(checkbox);
		});
		subdiv.append({
			type: 'checkbox',
			name: 'existingTags',
			list: checkboxes
		});
	};


	if (sortorder === 'cat') { // categorical sort order
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, subgroup) {
			var checkboxes = [];
			$.each(subgroup, function(k, item) {
				if (Twinkle.tag.alreadyPresentTags.indexOf(item.tag) === -1) {
					checkboxes.push(makeCheckbox(item.tag, item.description));
				}
			});
			subdiv.append({
				type: 'checkbox',
				name: 'tags',
				list: checkboxes
			});
		};

		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
		}
		var i = 1;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagList, function(groupName, group) {
			container.append({ type: 'header', id: 'tagHeader' + i, label: groupName });
			var subdiv = container.append({ type: 'div', id: 'tagSubdiv' + i++ });
			if (Array.isArray(group)) {
				doCategoryCheckboxes(subdiv, group);
			} else {
				$.each(group, function(subgroupName, subgroup) {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subgroupName) ] });
					doCategoryCheckboxes(subdiv, subgroup);
				});
			}
		});
	} else { // alphabetical sort order
		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
			container.append({ type: 'header', id: 'tagHeader1', label: 'Available tags' });
		}

		// Avoid repeatedly resorting
		Twinkle.tag.article.alphabeticalList = Twinkle.tag.article.alphabeticalList || Object.keys(Twinkle.tag.article.flatObject).sort();
		var checkboxes = [];
		Twinkle.tag.article.alphabeticalList.forEach(function(tag) {
			if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
				checkboxes.push(makeCheckbox(tag, Twinkle.tag.article.flatObject[tag].description));
			}
		});
		container.append({
			type: 'checkbox',
			name: 'tags',
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getPref('customTagList').length) {
		container.append({ type: 'header', label: 'Custom tags' });
		container.append({ type: 'checkbox', name: 'tags',
			list: Twinkle.getPref('customTagList').map(function(el) {
				el.checked = Twinkle.tag.checkedTags.indexOf(el.value) !== -1;
				return el;
			})
		});
	}

	var $workarea = $(form).find('#tagWorkArea');
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// for quick filter:
	$allCheckboxDivs = $workarea.find('[name=tags], [name=existingTags]').parent();
	$allHeaders = $workarea.find('h5, .quickformDescription');
	form.quickfilter.value = ''; // clear search, because the search results are not preserved over mode change
	form.quickfilter.focus();

	// style adjustments
	$workarea.find('h5').css({ 'font-size': '110%' });
	$workarea.find('h5:not(:first-child)').css({ 'margin-top': '1em' });
	$workarea.find('div').filter(':has(span.quickformDescription)').css({ 'margin-top': '0.4em' });

	Morebits.quickForm.getElements(form, 'existingTags').forEach(generateLinks);
	Morebits.quickForm.getElements(form, 'tags').forEach(generateLinks);

	// tally tags added/removed, update statusNode text
	var statusNode = document.getElementById('tw-tag-status');
	$('[name=tags], [name=existingTags]').click(function() {
		if (this.name === 'tags') {
			Twinkle.tag.status.numAdded += this.checked ? 1 : -1;
		} else if (this.name === 'existingTags') {
			Twinkle.tag.status.numRemoved += this.checked ? -1 : 1;
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

// Tags arranged by category; will be used to generate the alphabetical list,
// but tags should be in alphabetical order within the categories
// excludeMI: true indicate a tag that *does not* work inside {{multiple issues}}
// Add new categories with discretion - the list is long enough as is!
Twinkle.tag.article.tagList = {
	'Cleanup and maintenance tags': {
		'General cleanup': [
			{ tag: 'Cleanup', description: 'requires cleanup' },  // has a subgroup with text input
			{ tag: 'Cleanup rewrite', description: "needs to be rewritten entirely to comply with Wikipedia's quality standards" },
			{ tag: 'Copy edit', description: 'requires copy editing for grammar, style, cohesion, tone, or spelling' }  // has a subgroup with text input
		],
		'Potentially unwanted content': [
			{ tag: 'Close paraphrasing', description: 'contains close paraphrasing of a non-free copyrighted source' },
			{ tag: 'Copypaste', description: 'appears to have been copied and pasted from another location', excludeMI: true },  // has a subgroup with text input
			{ tag: 'External links', description: 'external links may not follow content policies or guidelines' },
			{ tag: 'Non-free', description: 'may contain excessive or improper use of copyrighted materials' }
		],
		'Structure, formatting, and lead section': [
			{ tag: 'Cleanup reorganize', description: "needs reorganization to comply with Wikipedia's layout guidelines" },
			{ tag: 'Condense', description: 'too many section headers dividing up content' },
			{ tag: 'Lead missing', description: 'no lead section' },
			{ tag: 'Lead rewrite', description: 'lead section needs to be rewritten to comply with guidelines' },
			{ tag: 'Lead too long', description: 'lead section is too long for the length of the article' },
			{ tag: 'Lead too short', description: 'lead section is too short and should be expanded to summarize key points' },
			{ tag: 'Sections', description: 'needs to be divided into sections by topic' },
			{ tag: 'Very long', description: 'too long to read and navigate comfortably' }
		],
		'Fiction-related cleanup': [
			{ tag: 'All plot', description: 'almost entirely a plot summary' },
			{ tag: 'Fiction', description: 'fails to distinguish between fact and fiction' },
			{ tag: 'In-universe', description: 'subject is fictional and needs rewriting to provide a non-fictional perspective' },
			{ tag: 'Long plot', description: 'plot summary is too long or excessively detailed' },
			{ tag: 'No plot', description: 'needs a plot summary' }
		]
	},
	'General content issues': {
		'Importance and notability': [
			{ tag: 'Notability', description: 'subject may not meet the general notability guideline' }  // has a subgroup with subcategories
		],
		'Style of writing': [
			{ tag: 'Advert', description: 'written like an advertisement' },
			{ tag: 'Cleanup tense', description: 'does not follow guidelines on use of different tenses.' },
			{ tag: 'Essay-like', description: 'written like a personal reflection, personal essay, or argumentative essay' },
			{ tag: 'Fanpov', description: "written from a fan's point of view" },
			{ tag: 'Like resume', description: 'written like a resume' },
			{ tag: 'Manual', description: 'written like a manual or guidebook' },
			{ tag: 'Cleanup-PR', description: 'reads like a press release or news article' },
			{ tag: 'Over-quotation', description: 'too many or too-lengthy quotations for an encyclopedic entry' },
			{ tag: 'Prose', description: 'written in a list format but may read better as prose' },
			{ tag: 'Technical', description: 'too technical for most readers to understand' },
			{ tag: 'Tone', description: 'tone or style may not reflect the encyclopedic tone used on Wikipedia' }
		],
		'Sense (or lack thereof)': [
			{ tag: 'Confusing', description: 'confusing or unclear' },
			{ tag: 'Incomprehensible', description: 'very hard to understand or incomprehensible' },
			{ tag: 'Unfocused', description: 'lacks focus or is about more than one topic' }
		],
		'Information and detail': [
			{ tag: 'Context', description: 'insufficient context for those unfamiliar with the subject' },
			{ tag: 'Expert needed', description: 'needs attention from an expert on the subject' },
			{ tag: 'Overly detailed', description: 'excessive amount of intricate detail' },
			{ tag: 'Undue weight', description: 'lends undue weight to certain ideas, incidents, or controversies' }
		],
		'Timeliness': [
			{ tag: 'Current', description: 'documents a current event', excludeMI: true }, // Works but not intended for use in MI
			{ tag: 'Update', description: 'needs additional up-to-date information added' }
		],
		'Neutrality, bias, and factual accuracy': [
			{ tag: 'Autobiography', description: 'autobiography and may not be written neutrally' },
			{ tag: 'COI', description: 'creator or major contributor may have a conflict of interest' },
			{ tag: 'Disputed', description: 'questionable factual accuracy' },
			{ tag: 'Hoax', description: 'may partially or completely be a hoax' },
			{ tag: 'Globalize', description: 'may not represent a worldwide view of the subject' },
			{ tag: 'Over-coverage', description: 'extensive bias or disproportional coverage towards one or more specific regions' },
			{ tag: 'Peacock', description: 'contains wording that promotes the subject in a subjective manner without adding information' },
			{ tag: 'POV', description: 'does not maintain a neutral point of view' },
			{ tag: 'Recentism', description: 'slanted towards recent events' },
			{ tag: 'Too few opinions', description: 'may not include all significant viewpoints' },
			{ tag: 'Undisclosed paid', description: 'may have been created or edited in return for undisclosed payments' },
			{ tag: 'Weasel', description: 'neutrality or verifiability is compromised by the use of weasel words' }
		],
		'Verifiability and sources': [
			{ tag: 'BLP sources', description: 'BLP that needs additional sources for verification' },
			{ tag: 'BLP unsourced', description: 'BLP that has no sources at all (use BLP PROD instead for new articles)' },
			{ tag: 'More citations needed', description: 'needs additional references or sources for verification' },
			{ tag: 'One source', description: 'relies largely or entirely on a single source' },
			{ tag: 'Original research', description: 'contains original research' },
			{ tag: 'Primary sources', description: 'relies too much on references to primary sources, and needs secondary sources' },
			{ tag: 'Self-published', description: 'contains excessive or inappropriate references to self-published sources' },
			{ tag: 'Sources exist', description: 'notable topic, sources are available that could be added to article' },
			{ tag: 'Third-party', description: 'relies too heavily on sources too closely associated with the subject' },
			{ tag: 'Unreferenced', description: 'does not cite any sources at all' },
			{ tag: 'Unreliable sources', description: 'some references may not be reliable' }
		]
	},
	'Specific content issues': {
		'Language': [
			{ tag: 'Not English', description: 'written in a language other than English and needs translation', excludeMI: true },  // has a subgroup with several options
			{ tag: 'Rough translation', description: 'poor translation from another language', excludeMI: true },  // has a subgroup with several options
			{ tag: 'Expand language', description: 'should be expanded with text translated from a foreign-language article', excludeMI: true }
		],
		'Links': [
			{ tag: 'Dead end', description: 'article has no links to other articles' },
			{ tag: 'Orphan', description: 'linked to from no other articles' },
			{ tag: 'Overlinked', description: 'too many duplicate and/or irrelevant links to other articles' },
			{ tag: 'Underlinked', description: 'needs more wikilinks to other articles' }
		],
		'Referencing technique': [
			{ tag: 'Citation style', description: 'unclear or inconsistent citation style' },
			{ tag: 'Cleanup bare URLs', description: 'uses bare URLs for references, which are prone to link rot' },
			{ tag: 'More footnotes', description: 'has some references, but insufficient inline citations' },
			{ tag: 'No footnotes', description: 'has references, but lacks inline citations' }
		],
		'Categories': [
			{ tag: 'Improve categories', description: 'needs additional or more specific categories', excludeMI: true },
			{ tag: 'Uncategorized', description: 'not added to any categories', excludeMI: true }
		]
	},
	'Merging': [
		{ tag: 'History merge', description: 'another page should be history merged into this one', excludeMI: true },
		{ tag: 'Merge', description: 'should be merged with another given article', excludeMI: true },   // these three have a subgroup with several options
		{ tag: 'Merge from', description: 'another given article should be merged into this one', excludeMI: true },
		{ tag: 'Merge to', description: 'should be merged into another given article', excludeMI: true }
	],
	'Informational': [
		{ tag: 'GOCEinuse', description: 'currently undergoing a major copy edit by the Guild of Copy Editors', excludeMI: true },
		{ tag: 'In use', description: 'undergoing a major edit for a short while', excludeMI: true },
		{ tag: 'Under construction', description: 'in the process of an expansion or major restructuring', excludeMI: true }
	]
};

// Tags for REDIRECTS start here
// Not by policy, but the list roughly approximates items with >500
// transclusions from Template:R template index
Twinkle.tag.redirectList = {
	'Grammar, punctuation, and spelling': {
		'Abbreviation': [
			{ tag: 'R from acronym', description: 'redirect from an acronym (e.g. POTUS) to its expanded form' },
			{ tag: 'R from initialism', description: 'redirect from an initialism (e.g. AGF) to its expanded form' },
			{ tag: 'R from MathSciNet abbreviation', description: 'redirect from MathSciNet publication title abbreviation to the unabbreviated title' },
			{ tag: 'R from NLM abbreviation', description: 'redirect from a NLM publication title abbreviation to the unabbreviated title' }
		],
		'Capitalisation': [
			{ tag: 'R from CamelCase', description: 'redirect from a CamelCase title' },
			{ tag: 'R from other capitalisation', description: 'redirect from a title with another method of capitalisation' },
			{ tag: 'R from miscapitalisation', description: 'redirect from a capitalisation error' }
		],
		'Grammar & punctuation': [
			{ tag: 'R from modification', description: 'redirect from a modification of the target\'s title, such as with words rearranged' },
			{ tag: 'R from plural', description: 'redirect from a plural word to the singular equivalent' },
			{ tag: 'R to plural', description: 'redirect from a singular noun to its plural form' }
		],
		'Parts of speech': [
			{ tag: 'R from verb', description: 'redirect from an English-language verb or verb phrase' },
			{ tag: 'R from adjective', description: 'redirect from an adjective (word or phrase that describes a noun)' }
		],
		'Spelling': [
			{ tag: 'R from alternative spelling', description: 'redirect from a title with a different spelling' },
			{ tag: 'R from ASCII-only', description: 'redirect from a title in only basic ASCII to the formal title, with differences that are not diacritical marks or ligatures' },
			{ tag: 'R from diacritic', description: 'redirect from a page name that has diacritical marks (accents, umlauts, etc.)' },
			{ tag: 'R to diacritic', description: 'redirect to the article title with diacritical marks (accents, umlauts, etc.)' },
			{ tag: 'R from misspelling', description: 'redirect from a misspelling or typographical error' }
		]
	},
	'Alternative names': {
		'General': [
			{
				tag: 'R from alternative language',
				description: 'redirect from or to a title in another language',
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
			{ tag: 'R from alternative name', description: 'redirect from a title that is another name, a pseudonym, a nickname, or a synonym' },
			{ tag: 'R from ambiguous sort name', description: 'redirect from an ambiguous sort name to a page or list that disambiguates it' },
			{ tag: 'R from former name', description: 'redirect from a former name or working title' },
			{ tag: 'R from historic name', description: 'redirect from a name with a significant historic past as a region, city, etc. no longer known by that name' },
			{ tag: 'R from incomplete name', description: 'R from incomplete name' },
			{ tag: 'R from incorrect name', description: 'redirect from an erroneus name that is unsuitable as a title' },
			{ tag: 'R from less specific name', description: 'redirect from a less specific title to a more specific, less general one' },
			{ tag: 'R from long name', description: 'redirect from a more complete title' },
			{ tag: 'R from more specific name', description: 'redirect from a more specific title to a less specific, more general one' },
			{ tag: 'R from short name', description: 'redirect from a title that is a shortened form of a person\'s full name, a book title, or other more complete title' },
			{ tag: 'R from sort name', description: 'redirect from the target\'s sort name, such as beginning with their surname rather than given name' },
			{ tag: 'R from synonym', description: 'redirect from a semantic synonym of the target page title' }
		],
		'People': [
			{ tag: 'R from birth name', description: 'redirect from a person\'s birth name to a more common name' },
			{ tag: 'R from given name', description: 'redirect from a person\'s given name' },
			{ tag: 'R from name with title', description: 'redirect from a person\'s name preceded or followed by a title to the name with no title or with the title in parentheses' },
			{ tag: 'R from person', description: 'redirect from a person or persons to a related article' },
			{ tag: 'R from personal name', description: 'redirect from an individual\'s personal name to an article titled with their professional or other better known moniker' },
			{ tag: 'R from pseudonym', description: 'redirect from a pseudonym' },
			{ tag: 'R from surname', description: 'redirect from a title that is a surname' }
		],
		'Technical': [
			{ tag: 'R from drug trade name', description: 'redirect from (or to) the trade name of a drug to (or from) the international nonproprietary name (INN)' },
			{ tag: 'R from filename', description: 'redirect from a title that is a filename of the target' },
			{ tag: 'R from molecular formula', description: 'redirect from a molecular/chemical formula to its technical or trivial name' },

			{ tag: 'R from gene symbol', description: 'redirect from a Human Genome Organisation (HUGO) symbol for a gene to an article about the gene' }
		],
		'Organisms': [
			{ tag: 'R to scientific name', description: 'redirect from the common name to the scientific name' },
			{ tag: 'R from scientific name', description: 'redirect from the scientific name to the common name' },
			{ tag: 'R from alternative scientific name', description: 'redirect from an alternative scientific name to the accepted scientific name' },
			{ tag: 'R from scientific abbreviation', description: 'redirect from a scientific abbreviation' },
			{ tag: 'R to monotypic taxon', description: 'redirect from the only lower-ranking member of a monotypic taxon to its monotypic taxon' },
			{ tag: 'R from monotypic taxon', description: 'redirect from a monotypic taxon to its only lower-ranking member' },
			{ tag: 'R taxon with possibilities', description: 'redirect from a title related to a living organism that potentially could be expanded into an article' }
		],
		'Geography': [
			{ tag: 'R from name and country', description: 'redirect from the specific name to the briefer name' },
			{ tag: 'R from more specific geographic name', description: 'redirect from a geographic location that includes extraneous identifiers such as the county or region of a city' }
		]
	},
	'Navigation aids': {
		'Navigation': [
			{ tag: 'R to anchor', description: 'redirect from a topic that does not have its own page to an anchored part of a page on the subject' },
			{ tag: 'R avoided double redirect', description: 'redirect from an alternative title for another redirect' },
			{ tag: 'R from file metadata link', description: 'redirect of a wikilink created from EXIF, XMP, or other information (i.e. the "metadata" section on some image description pages)' },
			{ tag: 'R to list entry', description: 'redirect to a list which contains brief descriptions of subjects not notable enough to have separate articles' },

			{ tag: 'R mentioned in hatnote', description: 'redirect from a title that is mentioned in a hatnote at the redirect target' },
			{ tag: 'R to section', description: 'similar to {{R to list entry}}, but when list is organized in sections, such as list of characters in a fictional universe' },
			{ tag: 'R from shortcut', description: 'redirect from a Wikipedia shortcut' },
			{ tag: 'R from template shortcut', description: 'redirect from a shortcut page name in any namespace to a page in template namespace' }

		],
		'Disambiguation': [
			{ tag: 'R from ambiguous term', description: 'redirect from an ambiguous page name to a page that disambiguates it. This template should never appear on a page that has "(disambiguation)" in its title, use R to disambiguation page instead' },
			{ tag: 'R to disambiguation page', description: 'redirect to a disambiguation page' },
			{ tag: 'R from incomplete disambiguation', description: 'redirect from a page name that is too ambiguous to be the title of an article and should redirect to an appropriate disambiguation page' },
			{ tag: 'R from incorrect disambiguation', description: 'redirect from a page name with incorrect disambiguation due to an error or previous editorial misconception' },
			{ tag: 'R from other disambiguation', description: 'redirect from a page name with an alternative disambiguation qualifier' },
			{ tag: 'R from unnecessary disambiguation', description: 'redirect from a page name that has an unneeded disambiguation qualifier' }
		],
		'Merge, duplicate & move': [
			{ tag: 'R from duplicated article', description: 'redirect to a similar article in order to preserve its edit history' },
			{ tag: 'R with history', description: 'redirect from a page containing substantive page history, kept to preserve content and attributions' },
			{ tag: 'R from move', description: 'redirect from a page that has been moved/renamed' },
			{ tag: 'R from merge', description: 'redirect from a merged page in order to preserve its edit history' }
		],
		'Namespace': [
			{ tag: 'R from remote talk page', description: 'redirect from a talk page in any talk namespace to a corresponding page that is more heavily watched' },
			{ tag: 'R to category namespace', description: 'redirect from a page outside the category namespace to a category page' },
			{ tag: 'R to help namespace', description: 'redirect from any page inside or outside of help namespace to a page in that namespace' },
			{ tag: 'R to main namespace', description: 'redirect from a page outside the main-article namespace to an article in mainspace' },
			{ tag: 'R to portal namespace', description: 'redirect from any page inside or outside of portal space to a page in that namespace' },
			{ tag: 'R to project namespace', description: 'redirect from any page inside or outside of project (Wikipedia: or WP:) space to any page in the project namespace' },
			{ tag: 'R to user namespace', description: 'redirect from a page outside the user namespace to a user page (not to a user talk page)' }
		]
	},
	'Media': {
		'General': [
			{ tag: 'R from book', description: 'redirect from a book title to a more general, relevant article' },
			{ tag: 'R from album', description: 'redirect from an album to a related topic such as the recording artist or a list of albums' },
			{ tag: 'R from song', description: 'redirect from a song title to a more general, relevant article' },
			{ tag: 'R from television episode', description: 'redirect from a television episode title to a related work or lists of episodes' }
		],
		'Fiction': [
			{ tag: 'R from fictional character', description: 'redirect from a fictional character to a related fictional work or list of characters' },
			{ tag: 'R from fictional element', description: 'redirect from a fictional element (such as an object or concept) to a related fictional work or list of similar elements' },
			{ tag: 'R from fictional location', description: 'redirect from a fictional location or setting to a related fictional work or list of places' }

		]
	},
	'Miscellaneous': {
		'Related information': [
			{ tag: 'R to article without mention', description: 'redirect to an article without any mention of the redirected word or phrase' },
			{ tag: 'R to decade', description: 'redirect from a year to the decade article' },
			{ tag: 'R from domain name', description: 'redirect from a domain name to an article about a website' },
			{ tag: 'R from phrase', description: 'redirect from a phrase to a more general relevant article covering the topic' },
			{ tag: 'R from list topic', description: 'redirect from the topic of a list to the equivalent list' },
			{ tag: 'R from member', description: 'redirect from a member of a group to a related topic such as the group or organization' },
			{ tag: 'R to related topic', description: 'redirect to an article about a similar topic' },
			{ tag: 'R from related word', description: 'redirect from a related word' },
			{ tag: 'R from school', description: 'redirect from a school article that had very little information' },
			{ tag: 'R from subtopic', description: 'redirect from a title that is a subtopic of the target article' },
			{ tag: 'R to subtopic', description: 'redirect to a subtopic of the redirect\'s title' },
			{ tag: 'R from Unicode character', description: 'redirect from a single Unicode character to an article or Wikipedia project page that infers meaning for the symbol' },
			{ tag: 'R from Unicode code', description: 'redirect from a Unicode code point to an article about the character it represents' }
		],
		'With possibilities': [
			{ tag: 'R with possibilities', description: 'redirect from a specific title to a more general, less detailed article (something which can and should be expanded)' }
		],
		'ISO codes': [
			{ tag: 'R from ISO 4 abbreviation', description: 'redirect from an ISO 4 publication title abbreviation to the unabbreviated title' },
			{ tag: 'R from ISO 639 code', description: 'redirect from a title that is an ISO 639 language code to an article about the language' }
		],
		'Printworthiness': [
			{ tag: 'R printworthy', description: 'redirect from a title that would be helpful in a printed or CD/DVD version of Wikipedia' },
			{ tag: 'R unprintworthy', description: 'redirect from a title that would NOT be helpful in a printed or CD/DVD version of Wikipedia' }
		]
	}
};

// maintenance tags for FILES start here

Twinkle.tag.fileList = {
	'License and sourcing problem tags': [
		{ label: '{{Bsr}}: source info consists of bare image URL/generic base URL only', value: 'Bsr' },
		{ label: '{{Non-free reduce}}: non-low-resolution fair use image (or too-long audio clip, etc)', value: 'Non-free reduce' },
		{ label: '{{Orphaned non-free revisions}}: fair use media with old revisions that need to be deleted', value: 'Orphaned non-free revisions' }
	],
	'Wikimedia Commons-related tags': [
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
			value: 'Now Commons',
			subgroup: {
				type: 'input',
				name: 'nowcommonsName',
				label: 'Commons image name if different: ',
				tooltip: 'Name of the image on Commons (if different from local name), excluding the File: prefix:'
			}
		}
	],
	'Cleanup tags': [
		{ label: '{{Artifacts}}: PNG contains residual compression artifacts', value: 'Artifacts' },
		{ label: '{{Bad font}}: SVG uses fonts not available on the thumbnail server', value: 'Bad font' },
		{ label: '{{Bad format}}: PDF/DOC/... file should be converted to a more useful format', value: 'Bad format' },
		{ label: '{{Bad GIF}}: GIF that should be PNG, JPEG, or SVG', value: 'Bad GIF' },
		{ label: '{{Bad JPEG}}: JPEG that should be PNG or SVG', value: 'Bad JPEG' },
		{ label: '{{Bad SVG}}: SVG containing raster grahpics', value: 'Bad SVG' },
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
	],
	'Image quality tags': [
		{ label: '{{Image hoax}}: Image may be manipulated or constitute a hoax', value: 'Image hoax' },
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
	],
	'Replacement tags': [
		{ label: '{{Obsolete}}: improved version available', value: 'Obsolete' },
		{ label: '{{PNG version available}}', value: 'PNG version available' },
		{ label: '{{Vector version available}}', value: 'Vector version available' }
	]
};
Twinkle.tag.fileList['Replacement tags'].forEach(function(el) {
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
		var params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		var postRemoval = function() {
			if (params.tagsToRemove.length) {
				// Remove empty {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(multiple ?issues|article ?issues|mi)\s*\|\s*\}\}\n?/im, '');
				// Remove single-element {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(?:multiple ?issues|article ?issues|mi)\s*\|\s*(\{\{[^}]+\}\})\s*\}\}/im, '$1');
			}

			// Build edit summary
			var makeSentence = function(array) {
				if (array.length < 3) {
					return array.join(' and ');
				}
				var last = array.pop();
				return array.join(', ') + ', and ' + last;
			};
			var makeTemplateLink = function(tag) {
				var text = '{{[[';
				// if it is a custom tag with a parameter
				if (tag.indexOf('|') !== -1) {
					tag = tag.slice(0, tag.indexOf('|'));
				}
				text += tag.indexOf(':') !== -1 ? tag : 'Template:' + tag + '|' + tag;
				return text + ']]}}';
			};

			var summaryText;
			var addedTags = params.tags.map(makeTemplateLink);
			var removedTags = params.tagsToRemove.map(makeTemplateLink);
			if (addedTags.length) {
				summaryText = 'Added ' + makeSentence(addedTags);
				summaryText += removedTags.length ? '; and removed ' + makeSentence(removedTags) : '';
			} else {
				summaryText = 'Removed ' + makeSentence(removedTags);
			}
			summaryText += ' tag' + (addedTags.length + removedTags.length > 1 ? 's' : '');
			if (params.reason) {
				summaryText += ': ' + params.reason;
			}

			// avoid truncated summaries
			if (summaryText.length > 499) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText);
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(function() {
				// special functions for merge tags
				if (params.mergeReason) {
					// post the rationale on the talk page (only operates in main namespace)
					var talkpageText = '\n\n== ' + params.talkDiscussionTitleLinked + ' ==\n\n';
					talkpageText += params.mergeReason.trim() + ' ~~~~';
					var talkpage = new Morebits.wiki.page('Talk:' + params.discussArticle, 'Posting rationale on talk page');
					talkpage.setAppendText(talkpageText);
					talkpage.setEditSummary('/* ' + params.talkDiscussionTitle + ' */ new section');
					talkpage.setChangeTags(Twinkle.changeTags);
					talkpage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
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
						talkDiscussionTitle: params.talkDiscussionTitle,
						talkDiscussionTitleLinked: params.talkDiscussionTitleLinked
					};
					var otherpage = new Morebits.wiki.page(params.mergeTarget, 'Tagging other page (' +
						params.mergeTarget + ')');
					otherpage.setChangeTags(Twinkle.changeTags);
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
				}

				// post at WP:PNT for {{not English}} and {{rough translation}} tag
				if (params.translationPostAtPNT) {
					var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
						'Listing article at Wikipedia:Pages needing translation into English');
					pntPage.setFollowRedirect(true);
					pntPage.load(function friendlytagCallbacksTranslationListPage(pageobj) {
						var old_text = pageobj.getPageText();

						var template = params.tags.indexOf('Rough translation') !== -1 ? 'duflu' : 'needtrans';
						var lang = params.translationLanguage;
						var reason = params.translationComments;

						var templateText = '{{subst:' + template + '|pg=' + Morebits.pageNameNorm + '|Language=' +
							(lang || 'uncertain') + '|Comments=' + reason.trim() + '}} ~~~~';

						var text, summary;
						if (template === 'duflu') {
							text = old_text + '\n\n' + templateText;
							summary = 'Translation cleanup requested on ';
						} else {
							text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
								'\n\n' + templateText + '\n\n$1');
							summary = 'Translation' + (lang ? ' from ' + lang : '') + ' requested on ';
						}

						if (text === old_text) {
							pageobj.getStatusElement().error('failed to find target spot for the discussion');
							return;
						}
						pageobj.setPageText(text);
						pageobj.setEditSummary(summary + ' [[:' + Morebits.pageNameNorm + ']]');
						pageobj.setChangeTags(Twinkle.changeTags);
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
						userTalkPage.setEditSummary('Notice: Please use English when contributing to the English Wikipedia.');
						userTalkPage.setChangeTags(Twinkle.changeTags);
						userTalkPage.setCreateOption('recreate');
						userTalkPage.setFollowRedirect(true, false);
						userTalkPage.append();
					});
				}
			});

			if (params.patrol) {
				pageobj.triage();
			}
		};

		/**
		 * Removes the existing tags that were deselected (if any)
		 * Calls postRemoval() when done
		 */
		var removeTags = function removeTags() {

			if (params.tagsToRemove.length === 0) {
				postRemoval();
				return;
			}

			Morebits.status.info('Info', 'Removing deselected tags that were already present');

			var getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach(function removeTag(tag) {
				var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');

				if (tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}
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
				'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
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

		var tagRe, tagText = '', tags = [], groupableTags = [], groupableExistingTags = [];
		// Executes first: addition of selected tags

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
								var direction = '[[' + params.nonDiscussArticle + ']]' + (params.mergeTag === 'Merge' ? ' with ' : ' into ') + '[[' + params.discussArticle + ']]';
								params.talkDiscussionTitleLinked = 'Proposed merge of ' + direction;
								params.talkDiscussionTitle = params.talkDiscussionTitleLinked.replace(/\[\[(.*?)\]\]/g, '$1');
							}
							currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
						}
						break;
					default:
						break;
				}

				currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}
		};

		/**
		 * Adds the tags which go outside {{multiple issues}}, either because
		 * these tags aren't supported in {{multiple issues}} or because
		 * {{multiple issues}} is not being added to the page at all
		 */
		var addUngroupedTags = function() {
			$.each(tags, addTag);

			// Insert tag after short description or any hatnotes,
			// as well as deletion/protection-related templates
			var wikipage = new Morebits.wikitext.page(pageText);
			var templatesAfter = Twinkle.hatnoteRegex +
				// Protection templates
				'pp|pp-.*?|' +
				// CSD
				'db|delete|db-.*?|speedy deletion-.*?|' +
				// PROD
				'(?:proposed deletion|prod blp)\\/dated(?:\\s*\\|(?:concern|user|timestamp|help).*)+|' +
				// not a hatnote, but sometimes under a CSD or AfD
				'salt|proposed deletion endorsed';
			// AfD is special, as the tag includes html comments before and after the actual template
			// trailing whitespace/newline needed since this subst's a newline
			var afdRegex = '(?:<!--.*AfD.*\\n\\{\\{(?:Article for deletion\\/dated|AfDM).*\\}\\}\\n<!--.*(?:\\n<!--.*)?AfD.*(?:\\s*\\n))?';
			pageText = wikipage.insertAfterTemplates(tagText, templatesAfter, null, afdRegex).getText();

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach(function(tag) {
			tagRe = new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
			// regex check for preexistence of tag can be skipped if in canRemove mode
			if (Twinkle.tag.canRemove || !tagRe.exec(pageText)) {
				// condition Twinkle.tag.article.tags[tag] to ensure that its not a custom tag
				// Custom tags are assumed non-groupable, since we don't know whether MI template supports them
				if (Twinkle.tag.article.flatObject[tag] && !Twinkle.tag.article.flatObject[tag].excludeMI) {
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
			if (!Twinkle.tag.article.flatObject[tag].excludeMI) {
				groupableExistingTags.push(tag);
			}
		});

		var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

		if (miTest && groupableTags.length > 0) {
			Morebits.status.info('Info', 'Adding supported tags inside existing {{multiple issues}} tag');

			tagText = '';
			$.each(groupableTags, addTag);

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
				$.each(groupableTags, addTag);
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
				'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
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

		if (!tags.length) {
			Morebits.status.warn('Info', 'No tags remaining to apply');
		}

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
			// Regex inspired by [[User:Kephir/gadgets/sagittarius.js]] ([[Special:PermaLink/831402893]])
			var oldTags = pageText.match(/(\s*{{[A-Za-z ]+\|)((?:[^|{}]*|{{[^}]*}})+)(}})\s*/i);
			pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			var pageTags = pageText.match(/\s*{{R(?:edirect)? .*?}}/img);
			var oldPageTags = '';
			if (pageTags) {
				pageTags.forEach(function(pageTag) {
					var pageRe = new RegExp(pageTag, 'img');
					pageText = pageText.replace(pageRe, '');
					pageTag = pageTag.trim();
					oldPageTags += '\n' + pageTag;
				});
			}
			pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
		}

		summaryText += (tags.length > 0 ? ' tag' + (tags.length > 1 ? 's' : ' ') : 'rcat shell') + ' to redirect';

		// avoid truncated summaries
		if (summaryText.length > 499) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText);
		pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
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
				if (['Keep local', 'Now Commons', 'Do not move to Commons_reason', 'Do not move to Commons'].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}

				currentTag = tag === 'Do not move to Commons_reason' ? 'Do not move to Commons' : tag;

				switch (tag) {
					case 'Now Commons':
						currentTag = 'subst:' + currentTag; // subst
						if (params.nowcommonsName !== '') {
							currentTag += '|1=' + params.nowcommonsName;
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
					case 'Image hoax':
						currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}';
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
						currentTag += '|1=' + params[tag.replace(/ /g, '_') + 'File'];
						break;
					case 'Do not move to Commons_reason':
						currentTag += '|reason=' + params.DoNotMoveToCommons;
						break;
					case 'Orphaned non-free revisions':
						currentTag = 'subst:' + currentTag; // subst
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

				currentTag = '{{' + currentTag + '}}\n';

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
		pageobj.setEditSummary(summary.substring(0, summary.length - 2));
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var params = Morebits.quickForm.getInputData(form);


	// Validation

	// Given an array of incompatible tags, check if we have two or more selected
	var checkIncompatible = function(conflicts, extra) {
		var count = conflicts.reduce(function(sum, tag) {
			return sum += params.tags.indexOf(tag) !== -1;
		}, 0);
		if (count > 1) {
			var message = 'Please select only one of: {{' + conflicts.join('}}, {{') + '}}.';
			message += extra ? ' ' + extra : '';
			alert(message);
			return true;
		}
	};
	// Given a tag, ensure an associate parameter is present
	// Maybe just sock this away in each function???
	var checkParameter = function(tag, parameter, description) {
		description = description || 'a reason';
		if (params.tags.indexOf(tag) !== -1 && params[parameter].trim() === '') {
			alert('You must specify ' + description + ' for the {{' + tag + '}} tag.');
			return true;
		}
	};

	// We could theoretically put them all checkIncompatible calls in a
	// forEach loop, but it's probably clearer not to have [[array one],
	// [array two]] devoid of context. Likewise, all the checkParameter
	// calls could be in one if, but could be similarly confusing.
	switch (Twinkle.tag.mode) {
		case 'article':
			params.tagsToRemove = form.getUnchecked('existingTags'); // not in `input`
			params.tagsToRemain = params.existingTags || []; // container not created if none present

			if ((params.tags.indexOf('Merge') !== -1) || (params.tags.indexOf('Merge from') !== -1) ||
				(params.tags.indexOf('Merge to') !== -1)) {
				if (checkIncompatible(['Merge', 'Merge from', 'Merge to'], 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).')) {
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

			if (checkIncompatible(['Not English', 'Rough translation'])) {
				return;
			}
			if (checkParameter('History merge', 'histmergeOriginalPage', 'a page to be merged')) {
				return;
			}
			if (checkParameter('Cleanup', 'cleanup')) {
				return;
			}
			if (checkParameter('Expand language', 'expandLanguageLangCode', 'a language code')) {
				return;
			}
			break;

		case 'file':
			if (checkIncompatible(['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'])) {
				return;
			}
			if (checkIncompatible(['Should be PNG', 'Should be SVG', 'Should be text'])) {
				return;
			}
			if (checkIncompatible(['Bad SVG', 'Vector version available'])) {
				return;
			}
			if (checkIncompatible(['Bad JPEG', 'Overcompressed JPEG'])) {
				return;
			}
			if (checkIncompatible(['PNG version available', 'Vector version available'])) {
				return;
			}

			// Get extension from either mime-type or title, if not present (e.g., SVGs)
			var extension = ((extension = $('.mime-type').text()) && extension.split(/\//)[1]) || mw.Title.newFromText(Morebits.pageNameNorm).getExtension();
			if (extension) {
				var extensionUpper = extension.toUpperCase();

				// What self-respecting file format has *two* extensions?!
				if (extensionUpper === 'JPG') {
					extension = 'JPEG';
				}

				// We've already ensured above that there can be only one of {{Bad *}} and {{Should be *}},
				// so these check that it actually matches the file's actual extension.  We need to check
				// if any tags start with a string, which means using string's indexOf, since can't
				// use ES6y things like find or findIndex.

				// Bad GIF|JPEG|SVG
				if ((params.tags.toString().indexOf('Bad ') !== -1) && (params.tags.indexOf('Bad ' + extensionUpper) === -1)) {
					alert('This appears to be a ' + extension + ' file, please use {{Bad ' + extensionUpper + '}} instead.');
					return;
				}
				// Should be PNG|SVG
				if ((params.tags.toString().indexOf('Should be ') !== -1) && (params.tags.indexOf('Should be ' + extensionUpper) !== -1)) {
					alert('This is already a ' + extension + ' file, so {{Should be ' + extensionUpper + '}} is inappropriate.');
					return;
				}

				// Overcompressed JPEG
				if (params.tags.indexOf('Overcompressed JPEG') !== -1 && extensionUpper !== 'JPEG') {
					alert('This appears to be a ' + extension + ' file, so {{Overcompressed JPEG}} probably doesn\'t apply.');
					return;
				}
				// Bad trace and Bad font
				if (extensionUpper !== 'SVG') {
					if (params.tags.indexOf('Bad trace') !== -1) {
						alert('This appears to be a ' + extension + ' file, so {{Bad trace}} probably doesn\'t apply.');
						return;
					} else if (params.tags.indexOf('Bad font') !== -1) {
						alert('This appears to be a ' + extension + ' file, so {{Bad font}} probably doesn\'t apply.');
						return;
					}
				}
			}

			if (checkParameter('Cleanup image', 'cleanupimageReason')) {
				return;
			}
			if (checkParameter('Image-Poor-Quality', 'ImagePoorQualityReason')) {
				return;
			}
			if (checkParameter('Low Quality Chem', 'lowQualityChemReason')) {
				return;
			}
			// Silly to provide the same string to each of these
			if (checkParameter('Obsolete', 'ObsoleteFile', 'the replacement file name') ||
				checkParameter('PNG version available', 'PNG_version_availableFile', 'the replacement file name') ||
				checkParameter('Vector version available', 'Vector_version_availableFile', 'the replacement file name')) {
				return;
			}
			if (checkParameter('Do not move to Commons_reason', 'DoNotMoveToCommons')) {
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
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);

};

Twinkle.addInitCallback(Twinkle.tag, 'tag');
})(jQuery);
// </nowiki>
