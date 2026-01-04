import { ValidationResult } from '../config/types.js';
export declare function validateJsonSyntax(filePath: string): {
    valid: boolean;
    results: ValidationResult[];
    config?: Record<string, unknown>;
};
