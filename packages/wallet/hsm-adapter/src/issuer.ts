// hsm-adapter-issuer: the issuer HSM adapter contract on GRPC_PORT (50051).
import { createAtallaIssuerServer } from '@interledger/hsm-atalla-issuer'
import { main } from './run'

void main('issuer', createAtallaIssuerServer)
