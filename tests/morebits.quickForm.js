'use strict';

/**
 * Simple helper to render a quickform element
 *
 * @param data
 */
function renderElement(data) {
	return new Morebits.QuickForm.Element(data).render();
}

describe('quickform', () => {
	const inputConfig = {
		type: 'input',
		label: 'Label',
		name: 'inputname',
		value: 'prefilled value'
	};
	const selectConfig = {
		type: 'select',
		label: 'Select label',
		name: 'selectname',
		list: [
			{ label: 'select label 1', value: 'selectvalue1' },
			{ label: 'select label 2', value: 'selectvalue2' }
		]
	};
	const checkboxListConfig = {
		type: 'checkbox',
		name: 'checkboxlist1',
		list: [
			{ label: 'checkbox 1', value: 'checkval1' },
			{ label: 'checkbox 2', value: 'checkval2', checked: true }
		]
	};
	const checkboxesConfig = {
		type: 'checkbox',
		list: [
			{
				label: 'checkbox 1',
				value: 'checkval1',
				name: 'checkname1',
				checked: true
			},
			{ label: 'checkbox 2', value: 'checkval2', name: 'checkname2' }
		]
	};
	const radiosConfig = {
		type: 'radio',
		name: 'radiolist1',
		list: [
			{
				label: 'radio 1',
				value: 'radioval1',
				name: 'radioname1'
			},
			{
				label: 'radio 2',
				value: 'radioval2',
				name: 'radioname2',
				checked: true
			}
		]
	};
	const textareaConfig = {
		type: 'textarea',
		name: 'textareaname1',
		value: 'textarea prefilled value',
		cols: 4
	};
	const submitConfig = {
		type: 'submit'
	};
	const buttonConfig = {
		type: 'button',
		label: 'button label'
	};

	const getRenderedForm = () => {
		const form = new Morebits.QuickForm(() => {});
		form.append(inputConfig);
		form.append(checkboxesConfig);
		form.append(checkboxListConfig);
		form.append(radiosConfig);
		form.append(textareaConfig);
		form.append(submitConfig);
		form.append(buttonConfig);
		return form.render();
	};

	test('input element', () => {
		expect(renderElement(inputConfig)).toMatchSnapshot();
	});

	test('select element', () => {
		expect(renderElement(selectConfig)).toMatchSnapshot();
	});

	test('checkbox elements', () => {
		expect(renderElement(checkboxListConfig)).toMatchSnapshot();
	});

	test('checkbox elements (with data-single attribute)', () => {
		expect(renderElement(checkboxesConfig)).toMatchSnapshot();
	});

	test('radio elements', () => {
		expect(renderElement(radiosConfig)).toMatchSnapshot();
	});

	test('textarea element', () => {
		expect(renderElement(textareaConfig)).toMatchSnapshot();
	});

	test('submit', () => {
		expect(renderElement(submitConfig)).toMatchSnapshot();
	});

	test('getInputData', () => {
		expect(Morebits.quickForm.getInputData(getRenderedForm())).toMatchSnapshot();
	});

	test('getElements', () => {
		const form = getRenderedForm();
		expect(Morebits.quickForm.getElements(form, 'checkboxlist1')).toMatchSnapshot();
	});

});
