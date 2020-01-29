export class NotAuthenticatedError extends Error {
  constructor(public message: string, public cause?: Error) {
    super(message) // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}
