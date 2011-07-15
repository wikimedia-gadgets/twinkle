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

Twinkle.fur = function furme() {

	if( QueryString.exists( 'furme' ) ) {  // was: wgNamespaceNumber === 0 || wgNamespaceNumber === 2
		Twinkle.fur.imageRemover();
	}

	if( wgNamespaceNumber === 6 ) {
		$(twAddPortletLink( "#", "License", "furme-fur", "Apply fair-use rationale to image", "")).click(function() {
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

	if (Twinkle.getPref('cleanAmazonURLs')) {
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
	}

	// optionally, if not in infobox, open the article in a new window/tab/etc.
	// or, open all articles

	if (!Twinkle.fur.seedValues.infobox && Twinkle.getPref('furOpenLinkedArticles') && (Twinkle.fur.seedValues.title.length > 0 || Twinkle.getPref('furOpenAllArticles')) )
	{
		var maxArticlesToOpen = Twinkle.getPref('openAllArticles') ? 10 : 1;

		if (pageLinks) {
			for (var i = 0; i < Math.min(maxArticlesToOpen, pageLinks.length); i++)
			{
				var url = wgServer + wgArticlePath.replace(/\$1/, pageLinks[i].getAttribute('title')) + '?twinkleImageRemover=true&image=' + wgPageName.stripslashes();

				switch( Twinkle.getPref('furOpenArticleMode') )
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
};

Twinkle.fur.callback = function twinklefurCallback() {
	var dialog = new SimpleWindow( 600, Twinkle.getPref('furWindowHeight') );
	dialog.setTitle( "Change file license/FUR" );
	dialog.setScriptName( "Twinkle" );
	dialog.addFooterLink( "Twinkle help", "WP:TW/DOC#fur" );

	var root = document.createElement( 'div' );
	root.style.padding = '15px';  // just so it doesn't look broken
	Status.init( root );
	dialog.setContent( root );
	dialog.display();

	var thispage = new Wikipedia.page( wgPageName, 'Fetching page wikitext' );
	thispage.setCallbackParameters({ 'dialog': dialog });
	thispage.load( Twinkle.fur.callbacks.displayForm );
};

// { 
//   type: 'add', 'remove',
//   what: 'text', 'template' (remove only), (all these are add only:) 'fur', 'license', 'information', 'restriction', 'nonFreeData', 'tag'
//   code: <line of text>, <template name to remove>, <template code to add>
// }
Twinkle.fur.pageActions = [];

Twinkle.fur.pageItems = [];

Twinkle.fur.dialogContainer = null;

Twinkle.fur.refreshDialog = function twinklefurRefreshDialog() {
	// establish a list of items to go in the dialog
	var items = [];
	var furs = [], licenses = [], informations = [], restrictions = [], nonFreeDatas = [], tags = [];
	$.each(Twinkle.fur.pageActions, function(k, action) {
		if (action.type !== "add") {
			return true;
		}
		var templateregex = /\s*\{\{\s*([^\|}]+)/;
		switch (action.what) {
			case "fur":
				furs.push({ type: "fur", code: templateregex.exec(action.code)[1], addedByAction: true, action: action });
				break;
			case "license":
				licenses.push({ type: "template", code: templateregex.exec(action.code)[1], addedByAction: true, action: action });
				break;
			case "information":
				informations.push({ type: "template", code: templateregex.exec(action.code)[1], addedByAction: true, action: action });
				break;
			case "restriction":
				restrictions.push({ type: "template", code: templateregex.exec(action.code)[1], addedByAction: true, action: action });
				break;
			case "nonFreeData":
				nonFreeDatas.push({ type: "template", code: templateregex.exec(action.code)[1], addedByAction: true, action: action });
				break;
			case "tag":
				tags.push({ type: "template", code: templateregex.exec(action.code)[1], addedByAction: true, action: action });
				break;
		}
		return true;
	});

	// add tags at very beginning
	items = tags;
	$.each(Twinkle.fur.pageItems, function(k, item) {
		// skip all "removed" items
		var ignore;
		$.each(Twinkle.fur.pageActions, function(l, action) {
			if (action.type === "remove" && action.what === (item.type === "other" ? "text" : "template") && 
				action.code === item.code) {
				ignore = true;
				return false;  // break
			}
		});
		if (ignore) {
			return true;  // continue
		}

		items.push(item);
		// add informations, followed by nonFreeDatas, followed by furs, beneath summaryHeader
		if (item.type === "summaryHeader") {
			items = items.concat(informations).concat(nonFreeDatas).concat(furs);
		}
		// add licenses, followed by restrictions, beneath licenseHeader
		if (item.type === "licenseHeader") {
			items = items.concat(licenses).concat(restrictions);
		}
	});
	
	// now, populate the table
	$(Twinkle.fur.dialogContainer).empty();
	var rowcount = 0;
	$.each(items, function(k, item) {
		rowcount++;
		var itemtr = document.createElement("tr");
		itemtr.id = "twinklefur-row-" + rowcount;
		var td;
		if (item.type === "summaryHeader" || item.type === "licenseHeader") {
			td = document.createElement("td");
		} else {
			td = document.createElement("th");
			td.style.fontStyle = "italic";
			td.style.textAlign = "left";
		}
		if (["fur", "nonfree", "template"].indexOf(item.type) !== -1) {
			td.style.fontWeight = "bold";
			td.textContent = "{{" + item.code + "}}";
		} else {
			td.textContent = (item.code.length > 120 ? (item.code.substring(0, 120) + "...") : item.code);
			td.setAttribute("title", item.code);
		}
		itemtr.appendChild(td);
		// delete button
		if (item.type !== "summaryHeader" && item.type !== "licenseHeader") {
			td = document.createElement("td");
			td.style.color = "#0645AD";
			td.style.cursor = "pointer";
			td.textContent = "Delete";
			$(td).click(function() {
				$(itemtr).remove();
				if (!item.addedByAction) {
					Twinkle.fur.pageActions.push({ 
						type: 'remove',
						what: (td.style.fontWeight === "bold" ? "template" : "text"),
						code: item.code
					});
				} else {
					Twinkle.fur.pageActions.splice(Twinkle.fur.pageActions.indexOf(item.action), 1);
				}
			});
		}
		itemtr.appendChild(td);
		// XXX add move up/move down, or even drag+drop functionality... we can dream...
		Twinkle.fur.dialogContainer.appendChild(itemtr);
		return true;
	});
};

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
	Twinkle.fur.pageActions = [];
	Twinkle.fur.pageItems = [];
	var templateNestLevel = 0;
	var currentTemplate = "";
	var gotSummaryHeader, gotLicenseHeader, gotInformation, gotNonFreeData;
	$.each(textForParsing.split("\n"), function(k, line) {
		// look for nested templates
		var index;
		while ((index = line.substr(index).search("{{")) !== -1) {  // XXX fails on <nowiki>{{</nowiki>, {{{1}}}
			templateNestLevel++;
		}
		while ((index = line.substr(index).search("}}")) !== -1) {  // XXX fails on <nowiki>{{</nowiki>, {{{1}}}
			templateNestLevel--;
		}
		if (templateNestLevel) {
			return true;
		}

		var templateregex = /\s*\{\{\s*([^\|}]+)/;  // /\s*\{\{\s*(([^\|\}]+)\s*(\|(?:\{\{[^\{\}]*}}|[^\{\}])*)?)}}\s*/gi;
		var templatematch = templateregex.exec(line);
		if (templatematch) {
			var templatename = templatematch[1].toLowerCase();
			if (templatename.indexOf(" fur") !== -1) {
				Twinkle.fur.pageItems.push({ type: "fur", code: templatematch[1] });
			} else if (templatename.indexOf("non-free") !== -1 &&
					templatename.indexOf("non-free image data") === -1 &&
					templatename.indexOf("non-free media data") === -1) {
				Twinkle.fur.pageItems.push({ type: "nonfree", code: templatematch[1] });
			} else {
				Twinkle.fur.pageItems.push({ type: "template", code: templatematch[1] });
				if (templatename === "information") {
					gotInformation = true;
				} else if (templatename === "non-free media data" || templatename === "non-free image data") {
					gotNonFreeData = true;
				}
			}
			if (line.indexOf("}}") !== -1) {  // XXX huge fail with nested templates...
				insideTemplate = true;
			}
		} else if (/^\s*==\s*[Ss]ummary\s*==\s*$/.test(line)) {
			Twinkle.fur.pageItems.push({ type: "summaryHeader", code: "== Summary ==" });
			gotSummaryHeader = true;
		} else if (/^\s*==\s*[Ll]icensing[:]*\s*==\s*$/.test(line)) {
			Twinkle.fur.pageItems.push({ type: "licenseHeader", code: "== Licensing ==" });
			gotLicenseHeader = true;
		} else {
			Twinkle.fur.pageItems.push({ type: "other", code: line });
		}
		return true;
	});

	var i;
	if (!gotSummaryHeader) {
		// the summary header goes after any initial templates, or at the top, if no template was found 
		i = 0;
		while (Twinkle.fur.pageItems[i] && Twinkle.fur.pageItems[i].type === "template") {  // assuming that the templates are maintenance tags
			i++;
		}
		if (i === 0) {
			Twinkle.fur.pageItems = [{ type: "summaryHeader", code: "== Summary ==" }].concat(Twinkle.fur.pageItems);
		} else {
			Twinkle.fur.pageItems = Twinkle.fur.pageItems.slice(0, i).concat({ type: "summaryHeader", code: "== Summary ==" }).concat(Twinkle.fur.pageItems.slice(i));
		}
	}
	if (!gotLicenseHeader) {
		var foundSummary = false;
		i = -1;
		// looking for the last template we can find
		$.each(Twinkle.fur.pageItems, function(k, item) {
			// never put licensing header before summary header
			if (!foundSummary) {
				if (item.type !== "summaryHeader") {
					return true;
				} else {
					foundSummary = true;
					return true;
				}
			}
			if (item.type === "nonfree" || item.type === "template") {
				i = k;
			}
			return true;
		});
		if (i === -1) {
			// assume no licensing info whatsoever, so adding licensing header at bottom
			Twinkle.fur.pageItems.push({ type: "licenseHeader", code: "== Licensing ==" });
		} else {
			Twinkle.fur.pageItems = Twinkle.fur.pageItems.slice(0, i).concat({ type: "licenseHeader", code: "== Licensing ==" }).concat(Twinkle.fur.pageItems.slice(i));
		}
	}
	
	var params = pageobj.getCallbackParameters();
	var dialog = params.dialog;

	var dialogcontent = document.createElement("div");
	dialogcontent.style.margin = "auto";
	dialogcontent.style.padding = "0.5em";

	var table = document.createElement("table");
	table.className = "wikitable";
	Twinkle.fur.dialogContainer = table;
	dialogcontent.appendChild(table);

	var button;
	if (!gotInformation) {
		button = document.createElement("button");
		button.setAttribute("type", "button");
		$(button).click(Twinkle.fur.addInformation);
		button.textContent = gotNonFreeData ? "Replace {{Non-free image data}} with {{Information}}" : "Add {{Information}}";
		dialogcontent.appendChild(button);
	}

	//if (!gotNonFreeData) {
	//	button = document.createElement("button");
	//	button.setAttribute("type", "button");
	//	$(button).click(Twinkle.fur.addImageData);
	//	button.textContent = gotInformation ? "Replace {{Information}} with {{Non-free image data}}" : "Add {{Non-free image data}}";
	//	dialogcontent.appendChild(button);
	//}
	
	if (!gotInformation && !gotNonFreeData) {
		dialogcontent.appendChild(document.createElement('br'));
	}

	button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addLicense);
	button.textContent = "Add license tag";
	dialogcontent.appendChild(button);

	button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addFUR);
	button.textContent = "Add fair use rationale";
	dialogcontent.appendChild(button);

	button = document.createElement("button");
	button.setAttribute("type", "button");
	$(button).click(Twinkle.fur.addRestriction);
	button.textContent = "Add restriction tag";
	dialogcontent.appendChild(button);

	// submit button
	button = document.createElement("button");
	button.setAttribute("type", "submit");
	$(button).click(Twinkle.fur.savePage);
	button.textContent = "Save page";
	dialogcontent.appendChild(button);

	dialog.setContent( dialogcontent );
	dialog.display();

	Twinkle.fur.refreshDialog();
};

Twinkle.fur.callbacks.evaluate = function twinklefurCallbacksEvaluate(e) {
	var form = e.target;
	
	SimpleWindow.setButtonsEnabled(false);
	Status.init(form);

	var thispage = new Wikipedia.page(wgPageName, 'Modifying page');
	thispage.load(Twinkle.fur.callbacks.savePage);
};

Twinkle.fur.callbacks.savePage = function twinklefurSavePage(pageobj) {
	var text = pageobj.getPageText();

	// IMPORTANT: If modifying the editing logic in this function, it is vital that the display
	// logic in refreshDialog() above is changed to match (WYSIWYG principle applies).

	var index = 0;
	var result;

	// find the summary header, make sure to be below it (place summary header if not there)
	var regExInitialTemplate = /^\s*\{\{\s*(([^\|\}]+)\s*(\|(?:\{\{[^\{\}]*}}|[^\{\}])*)?)}}\s*/gi;
	var regExFindSummary = /==\s*[Ss]ummary\s*==\s*/;
	if (text.search(regExFindSummary) === -1) {
		// insert the summary header after any leading templates (assuming that they are maintenance tags)
		while (result = text.exec(regExInitialTemplate)) {
			var templatename = result[2].toLowerCase();
			if (templatename.indexOf(" fur") !== -1 || 
					(templatename.indexOf("non-free") !== -1 &&
					templatename.indexOf("non-free image data") === -1 &&
					templatename.indexOf("non-free media data") === -1)) {
				break;
			}
			index += result[0].length;
		}
		text = text.substring(0, index) + "\n\n== Summary ==\n" + text.substring(index);
	}
	index = text.search(regExFindSummary);

	// get rid of disputed templates (where the problem should now be corrected)
	var regExFindNoSource = /\{\{(Di-no source|No source|Unspecified|Unknownsource|Fairuseunknownsource|Fuus|Nosource|No source since|No source notified|No info|Nosources|Di-no-source)(.*)}}\n*/i;
	var regExFindDisputed = /\{\{(Di-disputed fair use rationale|Di-disputed rationale|Improve rationale|Di-missing article links)(.*)}}\n*/i;
	var regExFindNoRationale = /\{\{(Di-no fair use rationale|No rationale|Fairuse rationale needed|Fu-ra-ne|Norat|Norationale|Di-no rationale)(.*)}}\n*/i;
	var regExFindMissingArticleLinks = /\s*\{\{(Di-missing article links)[^}]+?}}\s*/i;  // XXX does this template still exist?

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
	var regExFindDisputedCategory = /(\\,)*\[\[Category:Disputed non-free images(.*)]](\n)*/i;
	text = text.replace(regExFindDisputedCategory, "");
	
	// add in == Licensing == header if not there
	var regExAnyTemplate = /\s*\{\{\s*(([^\|\}]+)\s*(\|(?:\{\{[^\{\}]*}}|[^\{\}])*)?)}}\s*/gi;
	var regExFindLicensing = /\s*==\s*[Ll]icensing(:)?\s*==\s*/;
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

	$.each(Twinkle.fur.pageActions, function(k, action) {
		var actionRegex;
		if (action.type === "add") {
			
		} else if (action.type === "remove") {
			if (action.what === "text") {
				actionRegex = new RegExp("^" + RegExp.escape(action.code) + "$");
				text.replace(actionRegex, "");
			} else if (action.what === "template") {
				actionRegex = new RegExp("{{\s*((" + RegExp.escape(action.code) + ")\s*(\|(?:{{[^{}]*}}|[^{}])*)?)}}", "g");
				text.replace(actionRegex, "");
			}
		}
	});
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
	'Non-free Baseball HoF',
	'Non-free board game cover',
	'Non-free book cover',
	'Non-free character',
	'Non-free cereal box cover',
	'Non-free Cartoon Network image',
	'Non-free comic',
	'Non-free computer icon',
	'Non-free Crown copyright',
	'Non-free currency',
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
	'Non-free newspaper image',
	'Non-free Otto Perry image',
	'Non-free poster',
	'Non-free product cover',
	'Non-free promotional',
	'Non-free Scout logo',
	'Non-free sheet music',
	'Non-free software cover',
	'Non-free software screenshot',
	'Non-free speech',
	'Non-free stamp',
	'Non-free standard test image',
	'Non-free symbol',
	'Non-free television screenshot',
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
	var dialog = new SimpleWindow( 500, 120 );
	dialog.setTitle( "Add license template" );
	dialog.setScriptName( "Twinkle \u00B7 File licensing" );  // U+00B7 MIDDLE DOT

	var form = new QuickForm(function(e) {
		Twinkle.fur.addLicense.callback(e);
		dialog.close();
	});

	var licenseMenu = form.append( {
			type: 'select',
			name: 'license',
			label: 'Add this license: ',
		} );

	// add favorite license tags to drop-down
	licenseMenu.append( { type:'option', label: 'None (do not change license)', value: '' } );

	//if( Twinkle.getPref("furCustomLicenseTags").length ) {  // XXX pref
	//	$.each(Twinkle.getPref('furCustomLicenseTags'), function(value, label) {
	//		licenseMenu.append( { type:'option', label: label, value: value } );
	//	});
	//}

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
	Twinkle.fur.pageActions.push({ type: 'add', what: 'license', code: '{{' + e.target.license.value + '}}' });
	Twinkle.fur.refreshDialog();
};

Twinkle.fur.addFUR = function twinklefurAddFUR() {
	var dialog = new SimpleWindow( 500, 600 );
	dialog.setTitle( "Add fair use rationale" );
	dialog.setScriptName( "Twinkle \u00B7 File licensing" );  // U+00B7 MIDDLE DOT

	var form = new QuickForm(function(e) {
		Twinkle.fur.addFUR.callback(e);
		dialog.close();
	});

	// what should the default fur option be
	var defaulttag = "nonfree";
	if (document.getElementById('catlinks')) {
		$('#catlinks a').each(function(k, link) {
			switch ($(link).attr('title').substring(9)) {
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
					selected: defaulttag === "nonfree",
					tooltip: 'Image or media being used with a non-free license under WP:FURG'
				},
				{
					label: 'Logo',
					value: 'Logo fur',
					selected: defaulttag === "logo",
					tooltip: 'Image or media is a logo used to help the reader identify the organization'
				},
				{
					label: 'Album cover',
					value: 'Album cover fur',
					selected: defaulttag === "album",
					tooltip: 'Image or media is a cover of an album'
				},
				{
					label: 'Book cover',
					value: 'Book cover fur',
					selected: defaulttag === "book",
					tooltip: 'Image or media is a front cover of a book'
				},
				{
					label: 'Film cover',
					value: 'Film cover fur',
					selected: defaulttag === "film",
					tooltip: 'Image or media is a cover of a film'
				},
				//{  XXX add me
				//	label: 'Poster',
				//	value: 'Poster fur',
				//	selected: defaulttag === "poster",
				//	tooltip: 'Image or media is a promotional poster'
				//}
			]
		} );

	form.append( {
			type: 'div',
			label: 'Work area',
			name: 'work_area'
		} );

	form.append( { type: 'submit', label: 'Add to page' } );

	var result = form.render();
	dialog.setContent( result );
	dialog.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	$(result).find('option[name="license"][selected="selected"]')[0].dispatchEvent( evt );
	Twinkle.fur.addFUR.choice(evt);
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
				value: Twinkle.fur.seedValues.title,
				tooltip: "The article in which the image is used."
			} );

		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: Twinkle.fur.seedValues.url
			} );

		work_area.append( {
				type: 'input',
				name: 'source',
				label: 'Other source: ',
				tooltip: "Use this if the source does not have an URL (e.g. you scanned the cover yourself)."
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
				value: Twinkle.fur.seedValues.name,
				tooltip: "The name of the album, if different from article name."
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
				label: 'Owner: ',
				tooltip: "Owner of copyright, if known."
			} );

		work_area.append( {
			type: 'input',
			name: 'useType',
			label: 'Use type',
			tooltip: 'For example, "album", "single", "compilation", etc.'
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
				label: 'Cover artist: ',
				value: Twinkle.fur.seedValues.coverArtist
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
				name: 'title',
				label: 'Film title: ',
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

		work_area.append( {
			type: 'input',
			name: 'useType',
			label: "Use type: ",
			tooltip: 'For example, "video cassette" or "DVD".'
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

	root.replaceChild( work_area.render(), $(root).find('div[name="work_area"]')[0] );
}

Twinkle.fur.addFUR.callback = function twinklefurAddFURCallback(e) {
	var form = e.target;
	var types = form.type;
	var type;
	for( var i = 0; i < types.length; ++i ) {
		if( types[i].checked ) {
			type = types[i].values;
			break;
		}
	}

	var portion, description, resolution, purpose, replaceability, article, website, owner,
		artist, album, label, author, publisher, year, title, distributor, coverArtist,
		useType, useInArticle, scanned, rename, reduce, source;
	if( form.portion ) {
		portion = form.portion.value;
	}
	if( form.description ) {
		description = form.description.value;
	}
	if( form.resolution ) {
		resolution = form.resolution.value;
	}
	if( form.purpose ) {
		purpose = form.purpose.value;
	}
	if( form.replaceability ) {
		replaceability = form.replaceability.value;
	}
	if( form.article ) {
		article = form.article.value;
	}
	if( form.website ) {
		website = form.website.value;
	}
	if( form.source ) {
		source = form.source.value;
	}
	if( form.owner ) {
		owner = form.owner.value;
	}
	if( form.artist ) {
		artist = form.artist.value;
	}
	if( form.album ) {
		album = form.album.value;
	}
	if( form.label ) {
		label = form.label.value;
	}
	if( form.author ) {
		author = form.author.value;
	}
	if( form.publisher ) {
		publisher = form.publisher.value;
	}
	if( form.year ) {
		year = form.year.value;
	}
	if( form.title ) {
		title = form.title.value;
	}
	if( form.distributor ) {
		distributor = form.distributor.value;
	}
	if( form.coverArtist ) {
		coverArtist = form.coverArtist.value;
	}
	var i;
	if( form.useType ) {
		useType = form.useType.value;
	}
	if (form.useInArticle) {
		for (i = 0; i < form.useInArticle.length; i++) {
			if (form.useInArticle[i].checked) {
				useInArticle = form.useInArticle[i].values;
			}
		}
	}
	if (form.scanned) {
		scanned = form.scanned.checked;
	}
	if (form.rename) {
		rename = form.rename.checked;
	}
	if (form.reduce) {
		reduce = form.reduce.checked;
	}


	var template;
	switch (type) {
		case "Album cover fur":
			template = "{{Album cover fur\n" + 
				"| Article           = " + article + "\n" +
				"| Use               = " + useInArticle + "\n" +  //  Choose: Infobox / Header / Section / Artist / other (specify Purpose)
				"<!-- ADDITIONAL INFORMATION -->\n" +
				"| Name              = " + album + "\n" +
				"| Artist            = " + artist + "\n" +
				"| Label             = " + label + "\n" +
				"| Graphic Artist    = " + coverArtist + "\n" +  // XXX this is WRONG methinks
				"| Item              = \n" +  // TODO: currently not supported
				"| Type              = " + useType + "\n" +
				"| Website           = " + website + "\n" +
				"| Owner             = " + owner + "\n" +
				"| Commentary        = \n" +  // TODO: currently not supported
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = " + (scanned ? "Scanned by uploader." : "") + "\n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = " + purpose + "\n" +  // <!-- Must be specified if Use is not Infobox / Header / Section / Artist -->
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}\n";
			break;
		case "Book cover fur":
			template = "{{Book cover fur\n" +
				"| Article           = " + article + "\n" +
				"| Use               = " + useInArticle + "\n" +  //<!--Choose: Infobox / Header / Section / Author / Other -->
				"<!-- OPTIONAL FIELDS -->\n" +
				"| Title             = " + title + "\n" +
				"| Author            = " + author + "\n" +
				"| Publisher         = " + publisher + "\n" +
				"| Cover_artist      = " + coverArtist + "\n" +
				"| Website           = " + website + "\n" +
				"| Owner             = " + owner + "\n" +
				"| Commentary        = \n" +  // TODO: currently not supported
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = " + (scanned ? "Scanned by uploader." : "") + "\n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = " + purpose + "\n" +
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}\n";
			break;
		case "Film cover fur":
			template = "{{Film cover fur\n" +
				"| Format            = " + "" + "\n" + // <!--Choose: Full / Data / Rationale -->  XXX fixme
				"| Article           = " + article + "\n" +
				"| Use               = " + useInArticle + "\n" + // <!--Choose: Infobox / Header / Section / Other --> 
				"<!-- ADDITIONAL INFORMATION -->\n" +
				"| Type              = " + useType + "\n" +
				"| Title             = " + title + "\n" +
				"| Distributor       = " + distributor + "\n" +
				"| Publisher         = \n" +  // TODO: currently not supported
				"| Website           = " + website + "\n" +
				"| Owner             = " + owner + "\n" +
				"| Commentary        = \n" +  // TODO: currently not supported
				"| Other purpose     = " + purpose + "\n" + // <!-- Must be specified if Use is not Infobox / Header / Section -->  XXX fixme
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = " + (scanned ? "Scanned by uploader." : "") + "\n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = \n" +
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}\n";
			break;
		case "Logo fur":
			template = "{{Logo fur\n" +
				"| Article           = " + article + "\n" +
				"| Use               = " + useInArticle + "\n" + // Choose: Infobox / Org / Brand / Product / Public facility / Other
				"<!-- ADDITIONAL INFORMATION -->\n" +
				"| Used for          = " + article + "\n" +  // XXX implement this
				"| Owner             = " + owner + "\n" +
				"| Website           = " + website + "\n" +
				"| History           = " + history + "\n" +  // XXX historical logo, or current one? implement this
				"| Commentary        = \n" +   // TODO: currently not supported
				"<!--OVERRIDE FIELDS -->\n" +
				"| Description       = \n" +
				"| Source            = " + (scanned ? "Scanned by uploader." : "") + "\n" +
				"| Portion           = \n" +
				"| Low resolution    = \n" +
				"| Purpose           = " + purpose + "\n" +  // Must be specified if Use is not Infobox / Org / Brand / Product
				"| Replaceability    = \n" +
				"| Other information = \n" +
				"}}\n";
			break;
		//case "Poster fur":
		//	template = "{{Poster fur\n" +
		//		"| Article           = " + article + "\n" +
		//		"| Use               = " + useInArticle + "\n" +  //<!--Choose: Infobox / Header / Section / Other --> 
		//		"| Media             = \n" +  //<!--Choose: film / tv / event   or leave blank to obtain a default value-->
		//		"<!-- ADDITIONAL INFORMATION -->\n" +
		//		"| Name              = \n" +
		//		"| Distributor       = \n" +
		//		"| Publisher         = \n" +
		//		"| Type              = \n" +
		//		"| Website           = \n" +
		//		"| Owner             = \n" +
		//		"| Commentary        = \n" +
		//		"<!--OVERRIDE FIELDS -->\n" +
		//		"| Description       = \n" +
		//		"| Source            = " + (scanned ? "Scanned by uploader." : "") + "\n" +
		//		"| Portion           = \n" +
		//		"| Low resolution    = \n" +
		//		"| Purpose           = \n" +  //<!-- Must be specified if Use is not Infobox / Header / Section -->
		//		"| Replaceability    = \n" +
		//		"| Other information = \n" +
		//		"}}\n";
		//	break;
	}

	Twinkle.fur.pageActions.push({ type: 'add', what: 'fur', code: template });

	// add image for renaming tag
	if (rename) {
		Twinkle.fur.pageActions.push({ type: 'add', what: 'tag', code: '{{Rename media}}' });  // XXX prompt for parameters
	}

	// add non-free reduce tag
	if (reduce) {
		Twinkle.fur.pageActions.push({ type: 'add', what: 'tag', code: '{{Non-free reduce}}' });
	}
	
	Twinkle.fur.refreshDialog();
};

// Restrictions

Twinkle.fur.restrictionList = [
	{ label: '{{Freedom of panorama}}', value: 'Freedom of panorama' },
	{ label: '{{Insignia}}', value: 'Insignia' },
	{ label: '{{SVG-Logo}}', value: 'SVG-Logo' },
	{ label: '{{Trademark}}', value: 'Trademark' }
];

Twinkle.fur.addRestriction = function twinklefurAddRestriction() {
	var dialog = new SimpleWindow( 350, 200 );
	dialog.setTitle( "Add file usage restriction tag" );
	dialog.setScriptName( "Twinkle \u00B7 File licensing" );  // U+00B7 MIDDLE DOT

	var form = new QuickForm(function(e) {
		Twinkle.fur.addRestriction.callback(e);
		dialog.close();
	});

	form.append({ type: 'header', label: 'Usage restriction tags' });
	form.append({ type: 'checkbox', name: 'tags', list: Twinkle.fur.restrictionList } );

	form.append( { type: 'submit', label: 'Add to page' } );

	dialog.setContent( form.render() );
	dialog.display();
};

Twinkle.fur.addRestriction.callback = function twinklefurAddRestrictionCallback(e) {
	$.each(form.getChecked("tags"), function(k, tag) {
		Twinkle.fur.pageActions.push({ type: 'add', what: 'restriction', code: '{{' + tag + '}}' });
	});
	Twinkle.fur.refreshDialog();
};

// {{Information}}

Twinkle.fur.addInformation = function twinklefurAddInformation() {
	var dialog = new SimpleWindow( 500, 600 );
	dialog.setTitle( "Add {{Information}} summary box" );
	dialog.setScriptName( "Twinkle \u00B7 File licensing" );  // U+00B7 MIDDLE DOT

	var form = new QuickForm(function(e) {
		Twinkle.fur.addInformation.callback(e);
		dialog.close();
	});

	form.append({ type: 'header', label: 'Summary fields' });
	// XXX convert to textareas?
	form.append({
		type: 'input',
		name: 'informationDescription',
		label: 'Description: '
	});
	form.append({
		type: 'input',
		name: 'informationSource',
		label: 'Source: '
	});
	form.append({
		type: 'input',
		name: 'informationDate',
		label: 'Date: '
	});
	form.append({
		type: 'input',
		name: 'informationAuthor',
		label: 'Author: '
	});
	form.append({
		type: 'input',
		name: 'informationPermission',
		label: 'Permission: '
	});
	form.append({
		type: 'input',
		name: 'informationOtherVersions',
		label: 'Other versions: ',
		tooltip: 'Optional.'
	});

	form.append( { type: 'submit', label: 'Add to page' } );

	dialog.setContent( form.render() );
	dialog.display();
};

Twinkle.fur.addInformation.callback = function twinklefurAddInformationCallback(e) {
	var template = '{{Information\n' +
		'| Description    = ' + e.target.informationDescription + '\n' +
		'| Source         = ' + e.target.informationSource + '\n' +
		'| Date           = ' + e.target.informationDate + '\n' +
		'| Author         = ' + e.target.informationAuthor + '\n' +
		'| Permission     = ' + e.target.informationPermission + '\n' +
		'| Other_versions = ' + e.target.informationOtherVersions + '\n' +
		'}}\n';
	Twinkle.fur.pageActions.push({ type: 'add', what: 'information', code: template });
	Twinkle.fur.refreshDialog();
};






















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

			switch (Twinkle.getPref('furImageRemovalMethod'))
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
