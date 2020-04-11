// This file contains minimal definitions for docxtemplater, only what's needed in this project
// TODO replace with @types/ or official types if they come available

declare module 'docxtemplater' {
  export = docxtemplater
}

type ConstructorOptions = {
  linebreaks: boolean
  nullGetter: (part: { module: string }) => string
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
declare class docxtemplater {
  constructor(zip: pizzip, options?: ConstructorOptions)

  setData: (data: { [key: string]: string }) => void
  render: () => void
  getZip: () => pizzip
}
