import axios from 'axios'

// const makeRapydPostRequest = async (_endpoint: string, _body: string) => {
// }

const createRapydWallet = async (wallet: RapydWallet) => {
  await axios.post(`${process.env.RAPYD_API}/user`, wallet)
}

export { createRapydWallet }
