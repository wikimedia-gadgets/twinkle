// <nowiki>

(function() {

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

	mw.loader.load('codex-styles');

	Twinkle.addPortletLink(Twinkle.speedy.callback, 'CSD', 'tw-csd', Morebits.userIsSysop ? 'Delete page according to WP:CSD' : 'Request speedy deletion according to WP:CSD');
	Twinkle.speedy.addButton();
};

Twinkle.speedy.data = [
	{
		list: 'customRationale',
		label: 'Custom rationale' + (Morebits.userIsSysop ? ' (custom deletion reason)' : ' using {{db}} template'),
		code: 'db',
		db: 'reason',
		tooltip: '{{db}} is short for "delete because". At least one of the other deletion criteria must still apply to the page, and you must make mention of this in your rationale. This is not a "catch-all" for when you can\'t find any criteria that fit.',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'Rationale:',
			size: 60
		},
		hideWhenMultiple: true
	},
	{
		list: 'talkList',
		label: 'G8: Talk pages with no corresponding subject page',
		code: 'g8',
		db: 'talk',
		tooltip: 'This excludes any page that is useful to the project - in particular, user talk pages, talk page archives, and talk pages for files that exist on Wikimedia Commons.'
	},
	{
		list: 'fileList',
		label: 'F1: Redundant file',
		code: 'f1',
		db: 'redundantimage',
		tooltip: 'Any file that is a redundant copy, in the same file format and same or lower resolution, of something else on Wikipedia. Likewise, other media that is a redundant copy, in the same format and of the same or lower quality. This does not apply to files duplicated on Wikimedia Commons, because of licence issues; these should be tagged with {{subst:ncd|Image:newname.ext}} or {{subst:ncd}} instead',
		subgroup: {
			name: 'redundantimage_filename',
			type: 'input',
			label: 'File this is redundant to:',
			tooltip: 'The "File:" prefix can be left off.'
		}
	},
	{
		list: 'fileList',
		label: 'F2: Corrupt, missing, or empty file',
		code: 'f2',
		db: 'noimage',
		tooltip: 'Before deleting this type of file, verify that the MediaWiki engine cannot read it by previewing a resized thumbnail of it. This also includes empty (i.e., no content) file description pages for Commons files'
	},
	{
		list: 'fileList',
		label: 'F2: Unneeded file description page for a file on Commons',
		code: 'f2',
		db: 'fpcfail',
		tooltip: 'An image, hosted on Commons, but with tags or information on its English Wikipedia description page that are no longer needed. (For example, a failed featured picture candidate.)',
		hideWhenMultiple: true
	},
	{
		list: 'fileList',
		label: 'F3: Improper license',
		code: 'f3',
		db: 'noncom',
		tooltip: 'Files licensed as "for non-commercial use only", "non-derivative use" or "used with permission" that were uploaded on or after 2005-05-19, except where they have been shown to comply with the limited standards for the use of non-free content. This includes files licensed under a "Non-commercial Creative Commons License". Such files uploaded before 2005-05-19 may also be speedily deleted if they are not used in any articles'
	},
	{
		list: 'fileList',
		label: 'F4: Lack of licensing information',
		code: 'f4',
		db: 'unksource',
		tooltip: 'Files in category "Files with unknown source", "Files with unknown copyright status", or "Files with no copyright tag" that have been tagged with a template that places them in the category for more than seven days, regardless of when uploaded. Note, users sometimes specify their source in the upload summary, so be sure to check the circumstances of the file.',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'F5: Unused non-free copyrighted file',
		code: 'f5',
		db: 'f5',
		tooltip: 'Files that are not under a free license or in the public domain that are not used in any article, whose only use is in a deleted article, and that are very unlikely to be used on any other article. Reasonable exceptions may be made for files uploaded for an upcoming article. For other unused non-free files, use the "Orphaned non-free use" option in Twinkle\'s DI tab.',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'F6: Missing fair-use rationale',
		code: 'f6',
		db: 'norat',
		tooltip: 'Any file without a fair use rationale may be deleted seven days after it is uploaded.  Boilerplate fair use templates do not constitute a fair use rationale.  Files uploaded before 2006-05-04 should not be deleted immediately; instead, the uploader should be notified that a fair-use rationale is needed.  Files uploaded after 2006-05-04 can be tagged using the "No non-free use rationale" option in Twinkle\'s DI module. Such files can be found in the dated subcategories of Category:Files with no non-free use rationale.',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'F7: Fair-use media from a commercial image agency which is not the subject of sourced commentary',
		code: 'f7',
		db: 'badfairuse',
		tooltip: 'Non-free images or media from a commercial source (e.g., Associated Press, Getty), where the file itself is not the subject of sourced commentary, are considered an invalid claim of fair use and fail the strict requirements of WP:NFCC. For cases that require a waiting period (invalid or otherwise disputed rationales or replaceable images), use the options on Twinkle\'s DI tab.',
		subgroup: {
			name: 'badfairuse_rationale',
			type: 'input',
			label: 'Optional explanation:',
			size: 60
		},
		hideWhenMultiple: true
	},
	{
		list: 'fileList',
		label: 'F8: File available as an identical or higher-resolution copy on Wikimedia Commons',
		code: 'f8',
		db: 'commons',
		tooltip: 'Provided the following conditions are met: 1: The file format of both images is the same. 2: The file\'s license and source status is beyond reasonable doubt, and the license is undoubtedly accepted at Commons. 3: All information on the file description page is present on the Commons file description page. That includes the complete upload history with links to the uploader\'s local user pages. 4: The file is not protected, and the file description page does not contain a request not to move it to Commons. 5: If the file is available on Commons under a different name than locally, all local references to the file must be updated to point to the title used at Commons. 6: For {{c-uploaded}} files: They may be speedily deleted as soon as they are off the Main Page',
		subgroup: {
			name: 'commons_filename',
			type: 'input',
			label: 'Filename on Commons:',
			value: Morebits.pageNameNorm,
			tooltip: 'This can be left blank if the file has the same name on Commons as here. The "File:" prefix is optional.'
		},
		hideWhenMultiple: true
	},
	{
		list: 'fileList',
		label: 'F9: Unambiguous copyright infringement',
		code: 'f9',
		db: 'imgcopyvio',
		tooltip: 'The file was copied from a website or other source that does not have a license compatible with Wikipedia, and the uploader neither claims fair use nor makes a credible assertion of permission of free use. Sources that do not have a license compatible with Wikipedia include stock photo libraries such as Getty Images or Corbis. Non-blatant copyright infringements should be discussed at Wikipedia:Files for deletion',
		subgroup: [
			{
				name: 'imgcopyvio_url',
				type: 'input',
				label: 'URL of the copyvio, including the "http://".  If the copyvio is of a non-internet source and you cannot provide a URL, you must use the deletion rationale box.',
				size: 60
			},
			{
				name: 'imgcopyvio_rationale',
				type: 'input',
				label: 'Deletion rationale for non-internet copyvios:',
				size: 60
			}
		]
	},
	{
		list: 'fileList',
		label: 'F11: No evidence of permission',
		code: 'f11',
		db: 'nopermission',
		tooltip: 'If an uploader has specified a license and has named a third party as the source/copyright holder without providing evidence that this third party has in fact agreed, the item may be deleted seven days after notification of the uploader',
		hideWhenUser: true
	},
	{
		list: 'fileList',
		label: 'G8: File description page with no corresponding file',
		code: 'g8',
		db: 'imagepage',
		tooltip: 'This is only for use when the file doesn\'t exist at all. Corrupt files, and local description pages for files on Commons, should use F2; implausible redirects should use R3; and broken Commons redirects should use R4.'
	},
	{
		list: 'articleList',
		label: 'A1: No context. Articles lacking sufficient context to identify the subject of the article.',
		code: 'a1',
		db: 'nocontext',
		tooltip: 'Example: "He is a funny man with a red car. He makes people laugh." This applies only to very short articles. Context is different from content, treated in A3, below.'
	},
	{
		list: 'articleList',
		label: 'A2: Foreign language articles that exist on another Wikimedia project',
		code: 'a2',
		db: 'foreign',
		tooltip: 'If the article in question does not exist on another project, the template {{notenglish}} should be used instead. All articles in a non-English language that do not meet this criteria (and do not meet any other criteria for speedy deletion) should be listed at Pages Needing Translation (PNT) for review and possible translation',
		subgroup: {
			name: 'foreign_source',
			type: 'input',
			label: 'Interwiki link to the article on the foreign-language wiki:',
			tooltip: 'For example, fr:Bonjour'
		}
	},
	{
		list: 'articleList',
		label: 'A3: No content whatsoever',
		code: 'a3',
		db: 'nocontent',
		tooltip: 'Any article consisting only of links elsewhere (including hyperlinks, category tags and "see also" sections), a rephrasing of the title, and/or attempts to correspond with the person or group named by its title. This does not include disambiguation pages'
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (people, groups, companies, web content, individual animals, or organized events)',
		code: 'a7',
		db: 'a7',
		tooltip: 'An article about a real person, group of people, band, club, company, web content, individual animal, tour, or party that does not assert the importance or significance of its subject. If controversial, or if a previous AfD has resulted in the article being kept, the article should be nominated for AfD instead',
		hideWhenSingle: true
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (person)',
		code: 'a7',
		db: 'person',
		tooltip: 'An article about a real person that does not assert the importance or significance of its subject. If controversial, or if there has been a previous AfD that resulted in the article being kept, the article should be nominated for AfD instead',
		hideWhenMultiple: true
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (musician(s) or band)',
		code: 'a7',
		db: 'band',
		tooltip: 'Article about a band, singer, musician, or musical ensemble that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (club, society or group)',
		code: 'a7',
		db: 'club',
		tooltip: 'Article about a club, society or group that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (company or organization)',
		code: 'a7',
		db: 'corp',
		tooltip: 'Article about a company or organization that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (website or web content)',
		code: 'a7',
		db: 'web',
		tooltip: 'Article about a web site, blog, online forum, webcomic, podcast, or similar web content that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (individual animal)',
		code: 'a7',
		db: 'animal',
		tooltip: 'Article about an individual animal (e.g. pet) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		list: 'articleList',
		label: 'A7: No indication of importance (organized event)',
		code: 'a7',
		db: 'event',
		tooltip: 'Article about an organized event (tour, function, meeting, party, etc.) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		list: 'articleList',
		label: 'A9: Unremarkable musical recording where artist\'s article doesn\'t exist',
		code: 'a9',
		db: 'a9',
		tooltip: 'An article about a musical recording which does not indicate why its subject is important or significant, and where the artist\'s article has never existed or has been deleted'
	},
	{
		list: 'articleList',
		label: 'A10: Recently created article that duplicates an existing topic',
		code: 'a10',
		db: 'a10',
		tooltip: 'A recently created article with no relevant page history that does not aim to expand upon, detail or improve information within any existing article(s) on the subject, and where the title is not a plausible redirect. This does not include content forks, split pages or any article that aims at expanding or detailing an existing one.',
		subgroup: {
			name: 'a10_article',
			type: 'input',
			label: 'Article that is duplicated:'
		}
	},
	{
		list: 'articleList',
		label: 'A11: Obviously made up by creator, and no claim of significance',
		code: 'a11',
		db: 'madeup',
		tooltip: 'An article which plainly indicates that the subject was invented/coined/discovered by the article\'s creator or someone they know personally, and does not credibly indicate why its subject is important or significant'
	},
	{
		list: 'categoryList',
		label: 'C1: Empty categories',
		code: 'c1',
		db: 'catempty',
		tooltip: 'Categories that have been unpopulated for at least seven days. This does not apply to categories being discussed at WP:CFD, disambiguation categories, and certain other exceptions. If the category isn\'t relatively new, it possibly contained articles earlier, and deeper investigation is needed'
	},
	{
		list: 'categoryList',
		label: 'C4: Permanently unused maintenance categories',
		code: 'c4',
		db: 'c4',
		tooltip: 'Unused maintenance categories, such as empty dated maintenance categories for dates in the past, tracking categories no longer used by a template after a rewrite, or empty subcategories of Category:Wikipedia sockpuppets or Category:Suspected Wikipedia sockpuppets. Empty maintenance categories are not necessarily unused—this criterion is for categories which will always be empty, not just currently empty.',
		subgroup: {
			name: 'c4_rationale',
			type: 'input',
			label: 'Optional explanation:',
			size: 60
		}
	},
	{
		list: 'templateList',
		label: 'T5: Unused template subpages',
		code: 't5',
		db: 't5',
		tooltip: 'Unused subpages of templates and Lua modules. This does not apply to /testcases and /sandbox subpages, or subpages of Module:Sandbox.'
	},
	{
		list: 'userList',
		label: 'U1: User request',
		code: 'u1',
		db: 'userreq',
		tooltip: 'Personal subpages, upon request by their user. In some rare cases there may be administrative need to retain the page. Also, sometimes, main user pages may be deleted as well. See Wikipedia:User page for full instructions and guidelines',
		subgroup: mw.config.get('wgNamespaceNumber') === 3 && !mw.config.get('wgTitle').includes('/') ? {
			name: 'userreq_rationale',
			type: 'input',
			label: 'A mandatory rationale to explain why this user talk page should be deleted:',
			tooltip: 'User talk pages are deleted only in highly exceptional circumstances. See WP:DELTALK.',
			size: 60
		} : null,
		hideSubgroupWhenMultiple: true
	},
	{
		list: 'userList',
		code: 'u2',
		label: 'U2: Nonexistent user',
		db: 'nouser',
		tooltip: 'User pages of users that do not exist (Check Special:Listusers)'
	},
	{
		list: 'userList',
		label: 'U6: Abandoned user subpages',
		code: 'u6',
		db: 'u6',
		tooltip: 'User subpages of users who have made few or no edits outside of user space, which have not been edited by a human in at least six months, excluding redirects, .js pages, .css pages, and Wikipedia Books. Promising drafts may be moved to draftspace by any editor as an alternative to deletion.',
		hideWhenRedirect: true
	},
	{
		list: 'userList',
		label: 'U7: Excessively unrelated non-draft subpages',
		code: 'u7',
		db: 'u7',
		tooltip: 'User subpages of users who have made few or no edits outside of user space, were created more than six months ago, could not be interpreted as draft articles (even very bad ones), and consist entirely of creative writing, lengthy professional or personal content, or commercial links.',
		hideWhenRedirect: true,
		subgroup: [
			{
				name: 'u7_subcriteria',
				type: 'checkbox',
				list: [
					{
						label: 'Creative or persuasive writing unrelated to Wikipedia',
						value: 'creative',
						name: 'creative',
						tooltip: 'The page contains creative or persuasive writing unrelated to Wikipedia (e.g. fan fictions or political essays).'
					},
					{
						label: 'Lengthy descriptions of a person\'s professional accomplishments',
						value: 'professional',
						name: 'professional',
						tooltip: 'The page contains lengthy descriptions of a person\'s professional accomplishments that are written in the first person or are formatted like a résumé or curriculum vitae, and do not serve as paid-contribution disclosures'
					},
					{
						label: 'Lengthy content about the user\'s personal life',
						value: 'personal',
						name: 'personal',
						tooltip: 'The page contains lengthy content about the user\'s personal life, things in their environment (e.g. friends, pets, or belongings), or things they have invented.'
					},
					{
						label: 'Links to commercial websites',
						value: 'links',
						name: 'links',
						tooltip: 'The page contains links to websites that are primarily commercial in nature.'
					}
				]
			}
		]
	},
	{
		list: 'userList',
		label: 'G11: Promotional user page under a promotional user name',
		code: 'g11',
		db: 'spamuser',
		tooltip: 'A promotional user page, with a username that promotes or implies affiliation with the thing being promoted. Note that simply having a page on a company or product in one\'s userspace does not qualify it for deletion. If a user page is spammy but the username is not, then consider tagging with regular G11 instead.',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	},
	{
		list: 'userList',
		label: 'G13: AfC draft submission or a blank draft, stale by over 6 months',
		code: 'g13',
		db: 'afc',
		tooltip: 'Any rejected or unsubmitted AfC draft submission or a blank draft, that has not been edited in over 6 months (excluding bot edits).',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	},
	{
		list: 'generalList',
		label: 'G1: Patent nonsense. Pages consisting purely of incoherent text or gibberish with no meaningful content or history.',
		code: 'g1',
		db: 'nonsense',
		tooltip: 'This does not include poor writing, partisan screeds, obscene remarks, vandalism, fictional material, material not in English, poorly translated material, implausible theories, or hoaxes. In short, if you can understand it, G1 does not apply.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		list: 'generalList',
		label: 'G2: Test page',
		code: 'g2',
		db: 'test',
		tooltip: 'A page created to test editing or other Wikipedia functions. Pages in the User namespace are not included, nor are valid but unused or duplicate templates.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		list: 'generalList',
		label: 'G3: Pure vandalism',
		code: 'g3',
		db: 'vandalism',
		tooltip: 'Plain pure vandalism (including redirects left behind from pagemove vandalism)'
	},
	{
		list: 'generalList',
		label: 'G3: Blatant hoax',
		code: 'g3',
		db: 'hoax',
		tooltip: 'Blatant and obvious hoax, to the point of vandalism',
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'G4: Recreation of material deleted via a deletion discussion',
		code: 'g4',
		db: 'repost',
		tooltip: 'A copy, by any title, of a page that was deleted via an XfD process or Deletion review, provided that the copy is substantially identical to the deleted version. This clause does not apply to content that has been "userfied", to content undeleted as a result of Deletion review, or if the prior deletions were proposed or speedy deletions, although in this last case, other speedy deletion criteria may still apply',
		subgroup: {
			name: 'repost_xfd',
			type: 'input',
			label: 'Page where the deletion discussion took place:',
			tooltip: 'Must start with "Wikipedia:"',
			size: 60
		}
	},
	{
		list: 'generalList',
		label: 'G5: Created by a banned or blocked user',
		code: 'g5',
		db: 'banned',
		tooltip: 'Pages created by banned or blocked users in violation of their ban or block, and which have no substantial edits by others',
		subgroup: {
			name: 'banned_user',
			type: 'input',
			label: 'Username of banned user (if available):',
			tooltip: 'Should not start with "User:"'
		}
	},
	{
		list: 'generalList',
		label: 'G5: Created in violation of a general sanction',
		code: 'g5',
		db: 'gs',
		tooltip: 'Pages created in violation of a contentious topic restriction or other general sanction, with no substantial edits by others',
		subgroup: {
			name: 'code',
			type: 'select',
			label: 'Code of the relevant general sanction:',
			list: [
					{ type: 'option', value: 'rusukr', label: 'RUSUKR – Russo-Ukrainian War' },
					{ type: 'option', value: 'a-i', label: 'A-I – Arab-Israeli conflict' },
					{ type: 'option', value: 'kurd', label: 'KURD – Kurds and Kurdistan' },
					{ type: 'option', value: 'a-a', label: 'A-A – Armenia-Azerbaijan' },
					{ type: 'option', value: 'apl', label: 'APL – Antisemitism in Poland' },
					{ type: 'option', value: 'sasg', label: 'SASG – South Asian social groups' },
					{ type: 'option', value: 'imh', label: 'IMH – Indian military history' }
				]
		}
	},
	{
		list: 'generalList',
		label: 'G6: Error',
		code: 'g6',
		db: 'error',
		tooltip: 'A page that was obviously created in error, or a redirect left over from moving a page that was obviously created at the wrong title.',
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'G6: Move',
		code: 'g6',
		db: 'move',
		tooltip: 'Making way for an uncontroversial move like reversing a redirect',
		subgroup: [
			{
				name: 'move_page',
				type: 'input',
				label: 'Page to be moved here:'
			},
			{
				name: 'move_reason',
				type: 'input',
				label: 'Reason:',
				size: 60
			}
		],
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'G6: XfD',
		code: 'g6',
		db: 'xfd',
		tooltip: 'A deletion discussion (at AfD, FfD, RfD, TfD, CfD, or MfD) was closed as "delete", but the page wasn\'t actually deleted.',
		subgroup: {
			name: 'xfd_fullvotepage',
			type: 'input',
			label: 'Page where the deletion discussion was held:',
			tooltip: 'Must start with "Wikipedia:"',
			size: 40
		},
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'G6: AfC move',
		code: 'g6',
		db: 'afc-move',
		tooltip: 'Making way for acceptance of a draft submitted to AfC',
		subgroup: {
			name: 'draft_page',
			type: 'input',
			label: 'Draft to be moved here:'
		},
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'G6: Copy-and-paste page move',
		code: 'g6',
		db: 'copypaste',
		tooltip: 'This only applies for a copy-and-paste page move of another page that needs to be temporarily deleted to make room for a clean page move.',
		subgroup: {
			name: 'copypaste_sourcepage',
			type: 'input',
			label: 'Original page that was copy-pasted here:'
		},
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'G6: Housekeeping and non-controversial cleanup',
		code: 'g6',
		db: 'g6',
		tooltip: 'Other routine maintenance tasks',
		subgroup: {
			name: 'g6_rationale',
			type: 'input',
			label: 'Rationale:',
			size: 60
		}
	},
	{
		list: 'generalList',
		label: 'G7: Author requests deletion, or author blanked',
		code: 'g7',
		db: 'author',
		tooltip: 'Any page for which deletion is requested by the original author in good faith, provided the page\'s only substantial content was added by its author. If the author blanks the page, this can also be taken as a deletion request.',
		subgroup: {
			name: 'author_rationale',
			type: 'input',
			label: 'Optional explanation:',
			tooltip: 'Perhaps linking to where the author requested this deletion.',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		list: 'generalList',
		label: 'G8: Pages dependent on a non-existent or deleted page',
		code: 'g8',
		db: 'g8',
		tooltip: 'such as talk pages with no corresponding subject page; subpages with no parent page; file pages without a corresponding file; redirects to non-existent targets; or categories populated by deleted or retargeted templates. This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		subgroup: {
			name: 'g8_rationale',
			type: 'input',
			label: 'Optional explanation:',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		list: 'generalList',
		label: 'G8: Subpages with no parent page',
		code: 'g8',
		db: 'subpage',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true,
		hideInNamespaces: [ 0, 6, 8 ] // hide in main, file, and mediawiki-spaces
	},
	{
		list: 'generalList',
		label: 'G10: Attack page',
		code: 'g10',
		db: 'attack',
		tooltip: 'Pages that serve no purpose but to disparage or threaten their subject or some other entity (e.g., "John Q. Doe is an imbecile"). This includes a biography of a living person that is negative in tone and unsourced, where there is no NPOV version in the history to revert to. Administrators deleting such pages should not quote the content of the page in the deletion summary!'
	},
	{
		list: 'generalList',
		label: 'G10: Wholly negative, unsourced BLP',
		code: 'g10',
		db: 'negublp',
		tooltip: 'A biography of a living person that is entirely negative in tone and unsourced, where there is no neutral version in the history to revert to.',
		hideWhenMultiple: true
	},
	{
		list: 'generalList',
		label: 'G11: Unambiguous advertising or promotion',
		code: 'g11',
		db: 'spam',
		tooltip: 'Pages which exclusively promote a company, product, group, service, or person and which would need to be fundamentally rewritten in order to become encyclopedic. Note that an article about a company or a product which describes its subject from a neutral point of view does not qualify for this criterion; an article that is blatant advertising should have inappropriate content as well'
	},
	{
		list: 'generalList',
		label: 'G12: Unambiguous copyright infringement',
		code: 'g12',
		db: 'copyvio',
		tooltip: 'Either: (1) Material was copied from another website that does not have a license compatible with Wikipedia, or is photography from a stock photo seller (such as Getty Images or Corbis) or other commercial content provider; (2) There is no non-infringing content in the page history worth saving; or (3) The infringement was introduced at once by a single person rather than created organically on wiki and then copied by another website such as one of the many Wikipedia mirrors',
		subgroup: [
			{
				name: 'copyvio_url',
				type: 'input',
				label: 'URL (if available):',
				tooltip: 'If the material was copied from an online source, put the URL here, including the "http://" or "https://" protocol.',
				size: 60
			},
			{
				name: 'copyvio_url2',
				type: 'input',
				label: 'Additional URL:',
				tooltip: 'Optional. Should begin with "http://" or "https://"',
				size: 60
			},
			{
				name: 'copyvio_url3',
				type: 'input',
				label: 'Additional URL:',
				tooltip: 'Optional. Should begin with "http://" or "https://"',
				size: 60
			}
		]
	},
	{
		list: 'generalList',
		label: 'G13: Page in draft namespace or userspace AfC submission, stale by over 6 months',
		code: 'g13',
		db: 'afc',
		tooltip: 'Any rejected or unsubmitted AfC submission in userspace or any non-redirect page in draft namespace, that has not been edited for more than 6 months. Blank drafts in either namespace are also included.',
		hideWhenRedirect: true,
		showInNamespaces: [2, 118] // user, draft namespaces only
	},
	{
		list: 'generalList',
		label: 'G14: Unnecessary disambiguation page',
		code: 'g14',
		db: 'disambig',
		tooltip: 'This only applies for orphaned disambiguation pages which either: (1) disambiguate only one existing Wikipedia page and whose title ends in "(disambiguation)" (i.e., there is a primary topic); or (2) disambiguate no (zero) existing Wikipedia pages, regardless of its title.  It also applies to orphan "Foo (disambiguation)" redirects that target pages that are not disambiguation or similar disambiguation-like pages (such as set index articles or lists)'
	},
	{
		list: 'generalList',
		label: 'G15: Unreviewed LLM content',
		code: 'g15',
		db: 'llm',
		tooltip: 'This only applies to pages containing any of: (1) communication intended for the user (e.g., "Here is your Wikipedia article on..."); (2) implausible non-existent references; or (3) nonsensical citations, that would otherwise have been removed with human review.',
		subgroup: [
			{
				name: 'subcriteria',
				type: 'radio',
				list: [
					{
						label: 'Communication intended for the user',
						value: 'communication',
						tooltip: 'The page contains communication intended for the user, such as "Here is your Wikipedia article on...".'
					},
					{
						label: 'Implausible non-existent references',
						value: 'implausible',
						tooltip: 'The page contains implausible non-existent references.'
					},
					{
						label: 'Nonsensical citations',
						value: 'nonsensical',
						tooltip: 'The page contains nonsensical citations.'
					}
				]
			},
			{
				name: 'reason',
				type: 'input',
				label: 'Extended reason (optional):',
				tooltip: 'Specify why one of the three criteria apply to this page.',
				size: 60
			}
		]
	},
	{
		list: 'redirectList',
		label: 'R2: Redirect from mainspace to any other namespace except the Category:, Template:, Wikipedia:, Help: and Portal: namespaces',
		code: 'r2',
		db: 'rediruser',
		tooltip: 'This does not include the pseudo-namespace shortcuts. If this was the result of a page move, consider waiting a day or two before deleting the redirect',
		showInNamespaces: [ 0 ]
	},
	{
		list: 'redirectList',
		label: 'R3: Recently created redirect from an implausible typo or misnomer',
		code: 'r3',
		db: 'redirtypo',
		tooltip: 'However, redirects from common misspellings or misnomers are generally useful, as are redirects in other languages'
	},
	{
		list: 'redirectList',
		label: 'R4: File namespace redirect with a name that matches a Commons page',
		code: 'r4',
		db: 'redircom',
		tooltip: 'The redirect should have no incoming links (unless the links are cleary intended for the file or redirect at Commons).',
		showInNamespaces: [ 6 ]
	},
	{
		list: 'redirectList',
		label: 'G6: Redirect to malplaced disambiguation page',
		code: 'g6',
		db: 'movedab',
		tooltip: 'This only applies for redirects to disambiguation pages ending in (disambiguation) where a primary topic does not exist.',
		hideWhenMultiple: true
	},
	{
		list: 'redirectList',
		label: 'G8: Redirects to non-existent targets',
		code: 'g8',
		db: 'redirnone',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true
	},
	{
		list: 'timedTextList',
		label: 'G8: Timed Text pages with no corresponding file',
		code: 'g8',
		db: 'timedtext',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.'
	},
	{
		list: 'redirectList',
		label: 'X3: Redirects with no space before a parenthetical disambiguation',
		code: 'x3',
		db: 'x3',
		tooltip: 'This excludes terms that can plausibly be searched for without spaces, or if the redirect contains substantive page history (e.g. from a merge).'
	}
];

/**
 * Given a list name such as talkList, fileList, redirectList, etc, return the CSDs that should be in that list.
 */
Twinkle.speedy.getCsdList = ( csdList ) => {
	const list = [];
	for (const item of Twinkle.speedy.data) {
		if (item.list === csdList) {
			const copy = Object.assign({}, item);
			// Change some things to match the old spec, from before I refactored this.
			delete copy.list;
			delete copy.code;
			copy.value = copy.db;
			delete copy.db;
			list.push(copy);
		}
	}
	return list;
};

Twinkle.speedy.customRationale = Twinkle.speedy.getCsdList( 'customRationale' );
Twinkle.speedy.talkList = Twinkle.speedy.getCsdList( 'talkList' );
Twinkle.speedy.fileList = Twinkle.speedy.getCsdList( 'fileList' );
Twinkle.speedy.articleList = Twinkle.speedy.getCsdList( 'articleList' );
Twinkle.speedy.categoryList = Twinkle.speedy.getCsdList( 'categoryList' );
Twinkle.speedy.templateList = Twinkle.speedy.getCsdList( 'templateList' );
Twinkle.speedy.userList = Twinkle.speedy.getCsdList( 'userList' );
Twinkle.speedy.generalList = Twinkle.speedy.getCsdList( 'generalList' );
Twinkle.speedy.redirectList = Twinkle.speedy.getCsdList( 'redirectList' );
Twinkle.speedy.timedTextList = Twinkle.speedy.getCsdList( 'timedTextList' );

/**
 * Iterate over Twinkle.speedy.data. Turn `code: 'g8', db: 'redirnone',` into `redirnone: 'g8',`
 */
Twinkle.speedy.getNormalizeHash = () => {
	const hash = {};
	for (const item of Twinkle.speedy.data) {
		if (item.code && item.db) {
			hash[item.db] = item.code;
		}
	}
	return hash;
};

/**
 * This is a map of Db-word templates to CSD codes such as a1. For example, `"nocontext": "a1"`
 */
Twinkle.speedy.normalizeHash = Twinkle.speedy.getNormalizeHash();

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
	Twinkle.speedy.dialog = new Morebits.SimpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
	const dialog = Twinkle.speedy.dialog;
	dialog.setTitle('Choose criteria for speedy deletion');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Speedy deletion policy', 'WP:CSD');
	dialog.addFooterLink('CSD prefs', 'WP:TW/PREF#speedy');
	dialog.addFooterLink('Twinkle help', 'WP:TW/DOC#speedy');
	dialog.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(callbackfunc, Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);
	if (Morebits.userIsSysop) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Tag page only, don\'t delete',
					value: 'tag_only',
					name: 'tag_only',
					tooltip: 'If you just want to tag the page, instead of deleting it now',
					checked: !(Twinkle.speedy.hasCSD || (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName')) || Twinkle.getPref('deleteSysopDefaultToDelete')),
					event: function(event) {
						const cForm = event.target.form;
						const cChecked = event.target.checked;
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

		const deleteOptions = form.append({
			type: 'div',
			name: 'delete_options'
		});
		deleteOptions.append({
			type: 'header',
			label: 'Delete-related options'
		});
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) { // hide option for user pages, to avoid accidentally deleting user talk page
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

	const tagOptions = form.append({
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
			{
				label: 'Tag for creation protection (salting) as well',
				value: 'salting',
				name: 'salting',
				tooltip: 'When selected, the speedy deletion tag will be accompanied by a {{salt}} tag requesting that the deleting administrator apply creation protection. Only select if this page has been repeatedly recreated.',
				event: function(event) {
					event.stopPropagation();
				}
			},
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

	const result = form.render();
	dialog.setContent(result);
	dialog.display();

	Twinkle.speedy.callback.modeChanged(result);

	// Check for prior deletions.  Just once, upon init
	Twinkle.speedy.callback.priorDeletionCount();
};

// Fast-track deletion without form
Twinkle.speedy.instantDelete = function twinklespeedyInstantDelete() {
	// check if CSD is already on the page and fill in custom rationale
	if (!Twinkle.speedy.hasCSD) {
		return;
	}

	const csdReason = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');

	// These three consts are literally copying what is returned by the default params
	// This is not optimal at all, and if we could scan the CSD code instead of making it an ugly custom thing
	// I'd be all for it
	const values = ['reason'];

	const templateParams = [[]];
	templateParams[0][1] = csdReason;

	const normalizeds = values.map((value) => Twinkle.speedy.normalizeHash[value]);

	// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
	let watchPage, promptForSummary;
	normalizeds.forEach((norm) => {
		if (Twinkle.getPref('watchSpeedyPages').includes(norm)) {
			watchPage = Twinkle.getPref('watchSpeedyExpiry');
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').includes(norm)) {
			promptForSummary = true;
		}
	});

	const warnusertalk = !Twinkle.speedy.hasCSD && normalizeds.some((norm, index) => Twinkle.getPref('warnUserOnSpeedyDelete').includes(norm) &&
			!(norm === 'g6' && values[index] !== 'copypaste') && !(norm === 'g5' && values[index] !== 'gs'));

	const welcomeuser = warnusertalk && normalizeds.some((norm) => Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').includes(norm));

	const params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: Twinkle.getPref('deleteTalkPageOnDelete'),
		deleteRedirects: Twinkle.getPref('deleteRedirectsOnDelete'),
		warnUser: warnusertalk,
		welcomeuser: welcomeuser,
		promptForSummary: promptForSummary,
		templateParams: templateParams
	};

	Twinkle.speedy.callbacks.sysop.main(params);
};

Twinkle.speedy.instantDecline = function twinklespeedyInstantDecline() {
	const wikipediaPage = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Tagging page');
	wikipediaPage.load(Twinkle.speedy.instantDecline.main);
};

Twinkle.speedy.instantDecline.main = function twinklespeedyInstantDeclineMain(pageObj) {
	// finds the db template
	const text = pageObj.getPageText();
	const tag = /(?:\{\{\s*(db|delete|db-.*?|speedy deletion-.*?)(?:\s*\||\s*\}\}))/.exec(text)[1];
	let wikitextObj = new Morebits.wikitext.page(text);

	// and then removes it
	wikitextObj.removeTemplate(tag);

	if (wikitextObj.getText()[0] === '\n') {
		wikitextObj = new Morebits.wikitext.page(wikitextObj.getText().slice(1));
	}

	pageObj.setPageText(wikitextObj.getText());

	const splitTag = tag.split(/-(.*)/).length > 1 ? tag.split(/-(.*)/)[1] : tag;

	if (splitTag in Twinkle.speedy.normalizeHash) {
		if (Twinkle.speedy.normalizeHash[splitTag] === 'db') {
				pageObj.setEditSummary('Declining speedy deletion (no code provided).');
		} else {
				pageObj.setEditSummary('Declining speedy deletion ([[WP:CSD#' + Twinkle.speedy.normalizeHash[splitTag].toUpperCase() + '|CSD ' + Twinkle.speedy.normalizeHash[splitTag].toUpperCase() + ']]).');
		}
	} else {
		pageObj.setEditSummary('Declining speedy deletion (multiple criteria).');
	}
	pageObj.setChangeTags(Twinkle.changeTags);
	pageObj.save(window.location.reload.bind(window.location));
};

Twinkle.speedy.createCodexButton = function twinkleSpeedyCreateCodexButton({ label, action = 'neutral', weight = 'normal', size = 'medium', onClick }) {
	const button = document.createElement('button');
	button.classList.add('cdx-button');

	// Action classes
	if (action !== 'neutral') {
		button.classList.add(`cdx-button--action-${action}`);
	}

	// Weight classes
	if (weight !== 'normal') {
		button.classList.add(`cdx-button--weight-${weight}`);
	}

	// Size classes
	if (size !== 'medium') {
		button.classList.add(`cdx-button--size-${size}`);
	}

	button.textContent = label;

	if (typeof onClick === 'function') {
		button.addEventListener('click', onClick);
	}

	return button;
};

// Adds a quick "Delete" button to a speedy deletion template
Twinkle.speedy.addButton = function twinklespeedyAddButton() {
	if (!Morebits.userIsSysop) {
		return;
	}

	const buttonNodes = {
		delete: Twinkle.speedy.createCodexButton( { label: 'Delete', action: 'destructive', weight: 'primary', size: 'medium', onClick: Twinkle.speedy.instantDelete } ),
		decline: Twinkle.speedy.createCodexButton( { label: 'Decline', action: 'neutral', weight: 'normal', size: 'medium', onClick: Twinkle.speedy.instantDecline } )
	};

	const buttonContainer = document.createElement('div');
	buttonContainer.style.display = 'flex';
	buttonContainer.style.gap = '1em';
	buttonContainer.style.justifyContent = 'center';

	// Append the buttons to the container
	buttonContainer.appendChild(buttonNodes.delete);
	buttonContainer.appendChild(buttonNodes.decline);

	const contestButton = document.querySelector(
		'table.ambox-speedy form[name="commentbox"].mw-inputbox-form-inline'
	);

	if (contestButton) {
		// Replace the "Contest this deletion" link if it exists
		contestButton.replaceWith(buttonContainer);
	} else {
		// Otherwise, add it at the end of the template notice
		const notice = document.querySelector('table.ambox-speedy div.mbox-text-span');
		if (notice) {
			notice.appendChild(document.createTextNode(' ')); // space separator
			notice.appendChild(buttonContainer);
		}
	}
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	const namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	const mode = {
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

	const work_area = new Morebits.QuickForm.Element({
		type: 'div',
		name: 'work_area'
	});

	if (mode.isMultiple && mode.isRadioClick) {
		const evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';

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

	const appendList = function(headerLabel, csdList) {
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
			case 0: // article
			case 1: // talk
				appendList('Articles', Twinkle.speedy.articleList);
				break;

			case 2: // user
			case 3: // user talk
				appendList('User pages', Twinkle.speedy.userList);
				break;

			case 6: // file
			case 7: // file talk
				appendList('Files', Twinkle.speedy.fileList);
				if (!mode.isSysop) {
					work_area.append({ type: 'div', label: 'Tagging for CSD F4 (no license), F5 (orphaned non-free use), F6 (no non-free use rationale), and F11 (no permission) can be done using Twinkle\'s "DI" tab.' });
				}
				break;

			case 10: // template
			case 11: // template talk
			case 828: // module
			case 829: // module talk
				appendList('Templates and modules', Twinkle.speedy.templateList);
				break;

			case 14: // category
			case 15: // category talk
				appendList('Categories', Twinkle.speedy.categoryList);
				break;

			case 710: // timed text
			case 711: // timed text talk
				appendList('Timed Text pages', Twinkle.speedy.timedTextList);
				break;

			default:
				break;
		}
	} else {
		if (namespace === 2 || namespace === 3) {
			appendList('User pages', Twinkle.speedy.userList);
		}
		appendList('Redirects', Twinkle.speedy.redirectList);
	}

	let generalCriteria = Twinkle.speedy.generalList;

	// custom rationale lives under general criteria when tagging
	if (!mode.isSysop) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	appendList('General criteria', generalCriteria);

	const old_area = Morebits.QuickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (mode.isSysop && Twinkle.speedy.hasCSD) {
		const customOption = $('input[name=csd][value=reason]')[0];
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

Twinkle.speedy.callback.priorDeletionCount = function () {
	const query = {
		action: 'query',
		format: 'json',
		list: 'logevents',
		letype: 'delete',
		leaction: 'delete/delete', // Just pure page deletion, no redirect overwrites or revdel
		letitle: mw.config.get('wgPageName'),
		leprop: '', // We're just counting we don't actually care about the entries
		lelimit: 5 // A little bit goes a long way
	};

	new Morebits.wiki.Api('Checking for past deletions', query, ((apiobj) => {
		const response = apiobj.getResponse();
		const delCount = response.query.logevents.length;
		if (delCount) {
			let message = delCount + ' previous deletion';
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
			const link = Morebits.htmlNode('a', '(logs)');
			link.setAttribute('href', mw.util.getUrl('Special:Log', {page: mw.config.get('wgPageName')}));
			link.setAttribute('target', '_blank');

			$('#prior-deletion-count').text(message + ' '); // Space before log link
			$('#prior-deletion-count').append(link);
		}
	})).post();
};

Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {

	const pageNamespace = mw.config.get('wgNamespaceNumber');

	const openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	const submitSubgroupHandler = function(e) {
		const evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, (critElement) => {
		const criterion = $.extend({}, critElement);

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

		if (criterion.showInNamespaces && !criterion.showInNamespaces.includes(pageNamespace)) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.includes(pageNamespace)) {
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
						name: 'submit', // ends up being called "csd.submit" so this is OK
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

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		let code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = '{{db-multiple';
			params.utparams = {};
			$.each(params.normalizeds, (index, norm) => {
				code += '|' + norm.toUpperCase();
				parameters = params.templateParams[index] || [];
				for (const i in parameters) {
					if (typeof parameters[i] === 'string' && !parseInt(i, 10)) { // skip numeric parameters - {{db-multiple}} doesn't understand them
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
		const query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',
			text: wikitext,
			contentmodel: 'wikitext',
			title: mw.config.get('wgPageName'),
			disablelimitreport: true,
			format: 'json'
		};

		const statusIndicator = new Morebits.Status('Building deletion summary');
		const api = new Morebits.wiki.Api('Parsing deletion template', query, ((apiobj) => {
			const reason = decodeURIComponent($(apiobj.getResponse().parse.text).find('#delete-reason').text()).replace(/\+/g, ' ');
			if (!reason) {
				statusIndicator.warn('Unable to generate summary from deletion template');
			} else {
				statusIndicator.info('complete');
			}
			callback(reason);
		}), statusIndicator);
		api.post();
	},

	noteToCreator: function(pageobj) {
		const params = pageobj.getCallbackParameters();
		let initialContrib = pageobj.getCreator();

		// disallow notifying yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			Morebits.Status.warn('You (' + initialContrib + ') created this page; skipping user notification');
			initialContrib = null;

		// don't notify users when their user talk page is nominated/deleted
		} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
			Morebits.Status.warn('Notifying initial contributor: this user created their own user talk page; skipping notification');
			initialContrib = null;

		// quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
		} else if ((initialContrib === 'Cyberbot I' || initialContrib === 'SoxBot') && params.normalizeds[0] === 'f2') {
			Morebits.Status.warn('Notifying initial contributor: page created procedurally by bot; skipping notification');
			initialContrib = null;

		// Check for already existing tags
		} else if (Twinkle.speedy.hasCSD && params.warnUser && !confirm('The page has a deletion-related tag, and thus the creator has likely been notified.  Do you want to notify them for this deletion as well?')) {
			Morebits.Status.info('Notifying initial contributor', 'canceled by user; skipping notification.');
			initialContrib = null;
		}

		if (initialContrib) {
			const usertalkpage = new Morebits.wiki.Page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			let notifytext, i, editsummary;

			// special cases: "db" and "db-multiple"
			if (params.normalizeds.length > 1) {
				notifytext = '\n{{subst:db-' + (params.warnUser ? 'deleted' : 'notice') + '-multiple|1=' + Morebits.pageNameNorm;
				let count = 2;
				$.each(params.normalizeds, (index, norm) => {
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
			if (!params.normalizeds.includes('g10')) { // no article name in summary for G10 taggings
				editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			} else {
				editsummary += ' of an attack page.';
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(editsummary);
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('watchSpeedyUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(() => {
				// add this nomination to the user's userspace log, if the user has enabled it
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
				}
			}, () => {
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
			let reason;
			if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
				reason = prompt('Enter the deletion summary to use, which will be entered into the deletion log:', '');
				Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
			} else {
				const code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(code, (reason) => {
					if (params.promptForSummary) {
						reason = prompt('Enter the deletion summary to use, or press OK to accept the automatically generated one.', reason);
					}
					Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
				});
			}
		},
		deletePage: function(reason, params) {
			const thispage = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Deleting page');

			if (reason === null) {
				return Morebits.Status.error('Asking for reason', 'User cancelled');
			} else if (!reason || !reason.replace(/^\s*/, '').replace(/\s*$/, '')) {
				return Morebits.Status.error('Asking for reason', 'The "reason" for deleting was not provided, or Twinkle was unable to compute it. Aborting.');
			}

			const deleteMain = function(callback) {
				thispage.setEditSummary(reason);
				thispage.setChangeTags(Twinkle.changeTags);
				thispage.setWatchlist(params.watch);
				thispage.deletePage(() => {
					thispage.getStatusElement().info('done');
					typeof callback === 'function' && callback();
					Twinkle.speedy.callbacks.sysop.deleteTalk(params);
				});
			};

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if (params.warnUser) {
				thispage.setCallbackParameters(params);
				thispage.lookupCreation((pageobj) => {
					deleteMain(() => {
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
				const talkpage = new Morebits.wiki.Page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), 'Deleting talk page');
				talkpage.setEditSummary('[[WP:CSD#G8|G8]]: Talk page of deleted page [[' + Morebits.pageNameNorm + ']]');
				talkpage.setChangeTags(Twinkle.changeTags);
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(() => {
					Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
				}, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
			}
		},
		deleteRedirects: function(params) {
			// delete redirects
			if (params.deleteRedirects) {
				const query = {
					action: 'query',
					titles: mw.config.get('wgPageName'),
					prop: 'redirects',
					rdlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
					format: 'json'
				};
				const wikipedia_api = new Morebits.wiki.Api('getting list of redirects...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.Status('Deleting redirects'));
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// promote Unlink tool
			let $link, $bigtext;
			if (mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'f8') {
				$link = $('<a>', {
					href: '#',
					text: 'click here to go to the Unlink tool',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing usages of and/or links to deleted file ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span>', {
					text: 'To orphan backlinks and remove instances of file usage',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.Status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f8') {
				$link = $('<a>', {
					href: '#',
					text: 'click here to go to the Unlink tool',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing links to deleted page ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span>', {
					text: 'To orphan backlinks',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.Status.info($bigtext[0], $link[0]);
			}
		},
		deleteRedirectsMain: function(apiobj) {
			const response = apiobj.getResponse();
			const snapshot = response.query.pages[0].redirects || [];
			const total = snapshot.length;
			const statusIndicator = apiobj.statelem;

			if (!total) {
				statusIndicator.status('no redirects found');
				return;
			}

			statusIndicator.status('0%');

			let current = 0;
			const onsuccess = function(apiobjInner) {
				const now = parseInt(100 * ++current / total, 10) + '%';
				statusIndicator.update(now);
				apiobjInner.statelem.unlink();
				if (current >= total) {
					statusIndicator.info(now + ' (completed)');
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			snapshot.forEach((value) => {
				const title = value.title;
				const page = new Morebits.wiki.Page(title, 'Deleting redirect "' + title + '"');
				page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page [[' + Morebits.pageNameNorm + ']]');
				page.setChangeTags(Twinkle.changeTags);
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			const statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			const params = pageobj.getCallbackParameters();

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			const buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params);
			let code = buildData[0];
			params.utparams = buildData[1];

			// Set the correct value for |ts= parameter in {{db-g13}}
			if (params.normalizeds.includes('g13')) {
				code = code.replace('$TIMESTAMP', pageobj.getLastEditTime());
			}

			// Tag if possible, post on talk if not
			if (pageobj.canEdit() && ['wikitext', 'Scribunto', 'javascript', 'css', 'sanitized-css'].includes(pageobj.getContentModel()) && mw.config.get('wgNamespaceNumber') !== 710 /* TimedText */) {
				let text = pageobj.getPageText();

				statelem.status('Checking for tags on the page...');

				// check for existing deletion tags
				const tag = /(?:\{\{\s*(db|delete|db-.*?|speedy deletion-.*?)(?:\s*\||\s*\}\}))/.exec(text);
				// This won't make use of the db-multiple template but it probably should
				if (tag && !confirm('The page already has the CSD-related template {{' + tag[1] + '}} on it.  Do you want to add another CSD template?')) {
					return;
				}

				const xfd = /\{\{((?:article for deletion|proposed deletion|prod blp|template for discussion)\/dated|[cfm]fd\b)/i.exec(text) || /#invoke:(RfD)/.exec(text);
				if (xfd && !confirm('The deletion-related template {{' + xfd[1] + '}} was found on the page. Do you still want to add a CSD template?')) {
					return;
				}

				// curate/patrol the page
				if (Twinkle.getPref('markSpeedyPagesAsPatrolled')) {
					pageobj.triage();
				}

				// Wrap SD template in noinclude tags if we are in template space.
				// Won't work with userboxes in userspace, or any other transcluded page outside template space
				if (mw.config.get('wgNamespaceNumber') === 10) { // Template:
					code = '<noinclude>' + code + '</noinclude>';
				}

				// Remove tags that become superfluous with this action
				text = text.replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
				if (mw.config.get('wgNamespaceNumber') === 6) {
					// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}

				if (params.requestsalt) {
					if (!params.normalizeds.includes('g10')) {
						code += '\n{{salt}}';
					} else {
						code = '{{salt}}\n' + code;
					}
				}

				if (mw.config.get('wgPageContentModel') === 'Scribunto') {
					// Scribunto isn't parsed like wikitext, so CSD templates on modules need special handling to work
					let equals = '';
					while (code.includes(']' + equals + ']')) {
						equals += '=';
					}
					code = "require('Module:Module wikitext')._addText([" + equals + '[' + code + ']' + equals + ']);';
				} else if (['javascript', 'css', 'sanitized-css'].includes(mw.config.get('wgPageContentModel'))) {
					// Likewise for JS/CSS pages
					code = '/* ' + code + ' */';
				}

				// Generate edit summary for edit
				let editsummary;
				if (params.normalizeds.length > 1) {
					editsummary = 'Requesting speedy deletion (';
					$.each(params.normalizeds, (index, norm) => {
						editsummary += '[[WP:CSD#' + norm.toUpperCase() + '|CSD ' + norm.toUpperCase() + ']], ';
					});
					editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
					editsummary += ').';
				} else if (params.normalizeds[0] === 'db') {
					editsummary = 'Requesting [[WP:CSD|speedy deletion]] with rationale "' + params.templateParams[0]['1'] + '".';
				} else {
					editsummary = 'Requesting speedy deletion ([[WP:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']]).';
				}

				// Blank attack pages
				if (params.normalizeds.includes('g10')) {
					text = code;
				} else {
					// Insert tag after short description or any hatnotes
					const wikipage = new Morebits.wikitext.Page(text);
					text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
				}

				pageobj.setPageText(text);
				pageobj.setEditSummary(editsummary);
				pageobj.setWatchlist(params.watch);
				pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
			} else { // Attempt to place on talk page
				const talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
				if (talkName !== pageobj.getPageName()) {
					if (params.requestsalt) {
						code += '\n{{salt}}';
					}

					pageobj.getStatusElement().warn('Unable to edit page, placing tag on talk page');

					const talk_page = new Morebits.wiki.Page(talkName, 'Automatically placing tag on talk page');
					talk_page.setNewSectionTitle(pageobj.getPageName() + ' nominated for CSD, request deletion');
					talk_page.setNewSectionText(code + '\n\nI was unable to tag ' + pageobj.getPageName() + ' so please delete it. ~~~~');
					talk_page.setCreateOption('recreate');
					talk_page.setFollowRedirect(true);
					talk_page.setWatchlist(params.watch);
					talk_page.setChangeTags(Twinkle.changeTags);
					talk_page.setCallbackParameters(params);
					talk_page.newSection(Twinkle.speedy.callbacks.user.tagComplete);
				} else {
					pageobj.getStatusElement().error('Page cannot be edited and no other location to place a speedy deletion request, aborting');
				}
			}
		},

		tagComplete: function(pageobj) {
			const params = pageobj.getCallbackParameters();

			// Notification to first contributor, will also log nomination to the user's userspace log
			if (params.usertalk) {
				const thispage = new Morebits.wiki.Page(Morebits.pageNameNorm);
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(Twinkle.speedy.callbacks.noteToCreator);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},

		addToLog: function(params, initialContrib) {
			const usl = new Morebits.UserspaceLogger(Twinkle.getPref('speedyLogPageName'));
			usl.initialText =
				"This is a log of all [[WP:CSD|speedy deletion]] nominations made by this user using [[WP:TW|Twinkle]]'s CSD module.\n\n" +
				'If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and ' +
				'nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].' +
				(Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');

			const formatParamLog = function(normalize, csdparam, input) {
				if ((normalize === 'G4' && csdparam === 'xfd') ||
					(normalize === 'G6' && csdparam === 'page') ||
					(normalize === 'G6' && csdparam === 'fullvotepage') ||
					(normalize === 'G6' && csdparam === 'sourcepage') ||
					(normalize === 'A2' && csdparam === 'source') ||
					(normalize === 'A10' && csdparam === 'article') ||
					(normalize === 'F1' && csdparam === 'filename')) {
					input = '[[:' + input + ']]';
				} else if (normalize === 'G5' && csdparam === 'user') {
					input = '[[:User:' + input + ']]';
				} else if (normalize === 'G12' && csdparam.lastIndexOf('url', 0) === 0 && input.lastIndexOf('http', 0) === 0) {
					input = '[' + input + ' ' + input + ']';
				} else if (normalize === 'F8' && csdparam === 'filename') {
					input = '[[commons:' + input + ']]';
				}
				return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
			};

			let extraInfo = '';

			// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
			const fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])' : '';

			let editsummary = 'Logging speedy deletion nomination';
			let appendText = '# [[:' + Morebits.pageNameNorm;

			if (!params.normalizeds.includes('g10')) { // no article name in log for G10 taggings
				appendText += ']]' + fileLogLink + ': ';
				editsummary += ' of [[:' + Morebits.pageNameNorm + ']].';
			} else {
				appendText += '|This]] attack page' + fileLogLink + ': ';
				editsummary += ' of an attack page.';
			}
			if (params.normalizeds.length > 1) {
				appendText += 'multiple criteria (';
				$.each(params.normalizeds, (index, norm) => {
					appendText += '[[WP:CSD#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']], ';
				});
				appendText = appendText.substr(0, appendText.length - 2); // remove trailing comma
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
					params.templateParams.forEach((item, index) => {
						const keys = Object.keys(item);
						if (keys[0] !== undefined && keys[0].length > 0) {
							// Second loop required since some items (G12, F9) may have multiple keys
							keys.forEach((key, keyIndex) => {
								if (keys[keyIndex] === 'blanked' || keys[keyIndex] === 'ts') {
									return true; // Not worth logging
								}
								extraInfo += formatParamLog(params.normalizeds[index].toUpperCase(), keys[keyIndex], item[key]);
							});
						}
					});
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
	let parameters = [];

	$.each(values, (index, value) => {
		const currentParams = [];
		switch (value) {
			case 'reason':
				if (form['csd.reason_1']) {
					const dbrationale = form['csd.reason_1'].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert('Custom rationale:  Please specify a rationale.');
						parameters = null;
						return false;
					}
					currentParams['1'] = dbrationale;
				}
				break;

			case 'userreq': // U1
				if (form['csd.userreq_rationale']) {
					const u1rationale = form['csd.userreq_rationale'].value;
					if (mw.config.get('wgNamespaceNumber') === 3 && !(/\//).test(mw.config.get('wgTitle')) &&
							(!u1rationale || !u1rationale.trim())) {
						alert('CSD U1:  Please specify a rationale when nominating user talk pages.');
						parameters = null;
						return false;
					}
					currentParams.rationale = u1rationale;
				}
				break;

			case 'u6': // U6
				if (mw.config.get('wgNamespaceNumber') !== 2 || !(/\//).test(mw.config.get('wgTitle'))) {
					alert('CSD U6:  Please only nominate user subpages.');
					parameters = null;
					return false;
				}
				break;

			case 'u7': // U7
				if (mw.config.get('wgNamespaceNumber') !== 2) {
					alert('CSD U7:  Please only nominate user subpages.');
					parameters = null;
					return false;
				}
				if (!(/\//).test(mw.config.get('wgTitle'))) {
					alert('CSD U7:  Please only nominate user subpages. Top-level userpages matching U7 criteria can be blanked instead.');
					parameters = null;
					return false;
				}
				if (form.creative.checked) {
					currentParams.creative = 'yes';
				}
				if (form.professional.checked) {
					currentParams.professional = 'yes';
				}
				if (form.personal.checked) {
					currentParams.personal = 'yes';
				}
				if (form.links.checked) {
					currentParams.links = 'yes';
				}
				break;

			case 'repost': // G4
				if (form['csd.repost_xfd']) {
					const deldisc = form['csd.repost_xfd'].value;
					if (deldisc) {
						currentParams.xfd = deldisc;
					}
				}
				break;

			case 'banned': // G5
				if (form['csd.banned_user'] && form['csd.banned_user'].value) {
					currentParams.user = form['csd.banned_user'].value.replace(/^\s*User:/i, '');
				}
				break;

			case 'gs': // G5
				if (form['csd.code']) {
					currentParams.code = form['csd.code'].value;
				}
				break;

			case 'move': // G6
				if (form['csd.move_page'] && form['csd.move_reason']) {
					const movepage = form['csd.move_page'].value,
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

			case 'xfd': // G6
				if (form['csd.xfd_fullvotepage']) {
					const xfd = form['csd.xfd_fullvotepage'].value;
					if (xfd) {
						currentParams.fullvotepage = xfd;
					}
				}
				break;

			case 'afc-move': // G6
				if (form['csd.draft_page']) {
					const draftpage = form['csd.draft_page'].value;
					if (!draftpage || !draftpage.trim()) {
						alert('CSD G6 (AfC move):  Please specify the draft to be moved here.');
						parameters = null;
						return false;
					}
					currentParams.page = draftpage;
				}
				break;

			case 'copypaste': // G6
				if (form['csd.copypaste_sourcepage']) {
					const copypaste = form['csd.copypaste_sourcepage'].value;
					if (!copypaste || !copypaste.trim()) {
						alert('CSD G6 (copypaste):  Please specify the source page name.');
						parameters = null;
						return false;
					}
					currentParams.sourcepage = copypaste;
				}
				break;

			case 'g6': // G6
				if (form['csd.g6_rationale'] && form['csd.g6_rationale'].value) {
					currentParams.rationale = form['csd.g6_rationale'].value;
				}
				break;

			case 'author': // G7
				if (form['csd.author_rationale'] && form['csd.author_rationale'].value) {
					currentParams.rationale = form['csd.author_rationale'].value;
				}
				break;

			case 'g8': // G8
				if (form['csd.g8_rationale'] && form['csd.g8_rationale'].value) {
					currentParams.rationale = form['csd.g8_rationale'].value;
				}
				break;

			case 'attack': // G10
				currentParams.blanked = 'yes';
				// it is actually blanked elsewhere in code, but setting the flag here
				break;

			case 'copyvio': // G12
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

			case 'afc': // G13
				currentParams.ts = '$TIMESTAMP'; // to be replaced by the last revision timestamp when page is saved
				break;

			case 'llm': // G15
				if ( form['csd.subcriteria'] && form['csd.subcriteria'].value) {
					if (form['csd.subcriteria'].value === 'communication') {
						currentParams.communication = 'yes';
					} else if (form['csd.subcriteria'].value === 'nonsensical' || form['csd.subcriteria'].value === 'implausible') {
						currentParams.references = 'yes';
						if ( form['csd.subcriteria'].value === 'nonsensical' ) {
							currentParams.reason = 'Nonsensical references';
						} else {
							currentParams.reason = 'Implausible references';
						}

						if (form['csd.reason'] && form['csd.reason'].value) {
							currentParams.reason += ': ' + form['csd.reason'].value;
						}
					}
				}

				if (form['csd.reason'] && form['csd.reason'].value && !(form['csd.subcriteria'] && form['csd.subcriteria'].value)) {
					currentParams.reason = form['csd.reason'].value;
				}
				break;

			case 'redundantimage': // F1
				if (form['csd.redundantimage_filename']) {
					const redimage = form['csd.redundantimage_filename'].value;
					if (!redimage || !redimage.trim()) {
						alert('CSD F1:  Please specify the filename of the other file.');
						parameters = null;
						return false;
					}
					currentParams.filename = new RegExp('^\\s*' + Morebits.namespaceRegex(6) + ':', 'i').test(redimage) ? redimage : 'File:' + redimage;
				}
				break;

			case 'badfairuse': // F7
				if (form['csd.badfairuse_rationale'] && form['csd.badfairuse_rationale'].value) {
					currentParams.rationale = form['csd.badfairuse_rationale'].value;
				}
				break;

			case 'commons': // F8
				if (form['csd.commons_filename']) {
					const filename = form['csd.commons_filename'].value;
					if (filename && filename.trim() && filename !== Morebits.pageNameNorm) {
						currentParams.filename = new RegExp('^\\s*' + Morebits.namespaceRegex(6) + ':', 'i').test(filename) ? filename : 'File:' + filename;
					}
				}
				break;

			case 'imgcopyvio': // F9
				if (form['csd.imgcopyvio_url'] && form['csd.imgcopyvio_rationale']) {
					const f9url = form['csd.imgcopyvio_url'].value;
					const f9rationale = form['csd.imgcopyvio_rationale'].value;
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

			case 'foreign': // A2
				if (form['csd.foreign_source']) {
					const foreignlink = form['csd.foreign_source'].value;
					if (!foreignlink || !foreignlink.trim()) {
						alert('CSD A2:  Please specify an interwiki link to the article of which this is a copy.');
						parameters = null;
						return false;
					}
					currentParams.source = foreignlink;
				}
				break;

			case 'a10': // A10
				if (form['csd.a10_article']) {
					const duptitle = form['csd.a10_article'].value;
					if (!duptitle || !duptitle.trim()) {
						alert('CSD A10:  Please specify the name of the article which is duplicated.');
						parameters = null;
						return false;
					}
					currentParams.article = duptitle;
				}
				break;

			case 'c4': // C4
				if (form['csd.c4_rationale'] && form['csd.c4_rationale'].value) {
					currentParams.rationale = form['csd.c4_rationale'].value;
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
	const utparams = [];

	// Special cases
	if (normalized === 'db') {
		utparams['2'] = parameters['1'];
	} else if (normalized === 'g6') {
		utparams.key1 = 'to';
		utparams.value1 = Morebits.pageNameNorm;
	} else if (normalized === 'g12') {
		['url', 'url2', 'url3'].forEach((item, idx) => {
			if (parameters[item]) {
				idx++;
				utparams['key' + idx] = item;
				utparams['value' + idx] = utparams[item] = parameters[item];
			}
		});
	} else {
		// Handle the rest
		let param;
		switch (normalized) {
			case 'g4':
				param = 'xfd';
				break;
			case 'g5': // Only for db-gs, as db-g5 doesn't send a notice
				param = 'code';
				break;
			case 'a2':
				param = 'source';
				break;
			case 'a10':
				param = 'article';
				break;
			case 'f9':
				param = 'url';
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

/**
 * @param {Event} e
 * @return {Array}
 */
Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	const values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert('Please select a criterion!');
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e) {
	const form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	const tag_only = form.tag_only;
	if (tag_only && tag_only.checked) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	const values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	const templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	const normalizeds = values.map((value) => Twinkle.speedy.normalizeHash[value]);

	// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
	let watchPage, promptForSummary;
	normalizeds.forEach((norm) => {
		if (Twinkle.getPref('watchSpeedyPages').includes(norm)) {
			watchPage = Twinkle.getPref('watchSpeedyExpiry');
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').includes(norm)) {
			promptForSummary = true;
		}
	});

	const warnusertalk = form.warnusertalk.checked && normalizeds.some((norm, index) => Twinkle.getPref('warnUserOnSpeedyDelete').includes(norm) &&
			!(norm === 'g6' && values[index] !== 'copypaste') && !(norm === 'g5' && values[index] !== 'gs'));

	const welcomeuser = warnusertalk && normalizeds.some((norm) => Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').includes(norm));

	const params = {
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

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	Twinkle.speedy.callbacks.sysop.main(params);
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	const form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	const values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	const templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	// var multiple = form.multiple.checked;

	const normalizeds = values.map((value) => Twinkle.speedy.normalizeHash[value]);

	// analyse each criterion to determine whether to watch the page/notify the creator
	const watchPage = normalizeds.some((csdCriteria) => Twinkle.getPref('watchSpeedyPages').includes(csdCriteria)) && Twinkle.getPref('watchSpeedyExpiry');

	const notifyuser = form.notify.checked && normalizeds.some((norm, index) => Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').includes(norm) &&
			!(norm === 'g6' && values[index] !== 'copypaste') && !(norm === 'g5' && values[index] !== 'gs'));
	const welcomeuser = notifyuser && normalizeds.some((norm) => Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').includes(norm));
	const csdlog = Twinkle.getPref('logSpeedyNominations') && normalizeds.some((norm) => !Twinkle.getPref('noLogOnSpeedyNomination').includes(norm));

	const params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog,
		requestsalt: form.salting.checked,
		templateParams: templateParams
	};

	Morebits.SimpleWindow.setButtonsEnabled(false);
	Morebits.Status.init(form);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete';

	const wikipedia_page = new Morebits.wiki.Page(mw.config.get('wgPageName'), 'Tagging page');
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
}());

// </nowiki>
