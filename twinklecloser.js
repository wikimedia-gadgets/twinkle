if ( typeof(Twinkle) === "undefined" ) {
	alert( "Twinkle modules may not be directly imported.\nSee WP:Twinkle for installation instructions." );
}

function twinklecloser() {
	/**
	 TwinkleConfig.deletionSummaryAd (string)
	 If ad should be added or not to deletion summary
	 */
	if( typeof( TwinkleConfig.deletionSummaryAd ) == 'undefined' ) {
		TwinkleConfig.deletionSummaryAd = TwinkleConfig.summaryAd;
	}

	var closeable = false;
	var type;
	if( /Wikipedia:Articles_for_creation\/\d{4}-\d{2}-\d{2}/.test(wgPageName) ) {
		closeable = true;
		type = 'afc';
	} else if(  /Wikipedia:Articles_for_deletion\/Log\/\d{4}_\w+_\d{1,2}/.test(wgPageName) ) {
		closeable = true;
		type = 'afd';
	}

	if( closeable ) {
		twinklecloser.mark( type );
	}
}

twinklecloser.mark = function twinklecloserMark( type ) {
	switch( type ) {
	case 'afc':
		var sections = document.evaluate( '//h2[span/@class="editsection"]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		for( var i = 0; i < sections.snapshotLength; ++i ) {
			var section = sections.snapshotItem(i);
			var section_number = document.evaluate( 'substring-after(span/a/@href, "section=")', section, null, XPathResult.STRING_TYPE, null ).stringValue;
			var a_node = document.createElement( 'a' );
			a_node.appendChild( document.createTextNode( '[close]' ) );
			a_node.style.fontWeight = 'bold';
			a_node.setAttribute( 'href', 'javascript:twinklecloser.actions.afc("' + section_number + '")' );

			section.insertBefore( a_node, section.firstChild );
		}
		break;
	case 'afd':
		var sections = document.evaluate( '//h3[span/@class="editsection"]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		for( var i = 0; i < sections.snapshotLength; ++i ) {
			var section = sections.snapshotItem(i);
			var section_number = document.evaluate( 'substring-after(span/a/@href, "section=")', section, null, XPathResult.STRING_TYPE, null ).stringValue;
			var page = document.evaluate( 'span/a/@title', section, null, XPathResult.STRING_TYPE, null ).stringValue;
			var a_node = document.createElement( 'a' );
			a_node.appendChild( document.createTextNode( '[close]' ) );
			a_node.style.fontWeight = 'bold';
			a_node.style.color = '#449922';
			a_node.setAttribute( 'href', 'javascript:twinklecloser.actions.afd("' + section_number + '", "' + page + '")' );

			section.insertBefore( a_node, section.firstChild );
		}
		break;

	}
}

twinklecloser.actions = {
	afc: function twinklecloserActionsAfc( section ) {
		var Window = new SimpleWindow( 800, 400 );
		Window.setTitle( "Close AFC" );
		var form = new QuickForm( twinklecloser.callbacks.afc.evaluate );
		form.append ( {
				label: 'Action: ',
				type: 'select',
				name: 'type',
				event: twinklecloser.callbacks.afc.submenu,
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
		var form = new QuickForm( twinklecloser.callbacks.afd.evaluate );
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
		var result = form.render();
		Window.setContent( result );
		Window.display();
	}
}

twinklecloser.callbacks = {
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
				work_area.append( { type:'submit' } );
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
				work_area.append( { type:'submit' } );
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
				work_area.append( { type:'submit' } );
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

			Status.init( form );
			var query = {
				'title': wgPageName,
				'action': 'submit',
				'section': section
			};
			wikipedia_wiki = new Wikipedia.wiki( 'Processing', query, twinklecloser.callbacks.afc.edit );
			wikipedia_wiki.params = params;
			wikipedia_wiki.get();

		},
		edit: function( self ) {
			var form = self.responseXML.getElementById('editform');
			text = form.wpTextbox1.value;
			var summary;

			switch( self.params.type ) {
			case 'approved':
				text += self.params.tag + '\~\~\~\~';
				summary = 'Approving article';
				break;
			case 'denied':
				text += self.params.tag + '\~\~\~\~';
				summary = 'Denying article';
				break;
			case 'archive':
				text = text.replace( /^(==.*?==)\n/, "$1\n" + self.params.top  );
				text += self.params.bottom;
				summary = 'Archiving';
				break;
			}
			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSummary': form.wpSummary.value + ' ' + summary + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};

			self.post( postData );
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
			work_area.append( { type:'submit' } );
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
			var label;
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
			Status.init( form );

			if( type == 'delete' ) {
				if( del ) {
					// Start by purging redirect
					var query = {
						'action': 'query',
						'list': 'backlinks',
						'blfilterredir': 'redirects',
						'bltitle': affected_page,
						'bllimit': 5000
					};
					var wikipedia_api = new Wikipedia.api( 'Grabbing redirects', query, twinklecloser.callbacks.afd.deleteRedirectsMain );
					wikipedia_api.params = params;
					wikipedia_api.post();
					// and now, delete!
					var query = {
						'title': affected_page,
						'action': 'delete'
					};

					var wikipedia_wiki = new Wikipedia.wiki( 'Deleting page', query, twinklecloser.callbacks.afd.deletePage );
					wikipedia_wiki.params = params;
					wikipedia_wiki.followRedirect = false;
					wikipedia_wiki.get();
				}

			}

			var query = {
				'title': page,
				'action': 'submit',
				'section': section
			};
			wikipedia_wiki = new Wikipedia.wiki( 'Processing', query, twinklecloser.callbacks.afd.edit );
			wikipedia_wiki.params = params;
			wikipedia_wiki.get();
		},
		deleteRedirectsMain: function( self ) {
			var xmlDoc = self.responseXML;
			var snapshot = xmlDoc.evaluate('//backlinks/bl/@title', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );

			var total = snapshot.snapshotLength * 2;

			if( snapshot.snapshotLength == 0 ) {
				return;
			}

			var statusIndicator = new Status('Deleting redirects', '0%');

			var onsuccess = function( self ) {
				var obj = self.params.obj;
				var total = self.params.total;
				var now = parseInt( 100 * ++(self.params.current)/total ) + '%';
				obj.update( now );
				self.statelem.unlink();
				if( self.params.current >= total ) {
					obj.info( now + ' (completed)' );
					Wikipedia.removeCheckpoint();
				}
			}
			var onloaded = onsuccess;

			var onloading = function( self ) {}


			Wikipedia.addCheckpoint();
			if( snapshot.snapshotLength == 0 ) {
				statusIndicator.info( '100% (completed)' );
				Wikipedia.removeCheckpoint();
				return;
			}

			var params = clone( self.params );
			params.current = 0;
			params.total = total;
			params.obj = statusIndicator;


			for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
				var title = snapshot.snapshotItem(i).value;
				var query = {
					'title': title,
					'action': 'delete'
				}
				var wikipedia_wiki = new Wikipedia.wiki( "Deleting " + title, query, twinklecloser.callbacks.afd.deleteRedirects );
				wikipedia_wiki.params = params;
				wikipedia_wiki.onloading = onloading;
				wikipedia_wiki.onloaded = onloaded;
				wikipedia_wiki.onsuccess = onsuccess;
				wikipedia_wiki.followRedirect = false;
				wikipedia_wiki.get();
			}
		},
		deleteRedirects: function( self ) {
			var form = this.responseXML.getElementById( 'deleteconfirm' );
			var postData = {
				'wpWatch': form.wpWatch.checked ? '' : undefined,
				'wpReason': "Speedy deleted per ([[WP:CSD#R1|CSD R1]]), Redirect to deleted page \"" + self.params.affected_page + "\"." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
			self.post( postData );
		},
		deletePage: function( self ) {
			var form = this.responseXML.getElementById( 'deleteconfirm' );
			var postData = {
				'wpWatch': form.wpWatch.checked ? '' : undefined,
				'wpReason': "Deleted per outcome of [[WP:AFD]] discussion (see [[" + self.params.page + "]])." + TwinkleConfig.deletionSummaryAd,
				'wpEditToken': form.wpEditToken.value
			}
			self.post( postData );
		},
		edit: function( self ) {
			var form = self.responseXML.getElementById('editform');
			text = form.wpTextbox1.value;
			var summary = "Closing discussion, result was \"" + self.params.label + "\"";
			text = "\{\{subst:Afd top\}\}'''" + self.params.label + "''' " + self.params.reason + ". \~\~\~\~\n" + text + "\n\{\{subst:Afd bottom\}\}";

			var postData = {
				'wpMinoredit': form.wpMinoredit.checked ? '' : undefined,
				'wpWatchthis': form.wpWatchthis.checked ? '' : undefined,
				'wpStarttime': form.wpStarttime.value,
				'wpEdittime': form.wpEdittime.value,
				'wpAutoSummary': form.wpAutoSummary.value,
				'wpEditToken': form.wpEditToken.value,
				'wpSummary': summary + TwinkleConfig.summaryAd,
				'wpTextbox1': text
			};

			self.post( postData );
		}
	}

}

// register initialization callback
Twinkle.init.moduleReady( "twinklecloser", twinklecloser );