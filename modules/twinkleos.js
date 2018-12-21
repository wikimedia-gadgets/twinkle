(function($){

/*
 ****************************************
 *** twinkleos.js: Oversight/OS module
 ****************************************
 * Mode of invocation:     Tab ("OS")
 * Active on:              Non-special pages
 */

Twinkle.os = function twinkleos() {
	// Disable on special pages
	if (mw.config.get('wgNamespaceNumber') < 0) {
		return;
	}
	Twinkle.addPortletLink( Twinkle.os.callback, "OS", "tw-os", "Request oversight" );
};

Twinkle.os.callback = function oscallback() {
	var getUrl = function(pageName, params) {
		return "https://" + mw.config.get('wgServerName') + mw.util.getUrl(pageName, params);
	}
	var PageName = Morebits.pageNameNorm;

	var Window = new Morebits.simpleWindow( 800, 500 );
	Window.setTitle( "Request oversight" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Oversight policy", "WP:OS" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC" );
	
	var form = new Morebits.quickForm( Twinkle.os.evaluate ); 

	var field1 = form.append( {
		type: 'field',
		label: 'Choose reason for oversight',
		id: 'type_fieldset'
	} );

	field1.append( {
		type: 'select',
		name: 'options',
		event: Twinkle.os.optionChanged,
		list: [
				{
					label: 'Non-public personal information',
					value: 'personal',
					checked: true
				},
				{
					label: 'Potentially libelous information',
					value: 'libel'
				},
				{
					label: 'Other',
					value: 'other'
				}
			]
	} );

	var cvtext = document.createElement('div');
	cvtext.innerHTML = 'For redaction of copyright violations, please request <a href="//en.wikipedia.org/wiki/WP:REVDEL">revision deletion</a> instead via {{<a href="//en.wikipedia.org/wiki/Template:Copyvio-revdel">copyvio-revdel</a>}}.';

	var warningnote = document.createElement('b');
	warningnote.innerHTML = '<u>Make sure</u> you are familiar with the policy, especially the <a href="//en.wikipedia.org/wiki/Wikipedia:Oversight#Policy">criteria for oversight</a>, before you send a request. <a href="//en.wikipedia.org/wiki/Wikipedia:Oversight/FAQ">Oversight FAQ</a>.';
	
	field1.append({
		type: 'div',
		label: [ cvtext, warningnote ]
	});

	var field2 = form.append( {
		type: 'field',
		label: 'Email',
		name: 'work_area'
	} );

	var formatnotice = document.createElement('i');
	formatnotice.innerHTML = 'Note that emails are sent as plain text. Wiki markup (such as [[links]]) and HTML code will not work.';	
	field2.append({
		type: 'div',
		label: formatnotice
	}); 
	field2.append({
		type: 'input',
		name: 'subject',
		label: 'Subject: ',
		size: 80,
		value: ''
	});

	if (mw.util.getParamValue('action') === 'history') {
		var histdiv = document.createElement('div'); 
		histdiv.innerHTML = 'To insert a diff link, move this window and select the revisions, and click here:    ' + 
		'<a href="#" class="os-add-revs">Add</a>';

		field2.append({
			type: 'div',
			label: histdiv
		});
	}
	
	field2.append({
		type: 'textarea',
		name: 'body',
		className: 'os-email-subject',
		label: 'Message',
		value: ''
	});
	mw.util.addCSS(
		"div.os-email-subject textarea { font-size: 110%; height: 10em; }"
	);

	var noemptynotice = document.createElement('div');
	noemptynotice.innerHTML = 'Please provide the reason for oversight (unless it is really obvious). Avoid boilerplate messages.'
	field2.append({
		type: 'div',
		label: noemptynotice
	});

	form.append( { type:'submit', label:'Send email' } );

	var result = form.render();
	Window.setContent(result);
	Window.display();

	Twinkle.os.subjectValues = {};
	Twinkle.os.subjectValues['personal'] =  'Non-public personal information at ' + PageName;
	Twinkle.os.subjectValues['libel'] = 'Potentially libellous content at ' + PageName;
	Twinkle.os.subjectValues['other'] = 'Oversight request at page ' + PageName;

	var data = '\n\nPage link: ' + getUrl();

	if (mw.util.getParamValue('diff')) {										// diff pages
		data += '\nLink to diff: ' + location.href
			+ '\nRevisions:' 
			+ '\nFrom ' + mw.config.get('wgDiffOldId') + ' - ' + getUrl(PageName,{'oldid':mw.config.get('wgDiffOldId')})
			+   '\nTo ' + mw.config.get('wgDiffNewId') + ' - ' + getUrl(PageName,{'oldid':mw.config.get('wgDiffNewId')});
	} else if (mw.util.getParamValue('oldid') ) { 								// oldid pages
		data += '\nLink to revision: ' + location.href;
	} else if (mw.util.getParamValue('action') === 'history') { 				//history pages
		var old_ = $("ul#pagehistory input[name=oldid]:checked")[0].value;
		var new_ = $("ul#pagehistory input[name=diff]:checked")[0].value;
		data += "\nLink to diff: " + getUrl(PageName, {'diff':new_, 'oldid':old_}); 
		$(".os-add-revs")[0].onclick = function onaddclick() {
			var old_ = $("ul#pagehistory input[name=oldid]:checked")[0].value;
			var new_ = $("ul#pagehistory input[name=diff]:checked")[0].value;
			$(".os-email-subject textarea")[0].value += '\nLink to diff: ' + getUrl(PageName, {'diff':new_, 'oldid':old_});
		};
	}

	Twinkle.os.bodyValues = {};
	Twinkle.os.bodyValues['personal'] = 
		'Requesting removal of personal information from page "' + PageName + '".' + data;
	Twinkle.os.bodyValues['libel'] = 
		'Requesting removal of libellous content from page "' + PageName + '".' + data;
	Twinkle.os.bodyValues['other'] = 
		'Requesting oversight of content from page "' + PageName + '".' + data;

	// Fake a change event on the first type radio, to initialize the type-dependent controls
	var evt = new Event("change", { "bubbles": true, "cancelable": true });
	result.options.dispatchEvent(evt);
};

Twinkle.os.optionChanged = function optionChanged(event) {
	var form = event.target.form;
	
	if(Twinkle.os.prevOption) {			
		// save the entered values so that they are retained if the user switches back to this option
		Twinkle.os.subjectValues[Twinkle.os.prevOption] = form.subject.value;
		Twinkle.os.bodyValues[Twinkle.os.prevOption] = form.body.value;
	}

	form.subject.value = Twinkle.os.subjectValues[event.target.value];
	form.body.value = Twinkle.os.bodyValues[event.target.value];

	Twinkle.os.prevOption = event.target.value;
};

Twinkle.os.evaluate = function evaluate(e) {
	var form = e.target;
	var params = {
		emailSubject: form.subject.value,
		emailBody: form.body.value
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	var query = {
		"action": "query",
		"meta": "tokens"
	};
	var token_api = new Morebits.wiki.api( 'Obtaining token for email', query, Twinkle.os.sendEmail );
	token_api.parent = params;
	token_api.post(); 
	Morebits.status.init(form);
	//Morebits.wiki.actionCompleted.notice = "Email sent";
};
	
Twinkle.os.sendEmail = function sendemail(apiobj) {
	var params = apiobj.parent;
	var token = $(apiobj.responseXML).find("tokens").attr("csrftoken");
	var query = {
		'action': 'emailuser',
		'target': 'Oversight',
		'subject': params.emailSubject, 
		'text':  params.emailBody + '\n\n' + Twinkle.getPref('emailSummaryAd'),
		'ccme': Twinkle.getPref('ccCopyOfEmail'),
		'token' : token
	};
	
	var mail_api = new Morebits.wiki.api( 'Email', query, Twinkle.os.checkIfSent );
	mail_api.post();
};

Twinkle.os.checkIfSent = function checkIfSent(apiobj) {
	var statelem = apiobj.getStatusElement();
	var result = $(apiobj.responseXML).find("emailuser").attr("result");
	if (result === "Success") {
		statelem.info("Sent successfully");
	} else {	// usual API errors are handled directly by morebits API constructor 
		statelem.error("Unknown error: email couldn't be sent. Please try again");
	}
};

})(jQuery);
