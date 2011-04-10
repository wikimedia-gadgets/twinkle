/**
 * Use of this module by Twinkle:
 *   1. Twinkle specific functions related to configuration. These could possibly be moved to a new twinklecommon.js module.
 *   2. General classes related to use of the MediaWiki API. These classes are also used by many other user scripts
 *      so they should remain in this file. These classes are:
 *        Wikipedia.api – Invokes the actual MediaWiki API
 *        Wikipedia.page – Manages the details of the API including forming queries, handling edit tokens, 
 *                         page updates, and recovering from errors.
 *   3. Some date functions.
 *
 * This module should not be forked to avoid naming conflicts between the objects and functions 
 * within this module that is automatically loaded by many scripts and any forked copy.
 */

// Simple helper functions to see what groups a user might belong
function userIsInGroup( group ) {
	return ( wgUserGroups != null && wgUserGroups.indexOf( group ) != -1 ) || ( wgUserGroups == null && group == 'anon' );
}
function userIsAnon() {
	return wgUserGroups == null;
}

/**
 * Add a portlet menu to one of the navigation areas on the page.
 * This is necessarily quite a hack since skins, navigation areas, and
 * portlet menu types all work slightly different.
 *
 * Available navigation areas depend on the script used.
 * Monobook:
 *  "column-one", outer div class "portlet", inner div class "pBody". Existing portlets: "p-cactions", "p-personal", "p-logo", "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *  Special layout of p-cactions and p-personal through specialized styles.
 * Vector:
 *  "mw-panel", outer div class "portal", inner div class "body". Existing portlets/elements: "p-logo", "p-navigation", "p-interaction", "p-tb", "p-coll-print_export"
 *  "left-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-namespaces", "p-variants" (menu)
 *  "right-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-views", "p-cactions" (menu), "p-search"
 *  Special layout of p-personal portlet (part of "head") through specialized styles.
 * Modern:
 *  "mw_contentwrapper" (top nav), outer div class "portlet", inner div class "pBody". Existing portlets or elements: "p-cactions", "mw_content"
 *  "mw_portlets" (sidebar), outer div class "portlet", inner div class "pBody". Existing portlets: "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *
 * NOTE: If anyone is brave enough to reuse this directly, please shoot
 * me a note. Otherwise I might change the signature down the line and
 * your script breaks. Amalthea.
 *
 * @param String navigation -- id of the target navigation area (skin dependant, on vector either of "left-navigation", "right-navigation", or "mw-panel")
 * @param String id -- id of the portlet menu to create, preferably start with "p-".
 * @param String text -- name of the portlet menu to create. Visibility depends on the class used.
 * @param String type -- type of portlet. Currently only used for the vector non-sidebar portlets, pass "menu" to make this portlet a drop down menu.
 * @param Node nextnodeid -- the id of the node before which the new item should be added, should be another item in the same list, or undefined to place it at the end.
 *
 * @return Node -- the DOM node of the new item (a DIV element) or null
 */
function twAddPortlet( navigation, id, text, type, nextnodeid )
{
	//sanity checks, and get required DOM nodes
	var root = document.getElementById( navigation );
	if ( !root ) return null;

	var item = document.getElementById( id );
	if (item)
	{
		if (item.parentNode && item.parentNode==root) return item;
		return null;
	}

	var nextnode;
	if (nextnodeid) nextnode = document.getElementById(nextnodeid);

	//Add styles we might need.
	if (!twAddPortlet.styleAdded)
	{
		if (skin=="vector") appendCSS( "div div.extraMenu h5 span { background-position: 90% 50%;} div.extraMenu h5 a { padding-left: 0.4em; padding-right: 0.4em; width:auto; } div.extraMenu h5 a span {display:inline-block; font-size:0.8em; height:2.5em; font-weight: normal; padding-top: 1.25em; margin-right:14px; }" );
		else if (skin=="modern") appendCSS("#mw_contentwrapper div.portlet { overflow:hidden; height:1.5em; margin:0 0 0 14em; padding:0; } #mw_contentwrapper div.portlet h5 {display:none;} #mw_contentwrapper div.portlet div.pBody {margin:0; padding:0;} #mw_contentwrapper div.portlet div.pBody ul { display:inline; margin:0; } #mw_contentwrapper div.portlet div.pBody ul li { display:block; float:left; height:1.5em; margin:0 0.5em; padding:0 0.2em; text-transform:lowercase; } #mw_contentwrapper div.portlet div.pBody ul li a { text-decoration:underline;} #mw_contentwrapper div.portlet div.pBody ul li.selected a { text-decoration:none;}");
		twAddPortlet.styleAdded = true;
	}

	//verify/normalize input
	type = skin=="vector" && type=="menu" && (navigation=="left-navigation" || navigation=="right-navigation")?"menu":"";
	var outerDivClass;
	var innerDivClass;
	switch (skin)
	{
		case "vector":
			if (navigation!="portal" && navigation!="left-navigation" && navigation!="right-navigation") navigation="mw-panel";
			outerDivClass = navigation=="mw-panel"?"portal":(type=="menu"?"vectorMenu extraMenu":"vectorTabs extraMenu");
			innerDivClass = navigation=="mw-panel"?'body':(type=='menu'?'menu':'');
			break;
		case "modern":
			if (navigation!="mw_portlets" && navigation!="mw_contentwrapper") navigation="mw_portlets";
			outerDivClass = "portlet";
			innerDivClass = "pBody";
			break;
		default:
			navigation="column-one";
			outerDivClass = "portlet";
			innerDivClass = "pBody";
			break;
	}

	//Build the DOM elements.
	var outerDiv = document.createElement( 'div' );
	outerDiv.className = outerDivClass+" emptyPortlet";
	outerDiv.id = id;
	var nextnode;
	if ( nextnode && nextnode.parentNode==root ) root.insertBefore( outerDiv, nextnode );
	else root.appendChild( outerDiv );

	var h5 = document.createElement( 'h5' );
	if (type=='menu')
	{
		var span = document.createElement( 'span' );
		span.appendChild( document.createTextNode( text ) );
		h5.appendChild( span );

		var a = document.createElement( 'a' );
		a.href = "#";
		var span = document.createElement( 'span' );
		span.appendChild( document.createTextNode( text ) );
		a.appendChild( span );
		h5.appendChild( a );
	}
	else h5.appendChild( document.createTextNode( text ) );
	outerDiv.appendChild( h5 );

	var innerDiv = document.createElement( 'div' ); //not strictly necessary with type vectorTabs, or other skins.
	innerDiv.className = innerDivClass;
	outerDiv.appendChild(innerDiv);

	var ul = document.createElement( 'ul' );
	innerDiv.appendChild( ul );

	return outerDiv;
}

//Build a portlet menu if it doesn't exist yet, and add the portlet link.
function twAddPortletLink( href, text, id, tooltip, accesskey, nextnode )
{
	if (TwinkleConfig.portletArea) twAddPortlet(TwinkleConfig.portletArea, TwinkleConfig.portletId, TwinkleConfig.portletName, TwinkleConfig.portletType, TwinkleConfig.portletNext);
	addPortletLink( TwinkleConfig.portletId, href, text, id, tooltip, accesskey, nextnode );
}

Cookies = {
	/*
	 * Creates an cookie with the name and value pair. expiry is optional or null and defaults
	 * to browser standard (in seconds), path is optional and defaults to "/"
	 * throws error if the cookie already exists.
	 */
	create: function( name, value, max_age, path ) {
		if( Cookies.exists( name ) ) {
			throw "cookie " + name + " already exists";
		}
		Cookies.set( name, value, max_age, path );
	},
	/*
	 * Sets an cookie with the name and value pair, overwrites any previous cookie of that name.
	 * expiry is optional or null and defaults to browser standard (in seconds),
	 * path is optional and defaults to /
	 */
	set: function( name, value, max_age, path ) {
		var cookie = name + "=" + encodeURIComponent( value );
		if( max_age ) {
			cookie += "; max-age=" + max_age;
		}
		cookie += "; path=" + path || "/";
		document.cookie = cookie;
	},
	/*
	 * Retuns the cookie with the name "name", return null if no cookie found.
	 */
	read: function( name ) {
		var cookies = document.cookie.split(";");
		for( var i = 0; i < cookies.length; ++i ) {
			var current = cookies[i];
			current = current.trim();
			if( current.indexOf( name + "=" ) == 0 ) {
				return decodeURIComponent( current.substring( name.length + 1 ) );
			}
		}
		return null;
	},
	/*
	 * Returns true if a cookie exists, false otherwise
	 */
	exists: function( name ) {
		var re = new RegExp( ";\\s*" + name + "=" );
		return re.test( document.cookie );
	},
	/*
	 * Deletes the cookie named "name"
	 */
	remove: function( name ) {
		Cookies.set( name, '', -1 );
	}
}

/**
 * Quickform is a class for creation of simple and standard forms without much 
 * specific coding.
 */

QuickForm = function QuickForm( event, eventType ) {

	this.root = new QuickForm.element( { type: 'form', event: event, eventType:eventType } );

	var cssNode = document.createElement('style');
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.appendChild( document.createTextNode("")); // Safari bugfix
	document.getElementsByTagName("head")[0].appendChild(cssNode);
	var styles = cssNode.sheet ? cssNode.sheet : cssNode.stylesSheet;
	styles.insertRule("form.quickform { width: 96%; margin:auto; padding: .5em; vertical-align: middle}", 0);
	styles.insertRule("form.quickform * { font-family: sans-serif; vertical-align: middle}", 0);
	styles.insertRule("form.quickform select { width: 30em; border: 1px solid gray; font-size: 1.1em}", 0);
	styles.insertRule("form.quickform h5 { border-top: 1px solid gray;}", 0);
	styles.insertRule("form.quickform textarea { width: 100%; height: 6em }", 0);
	styles.insertRule("form.quickform .tooltipButtonContainer { position: relative; width: 100%; }", 0);
	styles.insertRule("form.quickform .tooltipButton { padding: .2em; color: blue; font-weight: bold; cursor:help;}", 0);
	styles.insertRule(".quickformtooltip { z-index: 200; position: absolute; padding: .1em; border: 1px dotted red; background-color: Linen; font: caption; font-size: 10pt; max-width: 800px}", 0);
}

QuickForm.prototype.render = function QuickFormRender() {
	var ret = this.root.render();
	ret.names = {};
	return ret;

}
QuickForm.prototype.append = function QuickFormAppend( data ) {
	return this.root.append( data );
}

QuickForm.element = function QuickFormElement( data ) {
	this.data = data;
	this.childs = [];
	this.id = QuickForm.element.id++;
}

QuickForm.element.id = 0;

QuickForm.element.prototype.append = function QuickFormElementAppend( data ) {
	if( data instanceof QuickForm.element ) {
		var child = data;
	} else {
		var child = new QuickForm.element( data );
	}
	this.childs.push( child );
	return child;
}

QuickForm.element.prototype.render = function QuickFormElementRender() {
	var currentNode = this.compute( this.data );

	for( var i = 0; i < this.childs.length; ++i ) {
		currentNode[1].appendChild( this.childs[i].render() );
	}
	return currentNode[0];
}

QuickForm.element.prototype.compute = function QuickFormElementCompute( data, in_id ) {
	var node;
	var childContainder = null;
	var label;
	var id = ( in_id ? in_id + '_' : '' ) + 'node_' + this.id;
	if( data.adminonly && !userIsInGroup( 'sysop' ) ) {
		// hell hack alpha
		data.type = hidden;
	}
	switch( data.type ) {
	case 'form':
		node = document.createElement( 'form' );
		node.setAttribute( 'name', 'id' );
		node.className = "quickform";
		node.setAttribute( 'action', 'javascript:void(0);');
		if( data.event ) {
			node.addEventListener( data.eventType || 'submit', data.event , false );
		}
		break;
	case 'select':
		node = document.createElement( 'div' );

		node.setAttribute( 'id', 'div_' + id );
		if( data.label ) {
			label = node.appendChild( document.createElement( 'label' ) );
			label.setAttribute( 'for', id );
			label.appendChild( document.createTextNode( data.label ) );
		}
		var select = node.appendChild( document.createElement( 'select' ) );
		if( data.event ) {
			select.addEventListener( 'change', data.event, false );
		}
		if( data.multiple ) {
			select.setAttribute( 'multiple', 'multiple' );
		}
		if( data.size ) {
			select.setAttribute( 'size', data.size );
		}
		select.setAttribute( 'name', data.name );

		if( data.list ) {
			for( var i = 0; i < data.list.length; ++i ) {

				var current = data.list[i];

				if( current.list ) {
					current.type = 'optgroup';
				} else {
					current.type = 'option';
				}

				var res = this.compute( current );
				select.appendChild( res[0] );
			}
		}
		childContainder = select;
		break;
	case 'option':
		node = document.createElement( 'option' );
		node.values = data.value;
		node.setAttribute( 'value', data.value );
		if( data.selected ) {
			node.setAttribute( 'selected', 'selected' );
		}
		if( data.disabled ) {
			node.setAttribute( 'disabled', 'disabled' );
		}
		node.setAttribute( 'label', data.label );
		node.appendChild( document.createTextNode( data.label ) );
		break;
	case 'optgroup':
		node = document.createElement( 'optgroup' );
		node.setAttribute( 'label', data.label );

		if( data.list ) {
			for( var i = 0; i < data.list.length; ++i ) {

				var current = data.list[i];

				current.type = 'option'; //must be options here

				var res = this.compute( current );
				node.appendChild( res[0] );
			}
		}
		break;
	case 'field':
		node = document.createElement( 'fieldset' );
		label = node.appendChild( document.createElement( 'legend' ) );
		label.appendChild( document.createTextNode( data.label ) );
		if( data.name ) {
			node.setAttribute( 'name', data.name );
		}
		break;
	case 'checkbox':
	case 'radio':
		node = document.createElement( 'div' );
		if( data.list ) {
			for( var i = 0; i < data.list.length; ++i ) {
				var cur_id = id + '_' + i;
				var current = data.list[i];
				if( current.type == 'header' ) {
					// inline hack
					cur_node = node.appendChild( document.createElement( 'h6' ) );
					cur_node.appendChild( document.createTextNode( current.label ) );
					if( current.tooltip ) {
						QuickForm.element.generateTooltip( cur_node , current );
					}
					continue;
				}
				cur_node = node.appendChild( document.createElement( 'div' ) );
				var input = cur_node.appendChild( document.createElement( 'input' ) );
				input.values = current.value;
				input.setAttribute( 'value', current.value );
				input.setAttribute( 'name', current.name || data.name );
				input.setAttribute( 'type', data.type );
				input.setAttribute( 'id', cur_id );


				if( current.checked ) {
					input.setAttribute( 'checked', 'checked' );
				}
				if( current.disabled ) {
					input.setAttribute( 'disabled', 'disabled' );
				}
				if( data.event ) {
					input.addEventListener( 'change', data.event, false );
				} else if ( current.event ) {
					input.addEventListener( 'change', current.event, true );
				}
				var label = cur_node.appendChild( document.createElement( 'label' ) );
				label.appendChild( document.createTextNode( current.label ) );
				label.setAttribute( 'for', cur_id );
				if( current.tooltip ) {
					QuickForm.element.generateTooltip( label, current );
				}
				if( current.subgroup ) {
					var tmpgroup = current.subgroup;
					if( ! tmpgroup.type ) {
						tmpgroup.type = data.type;
					}
					tmpgroup.name = (current.name || data.name) + '.' +  tmpgroup.name;

					var subgroup =this.compute( current.subgroup, cur_id )[0];
					subgroup.style.marginLeft = '3em';
					input.subgroup = subgroup;
					input.shown = false;

					var event = function(e) {
						if( e.target.checked ) {
							e.target.parentNode.appendChild( e.target.subgroup );
							if( e.target.type == 'radio' ) {
								var name = e.target.name;
								if( typeof( e.target.form.names[name] ) != 'undefined' ) {
									e.target.form.names[name].parentNode.removeChild( e.target.form.names[name].subgroup );
								}
								e.target.form.names[name] = e.target;
							}
						} else {
							e.target.parentNode.removeChild( e.target.subgroup );
						}
					}
					input.addEventListener( 'change', event, true );
					if( current.checked ) {
						input.parentNode.appendChild( subgroup );
					}
				} else if( data.type == 'radio' ) {
					var event = function(e) {
						if( e.target.checked ) {
							var name = e.target.name;
							if( typeof( e.target.form.names[name] ) != 'undefined' ) {
								e.target.form.names[name].parentNode.removeChild( e.target.form.names[name].subgroup );
							}
							delete e.target.form.names[name];
						} 
					}
					input.addEventListener( 'change', event, true );
				}
			}
		}
		break;
	case 'input':
		node = document.createElement( 'div' );

		if( data.label ) {
			label = node.appendChild( document.createElement( 'label' ) );
			label.appendChild( document.createTextNode( data.label ) );
			label.setAttribute( 'for', id );
		}

		var input = node.appendChild( document.createElement( 'input' ) );
		if( data.value ) {
			input.setAttribute( 'value', data.value );
		}
		input.setAttribute( 'name', data.name );
		input.setAttribute( 'type', 'text' );
		if( data.size ) {
			input.setAttribute( 'size', data.size );
		}
		if( data.disabled ) {
			input.setAttribute( 'disabled', 'disabled' );
		}
		if( data.readonly ) {
			input.setAttribute( 'readonly', 'readonly' );
		}
		if( data.maxlength ) {
			input.setAttribute( 'maxlength', data.maxlength );
		}
		if( data.event ) {
			input.addEventListener( 'keyup', data.event, false );
		}
		break;
	case 'dyninput':
		var min = data.min || 1;
		var max = data.max || Infinity;

		node = document.createElement( 'div' );

		label = node.appendChild( document.createElement( 'h5' ) );
		label.appendChild( document.createTextNode( data.label ) );

		var listNode = node.appendChild( document.createElement( 'div' ) );

		var more = this.compute( {
				type: 'button',
				label: 'more',
				disabled: min >= max,
				event: function(e) {
					var area = e.target.area;
					var new_node =  new QuickForm.element( e.target.sublist );
					e.target.area.appendChild( new_node.render() );

					if( ++e.target.counter >= e.target.max ) {
						e.target.setAttribute( 'disabled', 'disabled' );
					}
					e.stopPropagation();
				}
			} );

		node.appendChild( more[0] );
		moreButton = more[1];


		var sublist = {
			type: '_dyninput_element',
			label: data.sublabel || data.label,
			name: data.name,
			value: data.value,
			size: data.size,
			remove: false,
			maxlength: data.maxlength,
			event: data.event
		}


		for( var i = 0; i < min; ++i ) {
			var elem = new QuickForm.element( sublist );
			listNode.appendChild( elem.render() );
		}
		sublist.remove = true;
		sublist.morebutton = moreButton;
		sublist.listnode = listNode;

		moreButton.sublist = sublist;
		moreButton.area = listNode;
		moreButton.max = max - min;
		moreButton.counter = 0;
		break;
	case '_dyninput_element': // Private, similar to normal input
		node = document.createElement( 'div' );

		if( data.label ) {
			label = node.appendChild( document.createElement( 'label' ) );
			label.appendChild( document.createTextNode( data.label ) );
			label.setAttribute( 'for', id );
		}

		var input = node.appendChild( document.createElement( 'input' ) );
		if( data.value ) {
			input.setAttribute( 'value', data.value );
		}
		input.setAttribute( 'name', data.name );
		input.setAttribute( 'type', 'text' );
		if( data.size ) {
			input.setAttribute( 'size', data.size );
		}
		if( data.maxlength ) {
			input.setAttribute( 'maxlength', data.maxlength );
		}
		if( data.event ) {
			input.addEventListener( 'keyup', data.event, false );
		}
		if( data.remove ) {
			var remove = this.compute( {
					type: 'button',
					label: 'remove',
					event: function(e) {
						var list = e.target.listnode;
						var node = e.target.inputnode;
						var more = e.target.morebutton;

						list.removeChild( node );
						--more.counter;
						more.removeAttribute( 'disabled' );
						e.stopPropagation();
					}
				} );
			node.appendChild( remove[0] );
			removeButton = remove[1];
			removeButton.inputnode = node;
			removeButton.listnode = data.listnode;
			removeButton.morebutton = data.morebutton;
		}
		break;
	case 'hidden':
		var node = document.createElement( 'input' );
		node.setAttribute( 'type', 'hidden' );
		node.values = data.value;
		node.setAttribute( 'value', data.value );
		node.setAttribute( 'name', data.name );
		break;
	case 'header':
		node = document.createElement( 'h5' );
		node.appendChild( document.createTextNode( data.label ) );
		break;
	case 'div':
		node = document.createElement( 'div' );
		if (data.label) {
			if ( !( data.label instanceof Array ) ) {
				data.label = [ data.label ];
			}
			var result = document.createDocumentFragment();
			for( var i = 0; i < data.label.length; ++i ) {
				if( typeof(data.label[i]) === 'string' ) {
					result.appendChild( document.createTextNode( data.label[i] ) );
				} else if( data.label[i] instanceof Element ) {
					result.appendChild( data.label[i] );
				}
			}
			node.appendChild( result );
		}
		break;
	case 'submit':
		node = document.createElement( 'span' );
		childContainder = node.appendChild(document.createElement( 'input' ));
		childContainder.setAttribute( 'type', 'submit' );
		if( data.label ) {
			childContainder.setAttribute( 'value', data.label );
		}
		childContainder.setAttribute( 'name', data.name || 'submit' );
		if( data.disabled ) {
			childContainder.setAttribute( 'disabled', 'disabled' );
		}
		break;
	case 'button':
		node = document.createElement( 'span' );
		childContainder = node.appendChild(document.createElement( 'input' ));
		childContainder.setAttribute( 'type', 'button' );
		if( data.label ) {
			childContainder.setAttribute( 'value', data.label );
		}
		childContainder.setAttribute( 'name', data.name );
		if( data.disabled ) {
			childContainder.setAttribute( 'disabled', 'disabled' );
		}
		if( data.event ) {
			childContainder.addEventListener( 'click', data.event, false );
		}
		break;
	case 'textarea':
		node = document.createElement( 'div' );
		if( data.label ) {
			label = node.appendChild( document.createElement( 'h5' ) );
			label.appendChild( document.createTextNode( data.label ) );
			label.setAttribute( 'for', id );
		}
		node.appendChild( document.createElement( 'br' ) );
		textarea = node.appendChild( document.createElement( 'textarea' ) );
		textarea.setAttribute( 'name', data.name );
		if( data.cols ) {
			textarea.setAttribute( 'cols', data.cols );
		}
		if( data.rows ) {
			textarea.setAttribute( 'rows', data.rows );
		}
		if( data.disabled ) {
			textarea.setAttribute( 'disabled', 'disabled' );
		}
		if( data.readonly ) {
			textarea.setAttribute( 'readonly', 'readonly' );
		}
		if( data.value ) {
			textarea.value = data.value;
		}
		break;

	}

	if( childContainder == null ) {
		childContainder = node;
	} 
	if( data.tooltip ) {
		QuickForm.element.generateTooltip( label || node , data );
	}

	if( data.extra ) {
		childContainder.extra = extra;
	}
	childContainder.setAttribute( 'id', data.id || id );

	return [ node, childContainder ];
}

QuickForm.element.generateTooltip = function QuickFormElementGenerateTooltip( node, data ) {
	var tooltipButtonContainer = node.appendChild( document.createElement( 'span' ) );
	tooltipButtonContainer.className = 'tooltipButtonContainer';
	var tooltipButton = tooltipButtonContainer.appendChild( document.createElement( 'span' ) );
	tooltipButton.className = 'tooltipButton';
	tooltipButton.appendChild( document.createTextNode( '?' ) );
	var tooltip = document.createElement( 'div' );
	tooltip.className = 'quickformtooltip';
	tooltip.appendChild( document.createTextNode( data.tooltip ) );
	tooltipButton.tooltip = tooltip;
	tooltipButton.showing = false;
	tooltipButton.interval = null;
	tooltipButton.addEventListener( 'mouseover', QuickForm.element.generateTooltip.display, false );
	tooltipButton.addEventListener( 'mouseout', QuickForm.element.generateTooltip.fade, false );

}
QuickForm.element.generateTooltip.display = function QuickFormElementGenerateTooltipDisplay(e) {
	window.clearInterval( e.target.interval );
	e.target.tooltip.style.setProperty( '-moz-opacity', 1, null);
	e.target.tooltip.style.setProperty( 'opacity', 1, null);
	e.target.tooltip.style.left = (e.pageX - e.layerX + 24) + "px";
	e.target.tooltip.style.top = (e.pageY - e.layerY + 12) + "px";
	document.body.appendChild( e.target.tooltip );
	e.target.showing = true;
}

QuickForm.element.generateTooltip.fade = function QuickFormElementGenerateTooltipFade( e ) {
	e.target.opacity = 1.2;
	e.target.interval  = window.setInterval(function(e){
			e.target.tooltip.style.setProperty( '-moz-opacity', e.target.opacity, null);
			e.target.tooltip.style.setProperty( 'opacity', e.target.opacity, null);
			e.target.opacity -= 0.1;
			if( e.target.opacity <= 0 ) {
				window.clearInterval( e.target.interval );
				document.body.removeChild( e.target.tooltip );e.target.showing = false;
			}
		},50,e);
}

/*
 * returns an array containing the values of elements with the given name, that has it's
 * checked property set to true. (i.e. a checkbox or a radiobutton is checked), or select options
 * that have selected set to true. (don't try to mix selects with radio/checkboxes, please)
 * Type is optional and can specify if either radio or checkbox (for the event
 * that both checkboxes and radiobuttons have the same name.
 */
HTMLFormElement.prototype.getChecked = function( name, type ) {
	var elements = this.elements[name];
	if( !elements ) { 
		// if the element doesn't exists, return null.
		return null;
	}
	var return_array = [];
	if( elements instanceof HTMLSelectElement ) {
		var options = elements.options;
		for( var i = 0; i < options.length; ++i ) {
			if( options[i].selected ) {
				if( options[i].values ) {
					return_array.push( options[i].values );
				} else {
					return_array.push( options[i].value );
				}

			}
		}
	} else if( elements instanceof HTMLInputElement ) {
		if( type != null && elements.type != type ) {
			return [];
		} else if( elements.checked ) {
			return [ elements.value ];
		}
	} else {
		for( var i = 0; i < elements.length; ++i ) {
			if( elements[i].checked ) {
				if( type != null && elements[i].type != type ) {
					continue;
				}
				if( elements[i].values ) {
					return_array.push( elements[i].values );
				} else {
					return_array.push( elements[i].value );
				}
			}
		}
	}
	return return_array;
}

/*
 * returns an array containing the values of elements with the given name, that has non-empty strings
 * type is "text" or given.
 */
HTMLFormElement.prototype.getTexts = function( name, type ) {
	type == type || 'text';
	var elements = this.elements[name];
	if( !elements ) { 
		// if the element doesn't exists, return null.
		return null;
	}
	var return_array = [];
	for( var i = 0; i < elements.length; ++i ) {
		if( elements[i].value != '' ) {
			return_array.push( elements[i].value );
		}
	}
	return return_array;
}
/**
* Will escape a string to be used in a RegExp
*/
RegExp.escape = function( text, space_fix ) {

	if ( !arguments.callee.sRE ) {
		arguments.callee.sRE = /(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\\|\$|\^)/g;
	}

	text = text.replace( arguments.callee.sRE , '\\$1' );

	// Special Mediawiki escape, underscore/space is the same, often at lest:

	if( space_fix ) {
		text = text.replace( / |_/g, '[_ ]' );
	}

	return text;

}

// Sprintf implementation based on perl similar
function sprintf() {
	if( arguments.length == 0 ) {
		throw "Not enough arguments for sprintf";
	}
	var result = "";
	var format = arguments[0];

	var index = 1;
	var current_index = 1;
	var flags = {};
	var in_operator = false;
	var relative = false;
	var precision = false;
	var fixed = false;
	var vector = false;
	var vector_delimiter = '.';


	for( var i = 0; i < format.length; ++i ) {
		var current_char = format.charAt(i);
		if( in_operator ) {
			switch( current_char ) {
			case 'i':
				current_char = 'd';
				break;
			case 'F':
				current_char = 'f';
				break;
			case '%':
			case 'c':
			case 's':
			case 'd':
			case 'u':
			case 'o':
			case 'x':
			case 'e':
			case 'f':
			case 'g':
			case 'X':
			case 'E':
			case 'G':
			case 'b':
				var value = arguments[current_index];
				if( vector ) {
					r = value.toString().split( '' );
					result += value.toString().split('').map( function( value ) {
							return sprintf.format( current_char, value.charCodeAt(), flags );
						}).join( vector_delimiter );
				} else {
					result += sprintf.format( current_char, value, flags );
				}
				if( !fixed ) {
					++index;
				}
				current_index = index;
				flags = {};
				relative = false;
				in_operator = false;
				precision = false;
				fixed = false;
				vector = false;
				vector_delimiter = '.';
				break;
			case 'v':
				vector = true;
				break;
			case ' ':
			case '0':
			case '-':
			case '+':
			case '#':
				flags[current_char] = true;
				break;
			case '*':
				relative = true;
				break;
			case '.':
				precision = true;
				break;
			}
			if( /\d/.test( current_char ) ) {
				var num = parseInt( format.substr( i ) );
				var len = num.toString().length;
				i += len - 1;
				var next = format.charAt( i  + 1 );
				if( next == '$' ) {
					if( num <= 0 || num >= arguments.length ) {
						throw "out of bound";
					}
					if( relative ) {
						if( precision ) {
							flags['precision'] = arguments[num];
							precision = false;
						} else if( format.charAt( i + 2 ) == 'v' ) {
							vector_delimiter = arguments[num];
						}else {
							flags['width'] = arguments[num];
						}
						relative = false;
					} else {
						fixed = true;
						current_index = num;
					}
					++i;
				} else if( precision ) {
					flags['precision'] = num;
					precision = false;
				} else {
					flags['width'] = num;
				}
			} else if ( relative && !/\d/.test( format.charAt( i + 1 ) ) ) {
				if( precision ) {
					flags['precision'] = arguments[current_index];
					precision = false;
				} else if( format.charAt( i + 1 ) == 'v' ) {
					vector_delimiter = arguments[current_index];
				} else {
					flags['width'] = arguments[current_index];
				}
				++index;
				if( !fixed ) {
					current_index++;
				}
				relative = false;
			}
		} else {
			if( current_char == '%' ) {
				in_operator = true;
				continue;
			} else {
				result += current_char;
				continue;
			}
		}
	}
	return result;
}

sprintf.format = function sprintfFormat( type, value, flags ) {

	// Similar to how perl printf works
	if( value == undefined ) {
		if( type == 's' ) {
			return '';
		} else {
			return '0';
		}
	}

	var result;
	var prefix = '';
	var fill = '';
	var fillchar = ' ';
	switch( type ) {
	case '%':
		result = '%';
		break;
	case 'c':
		result = String.fromCharCode( parseInt( value ) );
		break;
	case 's':
		result = value.toString();
		break;
	case 'd':
		result = parseInt( value ).toString();
		break;
	case 'u':
		result = Math.abs( parseInt( value ) ).toString(); // it's not correct, but JS lacks unsigned ints
		break;
	case 'o':
		result = (new Number( Math.abs( parseInt( value ) ) ) ).toString(8);
		break;
	case 'x':
		result = (new Number( Math.abs( parseInt( value ) ) ) ).toString(16);
		break;
	case 'b':
		result = (new Number( Math.abs( parseInt( value ) ) ) ).toString(2);
		break;
	case 'e':
		var digits = flags['precision'] ? flags['precision'] : 6;
		result = (new Number( value ) ).toExponential( digits ).toString();
		break;
	case 'f':
		var digits = flags['precision'] ? flags['precision'] : 6;
		result = (new Number( value ) ).toFixed( digits ).toString();
	case 'g':
		var digits = flags['precision'] ? flags['precision'] : 6;
		result = (new Number( value ) ).toPrecision( digits ).toString();
		break;
	case 'X':
		result = (new Number( Math.abs( parseInt( value ) ) ) ).toString(16).toUpperCase();
		break;
	case 'E':
		var digits = flags['precision'] ? flags['precision'] : 6;
		result = (new Number( value ) ).toExponential( digits ).toString().toUpperCase();
		break;
	case 'G':
		var digits = flags['precision'] ? flags['precision'] : 6;
		result = (new Number( value ) ).toPrecision( digits ).toString().toUpperCase();
		break;
	}

	if(flags['+'] && parseFloat( value ) > 0 && ['d','e','f','g','E','G'].indexOf(type) != -1 ) {
		prefix = '+';
	}

	if(flags[' '] && parseFloat( value ) > 0 && ['d','e','f','g','E','G'].indexOf(type) != -1 ) {
		prefix = ' ';
	}

	if( flags['#'] && parseInt( value ) != 0 ) {
		switch(type) {
		case 'o':
			prefix = '0';
			break;
		case 'x':
		case 'X':
			prefix = '0x';
			break;
		case 'b':
			prefix = '0b';
			break;
		}
	}

	if( flags['0'] && !flags['-'] ) {
		fillchar = '0';
	}

	if( flags['width'] && flags['width'] > ( result.length + prefix.length ) ) {
		var tofill = flags['width'] - result.length - prefix.length;
		for( var i = 0; i < tofill; ++i ) {
			fill += fillchar;
		}
	}

	if( flags['-'] && !flags['0'] ) {
		result += fill;
	} else {
		result = fill + result;
	}

	return prefix + result;
}

Bytes = function ( value ) {
	if( typeof(value) == 'string' ) {
		var res = /(\d+) ?(\w?)(i?)B?/.exec( value );
		var number = res[1];
		var mag = res[2];
		var si = res[3];

		if( ! number ) {
			this.number = 0;
			return;
		}

		if( !si ) {
			this.value = number * Math.pow( 10, Bytes.magnitudes[mag] * 3 );
		} else {
			this.value = number * Math.pow( 2, Bytes.magnitudes[mag] * 10 );
		}
	} else {
		this.value = value;
	}
}

Bytes.magnitudes = {
	'': 0,
	'K': 1,
	'M': 2,
	'G': 3,
	'T': 4,
	'P': 5,
	'E': 6,
	'Z': 7,
	'Y': 8
}
Bytes.rmagnitudes = {
	0: '',
	1: 'K',
	2: 'M',
	3: 'G',
	4: 'T',
	5: 'P',
	6: 'E',
	7: 'Z',
	8: 'Y'
}

Bytes.prototype.valueOf = function() {
	return this.value;
}

Bytes.prototype.toString = function( magnitude ) {
	var tmp = this.value;
	if( magnitude ) {
		var si = /i/.test(magnitude);
		var mag = magnitude.replace( /.*?(\w)i?B?.*/g, '$1' );
		if( si ) {
			tmp /= Math.pow( 2, Bytes.magnitudes[mag] * 10 );
		} else {
			tmp /= Math.pow( 10, Bytes.magnitudes[mag] * 3 );
		}
		if( parseInt( tmp ) != tmp ) {
			tmp = (new Number( tmp ) ).toPrecision( 4 );
		}
		return tmp + ' ' + mag + (si?'i':'') +  'B';
	} else {
		// si per default
		var current = 0;
		while( tmp >= 1024 ) {
			tmp /= 1024;
			++current;
		}
		tmp = this.value / Math.pow( 2, current * 10 );
		if( parseInt( tmp ) != tmp ) {
			tmp = (new Number( tmp ) ).toPrecision( 4 );
		}
		return tmp + ' ' + Bytes.rmagnitudes[current] + ( current > 0 ? 'iB' : 'B' );
	}

}
String.prototype.ltrim = function stringPrototypeLtrim( chars ) {
	chars = chars || "\\s*";
	return this.replace( new RegExp("^[" + chars + "]+", "g"), "" );
}

String.prototype.rtrim = function stringPrototypeRtrim( chars ) {
	chars = chars || "\\s*";
	return this.replace( new RegExp("[" + chars + "]+$", "g"), "" );
}
String.prototype.trim = function stringPrototypeTrim( chars ) {
	return this.rtrim(chars).ltrim(chars);
}

String.prototype.splitWeightedByKeys = function stringPrototypeSplitWeightedByKeys( start, end, skip ) {
	if( start.length != end.length ) {
		throw 'start marker and end marker must be of the same length';
	}
	var level = 0;
	var initial = null;
	var result = [];
	if( !( skip instanceof Array ) ) {
		if( typeof( skip ) == 'undefined' ) {
			skip = [];
		} else if( typeof( skip ) == 'string' ) {
			skip = [ skip ];
		} else {
			throw "non-applicable skip parameter";
		}
	}
	for( var i  = 0; i < this.length; ++i ) {
		for( var j = 0; j < skip.length; ++j ) {
			if( this.substr( i, skip[j].length ) == skip[j] ) {
				i += skip[j].length - 1;
				continue;
			}
		}
		if( this.substr( i, start.length ) == start ) {
			if( initial == null ) {
				initial = i;
			}
			++level;
			i += start.length - 1;
		} else if( this.substr( i, end.length ) == end ) {
			--level;
			i += end.length - 1;
		}
		if( level == 0 && initial != null ) {
			result.push( this.substring( initial, i + 1 ) );
			initial = null;
		}
	}

	return result;
}



// Helper functions to change case of a string
String.prototype.toUpperCaseFirstChar = function() {
	return this.substr( 0, 1 ).toUpperCase() + this.substr( 1 );
}

String.prototype.toLowerCaseFirstChar = function() {
	return this.substr( 0, 1 ).toLowerCase() + this.substr( 1 );
}

String.prototype.toUpperCaseEachWord = function( delim ) {
	delim = delim ? delim : ' ';
	return this.split( delim ).map( function(v) { return v.toUpperCaseFirstChar() } ).join( delim );
}

String.prototype.toLowerCaseEachWord = function( delim ) {
	delim = delim ? delim : ' ';
	return this.split( delim ).map( function(v) { return v.toLowerCaseFirstChar() } ).join( delim );
}

Array.prototype.uniq = function arrayPrototypeUniq() {
	var result = [];
	for( var i = 0; i < this.length; ++i ) {
		var current = this[i];
		if( result.indexOf( current ) == -1 ) {
			result.push( current );
		}
	}
	return result;
}

Array.prototype.dups = function arrayPrototypeUniq() {
	var uniques = [];
	var result = [];
	for( var i = 0; i < this.length; ++i ) {
		var current = this[i];
		if( uniques.indexOf( current ) == -1 ) {
			uniques.push( current );
		} else {
			result.push( current );
		}
	}
	return result;
}

Array.prototype.chunk = function arrayChunk( size ) {
	if( typeof( size ) != 'number' || size <= 0 ) { // pretty impossible to do anything :)
		return [ this ]; // we return an array consisting of this array.
	}
	var result = [];
	var current;
	for(var i = 0; i < this.length; ++i ) {
		if( i % size == 0 ) { // when 'i' is 0, this is always true, so we start by creating one.
			current = [];
			result.push( current );
		}
		current.push( this[i] );
	}
	return result;
}

Unbinder = function unbinder( string ) {
	if( typeof( string ) != 'string' ) {
		throw "not a string";
	}
	this.content = string;
	this.counter = 0;
	this.history = {};
	this.prefix = '%UNIQ::' + Math.random() + '::';
	this.postfix = '::UNIQ%';
}

Unbinder.prototype = {
	unbind: function UnbinderUnbind( prefix, postfix ) {
		var re = new RegExp( prefix + '(.*?)' + postfix, 'g' );
		this.content = this.content.replace( re, Unbinder.getCallback( this ) );
	},
	rebind: function UnbinderRebind() {
		var content = this.content;
		content.self = this;
		for( var current in this.history )
			if( this.history.hasOwnProperty( current ) )
				content = content.replace( current, this.history[current] );
		return content;
	},
	prefix: null, // %UNIQ::0.5955981644938324::
	postfix: null, // ::UNIQ%
	content: null, // string
	counter: null, // 0++
	history: null // {}
};

Unbinder.getCallback = function UnbinderGetCallback(self) {
	return function UnbinderCallback( match , a , b ) {
		var current = self.prefix + self.counter + self.postfix;
		self.history[current] = match;
		++self.counter;
		return current;
	};
};

function clone( obj, deep ) {
	var objectClone = new obj.constructor();
	for ( var property in obj )
		if ( !deep ) {
			objectClone[property] = obj[property];
		} else if ( typeof obj[property] == 'object' ) {
			objectClone[property] = clone( obj[property], deep );
		} else {
			objectClone[property] = obj[property];
		}
	return objectClone;
}

function ln( ns, title ) {
	var ns2ln = {
		'0':   'la',
		'1':   'lat',
		'2':   'lu',
		'3':   'lut',
		'4':   'lw',
		'5':   'lwt',
		'6':   'li',
		'7':   'lit',
		'8':   'lm',
		'9':   'lmt',
		'10':  'lt',
		'11':  'ltt',
		'12':  'lh',
		'13':  'lht',
		'14':  'lc',
		'15':  'lct',
		'100': 'lp',
		'101': 'lpt',
		'108': 'lb',
		'109': 'lbt'
	};
	return "\{\{" + ns2ln[ns] + "|" + title + "\}\}";
}

Namespace = {
	MAIN:           0,
	TALK:           1,
	USER:           2,
	USER_TALK:      3,
	PROJECT:        4,
	PROJECT_TALK:   5,
	IMAGE:          6,
	IMAGE_TALK:     7,
	FILE:           6,
	FILE_TALK:      7,
	MEDIAWIKI:      8,
	MEDIAWIKI_TALK: 9,
	TEMPLATE:       10,
	TEMPLATE_TALK:  11,
	HELP:           12,
	HELP_TALK:      13,
	CATEGORY:       14,
	CATEGORY_TALK:  15,
	PORTAL:         100,
	PORTAL_TALK:    101,
	BOOK:           108,
	BOOK_TALK:      109,
	MEDIA:          -2,
	SPECIAL:        -1,

	"":             0,
	WIKIPEDIA:      4,
	WIKIPEDIA_TALK: 5,
	WP:             4,
	WT:             5
};

/**
* Helper functions to get the month as a string instead of a number
*/

Date.monthNames = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];
Date.monthNamesAbbrev = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

Date.prototype.getMonthName = function() {
	return Date.monthNames[ this.getMonth() ];
}

Date.prototype.getMonthNameAbbrev = function() {
	return Date.monthNamesAbbrev[ this.getMonth() ];
}
Date.prototype.getUTCMonthName = function() {
	return Date.monthNames[ this.getUTCMonth() ];
}

Date.prototype.getUTCMonthNameAbbrev = function() {
	return Date.monthNamesAbbrev[ this.getUTCMonth() ];
}

// Accessor functions for wikiediting and api-access
Wikipedia = {};

Wikipedia.namespaces = {
	'-2':  'Media',
	'-1':  'Special',
	'0':   '',
	'1':   'Talk',
	'2':   'User',
	'3':   'User talk',
	'4':   'Project',
	'5':   'Project talk',
	'6':   'Image',
	'7':   'Image talk',
	'8':   'MediaWiki',
	'9':   'MediaWiki talk',
	'10':  'Template',
	'11':  'Template talk',
	'12':  'Help',
	'13':  'Help talk',
	'14':  'Category',
	'15':  'Category talk',
	'100': 'Portal',
	'101': 'Portal talk',
	'108': 'Book',
	'109': 'Book talk'
};

Wikipedia.namespacesNoSpecial = {
	'0':   '',
	'1':   'Talk',
	'2':   'User',
	'3':   'User talk',
	'4':   'Project',
	'5':   'Project talk',
	'6':   'Image',
	'7':   'Image talk',
	'8':   'MediaWiki',
	'9':   'MediaWiki talk',
	'10':  'Template',
	'11':  'Template talk',
	'12':  'Help',
	'13':  'Help talk',
	'14':  'Category',
	'15':  'Category talk',
	'100': 'Portal',
	'101': 'Portal talk',
	'108': 'Book',
	'109': 'Book talk'
};

// we dump all XHR here so they won't loose props
Wikipedia.dump = [];

Wikipedia.numberOfActionsLeft = 0;
Wikipedia.nbrOfCheckpointsLeft = 0;

/* Use of Wikipedia.actionCompleted():
 *    Every call to Wikipedia.api.post() results in the dispatch of
 *    an asynchronous callback. Each callback can in turn
 *    make an additional call to Wikipedia.api.post() to continue a 
 *    processing sequence. At the conclusion of the final callback
 *    of a processing sequence, it is not possible to simply return to the
 *    original caller because there is no call stack leading back to
 *    the original context. Instead, Wikipedia.actionCompleted.event() is
 *    called to display the result to the user and to perform an optional
 *    page redirect.
 *
 *    The determination of when to call Wikipedia.actionCompleted.event()
 *    is managed through the globals Wikipedia.numberOfActionsLeft and
 *    Wikipedia.nbrOfCheckpointsLeft. Wikipedia.numberOfActionsLeft is
 *    incremented at the start of every Wikipedia.api call and decremented 
 *    after the completion of a callback function. If a callback function
 *    does not create a new Wikipedia.api object before exiting, it is the
 *    final step in the processing chain and Wikipedia.actionCompleted.event()
 *    will then be called.
 *
 *    Optionally, callers may use Wikipedia.addCheckpoint() to indicate that
 *    processing is not complete upon the conclusion of the final callback function.
 *    This is used for batch operations. The end of a batch is signaled by calling
 *    Wikipedia.removeCheckpoint(). 
 */

Wikipedia.actionCompleted = function( self ) {
	if( --Wikipedia.numberOfActionsLeft <= 0 && Wikipedia.nbrOfCheckpointsLeft <= 0 ) {
		Wikipedia.actionCompleted.event( self );
	}
}

// Change per action wanted
Wikipedia.actionCompleted.event = function() {
	new Status( Wikipedia.actionCompleted.notice, Wikipedia.actionCompleted.postfix, 'info' );
	if( Wikipedia.actionCompleted.redirect != null ) {
		// if it isn't an url, make it an relative to self (probably this is the case)
		if( !/^\w+\:\/\//.test( Wikipedia.actionCompleted.redirect ) ) {
			Wikipedia.actionCompleted.redirect = wgServer + wgArticlePath.replace( '$1', encodeURIComponent( Wikipedia.actionCompleted.redirect ).replace( /\%2F/g, '/' ) );
			if( Wikipedia.actionCompleted.followRedirect === false ) Wikipedia.actionCompleted.redirect += "?redirect=no";
		}
		window.setTimeout( function() { window.location = Wikipedia.actionCompleted.redirect } , Wikipedia.actionCompleted.timeOut );
	}
}
wpActionCompletedTimeOut = typeof(wpActionCompletedTimeOut) == 'undefined'  ? 5000 : wpActionCompletedTimeOut;
wpMaxLag = typeof(wpMaxLag) == 'undefined' ? 10 : wpMaxLag; // Maximum lag allowed, 5-10 is a good value, the higher value, the more agressive.

Wikipedia.editCount = 10;
Wikipedia.actionCompleted.timeOut = wpActionCompletedTimeOut;
Wikipedia.actionCompleted.redirect = null;
Wikipedia.actionCompleted.notice = 'Action';
Wikipedia.actionCompleted.postfix = 'completed';

Wikipedia.addCheckpoint = function() {
	++Wikipedia.nbrOfCheckpointsLeft;
}

Wikipedia.removeCheckpoint = function() {
	if( --Wikipedia.nbrOfCheckpointsLeft <= 0 && Wikipedia.numberOfActionsLeft <= 0 ) {
		Wikipedia.actionCompleted.event();
	}
}

/*
 currentAction: text, the current action (required)
 query: Object, the query (required)
 onSuccess: function, the function to call when page gotten
 onError: function, the function to call if an error occurs
 */
Wikipedia.api = function( currentAction, query, onSuccess, statusElement, onError ) {
	this.currentAction = currentAction;
	this.query = query;
	this.query['format'] = 'xml';
	this.onSuccess = onSuccess;
	this.onError = onError;
	if( statusElement ) {
		this.statelem = statusElement;
		this.statelem.status( currentAction );
	} else {
		this.statelem = new Status( currentAction );
	}
}
Wikipedia.api.prototype = {
	currentAction: '',
	onSuccess: null,
	onError: null,
	parent: window,  // use global context if there is no parent object
	query: null,
	responseXML: null,
	setParent: function(parent) { this.parent = parent; },  // keep track of parent object for callbacks
	statelem: null,  // this non-standard name kept for backwards compatibility
	statusText: null, // result received from the API, normally "success" or "error"
	errorCode: null, // short text error code, if any, as documented in the MediaWiki API
	errorText: null, // full error description, if any

	// post(): carries out the request
	// do not specify a parameter unless you really really want to give jQuery some extra parameters
	post: function( callerAjaxParameters ) {

		++Wikipedia.numberOfActionsLeft;

		var ajaxparams = $.extend( {}, {
			context: this,
			type: 'POST',
			url: wgServer + wgScriptPath + '/api.php',
			data: QueryString.create(this.query),
			datatype: 'xml',

			success: function(xml, statusText, jqXHR) {
				this.statusText = statusText;
				this.responseXML = xml;
				this.errorCode = $(xml).find('error').attr('code');
				this.errorText = $(xml).find('error').attr('info');

				if (typeof(this.errorCode) === "string") {

					// the API didn't like what we told it, e.g., bad edit token or an error creating a page
					this.returnError();
					return;
				}

				// invoke success callback if one was supplied
				if (this.onSuccess) {

					// set the callback context to this.parent for new code and supply the API object
					// as the first argument to the callback (for legacy code)
					this.onSuccess.call( this.parent, this );
				} else {
					this.statelem.info("Done");
				}

				Wikipedia.actionCompleted();
			},

			// only network and server errors reach here – complaints from the API itself are caught in success()
			error: function(jqXHR, statusText, errorThrown) {
				this.statusText = statusText;
				this.errorThrown = errorThrown; // frequently undefined
				this.errorText = statusText + ' "' + jqXHR.statusText + '" occurred while contacting the API.';
				this.returnError();
			}

		}, callerAjaxParameters );

		return $.ajax( ajaxparams );  // the return value should be ignored, unless using callerAjaxParameters with |async: false|
	},

	returnError: function() {

		// invoke failure callback if one was supplied
		if (this.onError) {

			// set the callback context to this.parent for new code and supply the API object
			// as the first argument to the callback for legacy code
			this.onError.call( this.parent, this );
		} else {
			this.statelem.error( this.errorText );
		}
		// don't complete the action so that the error remains displayed
	},

	getStatusElement: function() {
		return this.statelem;
	},

	getErrorCode: function() {
		return this.errorCode;
	},

	getErrorText: function() {
		return this.errorText;
	},

	getXML: function() {
		return this.responseXML;
	}
}

/** 
 * Class: Wikipedia.page
 * Uses the MediaWiki API to load a page and optionally edit it.
 *
 * Callers are not permitted to directly access the properties of this class!
 * All property access is through the appropriate getProperty() or setProperty() method.
 *
 * Callers should set Wikipedia.actionCompleted.notice and Wikipedia.actionCompleted.redirect
 * before the first call to Wikipedia.page.load().
 *
 * Each of the callback functions takes one parameter, which is a
 * reference to the Wikipedia.page object that registered the callback.
 * Callback functions may invoke any Wikipedia.page prototype method using this reference.
 *
 * Constructor: Wikipedia.page(pageName, currentAction)
 *    pageName - the name of the page, prefixed by the namespace (if any)
 *               (for the current page, use wgPageName)
 *    currentAction - a string describing the action about to be undertaken (optional)
 *
 * load(onSuccess, onFailure): Loads the text for the page
 *    onSuccess - callback function which is called when the load has succeeded
 *    onFailure - callback function which is called when the load fails (optional)
 *                *** onFailure for load() is not yet implemented – do we need it? ***
 *
 * save(onSuccess, onFailure): Saves the text for the page. Must be preceded by calling load().
 *    onSuccess - callback function which is called when the save has succeeded (optional)
 *    onFailure - callback function which is called when the save fails (optional)
 *    Warning: Calling save() can result in additional calls to the previous load() callbacks to
 *             recover from edit conflicts! 
 *             In this case, callers must make the same edit to the new pageText and reinvoke save(). 
 *             This behavior can be disabled with setMaxConflictRetries(0).
 *
 * append(onSuccess, onFailure): Adds the text provided via setAppendText() to the end of the page.
 *                               Does not require calling load() first.
 *    onSuccess - callback function which is called when the method has succeeded (optional)
 *    onFailure - callback function which is called when the method fails (optional)
 *
 * prepend(onSuccess, onFailure): Adds the text provided via setPrependText() to the start of the page.
 *                                Does not require calling load() first.
 *    onSuccess - callback function which is called when the method has succeeded (optional)
 *    onFailure - callback function which is called when the method fails (optional)
 *
 * getPageName(): returns a string containing the name of the loaded page, including the namespace
 *
 * getPageText(): returns a string containing the text of the page after a successful load()
 *
 * setPageText(pageText) 
 *    pageText - string containing the updated page text that will be saved when save() is called
 *
 * setAppendText(appendText) 
 *    appendText - string containing the text that will be appended to the page when append() is called
 *
 * setPrependText(prependText) 
 *    prependText - string containing the text that will be prepended to the page when prepend() is called
 *
 * setEditSummary(summary)
 *    summary - string containing the text of the edit summary that will be used when save() is called
 *
 * setMinorEdit(minorEdit) 
 *    minorEdit is a boolean value:
 *       true  - When save is called, the resulting edit will be marked as "minor".
 *       false - When save is called, the resulting edit will not be marked as "minor". (default)
 *
 * setPageSection(pageSection)
 *    pageSection - integer specifying the section number to load or save. The default is |null|, which means
 *                  that the entire page will be retrieved.
 *
 * setMaxConflictRetries(maxRetries)
 *    maxRetries - number of retries for save errors involving an edit conflict or loss of edit token
 *    default: 2
 *
 * setMaxRetries(maxRetries)
 *    maxRetries - number of retries for save errors not involving an edit conflict or loss of edit token
 *    default: 2
 *
 * setCallbackParameters(callbackParameters)
 *    callbackParameters - an object for use in a callback function
 *
 * getCallbackParameters(): returns the object previous set by setCallbackParameters()
 *
 *    Callback notes: callbackParameters is for use by the caller only. The parameters
 *                    allow a caller to pass the proper context into its callback function.
 *                    Callers must ensure that any changes to the callbackParameters object
 *                    within a load() callback still permit a proper re-entry into the
 *                    load() callback if an edit conflict is detected upon calling save().
 *
 * getStatusElement(): returns the Status element created by the constructor
 *
 * setFollowRedirect(followRedirect)
 *    followRedirect is a boolean value:
 *       true  - a maximum of one redirect will be followed.
 *               In the event of a redirect, a message is displayed to the user and 
 *               the redirect target can be retrieved with getPageName().
 *       false - the requested pageName will be used without regard to any redirect. (default)
 *
 * setWatchlist(watchlistOption)
 *    watchlistOption is a boolean value:
 *       true  - page will be added to the user's watchlist when save() is called
 *       false - watchlist status of the page will not be changed (default)
 *
 * setWatchlistFromPreferences(watchlistOption)
 *    watchlistOption is a boolean value:
 *       true  - page watchlist status will be set based on the user's 
 *               preference settings when save() is called
 *       false - watchlist status of the page will not be changed (default)
 *
 *    Watchlist notes:
 *       1. The MediaWiki API value of 'unwatch' isn't used here because it seems to behave
 *          the same as 'nochange'. Not sure why we would want this option anyway.
 *       2. If both setWatchlist() and setWatchlistFromPreferences() are called,
 *          the last call takes priority.
 *       3. Twinkle modules should use the appropriate TwinkleConfig parameter to set the watchlist options.
 *       4. Most Twinkle modules use setWatchlist().
 *          setWatchlistFromPreferences() is only used for the few TwinkleConfig watchlist parameters
 *          that accept a string value of 'default'.
 *
 * setCreateOption(createOption)
 *    createOption is a string value:
 *       'recreate'   - create the page if it does not exist, or edit it if it exists
 *       'createonly' - create the page if it does not exist, but return an error if it
 *                      already exists
 *       'nocreate'   - don't create the page, only edit it if it already exists
 *       null         - create the page if it does not exist, unless it was deleted in the moment
 *                      between retrieving the edit token and saving the edit (default)
 *
 * exists(): returns true if the page existed on the wiki when it was last loaded
 * 
 * getCreator(): returns the user who created the page following lookupCreator()
 *
 */

/**
 * Call sequence for common operations (optional final user callbacks not shown):
 *
 *    Edit current contents of a page (no edit conflict):
 *       .load(userTextEditCallback) -> ctx.loadApi.post() -> ctx.loadApi.post.success() -> 
 *             ctx.fnLoadSuccess() -> userTextEditCallback() -> .save() -> 
 *             ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveSuccess()
 *
 *    Edit current contents of a page (with edit conflict):
 *       .load(userTextEditCallback) -> ctx.loadApi.post() -> ctx.loadApi.post.success() -> 
 *             ctx.fnLoadSuccess() -> userTextEditCallback() -> .save() -> 
 *             ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveError() ->
 *             ctx.loadApi.post() -> ctx.loadApi.post.success() -> 
 *             ctx.fnLoadSuccess() -> userTextEditCallback() -> .save() -> 
 *             ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveSuccess()
 *
 *    Append to a page (similar for prepend):
 *       .append() -> ctx.loadApi.post() -> ctx.loadApi.post.success() -> 
 *             ctx.fnLoadSuccess() -> ctx.fnAutoSave() -> .save() -> 
 *             ctx.saveApi.post() -> ctx.loadApi.post.success() -> ctx.fnSaveSuccess()
 *
 *    Notes: 
 *       1. All functions following Wikipedia.api.post() are invoked asynchronously 
 *          from the jQuery AJAX library.
 *       2. The sequence for append/prepend could be slightly shortened, but it would require
 *          significant duplication of code for little benefit.
 */

Wikipedia.page = function(pageName, currentAction) {

	/**
	 * Public interface accessors
	 */
	this.getPageName = function() {
		return ctx.pageName;
	};

	this.getPageText = function() {
		return ctx.pageText;
	};

	this.setPageText = function(pageText) {
		ctx.editMode = 'all';
		ctx.pageText = pageText;
	};

	this.setAppendText = function(appendText) {
		ctx.editMode = 'append';
		ctx.appendText = appendText;
	};

	this.setPrependText = function(prependText) {
		ctx.editMode = 'prepend';
		ctx.prependText = prependText;
	};

	this.setEditSummary = function(summary) {
		ctx.editSummary = summary;
	};

	this.setCreateOption = function(createOption) {
		ctx.createOption = createOption;
	};

	this.setMinorEdit = function(minorEdit) {
		ctx.minorEdit = minorEdit;
	};

	this.setPageSection = function(pageSection) {
		ctx.pageSection = pageSection;
	};

	this.setMaxConflictRetries = function(maxRetries) {
		ctx.maxConflictRetries = maxRetries;
	};

	this.setMaxRetries = function(maxRetries) {
		ctx.maxRetries = maxRetries;
	};

	this.setCallbackParameters = function(callbackParameters) {
		ctx.callbackParameters = callbackParameters;
	};

	this.getCallbackParameters = function() {
		return ctx.callbackParameters;
	};

	this.getCreator = function() {
		return ctx.creator;
	};

	this.getStatusElement = function() {
		return ctx.statusElement;
	};

	this.setFollowRedirect = function(followRedirect) {
		if (ctx.pageLoaded) {
			ctx.statusElement.error("Internal error: cannot change redirect setting after the page has been loaded!");
			return;
		}
		ctx.followRedirect = followRedirect;
	};

	this.setWatchlist = function(flag) {
		if (flag) ctx.watchlistOption = 'watch';
		else ctx.watchlistOption = 'nochange';
	};

	this.setWatchlistFromPreferences = function(flag) {
		if (flag) ctx.watchlistOption = 'preferences';
		else ctx.watchlistOption = 'nochange';
	};

	this.exists = function() {
		return ctx.pageExists;
	};

	this.load = function(onSuccess, onFailure) {
		ctx.onLoadSuccess = onSuccess;
		ctx.onLoadFailure = onFailure;

		// Need to be able to do something after the page loads
		if (onSuccess == null) {
			ctx.statusElement.error("Internal error: no onSuccess callback provided to load()!");
			return;
		}

		ctx.loadQuery = {
			action: 'query',
			prop: 'info|revisions',
			intoken: 'edit',  // fetch an edit token
			titles: ctx.pageName
			// don't need rvlimit=1 because we don't need rvstartid here and only one actual rev is returned by default
		};

		if (ctx.followRedirect) {
			ctx.loadQuery.redirects = '';  // follow all redirects
		}
		
		if (typeof(ctx.pageSection) === 'number') {
			ctx.loadQuery.rvsection = ctx.pageSection;
		}

		if (ctx.editMode == 'all') ctx.loadQuery.rvprop = 'content';  // get the page content at the same time, if needed

		ctx.loadApi = new Wikipedia.api("Retrieving page...", ctx.loadQuery, fnLoadSuccess, ctx.statusElement);
		ctx.loadApi.setParent(this);
		ctx.loadApi.post();
	};

	// Save updated .pageText to Wikipedia
	// Only valid after successful .load()
	this.save = function(onSuccess, onFailure) {
		if (!ctx.pageLoaded)
		{
			ctx.statusElement.error("Internal error: attempt to save a page that has not been loaded!");
			return;
		}
		if (!ctx.editSummary)
		{
			ctx.statusElement.error("Internal error: edit summary not set before save!");
			return;
		}
		ctx.onSaveSuccess = onSuccess;
		ctx.onSaveFailure = onFailure;
		ctx.retries = 0;

		var query = {
			action: 'edit',
			title: ctx.pageName,
			summary: ctx.editSummary,
			token: ctx.editToken,
			watchlist: ctx.watchlistOption
		};

		if (typeof(ctx.pageSection) === 'number') {
			query.section = ctx.pageSection;
		}

		// Set minor edit attribute. If these parameters are present with any value, it is interpreted as true
		if (ctx.minorEdit) {
			query.minor = true;
		} else {
			query.notminor = true;  // force Twinkle config to override user preference setting for "all edits are minor"
		}

		switch (ctx.editMode) {
		case 'append':
			query.appendtext = ctx.appendText;  // use mode to append to current page contents
			break;
		case 'prepend':
			query.prependtext = ctx.prependText;  // use mode to prepend to current page contents
			break;
		default:
			query.text = ctx.pageText; // replace entire contents of the page
			if (ctx.lastEditTime) {
				query.basetimestamp = ctx.lastEditTime; // check that page hasn't been edited since it was loaded
			}
			query.starttimestamp = ctx.loadTime; // check that page hasn't been deleted since it was loaded (don't recreate bad stuff)
			break;
		}

		if (['recreate', 'createonly', 'nocreate'].indexOf(ctx.createOption) != -1) {
			query[ctx.createOption] = '';
		}

		ctx.saveApi = new Wikipedia.api( "Saving page...", query, fnSaveSuccess, ctx.statusElement, fnSaveError);
		ctx.saveApi.setParent(this);
		ctx.saveApi.post();
	};

	this.append = function(onSuccess, onFailure) {
		ctx.editMode = 'append';
		ctx.onSaveSuccess = onSuccess;
		ctx.onSaveFailure = onFailure;
		this.load(fnAutoSave, onFailure);
	};

	this.prepend = function(onSuccess, onFailure) {
		ctx.editMode = 'prepend';
		ctx.onSaveSuccess = onSuccess;
		ctx.onSaveFailure = onFailure;
		this.load(fnAutoSave, onFailure);
	};

	this.lookupCreator = function(onSuccess) {
		if (onSuccess == null) {
			ctx.statusElement.error("Internal error: no onSuccess callback provided to lookupCreator()!");
			return;
		}
		ctx.onLookupCreatorSuccess = onSuccess;

		var query = {
			'action': 'query',
			'prop': 'revisions',
			'titles': ctx.pageName,
			'rvlimit': 1,
			'rvprop': 'user',
			'rvdir': 'newer'
		};
		
		if (ctx.followRedirect) {
			query.redirects = '';  // follow all redirects
		}
		
		ctx.lookupCreatorApi = new Wikipedia.api("Retrieving page creator information", query, fnLookupCreatorSuccess, ctx.statusElement);
		ctx.lookupCreatorApi.setParent(this);
		ctx.lookupCreatorApi.post();
	};

	/**
	 * Initialization
	 */
	if (currentAction == null) currentAction = 'Opening page "' + pageName + '"';

	/**
	 * Private context variables
	 *
	 * This context is not visible to the outside, thus all the data here
	 * must be accessed via getter and setter functions.
	 */
	var ctx = {
		 // backing fields for public properties
		pageName: pageName,
		pageText: null,
		editMode: 'all',  // save() replaces entire contents of the page by default
		appendText: null,   // can't reuse pageText for this because pageText is needed to follow a redirect
		prependText: null,  // can't reuse pageText for this because pageText is needed to follow a redirect
		editSummary: null,
		createOption: null,
		minorEdit: false,
		pageSection: null,
		maxConflictRetries: 2,
		maxRetries: 2,
		callbackParameters: null,
		statusElement: new Status(currentAction),
		followRedirect: false,
		watchlistOption: 'nochange',
		pageExists: false,
		creator: null,
		 // internal status
		pageLoaded: false,
		editToken: null,
		loadTime: null,
		lastEditTime: null,
		conflictRetries: 0,
		retries: 0,
		 // callbacks
		onLoadSuccess: null,
		onLoadFailure: null,
		onSaveSuccess: null,
		onSaveFailure: null,
		onLookupCreatorSuccess: null,
		 // internal objects
		loadQuery: null,
		loadApi: null,
		saveApi: null,
		lookupCreatorApi: null
	};

	/**
	 * Private member functions
	 *
	 * These are not exposed outside
	 */

	// callback from loadSuccess() for append() and prepend() threads
	var fnAutoSave = function(pageobj) {
		pageobj.save(ctx.onSaveSuccess, ctx.onSaveFailure);
	};

	// callback from loadApi.post()
	var fnLoadSuccess = function() {
		var xml = ctx.loadApi.getXML();

		if ( !fnCheckPageName(xml) ) {
			return; // abort
		}

		ctx.pageExists = !($(xml).find('page').attr('missing'));
		if (ctx.pageExists) {
			ctx.pageText = $(xml).find('rev').text();
		} else {
			ctx.pageText = '';  // allow for concatenation, etc.
		}

		ctx.editToken = $(xml).find('page').attr('edittoken');
		if (!ctx.editToken)
		{
			ctx.statusElement.error("Failed to retrieve edit token.");
			return;
		}
		ctx.loadTime = $(xml).find('page').attr('starttimestamp');
		if (!ctx.loadTime)
		{
			ctx.statusElement.error("Failed to retrieve start timestamp.");
			return;
		}
		ctx.lastEditTime = $(xml).find('page').attr('touched');
		ctx.pageLoaded = true;

		// alert("Generate edit conflict now");  // for testing edit conflict recovery logic
		ctx.onLoadSuccess(this);  // invoke callback
	};

	// helper function to parse the page name returned from the API
	var fnCheckPageName = function(xml) {
	
		// check for invalid titles
		if ( $(xml).find('page').attr('invalid') ) {
			ctx.statusElement.error("Attempt to edit a page with invalid title: " + ctx.pageName);
			return false; // abort
		}

		// retrieve actual title of the page after normalization and redirects
		if ( $(xml).find('page').attr('title') ) {
			var resolvedName = $(xml).find('page').attr('title');
			
			// only notify user for redirects, not normalization
			if ( $(xml).find('redirects').length > 0 ) {
				Status.info("Info", "Redirected from " + ctx.pageName + " to " + resolvedName );
			}
			ctx.pageName = resolvedName;  // always update in case of normalization
		}
		else {
			// could be a circular redirect or other problem
			ctx.statusElement.error("Could not resolve redirects for: " + ctx.pageName);

			// force error to stay on the screen
			++Wikipedia.numberOfActionsLeft;
			return false; // abort
		}
		return true; // all OK
	};
		
	
	// callback from saveApi.post()
	var fnSaveSuccess = function() {
		ctx.editMode = 'all';  // cancel append/prepend modes
		var xml = ctx.saveApi.getXML();

		// see if the API thinks we were successful
		if ($(xml).find('edit').attr('result') == "Success") {
		
			// real success
			if (ctx.onSaveSuccess) {
				ctx.onSaveSuccess(this);  // invoke callback
			}
			else {
				// default on success action - display link for edited page
				var link = document.createElement('a');
				link.setAttribute('href', wgArticlePath.replace('$1', ctx.pageName));
				link.appendChild(document.createTextNode(ctx.pageName));
				ctx.statusElement.info(['completed (', link, ')']);
			}
			return;
		}
		
		// errors here are only generated by extensions which hook APIEditBeforeSave within MediaWiki
		// Wikimedia wikis should only return spam blacklist errors and captchas
		var blacklist = $(xml).find('edit').attr('spamblacklist');

		if (blacklist) {
			var code = document.createElement('code');
			code.style.fontFamily = "monospace";
			code.appendChild(document.createTextNode(blacklist));
			ctx.statusElement.error(['Could not save the page because the URL ', code, ' is on the spam blacklist.']);
		}
		else if ( $(xml).find('captcha').length > 0 ) {
			ctx.statusElement.error("Could not save the page because the wiki server wanted you to fill out a CAPTCHA.");
		}
		else {
			ctx.statusElement.error("Unknown error received from API while saving page");
		}
		
		// force error to stay on the screen
		++Wikipedia.numberOfActionsLeft;
	};

	// callback from saveApi.post()
	var fnSaveError = function() {

		var errorCode = ctx.saveApi.getErrorCode();

		// check for edit conflict
		if ( errorCode == "editconflict" && ctx.conflictRetries++ < ctx.maxConflictRetries ) {
			 
			// edit conflicts can occur when the page needs to be purged from the server cache
			var purgeQuery = {
				action: 'purge',
				titles: ctx.pageName  // redirects are already resolved
			};

			var purgeApi = new Wikipedia.api("Edit conflict detected, purging server cache", purgeQuery, null, ctx.statusElement);
			var result = purgeApi.post( { async: false } );  // just wait for it, result is for debugging

			--Wikipedia.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			
			ctx.statusElement.info("Edit conflict detected, reapplying edit");
			ctx.loadApi.post(); // reload the page and reapply the edit

		// check for loss of edit token
		// it's impractical to request a new token here, so invoke edit conflict logic when this happens
		} else if ( errorCode == "notoken" && ctx.conflictRetries++ < ctx.maxConflictRetries ) {
			 
			ctx.statusElement.info("Edit token is invalid, retrying");
			--Wikipedia.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			ctx.loadApi.post(); // reload

		// check for network or server error
		} else if ( errorCode == "undefined" && ctx.retries++ < ctx.maxRetries ) {

			// the error might be transient, so try again
			ctx.statusElement.info("Save failed, retrying");
			--Wikipedia.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			ctx.saveApi.post(); // give it another go!

		} else {
			// hard error, give up
			ctx.statusElement.error( "Failed to save edit: " + ctx.saveApi.getErrorText() );
			ctx.editMode = 'all';  // cancel append/prepend modes
			if (ctx.onSaveFailure) {
				ctx.onSaveFailure(this);  // invoke callback
			}
		}
	};

	var fnLookupCreatorSuccess = function() {
		var xml = ctx.lookupCreatorApi.getXML();
		
		if ( !fnCheckPageName(xml) ) {
			return; // abort
		}

		ctx.creator = $(xml).find('rev').attr('user');
		if (!ctx.creator) {
			ctx.statusElement.error("Could not find name of page creator");
			return;
		}
		ctx.onLookupCreatorSuccess(this);
	};
} /* end Wikipedia.page */

/** Issues:
 * - Do we need the onFailure callbacks? How do we know when to call them? Timeouts? Enhance Wikipedia.api for failures?
 * - Should we retry loads also?
 * - Need to reset current action before the save?
 * - Deal with action.completed stuff
 */


/************* The following three functions are from the old Wikipedia.page 
               and haven't yet been converted to the new format *******************/


/** 
 * Wikipedia.page.revert
 * Uses the MediaWiki API to revert a page to an earlier revision.
 *
 * About the callback functions:
 *  See Wikipedia.page.edit documentation above.
 *
 * Parameters:
 *  currentAction - the name of the action performed by the edit (e.g. "Reverting given revision")
 *  title - the title of the page to edit (for the current page, use wgPageName)
 *  oldid - the revision ID to revert to
 *  editSummary - the edit summary to use (or |undefined| if the default summary should be used -- ??? maybe this works)
 *  onsuccess - a callback function which is called when the revert has succeeded (optional)
 *  onFailure - a callback function which is called when the revert fails (optional, and rarely 
 *              needed - the built-in error handling should typically be enough)
 */
wikiRevert = function(currentAction, title, oldid, summary, onsuccess, onfailure)
{
	var query = {
		'action': 'query',
		'prop': 'info|revisions',
		'intoken': 'edit', // fetch an edit token
		'titles': title
	};
	var statelem = new Status(currentAction);
	var wikipedia_api = new Wikipedia.api("Retrieving revert data...", query, Wikipedia.page.callbacks.revert.request, statelem);
	wikipedia_api.params = params;
	wikipedia_api.title = title;
	wikipedia_api.oldid = oldid;
	wikipedia_api.summary = summary;
	wikipedia_api.onsuccess = (onsuccess ? onsuccess : function(self) { self.statelem.info("Done") });
	wikipedia_api.onfailure = onfailure;
	wikipedia_api.post();
}

// Don't call this function. It's a callback.
wikiRevertCallback = function(self) {
	var xmlDoc = self.responseXML;
	var revid = xmlDoc.evaluate('//rev/@revid', xmlDoc, null, XPathResult.STRING_TYPE, null).stringValue;
	var edittoken = self.responseXML.evaluate('//page/@edittoken', self.responseXML, null, XPathResult.STRING_TYPE, null).stringValue;
	if (!edittoken)
	{
		self.statelem.error("Failed to retrieve edit token.");
		return;
	}
	var basetimestamp = xmlDoc.evaluate('//page/@touched', xmlDoc, null, XPathResult.STRING_TYPE, null).stringValue;

	var query = {
		'action': 'edit',
		'title': self.title,
		'token': edittoken,
		'basetimestamp': basetimestamp, // prevent (most...) edit conflicts
		'summary': self.summary,
		'undo': oldid,
		'undoafter': revid
	};
	var wikipedia_api = new Wikipedia.api("Sending revert data...", result, Wikipedia.page.callbacks.edit.success, self.statelem);
	wikipedia_api.params = self.params;
	wikipedia_api.title = self.title;
	wikipedia_api.post();
}

/*
 currentAction: text, the current action (required)
 query: Object, the query (required)
 oninit: function, the function to call when page gotten (required)
 onsuccess: function, a function to call when post succeeded
 onerror: function, a function to call when we abort failed posts
 onretry: function, a function to call when we try to retry a post
 */
Wikipedia.wiki = function( currentAction, query, oninit, onsuccess, onerror, onretry ) {

	alert('The action "' + currentAction + '" is still using the "Wikipedia.wiki" class.'); // for code testers only - normal editors won't need this alert

	this.currentAction = currentAction;
	this.query = query;
	this.oninit = oninit;
	this.onsuccess = onsuccess;
	this.onerror = onerror;
	this.onretry = onretry;
	this.statelem = new Status( currentAction );
	++Wikipedia.numberOfActionsLeft;
}

Wikipedia.wiki.prototype = {
	currentAction: '',
	onsuccess: null,
	onerror: null,
	onretry: null,
	oninit: null,
	query: null,
	postData: null,
	responseXML: null,
	statelem: null,
	counter: 0,
	post: function( data ) {
		this.postData = data;
		if( Wikipedia.editCount <= 0 ) {
			this.query['maxlag'] = wpMaxLag; // are we a bot?
		} else {
			--Wikipedia.editCount;
		}

		var xmlhttp = sajax_init_object();
		Wikipedia.dump.push( xmlhttp );
		xmlhttp.obj = this;
		xmlhttp.overrideMimeType('text/xml');
		xmlhttp.open( 'POST' , wgServer + wgScriptPath + '/index.php?useskin=monobook&' + QueryString.create( this.query ), true);
		xmlhttp.setRequestHeader('Content-type','application/x-www-form-urlencoded');
		xmlhttp.onerror = function(e) {
			var self = this.obj;
			self.statelem.error( "Error " + this.status + " occurred while posting the document." );
		}
		xmlhttp.onload = function(e) {
			var self = this.obj;
			var status = this.status;
			if( status != 200 ) {
				if( status == 503 ) {
					var retry = this.getResponseHeader( 'Retry-After' );
					var lag = this.getResponseHeader( 'X-Database-Lag' );
					if( lag ) {
						self.statelem.warn( "current lag of " + lag + " seconds is more than our defined maximum lag of " + wpMaxLag + " seconds, will retry in " + retry + " seconds" );
						window.setTimeout( function( self ) { self.post( self.postData ); }, retry * 1000, self );
						return;
					} else {
						self.statelem.error( "Error " + status + " occurred while posting the document." );
					}
				}
				return;
			}
			var xmlDoc;
			xmlDoc = self.responseXML = this.responseXML;
			var xpathExpr =  'boolean(//div[@class=\'previewnote\']/p/strong[contains(.,\'Sorry! We could not process your edit due to a loss of session data\')])';
			var nosession = xmlDoc.evaluate( xpathExpr, xmlDoc, null, XPathResult.BOOLEAN_TYPE, null ).booleanValue;
			if( nosession ) {
				// Grabbing the shipping token, and repost
				var new_token = xmlDoc.evaluate( '//input[@name="wfEditToken"]/@value', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
				self.postData['wfEditToken'] = new_token;
				self.post( self.postData );
			} else {
				if( self.onsuccess ) {
					self.onsuccess( self );
				} else {
					var link = document.createElement( 'a' );
					link.setAttribute( 'href', wgArticlePath.replace( '$1', self.query['title'] ) );
					link.setAttribute( 'title', self.query['title'] );
					link.appendChild( document.createTextNode( self.query['title'] ) );

					self.statelem.info( [ 'completed (' , link , ')' ] );
				}
				Wikipedia.actionCompleted();
			}
		};
		xmlhttp.send( QueryString.create( this.postData ) );
	},
	get: function() {
		this.onloading( this );
		var redirect_query = {
			'action': 'query',
			'titles': this.query['title'],
			'redirects': ''
		}

		var wikipedia_api = new Wikipedia.api( "resolving eventual redirect", redirect_query, this.postget, this.statelem );
		wikipedia_api.parent = this;
		wikipedia_api.post();
	},
	postget: function() {
		var xmlDoc = self.responseXML = this.responseXML;
		var to = xmlDoc.evaluate( '//redirects/r/@to', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
		if( !this.parent.followRedirect ) {
			this.parent.statelem.info('ignoring eventual redirect');
		} else if( to ) {
			this.parent.query['title'] = to;
		}
		this.parent.onloading( this );
		var xmlhttp = sajax_init_object();
		Wikipedia.dump.push( xmlhttp );
		xmlhttp.obj = this.parent;
		xmlhttp.overrideMimeType('text/xml');
		xmlhttp.open( 'GET' , wgServer + wgScriptPath + '/index.php?useskin=monobook&' + QueryString.create( this.parent.query ), true);
		xmlhttp.onerror = function() {
			var self = this.obj;
			self.statelem.error( "Error " + this.status + " occurred while receiving the document." );
		}
		xmlhttp.onload = function() { 
			this.obj.onloaded( this.obj );
			this.obj.responseXML = this.responseXML;
			this.obj.responseText = this.responseText;
			this.obj.oninit( this.obj ); 
		};
		xmlhttp.send( null );
	},
	onloading: function() {
		this.statelem.status( 'loading data...' );
	},
	onloaded: function() {
		this.statelem.status( 'data loaded...' );
	}
}


/**
 * These functions retrieve the date from the server. It uses bandwidth, time, etc.
 * They should be used only when the magic words { {subst:CURRENTDAY}},
 * { {subst:CURRENTMONTHNAME}}, and { {subst:CURRENTYEAR}} cannot be used
 * (for example, when specifying the title of a page).
 */
//WikiDate = {
//  currentLongDate: false,
  // Gets the server date in yyyy mmmm dd format (e.g. for XfD daily pages).
//  getLongDate: function wikiDateGetLongDate()
//  {
//    var query = {
//      'action': 'expandtemplates',
//      'text': '\{\{CURRENTYEAR}} \{\{CURRENTMONTHNAME}} \{\{CURRENTDAY}}'
//    };
//    var callback = function(self) 
//    {

//    };
//    var wpapi = new Wikipedia.api("Retrieving server date", query, callback);
    // AJAX is async, unfortunately; this stuff is not a nice solution
//    for (var i = 0; i < 20; i++)

//  }
//};

Number.prototype.zeroFill = function( length ) {
	var str = this.toFixed();
	if( !length ) { return str; }
	while( str.length < length ) { str = '0' + str; }
	return str;
}

Mediawiki = {};

Mediawiki.Template = {
	parse: function( text, start ) {
		var count = -1;
		var level = -1;
		var equals = -1;
		var current = '';
		var result = {
			name: '',
			parameters: {}
		};

		for( var i = start; i < text.length; ++i ) {
			var test3 = text.substr( i, 3 );
			if( test3 == '\{\{\{' ) {
				current += '\{\{\{';
				i += 2;
				++level;
				continue;
			}
			if( test3 == '\}\}\}' ) {
				current += '\}\}\}';
				i += 2;
				--level;
				continue;
			}
			var test2 = text.substr( i, 2 );
			if( test2 == '\{\{' || test2 == '\[\[' ) {
				current += test2;
				++i;
				++level;
				continue;
			}
			if( test2 == '\]\]' ) {
				current += test2;
				++i;
				--level;
				continue;
			}
			if( test2 == '\}\}' ) {
				current += test2;
				++i;
				--level;

				if( level <= 0 ) {
					if( count == -1 ) {
						result.name = current.substring(2).trim();
						++count;
					} else {
						if( equals != -1 ) {
							var key = current.substring( 0, equals ).trim();
							var value = current.substring( equals ).trim();
							result.parameters[key] = value;
							equals = -1;
						} else {
							result.parameters[count] = current;
							++count;
						}
					}
					break;
				}
				continue;
			}

			if( text.charAt(i) == '|' && level <= 0 ) {
				if( count == -1 ) {
					result.name = current.substring(2).trim();
					++count;
				} else {
					if( equals != -1 ) {
						var key = current.substring( 0, equals ).trim();
						var value = current.substring( equals + 1 ).trim();
						result.parameters[key] = value;
						equals = -1;
					} else {
						result.parameters[count] = current;
						++count;
					}
				}
				current = '';
			} else if( equals == -1 && text.charAt(i) == '=' && level <= 0 ) {
				equals = current.length;
				current += text.charAt(i);
			} else {
				current += text.charAt(i);
			}
		}

		return result;
	}
}

Mediawiki.Page = function mediawikiPage( text ) {
	this.text = text;
}


Mediawiki.Page.prototype = {
	text: '',
	removeLink: function( link_target ) {
		var first_char = link_target.substr( 0, 1 );
		var link_re_string = "[" + first_char.toUpperCase() + first_char.toLowerCase() + ']' +  RegExp.escape( link_target.substr( 1 ), true );
		var link_simple_re = new RegExp( "\\[\\[:?(" + link_re_string + ")\\|?\\]\\]", 'g' );
		var link_named_re = new RegExp( "\\[\\[:?" + link_re_string + "\\|(.+?)\\]\\]", 'g' );
		if( link_simple_re.test(this.text) ) {
			this.text = this.text.replace( link_simple_re, "$1" );
		} else {
			this.text = this.text.replace( link_named_re, "$1" );
		}
	},
	commentOutImage: function( image, reason ) {
		var unbinder = new Unbinder( this.text );
		unbinder.unbind( '<!--', '-->' );

		reason = reason ? ' ' + reason + ': ' : '';
		var first_char = image.substr( 0, 1 );
		var image_re_string = "[" + first_char.toUpperCase() + first_char.toLowerCase() + ']' +  RegExp.escape( image.substr( 1 ), true ); 

		/*
		 * Check for normal image links, i.e. [[Image:Foobar.png|...]]
		 * Will eat the whole link
		 */
		var links_re = new RegExp( "\\[\\[(?:[Ii]mage|[Ff]ile):\\s*" + image_re_string );
		var allLinks = unbinder.content.splitWeightedByKeys( '[[', ']]' ).uniq();
		for( var i = 0; i < allLinks.length; ++i ) {
			if( links_re.test( allLinks[i] ) ) {
				var replacement = '<!-- ' + reason + allLinks[i] + ' -->';
				unbinder.content = unbinder.content.replace( allLinks[i], replacement, 'g' );
			}
		}
		// unbind the newly created comments
		unbinder.unbind( '<!--', '-->' );

		/*
		 * Check for gallery images, i.e. instances that must start on a new line, eventually preceded with some space, and must include Image: prefix
		 * Will eat the whole line.
		 */
		var gallery_image_re = new RegExp( "(^\\s*(?:[Ii]mage|[Ff]ile):\\s*" + image_re_string + ".*?$)", 'mg' );
		unbinder.content.replace( gallery_image_re, "<!-- " + reason + "$1 -->" );

		// unbind the newly created comments
		unbinder.unbind( '<!--', '-->' );
		/*
		 * Check free image usages, for example as template arguments, might have the Image: prefix excluded, but must be preceeded by an |
		 * Will only eat the image name and the preceeding bar and an eventual named parameter
		 */
		var free_image_re = new RegExp( "(\\|\\s*(?:[\\w\\s]+\\=)?\\s*(?:(?:[Ii]mage|[Ff]ile):\\s*)?" + image_re_string + ")", 'mg' );
		unbinder.content.replace( free_image_re, "<!-- " + reason + "$1 -->" );

		// Rebind the content now, we are done!
		this.text = unbinder.rebind();
	},
	addToImageComment: function( image, data ) {
		var first_char = image.substr( 0, 1 );
		var image_re_string = "(?:[Ii]mage|[Ff]ile):\\s*[" + first_char.toUpperCase() + first_char.toLowerCase() + ']' +  RegExp.escape( image.substr( 1 ), true ); 
		var links_re = new RegExp( "\\[\\[" + image_re_string );
		var allLinks = this.text.splitWeightedByKeys( '[[', ']]' ).uniq();
		for( var i = 0; i < allLinks.length; ++i ) {
			if( links_re.test( allLinks[i] ) ) {
				var replacement = allLinks[i];
				// just put it at the end?
				replacement = replacement.replace( /\]\]$/, '|' + data + ']]' );
				this.text = this.text.replace( allLinks[i], replacement, 'g' );
			}
		}
		var gallery_re = new RegExp( "^(\\s*" + image_re_string + '.*?)\\|?(.*?)$', 'mg' );
		var replacement = "$1|$2 " + data;
		this.text = this.text.replace( gallery_re, replacement );
	},
	removeTemplate: function( template ) {
		var first_char = template.substr( 0, 1 );
		var template_re_string = "(?:[Tt]emplate:)?\\s*[" + first_char.toUpperCase() + first_char.toLowerCase() + ']' +  RegExp.escape( template.substr( 1 ), true ); 
		var links_re = new RegExp( "\\\{\\\{" + template_re_string );
		var allTemplates = this.text.splitWeightedByKeys( '{\{', '}}', [ '{{{', '}}}' ] ).uniq();
		for( var i = 0; i < allTemplates.length; ++i ) {
			if( links_re.test( allTemplates[i] ) ) {
				this.text = this.text.replace( allTemplates[i], '', 'g' );
			}
		}

	},
	getText: function() {
		return this.text;
	}
}

/**
* ipadress is in the format 1.2.3.4 and network is in the format 1.2.3.4/5
*/

function isInNetwork( ipaddress, network ) {
	var iparr = ipaddress.split('.');
	var ip = (parseInt(iparr[0]) << 24) + (parseInt(iparr[1]) << 16) + (parseInt(iparr[2]) << 8) + (parseInt(iparr[3]));

	var netmask = 0xffffffff << network.split('/')[1];

	var netarr = network.split('/')[0].split('.');
	var net = (parseInt(netarr[0]) << 24) + (parseInt(netarr[1]) << 16) + (parseInt(netarr[2]) << 8) + (parseInt(netarr[3]));

	return (ip & netmask) == net;
}

/* Returns true if given string contains a valid IP-address, that is, from 0.0.0.0 to 255.255.255.255*/
function isIPAddress( string ){
	var res = /(\d{1,4})\.(\d{1,3})\.(\d{1,3})\.(\d{1,4})/.exec( string );
	return res != null && res.slice( 1, 5 ).every( function( e ) { return e < 256; } );
}

/**
* Maps the querystring to an object
*
* Functions:
*
* QueryString.exists(key)
*     returns true if the particular key is set
* QueryString.get(key)
*     returns the value associated to the key
* QueryString.equals(key, value)
*     returns true if the value associated with given key equals given value
* QueryString.toString()
*     returns the query string as a string
* QueryString.create( hash )
*     creates an querystring and encodes strings via encodeURIComponent and joins arrays with | 
*
* In static context, the value of location.search.substring(1), else the value given to the constructor is going to be used. The mapped hash is saved in the object.
*
* Example:
*
* var value = QueryString.get('key');
* var obj = new QueryString('foo=bar&baz=quux');
* value = obj.get('foo');
*/
function QueryString(qString) {
	this.string = qString;
	this.params = {};

	if( qString.length == 0 ) {
		return;
	}

	qString.replace(/\+/, ' ');
	var args = qString.split('&');

	for( var i = 0; i < args.length; ++i ) {
		var pair = args[i].split( '=' );
		var key = decodeURIComponent( pair[0] ), value = key;

		if( pair.length == 2 ) {
			value = decodeURIComponent( pair[1] );
		}

		this.params[key] = value;
	}
}

QueryString.static = null;

QueryString.staticInit = function() {
	if( QueryString.static == null ) {
		QueryString.static = new QueryString(location.search.substring(1));
	}
}

QueryString.get = function(key) {
	QueryString.staticInit();
	return QueryString.static.get(key);
};

QueryString.prototype.get = function(key) {
	return this.params[key] ? this.params[key] : null;
};

QueryString.exists = function(key) {
	QueryString.staticInit();
	return QueryString.static.exists(key);
}

QueryString.prototype.exists = function(key) {
	return this.params[key] ? true : false;
}

QueryString.equals = function(key, value) {
	QueryString.staticInit();
	return QueryString.static.equals(key, value);
}

QueryString.prototype.equals = function(key, value) {
	return this.params[key] == value ? true : false;
}

QueryString.toString = function() {
	QueryString.staticInit();
	return QueryString.static.toString();
}

QueryString.prototype.toString = function() {
	return this.string ? this.string : null;
}


QueryString.create = function( arr ) {
	var resarr = Array();
	var editToken;  // KLUGE: this should always be the last item in the query string (bug TW-B-0013)
	for( var i in arr ) {
		if( typeof arr[i] == 'undefined' ) {
			continue;
		}
		var res;
		if( arr[i] instanceof Array ){
			var v =  Array();
			for(var j = 0; j < arr[i].length; ++j ) {
				v[j] = encodeURIComponent( arr[i][j] );
			}
			res = v.join('|');
		} else {
			res = encodeURIComponent( arr[i] );
		}
		if( i == 'wpEditToken' ) {
			editToken = res;
		} else {
			resarr.push( encodeURIComponent( i ) + '=' + res );
		}
	}
	if( typeof editToken != 'undefined' ) {
		resarr.push( 'wpEditToken=' + editToken );
	}
	return resarr.join('&');
}
QueryString.prototype.create = QueryString.create;

/**
* Simple exception handling
*/

Exception = function( message ) {
	this.message = message || '';
	this.name = "Exception";
}

Exception.prototype.what = function() {
	return this.message;
}

function Status( text, stat, type ) {
	this.text = this.codify(text);
	this.stat = this.codify(stat);
	this.type = type || 'status';
	// XXX temporary hack to force the page not to reload when an error is output - see also update() below
	if (type == 'error') Wikipedia.numberOfActionsLeft = 1000;
	this.generate(); 
	if( stat ) {
		this.render();
	}
}
Status.init = function( root ) {
	if( !( root instanceof Element ) ) {
		throw new Exception( 'object not an instance of Element' );
	}
	while( root.hasChildNodes() ) {
		root.removeChild( root.firstChild );
	}
	Status.root = root;

	var cssNode = document.createElement('style');
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.appendChild( document.createTextNode("")); // Safari bugfix
	document.getElementsByTagName("head")[0].appendChild(cssNode);
	var styles = cssNode.sheet ? cssNode.sheet : cssNode.stylesSheet;
	styles.insertRule(".tw_status_status { color: SteelBlue; }", 0);
	styles.insertRule(".tw_status_info { color: ForestGreen; }", 0);
	styles.insertRule(".tw_status_warn { color: OrangeRed; }", 0);
	styles.insertRule(".tw_status_error { color: OrangeRed; font-weight: bold; }", 0);
}
Status.root = null;

Status.prototype = {
	stat: null,
	text: null,
	type: 'status',
	target: null,
	node: null,
	linked: false,
	link: function() {
		if( ! this.linked && Status.root ) {
			Status.root.appendChild( this.node );
			this.linked = true;
		}
	},
	unlink: function() {
		if( this.linked ) {
			Status.root.removeChild( this.node );
			this.linked = false;
		}
	},
	codify: function( obj ) {
		if ( ! ( obj instanceof Array ) ) {
			obj = [ obj ];
		}
		var result;
		result = document.createDocumentFragment();
		for( var i = 0; i < obj.length; ++i ) {
			if( typeof obj[i] == 'string' ) {
				result.appendChild( document.createTextNode( obj[i] ) );
			} else if( obj[i] instanceof Element ) {
				result.appendChild( obj[i] );
			} // Else cosmic radiation made something shit
		}
		return result;

	},
	update: function( status, type ) {
		this.stat = this.codify( status );
		if( type ) {
			this.type = type;
			// XXX temporary hack to force the page not to reload when an error is output - see also Status() above
			if (type == 'error') Wikipedia.numberOfActionsLeft = 1000;
		}
		this.render();
	},
	generate: function() {
		this.node = document.createElement( 'div' );
		this.node.appendChild( document.createElement('span') ).appendChild( this.text );
		this.node.appendChild( document.createElement('span') ).appendChild( document.createTextNode( ': ' ) );
		this.target = this.node.appendChild( document.createElement( 'span' ) );
		this.target.appendChild(  document.createTextNode( '' ) ); // dummy node
	},
	render: function() {
		this.node.className = 'tw_status_' + this.type;
		while( this.target.hasChildNodes() ) {
			this.target.removeChild( this.target.firstChild );
		}
		this.target.appendChild( this.stat );
		this.link();
	},
	status: function( status ) {
		this.update( status, 'status');
	},
	info: function( status ) {
		this.update( status, 'info');
	},
	warn: function( status ) {
		this.update( status, 'warn');
	},
	error: function( status ) {
		this.update( status, 'error');
	}
}

Status.status = function( text, status ) {
	return new Status( text, status, 'status' );
}
Status.info = function( text, status ) {
	return new Status( text, status, 'info' );
}
Status.warn = function( text, status ) {
	return new Status( text, status, 'warn' );
}
Status.error = function( text, status ) {
	return new Status( text, status, 'error' );
}

// Simple helper function to create a simple node
function htmlNode( type, content, color ) {
	var node = document.createElement( type );
	if( color ) {
		node.style.color = color;
	}
	node.appendChild( document.createTextNode( content ) );
	return node;
}

// A simple dragable window

function SimpleWindow( width, height ) {
	var stylesheet = document.createElement('style');
	stylesheet.type = 'text/css';
	stylesheet.rel = 'stylesheet';
	stylesheet.appendChild( document.createTextNode("") ); // Safari bugfix
	document.getElementsByTagName("head")[0].appendChild(stylesheet);
	var styles = stylesheet.sheet ? stylesheet.sheet : stylesheet.styleSheet;
	styles.insertRule(
		".simplewindow { "+
			"font: x-small sans-serif;"+
			"position: fixed; "+
			"background-color: AliceBlue; "+
			"border: 2px ridge Black; "+
			"z-index: 100; "+
			"}",
		0
	);

	styles.insertRule(
		".simplewindow .content { "+
			"position: absolute; "+
			"top: 22px; "+
			"bottom: 0; "+
			"overflow: auto; "+
			"width: 100%; "+
			"}",
		0
	);

	styles.insertRule(
		".simplewindow .resizebuttonhorizontal { "+
			"position: absolute; "+
			"background-color: MediumPurple; "+
			"opacity: 0.5; "+
			"right: -2px; "+
			"bottom: -2px; "+
			"width: 20px; "+
			"height: 4px; "+
			"cursor: se-resize; "+
			"}",
		0
	);
	styles.insertRule(
		".simplewindow .resizebuttonvertical { "+
			"position: absolute; "+
			"opacity: 0.5; "+
			"background-color: MediumPurple; "+
			"right: -2px; "+
			"bottom: -2px; "+
			"width: 4px; "+
			"height: 20px; "+
			"cursor: se-resize; "+
			"}",
		0
	);

	styles.insertRule( 
		".simplewindow .closebutton {"+
			"position: absolute; "+
			"font: 100 0.8em sans-serif; "+
			"top: 1px; "+
			"left: 1px; "+
			"height: 100%; "+
			"cursor: pointer; "+
			"}",
		0
	);

	styles.insertRule(
		".simplewindow .topbar { "+
			"position: absolute; "+
			"background-color: LightSteelBlue; "+
			"font: bold 1.2em sans-serif; "+
			"vertical-align: baseline; "+
			"text-align: center; "+
			"width: 100%; "+
			"height: 20px; "+
			"padding-top: 2px;"+
			"cursor: move; "+
			"}",
		0
	);

	this.width = width;
	this.height = height;

	var frame = document.createElement( 'div' );
	var content = document.createElement( 'div' );
	var topbar = document.createElement( 'div' );
	var title = document.createElement( 'span' );
	var closeButton = document.createElement( 'span' );
	var resizeButton2 = document.createElement( 'div' );
	var resizeButton1 = document.createElement( 'div' );

	this.frame = frame;
	this.title = title;
	this.content = content;

	frame.className = 'simplewindow';
	content.className = 'content';
	topbar.className = 'topbar';
	resizeButton1.className = 'resizebuttonvertical';
	resizeButton2.className = 'resizebuttonhorizontal';
	closeButton.className = 'closebutton';
	title.className = 'title';

	topbar.appendChild( closeButton );
	topbar.appendChild( title );
	frame.appendChild( topbar );
	frame.appendChild( content );
	frame.appendChild( resizeButton1 );
	frame.appendChild( resizeButton2 );

	frame.style.width = Math.min(parseInt(window.innerWidth), parseInt(width)) + 'px';
	frame.style.height = Math.min(parseInt(window.innerHeight), parseInt(height)) + 'px';
	frame.style.top = Math.max(0, parseInt( window.innerHeight - this.height  )/2 ) + 'px' ;
	frame.style.left = Math.max(0, parseInt( window.innerWidth - this.width  )/2 ) + 'px';
	var img = document.createElement( 'img' );
	img.src = "http://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Crystal_button_cancel.svg/18px-Crystal_button_cancel.svg.png";
	img.setAttribute("alt", "[close]");
	closeButton.appendChild( img );

	var self = this;

	// Specific events
	frame.addEventListener( 'mousedown', function(event) { self.focus(event); }, false );
	closeButton.addEventListener( 'click', function(event) {self.close(event); }, false );
	topbar.addEventListener( 'mousedown', function(event) {self.initMove(event); }, false );
	resizeButton1.addEventListener( 'mousedown', function(event) {self.initResize(event); }, false );
	resizeButton2.addEventListener( 'mousedown', function(event) {self.initResize(event); }, false );

	// Generic events
	window.addEventListener( 'mouseover', function(event) {self.handleEvent(event); }, false );
	window.addEventListener( 'mousemove', function(event) {self.handleEvent(event); }, false );
	window.addEventListener( 'mouseup', function(event) {self.handleEvent(event); }, false );
    this.currentState = this.initialState;    
}

SimpleWindow.prototype = {
	focusLayer: 100,
	width: 800,
	height: 600,
    initialState: "Inactive",
	currentState: null, // current state of finite state machine (one of 'actionTransitionFunctions' properties)
	focus: function(event) { 
		this.frame.style.zIndex = ++this.focusLayer;
	},
	close: function(event) {
		event.preventDefault();
		document.body.removeChild( this.frame );
	},
	initMove: function(event) {
		event.preventDefault();
		this.initialX = parseInt( event.clientX - this.frame.offsetLeft );
		this.initialY = parseInt( event.clientY - this.frame.offsetTop );
		this.frame.style.opacity = '0.5';
		this.currentState = 'Move';
	},
	initResize: function(event) {
		event.preventDefault();
		this.frame.style.opacity = '0.5';
		this.currentState = 'Resize';
	},
	handleEvent: function(event) { 
		event.preventDefault();
		var actionTransitionFunction = this.actionTransitionFunctions[this.currentState][event.type];
		if( !actionTransitionFunction ) {
			actionTransitionFunction = this.unexpectedEvent;
		}
		var nextState = actionTransitionFunction.call(this, event);
		if( !nextState ){
			nextState = this.currentState;
		}
		if( !this.actionTransitionFunctions[nextState] ){
			nextState = this.undefinedState(event, nextState);
		}
		this.currentState = nextState;
		event.stopPropagation();
	},
	unexpectedEvent: function(event) { 
		throw ("Handled unexpected event '" + event.type + "' in state '" + this.currentState);
		return this.initialState; 
	},  

	undefinedState: function(event, state) {
		throw ("Transitioned to undefined state '" + state + "' from state '" + this.currentState + "' due to event '" + event.type);
		return this.initialState; 
	},  
	actionTransitionFunctions: { 
		Inactive: {
			mouseover: function(event) { 
				return this.currentState;
			},
			mousemove: function(event) { 
				return this.currentState;
			},
			mouseup: function(event) { 
				return this.currentState;
			}
		}, 
		Move: {
			mouseover: function(event) { 
				this.moveWindow( event.clientX,  event.clientY );
				return this.currentState;
			},
			mousemove: function(event) { 
				return this.doActionTransition("Move", "mouseover", event);
			},
			mouseup: function(event) { 
				this.frame.style.opacity = '1';
				return 'Inactive';
			}
		}, 
		Resize: {
			mouseover: function(event) { 
				this.resizeWindow( event.clientX,  event.clientY );
				return this.currentState;
			},
			mousemove: function(event) { 
				return this.doActionTransition("Resize", "mouseover", event);
			},
			mouseup: function(event) { 
				this.frame.style.opacity = '1';
				return 'Inactive';
			}
		}
	},
	doActionTransition: function(anotherState, anotherEventType, event) {
		return this.actionTransitionFunctions[anotherState][anotherEventType].call(this,event);
	},
	display: function() {
		document.body.appendChild( this.frame );
	},
	setTitle: function( title ) {
		this.title.textContent = title;
	},
	setWidth: function( width ) {
		this.frame.style.width = width;
	},
	setHeight: function( height ) {
		this.frame.style.height = height;
	},
	setContent: function( content ) {
		this.purgeContent();
		this.addContent( content );
	},
	addContent: function( content ) {
		this.content.appendChild( content );
	},
	purgeContent: function( content ) {
		while( this.content.hasChildNodes() ) {
			this.content.removeChild( this.content.firstChild );
		}
	},
	moveWindow: function( x, y ) {
		this.frame.style.left = x - this.initialX + 'px';
		this.frame.style.top  = y - this.initialY + 'px';
	},
	resizeWindow: function( x, y ) {
		this.frame.style.height  = Math.max( parseInt( y - this.frame.offsetTop ), 200 ) + 'px';
		this.frame.style.width = Math.max( parseInt( x -  this.frame.offsetLeft ), 200 ) + 'px';
	}
}

// Blacklist was removed per consensus at http://en.wikipedia.org/wiki/Wikipedia:Administrators%27_noticeboard/Archive221#New_Twinkle_blacklist_proposal

// Twinkle initialization

// Create configuration object if not provided by the user's custom .js file.
// Duplicate of twinkle.js code in case this module is imported by another script.
if ( typeof( TwinkleConfig ) === 'undefined' ) {
	TwinkleConfig = {};
}

switch (skin)
{
	case 'vector':
		if( typeof( TwinkleConfig.portletArea ) == 'undefined' ) TwinkleConfig.portletArea = 'right-navigation';
		if( typeof( TwinkleConfig.portletId   ) == 'undefined' ) TwinkleConfig.portletId   = 'p-twinkle';
		if( typeof( TwinkleConfig.portletName ) == 'undefined' ) TwinkleConfig.portletName = 'TW';
		if( typeof( TwinkleConfig.portletType ) == 'undefined' ) TwinkleConfig.portletType = 'menu';
		if( typeof( TwinkleConfig.portletNext ) == 'undefined' ) TwinkleConfig.portletNext = 'p-search';
		break;
	default:
		if( typeof( TwinkleConfig.portletId   ) == 'undefined' ) TwinkleConfig.portletId   = 'p-cactions';
		break;
}

// initialize text that is added to the end of all Twinkle edit summaries
if ( typeof( TwinkleConfig.summaryAd ) === 'undefined' ) {
	TwinkleConfig.summaryAd = " ([[WP:TW|TW]])";
}

// check if account is experienced enough for more advanced functions
// don't use the Twinkle object because other scripts may import this
twinkleUserAuthorized = userIsInGroup( 'autoconfirmed' ) || userIsInGroup( 'confirmed' );

// flag to let sript loaders know that this module has already been loaded
morebits_js_loaded = true;  // legacy version
morebits_v2_js_loaded = true;  // version enhanced for HTML5

// check if the Twinkle loader is active
if ( typeof(Twinkle) === "object" ) {

	// register null initialization callback to let the Twinkle loader know we're ready
	Twinkle.init.moduleReady( "morebits", function() {} );
}

/* Add code here to call the initialization callback of any other user scripts that are
   dependent on this module. Browsers don't enforce initializing scripts in the order
   they are loaded. Therefore, scripts that load this module must be tolerant of having this
   module initialize last. Also, other scripts must be tolerant of receiving multiple
   initialization callbacks because of the many other scripts that might be loading
   this same module. See twinkle.js for an example of the proper way to write a loader. 
   In simple cases, the loader code may be included directly within a user script. */
   