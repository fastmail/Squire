.PHONY: all build clean

all: install build build-ui

install:
	npm install
clean:
	rm -rf build


build-ui: build/Squire-UI.html build/Squire-UI.css build/Squire-UI.js build/assets

build: build/squire.js build/squire-raw.js build/document.html 

build/assets:
	cp -r source/assets/font-awesome build
	cp -r source/assets/jQuery build
	cp -r source/assets/bootstrap build

build/Squire-UI.html: source/Squire-UI.html
	mkdir -p $(@D)
	cp $^ $@

build/Squire-UI.css: source/Squire-UI.css source/assets/drop/drop-theme-arrows.css source/assets/font-awesome/font-awesome.min.css
	mkdir -p $(@D)
	cat $^ >$@

build/Squire-UI.js: source/Squire-UI.js source/assets/drop/drop.min.js 
	mkdir -p $(@D)
	cat $^ >$@

build/squire-raw.js: source/intro.js source/Constants.js source/TreeWalker.js source/Node.js source/Range.js source/Editor.js source/outro.js
	mkdir -p $(@D)
	cat $^ >$@

build/squire.js: build/squire-raw.js
	uglifyjs $^ -c -m -o $@

build/document.html: source/document.html
	mkdir -p $(@D)
	cp $^ $@
