module.exports = {
    "env": {
        "commonjs": true,
        "es2021": true,
        "node": true
    },
    "extends": ["eslint:recommended", "node"],
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "object-curly-spacing": ["error", "always"],
        "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }],
        "comma-dangle": ["error", "only-multiline"],
        "semi": "error",
        "import/no-commonjs": ['off']
    },
};
