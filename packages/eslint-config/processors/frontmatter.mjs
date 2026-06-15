// Frontmatter processor for Markdown/MDX files
export const frontmatterProcessor = {
    meta: {
        name: "frontmatter-extractor",
        version: "1.0.0",
    },
    preprocess(text) {
        // Encontra o bloco entre os delimitadores "---" no topo do arquivo
        const match = text.match(/^---\r?\n(?<content>[\s\S]*?)\r?\n---/);

        if (match) {
            return [
                {
                    filename: "frontmatter.yaml",
                    text: match.groups.content,
                },
            ];
        }

        return [];
    },
    postprocess: (messages) => messages.flatMap((fileMessages) => fileMessages.map((message) => ({
        ...message,
        line: message.line + 1,
    }))),
    supportsAutofix: true,
};
