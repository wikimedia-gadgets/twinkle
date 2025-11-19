// <nowiki>

(function() {

/*
 ****************************************
 *** twinkleconfig.js: Preferences module
 ****************************************
 * Mode of invocation:     Adds configuration form to Wikipedia:Twinkle/Preferences,
                           and adds an ad box to the top of user subpages belonging to the
                           currently logged-in user which end in '.js'
 * Active on:              What I just said.  Yeah.
 */

Twinkle.config = {};

Twinkle.config.watchlistEnums = {
	yes: 'Add to watchlist (indefinitely)',
	no: "Don't add to watchlist",
	default: 'Follow your site preferences',
	'1 week': 'Watch for 1 week',
	'1 month': 'Watch for 1 month',
	'3 months': 'Watch for 3 months',
	'6 months': 'Watch for 6 months'
};

Twinkle.config.commonSets = {
	csdCriteria: {
		db: 'Custom rationale ({{db}})',
		a1: 'A1', a2: 'A2', a3: 'A3', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		c1: 'C1', c4: 'C4',
		f1: 'F1', f2: 'F2', f3: 'F3', f7: 'F7', f8: 'F8', f9: 'F9',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g10: 'G10', g11: 'G11', g12: 'G12', g13: 'G13', g14: 'G14', g15: 'G15',
		r2: 'R2', r3: 'R3', r4: 'R4',
		t5: 'T5',
		u1: 'U1', u2: 'U2', u6: 'U6', u7: 'U7',
		x3: 'X3'
	},
	csdCriteriaNotification: {
		db: 'Custom rationale ({{db}})',
		a1: 'A1', a2: 'A2', a3: 'A3', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		c1: 'C1',
		f1: 'F1', f2: 'F2', f3: 'F3', f7: 'F7', f9: 'F9',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5 ("general sanction violation" only)', g6: 'G6 ("copy-paste move" only)', g10: 'G10', g11: 'G11', g12: 'G12', g13: 'G13', g14: 'G14', g15: 'G15',
		r2: 'R2', r3: 'R3', r4: 'R4',
		u6: 'U6', u7: 'U7',
		x3: 'X3'
	},
	csdAndImageDeletionCriteria: {
		db: 'Custom rationale ({{db}})',
		a1: 'A1', a2: 'A2', a3: 'A3', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		c1: 'C1', c4: 'C4',
		f1: 'F1', f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5', f6: 'F6', f7: 'F7', f8: 'F8', f9: 'F9', f11: 'F11',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g10: 'G10', g11: 'G11', g12: 'G12', g13: 'G13', g14: 'G14', g15: 'G15',
		r2: 'R2', r3: 'R3', r4: 'R4',
		t5: 'T5',
		u1: 'U1', u2: 'U2', u6: 'U6', u7: 'U7',
		x3: 'X3'
	},
	namespacesNoSpecial: {
		0: 'Article',
		1: 'Talk (article)',
		2: 'User',
		3: 'User talk',
		4: 'Wikipedia',
		5: 'Wikipedia talk',
		6: 'File',
		7: 'File talk',
		8: 'MediaWiki',
		9: 'MediaWiki talk',
		10: 'Template',
		11: 'Template talk',
		12: 'Help',
		13: 'Help talk',
		14: 'Category',
		15: 'Category talk',
		100: 'Portal',
		101: 'Portal talk',
		118: 'Draft',
		119: 'Draft talk',
		710: 'TimedText',
		711: 'TimedText talk',
		828: 'Module',
		829: 'Module talk'
	}
};

Twinkle.config.commonSets.csdCriteriaDisplayOrder = Object.keys( Twinkle.config.commonSets.csdCriteria );
Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder = Object.keys( Twinkle.config.commonSets.csdCriteriaNotification );
Twinkle.config.commonSets.csdAndImageDeletionCriteriaDisplayOrder = Object.keys( Twinkle.config.commonSets.csdAndImageDeletionCriteria );

/**
 * Section entry format:
 *
 * {
 *   title: <human-readable section title>,
 *   module: <name of the associated module, used to link to sections>,
 *   adminOnly: <true for admin-only sections>,
 *   hidden: <true for advanced preferences that rarely need to be changed - they can still be modified by manually editing twinkleoptions.js>,
 *   preferences: [
 *     {
 *       name: <TwinkleConfig property name>,
 *       label: <human-readable short description - used as a form label>,
 *       helptip: <(optional) human-readable text (using valid HTML) that complements the description, like limits, warnings, etc.>
 *       adminOnly: <true for admin-only preferences>,
 *       type: <string|boolean|integer|enum|set|customList> (customList stores an array of JSON objects { value, label }),
 *       enumValues: <for type = "enum": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setValues: <for type = "set": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setDisplayOrder: <(optional) for type = "set": an array containing the keys of setValues (as strings) in the order that they are displayed>,
 *       customListValueTitle: <for type = "customList": the heading for the left "value" column in the custom list editor>,
 *       customListLabelTitle: <for type = "customList": the heading for the right "label" column in the custom list editor>
 *     },
 *     . . .
 *   ]
 * },
 * . . .
 *
 */

Twinkle.config.sections = [
	{
		title: 'General',
		module: 'general',
		preferences: [
			// TwinkleConfig.userTalkPageMode may take arguments:
			// 'window': open a new window, remember the opened window
			// 'tab': opens in a new tab, if possible.
			// 'blank': force open in a new window, even if such a window exists
			{
				name: 'userTalkPageMode',
				label: 'When opening a user talk page, open it',
				type: 'enum',
				enumValues: { window: 'In a window, replacing other user talks', tab: 'In a new tab', blank: 'In a totally new window' }
			},

			// TwinkleConfig.dialogLargeFont (boolean)
			{
				name: 'dialogLargeFont',
				label: 'Use larger text in Twinkle dialogs',
				type: 'boolean'
			},

			// Twinkle.config.disabledModules (array)
			{
				name: 'disabledModules',
				label: 'Turn off the selected Twinkle modules',
				helptip: 'Anything you select here will NOT be available for use, so act with care. Uncheck to reactivate.',
				type: 'set',
				setValues: { arv: 'ARV', warn: 'Warn', welcome: 'Welcome', shared: 'Shared IP', talkback: 'Talkback', speedy: 'CSD', prod: 'PROD', xfd: 'XfD', image: 'Image (DI)', protect: 'Protect (RPP)', tag: 'Tag', diff: 'Diff', unlink: 'Unlink', rollback: 'Revert and rollback' }
			},

			// Twinkle.config.disabledSysopModules (array)
			{
				name: 'disabledSysopModules',
				label: 'Turn off the selected admin-only modules',
				helptip: 'Anything you select here will NOT be available for use, so act with care. Uncheck to reactivate.',
				adminOnly: true,
				type: 'set',
				setValues: { block: 'Block', deprod: 'DePROD', batchdelete: 'D-batch', batchprotect: 'P-batch', batchundelete: 'Und-batch' }
			}
		]
	},

	{
		title: 'ARV',
		module: 'arv',
		preferences: [
			{
				name: 'spiWatchReport',
				label: 'Add sockpuppet report pages to watchlist',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'Block user',
		module: 'block',
		adminOnly: true,
		preferences: [
			// TwinkleConfig.defaultToBlock64 (boolean)
			// Whether to default to just blocking the /64 on or off
			{
				name: 'defaultToBlock64',
				label: 'For IPv6 addresses, select the option to block the /64 range by default',
				type: 'boolean'
			},

			// TwinkleConfig.defaultToPartialBlocks (boolean)
			// Whether to default partial blocks on or off
			{
				name: 'defaultToPartialBlocks',
				label: 'Select partial blocks by default when opening the block menu',
				helptip: 'If the user is already blocked, this will be overridden in favor of defaulting to the current block type',
				type: 'boolean'
			},

			// TwinkleConfig.blankTalkpageOnIndefBlock (boolean)
			// if true, blank the talk page when issuing an indef block notice (per [[WP:UWUL#Indefinitely blocked users]])
			{
				name: 'blankTalkpageOnIndefBlock',
				label: 'Blank the talk page when indefinitely blocking users',
				helptip: 'See <a href="' + mw.util.getUrl('Wikipedia:WikiProject_User_warnings/Usage_and_layout#Indefinitely_blocked_users') + '">WP:UWUL</a> for more information.',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Image deletion (DI)',
		module: 'image',
		preferences: [
			// TwinkleConfig.notifyUserOnDeli (boolean)
			// If the user should be notified after placing a file deletion tag
			{
				name: 'notifyUserOnDeli',
				label: 'Check the "notify initial uploader" box by default',
				type: 'boolean'
			},

			// TwinkleConfig.deliWatchPage (string)
			// The watchlist setting of the page tagged for deletion.
			{
				name: 'deliWatchPage',
				label: 'Add image page to watchlist when tagging',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.deliWatchUser (string)
			// The watchlist setting of the user talk page if a notification is placed.
			{
				name: 'deliWatchUser',
				label: 'Add user talk page of initial uploader to watchlist when notifying',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'Page protection ' + (Morebits.userIsSysop ? '(PP)' : '(RPP)'),
		module: 'protect',
		preferences: [
			{
				name: 'watchRequestedPages',
				label: 'Add page to watchlist when requesting protection',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchPPTaggedPages',
				label: 'Add page to watchlist when tagging with protection template',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchProtectedPages',
				label: 'Add page to watchlist when protecting',
				helptip: 'If also tagging the page after protection, that preference will be favored.',
				adminOnly: true,
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'Proposed deletion (PROD)',
		module: 'prod',
		preferences: [
			// TwinkleConfig.watchProdPages (string)
			// Watchlist setting when applying prod template to page
			{
				name: 'watchProdPages',
				label: 'Add article to watchlist when tagging',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.markProdPagesAsPatrolled (boolean)
			// If, when applying prod template to page, to mark the page as curated/patrolled (if the page was reached from NewPages)
			{
				name: 'markProdPagesAsPatrolled',
				label: 'Mark page as patrolled/reviewed when tagging (if possible)',
				helptip: 'This should probably not be checked as doing so is against best practice consensus',
				type: 'boolean'
			},

			// TwinkleConfig.prodReasonDefault (string)
			// The prefilled PROD reason.
			{
				name: 'prodReasonDefault',
				label: 'Prefilled PROD reason',
				type: 'string'
			},

			{
				name: 'logProdPages',
				label: 'Keep a log in userspace of all pages you tag for PROD',
				helptip: 'Since non-admins do not have access to their deleted contributions, the userspace log offers a good way to keep track of all pages you tag for PROD using Twinkle.',
				type: 'boolean'
			},
			{
				name: 'prodLogPageName',
				label: 'Keep the PROD userspace log at this user subpage',
				helptip: 'Enter a subpage name in this box. You will find your PROD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the PROD userspace log.',
				type: 'string'
			}
		]
	},

	{
		title: 'Revert and rollback',
		module: 'rollback',
		preferences: [
			// TwinkleConfig.autoMenuAfterRollback (bool)
			// Option to automatically open the warning menu if the user talk page is opened post-reversion
			{
				name: 'autoMenuAfterRollback',
				label: 'Automatically open the Twinkle warn menu on a user talk page after Twinkle rollback',
				helptip: 'Only operates if the relevant box is checked below.',
				type: 'boolean'
			},

			// TwinkleConfig.openTalkPage (array)
			// What types of actions that should result in opening of talk page
			{
				name: 'openTalkPage',
				label: 'Open user talk page after these types of reversions',
				type: 'set',
				setValues: { agf: 'AGF rollback', norm: 'Normal rollback', vand: 'Vandalism rollback' }
			},

			// TwinkleConfig.openTalkPageOnAutoRevert (bool)
			// Defines if talk page should be opened when calling revert from contribs or recent changes pages. If set to true, openTalkPage defines then if talk page will be opened.
			{
				name: 'openTalkPageOnAutoRevert',
				label: 'Open user talk page when invoking rollback from user contributions or recent changes',
				helptip: 'When this is on, the desired options must be enabled in the previous setting for this to work.',
				type: 'boolean'
			},

			// TwinkleConfig.rollbackInPlace (bool)
			//
			{
				name: 'rollbackInPlace',
				label: "Don't reload the page when rolling back from contributions or recent changes",
				helptip: "When this is on, Twinkle won't reload the contributions or recent changes feed after reverting, allowing you to revert more than one edit at a time.",
				type: 'boolean'
			},

			// TwinkleConfig.markRevertedPagesAsMinor (array)
			// What types of actions that should result in marking edit as minor
			{
				name: 'markRevertedPagesAsMinor',
				label: 'Mark as minor edit for these types of reversions',
				type: 'set',
				setValues: { agf: 'AGF rollback', norm: 'Normal rollback', vand: 'Vandalism rollback', torev: '"Restore this version"' }
			},

			// TwinkleConfig.watchRevertedPages (array)
			// What types of actions that should result in forced addition to watchlist
			{
				name: 'watchRevertedPages',
				label: 'Add pages to watchlist for these types of reversions',
				type: 'set',
				setValues: { agf: 'AGF rollback', norm: 'Normal rollback', vand: 'Vandalism rollback', torev: '"Restore this version"' }
			},
			// TwinkleConfig.watchRevertedExpiry
			// If any of the above items are selected, whether to expire the watch
			{
				name: 'watchRevertedExpiry',
				label: 'When reverting a page, how long to watch it for',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.offerReasonOnNormalRevert (boolean)
			// If to offer a prompt for extra summary reason for normal reverts, default to true
			{
				name: 'offerReasonOnNormalRevert',
				label: 'Prompt for reason for normal rollbacks',
				helptip: '"Normal" rollbacks are the ones that are invoked from the middle [rollback] link.',
				type: 'boolean'
			},

			{
				name: 'confirmOnRollback',
				label: 'Require confirmation before reverting (all devices)',
				helptip: 'For users of pen or touch devices, and chronically indecisive people.',
				type: 'boolean'
			},

			{
				name: 'confirmOnMobileRollback',
				label: 'Require confirmation before reverting (mobile devices only)',
				helptip: 'Avoid accidental reversions when on mobile devices.',
				type: 'boolean'
			},

			// TwinkleConfig.showRollbackLinks (array)
			// Where Twinkle should show rollback links:
			// diff, others, mine, contribs, history, recent
			// Note from TTO: |contribs| seems to be equal to |others| + |mine|, i.e. redundant, so I left it out heres
			{
				name: 'showRollbackLinks',
				label: 'Show rollback links on these pages',
				type: 'set',
				setValues: { diff: 'Diff pages', others: 'Contributions pages of other users', mine: 'My contributions page', recent: 'Recent changes and related changes special pages', history: 'History pages' }
			}
		]
	},

	{
		title: 'Shared IP tagging',
		module: 'shared',
		preferences: [
			{
				name: 'markSharedIPAsMinor',
				label: 'Mark shared IP tagging as a minor edit',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Speedy deletion (CSD)',
		module: 'speedy',
		preferences: [
			{
				name: 'speedySelectionStyle',
				label: 'When to go ahead and tag/delete the page',
				type: 'enum',
				enumValues: { buttonClick: 'When I click "Submit"', radioClick: 'As soon as I click an option' }
			},

			// TwinkleConfig.watchSpeedyPages (array)
			// Whether to add speedy tagged or deleted pages to watchlist
			{
				name: 'watchSpeedyPages',
				label: 'Add page to watchlist when using these criteria',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDisplayOrder
			},
			// TwinkleConfig.watchSpeedyExpiry
			// If any of the above items are selected, whether to expire the watch
			{
				name: 'watchSpeedyExpiry',
				label: 'When tagging a page, how long to watch it for',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
			// If, when applying speedy template to page, to mark the page as triaged/patrolled (if the page was reached from NewPages)
			{
				name: 'markSpeedyPagesAsPatrolled',
				label: 'Mark page as patrolled/reviewed when tagging (if possible)',
				helptip: 'This should probably not be checked as doing so is against best practice consensus',
				type: 'boolean'
			},

			// TwinkleConfig.watchSpeedyUser (string)
			// The watchlist setting of the user talk page if they receive a notification.
			{
				name: 'watchSpeedyUser',
				label: 'Add user talk page of initial contributor to watchlist (when notifying)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.welcomeUserOnSpeedyDeletionNotification (array of strings)
			// On what types of speedy deletion notifications shall the user be welcomed
			// with a "firstarticle" notice if their talk page has not yet been created.
			{
				name: 'welcomeUserOnSpeedyDeletionNotification',
				label: 'Welcome page creator when notifying with these criteria',
				helptip: 'The welcome is issued only if the user is notified about the deletion, and only if their talk page does not already exist. The template used is {{firstarticle}}.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.notifyUserOnSpeedyDeletionNomination (array)
			// What types of actions should result in the author of the page being notified of nomination
			{
				name: 'notifyUserOnSpeedyDeletionNomination',
				label: 'Notify page creator when tagging with these criteria',
				helptip: 'Even if you choose to notify from the CSD screen, the notification will only take place for those criteria selected here.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.warnUserOnSpeedyDelete (array)
			// What types of actions should result in the author of the page being notified of speedy deletion (admin only)
			{
				name: 'warnUserOnSpeedyDelete',
				label: 'Notify page creator when deleting under these criteria',
				helptip: 'Even if you choose to notify from the CSD screen, the notification will only take place for those criteria selected here.',
				adminOnly: true,
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.promptForSpeedyDeletionSummary (array of strings)
			{
				name: 'promptForSpeedyDeletionSummary',
				label: 'Allow editing of deletion summary when deleting under these criteria',
				adminOnly: true,
				type: 'set',
				setValues: Twinkle.config.commonSets.csdAndImageDeletionCriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdAndImageDeletionCriteriaDisplayOrder
			},

			// TwinkleConfig.deleteTalkPageOnDelete (boolean)
			// If talk page if exists should also be deleted (CSD G8) when spedying a page (admin only)
			{
				name: 'deleteTalkPageOnDelete',
				label: 'Check the "also delete talk page" box by default',
				adminOnly: true,
				type: 'boolean'
			},

			{
				name: 'deleteRedirectsOnDelete',
				label: 'Check the "also delete redirects" box by default',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.deleteSysopDefaultToDelete (boolean)
			// Make the CSD screen default to "delete" instead of "tag" (admin only)
			{
				name: 'deleteSysopDefaultToDelete',
				label: 'Default to outright deletion instead of speedy tagging',
				helptip: 'If there is a CSD tag already present, Twinkle will always default to "delete" mode',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowWidth',
				label: 'Width of speedy deletion window (pixels)',
				type: 'integer'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowHeight',
				label: 'Height of speedy deletion window (pixels)',
				helptip: 'If you have a big monitor, you might like to increase this.',
				type: 'integer'
			},

			{
				name: 'logSpeedyNominations',
				label: 'Keep a log in userspace of all CSD nominations',
				helptip: 'Since non-admins do not have access to their deleted contributions, the userspace log offers a good way to keep track of all pages you nominate for CSD using Twinkle. Files tagged using DI are also added to this log.',
				type: 'boolean'
			},
			{
				name: 'speedyLogPageName',
				label: 'Keep the CSD userspace log at this user subpage',
				helptip: 'Enter a subpage name in this box. You will find your CSD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the CSD userspace log.',
				type: 'string'
			},
			{
				name: 'noLogOnSpeedyNomination',
				label: 'Do not create a userspace log entry when tagging with these criteria',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdAndImageDeletionCriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdAndImageDeletionCriteriaDisplayOrder
			}
		]
	},

	{
		title: 'Tag',
		module: 'tag',
		preferences: [
			{
				name: 'watchTaggedVenues',
				label: 'Add page to watchlist when tagging these type of pages',
				type: 'set',
				setValues: { articles: 'Articles', drafts: 'Drafts', redirects: 'Redirects', files: 'Files' }
			},
			{
				name: 'watchTaggedPages',
				label: 'When tagging a page, how long to watch it for',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchMergeDiscussions',
				label: 'Add talk pages to watchlist when starting merge discussions',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'markTaggedPagesAsMinor',
				label: 'Mark addition of tags as a minor edit',
				type: 'boolean'
			},
			{
				name: 'markTaggedPagesAsPatrolled',
				label: 'Check the "mark page as patrolled/reviewed" box by default',
				type: 'boolean'
			},
			{
				name: 'groupByDefault',
				label: 'Check the "group into {{multiple issues}}" box by default',
				type: 'boolean'
			},
			{
				name: 'tagArticleSortOrder',
				label: 'Default view order for article tags',
				type: 'enum',
				enumValues: { cat: 'By categories', alpha: 'In alphabetical order' }
			},
			{
				name: 'customTagList',
				label: 'Custom article/draft maintenance tags to display',
				helptip: "These appear as additional options at the bottom of the list of tags. For example, you could add new maintenance tags which have not yet been added to Twinkle's defaults.",
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Tag dialog'
			},
			{
				name: 'customFileTagList',
				label: 'Custom file maintenance tags to display',
				helptip: 'Additional tags that you wish to add for files.',
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Tag dialog'
			},
			{
				name: 'customRedirectTagList',
				label: 'Custom redirect category tags to display',
				helptip: 'Additional tags that you wish to add for redirects.',
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Tag dialog'
			}
		]
	},

	{
		title: 'Talkback',
		module: 'talkback',
		preferences: [
			{
				name: 'markTalkbackAsMinor',
				label: 'Mark talkbacks as minor edits',
				type: 'boolean'
			},
			{
				name: 'insertTalkbackSignature',
				label: 'Insert signature within talkbacks',
				type: 'boolean'
			},
			{
				name: 'talkbackHeading',
				label: 'Section heading to use for talkback and please see',
				tooltip: 'Should NOT include the equals signs ("==") used for wikitext formatting',
				type: 'string'
			},
			{
				name: 'mailHeading',
				label: "Section heading to use for \"you've got mail\" notices",
				tooltip: 'Should NOT include the equals signs ("==") used for wikitext formatting',
				type: 'string'
			}
		]
	},

	{
		title: 'Unlink',
		module: 'unlink',
		preferences: [
			// TwinkleConfig.unlinkNamespaces (array)
			// In what namespaces unlink should happen, default in 0 (article), 10 (template), 100 (portal), and 118 (draft)
			{
				name: 'unlinkNamespaces',
				label: 'Remove links from pages in these namespaces',
				helptip: 'Avoid selecting any talk namespaces, as Twinkle might end up unlinking on talk archives (a big no-no).',
				type: 'set',
				setValues: Twinkle.config.commonSets.namespacesNoSpecial
			}
		]
	},

	{
		title: 'Warn user',
		module: 'warn',
		preferences: [
			// TwinkleConfig.defaultWarningGroup (int)
			// Which level warning should be the default selected group, default is 1
			{
				name: 'defaultWarningGroup',
				label: 'Default warning level',
				type: 'enum',
				enumValues: {
					1: 'Level 1',
					2: 'Level 2',
					3: 'Level 3',
					4: 'Level 4',
					5: 'Level 4im',
					6: 'Single-issue notices',
					7: 'Single-issue warnings',
					// 8 was used for block templates before #260
					9: 'Custom warnings',
					10: 'All warning templates',
					11: 'Auto-select level (1-4)'
				}
			},

			// TwinkleConfig.combinedSingletMenus (boolean)
			// if true, show one menu with both single-issue notices and warnings instead of two separately
			{
				name: 'combinedSingletMenus',
				label: 'Replace the two separate single-issue menus into one combined menu',
				helptip: 'Selecting either single-issue notices or single-issue warnings as your default will make this your default if enabled.',
				type: 'boolean'
			},

			// TwinkleConfig.showSharedIPNotice may take arguments:
			// true: to show shared ip notice if an IP address
			// false: to not print the notice
			{
				name: 'showSharedIPNotice',
				label: 'Add extra notice on shared IP talk pages',
				helptip: 'Notice used is {{Shared IP advice}}',
				type: 'boolean'
			},

			// TwinkleConfig.watchWarnings (string)
			// Watchlist setting for the page which has been dispatched an warning or notice
			{
				name: 'watchWarnings',
				label: 'Add user talk page to watchlist when notifying',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.oldSelect (boolean)
			// if true, use the native select menu rather the select2-based one
			{
				name: 'oldSelect',
				label: 'Use the non-searchable classic select menu',
				type: 'boolean'
			},

			{
				name: 'customWarningList',
				label: 'Custom warning templates to display',
				helptip: 'You can add individual templates or user subpages. Custom warnings appear in the "Custom warnings" category within the warning dialog box.',
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in warning list (also used as edit summary)'
			}
		]
	},

	{
		title: 'Welcome user',
		module: 'welcome',
		preferences: [
			{
				name: 'topWelcomes',
				label: 'Place welcomes above existing content on user talk pages',
				type: 'boolean'
			},
			{
				name: 'watchWelcomes',
				label: 'Add user talk pages to watchlist when welcoming',
				helptip: 'Doing so adds to the personal element of welcoming a user - you will be able to see how they are coping as a newbie, and possibly help them.',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'insertUsername',
				label: 'Add your username to the template (where applicable)',
				helptip: "Some welcome templates have an opening sentence like \"Hi, I'm &lt;username&gt;. Welcome\" etc. If you turn off this option, these templates will not display your username in that way.",
				type: 'boolean'
			},
			{
				name: 'quickWelcomeMode',
				label: 'Clicking the "welcome" link on a diff page (which only appears if the editor\'s user talk page has not been created yet) will',
				helptip: 'If you choose to welcome automatically, the template you specify below will be used.',
				type: 'enum',
				enumValues: { auto: 'immediately post the welcome template specified below', norm: 'prompt you to select a template' }
			},
			{
				name: 'quickWelcomeTemplate',
				label: 'Template to use when welcoming automatically',
				helptip: 'Enter the name of a welcome template, without the curly brackets. A link to the given article will be added.',
				type: 'string'
			},
			{
				name: 'customWelcomeList',
				label: 'Custom welcome templates to display',
				helptip: "You can add other welcome templates, or user subpages that are welcome templates (prefixed with \"User:\"). Don't forget that these templates are substituted onto user talk pages.",
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Welcome dialog'
			},
			{
				name: 'customWelcomeSignature',
				label: 'Automatically sign custom welcome templates',
				helptip: 'If your custom welcome templates contain a built-in signature within the template, turn off this option.',
				type: 'boolean'
			}
		]
	},

	{
		title: 'XFD (deletion discussions)',
		module: 'xfd',
		preferences: [
			{
				name: 'logXfdNominations',
				label: 'Keep a log in userspace of all pages you nominate for a deletion discussion (XfD)',
				helptip: 'The userspace log offers a good way to keep track of all pages you nominate for XfD using Twinkle.',
				type: 'boolean'
			},
			{
				name: 'xfdLogPageName',
				label: 'Keep the deletion discussion userspace log at this user subpage',
				helptip: 'Enter a subpage name in this box. You will find your XfD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the XfD userspace log.',
				type: 'string'
			},
			{
				name: 'noLogOnXfdNomination',
				label: 'Do not create a userspace log entry when nominating at this venue',
				type: 'set',
				setValues: { afd: 'AfD', tfd: 'TfD', ffd: 'FfD', cfd: 'CfD', cfds: 'CfD/S', mfd: 'MfD', rfd: 'RfD', rm: 'RM' }
			},

			// TwinkleConfig.xfdWatchPage (string)
			// The watchlist setting of the page being nominated for XfD.
			{
				name: 'xfdWatchPage',
				label: 'Add the nominated page to watchlist',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchDiscussion (string)
			// The watchlist setting of the newly created XfD page (for those processes that create discussion pages for each nomination),
			// or the list page for the other processes.
			{
				name: 'xfdWatchDiscussion',
				label: 'Add the deletion discussion page to watchlist',
				helptip: 'This refers to the discussion subpage (for AfD and MfD) or the daily log page (for TfD, CfD, RfD and FfD)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchList (string)
			// The watchlist setting of the XfD list page, *if* the discussion is on a separate page.
			{
				name: 'xfdWatchList',
				label: 'Add the daily log/list page to the watchlist (AfD and MfD)',
				helptip: 'This only applies for AfD and MfD, where the discussions are transcluded onto a daily log page (for AfD) or the main MfD page (for MfD).',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchUser (string)
			// The watchlist setting of the user talk page if they receive a notification.
			{
				name: 'xfdWatchUser',
				label: 'Add user talk page of initial contributor to watchlist (when notifying)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchRelated (string)
			// The watchlist setting of the target of a redirect being nominated for RfD.
			{
				name: 'xfdWatchRelated',
				label: "Add the redirect's target page to watchlist (when notifying)",
				helptip: 'This only applies for RfD, when leaving a notification on the talk page of the target of the redirect',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			{
				name: 'markXfdPagesAsPatrolled',
				label: 'Mark page as patrolled/reviewed when nominating for AFD (if possible)',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Hidden',
		hidden: true,
		preferences: [
			// twinklerollback.js: defines how many revision to query maximum, maximum possible is 50, default is 50
			{
				name: 'revertMaxRevisions',
				type: 'integer'
			},
			// twinklewarn.js: When using the autolevel select option, how many days makes a prior warning stale
			// Huggle is three days ([[Special:Diff/918980316]] and [[Special:Diff/919417999]]) while ClueBotNG is two:
			// https://github.com/DamianZaremba/cluebotng/blob/4958e25d6874cba01c75f11debd2e511fd5a2ce5/bot/action_functions.php#L62
			{
				name: 'autolevelStaleDays',
				type: 'integer'
			},
			// How many pages should be queried by deprod and batchdelete/protect/undelete
			{
				name: 'batchMax',
				type: 'integer',
				adminOnly: true
			},
			// How many pages should be processed at a time by deprod and batchdelete/protect/undelete
			{
				name: 'batchChunks',
				type: 'integer',
				adminOnly: true
			}
		]
	}

]; // end of Twinkle.config.sections

Twinkle.config.init = function twinkleconfigInit() {

	// create the config page at Wikipedia:Twinkle/Preferences
	if ((mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').project && mw.config.get('wgTitle') === 'Twinkle/Preferences') &&
			mw.config.get('wgAction') === 'view') {

		if (!document.getElementById('twinkle-config')) {
			return; // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
		}

		// set style to nothing to prevent conflict with external css
		document.getElementById('twinkle-config').removeAttribute('style');
		document.getElementById('twinkle-config-titlebar').removeAttribute('style');

		const contentdiv = document.getElementById('twinkle-config-content');
		contentdiv.textContent = ''; // clear children

		// let user know about possible conflict with skin js/common.js file
		// (settings in that file will still work, but they will be overwritten by twinkleoptions.js settings)
		if (window.TwinkleConfig || window.FriendlyConfig) {
			const contentnotice = document.createElement('p');
			contentnotice.innerHTML = '<table class="plainlinks morebits-ombox morebits-ombox-content"><tr><td class="morebits-mbox-image">' +
				'<img alt="" src="https://upload.wikimedia.org/wikipedia/commons/3/38/Imbox_content.png" /></td>' +
				'<td class="morebits-mbox-text"><p><big><b>Before modifying your settings here,</b> you must remove your old Twinkle and Friendly settings from your personal skin JavaScript.</big></p>' +
				'<p>To do this, you can <a href="' + mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/' + mw.config.get('skin') +
				'.js', { action: 'edit' }) + '" target="_blank"><b>edit your personal skin javascript file</b></a> or <a href="' +
				mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/common.js', { action: 'edit'}) + '" target="_blank"><b>your common.js file</b></a>, removing all lines of code that refer to <code>TwinkleConfig</code> and <code>FriendlyConfig</code>.</p>' +
				'</td></tr></table>';
			contentdiv.appendChild(contentnotice);
		}

		// start a table of contents
		const toctable = document.createElement('div');
		toctable.className = 'toc';
		toctable.style.marginLeft = '0.4em';
		// create TOC title
		const toctitle = document.createElement('div');
		toctitle.id = 'toctitle';
		const toch2 = document.createElement('h2');
		toch2.textContent = 'Contents ';
		toctitle.appendChild(toch2);
		// add TOC show/hide link
		const toctoggle = document.createElement('span');
		toctoggle.className = 'toctoggle';
		toctoggle.appendChild(document.createTextNode('['));
		const toctogglelink = document.createElement('a');
		toctogglelink.className = 'internal';
		toctogglelink.setAttribute('href', '#tw-tocshowhide');
		toctogglelink.textContent = 'hide';
		toctoggle.appendChild(toctogglelink);
		toctoggle.appendChild(document.createTextNode(']'));
		toctitle.appendChild(toctoggle);
		toctable.appendChild(toctitle);
		// create item container: this is what we add stuff to
		const tocul = document.createElement('ul');
		toctogglelink.addEventListener('click', () => {
			const $tocul = $(tocul);
			$tocul.toggle();
			if ($tocul.find(':visible').length) {
				toctogglelink.textContent = 'hide';
			} else {
				toctogglelink.textContent = 'show';
			}
		}, false);
		toctable.appendChild(tocul);
		contentdiv.appendChild(toctable);

		const contentform = document.createElement('form');
		contentform.setAttribute('action', 'javascript:void(0)'); // was #tw-save - changed to void(0) to work around Chrome issue
		contentform.addEventListener('submit', Twinkle.config.save, true);
		contentdiv.appendChild(contentform);

		const container = document.createElement('table');
		container.style.width = '100%';
		contentform.appendChild(container);

		$(Twinkle.config.sections).each((sectionkey, section) => {
			if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
				return true; // i.e. "continue" in this context
			}

			// add to TOC
			const tocli = document.createElement('li');
			tocli.className = 'toclevel-1';
			const toca = document.createElement('a');
			toca.setAttribute('href', '#' + section.module);
			toca.appendChild(document.createTextNode(section.title));
			tocli.appendChild(toca);
			tocul.appendChild(tocli);

			let row = document.createElement('tr');
			let cell = document.createElement('td');
			cell.setAttribute('colspan', '3');
			const heading = document.createElement('h4');
			heading.style.borderBottom = '1px solid gray';
			heading.style.marginTop = '0.2em';
			heading.id = section.module;
			heading.appendChild(document.createTextNode(section.title));
			cell.appendChild(heading);
			row.appendChild(cell);
			container.appendChild(row);

			let rowcount = 1; // for row banding

			// add each of the preferences to the form
			$(section.preferences).each((prefkey, pref) => {
				if (pref.adminOnly && !Morebits.userIsSysop) {
					return true; // i.e. "continue" in this context
				}

				row = document.createElement('tr');
				row.style.marginBottom = '0.2em';
				// create odd row banding
				if (rowcount++ % 2 === 0) {
					row.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
				}
				cell = document.createElement('td');

				let label, input;
				const gotPref = Twinkle.getPref(pref.name);
				switch (pref.type) {

					case 'boolean': // create a checkbox
						cell.setAttribute('colspan', '2');

						label = document.createElement('label');
						input = document.createElement('input');
						input.setAttribute('type', 'checkbox');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (gotPref === true) {
							input.setAttribute('checked', 'checked');
						}
						label.appendChild(input);
						label.appendChild(document.createTextNode(pref.label));
						cell.appendChild(label);
						break;

					case 'string': // create an input box
					case 'integer':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('input');
						input.setAttribute('type', 'text');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (pref.type === 'integer') {
							input.setAttribute('size', 6);
							input.setAttribute('type', 'number');
							input.setAttribute('step', '1'); // integers only
						}
						if (gotPref) {
							input.setAttribute('value', gotPref);
						}
						cell.appendChild(input);
						break;

					case 'enum': // create a combo box
						// add label to first column
						// note: duplicates the code above, under string/integer
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('select');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						$.each(pref.enumValues, (enumvalue, enumdisplay) => {
							const option = document.createElement('option');
							option.setAttribute('value', enumvalue);
							if ((gotPref === enumvalue) ||
								// Hack to convert old boolean watchlist prefs
								// to corresponding enums (added in v2.1)
								(typeof gotPref === 'boolean' &&
								((gotPref && enumvalue === 'yes') ||
								(!gotPref && enumvalue === 'no')))) {
								option.setAttribute('selected', 'selected');
							}
							option.appendChild(document.createTextNode(enumdisplay));
							input.appendChild(option);
						});
						cell.appendChild(input);
						break;

					case 'set': // create a set of check boxes
						// add label first of all
						cell.setAttribute('colspan', '2');
						label = document.createElement('label'); // not really necessary to use a label element here, but we do it for consistency of styling
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);

						var checkdiv = document.createElement('div');
						checkdiv.style.paddingLeft = '1em';
						var worker = function(itemkey, itemvalue) {
							const checklabel = document.createElement('label');
							checklabel.style.marginRight = '0.7em';
							checklabel.style.display = 'inline-block';
							const check = document.createElement('input');
							check.setAttribute('type', 'checkbox');
							check.setAttribute('id', pref.name + '_' + itemkey);
							check.setAttribute('name', pref.name + '_' + itemkey);
							if (gotPref && gotPref.includes(itemkey)) {
								check.setAttribute('checked', 'checked');
							}
							// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
							if (pref.name === 'unlinkNamespaces') {
								if (gotPref && gotPref.includes(parseInt(itemkey, 10))) {
									check.setAttribute('checked', 'checked');
								}
							}
							checklabel.appendChild(check);
							checklabel.appendChild(document.createTextNode(itemvalue));
							checkdiv.appendChild(checklabel);
						};
						if (pref.setDisplayOrder) {
							// add check boxes according to the given display order
							$.each(pref.setDisplayOrder, (itemkey, item) => {
								worker(item, pref.setValues[item]);
							});
						} else {
							// add check boxes according to the order it gets fed to us (probably strict alphabetical)
							$.each(pref.setValues, worker);
						}
						cell.appendChild(checkdiv);
						break;

					case 'customList':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add button to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						var button = document.createElement('button');
						button.setAttribute('id', pref.name);
						button.setAttribute('name', pref.name);
						button.setAttribute('type', 'button');
						button.addEventListener('click', Twinkle.config.listDialog.display, false);
						// use jQuery data on the button to store the current config value
						$(button).data({
							value: gotPref,
							pref: pref
						});
						button.appendChild(document.createTextNode('Edit items'));
						cell.appendChild(button);
						break;

					default:
						alert('twinkleconfig: unknown data type for preference ' + pref.name);
						break;
				}
				row.appendChild(cell);

				// add help tip
				cell = document.createElement('td');
				cell.className = 'twinkle-config-helptip';

				if (pref.helptip) {
					// convert mentions of templates in the helptip to clickable links
					cell.innerHTML = pref.helptip.replace(/{{(.+?)}}/g,
						'{{<a href="' + mw.util.getUrl('Template:') + '$1" target="_blank">$1</a>}}');
				}
				// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
				if (pref.type !== 'customList') {
					const resetlink = document.createElement('a');
					resetlink.setAttribute('href', '#tw-reset');
					resetlink.setAttribute('id', 'twinkle-config-reset-' + pref.name);
					resetlink.addEventListener('click', Twinkle.config.resetPrefLink, false);
					resetlink.style.cssFloat = 'right';
					resetlink.style.margin = '0 0.6em';
					resetlink.appendChild(document.createTextNode('Reset'));
					cell.appendChild(resetlink);
				}
				row.appendChild(cell);

				container.appendChild(row);
				return true;
			});
			return true;
		});

		const footerbox = document.createElement('div');
		footerbox.setAttribute('id', 'twinkle-config-buttonpane');
		const button = document.createElement('button');
		button.setAttribute('id', 'twinkle-config-submit');
		button.setAttribute('type', 'submit');
		button.appendChild(document.createTextNode('Save changes'));
		footerbox.appendChild(button);
		const footerspan = document.createElement('span');
		footerspan.className = 'plainlinks';
		footerspan.style.marginLeft = '2.4em';
		footerspan.style.fontSize = '90%';
		const footera = document.createElement('a');
		footera.setAttribute('href', '#tw-reset-all');
		footera.setAttribute('id', 'twinkle-config-resetall');
		footera.addEventListener('click', Twinkle.config.resetAllPrefs, false);
		footera.appendChild(document.createTextNode('Restore defaults'));
		footerspan.appendChild(footera);
		footerbox.appendChild(footerspan);
		contentform.appendChild(footerbox);

		// since all the section headers exist now, we can try going to the requested anchor
		if (window.location.hash) {
			const loc = window.location.hash;
			window.location.hash = '';
			window.location.hash = loc;
		}

	} else if (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user &&
			mw.config.get('wgTitle').indexOf(mw.config.get('wgUserName')) === 0 &&
			mw.config.get('wgPageName').slice(-3) === '.js') {

		const box = document.createElement('div');
		// Styled in twinkle.css
		box.setAttribute('id', 'twinkle-config-headerbox');

		let link;
		const scriptPageName = mw.config.get('wgPageName').slice(
			mw.config.get('wgPageName').lastIndexOf('/') + 1,
			mw.config.get('wgPageName').lastIndexOf('.js')
		);

		if (scriptPageName === 'twinkleoptions') {
			// place "why not try the preference panel" notice
			box.setAttribute('class', 'config-twopt-box');

			if (mw.config.get('wgArticleId') > 0) { // page exists
				box.appendChild(document.createTextNode('This page contains your Twinkle preferences. You can change them using the '));
			} else { // page does not exist
				box.appendChild(document.createTextNode('You can customize Twinkle to suit your preferences by using the '));
			}
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':Twinkle/Preferences'));
			link.appendChild(document.createTextNode('Twinkle preferences panel'));
			box.appendChild(link);
			box.appendChild(document.createTextNode(', or by editing this page.'));
			$(box).insertAfter($('#contentSub'));

		} else if (['monobook', 'vector', 'vector-2022', 'cologneblue', 'modern', 'timeless', 'minerva', 'common'].includes(scriptPageName)) {
			// place "Looking for Twinkle options?" notice
			box.setAttribute('class', 'config-userskin-box');

			box.appendChild(document.createTextNode('If you want to set Twinkle preferences, you can use the '));
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':Twinkle/Preferences'));
			link.appendChild(document.createTextNode('Twinkle preferences panel'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('.'));
			$(box).insertAfter($('#contentSub'));
		}
	}
};

// custom list-related stuff

Twinkle.config.listDialog = {};

Twinkle.config.listDialog.addRow = function twinkleconfigListDialogAddRow($dlgtable, value, label) {
	let $contenttr, $valueInput, $labelInput;

	$dlgtable.append(
		$contenttr = $('<tr>').append(
			$('<td>').append(
				$('<button>')
					.attr('type', 'button')
					.on('click', () => {
						$contenttr.remove();
					})
					.text('Remove')
			),
			$('<td>').append(
				$valueInput = $('<input>')
					.attr('type', 'text')
					.addClass('twinkle-config-customlist-value')
					.css('width', '97%')
			),
			$('<td>').append(
				$labelInput = $('<input>')
					.attr('type', 'text')
					.addClass('twinkle-config-customlist-label')
					.css('width', '98%')
			)
		)
	);

	if (value) {
		$valueInput.val(value);
	}
	if (label) {
		$labelInput.val(label);
	}

};

Twinkle.config.listDialog.display = function twinkleconfigListDialogDisplay(e) {
	const $prefbutton = $(e.target);
	const curvalue = $prefbutton.data('value');
	const curpref = $prefbutton.data('pref');

	const dialog = new Morebits.SimpleWindow(720, 400);
	dialog.setTitle(curpref.label);
	dialog.setScriptName('Twinkle preferences');

	let $dlgtbody;

	dialog.setContent(
		$('<div>').append(
			$('<table>')
				.addClass('wikitable')
				.css({
					margin: '1.4em 1em',
					width: 'auto'
				})
				.append(
					$dlgtbody = $('<tbody>').append(
						// header row
						$('<tr>').append(
							$('<th>') // top-left cell
								.css('width', '5%'),
							$('<th>') // value column header
								.css('width', '35%')
								.text(curpref.customListValueTitle ? curpref.customListValueTitle : 'Value'),
							$('<th>') // label column header
								.css('width', '60%')
								.text(curpref.customListLabelTitle ? curpref.customListLabelTitle : 'Label')
						)
					),
					$('<tfoot>').append(
						$('<tr>').append(
							$('<td>')
								.attr('colspan', '3')
								.append(
									$('<button>')
										.text('Add')
										.css('min-width', '8em')
										.attr('type', 'button')
										.on('click', () => {
											Twinkle.config.listDialog.addRow($dlgtbody);
										})
								)
						)
					)
				),
			$('<button>')
				.text('Save changes')
				.attr('type', 'submit') // so Morebits.SimpleWindow puts the button in the button pane
				.on('click', () => {
					Twinkle.config.listDialog.save($prefbutton, $dlgtbody);
					dialog.close();
				}),
			$('<button>')
				.text('Reset')
				.attr('type', 'submit')
				.on('click', () => {
					Twinkle.config.listDialog.reset($prefbutton, $dlgtbody);
				}),
			$('<button>')
				.text('Cancel')
				.attr('type', 'submit')
				.on('click', () => {
					dialog.close();
				})
		)[0]
	);

	// content rows
	let gotRow = false;
	$.each(curvalue, (k, v) => {
		gotRow = true;
		Twinkle.config.listDialog.addRow($dlgtbody, v.value, v.label);
	});
	// if there are no values present, add a blank row to start the user off
	if (!gotRow) {
		Twinkle.config.listDialog.addRow($dlgtbody);
	}

	dialog.display();
};

// Resets the data value, re-populates based on the new (default) value, then saves the
// old data value again (less surprising behaviour)
Twinkle.config.listDialog.reset = function twinkleconfigListDialogReset($button, $tbody) {
	// reset value on button
	const curpref = $button.data('pref');
	const oldvalue = $button.data('value');
	Twinkle.config.resetPref(curpref);

	// reset form
	$tbody.find('tr').slice(1).remove(); // all rows except the first (header) row
	// add the new values
	const curvalue = $button.data('value');
	$.each(curvalue, (k, v) => {
		Twinkle.config.listDialog.addRow($tbody, v.value, v.label);
	});

	// save the old value
	$button.data('value', oldvalue);
};

Twinkle.config.listDialog.save = function twinkleconfigListDialogSave($button, $tbody) {
	const result = [];
	let current = {};
	$tbody.find('input[type="text"]').each((inputkey, input) => {
		if ($(input).hasClass('twinkle-config-customlist-value')) {
			current = { value: input.value };
		} else {
			current.label = input.value;
			// exclude totally empty rows
			if (current.value || current.label) {
				result.push(current);
			}
		}
	});
	$button.data('value', result);
};

// reset/restore defaults

Twinkle.config.resetPrefLink = function twinkleconfigResetPrefLink(e) {
	const wantedpref = e.target.id.slice(21); // "twinkle-config-reset-" prefix is stripped

	// search tactics
	$(Twinkle.config.sections).each((sectionkey, section) => {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true; // continue: skip impossibilities
		}

		let foundit = false;

		$(section.preferences).each((prefkey, pref) => {
			if (pref.name !== wantedpref) {
				return true; // continue
			}
			Twinkle.config.resetPref(pref);
			foundit = true;
			return false; // break
		});

		if (foundit) {
			return false; // break
		}
	});
	return false; // stop link from scrolling page
};

Twinkle.config.resetPref = function twinkleconfigResetPref(pref) {
	switch (pref.type) {

		case 'boolean':
			document.getElementById(pref.name).checked = Twinkle.defaultConfig[pref.name];
			break;

		case 'string':
		case 'integer':
		case 'enum':
			document.getElementById(pref.name).value = Twinkle.defaultConfig[pref.name];
			break;

		case 'set':
			$.each(pref.setValues, (itemkey) => {
				if (document.getElementById(pref.name + '_' + itemkey)) {
					document.getElementById(pref.name + '_' + itemkey).checked = Twinkle.defaultConfig[pref.name].includes(itemkey);
				}
			});
			break;

		case 'customList':
			$(document.getElementById(pref.name)).data('value', Twinkle.defaultConfig[pref.name]);
			break;

		default:
			alert('twinkleconfig: unknown data type for preference ' + pref.name);
			break;
	}
};

Twinkle.config.resetAllPrefs = function twinkleconfigResetAllPrefs() {
	// no confirmation message - the user can just refresh/close the page to abort
	$(Twinkle.config.sections).each((sectionkey, section) => {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true; // continue: skip impossibilities
		}
		$(section.preferences).each((prefkey, pref) => {
			if (!pref.adminOnly || Morebits.userIsSysop) {
				Twinkle.config.resetPref(pref);
			}
		});
		return true;
	});
	return false; // stop link from scrolling page
};

Twinkle.config.save = function twinkleconfigSave(e) {
	Morebits.Status.init(document.getElementById('twinkle-config-content'));

	const userjs = mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user] + ':' + mw.config.get('wgUserName') + '/twinkleoptions.js';
	const wikipedia_page = new Morebits.wiki.Page(userjs, 'Saving preferences to ' + userjs);
	wikipedia_page.setCallbackParameters(e.target);
	wikipedia_page.load(Twinkle.config.writePrefs);

	return false;
};

Twinkle.config.writePrefs = function twinkleconfigWritePrefs(pageobj) {
	const form = pageobj.getCallbackParameters();

	// this is the object which gets serialized into JSON; only
	// preferences that this script knows about are kept
	const newConfig = {optionsVersion: 2.1};

	// a comparison function is needed later on
	// it is just enough for our purposes (i.e. comparing strings, numbers, booleans,
	// arrays of strings, and arrays of { value, label })
	// and it is not very robust: e.g. compare([2], ["2"]) === true, and
	// compare({}, {}) === false, but it's good enough for our purposes here
	const compare = function(a, b) {
		if (Array.isArray(a)) {
			if (a.length !== b.length) {
				return false;
			}
			const asort = a.sort(), bsort = b.sort();
			for (let i = 0; asort[i]; ++i) {
				// comparison of the two properties of custom lists
				if ((typeof asort[i] === 'object') && (asort[i].label !== bsort[i].label ||
					asort[i].value !== bsort[i].value)) {
					return false;
				} else if (asort[i].toString() !== bsort[i].toString()) {
					return false;
				}
			}
			return true;
		}
		return a === b;

	};

	$(Twinkle.config.sections).each((sectionkey, section) => {
		if (section.adminOnly && !Morebits.userIsSysop) {
			return; // i.e. "continue" in this context
		}

		// reach each of the preferences from the form
		$(section.preferences).each((prefkey, pref) => {
			let userValue; // = undefined

			// only read form values for those prefs that have them
			if (!pref.adminOnly || Morebits.userIsSysop) {
				if (!section.hidden) {
					switch (pref.type) {
						case 'boolean': // read from the checkbox
							userValue = form[pref.name].checked;
							break;

						case 'string': // read from the input box or combo box
						case 'enum':
							userValue = form[pref.name].value;
							break;

						case 'integer': // read from the input box
							userValue = parseInt(form[pref.name].value, 10);
							if (isNaN(userValue)) {
								Morebits.Status.warn('Saving', 'The value you specified for ' + pref.name + ' (' + pref.value + ') was invalid.  The save will continue, but the invalid data value will be skipped.');
								userValue = null;
							}
							break;

						case 'set': // read from the set of check boxes
							userValue = [];
							if (pref.setDisplayOrder) {
							// read only those keys specified in the display order
								$.each(pref.setDisplayOrder, (itemkey, item) => {
									if (form[pref.name + '_' + item].checked) {
										userValue.push(item);
									}
								});
							} else {
							// read all the keys in the list of values
								$.each(pref.setValues, (itemkey) => {
									if (form[pref.name + '_' + itemkey].checked) {
										userValue.push(itemkey);
									}
								});
							}
							break;

						case 'customList': // read from the jQuery data stored on the button object
							userValue = $(form[pref.name]).data('value');
							break;

						default:
							alert('twinkleconfig: unknown data type for preference ' + pref.name);
							break;
					}
				} else if (Twinkle.prefs) {
					// Retain the hidden preferences that may have customised by the user from twinkleoptions.js
					// undefined if not set
					userValue = Twinkle.prefs[pref.name];
				}
			}

			// only save those preferences that are *different* from the default
			if (userValue !== undefined && !compare(userValue, Twinkle.defaultConfig[pref.name])) {
				newConfig[pref.name] = userValue;
			}
		});
	});

	let text =
		'// twinkleoptions.js: personal Twinkle preferences file\n' +
		'//\n' +
		'// NOTE: The easiest way to change your Twinkle preferences is by using the\n' +
		'// Twinkle preferences panel, at [[' + Morebits.pageNameNorm + ']].\n' +
		'//\n' +
		'// This file is AUTOMATICALLY GENERATED.  Any changes you make (aside from\n' +
		'// changing the configuration parameters in a valid-JavaScript way) will be\n' +
		'// overwritten the next time you click "save" in the Twinkle preferences\n' +
		'// panel.  If modifying this file, make sure to use correct JavaScript.\n' +
		// eslint-disable-next-line no-useless-concat
		'// <no' + 'wiki>\n' +
		'\n' +
		'window.Twinkle.prefs = ';
	text += JSON.stringify(newConfig, null, 2);
	text +=
		';\n' +
		'\n' +
		// eslint-disable-next-line no-useless-concat
		'// </no' + 'wiki>\n' +
		'// End of twinkleoptions.js\n';

	pageobj.setPageText(text);
	pageobj.setEditSummary('Saving Twinkle preferences: automatic edit from [[:' + Morebits.pageNameNorm + ']]');
	pageobj.setChangeTags(Twinkle.changeTags);
	pageobj.setCreateOption('recreate');
	pageobj.save(Twinkle.config.saveSuccess);
};

Twinkle.config.saveSuccess = function twinkleconfigSaveSuccess(pageobj) {
	pageobj.getStatusElement().info('successful');

	const noticebox = document.createElement('div');
	noticebox.className = 'cdx-message cdx-message--success';
	noticebox.style.fontSize = '100%';
	noticebox.innerHTML = '<p><b>Your Twinkle preferences have been saved.</b> To see the changes, you will need to clear your browser cache entirely (see <a href="' + mw.util.getUrl('WP:BYPASS') + '" title="WP:BYPASS">WP:BYPASS</a> for instructions).</p>';
	mw.loader.using('mediawiki.htmlform.codex.styles', () => {
		Morebits.Status.root.appendChild(noticebox);
	});
	const noticeclear = document.createElement('br');
	noticeclear.style.clear = 'both';
	Morebits.Status.root.appendChild(noticeclear);
};

Twinkle.addInitCallback(Twinkle.config.init);
}());

// </nowiki>
