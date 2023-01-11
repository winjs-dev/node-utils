// https://github.com/arco-design/arco-cli/blob/main/packages/arco-cli-dev-utils/src/print.ts
import chalk from 'chalk';

function print(color, ...args) {
  if (args.length > 1) {
    log(
      chalk[`bg${color.replace(/^\w/, (w) => w.toUpperCase())}`](` ${args[0]} `),
      chalk[color](args.slice(1))
    );
  } else {
    log(chalk[color](...args));
  }
}

function log(...args) {
  console.log(...args);
}

log.info = print.bind(null, 'gray');
log.warn = print.bind(null, 'yellow');
log.error = print.bind(null, 'red');
log.success = print.bind(null, 'green');
log.chalk = chalk;

/**
 * Print divider
 * @param {'info' | 'warn' | 'success' | 'error'} level
 */
log.divider = (level = 'info') => {
  const logger = log[level] || log.info;
  logger('---------------------------------------------------------------------------------------');
};

export default log;


// example
// import print from './print';
// print(`\n${locale.TIP_PROJECT_INIT_ING} ${chalk.green(root)}`);
// print.error('str');
// print.success('str');
// print.info('str');
// print.warn('str');
// print.divider();
