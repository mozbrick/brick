.PHONY: demos

VERSION = $(shell cat VERSION)

compile: clean
	@node build/minify.js

site: homepage downloadpage docs demos

demos:
	@node build/demos.js

homepage:
	@rm -f index.html
	@node build/homepage.js

downloadpage:
	@rm -f download.html
	@node build/download.js

docs:
	@rm -f docs.html
	@node build/docs.js

cleandocs:
	@rm -f docs.html

clean:
	@rm -f dist/brick.js dist/brick.css

release: compile dist/OpenSans-SemiBold.ttf dist/readme.txt
	@cp dist/brick.js brick-$(VERSION).js
	@cp dist/brick.css brick-$(VERSION).css
	@cp dist/OpenSans-SemiBold.ttf OpenSans-SemiBold.ttf
	@cp dist/readme.txt readme-$(VERSION).txt
	@zip brick-$(VERSION).zip brick-$(VERSION).js brick-$(VERSION).css OpenSans-SemiBold.ttf readme-$(VERSION).txt
	@rm brick-$(VERSION).js brick-$(VERSION).css OpenSans-SemiBold.ttf readme-$(VERSION).txt
