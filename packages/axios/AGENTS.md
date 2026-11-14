## @odg/axios - Consumer Guide

## 🎯 Purpose: Propósito da lib para quem a importa.

- Implementação de `MessageInterface` sobre `axios` (`AxiosInstance`), com respostas como `MessageResponse` (`@odg/message`).
- Conversão explícita entre config Axios e mensagens via parsers estáticos exportados.
- Ao importar o pacote, erros típicos de requisição Axios (`AxiosError`) passam a ser expostos como `MessageException` (`@odg/message`) no fluxo de erros da aplicação (efeito colateral ao carregar o módulo).

## 📜 Contracts: Interfaces e tipos essenciais.

**Exportados pelo entrypoint (`main` / `types`):** `AxiosMessage`, `AxiosInterceptor` (abstrata), `AxiosInterceptorRequest`, `AxiosInterceptorResponse`, `AxiosRequestParser`, `AxiosResponseParser`.

- **`AxiosMessage<RequestData, ResponseData, Options>`:** `request(options)` → `Promise<MessageResponse<...>>`; `interceptors.request` / `interceptors.response`; `setDefaultOptions` / `getDefaultOptions`; construtor aceita `Options` (padrão `RequestOptionsParametersInterface<RequestData>`; subclasses como `TlsMessage` passam o próprio tipo). Defaults seguem a regra do `@odg/message/AGENTS.md`: guardados na instância e mesclados depois dos interceptors de request, antes de chamar o axios.
- **`AxiosInterceptorRequest`:** `use(onFulfilled?, onRejected?)` — guarda os interceptors de request, que o `AxiosMessage` roda antes do axios (`options`/`synchronous` não se aplica).
- **`AxiosInterceptorResponse`:** `use(onFulfilled?, onRejected?, _options?)` — terceiro parâmetro não é repassado ao Axios (ignorado na implementação).
- **`AxiosRequestParser` / `AxiosResponseParser`:** apenas métodos `static` `parseMessageToLibrary` / `parseLibraryToMessage` (mapeamento bidirecional).
- Tipos de domínio de requisição/resposta vêm de **`@odg/message`**; formas Axios de **`axios`** nas assinaturas inferidas. `AxiosRequestConfigExtra` não é reexportado pelo entrypoint — uso indireto via classes acima.

## Rules

- Don't use AxiosError use `MessageException`, `MessageUnknownException`.
- **`AxiosMessage.request`:** em erro na chamada HTTP, o que sobe ao `await` é em geral **`MessageException`** (salvo recuperação via interceptor — ver abaixo).
- Chaves de opção que começam com `$` são preservadas nos objetos montados pelos parsers (comportamento intencional de extensão).
- Interceptors de request rodam no `AxiosMessage`, antes do axios e dos defaults, na mesma ordem do axios (o último registrado roda primeiro); `onRejected` só trata erros dos interceptors anteriores. Interceptors de response rodam no axios. Como no axios, erro de interceptor de request que nenhum `onRejected` resolveu pula a chamada HTTP e passa pelos `onRejected` de response (ex.: logger).

**Interceptor de request (`AxiosInterceptorRequest`):**

- **`onFulfilled`:** recebe **`RequestInterface<RequestData>`** só com o que a request mandou (sem os defaults) e deve **retornar `RequestInterface<RequestData>`**; o retorno é mesclado sobre a request atual (`{ ...config, ...retorno }`).
- **`onRejected`:** recebe uma **`Exception`** já normalizada (**`MessageException`** / **`MessageUnknownException`**). Para o erro **chegar à aplicação** em `AxiosMessage.request()`, o handler deve **`throw`** (de novo) essa ou outra exceção. Se **retornar** uma request, ela segue para o próximo interceptor.

**Interceptor de response (`AxiosInterceptorResponse`):**

- **`onFulfilled`:** recebe **`MessageResponse<RequestData, ResponseData>`** e deve **retornar o mesmo tipo** `MessageResponse<RequestData, ResponseData>` (resposta que seguirá na cadeia / para o `request()`).
- **`onRejected`:** recebe **`Exception`** (**`MessageException`** / **`MessageUnknownException`**). Para o erro **rejeitar** `AxiosMessage.request()`, o handler deve **`throw`**. Se em vez de `throw` o handler **retornar** um **`MessageResponse<RequestData, ResponseData>`**, o erro é **ignorado** para fins de falha: a promessa de `AxiosMessage.request()` **resolve** com essa resposta **sem** lançar — comportamento de recuperação no Axios após conversão para resposta interna.

**Sem `onRejected` no interceptor:** o erro sobe até `AxiosMessage.request()`, que lança a exceção normalizada por `Exception.parse`. No response, a lib lança a normalizada ou `MessageUnknownException` (“Axios Message empty error”) quando não há erro reconhecível.

## 💥 Exceptions: Erros da API pública — quando e como tratar.

- **Erro na requisição (`AxiosMessage.request`):** em falha na chamada, o consumidor recebe **`MessageException`** ou **`MessageUnknownException`** (`@odg/message`); tipos definidos em `packages/message/src/messages/MessageException.ts` e `packages/message/src/messages/MessageUnknownException.ts` (exportados pelo pacote).
- **Ramo de erro dos interceptors:** **`MessageException`** / **`MessageUnknownException`** quando a lib **lança** (sem `onRejected`) ou quando o **`onRejected` faz `throw`**. Se `onRejected` **retornar** `MessageResponse<...>` (response), **`AxiosMessage.request()` não falha** — resolve com essa resposta.
- **Import de `@odg/axios`:** erros Axios no pipeline global tendem a aparecer como **`MessageException`** (instância pode expor `isAxiosError` de forma não enumerável — detalhe em `@odg/message`).

## ⚠️ Integration Pitfalls: Pré-condições e riscos.

- **`@odg/exception` e `@odg/message` são dependências de runtime** para `AxiosMessage` e o registro de erros Axios; peers opcionais no `package.json` não dispensam instalá-los para esse uso.
- **Qualquer `import '@odg/axios'`** altera o comportamento global de normalização de erros Axios para `MessageException` no processo.
- **Response interceptor:** opções não são repassadas via `_options` (parâmetro ignorado).
- **`getDefaultOptions()`** devolve só os defaults da instância (sem `ODGMessage.defaultOptions` e sem os defaults internos do axios).
