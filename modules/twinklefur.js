/*
 ****************************************
 *** twinklefur.js: FUR module (formerly FurMe)
 ****************************************
 * Mode of invocation:     Tab ("FUR")
 * Active on:              File pages with a corresponding file which is local (not on Commons)
 * Config directives in:   TwinkleConfig
 */

// This is to be moved into twinkle.header.js, and added to twinkleconfig.js.
// I don't want headaches with merging, so I'll fix this just before I merge the branch.

Twinkle.defaultConfig.twinkle.furWatchEdits = false;
Twinkle.defaultConfig.twinkle.furOpenArticle = 'none';
Twinkle.defaultConfig.twinkle.furOpenAllArticles = false;
Twinkle.defaultConfig.twinkle.furWindowHeight = 680;
Twinkle.defaultConfig.twinkle.furCleanAmazonURLs = true;
Twinkle.defaultConfig.twinkle.furLinkFreeLogo = false;
Twinkle.defaultConfig.twinkle.furLinkImageTags = true;

// For compatibility with wikEd
// XXX don't know why this is needed, so commenting out
//if (typeof(window.wikEdProgramVersion) != 'undefined' && readCookie('wikEdDisabled') != '1' && wgAction == "edit")
//{
//	var wikEdSetupHook = wikEdSetupHook || [];
//	wikEdSetupHook.push(furme);
//}
//else
//{
//	addOnloadHook(furme);
//}

Twinkle.fur = function furme() {

	if( QueryString.exists( 'furme' ) ) {  // was: wgNamespaceNumber === 0 || wgNamespaceNumber === 2
		Twinkle.fur.imageRemover();
	}

	if( wgNamespaceNumber === 6 ) {
		$(twAddPortletLink( "#", "FUR", "furme-fur", "Apply fair-use rationale to image", "")).click(function() {
			Twinkle.fur.refreshSeedValues();
			Twinkle.fur.callback();
		});
	}
}

Twinkle.fur.seedValues = {
	'name': '',
	'artist': '',
	'label': '',
	'infobox': false,
	'title': '',
	'url': '',
	'resolution': '',
	'author': '',
	'publisher': '',
	'year': '',
	'coverArtist': '',
	'distributor': '',
	'infoboxAlbum': false,
	'infoboxSingle': false
};

Twinkle.fur.refreshSeedValues = function furmeSeedValues(titleSeed) {
	var urlSeedTemp = '';

	// see if there is only one article to which the image links

	if (!titleSeed)
	{
		var linkList = document.getElementById('linkstoimage');
		while (linkList && (!linkList.tagName || linkList.tagName.toLowerCase() !== "ul")) {
			linkList = linkList.nextSibling;
		}
		if (linkList) {
			var pageLinks = linkList.getElementsByTagName("a");
			if (pageLinks.length === 1) {
				Twinkle.fur.seedValues.title = pageLinks[0].getAttribute("title");
			}
		}
	}
	else
	{
		Twinkle.fur.seedValues.title = titleSeed;
	}

	// see if there is only one external URL (assumed to be source)

	var imgDescription = [$(".fullMedia")[0].nextSibling];
	do {
		imgDescription.push(imgDescription[imgDescription.length - 1].nextSibling);
	} while (imgDescription[imgDescription.length - 1].nextSibling.id !== "filehistory");

	var regExSkipHyperlink = /(javascript\:|wikimedia\.org|wikipedia\.org)/;
	var $linkList = $(imgDescription).find("a");
	var licenseHrefs = [];
	if (document.getElementById('imageLicense')) {
		var licenseLinkList = document.getElementById('imageLicense').getElementsByTagName("a");
		$.each(licenseLinkList, function(k, link) {
			licenseHrefs.push(link.href);
		});
	}

	var linkUrl;
	$linkList.each(function(k, link) {
		if (link.href && !regExSkipHyperlink.test(link.href) &&
				link.href.length && licenseHrefs.indexOf(link.href) === -1) { // Ignore internal links and license links
			linkUrl = link.href;
			return false;  // break
		}
	});

	if (linkUrl) {
		seedValues.url = linkUrl;
	}
	// Attempt to find incomplete url
	else
	{
		var regExFindURL = /[\s\W]www\.([^<>\s]+?)\.(com|gov|edu|cc|org|net|uk|eu|ca|cn|tv|fm|pl|nz)[^\s"<>]*(?=\b[\s\W])/ig;
		var pageText = document.getElementById('bodyContent').innerHTML;
		var findURL = pageText.match(regExFindURL);

		if (findURL) {
			seedValues.url = 'http://' + findURL[0].trimPunctuation().trim().toLowerCase();
		}
		else
		{
			//regExFindURL = /[\s\W]([^<>\s"]+?)\.(com|gov|edu|cc|org|net|uk|eu|ca|cn|tv|fm|pl|nz)[^\s"<>]*(?=\b[\s<\.\?\/])/ig;
			regExFindURL = /[\s\W]([^<>\s"]+?)\.(com|gov|edu|cc|org|net|uk|eu|ca|cn|tv|fm|pl|nz)[^\s"<>]*(?=\b[\s\W])/ig;
			findURL = pageText.match(regExFindURL);

			if (findURL) {
				for( var i = 0; i < findURL.length; ++i ) {
					if (findURL[i].search('http://') === -1 && findURL[i].search(/\/w\/index\.php\?title=/) === -1 && !seedValues.url)
					{
						// Ignore this common one in EXIF data
						if (findURL[i].trimPunctuation().trim().toLowerCase() !== 'paint.net')
							Twinkle.fur.seedValues.url = 'http://www.' + findURL[i].trimPunctuation().trim().toLowerCase();
					}
				}
			}
		}
	}

	// clean Amazon URLs

	if (FurMeConfig.cleanAmazonURLs) {
		if (Twinkle.fur.seedValues.url.search(/amazon\./) != -1) {
			Twinkle.fur.seedValues.url = Twinkle.fur.seedValues.url.cleanAmazonURL();
		}
	}

	// see if the image is <301px wide/tall (fair use standard)

	if (document.getElementById('file').getElementsByTagName("img")[0].width < 301 ||
		document.getElementById('file').getElementsByTagName("img")[0].height < 301) {
		Twinkle.fur.seedValues.resolution = 'Yes';
	}

	// fill in parameters from infobox on article

	if (Twinkle.fur.seedValues.title.length > 0)
	{
		var wppage = new Wikipedia.page(Twinkle.fur.seedValues.title, "Getting infobox data");
		wppage.setFollowRedirect(true);
		wppage.load(function(pageobj) {
			if (!pageobj.exists()) {
				pageobj.getStatusElement().warn("Article does not exist");
				return;
			}
			var articleText = pageobj.getPageText();
			try {
				Twinkle.fur.seedValues.artist = articleText.match(/Artist\s*=\s*(.*)\s*\|/i)[1].rtrimPipe();
				Twinkle.fur.seedValues.artist = Twinkle.fur.seedValues.artist.replace(/\[*(Various Artists|Various|Multiple|Multiple Artists|N\/A)\]*/i, '');
			} catch(err) {}
			try { Twinkle.fur.seedValues.author = articleText.match(/Author\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
			try { Twinkle.fur.seedValues.coverArtist = articleText.match(/Cover_artist\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
			try {
				Twinkle.fur.seedValues.name = articleText.match(/Name\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() ;
				Twinkle.fur.seedValues.name = Twinkle.fur.seedValues.name.replace(/(<br>|<br\/>|<br \/>)/i, ' ');
			} catch(err) {}
			try { Twinkle.fur.seedValues.publisher = articleText.match(/Publisher\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
			try {
				Twinkle.fur.seedValues.year = articleText.match(/Release_date\s*=\s*(.*)\s*\|/i)[1];
				Twinkle.fur.seedValues.year = Twinkle.fur.seedValues.year.match(/([1-9][0-9]{3})/ig);
			}
			catch(err) {}
			try
			{
				Twinkle.fur.seedValues.label = articleText.match(/Label\s*=\s*(.*)\s*\|/i)[1].rtrimPipe();
				Twinkle.fur.seedValues.label = Twinkle.fur.seedValues.label.replace(/\s*<(small)>(.*?)<\/\1>/ig, '');
				Twinkle.fur.seedValues.label = Twinkle.fur.seedValues.label.replace(/\s*<br\s*\/*>/ig, ' / ');
				Twinkle.fur.seedValues.label = Twinkle.fur.seedValues.label.replace(/\s*(\(US\)|\(UK\)|\(U\.S\.\)|\(U\.K\.\))\s*/ig, '');
				Twinkle.fur.seedValues.label = Twinkle.fur.seedValues.label.replace(/\s*\{\{flag.*}}\s*/ig, '');
				Twinkle.fur.seedValues.label = Twinkle.fur.seedValues.label.replace(/\s*\|\s*Producer\s*=\s*.*/ig, '');
			}
			catch(err) {}
			try { Twinkle.fur.seedValues.distributor = articleText.match(/Distributor\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
			try { var infoboxType = articleText.match(/\{\{Infobox\s?([^\s\|]+)/i)[1].toLowerCase() } catch(err) {}
			if (infoboxType == '' || infoboxType == 'undefined' || null == infoboxType)
				try { var infoboxType = articleText.match(/\{\{([^\s]+)\s?Infobox\s*/i)[1].toLowerCase() } catch(err) {}

			if (infoboxType == 'album' || infoboxType == 'albums')
				Twinkle.fur.seedValues.infoboxAlbum = true;
			else if (infoboxType == 'single' || infoboxType == 'singles')
				Twinkle.fur.seedValues.infoboxSingle = true;

			// Check if image is used in infobox
			var infoboxImages = articleText.match(/(Cover|logo|logofile|station_logo|company_logo|image|image_name)\s*=\s*(.*)\s*[\|\}]/gi);

			if (infoboxImages != null)
			{
				for (var i = 0; i < infoboxImages.length; i++)
				{
					infoboxImages[i] = decodeURIComponent(infoboxImages[i]);
					if (infoboxImages[i].toLowerCase().replace(/_/gi, ' ').search(wgTitle.replace(/(\(|\)|\^|\$|\.|\{|\?|\*|\+|\|)/gi, "\\$1").toLowerCase()) != -1)
						Twinkle.fur.seedValues.infobox = true;
				}
			}
		});

	// optionally, if not in infobox, open the article in a new window/tab/etc.
	// or, open all articles

	if (!Twinkle.fur.seedValues.infobox && FurMeConfig.openLinkedArticles && (Twinkle.fur.seedValues.title.length > 0 || FurMeConfig.openAllArticles) )
	{
		var maxArticlesToOpen = FurMeConfig.openAllArticles ? 10 : 1;

		if (pageLinks) {
			for (var i = 0; i < Math.min(maxArticlesToOpen, pageLinks.length); i++)
			{
				var url = wgServer + wgArticlePath.replace(/\$1/, pageLinks[i].getAttribute('title')) + '?twinkleImageRemover=true&image=' + wgPageName.stripslashes();

				switch( FurMeConfig.openArticleMode )
				{
					case 'tab':
						window.open( url, '_tab' + i );
						break;
					case 'blank':
						window.open( url, '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
						break;
					case 'window':
						window.open( url, 'furmearticlewindow', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
						break;
					default:
						break;
				}
			}
		}
	}
}

Twinkle.fur.cleanupFilePage = function twinklefurCleanupFilePage(text, newSummary, newLicense) {
	// find the summary header, make sure to be below it (place summary header if not there)
	var regExFindSummary = /==\s*[Ss]ummary\s*==\s*/;
	if (text.search(regExFindSummary) === -1) {
		text = "== Summary ==\n" + text;
	}

	if (newSummary) {
		text = text.replace(regExFindSummary, "== Summary ==\n" + newSummary);
	}
	
	// get rid of disputed templates (where the problem should now be corrected)
	
	var regExFindNoSource = /\{\{(Di-no source|No source|Unspecified|Unknownsource|Fairuseunknownsource|Fuus|Nosource|No source since|No source notified|No info|Nosources|Di-no-source)(.*)\}\}\n*/i;
	var regExFindDisputed = /\{\{(Di-disputed fair use rationale|Di-disputed rationale|Improve rationale|Di-missing article links)(.*)\}\}\n*/i;
	var regExFindNoRationale = /\{\{(Di-no fair use rationale|No rationale|Fairuse rationale needed|Fu-ra-ne|Norat|Norationale|Di-no rationale)(.*)\}\}\n*/i;
	var regExFindMissingArticleLinks = /\s*\{\{(Di-missing article links)[^\}]+?\}\}\s*/i;  // XXX does this template still exist?
	
	if (text.search(regExFindNoSource) !== -1) {
		Status.info("Info", "Removing {{di-no source}} or equivalent template that was found on page");
		text = text.replace(regExFindNoSource, '');
	}
	if (text.search(regExFindDisputed) !== -1) {
		Status.info("Info", "Removing {{di-disputed fair use rationale}} or equivalent template that was found on page");
		text = text.replace(regExFindDisputed, '');
	}
	if (text.search(regExFindNoRationale) !== -1) {
		Status.info("Info", "Removing {{di-no fair use rationale}} or equivalent template that was found on page");
		text = text.replace(regExFindNoRationale, '');
	}
	if (text.search(regExFindMissingArticleLinks) !== -1) {
		Status.info("Info", "Removing {{di-missing article links}} or equivalent template that was found on page");
		text = text.replace(regExFindMissingArticleLinks, '');
	}
	
	// get rid of disputed image categories (present only sometimes)
	
	var regExFindDisputedCategory = /(\\,)*[[Category:Disputed non-free images(.*)]](\n)*/i;
	text = text.replace(regExFindDisputedCategory, '');
	
	// add in == Licensing == header if not there
	
	var regExFindLicenseTemplate = /\n*{{\s*(Template:)?(Non-free|PD|CC|GFDL|GPL|Wikipedia-screenshot)([^}]*)}}\s*/gi;

	var regExFindLicensing = /\s*==\s*[Ll]icensing[:]*\s*==\s*/;
	if (text.search(regExFindLicensing) === -1) {
		if (newLicense && text.search(regExFindLicenseTemplate) === -1) {
			// assuming no license template present, adding header
			text += "\n\n== Licensing ==\n";
		} else {
			text = text.replace(regExFindLicenseTemplate, "\n\n== Licensing ==\n{{$2$3}}");
		}
	} else {
		text = text.replace(regExFindLicensing, "\n\n== Licensing ==\n");
	}
	
	if (newLicense) {
		// Temporarily rename tags beginning with "Non-free" that should not be removed
		var tagsNoReplace = 'Non-free use rationale|Non-free image data|Non-free image rationale|Non-free media rationale|Non-free reduced|Non-free fair use rationale';
		var regExFindTagsNoReplace = new RegExp("{{\\s*(Template:)*(" + tagsNoReplace + ")", "gi");
		text = text.replace(regExFindTagsNoReplace, '{{%%$2%%');

		// Remove all licenses
		text = text.replace(regExFindLicenseTemplate, '');

		// Rename tags back
		regExFindTagsNoReplace = new RegExp("{{%%(" + tagsNoReplace + ")%%", "gi");
		text = text.replace(regExFindTagsNoReplace, "{{$1");
		
		text = text.replace(regExFindLicensing, "\n\n== Licensing ==\n{{" + newLicense + "}}\n");
	} 

	return text;
};

Twinkle.fur.callback = function twinklefurCallback() {
	var dialog = new SimpleWindow( 600, Twinkle.getPref('furWindowHeight') );
	dialog.setTitle( "Change file license/FUR" );
	dialog.setScriptName( "Twinkle" );
	dialog.addFooterLink( "Twinkle help", "WP:TW/DOC#fur" );

	var thispage = new Wikipedia.page( wgPageName, 'Fetching page wikitext' );
	thispage.setCallbackParameters({ 'dialog': dialog });
	thispage.load( Twinkle.fur.callbacks.displayForm );

	var root = document.createElement( 'div' );
	root.style.padding = '15px';  // just so it doesn't look broken
	Status.init( root );
	thispage.statelem.status( "loading..." );
	dialog.setContent( root );
	dialog.display();
};

Twinkle.fur.pageActions = [];   // { type: 'add'|'remove', what: 'text'|'template'|'fur'|'license', item: <line of text>/<template name to remove>/<template code to add> }

Twinkle.fur.callbacks = {};

Twinkle.fur.callbacks.displayForm = function furmeCallback(pageobj) {
	var defaultGeneric = true;
	var defaultAlbumCover = false;
	var defaultBook = false;
	var defaultLogo = false;
	var defaultFilm = false;
	var defaultIndex = 0;
	
	var text = pageobj.getPageText();

	// first of all, figure out what is on the page
	var textForParsing = text.replace("\r", "\n").replace("}}", "}}\n");
	var pageitems = [];
	var insideTemplate, gotSummaryHeader, gotLicenseHeader;
	$.each(textForParsing.split("\n"), function(k, line) {
		if (/^\s*$/.test(line)) {
			return true;
		}
		if (insideTemplate) {
			if (line.indexOf("}}") !== -1) {
				insideTemplate = false;
			}
			return true;
		}
		var templateregex = /\s*{{\s*([^\|}]+)/;  // /\s*{{\s*(([^\|\}]+)\s*(\|(?:{{[^{}]*}}|[^{}])*)?)}}\s*/gi;
		var templatematch = templateregex.exec(line);
		if (templatematch) {
			var templatename = templatematch[1].toLowerCase();
			if (templatename.indexOf(" fur") !== -1) {
				pageitems.push({ type: "fur", code: templatematch[1] });
			} else if (templatename.indexOf("non-free") !== -1 && 
					templatename.indexOf("non-free image data") === -1 &&
					templatename.indexOf("non-free media data") === -1) {
				pageitems.push({ type: "nonfree", code: templatematch[1] });
			} else {
				pageitems.push({ type: "template", code: templatematch[1] });
			}
			if (line.indexOf("}}") !== -1) {  // XXX huge fail with nested templates...
				insideTemplate = true;
			}
		} else if (/^\s*==\s*[Ss]ummary\s*==\s*$/.test(line)) {
			pageitems.push({ type: "summaryHeader", code: "== Summary ==" });
			gotSummaryHeader = true;
		} else if (/^\s*==\s*[Ll]icensing[:]*\s*==\s*$/.test(line)) {
			pageitems.push({ type: "licenseHeader", code: "== Summary ==" });
			gotLicenseHeader = true;
		} else {
			pageitems.push({ type: "other", code: line });
		}
		return true;
	});

	var i;
	if (!gotSummaryHeader) {
		i = 0;
		while (pageitems[i] && pageitems[i].type === "template") {  // assuming that the templates are maintenance tags
			i++;
		}
		if (i === 0) {
			pageitems = [{ type: "summaryHeader", code: "== Summary ==" }].concat(pageitems);
		} else {
			pageitems = pageitems.slice(0, i).concat({ type: "summaryHeader", code: "== Summary ==" }).concat(pageitems.slice(i));
		}
	}
	if (!gotLicenseHeader) {
		var foundSummary = false;
		i = -1;
		// looking for the last template we can find
		$.each(pageitems, function(k, item) {
			// never put licensing header before summary header
			if (!foundSummary) {
				if (item.type !== "summaryHeader") {
					return;
				} else {
					foundSummary = true;
					return;
				}
			}
			if (item.type === "nonfree" || item.type === "template") {
				i = k;
			}
		});
		if (i === -1) {
			// assume no licensing info whatsoever, so adding licensing header at bottom
			pageitems.push({ type: "licenseHeader", code: "== Licensing ==" });
		} else {
			pageitems = pageitems.slice(0, i).concat({ type: "licenseHeader", code: "== Licensing ==" }).concat(pageitems.slice(i));
		}
	}
	
	var params = pageobj.getCallbackParameters();
	var dialog = params.dialog;

	var dialogcontent = document.createElement("div");
	
	var table = document.createElement("table");
	table.className = "wikitable";
	var rowcount = 0;
	$.each(pageitems, function(k, item) {
		rowcount++;
		var itemtr = document.createElement("tr");
		itemtr.id = "twinklefur-row-" + rowcount;
		var td = document.createElement("td");
		td.style.width = "85%";
		if (["fur", "nonfree", "template"].indexOf(item.type) !== -1) {
			td.style.fontWeight = "bold";
		}
		td.textContent = (item.code.length > 120 ? (item.code.substring(0, 120) + "...") : item.code);
		itemtr.appendChild(td);
		td = document.createElement("td");
		td.textContent = "Delete";
		itemtr.appendChild(td);
		$(td).click(function() {
			$(itemtr).remove();
			$(addtr).remove();
			Twinkle.fur.pageActions.push({ 
				type: 'remove',
				what: (td.style.fontWeight === "bold" ? "template" : "text"),
				item: item.code
			});
		});
	});

	var button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addInformation);
	button.textContent = "Add {{Information}}";

	button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addImageData);
	button.textContent = "Add {{Non-free image data}}";

	button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addLicense);
	button.textContent = "Add license tag";

	button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addFur);
	button.textContent = "Add fair use rationale";

	button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addRestriction);
	button.textContent = "Add restriction tag";

	dialog.setContent( dialogcontent );
	dialog.display();
};

Twinkle.fur.freeLicenses = [
	'Attribution',
	'Cc-by',
	'Cc-by-2.0',
	'Cc-by-3.0',
	'Cc-by-sa',
	'Cc-by-sa-2.0',
	'Cc-by-sa-3.0',
	'Cc-sa',
	'Free screenshot',
	'GFDL-self',
	'GFDL-presumed',
	'GPL',
	'Money-US',
	'PD-art',
	'PD-art-life-70',
	'PD-art-US',
	'PD-Australia',
	'PD-author',
	'PD-because',
	'PD-BritishGov',
	'PD-Canada',
	'PD-font',
	'PD-ineligible',
	'PD-Italy',
	'PD-link',
	'PD-old',
	'PD-old-50',
	'PD-old-100',
	'PD-release',
	'PD-Russia-2008',
	'PD-shape',
	'PD-self',
	'PD-text',
	'PD-US',
	'PD-US-1923-abroad',
	'PD-US-patent',
	'PD-USGov',
	'PD-USGov-CIA',
	'PD-USGov-Congress',
	'PD-USGov-Congress-Bio',
	'PD-USGov-DOC-Census',
	'PD-USGov-DOC-NOAA',
	'PD-USGov-DOJ',
	'PD-USGov-Interior-NPS',
	'PD-USGov-Interior-USGS',
	'PD-USGov-Military',
	'PD-USGov-Military-Air Force',
	'PD-USGov-Military-Army',
	'PD-USGov-Military-Marines',
	'PD-USGov-Military-Navy',
	'PD-USGov-NASA',
	'PD-USGov-USDA',
	'PD-USGov-USDA-FS',
	'PD-user',
	'Wikipedia-screenshot'
];

Twinkle.fur.nonFreeLicenses = [
	'Non-free 2D art',
	'Non-free 3D art',
	'Non-free album cover',
	'Non-free audio sample',
	'Non-free AUSPIC',
	'Non-free Australian DoD',
	'Non-free Baseball HoF',
	'Non-free board game cover',
	'Non-free book cover',
	'Non-free British Columbia traffic sign',
	'Non-free character',
	'Non-free cereal box cover',
	'Non-free Cartoon Network image',
	'Non-free comic',
	'Non-free computer icon',
	'Non-free Crown copyright',
	'Non-free currency',
	'Non-free currency-EU banknote',
	'Non-free currency-EU coin common',
	'Non-free currency-EU coin national',
	'Non-free currency-New Zealand',
	'Non-free currency-Switzerland',
	'Non-free currency-UK',
	'Non-free Denver Public Library image',
	'Non-free ESA media',
	'Non-free fair use in',
	'Non-free film screenshot',
	'Non-free flag',
	'Non-free game cover',
	'Non-free game screenshot',
	'Non-free historic image',
	'Non-free logo',
	'Non-free magazine cover',
	'Non-free Mozilla logo',
	'Non-free music video screenshot',
	'Non-free NASA logo',
	'Non-free newspaper image',
	'Non-free parody',
	'Non-free Otto Perry image',
	'Non-free poster',
	'Non-free product cover',
	'Non-free promotional',
	'Non-free recording medium',
	'Non-free Robert Richardson image',
	'Non-free Scout logo',
	'Non-free sheet music',
	'Non-free software cover',
	'Non-free software screenshot',
	'Non-free speech',
	'Non-free stamp',
	'Non-free standard test image',
	'Non-free symbol',
	'Non-free television screenshot',
	'Non-free unsure',
	'Non-free USGov-IEEPA sanctions',
	'Non-free USGov-USPS stamp',
	'Non-free video cover',
	'Non-free video screenshot',
	'Non-free vodcast screenshot',
	'Non-free web screenshot',
	'Non-free Wikimedia logo',
	'Non-free with NC',
	'Non-free with ND',
	'Non-free with permission',
	'Non-free WWE photo'
];

Twinkle.fur.addLicense = function twinklefurAddLicense() {
	var dialog = new SimpleWindow( 500, 600 );
	dialog.setTitle( "Add license template" );
	dialog.setScriptName( "Twinkle \u00B7 File licensing" );  // U+00B7 MIDDLE DOT

	var form = new QuickForm( Twinkle.fur.addLicense.callback );

	var licenseMenu = form.append( {
			type: 'select',
			name: 'license',
			label: 'Add this license: ',
		} );

	// add favorite license tags to drop-down
	licenseMenu.append( { type:'option', label: 'None (do not change license)', value: '' } );

	if( Twinkle.getPref("furCustomLicenseTags").length ) {  // XXX pref
		$.each(Twinkle.getPref('furCustomLicenseTags'), function(value, label) {
			licenseMenu.append( { type:'option', label: label, value: value } );
		});
	}

	var licenseOptGroup = licenseMenu.append({ 
			type: 'optgroup',
			label: 'Free content licenses'
		});
	$.each(Twinkle.fur.freeLicenses, function(k, tag) {
		licenseOptGroup.append( { type: 'option', label: tag, value: tag });
	});

	licenseOptGroup = licenseMenu.append({ 
			type: 'optgroup',
			label: 'Non-free licenses'
		});
	$.each(Twinkle.fur.nonFreeLicenses, function(k, tag) {
		licenseOptGroup.append( { type: 'option', label: tag, value: tag });
	});

	form.append({ type: 'submit', label: 'Add to page' });

	dialog.setContent( form.render() );
	dialog.display();
};

Twinkle.fur.addLicense.callback = function twinklefurAddLicenseCallback(e) {
	throw "not yet implemented";
};

Twinkle.fur.addFUR = function twinklefurAddFUR() {
	var dialog = new SimpleWindow( 500, 600 );
	dialog.setTitle( "Add fair use rationale" );
	dialog.setScriptName( "Twinkle \u00B7 File licensing" );  // U+00B7 MIDDLE DOT

	var form = new QuickForm( Twinkle.fur.addFUR.callback );

	// what should the default fur option be
	var defaulttag = "nonfree";
	if (document.getElementById('catlinks')) {
		$('#catlinks a').each(function(k, link) {
			switch (link.attr('title').substring(9)) {
				case 'Album covers':
					defaulttag = "album";
					break;
				case 'All non-free logos':
					defaulttag = "logo";
					break;
				case 'Book covers':
					defaulttag = "book";
					break;
				case 'DVD covers':  // XXX CfD underway to rename to "Video covers"
					defaulttag = "film";
					break;
				case 'Non-free posters':
					defaulttag = "poster";
					break;
				default:
					break;
			}
		});
	}

	form.append( {
			type: 'select',
			name: 'license',
			label: 'Use this FUR tagh: ',
			event: Twinkle.fur.addFUR.choice,
			list: [
				{
					label: 'Generic non-free use',
					value: 'Non-free use rationale',
					checked: defaulttag === "nonfree",
					tooltip: 'Image or media being used with a non-free license under WP:FURG'
				},
				{
					label: 'Logo',
					value: 'Logo fur',
					checked: defaulttag === "logo",
					tooltip: 'Image or media is a logo used to help the reader identify the organization'
				},
				{
					label: 'Album cover',
					value: 'Album cover fur',
					checked: defaulttag === "album",
					tooltip: 'Image or media is a cover of an album'
				},
				{
					label: 'Book cover',
					value: 'Book cover fur',
					checked: defaulttag === "book",
					tooltip: 'Image or media is a front cover of a book'
				},
				{
					label: 'Film cover',
					value: 'Film cover fur',
					checked: defaulttag === "film",
					tooltip: 'Image or media is a cover of a film'
				},
				{
					label: 'Poster',
					value: 'Poster fur',
					checked: defaulttag === "poster",
					tooltip: 'Image or media is a promotional poster'
				}
			]
		} );

	form.append( {
			type: 'div',
			label: 'Work area',
			name: 'work_area'
		} );

	form.append( { type: 'submit', label: 'Add to page' } );

	dialog.setContent( form.render() );
	dialog.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.type[defaultIndex].dispatchEvent( evt );  // XXX fixme
	Twinkle.fur.addFUR.choice(evt);
};

Twinkle.fur.addFUR.callback = function twinklefurAddFURCallback(e) {
	throw "not yet implemented";
};

Twinkle.fur.addFUR.choice = function furmeCallbackChoose(event) {
	var value = event.target.value;
	var root = event.target.form;
	var work_area = new QuickForm.element( {
			type: 'div',
			name: 'work_area'
		} );

	switch( value ) {

	case 'Non-free use rationale':
		work_area.append( {
				type: 'input',
				name: 'article',
				label: 'Article: ',
				value: Twinkle.fur.seedValues.title
			} );

		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Source: ',
				value: Twinkle.fur.seedValues.url
			} );

		work_area.append( {
				type: 'input',
				name: 'portion',
				label: 'Portion: ',
				tooltip: "How much copyrighted material is used? The amount used must not make the work as a whole less valuable to the copyright holder."
			} );

		work_area.append( {
				type: 'input',
				name: 'resolution',
				label: 'Low resolution: ',
				value: Twinkle.fur.seedValues.resolution,
				tooltip: "Images must generally be of low resolution. The rule of thumb for raster images is no more than 300 pixels in width or height, which ensures that the image's resolution is less than 0.1 megapixels. If you are using an image of higher resolution, please explain why. If the image is 0.1 megapixels or less, just put \"Yes\"."
			} );

		work_area.append( {
				type: 'textarea',
				name: 'purpose',
				label: 'Purpose: ',
				tooltip: "How does the media contribute significantly to the article(s) in which it is used? The use of the media must not interfere with the media's original purpose."
			} );

		work_area.append( {
				type: 'textarea',
				name: 'description',
				label: 'Description: '
			} );

		work_area.append( {
				type: 'textarea',
				name: 'replaceability',
				label: 'Replaceability: ',
				tooltip: 'Explain why no free equivalent could reasonably be obtained or created to replace this media.'
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'reduce',
				list: [
					{
						label: 'Tag image for size reduction',
						value: 'Yes'
					}
				]
			} );

		break;

	case 'Logo fur':

		work_area.append( {
				type: 'input',
				name: 'article',
				label: 'Article: ',
				value: Twinkle.fur.seedValues.title
			} );

		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: Twinkle.fur.seedValues.url
			} );

		work_area.append( {
				type: 'input',
				name: 'owner',
				label: 'Owner: '
			} );

		var field = work_area.append( {
			type: 'field',
			label: 'Image use'
			} );

		field.append( {
				type: 'radio',
				name: 'useInArticle',
				list: [
					{
						label: 'Infobox (' + Twinkle.fur.seedValues.infobox + ')',
						value: 'Infobox',
						checked: Twinkle.fur.seedValues.infobox,
						tooltip: 'The logo is used in a company infobox for logos that represent the company'
					},
					{
						label: 'Org',
						value: 'Org',
						tooltip: 'The logo is used to identify an organization in an article or section about the organization'
					},
					{
						label: 'Brand',
						value: 'Brand',
						tooltip: 'Image is used to identify a brand in an article or section about the brand'
					},
					{
						label: 'Product',
						value: 'Product',
						tooltip: 'Image is used to identify a product or service in an article or section about that product or service'
					},
					{
						label: 'Public facility',
						value: 'Public facility',
						tooltip: 'The logo used to identify a road, airport, station, route, city, neighborhood, government service, etc'
					},
					{
						label: 'Other',
						value: 'Other',
						tooltip: 'Some other use. Describe in "Purpose"'
					}
				]

			} );

		work_area.append( {
				type: 'checkbox',
				name: 'rename',
				list: [
					{
						label: 'Tag image for renaming',
						value: 'Yes'
					}
				]
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'reduce',
				list: [
					{
						label: 'Tag image for size reduction',
						value: 'Yes'
					}
				]
			} );
		break;

	case 'Album cover fur':
		work_area.append( {
				type: 'input',
				name: 'article',
				label: 'Article: ',
				value: Twinkle.fur.seedValues.title
			} );

		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: Twinkle.fur.seedValues.url
			} );

		work_area.append( {
				type: 'input',
				name: 'artist',
				label: 'Artist: ',
				value: Twinkle.fur.seedValues.artist
			} );

		work_area.append( {
				type: 'input',
				name: 'album',
				label: 'Album: ',
				value: Twinkle.fur.seedValues.name
			} );

		work_area.append( {
				type: 'input',
				name: 'label',
				label: 'Label: ',
				value: Twinkle.fur.seedValues.label
			} );

		work_area.append( {
				type: 'input',
				name: 'owner',
				label: 'Owner: '
			} );

		var fieldType = work_area.append( {
			type: 'field',
			label: 'Type'
			} );

		fieldType.append( {
				type: 'radio',
				name: 'useType',
				list: [
					{
						label: 'Album',
						value: 'album',
						checked: Twinkle.fur.seedValues.infoboxAlbum
					},
					{
						label: 'Single',
						value: 'single',
						checked: Twinkle.fur.seedValues.infoboxSingle
					}
				]

			} );

		var field = work_area.append( {
			type: 'field',
			label: 'Image use'
			} );

		field.append( {
				type: 'radio',
				name: 'useInArticle',
				list: [
					{
						label: 'Infobox (' + Twinkle.fur.seedValues.infobox + ')',
						value: 'Infobox',
						checked: Twinkle.fur.seedValues.infobox,
						tooltip: 'The image is used in an infobox for the article about the album / work'
					},
					{
						label: 'Header',
						value: 'Header',
						tooltip: 'The image is used at the top of article about the album / work'
					},
					{
						label: 'Section',
						value: 'Section',
						tooltip: 'Image is used in a section devoted to the album / work'
					},
					{
						label: 'Artist',
						value: 'Artist',
						tooltip: 'Image is used in an article about the artist (be careful here)'
					},
					{
						label: 'Other',
						value: 'Other',
						tooltip: 'Some other use. Describe in "Purpose"'
					}
				]

			} );

		work_area.append( {
				type: 'checkbox',
				name: 'scanned',
				list: [
					{
						label: 'Scanned by uploader',
						value: 'Yes'
					}
				]
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'rename',
				list: [
					{
						label: 'Tag image for renaming',
						value: 'Yes'
					}
				]
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'reduce',
				list: [
					{
						label: 'Tag image for size reduction',
						value: 'Yes'
					}
				]
			} );

		break;

	case 'Book cover fur':
		work_area.append( {
				type: 'input',
				name: 'article',
				label: 'Article: ',
				value: Twinkle.fur.seedValues.title
			} );

		work_area.append( {
				type: 'input',
				name: 'title',
				label: 'Title: ',
				value: Twinkle.fur.seedValues.name
			} );

		work_area.append( {
				type: 'input',
				name: 'author',
				label: 'Author: ',
				value: Twinkle.fur.seedValues.author
			} );

		work_area.append( {
				type: 'input',
				name: 'publisher',
				label: 'Publisher: ',
				value: Twinkle.fur.seedValues.publisher
			} );

		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: Twinkle.fur.seedValues.url
			} );

		work_area.append( {
				type: 'input',
				name: 'owner',
				label: 'Owner: '
			} );

		work_area.append( {
				type: 'input',
				name: 'coverArtist',
				label: 'Cover Artist: ',
				value: Twinkle.fur.seedValues.coverArtist
			} );

		work_area.append( {
				type: 'input',
				name: 'year',
				label: 'Year: ',
				value: Twinkle.fur.seedValues.year
			} );

		var field = work_area.append( {
			type: 'field',
			label: 'Image use'
			} );

		field.append( {
				type: 'radio',
				name: 'useInArticle',
				list: [
					{
						label: 'Infobox (' + Twinkle.fur.seedValues.infobox + ')',
						value: 'Infobox',
						checked: Twinkle.fur.seedValues.infobox,
						tooltip: 'The image is used in an infobox for the article about the book'
					},
					{
						label: 'Header',
						value: 'Header',
						tooltip: 'The image is used at the top of article about the book'
					},
					{
						label: 'Section',
						value: 'Section',
						tooltip: 'Image is used in a section devoted to the book'
					},
					{
						label: 'Author',
						value: 'Author',
						tooltip: 'Image is used in an article about the author (be careful here)'
					},
					{
						label: 'Other',
						value: 'Other',
						tooltip: 'Some other use. Describe in "Purpose"'
					}
				]

			} );

		work_area.append( {
				type: 'checkbox',
				name: 'scanned',
				list: [
					{
						label: 'Scanned by uploader',
						value: 'Yes'
					}
				]
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'rename',
				list: [
					{
						label: 'Tag image for renaming',
						value: 'Yes'
					}
				]
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'reduce',
				list: [
					{
						label: 'Tag image for size reduction',
						value: 'Yes'
					}
				]
			} );

		break;

	case 'Film cover fur':
		work_area.append( {
				type: 'input',
				name: 'article',
				label: 'Article: ',
				value: Twinkle.fur.seedValues.title
			} );

		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: Twinkle.fur.seedValues.url
			} );

		work_area.append( {
				type: 'input',
				name: 'album', // share the same parameter as album cover
				label: 'Film: ',
				value: Twinkle.fur.seedValues.name
			} );

		work_area.append( {
				type: 'input',
				name: 'distributor',
				label: 'Distributor: ',
				value: Twinkle.fur.seedValues.distributor
			} );

		work_area.append( {
				type: 'input',
				name: 'owner',
				label: 'Owner: '
			} );

		var fieldType = work_area.append( {
			type: 'field',
			label: 'Type'
			} );

		fieldType.append( {
				type: 'radio',
				name: 'useType',
				list: [
					{
						label: 'DVD',
						value: 'DVD'
					},
					{
						label: 'VHS',
						value: 'video cassette'
					}
				]

			} );

		var field = work_area.append( {
			type: 'field',
			label: 'Image use'
			} );

		field.append( {
				type: 'radio',
				name: 'useInArticle',
				list: [
					{
						label: 'Infobox (' + Twinkle.fur.seedValues.infobox + ')',
						value: 'Infobox',
						checked: Twinkle.fur.seedValues.infobox,
						tooltip: 'The image is used in an infobox for the article about the film / work'
					},
					{
						label: 'Header',
						value: 'Header',
						tooltip: 'The image is used at the top of article about the film / work'
					},
					{
						label: 'Section',
						value: 'Section',
						tooltip: 'Image is used in a section devoted to the film / work'
					},
					{
						label: 'Other',
						value: 'Other',
						tooltip: 'Some other use. Describe in "Purpose"'
					}
				]

			} );

		work_area.append( {
				type: 'checkbox',
				name: 'scanned',
				list: [
					{
						label: 'Scanned by uploader',
						value: 'Yes'
					}
				]
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'rename',
				list: [
					{
						label: 'Tag image for renaming',
						value: 'Yes'
					}
				]
			} );

		work_area.append( {
				type: 'checkbox',
				name: 'reduce',
				list: [
					{
						label: 'Tag image for size reduction',
						value: 'Yes'
					}
				]
			} );

		break;
	}

	work_area = work_area.render();
	root.replaceChild( work_area, root.lastChild );

	// XXX make into a button
	var refreshImageContainer = document.getElementsByName('article')[0].parentNode.appendChild( document.createElement( 'span' ) );
	var refreshImage = refreshImageContainer.appendChild( document.createElement( 'img' ) );
	refreshImage.setAttribute('src', 'http://upload.wikimedia.org/wikipedia/commons/6/6e/Reload_page.png');
	refreshImage.setAttribute('onclick', 'Twinkle.fur.refreshValues()');
	refreshImage.setAttribute('title', 'Refresh values');
	refreshImage.style.width = '18px';
	refreshImage.style.cursor = 'pointer';
}

Twinkle.fur.restrictionList = [
	{ label: '{{Freedom of panorama}}', value: 'Freedom of panorama' },
	{ label: '{{Insignia}}', value: 'Insignia' },
	{ label: '{{SVG-Logo}}', value: 'SVG-Logo' },
	{ label: '{{Trademark}}', value: 'Trademark' }
];

Twinkle.fur.addRestriction = function twinklefurAddRestriction() {
	var dialog = new SimpleWindow( 500, 600 );
	dialog.setTitle( "Add file usage restriction tag" );
	dialog.setScriptName( "Twinkle \u00B7 File licensing" );  // U+00B7 MIDDLE DOT

	var form = new QuickForm( Twinkle.fur.addRestriction.callback );

	form.append({ type: 'header', label: 'Usage restriction tags' });
	form.append({ type: 'checkbox', name: 'tags', list: Twinkle.fur.restrictionList } );

	form.append( { type: 'submit', label: 'Add to page' } );

	dialog.setContent( form.render() );
	dialog.display();
};

Twinkle.fur.addFUR.callback = function twinklefurAddFURCallback(e) {
	throw "not yet implemented";
};










			form.append({ type: 'header', label: 'Information summary' });
			form.append( {
					type: 'checkbox',
					name: 'information',
					list: [
						{ label: '{{Information}}', value: 'information' }
					],
					event: Twinkle.tag.fileInformationDisplay
				} );
			form.append({ type: 'div', id: 'furme-information-placeholder' });
			
			
			Twinkle.tag.fileInformationDisplay = function twinkletagFileInformationDisplay(e) {
	if (e.target.checked) {
		var placeholder = new QuickForm.element({
			type: 'div',
			id: 'furme-information-placeholder'
		});
		placeholder.append({
			type: 'input',
			name: 'informationDescription',
			label: 'Description: '
		});
		placeholder.append({
			type: 'input',
			name: 'informationSource',
			label: 'Source: '
		});
		placeholder.append({
			type: 'input',
			name: 'informationDate',
			label: 'Date: '
		});
		placeholder.append({
			type: 'input',
			name: 'informationAuthor',
			label: 'Author: '
		});
		placeholder.append({
			type: 'input',
			name: 'informationPermission',
			label: 'Permission: '
		});
		placeholder.append({
			type: 'input',
			name: 'informationOtherVersions',
			label: 'Other versions: '
		});
		
		$(e.target.form).find("#furme-information-placeholder").replaceWith(placeholder.render());
	} else {
		$(e.target.form).find("#furme-information-placeholder").empty();
	}
};



Twinkle.fur.callback.evaluate = function furmeCallbackEvaluate(event) {
	var types = event.target.type;
	for( var i = 0; i < types.length; ++i ) {
		if( types[i].checked ) {
			var type = types[i].values;
			break;
		}
	}



				params.imageLicense = form.imageLicense.options[form.imageLicense.selectedIndex].value;
			params.removeFUR = form.removeFUR.checked;


		// Remove any fair use rationale
		if (params.removeFUR)
		{
			// Remove any fair use headings
			var regExFindFUHeading = /(\s*)===?\s*Fair use[^=]*===?\s*/ig;
			text = text.replace(regExFindFUHeading, "$1");

			var regExFindRationale = /{{(.*fur|Non-free use rationale|Fair use rationale|Non-free fair use rationale|Rationale|Non-free media rationale|Non-free image data|Non-free image rationale)[^]+?}}\s*/igm;
			text = text.replace(regExFindRationale, '');
		}
		

	// XXX scroller
	if ( /[&?]furme-scroller=([^&]*)/.exec(window.location.search) ) {
		var scrollerStarted = /[&?]furme-scroller=([^&]*)/.exec(window.location.search)[1];
	}
	
	var params = {};
	if( event.target.portion ) {
		params.portion = event.target.portion.value;
	}
	if( event.target.description ) {
		params.description = event.target.description.value;
	}
	if( event.target.resolution ) {
		params.resolution = event.target.resolution.value;
	}
	if( event.target.purpose ) {
		params.purpose = event.target.purpose.value;
	}
	if( event.target.replaceability ) {
		params.replaceability = event.target.replaceability.value;
	}
	if( event.target.article ) {
		params.article = event.target.article.value;
	}
	if( event.target.website ) {
		params.website = event.target.website.value;
	}
	if( event.target.owner ) {
		params.owner = event.target.owner.value;
	}
	if( event.target.artist ) {
		params.artist = event.target.artist.value;
	}
	if( event.target.album ) {
		params.album = event.target.album.value;
	}
	if( event.target.label ) {
		params.label = event.target.label.value;
	}
	if( event.target.author ) {
		params.author = event.target.author.value;
	}
	if( event.target.publisher ) {
		params.publisher = event.target.publisher.value;
	}
	if( event.target.year ) {
		params.year = event.target.year.value;
	}
	if( event.target.title ) {
		params.title = event.target.title.value;
	}
	if( event.target.distributor ) {
		params.distributor = event.target.distributor.value;
	}
	if( event.target.coverArtist ) {
		params.coverArtist = event.target.coverArtist.value;
	}
	if (event.target.useType) {
		for (var i=0; i < event.target.useType.length; i++) {
			if (event.target.useType[i].checked) {
				params.useType = event.target.useType[i].values;
			}
		}
	}
	if (event.target.useInArticle) {
		for (var i=0; i < event.target.useInArticle.length; i++) {
			if (event.target.useInArticle[i].checked) {
				params.useInArticle = event.target.useInArticle[i].values;
			}
		}
	}
	if (event.target.scanned && event.target.scanned.checked) {
		params.scanned = event.target.scanned.value;
	}
	if (event.target.rename && event.target.rename.checked) {
		params.rename = event.target.rename.value;
	}
	if (event.target.reduce && event.target.reduce.checked) {
		params.reduce = event.target.reduce.value;
	}


	var template;
	switch (...template) {
		case "Album cover fur":
			template = "{{album cover fur\n" + 
				"| Article           = \n" +
				"| Use               = \n" +  //  Choose: Infobox / Header / Section / Artist / other (specify Purpose)
				"<!-- ADDITIONAL INFORMATION -->\n" +
				"| Name              = \n" +
				"| Artist            = \n" +
				"| Label             = \n" +
				"| Graphic Artist    = \n" +
				"| Item              = \n" +
				"| Type              = \n" +
				"| Website           = \n" +
				"| Owner             = \n" +
				"| Commentary        = \n" +
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = \n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = \n" +  // <!-- Must be specified if Use is not Infobox / Header / Section / Artist -->
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}";
			break;
		case "Book cover fur":
			template = "{{Book cover fur\n" +
				"| Article           = \n" +
				"| Use               = \n" +  //<!--Choose: Infobox / Header / Section / Author / Other -->
				"<!-- OPTIONAL FIELDS -->\n" +
				"| Title             = \n" +
				"| Author            = \n" +
				"| Publisher         = \n" +
				"| Cover_artist      = \n" +
				"| Website           = \n" +
				"| Owner             = \n" +
				"| Commentary        = \n" +
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = \n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = \n" +
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}";
			break;
		case "Film cover fur":
			template = "{{Film cover fur\n" +
				"| Format            = \n" + // <!--Choose: Full / Data / Rationale -->
				"| Article           = \n" +
				"| Use               = \n" + // <!--Choose: Infobox / Header / Section / Other --> 
				"<!-- ADDITIONAL INFORMATION -->\n" +
				"| Type              = \n" +
				"| Title             = \n" +
				"| Distributor       = \n" +
				"| Publisher         = \n" +
				"| Website           = \n" +
				"| Owner             = \n" +
				"| Commentary        = \n" +
				"| Other purpose     = \n" + // <!-- Must be specified if Use is not Infobox / Header / Section -->
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = \n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = \n" +
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}\n";
			break;
		case "Logo fur":
			template = "{{logo fur\n" +
				"| Article           = \n" +
				"| Use               = \n" + // <!--Choose: Infobox / Org / Brand / Product / Public facility / Other -->
				"<!-- ADDITIONAL INFORMATION -->\n" +
				"| Used for          = \n" +
				"| Owner             = \n" +
				"| Website           = \n" +
				"| History           = \n" +
				"| Commentary        = \n" +
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = \n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = \n" + //<!--Must be specified if Use is not Infobox / Org / Brand / Product-->
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}\n";
			break;
	}
	

	if (/[&?]freelogo=/.test(window.location.search) == false && /[&?]furmeImageTags=/.test(window.location.search) == false)
	{

		if (purpose != 'undefined')
			template = template.replace(/(\s*)Purpose(\s*)=(\s*)/, "$1Purpose$2= " + purpose.trim() + "\n");
		if (portion != 'undefined')
			template = template.replace(/(\s*)Portion(\s*)=(\s*)/, "$1Portion$2= " + portion.trim() + "\n");
		if (resolution != 'undefined')
			template = template.replace(/(\s*)Low_resolution(\s*)=(\s*)/, "$1Low_resolution$2= " + resolution.trim() + "\n");
		if (replaceability != 'undefined')
			template = template.replace(/(\s*)Replaceability(\s*)=(\s*)/, "$1Replaceability$2= " + replaceability.trim() + "\n");
		if (description != 'undefined')
			template = template.replace(/(\s*)Description(\s*)=(\s*)/, "$1Description$2= " + description.trim() + "\n");
		if (article != 'undefined')
			template = template.replace(/(\s*)Article(\s*)=(\s*)/, "$1Article$2= " + article.trim() + "\n");
		if (owner != 'undefined')
			template = template.replace(/(\s*)Owner(\s*)=(\s*)/, "$1Owner$2= " + owner.trim() + "\n");
		if (website != 'undefined')
			template = template.replace(/(\s*)Website(\s*)=(\s*)/, "$1Website$2= " + website.trim() + "\n");
		if (website != 'undefined' && (type == 'Non-free use rationale'))
			template = template.replace(/(\s*)Source(\s*)=(\s*)/, "$1Source$2= " + website.trim() + "\n");
		if (use != 'undefined')
			template = template.replace(/(\s*)Use(\s*)=(\s*)/, "$1Use$2= " + use.trim() + "\n");
		if (artist != 'undefined')
			template = template.replace(/(\s*)Artist(\s*)=(\s*)/, "$1Artist$2= " + artist.trim() + "\n");
		if (label != 'undefined')
			template = template.replace(/(\s*)Label(\s*)=(\s*)/, "$1Label$2= " + label.trim() + "\n");
		if (album != 'undefined')
			template = template.replace(/(\s*)Name(\s*)=(\s*)/, "$1Name$2= " + album.trim() + "\n");
		if (useType != 'undefined' && (type == 'Album cover fur' || type == 'Film cover fur'))
			template = template.replace(/(\s*)Type(\s*)=(\s*)/, "$1Type$2= " + useType.trim() + "\n");
		if (year != 'undefined')
			template = template.replace(/(\s*)Year(\s*)=(\s*)/, "$1Year$2= " + year.trim() + "\n");
		if (author != 'undefined')
			template = template.replace(/(\s*)Author(\s*)=(\s*)/, "$1Author$2= " + author.trim() + "\n");
		if (title != 'undefined')
			template = template.replace(/(\s*)Title(\s*)=(\s*)/, "$1Title$2= " + title.trim() + "\n");
		if (coverArtist != 'undefined')
			template = template.replace(/(\s*)Cover_artist(\s*)=(\s*)/, "$1Cover_artist$2= " + coverArtist.trim() + "\n");
		if (distributor != 'undefined')
			template = template.replace(/(\s*)Distributor(\s*)=(\s*)/, "$1Distributor$2= " + distributor.trim() + "\n");
		if (publisher != 'undefined')
			template = template.replace(/(\s*)Publisher(\s*)=(\s*)/, "$1Publisher$2= " + publisher.trim() + "\n");
		if (scanned == 'Yes')
			template = template.replace(/(\s*)Source(\s*)=(\s*)/, "$1Source$2= Scanned by uploader.\n");
	}

	textboxText = textbox.value;

	/*
		FIND THE SUMMARY TEXT, MAKE SURE TO BE BELOW IT (PLACE SUMMARY TEXT IF NOT THERE)
	*/
	regExFindSummary = /==\s*[Ss]ummary\s*==\s*/;
	findSummary = textboxText.search(regExFindSummary);

	if (findSummary == -1) {
		textboxText = "== Summary ==\n" + textboxText;
	}

	textboxText = textboxText.replace(regExFindSummary, "== Summary ==\n" + template);

	/*
		GET RID OF DISPUTED TEMPLATES (WHERE THE PROBLEM SHOULD NOW BE CORRECTED)
	*/

	regExFindNoSource = /\{\{(Di-no source|No source|Unspecified|Unknownsource|Fairuseunknownsource|Fuus|Nosource|No source since|No source notified|No info|Nosources|Di-no-source)(.*)\}\}\n*/i;
	regExFindDisputed = /\{\{(Di-disputed fair use rationale|Di-disputed rationale|Improve rationale|Di-missing article links)(.*)\}\}\n*/i;
	regExFindNoRationale = /\{\{(Di-no fair use rationale|No rationale|Fairuse rationale needed|Fu-ra-ne|Norat|Norationale|Di-no rationale)(.*)\}\}\n*/i;
	regExFindMissingArticleLinks = /\s*\{\{(Di-missing article links)[^\}]+?\}\}\s*/i;

	textboxText = textboxText.replace(regExFindNoSource, '');
	textboxText = textboxText.replace(regExFindDisputed, '');
	textboxText = textboxText.replace(regExFindNoRationale, '');
	textboxText = textboxText.replace(regExFindMissingArticleLinks, '');

	/*
		GET RID OF DISPUTED IMAGE CATEGORIES (PRESENT ONLY SOMETIMES)
	*/

	regExFindDisputedCategory = /(\\,)*\[\[Category:Disputed non-free images(.*)]](\n)*/i;

	textboxText = textboxText.replace(regExFindDisputedCategory, '');

	/*
		ADD IN == LICENSING == TAG IF NOT THERE
	*/

	regExFindLicensing = /\s*==\s*[Ll]icensing[:]*\s*==\s*/;
	textboxText = textboxText.replace(regExFindLicensing, "\n\n== Licensing ==\n");

	findLicensing = textboxText.search(regExFindLicensing);

	if (findLicensing == -1) {
		regExFindLicense = /\n*\{\{\s*([Tt]emplate:)*([Nn]on-free|[Pp][Dd]|[Cc]C|[Gg]FDL|[Gg]PL)([^\}]*)\}\}\s*/g;

		textboxText = textboxText.replace(regExFindLicense, "\n\n== Licensing ==\n{{$2$3}}");
	}

	/*
		FREE LOGO SPECIFIC CHANGES
	*/

	if (/[&?]freelogo=/.test(window.location.search))
	{
		// Remove all non-free licenses
		regExFindLicense = /\n*\{\{Non-free(.*)\}\}\s*/i;
		textboxText = textboxText.replace(regExFindLicense, '');

		// Add free license
		textboxText = textboxText.replace(regExFindLicensing, "\n\n== Licensing ==\n{{Trademark}}\n{{PD-textlogo}}");

		// Remove any fair use headings
		regExFindFUHeading = /(\s*)==\s*Fair use[^]+?==\s*/ig;
		textboxText = textboxText.replace(regExFindFUHeading, "$1");

		// Remove any fair use rationale
		regExFindRationale = /\{\{(logo fur|Non-free use rationale|Fair use rationale|Non-free fair use rationale|Rationale|Non-free media rationale|Non-free image data|Non-free image rationale)[^]+?\}\}\s*/igm;
		textboxText = textboxText.replace(regExFindRationale, '');
	}

	/*
		ADD IMAGE FOR RENAMING TAG
	*/

	if (typeof(rename) != 'undefined')
	{
		if (rename != 'undefined')
		{
			var dot = wgTitle.lastIndexOf('.');
			var extension = wgTitle.substr(dot, wgTitle.length);

			if (FurMeConfig.renameMethod == 'bot')
			{
				regExFindWikiLinks = /\[\[|\]\]/gi;
				regExFindWikiLinks2 = /^.*\|/gi;

				if (type == 'Album cover fur')
				{
					if (useType != 'undefined')
						renameTag = '{{rename media|' + artist.replace(regExFindWikiLinks, '').replace(regExFindWikiLinks2, '').trim() + ' - ' + album.replace(regExFindWikiLinks, '').trim() + ' ' + useType.trim() + ' cover' + extension.toLowerCase() + '}}';
					else
						renameTag = '{{rename media|' + artist.replace(regExFindWikiLinks, '').replace(regExFindWikiLinks2, '').trim() + ' - ' + album.replace(regExFindWikiLinks, '').trim() + ' album cover' + extension.toLowerCase() + '}}';
				}

				else if (type == 'Book cover fur')
				{
					renameTag = '{{rename media|' + author.replace(regExFindWikiLinks, '').replace(regExFindWikiLinks2, '').trim() + ' - ' + title.replace(regExFindWikiLinks, '').trim() + ' book cover' + extension.toLowerCase() + '}}';
				}

				else if (type == 'Film cover fur')
				{
					renameTag = '{{rename media|' + album.replace(regExFindWikiLinks, '').trim() + ' film cover' + extension.toLowerCase() + '}}';
				}

				else if (type == 'Logo fur')
				{
					renameTag = '{{rename media|' + article.replace(regExFindWikiLinks, '').replace(regExFindWikiLinks2, '').trim() + ' logo' + extension.toLowerCase() + '}}';
				}

			}
			else
				renameTag = '{{rename media}}';

			textboxText = textboxText.replace(regExFindSummary,  renameTag + "\n== Summary ==\n");
		}
	}

	/*
		ADD NON-FREE REDUCE TAG
	*/

	if (typeof(reduce) != 'undefined')
	{
		if (reduce != 'undefined')
		{
			reduceTag = '{{Non-free reduce}}';
			textboxText = textboxText.replace(regExFindSummary,  reduceTag + "\n== Summary ==\n");
		}
	}

	textbox.value = textboxText;

	// copy wpTextbox1 textarea back to wikEd frame
	if (typeof(wikEdUseWikEd) != 'undefined') {
	    if (wikEdUseWikEd == true) {
		   WikEdUpdateFrame();
	    }
	}

	if (FurMeConfig.watchMyEdits)
		editform.wpWatchthis.checked = true;

	if (editform.wpSummary) {
		if (/[&?]freelogo=/.test(window.location.search))
			editform.wpSummary.value = "changing license to [[:Template:PD-textlogo|PD-textlogo]] using [[Wikipedia:FurMe|FurMe]]";
		else if (/[&?]furmeImageTags=/.test(window.location.search))
			editform.wpSummary.value = editSummary + " using [[Wikipedia:FurMe|FurMe]]";
		else
			editform.wpSummary.value = "adding [[WP:FURG|FUR]] using [[Wikipedia:FurMe|FurMe]]";
	}

	switch(FurMeConfig.actionOnSubmit)
	{
		case 'none':
			break;
		case 'save':
			if (editform.wpSave) {
				editform.wpSave.click();
			}
			break;
		case 'preview':
			if (editform.wpPreview) {
				editform.wpPreview.click();
			}
			break;
		case 'diff':
		default:
			if (editform.wpDiff) {
				editform.wpDiff.click();
			}
			break;
	}
}























Twinkle.fur.imageRemover = function furmeImageRemover()
{
	try { var image = decodeURIComponent(/[&?]image=([^&]*)/.exec(window.location.search)[1]); } catch (err) {}

	if (typeof(image) != 'undefined')
	{
		if ((wgNamespaceNumber == 0 || wgNamespaceNumber == 2) && wgAction == 'view')
		{
			var imageList = document.getElementById('bodyContent').getElementsByTagName('img');

			if (typeof imageList != 'undefined' && null != imageList) {
				for( var i = 0; i < imageList.length; ++i ) {

					if (imageList[i].parentNode.className == 'image' && decodeURIComponent(imageList[i].parentNode.href) == wgServer + wgArticlePath.replace(/\$1/, image)) {
						var imageContainer = imageList[i].parentNode.parentNode.appendChild( document.createElement( 'div' ) );
						var removalLink = imageContainer.appendChild( document.createElement( 'a' ) )
						removalLink.innerHTML = '<< Remove unacceptably used image >>';
						removalLink.href = wgScript + '?title=' + wgPageName + '&action=edit&furme=true&image=' + encodeURIComponent(image);
						removalLink.focus();
						imageList[i].parentNode.parentNode.style.border = '1px solid #6E1616';
						imageList[i].parentNode.parentNode.style.backgroundColor = 'pink';

					}

				}
			}
		}
		else if ((wgNamespaceNumber == 0 || wgNamespaceNumber == 2) && wgAction == 'edit')
		{
			var editform = document.editform;
			if (!editform) return;
			var textbox = editform.wpTextbox1;
			if (!textbox) return;

			textboxText = textbox.value;

			switch (FurMeConfig.imageRemovalMethod)
			{
				case 'pixel':
					regExFindImage = '/(' + image.replace(/Image:/, '') + ')/ig'; // underscores
					textboxText = textboxText.replace(eval(regExFindImage), 'Pixel.gif');

					if (image.search(/_/ig) != -1) // spaces
					{
						regExFindImage = '/(' + image.replace(/Image:/, '').replace(/_/ig, ' ') + ')/ig';
						textboxText = textboxText.replace(eval(regExFindImage), 'Pixel.gif');
					}
					break;
				case 'nonfreeimageremoved':
					regExFindImage = '/(' + image.replace(/Image:/, '') + ')/ig'; // underscores
					textboxText = textboxText.replace(eval(regExFindImage), 'NonFreeImageRemoved.svg');

					if (image.search(/_/ig) != -1) // spaces
					{
						regExFindImage = '/(' + image.replace(/Image:/, '').replace(/_/ig, ' ') + ')/ig';
						textboxText = textboxText.replace(eval(regExFindImage), 'NonFreeImageRemoved.svg');
					}
					break;
				case 'comment':
				default:
					regExFindImage = '/(\\[\\[.*' + image + '.*\\]\\])\\s*/ig'; // underscores
					regexFindImageGallery = '/^\\s*(' + image + '.*)\\n/igm'; // underscores
					regexFindImageInfobox = '/([= ])(' + image.replace(/Image:/, '') + '.*)\\n/ig'; // underscores
					textboxText = textboxText.replace(eval(regExFindImage), '<!-- Non-free image removed $1 -->');
					textboxText = textboxText.replace(eval(regexFindImageGallery), '<!-- Non-free image removed $1 -->\n');
					textboxText = textboxText.replace(eval(regexFindImageInfobox), '$1<!-- Non-free image removed $2 -->\n');

					if (image.search(/_/ig) != -1) // spaces
					{
						regExFindImage = '/(\\[\\[.*' + image.replace(/_/ig, ' ') + '.*\\]\\])\\s*/ig';
						regexFindImageGallery = '/^\\s*(' + image.replace(/_/ig, ' ') + '.*)\\n/igm';
						regexFindImageInfobox = '/([= ])(' + image.replace(/Image:/, '').replace(/_/ig, ' ') + '.*)\\n/ig';
						textboxText = textboxText.replace(eval(regExFindImage), '<!-- Non-free image removed $1 -->');
						textboxText = textboxText.replace(eval(regexFindImageGallery), '<!-- Non-free image removed $1 -->\n');
						textboxText = textboxText.replace(eval(regexFindImageInfobox), '$1<!-- Non-free image removed $2 -->\n');
					}
					break;
			}

			textbox.value = textboxText;

			if (FurMeConfig.watchMyEdits)
				editform.wpWatchthis.checked = true;

			if (editform.wpSummary)
				editform.wpSummary.value = "Non-free image removed per [[WP:NFC#Images_2|WP:NFC]] using [[Wikipedia:FurMe|FurMe]]";

			switch(FurMeConfig.actionOnSubmit)
			{
				case 'none':
					break;
				case 'save':
					if (editform.wpSave) {
						editform.wpSave.click();
					}
					break;
				case 'preview':
					if (editform.wpPreview) {
						editform.wpPreview.click();
					}
					break;
				case 'diff':
				default:
					if (editform.wpDiff) {
						editform.wpDiff.click();
					}
					break;
			}

		}
	}
}

String.prototype.trimPunctuation = function() {
	return this.replace(/^\W+/g,"");
}

String.prototype.rtrimPipe = function() {
	return this.replace(/\|\s*$/g,"");
}

String.prototype.stripslashes = function() {
	temp = this.replace(/\\'/g,'\'');
	temp = temp.replace(/\\"/g,'"');
	temp = temp.replace(/\\\\/g,'\\');
	temp = temp.replace(/\\0/g,'\0');
	return temp;
}

String.prototype.cleanAmazonURL = function() {
	temp = this.replace(/\/[^\/]+?=[^]+?$/g, '');
	temp = temp.replace(/gp\/product/g, 'o/ASIN');
	return temp;
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}
