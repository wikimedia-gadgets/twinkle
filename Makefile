all:

modules = modules/twinkleprod.js \
		  modules/twinkleimage.js \
		  modules/twinklebatchundelete.js \
		  modules/twinklewarn.js \
		  modules/twinklespeedy.js \
		  modules/friendlyshared.js \
		  modules/twinklediff.js \
		  modules/twinkleunlink.js \
		  modules/twinkledelimages.js \
		  modules/friendlytag.js \
		  modules/twinkledeprod.js \
		  modules/friendlywelcome.js \
		  modules/twinklexfd.js \
		  modules/twinklebatchdelete.js \
		  modules/twinklebatchprotect.js \
		  modules/twinkleconfig.js \
		  modules/twinklefluff.js \
		  modules/twinkleprotect.js \
		  modules/twinklearv.js \
		  modules/friendlytalkback.js

deploy: twinkle.js morebits.js morebits.css $(modules)
	./sync.pl ${ARGS} --deploy $^

.PHONY: deploy all
