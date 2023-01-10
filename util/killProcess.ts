/**
 * killProcess
 * @Author: liwb (lwbhtml@163.com)
 * @Date: 2023-01-10 09:05
 * @LastEditTime: 2023-01-10 09:05
 * @Description: killProcess
 */

import kill from 'tree-kill';

export const killProcess = ({
                              pid,
                              signal = 'SIGTERM'
                            }: {
  pid: number
  signal?: string | number
}) =>
  new Promise<unknown>((resolve) => {
    kill(pid, signal, resolve);
  });

/**
 * usage
 *
 *  killProcess({
 *                   pid,
 *                 })
 */
