.PHONY: demos

VERSION = $(shell cat VERSION)

compile: clean node_modules components
	@node build/minify.js

site: homepage downloadpage docs demos

demos: node_modules components
	@node build/demos.js

homepage: node_modules
	@$(RM) -f index.html
	@node build/homepage.js

downloadpage: node_modules components
	@$(RM) -f download.html
	@node build/download.js

docs: node_modules components
	@$(RM) -f docs.html
	@node build/docs.js

cleandocs:
	@$(RM) -f docs.html

clean:
	@$(RM) -f dist/brick.js dist/brick.css

node_modules: package.json
	@git submodule update --init --recursive
	@npm install

components: component/**/component.json
	@git submodule update --init --recursive

release: compile
	@cp dist/brick.js brick-$(VERSION).js
	@cp dist/brick.css brick-$(VERSION).css
	@zip brick-$(VERSION).zip brick-$(VERSION).js brick-$(VERSION).css
	@$(RM) brick-$(VERSION).js brick-$(VERSION).css
