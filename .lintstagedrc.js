module.exports = {
    "packages/**/*.{ts,mts,cts,mjs,cjs,js}": () =>
        "turbo run lint:fix --continue",
};
