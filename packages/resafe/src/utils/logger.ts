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
  pastelRedBg() {
    return this.code("48;2;255;85;85")
  }

  toString() {
    return `${this.parts}${this.text}${ESC}0m`
  }
  [Symbol.toPrimitive]() {
    return this.toString()
  }
}

const fmt = (text: string) => Formatter.create(text)

export const log = {
  error: (msg: string, regex?: string, extra?: string[]) => {
    let firstLine = `${fmt(" RESAFE ").bold().pastelRedBg().white()} ${fmt(msg).white()}`
    if (regex) {
      firstLine += ` ${fmt("regex").red()}${fmt("=").darkGray()}${fmt(regex).white()}`
    }
    stdout.write(`${firstLine}\n`)
    if (extra) log.quote(extra)
  },

  warn: (msg: string, regex?: string, extra?: string[]) => {
    let firstLine = `${fmt(" RESAFE ").bold().pastelRedBg().white()} ${fmt(msg).white()}`
    if (regex) {
      firstLine += ` ${fmt("regex").red()}${fmt("=").darkGray()}${fmt(regex).white()}`
    }
    stdout.write(`${firstLine}\n`)
    if (extra) log.quote(extra)
  },

  hint: (msg: string | string[]) => {
    const lines = Array.isArray(msg) ? msg : [msg]
    log.quote(lines)
  },

  quote: (lines: string[]) => {
    lines.forEach((line) => {
      stdout.write(`  ${fmt("│").darkGray()} ${fmt(line).white()}\n`)
    })
    stdout.write("\n")
  },
}
