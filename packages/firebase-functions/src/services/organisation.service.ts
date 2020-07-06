import * as admin from 'firebase-admin'
import { permissions as allPermissions, Tenant, IUser } from '@hoepel.app/types'
import { notifyAdmin } from './mailgun'

type TenantClaims = {
  [tenantName: string]: true
}

// TODO rename and merge with TenantService
export class OrganisationService {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly auth: admin.auth.Auth
  ) {}

  async getDetails(organisationId: string): Promise<Tenant | null> {
    const organisation = await this.db
      .collection('tenants')
      .doc(organisationId)
      .get()

    return organisation.exists ? (organisation.data() as Tenant) : null
  }

  async unassignMemberFromOrganisation(
    organisationId: string,
    uid: string
  ): Promise<void> {
    // Remove current tenant name in  tenants subcollection of this user
    await this.db
      .collection('users')
      .doc(uid)
      .collection('tenants')
      .doc(organisationId)
      .delete()

    // Remove tenant name from the user's auth claims
    const user = await this.auth.getUser(uid)
    const tenants: TenantClaims =
      user.customClaims &&
      (user.customClaims as { tenants?: TenantClaims }).tenants
        ? (user.customClaims as { tenants: TenantClaims }).tenants
        : {}
    delete tenants[organisationId]
    const newClaims = { ...(user.customClaims || {}), tenants: tenants }
    await this.auth.setCustomUserClaims(uid, newClaims)
  }

  async assignMemberToOrganisation(
    organisationId: string,
    uid: string
  ): Promise<void> {
    // Get all current permissions - new users starts with all permissions for now
    const permissions: ReadonlyArray<string> = allPermissions

    // Insert current tenant in tenants subcollection of this user with set permissions
    await this.db
      .collection('users')
      .doc(uid)
      .collection('tenants')
      .doc(organisationId)
      .set({
        permissions,
      })

    // Add tenant name to the user's auth claims
    const user = await this.auth.getUser(uid)
    const tenants =
      user.customClaims &&
      (user.customClaims as { tenants?: TenantClaims }).tenants
        ? (user.customClaims as { tenants: TenantClaims }).tenants
        : {}
    tenants[organisationId] = true
    const newClaims = { ...(user.customClaims || {}), tenants: tenants }
    await this.auth.setCustomUserClaims(uid, newClaims)
  }

  /**
   * List all members of an organisation
   */
  async listMembers(
    organisationId: string
  ): Promise<
    ReadonlyArray<{
      user: IUser
      permissions: ReadonlyArray<string>
    }>
  > {
    const allUsers = await this.db.collection('users').get()

    const members: ReadonlyArray<{
      belongsToTenant: boolean
      user: IUser
      permissions: ReadonlyArray<string>
    }> = await Promise.all(
      allUsers.docs.map((userDoc) =>
        userDoc.ref
          .collection('tenants')
          .doc(organisationId)
          .get()
          .then((tenantDoc) => {
            return {
              belongsToTenant: tenantDoc.exists,
              user: ({
                ...userDoc.data(),
                uid: userDoc.id,
              } as unknown) as IUser,
              permissions: (tenantDoc.data()?.permissions as string[]) ?? [],
            }
          })
      )
    )

    return members.filter((member) => member.belongsToTenant)
  }

  /**
   * List all possible members of an organisation (users that can be added to the organisation)
   */
  async listPossibleMembers(
    organisationId: string
  ): Promise<ReadonlyArray<IUser & { uid: string }>> {
    const allUsers = (await this.db.collection('users').get()).docs.map(
      (user) => {
        return ({
          ...user.data(),
          uid: user.id,
        } as unknown) as IUser & { uid: string }
      }
    )

    const currentMembers = (await this.listMembers(organisationId)).map(
      (member) => member.user.email
    )

    return allUsers.filter((user) => !currentMembers.includes(user.email))
  }

  /**
   * Request to create a new organisation. Invoked when a user wants to create a new organisation.
   *
   * @param organisation The details of the organisation to be created
   * @param user The details of the users that requested to create this organisation
   */
  async requestCreateNewOrganisation(
    organisation: Tenant,
    user: Record<string, unknown>
  ): Promise<void> {
    return await notifyAdmin({
      subject: `Nieuwe organisatie geregistreerd: ${organisation.name}`,
      text: `Een nieuwe organisatie heeft zich geregistreerd. Naam: ${organisation.name}, contact: ${organisation.contactPerson.name}. Details als bijlage.`,
      attachments: [
        {
          content: JSON.stringify(organisation, null, 2),
          filename: 'new-tenant-details.txt',
        },
        {
          content: JSON.stringify(user, null, 2),
          filename: 'user-details.txt',
        },
      ],
    })
  }
}
