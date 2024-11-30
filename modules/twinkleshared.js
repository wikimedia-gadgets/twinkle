// <nowiki>

(function() {

/*
 ****************************************
 *** twinkleshared.js: Shared IP tagging module
 ****************************************
 * Mode of invocation:     Tab ("Shared")
 * Active on:              IP user talk pages
 */

Twinkle.shared = function twinkleshared() {
	if (mw.config.get('wgNamespaceNumber') === 3 && mw.util.isIPAddress(mw.config.get('wgTitle'))) {
		const username = mw.config.get('wgRelevantUserName');
		Twinkle.addPortletLink(() => {
			Twinkle.shared.callback(username);
		}, 'Shared IP', 'twinkle-shared', 'Shared IP tagging');
	}
};

Twinkle.shared.callback = function twinklesharedCallback() {
	const Window = new Morebits.SimpleWindow(600, 450);
	Window.setTitle('Shared IP address tagging');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Shared prefs', 'WP:TW/PREF#shared');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#shared');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.shared.callback.evaluate);

	const div = form.append({
		type: 'div',
		id: 'sharedip-templatelist',
		className: 'morebits-scrollbox'
	}
	);
	div.append({ type: 'header', label: 'Shared IP address templates' });
	div.append({ type: 'radio', name: 'template', list: Twinkle.shared.standardList,
		event: function(e) {
			Twinkle.shared.callback.change_shared(e);
			e.stopPropagation();
		}
	});

	const org = form.append({ type: 'field', label: 'Fill in other details (optional) and click "Submit"' });
	org.append({
		type: 'input',
		name: 'organization',
		label: 'IP address owner/operator',
		disabled: true,
		tooltip: 'You can optionally enter the name of the organization that owns/operates the IP address.  You can use wikimarkup if necessary.'
	}
	);
	org.append({
		type: 'input',
		name: 'host',
		label: 'Host name (optional)',
		disabled: true,
		tooltip: 'The host name (for example, proxy.example.com) can be optionally entered here and will be linked by the template.'
	}
	);
	org.append({
		type: 'input',
		name: 'contact',
		label: 'Contact information (only if requested)',
		disabled: true,
		tooltip: 'You can optionally enter some contact details for the organization.  Use this parameter only if the organization has specifically requested that it be added.  You can use wikimarkup if necessary.'
	}
	);

	const previewlink = document.createElement('a');
	$(previewlink).on('click', () => {
		Twinkle.shared.preview(result);
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', id: 'sharedpreview', label: [ previewlink ] });
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
};

Twinkle.shared.standardList = [
	{
		label: '{{Shared IP}}: standard shared IP address template',
		value: 'Shared IP',
		tooltip: 'IP user talk page template that shows helpful information to IP users and those wishing to warn, block or ban them'
	},
	{
		label: '{{Shared IP edu}}: shared IP address template modified for educational institutions',
		value: 'Shared IP edu'
	},
	{
		label: '{{Shared IP corp}}: shared IP address template modified for businesses',
		value: 'Shared IP corp'
	},
	{
		label: '{{Shared IP public}}: shared IP address template modified for public terminals',
		value: 'Shared IP public'
	},
	{
		label: '{{Shared IP gov}}: shared IP address template modified for government agencies or facilities',
		value: 'Shared IP gov'
	},
	{
		label: '{{Dynamic IP}}: shared IP address template modified for organizations with dynamic addressing',
		value: 'Dynamic IP'
	},
	{
		label: '{{Static IP}}: shared IP address template modified for static IP addresses',
		value: 'Static IP'
	},
	{
		label: '{{ISP}}: shared IP address template modified for ISP organizations (specifically proxies)',
		value: 'ISP'
	},
	{
		label: '{{Mobile IP}}: shared IP address template modified for mobile phone companies and their customers',
		value: 'Mobile IP'
	},
	{
		label: '{{Whois}}: template for IP addresses in need of monitoring, but unknown whether static, dynamic or shared',
		value: 'Whois'
	}
];

Twinkle.shared.callback.change_shared = function twinklesharedCallbackChangeShared(e) {
	e.target.form.contact.disabled = e.target.value !== 'Shared IP edu'; // only supported by {{Shared IP edu}}
	e.target.form.organization.disabled = false;
	e.target.form.host.disabled = e.target.value === 'Whois'; // host= not supported by {{Whois}}
};

Twinkle.shared.callbacks = {
	main: function(pageobj) {
		const params = pageobj.getCallbackParameters();
		const pageText = pageobj.getPageText();
		let found = false;

		for (let i = 0; i < Twinkle.shared.standardList.length; i++) {
			const tagRe = new RegExp('(\\{\\{' + Twinkle.shared.standardList[i].value + '(\\||\\}\\}))', 'im');
			if (tagRe.exec(pageText)) {
				Morebits.Status.warn('Info', 'Found {{' + Twinkle.shared.standardList[i].value + '}} on the user\'s talk page already...aborting');
				found = true;
			}
		}

		if (found) {
			return;
		}

		Morebits.Status.info('Info', 'Will add the shared IP address template to the top of the user\'s talk page.');
		const text = Twinkle.shared.getTemplateWikitext(params);

		const summaryText = 'Added {{[[Template:' + params.template + '|' + params.template + ']]}} template.';
		pageobj.setPageText(text + pageText);
		pageobj.setEditSummary(summaryText);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setMinorEdit(Twinkle.getPref('markSharedIPAsMinor'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.shared.preview = function(form) {
	const input = Morebits.QuickForm.getInputData(form);
	if (input.template) {
		const previewDialog = new Morebits.SimpleWindow(700, 500);
		previewDialog.setTitle('Shared IP template preview');
		previewDialog.setScriptName('Add Shared IP template');
		previewDialog.setModality(true);

		const previewdiv = document.createElement('div');
		previewdiv.style.marginLeft = previewdiv.style.marginRight = '0.5em';
		previewdiv.style.fontSize = 'small';
		previewDialog.setContent(previewdiv);

		const previewer = new Morebits.wiki.Preview(previewdiv);
		previewer.beginRender(Twinkle.shared.getTemplateWikitext(input), mw.config.get('wgPageName'));

		const submit = document.createElement('input');
		submit.setAttribute('type', 'submit');
		submit.setAttribute('value', 'Close');
		previewDialog.addContent(submit);

		previewDialog.display();

		$(submit).on('click', () => {
			previewDialog.close();
		});
	}
};

Twinkle.shared.getTemplateWikitext = function(input) {
	let text = '{{' + input.template + '|' + input.organization;
	if (input.contact) {
		text += '|' + input.contact;
	}
	if (input.host) {
		text += '|host=' + input.host;
	}
	text += '}}\n\n';
	return text;
};

Twinkle.shared.callback.evaluate = function twinklesharedCallbackEvaluate(e) {
	const params = Morebits.QuickForm.getInputData(e.target);
	if (!params.template) {
		alert('You must select a shared IP address template to use!');
		return;
	}
	if (!params.organization) {
		alert('You must input an organization for the {{' + params.template + '}} template!');
		return;
	}

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete, reloading talk page in a few seconds';

	const wikipedia_page = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'User talk page modification');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.shared.callbacks.main);
};

Twinkle.addInitCallback(Twinkle.shared, 'shared');
}());

// </nowiki>
