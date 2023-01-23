import type { Squire } from '../Editor';

// ---

const Enter = (self: Squire, event: KeyboardEvent, range: Range): void => {
    event.preventDefault();
    self.splitBlock(event.shiftKey, range);
};

// ---

export { Enter };
