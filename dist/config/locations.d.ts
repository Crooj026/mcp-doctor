import { ConfigLocation } from './types.js';
export declare function getConfigLocations(projectDir?: string): ConfigLocation[];
export declare function getServersFromConfig(config: Record<string, unknown>): Record<string, unknown> | null;
