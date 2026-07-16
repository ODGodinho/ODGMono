export const isIdeWatchLint = process.argv
    .some(
        (argument) => argument === "--stdin"
            || argument.startsWith("--stdin-")
            || String(argument).includes("eslintServer.js"),
    )
    || process.env.VSCODE_CLI;

export const isAutomation = !process.stdout.isTTY
    || process.env.AI_AGENT
    || process.env.CURSOR_AGENT
    || process.env.CI
    || process.env.TERM === "dumb";

export const isFastMode = !!(isAutomation || isIdeWatchLint);
