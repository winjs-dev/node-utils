// https://github.com/vexip-ui/lint-config/blob/main/scripts/release.ts
// 适用于 Monorepo
// 发布时，选择需要发布的包
// 版本号分别管理
// 分支生成规则，packageName@version
// 生成日志

// 使用方式
// ts-node release.ts [--dry] [--tag]
// --dry
// 添加试运行脚本功能，即常见的 dry run，有时候我们仅仅只是想知道脚本运行的中间过程和结果，但是不希望造成实际的影响，就可以使用试运行的方式
// --tag
// 来控制是否打 tag

import fs from 'node:fs';
import minimist from 'minimist';
import semver from 'semver';
import prompts from 'prompts';
import { logger, run, dryRun, getPackageInfo } from './utils';

import type { ReleaseType } from 'semver';

const args = minimist<{
  d?: boolean,
  dry?: boolean,
  t?: string,
  tag?: string
}>(process.argv.slice(2));

const inputPkg = args._[0];
const isDryRun = args.dry || args.d;
const releaseTag = args.tag || args.t;

const runIfNotDry = isDryRun ? dryRun : run;
const logStep = (msg: string) => logger.withStartLn(() => logger.infoText(msg));
const logSkipped = (msg = 'Skipped') => logger.warningText(`(${msg})`);
let tag = '';

main().catch(async (error) => {
  logger.error(error);
  // 发布失败后
  // 1.回退版本
  // 2.撤销提交及删除本地 tag
  await runIfNotDry('git', ['reset', '--hard', 'HEAD~1']);
  await runIfNotDry('git', ['tag', '-d', tag]);
  logger.errorText(`Failed published`);
  process.exit(1);
});

async function main() {
  const {
    pkgName,
    pkgDir,
    pkgPath,
    pkg,
    currentVersion
  } = await getPackageInfo(inputPkg);
  const preId = args.preid || args.p || (semver.prerelease(currentVersion)?.[0]);

  const versionIncrements: ReleaseType[] = [
    'patch',
    'minor',
    'major',
    ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] as const : [])
  ];

  const inc = (i: ReleaseType) => semver.inc(currentVersion, i, preId);

  const { release } = await prompts({
    type: 'select',
    name: 'release',
    message: 'Select release type:',
    choices: versionIncrements
      .map(i => `${i} (${inc(i)})`)
      .concat(['custom'])
      .map(i => ({ title: i, value: i }))
  });

  const version =
    release === 'custom'
      ? (await prompts({
        type: 'text',
        name: 'version',
        message: 'Input custom version:'
      })).version
      : release.match(/\((.*)\)/)![1];

  if (!semver.valid(version)) {
    throw new Error(`Invalid target version: ${version}`);
  }

  tag = `${pkgName}@${version}`;

  const { confirm } = await prompts([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Confirm release ${tag}?`
    }
  ]);

  if (!confirm) return;

  // 执行单元测试
  logStep('Running test...');

  if (!isDryRun) {
    await run('pnpm', ['test']);
  } else {
    logSkipped();
  }

  logStep('Updating version...');

  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // 构建库
  logStep('Building package...');

  if (!isDryRun) {
    await run('pnpm', ['build'], { cwd: pkgDir });
  } else {
    logSkipped();
  }

  // 更新 Change Log
  logStep('Updating changelog...');

  const changelogArgs = [
    'conventional-changelog',
    '-p',
    'angular',
    '-i',
    'CHANGELOG.md',
    '-s',
    '--commit-path',
    '.',
    '--lerna-package',
    pkgName
  ];

  await run('npx', changelogArgs, { cwd: pkgDir });

  // 提交改动
  logStep('Committing changes...');

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' });

  if (stdout) {
    await runIfNotDry('git', ['add', '-A']);
    await runIfNotDry('git', ['commit', '-m', `release(${pkgName}): v${version}`]);
    await runIfNotDry('git', ['tag', tag]);
  } else {
    logSkipped('No changes to commit');
  }

  // 发布
  logStep('Publishing package...');

  const publishArgs = [
    'publish',
    '--access',
    'public',
    '--registry',
    'https://registry.npmjs.org/',
    '--no-git-checks'
  ];

  if (isDryRun) {
    publishArgs.push('--dry-run');
  }

  if (releaseTag) {
    publishArgs.push('--tag', releaseTag);
  }

  try {
    await run('pnpm', publishArgs, { stdio: 'pipe', cwd: pkgDir });
    logger.successText(`Successfully published v${version}'`);
  } catch (err: any) {
    if (err.stderr?.match(/previously published/)) {
      logger.errorText(`Skipping already published v'${version}'`);
    } else {
      throw err;
    }
  }

  // 推送到远程仓库
  logStep('Pushing to Remote Repository...');

  await runIfNotDry('git', ['push', 'origin', `refs/tags/${tag}`]);
  await runIfNotDry('git', ['push']);

  logger.withBothLn(() => {
    if (isDryRun) {
      logger.success('Dry run finished - run git diff to see package changes');
    } else {
      logger.success('Release successfully');
    }
  });
}
