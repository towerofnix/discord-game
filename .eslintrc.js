module.exports = {
  extends: 'eslint:recommended',
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
  // See https://eslint.org/docs/rules/
  // Rules are sorted and grouped as on the site.
  rules: {
    'strict': 'warn',

    'no-unused-vars': [ 'warn', { args: 'none' } ],

    'array-bracket-newline': [ 'error', 'consistent' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'block-spacing': [ 'error', 'always' ],
    'brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],
    'camelcase': [ 'error', { properties: 'always' } ],
    'comma-dangle': [ 'error', 'only-multiline' ],
    'comma-spacing': [ 'error', { before: false, after: true } ],
    'comma-style': [ 'error', 'last' ],
    'capitalized-comments': [ 'error', 'always', {
      ignoreConsecutiveComments: true,
      ignoreInlineComments: true,
    }],
    'computed-property-spacing': [ 'error', 'never' ],
    'eol-last': [ 'error', 'always' ],
    'func-call-spacing': [ 'error', 'never' ],
    'indent': [ 'error', 2, { SwitchCase: 1 } ],
    'key-spacing': [ 'error', { beforeColon: false, afterColon: true } ],
    'keyword-spacing': [ 'error', { before: true, after: true } ],
    'linebreak-style': [ 'error', 'unix' ],
    'lines-between-class-members': [ 'error', 'always', { exceptAfterSingleLine: true } ],
    'new-cap': 'warn',
    // what do we think about `new-parens`?
    'no-array-constructor': 'error',
    'no-lonely-if': 'warn',
    'no-mixed-operators': 'warn',
    'no-multiple-empty-lines': 'warn',
    'no-new-object': 'error',
    'no-trailing-spaces': 'error',
    'no-unneeded-ternary': 'warn',
    'object-curly-newline': [ 'error', { consistent: true } ],
    'object-curly-spacing': [ 'error', 'always' ],
    'one-var': [ 'warn', { const: 'never' } ],
    'operator-assignment': [ 'warn', 'always' ],
    'semi': [ 'error', 'never' ],
    'space-before-blocks': [ 'error', 'always' ],
    'space-before-function-paren': [ 'error', 'never' ],
    'space-in-parens': [ 'error', 'never' ],
    'space-infix-ops': 'error',
    'space-unary-ops': [ 'error', {
      words: true,
      nonwords: false,
    }],
    'spaced-comment': [ 'error', 'always' ],
    'switch-colon-spacing': 'error',
    'template-tag-spacing': [ 'error', 'never' ],
    'unicode-bom': [ 'error', 'never' ],

    'arrow-body-style': [ 'warn', 'as-needed' ],
    'arrow-spacing': [ 'error' ],
    'prefer-const': 'warn',
  }
};
