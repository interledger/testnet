const products = [
  {
    name: 'Luck',
    slug: 'luck',
    description:
      '&quot;I am a great believer in luck, and I find the harder I work, the more I have of it.&quot; - Thomas Jefferson',
    price: 99.99,
    image: 'luck.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Knowledge',
    slug: 'knowledge',
    description:
      '&quot;To know that we know what we know, and to know that we do not know what we do not know, that is true knowledge.&quot; - Nicolaus Copernicus',
    price: 54.5,
    image: 'knowledge.png',
    createdAt: new Date(Date.now() + 10).toISOString(),
    updatedAt: new Date(Date.now() + 10).toISOString()
  },
  {
    name: 'Courage',
    slug: 'courage',
    description:
      '&quot;Courage is the most important of all the virtues, because without courage you can&apos;t practice any other virtue consistently. You can practice any virtue erratically, but nothing consistently without courage.&quot; - Maya Angelou',
    price: 19.99,
    image: 'courage.png',
    createdAt: new Date(Date.now() + 10 * 2).toISOString(),
    updatedAt: new Date(Date.now() + 10 * 2).toISOString()
  },
  {
    name: 'Patience',
    slug: 'patience',
    description:
      '&quot;Learning patience can be a difficult experience, but once conquered, you will find life is easier.&quot; - Catherine Pulsifer',
    price: 27.99,
    image: 'patience.png',
    createdAt: new Date(Date.now() + 10 * 3).toISOString(),
    updatedAt: new Date(Date.now() + 10 * 3).toISOString()
  },
  {
    name: 'Kindness',
    slug: 'kindness',
    description:
      '&quot;Carry out a random act of kindness, with no expectation of reward, safe in the knowledge that one day someone might do the same for you.&quot; - Princess Diana',
    price: 32.0,
    image: 'kindness.png',
    createdAt: new Date(Date.now() + 10 * 4).toISOString(),
    updatedAt: new Date(Date.now() + 10 * 4).toISOString()
  },
  {
    name: 'Opportunity',
    slug: 'opportunity',
    description:
      '&quot;A pessimist sees the difficulty in every opportunity; an optimist sees the opportunity in every difficulty.&quot; - Winston Churchill',
    price: 123.79,
    image: 'opportunity.png',
    createdAt: new Date(Date.now() + 10 * 5).toISOString(),
    updatedAt: new Date(Date.now() + 10 * 5).toISOString()
  }
]

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('products').insert(products)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('products').delete()
}
