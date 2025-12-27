import { analyze, type Config, type Result } from "./core/analyzer.ts"
import { log } from "./utils/logger.ts"

export interface Options extends Config {
  silent?: boolean
  throwErr?: boolean
}

export function check(regex: string | RegExp, options: Options = {}): Result {
  const pattern = typeof regex === "string" ? regex : regex.source
  const result = analyze(pattern, options)
  const radius = Number(result.radius.toFixed(4))

  if (!result.safe && !options.silent) {
    log.error("Unsafe Regex!", {
      property: { name: "regex", value: `/${pattern}/`, color: (f) => f.red() },
      lines: [
        `Spectral radius: ${radius} (threshold: ${options.threshold ?? 1.0})`,
        "? Consider simplifying quantifiers",
      ],
    })
  }

  if (!result.safe && options.throwErr) {
    throw new Error(`Unsafe regex (spectral radius ${radius})`)
  }

  return result
}

export async function checkAsync(
  regex: string | RegExp,
  options: Options = {},
): Promise<Result> {
  return Promise.resolve(check(regex, options))
}

export type { Result, Config } from "./core/analyzer.ts"
