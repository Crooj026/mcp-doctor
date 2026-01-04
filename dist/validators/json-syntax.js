import { readFileSync } from 'fs';
export function validateJsonSyntax(filePath) {
    const results = [];
    let content;
    try {
        content = readFileSync(filePath, 'utf-8');
    }
    catch (error) {
        results.push({
            level: 'error',
            code: 'FILE_READ_ERROR',
            message: `Cannot read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            file: filePath,
        });
        return { valid: false, results };
    }
    // Check for empty file
    if (!content.trim()) {
        results.push({
            level: 'warning',
            code: 'EMPTY_FILE',
            message: 'Config file is empty',
            file: filePath,
        });
        return { valid: true, results, config: {} };
    }
    // Try to parse JSON
    try {
        const config = JSON.parse(content);
        return { valid: true, results, config };
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            // Try to find the line number
            const match = error.message.match(/position\s+(\d+)/i);
            let line;
            let column;
            if (match) {
                const position = parseInt(match[1], 10);
                const lines = content.substring(0, position).split('\n');
                line = lines.length;
                column = lines[lines.length - 1].length + 1;
            }
            // Check for common issues
            const trailingCommaMatch = content.match(/,\s*([}\]])/);
            if (trailingCommaMatch) {
                // Find line of trailing comma
                const beforeMatch = content.substring(0, content.indexOf(trailingCommaMatch[0]));
                const trailingCommaLine = beforeMatch.split('\n').length;
                results.push({
                    level: 'error',
                    code: 'JSON_TRAILING_COMMA',
                    message: 'Trailing comma detected (not allowed in JSON)',
                    file: filePath,
                    line: trailingCommaLine,
                    suggestion: 'Remove the comma before the closing bracket/brace',
                });
            }
            else {
                // Generic JSON error
                let message = error.message;
                if (line && column) {
                    message = `Invalid JSON at line ${line}, column ${column}: ${error.message}`;
                }
                results.push({
                    level: 'error',
                    code: 'JSON_SYNTAX',
                    message,
                    file: filePath,
                    line,
                });
            }
        }
        return { valid: false, results };
    }
}
//# sourceMappingURL=json-syntax.js.map