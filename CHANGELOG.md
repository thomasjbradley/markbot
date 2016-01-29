# Changelog

This file documents all the notable changes for each version of Markbot.
Markbot adheres to [Semantic Versioning](http://semver.org/).

---

## [Unreleased]

### Added

- Code samples for expected code when confusing indentation is found.

### Fixed

- Error message consistency in the user of periods at the end of sentences.

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
