//<nowiki>


(function($){


/*
 ****************************************
 *** twinklel10n.js: Localization module
 ****************************************
 */


// Adding translations is easy, for example:
TwinkleMessages.de = {
	'tw-core-portlet-name': 'DE TW',
};

// Localizing twinkle is also easy, for example:
if( mw.config.get('wgUserLanguage') == 'de' ){
	Twinkle.shared.standardList = [
		{
			label: $.i18n._('tw-sharedip-shared-ip-label'),
			value: $.i18n._('tw-sharedip-shared-ip'),
			tooltip: $.i18n._('tw-sharedip-share-ip-tooltip')
		},
		{
			label: $.i18n._('tw-sharedip-shared-ip-edu-label'),
			value: $.i18n._('tw-sharedip-shared-ip-edu')
		},
	];
};

})(jQuery);


//</nowiki>
