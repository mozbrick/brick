Brick / App-components
==============

Brick is a bundle of re-usable UI components for quickly and flexibly building mobile HTML5 apps. Brick adds new HTML tags- widgets that allow developers to express the structure of an application in a clearer, more concise manner.

In other words, Brick provides minimal-markup, cross-browser implementations of common user interface designs, from calendars to slidebars to cycleable galleries, taking care of most of the under-the-hood boilerplate for you.

For example, this is all the markup that would be needed to implement a mobile-friendly, cross-browser calendar widget:

```
<x-calendar></x-calendar>
```

That's it! It really is that easy.

#Installation

Prebuilt versions of the entire library are provided in <code>dist/brick.css</code> and <code>dist/brick.js</code>, and be included in your project like any other CSS/JavaScript file.

In the near future, compartmentalized releases of specific components will be released in their respective folders under <code>dist</code>, allowing you to pick and choose what components you want. (Do not use these yet, as dependencies have not been created yet.)

## Building from the repository source 

If you wish to build the library yourself, first have <code>npm</code> installed. You'll also need the ability to run <code>make</code>, so Windows users may need to install Cygwin, [making sure to install the <code>make</code> package](http://superuser.com/questions/154418/where-do-i-get-make-for-cygwin).

Then, run the following:

```
git clone git@github.com:mozilla/app-components.git
cd app-components
npm install
make
```

The built files should be output to <code>dist/brick.css</code> and <code>dist/brick.js</code>.

# Components

This is a list of the currently bundled components provided in the library. (Click to view subfolder with readme and demo page)

## Structural Components

### ['Layout'](component/layout)

* Primary layout container, holds app structure.
* Allows whole "app" space to have layout properties like flexbox without affecting <body>

### ['App Bar' (header)](https://github.com/x-tag/appbar)

* Contains top-level information and UI
* Similar to a toolbar or roughly equivalent to Android's action bar

### ['Tab Bar' (navigation, footer)](component/tabbar)

* Used to display an app-level navigation at the bottom of the UI
* Usually a series of icons with labels.
* Tabs are linked to panels/views. Changing tab changes the active panel, and changing the active panel changes the tab
* Essentially fires a 'show' event at targeted elements. It is up to target elements to respond appropriately.
    - Components with default support for show event:
        - Slidebox
        - Flipbox
        - Shuffledeck
* Can also fire user-defined events

### ['Slidebox'](https://github.com/x-tag/slidebox)

* Allows a 'slide' filmstrip effect between views or panels

### ['Flipbox'](https://github.com/x-tag/flipbox)

* Similar to slidebox, but with a perspective flip effect.
* May be combinable with slidebox and accessed via an option

### ['Deck' ('Cycle'/'Gallery')](component/deck)

* Like a combination of slidebox and flipbox
* A gallery box in which slides can be cycled in and out independently, with a variety of different transitions
* Transition types can be switched and overridden on the fly, allowing for a 
  variety of different entrance/exits

### ['Modal' (Overlay)](https://github.com/x-tag/modal)

* Content container that appears over current view context, similar to a popup overlay.
* Blocks interaction with underlying content, but can be dismissed by clicking outside the modal

### ['Tooltip' (Callout)](component/tooltip)

* Content container that appears over current view context
* Associated with a trigger element in the underlying content
* Does not necessarily block interaction with underlying content

## Content Components

### [Calendar](component/calendar)

* A calendar widget based on/extended from [fortnight.js](https://github.com/potch/fortnight.js), but in a web component format
* Simple instantiation, with API hooks to allow flexible use cases such as an event-managing calendar (see demo)

### [Datepicker](component/datepicker)

* A polyfill for &lt;input type='date'&gt;, regardless of native browser support for date inputs
* Ability to select a date and submit its ISO string to a server
* Extends upon x-calendar to provide a calendar view

### [Icon Button](component/iconbutton)

* A simple UI component that creates a button with both an icon and a label
* Allows multiple anchor locations of the icon and saves the developer from the headache of correctly CSS-centering contents

### [Slider](component/slider)

* Polyfill on top of &lt;input type='range'&gt;, providing a consistent UI regardless of whether type="range" is supported or not.

### [Toggle](https://github.com/x-tag/toggle)

* Unifies checkboxes and radios into a single consistent UI component

### [Togglegroup (aka Option Bar)](component/togglegroup)

* A set of associated options of which only one can be selected at a time
* Designed to appear as a cohesive set
* Essentially several Toggles with the appearance of option buttons