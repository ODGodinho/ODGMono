<h1 align="center">
    <a href="https://github.com/ODGodinho">
        <img
            src="https://raw.githubusercontent.com/ODGodinho/Stanley-TheTemplate/main/public/images/Stanley.jpg"
            alt="Stanley Imagem" width="500"
        />
    </a>
    <br />
    TLS Requester class for fingerprint
    <br />
</h1>

<h4 align="center">Using @odg/axios to request 📦!</h4>

<p align="center">

[![codecov](https://codecov.io/gh/ODGodinho/ODGTls/branch/main/graph/badge.svg?token=HNBNLLPZ3J)](https://codecov.io/gh/ODGodinho/ODGTls)
[![Stargazers](https://img.shields.io/github/stars/ODGodinho/ODGTls?color=F430A4)](https://github.com/ODGodinho/ODGTls/stargazers)
[![Made by ODGodinho](https://img.shields.io/badge/made%20by-ODGodinho-%2304A361)](https://www.linkedin.com/in/victor-alves-odgodinho/)
[![Forks](https://img.shields.io/github/forks/ODGodinho/ODGTls?color=CD4D34)](https://github.com/ODGodinho/ODGTls/network/members)
![Repository size](https://img.shields.io/github/repo-size/ODGodinho/ODGTls)
[![GitHub last commit](https://img.shields.io/github/last-commit/ODGodinho/ODGTls)](https://github.com/ODGodinho/ODGTls/commits/master)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](https://opensource.org/licenses/MIT)
[![StyleCI](https://github.styleci.io/repos/685343615/shield?branch=main)](https://github.styleci.io/repos/685343615?branch=main)

</p>

# Table of Contents

- [🎇 Benefits](#-benefits)
- [📗 Libraries](#-libraries)
- [📁 Dependencies](#-dependencies)
- [⏩ Get Started](#-get-started)
  - [🔘 Use Template](#-use-template)
  - [🔑 Configure Github Secrets](#-configure-github-secrets)
    - [🙈 Create Github Token](#-create-github-token)
    - [🍀 Code Coverage](#-code-coverage)
    - [📦 Create NPM Token](#-create-npm-token)
    - [🔐 Create project Environment](#-create-project-environment)
  - [💻 Prepare to develop](#-prepare-to-develop)
  - [📍 Start Project](#-start-project)
  - [📨 Build and Run](#-build-and-run)
  - [🧪 Teste Code](#-teste-code)

---

## 🎇 Benefits

- 🚀 Speed performance Inversion of control
- 🚨 Code Quality
- 🎇 Use Interface
- 🧪 Teste with 100% coverage

## 📗 Libraries

- [Node.js 18](https://nodejs.org/?n=dragonsgamers)
- [Typescript](https://www.typescriptlang.org/?n=dragonsgamers)
- [Eslint](https://eslint.org/?n=dragonsgamers)
- [ODG-Linter-JS](https://github.com/ODGodinho/ODG-Linter-Js?n=dragonsgamers)
- [EditorConfig](https://editorconfig.org/?n=dragonsgamers)
- [ReviewDog](https://github.com/reviewdog/action-eslint)

## 📁 Dependencies

- [Node.js](https://nodejs.org) 18 or later
- [Yarn](https://yarnpkg.com/) Optional/Recommended
- [ODG TsConfig](https://github.com/ODGodinho/tsconfig) Last Version
- [ODG Axios](https://github.com/ODGodinho/ODGAxios) Last Version

## ⏩ Get Started

> 🚩 You can use https://github.com/Carcraftz/TLS-Fingerprint-API and its forks to have an easy TLS server

---

### 🔘 Installation

```powershell
yarn add @odg/tls
```

### 💻 Usage

For simple example usage, you can use Inversify for Dependency Injection

```typescript
const tlsMessage = new TlsMessage({
  tls: {
    url: "http://localhost:8082",
  }
});

await tlsMessage.request({
    url: "https://tls.browserleaks.com/json",
});
```

### 📍 Start Project

First install dependencies with the following command

```bash
bun install
# or
npm install
```

## 📨 Build and Run

To build the project, you can use the following command

> if you change files, you need to run `bun run build` and `bun run start` again

```bash
bun run build && bun run start
# or
bun run dev
```

## 🧪 Teste Code

To Test execute this command

```bash
bun run test
# or
bun run test:watch
```
