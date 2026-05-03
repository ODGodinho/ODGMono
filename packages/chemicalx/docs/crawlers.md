## Chemical-X Crawler API - Pages, Handlers, BrowserManager

Arquitetura para automação web com abstração sobre Puppeteer/Playwright. Requer driver de browser instalado separadamente.

```typescript
import { BrowserManager, BasePage, BaseHandler, Browser, Context, Page, Container } from "@odg/chemical-x";
```

---

### BrowserManager

Orquestrador central que cria instâncias de Browser e Context via factories injetadas pelo consumidor.

**Assinatura:**

```typescript
class BrowserManager<BrowserClassEngine, ContextClassEngine, PageClassEngine> {
    constructor(
        $newBrowser: CreateBrowserFactoryType<BrowserClassEngine, ContextClassEngine, PageClassEngine>,
        $newContext: CreateContextFactoryType<ContextClassEngine, PageClassEngine>,
        $newPage: CreatePageFactoryType<PageClassEngine>,
    )

    async newBrowser(
        browser: () => Promise<BrowserClassEngine>,
    ): Promise<BrowserChemicalXInterface<...> & BrowserClassEngine>

    async newPersistentContext(
        context: () => Promise<ContextClassEngine>,
    ): Promise<ContextChemicalXInterface<...> & ContextClassEngine>
}
```

**Responsabilidades:**

- Cria instâncias de `Browser` via `newBrowser()` — recebe factory que retorna engine do browser
- Cria contextos persistentes via `newPersistentContext()` — recebe factory que retorna engine do contexto
- **Não auto-seleciona driver**: consumer configura Puppeteer ou Playwright via factory injetada
- Retorna objetos que combinam interface Chemical-X com o engine nativo (via `@getterAccess` proxy)

**Lifecycle:**

1. Consumer instancia `BrowserManager` com factories (normalmente via Container/DI)
2. `newBrowser(() => puppeteer.launch())` → retorna `Browser` com proxy sobre Puppeteer
3. `browser.newContext(options?)` → retorna `Context` com proxy
4. `context.newPage()` → retorna `Page` com proxy

---

### Browser, Context, Page (Wrappers)

Wrappers com `@getterAccess` que delegam acesso ao engine nativo de forma transparente.

**Browser:**

```typescript
@ODGDecorators.getterAccess()
class Browser<BrowserClassEngine, ContextClassEngine, PageClassEngine>
    implements GetterAccessInterface, BrowserChemicalXInterface<...> {

    $browserInstance: BrowserClassEngine;
    async defaultContextOptions(): Promise<ContextOptionsLibraryInterface>;
    async newContext(options?): Promise<ContextChemicalXInterface<...> & ContextClassEngine>;
    contexts(): Array<ContextChemicalXInterface<...> & ContextClassEngine>;
    __get(key: PropertyKey): unknown;
}
```

**Context:**

```typescript
@ODGDecorators.getterAccess()
class Context<ContextClassEngine, PageClassEngine>
    implements GetterAccessInterface, ContextChemicalXInterface<...> {

    $contextInstance: ContextClassEngine;
    async defaultPageOptions(): Promise<PageOptionsLibraryInterface>;
    async newPage(options?): Promise<PageChemicalXInterface<...> & PageClassEngine>;
    pages(): Array<PageChemicalXInterface<...> & PageClassEngine>;
    __get(key: PropertyKey): unknown;
}
```

**Page:**

```typescript
@ODGDecorators.getterAccess()
class Page<ContextClassEngine, PageClassEngine>
    implements GetterAccessInterface, PageChemicalXInterface<...> {

    $pageInstance: PageClassEngine;
    context(): ContextChemicalXInterface<...> & ContextClassEngine;
    __get(key: PropertyKey): unknown;
}
```

Todos usam `@getterAccess` para delegar acessos de propriedade/método ao engine subjacente. Isso permite chamar métodos nativos do Puppeteer/Playwright diretamente no wrapper.

---

### BasePage (Abstract)

Define uma página por **intenção**, não por URL. Implementa `AttemptableInterface` com lifecycle hooks para retry via `@attemptableFlow`.

**Assinatura:**

```typescript
abstract class BasePage<PageClassEngine> implements PageInterface {
    currentAttempt: number = 0;
    page?: PageClassEngine;

    abstract readonly $s?: SelectorType;                              // Seletor principal
    abstract readonly $$s?: SelectorsMapType; // Mapa de seletores (folhas, bundles ou cascata)

    setPage(page: PageClassEngine): this;

    // Obrigatórios (abstract)
    abstract execute(): Promise<void>;    // Ação principal da página
    abstract attempt(): Promise<number>;  // Retorna número de tentativas

    // Hooks opcionais (lifecycle do @attemptableFlow)
    success?(): Promise<void>;
    failure?(exception: Exception): Promise<void>;
    retrying?(exception: Exception, attempt: number): Promise<RetryAction>;
    finish?(exception?: Exception): Promise<void>;
    sleep?(): Promise<number>;
}
```

**Page Intent Design:**

> Pages agrupam por **INTENÇÃO**, não por URL. Uma mesma URL pode ter múltiplas Pages.

Exemplos:
- `LoginPage` (intenção: autenticar) — URL: `/login`
- `LoginVerificationPage` (intenção: verificar se login OK) — URL: `/login` ou `/dashboard`
- `HomeContentPage` (intenção: extrair conteúdo) — URL: `/`
- `HomeAdPage` (intenção: extrair anúncios) — URL: `/`

**Lifecycle:**

1. `setPage(page)` — injeta instância da page do browser
2. `execute()` — executa ação (navegar, preencher, clicar)
3. Se falha → `retrying(exception, attempt)` decide retry ou não
4. Se sucesso → `success()`
5. Se falha final → `failure(exception)`
6. Sempre → `finish(exception?)`

---

### BaseHandler (Abstract)

Valida transições e resultados de páginas. **Handlers validam, não executam ações.**

**Assinatura:**

```typescript
abstract class BaseHandler<PageClassEngine> implements HandlerInterface {
    currentAttempt: number = 0;
    page?: PageClassEngine;

    abstract readonly $$s: SelectorType;

    setPage(page: PageClassEngine): this;

    // Concrete
    async execute(): Promise<void>;
    async successSolution(): Promise<HandlerSolutionType>; // Retorna RetryAction.Resolve

    // Obrigatórios (abstract)
    abstract waitForHandler(): Promise<HandlerFunction>;   // Retorna Exception ou solution function
    abstract attempt(): Promise<number>;

    // Hooks opcionais
    success?(): Promise<void>;
    failure?(exception: Exception): Promise<void>;
    retrying?(exception: Exception, attempt: number): Promise<RetryAction>;
    finish?(exception?: Exception): Promise<void>;
    sleep?(): Promise<number>;
}
```

**Tipos de retorno de Handler:**

```typescript
type HandlerSolutionType = Exception | Exclude<RetryAction, RetryAction.Default | RetryAction.Throw>;
type HandlerFunction = Exception | (() => Promise<HandlerSolutionType>);
```

**Handler Pattern:**

> "Pages executam. Handlers validam. Handlers declaram Solution ou lançam Exception."

- `waitForHandler()` retorna `Exception` → falha detectada
- `waitForHandler()` retorna `() => Promise<HandlerSolutionType>` → solução disponível
- Solution pode ser: `RetryAction.Resolve` (sucesso), `RetryAction.Retry` (tentar novamente)
- Handler **NUNCA** interage com a page diretamente
- Handler **NUNCA** chama outras Pages para resolver problemas
- Handler **NUNCA** falha silenciosamente

---

### Container / DI

Chemical-X usa Inversify para DI. `@ODGDecorators.injectable(name)` registra metadata; consumer deve chamar `Container.loadModule()`.

**Regras:**

1. `Container.loadModule()` **obrigatório** antes de executar qualquer Page/Handler registrado
2. DI binding é **responsabilidade do consumidor** — Chemical-X não auto-wira
3. `Container.getOptional(name)` retorna `undefined` se serviço não registrado (vs `get()` que lança)
4. Puppeteer/Playwright deve ser injetado via Container ou passado ao `BrowserManager` constructor

---

### Workflow Example

Fluxo completo: login em site com tratamento de 2FA.

```
1. Create LoginPage (intent: autenticar)
   → setPage(page) → execute() (navegar, preencher credenciais, clicar login)

2. Create LoginHandler (intent: validar resultado do login)
   → setPage(page) → waitForHandler()
   → Detecta 2FA required → return () => new TwoFaPage() as Solution
   → Detecta login error → return new InvalidCredentialsException()
   → Detecta sucesso → return successSolution() (RetryAction.Resolve)

3. Se Solution = TwoFaPage:
   → Create TwoFaPage (intent: resolver 2FA)
   → setPage(page) → execute() (preencher código 2FA)

4. Create DashboardHandler (intent: verificar que chegou no dashboard)
   → setPage(page) → waitForHandler()
   → Verifica URL/conteúdo → return successSolution()
```

See also: `tests/vitest/Handlers/` e `tests/vitest/Pages/` para exemplos reais de implementação.
