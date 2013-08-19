.PHONY: demos

VERSION = $(shell cat VERSION)

compile: clean node_modules components
	@node build/minify.js

site: dist/brick.js dist/brick.css node_modules components homepage downloadpage docs demos

demos: node_modules components
	@node build/demos.js

homepage: node_modules
	@$(RM) -f index.html
	@node build/homepage.js

downloadpage: node_modules components
	@$(RM) -f download.html
	@node build/download.js

docs: node_modules components cleandocs
	@node build/docs.js

cleandocs:
	@$(RM) -f docs.html

clean:
	@$(RM) -f dist/brick.js dist/brick.css

node_modules: package.json
	@echo "running 'npm install'..."
	@npm install
	@echo "node modules installed!"

components: component/**/component.json
	@echo "running 'git submodule update --init --recursive'..."
	@git submodule update --init --recursive
	@echo "submodules updated!"

release: compile dist/OpenSans-SemiBold.ttf dist/readme.txt
	@echo "building release bundle $(VERSION)"
	@cp dist/brick.js brick-$(VERSION).js
	@cp dist/brick.css brick-$(VERSION).css
	@cp dist/OpenSans-SemiBold.ttf OpenSans-SemiBold.ttf
	@cp dist/readme.txt readme-$(VERSION).txt
	@zip brick-$(VERSION).zip brick-$(VERSION).js brick-$(VERSION).css OpenSans-SemiBold.ttf readme-$(VERSION).txt
	@$(RM) brick-$(VERSION).js brick-$(VERSION).css OpenSans-SemiBold.ttf readme-$(VERSION).txt
