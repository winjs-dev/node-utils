import fs from 'fs';
import { promisify } from 'util';
import { isWindows } from './isWindows';

const GRACEFUL_REMOVE_DIR_TIMEOUT = 5000;

function gracefulRemoveDir(
  dir: string,
  cb: (error: NodeJS.ErrnoException | null) => void
) {
  const start = Date.now();
  let backoff = 0;
  fs.rm(dir, { recursive: true }, function CB(er) {
    if (er) {
      if (
        (er.code === 'ENOTEMPTY' ||
          er.code === 'EACCES' ||
          er.code === 'EPERM') &&
        Date.now() - start < GRACEFUL_REMOVE_DIR_TIMEOUT
      ) {
        setTimeout(function () {
          fs.rm(dir, { recursive: true }, CB);
        }, backoff);
        if (backoff < 100) backoff += 10;
        return;
      }

      if (er.code === 'ENOENT') {
        er = null;
      }
    }

    if (cb) cb(er);
  });
}

export const removeDir = isWindows
  ? promisify(gracefulRemoveDir)
  : function removeDirSync(dir: string) {
    fs.rmSync(dir, { recursive: true, force: true });
  };
