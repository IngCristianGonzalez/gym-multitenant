/**
 * Request-scoped context holder for the current tenant (empresa).
 * Injected after JWT validation so every Prisma query is scoped by empresaId.
 */
export interface TenantContext {
  empresaId: string;
  userId: string;
  rol: string;
}

export class TenantStore {
  private static readonly store = new WeakMap<object, TenantContext>();

  static set(req: object, ctx: TenantContext) {
    this.store.set(req, ctx);
  }

  static get(req: object): TenantContext {
    const ctx = this.store.get(req);
    if (!ctx) {
      throw new Error('Tenant context not initialized');
    }
    return ctx;
  }
}
