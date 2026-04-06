/**
 * Troca `workspace:` por `^versão` nos deps internos.
 *
 * Release (CI antes de `yarn release`): na raiz com `--all`; por pacote, `cwd` = pacote; opcional `RELEASE_TARGET_CWD`.
 * Manual: `cd packages/<nome>` e correr o script, ou `--all` na raiz do monorepo.
 * `NEXT_RELEASE_VERSION`; opcional `WORKSPACE_VERSION_OVERRIDES` JSON.
 *
 * Versões nos package.json podem ficar desatualizadas (ex.: 0.1.0) enquanto o último release está nas tags
 * (`@scope/pkg@1.13.0`). Comparamos com `git tag` e usamos o maior semver para não gerar `^0.1.0` no npm (ETARGET).
 *
 * Tags podem estar à frente do registo (release só no git) ou o próximo bump ainda não foi publicado.
 * Nesse caso `npm version` falha ao resolver deps (ETARGET). Limitamos à última versão publicada no npm
 * quando o candidato for estritamente maior (`npm view` no registry npmjs). Desativa: SKIP_NPM_REGISTRY_CLAMP=1.
 *
 * O multi-semantic-release reescreve deps internos para ^próximoRelease (ex. ^1.1.0) *antes* do plugin npm.
 * Sem hook no prepare, o patch em CI não corre entre MSR e `npm version`; o script ainda reescreve qualquer
 * ^x.y.z já presente para o valor do mapa (pós-clamp), não só `workspace:`.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const semver = require('semver');

const argv = process.argv.slice(2);
const patchAll = argv.includes('--all');

/** Registry público npm (o CI com setup-node + registry-url GitHub faz `npm view` falhar ou mentir). */
const NPMJS = 'https://registry.npmjs.org/';

function findMonorepoRoot(startDir = process.cwd()) {
  let dir = startDir;
  while (true) {
    const manifestPath = path.join(dir, 'package.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(manifest.workspaces) && manifest.workspaces.length > 0) {
        return dir;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error(
    `Raiz do monorepo (package.json com workspaces) não encontrada a partir de ${startDir}`,
  );
}

function loadWorkspacePackages(rootDir, root) {
  const packages = {};
  const versionMap = Object.assign(
    {},
    ...root.workspaces.map((packageDir) => {
      const packageInfo = JSON.parse(
        fs.readFileSync(path.join(rootDir, packageDir, 'package.json'), 'utf8'),
      );
      packages[packageDir] = packageInfo;
      return { [packageInfo.name]: packageInfo.version };
    }),
  );
  return { packages, versionMap };
}

/**
 * @param {string} rootDir
 * @param {string} packageName ex. @odg/message
 * @returns {string[]}
 */
function versionsFromGitTags(rootDir, packageName) {
  try {
    const out = execFileSync('git', ['tag', '-l', `${packageName}@*`], {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const prefix = `${packageName}@`;
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((tag) => (tag.startsWith(prefix) ? tag.slice(prefix.length) : ''))
      .filter((v) => semver.valid(v));
  } catch {
    return [];
  }
}

/**
 * @param {Record<string, string>} versionMap
 * @param {string} rootDir
 * @returns {Record<string, string>}
 */
function enrichVersionMapFromGitTags(versionMap, rootDir) {
  const next = { ...versionMap };
  for (const name of Object.keys(next)) {
    const fromPkg = next[name];
    const fromTags = versionsFromGitTags(rootDir, name);
    const candidates = [fromPkg, ...fromTags].filter((v) => v && semver.valid(v));
    if (candidates.length === 0) continue;
    const best = semver.maxSatisfying(candidates, '*', { includePrerelease: true });
    if (best) next[name] = best;
  }
  return next;
}

/**
 * @param {Record<string, string>} versionMap
 * @returns {Record<string, string>}
 */
function clampVersionMapToPublishedRegistry(versionMap) {
  if (process.env.SKIP_NPM_REGISTRY_CLAMP === '1') {
    return versionMap;
  }
  const next = { ...versionMap };
  for (const name of Object.keys(next)) {
    const candidate = next[name];
    if (!candidate || !semver.valid(candidate)) continue;
    try {
      const out = execFileSync(
        'npm',
        [
          'view',
          name,
          'version',
          '--json',
          `--registry=${process.env.NPMJS_REGISTRY_URL || NPMJS}`,
        ],
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
          env: { ...process.env, npm_config_registry: process.env.NPMJS_REGISTRY_URL || NPMJS },
        },
      );
      const published = JSON.parse(out.trim());
      if (!semver.valid(published)) continue;
      if (semver.gt(candidate, published)) {
        next[name] = published;
      }
    } catch {
      // Pacote ainda não publicado, rede, ou registry privado sem credenciais — mantém candidate.
    }
  }
  return next;
}

function mergeVersionOverrides(versionMap, cwdPackageName) {
  if (process.env.NEXT_RELEASE_VERSION && cwdPackageName) {
    versionMap[cwdPackageName] = process.env.NEXT_RELEASE_VERSION;
  }
  const raw = process.env.WORKSPACE_VERSION_OVERRIDES;
  if (raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('WORKSPACE_VERSION_OVERRIDES deve ser um JSON de nome → versão.');
    }
    if (parsed && typeof parsed === 'object') {
      Object.assign(versionMap, parsed);
    }
  }
  return versionMap;
}

function resolvePackageDirsToPatch(rootDir, root) {
  if (patchAll) {
    return [...root.workspaces];
  }
  /** Opcional: caminho absoluto do pacote se `process.cwd()` não for o diretório do pacote. */
  const targetFromEnv = process.env.RELEASE_TARGET_CWD;
  const baseForRel = targetFromEnv
    ? path.resolve(targetFromEnv)
    : process.cwd();
  const rel = path.relative(rootDir, baseForRel);
  const normalized = rel.split(path.sep).join('/');
  if (
    !normalized ||
    normalized.startsWith('..') ||
    !root.workspaces.includes(normalized)
  ) {
    throw new Error(
      `Pacote alvo inválido (cwd=${process.cwd()} RELEASE_TARGET_CWD=${targetFromEnv || '(não definido)'} rel=${normalized}). Use --all na raiz ou defina RELEASE_TARGET_CWD.`,
    );
  }
  return [normalized];
}

/**
 * @param {Record<string, string>|undefined} section
 * @param {Record<string, string>} versionMap só pacotes do workspace
 */
function patchDeps(section, versionMap) {
  if (!section) return;
  for (const name of Object.keys(section)) {
    if (!versionMap[name]) continue;
    const spec = section[name];
    if (typeof spec !== 'string') continue;
    // workspace:^ | ^1.1.0 (MSR) | ~ | * — alinhar ao mapa pós-clamp
    section[name] = `^${versionMap[name]}`;
  }
}

function main() {
  const rootDir = findMonorepoRoot();
  const root = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
  );
  const { packages, versionMap: baseMap } = loadWorkspacePackages(rootDir, root);

  let cwdPackageName = '';
  const pkgJsonDir = process.env.RELEASE_TARGET_CWD
    ? path.resolve(process.env.RELEASE_TARGET_CWD)
    : process.cwd();
  try {
    const cwdManifest = JSON.parse(
      fs.readFileSync(path.join(pkgJsonDir, 'package.json'), 'utf8'),
    );
    cwdPackageName = cwdManifest.name || '';
  } catch {
    // --all na raiz
  }

  const versionMap = clampVersionMapToPublishedRegistry(
    mergeVersionOverrides(
      enrichVersionMapFromGitTags({ ...baseMap }, rootDir),
      cwdPackageName,
    ),
  );

  const dirs = resolvePackageDirsToPatch(rootDir, root);

  for (const dir of dirs) {
    const packageInfo = packages[dir];
    patchDeps(packageInfo.dependencies, versionMap);
    patchDeps(packageInfo.devDependencies, versionMap);
    patchDeps(packageInfo.peerDependencies, versionMap);
    patchDeps(packageInfo.optionalDependencies, versionMap);
    fs.writeFileSync(
      path.join(rootDir, dir, 'package.json'),
      JSON.stringify(packageInfo, undefined, 4) + '\n',
    );
  }
}

main();
