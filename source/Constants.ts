const DOCUMENT_POSITION_PRECEDING = 2; // Node.DOCUMENT_POSITION_PRECEDING
const ELEMENT_NODE = 1; // Node.ELEMENT_NODE;
const TEXT_NODE = 3; // Node.TEXT_NODE;
const DOCUMENT_NODE = 9; // Node.DOCUMENT_NODE;
const DOCUMENT_FRAGMENT_NODE = 11; // Node.DOCUMENT_FRAGMENT_NODE;

const ZWS = '\u200B';

const ua = navigator.userAgent;

const isMac = /Mac OS X/.test(ua);
const isWin = /Windows NT/.test(ua);
const isIOS =
    /iP(?:ad|hone|od)/.test(ua) || (isMac && !!navigator.maxTouchPoints);
const isAndroid = /Android/.test(ua);

const isGecko = /Gecko\//.test(ua);
const isLegacyEdge = /Edge\//.test(ua);
const isWebKit = !isLegacyEdge && /WebKit\//.test(ua);

const ctrlKey = isMac || isIOS ? 'Meta-' : 'Ctrl-';

const cantFocusEmptyTextNodes = isWebKit;

const supportsInputEvents =
    'onbeforeinput' in document && 'inputType' in new InputEvent('input');

// Use [^ \t\r\n] instead of \S so that nbsp does not count as white-space
const notWS = /[^ \t\r\n]/;

// ---

export {
    DOCUMENT_POSITION_PRECEDING,
    ELEMENT_NODE,
    TEXT_NODE,
    DOCUMENT_NODE,
    DOCUMENT_FRAGMENT_NODE,
    notWS,
    ZWS,
    ua,
    isMac,
    isWin,
    isIOS,
    isAndroid,
    isGecko,
    isLegacyEdge,
    isWebKit,
    ctrlKey,
    cantFocusEmptyTextNodes,
    supportsInputEvents,
};
