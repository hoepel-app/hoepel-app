export class NoPermissionError extends Error {
  constructor(
    public message: string,
    public extraInformation?: {
      /** Whether the current user is an admin */
      isAdmin?: boolean

      /** Whether an admin is allowed to access the resource/perform the action */
      adminAllowed?: boolean

      /** The tenant the requested resource belongs to */
      tenant?: string

      /** Whether the permission doc exists for the user */
      permissionsDocExists?: boolean

      /** The permission needed to perform the action or to access the resource */
      permissionNeeded?: string

      /** The permissions the user has */
      permissions?: ReadonlyArray<string>
    },
    caused?: Error
  ) {
    super(message) // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}
