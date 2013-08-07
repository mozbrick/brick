
VERSION = $(shell cat VERSION)

compile: clean
	@node build/minify.js

site: homepage downloadpage docs

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

release: compile
	@cp dist/brick.js brick-$(VERSION).js
	@cp dist/brick.css brick-$(VERSION).css
	@zip brick-$(VERSION).zip brick-$(VERSION).js brick-$(VERSION).css
	@rm brick-$(VERSION).js brick-$(VERSION).css
