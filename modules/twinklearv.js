// <nowiki>

(function() {

/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.arv = function twinklearv() {
	const username = mw.config.get('wgRelevantUserName');
	if (!username || username === mw.config.get('wgUserName')) {
		return;
	}

	const isIP = mw.util.isIPAddress(username, true);
	// Ignore ranges wider than the CIDR limit
	if (Morebits.ip.isRange(username) && !Morebits.ip.validCIDR(username)) {
		return;
	}
	const userType = isIP ? 'IP' + (Morebits.ip.isRange(username) ? ' range' : '') : 'user';

	Twinkle.addPortletLink(() => {
		Twinkle.arv.callback(username, isIP);
	}, 'ARV', 'tw-arv', 'Report ' + userType + ' to administrators');
};

Twinkle.arv.callback = function (uid, isIP) {
	const Window = new Morebits.SimpleWindow(600, 500);
	Window.setTitle('Advance Reporting and Vetting'); // Backronym
	Window.setScriptName('Twinkle');
	Window.addFooterLink('AIV guide', 'WP:GAIV');
	Window.addFooterLink('UAA guide', 'WP:UAAI');
	Window.addFooterLink('SPI guide', 'Wikipedia:Sockpuppet investigations/SPI/Guide to filing cases');
	Window.addFooterLink('ARV prefs', 'WP:TW/PREF#arv');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#arv');
	Window.addFooterLink('Give feedback', 'WT:TW');

	const form = new Morebits.QuickForm(Twinkle.arv.callback.evaluate);
	const categories = form.append({
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

	// Temporary account notice
	if (mw.config.get('wgRelevantUserName') && mw.util.isTemporaryUser(mw.config.get('wgRelevantUserName')) && !mw.config.get('wgCheckUserTemporaryAccountIPRevealAllowed')) {
		const temporaryAccountNotice = form.append({
			type: 'field',
			label: 'Temporary account notice',
			name: 'ta_notice',
			style: 'color: var(--morebits-color-warning, #FF4500)'
		});

		temporaryAccountNotice.append({
			type: 'div',
			label: 'You are reporting a [[Wikipedia:Temporary accounts|temporary account]]. These accounts, with usernames like ~2025-12345-67, have replaced IP addresses. Please be careful when reporting for sockpuppetry and when blocking, because other users and temporary accounts on the same IP may end up as collateral damage.'
		});
	}

	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit' });
	form.append({
		type: 'hidden',
		name: 'uid',
		value: uid
	});

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// Check if the user is blocked, update notice
	const query = {
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
	new Morebits.wiki.Api("Checking the user's block status", query, ((apiobj) => {
		const blocklist = apiobj.getResponse().query.blocks;
		if (blocklist.length) {
			// If an IP is blocked *and* rangeblocked, only use whichever is more recent
			const block = blocklist[0];
			let message = (isIP ? 'This IP ' + (Morebits.ip.isRange(uid) ? 'range' : 'address') : 'This account') + ' is ' + (block.partial ? 'partially' : 'already') + ' blocked';
			// Start and end differ, range blocked
			message += block.rangestart !== block.rangeend ? ' as part of a rangeblock.' : '.';
			if (block.partial) {
				$('#twinkle-arv-blockwarning').css('color', 'black'); // Less severe
			}
			$('#twinkle-arv-blockwarning').text(message);
		}
	})).post();

	// We must init the
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

Twinkle.arv.callback.changeCategory = function (e) {
	const value = e.target.value;
	const root = e.target.form;
	const old_area = Morebits.QuickForm.getElements(root, 'work_area')[0];
	let work_area = null;

	switch (value) {
		case 'aiv':
		/* falls through */
		default:
			work_area = new Morebits.QuickForm.Element({
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
					const value = e.target.value;
					const root = e.target.form;
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
					const value = e.target.value;
					const root = e.target.form;
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
			work_area = new Morebits.QuickForm.Element({
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
			work_area = new Morebits.QuickForm.Element({
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
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'sock':
			work_area = new Morebits.QuickForm.Element({
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
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'an3':
			work_area = new Morebits.QuickForm.Element({
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
					const root = e.target.form;

					const date = new Morebits.Date().subtract(48, 'hours'); // all since 48 hours

					// Run for each AN3 field
					const getAN3Entries = function(field, rvuser, titles) {
						const $field = $(root).find('[name=' + field + ']');
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
						}).done((data) => {
							const pageid = data.query.pageids[0];
							const page = data.query.pages[pageid];
							if (!page.revisions) {
								$('<span class="entry">None found</span>').appendTo($field);
							} else {
								for (let i = 0; i < page.revisions.length; ++i) {
									const rev = page.revisions[i];
									const $entry = $('<div>', {
										class: 'entry'
									});
									const $input = $('<input>', {
										type: 'checkbox',
										name: 's_' + field,
										value: JSON.stringify(rev)
									});
									$input.appendTo($entry);
									let comment = '<span>';
									// revdel/os
									if (typeof rev.commenthidden === 'string') {
										comment += '(comment hidden)';
									} else {
										comment += '"' + rev.parsedcomment + '"';
									}
									comment += ' at <a href="' + mw.config.get('wgScript') + '?diff=' + rev.revid + '">' + new Morebits.Date(rev.timestamp).calendar() + '</a></span>';
									$entry.append(comment).appendTo($field);
								}
							}

							// add free form input for resolves
							if (field === 'resolves') {
								const $free_entry = $('<div>', {
									class: 'entry'
								});
								const $free_input = $('<input>', {
									type: 'text',
									name: 's_resolves_free'
								});

								const $free_label = $('<label>', {
									for: 's_resolves_free',
									html: 'URL link of diff with additional discussions: '
								});
								$free_entry.append($free_label).append($free_input).appendTo($field);
							}
						}).fail(() => {
							$('<span class="entry">API failure, reload page and try again</span>').appendTo($field);
						});
					};

					// warnings
					const uid = root.uid.value;
					getAN3Entries('warnings', mw.config.get('wgUserName'), 'User talk:' + uid);

					// diffs and resolves require a valid page
					const page = root.page.value;
					if (page) {
						// diffs
						getAN3Entries('diffs', uid, page);

						// resolutions
						const t = new mw.Title(page);
						const talk_page = t.getTalkPage().getPrefixedText();
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
	const form = e.target;
	let reason = '';
	const input = Morebits.QuickForm.getInputData(form);

	switch (input.category) {

		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			reason = Twinkle.arv.callback.getAivReasonWikitext(input);

			if (reason === null) {
				alert('You must specify some reason');
				return;
			}

			Morebits.SimpleWindow.setButtonsEnabled(false);
			Morebits.Status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:Administrator intervention against vandalism';
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';

			var aivPage = new Morebits.wiki.Page('Wikipedia:Administrator intervention against vandalism', 'Processing AIV request');
			aivPage.setPageSection(1);
			aivPage.setFollowRedirect(true);

			aivPage.load(() => {
				const text = aivPage.getPageText();
				const $aivLink = '<a target="_blank" href="/wiki/WP:AIV">WP:AIV</a>';

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(input.uid) + '\\s*\\}\\}').test(text)) {
					aivPage.getStatusElement().error('Report already present, will not add a new one');
					Morebits.Status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $aivLink + ':');
					return;
				}

				// then check for any bot reports
				const tb2Page = new Morebits.wiki.Page('Wikipedia:Administrator intervention against vandalism/TB2', 'Checking bot reports');
				tb2Page.load(() => {
					const tb2Text = tb2Page.getPageText();
					const tb2statelem = tb2Page.getStatusElement();

					if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(input.uid) + '\\s*\\}\\}').test(tb2Text)) {
						if (confirm('The user ' + input.uid + ' has already been reported by a bot. Do you wish to make the report anyway?')) {
							tb2statelem.info('Proceeded despite bot report');
						} else {
							tb2statelem.error('Report from a bot is already present, stopping');
							Morebits.Status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them at ' + $aivLink + ':');
							return;
						}
					} else {
						tb2statelem.info('No conflicting bot reports');
					}

					aivPage.getStatusElement().status('Adding new report...');
					aivPage.setEditSummary('Reporting [[Special:Contributions/' + input.uid + '|' + input.uid + ']].');
					aivPage.setChangeTags(Twinkle.changeTags);
					aivPage.setAppendText(Twinkle.arv.callback.buildAivReport(input));
					aivPage.append();
				});
			});
			break;

		// Report inappropriate username
		case 'username':
			var censorUsername = input.arvtype.includes('offensive'); // check if the username is marked offensive

			reason = Twinkle.arv.callback.getUsernameReportWikitext(input);

			Morebits.SimpleWindow.setButtonsEnabled(false);
			Morebits.Status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:Usernames for administrator attention';
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';

			var uaaPage = new Morebits.wiki.Page('Wikipedia:Usernames for administrator attention', 'Processing UAA request');
			uaaPage.setFollowRedirect(true);

			uaaPage.load(() => {
				const text = uaaPage.getPageText();

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?' + Morebits.string.escapeRegExp(input.uid) + '\\s*(\\||\\})').test(text)) {
					uaaPage.getStatusElement().error('User is already listed.');
					const $uaaLink = '<a target="_blank" href="/wiki/WP:UAA">WP:UAA</a>';
					Morebits.Status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $uaaLink + ':');
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

			Morebits.SimpleWindow.setButtonsEnabled(false);
			Morebits.Status.init(form);

			Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

			var reportpage = 'Wikipedia:Sockpuppet investigations/' + reportData.sockmaster;

			Morebits.wiki.actionCompleted.redirect = reportpage;
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';

			var spiPage = new Morebits.wiki.Page(reportpage, 'Retrieving discussion page');
			spiPage.setFollowRedirect(true);
			spiPage.setEditSummary('Adding new report for [[Special:Contributions/' + reportData.sockmaster + '|' + reportData.sockmaster + ']].');
			spiPage.setChangeTags(Twinkle.changeTags);
			spiPage.setAppendText(reportData.wikitext);
			spiPage.setWatchlist(Twinkle.getPref('spiWatchReport'));
			spiPage.append();

			Morebits.wiki.removeCheckpoint(); // all page updates have been started
			break;

		case 'an3':
			// prepare the AN3 report, then post and notify
			Twinkle.arv.callback.getAn3ReportData(input).then((data) => {
				// If there are any reasons why the user might want to cancel the report, check with them about each reason and cancel if they choose to
				for (const confirmation of data.confirmations) {
					if (!confirm(confirmation)) {
						return;
					}
				}

				Morebits.SimpleWindow.setButtonsEnabled(false);
				Morebits.Status.init(form);

				Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

				const reportpage = 'Wikipedia:Administrators\' noticeboard/Edit warring';

				Morebits.wiki.actionCompleted.redirect = reportpage;
				Morebits.wiki.actionCompleted.notice = 'Reporting complete';

				const an3Page = new Morebits.wiki.Page(reportpage, 'Retrieving discussion page');
				an3Page.setFollowRedirect(true);
				an3Page.setEditSummary('Adding new report for [[Special:Contributions/' + data.uid + '|' + data.uid + ']].');
				an3Page.setChangeTags(Twinkle.changeTags);
				an3Page.setAppendText(data.reportWikitext);
				an3Page.append();

				// notify user

				const notifyText = '\n\n{{subst:an3-notice|1=' + mw.util.wikiUrlencode(data.uid) + '|auto=1}} ~~~~';

				const talkPage = new Morebits.wiki.Page('User talk:' + data.uid, 'Notifying edit warrior');
				talkPage.setFollowRedirect(true);
				talkPage.setEditSummary('Notifying about edit warring noticeboard discussion.');
				talkPage.setChangeTags(Twinkle.changeTags);
				talkPage.setAppendText(notifyText);
				talkPage.append();
				Morebits.wiki.removeCheckpoint(); // all page updates have been started
			}).catch((error) => {
				console.error('Error occurred while preparing AN3 report.', error); // eslint-disable-line no-console
				alert('Error occurred while preparing AN3 report: ' + error.message);
			});
			break;
	}
};

Twinkle.arv.callback.getAivReasonWikitext = function(input) {
	let text = '';
	let type = input.arvtype;

	if (!type.length && input.reason === '') {
		return null;
	}

	type = type.map((v) => {
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
		const textEndsInPunctuationOrBlank = /([.?!;:]|^)$/.test(text);
		text += textEndsInPunctuationOrBlank ? '' : '.';
		const textIsBlank = text === '';
		text += textIsBlank ? '' : ' ';
		text += input.reason;
	}

	text = text.trim();
	const textEndsInPunctuation = /[.?!;]$/.test(text);
	if (!textEndsInPunctuation) {
		text += '.';
	}

	text += ' ~~~~';
	text = text.replace(/\r?\n/g, '\n*:'); // indent newlines

	return text;
};

Twinkle.arv.callback.buildAivReport = function(input) {
	return '\n*{{vandal|' + (/=/.test(input.uid) ? '1=' : '') + input.uid + '}} &ndash; ' + Twinkle.arv.callback.getAivReasonWikitext(input);
};

Twinkle.arv.callback.getUsernameReportWikitext = function(input) {
	// generate human-readable string, e.g. "misleading and promotional username"
	if (input.arvtype.length <= 2) {
		input.arvtype = input.arvtype.join(' and ');
	} else {
		input.arvtype = [ input.arvtype.slice(0, -1).join(', '), input.arvtype.slice(-1) ].join(' and ');
	}

	// a or an?
	let adjective = 'a';
	if (/[aeiouwyh]/.test(input.arvtype[0] || '')) { // non 100% correct, but whatever, including 'h' for Cockney
		adjective = 'an';
	}

	let text = '*{{user-uaa|1=' + input.uid + '}} &ndash; ';
	if (input.arvtype.length) {
		text += 'Violation of the username policy as ' + adjective + ' ' + input.arvtype + ' username. ';
	}
	if (input.reason !== '') {
		text += Morebits.string.toUpperCaseFirstChar(input.reason);
		const endsInPeriod = /\.$/.test(input.reason);
		if (!endsInPeriod) {
			text += '.';
		}
		text += ' ';
	}
	text += '~~~~';
	text = text.replace(/\r?\n/g, '\n*:'); // indent newlines

	return text;
};

Twinkle.arv.callback.getSpiReportData = function(input) {
	const isPuppetReport = input.category === 'puppet';

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

	let text = '\n{{subst:SPI report|' +
		input.sockpuppets.map((sock, index) => (index + 1) + '=' + sock).join('|') + '\n|evidence=' + input.evidence + ' \n';

	text += '}}';

	return {
		sockmaster: input.sockmaster,
		wikitext: text
	};
};

Twinkle.arv.callback.getAn3ReportData = async function(input) {
	const confirmations = [];

	const diffs = input.s_diffs ? input.s_diffs.map(JSON.parse) : [];

	if (diffs.length < 3) {
		confirmations.push('You have selected fewer than three offending edits. Do you wish to make the report anyway?');
	}

	const warnings = input.s_warnings ? input.s_warnings.map(JSON.parse) : [];

	if (!warnings.length) {
		confirmations.push('You have not selected any edits where you warned the offender. Do you wish to make the report anyway?');
	}

	const resolves = input.s_resolves ? input.s_resolves.map(JSON.parse) : [];
	const freeResolves = input.s_resolves_free;

	let freeResolvesData;
	if (freeResolves) {
		let query;
		let diff, oldid;
		const specialDiff = /Special:Diff\/(\d+)(?:\/(\S+))?/i.exec(freeResolves);
		if (specialDiff) {
			if (specialDiff[2]) {
				oldid = specialDiff[1];
				diff = specialDiff[2];
			} else {
				diff = specialDiff[1];
			}
		} else {
			diff = mw.util.getParamValue('diff', freeResolves);
			oldid = mw.util.getParamValue('oldid', freeResolves);
		}
		const title = mw.util.getParamValue('title', freeResolves);
		const diffNum = /^\d+$/.test(diff); // used repeatedly

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

		let queryResponse;
		try {
			queryResponse = await new mw.Api().get(query);
		} catch (err) {
			const error = new Error('Call to MediaWiki API failed.');
			error.cause = err;
			throw error;
		}

		if (queryResponse.compare && queryResponse.compare.fromtitle === queryResponse.compare.totitle) {
			freeResolvesData = queryResponse;
		} else if (queryResponse.query) {
			const pageIds = queryResponse.query.pageids;
			if (!Array.isArray(pageIds) || pageIds.length !== 1) {
				const error = new Error('Error parsing diff.');
				error.cause = queryResponse;
				throw error;
			}
			freeResolvesData = queryResponse.query.pages[pageIds[0]];
		} else {
			const error = new Error('Could not find any diff associated with the URL provided.');
			error.cause = queryResponse;
			throw error;
		}
	} else {
		freeResolvesData = undefined;
	}

	if (!resolves.length && !freeResolvesData) {
		confirmations.push('You have not selected any edits where you tried to resolve the issue. Do you wish to make the report anyway?');
	}

	const data = {
		uid: input.uid,
		page: input.page,
		comment: input.comment,
		diffs: diffs,
		warnings: warnings,
		resolves: resolves,
		free_resolves: freeResolvesData,
		confirmations: confirmations
	};

	let minid;
	for (let i = 0; i < data.diffs.length; ++i) {
		if (data.diffs[i].parentid && (!minid || data.diffs[i].parentid < minid)) {
			minid = data.diffs[i].parentid;
		}
	}

	let queryResponse;
	try {
		queryResponse = await new mw.Api().get({
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
	} catch (err) {
		const error = new Error('Call to MediaWiki API failed.');
		error.cause = err;
		throw error;
	}

	// In case an edit summary was revdel'd
	const hasHiddenComment = function(rev) {
		if (!rev.comment && typeof rev.commenthidden === 'string') {
			return '(comment hidden)';
		}
		// swap curly braces for HTML entities to avoid templates being rendered if they were included in an edit summary
		return '"' + rev.comment.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;') + '"';
	};

	// TODO: The logic for filling the |orig= parameter in the report template seems to be broken. The API call does not seem to be parsed properly. It appears as if the data parameter of the callback is being used as if it were an array, but it isn't one - it's actually the entire API response object. I think adding queryResponse = queryResponse.query.pages[queryResponse.query.pageids[0]].revisions; after `let orig;` would convert it to the array it thinks it's dealing with, but I really have no idea what the actual goal is, so I can't figure out whether or not that's correct. -- Tollens
	let orig;
	if (queryResponse.length) {
		const sha1 = queryResponse[0].sha1;
		for (let i = 1; i < queryResponse.length; ++i) {
			if (queryResponse[i].sha1 === sha1) {
				orig = queryResponse[i];
				break;
			}
		}

		if (!orig) {
			orig = queryResponse[0];
		}
	}

	let origtext = '';
	if (orig) {
		origtext = '{{diff2|' + orig.revid + '|' + orig.timestamp + '}} ' + hasHiddenComment(orig);
	}

	const groupedDiffs = {};
	let parentid, lastid;
	for (let j = 0; j < data.diffs.length; ++j) {
		const cur = data.diffs[j];
		if ((cur.revid && cur.revid !== parentid) || lastid === null) {
			lastid = cur.revid;
			groupedDiffs[lastid] = [];
		}
		parentid = cur.parentid;
		groupedDiffs[lastid].push(cur);
	}

	const difftext = $.map(groupedDiffs, (sub) => {
		let ret = '';
		if (sub.length >= 2) {
			const last = sub[0];
			const first = sub.slice(-1)[0];
			const label = 'Consecutive edits made from ' + new Morebits.Date(first.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) to ' + new Morebits.Date(last.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)';
			ret = '# {{diff|oldid=' + first.parentid + '|diff=' + last.revid + '|label=' + label + '}}\n';
		}
		ret += sub.reverse().map((v) => (sub.length >= 2 ? '#' : '') + '# {{diff2|' + v.revid + '|' + new Morebits.Date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v)).join('\n');

		return ret;
	}).reverse().join('\n');
	const warningtext = data.warnings.reverse().map((v) => '#  {{diff2|' + v.revid + '|' + new Morebits.Date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v)).join('\n');

	let resolvetext = data.resolves.reverse().map((v) => '#  {{diff2|' + v.revid + '|' + new Morebits.Date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v)).join('\n');

	if (data.free_resolves) {
		const page = data.free_resolves;
		if (page.compare) {
			resolvetext += '\n# {{diff|oldid=' + page.compare.fromrevid + '|diff=' + page.compare.torevid + '|label=Consecutive edits on ' + page.compare.totitle + '}}';
		} else if (page.revisions) {
			const revCount = page.revisions.length;
			let rev;
			if (revCount < 3) { // diff=prev or next
				rev = revCount === 1 ? page.revisions[0] : page.revisions[1];
				resolvetext += '\n# {{diff2|' + rev.revid + '|' + new Morebits.Date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) on ' + page.title + '}} ' + hasHiddenComment(rev);
			} else { // diff and oldid are nonconsecutive
				rev = page.revisions[0];
				const revLatest = page.revisions[revCount - 1];
				const label = 'Consecutive edits made from ' + new Morebits.Date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) to ' + new Morebits.Date(revLatest.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) on ' + page.title;
				resolvetext += '\n# {{diff|oldid=' + rev.revid + '|diff=' + revLatest.revid + '|label=' + label + '}}\n';
			}
		}
	}

	let comment = data.comment.replace(/~*$/g, '').trim();

	if (comment) {
		comment += ' ~~~~';
	}

	const reportWikitext = '\n\n{{subst:AN3 report|diffs=' + difftext + '|warnings=' + warningtext + '|resolves=' + resolvetext + '|pagename=' + data.page + '|orig=' + origtext + '|comment=' + comment + '|uid=' + data.uid + '}}';

	return {
		uid: data.uid,
		reportWikitext: reportWikitext,
		confirmations: data.confirmations
	};
};

Twinkle.addInitCallback(Twinkle.arv, 'arv');
}());

// </nowiki>
