import { NextFunction, Request, Response } from 'express'
import { decode } from 'jsonwebtoken'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Logger = (message?: any, ...optionalParams: any[]) => void

const getLoggerForStatusCode = (statusCode: number): Logger => {
  if (statusCode >= 500) {
    return console.error.bind(console)
  }
  if (statusCode >= 400) {
    return console.warn.bind(console)
  }

  return console.log.bind(console)
}

const getUid = (req: Request): string => {
  if (
    req.header('Authorization') &&
    req.header('Authorization').startsWith('Bearer: ')
  ) {
    const token = decode(req.header('Authorization').slice('Bearer: '.length))
    return token ? 'uid:' + token.sub : ''
  } else {
    return ''
  }
}

export const logRequestStart = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const uid = getUid(req)
  console.info(`${req.method} ${req.originalUrl} ${uid}`)

  const logFn = (): void => {
    cleanup()
    const logger = getLoggerForStatusCode(res.statusCode)
    logger(
      `${req.method} ${req.originalUrl} => ${res.statusCode} ${
        res.statusMessage
      } ${uid}; ${res.get('Content-Length') || 0}b sent`
    )
  }

  const abortFn = (): void => {
    cleanup()
    console.warn('Request aborted by the client')
  }

  const errorFn = (err: Error): void => {
    cleanup()
    console.error(`Request pipeline error: ${err}`)
  }

  res.on('finish', logFn) // successful pipeline (regardless of its response)
  res.on('close', abortFn) // aborted pipeline
  res.on('error', errorFn) // pipeline internal error

  const cleanup = (): void => {
    res.removeListener('finish', logFn)
    res.removeListener('close', abortFn)
    res.removeListener('error', errorFn)
  }

  next()
}
