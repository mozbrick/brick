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

## ___transition-type___ / ___transitionType___

Defines the type of animation to use for cycling between cards

Can either be set as an HTML attribute under the name `transition-type` or
programmatically with the property `transitionType`

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
* [uncoverLeft](demo/transition_type_gifs/uncoverLeft.gif)
* [uncoverUp](demo/transition_type_gifs/uncoverUp.gif)
* [uncoverRight](demo/transition_type_gifs/uncoverRight.gif)
* [uncoverDown](demo/transition_type_gifs/uncoverDown.gif)
* [none](demo/transition_type_gifs/none.gif)

## ___selected-index___ / ___selectedIndex___

Gets/sets the index of the currently selected card in the deck

Note that setting this instead of using shuffleTo is equivalent to performing 
a "none" type transition

Can either be set as an HTML attribute under the name `selected-index` or
programmatically with the property `selectedIndex`

## ___history-cap___ / ___historyCap___

Get/sets the maximum number of cards to keep in history at any time

Can either be a positive number or "none", which signifies an infinite number cards are allowed to be in memory

If not set, defaults to 50.

Can either be set as an HTML attribute under the name `history-cap` or
programmatically with the property `historyCap`

## x-card: ___transition-override___ / ___transitionOverride___

If a specific card has an override property, that specific animation will be used when transitioning that card.

Can either be set as an HTML attribute on the x-card under the name `transition-override` or
programmatically with the property `transitionOverride`

Valid options are the same as the x-deck's `transition-type` attribute.

# Accessors

## ___cards___ (getter only)

Returns a list of all x-card DOM elements belonging to the deck

## ___numCards___ (getter only)

Gets the number of cards currently stored in the deck

Example:
```
    var foo = document.querySelector('x-deck').numCards;
```

## ___selectedCard___ (getter only)

Returns the x-card DOM element that is currently displayed by the deck. Returns null if no such card exists.

## ___currHistorySize___

Gets the number of cards currently in history

## ___currHistoryIndex___

Gets the current index that we are at in our history stack

# Methods

## ___shuffleTo___(index, [progressType])

Transitions to the x-card at the given index within the deck. 

If given a progressType of 'forward', will perform the forwards/normal version of the current transition animation. 
If given 'reverse', will performs the reverse animation. 
If the progressType is 'auto' or omitted, will perform forward animation if going to a larger index, and will perform reverse animation if going to a smaller index. 


## ___shuffleNext___([progressType])

Transitions to the next card in the deck, looping back to the start if needed.

See ___shuffleTo___ for details on the progressType parameter

## ___shufflePrev___([progressType])

Transitions to the previous card in the deck, looping back to the end if needed.

See ___shuffleTo___ for details on the progressType parameter

## ___getAllCards___()

See the `cards` accessor documentation

## ___getSelectedCard___()

See the `selectedCard` accessor documentation

## ___getCardIndex___(card)

Given a x-card DOM element, returns the index of the given card among the deck's cards. Returns -1 if the given card is not in the deck.

## ___getCardAt___(index)

Returns the x-card DOM element at the given index in the deck

## ___historyBack___([progressType])

Auto-transitions to the previous card stored in history, if it exists

See ___shuffleTo___ for details on the progressType parameter

## ___historyForward___([progressType])

Auto-transitions to the next card stored in history, if it exists

See ___shuffleTo___ for details on the progressType parameter

## (x-card): ___show___()

Forces the deck to display the card who called this method

# Events

## ___shufflestart___ 

A `shufflestart` event is fired by the &lt;x-deck&gt; element when, during the process of transitioning between cards,
the two cards are in position to start animating, but have not yet begun the actual animation.

The event also receives the following custom datamap in `e.detail`:

    {
        'oldCard': the previously selected x-card that the transition is animating away from,
        'newCard': the x-card that the transition is animating towards
    }

## ___shuffleend___

A `shuffleend` event is fired by the &lt;x-deck&gt; element when a cycle from one card to another has been completed.

**Note:** Much like the `transitionend` event, this is not guaranteed to fire after every transition that fires a shufflestart. For example, if two transitions are queued up, with the second occurring during the first transition, only the second transition's `shuffleend` will fire, due to the first transition being interrupted.

The event also receives the following custom datamap in `e.detail`:

    {
        'oldCard': the previously selected x-card node that the transition is animating away from,
        'newCard': the x-card node that the transition is animating towards
    }

## ___cardadd___

Fired by the x-deck whenever an x-card is added.

Receives the following datamap in `e.detail`:

    {
        'card': the x-card that was just added
    }

## ___cardremove___

Fired by the x-deck whenever an x-card is removed.

Receives the following datamap in `e.detail`:

    {
        'card': the x-card that was just removed
    }   

##  ___show___

If an &lt;x-card&gt; element receives a `show` event, the deck will transition to the card that received the event using the currently set transition type.

X-deck does not fire this event.

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
