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
	if ([0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 && mw.config.get('wgCurRevisionId')) {
		Twinkle.tag.mode = 'article';
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove = (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Label', 'friendly-tag', 'Onderhoudslabels toevoegen of verwijderen');
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow(630, Twinkle.tag.mode === 'article' ? 500 : 400);
	Window.setScriptName('Twinkle');
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink('Tag instellingen', 'WP:TW/PREF#tag');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#tag');

	var form = new Morebits.quickForm(Twinkle.tag.callback.evaluate);

	form.append({
		type: 'input',
		label: 'Label zoeken: ',
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
			Window.setTitle('Artikel onderhoud labeling');

			// Object.values is unavailable in IE 11
			var obj_values = Object.values || function (obj) {
				return Object.keys(obj).map(function (key) {
					return obj[key];
				});
			};

			// Build sorting and lookup object flatObject, which is always
			// needed but also used to generate the alphabetical list
			Twinkle.tag.article.flatObject = {};
			obj_values(Twinkle.tag.article.tagList).forEach(function (group) {
				obj_values(group).forEach(function (subgroup) {
					if (Array.isArray(subgroup)) {
						subgroup.forEach(function (item) {
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
				label: 'Toon deze lijst:',
				tooltip: 'Je kunt de standaard sortering aanpassen op het Twinkle configuratiescherm.',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'Op categorie', selected: Twinkle.getPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'Op alfabet', selected: Twinkle.getPref('tagArticleSortOrder') === 'alpha' }
				]
			});


			if (!Twinkle.tag.canRemove) {
				var divElement = document.createElement('div');
				divElement.innerHTML = 'Voor het verwijderen van bestaande sjablonen, open het Label menu in de huidige versie van het artikel';
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
				type: 'input',
				label: 'Bewerkingssamenvatting',
				name: 'reason',
				tooltip: '(Optioneel) Aanbevolen als je sjablonen hebt verwijderd. Namen van toegevoegde en verwijderde sjablonen staan standaard in de BWS',
				size: '50px'
			});

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
					label: 'Markeer als gecontroleerd',
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
	$allHeaders = $(result).find('h5, .quickformDescription');
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

				// All tags have their first class name as "label-" + template name
				if (e.className.indexOf('label-') === 0) {
					var tag = e.classList[0].slice('label-'.length).replace(/_/g, ' ');
					Twinkle.tag.alreadyPresentTags.push(tag);
				}
			});

			// {{Beginnetje}} is usually placed at the end of the page
			if ($('.beginnetje').length) {
				Twinkle.tag.alreadyPresentTags.push('Beginnetje');
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
	var makeCheckbox = function (item) {
		var tag = item.tag, description = item.description;
		var checkbox = { value: tag, label: '{{' + tag + '}}: ' + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		checkbox.subgroup = item.subgroup;
		return checkbox;
	};

	var makeCheckboxesForAlreadyPresentTags = function() {
		container.append({ type: 'header', id: 'tagHeader0', label: 'Label reeds aanwezig' });
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
			container.append({ type: 'header', id: 'tagHeader1', label: 'Beschikbare labels' });
		}

		// Avoid repeatedly resorting
		Twinkle.tag.article.alphabeticalList = Twinkle.tag.article.alphabeticalList || Object.keys(Twinkle.tag.article.flatObject).sort();
		var checkboxes = [];
		Twinkle.tag.article.alphabeticalList.forEach(function(tag) {
			if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
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

		var firstPart = Twinkle.tag.status.numAdded + (Twinkle.tag.status.numAdded > 1 ? ' sjablonen' : ' sjabloon') + ' toegevoegd';
		var secondPart = Twinkle.tag.status.numRemoved + (Twinkle.tag.status.numRemoved > 1 ? ' sjablonen' : ' sjabloon') + ' verwijderd';
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
		(tagname.indexOf(':') === -1 ? 'Sjabloon:' : '') +
		(tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))
	));
	link.setAttribute('target', '_blank');
	$(checkbox).parent().append(['\u00A0', link]);
};


// Tags for ARTICLES start here
Twinkle.tag.article = {};

// Subgroups for {{samenvoegen}}, {{Samenvoegennaar}} and {{Samenvoegenvan}}
var getMergeSubgroups = function(tag) {
	var otherTagName = 'Samenvoegen';
	var anderArtikel = 'Samenvoegen met: ';
	switch (tag) {
		case 'Samenvoegenvan':
			otherTagName = 'Samenvoegennaar';
			anderArtikel = 'In te voegen artikel: ';
			break;
		case 'Samenvoegennaar':
			otherTagName = 'Samenvoegenvan';
			anderArtikel = 'Invoegen bij: ';
			break;
		// no default
	}
	return [
		{
			name: 'mergeTarget',
			type: 'input',
			label: anderArtikel,
			required: true
		},
		{
			type: 'checkbox',
			list: [
				{
					name: 'mergeTagOther',
					label: 'Label het andere artikel met het {{' + otherTagName + '}} sjabloon',
					checked: true
				}
			]
		}
	].concat(mw.config.get('wgNamespaceNumber') === 0 ? {
		name: 'mergeReason',
		type: 'textarea',
		label: 'Onderbouwing (wordt geplaatst op Wikipedia:Samenvoegen):',
		required: true
	} : []);
};

// Tags arranged by category; will be used to generate the alphabetical list,
// but tags should be in alphabetical order within the categories
// excludeMI: true indicate a tag that *does not* work inside {{multiple issues}}
// Add new categories with discretion - the list is long enough as is!
Twinkle.tag.article.tagList = {
	'Onderhoudslabels': {
		'Veel gebruikt': [
			{
				tag: 'Beginnetje',
				description: 'Artikel met onvoldoende inhoud om als een volwaardig artikel aangezien te worden.',
				subgroup: [
					{
						name: 'Categorie',
						parameter: '1',
						type: 'select',
						label: 'Categorie: ',
						list: [
							{
								type: 'optgroup',
								label: 'Geografie',
								list: [
									{ type: 'option', value: 'geografie', label: 'Geografie (algemeen)' },
									{ type: 'option', value: 'landen & volken', label: 'Landen & volken' }
								]
							},
							{
								type: 'optgroup',
								label: 'Geschiedenis',
								list: [
									{ type: 'option', value: 'geschiedenis', label: 'Geschiedenis (algemeen)' },
									{ type: 'option', value: 'middeleeuwen', label: 'Middeleeuwen' },
									{ type: 'option', value: 'nieuwste tijd', label: 'Nieuwste tijd' },
									{ type: 'option', value: 'oudheid', label: 'Oudheid' }
								]
							},
							{
								type: 'optgroup',
								label: 'Kunst & cultuur',
								list: [
									{ type: 'option', value: 'kunst & cultuur', label: 'Kunst & cultuur (algemeen)' },
									{ type: 'option', value: 'film', label: 'Film' },
									{ type: 'option', value: 'literatuur', label: 'Literatuur' },
									{ type: 'option', value: 'mode', label: 'Mode' },
									{ type: 'option', value: 'muziek', label: 'Muziek (algemeen)' },
									{ type: 'option', value: 'jazz', label: '- Jazz' },
									{ type: 'option', value: 'klassieke muziek', label: '- Klassieke muziek' },
									{ type: 'option', value: 'rock', label: '- Rock' }
								]
							},
							{
								type: 'optgroup',
								label: 'Mens & maatschappij',
								list: [
									{ type: 'option', value: 'mens & maatschappij', label: 'Mens & maatschappij (algemeen)' },
									{ type: 'option', value: 'dagelijks leven', label: 'Dagelijks leven' },
									{ type: 'option', value: 'economie', label: 'Economie' },
									{ type: 'option', value: 'landbouw', label: 'Landbouw' },
									{ type: 'option', value: 'media', label: 'Media (algemeen)' },
									{ type: 'option', value: 'computerspellen', label: '- Computerspellen' },
									{ type: 'option', value: 'politiek', label: 'Politiek' },
									{ type: 'option', value: 'religie', label: 'Religie' },
									{ type: 'option', value: 'taal', label: 'Taal' }
								]
							},
							{
								type: 'optgroup',
								label: 'Sport',
								list: [
									{ type: 'option', value: 'sport', label: 'Sport (algemeen)' },
									{ type: 'option', value: 'autosport', label: 'Autosport' },
									{ type: 'option', value: 'basketball', label: 'Basketball' },
									{ type: 'option', value: 'hockey', label: 'Hockey' },
									{ type: 'option', value: 'motorsport', label: 'Motorsport' },
									{ type: 'option', value: 'voetbal', label: 'Voetbal' },
									{ type: 'option', value: 'wielersport', label: 'Wielersport' }
								]
							},
							{
								type: 'optgroup',
								label: 'Wetenschap & technologie',
								list: [
									{ type: 'option', value: 'wetenschap & technologie', label: 'Wetenschap & technologie (algemeen)' },
									{ type: 'option', value: 'aardwetenschappen', label: 'Aardwetenschappen ' },
									{ type: 'option', value: 'astronomie', label: 'Astronomie' },
									{ type: 'option', value: 'biologie', label: 'Biologie' },
									{ type: 'option', value: 'civiele techniek en bouwkunde', label: 'Civiele techniek en bouwkunde' },
									{ type: 'option', value: 'filosofie', label: 'Filosofie' },
									{ type: 'option', value: 'geneeskunde', label: 'Geneeskunde' },
									{ type: 'option', value: 'informatica', label: 'Informatica' },
									{ type: 'option', value: 'natuurkunde', label: 'Natuurkunde' },
									{ type: 'option', value: 'scheikunde', label: 'Scheikunde' },
									{ type: 'option', value: 'verkeer & vervoer', label: 'Verkeer & vervoer (algemeen)' },
									{ type: 'option', value: 'luchtvaart', label: '- Luchtvaart' },
									{ type: 'option', value: 'openbaar vervoer', label: '- Openbaar vervoer' },
									{ type: 'option', value: 'wiskunde', label: 'Wiskunde' }
								]
							}
						]
					},
					{
						name: 'Jaar',
						parameter: '2',
						type: 'hidden',
						value: '{{subst:LOCALYEAR}}'
					},
					{
						name: 'Maand',
						parameter: '3',
						type: 'hidden',
						value: '{{subst:LOCALMONTH}}'
					},
					{
						name: 'Dag',
						parameter: '4',
						type: 'hidden',
						value: '{{subst:LOCALDAY2}}'
					}
				]
			},
			{
				tag: 'Twijfel',
				description: 'Twijfel aan de juistheid van het artikel.',
				subgroup:
				[
					{
						name: 'Reden',
						parameter: '1',
						type: 'input',
						label: 'Reden: ',
						size: 35,
						required: true
					},
					{
						name: 'Jaar',
						parameter: '2',
						type: 'hidden',
						value: '{{subst:LOCALYEAR}}'
					},
					{
						name: 'Maand',
						parameter: '3',
						type: 'hidden',
						value: '{{subst:LOCALMONTH}}'
					},
					{
						name: 'Dag',
						parameter: '4',
						type: 'hidden',
						value: '{{subst:LOCALDAY2}}'
					}
				]
			},
			{
				tag: 'NPOV',
				description: 'Het artikel is niet neutraal geschreven.',
				subgroup:
					[
						{
							name: 'Jaar',
							parameter: '2',
							type: 'hidden',
							value: '{{subst:LOCALYEAR}}'
						},
						{
							name: 'Maand',
							parameter: '3',
							type: 'hidden',
							value: '{{subst:LOCALMONTH}}'
						},
						{
							name: 'Dag',
							parameter: '4',
							type: 'hidden',
							value: '{{subst:LOCALDAY2}}'
						}
					]
			}
		],
		'Overige sjablonen': [
			{ tag: 'Incompleet', description: 'Dit artikel is incompleet.' },
			{ tag: 'Lijstbeg', description: 'Deze lijst is incompleet.' },
			{
				tag: 'Wikify',
				description: 'De opmaak van het artikel voldoet nog niet aan wiki-standaarden',
				subgroup:
					[
						{
							name: 'Reden',
							parameter: '1',
							type: 'input',
							label: 'Reden: ',
							size: 35,
							required: true
						},
						{
							name: 'Jaar',
							parameter: '2',
							type: 'hidden',
							value: '{{subst:LOCALYEAR}}'
						},
						{
							name: 'Maand',
							parameter: '3',
							type: 'hidden',
							value: '{{subst:LOCALMONTH}}'
						},
						{
							name: 'Dag',
							parameter: '4',
							type: 'hidden',
							value: '{{subst:LOCALDAY2}}'
						}
					]
			},
			{ tag: 'Wereldwijd', description: "Het artikel geeft geen wereldwijd standpunt" },
			{ tag: 'BeschrijftNederlands', description: 'Het artikel beschrijft enkel de situatie in Nederland' },
			{ tag: 'BeschrijftNederlandBelgië', description: 'Het artikel beschrijft enkel de situatie in Nederland en België' }
		]
	},
	'Samenvoegen': [
		{ tag: 'Samenvoegen', description: 'Dit artikel zou samengevoegd moeten worden met een ander artikel',
			subgroup: getMergeSubgroups('Samenvoegen') },
		{ tag: 'Samenvoegenvan', description: 'Een ander artikel zou moeten worden ingevoegd bij dit artikel',
			subgroup: getMergeSubgroups('Samenvoegenvan') },
		{ tag: 'Samenvoegennaar', description: 'Dit artikel zou moeten worden ingevoegd bij een ander artikel',
			subgroup: getMergeSubgroups('Samenvoegennaar') }
	],
	'Overig': [
		{
			tag: 'Meebezig',
			description: 'Aan dit artikel wordt op dit moment gewerkt',
			subgroup:
				[
					{
						name: 'Toelichting',
						parameter: '1',
						type: 'input',
						label: 'Toelichting: ',
						size: 35,
						required: false
					}
				]
		}
	]
};


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
			// Build edit summary
			var makeSentence = function(array) {
				if (array.length < 3) {
					return array.join(' en ');
				}
				var last = array.pop();
				return array.join(', ') + ', en ' + last;
			};
			var makeTemplateLink = function(tag) {
				var text = '{{[[';
				// if it is a custom tag with a parameter
				if (tag.indexOf('|') !== -1) {
					tag = tag.slice(0, tag.indexOf('|'));
				}
				text += tag.indexOf(':') !== -1 ? tag : 'Sjabloon:' + tag + '|' + tag;
				return text + ']]}}';
			};

			var summaryText;
			var addedTags = params.tags.map(makeTemplateLink);
			var removedTags = params.tagsToRemove.map(makeTemplateLink);
			if (addedTags.length) {
				summaryText = '+ ' + makeSentence(addedTags);
				summaryText += removedTags.length ? '; - ' + makeSentence(removedTags) : '';
			} else {
				summaryText = '- ' + makeSentence(removedTags);
			}
			if (params.reason) {
				summaryText += ': ' + params.reason;
			}

			// avoid truncated summaries
			if (summaryText.length > 499) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText);
			if ((mw.config.get('wgNamespaceNumber') === 0 && Twinkle.getPref('watchTaggedVenues').indexOf('articles') !== -1) || (mw.config.get('wgNamespaceNumber') === 118 && Twinkle.getPref('watchTaggedVenues').indexOf('drafts') !== -1)) {
				pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			}
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(function() {
				// Special functions for merge tags
				// Post a rationale on the discussionpage
				if (params.mergeReason) {
					var date = new Morebits.date(pageobj.getLoadTime());
					var mergeTalkPage = new Morebits.wiki.page('Wikipedia:Samenvoegen/' + date.format('YYYYMM', '120'), 'Wikipedia:Samenvoegen ophalen');
					mergeTalkPage.setPageSection(2);
					mergeTalkPage.setFollowRedirect(true);

					var text = mergeTalkPage.getPageText();
					mergeTalkPage.getStatusElement().status('Samenvoeg-discussie opslaan...');
					mergeTalkPage.setEditSummary('Voorstel: Samenvoegen van ' + params.talkDiscussionTitleLinked);
					mergeTalkPage.setAppendText('* ' + params.talkDiscussionTitleLinked + ' - ' + params.mergeReason.trim() + ' - ~~~~');
					mergeTalkPage.setChangeTags(Twinkle.changeTags);
					mergeTalkPage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
					mergeTalkPage.append();
				}
				// Tag the target page (if requested)
				if (params.mergeTagOther) {
					var otherTagName = 'Samenvoegen';
					if (params.mergeTag === 'Samenvoegenvan') {
						otherTagName = 'Samenvoegennaar';
					} else if (params.mergeTag === 'Samenvoegennaar') {
						otherTagName = 'Samenvoegenvan';
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
					var otherpage = new Morebits.wiki.page(params.mergeTarget, 'Andere pagina labelen (' +
						params.mergeTarget + ')');
					otherpage.setChangeTags(Twinkle.changeTags);
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
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

			Morebits.status.info('Info', 'Gedeselecteerde labels verwijderen');

			var getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach(function removeTag(tag) {
				var tag_re = new RegExp('\{\{' + Morebits.pageNameRegex(tag) + '\s*(\|[^}]+)?\}\}\n?');

				if (tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Sjabloon:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			var api = new Morebits.wiki.api('Sjabloondoorverwijzingen ophalen', {
				action: 'query',
				prop: 'linkshere',
				titles: getRedirectsFor.join('|'),
				redirects: 1,  // follow redirect if the class name turns out to be a redirect page
				lhnamespace: '10',  // template namespace only
				lhshow: 'redirect',
				lhlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			}, function removeRedirectTag(apiobj) {
				var pages = apiobj.getResponse().query.pages.filter(function(p) {
					return !p.missing && !!p.linkshere;
				});
				pages.forEach(function(page) {
					var removed = false;
					page.linkshere.forEach(function(el) {
						var tag = el.title.slice(9);
						var tag_re = new RegExp('\{\{' + Morebits.pageNameRegex(tag) + '\s*(\|[^}]*)?\}\}\n?');
						if (tag_re.test(pageText)) {
							pageText = pageText.replace(tag_re, '');
							removed = true;
							return false;   // break out of $.each
						}
					});
					if (!removed) {
						Morebits.status.warn('Info', '{{' +
						page.title.slice(9) + '}} niet gevonden op de pagina... overslaan');
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

			// Place {{Beginnetje}} at the bottom of the page.
			if (tagName === 'Beginnetje') {
				pageText += '\n\n{{' + tagName
				var subgroupObj2 = Twinkle.tag.article.flatObject[tagName] &&
					Twinkle.tag.article.flatObject[tagName].subgroup;
				if (subgroupObj2) {
					var subgroups2 = Array.isArray(subgroupObj2) ? subgroupObj2 : [ subgroupObj2 ];
					subgroups2.forEach(function(gr) {
						if (gr.parameter && (params[gr.name] || gr.required)) {
							pageText += '|' + gr.parameter + '=' + (params[gr.name] || '');
						}
					});
				}
				pageText += '}}';

			// And place the other tags at the top.
			} else {
				currentTag += '{{' + tagName;
				// fill in other parameters, based on the tag

				var subgroupObj = Twinkle.tag.article.flatObject[tagName] &&
					Twinkle.tag.article.flatObject[tagName].subgroup;
				if (subgroupObj) {
					var subgroups = Array.isArray(subgroupObj) ? subgroupObj : [ subgroupObj ];
					subgroups.forEach(function(gr) {
						if (gr.parameter && (params[gr.name] || gr.required)) {
							currentTag += '|' + gr.parameter + '=' + (params[gr.name] || '');
						}
					});
				}

				switch (tagName) {
					case 'Samenvoegen':
					case 'Samenvoegenvan':
					case 'Samenvoegennaar':
						params.mergeTag = tagName;
						// normalize the merge target for now and later
						params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

						currentTag += '|' + params.mergeTarget;

						// link to the correct section on the talk page, for article space only
						if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
							if (!params.discussArticle) {
								// define primary and secondary article
								params.primaryArticle = tagName === 'Samenvoegennaar' ? params.mergeTarget : mw.config.get('wgTitle');
								params.secondaryArticle = tagName === 'Samenvoegennaar' ? mw.config.get('wgTitle') : params.mergeTarget;

								var direction = '[[' + params.secondaryArticle + ']]' + (params.mergeTag === 'Samenvoegen' ? ' met ' : ' naar ') + '[[' + params.primaryArticle + ']]';
								params.talkDiscussionTitleLinked = direction;
								params.talkDiscussionTitle = params.talkDiscussionTitleLinked.replace(/\[\[(.*?)\]\]/g, '$1');
							}
						}
						break;
					default:
						break;
				}

				currentTag += '}}\n';
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
				// CSD
				'nuweg|delete|' +
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
			tagRe = new RegExp('\{\{' + tag + '(\||\}\})', 'im');
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
				if (tag === 'Samenvoegenvan') {
					tags.push(tag);
				} else {
					Morebits.status.warn('Info', '{{' + tag +
						'}} sjabloon reeds op pagina aanwezig...');
					// don't do anything else with merge tags
					if (['Samenvoegen', 'Samenvoegennaar'].indexOf(tag) !== -1) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		// To-be-retained existing tags that are groupable
		params.tagsToRemain.forEach(function(tag) {
			// If the tag is unknown to us, we consider it non-groupable
			if (Twinkle.tag.article.flatObject[tag] && !Twinkle.tag.article.flatObject[tag].excludeMI) {
				groupableExistingTags.push(tag);
			}
		});

		var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

		if (miTest && groupableTags.length > 0) {
			Morebits.status.info('Info', 'Adding supported tags inside existing {{multiple issues}} tag');

			tagText = '';
			$.each(groupableTags, addTag);

			var miRegex = new RegExp('(\{\{\s*' + miTest[1] + '\s*(?:\|(?:\{\{[^{}]*\}\}|[^{}])*)?)\}\}\s*', 'im');
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
				var tag_re = new RegExp('(\{\{' + Morebits.pageNameRegex(tag) + '\s*(\|[^}]+)?\}\}\n?)');
				if (tag_re.test(pageText)) {
					tagText += tag_re.exec(pageText)[1];
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Sjabloon:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				addNewTagsToMI();
				return;
			}

			var api = new Morebits.wiki.api('Sjabloon-doorverwijzingen ophalen', {
				action: 'query',
				prop: 'linkshere',
				titles: getRedirectsFor.join('|'),
				redirects: 1,
				lhnamespace: '10', // template namespace only
				lhshow: 'redirect',
				lhlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			}, function replaceRedirectTag(apiobj) {
				var pages = apiobj.getResponse().query.pages.filter(function(p) {
					return !p.missing && !!p.linkshere;
				});
				pages.forEach(function(page) {
					var found = false;
					page.linkshere.forEach(function(el) {
						var tag = el.title.slice(9);
						var tag_re = new RegExp('(\{\{' + Morebits.pageNameRegex(tag) + '\s*(\|[^}]*)?\}\}\n?)');
						if (tag_re.test(pageText)) {
							tagText += tag_re.exec(pageText)[1];
							pageText = pageText.replace(tag_re, '');
							found = true;
							return false;   // break out of $.each
						}
					});
					if (!found) {
						Morebits.status.warn('Info', 'Failed to find the existing {{' +
						page.title.slice(9) + '}} on the page... skip repositioning');
					}
				});
				addNewTagsToMI();
			});
			api.post();

		} else {
			tags = tags.concat(groupableTags);
			addUngroupedTags();
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
			var message = 'Selecteer slechts één: {{' + conflicts.join('}}, {{') + '}}.';
			message += extra ? ' ' + extra : '';
			alert(message);
			return true;
		}
	};

	// We could theoretically put them all checkIncompatible calls in a
	// forEach loop, but it's probably clearer not to have [[array one],
	// [array two]] devoid of context.
	switch (Twinkle.tag.mode) {
		case 'article':
			params.tagsToRemove = form.getUnchecked('existingTags'); // not in `input`
			params.tagsToRemain = params.existingTags || []; // container not created if none present

			if ((params.tags.indexOf('Samenvoegen') !== -1) || (params.tags.indexOf('Samenvoegenvan') !== -1) ||
				(params.tags.indexOf('Samenvoegennaar') !== -1)) {
				if (checkIncompatible(['Samenvoegen', 'Samenvoegenvan', 'Samenvoegennaar'], 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).')) {
					return;
				}
				if ((params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1) {
					alert('Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.');
					return;
				}
			}
			break;

		default:
			alert('Twinkle.tag: unknown mode ' + Twinkle.tag.mode);
			break;
	}

	// File/redirect: return if no tags selected
	// Article: return if no tag is selected and no already present tag is deselected
	if (params.tags.length === 0 && (Twinkle.tag.mode !== 'article' || params.tagsToRemove.length === 0)) {
		alert('Selecteer tenminste 1 label!');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = 'Labelen voltooid, Pagina wordt herladen';
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Labelen pagina');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);

};

Twinkle.addInitCallback(Twinkle.tag, 'tag');
})(jQuery);

// </nowiki>
