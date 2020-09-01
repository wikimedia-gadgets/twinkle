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

	var title = mw.util.isIPAddress(username) ? 'Report IP to administrators' : 'Report user to administrators';

	Twinkle.addPortletLink(function() {
		Twinkle.arv.callback(username);
	}, 'ARV', 'tw-arv', title);
};

Twinkle.arv.callback = function (uid) {
	var Window = new Morebits.simpleWindow(600, 500);
	Window.setTitle('Advance Reporting and Vetting'); // Backronym
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Guide to AIV', 'WP:GAIV');
	Window.addFooterLink('UAA instructions', 'WP:UAAI');
	Window.addFooterLink('About SPI', 'WP:SPI');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#arv');

	var form = new Morebits.quickForm(Twinkle.arv.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: 'Select report type: ',
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
		disabled: mw.util.isIPAddress(uid)
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
		value: 'an3'
	});
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

	var result = form.render();
	Window.setContent(result);
	Window.display();

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
				label: 'Primary linked page: ',
				tooltip: 'Leave blank to not link to the page in the report',
				value: mw.util.getParamValue('vanarticle') || '',
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
				label: 'Revision ID for target page when vandalised: ',
				tooltip: 'Leave blank for no diff link',
				value: mw.util.getParamValue('vanarticlerevid') || '',
				disabled: !mw.util.getParamValue('vanarticle'),
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					root.goodid.disabled = value === '';
				}
			});
			work_area.append({
				type: 'input',
				name: 'goodid',
				label: 'Last good revision ID before vandalism of target page: ',
				tooltip: 'Leave blank for diff link to previous revision',
				value: mw.util.getParamValue('vanarticlegoodrevid') || '',
				disabled: !mw.util.getParamValue('vanarticle') || mw.util.getParamValue('vanarticlerevid')
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
						disabled: mw.util.isIPAddress(root.uid.value)
					},
					{
						label: 'Account is a promotion-only account',
						value: 'promoonly',
						disabled: mw.util.isIPAddress(root.uid.value)
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
				label: 'Comment: '
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
						label: 'Username that implies shared use',
						value: 'shared',
						tooltip: 'Usernames that imply the likelihood of shared use (names of companies or groups, or the names of posts within organizations) are not permitted. Usernames are acceptable if they contain a company or group name but are clearly intended to denote an individual person, such as "Mark at WidgetsUSA", "Jack Smith at the XY Foundation", "WidgetFan87", etc.'
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
					tooltip: 'The username of the sockpuppeteer (sockmaster) without the User:-prefix'
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
					},
					{
						label: 'Notify reported users',
						name: 'notify',
						tooltip: 'Notification is not mandatory. In many cases, especially of chronic sockpuppeteers, notification may be counterproductive. However, especially in less egregious cases involving users who have not been reported before, notification may make the cases fairer and also appear to be fairer in the eyes of the accused. Use your judgment.'
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
					name: 'sockpuppet',
					label: 'Sockpuppets',
					sublabel: 'Sock: ',
					tooltip: 'The username of the sockpuppet without the User:-prefix',
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
				}, {
					label: 'Notify reported users',
					name: 'notify',
					tooltip: 'Notification is not mandatory. In many cases, especially of chronic sockpuppeteers, notification may be counterproductive. However, especially in less egregious cases involving users who have not been reported before, notification may make the cases fairer and also appear to be fairer in the eyes of the accused. Use your judgment.'
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
							redirects: true,
							titles: titles
						}).done(function(data) {
							var pageid = data.query.pageids[0];
							var page = data.query.pages[pageid];
							if (!page.revisions) {
								$('<span class="entry">None found</span>').appendTo($field);
								return;
							}
							for (var i = 0; i < page.revisions.length; ++i) {
								var rev = page.revisions[i];
								var $entry = $('<div/>', {
									'class': 'entry'
								});
								var $input = $('<input/>', {
									'type': 'checkbox',
									'name': 's_' + field,
									'value': rev.revid
								});
								$input.data('revinfo', rev);
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

							// add free form input for resolves
							if (field === 'resolves') {
								var $free_entry = $('<div/>', {
									'class': 'entry'
								});
								var $free_input = $('<input/>', {
									'type': 'text',
									'name': 's_resolves_free'
								});

								var $free_label = $('<label/>', {
									'for': 's_resolves_free',
									'html': 'URL link of diff with additional discussions: '
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
				label: 'User\'s reverts',
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
	var comment = '';
	if (form.reason) {
		comment = form.reason.value;
	}
	var uid = form.uid.value;

	var types;
	switch (form.category.value) {

		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			types = form.getChecked('arvtype');
			if (!types.length && comment === '') {
				alert('You must specify some reason');
				return;
			}

			types = types.map(function(v) {
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


			if (form.page.value !== '') {
				// Allow links to redirects, files, and categories
				reason = 'On {{No redirect|:' + form.page.value + '}}';

				if (form.badid.value !== '') {
					reason += ' ({{diff|' + form.page.value + '|' + form.badid.value + '|' + form.goodid.value + '|diff}})';
				}
				reason += ':';
			}

			if (types) {
				reason += ' ' + types;
			}
			if (comment !== '') {
				reason += (reason === '' ? '' : '. ') + comment;
			}
			reason = reason.trim();
			if (!/[.?!;]$/.test(reason)) {
				reason += '.';
			}
			reason += ' ~~~~';
			reason = reason.replace(/\r?\n/g, '\n*:');  // indent newlines

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
				if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(uid) + '\\s*\\}\\}').test(text)) {
					aivPage.getStatusElement().error('Report already present, will not add a new one');
					Morebits.status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $aivLink + ':');
					return;
				}

				// then check for any bot reports
				var tb2Page = new Morebits.wiki.page('Wikipedia:Administrator intervention against vandalism/TB2', 'Checking bot reports');
				tb2Page.load(function() {
					var tb2Text = tb2Page.getPageText();
					var tb2statelem = tb2Page.getStatusElement();

					if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(uid) + '\\s*\\}\\}').test(tb2Text)) {
						if (confirm('The user ' + uid + ' has already been reported by a bot. Do you wish to make the report anyway?')) {
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
					aivPage.setEditSummary('Reporting [[Special:Contributions/' + uid + '|' + uid + ']].');
					aivPage.setChangeTags(Twinkle.changeTags);
					aivPage.setAppendText('\n*{{' + (mw.util.isIPAddress(uid) ? 'IPvandal' : 'vandal') + '|' + (/=/.test(uid) ? '1=' : '') + uid + '}} &ndash; ' + reason);
					aivPage.append();
				});
			});
			break;

		// Report inappropriate username
		case 'username':
			types = form.getChecked('arvtype').map(Morebits.string.toLowerCaseFirstChar);

			var hasShared = types.indexOf('shared') > -1;
			if (hasShared) {
				types.splice(types.indexOf('shared'), 1);
			}

			if (types.length <= 2) {
				types = types.join(' and ');
			} else {
				types = [ types.slice(0, -1).join(', '), types.slice(-1) ].join(' and ');
			}
			var article = 'a';
			if (/[aeiouwyh]/.test(types[0] || '')) { // non 100% correct, but whatever, including 'h' for Cockney
				article = 'an';
			}
			reason = '*{{user-uaa|1=' + uid + '}} &ndash; ';
			if (types.length || hasShared) {
				reason += 'Violation of the username policy as ' + article + ' ' + types + ' username' +
					(hasShared ? ' that implies shared use. ' : '. ');
			}
			if (comment !== '') {
				reason += Morebits.string.toUpperCaseFirstChar(comment) + '. ';
			}
			reason += '~~~~';
			reason = reason.replace(/\r?\n/g, '\n*:');  // indent newlines

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:Usernames for administrator attention';
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';

			var uaaPage = new Morebits.wiki.page('Wikipedia:Usernames for administrator attention', 'Processing UAA request');
			uaaPage.setFollowRedirect(true);

			uaaPage.load(function() {
				var text = uaaPage.getPageText();

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?' + Morebits.string.escapeRegExp(uid) + '\\s*(\\||\\})').test(text)) {
					uaaPage.getStatusElement().error('User is already listed.');
					var $uaaLink = '<a target="_blank" href="/wiki/WP:UAA">WP:UAA</a>';
					Morebits.status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $uaaLink + ':');
					return;
				}
				uaaPage.getStatusElement().status('Adding new report...');
				uaaPage.setEditSummary('Reporting [[Special:Contributions/' + uid + '|' + uid + ']].');
				uaaPage.setChangeTags(Twinkle.changeTags);
				uaaPage.setPageText(text + '\n' + reason);
				uaaPage.save();
			});
			break;

		// WP:SPI
		case 'sock':
			/* falls through */
		case 'puppet':
			var sockParameters = {
				evidence: form.evidence.value.trim(),
				checkuser: form.checkuser.checked,
				notify: form.notify.checked
			};

			var puppetReport = form.category.value === 'puppet';
			if (puppetReport && !form.sockmaster.value.trim()) {
				alert('You have not entered a sockmaster account for this puppet. Consider reporting this account as a sockpuppeteer instead.');
				return;
			} else if (!puppetReport && !form.sockpuppet[0].value.trim()) {
				alert('You have not entered any sockpuppet account(s) for this sockmaster. Consider reporting this account as a sockpuppet instead.');
				return;
			}

			sockParameters.uid = puppetReport ? form.sockmaster.value.trim() : uid;
			sockParameters.sockpuppets = puppetReport ? [uid] : $.map($('input:text[name=sockpuppet]', form), function(o) {
				return $(o).val() || null;
			});

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);
			Twinkle.arv.processSock(sockParameters);
			break;

		case 'an3':
			var diffs = $.map($('input:checkbox[name=s_diffs]:checked', form), function(o) {
				return $(o).data('revinfo');
			});

			if (diffs.length < 3 && !confirm('You have selected fewer than three offending edits. Do you wish to make the report anyway?')) {
				return;
			}

			var warnings = $.map($('input:checkbox[name=s_warnings]:checked', form), function(o) {
				return $(o).data('revinfo');
			});

			if (!warnings.length && !confirm('You have not selected any edits where you warned the offender. Do you wish to make the report anyway?')) {
				return;
			}

			var resolves = $.map($('input:checkbox[name=s_resolves]:checked', form), function(o) {
				return $(o).data('revinfo');
			});
			var free_resolves = $('input[name=s_resolves_free]').val();

			var an3_next = function(free_resolves) {
				if (!resolves.length && !free_resolves && !confirm('You have not selected any edits where you tried to resolve the issue. Do you wish to make the report anyway?')) {
					return;
				}

				var an3Parameters = {
					'uid': uid,
					'page': form.page.value.trim(),
					'comment': form.comment.value.trim(),
					'diffs': diffs,
					'warnings': warnings,
					'resolves': resolves,
					'free_resolves': free_resolves
				};

				Morebits.simpleWindow.setButtonsEnabled(false);
				Morebits.status.init(form);
				Twinkle.arv.processAN3(an3Parameters);
			};

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

				new mw.Api().get(query).done(function(data) {
					var page;
					if (data.compare && data.compare.fromtitle === data.compare.totitle) {
						page = data;
					} else if (data.query) {
						var pageid = data.query.pageids[0];
						page = data.query.pages[pageid];
					} else {
						return;
					}
					an3_next(page);
				}).fail(function(data) {
					console.log('API failed :(', data); // eslint-disable-line no-console
				});
			} else {
				an3_next();
			}
			break;
	}
};

Twinkle.arv.processSock = function(params) {
	Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

	// notify all user accounts if requested
	if (params.notify && params.sockpuppets.length > 0) {

		var notifyEditSummary = 'Notifying about suspicion of sockpuppeteering.';
		var notifyText = '\n\n{{subst:socksuspectnotice|1=' + params.uid + '}} ~~~~';

		// notify user's master account
		var masterTalkPage = new Morebits.wiki.page('User talk:' + params.uid, 'Notifying suspected sockpuppeteer');
		masterTalkPage.setFollowRedirect(true);
		masterTalkPage.setEditSummary(notifyEditSummary);
		masterTalkPage.setChangeTags(Twinkle.changeTags);
		masterTalkPage.setAppendText(notifyText);
		masterTalkPage.append();

		var statusIndicator = new Morebits.status('Notifying suspected sockpuppets', '0%');
		var total = params.sockpuppets.length;
		var current = 0;

		// display status of notifications as they progress
		var onSuccess = function(sockTalkPage) {
			var now = parseInt(100 * ++current / total, 10) + '%';
			statusIndicator.update(now);
			sockTalkPage.getStatusElement().unlink();
			if (current >= total) {
				statusIndicator.info(now + ' (completed)');
			}
		};

		var socks = params.sockpuppets;

		// notify each puppet account
		for (var i = 0; i < socks.length; ++i) {
			var sockTalkPage = new Morebits.wiki.page('User talk:' + socks[i], 'Notification for ' + socks[i]);
			sockTalkPage.setFollowRedirect(true);
			sockTalkPage.setEditSummary(notifyEditSummary);
			sockTalkPage.setChangeTags(Twinkle.changeTags);
			sockTalkPage.setAppendText(notifyText);
			sockTalkPage.append(onSuccess);
		}
	}

	// prepare the SPI report
	var text = '\n\n{{subst:SPI report|socksraw=' +
		params.sockpuppets.map(function(v) {
			return '* {{' + (mw.util.isIPAddress(v) ? 'checkip' : 'checkuser') + '|1=' + v + '}}';
		}).join('\n') + '\n|evidence=' + params.evidence + ' \n';

	if (params.checkuser) {
		text += '|checkuser=yes';
	}
	text += '}}';

	var reportpage = 'Wikipedia:Sockpuppet investigations/' + params.uid;

	Morebits.wiki.actionCompleted.redirect = reportpage;
	Morebits.wiki.actionCompleted.notice = 'Reporting complete';

	var spiPage = new Morebits.wiki.page(reportpage, 'Retrieving discussion page');
	spiPage.setFollowRedirect(true);
	spiPage.setEditSummary('Adding new report for [[Special:Contributions/' + params.uid + '|' + params.uid + ']].');
	spiPage.setChangeTags(Twinkle.changeTags);
	spiPage.setAppendText(text);
	switch (Twinkle.getPref('spiWatchReport')) {
		case 'yes':
			spiPage.setWatchlist(true);
			break;
		case 'no':
			spiPage.setWatchlistFromPreferences(false);
			break;
		default:
			spiPage.setWatchlistFromPreferences(true);
			break;
	}
	spiPage.append();

	Morebits.wiki.removeCheckpoint();  // all page updates have been started
};

Twinkle.arv.processAN3 = function(params) {
	// prepare the AN3 report
	var minid;
	for (var i = 0; i < params.diffs.length; ++i) {
		if (params.diffs[i].parentid && (!minid || params.diffs[i].parentid < minid)) {
			minid = params.diffs[i].parentid;
		}
	}

	new mw.Api().get({
		action: 'query',
		prop: 'revisions',
		format: 'json',
		rvprop: 'sha1|ids|timestamp|comment',
		rvlimit: 100, // intentionally limited
		rvstartid: minid,
		rvexcludeuser: params.uid,
		indexpageids: true,
		redirects: true,
		titles: params.page
	}).done(function(data) {
		Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

		// In case an edit summary was revdel'd
		var hasHiddenComment = function(rev) {
			if (!rev.comment && typeof rev.commenthidden === 'string') {
				return '(comment hidden)';
			}
			return '"' + rev.comment + '"';

		};

		var orig;
		if (data.length) {
			var sha1 = data[0].sha1;
			for (var i = 1; i < data.length; ++i) {
				if (data[i].sha1 === sha1) {
					orig = data[i];
					break;
				}
			}

			if (!orig) {
				orig = data[0];
			}
		}

		var origtext = '';
		if (orig) {
			origtext = '{{diff2|' + orig.revid + '|' + orig.timestamp + '}} ' + hasHiddenComment(orig);
		}

		var grouped_diffs = {};

		var parentid, lastid;
		for (var j = 0; j < params.diffs.length; ++j) {
			var cur = params.diffs[j];
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
		var warningtext = params.warnings.reverse().map(function(v) {
			return '# ' + ' {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
		}).join('\n');
		var resolvetext = params.resolves.reverse().map(function(v) {
			return '# ' + ' {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
		}).join('\n');

		if (params.free_resolves) {
			var page = params.free_resolves;
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

		var comment = params.comment.replace(/~*$/g, '').trim();

		if (comment) {
			comment += ' ~~~~';
		}

		var text = '\n\n' + '{{subst:AN3 report|diffs=' + difftext + '|warnings=' + warningtext + '|resolves=' + resolvetext + '|pagename=' + params.page + '|orig=' + origtext + '|comment=' + comment + '|uid=' + params.uid + '}}';

		var reportpage = 'Wikipedia:Administrators\' noticeboard/Edit warring';

		Morebits.wiki.actionCompleted.redirect = reportpage;
		Morebits.wiki.actionCompleted.notice = 'Reporting complete';

		var an3Page = new Morebits.wiki.page(reportpage, 'Retrieving discussion page');
		an3Page.setFollowRedirect(true);
		an3Page.setEditSummary('Adding new report for [[Special:Contributions/' + params.uid + '|' + params.uid + ']].');
		an3Page.setChangeTags(Twinkle.changeTags);
		an3Page.setAppendText(text);
		an3Page.append();

		// notify user

		var notifyText = '\n\n{{subst:an3-notice|1=' + mw.util.wikiUrlencode(params.uid) + '|auto=1}} ~~~~';

		var talkPage = new Morebits.wiki.page('User talk:' + params.uid, 'Notifying edit warrior');
		talkPage.setFollowRedirect(true);
		talkPage.setEditSummary('Notifying about edit warring noticeboard discussion.');
		talkPage.setChangeTags(Twinkle.changeTags);
		talkPage.setAppendText(notifyText);
		talkPage.append();
		Morebits.wiki.removeCheckpoint();  // all page updates have been started
	}).fail(function(data) {
		console.log('API failed :(', data); // eslint-disable-line no-console
	});
};

Twinkle.addInitCallback(Twinkle.arv, 'arv');
})(jQuery);


// </nowiki>
