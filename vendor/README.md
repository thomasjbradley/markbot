# External dependencies

Markbot has a few external dependencies that it shells out to internally:

- Git
- Nu HTML validator (JAR)
- CSS validator (JAR)

---

## Markbot installation for students

Before getting Markbot working on student machines, these two things should be downloaded and installed on the user’s computer.

### Git

Use Terminal and install the command line tools with `xcode-select --install`

### JDK

Because Markbot shells out to two JAR files, the JDK must be available on the user’s computer.

[**Download the JDK.**](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

---

## Compiling the Markbot app

This `vendor` folder should contain a bunch of JAR files for the HTML validator and the CSS validator.

### HTML validator

The `vendor` folder should contain the `vnu.jar`—the pre-built binary works well.

[**Download the HTML validator release from GitHub.**](https://github.com/validator/validator)

### CSS validator

The pre-build JAR files seem to be out of date, so you’ll have to compile the JAR yourself.

[**Download the CSS validator source from GitHub.**](https://github.com/w3c/css-validator).

#### Compiling the CSS validator

You’ll need the JDK and `ant` to compile the validator. Install `ant` with Homebrew: `brew install ant`.

1. Move into the directory and run `ant jar`.
2. Move the `css-validator.jar` file into the `vendor` folder.
3. Move the newly created `lib` folder and all its contents into the `vendor` folder.
