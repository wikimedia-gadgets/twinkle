/** Simple helper to render a quickform element */
function renderElement(data) {
	return new Morebits.quickForm.element(data).render();
}

describe("quickform", () => {
	let inputConfig = {
		type: "input",
		label: "Label",
		name: "inputname",
		value: "prefilled value",
	};
	let selectConfig = {
		type: "select",
		label: "Select label",
		name: "selectname",
		list: [
			{ label: "select label 1", value: "selectvalue1" },
			{ label: "select label 2", value: "selectvalue2" },
		],
	};
	let checkboxListConfig = {
		type: "checkbox",
		name: "checkboxlist1",
		list: [
			{ label: "checkbox 1", value: "checkval1" },
			{ label: "checkbox 2", value: "checkval2", checked: true },
		],
	};
	let checkboxesConfig = {
		type: "checkbox",
		list: [
			{
				label: "checkbox 1",
				value: "checkval1",
				name: "checkname1",
				checked: true,
			},
			{ label: "checkbox 2", value: "checkval2", name: "checkname2" },
		],
	};
	let radiosConfig = {
		type: "radio",
		name: "radiolist1",
		list: [
			{
				label: "radio 1",
				value: "radioval1",
				name: "radioname1",
			},
			{
				label: "radio 2",
				value: "radioval2",
				name: "radioname2",
				checked: true,
			},
		],
	};
	let textareaConfig = {
		type: "textarea",
		name: "textareaname1",
		value: "textarea prefilled value",
		cols: 4,
	};
	let submitConfig = {
		type: "submit",
	};
	let buttonConfig = {
		type: "button",
		label: "button label",
	};

	let getRenderedForm = () => {
		let form = new Morebits.quickForm(function () {});
		form.append(inputConfig);
		form.append(checkboxesConfig);
		form.append(checkboxListConfig);
		form.append(radiosConfig);
		form.append(textareaConfig);
		form.append(submitConfig);
		form.append(buttonConfig);
		return form.render();
	}

	test("input element", () => {
		expect(renderElement(inputConfig)).toMatchSnapshot();
	});

	test("select element", () => {
		expect(renderElement(selectConfig)).toMatchSnapshot();
	});

	test("checkbox elements", () => {
		expect(renderElement(checkboxListConfig)).toMatchSnapshot();
	});

	test("checkbox elements (with data-single attribute)", () => {
		expect(renderElement(checkboxesConfig)).toMatchSnapshot();
	});

	test("radio elements", () => {
		expect(renderElement(radiosConfig)).toMatchSnapshot();
	});

	test("textarea element", () => {
		expect(renderElement(textareaConfig)).toMatchSnapshot();
	});

	test("submit", () => {
		expect(renderElement(submitConfig)).toMatchSnapshot();
	});

	test("getInputData", () => {
		expect(Morebits.quickForm.getInputData(getRenderedForm())).toMatchSnapshot();
	});

	test("getElements", () => {
		let form = getRenderedForm();
		expect(Morebits.quickForm.getElements(form, 'checkboxlist1')).toMatchSnapshot();
	});

});
