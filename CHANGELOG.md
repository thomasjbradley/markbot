# Changelog

This file documents all the notable changes for each version of Markbot.
Markbot adheres to [Semantic Versioning](http://semver.org/).

---

### Fixed

- Fixed a bug where Markbot for enforcing `id` attributes onto `<input>` tags that were `hidden`

---

## [7.7.0] — 2018-02-24

### Added

- Added a new template for Modulifier icons.

### Fixed

- Finally fixed the rounded corners on the top of the window by using `border-radius`

---

## [7.6.2] — 2018-02-16

### Added

- More new commit message starting imperative verbs.

### Changed

- Updated a bunch of application dependencies.
- Made some changes to the app quitting—when the main window is closed the app quits. It’s not what I ideally want but I can figure out the MacOS-like way.
- Changed the build process to remove MacOS extended attributes files from within the folder.

### Fixed

- Prevented the folder name from overflowing when it is really long.
- Added the missing “Exit” menu item on Windows.
- Fixed the path stripping method on Windows to better support finding files & folders.

---

## [7.6.1] — 2018-02-06

### Fixed

- Markbot will now allow empty lines before custom properties to allow for organization.
- Fixed a bug when the CSS contained only `:root` an error message was displayed.
- Fix a bug when the `files.directory` option is used and the directory was empty Markbot would never finish loading.

---

## [7.6.0] — 2018-02-04

### Added

- Added a new template for when not using the grid system.

### Changed

- Removed the requirement for the button modifier class in the Modulifier template.

### Fixed

- When the functionality testing `noErrors` option was used an error message was triggered because Markbot was still trying to run and empty array of tests.

---

## [7.5.0] — 2018-01-28

### Added

- Added a new template for working with Patternbot.

### Changed

- Made some small compatibility adjustments to better work with Patternbot.

### Fixed

- Fixed a bug in the MarkbotIgnoreFile matching system where the file paths weren’t restricted to the beginning of paths and would match inside any directory.

---

## [7.4.4] — 2018-01-23

### Added

- Added more verbs to the allowed commit starting words whitelist.

### Changed

- Make the unrestricted modular CSS templates even more open.
- Update some dependencies. Especially Electron to fix the security problem.

### Fixed

- Removed the extraneous bullet point and text when no elements are shown in the accessibility related elements list.

---

## [7.4.3] — 2018-01-11

### Added

- Added more verbs to the allowed commit starting words whitelist.

### Changed

- Removed the “descendent-selectors” rule from Stylelint because it causes more problems than necessary.

### Fixed

- Added a rule ignore for the CSS `::selection` selector.
- SVG image dimension checking will now attempt to ignore SVG spritesheets by checking to see if the only child elements are `<symbol>` tags.
- Attempted to clarify some of the ARIA role error messages.
- Fixed external links within warning messages because they weren’t opening in the external browser.

---

## [7.4.2] — 2018-01-05

### Changed

- Updated a whole bunch of dependencies, specifically for the [Stylelint patch for media queries](https://github.com/stylelint/stylelint/pull/3011).
- Changed the max number of class selectors to 3 to support my example toggle navigation.

---

## [7.4.1] — 2018-01-04

### Added

- Added some more words to the dictionary.
- Added more verbs to the allowed commit words whitelist.

### Fixed

- Added some major performance improvements when there are many functionality tests running by queuing the tests.

---

## [7.4.0] — 2017-11-20

### Added

- Added a new template for checking to make sure the standard `.img-flex` class exists.
- Added another new template to confirm `modules.css` comes before `main.css`
- Added new templates for checking the focus state of navigation links and main body content links.
- Added the ability to confirm the dimensions of `favicon.ico` files—always forcing both `16` and `32` pixels sizes—and a template for checking favicon best practices.
- Added the ability to confirm the dimensions of `.svg` files.
- Added the ability to define a minimum percentage for each screenshot with a new screenshot object syntax.
- Fancified the submission checkmark graphic to make it a little more user friendly.
- Added some fun little stats to the success screen: start, end and completion times & number of commits.
- A template for checking basic SEO recommendations.
- Added more checks to the responsive CSS template & create a template for checking responsive font sizes.
- Added a new template named `border-box` that is exactly the same as `box-sizing` because I can never remember the `box-sizing` name.
- Added unrestricted Web Dev Tools templates to allow students to choose their own settings.
- A 404 and 500 error page for the internal server.

### Changed

- Added another check to the Google Fonts template to confirm there aren’t multiple `<link>` tags.
- Clarified an accessibility error message in the accessibility template.
- Add the `accessibility` & `outline` properties to `allFiles.html` inside the accessibility template for convenience.
- Changed the `html-good-semantics` template to not enforce a `<ul>` for navigation so an `<ol>` is also acceptable.
- Changed all instances of `localhost` to `127.0.0.1` to help alleviate incorrectly configured `/etc/hosts` files that are missing the `localhost` loopback.
- Adjusted the HTTPS certificate creation to put the domains into the `subjectAltName` field instead of the `CN` field.
- Switched to a white list of commit verbs to be more strict on commit message conventions.
- Relaxed the requirements for running Markbot tests to allow just files or functionality or performance tests too.
- Added checks for `@import` and `@charset` to CSS to avoid their use.
- Updated a bunch of dependencies to their newest versions.
- When no MarkbotFile is found a warning is emitted with details instead of showing a green all-clear check.
- Upgraded to the most recent version of Electron.

### Fixed

- Fixed a bug when the `before` method of a screenshot had an error Markbot would just hang and wait.
- Fixed a bug when the test code takes too long to run—there’s now a time limit before a failure is executed.
- Fixed a small bug in one of the templates: the `has` property was missing.
- Fixed a bug in the `allFiles.functionality` tests where only the last functionality test was actually run, causing the requirements to be easier than they should be.
- Fixed a bug when Markbot isn’t running and a folder is dropped onto the Dock icon—it wouldn’t load the project properly.
- Fixed a bug where the CSS validator wouldn’t run when there were invalid characters in the path—it now just stops and alerts the student to the problem.
- Fixed a bug where text files would throw an error when they weren’t smushed even if the property was missing from the MarkbotFile.
- When the `files` MarkbotFile property is empty an error message is now thrown.
- Fixed a bug in the `files.directory` property where the directory was discarded when the MarkbotFile was generated.
- Fixed the performance testing to properly test multiple files one at a time.

### Removed

- Removed the dependency logging because it wasn’t helping anything.

---

## [7.3.1] — 2017-10-15

### Changed

- Fixed some confusing grammar in the functionality error tests.
- Added another word to the dictionary.
- All CSS animations are now paused in the browser window until the screenshot or the functionality test is ready to execute.
- Changed the “nav-hover” template so that it doesn’t choose the `.current` `<a>` tag to check for hovering.

### Fixed

- Added back in a Windows full-quit check that accidentally got removed with I was debugging a Mac quitting problem.

---

## [7.3.0] — 2017-10-08

### Added

- Allow screenshot tests to enable animations & transitions with the `allowAnimations` option.
- Added a datetime to the end of the request URL for live website checking to see if it becomes a little more reliable.
- Added a template that checks images for `block` and `width: 100%`
- Added a template for checking button hovering with the `.btn` class—it’s very similar to the Modulifier button hover without the requirement of a modifier class.

### Changed

- Added some more words to the spelling dictionary.
- Added labels to all the template functionality tests.
- Improved the shutdown procedure a little bit.

### Fixed

- Added some path-fixing code because on some MacOS environments the `$PATH` variable wasn’t inheriting into Electron.
- Fixed a bug where after an alert was shown the toolbar wasn’t re-enabling.
- Added better error handling for corrupt and improperly formated images.

---

## [7.2.1] — 2017-09-28

### Changed

- Added a `User-Agent` to the live website check, and internally to HTML validation and Git commit best practices checks.

### Fixed

- Fixed a bug in the HTML validator where it wouldn’t run if there were spaces in filenames.
- Added some detections and logging for different possible errors Git may show, like `license` and not in `$PATH`

---

## [7.2.0] — 2017-09-26

### Added

- There’s a new `activate` function for functionality tests that will trigger the CSS `:active` state.
- Screenshots can now execute some Javascript before capturing using the new `before` property.
- Screenshot groups can now be labeled using the new `label` property, similar to functionality.
- Text files, including SVG graphics, can now be checked if they are smushed, essentially just checks for line breaks.
- The four new font-sizes to the Typografier checker.
- Replaced the default `alert()` with a custom one that has the ability to restart the application.
- Allow functionality tests to now provide a `test` (singular) string that will function properly.
- Allow `hover()` & `activate()` to accept already selected DOM elements instead of just a CSS selector.

### Changed

- Changed the toolbar drag ability so it can’t be dragged when clicking the buttons.
- Ignore the `clip-path: inset` CSS validation error messages.
- Successful checks can now also be clicked in the check list when they have a matching element to focus.
- If the functionality `tests` property isn’t an array it’ll be converted to one.

### Fixed

- Screenshots and functionality tests of the same path are not merged together any more—it was originally this way.
- Fixed a bug where the checks wouldn’t be bypassed properly when the file didn’t exist.
- Fixed a bug in the missing optional tag checking where it would actually ignore missing optional tags.
- Markbot will now display MarkbotFile errors in the Activity window for easier debugging.
- There’s better error handling if the background servers crash while Markbot is still open.

---

## [7.1.0] — 2017-09-18

### Added

- The ability to display an error when a file exists and it shouldn’t.

### Changed

- The error messages created by Typografier for `margin` & `padding` have been down-graded to warnings.
- Updated the links for the Command Line Tools & Java installations to match the new unique tutorials.
- When a file is `locked` no other tests will be run.
- Switched to another Git state checking library that’s more up-to-date and compatible with Windows.

### Fixed

- The Markbot file generator wasn’t combining duplicate files properly, some were being skipped because of the way the code ran.
- There were errors being thrown when the WebLoader was trying load the page initially.
- When multiple hover functionality tests were activated they didn’t work properly because the previous hover would still be active—the mouse position is reset before each functionality test now.

---

## [7.0.2] — 2017-09-09

### Changed

- Added `gh-pages` to the list of words ignored by the dictionary.
- The toolbar design for Windows to more closely match the OS.

### Fixed

- When you signed-out of the Markbot interface it got stuck on the start-up screen.
- A bug in the start-up when detecting if the browser has started on Windows.

---

## [7.0.1] — 2017-01-05

### Changed

- Modified some of the error messages to match the language used in the new GitHub application.
- Added “Starting up…” to the start-up screen for a little better on-boarding.

---

## [7.0.0] — 2017-01-01

### Added

- A new screenshots template for only 320 size.
- A new template for testing the hover state of navigation.
- A new template for checking common HTML semantic tags exist.
- A couple new templates for checking specific Modulifier classes.
- Some error messages now show links to cheat sheets and checklists on Learn the Web.

### Changed

- [**Backwards incompatible**] The cheat detection system was getting bungled when the templates changed, now only the original `.markbot.yml` is locked, not the template-parsed version.
- Removed the `text-align` restriction when using Typografier to allow for responsive alignments.
- Offscreen elements that should be hovered with functionality tests are now made visible with `scrollIntoView()` instead of resizing the browser window.
- Upgraded some dependencies.
- The positive accessibility message now only shows if they get grade better than 75%.

### Fixed

- The accessibility tests are now run on the full `document` instead of just `body`.
- Some accessibility errors messages have been clarified or ignored as appropriate.
- The `allFiles.functionality` tests weren’t merging properly causing the tests to hang.
- Attempted again to fix the font display issues before screenshots are taken by listening for a secondary font load event.

---

## [6.0.0] — 2017-08-16

### Added

- Accessibility testing using a bunch of built-in template checks and the axe-core library.
- Git commit message best practice checking, including spelling, grammar, length & proper tense.
- Dependency checking on startup, specifically checks for Git command line & Java Development Kit.
- A warning message system that doesn’t impede handing homework in but gives “tips for next time”.
- Error messages can now output with sub-lists.
- An “underline” style for displayed messages.
- A “big-number” style for displayed messages.
- For `html.has` and `*.search` there’s now a `limit` option to disallow repetition of specific content.
- Spaces before and after attribute equals signs are now called out as separate, more descriptive error messages.

### Changed

- [**Backwards incompatible**] The Markbot file template `inherit` system now supports inheriting from multiple templates to make it more usable.
- A check can now output errors, messages & warnings all at the same time.
- Upgraded the HTML & CSS validators.
- Upgraded a bunch of dependencies.
- The HTML validator now starts up when Markbot starts to make validation much faster: one initialization time instead of one of each HTML file.
- The web server now starts immediately instead of on demand when a file is dropped.
- The `has/Not` & `search/Not` checks can now emit warnings with a new object syntax for each entry. Remains backwards compatible with the old array syntax, but warnings must use the new object syntax.
- More error messages now display line numbers when available.
- Improved the `debug()` function’s ability to better handle different types.
- Functionality tests are now wrapped in a function so they can `return` to short-circuit themselves.
- The `outline` test now outputs the heading structure as a visible outline.

### Fixed

- [**Backwards incompatible**] The `.markbotignore` file is now taken into account when checking for cheating, it’s locked & compared.

---

## [5.10.0] — 2017-04-16

### Added

- Add a new `offset()` function for functionality testing that will calculate the offset to the top of the page.
- The `on()` function for testing now also accepts a pre-selected DOM element as it’s first argument.
- HTML, CSS & JS files tests can now include a `maxLines` option to confirm the code is shorter than a certain number of lines.
- Functionality tests can now have an optional `label` which Markbot will use to display next to the filename in the checks list.

### Changed

- There’s a lot more error catching in the functionality tests to be more helpful and show more error messages in the “Activity” window.

### Fixed

- Fixed a small bug when there were empty tags, Markbot would force them onto separate lines which isn’t necessary.

---

## [5.9.0] — 2017-04-14

### Added

- Shortcut keys and menu items to focus different regions of the Markbot window.

### Changed

- Some more keyboard navigation & accessibility improvements, including improved focus states.
- Refactored some of the menu-driven code for simplicity.
- Refactored some of the task completion & initialization logic for more reliability.

### Fixed

- A bug where the “Open Repository” menu item wouldn’t work when there was no window.
- A bug where the menu items weren’t disabled when the main window was closed.
- Fixed a bug where if you held `Command/Ctrl` when clicking the check list links it would confusingly open a new instance of the Markbot window.
- Fixed a bug where if the `.markbot.lock` file was missing locked files would get positively matched as “Unchanged”.
- Fixed a bug where tasks were sometimes triggering their completion more than once, causing other tasks to never trigger completion.

---

## [5.8.0] — 2017-04-12

### Added

- Functionality tests can now specify a `setup` option that will be injected into the page before it loads—it’s helpful for overwriting `prompt()` to pass fake data.
- A debugging toggle menu item to help debugging built versions of Markbot.

### Changed

- Added a few small accessibility improvements related to keyboard navigation.

### Fixed

- Fixed a huge security hole when testing websites because of `nodeIntegration` being turned on. If the user’s website had downloaded a compromised Javascript file that used Node.js functionality it could completely control the user’s computer. `nodeIntegration` is now off in testing windows & Markbot encapsulates Node.js required functionality into private methods.
- The error messages for Javascript errors are cleaned up for when pieces of information are missing.
- Stopped the GitHub-related buttons from enabling when they shouldn’t be.

---

## [5.7.0] — 2017-03-30

### Added

- Added a “Submit Assignment” entry to the “File” menu.

### Changed

- Updated some cursors for when things are loading and added more `pointer-events: none` entries.
- The submit button now says “Submitting…” when it’s contact the server and loading.

---

## [5.6.4] — 2017-03-28

### Fixed

- Fixed the broken scrolling in the debug window caused by the previous fixed.

---

## [5.6.3] — 2017-03-28

### Fixed

- Stopped the interface from scrolling when on the drop-a-folder screen.

---

## [5.6.2] — 2017-03-28

### Fixed

- The submit button became enabled when there was nowhere to submit to, no `canvasCourse` entry.

---

## [5.6.1] — 2017-03-28

### Changed

- Added a small robot illustration to the start screen to differentiate Markbot from the other Toolbots.
- A few small visual design tweaks.

---

## [5.6.0] — 2017-03-27

### Added

- The ability to pop the code open in Atom.
- The ability to pop the repository open on GitHub’s website.

### Changed

- Completely revamped the interface to be more MacOS-like and more refined—including a new toolbar with buttons & a status display.

### Fixed

- A bug with the Markbot file `files` entry when listing a directory and there is no `.markbotignore` file.

---

## [5.5.4] — 2017-03-20

### Fixed

- Updated the version of Markdownlint to fix a bug with trailing spaces & front matter.

---

## [5.5.3] — 2017-03-13

### Fixed

- Fixed a bug in the closing `</p>` tag checking for when there isn’t a matched closing `</p>` tag and improved the paragraph indenting algorithm.

---

## [5.5.2] — 2017-03-06

### Changed

- Increased the compound selector limitation to 4 to allow more complex selectors for forms & error messages.
- The paragraph closing tag checking is a little more forgiving, especially when there are tags inside the `<p>`.

### Fixed

- Markdown Lint was not enforcing spaces after list markers (partial fix).
- Allow CSS4 form element pseudo-classes: `:required`, `:valid`, `:invalid`, etc.

---

## [5.5.1] — 2017-02-13

### Changed

- Removed the restriction on `font-weight` numbers—it was too strict.

---

## [5.5.0] — 2017-02-11

### Added

- Support for Markdown validation & with the `md` entry.
- Support for YAML validation & checking with the `yml` entry.

### Changed

- Changed the “Unexpected indentation” message to say “Unexpected spacing or indentation” to be slightly more descriptive.

---

## [5.4.2] — 2017-02-05

### Fixed

- The naming conventions checking wasn’t using the `.markbotignore` file causing some unnecessary naming convention errors.

---

## [5.4.1] — 2017-02-05

### Fixed

- A bug when using Markbot without a `.markbot.yml` file and no files of a specific extension (e.g. `.js`) were found.

---

## [5.4.0] — 2017-02-05

### Added

- CSS variable error ignoring because they aren’t part of the validator yet.
- The ability to specify a `.markbotignore` file that will make Markbot ignore files and folders.

### Changed

- Removed the `DEBUG` config option in `package.json` and replaced it with a new script: `npm start debug`
- More descriptive error message for the CSS validation errors including selectors & code snippets if available.

### Fixed

- The port finder & web server now work properly together and everything that uses the web server now gets the correct port.

---

## [5.3.0] — 2016-01-21

### Added

- Added a `bounds()` function to the functionality tests that is just a shortcut to `getBoundingClientRect()`.
- Shortcut keys for browsing the website with the web server and on GitHub.

### Changed

- Removed the `aria-describedat` error ignoring because ARIA 1.1 replaced the attribute with `aria-details`.
- Removed the `Cache-Control` and `Last-Modified` headers from the web server requests—it was interfering with using the web server as testing & I don’t think (though could use more testing) that it affects the performance metrics.
- The localhost server now uses PortFinder to find an open port and the port cannot be configured in `package.json` any more.

### Fixed

- Dragging to the Markbot icon in the dock didn’t work if there was already a visible window.

---

## [5.2.4] — 2016-12-12

### Fixed

- The live website link in the positive messages opened within Markbot instead of the default browser.

---

## [5.2.3] — 2016-12-09

### Fixed

- The `hover()` functionality test failed when the element to be hovered wasn’t visible—Markbot will now resize the hidden window to be sure the element is visible before hovering.

---

## [5.2.2] — 2016-12-08

### Changed

- Removed the `no-descending-specificity` Stylelint rule because it was causing too many, and weird problems for the students.

---

## [5.2.1] — 2016-12-05

### Changed

- The way Markbot checks to see if it’s done or has errors is now completely dependent upon the list of checks on the left. Markbot used to use a boolean to try and track now it just runs through the list of checks and looks at the status of each.

### Fixed

- The performance tests weren’t running because the unpacking mechanism wasn’t working properly creating a broken `node_modules` folder. There was an updated to `electron-builder` that needed to be installed.

---

## [5.2.0] — 2016-12-04

### Added

- The live website checking will show the URL when the website is online—encouraging students to check it out on their mobile devices.

### Changed

- Upgraded some dependencies to new versions.
- The titlebar for the screenshot comparison window now shows the width of the screenshot.

### Fixed

- On Windows the Markbot background processes were never quitting.
- A Windows bug where the tasks weren’t executing because the paths were being escaped incorrectly.

---

## [5.1.0] — 2016-11-29

### Added

- Added a single-run process to the task queue—some students were having performance checking problems because of Markbot’s other tasks running concurrently.

### Changed

- Move the `DEBUG` & the `serverPort` settings into the `package.json` file for simpler editing.
- Rewrote the `require()` statements to better work off the main process.
- Rewrote how the `markbot-main` module finds the main window to be more reliable.

### Fixed

- Fixed a bug in the screenshots where it didn’t tally which screenshots were completed properly.
- Added back the `asar` packing for the application.
- An error message being displayed when the main window is closed and a folder is dropped to the dock icon.

---

## [5.0.4] — 2016-11-27

### Fixed

- Ignore validation errors related to `aria-describedat`

---

## [5.0.3] — 2016-11-22

### Fixed

- Fixed a bug where the done checking interval wasn’t actually placed into a variable—therefore it was never cleared.

---

## [5.0.2] — 2016-11-21

### Changed

- Made the missing file error message for screenshots more descriptive.

### Fixed

- The web server wasn’t starting on Windows—I didn’t realize (for some reason) `openssl` was a dependency. I’ve now replaced it with a static key/cert pair.
- Added a kludgy work around for Markbot not triggering its done state.
- Now the performance metrics don’t show that the website passed the performance budget when the website cannot be loaded.

---

## [5.0.1] — 2016-11-20

### Changed

- Disabled `asar` compression for the application—it was significantly slowing performance testing, by about 300ms. I’d love to be able to turn it back on in the future.

---

## [5.0.0] — 2016-11-20

### Added

- The network used to test the performance of the website is output to the activity window.
- A new network setting that’s half way between WIFI and 4G called WIFI-REGULAR.
- The ability to control the maximum number of fonts for the website with the performance budget.
- The ability to have custom error messages in `has` & `hasNot` CSS options.
- The ability to detect if a media query exists without looking for properties inside.

### Changed

- Tried to improve performance scores by introducing `max-age` and compression. Had to rewrite the whole web server layer.
- The `<iframe>` tag is no longer required to be on separate lines.
- Removed `listener` from being passed around and converted it into a module that can be required.
- Completely rewrote the task queuing system to include a pool of task runners and queuing.
- Renamed a bunch of files because they were niggling me.
- The diff window is now automatically closed when Markbot is refreshed.

### Fixed

- The performance budget default template was getting merged with the users settings permanently.
- A bug in the diff window that prevented the split from touching the right edge.
- A bug in the diff window where it wasn’t always resized to the correct width to match the screenshot.
- The files checker will now throw an error if the `directory` options points to a location that doesn’t exist.

---

## [4.4.0] — 2016-11-13

### Added

- Image dimensions `minWidth` and `minHeight` can now be checked.
- A directory can now be parsed by the `files` directive, relying on the settings of `allFiles`.

### Changed

- Removed “ImageOptim” from the error message to make the error messages slightly more opaque.
- There’s now a timeout of `50ms` on events in the interaction testing—it was consistently firing too early, even with the `requestAnimationFrame` slowdowns.
- Extracted the directory listing & ignorable file list into their own modules.
- Changed the naming conventions check to use the new directory listing module.

### Fixed

- Remove the “Best practices, outlines… not checked” error when HTML files are locked.
- Markbot will now fail with an error when performing a `hover` functionality test and the element’s height or width is `0`.

---

## [4.3.0] — 2016-11-09

### Added

- A HAR is now generated for each page load so performance testing can be completed. This also adds a little more time to wait for the screen to fully render before triggering screenshots.
- A static web server & web loader is introduced to help with loading websites & emulating different network conditions — `https://localhost:8080`.
- Performance testing for HTML files using [The coach](https://github.com/sitespeedio/coach/), including support for performance budgets.
- File & image checking: file sizes & emptiness, search inside text files, image smushing & dimensions.

### Changed

- Added more asyncronization to the browser window loading to help get the Google Fonts shown on the screen before the screenshots are taken.
- Screenshots & functionality tests are now loaded through a web server.
- Change `has_not` and `search_not` to use camel case: `hasNot` and `searchNot` for consistency—maintaining backwards compatibility.
- The loading gears message is now randomized for more funness.
- The big green check now bounces when submitted to Canvas for ultimate levels of fun.

### Fixed

- When trying to debug functionality tests, if types other than string were sent, an error was thrown. Markbot is a little more forgiving and will accept more types to debug now.
- A memory leak with too many `__markbot-hidden-browser-window-loaded` events being bound in the screenshot checking.

---

## [4.2.3] — 2016-10-23

### Changed

- Removed the `no-indistinguishable-colors` Stylelint rule—it was causing problems.

### Fixed

- Markbot now supports `<pre>`, `<code>` and `<textarea>` tags properly by ignoring indentation within the tags.
- An unexpected indentation error was thrown when there was a space before a closing `>` in a tag, like: `<h1 >`—this is now caught by Markbot, showing a more descriptive error message.

---

## [4.2.2] — 2016-10-18

### Changed

- Screenshots comparisons—if the tests pass—are still shown even when there are errors. Some students wanted to be able to get better screenshot results without having to constantly commit and sync.
- Clarified the live website error message to include a hint about capitalization on the GitHub servers.

### Fixed

- Updated dependencies, especially Stylelint, to new versions to handle more CSS.
- Markbot will now ignore `touch-action` and `appearance` related CSS errors.
- The screenshots were sometimes taken before the web fonts finished downloading—Markbot waits for the `document.fonts.ready()` event.
- The window flashed white on load because the page wasn’t loaded yet—fix with the `ready-to-show` event.
- Fix a bug in the cheat logging when one of the hashes was missing.
- Added more load checks for screenshots & functionality tests to help prevent incomplete loading issues.

---

## [4.2.1] — 2016-10-14

### Fixed

- A bug in the cheat detection when HTML, CSS & JS files were changed, the interface still sometimes registered them as being unchanged.

---

## [4.2.0] — 2016-09-27

### Added

- When Markbot detects cheating the error message is more detailed, including the names of the files and their hashes.
- The debug window now allows outputting `code` blocks with the backtick syntax.

### Changed

- The validation Java paths are now output as code blocks in the activity window for consistency.

### Fixed

- Text within the Activity window can now be selected.

---

## [4.1.2] — 2016-09-26

### Fixed

- The restricted file types search was looking inside `.git` folders and sometimes finding bad files.
- When a single file is dropped to Markbot an alert is now shown and Markbot stops.
- When a folder is dropped that has no HTML, CSS or Javascript files Markbot will reset and show an alert.

---

## [4.1.1] — 2016-09-22

### Changed

- Upgraded to a newer version of the CSS validator that better supports `calc()`, `attr()` and SVG properties—removing a bunch of hacky work arounds.

### Fixed

- A CSS validator parse error bug when there was a extra closing brace at the bottom of the file.

---

## [4.1.0] — 2016-09-19

### Added

- A folder can now be dragged and dropped to the dock icon and MacOS will handle it.

---

## [4.0.1] — 2016-09-19

### Fixed

- Restored the ability to drag and move the window.
- Prevented the window from scrolling horizontally when there are long code samples.

---

## [4.0.0] — 2016-09-07

### Changed

- Updated to the newer Electron build process.
- Simplified maintenance on Canvas IDs by removing them from the `.markbot.yml` file and moving them into Canvas itself.

---

## [3.6.1] — 2016-08-30

### Changed

- Update all the dependencies

### Fixed

- Fixed a bug in the Markbot file `inherit` property where it didn’t seem to be inheriting in some situations.
- When HTML files are missing the unique content checker was still trying to run—hanging the process and never finishing.

---

## [3.6.0] — 2016-04-27

### Added

- Added double+ space checking within lines to help prevent confusing “unexpected indentation” errors.

---

## [3.5.2] — 2016-04-21

### Changed

- Relaxed the file restrictions in the `restrictFileTypes` option.

### Fixed

- If the mouse move coordinates are negative in the hover test they are now set to 0—negative mouse coordinates do nothing.

---

## [3.5.1] — 2016-04-18

### Fixed

- Fixed the functionality `hover()` tests that weren’t always returning properly for two reasons: if using a toggle nav, the testing screen width was too narrow; and transitions.

---

## [3.5.0] — 2016-04-17

### Added

- Any folder can be dropped into Markbot and it will search for HTML, CSS & JS files to test.
- An `allFiles` entry for Markbot files that will share settings between all files of the same type.
- An `inherit` entry for Markbot files so they can extend embedded templates.
- A set of restricted file types that can be included with the `restrictFileTypes` option.
- A `unique` search ability which will confirm that tag text, or an attribute on a tag, is different for every HTML file—like unique `<title>` tags.

### Changed

- Updated the configuration for Stylelint to better handle multi-line CSS values.

### Fixed

- The scrollbar doesn’t go under the top gradient for the checks panel now.
- Better support for void SVG tags.
- If CSS checks without media queries came after media queries their error messages would show them as being inside media queries.
- When the HTML & CSS `valid` option isn’t present but other options that require it are Markbot will bypass the checks.

---

## [3.4.0] — 2016-04-12

### Added

- Ability to search within media queries for the CSS `has` and `has_not` checks.

### Fixed

- The filename inside of functionality errors wasn’t highlighted like other files.
- The positive messages & completed check sometimes showed prematurely—added a 100ms timeout that clears regularly.
- Added some error checking the HTML element matching for when there’s a problem in the Markbot file.

---

## [3.3.1] — 2016-04-07

### Fixed

- When a folder wasn’t a Git repository the sync and commit checks were still getting green, even with error messages.

---

## [3.3.0] — 2016-04-07

### Added

- Added a `hover()` function for functionality testing to see if elements change when hovered.
- More status checking for Git & GitHub, including outstanding commits and pushes.
- A functionality test to confirm there are now errors in the Javascript: `noErrors`.
- HTML document heading outline order verification.
- Some checks for `viewport` best practices: no maximum zoom, no disabling of user zooming.
- An “Activity” window that shows the same information as console, but with clickable links and clearer for students.

### Changed

- Refactored the functionality testing code to match how the new screenshot code runs.
- Clarified the live website error message.
- Groups are now tagged with the time to prevent quick refreshes & older check interference.
- The background of the diff window is now a transparency grid instead of white.
- Cleaned up error messages so code samples are highlighted instead of using Markdown-like backticks.
- Live website links are now clickable and open in a browser window.

---

## [3.2.0] — 2016-03-31

### Added

- Added an `on()` function for functionality tests to help prevent listener timing issues. The `on()` function has the benefit of a timeout for listeners.

### Changed

- Moved to the spread operator for debug statements.
- Functionality tests are now executed with `exec()` to help debugging and catch syntax errors.

### Fixed

- Completely rewrote and refactored the screenshot system to be based off events and message passing (as it should have been from the start) to fix a bunch of timing bugs.
- Fixed the differ screen for when the student’s screen shot was longer than the reference one: previously it was cropped.

---

## [3.1.1] — 2016-03-28

### Fixed

- The live website testing didn’t work with capital letters in GitHub usernames.

---

## [3.1.0] — 2016-03-27

### Added

- When the screenshots are successfully matched and there are no error messages, the screenshot differences show with a positive message.
- Javascript integration testing: whereby code can be run against a page with pass/fail tests & custom error messages.
- The live website can now be tested, using the repo’s GitHub URL and the student’s username.

### Changed

- The screenshot difference percentage is now calculated based on the area of the image. This change was made to allow larger screenshots to be a little more strict—students were getting away with too much on big screenshots.
- Made the screenshot status pills go into computing/yellow mode earlier to better perception of speed.

### Fixed

- The menu items that linked to websites had an `undefined` in them because of code I reordered.
- On Windows and older MacOS X, the checks list is now closer to the top because space for the traffic light buttons isn’t necessary.
- When the file to lock isn’t found a more descriptive error message is shown.
- When the Git repo has no commits or it’s not a repo Markbot shows an error message.

---

## [3.0.0] — 2016-03-22

### Added

- File lock hashes can now be generated for the Markbot file, any files marked as `locked: true`, and the screenshots.
- Markbot will now detect if the student cheated by changing the Markbot file, the screenshots, or the locked code files—this information is passed to Markbot Server.
- A signature is now sent to Markbot Server to confirm the URL wasn’t hacked.

### Fixed

- Fixed another HTML validation related bug on Windows.

---

## [2.10.0] — 2016-03-21

### Added

- The ability to search the documents for content that shouldn’t exist, `search_not`.
- The `search` and `search_not` entries can now accept an array, where the second item is a custom error message.
- The `has` & `has_not` properties for `html` can now have custom error messages.
- Added a “Help” menu with links to the license, issues, the version on Windows & a link to the GitHub Issues page for the current assignment.
- Added a script, `hash-passcode`, that will hash the `MARKBOT_LOCK_PASSCODE` environment variable and embed it (with a `secret`) into `config.json`.
- The “Develop” menu only becomes visible when the environment variables are present and the hashed passcode in `config.json` matches the environment variable.
- Added menu items to preview the website locally and view the live website on GitHub.

### Changed

- The main window now has a minimum resizable width and height.
- Removed the about screen on Mac OS X, replacing it with just the version number.
- The distance measurement for screenshot comparison is now higher—it matters a little less in the tested metrics.
- Updated the dependencies including Electron & ESLint.
- Changed the version updating script to hook into the `npm version` script.

### Fixed

- Add some more error checking in the HTML validation to fix a weird bug in Windows.
- Tried to make a better job of ignoring the CSS `calc()` validation errors.
- Validation errors inside single line `@viewport` declarations were skipped—they will now be caught by best practices or properties checking.
- Fixed a very specific screenshot bug: sometimes the cropping would cut at exactly the point needed to get 0% differences. This has been changed, now the images are cropped to match dimensions but the shorter one is lengthened.
- Error messages from regex searches now remove the `\` to help with clarity and understanding.

---

## [2.9.1] — 2016-03-10

### Fixed

- Re-disabled the Node integration in the hidden screenshot window.
- Accidental drags of screenshot images don’t attempt to re-check the website.
- Fixed line breaking to better support Windows’s CRLF and other edge cases.
- Change the window loading detection to better handle remote resources.
- Move screenshot check initialization earlier to prevent Submit to Canvas button showing prematurely.
- Adjusted the gradient width to not cover interface border between the checks list and the error list.
- Updated dependencies.

---

## [2.9.0] — 2016-02-28

### Added

- A Markbot file status message that says “Exists” is now shown at the top of the checks panel.
- Added a `has_not` element matching option to the HTML entry of the Markbot file that will throw an error if that element is encountered.

### Changed

- Increased allowed screenshot differences to 13% based on student feedback.

---

## [2.8.4] — 2016-02-28

### Changed

- The labels on the diff window are more visible than before.
- The “Force Reload” menu item will now reload the focused window.
- The “Develop” menu can only be displayed with the `MARKBOT_DEVELOP_MENU` environment variable now.
- Upgraded to a newer version of Electron, v0.36.9.
- Added basic CSS to enable hardware acceleration for the application windows.

### Fixed

- Markbot would attempt to bypass some checks without them every being initialized.
- Fix screenshot window resizing to support shorter screens after longer screens.
- Fix the differ’s split slider so that it’s properly centred on load.
- Screenshots for really long websites now capture the whole page without missing some at the bottom—up to a maximum of 6000 pixels.

---

## [2.8.3] — 2016-02-26

### Fixed

- Fixed a bug when trying to check CSS properties: they are now not checked until the CSS is valid. Did the same for HTML for consistency.

---

## [2.8.2] — 2016-02-26

### Fixed

- When the user’s screenshot was shorter than the reference, the reference one would show through into the user’s and cause confusion.

---

## [2.8.1] — 2016-02-25

### Fixed

- CSS validator parse error message issue when it was the first line of the CSS file.

---

## [2.8.0] — 2016-02-25

### Added

- The screenshot comparison results are now presented with a split view and difference window to make it easier to tell what’s wrong.

### Changed

- Improved the installer DMG window graphics.
- Moved to using the `asar` packing format to decrease loading and copying times.
- Rewrote the screenshot comparison functionality for better performance and accuracy.
- Debugging console messages are now grouped together to more easily see.

### Fixed

- Errors related to `svg:not(:root)` will now be ignored when the root specific rules are turned on.
- The Canvas submission button still displayed hover effects when disabled.
- Add screenshot resizing to support retina displays.

---

## [2.7.1] — 2016-02-23

### Added

- Screenshot difference percentages are now always sent to the console window for debugging.

### Changed

- Updated the checking dependencies to fix a few errors.
- Stop forcing the `<script>` tag onto separate lines.

### Fixed

- When `@viewport` without vendor prefixes was the first line in the file a Javascript error was thrown.

---

## [2.7.0] — 2016-02-21

### Added

- CSS can now be checked, using the `has_not` Markbot property, to make sure certain selectors don’t have specific properties—to enforce DRY.

### Changed

- When screenshots are taken for multiple files only one “Screenshots” group heading is shown.
- Screenshot diffing will now round the mismatch percentage up and throw an error at exactly 10%, not above 10%.

### Fixed

- Markbot will display an error when trying to check screenshots if the HTML file is missing.

---

## [2.6.1] — 2016-02-20

### Added

- Screenshots in error list now have a maximum height and can be zoomed (opened in default image viewer) by clicking.
- Markbot will send its current version number to Markbot Server to help prevent students from using outdated versions of Markbot.

### Changed

- Refactored screenshot diffing system to support Windows more reliably and better support for slower events and processing.

### Fixed

- The green, successful pill buttons in the left checks column are no longer clickable, because they didn’t do anything anyways.

---

## [2.6.0] — 2016-02-19

### Added

- Screenshot differences can now be compared against reference files.
- Reference screenshots can be generated from the “Develop” menu.

---

## [2.5.1] — 2016-02-19

### Fixed

- Multiple file checking now works as expected, previously only the last file would be properly checked.

---

## [2.5.0] — 2016-02-18

### Added

- Markbot is now capable of linting and stylistically checking Javascript with ESLint.

---

## [2.4.1] — 2016-02-14

### Fixed

- Made the “Open Repo” only be enabled when the user is signed in.

---

## [2.4.0] — 2016-02-14

### Added

- Clicking the robot head will now rerun the tests.
- Certain menu items are now enabled and disabled on demand.
- Clicking the pill buttons will jump down and highlight the associated error messages.
- Clicking the folder name will now reveal the folder (also includes a menu item).

---

## [2.3.1] — 2016-02-14

### Fixed

- Some SVG attributes with uppercase letters were missing, causing validation errors.
- With SVG self closing tags, the error skipping was too aggressive and missed actual indentation errors.
- When working with embedded SVG, paths can get extremely long, Beautifier’s `max_line_length` is actually `32786`, which is sometimes too short. Changed to `Number.MAX_SAFE_INTEGER`.
- An error was thrown when the CSS file was empty. Markbot now checks that both HTML & CSS have contents before passing “Exists” test.
- Add missing menu items on Windows to support all of Markbot’s features and refactor menu code to clean it up.
- Fixes the Windows naming convention checking by normalizing paths and properly ignoring everything before the current folder.
- Fixes the Windows CSS validator issue: the validator was looking for a valid URL, not a path, so no backslashes.

---

## [2.3.0] — 2016-01-31

### Added

- Code samples for expected code when confusing indentation is found.
- Better support for SVG—allowing uppercase letters in tags and ignoring closing `/>` in self-closing tags.

### Fixed

- Error message consistency in the use of periods at the end of sentences.
- The CSS validation script would throw an error when there was absolutely no CSS validation errors—I was only testing when there were errors to be ignored.
- Checks didn’t finish if the file doesn’t exist—they now all bypass with skip messages.

---

## [2.2.1] — 2016-01-29

### Fixed

- Change the `<p>` tag selection regex to not grab SVGs `<path>` tags also.
- Stopped the code style checker from performing indentation checks because they aren’t good enough.

---

## [2.2.0] — 2016-01-29

### Added

- Checks to confirm `<p>` tags are closed on the same line.
- Checks to confirm all the document tags (`<head>`, `<body>`, etc.) are in place.
- Checks for missing optional closing tags like `<li>`.
- Checks for maximum number of empty lines.

### Changed

- Refactored the whole main process/render process messaging system to use events instead of callbacks.
- No HTML or CSS best practice checks will be completed until after the files are completely valid. Display greyed-out messages stating so to users.

### Fixed

- Change the whole HTML best practices process by doing lots of checks before getting to indentation—students were having lots of problems.

---

## [2.1.0] — 2016-01-28

### Added

- Made the indentation checking more strict in enforcing multiple lines within tags.
- Allow SVG tags and properties to pass checks.

---

## [2.0.1] — 2016-01-26

### Fixed

- Allow spaces in any folders of the path when running the JAR validators

---

## [2.0.0] — 2016-01-25

### Added

- Initial release of the desktop app. Version 2.0.0 instead of one because there was another Markbot before—see the README.md.
