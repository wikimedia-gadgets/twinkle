//<nowiki>


(function($){


/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              User talk pages
 * Config directives in:   TwinkleConfig
 */

Twinkle.warn = function twinklewarn() {
	if( mw.config.get( 'wgRelevantUserName' ) ) {
			Twinkle.addPortletLink( Twinkle.warn.callback, "Cảnh báo", "tw-warn", "Cảnh báo/thông báo thành viên" );
	}

	// modify URL of talk page on rollback success pages
	if( mw.config.get('wgAction') === 'rollback' ) {
		var $vandalTalkLink = $("#mw-rollback-success").find(".mw-usertoollinks a").first();
		if ( $vandalTalkLink.length ) {
			$vandalTalkLink.css("font-weight", "bold");
			$vandalTalkLink.wrapInner($("<span/>").attr("title", "If appropriate, you can use Twinkle to warn the user about their edits to this page."));

			var extraParam = "vanarticle=" + mw.util.rawurlencode(Morebits.pageNameNorm);
			var href = $vandalTalkLink.attr("href");
			if (href.indexOf("?") === -1) {
				$vandalTalkLink.attr("href", href + "?" + extraParam);
			} else {
				$vandalTalkLink.attr("href", href + "&" + extraParam);
			}
		}
	}
};

Twinkle.warn.callback = function twinklewarnCallback() {
	if( mw.config.get( 'wgRelevantUserName' ) === mw.config.get( 'wgUserName' ) &&
			!confirm( 'You are about to warn yourself! Are you sure you want to proceed?' ) ) {
		return;
	}

	var Window = new Morebits.simpleWindow( 600, 440 );
	Window.setTitle( "Thông báo/cảnh báo đến thành viên" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Chọn mức độ cảnh báo", "WP:UWUL#Levels" );
	Window.addFooterLink( "Trợ giúp Twinkle", "WP:TW/DOC#warn" );

	var form = new Morebits.quickForm( Twinkle.warn.callback.evaluate );
	var main_select = form.append( {
			type: 'field',
			label: 'Chọn kiểu thông báo/cảnh báo',
			tooltip: 'Đầu tiên chọn một nhóm cảnh báo sau đó chọn các cảnh báo cụ thể.'
		} );

	var main_group = main_select.append( {
			type: 'select',
			name: 'main_group',
			event:Twinkle.warn.callback.change_category
		} );

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append( { type: 'option', label: 'Thông báo (1)', value: 'level1', selected: ( defaultGroup === 1 || defaultGroup < 1 || ( Morebits.userIsInGroup( 'sysop' ) ? defaultGroup > 8 : defaultGroup > 7 ) ) } );
	main_group.append( { type: 'option', label: 'Chú ý (2)', value: 'level2', selected: ( defaultGroup === 2 ) } );
	main_group.append( { type: 'option', label: 'Cảnh báo (3)', value: 'level3', selected: ( defaultGroup === 3 ) } );
	main_group.append( { type: 'option', label: 'Cảnh báo lần cuối (4)', value: 'level4', selected: ( defaultGroup === 4 ) } );
	main_group.append( { type: 'option', label: 'Chỉ cảnh báo (4im)', value: 'level4im', selected: ( defaultGroup === 5 ) } );
	main_group.append( { type: 'option', label: 'Các thông báo đơn', value: 'singlenotice', selected: ( defaultGroup === 6 ) } );
	main_group.append( { type: 'option', label: 'Các cảnh báo đơn', value: 'singlewarn', selected: ( defaultGroup === 7 ) } );
	if( Twinkle.getPref( 'customWarningList' ).length ) {
		main_group.append( { type: 'option', label: 'Cảnh báo tùy biến', value: 'custom', selected: ( defaultGroup === 9 ) } );
	}

	main_select.append( { type: 'select', name: 'sub_group', event:Twinkle.warn.callback.change_subcategory } ); //Will be empty to begin with.

	form.append( {
			type: 'input',
			name: 'article',
			label: 'Bài viết',
			value:( Morebits.queryString.exists( 'vanarticle' ) ? Morebits.queryString.get( 'vanarticle' ) : '' ),
			tooltip: 'Thông báo liên kết đến bài viết khi bạn thực hiện lùi sửa. Nếu không cần tạo liên kết thì để trống.'
		} );

	var more = form.append( { type: 'field', name: 'reasonGroup', label: 'Thông tin cảnh báo' } );
	more.append( { type: 'textarea', label: 'Tin nhắn khác:', name: 'reason', tooltip: 'Có thể là một lý do nào đó hoặc giải thích chi tiết hơn' } );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'Preview';
	more.append( { type: 'div', id: 'warningpreview', label: [ previewlink ] } );
	more.append( { type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' } );

	more.append( { type: 'submit', label: 'Submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// We must init the first choice (General Note);
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.main_group.dispatchEvent( evt );
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	level1: {
		"Common warnings": {
			"cb-ph1": {
				label: "Phá hoại",
				summary: "Thông báo: Sửa đổi không mang tính xây dựng"
			},
			"cb-disruptive1": {
				label: "Disruptive editing",
				summary: "Thông báo: Unconstructive editing"
			},
			"cb-tn1": {
				label: "Sửa đổi thử nghiệm",
				summary: "Thông báo: Sửa đổi thử nghiệm"
			},
			"cb-xóa1": {
				label: "Xóa nội dung, tẩy trống trang",
				summary: "Thông báo: Xóa nội dung, tẩy trống trang"
			}
		},
		"Behavior in articles": {
			"cb-biog1": {
				label: "Thêm thông tin gây tranh cãi không nguồn về người đang sống",
				summary: "Thông báo: Thêm thông tin gây tranh cãi không nguồn về người đang sống"
			},
			"cb-defamatory1": {
				label: "Addition of defamatory content",
				summary: "Thông báo: Addition of defamatory content"
			},
			"cb-error1": {
				label: "Chèn các lỗi cố ý",
				summary: "Thông báo: Chèn các lỗi cố ý"
			},
			"cb-genre1": {
				label: "Frequent or mass changes to genres without consensus or references",
				summary: "Thông báo: Frequent or mass changes to genres without consensus or references"
			},
			"cb-image1": {
				label: "Phá hoại liên quan đến hình ảnh",
				summary: "Thông báo: Phá hoại liên quan đến hình ảnh"
			},
			"cb-nghịch thử": {
				label: "Nghịch thử",
				summary: "Thông báo: Nghịch thử"
			},
			"cb-nor1": {
				label: "Thêm các nghiên cứu chưa được công bố",
				summary: "Thông báo: Thêm các nghiên cứu chưa được công bố"
			},
			"cb-notcensored1": {
				label: "Censorship of material",
				summary: "Thông báo: Censorship of material"
			},
			"cb-own1": {
				label: "Ownership of articles",
				summary: "Thông báo: Ownership of articles"
			},
			"cb-tdel1": {
				label: "Removal of maintenance templates",
				summary: "Thông báo: Removal of maintenance templates"
			},
			"cb-unsourced1": {
				label: "Thêm thông tin không nguồn hoặc không đúng",
				summary: "Thông báo: Thêm thông tin không nguồn hoặc không đúng"
			}
		},
		"Promotions and spam": {
			"cb-qc1": {
				label: "Sử dụng Wikipedia để quảng cáo hoặc quảng bá",
				summary: "Thông báo: Sử dụng Wikipedia để quảng cáo hoặc quảng bá"
			},
			"cb-npov1": {
				label: "Sửa đổi không trung lập",
				summary: "Thông báo: Sửa đổi không trung lập"
			},
			"cb-spam1": {
				label: "Thêm các liên kết spam",
				summary: "Thông báo: Thêm các liên kết spam"
			}
		},
		"Behavior towards other editors": {
			"cb-agf1": {
				label: "Not assuming good faith",
				summary: "Thông báo: Not assuming good faith"
			},
			"cb-harass1": {
				label: "Harassment of other users",
				summary: "Thông báo: Harassment of other users"
			},
			"cb-npa1": {
				label: "Personal attack directed at a specific editor",
				summary: "Thông báo: Personal attack directed at a specific editor"
			},
			"cb-tempabuse1": {
				label: "Improper use of warning or blocking template",
				summary: "Thông báo: Improper use of warning or blocking template"
			}
		},
		"Removal of deletion tags": {
			"cb-afd1": {
				label: "Removing {{afd}} templates",
				summary: "Thông báo: Removing {{afd}} templates"
			},
			"cb-blpprod1": {
				label: "Removing {{blp prod}} templates",
				summary: "Thông báo: Removing {{blp prod}} templates"
			},
			"cb-idt1": {
				label: "Xóa các bản mẫu đề nghị xóa tập tin",
				summary: "Thông báo: Xóa các bản mẫu đề nghị xóa tập tin"
			},
			"cb-speedy1": {
				label: "Removing speedy deletion tags",
				summary: "Thông báo: Removing speedy deletion tags"
			}
		},
		"Other": {
			"cb-chat1": {
				label: "Thảo luận kiểu diễn đàn",
				summary: "Thông báo: Thảo luận kiểu diễn đàn"
			},
			"cb-create1": {
				label: "Tạo nhiều trang không phù hợp",
				summary: "Thông báo: Tạo nhiều trang không phù hợp"
			},
			"cb-mos1": {
				label: "Manual of style",
				summary: "Thông báo: Formatting, date, language, etc (Manual of style)"
			},
			"cb-move1": {
				label: "Page moves against naming conventions or consensus",
				summary: "Thông báo: Page moves against naming conventions or consensus"
			},
			"cb-tpv1": {
				label: "Refactoring others' talk page comments",
				summary: "Thông báo: Refactoring others' talk page comments"
			},
			"cb-upload1": {
				label: "Tải lên nhiều hình không bách khoa",
				summary: "Thông báo: Tải lên nhiều hình không bách khoa"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-redirect1": {
				label: "Tạo nhiều trang đổi hướng không phù hợp",
				summary: "Thông báo: Tạo nhiều trang đổi hướng không phù hợp"
			},
			"cb-tdel1": {
				label: "Uploading files missing copyright status",
				summary: "Thông báo: Uploading files missing copyright status"
			},
			"cb-af1": {
				label: "Inappropriate feedback through the Article Feedback Tool",
				summary: "Thông báo: Inappropriate feedback through the Article Feedback Tool"
			}
		}*/
	},


	level2: {
		"Common warnings": {
			"cb-ph2": {
				label: "Phá hoại",
				summary: "Chú ý: Phá hoại"
			},
			"cb-disruptive2": {
				label: "Disruptive editing",
				summary: "Chú ý: Unconstructive editing"
			},
			"cb-tn2": {
				label: "Sửa đổi thử nghiệm",
				summary: "Chú ý: Sửa đổi thử nghiệm"
			},
			"cb-xóa2": {
				label: "Xóa nội dung, tẩy trống trang",
				summary: "Chú ý: Xóa nội dung, tẩy trống trang"
			}
		},
		"Behavior in articles": {
			"cb-biog2": {
				label: "Thêm thông tin gây tranh cãi không nguồn về người đang sống",
				summary: "Chú ý: Thêm thông tin gây tranh cãi không nguồn về người đang sống"
			},
			"cb-defamatory2": {
				label: "Addition of defamatory content",
				summary: "Chú ý: Addition of defamatory content"
			},
			"cb-error2": {
				label: "Chèn các lỗi cố ý",
				summary: "Chú ý: Chèn các lỗi cố ý"
			},
			"cb-genre2": {
				label: "Frequent or mass changes to genres without consensus or references",
				summary: "Chú ý: Frequent or mass changes to genres without consensus or references"
			},
			"cb-image2": {
				label: "Phá hoại liên quan đến hình ảnh",
				summary: "Chú ý: Phá hoại liên quan đến hình ảnh"
			},
			"cb-joke2": {
				label: "Using improper humor in articles",
				summary: "Chú ý: Using improper humor in articles"
			},
			"cb-nor2": {
				label: "Thêm các nghiên cứu chưa được công bố",
				summary: "Chú ý: Thêm các nghiên cứu chưa được công bố"
			},
			"cb-notcensored2": {
				label: "Censorship of material",
				summary: "Chú ý: Censorship of material"
			},
			"cb-own2": {
				label: "Ownership of articles",
				summary: "Chú ý: Ownership of articles"
			},
			"cb-tdel2": {
				label: "Xóa các bản mẫu bảo trì",
				summary: "Chú ý: Xóa các bản mẫu bảo trì"
			},
			"cb-unsourced2": {
				label: "Thêm thông tin không nguồn hoặc không đúng",
				summary: "Chú ý: Thêm thông tin không nguồn hoặc không đúng"
			}
		},
		"Promotions and spam": {
			"cb-qc2": {
				label: "Sử dụng Wikipedia để quảng cáo hoặc quảng bá",
				summary: "Chú ý: Sử dụng Wikipedia để quảng cáo hoặc quảng bá"
			},
			"cb-npov2": {
				label: "Sửa đổi không trung lập",
				summary: "Chú ý: Sửa đổi không trung lập"
			},
			"cb-spam2": {
				label: "Thêm các liên kết spam",
				summary: "Chú ý: Thêm các liên kết spam"
			}
		},
		"Behavior towards other editors": {
			"cb-agf2": {
				label: "Not assuming good faith",
				summary: "Chú ý: Not assuming good faith"
			},
			"cb-harass2": {
				label: "Harassment of other users",
				summary: "Chú ý: Harassment of other users"
			},
			"cb-npa2": {
				label: "Personal attack directed at a specific editor",
				summary: "Chú ý: Personal attack directed at a specific editor"
			},
			"cb-tempabuse2": {
				label: "Improper use of warning or blocking template",
				summary: "Chú ý: Improper use of warning or blocking template"
			}
		},
		"Removal of deletion tags": {
			"cb-afd2": {
				label: "Removing {{afd}} templates",
				summary: "Chú ý: Removing {{afd}} templates"
			},
			"cb-blpprod2": {
				label: "Removing {{blp prod}} templates",
				summary: "Chú ý: Removing {{blp prod}} templates"
			},
			"cb-idt2": {
				label: "Xóa các bản mẫu đề nghị xóa tập tin",
				summary: "Chú ý: Xóa các bản mẫu đề nghị xóa tập tin"
			},
			"cb-speedy2": {
				label: "Removing speedy deletion tags",
				summary: "Chú ý: Removing speedy deletion tags"
			}
		},
		"Other": {
			"cb-attempt2": {
				label: "Triggering the edit filter",
				summary: "Chú ý: Triggering the edit filter"
			},
			"cb-chat2": {
				label: "Thảo luận kiểu diễn đàn",
				summary: "Chú ý: Thảo luận kiểu diễn đàn"
			},
			"cb-create2": {
				label: "Tạo nhiều trang không phù hợp",
				summary: "Chú ý: Tạo nhiều trang không phù hợp"
			},
			"cb-mos2": {
				label: "Manual of style",
				summary: "Chú ý: Formatting, date, language, etc (Manual of style)"
			},
			"cb-move2": {
				label: "Page moves against naming conventions or consensus",
				summary: "Chú ý: Page moves against naming conventions or consensus"
			},
			"cb-tpv2": {
				label: "Refactoring others' talk page comments",
				summary: "Chú ý: Refactoring others' talk page comments"
			},
			"cb-upload2": {
				label: "Tải lên nhiều hình không bách khoa",
				summary: "Chú ý: Tải lên nhiều hình không bách khoa"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-redirect2": {
				label: "Tạo nhiều trang đổi hướng không phù hợp",
				summary: "Chú ý: Tạo nhiều trang đổi hướng không phù hợp"
			},
			"cb-ics2": {
				label: "Tải tập tin lên mà không có thẻ bản quyền",
				summary: "Chú ý: Tải tập tin lên mà không có thẻ bản quyền"
			}
		}*/
	},


	level3: {
		"Common warnings": {
			"cb-ph3": {
				label: "Phá hoại",
				summary: "Cảnh báo: Phá hoại"
			},
			"cb-disruptive3": {
				label: "Disruptive editing",
				summary: "Cảnh báo: Disruptive editing"
			},
			"cb-tn3": {
				label: "Sửa đổi thử nghiệm",
				summary: "Cảnh báo: Sửa đổi thử nghiệm"
			},
			"cb-xóa3": {
				label: "Xóa nội dung, tẩy trống trang",
				summary: "Cảnh báo: Xóa nội dung, tẩy trống trang"
			}
		},
		"Behavior in articles": {
			"cb-biog3": {
				label: "Thêm thông tin gây tranh cãi không nguồn về người đang sống",
				summary: "Cảnh báo: Thêm thông tin gây tranh cãi không nguồn về người đang sống"
			},
			"cb-defamatory3": {
				label: "Addition of defamatory content",
				summary: "Cảnh báo: Addition of defamatory content"
			},
			"cb-error3": {
				label: "Chèn các lỗi cố ý",
				summary: "Cảnh báo: Chèn các lỗi cố ý"
			},
			"cb-genre3": {
				label: "Frequent or mass changes to genres without consensus or reference",
				summary: "Cảnh báo: Frequent or mass changes to genres without consensus or reference"
			},
			"cb-image3": {
				label: "Phá hoại liên quan đến hình ảnh",
				summary: "Cảnh báo: Phá hoại liên quan đến hình ảnh"
			},
			"cb-joke3": {
				label: "Using improper humor in articles",
				summary: "Cảnh báo: Using improper humor in articles"
			},
			"cb-nor3": {
				label: "Thêm các nghiên cứu chưa được công bố",
				summary: "Cảnh báo: Thêm các nghiên cứu chưa được công bố"
			},
			"cb-notcensored3": {
				label: "Censorship of material",
				summary: "Cảnh báo: Censorship of material"
			},
			"cb-own3": {
				label: "Ownership of articles",
				summary: "Cảnh báo: Ownership of articles"
			},
			"cb-tdel3": {
				label: "Xóa các bản mẫu bảo trì",
				summary: "Cảnh báo: Xóa các bản mẫu bảo trì"
			},
			"cb-unsourced3": {
				label: "Thêm thông tin không nguồn hoặc không đúng",
				summary: "Cảnh báo: Thêm thông tin không nguồn hoặc không đúng"
			}
		},
		"Promotions and spam": {
			"cb-qc3": {
				label: "Sử dụng Wikipedia để quảng cáo hoặc quảng bá",
				summary: "Cảnh báo: Sử dụng Wikipedia để quảng cáo hoặc quảng bá"
			},
			"cb-npov3": {
				label: "Sửa đổi không trung lập",
				summary: "Cảnh báo: Sửa đổi không trung lập"
			},
			"cb-spam3": {
				label: "Thêm các liên kết spam",
				summary: "Cảnh báo: Thêm các liên kết spam"
			}
		},
		"Behavior towards other users": {
			"cb-agf3": {
				label: "Not assuming good faith",
				summary: "Cảnh báo: Not assuming good faith"
			},
			"cb-harass3": {
				label: "Harassment of other users",
				summary: "Cảnh báo: Harassment of other users"
			},
			"cb-npa3": {
				label: "Personal attack directed at a specific editor",
				summary: "Cảnh báo: Personal attack directed at a specific editor"
			}
		},
		"Removal of deletion tags": {
			"cb-afd3": {
				label: "Removing {{afd}} templates",
				summary: "Cảnh báo: Removing {{afd}} templates"
			},
			"cb-blpprod3": {
				label: "Removing {{blpprod}} templates",
				summary: "Cảnh báo: Removing {{blpprod}} templates"
			},
			"cb-idt3": {
				label: "Xóa các bản mẫu đề nghị xóa tập tin",
				summary: "Cảnh báo: Xóa các bản mẫu đề nghị xóa tập tin"
			},
			"cb-speedy3": {
				label: "Removing speedy deletion tags",
				summary: "Cảnh báo: Removing speedy deletion tags"
			}
		},
		"Other": {
			"cb-attempt3": {
				label: "Triggering the edit filter",
				summary: "Cảnh báo: Triggering the edit filter"
			},
			"cb-chat3": {
				label: "Thảo luận kiểu diễn đàn",
				summary: "Cảnh báo: Thảo luận kiểu diễn đàn"
			},
			"cb-create3": {
				label: "Tạo nhiều trang không phù hợp",
				summary: "Cảnh báo: Tạo nhiều trang không phù hợp"
			},
			"cb-mos3": {
				label: "Manual of style",
				summary: "Cảnh báo: Formatting, date, language, etc (Manual of style)"
			},
			"cb-move3": {
				label: "Page moves against naming conventions or consensus",
				summary: "Cảnh báo: Page moves against naming conventions or consensus"
			},
			"cb-tpv3": {
				label: "Refactoring others' talk page comments",
				summary: "Cảnh báo: Refactoring others' talk page comments"
			},
			"cb-upload3": {
				label: "Tải lên nhiều hình không bách khoa",
				summary: "Cảnh báo: Tải lên nhiều hình không bách khoa"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-ics3": {
				label: "Tải tập tin lên mà không có thẻ bản quyền",
				summary: "Cảnh báo: Tải tập tin lên mà không có thẻ bản quyền"
			},
			"cb-redirect3": {
				label: "Tạo nhiều trang đổi hướng không phù hợp",
				summary: "Cảnh báo: Tạo nhiều trang đổi hướng không phù hợp"
			}
		}*/
	},


	level4: {
		"Common warnings": {
			"cb-ph4": {
				label: "Phá hoại",
				summary: "Cảnh báo cuối cùng: Phá hoại"
			},
			"cb-generic4": {
				label: "Cảnh báo cuối cùng (for template series missing level 4)",
				summary: "Cảnh báo cuối cùng"
			},
			"cb-xóa4": {
				label: "Xóa nội dung, tẩy trống trang",
				summary: "Cảnh báo cuối cùng: Xóa nội dung, tẩy trống trang"
			}
		},
		"Behavior in articles": {
			"cb-biog4": {
				label: "Thêm thông tin gây tranh cãi không nguồn về người đang sống",
				summary: "Cảnh báo cuối cùng: Thêm thông tin gây tranh cãi không nguồn về người đang sống"
			},
			"cb-defamatory4": {
				label: "Addition of defamatory content",
				summary: "Cảnh báo cuối cùng: Addition of defamatory content"
			},
			"cb-error4": {
				label: "Chèn các lỗi cố ý",
				summary: "Cảnh báo cuối cùng: Introducing deliberate factual errors"
			},
			"cb-genre4": {
				label: "Frequent or mass changes to genres without consensus or reference",
				summary: "Cảnh báo cuối cùng: Frequent or mass changes to genres without consensus or reference"
			},
			"cb-image4": {
				label: "Phá hoại liên quan đến hình ảnh",
				summary: "Cảnh báo cuối cùng: Phá hoại liên quan đến hình ảnh"
			},
			"cb-joke4": {
				label: "Using improper humor in articles",
				summary: "Cảnh báo cuối cùng: Using improper humor in articles"
			},
			"cb-nor4": {
				label: "Thêm các nghiên cứu chưa được công bố",
				summary: "Cảnh báo cuối cùng: Thêm các nghiên cứu chưa được công bố"
			},
			"cb-tdel4": {
				label: "Xóa các bản mẫu bảo trì",
				summary: "Cảnh báo cuối cùng: Xóa các bản mẫu bảo trì"
			},
			"cb-unsourced4": {
				label: "Thêm thông tin không nguồn hoặc không đúng",
				summary: "Cảnh báo cuối cùng: Thêm thông tin không nguồn hoặc không đúng"
			}
		},
		"Promotions and spam": {
			"cb-qc4": {
				label: "Sử dụng Wikipedia để quảng cáo hoặc quảng bá",
				summary: "Cảnh báo cuối cùng: Sử dụng Wikipedia để quảng cáo hoặc quảng bá"
			},
			"cb-npov4": {
				label: "Sửa đổi không trung lập",
				summary: "Cảnh báo cuối cùng: Sửa đổi không trung lập"
			},
			"cb-spam4": {
				label: "Thêm các liên kết spam",
				summary: "Cảnh báo cuối cùng: Thêm các liên kết spam"
			}
		},
		"Behavior towards other editors": {
			"cb-harass4": {
				label: "Harassment of other users",
				summary: "Cảnh báo cuối cùng: Harassment of other users"
			},
			"cb-npa4": {
				label: "Personal attack directed at a specific editor",
				summary: "Cảnh báo cuối cùng: Personal attack directed at a specific editor"
			}
		},
		"Removal of deletion tags": {
			"cb-afd4": {
				label: "Removing {{afd}} templates",
				summary: "Cảnh báo cuối cùng: Removing {{afd}} templates"
			},
			"cb-blpprod4": {
				label: "Removing {{blp prod}} templates",
				summary: "Cảnh báo cuối cùng: Removing {{blp prod}} templates"
			},
			"cb-idt4": {
				label: "Xóa các bản mẫu đề nghị xóa tập tin",
				summary: "Cảnh báo cuối cùng: Xóa các bản mẫu đề nghị xóa tập tin"
			},
			"cb-speedy4": {
				label: "Removing speedy deletion tags",
				summary: "Cảnh báo cuối cùng: Removing speedy deletion tags"
			}
		},
		"Other": {
			"cb-attempt4": {
				label: "Triggering the edit filter",
				summary: "Cảnh báo cuối cùng: Triggering the edit filter"
			},
			"cb-chat4": {
				label: "Thảo luận kiểu diễn đàn",
				summary: "Cảnh báo cuối cùng: Thảo luận kiểu diễn đàn"
			},
			"cb-create4": {
				label: "Tạo nhiều trang không phù hợp",
				summary: "Cảnh báo cuối cùng: Tạo nhiều trang không phù hợp"
			},
			"cb-mos4": {
				label: "Manual of style",
				summary: "Cảnh báo cuối cùng: Formatting, date, language, etc (Manual of style)"
			},
			"cb-move4": {
				label: "Page moves against naming conventions or consensus",
				summary: "Cảnh báo cuối cùng: Page moves against naming conventions or consensus"
			},
			"cb-tpv4": {
				label: "Refactoring others' talk page comments",
				summary: "Cảnh báo cuối cùng: Refactoring others' talk page comments"
			},
			"cb-upload4": {
				label: "Tải lên nhiều hình không bách khoa",
				summary: "Cảnh báo cuối cùng: Tải lên nhiều hình không bách khoa"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-redirect4": {
				label: "Tạo nhiều trang đổi hướng không phù hợp",
				summary: "Cảnh báo cuối cùng: Tạo nhiều trang đổi hướng không phù hợp"
			},
			"cb-ics4": {
				label: "Tải tập tin lên mà không có thẻ bản quyền",
				summary: "Cảnh báo cuối cùng: Tải tập tin lên mà không có thẻ bản quyền"
			}
		}*/
	},


	level4im: {
		"Common warnings": {
			"cb-ph4im": {
				label: "Phá hoại",
				summary: "Cảnh báo duy nhất: Phá hoại"
			},
			"cb-xóa4im": {
				label: "Xóa nội dung, tẩy trống trang",
				summary: "Cảnh báo duy nhất: Xóa nội dung, tẩy trống trang"
			}
		},
		"Behavior in articles": {
			"cb-biog4im": {
				label: "Thêm thông tin gây tranh cãi không nguồn về người đang sống",
				summary: "Cảnh báo duy nhất: Thêm thông tin gây tranh cãi không nguồn về người đang sống"
			},
			"cb-defamatory4im": {
				label: "Addition of defamatory content",
				summary: "Cảnh báo duy nhất: Addition of defamatory content"
			},
			"cb-image4im": {
				label: "Phá hoại liên quan đến hình ảnh",
				summary: "Cảnh báo duy nhất: Phá hoại liên quan đến hình ảnh"
			},
			"cb-joke4im": {
				label: "Using improper humor",
				summary: "Cảnh báo duy nhất: Using improper humor"
			},
			"cb-own4im": {
				label: "Ownership of articles",
				summary: "Cảnh báo duy nhất: Ownership of articles"
			}
		},
		"Promotions and spam": {
			"cb-qc4im": {
				label: "Sử dụng Wikipedia để quảng cáo hoặc quảng bá",
				summary: "Cảnh báo duy nhất: Sử dụng Wikipedia để quảng cáo hoặc quảng bá"
			},
			"cb-spam4im": {
				label: "Thêm các liên kết spam",
				summary: "Cảnh báo duy nhất: Thêm các liên kết spam"
			}
		},
		"Behavior towards other editors": {
			"cb-harass4im": {
				label: "Harassment of other users",
				summary: "Cảnh báo duy nhất: Harassment of other users"
			},
			"cb-npa4im": {
				label: "Personal attack directed at a specific editor",
				summary: "Cảnh báo duy nhất: Personal attack directed at a specific editor"
			}
		},
		"Other": {
			"cb-create4im": {
				label: "Tạo nhiều trang không phù hợp",
				summary: "Cảnh báo duy nhất: Tạo nhiều trang không phù hợp"
			},
			"cb-move4im": {
				label: "Page moves against naming conventions or consensus",
				summary: "Cảnh báo duy nhất: Page moves against naming conventions or consensus"
			},
			"cb-upload4im": {
				label: "Tải lên nhiều hình không bách khoa",
				summary: "Cảnh báo duy nhất: Tải lên nhiều hình không bách khoa"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-redirect4im": {
				label: "Tạo nhiều trang đổi hướng không phù hợp",
				summary: "Cảnh báo duy nhất: Tạo nhiều trang đổi hướng không phù hợp"
			}
		}*/
	},

	singlenotice: {
		"cb-aiv": {
			label: "Bad AIV report",
			summary: "Thông báo: Bad AIV report"
		},
		"cb-autobiography": {
			label: "Creating autobiographies",
			summary: "Thông báo: Creating autobiographies"
		},
		"cb-badcat": {
			label: "Adding incorrect categories",
			summary: "Thông báo: Adding incorrect categories"
		},
		"cb-badlistentry": {
			label: "Adding inappropriate entries to lists",
			summary: "Thông báo: Adding inappropriate entries to lists"
		},
		"cb-bite": {
			label: "\"Biting\" newcomers",
			summary: "Thông báo: \"Biting\" newcomers",
			suppressArticleInSummary: true  // non-standard (user name, not article), and not necessary
		},
		"cb-coi": {
			label: "Conflict of interest",
			summary: "Thông báo: Conflict of interest",
			heading: "Managing a conflict of interest"
		},
		"cb-controversial": {
			label: "Introducing controversial material",
			summary: "Thông báo: Introducing controversial material"
		},
		"cb-copying": {
			label: "Copying text to another page",
			summary: "Thông báo: Copying text to another page"
		},
		"cb-crystal": {
			label: "Adding speculative or unconfirmed information",
			summary: "Thông báo: Adding speculative or unconfirmed information"
		},
		"cb-c&pmove": {
			label: "Cut and paste moves",
			summary: "Thông báo: Cut and paste moves"
		},
		"cb-dab": {
			label: "Incorrect edit to a disambiguation page",
			summary: "Thông báo: Incorrect edit to a disambiguation page"
		},
		"cb-date": {
			label: "Unnecessarily changing date formats",
			summary: "Thông báo: Unnecessarily changing date formats"
		},
		"cb-deadlink": {
			label: "Removing proper sources containing dead links",
			summary: "Thông báo: Removing proper sources containing dead links"
		},
		"cb-draftfirst": {
			label: "User should draft in userspace without the risk of speedy deletion",
			summary: "Thông báo: Consider drafting your article in [[Help:Userspace draft|userspace]]"
		},
		"cb-editsummary": {
			label: "Not using edit summary",
			summary: "Thông báo: Not using edit summary"
		},
		"cb-vietnamese": {
			label: "Không thảo luận bằng tiếng Việt",
			summary: "Thông báo: Không thảo luận bằng tiếng Việt"
		},
		"cb-hasty": {
			label: "Hasty addition of speedy deletion tags",
			summary: "Thông báo: Allow creators time to improve their articles before tagging them for deletion"
		},
		"cb-inline-el": {
			label: "Adding external links to the body of an article",
			summary: "Thông báo: Keep external links to External links sections at the bottom of an article"
		},
		"cb-italicize": {
			label: "Italicize books, films, albums, magazines, TV series, etc within articles",
			summary: "Thông báo: Italicize books, films, albums, magazines, TV series, etc within articles"
		},
		"cb-lang": {
			label: "Thay đổi không cần thiết giữa các kiểu chính tả tiếng Việt",
			summary: "Thông báo: Thay đổi không cần thiết giữa các kiểu chính tả tiếng Việt",
			heading: "Kiểu chính tả tiếng Việt"
		},
		"cb-linking": {
			label: "Excessive addition of redlinks or repeated blue links",
			summary: "Thông báo: Excessive addition of redlinks or repeated blue links"
		},
		"cb-minor": {
			label: "Incorrect use of minor edits check box",
			summary: "Thông báo: Incorrect use of minor edits check box"
		},
		"cb-notvietnamese": {
			label: "Tạo bài ngoại ngữ",
			summary: "Thông báo: Tạo bài ngoại ngữ"
		},
		"cb-notvote": {
			label: "We use consensus, not voting",
			summary: "Thông báo: We use consensus, not voting"
		},
		"cb-plagiarism": {
			label: "Copying from public domain sources without attribution",
			summary: "Thông báo: Copying from public domain sources without attribution"
		},
		"cb-preview": {
			label: "Use preview button to avoid mistakes",
			summary: "Thông báo: Use preview button to avoid mistakes"
		},
		"cb-redlink": {
			label: "Indiscriminate removal of redlinks",
			summary: "Thông báo: Be careful when removing redlinks"
		},
		"cb-selfrevert": {
			label: "Reverting self tests",
			summary: "Thông báo: Reverting self tests"
		},
		"cb-socialnetwork": {
			label: "Wikipedia is not a social network",
			summary: "Thông báo: Wikipedia is not a social network"
		},
		"cb-sofixit": {
			label: "Be bold and fix things yourself",
			summary: "Thông báo: You can be bold and fix things yourself"
		},
		"cb-spoiler": {
			label: "Adding spoiler alerts or removing spoilers from appropriate sections",
			summary: "Thông báo: Don't delete or flag potential 'spoilers' in Wikipedia articles"
		},
		"cb-subst": {
			label: "Remember to subst: templates",
			summary: "Thông báo: Remember to subst: templates"
		},
		"cb-talkinarticle": {
			label: "Talk in article",
			summary: "Thông báo: Talk in article"
		},
		"cb-tilde": {
			label: "Not signing posts",
			summary: "Thông báo: Not signing posts"
		},
		"cb-toppost": {
			label: "Posting at the top of talk pages",
			summary: "Thông báo: Posting at the top of talk pages"
		},
		"cb-userspace draft finish": {
			label: "Stale userspace draft",
			summary: "Thông báo: Stale userspace draft"
		},
		"cb-vgscope": {
			label: "Adding video game walkthroughs, cheats or instructions",
			summary: "Thông báo: Adding video game walkthroughs, cheats or instructions"
		},
		"cb-warn": {
			label: "Place user warning templates when reverting vandalism",
			summary: "Thông báo: You can use user warning templates when reverting vandalism"
		}
	},


	singlewarn: {
		"cb-3rr": {
			label: "Violating the three-revert rule; see also cb-ew",
			summary: "Cảnh báo: Violating the three-revert rule"
		},
		"cb-affiliate": {
			label: "Affiliate marketing",
			summary: "Cảnh báo: Affiliate marketing"
		},
		"cb-agf-sock": {
			label: "Use of multiple accounts (assuming good faith)",
			summary: "Cảnh báo: Using multiple accounts"
		},
		"cb-attack": {
			label: "Creating attack pages",
			summary: "Cảnh báo: Creating attack pages",
			suppressArticleInSummary: true
		},
		"cb-bizlist": {
			label: "Business promotion",
			summary: "Cảnh báo: Promoting a business"
		},
		"cb-botun": {
			label: "Bot username",
			summary: "Cảnh báo: Bot username"
		},
		"cb-canvass": {
			label: "Canvassing",
			summary: "Cảnh báo: Canvassing"
		},
		"cb-copyright": {
			label: "Copyright violation",
			summary: "Cảnh báo: Copyright violation"
		},
		"cb-copyright-link": {
			label: "Linking to copyrighted works violation",
			summary: "Cảnh báo: Linking to copyrighted works violation"
		},
		"cb-copyright-new": {
			label: "Copyright violation (with explanation for new users)",
			summary: "Thông báo: Avoiding copyright problems",
			heading: "Wikipedia and copyright"
		},
		"cb-copyright-remove": {
			label: "Removing {{copyvio}} template from articles",
			summary: "Cảnh báo: Removing {{copyvio}} templates"
		},
		"cb-efsummary": {
			label: "Edit summary triggering the edit filter",
			summary: "Cảnh báo: Edit summary triggering the edit filter"
		},
		"cb-ew": {
			label: "Edit warring (stronger wording)",
			summary: "Cảnh báo: Edit warring"
		},
		"cb-ewsoft": {
			label: "Edit warring (softer wording for newcomers)",
			summary: "Cảnh báo: Edit warring"
		},
		"cb-hoax": {
			label: "Creating hoaxes",
			summary: "Cảnh báo: Creating hoaxes"
		},
		"cb-legal": {
			label: "Making legal threats",
			summary: "Cảnh báo: Making legal threats"
		},
		"cb-login": {
			label: "Editing while logged out",
			summary: "Cảnh báo: Editing while logged out"
		},
		"cb-multipleIPs": {
			label: "Usage of multiple IPs",
			summary: "Cảnh báo: Usage of multiple IPs"
		},
		"cb-pinfo": {
			label: "Personal info",
			summary: "Cảnh báo: Personal info"
		},
		"cb-salt": {
			label: "Recreating salted articles under a different title",
			summary: "Cảnh báo: Recreating creation-protected articles under a different title"
		},
		"cb-socksuspect": {
			label: "Sockpuppetry",
			summary: "Cảnh báo: You are a suspected [[WP:SOCK|sockpuppet]]"  // of User:...
		},
		"cb-upv": {
			label: "Userpage vandalism",
			summary: "Cảnh báo: Userpage vandalism"
		},
		"cb-username": {
			label: "Tên không theo quy định",
			summary: "Cảnh báo: Tên người dùng của bạn không được chấp nhận",
			suppressArticleInSummary: true  // not relevant for this template
		},
		"cb-coi-username": {
			label: "Username is against policy, and conflict of interest",
			summary: "Cảnh báo: Username and conflict of interest policy",
			heading: "Your username"
		},
		"cb-userpage": {
			label: "Userpage or subpage is against policy",
			summary: "Cảnh báo: Userpage or subpage is against policy"
		},
		"cb-wrongsummary": {
			label: "Using inaccurate or inappropriate edit summaries",
			summary: "Cảnh báo: Using inaccurate or inappropriate edit summaries"
		}
	}
};

Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if( old_subvalue ) {
		old_subvalue = old_subvalue.replace(/\d*(im)?$/, '' );
		old_subvalue_re = new RegExp( mw.RegExp.escape( old_subvalue ) + "(\\d*(?:im)?)$" );
	}

	while( sub_group.hasChildNodes() ){
		sub_group.removeChild( sub_group.firstChild );
	}

	// worker function to create the combo box entries
	var createEntries = function( contents, container, wrapInOptgroup ) {
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if ( wrapInOptgroup && $.client.profile().platform === "iphone" ) {
			var wrapperOptgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: 'Các bản mẫu có sẵn'
			} );
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild( wrapperOptgroup );
			container = wrapperOptgroup;
		}

		$.each( contents, function( itemKey, itemProperties ) {
			var key = (typeof itemKey === "string") ? itemKey : itemProperties.value;

			var selected = false;
			if( old_subvalue && old_subvalue_re.test( key ) ) {
				selected = true;
			}

			var elem = new Morebits.quickForm.element( {
				type: 'option',
				label: "{{" + key + "}}: " + itemProperties.label,
				value: key,
				selected: selected
			} );
			var elemRendered = container.appendChild( elem.render() );
			$(elemRendered).data("messageData", itemProperties);
		} );
	};

	if( value === "singlenotice" || value === "singlewarn" ) {
		// no categories, just create the options right away
		createEntries( Twinkle.warn.messages[ value ], sub_group, true );
	} else if( value === "custom" ) {
		createEntries( Twinkle.getPref("customWarningList"), sub_group, true );
	} else {
		// create the option-groups
		$.each( Twinkle.warn.messages[ value ], function( groupLabel, groupContents ) {
			var optgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: groupLabel
			} );
			optgroup = optgroup.render();
			sub_group.appendChild( optgroup );
			// create the options
			createEntries( groupContents, optgroup, false );
		} );
	}

	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);

	// hide the big red notice
	$("#tw-warn-red-notice").remove();
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	if( main_group === 'singlenotice' || main_group === 'singlewarn' ) {
		if( value === 'cb-bite' || value === 'cb-username' || value === 'cb-socksuspect' ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';
		} else if( e.target.form.article.notArticle ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
		}
	}

	// change form labels according to the warning selected
	if (value === "cb-socksuspect") {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
		Morebits.quickForm.overrideElementLabel(e.target.form.article, "Username of sock master, if known (without User:) ");
	} else if (value === "cb-username") {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
		Morebits.quickForm.overrideElementLabel(e.target.form.article, "Username violates policy because... ");
	} else if (value === "cb-bite") {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
		Morebits.quickForm.overrideElementLabel(e.target.form.article, "Username of 'bitten' user (without User:) ");
	} else {
		Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
		Morebits.quickForm.resetElementLabel(e.target.form.article);
	}

	// add big red notice, warning users about how to use {{cb-[coi-]username}} appropriately
	$("#tw-warn-red-notice").remove();

	var $redWarning;
	if (value === "cb-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{cb-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{cb-username}} should only be used in edge cases in order to engage in discussion with the user.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	} else if (value === "cb-coi-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{cb-coi-username}} should <b>not</b> be used for <b>blatant</b> username policy violations. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{cb-coi-username}} should only be used in edge cases in order to engage in discussion with the user.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	}
};

Twinkle.warn.callbacks = {
	getWarningWikitext: function(templateName, article, reason, isCustom) {
		var text = "{{subst:" + templateName;

		if (article) {
			// add linked article for user warnings
			text += '|1=' + article;
		}
		if (reason && !isCustom) {
			// add extra message
			if (templateName === 'cb-csd' || templateName === 'cb-probation' ||
				templateName === 'cb-userspacenoindex' || templateName === 'cb-userpage') {
				text += "|3=''" + reason + "''";
			} else {
				text += "|2=''" + reason + "''";
			}
		}
		text += '}}';

		if (reason && isCustom) {
			// we assume that custom warnings lack a {{{2}}} parameter
			text += " ''" + reason + "''";
		}

		return text;
	},
	preview: function(form) {
		var templatename = form.sub_group.value;
		var linkedarticle = form.article.value;
		var templatetext;

		templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle,
			form.reason.value, form.main_group.value === 'custom');

		form.previewer.beginRender(templatetext);
	},
	main: function( pageobj ) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var messageData = params.messageData;

		var history_re = /<!-- Template:(cb-.*?) -->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4}) \(UTC\)/g;
		var history = {};
		var latest = { date: new Date( 0 ), type: '' };
		var current;

		while( ( current = history_re.exec( text ) ) ) {
			var current_date = new Date( current[2] + ' UTC' );
			if( !( current[1] in history ) ||  history[ current[1] ] < current_date ) {
				history[ current[1] ] = current_date;
			}
			if( current_date > latest.date ) {
				latest.date = current_date;
				latest.type = current[1];
			}
		}

		var date = new Date();

		if( params.sub_group in history ) {
			var temp_time = new Date( history[ params.sub_group ] );
			temp_time.setUTCHours( temp_time.getUTCHours() + 24 );

			if( temp_time > date ) {
				if( !confirm( "An identical " + params.sub_group + " has been issued in the last 24 hours.  \nWould you still like to add this warning/notice?" ) ) {
					pageobj.statelem.info( 'aborted per user request' );
					return;
				}
			}
		}

		latest.date.setUTCMinutes( latest.date.getUTCMinutes() + 1 ); // after long debate, one minute is max

		if( latest.date > date ) {
			if( !confirm( "A " + latest.type + " has been issued in the last minute.  \nWould you still like to add this warning/notice?" ) ) {
				pageobj.statelem.info( 'aborted per user request' );
				return;
			}
		}

		var dateHeaderRegex = new RegExp( "^==+\\s*(?:" + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +
			")\\s+" + date.getUTCFullYear() + "\\s*==+", 'mg' );
		var dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec( text )) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf( "\n==" ) + 1;

		if( text.length > 0 ) {
			text += "\n\n";
		}

		if( messageData.heading ) {
			text += "== " + messageData.heading + " ==\n";
		} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
			Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
			text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
		}
		text += Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article,
			params.reason, params.main_group === 'custom') + " ~~~~";

		if ( Twinkle.getPref('showSharedIPNotice') && Morebits.isIPAddress( mw.config.get('wgTitle') ) ) {
			Morebits.status.info( 'Info', 'Đang thêm thông báo cho IP chung' );
			text +=  "\n{{thế:Khuyên IP chung}}";
		}

		// build the edit summary
		var summary;
		if( params.main_group === 'custom' ) {
			switch( params.sub_group.substr( -1 ) ) {
				case "1":
					summary = "Thông báo chung";
					break;
				case "2":
					summary = "Chú ý";
					break;
				case "3":
					summary = "Cảnh báo";
					break;
				case "4":
					summary = "Cảnh báo cuối cùng";
					break;
				case "m":
					if( params.sub_group.substr( -3 ) === "4im" ) {
						summary = "Cảnh báo duy nhất";
						break;
					}
					summary = "Thông báo";
					break;
				default:
					summary = "Thông báo";
					break;
			}
			summary += ": " + Morebits.string.toUpperCaseFirstChar(messageData.label);
		} else {
			summary = messageData.summary;
			if ( messageData.suppressArticleInSummary !== true && params.article ) {
				if ( params.sub_group === "cb-socksuspect" ) {  // this template requires a username
					summary += " của [[Thành viên:" + params.article + "]]";
				} else {
					summary += " tại trang [[" + params.article + "]]";
				}
			}
		}
		summary += "." + Twinkle.getPref("summaryAd");

		pageobj.setPageText( text );
		pageobj.setEditSummary( summary );
		pageobj.setWatchlist( Twinkle.getPref('watchWarnings') );
		pageobj.save();
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {
	var userTalkPage = 'Thảo_luận_Thành_viên:' + mw.config.get('wgRelevantUserName');

	// First, check to make sure a reason was filled in if cb-username was selected

	if(e.target.sub_group.value === 'cb-username' && e.target.article.value.trim() === '') {
		alert("Bạn phải đưa lý do sử dụng bản mẫu {{Yêu cầu đổi tên}}.");
		return;
	}

	// Find the selected <option> element so we can fetch the data structure
	var selectedEl = $(e.target.sub_group).find('option[value="' + $(e.target.sub_group).val() + '"]');

	// Then, grab all the values provided by the form
	var params = {
		reason: e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value,  // .replace( /^(Image|Category):/i, ':$1:' ),  -- apparently no longer needed...
		messageData: selectedEl.data("messageData")
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = "Cảnh báo hoàn tất, tải lại trang thảo luận trong vài giây";

	var wikipedia_page = new Morebits.wiki.page( userTalkPage, 'Sửa trang thảo luận thành viên' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.warn.callbacks.main );
};
})(jQuery);


//</nowiki>
