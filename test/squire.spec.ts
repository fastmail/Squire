// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Squire } from '../source/Editor';

// jsdom does not implement HTMLElement#isContentEditable, so it returns
// undefined for every element. Squire's key handlers fall back to the
// "detach uneditable node" path on Backspace/Delete at block boundaries
// when this is false-y, which masks the real merge behavior. Patch it
// here to follow the inherited `contenteditable` attribute so tests
// exercise the same code path as a real browser.
beforeAll(() => {
    const resolveContentEditable = (start: Element): boolean => {
        let node: Element | null = start;
        while (node) {
            const ce = node.getAttribute('contenteditable');
            if (ce === 'true' || ce === '') {
                return true;
            }
            if (ce === 'false') {
                return false;
            }
            node = node.parentElement;
        }
        return false;
    };
    Object.defineProperty(HTMLElement.prototype, 'isContentEditable', {
        configurable: true,
        get(this: Element): boolean {
            return resolveContentEditable(this);
        },
    });
});

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
                '<div><i>one</i> <b>two</b> <u>three</u> <sub>four</sub> <sup>five</sup></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            selectAll(editor, squireContainer);
            editor.removeAllFormatting();
            expect(editor.getHTML()).toBe(
                '<div>one two three four five</div>',
            );
        });
        it('removes block styles', () => {
            const startHTML =
                '<div><blockquote>one</blockquote><ul><li>two</li></ul><ol><li>three</li></ol><table><tbody><tr><th>four</th><td>five</td></tr></tbody></table></div>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);
            selectAll(editor, squireContainer);
            editor.removeAllFormatting();
            const expectedHTML =
                '<div>one</div><div>two</div><div>three</div><div>four</div><div>five</div>';
            expect(editor.getHTML()).toBe(expectedHTML);
        });

        // Potential bugs
        // TODO: more analysis of this; this could just be an off-by-one in the test
        it('removes styles that begin inside the range', () => {
            const startHTML = '<div><i>one two three four</i> five</div>';
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
                '<div><i>one</i> two <i>three four</i> five</div>',
            );
        });

        it('removes styles that end inside the range', () => {
            const startHTML = '<div><i>one two three four</i> five</div>';
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
                '<div><i>one two three</i> four five</div>',
            );
        });

        it('removes styles enclosed by the range', () => {
            const startHTML = '<div>one <i>two three four</i> five</div>';
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
                '<div>one two three four five</div>',
            );
        });

        it('removes styles enclosing the range', () => {
            const startHTML = '<div><i>one two three four five</i></div>';
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
                '<div><i>one </i>two three four<i> five</i></div>',
            );
        });

        it('removes nested styles and closes tags correctly', () => {
            const startHTML =
                '<table><tbody><tr><td>one</td></tr><tr><td>two</td><td>three</td></tr><tr><td>four</td><td>five</td></tr></tbody></table>';
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
                '<table><tbody><tr><td>one</td></tr></tbody></table><div>two</div><div>three</div><table><tbody><tr><td>four</td><td>five</td></tr></tbody></table>',
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
                '<ul><li><div>a</div></li><li><div>b</div></li><li><div>c</div></li></ul>';
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
                '<ul><li><div>a</div></li><ul><li><div>b</div></li></ul><li><div>c</div></li></ul>',
            );
        });

        it('increases list indentation 2', () => {
            const startHTML =
                '<ul><li><div>a</div></li><li><div>b</div></li><li><div>c</div></li></ul>';
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
                '<ul><li><div>a</div></li><ul><li><div>b</div></li></ul><li><div>c</div></li></ul>',
            );
        });

        it('decreases list indentation', () => {
            const startHTML =
                '<ul><li><div>a</div></li><ul><li><div>b</div></li></ul><li><div>c</div></li></ul>';
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
                '<ul><li><div>a</div></li><li><div>b</div></li><li><div>c</div></li></ul>',
            );
        });

        it('decreases list indentation 2', () => {
            const startHTML =
                '<ul><li><div>a</div></li><ul><ul><li><div>b</div></li></ul></ul><li><div>c</div></li></ul>';
            editor.setHTML(startHTML);
            expect(editor.getHTML()).toBe(startHTML);

            const selectB = () => {
                const range = document.createRange();
                const textNode = document.getElementsByTagName('li').item(1)!
                    .childNodes[0].childNodes[0];
                range.setStart(textNode, 0);
                range.setEnd(textNode, 0);
                editor.setSelection(range);
            };

            selectB();
            editor.decreaseListLevel();
            selectB();
            editor.decreaseListLevel();

            expect(editor.getHTML()).toBe(
                '<ul><li><div>a</div></li><li><div>b</div></li><li><div>c</div></li></ul>',
            );
        });

        it('removes lists', () => {
            const startHTML =
                '<ul><li><div>foo</div></li><ul><li><div>bar</div></li></ul></ul>';
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
                '<ul><li><div>foo</div></li></ul><div>bar</div>',
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
                    '<table><tbody><tr><td>text</td></tr></tbody></table>',
                ),
            );

            editor.setHTML('');

            editor.insertHTML(
                '<table><tbody><!--StartFragment--><tr><td>text1</td><td>text2</td></tr><!--EndFragment--></tbody></table>',
            );
            expect(editor.getHTML()).toEqual(
                expect.stringMatching(
                    '<table><tbody><tr><td>text1</td><td>text2</td></tr></tbody></table>',
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

    describe('saveUndoState with stale bookmark markers', () => {
        it('does not throw when a stale end marker precedes the cursor', () => {
            // Reproduce the original IndexSizeError: a stale selection-end
            // marker exists in the editor as the first child of the block
            // containing the cursor. Without the fix, saveUndoState would
            // pick up the stale end via querySelector, compute
            // endOffset = 0 - 1 = -1, and throw IndexSizeError from setEnd.
            editor.setHTML('<div>hello</div>');
            const div = squireContainer.querySelector('div')!;
            const stale = document.createElement('input');
            stale.id = 'squire-selection-end';
            stale.type = 'hidden';
            div.insertBefore(stale, div.firstChild);
            const text = stale.nextSibling as Text;
            const range = document.createRange();
            range.setStart(text, 3);
            range.collapse(true);
            editor.setSelection(range);

            expect(() => editor.saveUndoState()).not.toThrow();
            expect(
                squireContainer.querySelector('#squire-selection-start'),
            ).toBeNull();
            expect(
                squireContainer.querySelector('#squire-selection-end'),
            ).toBeNull();
        });

        it('cleans up leftover marker pairs found in the DOM', () => {
            editor.setHTML('<div>hello</div><div>cursor here</div>');
            const firstDiv = squireContainer.querySelectorAll('div')[0];
            const staleStart = document.createElement('input');
            staleStart.id = 'squire-selection-start';
            staleStart.type = 'hidden';
            const staleEnd = document.createElement('input');
            staleEnd.id = 'squire-selection-end';
            staleEnd.type = 'hidden';
            firstDiv.insertBefore(staleStart, firstDiv.firstChild);
            firstDiv.insertBefore(staleEnd, firstDiv.firstChild);

            const target = squireContainer.querySelectorAll('div')[1]
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(target, 0);
            range.collapse(true);
            editor.setSelection(range);

            expect(() => editor.saveUndoState()).not.toThrow();
            expect(
                squireContainer.querySelectorAll('#squire-selection-start')
                    .length,
            ).toBe(0);
            expect(
                squireContainer.querySelectorAll('#squire-selection-end')
                    .length,
            ).toBe(0);
        });
    });

    describe('getHTML / setHTML bookmark roundtrip', () => {
        it('round-trips a collapsed selection through getHTML(true)', () => {
            editor.setHTML('<div>hello world</div>');
            const text = squireContainer.querySelector('div')!
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(text, 6);
            range.collapse(true);
            editor.setSelection(range);

            const html = editor.getHTML(true);
            expect(html).toContain('squire-selection-start');
            expect(html).toContain('squire-selection-end');
            // getHTML must not leave bookmark markers behind in the DOM
            expect(
                squireContainer.querySelector('#squire-selection-start'),
            ).toBeNull();
            expect(
                squireContainer.querySelector('#squire-selection-end'),
            ).toBeNull();

            // Loading the marked-up HTML back should restore the selection
            // exactly where it was, and the markers themselves should be
            // gone (consumed by setHTML's _getRangeAndRemoveBookmark).
            editor.setHTML(html);
            expect(
                squireContainer.querySelector('#squire-selection-start'),
            ).toBeNull();
            expect(
                squireContainer.querySelector('#squire-selection-end'),
            ).toBeNull();
            const restored = editor.getSelection();
            expect(restored.collapsed).toBe(true);
            const restoredText = squireContainer.querySelector('div')!
                .firstChild as Text;
            expect(restored.startContainer).toBe(restoredText);
            expect(restored.startOffset).toBe(6);
        });

        it('round-trips a non-collapsed selection through getHTML(true)', () => {
            editor.setHTML('<div>hello world</div>');
            const text = squireContainer.querySelector('div')!
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(text, 0);
            range.setEnd(text, 5);
            editor.setSelection(range);

            const html = editor.getHTML(true);
            editor.setHTML(html);

            const restored = editor.getSelection();
            expect(restored.collapsed).toBe(false);
            expect(restored.toString()).toBe('hello');
        });
    });

    describe('undo and redo', () => {
        // MutationObserver callbacks (which Squire uses to detect DOM
        // changes) are delivered as microtasks. Flush them so
        // _docWasChanged runs and _isInUndoState is reset before we ask
        // for an undo.
        const flushMutations = () =>
            new Promise<void>((resolve) => setTimeout(resolve, 0));

        it('restores prior content after undo, and the new state after redo', async () => {
            editor.setHTML('<div>hello</div>');
            // Flush so _docWasChanged runs and _isInUndoState resets.
            // Without this, the post-setHTML mutation queue collides with
            // the next saveUndoState and the second history entry is
            // never recorded.
            await flushMutations();
            const text = squireContainer.querySelector('div')!
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(text, 5);
            range.collapse(true);
            editor.setSelection(range);

            editor.insertHTML('world');
            await flushMutations();
            expect(squireContainer.textContent).toBe('helloworld');

            editor.undo();
            await flushMutations();
            expect(squireContainer.textContent).toBe('hello');

            editor.redo();
            await flushMutations();
            expect(squireContainer.textContent).toBe('helloworld');
        });
    });

    describe('Delete key handler', () => {
        function dispatchKey(key: string): void {
            const event = new KeyboardEvent('keydown', {
                key,
                code: key,
                bubbles: true,
                cancelable: true,
            });
            editor.fireEvent('keydown', event);
        }

        it('deletes a non-collapsed selection in place', () => {
            editor.setHTML('<div>hello world</div>');
            const text = squireContainer.querySelector('div')!
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(text, 5);
            range.setEnd(text, 11);
            editor.setSelection(range);

            dispatchKey('Delete');
            expect(squireContainer.textContent).toBe('hello');
        });

        it('merges next block when cursor is at end of a block', () => {
            editor.setHTML('<div>hello</div><div>world</div>');
            const firstText = squireContainer.querySelectorAll('div')[0]
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(firstText, firstText.data.length);
            range.collapse(true);
            editor.setSelection(range);

            dispatchKey('Delete');
            // Two blocks should now be merged into one with combined text.
            expect(squireContainer.querySelectorAll('div').length).toBe(1);
            expect(squireContainer.textContent).toBe('helloworld');
        });
    });

    describe('Backspace key handler', () => {
        function dispatchKey(key: string): void {
            const event = new KeyboardEvent('keydown', {
                key,
                code: key,
                bubbles: true,
                cancelable: true,
            });
            editor.fireEvent('keydown', event);
        }

        it('deletes a non-collapsed selection in place', () => {
            editor.setHTML('<div>hello world</div>');
            const text = squireContainer.querySelector('div')!
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(text, 0);
            range.setEnd(text, 6);
            editor.setSelection(range);

            dispatchKey('Backspace');
            expect(squireContainer.textContent).toBe('world');
        });

        it('merges with previous block when cursor is at start of a block', () => {
            editor.setHTML('<div>hello</div><div>world</div>');
            const secondText = squireContainer.querySelectorAll('div')[1]
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(secondText, 0);
            range.collapse(true);
            editor.setSelection(range);

            dispatchKey('Backspace');
            expect(squireContainer.querySelectorAll('div').length).toBe(1);
            expect(squireContainer.textContent).toBe('helloworld');
        });
    });

    describe('bold formatting', () => {
        it('wraps selected text in <b>', () => {
            editor.setHTML('<div>hello world</div>');
            const text = squireContainer.querySelector('div')!
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(text, 0);
            range.setEnd(text, 5);
            editor.setSelection(range);

            editor.bold();
            expect(squireContainer.querySelector('b')!.textContent).toBe(
                'hello',
            );
        });

        it('unwraps when the selection is already bold', () => {
            editor.setHTML('<div><b>hello</b> world</div>');
            const boldText = squireContainer.querySelector('b')!
                .firstChild as Text;
            const range = document.createRange();
            range.setStart(boldText, 0);
            range.setEnd(boldText, 5);
            editor.setSelection(range);

            editor.removeBold();
            expect(squireContainer.querySelector('b')).toBeNull();
            expect(squireContainer.textContent).toBe('hello world');
        });
    });

    afterEach(() => {
        editor = null as any;
        document.body.innerHTML = `<div id="squire">`;
    });
});
