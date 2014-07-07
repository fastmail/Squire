.PHONY: all build clean

all: build

clean:
	rm -rf build

ui: build/Squire-UI.html build/Squire-UI.css build/Squire-UI.js build/assets

build: build/ie8.js build/squire.js build/document.html

build/Squire-UI.html: ui/Squire-UI.html
	mkdir -p $(@D)
	cp $^ $@

build/Squire-UI.css: ui/Squire-UI.css
	mkdir -p $(@D)
	cat $^ >$@

build/Squire-UI.js: ui/Squire-UI.js
	mkdir -p $(@D)
	cat $^ >$@

build/assets: ui/assets
	mkdir -p $(@D)
	cp -r $^ $@

build/ie8.js: source/ie8types.js source/ie8dom.js source/ie8range.js
	mkdir -p $(@D)
	uglifyjs $^ -c -m -o $@

build/squire-raw.js: source/intro.js source/Constants.js source/TreeWalker.js source/Node.js source/Range.js source/Editor.js source/outro.js
	mkdir -p $(@D)
	cat $^ >$@

build/squire.js: build/squire-raw.js
	uglifyjs $^ -c -m -o $@

build/document.html: source/document.html
	mkdir -p $(@D)
	cp $^ $@
