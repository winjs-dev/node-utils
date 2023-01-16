/**
 * readFile
 * @Author: liwb (lwbhtml@163.com)
 * @Date: 2023-01-16 10:17
 * @LastEditTime: 2023-01-16 10:17
 * @Description: readFile
 */

import path from 'path';
import fse from 'fs-extra';
function resolve(dir) {
  return path.join(__dirname, dir);
}

export function readFile(filename) {
  return fse.readFileSync(resolve(filename), { encoding: 'utf-8' });
}
