## @odg/tls - Consumer Guide

## 🎯 Purpose

- Cliente HTTP (Axios) que encaminha chamadas via servidor TLS/PopTLS: URL base do proxy em `tls.url`, destino real em `url`/`baseURL` da requisição.
- Tipagem de resposta (`TlsMessageResponse`) e de falha (`TlsMessageException`) alinhada a `@odg/message`.
- Import do pacote registra um parser em `@odg/exception` (efeito colateral ao carregar o módulo).

## 📜 Contracts

- `TlsMessage<RequestData, ResponseData>`: estende `AxiosMessage`; `constructor(config: TlsOptionsConstructorInterface<RequestData>)`; `request(options)` → `Promise<TlsMessageResponse<...>>`; `setDefaultOptions` / `getDefaultOptions`; `interceptors` (mesmo contrato de `@odg/message`); estáticos `isMessageError` e `isAxiosMessageToTlsError` (predicados para `TlsMessageException`).
- `TlsMessageResponse<RequestData, ResponseData>`: `request: TlsRequestInterface<RequestData>`; `response: ResponseInterface<ResponseData>` (`@odg/message`).
- `TlsMessageException<RequestData, ResponseData>`: estende `MessageUnknownException`; campos `message`, `preview?`, `code?`, `request?`, `response?` (request/resposta no vocabulário ODG).
- `TlsRequestInterface`: `RequestInterface` + `tls?: { url?: string; allowRedirect?: boolean }`.
- `TlsOptionsConstructorInterface`: `RequestOptionsParametersInterface` + `tls: { url: string; allowRedirect?: boolean }` (obrigatório na configuração base).
- `TlsAxiosRequestConfigExtra<RequestData>`: estende `AxiosRequestConfigExtra` com `$tlsOptions` (forma Axios; útil só se integrar com configs Axios cruas).

## 🚦 Rules (Usage)

- Instalar e declarar peers: `axios`, `@odg/axios`, `@odg/exception`, `@odg/message` (versões compatíveis com o monorepo).
- Construtor: sempre fornecer `tls.url` (endpoint do serviço TLS/PopTLS).
- `request()`: mesclar opções com a config base; não passar `tls: undefined` (sobrescreve o `tls` da base e pode quebrar o parser que exige `tls.url`).
- Guardas: `TlsMessage.isMessageError` exige `request.tls` truthy; `isAxiosMessageToTlsError` exige `request.$tlsOptions` (erro ainda no formato Axios interno). Escolher conforme a origem do valor.

## 💥 Exceptions

- `TlsMessage.request` propaga falhas via `Exception.parse` (`@odg/exception`): em fluxos Axios/TLS o parser global pode substituir por `TlsMessageException` (código em string no `code`, `preview` com o erro original).
- Outros tipos retornados por `Exception.parse` sem conversão TLS: tratar como no restante do stack ODG (não são específicos desta lib).
- `TlsMessageException` não é lançada pelo construtor das classes exportadas; origem típica é falha de rede/HTTP após `request`.

## ⚠️ Integration Pitfalls

- Sem import de `@odg/tls`, o parser de exceção TLS não roda; erros permanecem no formato anterior ao parse.
- Headers `poptls-*` são detalhe de transporte; não duplicar ou conflitar manualmente sem motivo.
- `TlsAxiosRequestConfigExtra` referencia `@odg/axios/dist/interfaces` nos `.d.ts` — acoplamento de tipos ao layout do pacote Axios ODG.
- README exemplifica proxy local; validar URL e `allowRedirect` contra o servidor TLS real em cada ambiente.
