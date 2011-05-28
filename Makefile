all: twinkle.js

twinkle.min.js: twinkle.js
	uglifyjs --output $@ $^


twinkle.js: twinkle.header.js $(wildcard modules/*.js) twinkle.footer.js
	awk 'FNR==1{print ""}{print}' $^ > $@


deploy: twinkle.js morebits.js morebits.css
	./sync.pl --deploy $^

clean:
	rm -f twinkle.js twinkle.min.js

.PHONY: deploy clean
