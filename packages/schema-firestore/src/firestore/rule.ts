export type Operation = 'read' | 'create' | 'update' | 'delete'

/**
 * Possible values:
 * - true:   Operation is always allowed
 * - false:  Operation is never allowed
 * - string: Operation is allowed if provided valid Firestore rules syntax returns true
 */
export type AllowValue = string | boolean

/** Represents a Firestore rule block (`match /.../... { ... }`) */
export class Rule {
  /**
   * @param options.comment Comment without forward slashes to add before rule
   * @param options.match Match statement, e.g. '/databases/{database}/documents/discounts/{document}'
   * @param options.extra Optional extra string to include in statement, e.g. a function
   * @param options.allow{Write,Read,Update,Delete} If (operation)s are allowed. See AllowValue for explanation
   */
  constructor(
    private readonly options: {
      readonly comment: string
      readonly match: string
      readonly extra?: string
      readonly allowCreate: AllowValue
      readonly allowRead: AllowValue
      readonly allowUpdate: AllowValue
      readonly allowDelete: AllowValue
    }
  ) {}

  private get createExpression(): string | null {
    return this.buildExpression('create', this.options.allowCreate)
  }

  private get readExpression(): string | null {
    return this.buildExpression('read', this.options.allowRead)
  }

  private get updateExpression(): string | null {
    return this.buildExpression('update', this.options.allowUpdate)
  }

  private get deleteExpression(): string | null {
    return this.buildExpression('delete', this.options.allowDelete)
  }

  private get extra(): string {
    if (this.options.extra) {
      return this.options.extra
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')
    } else {
      return ''
    }
  }

  private buildExpression(operation: Operation, value: AllowValue): string {
    if (value === false || value === true) {
      return `allow ${operation.padEnd(6)}: if ${value.toString()};`
    } else {
      return `allow ${operation.padEnd(6)}: if ${value};`
    }
  }

  toString(): string {
    return [
      `// ${this.options.comment}`,
      `match ${this.options.match} {`,
      this.extra,
      `  ${this.createExpression}`,
      `  ${this.readExpression}`,
      `  ${this.updateExpression}`,
      `  ${this.deleteExpression}`,
      '}',
    ]
      .filter((line) => line.trim() !== '')
      .join('\n')
  }
}
