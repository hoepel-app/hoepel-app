export class ZipError extends Error {
  constructor(cause: Error) {
    super('Error while loading DOCX as a ZIP file: ' + cause.message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ZipError.prototype)
  }
}

export class TemplatingError extends Error {
  constructor(public cause: Error) {
    super(
      `Error while filling out template: ${
        cause.message
      }; ${TemplatingError.getTemplateErrors(cause).join(', ')}`
    )

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, TemplatingError.prototype)
  }

  get templateErrors(): string[] {
    return TemplatingError.getTemplateErrors(this.cause)
  }

  private static getTemplateErrors(docxError: Error): string[] {
    const errors = (docxError as any)?.properties?.errors

    if (Array.isArray(errors)) {
      return errors.map((err) => err?.properties?.explanation)
    }

    return []
  }
}
