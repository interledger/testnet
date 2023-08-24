const products = [
  {
    name: 'Luck',
    slug: 'luck',
    description:
      '"I am a great believer in luck, and I find the harder I work, the more I have of it." - Thomas Jefferson',
    price: 99.99,
    image: 'luck.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Knowledge',
    slug: 'knowledge',
    description:
      '"To know that we know what we know, and to know that we do not know what we do not know, that is true knowledge." ~~ Nicolaus Copernicus',
    price: 54.5,
    image: 'knowledge.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Courage',
    slug: 'courage',
    description:
      '"Courage is the most important of all the virtues, because without courage you can\'t practice any other virtue consistently. You can practice any virtue erratically, but nothing consistently without courage." - Maya Angelou',
    price: 19.99,
    image: 'courage.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Patience',
    slug: 'patience',
    description:
      '"Learning patience can be a difficult experience, but once conquered, you will find life is easier." - Catherine Pulsifer',
    price: 27.99,
    image: 'patience.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Kindness',
    slug: 'kindness',
    description:
      '"Carry out a random act of kindness, with no expectation of reward, safe in the knowledge that one day someone might do the same for you." - Princess Diana',
    price: 32.0,
    image: 'kindess.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Opportunity',
    slug: 'opportunity',
    description:
      '"A pessimist sees the difficulty in every opportunity; an optimist sees the opportunity in every difficulty." - Winston Churchill',
    price: 123.79,
    image: 'opportunity.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
exports.down = function (knex) {}
