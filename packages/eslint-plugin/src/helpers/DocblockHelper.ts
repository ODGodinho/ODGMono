import { getJSDocComment, parseComment } from "@es-joy/jsdoccomment";
import type { TSESTree } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";
import type { Block } from "comment-parser";

interface DocblockOptionsInterface {
    minLines: number;
    maxLines: number;
}

type GetJSDocumentationCommentType = (
    sourceCode: Readonly<SourceCode>,
    node: TSESTree.BaseNode,
    options: DocblockOptionsInterface,
) => TSESTree.Token | null;

type ParseCommentType = (token: TSESTree.Token) => Block;

export interface DocblockReturnType {
    token: TSESTree.Token;
    parse: Block;
}

export default class DocblockHelper {

    public getDocblockNode(sourceCode: Readonly<SourceCode>, node: TSESTree.BaseNode): DocblockReturnType | null {
        const docblockBlock = (getJSDocComment as unknown as GetJSDocumentationCommentType)(
            sourceCode,
            node,
            {
                minLines: 0,
                maxLines: 1,
            },
        );

        return docblockBlock && {
            token: docblockBlock,
            parse: (parseComment as unknown as ParseCommentType)(docblockBlock),
        };
    }

}
