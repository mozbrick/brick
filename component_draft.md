app-components
==============

Set of web components for use in building Open Web App UIs


# Web Components

First Draft- Names are not necessarily final.

For the purposes of this document, layout terminology assumes a small-screen handheld phone.
Positions/appearances will likely differ on larger displays or with different input techniques.

## Structural Components

### ['Layout'](https://github.com/x-tag/layout)

* Primary layout container, holds app structure.
* Allows whole "app" space to have layout properties like flexbox without affecting <body>

### ['App Bar' (header)](https://github.com/x-tag/appbar)

* Contains top-level information and UI
* Similar to a toolbar or roughly equivalent to Android's action bar

### ['Tab Bar' (navigation, footer)](https://github.com/mozilla/app-components/tree/master/tabbar)

* Used to display an app-level navigation at the bottom of the UI
* Usually a series of icons with labels.
* Tabs are linked to panels/views. Changing tab changes the active panel, and changing the active panel changes the tab
* Essentially fires a 'show' event at targeted elements. It is up to target elements to respond appropriately.
    - Components with default support for show event:
        - Slidebox
        - Flipbox
        - Shuffledeck

### ['Panel'](https://github.com/x-tag/panel)

* Content container
* Allows for dynamic content population

### ['Slidebox'](https://github.com/x-tag/slidebox)

* Allows a 'slide' filmstrip effect between two views or panels

### ['Flipbox'](https://github.com/x-tag/flipbox)

* Similar to slidebox, but with a perspective flip effect.
* May be combinable with slidebox and accessed via an option

### ['Shiftbox' ('Hamburger')](https://github.com/x-tag/shiftbox)

* When triggered (via a swipe or button), content slides to reveal a menu.
* Content does not fully slide out of the viewport.
* May contain top level navigation

### ['Deck' ('Cycle'/'Gallery')](https://github.com/mozilla/app-components/tree/master/shuffledeck)

* Somewhat like a combination of slidebox and flipbox
* A box in which slides can be cycled independently of order with a variety of different transitions
* Transition types can be switched and overridden on the fly, allowing for a 
  variety of different entrance/exits

### ['Modal' (Overlay)](https://github.com/x-tag/modal)

* Content container that appears over current view context
* Blocks interaction with underlying content

### ['Tooltip' (Callout)](https://github.com/mozilla/app-components/tree/master/tooltip)

* Content container that appears over current view context
* Associated with a trigger element in the underlying content
* Does not necessarily block interaction with underlying content
* Interacting with underlying content would dismiss the tooltip.

## Content Components

### [Switch](https://github.com/x-tag/switch)

* Visual style/design for an important boolean option
* e.g. on/off switch

### [Toggle](https://github.com/x-tag/toggle)

* Unifies checkboxes and radios - devs just code, we figure out the shiz

### [Togglegroup (aka Option Bar)](https://github.com/mozilla/app-components/tree/master/togglegroup)

* A set of associated options of which only one can be selected at a time
* Designed to appear as a cohesive set
* Essentially several Toggles with the appearance of option buttons

### [Calendar](https://github.com/mozilla/app-components/tree/master/calendar)

* A calendar widget based on/extended from [fortnight.js](https://github.com/potch/fortnight.js), but as an x-tag component form
* Simple instantiation, with API hooks to allow flexible use cases such as an event-managing calendar (see demo)

### [Datepicker](https://github.com/mozilla/app-components/tree/master/datepicker)

* A polyfill for &lt;input type='date'&gt;, regardless of native browser support for date inputs
* Ability to select a date and submit its ISO string to a server
* Extends upon x-calendar to provide a calendar view

### [Map](https://github.com/x-tag/map)

* An easy-to-instantiate HTML5 Map component, requiring only an API key to activate
* propose using http://leafletjs.com/ to power it under the hood
* This is a heavier component, requiring much more JS to include. May be an optional component for the set.

### [Spinner](https://github.com/x-tag/spinner)

* Simple indicator to show that an action is in progress

### [Slider](https://github.com/mozilla/app-components/tree/master/slider)

* Polyfill on top of input type='range', providing a consistent UI regardless of whether type="range" is supported or not.


### [Icon Buttons](https://github.com/mozilla/app-components/tree/master/iconbutton)

* Creates a button with both an icon and a label
