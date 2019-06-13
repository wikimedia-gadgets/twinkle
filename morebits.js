// <nowiki>
/**
 * morebits.js
 * ===========
 * A library full of lots of goodness for user scripts on MediaWiki wikis, including Wikipedia.
 *
 * The highlights include:
 *   - Morebits.quickForm class - generates quick HTML forms on the fly
 *   - Morebits.wiki.api class - makes calls to the MediaWiki API
 *   - Morebits.wiki.page class - modifies pages on the wiki (edit, revert, delete, etc.)
 *   - Morebits.wikitext class - contains some utilities for dealing with wikitext
 *   - Morebits.status class - a rough-and-ready status message displayer, used by the Morebits.wiki classes
 *   - Morebits.simpleWindow class - a wrapper for jQuery UI Dialog with a custom look and extra features
 *
 * Dependencies:
 *   - The whole thing relies on jQuery.  But most wikis should provide this by default.
 *   - Morebits.quickForm, Morebits.simpleWindow, and Morebits.status rely on the "morebits.css" file for their styling.
 *   - Morebits.simpleWindow relies on jquery UI Dialog (ResourceLoader module name 'jquery.ui.dialog').
 *   - Morebits.quickForm tooltips rely on Tipsy (ResourceLoader module name 'jquery.tipsy').
 *     For external installations, Tipsy is available at [http://onehackoranother.com/projects/jquery/tipsy].
 *   - To create a gadget based on morebits.js, use this syntax in MediaWiki:Gadgets-definition:
 *       * GadgetName[ResourceLoader|dependencies=mediawiki.user,mediawiki.util,mediawiki.RegExp,jquery.ui.dialog,jquery.tipsy]|morebits.js|morebits.css|GadgetName.js
 *
 * Most of the stuff here doesn't work on IE < 9.  It is your script's responsibility to enforce this.
 *
 * This library is maintained by the maintainers of Twinkle.
 * For queries, suggestions, help, etc., head to [[Wikipedia talk:Twinkle]] on English Wikipedia [http://en.wikipedia.org].
 * The latest development source is available at [https://github.com/azatoth/twinkle/blob/master/morebits.js].
 */


(function (window, document, $, undefined) { // Wrap entire file with anonymous function

var Morebits = {};
window.Morebits = Morebits;  // allow global access



/**
 * **************** Morebits.userIsInGroup() ****************
 * Simple helper function to see what groups a user might belong
 * @param {string} group  eg. `sysop`, `extendedconfirmed`, etc
 * @returns {boolean}
 */
Morebits.userIsInGroup = function (group) {
	return mw.config.get('wgUserGroups').indexOf(group) !== -1;
};



/**
 * **************** Morebits.sanitizeIPv6() ****************
 * JavaScript translation of the MediaWiki core function IP::sanitizeIP() in
 * includes/utils/IP.php.
 * Converts an IPv6 address to the canonical form stored and used by MediaWiki.
 */
Morebits.sanitizeIPv6 = function (address) {
	address = address.trim();
	if (address === '') {
		return null;
	}
	if (!mw.util.isIPv6Address(address)) {
		return address; // nothing else to do for IPv4 addresses or invalid ones
	}
	// Remove any whitespaces, convert to upper case
	address = address.toUpperCase();
	// Expand zero abbreviations
	var abbrevPos = address.indexOf('::');
	if (abbrevPos > -1) {
		// We know this is valid IPv6. Find the last index of the
		// address before any CIDR number (e.g. "a:b:c::/24").
		var CIDRStart = address.indexOf('/');
		var addressEnd = CIDRStart > -1 ? CIDRStart - 1 : address.length - 1;
		// If the '::' is at the beginning...
		var repeat, extra, pad;
		if (abbrevPos === 0) {
			repeat = '0:';
			extra = address === '::' ? '0' : ''; // for the address '::'
			pad = 9; // 7+2 (due to '::')
		// If the '::' is at the end...
		} else if (abbrevPos === (addressEnd - 1)) {
			repeat = ':0';
			extra = '';
			pad = 9; // 7+2 (due to '::')
		// If the '::' is in the middle...
		} else {
			repeat = ':0';
			extra = ':';
			pad = 8; // 6+2 (due to '::')
		}
		var replacement = repeat;
		pad -= address.split(':').length - 1;
		for (var i = 1; i < pad; i++) {
			replacement += repeat;
		}
		replacement += extra;
		address = address.replace('::', replacement);
	}
	// Remove leading zeros from each bloc as needed
	address = address.replace(/(^|:)0+([0-9A-Fa-f]{1,4})/g, '$1$2');

	return address;
};



/**
 * **************** Morebits.quickForm ****************
 * Morebits.quickForm is a class for creation of simple and standard forms without much
 * specific coding.
 *
 * Index to Morebits.quickForm element types:
 *
 *   select    A combo box (aka drop-down).
 *              - Attributes: name, label, multiple, size, list, event
 *   option    An element for a combo box.
 *              - Attributes: value, label, selected, disabled
 *   optgroup  A group of "option"s.
 *              - Attributes: label, list
 *   field     A fieldset (aka group box).
 *              - Attributes: name, label, disabled
 *   checkbox  A checkbox. Must use "list" parameter.
 *              - Attributes: name, list, event
 *              - Attributes (within list): name, label, value, checked, disabled, event, subgroup
 *   radio     A radio button. Must use "list" parameter.
 *              - Attributes: name, list, event
 *              - Attributes (within list): name, label, value, checked, disabled, event, subgroup
 *   input     A text box.
 *              - Attributes: name, label, value, size, disabled, readonly, maxlength, event
 *   dyninput  A set of text boxes with "Remove" buttons and an "Add" button.
 *              - Attributes: name, label, min, max, sublabel, value, size, maxlength, event
 *   hidden    An invisible form field.
 *              - Attributes: name, value
 *   header    A level 5 header.
 *              - Attributes: label
 *   div       A generic placeholder element or label.
 *              - Attributes: name, label
 *   submit    A submit button. Morebits.simpleWindow moves these to the footer of the dialog.
 *              - Attributes: name, label, disabled
 *   button    A generic button.
 *              - Attributes: name, label, disabled, event
 *   textarea  A big, multi-line text box.
 *              - Attributes: name, label, value, cols, rows, disabled, readonly
 *   fragment  A DocumentFragment object.
 *              - No attributes, and no global attributes except adminonly
 *
 * Global attributes: id, className, style, tooltip, extra, adminonly
 */

/**
 * @constructor
 * @param {event} event   Function to execute when form is submitted
 * @param {*} eventType
 */
Morebits.quickForm = function QuickForm(event, eventType) {
	this.root = new Morebits.quickForm.element({ type: 'form', event: event, eventType: eventType });
};

/**
 * Renders the HTML output of the quickForm
 * @returns {HTMLElement}
 */
Morebits.quickForm.prototype.render = function QuickFormRender() {
	var ret = this.root.render();
	ret.names = {};
	return ret;
};

/**
 * Append element to the form
 * @param {Morebits.quickForm.element} data
 */
Morebits.quickForm.prototype.append = function QuickFormAppend(data) {
	return this.root.append(data);
};

/**
 * @constructor
 * @param {Object}
 */
Morebits.quickForm.element = function QuickFormElement(data) {
	this.data = data;
	this.childs = [];
	this.id = Morebits.quickForm.element.id++;
};

Morebits.quickForm.element.id = 0;

/**
 * Appends an element to current element
 * @param {Morebits.quickForm.element} data  A quickForm element or the object required to
 * create the quickForm element
 * @returns {Morebits.quickForm.element} The same element passed in
 */
Morebits.quickForm.element.prototype.append = function QuickFormElementAppend(data) {
	var child;
	if (data instanceof Morebits.quickForm.element) {
		child = data;
	} else {
		child = new Morebits.quickForm.element(data);
	}
	this.childs.push(child);
	return child;
};

/**
 * Renders the HTML output for the quickForm element
 * This should be called without parameters: form.render()
 * @returns {HTMLElement}
 */
Morebits.quickForm.element.prototype.render = function QuickFormElementRender(internal_subgroup_id) {
	var currentNode = this.compute(this.data, internal_subgroup_id);

	for (var i = 0; i < this.childs.length; ++i) {
		// do not pass internal_subgroup_id to recursive calls
		currentNode[1].appendChild(this.childs[i].render());
	}
	return currentNode[0];
};

Morebits.quickForm.element.prototype.compute = function QuickFormElementCompute(data, in_id) {
	var node;
	var childContainder = null;
	var label;
	var id = (in_id ? in_id + '_' : '') + 'node_' + this.id;
	if (data.adminonly && !Morebits.userIsInGroup('sysop')) {
		// hell hack alpha
		data.type = 'hidden';
	}

	var i, current, subnode;
	switch (data.type) {
		case 'form':
			node = document.createElement('form');
			node.className = 'quickform';
			node.setAttribute('action', 'javascript:void(0);');
			if (data.event) {
				node.addEventListener(data.eventType || 'submit', data.event, false);
			}
			break;
		case 'fragment':
			node = document.createDocumentFragment();
			// fragments can't have any attributes, so just return it straight away
			return [ node, node ];
		case 'select':
			node = document.createElement('div');

			node.setAttribute('id', 'div_' + id);
			if (data.label) {
				label = node.appendChild(document.createElement('label'));
				label.setAttribute('for', id);
				label.appendChild(document.createTextNode(data.label));
			}
			var select = node.appendChild(document.createElement('select'));
			if (data.event) {
				select.addEventListener('change', data.event, false);
			}
			if (data.multiple) {
				select.setAttribute('multiple', 'multiple');
			}
			if (data.size) {
				select.setAttribute('size', data.size);
			}
			select.setAttribute('name', data.name);

			if (data.list) {
				for (i = 0; i < data.list.length; ++i) {

					current = data.list[i];

					if (current.list) {
						current.type = 'optgroup';
					} else {
						current.type = 'option';
					}

					subnode = this.compute(current);
					select.appendChild(subnode[0]);
				}
			}
			childContainder = select;
			break;
		case 'option':
			node = document.createElement('option');
			node.values = data.value;
			node.setAttribute('value', data.value);
			if (data.selected) {
				node.setAttribute('selected', 'selected');
			}
			if (data.disabled) {
				node.setAttribute('disabled', 'disabled');
			}
			node.setAttribute('label', data.label);
			node.appendChild(document.createTextNode(data.label));
			break;
		case 'optgroup':
			node = document.createElement('optgroup');
			node.setAttribute('label', data.label);

			if (data.list) {
				for (i = 0; i < data.list.length; ++i) {

					current = data.list[i];
					current.type = 'option'; // must be options here

					subnode = this.compute(current);
					node.appendChild(subnode[0]);
				}
			}
			break;
		case 'field':
			node = document.createElement('fieldset');
			label = node.appendChild(document.createElement('legend'));
			label.appendChild(document.createTextNode(data.label));
			if (data.name) {
				node.setAttribute('name', data.name);
			}
			if (data.disabled) {
				node.setAttribute('disabled', 'disabled');
			}
			break;
		case 'checkbox':
		case 'radio':
			node = document.createElement('div');
			if (data.list) {
				for (i = 0; i < data.list.length; ++i) {
					var cur_id = id + '_' + i;
					current = data.list[i];
					var cur_div;
					if (current.type === 'header') {
					// inline hack
						cur_div = node.appendChild(document.createElement('h6'));
						cur_div.appendChild(document.createTextNode(current.label));
						if (current.tooltip) {
							Morebits.quickForm.element.generateTooltip(cur_div, current);
						}
						continue;
					}
					cur_div = node.appendChild(document.createElement('div'));
					subnode = cur_div.appendChild(document.createElement('input'));
					subnode.values = current.value;
					subnode.setAttribute('value', current.value);
					subnode.setAttribute('name', current.name || data.name);
					subnode.setAttribute('type', data.type);
					subnode.setAttribute('id', cur_id);

					if (current.checked) {
						subnode.setAttribute('checked', 'checked');
					}
					if (current.disabled) {
						subnode.setAttribute('disabled', 'disabled');
					}
					label = cur_div.appendChild(document.createElement('label'));
					label.appendChild(document.createTextNode(current.label));
					label.setAttribute('for', cur_id);
					if (current.tooltip) {
						Morebits.quickForm.element.generateTooltip(label, current);
					}
					// styles go on the label, doesn't make sense to style a checkbox/radio
					if (current.style) {
						label.setAttribute('style', current.style);
					}

					var event;
					if (current.subgroup) {
						var tmpgroup = current.subgroup;

						if (!Array.isArray(tmpgroup)) {
							tmpgroup = [ tmpgroup ];
						}

						var subgroupRaw = new Morebits.quickForm.element({
							type: 'div',
							id: id + '_' + i + '_subgroup'
						});
						$.each(tmpgroup, function(idx, el) {
							var newEl = $.extend({}, el);
							if (!newEl.type) {
								newEl.type = data.type;
							}
							newEl.name = (current.name || data.name) + '.' + newEl.name;
							subgroupRaw.append(newEl);
						});

						var subgroup = subgroupRaw.render(cur_id);
						subgroup.className = 'quickformSubgroup';
						subnode.subgroup = subgroup;
						subnode.shown = false;

						event = function(e) {
							if (e.target.checked) {
								e.target.parentNode.appendChild(e.target.subgroup);
								if (e.target.type === 'radio') {
									var name = e.target.name;
									if (e.target.form.names[name] !== undefined) {
										e.target.form.names[name].parentNode.removeChild(e.target.form.names[name].subgroup);
									}
									e.target.form.names[name] = e.target;
								}
							} else {
								e.target.parentNode.removeChild(e.target.subgroup);
							}
						};
						subnode.addEventListener('change', event, true);
						if (current.checked) {
							subnode.parentNode.appendChild(subgroup);
						}
					} else if (data.type === 'radio') {
						event = function(e) {
							if (e.target.checked) {
								var name = e.target.name;
								if (e.target.form.names[name] !== undefined) {
									e.target.form.names[name].parentNode.removeChild(e.target.form.names[name].subgroup);
								}
								delete e.target.form.names[name];
							}
						};
						subnode.addEventListener('change', event, true);
					}
					// add users' event last, so it can interact with the subgroup
					if (data.event) {
						subnode.addEventListener('change', data.event, false);
					} else if (current.event) {
						subnode.addEventListener('change', current.event, true);
					}
				}
			}
			break;
		case 'input':
			node = document.createElement('div');
			node.setAttribute('id', 'div_' + id);

			if (data.label) {
				label = node.appendChild(document.createElement('label'));
				label.appendChild(document.createTextNode(data.label));
				label.setAttribute('for', id);
			}

			subnode = node.appendChild(document.createElement('input'));
			if (data.value) {
				subnode.setAttribute('value', data.value);
			}
			subnode.setAttribute('name', data.name);
			subnode.setAttribute('id', id);
			subnode.setAttribute('type', 'text');
			if (data.size) {
				subnode.setAttribute('size', data.size);
			}
			if (data.disabled) {
				subnode.setAttribute('disabled', 'disabled');
			}
			if (data.readonly) {
				subnode.setAttribute('readonly', 'readonly');
			}
			if (data.maxlength) {
				subnode.setAttribute('maxlength', data.maxlength);
			}
			if (data.event) {
				subnode.addEventListener('keyup', data.event, false);
			}
			break;
		case 'dyninput':
			var min = data.min || 1;
			var max = data.max || Infinity;

			node = document.createElement('div');

			label = node.appendChild(document.createElement('h5'));
			label.appendChild(document.createTextNode(data.label));

			var listNode = node.appendChild(document.createElement('div'));

			var more = this.compute({
				type: 'button',
				label: 'more',
				disabled: min >= max,
				event: function(e) {
					var new_node = new Morebits.quickForm.element(e.target.sublist);
					e.target.area.appendChild(new_node.render());

					if (++e.target.counter >= e.target.max) {
						e.target.setAttribute('disabled', 'disabled');
					}
					e.stopPropagation();
				}
			});

			node.appendChild(more[0]);
			var moreButton = more[1];

			var sublist = {
				type: '_dyninput_element',
				label: data.sublabel || data.label,
				name: data.name,
				value: data.value,
				size: data.size,
				remove: false,
				maxlength: data.maxlength,
				event: data.event
			};

			for (i = 0; i < min; ++i) {
				var elem = new Morebits.quickForm.element(sublist);
				listNode.appendChild(elem.render());
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
			node = document.createElement('div');

			if (data.label) {
				label = node.appendChild(document.createElement('label'));
				label.appendChild(document.createTextNode(data.label));
				label.setAttribute('for', id);
			}

			subnode = node.appendChild(document.createElement('input'));
			if (data.value) {
				subnode.setAttribute('value', data.value);
			}
			subnode.setAttribute('name', data.name);
			subnode.setAttribute('type', 'text');
			if (data.size) {
				subnode.setAttribute('size', data.size);
			}
			if (data.maxlength) {
				subnode.setAttribute('maxlength', data.maxlength);
			}
			if (data.event) {
				subnode.addEventListener('keyup', data.event, false);
			}
			if (data.remove) {
				var remove = this.compute({
					type: 'button',
					label: 'remove',
					event: function(e) {
						var list = e.target.listnode;
						var node = e.target.inputnode;
						var more = e.target.morebutton;

						list.removeChild(node);
						--more.counter;
						more.removeAttribute('disabled');
						e.stopPropagation();
					}
				});
				node.appendChild(remove[0]);
				var removeButton = remove[1];
				removeButton.inputnode = node;
				removeButton.listnode = data.listnode;
				removeButton.morebutton = data.morebutton;
			}
			break;
		case 'hidden':
			node = document.createElement('input');
			node.setAttribute('type', 'hidden');
			node.values = data.value;
			node.setAttribute('value', data.value);
			node.setAttribute('name', data.name);
			break;
		case 'header':
			node = document.createElement('h5');
			node.appendChild(document.createTextNode(data.label));
			break;
		case 'div':
			node = document.createElement('div');
			if (data.name) {
				node.setAttribute('name', data.name);
			}
			if (data.label) {
				if (!Array.isArray(data.label)) {
					data.label = [ data.label ];
				}
				var result = document.createElement('span');
				result.className = 'quickformDescription';
				for (i = 0; i < data.label.length; ++i) {
					if (typeof data.label[i] === 'string') {
						result.appendChild(document.createTextNode(data.label[i]));
					} else if (data.label[i] instanceof Element) {
						result.appendChild(data.label[i]);
					}
				}
				node.appendChild(result);
			}
			break;
		case 'submit':
			node = document.createElement('span');
			childContainder = node.appendChild(document.createElement('input'));
			childContainder.setAttribute('type', 'submit');
			if (data.label) {
				childContainder.setAttribute('value', data.label);
			}
			childContainder.setAttribute('name', data.name || 'submit');
			if (data.disabled) {
				childContainder.setAttribute('disabled', 'disabled');
			}
			break;
		case 'button':
			node = document.createElement('span');
			childContainder = node.appendChild(document.createElement('input'));
			childContainder.setAttribute('type', 'button');
			if (data.label) {
				childContainder.setAttribute('value', data.label);
			}
			childContainder.setAttribute('name', data.name);
			if (data.disabled) {
				childContainder.setAttribute('disabled', 'disabled');
			}
			if (data.event) {
				childContainder.addEventListener('click', data.event, false);
			}
			break;
		case 'textarea':
			node = document.createElement('div');
			node.setAttribute('id', 'div_' + id);
			if (data.label) {
				label = node.appendChild(document.createElement('h5'));
				label.appendChild(document.createTextNode(data.label));
			// TODO need to nest a <label> tag in here without creating extra vertical space
			// label.setAttribute( 'for', id );
			}
			subnode = node.appendChild(document.createElement('textarea'));
			subnode.setAttribute('name', data.name);
			if (data.cols) {
				subnode.setAttribute('cols', data.cols);
			}
			if (data.rows) {
				subnode.setAttribute('rows', data.rows);
			}
			if (data.disabled) {
				subnode.setAttribute('disabled', 'disabled');
			}
			if (data.readonly) {
				subnode.setAttribute('readonly', 'readonly');
			}
			if (data.value) {
				subnode.value = data.value;
			}
			break;
		default:
			throw new Error('Morebits.quickForm: unknown element type ' + data.type.toString());
	}

	if (!childContainder) {
		childContainder = node;
	}
	if (data.tooltip) {
		Morebits.quickForm.element.generateTooltip(label || node, data);
	}

	if (data.extra) {
		childContainder.extra = data.extra;
	}
	if (data.style) {
		childContainder.setAttribute('style', data.style);
	}
	if (data.className) {
		childContainder.className = childContainder.className ?
			childContainder.className + ' ' + data.className :
			data.className;
	}
	childContainder.setAttribute('id', data.id || id);

	return [ node, childContainder ];
};

Morebits.quickForm.element.autoNWSW = function() {
	return $(this).offset().top > ($(document).scrollTop() + ($(window).height() / 2)) ? 'sw' : 'nw';
};

/**
 * @param {HTMLElement} node
 * @param {Object} data
 */
Morebits.quickForm.element.generateTooltip = function QuickFormElementGenerateTooltip(node, data) {
	$('<span/>', {
		'class': 'ui-icon ui-icon-help ui-icon-inline morebits-tooltip'
	}).appendTo(node).tipsy({
		'fallback': data.tooltip,
		'fade': true,
		'gravity': data.type === 'input' || data.type === 'select' ?
			Morebits.quickForm.element.autoNWSW : $.fn.tipsy.autoWE,
		'html': true,
		'delayOut': 250
	});
};


// Some utility methods for manipulating quickForms after their creation:
// (None of these work for "dyninput" type fields at present)


/**
 * Returns all form elements with a given field name or ID
 * @returns {HTMLElement[]}
 */
Morebits.quickForm.getElements = function QuickFormGetElements(form, fieldName) {
	var $form = $(form);
	var $elements = $form.find('[name="' + fieldName + '"]');
	if ($elements.length > 0) {
		return $elements.toArray();
	}
	$elements = $form.find('#' + fieldName);
	if ($elements.length > 0) {
		return $elements.toArray();
	}
	return null;
};

/**
 * Searches the array of elements for a checkbox or radio button with a certain
 * `value` attribute, and returns the first such element. Returns null if not found.
 * @param {HTMLInputElement[]} elementArray
 * @param {string} value
 * @returns {HTMLInputElement}
 */
Morebits.quickForm.getCheckboxOrRadio = function QuickFormGetCheckboxOrRadio(elementArray, value) {
	var found = $.grep(elementArray, function(el) {
		return el.value === value;
	});
	if (found.length > 0) {
		return found[0];
	}
	return null;
};

/**
 * Returns the <div> containing the form element, or the form element itself
 * May not work as expected on checkboxes or radios
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
Morebits.quickForm.getElementContainer = function QuickFormGetElementContainer(element) {
	// for divs, headings and fieldsets, the container is the element itself
	if (element instanceof HTMLFieldSetElement || element instanceof HTMLDivElement ||
			element instanceof HTMLHeadingElement) {
		return element;
	}

	// for others, just return the parent node
	return element.parentNode;
};

/**
 * Gets the HTML element that contains the label of the given form element
 * (mainly for internal use)
 * @param {(HTMLElement|Morebits.quickForm.element)} element
 * @returns {HTMLElement}
 */
Morebits.quickForm.getElementLabelObject = function QuickFormGetElementLabelObject(element) {
	// for buttons, divs and headers, the label is on the element itself
	if (element.type === 'button' || element.type === 'submit' ||
			element instanceof HTMLDivElement || element instanceof HTMLHeadingElement) {
		return element;
	// for fieldsets, the label is the child <legend> element
	} else if (element instanceof HTMLFieldSetElement) {
		return element.getElementsByTagName('legend')[0];
	// for textareas, the label is the sibling <h5> element
	} else if (element instanceof HTMLTextAreaElement) {
		return element.parentNode.getElementsByTagName('h5')[0];
	}
	// for others, the label is the sibling <label> element
	return element.parentNode.getElementsByTagName('label')[0];
};

/**
 * Gets the label text of the element
 * @param {(HTMLElement|Morebits.quickForm.element)} element
 * @returns {string}
 */
Morebits.quickForm.getElementLabel = function QuickFormGetElementLabel(element) {
	var labelElement = Morebits.quickForm.getElementLabelObject(element);

	if (!labelElement) {
		return null;
	}
	return labelElement.firstChild.textContent;
};

/**
 * Sets the label of the element to the given text
 * @param {(HTMLElement|Morebits.quickForm.element)} element
 * @param {string} labelText
 * @returns {boolean} true if succeeded, false if the label element is unavailable
 */
Morebits.quickForm.setElementLabel = function QuickFormSetElementLabel(element, labelText) {
	var labelElement = Morebits.quickForm.getElementLabelObject(element);

	if (!labelElement) {
		return false;
	}
	labelElement.firstChild.textContent = labelText;
	return true;
};

/**
 * Stores the element's current label, and temporarily sets the label to the given text
 * @param {(HTMLElement|Morebits.quickForm.element)} element
 * @param {string} temporaryLabelText
 * @returns {boolean} true if succeeded, false if the label element is unavailable
 */
Morebits.quickForm.overrideElementLabel = function QuickFormOverrideElementLabel(element, temporaryLabelText) {
	if (!element.hasAttribute('data-oldlabel')) {
		element.setAttribute('data-oldlabel', Morebits.quickForm.getElementLabel(element));
	}
	return Morebits.quickForm.setElementLabel(element, temporaryLabelText);
};

/**
 * Restores the label stored by overrideElementLabel
 * @param {(HTMLElement|Morebits.quickForm.element)} element
 * @returns {boolean} true if succeeded, false if the label element is unavailable
 */
Morebits.quickForm.resetElementLabel = function QuickFormResetElementLabel(element) {
	if (element.hasAttribute('data-oldlabel')) {
		return Morebits.quickForm.setElementLabel(element, element.getAttribute('data-oldlabel'));
	}
	return null;
};

/**
 * Shows or hides a form element plus its label and tooltip
 * @param {(HTMLElement|jQuery|string)} element  HTML/jQuery element, or jQuery selector string
 * @param {boolean} [visibility] Skip this to toggle visibility
 */
Morebits.quickForm.setElementVisibility = function QuickFormSetElementVisibility(element, visibility) {
	$(element).toggle(visibility);
};

/**
 * Shows or hides the "question mark" icon (which displays the tooltip) next to a form element
 * @param {(HTMLElement|jQuery)} element
 * @param {boolean} [visibility] Skip this to toggle visibility
 */
Morebits.quickForm.setElementTooltipVisibility = function QuickFormSetElementTooltipVisibility(element, visibility) {
	$(Morebits.quickForm.getElementContainer(element)).find('.morebits-tooltip').toggle(visibility);
};



/**
 * **************** HTMLFormElement ****************
 */

/**
 * Returns an array containing the values of elements with the given name, that has it's
 * checked property set to true. (i.e. a checkbox or a radiobutton is checked), or select
 * options that have selected set to true. (don't try to mix selects with radio/checkboxes,
 * please)
 * Type is optional and can specify if either radio or checkbox (for the event
 * that both checkboxes and radiobuttons have the same name.
 *
 * XXX: Doesn't seem to work reliably across all browsers at the moment. -- see getChecked2
 * in twinkleunlink.js, which is better
 */
HTMLFormElement.prototype.getChecked = function(name, type) {
	var elements = this.elements[name];
	if (!elements) {
		// if the element doesn't exists, return null.
		return null;
	}
	var return_array = [];
	var i;
	if (elements instanceof HTMLSelectElement) {
		var options = elements.options;
		for (i = 0; i < options.length; ++i) {
			if (options[i].selected) {
				if (options[i].values) {
					return_array.push(options[i].values);
				} else {
					return_array.push(options[i].value);
				}

			}
		}
	} else if (elements instanceof HTMLInputElement) {
		if (type && elements.type !== type) {
			return [];
		} else if (elements.checked) {
			return [ elements.value ];
		}
	} else {
		for (i = 0; i < elements.length; ++i) {
			if (elements[i].checked) {
				if (type && elements[i].type !== type) {
					continue;
				}
				if (elements[i].values) {
					return_array.push(elements[i].values);
				} else {
					return_array.push(elements[i].value);
				}
			}
		}
	}
	return return_array;
};

/**
 * getUnchecked:
 *   Does the same as getChecked above, but with unchecked elements.
 */

HTMLFormElement.prototype.getUnchecked = function(name, type) {
	var elements = this.elements[name];
	if (!elements) {
		// if the element doesn't exists, return null.
		return null;
	}
	var return_array = [];
	var i;
	if (elements instanceof HTMLSelectElement) {
		var options = elements.options;
		for (i = 0; i < options.length; ++i) {
			if (!options[i].selected) {
				if (options[i].values) {
					return_array.push(options[i].values);
				} else {
					return_array.push(options[i].value);
				}

			}
		}
	} else if (elements instanceof HTMLInputElement) {
		if (type && elements.type !== type) {
			return [];
		} else if (!elements.checked) {
			return [ elements.value ];
		}
	} else {
		for (i = 0; i < elements.length; ++i) {
			if (!elements[i].checked) {
				if (type && elements[i].type !== type) {
					continue;
				}
				if (elements[i].values) {
					return_array.push(elements[i].values);
				} else {
					return_array.push(elements[i].value);
				}
			}
		}
	}
	return return_array;
};


/**
 * **************** RegExp ****************
 *
 * Escapes a string to be used in a RegExp
 * @param {string} text - string to be escaped
 * @param {boolean} [space_fix] - Set this true to replace spaces and underscore with `[ _]` as they are often equivalent
 */

RegExp.escape = function(text, space_fix) {
	text = mw.RegExp.escape(text);

	// Special MediaWiki escape - underscore/space are often equivalent
	if (space_fix) {
		text = text.replace(/ |_/g, '[_ ]');
	}

	return text;
};


/**
 * **************** String; Morebits.string ****************
 */

Morebits.string = {
	// Helper functions to change case of a string
	toUpperCaseFirstChar: function(str) {
		str = str.toString();
		return str.substr(0, 1).toUpperCase() + str.substr(1);
	},
	toLowerCaseFirstChar: function(str) {
		str = str.toString();
		return str.substr(0, 1).toLowerCase() + str.substr(1);
	},

	/**
	 * Gives an array of substrings of `str` starting with `start` and
	 * ending with `end`, which is not in `skiplist`
	 * @param {string} str
	 * @param {string} start
	 * @param {string} end
	 * @param {(string[]|string)} [skiplist]
	 * @returns {String[]}
	 */
	splitWeightedByKeys: function(str, start, end, skiplist) {
		if (start.length !== end.length) {
			throw new Error('start marker and end marker must be of the same length');
		}
		var level = 0;
		var initial = null;
		var result = [];
		if (!Array.isArray(skiplist)) {
			if (skiplist === undefined) {
				skiplist = [];
			} else if (typeof skiplist === 'string') {
				skiplist = [ skiplist ];
			} else {
				throw new Error('non-applicable skiplist parameter');
			}
		}
		for (var i = 0; i < str.length; ++i) {
			for (var j = 0; j < skiplist.length; ++j) {
				if (str.substr(i, skiplist[j].length) === skiplist[j]) {
					i += skiplist[j].length - 1;
					continue;
				}
			}
			if (str.substr(i, start.length) === start) {
				if (initial === null) {
					initial = i;
				}
				++level;
				i += start.length - 1;
			} else if (str.substr(i, end.length) === end) {
				--level;
				i += end.length - 1;
			}
			if (!level && initial !== null) {
				result.push(str.substring(initial, i + 1));
				initial = null;
			}
		}

		return result;
	},

	/**
	 * Formats freeform "reason" (from a textarea) for deletion/other templates
	 * that are going to be substituted, (e.g. PROD, XFD, RPP)
	 * @param {string} str
	 * @returns {string}
	 */
	formatReasonText: function(str) {
		var result = str.toString().trim();
		var unbinder = new Morebits.unbinder(result);
		unbinder.unbind('<no' + 'wiki>', '</no' + 'wiki>');
		unbinder.content = unbinder.content.replace(/\|/g, '{{subst:!}}');
		return unbinder.rebind();
	},

	/**
	 * Replacement for `String.prototype.replace()` when the second parameter
	 * (the replacement string) is arbitrary, such as a username or freeform user input,
	 * and may contain dollar signs
	 */
	safeReplace: function morebitsStringSafeReplace(string, pattern, replacement) {
		return string.replace(pattern, replacement.replace(/\$/g, '$$$$'));
	}
};


/**
 * **************** Morebits.array ****************
 */

Morebits.array = {
	/**
	 * @returns {Array} a copy of the array with duplicates removed
	 */
	uniq: function(arr) {
		if (!Array.isArray(arr)) {
			throw 'A non-array object passed to Morebits.array.uniq';
		}
		var result = [];
		for (var i = 0; i < arr.length; ++i) {
			var current = arr[i];
			if (result.indexOf(current) === -1) {
				result.push(current);
			}
		}
		return result;
	},

	/**
	 * @returns {Array} a copy of the array with the first instance of each value
	 * removed; subsequent instances of those values (duplicates) remain
	 */
	dups: function(arr) {
		if (!Array.isArray(arr)) {
			throw 'A non-array object passed to Morebits.array.dups';
		}
		var uniques = [];
		var result = [];
		for (var i = 0; i < arr.length; ++i) {
			var current = arr[i];
			if (uniques.indexOf(current) === -1) {
				uniques.push(current);
			} else {
				result.push(current);
			}
		}
		return result;
	},


	/**
	 * breaks up `arr` into smaller arrays of length `size`, and
	 * @returns an array of these "chunked" arrays
	 * @param {array} arr
	 * @param {number} size
	 * @returns {Array}
	 */
	chunk: function(arr, size) {
		if (!Array.isArray(arr)) {
			throw 'A non-array object passed to Morebits.array.chunk';
		}
		if (typeof size !== 'number' || size <= 0) { // pretty impossible to do anything :)
			return [ arr ]; // we return an array consisting of this array.
		}
		var result = [];
		var current;
		for (var i = 0; i < arr.length; ++i) {
			if (i % size === 0) { // when 'i' is 0, this is always true, so we start by creating one.
				current = [];
				result.push(current);
			}
			current.push(arr[i]);
		}
		return result;
	}
};


/**
 * **************** Morebits.pageNameNorm ****************
 * Stores a normalized version of the wgPageName variable (underscores converted to spaces).
 * For queen/king/whatever and country!
 */
Morebits.pageNameNorm = mw.config.get('wgPageName').replace(/_/g, ' ');


/**
 * *************** Morebits.pageNameRegex *****************
 * For a page name 'Foo bar', returns the string '[Ff]oo bar'
 * @param {string} pageName - page name without namespace
 */
Morebits.pageNameRegex = function(pageName) {
	return '[' + pageName[0].toUpperCase() + pageName[0].toLowerCase() + ']' + pageName.slice(1);
};


/**
 * **************** Morebits.unbinder ****************
 * Used for temporarily hiding a part of a string while processing the rest of it.
 *
 * eg.  var u = new Morebits.unbinder("Hello world <!-- world --> world");
 *      u.unbind('<!--','-->');
 *      u.content = u.content.replace(/world/g, 'earth');
 *      u.rebind(); // gives "Hello earth <!-- world --> earth"
 *
 * Text within the 'unbinded' part (in this case, the HTML comment) remains intact
 * unbind() can be called multiple times to unbind multiple parts of the string.
 *
 * Used by Morebits.wikitext.page.commentOutImage
 */

/**
 * @constructor
 * @param {string} string
 */
Morebits.unbinder = function Unbinder(string) {
	if (typeof string !== 'string') {
		throw new Error('not a string');
	}
	this.content = string;
	this.counter = 0;
	this.history = {};
	this.prefix = '%UNIQ::' + Math.random() + '::';
	this.postfix = '::UNIQ%';
};

Morebits.unbinder.prototype = {
	/**
	 * @param {string} prefix
	 * @param {string} postfix
	 */
	unbind: function UnbinderUnbind(prefix, postfix) {
		var re = new RegExp(prefix + '(.*?)' + postfix, 'g');
		this.content = this.content.replace(re, Morebits.unbinder.getCallback(this));
	},

	/**
	 * @returns {string} The output
	 */
	rebind: function UnbinderRebind() {
		var content = this.content;
		content.self = this;
		for (var current in this.history) {
			if (Object.prototype.hasOwnProperty.call(this.history, current)) {
				content = content.replace(current, this.history[current]);
			}
		}
		return content;
	},
	prefix: null, // %UNIQ::0.5955981644938324::
	postfix: null, // ::UNIQ%
	content: null, // string
	counter: null, // 0++
	history: null // {}
};

Morebits.unbinder.getCallback = function UnbinderGetCallback(self) {
	return function UnbinderCallback(match) {
		var current = self.prefix + self.counter + self.postfix;
		self.history[current] = match;
		++self.counter;
		return current;
	};
};



/**
 * **************** Date ****************
 * Helper functions to get the month as a string instead of a number
 *
 * Normally it is poor form to play with prototypes of primitive types, but it
 * is fairly unlikely that anyone will iterate over a Date object.
 */

Date.monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December' ];

Date.monthNamesAbbrev = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

Date.prototype.getMonthName = function() {
	return Date.monthNames[this.getMonth()];
};

Date.prototype.getMonthNameAbbrev = function() {
	return Date.monthNamesAbbrev[this.getMonth()];
};

Date.prototype.getUTCMonthName = function() {
	return Date.monthNames[this.getUTCMonth()];
};

Date.prototype.getUTCMonthNameAbbrev = function() {
	return Date.monthNamesAbbrev[this.getUTCMonth()];
};


// Morebits.wikipedia.namespaces is deprecated - use mw.config.get('wgFormattedNamespaces') or mw.config.get('wgNamespaceIds') instead

/**
 * **************** Morebits.wiki ****************
 * Various objects for wiki editing and API access
 */
Morebits.wiki = {};

/**
 * Determines whether the current page is a redirect or soft redirect
 * (fails to detect soft redirects on edit, history, etc. pages)
 */
Morebits.wiki.isPageRedirect = function wikipediaIsPageRedirect() {
	return !!(mw.config.get('wgIsRedirect') || document.getElementById('softredirect'));
};



/**
 * **************** Morebits.wiki.actionCompleted ****************
 *
 *    Use of Morebits.wiki.actionCompleted():
 *    Every call to Morebits.wiki.api.post() results in the dispatch of
 *    an asynchronous callback. Each callback can in turn
 *    make an additional call to Morebits.wiki.api.post() to continue a
 *    processing sequence. At the conclusion of the final callback
 *    of a processing sequence, it is not possible to simply return to the
 *    original caller because there is no call stack leading back to
 *    the original context. Instead, Morebits.wiki.actionCompleted.event() is
 *    called to display the result to the user and to perform an optional
 *    page redirect.
 *
 *    The determination of when to call Morebits.wiki.actionCompleted.event()
 *    is managed through the globals Morebits.wiki.numberOfActionsLeft and
 *    Morebits.wiki.nbrOfCheckpointsLeft. Morebits.wiki.numberOfActionsLeft is
 *    incremented at the start of every Morebits.wiki.api call and decremented
 *    after the completion of a callback function. If a callback function
 *    does not create a new Morebits.wiki.api object before exiting, it is the
 *    final step in the processing chain and Morebits.wiki.actionCompleted.event()
 *    will then be called.
 *
 *    Optionally, callers may use Morebits.wiki.addCheckpoint() to indicate that
 *    processing is not complete upon the conclusion of the final callback function.
 *    This is used for batch operations. The end of a batch is signaled by calling
 *    Morebits.wiki.removeCheckpoint().
 */

Morebits.wiki.numberOfActionsLeft = 0;
Morebits.wiki.nbrOfCheckpointsLeft = 0;

Morebits.wiki.actionCompleted = function(self) {
	if (--Morebits.wiki.numberOfActionsLeft <= 0 && Morebits.wiki.nbrOfCheckpointsLeft <= 0) {
		Morebits.wiki.actionCompleted.event(self);
	}
};

// Change per action wanted
Morebits.wiki.actionCompleted.event = function() {
	new Morebits.status(Morebits.wiki.actionCompleted.notice, Morebits.wiki.actionCompleted.postfix, 'info');
	if (Morebits.wiki.actionCompleted.redirect) {
		// if it isn't a URL, make it one. TODO: This breaks on the articles 'http://', 'ftp://', and similar ones.
		if (!(/^\w+:\/\//).test(Morebits.wiki.actionCompleted.redirect)) {
			Morebits.wiki.actionCompleted.redirect = mw.util.getUrl(Morebits.wiki.actionCompleted.redirect);
			if (Morebits.wiki.actionCompleted.followRedirect === false) {
				Morebits.wiki.actionCompleted.redirect += '?redirect=no';
			}
		}
		window.setTimeout(function() {
			window.location = Morebits.wiki.actionCompleted.redirect;
		}, Morebits.wiki.actionCompleted.timeOut);
	}
};

Morebits.wiki.actionCompleted.timeOut = typeof window.wpActionCompletedTimeOut === 'undefined' ? 5000 : window.wpActionCompletedTimeOut;
Morebits.wiki.actionCompleted.redirect = null;
Morebits.wiki.actionCompleted.notice = 'Action';
Morebits.wiki.actionCompleted.postfix = 'completed';

Morebits.wiki.addCheckpoint = function() {
	++Morebits.wiki.nbrOfCheckpointsLeft;
};

Morebits.wiki.removeCheckpoint = function() {
	if (--Morebits.wiki.nbrOfCheckpointsLeft <= 0 && Morebits.wiki.numberOfActionsLeft <= 0) {
		Morebits.wiki.actionCompleted.event();
	}
};

/**
 * **************** Morebits.wiki.api ****************
 * An easy way to talk to the MediaWiki API.
 */

/**
 * @constructor
 * @param {string} currentAction - The current action (required)
 * @param {Object} query - The query (required)
 * @param {Function} [onSuccess] - The function to call when request gotten
 * @param {Object} [statusElement] - A Morebits.status object to use for status messages (optional)
 * @param {Function} [onError] - The function to call if an error occurs (optional)
 */
Morebits.wiki.api = function(currentAction, query, onSuccess, statusElement, onError) {
	this.currentAction = currentAction;
	this.query = query;
	this.query.format = 'xml';
	this.query.assert = 'user';
	this.onSuccess = onSuccess;
	this.onError = onError;
	if (statusElement) {
		this.statelem = statusElement;
		this.statelem.status(currentAction);
	} else {
		this.statelem = new Morebits.status(currentAction);
	}
};

Morebits.wiki.api.prototype = {
	currentAction: '',
	onSuccess: null,
	onError: null,
	parent: window,  // use global context if there is no parent object
	query: null,
	responseXML: null,
	setParent: function(parent) {
		this.parent = parent;
	},  // keep track of parent object for callbacks
	statelem: null,  // this non-standard name kept for backwards compatibility
	statusText: null, // result received from the API, normally "success" or "error"
	errorCode: null, // short text error code, if any, as documented in the MediaWiki API
	errorText: null, // full error description, if any

	/**
	 * Carries out the request.
	 * @param {Object} callerAjaxParameters Do not specify a parameter unless you really
	 * really want to give jQuery some extra parameters
	 */
	post: function(callerAjaxParameters) {

		++Morebits.wiki.numberOfActionsLeft;

		var ajaxparams = $.extend({}, {
			context: this,
			type: 'POST',
			url: mw.util.wikiScript('api'),
			data: Morebits.queryString.create(this.query),
			dataType: 'xml',
			headers: {
				'Api-User-Agent': morebitsWikiApiUserAgent
			}
		}, callerAjaxParameters);

		return $.ajax(ajaxparams).done(
			function(xml, statusText) {
				this.statusText = statusText;
				this.responseXML = xml;
				this.errorCode = $(xml).find('error').attr('code');
				this.errorText = $(xml).find('error').attr('info');

				if (typeof this.errorCode === 'string') {

					// the API didn't like what we told it, e.g., bad edit token or an error creating a page
					this.returnError();
					return;
				}

				// invoke success callback if one was supplied
				if (this.onSuccess) {

					// set the callback context to this.parent for new code and supply the API object
					// as the first argument to the callback (for legacy code)
					this.onSuccess.call(this.parent, this);
				} else {
					this.statelem.info('done');
				}

				Morebits.wiki.actionCompleted();
			}
		).fail(
			// only network and server errors reach here – complaints from the API itself are caught in success()
			function(jqXHR, statusText, errorThrown) {
				this.statusText = statusText;
				this.errorThrown = errorThrown; // frequently undefined
				this.errorText = statusText + ' "' + jqXHR.statusText + '" occurred while contacting the API.';
				this.returnError();
			}
		);  // the return value should be ignored, unless using callerAjaxParameters with |async: false|
	},

	returnError: function() {
		if (this.errorCode === 'badtoken') {
			this.statelem.error('Invalid token. Refresh the page and try again');
		} else {
			this.statelem.error(this.errorText);
		}

		// invoke failure callback if one was supplied
		if (this.onError) {

			// set the callback context to this.parent for new code and supply the API object
			// as the first argument to the callback for legacy code
			this.onError.call(this.parent, this);
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
};

// Custom user agent header, used by WMF for server-side logging
// See https://lists.wikimedia.org/pipermail/mediawiki-api-announce/2014-November/000075.html
var morebitsWikiApiUserAgent = 'morebits.js/2.0 ([[w:WT:TW]])';

/**
 * Sets the custom user agent header
 * @param {string} ua   User agent
 */
Morebits.wiki.api.setApiUserAgent = function(ua) {
	morebitsWikiApiUserAgent = (ua ? ua + ' ' : '') + 'morebits.js/2.0 ([[w:WT:TW]])';
};



/**
 * **************** Morebits.wiki.page ****************
 * Uses the MediaWiki API to load a page and optionally edit it, move it, etc.
 *
 * Callers are not permitted to directly access the properties of this class!
 * All property access is through the appropriate get___() or set___() method.
 *
 * Callers should set Morebits.wiki.actionCompleted.notice and Morebits.wiki.actionCompleted.redirect
 * before the first call to Morebits.wiki.page.load().
 *
 * Each of the callback functions takes one parameter, which is a
 * reference to the Morebits.wiki.page object that registered the callback.
 * Callback functions may invoke any Morebits.wiki.page prototype method using this reference.
 *
 *
 * HIGHLIGHTS:
 *
 * Constructor: Morebits.wiki.page(pageName, currentAction)
 *    pageName - the name of the page, prefixed by the namespace (if any)
 *               (for the current page, use mw.config.get('wgPageName'))
 *    currentAction - a string describing the action about to be undertaken (optional)
 *
 * onSuccess and onFailure are callback functions called when the operation is a success or failure
 * if enclosed in [brackets], it indicates that it is optional
 *
 * load(onSuccess, [onFailure]): Loads the text for the page
 *
 * getPageText(): returns a string containing the text of the page after a successful load()
 *
 * save([onSuccess], [onFailure]):  Saves the text set via setPageText() for the page.
 * Must be preceded by calling load().
 *    Warning: Calling save() can result in additional calls to the previous load() callbacks to
 *             recover from edit conflicts!
 *             In this case, callers must make the same edit to the new pageText and reinvoke save().
 *             This behavior can be disabled with setMaxConflictRetries(0).
 *
 * append([onSuccess], [onFailure]): Adds the text provided via setAppendText() to the end of
 * the page. Does not require calling load() first.
 *
 * prepend([onSuccess], [onFailure]): Adds the text provided via setPrependText() to the start
 * of the page. Does not require calling load() first.
 *
 * move([onSuccess], [onFailure]): Moves a page to another title
 *
 * deletePage([onSuccess], [onFailure]): Deletes a page (for admins only)
 *
 * undeletePage([onSuccess], [onFailure]): Undeletes a page (for admins only)
 *
 * protect([onSuccess], [onFailure]): Protects a page
 *
 * getPageName(): returns a string containing the name of the loaded page, including the namespace
 *
 * setPageText(pageText) sets the updated page text that will be saved when save() is called
 *
 * setAppendText(appendText) sets the text that will be appended to the page when append() is called
 *
 * setPrependText(prependText) sets the text that will be prepended to the page when prepend() is called
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
 * exists(): returns true if the page existed on the wiki when it was last loaded
 *
 * getCurrentID(): returns a string containing the current revision ID of the page
 *
 * lookupCreation(onSuccess): Retrieves the username and timestamp of page creation
 *    onSuccess - callback function which is called when the username and timestamp
 *                are found within the callback.
 *                The username can be retrieved using the getCreator() function;
 *                the timestamp can be retrieved using the getCreationTimestamp() function
 *
 * getCreator(): returns the user who created the page following lookupCreation()
 *
 * getCreationTimestamp(): returns an ISOString timestamp of page creation following lookupCreation()
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
 *       1. All functions following Morebits.wiki.api.post() are invoked asynchronously
 *          from the jQuery AJAX library.
 *       2. The sequence for append/prepend could be slightly shortened, but it would require
 *          significant duplication of code for little benefit.
 */

/**
 * @constructor
 * @param {string} pageName The name of the page, prefixed by the namespace (if any)
 * For the current page, use mw.config.get('wgPageName')
 * @param {string} [currentAction] A string describing the action about to be undertaken (optional)
 */
Morebits.wiki.page = function(pageName, currentAction) {

	if (!currentAction) {
		currentAction = 'Opening page "' + pageName + '"';
	}

	/**
	 * Private context variables
	 *
	 * This context is not visible to the outside, thus all the data here
	 * must be accessed via getter and setter functions.
	 */
	var ctx = {
		// backing fields for public properties
		pageName: pageName,
		pageExists: false,
		editSummary: null,
		callbackParameters: null,
		statusElement: new Morebits.status(currentAction),

		// - edit
		pageText: null,
		editMode: 'all',  // save() replaces entire contents of the page by default
		appendText: null,   // can't reuse pageText for this because pageText is needed to follow a redirect
		prependText: null,  // can't reuse pageText for this because pageText is needed to follow a redirect
		createOption: null,
		minorEdit: false,
		botEdit: false,
		pageSection: null,
		maxConflictRetries: 2,
		maxRetries: 2,
		followRedirect: false,
		watchlistOption: 'nochange',
		creator: null,
		timestamp: null,

		// - revert
		revertOldID: null,

		// - move
		moveDestination: null,
		moveTalkPage: false,
		moveSubpages: false,
		moveSuppressRedirect: false,

		// - protect
		protectEdit: null,
		protectMove: null,
		protectCreate: null,
		protectCascade: false,

		// - stabilize (FlaggedRevs)
		flaggedRevs: null,

		// internal status
		pageLoaded: false,
		editToken: null,
		loadTime: null,
		lastEditTime: null,
		revertCurID: null,
		revertUser: null,
		fullyProtected: false,
		suppressProtectWarning: false,
		conflictRetries: 0,
		retries: 0,

		// callbacks
		onLoadSuccess: null,
		onLoadFailure: null,
		onSaveSuccess: null,
		onSaveFailure: null,
		onLookupCreationSuccess: null,
		onMoveSuccess: null,
		onMoveFailure: null,
		onDeleteSuccess: null,
		onDeleteFailure: null,
		onUndeleteSuccess: null,
		onUndeleteFailure: null,
		onProtectSuccess: null,
		onProtectFailure: null,
		onStabilizeSuccess: null,
		onStabilizeFailure: null,

		// internal objects
		loadQuery: null,
		loadApi: null,
		saveApi: null,
		lookupCreationApi: null,
		moveApi: null,
		moveProcessApi: null,
		deleteApi: null,
		deleteProcessApi: null,
		undeleteApi: null,
		undeleteProcessApi: null,
		protectApi: null,
		protectProcessApi: null,
		stabilizeApi: null,
		stabilizeProcessApi: null
	};

	var emptyFunction = function() { };

	/**
	 * Loads the text for the page
	 * @param {Function} onSuccess - callback function which is called when the load has succeeded
	 * @param {Function} [onFailure] - callback function which is called when the load fails (optional)
	 */
	this.load = function(onSuccess, onFailure) {
		ctx.onLoadSuccess = onSuccess;
		ctx.onLoadFailure = onFailure || emptyFunction;

		// Need to be able to do something after the page loads
		if (!onSuccess) {
			ctx.statusElement.error('Internal error: no onSuccess callback provided to load()!');
			ctx.onLoadFailure(this);
			return;
		}

		ctx.loadQuery = {
			action: 'query',
			prop: 'info|revisions',
			intoken: 'edit',  // fetch an edit token
			titles: ctx.pageName
			// don't need rvlimit=1 because we don't need rvstartid here and only one actual rev is returned by default
		};

		if (ctx.editMode === 'all') {
			ctx.loadQuery.rvprop = 'content|timestamp';  // get the page content at the same time, if needed
		} else if (ctx.editMode === 'revert') {
			ctx.loadQuery.rvprop = 'timestamp';
			ctx.loadQuery.rvlimit = 1;
			ctx.loadQuery.rvstartid = ctx.revertOldID;
		}

		if (ctx.followRedirect) {
			ctx.loadQuery.redirects = '';  // follow all redirects
		}
		if (typeof ctx.pageSection === 'number') {
			ctx.loadQuery.rvsection = ctx.pageSection;
		}
		if (Morebits.userIsInGroup('sysop')) {
			ctx.loadQuery.inprop = 'protection';
		}

		ctx.loadApi = new Morebits.wiki.api('Retrieving page...', ctx.loadQuery, fnLoadSuccess, ctx.statusElement, ctx.onLoadFailure);
		ctx.loadApi.setParent(this);
		ctx.loadApi.post();
	};

	/**
	 * Saves the text for the page to Wikipedia
	 * Must be preceded by successfully calling load().
	 *
	 * Warning: Calling save() can result in additional calls to the previous load() callbacks
	 * to recover from edit conflicts!
	 * In this case, callers must make the same edit to the new pageText and reinvoke save().
	 * This behavior can be disabled with setMaxConflictRetries(0).
	 * @param {Function} [onSuccess] - callback function which is called when the save has
	 * succeeded (optional)
	 * @param {Function} [onFailure] - callback function which is called when the save fails
	 * (optional)
	 */
	this.save = function(onSuccess, onFailure) {
		ctx.onSaveSuccess = onSuccess;
		ctx.onSaveFailure = onFailure || emptyFunction;

		// are we getting our edit token from mw.user.tokens?
		var canUseMwUserToken = fnCanUseMwUserToken('edit');

		if (!ctx.pageLoaded && !canUseMwUserToken) {
			ctx.statusElement.error('Internal error: attempt to save a page that has not been loaded!');
			ctx.onSaveFailure(this);
			return;
		}
		if (!ctx.editSummary) {
			ctx.statusElement.error('Internal error: edit summary not set before save!');
			ctx.onSaveFailure(this);
			return;
		}

		// shouldn't happen if canUseMwUserToken === true
		if (ctx.fullyProtected && !ctx.suppressProtectWarning &&
			!confirm('You are about to make an edit to the fully protected page "' + ctx.pageName +
			(ctx.fullyProtected === 'infinity' ? '" (protected indefinitely)' : '" (protection expiring ' + ctx.fullyProtected + ')') +
			'.  \n\nClick OK to proceed with the edit, or Cancel to skip this edit.')) {
			ctx.statusElement.error('Edit to fully protected page was aborted.');
			ctx.onSaveFailure(this);
			return;
		}

		ctx.retries = 0;

		var query = {
			action: 'edit',
			title: ctx.pageName,
			summary: ctx.editSummary,
			token: canUseMwUserToken ? mw.user.tokens.get('editToken') : ctx.editToken,
			watchlist: ctx.watchlistOption
		};

		if (typeof ctx.pageSection === 'number') {
			query.section = ctx.pageSection;
		}

		// Set minor edit attribute. If these parameters are present with any value, it is interpreted as true
		if (ctx.minorEdit) {
			query.minor = true;
		} else {
			query.notminor = true;  // force Twinkle config to override user preference setting for "all edits are minor"
		}

		// Set bot edit attribute. If this paramter is present with any value, it is interpreted as true
		if (ctx.botEdit) {
			query.bot = true;
		}

		switch (ctx.editMode) {
			case 'append':
				query.appendtext = ctx.appendText;  // use mode to append to current page contents
				break;
			case 'prepend':
				query.prependtext = ctx.prependText;  // use mode to prepend to current page contents
				break;
			case 'revert':
				query.undo = ctx.revertCurID;
				query.undoafter = ctx.revertOldID;
				if (ctx.lastEditTime) {
					query.basetimestamp = ctx.lastEditTime; // check that page hasn't been edited since it was loaded
				}
				query.starttimestamp = ctx.loadTime; // check that page hasn't been deleted since it was loaded (don't recreate bad stuff)
				break;
			default:
				query.text = ctx.pageText; // replace entire contents of the page
				if (ctx.lastEditTime) {
					query.basetimestamp = ctx.lastEditTime; // check that page hasn't been edited since it was loaded
				}
				query.starttimestamp = ctx.loadTime; // check that page hasn't been deleted since it was loaded (don't recreate bad stuff)
				break;
		}

		if (['recreate', 'createonly', 'nocreate'].indexOf(ctx.createOption) !== -1) {
			query[ctx.createOption] = '';
		}

		if (canUseMwUserToken && ctx.followRedirect) {
			query.redirect = true;
		}

		ctx.saveApi = new Morebits.wiki.api('Saving page...', query, fnSaveSuccess, ctx.statusElement, fnSaveError);
		ctx.saveApi.setParent(this);
		ctx.saveApi.post();
	};

	/**
	 * Adds the text provided via setAppendText() to the end of the page.
	 * Does not require calling load() first.
	 * @param {Function} [onSuccess] - callback function which is called when the method has succeeded (optional)
	 * @param {Function} [onFailure] - callback function which is called when the method fails (optional)
	 */
	this.append = function(onSuccess, onFailure) {
		ctx.editMode = 'append';

		if (fnCanUseMwUserToken('edit')) {
			this.save(onSuccess, onFailure);
		} else {
			ctx.onSaveSuccess = onSuccess;
			ctx.onSaveFailure = onFailure || emptyFunction;
			this.load(fnAutoSave, ctx.onSaveFailure);
		}
	};

	/**
	 * Adds the text provided via setPrependText() to the start of the page.
	 * Does not require calling load() first.
	 * @param {Function}  [onSuccess] - callback function which is called when the method has succeeded (optional)
	 * @param {Function}  [onFailure] - callback function which is called when the method fails (optional)
	 */
	this.prepend = function(onSuccess, onFailure) {
		ctx.editMode = 'prepend';

		if (fnCanUseMwUserToken('edit')) {
			this.save(onSuccess, onFailure);
		} else {
			ctx.onSaveSuccess = onSuccess;
			ctx.onSaveFailure = onFailure || emptyFunction;
			this.load(fnAutoSave, ctx.onSaveFailure);
		}
	};

	/**
	 * @returns {string} string containing the name of the loaded page, including the namespace
	 */
	this.getPageName = function() {
		return ctx.pageName;
	};

	/**
	 * @returns {string} string containing the text of the page after a successful load()
	 */
	this.getPageText = function() {
		return ctx.pageText;
	};

	/**
	 * `pageText` - string containing the updated page text that will be saved when save() is called
	 */
	this.setPageText = function(pageText) {
		ctx.editMode = 'all';
		ctx.pageText = pageText;
	};

	/**
	 * `appendText` - string containing the text that will be appended to the page when append() is called
	 */
	this.setAppendText = function(appendText) {
		ctx.editMode = 'append';
		ctx.appendText = appendText;
	};

	/**
	 * `prependText` - string containing the text that will be prepended to the page when prepend() is called
	 */
	this.setPrependText = function(prependText) {
		ctx.editMode = 'prepend';
		ctx.prependText = prependText;
	};



	// Edit-related setter methods:
	/**
	 * `summary` - string containing the text of the edit summary that will be used when save() is called
	 */
	this.setEditSummary = function(summary) {
		ctx.editSummary = summary;
	};

	/**
	 *    `createOption` is a string value:
	 *       'recreate'   - create the page if it does not exist, or edit it if it exists
	 *       'createonly' - create the page if it does not exist, but return an error if it
	 *                      already exists
	 *       'nocreate'   - don't create the page, only edit it if it already exists
	 *       null         - create the page if it does not exist, unless it was deleted in the moment
	 *                      between retrieving the edit token and saving the edit (default)
	 *
	 */
	this.setCreateOption = function(createOption) {
		ctx.createOption = createOption;
	};

	/**
	 * `minorEdit` - boolean value:
	 * True  - When save is called, the resulting edit will be marked as "minor".
	 * False - When save is called, the resulting edit will not be marked as "minor". (default)
	 */
	this.setMinorEdit = function(minorEdit) {
		ctx.minorEdit = minorEdit;
	};

	/**
	 * `botEdit` is a boolean value:
	 *  True  - When save is called, the resulting edit will be marked as "bot".
	 *  False - When save is called, the resulting edit will not be marked as "bot". (default)
	 */
	this.setBotEdit = function(botEdit) {
		ctx.botEdit = botEdit;
	};

	/**
	 * `pageSection` - integer specifying the section number to load or save.
	 * The default is `null`, which means that the entire page will be retrieved.
	 */
	this.setPageSection = function(pageSection) {
		ctx.pageSection = pageSection;
	};

	/**
	 * `maxRetries` - number of retries for save errors involving an edit conflict or loss of edit token.Default: 2
	 */
	this.setMaxConflictRetries = function(maxRetries) {
		ctx.maxConflictRetries = maxRetries;
	};

	/**
	 * `maxRetries` - number of retries for save errors not involving an edit conflict or loss of edit token
	 * Default: 2
	 */
	this.setMaxRetries = function(maxRetries) {
		ctx.maxRetries = maxRetries;
	};

	/**
	 *  `watchlistOption` is a boolean value:
	 *       True  - page will be added to the user's watchlist when save() is called
	 *       False - watchlist status of the page will not be changed (default)
	 */
	this.setWatchlist = function(watchlistOption) {
		if (watchlistOption) {
			ctx.watchlistOption = 'watch';
		} else {
			ctx.watchlistOption = 'nochange';
		}
	};

	/**
	 *    `watchlistOption` is a boolean value:
	 *       True  - page watchlist status will be set based on the user's
	 *               preference settings when save() is called
	 *       False - watchlist status of the page will not be changed (default)
	 *
	 *    Watchlist notes:
	 *       1. The MediaWiki API value of 'unwatch', which explicitly removes the page from the
	 *          user's watchlist, is not used.
	 *       2. If both setWatchlist() and setWatchlistFromPreferences() are called,
	 *          the last call takes priority.
	 *       3. Twinkle modules should use the appropriate preference to set the watchlist options.
	 *       4. Most Twinkle modules use setWatchlist().
	 *          setWatchlistFromPreferences() is only needed for the few Twinkle watchlist preferences
	 *          that accept a string value of 'default'.
	 */
	this.setWatchlistFromPreferences = function(watchlistOption) {
		if (watchlistOption) {
			ctx.watchlistOption = 'preferences';
		} else {
			ctx.watchlistOption = 'nochange';
		}
	};

	/**
	 *    `followRedirect` is a boolean value:
	 *       True  - a maximum of one redirect will be followed.
	 *               In the event of a redirect, a message is displayed to the user and
	 *               the redirect target can be retrieved with getPageName().
	 *       False - the requested pageName will be used without regard to any redirect. (default)
	 */
	this.setFollowRedirect = function(followRedirect) {
		if (ctx.pageLoaded) {
			ctx.statusElement.error('Internal error: cannot change redirect setting after the page has been loaded!');
			return;
		}
		ctx.followRedirect = followRedirect;
	};

	// Move-related setter functions
	this.setMoveDestination = function(destination) {
		ctx.moveDestination = destination;
	};

	this.setMoveTalkPage = function(flag) {
		ctx.moveTalkPage = !!flag;
	};

	this.setMoveSubpages = function(flag) {
		ctx.moveSubpages = !!flag;
	};

	this.setMoveSuppressRedirect = function(flag) {
		ctx.moveSuppressRedirect = !!flag;
	};

	// Protect-related setter functions
	this.setEditProtection = function(level, expiry) {
		ctx.protectEdit = { level: level, expiry: expiry };
	};

	this.setMoveProtection = function(level, expiry) {
		ctx.protectMove = { level: level, expiry: expiry };
	};

	this.setCreateProtection = function(level, expiry) {
		ctx.protectCreate = { level: level, expiry: expiry };
	};

	this.setCascadingProtection = function(flag) {
		ctx.protectCascade = !!flag;
	};

	this.suppressProtectWarning = function() {
		ctx.suppressProtectWarning = true;
	};

	// Revert-related getters/setters:
	this.setOldID = function(oldID) {
		ctx.revertOldID = oldID;
	};

	/**
	 *  @returns {string} string containing the current revision ID of the page
	 */
	this.getCurrentID = function() {
		return ctx.revertCurID;
	};

	this.getRevisionUser = function() {
		return ctx.revertUser;
	};

	// Miscellaneous getters/setters:

	/**
	 * `callbackParameters` - an object for use in a callback function
	 *
	 * Callback notes: callbackParameters is for use by the caller only. The parameters
	 * allow a caller to pass the proper context into its callback function.
	 * Callers must ensure that any changes to the callbackParameters object
	 * within a load() callback still permit a proper re-entry into the
	 * load() callback if an edit conflict is detected upon calling save().
	 */
	this.setCallbackParameters = function(callbackParameters) {
		ctx.callbackParameters = callbackParameters;
	};

	/**
	 * @returns the object previous set by setCallbackParameters()
	 */
	this.getCallbackParameters = function() {
		return ctx.callbackParameters;
	};

	/**
	 * @returns {Morebits.status} Status element created by the constructor
	 */
	this.getStatusElement = function() {
		return ctx.statusElement;
	};


	this.setFlaggedRevs = function(level, expiry) {
		ctx.flaggedRevs = { level: level, expiry: expiry };
	};

	/**
	 * @returns {boolean} true if the page existed on the wiki when it was last loaded
	 */
	this.exists = function() {
		return ctx.pageExists;
	};

	/**
	 * @returns {string} the user who created the page following lookupCreation()
	 */
	this.getCreator = function() {
		return ctx.creator;
	};

	/**
	 * @returns {string} the ISOString timestamp of page creation following lookupCreation()
	 */
	this.getCreationTimestamp = function() {
		return ctx.timestamp;
	};

	/**
	 * Retrieves the username of the user who created the page as well as
	 * the timestamp of creation
	 * @param {Function} onSuccess - callback function (required) which is
	 * called when the username and timestamp are found within the callback.
	 * The username can be retrieved using the getCreator() function;
	 * the timestamp can be retrieved using the getCreationTimestamp() function
	 */
	this.lookupCreation = function(onSuccess) {
		if (!onSuccess) {
			ctx.statusElement.error('Internal error: no onSuccess callback provided to lookupCreation()!');
			return;
		}
		ctx.onLookupCreationSuccess = onSuccess;

		var query = {
			'action': 'query',
			'prop': 'revisions',
			'titles': ctx.pageName,
			'rvlimit': 1,
			'rvprop': 'user|timestamp',
			'rvdir': 'newer'
		};

		if (ctx.followRedirect) {
			query.redirects = '';  // follow all redirects
		}

		ctx.lookupCreationApi = new Morebits.wiki.api('Retrieving page creation information', query, fnLookupCreationSuccess, ctx.statusElement);
		ctx.lookupCreationApi.setParent(this);
		ctx.lookupCreationApi.post();
	};
	/**
	 * @deprecated since May/June 2019, renamed to lookupCreation
	 */
	this.lookupCreator = function(onSuccess) {
		console.warn("NOTE: lookupCreator() from Twinkle's Morebits has been deprecated since May/June 2019, please use lookupCreation() instead"); // eslint-disable-line no-console
		Morebits.status.warn('NOTE', "lookupCreator() from Twinkle's Morebits has been deprecated since May/June 2019, please use lookupCreation() instead");
		return this.lookupCreation(onSuccess);
	};

	/**
	 * marks the page as patrolled, if possible
	 */
	this.patrol = function() {
		// There's no patrol link on page, so we can't patrol
		if (!$('.patrollink').length) {
			return;
		}

		// Extract the rcid token from the "Mark page as patrolled" link on page
		var patrolhref = $('.patrollink a').attr('href'),
			rcid = mw.util.getParamValue('rcid', patrolhref);

		if (rcid) {

			var patrolstat = new Morebits.status('Marking page as patrolled');

			var wikipedia_api = new Morebits.wiki.api('doing...', {
				action: 'patrol',
				rcid: rcid,
				token: mw.user.tokens.get('patrolToken')
			}, null, patrolstat);

			// We don't really care about the response
			wikipedia_api.post();
		}
	};

	/**
	 * Reverts a page to revertOldID
	 * @param {Function} [onSuccess] - callback function to run on success (optional)
	 * @param {Function} [onFailure] - callback function to run on failure (optional)
	 */
	this.revert = function(onSuccess, onFailure) {
		ctx.onSaveSuccess = onSuccess;
		ctx.onSaveFailure = onFailure || emptyFunction;

		if (!ctx.revertOldID) {
			ctx.statusElement.error('Internal error: revision ID to revert to was not set before revert!');
			ctx.onSaveFailure(this);
			return;
		}

		ctx.editMode = 'revert';
		this.load(fnAutoSave, ctx.onSaveFailure);
	};

	/**
	 * Moves a page to another title
	 * @param {Function} [onSuccess] - callback function to run on success (optional)
	 * @param {Function} [onFailure] - callback function to run on failure (optional)
	 */
	this.move = function(onSuccess, onFailure) {
		ctx.onMoveSuccess = onSuccess;
		ctx.onMoveFailure = onFailure || emptyFunction;

		if (!ctx.editSummary) {
			ctx.statusElement.error('Internal error: move reason not set before move (use setEditSummary function)!');
			ctx.onMoveFailure(this);
			return;
		}
		if (!ctx.moveDestination) {
			ctx.statusElement.error('Internal error: destination page name was not set before move!');
			ctx.onMoveFailure(this);
			return;
		}

		var query = {
			action: 'query',
			prop: 'info',
			intoken: 'move',
			titles: ctx.pageName
		};
		if (ctx.followRedirect) {
			query.redirects = '';  // follow all redirects
		}
		if (Morebits.userIsInGroup('sysop')) {
			query.inprop = 'protection';
		}

		ctx.moveApi = new Morebits.wiki.api('retrieving move token...', query, fnProcessMove, ctx.statusElement, ctx.onMoveFailure);
		ctx.moveApi.setParent(this);
		ctx.moveApi.post();
	};

	// |delete| is a reserved word in some flavours of JS
	/**
	 * Deletes a page (for admins only)
	 * @param {Function} [onSuccess] - callback function to run on success (optional)
	 * @param {Function} [onFailure] - callback function to run on failure (optional)
	 */
	this.deletePage = function(onSuccess, onFailure) {
		ctx.onDeleteSuccess = onSuccess;
		ctx.onDeleteFailure = onFailure || emptyFunction;

		// if a non-admin tries to do this, don't bother
		if (!Morebits.userIsInGroup('sysop')) {
			ctx.statusElement.error('Cannot delete page: only admins can do that');
			ctx.onDeleteFailure(this);
			return;
		}
		if (!ctx.editSummary) {
			ctx.statusElement.error('Internal error: delete reason not set before delete (use setEditSummary function)!');
			ctx.onDeleteFailure(this);
			return;
		}

		if (fnCanUseMwUserToken('delete')) {
			fnProcessDelete.call(this, this);
		} else {
			var query = {
				action: 'query',
				prop: 'info',
				inprop: 'protection',
				intoken: 'delete',
				titles: ctx.pageName
			};
			if (ctx.followRedirect) {
				query.redirects = '';  // follow all redirects
			}

			ctx.deleteApi = new Morebits.wiki.api('retrieving delete token...', query, fnProcessDelete, ctx.statusElement, ctx.onDeleteFailure);
			ctx.deleteApi.setParent(this);
			ctx.deleteApi.post();
		}
	};

	/**
	 * Undeletes a page (for admins only)
	 * @param {Function} [onSuccess] - callback function to run on success (optional)
	 * @param {Function} [onFailure] - callback function to run on failure (optional)
	 */
	this.undeletePage = function(onSuccess, onFailure) {
		ctx.onUndeleteSuccess = onSuccess;
		ctx.onUndeleteFailure = onFailure || emptyFunction;

		// if a non-admin tries to do this, don't bother
		if (!Morebits.userIsInGroup('sysop')) {
			ctx.statusElement.error('Cannot undelete page: only admins can do that');
			ctx.onUndeleteFailure(this);
			return;
		}
		if (!ctx.editSummary) {
			ctx.statusElement.error('Internal error: undelete reason not set before undelete (use setEditSummary function)!');
			ctx.onUndeleteFailure(this);
			return;
		}

		if (fnCanUseMwUserToken('undelete')) {
			fnProcessUndelete.call(this, this);
		} else {
			var query = {
				action: 'query',
				prop: 'info',
				inprop: 'protection',
				intoken: 'undelete',
				titles: ctx.pageName
			};

			ctx.undeleteApi = new Morebits.wiki.api('retrieving undelete token...', query, fnProcessUndelete, ctx.statusElement, ctx.onUndeleteFailure);
			ctx.undeleteApi.setParent(this);
			ctx.undeleteApi.post();
		}
	};

	/**
	 * Protects a page (for admins only)
	 * @param {Function} [onSuccess] - callback function to run on success (optional)
	 * @param {Function} [onFailure] - callback function to run on failure (optional)
	 */
	this.protect = function(onSuccess, onFailure) {
		ctx.onProtectSuccess = onSuccess;
		ctx.onProtectFailure = onFailure || emptyFunction;

		// if a non-admin tries to do this, don't bother
		if (!Morebits.userIsInGroup('sysop')) {
			ctx.statusElement.error('Cannot protect page: only admins can do that');
			ctx.onProtectFailure(this);
			return;
		}
		if (!ctx.protectEdit && !ctx.protectMove && !ctx.protectCreate) {
			ctx.statusElement.error('Internal error: you must set edit and/or move and/or create protection before calling protect()!');
			ctx.onProtectFailure(this);
			return;
		}
		if (!ctx.editSummary) {
			ctx.statusElement.error('Internal error: protection reason not set before protect (use setEditSummary function)!');
			ctx.onProtectFailure(this);
			return;
		}

		// because of the way MW API interprets protection levels (absolute, not
		// differential), we need to request protection levels from the server
		var query = {
			action: 'query',
			prop: 'info',
			inprop: 'protection',
			intoken: 'protect',
			titles: ctx.pageName,
			watchlist: ctx.watchlistOption
		};
		if (ctx.followRedirect) {
			query.redirects = '';  // follow all redirects
		}

		ctx.protectApi = new Morebits.wiki.api('retrieving protect token...', query, fnProcessProtect, ctx.statusElement, ctx.onProtectFailure);
		ctx.protectApi.setParent(this);
		ctx.protectApi.post();
	};

	// apply FlaggedRevs protection-style settings
	// only works where $wgFlaggedRevsProtection = true (i.e. where FlaggedRevs
	// settings appear on the wiki's "protect" tab)
	this.stabilize = function(onSuccess, onFailure) {
		ctx.onStabilizeSuccess = onSuccess;
		ctx.onStabilizeFailure = onFailure || emptyFunction;

		// if a non-admin tries to do this, don't bother
		if (!Morebits.userIsInGroup('sysop')) {
			ctx.statusElement.error('Cannot apply FlaggedRevs settings: only admins can do that');
			ctx.onStabilizeFailure(this);
			return;
		}
		if (!ctx.flaggedRevs) {
			ctx.statusElement.error('Internal error: you must set flaggedRevs before calling stabilize()!');
			ctx.onStabilizeFailure(this);
			return;
		}
		if (!ctx.editSummary) {
			ctx.statusElement.error('Internal error: reason not set before calling stabilize() (use setEditSummary function)!');
			ctx.onStabilizeFailure(this);
			return;
		}

		var query = {
			action: 'query',
			prop: 'info|flagged',
			intoken: 'edit',
			titles: ctx.pageName
		};
		if (ctx.followRedirect) {
			query.redirects = '';  // follow all redirects
		}

		ctx.stabilizeApi = new Morebits.wiki.api('retrieving stabilize token...', query, fnProcessStabilize, ctx.statusElement, ctx.onStabilizeFailure);
		ctx.stabilizeApi.setParent(this);
		ctx.stabilizeApi.post();
	};

	/*
	 * Private member functions
	 * These are not exposed outside
	 */

	/**
	 * Determines whether we can save an API call by using the edit token sent with the page
	 * HTML, or whether we need to ask the server for more info (e.g. protection expiry).
	 *
	 * Currently only used for append, prepend, and deletePage.
	 *
	 * @param {string} action  The action being undertaken, e.g. "edit", "delete".
	 * @returns {boolean}
	 */
	var fnCanUseMwUserToken = function(action) {
		// API-based redirect resolution only works for action=query and
		// action=edit in append/prepend modes (and section=new, but we don't
		// really support that)
		if (ctx.followRedirect && (action !== 'edit' ||
			(ctx.editMode !== 'append' && ctx.editMode !== 'prepend'))) {
			return false;
		}

		// do we need to fetch the edit protection expiry?
		if (Morebits.userIsInGroup('sysop') && !ctx.suppressProtectWarning) {
			// poor man's normalisation
			if (Morebits.string.toUpperCaseFirstChar(mw.config.get('wgPageName')).replace(/ /g, '_').trim() !==
				Morebits.string.toUpperCaseFirstChar(ctx.pageName).replace(/ /g, '_').trim()) {
				return false;
			}

			var editRestriction = mw.config.get('wgRestrictionEdit');
			if (!editRestriction || editRestriction.indexOf('sysop') !== -1) {
				return false;
			}
		}

		return !!mw.user.tokens.get('editToken');
	};

	// callback from loadSuccess() for append() and prepend() threads
	var fnAutoSave = function(pageobj) {
		pageobj.save(ctx.onSaveSuccess, ctx.onSaveFailure);
	};

	// callback from loadApi.post()
	var fnLoadSuccess = function() {
		var xml = ctx.loadApi.getXML();

		if (!fnCheckPageName(xml, ctx.onLoadFailure)) {
			return; // abort
		}

		ctx.pageExists = $(xml).find('page').attr('missing') !== '';
		if (ctx.pageExists) {
			ctx.pageText = $(xml).find('rev').text();
		} else {
			ctx.pageText = '';  // allow for concatenation, etc.
		}

		// extract protection info, to alert admins when they are about to edit a protected page
		if (Morebits.userIsInGroup('sysop')) {
			var editprot = $(xml).find('pr[type="edit"]');
			if (editprot.length > 0 && editprot.attr('level') === 'sysop') {
				ctx.fullyProtected = editprot.attr('expiry');
			} else {
				ctx.fullyProtected = false;
			}
		}

		ctx.editToken = $(xml).find('page').attr('edittoken');
		if (!ctx.editToken) {
			ctx.statusElement.error('Failed to retrieve edit token.');
			ctx.onLoadFailure(this);
			return;
		}
		ctx.loadTime = $(xml).find('page').attr('starttimestamp');
		if (!ctx.loadTime) {
			ctx.statusElement.error('Failed to retrieve start timestamp.');
			ctx.onLoadFailure(this);
			return;
		}
		ctx.lastEditTime = $(xml).find('rev').attr('timestamp');
		ctx.revertCurID = $(xml).find('page').attr('lastrevid');

		if (ctx.editMode === 'revert') {
			ctx.revertCurID = $(xml).find('rev').attr('revid');
			if (!ctx.revertCurID) {
				ctx.statusElement.error('Failed to retrieve current revision ID.');
				ctx.onLoadFailure(this);
				return;
			}
			ctx.revertUser = $(xml).find('rev').attr('user');
			if (!ctx.revertUser) {
				if ($(xml).find('rev').attr('userhidden') === '') {  // username was RevDel'd or oversighted
					ctx.revertUser = '<username hidden>';
				} else {
					ctx.statusElement.error('Failed to retrieve user who made the revision.');
					ctx.onLoadFailure(this);
					return;
				}
			}
			// set revert edit summary
			ctx.editSummary = '[[Help:Revert|Reverted]] to revision ' + ctx.revertOldID + ' by ' + ctx.revertUser + ': ' + ctx.editSummary;
		}

		ctx.pageLoaded = true;

		// alert("Generate edit conflict now");  // for testing edit conflict recovery logic
		ctx.onLoadSuccess(this);  // invoke callback
	};

	// helper function to parse the page name returned from the API
	var fnCheckPageName = function(xml, onFailure) {
		if (!onFailure) {
			onFailure = emptyFunction;
		}

		// check for invalid titles
		if ($(xml).find('page').attr('invalid') === '') {
			ctx.statusElement.error('The page title is invalid: ' + ctx.pageName);
			onFailure(this);
			return false; // abort
		}

		// retrieve actual title of the page after normalization and redirects
		if ($(xml).find('page').attr('title')) {
			var resolvedName = $(xml).find('page').attr('title');

			// only notify user for redirects, not normalization
			if ($(xml).find('redirects').length > 0) {
				Morebits.status.info('Info', 'Redirected from ' + ctx.pageName + ' to ' + resolvedName);
			}
			ctx.pageName = resolvedName;  // always update in case of normalization
		} else {
			// could be a circular redirect or other problem
			ctx.statusElement.error('Could not resolve redirects for: ' + ctx.pageName);
			onFailure(this);

			// force error to stay on the screen
			++Morebits.wiki.numberOfActionsLeft;
			return false; // abort
		}
		return true; // all OK
	};

	// callback from saveApi.post()
	var fnSaveSuccess = function() {
		ctx.editMode = 'all';  // cancel append/prepend/revert modes
		var xml = ctx.saveApi.getXML();

		// see if the API thinks we were successful
		if ($(xml).find('edit').attr('result') === 'Success') {

			// real success
			// default on success action - display link for edited page
			var link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(ctx.pageName));
			link.appendChild(document.createTextNode(ctx.pageName));
			ctx.statusElement.info(['completed (', link, ')']);
			if (ctx.onSaveSuccess) {
				ctx.onSaveSuccess(this);  // invoke callback
			}
			return;
		}

		// errors here are only generated by extensions which hook APIEditBeforeSave within MediaWiki
		// Wikimedia wikis should only return spam blacklist errors, captchas, and AbuseFilter messages
		var $editNode = $(xml).find('edit');
		var blacklist = $editNode.attr('spamblacklist');

		if (blacklist) {
			var code = document.createElement('code');
			code.style.fontFamily = 'monospace';
			code.appendChild(document.createTextNode(blacklist));
			ctx.statusElement.error(['Could not save the page because the URL ', code, ' is on the spam blacklist.']);
		} else if ($(xml).find('captcha').length > 0) {
			ctx.statusElement.error('Could not save the page because the wiki server wanted you to fill out a CAPTCHA.');
		} else if ($editNode.attr('code') === 'abusefilter-disallowed') {
			ctx.statusElement.error('The edit was disallowed by the edit filter rule "' + $editNode.attr('info').substring(17) + '".');
		} else if ($editNode.attr('info').indexOf('Hit AbuseFilter:') === 0) {
			var div = document.createElement('div');
			div.className = 'toccolours';
			div.style.fontWeight = 'normal';
			div.style.color = 'black';
			div.innerHTML = $editNode.attr('warning');
			ctx.statusElement.error([ 'The following warning was returned by the edit filter: ', div, 'If you wish to proceed with the edit, please carry it out again. This warning wil not appear a second time.' ]);
			// XXX provide the user with a way to automatically retry the action if they so choose -
			// I can't see how to do this without creating a UI dependency on Morebits.wiki.page though -- TTO
		} else {
			ctx.statusElement.error('Unknown error received from API while saving page');
		}

		// force error to stay on the screen
		++Morebits.wiki.numberOfActionsLeft;

		ctx.onSaveFailure(this);
	};

	// callback from saveApi.post()
	var fnSaveError = function() {

		var errorCode = ctx.saveApi.getErrorCode();

		// check for edit conflict
		if (errorCode === 'editconflict' && ctx.conflictRetries++ < ctx.maxConflictRetries) {

			// edit conflicts can occur when the page needs to be purged from the server cache
			var purgeQuery = {
				action: 'purge',
				titles: ctx.pageName  // redirects are already resolved
			};

			var purgeApi = new Morebits.wiki.api('Edit conflict detected, purging server cache', purgeQuery, null, ctx.statusElement);
			purgeApi.post({ async: false });  // just wait for it, result is for debugging

			--Morebits.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds

			ctx.statusElement.info('Edit conflict detected, reapplying edit');
			if (fnCanUseMwUserToken('edit')) {
				ctx.saveApi.post(); // necessarily append or prepend, so this should work as desired
			} else {
				ctx.loadApi.post(); // reload the page and reapply the edit
			}

		// check for loss of edit token
		// it's impractical to request a new token here, so invoke edit conflict logic when this happens
		} else if (errorCode === 'notoken' && ctx.conflictRetries++ < ctx.maxConflictRetries) {

			ctx.statusElement.info('Edit token is invalid, retrying');
			--Morebits.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			if (fnCanUseMwUserToken('edit')) {
				this.load(fnAutoSave, ctx.onSaveFailure); // try the append or prepend again
			} else {
				ctx.loadApi.post(); // reload the page and reapply the edit
			}

		// check for network or server error
		} else if (errorCode === 'undefined' && ctx.retries++ < ctx.maxRetries) {

			// the error might be transient, so try again
			ctx.statusElement.info('Save failed, retrying');
			--Morebits.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			ctx.saveApi.post(); // give it another go!

		// hard error, give up
		} else {

			// non-admin attempting to edit a protected page - this gives a friendlier message than the default
			if (errorCode === 'protectedpage') {
				ctx.statusElement.error('Failed to save edit: Page is protected');
			} else {
				ctx.statusElement.error('Failed to save edit: ' + ctx.saveApi.getErrorText());
			}
			ctx.editMode = 'all';  // cancel append/prepend/revert modes
			if (ctx.onSaveFailure) {
				ctx.onSaveFailure(this);  // invoke callback
			}
		}
	};

	var fnLookupCreationSuccess = function() {
		var xml = ctx.lookupCreationApi.getXML();

		if (!fnCheckPageName(xml)) {
			return; // abort
		}

		ctx.creator = $(xml).find('rev').attr('user');
		if (!ctx.creator) {
			ctx.statusElement.error('Could not find name of page creator');
			return;
		}
		ctx.timestamp = $(xml).find('rev').attr('timestamp');
		if (!ctx.timestamp) {
			ctx.statusElement.error('Could not find timestamp of page creation');
			return;
		}

		ctx.onLookupCreationSuccess(this);
	};

	var fnProcessMove = function() {
		var xml = ctx.moveApi.getXML();

		if ($(xml).find('page').attr('missing') === '') {
			ctx.statusElement.error('Cannot move the page, because it no longer exists');
			ctx.onMoveFailure(this);
			return;
		}

		// extract protection info
		if (Morebits.userIsInGroup('sysop')) {
			var editprot = $(xml).find('pr[type="edit"]');
			if (editprot.length > 0 && editprot.attr('level') === 'sysop' && !ctx.suppressProtectWarning &&
				!confirm('You are about to move the fully protected page "' + ctx.pageName +
				(editprot.attr('expiry') === 'infinity' ? '" (protected indefinitely)' : '" (protection expiring ' + editprot.attr('expiry') + ')') +
				'.  \n\nClick OK to proceed with the move, or Cancel to skip this move.')) {
				ctx.statusElement.error('Move of fully protected page was aborted.');
				ctx.onMoveFailure(this);
				return;
			}
		}

		var moveToken = $(xml).find('page').attr('movetoken');
		if (!moveToken) {
			ctx.statusElement.error('Failed to retrieve move token.');
			ctx.onMoveFailure(this);
			return;
		}

		var query = {
			'action': 'move',
			'from': $(xml).find('page').attr('title'),
			'to': ctx.moveDestination,
			'token': moveToken,
			'reason': ctx.editSummary
		};
		if (ctx.moveTalkPage) {
			query.movetalk = 'true';
		}
		if (ctx.moveSubpages) {
			query.movesubpages = 'true';  // XXX don't know whether this works for non-admins
		}
		if (ctx.moveSuppressRedirect) {
			query.noredirect = 'true';
		}
		if (ctx.watchlistOption === 'watch') {
			query.watch = 'true';
		}

		ctx.moveProcessApi = new Morebits.wiki.api('moving page...', query, ctx.onMoveSuccess, ctx.statusElement, ctx.onMoveFailure);
		ctx.moveProcessApi.setParent(this);
		ctx.moveProcessApi.post();
	};

	var fnProcessDelete = function() {
		var pageTitle, token;

		if (fnCanUseMwUserToken('delete')) {
			token = mw.user.tokens.get('editToken');
			pageTitle = ctx.pageName;
		} else {
			var xml = ctx.deleteApi.getXML();

			if ($(xml).find('page').attr('missing') === '') {
				ctx.statusElement.error('Cannot delete the page, because it no longer exists');
				ctx.onDeleteFailure(this);
				return;
			}

			// extract protection info
			var editprot = $(xml).find('pr[type="edit"]');
			if (editprot.length > 0 && editprot.attr('level') === 'sysop' && !ctx.suppressProtectWarning &&
				!confirm('You are about to delete the fully protected page "' + ctx.pageName +
				(editprot.attr('expiry') === 'infinity' ? '" (protected indefinitely)' : '" (protection expiring ' + editprot.attr('expiry') + ')') +
				'.  \n\nClick OK to proceed with the deletion, or Cancel to skip this deletion.')) {
				ctx.statusElement.error('Deletion of fully protected page was aborted.');
				ctx.onDeleteFailure(this);
				return;
			}

			token = $(xml).find('page').attr('deletetoken');
			if (!token) {
				ctx.statusElement.error('Failed to retrieve delete token.');
				ctx.onDeleteFailure(this);
				return;
			}

			pageTitle = $(xml).find('page').attr('title');
		}

		var query = {
			'action': 'delete',
			'title': pageTitle,
			'token': token,
			'reason': ctx.editSummary
		};
		if (ctx.watchlistOption === 'watch') {
			query.watch = 'true';
		}

		ctx.deleteProcessApi = new Morebits.wiki.api('deleting page...', query, ctx.onDeleteSuccess, ctx.statusElement, fnProcessDeleteError);
		ctx.deleteProcessApi.setParent(this);
		ctx.deleteProcessApi.post();
	};

	// callback from deleteProcessApi.post()
	var fnProcessDeleteError = function() {

		var errorCode = ctx.deleteProcessApi.getErrorCode();

		// check for "Database query error"
		if (errorCode === 'internal_api_error_DBQueryError' && ctx.retries++ < ctx.maxRetries) {
			ctx.statusElement.info('Database query error, retrying');
			--Morebits.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			ctx.deleteProcessApi.post(); // give it another go!
		} else if (errorCode === 'badtoken') {
			// this is pathetic, but given the current state of Morebits.wiki.page it would
			// be a dog's breakfast to try and fix this
			ctx.statusElement.error('Invalid token. Please refresh the page and try again.');
			if (ctx.onDeleteFailure) {
				ctx.onDeleteFailure.call(this, this, ctx.deleteProcessApi);
			}
		} else if (errorCode === 'missingtitle') {
			ctx.statusElement.error('Cannot delete the page, because it no longer exists');
			if (ctx.onDeleteFailure) {
				ctx.onDeleteFailure.call(this, ctx.deleteProcessApi);  // invoke callback
			}
		// hard error, give up
		} else {
			ctx.statusElement.error('Failed to delete the page: ' + ctx.deleteProcessApi.getErrorText());
			if (ctx.onDeleteFailure) {
				ctx.onDeleteFailure.call(this, ctx.deleteProcessApi);  // invoke callback
			}
		}
	};

	var fnProcessUndelete = function() {
		var pageTitle, token;

		// The whole handling of tokens in Morebits is outdated (#615)
		// but has generally worked since intoken has been deprecated
		// but remains.  intoken does not, however, take undelete, so
		// fnCanUseMwUserToken('undelete') is no good.  Everything
		// except watching and patrolling should eventually use csrf,
		// but until then (#615) the stupid hack below should work for
		// undeletion.
		if (fnCanUseMwUserToken('undelete')) {
			token = mw.user.tokens.get('editToken');
			pageTitle = ctx.pageName;
		} else {
			var xml = ctx.undeleteApi.getXML();

			if ($(xml).find('page').attr('missing') !== '') {
				ctx.statusElement.error('Cannot undelete the page, because it already exists');
				ctx.onUndeleteFailure(this);
				return;
			}

			// extract protection info
			var editprot = $(xml).find('pr[type="create"]');
			if (editprot.length > 0 && editprot.attr('level') === 'sysop' && !ctx.suppressProtectWarning &&
				!confirm('You are about to undelete the fully create protected page "' + ctx.pageName +
				(editprot.attr('expiry') === 'infinity' ? '" (protected indefinitely)' : '" (protection expiring ' + editprot.attr('expiry') + ')') +
				'.  \n\nClick OK to proceed with the undeletion, or Cancel to skip this undeletion.')) {
				ctx.statusElement.error('Undeletion of fully create protected page was aborted.');
				ctx.onUndeleteFailure(this);
				return;
			}

			// KLUDGE:
			token = mw.user.tokens.get('editToken');
			pageTitle = ctx.pageName;
		}

		var query = {
			'action': 'undelete',
			'title': pageTitle,
			'token': token,
			'reason': ctx.editSummary
		};
		if (ctx.watchlistOption === 'watch') {
			query.watch = 'true';
		}

		ctx.undeleteProcessApi = new Morebits.wiki.api('undeleting page...', query, ctx.onUndeleteSuccess, ctx.statusElement, fnProcessUndeleteError);
		ctx.undeleteProcessApi.setParent(this);
		ctx.undeleteProcessApi.post();
	};

	// callback from undeleteProcessApi.post()
	var fnProcessUndeleteError = function() {

		var errorCode = ctx.undeleteProcessApi.getErrorCode();

		// check for "Database query error"
		if (errorCode === 'internal_api_error_DBQueryError' && ctx.retries++ < ctx.maxRetries) {
			ctx.statusElement.info('Database query error, retrying');
			--Morebits.wiki.numberOfActionsLeft;  // allow for normal completion if retry succeeds
			ctx.undeleteProcessApi.post(); // give it another go!
		} else if (errorCode === 'badtoken') {
			// this is pathetic, but given the current state of Morebits.wiki.page it would
			// be a dog's breakfast to try and fix this
			ctx.statusElement.error('Invalid token. Please refresh the page and try again.');
			if (ctx.onUndeleteFailure) {
				ctx.onUndeleteFailure.call(this, this, ctx.undeleteProcessApi);
			}
		} else if (errorCode === 'cantundelete') {
			ctx.statusElement.error('Cannot undelete the page, either because there are no revisions to undelete or because it has already been undeleted');
			if (ctx.onUndeleteFailure) {
				ctx.onUndeleteFailure.call(this, ctx.undeleteProcessApi);  // invoke callback
			}
		// hard error, give up
		} else {
			ctx.statusElement.error('Failed to undelete the page: ' + ctx.undeleteProcessApi.getErrorText());
			if (ctx.onUndeleteFailure) {
				ctx.onUndeleteFailure.call(this, ctx.undeleteProcessApi);  // invoke callback
			}
		}
	};

	var fnProcessProtect = function() {
		var xml = ctx.protectApi.getXML();

		var missing = $(xml).find('page').attr('missing') === '';
		if ((ctx.protectEdit || ctx.protectMove) && missing) {
			ctx.statusElement.error('Cannot protect the page, because it no longer exists');
			ctx.onProtectFailure(this);
			return;
		}
		if (ctx.protectCreate && !missing) {
			ctx.statusElement.error('Cannot create protect the page, because it already exists');
			ctx.onProtectFailure(this);
			return;
		}

		// TODO cascading protection not possible on edit<sysop

		var protectToken = $(xml).find('page').attr('protecttoken');
		if (!protectToken) {
			ctx.statusElement.error('Failed to retrieve protect token.');
			ctx.onProtectFailure(this);
			return;
		}

		// fetch existing protection levels
		var prs = $(xml).find('pr');
		var editprot = prs.filter('[type="edit"]');
		var moveprot = prs.filter('[type="move"]');
		var createprot = prs.filter('[type="create"]');

		var protections = [], expirys = [];

		// set edit protection level
		if (ctx.protectEdit) {
			protections.push('edit=' + ctx.protectEdit.level);
			expirys.push(ctx.protectEdit.expiry);
		} else if (editprot.length) {
			protections.push('edit=' + editprot.attr('level'));
			expirys.push(editprot.attr('expiry').replace('infinity', 'indefinite'));
		}

		if (ctx.protectMove) {
			protections.push('move=' + ctx.protectMove.level);
			expirys.push(ctx.protectMove.expiry);
		} else if (moveprot.length) {
			protections.push('move=' + moveprot.attr('level'));
			expirys.push(moveprot.attr('expiry').replace('infinity', 'indefinite'));
		}

		if (ctx.protectCreate) {
			protections.push('create=' + ctx.protectCreate.level);
			expirys.push(ctx.protectCreate.expiry);
		} else if (createprot.length) {
			protections.push('create=' + createprot.attr('level'));
			expirys.push(createprot.attr('expiry').replace('infinity', 'indefinite'));
		}

		var query = {
			action: 'protect',
			title: $(xml).find('page').attr('title'),
			token: protectToken,
			protections: protections.join('|'),
			expiry: expirys.join('|'),
			reason: ctx.editSummary
		};
		if (ctx.protectCascade) {
			query.cascade = 'true';
		}
		if (ctx.watchlistOption === 'watch') {
			query.watch = 'true';
		}

		ctx.protectProcessApi = new Morebits.wiki.api('protecting page...', query, ctx.onProtectSuccess, ctx.statusElement, ctx.onProtectFailure);
		ctx.protectProcessApi.setParent(this);
		ctx.protectProcessApi.post();
	};

	var fnProcessStabilize = function() {
		var xml = ctx.stabilizeApi.getXML();

		var missing = $(xml).find('page').attr('missing') === '';
		if (missing) {
			ctx.statusElement.error('Cannot protect the page, because it no longer exists');
			ctx.onStabilizeFailure(this);
			return;
		}

		var stabilizeToken = $(xml).find('page').attr('edittoken');
		if (!stabilizeToken) {
			ctx.statusElement.error('Failed to retrieve stabilize token.');
			ctx.onStabilizeFailure(this);
			return;
		}

		var query = {
			action: 'stabilize',
			title: $(xml).find('page').attr('title'),
			token: stabilizeToken,
			protectlevel: ctx.flaggedRevs.level,
			expiry: ctx.flaggedRevs.expiry,
			reason: ctx.editSummary
		};
		if (ctx.watchlistOption === 'watch') {
			query.watch = 'true';
		}

		ctx.stabilizeProcessApi = new Morebits.wiki.api('configuring stabilization settings...', query, ctx.onStabilizeSuccess, ctx.statusElement, ctx.onStabilizeFailure);
		ctx.stabilizeProcessApi.setParent(this);
		ctx.stabilizeProcessApi.post();
	};
}; // end Morebits.wiki.page

/* Morebits.wiki.page TODO: (XXX)
* - Should we retry loads also?
* - Need to reset current action before the save?
* - Deal with action.completed stuff
* - Need to reset all parameters once done (e.g. edit summary, move destination, etc.)
*/



/**
 * **************** Morebits.wiki.preview ****************
 * Uses the API to parse a fragment of wikitext and render it as HTML.
 *
 * The suggested implementation pattern (in Morebits.simpleWindow + Morebits.quickForm situations) is to
 * construct a Morebits.wiki.preview object after rendering a Morebits.quickForm, and bind the object
 * to an arbitrary property of the form (e.g. |previewer|).  For an example, see
 * twinklewarn.js.
 */

/**
 * @constructor
 * @param {HTMLElement} previewbox - the element that will contain the rendered HTML,
 * usually a <div> element
 */
Morebits.wiki.preview = function(previewbox) {
	this.previewbox = previewbox;
	$(previewbox).addClass('morebits-previewbox').hide();

	/**
	 * Displays the preview box, and begins an asynchronous attempt
	 * to render the specified wikitext.
	 * @param {string} wikitext - wikitext to render; most things should work, including subst: and ~~~~
	 * @param {string} [pageTitle] - optional parameter for the page this should be rendered as being on, if omitted it is taken as the current page
	 */
	this.beginRender = function(wikitext, pageTitle) {
		$(previewbox).show();

		var statusspan = document.createElement('span');
		previewbox.appendChild(statusspan);
		Morebits.status.init(statusspan);

		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',  // PST = pre-save transform; this makes substitution work properly
			text: wikitext,
			title: pageTitle || mw.config.get('wgPageName')
		};
		var renderApi = new Morebits.wiki.api('loading...', query, fnRenderSuccess, new Morebits.status('Preview'));
		renderApi.post();
	};

	var fnRenderSuccess = function(apiobj) {
		var xml = apiobj.getXML();
		var html = $(xml).find('text').text();
		if (!html) {
			apiobj.statelem.error('failed to retrieve preview, or template was blanked');
			return;
		}
		previewbox.innerHTML = html;
		$(previewbox).find('a').attr('target', '_blank'); // this makes links open in new tab
	};

	/**
	 * Hides the preview box and clears it.
	 */
	this.closePreview = function() {
		$(previewbox).empty().hide();
	};
};



/**
 * **************** Morebits.wikitext ****************
 * Wikitext manipulation
 */

Morebits.wikitext = {};

Morebits.wikitext.template = {
	parse: function(text, start) {
		var count = -1;
		var level = -1;
		var equals = -1;
		var current = '';
		var result = {
			name: '',
			parameters: {}
		};
		var key, value;

		for (var i = start; i < text.length; ++i) {
			var test3 = text.substr(i, 3);
			if (test3 === '{{{') {
				current += '{{{';
				i += 2;
				++level;
				continue;
			}
			if (test3 === '}}}') {
				current += '}}}';
				i += 2;
				--level;
				continue;
			}
			var test2 = text.substr(i, 2);
			if (test2 === '{{' || test2 === '[[') {
				current += test2;
				++i;
				++level;
				continue;
			}
			if (test2 === ']]') {
				current += ']]';
				++i;
				--level;
				continue;
			}
			if (test2 === '}}') {
				current += test2;
				++i;
				--level;

				if (level <= 0) {
					if (count === -1) {
						result.name = current.substring(2).trim();
						++count;
					} else {
						if (equals !== -1) {
							key = current.substring(0, equals).trim();
							value = current.substring(equals).trim();
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

			if (text.charAt(i) === '|' && level <= 0) {
				if (count === -1) {
					result.name = current.substring(2).trim();
					++count;
				} else {
					if (equals !== -1) {
						key = current.substring(0, equals).trim();
						value = current.substring(equals + 1).trim();
						result.parameters[key] = value;
						equals = -1;
					} else {
						result.parameters[count] = current;
						++count;
					}
				}
				current = '';
			} else if (equals === -1 && text.charAt(i) === '=' && level <= 0) {
				equals = current.length;
				current += text.charAt(i);
			} else {
				current += text.charAt(i);
			}
		}

		return result;
	}
};

/**
 * @constructor
 * @param {string} text
 */
Morebits.wikitext.page = function mediawikiPage(text) {
	this.text = text;
};

Morebits.wikitext.page.prototype = {
	text: '',

	/**
	 * Removes links to `link_target` from the page text.
	 * @param {string} link_target
	 */
	removeLink: function(link_target) {
		var first_char = link_target.substr(0, 1);
		var link_re_string = '[' + first_char.toUpperCase() + first_char.toLowerCase() + ']' + RegExp.escape(link_target.substr(1), true);

		// Files and Categories become links with a leading colon.
		// e.g. [[:File:Test.png]]
		var special_ns_re = /^(?:[Ff]ile|[Ii]mage|[Cc]ategory):/;
		var colon = special_ns_re.test(link_target) ? ':' : '';

		var link_simple_re = new RegExp('\\[\\[' + colon + '(' + link_re_string + ')\\]\\]', 'g');
		var link_named_re = new RegExp('\\[\\[' + colon + link_re_string + '\\|(.+?)\\]\\]', 'g');
		this.text = this.text.replace(link_simple_re, '$1').replace(link_named_re, '$1');
	},

	/**
	 * Comments out images from page text. If used in a gallery, deletes the whole line.
	 * If used as a template argument (not necessarily with File: prefix), the template parameter is commented out.
	 * @param {string} image - Image name without File: prefix
	 * @param {string} reason - Reason to be included in comment, alongside the commented-out image
	 */
	commentOutImage: function(image, reason) {
		var unbinder = new Morebits.unbinder(this.text);
		unbinder.unbind('<!--', '-->');

		reason = reason ? reason + ': ' : '';
		var first_char = image.substr(0, 1);
		var image_re_string = '[' + first_char.toUpperCase() + first_char.toLowerCase() + ']' + RegExp.escape(image.substr(1), true);

		// Check for normal image links, i.e. [[File:Foobar.png|...]]
		// Will eat the whole link
		var links_re = new RegExp('\\[\\[(?:[Ii]mage|[Ff]ile):\\s*' + image_re_string);
		var allLinks = Morebits.array.uniq(Morebits.string.splitWeightedByKeys(unbinder.content, '[[', ']]'));
		for (var i = 0; i < allLinks.length; ++i) {
			if (links_re.test(allLinks[i])) {
				var replacement = '<!-- ' + reason + allLinks[i] + ' -->';
				unbinder.content = unbinder.content.replace(allLinks[i], replacement, 'g');
			}
		}
		// unbind the newly created comments
		unbinder.unbind('<!--', '-->');

		// Check for gallery images, i.e. instances that must start on a new line,
		// eventually preceded with some space, and must include File: prefix
		// Will eat the whole line.
		var gallery_image_re = new RegExp('(^\\s*(?:[Ii]mage|[Ff]ile):\\s*' + image_re_string + '.*?$)', 'mg');
		unbinder.content = unbinder.content.replace(gallery_image_re, '<!-- ' + reason + '$1 -->');

		// unbind the newly created comments
		unbinder.unbind('<!--', '-->');

		// Check free image usages, for example as template arguments, might have the File: prefix excluded, but must be preceeded by an |
		// Will only eat the image name and the preceeding bar and an eventual named parameter
		var free_image_re = new RegExp('(\\|\\s*(?:[\\w\\s]+\\=)?\\s*(?:(?:[Ii]mage|[Ff]ile):\\s*)?' + image_re_string + ')', 'mg');
		unbinder.content = unbinder.content.replace(free_image_re, '<!-- ' + reason + '$1 -->');
		// Rebind the content now, we are done!
		this.text = unbinder.rebind();
	},

	/**
	 * Converts first usage of [[File:`image`]] to [[File:`image`|`data`]]
	 * @param {string} image - Image name without File: prefix
	 * @param {string} data
	 */
	addToImageComment: function(image, data) {
		var first_char = image.substr(0, 1);
		var first_char_regex = RegExp.escape(first_char, true);
		if (first_char.toUpperCase() !== first_char.toLowerCase()) {
			first_char_regex = '[' + RegExp.escape(first_char.toUpperCase(), true) + RegExp.escape(first_char.toLowerCase(), true) + ']';
		}
		var image_re_string = '(?:[Ii]mage|[Ff]ile):\\s*' + first_char_regex + RegExp.escape(image.substr(1), true);
		var links_re = new RegExp('\\[\\[' + image_re_string);
		var allLinks = Morebits.array.uniq(Morebits.string.splitWeightedByKeys(this.text, '[[', ']]'));
		for (var i = 0; i < allLinks.length; ++i) {
			if (links_re.test(allLinks[i])) {
				var replacement = allLinks[i];
				// just put it at the end?
				replacement = replacement.replace(/\]\]$/, '|' + data + ']]');
				this.text = this.text.replace(allLinks[i], replacement, 'g');
			}
		}
		var gallery_re = new RegExp('^(\\s*' + image_re_string + '.*?)\\|?(.*?)$', 'mg');
		var newtext = '$1|$2 ' + data;
		this.text = this.text.replace(gallery_re, newtext);
	},

	/**
	 * Removes transclusions of template from page text
	 * @param {string} template - Page name whose transclusions are to be removed,
	 * include namespace prefix only if not in template namespace
	 */
	removeTemplate: function(template) {
		var first_char = template.substr(0, 1);
		var template_re_string = '(?:[Tt]emplate:)?\\s*[' + first_char.toUpperCase() + first_char.toLowerCase() + ']' + RegExp.escape(template.substr(1), true);
		var links_re = new RegExp('\\{\\{' + template_re_string);
		var allTemplates = Morebits.array.uniq(Morebits.string.splitWeightedByKeys(this.text, '{{', '}}', [ '{{{', '}}}' ]));
		for (var i = 0; i < allTemplates.length; ++i) {
			if (links_re.test(allTemplates[i])) {
				this.text = this.text.replace(allTemplates[i], '', 'g');
			}
		}
	},

	getText: function() {
		return this.text;
	}
};



/**
 * **************** Morebits.queryString ****************
 * Maps the querystring to an JS object
 *
 * In static context, the value of location.search.substring(1), else the value given
 * to the constructor is going to be used. The mapped hash is saved in the object.
 *
 * Example:
 *
 * var value = Morebits.queryString.get('key');
 * var obj = new Morebits.queryString('foo=bar&baz=quux');
 * value = obj.get('foo');
 */

/**
 * @constructor
 * @param {string} qString   The query string
 */
Morebits.queryString = function QueryString(qString) {
	this.string = qString;
	this.params = {};

	if (!qString.length) {
		return;
	}

	qString.replace(/\+/, ' ');
	var args = qString.split('&');

	for (var i = 0; i < args.length; ++i) {
		var pair = args[i].split('=');
		var key = decodeURIComponent(pair[0]), value = key;

		if (pair.length === 2) {
			value = decodeURIComponent(pair[1]);
		}

		this.params[key] = value;
	}
};

Morebits.queryString.staticstr = null;

Morebits.queryString.staticInit = function() {
	if (!Morebits.queryString.staticstr) {
		Morebits.queryString.staticstr = new Morebits.queryString(location.search.substring(1));
	}
};

Morebits.queryString.get = function(key) {
	Morebits.queryString.staticInit();
	return Morebits.queryString.staticstr.get(key);
};

Morebits.queryString.exists = function(key) {
	Morebits.queryString.staticInit();
	return Morebits.queryString.staticstr.exists(key);
};

Morebits.queryString.equals = function(key, value) {
	Morebits.queryString.staticInit();
	return Morebits.queryString.staticstr.equals(key, value);
};

Morebits.queryString.toString = function() {
	Morebits.queryString.staticInit();
	return Morebits.queryString.staticstr.toString();
};

Morebits.queryString.create = function(arr) {
	var resarr = [];
	var editToken;  // KLUGE: this should always be the last item in the query string (bug TW-B-0013)
	for (var i in arr) {
		if (arr[i] === undefined) {
			continue;
		}
		var res;
		if (Array.isArray(arr[i])) {
			var v = [];
			for (var j = 0; j < arr[i].length; ++j) {
				v[j] = encodeURIComponent(arr[i][j]);
			}
			res = v.join('|');
		} else {
			res = encodeURIComponent(arr[i]);
		}
		if (i === 'token') {
			editToken = res;
		} else {
			resarr.push(encodeURIComponent(i) + '=' + res);
		}
	}
	if (editToken !== undefined) {
		resarr.push('token=' + editToken);
	}
	return resarr.join('&');
};

/**
 * @returns {string} the value associated to the given `key`
 * @param {string} key
 */
Morebits.queryString.prototype.get = function(key) {
	return this.params[key] || null;
};

/**
 * @returns {boolean} true if the given `key` is set
 * @param {string} key
 */
Morebits.queryString.prototype.exists = function(key) {
	return !!this.params[key];
};

/**
 * @returns {boolean} true if the value associated with given `key` equals given `value`
 * @param {string} key
 * @param {string} value
 */
Morebits.queryString.prototype.equals = function(key, value) {
	return this.params[key] === value;
};

/**
 * @returns {string}
 */
Morebits.queryString.prototype.toString = function() {
	return this.string || null;
};

/**
 * Creates a querystring and encodes strings via `encodeURIComponent` and joins arrays with `|`
 * @param {Array} arr
 * @returns {string}
 */
Morebits.queryString.prototype.create = Morebits.queryString.create;



/**
 * **************** Morebits.status ****************
 */

/**
  * @constructor
  * Morebits.status.init() must be called before any status object is created, otherwise
  * those statuses won't be visible.
  * @param {String} text - Text before the the colon `:`
  * @param {String} stat - Text after the colon `:`
  * @param {String} [type='status'] - This parameter determines the font color of the status line,
  * this can be 'status' (blue), 'info' (green), 'warn' (red), or 'error' (bold red)
  * The default is 'status'
  */

Morebits.status = function Status(text, stat, type) {
	this.textRaw = text;
	this.text = this.codify(text);
	this.type = type || 'status';
	this.generate();
	if (stat) {
		this.update(stat, type);
	}
};

/**
 * Specify an area for status message elements to be added to
 * @param {HTMLElement} root - usually a div element
 */
Morebits.status.init = function(root) {
	if (!(root instanceof Element)) {
		throw new Error('object not an instance of Element');
	}
	while (root.hasChildNodes()) {
		root.removeChild(root.firstChild);
	}
	Morebits.status.root = root;
	Morebits.status.errorEvent = null;
};

Morebits.status.root = null;

Morebits.status.onError = function(handler) {
	if (typeof handler === 'function') {
		Morebits.status.errorEvent = handler;
	} else {
		throw 'Morebits.status.onError: handler is not a function';
	}
};

Morebits.status.prototype = {
	stat: null,
	text: null,
	textRaw: null,
	type: 'status',
	target: null,
	node: null,
	linked: false,

	/**
	 * Add the status element node to the DOM
	 */
	link: function() {
		if (!this.linked && Morebits.status.root) {
			Morebits.status.root.appendChild(this.node);
			this.linked = true;
		}
	},

	/**
	 * Remove the status element node from the DOM
	 */
	unlink: function() {
		if (this.linked) {
			Morebits.status.root.removeChild(this.node);
			this.linked = false;
		}
	},

	/**
	 * Create a document fragment with the status text
	 */
	codify: function(obj) {
		if (!Array.isArray(obj)) {
			obj = [ obj ];
		}
		var result;
		result = document.createDocumentFragment();
		for (var i = 0; i < obj.length; ++i) {
			if (typeof obj[i] === 'string') {
				result.appendChild(document.createTextNode(obj[i]));
			} else if (obj[i] instanceof Element) {
				result.appendChild(obj[i]);
			} // Else cosmic radiation made something shit
		}
		return result;

	},

	/**
	 * Update the status
	 * @param {String} status - Part of status message after colon `:`
	 * @param {String} type - 'status' (blue), 'info' (green), 'warn' (red), or 'error' (bold red)
	 */
	update: function(status, type) {
		this.stat = this.codify(status);
		if (type) {
			this.type = type;
			if (type === 'error') {
				// hack to force the page not to reload when an error is output - see also Morebits.status() above
				Morebits.wiki.numberOfActionsLeft = 1000;

				// call error callback
				if (Morebits.status.errorEvent) {
					Morebits.status.errorEvent();
				}

				// also log error messages in the browser console
				console.error(this.textRaw + ': ' + status); // eslint-disable-line no-console
			}
		}
		this.render();
	},

	/**
	 * Produce the html for first part of the status message
	 */
	generate: function() {
		this.node = document.createElement('div');
		this.node.appendChild(document.createElement('span')).appendChild(this.text);
		this.node.appendChild(document.createElement('span')).appendChild(document.createTextNode(': '));
		this.target = this.node.appendChild(document.createElement('span'));
		this.target.appendChild(document.createTextNode('')); // dummy node
	},

	/**
	 * Complete the html, for the second part of the status message
	 */
	render: function() {
		this.node.className = 'tw_status_' + this.type;
		while (this.target.hasChildNodes()) {
			this.target.removeChild(this.target.firstChild);
		}
		this.target.appendChild(this.stat);
		this.link();
	},
	status: function(status) {
		this.update(status, 'status');
	},
	info: function(status) {
		this.update(status, 'info');
	},
	warn: function(status) {
		this.update(status, 'warn');
	},
	error: function(status) {
		this.update(status, 'error');
	}
};

Morebits.status.info = function(text, status) {
	return new Morebits.status(text, status, 'info');
};

Morebits.status.warn = function(text, status) {
	return new Morebits.status(text, status, 'warn');
};

Morebits.status.error = function(text, status) {
	return new Morebits.status(text, status, 'error');
};

/**
 * Display the user's rationale, comments, etc. back to them after a failure,
 * so that they may re-use it
 * @param {string} comments
 * @param {string} message
 */
Morebits.status.printUserText = function(comments, message) {
	var p = document.createElement('p');
	p.textContent = message;
	var div = document.createElement('div');
	div.className = 'toccolours';
	div.style.marginTop = '0';
	div.style.whiteSpace = 'pre-wrap';
	div.textContent = comments;
	p.appendChild(div);
	Morebits.status.root.appendChild(p);
};



/**
 * **************** Morebits.htmlNode() ****************
 * Simple helper function to create a simple node
 */

Morebits.htmlNode = function (type, content, color) {
	var node = document.createElement(type);
	if (color) {
		node.style.color = color;
	}
	node.appendChild(document.createTextNode(content));
	return node;
};



/**
 * **************** Morebits.checkboxShiftClickSupport() ****************
 * shift-click-support for checkboxes
 * wikibits version (window.addCheckboxClickHandlers) has some restrictions, and
 * doesn't work with checkboxes inside a sortable table, so let's build our own.
 */

Morebits.checkboxShiftClickSupport = function (jQuerySelector, jQueryContext) {
	var lastCheckbox = null;

	function clickHandler(event) {
		var thisCb = this;
		if (event.shiftKey && lastCheckbox !== null) {
			var cbs = $(jQuerySelector, jQueryContext); // can't cache them, obviously, if we want to support resorting
			var index = -1, lastIndex = -1, i;
			for (i = 0; i < cbs.length; i++) {
				if (cbs[i] === thisCb) {
					index = i;
					if (lastIndex > -1) {
						break;
					}
				}
				if (cbs[i] === lastCheckbox) {
					lastIndex = i;
					if (index > -1) {
						break;
					}
				}
			}

			if (index > -1 && lastIndex > -1) {
				// inspired by wikibits
				var endState = thisCb.checked;
				var start, finish;
				if (index < lastIndex) {
					start = index + 1;
					finish = lastIndex;
				} else {
					start = lastIndex;
					finish = index - 1;
				}

				for (i = start; i <= finish; i++) {
					if (cbs[i].checked !== endState) {
						cbs[i].click();
					}
				}
			}
		}
		lastCheckbox = thisCb;
		return true;
	}

	$(jQuerySelector, jQueryContext).click(clickHandler);
};



/** **************** Morebits.batchOperation ****************
 * Iterates over a group of pages and executes a worker function for each.
 *
 * Constructor: Morebits.batchOperation(currentAction)
 *
 * setPageList(wikitext): Sets the list of pages to work on.
 *    It should be an array of page names (strings).
 *
 * setOption(optionName, optionValue): Sets a known option:
 *    - chunkSize (integer): the size of chunks to break the array into (default 50).
 *                           Setting this to a small value (<5) can cause problems.
 *    - preserveIndividualStatusLines (boolean): keep each page's status element visible
 *                                               when worker is complete?  See note below
 *
 * run(worker): Runs the given callback for each page in the list.
 *    The callback must call workerSuccess when succeeding, or workerFailure
 *    when failing.  If using Morebits.wiki.api or Morebits.wiki.page, this is easily
 *    done by passing these two functions as parameters to the methods on those
 *    objects, for instance, page.save(batchOp.workerSuccess, batchOp.workerFailure).
 *    Make sure the methods are called directly if special success/failure cases arise.
 *    If you omit to call these methods, the batch operation will stall after the first
 *    chunk!  Also ensure that either workerSuccess or workerFailure is called no more
 *    than once.
 *
 * If using preserveIndividualStatusLines, you should try to ensure that the
 * workerSuccess callback has access to the page title.  This is no problem for
 * Morebits.wiki.page objects.  But when using the API, please set the
 * |pageName| property on the Morebits.wiki.api object.
 *
 * There are sample batchOperation implementations using Morebits.wiki.page in
 * twinklebatchdelete.js, twinklebatchundelete.js, and twinklebatchprotect.js.
 */

/**
 * @constructor
 * @param {string} [currentAction]
 */
Morebits.batchOperation = function(currentAction) {
	var ctx = {
		// backing fields for public properties
		pageList: null,
		options: {
			chunkSize: 50,
			preserveIndividualStatusLines: false
		},

		// internal counters, etc.
		statusElement: new Morebits.status(currentAction || 'Performing batch operation'),
		worker: null, // function that executes for each item in pageList
		postFinish: null, // function that executes when the whole batch has been processed
		countStarted: 0,
		countFinished: 0,
		countFinishedSuccess: 0,
		currentChunkIndex: -1,
		pageChunks: [],
		running: false
	};

	// shouldn't be needed by external users, but provided anyway for maximum flexibility
	this.getStatusElement = function() {
		return ctx.statusElement;
	};

	/**
	 * Sets the list of pages to work on
	 * @param {String[]} pageList  Array of page names (strings)
	 */
	this.setPageList = function(pageList) {
		ctx.pageList = pageList;
	};

	/**
	 * Sets a known option:
	 * - chunkSize (integer):
	 *        The size of chunks to break the array into (default 50).
	 *        Setting this to a small value (<5) can cause problems.
	 * - preserveIndividualStatusLines (boolean):
	 *        Keep each page's status element visible when worker is complete?
	 */
	this.setOption = function(optionName, optionValue) {
		ctx.options[optionName] = optionValue;
	};

	/**
	 * Runs the first callback for each page in the list.
	 * The callback must call workerSuccess when succeeding, or workerFailure when failing.
	 * Runs the second callback when the whole batch has been processed (optional)
	 * @param {Function} worker
	 * @param {Function} [postFinish]
	 */
	this.run = function(worker, postFinish) {
		if (ctx.running) {
			ctx.statusElement.error('Batch operation is already running');
			return;
		}
		ctx.running = true;

		ctx.worker = worker;
		ctx.postFinish = postFinish;
		ctx.countStarted = 0;
		ctx.countFinished = 0;
		ctx.countFinishedSuccess = 0;
		ctx.currentChunkIndex = -1;
		ctx.pageChunks = [];

		var total = ctx.pageList.length;
		if (!total) {
			ctx.statusElement.info('nothing to do');
			ctx.running = false;
			return;
		}

		// chunk page list into more manageable units
		ctx.pageChunks = Morebits.array.chunk(ctx.pageList, ctx.options.chunkSize);

		// start the process
		Morebits.wiki.addCheckpoint();
		ctx.statusElement.status('0%');
		fnStartNewChunk();
	};

	this.workerSuccess = function(apiobj) {
		// update or remove status line
		if (apiobj && apiobj.getStatusElement) {
			var statelem = apiobj.getStatusElement();
			if (ctx.options.preserveIndividualStatusLines) {
				if (apiobj.getPageName || apiobj.pageName || (apiobj.query && apiobj.query.title)) {
					// we know the page title - display a relevant message
					var pageName = apiobj.getPageName ? apiobj.getPageName() :
						apiobj.pageName || apiobj.query.title;
					var link = document.createElement('a');
					link.setAttribute('href', mw.util.getUrl(pageName));
					link.appendChild(document.createTextNode(pageName));
					statelem.info(['completed (', link, ')']);
				} else {
					// we don't know the page title - just display a generic message
					statelem.info('done');
				}
			} else {
				// remove the status line from display
				statelem.unlink();
			}
		}

		ctx.countFinishedSuccess++;
		fnDoneOne(apiobj);
	};

	this.workerFailure = function(apiobj) {
		fnDoneOne(apiobj);
	};

	// private functions

	var thisProxy = this;

	var fnStartNewChunk = function() {
		var chunk = ctx.pageChunks[++ctx.currentChunkIndex];
		if (!chunk) {
			return;  // done! yay
		}

		// start workers for the current chunk
		ctx.countStarted += chunk.length;
		chunk.forEach(function(page) {
			ctx.worker(page, thisProxy);
		});
	};

	var fnDoneOne = function() {
		ctx.countFinished++;

		// update overall status line
		var total = ctx.pageList.length;
		if (ctx.countFinished === total) {
			var statusString = 'Done (' + ctx.countFinishedSuccess +
				'/' + ctx.countFinished + ' actions completed successfully)';
			if (ctx.countFinishedSuccess < ctx.countFinished) {
				ctx.statusElement.warn(statusString);
			} else {
				ctx.statusElement.info(statusString);
			}
			if (ctx.postFinish) {
				ctx.postFinish();
			}
			Morebits.wiki.removeCheckpoint();
			ctx.running = false;
			return;
		}

		// just for giggles! (well, serious debugging, actually)
		if (ctx.countFinished > total) {
			ctx.statusElement.warn('Done (overshot by ' + (ctx.countFinished - total) + ')');
			Morebits.wiki.removeCheckpoint();
			ctx.running = false;
			return;
		}

		ctx.statusElement.status(parseInt(100 * ctx.countFinished / total, 10) + '%');

		// start a new chunk if we're close enough to the end of the previous chunk, and
		// we haven't already started the next one
		if (ctx.countFinished >= (ctx.countStarted - Math.max(ctx.options.chunkSize / 10, 2)) &&
			Math.floor(ctx.countFinished / ctx.options.chunkSize) > ctx.currentChunkIndex) {
			fnStartNewChunk();
		}
	};
};



/**
 * **************** Morebits.simpleWindow ****************
 * A simple draggable window
 * now a wrapper for jQuery UI's dialog feature
 */

/**
 * @constructor
 * @param {number} width
 * @param {number} height  The maximum allowable height for the content area.
 */
Morebits.simpleWindow = function SimpleWindow(width, height) {
	var content = document.createElement('div');
	this.content = content;
	content.className = 'morebits-dialog-content';
	content.id = 'morebits-dialog-content-' + Math.round(Math.random() * 1e15);

	this.height = height;

	$(this.content).dialog({
		autoOpen: false,
		buttons: { 'Placeholder button': function() {} },
		dialogClass: 'morebits-dialog',
		width: Math.min(parseInt(window.innerWidth, 10), parseInt(width ? width : 800, 10)),
		// give jQuery the given height value (which represents the anticipated height of the dialog) here, so
		// it can position the dialog appropriately
		// the 20 pixels represents adjustment for the extra height of the jQuery dialog "chrome", compared
		// to that of the old SimpleWindow
		height: height + 20,
		close: function(event) {
			// dialogs and their content can be destroyed once closed
			$(event.target).dialog('destroy').remove();
		},
		resizeStart: function() {
			this.scrollbox = $(this).find('.morebits-scrollbox')[0];
			if (this.scrollbox) {
				this.scrollbox.style.maxHeight = 'none';
			}
		},
		resizeEnd: function() {
			this.scrollbox = null;
		},
		resize: function() {
			this.style.maxHeight = '';
			if (this.scrollbox) {
				this.scrollbox.style.width = '';
			}
		}
	});

	var $widget = $(this.content).dialog('widget');

	// add background gradient to titlebar
	var $titlebar = $widget.find('.ui-dialog-titlebar');
	var oldstyle = $titlebar.attr('style');
	$titlebar.attr('style', (oldstyle ? oldstyle : '') + '; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAMAAAB%2FqqA%2BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEhQTFRFr73ZobTPusjdsMHZp7nVwtDhzNbnwM3fu8jdq7vUt8nbxtDkw9DhpbfSvMrfssPZqLvVztbno7bRrr7W1d%2Fs1N7qydXk0NjpkW7Q%2BgAAADVJREFUeNoMwgESQCAAAMGLkEIi%2FP%2BnbnbpdB59app5Vdg0sXAoMZCpGoFbK6ciuy6FX4ABAEyoAef0BXOXAAAAAElFTkSuQmCC) !important;');

	// delete the placeholder button (it's only there so the buttonpane gets created)
	$widget.find('button').each(function(key, value) {
		value.parentNode.removeChild(value);
	});

	// add container for the buttons we add, and the footer links (if any)
	var buttonspan = document.createElement('span');
	buttonspan.className = 'morebits-dialog-buttons';
	var linksspan = document.createElement('span');
	linksspan.className = 'morebits-dialog-footerlinks';
	$widget.find('.ui-dialog-buttonpane').append(buttonspan, linksspan);

	// resize the scrollbox with the dialog, if one is present
	$widget.resizable('option', 'alsoResize', '#' + this.content.id + ' .morebits-scrollbox, #' + this.content.id);
};

Morebits.simpleWindow.prototype = {
	buttons: [],
	height: 600,
	hasFooterLinks: false,
	scriptName: null,

	/**
	 * Focuses the dialog. This might work, or on the contrary, it might not.
	 * @returns {Morebits.simpleWindow}
	 */
	focus: function() {
		$(this.content).dialog('moveToTop');
		return this;
	},

	/**
	 * Closes the dialog. If this is set as an event handler, it will stop the event
	 * from doing anything more.
	 * @returns {Morebits.simpleWindow}
	 */
	close: function(event) {
		if (event) {
			event.preventDefault();
		}
		$(this.content).dialog('close');
		return this;
	},

	/**
	 * Shows the dialog. Calling display() on a dialog that has previously been closed
	 * might work, but it is not guaranteed.
	 * @returns {Morebits.simpleWindow}
	 */
	display: function() {
		if (this.scriptName) {
			var $widget = $(this.content).dialog('widget');
			$widget.find('.morebits-dialog-scriptname').remove();
			var scriptnamespan = document.createElement('span');
			scriptnamespan.className = 'morebits-dialog-scriptname';
			scriptnamespan.textContent = this.scriptName + ' \u00B7 ';  // U+00B7 MIDDLE DOT = &middot;
			$widget.find('.ui-dialog-title').prepend(scriptnamespan);
		}

		var dialog = $(this.content).dialog('open');
		if (window.setupTooltips && window.pg && window.pg.re && window.pg.re.diff) {  // tie in with NAVPOP
			dialog.parent()[0].ranSetupTooltipsAlready = false;
			window.setupTooltips(dialog.parent()[0]);
		}
		this.setHeight(this.height);  // init height algorithm
		return this;
	},

	/**
	 * Sets the dialog title.
	 * @param {string} title
	 * @returns {Morebits.simpleWindow}
	 */
	setTitle: function(title) {
		$(this.content).dialog('option', 'title', title);
		return this;
	},

	/**
	 * Sets the script name, appearing as a prefix to the title to help users determine which
	 * user script is producing which dialog. For instance, Twinkle modules set this to "Twinkle".
	 * @param {string} name
	 * @returns {Morebits.simpleWindow}
	 */
	setScriptName: function(name) {
		this.scriptName = name;
		return this;
	},

	/**
	 * Sets the dialog width.
	 * @param {number} width
	 * @returns {Morebits.simpleWindow}
	 */
	setWidth: function(width) {
		$(this.content).dialog('option', 'width', width);
		return this;
	},

	/**
	 * Sets the dialog's maximum height. The dialog will auto-size to fit its contents,
	 * but the content area will grow no larger than the height given here.
	 * @param {number} height
	 * @returns {Morebits.simpleWindow}
	 */
	setHeight: function(height) {
		this.height = height;

		// from display time onwards, let the browser determine the optimum height,
		// and instead limit the height at the given value
		// note that the given height will exclude the approx. 20px that the jQuery UI
		// chrome has in height in addition to the height of an equivalent "classic"
		// Morebits.simpleWindow
		if (parseInt(getComputedStyle($(this.content).dialog('widget')[0], null).height, 10) > window.innerHeight) {
			$(this.content).dialog('option', 'height', window.innerHeight - 2).dialog('option', 'position', 'top');
		} else {
			$(this.content).dialog('option', 'height', 'auto');
		}
		$(this.content).dialog('widget').find('.morebits-dialog-content')[0].style.maxHeight = parseInt(this.height - 30, 10) + 'px';
		return this;
	},

	/**
	 * Sets the content of the dialog to the given element node, usually from rendering
	 * a Morebits.quickForm.
	 * Re-enumerates the footer buttons, but leaves the footer links as they are.
	 * Be sure to call this at least once before the dialog is displayed...
	 * @param {HTMLElement} content
	 * @returns {Morebits.simpleWindow}
	 */
	setContent: function(content) {
		this.purgeContent();
		this.addContent(content);
		return this;
	},

	/**
	 * Adds the given element node to the dialog content.
	 * @param {HTMLElement} content
	 * @returns {Morebits.simpleWindow}
	 */
	addContent: function(content) {
		this.content.appendChild(content);

		// look for submit buttons in the content, hide them, and add a proxy button to the button pane
		var thisproxy = this;
		$(this.content).find('input[type="submit"], button[type="submit"]').each(function(key, value) {
			value.style.display = 'none';
			var button = document.createElement('button');
			button.textContent = value.hasAttribute('value') ? value.getAttribute('value') : value.textContent ? value.textContent : 'Submit Query';
			// here is an instance of cheap coding, probably a memory-usage hit in using a closure here
			button.addEventListener('click', function() {
				value.click();
			}, false);
			thisproxy.buttons.push(button);
		});
		// remove all buttons from the button pane and re-add them
		if (this.buttons.length > 0) {
			$(this.content).dialog('widget').find('.morebits-dialog-buttons').empty().append(this.buttons)[0].removeAttribute('data-empty');
		} else {
			$(this.content).dialog('widget').find('.morebits-dialog-buttons')[0].setAttribute('data-empty', 'data-empty');  // used by CSS
		}
		return this;
	},

	/**
	 * Removes all contents from the dialog, barring any footer links
	 * @returns {Morebits.simpleWindow}
	 */
	purgeContent: function() {
		this.buttons = [];
		// delete all buttons in the buttonpane
		$(this.content).dialog('widget').find('.morebits-dialog-buttons').empty();

		while (this.content.hasChildNodes()) {
			this.content.removeChild(this.content.firstChild);
		}
		return this;
	},

	/**
	 * Adds a link in the bottom-right corner of the dialog.
	 * This can be used to provide help or policy links.
	 * For example, Twinkle's CSD module adds a link to the CSD policy page,
	 * as well as a link to Twinkle's documentation.
	 * @param {string} text  Link's text content
	 * @param {string} wikiPage  Link target
	 * @returns {Morebits.simpleWindow}
	 */
	addFooterLink: function(text, wikiPage) {
		var $footerlinks = $(this.content).dialog('widget').find('.morebits-dialog-footerlinks');
		if (this.hasFooterLinks) {
			var bullet = document.createElement('span');
			bullet.textContent = ' \u2022 ';  // U+2022 BULLET
			$footerlinks.append(bullet);
		}
		var link = document.createElement('a');
		link.setAttribute('href', mw.util.getUrl(wikiPage));
		link.setAttribute('title', wikiPage);
		link.setAttribute('target', '_blank');
		link.textContent = text;
		$footerlinks.append(link);
		this.hasFooterLinks = true;
		return this;
	},

	/**
	 * Set whether the window should be modal or not.
	 * If set to true, other items on the page will be disabled, i.e., cannot be
	 * interacted with. Modal dialogs create an overlay below the dialog but above
	 * other page elements.
	 * This must be used (if necessary) before calling display()
	 * Default: false
	 * @param {boolean} modal
	 * @returns {Morebits.simpleWindow}
	 */
	setModality: function(modal) {
		$(this.content).dialog('option', 'modal', modal);
		return this;
	}
};

/**
 * Enables or disables all footer buttons on all Morebits.simpleWindows in the current page.
 * This should be called with `false` when the button(s) become irrelevant (e.g. just before
 * Morebits.status.init is called).
 * This is not an instance method so that consumers don't have to keep a reference to the
 * original Morebits.simpleWindow object sitting around somewhere. Anyway, most of the time
 * there will only be one Morebits.simpleWindow open, so this shouldn't matter.
 * @param {boolean} enabled
 */
Morebits.simpleWindow.setButtonsEnabled = function(enabled) {
	$('.morebits-dialog-buttons button').prop('disabled', !enabled);
};


// Twinkle blacklist was removed per consensus at http://en.wikipedia.org/wiki/Wikipedia:Administrators%27_noticeboard/Archive221#New_Twinkle_blacklist_proposal



}(window, document, jQuery)); // End wrap with anonymous function


/**
 * If this script is being executed outside a ResourceLoader context, we add some
 * global assignments for legacy scripts, hopefully these can be removed down the line
 *
 * IMPORTANT NOTE:
 * PLEASE DO NOT USE THESE ALIASES IN NEW CODE!
 * Thanks.
 */

if (typeof arguments === 'undefined') {  // typeof is here for a reason...
	/* global Morebits */
	window.SimpleWindow = Morebits.simpleWindow;
	window.QuickForm = Morebits.quickForm;
	window.Wikipedia = Morebits.wiki;
	window.Status = Morebits.status;
	window.QueryString = Morebits.queryString;
}

// </nowiki>
