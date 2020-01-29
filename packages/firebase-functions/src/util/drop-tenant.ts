/**
 * Drop tenant property from given object
 */
// TODO Is this function still needed now that mostly everything uses a repository that abstracts away tenant?
export default function dropTenant<T>(
  obj: T & { tenant: string }
): Omit<T, 'tenant'> {
  const { tenant, ...withoutTenant } = obj
  return withoutTenant
}
