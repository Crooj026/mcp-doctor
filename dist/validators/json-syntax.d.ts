import { ValidationResult } from "../config/types.js";
export interface JsonSyntaxResult {
    valid: boolean;
    results: ValidationResult[];
    config?: Record<string, unknown>;
    errorContext?: {
        line: number;
        column: number;
        lineContent: string;
        surroundingLines: Array<{
            num: number;
            content: string;
        }>;
    };
}
export declare function validateJsonSyntax(filePath: string): JsonSyntaxResult;
