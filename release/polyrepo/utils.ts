import { resolve, dirname } from 'node:path'
import {
  readdirSync,
  existsSync,
  lstatSync,
  rmdirSync,
  unlinkSync,
  readFileSync
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { bgYellow, bgCyan, bgGreen, bgRed, yellow, cyan, green, red, lightBlue } from 'kolorist'
import prompts from 'prompts'

import type { Options } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const rootDir = resolve(__dirname, '../..')

type LogFn = () => void

export const logger = {
  ln: () => console.log(),
  withStartLn: (log: LogFn) => {
    logger.ln()
    log()
  },
  withEndLn: (log: LogFn) => {
    log()
    logger.ln()
  },
  withBothLn: (log: LogFn) => {
    logger.ln()
    log()
    logger.ln()
  },
  warning: (msg: string) => {
    console.warn(`${bgYellow(' WARNING ')} ${yellow(msg)}`)
  },
  info: (msg: string) => {
    console.log(`${bgCyan(' INFO ')} ${cyan(msg)}`)
  },
  success: (msg: string) => {
    console.log(`${bgGreen(' SUCCESS ')} ${green(msg)}`)
  },
  error: (msg: string) => {
    console.error(`${bgRed(' ERROR ')} ${red(msg)}`)
  },
  warningText: (msg: string) => {
    console.warn(`${yellow(msg)}`)
  },
  infoText: (msg: string) => {
    console.log(`${cyan(msg)}`)
  },
  successText: (msg: string) => {
    console.log(`${green(msg)}`)
  },
  errorText: (msg: string) => {
    console.error(`${red(msg)}`)
  }
}

export function bin(name: string) {
  return resolve(rootDir, 'node_modules/.bin/' + name)
}

export async function run(bin: string, args: string[], opts: Options = {}) {
  return execa(bin, args, { stdio: 'inherit', ...opts })
}

export async function dryRun(bin: string, args: string[], opts: Options = {}) {
  console.log(lightBlue(`[dryrun] ${bin} ${args.join(' ')}`), opts)
}

function allCapital(value: string) {
  const matched = value.match(/[A-Z]+/)

  return matched && matched[0] === value
}

// 短横线命名
export function toKebabCase(value: string) {
  if (allCapital(value)) {
    return value.toLocaleLowerCase()
  }

  return (
    value.charAt(0).toLowerCase() +
    value
      .slice(1)
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
  )
}

// 全大写命名
export function toCapitalCase(value: string) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1).replace(/-([a-z])/g, (_, char) => (char ? char.toUpperCase() : ''))
  )
}

// 驼峰命名
export function toCamelCase(value: string) {
  const capitalName = toCapitalCase(value)

  if (allCapital(capitalName)) {
    return capitalName.toLocaleLowerCase()
  }

  return capitalName.charAt(0).toLowerCase() + capitalName.slice(1)
}

export async function runParallel<T>(
  maxConcurrency: number,
  source: T[],
  iteratorFn: (item: T, source: T[]) => Promise<any>
) {
  const ret: Array<Promise<any>> = []
  const executing: Array<Promise<any>> = []

  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source))

    ret.push(p)

    if (maxConcurrency <= source.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1))

      executing.push(e)

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }
  }

  return Promise.all(ret)
}

export function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }

  for (const file of readdirSync(dir)) {
    const abs = resolve(dir, file)

    if (lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      rmdirSync(abs)
    } else {
      unlinkSync(abs)
    }
  }
}

const packages = readdirSync(resolve(__dirname, '../packages'))

export async function getPackageInfo(inputPkg: string) {
  let pkgName: string | null = null

  if (packages.includes(inputPkg)) {
    pkgName = inputPkg
  } else {
    let options = inputPkg ? packages.filter(p => p.includes(inputPkg)) : packages

    if (!options.length) {
      options = packages
    } else if (options.length === 1) {
      pkgName = options[0]
    } else {
      pkgName = (
        await prompts({
          type: 'select',
          name: 'pkgName',
          message: 'Select release package:',
          choices: options.map(n => ({ title: n, value: n }))
        })
      ).pkgName
    }
  }

  if (!pkgName) {
    throw new Error('Release package must not be null')
  }

  // 根目录下的 package.json -> name
  const isRoot = pkgName === 'release'
  const pkgDir = isRoot ? rootDir : resolve(rootDir, pkgName)
  const pkgPath = resolve(pkgDir, 'package.json')

  if (!existsSync(pkgPath)) {
    throw new Error(`Release package ${pkgName} not found`)
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  if (pkg.private) {
    throw new Error(`Release package ${pkgName} is private`)
  }

  return {
    pkgName,
    pkgDir,
    pkgPath,
    pkg,
    isRoot,
    currentVersion: pkg.version
  }
}