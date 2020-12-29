/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'pizzip' {
  export = pizzip
}

type FilenameDecoder = (buf: any[] | Uint8Array | Buffer) => string
type FilenameEncoder = (filename: string) => Buffer

type GenerateOptions = {
  /** @deprecated use type instead */
  base64?: boolean
  compression?: string
  compressionOptions?: null
  type?:
    | 'string'
    | 'base64'
    | 'uint8array'
    | 'arraybuffer'
    | 'blob'
    | 'nodebuffer'
  platform?: string
  comment?: null
  mimeType?: 'application/zip'
  encodeFileName?: FilenameEncoder
}

type ZipObject = any

type LoadOptions = {
  base64?: boolean
  checkCRC32?: boolean
  optimizedBinaryString?: boolean
  createFolders?: boolean
  decodeFileName?: FilenameDecoder
}

declare class pizzip {
  constructor(data: string | ArrayBuffer | Uint8Array, options?: LoadOptions)

  crc32(input: string | number[], crc: string | number): number

  file(name: string): null | ZipObject

  filter(
    predicate: (relativePath: string, file: ZipObject) => boolean
  ): ZipObject[]

  folder(arg: any): any

  generate(
    options: GenerateOptions
  ): string | Uint8Array | ArrayBuffer | Buffer | Blob

  load(
    data: string | number[] | ArrayBuffer | Uint8Array | Buffer,
    options: LoadOptions
  ): pizzip

  remove(name: string): pizzip

  utf8decode(input: any): any

  utf8encode(string: any): any

  static compressions: {
    DEFLATE: {
      compress: any
      compressInputType: string
      magic: string
      uncompress: any
      uncompressInputType: string
    }
    STORE: {
      compress: any
      compressInputType: any
      magic: string
      uncompress: any
      uncompressInputType: any
    }
  }

  static defaults: {
    base64: boolean
    binary: boolean
    comment: string | null
    compression: string | null
    compressionOptions: any | null
    createFolders: boolean
    date: Date | null
    dir: boolean
    dosPermissions: number
    unixPermissions: number
  }

  static support: {
    array: boolean
    arraybuffer: boolean
    base64: boolean
    blob: boolean
    nodebuffer: boolean
    string: boolean
    uint8array: boolean
  }
}

declare namespace pizzip {
  namespace base64 {
    /** @deprecated */
    function decode(input: string): any

    /** @deprecated */
    function encode(input: any): string
  }

  namespace utils {
    /** @deprecated */
    const MAX_VALUE_16BITS: number

    /** @deprecated */
    const MAX_VALUE_32BITS: number

    /** @deprecated */
    function arrayBuffer2Blob(
      buffer: ArrayBufferView | ArrayBuffer,
      mimetype: string
    ): Blob

    /** @deprecated */
    function checkSupport(type: string): void

    /** @deprecated */
    function findCompression(compressionMethod: string): any

    /** @deprecated */
    function getTypeOf(input: any): string

    /** @deprecated */
    function isRegExp(object: any): boolean

    /** @deprecated */
    function pretty(str: string): string

    /** @deprecated */
    function string2Blob(str: string): Blob

    /** @deprecated */
    function string2Uint8Array(str: string): Uint8Array

    /** @deprecated */
    function string2binary(str: string): string

    /** @deprecated */
    function transformTo(outputType: string, input: any): any

    /** @deprecated */
    function uint8Array2String(array: Uint8Array): string
  }
}
