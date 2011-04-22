if ( typeof(Twinkle) === "undefined" ) {
	alert( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function twinkleprotect() {
	if ( wgNamespaceNumber < 0 ) {
		return;
	}

	if ( userIsInGroup( 'sysop' ) ) {
		twAddPortletLink( "javascript:twinkleprotect.callback()", "PP", "tw-rpp", "Protect page", "");
	}
	else if (twinkleUserAuthorized) {
		twAddPortletLink( "javascript:twinkleprotect.callback()", "RPP", "tw-rpp", "Request page protection", "");
	}
	else {
		twAddPortletLink( 'javascript:alert("Your account is too new to use Twinkle.");', 'RPP', 'tw-rpp', 'Request page protection', '');
	}
}

twinkleprotect.callback = function twinkleprotectCallback() {
	var Window = new SimpleWindow( 620, 550 );
	Window.setTitle( userIsInGroup( 'sysop' ) ? "Apply, request or tag page protection" : "Request or tag page protection" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Protection templates", "Template:Protection templates" );
	Window.addFooterLink( "Protection policy", "WP:PROT" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#protect" );

	var form = new QuickForm( twinkleprotect.callback.evaluate );
	var actionfield = form.append( {
			type: 'field',
			label: 'Type of action'
		} );
	if( userIsInGroup( 'sysop' ) ) {
		actionfield.append( {
				type: 'radio',
				name: 'actiontype',
				event: twinkleprotect.callback.changeAction,
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
			event: twinkleprotect.callback.changeAction,
			list: [
				{
					label: 'Request page protection',
					value: 'request',
					tooltip: 'If you want to request protection via WP:RPP' + (userIsInGroup('sysop') ? 'instead of doing the protection by yourself.' : '.'),
					checked: !userIsInGroup('sysop')
				},
				{
					label: 'Tag page with protection template',
					value: 'tag',
					tooltop: 'If the protecting admin forgot to tag the page with a protection template, or you have just protected the page without tagging, you can use this to apply the appropriate protection tag.',
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
}

twinkleprotect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;

	switch (e.target.value) {
		case 'protect':
			field_preset = new QuickForm.element({ type: 'field', label: 'Preset', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Choose a preset:',
					event: twinkleprotect.callback.changePreset,
					list: (wgArticleId ? twinkleprotect.protectionTypes : twinkleprotect.protectionTypesCreate)
				});

			field2 = new QuickForm.element({ type: 'field', label: 'Protection options', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot' });  // holds the current protection level, as filled out by the async callback
			field2.append({
					type: 'checkbox',
					name: 'editmodify',
					event: function(e) {
						e.target.form.editlevel.disabled = !e.target.checked;
						e.target.form.editexpiry.disabled = !e.target.checked || (e.target.form.editlevel.value === 'all');
						e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = (e.target.checked ? "" : "transparent");
					},
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
					event: function(e) {
						e.target.form.editexpiry.disabled = (e.target.value === 'all');
					}
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
							twinkleprotect.doCustomExpiry(e.target);
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
					event: function(e) {
						e.target.form.movelevel.disabled = !e.target.checked;
						e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
						e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = (e.target.checked ? "" : "transparent");
					},
					list: [
						{
							label: 'Modify move protection',
							value: 'movemodify',
							tooltip: 'If this is turned off, the move protection level, and expiry time, will be left as is.',
							checked: true
						}
					],
				});
			editlevel = field2.append({
					type: 'select',
					name: 'movelevel',
					label: 'Move protection:',
					event: function(e) {
						e.target.form.moveexpiry.disabled = (e.target.value === 'all');
					}
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
					name: 'moveexpiry',
					label: 'Expires:',
					event: function(e) {
						if (e.target.value === 'custom') {
							twinkleprotect.doCustomExpiry(e.target);
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
					type: 'textarea',
					name: 'reason',
					label: 'Protection reason (for log):',
				});
			// fall through to 'tag' case, which shares the same field1
		case 'tag':
			field1 = new QuickForm.element({ type: 'field', label: 'Tagging options', name: 'field1' });
			field1.append( {
					type: 'select',
					name: 'tagtype',
					label: 'Choose protection template:',
					list: twinkleprotect.protectionTags,
					event: function(e) {
						e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
					}
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
							tooltip: 'Will wrap the protection template in <noinclude> tags, so that it won\'t transclude',
							checked: (wgNamespaceNumber == 10)
						}
					]
				} );
			break;

		case 'request':
			field_preset = new QuickForm.element({ type: 'field', label: 'Type of protection', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Type and reason:',
					event: twinkleprotect.callback.changePreset,
					list: twinkleprotect.protectionTypes
				});

			field1 = new QuickForm.element({ type: 'field', label: 'Options', name: 'field1' });
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
}

twinkleprotect.currentEditLevel = null;
twinkleprotect.currentEditExpiry = null;
twinkleprotect.currentMoveLevel = null;
twinkleprotect.currentMoveExpiry = null;

twinkleprotect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('Enter a custom expiry time.  \nYou can use relative times, like "1 minute" or "19 days", or absolute timestamps, "yyyymmddhhmm" (e.g. "200602011406" is Feb 1, 2006, at 14:06 UTC).', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	}
}

twinkleprotect.protectionTypes = [
	{
		label: 'Full protection',
		list: [
			{ label: 'Generic (full)', value: 'pp-protected' },
			{ label: 'Content dispute/edit warring (full)', selected: true, value: 'pp-dispute' },
			{ label: 'Persistent vandalism (full)', value: 'pp-vandalism' },
			{ label: 'Highly visible template (full)', value: 'pp-template' },
			{ label: 'User talk of blocked user (full)', value: 'pp-usertalk' }
		]
	},
	{
		label: 'Semi-protection',
		list: [
			{ label: 'Generic (semi)', value: 'pp-semi-protected' },
			{ label: 'Persistent vandalism (semi)', value: 'pp-semi-vandalism' },
			{ label: 'BLP policy violations (semi)', value: 'pp-semi-blp' },
			{ label: 'Sockpuppetry (semi)', value: 'pp-semi-sock' },
			{ label: 'Highly visible template (semi)', value: 'pp-semi-template' },
			{ label: 'User talk of blocked user (semi)', value: 'pp-semi-usertalk' },
		]
	},
	{
		label: 'Move protection',
		list: [
			{ label: 'Generic (move)', value: 'pp-move' },
			{ label: 'Dispute/move warring (move)', value: 'pp-move-dispute' },
			{ label: 'Page-move vandalism (move)', value: 'pp-move-vandalism' },
			{ label: 'Highly visible page (move)', value: 'pp-move-indef' },
		]
	},
	{ label: 'Unprotection', value: 'unprotect' },
];

twinkleprotect.protectionTypesCreate = [
	{ label: 'Create protection', selected: true, value: 'pp-create' },
	{ label: 'Unprotection', value: 'unprotect' },
];

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
twinkleprotect.protectionPresetsInfo = {
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
		reason: null,
	},
	'pp-move-dispute': {
		move: 'sysop',
		reason: '[[WP:MOVP|Move warring]]',
	},
	'pp-move-vandalism': {
		move: 'sysop',
		reason: '[[WP:MOVP|Page-move vandalism]]',
	},
	'pp-move-indef': {
		move: 'sysop',
		reason: '[[WP:MOVP|Highly visible page]]',
	},
	'unprotect': {
		edit: 'all',
		move: 'all',
		reason: null
	},
	'pp-create': {
		create: 'sysop',
		reason: null
	},
};

twinkleprotect.protectionTags = [
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
			{ label: '\{\{pp-dispute\}\}: dispute/edit war', value: 'pp-dispute', selected: true },
			{ label: '\{\{pp-usertalk\}\}: blocked user talk', value: 'pp-usertalk' },
		]
	},
	{
		label: 'Full/semi-protection templates',
		list: [
			{ label: '\{\{pp-vandalism\}\}: vandalism', value: 'pp-vandalism' },
			{ label: '\{\{pp-template\}\}: high-risk template', value: 'pp-template' },
			{ label: '\{\{pp-protected\}\}: general protection', value: 'pp-protected' },
		]
	},
	{
		label: 'Semi-protection templates',
		list: [
			{ label: '\{\{pp-semi-usertalk\}\}: blocked user talk', value: 'pp-semi-usertalk' },
			{ label: '\{\{pp-semi-sock\}\}: sockpuppetry', value: 'pp-semi-sock' },
			{ label: '\{\{pp-semi-blp\}\}: BLP violations', value: 'pp-semi-blp' },
			{ label: '\{\{pp-semi-indef\}\}: general long-term', value: 'pp-semi-indef' },
		]
	},
	{
		label: 'Move protection templates',
		list: [
			{ label: '\{\{pp-move-dispute\}\}: dispute/move war', value: 'pp-move-dispute' },
			{ label: '\{\{pp-move-vandalism\}\}: page-move vandalism', value: 'pp-move-vandalism' },
			{ label: '\{\{pp-move-indef\}\}: general long-term', value: 'pp-move-indef' },
			{ label: '\{\{pp-move\}\}: other', value: 'pp-move' },
		]
	},
];

twinkleprotect.callback.changePreset = function twinkleprotectCallbackChangePreset(e) {
	var form = e.target.form;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) continue;
		actiontype = actiontypes[i].value;
		break;
	}

	if (actiontype === 'protect') {  // actually protecting the page
		var item = twinkleprotect.protectionPresetsInfo[form.category.value];
		if (item.edit) {
			form.editmodify.checked = true;
			form.editlevel.value = item.edit;
		} else {
			form.editmodify.checked = false;
		}

		if (item.move) {
			form.movemodify.checked = true;
			form.movelevel.value = item.move;
		} else {
			form.movemodify.checked = false;
		}

		if (item.create) {
			alert("Haven't got create protection working quite yet...");
			return;
		}
		if (item.reason) {
			form.reason.value = item.reason;
		} else {
			form.reason.value = '';
		}

		// sort out tagging options
		if( form.category.value === 'unprotect' ) {
			form.tagtype.value = 'none';
		} else {
			form.tagtype.value = (item.template ? item.template : form.category.value);
		}

		if( /template/.test( form.category.value ) ) {
			form.noinclude.checked = true;
			form.editexpiry.value = form.moveexpiry.value = "indefinite";
		} else {
			form.noinclude.checked = false;
		}

	} else {  // RPP request
		if( form.category.value === 'unprotect' ) {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.disabled = false;
		}
	}
}

twinkleprotect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) continue;
		actiontype = actiontypes[i].value;
		break;
	}

	switch (actiontype) {
		case 'protect':
			// protect the page
			var thispage = new Wikipedia.page(wgPageName, "Protecting page...");
			if (form.editmodify.checked) {
				thispage.setEditProtection(form.editlevel.value, form.editexpiry.value);
			}
			if (form.movemodify.checked) {
				thispage.setMoveProtection(form.movelevel.value, form.moveexpiry.value);
			}
			if (form.reason.value) {
				thispage.setEditSummary(form.reason.value);
			} else {
				alert("You must enter a protect reason, which will be inscribed into the protection log.");
				return;
			}
			thispage.protect();
			return;
			// fall through to "tag" case
		case 'tag':
			// tag the page through the protection
			var tagparams = {
				tag: form.tagtype.value,
				reason: ((form.tagtype.value === 'pp-protected' || form.tagtype.value === 'pp-semi-protected' || form.tagtype.value === 'pp-move') && form.reason) ? form.reason.value : null,
				expiry: (actiontype === 'protect') ? (form.editmodify.checked ? form.editexpiry.value : (form.movemodify.checked ?
					form.moveexpiry.value : null)) : null,
				small: form.small.checked,
				noinclude: form.noinclude.checked
			};

			SimpleWindow.setButtonsEnabled( false );
			Status.init( form );

			if (tagparams.tag === 'noop') {
				Status.info("Applying protection template", "nothing to do");
				break;
			}

			if (actiontype === 'tag') {
				Wikipedia.actionCompleted.redirect = wgPageName;
				Wikipedia.actionCompleted.followRedirect = false;
				Wikipedia.actionCompleted.notice = "Tagging complete";
			}

			var protectedPage = new Wikipedia.page( wgPageName, 'Tagging page');
			protectedPage.setCallbackParameters( tagparams );
			protectedPage.load( twinkleprotect.callbacks.sysop.taggingPage );
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
					typename = 'move protection';
					break;
				case 'pp-create':
					typename = 'create protection';
					break;
				case 'unprotect':
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
				default:
					typereason = '';
					break;
			}

			var reason;
			if( typereason !== '' ) {
				reason = typereason;
			}
			if( form.reason.value !== '') {
				reason += "\u00A0\u2013 " + form.reason.value;  // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
			}
			if( reason != '' && reason.charAt( reason.length - 1 ) != '.' ) {
				reason += '.';
			}

			var rppparams = {
				reason: reason,
				typename: typename,
				//category: form.category.value,
				expiry: form.expiry.value
			};

			SimpleWindow.setButtonsEnabled( false );
			Status.init( form );

			rppName = 'Wikipedia:Requests for page protection';

			// Updating data for the action completed event
			Wikipedia.actionCompleted.redirect = rppName;
			Wikipedia.actionCompleted.notice = "Nomination completed, redirecting now to the discussion page";

			var rppPage = new Wikipedia.page( rppName, 'Requesting protection of page');
			rppPage.setFollowRedirect( true );
			rppPage.setCallbackParameters( rppparams );
			rppPage.load( twinkleprotect.callbacks.user );
			break;
	}

	//var params = {
	//	reason: form.reason.value,
	//	expiry: form.expiry.value,
	//	type: form.category.value
	//}

	//if( userIsInGroup( 'sysop') ) {
	//	params.small = form.small.checked;
	//	params.editprot = form.editprot.checked;
	//	params.moveprot = form.moveprot.checked;
	//	params.noinclude = form.noinclude.checked;
	//	var request_only = form.request_only.checked;
	//	if( request_only && params.expiry != 'indefinite' ) {
	//		params.expiry = 'temporary';
	//	}
	//}


	//if( userIsInGroup( 'sysop' ) && ! request_only ) {


	//	if( params.reason ) {
	//		reason += ', ' + params.reason;
	//	}
	//	if( reason != '' && reason.charAt( reason.length - 1 ) != '.' ) {
	//		reason += '.';
	//	}

	//	params.reason = reason;
	//	params.tag = tag;
	//	params.edit = edit;
	//	params.move = move;
	//	params.create = create;

	//	var query = {
	//		'title': wgPageName,
	//		'action': 'protect'
	//	};

		// Updating data for the action completed event
	//	Wikipedia.actionCompleted.redirect = wgPageName;
	//	Wikipedia.actionCompleted.notice = "Done...";

	//	var wikipedia_wiki = new Wikipedia.wiki( 'Protecting page', query, twinkleprotect.callbacks.sysop.protectingPage );
	//	wikipedia_wiki.params = params;
	//	wikipedia_wiki.get();

	//}
}

twinkleprotect.callbacks = {
	sysop: {
		protectingPage: function( self ){
			var form  = self.responseXML.getElementById( 'mw-Protect-Form' );
			var postData;

			if( self.params.type == 'pp-move' ) {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-move': self.params.move,
					'wpProtectExpirySelection-move': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-move': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};

			} else if( self.params.type == 'pp-create' ) {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-create': self.params.create,
					'wpProtectExpirySelection-create': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-create': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};

			} else if( self.params.type == 'unprotect' ) {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-edit': self.params.edit,
					'wpProtectExpirySelection-edit': 'indefinite',
					'mwProtect-level-move': self.params.move,
					'wpProtectExpirySelection-move': 'indefinite',
					'mwProtect-level-create': self.params.create,
					'wpProtectExpirySelection-create': 'indefinite',
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};
			} else {
				postData = {
					'wpEditToken': form.wpEditToken.value,
					'mwProtect-level-edit': self.params.edit,
					'wpProtectExpirySelection-edit': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-edit': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-level-move': self.params.move,
					'wpProtectExpirySelection-move': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
					'mwProtect-expiry-move': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
					'mwProtect-cascade': self.params.cascade ? '' : undefined,
					'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
					'wpProtectReasonSelection': 'other',
					'mwProtect-reason': self.params.reason + TwinkleConfig.protectionSummaryAd
				};
			}

			self.post( postData );
		},

		taggingPage: function( protectedPage ) {

			var params = protectedPage.getCallbackParameters();
			var text = protectedPage.getPageText();

			var oldtag_re = /\s*(?:<noinclude>)?\s*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;

			text = text.replace( oldtag_re, '' );

			if ( params.tag !== 'none' ) {
				var tag = params.tag;
				if( params.reason ) {
					tag += '|reason=' + params.reason;
				}
				if( ['indefinite', 'infinite', 'never', null].indexOf(params.expiry) === -1 ) {
					tag += '|expiry=\{\{subst:#time:F j, Y|' + (/^\s*\d+\s*$/.exec(params.expiry) ? params.expiry : '+' + params.expiry) + '}}';
				}
				if( params.small ) {
					tag += '|small=yes';
				}
			}

			var summary;
			if( params.tag === 'none' ) {
				summary = 'Removing protection template' + TwinkleConfig.summaryAd;
			} else {
				if( params.noinclude ) {
					text = "<noinclude>\{\{" + tag + "\}\}</noinclude>" + text;
				} else {
					text = "\{\{" + tag + "\}\}\n" + text;
				}
				summary = "Adding \{\{" + params.tag + "\}\}" + TwinkleConfig.summaryAd;
			}

			protectedPage.setEditSummary( summary );
			protectedPage.setPageText( text );
			protectedPage.setCreateOption( 'nocreate' );
			protectedPage.save();
		}
	},

	user: function( rppPage ) {

		var params = rppPage.getCallbackParameters();
		var text = rppPage.getPageText();
		var statusElement = rppPage.getStatusElement();

		var ns2tag	=	{
			'0'	:	'la',
			'1'	:	'lat',
			'2'	:	'lu',
			'3'	:	'lut',
			'4'	:	'lw',
			'5'	:	'lwt',
			'6'	:	'lf',
			'7'	:	'lft',
			'8'	:	'lm',
			'9'	:	'lmt',
			'10':	'lt',
			'11':	'ltt',
			'12':	'lh',
			'13':	'lht',
			'14':	'lc',
			'15':	'lct',
			'100':	'lp',
			'101':	'lpt',
			'108':	'lb',
			'109':	'lbt'
		};

		var rppRe = new RegExp( '====\\s*\\{\\{\\s*' + ns2tag[ wgNamespaceNumber ] + '\\s*\\|\\s*' + RegExp.escape( wgTitle, true ) + '\\s*\\}\\}\\s*====', 'm' );
		var tag = rppRe.exec( text );

		var rppLink = document.createElement('a');
		rppLink.setAttribute('href', wgArticlePath.replace('$1', rppPage.getPageName()));
		rppLink.appendChild(document.createTextNode(rppPage.getPageName()));

		if ( tag ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}

		var newtag = '==== \{\{' + ns2tag[ wgNamespaceNumber ] + '|' + wgTitle +  '\}\} ====' + "\n";
		if( ( new RegExp( '^' + RegExp.escape( newtag ).replace( /\s+/g, '\\s*' ), 'm' ) ).test( text ) ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}
		var words = '';
		switch( params.expiry ) {
		case 'temporary':
			words = "Temporary";
			break;
		case 'indefinite':
			words = "Indefinite";
			break;
		}

		words += params.typename;

		newtag += "'''" + words.toUpperCaseFirstChar() + "'''" + ( params.reason != '' ? ': ' + params.reason : '' ) + " \~\~\~\~";

		if ( params.category == 'unprotect' ) {
			var reg = /(\n==\s*Current requests for unprotection\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		} else {
			var reg = /(\n==\s*Current requests for protection\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		}
		var originalTextLength = text.length;
		text = text.replace( reg, "$1" + newtag + "\n");
		if (text.length == originalTextLength)
		{
			statusElement.error( 'Could not find relevant "current requests for ..." heading on WP:RFPP. Aborting.' );
			return;
		}
		statusElement.status( 'Adding new request...' );
		rppPage.setEditSummary( "Requesting " + params.typename + ' of [[' + wgPageName.replace(/_/g, ' ') + ']]' + TwinkleConfig.summaryAd );
		rppPage.setPageText( text );
		rppPage.setCreateOption( 'recreate' );
		rppPage.save();
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinkleprotect", twinkleprotect );
