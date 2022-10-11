import path from 'path';
import { slash } from './slash';
import { isWindows } from './isWindows';

/**
 * 路径转换，兼容 windows, macos, unix
 * @param id
 */
export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}
