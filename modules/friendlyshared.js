// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlyshared.js: Shared IP tagging module
 ****************************************
 * Mode of invocation:     Tab ("Shared")
 * Active on:              IP user talk pages
 */

Twinkle.shared = function friendlyshared() {
	if (mw.config.get('wgNamespaceNumber') === 3 && mw.util.isIPAddress(mw.config.get('wgTitle'))) {
		var username = mw.config.get('wgRelevantUserName');
		Twinkle.addPortletLink(function() {
			Twinkle.shared.callback(username);
		}, 'Gedeeld IP', 'friendly-shared', 'Gedeeld IP labelen');
	}
};

Twinkle.shared.callback = function friendlysharedCallback() {
	var Window = new Morebits.simpleWindow(600, 450);
	Window.setTitle('Gedeeld IP-adres labelen');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Shared prefs', 'WP:TW/PREF#shared');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#shared');
	Window.addFooterLink('Give feedback', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.shared.callback.evaluate);

	var div = form.append({
		type: 'div',
		id: 'sharedip-templatelist',
		className: 'morebits-scrollbox'
	}
	);
	div.append({ type: 'header', label: 'Gedeeld IP-adres sjablonen' });
	div.append({ type: 'radio', name: 'sjabloon', list: Twinkle.shared.standardList,
		event: function(e) {
			Twinkle.shared.callback.change_shared(e);
			e.stopPropagation();
		}
	});

	var org = form.append({ type: 'field', label: 'Vul overige details in (optioneel) en klik op "Opslaan"' });
	org.append({
		type: 'input',
		name: 'organization',
		label: 'Naam organisatie (optioneel)',
		disabled: true,
		tooltip: 'Je kunt optioneel de naam van de organisatie die het IP-adres beheerd/bezit opgeven.  Hierbij mag je ook wikimarkup gebruiken.'
	}
	);
	org.append({
		type: 'input',
		name: 'host',
		label: 'IP-Range (optioneel)',
		disabled: true,
		tooltip: 'De IP-Range die deze organisatie bezit (bijvoorbeeld, 10.0.0.0/28) kan optioneel worden toegevoegd aan het sjabloon.'
	}
	);
	org.append({
		type: 'input',
		name: 'contact',
		label: 'Contact informatie (alleen op verzoek)',
		disabled: true,
		tooltip: 'Hier kun je contactgegevens toevoegen over de organisatie.  Vul dit alleen in als de organisatie hierom heeft gevraagd.  Je mag hierbij ook wikimarkup gebruiken.'
	}
	);

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.shared.preview(result);
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Voorvertoning';
	form.append({ type: 'div', id: 'sharedpreview', label: [ previewlink ] });
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
};

Twinkle.shared.standardList = [
	{
		label: '{{Ws-school}}: Gedeeld IP-adres van een onderwijsinstelling',
		value: 'Ws-school'
	},
	{
		label: '{{Ws-organisatie}}: Gedeeld IP-adres van een bedrijf of andere organisatie',
		value: 'Ws-organisatie'
	},
	{
		label: '{{Ws-hogeschool}}: Gedeeld IP-adres van een hogeronderwijsinstelling',
		value: 'Ws-hogeschool'
	}
];

Twinkle.shared.callback.change_shared = function friendlysharedCallbackChangeShared(e) {
	e.target.form.contact.disabled = true; // disable contact input
	e.target.form.organization.disabled = false; // disable organization name
	e.target.form.host.disabled = false;  // disable iprange
};

Twinkle.shared.callbacks = {
	main: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var pageText = pageobj.getPageText();
		var found = false;

		for (var i = 0; i < Twinkle.shared.standardList.length; i++) {
			var tagRe = new RegExp('(\\{\\{' + Twinkle.shared.standardList[i].value + '(\\||\\}\\}))', 'im');
			if (tagRe.exec(pageText)) {
				Morebits.status.warn('Info', '{{' + Twinkle.shared.standardList[i].value + '}} al aanwezig op de overlegpagina van de gebruiker...bewerking afgebroken');
				found = true;
			}
		}

		if (found) {
			return;
		}

		Morebits.status.info('Info', 'Sjabloon gedeeld IP-adres toegevoegd bovenaan de overlegpagina van de gebruiker.');
		var text = Twinkle.shared.getTemplateWikitext(params);

		var summaryText = '{{[[Sjabloon:' + params.template + '|' + params.template + ']]}} toegevoegd.';
		pageobj.setPageText(text + pageText);
		pageobj.setEditSummary(summaryText);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setMinorEdit(Twinkle.getPref('markSharedIPAsMinor'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.shared.preview = function(form) {
	var input = Morebits.quickForm.getInputData(form);
	if (input.template) {
		var previewDialog = new Morebits.simpleWindow(700, 500);
		previewDialog.setTitle('Gedeeld IP sjabloon voorvertoning');
		previewDialog.setScriptName('Voeg gedeeld IP sjabloon toe');
		previewDialog.setModality(true);

		var previewdiv = document.createElement('div');
		previewdiv.style.marginLeft = previewdiv.style.marginRight = '0.5em';
		previewdiv.style.fontSize = 'small';
		previewDialog.setContent(previewdiv);

		var previewer = new Morebits.wiki.preview(previewdiv);
		previewer.beginRender(Twinkle.shared.getTemplateWikitext(input), mw.config.get('wgPageName'));

		var submit = document.createElement('input');
		submit.setAttribute('type', 'submit');
		submit.setAttribute('value', 'Sluiten');
		previewDialog.addContent(submit);

		previewDialog.display();

		$(submit).click(function() {
			previewDialog.close();
		});
	}
};

Twinkle.shared.getTemplateWikitext = function(input) {
	var text = '{{' + input.template + '|1=' + input.organization;
	if (input.host) {
		text += '|2=' + input.host;
	}
	if (input.contact) {
		text += '|3=' + input.contact;
	}
	text += '}}\n\n';
	return text;
};

Twinkle.shared.callback.evaluate = function friendlysharedCallbackEvaluate(e) {
	var params = Morebits.quickForm.getInputData(e.target);
	if (!params.template) {
		alert('Je moet een gedeeld IP-adres sjabloon selecteren om te gebruiken!');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Labelen voltooid, pagina wordt binnen enkele seconden herladen';

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Overlegpagina van gebruiker bewerking');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.shared.callbacks.main);
};

Twinkle.addInitCallback(Twinkle.shared, 'shared');
})(jQuery);


// </nowiki>
