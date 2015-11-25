/*global unexpected, describe, afterEach, beforeEach, it, Squire */
(function () {
'use strict';
var expect = unexpected.clone()
    .installPlugin(unexpected.dom)
    .addType({
        name: 'SquireRTE',
        base: 'object',
        identify: function (value) {
            return value instanceof Squire;
        },
        inspect: function (value, depth, output) {
            return output.text('Squire RTE: ').code(value.getHTML(), 'html');
        }
    })
    .addAssertion('SquireRTE', '[not] to contain HTML', function (expect, editor, expectedValue) {
        expect.errorMode ='nested';
        // BR tags are inconsistent across browsers. Removing them allows cross-browser testing.
        expect(editor.getHTML().replace(/<br>/g, ''), '[not] to contain', expectedValue);
    });

describe('Squire RTE', function () {
    var doc, editor;
    beforeEach(function () {
        var iframe = document.querySelector('#testFrame');
        doc = iframe.contentDocument;
        editor = new Squire(doc);
    });

    function selectAll(editor) {
        var range = doc.createRange();
        range.setStart(doc.body.childNodes[0], 0);
        range.setEnd(doc.body.childNodes[doc.body.childNodes.length - 1], doc.body.childNodes[doc.body.childNodes.length - 1].childNodes.length);
        editor.setSelection(range);
    }

    describe('hasFormat', function () {
        var startHTML;
        beforeEach( function () {
            startHTML = '<div>one <b>two three</b> four <i>five</i></div>';
            editor.setHTML(startHTML);
        });

        it('returns false when range not touching format', function () {
            var range = doc.createRange();
            range.setStart(doc.body.childNodes.item(0), 0);
            range.setEnd(doc.body.childNodes.item(0), 1);
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be false');
        });

        it('returns false when range inside other format', function () {
            var range = doc.createRange();
            range.setStart(doc.querySelector('i').childNodes[0], 1);
            range.setEnd(doc.querySelector('i').childNodes[0], 2);
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be false');
        });

        it('returns false when range covers anything outside format', function () {
            var range = doc.createRange();
            range.setStart(doc.querySelector('b').previousSibling, 2);
            range.setEnd(doc.querySelector('b').childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be false');
        });

        it('returns true when range inside format', function () {
            var range = doc.createRange();
            range.setStart(doc.querySelector('b').childNodes[0], 2);
            range.setEnd(doc.querySelector('b').childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be true');
        });

        it('returns true when range covers start of format', function () {
            var range = doc.createRange();
            range.setStartBefore(doc.querySelector('b'));
            range.setEnd(doc.querySelector('b').childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be true');
        });

        it('returns true when range covers start of format, even in weird cases', function () {
            var range = doc.createRange();
            var prev = doc.querySelector('b').previousSibling;
            range.setStart(prev, prev.length);
            range.setEnd(doc.querySelector('b').childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be true');
        });

        it('returns true when range covers end of format', function () {
            var range = doc.createRange();
            range.setStart(doc.querySelector('b').childNodes[0], 2);
            range.setEndAfter(doc.querySelector('b'));
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be true');
        });

        it('returns true when range covers end of format, even in weird cases', function () {
            var range = doc.createRange();
            range.setStart(doc.querySelector('b').childNodes[0], 2);
            var next = doc.querySelector('b').nextSibling;
            range.setEnd(next, 0);
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be true');
        });

        it('returns true when range covers all of format', function () {
            var range = doc.createRange();
            range.setStartBefore(doc.querySelector('b'));
            range.setEndAfter(doc.querySelector('b'));
            editor.setSelection(range);
            expect(editor.hasFormat('b'), 'to be true');
        });
    });

    describe('removeAllFormatting', function () {
        // Trivial cases
        it('removes inline styles', function () {
            var startHTML = '<div><i>one</i> <b>two</b> <u>three</u> <sub>four</sub> <sup>five</sup></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            selectAll(editor);
            editor.removeAllFormatting();
            expect(editor, 'to contain HTML', '<div>one two three four five</div>');
        });
        it('removes block styles', function () {
            var startHTML = '<div><blockquote>one</blockquote><ul><li>two</li></ul>' +
                '<ol><li>three</li></ol><table><tbody><tr><th>four</th><td>five</td></tr></tbody></table></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            selectAll(editor);
            editor.removeAllFormatting();
            var expectedHTML = '<div>one</div><div>two</div><div>three</div><div>four</div><div>five</div>';
            expect(editor, 'to contain HTML', expectedHTML);
        });

        // Potential bugs
        it('removes styles that begin inside the range', function () {
            var startHTML = '<div>one <i>two three four five</i></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.body.childNodes.item(0), 0);
            range.setEnd(doc.getElementsByTagName('i').item(0).childNodes.item(0), 4);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div>one two <i>three four five</i></div>');
        });

        it('removes styles that end inside the range', function () {
            var startHTML = '<div><i>one two three four</i> five</div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.getElementsByTagName('i').item(0).childNodes.item(0), 13);
            range.setEnd(doc.body.childNodes.item(0), doc.body.childNodes.item(0).childNodes.length);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div><i>one two three</i> four five</div>');
        });

        it('removes styles enclosed by the range', function () {
            var startHTML = '<div>one <i>two three four</i> five</div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.body.childNodes.item(0), 0);
            range.setEnd(doc.body.childNodes.item(0), doc.body.childNodes.item(0).childNodes.length);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div>one two three four five</div>');
        });

        it('removes styles enclosing the range', function () {
            var startHTML = '<div><i>one two three four five</i></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.getElementsByTagName('i').item(0).childNodes.item(0), 4);
            range.setEnd(doc.getElementsByTagName('i').item(0).childNodes.item(0), 18);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div><i>one </i>two three four<i> five</i></div>');
        });

        it('removes nested styles and closes tags correctly', function () {
            var startHTML = '<table><tbody><tr><td>one</td></tr><tr><td>two</td><td>three</td></tr><tr><td>four</td><td>five</td></tr></tbody></table>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.getElementsByTagName('td').item(1), 0);
            range.setEnd(doc.getElementsByTagName('td').item(2), doc.getElementsByTagName('td').item(2).childNodes.length);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<table><tbody><tr><td>one</td></tr></tbody></table>' +
                '<div>two</div>' +
                '<div>three</div>' +
                '<table><tbody><tr><td>four</td><td>five</td></tr></tbody></table>');
        });
    });

    describe('makePreformatted', function () {
        it('adds a PRE element around text on same line', function () {
            var startHTML = '<div>one two three four five</div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            editor.moveCursorToStart();
            editor.makePreformatted();
            expect(editor, 'to contain HTML', '<pre>one two three four five</pre>');
        });

        it('adds an empty PRE element', function () {
            var startHTML = '<div></div><div>one two three four five</div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            editor.moveCursorToStart();
            editor.makePreformatted();
            expect(editor, 'to contain HTML', '<pre>\n</pre><div>one two three four five</div>');
        });

        it('wraps PRE tag around plain-text-ified contents of blocks', function () {
            var startHTML = '<div>one two</div><p>three four</p><blockquote>five</blockquote>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            selectAll(editor);
            editor.makePreformatted();
            expect(editor, 'to contain HTML', '<pre>one two\nthree four\nfive</pre>');
        });

        it('expands existing PRE tags to encompass selection', function () {
            var startHTML = '<div>abc</div><div></div><pre>one two three four five</pre><div></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            selectAll(editor);
            editor.makePreformatted();
            expect(editor, 'to contain HTML', '<pre>abc\n\none two three four five\n</pre>');
        });
    });

    describe('removePreformatted', function () {
        it('replaces selected PRE tags with their HTML-ified content', function () {
            var startHTML = '<pre>abc\n\none two three four five\n</pre>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            selectAll(editor);
            editor.removePreformatted();
            expect(editor, 'to contain HTML', '<div>abc</div><div>one two three four five</div>');
        });

        it('cuts the beginning off PRE tags', function () {
            var startHTML = '<pre>abc\n\none two three four five\n</pre>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.querySelector('pre').childNodes[0], 0);
            range.setEnd(doc.querySelector('pre').childNodes[0], 18);
            editor.setSelection(range);
            editor.removePreformatted();
            expect(editor, 'to contain HTML', '<div>abc</div><div>one two three</div><pre> four five\n</pre>');
        });

        it('cuts the end off PRE tags', function () {
            var startHTML = '<pre>abc\n\none two three four five\n</pre>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.querySelector('pre').childNodes[0], 18);
            range.setEnd(doc.querySelector('pre').childNodes[0], 29);
            editor.setSelection(range);
            editor.removePreformatted();
            expect(editor, 'to contain HTML', '<pre>abc\n\none two three</pre><div> four five</div>');
        });

        describe('with collapsed selection', function () {
            beforeEach(function () {
                var startHTML = '<pre>abc\n\none two three four five\nxyz</pre>';
                editor.setHTML(startHTML);
            });

            it('expands selection to the whole line', function () {
                var range = doc.createRange();
                range.setStart(doc.querySelector('pre').childNodes[0], 24);
                range.setEnd(doc.querySelector('pre').childNodes[0], 24);
                editor.setSelection(range);
                editor.removePreformatted();
                expect(editor, 'to contain HTML', '<pre>abc\n</pre><div>one two three four five</div><pre>xyz</pre>');
            });

            it('... even when on first line of tag', function () {
                var range = doc.createRange();
                range.setStart(doc.querySelector('pre').childNodes[0], 2);
                range.setEnd(doc.querySelector('pre').childNodes[0], 2);
                editor.setSelection(range);
                editor.removePreformatted();
                expect(editor, 'to contain HTML', '<div>abc</div><pre>\none two three four five\nxyz</pre>');
            });

            it('... or on last line of tag', function () {
                var range = doc.createRange();
                range.setStart(doc.querySelector('pre').childNodes[0], 31);
                range.setEnd(doc.querySelector('pre').childNodes[0], 31);
                editor.setSelection(range);
                editor.removePreformatted();
                expect(editor, 'to contain HTML', '<pre>abc\n\none two three four five</pre><div>xyz</div>');
            });
        });
    });

    afterEach(function () {
        editor = null;
        var iframe = document.querySelector('#testFrame');
        iframe.src = 'blank.html';
    });
});
})();
