#!/usr/bin/python
# -*- coding: utf-8 -*-
"""
Script to sync twinkle
"""
#
# Copyright © 2009 Carl Fürstenberg
#
# Distributed under the terms of the MIT license.
#
__version__='$Id$'
#
import sys, os
sys.path.append(os.environ['HOME'] + '/pywikipedia')
import wikipedia, pagegenerators
import glob
from optparse import OptionParser
import pysvn
from datetime import datetime
import codecs

prefix = "User:This, that and the other/"

def main(options,args):

	site = wikipedia.getSite()
	client = pysvn.Client()

	changes = client.status('.')


	has_changed = any( map( lambda x:
			x.text_status == pysvn.wc_status_kind.modified or
			x.text_status == pysvn.wc_status_kind.added or
			x.text_status == pysvn.wc_status_kind.deleted or
			x.text_status == pysvn.wc_status_kind.conflicted, changes ) )

	if not options.ignore_changed and has_changed:
		wikipedia.output("We have pending changes, aborting sync.")
		sys.exit(1)

	files = filter( lambda x: client.status(x)[0].is_versioned, args or glob.glob( '*.js' ) )
	wiki_pages =  map( lambda x: prefix + x, files )
	hash = {}

	for a, b in map( None, files, wiki_pages ):
		hash[b] = a

	gen = pagegenerators.PagesFromTitlesGenerator( wiki_pages )
	preloadingGen = pagegenerators.PreloadingGenerator(gen)


	for page in preloadingGen:
		file = hash[page.title()]
		try:
			text = page.get()
		except wikipedia.NoPage:
			#print "%s%s doesn't exists" % (prefix , file)
			continue
		except wikipedia.IsRedirectPage:
			#print "%s%s is redirect" % (prefix , file)
			continue
		print "current file is %s" % file
		info = client.info( file )
		svntime = datetime.utcfromtimestamp( info.commit_time )
		wikitime = datetime.strptime( page.editTime(), "%Y%m%d%H%M%S" )
		if options.download and ( options.force or wikitime > svntime ): # newer page onwiki
			fp = codecs.open( file, 'r' , 'utf-8')
			oldtext = fp.read()
			if text == oldtext:
				continue
			if options.show_changes:
				wikipedia.showDiff( oldtext, text )
			fp.close()
			fp = codecs.open( file, 'w' , 'utf-8')
			fp.write( text )
			fp.close()
		elif options.upload and ( options.force or wikitime < svntime ): #older page onwiki
			fp = codecs.open( file, 'r' , 'utf-8')
			newtext = fp.read()
			if text == newtext:
				continue
			if options.show_changes:
				wikipedia.showDiff( text, newtext )
			fp.close()
			summary = options.summary or client.log( file )[0].message
			page.put( newtext, summary )



if __name__ == '__main__':

	usage = "usage: %prog [options] files"
	parser = OptionParser(usage=usage)
	parser.add_option("-s", "--summary", help="Summary for the sync (optional)")
	parser.add_option("-i", "--ignore-changed", help="ignore local changes pending", action="store_true", dest="ignore_changed")
	parser.add_option("-x", "--hide-changes", help="dont display changes", action="store_false", dest="show_changes", default=True)
	parser.add_option("-u", "--upload", help="upload to wiki", action="store_true", dest="upload")
	parser.add_option("-d", "--download", help="download from wiki", action="store_true", dest="download")
	parser.add_option("-f", "--force-download", help="force download", action="store_true", dest="force")
	(options, args) = parser.parse_args(args=wikipedia.handleArgs())

	mysite = wikipedia.getSite()
	if mysite.loggedInAs():
		wikipedia.output(u"You are logged in on %s as %s." % (repr(mysite), mysite.loggedInAs()))
	else:
		wikipedia.output(u"You are not logged in on %s." % repr(mysite))
		wikipedia.stopme()
		sys.exit(1)

	try:
		main(options,args)
	finally:
		wikipedia.stopme()

