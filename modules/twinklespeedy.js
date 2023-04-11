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

	Twinkle.addPortletLink(Twinkle.speedy.callback, 'CSD', 'tw-csd', Morebits.userIsSysop ? 'Delete page according to COM:CSD' : 'Request speedy deletion according to COM:CSD');
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsSysop ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

// Used by unlink feature
Twinkle.speedy.dialog = null;
// Used throughout
Twinkle.speedy.hasCSD = !!$('#delete-reason').length;

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	Twinkle.speedy.dialog = new Morebits.simpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
	dialog = Twinkle.speedy.dialog;
	dialog.setTitle('Choose criteria for speedy deletion');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Speedy deletion policy', 'COM:CSD');
	dialog.addFooterLink('CSD prefs', 'Commons:Twinkle/Preferences#speedy');
	dialog.addFooterLink('Twinkle help', 'Commons:Twinkle/Documentation#speedy');
	dialog.addFooterLink('Give feedback', 'Commons talk:Twinkle');

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
						// cForm.salting.checked = false;

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
					event: function (event) {
						event.stopPropagation();
					}
				},
				{
					label: 'Delete under multiple criteria',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: 'When selected, you can select several criteria that apply to the page. For example, G11 and A7 are a common combination for articles.',
					event: function(event) {
						Twinkle.speedy.callback.modeChanged(event.target.form);
						event.stopPropagation();
					}
				},
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
			},
			// {
			// 	label: 'Tag for creation protection (salting) as well',
			// 	value: 'salting',
			// 	name: 'salting',
			// 	tooltip: 'When selected, the speedy deletion tag will be accompanied by a {{salt}} tag requesting that the deleting administrator apply creation protection. Only select if this page has been repeatedly recreated.',
			// 	event: function(event) {
			// 		event.stopPropagation();
			// 	}
			// },
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
		id: 'prior-deletion-count',
		style: 'font-style: italic'
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

	// Check for prior deletions.  Just once, upon init
	Twinkle.speedy.callback.priorDeletionCount();
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	var namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	var mode = {
		isSysop: !!form.tag_only && !form.tag_only.checked,
		isMultiple: form.tag_only && !form.tag_only.checked ? form.delmultiple.checked : form.multiple.checked,
		isRadioClick: Twinkle.getPref('speedySelectionStyle') === 'radioClick'
	};

	if (mode.isSysop) {
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

	if (mode.isMultiple && mode.isRadioClick) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';

		work_area.append({
			type: 'div',
			label: 'When finished choosing criteria, click:'
		});
		work_area.append({
			type: 'button',
			name: 'submit-multiple',
			label: mode.isSysop ? 'Delete page' : 'Tag page',
			event: function(event) {
				Twinkle.speedy.callback[evaluateType](event);
				event.stopPropagation();
			}
		});
	}

	var appendList = function(headerLabel, csdList) {
		work_area.append({ type: 'header', label: headerLabel });
		work_area.append({ type: mode.isMultiple ? 'checkbox' : 'radio', name: 'csd', list: Twinkle.speedy.generateCsdList(csdList, mode) });
	};

	if (mode.isSysop && !mode.isMultiple) {
		appendList('Custom rationale', Twinkle.speedy.customRationale);
	}

	if (namespace % 2 === 1 && namespace !== 3) {
		// show db-talk on talk pages, but not user talk pages
		appendList('Talk pages', Twinkle.speedy.talkList);
	}

	if (!Morebits.isPageRedirect()) {
		switch (namespace) {
			case 0:  // gallery
			case 1:  // talk
				appendList('Galleries', Twinkle.speedy.galleryList);
				break;

			case 2:  // user
			case 3:  // user talk
				appendList('User pages', Twinkle.speedy.userList);
				break;
			
			case 4:  // Commons
			case 5:  // Commons talk
				appendList('Commons', Twinkle.speedy.commonsList);
				break;
			
			case 6:  // file
			case 7:  // file talk
				appendList('Files', Twinkle.speedy.fileList);
				if (!mode.isSysop) {
					work_area.append({ type: 'div', label: 'Tagging for CSD F5 (no license/source/permission) can be done using Twinkle\'s "DI" tab.' });
				}
				break;

			case 10:  // file
			case 11:  // file talk
				appendList('Template', Twinkle.speedy.templateList);
				break;

			case 14:  // category
			case 15:  // category talk
				appendList('Categories', Twinkle.speedy.categoryList);
				break;

			default:
				break;
		}
		if (namespace % 2 === 1 && namespace !== 3) {
			appendList('Talk pages', Twinkle.speedy.talkList);
		}
	} else {
		if (namespace === 2 || namespace === 3) {
			appendList('User pages', Twinkle.speedy.userList);
		}
		appendList('Redirects', Twinkle.speedy.redirectList);
	}

	var generalCriteria = Twinkle.speedy.generalList;

	// custom rationale lives under general criteria when tagging
	if (!mode.isSysop) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	appendList('General criteria', generalCriteria);

	var old_area = Morebits.quickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (mode.isSysop && Twinkle.speedy.hasCSD) {
		var customOption = $('input[name=csd][value=reason]')[0];
		if (customOption) {
			if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
				// force listeners to re-init
				customOption.click();
				customOption.parentNode.appendChild(customOption.subgroup);
			}
			customOption.subgroup.querySelector('input').value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ').replace(/CSD ([A-Z]{1,3}\d{1,2})/, '[[COM:CSD#$1|CSD $1]]');
		}
	}
};

Twinkle.speedy.callback.priorDeletionCount = function () {
	var query = {
		action: 'query',
		format: 'json',
		list: 'logevents',
		letype: 'delete',
		leaction: 'delete/delete', // Just pure page deletion, no redirect overwrites or revdel
		letitle: mw.config.get('wgPageName'),
		leprop: '', // We're just counting we don't actually care about the entries
		lelimit: 5  // A little bit goes a long way
	};

	new Morebits.wiki.api('Checking for past deletions', query, function(apiobj) {
		var response = apiobj.getResponse();
		var delCount = response.query.logevents.length;
		if (delCount) {
			var message = delCount + ' previous deletion';
			if (delCount > 1) {
				message += 's';
				if (response.continue) {
					message = 'More than ' + message;
				}

				// 3+ seems problematic
				if (delCount >= 3) {
					$('#prior-deletion-count').css('color', 'red');
				}
			}

			// Provide a link to page logs (CSD templates have one for sysops)
			var link = Morebits.htmlNode('a', '(logs)');
			link.setAttribute('href', mw.util.getUrl('Special:Log', {page: mw.config.get('wgPageName')}));
			link.setAttribute('target', '_blank');

			$('#prior-deletion-count').text(message + ' '); // Space before log link
			$('#prior-deletion-count').append(link);
		}
	}).post();
};


Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {

	var pageNamespace = mw.config.get('wgNamespaceNumber');

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (mode.isMultiple) {
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

		if (mode.isSysop) {
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

		if (Morebits.isPageRedirect() && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.showInNamespaces && criterion.showInNamespaces.indexOf(pageNamespace) < 0) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.indexOf(pageNamespace) > -1) {
			return null;
		}

		if (criterion.subgroup && !mode.isMultiple && mode.isRadioClick) {
			if (Array.isArray(criterion.subgroup)) {
				criterion.subgroup = criterion.subgroup.concat({
					type: 'button',
					name: 'submit',
					label: mode.isSysop ? 'Delete page' : 'Tag page',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: mode.isSysop ? 'Delete page' : 'Tag page',
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
			label: 'Rationale:',
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
		label: 'F1: Clear copyright violation',
		value: 'copyvio',
		code: 'f1',
		tooltip:
			'Content is a clear copyright violation, with evidence that no Commons-compatible licensing has been issued by the copyright holder. This does not apply whenever there is a reasonable possibility of discovering that the work is public domain through further research or a plausible argument that it is below the threshold of originality.',
		subgroup: [
			{
				name: 'imgcopyvio_url',
				parameter: 'source',
				utparam: '3',
				type: 'input',
				label:
					'URL of the copyvio, including the "http://".  If the copyvio is of a non-internet source and you cannot provide a URL, you must use the deletion rationale box. ',
				size: 60,
			},
			{
				name: 'imgcopyvio_rationale',
				parameter: '1',
				utparam: '2',
				type: 'input',
				label: 'Deletion rationale for non-internet copyvios: ',
				size: 60,
			},
		],
	},
	{
		label: 'F2: Fair use content',
		value: 'fairuse',
		code: 'f2',
		tooltip:
			'Fair use content. Such content is not allowed on Wikimedia Commons and is subjected to speedy deletion.',
		subgroup: {
			name: 'fairuse_rationale',
			parameter: '2',
			utparam: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'F3: Derivative work of non-free content',
		value: 'deriv',
		code: 'f3',
		tooltip:
			'Derivative works based on non-free content (such as screenshots of non-free content). This does not apply to photographs taken in a public place, though the photograph itself remains subject to the other speedy criteria if its authorship is in question. Given the complexity of copyright rules like freedom of panorama and de minimis, it is best for such issues to be resolved in a formal deletion request.',
		subgroup: {
			name: 'deriv_rationale',
			parameter: '2',
			utparam: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'F4: Failed license review',
		value: 'lrfailed',
		code: 'f4',
		tooltip:
			'The file has been reviewed by a License Reviewer (or administrator), who concluded that the recently uploaded content is based on a non-free license, disallowing commercial use and/or derivative works.',
		subgroup: {
			name: 'lrfailed_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'F4: Volunteer Response Team',
		value: 'vrt',
		code: 'f4',
		tooltip:
			'Files tagged by VRT Reviewers as having insufficient permission, or files tagged with OTRS pending for over 30 days.',
		subgroup: {
			name: 'vrt_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		}
	},
	// Skip F5: this should be under DI module
	{
		label: 'F6: License laundering',
		value: 'll',
		code: 'f6',
		tooltip:
			'Content uploaded via license laundering techniques is a copyright violation. Users uploading in such techniques may be subjected to their account being temporarily or permanently blocked.',
		subgroup: {
			name: 'll_rationale',
			parameter: '2',
			utparam: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'F7: Corrupt, missing, or empty file',
		value: 'noimage',
		code: 'f7',
		tooltip:
			'Empty file pages are subject to speedy deletion, unless they are being used as redirects. The same is true for files that are corrupt or invalid when viewed in full resolution, or are in a disallowed format.',
		subgroup: {
			name: 'noimage_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'F8: Duplicate file',
		value: 'duplicate',
		code: 'f8',
		tooltip:
			'Any file that is a redundant copy, in the same file format and same or lower resolution, of something else on Wikimedia Commons.',
		subgroup: {
			name: 'duplicate_filename',
			parameter: '1',
			log: '[[:$1]]',
			type: 'input',
			label: 'File this is redundant to: ',
			tooltip: 'The "File:" prefix must be left off.',
		},
	},
	{
		label: 'F9: Embedded data',
		value: 'embeddeddata',
		code: 'f9',
		tooltip:
			'The file contains additional embedded data in the form of a password protected archive.',
		subgroup: {
			name: 'embeddeddata_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'F10: Personal photos by non-contributors',
		value: 'selfie',
		code: 'f10',
		tooltip:
			'Low-to-medium quality selfies and other personal images of or by users who have no constructive global contributions.',
		subgroup: {
			name: 'selfie_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	}
];

Twinkle.speedy.galleryList = [
	{
		label: 'GA1: Gallery without images or other media files',
		value: 'emptygallery',
		code: 'ga1',
		tooltip:
			'Mainspace pages (galleries) that are empty or contain no useful content, such as pages that contain text but no images or other media.',
	},
	{
		label: 'GA2: User intended to create encyclopedic content',
		value: 'encyclopediagallery',
		code: 'ga2',
		tooltip:
			"Page intended to be an encyclopedic article. Articles and biographies belong in the Wikipedia projects, and are out of Commons's project scope.",
	}
];

Twinkle.speedy.categoryList = [
	{
		label: 'C1: Improperly named category',
		value: 'catbadname',
		code: 'c1',
		tooltip:
			'Categories with incorrect names may be speedily deleted after their contents have been moved to a properly named category. If the old category name is also correct, a redirect should be left in place. See [[Commons:Rename a category: Should the old category be deleted?]]',
		subgroup: {
			name: 'catbadname_name',
			parameter: '2',
			type: 'input',
			label: 'Name of correctly named category: ',
			size: 60,
		},
	},
	{
		label: 'C2: Empty categories',
		value: 'catempty',
		code: 'c2',
		tooltip:
			"If a category is empty and is obviously unusable, unlikely to be ever meaningfully used, it may be speedily deleted. Don't apply if the page is marked with an explanation of why it should be kept or if the deletion can be controversial, the category was recently unconsensually emptied, etc. Consider redirecting or renaming the category rather than deleting it.",
		subgroup: {
			name: 'catempty_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'G2: Broken redirects',
		value: 'redirnone',
		code: 'g2',
		tooltip:
			'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
	}
];

Twinkle.speedy.userList = [
	{
		label: 'U1: User requested deletion in own user space',
		value: 'userspacereq',
		code: 'u1',
		tooltip:
			'User requested deletion of their own user page or user-subpage. User pages that are blanked by the user may also be deleted under this criterion.',
		subgroup:
			mw.config.get('wgNamespaceNumber') === 3 && mw.config.get('wgTitle').indexOf('/') === -1
				? {
						name: 'userreq_rationale',
						parameter: '2',
						type: 'input',
						label:
							'A mandatory rationale to explain why this user talk page should be deleted: ',
						tooltip:
							'User talk pages are deleted only in highly exceptional circumstances. See WP:DELTALK.',
						size: 60,
				  }
				: null,
		hideSubgroupWhenMultiple: true,
	},
	{
		label: 'U2: Nonexistent user',
		value: 'nouser',
		code: 'u2',
		tooltip:
			'User space of non-existent user. Redirects may be created (and protected) for those user names of which the account was renamed.',
		hideWhenRedirect: true,
	},
	{
		label: 'U3: Inappropriate use of user pages',
		value: 'inappuserspace',
		code: 'u3',
		tooltip:
			'Inappropriate use of user pages. These include user pages that contain purely advertising or promotional material, or those that are created with the intention of harassment or attack. Those that contain gibberish or unrecognisable content may also be deleted under this criterion.',
		subgroup: {
			name: 'inappuser_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
		hideWhenRedirect: true,
	}
];

Twinkle.speedy.commonsList = [
	{
		label: 'COM1: Improperly filed or routinely emptied deletion request or log',
		value: 'com1',
		code: 'com1',
		tooltip:
			'This includes Deletion Requests (DRs) that are corrupted or incorrect and cannot be fixed, or redundant DRs for pages that are eligible for speedy deletion; this requires either formally closing the DR in order to both close the DR and have the bot remove it from the log, or deleting the DR page and removing the daily log entry. Deletion logs are also routinely emptied as discussions are closed, when empty they may be deleted immediately. Note that this does not apply to DR archives, which are separate from the working logs.',
	}
]

Twinkle.speedy.templateList = [
	{
		label: 'T1: Recently created duplicate template',
		value: 't1',
		code: 't1',
		tooltip: 'A recently created template that duplicates an existing older template.',
		subgroup: {
			name: 't1_rationale',
			parameter: '2',
			type: 'input',
			label: 'Explanation. Please include the template that this duplicates here: ',
			size: 60,
		},
	},
	{
		label: 'T2: Unused template',
		value: 't2',
		code: 't2',
		tooltip:
			'Unused templates (except maintenance/project templates that are substituted), are subjected to speedy deletion.',
		subgroup: {
			name: 't2_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	}
]

Twinkle.speedy.generalList = [
	{
		label:
			'G1: Test page, accidental creation, or page containing nonsense or no valid content',
		value: 'g1',
		code: 'g1',
		tooltip:
			"Page contains redundant content that was previously used for testing, was accidentally created, or contains content that is gibberish or of nothing meaningful. This may also include text placed in talk pages (which has no further history) that doesn't help or refer to the related page.",
		hideInNamespaces: [2], // Not applicable in userspace, use U1 for that
	},
	{
		label: 'G2: Unused and implausible, or broken redirect',
		value: 'redir',
		code: 'g2',
		tooltip:
			'Page is an unused AND implausible redirect, or a redirect that is dependent on deleted or non-existent content. Unused talk page redirects created as a result of a page move and cross-namespace redirects may also be deleted under this criterion.',
	},
	{
		label: 'G3: Content intended as vandalism, threat, attack, or hoax',
		value: 'vandalism',
		code: 'g3',
		tooltip:
			'Content that is posted with the intention of vandalizing, or with the intention of threatening, harassing, or attacking another person or user. Users that commit such acts are subjected to their accounts being temporarily or permanently blocked, depending on the severity of the content. Content posted with the intention of creating/spreading hoaxes may also be deleted under this criterion.',
		subgroup: {
			name: 'vandalism_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'G4: Recreation of material deleted via a deletion discussion',
		value: 'repost',
		code: 'g4',
		tooltip:
			"Page or file matches content that was previously deleted per community consensus. Repeated recreation of such content may lead to the user's account being blocked. The author or uploader may ask the deleting administrator to restore the file, or file an Undeletion Request.",
		subgroup: {
			name: 'repost_xfd',
			parameter: '2',
			log: '[[:$1]]',
			type: 'input',
			label: 'Page where the deletion discussion took place: ',
			tooltip: 'Must start with "Commons:"',
			size: 60,
		},
	},
	// Skip G5: content falling under G5 can either be revdelled or fall under G6.
	{
		label: 'G6: Uncontroversial maintenance',
		value: 'g6',
		code: 'g6',
		tooltip:
			'Content temporarily deleted to make way for a page move, or other uncontroversial maintenance tasks that require temporary or permanent deletion (such as history merging or splitting).',
		subgroup: {
			name: 'g6_rationale',
			parameter: '2',
			type: 'input',
			label:
				'Optional explanation. If this is for a move, include the page name for the page to be moved here and the reason. Otherwise, explain why this should be deleted: ',
			size: 60,
		},
	},
	{
		label: 'G7: Author or uploader request deletion of RECENT content',
		value: 'author',
		code: 'g7',
		tooltip:
			'Original author or uploader requests deletion of recently created (<7 days) unused content. For author/uploader requests for deletion of content that is older a deletion request should be filed instead. If the author blanks the page, this can also be taken as a deletion request.',
		subgroup: {
			name: 'author_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			tooltip: 'Perhaps linking to where the author requested this deletion.',
			size: 60,
		},
	},
	{
		label: 'G8: Page dependent on deleted or non-existent content',
		value: 'g8',
		code: 'g8',
		tooltip:
			'The page or file depends on content that was deleted or no longer existing, such as orphaned talk pages without useful content, subpages without parent page, and so on. The criterion only applies to content within Wikimedia, and does not apply to external content (i.e., deleted source).',
		subgroup: {
			name: 'g8_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
		hideSubgroupWhenSysop: true,
	},
	// Skip G9: WMF probably won't use Twinkle.
	{
		label: 'G10: Files and pages created as advertisements',
		value: 'advert',
		code: 'g10',
		tooltip:
			'This includes only content uploaded to promote goods and services when it is clearly not useful for any educational purpose (see Commons:Project scope). Files that illustrate contemporary or historical advertisements do not fall under this criterion.',
		subgroup: {
			name: 'advert_rationale',
			parameter: '2',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60,
		},
	},
	{
		label: 'G11: Blatant text copyright violation',
		value: 'textcopyvio',
		code: 'g11',
		tooltip: 'Page contains copyrighted text from webpages or documents without permission.',
		subgroup: [
			{
				name: 'textcopyvio_rationale',
				parameter: '2',
				type: 'input',
				label: 'Deletion rationale for copyvios. Include the URL or source of the copyvio: ',
				size: 60,
			},
		],
	},
];

Twinkle.speedy.redirectList = [
	// {
	// 	label: 'G2: Unused and implausible, or broken redirect',
	// 	value: 'redir',
	// 	code: 'g2',
	// 	tooltip:
	// 		'Page is an unused AND implausible redirect, or a redirect that is dependent on deleted or non-existent content. Unused talk page redirects created as a result of a page move and cross-namespace redirects may also be deleted under this criterion.',
	// }
]

Twinkle.speedy.normalizeHash = {
	'reason': 'db',
	'g1': 'g1',
	'vandalism': 'g3',
	'hoax': 'g3',
	'repost': 'g4',
	'g6': 'g6',
	'author': 'g7',
	'g8': 'g8',
	'talk': 'g8',
	'g8': 'g8',
	'redirnone': 'g8',
	'advert': 'g10',
	'textcopyvio': 'g11',
	'copyvio': 'f1',
	'fairuse': 'f2',
	'deriv': 'f3',
	'lrfailed': 'f4',
	'vrt': 'f4',
	'll': 'f6',
	'noimage': 'f7',
	'duplicate': 'f8',
	'embeddeddata': 'f9',
	'selfie': 'f10',
	'emptygallery': 'ga1',
	'encyclopediagallery': 'ga2',
	'catbadname': 'c1',
	'catempty': 'c2',
	'userspacereq': 'u1',
	'nouser': 'u2',
	'inappuserspace': 'u3',
	'com1': 'com1',
	't1': 't1',
	't2': 't2',
	'redir': 'g2',
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
			title: mw.config.get('wgPageName'),
			disablelimitreport: true,
			format: 'json'
		};

		var statusIndicator = new Morebits.status('Building deletion summary');
		var api = new Morebits.wiki.api('Parsing deletion template', query, function(apiobj) {
			var reason = decodeURIComponent($(apiobj.getResponse().parse.text).find('#delete-reason').text()).replace(/\+/g, ' ').replace(/CSD ([A-Z]{1,3}\d{1,2})/, '[[COM:CSD#$1|CSD $1]]');
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
			editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			// if (params.normalizeds.indexOf('g10') === -1) {  // no article name in summary for G10 taggings
			// 	editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			// } else {
			// 	editsummary += ' of an attack page.';
			// }

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(editsummary);
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('watchSpeedyUser'));
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
				console.log("Reason: %s", reason)
				console.log("Code: %s", code)
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
					!document.getElementById('ca-talk').classList.contains('new')) {
				var talkpage = new Morebits.wiki.page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), 'Deleting talk page');
				talkpage.setEditSummary('[[COM:CSD#G8|G8]]: Talk page of deleted page "' + Morebits.pageNameNorm + '"');
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
					action: 'query',
					titles: mw.config.get('wgPageName'),
					prop: 'redirects',
					rdlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
					format: 'json'
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
					href: '#',
					text: 'click here to go to the Unlink tool',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing usages of and/or links to deleted file ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					text: 'To orphan backlinks and remove instances of file usage',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f8') {
				$link = $('<a/>', {
					href: '#',
					text: 'click here to go to the Unlink tool',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing links to deleted page ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					text: 'To orphan backlinks',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}
		},
		deleteRedirectsMain: function(apiobj) {
			var response = apiobj.getResponse();
			var snapshot = response.query.pages[0].redirects || [];
			var total = snapshot.length;
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

			snapshot.forEach(function(value) {
				var title = value.title;
				var page = new Morebits.wiki.page(title, 'Deleting redirect "' + title + '"');
				page.setEditSummary('[[COM:CSD#G8|G8]]: Redirect to deleted page "' + Morebits.pageNameNorm + '"');
				page.setChangeTags(Twinkle.changeTags);
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			var params = pageobj.getCallbackParameters();

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			var buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0];
			params.utparams = buildData[1];

			// Set the correct value for |ts= parameter in {{db-g13}}
			if (params.normalizeds.indexOf('g13') !== -1) {
				code = code.replace('$TIMESTAMP', pageobj.getLastEditTime());
			}

			// Tag if possible, post on talk if not
			if (pageobj.canEdit() && ['wikitext', 'Scribunto', 'javascript', 'css', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				var text = pageobj.getPageText();

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

				// if (params.requestsalt) {
				// 	code += '\n{{salt}}';
				// 	// if (params.normalizeds.indexOf('g10') === -1) {
				// 	// 	code += '\n{{salt}}';
				// 	// } else {
				// 	// 	code = '{{salt}}\n' + code;
				// 	// }
				// }

				if (mw.config.get('wgPageContentModel') === 'Scribunto') {
					// Scribunto isn't parsed like wikitext, so CSD templates on modules need special handling to work
					var equals = '';
					while (code.indexOf(']' + equals + ']') !== -1) {
						equals += '=';
					}
					code = "require('Module:Module wikitext')._addText([" + equals + '[' + code + ']' + equals + ']);';
				} else if (['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1) {
					// Likewise for JS/CSS pages
					code = '/* ' + code + ' */';
				}

				// Generate edit summary for edit
				var editsummary;
				if (params.normalizeds.length > 1) {
					editsummary = 'Requesting speedy deletion (';
					$.each(params.normalizeds, function(index, norm) {
						editsummary += '[[COM:CSD#' + norm.toUpperCase() + '|CSD ' + norm.toUpperCase() + ']], ';
					});
					editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
					editsummary += ').';
				} else if (params.normalizeds[0] === 'db') {
					editsummary = 'Requesting [[COM:CSD|speedy deletion]] with rationale "' + params.templateParams[0]['1'] + '".';
				} else {
					editsummary = 'Requesting speedy deletion ([[COM:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']]).';
				}

				var wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
				// Blank attack pages
				// if (params.normalizeds.indexOf('g10') !== -1) {
				// 	text = code;
				// } else {
				// 	// Insert tag after short description or any hatnotes
				// 	var wikipage = new Morebits.wikitext.page(text);
				// 	text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
				// }


				pageobj.setPageText(text);
				pageobj.setEditSummary(editsummary);
				pageobj.setWatchlist(params.watch);
				pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
			} else { // Attempt to place on talk page
				var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
				if (talkName !== pageobj.getPageName()) {
					// if (params.requestsalt) {
					// 	code += '\n{{salt}}';
					// }

					pageobj.getStatusElement().warn('Unable to edit page, placing tag on talk page');

					var talk_page = new Morebits.wiki.page(talkName, 'Automatically placing tag on talk page');
					talk_page.setNewSectionTitle(pageobj.getPageName() + ' nominated for CSD, request deletion');
					talk_page.setNewSectionText(code + '\n\nI was unable to tag ' + pageobj.getPageName() + ' so please delete it. ~~~~');
					talk_page.setCreateOption('recreate');
					talk_page.setFollowRedirect(true);
					talk_page.setWatchlist(params.watch);
					talk_page.setChangeTags(Twinkle.changeTags);
					talk_page.setCallbackParameters(params);
					talk_page.newSection(Twinkle.speedy.callbacks.user.tagComplete);
				} else {
					pageobj.getStatusElement().error('Page protected and nowhere to add an edit request, aborting');
				}
			}
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

		addToLog: function(params, initialContrib) {
			var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
			usl.initialText =
				"This is a log of all [[COM:CSD|speedy deletion]] nominations made by this user using [[COM:TW|Twinkle]]'s CSD module.\n\n" +
				'If you no longer wish to keep this log, you can turn it off using the [[Commons:Twinkle/Preferences|preferences panel]], and ' +
				'nominate this page for speedy deletion under [[COM:CSD#U1|CSD U1]].' +
				(Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');

			var formatParamLog = function(normalize, csdparam, input) {
				input = '[[:' + input + ']]';
				return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
			};

			var extraInfo = '';

			// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
			var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';

			var editsummary = 'Logging speedy deletion nomination';
			var appendText = '# [[:' + Morebits.pageNameNorm + "]]. ";

			if (params.normalizeds.length > 1) {
				appendText += 'multiple criteria (';
				$.each(params.normalizeds, function(index, norm) {
					appendText += '[[COM:CSD#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']], ';
				});
				appendText = appendText.substr(0, appendText.length - 2);  // remove trailing comma
				appendText += ')';
			} else if (params.normalizeds[0] === 'db') {
				appendText += '{{tl|db-reason}}';
			} else {
				appendText += '[[COM:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']] ({{tl|db-' + params.values[0] + '}})';
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

			// if (params.requestsalt) {
			// 	appendText += '; requested creation protection ([[WP:SALT|salting]])';
			// }
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
			case 'reason': //db
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
			
			case 'copyvio':
				if (form['csd.imgcopyvio_url']) {
					var url = form['csd.imgcopyvio_url'].value;
					if (url) {
						currentParams.source = url;
					}
				}
				if (form['csd.imgcopyvio_rationale']) {
					var rationale = form['csd.imgcopyvio_rationale'].value;
					if (rationale) {
						currentParams['1'] = rationale;
					}
				}
				break;
			
			case 'fairuse':
				if (form['csd.fairuse_rationale']) {
					var rationale = form['csd.fairuse_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'deriv':
				if (form['csd.deriv_rationale']) {
					var rationale = form['csd.deriv_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'lrfailed':
				if (form['csd.lrfailed_rationale']) {
					var rationale = form['csd.lrfailed_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'vrt':
				if (form['csd.vrt_rationale']) {
					var rationale = form['csd.vrt_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'll':
				if (form['csd.ll_rationale']) {
					var rationale = form['csd.ll_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'noimage':
				if (form['csd.noimage_rationale']) {
					var rationale = form['csd.noimage_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'duplicate':
				if (form['csd.duplicate_rationale']) {
					var rationale = form['csd.duplicate_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'embeddeddata':
				if (form['csd.embeddeddata_rationale']) {
					var rationale = form['csd.embeddeddata_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;
			
			case 'selfie':
				if (form['csd.selfie_rationale']) {
					var rationale = form['csd.selfie_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;
			
			case 'catbadname':
				if (form['csd.catbadname_name']) {
					var correctName = form['csd.catbadname_name']
					if (correctName) {
						currentParams['2'] = correctName;
					}
				}
				break;
			
			case 'catempty':
				if (form['csd.catempty_rationale']) {
					var rationale = form['csd.catempty_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
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
					currentParams['2'] = u1rationale;
				}
				break;

			case 'inappuserspace':
				if (form['csd.inappuserspace_rationale']) {
					var rationale = form['csd.inappuserspace_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;
				
			case 't1':
				if (form['csd.t1_rationale']) {
					var t1rationale = form['csd.t1_rationale'].value;
					if (!t1rationale || !t1rationale.trim()) {
						alert('CSD T1:  Please include the template that this duplicates here.');
						parameters = null;
						return false;
					}
					currentParams['2'] = t1rationale;
				}
				break;
			
			case 't2':
				if (form['csd.t2_rationale']) {
					var rationale = form['csd.t2_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;
			
			case 'vandalism':
				if (form['csd.vandalism_rationale']) {
					var rationale = form['csd.vandalism_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;
			
			case 'repost':  // G4
				if (form['csd.repost_xfd']) {
					var deldisc = form['csd.repost_xfd'].value;
					if (deldisc) {
						currentParams['2'] = '[[' + deldisc + ']]';
					}
				}
				break;

			case 'g6':
				if (form['csd.g6_rationale']) {
					var rationale = form['csd.g6_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'author':
				if (form['csd.author_rationale']) {
					var rationale = form['csd.author_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;
				
			case 'g8':
				if (form['csd.g8_rationale']) {
					var rationale = form['csd.g8_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'advert':
				if (form['csd.advert_rationale']) {
					var rationale = form['csd.advert_rationale'].value;
					if (rationale) {
						currentParams['2'] = rationale;
					}
				}
				break;

			case 'textcopyvio':
				if (form['csd.textcopyvio_rationale']) {
					var rationale = form['csd.textcopyvio_rationale'].value;
					if (!rationale || !rationale.trim()) {
						alert('CSD G11:  Include the URL or source of the copyvio');
						parameters = null;
						return false;
					}
					currentParams['2'] = rationale;
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

	switch (normalized) {
		case 'db': // Speedydelete and Speedynote
			utparams.reason = parameters['1'];
			break;
		case 'f1': // Copyvio and Copyvionote
			utparams.source = parameters['source'];
			utparams.reason = parameters['1'];
			break;
		default: // SD and Speedynote
			utparams['2'] = parameters['2'];
			break;
	}
	
	return utparams;
};

/**
 * @param {Event} e
 * @returns {Array}
 */
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
			watchPage = Twinkle.getPref('watchSpeedyExpiry');
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').indexOf(norm) !== -1) {
			promptForSummary = true;
		}
	});

	var warnusertalk = form.warnusertalk.checked && normalizeds.some(function (norm, index) {
		return Twinkle.getPref('warnUserOnSpeedyDelete').indexOf(norm) !== -1 &&
			!(norm === 'g6' && values[index] !== 'copypaste');
	});

	var welcomeuser = warnusertalk && normalizeds.some(function (norm) {
		return Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1;
	});

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

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page/notify the creator
	var watchPage = normalizeds.some(function(csdCriteria) {
		return Twinkle.getPref('watchSpeedyPages').indexOf(csdCriteria) !== -1;
	}) && Twinkle.getPref('watchSpeedyExpiry');

	var notifyuser = form.notify.checked && normalizeds.some(function(norm, index) {
		return Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1 &&
			!(norm === 'g6' && values[index] !== 'copypaste');
	});
	var welcomeuser = notifyuser && normalizeds.some(function(norm) {
		return Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1;
	});
	var csdlog = Twinkle.getPref('logSpeedyNominations') && normalizeds.some(function(norm) {
		return Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1;
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog,
		// requestsalt: form.salting.checked,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete';

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page');
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
})(jQuery);


// </nowiki>
