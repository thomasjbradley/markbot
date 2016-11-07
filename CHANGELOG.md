# Changelog

This file documents all the notable changes for each version of Markbot.
Markbot adheres to [Semantic Versioning](http://semver.org/).

---

## [Unreleased]

### Fixed

- When trying to debug functionality tests, if types other than string were sent, an error was thrown. Markbot is a little more forgiving and will accept more types to debug now.

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
