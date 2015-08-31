/*!
 * jQuery i18n plugin
 * @requires jQuery v1.1 or later
 *
 * See https://github.com/recurser/jquery-i18n
 *
 * Licensed under the MIT license.
 *
 * Version: <%= pkg.version %> (<%= meta.date %>)
 */
(function($) {
	/**
	 * i18n provides a mechanism for translating strings using a jscript dictionary.
	 *
	 */

	var __slice = Array.prototype.slice;

	/*
	 * i18n property list
	 */
	var i18n = {

		dict: null,
		locale: null,
		fallbackLocale: null,

		/**
		 * init()
		 *
		 * Initialize i18n
		 *
		 * @param	property_list options : Initernationalization options.
		 */
		init: function(options) {
			this.locale = options.locale;
			this.fallbackLocale = 'en';
		},
		
		/**
		 * load()
		 *
		 * Load	translations.
		 *
		 * @param	property_list dict : The dictionary to use for translation.
		 */
		load: function ( dict ) {
			if (this.dict !== null) {
				$.extend(this.dict, dict);
			} else {
				this.dict = dict;
			}
		},

		/**
		 * _()
		 *
		 * Looks the given string up in the dictionary and returns the translation if
		 * one exists. If a translation is not found, returns the original word.
		 *
		 * @param	string str					 : The string to translate.
		 * @param	property_list params.. : params for using printf() on the string.
		 *
		 * @return	string							 : Translated word.
		 */
		_: function ( str ) {
			dict = this.dict[this.locale];
			fallbackdict = this.dict[this.fallbackLocale];
			if ( dict && dict.hasOwnProperty( str ) ) {
				str = dict[str];
			} else if( fallbackdict && fallbackdict.hasOwnProperty( str ) ) {
				str = fallbackdict[str];
			}
			args = __slice.call(arguments);
			args[0] = str;
			// Substitute any params.
			return this.printf.apply( this, args );
		},

		/*
		 * printf()
		 *
		 * Substitutes %s with parameters given in list. %%s is used to escape %s.
		 *
		 * @param	string str		: String to perform printf on.
		 * @param	string args	 : Array of arguments for printf.
		 *
		 * @return	string result : Substituted string
		 */
		printf: function( str, args ) {
			if (arguments.length < 2) return str;
			args = $.isArray(args) ? args : __slice.call(arguments, 1);
			return str.replace(/([^%]|^)%(?:(\d+)\$)?s/g, function(p0, p, position) {
				if ( position ) {
					return p + args[ parseInt(position) - 1 ];
				}
				return p + args.shift();
			}).replace(/%%s/g, '%s');
		}

	};

	/*
	 * _t()
	 *
	 * Allows you to translate a jQuery selector.
	 *
	 * eg $('h1')._t('some text')
	 *
	 * @param	string str					 : The string to translate .
	 * @param	property_list params : Params for using printf() on the string.
	 *
	 * @return	element							: Chained and translated element(s).
	*/
	$.fn._t = function( str, params ) {
		return $( this ).html( i18n._.apply( i18n, arguments ) );
	};

	$.i18n = i18n;
})(jQuery);
