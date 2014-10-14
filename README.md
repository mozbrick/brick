# Brick


[![Build Status](http://img.shields.io/travis/mozbrick/brick.svg?style=flat)](https://travis-ci.org/mozbrick/brick)
[![Dependency Status](http://img.shields.io/david/mozbrick/brick.svg?style=flat)](https://david-dm.org/mozbrick/brick)
[![DevDependencies Status](http://img.shields.io/david/dev/mozbrick/brick.svg?style=flat)](https://david-dm.org/mozbrick/brick#info=devDependencies)


Brick is a collection of UI components designed for the easy and quick building of web application UIs. Brick components are built using the Web Components standard to allow developers to describe the UI of their app using the HTML syntax they already know.

## Install

Brick can be installed using the [Bower](http://bower.io) package manager:

```sh
bower install mozbrick/brick
```

To use Brick in your project, place the following in the `<head>` of your main HTML:

```html
<script src="bower_components/brick/dist/platform/platform.js"></script>
<link rel="import" href="bower_components/brick/dist/brick.html">
```

If you are already using Polymer, platform.js or a web browser that supports Web Components, you do not need the above `<script>` tag.

## Development

Brick (and its components) are developed using tools built in JavaScript running on [node.js](http://nodejs.org/download/).

The individual components are developed in their own GitHub repositories.

The `mozbrick/brick` repository contains the distributions of all the components packaged together as well as tools for building the distributions.

To work on Brick, you will need the following node tools:

```bash
npm install -g bower gulp
```

### Building Brick from source

Once you have the prerequisites, you're ready to clone and build from source.

Run the following:

```bash
git clone git@github.com:mozbrick/brick.git
cd brick
npm install
bower install
gulp build
```

If you'd like to work on *all* the Brick components at once, try this handy script:

```bash
#!/bin/bash
repos=(
  brick
  brick-action
  brick-appbar
  brick-button
  brick-calendar
  brick-common
  brick-deck
  brick-dialog
  brick-flipbox
  brick-form
  brick-input
  brick-layout
  brick-listview
  brick-menu
  brick-storage-indexeddb
  brick-tabbar
)
for repo in "${repos[@]}"
do
  git clone https://github.com/mozbrick/$repo.git;
done
```

## Components

Here is a list of the components currently in the primary distribution of Brick:

* [brick-action](https://github.com/mozbrick/brick-action)
* [brick-appbar](https://github.com/mozbrick/brick-appbar)
* [brick-button](https://github.com/mozbrick/brick-button)
* [brick-calendar](https://github.com/mozbrick/brick-calendar)
* [brick-deck](https://github.com/mozbrick/brick-deck)
* [brick-dialog](https://github.com/mozbrick/brick-dialog)
* [brick-flipbox](https://github.com/mozbrick/brick-flipbox)
* [brick-form](https://github.com/mozbrick/brick-form)
* [brick-input](https://github.com/mozbrick/brick-input)
* [brick-layout](https://github.com/mozbrick/brick-layout)
* [brick-listview](https://github.com/mozbrick/brick-listview)
* [brick-menu](https://github.com/mozbrick/brick-menu)
* [brick-storage-indexeddb](https://github.com/mozbrick/brick-storage-indexeddb)
* [brick-tabbar](https://github.com/mozbrick/brick-tabbar)

If you encounter issues with a component, please file issues against the individual component repositories.
