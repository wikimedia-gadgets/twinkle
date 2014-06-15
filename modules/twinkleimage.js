//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleimage.js: Image CSD module
 ****************************************
 * Mode of invocation:     Tab ("DI")
 * Active on:              File pages with a corresponding file which is local (not on Commons)
 * Config directives in:   TwinkleConfig
 */

Twinkle.image = function twinkleimage() {
	if (mw.config.get('wgNamespaceNumber') === 6 &&
			!document.getElementById("mw-sharedupload") &&
			document.getElementById("mw-imagepage-section-filehistory")) {

		Twinkle.addPortletLink(Twinkle.image.callback, "Đề nghị xóa hình", "tw-xóa hình", "Xóa sau 7 ngày");
	}
};

Twinkle.image.callback = function twinkleimageCallback() {
	var Window = new Morebits.simpleWindow( 600, 330 );
	Window.setTitle( "Tập tin sẽ bị xóa sau 7 ngày" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Quy định xóa nhanh", "WP:XN" );
	Window.addFooterLink( "Trợ giúp Twinkle", "WP:TW/DOC#image" );

	var form = new Morebits.quickForm( Twinkle.image.callback.evaluate );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Thông báo cho người tải lên',
					value: 'notify',
					name: 'notify',
					tooltip: "Đừng chọn mục này nếu có nhiều thông báo hình ảnh muốn gởi đến cùng một người tải lên, và để tránh tràn ngập các thông báo trên trang thảo luận của họ.",
					checked: Twinkle.getPref('notifyUserOnDeli')
				}
			]
		}
	);
	var field = form.append( {
			type: 'field',
			label: 'Tác vụ cần thực hiện'
		} );
	field.append( {
			type: 'radio',
			name: 'type',
			event: Twinkle.image.callback.choice,
			list: [
				{
					label: 'Thiếu nguồn gốc (CSD H4)',
					value: 'thiếu nguồn gốc',
					checked: true,
					tooltip: 'Hình ảnh hoặc tập tin thiếu thông tin nguồn gốc'
				},
				{
					label: 'Thiếu giấy phép (CSD H4)',
					value: 'thiếu giấy phép',
					tooltip: 'Hình ảnh hoặc tập tin thiếu thông tin về giấy phép'
				},
				{
					label: 'Thiếu nguồn gốc lẫn giấy phép (CSD H4)',
					value: 'thiếu nguồn gốc lẫn giấy phép',
					tooltip: 'Hình ảnh hoặc tập tin thiếu thông tin về nguồn gốc lẫn giáy phép'
				},
				{
					label: 'Sử dụng hợp lý không sử dụng (CSD H5)',
					value: 'SDHL không SD',
					tooltip: 'Hình ảnh hoặc tập tin không được cấp phép để dùng trên Wikipedia và chỉ cho phép dùng theo tuyên bố sử dụng hợp lý như quy định Wikipedia:Nội dung không tự do, nhưng không dùng trong bài viết nào cả'
				},
				{
					label: 'Thiếu cơ sở hợp lý (CSD H6)',
					value: 'thiếu sử dụng hợp lý',
					tooltip: 'Hình ảnh hoặc tập tin được tuyên bố là dùng theo quy định sử dụng hợp lý của Wikipedia nhưng không có lời giải thích tại sao lại được cho phép dùng theo quy định đó'
				},
				{
					label: 'Cơ sở hợp lý gây tranh cãi (CSD H7)',
					value: 'lý do SDHL vô lý',
					tooltip: 'Hình ảnh hoặc tập tin có cơ sở hợp lý gây tranh cãi'
				},
				{
					label: 'Sử dụng hợp lý thay thế được (CSD H7)',
					value: 'SDHL thay thế được',
					tooltip: 'Hình ảnh hoặc tập tin không thỏa mãn tiêu chí không tự do đầu tiên của Wikipedia tức là nó miêu tả sự vật mà rất có khả năng tìm được hoặc tạo được một hình tự do mà có lượng thông tin tương đương'
				},
				{
					label: 'Thiếu sự cho phép (CSD H11)',
					value: 'thiếu bằng chứng',
					tooltip: 'Hình ảnh hoặc tập tin không có bằng chứng là tác giả đồng ý cấp phép cho tập tin'
				}
			]
		} );
	form.append( {
			type: 'div',
			label: 'Work area',
			name: 'work_area'
		} );
	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the parameters
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.type[0].dispatchEvent( evt );
};

Twinkle.image.callback.choice = function twinkleimageCallbackChoose(event) {
	var value = event.target.values;
	var root = event.target.form;
	var work_area = new Morebits.quickForm.element( {
			type: 'div',
			name: 'work_area'
		} );

	switch( value ) {
		case 'no source no license':
		case 'no source':
			work_area.append( {
					type: 'checkbox',
					name: 'non_free',
					list: [
						{
							label: 'Non-free',
							tooltip: 'Image is licensed under a fair use claim'
						}
					]
				} );
			break;
		case 'no permission':
			work_area.append( {
					type: 'input',
					name: 'source',
					label: 'Source: '
				} );
			break;
		case 'disputed fair use rationale':
			work_area.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Concern: '
				} );
			break;
		case 'orphaned fair use':
			work_area.append( {
					type: 'input',
					name: 'replacement',
					label: 'Replacement: '
				} );
			break;
		case 'replaceable fair use':
			work_area.append( {
					type: 'checkbox',
					name: 'old_image',
					list: [
						{
							label: 'Old image',
							tooltip: 'Image was uploaded before 2006-07-13'
						}
					]
				} );
			break;
		default:
			break;
	}

	root.replaceChild( work_area.render(), $(root).find('div[name="work_area"]')[0] );
};

Twinkle.image.callback.evaluate = function twinkleimageCallbackEvaluate(event) {
	var type, non_free, source, reason, replacement, old_image;

	var notify = event.target.notify.checked;
	var types = event.target.type;
	for( var i = 0; i < types.length; ++i ) {
		if( types[i].checked ) {
			type = types[i].values;
			break;
		}
	}
	if( event.target.non_free ) {
		non_free = event.target.non_free.checked;
	}
	if( event.target.source ) {
		source = event.target.source.value;
	}
	if( event.target.reason ) {
		reason = event.target.reason.value;
	}
	if( event.target.replacement ) {
		replacement = event.target.replacement.value;
	}
	if( event.target.old_image ) {
		old_image = event.target.old_image.checked;
	}

	var csdcrit;
	switch( type ) {
		case 'no source no license':
		case 'no source':
		case 'no license':
			csdcrit = "F4";
			break;
		case 'orphaned fair use':
			csdcrit = "F5";
			break;
		case 'no fair use rationale':
			csdcrit = "F6";
			break;
		case 'disputed fair use rationale':
		case 'replaceable fair use':
			csdcrit = "F7";
			break;
		case 'no permission':
			csdcrit = "F11";
			break;
		default:
			throw new Error( "Twinkle.image.callback.evaluate: unknown criterion" );
	}

	var lognomination = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(csdcrit.toLowerCase()) === -1;

	var params = {
		'type': type,
		'normalized': csdcrit,
		'non_free': non_free,
		'source': source,
		'reason': reason,
		'replacement': replacement,
		'old_image': old_image,
		'lognomination': lognomination
	};
	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( event.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Thêm thông báo hoàn tất";

	// Tagging image
	var wikipedia_page = new Morebits.wiki.page( mw.config.get('wgPageName'), 'Tagging file with deletion tag' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.load( Twinkle.image.callbacks.taggingImage );

	// Notifying uploader
	if( notify ) {
		wikipedia_page.lookupCreator(Twinkle.image.callbacks.userNotification);
	} else {
		// add to CSD log if desired
		if (lognomination) {
			params.fromDI = true;
			Twinkle.speedy.callbacks.user.addToLog(params, null);
		}
		// No auto-notification, display what was going to be added.
		var noteData = document.createElement( 'pre' );
		noteData.appendChild( document.createTextNode( "{{subst:di-" + type + "-notice|1=" + mw.config.get('wgTitle') + "}} ~~~~" ) );
		Morebits.status.info( 'Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement( 'br' ),  noteData ] );
	}
};

Twinkle.image.callbacks = {
	taggingImage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
		text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");

		var tag = "{{di-" + params.type + "|date={{subst:#time:j F Y}}";
		switch( params.type ) {
			case 'no source no license':
			case 'no source':
				tag += params.non_free ? "|non-free=yes" : "";
				break;
			case 'no permission':
				tag += params.source ? "|source=" + params.source : "";
				break;
			case 'disputed fair use rationale':
				tag += params.reason ? "|concern=" + params.reason : "";
				break;
			case 'orphaned fair use':
				tag += params.replacement ? "|replacement=" + params.replacement : "";
				break;
			case 'replaceable fair use':
				tag += params.old_image ? "|old image=yes" : "";
				break;
			default:
				break;  // doesn't matter
		}
		tag += "}}\n";

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary("This file is up for deletion, per [[WP:CSD#" + params.normalized + "|CSD " + params.normalized + "]] (" + params.type + ")." + Twinkle.getPref('summaryAd'));
		switch (Twinkle.getPref('deliWatchPage')) {
			case 'yes':
				pageobj.setWatchlist(true);
				break;
			case 'no':
				pageobj.setWatchlistFromPreferences(false);
				break;
			default:
				pageobj.setWatchlistFromPreferences(true);
				break;
		}
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();
		var usertalkpage = new Morebits.wiki.page('Thảo luận Thành viên:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
		var notifytext = "\n{{subst:di-" + params.type + "-notice|1=" + mw.config.get('wgTitle');
		if (params.type === 'no permission') {
			notifytext += params.source ? "|source=" + params.source : "";
		}
		notifytext += "}} ~~~~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Notification: tagging for deletion of [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
		usertalkpage.setCreateOption('recreate');
		switch (Twinkle.getPref('deliWatchUser')) {
			case 'yes':
				usertalkpage.setWatchlist(true);
				break;
			case 'no':
				usertalkpage.setWatchlistFromPreferences(false);
				break;
			default:
				usertalkpage.setWatchlistFromPreferences(true);
				break;
		}
		usertalkpage.setFollowRedirect(true);
		usertalkpage.append();

		// add this nomination to the user's userspace log, if the user has enabled it
		if (params.lognomination) {
			params.fromDI = true;
			Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
		}
	}
};
})(jQuery);


//</nowiki>
