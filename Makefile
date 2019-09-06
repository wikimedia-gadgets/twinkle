all:

modules = modules/twinklearv.js \
		  modules/twinklebatchdelete.js \
		  modules/twinklebatchprotect.js \
		  modules/twinklebatchundelete.js \
		  modules/twinkleblock.js \
		  modules/twinkleconfig.js \
		  modules/twinkledeprod.js \
		  modules/twinklediff.js \
		  modules/twinklefluff.js \
		  modules/twinkleimage.js \
		  modules/twinkleprod.js \
		  modules/twinkleprotect.js \
		  modules/twinklespeedy.js \
		  modules/twinkleunlink.js \
		  modules/twinklewarn.js \
		  modules/twinklexfd.js \
		  modules/friendlyshared.js \
		  modules/friendlytag.js \
		  modules/friendlytalkback.js \
		  modules/friendlywelcome.js

deploy: twinkle.js twinkle.css twinkle-pagestyles.css morebits.js morebits.css $(modules)
	./sync.pl ${ARGS} --deploy $^

.PHONY: deploy all
