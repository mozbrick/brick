Brick
=====

[![Build Status](https://travis-ci.org/mozilla/brick.png)](https://travis-ci.org/mozilla/brick)

Brick is a bundle of re-usable UI components built with [x-tags](http://www.x-tags.org/) for quickly and flexibly building mobile HTML5 apps. Brick adds new HTML tags- widgets that allow developers to express the structure of an application in a clearer, more concise manner.

In other words, Brick provides minimal-markup, cross-browser implementations of common user interface designs, from calendars to slidebars to cycleable galleries, taking care of most of the under-the-hood boilerplate for you.

For example, this is all the markup that would be needed to implement a mobile-friendly, cross-browser calendar widget:

```html
<x-calendar></x-calendar>
```

That's it! It really is that easy.

#Installation

Release bundles are provided on Github under this project's Releases tab.

Prebuilt versions of the entire library are also provided in `dist/brick.css` and `dist/brick.js`, and should be included in your project like any other CSS/JavaScript file.

Compartmentalized releases of specific components are also released in their respective folders under <code>dist</code>, allowing you to pick and choose what components you want.

## Development Prerequisites

You need three things to get started with Brick.  NPM, Grunt and Bower.

First install [NodeJS/NPM](http://nodejs.org/download/).  Once you have `npm` installed it's easy to install Bower and GruntCLI.   Simply run `npm install -g bower grunt-cli`.


## Building from the repository source

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

## Skins

Each component in Brick can be skinned by creating a new folder in the `./skins/` directory and then creating a Stylus file with the name of the component you wish to style.  Once you've created an alternate style for a particular element, build it by using the `--skin=` parameter with `grunt build` or `grunt build --dev` commands.   All other components will use the default styles if a custom style is not provided.

```bash
grunt build --skin=solo
```

## Development

By default, Brick uses Bower to pull in components, which means that they are not git repositories.  If you would like to work on the components within their git repository, then run the following:

```bash
bower install       # we use bower to get the repository locations, so this is required
grunt clone-repos   # clone all repositories to ./dev-repos/
grunt build --dev   # build from repositories instead of bower
```

Now you can work one each component within their respective git repository.


# Components

This is a list of the currently bundled components provided in the library. (Click to view subfolder with readme and demo page)

Full documentation can be found on [the Brick site](http://mozilla.github.io/brick/).

## Structural Components

### ['Layout'](https://github.com/x-tag/layout)

* Primary layout container, holds app structure.
* Allows whole "app" space to have layout properties like flexbox without affecting <body>

### ['App Bar' (header)](https://github.com/x-tag/appbar)

* Contains top-level information and UI
* Similar to a toolbar or roughly equivalent to Android's action bar

### ['Tab Bar' (navigation, footer)](https://github.com/x-tag/tabbar)

* Used to display an app-level navigation at the bottom of the UI
* Usually a series of icons with labels.
* Tabs are linked to panels/views. Changing tab changes the active panel, and changing the active panel changes the tab
* Essentially fires a 'show' event at targeted elements. It is up to target elements to respond appropriately.
    - Components with default support for show event:
        - Slidebox
        - Flipbox
        - Deck
* Can also fire user-defined events

### ['Slidebox'](https://github.com/x-tag/slidebox)

* Allows a 'slide' filmstrip effect between views or panels

### ['Flipbox'](https://github.com/x-tag/flipbox)

* Similar to slidebox, but with a perspective flip effect.
* May be combinable with slidebox and accessed via an option

### ['Deck' ('Cycle'/'Gallery')](https://github.com/x-tag/deck)

* Like a combination of slidebox and flipbox
* A gallery box in which slides can be cycled in and out independently, with a variety of different transitions
* Transition types can be switched and overridden on the fly, allowing for a
  variety of different entrances/exits

### ['Tooltip' (Callout)](https://github.com/x-tag/tooltip)

* Content container that appears over current view context
* Associated with a trigger element in the underlying content
* Does not necessarily block interaction with underlying content

## Content Components

### [Calendar](https://github.com/x-tag/calendar)

* A calendar widget based on/extended from [fortnight.js](https://github.com/potch/fortnight.js), but in a web component format
* Simple instantiation, with API hooks to allow flexible use cases such as an event-managing calendar (see demo)

### [Datepicker](https://github.com/x-tag/datepicker)

* A polyfill for &lt;input type='date'&gt;, regardless of native browser support for date inputs
* Ability to select a date and submit its ISO string to a server
* Extends upon x-calendar to provide a calendar view

### [Icon Button](https://github.com/x-tag/iconbutton)

* A simple UI component that creates a button with both an icon and a label
* Allows multiple anchor locations of the icon and saves the developer from the headache of correctly CSS-centering contents

### [Slider](https://github.com/x-tag/slider)

* Polyfill on top of &lt;input type='range'&gt;, providing a consistent UI regardless of whether type="range" is supported or not.

### [Toggle](https://github.com/x-tag/toggle)

* Unifies checkboxes and radios into a single consistent UI component

### [Togglegroup (aka Option Bar)](https://github.com/x-tag/togglegroup)

* A set of associated options of which only one can be selected at a time
* Designed to appear as a cohesive set
* Essentially several Toggles with the appearance of option buttons
