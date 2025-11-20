// <nowiki>

(function() {

/*
 ****************************************
 *** twinkletag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles and drafts; file pages with a corresponding file
 *                         which is local (not on Commons); all redirects
 */

Twinkle.tag = function twinkletag() {
	// redirect tagging (exclude category redirects, which are all soft redirects and so shouldn't be tagged with rcats)
	if (Morebits.isPageRedirect() && mw.config.get('wgNamespaceNumber') !== 14) {
		Twinkle.tag.mode = 'redirect';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'twinkle-tag', 'Tag redirect');
	// file tagging
	} else if (mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById('mw-sharedupload') && document.getElementById('mw-imagepage-section-filehistory')) {
		Twinkle.tag.mode = 'file';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'twinkle-tag', 'Add maintenance tags to file');
	// article/draft article tagging
	} else if ([0, 118].includes(mw.config.get('wgNamespaceNumber')) && mw.config.get('wgCurRevisionId')) {
		Twinkle.tag.mode = 'article';
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove = (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'twinkle-tag', 'Add or remove article maintenance tags');
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.callback = function twinkletagCallback() {
	const Window = new Morebits.SimpleWindow(630, Twinkle.tag.mode === 'article' ? 500 : 400);
	Window.setScriptName('Twinkle');
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink('Tag prefs', 'WP:TW/PREF#tag');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#tag');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.tag.callback.evaluate);

	// if page is unreviewed, add a checkbox to the form so that user can pick whether or not to review it
	const isPatroller = mw.config.get('wgUserGroups').some((r) => ['patroller', 'sysop'].includes(r));
	if (isPatroller) {
		new mw.Api().get({
			action: 'pagetriagelist',
			format: 'json',
			page_id: mw.config.get('wgArticleId')
		}).then((response) => {
			// Figure out whether the article is marked as reviewed in PageTriage.
			// Recent articles will have a patrol_status that we can read.
			// For articles that have been out of the new pages feed for awhile, pages[0] will be undefined.
			const isReviewed = response.pagetriagelist.pages[0] ?
				response.pagetriagelist.pages[0].patrol_status > 0 :
				true;

			// if article is not marked as reviewed, show the "mark as reviewed" check box
			if (!isReviewed) {
				// Quickform is probably already rendered. Instead of using form.append(), we need to make an element and then append it using JQuery.
				const checkbox = new Morebits.QuickForm.Element({
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
				const html = checkbox.render();
				$('.quickform').prepend(html);
			}
		});
	}

	form.append({
		type: 'input',
		label: 'Filter tag list:',
		name: 'quickfilter',
		size: '30',
		event: function twinkletagquickfilter() {
			// flush the DOM of all existing underline spans
			$allCheckboxDivs.find('.search-hit').each((i, e) => {
				const labelElement = e.parentElement;
				// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
				// to <label>Hello world</label>
				labelElement.innerHTML = labelElement.textContent;
			});

			if (this.value) {
				$allCheckboxDivs.hide();
				$allHeaders.hide();
				const searchString = this.value;
				const searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');

				$allCheckboxDivs.find('label').each(function () {
					const labelText = this.textContent;
					const searchHit = searchRegex.exec(labelText);
					if (searchHit) {
						const range = document.createRange();
						const textnode = this.childNodes[0];
						range.selectNodeContents(textnode);
						range.setStart(textnode, searchHit.index);
						range.setEnd(textnode, searchHit.index + searchString.length);
						const underlineSpan = $('<span>').addClass('search-hit').css('text-decoration', 'underline')[0];
						range.surroundContents(underlineSpan);
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
			Twinkle.tag.article.flatObject = {};
			Object.values(Twinkle.tag.article.tagList).forEach((group) => {
				Object.values(group).forEach((subgroup) => {
					if (Array.isArray(subgroup)) {
						subgroup.forEach((item) => {
							Twinkle.tag.article.flatObject[item.tag] = item;
						});
					} else {
						Twinkle.tag.article.flatObject[subgroup.tag] = subgroup;
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
				const divElement = document.createElement('div');
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
				size: '60'
			});

			break;

		case 'file':
			Window.setTitle('File maintenance tagging');

			$.each(Twinkle.tag.fileList, (groupName, group) => {
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

			// If a tag has a restriction for this namespace or title, return true, so that we know not to display it in the list of check boxes.
			var isRestricted = function(item) {
				if (typeof item.restriction === 'undefined') {
					return false;
				}
				const namespace = mw.config.get('wgNamespaceNumber');
				switch (item.restriction) {
					case 'insideMainspaceOnly':
						if (namespace !== 0) {
							return true;
						}
						break;
					case 'outsideUserspaceOnly':
						if (namespace === 2 || namespace === 3) {
							return true;
						}
						break;
					case 'insideTalkNamespaceOnly':
						if (namespace % 2 !== 1 || namespace < 0) {
							return true;
						}
						break;
					case 'disambiguationPagesOnly':
						if (!mw.config.get('wgPageName').endsWith('_(disambiguation)')) {
							return true;
						}
						break;
					default:
						alert('Twinkle.tag: unknown restriction ' + item.restriction);
						break;
				}
				return false;
			};

			// Generate the HTML form with the list of redirect tags that the user can choose to apply.
			var i = 1;
			$.each(Twinkle.tag.redirectList, (groupName, group) => {
				form.append({ type: 'header', id: 'tagHeader' + i, label: groupName });
				const subdiv = form.append({ type: 'div', id: 'tagSubdiv' + i++ });
				$.each(group, (subgroupName, subgroup) => {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subgroupName) ] });
					subdiv.append({
						type: 'checkbox',
						name: 'tags',
						list: subgroup
							.filter((item) => !isRestricted(item))
							.map((item) => ({ value: item.tag, label: '{{' + item.tag + '}}: ' + item.description, subgroup: item.subgroup }))
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

	form.append({ type: 'submit', className: 'tw-tag-submit' });

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// for quick filter:
	$allCheckboxDivs = $(result).find('[name$=tags]').parent();
	$allHeaders = $(result).find('h5, .quickformDescription');
	result.quickfilter.focus(); // place cursor in the quick filter field as soon as window is opened
	result.quickfilter.autocomplete = 'off'; // disable browser suggestions
	result.quickfilter.addEventListener('keypress', (e) => {
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
			$('.mw-parser-output').children().each((i, e) => {

				// break out on encountering the first heading, which means we are no
				// longer in the lead section
				if (e.classList.contains('mw-heading')) {
					return false;
				}

				// The ability to remove tags depends on the template's {{ambox}} |name=
				// parameter bearing the template's correct name (preferably) or a name that at
				// least redirects to the actual name

				// All tags have their first class name as "box-" + template name
				if (e.className.indexOf('box-') === 0) {
					if (e.classList[0] === 'box-Multiple_issues') {
						$(e).find('.ambox').each((idx, e) => {
							if (e.classList[0].indexOf('box-') === 0) {
								const tag = e.classList[0].slice('box-'.length).replace(/_/g, ' ');
								Twinkle.tag.alreadyPresentTags.push(tag);
							}
						});
						return true; // continue
					}

					const tag = e.classList[0].slice('box-'.length).replace(/_/g, ' ');
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
		const statusNode = document.createElement('small');
		statusNode.id = 'tw-tag-status';
		Twinkle.tag.status = {
			// initial state; defined like this because these need to be available for reference
			// in the click event handler
			numAdded: 0,
			numRemoved: 0
		};
		$('button.tw-tag-submit').after(statusNode);

		// fake a change event on the sort dropdown, to initialize the tag list
		const evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.sortorder.dispatchEvent(evt);
	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.QuickForm.getElements(result, 'tags').forEach(generateLinks);
	}
};

// $allCheckboxDivs and $allHeaders are defined globally, rather than in the
// quickfilter event function, to avoid having to recompute them on every keydown
let $allCheckboxDivs, $allHeaders;

Twinkle.tag.updateSortOrder = function(e) {
	const form = e.target.form;
	const sortorder = e.target.value;
	Twinkle.tag.checkedTags = form.getChecked('tags');

	const container = new Morebits.QuickForm.Element({ type: 'fragment' });

	// function to generate a checkbox, with appropriate subgroup if needed
	const makeCheckbox = function (item) {
		const tag = item.tag, description = item.description;
		const checkbox = { value: tag, label: '{{' + tag + '}}: ' + description };
		if (Twinkle.tag.checkedTags.includes(tag)) {
			checkbox.checked = true;
		}
		checkbox.subgroup = item.subgroup;
		return checkbox;
	};

	const makeCheckboxesForAlreadyPresentTags = function() {
		container.append({ type: 'header', id: 'tagHeader0', label: 'Tags already present' });
		const subdiv = container.append({ type: 'div', id: 'tagSubdiv0' });
		const checkboxes = [];
		const unCheckedTags = e.target.form.getUnchecked('existingTags');
		Twinkle.tag.alreadyPresentTags.forEach((tag) => {
			const checkbox =
				{
					value: tag,
					label: '{{' + tag + '}}' + (Twinkle.tag.article.flatObject[tag] ? ': ' + Twinkle.tag.article.flatObject[tag].description : ''),
					checked: !unCheckedTags.includes(tag),
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
		const doCategoryCheckboxes = function(subdiv, subgroup) {
			const checkboxes = [];
			$.each(subgroup, (k, item) => {
				if (!Twinkle.tag.alreadyPresentTags.includes(item.tag)) {
					checkboxes.push(makeCheckbox(item));
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
		let i = 1;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagList, (groupName, group) => {
			container.append({ type: 'header', id: 'tagHeader' + i, label: groupName });
			const subdiv = container.append({ type: 'div', id: 'tagSubdiv' + i++ });
			if (Array.isArray(group)) {
				doCategoryCheckboxes(subdiv, group);
			} else {
				$.each(group, (subgroupName, subgroup) => {
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
		const checkboxes = [];
		Twinkle.tag.article.alphabeticalList.forEach((tag) => {
			if (!Twinkle.tag.alreadyPresentTags.includes(tag)) {
				checkboxes.push(makeCheckbox(Twinkle.tag.article.flatObject[tag]));
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
			list: Twinkle.getPref('customTagList').map((el) => {
				el.checked = Twinkle.tag.checkedTags.includes(el.value);
				return el;
			})
		});
	}

	const $workarea = $(form).find('#tagWorkArea');
	const rendered = container.render();
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

	Morebits.QuickForm.getElements(form, 'existingTags').forEach(generateLinks);
	Morebits.QuickForm.getElements(form, 'tags').forEach(generateLinks);

	// tally tags added/removed, update statusNode text
	const statusNode = document.getElementById('tw-tag-status');
	$('[name=tags], [name=existingTags]').on('click', function() {
		if (this.name === 'tags') {
			Twinkle.tag.status.numAdded += this.checked ? 1 : -1;
		} else if (this.name === 'existingTags') {
			Twinkle.tag.status.numRemoved += this.checked ? -1 : 1;
		}

		const firstPart = 'Adding ' + Twinkle.tag.status.numAdded + ' tag' + (Twinkle.tag.status.numAdded > 1 ? 's' : '');
		const secondPart = 'Removing ' + Twinkle.tag.status.numRemoved + ' tag' + (Twinkle.tag.status.numRemoved > 1 ? 's' : '');
		statusNode.textContent =
			(Twinkle.tag.status.numAdded ? '  ' + firstPart : '') +
			(Twinkle.tag.status.numRemoved ? (Twinkle.tag.status.numAdded ? '; ' : '  ') + secondPart : '');
	});
};

/**
 * Adds a link to each template's description page
 *
 * @param {Morebits.QuickForm.Element} checkbox  associated with the template
 */
var generateLinks = function(checkbox) {
	const link = Morebits.htmlNode('a', '>');
	link.setAttribute('class', 'tag-template-link');
	const tagname = checkbox.values;
	link.setAttribute('href', mw.util.getUrl(
		(!tagname.includes(':') ? 'Template:' : '') +
		(!tagname.includes('|') ? tagname : tagname.slice(0, tagname.indexOf('|')))
	));
	link.setAttribute('target', '_blank');
	$(checkbox).parent().append(['\u00A0', link]);
};

// Tags for ARTICLES start here
Twinkle.tag.article = {};

// Shared across {{Rough translation}} and {{Not English}}
const translationSubgroups = [
	{
		name: 'translationLanguage',
		parameter: '1',
		type: 'input',
		label: 'Language of article (if known):',
		tooltip: 'Consider looking at [[WP:LRC]] for help. If listing the article at PNT, please try to avoid leaving this box blank, unless you are completely unsure.'
	}
].concat(mw.config.get('wgNamespaceNumber') === 0 ? [
	{
		type: 'checkbox',
		list: [ {
			name: 'translationPostAtPNT',
			label: 'List this article at Wikipedia:Pages needing translation into English (PNT)',
			checked: true
		} ]
	},
	{
		name: 'translationComments',
		type: 'textarea',
		label: 'Additional comments to post at PNT',
		tooltip: 'Optional, and only relevant if "List this article ..." above is checked.'
	}
] : []);

// Subgroups for {{merge}}, {{merge-to}} and {{merge-from}}
const getMergeSubgroups = function(tag) {
	let otherTagName = 'Merge';
	switch (tag) {
		case 'Merge from':
			otherTagName = 'Merge to';
			break;
		case 'Merge to':
			otherTagName = 'Merge from';
			break;
		// no default
	}
	return [
		{
			name: 'mergeTarget',
			type: 'input',
			label: 'Other article(s):',
			tooltip: 'If specifying multiple articles, separate them with pipe characters: Article one|Article two',
			required: true
		},
		{
			type: 'checkbox',
			list: [
				{
					name: 'mergeTagOther',
					label: 'Tag the other article with a {{' + otherTagName + '}} tag',
					checked: true,
					tooltip: 'Only available if a single article name is entered.'
				}
			]
		}
	].concat(mw.config.get('wgNamespaceNumber') === 0 ? {
		name: 'mergeReason',
		type: 'textarea',
		label: 'Rationale for merge (will be posted on ' +
			(tag === 'Merge to' ? 'the other article\'s' : 'this article\'s') + ' talk page):',
		tooltip: 'Optional, but strongly recommended. Leave blank if not wanted. Only available if a single article name is entered.'
	} : []);
};

// Tags arranged by category; will be used to generate the alphabetical list,
// but tags should be in alphabetical order within the categories
// excludeMI: true indicate a tag that *does not* work inside {{multiple issues}}
// Add new categories with discretion - the list is long enough as is!
Twinkle.tag.article.tagList = {
	'Cleanup and maintenance tags': {
		'General cleanup': [
			{
				tag: 'Cleanup', description: 'requires cleanup',
				subgroup: {
					name: 'cleanup',
					parameter: 'reason',
					type: 'input',
					label: 'Specific reason why cleanup is needed:',
					tooltip: 'Required.',
					size: 35,
					required: true
				}
			}, // has a subgroup with text input
			{
				tag: 'Cleanup rewrite',
				description: "needs to be rewritten entirely to comply with Wikipedia's quality standards"
			},
			{
				tag: 'Copy edit',
				description: 'requires copy editing for grammar, style, cohesion, tone, or spelling',
				subgroup: {
					name: 'copyEdit',
					parameter: 'for',
					type: 'input',
					label: '"This article may require copy editing for..."',
					tooltip: 'e.g. "consistent spelling". Optional.',
					size: 35
				}
			} // has a subgroup with text input
		],
		'Potentially unwanted content': [
			{
				tag: 'Close paraphrasing',
				description: 'contains close paraphrasing of a non-free copyrighted source',
				subgroup: {
					name: 'closeParaphrasing',
					parameter: 'source',
					type: 'input',
					label: 'Source:',
					tooltip: 'Source that has been closely paraphrased'
				}
			},
			{
				tag: 'Copypaste',
				description: 'appears to have been copied and pasted from another location',
				excludeMI: true,
				subgroup: {
					name: 'copypaste',
					parameter: 'url',
					type: 'input',
					label: 'Source URL:',
					tooltip: 'If known.',
					size: 50
				}
			}, // has a subgroup with text input
			{ tag: 'AI-generated', description: 'content appears to be generated by a large language model' },
			{ tag: 'External links', description: 'external links may not follow content policies or guidelines' },
			{ tag: 'Non-free', description: 'may contain excessive or improper use of copyrighted materials' }
		],
		'Structure, formatting, and lead section': [
			{ tag: 'Cleanup reorganize', description: "needs reorganization to comply with Wikipedia's layout guidelines" },
			{ tag: 'Lead missing', description: 'no lead section' },
			{ tag: 'Lead rewrite', description: 'lead section needs to be rewritten to comply with guidelines' },
			{ tag: 'Lead too long', description: 'lead section is too long for the length of the article' },
			{ tag: 'Lead too short', description: 'lead section is too short and should be expanded to summarize key points' },
			{ tag: 'Sections', description: 'needs to be divided into sections by topic' },
			{ tag: 'Too many sections', description: 'too many section headers dividing up content, should be condensed' },
			{ tag: 'Very long', description: 'too long to read and navigate comfortably' }
		],
		'Fiction-related cleanup': [
			{ tag: 'All plot', description: 'almost entirely a plot summary' },
			{ tag: 'Fiction', description: 'fails to distinguish between fact and fiction' },
			{ tag: 'In-universe', description: 'subject is fictional and needs rewriting to provide a non-fictional perspective' },
			{ tag: 'Long plot', description: 'plot summary is too long or excessively detailed' },
			{ tag: 'More plot', description: 'plot summary is too short' },
			{ tag: 'No plot', description: 'needs a plot summary' }
		]
	},
	'General content issues': {
		'Importance and notability': [
			{ tag: 'Notability', description: 'subject may not meet the general notability guideline',
				subgroup: {
					name: 'notability',
					parameter: '1',
					type: 'select',
					list: [
						{ label: "{{notability}}: article's subject may not meet the general notability guideline", value: '' },
						{ label: '{{notability|Academics}}: notability guideline for academics', value: 'Academics' },
						{ label: '{{notability|Astro}}: notability guideline for astronomical objects', value: 'Astro' },
						{ label: '{{notability|Biographies}}: notability guideline for biographies', value: 'Biographies' },
						{ label: '{{notability|Books}}: notability guideline for books', value: 'Books' },
						{ label: '{{notability|Companies}}: notability guideline for companies', value: 'Companies' },
						{ label: '{{notability|Events}}: notability guideline for events', value: 'Events' },
						{ label: '{{notability|Films}}: notability guideline for films', value: 'Films' },
						{ label: '{{notability|Geographic}}: notability guideline for geographic features', value: 'Geographic' },
						{ label: '{{notability|Lists}}: notability guideline for stand-alone lists', value: 'Lists' },
						{ label: '{{notability|Music}}: notability guideline for music', value: 'Music' },
						{ label: '{{notability|Neologisms}}: notability guideline for neologisms', value: 'Neologisms' },
						{ label: '{{notability|Numbers}}: notability guideline for numbers', value: 'Numbers' },
						{ label: '{{notability|Organizations}}: notability guideline for organizations', value: 'Organizations' },
						{ label: '{{notability|Products}}: notability guideline for products and services', value: 'Products' },
						{ label: '{{notability|Sports}}: notability guideline for sports and athletics', value: 'Sports' },
						{ label: '{{notability|Television}}: notability guideline for television shows', value: 'Television' },
						{ label: '{{notability|Web}}: notability guideline for web content', value: 'Web' }
					]
				}
			}
		],
		'Style of writing': [
			{ tag: 'Cleanup press release', description: 'reads like a press release or news article',
				subgroup: {
					type: 'hidden',
					name: 'cleanupPR1',
					parameter: '1',
					value: 'article'
				}
			},
			{ tag: 'Cleanup tense', description: 'does not follow guidelines on use of different tenses.' },
			{ tag: 'Essay-like', description: 'written like a personal reflection, personal essay, or argumentative essay' },
			{ tag: 'Fanpov', description: "written from a fan's point of view" },
			{ tag: 'Inappropriate person', description: 'uses first-person or second-person inappropiately' },
			{ tag: 'How-to', description: 'written like a manual or guidebook' },
			{ tag: 'Over-quotation', description: 'too many or too-lengthy quotations for an encyclopedic entry' },
			{ tag: 'Promotional', description: 'contains promotional content or is written like an advertisement' },
			{ tag: 'Prose', description: 'written in a list format but may read better as prose' },
			{ tag: 'Resume-like', description: 'written like a resume' },
			{ tag: 'Technical', description: 'too technical for most readers to understand' },
			{ tag: 'Tone', description: 'tone or style may not reflect the encyclopedic tone used on Wikipedia' }
		],
		'Sense (or lack thereof)': [
			{ tag: 'Confusing', description: 'confusing or unclear' },
			{ tag: 'Unfocused', description: 'lacks focus or is about more than one topic' }
		],
		'Information and detail': [
			{ tag: 'Context', description: 'insufficient context for those unfamiliar with the subject' },
			{ tag: 'Excessive examples', description: 'may contain indiscriminate, excessive, or irrelevant examples' },
			{ tag: 'Expert needed', description: 'needs attention from an expert on the subject',
				subgroup: [
					{
						name: 'expertNeeded',
						parameter: '1',
						type: 'input',
						label: 'Name of relevant WikiProject:',
						tooltip: 'Optionally, enter the name of a WikiProject which might be able to help recruit an expert. Don\'t include the "WikiProject" prefix.'
					},
					{
						name: 'expertNeededReason',
						parameter: 'reason',
						type: 'input',
						label: 'Reason:',
						tooltip: 'Short explanation describing the issue. Either Reason or Talk link is required.'
					},
					{
						name: 'expertNeededTalk',
						parameter: 'talk',
						type: 'input',
						label: 'Talk discussion:',
						tooltip: 'Name of the section of this article\'s talk page where the issue is being discussed. Do not give a link, just the name of the section. Either Reason or Talk link is required.'
					}
				]
			},
			{ tag: 'Overly detailed', description: 'excessive amount of intricate detail' },
			{ tag: 'Undue weight', description: 'lends undue weight to certain ideas, incidents, or controversies' }
		],
		Timeliness: [
			{ tag: 'Current', description: 'documents a current event', excludeMI: true }, // Works but not intended for use in MI
			{ tag: 'Current related', description: 'documents a topic affected by a current event', excludeMI: true }, // Works but not intended for use in MI
			{ tag: 'Update', description: 'needs additional up-to-date information added',
				subgroup: [
					{
						name: 'updatePart',
						parameter: 'part',
						type: 'input',
						label: 'What part of the article:',
						tooltip: 'Part that needs updating',
						size: '45'
					},
					{
						name: 'updateReason',
						parameter: 'reason',
						type: 'input',
						label: 'Reason:',
						tooltip: 'Explanation why the article is out of date',
						size: '55'
					}
				]
			}
		],
		'Neutrality, bias, and factual accuracy': [
			{ tag: 'Autobiography', description: 'autobiography and may not be written neutrally' },
			{ tag: 'COI', description: 'creator or major contributor may have a conflict of interest', subgroup: mw.config.get('wgNamespaceNumber') === 0 ? {
				name: 'coiReason',
				type: 'textarea',
				label: 'Explanation for COI tag (will be posted on this article\'s talk page):',
				tooltip: 'Optional, but strongly recommended. Leave blank if not wanted.'
			} : [] },
			{ tag: 'Disputed', description: 'questionable factual accuracy' },
			{ tag: 'Fringe theories', description: 'presents fringe theories as mainstream views' },
			{ tag: 'Globalize', description: 'may not represent a worldwide view of the subject',
				subgroup: [
					{
						type: 'hidden',
						name: 'globalize1',
						parameter: '1',
						value: 'article'
					}, {
						name: 'globalizeRegion',
						parameter: '2',
						type: 'input',
						label: 'Over-represented country or region'
					}
				]
			},
			{ tag: 'Hoax', description: 'may partially or completely be a hoax' },
			{ tag: 'Paid contributions', description: 'contains paid contributions, and may therefore require cleanup' },
			{ tag: 'Peacock', description: 'contains wording that promotes the subject in a subjective manner without adding information' },
			{ tag: 'POV', description: 'does not maintain a neutral point of view' },
			{ tag: 'Recentism', description: 'slanted towards recent events' },
			{ tag: 'Too few opinions', description: 'may not include all significant viewpoints' },
			{ tag: 'Undisclosed paid', description: 'may have been created or edited in return for undisclosed payments' },
			{ tag: 'Weasel', description: 'neutrality or verifiability is compromised by the use of weasel words' }
		],
		'Verifiability and sources': [
			{ tag: 'BLP no footnotes', description: 'BLP that lacks inline citations'},
			{ tag: 'BLP one source', description: 'BLP that relies largely or entirely on a single source' },
			{ tag: 'BLP sources', description: 'BLP that needs additional references or sources for verification' },
			{ tag: 'BLP unreferenced', description: 'BLP does not cite any sources at all (use BLP PROD instead for new articles)' },
			{ tag: 'More citations needed', description: 'needs additional references or sources for verification' },
			{ tag: 'No footnotes', description: 'has references, but lacks inline citations' },
			{ tag: 'No significant coverage', description: 'does not cite any sources containing significant coverage' },
			{ tag: 'No significant coverage (sports)', description: 'sports biography that does not cite any sources containing significant coverage' },
			{ tag: 'One source', description: 'relies largely or entirely on a single source' },
			{ tag: 'Only primary sources', description: 'relies only on references to primary sources, and needs secondary sources' },
			{ tag: 'Original research', description: 'contains original research' },
			{ tag: 'Primary sources', description: 'relies too much on references to primary sources, and needs secondary sources' },
			{ tag: 'Self-published', description: 'contains excessive or inappropriate references to self-published sources' },
			{ tag: 'Sources exist', description: 'notable topic, sources are available that could be added to article' },
			{ tag: 'Third-party', description: 'relies too heavily on sources too closely associated with the subject' },
			{ tag: 'Unreferenced', description: 'does not cite any sources at all' },
			{ tag: 'Unreliable sources', description: 'some references may not be reliable' },
			{ tag: 'User-generated', description: 'contains many references to user-generated (self-published) content'}
		]
	},
	'Specific content issues': {
		Accessibility: [
			{ tag: 'Cleanup colors', description: 'uses color as only way to convey information' },
			{ tag: 'Overcoloured', description: 'overuses color' },
			{ tag: 'Dark mode problems', description: 'has problems when viewed in dark mode' }
		],
		Language: [
			{ tag: 'Not English', description: 'written in a language other than English and needs translation',
				excludeMI: true,
				subgroup: translationSubgroups.slice(0, 1).concat([{
					type: 'checkbox',
					list: [
						{
							name: 'translationNotify',
							label: 'Notify article creator',
							checked: true,
							tooltip: "Places {{uw-notenglish}} on the creator's talk page."
						}
					]
				}]).concat(translationSubgroups.slice(1))
			},
			{ tag: 'Rough translation', description: 'poor translation from another language', excludeMI: true,
				subgroup: translationSubgroups
			},
			{ tag: 'Expand language', description: 'should be expanded with text translated from a foreign-language article',
				excludeMI: true,
				subgroup: [{
					type: 'hidden',
					name: 'expandLangTopic',
					parameter: 'topic',
					value: '',
					required: true // force empty topic param in output
				}, {
					name: 'expandLanguageLangCode',
					parameter: 'langcode',
					type: 'input',
					label: 'Language code:',
					tooltip: 'Language code of the language from which article is to be expanded from',
					required: true
				}, {
					name: 'expandLanguageArticle',
					parameter: 'otherarticle',
					type: 'input',
					label: 'Name of article:',
					tooltip: 'Name of article to be expanded from, without the interwiki prefix'
				}]
			}
		],
		Links: [
			{ tag: 'Dead end', description: 'article has no links to other articles' },
			{ tag: 'Orphan', description: 'linked to from no other articles' },
			{ tag: 'Overlinked', description: 'too many duplicate and/or irrelevant links to other articles' },
			{ tag: 'Underlinked', description: 'needs more wikilinks to other articles' }
		],
		'Referencing technique': [
			{ tag: 'Citation style', description: 'unclear or inconsistent citation style' },
			{ tag: 'Cleanup bare URLs', description: 'uses bare URLs for references, which are prone to link rot' },
			{ tag: 'More footnotes needed', description: 'has some references, but insufficient inline citations' },
			{ tag: 'Parenthetical referencing', description: 'uses parenthetical referencing, which is deprecated on Wikipedia' }
		],
		Categories: [
			{ tag: 'Improve categories', description: 'needs additional or more specific categories', excludeMI: true },
			{ tag: 'Uncategorized', description: 'not added to any categories', excludeMI: true }
		]
	},
	Merging: [
		{
			tag: 'History merge',
			description: 'another page should be history merged into this one',
			excludeMI: true,
			subgroup: [
				{
					name: 'histmergeOriginalPage',
					parameter: 'originalpage',
					type: 'input',
					label: 'Other article:',
					tooltip: 'Name of the page that should be merged into this one (required).',
					required: true
				},
				{
					name: 'histmergeReason',
					parameter: 'reason',
					type: 'input',
					label: 'Reason:',
					tooltip: 'Short explanation describing the reason a history merge is needed. Should probably begin with "because" and end with a period.'
				},
				{
					name: 'histmergeSysopDetails',
					parameter: 'details',
					type: 'input',
					label: 'Extra details:',
					tooltip: 'For complex cases, provide extra instructions for the reviewing administrator.'
				}
			]
		},
		{ tag: 'Merge', description: 'should be merged with another given article', excludeMI: true,
			subgroup: getMergeSubgroups('Merge') },
		{ tag: 'Merge from', description: 'another given article should be merged into this one', excludeMI: true,
			subgroup: getMergeSubgroups('Merge from') },
		{ tag: 'Merge to', description: 'should be merged into another given article', excludeMI: true,
			subgroup: getMergeSubgroups('Merge to') }
	],
	Splitting: [
		{ tag: 'Split', description: 'should be split into multiple pages' },
		{ tag: 'Split dab', description: 'disambiguation page should be split into multiple pages' }
	],
	Informational: [
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
		Abbreviation: [
			{ tag: 'R from acronym', description: 'redirect from an acronym (e.g. POTUS) to its expanded form', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from airport code', description: 'redirect from an airport\'s IATA or ICAO code to that airport\'s article', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from airline code', description: 'redirect from an airline\'s IATA or ICAO code to that airline\'s article', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from initialism', description: 'redirect from an initialism (e.g. AGF) to its expanded form', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from MathSciNet abbreviation', description: 'redirect from MathSciNet publication title abbreviation to the unabbreviated title', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from NLM abbreviation', description: 'redirect from a NLM publication title abbreviation to the unabbreviated title', restriction: 'insideMainspaceOnly' }
		],
		Capitalisation: [
			{ tag: 'R from CamelCase', description: 'redirect from a CamelCase title' },
			{ tag: 'R from other capitalisation', description: 'redirect from a title with another method of capitalisation', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from miscapitalisation', description: 'redirect from a capitalisation error' }
		],
		'Grammar & punctuation': [
			{ tag: 'R from modification', description: 'redirect from a modification of the target\'s title, such as with words rearranged' },
			{ tag: 'R from plural', description: 'redirect from a plural word to the singular equivalent', restriction: 'insideMainspaceOnly' },
			{ tag: 'R to plural', description: 'redirect from a singular noun to its plural form', restriction: 'insideMainspaceOnly' }
		],
		'Parts of speech': [
			{ tag: 'R from verb', description: 'redirect from an English-language verb or verb phrase', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from adjective', description: 'redirect from an adjective (word or phrase that describes a noun)', restriction: 'insideMainspaceOnly' }
		],
		Spelling: [
			{ tag: 'R from alternative spelling', description: 'redirect from a title with a different spelling' },
			{ tag: 'R from alternative transliteration', description: 'redirect from an alternative English transliteration to a more common variation' },
			{ tag: 'R from ASCII-only', description: 'redirect from a title in only basic ASCII to the formal title, with differences that are not diacritical marks or ligatures' },
			{ tag: 'R to ASCII-only', description: 'redirect to a title in only basic ASCII from the formal title, with differences that are not diacritical marks or ligatures' },
			{ tag: 'R from diacritic', description: 'redirect from a page name that has diacritical marks (accents, umlauts, etc.)' },
			{ tag: 'R to diacritic', description: 'redirect to the article title with diacritical marks (accents, umlauts, etc.)' },
			{ tag: 'R from misspelling', description: 'redirect from a misspelling or typographical error' }
		]
	},
	'Alternative names': {
		General: [
			{
				tag: 'R from alternative language',
				description: 'redirect from or to a title in another language',
				subgroup: [
					{
						name: 'altLangFrom',
						type: 'input',
						label: 'From language (two-letter code):',
						tooltip: 'Enter the two-letter code of the language the redirect name is in; such as en for English, de for German'
					},
					{
						name: 'altLangTo',
						type: 'input',
						label: 'To language (two-letter code):',
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
			{ tag: 'R from former name', description: 'redirect from a former or historic name or a working title', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from incomplete name', description: 'R from incomplete name' },
			{ tag: 'R from incorrect name', description: 'redirect from an erroneus name that is unsuitable as a title' },
			{ tag: 'R from less specific name', description: 'redirect from a less specific title to a more specific, less general one' },
			{ tag: 'R from long name', description: 'redirect from a more complete title' },
			{ tag: 'R from more specific name', description: 'redirect from a more specific title to a less specific, more general one' },
			{ tag: 'R from non-neutral name', description: 'redirect from a title that contains a non-neutral, pejorative, controversial, or offensive word, phrase, or name' },
			{ tag: 'R from short name', description: 'redirect from a title that is a shortened form of a person\'s full name, a book title, or other more complete title' },
			{ tag: 'R from sort name', description: 'redirect from the target\'s sort name, such as beginning with their surname rather than given name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from synonym', description: 'redirect from a semantic synonym of the target page title' }
		],
		People: [
			{ tag: 'R from birth name', description: 'redirect from a person\'s birth name to a more common name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from given name', description: 'redirect from a person\'s given name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from married name', description: 'redirect from a person\'s married name to a more common name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from name with title', description: 'redirect from a person\'s name preceded or followed by a title to the name with no title or with the title in parentheses', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from person', description: 'redirect from a person or persons to a related article', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from personal name', description: 'redirect from an individual\'s personal name to an article titled with their professional or other better known moniker', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from pseudonym', description: 'redirect from a pseudonym', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from surname', description: 'redirect from a title that is a surname', restriction: 'insideMainspaceOnly' }
		],
		Technical: [
			{ tag: 'R from drug trade name', description: 'redirect from (or to) the trade name of a drug to (or from) the international nonproprietary name (INN)' },
			{ tag: 'R from filename', description: 'redirect from a title that is a filename of the target', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from molecular formula', description: 'redirect from a molecular/chemical formula to its technical or trivial name' },

			{ tag: 'R from gene symbol', description: 'redirect from a Human Genome Organisation (HUGO) symbol for a gene to an article about the gene', restriction: 'insideMainspaceOnly' }
		],
		Organisms: [
			{ tag: 'R to scientific name', description: 'redirect from the common name to the scientific name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from scientific name', description: 'redirect from the scientific name to the common name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from alternative scientific name', description: 'redirect from an alternative scientific name to the accepted scientific name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from scientific abbreviation', description: 'redirect from a scientific abbreviation', restriction: 'insideMainspaceOnly' },
			{ tag: 'R to monotypic taxon', description: 'redirect from the only lower-ranking member of a monotypic taxon to its monotypic taxon', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from monotypic taxon', description: 'redirect from a monotypic taxon to its only lower-ranking member', restriction: 'insideMainspaceOnly' },
			{ tag: 'R taxon with possibilities', description: 'redirect from a title related to a living organism that potentially could be expanded into an article', restriction: 'insideMainspaceOnly' }
		],
		Geography: [
			{ tag: 'R from name and country', description: 'redirect from the specific name to the briefer name', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from more specific geographic name', description: 'redirect from a geographic location that includes extraneous identifiers such as the county or region of a city', restriction: 'insideMainspaceOnly' }
		]
	},
	'Navigation aids': {
		Navigation: [
			{ tag: 'R to anchor', description: 'redirect from a topic that does not have its own page to an anchored part of a page on the subject' },
			{
				tag: 'R avoided double redirect',
				description: 'redirect from an alternative title for another redirect',
				subgroup: {
					name: 'doubleRedirectTarget',
					type: 'input',
					label: 'Redirect target name',
					tooltip: 'Enter the page this redirect would target if the page wasn\'t also a redirect'
				}
			},
			{ tag: 'R from file metadata link', description: 'redirect of a wikilink created from EXIF, XMP, or other information (i.e. the "metadata" section on some image description pages)', restriction: 'insideMainspaceOnly' },
			{ tag: 'R to list entry', description: 'redirect to a list which contains brief descriptions of subjects not notable enough to have separate articles', restriction: 'insideMainspaceOnly' },

			{ tag: 'R mentioned in hatnote', description: 'redirect from a title that is mentioned in a hatnote at the redirect target' },
			{ tag: 'R to section', description: 'similar to {{R to list entry}}, but when list is organized in sections, such as list of characters in a fictional universe' },
			{ tag: 'R from shortcut', description: 'redirect from a Wikipedia shortcut' },
			{ tag: 'R to subpage', description: 'redirect to a subpage' }
		],
		Disambiguation: [
			{ tag: 'R from ambiguous term', description: 'redirect from an ambiguous page name to a page that disambiguates it. This template should never appear on a page that has "(disambiguation)" in its title, use R to disambiguation page instead' },
			{ tag: 'R to disambiguation page', description: 'redirect to a disambiguation page', restriction: 'disambiguationPagesOnly' },
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
		Namespace: [
			{ tag: 'R from remote talk page', description: 'redirect from a talk page in any talk namespace to a corresponding page that is more heavily watched', restriction: 'insideTalkNamespaceOnly' },
			{ tag: 'R to category namespace', description: 'redirect from a page outside the category namespace to a category page' },
			{ tag: 'R to help namespace', description: 'redirect from any page inside or outside of help namespace to a page in that namespace' },
			{ tag: 'R to main namespace', description: 'redirect from a page outside the main-article namespace to an article in mainspace' },
			{ tag: 'R to portal namespace', description: 'redirect from any page inside or outside of portal space to a page in that namespace' },
			{ tag: 'R to project namespace', description: 'redirect from any page inside or outside of project (Wikipedia: or WP:) space to any page in the project namespace' },
			{ tag: 'R to user namespace', description: 'redirect from a page outside the user namespace to a user page (not to a user talk page)', restriction: 'outsideUserspaceOnly' }
		]
	},
	Media: {
		General: [
			{ tag: 'R from album', description: 'redirect from an album to a related topic such as the recording artist or a list of albums', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from band name', description: 'redirect from a musical band or musical group name that redirects an article on a single person, i.e. the band or group leader' },
			{ tag: 'R from book', description: 'redirect from a book title to a more general, relevant article', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from cover song', description: 'redirect from a cover version of a song to the article about the original song this version covers' },
			{ tag: 'R from film', description: 'redirect from a film title that is a subtopic of the redirect target or a title in an alternative language that has been produced in that language', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from journal', description: 'redirect from a trade or professional journal article a more general, relevant Wikipedia article, such as the author or publisher of the article or to the title in an alternative language' },
			{ tag: 'R from lyric', description: 'redirect from a lyric to a song or other source that describes the lyric' },
			{ tag: 'R from meme', description: 'redirect from a name of an internet meme or other pop culture phenomenon that is a subtopic of the redirect target' },
			{ tag: 'R from song', description: 'redirect from a song title to a more general, relevant article' },
			{ tag: 'R from television episode', description: 'redirect from a television episode title to a related work or lists of episodes', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from television program', description: 'redirect from a title of television program, television series or web series that is a subtopic of the redirect target' },
			{ tag: 'R from upcoming film', description: 'redirect from a title that potentially could be expanded into a new article or other type of associated page such as a new template.' },
			{ tag: 'R from work', description: 'redirect from a creative work a related topic such as the author/artist, publisher, or a subject related to the work' }
		],
		Fiction: [
			{ tag: 'R from fictional character', description: 'redirect from a fictional character to a related fictional work or list of characters', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from fictional element', description: 'redirect from a fictional element (such as an object or concept) to a related fictional work or list of similar elements', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from fictional location', description: 'redirect from a fictional location or setting to a related fictional work or list of places', restriction: 'insideMainspaceOnly' }
		]
	},
	Miscellaneous: {
		'Related information': [
			{ tag: 'R to article without mention', description: 'redirect to an article without any mention of the redirected word or phrase', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from company name', description: 'redirect from a company name to a related article', restriction: 'insideMainspaceOnly' },
			{ tag: 'R to decade', description: 'redirect from a year to the decade article', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from domain name', description: 'redirect from a domain name to an article about a website', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from emoji', description: 'redirect from an emoji to an article describing the depicted concept or the emoji itself' },
			{ tag: 'R from phrase', description: 'redirect from a phrase to a more general relevant article covering the topic' },
			{ tag: 'R from list topic', description: 'redirect from the topic of a list to the equivalent list' },
			{ tag: 'R from member', description: 'redirect from a member of a group to a related topic such as the group or organization' },
			{ tag: 'R to related topic', description: 'redirect to an article about a similar topic', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from related word', description: 'redirect from a related word' },
			{ tag: 'R from school', description: 'redirect from a school article that had very little information', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from subtopic', description: 'redirect from a title that is a subtopic of the target article', restriction: 'insideMainspaceOnly' },
			{ tag: 'R to subtopic', description: 'redirect to a subtopic of the redirect\'s title', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from Unicode character', description: 'redirect from a single Unicode character to an article or Wikipedia project page that infers meaning for the symbol', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from Unicode code', description: 'redirect from a Unicode code point to an article about the character it represents', restriction: 'insideMainspaceOnly' }
		],
		'With possibilities': [
			{ tag: 'R with possibilities', description: 'redirect from a specific title to a more general, less detailed article (something which can and should be expanded)' }
		],
		'ISO codes': [
			{ tag: 'R from ISO 4 abbreviation', description: 'redirect from an ISO 4 publication title abbreviation to the unabbreviated title', restriction: 'insideMainspaceOnly' },
			{ tag: 'R from ISO 639 code', description: 'redirect from a title that is an ISO 639 language code to an article about the language', restriction: 'insideMainspaceOnly' }
		],
		Printworthiness: [
			{ tag: 'R printworthy', description: 'redirect from a title that would be helpful in a printed or CD/DVD version of Wikipedia', restriction: 'insideMainspaceOnly' },
			{ tag: 'R unprintworthy', description: 'redirect from a title that would NOT be helpful in a printed or CD/DVD version of Wikipedia', restriction: 'insideMainspaceOnly' }
		]
	}
};

// maintenance tags for FILES start here

Twinkle.tag.fileList = {
	'License and sourcing problem tags': [
		{ label: '{{Better source requested}}: source info consists of bare image URL/generic base URL only', value: 'Better source requested' },
		{ label: '{{Maybe free media}}: currently tagged under non-free license, but free license may be available ', value: 'Maybe free media' },
		{ label: '{{Non-free reduce}}: non-low-resolution fair use image (or too-long audio clip, etc)', value: 'Non-free reduce' },
		{ label: '{{Orphaned non-free revisions}}: fair use media with old revisions that need to be deleted', value: 'Orphaned non-free revisions' }
	],
	'Wikimedia Commons-related tags': [
		{ label: '{{Copy to Commons}}: free media that should be copied to Commons', value: 'Copy to Commons' },
		{
			label: '{{Deleted on Commons}}: file has previously been deleted from Commons',
			value: 'Deleted on Commons',
			subgroup: {
				type: 'input',
				name: 'deletedOnCommonsName',
				label: 'Name on Commons:',
				tooltip: 'Name of the image on Commons (if different from local name), excluding the File: prefix'
			}
		},
		{
			label: '{{Do not move to Commons}}: file not suitable for moving to Commons',
			value: 'Do not move to Commons',
			subgroup: [
				{
					type: 'input',
					name: 'DoNotMoveToCommons_reason',
					label: 'Reason:',
					tooltip: 'Enter the reason why this image should not be moved to Commons (required). If the file is PD in the US but not in country of origin, enter "US only"',
					required: true
				},
				{
					type: 'number',
					name: 'DoNotMoveToCommons_expiry',
					label: 'Expiration year:',
					min: new Morebits.Date().getFullYear(),
					tooltip: 'If this file can be moved to Commons beginning in a certain year, you can enter it here (optional).'
				}
			]
		},
		{
			label: '{{Keep local}}: request to keep local copy of a Commons file',
			value: 'Keep local',
			subgroup: {
				type: 'input',
				name: 'keeplocalName',
				label: 'Commons image name if different:',
				tooltip: 'Name of the image on Commons (if different from local name), excluding the File: prefix:'
			}
		},
		{
			label: '{{Nominated for deletion on Commons}}: file is nominated for deletion on Commons',
			value: 'Nominated for deletion on Commons',
			subgroup: {
				type: 'input',
				name: 'nominatedOnCommonsName',
				label: 'Name on Commons:',
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
		{ label: '{{Bad SVG}}: SVG with a mix of raster and vector graphics', value: 'Bad SVG' },
		{ label: '{{Bad trace}}: auto-traced SVG requiring cleanup', value: 'Bad trace' },
		{
			label: '{{Cleanup image}}: general cleanup', value: 'Cleanup image',
			subgroup: {
				type: 'input',
				name: 'cleanupimageReason',
				label: 'Reason:',
				tooltip: 'Enter the reason for cleanup (required)',
				required: true
			}
		},
		{ label: '{{ClearType}}: image (not screenshot) with ClearType anti-aliasing', value: 'ClearType' },
		{ label: '{{Fake SVG}}: SVG solely containing raster graphics without true vector content', value: 'Fake SVG' },
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
					label: 'New name:',
					tooltip: 'Enter the new name for the image (optional)'
				},
				{
					type: 'input',
					name: 'renamemediaReason',
					label: 'Reason:',
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
				label: 'Reason:',
				tooltip: 'Enter the reason why this image is so bad (required)',
				required: true
			}
		},
		{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
		{
			label: '{{Low quality chem}}: disputed chemical structures', value: 'Low quality chem',
			subgroup: {
				type: 'input',
				name: 'lowQualityChemReason',
				label: 'Reason:',
				tooltip: 'Enter the reason why the diagram is disputed (required)',
				required: true
			}
		}
	],
	'Replacement tags': [
		{ label: '{{Obsolete}}: improved version available', value: 'Obsolete' },
		{ label: '{{PNG version available}}', value: 'PNG version available' },
		{ label: '{{Vector version available}}', value: 'Vector version available' }
	]
};
Twinkle.tag.fileList['Replacement tags'].forEach((el) => {
	el.subgroup = {
		type: 'input',
		label: 'Replacement file:',
		tooltip: 'Enter the name of the file which replaces this one (required)',
		name: el.value.replace(/ /g, '_') + 'File',
		required: true
	};
});

Twinkle.tag.callbacks = {
	article: function articleCallback(pageobj) {

		// Remove tags that become superfluous with this action
		let pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
		const params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		const postRemoval = function() {
			if (params.tagsToRemove.length) {
				// Remove empty {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(multiple ?issues|article ?issues|mi)\s*\|\s*\}\}\n?/im, '');
				// Remove single-element {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(?:multiple ?issues|article ?issues|mi)\s*\|\s*(\{\{[^}]+\}\})\s*\}\}/im, '$1');
			}

			// Build edit summary
			const makeSentence = function(array) {
				if (array.length < 3) {
					return array.join(' and ');
				}
				const last = array.pop();
				return array.join(', ') + ', and ' + last;
			};
			const makeTemplateLink = function(tag) {
				let text = '{{[[';
				// if it is a custom tag with a parameter
				if (tag.includes('|')) {
					tag = tag.slice(0, tag.indexOf('|'));
				}
				text += tag.includes(':') ? tag : 'Template:' + tag + '|' + tag;
				return text + ']]}}';
			};

			let summaryText;
			const addedTags = params.tags.map(makeTemplateLink);
			const removedTags = params.tagsToRemove.map(makeTemplateLink);
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
			if ((mw.config.get('wgNamespaceNumber') === 0 && Twinkle.getPref('watchTaggedVenues').includes('articles')) || (mw.config.get('wgNamespaceNumber') === 118 && Twinkle.getPref('watchTaggedVenues').includes('drafts'))) {
				pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			}
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(() => {
				// COI: Start the discussion on the talk page (mainspace only)
				if (params.coiReason) {
					const coiTalkPage = new Morebits.wiki.Page('Talk:' + Morebits.pageNameNorm, 'Starting discussion on talk page');
					coiTalkPage.setNewSectionText(params.coiReason + ' ~~~~');
					coiTalkPage.setNewSectionTitle('COI tag (' + new Morebits.Date(pageobj.getLoadTime()).format('MMMM Y', 'utc') + ')');
					coiTalkPage.setChangeTags(Twinkle.changeTags);
					coiTalkPage.setCreateOption('recreate');
					coiTalkPage.newSection();
				}

				// Special functions for merge tags
				// Post a rationale on the talk page (mainspace only)
				if (params.mergeReason) {
					const mergeTalkPage = new Morebits.wiki.Page('Talk:' + params.discussArticle, 'Posting rationale on talk page');
					mergeTalkPage.setNewSectionText(params.mergeReason.trim() + ' ~~~~');
					mergeTalkPage.setNewSectionTitle(params.talkDiscussionTitleLinked);
					mergeTalkPage.setChangeTags(Twinkle.changeTags);
					mergeTalkPage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
					mergeTalkPage.setCreateOption('recreate');
					mergeTalkPage.newSection();
				}
				// Tag the target page (if requested)
				if (params.mergeTagOther) {
					let otherTagName = 'Merge';
					if (params.mergeTag === 'Merge from') {
						otherTagName = 'Merge to';
					} else if (params.mergeTag === 'Merge to') {
						otherTagName = 'Merge from';
					}
					const newParams = {
						tags: [otherTagName],
						tagsToRemove: [],
						tagsToRemain: [],
						mergeTarget: Morebits.pageNameNorm,
						discussArticle: params.discussArticle,
						talkDiscussionTitle: params.talkDiscussionTitle,
						talkDiscussionTitleLinked: params.talkDiscussionTitleLinked
					};
					const otherpage = new Morebits.wiki.Page(params.mergeTarget, 'Tagging other page (' +
						params.mergeTarget + ')');
					otherpage.setChangeTags(Twinkle.changeTags);
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
				}

				// Special functions for {{not English}} and {{rough translation}}
				// Post at WP:PNT (mainspace only)
				if (params.translationPostAtPNT) {
					const pntPage = new Morebits.wiki.Page('Wikipedia:Pages needing translation into English',
						'Listing article at Wikipedia:Pages needing translation into English');
					pntPage.setFollowRedirect(true);
					pntPage.load((pageobj) => {
						const oldText = pageobj.getPageText();

						const lang = params.translationLanguage;
						const reason = params.translationComments;

						let templateText;

						let text, summary;
						if (params.tags.includes('Rough translation')) {
							templateText = '{{subst:Dual fluency request|pg=' + Morebits.pageNameNorm + '|Language=' +
							(lang || 'uncertain') + '|Comments=' + reason.trim() + '}} ~~~~';
							// Place in section == Translated pages that could still use some cleanup ==
							text = oldText + '\n\n' + templateText;
							summary = 'Translation cleanup requested on ';
						} else if (params.tags.includes('Not English')) {
							templateText = '{{subst:Translation request|pg=' + Morebits.pageNameNorm + '|Language=' +
							(lang || 'uncertain') + '|Comments=' + reason.trim() + '}} ~~~~';
							// Place in section == Pages for consideration ==
							text = oldText.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
								'\n\n' + templateText + '\n\n$1');
							summary = 'Translation' + (lang ? ' from ' + lang : '') + ' requested on ';
						}

						if (text === oldText) {
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
				// Notify the user ({{Not English}} only)
				if (params.translationNotify) {
					new Morebits.wiki.Page(Morebits.pageNameNorm).lookupCreation((innerPageobj) => {
						const initialContrib = innerPageobj.getCreator();

						// Disallow warning yourself
						if (initialContrib === mw.config.get('wgUserName')) {
							innerPageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
							return;
						}

						const userTalkPage = new Morebits.wiki.Page('User talk:' + initialContrib,
							'Notifying initial contributor (' + initialContrib + ')');
						userTalkPage.setNewSectionTitle('Your article [[' + Morebits.pageNameNorm + ']]');
						userTalkPage.setNewSectionText('{{subst:uw-notenglish|1=' + Morebits.pageNameNorm +
							(params.translationPostAtPNT ? '' : '|nopnt=yes') + '}} ~~~~');
						userTalkPage.setEditSummary('Notice: Please use English when contributing to the English Wikipedia.');
						userTalkPage.setChangeTags(Twinkle.changeTags);
						userTalkPage.setCreateOption('recreate');
						userTalkPage.setFollowRedirect(true, false);
						userTalkPage.newSection();
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
		const removeTags = function removeTags() {

			if (params.tagsToRemove.length === 0) {
				postRemoval();
				return;
			}

			Morebits.Status.info('Info', 'Removing deselected tags that were already present');

			const getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach((tag) => {
				const tagRegex = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');

				if (tagRegex.test(pageText)) {
					pageText = pageText.replace(tagRegex, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			const api = new Morebits.wiki.Api('Getting template redirects', {
				action: 'query',
				prop: 'linkshere',
				titles: getRedirectsFor.join('|'),
				redirects: 1, // follow redirect if the class name turns out to be a redirect page
				lhnamespace: '10', // template namespace only
				lhshow: 'redirect',
				lhlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			}, ((apiobj) => {
				const pages = apiobj.getResponse().query.pages.filter((p) => !p.missing && !!p.linkshere);
				pages.forEach((page) => {
					let removed = false;
					page.linkshere.concat({title: page.title}).forEach((el) => {
						const tag = el.title.slice(9);
						const tagRegex = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
						if (tagRegex.test(pageText)) {
							pageText = pageText.replace(tagRegex, '');
							removed = true;
							return false; // break out of $.each
						}
					});
					if (!removed) {
						Morebits.Status.warn('Info', 'Failed to find {{' +
						page.title.slice(9) + '}} on the page... excluding');
					}

				});

				postRemoval();

			}));
			api.post();

		};

		if (!params.tags.length) {
			removeTags();
			return;
		}

		let tagRe, tagText = '', tags = [];
		const groupableTags = [], groupableExistingTags = [];
		// Executes first: addition of selected tags

		/**
		 * Updates `tagText` with the syntax of `tagName` template with its parameters
		 *
		 * @param {number} tagIndex
		 * @param {string} tagName
		 */
		const addTag = function articleAddTag(tagIndex, tagName) {
			let currentTag = '';
			if (tagName === 'Uncategorized' || tagName === 'Improve categories') {
				pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				currentTag += '{{' + tagName;
				// fill in other parameters, based on the tag

				const subgroupObj = Twinkle.tag.article.flatObject[tagName] &&
					Twinkle.tag.article.flatObject[tagName].subgroup;
				if (subgroupObj) {
					const subgroups = Array.isArray(subgroupObj) ? subgroupObj : [ subgroupObj ];
					subgroups.forEach((gr) => {
						if (gr.parameter && (params[gr.name] || gr.required)) {
							currentTag += '|' + gr.parameter + '=' + (params[gr.name] || '');
						}
					});
				}

				switch (tagName) {
					case 'Not English':
					case 'Rough translation':
						if (params.translationPostAtPNT) {
							currentTag += '|listed=yes';
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
								const direction = '[[' + params.nonDiscussArticle + ']]' + (params.mergeTag === 'Merge' ? ' with ' : ' into ') + '[[' + params.discussArticle + ']]';
								params.talkDiscussionTitleLinked = 'Proposed merge of ' + direction;
								params.talkDiscussionTitle = params.talkDiscussionTitleLinked.replace(/\[\[(.*?)\]\]/g, '$1');
							}
							const titleWithSectionRemoved = params.discussArticle.replace(/^([^#]*)#.*$/, '$1'); // If article name is Test#Section, delete #Section
							currentTag += '|discuss=Talk:' + titleWithSectionRemoved + '#' + params.talkDiscussionTitle;
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
		const addUngroupedTags = function() {
			$.each(tags, addTag);

			// Insert tag after short description or any hatnotes,
			// as well as deletion/protection-related templates
			const wikipage = new Morebits.wikitext.Page(pageText);
			const templatesAfter = Twinkle.hatnoteRegex +
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
			const afdRegex = '(?:<!--.*AfD.*\\n\\{\\{(?:Article for deletion\\/dated|AfDM).*\\}\\}\\n<!--.*(?:\\n<!--.*)?AfD.*(?:\\s*\\n))?';
			pageText = wikipage.insertAfterTemplates(tagText, templatesAfter, null, afdRegex).getText();

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach((tag) => {
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
					Morebits.Status.warn('Info', 'Found {{' + tag +
						'}} on the article already...excluding');
					// don't do anything else with merge tags
					if (['Merge', 'Merge to'].includes(tag)) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		// To-be-retained existing tags that are groupable
		params.tagsToRemain.forEach((tag) => {
			// If the tag is unknown to us, we consider it non-groupable
			if (Twinkle.tag.article.flatObject[tag] && !Twinkle.tag.article.flatObject[tag].excludeMI) {
				groupableExistingTags.push(tag);
			}
		});

		const miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

		if (miTest && groupableTags.length > 0) {
			Morebits.Status.info('Info', 'Adding supported tags inside existing {{multiple issues}} tag');

			tagText = '';
			$.each(groupableTags, addTag);

			const miRegex = new RegExp('(\\{\\{\\s*' + miTest[1] + '\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*', 'im');
			pageText = pageText.replace(miRegex, '$1' + tagText + '}}\n');
			tagText = '';

			addUngroupedTags();

		} else if (params.group && !miTest && (groupableExistingTags.length + groupableTags.length) >= 2) {
			Morebits.Status.info('Info', 'Grouping supported tags inside {{multiple issues}}');

			tagText += '{{Multiple issues|\n';

			/**
			 * Adds newly added tags to MI
			 */
			const addNewTagsToMI = function() {
				$.each(groupableTags, addTag);
				tagText += '}}\n';

				addUngroupedTags();
			};

			const getRedirectsFor = [];

			// Reposition the tags on the page into {{multiple issues}}, if found with its
			// proper name, else moves it to `getRedirectsFor` array to be handled later
			groupableExistingTags.forEach((tag) => {
				const tagRegex = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?)');
				if (tagRegex.test(pageText)) {
					tagText += tagRegex.exec(pageText)[1];
					pageText = pageText.replace(tagRegex, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				addNewTagsToMI();
				return;
			}

			const api = new Morebits.wiki.Api('Getting template redirects', {
				action: 'query',
				prop: 'linkshere',
				titles: getRedirectsFor.join('|'),
				redirects: 1,
				lhnamespace: '10', // template namespace only
				lhshow: 'redirect',
				lhlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			}, ((apiobj) => {
				const pages = apiobj.getResponse().query.pages.filter((p) => !p.missing && !!p.linkshere);
				pages.forEach((page) => {
					let found = false;
					page.linkshere.forEach((el) => {
						const tag = el.title.slice(9);
						const tagRegex = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?)');
						if (tagRegex.test(pageText)) {
							tagText += tagRegex.exec(pageText)[1];
							pageText = pageText.replace(tagRegex, '');
							found = true;
							return false; // break out of $.each
						}
					});
					if (!found) {
						Morebits.Status.warn('Info', 'Failed to find the existing {{' +
						page.title.slice(9) + '}} on the page... skip repositioning');
					}
				});
				addNewTagsToMI();
			}));
			api.post();

		} else {
			tags = tags.concat(groupableTags);
			addUngroupedTags();
		}
	},

	redirect: function redirect(pageobj) {
		const params = pageobj.getCallbackParameters(),
			tags = [];
		let pageText = pageobj.getPageText(),
			tagRe, tagText = '',
			summaryText = 'Added',
			i;

		for (i = 0; i < params.tags.length; i++) {
			tagRe = new RegExp('(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im');
			if (!tagRe.exec(pageText)) {
				tags.push(params.tags[i]);
			} else {
				Morebits.Status.warn('Info', 'Found {{' + params.tags[i] +
					'}} on the redirect already...excluding');
			}
		}

		const addTag = function redirectAddTag(tagIndex, tagName) {
			tagText += '\n{{' + tagName;
			if (tagName === 'R from alternative language') {
				if (params.altLangFrom) {
					tagText += '|from=' + params.altLangFrom;
				}
				if (params.altLangTo) {
					tagText += '|to=' + params.altLangTo;
				}
			} else if (tagName === 'R avoided double redirect' && params.doubleRedirectTarget) {
				tagText += '|1=' + params.doubleRedirectTarget;
			}
			tagText += '}}';

			if (tagIndex > 0) {
				if (tagIndex === (tags.length - 1)) {
					summaryText += ' and';
				} else if (tagIndex < (tags.length - 1)) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[:' + (tagName.includes(':') ? tagName : 'Template:' + tagName + '|' + tagName) + ']]}}';
		};

		if (!tags.length) {
			Morebits.Status.warn('Info', 'No tags remaining to apply');
		}

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
			// Regex inspired by [[User:Kephir/gadgets/sagittarius.js]] ([[Special:PermaLink/831402893]])
			const oldTags = pageText.match(/(\s*{{[A-Za-z\s]+\|(?:\s*1=)?)((?:[^|{}]|{{[^}]+}})+)(}})\s*/i);
			pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			const pageTags = pageText.match(/\s*{{R(?:edirect)? .*?}}/img);
			let oldPageTags = '';
			if (pageTags) {
				pageTags.forEach((pageTag) => {
					const pageRe = new RegExp(Morebits.string.escapeRegExp(pageTag), 'img');
					pageText = pageText.replace(pageRe, '');
					pageTag = pageTag.trim();
					oldPageTags += '\n' + pageTag;
				});
			}
			pageText = pageText.trim() + '\n\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
		}

		summaryText += (tags.length > 0 ? ' tag' + (tags.length > 1 ? 's' : ' ') : ' {{[[Template:Redirect category shell|Redirect category shell]]}}') + ' to redirect';

		// avoid truncated summaries
		if (summaryText.length > 499) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText);
		if (Twinkle.getPref('watchTaggedVenues').includes('redirects')) {
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		}
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
		}

	},

	file: function twinkletagCallbacksFile(pageobj) {
		let text = pageobj.getPageText();
		const params = pageobj.getCallbackParameters();
		let summary = 'Adding ';

		// Add maintenance tags
		if (params.tags.length) {

			let tagtext = '', currentTag;
			$.each(params.tags, (k, tag) => {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (['Keep local', 'Do not move to Commons'].includes(tag)) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}

				currentTag = tag;

				switch (tag) {
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
					case 'Do not move to Commons':
						currentTag += '|reason=' + params.DoNotMoveToCommons_reason;
						if (params.DoNotMoveToCommons_expiry) {
							currentTag += '|expiry=' + params.DoNotMoveToCommons_expiry;
						}
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
					case 'Nominated for deletion on Commons':
						if (params.nominatedOnCommonsName !== '') {
							currentTag += '|1=' + params.nominatedOnCommonsName;
						}
						break;
					case 'Deleted on Commons':
						if (params.deletedOnCommonsName !== '') {
							currentTag += '|1=' + params.deletedOnCommonsName;
						}
						break;
					default:
						break; // don't care
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
		if (Twinkle.getPref('watchTaggedVenues').includes('files')) {
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		}
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
		}
	}
};

/**
 * Given an array of incompatible tags, check if we have two or more selected
 *
 * @param {Array} incompatibleTags
 * @param {Array} tagsToCheck
 * @param {string} [extraMessage]
 * @return {true|undefined}
 */
Twinkle.tag.checkIncompatible = function(incompatibleTags, tagsToCheck, extraMessage = null) {
	const count = incompatibleTags.filter((tag) => tagsToCheck.includes(tag)).length;
	if (count > 1) {
		const incompatibleTagsString = '{{' + incompatibleTags.join('}}, {{') + '}}';
		let message = 'Please select only one of: ' + incompatibleTagsString + '.';
		message += extraMessage ? ' ' + extraMessage : '';
		alert(message);
		return true;
	}
};

Twinkle.tag.callback.evaluate = function twinkletagCallbackEvaluate(e) {
	const form = e.target;
	const params = Morebits.QuickForm.getInputData(form);

	// Validation

	// We could theoretically put them all checkIncompatible calls in a
	// forEach loop, but it's probably clearer not to have [[array one],
	// [array two]] devoid of context.
	switch (Twinkle.tag.mode) {
		case 'article':
			params.tagsToRemove = form.getUnchecked('existingTags'); // not in `input`
			params.tagsToRemain = params.existingTags || []; // container not created if none present

			if ((params.tags.includes('Merge')) || (params.tags.includes('Merge from')) ||
				(params.tags.includes('Merge to'))) {
				if (Twinkle.tag.checkIncompatible(['Merge', 'Merge from', 'Merge to'], params.tags, 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).')) {
					return;
				}
				if ((params.mergeTagOther || params.mergeReason) && params.mergeTarget.includes('|')) {
					alert('Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.');
					return;
				}
			}

			if (Twinkle.tag.checkIncompatible(['Not English', 'Rough translation'], params.tags)) {
				return;
			}
			break;

		case 'file':
			if (Twinkle.tag.checkIncompatible(['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'], params.tags)) {
				return;
			}
			if (Twinkle.tag.checkIncompatible(['Should be PNG', 'Should be SVG', 'Should be text'], params.tags)) {
				return;
			}
			if (Twinkle.tag.checkIncompatible(['Bad SVG', 'Vector version available'], params.tags)) {
				return;
			}
			if (Twinkle.tag.checkIncompatible(['Bad JPEG', 'Overcompressed JPEG'], params.tags)) {
				return;
			}
			if (Twinkle.tag.checkIncompatible(['PNG version available', 'Vector version available'], params.tags)) {
				return;
			}

			// Get extension from either mime-type or title, if not present (e.g., SVGs)
			var extension = ((extension = $('.mime-type').text()) && extension.split(/\//)[1]) || mw.Title.newFromText(Morebits.pageNameNorm).getExtension();
			if (extension) {
				const extensionUpper = extension.toUpperCase();

				// What self-respecting file format has *two* extensions?!
				if (extensionUpper === 'JPG') {
					extension = 'JPEG';
				}

				// Check that selected templates make sense given the file's extension.

				// {{Bad GIF|JPEG|SVG}}, {{Fake SVG}}
				if (extensionUpper !== 'GIF' && params.tags.includes('Bad GIF')) {
					alert('This appears to be a ' + extension + ' file, so {{Bad GIF}} is inappropriate.');
					return;
				} else if (extensionUpper !== 'JPEG' && params.tags.includes('Bad JPEG')) {
					alert('This appears to be a ' + extension + ' file, so {{Bad JPEG}} is inappropriate.');
					return;
				} else if (extensionUpper !== 'SVG' && params.tags.includes('Bad SVG')) {
					alert('This appears to be a ' + extension + ' file, so {{Bad SVG}} is inappropriate.');
					return;
				} else if (extensionUpper !== 'SVG' && params.tags.includes('Fake SVG')) {
					alert('This appears to be a ' + extension + ' file, so {{Fake SVG}} is inappropriate.');
					return;
				}

				// {{Should be PNG|SVG}}
				if (params.tags.includes('Should be ' + extensionUpper)) {
					alert('This is already a ' + extension + ' file, so {{Should be ' + extensionUpper + '}} is inappropriate.');
					return;
				}

				// {{Overcompressed JPEG}}
				if (params.tags.includes('Overcompressed JPEG') && extensionUpper !== 'JPEG') {
					alert('This appears to be a ' + extension + ' file, so {{Overcompressed JPEG}} probably doesn\'t apply.');
					return;
				}

				// {{Bad trace}} and {{Bad font}}
				if (extensionUpper !== 'SVG') {
					if (params.tags.includes('Bad trace')) {
						alert('This appears to be a ' + extension + ' file, so {{Bad trace}} probably doesn\'t apply.');
						return;
					} else if (params.tags.includes('Bad font')) {
						alert('This appears to be a ' + extension + ' file, so {{Bad font}} probably doesn\'t apply.');
						return;
					}
				}
			}

			// {{Do not move to Commons}}
			if (
				params.tags.includes('Do not move to Commons') &&
				params.DoNotMoveToCommons_expiry &&
				(
					!/^2\d{3}$/.test(params.DoNotMoveToCommons_expiry) ||
					parseInt(params.DoNotMoveToCommons_expiry, 10) <= new Date().getFullYear()
				)
			) {
				alert('Must be a valid future year.');
				return;
			}

			break;

		case 'redirect':
			if (Twinkle.tag.checkIncompatible(['R printworthy', 'R unprintworthy'], params.tags)) {
				return;
			}
			if (Twinkle.tag.checkIncompatible(['R from subtopic', 'R to subtopic'], params.tags)) {
				return;
			}
			if (Twinkle.tag.checkIncompatible([
				'R to category namespace',
				'R to help namespace',
				'R to main namespace',
				'R to portal namespace',
				'R to project namespace',
				'R to user namespace'
			], params.tags)) {
				return;
			}
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

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = 'Tagging complete, reloading article in a few seconds';
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	const wikipediaPage = new Morebits.wiki.Page(Morebits.pageNameNorm, 'Tagging ' + Twinkle.tag.mode);
	wikipediaPage.setCallbackParameters(params);
	wikipediaPage.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipediaPage.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);

};

Twinkle.addInitCallback(Twinkle.tag, 'tag');
}());
// </nowiki>
