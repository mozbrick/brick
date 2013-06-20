# Overview
A box element in which slides can be cycled independently of order with a variety of different transitions

# Usage

    <x-shuffledeck>
        <x-shuffleslide>Lorem ipsum</x-shuffleslide>
        
        <x-shuffleslide><img src="http://placekitten.com/300"/></x-shuffleslide>
        
        <x-shuffleslide><button>Hello!</button></x-shuffleslide>
    </x-shuffledeck>
    
Indicates that the browser should render a shuffledeck box with three slides: one with
the text "Lorem ipsum", one with an image, and one with a button.

Note that `<x-shuffleslide>` elements can contain any kind of html markup!

# Attributes

## ___transition-type___

Defines the type of animation to use for cycling between slides

Valid options:

* [scrollLeft](demo/transition_type_gifs/scrollLeft.gif)
* [scrollUp](demo/transition_type_gifs/scrollUp.gif)
* [scrollRight](demo/transition_type_gifs/scrollRight.gif)
* [scrollDown](demo/transition_type_gifs/scrollDown.gif)
* [flipX](demo/transition_type_gifs/flipX.gif)
* [flipY](demo/transition_type_gifs/flipY.gif)
* [coverLeft](demo/transition_type_gifs/coverLeft.gif)
* [coverUp](demo/transition_type_gifs/coverUp.gif)
* [coverRight](demo/transition_type_gifs/coverRight.gif)
* [coverDown](demo/transition_type_gifs/coverDown.gif)
* [coverLeft](demo/transition_type_gifs/coverLeft.gif)
* [coverUp](demo/transition_type_gifs/coverUp.gif)
* [coverRight](demo/transition_type_gifs/coverRight.gif)
* [coverDown](demo/transition_type_gifs/coverDown.gif)
* [none](demo/transition_type_gifs/none.gif)

## x-shuffleslide: ___transition-override___

If a specific shuffleslide has an override property, that specific animation will be used when transitioning that slide.

Valid options are the same as the x-shuffledeck's `transition-type` attribute.

# Methods

## ___slideTo___(index, [progressType], [callback])

Transitions to the x-shuffleslide at the given index within the shuffleDeck. 

If given a progressType of 'forward', will perform the forwards/normal version of the current transition animation. 
If given 'reverse', will performs the reverse animation. 
If the progressType is 'auto' or omitted, will perform forward animation if going to a larger index, and will perform reverse animation if going to a smaller index. 

Also takes an optional callback function that takes no parameters to be called once the slides have finished cycling.

## ___slideNext___([progressType], [callback])

Transitions to the next slide in the shuffledeck, looping back to the start if needed.

See ___slideTo___ for details on the progressType and callback parameters

## ___slidePrev___([progressType], [callback])

Transitions to the previous slide in the shuffledeck, looping back to the end if needed.

See ___slideTo___ for details on the progressType and callback parameters

## ___getAllSlides___()

Returns a list of all x-shuffleslide DOM elements belonging to the shuffledeck

## ___getSelectedSlide___()

Returns the x-shuffleslide DOM element that is currently displayed by the shuffledeck. Returns null if no such slide exists.

## ___getSlideIndex___(slide)

Given a x-shuffleslide DOM element, returns the index of the given slide among the shuffledeck's slides. Returns -1 if the given slide is not in the deck.

## ___getSlideAt___(index)

Returns the x-shuffleslide DOM element at the given index in the shuffledeck

## (x-shuffleslide): ___show___()

Forces the shuffledeck to display the slide who called this method

# Events

## ___slideend___

A `slideend` event is fired by the &lt;x-shuffledeck&gt; element when a cycle from one shuffleslide to another has been completed.

##  x-shuffleslide: ___show___

If an &lt;x-shuffleslide&gt; element receives a `show` event, the shuffledeck will transition to the slide that received the event using the currently set transition type.


# Styling

Because `<x-shuffledeck>` and `<x-shuffleslide>` elements are just regular DOM elements,
you can style them as normal.

However, shuffledecks also add some extra selectors, allowing you to finetune how slides
appear during animations. (The following examples use the same html structure as the usage example.)

* Styles applied to `x-shuffledeck > x-shuffleslide[selected]` are only applied to the currently visible slide in the deck.
* Styles applied to `x-shuffledeck > x-shuffleslide[leaving]` define how a slide looks when in the middle of transitioning out of view
    - For example, if you wanted slides to be faded when leaving the deck's viewport, you could apply the following style:
            
            x-shuffledeck > x-shuffleslide[leaving]{
                opacity: 0.7;
            }


# Misc

## Adding/removing slides

To add and remove slides, you don't need any special x-shuffledeck specific methods. You can simply appendChild and removeChild &lt;x-shuffleslide&gt;
elements to the &lt;x-shuffledeck&gt; as you would any other DOM element.