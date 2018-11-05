//<nowiki>


(function($){


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

	Twinkle.addPortletLink(Twinkle.protect.callback, Morebits.userIsInGroup('sysop') ? "PP" : "RPP", "tw-rpp",
		Morebits.userIsInGroup('sysop') ? "Protect page" : "Request page protection" );
};

Twinkle.protect.callback = function twinkleprotectCallback() {
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

	Morebits.wiki.actionCompleted.postfix = false;  // avoid Action: completed notice

	// get current protection level asynchronously
	Twinkle.protect.fetchProtectionLevel();
};

// Contains the current protection level in an object
// Once filled, it will look something like:
// { edit: { level: "sysop", expiry: <some date>, cascade: true }, ... }
Twinkle.protect.currentProtectionLevels = {};

Twinkle.protect.fetchProtectionLevel = function twinkleprotectFetchProtectionLevel() {

	var api = new mw.Api();
	var protectDeferred = api.get({
		format: 'json',
		indexpageids: true,
		action: 'query',
		list: 'logevents',
		letype: 'protect',
		letitle: mw.config.get('wgPageName'),
		prop: 'info|flagged',
		inprop: 'protection',
		titles: mw.config.get('wgPageName')
	});
	var stableDeferred = api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letype: 'stable',
		letitle: mw.config.get('wgPageName')
	});

	$.when.apply($, [protectDeferred, stableDeferred]).done(function(protectData, stableData){
		var pageid = protectData[0].query.pageids[0];
		var page = protectData[0].query.pages[pageid];
		var current = {};

		$.each(page.protection, function( index, protection ) {
			if (protection.type !== "aft") {
				current[protection.type] = {
					level: protection.level,
					expiry: protection.expiry,
					cascade: protection.cascade === ''
				};
			}
		});

		if (page.flagged) {
			current.stabilize = {
				level: page.flagged.protection_level,
				expiry: page.flagged.protection_expiry
			};
		}

		// show the protection level and log info
		Twinkle.protect.hasProtectLog = !!protectData[0].query.logevents.length;
		Twinkle.protect.hasStableLog = !!stableData[0].query.logevents.length;
		Twinkle.protect.currentProtectionLevels = current;
		Twinkle.protect.callback.showLogAndCurrentProtectInfo();
	});
};

Twinkle.protect.callback.showLogAndCurrentProtectInfo = function twinkleprotectCallbackShowLogAndCurrentProtectInfo() {
	var currentlyProtected = !$.isEmptyObject(Twinkle.protect.currentProtectionLevels);

	if (Twinkle.protect.hasProtectLog || Twinkle.protect.hasStableLog) {
		var $linkMarkup = $("<span>");

		if (Twinkle.protect.hasProtectLog)
			$linkMarkup.append(
				$( '<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'protect'}) + '">protection log</a>' ),
				Twinkle.protect.hasStableLog ? $("<span> &bull; </span>") : null
			);
		if (Twinkle.protect.hasStableLog)
			$linkMarkup.append($( '<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'stable'}) + '">pending changes log</a>)' ));

		Morebits.status.init($('div[name="hasprotectlog"] span')[0]);
		Morebits.status.warn(
			currentlyProtected ? 'Previous protections' : 'This page has been protected in the past',
			$linkMarkup[0]
		);
	}

	Morebits.status.init($('div[name="currentprot"] span')[0]);
	var protectionNode = [], statusLevel = 'info';

	if (currentlyProtected) {
		$.each(Twinkle.protect.currentProtectionLevels, function(type, settings) {
			var label = type === 'stabilize' ? 'Pending Changes' : Morebits.string.toUpperCaseFirstChar(type);
			protectionNode.push($("<b>" + label + ": " + settings.level + "</b>")[0]);
			if (settings.expiry === 'infinity') {
				protectionNode.push(" (indefinite) ");
			} else {
				protectionNode.push(" (expires " + new Date(settings.expiry).toUTCString() + ") ");
			}
			if (settings.cascade) {
				protectionNode.push("(cascading) ");
			}
		});
		statusLevel = 'warn';
	} else {
		protectionNode.push($("<b>no protection</b>")[0]);
	}

	Morebits.status[statusLevel]("Current protection level", protectionNode);
};

Twinkle.protect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;
	var isTemplate = mw.config.get("wgNamespaceNumber") === 10 || mw.config.get("wgNamespaceNumber") === 828;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Preset', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Choose a preset:',
					event: Twinkle.protect.callback.changePreset,
					list: (mw.config.get('wgArticleId') ?
						Twinkle.protect.protectionTypes.filter(function(v) {
							return isTemplate || v.label !== 'Template protection';
						}) :
						Twinkle.protect.protectionTypesCreate)
				});

			field2 = new Morebits.quickForm.element({ type: 'field', label: 'Protection options', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field2.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
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
						label: 'Extended confirmed',
						value: 'extendedconfirmed'
					});
				if (isTemplate) {
					editlevel.append({
							type: 'option',
							label: 'Template editor',
							value: 'templateeditor'
						});
				}
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
						// default expiry selection is conditionally set in Twinkle.protect.callback.changePreset
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
						label: 'Extended confirmed',
						value: 'extendedconfirmed'
					});
				if (isTemplate) {
					movelevel.append({
							type: 'option',
							label: 'Template editor',
							value: 'templateeditor'
						});
				}
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
						// default expiry selection is conditionally set in Twinkle.protect.callback.changePreset
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
							{ label: 'indefinite', value: 'indefinite' },
							{ label: 'Custom...', value: 'custom' }
						]
					});
				field2.append({
						type: 'checkbox',
						name: 'pcmodify',
						event: Twinkle.protect.formevents.pcmodify,
						list: [
							{
								label: 'Modify pending changes protection',
								value: 'pcmodify',
								tooltip: 'If this is turned off, the pending changes level, and expiry time, will be left as is.',
								checked: true
							}
						]
					});
				var pclevel = field2.append({
						type: 'select',
						name: 'pclevel',
						label: 'Pending changes:',
						event: Twinkle.protect.formevents.pclevel
					});
				pclevel.append({
						type: 'option',
						label: 'None',
						value: 'none'
					});
				pclevel.append({
						type: 'option',
						label: 'Pending changes',
						value: 'autoconfirmed',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'pcexpiry',
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
							{ label: '1 month', selected: true, value: '1 month' },
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
				if (isTemplate) {
					createlevel.append({
							type: 'option',
							label: 'Template editor',
							value: 'templateeditor'
						});
				}
				createlevel.append({
						type: 'option',
						label: 'Extended confirmed',
						value: 'extendedconfirmed',
						selected: true
					});
				createlevel.append({
						type: 'option',
						label: 'Sysop',
						value: 'sysop'
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
					label: 'Reason (for protection log):'
				});
			if (!mw.config.get('wgArticleId')) {  // tagging isn't relevant for non-existing pages
				break;
			}
			/* falls through */
		case 'tag':
			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Tagging options', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
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
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
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

		// reduce vertical height of dialog
		$(e.target.form).find('fieldset[name="field2"] select').parent().css({ display: 'inline-block', marginRight: '0.5em' });
	}

	// re-add protection level and log info, if it's available
	Twinkle.protect.callback.showLogAndCurrentProtectInfo();
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
		// sync move settings with edit settings if applicable
		if (e.target.form.movelevel.disabled && !e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = e.target.form.editlevel.value;
			e.target.form.moveexpiry.value = e.target.form.editexpiry.value;
		} else if (e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = 'sysop';
			e.target.form.moveexpiry.value = 'indefinite';
		}
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	movelevel: function twinkleprotectFormMovelevelEvent(e) {
		e.target.form.moveexpiry.disabled = (e.target.value === 'all');
	},
	pcmodify: function twinkleprotectFormPcmodifyEvent(e) {
		e.target.form.pclevel.disabled = !e.target.checked;
		e.target.form.pcexpiry.disabled = !e.target.checked || (e.target.form.pclevel.value === 'none');
		e.target.form.pclevel.style.color = e.target.form.pcexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	pclevel: function twinkleprotectFormPclevelEvent(e) {
		e.target.form.pcexpiry.disabled = (e.target.value === 'none');
	},
	createlevel: function twinkleprotectFormCreatelevelEvent(e) {
		e.target.form.createexpiry.disabled = (e.target.value === 'all');
	},
	tagtype: function twinkleprotectFormTagtypeEvent(e) {
		e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
	}
};

Twinkle.protect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('Enter a custom expiry time.  \nYou can use relative times, like "1 minute" or "19 days", or absolute timestamps, "yyyymmddhhmm" (e.g. "200602011405" is Feb 1, 2006, at 14:05 UTC).', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	} else {
		target.selectedIndex = 0;
	}
};

Twinkle.protect.protectionTypes = [
	{ label: 'Unprotection', value: 'unprotect' },
	{
		label: 'Full protection',
		list: [
			{ label: 'Generic (full)', value: 'pp-protected' },
			{ label: 'Content dispute/edit warring (full)', value: 'pp-dispute' },
			{ label: 'Persistent vandalism (full)', value: 'pp-vandalism' },
			{ label: 'User talk of blocked user (full)', value: 'pp-usertalk' }
		]
	},
	{
		label: 'Template protection',
		list: [
			{ label: 'Highly visible template (TE)', value: 'pp-template' }
		]
	},
	{
		label: 'Extended confirmed protection',
		list: [
			{ label: 'Arbitration enforcement (ECP)', selected: true, value: 'pp-30-500-arb' },
			{ label: 'Persistent vandalism (ECP)', value: 'pp-30-500-vandalism' },
			{ label: 'Disruptive editing (ECP)', value: 'pp-30-500-disruptive' },
			{ label: 'BLP policy violations (ECP)', value: 'pp-30-500-blp' },
			{ label: 'Sockpuppetry (ECP)', value: 'pp-30-500-sock' }
		]
	},
	{
		label: 'Semi-protection',
		list: [
			{ label: 'Generic (semi)', value: 'pp-semi-protected' },
			{ label: 'Persistent vandalism (semi)', selected: true, value: 'pp-semi-vandalism' },
			{ label: 'Disruptive editing (semi)', value: 'pp-semi-disruptive' },
			{ label: 'Adding unsourced content (semi)', value: 'pp-semi-unsourced' },
			{ label: 'BLP policy violations (semi)', value: 'pp-semi-blp' },
			{ label: 'Sockpuppetry (semi)', value: 'pp-semi-sock' },
			{ label: 'User talk of blocked user (semi)', value: 'pp-semi-usertalk' }
		]
	},
	{
		label: 'Pending changes',
		list: [
			{ label: 'Generic (PC)', value: 'pp-pc-protected' },
			{ label: 'Persistent vandalism (PC)', value: 'pp-pc-vandalism' },
			{ label: 'Disruptive editing (PC)', value: 'pp-pc-disruptive' },
			{ label: 'Adding unsourced content (PC)', value: 'pp-pc-unsourced' },
			{ label: 'BLP policy violations (PC)', value: 'pp-pc-blp' }
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
	}
];

Twinkle.protect.protectionTypesCreate = [
	{ label: 'Unprotection', value: 'unprotect' },
	{
		label: 'Create protection',
		list: [
			{ label: 'Generic ({{pp-create}})', value: 'pp-create' },
			{ label: 'Offensive name', value: 'pp-create-offensive' },
			{ label: 'Repeatedly recreated', selected: true, value: 'pp-create-salt' },
			{ label: 'Recently deleted BLP', value: 'pp-create-blp' }
		]
	}
];

// A page with both regular and PC protection will be assigned its regular
// protection weight plus 2
Twinkle.protect.protectionWeight = {
	sysop: 40,
	templateeditor: 30,
	extendedconfirmed: 20,
	autoconfirmed: 10,
	flaggedrevs_autoconfirmed: 5,  // Pending Changes protection alone
	all: 0,
	flaggedrevs_none: 0  // just in case
};

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
// Also note: stabilize = Pending Changes level
Twinkle.protect.protectionPresetsInfo = {
	'pp-protected': {
		edit: 'sysop',
		move: 'sysop',
		reason: null
	},
	'pp-dispute': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:PP#Content disputes|Edit warring / content dispute]]'
	},
	'pp-vandalism': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Persistent [[WP:Vandalism|vandalism]]'
	},
	'pp-usertalk': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:PP#Talk-page protection|Inappropriate use of user talk page while blocked]]'
	},
	'pp-template': {
		edit: 'templateeditor',
		move: 'templateeditor',
		reason: '[[WP:High-risk templates|Highly visible template]]'
	},
	'pp-30-500-arb': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: '[[WP:30/500|Arbitration enforcement]]',
		template: 'pp-30-500'
	},
	'pp-30-500-vandalism': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'Persistent [[WP:Vandalism|vandalism]] from (auto)confirmed accounts',
		template: 'pp-30-500'
	},
	'pp-30-500-disruptive': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'Persistent [[WP:Disruptive editing|disruptive editing]] from (auto)confirmed accounts',
		template: 'pp-30-500'
	},
	'pp-30-500-blp': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'Persistent violations of the [[WP:BLP|biographies of living persons policy]] from (auto)confirmed accounts',
		template: 'pp-30-500'
	},
	'pp-30-500-sock': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'Persistent [[WP:Sock puppetry|sock puppetry]]',
		template: 'pp-30-500'
	},
	'pp-semi-vandalism': {
		edit: 'autoconfirmed',
		reason: 'Persistent [[WP:Vandalism|vandalism]]',
		template: 'pp-vandalism'
	},
	'pp-semi-disruptive': {
		edit: 'autoconfirmed',
		reason: 'Persistent [[WP:Disruptive editing|disruptive editing]]',
		template: 'pp-protected'
	},
	'pp-semi-unsourced': {
		edit: 'autoconfirmed',
		reason: 'Persistent addition of [[WP:INTREF|unsourced or poorly sourced content]]',
		template: 'pp-protected'
	},
	'pp-semi-blp': {
		edit: 'autoconfirmed',
		reason: 'Violations of the [[WP:BLP|biographies of living persons policy]]',
		template: 'pp-blp'
	},
	'pp-semi-usertalk': {
		edit: 'autoconfirmed',
		move: 'autoconfirmed',
		reason: '[[WP:PP#Talk-page protection|Inappropriate use of user talk page while blocked]]',
		template: 'pp-usertalk'
	},
	'pp-semi-template': {  // removed for now
		edit: 'autoconfirmed',
		move: 'autoconfirmed',
		reason: '[[WP:High-risk templates|Highly visible template]]',
		template: 'pp-template'
	},
	'pp-semi-sock': {
		edit: 'autoconfirmed',
		reason: 'Persistent [[WP:Sock puppetry|sock puppetry]]',
		template: 'pp-sock'
	},
	'pp-semi-protected': {
		edit: 'autoconfirmed',
		reason: null,
		template: 'pp-protected'
	},
	'pp-pc-vandalism': {
		stabilize: 'autoconfirmed',  // stabilize = Pending Changes
		reason: 'Persistent [[WP:Vandalism|vandalism]]',
		template: 'pp-pc'
	},
	'pp-pc-disruptive': {
		stabilize: 'autoconfirmed',
		reason: 'Persistent [[WP:Disruptive editing|disruptive editing]]',
		template: 'pp-pc'
	},
	'pp-pc-unsourced': {
		stabilize: 'autoconfirmed',
		reason: 'Persistent addition of [[WP:INTREF|unsourced or poorly sourced content]]',
		template: 'pp-pc'
	},
	'pp-pc-blp': {
		stabilize: 'autoconfirmed',
		reason: 'Violations of the [[WP:BLP|biographies of living persons policy]]',
		template: 'pp-pc'
	},
	'pp-pc-protected': {
		stabilize: 'autoconfirmed',
		reason: null,
		template: 'pp-pc'
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
		stabilize: 'none',
		create: 'all',
		reason: null,
		template: 'none'
	},
	'pp-create-offensive': {
		create: 'sysop',
		reason: '[[WP:SALT|Offensive name]]'
	},
	'pp-create-salt': {
		create: 'extendedconfirmed',
		reason: '[[WP:SALT|Repeatedly recreated]]'
	},
	'pp-create-blp': {
		create: 'extendedconfirmed',
		reason: '[[WP:BLPDEL|Recently deleted BLP]]'
	},
	'pp-create': {
		create: 'extendedconfirmed',
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
		label: 'Edit protection templates',
		list: [
			{ label: '{{pp-vandalism}}: vandalism', value: 'pp-vandalism' },
			{ label: '{{pp-dispute}}: dispute/edit war', value: 'pp-dispute', selected: true },
			{ label: '{{pp-blp}}: BLP violations', value: 'pp-blp' },
			{ label: '{{pp-sock}}: sockpuppetry', value: 'pp-sock' },
			{ label: '{{pp-template}}: high-risk template', value: 'pp-template' },
			{ label: '{{pp-usertalk}}: blocked user talk', value: 'pp-usertalk' },
			{ label: '{{pp-protected}}: general protection', value: 'pp-protected' },
			{ label: '{{pp-semi-indef}}: general long-term semi-protection', value: 'pp-semi-indef' },
			{ label: '{{pp-30-500}}: extended confirmed protection', value: 'pp-30-500' }
		]
	},
	{
		label: 'Pending changes templates',
		list: [
			{ label: '{{pp-pc}}: pending changes', value: 'pp-pc' }
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
				form.editexpiry.value = '2 days';
			} else {
				form.editmodify.checked = false;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
			}

			if (item.move) {
				form.movemodify.checked = true;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
				form.movelevel.value = item.move;
				Twinkle.protect.formevents.movelevel({ target: form.movelevel });
				form.moveexpiry.value = '2 days';
			} else {
				form.movemodify.checked = false;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
			}

			if (item.stabilize) {
				form.pcmodify.checked = true;
				Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
				form.pclevel.value = item.stabilize;
				Twinkle.protect.formevents.pclevel({ target: form.pclevel });
			} else {
				form.pcmodify.checked = false;
				Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
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
				form.editexpiry.value = form.moveexpiry.value = form.pcexpiry.value = "indefinite";
			} else if( mw.config.get('wgNamespaceNumber') !== 10 ) {
				form.noinclude.checked = false;
			}
		}

	} else {  // RPP request
		if( form.category.value === 'unprotect' ) {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.value = '';
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

	var tagparams;
	if( actiontype === 'tag' || (actiontype === 'protect' && mw.config.get('wgArticleId')) ) {
		tagparams = {
			tag: form.tagtype.value,
			reason: ((form.tagtype.value === 'pp-protected' || form.tagtype.value === 'pp-semi-protected' || form.tagtype.value === 'pp-move') && form.protectReason) ? form.protectReason.value : null,
			small: form.small.checked,
			noinclude: form.noinclude.checked
		};
	}

	switch (actiontype) {
		case 'protect':
			// protect the page
			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = "Protection complete";

			var statusInited = false;
			var thispage;

			var allDone = function twinkleprotectCallbackAllDone() {
				if (thispage) {
					thispage.getStatusElement().info("done");
				}
				if (tagparams) {
					Twinkle.protect.callbacks.taggingPageInitial(tagparams);
				}
			};

			var stabilizeValues = {};
			if (form.pclevel) {
				stabilizeValues = {
					pclevel: form.pclevel.value,
					pcexpiry: form.pcexpiry.value,
					protectReason: form.protectReason.value
				};
			}

			var protectIt = function twinkleprotectCallbackProtectIt(next) {
				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), "Protecting page");
				if (mw.config.get('wgArticleId')) {
					if (form.editmodify.checked) {
						thispage.setEditProtection(form.editlevel.value, form.editexpiry.value);
					}
					if (form.movemodify.checked) {
						thispage.setMoveProtection(form.movelevel.value, form.moveexpiry.value);
					}
				} else {
					thispage.setCreateProtection(form.createlevel.value, form.createexpiry.value);
					thispage.setWatchlist(false);
				}

				if (form.protectReason.value) {
					thispage.setEditSummary(form.protectReason.value);
				} else {
					alert("You must enter a protect reason, which will be inscribed into the protection log.");
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled( false );
					Morebits.status.init( form );
					statusInited = true;
				}

				thispage.protect(next);
			};

			var stabilizeIt = function twinkleprotectCallbackStabilizeIt() {
				if (thispage) {
					thispage.getStatusElement().info("done");
				}

				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), "Applying pending changes protection");
				thispage.setFlaggedRevs(stabilizeValues.pclevel, stabilizeValues.pcexpiry);

				if (stabilizeValues.protectReason) {
					thispage.setEditSummary(stabilizeValues.protectReason);
				} else {
					alert("You must enter a protect reason, which will be inscribed into the protection log.");
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.stabilize(allDone);
			};

			if ((form.editmodify && form.editmodify.checked) || (form.movemodify && form.movemodify.checked) ||
				!mw.config.get('wgArticleId')) {
				if (form.pcmodify && form.pcmodify.checked) {
					protectIt(stabilizeIt);
				} else {
					protectIt(allDone);
				}
			} else if (form.pcmodify && form.pcmodify.checked) {
				stabilizeIt();
			} else {
				alert("Please give Twinkle something to do! \nIf you just want to tag the page, you can choose the 'Tag page with protection template' option at the top.");
			}

			break;

		case 'tag':
			// apply a protection template

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.followRedirect = false;
			Morebits.wiki.actionCompleted.notice = "Tagging complete";

			Twinkle.protect.callbacks.taggingPageInitial(tagparams);
			break;

		case 'request':
			// file request at RFPP
			var typename, typereason;
			switch( form.category.value ) {
				case 'pp-dispute':
				case 'pp-vandalism':
				case 'pp-usertalk':
				case 'pp-protected':
					typename = 'full protection';
					break;
				case 'pp-template':
					typename = 'template protection';
					break;
				case 'pp-30-500-arb':
				case 'pp-30-500-vandalism':
				case 'pp-30-500-disruptive':
				case 'pp-30-500-blp':
				case 'pp-30-500-sock':
					typename = 'extended confirmed';
					break;
				case 'pp-semi-vandalism':
				case 'pp-semi-disruptive':
				case 'pp-semi-unsourced':
				case 'pp-semi-usertalk':
				case 'pp-semi-sock':
				case 'pp-semi-blp':
				case 'pp-semi-protected':
					typename = 'semi-protection';
					break;
				case 'pp-pc-vandalism':
				case 'pp-pc-blp':
				case 'pp-pc-protected':
				case 'pp-pc-unsourced':
				case 'pp-pc-disruptive':
					typename = 'pending changes';
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
				case 'pp-pc-vandalism':
				case 'pp-30-500-vandalism':
					typereason = 'Persistent [[WP:VAND|vandalism]]';
					break;
				case 'pp-semi-disruptive':
				case 'pp-pc-disruptive':
				case 'pp-30-500-disruptive':
					typereason = 'Persistent [[Wikipedia:Disruptive editing|disruptive editing]]';
					break;
				case 'pp-semi-unsourced':
				case 'pp-pc-unsourced':
					typereason = 'Persistent addition of [[WP:INTREF|unsourced or poorly sourced content]]';
					break;
				case 'pp-template':
					typereason = '[[WP:HIGHRISK|High-risk template]]';
					break;
				case 'pp-30-500-arb':
					typereason = '[[WP:30/500|Arbitration enforcement]]';
					break;
				case 'pp-usertalk':
				case 'pp-semi-usertalk':
					typereason = 'Inappropriate use of user talk page while blocked';
					break;
				case 'pp-semi-sock':
				case 'pp-30-500-sock':
					typereason = 'Persistent [[WP:SOCK|sockpuppetry]]';
					break;
				case 'pp-semi-blp':
				case 'pp-pc-blp':
				case 'pp-30-500-blp':
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

			var rppName = 'Wikipedia:Requests for page protection';

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
	taggingPageInitial: function( tagparams ) {
		if (tagparams.tag === 'noop') {
			Morebits.status.info("Applying protection template", "nothing to do");
			return;
		}

		var protectedPage = new Morebits.wiki.page( mw.config.get('wgPageName'), 'Tagging page');
		protectedPage.setCallbackParameters( tagparams );
		protectedPage.load( Twinkle.protect.callbacks.taggingPage );
	},
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
			if( params.small ) {
				tag += '|small=yes';
			}
		}

		if( params.tag === 'none' ) {
			summary = 'Removing protection template' + Twinkle.getPref('summaryAd');
		} else {
			if( Morebits.wiki.isPageRedirect() ) {
				//Only tag if no {{rcat shell}} is found
				if (!text.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
					text = text.replace(/#REDIRECT ?(\[\[.*?\]\])(.*)/i, "#REDIRECT $1$2\n\n{{" + tag + "}}");
				} else {
					Morebits.status.info("Redirect category shell present", "nothing to do");
					return;
				}
			} else if( params.noinclude ) {
				text = "<noinclude>{{" + tag + "}}</noinclude>" + text;
			} else {
				text = "{{" + tag + "}}\n" + text;
			}
			summary = "Adding {{" + params.tag + "}}" + Twinkle.getPref('summaryAd');
		}

		protectedPage.setEditSummary( summary );
		protectedPage.setPageText( text );
		protectedPage.setCreateOption( 'nocreate' );
		protectedPage.suppressProtectWarning(); // no need to let admins know they are editing through protection
		protectedPage.save();
	},

	fileRequest: function( rppPage ) {

		var params = rppPage.getCallbackParameters();
		var text = rppPage.getPageText();
		var statusElement = rppPage.getStatusElement();

		var rppRe = new RegExp( '===\\s*(\\[\\[)?\\s*:?\\s*' + RegExp.escape( Morebits.pageNameNorm, true ) + '\\s*(\\]\\])?\\s*===', 'm' );
		var tag = rppRe.exec( text );

		var rppLink = document.createElement('a');
		rppLink.setAttribute('href', mw.util.getUrl(rppPage.getPageName()) );
		rppLink.appendChild(document.createTextNode(rppPage.getPageName()));

		if ( tag ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}

		var newtag = '=== [[:' + Morebits.pageNameNorm + ']] ===\n';
		if( ( new RegExp( '^' + RegExp.escape( newtag ).replace( /\s+/g, '\\s*' ), 'm' ) ).test( text ) ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}
		newtag += '* {{pagelinks|1=' + Morebits.pageNameNorm + '}}\n\n';

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

		newtag += "'''" + Morebits.string.toUpperCaseFirstChar(words) + ( params.reason !== '' ? ( ":''' " +
			Morebits.string.formatReasonText(params.reason) ) : ".'''" ) + " ~~~~";

		// If either protection type results in a increased status, then post it under increase
		// else we post it under decrease
		var increase = false;
		var protInfo = Twinkle.protect.protectionPresetsInfo[params.category];

		// function to compute protection weights (see comment at Twinkle.protect.protectionWeight)
		var computeWeight = function(mainLevel, stabilizeLevel) {
			var result = Twinkle.protect.protectionWeight[mainLevel || 'all'];
			if (stabilizeLevel) {
				if (result) {
					if (stabilizeLevel.level === "autoconfirmed") {
						result += 2;
					}
				} else {
					result = Twinkle.protect.protectionWeight["flaggedrevs_" + stabilizeLevel];
				}
			}
			return result;
		};

		// compare the page's current protection weights with the protection we are requesting
		var editWeight = computeWeight(Twinkle.protect.currentProtectionLevels.edit &&
			Twinkle.protect.currentProtectionLevels.edit.level,
			Twinkle.protect.currentProtectionLevels.stabilize &&
			Twinkle.protect.currentProtectionLevels.stabilize.level);
		if (computeWeight(protInfo.edit, protInfo.stabilize) > editWeight ||
			computeWeight(protInfo.move) > computeWeight(Twinkle.protect.currentProtectionLevels.move &&
			Twinkle.protect.currentProtectionLevels.move.level) ||
			computeWeight(protInfo.create) > computeWeight(Twinkle.protect.currentProtectionLevels.create &&
			Twinkle.protect.currentProtectionLevels.create.level)) {
			increase = true;
		}

		var reg;
		if ( increase ) {
			reg = /(\n==\s*Current requests for reduction in protection level\s*==)/;
		} else {
			reg = /(\n==\s*Current requests for edits to a protected page\s*==)/;
		}

		var originalTextLength = text.length;
		text = text.replace( reg, "\n" + newtag + "\n$1");
		if (text.length === originalTextLength)
		{
			var linknode = document.createElement('a');
			linknode.setAttribute("href", mw.util.getUrl("Wikipedia:Twinkle/Fixing RPP") );
			linknode.appendChild(document.createTextNode('How to fix RPP'));
			statusElement.error( [ 'Could not find relevant heading on WP:RPP. To fix this problem, please see ', linknode, '.' ] );
			return;
		}
		statusElement.status( 'Adding new request...' );
		rppPage.setEditSummary( "Requesting " + params.typename + (params.typename === "pending changes" ? ' on [[:' : ' of [[:') +
			Morebits.pageNameNorm + ']].' + Twinkle.getPref('summaryAd') );
		rppPage.setPageText( text );
		rppPage.setCreateOption( 'recreate' );
		rppPage.save();
	}
};
})(jQuery);


//</nowiki>
