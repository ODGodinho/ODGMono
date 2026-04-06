## @odg/cache - Consumer Guide
## 🎯 Purpose
- Cache tipado por “schema” (genérico) com TTL e fallback
- Suporte a múltiplos handlers com ordem de fallback
- Handler pronto para uso com `keyv` (adapters: redis/sql/memory/etc via Keyv)

## 📜 Contracts
- `Cache<CacheType extends object>`: fachada principal para leitura/escrita
- `CacheManager<CacheType extends object>`: gerencia handlers e TTL padrão (usado internamente, mas exportado)
- `CacheInterface<CacheType>`: contrato de alto nível (métodos do cache)
- `CacheHandlerInterface<CacheType>`: contrato para criar seu próprio handler
- `KeyvCacheHandler<CacheType>`: handler baseado em `keyv` (opt-in, requer `keyv` instalado)
- `CacheHandlerException`: erro de seleção/registro de handler
- `CacheIteratorException`: erro ao iterar quando o `keyv` não suporta `iterator`

## 🚦 Rules (Usage)
- Importe pela API pública: `@odg/cache` (evite caminhos internos)
- Defina um `CacheType` com chaves conhecidas para obter tipagem forte em `get/set/...`
- Registre handlers antes de usar `drive(name)`; o `name` vem de `handler.name`
- TTL é em **milissegundos**
- `ttl`:
  - `undefined`: usa TTL padrão do `Cache`/`CacheManager` (ou sem expiração se padrão for `undefined`)
  - `Infinity`: sem expiração (conceito de “forever”)
  - `0`: expira imediatamente (no `KeyvCacheHandler`, isso vira delete)
- `remember(key, cb, ttl)`: `cb` só roda em miss; o resultado é persistido com o TTL efetivo
- `rememberForever(key, cb)`: equivalente a `remember(..., Infinity)`
- `increment/decrement` só aceitam chaves cujo tipo em `CacheType` seja `number`
- `setMany(values, ttl)`: `values` é parcial do schema; retorno é `boolean[]` por chave (na ordem de `Object.entries(values)`)

## 💥 Exceptions
- `CacheHandlerException`
  - Quando: `drive(name)` aponta para handler inexistente; `Cache` é criado com `handlerName` inexistente; `addHandler` com nome duplicado; seleção forçada sem `handlerName`
  - Como tratar: considerar erro de configuração/boot; registre handlers corretamente ou corrija o `name`
- `CacheIteratorException`
  - Quando: iterar `KeyvCacheHandler` sem suporte a `keyv.iterator`
  - Como tratar: não use iteração ou forneça uma instância de `keyv` com adapter que implemente `iterator`

## ⚠️ Integration Pitfalls
- `keyv` é `peerDependency` opcional: para usar `KeyvCacheHandler`, instale `keyv@^5`
- Se nenhum handler foi registrado, `get` sempre retorna `undefined` e `set/delete/flush` tendem a “não fazer nada útil” (depende do handler inexistente)
- `drive(name)` cria um cache “escopado” no handler; sem fallback (apenas o handler selecionado)
- `has(key)` é baseado em `get(key) !== undefined`: não diferencia “valor armazenado = undefined” vs “miss”
- `setMany` agrega resultados por handler; se um handler falhar por chave, aquela chave pode retornar `false` mesmo que outro handler tenha escrito
