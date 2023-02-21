import axios from 'axios'

const RAPYD_ENDPOINT = process.env.RAPYD_API

// const makeRapydPostRequest = async (_endpoint: string, _body: string) => {
// }

const createRapydWallet = async (wallet: RapydWallet) => {
  await axios.post(`${RAPYD_ENDPOINT}/user`, wallet)
}

export { createRapydWallet }
