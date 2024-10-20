// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.arv = function twinklearv() {
	var username = mw.config.get('wgRelevantUserName');
	if (!username || username === mw.config.get('wgUserName')) {
		return;
	}

	var isIP = mw.util.isIPAddress(username, true);
	// Ignore ranges wider than the CIDR limit
	if (Morebits.ip.isRange(username) && !Morebits.ip.validCIDR(username)) {
		return;
	}
	var userType = isIP ? 'IP' + (Morebits.ip.isRange(username) ? ' range' : '') : 'user';

	Twinkle.addPortletLink(function() {
		Twinkle.arv.callback(username, isIP);
	}, 'ARV', 'tw-arv', 'Report ' + userType + ' to administrators');
};

Twinkle.arv.callback = function (uid, isIP) {
	var Window = new Morebits.simpleWindow(600, 500);
	Window.setTitle('Advance Reporting and Vetting'); // Backronym
	Window.setScriptName('Twinkle');
	Window.addFooterLink('AIV guide', 'WP:GAIV');
	Window.addFooterLink('UAA guide', 'WP:UAAI');
	Window.addFooterLink('SPI guide', 'Wikipedia:Sockpuppet investigations/SPI/Guide to filing cases');
	Window.addFooterLink('ARV prefs', 'WP:TW/PREF#arv');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#arv');
	Window.addFooterLink('Give feedback', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.arv.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: 'Select report type:',
		event: Twinkle.arv.callback.changeCategory
	});
	categories.append({
		type: 'option',
		label: 'Vandalism (WP:AIV)',
		value: 'aiv'
	});
	categories.append({
		type: 'option',
		label: 'Username (WP:UAA)',
		value: 'username',
		disabled: isIP
	});
	categories.append({
		type: 'option',
		label: 'Sockpuppeteer (WP:SPI)',
		value: 'sock'
	});
	categories.append({
		type: 'option',
		label: 'Sockpuppet (WP:SPI)',
		value: 'puppet'
	});
	categories.append({
		type: 'option',
		label: 'Edit warring (WP:AN3)',
		value: 'an3',
		disabled: Morebits.ip.isRange(uid) // rvuser template doesn't support ranges
	});
	form.append({
		type: 'div',
		label: '',
		style: 'color: red',
		id: 'twinkle-arv-blockwarning'
	});

	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.arv.callback.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', id: 'arvpreview', label: [ previewlink ] });
	form.append({ type: 'div', id: 'twinklearv-previewbox', style: 'display: none' });

	form.append({ type: 'submit' });
	form.append({
		type: 'hidden',
		name: 'uid',
		value: uid
	});

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklearv-previewbox').last()[0]);

	// Check if the user is blocked, update notice
	var query = {
		action: 'query',
		list: 'blocks',
		bkprop: 'range|flags',
		format: 'json'
	};
	if (isIP) {
		query.bkip = uid;
	} else {
		query.bkusers = uid;
	}
	new Morebits.wiki.api("Checking the user's block status", query, function(apiobj) {
		var blocklist = apiobj.getResponse().query.blocks;
		if (blocklist.length) {
			// If an IP is blocked *and* rangeblocked, only use whichever is more recent
			var block = blocklist[0];
			var message = (isIP ? 'This IP ' + (Morebits.ip.isRange(uid) ? 'range' : 'address') : 'This account') + ' is ' + (block.partial ? 'partially' : 'already') + ' blocked';
			// Start and end differ, range blocked
			message += block.rangestart !== block.rangeend ? ' as part of a rangeblock.' : '.';
			if (block.partial) {
				$('#twinkle-arv-blockwarning').css('color', 'black'); // Less severe
			}
			$('#twinkle-arv-blockwarning').text(message);
		}
	}).post();


	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

Twinkle.arv.callback.changeCategory = function (e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area = Morebits.quickForm.getElements(root, 'work_area')[0];
	var work_area = null;

	root.previewer.closePreview();

	switch (value) {
		case 'aiv':
		/* falls through */
		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Report user for vandalism',
				name: 'work_area'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'Primary linked page:',
				tooltip: 'Leave blank to not link to the page in the report',
				value: Twinkle.getPrefill('vanarticle') || '',
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					if (value === '') {
						root.badid.disabled = root.goodid.disabled = true;
					} else {
						root.badid.disabled = false;
						root.goodid.disabled = root.badid.value === '';
					}
				}
			});
			work_area.append({
				type: 'input',
				name: 'badid',
				label: 'Revision ID for target page when vandalised:',
				tooltip: 'Leave blank for no diff link',
				value: Twinkle.getPrefill('vanarticlerevid') || '',
				disabled: !Twinkle.getPrefill('vanarticle'),
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					root.goodid.disabled = value === '';
				}
			});
			work_area.append({
				type: 'input',
				name: 'goodid',
				label: 'Last good revision ID before vandalism of target page:',
				tooltip: 'Leave blank for diff link to previous revision',
				value: Twinkle.getPrefill('vanarticlegoodrevid') || '',
				disabled: !Twinkle.getPrefill('vanarticle') || Twinkle.getPrefill('vanarticlerevid')
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: 'Vandalism after final (level 4 or 4im) warning given',
						value: 'final'
					},
					{
						label: 'Vandalism after recent (within 1 day) release of block',
						value: 'postblock'
					},
					{
						label: 'Evidently a vandalism-only account',
						value: 'vandalonly',
						disabled: mw.util.isIPAddress(root.uid.value, true)
					},
					{
						label: 'Account is a promotion-only account',
						value: 'promoonly',
						disabled: mw.util.isIPAddress(root.uid.value, true)
					},
					{
						label: 'Account is evidently a spambot or a compromised account',
						value: 'spambot'
					}
				]
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Comment:'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'username':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Report username violation',
				name: 'work_area'
			});
			work_area.append({
				type: 'header',
				label: 'Type(s) of inappropriate username',
				tooltip: 'Wikipedia does not allow usernames that are misleading, promotional, offensive or disruptive. Domain names and email addresses are likewise prohibited. These criteria apply to both usernames and signatures. Usernames that are inappropriate in another language, or that represent an inappropriate name with misspellings and substitutions, or do so indirectly or by implication, are still considered inappropriate.'
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: 'Misleading username',
						value: 'misleading',
						tooltip: 'Misleading usernames imply relevant, misleading things about the contributor. For example, misleading points of fact, an impression of undue authority, or usernames giving the impression of a bot account.'
					},
					{
						label: 'Promotional username',
						value: 'promotional',
						tooltip: 'Promotional usernames are advertisements for a company, website or group. Please do not report these names to UAA unless the user has also made promotional edits related to the name.'
					},
					{
						label: 'Offensive username',
						value: 'offensive',
						tooltip: 'Offensive usernames make harmonious editing difficult or impossible.'
					},
					{
						label: 'Disruptive username',
						value: 'disruptive',
						tooltip: 'Disruptive usernames include outright trolling or personal attacks, or otherwise show a clear intent to disrupt Wikipedia.'
					}
				]
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Comment:'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'puppet':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Report suspected sockpuppet',
				name: 'work_area'
			});
			work_area.append(
				{
					type: 'input',
					name: 'sockmaster',
					label: 'Sockpuppeteer',
					tooltip: 'The username of the sockpuppeteer (sockmaster) without the "User:" prefix'
				}
			);
			work_area.append({
				type: 'textarea',
				label: 'Evidence:',
				name: 'evidence',
				tooltip: 'Your evidence should make it clear that each of these users is likely to be abusing multiple accounts. Usually this means diffs, page histories or other information that justifies why the users are a) the same and b) disruptive. This should be just evidence and information needed to judge the matter. Avoid all other discussion that is not evidence of sockpuppetry.'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Request CheckUser',
						name: 'checkuser',
						tooltip: 'CheckUser is a tool used to obtain technical evidence related to a sockpuppetry allegation. It will not be used without good cause, which you must clearly demonstrate. Make sure your evidence explains why using the tool is appropriate. It will not be used to publicly connect user accounts and IP addresses.'
					}
				]
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'sock':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Report suspected sockpuppeteer',
				name: 'work_area'
			});
			work_area.append(
				{
					type: 'dyninput',
					name: 'sockpuppets',
					label: 'Sockpuppets',
					sublabel: 'Sock:',
					tooltip: 'The username of the sockpuppet without the "User:" prefix',
					min: 2
				});
			work_area.append({
				type: 'textarea',
				label: 'Evidence:',
				name: 'evidence',
				tooltip: 'Your evidence should make it clear that each of these users is likely to be abusing multiple accounts. Usually this means diffs, page histories or other information that justifies why the users are a) the same and b) disruptive. This should be just evidence and information needed to judge the matter. Avoid all other discussion that is not evidence of sockpuppetry.'
			});
			work_area.append({
				type: 'checkbox',
				list: [ {
					label: 'Request CheckUser',
					name: 'checkuser',
					tooltip: 'CheckUser is a tool used to obtain technical evidence related to a sockpuppetry allegation. It will not be used without good cause, which you must clearly demonstrate. Make sure your evidence explains why using the tool is appropriate. It will not be used to publicly connect user accounts and IP addresses.'
				} ]
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'an3':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: 'Report edit warring',
				name: 'work_area'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: 'Page',
				tooltip: 'The page being reported'
			});
			work_area.append({
				type: 'button',
				name: 'load',
				label: 'Load',
				event: function(e) {
					var root = e.target.form;

					var date = new Morebits.date().subtract(48, 'hours'); // all since 48 hours

					// Run for each AN3 field
					var getAN3Entries = function(field, rvuser, titles) {
						var $field = $(root).find('[name=' + field + ']');
						$field.find('.entry').remove();

						new mw.Api().get({
							action: 'query',
							prop: 'revisions',
							format: 'json',
							rvprop: 'sha1|ids|timestamp|parsedcomment|comment',
							rvlimit: 500, // intentionally limited
							rvend: date.toISOString(),
							rvuser: rvuser,
							indexpageids: true,
							titles: titles
						}).done(function(data) {
							var pageid = data.query.pageids[0];
							var page = data.query.pages[pageid];
							if (!page.revisions) {
								$('<span class="entry">None found</span>').appendTo($field);
							} else {
								for (var i = 0; i < page.revisions.length; ++i) {
									var rev = page.revisions[i];
									var $entry = $('<div/>', {
										class: 'entry'
									});
									var $input = $('<input/>', {
										type: 'checkbox',
										name: 's_' + field,
										value: JSON.stringify(rev)
									});
									$input.appendTo($entry);
									var comment = '<span>';
									// revdel/os
									if (typeof rev.commenthidden === 'string') {
										comment += '(comment hidden)';
									} else {
										comment += '"' + rev.parsedcomment + '"';
									}
									comment += ' at <a href="' + mw.config.get('wgScript') + '?diff=' + rev.revid + '">' + new Morebits.date(rev.timestamp).calendar() + '</a></span>';
									$entry.append(comment).appendTo($field);
								}
							}

							// add free form input for resolves
							if (field === 'resolves') {
								var $free_entry = $('<div/>', {
									class: 'entry'
								});
								var $free_input = $('<input/>', {
									type: 'text',
									name: 's_resolves_free'
								});

								var $free_label = $('<label/>', {
									for: 's_resolves_free',
									html: 'URL link of diff with additional discussions: '
								});
								$free_entry.append($free_label).append($free_input).appendTo($field);
							}
						}).fail(function() {
							$('<span class="entry">API failure, reload page and try again</span>').appendTo($field);
						});
					};

					// warnings
					var uid = root.uid.value;
					getAN3Entries('warnings', mw.config.get('wgUserName'), 'User talk:' + uid);

					// diffs and resolves require a valid page
					var page = root.page.value;
					if (page) {
						// diffs
						getAN3Entries('diffs', uid, page);

						// resolutions
						var t = new mw.Title(page);
						var talk_page = t.getTalkPage().getPrefixedText();
						getAN3Entries('resolves', mw.config.get('wgUserName'), talk_page);
					} else {
						$(root).find('[name=diffs]').find('.entry').remove();
						$(root).find('[name=resolves]').find('.entry').remove();
					}
				}
			});
			work_area.append({
				type: 'field',
				name: 'diffs',
				label: 'User\'s reverts (within last 48 hours)',
				tooltip: 'Select the edits you believe are reverts'
			});
			work_area.append({
				type: 'field',
				name: 'warnings',
				label: 'Warnings given to subject',
				tooltip: 'You must have warned the subject before reporting'
			});
			work_area.append({
				type: 'field',
				name: 'resolves',
				label: 'Resolution initiatives',
				tooltip: 'You should have tried to resolve the issue on the talk page first'
			});

			work_area.append({
				type: 'textarea',
				label: 'Comment:',
				name: 'comment'
			});

			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}
};

Twinkle.arv.callback.evaluate = function(e) {
	var form = e.target;
	var reason = '';
	var input = Morebits.quickForm.getInputData(form);

	switch (input.category) {

		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			reason = Twinkle.arv.callback.getAivReasonOnlyWikitext(input);

			if (reason === null) {
				alert('You must specify some reason');
				return;
			}

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:Administrator intervention against vandalism';
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';

			var aivPage = new Morebits.wiki.page('Wikipedia:Administrator intervention against vandalism', 'Processing AIV request');
			aivPage.setPageSection(1);
			aivPage.setFollowRedirect(true);

			aivPage.load(function() {
				var text = aivPage.getPageText();
				var $aivLink = '<a target="_blank" href="/wiki/WP:AIV">WP:AIV</a>';

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(input.uid) + '\\s*\\}\\}').test(text)) {
					aivPage.getStatusElement().error('Report already present, will not add a new one');
					Morebits.status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $aivLink + ':');
					return;
				}

				// then check for any bot reports
				var tb2Page = new Morebits.wiki.page('Wikipedia:Administrator intervention against vandalism/TB2', 'Checking bot reports');
				tb2Page.load(function() {
					var tb2Text = tb2Page.getPageText();
					var tb2statelem = tb2Page.getStatusElement();

					if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(input.uid) + '\\s*\\}\\}').test(tb2Text)) {
						if (confirm('The user ' + input.uid + ' has already been reported by a bot. Do you wish to make the report anyway?')) {
							tb2statelem.info('Proceeded despite bot report');
						} else {
							tb2statelem.error('Report from a bot is already present, stopping');
							Morebits.status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them at ' + $aivLink + ':');
							return;
						}
					} else {
						tb2statelem.info('No conflicting bot reports');
					}

					aivPage.getStatusElement().status('Adding new report...');
					aivPage.setEditSummary('Reporting [[Special:Contributions/' + input.uid + '|' + input.uid + ']].');
					aivPage.setChangeTags(Twinkle.changeTags);
					aivPage.setAppendText();
					aivPage.append(Twinkle.arv.callback.buildAivReport(input));
				});
			});
			break;

		// Report inappropriate username
		case 'username':
			var censorUsername = input.arvtype.includes('offensive'); // check if the username is marked offensive

			reason = Twinkle.arv.callback.getUsernameReportWikitext(input);

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:Usernames for administrator attention';
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';

			var uaaPage = new Morebits.wiki.page('Wikipedia:Usernames for administrator attention', 'Processing UAA request');
			uaaPage.setFollowRedirect(true);

			uaaPage.load(function() {
				var text = uaaPage.getPageText();

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?' + Morebits.string.escapeRegExp(input.uid) + '\\s*(\\||\\})').test(text)) {
					uaaPage.getStatusElement().error('User is already listed.');
					var $uaaLink = '<a target="_blank" href="/wiki/WP:UAA">WP:UAA</a>';
					Morebits.status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $uaaLink + ':');
					return;
				}
				uaaPage.getStatusElement().status('Adding new report...');
				uaaPage.setEditSummary('Reporting ' + (censorUsername ? 'an offensive username.' : '[[Special:Contributions/' + input.uid + '|' + input.uid + ']].'));
				uaaPage.setChangeTags(Twinkle.changeTags);

				// Blank newline per [[Special:Permalink/996949310#Spacing]]; see also [[WP:LISTGAP]] and [[WP:INDENTGAP]]
				uaaPage.setPageText(text + '\n' + reason + '\n*');
				uaaPage.save();
			});
			break;

		// WP:SPI
		case 'sock':
			/* falls through */
		case 'puppet':
			var reportData = Twinkle.arv.callback.getSpiReportData(input);

			if (reportData.error) {
				alert(reportData.error);
				return;
			}

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

			var reportpage = 'Wikipedia:Sockpuppet investigations/' + reportData.sockmaster;

			Morebits.wiki.actionCompleted.redirect = reportpage;
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';

			var spiPage = new Morebits.wiki.page(reportpage, 'Retrieving discussion page');
			spiPage.setFollowRedirect(true);
			spiPage.setEditSummary('Adding new report for [[Special:Contributions/' + reportData.sockmaster + '|' + reportData.sockmaster + ']].');
			spiPage.setChangeTags(Twinkle.changeTags);
			spiPage.setAppendText(reportData.wikitext);
			spiPage.setWatchlist(Twinkle.getPref('spiWatchReport'));
			spiPage.append();

			Morebits.wiki.removeCheckpoint();  // all page updates have been started
			break;

		case 'an3':
			// prepare the AN3 report, then post and notify
			Twinkle.arv.callback.getAn3ReportData(input).then((data) => {
				// If there are any reasons why the user might want to cancel the report, check with them about each reason and cancel if they choose to
				for (var i = 0; i < data.confirmations.length; i++) {
					if (!confirm(data.confirmations[i])) {
						return;
					}
				}

				Morebits.simpleWindow.setButtonsEnabled(false);
				Morebits.status.init(form);

				Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

				var reportpage = 'Wikipedia:Administrators\' noticeboard/Edit warring';

				Morebits.wiki.actionCompleted.redirect = reportpage;
				Morebits.wiki.actionCompleted.notice = 'Reporting complete';

				var an3Page = new Morebits.wiki.page(reportpage, 'Retrieving discussion page');
				an3Page.setFollowRedirect(true);
				an3Page.setEditSummary('Adding new report for [[Special:Contributions/' + data.uid + '|' + data.uid + ']].');
				an3Page.setChangeTags(Twinkle.changeTags);
				an3Page.setAppendText(data.reportWikitext);
				an3Page.append();

				// notify user

				var notifyText = '\n\n{{subst:an3-notice|1=' + mw.util.wikiUrlencode(data.uid) + '|auto=1}} ~~~~';

				var talkPage = new Morebits.wiki.page('User talk:' + data.uid, 'Notifying edit warrior');
				talkPage.setFollowRedirect(true);
				talkPage.setEditSummary('Notifying about edit warring noticeboard discussion.');
				talkPage.setChangeTags(Twinkle.changeTags);
				talkPage.setAppendText(notifyText);
				talkPage.append();
				Morebits.wiki.removeCheckpoint();  // all page updates have been started
			});
			break;
	}
};

Twinkle.arv.callback.preview = function(form) {
	var input = Morebits.quickForm.getInputData(form);

	var reportText = '';
	switch (input.category) {
		case 'aiv':
			/* falls through */
		default:
			reportText = Twinkle.arv.callback.getAivReasonOnlyWikitext(input);

			if (reportText === null) {
				reportText = 'Preview failed: A reason must be specified.';
			} else {
				reportText = Twinkle.arv.callback.buildAivReport(input);
			}
			break;
		case 'username':
			reportText = Twinkle.arv.callback.getUsernameReportWikitext(input);
			break;
		case 'sock':
			/* falls through */
		case 'puppet':
			var reportData = Twinkle.arv.callback.getSpiReportData(input);

			if (reportData.error) {
				reportText = 'Preview failed: ' + reportData.error;
			} else {
				reportText = '__NOTOC__{{checkuser|' + reportData.sockmaster + '|master=yes}}\n' + reportData.wikitext; // add sockmaster links
			}
			break;
		case 'an3':
			form.previewer.displayLoading();
			Twinkle.arv.callback.getAn3ReportData(input).then((data) => {
				reportText = data.reportWikitext.trim();
				form.previewer.beginRender(reportText);
			});
			return; // stop here, as the preview can only be displayed when the promise resolves
	}

	form.previewer.beginRender(reportText);
};

Twinkle.arv.callback.getAivReasonOnlyWikitext = function(input) {
	var text = '';
	var type = input.arvtype;

	if (!type.length && input.reason === '') {
		return null;
	}

	type = type.map(function(v) {
		switch (v) {
			case 'final':
				return 'vandalism after final warning';
			case 'postblock':
				return 'vandalism after recent release of block';
			case 'vandalonly':
				return 'actions evidently indicate a vandalism-only account';
			case 'promoonly':
				return 'account is being used only for promotional purposes';
			case 'spambot':
				return 'account is evidently a spambot or a compromised account';
			default:
				return 'unknown reason';
		}
	}).join('; ');

	if (input.page !== '') {
		// Allow links to redirects, files, and categories
		text = 'On {{No redirect|:' + input.page + '}}';
		if (input.badid !== '') {
			text += ' ({{diff|' + input.page + '|' + input.badid + '|' + input.goodid + '|diff}})';
		}
		text += ':';
	}

	if (type) {
		text += ' ' + type;
	}

	if (input.reason !== '') {
		var textEndsInPunctuationOrBlank = /([.?!;:]|^)$/.test(text);
		text += textEndsInPunctuationOrBlank ? '' : '.';
		var textIsBlank = text === '';
		text += textIsBlank ? '' : ' ';
		text += input.reason;
	}

	text = text.trim();
	var textEndsInPunctuation = /[.?!;]$/.test(text);
	if (!textEndsInPunctuation) {
		text += '.';
	}

	text += ' ~~~~';
	text = text.replace(/\r?\n/g, '\n*:');  // indent newlines

	return text;
};

Twinkle.arv.callback.buildAivReport = function(input) {
	return '\n*{{vandal|' + (/=/.test(input.uid) ? '1=' : '') + input.uid + '}} &ndash; ' + Twinkle.arv.callback.getAivReasonOnlyWikitext(input);
};

Twinkle.arv.callback.getUsernameReportWikitext = function(input) {
	// generate human-readable string, e.g. "misleading and promotional username"
	if (input.arvtype.length <= 2) {
		input.arvtype = input.arvtype.join(' and ');
	} else {
		input.arvtype = [ input.arvtype.slice(0, -1).join(', '), input.arvtype.slice(-1) ].join(' and ');
	}

	// a or an?
	var adjective = 'a';
	if (/[aeiouwyh]/.test(input.arvtype[0] || '')) { // non 100% correct, but whatever, including 'h' for Cockney
		adjective = 'an';
	}

	var text = '*{{user-uaa|1=' + input.uid + '}} &ndash; ';
	if (input.arvtype.length) {
		text += 'Violation of the username policy as ' + adjective + ' ' + input.arvtype + ' username. ';
	}
	if (input.reason !== '') {
		text += Morebits.string.toUpperCaseFirstChar(input.reason);
		var endsInPeriod = /\.$/.test(input.reason);
		if (!endsInPeriod) {
			text += '.';
		}
		text += ' ';
	}
	text += '~~~~';
	text = text.replace(/\r?\n/g, '\n*:');  // indent newlines

	return text;
};

Twinkle.arv.callback.getSpiReportData = function(input) {
	var isPuppetReport = input.category === 'puppet';

	if (!isPuppetReport) {
		input.sockpuppets = input.sockpuppets.filter((sock) => sock !== ''); // ignore empty sockpuppet inputs
	}

	if (isPuppetReport && !input.sockmaster) {
		return { error: 'You have not entered a sockmaster account for this puppet. Consider reporting this account as a sockpuppeteer instead.' };
	} else if (!isPuppetReport && input.sockpuppets.length === 0) {
		return { error: 'You have not entered any sockpuppet account(s) for this sockmaster. Consider reporting this account as a sockpuppet instead.' };
	}

	input.sockmaster = input.sockmaster || input.uid;
	input.sockpuppets = isPuppetReport ? [input.uid] : Morebits.array.uniq(input.sockpuppets);

	var text = '\n{{subst:SPI report|' +
	input.sockpuppets.map(function(sock, index) {
		return (index + 1) + '=' + sock;
	}).join('|') + '\n|evidence=' + input.evidence + ' \n';

	if (input.checkuser) {
		text += '|checkuser=yes';
	}
	text += '}}';

	return {
		sockmaster: input.sockmaster,
		wikitext: text
	};
};

Twinkle.arv.callback.getAn3ReportData = function(input) {
	var data;
	var confirmations = [];

	var diffs = input.s_diffs ? input.s_diffs.map((revJSON) => JSON.parse(revJSON)) : [];

	if (diffs.length < 3) {
		confirmations.push('You have selected fewer than three offending edits. Do you wish to make the report anyway?');
	}

	var warnings = input.s_warnings ? input.s_warnings.map((revJSON) => JSON.parse(revJSON)) : [];

	if (!warnings.length) {
		confirmations.push('You have not selected any edits where you warned the offender. Do you wish to make the report anyway?');
	}

	var resolves = input.s_resolves ? input.s_resolves.map((revJSON) => JSON.parse(revJSON)) : [];
	var free_resolves = input.s_resolves_free;

	return new Promise((resolve, reject) => {
		if (free_resolves) {
			var query;
			var diff, oldid;
			var specialDiff = /Special:Diff\/(\d+)(?:\/(\S+))?/i.exec(free_resolves);
			if (specialDiff) {
				if (specialDiff[2]) {
					oldid = specialDiff[1];
					diff = specialDiff[2];
				} else {
					diff = specialDiff[1];
				}
			} else {
				diff = mw.util.getParamValue('diff', free_resolves);
				oldid = mw.util.getParamValue('oldid', free_resolves);
			}
			var title = mw.util.getParamValue('title', free_resolves);
			var diffNum = /^\d+$/.test(diff); // used repeatedly

			// rvdiffto in prop=revisions is deprecated, but action=compare doesn't return
			// timestamps ([[phab:T247686]]) so we can't rely on it unless necessary.
			// Likewise, we can't rely on a meaningful comment for diff=cur.
			// Additionally, links like Special:Diff/123/next, Special:Diff/123/456, or ?diff=next&oldid=123
			// would each require making use of rvdir=newer in the revisions API.
			// That requires a title parameter, so we have to use compare instead of revisions.
			if (oldid && (diff === 'cur' || (!title && (diff === 'next' || diffNum)))) {
				query = {
					action: 'compare',
					fromrev: oldid,
					prop: 'ids|title',
					format: 'json'
				};
				if (diffNum) {
					query.torev = diff;
				} else {
					query.torelative = diff;
				}
			} else {
				query = {
					action: 'query',
					prop: 'revisions',
					rvprop: 'ids|timestamp|comment',
					format: 'json',
					indexpageids: true
				};

				if (diff && oldid) {
					if (diff === 'prev') {
						query.revids = oldid;
					} else {
						query.titles = title;
						query.rvdir = 'newer';
						query.rvstartid = oldid;

						if (diff === 'next' && title) {
							query.rvlimit = 2;
						} else if (diffNum) {
							// Diffs may or may not be consecutive, no limit
							query.rvendid = diff;
						}
					}
				} else {
					// diff=next|prev|cur with no oldid
					// Implies title= exists otherwise it's not a valid diff link (well, it is, but to the Main Page)
					if (diff && /^\D+$/.test(diff)) {
						query.titles = title;
					} else {
						query.revids = diff || oldid;
					}
				}
			}

			new mw.Api().get(query).then(function(queryResponse) {
				var page;
				if (queryResponse.compare && queryResponse.compare.fromtitle === queryResponse.compare.totitle) {
					page = queryResponse;
				} else if (queryResponse.query) {
					var pageid = queryResponse.query.pageids[0];
					page = queryResponse.query.pages[pageid];
				} else {
					return;
				}
				resolve(page);
			}).catch((queryResponse) => {
				reject(queryResponse);
			});
		} else {
			resolve();
		}
	}).then((free_resolves_data) => {
		if (!resolves.length && !free_resolves_data) {
			confirmations.push('You have not selected any edits where you tried to resolve the issue. Do you wish to make the report anyway?');
		}

		data = {
			uid: input.uid,
			page: input.page,
			comment: input.comment,
			diffs: diffs,
			warnings: warnings,
			resolves: resolves,
			free_resolves: free_resolves_data,
			confirmations: confirmations
		};

		var minid;
		for (var i = 0; i < data.diffs.length; ++i) {
			if (data.diffs[i].parentid && (!minid || data.diffs[i].parentid < minid)) {
				minid = data.diffs[i].parentid;
			}
		}

		return new mw.Api().get({
			action: 'query',
			prop: 'revisions',
			format: 'json',
			rvprop: 'sha1|ids|timestamp|comment',
			rvlimit: 100, // intentionally limited
			rvstartid: minid,
			rvexcludeuser: data.uid,
			indexpageids: true,
			titles: data.page
		});
	}).then((queryResponse) => {
		// In case an edit summary was revdel'd
		var hasHiddenComment = function(rev) {
			if (!rev.comment && typeof rev.commenthidden === 'string') {
				return '(comment hidden)';
			}
			// swap curly braces for HTML entities to avoid templates being rendered if they were included in an edit summary
			return '"' + rev.comment.replace('{', '&#123;').replace('}', '&#125;') + '"';

		};

		var orig;
		if (queryResponse.length) {
			var sha1 = queryResponse[0].sha1;
			for (var i = 1; i < queryResponse.length; ++i) {
				if (queryResponse[i].sha1 === sha1) {
					orig = queryResponse[i];
					break;
				}
			}

			if (!orig) {
				orig = queryResponse[0];
			}
		}

		var origtext = '';
		if (orig) {
			origtext = '{{diff2|' + orig.revid + '|' + orig.timestamp + '}} ' + hasHiddenComment(orig);
		}

		var grouped_diffs = {};

		var parentid, lastid;
		for (var j = 0; j < data.diffs.length; ++j) {
			var cur = data.diffs[j];
			if ((cur.revid && cur.revid !== parentid) || lastid === null) {
				lastid = cur.revid;
				grouped_diffs[lastid] = [];
			}
			parentid = cur.parentid;
			grouped_diffs[lastid].push(cur);
		}

		var difftext = $.map(grouped_diffs, function(sub) {
			var ret = '';
			if (sub.length >= 2) {
				var last = sub[0];
				var first = sub.slice(-1)[0];
				var label = 'Consecutive edits made from ' + new Morebits.date(first.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) to ' + new Morebits.date(last.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)';
				ret = '# {{diff|oldid=' + first.parentid + '|diff=' + last.revid + '|label=' + label + '}}\n';
			}
			ret += sub.reverse().map(function(v) {
				return (sub.length >= 2 ? '#' : '') + '# {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
			}).join('\n');
			return ret;
		}).reverse().join('\n');
		var warningtext = data.warnings.reverse().map(function(v) {
			return '# ' + ' {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
		}).join('\n');
		var resolvetext = data.resolves.reverse().map(function(v) {
			return '# ' + ' {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
		}).join('\n');

		if (data.free_resolves) {
			var page = data.free_resolves;
			if (page.compare) {
				resolvetext += '\n# ' + ' {{diff|oldid=' + page.compare.fromrevid + '|diff=' + page.compare.torevid + '|label=Consecutive edits on ' + page.compare.totitle + '}}';
			} else if (page.revisions) {
				var revCount = page.revisions.length;
				var rev;
				if (revCount < 3) { // diff=prev or next
					rev = revCount === 1 ? page.revisions[0] : page.revisions[1];
					resolvetext += '\n# ' + ' {{diff2|' + rev.revid + '|' + new Morebits.date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) on ' + page.title + '}} ' + hasHiddenComment(rev);
				} else { // diff and oldid are nonconsecutive
					rev = page.revisions[0];
					var revLatest = page.revisions[revCount - 1];
					var label = 'Consecutive edits made from ' + new Morebits.date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) to ' + new Morebits.date(revLatest.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) on ' + page.title;
					resolvetext += '\n# {{diff|oldid=' + rev.revid + '|diff=' + revLatest.revid + '|label=' + label + '}}\n';
				}
			}
		}

		var comment = data.comment.replace(/~*$/g, '').trim();

		if (comment) {
			comment += ' ~~~~';
		}

		var reportWikitext = '\n\n' + '{{subst:AN3 report|diffs=' + difftext + '|warnings=' + warningtext + '|resolves=' + resolvetext + '|pagename=' + data.page + '|orig=' + origtext + '|comment=' + comment + '|uid=' + data.uid + '}}';

		return {
			uid: data.uid,
			reportWikitext: reportWikitext,
			confirmations: data.confirmations
		};
	}).catch((errorData) => {
		return Promise.reject({ message: 'API failed :(', data: errorData });
	});
};

Twinkle.addInitCallback(Twinkle.arv, 'arv');
})(jQuery);


// </nowiki>
