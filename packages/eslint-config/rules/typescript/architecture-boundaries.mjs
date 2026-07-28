/**
 * Enforces the Electron process split from the ODG architecture canon
 * (skills/odg/references/runtimes/electron.md). Unmatched globs are no-ops, so a single
 * shared zone list is safe across every ODG project type (crawler, API, worker, Electron,
 * frontend) — a project missing a given folder simply never triggers that zone.
 *
 * The generic ring direction (ENTRY → APP → CORE) inside a single-root project is NOT
 * enforced here: APP legitimately references ENTRY types (a Listener naming a Page's
 * return type), and `import/no-restricted-paths` has no concept of `importKind`, so it
 * would reject the type-only import exactly like a runtime one. That boundary stays
 * review-time.
 */

const MAIN_PROCESS = "./electron/**";
const RENDERER_PROCESS = "./resources/**";
const SHARED_TIER = "./app/**";

const architectureZones = [

    // Main and renderer communicate only over IPC, never by direct import.
    {
        "target": MAIN_PROCESS,
        "from": RENDERER_PROCESS,
        "message": "electron/ (main process) must not import resources/ (renderer process)."
            + " Communicate over IPC.",
    },
    {
        "target": RENDERER_PROCESS,
        "from": MAIN_PROCESS,
        "message": "resources/ (renderer process) must not import electron/ (main process)."
            + " Communicate over IPC.",
    },

    // The shared tier must not depend on either process.
    {
        "target": SHARED_TIER,
        "from": [ MAIN_PROCESS, RENDERER_PROCESS ],
        "message": "app/ is the Electron shared tier — it must not depend on electron/ or resources/.",
    },
];

export default {
    rules: {
        "import/no-restricted-paths": [ "error", { zones: architectureZones } ],

        "import/no-cycle": [ "error", { maxDepth: Infinity } ],
    },
};
