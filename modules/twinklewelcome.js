// <nowiki>

(function() {

/*
 ****************************************
 *** twinklewelcome.js: Welcome module
 ****************************************
 * Mode of invocation:     Tab ("Wel"), or from links on diff pages
 * Active on:              Any page with relevant user name (userspace,
 *                         contribs, etc.) and diff pages
 */

Twinkle.welcome = function twinklewelcome() {
	if (Twinkle.getPrefill('twinklewelcome')) {
		if (Twinkle.getPrefill('twinklewelcome') === 'auto') {
			Twinkle.welcome.auto();
		} else {
			Twinkle.welcome.semiauto();
		}
	} else {
		Twinkle.welcome.normal();
	}
};

Twinkle.welcome.auto = function() {
	if (mw.util.getParamValue('action') !== 'edit') {
		// userpage not empty, aborting auto-welcome
		return;
	}

	Twinkle.welcome.welcomeUser();
};

Twinkle.welcome.semiauto = function() {
	Twinkle.welcome.callback(mw.config.get('wgRelevantUserName'));
};

Twinkle.welcome.normal = function() {
	const isDiff = mw.util.getParamValue('diff');
	if (isDiff) {
		// check whether the contributors' talk pages exist yet
		const $oldDiffUsernameLine = $('#mw-diff-otitle2');
		const $newDiffUsernameLine = $('#mw-diff-ntitle2');
		const $oldDiffHasRedlinkedTalkPage = $oldDiffUsernameLine.find('span.mw-usertoollinks a.new:contains(talk)').first();
		const $newDiffHasRedlinkedTalkPage = $newDiffUsernameLine.find('span.mw-usertoollinks a.new:contains(talk)').first();

		const diffHasRedlinkedTalkPage = $oldDiffHasRedlinkedTalkPage.length > 0 || $newDiffHasRedlinkedTalkPage.length > 0;
		if (diffHasRedlinkedTalkPage) {
			const spanTag = function(color, content) {
				const span = document.createElement('span');
				span.style.color = color;
				span.appendChild(document.createTextNode(content));
				return span;
			};

			const welcomeNode = document.createElement('strong');
			const welcomeLink = document.createElement('a');
			welcomeLink.appendChild(spanTag('Black', '['));
			welcomeLink.appendChild(spanTag('Goldenrod', 'welcome'));
			welcomeLink.appendChild(spanTag('Black', ']'));
			welcomeNode.appendChild(welcomeLink);

			if ($oldDiffHasRedlinkedTalkPage.length > 0) {
				const oHref = $oldDiffHasRedlinkedTalkPage.attr('href');

				const oWelcomeNode = welcomeNode.cloneNode(true);
				oWelcomeNode.firstChild.setAttribute('href', oHref + '&' + $.param({
					twinklewelcome: Twinkle.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					vanarticle: Morebits.pageNameNorm
				}));
				$oldDiffHasRedlinkedTalkPage[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$oldDiffHasRedlinkedTalkPage[0].parentNode.parentNode.appendChild(oWelcomeNode);
			}

			if ($newDiffHasRedlinkedTalkPage.length > 0) {
				const nHref = $newDiffHasRedlinkedTalkPage.attr('href');

				const nWelcomeNode = welcomeNode.cloneNode(true);
				nWelcomeNode.firstChild.setAttribute('href', nHref + '&' + $.param({
					twinklewelcome: Twinkle.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					vanarticle: Morebits.pageNameNorm
				}));
				$newDiffHasRedlinkedTalkPage[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$newDiffHasRedlinkedTalkPage[0].parentNode.parentNode.appendChild(nWelcomeNode);
			}
		}
	}
	// Users and IPs but not IP ranges
	if (mw.config.exists('wgRelevantUserName') && !Morebits.ip.isRange(mw.config.get('wgRelevantUserName'))) {
		Twinkle.addPortletLink(() => {
			Twinkle.welcome.callback(mw.config.get('wgRelevantUserName'));
		}, 'Wel', 'twinkle-welcome', 'Welcome user');
	}
};

Twinkle.welcome.welcomeUser = function welcomeUser() {
	Morebits.Status.init(document.getElementById('mw-content-text'));
	$('#catlinks').remove();

	const params = {
		template: Twinkle.getPref('quickWelcomeTemplate'),
		article: Twinkle.getPrefill('vanarticle') || '',
		mode: 'auto'
	};

	const userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Welcoming complete, reloading talk page in a few seconds';

	const wikipedia_page = new Morebits.wiki.Page(userTalkPage, 'User talk page modification');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.welcome.callback = function twinklewelcomeCallback(uid) {
	if (uid === mw.config.get('wgUserName') && !confirm('Are you really sure you want to welcome yourself?...')) {
		return;
	}

	const Window = new Morebits.SimpleWindow(600, 420);
	Window.setTitle('Welcome user');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Welcoming Committee', 'WP:WC');
	Window.addFooterLink('Welcome prefs', 'WP:TW/PREF#welcome');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#welcome');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.welcome.callback.evaluate);

	form.append({
		type: 'select',
		name: 'type',
		label: 'Type of welcome:',
		event: Twinkle.welcome.populateWelcomeList,
		list: [
			{ type: 'option', value: 'standard', label: 'Standard welcomes', selected: !mw.util.isIPAddress(mw.config.get('wgRelevantUserName')) },
			{ type: 'option', value: 'unregistered', label: 'Unregistered user welcomes', selected: mw.util.isIPAddress(mw.config.get('wgRelevantUserName')) || mw.util.isTemporaryUser(mw.config.get('wgRelevantUserName')) },
			{ type: 'option', value: 'wikiProject', label: 'WikiProject welcomes' },
			{ type: 'option', value: 'nonEnglish', label: 'Non-English welcomes' }
		]
	});

	form.append({
		type: 'div',
		id: 'welcomeWorkArea',
		className: 'morebits-scrollbox'
	});

	form.append({
		type: 'input',
		name: 'article',
		label: '* Linked article (if supported by template):',
		value: Twinkle.getPrefill('vanarticle') || '',
		tooltip: 'An article might be linked from within the welcome if the template supports it. Leave empty for no article to be linked.  Templates that support a linked article are marked with an asterisk.'
	});

	const previewlink = document.createElement('a');
	$(previewlink).on('click', () => {
		Twinkle.welcome.callbacks.preview(result); // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', name: 'welcomepreview', label: [ previewlink ] });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// initialize the welcome list
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type.dispatchEvent(evt);
};

Twinkle.welcome.populateWelcomeList = function(e) {
	const type = e.target.value;

	const container = new Morebits.QuickForm.Element({ type: 'fragment' });

	if ((type === 'standard' || type === 'unregistered') && Twinkle.getPref('customWelcomeList').length) {
		container.append({ type: 'header', label: 'Custom welcome templates' });
		container.append({
			type: 'radio',
			name: 'template',
			list: Twinkle.getPref('customWelcomeList'),
			event: function() {
				e.target.form.article.disabled = false;
			}
		});
	}

	const sets = Twinkle.welcome.templates[type];
	$.each(sets, (label, templates) => {
		container.append({ type: 'header', label: label });
		container.append({
			type: 'radio',
			name: 'template',
			list: $.map(templates, (properties, template) => ({
					value: template,
					label: '{{' + template + '}}: ' + properties.description + (properties.linkedArticle ? '\u00A0*' : ''), // U+00A0 NO-BREAK SPACE
					tooltip: properties.tooltip // may be undefined
				})),
			event: function(ev) {
				ev.target.form.article.disabled = !templates[ev.target.value].linkedArticle;
			}
		});
	});

	const rendered = container.render();
	$(e.target.form).find('div#welcomeWorkArea').empty().append(rendered);

	const firstRadio = e.target.form.template[0];
	firstRadio.checked = true;
	const vals = Object.values(sets)[0];
	e.target.form.article.disabled = vals[firstRadio.value] ? !vals[firstRadio.value].linkedArticle : true;
};

// A list of welcome templates and their properties and syntax

// The four fields that are available are "description", "linkedArticle", "syntax", and "tooltip".
// The three magic words that can be used in the "syntax" field are:
//   - $USERNAME$  - replaced by the welcomer's username, depending on user's preferences
//   - $ARTICLE$   - replaced by an article name, if "linkedArticle" is true
//   - $HEADER$    - adds a level 2 header (most templates already include this)
//   - $EXTRA$     - custom message to be added at the end of the template. not implemented yet.

Twinkle.welcome.templates = {
	standard: {
		'General welcome templates': {
			welcome: {
				description: 'standard welcome',
				linkedArticle: true,
				syntax: '{{subst:welcome|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-retro': {
				description: 'a welcome message with a small list of helpful links',
				linkedArticle: true,
				syntax: '{{subst:welcome-retro|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-short': {
				description: 'a shorter welcome message',
				syntax: '{{subst:W-short|$EXTRA$}}'
			},
			'welcome-cookie': {
				description: 'a welcome message with some helpful links and a plate of cookies',
				syntax: '{{subst:welcome cookie}} ~~~~'
			},
			welcoming: {
				description: 'welcome message with tutorial links and basic editing tips',
				syntax: '{{subst:Welcoming}}'
			}
		},

		'Specific welcome templates': {
			'welcome-belated': {
				description: 'welcome for users with more substantial contributions',
				syntax: '{{subst:welcome-belated|$USERNAME$}}'
			},
			'welcome student': {
				description: 'welcome for students editing as part of an educational class project',
				syntax: '$HEADER$ {{subst:welcome student|$USERNAME$}} ~~~~'
			},
			'welcome teacher': {
				description: 'welcome for course instructors involved in an educational class project',
				syntax: '$HEADER$ {{subst:welcome teacher|$USERNAME$}} ~~~~'
			},
			'welcome non-latin': {
				description: 'welcome for users with a username containing non-Latin characters',
				syntax: '{{subst:welcome non-latin|$USERNAME$}} ~~~~'
			},
			'welcome mentor': {
				description: 'welcome for mentor users to give to their mentees',
				syntax: '{{subst:mentor welcome|$USERNAME$}} ~~~~'
			},
			'welcome draft': {
				description: 'welcome for users who write draft articles',
				linkedArticle: true,
				syntax: '{{subst:welcome draft|art=$ARTICLE$}} ~~~~'
			}
		},

		'Problem user welcome templates': {
			'first article': {
				description: 'for someone whose first article did not meet page creation guidelines',
				linkedArticle: true,
				syntax: '{{subst:first article|$ARTICLE$|$USERNAME$}}'
			},
			'welcome-COI': {
				description: 'for someone who has edited in areas where they may have a conflict of interest',
				linkedArticle: true,
				syntax: '{{subst:welcome-COI|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-auto': {
				description: 'for someone who created an autobiographical article',
				linkedArticle: true,
				syntax: '{{subst:welcome-auto|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-copyright': {
				description: 'for someone who has been adding copyright violations to articles',
				linkedArticle: true,
				syntax: '{{subst:welcome-copyright|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcome-delete': {
				description: 'for someone who has been removing information from articles',
				linkedArticle: true,
				syntax: '{{subst:welcome-delete|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcome-image': {
				description: 'welcome with additional information about images (policy and procedure)',
				linkedArticle: true,
				syntax: '{{subst:welcome-image|$USERNAME$|art=$ARTICLE$}}'
			},
			'welcome-LLM': {
				description: 'for someone whose initial efforts seem to be made with a large language model',
				syntax: '{{subst:welcome-LLM}} ~~~~'
			},
			'welcome-translation': {
				description: 'for someone whose initial efforts are unattributed translations from another language Wikipedia',
				syntax: '{{subst:welcome-translation}}'
			},
			'welcome-unsourced': {
				description: 'for someone whose initial efforts are unsourced',
				linkedArticle: true,
				syntax: '{{subst:welcome-unsourced|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			welcomelaws: {
				description: 'welcome with information about copyrights, NPOV, the sandbox, and vandalism',
				syntax: '{{subst:welcomelaws|$USERNAME$}} ~~~~'
			},
			welcomenpov: {
				description: 'for someone whose initial efforts do not adhere to the neutral point of view policy',
				linkedArticle: true,
				syntax: '{{subst:welcomenpov|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			welcomevandal: {
				description: 'for someone whose initial efforts appear to be vandalism',
				linkedArticle: true,
				syntax: '{{subst:welcomevandal|$ARTICLE$|$USERNAME$}}'
			},
			welcomespam: {
				description: 'welcome with additional discussion of anti-spamming policies',
				linkedArticle: true,
				syntax: '{{subst:welcomespam|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			welcometest: {
				description: 'for someone whose initial efforts appear to be tests',
				linkedArticle: true,
				syntax: '{{subst:welcometest|$ARTICLE$|$USERNAME$}} ~~~~'
			}
		}
	},

	unregistered: {
		'Unregistered user welcome templates': {
			'welcome-unregistered': {
				description: 'for unregistered users; encourages creating an account',
				linkedArticle: true,
				syntax: '{{subst:welcome-unregistered|art=$ARTICLE$}} ~~~~'
			},
			thanks: {
				description: 'for unregistered users; short; encourages creating an account',
				linkedArticle: true,
				syntax: '== Welcome! ==\n{{subst:thanks|page=$ARTICLE$}} ~~~~'
			},
			'welcome-unregistered-test': {
				description: 'for unregistered users who have performed test edits',
				linkedArticle: true,
				syntax: '{{subst:welcome-unregistered-test|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcome-unregistered-unconstructive': {
				description: 'for unregistered users who have vandalized or made unhelpful edits',
				linkedArticle: true,
				syntax: '{{subst:welcome-unregistered-unconstructive|$ARTICLE$|$USERNAME$}}'
			},
			'welcome-unregistered-constructive': {
				description: 'for unregistered users who fight vandalism or edit constructively',
				linkedArticle: true,
				syntax: '{{subst:welcome-unregistered-constructive|art=$ARTICLE$}}'
			},
			'welcome-unregistered-delete': {
				description: 'for unregistered users who have removed content from pages',
				linkedArticle: true,
				syntax: '{{subst:welcome-unregistered-delete|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcome-unregistered-unsourced': {
				description: 'for anonymous users who have added unsourced content',
				linkedArticle: true,
				syntax: '{{subst:welcome-unregistered-unsourced|$ARTICLE$|$USERNAME$}}'
			}
		}
	},

	wikiProject: {
		'WikiProject-specific welcome templates': {
			'TWA invite': {
				description: 'invite the user to The Wikipedia Adventure (not a welcome template)',
				syntax: '{{subst:WP:TWA/InviteTW|signature=~~~~}}'
			},
			'welcome-anatomy': {
				description: 'welcome for users with an apparent interest in anatomy topics',
				syntax: '{{subst:welcome-anatomy}} ~~~~'
			},
			'welcome-athletics': {
				description: 'welcome for users with an apparent interest in athletics (track and field) topics',
				syntax: '{{subst:welcome-athletics}}'
			},
			'welcome-au': {
				description: 'welcome for users with an apparent interest in Australia topics',
				syntax: '{{subst:welcome-au}} ~~~~'
			},
			'welcome-bd': {
				description: 'welcome for users with an apparent interest in Bangladesh topics',
				linkedArticle: true,
				syntax: '{{subst:welcome-bd|$USERNAME$||$EXTRA$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-bio': {
				description: 'welcome for users with an apparent interest in biographical topics',
				syntax: '{{subst:welcome-bio}} ~~~~'
			},
			'welcome-cal': {
				description: 'welcome for users with an apparent interest in California topics',
				syntax: '{{subst:welcome-cal}} ~~~~'
			},
			'welcome-cath': {
				description: 'welcome for users with an apparent interest in Catholic topics',
				syntax: '{{subst:welcome-cath}}'
			},
			'welcome-conserv': {
				description: 'welcome for users with an apparent interest in conservatism topics',
				syntax: '{{subst:welcome-conserv}}'
			},
			'welcome-cycling': {
				description: 'welcome for users with an apparent interest in cycling topics',
				syntax: '{{subst:welcome-cycling}} ~~~~'
			},
			'welcome-dbz': {
				description: 'welcome for users with an apparent interest in Dragon Ball topics',
				syntax: '{{subst:welcome-dbz|$EXTRA$|sig=~~~~}}'
			},
			'welcome-et': {
				description: 'welcome for users with an apparent interest in Estonia topics',
				syntax: '{{subst:welcome-et}}'
			},
			'welcome-de': {
				description: 'welcome for users with an apparent interest in Germany topics',
				syntax: '{{subst:welcome-de}} ~~~~'
			},
			'welcome-in': {
				description: 'welcome for users with an apparent interest in India topics',
				linkedArticle: true,
				syntax: '{{subst:welcome-in|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-math': {
				description: 'welcome for users with an apparent interest in mathematical topics',
				linkedArticle: true,
				syntax: '{{subst:welcome-math|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-med': {
				description: 'welcome for users with an apparent interest in medicine topics',
				linkedArticle: true,
				syntax: '{{subst:welcome-med|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-no': {
				description: 'welcome for users with an apparent interest in Norway topics',
				syntax: '{{subst:welcome-no}} ~~~~'
			},
			'welcome-pk': {
				description: 'welcome for users with an apparent interest in Pakistan topics',
				linkedArticle: true,
				syntax: '{{subst:welcome-pk|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-phys': {
				description: 'welcome for users with an apparent interest in physics topics',
				linkedArticle: true,
				syntax: '{{subst:welcome-phys|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-pl': {
				description: 'welcome for users with an apparent interest in Poland topics',
				syntax: '{{subst:welcome-pl}} ~~~~'
			},
			'welcome-rugbyunion': {
				description: 'welcome for users with an apparent interest in rugby union topics',
				syntax: '{{subst:welcome-rugbyunion}} ~~~~'
			},
			'welcome-ru': {
				description: 'welcome for users with an apparent interest in Russia topics',
				syntax: '{{subst:welcome-ru}} ~~~~'
			},
			'welcome-starwars': {
				description: 'welcome for users with an apparent interest in Star Wars topics',
				syntax: '{{subst:welcome-starwars}} ~~~~'
			},
			'welcome-ch': {
				description: 'welcome for users with an apparent interest in Switzerland topics',
				linkedArticle: true,
				syntax: '{{subst:welcome-ch|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-uk': {
				description: 'welcome for users with an apparent interest in Ukraine topics',
				syntax: '{{subst:welcome-uk}} ~~~~'
			},
			'welcome-roads': {
				description: 'welcome for users with an apparent interest in roads and highways topics',
				syntax: '{{subst:welcome-roads}}'
			},
			'welcome-videogames': {
				description: 'welcome for users with an apparent interest in video game topics',
				syntax: '{{subst:welcome-videogames}}'
			},
			'WikiProject Women in Red invite': {
				description: 'welcome for users with an interest in writing about women',
				syntax: '{{subst:WikiProject Women in Red invite|1=~~~~}}'
			}
		}
	},

	nonEnglish: {
		'Non-English welcome templates': {
			welcomeen: {
				description: 'welcome for users whose first language is not listed here',
				syntax: '{{subst:welcomeen}}'
			},
			'welcomeen-ar': {
				description: 'welcome for users whose first language appears to be Arabic',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ar}}'
			},
			'welcomeen-sq': {
				description: 'welcome for users whose first language appears to be Albanian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-sq}}'
			},
			'welcomeen-zh': {
				description: 'welcome for users whose first language appears to be Chinese',
				syntax: '== Welcome! ==\n{{subst:welcomeen-zh}}'
			},
			'welcomeen-nl': {
				description: 'welcome for users whose first language appears to be Dutch',
				syntax: '== Welcome! ==\n{{subst:welcomeen-nl}}'
			},
			'welcomeen-fi': {
				description: 'welcome for users whose first language appears to be Finnish',
				syntax: '== Welcome! ==\n{{subst:welcomeen-fi}}'
			},
			'welcomeen-fr': {
				description: 'welcome for users whose first language appears to be French',
				syntax: '== Welcome! ==\n{{subst:welcomeen-fr}}'
			},
			'welcomeen-de': {
				description: 'welcome for users whose first language appears to be German',
				syntax: '== Welcome! ==\n{{subst:welcomeen-de}}'
			},
			'welcomeen-ha': {
				description: 'welcome for users whose first language appears to be Hausa',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ha}}'
			},
			'welcomeen-he': {
				description: 'welcome for users whose first language appears to be Hebrew',
				syntax: '== Welcome! ==\n{{subst:welcomeen-he}}'
			},
			'welcomeen-hi': {
				description: 'welcome for users whose first language appears to be Hindi',
				syntax: '== Welcome! ==\n{{subst:welcomeen-hi}}'
			},
			'welcomeen-id': {
				description: 'welcome for users whose first language appears to be Indonesian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-id}}'
			},
			'welcomeen-it': {
				description: 'welcome for users whose first language appears to be Italian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-it}}'
			},
			'welcomeen-ja': {
				description: 'welcome for users whose first language appears to be Japanese',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ja}}'
			},
			'welcomeen-ko': {
				description: 'welcome for users whose first language appears to be Korean',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ko}}'
			},
			'welcomeen-ms': {
				description: 'welcome for users whose first language appears to be Malay',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ms}}'
			},
			'welcomeen-ml': {
				description: 'welcome for users whose first language appears to be Malayalam',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ml}}'
			},
			'welcomeen-mr': {
				description: 'welcome for users whose first language appears to be Marathi',
				syntax: '== Welcome! ==\n{{subst:welcomeen-mr}}'
			},
			'welcomeen-no': {
				description: 'welcome for users whose first language appears to be Norwegian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-no}}'
			},
			'welcomeen-or': {
				description: 'welcome for users whose first language appears to be Oriya (Odia)',
				syntax: '== Welcome! ==\n{{subst:welcomeen-or}}'
			},
			'welcomeen-fa': {
				description: 'welcome for users whose first language appears to be Persian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-fa}}'
			},
			'welcomeen-pl': {
				description: 'welcome for users whose first language appears to be Polish',
				syntax: '== Welcome! ==\n{{subst:welcomeen-pl}}'
			},
			'welcomeen-pt': {
				description: 'welcome for users whose first language appears to be Portuguese',
				syntax: '== Welcome! ==\n{{subst:welcomeen-pt}}'
			},
			'welcomeen-ro': {
				description: 'welcome for users whose first language appears to be Romanian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ro}}'
			},
			'welcomeen-ru': {
				description: 'welcome for users whose first language appears to be Russian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ru}}'
			},
			'welcomeen-es': {
				description: 'welcome for users whose first language appears to be Spanish',
				syntax: '== Welcome! ==\n{{subst:welcomeen-es}}'
			},
			'welcomeen-sv': {
				description: 'welcome for users whose first language appears to be Swedish',
				syntax: '== Welcome! ==\n{{subst:welcomeen-sv}}'
			},
			'welcomeen-th': {
				description: 'welcome for users whose first language appears to be Thai',
				syntax: '== Welcome! ==\n{{subst:welcomeen-th}}'
			},
			'welcomeen-tl': {
				description: 'welcome for users whose first language appears to be Tagalog',
				syntax: '== Welcome! ==\n{{subst:welcomeen-tl}}'
			},
			'welcomeen-tr': {
				description: 'welcome for users whose first language appears to be Turkish',
				syntax: '== Welcome! ==\n{{subst:welcomeen-tr}}'
			},
			'welcomeen-uk': {
				description: 'welcome for users whose first language appears to be Ukrainian',
				syntax: '== Welcome! ==\n{{subst:welcomeen-uk}}'
			},
			'welcomeen-ur': {
				description: 'welcome for users whose first language appears to be Urdu',
				syntax: '== Welcome! ==\n{{subst:welcomeen-ur}}'
			},
			'welcomeen-vi': {
				description: 'welcome for users whose first language appears to be Vietnamese',
				syntax: '== Welcome! ==\n{{subst:welcomeen-vi}}'
			}
		}
	}

};

Twinkle.welcome.getTemplateWikitext = function(type, template, article) {
	// the iteration is required as the type=standard has two groups
	let properties;
	$.each(Twinkle.welcome.templates[type], (label, templates) => {
		properties = templates[template];
		if (properties) {
			return false; // break
		}
	});
	if (properties) {
		return properties.syntax
			.replace('$USERNAME$', Twinkle.getPref('insertUsername') ? mw.config.get('wgUserName') : '')
			.replace('$ARTICLE$', article || '')
			.replace(/\$HEADER\$\s*/, '== Welcome ==\n\n')
			.replace('$EXTRA$', ''); // EXTRA is not implemented yet
	}
	return '{{subst:' + template + (article ? '|art=' + article : '') + '}}' +
			(Twinkle.getPref('customWelcomeSignature') ? ' ~~~~' : '');
};

Twinkle.welcome.callbacks = {
	preview: function(form) {
		const previewDialog = new Morebits.SimpleWindow(750, 400);
		previewDialog.setTitle('Welcome template preview');
		previewDialog.setScriptName('Welcome user');
		previewDialog.setModality(true);

		const previewdiv = document.createElement('div');
		previewdiv.style.marginLeft = previewdiv.style.marginRight = '0.5em';
		previewdiv.style.fontSize = 'small';
		previewDialog.setContent(previewdiv);

		const previewer = new Morebits.wiki.Preview(previewdiv);
		const input = Morebits.QuickForm.getInputData(form);
		previewer.beginRender(Twinkle.welcome.getTemplateWikitext(input.type, input.template, input.article), 'User talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username

		const submit = document.createElement('input');
		submit.setAttribute('type', 'submit');
		submit.setAttribute('value', 'Close');
		previewDialog.addContent(submit);

		previewDialog.display();

		$(submit).on('click', () => {
			previewDialog.close();
		});
	},
	main: function(pageobj) {
		const params = pageobj.getCallbackParameters();
		let text = pageobj.getPageText();

		// abort if mode is auto and form is not empty
		if (pageobj.exists() && params.mode === 'auto') {
			Morebits.Status.info('Warning', 'User talk page not empty; aborting automatic welcome');
			Morebits.wiki.actionCompleted.event();
			return;
		}

		const welcomeText = Twinkle.welcome.getTemplateWikitext(params.type, params.template, params.article);

		if (Twinkle.getPref('topWelcomes')) {
			const hasTalkHeader = /^\{\{Talk ?header\}\}/i.test(text);
			if (hasTalkHeader) {
				text = text.replace(/^\{\{Talk ?header\}\}\n{0,2}/i, '');
				text = '{{Talk header}}\n\n' + welcomeText + '\n\n' + text;
				text = text.trim();
			} else {
				text = welcomeText + '\n\n' + text;
			}
		} else {
			text += '\n' + welcomeText;
		}

		const summaryText = 'Welcome to Wikipedia!';
		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchWelcomes'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.welcome.callback.evaluate = function twinklewelcomeCallbackEvaluate(e) {
	const form = e.target;

	const params = Morebits.QuickForm.getInputData(form); // : type, template, article
	params.mode = 'manual';

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	const userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Welcoming complete, reloading talk page in a few seconds';

	const wikipedia_page = new Morebits.wiki.Page(userTalkPage, 'User talk page modification');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.addInitCallback(Twinkle.welcome, 'welcome');
}());

// </nowiki>
