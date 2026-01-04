import { ServerTestResult } from '../config/types.js';
export declare function testServerHealth(config: Record<string, unknown>, timeout?: number): Promise<ServerTestResult[]>;
