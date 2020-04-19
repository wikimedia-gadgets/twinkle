all:

modules = modules/twinkleconfig.js \
		  modules/twinklearv.js \
		  modules/twinklebatchdelete.js \
		  modules/twinklebatchprotect.js \
		  modules/twinklebatchundelete.js \
		  modules/twinkleblock.js \
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

deploy: twinkle.js twinkle.css twinkle-pagestyles.css morebits.js morebits.css select2/select2.min.js select2/select2.min.css $(modules)
	./sync.pl ${ARGS} --mode=deploy $^

.PHONY: deploy all
