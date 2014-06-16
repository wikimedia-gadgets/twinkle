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
	if( mw.config.get('wgNamespaceNumber') === 3 ) {
			Twinkle.addPortletLink( Twinkle.warn.callback, "Cảnh báo", "tw-warn", "Cảnh báo/thông báo thành viên" );
	}

	// modify URL of talk page on rollback success pages
	if( mw.config.get('wgAction') === 'rollback' ) {
		var $vandalTalkLink = $("#mw-rollback-success").find(".mw-usertoollinks a").first();
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
};

Twinkle.warn.callback = function twinklewarnCallback() {
	if( mw.config.get('wgTitle').split( '/' )[0] === mw.config.get('wgUserName') &&
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
		main_group.append( { type: 'option', label: 'Custom warnings', value: 'custom', selected: ( defaultGroup === 9 ) } );
	}
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		main_group.append( { type: 'option', label: 'Cấm', value: 'block', selected: ( defaultGroup === 8 ) } );
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
				label: "Thử nghiệm",
				summary: "Thông báo: thử nghiệm"
			},
			"cb-xóa1": {
				label: "Xóa nội dung, tẩy trống trang",
				summary: "Thông báo: Xóa nội dung, tẩy trống trang"
			}
		},
		"Behavior in articles": {
			"cb-biog1": {
				label: "Adding unreferenced controversial information about living persons",
				summary: "Thông báo: Adding unreferenced controversial information about living persons"
			},
			"cb-defam1": {
				label: "Addition of defamatory content",
				summary: "Thông báo: Addition of defamatory content"
			},
			"cb-error1": {
				label: "Introducing deliberate factual errors",
				summary: "Thông báo: Introducing factual errors"
			},
			"cb-genre1": {
				label: "Frequent or mass changes to genres without consensus or references",
				summary: "Thông báo: Frequent or mass changes to genres without consensus or references"
			},
			"cb-image1": {
				label: "Image-related vandalism in articles",
				summary: "Thông báo: Image-related vandalism in articles"
			},
			"cb-nghịch thử": {
				label: "Nghịch thử",
				summary: "Thông báo: Nghịch thử"
			},
			"cb-nor1": {
				label: "Adding original research, including unpublished syntheses of sources",
				summary: "Thông báo: Adding original research, including unpublished syntheses of sources"
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
				label: "Addition of unsourced or improperly cited material",
				summary: "Thông báo: Addition of unsourced or improperly cited material"
			}
		},
		"Promotions and spam": {
			"cb-qc1": {
				label: "Dùng Wikipedia để quảng cáo hoặc quảng bá",
				summary: "Thông báo: Dùng Wikipedia để quảng cáo hoặc quảng bá"
			},
			"cb-npov1": {
				label: "Not adhering to neutral point of view",
				summary: "Thông báo: Not adhering to neutral point of view"
			},
			"cb-spam1": {
				label: "Chèn liên kết spam",
				summary: "Thông báo: Chèn liên kết spam"
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
				label: "Dời thông báo xóa hình",
				summary: "Thông báo: Dời thông báo xóa hình"
			},
			"cb-speedy1": {
				label: "Removing speedy deletion tags",
				summary: "Thông báo: Removing speedy deletion tags"
			}
		},
		"Other": {
			"cb-chat1": {
				label: "Using talk page as forum",
				summary: "Thông báo: Using talk page as forum"
			},
			"cb-create1": {
				label: "Creating inappropriate pages",
				summary: "Thông báo: Creating inappropriate pages"
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
				label: "Uploading unencyclopedic images",
				summary: "Thông báo: Uploading unencyclopedic images"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-redirect1": {
				label: "Creating malicious redirects",
				summary: "Thông báo: Creating malicious redirects"
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
			"cb-test2": {
				label: "Sửa đổi thử nghiệm",
				summary: "Chú ý: Sửa đổi thử nghiệm"
			},
			"cb-delete2": {
				label: "Xóa nội dung, tẩy trống trang",
				summary: "Chú ý: Xóa nội dung, tẩy trống trang"
			}
		},
		"Behavior in articles": {
			"cb-biog2": {
				label: "Adding unreferenced controversial information about living persons",
				summary: "Chú ý: Adding unreferenced controversial information about living persons"
			},
			"cb-defam2": {
				label: "Addition of defamatory content",
				summary: "Chú ý: Addition of defamatory content"
			},
			"cb-error2": {
				label: "Introducing deliberate factual errors",
				summary: "Chú ý: Introducing factual errors"
			},
			"cb-genre2": {
				label: "Frequent or mass changes to genres without consensus or references",
				summary: "Chú ý: Frequent or mass changes to genres without consensus or references"
			},
			"cb-image2": {
				label: "Image-related vandalism in articles",
				summary: "Chú ý: Image-related vandalism in articles"
			},
			"cb-joke2": {
				label: "Using improper humor in articles",
				summary: "Chú ý: Using improper humor in articles"
			},
			"cb-nor2": {
				label: "Adding original research, including unpublished syntheses of sources",
				summary: "Chú ý: Adding original research, including unpublished syntheses of sources"
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
				label: "Removal of maintenance templates",
				summary: "Chú ý: Removal of maintenance templates"
			},
			"cb-unsourced2": {
				label: "Addition of unsourced or improperly cited material",
				summary: "Chú ý: Addition of unsourced or improperly cited material"
			}
		},
		"Promotions and spam": {
			"cb-qc2": {
				label: "Không sử dụng Wikipedia để quảng cáo hay quảng bá",
				summary: "Chú ý: Không sử dụng Wikipedia để quảng cáo hay quảng bá"
			},
			"cb-npov2": {
				label: "Văn phong không trung lập",
				summary: "Chú ý: Văn phong không trung lập"
			},
			"cb-spam2": {
				label: "Không chèn liên kết spam",
				summary: "Chú ý: Không chèn liên kết spam"
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
				label: "Removing file deletion tags",
				summary: "Chú ý: Removing file deletion tags"
			},
			"cb-speedy2": {
				label: "Removing speedy deletion tags",
				summary: "Chú ý: Removing speedy deletion tags"
			}
		},
		"Other": {
			"cb-chat2": {
				label: "Using talk page as forum",
				summary: "Chú ý: Using talk page as forum"
			},
			"cb-create2": {
				label: "Creating inappropriate pages",
				summary: "Chú ý: Creating inappropriate pages"
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
				label: "Uploading unencyclopedic images",
				summary: "Chú ý: Uploading unencyclopedic images"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-redirect2": {
				label: "Creating malicious redirects",
				summary: "Chú ý: Creating malicious redirects"
			},
			"cb-ics2": {
				label: "Uploading files missing copyright status",
				summary: "Chú ý: Uploading files missing copyright status"
			},
			"cb-af2": {
				label: "Inappropriate feedback through the Article Feedback Tool",
				summary: "Chú ý: Inappropriate feedback through the Article Feedback Tool"
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
				label: "Thử nghiệm",
				summary: "Cảnh báo: Thử nghiệm"
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
			"cb-defam3": {
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
			"cb-af3": {
				label: "Inappropriate feedback through the Article Feedback Tool",
				summary: "Cảnh báo: Inappropriate feedback through the Article Feedback Tool"
			},
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
			"cb-generic4": {
				label: "Generic warning (for template series missing level 4)",
				summary: "Cảnh báo cuối cùng"
			},
			"cb-ph4": {
				label: "Phá hoại",
				summary: "Cảnh báo cuối cùng: Phá hoại"
			},
			"cb-xóa4": {
				label: "Removal of content, blanking",
				summary: "Cảnh báo cuối cùng: Removal of content, blanking"
			}
		},
		"Behavior in articles": {
			"cb-biog4": {
				label: "Adding unreferenced defamatory information about living persons",
				summary: "Cảnh báo cuối cùng: Adding unreferenced controversial information about living persons"
			},
			"cb-defam4": {
				label: "Addition of defamatory content",
				summary: "Cảnh báo cuối cùng: Addition of defamatory content"
			},
			"cb-error4": {
				label: "Introducing deliberate factual errors",
				summary: "Cảnh báo cuối cùng: Introducing deliberate factual errors"
			},
			"cb-genre4": {
				label: "Frequent or mass changes to genres without consensus or reference",
				summary: "Cảnh báo cuối cùng: Frequent or mass changes to genres without consensus or reference"
			},
			"cb-image4": {
				label: "Image-related vandalism in articles",
				summary: "Cảnh báo cuối cùng: Image-related vandalism in articles"
			},
			"cb-joke4": {
				label: "Using improper humor in articles",
				summary: "Cảnh báo cuối cùng: Using improper humor in articles"
			},
			"cb-nor4": {
				label: "Adding original research, including unpublished syntheses of sources",
				summary: "Cảnh báo cuối cùng: Adding original research, including unpublished syntheses of sources"
			},
			"cb-tdel4": {
				label: "Removal of maintenance templates",
				summary: "Cảnh báo cuối cùng: Removal of maintenance templates"
			},
			"cb-unsourced4": {
				label: "Addition of unsourced or improperly cited material",
				summary: "Cảnh báo cuối cùng: Addition of unsourced or improperly cited material"
			}
		},
		"Promotions and spam": {
			"cb-advert4": {
				label: "Using Wikipedia for advertising or promotion",
				summary: "Cảnh báo cuối cùng: Using Wikipedia for advertising or promotion"
			},
			"cb-npov4": {
				label: "Not adhering to neutral point of view",
				summary: "Cảnh báo cuối cùng: Not adhering to neutral point of view"
			},
			"cb-spam4": {
				label: "Adding spam links",
				summary: "Cảnh báo cuối cùng: Adding spam links"
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
				label: "Removing file deletion tags",
				summary: "Cảnh báo cuối cùng: Removing file deletion tags"
			},
			"cb-speedy4": {
				label: "Removing speedy deletion tags",
				summary: "Cảnh báo cuối cùng: Removing speedy deletion tags"
			}
		},
		"Other": {
			"cb-chat4": {
				label: "Using talk page as forum",
				summary: "Cảnh báo cuối cùng: Using talk page as forum"
			},
			"cb-create4": {
				label: "Creating inappropriate pages",
				summary: "Cảnh báo cuối cùng: Creating inappropriate pages"
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
				label: "Uploading unencyclopedic images",
				summary: "Cảnh báo cuối cùng: Uploading unencyclopedic images"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-redirect4": {
				label: "Creating malicious redirects",
				summary: "Cảnh báo cuối cùng: Creating malicious redirects"
			},
			"cb-ics4": {
				label: "Uploading files missing copyright status",
				summary: "Cảnh báo cuối cùng: Uploading files missing copyright status"
			},
			"cb-af4": {
				label: "Inappropriate feedback through the Article Feedback Tool",
				summary: "Cảnh báo cuối cùng: Inappropriate feedback through the Article Feedback Tool"
			}
		}*/
	},


	level4im: {
		"Common warnings": {
			"cb-ph4im": {
				label: "Vandalism",
				summary: "Only warning: Vandalism"
			},
			"cb-xóa4im": {
				label: "Removal of content, blanking",
				summary: "Only warning: Removal of content, blanking"
			}
		},
		"Behavior in articles": {
			"cb-biog4im": {
				label: "Adding unreferenced defamatory information about living persons",
				summary: "Only warning: Adding unreferenced controversial information about living persons"
			},
			"cb-defam4im": {
				label: "Addition of defamatory content",
				summary: "Only warning: Addition of defamatory content"
			},
			"cb-image4im": {
				label: "Image-related vandalism",
				summary: "Only warning: Image-related vandalism"
			},
			"cb-joke4im": {
				label: "Using improper humor",
				summary: "Only warning: Using improper humor"
			},
			"cb-own4im": {
				label: "Ownership of articles",
				summary: "Only warning: Ownership of articles"
			}
		},
		"Promotions and spam": {
			"cb-qc4im": {
				label: "Using Wikipedia for advertising or promotion",
				summary: "Only warning: Using Wikipedia for advertising or promotion"
			},
			"cb-spam4im": {
				label: "Adding spam links",
				summary: "Only warning: Adding spam links"
			}
		},
		"Behavior towards other editors": {
			"cb-harass4im": {
				label: "Harassment of other users",
				summary: "Only warning: Harassment of other users"
			},
			"cb-npa4im": {
				label: "Personal attack directed at a specific editor",
				summary: "Only warning: Personal attack directed at a specific editor"
			}
		},
		"Other": {
			"cb-create4im": {
				label: "Creating inappropriate pages",
				summary: "Only warning: Creating inappropriate pages"
			},
			"cb-move4im": {
				label: "Page moves against naming conventions or consensus",
				summary: "Only warning: Page moves against naming conventions or consensus"
			},
			"cb-upload4im": {
				label: "Uploading unencyclopedic images",
				summary: "Only warning: Uploading unencyclopedic images"
			}
		}/*,
		"To be removed from Twinkle": {
			"cb-af4im": {
				label: "Inappropriate feedback through the Article Feedback Tool",
				summary: "Only warning: Inappropriate feedback through the Article Feedback Tool"
			},
			"cb-redirect4im": {
				label: "Creating malicious redirects",
				summary: "Only warning: Creating malicious redirects"
			}
		}*/
	},


	singlenotice: {
		"cb-2redirect": {
			label: "Creating double redirects through bad page moves",
			summary: "Notice: Creating double redirects through bad page moves"
		},
		"cb-af-contact": {
			label: "Attempting to contact the subject of an article via article feedback",
			summary: "Notice: Contacting the subject of an article via article feedback"
		},
		"cb-af-personalinfo": {
			label: "Including personal info in article feedback",
			summary: "Notice: Including personal info in article feedback"
		},
		"cb-af-question": {
			label: "Asking questions in article feedback",
			summary: "Notice: Asking questions in article feedback"
		},
		"cb-aiv": {
			label: "Bad AIV report",
			summary: "Notice: Bad AIV report"
		},
		"cb-articlesig": {
			label: "Adding signatures to article space",
			summary: "Notice: Adding signatures to article space"
		},
		"cb-autobiography": {
			label: "Creating autobiographies",
			summary: "Notice: Creating autobiographies"
		},
		"cb-badcat": {
			label: "Adding incorrect categories",
			summary: "Notice: Adding incorrect categories"
		},
		"cb-badlistentry": {
			label: "Adding inappropriate entries to lists",
			summary: "Notice: Adding inappropriate entries to lists"
		},
		"cb-bite": {
			label: "\"Biting\" newcomers",
			summary: "Notice: \"Biting\" newcomers",
			suppressArticleInSummary: true  // non-standard (user name, not article), and not necessary
		},
		"cb-coi": {
			label: "Conflict of interest",
			summary: "Notice: Conflict of interest",
			heading: "Managing a conflict of interest"
		},
		"cb-controversial": {
			label: "Introducing controversial material",
			summary: "Notice: Introducing controversial material"
		},
		"cb-copying": {
			label: "Copying text to another page",
			summary: "Notice: Copying text to another page"
		},
		"cb-crystal": {
			label: "Adding speculative or unconfirmed information",
			summary: "Notice: Adding speculative or unconfirmed information"
		},
		"cb-csd": {
			label: "Speedy deletion declined",
			summary: "Notice: Speedy deletion declined"
		},
		"cb-c&pmove": {
			label: "Cut and paste moves",
			summary: "Notice: Cut and paste moves"
		},
		"cb-dab": {
			label: "Incorrect edit to a disambiguation page",
			summary: "Notice: Incorrect edit to a disambiguation page"
		},
		"cb-date": {
			label: "Unnecessarily changing date formats",
			summary: "Notice: Unnecessarily changing date formats"
		},
		"cb-deadlink": {
			label: "Removing proper sources containing dead links",
			summary: "Notice: Removing proper sources containing dead links"
		},
		"cb-directcat": {
			label: "Applying stub categories manually",
			summary: "Notice: Applying stub categories manually"
		},
		"cb-draftfirst": {
			label: "User should draft in userspace without the risk of speedy deletion",
			summary: "Notice: Consider drafting your article in [[Help:Userspace draft|userspace]]"
		},
		"cb-editsummary": {
			label: "Not using edit summary",
			summary: "Notice: Not using edit summary"
		},
		"cb-english": {
			label: "Not communicating in English",
			summary: "Notice: Not communicating in English"
		},
		"cb-fuir": {
			label: "Fair use image has been removed from your userpage",
			summary: "Notice: A fair use image has been removed from your userpage"
		},
		"cb-hasty": {
			label: "Hasty addition of speedy deletion tags",
			summary: "Notice: Allow creators time to improve their articles before tagging them for deletion"
		},
		"cb-imageuse": {
			label: "Incorrect image linking",
			summary: "Notice: Incorrect image linking"
		},
		"cb-incompleteAFD": {
			label: "Incomplete AFD",
			summary: "Notice: Incomplete AFD"
		},
		"cb-inline-el": {
			label: "Adding external links to the body of an article",
			summary: "Notice: Keep external links to External links sections at the bottom of an article"
		},
		"cb-italicize": {
			label: "Italicize books, films, albums, magazines, TV series, etc within articles",
			summary: "Notice: Italicize books, films, albums, magazines, TV series, etc within articles"
		},
		"cb-lang": {
			label: "Unnecessarily changing between British and American English",
			summary: "Notice: Unnecessarily changing between British and American English",
			heading: "National varieties of English"
		},
		"cb-linking": {
			label: "Excessive addition of redlinks or repeated blue links",
			summary: "Notice: Excessive addition of redlinks or repeated blue links"
		},
		"cb-minor": {
			label: "Incorrect use of minor edits check box",
			summary: "Notice: Incorrect use of minor edits check box"
		},
		"cb-nonfree": {
			label: "Uploading replaceable non-free images",
			summary: "Notice: Uploading replaceable non-free images"
		},
		"cb-notaiv": {
			label: "Do not report complex abuse to AIV",
			summary: "Notice: Do not report complex abuse to AIV"
		},
		"cb-notenglish": {
			label: "Creating non-English articles",
			summary: "Notice: Creating non-English articles"
		},
		"cb-notifysd": {
			label: "Notify authors of speedy deletion tagged articles",
			summary: "Notice: Please notify authors of articles tagged for speedy deletion"
		},
		"cb-notvand": {
			label: "Mislabelling edits as vandalism",
			summary: "Notice: Misidentifying edits as vandalism"
		},
		"cb-notvote": {
			label: "We use consensus, not voting",
			summary: "Notice: We use consensus, not voting"
		},
		"cb-patrolled": {
			label: "Mark newpages as patrolled when patrolling",
			summary: "Notice: Mark newpages as patrolled when patrolling"
		},
		"cb-plagiarism": {
			label: "Copying from public domain sources without attribution",
			summary: "Notice: Copying from public domain sources without attribution"
		},
		"cb-preview": {
			label: "Use preview button to avoid mistakes",
			summary: "Notice: Use preview button to avoid mistakes"
		},
		"cb-probation": {
			label: "Article is on probation",
			summary: "Notice: Article is on probation"
		},
		"cb-redlink": {
			label: "Indiscriminate removal of redlinks",
			summary: "Notice: Be careful when removing redlinks"
		},
		"cb-refimprove": {
			label: "Creating unverifiable articles",
			summary: "Notice: Creating unverifiable articles"
		},
		"cb-removevandalism": {
			label: "Incorrect vandalism removal",
			summary: "Notice: Incorrect vandalism removal"
		},
		"cb-repost": {
			label: "Recreating material previously deleted via XfD process",
			summary: "Notice: Recreating previously deleted material"
		},
		"cb-salt": {
			label: "Recreating salted articles under a different title",
			summary: "Notice: Recreating salted articles under a different title"
		},
		"cb-samename": {
			label: "Rename request impossible",
			summary: "Notice: Rename request impossible"
		},
		"cb-selfrevert": {
			label: "Reverting self tests",
			summary: "Notice: Reverting self tests"
		},
		"cb-socialnetwork": {
			label: "Wikipedia is not a social network",
			summary: "Notice: Wikipedia is not a social network"
		},
		"cb-sofixit": {
			label: "Be bold and fix things yourself",
			summary: "Notice: You can be bold and fix things yourself"
		},
		"cb-spoiler": {
			label: "Adding spoiler alerts or removing spoilers from appropriate sections",
			summary: "Notice: Don't delete or flag potential 'spoilers' in Wikipedia articles"
		},
		"cb-subst": {
			label: "Remember to subst: templates",
			summary: "Notice: Remember to subst: templates"
		},
		"cb-talkinarticle": {
			label: "Talk in article",
			summary: "Notice: Talk in article"
		},
		"cb-tilde": {
			label: "Not signing posts",
			summary: "Notice: Not signing posts"
		},
		"cb-toppost": {
			label: "Posting at the top of talk pages",
			summary: "Notice: Posting at the top of talk pages"
		},
		"cb-uaa": {
			label: "Reporting of username to WP:UAA not accepted",
			summary: "Notice: Reporting of username to WP:UAA not accepted"
		},
		"cb-upincat": {
			label: "Accidentally including user page/subpage in a content category",
			summary: "Notice: Informing user that one of his/her pages had accidentally been included in a content category"
		},
		"cb-uploadfirst": {
			label: "Attempting to display an external image on a page",
			summary: "Notice: Attempting to display an external image on a page"
		},
		"cb-userspace draft finish": {
			label: "Stale userspace draft",
			summary: "Notice: Stale userspace draft"
		},
		"cb-userspacenoindex": {
			label: "User page/subpage isn't appropriate for search engine indexing",
			summary: "Notice: User (sub)page isn't appropriate for search engine indexing"
		},
		"cb-vgscope": {
			label: "Adding video game walkthroughs, cheats or instructions",
			summary: "Notice: Adding video game walkthroughs, cheats or instructions"
		},
		"cb-warn": {
			label: "Place user warning templates when reverting vandalism",
			summary: "Notice: You can use user warning templates when reverting vandalism"
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
		"cb-attempt": {
			label: "Triggering the edit filter",
			summary: "Cảnh báo: Triggering the edit filter"
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
			summary: "Notice: Avoiding copyright problems",
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
		"cb-longterm": {
			label: "Long term pattern of vandalism",
			summary: "Cảnh báo: Long term pattern of vandalism"
		},
		"cb-multipleIPs": {
			label: "Usage of multiple IPs",
			summary: "Cảnh báo: Usage of multiple IPs"
		},
		"cb-pinfo": {
			label: "Personal info",
			summary: "Cảnh báo: Personal info"
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
	},


	block: {
		"cb-cấm": {
			label: "Cấm",
			summary: "Bạn đã bị cấm sửa đổi",
			pageParam: true,
			reasonParam: true,  // allows editing of reason for generic templates
			suppressArticleInSummary: true
		},
		"cb-blocknotalk": {
			label: "Block - talk page disabled",
			summary: "You have been blocked from editing and your user talk page has been disabled",
			pageParam: true,
			reasonParam: true,
			suppressArticleInSummary: true
		},
		"cb-blockindef": {
			label: "Block - indefinite",
			summary: "You have been indefinitely blocked from editing",
			indefinite: true,
			pageParam: true,
			reasonParam: true,
			suppressArticleInSummary: true
		},
		"cb-ablock": {
			label: "Block - IP address",
			summary: "Your IP address has been blocked from editing",
			pageParam: true,
			suppressArticleInSummary: true
		},
		"cb-cấm-phá hoại": {
			label: "Vandalism block",
			summary: "You have been blocked from editing for persistent [[WP:VAND|vandalism]]",
			pageParam: true
		},
		"cb-cấm-tk chỉ phá": {
			label: "Vandalism-only account block (indefinite)",
			summary: "Bạn đã bị cấm sửa đổi do tài khoản của bạn chỉ dùng để [[Wikipedia:Phá hoại|phá hoại]]",
			indefinite: true,
			pageParam: true
		},
		"cb-bioblock": {
			label: "BLP violations block",
			summary: "You have been blocked from editing for violations of Wikipedia's [[WP:BLP|biographies of living persons policy]]",
			pageParam: true
		},
		"cb-cấm-spam": {
			label: "Spam block",
			summary: "Tài khoản của bạn đã bị khóa sửa đổi Wikipedia để [[WP:SPAM|spam]]"
		},
		"cb-adblock": {
			label: "Advertising block",
			summary: "You have been blocked from editing for [[WP:SOAP|advertising or self-promotion]]",
			pageParam: true
		},
		"cb-soablock": {
			label: "Spam/advertising-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam, advertising, or promotion]]",
			indefinite: true,
			pageParam: true
		},
		"cb-npblock": {
			label: "Creating nonsense pages block",
			summary: "You have been blocked from editing for creating [[WP:PN|nonsense pages]]",
			pageParam: true
		},
		"cb-cấm-vpbq": {
			label: "Cấm do vi phạm bản quyền",
			summary: "Bạn đã bị cấm sửa đổi do tiếp tục [[WP:VPBQ|vi phạm bản quyền]]",
			pageParam: true
		},
		"cb-spoablock": {
			label: "Sockpuppet account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SOCK|sock puppetry]]",
			indefinite: true
		},
		"cb-hblock": {
			label: "Harassment block",
			summary: "You have been blocked from editing for attempting to [[WP:HARASS|harass]] other users",
			pageParam: true
		},
		"cb-ewblock": {
			label: "Edit warring block",
			summary: "You have been blocked from editing to prevent further [[WP:DE|disruption]] caused by your engagement in an [[WP:EW|edit war]]",
			pageParam: true
		},
		"cb-3block": {
			label: "Three-revert rule violation block",
			summary: "You have been blocked from editing for violation of the [[WP:3RR|three-revert rule]]",
			pageParam: true
		},
		"cb-disruptblock": {
			label: "Disruptive editing block",
			summary: "You have been blocked from editing for [[WP:DE|disruptive editing]]",
			pageParam: true
		},
		"cb-deoablock": {
			label: "Disruption/trolling-only account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:DE|trolling, disruption or harassment]]",
			indefinite: true,
			pageParam: true
		},
		"cb-lblock": {
			label: "Legal threat block (indefinite)",
			summary: "You have been indefinitely blocked from editing for making [[WP:NLT|legal threats or taking legal action]]",
			indefinite: true
		},
		"cb-aeblock": {
			label: "Arbitration enforcement block",
			summary: "You have been blocked from editing for violating an [[WP:Arbitration|arbitration decision]] with your edits",
			pageParam: true,
			reasonParam: true
		},
		"cb-efblock": {
			label: "Edit filter-related block",
			summary: "You have been blocked from editing for making disruptive edits that repeatedly triggered the [[WP:EF|edit filter]]"
		},
		"cb-myblock": {
			label: "Social networking block",
			summary: "You have been blocked from editing for using user and/or article pages as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]",
			pageParam: true
		},
		"cb-dblock": {
			label: "Deletion/removal of content block",
			summary: "You have been blocked from editing for continued [[WP:VAND|removal of material]]",
			pageParam: true
		},
		"cb-compblock": {
			label: "Possible compromised account block (indefinite)",
			summary: "You have been indefinitely blocked from editing because it is believed that your [[WP:SECURE|account has been compromised]]",
			indefinite: true
		},
		"cb-botblock": {
			label: "Unapproved bot block",
			summary: "You have been blocked from editing because it appears you are running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]",
			pageParam: true
		},
		"cb-ublock": {
			label: "Username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your username is a violation of the [[WP:U|username policy]]",
			indefinite: true,
			reasonParam: true
		},
		"cb-uhblock": {
			label: "Username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]]",
			indefinite: true,
			reasonParam: true
		},
		"cb-softerblock": {
			label: "Promotional username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website",
			indefinite: true
		},
		"cb-causeblock": {
			label: "Promotional username soft block, for charitable causes (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website",
			indefinite: true
		},
		"cb-botublock": {
			label: "Bot username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this is a [[WP:BOT|bot]] account, which is currently not approved",
			indefinite: true
		},
		"cb-memorialblock": {
			label: "Memorial username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this account may be used as a memorial or tribute to someone",
			indefinite: true
		},
		"cb-ublock-famous": {
			label: "Famous username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] matches the name of a well-known living individual",
			indefinite: true
		},
		"cb-ublock-double": {
			label: "Similar username soft block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] is too similar to the username of another Wikipedia user",
			indefinite: true
		},
		"cb-uhblock-double": {
			label: "Username impersonation hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your [[WP:U|username]] appears to impersonate another established Wikipedia user",
			indefinite: true
		},
		"cb-vaublock": {
			label: "Vandalism-only account and username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]] and your username is a blatant violation of the [[WP:U|username policy]]",
			indefinite: true,
			pageParam: true
		},
		"cb-spamublock": {
			label: "Spam-only account and promotional username hard block (indefinite)",
			summary: "You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam or advertising]] and your username is a violation of the [[WP:U|username policy]]",
			indefinite: true
		}
	}
};

Twinkle.warn.prev_block_timer = null;
Twinkle.warn.prev_block_reason = null;
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
		old_subvalue_re = new RegExp( $.escapeRE( old_subvalue ) + "(\\d*(?:im)?)$" );
	}

	while( sub_group.hasChildNodes() ){
		sub_group.removeChild( sub_group.firstChild );
	}

	// worker function to create the combo box entries
	var createEntries = function( contents, container ) {
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

	if( value === "singlenotice" || value === "singlewarn" || value === "block" ) {
		// no categories, just create the options right away
		createEntries( Twinkle.warn.messages[ value ], sub_group );
	} else if( value === "custom" ) {
		createEntries( Twinkle.getPref("customWarningList"), sub_group );
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
			createEntries( groupContents, optgroup );
		} );
	}

	if( value === 'block' ) {
		// create the block-related fields
		var more = new Morebits.quickForm.element( { type: 'div', id: 'block_fields' } );
		more.append( {
			type: 'input',
			name: 'block_timer',
			label: 'Thời gian cấm: ',
			tooltip: 'Thời gian cấm tùy theo trường hợp có thể là 24 giờ, 2 tuần, hoặc vô hạn…'
		} );
		more.append( {
			type: 'input',
			name: 'block_reason',
			label: '"Bạn đã bị cấm do…" ',
			tooltip: 'An optional reason, to replace the default generic reason. Only available for the generic block templates.'
		} );
		e.target.root.insertBefore( more.render(), e.target.root.lastChild );

		// restore saved values of fields
		if(Twinkle.warn.prev_block_timer !== null) {
			e.target.root.block_timer.value = Twinkle.warn.prev_block_timer;
			Twinkle.warn.prev_block_timer = null;
		}
		if(Twinkle.warn.prev_block_reason !== null) {
			e.target.root.block_reason.value = Twinkle.warn.prev_block_reason;
			Twinkle.warn.prev_block_reason = null;
		}
		if(Twinkle.warn.prev_article === null) {
			Twinkle.warn.prev_article = e.target.root.article.value;
		}
		e.target.root.article.disabled = false;

		$(e.target.root.reason).parent().hide();
		e.target.root.previewer.closePreview();
	} else if( e.target.root.block_timer ) {
		// hide the block-related fields
		if(!e.target.root.block_timer.disabled && Twinkle.warn.prev_block_timer === null) {
			Twinkle.warn.prev_block_timer = e.target.root.block_timer.value;
		}
		if(!e.target.root.block_reason.disabled && Twinkle.warn.prev_block_reason === null) {
			Twinkle.warn.prev_block_reason = e.target.root.block_reason.value;
		}

		// hack to fix something really weird - removed elements seem to somehow keep an association with the form
		e.target.root.block_reason = null;

		$(e.target.root).find("#block_fields").remove();

		if(e.target.root.article.disabled && Twinkle.warn.prev_article !== null) {
			e.target.root.article.value = Twinkle.warn.prev_article;
			Twinkle.warn.prev_article = null;
		}
		e.target.root.article.disabled = false;

		$(e.target.root.reason).parent().show();
		e.target.root.previewer.closePreview();
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
	} else if( main_group === 'block' ) {
		if( Twinkle.warn.messages.block[value].indefinite ) {
			if(Twinkle.warn.prev_block_timer === null) {
				Twinkle.warn.prev_block_timer = e.target.form.block_timer.value;
			}
			e.target.form.block_timer.disabled = true;
			e.target.form.block_timer.value = 'indefinite';
		} else if( e.target.form.block_timer.disabled ) {
			if(Twinkle.warn.prev_block_timer !== null) {
				e.target.form.block_timer.value = Twinkle.warn.prev_block_timer;
				Twinkle.warn.prev_block_timer = null;
			}
			e.target.form.block_timer.disabled = false;
		}

		if( Twinkle.warn.messages.block[value].pageParam ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.disabled = false;
		} else if( !e.target.form.article.disabled ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.disabled = true;
			e.target.form.article.value = '';
		}

		if( Twinkle.warn.messages.block[value].reasonParam ) {
			if(Twinkle.warn.prev_block_reason !== null) {
				e.target.form.block_reason.value = Twinkle.warn.prev_block_reason;
				Twinkle.warn.prev_block_reason = null;
			}
			e.target.form.block_reason.disabled = false;
		} else if( !e.target.form.block_reason.disabled ) {
			if(Twinkle.warn.prev_block_reason === null) {
				Twinkle.warn.prev_block_reason = e.target.form.block_reason.value;
			}
			e.target.form.block_reason.disabled = true;
			e.target.form.block_reason.value = '';
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
			// add linked article for user warnings (non-block templates)
			text += '|1=' + article;
		}
		if (reason && !isCustom) {
			// add extra message for non-block templates
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
	getBlockNoticeWikitext: function(templateName, article, blockTime, blockReason, isIndefTemplate) {
		var text = "{{subst:" + templateName;

		if (article && Twinkle.warn.messages.block[templateName].pageParam) {
			text += '|page=' + article;
		}

		if (!/te?mp|^\s*$|min/.exec(blockTime) && !isIndefTemplate) {
			if (/indef|\*|max/.exec(blockTime)) {
				text += '|indef=yes';
			} else {
				text += '|time=' + blockTime;
			}
		}

		if (blockReason) {
			text += '|reason=' + blockReason;
		}

		text += "|sig=true}}";
		return text;
	},
	preview: function(form) {
		var templatename = form.sub_group.value;
		var linkedarticle = form.article.value;
		var templatetext;

		if (templatename in Twinkle.warn.messages.block) {
			templatetext = Twinkle.warn.callbacks.getBlockNoticeWikitext(templatename, linkedarticle, form.block_timer.value,
				form.block_reason.value, Twinkle.warn.messages.block[templatename].indefinite);
		} else {
			templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle, 
				form.reason.value, form.main_group.value === 'custom');
		}

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

		var dateHeaderRegexResult = new RegExp( "^==+\\s*(?:" + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() + 
			")\\s+" + date.getUTCFullYear() + "\\s*==+", 'm' ).exec( text );
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf( "\n==" ) + 1;   

		if( text.length > 0 ) {
			text += "\n\n";
		}

		if( params.main_group === 'block' ) {
			if( Twinkle.getPref('blankTalkpageOnIndefBlock') && params.sub_group !== 'cb-lblock' && ( messageData.indefinite || (/indef|\*|max/).exec( params.block_timer ) ) ) {
				Morebits.status.info( 'Info', 'Blanking talk page per preferences and creating a new level 2 heading for the date' );
				text = "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
				Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}

			text += Twinkle.warn.callbacks.getBlockNoticeWikitext(params.sub_group, params.article, params.block_timer, params.reason, messageData.indefinite);
		} else {
			if( messageData.heading ) {
				text += "== " + messageData.heading + " ==\n";
			} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
				Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
				text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
			}
			text += Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article, 
				params.reason, params.main_group === 'custom') + " ~~~~";
		}

		if ( Twinkle.getPref('showSharedIPNotice') && Morebits.isIPAddress( mw.config.get('wgTitle') ) ) {
			Morebits.status.info( 'Info', 'Adding a shared IP notice' );
			text +=  "\n{{subst:SharedIPAdvice}}";
		}

		// build the edit summary
		var summary;
		if( params.main_group === 'custom' ) {
			switch( params.sub_group.substr( -1 ) ) {
				case "1":
					summary = "General note";
					break;
				case "2":
					summary = "Caution";
					break;
				case "3":
					summary = "Warning";
					break;
				case "4":
					summary = "Final warning";
					break;
				case "m":
					if( params.sub_group.substr( -3 ) === "4im" ) {
						summary = "Only warning";
						break;
					}
					summary = "Notice";
					break;
				default:
					summary = "Notice";
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

	// First, check to make sure a reason was filled in if cb-username was selected

	if(e.target.sub_group.value === 'cb-username' && e.target.article.value.trim() === '') {
		alert("You must supply a reason for the {{cb-username}} template.");
		return;
	}

	// Find the selected <option> element so we can fetch the data structure
	var selectedEl = $(e.target.sub_group).find('option[value="' + $(e.target.sub_group).val() + '"]');

	// Then, grab all the values provided by the form
	var params = {
		reason: e.target.block_reason ? e.target.block_reason.value : e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value,  // .replace( /^(Image|Category):/i, ':$1:' ),  -- apparently no longer needed...
		block_timer: e.target.block_timer ? e.target.block_timer.value : null,
		messageData: selectedEl.data("messageData")
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Cảnh báo hoàn tất, tải lại trang thảo luận trong vài giây";

	var wikipedia_page = new Morebits.wiki.page( mw.config.get('wgPageName'), 'Sửa trang thảo luận thành viên' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.warn.callbacks.main );
};
})(jQuery);


//</nowiki>
