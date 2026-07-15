/** The result of rotating a grant access token. */
export interface RotatedToken {
  value: string
  manageUrl?: string
}

export type RotateFn = (
  manageUrl: string,
  currentValue: string
) => Promise<RotatedToken>

/**
 * A single grant access token shared by all workers in a scenario, with
 * coordinated rotation.
 *
 * Access tokens expire; over a long run they must be rotated via the grant's
 * `manage` URL. Rotation invalidates the old token, so concurrent rotations
 * would clobber each other. {@link rotate} therefore de-duplicates: a worker
 * passes the token value it just saw fail; if another worker has already
 * rotated past it, the caller simply receives the current value; otherwise a
 * single rotation runs and all waiters observe its result.
 */
export class RotatingToken {
  private value: string
  private manageUrl?: string
  private rotating: Promise<void> | null = null

  constructor(
    initial: { value: string; manageUrl?: string },
    private readonly rotateFn: RotateFn
  ) {
    this.value = initial.value
    this.manageUrl = initial.manageUrl
  }

  /** The current token value. */
  current(): string {
    return this.value
  }

  /**
   * Rotate the token, given the (possibly stale) value the caller used. If the
   * shared value has already moved on, returns the current value without
   * rotating. Throws if rotation is needed but no manage URL is available.
   */
  async rotate(usedValue: string): Promise<string> {
    if (usedValue !== this.value) {
      // Someone else already rotated past the value this caller used.
      return this.value
    }
    if (!this.manageUrl) {
      throw new Error('Cannot rotate token: no manage URL available')
    }
    if (!this.rotating) {
      this.rotating = this.doRotate(this.manageUrl, this.value)
    }
    await this.rotating
    return this.value
  }

  private async doRotate(
    manageUrl: string,
    currentValue: string
  ): Promise<void> {
    try {
      const rotated = await this.rotateFn(manageUrl, currentValue)
      this.value = rotated.value
      this.manageUrl = rotated.manageUrl
    } finally {
      this.rotating = null
    }
  }
}
