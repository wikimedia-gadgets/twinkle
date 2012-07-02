/*
 ****************************************
 *** twinkleprotect.js: Protect/RPP module
 ****************************************
 * Mode of invocation:     Tab ("PP"/"RPP")
 * Active on:              Non-special pages
 * Config directives in:   TwinkleConfig
 */

// Note: a lot of code in this module is re-used/called by batchprotect.

Twinkle.protect = function twinkleprotect() {
	if ( mw.config.get('wgNamespaceNumber') < 0 ) {
		return;
	}

	twAddPortletLink(Twinkle.protect.callback, Morebits.userIsInGroup('sysop') ? "PP" : "RPP", "tw-rpp",
		Morebits.userIsInGroup('sysop') ? "Protect page" : "Request page protection" );
};

Twinkle.protect.callback = function twinkleprotectCallback() {
	if (!twinkleUserAuthorized) {
		alert("Your account is too new to use Twinkle.");
		return;
	}
	var Window = new Morebits.simpleWindow( 620, 530 );
	Window.setTitle( Morebits.userIsInGroup( 'sysop' ) ? "Apply, request or tag page protection" : "Request or tag page protection" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Protection templates", "Template:Protection templates" );
	Window.addFooterLink( "Protection policy", "WP:PROT" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#protect" );

	var form = new Morebits.quickForm( Twinkle.protect.callback.evaluate );
	var actionfield = form.append( {
			type: 'field',
			label: 'Type of action'
		} );
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		actionfield.append( {
				type: 'radio',
				name: 'actiontype',
				event: Twinkle.protect.callback.changeAction,
				list: [
					{
						label: 'Protect page',
						value: 'protect',
						tooltip: 'Apply actual protection to the page.',
						checked: true
					}
				]
			} );
	}
	actionfield.append( {
			type: 'radio',
			name: 'actiontype',
			event: Twinkle.protect.callback.changeAction,
			list: [
				{
					label: 'Request page protection',
					value: 'request',
					tooltip: 'If you want to request protection via WP:RPP' + (Morebits.userIsInGroup('sysop') ? ' instead of doing the protection by yourself.' : '.'),
					checked: !Morebits.userIsInGroup('sysop')
				},
				{
					label: 'Tag page with protection template',
					value: 'tag',
					tooltip: 'If the protecting admin forgot to apply a protection template, or you have just protected the page without tagging, you can use this to apply the appropriate protection tag.',
					disabled: mw.config.get('wgArticleId') === 0
				}
			]
		} );

	form.append({ type: 'field', label: 'Preset', name: 'field_preset' });
	form.append({ type: 'field', label: '1', name: 'field1' });
	form.append({ type: 'field', label: '2', name: 'field2' });

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.actiontype[0].dispatchEvent( evt );

	// get current protection level asynchronously
	Morebits.wiki.actionCompleted.postfix = false;  // avoid Action: completed notice
	if (Morebits.userIsInGroup('sysop')) {
		var query = {
			action: 'query',
			prop: 'info',
			inprop: 'protection',
			titles: mw.config.get('wgPageName')
		};
		Morebits.status.init($('div[name="currentprot"] span').last()[0]);
		var statelem = new Morebits.status("Current protection level");
		var wpapi = new Morebits.wiki.api("retrieving...", query, Twinkle.protect.callback.protectionLevel, statelem);
		wpapi.post();
	}
};

Twinkle.protect.protectionLevel = null;

Twinkle.protect.callback.protectionLevel = function twinkleprotectCallbackProtectionLevel(apiobj) {
	var xml = apiobj.getXML();
	var result = [];
	$(xml).find('pr').each(function(index, pr) {
		var $pr = $(pr);
		var boldnode = document.createElement('b');
		boldnode.textContent = Morebits.string.toUpperCaseFirstChar($pr.attr('type')) + ": " + $pr.attr('level');
		result.push(boldnode);
		if ($pr.attr('expiry') === 'infinity') {
			result.push(" (indefinite) ");
		} else {
			result.push(" (expires " + new Date($pr.attr('expiry')).toUTCString() + ") ");
		}
		if ($pr.attr('cascade') === '') {
			result.push("(cascading) ");
		}
	});
	if (!result.length) {
		var boldnode = document.createElement('b');
		boldnode.textContent = "no protection";
		result.push(boldnode);
	}
	Twinkle.protect.protectionLevel = result;
	apiobj.statelem.info(result);
	window.setTimeout(function() { Morebits.wiki.actionCompleted.postfix = "completed"; }, 500);  // restore actionCompleted message
};

Twinkle.protect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Preset', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Choose a preset:',
					event: Twinkle.protect.callback.changePreset,
					list: (mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate)
				});

			field2 = new Morebits.quickForm.element({ type: 'field', label: 'Protection options', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			// for existing pages
			if (mw.config.get('wgArticleId')) {
				field2.append({
						type: 'checkbox',
						name: 'editmodify',
						event: Twinkle.protect.formevents.editmodify,
						list: [
							{
								label: 'Modify edit protection',
								value: 'editmodify',
								tooltip: 'If this is turned off, the edit protection level, and expiry time, will be left as is.',
								checked: true
							}
						]
					});
				var editlevel = field2.append({
						type: 'select',
						name: 'editlevel',
						label: 'Edit protection:',
						event: Twinkle.protect.formevents.editlevel
					});
				editlevel.append({
						type: 'option',
						label: 'All',
						value: 'all'
					});
				editlevel.append({
						type: 'option',
						label: 'Autoconfirmed',
						value: 'autoconfirmed'
					});
				editlevel.append({
						type: 'option',
						label: 'Sysop',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'editexpiry',
						label: 'Expires:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 hour', value: '1 hour' },
							{ label: '2 hours', value: '2 hours' },
							{ label: '3 hours', value: '3 hours' },
							{ label: '6 hours', value: '6 hours' },
							{ label: '12 hours', value: '12 hours' },
							{ label: '1 day', value: '1 day' },
							{ label: '2 days', selected: true, value: '2 days' },
							{ label: '3 days', value: '3 days' },
							{ label: '4 days', value: '4 days' },
							{ label: '1 week', value: '1 week' },
							{ label: '2 weeks', value: '2 weeks' },
							{ label: '1 month', value: '1 month' },
							{ label: '2 months', value: '2 months' },
							{ label: '3 months', value: '3 months' },
							{ label: '1 year', value: '1 year' },
							{ label: 'indefinite', value:'indefinite' },
							{ label: 'Custom...', value: 'custom' }
						]
					});
				field2.append({
						type: 'checkbox',
						name: 'movemodify',
						event: Twinkle.protect.formevents.movemodify,
						list: [
							{
								label: 'Modify move protection',
								value: 'movemodify',
								tooltip: 'If this is turned off, the move protection level, and expiry time, will be left as is.',
								checked: true
							}
						]
					});
				var movelevel = field2.append({
						type: 'select',
						name: 'movelevel',
						label: 'Move protection:',
						event: Twinkle.protect.formevents.movelevel
					});
				movelevel.append({
						type: 'option',
						label: 'All',
						value: 'all'
					});
				movelevel.append({
						type: 'option',
						label: 'Autoconfirmed',
						value: 'autoconfirmed'
					});
				movelevel.append({
						type: 'option',
						label: 'Sysop',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'moveexpiry',
						label: 'Expires:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 hour', value: '1 hour' },
							{ label: '2 hours', value: '2 hours' },
							{ label: '3 hours', value: '3 hours' },
							{ label: '6 hours', value: '6 hours' },
							{ label: '12 hours', value: '12 hours' },
							{ label: '1 day', value: '1 day' },
							{ label: '2 days', selected: true, value: '2 days' },
							{ label: '3 days', value: '3 days' },
							{ label: '4 days', value: '4 days' },
							{ label: '1 week', value: '1 week' },
							{ label: '2 weeks', value: '2 weeks' },
							{ label: '1 month', value: '1 month' },
							{ label: '2 months', value: '2 months' },
							{ label: '3 months', value: '3 months' },
							{ label: '1 year', value: '1 year' },
							{ label: 'indefinite', value:'indefinite' },
							{ label: 'Custom...', value: 'custom' }
						]
					});
			} else {  // for non-existing pages
				var createlevel = field2.append({
						type: 'select',
						name: 'createlevel',
						label: 'Create protection:',
						event: Twinkle.protect.formevents.createlevel
					});
				createlevel.append({
						type: 'option',
						label: 'All',
						value: 'all'
					});
				createlevel.append({
						type: 'option',
						label: 'Autoconfirmed',
						value: 'autoconfirmed'
					});
				createlevel.append({
						type: 'option',
						label: 'Sysop',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'createexpiry',
						label: 'Expires:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 hour', value: '1 hour' },
							{ label: '2 hours', value: '2 hours' },
							{ label: '3 hours', value: '3 hours' },
							{ label: '6 hours', value: '6 hours' },
							{ label: '12 hours', value: '12 hours' },
							{ label: '1 day', value: '1 day' },
							{ label: '2 days', value: '2 days' },
							{ label: '3 days', value: '3 days' },
							{ label: '4 days', value: '4 days' },
							{ label: '1 week', value: '1 week' },
							{ label: '2 weeks', value: '2 weeks' },
							{ label: '1 month', value: '1 month' },
							{ label: '2 months', value: '2 months' },
							{ label: '3 months', value: '3 months' },
							{ label: '1 year', value: '1 year' },
							{ label: 'indefinite', selected: true, value: 'indefinite' },
							{ label: 'Custom...', value: 'custom' }
						]
					});
			}
			field2.append({
					type: 'textarea',
					name: 'protectReason',
					label: 'Protection reason (for log):'
				});
			if (!mw.config.get('wgArticleId')) {  // tagging isn't relevant for non-existing pages
				break;
			}
			/* falls through */
		case 'tag':
			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Tagging options', name: 'field1' });
			field1.append( {
					type: 'select',
					name: 'tagtype',
					label: 'Choose protection template:',
					list: Twinkle.protect.protectionTags,
					event: Twinkle.protect.formevents.tagtype
				} );
			field1.append( {
					type: 'checkbox',
					list: [
						{
							name: 'small',
							label: 'Iconify (small=yes)',
							tooltip: 'Will use the |small=yes feature of the template, and only render it as a keylock',
							checked: true
						},
						{
							name: 'noinclude',
							label: 'Wrap protection template with <noinclude>',
							tooltip: 'Will wrap the protection template in &lt;noinclude&gt; tags, so that it won\'t transclude',
							checked: (mw.config.get('wgNamespaceNumber') === 10)
						}
					]
				} );
			break;

		case 'request':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Type of protection', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Type and reason:',
					event: Twinkle.protect.callback.changePreset,
					list: (mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate)
				});

			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Options', name: 'field1' });
			field1.append( {
					type: 'select',
					name: 'expiry',
					label: 'Duration: ',
					list: [
						{ label: 'Temporary', value: 'temporary' },
						{ label: 'Indefinite', value: 'indefinite' },
						{ label: '', selected: true, value: '' }
					]
				} );
			field1.append({
					type: 'textarea',
					name: 'reason',
					label: 'Reason: '
				});
			break;
		default:
			alert("Something's afoot in twinkleprotect");
			break;
	}

	var oldfield;
	if (field_preset) {
		oldfield = $(e.target.form).find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field_preset"]').css('display', 'none');
	}
	if (field1) {
		oldfield = $(e.target.form).find('fieldset[name="field1"]')[0];
		oldfield.parentNode.replaceChild(field1.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field1"]').css('display', 'none');
	}
	if (field2) {
		oldfield = $(e.target.form).find('fieldset[name="field2"]')[0];
		oldfield.parentNode.replaceChild(field2.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field2"]').css('display', 'none');
	}

	if (e.target.values === 'protect') {
		// fake a change event on the preset dropdown
		var evt = document.createEvent( "Event" );
		evt.initEvent( 'change', true, true );
		e.target.form.category.dispatchEvent( evt );

		// re-add protection level text, if it's available
		if (Twinkle.protect.protectionLevel) {
			Morebits.status.init($('div[name="currentprot"] span').last()[0]);
			Morebits.status.info("Current protection level", Twinkle.protect.protectionLevel);
		}

		// reduce vertical height of dialog
		$(e.target.form).find('select[name="editlevel"], select[name="editexpiry"], select[name="moveexpiry"], select[name="movelevel"], select[name="createexpiry"], select[name="createlevel"]').
			parent().css({ display: 'inline-block', marginRight: '0.5em' });
	}
};

Twinkle.protect.formevents = {
	editmodify: function twinkleprotectFormEditmodifyEvent(e) {
		e.target.form.editlevel.disabled = !e.target.checked;
		e.target.form.editexpiry.disabled = !e.target.checked || (e.target.form.editlevel.value === 'all');
		e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	editlevel: function twinkleprotectFormEditlevelEvent(e) {
		e.target.form.editexpiry.disabled = (e.target.value === 'all');
	},
	movemodify: function twinkleprotectFormMovemodifyEvent(e) {
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	movelevel: function twinkleprotectFormMovelevelEvent(e) {
		e.target.form.moveexpiry.disabled = (e.target.value === 'all');
	},
	createlevel: function twinkleprotectFormCreatelevelEvent(e) {
		e.target.form.createexpiry.disabled = (e.target.value === 'all');
	},
	tagtype: function twinkleprotectFormTagtypeEvent(e) {
		e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
	}
};

Twinkle.protect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('Enter a custom expiry time.  \nYou can use relative times, like "1 minute" or "19 days", or absolute timestamps, "yyyymmddhhmm" (e.g. "200602011406" is Feb 1, 2006, at 14:06 UTC).', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	}
};

Twinkle.protect.protectionTypes = [
	{
		label: 'Full protection',
		list: [
			{ label: 'Generic (full)', value: 'pp-protected' },
			{ label: 'Content dispute/edit warring (full)', value: 'pp-dispute' },
			{ label: 'Persistent vandalism (full)', value: 'pp-vandalism' },
			{ label: 'Highly visible template (full)', value: 'pp-template' },
			{ label: 'User talk of blocked user (full)', value: 'pp-usertalk' }
		]
	},
	{
		label: 'Semi-protection',
		list: [
			{ label: 'Generic (semi)', value: 'pp-semi-protected' },
			{ label: 'Persistent vandalism (semi)', selected: true, value: 'pp-semi-vandalism' },
			{ label: 'BLP policy violations (semi)', value: 'pp-semi-blp' },
			{ label: 'Sockpuppetry (semi)', value: 'pp-semi-sock' },
			{ label: 'Highly visible template (semi)', value: 'pp-semi-template' },
			{ label: 'User talk of blocked user (semi)', value: 'pp-semi-usertalk' }
		]
	},
	{
		label: 'Move protection',
		list: [
			{ label: 'Generic (move)', value: 'pp-move' },
			{ label: 'Dispute/move warring (move)', value: 'pp-move-dispute' },
			{ label: 'Page-move vandalism (move)', value: 'pp-move-vandalism' },
			{ label: 'Highly visible page (move)', value: 'pp-move-indef' }
		]
	},
	{ label: 'Unprotection', value: 'unprotect' }
];

Twinkle.protect.protectionTypesCreate = [
	{
		label: 'Create protection',
		list: [
			{ label: 'Generic ({{pp-create}})', value: 'pp-create' },
			{ label: 'Offensive name', value: 'pp-create-offensive' },
			{ label: 'Repeatedly recreated', selected: true, value: 'pp-create-salt' },
			{ label: 'Recently deleted BLP', value: 'pp-create-blp' }
		]
	},
	{ label: 'Unprotection', value: 'unprotect' }
];

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
Twinkle.protect.protectionPresetsInfo = {
	'pp-protected': {
		edit: 'sysop',
		move: 'sysop',
		reason: null
	},
	'pp-dispute': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:PP#Content disputes|Edit warring / Content dispute]]'
	},
	'pp-vandalism': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Persistent [[WP:Vandalism|vandalism]]'
	},
	'pp-template': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:High-risk templates|Highly visible template]]'
	},
	'pp-usertalk': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:PP#Talk-page protection|Inappropriate use of user talk page while blocked]]'
	},
	'pp-semi-vandalism': {
		edit: 'autoconfirmed',
		reason: 'Persistent [[WP:Vandalism|vandalism]]',
		template: 'pp-vandalism'
	},
	'pp-semi-blp': {
		edit: 'autoconfirmed',
		reason: 'Violations of the [[WP:Biographies of living persons|biographies of living persons policy]]'
	},
	'pp-semi-usertalk': {
		edit: 'autoconfirmed',
		move: 'sysop',
		reason: '[[WP:PP#Talk-page protection|Inappropriate use of user talk page while blocked]]'
	},
	'pp-semi-template': {
		edit: 'autoconfirmed',
		move: 'sysop',
		reason: '[[WP:High-risk templates|Highly visible template]]',
		template: 'pp-template'
	},
	'pp-semi-sock': {
		edit: 'autoconfirmed',
		reason: 'Persistent [[WP:Sock puppetry|sock puppetry]]'
	},
	'pp-semi-protected': {
		edit: 'autoconfirmed',
		reason: null,
		template: 'pp-protected'
	},
	'pp-move': {
		move: 'sysop',
		reason: null
	},
	'pp-move-dispute': {
		move: 'sysop',
		reason: '[[WP:MOVP|Move warring]]'
	},
	'pp-move-vandalism': {
		move: 'sysop',
		reason: '[[WP:MOVP|Page-move vandalism]]'
	},
	'pp-move-indef': {
		move: 'sysop',
		reason: '[[WP:MOVP|Highly visible page]]'
	},
	'unprotect': {
		edit: 'all',
		move: 'all',
		create: 'all',
		reason: null,
		template: 'none'
	},
	'pp-create-offensive': {
		create: 'sysop',
		reason: '[[WP:SALT|Offensive name]]'
	},
	'pp-create-salt': {
		create: 'sysop',
		reason: '[[WP:SALT|Repeatedly recreated]]'
	},
	'pp-create-blp': {
		create: 'sysop',
		reason: '[[WP:BLPDEL|Recently deleted BLP]]'
	},
	'pp-create': {
		create: 'sysop',
		reason: '{{pp-create}}'
	}
};

Twinkle.protect.protectionTags = [
	{
		label: 'None (remove existing protection templates)',
		value: 'none'
	},
	{
		label: 'None (do not remove existing protection templates)',
		value: 'noop'
	},
	{
		label: 'Full protection templates',
		list: [
			{ label: '{{pp-dispute}}: dispute/edit war', value: 'pp-dispute', selected: true },
			{ label: '{{pp-usertalk}}: blocked user talk', value: 'pp-usertalk' }
		]
	},
	{
		label: 'Full/semi-protection templates',
		list: [
			{ label: '{{pp-vandalism}}: vandalism', value: 'pp-vandalism' },
			{ label: '{{pp-template}}: high-risk template', value: 'pp-template' },
			{ label: '{{pp-protected}}: general protection', value: 'pp-protected' }
		]
	},
	{
		label: 'Semi-protection templates',
		list: [
			{ label: '{{pp-semi-usertalk}}: blocked user talk', value: 'pp-semi-usertalk' },
			{ label: '{{pp-semi-sock}}: sockpuppetry', value: 'pp-semi-sock' },
			{ label: '{{pp-semi-blp}}: BLP violations', value: 'pp-semi-blp' },
			{ label: '{{pp-semi-indef}}: general long-term', value: 'pp-semi-indef' }
		]
	},
	{
		label: 'Move protection templates',
		list: [
			{ label: '{{pp-move-dispute}}: dispute/move war', value: 'pp-move-dispute' },
			{ label: '{{pp-move-vandalism}}: page-move vandalism', value: 'pp-move-vandalism' },
			{ label: '{{pp-move-indef}}: general long-term', value: 'pp-move-indef' },
			{ label: '{{pp-move}}: other', value: 'pp-move' }
		]
	}
];

Twinkle.protect.callback.changePreset = function twinkleprotectCallbackChangePreset(e) {
	var form = e.target.form;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if (actiontype === 'protect') {  // actually protecting the page
		var item = Twinkle.protect.protectionPresetsInfo[form.category.value];
		if (mw.config.get('wgArticleId')) {
			if (item.edit) {
				form.editmodify.checked = true;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
				form.editlevel.value = item.edit;
				Twinkle.protect.formevents.editlevel({ target: form.editlevel });
			} else {
				form.editmodify.checked = false;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
			}

			if (item.move) {
				form.movemodify.checked = true;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
				form.movelevel.value = item.move;
				Twinkle.protect.formevents.movelevel({ target: form.movelevel });
			} else {
				form.movemodify.checked = false;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
			}
		} else {
			if (item.create) {
				form.createlevel.value = item.create;
				Twinkle.protect.formevents.createlevel({ target: form.createlevel });
			}
		}

		var reasonField = (actiontype === "protect" ? form.protectReason : form.reason);
		if (item.reason) {
			reasonField.value = item.reason;
		} else {
			reasonField.value = '';
		}

		// sort out tagging options
		if (mw.config.get('wgArticleId')) {
			if( form.category.value === 'unprotect' ) {
				form.tagtype.value = 'none';
			} else {
				form.tagtype.value = (item.template ? item.template : form.category.value);
			}
			Twinkle.protect.formevents.tagtype({ target: form.tagtype });

			if( /template/.test( form.category.value ) ) {
				form.noinclude.checked = true;
				form.editexpiry.value = form.moveexpiry.value = "indefinite";
			} else {
				form.noinclude.checked = false;
			}
		}

	} else {  // RPP request
		if( form.category.value === 'unprotect' ) {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.disabled = false;
		}
	}
};

Twinkle.protect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if( actiontype === 'tag' || (actiontype === 'protect' && mw.config.get('wgArticleId')) ) {
		tagparams = {
			tag: form.tagtype.value,
			reason: ((form.tagtype.value === 'pp-protected' || form.tagtype.value === 'pp-semi-protected' || form.tagtype.value === 'pp-move') && form.protectReason) ? form.protectReason.value : null,
			expiry: (actiontype === 'protect') ? (form.editmodify.checked ? form.editexpiry.value : (form.movemodify.checked ?
				form.moveexpiry.value : null)) : null,
			small: form.small.checked,
			noinclude: form.noinclude.checked
		};
	}

	switch (actiontype) {
		case 'protect':
			// protect the page
			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), "Protecting page");
			if (mw.config.get('wgArticleId')) {
				if (form.editmodify.checked) {
					thispage.setEditProtection(form.editlevel.value, form.editexpiry.value);
				}
				if (form.movemodify.checked) {
					thispage.setMoveProtection(form.movelevel.value, form.moveexpiry.value);
				}
			} else {
				thispage.setCreateProtection(form.createlevel.value, form.createexpiry.value);
			}
			if (form.protectReason.value) {
				thispage.setEditSummary(form.protectReason.value);
			} else {
				alert("You must enter a protect reason, which will be inscribed into the protection log.");
				return;
			}

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = "Protection complete";

			thispage.protect();
			/* falls through */
		case 'tag':

			if (actiontype === 'tag') {
				Morebits.simpleWindow.setButtonsEnabled( false );
				Morebits.status.init( form );
				Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
				Morebits.wiki.actionCompleted.followRedirect = false;
				Morebits.wiki.actionCompleted.notice = "Tagging complete";
			}

			if (tagparams.tag === 'noop') {
				Morebits.status.info("Applying protection template", "nothing to do");
				break;
			}

			var protectedPage = new Morebits.wiki.page( mw.config.get('wgPageName'), 'Tagging page');
			protectedPage.setCallbackParameters( tagparams );
			protectedPage.load( Twinkle.protect.callbacks.taggingPage );
			break;

		case 'request':
			// file request at RPP
			var typename, typereason;
			switch( form.category.value ) {
				case 'pp-dispute':
				case 'pp-vandalism':
				case 'pp-template':
				case 'pp-usertalk':
				case 'pp-protected':
					typename = 'full protection';
					break;
				case 'pp-semi-vandalism':
				case 'pp-semi-usertalk':
				case 'pp-semi-template':
				case 'pp-semi-sock':
				case 'pp-semi-blp':
				case 'pp-semi-protected':
					typename = 'semi-protection';
					break;
				case 'pp-move':
				case 'pp-move-dispute':
				case 'pp-move-indef':
				case 'pp-move-vandalism':
					typename = 'move protection';
					break;
				case 'pp-create':
				case 'pp-create-offensive':
				case 'pp-create-blp':
				case 'pp-create-salt':
					typename = 'create protection';
					break;
				case 'unprotect':
					/* falls through */
				default:
					typename = 'unprotection';
					break;
			}
			switch (form.category.value) {
				case 'pp-dispute':
					typereason = 'Content dispute/edit warring';
					break;
				case 'pp-vandalism':
				case 'pp-semi-vandalism':
					typereason = 'Persistent vandalism';
					break;
				case 'pp-template':
				case 'pp-semi-template':
					typereason = 'Highly visible template';
					break;
				case 'pp-usertalk':
				case 'pp-semi-usertalk':
					typereason = 'Inappropriate use of user talk page while blocked';
					break;
				case 'pp-semi-sock':
					typereason = 'Persistent sockpuppetry';
					break;
				case 'pp-semi-blp':
					typereason = '[[WP:BLP|BLP]] policy violations';
					break;
				case 'pp-move-dispute':
					typereason = 'Page title dispute/move warring';
					break;
				case 'pp-move-vandalism':
					typereason = 'Page-move vandalism';
					break;
				case 'pp-move-indef':
					typereason = 'Highly visible page';
					break;
				case 'pp-create-offensive':
					typereason = 'Offensive name';
					break;
				case 'pp-create-blp':
					typereason = 'Recently deleted [[WP:BLP|BLP]]';
					break;
				case 'pp-create-salt':
					typereason = 'Repeatedly recreated';
					break;
				default:
					typereason = '';
					break;
			}

			var reason = typereason;
			if( form.reason.value !== '') {
				if ( typereason !== '' ) {
					reason += "\u00A0\u2013 ";  // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
				}
				reason += form.reason.value;
			}
			if( reason !== '' && reason.charAt( reason.length - 1 ) !== '.' ) {
				reason += '.';
			}

			var rppparams = {
				reason: reason,
				typename: typename,
				category: form.category.value,
				expiry: form.expiry.value
			};

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			rppName = 'Wikipedia:Requests for page protection';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = rppName;
			Morebits.wiki.actionCompleted.notice = "Nomination completed, redirecting now to the discussion page";

			var rppPage = new Morebits.wiki.page( rppName, 'Requesting protection of page');
			rppPage.setFollowRedirect( true );
			rppPage.setCallbackParameters( rppparams );
			rppPage.load( Twinkle.protect.callbacks.fileRequest );
			break;
		default:
			alert("twinkleprotect: unknown kind of action");
			break;
	}
};

Twinkle.protect.callbacks = {
	taggingPage: function( protectedPage ) {
		var params = protectedPage.getCallbackParameters();
		var text = protectedPage.getPageText();
		var tag, summary;

		var oldtag_re = /\s*(?:<noinclude>)?\s*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;
		var re_result = oldtag_re.exec(text);
		if (re_result) {
			if (confirm("{{" + re_result[1] + "}} was found on the page. \nClick OK to remove it, or click Cancel to leave it there.")) {
				text = text.replace( oldtag_re, '' );
			}
		}

		if ( params.tag !== 'none' ) {
			tag = params.tag;
			if( params.reason ) {
				tag += '|reason=' + params.reason;
			}
			if( ['indefinite', 'infinite', 'never', null].indexOf(params.expiry) === -1 ) {
				tag += '|expiry={{subst:#time:j F Y|' + (/^\s*\d+\s*$/.exec(params.expiry) ? params.expiry : '+' + params.expiry) + '}}';
			}
			if( params.small ) {
				tag += '|small=yes';
			}
		}

		if( params.tag === 'none' ) {
			summary = 'Removing protection template' + Twinkle.getPref('summaryAd');
		} else {
			if( params.noinclude ) {
				text = "<noinclude>{{" + tag + "}}</noinclude>" + text;
			} else {
				text = "{{" + tag + "}}\n" + text;
			}
			summary = "Adding {{" + params.tag + "}}" + Twinkle.getPref('summaryAd');
		}

		protectedPage.setEditSummary( summary );
		protectedPage.setPageText( text );
		protectedPage.setCreateOption( 'nocreate' );
		protectedPage.save();
	},

	fileRequest: function( rppPage ) {

		var params = rppPage.getCallbackParameters();
		var text = rppPage.getPageText();
		var statusElement = rppPage.getStatusElement();

		var ns2tag = {
			'0': 'la',
			'1': 'lat',
			'2': 'lu',
			'3': 'lut',
			'4': 'lw',
			'5': 'lwt',
			'6': 'lf',
			'7': 'lft',
			'8': 'lm',
			'9': 'lmt',
			'10': 'lt',
			'11': 'ltt',
			'12': 'lh',
			'13': 'lht',
			'14': 'lc',
			'15': 'lct',
			'100': 'lp',
			'101': 'lpt',
			'108': 'lb',
			'109': 'lbt'
		};

		var rppRe = new RegExp( '====\\s*\\{\\{\\s*' + ns2tag[ mw.config.get('wgNamespaceNumber') ] + '\\s*\\|\\s*' + RegExp.escape( mw.config.get('wgTitle'), true ) + '\\s*\\}\\}\\s*====', 'm' );
		var tag = rppRe.exec( text );

		var rppLink = document.createElement('a');
		rppLink.setAttribute('href', mw.util.wikiGetlink(rppPage.getPageName()) );
		rppLink.appendChild(document.createTextNode(rppPage.getPageName()));

		if ( tag ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}

		var newtag = '==== {{' + ns2tag[ mw.config.get('wgNamespaceNumber') ] + '|' + mw.config.get('wgTitle') +  '}} ====' + "\n";
		if( ( new RegExp( '^' + RegExp.escape( newtag ).replace( /\s+/g, '\\s*' ), 'm' ) ).test( text ) ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}

		var words;
		switch( params.expiry ) {
		case 'temporary':
			words = "Temporary ";
			break;
		case 'indefinite':
			words = "Indefinite ";
			break;
		default:
			words = "";
			break;
		}

		words += params.typename;

		newtag += "'''" + Morebits.string.toUpperCaseFirstChar(words) + ( params.reason !== '' ? ":''' " + params.reason : ".'''" ) + " ~~~~";

		var reg;
		if ( params.category === 'unprotect' ) {
			reg = /(\n==\s*Current requests for unprotection\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		} else {
			reg = /(\n==\s*Current requests for protection\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		}
		var originalTextLength = text.length;
		text = text.replace( reg, "$1" + newtag + "\n");
		if (text.length === originalTextLength)
		{
			var linknode = document.createElement('a');
			linknode.setAttribute("href", mw.util.wikiGetlink("Wikipedia:Twinkle/Fixing RPP") );
			linknode.appendChild(document.createTextNode('How to fix RPP'));
			statusElement.error( [ 'Could not find relevant heading on WP:RPP. To fix this problem, please see ', linknode, '.' ] );
			return;
		}
		statusElement.status( 'Adding new request...' );
		rppPage.setEditSummary( "Requesting " + params.typename + ' of [[' + mw.config.get('wgPageName').replace(/_/g, ' ') + ']].' + Twinkle.getPref('summaryAd') );
		rppPage.setPageText( text );
		rppPage.setCreateOption( 'recreate' );
		rppPage.save();
	}
};
