declare module "comment-parser" {
    export interface Problem {
        code: string;
        message: string;
        line: number;
        critical: boolean;
    }

    export interface Tokens {
        start: string;
        delimiter: string;
        postDelimiter: string;
        tag: string;
        postTag: string;
        name: string;
        postName: string;
        type: string;
        postType: string;
        description: string;
        end: string;
        lineEnd: string;
    }

    export interface Line {
        "number": number;
        "source": string;
        "tokens": Tokens;
    }

    export interface Spec {
        "tag": string;
        "name": string;
        "default"?: string;
        "type": string;
        "optional": boolean;
        "description": string;
        "problems": Problem[];
        "source": Line[];
    }

    export interface Block {
        description: string;
        tags: Spec[];
        source: Line[];
        problems: Problem[];
    }

    export function parse(source: string, options?: Partial<Record<string, unknown>>): Block[];
}
