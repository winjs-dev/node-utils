import { readdirSync, statSync } from 'fs';
import { resolve } from 'path';

export function walkDir(dir: string, handleFile: (file: string) => void): void {
  if (statSync(dir).isDirectory()) {
    const files = readdirSync(dir);
    for (const file of files) {
      const resolved = resolve(dir, file);
      walkDir(resolved, handleFile);
    }
  } else {
    handleFile(dir);
  }
}
