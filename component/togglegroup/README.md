# Overview

Togglegroups are used to display a set of clickable option buttons, which can be either mutual-exclusively or independently toggled.

# Usage

    <x-togglegroup name="colour" group="colour">
         <x-toggle label="Red" value="red"></x-toggle>
         <x-toggle label="Green" value="blue"></x-toggle>
         <x-toggle label="Blue" value="green"></x-toggle>
    </x-togglegroup>

Will produce a bar of three options, of which only one can be selected at a time. If a form with this toggle group is submitted, the selected 

# Attributes

## ___name___

Indicates the name to use for the group of buttons. This is the default keyname that will be submitted if submitted through a form.

The prescence of a name forces the toggles to act as radio toggles with a single name.

## ___group___

Indicates the name of the group of buttons. This allows the use of the shift key to select several buttons in one click when acting as checkbox toggles.

# Accessors

## ___options___ (getter only)

Retrieves an array of the DOM elements for each option in the toggle group.

# Styling

- Styling `x-togglegroup > x-toggle` will style the buttons in the group. This follows the `x-toggle` tag's styling rules.
