import { ValidationResult, ServerTestResult, ConfigLocation } from "../config/types.js";
interface ErrorContext {
    line: number;
    column: number;
    lineContent: string;
    surroundingLines: Array<{
        num: number;
        content: string;
    }>;
}
export declare function printHeader(text: string): void;
export declare function printConfigsFound(configs: ConfigLocation[]): void;
export declare function printCodeContext(errorContext: ErrorContext): void;
export declare function printValidationResults(results: ValidationResult[], errorContext?: ErrorContext): void;
export declare function printServerResults(results: ServerTestResult[]): void;
export declare function printSummary(errors: number, warnings: number, healthyServers: number, totalServers: number): void;
export {};
