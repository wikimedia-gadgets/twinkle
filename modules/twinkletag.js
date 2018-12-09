

var query = {
	"action": "query",
	"format": "xml",
	"prop": "templates",
	"titles": Morebits.pageNameNorm,
	"tlnamespace": "10"
}

var api = new Morebits.wiki.api( "Templates on this page", query, Twinkle.tag.processTemplateList );

Twinkle.tag.processTemplateList = function(apiobj) {
	var templates_xml = $(apiobj.responseXML).find('tl');
	var templates = [];
	$.each(templates_xml, function(idx,value) {
		templates.push($(value).attr('title').slice(9));
	} );

	
	
};