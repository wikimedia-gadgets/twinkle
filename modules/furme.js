//<nowiki><pre>

// If FurMeConfig does not exist.
if( typeof( FurMeConfig ) == 'undefined' )
	FurMeConfig = {};

if ( typeof(FurMeConfig.watchMyEdits) == 'undefined' )
	FurMeConfig.watchMyEdits = false;

if( typeof( FurMeConfig.openArticleMode ) == 'undefined' )
	FurMeConfig.openArticleMode = 'none';

if( typeof( FurMeConfig.openAllArticles ) == 'undefined' )
	FurMeConfig.openAllArticles = false;

if( typeof( FurMeConfig.windowHeight ) == 'undefined' )
	FurMeConfig.windowHeight = '680';

if( typeof( FurMeConfig.cleanAmazonURLs ) == 'undefined' )
	FurMeConfig.cleanAmazonURLs = true;
	
if( typeof( FurMeConfig.linkFreeLogo ) == 'undefined' )
	FurMeConfig.linkFreeLogo = false;

if( typeof( FurMeConfig.linkImageTags ) == 'undefined' )
	FurMeConfig.linkImageTags = true;

var seedValues = new Array();
seedValues['name'] = '';
seedValues['artist'] = '';
seedValues['label'] = '';
seedValues['infobox'] = false;
seedValues['title'] = '';
seedValues['url'] = '';
seedValues['resolution'] = '';
seedValues['author'] = '';
seedValues['publisher'] = '';
seedValues['year'] = '';
seedValues['coverArtist'] = '';
seedValues['distributor'] = '';
seedValues['infoboxAlbum'] = false;
seedValues['infoboxSingle'] = false;

// For compatibility with wikEd
if (typeof(window.wikEdProgramVersion) != 'undefined' && readCookie('wikEdDisabled') != '1' && wgAction == "edit")
{
	var wikEdSetupHook = wikEdSetupHook || [];
	wikEdSetupHook.push(furme);
}
else
{
	addOnloadHook(furme);
}

function furme() {
	
	if( wgNamespaceNumber == 0 || wgNamespaceNumber == 2 )
	{
		try { var furmeRunning = decodeURIComponent(/[&?]furme=([^&]*)/.exec(window.location.search)[1]); } catch (err) {}
	
		if (furmeRunning == 'true')
			furme.imageRemover();	
	}
	
	if( wgNamespaceNumber == 6 ) {
		editLinkFreeLogo = "javascript:window.location = '"+ wgScript + '?title=' + encodeURIComponent(wgPageName) + '&action=edit&furme=true&freelogo=true' + "'";
		
		switch (FurMeConfig.furmeLocation) 
		{
			case 'toolbox':
				portletLinkLocation = 'p-tb';
				furmeTitleText = 'Apply FUR';
				freeLogoTitleText = 'Free logo';
				imageTagsTitleText = 'Tags';
				break;
			case 'personal':
				portletLinkLocation = 'p-personal';
				furmeTitleText = 'apply FUR';
				freeLogoTitleText = 'free logo';
				imageTagsTitleText = 'tags';
				break;
			case 'filetoc':
				var filetoc = document.getElementById('filetoc');
				if (filetoc != null)
				{
					var li = document.createElement('li');
					li.innerHTML = '<a href="javascript:furme.seedValues()">Apply FUR</a>';
					filetoc.appendChild(li);

					if (FurMeConfig.linkFreeLogo)
					{
						var li = document.createElement('li');
						li.innerHTML = '<a href="' + editLinkFreeLogo + '">Free logo</a>';
						filetoc.appendChild(li);
					}
					
					if (FurMeConfig.linkImageTags)
					{
						var li = document.createElement('li');
						li.innerHTML = '<a href="javascript:furme.imagetags()">Tags</a>';
						filetoc.appendChild(li);
					}
				}
				break;
			case 'tab':
			default:
				portletLinkLocation = 'p-cactions';
				furmeTitleText = 'fur';
				freeLogoTitleText = 'free logo';
				imageTagsTitleText = 'tags';
				break;
		}
		
		// Add the links to the html page
		if( typeof( portletLinkLocation ) != 'undefined' )
		{
			addPortletLink( portletLinkLocation, "javascript:furme.seedValues()", furmeTitleText, "furme-fur", "Apply fair-use rationale to image", "");
			
			if (FurMeConfig.linkFreeLogo)
				addPortletLink( portletLinkLocation, editLinkFreeLogo, freeLogoTitleText, "furme-freelogo", "Change licensing information to free logo", "");
			
			if (FurMeConfig.linkImageTags)
				addPortletLink( portletLinkLocation, "javascript:furme.imagetags()", imageTagsTitleText, "furme-imagetags", "Edit/Add image tags", "");
		}
	}
	
	// Add the FUR template
	if( wgNamespaceNumber == 6 && wgAction == "edit" && /[&?]furme=/.test(window.location.search) ) {
		// Check if we are doing free logo changes
		if (/[&?]freelogo=/.test(window.location.search) || /[&?]furmeImageTags=/.test(window.location.search))
		{
			furmeEditText('');
		}
		else
		{			  
			var type = decodeURIComponent(/[&?]type=([^&]*)/.exec(window.location.search)[1]);
			
			// Open the template page to get copy of template syntax
			var url = wgServer + wgScriptPath + '/api.php?action=query&prop=revisions&titles=User:AWeenieMan/furme/Template:' + type + '&rvprop=content&format=xml'
			var http = new XMLHttpRequest(); // create the HTTP Object
	
			http.open("GET", url, true);
			http.onreadystatechange = function() {
				if( http.readyState == 4 ) {
					xmlDocument = http.responseXML;
					template = xmlDocument.getElementsByTagName('rev')[0].childNodes[0].nodeValue;
					template = template.replace(/(\s*)<[\/]?nowiki>(\s*)/ig, '');
					furmeEditText(template + "\n");
				}
			};
			http.send(null);
		}
	}
}

function furmeEditText(template) {
	var editform = document.editform;
	if (!editform) return;
	var textbox = editform.wpTextbox1;
	if (!textbox) return;
	
	if (/[&?]freelogo=/.test(window.location.search) == false && /[&?]furmeImageTags=/.test(window.location.search) == false) 
	{
		var purpose = decodeURIComponent(/[&?]purpose=([^&]*)/.exec(window.location.search)[1]);
		var portion = decodeURIComponent(/[&?]portion=([^&]*)/.exec(window.location.search)[1]);
		var resolution = decodeURIComponent(/[&?]resolution=([^&]*)/.exec(window.location.search)[1]);
		var replaceability = decodeURIComponent(/[&?]replaceability=([^&]*)/.exec(window.location.search)[1]);
		var description = decodeURIComponent(/[&?]description=([^&]*)/.exec(window.location.search)[1]);
		var article = decodeURIComponent(/[&?]article=([^&]*)/.exec(window.location.search)[1]);
		var owner = decodeURIComponent(/[&?]owner=([^&]*)/.exec(window.location.search)[1]);
		var website = decodeURIComponent(/[&?]website=([^&]*)/.exec(window.location.search)[1]);
		var use = decodeURIComponent(/[&?]use=([^&]*)/.exec(window.location.search)[1]);
		var type = decodeURIComponent(/[&?]type=([^&]*)/.exec(window.location.search)[1]);
		var artist = decodeURIComponent(/[&?]artist=([^&]*)/.exec(window.location.search)[1]);
		var album = decodeURIComponent(/[&?]album=([^&]*)/.exec(window.location.search)[1]);
		var label = decodeURIComponent(/[&?]label=([^&]*)/.exec(window.location.search)[1]);
		var year = decodeURIComponent(/[&?]year=([^&]*)/.exec(window.location.search)[1]);
		var author = decodeURIComponent(/[&?]author=([^&]*)/.exec(window.location.search)[1]);
		var publisher = decodeURIComponent(/[&?]publisher=([^&]*)/.exec(window.location.search)[1]);
		var title = decodeURIComponent(/[&?]bookTitle=([^&]*)/.exec(window.location.search)[1]);
		var coverArtist = decodeURIComponent(/[&?]coverArtist=([^&]*)/.exec(window.location.search)[1]);
		var useType = decodeURIComponent(/[&?]useType=([^&]*)/.exec(window.location.search)[1]);
		var distributor = decodeURIComponent(/[&?]distributor=([^&]*)/.exec(window.location.search)[1]);
		var rename = decodeURIComponent(/[&?]rename=([^&]*)/.exec(window.location.search)[1]);
		var reduce = decodeURIComponent(/[&?]reduce=([^&]*)/.exec(window.location.search)[1]);
		var scanned = decodeURIComponent(/[&?]scan=([^&]*)/.exec(window.location.search)[1]);
	
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
		if (website != 'undefined' && (type == 'Non-free use rationale' || type == 'Historic fur'))
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
		IMAGE TAGS-TAB SPECIFIC CHANGES
	*/
	
	else if (/[&?]furmeImageTags=/.test(window.location.search))
	{
	
		// Add new license tag
		if (/[&?]imageLicense=/.test(window.location.search))
		{
			var imageLicense = decodeURIComponent(/[&?]imageLicense=([^&]*)/.exec(window.location.search)[1]);
			if ( imageLicense != '' )
			{
				// Temporarily rename tags beginning with "Non-free" that should not be removed
				var tagsNoReplace = 'Non-free use rationale|Non-free image data|Non-free image rationale|Non-free media rationale|Non-free reduced|Non-free fair use rationale';
				regExFindTagsNoReplace = '/\{\{\s*([Tt]emplate:)*(' + tagsNoReplace + ')/gi';
				textboxText = textboxText.replace(eval(regExFindTagsNoReplace), '{{%%$2%%');
				
				// Remove all licenses
				regExFindLicense = /\n*\{\{\s*([Tt]emplate:)*([Nn]on-free|[Pp][Dd]|[Cc]C|[Gg]FDL|[Gg]PL)[^\}]*\}\}\s*/g;
				textboxText = textboxText.replace(regExFindLicense, '');
				
				// Rename tags back
				regExFindTagsNoReplace = '/\{\{%%(' + tagsNoReplace + ')%%/gi';
				textboxText = textboxText.replace(eval(regExFindTagsNoReplace), "{{$1");
				
				textboxText = textboxText.replace(regExFindLicensing, "\n\n== Licensing ==\n{{" + imageLicense + "}}\n");
				
				editSummary = 'changing license to ' + imageLicense;
		    }
		}
		
		// Add in maintenance tags
		if (/[&?]imageTags=/.test(window.location.search))
		{
			var imageTags = decodeURIComponent(/[&?]imageTags=([^&]*)/.exec(window.location.search)[1]);
			
			if ( imageTags != '' )
			{
				// Add {{Information}} tag
				if (/\{\{Information\}\}/.test(imageTags))
				{
					imageTags = imageTags.replace(/\{\{Information\}\}\n/, '');
					
					informationTemplate = '{{Information\n| Description    = \n| Source         = \n| Date           = \n| Author         = \n| Permission     = \n| other_versions = \n}}\n';
					
					textboxText = textboxText.replace(regExFindSummary, "== Summary ==\n" + informationTemplate);
					
					if (typeof(editSummary) != 'undefined')
							editSummary += '; ';
					else
						editSummary = '';
					
					editSummary += 'adding {{Information}}';
					
				}
				
				// Ask for new name on Commons
				if (/\{\{subst:ncd\}\}/.test(imageTags))
				{
					var img = prompt( 'enter the image name on Commons (if different than local name), excluding the Image: prefix' );
					if (img != null && img != '')
						imageTags = imageTags.replace(/\{\{subst:ncd\}\}/, '{{subst:ncd|' + img + '}}');
				}
				
				textboxText = imageTags + textboxText;
				
				if (typeof(editSummary) != 'undefined')
						editSummary += '; ';
				else
					editSummary = '';
									
				editSummary += 'adding ' + imageTags.replace('\n', ', ').rtrim(', ');
			}
		}
	
		// Remove any fair use rationale
		if (/[&?]removefur=/.test(window.location.search))
		{
			// Remove any fair use headings
			regExFindFUHeading = /(\s*)==\s*Fair use[^]+?==\s*/ig;
			textboxText = textboxText.replace(regExFindFUHeading, "$1");	
			
			regExFindRationale = /\{\{(.*fur|Non-free use rationale|Fair use rationale|Non-free fair use rationale|Rationale|Non-free media rationale|Non-free image data|Non-free image rationale)[^]+?\}\}\s*/igm;
			textboxText = textboxText.replace(regExFindRationale, '');
		}
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

furme.seedValues = function furmeSeedValues(titleSeed) {
	var urlSeedTemp = '';
	
	/*
		SEE IF THERE IS ONLY ONE ARTICLE TO WHICH THE IMAGE LINKS
	*/
	
	if (titleSeed == 'undefined' || null == titleSeed)
	{
		var linkList = document.getElementById('linkstoimage');
		while (linkList && (!linkList.tagName || linkList.tagName.toLowerCase() != "ul")) linkList = linkList.nextSibling;
		if (typeof linkList != 'undefined' && null != linkList) {
			var pageLinks = linkList.getElementsByTagName("a");
			if (pageLinks.length == 1) seedValues['title'] = pageLinks[0].getAttribute("title");
		}
	}
	else
	{
		seedValues['title'] = titleSeed;
	}
	
	/* 
		SEE IF THERE IS ONLY ONE EXTERNAL URL (ASSUMED TO BE SOURCE)
	*/
	
	extUrlCount = 0;
	regExFindHyperlink = /(javascript|wikimedia|wikipedia)/;
	var linkList = document.getElementById('bodyContent').getElementsByTagName("a");
	if (document.getElementById('imageLicense'))
		var licenseLinkList = document.getElementById('imageLicense').getElementsByTagName("a");
	
	if (typeof linkList != 'undefined' && null != linkList) {
		for( var i = 0; i < linkList.length; ++i ) { 
			
			// Loop through ignore list
			var ignoreLink = false;
			if (typeof licenseLinkList != 'undefined' && null != licenseLinkList) {
				for( var j = 0; j < licenseLinkList.length; ++j ) {
					if (linkList[i].href == licenseLinkList[j].href)
						ignoreLink = true;
				}
			}
			
			if( regExFindHyperlink.test(linkList[i].href) == false 
				&& linkList[i].href.length > 0 
				&& !ignoreLink) { // Ignore internal links and license links
				if (linkList[i].href != urlSeedTemp) {
					urlSeedTemp = linkList[i].href;
					extUrlCount++;
				}
			}
		}
	}
	if (extUrlCount == 1) {
		seedValues['url'] = urlSeedTemp;
	}
	
	// Attempt to find incomplete url
	else if (extUrlCount == 0)
	{
		regExFindURL = /[\s\W]www\.([^<>\s]+?)\.(com|gov|edu|cc|org|net|uk|eu|ca|cn|tv|fm|pl|nz)[^\s"<>]*(?=\b[\s\W])/ig;
		var pageText = document.getElementById('bodyContent').innerHTML;
		findURL = pageText.match(regExFindURL);
	
		if (findURL != null) {
			seedValues['url'] = 'http://' + findURL[0].trimPunctuation().trim().toLowerCase();
		}
		else
		{
			//regExFindURL = /[\s\W]([^<>\s"]+?)\.(com|gov|edu|cc|org|net|uk|eu|ca|cn|tv|fm|pl|nz)[^\s"<>]*(?=\b[\s<\.\?\/])/ig;
			regExFindURL = /[\s\W]([^<>\s"]+?)\.(com|gov|edu|cc|org|net|uk|eu|ca|cn|tv|fm|pl|nz)[^\s"<>]*(?=\b[\s\W])/ig;
			findURL = pageText.match(regExFindURL);
			
			if (typeof findURL != 'undefined' && null != findURL) {
				for( var i = 0; i < findURL.length; ++i ) {
					if (findURL[i].search('http://') == -1 && findURL[i].search(/\/w\/index\.php\?title=/) == -1 && seedValues['url'] == '')
					{
						// Ignore this common one in EXIF data
						if (findURL[i].trimPunctuation().trim().toLowerCase() != 'paint.net') 
							seedValues['url'] = 'http://www.' + findURL[i].trimPunctuation().trim().toLowerCase();
					}
				}
			}
			

		}
	}
	
	/*
		CLEAN AMAZON URLS
	*/
	
	if (FurMeConfig.cleanAmazonURLs == true) {
		if (seedValues['url'].search(/amazon\./) != -1) {
			seedValues['url'] = seedValues['url'].cleanAmazonURL();
		}
	}
	
	/* 
		SEE IF THE IMAGE IS <301PX WIDE/TALL (FAIR USE STANDARD)
	*/
	
	if (document.getElementById('file').getElementsByTagName("img")[0].width < 301 ||
		document.getElementById('file').getElementsByTagName("img")[0].height < 301) {
		seedValues['resolution'] = 'Yes'
	}
	
	/*
		FILL IN PARAMETERS FROM INFOBOX ON ARTICLE
	*/
	
	if (seedValues['title'].length > 0)
	{
	
		var url = wgServer + wgScriptPath + '/api.php?action=query&prop=revisions&titles=' + encodeURIComponent(seedValues['title']) + '&rvprop=content&format=xml'
		var http = new XMLHttpRequest(); // create the HTTP Object
	
		http.open("GET", url, false);
		http.send(null);
		
		if (http.status == 200)
		{
			try
			{
				xmlDocument = http.responseXML;
				articleText = xmlDocument.getElementsByTagName('rev')[0].childNodes[0].nodeValue;			
				
				try { 
					seedValues['artist'] = articleText.match(/Artist\s*=\s*(.*)\s*\|/i)[1].rtrimPipe();
					seedValues['artist'] = seedValues['artist'].replace(/\[*(Various Artists|Various|Multiple|Multiple Artists|N\/A)\]*/i, '');
				} catch(err) {} 
				try { seedValues['author'] = articleText.match(/Author\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
				try { seedValues['coverArtist'] = articleText.match(/Cover_artist\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
				try { 
					seedValues['name'] = articleText.match(/Name\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() ;
					seedValues['name'] = seedValues['name'].replace(/(<br>|<br\/>|<br \/>)/i, ' ');
				} catch(err) {}
				try { seedValues['publisher'] = articleText.match(/Publisher\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
				try { 
					seedValues['year'] = articleText.match(/Release_date\s*=\s*(.*)\s*\|/i)[1];
					seedValues['year'] = seedValues['year'].match(/([1-9][0-9]{3})/ig);
				} 
				catch(err) {}
				try
				{
					seedValues['label'] = articleText.match(/Label\s*=\s*(.*)\s*\|/i)[1].rtrimPipe();
					seedValues['label'] = seedValues['label'].replace(/\s*<(small)>(.*?)<\/\1>/ig, '');
					seedValues['label'] = seedValues['label'].replace(/\s*<br\s*\/*>/ig, ' / ');
					seedValues['label'] = seedValues['label'].replace(/\s*(\(US\)|\(UK\)|\(U\.S\.\)|\(U\.K\.\))\s*/ig, '');
					seedValues['label'] = seedValues['label'].replace(/\s*\{\{flag.*}}\s*/ig, '');
					seedValues['label'] = seedValues['label'].replace(/\s*\|\s*Producer\s*=\s*.*/ig, '');
				}
				catch(err) {}
				try { seedValues['distributor'] = articleText.match(/Distributor\s*=\s*(.*)\s*\|/i)[1].rtrimPipe() } catch(err) {}
				try { var infoboxType = articleText.match(/\{\{Infobox\s?([^\s\|]+)/i)[1].toLowerCase() } catch(err) {}
				if (infoboxType == '' || infoboxType == 'undefined' || null == infoboxType)
					try { var infoboxType = articleText.match(/\{\{([^\s]+)\s?Infobox\s*/i)[1].toLowerCase() } catch(err) {}
				
				if (infoboxType == 'album' || infoboxType == 'albums')
					seedValues['infoboxAlbum'] = true;
				else if (infoboxType == 'single' || infoboxType == 'singles')
					seedValues['infoboxSingle'] = true;
						
				// Check if image is used in infobox
				infoboxImages = articleText.match(/(Cover|logo|logofile|station_logo|company_logo|image|image_name)\s*=\s*(.*)\s*[\|\}]/gi);
				
				if (infoboxImages != null)
				{
					for (var i = 0; i < infoboxImages.length; i++)
					{
						infoboxImages[i] = decodeURIComponent(infoboxImages[i]);
						if (infoboxImages[i].toLowerCase().replace(/_/gi, ' ').search(wgTitle.replace(/(\(|\)|\^|\$|\.|\{|\?|\*|\+|\|)/gi, "\\$1").toLowerCase()) != -1)
							seedValues['infobox'] = true;		
					}
				}
			}
			catch(err) {}
		}
	}
	
	/*
		OPTIONALLY, IF NOT IN INFOBOX, OPEN THE ARTICLE IN A NEW WINDOW/TAB/ETC.
		OR, OPEN ALL ARTICLES
	*/
	
	if (!seedValues['infobox'] && (seedValues['title'].length > 0 || FurMeConfig.openAllArticles) )
	{
		var maxArticlesToOpen = 10;
		if (FurMeConfig.openAllArticles == false)
			maxArticlesToOpen = 1;
			
		if (typeof pageLinks != 'undefined' && null != pageLinks) {
			for (var i = 0; i < Math.min(maxArticlesToOpen, pageLinks.length); i++)
			{
				var url = wgServer + wgArticlePath.replace(/\$1/, pageLinks[i].getAttribute('title')) + '?furme=true&image=' + wgPageName.stripslashes();
	
				switch( FurMeConfig.openArticleMode )
				{
					case 'tab':
						window.open( url, '_tab' + i );
						break;
					case 'browser':
						window.open( url, 'furmearticlewindow' + i );
						break;
					case 'blank':
						window.open( url, '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
						break;
					case 'window':
						window.open( url, 'furmearticlewindow', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
						break;
					case 'none':
					default:
						break;
				}
			}
		}
	}
	
	furme.callback();
}

furme.imagetags = function furmeImageTags() {
		
	var Window = new SimpleWindow( 600, FurMeConfig.windowHeight );
	Window.setTitle( "Edit/Add image tags" );
	var form = new QuickForm( furme.imagetags.evaluate );
	
	var cssNode = document.createElement('style');
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.appendChild( document.createTextNode("")); // Safari bugfix
	document.getElementsByTagName("head")[0].appendChild(cssNode);
	var styles = cssNode.sheet ? cssNode.sheet : cssNode.stylesSheet;
	styles.insertRule("form.quickform fieldset div#furme-two-cols-cleanup { -moz-column-count: 2; }", 0);
	styles.insertRule("form.quickform fieldset div#furme-two-cols-commons { -moz-column-count: 2; }", 0);
	styles.insertRule("form.quickform fieldset div#furme-two-cols-favorites { -moz-column-count: 2; }", 0);
	styles.insertRule("form.quickform fieldset div#furme-two-cols-general { -moz-column-count: 2; }", 0);
	styles.insertRule("form.quickform fieldset div#furme-two-cols-restriction { -moz-column-count: 2; }", 0);
	styles.insertRule("form.quickform fieldset div#furme-two-cols-replacement { -moz-column-count: 2; }", 0);
	
	var licenseMenu = form.append( {
			type: 'select',
			name: 'imageLicense',
			label: 'Change image license to ',
		} );
	
	// ADD FAVORITE LICENSE TAGS TO DROP-DOWN
	if( typeof( FurMeConfig.tagsImageLicenseFavorites ) != 'undefined' )
	{
		licenseMenu.append( { type:'option', label: '', value: '' } );
		
		for ( var i = 0; i < FurMeConfig.tagsImageLicenseFavorites.length; i++)
		{ 
			licenseMenu.append( { type:'option', label: FurMeConfig.tagsImageLicenseFavorites[i], value: FurMeConfig.tagsImageLicenseFavorites[i] } );
		}
	}

	licenseMenu.append( { type:'option', label: '', value: '' } );
	licenseMenu.append( { type:'option', label: '__FREE LICENSES__', value: '' } );
	licenseMenu.append( { type:'option', label: 'Attribution', value: 'Attribution' } );
	licenseMenu.append( { type:'option', label: 'Cc-by', value: 'Cc-by' } );
	licenseMenu.append( { type:'option', label: 'Cc-by-2.0', value: 'Cc-by-2.0' } );
	licenseMenu.append( { type:'option', label: 'Cc-by-3.0', value: 'Cc-by-3.0' } );
	licenseMenu.append( { type:'option', label: 'Cc-by-sa', value: 'Cc-by-sa' } );
	licenseMenu.append( { type:'option', label: 'Cc-by-sa-2.0', value: 'Cc-by-sa-2.0' } );
	licenseMenu.append( { type:'option', label: 'Cc-by-sa-3.0', value: 'Cc-by-sa-3.0' } );
	licenseMenu.append( { type:'option', label: 'Cc-sa', value: 'Cc-sa' } );
	licenseMenu.append( { type:'option', label: 'Free screenshot', value: 'Free screenshot' } );
	licenseMenu.append( { type:'option', label: 'GFDL-self', value: 'GFDL-self' } );
	licenseMenu.append( { type:'option', label: 'GFDL-presumed', value: 'GFDL-presumed' } );
	licenseMenu.append( { type:'option', label: 'GPL', value: 'GPL' } );
	licenseMenu.append( { type:'option', label: 'Money-US', value: 'Money-US' } );
	licenseMenu.append( { type:'option', label: 'PD-art', value: 'PD-art' } );
	licenseMenu.append( { type:'option', label: 'PD-art-life-70', value: 'PD-art-life-70' } );
	licenseMenu.append( { type:'option', label: 'PD-art-US', value: 'PD-art-US' } );
	licenseMenu.append( { type:'option', label: 'PD-Australia', value: 'PD-Australia' } );
	licenseMenu.append( { type:'option', label: 'PD-author', value: 'PD-author' } );
	licenseMenu.append( { type:'option', label: 'PD-because', value: 'PD-because' } );
	licenseMenu.append( { type:'option', label: 'PD-BritishGov', value: 'PD-BritishGov' } );
	licenseMenu.append( { type:'option', label: 'PD-Canada', value: 'PD-Canada' } );
	licenseMenu.append( { type:'option', label: 'PD-font', value: 'PD-font' } );
	licenseMenu.append( { type:'option', label: 'PD-ineligible', value: 'PD-ineligible' } );
	licenseMenu.append( { type:'option', label: 'PD-Italy', value: 'PD-Italy' } );
	licenseMenu.append( { type:'option', label: 'PD-link', value: 'PD-link' } );
	licenseMenu.append( { type:'option', label: 'PD-old', value: 'PD-old' } );
	licenseMenu.append( { type:'option', label: 'PD-old-50', value: 'PD-old-50' } );
	licenseMenu.append( { type:'option', label: 'PD-old-100', value: 'PD-old-100' } );
	licenseMenu.append( { type:'option', label: 'PD-release', value: 'PD-release' } );
	licenseMenu.append( { type:'option', label: 'PD-Russia-2008', value: 'PD-Russia-2008' } );
        licenseMenu.append( { type:'option', label: 'PD-shape', value: 'PD-shape' } );
	licenseMenu.append( { type:'option', label: 'PD-self', value: 'PD-self' } );
	licenseMenu.append( { type:'option', label: 'PD-text', value: 'PD-text' } );
	licenseMenu.append( { type:'option', label: 'PD-US', value: 'PD-US' } );
	licenseMenu.append( { type:'option', label: 'PD-US-1923-abroad', value: 'PD-US-1923-abroad' } );
	licenseMenu.append( { type:'option', label: 'PD-US-patent', value: 'PD-US-patent' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov', value: 'PD-USGov' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-CIA', value: 'PD-USGov-CIA' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Congress', value: 'PD-USGov-Congress' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Congress-Bio', value: 'PD-USGov-Congress-Bio' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-DOC-Census', value: 'PD-USGov-DOC-Census' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-DOC-NOAA', value: 'PD-USGov-DOC-NOAA' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-DOJ', value: 'PD-USGov-DOJ' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Interior-NPS', value: 'PD-USGov-Interior-NPS' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Interior-USGS', value: 'PD-USGov-Interior-USGS' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Military', value: 'PD-USGov-Military' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Military-Air Force', value: 'PD-USGov-Military-Air Force' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Military-Army', value: 'PD-USGov-Military-Army' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Military-Marines', value: 'PD-USGov-Military-Marines' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-Military-Navy', value: 'PD-USGov-Military-Navy' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-NASA', value: 'PD-USGov-NASA' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-USDA',value: 'PD-USGov-USDA' } );
	licenseMenu.append( { type:'option', label: 'PD-USGov-USDA-FS', value: 'PD-USGov-USDA-FS' } );
	licenseMenu.append( { type:'option', label: 'PD-user', value: 'PD-user' } );
	licenseMenu.append( { type:'option', label: 'Wikipedia-screenshot', value: 'Wikipedia-screenshot' } );
	licenseMenu.append( { type:'option', label: '__NON-FREE LICENSES__', value: '' } );
	licenseMenu.append( { type:'option', label: 'Non-free 2D art', value: 'Non-free 2D art' } );
	licenseMenu.append( { type:'option', label: 'Non-free 3D art', value: 'Non-free 3D art' } );
	licenseMenu.append( { type:'option', label: 'Non-free album cover', value: 'Non-free album cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free audio sample', value: 'Non-free audio sample' } );
	licenseMenu.append( { type:'option', label: 'Non-free AUSPIC', value: 'Non-free AUSPIC' } );
	licenseMenu.append( { type:'option', label: 'Non-free Australian DoD', value: 'Non-free Australian DoD' } );
	licenseMenu.append( { type:'option', label: 'Non-free Baseball HoF', value: 'Non-free Baseball HoF' } );
	licenseMenu.append( { type:'option', label: 'Non-free board game cover', value: 'Non-free board game cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free book cover', value: 'Non-free book cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free British Columbia traffic sign', value: 'Non-free British Columbia traffic sign' } );
	licenseMenu.append( { type:'option', label: 'Non-free character', value: 'Non-free character' } );
	licenseMenu.append( { type:'option', label: 'Non-free cereal box cover', value: 'Non-free cereal box cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free Cartoon Network image', value: 'Non-free Cartoon Network image' } );
	licenseMenu.append( { type:'option', label: 'Non-free comic', value: 'Non-free comic' } );
	licenseMenu.append( { type:'option', label: 'Non-free computer icon', value: 'Non-free computer icon' } );
	licenseMenu.append( { type:'option', label: 'Non-free Crown copyright', value: 'Non-free Crown copyright' } );
	licenseMenu.append( { type:'option', label: 'Non-free currency', value: 'Non-free currency' } );
	licenseMenu.append( { type:'option', label: 'Non-free currency-EU banknote', value: 'Non-free currency-EU banknote' } );
	licenseMenu.append( { type:'option', label: 'Non-free currency-EU coin common', value: 'Non-free currency-EU coin common' } );
	licenseMenu.append( { type:'option', label: 'Non-free currency-EU coin national', value: 'Non-free currency-EU coin national' } );
	licenseMenu.append( { type:'option', label: 'Non-free currency-New Zealand', value: 'Non-free currency-New Zealand' } );
	licenseMenu.append( { type:'option', label: 'Non-free currency-Switzerland', value: 'Non-free currency-Switzerland' } );
	licenseMenu.append( { type:'option', label: 'Non-free currency-UK', value: 'Non-free currency-UK' } );
	licenseMenu.append( { type:'option', label: 'Non-free Denver Public Library image', value: 'Non-free Denver Public Library image' } );
	licenseMenu.append( { type:'option', label: 'Non-free ESA media', value: 'Non-free ESA media' } );
	licenseMenu.append( { type:'option', label: 'Non-free fair use in', value: 'Non-free fair use in' } );
	licenseMenu.append( { type:'option', label: 'Non-free film screenshot', value: 'Non-free film screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free flag', value: 'Non-free flag' } );
	licenseMenu.append( { type:'option', label: 'Non-free game cover', value: 'Non-free game cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free game screenshot', value: 'Non-free game screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free historic image', value: 'Non-free historic image' } );
	licenseMenu.append( { type:'option', label: 'Non-free logo', value: 'Non-free logo' } );
	licenseMenu.append( { type:'option', label: 'Non-free magazine cover', value: 'Non-free magazine cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free Mozilla logo', value: 'Non-free Mozilla logo' } );
	licenseMenu.append( { type:'option', label: 'Non-free music video screenshot', value: 'Non-free music video screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free NASA logo', value: 'Non-free NASA logo' } );
	licenseMenu.append( { type:'option', label: 'Non-free newspaper image', value: 'Non-free newspaper image' } );
	licenseMenu.append( { type:'option', label: 'Non-free parody', value: 'Non-free parody' } );
	licenseMenu.append( { type:'option', label: 'Non-free Otto Perry image', value: 'Non-free Otto Perry image' } );
	licenseMenu.append( { type:'option', label: 'Non-free poster', value: 'Non-free poster' } );
	licenseMenu.append( { type:'option', label: 'Non-free product cover', value: 'Non-free product cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free promotional', value: 'Non-free promotional' } );
	licenseMenu.append( { type:'option', label: 'Non-free recording medium', value: 'Non-free recording medium' } );
	licenseMenu.append( { type:'option', label: 'Non-free Robert Richardson image', value: 'Non-free Robert Richardson image' } );
	licenseMenu.append( { type:'option', label: 'Non-free Scout logo', value: 'Non-free Scout logo' } );
	licenseMenu.append( { type:'option', label: 'Non-free sheet music', value: 'Non-free sheet music' } );
	licenseMenu.append( { type:'option', label: 'Non-free software cover', value: 'Non-free software cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free software screenshot', value: 'Non-free software screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free speech', value: 'Non-free speech' } );
	licenseMenu.append( { type:'option', label: 'Non-free stamp', value: 'Non-free stamp' } );
	licenseMenu.append( { type:'option', label: 'Non-free standard test image', value: 'Non-free standard test image' } );
	licenseMenu.append( { type:'option', label: 'Non-free symbol', value: 'Non-free symbol' } );
	licenseMenu.append( { type:'option', label: 'Non-free television screenshot', value: 'Non-free television screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free unsure', value: 'Non-free unsure' } );
	licenseMenu.append( { type:'option', label: 'Non-free USGov-IEEPA sanctions', value: 'Non-free USGov-IEEPA sanctions' } );
	licenseMenu.append( { type:'option', label: 'Non-free USGov-USPS stamp', value: 'Non-free USGov-USPS stamp' } );
	licenseMenu.append( { type:'option', label: 'Non-free video cover', value: 'Non-free video cover' } );
	licenseMenu.append( { type:'option', label: 'Non-free video screenshot', value: 'Non-free video screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free vodcast screenshot', value: 'Non-free vodcast screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free web screenshot', value: 'Non-free web screenshot' } );
	licenseMenu.append( { type:'option', label: 'Non-free Wikimedia logo', value: 'Non-free Wikimedia logo' } );
	licenseMenu.append( { type:'option', label: 'Non-free with NC', value: 'Non-free with NC' } );
	licenseMenu.append( { type:'option', label: 'Non-free with ND', value: 'Non-free with ND' } );
	licenseMenu.append( { type:'option', label: 'Non-free with permission', value: 'Non-free with permission' } );
	licenseMenu.append( { type:'option', label: 'Non-free WWE photo', value: 'Non-free WWE photo' } );
	
	form.append( { type:'submit', label: 'Submit' } );
	
	// ADD FAVORITE LICENSE TAGS TO DROP-DOWN
	if( typeof( FurMeConfig.tagsImageTagFavorites ) != 'undefined' )
	{
		var fieldSet = form.append( {
			type: 'field',
			label: 'Favorites'
			} );
	
		fieldsetDiv = fieldSet.append( {
				type: 'div', 
				id: 'furme-two-cols-favorites'
			} ); 
				
		for ( var i = 0; i < FurMeConfig.tagsImageTagFavorites.length; i++)
		{ 
			fieldsetDiv.append( { type:'checkbox', name:'imageTags', list: [ {label: FurMeConfig.tagsImageTagFavorites[i], value: FurMeConfig.tagsImageTagFavorites[i] } ] } );
		}
	}
	
	var fieldSet = form.append( {
			type: 'field',
			label: 'General'
			} );
	
	fieldsetDiv = fieldSet.append( {
			type: 'div', 
			id: 'furme-two-cols-general'
		} ); 
	
	fieldsetDiv.append( {
			type: 'checkbox',
			name: 'imageTags',
			list: [
				{ label: '{{Information}}', value: '{{Information}}' }
			]
		} );
	
	var fieldSet = form.append( {
			type: 'field',
			label: 'Cleanup'
			} );
	
	fieldsetDiv = fieldSet.append( {
			type: 'div', 
			id: 'furme-two-cols-cleanup'
		} ); 
		
	fieldsetDiv.append( {
			type: 'checkbox',
			name: 'imageTags',
			list: [
				{ label: '{{Artifacts}}', value: '{{Artifacts}}' },
				{ label: '{{BadJPEG}}', value: '{{BadJPEG}}' },
				{ label: '{{BadGIF}}', value: '{{BadGIF}}' },
				{ label: '{{BadFormat}}', value: '{{BadFormat}}' },
				{ label: '{{Cleanup-image}}', value: '{{Cleanup-image}}' },
				{ label: '{{ClearType}}', value: '{{ClearType}}' },
				{ label: '{{Image-blownout}}', value: '{{Image-blownout}}' },
				{ label: '{{Image-out-of-focus}}', value: '{{Image-out-of-focus}}' },
				{ label: '{{Image-Poor-Quality}}', value: '{{Image-Poor-Quality}}' },
				{ label: '{{Image-underexposure}}', value: '{{Image-underexposure}}' },
				{ label: '{{Imagewatermark}}', value: '{{Imagewatermark}}' },
				{ label: '{{NoCoins}}', value: '{{NoCoins}}' },
				{ label: '{{Non-free reduce}}', value: '{{Non-free reduce}}' }, 
				{ label: '{{Overcompressed JPEG}}', value: '{{Overcompressed JPEG}}' },
				{ label: '{{Opaque}}', value: '{{Opaque}}' },
				{ label: '{{RemoveBorder}}', value: '{{RemoveBorder}}' },
				{ label: '{{Rename media}}', value: '{{Rename media}}' },
				{ label: '{{ShouldBeSVG}}', value: '{{ShouldBeSVG}}' },
				{ label: '{{ShouldBeJPEG}}', value: '{{ShouldBeJPEG}}' },
				{ label: '{{ShouldBePNG}}', value: '{{ShouldBePNG}}' }
				
			]
		} );
	
	var fieldSet = form.append( {
			type: 'field',
			label: 'Commons'
			} );
	
	fieldsetDiv = fieldSet.append( {
			type: 'div', 
			id: 'furme-two-cols-commons'
		} ); 
		
	fieldsetDiv.append( {
			type: 'checkbox',
			name: 'imageTags',
			list: [
                                { label: '{{Do not move to Commons}}', value: '{{Do not move to Commons}}' },
				{ label: '{{Copy to Wikimedia Commons}}', value: '{{Copy to Wikimedia Commons}}' },
				{ label: '{{KeepLocal}}', value: '{{KeepLocal}}' },
				{ label: '{{NowCommons}}', value: '{{subst:ncd}}' }, 
				{ label: '{{ShadowsCommons}}', value: '{{ShadowsCommons}}' }
			]
		} );
	
	var fieldSet = form.append( {
			type: 'field',
			label: 'Restrictions'
			} );
	
	fieldsetDiv = fieldSet.append( {
			type: 'div', 
			id: 'furme-two-cols-restriction'
		} ); 
	
	fieldsetDiv.append( {
			type: 'checkbox',
			name: 'imageTags',
			list: [
				{ label: '{{Freedom of panorama}}', value: '{{Freedom of panorama}}' },
				{ label: '{{Insignia}}', value: '{{Insignia}}' },
				{ label: '{{SVG-Logo}}', value: '{{SVG-Logo}}' },
				{ label: '{{Trademark}}', value: '{{Trademark}}' }

			]
		} );
	
	var fieldSet = form.append( {
			type: 'field',
			label: 'Replacement Available'
			} );
	
	fieldsetDiv = fieldSet.append( {
			type: 'div', 
			id: 'furme-two-cols-replacement'
		} ); 
	
	fieldsetDiv.append( {
			type: 'checkbox',
			name: 'imageTags',
			list: [
				{ label: '{{PNG version available}}', value: '{{PNG version available}}' },
				{ label: '{{Vector version available}}', value: '{{Vector version available}}' }
			]
		} );
	
	var result = form.render();
	Window.setContent( result );
	Window.display();
	
}

furme.imagetags.evaluate = function furmeImageTagsEvaluate(event) {
	var imageTags = '';
	var imageLicense = '';
	
	if ( /[&?]furme-scroller=([^&]*)/.exec(window.location.search) ) {
		var scrollerStarted = /[&?]furme-scroller=([^&]*)/.exec(window.location.search)[1];
	}
	if( event.target.imageLicense ) {
		imageLicense = event.target.imageLicense.options[event.target.imageLicense.selectedIndex].value
	}
	if (typeof event.target.imageTags != 'undefined' && null != event.target.imageTags) {
		for (var i = 0; i < event.target.imageTags.length; i++)
		{
			if (event.target.imageTags[i].checked)
				imageTags += encodeURIComponent(event.target.imageTags[i].value + '\n');
		}
	}

	window.location = wgScript + '?title=' + encodeURIComponent(wgPageName) + '&action=edit&furme=true&furmeImageTags=true&furme-scroller=' + scrollerStarted + '&imageLicense=' + imageLicense + '&imageTags=' + imageTags;
	
}

furme.callback = function furmeCallback() {
	var defaultGeneric = true;
	var defaultAlbumCover = false;
	var defaultBook = false;
	var defaultLogo = false;
	var defaultFilm = false;
	var defaultIndex = 0;
	
	var Window = new SimpleWindow( 600, FurMeConfig.windowHeight );
	Window.setTitle( "Apply fair-use rationale to image" );
	var form = new QuickForm( furme.callback.evaluate );
	
	if ( /[&?]furme-scroller=([^&]*)/.exec(window.location.search) )
		var scrollerStarted = decodeURIComponent(/[&?]furme-scroller=([^&]*)/.exec(window.location.search)[1]);
	else
		var scrollerStarted = 'false';
	
	/*
		WHAT SHOULD THE DEFAULT FUR OPTION BE
	*/
	if (document.getElementById('catlinks'))
		var linkList = document.getElementById('catlinks').getElementsByTagName("a");
	
	if (linkList != 'undefined' && null != linkList)
	{
		for( var i = 0; i < linkList.length; ++i ) { 
			switch (linkList[i].title)
			{
				case 'Category:Album covers':
					defaultAlbumCover = true;
					defaultGeneric = false;
					defaultIndex = 2;
					break;
				case 'Category:All non-free Logos':
					defaultLogo = true;
					defaultGeneric = false;
					defaultIndex = 1;
					break;
				case 'Category:Book covers':
					defaultBook = true;
					defaultGeneric = false;
					defaultIndex = 3;
					break;
				case 'Category:DVD covers':
					defaultFilm = true;
					defaultGeneric = false;
					defaultIndex = 4;
					break;
				default:
					break;
			}
		}
	}
	
	if ( scrollerStarted == 'true' )
	{
		form.append( {
			type: 'button',
			name: 'furme-scroller-button',
			label: 'FurMe Scroller: Skip Image',
			event: furme.callback.next
		} );
		
		form.append( {
			type: 'button',
			name: 'furme-scroller-cancel',
			label: 'FurMe Scroller: Stop!',
			event: furme.callback.stopScrolling
		} );
	}
	
	var field = form.append( {
			type: 'field',
			label: 'Type of fair-use rationale wanted'
		} );
	
	field.append( {
			type: 'radio',
			name: 'type',
			event: furme.callback.choice,
			list: [
				{
					label: 'Non-free use',
					value: 'Non-free use rationale',
					checked: defaultGeneric,
					tooltip: 'Image or media being used with a non-free license under WP:FURG'
				},
				{
					label: 'Logo',
					value: 'Logo fur',
					checked: defaultLogo,
					tooltip: 'Image or media is a logo used to help the reader identify the organization'
				},
				{
					label: 'Album Cover',
					value: 'Album cover fur',
					checked: defaultAlbumCover,
					tooltip: 'Image or media is a cover of an album'
				},
				{
					label: 'Book Cover',
					value: 'Book cover fur',
					checked: defaultBook,
					tooltip: 'Image or media is a front cover of a book'
				},
				{
					label: 'Film Cover',
					value: 'Film cover fur',
					checked: defaultFilm,
					tooltip: 'Image or media is a cover of a film'
				},
				{
					label: 'Historic Photo',
					value: 'Historic fur',
					tooltip: 'Image or media is a historically significant photograph'
				}
			]
		} );
	form.append( {
			type: 'div',
			label: 'Work area',
			name: 'work_area'
		} );
	var result = form.render();
	Window.setContent( result );
	Window.display();
 
	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.type[defaultIndex].dispatchEvent( evt );
	furme.callback.choice(evt);
}

furme.callback.next = function furmeCallbackNext(event) {
	window.location = wgArticlePath.replace(/\$1/, wgPageName);	
}

furme.callback.stopScrolling = function furmeCallbackStopScrolling(event) {
	document.cookie = 'FurMeScroller-Counter=;path=/;expires=-1';
	document.cookie = 'FurMeScroller-Images=;path=/;expires=-1';
	window.location = wgArticlePath.replace(/\$1/, wgPageName);	
}

furme.callback.choice = function furmeCallbackChoose(event) {	
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
				value: seedValues['title']
			} );
	
		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Source: ',
				value: seedValues['url']
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
				label: 'Low Resolution: ',
				value: seedValues['resolution'],
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
				value: seedValues['title']
			} );
	
		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: seedValues['url']
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
						label: 'Infobox (' + seedValues['infobox'] + ')',
						value: 'Infobox',
						checked: seedValues['infobox'],
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
				value: seedValues['title']
			} );
				
		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: seedValues['url']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'artist',
				label: 'Artist: ',
				value: seedValues['artist']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'album',
				label: 'Album: ',
				value: seedValues['name']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'label',
				label: 'Label: ',
				value: seedValues['label']
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
						checked: seedValues['infoboxAlbum']
					},
					{
						label: 'Single',
						value: 'single',
						checked: seedValues['infoboxSingle']
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
						label: 'Infobox (' + seedValues['infobox'] + ')',
						value: 'Infobox',
						checked: seedValues['infobox'],
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
				value: seedValues['title']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'title',
				label: 'Title: ',
				value: seedValues['name']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'author',
				label: 'Author: ',
				value: seedValues['author']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'publisher',
				label: 'Publisher: ',
				value: seedValues['publisher']
			} );
	
		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: seedValues['url']
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
				value: seedValues['coverArtist']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'year',
				label: 'Year: ',
				value: seedValues['year']
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
						label: 'Infobox (' + seedValues['infobox'] + ')',
						value: 'Infobox',
						checked: seedValues['infobox'],
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
				value: seedValues['title']
			} );
				
		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Website: ',
				value: seedValues['url']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'album', // share the same parameter as album cover
				label: 'Film: ',
				value: seedValues['name']
			} );
		
		work_area.append( {
				type: 'input',
				name: 'distributor',
				label: 'Distributor: ',
				value: seedValues['distributor']
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
						label: 'Infobox (' + seedValues['infobox'] + ')',
						value: 'Infobox',
						checked: seedValues['infobox'],
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
	
	case 'Historic fur':
		work_area.append( {
				type: 'input',
				name: 'article',
				label: 'Article: ',
				value: seedValues['title']
			} );
	
		work_area.append( {
				type: 'input',
				name: 'website',
				label: 'Source: ',
				value: seedValues['url']
			} );	
	}

	work_area.append( { type:'submit' } );
	work_area = work_area.render();
	root.replaceChild( work_area, root.lastChild );
	
	var refreshImageContainer = document.getElementsByName('article')[0].parentNode.appendChild( document.createElement( 'span' ) );
	var refreshImage = refreshImageContainer.appendChild( document.createElement( 'img' ) );
	refreshImage.setAttribute('src', 'http://upload.wikimedia.org/wikipedia/commons/6/6e/Reload_page.png');
	refreshImage.setAttribute('onclick', 'furme.refreshValues()');
	refreshImage.setAttribute('title', 'Refresh values');
	refreshImage.style.width = '18px';
	refreshImage.style.cursor = 'pointer';

}

furme.refreshValues = function furmeRefreshValues() {
	var newArticle = document.getElementsByName('article')[0].value
	document.body.removeChild( document.getElementsByName('id')[0].parentNode.parentNode );
	furme.seedValues(newArticle);
}
 
furme.callback.evaluate = function furmeCallbackEvaluate(event) {
	var types = event.target.type;
	for( var i = 0; i < types.length; ++i ) {
		if( types[i].checked ) {
			var type = types[i].value;
			break;
		}
	}
	
	if ( /[&?]furme-scroller=([^&]*)/.exec(window.location.search) ) {
		var scrollerStarted = /[&?]furme-scroller=([^&]*)/.exec(window.location.search)[1];
	}
	if( event.target.portion ) {
		var portion = encodeURIComponent(event.target.portion.value);
	}
	if( event.target.description ) {
		var description = encodeURIComponent(event.target.description.value);
	}
	if( event.target.resolution ) {
		var resolution = encodeURIComponent(event.target.resolution.value);
	}
	if( event.target.purpose ) {
		var purpose = encodeURIComponent(event.target.purpose.value);
	}
	if( event.target.replaceability ) {
		var replaceability = encodeURIComponent(event.target.replaceability.value);
	}
	if( event.target.article ) {
		var article = encodeURIComponent(event.target.article.value);
	}
	if( event.target.website ) {
		var website = encodeURIComponent(event.target.website.value);
	}
	if( event.target.owner ) {
		var owner = encodeURIComponent(event.target.owner.value);
	}
	if( event.target.artist ) {
		var artist = encodeURIComponent(event.target.artist.value);
	}
	if( event.target.album ) {
		var album = encodeURIComponent(event.target.album.value);
	}
	if( event.target.label ) {
		var label = encodeURIComponent(event.target.label.value);
	}
	if( event.target.author ) {
		var author = encodeURIComponent(event.target.author.value);
	}
	if( event.target.publisher ) {
		var publisher = encodeURIComponent(event.target.publisher.value);
	}
	if( event.target.year ) {
		var year = encodeURIComponent(event.target.year.value);
	}
	if( event.target.title ) {
		var title = encodeURIComponent(event.target.title.value);
	}
	if( event.target.distributor ) {
		var distributor = encodeURIComponent(event.target.distributor.value);
	}
	if( event.target.coverArtist ) {
		var coverArtist = encodeURIComponent(event.target.coverArtist.value);
	}
	if (typeof event.target.useType != 'undefined' && null != event.target.useType) {
		for (var i=0; i < event.target.useType.length; i++) {
			if (event.target.useType[i].checked) {
				var useType = encodeURIComponent(event.target.useType[i].value);
			}
		}
	}
	if (typeof event.target.useInArticle != 'undefined' && null != event.target.useInArticle) {
		for (var i=0; i < event.target.useInArticle.length; i++) {
			if (event.target.useInArticle[i].checked) {
				var useInArticle = encodeURIComponent(event.target.useInArticle[i].value);
			}
		}
	}
	if (typeof event.target.scanned != 'undefined' && null != event.target.scanned) {
		if (event.target.scanned.checked)
			var scanned = encodeURIComponent(event.target.scanned.value);
	}
	if (typeof event.target.rename != 'undefined' && null != event.target.rename) {
		if (event.target.rename.checked)
			var rename = encodeURIComponent(event.target.rename.value);
	}
	if (typeof event.target.reduce != 'undefined' && null != event.target.reduce) {
		if (event.target.reduce.checked)
			var reduce = encodeURIComponent(event.target.reduce.value);
	}

	window.location = wgScript + '?title=' + encodeURIComponent(wgPageName) + '&action=edit&furme=true&furme-scroller=' + scrollerStarted + '&type=' + type + '&article=' + article + '&website=' + website + '&portion=' + portion + '&resolution=' + resolution + '&purpose=' + purpose + '&description=' + description + '&replaceability=' + replaceability + '&use=' + useInArticle + '&useType=' + useType + '&owner=' + owner + '&artist=' + artist + '&album=' + album + '&label=' + label + '&rename=' + rename + '&scan=' + scanned + '&author=' + author + '&publisher=' + publisher + '&year=' + year + '&bookTitle=' + title + '&coverArtist=' + coverArtist + '&distributor=' + distributor + '&reduce=' + reduce;

}

furme.imageRemover = function furmeImageRemover()
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

//</pre></nowiki>