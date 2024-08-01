/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex('walletAddresses').update({ assetScale: 9 });
  };
  
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
await knex('walletAddresses').update({ assetScale: 2 });
};
  