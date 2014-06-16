//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleprotect.js: Protect/RPP module
 ****************************************
 * Mode of invocation:     Tab ("Khóa"/"Yêu cầu khóa")
 * Active on:              Non-special pages
 * Config directives in:   TwinkleConfig
 */

// Note: a lot of code in this module is re-used/called by batchprotect.

Twinkle.protect = function twinkleprotect() {
	if ( mw.config.get('wgNamespaceNumber') < 0 ) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.protect.callback, Morebits.userIsInGroup('sysop') ? "Khóa trang" : "Yêu cầu khóa trang", "tw-khóa",
		Morebits.userIsInGroup('sysop') ? "Khóa trang" : "Yêu cầu khóa trang" );
};

Twinkle.protect.callback = function twinkleprotectCallback() {
	Twinkle.protect.protectionLevel = null;

	var Window = new Morebits.simpleWindow( 620, 530 );
	Window.setTitle( Morebits.userIsInGroup( 'sysop' ) ? "Khóa trang, yêu cầu hoặc thêm bản mẫu khóa trang" : "Yêu cầu hoặc thêm bản mẫu khóa trang" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Các bản mẫu khóa trang", "Template:Protection templates" );
	Window.addFooterLink( "Quy định khóa trang", "WP:PROT" );
	Window.addFooterLink( "Trợ giúp Twinkle", "WP:TW/DOC#protect" );

	var form = new Morebits.quickForm( Twinkle.protect.callback.evaluate );
	var actionfield = form.append( {
			type: 'field',
			label: 'Loại tác vụ'
		} );
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		actionfield.append( {
				type: 'radio',
				name: 'actiontype',
				event: Twinkle.protect.callback.changeAction,
				list: [
					{
						label: 'Khóa trang',
						value: 'protect',
						tooltip: 'Thiết lập khóa trang.',
						checked: true
					}
				]
			} );
	}
	actionfield.append( {
			type: 'radio',
			name: 'actiontype',
			event: Twinkle.protect.callback.changeAction,
			list: [
				{
					label: 'Yêu cầu khóa trang',
					value: 'request',
					tooltip: 'Nếu bạn muốn đề nghị khóa trang WP:Khóa trang' + (Morebits.userIsInGroup('sysop') ? ' thay vì bạn có thể tự thực hiện.' : '.'),
					checked: !Morebits.userIsInGroup('sysop')
				},
				{
					label: 'Thêm bản mẫu khóa trang',
					value: 'tag',
					tooltip: 'Nếu bảo quản viên quên thêm bản mẫu khóa trang, hoặc bạn vừa khóa một trang mà chưa thêm bản mẫu, bạn có thể sử dụng tag này ở những trang tương ứng.',
					disabled: mw.config.get('wgArticleId') === 0
				}
			]
		} );

	form.append({ type: 'field', label: 'Mức khóa', name: 'field_preset' });
	form.append({ type: 'field', label: '1', name: 'field1' });
	form.append({ type: 'field', label: '2', name: 'field2' });

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.actiontype[0].dispatchEvent( evt );

	// get current protection level asynchronously
	if (Morebits.userIsInGroup('sysop')) {
		Morebits.wiki.actionCompleted.postfix = false;  // avoid Action: completed notice
		Morebits.status.init($('div[name="currentprot"] span').last()[0]);
	}
	Twinkle.protect.fetchProtectionLevel();
};

// Current protection level in a human-readable format
// (a string, or null if no protection; only filled for sysops)
Twinkle.protect.protectionLevel = null;  
// Contains the current protection level in an object
// Once filled, it will look something like:
// { edit: { level: "sysop", expiry: <some date>, cascade: true }, ... }
Twinkle.protect.currentProtectionLevels = {};

Twinkle.protect.fetchProtectionLevel = function twinkleprotectFetchProtectionLevel() {

	var api = new mw.Api();
	api.get({
		format: 'json',
		indexpageids: true,
		action: 'query',
		prop: 'info|flagged',
		inprop: 'protection',
		titles: mw.config.get('wgPageName')
	})
	.done(function(data){
		var pageid = data.query.pageids[0];
		var page = data.query.pages[pageid];
		var result = [];
		var current = {};

		var updateResult = function(label, level, expiry, cascade) {
			// for sysops, stringify, so they can base their decision on existing protection
			if (Morebits.userIsInGroup('sysop')) {
				var boldnode = document.createElement('b');
				boldnode.textContent = label + ": " + level;
				result.push(boldnode);
				if (expiry === 'infinity') {
					result.push(" (vô hạn) ");
				} else {
					result.push(" (hết hạn khóa " + new Date(expiry).toUTCString() + ") ");
				}
				if (cascade) {
					result.push("(theo tầng) ");
				}
			}
		};

		$.each(page.protection, function( index, protection ) {
			if (protection.type !== "aft") {
				current[protection.type] = {
					level: protection.level,
					expiry: protection.expiry,
					cascade: protection.cascade === ''
				};
				updateResult( Morebits.string.toUpperCaseFirstChar(protection.type), protection.level, protection.expiry, protection.cascade );
			}
		});

		if (page.flagged) {
			current.stabilize = {
				level: page.flagged.protection_level,
				expiry: page.flagged.protection_expiry
			};
			// FlaggedRevision gives bad date
			updateResult( 'Pending Changes', page.flagged.protection_level, page.flagged.protection_expiry, false );
		}

		// show the protection level to sysops
		if (Morebits.userIsInGroup('sysop')) {
			if (!result.length) {
				var boldnode = document.createElement('b');
				boldnode.textContent = "no protection";
				result.push(boldnode);
			}
			Twinkle.protect.protectionLevel = result;
			Morebits.status.init($('div[name="currentprot"] span').last()[0]);
			Morebits.status.info("Mức khóa hiện tại", Twinkle.protect.protectionLevel);
		}

		Twinkle.protect.currentProtectionLevels = current;
	});
};

Twinkle.protect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;
	var isTemplate = mw.config.get("wgNamespaceNumber") === 10 || mw.config.get("wgNamespaceNumber") === 828;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Mức khóa', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Chọn mức khóa:',
					event: Twinkle.protect.callback.changePreset,
					list: (mw.config.get('wgArticleId') ?
						Twinkle.protect.protectionTypes.filter(function(v) {
							return isTemplate || v.label !== 'Template protection';
						}) :
						Twinkle.protect.protectionTypesCreate)
				});

			field2 = new Morebits.quickForm.element({ type: 'field', label: 'Các tùy chọn khóa', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			// for existing pages
			if (mw.config.get('wgArticleId')) {
				field2.append({
						type: 'checkbox',
						name: 'editmodify',
						event: Twinkle.protect.formevents.editmodify,
						list: [
							{
								label: 'Thay đổi mức khóa sửa đổi',
								value: 'editmodify',
								tooltip: 'Nếu tắt chức năng này, mức khóa sửa đổi và thời hạn khóa sẽ được để yên.',
								checked: true
							}
						]
					});
				var editlevel = field2.append({
						type: 'select',
						name: 'editlevel',
						label: 'Khóa sửa đổi:',
						event: Twinkle.protect.formevents.editlevel
					});
				editlevel.append({
						type: 'option',
						label: 'Tất cả',
						value: 'all'
					});
				editlevel.append({
						type: 'option',
						label: 'Thành viên tự xác nhận',
						value: 'autoconfirmed'
					});
				if (isTemplate) {
					editlevel.append({
							type: 'option',
							label: 'Template editor',
							value: 'templateeditor'
						});
				}
				editlevel.append({
						type: 'option',
						label: 'Bảo quản viên',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'editexpiry',
						label: 'Hết hạn:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 giờ', value: '1 hour' },
							{ label: '2 giờ', value: '2 hours' },
							{ label: '3 giờ', value: '3 hours' },
							{ label: '6 giờ', value: '6 hours' },
							{ label: '12 giờ', value: '12 hours' },
							{ label: '1 ngày', value: '1 day' },
							{ label: '2 ngày', selected: true, value: '2 days' },
							{ label: '3 ngày', value: '3 days' },
							{ label: '4 ngày', value: '4 days' },
							{ label: '1 tuần', value: '1 week' },
							{ label: '2 tuần', value: '2 weeks' },
							{ label: '1 tháng', value: '1 month' },
							{ label: '2 tháng', value: '2 months' },
							{ label: '3 tháng', value: '3 months' },
							{ label: '1 năm', value: '1 year' },
							{ label: 'vô hạn', value:'indefinite' },
							{ label: 'Khác…', value: 'custom' }
						]
					});
				field2.append({
						type: 'checkbox',
						name: 'movemodify',
						event: Twinkle.protect.formevents.movemodify,
						list: [
							{
								label: 'Thay đổi mức khóa di chuyển',
								value: 'movemodify',
								tooltip: 'Nếu tắt chức năng này, mức khóa di chuyển và ngày hết hạn sẽ được để yên.',
								checked: true
							}
						]
					});
				var movelevel = field2.append({
						type: 'select',
						name: 'movelevel',
						label: 'Khóa di chuyển:',
						event: Twinkle.protect.formevents.movelevel
					});
				movelevel.append({
						type: 'option',
						label: 'Tất cả',
						value: 'all'
					});
				movelevel.append({
						type: 'option',
						label: 'Thành viên tự xác nhận',
						value: 'autoconfirmed'
					});
				if (isTemplate) {
					movelevel.append({
							type: 'option',
							label: 'Template editor',
							value: 'templateeditor'
						});
				}
				movelevel.append({
						type: 'option',
						label: 'Bảo quản viên',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'moveexpiry',
						label: 'Hết hạn:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 giờ', value: '1 hour' },
							{ label: '2 giờ', value: '2 hours' },
							{ label: '3 giờ', value: '3 hours' },
							{ label: '6 giờ', value: '6 hours' },
							{ label: '12 giờ', value: '12 hours' },
							{ label: '1 ngày', value: '1 day' },
							{ label: '2 ngày', value: '2 days' },
							{ label: '3 ngày', value: '3 days' },
							{ label: '4 ngày', value: '4 days' },
							{ label: '1 tuần', value: '1 week' },
							{ label: '2 tuần', value: '2 weeks' },
							{ label: '1 tháng', value: '1 month' },
							{ label: '2 tháng', value: '2 months' },
							{ label: '3 tháng', value: '3 months' },
							{ label: '1 năm', value: '1 year' },
							{ label: 'vô hạn', selected: true, value:'indefinite' },
							{ label: 'Khác…', value: 'custom' }
						]
					});
				field2.append({
						type: 'checkbox',
						name: 'pcmodify',
						event: Twinkle.protect.formevents.pcmodify,
						list: [
							{
								label: 'Modify pending changes protection',
								value: 'pcmodify',
								tooltip: 'If this is turned off, the pending changes level, and expiry time, will be left as is.',
								checked: true
							}
						]
					});
				//var pclevel = field2.append({
				//		type: 'select',
				//		name: 'pclevel',
				//		label: 'Pending changes:',
				//		event: Twinkle.protect.formevents.pclevel
				//	});
				var pclevel = field2.append({
						type: 'option',
						label: 'None',
						value: 'none'
					});
				pclevel.append({
						type: 'option',
						label: 'Level 1',
						value: 'autoconfirmed',
						selected: true
					});
				pclevel.append({
						type: 'option',
						label: 'Level 2 (do not use)',
						value: 'review'
					});
				field2.append({
						type: 'select',
						name: 'pcexpiry',
						label: 'Hết hạn:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 giờ', value: '1 hour' },
							{ label: '2 giờ', value: '2 hours' },
							{ label: '3 giờ', value: '3 hours' },
							{ label: '6 giờ', value: '6 hours' },
							{ label: '12 giờ', value: '12 hours' },
							{ label: '1 ngày', value: '1 day' },
							{ label: '2 ngày', value: '2 days' },
							{ label: '3 ngày', value: '3 days' },
							{ label: '4 ngày', value: '4 days' },
							{ label: '1 tuần', value: '1 week' },
							{ label: '2 tuần', value: '2 weeks' },
							{ label: '1 tháng', selected: true, value: '1 month' },
							{ label: '2 tháng', value: '2 months' },
							{ label: '3 tháng', value: '3 months' },
							{ label: '1 năm', value: '1 year' },
							{ label: 'vô hạn', value:'indefinite' },
							{ label: 'Khác…', value: 'custom' }
						]
					});
			} else {  // for non-existing pages
				var createlevel = field2.append({
						type: 'select',
						name: 'createlevel',
						label: 'Khóa tạo trang:',
						event: Twinkle.protect.formevents.createlevel
					});
				createlevel.append({
						type: 'option',
						label: 'Tất cả',
						value: 'all'
					});
				createlevel.append({
						type: 'option',
						label: 'Thành viên tự xác nhận',
						value: 'autoconfirmed'
					});
				if (isTemplate) {
					createlevel.append({
							type: 'option',
							label: 'Template editor',
							value: 'templateeditor'
						});
				}
				createlevel.append({
						type: 'option',
						label: 'Bảo quản viên',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'createexpiry',
						label: 'Hết hạn:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 giờ', value: '1 hour' },
							{ label: '2 giờ', value: '2 hours' },
							{ label: '3 giờ', value: '3 hours' },
							{ label: '6 giờ', value: '6 hours' },
							{ label: '12 giờ', value: '12 hours' },
							{ label: '1 ngày', value: '1 day' },
							{ label: '2 ngày', value: '2 days' },
							{ label: '3 ngày', value: '3 days' },
							{ label: '4 ngày', value: '4 days' },
							{ label: '1 tuần', value: '1 week' },
							{ label: '2 tuần', value: '2 weeks' },
							{ label: '1 tháng', value: '1 month' },
							{ label: '2 tháng', value: '2 months' },
							{ label: '3 tháng', value: '3 months' },
							{ label: '1 năm', value: '1 year' },
							{ label: 'vô hạn', selected: true, value: 'indefinite' },
							{ label: 'Khác…', value: 'custom' }
						]
					});
			}
			field2.append({
					type: 'textarea',
					name: 'protectReason',
					label: 'Lý do (nhật trình khóa):'
				});
			if (!mw.config.get('wgArticleId')) {  // tagging isn't relevant for non-existing pages
				break;
			}
			/* falls through */
		case 'tag':
			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Tùy chọn', name: 'field1' });
			field1.append( {
					type: 'select',
					name: 'tagtype',
					label: 'Chọn bản mẫu khóa:',
					list: Twinkle.protect.protectionTags,
					event: Twinkle.protect.formevents.tagtype
				} );
			field1.append( {
					type: 'checkbox',
					list: [
						{
							name: 'small',
							label: 'Biểu tượng (small=yes)',
							tooltip: 'Sẽ sử dụng bản mẫu có thông số mở rộng |small=yes, và chỉ thể hiện nó dạng ổ khóa nhỏ bên trên góc phải',
							checked: true
						},
						{
							name: 'noinclude',
							label: 'Để bản mẫu trong dấu  <noinclude>',
							tooltip: 'Sẽ đặt bản mẫu trong mã &lt;noinclude&gt; tức không nhúng',
							checked: (mw.config.get('wgNamespaceNumber') === 10)
						}
					]
				} );
			break;

		case 'request':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Hình thức khóa', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Hình thức và lý do:',
					event: Twinkle.protect.callback.changePreset,
					list: (mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate)
				});

			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Tùy chọn', name: 'field1' });
			field1.append( {
					type: 'select',
					name: 'expiry',
					label: 'Thời gian: ',
					list: [
						{ label: 'Tạm thời', value: 'temporary' },
						{ label: 'Vô hạn', value: 'indefinite' },
						{ label: '', selected: true, value: '' }
					]
				} );
			field1.append({
					type: 'textarea',
					name: 'reason',
					label: 'Lý do: '
				});
			break;
		default:
			alert("Something's afoot in twinkleprotect");
			break;
	}

	var oldfield;
	if (field_preset) {
		oldfield = $(e.target.form).find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field_preset"]').css('display', 'none');
	}
	if (field1) {
		oldfield = $(e.target.form).find('fieldset[name="field1"]')[0];
		oldfield.parentNode.replaceChild(field1.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field1"]').css('display', 'none');
	}
	if (field2) {
		oldfield = $(e.target.form).find('fieldset[name="field2"]')[0];
		oldfield.parentNode.replaceChild(field2.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field2"]').css('display', 'none');
	}

	if (e.target.values === 'protect') {
		// fake a change event on the preset dropdown
		var evt = document.createEvent( "Event" );
		evt.initEvent( 'change', true, true );
		e.target.form.category.dispatchEvent( evt );

		// re-add protection level text, if it's available
		if (Twinkle.protect.protectionLevel) {
			Morebits.status.init($('div[name="currentprot"] span').last()[0]);
			Morebits.status.info("Mức khóa hiện tại", Twinkle.protect.protectionLevel);
		}

		// reduce vertical height of dialog
		$(e.target.form).find('fieldset[name="field2"] select').parent().css({ display: 'inline-block', marginRight: '0.5em' });
	}
};

Twinkle.protect.formevents = {
	editmodify: function twinkleprotectFormEditmodifyEvent(e) {
		e.target.form.editlevel.disabled = !e.target.checked;
		e.target.form.editexpiry.disabled = !e.target.checked || (e.target.form.editlevel.value === 'all');
		e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	editlevel: function twinkleprotectFormEditlevelEvent(e) {
		e.target.form.editexpiry.disabled = (e.target.value === 'all');
	},
	movemodify: function twinkleprotectFormMovemodifyEvent(e) {
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	movelevel: function twinkleprotectFormMovelevelEvent(e) {
		e.target.form.moveexpiry.disabled = (e.target.value === 'all');
	},
	pcmodify: function twinkleprotectFormPcmodifyEvent(e) {
		e.target.form.pclevel.disabled = !e.target.checked;
		e.target.form.pcexpiry.disabled = !e.target.checked || (e.target.form.pclevel.value === 'none');
		e.target.form.pclevel.style.color = e.target.form.pcexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	pclevel: function twinkleprotectFormPclevelEvent(e) {
		e.target.form.pcexpiry.disabled = (e.target.value === 'none');
	},
	createlevel: function twinkleprotectFormCreatelevelEvent(e) {
		e.target.form.createexpiry.disabled = (e.target.value === 'all');
	},
	tagtype: function twinkleprotectFormTagtypeEvent(e) {
		e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
	}
};

Twinkle.protect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('Enter a custom expiry time.  \nYou can use relative times, like "1 minute" or "19 days", or absolute timestamps, "yyyymmddhhmm" (e.g. "200602011405" is Feb 1, 2006, at 14:05 UTC).', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	} else {
		target.selectedIndex = 0;
	}
};

Twinkle.protect.protectionTypes = [
	{ label: 'Mở khóa', value: 'unprotect' },
	{
		label: 'Khóa hoàn toàn',
		list: [
			{ label: 'Chung (hoàn toàn)', value: 'pp-protected' },
			{ label: 'Tranh cãi/bút chiến (hoàn toàn)', value: 'pp-dispute' },
			{ label: 'Phá hoại liên tục (hoàn toàn)', value: 'pp-vandalism' },
			{ label: 'Bản mẫu được xem nhiều (hoàn toàn)', value: 'pp-template' },
			{ label: 'Trang thảo luận của thành viên bị cấm (hoàn toàn)', value: 'pp-usertalk' }
		]
	},
	//{
	//	label: 'Template protection',
	//	list: [
	//		{ label: 'Highly visible template (TE)', value: 'pp-template' }
	//	]
	//},
	{
		label: 'Khóa nửa',
		list: [
			{ label: 'Chung (bán khóa)', value: 'pp-semi-protected' },
			{ label: 'Phá hoại liên tục)', selected: true, value: 'pp-semi-vandalism' },
			{ label: 'Vi phạm chính sách về người còn sống)', value: 'pp-semi-blp' },
			{ label: 'Rối (bán khóa)', value: 'pp-semi-sock' },
			{ label: 'Bản mẫu được xem nhiều (bán khóa)', value: 'pp-semi-template' },
			{ label: 'Trang thảo luận của thành viên bị cấm (bán khóa)', value: 'pp-semi-usertalk' }
		]
	},
	//{
	//	label: 'Pending changes',
	//	list: [
	//		{ label: 'Generic (PC)', value: 'pp-pc-protected' },
	//		{ label: 'Persistent vandalism (PC)', value: 'pp-pc-vandalism' },
	//		{ label: 'BLP policy violations (PC)', value: 'pp-pc-blp' }
	//	]
	//},
	{
		label: 'Khóa di chuyển',
		list: [
			{ label: 'Chung (di chuyển)', value: 'pp-move' },
			{ label: 'Bút chiến (di chuyển)', value: 'pp-move-dispute' },
			{ label: 'Phá hoại di chuyển trang)', value: 'pp-move-vandalism' },
			{ label: 'Trang được nhiều người xem (di chuyển)', value: 'pp-move-indef' }
		]
	}
];

Twinkle.protect.protectionTypesCreate = [
	{ label: 'Mở khóa', value: 'unprotect' },
	{
		label: 'Khóa tạo trang',
		list: [
			{ label: 'Chung ({{pp-create}})', value: 'pp-create' },
			{ label: 'Tên công kích', value: 'pp-create-offensive' },
			{ label: 'Liên tục tạo lại', selected: true, value: 'pp-create-salt' },
			{ label: 'Về người còn sống vừa bị xóa', value: 'pp-create-blp' }
		]
	}
];

// A page with both regular and PC protection will be assigned its regular
// protection weight plus 2 (for PC1) or 7 (for PC2)
Twinkle.protect.protectionWeight = {
	sysop: 30,
	templateeditor: 20,
	flaggedrevs_review: 15,  // Pending Changes level 2 protection alone
	autoconfirmed: 10,
	flaggedrevs_autoconfirmed: 5,  // Pending Changes level 1 protection alone
	all: 0,
	flaggedrevs_none: 0  // just in case
};

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
// Also note: stabilize = Pending Changes level
Twinkle.protect.protectionPresetsInfo = {
	'pp-protected': {
		edit: 'sysop',
		move: 'sysop',
		reason: null
	},
	'pp-dispute': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:KHOA#Tranh cãi về nội dung|Tranh cãi về nội dung]]'
	},
	'pp-vandalism': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:PH|Phá hoại]] liên tục'
	},
	'pp-usertalk': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:KHOA#Khóa trang thảo luận|Trang thảo luận của thành viên bị cấm]]'
	},
	'pp-template': {
		//edit: 'templateeditor',
		//move: 'templateeditor',
		edit: 'sysop',
		move: 'sysop',
		reason: 'Bản mẫu được xem nhiều'
	},
	'pp-semi-vandalism': {
		edit: 'autoconfirmed',
		reason: '[[WP:PH|Phá hoại]] liên tục',
		template: 'pp-vandalism'
	},
	'pp-semi-blp': {
		edit: 'autoconfirmed',
		reason: 'Vi phạm [[Wikipedia:Tiểu sử người đang sống|quy định về tiểu sử người đang sống]]',
		template: 'pp-blp'
	},
	'pp-semi-usertalk': {
		edit: 'autoconfirmed',
		move: 'sysop',
		reason: '[[WP:KHOA#Khóa trang thảo luận|Trang thảo luận của thành viên bị cấm]]',
		template: 'pp-usertalk'
	},
	'pp-semi-template': {  // removed for now
		edit: 'autoconfirmed',
		move: 'sysop',
		reason: 'Bản mẫu được xem nhiều',
		template: 'pp-template'
	},
	'pp-semi-sock': {
		edit: 'autoconfirmed',
		reason: '[[WP:ROI|Rối]]',
		template: 'pp-sock'
	},
	'pp-semi-protected': {
		edit: 'autoconfirmed',
		reason: null,
		template: 'pp-protected'
	},
	'pp-pc-vandalism': {
		stabilize: 'autoconfirmed',  // stabilize = Pending Changes
		reason: 'Persistent [[WP:Vandalism|vandalism]]',
		template: 'pp-pc1'
	},
	'pp-pc-blp': {
		stabilize: 'autoconfirmed',
		reason: 'Violations of the [[WP:BLP|biographies of living persons policy]]',
		template: 'pp-pc1'
	},
	'pp-pc-protected': {
		stabilize: 'autoconfirmed',
		reason: null,
		template: 'pp-pc1'
	},
	'pp-move': {
		move: 'sysop',
		reason: null
	},
	'pp-move-dispute': {
		move: 'sysop',
		reason: '[[WP:KHOA#Khóa khả năng di chuyển|Bút chiến di chuyển trang]]'
	},
	'pp-move-vandalism': {
		move: 'sysop',
		reason: '[[WP:KHOA#Khóa khả năng di chuyển|Bút chiến di chuyển trang]]'
	},
	'pp-move-indef': {
		move: 'sysop',
		reason: '[[WP:KHOA#Khóa khả năng di chuyển|Trang được xem nhiều]]'
	},
	'unprotect': {
		edit: 'all',
		move: 'all',
		stabilize: 'none',
		create: 'all',
		reason: null,
		template: 'none'
	},
	'pp-create-offensive': {
		create: 'sysop',
		reason: '[[WP:KHOA#Khóa khả năng tạo bài|Tên công kích]]'
	},
	'pp-create-salt': {
		create: 'sysop',
		reason: '[[WP:KHOA#Khóa khả năng tạo bài|Liên tục tạo lại]]'
	},
	'pp-create-blp': {
		create: 'sysop',
		reason: '[[WP:BLPDEL|Recently deleted BLP]]'
	},
	'pp-create': {
		create: 'sysop',
		reason: '{{pp-create}}'
	}
};

Twinkle.protect.protectionTags = [
	{
		label: 'Không có (xóa các bãn mẫu khóa trang hiện hữu)',
		value: 'none'
	},
	{
		label: 'Không có (đừng dời các bản mẫu khóa trang)',
		value: 'noop'
	},
	{
		label: 'Các bản mẫu khóa',
		list: [
			{ label: '{{pp-vandalism}}: phá hoại', value: 'pp-vandalism' },
			{ label: '{{pp-dispute}}: bút chiến', value: 'pp-dispute', selected: true },
			{ label: '{{pp-blp}}: vi phạm về tiểu sử người còn sống', value: 'pp-blp' },
			{ label: '{{pp-sock}}: rối', value: 'pp-sock' },
			{ label: '{{pp-template}}: bản mẫu dùng nhiều', value: 'pp-template' },
			{ label: '{{pp-usertalk}}: trang thảo luận thành viên bị cấm', value: 'pp-usertalk' },
			{ label: '{{pp-protected}}: khóa chung', value: 'pp-protected' },
			{ label: '{{pp-semi-indef}}: bán khóa dài hạn', value: 'pp-semi-indef' }
		]
	},
	//{
	//	label: 'Pending changes templates',
	//	list: [
	//		{ label: '{{pp-pc1}}: pending changes level 1', value: 'pp-pc1' }
	//	]
	//},
	{
		label: 'Các bản mẫu khóa di chuyển',
		list: [
			{ label: '{{pp-move-dispute}}: bút chiến', value: 'pp-move-dispute' },
			{ label: '{{pp-move-vandalism}}: phá hoại di chuyển trang', value: 'pp-move-vandalism' },
			{ label: '{{pp-move-indef}}: khóa dài hạn', value: 'pp-move-indef' },
			{ label: '{{pp-move}}: khác', value: 'pp-move' }
		]
	}
];

Twinkle.protect.callback.changePreset = function twinkleprotectCallbackChangePreset(e) {
	var form = e.target.form;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if (actiontype === 'protect') {  // actually protecting the page
		var item = Twinkle.protect.protectionPresetsInfo[form.category.value];
		if (mw.config.get('wgArticleId')) {
			if (item.edit) {
				form.editmodify.checked = true;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
				form.editlevel.value = item.edit;
				Twinkle.protect.formevents.editlevel({ target: form.editlevel });
			} else {
				form.editmodify.checked = false;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
			}

			if (item.move) {
				form.movemodify.checked = true;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
				form.movelevel.value = item.move;
				Twinkle.protect.formevents.movelevel({ target: form.movelevel });
			} else {
				form.movemodify.checked = false;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
			}

			if (item.stabilize) {
				form.pcmodify.checked = true;
				Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
				form.pclevel.value = item.stabilize;
				Twinkle.protect.formevents.pclevel({ target: form.pclevel });
			} else {
				form.pcmodify.checked = false;
				Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
			}
		} else {
			if (item.create) {
				form.createlevel.value = item.create;
				Twinkle.protect.formevents.createlevel({ target: form.createlevel });
			}
		}

		var reasonField = (actiontype === "protect" ? form.protectReason : form.reason);
		if (item.reason) {
			reasonField.value = item.reason;
		} else {
			reasonField.value = '';
		}

		// sort out tagging options
		if (mw.config.get('wgArticleId')) {
			if( form.category.value === 'unprotect' ) {
				form.tagtype.value = 'none';
			} else {
				form.tagtype.value = (item.template ? item.template : form.category.value);
			}
			Twinkle.protect.formevents.tagtype({ target: form.tagtype });

			if( /template/.test( form.category.value ) ) {
				form.noinclude.checked = true;
				form.editexpiry.value = form.moveexpiry.value = form.pcexpiry.value = "indefinite";
			} else {
				form.noinclude.checked = false;
			}
		}

	} else {  // RPP request
		if( form.category.value === 'unprotect' ) {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.disabled = false;
		}
	}
};

Twinkle.protect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	var tagparams;
	if( actiontype === 'tag' || (actiontype === 'protect' && mw.config.get('wgArticleId')) ) {
		tagparams = {
			tag: form.tagtype.value,
			reason: ((form.tagtype.value === 'pp-protected' || form.tagtype.value === 'pp-semi-protected' || form.tagtype.value === 'pp-move') && form.protectReason) ? form.protectReason.value : null,
			expiry: (actiontype === 'protect') ?
				(form.editmodify.checked ? form.editexpiry.value :
					(form.movemodify.checked ? form.moveexpiry.value :
						(form.pcmodify.checked ? form.pcexpiry.value : null)
					)
				) : null,
			small: form.small.checked,
			noinclude: form.noinclude.checked
		};
	}

	switch (actiontype) {
		case 'protect':
			// protect the page

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = "Protection complete";

			var statusInited = false;
			var thispage;

			var allDone = function twinkleprotectCallbackAllDone() {
				if (thispage) {
					thispage.getStatusElement().info("done");
				}
				if (tagparams) {
					Twinkle.protect.callbacks.taggingPageInitial(tagparams);
				}
			};

			var protectIt = function twinkleprotectCallbackProtectIt(next) {
				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), "Protecting page");
				if (mw.config.get('wgArticleId')) {
					if (form.editmodify.checked) {
						thispage.setEditProtection(form.editlevel.value, form.editexpiry.value);
					}
					if (form.movemodify.checked) {
						thispage.setMoveProtection(form.movelevel.value, form.moveexpiry.value);
					}
				} else {
					thispage.setCreateProtection(form.createlevel.value, form.createexpiry.value);
					thispage.setWatchlist(false);
				}

				if (form.protectReason.value) {
					thispage.setEditSummary(form.protectReason.value);
				} else {
					alert("Bạn phải điền vào lý do khóa trang, nó sẽ được ghi vào nhật trình khóa.");
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled( false );
					Morebits.status.init( form );
					statusInited = true;
				}

				thispage.protect(next);
			};

			var stabilizeIt = function twinkleprotectCallbackStabilizeIt() {
				if (thispage) {
					thispage.getStatusElement().info("done");
				}

				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), "Applying pending changes protection");
				thispage.setFlaggedRevs(form.pclevel.value, form.pcexpiry.value);

				if (form.protectReason.value) {
					thispage.setEditSummary(form.protectReason.value);
				} else {
					alert("Bạn phải điền vào lý do khóa trang, nó sẽ được ghi vào nhật trình khóa.");
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.stabilize(allDone);
			};

			if ((form.editmodify && form.editmodify.checked) || (form.movemodify && form.movemodify.checked) ||
				!mw.config.get('wgArticleId')) {
				if (form.pcmodify && form.pcmodify.checked) {
					protectIt(stabilizeIt);
				} else {
					protectIt(allDone);
				}
			} else if (form.pcmodify && form.pcmodify.checked) {
				stabilizeIt();
			} else {
				alert("Please give Twinkle something to do! \nIf you just want to tag the page, you can choose the 'Tag page with protection template' option at the top.");
			}

			break;

		case 'tag':
			// apply a protection template

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.followRedirect = false;
			Morebits.wiki.actionCompleted.notice = "Thêm thông báo hoàn tất";

			Twinkle.protect.callbacks.taggingPageInitial(tagparams);
			break;

		case 'request':
			// file request at RPP
			var typename, typereason;
			switch( form.category.value ) {
				case 'pp-dispute':
				case 'pp-vandalism':
				case 'pp-usertalk':
				case 'pp-protected':
					typename = 'full protection';
					break;
				case 'pp-template':
					typename = 'template protection';
					break;
				case 'pp-semi-vandalism':
				case 'pp-semi-usertalk':
				case 'pp-semi-sock':
				case 'pp-semi-blp':
				case 'pp-semi-protected':
					typename = 'semi-protection';
					break;
				case 'pp-pc-vandalism':
				case 'pp-pc-blp':
				case 'pp-pc-protected':
					typename = 'pending changes';
					break;
				case 'pp-move':
				case 'pp-move-dispute':
				case 'pp-move-indef':
				case 'pp-move-vandalism':
					typename = 'move protection';
					break;
				case 'pp-create':
				case 'pp-create-offensive':
				case 'pp-create-blp':
				case 'pp-create-salt':
					typename = 'create protection';
					break;
				case 'unprotect':
					/* falls through */
				default:
					typename = 'unprotection';
					break;
			}
			switch (form.category.value) {
				case 'pp-dispute':
					typereason = 'Content dispute/edit warring';
					break;
				case 'pp-vandalism':
				case 'pp-semi-vandalism':
				case 'pp-pc-vandalism':
					typereason = 'Persistent vandalism';
					break;
				case 'pp-template':
					typereason = 'Highly visible template';
					break;
				case 'pp-usertalk':
				case 'pp-semi-usertalk':
					typereason = 'Inappropriate use of user talk page while blocked';
					break;
				case 'pp-semi-sock':
					typereason = 'Persistent sockpuppetry';
					break;
				case 'pp-semi-blp':
				case 'pp-pc-blp':
					typereason = '[[WP:BLP|BLP]] policy violations';
					break;
				case 'pp-move-dispute':
					typereason = 'Page title dispute/move warring';
					break;
				case 'pp-move-vandalism':
					typereason = 'Page-move vandalism';
					break;
				case 'pp-move-indef':
					typereason = 'Highly visible page';
					break;
				case 'pp-create-offensive':
					typereason = 'Offensive name';
					break;
				case 'pp-create-blp':
					typereason = 'Recently deleted [[WP:BLP|BLP]]';
					break;
				case 'pp-create-salt':
					typereason = 'Repeatedly recreated';
					break;
				default:
					typereason = '';
					break;
			}

			var reason = typereason;
			if( form.reason.value !== '') {
				if ( typereason !== '' ) {
					reason += "\u00A0\u2013 ";  // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
				}
				reason += form.reason.value;
			}
			if( reason !== '' && reason.charAt( reason.length - 1 ) !== '.' ) {
				reason += '.';
			}

			var rppparams = {
				reason: reason,
				typename: typename,
				category: form.category.value,
				expiry: form.expiry.value
			};

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			var rppName = 'Wikipedia:Requests for page protection';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = rppName;
			Morebits.wiki.actionCompleted.notice = "Đề xuất hoàn tất, chuyển đến trang thảo luận";

			var rppPage = new Morebits.wiki.page( rppName, 'Yêu cầu khóa trang');
			rppPage.setFollowRedirect( true );
			rppPage.setCallbackParameters( rppparams );
			rppPage.load( Twinkle.protect.callbacks.fileRequest );
			break;
		default:
			alert("khóa trang bằng twinkle: không rõ tác vụ");
			break;
	}
};

Twinkle.protect.callbacks = {
	taggingPageInitial: function( tagparams ) {
		if (tagparams.tag === 'noop') {
			Morebits.status.info("Gắn bản mẫu khóa", "nothing to do");
			return;
		}

		var protectedPage = new Morebits.wiki.page( mw.config.get('wgPageName'), 'Tagging page');
		protectedPage.setCallbackParameters( tagparams );
		protectedPage.load( Twinkle.protect.callbacks.taggingPage );
	},
	taggingPage: function( protectedPage ) {
		var params = protectedPage.getCallbackParameters();
		var text = protectedPage.getPageText();
		var tag, summary;

		var oldtag_re = /\s*(?:<noinclude>)?\s*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;
		var re_result = oldtag_re.exec(text);
		if (re_result) {
			if (confirm("{{" + re_result[1] + "}} tồn tại trên trang này \nChọn OK để xóa bản mẫu, hoặc chọn Hủy bỏ để giữ nó lại.")) {
				text = text.replace( oldtag_re, '' );
			}
		}

		if ( params.tag !== 'none' ) {
			tag = params.tag;
			if( params.reason ) {
				tag += '|reason=' + params.reason;
			}
			if( ['indefinite', 'infinite', 'never', null].indexOf(params.expiry) === -1 ) {
				tag += '|expiry={{subst:#time:j F Y|' + (/^\s*\d+\s*$/.exec(params.expiry) ? params.expiry : '+' + params.expiry) + '}}';
			}
			if( params.small ) {
				tag += '|small=yes';
			}
		}

		if( params.tag === 'none' ) {
			summary = 'Dời bản mẫu khóa trang' + Twinkle.getPref('summaryAd');
		} else {
			if( params.noinclude ) {
				text = "<noinclude>{{" + tag + "}}</noinclude>" + text;
			} else if( Morebits.wiki.isPageRedirect() ) {
				text = text + "\n{{" + tag + "}}";
			} else {
				text = "{{" + tag + "}}\n" + text;
			}
			summary = "Thêm {{" + params.tag + "}}" + Twinkle.getPref('summaryAd');
		}

		protectedPage.setEditSummary( summary );
		protectedPage.setPageText( text );
		protectedPage.setCreateOption( 'nocreate' );
		protectedPage.suppressProtectWarning(); // no need to let admins know they are editing through protection
		protectedPage.save();
	},

	fileRequest: function( rppPage ) {

		var params = rppPage.getCallbackParameters();
		var text = rppPage.getPageText();
		var statusElement = rppPage.getStatusElement();

		var ns2tag = {
			'0': 'la',
			'1': 'lat',
			'2': 'lu',
			'3': 'lut',
			'4': 'lw',
			'5': 'lwt',
			'6': 'lf',
			'7': 'lft',
			'8': 'lm',
			'9': 'lmt',
			'10': 'lt',
			'11': 'ltt',
			'12': 'lh',
			'13': 'lht',
			'14': 'lc',
			'15': 'lct',
			'100': 'lp',
			'101': 'lpt',
			'108': 'lb',
			'109': 'lbt',
			'118': 'ld',
			'119': 'ldt',
			'710': 'lttxt',
			'711': 'lttxtt',
			'828': 'lmd',
			'829': 'lmdt'
		};

		var linkTemplate = ns2tag[ mw.config.get('wgNamespaceNumber') ];
		// support other namespaces like TimedText
		// (this could support talk spaces better, but doesn't seem worth it)
		if (!linkTemplate) {
			linkTemplate = 'ln|' + Morebits.pageNameNorm.substring(0, Morebits.pageNameNorm.indexOf(':'));
		}

		var rppRe = new RegExp( '====\\s*\\{\\{\\s*' + linkTemplate + '\\s*\\|\\s*' + RegExp.escape( mw.config.get('wgTitle'), true ) + '\\s*\\}\\}\\s*====', 'm' );
		var tag = rppRe.exec( text );

		var rppLink = document.createElement('a');
		rppLink.setAttribute('href', mw.util.getUrl(rppPage.getPageName()) );
		rppLink.appendChild(document.createTextNode(rppPage.getPageName()));

		if ( tag ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}

		var newtag = '==== {{' + linkTemplate + '|' + mw.config.get('wgTitle') + '}} ====' + "\n";
		if( ( new RegExp( '^' + RegExp.escape( newtag ).replace( /\s+/g, '\\s*' ), 'm' ) ).test( text ) ) {
			statusElement.error( [ 'There is already a protection request for this page at ', rppLink, ', aborting.' ] );
			return;
		}

		var words;
		switch( params.expiry ) {
		case 'temporary':
			words = "Temporary ";
			break;
		case 'indefinite':
			words = "Indefinite ";
			break;
		default:
			words = "";
			break;
		}

		words += params.typename;

		newtag += "'''" + Morebits.string.toUpperCaseFirstChar(words) + ( params.reason !== '' ? ( ":''' " +
			Morebits.string.formatReasonText(params.reason) ) : ".'''" ) + " ~~~~";

		// If either protection type results in a increased status, then post it under increase
		// else we post it under decrease
		var increase = false;
		var protInfo = Twinkle.protect.protectionPresetsInfo[params.category];

		// function to compute protection weights (see comment at Twinkle.protect.protectionWeight)
		var computeWeight = function(mainLevel, stabilizeLevel) {
			var result = Twinkle.protect.protectionWeight[mainLevel || 'all'];
			if (stabilizeLevel) {
				if (result) {
					if (stabilizeLevel.level === "autoconfirmed") {
						result += 2;
					} else if (stabilizeLevel.level === "review") {
						result += 7;
					}
				} else {
					result = Twinkle.protect.protectionWeight["flaggedrevs_" + stabilizeLevel];
				}
			}
			return result;
		};

		// compare the page's current protection weights with the protection we are requesting
		var editWeight = computeWeight(Twinkle.protect.currentProtectionLevels.edit &&
			Twinkle.protect.currentProtectionLevels.edit.level,
			Twinkle.protect.currentProtectionLevels.stabilize &&
			Twinkle.protect.currentProtectionLevels.stabilize.level);
		if (computeWeight(protInfo.edit, protInfo.stabilize) > editWeight ||
			computeWeight(protInfo.move) > computeWeight(Twinkle.protect.currentProtectionLevels.move && 
			Twinkle.protect.currentProtectionLevels.move.level) ||
			computeWeight(protInfo.create) > computeWeight(Twinkle.protect.currentProtectionLevels.create && 
			Twinkle.protect.currentProtectionLevels.create.level)) {
			increase = true;
		}

		var reg;
		if ( increase ) {
			reg = /(\n==\s*Current requests for increase in protection level\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		} else {
			reg = /(\n==\s*Current requests for reduction in protection level\s*==\s*\n\s*\{\{[^\}\}]+\}\}\s*\n)/;
		}
		var originalTextLength = text.length;
		text = text.replace( reg, "$1" + newtag + "\n");
		if (text.length === originalTextLength)
		{
			var linknode = document.createElement('a');
			linknode.setAttribute("href", mw.util.getUrl("Wikipedia:Twinkle/Fixing RPP") );
			linknode.appendChild(document.createTextNode('How to fix RPP'));
			statusElement.error( [ 'Could not find relevant heading on WP:RPP. To fix this problem, please see ', linknode, '.' ] );
			return;
		}
		statusElement.status( 'Adding new request...' );
		rppPage.setEditSummary( "Requesting " + params.typename + (params.typename === "pending changes" ? ' on [[' : ' of [[') +
			Morebits.pageNameNorm + ']].' + Twinkle.getPref('summaryAd') );
		rppPage.setPageText( text );
		rppPage.setCreateOption( 'recreate' );
		rppPage.save();
	}
};
})(jQuery);


//</nowiki>
