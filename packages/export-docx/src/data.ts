/** Data that can be filled in to a template file */
export type CertificateTemplateFillInData = {
  readonly kind_naam: string
  readonly kind_adres: string
  readonly kind_telefoon: string
  readonly kind_geboortedatum: string

  readonly contactpersoon_naam: string

  readonly organisator_naam: string
  readonly organisator_adres: string
  readonly organisator_email: string
  readonly organisator_telefoon: string
  readonly organisator_verantwoordelijke: string

  readonly jaar: string
  readonly concrete_data: string
  readonly aantal_dagen: string
  readonly prijs_per_dag: string
  readonly totale_prijs: string

  readonly attest_id: string

  readonly aanmaakdatum: string
}
