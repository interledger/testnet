const products = [
  {
    id: '84af033c-00eb-4cde-b5ec-f18cf7adaea2',
    name: 'Luck',
    slug: 'luck',
    description:
      '&quot;I am a great believer in luck, and I find the harder I work, the more I have of it.&quot; - Thomas Jefferson',
    price: 77.0,
    image: 'luck.png',
    imageDark: 'luck-dark.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '040b7be3-3d51-4271-94ff-53f5c249e244',
    name: 'Knowledge',
    slug: 'knowledge',
    description:
      '&quot;To know that we know what we know, and to know that we do not know what we do not know, that is true knowledge.&quot; - Nicolaus Copernicus',
    price: 54.0,
    image: 'knowledge.png',
    imageDark: 'knowledge-dark.png',
    createdAt: new Date(Date.now() + 10).toISOString(),
    updatedAt: new Date(Date.now() + 10).toISOString()
  },
  {
    id: '7c302c62-dbfe-4b57-a7d1-e3b9cdb762b3',
    name: 'Courage',
    slug: 'courage',
    description:
      '&quot;Courage is the most important of all the virtues, because without courage you can&apos;t practice any other virtue consistently. You can practice any virtue erratically, but nothing consistently without courage.&quot; - Maya Angelou',
    price: 20.0,
    image: 'courage.png',
    imageDark: 'courage-dark.png',
    createdAt: new Date(Date.now() + 10 * 2).toISOString(),
    updatedAt: new Date(Date.now() + 10 * 2).toISOString()
  },
  {
    id: 'ad3b7c70-fb28-4c1c-99ea-4028feac3421',
    name: 'Patience',
    slug: 'patience',
    description:
      '&quot;Learning patience can be a difficult experience, but once conquered, you will find life is easier.&quot; - Catherine Pulsifer',
    price: 28.0,
    image: 'patience.png',
    imageDark: 'patience-dark.png',
    createdAt: new Date(Date.now() + 10 * 3).toISOString(),
    updatedAt: new Date(Date.now() + 10 * 3).toISOString()
  },
  {
    id: 'f23fd439-b2c0-481d-b350-373abd3923dd',
    name: 'Opportunity',
    slug: 'opportunity',
    description:
      '&quot;A pessimist sees the difficulty in every opportunity; an optimist sees the opportunity in every difficulty.&quot; - Winston Churchill',
    price: 123.0,
    image: 'opportunity.png',
    imageDark: 'opportunity-dark.png',
    createdAt: new Date(Date.now() + 10 * 4).toISOString(),
    updatedAt: new Date(Date.now() + 10 * 4).toISOString()
  },
  {
    id: '5f3aafc7-b105-49c5-9db1-cf41f61dd912',
    name: 'Kindness',
    slug: 'kindness',
    description:
      '&quot;Carry out a random act of kindness, with no expectation of reward, safe in the knowledge that one day someone might do the same for you.&quot; - Princess Diana',
    price: 32.0,
    image: 'kindness.png',
    imageDark: 'kindness-dark.png',
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
