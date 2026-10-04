## @odg/http - Consumer Guide

## 🎯 Purpose

- Os estágios prontos do anel ENTRY de uma API ODG — contrato de erro, CORS, alias, transportes
  oRPC/REST, documento OpenAPI — e **nada** ligado por conta própria.
- Quem decide o que a API roda, e em que ordem, é o template: um array de middlewares. Recurso que
  não entra no array não existe em runtime e não tem opção pra "desligar".
- Fala **só** `Request`/`Response` da web: nenhuma API de runtime, nenhum socket. Quem abre o
  servidor é a aplicação — porta, hostname, limite de corpo e semântica de drain são decisão de
  deploy, não de pacote.

## 🚀 Quick Start

```typescript
import {
    CorsMiddleware, ErrorBoundaryMiddleware, ExceptionSerializer,
    HttpPipeline, OpenApiDocumentMiddleware, OpenApiMiddleware, RpcMiddleware,
} from "@odg/http";

const serializer = new ExceptionSerializer(environment !== "production");

const pipeline = new HttpPipeline({
    logger,
    middlewares: [
        new AccessLogMiddleware(logger, probePaths),          // classe do app, acima do boundary
        new ErrorBoundaryMiddleware({ logger, serializer }),
        new CorsMiddleware({ origins: [ webUrl ] }),          // não quer CORS? apaga a linha
        auth,                                                 // classe do app com handle()
        new OpenApiDocumentMiddleware(router, { path: "/api/openapi", title: appName }),
        new RpcMiddleware(router, { context, prefix: "/rpc" }),
        new OpenApiMiddleware(router, { context, prefix: "/api", serializer }),
    ],
});

// A aplicação é dona do runtime; o pacote só entrega a função.
Bun.serve({ fetch: async (request) => pipeline.fetch(request), port });
```

## 📜 Quick API Reference

| Classe | Pergunta que ela responde |
|---|---|
| `HttpPipeline` | "quem responde, e com qual id" — correlação, 404 final, último recurso |
| `ErrorBoundaryMiddleware` | "como um throw vira response" |
| `CorsMiddleware` | "que headers de origem esta response leva" |
| `AliasMiddleware` | "que endereços antigos ainda respondem" |
| `RpcMiddleware` | "protocolo nativo oRPC, pro cliente tipado" |
| `OpenApiMiddleware` | "REST/OpenAPI, pro consumidor externo" |
| `OpenApiDocumentMiddleware` | "onde o spec é publicado" |
| `ExceptionSerializer` | "qual é o corpo de um erro" |
| `statusInterceptor()` | "o `statusCode` da exceção sobrevive ao transporte oRPC" |

`HttpPipeline.requestIdHeader` (`x-request-id`) é o header de correlação — público porque a suíte
do consumidor asserta nele.

## 🚦 Key Rules

1. **A ordem do array é o aninhamento.** Quem vem antes envolve quem vem depois. O que um estágio
   roda **depois** do `await next(context)` é a fase de response dele, e enxerga tudo que os
   estágios abaixo produziram.
2. **Existe um conceito só.** `MiddlewareInterface` com `handle(context, next)`. Não há interface
   separada de response, nem de "handler montável": tudo é estágio, inclusive as classes do app.
3. **O `HttpPipeline` garante três coisas e mais nada:** um `requestId` em toda request e em toda
   response, um 404 no fim da cadeia, e um status (sem corpo) se nada tiver capturado o throw. O
   resto — inclusive o contrato de erro — é o array.
4. **Onde o `ErrorBoundaryMiddleware` está muda o que o resto vê.** Acima dele, um estágio recebe a
   response de erro como retorno do próprio `next`; abaixo, o `throw` passa por cima dele. Log e
   métrica vão **acima**.
5. **Um `ExceptionSerializer` só, compartilhado** entre o boundary e o `OpenApiMiddleware` — senão a
   API responde dois contratos conforme onde a exceção nasceu.
6. **`statusInterceptor()` é ligado por default** nos dois transportes oRPC: sem ele, um 422 lançado
   dentro de um procedure chega ao cliente como 500. `interceptors: []` remove, e é uma decisão
   consciente, não um default. O `code` sai da tabela do próprio oRPC (`COMMON_ORPC_ERROR_DEFS`),
   não de um mapa nosso: 422 é `UNPROCESSABLE_CONTENT`, que é o que o cliente tipado casa, e não o
   `UNPROCESSABLE_ENTITY` das tabelas de reason phrase do HTTP.
7. **Regra de autorização/tenancy não é middleware daqui.** Um estágio aqui vê bytes e headers. O
   que precisa do contexto tipado e do schema de input é middleware oRPC (`base.use(...)`).
8. **Nenhum arquivo aqui toca runtime.** Nada de `Bun`, `node:http`, socket ou porta — se um PR
   precisa disso, a peça pertence à aplicação.

## 💥 Critical Exceptions

| Exception | Quando é lançada | Handling |
|---|---|---|
| `NotFoundException` | Nenhum estágio respondeu | Vira 404 no `ErrorBoundaryMiddleware`; sem ele, 404 sem corpo |
| `HttpException` (abstract) | Base para exceção do app que já sabe o status (`statusCode`) | Estender no `src/Exceptions/` do projeto |

`ExceptionSerializer` e `statusInterceptor` leem `statusCode` de **qualquer** coisa lançada
(`statusOf`); o que não tiver vira 500.

## ⚠️ Integration Pitfalls

1. **Observabilidade é do app.** O pacote não entrega access log: o que logar, o que é ruído e o que
   é segredo é vocabulário do projeto. Escreva a classe no template e ponha acima do boundary.
2. **`OpenApiDocumentMiddleware` vem antes do `OpenApiMiddleware`.** `/api/openapi` está dentro de
   `/api`, então o transporte reivindicaria o path primeiro e responderia 404.
3. **Superfície própria (um SDK de auth, um webhook) é uma classe do app** implementando
   `MiddlewareInterface`, que decide sozinha se o path é dela. Não existe `prefix` pra passar de
   fora — é o que impede o ponto de montagem e a config da SDK de divergirem.
4. **O `router` tem que ser construído com o mesmo `Context`** que a factory `context()` devolve —
   `os.$context<HttpContext>()` no app é o que amarra os dois.
5. **`/rpc` mantém o frame de erro nativo do oRPC** de propósito: é o que o cliente tipado
   reconstrói como `ORPCError`. Só `/api` usa o contrato estruturado.
6. **Um path sob um prefixo que não casa procedure cai pro próximo estágio**, não vira 404 do
   transporte — é o que deixa montar outra superfície depois de `/api`.
7. **`@orpc/*` está pinado em `1.15.0` exato, e isso não é capricho.** O pacote faz
   `instanceof ORPCError` e recebe o `router` do app: se o app resolver uma versão diferente da que
   o pacote resolveu, são duas classes fisicamente distintas, o `instanceof` dá falso e um
   `ORPCError` lançado numa rota do app volta como 500 em vez do status dele. Enquanto o pacote for
   consumido por `bun link`, as duas pontas **MUST** resolver a mesma versão. Publicado, o caminho
   certo é `@orpc/*` virar `peerDependencies` — decisão ainda aberta.
8. **Limite de corpo e drain são da aplicação.** `Bun.serve` aceita 128 MB por padrão, e `stop()`
   drena enquanto `stop(true)` aborta as requests em voo.

## 🔗 Interfaces Públicas

| Interface | Propósito |
|---|---|
| `MiddlewareInterface` | O único ponto de extensão: `handle(context, next)` |
| `HttpRequestInterface` | Uma request como o pipeline a carrega: `request` + `requestId` |
| `HttpDispatchType` | Passa a request ao próximo estágio |
| `HttpPipelineOptionsInterface` | `middlewares`, `requestIdHeader?`, `logger?` |
| `ErrorBoundaryOptionsInterface` | `serializer`, `logger` |
| `CorsOptionsInterface` | `origins`, `methods?`, `maxAgeSeconds?` |
| `OrpcTransportOptionsInterface` | `context`, `prefix?`, `interceptors?` |
| `OpenApiOptionsInterface` | O anterior, mais `serializer` |
| `OpenApiDocumentOptionsInterface` | `path`, `title`, `version?`, `schemaConverters?` |
| `StatusInterceptorOptionsInterface` | `infrastructureStatus?` |
| `HttpPathType` | Ponto de montagem — `` `/${string}` `` |

## 🔍 Entry Points

- **Main**: `import { HttpPipeline, CorsMiddleware, ErrorBoundaryMiddleware, ... } from "@odg/http"`
