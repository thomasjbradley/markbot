# Changelog

This file documents all the notable changes for each version of Markbot.
Markbot adheres to [Semantic Versioning](http://semver.org/).

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
