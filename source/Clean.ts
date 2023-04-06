import { notWS } from './Constants';
import { TreeIterator, SHOW_ELEMENT_OR_TEXT } from './node/TreeIterator';
import { createElement, empty, detach, replaceWith } from './node/Node';
import { isInline, isLeaf } from './node/Category';
import { fixContainer } from './node/MergeSplit';
import { isLineBreak } from './node/Whitespace';

import type { SquireConfig } from './Editor';

// ---

type StyleRewriter = (
    node: HTMLElement,
    parent: Node,
    config: SquireConfig,
) => HTMLElement;

// ---

const styleToSemantic: Record<
    string,
    { regexp: RegExp; replace: (x: any, y: string) => HTMLElement }
> = {
    'font-weight': {
        regexp: /^bold|^700/i,
        replace(): HTMLElement {
            return createElement('B');
        },
    },
    'font-style': {
        regexp: /^italic/i,
        replace(): HTMLElement {
            return createElement('I');
        },
    },
    'font-family': {
        regexp: notWS,
        replace(
            classNames: { fontFamily: string },
            family: string,
        ): HTMLElement {
            return createElement('SPAN', {
                class: classNames.fontFamily,
                style: 'font-family:' + family,
            });
        },
    },
    'font-size': {
        regexp: notWS,
        replace(classNames: { fontSize: string }, size: string): HTMLElement {
            return createElement('SPAN', {
                class: classNames.fontSize,
                style: 'font-size:' + size,
            });
        },
    },
    'text-decoration': {
        regexp: /^underline/i,
        replace(): HTMLElement {
            return createElement('U');
        },
    },
};

const replaceStyles = (
    node: HTMLElement,
    _: Node,
    config: SquireConfig,
): HTMLElement => {
    const style = node.style;
    let newTreeBottom: HTMLElement | undefined;
    let newTreeTop: HTMLElement | undefined;

    for (const attr in styleToSemantic) {
        const converter = styleToSemantic[attr];
        const css = style.getPropertyValue(attr);
        if (css && converter.regexp.test(css)) {
            const el = converter.replace(config.classNames, css);
            if (
                el.nodeName === node.nodeName &&
                el.className === node.className
            ) {
                continue;
            }
            if (!newTreeTop) {
                newTreeTop = el;
            }
            if (newTreeBottom) {
                newTreeBottom.appendChild(el);
            }
            newTreeBottom = el;
            node.style.removeProperty(attr);
        }
    }

    if (newTreeTop && newTreeBottom) {
        newTreeBottom.appendChild(empty(node));
        if (node.style.cssText) {
            node.appendChild(newTreeTop);
        } else {
            replaceWith(node, newTreeTop);
        }
    }

    return newTreeBottom || node;
};

const replaceWithTag = (tag: string) => {
    return (node: HTMLElement, parent: Node) => {
        const el = createElement(tag);
        const attributes = node.attributes;
        for (let i = 0, l = attributes.length; i < l; i += 1) {
            const attribute = attributes[i];
            el.setAttribute(attribute.name, attribute.value);
        }
        parent.replaceChild(el, node);
        el.appendChild(empty(node));
        return el;
    };
};

const fontSizes: Record<string, string> = {
    '1': '10',
    '2': '13',
    '3': '16',
    '4': '18',
    '5': '24',
    '6': '32',
    '7': '48',
};

const stylesRewriters: Record<string, StyleRewriter> = {
    STRONG: replaceWithTag('B'),
    EM: replaceWithTag('I'),
    INS: replaceWithTag('U'),
    STRIKE: replaceWithTag('S'),
    SPAN: replaceStyles,
    FONT: (
        node: HTMLElement,
        parent: Node,
        config: SquireConfig,
    ): HTMLElement => {
        const font = node as HTMLFontElement;
        const face = font.face;
        const size = font.size;
        let color = font.color;
        const classNames = config.classNames;
        let fontSpan: HTMLElement;
        let sizeSpan: HTMLElement;
        let colorSpan: HTMLElement;
        let newTreeBottom: HTMLElement | undefined;
        let newTreeTop: HTMLElement | undefined;
        if (face) {
            fontSpan = createElement('SPAN', {
                class: classNames.fontFamily,
                style: 'font-family:' + face,
            });
            newTreeTop = fontSpan;
            newTreeBottom = fontSpan;
        }
        if (size) {
            sizeSpan = createElement('SPAN', {
                class: classNames.fontSize,
                style: 'font-size:' + fontSizes[size] + 'px',
            });
            if (!newTreeTop) {
                newTreeTop = sizeSpan;
            }
            if (newTreeBottom) {
                newTreeBottom.appendChild(sizeSpan);
            }
            newTreeBottom = sizeSpan;
        }
        if (color && /^#?([\dA-F]{3}){1,2}$/i.test(color)) {
            if (color.charAt(0) !== '#') {
                color = '#' + color;
            }
            colorSpan = createElement('SPAN', {
                class: classNames.color,
                style: 'color:' + color,
            });
            if (!newTreeTop) {
                newTreeTop = colorSpan;
            }
            if (newTreeBottom) {
                newTreeBottom.appendChild(colorSpan);
            }
            newTreeBottom = colorSpan;
        }
        if (!newTreeTop || !newTreeBottom) {
            newTreeTop = newTreeBottom = createElement('SPAN');
        }
        parent.replaceChild(newTreeTop, font);
        newTreeBottom.appendChild(empty(font));
        return newTreeBottom;
    },
    TT: (node: Node, parent: Node, config: SquireConfig): HTMLElement => {
        const el = createElement('SPAN', {
            class: config.classNames.fontFamily,
            style: 'font-family:menlo,consolas,"courier new",monospace',
        });
        parent.replaceChild(el, node);
        el.appendChild(empty(node));
        return el;
    },
};

const allowedBlock =
    /^(?:A(?:DDRESS|RTICLE|SIDE|UDIO)|BLOCKQUOTE|CAPTION|D(?:[DLT]|IV)|F(?:IGURE|IGCAPTION|OOTER)|H[1-6]|HEADER|L(?:ABEL|EGEND|I)|O(?:L|UTPUT)|P(?:RE)?|SECTION|T(?:ABLE|BODY|D|FOOT|H|HEAD|R)|COL(?:GROUP)?|UL)$/;

const blacklist = /^(?:HEAD|META|STYLE)/;

/*
    Two purposes:

    1. Remove nodes we don't want, such as weird <o:p> tags, comment nodes
       and whitespace nodes.
    2. Convert inline tags into our preferred format.
*/
const cleanTree = (
    node: Node,
    config: SquireConfig,
    preserveWS?: boolean,
): Node => {
    const children = node.childNodes;

    let nonInlineParent = node;
    while (isInline(nonInlineParent)) {
        nonInlineParent = nonInlineParent.parentNode!;
    }
    const walker = new TreeIterator<Element | Text>(
        nonInlineParent,
        SHOW_ELEMENT_OR_TEXT,
    );

    for (let i = 0, l = children.length; i < l; i += 1) {
        let child = children[i];
        const nodeName = child.nodeName;
        const rewriter = stylesRewriters[nodeName];
        if (child instanceof HTMLElement) {
            const childLength = child.childNodes.length;
            if (rewriter) {
                child = rewriter(child, node, config);
            } else if (blacklist.test(nodeName)) {
                node.removeChild(child);
                i -= 1;
                l -= 1;
                continue;
            } else if (!allowedBlock.test(nodeName) && !isInline(child)) {
                i -= 1;
                l += childLength - 1;
                node.replaceChild(empty(child), child);
                continue;
            }
            if (childLength) {
                cleanTree(child, config, preserveWS || nodeName === 'PRE');
            }
        } else {
            if (child instanceof Text) {
                let data = child.data;
                const startsWithWS = !notWS.test(data.charAt(0));
                const endsWithWS = !notWS.test(data.charAt(data.length - 1));
                if (preserveWS || (!startsWithWS && !endsWithWS)) {
                    continue;
                }
                // Iterate through the nodes; if we hit some other content
                // before the start of a new block we don't trim
                if (startsWithWS) {
                    walker.currentNode = child;
                    let sibling;
                    while ((sibling = walker.previousPONode())) {
                        if (
                            sibling.nodeName === 'IMG' ||
                            (sibling instanceof Text &&
                                notWS.test(sibling.data))
                        ) {
                            break;
                        }
                        if (!isInline(sibling)) {
                            sibling = null;
                            break;
                        }
                    }
                    data = data.replace(/^[ \t\r\n]+/g, sibling ? ' ' : '');
                }
                if (endsWithWS && data !== '-- ') {
                    walker.currentNode = child;
                    let sibling;
                    while ((sibling = walker.nextNode())) {
                        if (
                            sibling.nodeName === 'IMG' ||
                            (sibling instanceof Text &&
                                notWS.test(sibling.data))
                        ) {
                            break;
                        }
                        if (!isInline(sibling)) {
                            sibling = null;
                            break;
                        }
                    }
                    data = data.replace(/[ \t\r\n]+$/g, sibling ? ' ' : '');
                }
                if (data) {
                    child.data = data;
                    continue;
                }
            }
            node.removeChild(child);
            i -= 1;
            l -= 1;
        }
    }
    return node;
};

// ---

const removeEmptyInlines = (node: Node): void => {
    const children = node.childNodes;
    let l = children.length;
    while (l--) {
        const child = children[l];
        if (child instanceof Element && !isLeaf(child)) {
            removeEmptyInlines(child);
            if (isInline(child) && !child.firstChild) {
                node.removeChild(child);
            }
        } else if (child instanceof Text && !child.data) {
            node.removeChild(child);
        }
    }
};

// ---

// <br> elements are treated specially, and differently depending on the
// browser, when in rich text editor mode. When adding HTML from external
// sources, we must remove them, replacing the ones that actually affect
// line breaks by wrapping the inline text in a <div>. Browsers that want <br>
// elements at the end of each block will then have them added back in a later
// fixCursor method call.
const cleanupBRs = (
    node: Element | DocumentFragment,
    root: Element,
    keepForBlankLine: boolean,
): void => {
    const brs: NodeListOf<HTMLBRElement> = node.querySelectorAll('BR');
    const brBreaksLine: boolean[] = [];
    let l = brs.length;

    // Must calculate whether the <br> breaks a line first, because if we
    // have two <br>s next to each other, after the first one is converted
    // to a block split, the second will be at the end of a block and
    // therefore seem to not be a line break. But in its original context it
    // was, so we should also convert it to a block split.
    for (let i = 0; i < l; i += 1) {
        brBreaksLine[i] = isLineBreak(brs[i], keepForBlankLine);
    }
    while (l--) {
        const br = brs[l];
        // Cleanup may have removed it
        const parent = br.parentNode;
        if (!parent) {
            continue;
        }
        // If it doesn't break a line, just remove it; it's not doing
        // anything useful. We'll add it back later if required by the
        // browser. If it breaks a line, wrap the content in div tags
        // and replace the brs.
        if (!brBreaksLine[l]) {
            detach(br);
        } else if (!isInline(parent)) {
            fixContainer(parent, root);
        }
    }
};

// ---

const escapeHTML = (text: string): string => {
    return text
        .split('&')
        .join('&amp;')
        .split('<')
        .join('&lt;')
        .split('>')
        .join('&gt;')
        .split('"')
        .join('&quot;');
};

// ---

export { cleanTree, cleanupBRs, isLineBreak, removeEmptyInlines, escapeHTML };
