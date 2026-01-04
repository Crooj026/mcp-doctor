import { ValidationResult, ServerTestResult, ConfigLocation } from '../config/types.js';
export declare function printHeader(text: string): void;
export declare function printConfigsFound(configs: ConfigLocation[]): void;
export declare function printValidationResults(results: ValidationResult[]): void;
export declare function printServerResults(results: ServerTestResult[]): void;
export declare function printSummary(errors: number, warnings: number, healthyServers: number, totalServers: number): void;
