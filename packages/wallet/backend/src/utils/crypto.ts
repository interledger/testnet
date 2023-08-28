import cryptolib from 'crypto'

const secretKeyHex =
  '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'
const iv = 'rafiki-testnet23'

const decrypt = (encryptedText: string): string => {
  const decipher = cryptolib.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(secretKeyHex, 'hex'),
    iv
  )
  const decryptedData =
    decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8') //deciphered text
  return decryptedData
}

export { decrypt }
