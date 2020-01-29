import * as admin from 'firebase-admin'
import { permissions as allPermissions, Tenant } from '@hoepel.app/types'
import { nodemailerMailgun } from './mailgun'

export class OrganisationService {
  constructor(
    private db: admin.firestore.Firestore,
    private auth: admin.auth.Auth
  ) {}

  async getDetails(organisationId: string): Promise<Tenant | null> {
    const organisation = await this.db
      .collection('tenants')
      .doc(organisationId)
      .get()

    // tslint:disable-next-line:no-unnecessary-type-assertion
    return organisation.exists ? (organisation.data() as Tenant) : null
  }

  async removeUserFromOrganisation(
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
    const tenants =
      user.customClaims && (user.customClaims as any).tenants
        ? (user.customClaims as any).tenants
        : {}
    delete tenants[organisationId]
    const newClaims = { ...(user.customClaims || {}), tenants: tenants }
    await this.auth.setCustomUserClaims(uid, newClaims)
  }

  async addUserToOrganisation(
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
      user.customClaims && (user.customClaims as any).tenants
        ? (user.customClaims as any).tenants
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
      user: any
      permissions: ReadonlyArray<string>
    }>
  > {
    const allUsers = await this.db.collection('users').get()

    const members: ReadonlyArray<{
      belongsToTenant: boolean
      user: any
      permissions: ReadonlyArray<string>
    }> = await Promise.all(
      allUsers.docs.map(userDoc =>
        userDoc.ref
          .collection('tenants')
          .doc(organisationId)
          .get()
          .then(tenantDoc => {
            return {
              belongsToTenant: tenantDoc.exists,
              user: { ...userDoc.data(), uid: userDoc.id },
              permissions:
                tenantDoc.exists &&
                tenantDoc.data() &&
                (tenantDoc.data().permissions as string[])
                  ? tenantDoc.data().permissions
                  : [],
            }
          })
      )
    )

    return members.filter(member => member.belongsToTenant)
  }

  /**
   * List all possible members of an organisation (users that can be added to the organisation)
   */
  async listPossibleMembers(
    organisationId: string
  ): Promise<ReadonlyArray<any>> {
    // TODO should filter out users that are already part of organisation
    return (await this.db.collection('users').get()).docs.map(user => ({
      ...user.data(),
      uid: user.id,
    }))
  }

  /**
   * Request to create a new organisation. Invoked when a user wants to create a new organisation.
   *
   * @param organisation The details of the organisation to be created
   * @param user The details of the users that requested to create this organisation
   */
  async requestCreateNewOrganisation(
    organisation: Tenant,
    user: Record<string, any>
  ): Promise<void> {
    return await nodemailerMailgun.sendMail({
      from: 'noreply@mail.hoepel.app',
      to: 'thomas@toye.io',
      subject: `Nieuwe organisatie geregistreerd: ${organisation.name}`,
      replyTo: 'help@hoepel.app',
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
