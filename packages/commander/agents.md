## @odg/command - Consumer Guide

## 🎯 Purpose
- CLI (`odg`) para gerar arquivos TypeScript a partir de templates em `stubs/` (pages, selectors, handlers, events, exceptions)
- Uso típico: projeto com dependência `@odg/command` e execução via `yarn odg` ou bin local após instalar

## 📜 Contracts
- **Binário**: campo `bin` do pacote → executável `odg` (ponto de entrada: `dist/index.js` via `odg.js`; **não há exports** para `import` a partir do `main`)
- **Comandos** (subcomando + argumento posicional + flags; `--help` por comando):
  - `make:page <pageName>` — `-p/--path` (default `./src/Pages/`), `--selectors`, `--selectorPath`, `-e/--event`, `--eventPath`, `--handlerPath`, `--handler-from`, `--handler-to`
  - `make:selector <selectorName>` — `-p/--path` (default `./src/Selectors/`)
  - `make:handler <handlerName>` — `--handler-from`, `--handler-to`, `-p/--path` (default `./src/Handlers/`)
  - `make:event <eventName>` — `-p/--path` (default `./src/app/Listeners`)
  - `make:exception <exceptionName>` — `-u/--isUnknown`, `-p/--path` (default `./src/Exceptions`)
- **Nome de classe do handler** (`make:handler`): sem `--handler-from` e sem `--handler-to` → `{UcFirst(handlerName)}Handler`; com qualquer uma das flags → `{UcFirst(from)}To{UcFirst(to)}Handler`, com `from`/`to` defaultando para `<handlerName>` quando omitidos
- **Stubs publicados**: pasta `stubs/` no pacote; resolução em runtime: `./stubs` relativo ao CWD, senão `node_modules/@odg/command/stubs`

## 🚦 Rules (Usage)
- Trate como **ferramenta de linha de comando**, não como biblioteca importável pelo `main`
- Rode a partir da **raiz do app** onde paths default fazem sentido (ou passe `-p`/`--path` explícito)
- `make:page` só dispara geração de handler extra se existir `handlerPath` **e** (`handlerFrom` **ou** `handlerTo`); caso contrário não chama `make:handler` embutido

## 💥 Exceptions
- `InvalidArgumentException` (`@odg/exception`): ao gerar arquivo cujo `.ts` de destino **já existe** — mensagem do tipo `The {name} already exists.`
  - Tratamento: não criar de novo com o mesmo nome no mesmo path; apagar/renomear o arquivo existente ou mudar `-p`/nome
- Falhas de I/O do Node (leitura de stub, escrita, mkdir) podem propagar erro nativo não encapsulado em tipo próprio do pacote

## ⚠️ Integration Pitfalls
- Paths default assumem layout com `src/...`; projetos diferentes exigem `-p` consistente
- Se existir `index.ts` no diretório de destino, o gerador pode **append** `export * from "./{NomeArquivo}";` — risco de duplicata ou ordem de exports indesejada
- Stubs em `./stubs` no CWD **substituem** os stubs do pacote para aquele nome de arquivo `.stub`
- `main`/`types` apontam para `dist/` de runtime CLI; não espere tipos públicos de API programática além do que o pacote exporta em `package.json` (hoje: foco no bin + assets)
