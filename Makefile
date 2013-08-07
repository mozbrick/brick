
VERSION = $(shell cat VERSION)

compile: clean
	@node build/minify.js

docs: cleandocs
	@node build/docs.js

cleandocs:
	@rm -f docs/*

clean:
	@rm -f dist/brick.js dist/brick.css

release: compile
	@cp dist/brick.js brick-$(VERSION).js
	@cp dist/brick.css brick-$(VERSION).css
	@zip brick-$(VERSION).zip brick-$(VERSION).js brick-$(VERSION).css
	@rm brick-$(VERSION).js brick-$(VERSION).css
