// <nowiki>

/*****************************************************************************************************
 * WARNING: This file is synced with a GitHub-repo. Please make any changes to this file over there. *
 * Any local changes might be overwritten the next time this file is updated.                        *
 *                                                                                                   *
 * LET OP: Dit bestand is gekoppeld aan een GitHub-repo. Gelieve alle bewerkingen daar uitvoeren.    *
 * Locale bewerkingen worden mogelijk overschreven bij de volgende update.                           *
 *                                                                                                   *
 * https://github.com/NLWikiTools/Twinkle/blob/master/modules/twinkleconfig.js                       *
 *****************************************************************************************************/

(function($) {


/*
 ****************************************
 *** twinkleconfig.js: Preferences module
 ****************************************
 * Mode of invocation:     Adds configuration form to Wikipedia:Twinkle/Preferences,
                           and adds an ad box to the top of user subpages belonging to the
                           currently logged-in user which end in '.js'
 * Active on:              What I just said.  Yeah.

 Dit script is geporteerd naar de Nederlandstalige Wikipedia door [[Gebruiker: Bas dehaan]]. Neem bij problemen of vragen
 gerust contact met me op.

 Dit script is origineel gemaakt door [[User:This, that and the other]]

 */


Twinkle.config = {};

Twinkle.config.watchlistEnums = {
	'yes': 'Voeg toe aan volglijst (permanent)',
	'no': "Voeg niet toe aan volglijst",
	'default': 'Volg site voorkeuren',
	'1 week': 'Volg 1 week',
	'1 month': 'Volg 1 maand',
	'3 months': 'Volg 3 maanden',
	'6 months': 'Volg 6 maanden'
};

Twinkle.config.commonSets = {
	csdCriteria: {
		g1: 'Leeg halen', g2: 'Onzin', g3: 'Machinevertaling', g4: 'Zelfpromotie', g5: 'Cyberpesten',
		g6: 'Reclame', g7: 'Copyvio', g8: 'Duplicaat', g9: 'Privacyschending', g10: 'Enige auteur',
		u1: 'Eigen naamruimte', u2: 'Misbruik gebruikersnaamruimte'
	},
	csdCriteriaDisplayOrder: [
		'g1', 'g2', 'g3', 'g4', 'g5',
		'g6', 'g7', 'g8', 'g9', 'g10', 
		'u1', 'u2'
	],
	csdCriteriaNotification: {
		g1: 'Leeg halen', g2: 'Onzin', g3: 'Machinevertaling', g4: 'Zelfpromotie', g5: 'Cyberpesten',
		g6: 'Reclame', g7: 'Copyvio', g8: 'Duplicaat', g9: 'Privacyschending', g10: 'Enige auteur',
		u1: 'Eigen naamruimte', u2: 'Misbruik gebruikersnaamruimte'
	},
	csdCriteriaNotificationDisplayOrder: [
		'g1', 'g2', 'g3', 'g4', 'g5',
		'g6', 'g7', 'g8', 'g9', 'g10', 
		'u1', 'u2'
	],
	csdCriteriaDelete: {
		g1: 'Leeg halen', g2: 'Onzin', g3: 'Machinevertaling', g4: 'Zelfpromotie', g5: 'Cyberpesten',
		g6: 'Reclame', g7: 'Copyvio', g8: 'Duplicaat', g9: 'Privacyschending', g10: 'Enige auteur',
		u1: 'Eigen naamruimte',  u2: 'Misbruik gebruikersnaamruimte', s1: 'TBx afhandeling', s2: 'Verplaatsing'
	},
	csdCriteriaDeleteDisplayOrder: [
		'g1', 'g2', 'g3', 'g4', 'g5',
		'g6', 'g7', 'g8', 'g9', 'g10',
		'u1', 'u2', 's1', 's2'
	],
	csdAndDICriteria: {
		g1: 'Leeg halen', g2: 'Onzin', g3: 'Machinevertaling', g4: 'Zelfpromotie', g5: 'Cyberpesten',
		g6: 'Reclame', g7: 'Copyvio', g8: 'Duplicaat', g9: 'Privacyschending', g10: 'Enige auteur', 
		u1: 'Eigen naamruimte', u2: 'Misbruik gebruikersnaamruimte'
	},
	csdAndDICriteriaDisplayOrder: [
		'g1', 'g2', 'g3', 'g4', 'g5',
		'g6', 'g7', 'g8', 'g9', 'g10', 
		'u1', 'u2'
	],
	namespacesNoSpecial: {
		0: 'Artikel',
		1: 'Overleg (artikel)',
		2: 'Gebruiker',
		3: 'Overleg gebruiker',
		4: 'Wikipedia',
		5: 'Overleg Wikipedia',
		8: 'MediaWiki',
		9: 'Overleg MediaWiki',
		10: 'Sjabloon',
		11: 'Overleg sjabloon',
		12: 'Help',
		13: 'Overleg Help',
		14: 'Categorie',
		15: 'Overleg categorie',
		100: 'Portaal',
		101: 'Overleg portaal',
		828: 'Module',
		829: 'Overleg module'
	}
};

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
		title: 'Algemeen',
		module: 'general',
		preferences: [
			// TwinkleConfig.userTalkPageMode may take arguments:
			// 'window': open a new window, remember the opened window
			// 'tab': opens in a new tab, if possible.
			// 'blank': force open in a new window, even if such a window exists
			{
				name: 'userTalkPageMode',
				label: 'Als er een overlegpagina geopend wordt, open het',
				type: 'enum',
				enumValues: { window: 'Op het zelfde tabblad', tab: 'Op een nieuw tabblad', blank: 'In een nieuw venster (popup)' }
			},

			// TwinkleConfig.dialogLargeFont (boolean)
			{
				name: 'dialogLargeFont',
				label: 'Gebruik een groter lettertype op Twinkle formulieren',
				type: 'boolean'
			},

			// Twinkle.config.disabledModules (array)
			{
				name: 'disabledModules',
				label: 'Schakel bepaalde Twinkle modules uit',
				helptip: 'Alles wat je uitschakelt kun je niet gebruiken. Haal het vinkje weg om de module weer in te schakelen.',
				type: 'set',
				setValues: { arv: 'Rapporteer', warn: 'Waarschuw', welcome: 'Welkom', shared: 'Gedeeld IP', speedy: 'Nuweg', xfd: 'TBx', protect: 'Beveiligen', tag: 'Tag', diff: 'Wijz', fluff: 'Terugdraaien' }
			},

			// Twinkle.config.disabledSysopModules (array)
			{
				name: 'disabledSysopModules',
				label: 'Schakel bepaalde sysop-Twinkle modules uit',
				helptip: 'Alles wat je uitschakelt kun je niet gebruiken. Haal het vinkje weg om de module weer in te schakelen.',
				adminOnly: true,
				type: 'set',
				setValues: { block: 'Blokkeer', batchdelete: 'Batch verwijderen', batchprotect: 'Batch beveiligen', batchundelete: 'Batch terugplaatsen' }
			}
		]
	},

	{
		title: 'Rapporteer gebruiker',
		module: 'arv',
		preferences: [
			{
				name: 'spiWatchReport',
				label: 'Voeg sokpopmeldingen toe aan volglijst',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'Blokkeer gebruiker',
		module: 'block',
		adminOnly: true,
		preferences: [
			// TwinkleConfig.defaultToPartialBlocks (boolean)
			// Whether to default partial blocks on or off
			{
				name: 'defaultToPartialBlocks',
				label: 'Selecteer standaard deelblokkades zodra het blokkeer menu geopend wordt.',
				helptip: 'Indien de gebruiker al geblokkeerd is zal deze instelling genegeerd worden ter voorkeur van de huidige blok instellingen.',
				type: 'boolean'
			},

			// TwinkleConfig.blankTalkpageOnIndefBlock (boolean)
			// if true, blank the talk page when issuing an indef block notice (per [[WP:UWUL#Indefinitely blocked users]])
			{
				name: 'blankTalkpageOnIndefBlock',
				label: 'Haal de overlegpagina leeg bij een OT-blokkade',
				helptip: 'Zie <a href="' + mw.util.getUrl('en:Wikipedia:WikiProject_User_warnings/Usage_and_layout#Indefinitely_blocked_users') + '">en:WP:UWUL</a> ter referentie.',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Pagina beveiligen',
		module: 'protect',
		preferences: [
			{
				name: 'watchRequestedPages',
				label: 'Toevoegen aan volglijst bij aanvraag beveiliging',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchProtectedPages',
				label: 'Toevoegen aan volglijst na uitvoeren beveiliging',
				adminOnly: true,
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'Terugdraaien',  // twinklefluff module
		module: 'fluff',
		preferences: [
			// TwinkleConfig.autoMenuAfterRollback (bool)
			// Option to automatically open the warning menu if the user talk page is opened post-reversion
			{
				name: 'autoMenuAfterRollback',
				label: 'Open dossier-menu automatisch na een Twinkle-terugdraaiing',
				helptip: 'Wordt alleen uitgevoerd indien de onderstaande instellingen ook geconfigureerd zijn.',
				type: 'boolean'
			},

			// TwinkleConfig.openTalkPage (array)
			// What types of actions that should result in opening of talk page
			{
				name: 'openTalkPage',
				label: 'Open gebruikersoverleg bij de volgende terugdraaiingen',
				type: 'set',
				setValues: { norm: 'Normale terugdraaiing', vand: 'Vandalisme terugdraaiing' }
			},

			// TwinkleConfig.openTalkPageOnAutoRevert (bool)
			// Defines if talk page should be opened when calling revert from contribs or recent changes pages. If set to true, openTalkPage defines then if talk page will be opened.
			{
				name: 'openTalkPageOnAutoRevert',
				label: 'Open gebruikersoverlegpagina bij terugdraaiing vanuit Recente Wijzigingen of Gebruikers Bijdragen',
				helptip: 'Wordt alleen uitgevoerd indien de bovenstaande instellingen ook geconfigureerd zijn.',
				type: 'boolean'
			},

			// TwinkleConfig.rollbackInPlace (bool)
			//
			{
				name: 'rollbackInPlace',
				label: "Herlaad de pagina niet bij terugdraaiing vanuit Recente Wijzigingen of Gebruikers Bijdragen",
				helptip: "Als dit aan staat zal Twinkle de pagina niet herladen waardoor je meerdere terugdraaiingen achter elkaar kan uitvoeren.",
				type: 'boolean'
			},

			// TwinkleConfig.markRevertedPagesAsMinor (array)
			// What types of actions that should result in marking edit as minor
			{
				name: 'markRevertedPagesAsMinor',
				label: 'Markeer de volgende bewerkingen als kleine bewerking',
				type: 'set',
				setValues: { norm: 'Normale terugdraaiing', vand: 'Vandalisme terugdraaiing', torev: '"Plaats deze versie"' }
			},

			// TwinkleConfig.watchRevertedPages (array)
			// What types of actions that should result in forced addition to watchlist
			{
				name: 'watchRevertedPages',
				label: 'Voeg pagina\'s toe aan volglijst na deze bewerking',
				type: 'set',
				setValues: { norm: 'Normale terugdraaiing', vand: 'Vandalisme terugdraaiing', torev: '"Plaats deze versie"' }
			},
			// TwinkleConfig.watchRevertedExpiry
			// If any of the above items are selected, whether to expire the watch
			{
				name: 'watchRevertedExpiry',
				label: 'Na een terugdraaiing, hoelang moet een pagina op de volglijst geplaatst worden',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'confirmOnFluff',
				label: 'Vraag bevestiging voor een terugdraaiing (op alle apparaten)',
				helptip: 'Handig voor laptops met een touchscreen, en voor mensen die graag twijfelen.',
				type: 'boolean'
			},

			{
				name: 'confirmOnMobileFluff',
				label: 'Vraag bevestiging voor een terugdraaiing (alleen op mobiele apparaten)',
				helptip: 'Voorkom dat je met mistikken op touchscreen de halve wiki terugdraait.',
				type: 'boolean'
			},

			// TwinkleConfig.showRollbackLinks (array)
			// Where Twinkle should show rollback links:
			// diff, others, mine, contribs, history, recent
			// Note from TTO: |contribs| seems to be equal to |others| + |mine|, i.e. redundant, so I left it out heres
			{
				name: 'showRollbackLinks',
				label: 'Toon terugdraaiknoppen op de volgende pagina\'s',
				type: 'set',
				setValues: { diff: 'Versie vergelijken', others: 'Bijdragen van anderen', mine: 'Mijn bijdragen', recent: 'Recente wijzigingen', history: 'Artikel geschiedenis' }
			}
		]
	},
/* Module komt later
	{
		title: 'Gedeeld IP-labeling',
		module: 'shared',
		preferences: [
			{
				name: 'markSharedIPAsMinor',
				label: 'Markeer Gedeeld IP labeling als kleine bewerking',
				type: 'boolean'
			}
		]
	},
*/
	{
		title: 'Directe verwijdering (Nuweg)',
		module: 'speedy',
		preferences: [
			{
				name: 'speedySelectionStyle',
				label: 'Wanneer dient de nominatie geplaatst te worden',
				type: 'enum',
				enumValues: { buttonClick: 'Zodra ik op "Opslaan"', radioClick: 'Zodra ik een reden aanklik' }
			},

			// TwinkleConfig.watchSpeedyPages (array)
			// Whether to add speedy tagged or deleted pages to watchlist
			{
				name: 'watchSpeedyPages',
				label: 'Voeg pagina toe aan volglijst bij gebruik van volgende nominatieredenen',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDisplayOrder
			},
			// TwinkleConfig.watchSpeedyExpiry
			// If any of the above items are selected, whether to expire the watch
			{
				name: 'watchSpeedyExpiry',
				label: 'Bij nominatie, volg de pagina voor:',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
			// If, when applying speedy template to page, to mark the page as triaged/patrolled (if the page was reached from NewPages)
			{
				name: 'markSpeedyPagesAsPatrolled',
				label: 'Markeer een pagina als gecontroleerd na nominatie (indien mogelijk)',
				type: 'boolean'
			},

			// TwinkleConfig.watchSpeedyUser (string)
			// The watchlist setting of the user talk page if they receive a notification.
			{
				name: 'watchSpeedyUser',
				label: 'Plaats overlegpagina aanmaker op volglijst (bij mededelen)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.welcomeUserOnSpeedyDeletionNotification (array of strings)
			// On what types of speedy deletion notifications shall the user be welcomed
			// with a "firstarticle" notice if their talk page has not yet been created.
			{
				name: 'welcomeUserOnSpeedyDeletionNotification',
				label: 'Plaats verwelkoming op overlegpagina bij de volgende nominatieredenen',
				helptip: 'De verwelkoming wordt alleen geplaatst als nominatie wordt medegedeeld met aanmaker, en alleen als er nog geen overlegpagina bestaat.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.notifyUserOnSpeedyDeletionNomination (array)
			// What types of actions should result in the author of the page being notified of nomination
			{
				name: 'notifyUserOnSpeedyDeletionNomination',
				label: 'Plaats mededeling op de overlegpagina overlegpagina van de aanmaker bij de volgende nominatieredenen',
				helptip: 'Zelfs als je kiest voor mededelen op het nuweg-formulier, zal de mededeling alleen geplaatst worden voor de geselecteerde reden.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.warnUserOnSpeedyDelete (array)
			// What types of actions should result in the author of the page being notified of speedy deletion (admin only)
			{
				name: 'warnUserOnSpeedyDelete',
				label: 'Plaats mededeling op overlegpagina na uitvoeren van een directe verwijdering voor de volgende redenen',
				helptip: 'Zelfs als je kiest voor mededelen op het verwijder-formulier, zal de mededeling alleen geplaatst worden voor de geselecteerde reden.',
				adminOnly: true,
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaDelete,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDeleteDisplayOrder
			},


			// TwinkleConfig.deleteTalkPageOnDelete (boolean)
			// If talk page if exists should also be deleted (CSD G8) when spedying a page (admin only)
			{
				name: 'deleteTalkPageOnDelete',
				label: 'Schakel "overlegpagina meeverwijderen" standaard in',
				adminOnly: true,
				type: 'boolean'
			},

			{
				name: 'deleteRedirectsOnDelete',
				label: 'Schakel "doorverwijzingen meeverwijderen" standaard in',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.deleteSysopDefaultToDelete (boolean)
			// Make the CSD screen default to "delete" instead of "tag" (admin only)
			{
				name: 'deleteSysopDefaultToDelete',
				label: 'Voer directe verwijdering zelf uit i.p.v. het nuweg sjabloon plaatsen',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowWidth',
				label: 'Breedte van nuweg-formulier (pixels)',
				type: 'integer'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowHeight',
				label: 'Hoogte van nuweg-formulier (pixels)',
				helptip: 'Als je een grote monitor hebt, is het misschien prettig dit wat groter te maken.',
				type: 'integer'
			},

			{
				name: 'logSpeedyNominations',
				label: 'Maak een logboek van alle nuweg nominaties in mijn gebruikersnaamruimte',
				helptip: 'Omdat niet-moderators geen toegang hebben tot hun verwijderde bijdragen, is een logboek een makkelijke manier om inzicht te krijgen in het aantal nominaties.',
				type: 'boolean'
			},
			{
				name: 'speedyLogPageName',
				label: 'Bewaar het logboek op de volgende pagina',
				helptip: 'Voer een sub-pagina naam in voor het logboek. Je kunt deze terugvinden op Gebruiker:<i>gebruikersnaam</i>/<i>sub-paginanaam</i>.',
				type: 'string'
			},
			{
				name: 'noLogOnSpeedyNomination',
				label: 'Maak geen gebruik van het logboek bij de volgende nominatieredenen',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdAndDICriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
			}
		]
	},
/* module komt later
	{
		title: 'Label',
		module: 'tag',
		preferences: [
			{
				name: 'watchTaggedVenues',
				label: 'Volg dit type pagina, wanneer ik een label toevoeg',
				type: 'set',
				setValues: { articles: 'Artikelen', drafts: 'Drafts', redirects: 'Doorverwijzingen', files: 'Files' }
			},
			{
				name: 'watchTaggedPages',
				label: 'Indien gelabeld, volg het voor',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchMergeDiscussions',
				label: 'Voeg overlegpagina toe aan volglijst zodra ik een samenvoegingsdiscussie start',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'markTaggedPagesAsMinor',
				label: 'Markeer een labeltoevoeging als kleine bewerking',
				type: 'boolean'
			},
			{
				name: 'markTaggedPagesAsPatrolled',
				label: 'Vink het "markeer als gecontroleerd" vakje standaard aan',
				type: 'boolean'
			},
			{
				name: 'groupByDefault',
				label: 'Vink het "groepeer {{meerdere problemen}}" vakje standaard aan',
				type: 'boolean'
			},
			{
				name: 'tagArticleSortOrder',
				label: 'Standaard weergavevolgorde voor artikel labels',
				type: 'enum',
				enumValues: { cat: 'Op categorie', alpha: 'Op alfabet' }
			},
			{
				name: 'customTagList',
				label: 'Aangepaste onderhoudssjablonen',
				helptip: "Deze worden weergegeven als extra sjablonen onder aan de lijst. Hiermee kun je nieuwe sjablonen toevoegen die (nog) niet zijn opgenomen in Twinkle.",
				type: 'customList',
				customListValueTitle: 'Sjabloonnaam (zonder accolades)',
				customListLabelTitle: 'Label zoals weertegeven in het overzicht'
			},
			//  <verwijderen?>
			{
				name: 'customRedirectTagList',
				label: 'Custom redirect category tags to display',
				helptip: 'Additional tags that you wish to add for redirects.',
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Tag dialog'
			}
			//  </verwijderen?>
		]
	},
*/

	{
		title: 'Ontlink',
		module: 'unlink',
		preferences: [
			// TwinkleConfig.unlinkNamespaces (array)
			// In what namespaces unlink should happen, default in 0 (artikel), 10 (sjabloon) en 100 (portaal)
			{
				name: 'unlinkNamespaces',
				label: 'Verwijder links naar een pagina alleen in de volgende naamruimtes',
				helptip: 'Schakel dit NOOIT in op overlegnaamruimtes, aangezien Twinkle dan mogelijk archieven kan gaan ontlinken (a big no-no).',
				type: 'set',
				setValues: Twinkle.config.commonSets.namespacesNoSpecial
			}
		]
	},


	{
		title: 'Gebruiker dossiers',
		module: 'warn',
		preferences: [
			// TwinkleConfig.defaultWarningGroup (int)
			// Which level warning should be the default selected group, default is 1
			{
				name: 'defaultWarningGroup',
				label: 'Standaard waarschuwingsniveau',
				type: 'enum',
				enumValues: {
					1: 'Niveau 1 - Mededeling',
					2: 'Niveau 2 - Berisping',
					3: 'Niveau 3 - Waarschuwing',
					4: 'Niveau 4 - Laatste waarschuwing',
					5: 'Niveau E - Enige waarschuwing',
					//6: 'Single-issue notices', (n.v.t. op nlwiki)
					//7: 'Single-issue warnings', (n.v.t. op nlwiki)
					// 8 was used for block templates before #260
					9: 'Aangepaste waarschuwingen',
					10: 'Alle waarschuwingssjablonen'
					//11: 'Automatisch niveau (1-4)' (werkt nog niet)
				}
			},

			// TwinkleConfig.showSharedIPNotice may take arguments:
			// true: to show shared ip notice if an IP address
			// false: to not print the notice

			/* nog niet ingeschakeld //TODO
			{
				name: 'showSharedIPNotice',
				label: 'Voeg extra mededeling toe bij gedeelde IP-adressen',
				helptip: 'Het sjabloon {{Gedeeld IP}} wordt gebruikt',
				type: 'boolean'
			},
			 */

			// TwinkleConfig.watchWarnings (string)
			// Watchlist setting for the page which has been dispatched an warning or notice
			{
				name: 'watchWarnings',
				label: 'Voeg overlegpagina toe aan volglijst na aanmaken dossier',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.oldSelect (boolean)
			// if true, use the native select menu rather the select2-based one
			{
				name: 'oldSelect',
				label: 'Gebruik klassiek menu zonder zoekfunctie (verouderd)',
				type: 'boolean'
			},

			{
				name: 'customWarningList',
				label: 'Aangepaste dossier-sjablonen',
				helptip: 'Je kan overige, of zelfgemaakte, dossiersjablonen toevoegen om te gebruiken in Twinkle. Deze verschijnen onder de "Aangepaste dossiers" categorie op het dossier-formulier.',
				type: 'customList',
				customListValueTitle: 'Sjabloonpaginanaam (zonder accolades)',
				customListLabelTitle: 'Naam zoals weer te geven in lijst (wordt ook gebruikt voor de bewerkingssamenvatting)'
			}
		]
	},

	{
		title: 'Verwelkom gebruiker',
		module: 'welcome',
		preferences: [
			{
				name: 'topWelcomes',
				label: 'Plaats het welkom-sjabloon boven alle andere content op de overlegpagina',
				type: 'boolean'
			},
			{
				name: 'watchWelcomes',
				label: 'Voeg overlegpagina toe aan volglijst na verwelkoming',
				helptip: 'Dit maakt de verwelkoming wat meer persoonlijk - je kunt de vooruitgang van de nieuweling zien, en waar mogelijk helpen.',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'insertUsername',
				label: 'Voeg je gebruikersnaam toe aan de verwelkoming (waar mogelijk)',
				type: 'boolean'
			},
			{
				name: 'quickWelcomeMode',
				label: 'Op de "welkom" knop drukken in een wijz zal',
				helptip: 'Indien je kiest voor automatische plaatsing zal het onderstaande sjabloon gebruikt worden.',
				type: 'enum',
				enumValues: { auto: 'automatisch een verwelkoming plaatsen', norm: 'vragen welk sjabloon je wil gebruiken' }
			},
			{
				name: 'quickWelcomeTemplate',
				label: 'Sjabloon dat gebruikt wordt bij automatische verwelkoming',
				helptip: 'Geef de sjabloonpaginanaam, zonder accolades. Een link naar de pagina zal automatisch toegevoegd worden.',
				type: 'string'
			},
			{
				name: 'customWelcomeList',
				label: 'Aangepaste welkomssjablonen om te weergeven',
				helptip: "Je kan overige, of zelfgemaakte, welkomssjablonen toevoegen om te gebruiken in Twinkle.",
				type: 'customList',
				customListValueTitle: 'Sjabloonpaginanaam (zonder accolades)',
				customListLabelTitle: 'Naam zoals weer te geven in lijst'
			},
			{
				name: 'customWelcomeSignature',
				label: 'Aangepaste welkomssjablonen automatisch ondertekenen',
				helptip: 'Indien je aangepaste sjabloon zelf al beschikt over een ondertekenfunctie, schakel dit dan uit.',
				type: 'boolean'
			}
		]
	},

	{
		title: 'TBx (verwijder nominatie)',
		module: 'xfd',
		preferences: [
			{
				name: 'logXfdNominations',
				label: 'Maak een logboek van alle TBx nominaties in mijn gebruikersnaamruimte',
				helptip: 'Omdat niet-moderators geen toegang hebben tot hun verwijderde bijdragen, is een logboek een makkelijke manier om inzicht te krijgen in het aantal nominaties.',
				type: 'boolean'
			},
			{
				name: 'xfdLogPageName',
				label: 'Bewaar het logboek op de volgende pagina',
				helptip: 'Voer een sub-pagina naam in voor het logboek. Je kunt deze terugvinden op Gebruiker:<i>gebruikersnaam</i>/<i>sub-paginanaam</i>.',
				type: 'string'
			},
			{
				name: 'noLogOnXfdNomination',
				label: 'Maak geen gebruik van het logboek bij de volgende nominatielocaties',
				type: 'set',
				setValues: { afd: 'TBP (Te Beoordelen Pagina\'s)', tfd: 'TBS (Te beoordelen Sjablonen)', cfd: 'TBC (Te beoordelen Categorieën)' }
			},

			// TwinkleConfig.xfdWatchPage (string)
			// The watchlist setting of the page being nominated for XfD.
			{
				name: 'xfdWatchPage',
				label: 'Voeg genomineerde pagina toe aan volglijst',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchDiscussion (string)
			// The watchlist setting of the newly created XfD page (for those processes that create discussion pages for each nomination),
			// or the list page for the other processes.
			{
				name: 'xfdWatchDiscussion',
				label: 'Voeg verwijderdiscussie toe aan volglijst',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchUser (string)
			// The watchlist setting of the user talk page if they receive a notification.
			{
				name: 'xfdWatchUser',
				label: 'Voeg overlegpagina van aanmaker toe aan volglijst (bij notificatie)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			{
				name: 'markXfdPagesAsPatrolled',
				label: 'Markeer pagina als gecontroleerd bij nominatie (indien mogelijk)',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Hidden',
		hidden: true,
		preferences: [
			// twinkle.js: portlet setup
			{
				name: 'portletArea',
				type: 'string'
			},
			{
				name: 'portletId',
				type: 'string'
			},
			{
				name: 'portletName',
				type: 'string'
			},
			{
				name: 'portletType',
				type: 'string'
			},
			{
				name: 'portletNext',
				type: 'string'
			},
			// twinklefluff.js: defines how many revision to query maximum, maximum possible is 50, default is 50
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
			return;  // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
		}

		// set style (the url() CSS function doesn't seem to work from wikicode - ?!)
		document.getElementById('twinkle-config-titlebar').style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAMAAAB%2FqqA%2BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEhQTFRFr73ZobTPusjdsMHZp7nVwtDhzNbnwM3fu8jdq7vUt8nbxtDkw9DhpbfSvMrfssPZqLvVztbno7bRrr7W1d%2Fs1N7qydXk0NjpkW7Q%2BgAAADVJREFUeNoMwgESQCAAAMGLkEIi%2FP%2BnbnbpdB59app5Vdg0sXAoMZCpGoFbK6ciuy6FX4ABAEyoAef0BXOXAAAAAElFTkSuQmCC)';

		var contentdiv = document.getElementById('twinkle-config-content');
		contentdiv.textContent = '';  // clear children

		// let user know about possible conflict with skin js/common.js file
		// (settings in that file will still work, but they will be overwritten by twinkleoptions.js settings)
		if (window.TwinkleConfig || window.FriendlyConfig) {
			var contentnotice = document.createElement('p');
			contentnotice.innerHTML = '<table class="plainlinks ombox ombox-content"><tr><td class="mbox-image">' +
				'<img alt="" src="https://upload.wikimedia.org/wikipedia/commons/3/38/Imbox_content.png" /></td>' +
				'<td class="mbox-text"><p><big><b>Voordat je verder gaat,</b> moet je eerst je oude Twinkle instellingen verwijderen uit je persoonlijke JavaScript.</big></p>' +
				'<p>Om dit te doen, kan je <a href="' + mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/' + mw.config.get('skin') +
				'.js', { action: 'edit' }) + '" target="_blank"><b>je eigen javascript bewerken</b></a> of kun je in <a href="' +
				mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/common.js', { action: 'edit'}) + '" target="_blank"><b>je common.js bestand</b></a>, alle regels code verwijderen die naar <code>TwinkleConfig</code> verwijzen.</p>' +
				'</td></tr></table>';
			contentdiv.appendChild(contentnotice);
		}

		// start a table of contents
		var toctable = document.createElement('div');
		toctable.className = 'toc';
		toctable.style.marginLeft = '0.4em';
		// create TOC title
		var toctitle = document.createElement('div');
		toctitle.id = 'toctitle';
		var toch2 = document.createElement('h2');
		toch2.textContent = 'Contents ';
		toctitle.appendChild(toch2);
		// add TOC show/hide link
		var toctoggle = document.createElement('span');
		toctoggle.className = 'toctoggle';
		toctoggle.appendChild(document.createTextNode('['));
		var toctogglelink = document.createElement('a');
		toctogglelink.className = 'internal';
		toctogglelink.setAttribute('href', '#tw-tocshowhide');
		toctogglelink.textContent = 'hide';
		toctoggle.appendChild(toctogglelink);
		toctoggle.appendChild(document.createTextNode(']'));
		toctitle.appendChild(toctoggle);
		toctable.appendChild(toctitle);
		// create item container: this is what we add stuff to
		var tocul = document.createElement('ul');
		toctogglelink.addEventListener('click', function twinkleconfigTocToggle() {
			var $tocul = $(tocul);
			$tocul.toggle();
			if ($tocul.find(':visible').length) {
				toctogglelink.textContent = 'hide';
			} else {
				toctogglelink.textContent = 'show';
			}
		}, false);
		toctable.appendChild(tocul);
		contentdiv.appendChild(toctable);

		var contentform = document.createElement('form');
		contentform.setAttribute('action', 'javascript:void(0)');  // was #tw-save - changed to void(0) to work around Chrome issue
		contentform.addEventListener('submit', Twinkle.config.save, true);
		contentdiv.appendChild(contentform);

		var container = document.createElement('table');
		container.style.width = '100%';
		contentform.appendChild(container);

		$(Twinkle.config.sections).each(function(sectionkey, section) {
			if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
				return true;  // i.e. "continue" in this context
			}

			// add to TOC
			var tocli = document.createElement('li');
			tocli.className = 'toclevel-1';
			var toca = document.createElement('a');
			toca.setAttribute('href', '#' + section.module);
			toca.appendChild(document.createTextNode(section.title));
			tocli.appendChild(toca);
			tocul.appendChild(tocli);

			var row = document.createElement('tr');
			var cell = document.createElement('td');
			cell.setAttribute('colspan', '3');
			var heading = document.createElement('h4');
			heading.style.borderBottom = '1px solid gray';
			heading.style.marginTop = '0.2em';
			heading.id = section.module;
			heading.appendChild(document.createTextNode(section.title));
			cell.appendChild(heading);
			row.appendChild(cell);
			container.appendChild(row);

			var rowcount = 1;  // for row banding

			// add each of the preferences to the form
			$(section.preferences).each(function(prefkey, pref) {
				if (pref.adminOnly && !Morebits.userIsSysop) {
					return true;  // i.e. "continue" in this context
				}

				row = document.createElement('tr');
				row.style.marginBottom = '0.2em';
				// create odd row banding
				if (rowcount++ % 2 === 0) {
					row.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
				}
				cell = document.createElement('td');

				var label, input, gotPref = Twinkle.getPref(pref.name);
				switch (pref.type) {

					case 'boolean':  // create a checkbox
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

					case 'string':  // create an input box
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
							input.setAttribute('step', '1');  // integers only
						}
						if (gotPref) {
							input.setAttribute('value', gotPref);
						}
						cell.appendChild(input);
						break;

					case 'enum':  // create a combo box
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
						$.each(pref.enumValues, function(enumvalue, enumdisplay) {
							var option = document.createElement('option');
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

					case 'set':  // create a set of check boxes
						// add label first of all
						cell.setAttribute('colspan', '2');
						label = document.createElement('label');  // not really necessary to use a label element here, but we do it for consistency of styling
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);

						var checkdiv = document.createElement('div');
						checkdiv.style.paddingLeft = '1em';
						var worker = function(itemkey, itemvalue) {
							var checklabel = document.createElement('label');
							checklabel.style.marginRight = '0.7em';
							checklabel.style.display = 'inline-block';
							var check = document.createElement('input');
							check.setAttribute('type', 'checkbox');
							check.setAttribute('id', pref.name + '_' + itemkey);
							check.setAttribute('name', pref.name + '_' + itemkey);
							if (gotPref && gotPref.indexOf(itemkey) !== -1) {
								check.setAttribute('checked', 'checked');
							}
							// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
							if (pref.name === 'unlinkNamespaces') {
								if (gotPref && gotPref.indexOf(parseInt(itemkey, 10)) !== -1) {
									check.setAttribute('checked', 'checked');
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
				cell.style.fontSize = '90%';

				cell.style.color = 'gray';
				if (pref.helptip) {
					// convert mentions of templates in the helptip to clickable links
					cell.innerHTML = pref.helptip.replace(/{{(.+?)}}/g,
						'{{<a href="' + mw.util.getUrl('Template:') + '$1" target="_blank">$1</a>}}');
				}
				// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
				if (pref.type !== 'customList') {
					var resetlink = document.createElement('a');
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

		var footerbox = document.createElement('div');
		footerbox.setAttribute('id', 'twinkle-config-buttonpane');
		footerbox.style.backgroundColor = '#BCCADF';
		footerbox.style.padding = '0.5em';
		var button = document.createElement('button');
		button.setAttribute('id', 'twinkle-config-submit');
		button.setAttribute('type', 'submit');
		button.appendChild(document.createTextNode('Opslaan'));
		footerbox.appendChild(button);
		var footerspan = document.createElement('span');
		footerspan.className = 'plainlinks';
		footerspan.style.marginLeft = '2.4em';
		footerspan.style.fontSize = '90%';
		var footera = document.createElement('a');
		footera.setAttribute('href', '#tw-reset-all');
		footera.setAttribute('id', 'twinkle-config-resetall');
		footera.addEventListener('click', Twinkle.config.resetAllPrefs, false);
		footera.appendChild(document.createTextNode('Herstel standaard'));
		footerspan.appendChild(footera);
		footerbox.appendChild(footerspan);
		contentform.appendChild(footerbox);

		// since all the section headers exist now, we can try going to the requested anchor
		if (window.location.hash) {
			var loc = window.location.hash;
			window.location.hash = '';
			window.location.hash = loc;
		}

	} else if (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user &&
			mw.config.get('wgTitle').indexOf(mw.config.get('wgUserName')) === 0 &&
			mw.config.get('wgPageName').slice(-3) === '.js') {

		var box = document.createElement('div');
		// Styled in twinkle.css
		box.setAttribute('id', 'twinkle-config-headerbox');

		var link,
			scriptPageName = mw.config.get('wgPageName').slice(mw.config.get('wgPageName').lastIndexOf('/') + 1,
				mw.config.get('wgPageName').lastIndexOf('.js'));

		if (scriptPageName === 'twinkleoptions') {
			// place "why not try the preference panel" notice
			box.setAttribute('class', 'config-twopt-box');

			if (mw.config.get('wgArticleId') > 0) {  // page exists
				box.appendChild(document.createTextNode('Deze pagina bevat je Twinkle instellingen. Je kunt ze het beste veranderen via het '));
			} else {  // page does not exist
				box.appendChild(document.createTextNode('Je kunt je Twinkle instellingen veranderen via het '));
			}
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':Twinkle/Preferences'));
			link.appendChild(document.createTextNode('Twinkle configuratiescherm'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('.'));
			$(box).insertAfter($('#contentSub'));

		} else if (['monobook', 'vector', 'cologneblue', 'modern', 'timeless', 'minerva', 'common'].indexOf(scriptPageName) !== -1) {
			// place "Looking for Twinkle options?" notice
			box.setAttribute('class', 'config-userskin-box');

			box.appendChild(document.createTextNode('Om je Twinkle instellingen vast te leggen, ga naar het '));
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':Twinkle/Preferences'));
			link.appendChild(document.createTextNode('Twinkle configuratiescherm'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('.'));
			$(box).insertAfter($('#contentSub'));
		}
	}
};

// custom list-related stuff

Twinkle.config.listDialog = {};

Twinkle.config.listDialog.addRow = function twinkleconfigListDialogAddRow($dlgtable, value, label) {
	var $contenttr, $valueInput, $labelInput;

	$dlgtable.append(
		$contenttr = $('<tr>').append(
			$('<td>').append(
				$('<button>')
					.attr('type', 'button')
					.on('click', function () {
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
	var $prefbutton = $(e.target);
	var curvalue = $prefbutton.data('value');
	var curpref = $prefbutton.data('pref');

	var dialog = new Morebits.simpleWindow(720, 400);
	dialog.setTitle(curpref.label);
	dialog.setScriptName('Twinkle configuratie');

	var $dlgtbody;

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
										.on('click', function () {
											Twinkle.config.listDialog.addRow($dlgtbody);
										})
								)
						)
					)
				),
			$('<button>')
				.text('Opslaan')
				.attr('type', 'submit') // so Morebits.simpleWindow puts the button in the button pane
				.on('click', function () {
					Twinkle.config.listDialog.save($prefbutton, $dlgtbody);
					dialog.close();
				}),
			$('<button>')
				.text('Reset')
				.attr('type', 'submit')
				.on('click', function () {
					Twinkle.config.listDialog.reset($prefbutton, $dlgtbody);
				}),
			$('<button>')
				.text('Annuleren')
				.attr('type', 'submit')
				.on('click', function () {
					dialog.close();
				})
		)[0]
	);

	// content rows
	var gotRow = false;
	$.each(curvalue, function(k, v) {
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
	var curpref = $button.data('pref');
	var oldvalue = $button.data('value');
	Twinkle.config.resetPref(curpref);

	// reset form
	$tbody.find('tr').slice(1).remove();  // all rows except the first (header) row
	// add the new values
	var curvalue = $button.data('value');
	$.each(curvalue, function(k, v) {
		Twinkle.config.listDialog.addRow($tbody, v.value, v.label);
	});

	// save the old value
	$button.data('value', oldvalue);
};

Twinkle.config.listDialog.save = function twinkleconfigListDialogSave($button, $tbody) {
	var result = [];
	var current = {};
	$tbody.find('input[type="text"]').each(function(inputkey, input) {
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
	var wantedpref = e.target.id.substring(21); // "twinkle-config-reset-" prefix is stripped

	// search tactics
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}

		var foundit = false;

		$(section.preferences).each(function(prefkey, pref) {
			if (pref.name !== wantedpref) {
				return true;  // continue
			}
			Twinkle.config.resetPref(pref);
			foundit = true;
			return false;  // break
		});

		if (foundit) {
			return false;  // break
		}
	});
	return false;  // stop link from scrolling page
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
			$.each(pref.setValues, function(itemkey) {
				if (document.getElementById(pref.name + '_' + itemkey)) {
					document.getElementById(pref.name + '_' + itemkey).checked = Twinkle.defaultConfig[pref.name].indexOf(itemkey) !== -1;
				}
			});
			break;

		case 'customList':
			$(document.getElementById(pref.name)).data('value', Twinkle.defaultConfig[pref.name]);
			break;

		default:
			alert('twinkleconfig: onbekend datatype voor voorkeur ' + pref.name);
			break;
	}
};

Twinkle.config.resetAllPrefs = function twinkleconfigResetAllPrefs() {
	// no confirmation message - the user can just refresh/close the page to abort
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}
		$(section.preferences).each(function(prefkey, pref) {
			if (!pref.adminOnly || Morebits.userIsSysop) {
				Twinkle.config.resetPref(pref);
			}
		});
		return true;
	});
	return false;  // stop link from scrolling page
};

Twinkle.config.save = function twinkleconfigSave(e) {
	Morebits.status.init(document.getElementById('twinkle-config-content'));

	var userjs = mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user] + ':' + mw.config.get('wgUserName') + '/twinkleoptions.js';
	var wikipedia_page = new Morebits.wiki.page(userjs, 'Voorkeuren opslaan naar ' + userjs);
	wikipedia_page.setCallbackParameters(e.target);
	wikipedia_page.load(Twinkle.config.writePrefs);

	return false;
};

Twinkle.config.writePrefs = function twinkleconfigWritePrefs(pageobj) {
	var form = pageobj.getCallbackParameters();

	// this is the object which gets serialized into JSON; only
	// preferences that this script knows about are kept
	var newConfig = {optionsVersion: 2.1};

	// a comparison function is needed later on
	// it is just enough for our purposes (i.e. comparing strings, numbers, booleans,
	// arrays of strings, and arrays of { value, label })
	// and it is not very robust: e.g. compare([2], ["2"]) === true, and
	// compare({}, {}) === false, but it's good enough for our purposes here
	var compare = function(a, b) {
		if (Array.isArray(a)) {
			if (a.length !== b.length) {
				return false;
			}
			var asort = a.sort(), bsort = b.sort();
			for (var i = 0; asort[i]; ++i) {
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

	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.adminOnly && !Morebits.userIsSysop) {
			return;  // i.e. "continue" in this context
		}

		// reach each of the preferences from the form
		$(section.preferences).each(function(prefkey, pref) {
			var userValue;  // = undefined

			// only read form values for those prefs that have them
			if (!pref.adminOnly || Morebits.userIsSysop) {
				if (!section.hidden) {
					switch (pref.type) {
						case 'boolean':  // read from the checkbox
							userValue = form[pref.name].checked;
							break;

						case 'string':  // read from the input box or combo box
						case 'enum':
							userValue = form[pref.name].value;
							break;

						case 'integer':  // read from the input box
							userValue = parseInt(form[pref.name].value, 10);
							if (isNaN(userValue)) {
								Morebits.status.warn('Opslaan', 'De waarde geselecteerd voor ' + pref.name + ' (' + pref.value + ') is ongeldig.  Het opslaan gaat door, maar de ongeldige instellingen worden overgeslagen.');
								userValue = null;
							}
							break;

						case 'set':  // read from the set of check boxes
							userValue = [];
							if (pref.setDisplayOrder) {
							// read only those keys specified in the display order
								$.each(pref.setDisplayOrder, function(itemkey, item) {
									if (form[pref.name + '_' + item].checked) {
										userValue.push(item);
									}
								});
							} else {
							// read all the keys in the list of values
								$.each(pref.setValues, function(itemkey) {
									if (form[pref.name + '_' + itemkey].checked) {
										userValue.push(itemkey);
									}
								});
							}
							break;

						case 'customList':  // read from the jQuery data stored on the button object
							userValue = $(form[pref.name]).data('value');
							break;

						default:
							alert('twinkleconfig: onbekend data type voor voorkeur ' + pref.name);
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

	var text =
		'// twinkleoptions.js: persoonlijk Twinkle voorkeurenbestand\n' +
		'//\n' +
		'// OPMERKING: De makkelijkste manier om je Twinkle voorkeuren aan te passen\n' +
		'// is via het Twinkle configuratiescherm, op [[' + Morebits.pageNameNorm + ']].\n' +
		'//\n' +
		'// Dit bestand is AUTOMATISCH AANGEMAAKT.  Iedere verandering die je maakt\n' +
		'// (buiten de JS-configuratieparameters in correct JavaScript) worden\n' +
		'// vernietigd de volgende keer dat je "opslaan" klikt in het Twinkle\n' +
		'// configuratiescherm.  Als je dit bestand aanpast zorg voor correcte JS.\n' +
		'// <no' + 'wiki>\n' +
		'\n' +
		'window.Twinkle.prefs = ';
	text += JSON.stringify(newConfig, null, 2);
	text +=
		';\n' +
		'\n' +
		'// </no' + 'wiki>\n' +
		'// Einde van twinkleoptions.js\n';

	pageobj.setPageText(text);
	pageobj.setEditSummary('Twinkle instellingen opslaan: automatische bewerking van [[:' + Morebits.pageNameNorm + ']]');
	pageobj.setChangeTags(Twinkle.changeTags);
	pageobj.setCreateOption('recreate');
	pageobj.save(Twinkle.config.saveSuccess);
};

Twinkle.config.saveSuccess = function twinkleconfigSaveSuccess(pageobj) {
	pageobj.getStatusElement().info('done');

	var noticebox = document.createElement('div');
	noticebox.className = 'successbox';
	noticebox.style.fontSize = '100%';
	noticebox.style.marginTop = '2em';
	noticebox.innerHTML = '<p><b>Je Twinkle voorkeuren zijn opgeslagen.</b></p><p>Mogelijk dien je <b>je browser cache te legen</b> (zie <a href="' + mw.util.getUrl('WP:BYPASS') + '" title="WP:BYPASS">WP:BYPASS</a> voor uitleg).</p>';
	Morebits.status.root.appendChild(noticebox);
	var noticeclear = document.createElement('br');
	noticeclear.style.clear = 'both';
	Morebits.status.root.appendChild(noticeclear);
};

Twinkle.addInitCallback(Twinkle.config.init);
})(jQuery);


// </nowiki>
