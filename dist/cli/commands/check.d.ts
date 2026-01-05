interface CheckOptions {
    skipHealth?: boolean;
    filePath?: string;
}
export declare function checkCommand(options?: CheckOptions): Promise<void>;
export {};
