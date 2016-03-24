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
		case 'thiếu nguồn gốc lẫn giấy phép':
		case 'thiếu nguồn gốc':
			work_area.append( {
					type: 'checkbox',
					name: 'non_free',
					list: [
						{
							label: 'Không tự do',
							tooltip: 'Hình cấp phép theo tuyên bố sử dụng hợp lý'
						}
					]
				} );
		/* falls through */
		case 'thiếu giấy phép':
			work_area.append( {
					type: 'checkbox',
					name: 'derivative',
					list: [
						{
							label: 'Derivative work which lacks a source for incorporated works',
							tooltip: 'File is a derivative of one or more other works whose source is not specified'
						}
					]
				} );
			break;
		case 'thiếu bằng chứng':
			work_area.append( {
					type: 'input',
					name: 'source',
					label: 'Nguồn: '
				} );
			break;
		case 'lý do SDHL vô lý':
			work_area.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Concern: '
				} );
			break;
		case 'SDHL không SD':
			work_area.append( {
					type: 'input',
					name: 'replacement',
					label: 'Replacement: '
				} );
			break;
		case 'SDHL thay thế được':
			work_area.append( {
					type: 'checkbox',
					name: 'old_image',
					list: [
						{
							label: 'Hình cũ',
							tooltip: 'Hình được tải lên trước 2006-07-13'
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
	var type, non_free, source, reason, replacement, derivative;

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
	if( event.target.derivative ) {
		derivative = event.target.derivative.checked;
	}

	var csdcrit;
	switch( type ) {
		case 'thiếu nguồn gốc lẫn giấy phép':
		case 'thiếu nguồn gốc':
		case 'thiếu giấy phép':
			csdcrit = "H4";
			break;
		case 'SDHL không SD':
			csdcrit = "H5";
			break;
		case 'thiếu sử dụng hợp lý':
			csdcrit = "H6";
			break;
		case 'lý do SDHL vô lý':
		case 'SDHL thay thế được':
			csdcrit = "H7";
			break;
		case 'thiếu bằng chứng':
			csdcrit = "H11";
			break;
		default:
			throw new Error( "Twinkle.image.callback.evaluate: unknown criterion" );
	}

	var lognomination = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(csdcrit.toLowerCase()) === -1;
	var templatename = (derivative ? ('dw ' + type) : type);

	var params = {
		'type': type,
		'templatename': templatename,
		'normalized': csdcrit,
		'non_free': non_free,
		'source': source,
		'reason': reason,
		'replacement': replacement,
		'lognomination': lognomination
	};
	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( event.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Thêm thông báo hoàn tất";

	// Tagging image
	var wikipedia_page = new Morebits.wiki.page( mw.config.get('wgPageName'), 'Thêm bản mẫu xóa tập tin' );
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
		noteData.appendChild( document.createTextNode( "{{subst:xh-" + templatename + "-tb|1=" + mw.config.get('wgTitle') + "}} ~~~~" ) );
		Morebits.status.info( 'Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement( 'br' ),  noteData ] );
	}
};

Twinkle.image.callbacks = {
	taggingImage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
		text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");

		var tag = "{{xh-" + params.templatename + "|ngày={{subst:CURRENTDAY2}}|tháng={{subst:CURRENTMONTH}}|năm={{subst:CURRENTYEAR}}";
		switch( params.type ) {
			case 'thiếu nguồn gốc lẫn giấy phép':
			case 'thiếu nguồn gốc':
				tag += params.non_free ? "|không tự do=có" : "";
				break;
			case 'thiếu bằng chứng':
				tag += params.source ? "|nguồn=" + params.source : "";
				break;
			case 'lý do SDHL vô lý':
				tag += params.reason ? "|lý do=" + params.reason : "";
				break;
			case 'SDHL không SD':
				tag += params.replacement ? "|thay thế=" + params.replacement : "";
				break;
			case 'SDHL thay thế được':
				tag += params.reason ? "|hình cũ=có" : "";
				break;
			default:
				break;  // doesn't matter
		}
		tag += "}}\n";

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary("Tập tin được đề nghị xóa theo [[WP:XN#" + params.normalized + "|XN " + params.normalized + "]] (" + params.type + ")." + Twinkle.getPref('summaryAd'));
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

		// disallow warning yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			pageobj.getStatusElement().warn("Bạn (" + initialContrib + ") đã tạo trang này; bỏ qua thông báo");
		} else {
			var usertalkpage = new Morebits.wiki.page('Thảo luận Thành viên:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n{{subst:xh-" + params.templatename + "-tb|1=" + mw.config.get('wgTitle');
			if (params.type === 'thiếu bằng chứng') {
				notifytext += params.source ? "|nguồn=" + params.source : "";
			}
			notifytext += "}} ~~~~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Thông báo có đề nghị xóa [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
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
		}

		// thêm đề nghị này vào nhật trình không gian thành viên, nếu thành viên có kích hoạt chức năng này
		if (params.lognomination) {
			params.fromDI = true;
			Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
		}
	}
};
})(jQuery);


//</nowiki>
