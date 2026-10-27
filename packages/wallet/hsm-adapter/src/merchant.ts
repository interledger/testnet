// hsm-adapter-merchant: the merchant HSM adapter contract on grpc.port (default 50052).
import { createAtallaMerchantServer } from '@interledger/hsm-atalla-merchant'
import { main } from './run'

void main('merchant', createAtallaMerchantServer)
