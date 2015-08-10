//<nowiki>


(function($){

var api = new mw.Api(), relevantUserName;

/*
 ****************************************
 *** twinkleblock.js: Block module
 ****************************************
 * Mode of invocation:     Tab ("Block")
 * Active on:              any page with relevant user name (userspace, contribs, etc.)
 * Config directives in:   [soon to be TwinkleConfig]
 */

Twinkle.block = function twinkleblock() {
	// should show on Contributions pages, anywhere there's a relevant user
	if ( Morebits.userIsInGroup('sysop') && mw.config.get('wgRelevantUserName') ) {
		Twinkle.addPortletLink(Twinkle.block.callback, 'Cấm', 'tw-block', 'Cấm người dùng' );
	}
};

Twinkle.block.callback = function twinkleblockCallback() {
	if( mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
			!confirm( 'Bạn sắp tự cấm mình! Bạn có muốn tiếp tục?' ) ) {
		return;
	}

	var Window = new Morebits.simpleWindow( 650, 530 );
	// need to be verbose about who we're blocking
	Window.setTitle( 'Cấm hoặc áp dụng bản mẫu cấm cho ' + mw.config.get('wgRelevantUserName') );
	Window.setScriptName( 'Twinkle' );
	Window.addFooterLink( 'Bản mẫu cấm', 'Bản mẫu:Cb-cấm/doc/Bản mẫu cấm' );
	Window.addFooterLink( 'Quy định cấm', 'WP:BLOCK' );
	Window.addFooterLink( 'Trợ giúp Twinkle', 'en:WP:TW/DOC#block' );

	Twinkle.block.currentBlockInfo = undefined;
	Twinkle.block.field_block_options = {};
	Twinkle.block.field_template_options = {};

	var form = new Morebits.quickForm( Twinkle.block.callback.evaluate );
	var actionfield = form.append( {
			type: 'field',
			label: 'Loại tác vụ'
		} );
	actionfield.append({
			type: 'checkbox',
			name: 'actiontype',
			event: Twinkle.block.callback.change_action,
			list: [
				{
					label: 'Cấm người dùng',
					value: 'block',
					tooltip: 'Block the relevant user with given options.',
					checked: true
				},
				{
					label: 'Add block template to user talk page',
					value: 'template',
					tooltip: 'If the blocking admin forgot to issue a block template, or you have just blocked the user without templating them, you can use this to issue the appropriate template.',
					checked: true
				}
			]
		});

	form.append({ type: 'field', label: 'Preset', name: 'field_preset' });
	form.append({ type: 'field', label: 'Template options', name: 'field_template_options' });
	form.append({ type: 'field', label: 'Block options', name: 'field_block_options' });

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.root = result;

	Twinkle.block.fetchUserInfo(function() {
		// clean up preset data (defaults, etc.), done exactly once, must be before Twinkle.block.callback.change_action is called
		Twinkle.block.transformBlockPresets();

		// init the controls after user and block info have been fetched
		var evt = document.createEvent( 'Event' );
		evt.initEvent( 'change', true, true );
		result.actiontype[0].dispatchEvent( evt );
	});
};

Twinkle.block.fetchUserInfo = function twinkleblockFetchUserInfo(fn) {

	api.get({
		format: 'json',
		action: 'query',
		list: 'blocks|users|logevents',
		letype: 'block',
		lelimit: 1,
		bkusers: mw.config.get('wgRelevantUserName'),
		ususers: mw.config.get('wgRelevantUserName'),
		letitle: 'User:' + mw.config.get('wgRelevantUserName')
	})
	.then(function(data){
		var blockinfo = data.query.blocks[0],
			userinfo = data.query.users[0];

		Twinkle.block.isRegistered = !!userinfo.userid;
		relevantUserName = Twinkle.block.isRegistered ? 'User:' + mw.config.get('wgRelevantUserName') : mw.config.get('wgRelevantUserName');

		if (blockinfo) {
			// handle frustrating system of inverted boolean values
			blockinfo.disabletalk = blockinfo.allowusertalk === undefined;
			blockinfo.hardblock = blockinfo.anononly === undefined;
			Twinkle.block.currentBlockInfo = blockinfo;
		}

		Twinkle.block.hasBlockLog = !!data.query.logevents.length;

		if (typeof fn === 'function') return fn();
	}, function(msg) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		Morebits.status.warn('Error fetching user info', msg);
	});
};

Twinkle.block.callback.saveFieldset = function twinkleblockCallbacksaveFieldset(fieldset) {
	Twinkle.block[$(fieldset).prop('name')] = {};
	$(fieldset).serializeArray().forEach(function(el) {
		Twinkle.block[$(fieldset).prop('name')][el.name] = el.value;
	});
};

Twinkle.block.callback.change_action = function twinkleblockCallbackChangeAction(e) {
	var field_preset, field_template_options, field_block_options, $form = $(e.target.form);

	Twinkle.block.callback.saveFieldset($('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_template_options]'));

	if ($form.find('[name=actiontype][value=block]').is(':checked')) {
		field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Preset', name: 'field_preset' });
		field_preset.append({
				type: 'select',
				name: 'preset',
				label: 'Choose a preset:',
				event: Twinkle.block.callback.change_preset,
				list: Twinkle.block.callback.filtered_block_groups()
			});

		field_block_options = new Morebits.quickForm.element({ type: 'field', label: 'Tùy chọn cấm', name: 'field_block_options' });
		field_block_options.append({ type: 'div', name: 'hasblocklog', label: ' ' });
		field_block_options.append({ type: 'div', name: 'currentblock', label: ' ' });
		field_block_options.append({
				type: 'select',
				name: 'expiry_preset',
				label: 'Thời hạn:',
				event: Twinkle.block.callback.change_expiry,
				list: [
					{ label: 'tùy biến', value: 'custom', selected: true },
					{ label: 'vô hạn', value: 'infinity' },
					{ label: '15 phút', value: '15 minutes' },
					{ label: '1 giờ', value: '1 hour' },
					{ label: '3 giờ', value: '3 hours' },
					{ label: '24 giờ', value: '24 hours' },
					{ label: '48 giờ', value: '48 hours' },
					{ label: '1 tuần', value: '1 week' },
					{ label: '1 tháng', value: '1 month' },
					{ label: '3 tháng', value: '3 months' },
					{ label: '6 tháng', value: '6 months' },
					{ label: '1 năm', value: '1 year' }
				]
			});
			field_block_options.append({
					type: 'input',
					name: 'expiry',
					label: 'Thời hạn tùy biến',
					tooltip: 'Bạn có thể định rõ thời gian tương đối, ví dụ “1 phút” hoặc “19 ngày”, hoặc dấu thời gian tuyệt đối, như “yyyymmddhhmm” (ví dụ “200602011405” là ngày 1 tháng 2 năm 2006 vào lúc 14:05 UTC).',
					value: Twinkle.block.field_block_options.expiry || Twinkle.block.field_template_options.template_expiry
				});
		var blockoptions = [
				{
					checked: Twinkle.block.field_block_options.nocreate,
					label: 'Cấm mở tài khoản',
					name: 'nocreate',
					value: '1'
				},
				{
					checked: Twinkle.block.field_block_options.noemail,
					label: 'Không cho gửi thư điện tử',
					name: 'noemail',
					value: '1'
				},
				{
					checked: Twinkle.block.field_block_options.disabletalk,
					label: 'Không cho người dùng này sửa trang thảo luận thành viên của họ khi bị cấm',
					name: 'disabletalk',
					value: '1'
				}
			];

		if (Twinkle.block.isRegistered) {
			blockoptions.push({
					checked: Twinkle.block.field_block_options.autoblock,
					label: 'Tự động cấm các địa chỉ IP mà thành viên này sử dụng',
					name: 'autoblock',
					value: '1'
				});
		} else {
			blockoptions.push({
					checked: Twinkle.block.field_block_options.hardblock,
					label: 'Ngăn không cho thành viên đã đăng nhập sửa đổi từ địa chỉ IP này',
					name: 'hardblock',
					value: '1'
				});
		}

		blockoptions.push({
				checked: Twinkle.block.field_block_options.watchuser,
				label: 'Theo dõi trang thành viên và thảo luận thành viên của thành viên này',
				name: 'watchuser',
				value: '1'
			});

		field_block_options.append({
				type: 'checkbox',
				name: 'blockoptions',
				list: blockoptions
			});
		field_block_options.append({
				type: 'textarea',
				label: 'Lý do (để ghi vào nhật trình cấm):',
				name: 'reason',
				value: Twinkle.block.field_block_options.reason
			});

		if (Twinkle.block.currentBlockInfo) {
			field_block_options.append( { type: 'hidden', name: 'reblock', value: '1' } );
		}
	}

	if ($form.find('[name=actiontype][value=template]').is(':checked')) {
		field_template_options = new Morebits.quickForm.element({ type: 'field', label: 'Tùy chọn bản mẫu', name: 'field_template_options' });
		field_template_options.append( {
				type: 'select',
				name: 'template',
				label: 'Chọn bản mẫu cho trang thảo luận:',
				event: Twinkle.block.callback.change_template,
				list: Twinkle.block.callback.filtered_block_groups(true),
				value: Twinkle.block.field_template_options.template
			} );
		field_template_options.append( {
				type: 'input',
				name: 'article',
				display: 'none',
				label: 'Bài được liên kết đến',
				value: '',
				tooltip: 'An article can be linked within the notice, perhaps if it was the primary target of disruption. Leave empty for no article to be linked.'
			} );
		if (!$form.find('[name=actiontype][value=block]').is(':checked')) {
			field_template_options.append( {
				type: 'input',
				name: 'template_expiry',
				display: 'none',
				label: 'Thời gian cấm: ',
				value: '',
				tooltip: 'Thời gian cấm tùy theo trường hợp có thể là 24 giờ, 2 tuần, hoặc vô hạn…'
			} );
		}
		field_template_options.append( {
			type: 'input',
			name: 'block_reason',
			label: '"Bạn đã bị cấm do…" ',
			display: 'none',
			tooltip: 'An optional reason, to replace the default generic reason. Only available for the generic block templates.',
			value: Twinkle.block.field_template_options.block_reason
		} );

		if ($form.find('[name=actiontype][value=block]').is(':checked')) {
			field_template_options.append( {
				type: 'checkbox',
				name: 'blank_duration',
				list: [
					{
						label: 'Do not include expiry in template',
						checked: Twinkle.block.field_template_options.blank_duration,
						tooltip: 'Instead of including the duration, make the block template read \"You have been blocked from editing temporarily for...\"'
					}
				]
			} );
		} else {
			field_template_options.append( {
				type: 'checkbox',
				name: 'notalk',
				list: [
					{
						label: 'Talk page access disabled',
						checked: Twinkle.block.field_template_options.notalk,
						tooltip: 'Use this to make the block template state that the user\'s talk page access has been removed'
					}
				]
			} );
		}

		var $previewlink = $( '<a id="twinkleblock-preivew-link">Preview</a>' );
		$previewlink.off('click').on('click', function(){
			Twinkle.block.callback.preview($form[0]);
		});
		$previewlink.css({cursor: 'pointer'});
		field_template_options.append( { type: 'div', id: 'blockpreview', label: [ $previewlink[0] ] } );
		field_template_options.append( { type: 'div', id: 'twinkleblock-previewbox', style: 'display: none' } );
	}

	var oldfield;
	if (field_preset) {
		oldfield = $form.find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_preset"]').hide();
	}
	if (field_block_options) {
		oldfield = $form.find('fieldset[name="field_block_options"]')[0];
		oldfield.parentNode.replaceChild(field_block_options.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_block_options"]').hide();
	}
	if (field_template_options) {
		oldfield = $form.find('fieldset[name="field_template_options"]')[0];
		oldfield.parentNode.replaceChild(field_template_options.render(), oldfield);
		e.target.form.root.previewer = new Morebits.wiki.preview($(e.target.form.root).find('#twinkleblock-previewbox').last()[0]);
	} else {
		$form.find('fieldset[name="field_template_options"]').hide();
	}

	if (Twinkle.block.hasBlockLog) {
		var $blockloglink = $( '<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgRelevantUserName'), type: 'block'}) + '">block log</a>)' );

		Morebits.status.init($('div[name="hasblocklog"] span').last()[0]);
		Morebits.status.warn('This user has been blocked in the past', $blockloglink[0]);
	}

	if (Twinkle.block.currentBlockInfo) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		Morebits.status.warn(relevantUserName + ' is already blocked', 'Submit query to reblock with supplied options');
		Twinkle.block.callback.update_form(e, Twinkle.block.currentBlockInfo);
	} else if ($form.find('[name=actiontype][value=template]').is(':checked')) {
		// make sure all the fields are correct based on defaults
		if ($form.find('[name=actiontype][value=block]').is(':checked')) {
			Twinkle.block.callback.change_preset(e);
		} else {
			Twinkle.block.callback.change_template(e);
		}
	}
};

/*
 * Keep alphabetized by key name, Twinkle.block.blockGroups establishes
 *    the order they will appear in the interface
 *
 * Block preset format, all keys accept only 'true' (omit for false) except where noted:
 * <title of block template> : {
 *   autoblock: <autoblock any IP addresses used (for registered users only)>
 *   disabletalk: <disable user from editing their own talk page while blocked>
 *   expiry: <string - expiry timestamp, can include relative times like "5 months", "2 weeks" etc, use "infinity" for indefinite>
 *   forAnonOnly: <show block option in the interface only if the relevant user is an IP>
 *   forRegisteredOnly: <show block option in the interface only if the relevant user is registered>
 *   label: <string - label for the option of the dropdown in the interface (keep brief)>
 *   noemail: prevent the user from sending email through Special:Emailuser
 *   pageParam: <set if the associated block template accepts a page parameter>
 *   prependReason: <string - prepends the value of 'reason' to the end of the existing reason, namely for when revoking talk page access>
 *   nocreate: <block account creation from the user's IP (for anonymous users only)>
 *   nonstandard: <template does not conform to stewardship of WikiProject User Warnings and may not accept standard parameters>
 *   reason: <string - block rationale, as would appear in the block log,
 *            and the edit summary for when adding block template, unless 'summary' is set>
 *   reasonParam: <set if the associated block template accepts a reason parameter>
 *   sig: <string - set to ~~~~ if block template does not accept "true" as the value, or set null to omit sig param altogether>
 *   summary: <string - edit summary for when adding block template to user's talk page, if not set, 'reason' is used>
 *   suppressArticleInSummary: <set to suppress showing the article name in the edit summary, as with attack pages>
 *   templateName: <string - name of template to use (instead of key name), entry will be omitted from the Templates list.
 *                  (e.g. use another template but with different block options)>
 *   useInitialOptions: <when preset is chosen, only change given block options, leave others as they were>
 *
 * WARNING: 'anononly' and 'allowusertalk' are enabled by default.
 *   To disable, set 'hardblock' and 'disabletalk', respectively
 */
Twinkle.block.blockPresetsInfo = {
	'anonblock' : {
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}}',
		sig: '~~~~'
	},
	'anonblock - school' : {
		expiry: '36 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}} <!-- Likely a school based on behavioral evidence -->',
		templateName: 'anonblock',
		sig: '~~~~'
	},
	'blocked proxy' : {
		expiry: '1 year',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{blocked proxy}}',
		sig: null
	},
	'CheckUser block' : {
		nonstandard: true,
		reason: '{{CheckUser block}}',
		sig: '~~~~'
	},
	'checkuserblock-account' : {
		nonstandard: true,
		reason: '{{checkuserblock-account}}',
		sig: '~~~~'
	},
	'checkuserblock-wide' : {
		nonstandard: true,
		reason: '{{checkuserblock-wide}}',
		sig: '~~~~'
	},
	'colocationwebhost' : {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{colocationwebhost}}',
		sig: null
	},
	'oversightblock' : {
		nonstandard: true,
		reason: '{{OversightBlock}}',
		sig: '~~~~'
	},
	'school block' : {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{school block}}',
		sig: '~~~~'
	},
	// Placeholder for when we add support for rangeblocks
	// 'rangeblock' : {
	//   reason: '{{rangeblock}}',
	//   nocreate: true,
	//   nonstandard: true,
	//   forAnonOnly: true,
	//   sig: '~~~~'
	// },
	'tor' : {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{Tor}}',
		sig: null
	},
	'webhostblock' : {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{webhostblock}}',
		sig: null
	},
	// cb-prefixed
	'cb-3block' : {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Violation of the [[WP:Three-revert rule|three-revert rule]]',
		summary: 'You have been blocked from editing for violation of the [[WP:3RR|three-revert rule]]'
	},
	'cb-ablock' : {
		autoblock: true,
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Your IP address has been blocked from editing',
		suppressArticleInSummary: true
	},
	'cb-adblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Using Wikipedia for [[WP:Spam|spam]] or [[WP:NOTADVERTISING|advertising]] purposes',
		summary: 'You have been blocked from editing for [[WP:SOAP|advertising or self-promotion]]'
	},
	'cb-aeblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Arbitration enforcement|Arbitration enforcement]]',
		reasonParam: true,
		summary: 'You have been blocked from editing for violating an [[WP:Arbitration|arbitration decision]] with your edits'
	},
	'cb-bioblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Violations of the [[WP:Biographies of living persons|biographies of living persons]] policy',
		summary: 'You have been blocked from editing for violations of Wikipedia\'s [[WP:BLP|biographies of living persons policy]]'
	},
	'cb-cấm' : {
		autoblock: true,
		expiry: '24 hours',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Bạn đã bị cấm sửa đổi',
		suppressArticleInSummary: true
	},
	'cb-blockindef' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing',
		suppressArticleInSummary: true
	},
	'cb-blocknotalk' : {
		disabletalk: true,
		pageParam: true,
		reasonParam: true,
		summary: 'You have been blocked from editing and your user talk page access has been disabled',
		suppressArticleInSummary: true
	},
	'cb-botblock': {
		forRegisteredOnly: true,
		pageParam: true,
		reason: 'Running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]',
		summary: 'You have been blocked from editing because it appears you are running a [[WP:BOT|bot script]] without [[WP:BRFA|approval]]'
	},
	'cb-botublock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{cb-botublock}} <!-- Username implies a bot, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this is a [[WP:BOT|bot]] account, which is currently not approved'
	},
	'cb-causeblock' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{cb-causeblock}} <!-- Username represents a non-profit, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website'
	},
	'cb-compblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Compromised account',
		summary: 'You have been indefinitely blocked from editing because it is believed that your [[WP:SECURE|account has been compromised]]'
	},
	'cb-cấm-vpbq' : {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:VPBQ|Cấm do vi phạm bản quyền]]',
		summary: 'Bạn đã bị cấm sửa đổi do tiếp tục [[WP:VPBQ|vi phạm bản quyền]]'
	},
	'cb-dblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Persistent removal of content',
		pageParam: true,
		summary: 'You have been blocked from editing for continued [[WP:VAND|removal of material]]'
	},
	'cb-disruptblock' : {
		autoblock: true,
		nocreate: true,
		reason: '[[WP:Disruptive editing|Disruptive editing]]',
		summary: 'You have been blocked from editing for [[WP:DE|disruptive editing]]'
	},
	'cb-efblock' : {
		autoblock: true,
		nocreate: true,
		reason: 'Deliberately triggering the [[WP:Edit filter|Edit filter]]',
		summary: 'You have been blocked from editing for making disruptive edits that repeatedly triggered the [[WP:EF|edit filter]]'
	},
	'cb-ewblock' : {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Edit warring|Edit warring]]',
		summary: 'You have been blocked from editing to prevent further [[WP:DE|disruption]] caused by your engagement in an [[WP:EW|edit war]]'
	},
	'cb-hblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:No personal attacks|Personal attacks]] or [[WP:Harassment|harassment]]',
		summary: 'You have been blocked from editing for attempting to [[WP:HARASS|harass]] other users'
	},
	'cb-ipevadeblock' : {
		forAnonOnly: true,
		nocreate: true,
		reason: '[[WP:Blocking policy#Evasion of blocks|Block evasion]]',
		summary: 'Your IP address has been blocked from editing because it has been used to [[WP:EVADE|evade a previous block]]'
	},
	'cb-lblock' : {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Making [[WP:No legal threats|legal threats]]',
		summary: 'You have been blocked from editing for making [[WP:NLT|legal threats or taking legal action]]'
	},
	'cb-memorialblock': {
		forRegisteredOnly: true,
		expiry: 'infinity',
		reason: '{{cb-memorialblock}} <!-- Username indicates tribute to someone, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] indicates this account may be used as a memorial or tribute to someone'
	},
	'cb-myblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Using Wikipedia as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]',
		summary: 'You have been blocked from editing for using user and/or article pages as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]'
	},
	'cb-nothereblock' : {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Clearly [[WP:NOTHERE|not here to contribute to the encyclopedia]]',
		forRegisteredOnly: true,
		summary: 'You have been indefinitely blocked from editing because it appears that you are not here to [[WP:NOTHERE|build an encyclopedia]]'
	},
	'cb-npblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Creating [[WP:Patent nonsense|patent nonsense]] or other inappropriate pages',
		summary: 'You have been blocked from editing for creating [[WP:PN|nonsense pages]]'
	},
	'cb-pablock' : {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		reason: '[[WP:No personal attacks|Personal attacks]] or [[WP:Harassment|harassment]]',
		summary: 'You have been blocked from editing for making [[WP:NPA|personal attacks]] toward other users'
	},
	'cb-cấm-spam' : {
		autoblock: true,
		nocreate: true,
		reason: 'Sửa đổi Wikipedia để [[WP:SPAM|spam]]',
		summary: 'Tài khoản của bạn đã bị khóa sửa đổi Wikipedia để [[WP:SPAM|spam]]'
	},
	'cb-soablock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Spam|Spam]] / [[WP:NOTADVERTISING|advertising]]-only account',
		summary: 'You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam, advertising, or promotion]]'
	},
	'cb-sockblock' : {
		autoblock: true,
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Abusing [[WP:Sock puppetry|multiple accounts]]',
		summary: 'You have been blocked from editing for abusing [[WP:SOCK|multiple accounts]]'
	},
	'cb-softerblock' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{cb-softerblock}} <!-- Promotional username, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website'
	},
	'cb-spamublock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{cb-spamublock}} <!-- Promotional username, promotional edits -->',
		summary: 'You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam or advertising]] and your username is a violation of the [[WP:U|username policy]]'
	},
	'cb-spoablock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '[[WP:SOCK|Sock puppetry]]',
		summary: 'This account has been blocked as a [[WP:SOCK|sock puppet]] created to violate Wikipedia policy'
	},
	'cb-talkrevoked' : {
		disabletalk: true,
		reason: 'Revoking talk page access: inappropriate use of user talk page while blocked',
		prependReason: true,
		summary: 'Your user talk page access has been disabled',
		useInitialOptions: true
	},
	'cb-ublock' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{cb-ublock}} <!-- Username violation, soft block -->',
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing because your username is a violation of the [[WP:U|username policy]]'
	},
	'cb-ublock-double': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{cb-ublock-double}} <!-- Username closely resembles another user, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] is too similar to the username of another Wikipedia user'
	},
	'cb-uhblock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{cb-uhblock}} <!-- Username violation, hard block -->',
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]]'
	},
	'cb-ublock-famous' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{cb-ublock-famous}} <!-- Username represents a famous person, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] matches the name of a well-known living individual'
	},
	'cb-uhblock-double': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{cb-ublock-double}} <!-- Username closely resembles another user, hard block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] appears to impersonate another established Wikipedia user'
	},
	'cb-vaublock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '{{cb-vaublock}} <!-- Username violation, vandalism-only account -->',
		summary: 'You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]] and your username is a blatant violation of the [[WP:U|username policy]]'
	},
	'cb-cấm-phá hoại' : {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Vandalism|Vandalism]]',
		summary: 'You have been blocked from editing for persistent [[WP:VAND|vandalism]]'
	},
	'cb-cấm-tk chỉ phá' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Vandalism-only account|Vandalism-only account]]',
		summary: 'Bạn đã bị cấm sửa đổi do tài khoản của bạn chỉ dùng để [[Wikipedia:Phá hoại|phá hoại]]'
	}
};

Twinkle.block.transformBlockPresets = function twinkleblockTransformBlockPresets() {
	// supply sensible defaults
	$.each(Twinkle.block.blockPresetsInfo, function(preset, settings) {
		settings.summary = settings.summary || settings.reason;
		settings.sig = settings.sig !== undefined ? settings.sig : 'yes';
		// despite this it's preferred that you use 'infinity' as the value for expiry
		settings.indefinite = settings.indefinite || settings.expiry === 'infinity' || settings.expiry === 'indefinite' || settings.expiry === 'never';

		if (!Twinkle.block.isRegistered && settings.indefinite) {
			settings.expiry = '31 hours';
		} else {
			settings.expiry = settings.expiry || '31 hours';
		}

		Twinkle.block.blockPresetsInfo[preset] = settings;
	});
};

// These are the groups of presets and defines the order in which they appear. For each list item:
//   label: <string, the description that will be visible in the dropdown>
//   value: <string, the key of a preset in blockPresetsInfo>
Twinkle.block.blockGroups = [
	{
		label: 'Các các lý do cấm thường gặp',
		list: [
			{ label: 'anonblock', value: 'anonblock' },
			{ label: 'anonblock - likely a school', value: 'anonblock - school' },
			{ label: 'school block', value: 'school block' },
			{ label: 'Generic block (custom reason)', value: 'cb-block' }, // ends up being default for registered users
			{ label: 'Generic block (custom reason) – IP', value: 'cb-ablock', selected: true }, // set only when blocking IP
			{ label: 'Generic block (custom reason) – indefinite', value: 'cb-blockindef' },
			{ label: 'Disruptive editing', value: 'cb-disruptblock' },
			{ label: 'Inappropriate use of user talk page while blocked', value: 'cb-talkrevoked' },
			{ label: 'Not here to contribute to the encyclopedia', value: 'cb-nothereblock' },
			{ label: 'Vandalism', value: 'cb-vblock' },
			{ label: 'Vandalism-only account', value: 'cb-voablock' }
		],
	},
	{
		label: 'Các lý do khác',
		list: [
			{ label: 'Advertising', value: 'cb-adblock' },
			{ label: 'Arbitration enforcement', value: 'cb-aeblock' },
			{ label: 'Block evasion – IP', value: 'cb-ipevadeblock' },
			{ label: 'BLP violations', value: 'cb-bioblock' },
			{ label: 'Copyright violations', value: 'cb-copyrightblock' },
			{ label: 'Creating inappropriate pages', value: 'cb-npblock' },
			{ label: 'Edit filter-related', value: 'cb-efblock' },
			{ label: 'Edit warring', value: 'cb-ewblock' },
			{ label: 'Generic block with talk page access revoked', value: 'cb-blocknotalk' },
			{ label: 'Harassment', value: 'cb-hblock' },
			{ label: 'Legal threats', value: 'cb-lblock' },
			{ label: 'Personal attacks or harassment', value: 'cb-pablock' },
			{ label: 'Possible compromised account', value: 'cb-compblock' },
			{ label: 'Removal of content', value: 'cb-dblock' },
			{ label: 'Sock puppetry (master)', value: 'cb-sockblock' },
			{ label: 'Sock puppetry (puppet)', value: 'cb-spoablock' },
			{ label: 'Social networking', value: 'cb-myblock' },
			{ label: 'Spam', value: 'cb-sblock' },
			{ label: 'Spam/advertising-only account', value: 'cb-soablock' },
			{ label: 'Unapproved bot', value: 'cb-botblock' },
			{ label: 'Violating the three-revert rule', value: 'cb-3block' }
		]
	},
	{
		label: 'Các vi phạm quy định tên người dùng',
		list: [
			{ label: 'Tên đăng nhập của bot', value: 'cb-botublock' },
			{ label: 'Memorial username soft block', value: 'cb-memorialblock' },
			{ label: 'Promotional username, hard block', value: 'cb-spamublock' },
			{ label: 'Promotional username, soft block', value: 'cb-softerblock' },
			{ label: 'Similar username soft block', value: 'cb-ublock-double' },
			{ label: 'Username violation, soft block', value: 'cb-ublock' },
			{ label: 'Username violation, hard block', value: 'cb-uhblock' },
			{ label: 'Username impersonation hard block', value: 'cb-uhblock-double' },
			{ label: 'Username represents a famous person, soft block', value: 'cb-ublock-famous' },
			{ label: 'Username represents a non-profit, soft block', value: 'cb-causeblock' },
			{ label: 'Username violation, vandalism-only account', value: 'cb-vaublock' }
		]
	},
	{
		label: 'Templated reasons',
		list: [
			{ label: 'blocked proxy', value: 'blocked proxy' },
			{ label: 'CheckUser block', value: 'CheckUser block' },
			{ label: 'checkuserblock-account', value: 'checkuserblock-account' },
			{ label: 'checkuserblock-wide', value: 'checkuserblock-wide' },
			{ label: 'colocationwebhost', value: 'colocationwebhost' },
			{ label: 'oversightblock', value: 'oversightblock' },
			// { label: 'rangeblock', value: 'rangeblock' }, // placeholder for when we add support for rangeblocks
			{ label: 'tor', value: 'tor' },
			{ label: 'webhostblock', value: 'webhostblock' }
		]
	}
];

Twinkle.block.callback.filtered_block_groups = function twinkleblockCallbackFilteredBlockGroups(show_template) {
	return $.map(Twinkle.block.blockGroups, function(blockGroup) {
		var list = $.map(blockGroup.list, function(blockPreset) {
				// only show cb-talkrevoked if reblocking
				if (!Twinkle.block.currentBlockInfo && blockPreset.value === "cb-talkrevoked") return;

				var blockSettings = Twinkle.block.blockPresetsInfo[blockPreset.value];
				var registrationRestrict = blockSettings.forRegisteredOnly ? Twinkle.block.isRegistered : (blockSettings.forAnonOnly ? !Twinkle.block.isRegistered : true);
				if (!(blockSettings.templateName && show_template) && registrationRestrict) {
					var templateName = blockSettings.templateName || blockPreset.value;
					return {
						label: (show_template ? '{{' + templateName + '}}: ' : '') + blockPreset.label,
						value: blockPreset.value,
						data: [{
							name: 'template-name',
							value: templateName
						}],
						selected: !!blockPreset.selected
					};
				}
			});
		if (list.length) return {
				label: blockGroup.label,
				list: list
			};
	});
};

Twinkle.block.callback.change_preset = function twinkleblockCallbackChangePreset(e) {
	var key = e.target.form.preset.value;
	if (!key) return;

	e.target.form.template.value = Twinkle.block.blockPresetsInfo[key].templateName || key;
	Twinkle.block.callback.update_form(e, Twinkle.block.blockPresetsInfo[key]);
	Twinkle.block.callback.change_template(e);
};

Twinkle.block.callback.change_expiry = function twinkleblockCallbackChangeExpiry(e) {
	var expiry = e.target.form.expiry;
	if (e.target.value === 'custom') {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, true);
	} else {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, false);
		expiry.value = e.target.value;
	}
};

Twinkle.block.callback.update_form = function twinkleblockCallbackUpdateForm(e, data) {
	var form = e.target.form, expiry_preset = form.expiry_preset,
		expiry = data.expiry;

	// don't override original expiry if useInitialOptions is set
	if (!data.useInitialOptions) {
		if (Date.parse(expiry)) {
			expiry = new Date(expiry).toGMTString();
			form.expiry_preset.value = 'custom';
		} else {
			form.expiry_preset.value = data.expiry || 'custom';
		}

		form.expiry.value = expiry;
		if (form.expiry_preset.value === 'custom') {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, true);
		} else {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, false);
		}
	}

	// boolean-flipped options, more at [[mw:API:Block]]
	data.disabletalk = data.disabletalk !== undefined ? data.disabletalk : false;
	data.hardblock = data.hardblock !== undefined ? data.hardblock : false;

	// disable autoblock if blocking a bot
	if (Twinkle.block.isRegistered && relevantUserName.search(/bot$/i) > 0) {
		data.autoblock = false;
	}

	$(form.field_block_options).find(':checkbox').each(function(i, el) {
		// don't override original options if useInitialOptions is set
		if (data.useInitialOptions && data[el.name] === undefined) return;

		var check = data[el.name] === '' || !!data[el.name];
		$(el).prop('checked', check);
	});

	if (data.prependReason && data.reason) {
		form.reason.value = data.reason + '; ' + form.reason.value;
	} else {
		form.reason.value = data.reason || '';
	}
};

Twinkle.block.callback.change_template = function twinkleblockcallbackChangeTemplate(e) {
	var form = e.target.form, value = form.template.value, settings = Twinkle.block.blockPresetsInfo[value];

	if (!$(form).find('[name=actiontype][value=block]').is(':checked')) {
		if (settings.indefinite || settings.nonstandard) {
			if (Twinkle.block.prev_template_expiry === null) {
				Twinkle.block.prev_template_expiry = form.template_expiry.value || '';
			}
			form.template_expiry.parentNode.style.display = 'none';
			form.template_expiry.value = 'indefinite';
		} else if ( form.template_expiry.parentNode.style.display === 'none' ) {
			if(Twinkle.block.prev_template_expiry !== null) {
				form.template_expiry.value = Twinkle.block.prev_template_expiry;
				Twinkle.block.prev_template_expiry = null;
			}
			form.template_expiry.parentNode.style.display = 'block';
		}
		if (Twinkle.block.prev_template_expiry) form.expiry.value = Twinkle.block.prev_template_expiry;
		Morebits.quickForm.setElementVisibility(form.notalk.parentNode, !settings.nonstandard);
	} else {
		Morebits.quickForm.setElementVisibility(
			form.blank_duration.parentNode,
			!settings.indefinite && !settings.nonstandard
		);
	}

	Morebits.quickForm.setElementVisibility(form.article.parentNode, !!settings.pageParam);
	Morebits.quickForm.setElementVisibility(form.block_reason.parentNode, !!settings.reasonParam);

	form.root.previewer.closePreview();
};
Twinkle.block.prev_template_expiry = null;
Twinkle.block.prev_block_reason = null;
Twinkle.block.prev_article = null;
Twinkle.block.prev_reason = null;

Twinkle.block.callback.preview = function twinkleblockcallbackPreview(form) {
	var params = {
		article: form.article.value,
		blank_duration: form.blank_duration ? form.blank_duration.checked : false,
		disabletalk: form.disabletalk.checked || (form.notalk ? form.notalk.checked : false),
		expiry: form.template_expiry ? form.template_expiry.value : form.expiry.value,
		hardblock: Twinkle.block.isRegistered ? form.autoblock.checked : form.hardblock.checked,
		indefinite: (/indef|infinity|never|\*|max/).test( form.template_expiry ? form.template_expiry.value : form.expiry.value ),
		reason: form.block_reason.value,
		template: form.template.value
	};

	var templateText = Twinkle.block.callback.getBlockNoticeWikitext(params);

	form.previewer.beginRender(templateText);
};

Twinkle.block.callback.evaluate = function twinkleblockCallbackEvaluate(e) {
	var $form = $(e.target),
		toBlock = $form.find('[name=actiontype][value=block]').is(':checked'),
		toWarn = $form.find('[name=actiontype][value=template]').is(':checked'),
		blockoptions = {}, templateoptions = {};

	Twinkle.block.callback.saveFieldset($form.find('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_template_options]'));

	blockoptions = Twinkle.block.field_block_options;

	templateoptions = Twinkle.block.field_template_options;
	templateoptions.disabletalk = !!(templateoptions.disabletalk || blockoptions.disabletalk);
	templateoptions.hardblock = !!blockoptions.hardblock;
	delete blockoptions.expiry_preset; // remove extraneous

	// use block settings as warn options where not supplied
	templateoptions.summary = templateoptions.summary || blockoptions.reason;
	templateoptions.expiry = templateoptions.template_expiry || blockoptions.expiry;

	if (toBlock) {
		if (!blockoptions.expiry) return alert('Please provide an expiry!');
		if (!blockoptions.reason) return alert('Please provide a reason for the block!');

		Morebits.simpleWindow.setButtonsEnabled( false );
		Morebits.status.init( e.target );
		var statusElement = new Morebits.status('Executing block');
		blockoptions.action = 'block';
		blockoptions.user = mw.config.get('wgRelevantUserName');

		// boolean-flipped options
		blockoptions.anononly = blockoptions.hardblock ? undefined : true;
		blockoptions.allowusertalk = blockoptions.disabletalk ? undefined : true;

		// fix for bug with block API, see [[phab:T68646]]
		if (blockoptions.expiry === 'infinity') blockoptions.expiry = 'infinite';

		// execute block
		api.getToken('block').then(function(token) {
			statusElement.status('Processing...');
			blockoptions.token = token;
			var mbApi = new Morebits.wiki.api( 'Executing block', blockoptions, function(data) {
				statusElement.info('Completed');
				if (toWarn) Twinkle.block.callback.issue_template(templateoptions);
			});
			mbApi.post();
		}, function() {
			statusElement.error('Unable to fetch block token');
		});
	} else if (toWarn) {
		Morebits.simpleWindow.setButtonsEnabled( false );

		Morebits.status.init( e.target );
		Twinkle.block.callback.issue_template(templateoptions);
	} else {
		return alert('Please give Twinkle something to do!');
	}
};

Twinkle.block.callback.issue_template = function twinkleblockCallbackIssueTemplate(formData) {
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	var params = $.extend(formData, {
		messageData: Twinkle.block.blockPresetsInfo[formData.template],
		reason: Twinkle.block.field_template_options.block_reason,
		disabletalk: Twinkle.block.field_template_options.notalk
	});

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Actions complete, loading user talk page in a few seconds';

	var wikipedia_page = new Morebits.wiki.page( userTalkPage, 'User talk page modification' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.block.callback.main );
};

Twinkle.block.callback.getBlockNoticeWikitext = function(params) {
	var text = '{{', settings = Twinkle.block.blockPresetsInfo[params.template];

	if (!settings.nonstandard) {
		text += 'subst:'+params.template;
		if (params.article && settings.pageParam) text += '|page=' + params.article;

		if (!/te?mp|^\s*$|min/.exec(params.expiry)) {
			if (params.indefinite) {
				text += '|indef=yes';
			} else if(!params.blank_duration) {
				text += '|time=' + params.expiry;
			}
		}

		if (!Twinkle.block.isRegistered && !params.hardblock) {
			text += '|anon=yes';
		}

		if (params.reason) text += '|reason=' + params.reason;
		if (params.disabletalk) text += '|notalk=yes';
	} else {
		text += params.template;
	}

	if (settings.sig) text += '|sig=' + settings.sig;

	return text + '}}';
};

Twinkle.block.callback.main = function twinkleblockcallbackMain( pageobj ) {
	var text = pageobj.getPageText(),
		params = pageobj.getCallbackParameters(),
		messageData = params.messageData,
		date = new Date();

	var dateHeaderRegex = new RegExp( '^==+\\s*(?:' + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +
		')\\s+' + date.getUTCFullYear() + '\\s*==+', 'mg' );
	var dateHeaderRegexLast, dateHeaderRegexResult;
	while ((dateHeaderRegexLast = dateHeaderRegex.exec( text )) !== null) {
		dateHeaderRegexResult = dateHeaderRegexLast;
	}
	// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
	// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
	// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
	var lastHeaderIndex = text.lastIndexOf( '\n==' ) + 1;

	if ( text.length > 0 ) {
		text += '\n\n';
	}

	params.indefinite = (/indef|infinity|never|\*|max/).test( params.expiry );

	if ( Twinkle.getPref('blankTalkpageOnIndefBlock') && params.template !== 'cb-lblock' && params.indefinite ) {
		Morebits.status.info( 'Info', 'Blanking talk page per preferences and creating a new level 2 heading for the date' );
		text = '== ' + date.getUTCMonthName() + ' ' + date.getUTCFullYear() + ' ==\n';
	} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
		Morebits.status.info( 'Info', 'Will create a new level 2 heading for the date, as none was found for this month' );
		text += '== ' + date.getUTCMonthName() + ' ' + date.getUTCFullYear() + ' ==\n';
	}

	params.expiry = typeof params.template_expiry !== "undefined" ? params.template_expiry : params.expiry;

	text += Twinkle.block.callback.getBlockNoticeWikitext(params);

	// build the edit summary
	var summary = messageData.summary;
	if ( messageData.suppressArticleInSummary !== true && params.article ) {
		summary += ' on [[' + params.article + ']]';
	}
	summary += '.' + Twinkle.getPref('summaryAd');

	pageobj.setPageText( text );
	pageobj.setEditSummary( summary );
	pageobj.setWatchlist( Twinkle.getPref('watchWarnings') );
	pageobj.save();
};

})(jQuery);

//</nowiki>
