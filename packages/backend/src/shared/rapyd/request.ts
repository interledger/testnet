import axios from 'axios'

const END_POINT = 'https://sandboxapi.rapyd.net/v1'

// const makeRapydPostRequest = async (_endpoint: string, _body: string) => {
// }

const createRapydWallet = async (wallet: RapydWallet) => {
  await axios.post(`${END_POINT}/user`, wallet)
}

export { createRapydWallet }
