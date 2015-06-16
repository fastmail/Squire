/*global expect, describe, afterEach, beforeEach, it */
expect = expect.clone()
    .addType({
        name: 'SquireRTE',
        base: 'object',
        identify: function (value) {
            return value instanceof Squire;
        },
        inspect: function (value) {
            return 'Squire RTE: ' + value.getHTML();
        }
    })
    .addAssertion('[not] to contain HTML', function (expect, editor, expectedValue) {
        this.errorMode = 'bubble';
        expect(editor.getHTML(), '[not] to be', expectedValue);
    });

describe('Squire RTE', function () {
    var doc, editor;
    beforeEach(function () {
        var iframe = document.getElementById('testFrame');
        doc = iframe.contentDocument;
        editor = new Squire(doc);
    });

    function selectAll(editor) {
        var range = doc.createRange();
        range.setStartBefore(doc.body.childNodes.item(0));
        range.setEndAfter(doc.body.childNodes.item(0));
        editor.setSelection(range);
    }

    describe('removeAllFormatting()', function () {
        // Trivial cases
        it('removes inline styles', function () {
            var startHTML = '<div><i>one</i> <b>two</b> <u>three</u> <sub>four</sub> <sup>five</sup><br></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            selectAll(editor);
            editor.removeAllFormatting();
            expect(editor, 'to contain HTML', '<div><br>one two three four five</div>');
        });
        it('removes block styles', function () {
            var startHTML = '<div><blockquote>one<br></blockquote><ul><li>two<br></li></ul>' + 
                '<ol><li>three<br></li></ol><table><tbody><tr><th>four<br></th><td>five<br></td></tr></tbody></table></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            selectAll(editor);
            editor.removeAllFormatting();
            expect(editor, 'to contain HTML', '<div><br>one</div><div><br>two</div><div><br>three</div><div><br>four</div><div><br>five</div>');
        });

        // Potential bugs
        it('removes styles that begin inside the range', function () {
            var startHTML = '<div>one <i>two three four five</i><br></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.body.childNodes.item(0), 0);
            range.setEnd(doc.getElementsByTagName('i').item(0).childNodes.item(0), 4);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div>one two <i>three four five</i><br></div>');
        });

        it('removes styles that end inside the range', function () {
            var startHTML = '<div><i>one two three four</i> five<br></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.getElementsByTagName('i').item(0).childNodes.item(0), 13);
            range.setEnd(doc.body.childNodes.item(0), doc.body.childNodes.item(0).childNodes.length);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div><i>one two three</i> four five</div>');
        });

        it('removes styles enclosed by the range', function () {
            var startHTML = '<div>one <i>two three four</i> five<br></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.body.childNodes.item(0), 0);
            range.setEnd(doc.body.childNodes.item(0), doc.body.childNodes.item(0).childNodes.length);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div>one two three four five</div>');
        });

        it('removes styles enclosing the range', function () {
            var startHTML = '<div><i>one two three four five</i><br></div>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.getElementsByTagName('i').item(0).childNodes.item(0), 4);
            range.setEnd(doc.getElementsByTagName('i').item(0).childNodes.item(0), 18);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<div><i>one </i>two three four<i> five</i><br></div>');
        });

        it('removes nested styles and closes tags correctly', function () {
            var startHTML = '<table><tbody><tr><td>one<br></td></tr><tr><td>two<br></td><td>three<br></td></tr><tr><td>four<br></td><td>five<br></td></tr></tbody></table>';
            editor.setHTML(startHTML);
            expect(editor, 'to contain HTML', startHTML);
            var range = doc.createRange();
            range.setStart(doc.getElementsByTagName('td').item(1), 0);
            range.setEnd(doc.getElementsByTagName('td').item(2), doc.getElementsByTagName('td').item(2).childNodes.length);
            editor.removeAllFormatting(range);
            expect(editor, 'to contain HTML', '<table><tbody><tr><td>one<br></td></tr></tbody></table>' +
                '<div><br>two</div>' +
                '<div><br>three</div>' +
                '<table><tbody><tr><td>four<br></td><td>five<br></td></tr></tbody></table>');
        });
    });

    afterEach(function () {
        editor = null;
        var iframe = document.getElementById('testFrame');
        iframe.src = 'about:blank';
    });
});
