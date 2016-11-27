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
				label: $._._('tw-sharedip-shared-ip-label'),
				value: $._._('tw-sharedip-shared-ip'),
				tooltip: $._._('tw-sharedip-share-ip-tooltip')
			},
			{
				label: $._._('tw-sharedip-shared-ip-edu-label'),
				value: $._._('tw-sharedip-shared-ip-edu')
			},
			{
				label: $._._('tw-sharedip-shared-ip-corp-label'),
				value: $._._('tw-sharedip-shared-ip-corp')
			},
			{
				label: $._._('tw-sharedip-shared-ip-public-label'),
				value: $._._('tw-sharedip-shared-ip-public')
			},
			{
				label: $._._('tw-sharedip-shared-ip-gov-label'),
				value: $._._('tw-sharedip-shared-ip-gov')
			},
			{
				label: $._._('tw-sharedip-dynamic-ip-label'),
				value: $._._('tw-sharedip-dynamic-ip')
			},
			{
				label: $._._('tw-sharedip-static-ip-label'),
				value: $._._('tw-sharedip-static-ip')
			},
			{
				label: $._._('tw-sharedip-isp-label'),
				value: $._._('tw-sharedip-isp')
			},
			{
				label: $._._('tw-sharedip-mobile-ip-label'),
				value: $._._('tw-sharedip-mobile-ip')
			},
			{
				label: $._._('tw-sharedip-whois-label'),
				value: $._._('tw-sharedip-whois')
			}
		];
	break;
	case 'de':
		Twinkle.shared.standardList = [
			{
				label: $._._('tw-sharedip-shared-ip-label'),
				value: $._._('tw-sharedip-shared-ip'),
				tooltip: $._._('tw-sharedip-share-ip-tooltip')
			},
			{
				label: $._._('tw-sharedip-shared-ip-edu-label'),
				value: $._._('tw-sharedip-shared-ip-edu')
			},
		];
	break;
};

})(jQuery);


//</nowiki>
