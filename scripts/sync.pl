#!/usr/bin/env perl
# sync.pl by azatoth (2011), update by amorymeltzer (2019)

use strict;
use warnings;

use English qw(-no_match_vars);
use utf8;
use Cwd qw(cwd abs_path);
use FindBin qw($Bin);
use File::Spec::Functions qw(rel2abs abs2rel);
use Getopt::Long;
use Term::ANSIColor;

use Config::General qw(ParseConfig);
use Git::Repository;
use MediaWiki::API;
use File::Slurper qw(read_text write_text);

# Save original directory, for relative paths of files
my $origDir = cwd();
# Move to top of repository
# Could do with git rev-parse --show-toplevel, but this is fine
chdir "$Bin/../" or die "$ERRNO\n";

# Default config values, mode is intentionally absent
my %conf = (
            username => q{},
            password => q{},
            mode => q{},
            lang => 'en',
            family => 'wikipedia',
            url => q{},
            base => 'User:AzaToth/'
           );

my $rc = '.twinklerc';
# Check repo directory and ~ (home) for config file, preferring the former
my @dotLocales = map { $_.q{/}.$rc } (cwd(), $ENV{HOME});
foreach my $dot (@dotLocales) {
  if (-e -f -r $dot) {
    # Preserve default options if not present in twinklerc
    %conf = ParseConfig(-DefaultConfig => \%conf,
                        -MergeDuplicateOptions => 'true',
                        -ConfigFile => $dot);
    last;
  }
}

GetOptions (\%conf, 'username|s=s', 'password|p=s', 'mode|m=s',
            'lang|l=s','family|f=s', 'url|u=s', 'base|b=s',
            'all|a', 'summary|y=s', 'append|e=s', 'diff|d', 'w=s', 'dry|r', 'help|h' => \&usage);

# Ensure we've got a clean branch
my $repo = Git::Repository->new();
my @status = $repo->run(status => '--porcelain');
if (scalar @status) {
  print colored ['red'], "Repository is not clean, aborting\n";
  exit;
}

# Make sure we know what we're doing before doing it
# Checks for required parameters, returns list of files (from @ARGV or --all)
my @files = forReal();

# Open API and log in before anything else
my $mw = MediaWiki::API->new({
			      api_url => "$conf{url}/w/api.php",
			      max_lag => 1000000, # not a botty script, thus smash it!
			      on_error => \&dieNice
			     });
$mw->{ua}->agent('Twinkle/sync.pl ('.$mw->{ua}->agent.')');
$mw->login({lgname => $conf{username}, lgpassword => $conf{password}});

my $diffFunc = $conf{w} || 'diff'; # Only used for the --diff option

### Main function
if (@files) {
  my $countDiff = 0;               # Only used for the --dry option

  # loop through each file
  foreach my $file (@files) {
    my $page = $file;
    if ($page =~ /^twinkle/) {
      $page =~ s/^twinkle\b/Twinkle/; # twinkle.js, etc. files are capitalized on-wiki
    } else {
      $page =~ s/\w+\///;       # Remove directories (modules/, lib/)
    }
    $page = $conf{base}.$page; # base set to MediaWiki:Gadget- for deploy in &forReal

    my $wikiPage = checkPage($page);
    next if !$wikiPage;

    my $fileText = read_text($file);
    my $wpText = $wikiPage->{q{*}}."\n"; # MediaWiki doesn't have trailing newlines

    print ucfirst $conf{mode}.'ing '.($conf{mode} eq 'pull' ? "$page to $file..." : "$file to $page...");

    # git and eof might be faster, but here makes sense
    if ($wpText eq $fileText) {
      print colored ['blue'], " No changes found, skipping\n";
      next;
    }

    if ($conf{diff}) {
      my $name = $file.'temp';
      write_text($name, $wpText);
      print colored ['magenta'], " Showing diff\n";
      system "$diffFunc $name $file";
      unlink $name;
    }

    if ($conf{dry}) {
      $countDiff++;
      print colored['magenta'], " Differences found!\n" if !$conf{diff};
      next;
    }

    print "\n\t";
    if ($conf{mode} eq 'deploy' || $conf{mode} eq 'push') {
      my $summary = buildEditSummary($page, $file, $wikiPage->{comment}, $wikiPage->{timestamp}, $wikiPage->{user});
      my $editReturn = editPage($page, $fileText, $summary, $wikiPage->{timestamp});
      if ($editReturn->{_msg} eq 'OK') {
        print colored ['green'], "$file successfully $conf{mode}ed to $page";
      } else {
        print colored ['red'], "Error $conf{mode}ing $file: $mw->{error}->{code}: $mw->{error}->{details}";
      }
    } elsif ($conf{mode} eq 'pull') {
      write_text($file, $wpText);
      print 'Done!';
    }
    print "\n";
  }

  # Show a summary of any changes
  if ($conf{dry}) {
    print "\n";
    if ($countDiff) {
      print "$countDiff ".($countDiff > 1 ? 'files need' : 'file needs')." updating\n";
    } else {
      print colored ['green'], "No actions needed\n";
    }
  } elsif ($conf{base} eq 'pull') {
    my $cmd = $repo->command(diff => '--stat', '--color');
    my $s = $cmd->stdout;
    while (<$s>) {
      print;
    }
    $cmd->close;
  }
}

# If deploying, check gadget file
if ($conf{mode} eq 'deploy') {
  my $gadgetDef = $mw->get_page({title => 'MediaWiki:Gadgets-definition'})->{q{*}};
  my $twLine;
  my $wikiGadgetDef = q{};
  my @wg = split /\n/, $gadgetDef;
  foreach (0..scalar @wg -1) {
    $twLine = $_ if $wg[$_] =~ /\* Twinkle\[/;
    next if !$twLine;
    last if $_ == $twLine + 4;
    $wikiGadgetDef .= $wg[$_]."\n";
  }

  my $gadgetFile = 'gadget.txt';
  my $localGadgetDef = read_text($gadgetFile);
  if ($wikiGadgetDef eq $localGadgetDef) {
    print "Gadget up-to-date\n";
  } else {
    print colored ['red'], "MediaWiki:Gadgets-definition needs updating!\n";
    if ($conf{diff}) {
      my $name = $gadgetFile.'temp';
      write_text($name, $wikiGadgetDef);
      print colored ['magenta'], "Showing diff\n";
      system "$diffFunc $name $gadgetFile";
      unlink $name;
    }
  }
}


### SUBROUTINES
# Check that everything is in order
sub forReal {
  my @meaningful = qw (mode lang family);
  push @meaningful, 'url' if $conf{url};
  push @meaningful, 'base' if $conf{mode} ne 'deploy';
  push @meaningful, 'username';
  print "Here are the current parameters specified:\n\n";
  foreach my $key (@meaningful) {
    print colored ['blue'], "\t$key = $conf{$key}\n";
  }
  if ($conf{password}) {
    print colored ['blue'], "\tA passsword was provided\n";
  }
  print "\n";

  # Ensure requireds are required
  my $modeTruth = $conf{mode} && grep {/$conf{mode}/} qw (deploy push pull);
  if (!$modeTruth || !$conf{username} || !$conf{password}) {
    print colored ['red'], "Missing information!\n\n";
    usage();
  }

  # Set base URL for the project, used for API, etc.
  $conf{url} ||= "https://$conf{lang}.$conf{family}.org";

  my @inputs;
  my @allFiles = map { split } <DATA>;
  if ($conf{all}) {
    print "Using all gadget files\n";
    @inputs = @allFiles;
  } else {
    # Confirm files are valid
    my %checkFiles = map { $_ => 1 } @allFiles;
    foreach my $file (@ARGV) {
      # Adjust path for being run from anywhere to main repo directory
      # 1. Make path absolute, relative to the directory from which the script was run
      # 2. Clean it up (../, etc.)
      # 3. Make it relative again
      $file = abs2rel(abs_path(rel2abs($file, $origDir)));

      if (!$checkFiles{$file}) {
        print colored ['yellow'], "$file not defined as part of the gadget, skipping\n";
        next;
      }
      push @inputs, $file;
    }

    if (!@inputs) {
      # Allow checking gadget
      if ($conf{mode} eq 'deploy') {
        return ();
      }
      print colored ['red'], "No valid input files provided!\n\n";
      usage();
    }
  }

  # Quick exit
  if ($conf{dry}) {
    print "Dry run, checking for differences...\n";
    # As below
    $conf{base} = 'MediaWiki:Gadget-' if $conf{mode} eq 'deploy';
    return @inputs;
  }

  print 'This means ';
  print colored ['bright_white'], 'User:'.ucfirst $conf{username};
  print ' will attempt to ';
  print colored ['bright_magenta'], uc $conf{mode}."\n\n";

  foreach (@inputs) {
    print colored ['blue'], "\t$_\n";
  }
  print "\n";

  if ($conf{mode} eq 'deploy') {
    print colored ['bright_magenta'], 'LIVE';
    print ' to the ';
    print colored ['bright_white'], 'MediaWiki gadget';
    $conf{base} = 'MediaWiki:Gadget-';
  } else {
    print $conf{mode} eq 'pull' ? 'from' : 'to';
    print ' pages prefixed by ';
    print colored ['bright_white'], $conf{base};
  }
  print ' at ';
  print colored ['green'], "$conf{url}\n";

  while (42) {
    print "Enter (y)es to proceed or (n)o to cancel:\n";
    my $input = <STDIN>;
    chomp $input;
    $input = lc $input;
    if ($input eq 'n' || $input eq 'no') {
      print "Aborting\n";
      exit 0;
    } elsif ($input eq 'y' || $input eq 'yes') {
      print "Proceeding...\n";
      return @inputs;
    } else {
      print 'Unknown entry... ';
    }
  }
  exit 1; # We should never get here but just in case
}

# Nicer handling of errors
# Can be expanded using:
## https://metacpan.org/release/MediaWiki-API/source/lib/MediaWiki/API.pm
## https://www.mediawiki.org/wiki/API:Errors_and_warnings#Standard_error_messages
sub dieNice {
  my $code = $mw->{error}->{code};
  my $details = $mw->{error}->{details};
  print color 'red';
  if ($code == 4) {
    print "Error logging in\n";
  } elsif ($code == 3 && $details =~ /protectednamespace-interface/) {
    print "You do not have permission to edit interface messages\n";
  } else {
    print "$code: $details\n";
  }
  die "Quitting\n";
}

# Check if page exists
sub checkPage {
  my $page = shift;
  my $wikiPage = $mw->get_page({title => $page});
  if (defined $wikiPage->{missing}) {
    print colored ['yellow'], "$page does not exist, skipping\n";
    return 0;
  } else {
    return $wikiPage;
  }
}

# Tries to figure out a good edit summary by using the last one onwiki to find
# the latest changes; prompts user if it can't find a commit hash
sub buildEditSummary {
  my ($page, $file, $oldCommitish, $timestamp, $user) = @_;
  my $editSummary;
  if ($conf{summary}) {
      $editSummary = $conf{summary};
    } else {
      # User:Amorymeltzer & User:MusikAnimal or User:Amalthea et al.
      if ($oldCommitish =~ /(?:Repo|v2\.0) at (\w*?): / || $oldCommitish =~ /v2\.0-\d+-g(\w*?): /) {
        # Ensure it's a valid commit and no errors are reported back
        my $valid = $repo->command('merge-base' => '--is-ancestor', "$1", 'HEAD');
        my @validE = $valid->stderr->getlines();
        $valid->close();
        if (!scalar @validE) {
          my $newLog = $repo->run(log => '--oneline', '--no-merges', '--no-color', "$1..HEAD", $file);
          open my $nl, '<', \$newLog or die colored ['red'], "$ERRNO\n";
          while (<$nl>) {
            chomp;
            my @arr = split / /, $_, 2;
            # Remove leading file names, trailing period
            my $portion = $arr[1] =~ s/^\S+(?::| -) //r;
            $portion =~ s/\.$//;
            $editSummary .= "$portion; ";
          }
          close $nl or die colored ['red'], "$ERRNO\n";
        }
      }

      # Prompt for manual entry
      if (!$editSummary) {
        my @log = $repo->run(log => '-5', '--pretty=format:%s (%h, %ad)', '--no-merges', '--no-color', '--date=short', $file);
        print colored ['yellow'], "Unable to autogenerate edit summary for $page\n\n";
        print "The most recent ON-WIKI edit summary is:\n";
        print colored ['bright_cyan'], "\t$oldCommitish ($user, $timestamp))\n";
        print "The most recent GIT LOG entries are:\n";
        foreach (@log) {
          print colored ['bright_cyan'], "\t$_\n";
        }
        print 'Please provide an edit summary (commit ref will be added automatically';
        print ",\nas well as your appendation: $conf{append}" if $conf{append};
        print "):\n";
        $editSummary = <STDIN>;
        chomp $editSummary;
      }
    }
  $editSummary =~ s/[\.; ]+$//; # Tidy
  $editSummary .= $conf{append} if $conf{append};

  # 'Repo at' will add 17 characters and MW truncates at 497 to allow for '...'
  my $maxLength = 480;
  while (length $editSummary > $maxLength) {
    my $length = length $editSummary;
    my $over = $length - $maxLength;

    my $message = "The current edit summary is too long by $over character";
    $message .= $over == 1 ? q{} : 's';
    $message .= " and would thus be truncated.\n";
    print $message;
    print "\t$editSummary\n";
    print "Please provide a shorter summary (under $maxLength characters, the latest commit ref will be added automatically):\n";
    $editSummary = <STDIN>;
    chomp $editSummary;
  }

  my $editBeg = 'Repo at '. $repo->run('rev-parse' => '--short', 'HEAD') . ': ';
  return $editBeg.$editSummary;
}

# Edit the page
sub editPage {
  my ($pTitle, $nText, $pSummary, $pTimestamp) = @_;
  $mw->edit({
	     action => 'edit',
	     assert => 'user',
	     title => $pTitle,
	     basetimestamp => $pTimestamp, # Avoid edit conflicts
	     text => $nText,
	     summary => $pSummary
	    });
  return $mw->{response};
}


#### Usage statement ####
# Escapes not necessary but ensure pretty colors
# Could use POD but meh
# Final line must be unindented?
sub usage {
  print <<"USAGE";
Usage: $PROGRAM_NAME --mode=deploy|pull|push --username username --password password [--lang language] [--family family] [--url url] [--base base] [--all] [--diff [-w diffprog]] [--dry] [--summary summary] [--append append]

    --mode, -m What action to perform, one of deploy, pull, or push. Required.
        deploy: Push changes live to the gadget
        pull: Pull changes from base-prefixed location
        push: Push changes to base-prefixed location

    --username, -s Username for account. Required.
    --password, -p Password for account. Required.

    --lang, -l Target language, default 'en'
    --family, -f Target family, default 'wikipedia'

    --all, -a Pass all available files, rather than just those on the commandline

    --base, -b Base page prefix where on-wiki files exist, default 'User:AzaToth/'

Less common options:

    --diff, -d Show a diff between files and pages before proceeding
        -w Pass an alternative diffing function instead of the default `diff`, such as `colordiff`
    --dry, -r Show which files don't match on-wiki, do nothing else. A mode should still be supplied
        in order to determine which on-wiki files to compare to.

    --url, -u Provide the full URL, replacing above options (https://{lang}.{family}.org).

    --summary, -y String to use in place of autogenerated edit summary
    --append, -e String to append to a push or deploy edit summary

    These options can be provided in a config file, .twinklerc, in either this script's
    or your home directory.  It should be a simple file consisting of keys and values:
        username = Jimbo Wales
        lang = en
        etc.

    --help, -h Print usage message and exit
USAGE
  exit;
}


## The lines below do not represent Perl code, and are not examined by the
## compiler.  Rather, they are used by the --all option to simplify bulk
## updating all files.
__DATA__
twinkle.js
  twinkle.css
  twinkle-pagestyles.css
  morebits.js
  morebits.css
  lib/select2.min.js
  lib/select2.min.css
  modules/twinkleconfig.js
  modules/twinklearv.js
  modules/twinklebatchdelete.js
  modules/twinklebatchprotect.js
  modules/twinklebatchundelete.js
  modules/twinkleblock.js
  modules/twinkledeprod.js
  modules/twinklediff.js
  modules/twinklerollback.js
  modules/twinkleimage.js
  modules/twinkleprod.js
  modules/twinkleprotect.js
  modules/twinklespeedy.js
  modules/twinkleunlink.js
  modules/twinklewarn.js
  modules/twinklexfd.js
  modules/friendlyshared.js
  modules/friendlytag.js
  modules/friendlytalkback.js
  modules/friendlywelcome.js
