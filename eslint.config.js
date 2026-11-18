// ESLint 9 (config flat). Formatação fica com o Prettier: eslint-config-prettier desliga as regras de estilo.
import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default [
    {
        ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'Docs/', 'public/img/']
    },

    js.configs.recommended,

    // Servidor, scripts, testes e arquivos de configuração: Node, ES modules.
    {
        files: [
            '*.js',
            'controllers/**/*.js',
            'routes/**/*.js',
            'services/**/*.js',
            'middleware/**/*.js',
            'validations/**/*.js',
            'config/**/*.js',
            'scripts/**/*.js',
            'tests/**/*.js'
        ],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node
        }
    },

    // E2E e script de capturas: rodam no Node, mas os callbacks de page.evaluate rodam no navegador.
    {
        files: ['tests/e2e/**/*.js', 'scripts/**/*.js'],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser }
        }
    },

    // Front-end: scripts clássicos carregados com <script src> nas views.
    {
        files: ['public/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: globals.browser
        }
    },

    {
        rules: {
            // `x == null` (null ou undefined) é o único uso de == aceito.
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            'prefer-const': 'error',
            'no-var': 'error',
            'no-console': 'off'
        }
    },

    eslintConfigPrettier
];
