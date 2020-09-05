// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklexfd.js: XFD module
 ****************************************
 * Mode of invocation:     Tab ("XFD")
 * Active on:              Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
 */

Twinkle.xfd = function twinklexfd() {
	// Disable on:
	// * special pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2, or R4 if it's a redirect)
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId') || (mw.config.get('wgNamespaceNumber') === 6 && document.getElementById('mw-sharedupload'))) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.xfd.callback, 'XFD', 'tw-xfd', 'Start a deletion discussion');
};


var utils = {
	/** Get ordinal number figure */
	num2order: function(num) {
		switch (num) {
			case 1: return '';
			case 2: return '2nd';
			case 3: return '3rd';
			default: return num + 'th';
		}
	},

	/**
	 * Remove namespace name from title if present
	 * Exception-safe wrapper around mw.Title
	 * @param {string} title
	 */
	stripNs: function(title) {
		var title_obj = mw.Title.newFromUserInput(title);
		if (!title_obj) {
			return title; // user entered invalid input; do nothing
		}
		return title_obj.getNameText();
	},

	/**
	 * Add namespace name to page title if not already given
	 * CAUTION: namespace name won't be added if a namespace (*not* necessarily
	 * the same as the one given) already is there in the title
	 * @param {string} title
	 * @param {number} namespaceNumber
	 */
	addNs: function(title, namespaceNumber) {
		var title_obj = mw.Title.newFromUserInput(title, namespaceNumber);
		if (!title_obj) {
			return title;  // user entered invalid input; do nothing
		}
		return title_obj.toText();
	},

	/**
	 * Provide Wikipedian TLA style: AfD, RfD, CfDS, RM, SfD, etc.
	 * @param {string} venue
	 * @returns {string}
	 */
	toTLACase: function(venue) {
		return venue
			.toString()
			// Everybody up, inclduing rm and the terminal s in cfds
			.toUpperCase()
			// Lowercase the central f in a given TLA and normalize sfd-t and sfr-t
			.replace(/(.)F(.)(?:-.)?/, '$1f$2');
	}
};

Twinkle.xfd.currentRationale = null;

// error callback on Morebits.status.object
Twinkle.xfd.printRationale = function twinklexfdPrintRationale() {
	if (Twinkle.xfd.currentRationale) {
		Morebits.status.printUserText(Twinkle.xfd.currentRationale, 'Your deletion rationale is provided below, which you can copy and paste into a new XFD dialog if you wish to try again:');
		// only need to print the rationale once
		Twinkle.xfd.currentRationale = null;
	}
};

Twinkle.xfd.callback = function twinklexfdCallback() {
	var Window = new Morebits.simpleWindow(700, 400);
	Window.setTitle('Start a deletion discussion (XfD)');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('About deletion discussions', 'WP:XFD');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#xfd');

	var form = new Morebits.quickForm(Twinkle.xfd.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'venue',
		label: 'Deletion discussion venue:',
		tooltip: 'When activated, a default choice is made, based on what namespace you are in. This default should be the most appropriate.',
		event: Twinkle.xfd.callback.change_category
	});
	var namespace = mw.config.get('wgNamespaceNumber');

	categories.append({
		type: 'option',
		label: 'AfD (Articles for deletion)',
		selected: namespace === 0,  // Main namespace
		value: 'afd'
	});
	categories.append({
		type: 'option',
		label: 'TfD (Templates for discussion)',
		selected: [ 10, 828 ].indexOf(namespace) !== -1,  // Template and module namespaces
		value: 'tfd'
	});
	categories.append({
		type: 'option',
		label: 'FfD (Files for discussion)',
		selected: namespace === 6,  // File namespace
		value: 'ffd'
	});
	categories.append({
		type: 'option',
		label: 'CfD (Categories for discussion)',
		selected: namespace === 14 || (namespace === 10 && /-stub$/.test(Morebits.pageNameNorm)),  // Category namespace and stub templates
		value: 'cfd'
	});
	categories.append({
		type: 'option',
		label: 'CfD/S (Categories for speedy renaming)',
		value: 'cfds'
	});
	categories.append({
		type: 'option',
		label: 'MfD (Miscellany for deletion)',
		selected: [ 0, 6, 10, 14, 828 ].indexOf(namespace) === -1 || Morebits.pageNameNorm.indexOf('Template:User ', 0) === 0,
		// Other namespaces, and userboxes in template namespace
		value: 'mfd'
	});
	categories.append({
		type: 'option',
		label: 'RfD (Redirects for discussion)',
		selected: Morebits.wiki.isPageRedirect(),
		value: 'rfd'
	});
	categories.append({
		type: 'option',
		label: 'RM (Requested moves)',
		selected: false,
		value: 'rm'
	});

	form.append({
		type: 'div',
		id: 'wrong-venue-warn',
		style: 'color: red; font-style: italic'
	});

	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Notify page creator if possible',
				value: 'notify',
				name: 'notifycreator',
				tooltip: "A notification template will be placed on the creator's talk page if this is true.",
				checked: true
			}
		]
	});
	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.xfd.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', id: 'xfdpreview', label: [ previewlink ] });
	form.append({ type: 'div', id: 'twinklexfd-previewbox', style: 'display: none' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklexfd-previewbox').last()[0]);

	// We must init the controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.venue.dispatchEvent(evt);
};

Twinkle.xfd.callback.wrongVenueWarning = function twinklexfdWrongVenueWarning(venue) {
	var text = '';
	var namespace = mw.config.get('wgNamespaceNumber');

	switch (venue) {
		case 'afd':
			if (namespace !== 0) {
				text = 'AfD is generally appropriate only for articles.';
			} else if (mw.config.get('wgIsRedirect')) {
				text = 'Please use RfD for redirects.';
			}
			break;
		case 'tfd':
			if (namespace === 10 && /-stub$/.test(Morebits.pageNameNorm)) {
				text = 'Use CfD for stub templates.';
			} else if (Morebits.pageNameNorm.indexOf('Template:User ') === 0) {
				text = 'Please use MfD for userboxes';
			}
			break;
		case 'cfd':
			if ([ 10, 14 ].indexOf(namespace) === -1) {
				text = 'CfD is only for categories and stub templates.';
			}
			break;
		case 'cfds':
			if (namespace !== 14) {
				text = 'CfDS is only for categories.';
			}
			break;
		case 'ffd':
			if (namespace !== 6) {
				text = 'FFD is selected but this page doesn\'t look like a file!';
			}
			break;
		case 'rm':
			if (namespace === 14) { // category
				text = 'Please use CfD or CfDS for category renames.';
			}
			break;

		default: // mfd or rfd
			break;
	}

	$('#wrong-venue-warn').text(text);

};

Twinkle.xfd.callback.change_category = function twinklexfdCallbackChangeCategory(e) {
	var value = e.target.value;
	var form = e.target.form;
	var old_area = Morebits.quickForm.getElements(e.target.form, 'work_area')[0];
	var work_area = null;

	var oldreasontextbox = form.getElementsByTagName('textarea')[0];
	var oldreason = oldreasontextbox ? oldreasontextbox.value : '';

	var appendReasonBox = function twinklexfdAppendReasonBox() {
		work_area.append({
			type: 'textarea',
			name: 'reason',
			label: 'Reason: ',
			value: oldreason,
			tooltip: 'You can use wikimarkup in your reason. Twinkle will automatically sign your post.'
		});
	};

	Twinkle.xfd.callback.wrongVenueWarning(value);

	form.previewer.closePreview();

	switch (value) {
		case 'afd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Articles for deletion',
				name: 'work_area'
			});

			work_area.append({
				type: 'div',
				label: Twinkle.makeFindSourcesDiv(),
				style: 'margin-bottom: 5px;'
			});

			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Wrap deletion tag with <noinclude>',
						value: 'noinclude',
						name: 'noinclude',
						tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t transclude. This option is not normally required.'
					}
				]
			});
			work_area.append({
				type: 'select',
				name: 'xfdcat',
				label: 'Choose what category this nomination belongs in:',
				list: [
					{ type: 'option', label: 'Unknown', value: '?', selected: true },
					{ type: 'option', label: 'Media and music', value: 'M' },
					{ type: 'option', label: 'Organisation, corporation, or product', value: 'O' },
					{ type: 'option', label: 'Biographical', value: 'B' },
					{ type: 'option', label: 'Society topics', value: 'S' },
					{ type: 'option', label: 'Web or internet', value: 'W' },
					{ type: 'option', label: 'Games or sports', value: 'G' },
					{ type: 'option', label: 'Science and technology', value: 'T' },
					{ type: 'option', label: 'Fiction and the arts', value: 'F' },
					{ type: 'option', label: 'Places and transportation', value: 'P' },
					{ type: 'option', label: 'Indiscernible or unclassifiable topic', value: 'I' },
					{ type: 'option', label: 'Debate not yet sorted', value: 'U' }
				]
			});

			// delsort categories list copied off [[User:Enterprisey/delsort.js]], originally taken from [[WP:DS/C]]
			var delsortCategories = {
				'People': ['People', 'Academics and educators', 'Actors and filmmakers', 'Artists', 'Authors', 'Bands and musicians', 'Businesspeople', 'Politicians', 'Sportspeople', 'Women', 'Lists of people'],
				'Arts': ['Arts', 'Fictional elements', 'Science fiction and fantasy'],
				'Arts/Culinary': ['Food and drink', 'Wine'],
				'Arts/Language': ['Language', 'Academic journals', 'Bibliographies', 'Journalism', 'Literature', 'Logic', 'News media', 'Philosophy', 'Poetry'],
				'Arts/Performing': ['Albums and songs', 'Dance', 'Film', 'Magic', 'Music', 'Radio', 'Television', 'Theatre', 'Video games'],
				'Arts/Visual arts': ['Visual arts', 'Architecture', 'Fashion', 'Photography'],
				'Arts/Comics and animation': ['Comics and animation', 'Anime and manga', 'Webcomics'],
				'Places of interest': ['Museums and libraries', 'Shopping malls'],
				'Topical': ['Animal', 'Bilateral relations', 'Business', 'Conservatism', 'Conspiracy theories', 'Crime', 'Disability', 'Discrimination', 'Ethnic groups', 'Events', 'Games', 'Health and fitness', 'History', 'Law', 'Military', 'Organizations', 'Paranormal', 'Piracy', 'Politics', 'Terrorism'],
				'Topical/Business': ['Business', 'Advertising', 'Companies', 'Management', 'Finance'],
				'Topical/Culture': ['Beauty pageants', 'Fashion', 'Mythology', 'Popular culture', 'Sexuality and gender'],
				'Topical/Education': ['Education', 'Fraternities and sororities', 'Schools'],
				'Topical/Religion': ['Religion', 'Atheism', 'Bible', 'Buddhism', 'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Paganism', 'Sikhism', 'Spirituality'],
				'Topical/Science': ['Science', 'Archaeology', 'Astronomy', 'Behavioural science', 'Economics', 'Environment', 'Geography', 'Mathematics', 'Medicine', 'Organisms', 'Social science', 'Transportation'],
				'Topical/Sports': ['Sports', 'American football', 'Baseball', 'Basketball', 'Bodybuilding', 'Boxing', 'Cricket', 'Cycling', 'Football', 'Golf', 'Horse racing', 'Ice hockey', 'Rugby union', 'Softball', 'Martial arts', 'Wrestling'],
				'Topical/Technology': ['Technology', 'Aviation', 'Computing', 'Firearms', 'Internet', 'Software', 'Websites'],
				'Wikipedia page type': ['Disambiguations', 'Lists'],
				'Geographic/Africa': ['Africa', 'Egypt', 'Ethiopia', 'Ghana', 'Kenya', 'Laos', 'Mauritius', 'Morocco', 'Nigeria', 'Somalia', 'South Africa', 'Zimbabwe'],
				'Geographic/Asia': ['Asia', 'Afghanistan', 'Bangladesh', 'Bahrain', 'Brunei', 'Cambodia', 'China', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Korea', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'Pakistan', 'Philippines', 'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan', 'Thailand', 'Vietnam'],
				'Geographic/Asia/Central Asia': ['Central Asia', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'],
				'Geographic/Asia/Middle East': ['Middle East', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Libya', 'Palestine', 'Saudi Arabia', 'Syria', 'United Arab Emirates', 'Yemen', 'Qatar'],
				'Geographic/Europe': ['Europe', 'Albania', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Georgia (country)', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Jersey', 'Kosovo', 'Latvia', 'Lithuania', 'Luxembourg', 'Macedonia', 'Malta', 'Moldova', 'Montenegro', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'Yugoslavia'],
				'Geographic/Europe/United Kingdom': ['United Kingdom', 'England', 'Northern Ireland', 'Scotland', 'Wales'],
				'Geographic/Oceania': ['Oceania', 'Antarctica', 'Australia', 'New Zealand'],
				'Geographic/Americas/Canada': ['Canada', 'British Columbia', 'Manitoba', 'Nova Scotia', 'Ontario', 'Quebec', 'Alberta'],
				'Geographic/Americas/Latin America': ['Latin America', 'Caribbean', 'South America', 'Argentina', 'Barbados', 'Belize', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Cuba', 'Ecuador', 'El Salvador', 'Guatemala', 'Haiti', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Puerto Rico', 'Trinidad and Tobago', 'Uruguay', 'Venezuela', 'Grenada'],
				'Geographic/Americas/USA': ['United States of America', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia (U.S. state)', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'Washington, D.C.', 'West Virginia', 'Wisconsin', 'Wyoming'],
				'Geographic/Unsorted': ['Islands']
			};

			var delsort = work_area.append({
				type: 'select',
				multiple: true,
				name: 'delsortCats',
				label: 'Choose deletion sorting categories: ',
				tooltip: 'Select a few categories that are specifically relevant to the subject of the article. Be as precise as possible; categories like People and USA should only be used when no other categories apply.'
			});

			$.each(delsortCategories, function(groupname, list) {
				var group = delsort.append({ type: 'optgroup', label: groupname });
				list.forEach(function(item) {
					group.append({ type: 'option', label: item, value: item });
				});
			});

			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);

			$(work_area).find('[name=delsortCats]')
				.attr('data-placeholder', 'Select delsort pages')
				.select2({
					width: '100%',
					matcher: Morebits.select2.matcher,
					templateResult: Morebits.select2.highlightSearchMatches,
					language: {
						searching: Morebits.select2.queryInterceptor
					},
					// Link text to the page itself
					templateSelection: function(choice) {
						return $('<a>').text(choice.text).attr({
							href: mw.util.getUrl('Wikipedia:WikiProject_Deletion_sorting/' + choice.text),
							target: '_blank'
						});
					}
				});

			mw.util.addCSS(
				// Remove black border
				'.select2-container--default.select2-container--focus .select2-selection--multiple { border: 1px solid #aaa; }' +

				// Reduce padding
				'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
				'.select2-results .select2-results__group { padding-top: 1px; padding-bottom: 1px; } ' +

				// Adjust font size
				'.select2-container .select2-dropdown .select2-results { font-size: 13px; }' +
				'.select2-container .selection .select2-selection__rendered { font-size: 13px; }' +

				// Make the tiny cross larger
				'.select2-selection__choice__remove { font-size: 130%; }'
			);
			break;

		case 'tfd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Templates for discussion',
				name: 'work_area'
			});

			var templateOrModule = mw.config.get('wgPageContentModel') === 'Scribunto' ? 'module' : 'template';
			work_area.append({
				type: 'select',
				label: 'Choose type of action wanted: ',
				name: 'xfdcat',
				event: function(e) {
					var target = e.target,
						tfdtarget = target.form.tfdtarget;
					// add/remove extra input box
					if (target.value === 'tfm' && !tfdtarget) {
						tfdtarget = new Morebits.quickForm.element({
							name: 'tfdtarget',
							type: 'input',
							label: 'Other ' + templateOrModule + ' to be merged: ',
							tooltip: 'Required. Should not include the ' + Morebits.string.toUpperCaseFirstChar(templateOrModule) + ': namespace prefix.',
							required: true
						});
						target.parentNode.appendChild(tfdtarget.render());
					} else {
						$(Morebits.quickForm.getElementContainer(tfdtarget)).remove();
						tfdtarget = null;
					}
				},
				list: [
					{ type: 'option', label: 'Deletion', value: 'tfd', selected: true },
					{ type: 'option', label: 'Merge', value: 'tfm' }
				]
			});
			work_area.append({
				type: 'select',
				name: 'templatetype',
				label: 'Deletion tag display style: ',
				tooltip: 'Which <code>type=</code> parameter to pass to the TfD tag template.',
				list: templateOrModule === 'module' ? [
					{ type: 'option', value: 'module', label: 'Module', selected: true }
				] : [
					{ type: 'option', value: 'standard', label: 'Standard', selected: true },
					{ type: 'option', value: 'sidebar', label: 'Sidebar/infobox', selected: $('.infobox').length },
					{ type: 'option', value: 'inline', label: 'Inline template' },
					{ type: 'option', value: 'tiny', label: 'Tiny inline' }
				]
			});

			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Wrap deletion tag with <noinclude> (for substituted templates only)',
						value: 'noinclude',
						name: 'noinclude',
						tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t get substituted along with the template.',
						disabled: templateOrModule === 'module',
						checked: !!$('.box-Subst_only').length // Default to checked if page carries {{subst only}}
					}
				]
			});

			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'mfd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Miscellany for deletion',
				name: 'work_area'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Wrap deletion tag with <noinclude>',
						value: 'noinclude',
						name: 'noinclude',
						tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t transclude. Select this option for userboxes.'
					}
				]
			});
			if ((mw.config.get('wgNamespaceNumber') === 2 /* User: */ || mw.config.get('wgNamespaceNumber') === 3 /* User talk: */) && mw.config.exists('wgRelevantUserName')) {
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: 'Also notify owner of userspace if they are not the page creator',
							value: 'notifyuserspace',
							name: 'notifyuserspace',
							tooltip: 'If the user in whose userspace this page is located is not the page creator (for example, the page is a rescued article stored as a userspace draft), notify the userspace owner as well.',
							checked: true
						}
					]
				});
			}
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'ffd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Discussion venues for files',
				name: 'work_area'
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'cfd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Categories for discussion',
				name: 'work_area'
			});
			var isCategory = mw.config.get('wgNamespaceNumber') === 14;
			work_area.append({
				type: 'select',
				label: 'Choose type of action wanted: ',
				name: 'xfdcat',
				event: function(e) {
					var value = e.target.value,
						cfdtarget = e.target.form.cfdtarget,
						cfdtarget2 = e.target.form.cfdtarget2;

					// update enabled status
					cfdtarget.disabled = value === 'cfd' || value === 'sfd-t';

					if (isCategory) {
						// update label
						if (value === 'cfs') {
							Morebits.quickForm.setElementLabel(cfdtarget, 'Target categories: ');
						} else if (value === 'cfc') {
							Morebits.quickForm.setElementLabel(cfdtarget, 'Target article: ');
						} else {
							Morebits.quickForm.setElementLabel(cfdtarget, 'Target category: ');
						}
						// add/remove extra input box
						if (value === 'cfs') {
							if (cfdtarget2) {
								cfdtarget2.disabled = false;
								$(cfdtarget2).show();
							} else {
								cfdtarget2 = document.createElement('input');
								cfdtarget2.setAttribute('name', 'cfdtarget2');
								cfdtarget2.setAttribute('type', 'text');
								cfdtarget2.setAttribute('required', 'true');
								cfdtarget.parentNode.appendChild(cfdtarget2);
							}
						} else {
							$(cfdtarget2).prop('disabled', true);
							$(cfdtarget2).hide();
						}
					} else { // Update stub template label
						Morebits.quickForm.setElementLabel(cfdtarget, 'Target stub template: ');
					}
				},
				list: isCategory ? [
					{ type: 'option', label: 'Deletion', value: 'cfd', selected: true },
					{ type: 'option', label: 'Merge', value: 'cfm' },
					{ type: 'option', label: 'Renaming', value: 'cfr' },
					{ type: 'option', label: 'Split', value: 'cfs' },
					{ type: 'option', label: 'Convert into article', value: 'cfc' }
				] : [
					{ type: 'option', label: 'Stub Deletion', value: 'sfd-t', selected: true },
					{ type: 'option', label: 'Stub Renaming', value: 'sfr-t' }
				]
			});

			work_area.append({
				type: 'input',
				name: 'cfdtarget',
				label: 'Target category: ', // default, changed above
				disabled: true,
				required: true, // only when enabled
				value: ''
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'cfds':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Categories for speedy renaming',
				name: 'work_area'
			});
			work_area.append({
				type: 'select',
				label: 'C2 sub-criterion: ',
				name: 'xfdcat',
				tooltip: 'See WP:CFDS for full explanations.',
				list: [
					{ type: 'option', label: 'C2A: Typographic and spelling fixes', value: 'C2A', selected: true },
					{ type: 'option', label: 'C2B: Naming conventions and disambiguation', value: 'C2B' },
					{ type: 'option', label: 'C2C: Consistency with names of similar categories', value: 'C2C' },
					{ type: 'option', label: 'C2D: Rename to match article name', value: 'C2D' },
					{ type: 'option', label: 'C2E: Author request', value: 'C2E' },
					{ type: 'option', label: 'C2F: One eponymous article', value: 'C2F' }
				]
			});

			work_area.append({
				type: 'input',
				name: 'cfdstarget',
				label: 'New name: ',
				value: '',
				required: true
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'rfd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Redirects for discussion',
				name: 'work_area'
			});

			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Notify target page if possible',
						value: 'relatedpage',
						name: 'relatedpage',
						tooltip: "A notification template will be placed on the talk page of this redirect's target if this is true.",
						checked: true
					}
				]
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'rm':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Requested moves',
				name: 'work_area'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Uncontroversial technical request',
						value: 'rmtr',
						name: 'rmtr',
						tooltip: 'Use this option when you are unable to perform this uncontroversial move yourself because of a technical reason (e.g. a page already exists at the new title, or the page is protected)',
						checked: false,
						event: function() {
							form.newname.required = this.checked;
						}
					}
				]
			});
			work_area.append({
				type: 'input',
				name: 'newname',
				label: 'New title: ',
				tooltip: 'Required for technical requests. Otherwise, if unsure of the appropriate title, you may leave it blank.'
			});

			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Nothing for anything',
				name: 'work_area'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}

	// Return to checked state when switching, but no creator notification for CFDS or RM
	form.notifycreator.disabled = value === 'cfds' || value === 'rm';
	form.notifycreator.checked = !form.notifycreator.disabled;
};

Twinkle.xfd.setWatchPref = function twinklexfdsetWatchPref(pageobj, pref) {
	switch (pref) {
		case 'yes':
			pageobj.setWatchlist(true);
			break;
		case 'no':
			pageobj.setWatchlistFromPreferences(false);
			break;
		default:
			pageobj.setWatchlistFromPreferences(true);
			break;
	}
};

Twinkle.xfd.callbacks = {
	getDiscussionWikitext: function(venue, params) {
		if (venue === 'cfds') { // CfD/S takes a completely different style
			return '* [[:' + Morebits.pageNameNorm + ']] to [[:' + params.cfdstarget + ']]\u00A0\u2013 ' +
				params.xfdcat + (params.reason ? ': ' + Morebits.string.formatReasonText(params.reason) : '.') + ' ~~~~';
			// U+00A0 NO-BREAK SPACE; U+2013 EN RULE
		}
		if (venue === 'rm') {
			// even if invoked from talk page, propose the subject page for move
			var pageName = new mw.Title(Morebits.pageNameNorm).getSubjectPage().toText();
			return (params.rmtr ?
				'{{subst:RMassist|1=' + pageName + '|2=' + params.newname :
				'{{subst:Requested move|current1=' + pageName + '|new1=' + params.newname)
				+ '|reason=' + params.reason + '}}';
		}

		var text = '{{subst:' + venue + '2';
		var reasonKey = venue === 'ffd' ? 'Reason' : 'text';
		// Add a reason unconditionally, so that at least a signature is added
		if (params.reason) {
			text += '|' + reasonKey + '=' + Morebits.string.formatReasonText(params.reason) + ' ~~~~';
		} else {
			text += '|' + reasonKey + '=~~~~';
		}

		if (venue === 'afd' || venue === 'mfd') {
			text += '|pg=' + Morebits.pageNameNorm;
			if (venue === 'afd') {
				text += '|cat=' + params.xfdcat;
			}
		} else if (venue === 'rfd') {
			text += '|redirect=' + Morebits.pageNameNorm;
		} else {
			text += '|1=' + mw.config.get('wgTitle');
			if (mw.config.get('wgPageContentModel') === 'Scribunto') {
				text += '|module=Module:';
			}
		}

		if (params.rfdtarget) {
			text += '|target=' + params.rfdtarget + (params.section ? '#' + params.section : '');
		} else if (params.tfdtarget) {
			text += '|2=' + params.tfdtarget;
		} else if (params.cfdtarget) {
			text += '|2=' + params.cfdtarget;
			if (params.cfdtarget2) {
				text += '|3=' + params.cfdtarget2;
			}
		} else if (params.uploader) {
			text += '|Uploader=' + params.uploader;
		}

		text += '}}';

		if (params.delsortCats) { // Only for AFDs
			params.delsortCats.forEach(function (cat) {
				text += '\n{{subst:delsort|' + cat + '|~~~~}}';
			});
		}

		return text;
	},
	showPreview: function(form, venue, params) {
		var templatetext = Twinkle.xfd.callbacks.getDiscussionWikitext(venue, params);
		if (venue === 'rm') { // RM templates are sensitive to page title
			form.previewer.beginRender(templatetext, params.rmtr ? 'Wikipedia:Requested moves/Technical requests' : new mw.Title(Morebits.pageNameNorm).getTalkPage().toText());
		} else {
			form.previewer.beginRender(templatetext, 'WP:TW'); // Force wikitext
		}
	},
	preview: function(form) {
		// venue, reason, xfdcat, tfdtarget, cfdtarget, cfdtarget2, cfdstarget, delsortCats, newname
		var params = Morebits.quickForm.getInputData(form);

		var venue = params.venue;

		// Remove CfD or TfD namespace prefixes if given
		if (params.tfdtarget) {
			params.tfdtarget = utils.stripNs(params.tfdtarget);
		} else if (params.cfdtarget) {
			params.cfdtarget = utils.stripNs(params.cfdtarget);
			if (params.cfdtarget2) {
				params.cfdtarget2 = utils.stripNs(params.cfdtarget2);
			}
		} else if (params.cfdstarget) { // Add namespace if not given (CFDS)
			params.cfdstarget = utils.addNs(params.cfdstarget, 14);
		}

		if (venue === 'ffd') {
			// Fetch the uploader
			var page = new Morebits.wiki.page(mw.config.get('wgPageName'));
			page.lookupCreation(function() {
				params.uploader = page.getCreator();
				Twinkle.xfd.callbacks.showPreview(form, venue, params);
			});
		} else if (venue === 'rfd') { // Find the target
			Twinkle.xfd.callbacks.rfd.findTarget(params, function(params) {
				Twinkle.xfd.callbacks.showPreview(form, venue, params);
			});
		} else if (venue === 'cfd') { // Swap in CfD subactions
			Twinkle.xfd.callbacks.showPreview(form, params.xfdcat, params);
		} else {
			Twinkle.xfd.callbacks.showPreview(form, venue, params);
		}
	},
	addToLog: function(params, initialContrib) {
		if (!Twinkle.getPref('logXfdNominations') || Twinkle.getPref('noLogOnXfdNomination').indexOf(params.venue) !== -1) {
			return;
		}

		var usl = new Morebits.userspaceLogger(Twinkle.getPref('xfdLogPageName'));// , 'Adding entry to userspace log');

		usl.initialText =
			"This is a log of all [[WP:XFD|deletion discussion]] nominations made by this user using [[WP:TW|Twinkle]]'s XfD module.\n\n" +
			'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
			'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
			(Morebits.userIsSysop ? '\n\nThis log does not track XfD-related deletions made using Twinkle.' : '');

		var editsummary = 'Logging ' + utils.toTLACase(params.venue) + ' nomination of [[:' + Morebits.pageNameNorm + ']].';
		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';
		// CFD/S and RM don't have canonical links
		var nominatedLink = params.discussionpage ? '[[' + params.discussionpage + '|nominated]]' : 'nominated';

		var appendText = '# [[:' + Morebits.pageNameNorm + ']]' + fileLogLink + ' ' + nominatedLink + ' at [[WP:' + params.venue.toUpperCase() + '|' + utils.toTLACase(params.venue) + ']]';
		var extraInfo = '';

		switch (params.venue) {
			case 'tfd':
				if (params.xfdcat === 'tfm') {
					appendText += ' (merge)';
					if (params.tfdtarget) {
						var contentModel = mw.config.get('wgPageContentModel') === 'Scribunto' ? 'Module:' : 'Template:';
						extraInfo += '; Other ' + contentModel.toLowerCase() + ' [[';
						if (!/^:?(?:template|module):/i.test(params.tfdtarget)) {
							extraInfo += contentModel;
						}
						extraInfo += params.tfdtarget + ']]';
					}
				}
				break;
			case 'mfd':
				if (initialContrib && params.notifyuserspace && params.userspaceOwner !== initialContrib) {
					extraInfo += ' and {{user|1=' + params.userspaceOwner + '}}';
				}
				break;
			case 'cfd':
				appendText += ' (' + utils.toTLACase(params.xfdcat) + ')';
				if (params.cfdtarget) {
					var categoryOrTemplate = params.xfdcat.charAt(0) === 's' ? 'Template:' : ':Category:';
					extraInfo += '; ' + params.action + ' to: [[' + categoryOrTemplate + params.cfdtarget + ']]';
					if (params.xfdcat === 'cfs' && params.cfdtarget2) {
						extraInfo += ', [[' + categoryOrTemplate + params.cfdtarget2 + ']]';
					}
				}
				break;
			case 'cfds':
				appendText += ' (' + utils.toTLACase(params.xfdcat) + ')';
				// Ensure there's more than just 'Category:'
				if (params.cfdstarget && params.cfdstarget.length > 9) {
					extraInfo += '; New name: [[:' + params.cfdstarget + ']]';
				}
				break;
			case 'rfd':
				if (params.rfdtarget) {
					extraInfo += '; Target: [[:' + params.rfdtarget + ']]';
					if (params.relatedpage) {
						extraInfo += ' (notified)';
					}
				}
				break;
			case 'rm':
				if (params.rmtr) {
					appendText += ' (technical)';
				}
				if (params.newname) {
					extraInfo += '; New name: [[:' + params.newname + ']]';
				}
				break;

			default: // afd or ffd
				break;
		}

		if (initialContrib) {
			appendText += '; notified {{user|1=' + initialContrib + '}}';
		}
		if (extraInfo) {
			appendText += extraInfo;
		}
		appendText += ' ~~~~~';
		if (params.reason) {
			appendText += "\n#* '''Reason''': " + Morebits.string.formatReasonForLog(params.reason);
		}

		usl.changeTags = Twinkle.changeTags;
		usl.log(appendText, editsummary);
	},

	afd: {
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].getAttribute('title');

					// First, simple test, is there an instance with this exact name?
					if (title === 'Wikipedia:Articles for deletion/' + Morebits.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var order_re = new RegExp('^' +
						Morebits.string.escapeRegExp('Wikipedia:Articles for deletion/' + Morebits.pageNameNorm) +
						'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				apiobj.params.number = utils.num2order(parseInt(number, 10) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Articles for deletion/' + Morebits.pageNameNorm + apiobj.params.numbering;

			Morebits.status.info('Next discussion page', '[[' + apiobj.params.discussionpage + ']]');

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Tagging article
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to article');
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
			wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.taggingArticle);
		},
		// Tagging needs to happen before everything else: this means we can check if there is an AfD tag already on the page
		taggingArticle: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			// Check for existing AfD tag, for the benefit of new page patrollers
			var textNoAfd = text.replace(/<!--.*AfD.*\n\{\{(?:Article for deletion\/dated|AfDM).*\}\}\n<!--.*(?:\n<!--.*)?AfD.*(?:\s*\n)?/g, '');
			if (text !== textNoAfd) {
				if (confirm('An AfD tag was found on this article. Maybe someone beat you to it.  \nClick OK to replace the current AfD tag (not recommended), or Cancel to abandon your nomination.')) {
					text = textNoAfd;
				} else {
					statelem.error('Article already tagged with AfD tag, and you chose to abort');
					window.location.reload();
					return;
				}
			}

			// Now we know we want to go ahead with it, trigger the other AJAX requests

			// Start discussion page, will also handle pagetriage and delsort listings
			var wikipedia_page = new Morebits.wiki.page(params.discussionpage, 'Creating article deletion discussion page');
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.discussionPage);

			// Today's list
			var date = new Morebits.date(pageobj.getLoadTime());
			wikipedia_page = new Morebits.wiki.page('Wikipedia:Articles for deletion/Log/' +
				date.format('YYYY MMMM D', 'utc'), "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.todaysList);
			// Notification to first contributor
			if (params.notifycreator) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
				thispage.lookupCreation(Twinkle.xfd.callbacks.afd.userNotification);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}

			// Remove some tags that should always be removed on AfD.
			text = text.replace(/\{\{\s*(dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated|prod2|Proposed deletion endorsed|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			// Then, test if there are speedy deletion-related templates on the article.
			var textNoSd = text.replace(/\{\{\s*(db(-\w*)?|delete|(?:hang|hold)[- ]?on)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			if (text !== textNoSd && confirm('A speedy deletion tag was found on this page. Should it be removed?')) {
				text = textNoSd;
			}

			var tag = (params.noinclude ? '<noinclude>{{' : '{{') + (params.number === '' ? 'subst:afd|help=off' : 'subst:afdx|' +
					params.number + '|help=off') + (params.noinclude ? '}}</noinclude>\n' : '}}\n');

			// Insert tag after short description or any hatnotes
			var wikipage = new Morebits.wikitext.page(text);
			text = wikipage.insertAfterTemplates(tag, Twinkle.hatnoteRegex).getText();

			pageobj.setPageText(text);
			pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(Twinkle.xfd.callbacks.getDiscussionWikitext('afd', params));
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki

				// Actions that should wait on the discussion page actually being created
				// and whose errors shouldn't output the user rationale
				// List at deletion sorting pages
				if (params.delsortCats) {
					params.delsortCats.forEach(function (cat) {
						var delsortPage = new Morebits.wiki.page('Wikipedia:WikiProject Deletion sorting/' + cat, 'Adding to list of ' + cat + '-related deletion discussions');
						delsortPage.setFollowRedirect(true); // In case a category gets renamed
						delsortPage.setCallbackParameters({discussionPage: params.discussionpage});
						delsortPage.load(Twinkle.xfd.callbacks.afd.delsortListing);
					});
				}
				// Mark the page as curated/patrolled, if wanted
				if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
					pageobj.triage();
				}
			});
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText() + '\n';  // MW strips trailing blanks, but we like them, so we add a fake one
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace(/(<!-- Add new entries to the TOP of the following list -->\n+)/, '$1{{subst:afd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}\n');
			if (text === old_text) {
				var linknode = document.createElement('a');
				linknode.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing AFD') + '?action=purge');
				linknode.appendChild(document.createTextNode('How to fix AFD'));
				statelem.error([ 'Could not find the target spot for the discussion. To fix this problem, please see ', linknode, '.' ]);
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:Afd notice|1=' + Morebits.pageNameNorm + (params.numbering !== '' ? '|order=&#32;' + params.numbering : '') + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|nomination]] of [[:' + Morebits.pageNameNorm + ']]  at [[WP:AFD|articles for deletion]].');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			Twinkle.xfd.setWatchPref(usertalkpage, Twinkle.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(function onNotifySuccess() {
				// add this nomination to the user's userspace log
				Twinkle.xfd.callbacks.addToLog(params, initialContrib);
			}, function onNotifyError() {
				// if user could not be notified, log nomination without mentioning that notification was sent
				Twinkle.xfd.callbacks.addToLog(params, null);
			});
		},
		delsortListing: function(pageobj) {
			var discussionPage = pageobj.getCallbackParameters().discussionPage;
			var text = pageobj.getPageText().replace('directly below this line -->', 'directly below this line -->\n{{' + discussionPage + '}}');
			pageobj.setPageText(text);
			pageobj.setEditSummary('Listing [[:' + discussionPage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		}
	},


	tfd: {
		taggingTemplate: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var tableNewline = params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : ''; // No newline for inline

			pageobj.setPageText((params.noinclude ? '<noinclude>' : '') + '{{subst:template for discussion|help=off' +
				(params.templatetype !== 'standard' ? '|type=' + params.templatetype : '') + (params.noinclude ? '}}</noinclude>' : '}}') + tableNewline + text);
			pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			if (params.scribunto) {
				pageobj.setCreateOption('recreate'); // Module /doc might not exist
			}
			pageobj.save();
		},
		taggingTemplateForMerge: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var tableNewline = params.templatetype === 'standard' || params.templatetype === 'sidebar' ? '\n' : ''; // No newline for inline

			pageobj.setPageText((params.noinclude ? '<noinclude>' : '') + '{{subst:tfm|help=off|' +
				(params.templatetype !== 'standard' ? 'type=' + params.templatetype + '|' : '') + '1=' + params.otherTemplateName.replace(/^(?:Template|Module):/, '') +
				(params.noinclude ? '}}</noinclude>' : '}}') + tableNewline + text);
			pageobj.setEditSummary('Listed for merging with [[:' + params.otherTemplateName + ']]; see [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			if (params.scribunto) {
				pageobj.setCreateOption('recreate'); // Module /doc might not exist
			}
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = Twinkle.xfd.callbacks.getDiscussionWikitext(params.xfdcat, params);

			var text = old_text.replace('-->', '-->\n' + added_data);
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding ' + (params.xfdcat === 'tfd' ? 'deletion nomination' : 'merge listing') + ' of [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n';
			var modNotice = mw.config.get('wgPageContentModel') === 'Scribunto' ? '|module=yes' : '';
			switch (params.xfdcat) {
				case 'tfd':
					notifytext += '{{subst:Tfd notice|1=' + mw.config.get('wgTitle') + modNotice + '}} ~~~~';
					break;
				case 'tfm':
					notifytext += '{{subst:Tfm notice|1=' + mw.config.get('wgTitle') + '|2=' + params.tfdtarget + modNotice + '}} ~~~~';
					break;
				default:
					alert('twinklexfd in userNotification: unknown TFD action');
					break;
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + pageobj.getPageName() + ']] at [[WP:TFD|templates for discussion]].');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			Twinkle.xfd.setWatchPref(usertalkpage, Twinkle.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true, false);

			// Add this nomination to user's userspace log if it isn't the second template
			// in a TfM nomination
			if (params.xfdcat === 'tfd' || pageobj.getPageName() === Morebits.pageNameNorm) {
				usertalkpage.append(function onNotifySuccess() {
					Twinkle.xfd.callbacks.addToLog(params, initialContrib);
				}, function onNotifyError() {
					// if user could not be notified, log without mentioning notification
					Twinkle.xfd.callbacks.addToLog(params, null);
				});
			} else {
				usertalkpage.append();
			}
		}
	},


	mfd: {
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].getAttribute('title');

					// First, simple test, is there an instance with this exact name?
					if (title === 'Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var order_re = new RegExp('^' +
							Morebits.string.escapeRegExp('Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm) +
							'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				apiobj.params.number = utils.num2order(parseInt(number, 10) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Miscellany for deletion/' + Morebits.pageNameNorm + apiobj.params.numbering;

			apiobj.statelem.info('next in order is [[' + apiobj.params.discussionpage + ']]');

			// Tagging page
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page with deletion tag');
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.taggingPage);

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Discussion page
			wikipedia_page = new Morebits.wiki.page(apiobj.params.discussionpage, 'Creating deletion discussion page');
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.discussionPage);

			// Today's list
			wikipedia_page = new Morebits.wiki.page('Wikipedia:Miscellany for deletion', "Adding discussion to today's list");
			wikipedia_page.setPageSection(2);
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.todaysList);

			// Notification to first contributor, and notification to owner of userspace (if applicable and required)
			if (apiobj.params.notifycreator) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(apiobj.params);
				thispage.lookupCreation(Twinkle.xfd.callbacks.mfd.userNotification);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(apiobj.params, null);
			}
		},
		taggingPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText((params.noinclude ? '<noinclude>' : '') + '{{' +
				(params.number === '' ? 'mfd' : 'mfdx|' + params.number) + '|help=off}}\n' +
				(params.noinclude ? '</noinclude>' : '') + text);
			pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(Twinkle.xfd.callbacks.getDiscussionWikitext('mfd', params));
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var date = new Morebits.date(pageobj.getLoadTime());
			var date_header = date.format('===MMMM D, YYYY===\n', 'utc');
			var date_header_regex = new RegExp(date.format('(===[\\s]*MMMM[\\s]+D,[\\s]+YYYY[\\s]*===)', 'utc'));
			var new_data = '{{subst:mfd3|pg=' + Morebits.pageNameNorm + params.numbering + '}}';

			if (date_header_regex.test(text)) { // we have a section already
				statelem.info('Found today\'s section, proceeding to add new entry');
				text = text.replace(date_header_regex, '$1\n' + new_data);
			} else { // we need to create a new section
				statelem.info('No section for today found, proceeding to create one');
				text = text.replace('===', date_header + new_data + '\n\n===');
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Also notify the user who owns the subpage if they are not the creator
			params.userspaceOwner = mw.config.get('wgRelevantUserName');
			if (params.notifyuserspace && params.userspaceOwner !== initialContrib) {
				Twinkle.xfd.callbacks.mfd.userNotificationMain(params, params.userspaceOwner, 'Notifying owner of userspace');
			}

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
			} else {
				// Used to ensure we only add to the userspace
				// log once, after notifying the initial creator
				params.initialContrib = initialContrib;
				// Really notify the creator
				Twinkle.xfd.callbacks.mfd.userNotificationMain(params, initialContrib, 'Notifying initial contributor');
			}
		},
		userNotificationMain: function(params, userTarget, actionName) {
			var usertalkpage = new Morebits.wiki.page('User talk:' + userTarget, actionName + ' (' + userTarget + ')');
			var notifytext = '\n{{subst:Mfd notice|1=' + Morebits.pageNameNorm + (params.numbering !== '' ? '|order=&#32;' + params.numbering : '') + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|nomination]] of [[:' + Morebits.pageNameNorm + ']] at [[WP:MFD|miscellany for deletion]].');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			Twinkle.xfd.setWatchPref(usertalkpage, Twinkle.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			// Only log once, using the initial creator's notification as our barometer
			if (params.initialContrib === userTarget) {
				usertalkpage.append(function onNotifySuccess() {
					Twinkle.xfd.callbacks.addToLog(params, userTarget);
				}, function onNotifyError() {
					// if user could not be notified, log without mentioning notification
					Twinkle.xfd.callbacks.addToLog(params, null);
				});
			} else {
				usertalkpage.append();
			}

		}
	},


	ffd: {
		main: function(pageobj) {
			// this is coming in from lookupCreation...!
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();
			params.uploader = initialContrib;

			// Adding discussion
			var wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.ffd.todaysList);

			// Notification to first contributor
			if (params.notifycreator) {
				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				} else {
					var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
					var notifytext = '\n{{subst:Ffd notice|1=' + mw.config.get('wgTitle') + '}}';
					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + Morebits.pageNameNorm + ']] at [[WP:FFD|files for discussion]].');
					usertalkpage.setChangeTags(Twinkle.changeTags);
					usertalkpage.setCreateOption('recreate');
					Twinkle.xfd.setWatchPref(usertalkpage, Twinkle.getPref('xfdWatchUser'));
					usertalkpage.setFollowRedirect(true, false);
					usertalkpage.append(function onNotifySuccess() {
						// add this nomination to the user's userspace log
						Twinkle.xfd.callbacks.addToLog(params, initialContrib);
					}, function onNotifyError() {
						// if user could not be notified, log nomination without mentioning that notification was sent
						Twinkle.xfd.callbacks.addToLog(params, null);
					});
				}
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}
		},
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

			pageobj.setPageText('{{ffd|log=' + params.date + '|help=off}}\n' + text);
			pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// add date header if the log is found to be empty (a bot should do this automatically, but it sometimes breaks down)
			if (!pageobj.exists()) {
				text = '{{subst:Ffd log}}';
			}

			pageobj.setPageText(text + '\n\n' + Twinkle.xfd.callbacks.getDiscussionWikitext('ffd', params));
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	},


	cfd: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			var added_data = '{{subst:' + params.xfdcat;
			var editsummary = (mw.config.get('wgNamespaceNumber') === 14 ? 'Category' : 'Stub template') +
				' being considered for ' + params.action;
			switch (params.xfdcat) {
				case 'cfd':
				case 'sfd-t':
					break;
				case 'cfc':
					editsummary += ' to an article';
					// falls through
				case 'cfm':
				case 'cfr':
				case 'sfr-t':
					added_data += '|' + params.cfdtarget;
					break;
				case 'cfs':
					added_data += '|' + params.cfdtarget + '|' + params.cfdtarget2;
					break;
				default:
					alert('twinklexfd in taggingCategory(): unknown CFD action');
					break;
			}
			added_data += '}}';
			editsummary += '; see [[:' + params.discussionpage + ']].';

			pageobj.setPageText(added_data + '\n' + text);
			pageobj.setEditSummary(editsummary);
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = Twinkle.xfd.callbacks.getDiscussionWikitext(params.xfdcat, params);
			var editsummary = 'Adding ' + params.action + ' nomination of [[:' + Morebits.pageNameNorm + ']].';

			var text = old_text.replace('below this line -->', 'below this line -->\n' + added_data);
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary(editsummary);
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:Cfd notice|1=' + Morebits.pageNameNorm + '|action=' + params.action + (mw.config.get('wgNamespaceNumber') === 10 ? '|stub=yes' : '') + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + Morebits.pageNameNorm + ']] at [[WP:CFD|categories for discussion]].');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			Twinkle.xfd.setWatchPref(usertalkpage, Twinkle.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(function onNotifySuccess() {
				// add this nomination to the user's userspace log
				Twinkle.xfd.callbacks.addToLog(params, initialContrib);
			}, function onNotifyError() {
				// if user could not be notified, log nomination without mentioning that notification was sent
				Twinkle.xfd.callbacks.addToLog(params, null);
			});
		}
	},


	cfds: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText('{{subst:cfr-speedy|1=' + params.cfdstarget.replace(/^:?Category:/, '') + '}}\n' + text);
			pageobj.setEditSummary('Listed for speedy renaming; see [[WP:CFDS|Categories for discussion/Speedy]].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save(function() {
				// No user notification for CfDS, so just add this nomination to the user's userspace log
				Twinkle.xfd.callbacks.addToLog(params, null);
			});
		},
		addToList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace('BELOW THIS LINE -->', 'BELOW THIS LINE -->\n' + Twinkle.xfd.callbacks.getDiscussionWikitext('cfds', params));
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	},


	rfd: {
		// This gets called both on submit and preview to determine the redirect target
		findTarget: function(params, callback) {
			// Used by regular redirects to find the target, but for all redirects,
			// avoid relying on the client clock to build the log page
			var query = {
				'action': 'query',
				'curtimestamp': true
			};
			if (document.getElementById('softredirect')) {
				// For soft redirects, define the target early
				// to skip target checks in findTargetCallback
				params.rfdtarget = document.getElementById('softredirect').textContent.replace(/^:+/, '');
			} else {
				// Find current target of redirect
				query.titles = mw.config.get('wgPageName');
				query.redirects = true;
			}
			var wikipedia_api = new Morebits.wiki.api('Finding target of redirect', query, Twinkle.xfd.callbacks.rfd.findTargetCallback(callback));
			wikipedia_api.params = params;
			wikipedia_api.post();
		},
		// This is a closure for the callback from the above API request, which gets the target of the redirect
		findTargetCallback: function(callback) {
			return function(apiobj) {
				var $xmlDoc = $(apiobj.responseXML);
				var curtimestamp = $xmlDoc.find('api').attr('curtimestamp');
				apiobj.params.curtimestamp = curtimestamp;
				if (!apiobj.params.rfdtarget) { // Not a softredirect
					var target = $xmlDoc.find('redirects r').first().attr('to');
					if (!target) {
						var message = 'This page does not appear to be a redirect, aborting';
						if (mw.config.get('wgAction') === 'history') {
							message += '. If this is a soft redirect, try again from the content page, not the page history.';
						}
						apiobj.statelem.error(message);
						return;
					}
					apiobj.params.rfdtarget = target;
					var section = $xmlDoc.find('redirects r').first().attr('tofragment');
					apiobj.params.section = section;
				}
				callback(apiobj.params);
			};
		},
		main: function(params) {
			var date = new Morebits.date(params.curtimestamp);
			params.logpage = 'Wikipedia:Redirects for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;

			// Tagging redirect
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to redirect');
			wikipedia_page.setFollowRedirect(false);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.rfd.taggingRedirect);

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = params.logpage;
			Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion
			wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's log");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.rfd.todaysList);

			// Notifications
			if (params.notifycreator || params.relatedpage) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(Twinkle.xfd.callbacks.rfd.sendNotifications);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}
		},
		taggingRedirect: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			pageobj.setPageText('{{subst:rfd|' + (mw.config.get('wgNamespaceNumber') === 10 ? 'showontransclusion=1|' : '') + 'content=\n' + text + '\n}}');
			pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchPage'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			// params.rfdtarget + sectionHash + "}} ~~~~\n" );
			var added_data = Twinkle.xfd.callbacks.getDiscussionWikitext('rfd', params);
			var text = old_text.replace(/(<!-- Add new entries directly below this line\.? -->)/, '$1\n' + added_data);
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		sendNotifications: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			// Notifying initial contributor
			if (params.notifycreator) {
				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					statelem.warn('You (' + initialContrib + ') created this page; skipping user notification');
				} else {
					Twinkle.xfd.callbacks.rfd.userNotification(params, initialContrib);
				}
			}

			// Notifying target page's watchers, if not a soft redirect
			if (params.relatedpage) {
				var targetTalk = new mw.Title(params.rfdtarget).getTalkPage();

				// On the offchance it's a circular redirect
				if (params.rfdtarget === mw.config.get('wgPageName')) {
					statelem.warn('Circular redirect; skipping target page notification');
				} else if (document.getElementById('softredirect')) {
					statelem.warn('Soft redirect; skipping target page notification');
				} else if (targetTalk.getNamespaceId() === 3) {
					// Don't issue if target talk is the initial contributor's talk or your own
					if (targetTalk.getNameText() === initialContrib) {
						statelem.warn('Target is initial contributor; skipping target page notification');
					} else if (targetTalk.getNameText() === mw.config.get('wgUserName')) {
						statelem.warn('You (' + mw.config.get('wgUserName') + ') are the target; skipping target page notification');
					}
				} else {
					Twinkle.xfd.callbacks.rfd.targetNotification(params, targetTalk.toText());
				}
			}
		},
		userNotification: function(params, initialContrib) {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:Rfd notice|1=' + Morebits.pageNameNorm + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + Morebits.pageNameNorm + ']] at [[WP:RFD|redirects for discussion]].');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			Twinkle.xfd.setWatchPref(usertalkpage, Twinkle.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(function onNotifySuccess() {
				// add this nomination to the user's userspace log
				Twinkle.xfd.callbacks.addToLog(params, initialContrib);
			}, function onNotifyError() {
				// if user could not be notified, log nomination without mentioning that notification was sent
				Twinkle.xfd.callbacks.addToLog(params, null);
			});
		},
		targetNotification: function(params, targetTalk) {
			var targettalkpage = new Morebits.wiki.page(targetTalk, 'Notifying redirect target of the discussion');
			var notifytext = '\n{{subst:Rfd notice|1=' + Morebits.pageNameNorm + '}} ~~~~';
			targettalkpage.setAppendText(notifytext);
			targettalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + Morebits.pageNameNorm + ']] at [[WP:RFD|redirects for discussion]].');
			targettalkpage.setChangeTags(Twinkle.changeTags);
			targettalkpage.setCreateOption('recreate');
			Twinkle.xfd.setWatchPref(targettalkpage, Twinkle.getPref('xfdWatchRelated'));
			targettalkpage.setFollowRedirect(true);
			targettalkpage.append(function() {
				// Add to userspace log if not notifying the creator
				if (!params.notifycreator) {
					Twinkle.xfd.callbacks.addToLog(params, null);
				}
			});

		}
	},

	rm: {
		listAtTalk: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setAppendText('\n\n' + Twinkle.xfd.callbacks.getDiscussionWikitext('rm', params));
			pageobj.setEditSummary('Proposing move' + (params.newname ? ' to [[:' + params.newname + ']]' : ''));
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setCreateOption('recreate'); // since the talk page need not exist
			Twinkle.xfd.setWatchPref(pageobj, Twinkle.getPref('xfdWatchDiscussion'));
			pageobj.append(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
				// add this nomination to the user's userspace log
				Twinkle.xfd.callbacks.addToLog(params, null);
			});
		},

		listAtRMTR: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var hiddenCommentRE = /---- and enter on a new line.* -->/;
			var newtext = text.replace(hiddenCommentRE, '$&\n' + Twinkle.xfd.callbacks.getDiscussionWikitext('rm', params));
			if (text === newtext) {
				statelem.error('failed to find target spot for the entry');
				return;
			}
			pageobj.setPageText(newtext);
			pageobj.setEditSummary('Adding [[:' + Morebits.pageNameNorm + ']].');
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
				// add this nomination to the user's userspace log
				Twinkle.xfd.callbacks.addToLog(params, null);
			});
		}
	}
};



Twinkle.xfd.callback.evaluate = function(e) {
	var form = e.target;

	var params = Morebits.quickForm.getInputData(form);

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Twinkle.xfd.currentRationale = params.reason;
	Morebits.status.onError(Twinkle.xfd.printRationale);

	var query, wikipedia_page, wikipedia_api;
	var date = new Morebits.date(); // XXX: avoid use of client clock, still used by TfD, FfD and CfD
	switch (params.venue) {

		case 'afd': // AFD
			query = {
				'action': 'query',
				'list': 'allpages',
				'apprefix': 'Articles for deletion/' + Morebits.pageNameNorm,
				'apnamespace': 4,
				'apfilterredir': 'nonredirects',
				'aplimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
			};
			wikipedia_api = new Morebits.wiki.api('Tagging article with deletion tag', query, Twinkle.xfd.callbacks.afd.main);
			wikipedia_api.params = params;
			wikipedia_api.post();
			break;

		case 'tfd': // TFD
			Morebits.wiki.addCheckpoint();
			if (params.tfdtarget) { // remove namespace name
				params.tfdtarget = utils.stripNs(params.tfdtarget);
			}

			params.logpage = 'Wikipedia:Templates for discussion/Log/' + date.format('YYYY MMMM D', 'utc'),
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;

			// Modules can't be tagged, TfD instructions are to place
			// on /doc subpage, so need to tag and watch specially
			params.scribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
			var watch_query = {
				action: 'watch',
				titles: [ mw.config.get('wgPageName') ],
				token: mw.user.tokens.get('watchToken')
			};
			// Tagging template(s)/module(s)
			if (params.xfdcat === 'tfm') { // Merge
				var wikipedia_otherpage;

				// Tag this template/module
				if (params.scribunto) {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging this module documentation with merge tag');
					params.otherTemplateName = 'Module:' + params.tfdtarget;
					wikipedia_otherpage = new Morebits.wiki.page(params.otherTemplateName + '/doc', 'Tagging other module documentation with merge tag');

					// Watch tagged module pages as well
					if (Twinkle.getPref('xfdWatchPage') !== 'no') {
						watch_query.titles.push(params.otherTemplateName);
						new Morebits.wiki.api('Adding Modules to watchlist', watch_query).post();
					}
				} else {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging this template with merge tag');
					params.otherTemplateName = 'Template:' + params.tfdtarget;
					wikipedia_otherpage = new Morebits.wiki.page(params.otherTemplateName, 'Tagging other template with merge tag');
				}
				wikipedia_page.setFollowRedirect(true);
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(Twinkle.xfd.callbacks.tfd.taggingTemplateForMerge);

				// Tag other template/module
				wikipedia_otherpage.setFollowRedirect(true);
				var otherParams = $.extend({}, params);
				otherParams.otherTemplateName = Morebits.pageNameNorm;
				wikipedia_otherpage.setCallbackParameters(otherParams);
				wikipedia_otherpage.load(Twinkle.xfd.callbacks.tfd.taggingTemplateForMerge);
			} else { // delete
				if (params.scribunto) {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging module documentation with deletion tag');

					// Watch tagged module page as well
					if (Twinkle.getPref('xfdWatchPage') !== 'no') {
						new Morebits.wiki.api('Adding Module to watchlist', watch_query).post();
					}
				} else {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging template with deletion tag');
				}
				wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(Twinkle.xfd.callbacks.tfd.taggingTemplate);
			}

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = params.logpage;
			Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion
			wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's log");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.tfd.todaysList);

			// Notification to first contributors
			if (params.notifycreator) {
				var involvedpages = [];
				var seenusers = [];
				involvedpages.push(new Morebits.wiki.page(mw.config.get('wgPageName')));
				if (params.xfdcat === 'tfm') {
					if (params.scribunto) {
						involvedpages.push(new Morebits.wiki.page('Module:' + params.tfdtarget));
					} else {
						involvedpages.push(new Morebits.wiki.page('Template:' + params.tfdtarget));
					}
				}
				involvedpages.forEach(function(page) {
					page.setCallbackParameters(params);
					page.lookupCreation(function(innerpage) {
						var username = innerpage.getCreator();
						if (seenusers.indexOf(username) === -1) {
							seenusers.push(username);
							Twinkle.xfd.callbacks.tfd.userNotification(innerpage);
						}
					});
				});
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}

			Morebits.wiki.removeCheckpoint();
			break;

		case 'mfd': // MFD
			query = {
				'action': 'query',
				'list': 'allpages',
				'apprefix': 'Miscellany for deletion/' + Morebits.pageNameNorm,
				'apnamespace': 4,
				'apfilterredir': 'nonredirects',
				'aplimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
			};
			wikipedia_api = new Morebits.wiki.api('Looking for prior nominations of this page', query, Twinkle.xfd.callbacks.mfd.main);
			wikipedia_api.params = params;
			wikipedia_api.post();
			break;

		case 'ffd': // FFD
			params.date = date.format('YYYY MMMM D', 'utc');
			params.logpage = 'Wikipedia:Files for discussion/' + params.date;
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;

			Morebits.wiki.addCheckpoint();

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = params.logpage;
			Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Tagging file
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to file page');
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.ffd.taggingImage);

			// Contributor specific edits
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.lookupCreation(Twinkle.xfd.callbacks.ffd.main);

			Morebits.wiki.removeCheckpoint();
			break;

		case 'cfd':
			Morebits.wiki.addCheckpoint();

			if (params.cfdtarget) {
				params.cfdtarget = utils.stripNs(params.cfdtarget);
			} else {
				params.cfdtarget = '';
			}
			if (params.cfdtarget2) {
				params.cfdtarget2 = utils.stripNs(params.cfdtarget2);
			}

			params.logpage = 'Wikipedia:Categories for discussion/Log/' + date.format('YYYY MMMM D', 'utc');
			params.discussionpage = params.logpage + '#' + Morebits.pageNameNorm;

			// Useful for customized actions in edit summaries and the notification template
			var summaryActions = {
				cfd: 'deletion',
				'sfd-t': 'deletion',
				cfm: 'merging',
				cfr: 'renaming',
				'sfr-t': 'renaming',
				cfs: 'splitting',
				cfc: 'conversion'
			};
			params.action = summaryActions[params.xfdcat];

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = params.logpage;
			Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Tagging category
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging category with ' + params.action + ' tag');
			wikipedia_page.setFollowRedirect(true); // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.cfd.taggingCategory);

			// Adding discussion to list
			wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
			wikipedia_page.setPageSection(2);
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.cfd.todaysList);

			// Notification to first contributor
			if (params.notifycreator) {
				wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.lookupCreation(Twinkle.xfd.callbacks.cfd.userNotification);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else {
				Twinkle.xfd.callbacks.addToLog(params, null);
			}

			Morebits.wiki.removeCheckpoint();
			break;

		case 'cfds':
			// add namespace name if missing
			params.cfdstarget = utils.addNs(params.cfdstarget, 14);

			var logpage = 'Wikipedia:Categories for discussion/Speedy';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = logpage;
			Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Tagging category
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging category with rename tag');
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.cfds.taggingCategory);

			// Adding discussion to list
			wikipedia_page = new Morebits.wiki.page(logpage, 'Adding discussion to the list');
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.cfds.addToList);

			break;

		case 'rfd':
			// find target and pass main as the callback
			Twinkle.xfd.callbacks.rfd.findTarget(params, Twinkle.xfd.callbacks.rfd.main);
			break;

		case 'rm':
			var nomPageName = params.rmtr ?
				'Wikipedia:Requested moves/Technical requests' :
				new mw.Title(Morebits.pageNameNorm).getTalkPage().toText();

			Morebits.wiki.actionCompleted.redirect = nomPageName;
			Morebits.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			wikipedia_page = new Morebits.wiki.page(nomPageName, params.rmtr ? 'Adding entry at WP:RM/TR' : 'Adding entry on talk page');
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);

			if (params.rmtr) {
				wikipedia_page.setPageSection(2);
				wikipedia_page.load(Twinkle.xfd.callbacks.rm.listAtRMTR);
			} else {
				// listAtTalk uses .append(), so no need to load the page
				Twinkle.xfd.callbacks.rm.listAtTalk(wikipedia_page);
			}
			break;

		default:
			alert('twinklexfd: unknown XFD discussion venue');
			break;
	}
};

Twinkle.addInitCallback(Twinkle.xfd, 'xfd');
})(jQuery);


// </nowiki>
