import cryptolib from 'crypto'

const secretKeyHex =
  '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'
const iv = 'rafiki-testnet23'

const encrypt = (text: string): string => {
  // Create a cipher object for encryption
  const cipher = cryptolib.createCipheriv(
    'aes-256-cbc',
    Buffer.from(secretKeyHex, 'hex'),
    iv
  )

  // Update the cipher with the data
  let encryptedData = cipher.update(text, 'utf-8', 'hex')
  encryptedData += cipher.final('hex')

  return encryptedData
}

export { encrypt }
