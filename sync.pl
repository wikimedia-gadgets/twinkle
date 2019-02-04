#!/usr/bin/env perl
# sync.pl by azatoth (2011), update by amorymeltzer (2019)

use strict;
use warnings;

use English qw(-no_match_vars);
use Encode;
use utf8;

use Config::General qw(ParseConfig);
use Getopt::Long::Descriptive;
use Git::Repository;
use MediaWiki::API;
use File::Slurp;

# Config file should be a simple file consisting of keys and values:
# username = Jimbo Wales
# lang = en
# etc.
my $config_file = "$ENV{HOME}/.twinklerc";
my %conf = ParseConfig($config_file);

my ($opt, $usage) = describe_options(
    "$PROGRAM_NAME %o <files...>",
    ['username|u=s', 'username for account on wikipedia', {default => $conf{username} // q{}}],
    ['password|p=s', 'password for account on wikipedia (do not use)', {default => $conf{password} // q{}}],
    ['lang=s', 'Target language', {default => $conf{lang} // 'en'}],
    ['family=s', 'Target family', {default => $conf{family} // 'wikipedia'}],
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
    ['strip', 'strip line end spaces'],
    [],
    ['help', 'print usage message and exit'],
);

if ($opt->help || !scalar @ARGV) {
  print $usage->text;
  exit;
}

my %pages = map {+"$opt->{base}/$_" => $_} @ARGV;
my %deploys = (
	'twinkle.js' => 'MediaWiki:Gadget-Twinkle.js',
	'twinkle.css' => 'MediaWiki:Gadget-Twinkle.css',
	'twinkle-pagestyles.css' => 'MediaWiki:Gadget-Twinkle-pagestyles.css',
	'morebits.js' => 'MediaWiki:Gadget-morebits.js',
	'morebits.css' => 'MediaWiki:Gadget-morebits.css',
	'modules/friendlyshared.js' => 'MediaWiki:Gadget-friendlyshared.js',
	'modules/friendlytag.js' => 'MediaWiki:Gadget-friendlytag.js',
	'modules/friendlytalkback.js' => 'MediaWiki:Gadget-friendlytalkback.js',
	'modules/friendlywelcome.js' => 'MediaWiki:Gadget-friendlywelcome.js',
	'modules/twinklearv.js' => 'MediaWiki:Gadget-twinklearv.js',
	'modules/twinklebatchdelete.js' => 'MediaWiki:Gadget-twinklebatchdelete.js',
	'modules/twinklebatchprotect.js' => 'MediaWiki:Gadget-twinklebatchprotect.js',
	'modules/twinklebatchundelete.js' => 'MediaWiki:Gadget-twinklebatchundelete.js',
	'modules/twinkleblock.js' => 'MediaWiki:Gadget-twinkleblock.js',
	'modules/twinkleconfig.js' => 'MediaWiki:Gadget-twinkleconfig.js',
	'modules/twinkledeprod.js' => 'MediaWiki:Gadget-twinkledeprod.js',
	'modules/twinklediff.js' => 'MediaWiki:Gadget-twinklediff.js',
	'modules/twinklefluff.js' => 'MediaWiki:Gadget-twinklefluff.js',
	'modules/twinkleimage.js' => 'MediaWiki:Gadget-twinkleimage.js',
	'modules/twinkleprotect.js' => 'MediaWiki:Gadget-twinkleprotect.js',
	'modules/twinklespeedy.js' => 'MediaWiki:Gadget-twinklespeedy.js',
	'modules/twinkleunlink.js' => 'MediaWiki:Gadget-twinkleunlink.js',
	'modules/twinklewarn.js' => 'MediaWiki:Gadget-twinklewarn.js',
	'modules/twinklexfd.js' => 'MediaWiki:Gadget-twinklexfd.js',
	'modules/twinkleprod.js' => 'MediaWiki:Gadget-twinkleprod.js'
);

my $mw = MediaWiki::API->new({
			      api_url => "https://$opt->{lang}.$opt->{family}.org/w/api.php",
			      max_lag => 1000000 # not a botty script, thus smash it!
			     });
$mw->login({lgname => $opt->username, lgpassword => $opt->password})
  or die $mw->{error}->{code} . ': ' . $mw->{error}->{details};

my $repo = Git::Repository->new();

if ($opt->mode eq 'pull') {
  my @status = $repo->run( status => '--porcelain');

  if (scalar @status) {
    print "repository is not clean. aborting...\n";
    exit;
  }

  while (my ($page, $file) = each %pages) {
    print "Grabbing $page\n";
    my $wikiPage = $mw->get_page({title => $page});
    if (defined $wikiPage->{missing}) {
      print "$page does not exist\n";
      exit 1;
    } else {
      my $text = $wikiPage->{q{*}};
      $text =~ s/\h+$//mg if $opt->{'strip'};
      write_file( $file, {binmode => ':raw' }, encode('UTF-8',$text));
    }
  }
  my $cmd = $repo->command(diff => '--stat', '--color');
  my $s = $cmd->stdout;
  while (<$s>) {
    print "$_\n";
  }
  $cmd->close;
} elsif ($opt->mode eq 'push') {
  while (my ($page, $file) = each %pages) {
    my $tag = $repo->run(describe => '--always', '--all', '--dirty');
    my $log = $repo->run(log => '-1', '--oneline', '--no-color', $file);
    $tag =~ m{(?:heads/)?(?<branch>.+)};
    my $text = read_file($file,  {binmode => ':raw' });
    my $editReturn = editPage($page, decode('UTF-8', $text), "$LAST_PAREN_MATCH{branch}:$log");
    if ($editReturn->{_msg} eq 'OK') {
      print "$file successfully pushed to $page\n";
    } else {
      print "Error pushing $file: $mw->{error}->{code}: $mw->{error}->{details}\n";
    }
  }
} elsif ($opt->mode eq 'deploy') {
  foreach my $file (values %pages) {
    if (!defined $deploys{$file}) {
      print "$file not deployable\n";
      exit 1;
    }
    my $page = $deploys{$file};
    print "$file -> $opt->{lang}.$opt->{family}.org/wiki/$page\n";
    my $tag = $repo->run(describe => '--always', '--dirty');
    my $log = $repo->run(log => '-1', '--pretty=format:%s', '--no-color');
    my $text = read_file($file,  {binmode => ':raw' });
    my $editReturn = editPage($page, decode('UTF-8', $text), "$tag: $log");
    if ($editReturn->{_msg} eq 'OK') {
      print "$file successfully pushed to $page\n";
    } else {
      print "Error pushing $file: $mw->{error}->{code}: $mw->{error}->{details}\n";
    }
  }
}


### SUBROUTINES
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
	      }) || die $mw->{error}->{code} . ': ' . $mw->{error}->{details};
  }
  return $mw->{response};
}
