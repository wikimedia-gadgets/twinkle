// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlywelcome.js: Welcome module
 ****************************************
 * Mode of invocation:     Tab ("Wel"), or from links on diff pages
 * Active on:              Any page with relevant user name (userspace,
 *                         contribs, etc.) and diff pages
 */

Twinkle.welcome = function friendlywelcome() {
	if (mw.util.getParamValue('friendlywelcome')) {
		if (mw.util.getParamValue('friendlywelcome') === 'auto') {
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
	if (mw.util.getParamValue('diff')) {
		// check whether the contributors' talk pages exist yet
		var $oList = $('#mw-diff-otitle2').find('span.mw-usertoollinks a.new:contains(talk)').first();
		var $nList = $('#mw-diff-ntitle2').find('span.mw-usertoollinks a.new:contains(talk)').first();

		if ($oList.length > 0 || $nList.length > 0) {
			var spanTag = function(color, content) {
				var span = document.createElement('span');
				span.style.color = color;
				span.appendChild(document.createTextNode(content));
				return span;
			};

			var welcomeNode = document.createElement('strong');
			var welcomeLink = document.createElement('a');
			welcomeLink.appendChild(spanTag('Black', '['));
			welcomeLink.appendChild(spanTag('Goldenrod', 'welkom'));
			welcomeLink.appendChild(spanTag('Black', ']'));
			welcomeNode.appendChild(welcomeLink);

			if ($oList.length > 0) {
				var oHref = $oList.attr('href');

				var oWelcomeNode = welcomeNode.cloneNode(true);
				oWelcomeNode.firstChild.setAttribute('href', oHref + '&' + $.param({
					friendlywelcome: Twinkle.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					vanarticle: Morebits.pageNameNorm
				}));
				$oList[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$oList[0].parentNode.parentNode.appendChild(oWelcomeNode);
			}

			if ($nList.length > 0) {
				var nHref = $nList.attr('href');

				var nWelcomeNode = welcomeNode.cloneNode(true);
				nWelcomeNode.firstChild.setAttribute('href', nHref + '&' + $.param({
					friendlywelcome: Twinkle.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					vanarticle: Morebits.pageNameNorm
				}));
				$nList[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$nList[0].parentNode.parentNode.appendChild(nWelcomeNode);
			}
		}
	}
	// Users and IPs but not IP ranges
	if (mw.config.exists('wgRelevantUserName') && !Morebits.ip.isRange(mw.config.get('wgRelevantUserName'))) {
		Twinkle.addPortletLink(function() {
			Twinkle.welcome.callback(mw.config.get('wgRelevantUserName'));
		}, 'Welkom', 'friendly-welcome', 'Verwelkom gebruiker');
	}
};

Twinkle.welcome.welcomeUser = function welcomeUser() {
	Morebits.status.init(document.getElementById('mw-content-text'));
	$('#catlinks').remove();

	var params = {
		template: Twinkle.getPref('quickWelcomeTemplate'),
		article: mw.util.getParamValue('vanarticle') || '',
		mode: 'auto'
	};

	var userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Verwelkoming gelukt, pagina wordt binnen enkele ogenblikken herladen';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'Gebruikersoverleg-pagina bewerken');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.welcome.callback = function friendlywelcomeCallback(uid) {
	if (uid === mw.config.get('wgUserName') && !confirm('Is het niet een beetje sneu om jezelf welkom te gaan heten?')) {
		return;
	}

	var Window = new Morebits.simpleWindow(600, 420);
	Window.setTitle('Verwelkom gebruiker');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Welkom voorkeuren', 'WP:TW/PREF#welcome');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#welcome');
	Window.addFooterLink('Geef feedback', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.welcome.callback.evaluate);

	form.append({
		type: 'select',
		name: 'type',
		label: 'Type verwelkoming: ',
		event: Twinkle.welcome.populateWelcomeList,
		list: [
			{ type: 'option', value: 'standard', label: 'Standaard verwelkoming', selected: true },
			{ type: 'option', value: 'formal', label: 'Formele verwelkoming' },
			{ type: 'option', value: 'english', label: 'Engelse verwelkoming' },
			{ type: 'option', value: 'problem', label: 'Verwelkom na probleem' }
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
		label: '* Betrokken artikel (indien ondersteund door sjabloon):',
		value: mw.util.getParamValue('vanarticle') || '',
		tooltip: 'Een verwelkoming kan soms worden gekoppelt aan een artikel. Laat leeg om geen artikel te koppelen.  Sjablonen die een koppeling ondersteunen zijn gemarkeert met een *.'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.welcome.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Voorvertoning';
	form.append({ type: 'div', name: 'welcomepreview', label: [ previewlink ] });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// initialize the welcome list
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type.dispatchEvent(evt);
};

Twinkle.welcome.populateWelcomeList = function(e) {
	var type = e.target.value;

	var container = new Morebits.quickForm.element({ type: 'fragment' });

	if ((type === 'standard' || type === 'anonymous') && Twinkle.getPref('customWelcomeList').length) {
		container.append({ type: 'header', label: 'Aangepaste verwelkomingssjablonen' });
		container.append({
			type: 'radio',
			name: 'template',
			list: Twinkle.getPref('customWelcomeList'),
			event: function() {
				e.target.form.article.disabled = false;
			}
		});
	}

	var sets = Twinkle.welcome.templates[type];
	$.each(sets, function(label, templates) {
		container.append({ type: 'header', label: label });
		container.append({
			type: 'radio',
			name: 'template',
			list: $.map(templates, function(properties, template) {
				return {
					value: template,
					label: '{{' + template + '}}: ' + properties.description + (properties.linkedArticle ? '\u00A0*' : ''),  // U+00A0 NO-BREAK SPACE
					tooltip: properties.tooltip  // may be undefined
				};
			}),
			event: function(ev) {
				ev.target.form.article.disabled = !templates[ev.target.value].linkedArticle;
			}
		});
	});

	var rendered = container.render();
	$(e.target.form).find('div#welcomeWorkArea').empty().append(rendered);

	var firstRadio = e.target.form.template[0];
	firstRadio.checked = true;
	var vals = sets[Object.keys(sets)[0]];
	e.target.form.article.disabled = vals[firstRadio.value] ? !vals[firstRadio.value].linkedArticle : true;
};

// A list of welcome templates and their properties and syntax

// The four fields that are available are "description", "linkedArticle", "syntax", and "tooltip".
// The three magic words that can be used in the "syntax" field are:
//   - $USERNAME$  - replaced by the welcomer's username, depending on user's preferences
//   - $ARTICLE$   - replaced by an article name, if "linkedArticle" is true
//   - $HEADER$    - adds a level 2 header (most templates already include this)

Twinkle.welcome.templates = {
	standard: {
		'Standaard verwelkoming': {
			'hola': {
				description: 'Standaard verwelkoming',
				syntax: '{{hola|gebruiker|~~~~}}'
			},
			'salut': {
				description: 'Een meer personlijke verwelkoming voor ingelogde gebruikers',
				syntax: '{{subst:Salut}}'
			},
			'salut-anon': {
				description: 'Een meer personlijke verwelkoming voor anonieme gebruikers',
				syntax: '{{subst:Salut-anon}}'
			},
			'welkom2': {
				description: 'Een alternatief voor {{hola}}',
				syntax: '{{welkom2|~~~~}}'
			},
			'welkom3': {
				description: 'Een meer kleurrijk alternatief voor {{welkom2}}',
				syntax: '{{welkom3|~~~~}}'
			}
		}
	},

	formal: {
		'Formele verwelkoming': {
			'hola-u': {
				description: 'Standaard verwelkoming in u-vorm',
				syntax: '{{hola-u|gebruiker|~~~~}}'
			},
			'salut-u': {
				description: 'Een meer personlijke verwelkoming voor ingelogde gebruikers in u-vorm',
				syntax: '{{subst:salut-u}}'
			},
			'salut-anon-u': {
				description: 'Een meer personlijke verwelkoming voor anonieme gebruikers in u-vorm',
				syntax: '{{subst:salut-anon-u}}'
			},
			'welkom2-u': {
				description: 'Een alternatief voor {{hola-u}}',
				syntax: '{{welkom2-u|~~~~}}'
			},
			'welkom3-u': {
				description: 'Een meer kleurrijk alternatief voor {{welkom2-u}}',
				syntax: '{{welkom3-u|~~~~}}'
			}
		}
	},

	english: {
		'Engelse verwelkoming': {
			'welcome': {
				description: 'Standaard verwelkoming in het Engels',
				syntax: '{{welcome}} ~~~~'
			},
			'salut-en': {
				description: 'Een meer personlijke verwelkoming in het Engels',
				syntax: '{{subst:salut-en}}'
			}
		}
	},
	
	problem: {
		'Verwelkoming na een proleem': {
			'Vreclame': {
				description: 'Verwelkoming en vriendelijke uitleg dat reclameartikels niet gewenst zijn',
				linkedArticle: true,
				syntax: '{{subst:Vreclame|$ARTICLE$}} ~~~~'
			},
			'Vreclame+nuweg': {
				description: 'gelijk aan Vreclame, maar nu met mededeling van directe verwijdernominatie',
				linkedArticle: true,
				syntax: '{{subst:Vreclame|$ARTICLE$||direct}} ~~~~'
			},
			'vvn': {
				description: 'verwelkoming en vriendelijk op de hoogte te stellen van een beoordelingslijst nominatie',
				linkedArticle: true,
				syntax: '{{subst:vvn|$ARTICLE$|{{subst:LOCALYEAR}}|{{subst:LOCALMONTH}}|{{subst:LOCALDAY2}} }} ~~~~'
			},
			'vzb': {
				description: 'Verwelkom na een terugdraaiing, met zandbak verwijzing',
				linkedArticle: true,
				syntax: '{{subst:vzb|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'zp': {
				description: 'verwelkoming en vriendelijke uitleg over de onwenselijkheid van een zelfpromotie-artikel',
				linkedArticle: true,
				syntax: '{{subst:zp|$ARTICLE$}} ~~~~'
			},
			'zp+nuweg': {
				description: 'gelijk aan zp, maar nu met mededeling van directe verwijdernominatie',
				linkedArticle: true,
				syntax: '{{subst:zp|$ARTICLE$||direct}} ~~~~'
			},
			'vgp': {
				description: 'verwelkoming en vriendelijke uitleg over onjuist gebruik van de gebruikerspagina',
				syntax: '{{vgp}} ~~~~'
			}
		}
 	}

};

Twinkle.welcome.getTemplateWikitext = function(type, template, article) {
	// the iteration is required as the type=standard has two groups
	var properties;
	$.each(Twinkle.welcome.templates[type], function(label, templates) {
		properties = templates[template];
		if (properties) {
			return false; // break
		}
	});
	if (properties) {
		return properties.syntax.
			replace('$USERNAME$', Twinkle.getPref('insertUsername') ? mw.config.get('wgUserName') : '').
			replace('$ARTICLE$', article ? article : '').
			replace(/\$HEADER\$\s*/, '== Welkom ==\n\n').
			replace('$EXTRA$', '');  // EXTRA is not implemented yet
	}
	return '{{subst:' + template + (article ? '|art=' + article : '') + '}}' +
			(Twinkle.getPref('customWelcomeSignature') ? ' ~~~~' : '');
};

Twinkle.welcome.callbacks = {
	preview: function(form) {
		var previewDialog = new Morebits.simpleWindow(750, 400);
		previewDialog.setTitle('Welkom sjabloon voorvertoning');
		previewDialog.setScriptName('Verwelkom gebruiker');
		previewDialog.setModality(true);

		var previewdiv = document.createElement('div');
		previewdiv.style.marginLeft = previewdiv.style.marginRight = '0.5em';
		previewdiv.style.fontSize = 'small';
		previewDialog.setContent(previewdiv);

		var previewer = new Morebits.wiki.preview(previewdiv);
		var input = Morebits.quickForm.getInputData(form);
		previewer.beginRender(Twinkle.welcome.getTemplateWikitext(input.type, input.template, input.article), 'User talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username

		var submit = document.createElement('input');
		submit.setAttribute('type', 'submit');
		submit.setAttribute('value', 'Close');
		previewDialog.addContent(submit);

		previewDialog.display();

		$(submit).click(function() {
			previewDialog.close();
		});
	},
	main: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var text = pageobj.getPageText();

		// abort if mode is auto and form is not empty
		if (pageobj.exists() && params.mode === 'auto') {
			Morebits.status.info('Waarschuwing', 'Overlegpagina is niet leeg, sjabloon plaatsen afgebroken');
			Morebits.wiki.actionCompleted.event();
			return;
		}

		var welcomeText = Twinkle.welcome.getTemplateWikitext(params.type, params.template, params.article);

		if (Twinkle.getPref('topWelcomes')) {
			text = welcomeText + '\n\n' + text;
		} else {
			text += '\n' + welcomeText;
		}

		var summaryText = 'Welkom op Wikipedia!';
		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchWelcomes'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.welcome.callback.evaluate = function friendlywelcomeCallbackEvaluate(e) {
	var form = e.target;

	var params = Morebits.quickForm.getInputData(form); // : type, template, article
	params.mode = 'manual';

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	var userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Verwelkomen voltooid, pagina wordt in enkele seconden herladen';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'Gebruikerpagina bewerken');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.addInitCallback(Twinkle.welcome, 'welcome');
})(jQuery);


// </nowiki>
