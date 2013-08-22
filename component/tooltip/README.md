# Overview
Tooltips provide content that appears in current context to point at an element. They are associated with a triggering element and trigger-interaction-style as defined by the user.

# Usage

Basic usage:

    <body>
        <div>Blah blah I have a tooltip</div>
        <x-tooltip orientation="above" trigger-style="hover" target-selector="_previousSibling">
            Hello, I am the tooltip. <img src="http://placekitten.com/50"/>
        </x-tooltip>
    </body>

This example would create a tooltip positioned above the &lt;div&gt; that appears when the user mouses over the div. 
    
In order to allow semantic markup without extracting/moving around the tooltip's location in the DOM tree, tooltips markup follows these guidelines:

* Tooltips are absolutely positioned in relation ___to their parent node___ instead of always in relation to the body, and are thus meant to be marked up inside the container element that the user would like the tooltip to be constrained by.
* Eligible target elements are those in the same parent container as the tooltip or deeper
* Target selectors are applied in relation to the document

# Attributes

## ___orientation___

Defines where the tooltip should appear in relation to the element it targets.

Valid options:

* `top`
* `bottom`
* `left`
* `right`

If orientation is not set, or is set to a value not in this list, the tooltip will attempt to automatically determine its orientation based on what orientation does not cause it to overlap the element.

## ___target-selector___ / ___targetSelector___

Defines how to select the elements that trigger/are targeted by the tooltip.

Options:
* If set to `_previousSibling`, the sibling element directly before the tooltip will be used. See the usage section for an example of this.
* If set to `_nextSibling`, the sibling element directly after the tooltip will be used. For example, the &lt;p&gt; would be selected in this example:
```
    <div>
        <x-tooltip target-selector="_nextSibling">I am the tooltip!</x-tooltip>
        <p>I am the target!</p>
    </div>
```  
    
* If set to anything else, the selector will be used as a CSS query selector on the document, and all selected nodes will be set as target elements. For example, this example would select the &lt;div&gt;s marked A and B, but not the one marked C.

```
    <figure>
        <div>A</div>
        <x-tooltip target-selector="figure div">I select all divs!</div>
        <div>B</div>
        <span>I won't be selected!</span>
    </figure>
    <footer>
        <figure>
            <div>C</div>
        </figure>
    </footer>
``` 
  
If this attribute is not provided, the default is `_previousSibling`.

__Note__: selectors can be any valid CSS selector that could be used in querySelectorAll on the document
    
Can be set with the `target-selector` HTML attribute or the `targetSelector` JavaScript property.
    
## ___trigger-style___ / ___triggerStyle___

Defines the type of interaction used to trigger the tooltip show/hide.

Valid options:
* If set to the preset `hover`, the tooltip will appear any time the user mouses over the target element, and will disappear upon mousing off the target and tooltip.
* If set to the preset `custom`, no handlers to show or hide the tooltip will be automatically applied. This is useful when the user wants to define a custom style of triggering the tooltip, but doesn't want any default behaviors getting in the way.
* If set to anything else, the tooltip will appear when the target element has the given trigger-style occur as an event, and will persist until the user dismisses it by triggering the same event outside of the tooltip.
    - This allows us to specify a wide variety of event triggers, such as 'tap', 'click', or 'mousedown'

If not given, this defaults to `hover`.

Can be set with the `trigger-style` HTML attribute or the `triggerStyle` JavaScript property.

## ___allow-overflow___ / ___allowOverflow___

By default, the tooltip will always try to place the tooltip in a way that is constrained by both the container element and the window's viewport (ie: accounting for scrolling).

If `allow-overflow` set, this will instead allow the tooltip to be placed freely, even if it overflows the containing element (However, the tooltip will still be constrained by the window's viewport).

## ___ignore-outer-trigger___ / ___ignoreOuterTrigger___

If present and `trigger-style` is not set to a preset style, this will indicate that we should **not** hide the tooltip when the triggering event is fired outside of the tooltip's target.

If absent, events triggered outside of the tooltip or its targets will close the tooltip.

Has no effect when `trigger-style` is set to a preset style.

Can be set with the `ignore-outer-trigger` HTML attribute or the `ignoreOuterTrigger` JavaScript property.

## ___ignore-tooltip-pointer-events___ / ___ignoreTooltipPointerEvents___

If present, pointer events on the tooltip will be ignored, keeping it from blocking interaction with underlying elements. This is useful when you know that users will not need to interact with the tooltip itself and want the tooltip to avoid obstructing other elements.

Can be set with the `ignore-tooltip-pointer-events` HTML attribute or the `ignoreTooltipPointerEvents` JavaScript property.

# Accessors (getters/setters)

## contentEl

Provides access to the the DOM element used to represent the content of the given tooltip. **Note that it you want to edit the `innerHTML` or `textContent` of the tooltip, you'll need to edit the element returned by contentEl!**

### (getter) Retrieving the content DOM

Accessing a tooltip's `.contentEl` property provides access to the DOM element used to represent the tooltip's content. This allows the user to dynamically modify the contents of the tooltip.

### (setter) Replacing the content DOM

The user can also completely replace the content DOM of the tooltip with their custom DOM node by assigning it to the tooltip's `.contentEl` property.

## ___presetTriggerStyles___ (getter only)

Returns a list of the valid preset style types for the `trigger-style` attribute.

## ___targetElems___ (getter only)

Returns a list of all DOM elements currently selected as a target of the tooltip.

# Methods

## ___refreshPosition___()

If the position of the tooltip needs to be recalculated (say, after modifying the contents of a visible tooltip), calling this method will manually reposition the 
the tooltip to account for any dimension changes.

## ___show___()

Exactly as you'd expect; This makes the tooltip visible.

## ___hide___()

Exactly as you'd expect; This hides the tooltip.

## ___toggle___()

Exactly as you'd expect; This toggles between showing and hiding the tooltip.

# Events

## ___tooltipshown___

This event is fired by the &lt;x-tooltip&gt; when the tooltip is shown.

The event also receives extra data in the `triggerElem` property, which stores a reference to the DOM element that triggered the tooltip

## ___tooltiphidden___

This event is fired by the &lt;x-tooltip&gt; when the tooltip is hidden.

# Styling

To define your own stylings for an icon button, you can apply your own CSS styles to
the following CSS selectors, assuming that `"foo-tooltip"` represents an `x-tooltip` element:

* Applying styles to `foo-tooltip` applies styles as if it were to the 
  "wrapper" of the tooltip. This is where you'll want to define the border and background of the tooltip, as these
  styles will be inherited by the arrow pointer of the tooltip.
       
* Applying styles to `foo-tooltip > .tooltip-content` applies styles to the content element

__Important note:__ Tooltips are positioned absolutely, so make sure to set `position: relative` on the containing element that you want them to be positioned in. 

For example, if you want to position tooltips in relation to the `<body>` element, failure to set `position:relative` on the body will lead to tooltips being in positioned in relation to the window. (ie: acting as if they were `position: fixed`).
