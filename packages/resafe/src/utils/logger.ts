import { stdout } from "node:process"

const ESC = "\x1b["

class Formatter {
  private parts = ""
  private text: string

  constructor(text: string) {
    this.text = text
  }

  code(code: string) {
    this.parts += `${ESC}${code}m`
    return this
  }

  static create(text: string) {
    return new Formatter(text)
  }

  bold() {
    return this.code("1")
  }
  white() {
    return this.code("97")
  }
  darkGray() {
    return this.code("90")
  }
  red() {
    return this.code("38;2;255;85;85")
  }
  yellow() {
    return this.code("38;2;255;200;50")
  }
  blue() {
    return this.code("38;2;100;149;237")
  }
  green() {
    return this.code("38;2;85;255;85")
  }
  pastelRedBg() {
    return this.code("48;2;255;85;85")
  }
  pastelYellowBg() {
    return this.code("48;2;255;200;50")
  }

  toString() {
    return `${this.parts}${this.text}${ESC}0m`
  }
  [Symbol.toPrimitive]() {
    return this.toString()
  }
}

const fmt = (text: string) => Formatter.create(text)

export type LogProperty = {
  name: string
  value: string
  color?: (fmt: Formatter) => Formatter
}

export type LogOptions = {
  property?: LogProperty
  lines?: string[]
}

function formatLogLine(
  prefixBg: (f: Formatter) => Formatter,
  msg: string,
  options?: LogOptions,
) {
  const prefix = prefixBg(fmt(" RESAFE ").bold()).white()
  let line = `${prefix} ${fmt(msg).white()}`

  if (options?.property) {
    const prop = options.property
    const nameFmt = prop.color
      ? prop.color(fmt(prop.name))
      : fmt(prop.name).bold()
    line += ` ${nameFmt}=${fmt(prop.value).white()}`
  }

  stdout.write(`${line}\n`)

  if (options?.lines) {
    for (const l of options.lines) {
      stdout.write(`  ${fmt("│").darkGray()} ${fmt(l).white()}\n`)
    }
    stdout.write("\n")
  }
}

export const log = {
  error: (msg: string, options?: LogOptions) =>
    formatLogLine((f) => f.pastelRedBg(), msg, options),
  warn: (msg: string, options?: LogOptions) =>
    formatLogLine((f) => f.pastelYellowBg(), msg, options),
}