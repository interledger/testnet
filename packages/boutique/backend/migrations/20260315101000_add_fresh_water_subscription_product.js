const freshWaterProduct = {
  id: '0f281e2f-772d-4f67-89ea-f0f7656714cb',
  name: 'Fresh Water',
  slug: 'fresh-water',
  description:
    '&quot;Small drops, every day. Stay hydrated, stay inspired.&quot; - Interledger Boutique',
  price: 3.5,
  image: 'kindness.png',
  imageDark: 'kindness-dark.png',
  productType: 'SUBSCRIPTION',
  billingInterval: 'DAY',
  billingIntervalCount: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const existing = await knex('products')
    .where({ id: freshWaterProduct.id })
    .orWhere({ slug: freshWaterProduct.slug })
    .first()

  if (!existing) {
    await knex('products').insert(freshWaterProduct)
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('products').where({ id: freshWaterProduct.id }).delete()
}
