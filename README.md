app-components
==============

Set of web components for use in building Open Web App UIs


# Web Components

First Draft- Names are not necessarily final.

For the purposes of this document, layout terminology assumes a small-screen handheld phone.
Positions/appearances will likely differ on larger displays or with different input techniques.

## Structural Components

### 'View'

* Primary layout container, holds app structure.
* Allows whole "app" space to have layout properties like flexbox without affecting <body>

### 'App Bar' (header)

* Contains top-level information and UI
* Similar to a toolbar or roughly equivalent to Android's action bar

### 'Tab Bar' (navigation, footer)

* Used to display an app-level navigation at the bottom of the UI
* Usually a series of icons with labels.
* Tabs are linked to panels/views. Changing tab changes the active panel, and changing the active panel changes the tab

### 'Panel'

* Content container
* Allows for dynamic content population

### 'Slidebox'

* Allows a 'slide' effect between two views or panels

### 'Flipbox'

* Similar to slidebox, but with a perspective flip effect.
* May be combinable with slidebox and accessed via an option

### 'Shiftbox' ('Hamburger')

* When triggered (via a swipe or button), content slides to reveal a menu.
* Content does not fully slide out of the viewport.
* May contain top level navigation

### 'Shuffledeck' ('Cycle'/'Gallery')

* Somewhat like a combination of slidebox and flipbox
* A box in which slides can be cycled independently of order with a variety of different transitions
* Transition types can be switched and overridden on the fly, allowing for a 
  variety of different entrance/exits

### 'Modal' (Overlay)

* Content container that appears over current view context
* Blocks interaction with underlying content

### 'Tooltip' (Callout)

* Content container that appears over current view context
* Associated with a trigger element in the underlying content
* Does not necessarily block interaction with underlying content
* Interacting with underlying content would dismiss the tooltip.

## Navigation-like Components

### 'Action Bar' (responsive action menu)

* Automatically detects available space and eats actions that overflow

### 'Select Menu'

* Menu that slides in from below/above with options and a confirm button (UX/UI folks wanted this)
    Is this necessary? Many systems provide this on their own. Was trying to avoid replacing system &lt;select&gt;


## Content Components

### Switch

* Visual style/design for an important boolean option
* e.g. on/off switch

### Toggle

* Unifies checkboxes and radios - devs just code, we figure out the shiz

### Toggle Bar (aka Radio Bar)

* A set of associated options of which only one at a time can be selected
* Designed to appear as a cohesive set

### Date Selection

* triggered by an input type='date'
* Ability to select a date.
* appearance is not yet determined ('reels' vs a calendar view)

### Map

* An easy-to-instantiate HTML5 Map component, requiring only an API key to activate
* propose using http://leafletjs.com/ to power it under the hood
* This is a heavier component, requiring much more JS to include. May be an optional component for the set.

### Spinner

* Simple indicator to show that an action is in progress

### Slider

* Polyfill on top of input type='range', providing a consistent UI regardless of whether type="range" is supported or not.


### Icon Buttons

* Creates a button with both an icon and a label

#### Usage

    <x-iconbutton src="http://placekitten.com/20" icon-anchor="right">Hello</x-iconbutton>
    
Indicates that the browser should render a button with an icon of a kitten to the right of the
button's label, which reads "Hello".

#### Styling

To define your own stylings for an icon button, you can apply your own CSS styles to
the following CSS selectors, assuming that `"foo"` represents an `x-iconbutton` element:

* applying styles to `foo` applies styles as if it were to the 
  "wrapper" of the button
       
* applying styles to `foo .button` applies styles to the 
  button element itself

* applying styles to `foo .icon` applies styles to the icon of the
  button

* applying styles to `foo .label` applies styles to the label of the
  button

#### options

* To edit the icon image source, simply change the `src` attribute on the `<x-iconbutton>` tag
* To edit the icon location, simply change the `icon-anchor` attribute on the `<x-iconbutton>` tag
    - Valid values are
        - `"left"` (default)
        - `"right"`
        - `"top"`
        - `"bottom"`
