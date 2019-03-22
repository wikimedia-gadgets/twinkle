#!/usr/bin/env perl
# sync.pl by azatoth (2011), update by amorymeltzer (2019)

use strict;
use warnings;

use English qw(-no_match_vars);
use utf8;

use Config::General qw(ParseConfig);
use Getopt::Long::Descriptive;
use Git::Repository;
use MediaWiki::API;
use File::Slurper qw(read_text write_text);

# Config file should be a simple file consisting of keys and values:
# username = Jimbo Wales
# lang = en
# etc.
my %conf;
my $config_file = "$ENV{HOME}/.twinklerc";
%conf = ParseConfig($config_file) if -e -f -r $config_file;

my ($opt, $usage) = describe_options(
    "$PROGRAM_NAME %o <files...>",
    ['username|u=s', 'username for account on wikipedia', {default => $conf{username} // q{}}],
    ['password|p=s', 'password for account on wikipedia (do not use)', {default => $conf{password} // q{}}],
    ['lang|l=s', 'Target language', {default => $conf{lang} // 'en'}],
    ['family|f=s', 'Target family', {default => $conf{family} // 'wikipedia'}],
    ['base|b=s', 'base location on wikipedia where user files exist (default User:AzaToth or entry in .twinklerc)', {default => $conf{base} // 'User:AzaToth'}],
    [],
    ['mode' => hidden =>
        {
            required => 1,
            one_of => [
                ['pull' => 'pull changes from wikipedia'],
                ['push' => 'push changes to wikipedia'],
                ['deploy' => 'push changes to wikipedia as gadgets']
            ]
        }
    ],
    [],
    ['help', 'print usage message and exit'],
);
if ($opt->help || !scalar @ARGV || !($opt->username && $opt->password)) {
  print $usage->text;
  exit;
}

# Ensure we've got a clean branch
my $repo = Git::Repository->new();
my @status = $repo->run(status => '--porcelain');
if (scalar @status) {
  print "Repository is not clean, aborting\n";
  exit;
}
# Make sure we know what we're doing before doing it
forReal();

# Build file->page hashes
my %deploys;
while (<DATA>) {
  chomp;
  my @map = split;
  $deploys{$map[0]} = $map[1];
}
# Remove 'modules/' from ARGV input filenames
my %pages = map {+(my $s = $_) =~ s/modules\///; $_ => "$opt->{base}/$s"} @ARGV;

# Open API and log in before anything else
my $mw = MediaWiki::API->new({
			      api_url => "https://$opt->{lang}.$opt->{family}.org/w/api.php",
			      max_lag => 1000000 # not a botty script, thus smash it!
			     });
$mw->login({lgname => $opt->username, lgpassword => $opt->password})
  or die "Error logging in: $mw->{error}->{code}: $mw->{error}->{details}\n";

### Main loop to parse options
if ($opt->mode eq 'pull') {
  while (my ($file, $page) = each %pages) {
    my $wikiPage = checkPage($page);
    next if !$wikiPage;
    print "Grabbing $page";
    my $text = $wikiPage->{q{*}}."\n"; # MediaWiki doesn't have trailing newlines
    # Might be faster to check this using git and eof, but here makes sense
    if ($text eq read_text($file)) {
      print "... No changes found, skipping\n";
      next;
    } else {
      print "\n";
      write_text($file, $text);
    }
  }
  # Show a summary of any changes
  my $cmd = $repo->command(diff => '--stat', '--color');
  my $s = $cmd->stdout;
  while (<$s>) {
    print;
  }
  $cmd->close;
} elsif ($opt->mode eq 'push') {
  while (my ($file, $page) = each %pages) {
    next if saltNPepa($page, $file);
  }
} elsif ($opt->mode eq 'deploy') {
  foreach my $file (keys %pages) {
    if (!defined $deploys{$file}) {
      print "$file not deployable, skipping\n";
      next;
    }
    my $page = $deploys{$file};
    next if saltNPepa($page, $file);
  }
}


### SUBROUTINES
# Check that everything is in order
# Data::Dumper is simpler but the output is ugly, and this ain't worth another
# dependency
sub forReal {
  my @meaningful = qw (username base lang family);
  print "Here are the current parameters specified:\n\n";
  foreach my $key (@meaningful) {
    print "\t$key = ${$opt}{$key}\n";
  }
  print "\nThis means User:$opt->{username} will ";
  print uc $opt->{mode}.q{ };
  if ($opt->{mode} eq 'pull') {
    print "from subpages of $opt->{base}";
  } elsif ($opt->{mode} eq 'push') {
    print "to subpages of $opt->{base}";
  } elsif ($opt->{mode} eq 'deploy') {
    print 'live to the MediaWiki gadget';
  }
  print " at $opt->{lang}.$opt->{family}.org\n";
  while (42) {
    print "Enter (y)es to proceed or (n)o to cancel:\n";
    my $input = <STDIN>;
    chomp $input;
    $input = lc $input;
    if ($input eq 'n' || $input eq 'no') {
      print "Aborting\n";
      exit 0;
    } elsif ($input eq 'y' || $input eq 'yes') {
      print "Proceeding\n";
      return 0;
    } else {
      print 'Unknown entry... ';
    }
  }
  return 1; # We should never get here but just in case
}

# Check if file exists
sub checkFile {
  my $file = shift;
  if (-e -f -r $file) {
    return 0;
  } else {
    print "$file does not exist, skipping\n";
    return 1;
  }
}

# Check if page exists
sub checkPage {
  my $page = shift;
  my $wikiPage = $mw->get_page({title => $page}) or die "$mw->{error}->{code}: $mw->{error}->{details}\n";
  if (defined $wikiPage->{missing}) {
    print "$page does not exist, skipping\n";
    return 0;
  } else {
    return $wikiPage;
  }
}

# Tries to figure out a good edit summary by using the last one onwiki to find
# the latest changes; prompts user if it can't find a commit hash
sub buildEditSummary {
  my ($page, $file, $oldCommitish) = @_;
  my $editSummary;
  # User:Amorymeltzer & User:MusikAnimal or User:Amalthea et al.
  if ($oldCommitish =~ /(?:Repo|v2\.0) at (\w*?): / || $oldCommitish =~ /v2\.0-\d+-g(\w*?): /) {
    # Ensure it's a valid commit and no errors are reported back
    my $valid = $repo->command('merge-base' => '--is-ancestor', "$1", 'HEAD');
    my $validC = $valid->stderr();
    if (eof $validC) {
      print "$1\n";
      my $newLog = $repo->run(log => '--oneline', '--no-color', "$1..HEAD", $file);
      open my $nl, '<', \$newLog or die $ERRNO;
      while (<$nl>) {
	chomp;
	my @arr = split / /, $_, 2;
	next if $arr[1] =~ /Merge pull request #\d+/;

	if ($arr[1] =~ /(\S+(?:\.(?:js|css))?) ?[:|-] ?(.+)/) {
	  $2 =~ s/\.$//; # Just in case
	  $editSummary .= "$2; ";
	}
      }
      close $nl or die $ERRNO;
    }
  }

  # Prompt for manual entry
  if (!$editSummary) {
    my $log = $repo->run(log => '-1', '--pretty=format:%s', '--no-color', $file);
    print "\nUnable to autogenerate edit summary for $page.  The most recent edit summary is:\n";
    print "\t$oldCommitish\nThe most recent log entry in git is:\n";
    print "\t$log\nPlease provide an edit summary (commit ref will be added automatically):\n";
    $editSummary = <STDIN>;
    chomp $editSummary;
  }
  $editSummary =~ s/[\.; ]{1,2}$//; # Tidy
  # Be helpful
  my $editBeg = 'Repo at ';
  $editBeg .= $repo->run('rev-parse' => '--short', 'HEAD');
  $editBeg .= ': ';
  return $editBeg.$editSummary;
}

# Edit the page
sub editPage {
  my ($pTitle, $nText, $pSummary) = @_;
  my $ref = $mw->get_page({title => $pTitle});
  if (defined $ref->{missing}) {
    print "$pTitle does not exist\n";
    exit 1;
  } else {
    my $timestamp = $ref->{basetimestamp};
    $mw->edit({
	       action => 'edit',
	       title => $pTitle,
	       basetimestamp => $timestamp, # Avoid edit conflicts
	       text => $nText,
	       summary => $pSummary
	      }) || die "Error editing the page: $mw->{error}->{code}: $mw->{error}->{details}\n";
  }
  return $mw->{response};
}

# All together now!
sub saltNPepa {
  my ($page, $file) = @_;
  return 1 if checkFile($file);
  my $text = read_text($file);
  my $wikiPage = checkPage($page);
  return 1 if !$wikiPage;
  # print "$file -> $opt->{lang}.$opt->{family}.org/wiki/$page";
  print ucfirst $opt->{mode};
  print "ing $file to $page";

  my $wp = $wikiPage->{q{*}}."\n"; # MediaWiki doesn't have trailing newlines
  if ($text eq $wp) {
    print "... No changes needed, skipping\n";
    return 1;
  } else {
    print "\n";;
    my $summary = buildEditSummary($page, $file, $wikiPage->{comment});
    my $editReturn = editPage($page, $text, $summary);
    if ($editReturn->{_msg} eq 'OK') {
      print "$file successfully pushed to $page\n";
    } else {
      print "Error pushing $file: $mw->{error}->{code}: $mw->{error}->{details}\n";
    }
    return 0;
  }
}


## The lines below do not represent Perl code, and are not examined by the
## compiler.  Rather, they are used by %deploys to map filenames from the
## Twinkle git repo to their corresponding location in the MediaWiki Gadget
## psuedonamespace.
__DATA__
twinkle.js MediaWiki:Gadget-Twinkle.js
  twinkle.css MediaWiki:Gadget-Twinkle.css
  twinkle-pagestyles.css MediaWiki:Gadget-Twinkle-pagestyles.css
  morebits.js MediaWiki:Gadget-morebits.js
  morebits.css MediaWiki:Gadget-morebits.css
  modules/friendlyshared.js MediaWiki:Gadget-friendlyshared.js
  modules/friendlytag.js MediaWiki:Gadget-friendlytag.js
  modules/friendlytalkback.js MediaWiki:Gadget-friendlytalkback.js
  modules/friendlywelcome.js MediaWiki:Gadget-friendlywelcome.js
  modules/twinklearv.js MediaWiki:Gadget-twinklearv.js
  modules/twinklebatchdelete.js MediaWiki:Gadget-twinklebatchdelete.js
  modules/twinklebatchprotect.js MediaWiki:Gadget-twinklebatchprotect.js
  modules/twinklebatchundelete.js MediaWiki:Gadget-twinklebatchundelete.js
  modules/twinkleblock.js MediaWiki:Gadget-twinkleblock.js
  modules/twinkleconfig.js MediaWiki:Gadget-twinkleconfig.js
  modules/twinkledeprod.js MediaWiki:Gadget-twinkledeprod.js
  modules/twinklediff.js MediaWiki:Gadget-twinklediff.js
  modules/twinklefluff.js MediaWiki:Gadget-twinklefluff.js
  modules/twinkleimage.js MediaWiki:Gadget-twinkleimage.js
  modules/twinkleprotect.js MediaWiki:Gadget-twinkleprotect.js
  modules/twinklespeedy.js MediaWiki:Gadget-twinklespeedy.js
  modules/twinkleunlink.js MediaWiki:Gadget-twinkleunlink.js
  modules/twinklewarn.js MediaWiki:Gadget-twinklewarn.js
  modules/twinklexfd.js MediaWiki:Gadget-twinklexfd.js
  modules/twinkleprod.js MediaWiki:Gadget-twinkleprod.js
