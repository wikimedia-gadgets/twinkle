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
switch( mw.config.get('wgUserLanguage') ) {
	case 'en':
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
			{
				label: $.i18n._('tw-sharedip-shared-ip-corp-label'),
				value: $.i18n._('tw-sharedip-shared-ip-corp')
			},
			{
				label: $.i18n._('tw-sharedip-shared-ip-public-label'),
				value: $.i18n._('tw-sharedip-shared-ip-public')
			},
			{
				label: $.i18n._('tw-sharedip-shared-ip-gov-label'),
				value: $.i18n._('tw-sharedip-shared-ip-gov')
			},
			{
				label: $.i18n._('tw-sharedip-dynamic-ip-label'),
				value: $.i18n._('tw-sharedip-dynamic-ip')
			},
			{
				label: $.i18n._('tw-sharedip-static-ip-label'),
				value: $.i18n._('tw-sharedip-static-ip')
			},
			{
				label: $.i18n._('tw-sharedip-isp-label'),
				value: $.i18n._('tw-sharedip-isp')
			},
			{
				label: $.i18n._('tw-sharedip-mobile-ip-label'),
				value: $.i18n._('tw-sharedip-mobile-ip')
			},
			{
				label: $.i18n._('tw-sharedip-whois-label'),
				value: $.i18n._('tw-sharedip-whois')
			}
		];
	break;
	case 'de':
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
	break;
};

})(jQuery);


//</nowiki>
