// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      database: 'twilio_demo',
      user: 'kirstenlindsmith',
      password: 'password',
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },
};
