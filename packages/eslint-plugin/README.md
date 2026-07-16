<h1 align="center">
    <a href="https://github.com/ODGodinho">
        <img
            src="https://raw.githubusercontent.com/ODGodinho/Stanley-TheTemplate/main/public/images/Stanley.jpg"
            alt="Stanley Imagem" width="500"
        />
    </a>
    <br />
    ODG linter Plugin
    <br />
</h1>

# Table of Contents

- [🎇 Benefits](#-benefits)
- [📗 Libraries](#-libraries)
- [📁 Dependencies](#-dependencies)
  - [💻 Rules](#-rules)
    - [No Inconsistent Docblock](#no-inconsistent-docblock)
  - [📍 Start Project](#-start-project)
  - [📨 Build and Run](#-build-and-run)
  - [🧪 Teste Code](#-teste-code)

---

## 🎇 Benefits

- 🚀 Speed start new project or package using typescript
- 🚨 Over 800 rules for pattern, possible errors and errors in Linter
- 🎇 Code quality guaranteed
- 📢 AutoReview when opening a pull-request/merge
    ![AutoReview Comment example](https://user-images.githubusercontent.com/3797062/97085944-87233a80-165b-11eb-94a8-0a47d5e24905.png)
- 🧪 Automatic Test when opening pull-request/merge
- 📈 Automatic Code Coverage when opening pull-request/merge
    ![Code Coverage example](https://app.codecov.io/static/media/codecov-report.eeef5dba5ea18b5ed6a4.png)
- 📦 Automatic Package and release generate on merge
- 🪝 Run Lint/Test command pre-commit execute

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

## ⏩ Get Started

---

### 💻 Rules

#### No Inconsistent Docblock

Validate Docblock with typescript types

👍 Examples of correct code

```typescript
/**
 * Valid Param
 *
 * @param {string} param
 */
function name(param: string) {

}

/**
 * Valid return
 *
 * @returns {string}
 */
function name2(): string {

}
```

👎 Examples of incorrect code

```typescript
/**
 * Valid Param
 *
 * @param {number} param
 */
function name(param: string) {

}

/**
 * Valid return
 *
 * @returns {number}
 */
function name2(): string {

}
```

### 📍 Start Project

First install dependencies with the following command

```bash
yarn install
# or
npm install
```

## 📨 Build and Run

To build the project, you can use the following command

> if you change files, you need to run `yarn build` and `yarn start` again

```bash
yarn build && yarn start
# or
yarn dev
```

## 🧪 Teste Code

To Test execute this command

```bash
yarn test
# or
yarn test:watch
```
