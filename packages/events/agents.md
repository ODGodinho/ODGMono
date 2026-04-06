## @odg/events - Consumer Guide

## 🎯 Purpose

- Contratos TypeScript para um barramento de eventos tipado (`EventBusInterface`) alinhado a IoC.
- Implementação pronta (`EventEmitterBus`) sobre `eventemitter2`.
- Classe abstrata (`EventServiceProvider`) para registrar e remover listeners declarativamente (`boot` / `shutdown`).

## 📜 Contracts

- `EventNameType`: `string | symbol` (nome do evento).
- `EventObjectType`: mapa `evento → tipo do payload` (base para generic `Events`).
- `HandlerEventCallback<P>`: `(argument: P) => void | Promise<void>`.
- `EventOptions`: `{ once?: boolean }` — `once: true` remove o listener após a primeira execução.
- `EventBusInterface<Events>`: `subscribe`, `unsubscribe`, `dispatch` (todos retornam `Promise<void>`).
- `EventListenerInterface<Events, EventName>`: método `handler(argument: Events[EventName])`.
- `EventEmitterBus<Events>`: implementação concreta de `EventBusInterface`.
- `EventServiceProvider<Events>`: `protected abstract bus: EventBusInterface<Events>`; `protected abstract listeners: EventListener<Events>`; métodos `boot()` e `shutdown()`.
- `EventListenerOptions<Events, EventName>`: `{ listener: EventListenerInterface<...>; options: EventOptions }`.
- `EventListener<Events>`: para cada chave de evento, array de `EventListenerOptions`.
- `EventListenerNotation<Events>`: variante com `containerName: string` e campos parciais (útil quando o registro vem de config/metadata externa).

## 🚦 Rules (Usage)

- Defina um `EventObjectType` (ou interface que o estenda) com todas as chaves de evento e seus payloads.
- Use o mesmo generic `Events` em `EventBusInterface`, listeners e provider para manter payloads alinhados aos nomes.
- `subscribe` antes de `dispatch` para o mesmo evento (caso contrário ninguém recebe o payload).
- Para `unsubscribe`, passe a **mesma referência de função** usada em `subscribe` (arrow nova ≠ mesma referência).
- `EventListenerInterface.handler` pode ser `async`; erros em handlers assíncronos dependem do comportamento do bus em runtime (encadeamento `emitAsync`).
- Subclasses de `EventServiceProvider` devem preencher `bus` e `listeners` e chamar `await super.boot()` / `await super.shutdown()` se sobrescreverem esses métodos.

## 💥 Exceptions

- O entrypoint **não exporta** classes de exceção deste pacote.
- Nenhum erro específico da API pública está documentado como contrato de lançamento; trate falhas de handlers conforme a política do seu app.

## ⚠️ Integration Pitfalls

- `EventServiceProvider.boot` usa `Reflect.ownKeys(this.listeners)`: cobre chaves string e `symbol` **próprias**; não enumera propriedades herdadas do protótipo do objeto `listeners`.
