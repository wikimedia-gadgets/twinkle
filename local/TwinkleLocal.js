

TwinkleLocal = {
	// ======================
	// Localization functions
	// ======================

	/**
	 * Gets a localized text string associated with a given key.
	 * If one argument is provided, the key
	 * This function is normally aliased as str() in Twinkle Local modules.
	 */
	getString: function TwinkleLocal_getString() {
		if ( arguments.length === 0 ) {
			throw "Must pass at least one argument to TwinkleLocal.getString";
		}

		var formatString, messageParams;
		// if the first argument is a module name, look for a message in that module
		if (
			TwinkleLocalConfig[arguments[0]] &&
			TwinkleLocalConfig[arguments[0]].localization[arguments[1]] !== undefined
		) {
			formatString = TwinkleLocalConfig[arguments[0]].localization[arguments[1]];
			messageParams = Array.prototype.slice.call( arguments, 1 );
		}
		// otherwise, let's look for the message in the general localization strings
		else if ( TwinkleLocalConfig.general.localization[arguments[1]] !== undefined ) {
			formatString = TwinkleLocalConfig.general.localization[arguments[1]];
			messageParams = arguments;
		}
		// otherwise, the key wasn't found, so we just return the arguments in a
		// semi-human-readable format
		else {
			return '<' + Array.prototype.join.call( arguments, ', ' ) + '>';
		}

		// Format the format string using the template syntax engine. Works out
		// nicely, because the inserts in the string are of the form $1, $2 etc.
		return TwinkleLocal.templateSyntax.parse( formatString, messageParams );
	},
	
	/**
	 * Returns a function to be used by modules for fetching relevant localization
	 * strings. The return value of getL10nFunction() is normally passed into the
	 * wrapper function for each module as the "str" parameter.
	 *
	 * If you came here looking for information about the str() function:
	 * Writing str( ... ) is precisely equivalent to writing
	 * TwinkleLocal.getString( '<moduleName>', ... ), where <moduleName> is the
	 * string argument passed into TwinkleLocal.getL10nFunction. See the above
	 * documentation for TwinkleLocal.getString() for more information.
	 */
	getL10nFunction: function TwinkleLocal_getL10nFunction( moduleName ) {
		var fn = function str() {
			return TwinkleLocal.getString.apply( this,
				[arguments.callee.moduleName].concat( Array.prototype.slice.call( arguments, 1 ) ) );
		};
		fn.moduleName = moduleName;
		return fn;
	},

	/**
	 * Creates a Morebits.simpleWindow object to be used in a Twinkle Local
	 * module. The title, width, height, and footer links are drawn from the
	 * relevant TwinkleLocalConfig sub-object.
	 *
	 * Normally you would supply only two arguments to this function, leaving the
	 * width and height parameters unspecified. They are only there for debugging
	 * and testing purposes.
	 */
	createDialog: function TwinkleLocal_createDialog( moduleName, dialogName,
		width, height ) {

		var settings = TwinkleLocalConfig[moduleName] &&
			TwinkleLocalConfig[moduleName].dialogs[dialogName];
		// XXX fallback to default settings??
		// XXX remove hard coded defaults - just for debugging purposes
		var simpleWindow = new Morebits.simpleWindow( width || settings.width || 400,
			height || settings.height || 300 );
		simpleWindow.setScriptName( TwinkleLocal.getString( 'twinkle-name' ) );
		simpleWindow.setTitle( settings.title );
		// XXX can we do this better?
		for ( var i in settings['footer-links'] ) {
			if ( settings['footer-links'].hasOwnProperty( i ) ) {
				simpleWindow.addFooterLink( i, settings['footer-links'][i] );
			}
		}
		simpleWindow.quickFormFactory =
			new TwinkleLocal.quickFormFactory( moduleName, dialogName );
		return simpleWindow;
	}	
};

TwinkleLocal.quickFormFactory =
	function TwinkleLocal_quickFormFactory( moduleName, dialogName ) {
	this.moduleName = moduleName;
	this.dialogName = dialogName;
};

TwinkleLocal.quickFormFactory.prototype = {
	getForm:
		function TwinkleLocal_quickFormFactory_prototype_getForm( callback, event ) {
		// nothing to do, yet
		return new Morebits.quickForm( callback, event );
	},
	
	getElement:
		function TwinkleLocal_quickFormFactory_prototype_getElement( name, params ) {
		var settings = TwinkleLocalConfig[this.moduleName] &&
			TwinkleLocalConfig[this.moduleName].dialogs[this.dialogName];
		params.label = settings['form-element-labels'][name];
		params.tooltip = settings['form-element-tooltips'][name];
		return params;
	},
	
	getListElement:
		function TwinkleLocal_quickFormFactory_prototype_getListElement( name, params ) {
		var list = TwinkleLocalConfig[this.moduleName] &&
			TwinkleLocalConfig[this.moduleName].dialogs[this.dialogName] &&
			TwinkleLocalConfig[this.moduleName].dialogs[this.dialogName][name];
		params.list = list;
		return params;
	}
};

// A simple format-string engine, used for localisation strings, e.g. "Article
// $1 has been nominated for deletion at $2", and template syntax format strings,
// e.g. {{subst:welcome|$USERNAME|art=$ARTICLE}}
TwinkleLocal.templateSyntax = {
	parse: function TwinkleLocal_templateSyntax_parse( formatString, params ) {
		for ( var i in params ) {
			if ( params.hasOwnProperty( i ) ) {
				formatString = formatString.replace( "$" + i.toString().toUpperCase(),
					params[i] );
			}
		}
		return formatString;
	}
};
