// This contains the local configuration specific to the local wiki.
// This would be the only file that local wiki admins would need to edit to
// localise Twinkle to their wiki.

TwinkleLocalConfig = { };

TwinkleLocalConfig.general = {
	"localization": {
		"twinkle-name": "Twinkle",
		
		// status messages
		"info": "Info",
		"complete-reloading": "Complete; reloading talk page in a few seconds",
		"user-talk-modification": ""
	}
};

TwinkleLocalConfig.sharedIP = {
	"tab-label": "Shared IP",
	"tab-tooltip": "?",
	"dialogs": {
		"main": {
			"title": "Shared IP tagging",
			"width": 600,
			"height": 420,
			"footer-links": {
				//"Shared IP templates": "",
				"Twinkle help": "WP:TW/DOC#shared"
			},
			"form-element-labels": {
				"template-list-header": "Shared IP address templates",
				"other-details": "Fill in other details (optional) and click \"Submit\"",
				"other-details-organization": "IP address owner/operator",
				"other-details-host": "Host name (optional)",
				"other-details-contact": "Contact information (only if requested)"
			},
			"form-element-tooltips": {
				"other-details-organization": "You can optionally enter the name of the organization that owns/operates the IP address.  You can use wikimarkup if necessary.",
				"other-details-host": "The host name (for example, proxy.example.com) can be optionally entered here and will be linked by the template.",
				"other-details-contact": "You can optionally enter some contact details for the organization.  Use this parameter only if the organization has specifically requested that it be added.  You can use wikimarkup if necessary."
			},
			"template-list": [
				{
					"value": "Shared IP",
					"label": "{{Shared IP}}: standard shared IP address template",
					"tooltip": "IP user talk page template that shows helpful information to IP users and those wishing to warn, block or ban them",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{ 
					"value": "Shared IP edu",
					"label": "{{Shared IP edu}}: shared IP address template modified for educational institutions",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": true
					}
				},
				{
					"value": "Shared IP corp",
					"label": "{{Shared IP corp}}: shared IP address template modified for businesses",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{
					"value": "Shared IP public",
					"label": "{{Shared IP public}}: shared IP address template modified for public terminals",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{
					"value": "Shared IP gov",
					"label": "{{Shared IP gov}}: shared IP address temlate modified for government agencies or facilities",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{
					"value": "Dynamic IP",
					"label": "{{Dynamic IP}}: shared IP address template modified for organizations with dynamic addressing",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{
					"value": "Static IP",
					"label": "{{Static IP}}: shared IP address template modified for static IP addresses",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{
					"value": "ISP",
					"label": "{{ISP}}: shared IP address template modified for ISP organizations (specifically proxies)",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{
					"value": "Mobile IP",
					"label": "{{Mobile IP}}: shared IP address template modified for mobile phone companies and their customers",
					"extra": {
						"organization-enabled": true,
						"host-enabled": true,
						"contact-enabled": false
					}
				},
				{
					"value": "Whois",
					"label": "{{Whois}}: template for IP addresses in need of monitoring, but unknown whether static, dynamic or shared",
					"extra": {
						"organization-enabled": true,
						"host-enabled": false,
						"contact-enabled": false
					}
				}
			]
		}
	},
	"localization": {
		"edit-summary": "Added {{[[Template:$1|$1]]}} template.",
		"found-template": "Found {{$1}} on the user's talk page already...aborting",
		"must-select-one": "You must select a shared IP address template to use!",
		"must-input-organization": "You must input an organization for the {{$1}} template!",
		"user-talk-modification": "User talk page modification"
	}
};
