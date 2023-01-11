// https://github.com/arco-design/arco-cli/blob/main/packages/arco-cli-dev-utils/src/clearConsole.ts
export default function () {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}
