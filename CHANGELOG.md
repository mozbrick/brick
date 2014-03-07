# 1.0.1 (TBD)

* Removed `grunt build-dev` task
* Added `--dev` option to all grunt tasks that build sections of Brick [site,demos,downloadpage,homepage,build].  This allows Brick to be built from ./dev-repos/ instead of ./bower_components/.

# 1.0.0 (2014-03-04)

We've gone stable!

* Thanks to everyone who helped find bugs in our pre-release versions.
* Individual component versions are frozen in our release branches.
* Stay tuned for lots more components!

[See all the commits in this release](https://github.com/mozilla/brick/compare/https://github.com/mozilla/brick/compare/1.0.0rc1...1.0.0)

# 1.0.0rc1 (2014-02-14)

* So close we can taste it now! Test out what might just be Brick's 1.0 stable release!
* Shipping sometimes means cutting scope. Pulled slidebox and tooltip from our launch roster. Slidebox may have been made redundant by deck, but tooltip will be back better than ever!
* Component docs now have information about the individual repositories.

[See all the commits in this release](https://github.com/mozilla/brick/compare/https://github.com/mozilla/brick/compare/0.10.0...1.0.0rc1)


# 0.10.0 (2014-01-30)

* New snazzy default skin!

[See all the commits in this release](https://github.com/mozilla/brick/compare/0.9.2...0.10.0)

# 0.9.2 (2013-11-14)

* Updated X-tag/core to 0.8.20 that contained a few fixes.

# 0.9.1 (2013-11-14)

* We've removed some tags from the Brick lineup. Namely, `togglegroup`, `datepicker`, and `iconbutton`. They may return post-1.0, but we want to re-evaluate their usability and code, and we don't want to remove components once we've reached a stable major version. Apologies if you were using them, if you need the JS/CSS for them let us know, we can provide the compiled files.

# 0.9.0 (2013-11-13)

* Moving away from our poorly thought-out versioning to a more sane versioning. 1.0.0-beta8 graduates to 0.9.0.
* Fixed bug in Calendar with month rendering.
* Updated x-tag-core for extra bug fixes and removal of CSP-breaking polyfill code

# 1.0beta7 (Sep 2, 2013)

* patched critical issue with calendar dates breaking during the transition between certain months

# 1.0beta6 (Aug 26, 2013)

* Updated x-tag core library to fix Safari/iOS support. Yay!

# 1.0beta5 (Aug 22, 2013)

* Changing default settings of tooltip's trigger-style attribute
* Changed tooltip's no-overflow property to allow-overflow
* Tooltips now constrain to stay in window viewport
* Tooltips now properly follow around fixed positioning elements
* Deck and flipbox animations made IE10 compatible and degrade gracefully in IE9

# 1.0.4beta (Aug 18, 2013)

* Nothing major, just updating the base x-tag core library

# 1.0.3beta (Aug 18, 2013)

* Fix timezone issue causing broken calendars/datepickers for non-US regions
* Fix layout flexbox issue with height 100% children of flex items not displaying correctly
* Include missing font files in release bundle
* Link x-tag to core library

# 1.0.2beta (Aug 16, 2013)

* replace while loops in x-calendar with for loop to hotfix critical infinite loop issue; still need to track down underlying issue with non-US dateformats acting strangely

# 1.0.1beta (Aug 13, 2013)

* Add cardadd/cardremove events to x-deck api
* Optimize x-deck's css to reduce duplication of transforms
* Fix x-layout CSS flexbox issue with content not shrinking in older browsers (like FF18)
* Sped up default flipbox animation
* Fix slidebox graphical bug caused by changing orientation while viewing a slide other than the first slide

# 1.0beta (Aug 8, 2013)

* Initial release
