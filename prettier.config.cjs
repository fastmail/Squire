/*global module */
module.exports = {
    singleQuote: true,
    tabWidth: 4,
    quoteProps: 'consistent',
    trailingComma: 'all',
    overrides: [
        {
            files: ['*.html'],
            options: {
                tabWidth: 2,
                printWidth: 1000,
            },
        },
    ],
};
