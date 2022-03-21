import { existsSync } from 'fs';
import { join, dirname } from 'path';

export function findRootDir(dir, file) {
  if (existsSync(join(dir, file))) {
    return dir;
  }

  const parentDir = dirname(dir);
  if (dir === parentDir) {
    return dir;
  }

  return findRootDir(parentDir);
}

// usage demo
// findRootDir(process.cwd(), 'package.json')
