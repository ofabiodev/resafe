import { analyze, type Config, type Result } from "./core/analyzer.ts"
import { log } from "./utils/logger.ts"

export interface Options extends Config {
  silent?: boolean
  throwErr?: boolean
}

export function check(
  regex: string | RegExp,
  options: Options = {},
): Result | null {
  if (regex == null || regex === "") {
    const err = new Error("Empty regex. Provide a valid pattern.")
    log.warn("Empty regex!", {
      lines: ["? Provide a valid regex."],
    })
    if (options.throwErr) throw err
    return null
  }

  if (typeof regex !== "string" && !(regex instanceof RegExp)) {
    const err = new TypeError("Regex must be string or RegExp")
    log.error("Invalid regex!", {
      property: { name: "type", value: typeof regex },
    })
    throw err
  }

  const pattern = typeof regex === "string" ? regex : regex.source

  try {
    new RegExp(pattern)
  } catch (err) {
    if (err instanceof SyntaxError) {
      log.error("Invalid regex syntax!", {
        lines: [`? ${err.message}`],
      })
      if (options.throwErr) throw err
      return null
    }
    throw err
  }

  if (/\\u\{[0-9A-Fa-f]+\}/.test(pattern)) {
    log.warn("Unicode escape sequences may not be fully supported", {
      property: { name: "pattern", value: pattern },
    })
  }

  const result = analyze(pattern, options)
  const radius = Number(result.radius.toFixed(4))

  if (!result.safe) {
    const err = new Error(`Unsafe regex (spectral radius ${radius})`)

    if (!options.silent) {
      log.error("Unsafe Regex!", {
        property: {
          name: "regex",
          value: `/${pattern}/`,
          color: (f) => f.red(),
        },
        lines: [
          `Spectral radius: ${radius} (threshold: ${options.threshold ?? 1.0})`,
          "? Consider simplifying quantifiers",
        ],
      })
    }

    if (options.throwErr) throw err
  }

  return result
}

export async function checkAsync(
  regex: string | RegExp,
  options: Options = {},
): Promise<Result | null> {
  return Promise.resolve(check(regex, options))
}

export type { Result, Config } from "./core/analyzer.ts"