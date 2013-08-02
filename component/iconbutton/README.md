# Overview

Iconbuttons are essentially buttons with an anchored icon in addition to a label.

# Usage

    <x-iconbutton src="http://placekitten.com/20" icon-anchor="right">Hello</x-iconbutton>
    
Indicates that the browser should render a button with an icon of a kitten to the right of the
button's label, which reads "Hello".


# Attributes

## ___icon-anchor___ / ___iconAnchor___
To edit the icon location, simply change the `icon-anchor` attribute on the `<x-iconbutton>` tag

    fooIconButton.setAttribute("icon-anchor", "left");

- Valid values are
    - `"left"` (default)
    - `"right"`
    - `"top"`
    - `"bottom"`    
    
__Note:__ If the icon is no longer an &lt;img&gt; node, due to the user changing the DOM from the default, this will not do anything.

Can be set as the HTML attribute `icon-anchor` or programmatically through the property `iconAnchor` 

## ___src___
To edit the icon image source, simply change the `src` attribute on the `<x-iconbutton>` tag:

    fooIconButton.setAttribute("src", "http://<YOUR IMAGE HERE>");
    

# Accessors (getters/setters)

## ___icon___ (getter only)

Retrieves the DOM element representing the button's icon.
    
You can then edit the DOM element directly. For example, if you wanted to dynamically hide
the icon, you could do the following:

    fooIconButton.icon.style.display = "none";
    

## ___label___

Retrieves the DOM element representing the button's label.

You can then edit the DOM element directly. For example, if you wanted to dynamically change the label
color, you could do the following:

    fooIconButton.label.style.color = "red";
    
_Note:_ If your custom DOM element's structure ever changes, make sure to update the `.textGetter`/`.textSetter` attributes so that you can still correctly use the `.text` attribute.
    
## ___text___
Used for getting/setting the label text.

You can use the `.text` attribute to view and modify the text contents of your button's label.

    fooIconButton.text = "Hello world!";
   
### ___textGetter___ / ___textSetter___

Defines how to change label text.

If your label's structure differs such that the default behavior of reading the `.textContent` of your label is not sufficient, you can also
override the getter and setter behaviors for text by modifying the `.textGetter` and `.textSetter` attributes, respectively.

    fooIconButton.textGetter = function(iconButtonEl){
        // custom text getting behavior
    }
    
    fooIconButton.textSetter = function(iconButtonEl, newText){
        // custom text setting behavior
    }

    
# Styling

To define your own stylings for an icon button, you can apply your own CSS styles to
the following CSS selectors, assuming that `"foo"` represents an `x-iconbutton` element:

* applying styles to `x-iconbutton` applies styles as if it were to the button itself

* applying styles to `x-iconbutton > .x-iconbutton-icon` applies styles to the icon of the
  button

* applying styles to `x-iconbutton > .x-iconbutton-label` applies styles to the label of the
  button

***Known issue:*** applying a `font-size` to the `x-iconbutton` itself can sometimes cause extra top-padding to appear, due to the way vertical-align's baselines work. To work around this issue, make sure to only apply `font-size` to the `x-iconbutton > .x-iconbutton-label` selector.
