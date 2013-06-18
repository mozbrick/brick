# Overview

Iconbuttons are essentially buttons with an anchored icon in addition to a label.

# Usage

    <x-iconbutton src="http://placekitten.com/20" icon-anchor="right">Hello</x-iconbutton>
    
Indicates that the browser should render a button with an icon of a kitten to the right of the
button's label, which reads "Hello".


# Attributes

## ___icon-anchor___
To edit the icon location, simply change the `icon-anchor` attribute on the `<x-iconbutton>` tag

    fooIconButton.setAttribute("icon-anchor", "left");

- Valid values are
    - `"left"` (default)
    - `"right"`
    - `"top"`
    - `"bottom"`    
    
__Note:__ If the icon is no longer an &lt;img&gt; node, due to the user changing the DOM from the default, this will not do anything.

## ___src___
To edit the icon image source, simply change the `src` attribute on the `<x-iconbutton>` tag:

    fooIconButton.setAttribute("src", "http://<YOUR IMAGE HERE>");
    

# Accessors (getters/setters)

## ___icon___
Used to work with the icon's DOM.

### (getter) Retrieving the icon DOM

To retrieve the icon DOM element, simply save it into a variable as follows:
        
    var iconDOMEl = fooIconButton.icon;    
    
You can then edit the DOM element directly. For example, if you wanted to dynamically hide
the icon, you could do the following:

    iconDOMEl.style.display = "none";
    
### (setter) Replacing the icon DOM    
To replace the icon entirely with your own custom DOM element, you can simply replace it as follows:

    fooIconButton.icon = myAwesomeNewIconDOMElem;

## ___label___

Used to work with the label's DOM.  
### (getter) Retrieving the label DOM

Similar to the icon, to retrieve the label DOM element, simply save it into a variable as follows:
        
    var labelDOMEl = fooIconButton.label;    
    
You can then edit the DOM element directly. For example, if you wanted to dynamically change the label
color, you could do the following:

    labelDOMEl.style.color = "red";    
    
### (setter) Replacing the label DOM
To replace the current label entirely with your own custom DOM element, you can simply replace it as follows:

    fooIconButton.label = myAwesomeNewLabelDOMElem;
    
_Note:_ If your custom DOM element's structure is different, make sure to update the `.textGetter`/`.textSetter` attributes so that you can still correctly use the `.text` attribute.

    
## ___text___
Used for getting/setting the label text.

You can use the `.text` attribute to view and modify the text contents of your button's label.

    fooIconButton.text = "Hello world!";
   
### ___textGetter___/___textSetter___

Defines how to change label text.

If your label's structure differs such that the default behavior of reading the `.textContent` of your label is not suficient, you can also
override the getter and setter behaviors for text by modifying the `.textGetter` and `.textSetter` attributes, respectively.

    fooIconButton.textGetter = function(){
        // custom text getting behavior
    }
    
    fooIconButton.textSetter = function(newText){
        // custom text setting behavior
    }

    
# Styling

To define your own stylings for an icon button, you can apply your own CSS styles to
the following CSS selectors, assuming that `"foo"` represents an `x-iconbutton` element:

* applying styles to `foo` applies styles as if it were to the 
  "wrapper" of the button
       
* applying styles to `foo > .button` applies styles to the 
  button element itself

* applying styles to `foo > .icon` applies styles to the icon of the
  button

* applying styles to `foo > .label` applies styles to the label of the
  button
