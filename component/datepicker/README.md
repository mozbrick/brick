# Overview

A polyfill for &lt;input type='date'&gt; utilizing the x-calendar component and returning an ISO-formatted date string to the server

# Usage

Basic usage:

    <x-datepicker name="submission-key-name-here"></x-datepicker>

When this is submitted, the server should a receive the key `submission-key-name-here` with a value of the `YYYY-MM-DD` ISO-formatted string corresponding to the date selected by the datepicker (or an empty string if no such date was selected).

# Attributes

## ___name___

Indicates the name of the input to use. This is the keyname that will be submitted through a form, and is required for default form submission behavior to be able to see this datepicker.

Can also be programmatically set through the `name` JavaScript property.

## ___value___

Indicates the currently displayed value of the datepicker. Can also be used to initialize a certain value.

Note that this isn't always necessarily the same as the value that would be submitted through a form.

For example, if the user is currently typing `July 4, 2013` and hasn't left focus yet, the value is `July 4, 2013`, not `2013-07-04`.

To retrieve the value that should be submitted through a form, see the **submitValue** accessor/getter.

Can also be programmatically set through the `value` JavaScript property.

## ___polyfill___

Indicates whether or not the datepicker is currently using the polyfill version of its UI or not.

Can also be programmatically set through the `polyfill` JavaScript property.

# Accessors

## ___submitValue___ (getter only)

Retrieves the value that the datepicker should submit to a form. 

For example, if the user is currently typing `July 4, 2013` and hasn't left focus yet, the submitValue is `2013-07-04`, not `July 4, 2013` (as opposed to the behavior of the `value` attribute). 

Also note that unless the datepicker has a `name` attribute, this does not guarantee that this will actually be submitted to a form.

## ___labels___ (read/write)

Much like an `<x-calendar>`'s `.labels` property, `<x-datepicker>`s also have a `.labels` property to allow relabeling/localization of the component. 

The format and interface for the datepicker's `.labels` property is near identical to `<x-calendar>`'s `.labels` property, so it would be best to read the calendar's labels documentation for full details.

However, in addition to the labels provided by the calendar, there are three extra keys that can be set for a datepicker's labels:

    {
        'yearAbbr': A single character to use in abbreviations of a year category. (ex: "Y"),
        'monthAbbr': A single character to use in abbreviations of a month category. (ex: "M"),
        'dayAbbr': A single character to use in abbreviations of a day category. (ex: "D")
    }


# Events

## ___input___

Fired by the datepicker when the user tries to input a new value. In other words, this will fire if the user selects a date, and will also fire continuously as the user types in a new date.

## ___change___

Fired by the datepicker only when its final value (ie: `submitVal`) is changed or when the value is finalized. In other words, while `input` fires as the user types in a date, `change` only fires when the parsed date it corresponds to is changed, or when the user hits enter and the date parsed into ISO format.

## ___focus___

Fired by the slider when it receives focus, such as when it is tabbed to.

## ___blur___

Fired by the slider when it loses focus, such as when it is tabbed off of.

# Styling

- To style the datepicker's container, apply styles to `x-datepicker`.
- To style the datepicker's input, regardless of polyfill, apply styles to `x-datepicker > input`.
- To style the datepicker's native non-polyfill input, apply styles to `x-datepicker > .x-datepicker-input`.
- To style the datepicker's polyfill input, apply styles to `x-datepicker > .x-datepicker-polyfill-input`.
- To style the datepicker's calendar, apply styles to `x-datepicker > .x-datepicker-polyfill-ui`.
    - For details on how to style the calendar, see the styling section of the [x-calendar documentation](https://github.com/mozilla/app-components/tree/master/calendar).
- To style the datepicker when it contains an invalid value, apply styles to `x-datepicker[invalid]`.

(See demo/datepicker-demo.html for an example of applying custom styles.)
