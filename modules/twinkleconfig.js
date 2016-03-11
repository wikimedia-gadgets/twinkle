//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleconfig.js: Preferences module
 ****************************************
 * Mode of invocation:     Adds configuration form to Wikipedia:Twinkle/Preferences and user
                           subpages named "/Twinkle preferences", and adds ad box to the top of user
                           subpages belonging to the currently logged-in user which end in '.js'
 * Active on:              What I just said.  Yeah.
 * Config directives in:   TwinkleConfig

 I, [[User:This, that and the other]], originally wrote this.  If the code is misbehaving, or you have any
 questions, don't hesitate to ask me.  (This doesn't at all imply [[WP:OWN]]ership - it's just meant to
 point you in the right direction.)  -- TTO
 */


Twinkle.config = {};

Twinkle.config.commonEnums = {
	watchlist: { yes: "Add to watchlist", no: "Don't add to watchlist", "default": "Follow your site preferences" },
	talkPageMode: { window: "In a window, replacing other user talks", tab: "In a new tab", blank: "In a totally new window" }
};

Twinkle.config.commonSets = {
	csdCriteria: {
		db: "Custom rationale ({{db}})",
		g1: "G1", g2: "G2", g3: "G3", g4: "G4", g5: "G5", g6: "G6", g7: "G7", g8: "G8", g10: "G10", g11: "G11", g12: "G12", g13: "G13",
		a1: "A1", a2: "A2", a3: "A3", a5: "A5", a7: "A7", a9: "A9", a10: "A10", a11: "A11",
		u1: "U1", u2: "U2", u3: "U3", u5: "U5",
		f1: "F1", f2: "F2", f3: "F3", f7: "F7", f8: "F8", f9: "F9", f10: "F10",
		c1: "C1",
		t2: "T2", t3: "T3",
		r2: "R2", r3: "R3",
		p1: "P1", p2: "P2"
	},
	csdCriteriaDisplayOrder: [
		"db",
		"g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g10", "g11", "g12", "g13",
		"a1", "a2", "a3", "a5", "a7", "a9", "a10", "a11",
		"u1", "u2", "u3", "u5",
		"f1", "f2", "f3", "f7", "f8", "f9", "f10",
		"c1",
		"t2", "t3",
		"r2", "r3",
		"p1", "p2"
	],
	csdCriteriaNotification: {
		db: "Custom rationale ({{db}})",
		g1: "G1", g2: "G2", g3: "G3", g4: "G4", g6: 'G6 ("unnecessary disambig." and "copy-paste move" only)',
		g10: "G10", g11: "G11", g12: "G12", g13: "G13",
		a1: "A1", a2: "A2", a3: "A3", a5: "A5", a7: "A7", a9: "A9", a10: "A10", a11: "A11",
		u3: "U3", u5: "U5",
		f1: "F1", f2: "F2", f3: "F3", f7: "F7", f8: "F8", f9: "F9", f10: "F10",
		c1: "C1",
		t2: "T2", t3: "T3",
		r2: "R2", r3: "R3",
		p1: "P1", p2: "P2"
	},
	csdCriteriaNotificationDisplayOrder: [
		"db",
		"g1", "g2", "g3", "g4", "g6", "g10", "g11", "g12", "g13",
		"a1", "a2", "a3", "a5", "a7", "a9", "a10", "a11",
		"u3", "u5",
		"f1", "f2", "f3", "f7", "f9", "f10",
		"c1",
		"t2", "t3",
		"r2", "r3",
		"p1", "p2"
	],
	csdAndDICriteria: {
		db: "Custom rationale ({{db}})",
		g1: "G1", g2: "G2", g3: "G3", g4: "G4", g5: "G5", g6: "G6", g7: "G7", g8: "G8", g10: "G10", g11: "G11", g12: "G12", g13: "G13",
		a1: "A1", a2: "A2", a3: "A3", a5: "A5", a7: "A7", a9: "A9", a10: "A10", a11: "A11",
		u1: "U1", u2: "U2", u3: "U3", u5: "U5",
		f1: "F1", f2: "F2", f3: "F3", f4: "F4", f5: "F5", f6: "F6", f7: "F7", f8: "F8", f9: "F9", f10: "F10", f11: "F11",
		c1: "C1",
		t2: "T2", t3: "T3",
		r2: "R2", r3: "R3",
		p1: "P1", p2: "P2"
	},
	csdAndDICriteriaDisplayOrder: [
		"db",
		"g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g10", "g11", "g12", "g13",
		"a1", "a2", "a3", "a5", "a7", "a9", "a10", "a11",
		"u1", "u2", "u3", "u5",
		"f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11",
		"c1",
		"t2", "t3",
		"r2", "r3",
		"p1", "p2"
	],
	namespacesNoSpecial: {
		"0": "Article",
		"1": "Talk (article)",
		"2": "User",
		"3": "User talk",
		"4": "Wikipedia",
		"5": "Wikipedia talk",
		"6": "File",
		"7": "File talk",
		"8": "MediaWiki",
		"9": "MediaWiki talk",
		"10": "Template",
		"11": "Template talk",
		"12": "Help",
		"13": "Help talk",
		"14": "Category",
		"15": "Category talk",
		"100": "Portal",
		"101": "Portal talk",
		"108": "Book",
		"109": "Book talk",
		"118": "Draft",
		"119": "Draft talk",
		"710": "TimedText",
		"711": "TimedText talk",
		"828": "Module",
		"829": "Module talk"
	}
};

/**
 * Section entry format:
 *
 * {
 *   title: <human-readable section title>,
 *   adminOnly: <true for admin-only sections>,
 *   hidden: <true for advanced preferences that rarely need to be changed - they can still be modified by manually editing twinkleoptions.js>,
 *   inFriendlyConfig: <true for preferences located under FriendlyConfig rather than TwinkleConfig>,
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
	title: "General",
	preferences: [
		// TwinkleConfig.summaryAd (string)
		// Text to be appended to the edit summary of edits made using Twinkle
		{
			name: "summaryAd",
			label: "\"Ad\" to be appended to Twinkle's edit summaries",
			helptip: "The summary ad should start with a space, and be kept short.",
			type: "string"
		},

		// TwinkleConfig.deletionSummaryAd (string)
		// Text to be appended to the edit summary of deletions made using Twinkle
		{
			name: "deletionSummaryAd",
			label: "Summary ad to use for deletion summaries",
			helptip: "Normally the same as the edit summary ad above.",
			adminOnly: true,
			type: "string"
		},

		// TwinkleConfig.protectionSummaryAd (string)
		// Text to be appended to the edit summary of page protections made using Twinkle
		{
			name: "protectionSummaryAd",
			label: "Summary ad to use for page protections",
			helptip: "Normally the same as the edit summary ad above.",
			adminOnly: true,
			type: "string"
		},

		// TwinkleConfig.userTalkPageMode may take arguments:
		// 'window': open a new window, remember the opened window
		// 'tab': opens in a new tab, if possible.
		// 'blank': force open in a new window, even if such a window exists
		{
			name: "userTalkPageMode",
			label: "When opening a user talk page, open it",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.talkPageMode
		},

		// TwinkleConfig.dialogLargeFont (boolean)
		{
			name: "dialogLargeFont",
			label: "Use larger text in Twinkle dialogs",
			type: "boolean"
		}
	]
},

{
	title: "ARV",
	preferences: [
		{
			name: "spiWatchReport",
			label: "Add sockpuppet report pages to watchlist",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.watchlist
		}
	]
},

{
	title: "Block user",
	adminOnly: true,
	preferences: [
		// TwinkleConfig.blankTalkpageOnIndefBlock (boolean)
		// if true, blank the talk page when issuing an indef block notice (per [[WP:UW#Indefinitely blocked users]])
		{
			name: "blankTalkpageOnIndefBlock",
			label: "Blank the talk page when indefinitely blocking users",
			helptip: "See <a href=\"" + mw.util.getUrl("WP:UW#Indefinitely blocked users") + "\">WP:UW</a> for more information.",
			type: "boolean"
		}
	]
},

{
	title: "Image deletion (DI)",
	preferences: [
		// TwinkleConfig.notifyUserOnDeli (boolean)
		// If the user should be notified after placing a file deletion tag
		{
			name: "notifyUserOnDeli",
			label: "Check the \"notify initial uploader\" box by default",
			type: "boolean"
		},

		// TwinkleConfig.deliWatchPage (string)
		// The watchlist setting of the page tagged for deletion. Either "yes", "no", or "default". Default is "default" (Duh).
		{
			name: "deliWatchPage",
			label: "Add image page to watchlist when tagging",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.watchlist
		},

		// TwinkleConfig.deliWatchUser (string)
		// The watchlist setting of the user talk page if a notification is placed. Either "yes", "no", or "default". Default is "default" (Duh).
		{
			name: "deliWatchUser",
			label: "Add user talk page of initial uploader to watchlist when notifying",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.watchlist
		}
	]
},

{
	title: "Proposed deletion (PROD)",
	preferences: [
		// TwinkleConfig.watchProdPages (boolean)
		// If, when applying prod template to page, to watch the page
		{
			name: "watchProdPages",
			label: "Add article to watchlist when tagging",
			type: "boolean"
		},

		// TwinkleConfig.prodReasonDefault (string)
		// The prefilled PROD reason.
		{
			name: "prodReasonDefault",
			label: "Prefilled PROD reason",
			type: "string"
		},

		{
			name: "logProdPages",
			label: "Keep a log in userspace of all pages you tag for PROD",
			helptip: "Since non-admins do not have access to their deleted contributions, the userspace log offers a good way to keep track of all pages you tag for PROD using Twinkle.",
			type: "boolean"
		},
		{
			name: "prodLogPageName",
			label: "Keep the PROD userspace log at this user subpage",
			helptip: "Enter a subpage name in this box. You will find your PROD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the PROD userspace log.",
			type: "string"
		}
	]
},

{
	title: "Revert and rollback",  // twinklefluff module
	preferences: [
		// TwinkleConfig.openTalkPage (array)
		// What types of actions that should result in opening of talk page
		{
			name: "openTalkPage",
			label: "Open user talk page after these types of reversions",
			type: "set",
			setValues: { agf: "AGF rollback", norm: "Normal rollback", vand: "Vandalism rollback", torev: "\"Restore this version\"" }
		},

		// TwinkleConfig.openTalkPageOnAutoRevert (bool)
		// Defines if talk page should be opened when calling revert from contrib page, because from there, actions may be multiple, and opening talk page not suitable. If set to true, openTalkPage defines then if talk page will be opened.
		{
			name: "openTalkPageOnAutoRevert",
			label: "Open user talk page when invoking rollback from user contributions",
			helptip: "Often, you may be rolling back many pages at a time from a vandal's contributions page, so it would be unsuitable to open the user talk page. Hence, this option is off by default. When this is on, the desired options must be enabled in the previous setting for this to work.",
			type: "boolean"
		},

		// TwinkleConfig.markRevertedPagesAsMinor (array)
		// What types of actions that should result in marking edit as minor
		{
			name: "markRevertedPagesAsMinor",
			label: "Mark as minor edit for these types of reversions",
			type: "set",
			setValues: { agf: "AGF rollback", norm: "Normal rollback", vand: "Vandalism rollback", torev: "\"Restore this version\"" }
		},

		// TwinkleConfig.watchRevertedPages (array)
		// What types of actions that should result in forced addition to watchlist
		{
			name: "watchRevertedPages",
			label: "Add pages to watchlist for these types of reversions",
			type: "set",
			setValues: { agf: "AGF rollback", norm: "Normal rollback", vand: "Vandalism rollback", torev: "\"Restore this version\"" }
		},

		// TwinkleConfig.offerReasonOnNormalRevert (boolean)
		// If to offer a prompt for extra summary reason for normal reverts, default to true
		{
			name: "offerReasonOnNormalRevert",
			label: "Prompt for reason for normal rollbacks",
			helptip: "\"Normal\" rollbacks are the ones that are invoked from the middle [rollback] link.",
			type: "boolean"
		},

		{
			name: "confirmOnFluff",
			label: "Provide a confirmation message before reverting",
			helptip: "For users of pen or touch devices, and chronically indecisive people.",
			type: "boolean"
		},

		// TwinkleConfig.showRollbackLinks (array)
		// Where Twinkle should show rollback links (diff, others, mine, contribs)
		// Note from TTO: |contribs| seems to be equal to |others| + |mine|, i.e. redundant, so I left it out heres
		{
			name: "showRollbackLinks",
			label: "Show rollback links on these pages",
			type: "set",
			setValues: { diff: "Diff pages", others: "Contributions pages of other users", mine: "My contributions page" }
		}
	]
},

{
	title: "Shared IP tagging",
	inFriendlyConfig: true,
	preferences: [
		{
			name: "markSharedIPAsMinor",
			label: "Mark shared IP tagging as a minor edit",
			type: "boolean"
		}
	]
},

{
	title: "Speedy deletion (CSD)",
	preferences: [
		{
			name: "speedySelectionStyle",
			label: "When to go ahead and tag/delete the page",
			type: "enum",
			enumValues: { "buttonClick": 'When I click "Submit"', "radioClick": "As soon as I click an option" }
		},

		// TwinkleConfig.watchSpeedyPages (array)
		// Whether to add speedy tagged pages to watchlist
		{
			name: "watchSpeedyPages",
			label: "Add page to watchlist when tagging with these criteria",
			type: "set",
			setValues: Twinkle.config.commonSets.csdCriteria,
			setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDisplayOrder
		},

		// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
		// If, when applying speedy template to page, to mark the page as patrolled (if the page was reached from NewPages)
		{
			name: "markSpeedyPagesAsPatrolled",
			label: "Mark page as patrolled when tagging (if possible)",
			type: "boolean"
		},

		// TwinkleConfig.notifyUserOnSpeedyDeletionNomination (array)
		// What types of actions should result that the author of the page being notified of nomination
		{
			name: "notifyUserOnSpeedyDeletionNomination",
			label: "Notify page creator only when tagging with these criteria",
			helptip: "Even if you choose to notify from the CSD screen, the notification will only take place for those criteria selected here.",
			type: "set",
			setValues: Twinkle.config.commonSets.csdCriteriaNotification,
			setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
		},

		// TwinkleConfig.welcomeUserOnSpeedyDeletionNotification (array of strings)
		// On what types of speedy deletion notifications shall the user be welcomed
		// with a "firstarticle" notice if his talk page has not yet been created.
		{
			name: "welcomeUserOnSpeedyDeletionNotification",
			label: "Welcome page creator alongside notification when tagging with these criteria",
			helptip: "The welcome is issued only if the user is notified about the deletion, and only if their talk page does not already exist. The template used is {{firstarticle}}.",
			type: "set",
			setValues: Twinkle.config.commonSets.csdCriteriaNotification,
			setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
		},

		// TwinkleConfig.promptForSpeedyDeletionSummary (array of strings)
		{
			name: "promptForSpeedyDeletionSummary",
			label: "Allow editing of deletion summary when deleting under these criteria",
			adminOnly: true,
			type: "set",
			setValues: Twinkle.config.commonSets.csdAndDICriteria,
			setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
		},

		// TwinkleConfig.openUserTalkPageOnSpeedyDelete (array of strings)
		// What types of actions that should result user talk page to be opened when speedily deleting (admin only)
		{
			name: "openUserTalkPageOnSpeedyDelete",
			label: "Open user talk page when deleting under these criteria",
			adminOnly: true,
			type: "set",
			setValues: Twinkle.config.commonSets.csdAndDICriteria,
			setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
		},

		// TwinkleConfig.deleteTalkPageOnDelete (boolean)
		// If talk page if exists should also be deleted (CSD G8) when spedying a page (admin only)
		{
			name: "deleteTalkPageOnDelete",
			label: "Check the \"also delete talk page\" box by default",
			adminOnly: true,
			type: "boolean"
		},

		{
			name: "deleteRedirectsOnDelete",
			label: "Check the \"also delete redirects\" box by default",
			adminOnly: true,
			type: "boolean"
		},

		// TwinkleConfig.deleteSysopDefaultToTag (boolean)
		// Make the CSD screen default to "tag" instead of "delete" (admin only)
		{
			name: "deleteSysopDefaultToTag",
			label: "Default to speedy tagging instead of outright deletion",
			adminOnly: true,
			type: "boolean"
		},

		// TwinkleConfig.speedyWindowWidth (integer)
		// Defines the width of the Twinkle SD window in pixels
		{
			name: "speedyWindowWidth",
			label: "Width of speedy deletion window (pixels)",
			type: "integer"
		},

		// TwinkleConfig.speedyWindowWidth (integer)
		// Defines the width of the Twinkle SD window in pixels
		{
			name: "speedyWindowHeight",
			label: "Height of speedy deletion window (pixels)",
			helptip: "If you have a big monitor, you might like to increase this.",
			type: "integer"
		},

		{
			name: "logSpeedyNominations",
			label: "Keep a log in userspace of all CSD nominations",
			helptip: "Since non-admins do not have access to their deleted contributions, the userspace log offers a good way to keep track of all pages you nominate for CSD using Twinkle. Files tagged using DI are also added to this log.",
			type: "boolean"
		},
		{
			name: "speedyLogPageName",
			label: "Keep the CSD userspace log at this user subpage",
			helptip: "Enter a subpage name in this box. You will find your CSD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the CSD userspace log.",
			type: "string"
		},
		{
			name: "noLogOnSpeedyNomination",
			label: "Do not create a userspace log entry when tagging with these criteria",
			type: "set",
			setValues: Twinkle.config.commonSets.csdAndDICriteria,
			setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
		}
	]
},

{
	title: "Tag",
	inFriendlyConfig: true,
	preferences: [
		{
			name: "watchTaggedPages",
			label: "Add page to watchlist when tagging",
			type: "boolean"
		},
		{
			name: "watchMergeDiscussions",
			label: "Add talk pages to watchlist when starting merge discussions",
			type: "boolean"
		},
		{
			name: "markTaggedPagesAsMinor",
			label: "Mark addition of tags as a minor edit",
			type: "boolean"
		},
		{
			name: "markTaggedPagesAsPatrolled",
			label: "Check the \"mark page as patrolled\" box by default",
			type: "boolean"
		},
		{
			name: "groupByDefault",
			label: "Check the \"group into {{multiple issues}}\" box by default",
			type: "boolean"
		},
		{
			name: "tagArticleSortOrder",
			label: "Default view order for article tags",
			type: "enum",
			enumValues: { "cat": "By categories", "alpha": "In alphabetical order" }
		},
		{
			name: "customTagList",
			label: "Custom article maintenance tags to display",
			helptip: "These appear as additional options at the bottom of the list of tags. For example, you could add new maintenance tags which have not yet been added to Twinkle's defaults.",
			type: "customList",
			customListValueTitle: "Template name (no curly brackets)",
			customListLabelTitle: "Text to show in Tag dialog"
		}
	]
},

{
	title: "Talkback",
	inFriendlyConfig: true,
	preferences: [
		{
			name: "markTalkbackAsMinor",
			label: "Mark talkbacks as minor edits",
			type: "boolean"
		},
		{
			name: "insertTalkbackSignature",
			label: "Insert signature within talkbacks",
			type: "boolean"
		},
		{
			name: "talkbackHeading",
			label: "Section heading to use for talkbacks",
			type: "string"
		},
		{
			name: "adminNoticeHeading",
			label: "Section heading to use for administrators' noticeboard notices",
			helptip: "Only relevant for AN and ANI.",
			type: "string"
		},
		{
			name: "mailHeading",
			label: "Section heading to use for \"you've got mail\" notices",
			type: "string"
		}
	]
},

{
	title: "Unlink",
	preferences: [
		// TwinkleConfig.unlinkNamespaces (array)
		// In what namespaces unlink should happen, default in 0 (article) and 100 (portal)
		{
			name: "unlinkNamespaces",
			label: "Remove links from pages in these namespaces",
			helptip: "Avoid selecting any talk namespaces, as Twinkle might end up unlinking on talk archives (a big no-no).",
			type: "set",
			setValues: Twinkle.config.commonSets.namespacesNoSpecial
		}
	]
},

{
	title: "Warn user",
	preferences: [
		// TwinkleConfig.defaultWarningGroup (int)
		// if true, watch the page which has been dispatched an warning or notice, if false, default applies
		{
			name: "defaultWarningGroup",
			label: "Default warning level",
			type: "enum",
			enumValues: {
				"1": "Level 1",
				"2": "Level 2",
				"3": "Level 3",
				"4": "Level 4",
				"5": "Level 4im",
				"6": "Single-issue notices",
				"7": "Single-issue warnings",
				"9": "Custom warnings"
			}
		},

		// TwinkleConfig.showSharedIPNotice may take arguments:
		// true: to show shared ip notice if an IP address
		// false: to not print the notice
		{
			name: "showSharedIPNotice",
			label: "Add extra notice on shared IP talk pages",
			helptip: "Notice used is {{Shared IP advice}}",
			type: "boolean"
		},

		// TwinkleConfig.watchWarnings (boolean)
		// if true, watch the page which has been dispatched an warning or notice, if false, default applies
		{
			name: "watchWarnings",
			label: "Add user talk page to watchlist when notifying",
			type: "boolean"
		},

		{
			name: "customWarningList",
			label: "Custom warning templates to display",
			helptip: "You can add individual templates or user subpages. Custom warnings appear in the \"Custom warnings\" category within the warning dialog box.",
			type: "customList",
			customListValueTitle: "Template name (no curly brackets)",
			customListLabelTitle: "Text to show in warning list (also used as edit summary)"
		},

		{
			name: "markXfdPagesAsPatrolled",
			label: "Mark page as patrolled when nominating for AFD (if possible)",
			type: "boolean"
		}
	]
},

{
	title: "Welcome user",
	inFriendlyConfig: true,
	preferences: [
		{
			name: "topWelcomes",
			label: "Place welcomes above existing content on user talk pages",
			type: "boolean"
		},
		{
			name: "watchWelcomes",
			label: "Add user talk pages to watchlist when welcoming",
			helptip: "Doing so adds to the personal element of welcoming a user - you will be able to see how they are coping as a newbie, and possibly help them.",
			type: "boolean"
		},
		{
			name: "insertUsername",
			label: "Add your username to the template (where applicable)",
			helptip: "Some welcome templates have an opening sentence like \"Hi, I'm &lt;username&gt;. Welcome\" etc. If you turn off this option, these templates will not display your username in that way.",
			type: "boolean"
		},
		{
			name: "quickWelcomeMode",
			label: "Clicking the \"welcome\" link on a diff page will",
			helptip: "If you choose to welcome automatically, the template you specify below will be used.",
			type: "enum",
			enumValues: { auto: "welcome automatically", norm: "prompt you to select a template" }
		},
		{
			name: "quickWelcomeTemplate",
			label: "Template to use when welcoming automatically",
			helptip: "Enter the name of a welcome template, without the curly brackets. A link to the given article will be added.",
			type: "string"
		},
		{
			name: "customWelcomeList",
			label: "Custom welcome templates to display",
			helptip: "You can add other welcome templates, or user subpages that are welcome templates (prefixed with \"User:\"). Don't forget that these templates are substituted onto user talk pages.",
			type: "customList",
			customListValueTitle: "Template name (no curly brackets)",
			customListLabelTitle: "Text to show in Welcome dialog"
		},
		{
			name: "customWelcomeSignature",
			label: "Automatically sign custom welcome templates",
			helptip: "If your custom welcome templates contain a built-in signature within the template, turn off this option.",
			type: "boolean"
		}
	]
},

{
	title: "XFD (deletion discussions)",
	preferences: [
		// TwinkleConfig.xfdWatchPage (string)
		// The watchlist setting of the page being nominated for XfD. Either "yes" (add to watchlist), "no" (don't
		// add to watchlist), or "default" (use setting from preferences). Default is "default" (duh).
		{
			name: "xfdWatchPage",
			label: "Add the nominated page to watchlist",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.watchlist
		},

		// TwinkleConfig.xfdWatchDiscussion (string)
		// The watchlist setting of the newly created XfD page (for those processes that create discussion pages for each nomination),
		// or the list page for the other processes.
		// Either "yes" (add to watchlist), "no" (don't add to watchlist), or "default" (use setting from preferences). Default is "default" (duh).
		{
			name: "xfdWatchDiscussion",
			label: "Add the deletion discussion page to watchlist",
			helptip: "This refers to the discussion subpage (for AfD and MfD) or the daily log page (for TfD, CfD, RfD and FfD)",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.watchlist
		},

		// TwinkleConfig.xfdWatchList (string)
		// The watchlist setting of the XfD list page, *if* the discussion is on a separate page. Either "yes" (add to watchlist), "no" (don't
		// add to watchlist), or "default" (use setting from preferences). Default is "no" (Hehe. Seriously though, who wants to watch it?
		// Sorry in advance for any false positives.).
		{
			name: "xfdWatchList",
			label: "Add the daily log/list page to the watchlist (where applicable)",
			helptip: "This only applies for AfD and MfD, where the discussions are transcluded onto a daily log page (for AfD) or the main MfD page (for MfD).",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.watchlist
		},

		// TwinkleConfig.xfdWatchUser (string)
		// The watchlist setting of the user if he receives a notification. Either "yes" (add to watchlist), "no" (don't
		// add to watchlist), or "default" (use setting from preferences). Default is "default" (duh).
		{
			name: "xfdWatchUser",
			label: "Add the user talk page to watchlist (when notifying)",
			type: "enum",
			enumValues: Twinkle.config.commonEnums.watchlist
		}
	]
},

{
	title: "Hidden",
	hidden: true,
	preferences: [
		// twinkle.header.js: portlet setup
		{
			name: "portletArea",
			type: "string"
		},
		{
			name: "portletId",
			type: "string"
		},
		{
			name: "portletName",
			type: "string"
		},
		{
			name: "portletType",
			type: "string"
		},
		{
			name: "portletNext",
			type: "string"
		},
		// twinklefluff.js: defines how many revision to query maximum, maximum possible is 50, default is 50
		{
			name: "revertMaxRevisions",
			type: "integer"
		},
		// twinklebatchdelete.js: How many pages should be processed at a time
		{
			name: "batchdeleteChunks",
			type: "integer"
		},
		// twinklebatchdelete.js: How many pages left in the process of being completed should allow a new batch to be initialized
		{
			name: "batchDeleteMinCutOff",
			type: "integer"
		},
		// twinklebatchdelete.js: How many pages should be processed maximum
		{
			name: "batchMax",
			type: "integer"
		},
		// twinklebatchprotect.js: How many pages should be processed at a time
		{
			name: "batchProtectChunks",
			type: "integer"
		},
		// twinklebatchprotect.js: How many pages left in the process of being completed should allow a new batch to be initialized
		{
			name: "batchProtectMinCutOff",
			type: "integer"
		},
		// twinklebatchundelete.js: How many pages should be processed at a time
		{
			name: "batchundeleteChunks",
			type: "integer"
		},
		// twinklebatchundelete.js: How many pages left in the process of being completed should allow a new batch to be initialized
		{
			name: "batchUndeleteMinCutOff",
			type: "integer"
		},
		// twinkledeprod.js: How many pages should be processed at a time
		{
			name: "proddeleteChunks",
			type: "integer"
		}
	]
}

]; // end of Twinkle.config.sections

//{
//			name: "",
//			label: "",
//			type: ""
//		},


Twinkle.config.init = function twinkleconfigInit() {

	if ((mw.config.get("wgNamespaceNumber") === mw.config.get("wgNamespaceIds").project && mw.config.get("wgTitle") === "Twinkle/Preferences" ||
			(mw.config.get("wgNamespaceNumber") === mw.config.get("wgNamespaceIds").user && mw.config.get("wgTitle").lastIndexOf("/Twinkle preferences") === (mw.config.get("wgTitle").length - 20))) &&
			mw.config.get("wgAction") === "view") {
		// create the config page at Wikipedia:Twinkle/Preferences, and at user subpages (for testing purposes)

		if (!document.getElementById("twinkle-config")) {
			return;  // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
		}

		// set style (the url() CSS function doesn't seem to work from wikicode - ?!)
		document.getElementById("twinkle-config-titlebar").style.backgroundImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAMAAAB%2FqqA%2BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEhQTFRFr73ZobTPusjdsMHZp7nVwtDhzNbnwM3fu8jdq7vUt8nbxtDkw9DhpbfSvMrfssPZqLvVztbno7bRrr7W1d%2Fs1N7qydXk0NjpkW7Q%2BgAAADVJREFUeNoMwgESQCAAAMGLkEIi%2FP%2BnbnbpdB59app5Vdg0sXAoMZCpGoFbK6ciuy6FX4ABAEyoAef0BXOXAAAAAElFTkSuQmCC)";

		var contentdiv = document.getElementById("twinkle-config-content");
		contentdiv.textContent = "";  // clear children

		// let user know about possible conflict with monobook.js/vector.js file
		// (settings in that file will still work, but they will be overwritten by twinkleoptions.js settings)
		var contentnotice = document.createElement("p");
		// I hate innerHTML, but this is one thing it *is* good for...
		contentnotice.innerHTML = "<b>Before modifying your preferences here,</b> make sure you have removed any old <code>TwinkleConfig</code> and <code>FriendlyConfig</code> settings from your <a href=\"" + mw.util.getUrl("Special:MyPage/skin.js") + "\" title=\"Special:MyPage/skin.js\">user JavaScript file</a>.";
		contentdiv.appendChild(contentnotice);

		// look and see if the user does in fact have any old settings in their skin JS file
		var skinjs = new Morebits.wiki.page("User:" + mw.config.get("wgUserName") + "/" + mw.config.get("skin") + ".js");
		skinjs.setCallbackParameters(contentnotice);
		skinjs.load(Twinkle.config.legacyPrefsNotice);

		// start a table of contents
		var toctable = document.createElement("div");
		toctable.className = "toc";
		toctable.style.marginLeft = "0.4em";
		// create TOC title
		var toctitle = document.createElement("div");
		toctitle.id = "toctitle";
		var toch2 = document.createElement("h2");
		toch2.textContent = "Contents ";
		toctitle.appendChild(toch2);
		// add TOC show/hide link
		var toctoggle = document.createElement("span");
		toctoggle.className = "toctoggle";
		toctoggle.appendChild(document.createTextNode("["));
		var toctogglelink = document.createElement("a");
		toctogglelink.className = "internal";
		toctogglelink.setAttribute("href", "#tw-tocshowhide");
		toctogglelink.textContent = "hide";
		toctoggle.appendChild(toctogglelink);
		toctoggle.appendChild(document.createTextNode("]"));
		toctitle.appendChild(toctoggle);
		toctable.appendChild(toctitle);
		// create item container: this is what we add stuff to
		var tocul = document.createElement("ul");
		toctogglelink.addEventListener("click", function twinkleconfigTocToggle() {
			var $tocul = $(tocul);
			$tocul.toggle();
			if ($tocul.find(":visible").length) {
				toctogglelink.textContent = "hide";
			} else {
				toctogglelink.textContent = "show";
			}
		}, false);
		toctable.appendChild(tocul);
		contentdiv.appendChild(toctable);

		var tocnumber = 1;

		var contentform = document.createElement("form");
		contentform.setAttribute("action", "javascript:void(0)");  // was #tw-save - changed to void(0) to work around Chrome issue
		contentform.addEventListener("submit", Twinkle.config.save, true);
		contentdiv.appendChild(contentform);

		var container = document.createElement("table");
		container.style.width = "100%";
		contentform.appendChild(container);

		$(Twinkle.config.sections).each(function(sectionkey, section) {
			if (section.hidden || (section.adminOnly && !Morebits.userIsInGroup("sysop"))) {
				return true;  // i.e. "continue" in this context
			}

			var configgetter;  // retrieve the live config values
			if (section.inFriendlyConfig) {
				configgetter = Twinkle.getFriendlyPref;
			} else {
				configgetter = Twinkle.getPref;
			}

			// add to TOC
			var tocli = document.createElement("li");
			tocli.className = "toclevel-1";
			var toca = document.createElement("a");
			toca.setAttribute("href", "#twinkle-config-section-" + tocnumber.toString());
			toca.appendChild(document.createTextNode(section.title));
			tocli.appendChild(toca);
			tocul.appendChild(tocli);

			var row = document.createElement("tr");
			var cell = document.createElement("td");
			cell.setAttribute("colspan", "3");
			var heading = document.createElement("h4");
			heading.style.borderBottom = "1px solid gray";
			heading.style.marginTop = "0.2em";
			heading.id = "twinkle-config-section-" + (tocnumber++).toString();
			heading.appendChild(document.createTextNode(section.title));
			cell.appendChild(heading);
			row.appendChild(cell);
			container.appendChild(row);

			var rowcount = 1;  // for row banding

			// add each of the preferences to the form
			$(section.preferences).each(function(prefkey, pref) {
				if (pref.adminOnly && !Morebits.userIsInGroup("sysop")) {
					return true;  // i.e. "continue" in this context
				}

				row = document.createElement("tr");
				row.style.marginBottom = "0.2em";
				// create odd row banding
				if (rowcount++ % 2 === 0) {
					row.style.backgroundColor = "rgba(128, 128, 128, 0.1)";
				}
				cell = document.createElement("td");

				var label, input;
				switch (pref.type) {

					case "boolean":  // create a checkbox
						cell.setAttribute("colspan", "2");

						label = document.createElement("label");
						input = document.createElement("input");
						input.setAttribute("type", "checkbox");
						input.setAttribute("id", pref.name);
						input.setAttribute("name", pref.name);
						if (configgetter(pref.name) === true) {
							input.setAttribute("checked", "checked");
						}
						label.appendChild(input);
						label.appendChild(document.createTextNode(" " + pref.label));
						cell.appendChild(label);
						break;

					case "string":  // create an input box
					case "integer":
						// add label to first column
						cell.style.textAlign = "right";
						cell.style.paddingRight = "0.5em";
						label = document.createElement("label");
						label.setAttribute("for", pref.name);
						label.appendChild(document.createTextNode(pref.label + ":"));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement("td");
						cell.style.paddingRight = "1em";
						input = document.createElement("input");
						input.setAttribute("type", "text");
						input.setAttribute("id", pref.name);
						input.setAttribute("name", pref.name);
						if (pref.type === "integer") {
							input.setAttribute("size", 6);
							input.setAttribute("type", "number");
							input.setAttribute("step", "1");  // integers only
						}
						if (configgetter(pref.name)) {
							input.setAttribute("value", configgetter(pref.name));
						}
						cell.appendChild(input);
						break;

					case "enum":  // create a combo box
						// add label to first column
						// note: duplicates the code above, under string/integer
						cell.style.textAlign = "right";
						cell.style.paddingRight = "0.5em";
						label = document.createElement("label");
						label.setAttribute("for", pref.name);
						label.appendChild(document.createTextNode(pref.label + ":"));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement("td");
						cell.style.paddingRight = "1em";
						input = document.createElement("select");
						input.setAttribute("id", pref.name);
						input.setAttribute("name", pref.name);
						$.each(pref.enumValues, function(enumvalue, enumdisplay) {
							var option = document.createElement("option");
							option.setAttribute("value", enumvalue);
							if (configgetter(pref.name) === enumvalue) {
								option.setAttribute("selected", "selected");
							}
							option.appendChild(document.createTextNode(enumdisplay));
							input.appendChild(option);
						});
						cell.appendChild(input);
						break;

					case "set":  // create a set of check boxes
						// add label first of all
						cell.setAttribute("colspan", "2");
						label = document.createElement("label");  // not really necessary to use a label element here, but we do it for consistency of styling
						label.appendChild(document.createTextNode(pref.label + ":"));
						cell.appendChild(label);

						var checkdiv = document.createElement("div");
						checkdiv.style.paddingLeft = "1em";
						var worker = function(itemkey, itemvalue) {
							var checklabel = document.createElement("label");
							checklabel.style.marginRight = "0.7em";
							checklabel.style.display = "inline-block";
							var check = document.createElement("input");
							check.setAttribute("type", "checkbox");
							check.setAttribute("id", pref.name + "_" + itemkey);
							check.setAttribute("name", pref.name + "_" + itemkey);
							if (configgetter(pref.name) && configgetter(pref.name).indexOf(itemkey) !== -1) {
								check.setAttribute("checked", "checked");
							}
							// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
							if (pref.name === "unlinkNamespaces") {
								if (configgetter(pref.name) && configgetter(pref.name).indexOf(parseInt(itemkey, 10)) !== -1) {
									check.setAttribute("checked", "checked");
								}
							}
							checklabel.appendChild(check);
							checklabel.appendChild(document.createTextNode(itemvalue));
							checkdiv.appendChild(checklabel);
						};
						if (pref.setDisplayOrder) {
							// add check boxes according to the given display order
							$.each(pref.setDisplayOrder, function(itemkey, item) {
								worker(item, pref.setValues[item]);
							});
						} else {
							// add check boxes according to the order it gets fed to us (probably strict alphabetical)
							$.each(pref.setValues, worker);
						}
						cell.appendChild(checkdiv);
						break;

					case "customList":
						// add label to first column
						cell.style.textAlign = "right";
						cell.style.paddingRight = "0.5em";
						label = document.createElement("label");
						label.setAttribute("for", pref.name);
						label.appendChild(document.createTextNode(pref.label + ":"));
						cell.appendChild(label);
						row.appendChild(cell);

						// add button to second column
						cell = document.createElement("td");
						cell.style.paddingRight = "1em";
						var button = document.createElement("button");
						button.setAttribute("id", pref.name);
						button.setAttribute("name", pref.name);
						button.setAttribute("type", "button");
						button.addEventListener("click", Twinkle.config.listDialog.display, false);
						// use jQuery data on the button to store the current config value
						$(button).data({
							value: configgetter(pref.name),
							pref: pref,
							inFriendlyConfig: section.inFriendlyConfig
						});
						button.appendChild(document.createTextNode("Edit items"));
						cell.appendChild(button);
						break;

					default:
						alert("twinkleconfig: unknown data type for preference " + pref.name);
						break;
				}
				row.appendChild(cell);

				// add help tip
				cell = document.createElement("td");
				cell.style.fontSize = "90%";

				cell.style.color = "gray";
				if (pref.helptip) {
					// convert mentions of templates in the helptip to clickable links
					cell.innerHTML = pref.helptip.replace(/{{(.+?)}}/g,
						'{{<a href="' + mw.util.getUrl("Template:") + '$1" target="_blank">$1</a>}}');
				}
				// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
				if (pref.type !== "customList") {
					var resetlink = document.createElement("a");
					resetlink.setAttribute("href", "#tw-reset");
					resetlink.setAttribute("id", "twinkle-config-reset-" + pref.name);
					resetlink.addEventListener("click", Twinkle.config.resetPrefLink, false);
					if (resetlink.style.styleFloat) {  // IE (inc. IE9)
						resetlink.style.styleFloat = "right";
					} else {  // standards
						resetlink.style.cssFloat = "right";
					}
					resetlink.style.margin = "0 0.6em";
					resetlink.appendChild(document.createTextNode("Reset"));
					cell.appendChild(resetlink);
				}
				row.appendChild(cell);

				container.appendChild(row);
				return true;
			});
			return true;
		});

		var footerbox = document.createElement("div");
		footerbox.setAttribute("id", "twinkle-config-buttonpane");
		footerbox.style.backgroundColor = "#BCCADF";
		footerbox.style.padding = "0.5em";
		var button = document.createElement("button");
		button.setAttribute("id", "twinkle-config-submit");
		button.setAttribute("type", "submit");
		button.appendChild(document.createTextNode("Save changes"));
		footerbox.appendChild(button);
		var footerspan = document.createElement("span");
		footerspan.className = "plainlinks";
		footerspan.style.marginLeft = "2.4em";
		footerspan.style.fontSize = "90%";
		var footera = document.createElement("a");
		footera.setAttribute("href", "#tw-reset-all");
		footera.setAttribute("id", "twinkle-config-resetall");
		footera.addEventListener("click", Twinkle.config.resetAllPrefs, false);
		footera.appendChild(document.createTextNode("Restore defaults"));
		footerspan.appendChild(footera);
		footerbox.appendChild(footerspan);
		contentform.appendChild(footerbox);

		// since all the section headers exist now, we can try going to the requested anchor
		if (location.hash) {
			location.hash = location.hash;
		}

	} else if (mw.config.get("wgNamespaceNumber") === mw.config.get("wgNamespaceIds").user &&
			mw.config.get("wgTitle").indexOf(mw.config.get("wgUserName")) === 0 &&
			mw.config.get("wgPageName").slice(-3) === ".js") {

		var box = document.createElement("div");
		box.setAttribute("id", "twinkle-config-headerbox");
		box.style.border = "1px #f60 solid";
		box.style.background = "#fed";
		box.style.padding = "0.6em";
		box.style.margin = "0.5em auto";
		box.style.textAlign = "center";

		var link,
			scriptPageName = mw.config.get("wgPageName").slice(mw.config.get("wgPageName").lastIndexOf("/") + 1,
				mw.config.get("wgPageName").lastIndexOf(".js"));

		if (scriptPageName === "twinkleoptions") {
			// place "why not try the preference panel" notice
			box.style.fontWeight = "bold";
			box.style.width = "80%";
			box.style.borderWidth = "2px";

			if (mw.config.get("wgArticleId") > 0) {  // page exists
				box.appendChild(document.createTextNode("This page contains your Twinkle preferences. You can change them using the "));
			} else {  // page does not exist
				box.appendChild(document.createTextNode("You can customize Twinkle to suit your preferences by using the "));
			}
			link = document.createElement("a");
			link.setAttribute("href", mw.util.getUrl(mw.config.get("wgFormattedNamespaces")[mw.config.get("wgNamespaceIds").project] + ":Twinkle/Preferences") );
			link.appendChild(document.createTextNode("Twinkle preferences panel"));
			box.appendChild(link);
			box.appendChild(document.createTextNode(", or by editing this page."));
			$(box).insertAfter($("#contentSub"));

		} else if (["monobook", "vector", "cologneblue", "modern", "common"].indexOf(scriptPageName) !== -1) {
			// place "Looking for Twinkle options?" notice
			box.style.width = "60%";

			box.appendChild(document.createTextNode("If you want to set Twinkle preferences, you can use the "));
			link = document.createElement("a");
			link.setAttribute("href", mw.util.getUrl(mw.config.get("wgFormattedNamespaces")[mw.config.get("wgNamespaceIds").project] + ":Twinkle/Preferences") );
			link.appendChild(document.createTextNode("Twinkle preferences panel"));
			box.appendChild(link);
			box.appendChild(document.createTextNode("."));
			$(box).insertAfter($("#contentSub"));
		}
	}
};

// Morebits.wiki.page callback from init code
Twinkle.config.legacyPrefsNotice = function twinkleconfigLegacyPrefsNotice(pageobj) {
	var text = pageobj.getPageText();
	var contentnotice = pageobj.getCallbackParameters();
	if (text.indexOf("TwinkleConfig") !== -1 || text.indexOf("FriendlyConfig") !== -1) {
		contentnotice.innerHTML = '<table class="plainlinks ombox ombox-content"><tr><td class="mbox-image">' +
			'<img alt="" src="http://upload.wikimedia.org/wikipedia/en/3/38/Imbox_content.png" /></td>' +
			'<td class="mbox-text"><p><big><b>Before modifying your settings here,</b> you must remove your old Twinkle and Friendly settings from your personal skin JavaScript.</big></p>' +
			'<p>To do this, you can <a href="' + mw.config.get("wgScript") + '?title=User:' + encodeURIComponent(mw.config.get("wgUserName")) + '/' + mw.config.get("skin") + '.js&action=edit" target="_blank"><b>edit your personal JavaScript</b></a>, removing all lines of code that refer to <code>TwinkleConfig</code> and <code>FriendlyConfig</code>.</p>' +
			'</td></tr></table>';
	} else {
		$(contentnotice).remove();
	}
};

// custom list-related stuff

Twinkle.config.listDialog = {};

Twinkle.config.listDialog.addRow = function twinkleconfigListDialogAddRow(dlgtable, value, label) {
	var contenttr = document.createElement("tr");
	// "remove" button
	var contenttd = document.createElement("td");
	var removeButton = document.createElement("button");
	removeButton.setAttribute("type", "button");
	removeButton.addEventListener("click", function() { $(contenttr).remove(); }, false);
	removeButton.textContent = "Remove";
	contenttd.appendChild(removeButton);
	contenttr.appendChild(contenttd);

	// value input box
	contenttd = document.createElement("td");
	var input = document.createElement("input");
	input.setAttribute("type", "text");
	input.className = "twinkle-config-customlist-value";
	input.style.width = "97%";
	if (value) {
		input.setAttribute("value", value);
	}
	contenttd.appendChild(input);
	contenttr.appendChild(contenttd);

	// label input box
	contenttd = document.createElement("td");
	input = document.createElement("input");
	input.setAttribute("type", "text");
	input.className = "twinkle-config-customlist-label";
	input.style.width = "98%";
	if (label) {
		input.setAttribute("value", label);
	}
	contenttd.appendChild(input);
	contenttr.appendChild(contenttd);

	dlgtable.appendChild(contenttr);
};

Twinkle.config.listDialog.display = function twinkleconfigListDialogDisplay(e) {
	var $prefbutton = $(e.target);
	var curvalue = $prefbutton.data("value");
	var curpref = $prefbutton.data("pref");

	var dialog = new Morebits.simpleWindow(720, 400);
	dialog.setTitle(curpref.label);
	dialog.setScriptName("Twinkle preferences");

	var dialogcontent = document.createElement("div");
	var dlgtable = document.createElement("table");
	dlgtable.className = "wikitable";
	dlgtable.style.margin = "1.4em 1em";
	dlgtable.style.width = "auto";

	var dlgtbody = document.createElement("tbody");

	// header row
	var dlgtr = document.createElement("tr");
	// top-left cell
	var dlgth = document.createElement("th");
	dlgth.style.width = "5%";
	dlgtr.appendChild(dlgth);
	// value column header
	dlgth = document.createElement("th");
	dlgth.style.width = "35%";
	dlgth.textContent = (curpref.customListValueTitle ? curpref.customListValueTitle : "Value");
	dlgtr.appendChild(dlgth);
	// label column header
	dlgth = document.createElement("th");
	dlgth.style.width = "60%";
	dlgth.textContent = (curpref.customListLabelTitle ? curpref.customListLabelTitle : "Label");
	dlgtr.appendChild(dlgth);
	dlgtbody.appendChild(dlgtr);

	// content rows
	var gotRow = false;
	$.each(curvalue, function(k, v) {
		gotRow = true;
		Twinkle.config.listDialog.addRow(dlgtbody, v.value, v.label);
	});
	// if there are no values present, add a blank row to start the user off
	if (!gotRow) {
		Twinkle.config.listDialog.addRow(dlgtbody);
	}

	// final "add" button
	var dlgtfoot = document.createElement("tfoot");
	dlgtr = document.createElement("tr");
	var dlgtd = document.createElement("td");
	dlgtd.setAttribute("colspan", "3");
	var addButton = document.createElement("button");
	addButton.style.minWidth = "8em";
	addButton.setAttribute("type", "button");
	addButton.addEventListener("click", function(e) {
		Twinkle.config.listDialog.addRow(dlgtbody);
	}, false);
	addButton.textContent = "Add";
	dlgtd.appendChild(addButton);
	dlgtr.appendChild(dlgtd);
	dlgtfoot.appendChild(dlgtr);

	dlgtable.appendChild(dlgtbody);
	dlgtable.appendChild(dlgtfoot);
	dialogcontent.appendChild(dlgtable);

	// buttonpane buttons: [Save changes] [Reset] [Cancel]
	var button = document.createElement("button");
	button.setAttribute("type", "submit");  // so Morebits.simpleWindow puts the button in the button pane
	button.addEventListener("click", function(e) {
		Twinkle.config.listDialog.save($prefbutton, dlgtbody);
		dialog.close();
	}, false);
	button.textContent = "Save changes";
	dialogcontent.appendChild(button);
	button = document.createElement("button");
	button.setAttribute("type", "submit");  // so Morebits.simpleWindow puts the button in the button pane
	button.addEventListener("click", function(e) {
		Twinkle.config.listDialog.reset($prefbutton, dlgtbody);
	}, false);
	button.textContent = "Reset";
	dialogcontent.appendChild(button);
	button = document.createElement("button");
	button.setAttribute("type", "submit");  // so Morebits.simpleWindow puts the button in the button pane
	button.addEventListener("click", function(e) {
		dialog.close();  // the event parameter on this function seems to be broken
	}, false);
	button.textContent = "Cancel";
	dialogcontent.appendChild(button);

	dialog.setContent(dialogcontent);
	dialog.display();
};

// Resets the data value, re-populates based on the new (default) value, then saves the
// old data value again (less surprising behaviour)
Twinkle.config.listDialog.reset = function twinkleconfigListDialogReset(button, tbody) {
	// reset value on button
	var $button = $(button);
	var curpref = $button.data("pref");
	var oldvalue = $button.data("value");
	Twinkle.config.resetPref(curpref, $button.data("inFriendlyConfig"));

	// reset form
	var $tbody = $(tbody);
	$tbody.find("tr").slice(1).remove();  // all rows except the first (header) row
	// add the new values
	var curvalue = $button.data("value");
	$.each(curvalue, function(k, v) {
		Twinkle.config.listDialog.addRow(tbody, v.value, v.label);
	});

	// save the old value
	$button.data("value", oldvalue);
};

Twinkle.config.listDialog.save = function twinkleconfigListDialogSave(button, tbody) {
	var result = [];
	var current = {};
	$(tbody).find('input[type="text"]').each(function(inputkey, input) {
		if ($(input).hasClass("twinkle-config-customlist-value")) {
			current = { value: input.value };
		} else {
			current.label = input.value;
			// exclude totally empty rows
			if (current.value || current.label) {
				result.push(current);
			}
		}
	});
	$(button).data("value", result);
};

// reset/restore defaults

Twinkle.config.resetPrefLink = function twinkleconfigResetPrefLink(e) {
	var wantedpref = e.target.id.substring(21); // "twinkle-config-reset-" prefix is stripped

	// search tactics
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsInGroup("sysop"))) {
			return true;  // continue: skip impossibilities
		}

		var foundit = false;

		$(section.preferences).each(function(prefkey, pref) {
			if (pref.name !== wantedpref) {
				return true;  // continue
			}
			Twinkle.config.resetPref(pref, section.inFriendlyConfig);
			foundit = true;
			return false;  // break
		});

		if (foundit) {
			return false;  // break
		}
	});
	return false;  // stop link from scrolling page
};

Twinkle.config.resetPref = function twinkleconfigResetPref(pref, inFriendlyConfig) {
	switch (pref.type) {

		case "boolean":
			document.getElementById(pref.name).checked = (inFriendlyConfig ?
				Twinkle.defaultConfig.friendly[pref.name] : Twinkle.defaultConfig.twinkle[pref.name]);
			break;

		case "string":
		case "integer":
		case "enum":
			document.getElementById(pref.name).value = (inFriendlyConfig ?
				Twinkle.defaultConfig.friendly[pref.name] : Twinkle.defaultConfig.twinkle[pref.name]);
			break;

		case "set":
			$.each(pref.setValues, function(itemkey, itemvalue) {
				if (document.getElementById(pref.name + "_" + itemkey)) {
					document.getElementById(pref.name + "_" + itemkey).checked = ((inFriendlyConfig ?
						Twinkle.defaultConfig.friendly[pref.name] : Twinkle.defaultConfig.twinkle[pref.name]).indexOf(itemkey) !== -1);
				}
			});
			break;

		case "customList":
			$(document.getElementById(pref.name)).data("value", (inFriendlyConfig ?
				Twinkle.defaultConfig.friendly[pref.name] : Twinkle.defaultConfig.twinkle[pref.name]));
			break;

		default:
			alert("twinkleconfig: unknown data type for preference " + pref.name);
			break;
	}
};

Twinkle.config.resetAllPrefs = function twinkleconfigResetAllPrefs() {
	// no confirmation message - the user can just refresh/close the page to abort
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsInGroup("sysop"))) {
			return true;  // continue: skip impossibilities
		}
		$(section.preferences).each(function(prefkey, pref) {
			if (!pref.adminOnly || Morebits.userIsInGroup("sysop")) {
				Twinkle.config.resetPref(pref, section.inFriendlyConfig);
			}
		});
		return true;
	});
	return false;  // stop link from scrolling page
};

Twinkle.config.save = function twinkleconfigSave(e) {
	Morebits.status.init( document.getElementById("twinkle-config-content") );

	Morebits.wiki.actionCompleted.notice = "Save";

	var userjs = mw.config.get("wgFormattedNamespaces")[mw.config.get("wgNamespaceIds").user] + ":" + mw.config.get("wgUserName") + "/twinkleoptions.js";
	var wikipedia_page = new Morebits.wiki.page(userjs, "Saving preferences to " + userjs);
	wikipedia_page.setCallbackParameters(e.target);
	wikipedia_page.load(Twinkle.config.writePrefs);

	return false;
};

// The JSON stringify method in the following code was excerpted from
// http://www.JSON.org/json2.js
// version of 2011-02-23

// Douglas Crockford, the code's author, has released it into the Public Domain.
// See http://www.JSON.org/js.html

var JSON;
if (!JSON) {
	JSON = {};
}

(function() {
	var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap,
		indent = '  ',  // hardcoded indent
		meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\' };

	function quote(string) {
		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
			var c = meta[a];
			return typeof c === 'string' ? c :	'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) + '"' : '"' + string + '"';
	}

	function str(key, holder) {
		var i, k, v, length, mind = gap, partial, value = holder[key];

		if (value && typeof value === 'object' && $.isFunction(value.toJSON)) {
			value = value.toJSON(key);
		}

		switch (typeof value) {
		case 'string':
			return quote(value);
		case 'number':
			return isFinite(value) ? String(value) : 'null';
		case 'boolean':
		case 'null':
			return String(value);
		case 'object':
			if (!value) {
				return 'null';
			}
			gap += indent;
			partial = [];
			if ($.isArray(value)) {
				length = value.length;
				for (i = 0; i < length; ++i) {
					partial[i] = str(i, value) || 'null';
				}
				v = partial.length === 0 ? '[]' : gap ?
					'[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
					'[' + partial.join(',') + ']';
				gap = mind;
				return v;
			}
			for (k in value) {
				if (Object.prototype.hasOwnProperty.call(value, k)) {
					v = str(k, value);
					if (v) {
						partial.push(quote(k) + (gap ? ': ' : ':') + v);
					}
				}
			}
			v = partial.length === 0 ? '{}' : gap ?
				'{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
				'{' + partial.join(',') + '}';
			gap = mind;
			return v;
		default:
			throw new Error( "JSON.stringify: unknown data type" );
		}
	}

	if (!$.isFunction(JSON.stringify)) {
		JSON.stringify = function (value, ignoredParam1, ignoredParam2) {
			ignoredParam1 = ignoredParam2;  // boredom
			gap = '';
			return str('', {'': value});
		};
	}
}());

Twinkle.config.writePrefs = function twinkleconfigWritePrefs(pageobj) {
	var form = pageobj.getCallbackParameters();
	var statelem = pageobj.getStatusElement();

	// this is the object which gets serialized into JSON
	var newConfig = {
		twinkle: {},
		friendly: {}
	};

	// keeping track of all preferences that we encounter
	// any others that are set in the user's current config are kept
	// this way, preferences that this script doesn't know about are not lost
	// (it does mean obsolete prefs will never go away, but... ah well...)
	var foundTwinklePrefs = [], foundFriendlyPrefs = [];

	// a comparison function is needed later on
	// it is just enough for our purposes (i.e. comparing strings, numbers, booleans,
	// arrays of strings, and arrays of { value, label })
	// and it is not very robust: e.g. compare([2], ["2"]) === true, and
	// compare({}, {}) === false, but it's good enough for our purposes here
	var compare = function(a, b) {
		if ($.isArray(a)) {
			if (a.length !== b.length) {
				return false;
			}
			var asort = a.sort(), bsort = b.sort();
			for (var i = 0; asort[i]; ++i) {
				// comparison of the two properties of custom lists
				if ((typeof asort[i] === "object") && (asort[i].label !== bsort[i].label ||
					asort[i].value !== bsort[i].value)) {
					return false;
				} else if (asort[i].toString() !== bsort[i].toString()) {
					return false;
				}
			}
			return true;
		} else {
			return a === b;
		}
	};

	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.adminOnly && !Morebits.userIsInGroup("sysop")) {
			return;  // i.e. "continue" in this context
		}

		// reach each of the preferences from the form
		$(section.preferences).each(function(prefkey, pref) {
			var userValue;  // = undefined

			// only read form values for those prefs that have them
			if (!section.hidden && (!pref.adminOnly || Morebits.userIsInGroup("sysop"))) {
				switch (pref.type) {

					case "boolean":  // read from the checkbox
						userValue = form[pref.name].checked;
						break;

					case "string":  // read from the input box or combo box
					case "enum":
						userValue = form[pref.name].value;
						break;

					case "integer":  // read from the input box
						userValue = parseInt(form[pref.name].value, 10);
						if (isNaN(userValue)) {
							Morebits.status.warn("Saving", "The value you specified for " + pref.name + " (" + pref.value + ") was invalid.  The save will continue, but the invalid data value will be skipped.");
							userValue = null;
						}
						break;

					case "set":  // read from the set of check boxes
						userValue = [];
						if (pref.setDisplayOrder) {
							// read only those keys specified in the display order
							$.each(pref.setDisplayOrder, function(itemkey, item) {
								if (form[pref.name + "_" + item].checked) {
									userValue.push(item);
								}
							});
						} else {
							// read all the keys in the list of values
							$.each(pref.setValues, function(itemkey, itemvalue) {
								if (form[pref.name + "_" + itemkey].checked) {
									userValue.push(itemkey);
								}
							});
						}
						break;

					case "customList":  // read from the jQuery data stored on the button object
						userValue = $(form[pref.name]).data("value");
						break;

					default:
						alert("twinkleconfig: unknown data type for preference " + pref.name);
						break;
				}
			}

			// only save those preferences that are *different* from the default
			if (section.inFriendlyConfig) {
				if (userValue !== undefined && !compare(userValue, Twinkle.defaultConfig.friendly[pref.name])) {
					newConfig.friendly[pref.name] = userValue;
				}
				foundFriendlyPrefs.push(pref.name);
			} else {
				if (userValue !== undefined && !compare(userValue, Twinkle.defaultConfig.twinkle[pref.name])) {
					newConfig.twinkle[pref.name] = userValue;
				}
				foundTwinklePrefs.push(pref.name);
			}
		});
	});

	if (Twinkle.prefs) {
		$.each(Twinkle.prefs.twinkle, function(tkey, tvalue) {
			if (foundTwinklePrefs.indexOf(tkey) === -1) {
				newConfig.twinkle[tkey] = tvalue;
			}
		});
		$.each(Twinkle.prefs.friendly, function(fkey, fvalue) {
			if (foundFriendlyPrefs.indexOf(fkey) === -1) {
				newConfig.friendly[fkey] = fvalue;
			}
		});
	}

	var text =
		"// twinkleoptions.js: personal Twinkle preferences file\n" +
		"//\n" +
		"// NOTE: The easiest way to change your Twinkle preferences is by using the\n" +
		"// Twinkle preferences panel, at [[" + Morebits.pageNameNorm + "]].\n" +
		"//\n" +
		"// This file is AUTOMATICALLY GENERATED.  Any changes you make (aside from\n" +
		"// changing the configuration parameters in a valid-JavaScript way) will be\n" +
		"// overwritten the next time you click \"save\" in the Twinkle preferences\n" +
		"// panel.  If modifying this file, make sure to use correct JavaScript.\n" +
		"\n" +
		"window.Twinkle.prefs = ";
	text += JSON.stringify(newConfig, null, 2);
	text +=
		";\n" +
		"\n" +
		"// End of twinkleoptions.js\n";

	pageobj.setPageText(text);
	pageobj.setEditSummary("Saving Twinkle preferences: automatic edit from [[" + Morebits.pageNameNorm + "]] ([[WP:TW|TW]])");
	pageobj.setCreateOption("recreate");
	pageobj.save(Twinkle.config.saveSuccess);
};

Twinkle.config.saveSuccess = function twinkleconfigSaveSuccess(pageobj) {
	pageobj.getStatusElement().info("successful");

	var noticebox = document.createElement("div");
	noticebox.className = "successbox";
	noticebox.style.fontSize = "100%";
	noticebox.style.marginTop = "2em";
	noticebox.innerHTML = "<p><b>Your Twinkle preferences have been saved.</b></p><p>To see the changes, you will need to <b>clear your browser cache entirely</b> (see <a href=\"" + mw.util.getUrl("WP:BYPASS") + "\" title=\"WP:BYPASS\">WP:BYPASS</a> for instructions).</p>";
	Morebits.status.root.appendChild(noticebox);
	var noticeclear = document.createElement("br");
	noticeclear.style.clear = "both";
	Morebits.status.root.appendChild(noticeclear);
};
})(jQuery);


//</nowiki>
