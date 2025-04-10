/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Squire } from '../source/Editor';

function selectAll(editor: Squire, root: HTMLElement) {
    document.getSelection()!.removeAllRanges();
    const range = document.createRange();
    range.setStart(root.childNodes.item(0), 0);
    range.setEnd(
        root.childNodes.item(0),
        root.childNodes.item(0).childNodes.length,
    );
    editor.setSelection(range);
}

describe('Squire RTE', () => {
    document.body.innerHTML = `<div id="squire">`;
    let editor: Squire;
    let squireContainer: HTMLElement;
    beforeEach(() => {
        squireContainer = document.getElementById('squire')!;
        editor = new Squire(squireContainer, {
            sanitizeToDOMFragment(html) {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const frag = doc.createDocumentFragment();
                const body = doc.body;
                while (body.firstChild) {
                    frag.appendChild(body.firstChild);
                }
                return document.importNode(frag, true);
            },
        });
    });

    describe('hasFormat', () => {
        let startHTML;
        beforeEach(() => {
            startHTML = '<div>one <b>two three</b> four <i>five</i></div>';
            editor.setHTML(startHTML);
        });

        it('returns false when range not touching format', () => {
            const range = document.createRange();
            range.setStart(squireContainer.childNodes.item(0), 0);
            range.setEnd(squireContainer.childNodes.item(0), 1);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(false);
        });

        it('returns false when range inside other format', () => {
            const range = document.createRange();
            range.setStart(document.querySelector('i')!.childNodes[0], 1);
            range.setEnd(document.querySelector('i')!.childNodes[0], 2);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(false);
        });

        it('returns false when range covers anything outside format', () => {
            const range = document.createRange();
            range.setStart(document.querySelector('b')!.previousSibling!, 2);
            range.setEnd(document.querySelector('b')!.childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(false);
        });

        it('returns true when range inside format', () => {
            const range = document.createRange();
            range.setStart(document.querySelector('b')!.childNodes[0], 2);
            range.setEnd(document.querySelector('b')!.childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(true);
        });

        it('returns true when range covers start of format', () => {
            const range = document.createRange();
            range.setStartBefore(document.querySelector('b')!);
            range.setEnd(document.querySelector('b')!.childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(true);
        });

        it('returns true when range covers start of format, even in weird cases', () => {
            const range = document.createRange();
            const prev = document.querySelector('b')!.previousSibling as Text;
            range.setStart(prev, prev.length);
            range.setEnd(document.querySelector('b')!.childNodes[0], 8);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(true);
        });

        it('returns true when range covers end of format', () => {
            const range = document.createRange();
            range.setStart(document.querySelector('b')!.childNodes[0], 2);
            range.setEndAfter(document.querySelector('b')!);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(true);
        });

        it('returns true when range covers end of format, even in weird cases', () => {
            const range = document.createRange();
            range.setStart(document.querySelector('b')!.childNodes[0], 2);
            const next = document.querySelector('b')!.nextSibling!;
            range.setEnd(next, 0);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(true);
        });

        it('returns true when range covers all of format', () => {
            const range = document.createRange();
            range.setStartBefore(document.querySelector('b')!);
            range.setEndAfter(document.querySelector('b')!);
            editor.setSelection(range);
            expect(editor.hasFormat('b')).toBe(true);
        });
    });

    describe('removeAllFormatting', () => {
        // Trivial cases
        it('removes inline styles', () => {
            const startHTML =
                '<div><i>one</i> <b>two</b> <u>three</u> <sub>four</sub> <sup>five</sup><br></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            selectAll(editor, squireContainer);
            editor.removeAllFormatting();
            expect(editor.getHTML()).toBe(
                '<div>one two three four five<br></div>',
            );
        });
        it('removes block styles', () => {
            const startHTML =
                '<div><blockquote>one<br></blockquote><ul><li>two<br></li></ul><ol><li>three<br></li></ol><table><tbody><tr><th>four<br></th><td>five<br></td></tr></tbody></table></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            selectAll(editor, squireContainer);
            editor.removeAllFormatting();
            const expectedHTML =
                '<div>one<br></div><div>two<br></div><div>three<br></div><div>four<br></div><div>five<br></div>';
            expect(editor.getHTML()).toBe(expectedHTML);
        });

        // Potential bugs
        // TODO: more analysis of this; this could just be an off-by-one in the test
        it('removes styles that begin inside the range', () => {
            const startHTML = '<div><i>one two three four</i> five<br></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            const range = document.createRange();
            range.setStart(
                squireContainer
                    .getElementsByTagName('i')
                    .item(0)!
                    .childNodes.item(0),
                3,
            );
            range.setEnd(
                squireContainer
                    .getElementsByTagName('i')
                    .item(0)!
                    .childNodes.item(0),
                8,
            );
            editor.removeAllFormatting(range);
            expect(editor.getHTML()).toBe(
                '<div><i>one</i> two <i>three four</i> five<br></div>',
            );
        });

        it('removes styles that end inside the range', () => {
            const startHTML = '<div><i>one two three four</i> five<br></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            const range = document.createRange();
            range.setStart(
                document.getElementsByTagName('i').item(0)!.childNodes.item(0),
                13,
            );
            range.setEnd(
                squireContainer.childNodes.item(0),
                squireContainer.childNodes.item(0).childNodes.length,
            );
            editor.removeAllFormatting(range);
            expect(editor.getHTML()).toBe(
                '<div><i>one two three</i> four five<br></div>',
            );
        });

        it('removes styles enclosed by the range', () => {
            const startHTML = '<div>one <i>two three four</i> five<br></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            const range = document.createRange();
            range.setStart(squireContainer.childNodes.item(0), 0);
            range.setEnd(
                squireContainer.childNodes.item(0),
                squireContainer.childNodes.item(0).childNodes.length,
            );
            editor.removeAllFormatting(range);
            expect(editor.getHTML()).toBe(
                '<div>one two three four five<br></div>',
            );
        });

        it('removes styles enclosing the range', () => {
            const startHTML = '<div><i>one two three four five</i><br></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            const range = document.createRange();
            range.setStart(
                document.getElementsByTagName('i').item(0)!.childNodes.item(0),
                4,
            );
            range.setEnd(
                document.getElementsByTagName('i').item(0)!.childNodes.item(0),
                18,
            );
            editor.removeAllFormatting(range);
            expect(editor.getHTML()).toBe(
                '<div><i>one </i>two three four<i> five</i><br></div>',
            );
        });

        it('removes nested styles and closes tags correctly', () => {
            const startHTML =
                '<table><tbody><tr><td>one<br></td></tr><tr><td>two<br></td><td>three<br></td></tr><tr><td>four<br></td><td>five<br></td></tr></tbody></table>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            const range = document.createRange();
            range.setStart(document.getElementsByTagName('td').item(1)!, 0);
            range.setEnd(
                document.getElementsByTagName('td').item(2)!,
                document.getElementsByTagName('td').item(2)!.childNodes.length,
            );
            editor.removeAllFormatting(range);
            expect(editor.getHTML()).toBe(
                '<table><tbody><tr><td>one<br></td></tr></tbody></table><div>two<br></div><div>three<br></div><table><tbody><tr><td>four<br></td><td>five<br></td></tr></tbody></table>',
            );
        });
    });

    describe('getPath', () => {
        let startHTML;
        beforeEach(() => {
            startHTML = '<div>one <b>two three</b> four <i>five</i></div>';
            editor.setHTML(startHTML);

            const range = document.createRange();
            range.setStart(squireContainer.childNodes.item(0), 0);
            range.setEnd(squireContainer.childNodes.item(0), 1);
            editor.setSelection(range);
        });

        it('returns the path to the selection', () => {
            editor.focus();
            const range = document.createRange();
            range.setStart(
                squireContainer.childNodes.item(0).childNodes.item(1),
                0,
            );
            range.setEnd(
                squireContainer.childNodes.item(0).childNodes.item(1),
                0,
            );
            editor.setSelection(range);
            editor.fireEvent('selectionchange');

            expect(editor.getPath()).toBe('DIV>B');
        });

        it('includes id in the path', () => {
            editor.setHTML('<div id="spanId">Text</div>');
            expect(editor.getPath()).toBe('DIV#spanId');
        });

        it('includes class name in the path', () => {
            editor.setHTML('<div class="myClass">Text</div>');
            expect(editor.getPath()).toBe('DIV.myClass');
        });

        it('includes all class names in the path', () => {
            editor.setHTML('<div class="myClass myClass2 myClass3">Text</div>');
            expect(editor.getPath()).toBe('DIV.myClass.myClass2.myClass3');
        });

        it('includes direction in the path', () => {
            editor.setHTML('<div dir="rtl">Text</div>');
            expect(editor.getPath()).toBe('DIV[dir=rtl]');
        });

        it('includes highlight value in the path', () => {
            editor.setHTML(
                '<div class="highlight" style="background-color: rgb(255, 0, 0)">Text</div>',
            );
            expect(editor.getPath()).toBe(
                'DIV.highlight[backgroundColor=rgb(255,0,0)]',
            );
        });

        it('includes color value in the path', () => {
            editor.setHTML(
                '<div class="color" style="color: rgb(255, 0, 0)">Text</div>',
            );
            expect(editor.getPath()).toBe('DIV.color[color=rgb(255,0,0)]');
        });

        it('includes font family value in the path', () => {
            editor.setHTML(
                '<div class="font" style="font-family: Arial, sans-serif">Text</div>',
            );
            expect(editor.getPath()).toBe(
                'DIV.font[fontFamily=Arial,sans-serif]',
            );
        });

        it('includes font size value in the path', () => {
            editor.setHTML(
                '<div class="size" style="font-size: 12pt">Text</div>',
            );
            expect(editor.getPath()).toBe('DIV.size[fontSize=12pt]');
        });

        it('is (selection) when the selection is a range', () => {
            editor.focus();
            const range = document.createRange();
            range.setStart(
                squireContainer.childNodes.item(0).childNodes.item(0) as Node,
                0,
            );
            range.setEnd(
                squireContainer.childNodes.item(0).childNodes.item(3) as Node,
                0,
            );
            editor.setSelection(range);
            editor.fireEvent('selectionchange');

            expect(editor.getPath()).toBe('(selection)');
        });
    });

    describe('multi-level lists', () => {
        it('increases list indentation', () => {
            const startHTML =
                '<ul><li><div>a<br></div></li><li><div>b<br></div></li><li><div>c<br></div></li></ul>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);

            const range = document.createRange();
            const textNode = document.getElementsByTagName('li').item(1)!
                .childNodes[0].childNodes[0];
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            editor.setSelection(range);

            editor.increaseListLevel();
            expect(editor.getHTML()).toBe(
                '<ul><li><div>a<br></div></li><ul><li><div>b<br></div></li></ul><li><div>c<br></div></li></ul>',
            );
        });

        it('increases list indentation 2', () => {
            const startHTML =
                '<ul><li><div>a<br></div></li><li><div>b<br></div></li><li><div>c<br></div></li></ul>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);

            const range = document.createRange();
            const textNode = document.getElementsByTagName('li').item(1)!
                .childNodes[0].childNodes[0];
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            editor.setSelection(range);

            editor.increaseListLevel();
            editor.increaseListLevel();
            expect(editor.getHTML()).toBe(
                '<ul><li><div>a<br></div></li><ul><li><div>b<br></div></li></ul><li><div>c<br></div></li></ul>',
            );
        });

        it('decreases list indentation', () => {
            const startHTML =
                '<ul><li><div>a<br></div></li><ul><li><div>b<br></div></li></ul><li><div>c<br></div></li></ul>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);

            const range = document.createRange();
            const textNode = document.getElementsByTagName('li').item(1)!
                .childNodes[0].childNodes[0];
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            editor.setSelection(range);

            editor.decreaseListLevel();
            expect(editor.getHTML()).toBe(
                '<ul><li><div>a<br></div></li><li><div>b<br></div></li><li><div>c<br></div></li></ul>',
            );
        });

        it('decreases list indentation 2', () => {
            const startHTML =
                '<ul><li><div>a<br></div></li><ul><ul><li><div>b<br></div></li></ul></ul><li><div>c<br></div></li></ul>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);

            const range = document.createRange();
            const textNode = document.getElementsByTagName('li').item(1)!
                .childNodes[0].childNodes[0];
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            editor.setSelection(range);

            editor.decreaseListLevel();
            editor.decreaseListLevel();

            expect(editor.getHTML()).toBe(
                '<ul><li><div>a<br></div></li><li><div>b<br></div></li><li><div>c<br></div></li></ul>',
            );
        });

        it('removes lists', () => {
            const startHTML =
                '<ul><li><div>foo<br></div></li><ul><li><div>bar<br></div></li></ul></ul>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);

            const range = document.createRange();
            const textNode = document.getElementsByTagName('li').item(1)!
                .childNodes[0].childNodes[0];
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            editor.setSelection(range);

            editor.removeList();
            expect(editor.getHTML()).toBe(
                '<ul><li><div>foo<br></div></li></ul><div>bar<br></div>',
            );
        });
    });

    describe('insertHTML', () => {
        it('fix CF_HTML incomplete table', () => {
            editor.insertHTML(
                '<table><tbody><tr><!--StartFragment--><td>text</td><!--EndFragment--></tr></tbody></table>',
            );
            expect(editor.getHTML()).toEqual(
                expect.stringMatching(
                    '<table><tbody><tr><td>text<br></td></tr></tbody></table>',
                ),
            );

            editor.setHTML('');

            editor.insertHTML(
                '<table><tbody><!--StartFragment--><tr><td>text1</td><td>text2</td></tr><!--EndFragment--></tbody></table>',
            );
            expect(editor.getHTML()).toEqual(
                expect.stringMatching(
                    '<table><tbody><tr><td>text1<br></td><td>text2<br></td></tr></tbody></table>',
                ),
            );
        });

        const LINK_MAP = {
            'dewdw@fre.fr': 'mailto:dewdw@fre.fr',
            'dew@free.fr?dew=dew': 'mailto:dew@free.fr?dew=dew',
            'dew@free.fr?subject=dew': 'mailto:dew@free.fr?subject=dew',
            'test@example.com?subject=foo&body=bar':
                'mailto:test@example.com?subject=foo&body=bar',
            'dew@fre.fr dewdwe @dew': 'mailto:dew@fre.fr',
            'http://free.fr': 'http://free.fr/',
            'http://google.com': 'http://google.com/',
            'https://google.com': 'https://google.com/',
            'https://www.google.com': 'https://www.google.com/',
            'https://www.google.com/': 'https://www.google.com/',
            'HTTPS://google.com/?': 'https://google.com/', // Test protocol matching
            'ftp://google.com?': 'ftp://google.com/', // Test protocol matching
            'redis://google.com?a': 'redis://google.com?a', // Test protocol matching
            'https://google.com?a=': 'https://google.com/?a=',
            'https://google.com?a=b': 'https://google.com/?a=b',
            'https://google.com?a=b?': 'https://google.com/?a=b',
            'https://google.com?a=b&': 'https://google.com/?a=b',
            'https://google.com?a=b&c': 'https://google.com/?a=b&c',
            'https://google.com?a=b&c=': 'https://google.com/?a=b&c=',
            'https://google.com?a=b&c=d': 'https://google.com/?a=b&c=d',
            'https://google.com?a=b&c=d?': 'https://google.com/?a=b&c=d',
            'https://google.com?a=b&c=d&': 'https://google.com/?a=b&c=d',
            'https://google.com?a=b&c=d&e=': 'https://google.com/?a=b&c=d&e=',
            'https://google.com?a=b&c=d&e=f': 'https://google.com/?a=b&c=d&e=f',
            'www.google.com': 'https://www.google.com/', // Test prepending protocol
            'foobar': 'http://localhost/foobar', // Test default handler
            'search': 'http://localhost/replace', // Test custom handler
        };

        Object.keys(LINK_MAP).forEach((input) => {
            it('should auto convert links to anchor: ' + input, () => {
                editor.linkRegExp = new RegExp(editor.linkRegExp.source + "|(foobar)|(?<extra>search)", editor.linkRegExp.flags);
                editor.linkRegExpHandlers['extra'] = (m) => {return 'replace'};
                editor.insertHTML(input);
                const link = document.querySelector('a')!;
                expect(link.href).toBe(LINK_MAP[input]);
                editor.setHTML('');
            });
        });

        it('should auto convert a part of the link to an anchor', () => {
            editor.insertHTML(`
                dew@fre.fr dewdwe @dew
            `);
            const link = document.querySelector('a')!;
            expect(link.textContent).toBe('dew@fre.fr');
            expect(link.href).toBe('mailto:dew@fre.fr');
            editor.setHTML('');
        });

        it('should not auto convert non links to anchor', () => {
            editor.insertHTML(`
                dewdwe @dew
                deww.de
                monique.fre

                google.com
            `);
            const link = document.querySelector('a');
            expect(link).toBe(null);
            editor.setHTML('');
        });
    });

    afterEach(() => {
        editor = null as any;
        document.body.innerHTML = `<div id="squire">`;
    });
});
