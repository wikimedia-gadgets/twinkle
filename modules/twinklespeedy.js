/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 * Config directives in:   TwinkleConfig
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, check out the default values of the CSD preferences
 *   in twinkle.header.js, and add your new criterion to those if you think it would
 *   be good. 
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	if ( userIsInGroup( 'sysop' ) ) {
		$(twAddPortletLink("#", "CSD", "tw-csd", "Delete page according to WP:CSD", "")).click(Twinkle.speedy.callback);
	} else if (twinkleUserAuthorized) {
		$(twAddPortletLink("#", "CSD", "tw-csd", "Request speedy deletion according to WP:CSD", "")).click(Twinkle.speedy.callback);
	} else {
		$(twAddPortletLink("#", 'CSD', 'tw-csd', 'Request speedy deletion according to WP:CSD', '')).click(function() {
			alert("Your account is too new to use Twinkle.");
		});
	}
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(userIsInGroup( 'sysop' ) ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

Twinkle.speedy.dialog = null;
// Prepares the speedy deletion dialog and displays it
// Parameters:
//  - callbackfunc: the function to call when the dialog box is submitted
//  - firstTime: is this the first time? (false during a db-multiple run, true otherwise)
//  - content: (optional) a div element in which the form content should be rendered - allows
//    for placing content in an existing dialog box
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc, firstTime, content) {
	var dialog;
	if (!content)
	{
		Twinkle.speedy.dialog = new SimpleWindow( Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight') );
		dialog = Twinkle.speedy.dialog;
		dialog.setTitle( "Choose criteria for speedy deletion" );
		dialog.setScriptName( "Twinkle" );
		dialog.addFooterLink( "Speedy deletion policy", "WP:CSD" );
		dialog.addFooterLink( "Twinkle help", "WP:TW/DOC#speedy" );
	}

	var form = new QuickForm( callbackfunc, 'change' );
	if( firstTime && userIsInGroup( 'sysop' ) ) {
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Tag page only, don\'t delete',
						value: 'tag_only',
						name: 'tag_only',
						tooltip: 'If you just want to tag the page, instead of deleting it now',
						checked : Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							// enable/disable notify checkbox
							event.target.form.notify.disabled = !event.target.checked;
							event.target.form.notify.checked = event.target.checked;
							// enable/disable talk page checkbox
							if (event.target.form.talkpage) {
								event.target.form.talkpage.disabled = event.target.checked;
								event.target.form.talkpage.checked = !event.target.checked && Twinkle.getPref('deleteTalkPageOnDelete');
							}
							// enable/disable redirects checkbox
							event.target.form.redirects.disabled = event.target.checked;
							event.target.form.redirects.checked = !event.target.checked;
							// enable/disable multiple
							$(event.target.form).find('input[name="csd"][value="multiple"]')[0].disabled = !event.target.checked;
							event.stopPropagation();
						}
					}
				]
			} );
		form.append( { type: 'header', label: 'Delete-related options' } );
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) {  // hide option for user pages, to avoid accidentally deleting user talk page
			form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Also delete talk page',
						value: 'talkpage',
						name: 'talkpage',
						tooltip: "This option deletes the page's talk page in addition. If you choose the F8 (moved to Commons) criterion, this option is ignored and the talk page is *not* deleted.",
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			} );
		}
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Also delete all redirects',
						value: 'redirects',
						name: 'redirects',
						tooltip: "This option deletes all incoming redirects in addition. Avoid this option for procedural (e.g. move/merge) deletions.",
						checked: true,
						disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			} );
		form.append( { type: 'header', label: 'Tag-related options' } );
	}

	// don't show this notification checkbox for db-multiple, as the value is ignored
	// XXX currently not possible to turn off notification when using db-multiple
	if (firstTime) {
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Notify page creator if possible',
						value: 'notify',
						name: 'notify',
						tooltip: "A notification template will be placed on the talk page of the creator, IF you have a notification enabled in your Twinkle preferences " +
							"for the criterion you choose AND this box is checked. The creator may be welcomed as well.",
						checked: !userIsInGroup( 'sysop' ) || Twinkle.getPref('deleteSysopDefaultToTag'),
						disabled: userIsInGroup( 'sysop' ) && !Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			}
		);
	} else {
		form.append( { type:'header', label: 'Tagging with {{db-multiple}}: Criterion ' + (Twinkle.speedy.dbmultipleCriteria.length + 1) } );
	}

	if (firstTime) {
		form.append( { type: 'radio', name: 'csd',
			list: [
				{
					label: 'Tag with multiple criteria',
					value: 'multiple',
					tooltip: 'Opens a series of further dialogs, allowing you to specify all the criteria you want to tag this page with.',
					disabled: userIsInGroup('sysop') && !Twinkle.getPref('deleteSysopDefaultToTag')
				}
			]
		} );
	} else if (Twinkle.speedy.dbmultipleCriteria.length > 0) {
		form.append( { type: 'radio', name: 'csd',
			list: [
				{
					label: 'No more criteria apply - finish tagging',
					value: 'multiple-finish'
				}
			]
		} );
	}

	var namespace = mw.config.get('wgNamespaceNumber');
	if (namespace % 2 === 1 && namespace !== 3) {  // talk pages, but not user talk pages
		form.append( { type: 'header', label: 'Talk pages' } );
		form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.talkList } );
	}

	switch (namespace) {
		case 0:  // article
		case 1:  // talk
			form.append( { type: 'header', label: 'Articles' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getArticleList(!firstTime) } );
			break;

		case 2:  // user
		case 3:  // user talk
			form.append( { type: 'header', label: 'User pages' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.userList } );
			break;

		case 6:  // file
		case 7:  // file talk
			form.append( { type: 'header', label: 'Files' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getFileList(!firstTime) } );
			form.append( { type: 'div', label: 'Tagging for CSD F4 (no license), F5 (orphaned fair use), F6 (no fair use rationale), and F11 (no permission) can be done using Twinkle\'s "DI" tab.' } );
			break;

		case 10:  // template
		case 11:  // template talk
			form.append( { type: 'header', label: 'Templates' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getTemplateList(!firstTime) } );
			break;

		case 14:  // category
		case 15:  // category talk
			form.append( { type: 'header', label: 'Categories' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.categoryList } );
			break;

		case 100:  // portal
		case 101:  // portal talk
			form.append( { type: 'header', label: 'Portals' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getPortalList(!firstTime) } );
			break;

		default:
			break;
	}

	form.append( { type: 'header', label: 'General criteria' } );
	form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getGeneralList(!firstTime) });

	form.append( { type: 'header', label: 'Redirects' } );
	form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.redirectList } );

	var result = form.render();
	if (dialog)
	{
		// render new dialog
		dialog.setContent( result );
		dialog.display();
	}
	else
	{
		// place the form content into the existing dialog box
		content.textContent = ''; // clear children
		content.appendChild(result);
	}
};

Twinkle.speedy.talkList = [
	{
		label: 'G8: Talk pages with no corresponding subject page',
		value: 'talk',
		tooltip: 'This excludes any page that is useful to the project - in particular, user talk pages, talk page archives, and talk pages for files that exist on Wikimedia Commons.'
	}
];

// this is a function to allow for db-multiple filtering
Twinkle.speedy.getFileList = function twinklespeedyGetFileList(multiple) {
	var result = [];
	result.push({
		label: 'F1: Redundant file',
		value: 'redundantimage',
		tooltip: 'Any file that is a redundant copy, in the same file format and same or lower resolution, of something else on Wikipedia. Likewise, other media that is a redundant copy, in the same format and of the same or lower quality. This does not apply to files duplicated on Wikimedia Commons, because of licence issues; these should be tagged with {{subst:ncd|Image:newname.ext}} or {{subst:ncd}} instead'
	});
	result.push({
		label: 'F2: Corrupt or blank file',
		value: 'noimage',
		tooltip: 'Before deleting this type of file, verify that the MediaWiki engine cannot read it by previewing a resized thumbnail of it. This also includes empty (i.e., no content) file description pages for Commons files'
	});
	if (!multiple) {
		result.push({
			label: 'F2: Unneeded file description page for a file on Commons',
			value: 'fpcfail',
			tooltip: 'An image, hosted on Commons, but with tags or information on its English Wikipedia description page that are no longer needed. (For example, a failed featured picture candidate.)'
		});
	}
	result.push({
		label: 'F3: Improper license',
		value: 'noncom',
		tooltip: 'Files licensed as "for non-commercial use only", "non-derivative use" or "used with permission" that were uploaded on or after 2005-05-19, except where they have been shown to comply with the limited standards for the use of non-free content. This includes files licensed under a "Non-commercial Creative Commons License". Such files uploaded before 2005-05-19 may also be speedily deleted if they are not used in any articles'
	});
	if (userIsInGroup('sysop')) {
		result.push({
			label: 'F4: Lack of licensing information',
			value: 'unksource',
			tooltip: 'Files in category "Files with unknown source", "Files with unknown copyright status", or "Files with no copyright tag" that have been tagged with a template that places them in the category for more than seven days, regardless of when uploaded. Note, users sometimes specify their source in the upload summary, so be sure to check the circumstances of the file.'
		});
		result.push({
			label: 'F5: Unused unfree copyrighted file',
			value: 'unfree',
			tooltip: 'Files that are not under a free license or in the public domain that are not used in any article and that have been tagged with a template that places them in a dated subcategory of Category:Orphaned fairuse files for more than seven days. Reasonable exceptions may be made for file uploaded for an upcoming article. Use the "Orphaned fair use" option in Twinkle\'s DI module to tag files for forthcoming deletion.'
		});
		result.push({
			label: 'F6: Missing fair-use rationale',
			value: 'norat',
			tooltip: 'Any file without a fair use rationale may be deleted seven days after it is uploaded.  Boilerplate fair use templates do not constitute a fair use rationale.  Files uploaded before 2006-05-04 should not be deleted immediately; instead, the uploader should be notified that a fair-use rationale is needed.  Files uploaded after 2006-05-04 can be tagged using the "No fair use rationale" option in Twinkle\'s DI module. Such files can be found in the dated subcategories of Category:Files with no fair use rationale.'
		});
	}
	result.push({
		label: 'F7: Clearly invalid fair-use tag',
		value: 'badfairuse',  // same as below
		tooltip: 'This is only for files with a clearly invalid fair-use tag, such as a {{Non-free logo}} tag on a photograph of a mascot. For cases that require a waiting period (replaceable images or otherwise disputed rationales), use the options on Twinkle\'s DI tab.'
	});
	if (!multiple) {
		result.push({
			label: 'F7: Fair-use media from a commercial image agency which is not the subject of sourced commentary',
			value: 'badfairuse',  // same as above
			tooltip: 'Non-free images or media from a commercial source (e.g., Associated Press, Getty), where the file itself is not the subject of sourced commentary, are considered an invalid claim of fair use and fail the strict requirements of WP:NFCC.'
		});
	}
	if (!multiple) {
		result.push({
			label: 'F8: File available as an identical or higher-resolution copy on Wikimedia Commons',
			value: 'nowcommons',
			tooltip: 'Provided the following conditions are met: 1: The file format of both images is the same. 2: The file\'s license and source status is beyond reasonable doubt, and the license is undoubtedly accepted at Commons. 3: All information on the file description page is present on the Commons file description page. That includes the complete upload history with links to the uploader\'s local user pages. 4: The file is not protected, and the file description page does not contain a request not to move it to Commons. 5: If the file is available on Commons under a different name than locally, all local references to the file must be updated to point to the title used at Commons. 6: For {{c-uploaded}} files: They may be speedily deleted as soon as they are off the Main Page'
		});
	}
	result.push({
		label: 'F9: Unambiguous copyright infringement',
		value: 'imgcopyvio',
		tooltip: 'The file was copied from a website or other source that does not have a license compatible with Wikipedia, and the uploader neither claims fair use nor makes a credible assertion of permission of free use. Sources that do not have a license compatible with Wikipedia include stock photo libraries such as Getty Images or Corbis. Non-blatant copyright infringements should be discussed at Wikipedia:Files for deletion'
	});
	result.push({
		label: 'F10: Useless media file',
		value: 'badfiletype',
		tooltip: 'Files uploaded that are neither image, sound, nor video files (e.g. .doc, .pdf, or .xls files) which are not used in any article and have no foreseeable encyclopedic use'
	});
	if (userIsInGroup('sysop')) {
		result.push({
			label: 'F11: No evidence of permission',
			value: 'nopermission',
			tooltip: 'If an uploader has specified a license and has named a third party as the source/copyright holder without providing evidence that this third party has in fact agreed, the item may be deleted seven days after notification of the uploader'
		});
	}
	result.push({
		label: 'G8: File description page with no corresponding file',
		value: 'imagepage',
		tooltip: 'This is only for use when the file doesn\'t exist at all. Corrupt files, and local description pages for files on Commons, should use F2; implausible redirects should use R3; and broken Commons redirects should use G6.'
	});
	return result;
};

Twinkle.speedy.getArticleList = function twinklespeedyGetArticleList(multiple) {
	var result = [];
	result.push({
		label: 'A1: No context. Articles lacking sufficient context to identify the subject of the article.',
		value: 'nocontext',
		tooltip: 'Example: "He is a funny man with a red car. He makes people laugh." This applies only to very short articles. Context is different from content, treated in A3, below.'
	});
	result.push({
		label: 'A2: Foreign language articles that exist on another Wikimedia project',
		value: 'foreign',
		tooltip: 'If the article in question does not exist on another project, the template {{notenglish}} should be used instead. All articles in a non-English language that do not meet this criteria (and do not meet any other criteria for speedy deletion) should be listed at Pages Needing Translation (PNT) for review and possible translation'
	});
	result.push({
		label: 'A3: No content whatsoever',
		value: 'nocontent',
		tooltip: 'Any article consisting only of links elsewhere (including hyperlinks, category tags and "see also" sections), a rephrasing of the title, and/or attempts to correspond with the person or group named by its title. This does not include disambiguation pages'
	});
	result.push({
		label: 'A5: Transwikied articles',
		value: 'transwiki',
		tooltip: 'Any article that has been discussed at Articles for Deletion (et al), where the outcome was to transwiki, and where the transwikification has been properly performed and the author information recorded. Alternately, any article that consists of only a dictionary definition, where the transwikification has been properly performed and the author information recorded'
	});
	result.push({
		label: 'A7: Unremarkable people, groups, companies, web content, and individual animals',
		value: 'a7',
		tooltip: 'An article about a real person, group of people, band, club, company, web content, or individual animal that does not assert the importance or significance of its subject. If controversial, or if there has been a previous AfD that resulted in the article being kept, the article should be nominated for AfD instead'
	});
	if (!multiple) {
		result.push({
			label: 'A7: Unremarkable person',
			value: 'person',
			tooltip: 'An article about a real person that does not assert the importance or significance of its subject. If controversial, or if there has been a previous AfD that resulted in the article being kept, the article should be nominated for AfD instead'
		});
		result.push({
			label: 'A7: Unremarkable musician(s) or band',
			value: 'band',
			tooltip: 'Article about a band, singer, musician, or musical ensemble that does not assert the importance or significance of the subject'
		});
		result.push({
			label: 'A7: Unremarkable club',
			value: 'club',
			tooltip: 'Article about a club that does not assert the importance or significance of the subject'
		});
		result.push({
			label: 'A7: Unremarkable company or organization',
			value: 'corp',
			tooltip: 'Article about a company or organization that does not assert the importance or significance of the subject'
		});
		result.push({
			label: 'A7: Unremarkable website or web content',
			value: 'web',
			tooltip: 'Article about a web site, blog, online forum, webcomic, podcast, or similar web content that does not assert the importance or significance of its subject'
		});
		result.push({
			label: 'A7: Unremarkable individual animal',
			value: 'animal',
			tooltip: 'Article about an individual animal (e.g. pet) that does not assert the importance or significance of its subject'
		});
	}
	result.push({
		label: 'A9: Unremarkable musical recording where artist\'s article doesn\'t exist',
		value: 'a9',
		tooltip: 'An article about a musical recording which does not indicate why its subject is important or significant, and where the artist\'s article has never existed or has been deleted'
	});
	result.push({
		label: 'A10: Recently created article that duplicates an existing topic',
		value: 'a10',
		tooltip: 'A recently created article with no relevant page history that does not aim to expand upon, detail or improve information within any existing article(s) on the subject, and where the title is not a plausible redirect. This does not include content forks, split pages or any article that aims at expanding or detailing an existing one.'
	});
	return result;
};

Twinkle.speedy.categoryList = [
	{
		label: 'C1: Empty categories',
		value: 'catempty',
		tooltip: '(no articles or subcategories for at least four days) whose only content has consisted of links to parent categories. This does not apply to categories being discussed on WP:CFD or WP:SFD, or disambiguation categories. If the category isn\'t relatively new, it possibly contained articles earlier, and deeper investigation is needed'
	},
	{
		label: 'G8: Categories populated by a deleted or retargeted template',
		value: 'templatecat',
		tooltip: 'If a template which includes pages in a category has been deleted, the associated category can be deleted. This excludes categories that are still in use.'
	}
];

Twinkle.speedy.userList = [
	{
		label: 'U1: User request',
		value: 'userreq',
		tooltip: 'Personal subpages, upon request by their user. In some rare cases there may be administrative need to retain the page. Also, sometimes, main user pages may be deleted as well. See Wikipedia:User page for full instructions and guidelines'
	},
	{
		label: 'U2: Nonexistent user',
		value: 'nouser',
		tooltip: 'User pages of users that do not exist (Check Special:Listusers)'
	},
	{
		label: 'U3: Non-free galleries',
		value: 'gallery',
		tooltip: 'Galleries in the userspace which consist mostly of "fair use" or non-free files. Wikipedia\'s non-free content policy forbids users from displaying non-free files, even ones they have uploaded themselves, in userspace. It is acceptable to have free files, GFDL-files, Creative Commons and similar licenses along with public domain material, but not "fair use" files'
	}
];

Twinkle.speedy.getTemplateList = function twinklespeedyGetTemplateList(multiple) {
	var result = [];
	result.push({
		label: 'T2: Templates that are blatant misrepresentations of established policy',
		value: 'policy',
		tooltip: 'This includes "speedy deletion" templates for issues that are not speedy deletion criteria and disclaimer templates intended to be used in articles'
	});
	if (!multiple) {
		result.push({
			label: 'T3: Templates that are not employed in any useful fashion',
			value: 't3',
			tooltip: 'Templates that are either substantial duplications of another template or hardcoded instances of another template where the same functionality could be provided by that other template'
		});
	}
	return result;
};

Twinkle.speedy.getPortalList = function twinklespeedyGetPortalList(multiple) {
	var result = [];
	if (!multiple) {
		result.push({
			label: 'P1: Portal that would be subject to speedy deletion if it were an article',
			value: 'p1',
			tooltip: 'You must specify the article criterion that applies in this case (A1, A3, A7, or A10).'
		});
	}
	result.push({
		label: 'P2: Underpopulated portal',
		value: 'emptyportal',
		tooltip: 'Any Portal based on a topic for which there is not a non-stub header article, and at least three non-stub articles detailing subject matter that would be appropriate to discuss under the title of that Portal'
	});
	return result;
};

Twinkle.speedy.getGeneralList = function twinklespeedyGetGeneralList(multiple) {
	var result = [];
	if (!multiple) {
		result.push({
			label: 'Custom rationale' + (userIsInGroup('sysop') ? ' (custom deletion reason)' : ' using {'+'{db}} template'),
			value: 'reason',
			tooltip: '{'+'{db}} is short for "delete because". At least one of the other deletion criteria must still apply to the page, and you should (must?) make mention of this in your rationale. This is not a "catch-all" for when you can\'t find any criteria that fit.'
		});
	}
	result.push({
		label: 'G1: Patent nonsense. Pages consisting purely of incoherent text or gibberish with no meaningful content or history.',
		value: 'nonsense',
		tooltip: 'This does not include poor writing, partisan screeds, obscene remarks, vandalism, fictional material, material not in English, poorly translated material, implausible theories, or hoaxes. In short, if you can understand it, G1 does not apply.'
	});
	result.push({
		label: 'G2: Test page',
		value: 'test',
		tooltip: 'A page created to test editing or other Wikipedia functions. Pages in the User namespace are not included, nor are valid but unused or duplicate templates (although criterion T3 may apply).'
	});
	result.push({
		label: 'G3: Pure vandalism',
		value: 'vandalism',
		tooltip: 'Plain pure vandalism (including redirects left behind from pagemove vandalism)'
	});
	if (!multiple) {
		result.push({
			label: 'G3: Blatant hoax',
			value: 'hoax',
			tooltip: 'Blatant and obvious hoax, to the point of vandalism'
		});
	}
	result.push({
		label: 'G4: Recreation of material deleted via a deletion discussion',
		value: 'repost',
		tooltip: 'A copy, by any title, of a page that was deleted via an XfD process or Deletion review, provided that the copy is substantially identical to the deleted version. This clause does not apply to content that has been "userfied", to content undeleted as a result of Deletion review, or if the prior deletions were proposed or speedy deletions, although in this last case, other speedy deletion criteria may still apply'
	});
	result.push({
		label: 'G5: Banned user',
		value: 'banned',
		tooltip: 'Pages created by banned users while they were banned'
	});
	if (!multiple) {
		result.push({
			label: 'G6: History merge',
			value: 'histmerge',
			tooltip: 'Temporarily deleting a page in order to merge page histories'
		});
		result.push({
			label: 'G6: Move',
			value: 'move',
			tooltip: 'Making way for a noncontroversial move like reversing a redirect'
		});
		result.push({
			label: 'G6: XfD',
			value: 'xfd',
			tooltip: 'An admin has closed a deletion discussion (at AfD, FfD, RfD, TfD, CfD, SfD, or MfD) as "delete", but they didn\'t actually delete the page.'
		});
		result.push({
			label: 'G6: Unnecessary disambiguation page',
			value: 'disambig',
			tooltip: 'This only applies for orphaned disambiguation pages which either: (1) disambiguate two or fewer existing Wikipedia pages and whose title ends in "(disambiguation)" (i.e., there is a primary topic); or (2) disambiguates no (zero) existing Wikipedia pages, regardless of its title.'
		});
		result.push({
			label: 'G6: Redirect to malplaced disambiguation page',
			value: 'movedab',
			tooltip: 'This only applies for redirects to disambiguation pages ending in (disambiguation) where a primary topic does not exist.'
		});
		result.push({
			label: 'G6: Copy-and-paste page move',
			value: 'copypaste',
			tooltip: 'This only applies for a copy-and-paste page move of another page that needs to be temporarily deleted to make room for a clean page move.'
		});
	}
	result.push({
		label: 'G6: Housekeeping',
		value: 'g6',
		tooltip: 'Other non-controversial "housekeeping" tasks'
	});
	result.push({
		label: 'G7: Author requests deletion, or author blanked',
		value: 'author',
		tooltip: 'Any page for which deletion is requested by the original author in good faith, provided the page\'s only substantial content was added by its author. If the author blanks the page, this can also be taken as a deletion request.'
	});
	result.push({
		label: 'G8: Pages dependent on a non-existent or deleted page',
		value: 'g8',
		tooltip: 'such as talk pages with no corresponding subject page; subpages with no parent page; file pages without a corresponding file; redirects to invalid targets, such as nonexistent targets, redirect loops, and bad titles; or categories populated by deleted or retargeted templates. This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.'
	});
	if (!multiple) {
		result.push({
			label: 'G8: Subpages with no parent page',
			value: 'subpage',
			tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.'
		});
	}
	result.push({
		label: 'G10: Attack page',
		value: 'attack',
		tooltip: 'Pages that serve no purpose but to disparage their subject or some other entity (e.g., "John Q. Doe is an imbecile"). This includes a biography of a living person that is negative in tone and unsourced, where there is no NPOV version in the history to revert to. Administrators deleting such pages should not quote the content of the page in the deletion summary!'
	});
	if (!multiple) {
		result.push({
			label: 'G10: Wholly negative, unsourced BLP',
			value: 'negublp',
			tooltip: 'A biography of a living person that is entirely negative in tone and unsourced, where there is no neutral version in the history to revert to.'
		});
	}
	result.push({
		label: 'G11: Unambiguous advertising',
		value: 'spam',
		tooltip: 'Pages which exclusively promote a company, product, group, service, or person and which would need to be fundamentally rewritten in order to become encyclopedic. Note that an article about a company or a product which describes its subject from a neutral point of view does not qualify for this criterion; an article that is blatant advertising should have inappropriate content as well'
	});
	result.push({
		label: 'G12: Unambiguous copyright infringement',
		value: 'copyvio',
		tooltip: 'Either: (1) Material was copied from another website that does not have a license compatible with Wikipedia, or is photography from a stock photo seller (such as Getty Images or Corbis) or other commercial content provider; (2) There is no non-infringing content in the page history worth saving; or (3) The infringement was introduced at once by a single person rather than created organically on wiki and then copied by another website such as one of the many Wikipedia mirrors'
	});
	return result;
};

Twinkle.speedy.redirectList = [
	{
		label: 'R2: Redirects from mainspace to any other namespace except the Category:, Template:, Wikipedia:, Help: and Portal: namespaces',
		value: 'rediruser',
		tooltip: '(this does not include the Wikipedia shortcut pseudo-namespaces). If this was the result of a page move, consider waiting a day or two before deleting the redirect'
	},
	{
		label: 'R3: Redirects as a result of an implausible typo that were recently created',
		value: 'redirtypo',
		tooltip: 'However, redirects from common misspellings or misnomers are generally useful, as are redirects in other languages'
	},
	{
		label: 'G8: Redirects to invalid targets, such as nonexistent targets, redirect loops, and bad titles',
		value: 'redirnone',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.'
	}
];

Twinkle.speedy.normalizeHash = {
	'reason': 'db',
	'multiple': 'multiple',
	'multiple-finish': 'multiple-finish',
	'nonsense': 'g1',
	'test': 'g2',
	'vandalism': 'g3',
	'hoax': 'g3',
	'repost': 'g4',
	'banned': 'g5',
	'histmerge': 'g6',
	'move': 'g6',
	'xfd': 'g6',
	'disambig': 'g6',
	'movedab': 'g6',
	'copypaste': 'g6',
	'g6': 'g6',
	'author': 'g7',
	'g8': 'g8',
	'talk': 'g8',
	'subpage': 'g8',
	'redirnone': 'g8',
	'templatecat': 'g8',
	'attack': 'g10',
	'negublp': 'g10',
	'spam': 'g11',
	'copyvio': 'g12',
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
	'a9': 'a9',
	'a10': 'a10',
	'rediruser': 'r2',
	'redirtypo': 'r3',
	'redundantimage': 'f1',
	'noimage': 'f2',
	'fpcfail': 'f2',
	'noncom': 'f3',
	'unksource': 'f4',
	'unfree': 'f5',
	'norat': 'f6',
	'badfairuse': 'f7',
	'nowcommons': 'f8',
	'imgcopyvio': 'f9',
	'badfiletype': 'f10',
	'nopermission': 'f11',
	'catempty': 'c1',
	'userreq': 'u1',
	'nouser': 'u2',
	'gallery': 'u3',
	'policy':'t2',
	't3': 't3',
	'p1': 'p1',
	'emptyportal': 'p2'
};

// keep this synched with [[MediaWiki:Deletereason-dropdown]]
Twinkle.speedy.reasonHash = {
	'reason': '',
// General
	'nonsense': '[[WP:PN|Patent nonsense]], meaningless, or incomprehensible',
	'test': 'Test page',
	'vandalism': '[[WP:Vandalism|Vandalism]]',
	'hoax': 'Blatant [[WP:Do not create hoaxes|hoax]]',
	'repost': 'Recreation of a page that was [[WP:DEL|deleted]] per a [[WP:XFD|deletion discussion]]',
	'banned': 'Creation by a [[WP:BLOCK|blocked]] or [[WP:BAN|banned]] user in violation of block or ban',
	'histmerge': 'Temporary deletion in order to merge page histories',
	'move': 'Making way for a non-controversial move',
	'xfd': 'Deleting page per result of [[WP:XfD|deletion discussion]]',
	'disambig': 'Unnecessary disambiguation page',
	'movedab': 'Redirect to [[WP:MALPLACED|malplaced disambiguation page]]',
	'copypaste': '[[WP:CPMV|Copy-and-paste]] page move',
	'g6': 'Housekeeping and routine (non-controversial) cleanup',
	'author': 'One author who has requested deletion or blanked the page',
	'g8': 'Page dependent on a deleted or nonexistent page',
	'talk': '[[Help:Talk page|Talk page]] of a deleted or nonexistent page',
	'subpage': '[[WP:Subpages|Subpage]] of a deleted or nonexistent page',
	'redirnone': '[[Wikipedia:Redirect|redirect]] to a deleted or nonexistent page',
	'templatecat': 'Populated by deleted or retargeted templates',
	'attack': '[[WP:ATP|Attack page]] or negative unsourced [[WP:BLP|BLP]]',
	'negublp': 'Negative unsourced [[WP:BLP|BLP]]',
	'spam': 'Unambiguous [[WP:ADS|advertising]] or promotion',
	'copyvio': 'Unambiguous [[WP:C|copyright infringement]]',
// Articles
	'nocontext': 'Not enough context to identify article\'s subject',
	'foreign': 'Article in a foreign language that exists on another project',
	'nocontent': 'Article that has no meaningful, substantive content',
	'transwiki': 'Article that has been transwikied to another project',
	'a7': 'No explanation of the subject\'s significance (real person, animal, organization, or web content)',
	'person' : 'No explanation of the subject\'s significance (real person)',
	'web': 'No explanation of the subject\'s significance (web content)',
	'corp': 'No explanation of the subject\'s significance (organization)',
	'club': 'No explanation of the subject\'s significance (organization)',
	'band': 'No explanation of the subject\'s significance (band/musician)',
	'animal': 'No explanation of the subject\'s significance (individual animal)',
	'a9': 'Music recording by redlinked artist and no indication of importance or significance',
	'a10': 'Recently created article that duplicates an existing topic',
// Images and media
	'redundantimage': 'File  redundant to another on Wikipedia',
	'noimage': 'Corrupt or empty file, or a file description page for a file on Commons',
	'noncom': 'File with improper license',
	'unksource': 'Lack of licensing information',
	'unfree': 'Unused non-free media',
	'norat': 'Non-free file without [[WP:RAT|fair-use rationale]]',
	'badfairuse': '[[WP:NFCC|Invalid]] fair-use claim',
	'nowcommons': 'Media file available on Commons',
	'imgcopyvio': 'File [[WP:COPYVIO|copyright violation]]',
	'badfiletype': 'Useless media file',
	'nopermission': 'No evidence of permission',
// Categories
	'catempty': 'Empty category',
// User pages
	'userreq': 'User request to delete page in own userspace',
	'nouser': 'Userpage or subpage of a nonexistent user',
	'gallery': '[[WP:NFC|Non-free]] [[Help:Gallery|gallery]]',
// Templates
	'policy': 'Template that unambiguously misrepresents established policy',
	't3': 'Unused, redundant template',
// Portals
	'p1': '[[WP:P|Portal]] page that would be subject to speedy deletion as an article',
	'emptyportal': '[[WP:P|Portal]] without a substantial topic base',
// Redirects
	'rediruser': 'Cross-[[WP:NS|namespace]] [[WP:R|redirect]] from mainspace',
	'redirtypo': 'Recently created, implausible [[WP:R|redirect]]'
};

Twinkle.speedy.callbacks = {
	sysop: {
		main: function( params ) {
			var thispage = new Wikipedia.page( mw.config.get('wgPageName'), "Deleting page" );

			// delete page
			var reason;
			if (params.normalized === 'db') {
				reason = prompt("Enter the deletion summary to use, which will be entered into the deletion log:", "");
			} else {
				var presetReason = "[[WP:CSD#" + params.normalized.toUpperCase() + "|" + params.normalized.toUpperCase() + "]]: " + params.reason;
				if (Twinkle.getPref("promptForSpeedyDeletionSummary").indexOf(params.normalized) !== -1) {
					reason = prompt("Enter the deletion summary to use, or press OK to accept the automatically generated one.", presetReason);
				} else {
					reason = presetReason;
				}
			}
			if (!reason || !reason.replace(/^\s*/, "").replace(/\s*$/, "")) {
				Status.error("Asking for reason", "you didn't give one.  I don't know... what with admins and their apathetic antics... I give up...");
				return;
			}
			thispage.setEditSummary( reason + Twinkle.getPref('deletionSummaryAd') );
			thispage.deletePage();

			// delete talk page
			if (params.deleteTalkPage &&
			    params.normalized !== 'f8' &&
			    document.getElementById( 'ca-talk' ).className !== 'new') {
				var talkpage = new Wikipedia.page( Wikipedia.namespaces[ mw.config.get('wgNamespaceNumber') + 1 ] + ':' + mw.config.get('wgTitle'), "Deleting talk page" );
				talkpage.setEditSummary('[[WP:CSD#G8|G8]]: Talk page of deleted page [[' + mw.config.get('wgPageName') + "]]. " + Twinkle.getPref('deletionSummaryAd'));
				talkpage.deletePage();
			}

			// promote Unlink tool
			var $link, $bigtext;
			if( mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'f8' ) {
				$link = $('<a/>', {
					'href': '#',
					'text': 'click here to go to the Unlink tool',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function(){
						Wikipedia.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("Removing usages of and/or links to deleted file " + mw.config.get('wgPageName'));
					}
				});
				$bigtext = $('<span/>', {
					'text': 'To orphan backlinks and remove instances of file usage',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f8') {
				$link = $('<a/>', {
					'href': '#',
					'text': 'click here to go to the Unlink tool',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function(){
						Wikipedia.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("Removing links to deleted page " + mw.config.get('wgPageName'));
					}
				});
				$bigtext = $('<span/>', {
					'text': 'To orphan backlinks',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Status.info($bigtext[0], $link[0]);
			}

			// open talk page of first contributor
			if( params.openusertalk ) {
				thispage = new Wikipedia.page( mw.config.get('wgPageName') );  // a necessary evil, in order to clear incorrect Status.text
				thispage.setCallbackParameters( params );
				thispage.lookupCreator( Twinkle.speedy.callbacks.sysop.openUserTalkPage );
			}

			// delete redirects
			if (params.deleteRedirects) {
				var query = {
					'action': 'query',
					'list': 'backlinks',
					'blfilterredir': 'redirects',
					'bltitle': mw.config.get('wgPageName'),
					'bllimit': 5000  // 500 is max for normal users, 5000 for bots and sysops
				};
				var wikipedia_api = new Wikipedia.api( 'getting list of redirects...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Status( 'Deleting redirects' ) );
				wikipedia_api.params = params;
				wikipedia_api.post();
			}
		},
		openUserTalkPage: function( pageobj ) {
			pageobj.getStatusElement().unlink();  // don't need it anymore
			var user = pageobj.getCreator();
			var statusIndicator = new Status('Opening user talk page edit form for ' + user, 'opening...');

			var query = {
				'title': 'User talk:' + user,
				'action': 'edit',
				'preview': 'yes',
				'vanarticle': mw.config.get('wgPageName').replace(/_/g, ' ')
			};
			switch( Twinkle.getPref('userTalkPageMode') ) {
			case 'tab':
				window.open( mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/index.php?' + QueryString.create( query ), '_tab' );
				break;
			case 'blank':
				window.open( mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/index.php?' + QueryString.create( query ), '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			case 'window':
				/* falls through */
				default :
				window.open( mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/index.php?' + QueryString.create( query ), 'twinklewarnwindow', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			}

			statusIndicator.info( 'complete' );
		},
		deleteRedirectsMain: function( apiobj ) {
			var xmlDoc = apiobj.getXML();
			var $snapshot = $(xmlDoc).find('backlinks bl');

			var total = $snapshot.length;

			if( !total ) {
				return;
			}

			var statusIndicator = apiobj.statelem;
			statusIndicator.status("0%");

			var onsuccess = function( apiobj ) {
				var obj = apiobj.params.obj;
				var total = apiobj.params.total;
				var now = parseInt( 100 * ++(apiobj.params.current)/total, 10 ) + '%';
				obj.update( now );
				apiobj.statelem.unlink();
				if( apiobj.params.current >= total ) {
					obj.info( now + ' (completed)' );
					Wikipedia.removeCheckpoint();
				}
			};

			Wikipedia.addCheckpoint();

			var params = $.extend( {}, apiobj.params );
			params.current = 0;
			params.total = total;
			params.obj = statusIndicator;

			$snapshot.each(function(key, value) {
				var title = $(value).attr('title');
				var page = new Wikipedia.page(title, 'Deleting redirect "' + title + '"');
				page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page [[' + mw.config.get('wgPageName') + "]]." + Twinkle.getPref('deletionSummaryAd'));
				page.deletePage(onsuccess);
			});
		}
	},





	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error( "It seems that the page doesn't exist; perhaps it has already been deleted" );
				return;
			}

			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			statelem.status( 'Checking for tags on the page...' );

			// check for existing deletion tags
			var tag = /(?:\{\{\s*(db|delete|db-.*?)(?:\s*\||\s*\}\}))/.exec( text );
			if( tag ) {
				statelem.error( [ htmlNode( 'strong', tag[1] ) , " is already placed on the page." ] );
				return;
			}

			var xfd = /(?:\{\{([rsaiftcm]fd|md1)[^{}]*?\}\})/i.exec( text );
			if( xfd && !confirm( "The deletion-related template {{" + xfd[1] + "}} was found on the page. Do you still want to add a CSD template?" ) ) {
				return;
			}

			var code, parameters, i;
			if (params.normalized === 'multiple')
			{
				code = "{{db-multiple";
				for (i in Twinkle.speedy.dbmultipleCriteria) {
					if (typeof Twinkle.speedy.dbmultipleCriteria[i] === 'string') {
						code += "|" + Twinkle.speedy.dbmultipleCriteria[i].toUpperCase();
					}
				}
				for (i in Twinkle.speedy.dbmultipleParameters) {
					if (typeof Twinkle.speedy.dbmultipleParameters[i] === 'string') {
						code += "|" + i + "=" + Twinkle.speedy.dbmultipleParameters[i];
					}
				}
				code += "}}";
				params.utparams = [];
			}
			else
			{
				parameters = Twinkle.speedy.getParameters(params.value, params.normalized, statelem);
				if (!parameters) {
					return;  // the user aborted
				}
				code = "{{db-" + params.value;
				for (i in parameters) {
					if (typeof parameters[i] === 'string') {
						code += "|" + i + "=" + parameters[i];
					}
				}
				code += "}}";
				params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalized, parameters);
			}

			var thispage = new Wikipedia.page(mw.config.get('wgPageName'));
			// patrol the page, if reached from Special:NewPages
			if( Twinkle.getPref('markSpeedyPagesAsPatrolled') ) {
				thispage.patrol();
			}

			// Notification to first contributor
			if (params.usertalk) {
				var callback = function(pageobj) {
					var initialContrib = pageobj.getCreator();

					// don't notify users when their user talk page is nominated
					if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
						Status.warn("Notifying initial contributor: this user created their own user talk page; skipping notification"); 
						return;
					}

					var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
					var notifytext;

					// specialcase "db" and "db-multiple"
					switch (params.normalized)
					{
						case 'db':
							notifytext = "\n\n{{subst:db-reason-notice|1=" + mw.config.get('wgPageName');
							break;
						case 'multiple':
							notifytext = "\n\n{{subst:db-notice-multiple|1=" + mw.config.get('wgPageName');
							break;
						default:
							notifytext = "\n\n{{subst:db-csd-notice-custom|1=" + mw.config.get('wgPageName') + "|2=" + params.value;
							break;
					}
					for (var i in params.utparams) {
						if (typeof params.utparams[i] === 'string') {
							notifytext += "|" + i + "=" + params.utparams[i];
						}
					}
					notifytext += (params.welcomeuser ? "" : "|nowelcome=yes") + "}} ~~~~";

					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary("Notification: speedy deletion nomination of [[" + mw.config.get('wgPageName') + "]]." + Twinkle.getPref('summaryAd'));
					usertalkpage.setCreateOption('recreate');
					usertalkpage.setFollowRedirect(true);
					usertalkpage.append();

					// add this nomination to the user's userspace log, if the user has enabled it
					if (params.lognomination) {
						Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
					}
				};
				thispage.lookupCreator(callback);
			}
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}

			// Wrap SD template in noinclude tags if we are in template space.
			// Won't work with userboxes in userspace, or any other transcluded page outside template space
			if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
				code = "<noinclude>" + code + "</noinclude>";
			}

			// Remove tags that become superfluous with this action
			text = text.replace(/\{\{\s*(New unreviewed article|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
			if (mw.config.get('wgNamespaceNumber') === 6) {
				// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
				text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*}}/gi, "");
			}

			// Generate edit summary for edit
			var editsummary;
			switch (params.normalized)
			{
				case 'db':
					editsummary = 'Requesting [[WP:CSD|speedy deletion]] with rationale \"' + parameters["1"] + '\".';
					break;
				case 'multiple':
					editsummary = 'Requesting speedy deletion (';
					for (i in Twinkle.speedy.dbmultipleCriteria) {
						if (typeof Twinkle.speedy.dbmultipleCriteria[i] === 'string') {
							editsummary += '[[WP:CSD#' + Twinkle.speedy.dbmultipleCriteria[i].toUpperCase() + '|CSD ' + Twinkle.speedy.dbmultipleCriteria[i].toUpperCase() + ']], ';
						}
					}
					editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
					editsummary += ').';
					break;
				case 'g6':
					if (params.value === 'histmerge') {
						editsummary = "Requesting history merge with [[" + parameters["1"] + "]] ([[WP:CSD#G6|CSD G6]]).";
						break;
					}
					/* falls through */
				default:
					editsummary = "Requesting speedy deletion ([[WP:CSD#" + params.normalized.toUpperCase() + "|CSD " + params.normalized.toUpperCase() + "]]).";
					break;
			}

			pageobj.setPageText(code + ((params.normalized === 'g10' || Twinkle.speedy.dbmultipleCriteria.indexOf('g10') !== -1) ?
					'' : ("\n" + text) )); // cause attack pages to be blanked
			pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			pageobj.setWatchlist(params.watch);
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},

		// note: this code is also invoked from twinkleimage
		// the params used are:
		//   for all: params.normalized
		//   for CSD: params.value
		//   for DI: params.fromDI = true, params.type
		addToLog: function(params, initialContrib) {
			var wikipedia_page = new Wikipedia.page("User:" + mw.config.get('wgUserName') + "/" + Twinkle.getPref('speedyLogPageName'), "Adding entry to userspace log");
			params.logInitialContrib = initialContrib;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.speedy.callbacks.user.saveLog);
		},

		saveLog: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// add blurb if log page doesn't exist
			if (!pageobj.exists()) {
				text =
					"This is a log of all [[WP:CSD|speedy deletion]] nominations made by this user using [[WP:TW|Twinkle]]'s CSD module.\n\n" +
					"If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and " +
					"nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].\n";
				if (userIsInGroup("sysop")) {
					text += "\nThis log does not track outright speedy deletions made using Twinkle.\n";
				}
			}

			// create monthly header
			var date = new Date();
			var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
			if (!headerRe.exec(text)) {
				text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
			}

			text += "\n# [[:" + mw.config.get('wgPageName') + "]]: ";
			if (params.fromDI) {
				text += "DI [[WP:CSD#" + params.normalized.toUpperCase() + "|CSD " + params.normalized.toUpperCase() + "]] (" + params.type + ")";
			} else {
				switch (params.normalized)
				{
					case 'db':
						text += "{{tl|db-reason}}";
						break;
					case 'multiple':
						text += "multiple criteria (";
						for (var i in Twinkle.speedy.dbmultipleCriteria) {
							if (typeof Twinkle.speedy.dbmultipleCriteria[i] === 'string') {
								text += '[[WP:CSD#' + Twinkle.speedy.dbmultipleCriteria[i].toUpperCase() + '|' + Twinkle.speedy.dbmultipleCriteria[i].toUpperCase() + ']], ';
							}
						}
						text = text.substr(0, text.length - 2);  // remove trailing comma
						text += ')';
						break;
					default:
						text += "[[WP:CSD#" + params.normalized.toUpperCase() + "|CSD " + params.normalized.toUpperCase() + "]] ({{tl|db-" + params.value + "}})";
						break;
				}
			}

			if (params.logInitialContrib) {
				text += "; notified {{user|" + params.logInitialContrib + "}}";
			}
			text += " ~~~~~\n";

			pageobj.setPageText(text);
			pageobj.setEditSummary("Logging speedy deletion nomination of [[" + mw.config.get('wgPageName') + "]]." + Twinkle.getPref('summaryAd'));
			pageobj.setCreateOption("recreate");
			pageobj.save();
		}
	}
};

// prompts user for parameters to be passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(value, normalized, statelem)
{
	var parameters = [];
	switch( normalized ) {
		case 'db':
			var dbrationale = prompt('Please enter a mandatory rationale.   \n\"This page qualifies for speedy deletion because:\"', "");
			if (!dbrationale || !dbrationale.replace(/^\s*/, "").replace(/\s*$/, ""))
			{
				statelem.error( 'You must specify a rationale.  Aborted by user.' );
				return null;
			}
			parameters["1"] = dbrationale;
			break;
		case 'u1':
			if (mw.config.get('wgNamespaceNumber') === 3 && !((/\//).test(mw.config.get('wgTitle'))))
			{
				var u1rationale = prompt('Please provide a mandatory rationale to explain why this user talk page should be deleted:', "");
				if (!u1rationale || !u1rationale.replace(/^\s*/, "").replace(/\s*$/, ""))
				{
					statelem.error( 'You must specify a rationale.  Aborted by user.' );
					return null;
				}
				parameters.rationale = u1rationale;
			}
			break;
		case 'f8':
			var pagenamespaces = mw.config.get('wgPageName').replace( '_', ' ' );
			var filename = prompt( 'Please enter the name of the file on Commons:', pagenamespaces );
			if (filename === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			if (filename !== '' && filename !== pagenamespaces)
			{
				if (filename.indexOf("Image:") === 0 || filename.indexOf("File:") === 0)
				{
					parameters["1"] = filename;
				}
				else
				{
					statelem.error("The File: prefix was missing from the image filename.  Aborted.");
					return null;
				}
			}
			parameters.date = "~~~~~";
			break;
		case 'g4':
			var deldisc = prompt( 'Please enter the name of the page where the deletion discussion took place.  \nNOTE: For regular AfD and MfD discussions, just click OK - a link will be automatically provided.', "" );
			if (deldisc === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			if (deldisc !== "" && deldisc.substring(0, 9) !== "Wikipedia" && deldisc.substring(0, 3) !== "WP:")
			{
				statelem.error( 'The deletion discussion page name, if provided, must start with "Wikipedia:".  Cannot proceed.' );
				return null;
			}
			parameters["1"] = deldisc;
			break;
		case 'g5':
			var banneduser = prompt( 'Please enter the username of the banned user if available:', "" );
			if (banneduser === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			parameters["1"] = banneduser;
			break;	
		case 'g6':
			switch( value ) {
				case 'histmerge':
					var mergetitle = prompt( 'Please enter the title to merge into:', "" );
					if (mergetitle === null)
					{
						statelem.error( 'Aborted by user.' );
						return null;
					}
					parameters["1"] = mergetitle;
					break;
				case 'move':
					var title = prompt( 'Please enter the title of the page to be moved here:', "" );
					if (title === null)
					{
						statelem.error( 'Aborted by user.' );
						return null;
					}
					var reason = prompt( 'Please enter the reason for the page move:', "" );
					if (reason === null)
					{
						statelem.error( 'Aborted by user.' );
						return null;
					}
					parameters["1"] = title;
					parameters["2"] = reason;
					break;
				case 'xfd':
					var votepage = prompt( 'If the title of the discussion is different than the title of the page, and it is not an SfD discussion or a page where the discussion is not where it is expected to be, please enter the title of the discussion here (leave empty to skip):', "" );
					if (votepage === null)
					{
						statelem.error( 'Aborted by user.' );
						return null;
					}
					if (votepage === '')
					{
						var fullvotepage = prompt( 'For SfD discussions and pages where discussions are not where they are expected to be, please enter the full title of the discussion, including the namespace, here: (leave empty to skip):', "" );
						if (fullvotepage === null)
						{
						statelem.error( 'Aborted by user.' );
						return null;
						}
					}
					if (votepage !== '') {
						parameters.votepage = votepage;
					}
					if (fullvotepage !== '') {
						parameters.fullvotepage = fullvotepage;
					}
					if (confirm('If this page is a redirect that was discussed at RfD, click OK. Otherwise, click Cancel.')) {
						parameters.redirect = "yes";
					}
					break;
				case 'copypaste':
					var copytitle = prompt( 'Please enter the title of the original page that was copy-pasted here:', "" );
					if (copytitle === null)
					{
						statelem.error( 'Aborted by user.' );
						return null;
					}
					parameters["1"] = copytitle;
					break;
				case 'g6':
					var g6rationale = prompt( 'Please provide an optional rationale (leave empty to skip):', "" );
					if (g6rationale === null)
					{
						statelem.error( 'Aborted by user.' );
						return null;
					}
					if (g6rationale !== '')
					{
						parameters.rationale = g6rationale;
					}
					break;
				default:
					break;
			}
			break;
		case 'g7':
			if (Twinkle.getPref('speedyPromptOnG7'))
			{
				var g7rationale = prompt('Please provide an optional rationale (perhaps linking to where the author requested this deletion - leave empty to skip):', "");
				if (g7rationale === null)
				{
					statelem.error( 'Aborted by user.' );
					return null;
				}
				if (g7rationale !== '')
				{
					parameters.rationale = g7rationale;
				}
			}
			break;
		case 'g12':
			var url = prompt( 'Please enter the URL if available, including the "http://":', "" );
			if (url === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			parameters.url = url;
			break;
		case 'f9':
			var f9url = prompt( 'Please enter the URL of the copyvio, including the "http://".  \nIf you cannot provide a URL, please do not use CSD F9.  (Exception: for copyvios of non-Internet sources, leave the box blank.)', "" );
			if (f9url === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			parameters.url = f9url;
			break;
		case 'a2':
			var source = prompt('Enter an interwiki link to the article on the foreign-language wiki (for example, "fr:Bonjour"):', "");
			if (source === null)
			{
				statelem.error('Aborted by user.');
				return null;
			}
			parameters.source = source;
			break;
		case 'a10':
			var duptitle = prompt( 'Enter the article name that is duplicated:', "" );
			if (duptitle === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			parameters.article = duptitle;
			break;
		case 'f1':
			var img = prompt( 'Enter the file this is redundant to, excluding the "Image:" or "File:" prefix:', "" );
			if (img === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			parameters.filename = img;
			break;
		case 't3':
			var template = prompt( 'Enter the template this is redundant to, excluding the "Template:" prefix:', "" );
			if (template === null)
			{
				statelem.error( 'Aborted by user.' );
				return null;
			}
			parameters["1"] = "~~~~~";
			parameters["2"] = template;
			break;
		case 'g10':
			parameters.blanked = 'yes';
			// it is actually blanked elsewhere in code, but setting the flag here
			break;
		case 'p1':
			var criterion = prompt( 'Enter the code of the article CSD criterion which this portal falls under:   \n\n(A1 = no context, A3 = no content, A7 = non-notable, A10 = duplicate)', "" );
			if (!criterion || !criterion.replace(/^\s*/, "").replace(/\s*$/, ""))
			{
				statelem.error( 'You must enter a criterion.  Aborted by user.' );
				return null;
			}
			parameters["1"] = criterion;
			break;
		default:
			break;
	}
	return parameters;
};

// function for processing talk page notification template parameters
Twinkle.speedy.getUserTalkParameters = function twinklespeedyGetUserTalkParameters(normalized, parameters)
{
	var utparams = [];
	switch (normalized)
	{
		case 'db':
			utparams["2"] = parameters["1"];
			break;
		case 'a10':
			utparams.key1 = "article";
			utparams.value1 = parameters.article;
			break;
		default:
			break;
	}
	return utparams;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e)
{
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' ')); // for queen/king/whatever and country!

	var tag_only = e.target.form.tag_only;
	if( tag_only && tag_only.checked ) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var value = e.target.values;
	var normalized = Twinkle.speedy.normalizeHash[ value ];

	var params = {
		value: value,
		normalized: normalized,
		watch: Twinkle.getPref('watchSpeedyPages').indexOf( normalized ) !== -1,
		reason: Twinkle.speedy.reasonHash[ value ],
		openusertalk: Twinkle.getPref('openUserTalkPageOnSpeedyDelete').indexOf( normalized ) !== -1,
		deleteTalkPage: e.target.form.talkpage && e.target.form.talkpage.checked,
		deleteRedirects: e.target.form.redirects.checked
	};
	Status.init( e.target.form );

	Twinkle.speedy.callbacks.sysop.main( params );
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' '));  // for queen/king/whatever and country!
	var value = e.target.values;

	if (value === 'multiple')
	{
		e.target.form.style.display = "none"; // give the user a cue that the dialog is being changed
		setTimeout(function() {
			Twinkle.speedy.initDialog(Twinkle.speedy.callback.doMultiple, false, e.target.form.parentNode);
		}, 150);
		return;
	}

	if (value === 'multiple-finish') {
		value = 'multiple';
	}
	else
	{
		// clear these out, whatever the case, to avoid errors
		Twinkle.speedy.dbmultipleCriteria = [];
		Twinkle.speedy.dbmultipleParameters = [];
	}

	var normalized = Twinkle.speedy.normalizeHash[ value ];

	// for sysops only
	if (['f4', 'f5', 'f6', 'f11'].indexOf(normalized) !== -1) {
		alert("Tagging with F4, F5, F6, and F11 is not possible using the CSD module.  Try using DI instead, or unchecking \"Tag page only\" if you meant to delete the page.");
		return;
	}

	var i;

	// analyse each db-multiple criterion to determine whether to watch the page/notify the creator
	var watchPage = false;
	if (value === 'multiple')
	{
		for (i in Twinkle.speedy.dbmultipleCriteria)
		{
			if (typeof Twinkle.speedy.dbmultipleCriteria[i] === 'string' &&
				Twinkle.getPref('watchSpeedyPages').indexOf(Twinkle.speedy.dbmultipleCriteria[i]) !== -1)
			{
				watchPage = true;
				break;
			}
		}
	}
	else
	{
		watchPage = Twinkle.getPref('watchSpeedyPages').indexOf(normalized) !== -1;
	}

	var notifyuser = false;
	if (value === 'multiple')
	{
		for (i in Twinkle.speedy.dbmultipleCriteria)
		{
			if (typeof Twinkle.speedy.dbmultipleCriteria[i] === 'string' &&
				Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(Twinkle.speedy.dbmultipleCriteria[i]) !== -1)
			{
				notifyuser = true;
				break;
			}
		}
	}
	else
	{
		notifyuser = (Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(normalized) !== -1) && e.target.form.notify.checked;
	}

	var welcomeuser = false;
	if (notifyuser)
	{
		if (value === 'multiple')
		{
			for (i in Twinkle.speedy.dbmultipleCriteria)
			{
				if (typeof Twinkle.speedy.dbmultipleCriteria[i] === 'string' &&
					Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(Twinkle.speedy.dbmultipleCriteria[i]) !== -1)
				{
					welcomeuser = true;
					break;
				}
			}
		}
		else
		{
			welcomeuser = Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(normalized) !== -1;
		}
	}

	var csdlog = false;
	if (Twinkle.getPref('logSpeedyNominations') && value === 'multiple')
	{
		for (i in Twinkle.speedy.dbmultipleCriteria)
		{
			if (typeof Twinkle.speedy.dbmultipleCriteria[i] === 'string' &&
				Twinkle.getPref('noLogOnSpeedyNomination').indexOf(Twinkle.speedy.dbmultipleCriteria[i]) === -1)
			{
				csdlog = true;
				break;
			}
		}
	}
	else
	{
		csdlog = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(normalized) === -1;
	}

	var params = {
		value: value,
		normalized: normalized,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog
	};

	Status.init( e.target.form );

	Wikipedia.actionCompleted.redirect = mw.config.get('wgPageName');
	Wikipedia.actionCompleted.notice = "Tagging complete";

	var wikipedia_page = new Wikipedia.page(mw.config.get('wgPageName'), "Tagging page");
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.speedy.dbmultipleCriteria = [];
Twinkle.speedy.dbmultipleParameters = [];
Twinkle.speedy.callback.doMultiple = function twinklespeedyCallbackDoMultiple(e)
{
	var value = e.target.values;
	var normalized = Twinkle.speedy.normalizeHash[value];
	if (value !== 'multiple-finish')
	{
		if (Twinkle.speedy.dbmultipleCriteria.indexOf(normalized) !== -1)
		{
			alert('You already selected that criterion. Please choose another.');
		}
		else
		{
			var parameters = Twinkle.speedy.getParameters(value, normalized, Status);
			if (parameters)
			{
				for (var i in parameters) {
					if (typeof parameters[i] === 'string') {
						Twinkle.speedy.dbmultipleParameters[i] = parameters[i];
					}
				}
				Twinkle.speedy.dbmultipleCriteria.push(normalized);
			}
		}
		e.target.form.style.display = "none"; // give the user a cue that the dialog is being changed
		setTimeout(function() {
			Twinkle.speedy.initDialog(Twinkle.speedy.callback.doMultiple, false, e.target.form.parentNode);
		}, 150);
	}
	else
	{
		Twinkle.speedy.callback.evaluateUser(e);
	}
};
