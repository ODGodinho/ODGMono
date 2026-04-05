#!/usr/bin/env bash

# Interrompe o script imediatamente se houver qualquer erro
set -e

echo "🚀 Iniciando a construção do Monorepo ODG (Yarn 4 + Turborepo + Semantic Release)..."

MONOREPO_DIR="odg-monorepo"
mkdir -p "$MONOREPO_DIR"
cd "$MONOREPO_DIR"

# 1. Inicializa o Git
echo "📦 Inicializando Git..."
git init

# 2. Configura o Yarn 4 com Node Modules (Evita quebra de compatibilidade com PnP)
echo "🧶 Configurando Yarn 4..."
corepack enable
yarn set version stable
echo "nodeLinker: node-modules" > .yarnrc.yml

# 3. Cria o package.json raiz (O Orquestrador)
echo "📄 Criando package.json raiz..."
cat << 'EOF' > package.json
{
  "name": "@odg/monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "test:ci": "turbo run test:ci",
    "lint": "turbo run lint",
    "tsc": "turbo run tsc",
    "release": "multi-semantic-release",
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "turbo": "^1.12.0",
    "multi-semantic-release": "^3.0.2",
    "@semantic-release/commit-analyzer": "^11.1.0",
    "@semantic-release/release-notes-generator": "^12.1.0",
    "@semantic-release/npm": "^11.0.2",
    "@semantic-release/github": "^9.2.6"
  }
}
EOF

# 4. Cria a configuração do Turborepo
echo "🌪️ Criando turbo.json..."
cat << 'EOF' > turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "test:ci": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "tsc": {
      "dependsOn": ["^tsc"]
    }
  }
}
EOF

# 5. Cria a configuração do Semantic Release Global
echo "🏷️ Criando .releaserc.js..."
cat << 'EOF' > .releaserc.js
module.exports = {
  branches: ["main", "master"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
};
EOF

# 6. Cria a configuração do Lint-Staged raiz
echo "🧹 Criando .lintstagedrc.js..."
cat << 'EOF' > .lintstagedrc.js
module.exports = {
  "packages/**/*.{ts,js,json,md}": [
    "eslint --fix",
    "prettier --write"
  ]
};
EOF

# 7. Criação das Actions do GitHub (CI e Release)
echo "🤖 Criando GitHub Actions..."
mkdir -p .github/workflows

# Action de CI (Pull Requests)
cat << 'EOF' > .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, master]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Yarn
        run: corepack enable

      - name: Get Yarn cache directory path
        id: yarn-cache-dir-path
        run: echo "dir=$(yarn config get cacheFolder)" >> $GITHUB_OUTPUT

      - name: Cache Yarn dependencies
        uses: actions/cache@v4
        with:
          path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-

      - name: Install Dependencies
        run: yarn install --immutable

      - name: Typecheck
        run: yarn tsc --noEmit

      - name: Lint
        run: yarn lint

      - name: Build
        run: yarn build

      - name: Test CI
        run: yarn test:ci
EOF

# Action de Release (Push na Main)
cat << 'EOF' > .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main, master]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'

      - name: Setup Yarn
        run: corepack enable

      - name: Install Dependencies
        run: yarn install --immutable

      - name: Build All
        run: yarn build

      - name: Multi Semantic Release
        run: yarn release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
EOF

# 8. Clonando e mapeando os micro-pacotes
echo "📥 Clonando repositórios..."
mkdir -p packages

# Array Mapeando "RepoGithub:NomeDaPasta"
REPOS=(
  "ODGMessage:message"
  "ODGConfig:config"
  "ODGTls:tls"
  "ODGAxios:axios"
  "ODGCache:cache"
  "ODGLog:log"
  "ODGCommander:commander"
  "ODGException:exception"
  "ChemicalX:chemicalx"
  "ODGEvents:events"
  "ODGGraylog:graylog"
  "ODGJSONLog:json-log"
  "ODGTsConfig:tsconfig"
  "ODG-Linter-JS:eslint-config"
)

for repo_info in "${REPOS[@]}"; do
  REPO_NAME="${repo_info%%:*}"
  FOLDER_NAME="${repo_info##*:}"

  echo "  -> Baixando $REPO_NAME para packages/$FOLDER_NAME..."
  git clone "https://github.com/ODGodinho/$REPO_NAME.git" "packages/$FOLDER_NAME" --quiet

  # Remove o .git para integrar ao monorepo (evita submodules)
  rm -rf "packages/$FOLDER_NAME/.git"
  rm -rf "packages/$FOLDER_NAME/.git"

  # Limpando arquivos de lock e config isolados do NPM/Yarn
  rm -rf "packages/$FOLDER_NAME/yarn.lock"
  rm -rf "packages/$FOLDER_NAME/.yarnrc.yml"
  rm -rf "packages/$FOLDER_NAME/.yarn"
  rm -rf "packages/$FOLDER_NAME/package-lock.json"

  # 🧹 Limpeza de Monorepo (Apagando lixo de repositório individual)
  rm -rf "packages/$FOLDER_NAME/.github"
  rm -rf "packages/$FOLDER_NAME/.husky"
done

# 9. Instalação das dependências e link dos workspaces
echo "🔗 Executando Yarn Install global (isso pode levar alguns minutos)..."
yarn install

# 10. Configuração do Husky (Pre-commit hook)
echo "🐶 Configurando Husky e Pre-commit..."
yarn husky init

cat << 'EOF' > .husky/pre-commit
#!/usr/bin/env sh
yarn tsc --noEmit
yarn lint-staged
yarn build
yarn test:ci
EOF
chmod +x .husky/pre-commit

echo ""
echo "✅=====================================================✅"
echo "   MONOREPO ODG CONSTRUÍDO COM SUCESSO!"
echo "✅=====================================================✅"
echo ""
echo "Estrutura gerada:"
echo "- 📁 packages/ (Seus 14 repositórios, incluindo o eslint-config)"
echo "- 📁 .github/workflows/ (ci.yml e release.yml prontos)"
echo "- 📄 package.json (Orquestrador com Turborepo)"
echo "- 📄 .releaserc.js (Multi-Semantic-Release)"
echo "- 🐶 .husky/pre-commit (Seus hooks exatos)"
