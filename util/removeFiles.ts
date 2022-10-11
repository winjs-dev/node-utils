// https://github.com/egoist/tsup/blob/dev/src/utils.ts
import fs from 'fs';
import { globby } from 'globby';

export async function removeFiles(patterns: string[], dir: string) {
  const files = await globby(patterns, {
    cwd: dir,
    absolute: true
  });
  files.forEach((file) => fs.existsSync(file) && fs.unlinkSync(file));
}
