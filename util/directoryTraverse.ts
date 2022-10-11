import fs from 'fs';
import path from 'path';

export function preOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    const fullpath = path.resolve(dir, filename);
    if (fs.lstatSync(fullpath).isDirectory()) {
      dirCallback(fullpath);
      // in case the dirCallback removes the directory entirely
      if (fs.existsSync(fullpath)) {
        preOrderDirectoryTraverse(fullpath, dirCallback, fileCallback);
      }
      continue;
    }
    fileCallback(fullpath);
  }
}

// usage demo
// // rename all src `.js` files to `.ts`
// // rename jsconfig.json to tsconfig.json
// preOrderDirectoryTraverse(
//   path.resolve(root, 'src'),
//   () => {},
//   (filepath) => {
//     if (filepath.endsWith('.js')) {
//       const tsFilePath = filepath.replace(/\.js$/, '.ts');
//       if (fs.existsSync(tsFilePath)) {
//         fs.unlinkSync(filepath);
//       } else {
//         fs.renameSync(filepath, tsFilePath);
//       }
//     } else if (path.basename(filepath) === 'jsconfig.json') {
//       fs.renameSync(filepath, filepath.replace(/jsconfig\.json$/, 'tsconfig.json'));
//     }
//   }
// )

export function postOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    const fullpath = path.resolve(dir, filename);
    if (fs.lstatSync(fullpath).isDirectory()) {
      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback);
      dirCallback(fullpath);
      continue;
    }
    fileCallback(fullpath);
  }
}

// usage demo
// function emptyDir(dir) {
//   postOrderDirectoryTraverse(
//     dir,
//     (dir) => fs.rmdirSync(dir),
//     (file) => fs.unlinkSync(file)
//   );
// }
