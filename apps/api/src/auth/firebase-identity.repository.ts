import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import type { AppConfig } from '../config';
import type { AuthenticatedPrincipal, AuthenticatedUser, IdentityRepository } from './auth.types';

type UserRow = {
  id: string;
  display_name: string;
  email: string | null;
  tenant_id: string;
};

type TenantRow = {
  id: string;
  name: string;
  owner_user_id: string;
};

@Injectable()
export class FirebaseIdentityRepository
  implements IdentityRepository, OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(FirebaseIdentityRepository.name);
  private readonly pool: Pool;

  constructor(config: AppConfig['database']) {
    this.pool = new Pool({ connectionString: config.url });
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
    this.logger.log('PostgreSQL identity repository connected');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }

  async getOrCreatePersonalIdentity(
    principal: AuthenticatedPrincipal,
  ): Promise<AuthenticatedUser> {
    const identityKey = this.identityKey(principal.issuer, principal.subject);
    const userId = `user-${identityKey}`;
    const tenantId = `personal-${identityKey}`;
    const displayName = principal.displayName?.slice(0, 120) ?? 'Traveler';
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await this.createOrReadTenant(client, {
        id: tenantId,
        name: `${displayName}'s trips`,
        ownerUserId: userId,
      });
      const user = await this.createOrReadUser(client, {
        id: userId,
        displayName,
        ...(principal.email ? { email: principal.email } : {}),
        tenantId,
      });
      const tenant = await this.readTenant(client, user.tenant_id);
      if (tenant.owner_user_id !== user.id) {
        throw new Error('Personal tenant ownership could not be verified');
      }
      await client.query('COMMIT');

      return {
        id: user.id,
        ...(user.email ? { email: user.email } : {}),
        displayName: user.display_name,
        tenant: {
          id: user.tenant_id,
          name: tenant.name,
          type: 'personal',
          role: 'owner',
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async createOrReadTenant(
    client: PoolClient,
    tenant: { id: string; name: string; ownerUserId: string },
  ): Promise<TenantRow> {
    await client.query(
      `INSERT INTO tenants (id, name, type, owner_user_id)
       VALUES ($1, $2, 'personal', $3)
       ON CONFLICT (id) DO NOTHING`,
      [tenant.id, tenant.name, tenant.ownerUserId],
    );
    const result = await client.query<TenantRow>(
      'SELECT id, name, owner_user_id FROM tenants WHERE id = $1',
      [tenant.id],
    );
    const row = result.rows[0];
    if (!row || row.owner_user_id !== tenant.ownerUserId) {
      throw new Error('Personal tenant ownership could not be verified');
    }
    return row;
  }

  private async createOrReadUser(
    client: PoolClient,
    user: { id: string; displayName: string; email?: string; tenantId: string },
  ): Promise<UserRow> {
    await client.query(
      `INSERT INTO users (id, display_name, email, tenant_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.displayName, user.email ?? null, user.tenantId],
    );
    const result = await client.query<UserRow>(
      'SELECT id, display_name, email, tenant_id FROM users WHERE id = $1',
      [user.id],
    );
    const row = result.rows[0];
    if (!row || row.tenant_id !== user.tenantId) {
      throw new Error('User profile could not be read or verified');
    }
    return row;
  }

  private async readTenant(client: PoolClient, tenantId: string): Promise<TenantRow> {
    const result = await client.query<TenantRow>(
      'SELECT id, name, owner_user_id FROM tenants WHERE id = $1',
      [tenantId],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Personal tenant could not be read');
    return row;
  }

  private identityKey(issuer: string, subject: string): string {
    return createHash('sha256').update(`${issuer}\0${subject}`).digest('hex');
  }
}
