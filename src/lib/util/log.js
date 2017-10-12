import chalk from 'chalk'
// const { env } = require('../env')
// const nodeUtil = require('util')

export async function info(...messages) {
  if (await env('loglevel', 'number', 0) > 0) return

  console.log(chalk`{blue [info]} ${messages.join(', ')}`)
}

export async function success(...messages) {
  if (await env('loglevel', 'number', 0) > 1) return

  console.log(chalk`{green [success]} ${messages.join(', ')}`)
}

export async function warn(...messages) {
  if (await env('loglevel', 'number', 0) > 2) return

  console.error(chalk`{yellow [warn]} ${messages.join(', ')}`)
  console.trace('Stack trace')
}

export async function debug(...messages) {
  if (await env('loglevel', 'number', 0) > -1) return

  console.log(chalk`{dim [debug]} ${messages.join(', ')}`)
}

export async function inspect(...objects) {
  if (await env('loglevel', 'number', 0) > -1) return

  process.stdout.write(chalk`{dim [inspect]} `)

  for (let object of objects) {
    console.log(nodeUtil.inspect(object, {
      depth: null,
      colors: true,
    }))
  }
}
