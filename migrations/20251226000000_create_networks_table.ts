import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('networks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('chain_id').notNullable().unique();
    table.string('name', 100).notNullable();
    table.string('rpc_url', 500).notNullable();
    table.jsonb('other_rpc_urls').defaultTo('[]');
    table.boolean('test_net').notNullable().defaultTo(false);
    table.string('block_explorer_url', 500).notNullable();
    table.decimal('fee_multiplier', 10, 4).notNullable().defaultTo(1.0);
    table.decimal('gas_limit_multiplier', 10, 4).notNullable().defaultTo(1.0);
    table.boolean('active').notNullable().defaultTo(true);
    table.string('default_signer_address', 42).notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_networks_chain_id ON networks(chain_id)');
  await knex.schema.raw('CREATE INDEX idx_networks_active ON networks(active)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('networks');
}
