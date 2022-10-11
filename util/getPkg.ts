import fs from 'fs';
import path from 'path';

export const getPkg = (): string | undefined => {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve('package.json'), 'utf-8')
    );
    return pkg;
  } catch (error) {
  }
};
