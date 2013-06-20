# Overview
A box element in which cards can be cycled independently of order with a variety of different transitions

# Usage

    <x-deck>
        <x-card>Lorem ipsum</x-card>
        
        <x-card><img src="http://placekitten.com/300"/></x-card>
        
        <x-card><button>Hello!</button></x-card>
    </x-deck>
    
Indicates that the browser should render a deck box with three cards: one with
the text "Lorem ipsum", one with an image, and one with a button.

Note that `<x-card>` elements can contain any kind of html markup!

# Attributes

## ___transition-type___

Defines the type of animation to use for cycling between cards

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

## x-card: ___transition-override___

If a specific card has an override property, that specific animation will be used when transitioning that card.

Valid options are the same as the x-deck's `transition-type` attribute.

# Methods

## ___shuffleTo___(index, [progressType], [callback])

Transitions to the x-card at the given index within the deck. 

If given a progressType of 'forward', will perform the forwards/normal version of the current transition animation. 
If given 'reverse', will performs the reverse animation. 
If the progressType is 'auto' or omitted, will perform forward animation if going to a larger index, and will perform reverse animation if going to a smaller index. 

Also takes an optional callback function that takes no parameters to be called once the cards have finished cycling.

## ___shuffleNext___([progressType], [callback])

Transitions to the next card in the deck, looping back to the start if needed.

See ___shuffleTo___ for details on the progressType and callback parameters

## ___shufflePrev___([progressType], [callback])

Transitions to the previous card in the deck, looping back to the end if needed.

See ___shuffleTo___ for details on the progressType and callback parameters

## ___getAllCards___()

Returns a list of all x-card DOM elements belonging to the deck

## ___getSelectedCard___()

Returns the x-card DOM element that is currently displayed by the deck. Returns null if no such card exists.

## ___getCardIndex___(card)

Given a x-card DOM element, returns the index of the given card among the deck's cards. Returns -1 if the given card is not in the deck.

## ___getCardAt___(index)

Returns the x-card DOM element at the given index in the deck

## (x-card): ___show___()

Forces the deck to display the card who called this method

# Events

## ___shuffleend___

A `shuffleend` event is fired by the &lt;x-deck&gt; element when a cycle from one card to another has been completed.

##  x-card: ___show___

If an &lt;x-card&gt; element receives a `show` event, the deck will transition to the card that received the event using the currently set transition type.


# Styling

Because `<x-deck>` and `<x-card>` elements are just regular DOM elements,
you can style them as normal.

However, decks also add some extra selectors, allowing you to finetune how cards
appear during animations. (The following examples use the same html structure as the usage example.)

* Styles applied to `x-deck > x-card[selected]` are only applied to the currently visible card in the deck.
* Styles applied to `x-deck > x-card[leaving]` define how a card looks when in the middle of transitioning out of view
    - For example, if you wanted cards to be faded when leaving the deck's viewport, you could apply the following style:
            
            x-deck > x-card[leaving]{
                opacity: 0.7;
            }


# Misc

## Adding/removing cards

To add and remove cards, you don't need any special x-deck specific methods. You can simply appendChild and removeChild &lt;x-card&gt;
elements to the &lt;x-deck&gt; as you would any other DOM element.