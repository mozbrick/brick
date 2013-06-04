app-components
==============

Set of web components for use in building Open Web App UIs

# Icon Buttons

##Usage

    <x-iconbutton src="http://placekitten.com/20" icon-anchor="right">Hello</x-iconbutton>
    
Should produce a button with an icon on the right side of the button.

### options

* To edit the icon image source, simply change the `src` attribute on the `<x-iconbutton>` tag
* To edit the icon location, simply change the `icon-anchor` attribute on the `<x-iconbutton>` tag
** Valid values are
*** `"left"` (default)
*** `"right"`
*** `"top"`
*** `"bottom"`
