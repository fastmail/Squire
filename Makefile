.PHONY: all build clean

all: build ui

clean:
	rm -rf build

ui: build/Squire-UI.html build/Squire-UI.css build/Squire-UI.js fonts jQuery

build: build/ie8.js build/squire.js build/document.html 

fonts:
	cp -r source/assets/font-awesome build

jQuery:
	cp -r source/assets/jQuery build

bootstrap:
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
