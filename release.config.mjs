/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  "branches": [
    "+([0-9])?(.{+([0-9]),x}).x",
    "main",
    "master",
    "next",
    "next-major",
    {
        "name": "beta",
        "prerelease": true
    },
    {
        "name": "alpha",
        "prerelease": true
    }
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        // cwd do exec = diretório do pacote (igual ao @semantic-release/npm). Não usar ${cwd} no template:
        // o @semantic-release/exec remove `cwd` do contexto passado ao lodash.
        prepareCmd:
          "NEXT_RELEASE_VERSION=${nextRelease.version} node ../../utility/patch-workspace-versions.js"
      }
    ],
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
};
