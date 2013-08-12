# Overview

A component acting as a calendar widget that can be manipulated with minimal user-written code/layout. Based on and extended from [fortnight.js](https://github.com/potch/fortnight.js).

# Usage

Basic calendar:

    <x-calendar></x-calendar>

Basic calendar with navigation controls:

    <x-calendar controls></x-calendar>

Calendar with multi-select:

    <x-calendar multiple></x-calendar>

Calendar showing more than one month at a time

    <x-calendar span="3"></x-calendar>

Calendars displaying an initial date:

    <x-calendar view="2013-06-09"></x-calendar>
    <x-calendar view="June 9, 2013"></x-calendar>
    <x-calendar view="06/09/2013"></x-calendar>
    etc...

Calendars initialized with an already-chosen date:

    <x-calendar chosen="2013-06-09"></x-calendar>
    <x-calendar chosen="June 9, 2013"></x-calendar>
    <x-calendar chosen="06/09/2013"></x-calendar>
    etc...

Calendars initialized with multiple selected dates:

    <x-calendar multiple chosen='["2013-06-09", "2013-06-24", "2013-07-04"]'></x-calendar>
    <x-calendar multiple chosen='[["06/09/2013", "06/15/2013"]]'></x-calendar>
    <x-calendar multiple chosen='[["Jun 4 2013", "Jun 10, 2013"], "June 22 2013", ["2013-06-20", "Jun 20, 2013"], ["Jun 24, 2013","06/26/2013"]]'></x-calendar>
    etc...

# Attributes

## ___controls___

Controls the visibility of the calendar's navigation controls; usage is similar to the 'controls' attribute of &lt;video&gt; elements. 

Can also be programmatically manipulated with the `controls` property.

## ___multiple___

Controls whether or not multiple calendar dates can be chosen simultaneously

Can also be programmatically manipulated with the `multiple` property.

**Note:** Changing this rerenders the calendar

## ___span___

Specifies the number of months displayed at once by the calendar.

Can also be programmatically manipulated with the `span` property.

**Note:** Changing this rerenders the calendar

## ___view___

Specifies the Date to focus the calendar display on. For example, a view of Dec 25 2013 and a span of 3 would result in a calendar displaying the months of Nov 2013, Dec 2013, and Jan 2014.

Can also be programmatically manipulated with the `view` property.

###(getter)
 Returns the view as a JS Date object (or null if not available)
###(setter) 
Can be set with either a JS Date object or a parsable string representing a date.

**Note:** Changing this rerenders the calendar

## ___chosen___

Specifies the date or dates that are toggled as chosen on the calendar.

Can also be programmatically manipulated with the `chosen` property.

###(getter)

- If `multiple` is not set, returns a single JS Date object (or null if not available). 
- If `multiple` is set, returns as a sorted list with elements as either of the following formats:
  - a singular JS Date object for individual chosen dates
  - a [Date, Date] list of the start and end points of a consecutive range of dates

###(setter)
Can always be set with either a JS Date object or a parsable string representing a date.

In addition, if `multiple` is set, can take either a list in the same format that the getter returns (parsable date strings can be used instead of JS Date objects), or a JSON string corresponding to the same format.

If using a JSON string, note that JSON string require **double quotes** for strings, **NOT single quotes!**

Valid:
    
    chosen='[["2013-07-10", "2013-07-11"]]'

Invalid:
    
    chosen="[['2013-07-10', '2013-07-11']]"

**Note:** Changing this rerenders the calendar

## ___firstWeekDayNum___ / ___first-weekday-num___

Specifies a number, 0-6, (where 0=Sunday, 1=Monday, etc) indicating which day should be the first day of the week

For example, to declare Monday as the first day of the week:

    <x-calendar first-weekday-num=1></x-calendar>

If not given, defaults to 0 (ie: Sunday).

**Note:** Changing this rerenders the calendar

## ___notoggle___ / ___noToggle___

If set, the default date-toggling behavior of the UI is disabled. However, dates can still be programmatically chosen/toggled.

Can be set with the `notoggle` attribute or programmatically with the `noToggle` property.

# Accessors

## ___firstVisibleMonth___ (getter only)

Returns the JS Date corresponding to the first day of the first fully-visible month displayed on the calendar.

## ___lastVisibleMonth___ (getter only)

Returns the JS Date corresponding to the first day of the last fully-visible month displayed on the calendar.

## ___firstVisibleDate___ (getter only)

Returns the JS Date corresponding to the first day displayed on the calendar, even if it is not part of a fully-visible month.

## ___lastVisibleDate___ (getter only)

Returns the JS Date corresponding to the last day displayed on the calendar, even if it is not part of a fully-visible month.

## __customRenderFn__ (getter/setter)

Allows an additional callback function to be applied to days when the calendar is rendered. 

Will be called with three parameters: the day's DOM element, the JS Date corresponding to the day, and the ISO-formatted string version of the date. This is useful when styles need to be more dynamically flexible than the default. 

For example:

    foo.customRenderFn = function(dayEl, date, iso){
        if(date.valueOf() > (new Date).valueOf()){
            dayEl.style.backgroundColor = "red";
        }
    }

will color all days after the current date red.

(See [demo/calendar-demo.html](demo/calendar-demo.html) for an example of using this to draw data indicators on days.)

***IMPORTANT NOTE***: because this is intended as an additional callback to be used in rendering, the function itself should not modify attributes in a way that would require a re-render, or infinite recursion can result.

## ___labels___ (getter/setter)

The labels of the calendar are managed using a datamap of strings. This allows localizers/translators to 
edit the labels of the calendar.

## getter

Returns a **deep copy** of the datamap used to manage labels. To save any changes made to this returned value, the user should reassign this back to the labels setter.

## setter

When called, will edit the labels of the calendar. 

The set value should be a JS object that can contain any of the following key:value pairs:
- `prev`: a string to display on the previous-month navigation button
- `next`: a string to display on the next-month navigation button
- `months`: an array of 12 strings, where the first string corresponds to January, the second to February, etc, all the way up to December.
- `weekdays`: an array of 7 strings, where the first string corresponds to Sunday, the second to Monday, etc, all the way up to Saturday.

If the new data given does not have any of these keys, that corresponding label will remain unchanged.

**Note:** Setting this will rerender the calendar.

# Methods

## ___render___([preserveNodes])

Can be called to manually force a refresh of the calendar's HTML elements. 

Optionally takes a preserveNodes parameter to indicate that the existing DOM elements in the calendar should be not recreated (Useful when the viewing window of the calendar does not need to change in order to prevent wasteful removal and recreation of nodes)

## ___prevMonth___()

Go back one month by updating the 'view' attribute of the calendar.

**Note:** This rerenders the calendar

## ___nextMonth___()

Advance one month forward by updating the 'view' attribute of the calendar.

**Note:** This rerenders the calendar

## ___toggleDateOn___(dateObjToToggle, [append])

Sets the day corresponding to the given Date object as chosen. Depending on what is given for the append parameter, this either overrides the current chosen dates if append is falsy/not given, or adds to the list of chosen dates, if append is truthy. 

Also updates the `chosen` attribute of the calendar.

**Note:** This rerenders the calendar

## ___toggleDateOff___(dateObjToToggle)

Removes the given date from the calendar's list of chosen dates. 

Also updates the 'chosen' attribute of the calendar.

**Note:** This rerenders the calendar

## ___toggleDate___(dateObjToToggle, [appendIfAdd])

Alternates the chosen status of the given date. Takes an 'appendIfAdded' parameter to determine how the new date replaces existing chosen dates if it is toggled to on. 

Also updates the 'chosen' attribute of the calendar.

**Note:** This rerenders the calendar

## ___hasVisibleDate___(dateToCheck, [excludeBadMonths])

Determines whether or not the given date is in the visible calendar display of dates. Optionally ignores dates outside of the span of fully-visible months.


# Events

## ___datetoggleon___

Fired when the UI sets a day as chosen. (ie: 'turns on' a date)

The event also receives the following custom datamap in `e.detail`:

    {
        'date': the Date object corresponding to the toggled date,
        'iso': the ISO-formatted string representing the toggled date
    }

## ___datetoggleoff___

Fired when the UI sets a day as unchosen. (ie: 'turns off' a date)

The event also receives the following custom datamap in `e.detail`:

    {
        'date': the Date object corresponding to the toggled date,
        'iso': the ISO-formatted string representing the toggled date
    }

## ___datetap___

Fired when the user taps a day without dragging/painting over other dates.

The event also receives the following custom datamap in `e.detail`:

    {
        'date': the Date object corresponding to the toggled date,
        'iso': the ISO-formatted string representing the toggled date
    }

## ___prevMonth___

Fired whenever the user navigates backward one month

## ___nextMonth___

Fired whenever the user navigates forward one month


# Styling

- To style the calendar's container, apply styles to `x-calendar`.
- To style the month label, apply styles to `x-calendar .month-label`.
- To style individual months, apply styles to `x-calendar .month`.
  - Note: to change how wide months are, apply the style here, as the width of days and weeks are percentages in relation to this width
- To style individual weeks, apply styles to `x-calendar .week`.
- To style individual days, apply styles to `x-calendar .day`.
- To style the row of weekday labels, apply styles to `x-calendar .weekday-labels`.
- To style individual weekday labels, apply styles to `x-calendar .weekday-label`.
- To style the current day, apply styles to `x-calendar .day.today`.
- To style days that are not in the current month, apply styles to `x-calendar .day.badmonth`
- To style chosen days, apply styles to `x-calendar .day.chosen`
- To style the previous and next navigation control buttons, apply styles to `x-calendar .prev` and `x-calendar .next`.
- To style how elements appear when the calendar is being dragged on, use the `x-calendar[active]` selector.
    - Similarly, to style the day that is being hovered over during a drag, use `x-calendar[active] .day[active]`

(See [demo/index.html](demo/index.html) for an example of applying custom styles.)


## Misc

Note that when the calendar is rerendered in a manner that would require changing the displayed dates, such as when the span changes or the view switches months, the calendar's elements are repainted. This interrupts the event propagation chain of events fired on these repainted nodes, so be careful of full re-renders when attaching event handlers to individual nodes instead of the x-calendar itself.