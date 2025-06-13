#!/usr/bin/env node

const path = require('path');
const { program } = require('commander');
const { Mwn } = require('mwn');
const chalk = require('chalk');
const { createTwoFilesPatch } = require('diff');
const fs = require('fs-extra');
const simpleGit = require('simple-git');

program
    .description('Deploy Twinkle gadget files to MediaWiki')
    .option('-s, --site <site>', 'Wiki site: enwiki, testwiki, or a full MediaWiki API URL')
    .option('-u, --username <username>', 'Username (for bot password login)')
    .option('-p, --password <password>', 'Password (for bot password login)')
    .option('--accessToken <accessToken>', 'OAuth2 access token')
    .option('-b, --base <base>', 'Base page prefix', 'MediaWiki:Gadget-')
    .option('-d, --dry', 'Dry run: show diffs of changes instead of deploying')
    .option('-c, --create', 'Create pages onwiki if they are missing')
    .option('-y, --yes', 'Skip all prompts and proceed (for CI)')
    .option('-h, --help', 'Show help', usage)
    .allowUnknownOption(false)
    .argument('[files...]', 'Files to deploy (if omitted, deploy all)')
    .parse(process.argv);

const GADGET_FILES = [
    'twinkle.js',
    'twinkle.css',
    'twinkle-pagestyles.css',
    'morebits.js',
    'morebits.css',
    'lib/select2.min.js',
    'lib/select2.min.css',
    'modules/twinklearv.js',
    'modules/twinklebatchdelete.js',
    'modules/twinklebatchprotect.js',
    'modules/twinklebatchundelete.js',
    'modules/twinkleblock.js',
    'modules/twinkleconfig.js',
    'modules/twinkledeprod.js',
    'modules/twinklediff.js',
    'modules/twinkleimage.js',
    'modules/twinkleprod.js',
    'modules/twinkleprotect.js',
    'modules/twinklerollback.js',
    'modules/twinkleshared.js',
    'modules/twinklespeedy.js',
    'modules/twinkletag.js',
    'modules/twinkletalkback.js',
    'modules/twinkleunlink.js',
    'modules/twinklewarn.js',
    'modules/twinklewelcome.js',
    'modules/twinklexfd.js'
];

const DEFAULT_CONF = {
    username: '',
    password: '',
    accessToken: '',
    apiUrl: '',
    base: 'MediaWiki:Gadget-'
};

const repoRoot = path.resolve(__dirname, '..');

function loadCredentials() {
    const credsPath = path.join(__dirname, 'credentials.json');
    if (fs.existsSync(credsPath)) {
        try {
            return JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        } catch (e) {
            console.error(chalk.red('Error reading credentials.json: ' + e.message));
        }
    }
    return {};
}

function usage() {
    program.outputHelp();
    process.exit(1);
}

function resolveApiUrl(site) {
    if (!site) return null;
    if (site === 'testwiki') return 'https://test.wikipedia.org/w/api.php';
    if (site === 'enwiki') return 'https://en.wikipedia.org/w/api.php';
    if (/^https?:\/\//.test(site) && site.endsWith('api.php')) return site;
    return null;
}

const simpleGitInstance = simpleGit();

async function buildEditSummary(page, file, oldSummary, timestamp, user, conf) {
    let editSummary = '';

    // Try to extract commit hash from on-wiki edit summary
    let commitMatch = oldSummary && oldSummary.match(/Repo at (\w*?):/);
    if (commitMatch && commitMatch[1]) {
        // Check if commit is ancestor of HEAD
        try {
            await simpleGitInstance.raw(['merge-base', '--is-ancestor', commitMatch[1], 'HEAD']);
            // Get log between commit and HEAD for this file
            const newLog = await simpleGitInstance.raw(['rev-list', '--format=%s', '--oneline', '--no-merges', `${commitMatch[1]}..HEAD`, path.join(repoRoot, file)]);
            const lines = newLog.split('\n').filter(Boolean).reverse();
            console.log(`\t${lines.length} new commit(s) affecting this file since last deployment.`);
            for (const line of lines) {
                const message = line.split(' ').slice(1).join(' ');
                // Trim module name prefix and trailing period
                let portion = message.replace(/^\S+(?::| -) /, '').replace(/\.$/, '');
                editSummary += portion + '; ';
            }
        } catch (e) {
            // Not a valid ancestor, fallback
        }
    }

    // Prompt for manual entry if still empty
    if (!editSummary && !conf.yes) {
        console.log(chalk.yellow(`Unable to autogenerate edit summary for ${page}`));
        console.log('The most recent ON-WIKI edit summary is:');
        console.log(chalk.cyan(`\t${oldSummary} (${user}, ${timestamp})`));
        console.log('The most recent GIT LOG entries for this file are:');
        const log = await simpleGitInstance.raw(['log', '-5', '--pretty=format:%s (%h, %ad)', '--no-merges', '--no-color', '--date=short', path.join(repoRoot, file)]);
        log.split('\n').forEach(l => console.log(chalk.cyan(`\t${l}`)));
        editSummary = await promptInput('Please provide an edit summary (commit ref will be prefixed automatically):');
    }
    editSummary = editSummary.replace(/[\.; ]+$/, ''); // Tidy

    // 'Repo at' will add 17 characters and MW truncates at 497 to allow for '...'
    const maxLength = 480;
    while (editSummary.length > maxLength) {
        const over = editSummary.length - maxLength;
        console.log(`The current edit summary is too long by ${over} character${over === 1 ? '' : 's'} and would thus be truncated.`);
        console.log(`\t${editSummary}`);
        editSummary = await promptInput(`Please provide a shorter summary (under ${maxLength} characters, the latest commit ref will be added automatically):`);
    }

    // Add commit ref
    const commitRef = (await simpleGitInstance.raw(['rev-parse', '--short', 'HEAD'])).trim();
    return `Repo at ${commitRef}: ${editSummary}`;
}

async function promptInput(promptText) {
    process.stdin.resume();
    process.stdout.write(promptText + '\n');
    const input = await new Promise(resolve => {
        process.stdin.once('data', d => resolve(d.toString().trim()));
    });
    process.stdin.pause();
    return input;
}

async function main() {
    let conf = { ...DEFAULT_CONF, ...loadCredentials(), ...program.opts() };

    // Set apiUrl from --site
    let apiUrl = resolveApiUrl(conf.site);
    if (!apiUrl) {
        console.log(chalk.red('Missing or invalid --site! Pass enwiki, testwiki, or a full MediaWiki API URL, eg. https://en.wikipedia.org/w/api.php'));
        usage();
    }

    if (!conf.accessToken && (!conf.username || !conf.password)) {
        console.log(chalk.red('Missing authentication! Provide either --accessToken or both --username and --password (or set them in credentials.json).'));
        usage();
    }

    // Check git status
    const git = simpleGit();
    const status = await git.status();
    // Ignore untracked files
    if (status.files.length - status.not_added.length > 0 && !process.env.ALLOW_DIRTY_REPO) {
        console.log(chalk.red('Repository is not clean, aborting'));
        process.exit(1);
    }

    // Determine files
    let files = [];
    if (program.args.length) {
        files = program.args
            .map(f => f.trim())
            .filter(Boolean)
            // Normalize file paths to be relative to the repo root
            .map(f => path.relative(repoRoot, path.resolve(process.cwd(), f)))
            .filter(f => GADGET_FILES.includes(f));
    } else {
        files = [...GADGET_FILES];
    }
    if (!files.length) {
        console.log(chalk.red('No valid input files provided!'));
        usage();
    }

    // Confirm
    if (!conf.dry) {
        console.log('Attempting to ' + chalk.magentaBright('DEPLOY'));
        if (program.args.length) {
            files.forEach(f => console.log(chalk.blue('\t' + f)));
        }
        console.log('to pages prefixed by ' + chalk.whiteBright(conf.base));
        console.log('at site ' + chalk.magentaBright(apiUrl));
        if (conf.accessToken) {
            console.log('using the given OAuth2 access token');
        } else {
            console.log('as user ' + chalk.yellow(conf.username));
        }
        if (!conf.yes) {
            const answer = await promptInput('Enter (y)es to proceed or (n)o to cancel:');
            if (!['y', 'yes'].includes(answer.toLowerCase())) {
                console.log('Aborting');
                process.exit(0);
            }
        }
    } else {
        console.log(chalk.magentaBright('Dry run mode enabled, no changes will be made'));
    }

    // Login
    let bot;
    try {
        bot = await Mwn.init({
            apiUrl: apiUrl,
            userAgent: 'deploy.js (https://github.com/wikimedia-gadgets/twinkle) (mwn)',
            username: conf.username,
            password: conf.password,
            OAuth2AccessToken: conf.accessToken,
            defaultParams: {
                assert: 'user',
                maxlag: 1000000, // not a botty script, thus smash it!
            }
        });
    } catch (e) {
        console.log(chalk.red('Error logging in: ' + e.message));
        process.exit(1);
    }

    // Main loop
    let countDiff = 0;
    for (const file of files) {
        let page = file;
        // Twinkle.js, Twinkle.css, and Twinkle-pagestyles.css have leading uppercase on-wiki
        // TODO: Remove once onwiki pages are renamed
        if (GADGET_FILES.indexOf(file) < 3) {
            page = page.charAt(0).toUpperCase() + page.slice(1);
        }
        if (!page.startsWith(conf.base)) {
            page = conf.base + page.replace(/^.*\//, '');
        }

        let wikiPage;
        try {
            wikiPage = await bot.read(page, {
                rvprop: ['content', 'comment'],
                redirects: false,
            });
        } catch (e) {
            console.log(chalk.red(`Error fetching ${page}: ${e.message}`));
            continue;
        }

        const fileText = await fs.readFile(path.join(repoRoot, file), 'utf8');
        const wpText = (wikiPage.revisions?.[0]?.content ?? '') + '\n';
        const oldSummary = wikiPage.revisions?.[0]?.comment || '';
        const oldTimestamp = wikiPage.revisions?.[0]?.timestamp || '';
        const oldUser = wikiPage.revisions?.[0]?.user || '';

        process.stdout.write(
            chalk.cyanBright('Deploying ') +
            `${file} to ${page}...`
        );

        if (!wikiPage.missing && wpText === fileText) {
            console.log(chalk.blue(' No changes found, skipping'));
            continue;
        }

        if (wikiPage.missing && !conf.create) {
            console.log(chalk.yellow(` Page does not exist, skipping (use --create to create)`));
            continue;
        }

        if (conf.dry) {
            countDiff++;
            if (!wikiPage.missing) {
                console.log(chalk.magenta(' Showing diff:'));
                const differences = createTwoFilesPatch(wikiPage.title, file, wpText, fileText);
                console.log(differences);
            } else {
                console.log(chalk.magenta('Page does not exist. Will be CREATED!'));
            }
            continue;
        }

        process.stdout.write('\n\t');
        let summary = await buildEditSummary(page, file, oldSummary, oldTimestamp, oldUser, conf);
        try {
            await bot.save(page, fileText, summary, {
                basetimestamp: wikiPage?.revisions?.[0]?.timestamp,
                nocreate: !conf.create
            });
            console.log(chalk.green(`${file} successfully deployed to ${page}`));
        } catch (e) {
            console.log(chalk.red(`Error deploying ${file}: ${e.message}`));
        }
        console.log();
    }

    // Show summary of any changes
    if (conf.dry) {
        console.log();
        if (countDiff) {
            console.log(`${countDiff} file${countDiff > 1 ? 's' : ''} need updating`);
        } else {
            console.log(chalk.green('No actions needed'));
        }
    }

    // If deploying to MediaWiki:Gadgets-definition, check gadget definition file
    if (conf.base === 'MediaWiki:Gadget-') {
        let wikiGadgetDef = '';
        try {
            const allGadgetDefs = await bot.read('MediaWiki:Gadgets-definition');
            const lines = (allGadgetDefs.revisions[0]?.content || '').split('\n');
            let twLine = lines.findIndex(l => /\* ?Twinkle ?\[/.test(l));
            if (twLine !== -1) {
                wikiGadgetDef = lines.slice(twLine, twLine + 5).join('\n') + '\n';
            }
        } catch (e) {
            console.log(chalk.red('Error fetching Gadgets-definition: ' + e.message));
        }
        const gadgetFile = path.join(repoRoot, 'gadget.txt');
        let localGadgetDef = await fs.readFile(gadgetFile, 'utf8');
        if (wikiGadgetDef === localGadgetDef) {
            console.log('Gadget definition up-to-date');
        } else {
            console.log(chalk.red('MediaWiki:Gadgets-definition needs updating!') + chalk.magenta(' Showing diff:'));
            console.log(createTwoFilesPatch('MediaWiki:Gadgets-definition', 'gadget.txt', wikiGadgetDef, localGadgetDef));
        }
    }
}

main().catch(e => {
    console.error(chalk.red('Fatal error: ' + e.message));
    process.exit(1);
});
