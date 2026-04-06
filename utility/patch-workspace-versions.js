/**
 * Troca `workspace:` por `^versão` nos deps internos.
 *
 * Edita só o `package.json` do pacote em `cwd` (multi-semantic-release). `--all` na raiz altera todos.
 * `NEXT_RELEASE_VERSION` + `${nextRelease.version}` no prepare; opcional `WORKSPACE_VERSION_OVERRIDES` JSON.
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const patchAll = argv.includes('--all');

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
  const rel = path.relative(rootDir, process.cwd());
  const normalized = rel.split(path.sep).join('/');
  if (
    !normalized ||
    normalized.startsWith('..') ||
    !root.workspaces.includes(normalized)
  ) {
    throw new Error(
      `Rode de dentro de um pacote em workspaces (ex.: packages/foo), ou use --all na raiz. cwd=${process.cwd()}`,
    );
  }
  return [normalized];
}

function patchDeps(section, versionMap, patchFn) {
  if (!section) return;
  for (const name of Object.keys(section)) {
    if (versionMap[name]) {
      section[name] = patchFn(name, section[name], versionMap[name]);
    }
  }
}

function main() {
  const rootDir = findMonorepoRoot();
  const root = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
  );
  const { packages, versionMap: baseMap } = loadWorkspacePackages(rootDir, root);

  let cwdPackageName = '';
  try {
    const cwdManifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    );
    cwdPackageName = cwdManifest.name || '';
  } catch {
    // cwd na raiz com --all
  }

  const versionMap = mergeVersionOverrides({ ...baseMap }, cwdPackageName);

  const patchFn = (name, spec, resolvedVersion) => {
    if (typeof spec === 'string' && spec.startsWith('workspace:')) {
      return `^${resolvedVersion}`;
    }
    return spec;
  };

  const dirs = resolvePackageDirsToPatch(rootDir, root);

  for (const dir of dirs) {
    const packageInfo = packages[dir];
    patchDeps(packageInfo.dependencies, versionMap, patchFn);
    patchDeps(packageInfo.devDependencies, versionMap, patchFn);
    patchDeps(packageInfo.peerDependencies, versionMap, patchFn);
    patchDeps(packageInfo.optionalDependencies, versionMap, patchFn);
    fs.writeFileSync(
      path.join(rootDir, dir, 'package.json'),
      JSON.stringify(packageInfo, undefined, 4) + '\n',
    );
  }
}

main();
