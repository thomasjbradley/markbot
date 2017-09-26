# ![](.readme/markbot-logo.png) Markbot

*Your marvellously magnificent marking robot.*

![](.readme/screenshot.png)

**This is an application I use that automatically tests and marks student code assignments in Algonquin College Graphic Design’s Web Dev courses.**

Built with Javascript, Node.js & Electron.

---

- [Why a desktop app?](#why-a-desktop-app)
- [Use cases](#use-cases)
- [Set up](#set-up)
  - [Cheat prevention](#cheat-prevention)
- [How the students use it](#how-the-students-use-it)
- [Repo configuration with Markbot files](#repo-configuration-with-markbot-files)
  - [Git & GitHub checks](#git--github-checks)
  - [HTML file tests](#html-file-tests)
  - [CSS file tests](#css-file-tests)
  - [JS file tests](#javascript-file-tests)
  - [Screenshot comparisons](#screenshot-comparisons)
  - [Functionality tests](#functionality-tests)
  - [Markdown tests](#markdown-tests)
  - [YAML tests](#yaml-tests)
  - [File & image tests](#file--image-tests)
  - [Performance testing](#performance-testing)
  - [Targeting all files](#targeting-all-files)
    - [Unique information for all files](#unique-information-for-all-files)
  - [Inheriting from templates](#inheriting-from-templates)
  - [The Markbot ignore file](#the-markbot-ignore-file)
- [Installation on student computers](#installation-on-student-computers)
  - [Git](#git)
  - [JDK](#jdk)
  - [Student installation tutorial](#student-installation-tutorial)
- [Building Markbot](#building-markbot)
  - [Configure the Markbot application](#configure-the-markbot-application)
    - [1. Environment variables](#1-environment-variables)
    - [2. App config file](#2-app-config-file)
    - [3. Passcode hashing & embedding](#3-passcode-hashing--embedding)
    - [4. HTTPS certificate generation](#4-https-certificate-generation)
    - [5. Markbot dependencies](#4-markbot-dependencies)
      - [HTML validator](#html-validator)
      - [CSS validator](#css-validator)
        - [Compiling the CSS validator](#compiling-the-css-validator)
      - [LanguageTool](#languagetool)
        - [Add more words to the dictionary](#add-more-words-to-the-dictionary)
  - [Running Markbot](#running-markbot)
- [Debugging Markbot](#debugging-markbot)
- [Markbot Server](#markbot-server)
- [License & copyright](#license--copyright)

---

## Why a desktop app?

This is my second (and more successful) attempt. The first version was built on GitHub Pull Requests & Travis with MochaJS tests.

Unfortunately version one had some problems: specifically volume. In classes of 25 or more students Travis would start to choke at the end when everybody was trying to finish their work on time. There would be upwards of 25 pull requests going into Travis per minute with many requested tests to complete. It was just too slow, sometimes tests would take 20–30 minutes to complete, or just stop.

The user experience wasn’t great for the students and also a little stressful for me, so I switched to a desktop app built with [Electron](http://electron.atom.io/) and (practically) the same Javascript tests.

Having the desktop app allows all the tests to be run locally and much more efficiently.

---

## Use cases

Students will fork assignment repositories from GitHub, make their changes, and drop it into Markbot. Markbot will run a battery of tests on the code and report back with the results, allowing the finalized work to be submitted to the Canvas LMS.

This is great for code assignments that are pass/fail—I use it in my courses. If they pass the tests then the system automatically sets their grade to complete in Canvas.

It also works for non-pass/fail assignments but the grade submission component will only assign 1 point to their assignment—which I think makes sense because, I as the teacher, would then go in and do a complete assessment of their work.

---

## Set up

There’s a few things you’ll need to do to set the repo up properly for Markbot.

1. Create a [build of the Markbot.app](#building-markbot) that points to your version of [Markbot Server](#markbot-server).
2. Create a repo on GitHub with a `.markbot.yml` file inside—[see Markbot configuration below](#configuration-with-markbot-files).
3. I usually put `.editorconfig` and `.gitignore` files in the repo to help the students not make simple mistakes. [See the Markbot repo template on GitHub.](https://github.com/thomasjbradley/markbot-template)
4. I usually make sure the repo is set up with `gh-pages` so it is a live website for the students.
5. If you’re using screenshot comparison be sure to use the “Develop” menu’s “Generate Reference Screenshots” for the most consistency.
6. Make sure to run the “Develop” menu’s “Lock Requirements” before sending the repo to students or they will be marked as a cheater.
7. Get the students to [download Markbot and it’s dependencies onto their computers](#installation-on-student-computers).
8. Then students use Markbot while coding.

### Cheat prevention

There is some cheat prevention build into Markbot—it’s not perfect but it’s annoying enough for students to work around that it’s just faster to do the homework.

In the “Develop” menu there’s an option named “Lock Requirements”—this should be done for every assignment or the student will get marked as a cheater.

It will hash the `.markbot.yml` file and the screenshots and put the hashes into a `.markbot.lock` file. If any of the HTML, CSS or JS files are marked as `locked: true` they will also be hashed into the lock file.

If Markbot detects any changes to these files the user will be marked as a cheater and given a grade of 0 with Markbot Server.

**Lock the requirements right at the end to make sure everything is exactly how you want it to be.**

---

## How the students use it

The students will fork repos then drop into Markbot which will automate the marking.

[**Check out this tutorial for the students to see how it works.**](http://learn-the-web.algonquindesign.ca/courses/web-dev-1/using-markbot/)

---

## Repo configuration with Markbot files

All the tests are set up and ready to go and inside the Markbot application. They can be configured from a `.markbot.yml` file.

*Place the `.markbot.yml` file in the folder you want to test. Normally this is done when setting up a repository on GitHub that students would fork.*

Here are the properties that you can use in the Markbot file for testing:

- `repo` — used as an indicator in the app screen, for `liveWebsite`, & as part of the [Canvas integration](https://github.com/thomasjbradley/travis-canvas-proxy) to make nice URLs in grading comments.
- `canvasCourse` — used as part of the Canvas integration.
- `naming` — will confirm every file & folder follows [our naming conventions](http://learn-the-web.algonquindesign.ca/topics/naming-paths-cheat-sheet/).
- `commits` — the minimum number of commits students need—will automatically subtract your commits.
- `liveWebsite` — whether to make a `HEAD` request to the GitHub URL to check that it’s accessible or not. Requires the `repo` entry. If the repo isn’t set up with `gh-pages` or the student hasn’t synced any commits a 404 will be issued, failing the test.
- `restrictFileTypes` — will disallow specific extensions and file names from existing in the folder—[see `app/checks/restricted-file-types` for a list](app/checks/restrict-file-types/).
- `git` — [for more complex Git checks.](#git--github-checks)
- `html` — [for testing HTML files.](#html-file-tests)
- `css` — [for testing CSS files.](#css-file-tests)
- `js` — [for testing Javascript files.](#javascript-file-tests)
- `screenshots` — [for comparing visual differences with screenshots.](#screenshot-comparisons)
- `functionality` — [for running Javascript live tests against the website.](#functionality-tests)
- `md` — [for checking Markdown files.](#markdown-tests)
- `yml` — [for checking YAML files.](#yaml-tests)
- `files` — [for checking images & plain text files.](#file--image-tests)
- `performance` — [for checking website performance against simulated networks.](#performance-testing)
- `allFiles` — [for common requirements between all files of a specific type.](#targeting-all-files)

**If you plan on using the Canvas auto-grading feature, check out [Markbot Server](#markbot-server).**

Here’s a basic Markbot file:

```yml
repo: markbot
canvasCourse: web-dev-1

naming: true
commits: 3
liveWebsite: true
restrictFileTypes: true

# Other tests, described below, would go here
```

### Git & GitHub checks

Using the `git` entry we can enforce some requirements on the status of the student’s Git repo.

**This is a replacement for the simple `commits` entry.**

```yml
git:
  # The minimum number of commits students need—will automatically subtract your commits.
  numCommits: 2

  # Force the students to make sure all their files are committed.
  allCommitted: true

  # Force the students to make sure all their files are pushed & synced.
  allSynced: true

  # Confirm specific best practices on the last 5 Git commit messages.
  # Won’t prevent students from handing assignments in will only show warnings.
  # (Spelling & grammar, minimum word & character length, no trailing periods, attempts to enforce present-tense imperative verbs at the start)
  bestPractices: true
```

### HTML file tests

Use the `html` entry to test HTML files, it’s an array of objects, each representing a file to test.

*The `path` option is the only one that’s required—leaving any of the others off will skip the test.*

```yml
html:
    # The HTML file’s path
  - path: 'index.html'

    # Whether the code in this file should be locked or not, to help prevent students from changing the code
    # I use it for assignments where I give them complete HTML & they just write the CSS or JS
    # With locked on, there isn’t much point providing the rest of the options
    locked: true

    # Whether to validate it or not
    valid: true

    # Check its best practices & indentation (double quoting attributes, having a <title>, indented children, etc.)
    # Can be further configured in the `htmlcs.json` file
    # Will be skipped if validation isn’t also checked—the document must be valid first
    bestPractices: true

    # Check if the headings are in the proper order and that the document starts with an <h1>
    # Will be skipped if validation isn’t also checked—the document must be valid first
    outline: true

    # Can be used to test for specific elements; each entry should be a valid CSS selector
    # Will be skipped if validation isn’t also checked—the document must be valid first
    # If given an array, the second argument can be a custom error message
    has:
      - 'header nav[role="navigation"]'
      - 'main'
      - ['header nav li a[class][href*="index.html"]', 'The navigation should be highlighted on this page']
      # You can emit warnings that won’t prevent students from submitting work using an alternative syntax
      - check: 'main' # This could also be `selector: 'main'`
        message: 'The `main` tag should be included for accessibility reasons'
        type: 'warning'
      # You can specify a limit for how many times an element should be inside the HTML code
      - check: '[role="banner"]'
        message: 'The “banner” role is used to define the header of the whole website so there should be only one per page'
        limit: 1

    # Can be used to test that specific selectors are not used in the HTML
    # I would use this for ensuring that `<hr>` tags aren’t used when borders should be or that `<br>` tags aren’t used
    # Will be skipped if validation isn’t also checked—the document must be valid first
    # If given an array, the second argument can be a custom error message
    hasNot:
      - 'br'
      - ['hr', 'The `hr` tag should not be used to create borders']
      # Warnings too!
      - selector: 'hr'
        message: 'The `hr` tag should not be used to create borders'
        type: 'warning'

    # Regex searches on the file, for confirming specific content
    # If given an array, the second argument can be a custom error message
    search:
      - 'Hello World!'
      - ['Hello World!', 'Whoa, don’t be so grumpy, say “Hello”']
      # And warnings!
      - regex: 'Hello World!' # (Using `check` instead of `regex` is okay too, so everything can be consistent)
        message: 'Whoa, don’t be so grumpy, say “Hello”'
        type: 'warning'
        # Limits work inside search to prevent content duplication
        limit: 1

    # Regex searches on the file, for confirming specific content isn’t found
    # If given an array, the second argument can be a custom error message
    searchNot:
      - 'Thing-a-magic'
      # Warnings too!
      - check: 'Thing-a-magic'
        type: 'warning'

    # Confirm that the code file has less than or equal to this many lines
    maxLines: 4
```

### CSS file tests

Use the `css` entry to test CSS files, with many of the same options as the HTML.

```yml
css:
    # The CSS file’s path
  - path: 'css/main.css'

    # Whether the code in this file should be locked or not, to help prevent students from changing the code
    # I use it for assignments where I give them complete CSS & they just write the HTML or JS
    # With locked on, there isn’t much point providing the rest of the options
    locked: true

    # Whether to validate it or not
    valid: true

    # Check its best practices & indentation (spaces after colons, new lines after closing blocks, etc.)
    # Can be further configured in the `stylelint.json` file
    # Will be skipped if validation isn’t also checked—the document must be valid first
    bestPractices: true

    # Can be used to test for specific selectors, properties & values
    #   [selector, property (optional), value (optional)]
    # Will be skipped if validation isn’t also checked—the document must be valid first
    has:
      - ['.thing']
      - ['.super', 'background-image']
      - ['.thang', 'width', '50px']
      # Starting the array with an `@` and a matching string will look inside media queries
      - ['@38em', 'html', 'font-size', '110%']
      # Adding another argument at the end will be a custom error message
      - ['html', 'font-size', '100%', 'The `font-size` should always be `100%`']
      - ['@38em', 'html', 'font-size', '110%', 'The `font-size` should always increase at `38em`']
      # You can include all that same complexity with warnings
      - check: ['@38em', 'html', 'font-size', '110%', 'The `font-size` should always increase at `38em`']
        type: 'warning'
      # Or a little cleaned-up version, can be used with or without warnings
      - mediaQuery: '@38em'
        selector: 'html'
        property: 'font-size'
        value: '110%'
        message: 'The `font-size` should always increase at `38em`'
        type: 'warning'

    # Can be used to test that specific selectors do not contain certain properties
    # I would use this for ensuring as little CSS duplication as possible, like forcing students to use multiple classes
    #   [selector, [property, property, etc.]]
    # Will be skipped if validation isn’t also checked—the document must be valid first
    hasNot:
      - ['.btn-ghost', ['display']]
      - ['.btn-subtle', ['font-size', 'text-decoration']]
      # Starting the array with an `@` and a matching string will look inside media queries
      - ['@110em']
      # Adding another argument at the end will be a custom error message
      - ['.btn-subtle', ['font-size', 'text-decoration'], 'The `.btn-subtle` shouldn’t be used']
      - ['@110em', '.btn-subtle', ['font-size', 'text-decoration'], 'The `.btn-subtle` shouldn’t be used']
      # Also with warnings!
      - check: ['.btn-ghost', ['display']]
        type: 'warning'

    # Regex searches on the file
    # If given an array, the second argument can be a custom error message
    search:
      - '@keyframes'
      - ['@viewport', 'The `@viewport` should be included for the best browser compatibility']
      # Warnings—woot!
      - check: '@keyframes'
        type: 'warning'
        # Limits work inside search to prevent content duplication
        limit: 1

    # Regex searches on the file for confirming certain things don’t exist
    # If given an array, the second argument can be a custom error message
    searchNot:
      - ['@media.+\(.*max-width', 'Media queries with `max-width` should not be used — use `min-width` instead']
      - ['@media.+\(.*px', 'Pixel units should not be used in media queries — use `em` instead']
      - ['font-size\s*:\s*.+px', 'Pixel units should not be used for `font-size` — use `rem` instead']
      # Using the object syntax and `type` there can also be warning messages
      - check: 'font-size\s*:\s*.+px'
        message: 'Pixel units should not be used for `font-size` — use `rem` instead'
        type: 'warning'

    # Confirm that the code file has less than or equal to this many lines
    maxLines: 4
```

### Javascript file tests

Use the `js` entry to test Javascript files.

```yml
js:
    # The JS file’s path
  - path: 'js/main.js'

    # Whether the code in this file should be locked or not, to help prevent students from changing the code
    # I use it for assignments where I give them complete JS & they just write the HTML or CSS
    # With locked on, there isn’t much point providing the rest of the options
    locked: true

    # Whether to validate/lint it or not using a series of best practices
    # Can be further configured in the `validation/eslint.json` file
    valid: true

    # Check its best practices & indentation (semicolons, spacing around brackets, etc.)
    # Can be further configured in the `best-practices/eslint.json` file
    # Will be skipped if validation isn’t also checked—the document must be valid before best practices are tested
    bestPractices: true

    # Regex searches on the file
    search:
      - 'querySelector'
      - 'addEventListener'
      # Using a slightly different syntax you can create warnings that don’t prevent the user from submitting
      - check: 'querySelectorAll'
        type: 'warning'
        # Limits work inside search to prevent content duplication
        limit: 1

    # Regex searches on the file for confirming certain things don’t exist
    # If given an array, the second argument can be a custom error message
    searchNot:
      - 'document.write\('
      - ['console.log\(', 'The `console.log()` function should not be left in your code after you’ve finished debugging']
      # Warnings work too!
      - check: 'console.log\('
        message: 'The `console.log()` function should not be left in your code after you’ve finished debugging'
        type: 'warning'

    # Confirm that the code file has less than or equal to this many lines
    maxLines: 4
```

### Screenshot comparisons

Markbot can be used to compare student work against reference screenshots included in the repository.

```yml
screenshots:
    # The path to the HTML file that will be screenshot
  - path: 'index.html'

    # An array of different screen widths for taking screenshots
    sizes: [400, 650, 960]

    # If there are multiple screenshots of the same path the label is required to distinguish them (it’s used in the filenames)
    # It can also be used to add a little extra information to the check list
    label: 'Clicked'

    # Execute some Javascript before capturing the screenshots
    # Happens immediately, before the first screenshot is taken and is not repeated for each size
    # Has access to all the same functions as the `functionality` tests with a few small exceptions:
    #   - `pass()` & `fail()` don’t exist
    #   - `done()` must be called when the screenshot capturing should begin
    before: |
      on('.btn', 'transitionend', () => {
        done();
      });
      activate('.btn');
```

*Markbot will look in the `screenshots` folder for images to compare against.*

The screenshots should be generated using Markbot itself for the most consistency—trigger the “Develop” menu ([See Environment variables](#environment-variables)) and press “Generate Reference Screenshots”.

Markbot will display differences to students highlighted in a black & white difference image. Difference percentages are calculated and **anything with a difference greater than 10%–13% is considered an error.**

The difference percentage is calculated based on the area of the image, following this formula:

```
< 1000000px — 13%
>= 1000000px — 12%
>= 3000000px — 11%
>= 6000000px — 10%
```

*The difference percentage is a sliding scale because as the screenshot area increased the percentage must go down to maintain a similar level of strictness.*

![](.readme/visual-diff.png)

*An example of screenshot difference errors.*

Students can enlarge the difference screenshot into a split view window for clearer understanding.

![](.readme/split-view.png)

*Markbot split view screenshot comparison tool.*

### Functionality tests

Markbot has the ability to run arbitrary Javascript code against an HTML file. This is great for running integration and functionality tests on student code to make sure their Javascript is doing the right thing.

Use the `functionality` entry in the `.markbot.yml` file to add tests for HTML files.

Each entry in the `functionality` list will perform the following actions:

1. The `path` will be loaded into a hidden browser window
2. When the website has finished loading the testing will start
3. Markbut will run through every entry in the `tests` array
4. Each Javascript test will be run inside a function that gets injected into the fully loaded page
5. If the test calls the `pass()` function, then the test passes, otherwise it should call the `fail()` function with a string describing the problem

**If a single test doesn’t pass the remainder of the tests will not execute.**

Here’s an example from one of my assignments:

```yml
functionality:
    # The path to the HTML file to load in a hidden browser window
  - path: "index.html"

    # The label can be used to help distinguish tests in the check list — it’s completely optional
    # When you need a full refresh of the page, including another test with the same path makes sense
    # But then they’re all listed the same in the check list
    # Label gives you the ability to slightly distinguish the test names
    label: "Dinosaur link"

    # A replacement for individual tests
    # Will just confirm that there are no Javascript errors
    noErrors: true

    # This Javascript code will be injected into the page before it loads
    # The feature exists mainly so I can overwrite built-in features like `prompt()` to test user input
    setup: |
      window.prompt = function () {
        return 'a';
      }

    # An array of Javascript code pieces to run against the live website
    tests:
      - |
        let ball = $('.ball');
        let currentColour = css(ball).backgroundColor;
        $('input[type="color"]').value = '#ffee66';
        $('form').dispatchEvent(ev('change'));

        if (currentColour == css(ball).backgroundColor) fail('The ball’s colour doesn’t change');

        pass();
```

Each test entry will be embedded into a Javascript anonymous self-executing function with a try-catch block, like this:

```js
(function () {
  'use strict';

  try {
    eval("(function(){'use strict';/* Your test code will be embedded here */}())");
  } catch (e) {
    /* Show error messages in Markbot & console */
  }
}());
```

*Yes, eval is evil, etc. But it’s useful here to catch any syntax errors you may have in your code so they can be displayed in the debugging console.*

Also notice that your test code will be wrapped in a self-executing function, this allows you to use `return` to short-circuit functions when they `fail` or `pass`.

Your injected code will have access to a few functions to simplify what you have to write:

- **`pass()`** — Tell Markbot that this test has passed
- **`fail(reason)`** — Tell Markbot that this test has failed
  - The `reason` should be a string that will be shown to the user in Markbot’s error list
- **`debug(...args)`** — For when writing the tests, to help you debug your test code
  - What ever is passed into `debug()` will be written to the console
- **`$(selector[, target = document])`** — Instead of having to write `document.querySelector()`
  - The `target` parameter allows you to use `querySelector()` on elements other than `document`—but defaults to `document`
  - If the `selector` isn’t found on the page the test will fail with an error message
- **`$$(selector[, target = document])`** — Instead of having to write `document.querySelectorAll()`
  - The `target` parameter allows you to use `querySelectorAll()` on elements other than `document`—but defaults to `document`
  - If the `selector` isn’t found on the page the test will fail with an error message
- **`css(element)`** — A shortcut to `getComputedStyle()`
- **`bounds(element)`** — A shortcut to `getBoundingClientRect()`
- **`offset(element)`** — Returns the complete offset for the element to the `top` and `left` of the page, using `getBoundingClientRect()` + `scrollY/X` for the calculation.
  - Returns an object in the format:
    ```js
    {
      left: 0,
      top: 0,
    }
    ```
- **`on(selector/element, eventname, callback[, timeoutlength = 2000])`** — This is instead of using `addEventListener`. The problem with `addEventListener` is timing.
  - If the student’s code uses event delegation, but yours listens directly on the element, your listener will be fired first.
  - Using `on()` will always bind to the `document` and listen for the event to bubble back upwards—guaranteeing that your listener gets called second.
  - `selector/element` a pre-selected DOM element object or CSS selector to match for the target for your event.
  - `eventname` is any standard event like `click`, `animationend`, etc.
  - `callback` is a function that will be executed when the event is triggered. It will receive two arguments:
    - `err` — (`bool`): whether or not the timeout was executed, meaning the event was never triggered.
    - `ev` — the standard Javascript event object passed through.
  - `timeoutlength` is an optional argument you can pass to control the maximum length the listener will wait to be called.
- **`ev(eventString[, options])`** — Can be used to fire an event with `dispatchEvent()`
  - It creates a `new Event`, `new MouseEvent` or `new KeyboardEvent`
  - `options` has a default of: `{bubbles: true, cancelable: true}`
  - If you provide an options argument it will be merged with the defaults
- **`hover(selector/element, callback)`** — A specialized event dispatch that hovers the mouse over an element—regular JS events aren’t “trusted” and therefore won’t trigger the CSS `:hover` styles.
  - Allows for testing to make sure student’s apply hover states to elements in CSS.
  - `selector/element` a pre-selected DOM element object or the CSS selector of the target for your event.
  - `callback` is a function that will be executed when the hover has triggered.
- **`activate(selector/element, callback)`** — A specialized event dispatch that “activates” an element triggering the CSS `:active` styles.
  - Allows for testing to make sure student’s apply actives states to elements in CSS.
  - `selector/element` a pre-selected DOM element object or the CSS selector of the target for your event.
  - `callback` is a function that will be executed when the hover has triggered.
- **`send(eventname[, options[, callback]])`** — sends trusted input events to the browser window. This is what `hover()` and `activate()` do internally.
  - It’s essentially a wrapper around Electron’s `webContents.sendInputEvent()`—[See the Electron docs.](https://electron.atom.io/docs/api/web-contents/#contentssendinputeventevent)
  - `eventname` is one of Electron’s allowed events: `mouseDown`, `mouseUp`, `mouseEnter`, `mouseLeave`, `contextMenu`, `mouseWheel`, `mouseMove`, `keyDown`, `keyUp`, `char`
  - `options` allows you to set extra properties, like Electron’s `modifiers`. But most importantly it sets the `isTrusted` flag to `true` by default to allow `hover`, etc. activate the CSS changes.

*Here’s an example of using `ev()` and `on()`:*

```yaml
functionality:
  - path: 'index.html'
    tests:
      - |
        let btn = $('.btn');
        let btnFill = $('path:nth-child(2)', btn);

        on('.btn path:nth-child(2)', 'transitionend', function (err, ev) {
          if (err) fail('The transition on the button’s coloured setion never ends—check that is has a transition');
          if (oldBtnFill == css(btnFill).fill) fail('The button doesn’t change colour');
          pass();
        });

        btn.dispatchEvent(ev('click'));
```

*Here’s an example of using `hover()`:*

```yaml
functionality:
  - path: 'index.html'
    tests:
      - |
        let a = document.querySelector('a');
        let oldBg = css(a).backgroundColor;

        hover('a', function () {
          if (css(a).backgroundColor == oldBg) fail('The hover colour doesn’t change on the link');
          pass();
        });
```

### Markdown tests

Markbot can check Markdown files looking for validation & best practices. It can also search inside the files for specific content.

If the Markdown files have YAML front matter that will also be validated with the same processor used by the YAML file checking.

*The `path` option is the only one that’s required—leaving any of the others off will skip the test.*

```yml
md:
  # The file’s path
  - path: "README.md"

    # Check validation & best practices following a specific Markdown format
    valid: true

    # Regex searches on the file, for confirming specific content
    # If given an array, the second argument can be a custom error message
    search:
      - 'Dinosaurs'
      - ['T\. Rex', 'Expected to see the T. Rex described']
      # Warnings will work too!
      # And so do limits!

    # Regex searches on the file, for confirming specific content isn’t found
    # If given an array, the second argument can be a custom error message
    searchNot:
      - 'Mammals'
      # Warnings will work too!
```

### YAML tests

Markbot can check YAML files looking for validation & best practices. It can also search inside the files for specific content.

*The `path` option is the only one that’s required—leaving any of the others off will skip the test.*

```yml
yml:
  # The file’s path
  - path: "data.yml"

    # Check validation & best practices
    valid: true

    # Regex searches on the file, for confirming specific content
    # If given an array, the second argument can be a custom error message
    search:
      - 'Mammals'
      - ['Dimetrodon', 'Should have explained that the Dimetrodon isn’t a dinosaur']
      # Warnings will work too!
      # And so do limits!

    # Regex searches on the file, for confirming specific content isn’t found
    # If given an array, the second argument can be a custom error message
    searchNot:
      - 'Dinosaurs'
      # Warnings will work too!
```

### File & image tests

Markbot can check random plain text files and images for specific features.

- **Images:** compare dimensions, compare file size, check if metadata has been removed by smushing.
- **Text files:** compare file size, check if it’s empty, search/not with regexes.

Use the `files` entry to test images and text files, it’s an array of objects, each representing a file to test.

*The `path` option is the only one that’s required—leaving any of the others off will skip the test.*

```yml
files:
  # The file’s path
  - path: "images/mars-2.jpg"

    # Essentially checks to make sure the file doesn’t exist
    # All other checks will be ignored
    exists: false

    # The maximum allowed file size represented in kilobytes (kB)
    maxSize: 300

    # For images only
    # The maximum/minimum allowed width
    maxWidth: 3000
    minWidth: 320

    # For images only
    # The maximum/minimum allowed height
    maxHeight: 1500
    minHeight: 240

    # Check if the image/file has been smushed
    # For images it’ll look for extraneous metadata, something ImageOptim would remove
    # For text files & SVGs it’ll just look for line breaks
    smushed: true

    # For text files only
    # Regex searches on the file, for confirming specific content
    # If given an array, the second argument can be a custom error message
    search:
      - '^Sitemap\:.+sitemap\.xml\s+?$'
      # Warnings will work too!
      # And so do limits!

    # For text files only
    # Regex searches on the file, for confirming specific content isn’t found
    # If given an array, the second argument can be a custom error message
    searchNot:
      - 'Allow:'
      - ['Disallow\:\s*\/', 'The disallow all directive (`Disallow: /`) should not be used']
      # Warnings will work too!

  # OR…
  # Just pass a directory & rely on the `allFiles` directive described below
  - directory: "images"
```

### Performance testing

Markbot can check the performance of a website on simulated networks—or without network throttling. Markbot will check specific performance statistics and compare them to a performance budget.

*The `path` option is the only one that’s required.* If only the `path` is included the default performance budget will be used.

```yml
performance:
  # The path to an HTML file to load and test
  - path: 'index.html'

    # The network speed (see list below)
    speed: 'WIFI'

    budget:
      # Milliseconds for maximum load time
      maxLoadTime: 1000
      # Maximum number of assets
      maxRequests: 15
      # Maximum page size of all assets in kilobytes (kB)
      maxSize: 800
      # Maximum number of fonts allowed on the page
      maxFonts: 5
```

#### Simulated networks speeds

Markbot has a few simulated network speeds built in—you can see all the details of in the [app/networks.js](app/networks.js) file.

- WIFI-FAST
- WIFI-REGULAR (WIFI)
- DSL
- 4G-REGULAR (4G)
- 3G-GOOD (3G)
- 3G-REGULAR
- 2G-GOOD (2G)
- 2G-REGULAR
- GPRS

*The names in the brackets are shortcuts: using `speed: '4G'` is exactly the same as `speed: '4G-REGULAR'`.*

#### Default performance budget

Here’s the default performance budget that Markbot will use if you don’t specify your own. If you leave one of the performance budget options off, Markbot will add the missing properties from the default budget.

```yml
speed: 'WIFI'
budget:
  maxLoadTime: 1000
  maxRequests: 15
  maxSize: 800
  maxFonts: 5
```

### Targeting all files

If you want the same values to work for all files of the same type in a project you can use the `allFiles` entry. With the all files entry we can set defaults that would be applied to all the selected files.

```yml
allFiles:
  # Supports any of the entries that `html` supports
  html:
    valid: true
    bestPractices: true
    outline: true
    performance: true
    has:
      - 'h1'
    # There’s also a screenshots entry to take screenshots for all HTML files specified
    # Creates a `screentshots.path` entry for each HTML file
    screenshots: [320, 400, 608, 960, 1440]

    # You can add the `except` entry to all types to prevent all these defaults from applying to specific files
    except:
      - 'test.html'

  # Supports any of the entries that `css` supports
  css:
    valid: true

  # Supports any of the entries that `js` supports
  js:
    valid: true

  # Supports any of the entries that `md` supports
  md:
    valid: true

  # Supports any of the entries that `yml` supports
  yml:
    valid: true

  # The functionality tests will be applied to every HTML file
  # Supports any of the entries that `functionality` supports
  functionality:
    noErrors: true

  # Supports any of the entries that `files` supports
  files:
    maxWidth: 2500
    maxHeight: 2500
    maxSize: 300
    smushed: true

  # Supports any of the entries that `performance` supports
  performance:
    speed: '3G'

html:
  - path: index.html
  - path: about.html
    has:
      - 'h2'

files:
  - path: 'images/dino.jpg'

performance:
  - path: 'index.html'
```

With this setup everything from the `allFiles->html` entry would be applied to all the HTML files listed below—to help alleviate duplication.

*Adding `functionality` into the `allFiles` entry will test that functionality on every HTML file listed in the `html` entry.*

#### Unique information for all files

With the `allFiles` entry, for HTML, we can check for uniqueness between the files: e.g. unique `<title>` tags or unique `meta description` tags.

```yml
allFiles:
  html:
    unique:
      - 'title'
      # Using an array, the second item will be used in the error message as the description
      # I use this to make the error messages a little simpler to understand
      # Without the second entry, the error message will just write the selector
      - ['meta[name="description"][content]', 'meta description']
      - 'h1'
```

The above set up would force all the HTML files to have different title tags, meta descriptions and `<h1>` tags.

*The `unique` entry expects each item to be a valid CSS selector, similar to `has` & `hasNot`.*

If you want to check attribute content, select with the attribute selector. **Markbot will grab the last selected attribute** and compare its content. In the example above, Markbot is comparing the `content` attribute.

### Inheriting from templates

Markbot has a bunch of templates inside the [templates folder](templates) that your Markbot files can inherit from, thereby getting all the requirements specified in that file. Your Markbot file is more powerful and will overwrite entries—but things like `has`, `search`, etc. will be merged together.

The templates are just standard Markbot files, with all the same properties.

To inherit from the built-in templates add an `inherit` property to your Markbot file—it’s a list of all the templates to use:

```yml
inherit:
  - git-2
  - html
  - css
  - responsive

html:
  - path: index.html
```

In the above scenario, everything from the all those templates will be applied to your Markbot file (overwrites based on order) and therefore to the `index.html` file.

### The Markbot ignore file

You can get Markbot to ignore files within your project directory when using the `allFiles` option. Include a `.markbotignore` file in the same location as your `.markbot.yml` and it’ll be loaded in.

*It doesn’t support glob patterns only simple file and folder paths.*

Here’s an example:

```
pattern-library.html
patterns/typography       # Since this is a directory everything within would be ignored
patterns/grid
patterns/brand
patterns/icons
patterns/modules
common/grid.css
common/type.css
common/modules.css
```

---

## Installation on student computers

Before getting Markbot working on student machines, these two things should be downloaded and installed on the user’s computer.

### Git

Use the Mac OS X Terminal and install the command line tools with `xcode-select --install`

On Windows, [install Git directly from the website](https://git-scm.com/download/win). *When installing, on the “Adjusting your PATH environment” screen, switch to “Use Git from the Windows Command Prompt”.*

### JDK

Because Markbot shells out to two JAR files, the JDK must be available on the user’s computer.

[**Download the JDK.**](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

### Student installation tutorial

Check out my lesson for the students on installing it on their computers.

*Specifically starting at set 12:* [**Student Markbot installation lesson.**](http://learn-the-web.algonquindesign.ca/courses/web-dev-1/install-all-the-things/#step-12)

**Or install each tool separately, look in the [docs](docs) folder for instructions.**

---

## Building Markbot

Markbot uses Javascript, [Node.js](https://nodejs.org/en/), and [Electron](http://electron.atom.io/) as its build platform.

First clone Markbot to your computer using Git:

```
git clone git@github.com:thomasjbradley/markbot.git
```

If you’re using a Mac, I’d suggest installing Node.js with [Homebrew](http://brew.sh/).

```
brew install node
cd markbot
npm install
```

You’ll also need [Wine](https://www.winehq.org/) to make the Windows version on your Mac:

```
brew install wine
```

### Configure the Markbot application

There’s a few things you need to do to develop Markbot on your computer.

1. [Create two environment variables on your computer.](#environment-variables)
2. [Create your application config file.](#app-config-file)
3. [Embed the hashed version of your password into your config file.](#passcode-hashing--embedding)
4. [Download and install the dependencies.](#markbot-dependencies)

#### 1. Environment variables

Start by making two environment variables on your computer for the “Develop” menu and cheat locking.

```
MARKBOT_DEVELOP_MENU="on"
MARKBOT_LOCK_PASSCODE="some-long-password-thing"
```

*These will allow you to enable the “Develop” menu on your computer and create locking hashes for screenshots, code files, and the `.markbot.yml` file itself.*

[**To set persistent env vars on Mac OS X for command line and GUI, check out this answer on StackOverflow.**](https://stackoverflow.com/questions/135688/setting-environment-variables-in-os-x#answer-32405815)

#### 2. App config file

To configure your installation of Markbot you’ll need to adjust the config file.

Rename `config.example.json` to just `config.json` and change the following options:

- `proxyUrl` — (string) the URL to your [Markbot Server](#markbot-server) instance.
- `ignoreCommitEmails` — (array) the list of email addresses to ignore when counting commits.

#### 3. Passcode hashing & embedding

After you’ve created your `config.json` file *and* created the two environment variables, run the following command: `npm run hash-passcode`.

The `hash-passcode` script will generate a `secret` key and hash your password, embedding both into your `config.json`.

*The hashed passcode isn’t really for security, it only uses HMAC-SHA512. The purpose is really to be sufficiently annoying that students will do their work instead of figuring out how to cheat Markbot.*

#### 4. HTTPS certificate generation

Markbot spins up a web server internally to help with performance testing and website loading. The web server uses HTTPS—though it is just a self-signed certificate. The private key and public certificate need to be generated with `openssl` before Markbot can work.

In your terminal run:

```
npm run gen-https-cert
```

The script will create the appropriate files and place them into the `app` directory.

*While Markbot is running the tested website will be available at [https://localhost:8080/](https://localhost:8080/).*

#### 5. Markbot dependencies

Markbot has a few external dependencies that it shells out to internally:

- Git
- Nu HTML validator (JAR)
- CSS validator (JAR)

The `vendor` folder should contain a bunch of JAR files for the HTML validator and the CSS validator.

##### HTML validator

The `vendor/html-validator` folder should contain the `vnu.jar`—the pre-built binary works well.

[**Download the HTML validator release from GitHub.**](https://github.com/validator/validator)

##### CSS validator

The pre-build JAR files seem to be out of date, so you’ll have to compile the JAR yourself.

[**Download the CSS validator source from GitHub.**](https://github.com/w3c/css-validator)

###### Compiling the CSS validator

You’ll need the JDK and `ant` to compile the validator. Install `ant` with Homebrew: `brew install ant`.

1. Move into the directory and run `ant jar`.
2. Move the `css-validator.jar` file into the `vendor/css-validator` folder.
3. Move the newly created `lib` folder and all its contents into the `vendor/css-validator` folder.

##### LanguageTool

The LanguageTool is used to check spelling and grammar of commit messages. It’s another Java JAR to install in the `vendor` folder.

1. Go here and download the `.zip` package:

    [**https://languagetool.org/**](https://languagetool.org/)

    (Further down the page, look for: “Stand-alone for the Desktop”)

2. Copy the following items into the `vendor/languagetool` folder:

    - `languagetool-commandline.jar`
    - `libs/`
    - `META-INF/`
    - `org/`

###### Add more words to the dictionary

1. Find the English dictionary, here:

    `org/languagetool/resource/en/hunspell/ignore.txt`

2. Copy all the text from `words-to-add.txt` (it’s inside the `vendor` folder) into the bottom of `ignore.txt`

    **Make sure there are now blank lines between the words.**

### Running Markbot

If you want to run a test version, you can call `start`:

```
npm start
```

To build a final application for deployment to students, run `build`:

```
npm run build
```

*This will create both the Mac OS X version and the Windows version.*

Or optionally a single platform:

```
npm run build-mac
npm run build-win
```

That’s it, Markbot should be ready to go.

**Upload the Markbot installer files to a location the students can download from.**

---

## Debugging Markbot

Markbot has access to the developer tools and web inspector as well as a few other tools hidden in the “Develop” menu.

[**To enable the “Develop” menu make sure you have the correct environment variables.**](#environment-variables)

The “Develop” menu will only show when these two conditions are met:

1. The `MARKBOT_DEVELOP_MENU` env var exists.
2. The hashed version of the `MARKBOT_LOCK_PASSCODE` is the same as the hashed version in the `config.json` file.

---

## Markbot server

**Markbot Server is a companion server-side component to the desktop application.**

It’s used for the purpose of connecting Markbot to Canvas. Everything is on a separate server to keep my own personal Canvas API key secret, and to create a mapping for student GitHub usernames to Canvas student IDs.

Markbot will send its current version number to Markbot Server to help prevent students from using outdated versions of Markbot.

[**Find out more about Markbot Server.**](https://github.com/thomasjbradley/markbot-server)

---

## License & copyright

© 2016 Thomas J Bradley — [GPL](LICENSE).
