/*
****************************************
*** twinklecloser.js: AFD/AFC closer module
****************************************
* Mode of invocation:     Link on AFD subpages (including daily log pages) and AFC daily log pages
* Active on:              The aforementioned pages
* Config directives in:   TwinkleConfig
*/

Twinkle.closer = function twinklecloser() {
	var closeable = false;
	var type;
	if( /Wikipedia:Articles_for_creation\/\d{4}-\d{2}-\d{2}/.test(wgPageName) ) {
		closeable = true;
		type = 'afc';
	} else if(  /Wikipedia:Articles_for_deletion\//.test(wgPageName) ) {
		closeable = true;
		type = 'afd';
	}

	if( closeable ) {
		Twinkle.closer.mark( type );
	}
};

Twinkle.closer.mark = function twinklecloserMark( type ) {
	var sections;
	switch( type ) {
	case 'afc':
		sections = $('h2:has(span.editsection)');
		sections.each(function(index, section) {
			var query = new QueryString($(this).find('span.editsection a').attr('href').split( '?', 2 )[1]);
			var section_number = query.get('section');
			var closelink = $('<a/>', {
				'text': '[close]',
				'click': function(){Twinkle.closer.actions.afc(section_number);},
				'class': 'twinkle-closer-link twinkle-closer-link-afc',
				'css': { 'color': '#449922'	}
			}).prependTo(this);
		});
		break;
	case 'afd':
		sections = $('h3:has(span.editsection)');
		sections.each(function(index, section) {
			var query = new QueryString($(this).find('span.editsection a').attr('href').split( '?', 2 )[1]);
			var section_number = query.get('section');
			var closelink = $('<a/>', {
				'text': '[close]',
				'click': function(){Twinkle.closer.actions.afd(section_number);},
				'class': 'twinkle-closer-link twinkle-closer-link-afd',
				'css': { 'color': '#449922'	}
			}).prependTo(this);
		});
		break;
	}
};

Twinkle.closer.actions = {
	afc: function twinklecloserActionsAfc( section ) {
		var Window = new SimpleWindow( 800, 400 );
		Window.setTitle( "Close AFC" );
		Window.setScriptName( "Twinkle" );
		Window.addFooterLink( "AFC reviewing instructions", "WP:AFCR" );
		Window.addFooterLink( "Twinkle help", "WP:TW/DOC#closer-afc" );

		var form = new QuickForm( Twinkle.closer.callbacks.afc.evaluate );
		form.append ( {
			label: 'Action: ',
			type: 'select',
			name: 'type',
			event: Twinkle.closer.callbacks.afc.submenu,
			list: [
				{
					label: 'Approved',
					value: 'approved'
				},
				{
					label: 'Denied',
					value: 'denied'
				},
				{
					label: 'Archive',
					value: 'archive'
				}
			]
		});
		form.append( {
			type: 'div',
			id: 'work_area'
		} );
		form.append( {
			type: 'hidden',
			name: 'section',
			value: section
		} );
		form.append( {
			type: 'hidden',
			name: 'page',
			value: page
		} );
		form.append( { type:'submit' } );

		var result = form.render();
		Window.setContent( result );
		Window.display();

		// We must init the
		var evt = document.createEvent( "Event" );
		evt.initEvent( 'change', true, true );
		result.type.dispatchEvent( evt );
	},
	afd: function twinklecloserActionsAfd( section, page ) {
		var Window = new SimpleWindow( 800, 400 );
		Window.setTitle( "Close AFD" );
		Window.setScriptName( "Twinkle" );
		Window.addFooterLink( "AFD closing instructions", "Wikipedia:Articles for deletion/Administrator instructions" );
		Window.addFooterLink( "Twinkle help", "WP:TW/DOC#closer-afd" );

		var form = new QuickForm( Twinkle.closer.callbacks.afd.evaluate );
		form.append ( {
			label: 'Action: ',
			type: 'radio',
			name: 'type',
			list: [
				{
					label: 'Keep',
					value: 'keep'
				},
				{
					label: 'No consensus',
					value: 'no consensus'
				},
				{
					label: 'Merge',
					value: 'merge'
				},
				{
					label: 'Redirect',
					value: 'redirect',
					subgroup: {
						type: 'input',
						name: 'target',
						label: 'Target: ',
						tooltip: 'the name of the page to redirect to'
					}

				},
				{
					label: 'Delete',
					value: 'delete',
					subgroup: {
						type: 'checkbox',
						list: [
							{
								label: 'Delete? ',
								value: 'delete',
								name: 'del',
								tooltop: 'if we should delete the page on the fly',
								checked: true
							}
						]
					}
				}
			]
		});
		form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason:'
		} );

		form.append( {
			type: 'input',
			name: 'affected_page',
			label: 'Affected page: ',
			value: page.replace( /.*\/(.*?)(\s\(.*?\))?/, "$1" )
		} );

		form.append( {
			type: 'div',
			id: 'work_area'
		} );

		form.append( {
			type: 'hidden',
			name: 'section',
			value: section
		} );
		form.append( {
			type: 'hidden',
			name: 'page',
			value: page
		} );
		form.append( { type:'submit' } );
		var result = form.render();
		Window.setContent( result );
		Window.display();
	}
};

Twinkle.closer.callbacks = {
	afc: {
		submenu: function(e) {
			var value = e.target.value;
			var root = e.target.form;
			var old_area = document.getElementById( 'work_area' );
			var work_area = null;
			switch( value ) {
			case 'archive':
				work_area = new QuickForm.element( {
					type: 'div',
					id: 'work_area'
				} );

				work_area.append( {
					type: 'checkbox',
					name: 'approved',
					list: [
						{
							label: 'Approved ',
							value: 'approved'
						}
					]
				} );

				work_area = work_area.render();
				old_area.parentNode.replaceChild( work_area, old_area );
				break;
			case 'approved':
				work_area = new QuickForm.element( {
					type: 'div',
					id: 'work_area'
				} );

				work_area.append( {
					type: 'input',
					name: 'article',
					label: 'Article ',
					tooltop: 'Leave empty if article was created as specified'
				} );

				work_area = work_area.render();
				old_area.parentNode.replaceChild( work_area, old_area );
				break;
			case 'denied':
				work_area = new QuickForm.element( {
					type: 'div',
					id: 'work_area'
				} );

				work_area.append( {
					type: 'select',
					name: 'reason',
					label: 'Reason ',
					list: [
						{
							label:'v',
							value:'v'
						},
						{
							label:'bio',
							value:'bio'
						},
						{
							label:'nn',
							value:'nn'
						},
						{
							label:'web',
							value:'web'
						},
						{
							label:'corp',
							value:'corp'
						},
						{
							label:'music',
							value:'music'
						},
						{
							label:'dict',
							value:'dict'
						},
						{
							label:'context',
							value:'context'
						},
						{
							label:'blank',
							value:'blank'
						},
						{
							label:'neo',
							value:'neo'
						},
						{
							label:'joke',
							value:'joke'
						},
						{
							label:'lang',
							value:'lang'
						},
						{
							label:'blp',
							value:'blp'
						},
						{
							label:'npov',
							value:'npov'
						},
						{
							label:'not',
							value:'not'
						}
					]
				} );
				work_area = work_area.render();
				old_area.parentNode.replaceChild( work_area, old_area );
				break;

			}
		},
		evaluate: function(e) {
			var form = e.target;
			var type = form.type.value;
			var section = form.section.value;
			var params = { type: type };
			switch( type ) {
			case 'approved':
				var article = form.article.value;
				params.tag = '\{\{subst:afc accept' + ( article ? '|' + article : '' ) + '\}\}';
				break;
			case 'denied':
				var reason = form.reason.value;
				params.tag = '\{\{subst:afc ' + reason + '\}\}';
				break;
			case 'archive':
				var approved = form.approved.checked;
				params.top = '\{\{subst:afc top' + ( approved ? '|approved' : '' ) + '\}\}';
				params.bottom = '\{\{subst:afc b\}\}';
				break;
			}

			SimpleWindow.setButtonsEnabled( false );
			Status.init( form );
			var page = Wikipedia.page(mw.config.get('wgPageName'), "Processing");
			page.setPageSection(section);
			page.setCallbackParameters(params);
			page.load(Twinkle.closer.callbacks.afc.edit);
		},
		edit: function( pageobj ) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();
			var summary;

			switch( params.type ) {
			case 'approved':
				text += params.tag + '\~\~\~\~';
				summary = 'Approving article.';
				break;
			case 'denied':
				text += params.tag + '\~\~\~\~';
				summary = 'Denying article.';
				break;
			case 'archive':
				text = text.replace( /^(==.*?==)\n/, "$1\n" + params.top  );
				text += params.bottom;
				summary = 'Archiving.';
				break;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary(summary + Twinkle.getPref('summaryAd'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		}
	},
	afd: {
		submenu: function(e) {
			var value = e.target.value;
			var root = e.target.form;
			var old_area = document.getElementById( 'work_area' );
			var	work_area = new QuickForm.element( {
				type: 'div',
				id: 'work_area'
			} );
			switch( value ) {
			case 'keep':
			case 'no consensus':
				// nothing
				break;
			case 'redirect':
				work_area.append( {
					type: 'input',
					name: 'target',
					label: 'Target: ',
					tooltip: 'the name of the page to redirect to'
				} );
				break;
			case 'merge':
				// merge must be done manually
				break;
			case 'delete':
				work_area.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Delete? ',
							value: 'delete',
							name: 'del',
							tooltop: 'if we should delete the page on the fly',
							checked: true
						}
					]
				} );
				break;

			}

			work_area = work_area.render();
			old_area.parentNode.replaceChild( work_area, old_area );
		},
		evaluate: function(e) {
			var form = e.target;
			var reason = form.reason.value;
			var type = form.type.value;
			var section = form.section.value;
			var page = form.page.value;
			var affected_page = form.affected_page.value;
			var params = { type: type, page: page, reason: reason, affected_page: affected_page };
			var label, wp_page;
			switch( type ) {
			case 'keep':
				label = "Keep";
				break;
			case 'no consensus':
				label = "No consensus";
				break;
			case 'redirect':
				label = "Redirect";
				var target = form.target.value;
				break;
			case 'merge':
				label = "Merge";
				break;
			case 'delete':
				label = "Delete";
				var del = form.del.checked;
				break;
			}
			params.label = label;

			SimpleWindow.setButtonsEnabled( false );
			Status.init( form );

			if( type === 'delete' ) {
				if( del ) {
					// Start by purging redirect
					var query = {
						'action': 'query',
						'list': 'backlinks',
						'blfilterredir': 'redirects',
						'bltitle': affected_page,
						'bllimit': 5000
					};
					var wikipedia_api = new Wikipedia.api( 'Grabbing redirects', query, Twinkle.closer.callbacks.afd.deleteRedirectsMain );
					wikipedia_api.params = params;
					wikipedia_api.post();

					// and now, delete!

					wp_page = Wikipedia.page(affected_page, 'Deleting page');
					wp_page.setEditSummary("Deleted per outcome of [[WP:AFD]] discussion (see [[" + params.page + "]])." + Twinkle.getPref('deletionSummaryAd'));
					wp_page.deletePage();
				}

			}

			wp_page = Wikipedia.page(page, "Updating process page");
			wp_page.setPageSection(section);
			wp_page.setCallbackParameters(params);
			wp_page.load(Twinkle.closer.callbacks.afd.edit);
		},
		deleteRedirectsMain: function( self ) {
			$doc = $(self.responseXML);
			$doc.find("backlinks bl").each(function(){
				var title = $(this).attr('title');
				var page = new Wikipedia.page(title, "Deleting redirecting page " + title);
				page.setEditSummary("Speedy deleted per ([[WP:CSD#R1|CSD R1]]), Redirect to deleted page \"" + self.params.affected_page + "\"." + Twinkle.getPref('deletionSummaryAd'));
				page.deletePage();
			});
		},
		edit: function( pageobj ) {
			var text = pageobj.getText();
			var params = pageobj.getCallbackParameters();
			pageobj.setEditSummary( "Closing discussion, result was \"" + params.label + "\"" +  Twinkle.getPref('summaryAd') );
			pageobj.setPageText("\{\{subst:Afd top\}\}'''" + params.label + "''' " + params.reason + ". \~\~\~\~\n" + text + "\n\{\{subst:Afd bottom\}\}");
			pageobj.save();
		}
	}
};
