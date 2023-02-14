# Changelog

All notable changes to this project will be documented in this file, starting from v2.0.0.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2023-02-14

### Changed

-   Auto delink if backspacing inside auto-linked URL. This means if you make a
    mistake and backspace, you don't end up accidentally fixing the text but
    leaving the link to the wrong URL.

### Fixed

-   Fix duplicate CSS created when replacing styles
-   Support browsers without Selection#setBaseAndExtent API. This includes some
    older Firefox versions.

## [2.0.0] - 2023-01-23

### Added

-   Builds as an ES module.

### Changed

-   All code ported to Typescript and ES modules for compatibility with modern
    frontend projects and future maintainability.
-   New off-the-shelf tooling for the build process and code quality assurance.
-   Config option `sanitizeToDOMFragment` no longer takes an `isPaste`
    argument.
-   Custom events (e.g. `pathChange`) use the browser native CustomEvent class,
    which means the custom properties (e.g. `path`) are now available on the
    `detail` property of the event object, rather than directly added to the
    event object.
-   When the user pastes an image, instead of simulating drag/drop events,
    Squire now fires a custom `pasteImage` event, with a `clipboardData`
    property on the `detail`
-   When there is a selection and you paste text that looks like a URL, it will
    now make the selection a link rather than replacing it with the URL text.
-   In the object returned by the `getFontInfo` method, the font size property
    is now called "fontSize" instead of "size", and the font family property is
    now called "fontFamily" instead of "family". This means all properties now
    use the same name as in the CSSStyleDeclaration API.
-   The `key` function for setKeyHandler now uses the same names
    (including case) as the KeyboardEvent.key property
    (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
    For example, `"enter"` is now `"Enter"` and `"left"` is now `"ArrowLeft"`.

### Fixed

-   Fixed iOS autocorrect/text substitution fails to activate when hitting
    "enter".
-   Fixed Samsung keyboard on Android causes bizarre changes to the input,
    making it unusable.
-   Fixed bug trimming insignificant trailing white space, which could result
    in some formatting actions behaving oddly.
-   Fixed spaces "vanish" sometimes after deleting text.

### Removed

-   Support for any version of IE.
-   Support for using an iframe document as the editor, rather than just a
    normal DOM node.
-   Support for using it without an HTML sanitiser - this is essential for
    security, so it's now required.
-   `isInsertedHTMLSanitized` and `isSetHTMLSanitized` config options - as per
    the above, the HTML is always sanitised on insertion for security.
