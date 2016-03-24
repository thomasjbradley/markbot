# ![](.readme/markbot-logo.png) Markbot

*Your friendly neighbourhood marking robot.*

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
  - [HTML file tests](#html-file-tests)
  - [CSS file tests](#css-file-tests)
  - [JS file tests](#javascript-file-tests)
  - [Screenshot comparisons](#screenshot-comparisons)
  - [Functionality tests](#functionality-tests)
- [Installation on student computers](#installation-on-student-computers)
  - [Git](#git)
  - [JDK](#jdk)
  - [Student installation tutorial](#student-installation-tutorial)
- [Building Markbot](#building-markbot)
  - [Configure the Markbot application](#configure-the-markbot-application)
    - [1. Environment variables](#1-environment-variables)
    - [2. App config file](#2-app-config-file)
    - [3. Passcode hashing & embedding](#3-passcode-hashing--embedding)
    - [4. Markbot dependencies](#4-markbot-dependencies)
      - [HTML validator](#html-validator)
      - [CSS validator](#css-validator)
        - [Compiling the CSS validator](#compiling-the-css-validator)
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
- `canvasAssignment` — used as part of the Canvas integration.
- `naming` — will confirm every file & folder follows [our naming conventions](http://learn-the-web.algonquindesign.ca/topics/naming-paths-cheat-sheet/).
- `commits` — the minimum number of commits students need—will automatically subtract your commits.
- `liveWebsite` — whether to make a `HEAD` request to the GitHub URL to check that it’s accessible or not. Requires the `repo` entry. If the repo isn’t set up with `gh-pages` or the student hasn’t synced any commits a 404 will be issued, failing the test.
- `html` — [for testing HTML files.](#html-file-tests)
- `css` — [for testing CSS files.](#css-file-tests)
- `js` — [for testing Javascript files.](#javascript-file-tests)
- `screenshots` — [for comparing visual differences with screenshots.](#screenshot-comparisons)

**If you plan on using the Canvas auto-grading feature, check out [Markbot Server](#markbot-server).**

Here’s a basic Markbot file:

```yml
repo: 'markbot'
canvasCourse: '123456'
canvasAssignment: '654321'

naming: true
commits: 3
liveWebsite: true

# Other tests, described below, would go here
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

    # Can be used to test for specific elements; each entry should be a valid CSS selector
    # Will be skipped if validation isn’t also checked—the document must be valid first
    # If given an array, the second argument can be a custom error message
    has:
      - 'header nav[role="navigation"]'
      - 'main'
      - ['header nav li a[class][href*="index.html"]', 'The navigation should be highlighted on this page']

    # Can be used to test that specific selectors are not used in the HTML
    # I would use this for ensuring that `<hr>` tags aren’t used when borders should be or that `<br>` tags aren’t used
    # Will be skipped if validation isn’t also checked—the document must be valid first
    # If given an array, the second argument can be a custom error message
    has_not:
      - 'br'
      - ['hr', 'The `hr` tag should not be used to create borders']

    # Regex searches on the file, for confirming specific content
    # If given an array, the second argument can be a custom error message
    search:
      - 'Hello World!'
      - ['Hello World!', 'Whoa, don’t be so grumpy, say “Hello”']

    # Regex searches on the file, for confirming specific content isn’t found
    # If given an array, the second argument can be a custom error message
    search_not:
      - 'Thing-a-magic'
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

    # Can be used to test that specific selectors do not contain certain properties
    # I would use this for ensuring as little CSS duplication as possible, like forcing students to use multiple classes
    #   [selector, [property, property, etc.]]
    # Will be skipped if validation isn’t also checked—the document must be valid first
    has_not:
      - ['.btn-ghost', ['display']]
      - ['.btn-subtle', ['font-size', 'text-decoration']]

    # Regex searches on the file
    # If given an array, the second argument can be a custom error message
    search:
      - '@keyframes'
      - ['@viewport', 'The `@viewport` should be included for the best browser compatibility']

    # Regex searches on the file for confirming certain things don’t exist
    # If given an array, the second argument can be a custom error message
    search_not:
      - ['@media.+\(.*max-width', 'Media queries with `max-width` should not be used — use `min-width` instead']
      - ['@media.+\(.*px', 'Pixel units should not be used in media queries — use `em` instead']
      - ['font-size\s*:\s*.+px', 'Pixel units should not be used for `font-size` — use `rem` instead']
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

    # Regex searches on the file for confirming certain things don’t exist
    # If given an array, the second argument can be a custom error message
    search_not:
      - 'document.write\('
      - ['console.log\(', 'The `console.log()` function should not be left in your code after you’ve finished debugging']
```

### Screenshot comparisons

Markbot can be used to compare student work against reference screenshots included in the repository.

```yml
screenshots:
    # The path to the HTML file that will be screenshot
  - path: 'index.html'
    # An array of different screen widths for taking screenshots
    sizes: [400, 650, 960]
```

*Markbot will look in the `screenshots` folder for images to compare against.*

The screenshots should be generated using Markbot itself for the most consistency—trigger the “Develop” menu ([See Environment variables](#environment-variables)) and press “Generate Reference Screenshots”.

Markbot will display differences to students highlighted in a black & white difference image. Difference percentages are calculated and **anything with a difference greater than 13% is considered an error.**

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
5. If the function returns `true` the test passes, otherwise it should return a string describing the error

*If a single test doesn’t pass the remainder of the tests will no execute.*

Here’s an example from one of my assignments:

```yml
functionality:
    # The path to the HTML file to load in a hidden browser window
  - path: "index.html"
    # An array of Javascript code pieces to run against the live website
    tests:
      - |
        let ball = $('.ball');
        if (!ball) return 'The .ball cannot be found';

        let currentColour = css(ball).backgroundColor;
        $('input[type="color"]').value = '#ffee66';
        $('form').dispatchEvent(ev('change'));

        if (currentColour == css(ball).backgroundColor) return 'The ball’s colour doesn’t change';

        return true;
```

Each test entry will be embedded into a Javascript anonymous self-executing function with a try-catch block, like this:

```js
(function () {
  'use strict';

  try {
    // Your test code will be embedded here
  } catch (e) {
    return 'Double check the Javascript';
  }
}());
```

Your injected code will have access to a few functions to simplify what you have to write:

- **`ev(eventString[, options])`** — Can be used with `dispatchEvent()`. It creates a `new Event`, `new MouseEvent` or `new KeyboardEvent` with the following options:
  - `bubbles: true`
  - `cancelable: true`
- **`$(selector[, target = document])`** — Instead of having to write `document.querySelector()`
  - The `target` parameter allows you to use `querySelector()` on elements other than `document`—but defaults to `document`
- **`$$(selector[, target = document])`** — Instead of having to write `document.querySelectorAll()`
  - The `target` parameter allows you to use `querySelectorAll()` on elements other than `document`—but defaults to `document`
- **`css(element)`** — A shortcut to `getComputedStyle()`

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

*Specifically starting at set 13:* [**Student Markbot installation lesson.**](http://learn-the-web.algonquindesign.ca/courses/web-dev-1/install-all-the-things/#step-13)

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

#### 4. Markbot dependencies

Markbot has a few external dependencies that it shells out to internally:

- Git
- Nu HTML validator (JAR)
- CSS validator (JAR)

The `vendor` folder should contain a bunch of JAR files for the HTML validator and the CSS validator.

##### HTML validator

The `vendor` folder should contain the `vnu.jar`—the pre-built binary works well.

[**Download the HTML validator release from GitHub.**](https://github.com/validator/validator)

##### CSS validator

The pre-build JAR files seem to be out of date, so you’ll have to compile the JAR yourself.

[**Download the CSS validator source from GitHub.**](https://github.com/w3c/css-validator)

###### Compiling the CSS validator

You’ll need the JDK and `ant` to compile the validator. Install `ant` with Homebrew: `brew install ant`.

1. Move into the directory and run `ant jar`.
2. Move the `css-validator.jar` file into the `vendor` folder.
3. Move the newly created `lib` folder and all its contents into the `vendor` folder.

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
npm run build-osx
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
