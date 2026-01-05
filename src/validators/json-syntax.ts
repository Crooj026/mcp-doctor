import { readFileSync } from "fs";
import { ValidationResult } from "../config/types.js";

export interface JsonSyntaxResult {
  valid: boolean;
  results: ValidationResult[];
  config?: Record<string, unknown>;
  errorContext?: {
    line: number;
    column: number;
    lineContent: string;
    surroundingLines: Array<{ num: number; content: string }>;
  };
}

export function validateJsonSyntax(filePath: string): JsonSyntaxResult {
  const results: ValidationResult[] = [];

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (error) {
    results.push({
      level: "error",
      code: "FILE_READ_ERROR",
      message: `Cannot read file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      file: filePath,
    });
    return { valid: false, results };
  }

  // Check for empty file
  if (!content.trim()) {
    results.push({
      level: "warning",
      code: "EMPTY_FILE",
      message: "Config file is empty",
      file: filePath,
    });
    return { valid: true, results, config: {} };
  }

  const lines = content.split("\n");

  // Try to parse JSON
  try {
    const config = JSON.parse(content);
    return { valid: true, results, config };
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Try to find the position from error message
      const posMatch = error.message.match(/position\s+(\d+)/i);
      let line = 1;
      let column = 1;

      if (posMatch) {
        const position = parseInt(posMatch[1], 10);
        // Convert position to line/column
        let currentPos = 0;
        for (let i = 0; i < lines.length; i++) {
          if (currentPos + lines[i].length + 1 > position) {
            line = i + 1;
            column = position - currentPos + 1;
            break;
          }
          currentPos += lines[i].length + 1; // +1 for newline
        }
      }

      // Check for trailing comma specifically
      const trailingCommaRegex = /,(\s*[\]\}])/g;
      let trailingCommaMatch;
      let trailingCommaLine = 0;
      let trailingCommaColumn = 0;
      let searchPos = 0;

      while ((trailingCommaMatch = trailingCommaRegex.exec(content)) !== null) {
        // Find line number of this match
        const beforeMatch = content.substring(0, trailingCommaMatch.index);
        const matchLines = beforeMatch.split("\n");
        trailingCommaLine = matchLines.length;
        trailingCommaColumn = matchLines[matchLines.length - 1].length + 1;
        searchPos = trailingCommaMatch.index;
      }

      // Build surrounding lines context
      const errorLine = trailingCommaLine > 0 ? trailingCommaLine : line;
      const errorColumn = trailingCommaLine > 0 ? trailingCommaColumn : column;
      const surroundingLines: Array<{ num: number; content: string }> = [];

      const startLine = Math.max(0, errorLine - 3);
      const endLine = Math.min(lines.length - 1, errorLine + 1);

      for (let i = startLine; i <= endLine; i++) {
        surroundingLines.push({
          num: i + 1,
          content: lines[i],
        });
      }

      const errorContext = {
        line: errorLine,
        column: errorColumn,
        lineContent: lines[errorLine - 1] || "",
        surroundingLines,
      };

      if (trailingCommaLine > 0) {
        results.push({
          level: "error",
          code: "JSON_TRAILING_COMMA",
          message: "Trailing comma detected (not allowed in JSON)",
          file: filePath,
          line: trailingCommaLine,
          suggestion: "Remove the comma before the closing bracket/brace",
        });
      } else {
        results.push({
          level: "error",
          code: "JSON_SYNTAX",
          message: error.message,
          file: filePath,
          line,
        });
      }

      return { valid: false, results, errorContext };
    }

    return { valid: false, results };
  }
}
