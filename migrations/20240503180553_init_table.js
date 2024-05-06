/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  return knex.schema.createTable('messages', function (table) {
    table.uuid('uuid').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.text('text').notNullable();
    table.string('sent_by_fullname').notNullable();
    table.string('sent_by_uuid').notNullable();
    table.string('twilio_id').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('messages');
};
