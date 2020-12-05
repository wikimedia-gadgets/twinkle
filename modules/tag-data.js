var redirectTagList = {
    'Grammar, punctuation, and spelling': {
        'Abbreviation': [
            { tag: 'R from acronym', description: 'redirect from an acronym (e.g. POTUS) to its expanded form' },
            { tag: 'R from initialism', description: 'redirect from an initialism (e.g. AGF) to its expanded form' },
            { tag: 'R from MathSciNet abbreviation', description: 'redirect from MathSciNet publication title abbreviation to the unabbreviated title' },
            { tag: 'R from NLM abbreviation', description: 'redirect from a NLM publication title abbreviation to the unabbreviated title' }
        ],
        'Capitalisation': [
            { tag: 'R from CamelCase', description: 'redirect from a CamelCase title' },
            { tag: 'R from other capitalisation', description: 'redirect from a title with another method of capitalisation' },
            { tag: 'R from miscapitalisation', description: 'redirect from a capitalisation error' }
        ],
        'Grammar & punctuation': [
            { tag: 'R from modification', description: 'redirect from a modification of the target\'s title, such as with words rearranged' },
            { tag: 'R from plural', description: 'redirect from a plural word to the singular equivalent' },
            { tag: 'R to plural', description: 'redirect from a singular noun to its plural form' }
        ],
        'Parts of speech': [
            { tag: 'R from verb', description: 'redirect from an English-language verb or verb phrase' },
            { tag: 'R from adjective', description: 'redirect from an adjective (word or phrase that describes a noun)' }
        ],
        'Spelling': [
            { tag: 'R from alternative spelling', description: 'redirect from a title with a different spelling' },
            { tag: 'R from ASCII-only', description: 'redirect from a title in only basic ASCII to the formal title, with differences that are not diacritical marks or ligatures' },
            { tag: 'R from diacritic', description: 'redirect from a page name that has diacritical marks (accents, umlauts, etc.)' },
            { tag: 'R to diacritic', description: 'redirect to the article title with diacritical marks (accents, umlauts, etc.)' },
            { tag: 'R from misspelling', description: 'redirect from a misspelling or typographical error' }
        ]
    },
    'Alternative names': {
        'General': [
            {
                tag: 'R from alternative language',
                description: 'redirect from or to a title in another language',
                subgroup: [
                    {
                        name: 'altLangFrom',
                        type: 'input',
                        label: 'From language (two-letter code): ',
                        tooltip: 'Enter the two-letter code of the language the redirect name is in; such as en for English, de for German'
                    },
                    {
                        name: 'altLangTo',
                        type: 'input',
                        label: 'To language (two-letter code): ',
                        tooltip: 'Enter the two-letter code of the language the target name is in; such as en for English, de for German'
                    },
                    {
                        name: 'altLangInfo',
                        type: 'div',
                        label: $.parseHTML('<p>For a list of language codes, see <a href="/wiki/Wp:Template_messages/Redirect_language_codes">Wikipedia:Template messages/Redirect language codes</a></p>')
                    }
                ]
            },
            { tag: 'R from alternative name', description: 'redirect from a title that is another name, a pseudonym, a nickname, or a synonym' },
            { tag: 'R from ambiguous sort name', description: 'redirect from an ambiguous sort name to a page or list that disambiguates it' },
            { tag: 'R from former name', description: 'redirect from a former name or working title' },
            { tag: 'R from historic name', description: 'redirect from a name with a significant historic past as a region, city, etc. no longer known by that name' },
            { tag: 'R from incomplete name', description: 'R from incomplete name' },
            { tag: 'R from incorrect name', description: 'redirect from an erroneus name that is unsuitable as a title' },
            { tag: 'R from less specific name', description: 'redirect from a less specific title to a more specific, less general one' },
            { tag: 'R from long name', description: 'redirect from a more complete title' },
            { tag: 'R from more specific name', description: 'redirect from a more specific title to a less specific, more general one' },
            { tag: 'R from short name', description: 'redirect from a title that is a shortened form of a person\'s full name, a book title, or other more complete title' },
            { tag: 'R from sort name', description: 'redirect from the target\'s sort name, such as beginning with their surname rather than given name' },
            { tag: 'R from synonym', description: 'redirect from a semantic synonym of the target page title' }
        ],
        'People': [
            { tag: 'R from birth name', description: 'redirect from a person\'s birth name to a more common name' },
            { tag: 'R from given name', description: 'redirect from a person\'s given name' },
            { tag: 'R from name with title', description: 'redirect from a person\'s name preceded or followed by a title to the name with no title or with the title in parentheses' },
            { tag: 'R from person', description: 'redirect from a person or persons to a related article' },
            { tag: 'R from personal name', description: 'redirect from an individual\'s personal name to an article titled with their professional or other better known moniker' },
            { tag: 'R from pseudonym', description: 'redirect from a pseudonym' },
            { tag: 'R from surname', description: 'redirect from a title that is a surname' }
        ],
        'Technical': [
            { tag: 'R from drug trade name', description: 'redirect from (or to) the trade name of a drug to (or from) the international nonproprietary name (INN)' },
            { tag: 'R from filename', description: 'redirect from a title that is a filename of the target' },
            { tag: 'R from molecular formula', description: 'redirect from a molecular/chemical formula to its technical or trivial name' },
            { tag: 'R from gene symbol', description: 'redirect from a Human Genome Organisation (HUGO) symbol for a gene to an article about the gene' }
        ],
        'Organisms': [
            { tag: 'R to scientific name', description: 'redirect from the common name to the scientific name' },
            { tag: 'R from scientific name', description: 'redirect from the scientific name to the common name' },
            { tag: 'R from alternative scientific name', description: 'redirect from an alternative scientific name to the accepted scientific name' },
            { tag: 'R from scientific abbreviation', description: 'redirect from a scientific abbreviation' },
            { tag: 'R to monotypic taxon', description: 'redirect from the only lower-ranking member of a monotypic taxon to its monotypic taxon' },
            { tag: 'R from monotypic taxon', description: 'redirect from a monotypic taxon to its only lower-ranking member' },
            { tag: 'R taxon with possibilities', description: 'redirect from a title related to a living organism that potentially could be expanded into an article' }
        ],
        'Geography': [
            { tag: 'R from name and country', description: 'redirect from the specific name to the briefer name' },
            { tag: 'R from more specific geographic name', description: 'redirect from a geographic location that includes extraneous identifiers such as the county or region of a city' }
        ]
    },
    'Navigation aids': {
        'Navigation': [
            { tag: 'R to anchor', description: 'redirect from a topic that does not have its own page to an anchored part of a page on the subject' },
            {
                tag: 'R avoided double redirect',
                description: 'redirect from an alternative title for another redirect',
                subgroup: {
                    name: 'doubleRedirectTarget',
                    type: 'input',
                    label: 'Redirect target name',
                    tooltip: 'Enter the page this redirect would target if the page wasn\'t also a redirect'
                }
            },
            { tag: 'R from file metadata link', description: 'redirect of a wikilink created from EXIF, XMP, or other information (i.e. the "metadata" section on some image description pages)' },
            { tag: 'R to list entry', description: 'redirect to a list which contains brief descriptions of subjects not notable enough to have separate articles' },
            { tag: 'R mentioned in hatnote', description: 'redirect from a title that is mentioned in a hatnote at the redirect target' },
            { tag: 'R to section', description: 'similar to {{R to list entry}}, but when list is organized in sections, such as list of characters in a fictional universe' },
            { tag: 'R from shortcut', description: 'redirect from a Wikipedia shortcut' },
            { tag: 'R from template shortcut', description: 'redirect from a shortcut page name in any namespace to a page in template namespace' }
        ],
        'Disambiguation': [
            { tag: 'R from ambiguous term', description: 'redirect from an ambiguous page name to a page that disambiguates it. This template should never appear on a page that has "(disambiguation)" in its title, use R to disambiguation page instead' },
            { tag: 'R to disambiguation page', description: 'redirect to a disambiguation page' },
            { tag: 'R from incomplete disambiguation', description: 'redirect from a page name that is too ambiguous to be the title of an article and should redirect to an appropriate disambiguation page' },
            { tag: 'R from incorrect disambiguation', description: 'redirect from a page name with incorrect disambiguation due to an error or previous editorial misconception' },
            { tag: 'R from other disambiguation', description: 'redirect from a page name with an alternative disambiguation qualifier' },
            { tag: 'R from unnecessary disambiguation', description: 'redirect from a page name that has an unneeded disambiguation qualifier' }
        ],
        'Merge, duplicate & move': [
            { tag: 'R from duplicated article', description: 'redirect to a similar article in order to preserve its edit history' },
            { tag: 'R with history', description: 'redirect from a page containing substantive page history, kept to preserve content and attributions' },
            { tag: 'R from move', description: 'redirect from a page that has been moved/renamed' },
            { tag: 'R from merge', description: 'redirect from a merged page in order to preserve its edit history' }
        ],
        'Namespace': [
            { tag: 'R from remote talk page', description: 'redirect from a talk page in any talk namespace to a corresponding page that is more heavily watched' },
            { tag: 'R to category namespace', description: 'redirect from a page outside the category namespace to a category page' },
            { tag: 'R to help namespace', description: 'redirect from any page inside or outside of help namespace to a page in that namespace' },
            { tag: 'R to main namespace', description: 'redirect from a page outside the main-article namespace to an article in mainspace' },
            { tag: 'R to portal namespace', description: 'redirect from any page inside or outside of portal space to a page in that namespace' },
            { tag: 'R to project namespace', description: 'redirect from any page inside or outside of project (Wikipedia: or WP:) space to any page in the project namespace' },
            { tag: 'R to user namespace', description: 'redirect from a page outside the user namespace to a user page (not to a user talk page)' }
        ]
    },
    'Media': {
        'General': [
            { tag: 'R from book', description: 'redirect from a book title to a more general, relevant article' },
            { tag: 'R from album', description: 'redirect from an album to a related topic such as the recording artist or a list of albums' },
            { tag: 'R from song', description: 'redirect from a song title to a more general, relevant article' },
            { tag: 'R from television episode', description: 'redirect from a television episode title to a related work or lists of episodes' }
        ],
        'Fiction': [
            { tag: 'R from fictional character', description: 'redirect from a fictional character to a related fictional work or list of characters' },
            { tag: 'R from fictional element', description: 'redirect from a fictional element (such as an object or concept) to a related fictional work or list of similar elements' },
            { tag: 'R from fictional location', description: 'redirect from a fictional location or setting to a related fictional work or list of places' }
        ]
    },
    'Miscellaneous': {
        'Related information': [
            { tag: 'R to article without mention', description: 'redirect to an article without any mention of the redirected word or phrase' },
            { tag: 'R to decade', description: 'redirect from a year to the decade article' },
            { tag: 'R from domain name', description: 'redirect from a domain name to an article about a website' },
            { tag: 'R from phrase', description: 'redirect from a phrase to a more general relevant article covering the topic' },
            { tag: 'R from list topic', description: 'redirect from the topic of a list to the equivalent list' },
            { tag: 'R from member', description: 'redirect from a member of a group to a related topic such as the group or organization' },
            { tag: 'R to related topic', description: 'redirect to an article about a similar topic' },
            { tag: 'R from related word', description: 'redirect from a related word' },
            { tag: 'R from school', description: 'redirect from a school article that had very little information' },
            { tag: 'R from subtopic', description: 'redirect from a title that is a subtopic of the target article' },
            { tag: 'R to subtopic', description: 'redirect to a subtopic of the redirect\'s title' },
            { tag: 'R from Unicode character', description: 'redirect from a single Unicode character to an article or Wikipedia project page that infers meaning for the symbol' },
            { tag: 'R from Unicode code', description: 'redirect from a Unicode code point to an article about the character it represents' }
        ],
        'With possibilities': [
            { tag: 'R with possibilities', description: 'redirect from a specific title to a more general, less detailed article (something which can and should be expanded)' }
        ],
        'ISO codes': [
            { tag: 'R from ISO 4 abbreviation', description: 'redirect from an ISO 4 publication title abbreviation to the unabbreviated title' },
            { tag: 'R from ISO 639 code', description: 'redirect from a title that is an ISO 639 language code to an article about the language' }
        ],
        'Printworthiness': [
            { tag: 'R printworthy', description: 'redirect from a title that would be helpful in a printed or CD/DVD version of Wikipedia' },
            { tag: 'R unprintworthy', description: 'redirect from a title that would NOT be helpful in a printed or CD/DVD version of Wikipedia' }
        ]
    }
};
var fileTagList = {
    'License and sourcing problem tags': [
        { tag: 'Better source requested', description: 'source info consists of bare image URL/generic base URL only' },
        { tag: 'Non-free reduce', description: 'non-low-resolution fair use image (or too-long audio clip, etc)' },
        { tag: 'Orphaned non-free revisions', description: 'fair use media with old revisions that need to be deleted' }
    ],
    'Wikimedia Commons-related tags': [
        { tag: 'Copy to Commons', description: 'free media that should be copied to Commons' },
        { tag: 'Do not move to Commons', description: 'file not suitable for moving to Commons',
            subgroup: [
                {
                    type: 'input',
                    name: 'DoNotMoveToCommons_reason',
                    label: 'Reason: ',
                    tooltip: 'Enter the reason why this image should not be moved to Commons (required). If the file is PD in the US but not in country of origin, enter "US only"',
                    required: true
                },
                {
                    type: 'input',
                    name: 'DoNotMoveToCommons_expiry',
                    label: 'Expiration year: ',
                    tooltip: 'If this file can be moved to Commons beginning in a certain year, you can enter it here (optional).'
                }
            ]
        },
        { tag: 'Keep local', description: 'request to keep local copy of a Commons file',
            subgroup: {
                type: 'input',
                name: 'keeplocalName',
                label: 'Commons image name if different: ',
                tooltip: 'Name of the image on Commons (if different from local name), excluding the File: prefix:'
            }
        },
        { tag: 'Now Commons', description: 'file has been copied to Commons',
            subgroup: {
                type: 'input',
                name: 'nowcommonsName',
                label: 'Commons image name if different: ',
                tooltip: 'Name of the image on Commons (if different from local name), excluding the File: prefix:'
            }
        }
    ],
    'Cleanup tags': [
        { tag: 'Artifacts', description: 'PNG contains residual compression artifacts' },
        { tag: 'Bad font', description: 'SVG uses fonts not available on the thumbnail server' },
        { tag: 'Bad format', description: 'PDF/DOC/... file should be converted to a more useful format' },
        { tag: 'Bad GIF', description: 'GIF that should be PNG, JPEG, or SVG' },
        { tag: 'Bad JPEG', description: 'JPEG that should be PNG or SVG' },
        { tag: 'Bad SVG', description: 'SVG containing raster grahpics' },
        { tag: 'Bad trace', description: 'auto-traced SVG requiring cleanup' },
        {
            tag: 'Cleanup image', description: 'general cleanup',
            subgroup: {
                type: 'input',
                name: 'cleanupimageReason',
                label: 'Reason: ',
                tooltip: 'Enter the reason for cleanup (required)',
                required: true
            }
        },
        { tag: 'ClearType', description: 'image (not screenshot) with ClearType anti-aliasing' },
        { tag: 'Imagewatermark', description: 'image contains visible or invisible watermarking' },
        { tag: 'NoCoins', description: 'image using coins to indicate scale' },
        { tag: 'Overcompressed JPEG', description: 'JPEG with high levels of artifacts' },
        { tag: 'Opaque', description: 'opaque background should be transparent' },
        { tag: 'Remove border', description: 'unneeded border, white space, etc.' },
        { tag: 'Rename media', description: 'file should be renamed according to the criteria at [[WP:FMV]]',
            subgroup: [
                {
                    type: 'input',
                    name: 'renamemediaNewname',
                    label: 'New name: ',
                    tooltip: 'Enter the new name for the image (optional)'
                },
                {
                    type: 'input',
                    name: 'renamemediaReason',
                    label: 'Reason: ',
                    tooltip: 'Enter the reason for the rename (optional)'
                }
            ]
        },
        { tag: 'Should be PNG', description: 'GIF or JPEG should be lossless' },
        { tag: 'Should be SVG', description: 'PNG, GIF or JPEG should be vector graphics',
            subgroup: {
                name: 'svgCategory',
                type: 'select',
                list: [
                    { label: '{{Should be SVG|other}}', value: 'other' },
                    { label: '{{Should be SVG|alphabet}}: character images, font examples, etc.', value: 'alphabet' },
                    { label: '{{Should be SVG|chemical}}: chemical diagrams, etc.', value: 'chemical' },
                    { label: '{{Should be SVG|circuit}}: electronic circuit diagrams, etc.', value: 'circuit' },
                    { label: '{{Should be SVG|coat of arms}}: coats of arms', value: 'coat of arms' },
                    { label: '{{Should be SVG|diagram}}: diagrams that do not fit any other subcategory', value: 'diagram' },
                    { label: '{{Should be SVG|emblem}}: emblems, free/libre logos, insignias, etc.', value: 'emblem' },
                    { label: '{{Should be SVG|fair use}}: fair-use images, fair-use logos', value: 'fair use' },
                    { label: '{{Should be SVG|flag}}: flags', value: 'flag' },
                    { label: '{{Should be SVG|graph}}: visual plots of data', value: 'graph' },
                    { label: '{{Should be SVG|logo}}: logos', value: 'logo' },
                    { label: '{{Should be SVG|map}}: maps', value: 'map' },
                    { label: '{{Should be SVG|music}}: musical scales, notes, etc.', value: 'music' },
                    { label: '{{Should be SVG|physical}}: "realistic" images of physical objects, people, etc.', value: 'physical' },
                    { label: '{{Should be SVG|symbol}}: miscellaneous symbols, icons, etc.', value: 'symbol' }
                ]
            }
        },
        { tag: 'Should be text', description: 'image should be represented as text, tables, or math markup' }
    ],
    'Image quality tags': [
        { tag: 'Image hoax', description: 'Image may be manipulated or constitute a hoax' },
        { tag: 'Image-blownout' },
        { tag: 'Image-out-of-focus' },
        { tag: 'Image-Poor-Quality',
            subgroup: {
                type: 'input',
                name: 'ImagePoorQualityReason',
                label: 'Reason: ',
                tooltip: 'Enter the reason why this image is so bad (required)',
                required: true
            }
        },
        { tag: 'Image-underexposure' },
        { tag: 'Low quality chem', description: 'disputed chemical structures',
            subgroup: {
                type: 'input',
                name: 'lowQualityChemReason',
                label: 'Reason: ',
                tooltip: 'Enter the reason why the diagram is disputed (required)',
                required: true
            }
        }
    ],
    'Replacement tags': [
        { tag: 'Obsolete', description: 'improved version available' },
        { tag: 'PNG version available' },
        { tag: 'Vector version available' }
    ]
};
fileTagList['Replacement tags'].forEach(function (el) {
    el.subgroup = {
        type: 'input',
        label: 'Replacement file: ',
        tooltip: 'Enter the name of the file which replaces this one (required)',
        name: el.tag.replace(/ /g, '_') + 'File',
        required: true
    };
});
window.fileTagList = fileTagList;
window.redirectTagList = redirectTagList;
