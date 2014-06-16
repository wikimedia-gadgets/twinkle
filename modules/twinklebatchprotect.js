//<nowiki>


(function($){


/*
 ****************************************
 *** twinklebatchprotect.js: Batch protect module (chỉ bảo quản viên)
 ****************************************
 * Mode of invocation:     Tab ("P-batch")
 * Active on:              Existing project pages and user pages; existing and
 *                         non-existing categories; Special:PrefixIndex
 * Config directives in:   TwinkleConfig
 */


Twinkle.batchprotect = function twinklebatchprotect() {
	if( Morebits.userIsInGroup( 'sysop' ) && ((mw.config.get( 'wgArticleId' ) > 0 && (mw.config.get( 'wgNamespaceNumber' ) === 2 ||
		mw.config.get( 'wgNamespaceNumber' ) === 4)) || mw.config.get( 'wgNamespaceNumber' ) === 14 ||
		mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Prefixindex') ) {
		Twinkle.addPortletLink( Twinkle.batchprotect.callback, "P-batch", "tw-pbatch", "Khóa các trang được trang này liên kết đến" );
	}
};

Twinkle.batchprotect.unlinkCache = {};
Twinkle.batchprotect.callback = function twinklebatchprotectCallback() {
	var Window = new Morebits.simpleWindow( 800, 400 );
	Window.setTitle( "Batch protection" );
	Window.setScriptName( "Twinkle" );
	//Window.addFooterLink( "Các bản mẫu khóa trang", "Template:Protection templates" );
	Window.addFooterLink( "Quy định khóa trang", "WP:PROT" );
	Window.addFooterLink( "Trợ giúp Twinkle", "WP:TW/DOC#protect" );

	var form = new Morebits.quickForm( Twinkle.batchprotect.callback.evaluate );
	form.append({
			type: 'checkbox',
			name: 'editmodify',
			event: Twinkle.protect.formevents.editmodify,
			list: [
				{
					label: 'Khóa sửa đổi',
					value: 'editmodify',
					tooltip: 'Chỉ có tác dụng đối với trang đã có.',
					checked: true
				}
			]
		});
	var editlevel = form.append({
			type: 'select',
			name: 'editlevel',
			label: 'Edit protection:',
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
	editlevel.append({
			type: 'option',
			label: 'Template editor',
			value: 'templateeditor'
		});
	editlevel.append({
			type: 'option',
			label: 'Bảo quản viên',
			value: 'sysop',
			selected: true
		});
	form.append({
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

	form.append({
			type: 'checkbox',
			name: 'movemodify',
			event: Twinkle.protect.formevents.movemodify,
			list: [
				{
					label: 'Khóa di chuyển',
					value: 'movemodify',
					tooltip: 'Đối với các trang đã tồn tại.',
					checked: true
				}
			]
		});
	var movelevel = form.append({
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
	movelevel.append({
			type: 'option',
			label: 'Template editor',
			value: 'templateeditor'
		});
	movelevel.append({
			type: 'option',
			label: 'Bảo quản viên',
			value: 'sysop',
			selected: true
		});
	form.append({
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

	form.append({
			type: 'checkbox',
			name: 'createmodify',
			event: function twinklebatchprotectFormCreatemodifyEvent(e) {
				e.target.form.createlevel.disabled = !e.target.checked;
				e.target.form.createexpiry.disabled = !e.target.checked || (e.target.form.createlevel.value === 'all');
				e.target.form.createlevel.style.color = e.target.form.createexpiry.style.color = (e.target.checked ? "" : "transparent");
			},
			list: [
				{
					label: 'Khóa tạo trang',
					value: 'createmodify',
					tooltip: 'Đối với các trang chưa có.',
					checked: true
				}
			]
		});
	var createlevel = form.append({
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
	createlevel.append({
			type: 'option',
			label: 'Template editor',
			value: 'templateeditor'
		});
	createlevel.append({
			type: 'option',
			label: 'Bảo quản viên',
			value: 'sysop',
			selected: true
		});
	form.append({
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

	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Lý do (nhật trình khóa): '
		} );

	var query;

	if( mw.config.get( 'wgNamespaceNumber' ) === 14 ) {  // categories
		query = {
			'action': 'query',
			'generator': 'categorymembers',
			'gcmtitle': mw.config.get( 'wgPageName' ),
			'gcmlimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'prop': 'revisions',
			'rvprop': 'size'
		};
	} else if( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Prefixindex' ) {
		query = {
			'action': 'query',
			'generator': 'allpages',
			'gapnamespace': Morebits.queryString.exists('namespace') ? Morebits.queryString.get( 'namespace' ) : document.getElementById('namespace').value,
			'gapprefix': Morebits.queryString.exists('from') ? Morebits.string.toUpperCaseFirstChar(Morebits.queryString.get( 'from' ).replace('+', ' ')) :
				Morebits.string.toUpperCaseFirstChar(document.getElementById('nsfrom').value),
			'gaplimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'prop': 'revisions',
			'rvprop': 'size'
		};
	} else {
		query = {
			'action': 'query',
			'gpllimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'generator': 'links',
			'titles': mw.config.get( 'wgPageName' ),
			'prop': 'revisions',
			'rvprop': 'size'
		};
	}

	var statusdiv = document.createElement("div");
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var statelem = new Morebits.status("Grabbing list of pages");

	var wikipedia_api = new Morebits.wiki.api( 'loading...', query, function(apiobj) {
			var xml = apiobj.responseXML;
			var $pages = $(xml).find('page');
			var list = [];
			$pages.each(function(index, page) {
				var $page = $(page);
				var title = $page.attr('title');
				var isRedir = $page.attr('redirect') === ""; // XXX ??
				var missing = $page.attr('missing') === ""; // XXX ??
				var size = $page.find('rev').attr('size');

				var metadata = [];
				if (missing) {
					metadata.push("page does not exist");
				} else {
					if (isRedir) {
						metadata.push("redirect");
					}
					metadata.push(size + " bytes");
				}
				list.push( { label: title + (metadata.length ? (' (' + metadata.join('; ') + ')') : '' ), value: title, checked: true });
			});
			form.append({ type: 'header', label: 'Pages to protect' });
			form.append( {
					type: 'checkbox',
					name: 'pages',
					list: list
				} );
			form.append( { type:'submit' } );

			var result = form.render();
			Window.setContent( result );
		}, statelem );

	wikipedia_api.post();
};

Twinkle.batchprotect.currentProtectCounter = 0;
Twinkle.batchprotect.currentprotector = 0;
Twinkle.batchprotect.callback.evaluate = function twinklebatchprotectCallbackEvaluate(event) {
	var pages = event.target.getChecked( 'pages' );
	var reason = event.target.reason.value;
	var editmodify = event.target.editmodify.checked;
	var editlevel = event.target.editlevel.value;
	var editexpiry = event.target.editexpiry.value;
	var movemodify = event.target.movemodify.checked;
	var movelevel = event.target.movelevel.value;
	var moveexpiry = event.target.moveexpiry.value;
	var createmodify = event.target.createmodify.checked;
	var createlevel = event.target.createlevel.value;
	var createexpiry = event.target.createexpiry.value;

	if( ! reason ) {
		alert("You've got to give a reason, you rouge admin!");
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init( event.target );

	if( !pages ) {
		Morebits.status.error( 'Error', 'Nothing to protect, aborting' );
		return;
	}

	var toCall = function twinklebatchprotectToCall( work ) {
		if( work.length === 0 && Twinkle.batchprotect.currentProtectCounter <= 0 ) {
			Morebits.status.info( 'work done' );
			window.clearInterval( Twinkle.batchprotect.currentprotector );
			Twinkle.batchprotect.currentprotector = Twinkle.batchprotect.currentProtectCounter = 0;
			Morebits.wiki.removeCheckpoint();
			return;
		} else if( work.length !== 0 && Twinkle.batchprotect.currentProtectCounter <= Twinkle.getPref('batchProtectMinCutOff') ) {
			var pages = work.shift();
			Twinkle.batchprotect.currentProtectCounter += pages.length;
			for( var i = 0; i < pages.length; ++i ) {
				var page = pages[i];
				var query = {
					'action': 'query',
					'titles': page
				};
				var wikipedia_api = new Morebits.wiki.api( 'Checking if page ' + page + ' exists', query, Twinkle.batchprotect.callbacks.main );
				wikipedia_api.params = {
					page: page,
					reason: reason,
					editmodify: editmodify,
					editlevel: editlevel,
					editexpiry: editexpiry,
					movemodify: movemodify,
					movelevel: movelevel,
					moveexpiry: moveexpiry,
					createmodify: createmodify,
					createlevel: createlevel,
					createexpiry: createexpiry
				};
				wikipedia_api.post();
			}
		}
	};
	var work = Morebits.array.chunk( pages, Twinkle.getPref('batchProtectChunks') );
	Morebits.wiki.addCheckpoint();
	Twinkle.batchprotect.currentprotector = window.setInterval( toCall, 1000, work );
};

Twinkle.batchprotect.callbacks = {
	main: function( apiobj ) {
		var xml = apiobj.responseXML;
		var normal = $(xml).find('normalized n').attr('to');
		if( normal ) {
			apiobj.params.page = normal;
		}

		var exists = ($(xml).find('page').attr('missing') !== "");

		var page = new Morebits.wiki.page(apiobj.params.page, "Protecting " + apiobj.params.page);
		var takenAction = false;
		if (exists && apiobj.params.editmodify) {
			page.setEditProtection(apiobj.params.editlevel, apiobj.params.editexpiry);
			takenAction = true;
		}
		if (exists && apiobj.params.movemodify) {
			page.setMoveProtection(apiobj.params.movelevel, apiobj.params.moveexpiry);
			takenAction = true;
		}
		if (!exists && apiobj.params.createmodify) {
			page.setCreateProtection(apiobj.params.createlevel, apiobj.params.createexpiry);
			takenAction = true;
		}
		if (!takenAction) {
			Morebits.status.warn("Protecting " + apiobj.params.page, "page " + (exists ? "exists" : "does not exist") + "; nothing to do, skipping");
			return;
		}

		page.setEditSummary(apiobj.params.reason);

		page.protect(function(pageobj) {
			--Twinkle.batchprotect.currentProtectCounter;
			var link = document.createElement( 'a' );
			link.setAttribute( 'href', mw.util.getUrl( apiobj.params.page ) );
			link.appendChild( document.createTextNode( apiobj.params.page ) );
			pageobj.getStatusElement().info( [ 'completed (' , link , ')' ] );
		} );
	}
};
})(jQuery);


//</nowiki>
