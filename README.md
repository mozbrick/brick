# Brick

[![Build Status](https://travis-ci.org/mozilla/brick.png)](https://travis-ci.org/mozilla/brick)

Brick is a bundle of re-usable UI components built with
[x-tags](http://www.x-tags.org/) for quickly and flexibly building mobile HTML5
apps. Brick adds new HTML tags- widgets that allow developers to express the
structure of an application in a clearer, more concise manner.

In other words, Brick provides minimal-markup, cross-browser implementations of
common user interface designs, from calendars to slidebars to cycling
galleries, taking care of most of the under-the-hood boilerplate for you.

For example, this is all the markup that would be needed to implement a
mobile-friendly, cross-browser calendar widget:

```html
<x-calendar></x-calendar>
```

That's it! It really is that easy.

## Install

Release bundles are provided on GitHub, under this
[project's Releases tab](https://github.com/mozilla/brick/releases).

Prebuilt versions of the entire library are also provided in
[`dist/brick.css`](https://github.com/mozilla/brick/blob/master/dist/brick.css)
and
[`dist/brick.js`](https://github.com/mozilla/brick/blob/master/dist/brick.js),
and should be included in your project like any other CSS/JavaScript file.

Compartmentalized releases of specific components are also released in their
respective folders under
[`dist/brick.css`](https://github.com/mozilla/brick/tree/master/dist), allowing
you to pick and choose what components you want.

Brick is also available as a Bower component: `bower install brick` will
install Brick for any project using Bower.

## Skins

Each component in Brick can be skinned by creating a new folder in the
`skins/` directory and then creating a Stylus file with the name of the
component you wish to style. Once you've created an alternate style for a
particular element, build it by using the `--skin=` parameter with
`grunt build` or `grunt build --dev` commands.   All other components will use
the default styles if a custom style is not provided.

```bash
grunt build --skin=solo
```

## Development

You need three things to get started with Brick:
[npm](http://nodejs.org/download/), [Grunt](http://gruntjs.com), and
[Bower](http://bower.io).

First, install [NodeJS/npm](http://nodejs.org/download/). Once you have `npm`
installed you need to install Bower and Grunt globally:

```bash
npm install -g bower grunt-cli
```

### Building Brick from source

Once you have the prerequisites, you're ready to clone and build from source.

Run the following:

```bash
git clone git@github.com:mozilla/brick.git
cd brick
npm install
bower install
grunt
```

The built minified files should be output to `dist/brick.css` and `dist/brick.js`.

### Working on components

Brick uses Bower to pull in components, which means that they are not git
repositories. If you would like to work on the components within their git
repository, run the following:

```bash
bower install       # we use bower to get the repository locations, so this is required
grunt clone-repos   # clone all repositories to ./dev-repos/
grunt build --dev   # build from repositories instead of bower
```

Now you can work one each component within their respective git repository.

## Components

This is a list of the currently bundled components provided in the library.

Full documentation can be found on
[the Brick site](http://mozilla.github.io/brick/).

### Structural Components

#### [Layout](https://github.com/x-tag/layout)

* Primary layout container, holds app structure.
* Allows whole "app" space to have layout properties like flexbox without
  affecting <body>

#### [App Bar (header)](https://github.com/x-tag/appbar)

* Contains top-level information and UI
* Similar to a toolbar or roughly equivalent to Android's action bar

#### [Tab Bar (navigation, footer)](https://github.com/x-tag/tabbar)

* Used to display an app-level navigation at the bottom of the UI
* Usually a series of icons with labels.
* Tabs are linked to panels/views. Changing tab changes the active panel, and
  changing the active panel changes the tab
* Essentially fires a `show` event at targeted elements. It is up to target
  elements to respond appropriately.
  * Components with default support for show event:
    * Deck
    * Flipbox
    * Slidebox
* Can also fire user-defined events

#### [Deck](https://github.com/x-tag/deck)

* A gallery box in which slides can be cycled in and out independently, with a
  variety of different transitions
* Transition types can be switched and overridden on the fly, allowing for a
  variety of different entrances/exits

#### [Flipbox](https://github.com/x-tag/flipbox)

* Similar to slidebox, but with a perspective flip effect.
* May be combinable with slidebox and accessed via an option

### Content Components

#### [Calendar](https://github.com/x-tag/calendar)

* A calendar widget based on/extended from
  [fortnight.js](https://github.com/potch/fortnight.js), but in a web
  component format
* Simple instantiation, with API hooks to allow flexible use cases such as an
  event-managing calendar (see demo)

#### [Slider](https://github.com/x-tag/slider)

* Polyfill on top of `<input type="range">`, providing a consistent UI
  regardless of whether `type="range"` is supported or not.

#### [Toggle](https://github.com/x-tag/toggle)

* Unifies checkboxes and radios into a single consistent UI component
