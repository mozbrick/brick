# Overview

Polyfill on top of &lt;input type='range'&gt;, providing a consistent UI regardless of whether type='range' is supported or not.

# Usage

Usage is simple, and attributes can be declared just like an actual &lt;input type=range/&gt; element.

For example, this markup should produce a slider with a range to 0 to 50, an initial value of 20, and steps of 5:
```
    <x-slider min=0 max=50 step=5 value=20></x-slider>
```

If `type=range` input elements are supported by the browser, this will default to the native slider input element. Otherwise, x-slider provides a polyfill element to simulate a range input.

# Attributes

## ___max___ 

Gets/sets the maximum value of the range. If not set, defaults to 100.

## ___min___

Gets/sets the minimum value of the range. If not set, defaults to 0.

## ___step___

Gets/sets the step size of the range (ie: how far apart allowable values should be, starting at the range's minimum). If not set to a valid value, defaults to 1.

Step must be strictly positive.

## ___value___

Gets/sets the current value of the range. Can also be used to set the initial starting value of the slider.

Set values are subject to being auto-constrained by the range's min, max, and step.

If not set, defaults to the value closest to the median of the range that follows the min, max, and step constraints.

## ___polyfill___

If not set, slider will use native browser version of &lt;input type="range"&gt;. In browsers where range inputs aren't supported, this may mean showing text inputs instead.

If set, slider will use polyfill stylings and event handling instead.

Polyfill is automatically set on x-slider creation depending on if range inputs are supported, but can be changed after the fact.

# Accessors

## ___inputElem___

(getter only) Gets the DOM element of the underlying &lt;input&gt; element.

# Events

## ___change___

Fired by the slider when its value is finished changing (ie: at the end of a drag that changes the value)

## ___input___

Fired by the slider when the user tries to input a new value, whether by mouse or touch. Will fire continuously as the user drags the slider.

## ___focus___

Fired by the slider when it receives focus, such as when it is tabbed to.

## ___blur___

Fired by the slider when it loses focus, such as when it is tabbed off of.

# Styling

Styling `x-slider` will style what essentially acts as a containing element for the actual underlying range input.

Styling `x-slider > .input` will style the actual underlying range input.

Note that `polyfill` is not set, the slider will use the default native browser stylings for the `.input`. 
So, to style, users may have to look up browser specific methods on styling native range inputs, such as with `::-webkit-slider-thumb`.

However, the polyfill version of the slider can be more easily customized:

Styling `x-slider[polyfill] > .input` allows users to define how the underlying track of the slider should look as a polyfill. By default, we use a background linear gradient to provide the appearance of a thin slider track, but this can be overridden to provide custom slider tracks.

Styling `x-slider[polyfill] > .slider-thumb` allows users to define how the slider thumb graphic should look as a polyfill. 

Styling `x-slider[polyfill] > .slider-thumb[active]` allows users to define how the polyfill slider thumb graphic should when being dragged. 


