# Changelog

All notable changes to this project will be documented in this file, starting from v2.0.0.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.2] - 2024-08-16

### Fixed

-   Fix "pathChange" event not being fired on selection change.
-   Fix backspace at beginning of quote was deleting the contents, not just
    removing the quote.

## [2.3.1] - 2024-07-23

### Fixed

-   Fix crash extracting contents of range.

## [2.3.0] - 2024-07-18

### Fixed

-   Fix text nodes sometimes incorrectly merged after delete.

### Added

-   HTML copied from the editor now includes a `<!-- squire -->` comment
-   The willPaste event now includes an `html` property in the details, with the
    raw HTML that is being pasted.

## [2.2.9] - 2024-07-17

### Fixed

-   Fix incorrect styles can be applied after splitting at the end of inline
    formatting, blurring, and focusing again.
-   Fix font info sometimes not returned even when selection within a single
    text span.

## [2.2.8] - 2024-02-21

### Fixed

-   Fix some keyboard shortcuts not working on some platforms.
-   Fix unable to paste text with new line on Android.

## [2.2.7] - 2024-02-21

### Fixed

-   Fix handling of Japanese IME input.
-   Fix willPaste event not cancelable.

## [2.2.6] - 2024-02-01

### Fixed

-   Fix Firefox cursor position after paste.
-   Fix keyboard handling on some Android browsers

### Added

-   Add undo point for automatic list creation.

## [2.2.5] - 2023-11-08

### Fixed

-   Return focus to the editor after undo/redo.

## [2.2.4] - 2023-10-24

### Fixed

-   Fixed the type definition of the "setKeyHandler" method "key" parameter.

## [2.2.3] - 2023-10-09

### Fixed

-   Fixed a null-deref crash that could occur when removing inline formatting.

## [2.2.2] - 2023-10-04

### Fixed

-   Added a workaround for a bug in Chrome that resulted in text in the editor
    not being rendered in certain circumstances.

## [2.2.1] - 2023-10-03

### Fixed

-   Fixed a bug in the exported extractRangeToClipboard fn if used in a certain
    configuration.

## [2.2.0] - 2023-10-02

### Added

-   The Squire config now has support for a toPlainText function, that takes an
    HTML string and should return the plain text version of that content to be
    added to the clipboard when cutting/copying.

### Changed

-   The default conversion of the HTML to plain text when cutting/copying now
    uses the same algorithm as the getSelectedText method.

## [2.1.1] - 2023-09-27

### Fixed

-   If you changed inline formatting in Chrome and then hit space, the formatting
    would be lost. This is now fixed.

## [2.1.0] - 2023-09-19

### Added

-   If you start a new line with "\*" then a space, Squire will now automatically
    set the format to an unordered list.
-   If you start a new line with "1." then a space, Squire will now automatically
    set the format to an ordered list.

## [2.0.3] - 2023-04-20

### Fixed

-   Fixed an error being thrown when you typed a URL in the middle of a text
    node. https://github.com/fastmail/Squire/issues/430

## [2.0.2] - 2023-03-20

### Changed

-   Let ArrowRight key always break out of <code> if at end. It will add a
    space afterwards if needed.
-   Added documentation for pasteImage event.

### Fixed

-   Fix backspace can delete two characters.
-   Consistently focus after calling removeAllFormatting.
-   Performance improvements.

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
