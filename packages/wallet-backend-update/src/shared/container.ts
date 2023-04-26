type Resolver<T> = () => Promise<T>

export class Container<T> {
  private resolvers: Map<keyof T, Resolver<T[keyof T]>> = new Map()

  public register<K extends keyof T>(
    alias: K,
    resolver: Resolver<T[K]>,
    singleton = true
  ): void {
    if (singleton) {
      const instance = resolver()
      this.resolvers.set(alias, () => instance)
    } else {
      this.resolvers.set(alias, resolver)
    }
  }

  public transient<K extends keyof T>(
    alias: K,
    resolver: Resolver<T[K]>
  ): void {
    this.register(alias, resolver, false)
  }

  public async resolve<K extends keyof T>(alias: K): Promise<T[K]> {
    const resolver = this.resolvers.get(alias) as Resolver<T[K]>

    if (!resolver) {
      throw new Error(`No resolver found for alias "${String(alias)}"`)
    }

    return await resolver()
  }
}
