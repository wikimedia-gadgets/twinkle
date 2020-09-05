// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.speedy.callback, 'CSD', 'tw-csd', Morebits.userIsSysop ? 'Delete page according to WP:CSD' : 'Request speedy deletion according to WP:CSD');
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsSysop ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

// Used by unlink feature
Twinkle.speedy.dialog = null;
// Used throughout
Twinkle.speedy.hasCSD = !!$('#delete-reason').length;

// The speedy criteria list can be in one of several modes
Twinkle.speedy.mode = {
	sysopSingleSubmit: 1,  // radio buttons, no subgroups, submit when "Submit" button is clicked
	sysopRadioClick: 2,  // radio buttons, no subgroups, submit when a radio button is clicked
	sysopMultipleSubmit: 3, // check boxes, subgroups, "Submit" button already present
	sysopMultipleRadioClick: 4, // check boxes, subgroups, need to add a "Submit" button
	userMultipleSubmit: 5,  // check boxes, subgroups, "Submit" button already pressent
	userMultipleRadioClick: 6,  // check boxes, subgroups, need to add a "Submit" button
	userSingleSubmit: 7,  // radio buttons, subgroups, submit when "Submit" button is clicked
	userSingleRadioClick: 8,  // radio buttons, subgroups, submit when a radio button is clicked

	// are we in "delete page" mode?
	// (sysops can access both "delete page" [sysop] and "tag page only" [user] modes)
	isSysop: function twinklespeedyModeIsSysop(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	},
	// do we have a "Submit" button once the form is created?
	hasSubmitButton: function twinklespeedyModeHasSubmitButton(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userSingleSubmit;
	},
	// is db-multiple the outcome here?
	isMultiple: function twinklespeedyModeIsMultiple(mode) {
		return mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	}
};

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	Twinkle.speedy.dialog = new Morebits.simpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
	dialog = Twinkle.speedy.dialog;
	dialog.setTitle('Choose criteria for speedy deletion');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Speedy deletion policy', 'WP:CSD');
	dialog.addFooterLink('Twinkle help', 'WP:TW/DOC#speedy');

	var form = new Morebits.quickForm(callbackfunc, Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);
	if (Morebits.userIsSysop) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Tag page only, don\'t delete',
					value: 'tag_only',
					name: 'tag_only',
					tooltip: 'If you just want to tag the page, instead of deleting it now',
					checked: !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
					event: function(event) {
						var cForm = event.target.form;
						var cChecked = event.target.checked;
						// enable talk page checkbox
						if (cForm.talkpage) {
							cForm.talkpage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
						}
						// enable redirects checkbox
						cForm.redirects.checked = !cChecked;
						// enable delete multiple
						cForm.delmultiple.checked = false;
						// enable notify checkbox
						cForm.notify.checked = cChecked;
						// enable deletion notification checkbox
						cForm.warnusertalk.checked = !cChecked && !Twinkle.speedy.hasCSD;
						// enable multiple
						cForm.multiple.checked = false;
						// enable requesting creation protection
						cForm.salting.checked = false;

						Twinkle.speedy.callback.modeChanged(cForm);

						event.stopPropagation();
					}
				}
			]
		});

		var deleteOptions = form.append({
			type: 'div',
			name: 'delete_options'
		});
		deleteOptions.append({
			type: 'header',
			label: 'Delete-related options'
		});
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) {  // hide option for user pages, to avoid accidentally deleting user talk page
			deleteOptions.append({
				type: 'checkbox',
				list: [
					{
						label: 'Also delete talk page',
						value: 'talkpage',
						name: 'talkpage',
						tooltip: "This option deletes the page's talk page in addition. If you choose the F8 (moved to Commons) criterion, this option is ignored and the talk page is *not* deleted.",
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						event: function(event) {
							event.stopPropagation();
						}
					}
				]
			});
		}
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: 'Also delete all redirects',
					value: 'redirects',
					name: 'redirects',
					tooltip: 'This option deletes all incoming redirects in addition. Avoid this option for procedural (e.g. move/merge) deletions.',
					checked: Twinkle.getPref('deleteRedirectsOnDelete'),
					event: function(event) {
						event.stopPropagation();
					}
				}
			]
		});
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: 'Delete under multiple criteria',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: 'When selected, you can select several criteria that apply to the page. For example, G11 and A7 are a common combination for articles.',
					event: function(event) {
						Twinkle.speedy.callback.modeChanged(event.target.form);
						event.stopPropagation();
					}
				}
			]
		});
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: 'Notify page creator of page deletion',
					value: 'warnusertalk',
					name: 'warnusertalk',
					tooltip: 'A notification template will be placed on the talk page of the creator, IF you have a notification enabled in your Twinkle preferences ' +
						'for the criterion you choose AND this box is checked. The creator may be welcomed as well.',
					checked: !Twinkle.speedy.hasCSD,
					event: function(event) {
						event.stopPropagation();
					}
				}
			]
		});
	}

	var tagOptions = form.append({
		type: 'div',
		name: 'tag_options'
	});

	if (Morebits.userIsSysop) {
		tagOptions.append({
			type: 'header',
			label: 'Tag-related options'
		});
	}

	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'Notify page creator if possible',
				value: 'notify',
				name: 'notify',
				tooltip: 'A notification template will be placed on the talk page of the creator, IF you have a notification enabled in your Twinkle preferences ' +
						'for the criterion you choose AND this box is checked. The creator may be welcomed as well.',
				checked: !Morebits.userIsSysop || !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
				event: function(event) {
					event.stopPropagation();
				}
			}
		]
	});
	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'Tag for creation protection (salting) as well',
				value: 'salting',
				name: 'salting',
				tooltip: 'When selected, the speedy deletion tag will be accompanied by a {{salt}} tag requesting that the deleting administrator apply creation protection. Only select if this page has been repeatedly recreated.',
				event: function(event) {
					event.stopPropagation();
				}
			}
		]
	});
	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'Tag with multiple criteria',
				value: 'multiple',
				name: 'multiple',
				tooltip: 'When selected, you can select several criteria that apply to the page. For example, G11 and A7 are a common combination for articles.',
				event: function(event) {
					Twinkle.speedy.callback.modeChanged(event.target.form);
					event.stopPropagation();
				}
			}
		]
	});

	form.append({
		type: 'div',
		name: 'work_area',
		label: 'Failed to initialize the CSD module. Please try again, or tell the Twinkle developers about the issue.'
	});

	if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
		form.append({ type: 'submit', className: 'tw-speedy-submit' }); // Renamed in modeChanged
	}

	var result = form.render();
	dialog.setContent(result);
	dialog.display();

	Twinkle.speedy.callback.modeChanged(result);
};

Twinkle.speedy.callback.getMode = function twinklespeedyCallbackGetMode(form) {
	var mode = Twinkle.speedy.mode.userSingleSubmit;
	if (form.tag_only && !form.tag_only.checked) {
		if (form.delmultiple.checked) {
			mode = Twinkle.speedy.mode.sysopMultipleSubmit;
		} else {
			mode = Twinkle.speedy.mode.sysopSingleSubmit;
		}
	} else {
		if (form.multiple.checked) {
			mode = Twinkle.speedy.mode.userMultipleSubmit;
		} else {
			mode = Twinkle.speedy.mode.userSingleSubmit;
		}
	}
	if (Twinkle.getPref('speedySelectionStyle') === 'radioClick') {
		mode++;
	}

	return mode;
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	var namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	var mode = Twinkle.speedy.callback.getMode(form);
	var isSysopMode = Twinkle.speedy.mode.isSysop(mode);

	if (isSysopMode) {
		$('[name=delete_options]').show();
		$('[name=tag_options]').hide();
		$('button.tw-speedy-submit').text('Delete page');
	} else {
		$('[name=delete_options]').hide();
		$('[name=tag_options]').show();
		$('button.tw-speedy-submit').text('Tag page');
	}

	var work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	if (mode === Twinkle.speedy.mode.userMultipleRadioClick || mode === Twinkle.speedy.mode.sysopMultipleRadioClick) {
		var evaluateType = isSysopMode ? 'evaluateSysop' : 'evaluateUser';

		work_area.append({
			type: 'div',
			label: 'When finished choosing criteria, click:'
		});
		work_area.append({
			type: 'button',
			name: 'submit-multiple',
			label: isSysopMode ? 'Delete page' : 'Tag page',
			event: function(event) {
				Twinkle.speedy.callback[evaluateType](event);
				event.stopPropagation();
			}
		});
	}

	var radioOrCheckbox = Twinkle.speedy.mode.isMultiple(mode) ? 'checkbox' : 'radio';

	if (isSysopMode && !Twinkle.speedy.mode.isMultiple(mode)) {
		work_area.append({ type: 'header', label: 'Custom rationale' });
		work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.customRationale, mode) });
	}

	if (namespace % 2 === 1 && namespace !== 3) {
		// show db-talk on talk pages, but not user talk pages
		work_area.append({ type: 'header', label: 'Talk pages' });
		work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.talkList, mode) });
	}

	if (!mw.config.get('wgIsRedirect')) {
		switch (namespace) {
			case 0:  // article
			case 1:  // talk
				work_area.append({ type: 'header', label: 'Articles' });
				work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.articleList, mode) });
				break;

			case 2:  // user
			case 3:  // user talk
				work_area.append({ type: 'header', label: 'User pages' });
				work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.userList, mode) });
				break;

			case 6:  // file
			case 7:  // file talk
				work_area.append({ type: 'header', label: 'Files' });
				work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.fileList, mode) });
				if (!isSysopMode) {
					work_area.append({ type: 'div', label: 'Tagging for CSD F4 (no license), F5 (orphaned fair use), F6 (no fair use rationale), and F11 (no permission) can be done using Twinkle\'s "DI" tab.' });
				}
				break;

			case 10:  // template
			case 11:  // template talk
				work_area.append({ type: 'header', label: 'Templates' });
				work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.templateList, mode) });
				break;

			case 14:  // category
			case 15:  // category talk
				work_area.append({ type: 'header', label: 'Categories' });
				work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.categoryList, mode) });
				break;

			case 100:  // portal
			case 101:  // portal talk
				work_area.append({ type: 'header', label: 'Portals' });
				work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.portalList, mode) });
				break;

			default:
				break;
		}
	} else {
		if (namespace === 2 || namespace === 3) {
			work_area.append({ type: 'header', label: 'User pages' });
			work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.userList, mode) });
		}
		work_area.append({ type: 'header', label: 'Redirects' });
		work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.redirectList, mode) });
	}

	var generalCriteria = Twinkle.speedy.generalList;

	// custom rationale lives under general criteria when tagging
	if (!isSysopMode) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	work_area.append({ type: 'header', label: 'General criteria' });
	work_area.append({ type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(generalCriteria, mode) });

	var old_area = Morebits.quickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (isSysopMode && Twinkle.speedy.hasCSD) {
		var customOption = $('input[name=csd][value=reason]')[0];
		if (customOption) {
			if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
				// force listeners to re-init
				customOption.click();
				customOption.parentNode.appendChild(customOption.subgroup);
			}
			customOption.subgroup.querySelector('input').value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
		}
	}
};

Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {
	// mode switches
	var isSysopMode = Twinkle.speedy.mode.isSysop(mode);
	var multiple = Twinkle.speedy.mode.isMultiple(mode);
	var hasSubmitButton = Twinkle.speedy.mode.hasSubmitButton(mode);
	var pageNamespace = mw.config.get('wgNamespaceNumber');

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = Twinkle.speedy.mode.isSysop(mode) ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (multiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (isSysopMode) {
			if (criterion.hideWhenSysop) {
				return null;
			}
			if (criterion.hideSubgroupWhenSysop) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenUser) {
				return null;
			}
			if (criterion.hideSubgroupWhenUser) {
				criterion.subgroup = null;
			}
		}

		if (mw.config.get('wgIsRedirect') && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.showInNamespaces && criterion.showInNamespaces.indexOf(pageNamespace) < 0) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.indexOf(pageNamespace) > -1) {
			return null;
		}

		if (criterion.subgroup && !hasSubmitButton) {
			if (Array.isArray(criterion.subgroup)) {
				criterion.subgroup = criterion.subgroup.concat({
					type: 'button',
					name: 'submit',
					label: isSysopMode ? 'Delete page' : 'Tag page',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: isSysopMode ? 'Delete page' : 'Tag page',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		return criterion;
	});
};

Twinkle.speedy.customRationale = [
	{
		label: 'Custom rationale' + (Morebits.userIsSysop ? ' (custom deletion reason)' : ' using {{db}} template'),
		value: 'reason',
		tooltip: '{{db}} is short for "delete because". At least one of the other deletion criteria must still apply to the page, and you must make mention of this in your rationale. This is not a "catch-all" for when you can\'t find any criteria that fit.',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'Rationale: ',
			size: 60
		},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.talkList = [
	{
		label: 'G8: Talk pages with no corresponding subject page',
		value: 'talk',
		tooltip: 'This excludes any page that is useful to the project - in particular, user talk pages, talk page archives, and talk pages for files that exist on Wikimedia Commons.'
	}
];

Twinkle.speedy.fileList = [
	{
		label: 'F1: Redundant file',
		value: 'redundantimage',
		tooltip: 'Any file that is a redundant copy, in the same file format and same or lower resolution, of something else on Wikipedia. Likewise, other media that is a redundant copy, in the same format and of the same or lower quality. This does not apply to files duplicated on Wikimedia Commons, because of licence issues; these should be tagged with {{subst:ncd|Image:newname.ext}} or {{subst:ncd}} instead',
		subgroup: {
			name: 'redundantimage_filename',
			type: 'input',
			label: 'File this is redundant to: ',
			tooltip: 'The "File:" prefix can be left off.'
		}
	},
	{
		label: 'F2: Corrupt, mising, or empty file',
		value: 'noimage',
		tooltip: 'Before deleting this type of file, verify that the MediaWiki engine cannot read it by previewing a resized thumbnail of it. This also includes empty (i.e., no content) file description pages for Commons files'
	},
	{
		label: 'F2: Unneeded file description page for a file on Commons',
		value: 'fpcfail',
		tooltip: 'An image, hosted on Commons, but with tags or information on its English Wikipedia description page that are no longer needed. (For example, a failed featured picture candidate.)',
		hideWhenMultiple: true
	},
	{
		label: 'F3: Improper license',
		value: 'noncom',
		tooltip: 'Files licensed as "for non-commercial use only", "non-derivative use" or "used with permission" that were uploaded on or after 2005-05-19, except where they have been shown to comply with the limited standards for the use of non-free content. This includes files licensed under a "Non-commercial Creative Commons License". Such files uploaded before 2005-05-19 may also be speedily deleted if they are not used in any articles'
	},
	{
		label: 'F4: Lack of licensing information',
		value: 'unksource',
		tooltip: 'Files in category "Files with unknown source", "Files with unknown copyright status", or "Files with no copyright tag" that have been tagged with a template that places them in the category for more than seven days, regardless of when uploaded. Note, users sometimes specify their source in the upload summary, so be sure to check the circumstances of the file.',
		hideWhenUser: true
	},
	{
		label: 'F5: Unused non-free copyrighted file',
		value: 'f5',
		tooltip: 'Files that are not under a free license or in the public domain that are not used in any article, whose only use is in a deleted article, and that are very unlikely to be used on any other article. Reasonable exceptions may be made for files uploaded for an upcoming article. For other unused non-free files, use the "Orphaned fair use" option in Twinkle\'s DI tab.',
		hideWhenUser: true
	},
	{
		label: 'F6: Missing fair-use rationale',
		value: 'norat',
		tooltip: 'Any file without a fair use rationale may be deleted seven days after it is uploaded.  Boilerplate fair use templates do not constitute a fair use rationale.  Files uploaded before 2006-05-04 should not be deleted immediately; instead, the uploader should be notified that a fair-use rationale is needed.  Files uploaded after 2006-05-04 can be tagged using the "No fair use rationale" option in Twinkle\'s DI module. Such files can be found in the dated subcategories of Category:Files with no fair use rationale.',
		hideWhenUser: true
	},
	{
		label: 'F7: Clearly invalid fair-use tag',
		value: 'badfairuse',  // same as below
		tooltip: 'This is only for files with a clearly invalid fair-use tag, such as a {{Non-free logo}} tag on a photograph of a mascot. For cases that require a waiting period (replaceable images or otherwise disputed rationales), use the options on Twinkle\'s DI tab.',
		subgroup: {
			name: 'badfairuse_rationale',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60
		}
	},
	{
		label: 'F7: Fair-use media from a commercial image agency which is not the subject of sourced commentary',
		value: 'badfairuse',  // same as above
		tooltip: 'Non-free images or media from a commercial source (e.g., Associated Press, Getty), where the file itself is not the subject of sourced commentary, are considered an invalid claim of fair use and fail the strict requirements of WP:NFCC.',
		subgroup: {
			name: 'badfairuse_rationale',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60
		},
		hideWhenMultiple: true
	},
	{
		label: 'F8: File available as an identical or higher-resolution copy on Wikimedia Commons',
		value: 'commons',
		tooltip: 'Provided the following conditions are met: 1: The file format of both images is the same. 2: The file\'s license and source status is beyond reasonable doubt, and the license is undoubtedly accepted at Commons. 3: All information on the file description page is present on the Commons file description page. That includes the complete upload history with links to the uploader\'s local user pages. 4: The file is not protected, and the file description page does not contain a request not to move it to Commons. 5: If the file is available on Commons under a different name than locally, all local references to the file must be updated to point to the title used at Commons. 6: For {{c-uploaded}} files: They may be speedily deleted as soon as they are off the Main Page',
		subgroup: {
			name: 'commons_filename',
			type: 'input',
			label: 'Filename on Commons: ',
			value: Morebits.pageNameNorm,
			tooltip: 'This can be left blank if the file has the same name on Commons as here. The "File:" prefix is optional.'
		},
		hideWhenMultiple: true
	},
	{
		label: 'F9: Unambiguous copyright infringement',
		value: 'imgcopyvio',
		tooltip: 'The file was copied from a website or other source that does not have a license compatible with Wikipedia, and the uploader neither claims fair use nor makes a credible assertion of permission of free use. Sources that do not have a license compatible with Wikipedia include stock photo libraries such as Getty Images or Corbis. Non-blatant copyright infringements should be discussed at Wikipedia:Files for deletion',
		subgroup: [
			{
				name: 'imgcopyvio_url',
				type: 'input',
				label: 'URL of the copyvio, including the "http://".  If the copyvio is of a non-internet source and you cannot provide a URL, you must use the deletion rationale box. ',
				size: 60
			},
			{
				name: 'imgcopyvio_rationale',
				type: 'input',
				label: 'Deletion rationale for non-internet copyvios: ',
				size: 60
			}
		]
	},
	{
		label: 'F10: Useless non-media file',
		value: 'badfiletype',
		tooltip: 'Files uploaded that are neither image, sound, nor video files (e.g. .doc, .pdf, or .xls files) which are not used in any article and have no foreseeable encyclopedic use'
	},
	{
		label: 'F11: No evidence of permission',
		value: 'nopermission',
		tooltip: 'If an uploader has specified a license and has named a third party as the source/copyright holder without providing evidence that this third party has in fact agreed, the item may be deleted seven days after notification of the uploader',
		hideWhenUser: true
	},
	{
		label: 'G8: File description page with no corresponding file',
		value: 'imagepage',
		tooltip: 'This is only for use when the file doesn\'t exist at all. Corrupt files, and local description pages for files on Commons, should use F2; implausible redirects should use R3; and broken Commons redirects should use R4.'
	}
];

Twinkle.speedy.articleList = [
	{
		label: 'A1: No context. Articles lacking sufficient context to identify the subject of the article.',
		value: 'nocontext',
		tooltip: 'Example: "He is a funny man with a red car. He makes people laugh." This applies only to very short articles. Context is different from content, treated in A3, below.'
	},
	{
		label: 'A2: Foreign language articles that exist on another Wikimedia project',
		value: 'foreign',
		tooltip: 'If the article in question does not exist on another project, the template {{notenglish}} should be used instead. All articles in a non-English language that do not meet this criteria (and do not meet any other criteria for speedy deletion) should be listed at Pages Needing Translation (PNT) for review and possible translation',
		subgroup: {
			name: 'foreign_source',
			type: 'input',
			label: 'Interwiki link to the article on the foreign-language wiki: ',
			tooltip: 'For example, fr:Bonjour'
		}
	},
	{
		label: 'A3: No content whatsoever',
		value: 'nocontent',
		tooltip: 'Any article consisting only of links elsewhere (including hyperlinks, category tags and "see also" sections), a rephrasing of the title, and/or attempts to correspond with the person or group named by its title. This does not include disambiguation pages'
	},
	{
		label: 'A5: Transwikied articles',
		value: 'transwiki',
		tooltip: 'Any article that has been discussed at Articles for Deletion (et al), where the outcome was to transwiki, and where the transwikification has been properly performed and the author information recorded. Alternately, any article that consists of only a dictionary definition, where the transwikification has been properly performed and the author information recorded',
		subgroup: {
			name: 'transwiki_location',
			type: 'input',
			label: 'Link to where the page has been transwikied: ',
			tooltip: 'For example, https://en.wiktionary.org/wiki/twinkle or [[wikt:twinkle]]'
		}
	},
	{
		label: 'A7: No indication of importance (people, groups, companies, web content, individual animals, or organized events)',
		value: 'a7',
		tooltip: 'An article about a real person, group of people, band, club, company, web content, individual animal, tour, or party that does not assert the importance or significance of its subject. If controversial, or if a previous AfD has resulted in the article being kept, the article should be nominated for AfD instead',
		hideWhenSingle: true
	},
	{
		label: 'A7: No indication of importance (person)',
		value: 'person',
		tooltip: 'An article about a real person that does not assert the importance or significance of its subject. If controversial, or if there has been a previous AfD that resulted in the article being kept, the article should be nominated for AfD instead',
		hideWhenMultiple: true
	},
	{
		label: 'A7: No indication of importance (musician(s) or band)',
		value: 'band',
		tooltip: 'Article about a band, singer, musician, or musical ensemble that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: No indication of importance (club, society or group)',
		value: 'club',
		tooltip: 'Article about a club, society or group that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: No indication of importance (company or organization)',
		value: 'corp',
		tooltip: 'Article about a company or organization that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: No indication of importance (website or web content)',
		value: 'web',
		tooltip: 'Article about a web site, blog, online forum, webcomic, podcast, or similar web content that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: No indication of importance (individual animal)',
		value: 'animal',
		tooltip: 'Article about an individual animal (e.g. pet) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: No indication of importance (organized event)',
		value: 'event',
		tooltip: 'Article about an organized event (tour, function, meeting, party, etc.) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'A9: Unremarkable musical recording where artist\'s article doesn\'t exist',
		value: 'a9',
		tooltip: 'An article about a musical recording which does not indicate why its subject is important or significant, and where the artist\'s article has never existed or has been deleted'
	},
	{
		label: 'A10: Recently created article that duplicates an existing topic',
		value: 'a10',
		tooltip: 'A recently created article with no relevant page history that does not aim to expand upon, detail or improve information within any existing article(s) on the subject, and where the title is not a plausible redirect. This does not include content forks, split pages or any article that aims at expanding or detailing an existing one.',
		subgroup: {
			name: 'a10_article',
			type: 'input',
			label: 'Article that is duplicated: '
		}
	},
	{
		label: 'A11: Obviously made up by creator, and no claim of significance',
		value: 'madeup',
		tooltip: 'An article which plainly indicates that the subject was invented/coined/discovered by the article\'s creator or someone they know personally, and does not credibly indicate why its subject is important or significant'
	}
];

Twinkle.speedy.categoryList = [
	{
		label: 'C1: Empty categories',
		value: 'catempty',
		tooltip: 'Categories that have been unpopulated for at least seven days. This does not apply to categories being discussed at WP:CFD, disambiguation categories, and certain other exceptions. If the category isn\'t relatively new, it possibly contained articles earlier, and deeper investigation is needed'
	},
	{
		label: 'G8: Categories populated by a deleted or retargeted template',
		value: 'templatecat',
		tooltip: 'This is for situations where a category is effectively empty, because the template(s) that formerly placed pages in that category are now deleted. This excludes categories that are still in use.',
		subgroup: {
			name: 'templatecat_rationale',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60
		}
	},
	{
		label: 'G8: Redirects to non-existent targets',
		value: 'redirnone',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true
	}
];

Twinkle.speedy.userList = [
	{
		label: 'U1: User request',
		value: 'userreq',
		tooltip: 'Personal subpages, upon request by their user. In some rare cases there may be administrative need to retain the page. Also, sometimes, main user pages may be deleted as well. See Wikipedia:User page for full instructions and guidelines',
		subgroup: mw.config.get('wgNamespaceNumber') === 3 && mw.config.get('wgTitle').indexOf('/') === -1 ? {
			name: 'userreq_rationale',
			type: 'input',
			label: 'A mandatory rationale to explain why this user talk page should be deleted: ',
			tooltip: 'User talk pages are deleted only in highly exceptional circumstances. See WP:DELTALK.',
			size: 60
		} : null,
		hideSubgroupWhenMultiple: true
	},
	{
		label: 'U2: Nonexistent user',
		value: 'nouser',
		tooltip: 'User pages of users that do not exist (Check Special:Listusers)'
	},
	{
		label: 'U3: Non-free galleries',
		value: 'gallery',
		tooltip: 'Galleries in the userspace which consist mostly of "fair use" or non-free files. Wikipedia\'s non-free content policy forbids users from displaying non-free files, even ones they have uploaded themselves, in userspace. It is acceptable to have free files, GFDL-files, Creative Commons and similar licenses along with public domain material, but not "fair use" files',
		hideWhenRedirect: true
	},
	{
		label: 'U5: Blatant WP:NOTWEBHOST violations',
		value: 'notwebhost',
		tooltip: 'Pages in userspace consisting of writings, information, discussions, and/or activities not closely related to Wikipedia\'s goals, where the owner has made few or no edits outside of userspace, with the exception of plausible drafts and pages adhering to WP:UPYES.',
		hideWhenRedirect: true
	},
	{
		label: 'G11: Promotional user page under a promotional user name',
		value: 'spamuser',
		tooltip: 'A promotional user page, with a username that promotes or implies affiliation with the thing being promoted. Note that simply having a page on a company or product in one\'s userspace does not qualify it for deletion. If a user page is spammy but the username is not, then consider tagging with regular G11 instead.',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	},
	{
		label: 'G13: AfC draft submission or a blank draft, stale by over 6 months',
		value: 'afc',
		tooltip: 'Any rejected or unsubmitted AfC draft submission or a blank draft, that has not been edited in over 6 months (excluding bot edits).',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	}
];

Twinkle.speedy.templateList = [
	{
		label: 'T3: Duplicate templates or hardcoded instances',
		value: 'duplicatetemplate',
		tooltip: 'Templates that are either substantial duplications of another template or hardcoded instances of another template where the same functionality could be provided by that other template',
		subgroup: {
			name: 'duplicatetemplate_2',
			type: 'input',
			label: 'Template this is redundant to: ',
			tooltip: 'The "Template:" prefix is not needed.'
		},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.portalList = [
	{
		label: 'P1: Portal that would be subject to speedy deletion if it were an article',
		value: 'p1',
		tooltip: 'You must specify a single article criterion that applies in this case (A1, A3, A7, or A10).',
		subgroup: {
			name: 'p1_criterion',
			type: 'input',
			label: 'Article criterion that would apply: '
		}
	},
	{
		label: 'P2: Underpopulated portal (fewer than three non-stub articles)',
		value: 'emptyportal',
		tooltip: 'Any Portal based on a topic for which there is not a non-stub header article, and at least three non-stub articles detailing subject matter that would be appropriate to discuss under the title of that Portal'
	}
];

Twinkle.speedy.generalList = [
	{
		label: 'G1: Patent nonsense. Pages consisting purely of incoherent text or gibberish with no meaningful content or history.',
		value: 'nonsense',
		tooltip: 'This does not include poor writing, partisan screeds, obscene remarks, vandalism, fictional material, material not in English, poorly translated material, implausible theories, or hoaxes. In short, if you can understand it, G1 does not apply.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		label: 'G2: Test page',
		value: 'test',
		tooltip: 'A page created to test editing or other Wikipedia functions. Pages in the User namespace are not included, nor are valid but unused or duplicate templates (although criterion T3 may apply).',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		label: 'G3: Pure vandalism',
		value: 'vandalism',
		tooltip: 'Plain pure vandalism (including redirects left behind from pagemove vandalism)'
	},
	{
		label: 'G3: Blatant hoax',
		value: 'hoax',
		tooltip: 'Blatant and obvious hoax, to the point of vandalism',
		hideWhenMultiple: true
	},
	{
		label: 'G4: Recreation of material deleted via a deletion discussion',
		value: 'repost',
		tooltip: 'A copy, by any title, of a page that was deleted via an XfD process or Deletion review, provided that the copy is substantially identical to the deleted version. This clause does not apply to content that has been "userfied", to content undeleted as a result of Deletion review, or if the prior deletions were proposed or speedy deletions, although in this last case, other speedy deletion criteria may still apply',
		subgroup: {
			name: 'repost_xfd',
			type: 'input',
			label: 'Page where the deletion discussion took place: ',
			tooltip: 'Must start with "Wikipedia:"',
			size: 60
		}
	},
	{
		label: 'G5: Created by a banned or blocked user',
		value: 'banned',
		tooltip: 'Pages created by banned or blocked users in violation of their ban or block, and which have no substantial edits by others',
		subgroup: {
			name: 'banned_user',
			type: 'input',
			label: 'Username of banned user (if available): ',
			tooltip: 'Should not start with "User:"'
		}
	},
	{
		label: 'G6: Move',
		value: 'move',
		tooltip: 'Making way for an uncontroversial move like reversing a redirect',
		subgroup: [
			{
				name: 'move_page',
				type: 'input',
				label: 'Page to be moved here: '
			},
			{
				name: 'move_reason',
				type: 'input',
				label: 'Reason: ',
				size: 60
			}
		],
		hideWhenMultiple: true
	},
	{
		label: 'G6: XfD',
		value: 'xfd',
		tooltip: 'A deletion discussion (at AfD, FfD, RfD, TfD, CfD, or MfD) was closed as "delete", but the page wasn\'t actually deleted.',
		subgroup: {
			name: 'xfd_fullvotepage',
			type: 'input',
			label: 'Page where the deletion discussion was held: ',
			tooltip: 'Must start with "Wikipedia:"',
			size: 40
		},
		hideWhenMultiple: true
	},
	{
		label: 'G6: Copy-and-paste page move',
		value: 'copypaste',
		tooltip: 'This only applies for a copy-and-paste page move of another page that needs to be temporarily deleted to make room for a clean page move.',
		subgroup: {
			name: 'copypaste_sourcepage',
			type: 'input',
			label: 'Original page that was copy-pasted here: '
		},
		hideWhenMultiple: true
	},
	{
		label: 'G6: Housekeeping and non-controversial cleanup',
		value: 'g6',
		tooltip: 'Other routine maintenance tasks',
		subgroup: {
			name: 'g6_rationale',
			type: 'input',
			label: 'Rationale: ',
			size: 60
		}
	},
	{
		label: 'G7: Author requests deletion, or author blanked',
		value: 'author',
		tooltip: 'Any page for which deletion is requested by the original author in good faith, provided the page\'s only substantial content was added by its author. If the author blanks the page, this can also be taken as a deletion request.',
		subgroup: {
			name: 'author_rationale',
			type: 'input',
			label: 'Optional explanation: ',
			tooltip: 'Perhaps linking to where the author requested this deletion.',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		label: 'G8: Pages dependent on a non-existent or deleted page',
		value: 'g8',
		tooltip: 'such as talk pages with no corresponding subject page; subpages with no parent page; file pages without a corresponding file; redirects to non-existent targets; or categories populated by deleted or retargeted templates. This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		subgroup: {
			name: 'g8_rationale',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		label: 'G8: Subpages with no parent page',
		value: 'subpage',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true,
		hideInNamespaces: [ 0, 6, 8 ]  // hide in main, file, and mediawiki-spaces
	},
	{
		label: 'G10: Attack page',
		value: 'attack',
		tooltip: 'Pages that serve no purpose but to disparage or threaten their subject or some other entity (e.g., "John Q. Doe is an imbecile"). This includes a biography of a living person that is negative in tone and unsourced, where there is no NPOV version in the history to revert to. Administrators deleting such pages should not quote the content of the page in the deletion summary!'
	},
	{
		label: 'G10: Wholly negative, unsourced BLP',
		value: 'negublp',
		tooltip: 'A biography of a living person that is entirely negative in tone and unsourced, where there is no neutral version in the history to revert to.',
		hideWhenMultiple: true
	},
	{
		label: 'G11: Unambiguous advertising or promotion',
		value: 'spam',
		tooltip: 'Pages which exclusively promote a company, product, group, service, or person and which would need to be fundamentally rewritten in order to become encyclopedic. Note that an article about a company or a product which describes its subject from a neutral point of view does not qualify for this criterion; an article that is blatant advertising should have inappropriate content as well'
	},
	{
		label: 'G12: Unambiguous copyright infringement',
		value: 'copyvio',
		tooltip: 'Either: (1) Material was copied from another website that does not have a license compatible with Wikipedia, or is photography from a stock photo seller (such as Getty Images or Corbis) or other commercial content provider; (2) There is no non-infringing content in the page history worth saving; or (3) The infringement was introduced at once by a single person rather than created organically on wiki and then copied by another website such as one of the many Wikipedia mirrors',
		subgroup: [
			{
				name: 'copyvio_url',
				type: 'input',
				label: 'URL (if available): ',
				tooltip: 'If the material was copied from an online source, put the URL here, including the "http://" or "https://" protocol.',
				size: 60
			},
			{
				name: 'copyvio_url2',
				type: 'input',
				label: 'Additional URL: ',
				tooltip: 'Optional. Should begin with "http://" or "https://"',
				size: 60
			},
			{
				name: 'copyvio_url3',
				type: 'input',
				label: 'Additional URL: ',
				tooltip: 'Optional. Should begin with "http://" or "https://"',
				size: 60
			}
		]
	},
	{
		label: 'G13: Page in draft namespace or userspace AfC submission, stale by over 6 months',
		value: 'afc',
		tooltip: 'Any rejected or unsubmitted AfC submission in userspace or any non-redirect page in draft namespace, that has not been edited for more than 6 months. Blank drafts in either namespace are also included.',
		hideWhenRedirect: true,
		showInNamespaces: [2, 118]  // user, draft namespaces only
	},
	{
		label: 'G14: Unnecessary disambiguation page',
		value: 'disambig',
		tooltip: 'This only applies for orphaned disambiguation pages which either: (1) disambiguate only one existing Wikipedia page and whose title ends in "(disambiguation)" (i.e., there is a primary topic); or (2) disambiguate no (zero) existing Wikipedia pages, regardless of its title.  It also applies to orphan "Foo (disambiguation)" redirects that target pages that are not disambiguation or similar disambiguation-like pages (such as set index articles or lists)'
	}
];

Twinkle.speedy.redirectList = [
	{
		label: 'R2: Redirect from mainspace to any other namespace except the Category:, Template:, Wikipedia:, Help: and Portal: namespaces',
		value: 'rediruser',
		tooltip: 'This does not include the pseudo-namespace shortcuts. If this was the result of a page move, consider waiting a day or two before deleting the redirect',
		showInNamespaces: [ 0 ]
	},
	{
		label: 'R3: Recently created redirect from an implausible typo or misnomer',
		value: 'redirtypo',
		tooltip: 'However, redirects from common misspellings or misnomers are generally useful, as are redirects in other languages'
	},
	{
		label: 'R4: File namespace redirect with a name that matches a Commons page',
		value: 'redircom',
		tooltip: 'The redirect should have no incoming links (unless the links are cleary intended for the file or redirect at Commons).',
		showInNamespaces: [ 6 ]
	},
	{
		label: 'G6: Redirect to malplaced disambiguation page',
		value: 'movedab',
		tooltip: 'This only applies for redirects to disambiguation pages ending in (disambiguation) where a primary topic does not exist.',
		hideWhenMultiple: true
	},
	{
		label: 'G8: Redirects to non-existent targets',
		value: 'redirnone',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true
	}
];

Twinkle.speedy.normalizeHash = {
	'reason': 'db',
	'nonsense': 'g1',
	'test': 'g2',
	'vandalism': 'g3',
	'hoax': 'g3',
	'repost': 'g4',
	'banned': 'g5',
	'move': 'g6',
	'xfd': 'g6',
	'movedab': 'g6',
	'copypaste': 'g6',
	'g6': 'g6',
	'author': 'g7',
	'g8': 'g8',
	'talk': 'g8',
	'subpage': 'g8',
	'redirnone': 'g8',
	'templatecat': 'g8',
	'imagepage': 'g8',
	'attack': 'g10',
	'negublp': 'g10',
	'spam': 'g11',
	'spamuser': 'g11',
	'copyvio': 'g12',
	'afc': 'g13',
	'disambig': 'g14',
	'nocontext': 'a1',
	'foreign': 'a2',
	'nocontent': 'a3',
	'transwiki': 'a5',
	'a7': 'a7',
	'person': 'a7',
	'corp': 'a7',
	'web': 'a7',
	'band': 'a7',
	'club': 'a7',
	'animal': 'a7',
	'event': 'a7',
	'a9': 'a9',
	'a10': 'a10',
	'madeup': 'a11',
	'rediruser': 'r2',
	'redirtypo': 'r3',
	'redircom': 'r4',
	'redundantimage': 'f1',
	'noimage': 'f2',
	'fpcfail': 'f2',
	'noncom': 'f3',
	'unksource': 'f4',
	'unfree': 'f5',
	'f5': 'f5',
	'norat': 'f6',
	'badfairuse': 'f7',
	'commons': 'f8',
	'imgcopyvio': 'f9',
	'badfiletype': 'f10',
	'nopermission': 'f11',
	'catempty': 'c1',
	'userreq': 'u1',
	'nouser': 'u2',
	'gallery': 'u3',
	'notwebhost': 'u5',
	'duplicatetemplate': 't3',
	'p1': 'p1',
	'emptyportal': 'p2'
};

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		var code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = '{{db-multiple';
			params.utparams = {};
			$.each(params.normalizeds, function(index, norm) {
				code += '|' + norm.toUpperCase();
				parameters = params.templateParams[index] || [];
				for (var i in parameters) {
					if (typeof parameters[i] === 'string' && !parseInt(i, 10)) {  // skip numeric parameters - {{db-multiple}} doesn't understand them
						code += '|' + i + '=' + parameters[i];
					}
				}
				$.extend(params.utparams, Twinkle.speedy.getUserTalkParameters(norm, parameters));
			});
			code += '}}';
		} else {
			parameters = params.templateParams[0] || [];
			code = '{{db-' + params.values[0];
			for (i in parameters) {
				if (typeof parameters[i] === 'string') {
					code += '|' + i + '=' + parameters[i];
				}
			}
			if (params.usertalk) {
				code += '|help=off';
			}
			code += '}}';
			params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalizeds[0], parameters);
		}

		return [code, params.utparams];
	},

	parseWikitext: function(wikitext, callback) {
		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',
			text: wikitext,
			contentmodel: 'wikitext',
			title: mw.config.get('wgPageName')
		};

		var statusIndicator = new Morebits.status('Building deletion summary');
		var api = new Morebits.wiki.api('Parsing deletion template', query, function(apiObj) {
			var reason = decodeURIComponent($(apiObj.getXML().querySelector('text').childNodes[0].nodeValue).find('#delete-reason').text()).replace(/\+/g, ' ');
			if (!reason) {
				statusIndicator.warn('Unable to generate summary from deletion template');
			} else {
				statusIndicator.info('complete');
			}
			callback(reason);
		}, statusIndicator);
		api.post();
	},

	noteToCreator: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// disallow notifying yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			Morebits.status.warn('You (' + initialContrib + ') created this page; skipping user notification');
			initialContrib = null;

		// don't notify users when their user talk page is nominated/deleted
		} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
			Morebits.status.warn('Notifying initial contributor: this user created their own user talk page; skipping notification');
			initialContrib = null;

		// quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
		} else if ((initialContrib === 'Cyberbot I' || initialContrib === 'SoxBot') && params.normalizeds[0] === 'f2') {
			Morebits.status.warn('Notifying initial contributor: page created procedurally by bot; skipping notification');
			initialContrib = null;

		// Check for already existing tags
		} else if (Twinkle.speedy.hasCSD && params.warnUser && !confirm('The page is has a deletion-related tag, and thus the creator has likely been notified.  Do you want to notify them for this deletion as well?')) {
			Morebits.status.info('Notifying initial contributor', 'canceled by user; skipping notification.');
			initialContrib = null;
		}

		if (initialContrib) {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')'),
				notifytext, i, editsummary;

			// special cases: "db" and "db-multiple"
			if (params.normalizeds.length > 1) {
				notifytext = '\n{{subst:db-' + (params.warnUser ? 'deleted' : 'notice') + '-multiple|1=' + Morebits.pageNameNorm;
				var count = 2;
				$.each(params.normalizeds, function(index, norm) {
					notifytext += '|' + count++ + '=' + norm.toUpperCase();
				});
			} else if (params.normalizeds[0] === 'db') {
				notifytext = '\n{{subst:db-reason-' + (params.warnUser ? 'deleted' : 'notice') + '|1=' + Morebits.pageNameNorm;
			} else {
				notifytext = '\n{{subst:db-csd-' + (params.warnUser ? 'deleted' : 'notice') + '-custom|1=';
				if (params.values[0] === 'copypaste') {
					notifytext += params.templateParams[0].sourcepage;
				} else {
					notifytext += Morebits.pageNameNorm;
				}
				notifytext += '|2=' + params.values[0];
			}

			for (i in params.utparams) {
				if (typeof params.utparams[i] === 'string') {
					notifytext += '|' + i + '=' + params.utparams[i];
				}
			}
			notifytext += (params.welcomeuser ? '' : '|nowelcome=yes') + '}} ~~~~';

			editsummary = 'Notification: speedy deletion' + (params.warnUser ? '' : ' nomination');
			if (params.normalizeds.indexOf('g10') === -1) {  // no article name in summary for G10 taggings
				editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			} else {
				editsummary += ' of an attack page.';
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(editsummary);
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(function onNotifySuccess() {
				// add this nomination to the user's userspace log, if the user has enabled it
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
				}
			}, function onNotifyError() {
				// if user could not be notified, log nomination without mentioning that notification was sent
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, null);
				}
			});
		} else if (params.lognomination) {
			// log nomination even if the user notification wasn't sent
			Twinkle.speedy.callbacks.user.addToLog(params, null);
		}
	},

	sysop: {
		main: function(params) {
			var reason;
			if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
				reason = prompt('Enter the deletion summary to use, which will be entered into the deletion log:', '');
				Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
			} else {
				var code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(code, function(reason) {
					if (params.promptForSummary) {
						reason = prompt('Enter the deletion summary to use, or press OK to accept the automatically generated one.', reason);
					}
					Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
				});
			}
		},
		deletePage: function(reason, params) {
			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Deleting page');

			if (reason === null) {
				return Morebits.status.error('Asking for reason', 'User cancelled');
			} else if (!reason || !reason.replace(/^\s*/, '').replace(/\s*$/, '')) {
				return Morebits.status.error('Asking for reason', "you didn't give one.  I don't know... what with admins and their apathetic antics... I give up...");
			}

			var deleteMain = function(callback) {
				thispage.setEditSummary(reason);
				thispage.setChangeTags(Twinkle.changeTags);
				thispage.setWatchlist(params.watch);
				thispage.deletePage(function() {
					thispage.getStatusElement().info('done');
					typeof callback === 'function' && callback();
					Twinkle.speedy.callbacks.sysop.deleteTalk(params);
				});
			};

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if (params.warnUser) {
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(function(pageobj) {
					deleteMain(function() {
						Twinkle.speedy.callbacks.noteToCreator(pageobj);
					});
				});
			} else {
				deleteMain();
			}
		},
		deleteTalk: function(params) {
			// delete talk page
			if (params.deleteTalkPage &&
					params.normalized !== 'f8' &&
					document.getElementById('ca-talk').className !== 'new') {
				var talkpage = new Morebits.wiki.page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), 'Deleting talk page');
				talkpage.setEditSummary('[[WP:CSD#G8|G8]]: Talk page of deleted page "' + Morebits.pageNameNorm + '"');
				talkpage.setChangeTags(Twinkle.changeTags);
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(function() {
					Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
				}, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
			}
		},
		deleteRedirects: function(params) {
			// delete redirects
			if (params.deleteRedirects) {
				var query = {
					'action': 'query',
					'titles': mw.config.get('wgPageName'),
					'prop': 'redirects',
					'rdlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
				};
				var wikipedia_api = new Morebits.wiki.api('getting list of redirects...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.status('Deleting redirects'));
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// promote Unlink tool
			var $link, $bigtext;
			if (mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'f8') {
				$link = $('<a/>', {
					'href': '#',
					'text': 'click here to go to the Unlink tool',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing usages of and/or links to deleted file ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					'text': 'To orphan backlinks and remove instances of file usage',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f8') {
				$link = $('<a/>', {
					'href': '#',
					'text': 'click here to go to the Unlink tool',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing links to deleted page ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					'text': 'To orphan backlinks',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}
		},
		deleteRedirectsMain: function(apiobj) {
			var xmlDoc = apiobj.getXML();
			var $snapshot = $(xmlDoc).find('redirects rd');
			var total = $snapshot.length;
			var statusIndicator = apiobj.statelem;

			if (!total) {
				statusIndicator.status('no redirects found');
				return;
			}

			statusIndicator.status('0%');

			var current = 0;
			var onsuccess = function(apiobjInner) {
				var now = parseInt(100 * ++current / total, 10) + '%';
				statusIndicator.update(now);
				apiobjInner.statelem.unlink();
				if (current >= total) {
					statusIndicator.info(now + ' (completed)');
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			$snapshot.each(function(key, value) {
				var title = $(value).attr('title');
				var page = new Morebits.wiki.page(title, 'Deleting redirect "' + title + '"');
				page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page "' + Morebits.pageNameNorm + '"');
				page.setChangeTags(Twinkle.changeTags);
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			// defaults to /doc for lua modules, which may not exist
			if (!pageobj.exists() && mw.config.get('wgPageContentModel') !== 'Scribunto') {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			statelem.status('Checking for tags on the page...');

			// check for existing deletion tags
			var tag = /(?:\{\{\s*(db|delete|db-.*?|speedy deletion-.*?)(?:\s*\||\s*\}\}))/.exec(text);
			// This won't make use of the db-multiple template but it probably should
			if (tag && !confirm('The page already has the CSD-related template {{' + tag[1] + '}} on it.  Do you want to add another CSD template?')) {
				return;
			}

			var xfd = /\{\{((?:article for deletion|proposed deletion|prod blp|template for discussion)\/dated|[cfm]fd\b)/i.exec(text) || /#invoke:(RfD)/.exec(text);
			if (xfd && !confirm('The deletion-related template {{' + xfd[1] + '}} was found on the page. Do you still want to add a CSD template?')) {
				return;
			}

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			var buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0];
			params.utparams = buildData[1];

			// curate/patrol the page
			if (Twinkle.getPref('markSpeedyPagesAsPatrolled')) {
				pageobj.triage();
			}

			// Wrap SD template in noinclude tags if we are in template space.
			// Won't work with userboxes in userspace, or any other transcluded page outside template space
			if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
				code = '<noinclude>' + code + '</noinclude>';
			}

			// Remove tags that become superfluous with this action
			text = text.replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
			if (mw.config.get('wgNamespaceNumber') === 6) {
				// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
				text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
			}

			if (params.requestsalt) {
				if (params.normalizeds.indexOf('g10') === -1) {
					code = code + '\n{{salt}}';
				} else {
					code = '{{salt}}\n' + code;
				}
			}

			// Generate edit summary for edit
			var editsummary;
			if (params.normalizeds.length > 1) {
				editsummary = 'Requesting speedy deletion (';
				$.each(params.normalizeds, function(index, norm) {
					editsummary += '[[WP:CSD#' + norm.toUpperCase() + '|CSD ' + norm.toUpperCase() + ']], ';
				});
				editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
				editsummary += ').';
			} else if (params.normalizeds[0] === 'db') {
				editsummary = 'Requesting [[WP:CSD|speedy deletion]] with rationale "' + params.templateParams[0]['1'] + '".';
			} else {
				editsummary = 'Requesting speedy deletion ([[WP:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']]).';
			}

			// Set the correct value for |ts= parameter in {{db-g13}}
			if (params.normalizeds.indexOf('g13') !== -1) {
				code = code.replace('$TIMESTAMP', pageobj.getLastEditTime());
			}


			// Blank attack pages
			if (params.normalizeds.indexOf('g10') !== -1) {
				text = code;
			} else {
				// Insert tag after short description or any hatnotes
				var wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
			}


			pageobj.setPageText(text);
			pageobj.setEditSummary(editsummary);
			pageobj.setWatchlist(params.watch);
			if (params.scribunto) {
				pageobj.setCreateOption('recreate'); // Module /doc might not exist
				if (params.watch) {
					// Watch module in addition to /doc subpage
					var watch_query = {
						action: 'watch',
						titles: mw.config.get('wgPageName'),
						token: mw.user.tokens.get('watchToken')
					};
					new Morebits.wiki.api('Adding Module to watchlist', watch_query).post();
				}
			}
			pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
		},

		tagComplete: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			// Notification to first contributor, will also log nomination to the user's userspace log
			if (params.usertalk) {
				var thispage = new Morebits.wiki.page(Morebits.pageNameNorm);
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(Twinkle.speedy.callbacks.noteToCreator);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},

		// note: this code is also invoked from twinkleimage
		// the params used are:
		//   for CSD: params.values, params.normalizeds  (note: normalizeds is an array)
		//   for DI: params.fromDI = true, params.templatename, params.normalized  (note: normalized is a string)
		addToLog: function(params, initialContrib) {
			var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
			usl.initialText =
				"This is a log of all [[WP:CSD|speedy deletion]] nominations made by this user using [[WP:TW|Twinkle]]'s CSD module.\n\n" +
				'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
				'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
				(Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');

			var formatParamLog = function(normalize, csdparam, input) {
				if ((normalize === 'G4' && csdparam === 'xfd') ||
					(normalize === 'G6' && csdparam === 'page') ||
					(normalize === 'G6' && csdparam === 'fullvotepage') ||
					(normalize === 'G6' && csdparam === 'sourcepage') ||
					(normalize === 'A2' && csdparam === 'source') ||
					(normalize === 'A10' && csdparam === 'article') ||
					(normalize === 'F1' && csdparam === 'filename') ||
					(normalize === 'F5' && csdparam === 'replacement')) {
					input = '[[:' + input + ']]';
				} else if (normalize === 'G5' && csdparam === 'user') {
					input = '[[:User:' + input + ']]';
				} else if (normalize === 'G12' && csdparam.lastIndexOf('url', 0) === 0 && input.lastIndexOf('http', 0) === 0) {
					input = '[' + input + ' ' + input + ']';
				} else if (normalize === 'T3' && csdparam === 'template') {
					input = '[[:Template:' + input + ']]';
				} else if (normalize === 'F8' && csdparam === 'filename') {
					input = '[[commons:' + input + ']]';
				} else if (normalize === 'P1' && csdparam === 'criterion') {
					input = '[[WP:CSD#' + input + ']]';
				}
				return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
			};

			var extraInfo = '';

			// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
			var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';

			var editsummary = 'Logging speedy deletion nomination';
			var appendText = '# [[:' + Morebits.pageNameNorm;

			if (params.fromDI) {
				appendText += ']]' + fileLogLink + ': DI [[WP:CSD#' + params.normalized.toUpperCase() + '|CSD ' + params.normalized.toUpperCase() + ']] ({{tl|di-' + params.templatename + '}})';
				// The params data structure when coming from DI is quite different,
				// so this hardcodes the only interesting items worth logging
				['reason', 'replacement', 'source'].forEach(function(item) {
					if (params[item]) {
						extraInfo += formatParamLog(params.normalized.toUpperCase(), item, params[item]);
						return false;
					}
				});
				editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			} else {
				if (params.normalizeds.indexOf('g10') === -1) {  // no article name in log for G10 taggings
					appendText += ']]' + fileLogLink + ': ';
					editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
				} else {
					appendText += '|This]] attack page' + fileLogLink + ': ';
					editsummary += ' of an attack page.';
				}
				if (params.normalizeds.length > 1) {
					appendText += 'multiple criteria (';
					$.each(params.normalizeds, function(index, norm) {
						appendText += '[[WP:CSD#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']], ';
					});
					appendText = appendText.substr(0, appendText.length - 2);  // remove trailing comma
					appendText += ')';
				} else if (params.normalizeds[0] === 'db') {
					appendText += '{{tl|db-reason}}';
				} else {
					appendText += '[[WP:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']] ({{tl|db-' + params.values[0] + '}})';
				}

				// If params is "empty" it will still be full of empty arrays, but ask anyway
				if (params.templateParams) {
					// Treat custom rationale individually
					if (params.normalizeds[0] && params.normalizeds[0] === 'db') {
						extraInfo += formatParamLog('Custom', 'rationale', params.templateParams[0]['1']);
					} else {
						params.templateParams.forEach(function(item, index) {
							var keys = Object.keys(item);
							if (keys[0] !== undefined && keys[0].length > 0) {
								// Second loop required since some items (G12, F9) may have multiple keys
								keys.forEach(function(key, keyIndex) {
									if (keys[keyIndex] === 'blanked' || keys[keyIndex] === 'ts') {
										return true; // Not worth logging
									}
									extraInfo += formatParamLog(params.normalizeds[index].toUpperCase(), keys[keyIndex], item[key]);
								});
							}
						});
					}
				}
			}

			if (params.requestsalt) {
				appendText += '; requested creation protection ([[WP:SALT|salting]])';
			}
			if (extraInfo) {
				appendText += '; additional information:' + extraInfo;
			}
			if (initialContrib) {
				appendText += '; notified {{user|1=' + initialContrib + '}}';
			}
			appendText += ' ~~~~~\n';

			usl.changeTags = Twinkle.changeTags;
			usl.log(appendText, editsummary);
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	var parameters = [];

	$.each(values, function(index, value) {
		var currentParams = [];
		switch (value) {
			case 'reason':
				if (form['csd.reason_1']) {
					var dbrationale = form['csd.reason_1'].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert('Custom rationale:  Please specify a rationale.');
						parameters = null;
						return false;
					}
					currentParams['1'] = dbrationale;
				}
				break;

			case 'userreq':  // U1
				if (form['csd.userreq_rationale']) {
					var u1rationale = form['csd.userreq_rationale'].value;
					if (mw.config.get('wgNamespaceNumber') === 3 && !(/\//).test(mw.config.get('wgTitle')) &&
							(!u1rationale || !u1rationale.trim())) {
						alert('CSD U1:  Please specify a rationale when nominating user talk pages.');
						parameters = null;
						return false;
					}
					currentParams.rationale = u1rationale;
				}
				break;

			case 'repost':  // G4
				if (form['csd.repost_xfd']) {
					var deldisc = form['csd.repost_xfd'].value;
					if (deldisc) {
						if (!/^(?:wp|wikipedia):/i.test(deldisc)) {
							alert('CSD G4:  The deletion discussion page name, if provided, must start with "Wikipedia:".');
							parameters = null;
							return false;
						}
						currentParams.xfd = deldisc;
					}
				}
				break;

			case 'banned':  // G5
				if (form['csd.banned_user'] && form['csd.banned_user'].value) {
					currentParams.user = form['csd.banned_user'].value.replace(/^\s*User:/i, '');
				}
				break;

			case 'move':  // G6
				if (form['csd.move_page'] && form['csd.move_reason']) {
					var movepage = form['csd.move_page'].value,
						movereason = form['csd.move_reason'].value;
					if (!movepage || !movepage.trim()) {
						alert('CSD G6 (move):  Please specify the page to be moved here.');
						parameters = null;
						return false;
					}
					if (!movereason || !movereason.trim()) {
						alert('CSD G6 (move):  Please specify the reason for the move.');
						parameters = null;
						return false;
					}
					currentParams.page = movepage;
					currentParams.reason = movereason;
				}
				break;

			case 'xfd':  // G6
				if (form['csd.xfd_fullvotepage']) {
					var xfd = form['csd.xfd_fullvotepage'].value;
					if (xfd) {
						if (!/^(?:wp|wikipedia):/i.test(xfd)) {
							alert('CSD G6 (XFD):  The deletion discussion page name, if provided, must start with "Wikipedia:".');
							parameters = null;
							return false;
						}
						currentParams.fullvotepage = xfd;
					}
				}
				break;

			case 'copypaste':  // G6
				if (form['csd.copypaste_sourcepage']) {
					var copypaste = form['csd.copypaste_sourcepage'].value;
					if (!copypaste || !copypaste.trim()) {
						alert('CSD G6 (copypaste):  Please specify the source page name.');
						parameters = null;
						return false;
					}
					currentParams.sourcepage = copypaste;
				}
				break;

			case 'g6':  // G6
				if (form['csd.g6_rationale'] && form['csd.g6_rationale'].value) {
					currentParams.rationale = form['csd.g6_rationale'].value;
				}
				break;

			case 'author':  // G7
				if (form['csd.author_rationale'] && form['csd.author_rationale'].value) {
					currentParams.rationale = form['csd.author_rationale'].value;
				}
				break;

			case 'g8':  // G8
				if (form['csd.g8_rationale'] && form['csd.g8_rationale'].value) {
					currentParams.rationale = form['csd.g8_rationale'].value;
				}
				break;

			case 'templatecat':  // G8
				if (form['csd.templatecat_rationale'] && form['csd.templatecat_rationale'].value) {
					currentParams.rationale = form['csd.templatecat_rationale'].value;
				}
				break;

			case 'attack':  // G10
				currentParams.blanked = 'yes';
				// it is actually blanked elsewhere in code, but setting the flag here
				break;

			case 'copyvio':  // G12
				if (form['csd.copyvio_url'] && form['csd.copyvio_url'].value) {
					currentParams.url = form['csd.copyvio_url'].value;
				}
				if (form['csd.copyvio_url2'] && form['csd.copyvio_url2'].value) {
					currentParams.url2 = form['csd.copyvio_url2'].value;
				}
				if (form['csd.copyvio_url3'] && form['csd.copyvio_url3'].value) {
					currentParams.url3 = form['csd.copyvio_url3'].value;
				}
				break;

			case 'afc':  // G13
				currentParams.ts = '$TIMESTAMP'; // to be replaced by the last revision timestamp when page is saved
				break;

			case 'redundantimage':  // F1
				if (form['csd.redundantimage_filename']) {
					var redimage = form['csd.redundantimage_filename'].value;
					if (!redimage || !redimage.trim()) {
						alert('CSD F1:  Please specify the filename of the other file.');
						parameters = null;
						return false;
					}
					currentParams.filename = /^\s*(Image|File):/i.test(redimage) ? redimage : 'File:' + redimage;
				}
				break;

			case 'badfairuse':  // F7
				if (form['csd.badfairuse_rationale'] && form['csd.badfairuse_rationale'].value) {
					currentParams.rationale = form['csd.badfairuse_rationale'].value;
				}
				break;

			case 'commons':  // F8
				if (form['csd.commons_filename']) {
					var filename = form['csd.commons_filename'].value;
					if (filename && filename.trim() && filename !== Morebits.pageNameNorm) {
						currentParams.filename = /^\s*(Image|File):/i.test(filename) ? filename : 'File:' + filename;
					}
				}
				break;

			case 'imgcopyvio':  // F9
				if (form['csd.imgcopyvio_url'] && form['csd.imgcopyvio_rationale']) {
					var f9url = form['csd.imgcopyvio_url'].value;
					var f9rationale = form['csd.imgcopyvio_rationale'].value;
					if ((!f9url || !f9url.trim()) && (!f9rationale || !f9rationale.trim())) {
						alert('CSD F9: You must enter a url or reason (or both) when nominating a file under F9.');
						parameters = null;
						return false;
					}
					if (form['csd.imgcopyvio_url'].value) {
						currentParams.url = f9url;
					}
					if (form['csd.imgcopyvio_rationale'].value) {
						currentParams.rationale = f9rationale;
					}
				}
				break;

			case 'foreign':  // A2
				if (form['csd.foreign_source']) {
					var foreignlink = form['csd.foreign_source'].value;
					if (!foreignlink || !foreignlink.trim()) {
						alert('CSD A2:  Please specify an interwiki link to the article of which this is a copy.');
						parameters = null;
						return false;
					}
					currentParams.source = foreignlink;
				}
				break;

			case 'transwiki':  // A5
				if (form['csd.transwiki_location'] && form['csd.transwiki_location'].value) {
					currentParams.location = form['csd.transwiki_location'].value;
				}
				break;

			case 'a10':  // A10
				if (form['csd.a10_article']) {
					var duptitle = form['csd.a10_article'].value;
					if (!duptitle || !duptitle.trim()) {
						alert('CSD A10:  Please specify the name of the article which is duplicated.');
						parameters = null;
						return false;
					}
					currentParams.article = duptitle;
				}
				break;

			case 'duplicatetemplate':  // T3
				if (form['csd.duplicatetemplate_2']) {
					var t3template = form['csd.duplicatetemplate_2'].value;
					if (!t3template || !t3template.trim()) {
						alert('CSD T3:  Please specify the name of a template duplicated by this one.');
						parameters = null;
						return false;
					}
					currentParams.ts = '~~~~~';
					currentParams.template = t3template.replace(/^\s*Template:/i, '');
				}
				break;

			case 'p1':  // P1
				if (form['csd.p1_criterion']) {
					var criterion = form['csd.p1_criterion'].value;
					if (!criterion || !criterion.trim()) {
						alert('CSD P1:  Please specify a single criterion.');
						parameters = null;
						return false;
					}
					currentParams.criterion = criterion;
				}
				break;

			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

// Function for processing talk page notification template parameters
// key1/value1: for {{db-criterion-[notice|deleted]}} (via {{db-csd-[notice|deleted]-custom}})
// utparams.param: for {{db-[notice|deleted]-multiple}}
Twinkle.speedy.getUserTalkParameters = function twinklespeedyGetUserTalkParameters(normalized, parameters) {
	var utparams = [];

	// Special cases
	if (normalized === 'db') {
		utparams['2'] = parameters['1'];
	} else if (normalized === 'g6') {
		utparams.key1 = 'to';
		utparams.value1 = Morebits.pageNameNorm;
	} else if (normalized === 'g12') {
		['url', 'url2', 'url3'].forEach(function(item, idx) {
			if (parameters[item]) {
				idx++;
				utparams['key' + idx] = item;
				utparams['value' + idx] = utparams[item] = parameters[item];
			}
		});
	} else {
		// Handle the rest
		var param;
		switch (normalized) {
			case 'g4':
				param = 'xfd';
				break;
			case 'a2':
				param = 'source';
				break;
			case 'a5':
				param = 'location';
				break;
			case 'a10':
				param = 'article';
				break;
			case 'f9':
				param = 'url';
				break;
			case 'p1':
				param = 'criterion';
				break;
			default:
				break;
		}
		// No harm in providing a usertalk template with the others' parameters
		if (param && parameters[param]) {
			utparams.key1 = param;
			utparams.value1 = utparams[param] = parameters[param];
		}
	}
	return utparams;
};


Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert('Please select a criterion!');
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var tag_only = form.tag_only;
	if (tag_only && tag_only.checked) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
	var watchPage, promptForSummary;
	normalizeds.forEach(function(norm) {
		if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
			watchPage = true;
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').indexOf(norm) !== -1) {
			promptForSummary = true;
		}
	});

	var warnusertalk = false;
	if (form.warnusertalk.checked) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('warnUserOnSpeedyDelete').indexOf(norm) !== -1) {
				if (norm === 'g6' && values[index] !== 'copypaste') {
					return true;
				}
				warnusertalk = true;
				return false;  // break
			}
		});
	}

	var welcomeuser = false;
	if (warnusertalk) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1) {
				welcomeuser = true;
				return false;  // break
			}
		});
	}

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked,
		warnUser: warnusertalk,
		welcomeuser: welcomeuser,
		promptForSummary: promptForSummary,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Twinkle.speedy.callbacks.sysop.main(params);
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	// var multiple = form.multiple.checked;
	var normalizeds = [];
	$.each(values, function(index, value) {
		var norm = Twinkle.speedy.normalizeHash[value];

		normalizeds.push(norm);
	});

	// analyse each criterion to determine whether to watch the page/notify the creator
	var watchPage = false;
	$.each(normalizeds, function(index, norm) {
		if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
			watchPage = true;
			return false;  // break
		}
	});

	var notifyuser = false;
	if (form.notify.checked) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1) {
				if (norm === 'g6' && values[index] !== 'copypaste') {
					return true;
				}
				notifyuser = true;
				return false;  // break
			}
		});
	}

	var welcomeuser = false;
	if (notifyuser) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1) {
				welcomeuser = true;
				return false;  // break
			}
		});
	}

	var csdlog = false;
	if (Twinkle.getPref('logSpeedyNominations')) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1) {
				csdlog = true;
				return false;  // break
			}
		});
	}

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog,
		requestsalt: form.salting.checked,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete';

	// Modules can't be tagged, follow standard at TfD and place on /doc subpage
	params.scribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
	var wikipedia_page = params.scribunto ? new Morebits.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging module documentation page') : new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page');
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
})(jQuery);


// </nowiki>
