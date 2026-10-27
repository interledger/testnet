// hsm-adapter-merchant: the merchant HSM adapter contract on GRPC_PORT (50052).
import { createAtallaMerchantServer } from '@interledger/hsm-atalla-merchant'
import { main } from './run'

void main('merchant', createAtallaMerchantServer)
