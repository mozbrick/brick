# Overview

Iconbuttons are essentially buttons with an anchored icon in addition to a content label.

# Usage

    <x-iconbutton src="http://placekitten.com/20" icon-anchor="right">Hello</x-iconbutton>
    
Indicates that the browser should render a button with an icon of a kitten to the right of the button's content, which reads "Hello".


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
    

## ___contentEl___

Retrieves the DOM element representing the button's content.

You can then edit the DOM element directly. For example, if you wanted to dynamically change the content
color, you could do the following:

    fooIconButton.contentEl.style.color = "red";
    
# Styling

To define your own stylings for an icon button, you can apply your own CSS styles to
the following CSS selectors, assuming that `"foo"` represents an `x-iconbutton` element:

* applying styles to `x-iconbutton` applies styles as if it were to the button itself

* applying styles to `x-iconbutton > .x-iconbutton-icon` applies styles to the icon of the
  button

* applying styles to `x-iconbutton > .x-iconbutton-content` applies styles to the content of the
  button

***Known issue:*** applying a `font-size` to the `x-iconbutton` itself can sometimes cause extra top-padding to appear, due to the way vertical-align's baselines work. To work around this issue, make sure to only apply `font-size` to the `x-iconbutton > .x-iconbutton-content` selector.
