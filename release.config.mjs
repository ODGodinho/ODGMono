/**
 * @type {import("semantic-release").GlobalConfig}
 */
export default {
    branches: [
        "+([0-9])?(.{+([0-9]),x}).x",
        "main",
        "master",
        "next",
        "next-major",
        {
            name: "beta",
            prerelease: true,
        },
        {
            name: "alpha",
            prerelease: true,
        },
    ],
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        [
            "@semantic-release/exec",
            {

                // Atualiza apenas a versão do pacote atual sem quebrar a árvore de dependências
                "prepareCmd": "npm pkg set version=${nextRelease.version}",

                // Usa o Bun para publicar, que converte o workspace: internamente
                "publishCmd": "bun publish --access public",
            },
        ],
        "@semantic-release/github",
    ],
};
