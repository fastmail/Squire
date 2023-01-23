/*global module */
module.exports = {
    ignorePatterns: ['/dist/**', '/node_modules/**'],
    env: {
        es6: true,
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    rules: {
        // To tighten up in the future
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        // Possible errors
        'no-constant-condition': ['error', { checkLoops: false }],
        'no-control-regex': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-prototype-builtins': 'off',
        'no-shadow': 'error',
        'no-useless-backreference': 'error',
        // Best practices
        'array-callback-return': 'error',
        'consistent-return': 'error',
        'curly': 'error',
        'default-case-last': 'error',
        'dot-notation': 'error',
        'eqeqeq': ['error', 'always', { null: 'ignore' }],
        'no-caller': 'error',
        'no-eval': 'error',
        'no-extra-bind': 'error',
        'no-floating-decimal': 'error',
        'no-implied-eval': 'error',
        'no-implicit-globals': 'error',
        'no-lone-blocks': 'error',
        'no-loop-func': 'error', // Not sure about this one; see if it hits
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-octal-escape': 'error',
        // 'no-plusplus': 'error',
        'no-return-assign': 'error',
        'no-script-url': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unused-expressions': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-useless-escape': 'off',
        'no-useless-return': 'error',
        'prefer-regex-literals': 'error',
        'radix': 'error',
        // Variables
        'no-label-var': 'error',
        // Stylistic issues
        'one-var': ['error', 'never'],
        'one-var-declaration-per-line': 'error',
        // ECMAScript 6
        'no-var': 'error',
        'prefer-arrow-callback': 'error',
        'prefer-const': 'error',
    },
};
