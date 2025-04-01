export type Maybe<T> = T | null;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: bigint; output: bigint; }
  JSONObject: { input: any; output: any; }
  UInt8: { input: number; output: number; }
};

export type AccountingTransfer = Model & {
  __typename?: 'AccountingTransfer';
  /** Amount sent (fixed send). */
  amount: Scalars['BigInt']['output'];
  /** The date and time that the accounting transfer was created. */
  createdAt: Scalars['String']['output'];
  /** Unique identifier for the credit account. */
  creditAccountId: Scalars['ID']['output'];
  /** Unique identifier for the debit account. */
  debitAccountId: Scalars['ID']['output'];
  /** The date and time that the accounting transfer will expire. */
  expiresAt?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the accounting transfer. */
  id: Scalars['ID']['output'];
  /** Identifier that partitions the sets of accounts that can transact with each other. */
  ledger: Scalars['UInt8']['output'];
  /** The state of the accounting transfer. */
  state: TransferState;
  /** Type of the accounting transfer. */
  transferType: TransferType;
};

export type AccountingTransferConnection = {
  __typename?: 'AccountingTransferConnection';
  credits: Array<AccountingTransfer>;
  debits: Array<AccountingTransfer>;
};

export type AdditionalProperty = {
  __typename?: 'AdditionalProperty';
  /** Key for the additional property. */
  key: Scalars['String']['output'];
  /** Value for the additional property. */
  value: Scalars['String']['output'];
  /** Indicates whether the property is visible in Open Payments wallet address requests. */
  visibleInOpenPayments: Scalars['Boolean']['output'];
};

export type AdditionalPropertyInput = {
  /** Key for the additional property. */
  key: Scalars['String']['input'];
  /** Value for the additional property. */
  value: Scalars['String']['input'];
  /** Indicates whether the property is visible in Open Payments wallet address requests. */
  visibleInOpenPayments: Scalars['Boolean']['input'];
};

export enum Alg {
  /** EdDSA cryptographic algorithm. */
  EdDsa = 'EdDSA'
}

export type Amount = {
  __typename?: 'Amount';
  /** Should be an ISO 4217 currency code whenever possible, e.g. `USD`. For more information, refer to [assets](https://rafiki.dev/overview/concepts/accounting/#assets). */
  assetCode: Scalars['String']['output'];
  /** Difference in order of magnitude between the standard unit of an asset and its corresponding fractional unit. */
  assetScale: Scalars['UInt8']['output'];
  /** Numerical value. */
  value: Scalars['BigInt']['output'];
};

export type AmountInput = {
  /** Should be an ISO 4217 currency code whenever possible, e.g. `USD`. For more information, refer to [assets](https://rafiki.dev/overview/concepts/accounting/#assets). */
  assetCode: Scalars['String']['input'];
  /** Difference in order of magnitude between the standard unit of an asset and its corresponding fractional unit. */
  assetScale: Scalars['UInt8']['input'];
  /** Numerical value. */
  value: Scalars['BigInt']['input'];
};

export type ApproveIncomingPaymentInput = {
  /** Unique identifier of the incoming payment to be approved. Note: incoming payment must be PENDING. */
  id: Scalars['ID']['input'];
};

export type ApproveIncomingPaymentResponse = {
  __typename?: 'ApproveIncomingPaymentResponse';
  /** The incoming payment that was approved. */
  payment?: Maybe<IncomingPayment>;
};

export type Asset = Model & {
  __typename?: 'Asset';
  /** Should be an ISO 4217 currency code whenever possible, e.g. `USD`. For more information, refer to [assets](https://rafiki.dev/overview/concepts/accounting/#assets). */
  code: Scalars['String']['output'];
  /** The date and time when the asset was created. */
  createdAt: Scalars['String']['output'];
  /** Fetches a paginated list of fees associated with this asset. */
  fees?: Maybe<FeesConnection>;
  /** Unique identifier of the asset. */
  id: Scalars['ID']['output'];
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** A webhook event will notify the Account Servicing Entity if liquidity falls below this value. */
  liquidityThreshold?: Maybe<Scalars['BigInt']['output']>;
  /** The receiving fee structure for the asset. */
  receivingFee?: Maybe<Fee>;
  /** Difference in order of magnitude between the standard unit of an asset and its corresponding fractional unit. */
  scale: Scalars['UInt8']['output'];
  /** The sending fee structure for the asset. */
  sendingFee?: Maybe<Fee>;
  /** Minimum amount of liquidity that can be withdrawn from the asset. */
  withdrawalThreshold?: Maybe<Scalars['BigInt']['output']>;
};


export type AssetFeesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};

export type AssetEdge = {
  __typename?: 'AssetEdge';
  /** A cursor for paginating through the assets. */
  cursor: Scalars['String']['output'];
  /** An asset node in the list. */
  node: Asset;
};

export type AssetMutationResponse = {
  __typename?: 'AssetMutationResponse';
  /** The asset affected by the mutation. */
  asset?: Maybe<Asset>;
};

export type AssetsConnection = {
  __typename?: 'AssetsConnection';
  /** A list of edges representing assets and cursors for pagination. */
  edges: Array<AssetEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

export type BasePayment = {
  /** Information about the wallet address of the Open Payments client that created the payment. */
  client?: Maybe<Scalars['String']['output']>;
  /** The date and time that the payment was created. */
  createdAt: Scalars['String']['output'];
  /** Unique identifier for the payment. */
  id: Scalars['ID']['output'];
  /** Additional metadata associated with the payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Unique identifier of the wallet address under which the payment was created. */
  walletAddressId: Scalars['ID']['output'];
};

export type CancelIncomingPaymentInput = {
  /** Unique identifier of the incoming payment to be canceled. Note: incoming payment must be PENDING. */
  id: Scalars['ID']['input'];
};

export type CancelIncomingPaymentResponse = {
  __typename?: 'CancelIncomingPaymentResponse';
  /** The incoming payment that was canceled. */
  payment?: Maybe<IncomingPayment>;
};

export type CancelOutgoingPaymentInput = {
  /** Unique identifier of the outgoing payment to cancel. */
  id: Scalars['ID']['input'];
  /** Reason why this outgoing payment has been canceled. This value will be publicly visible in the metadata field if this outgoing payment is requested through Open Payments. */
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAssetInput = {
  /** Should be an ISO 4217 currency code whenever possible, e.g. `USD`. For more information, refer to [assets](https://rafiki.dev/overview/concepts/accounting/#assets). */
  code: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** A webhook event will notify the Account Servicing Entity if liquidity falls below this value. */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** Difference in order of magnitude between the standard unit of an asset and its corresponding fractional unit. */
  scale: Scalars['UInt8']['input'];
  /** Minimum amount of liquidity that can be withdrawn from the asset. */
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']['input']>;
};

export type CreateAssetLiquidityWithdrawalInput = {
  /** Amount of liquidity to withdraw. */
  amount: Scalars['BigInt']['input'];
  /** Unique identifier of the asset to create the withdrawal for. */
  assetId: Scalars['String']['input'];
  /** Unique identifier of the withdrawal. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Interval in seconds after a pending transfer's created at which it may be posted or voided. Zero denotes a no timeout single-phase posted transfer. */
  timeoutSeconds: Scalars['BigInt']['input'];
};

export type CreateIncomingPaymentInput = {
  /** Date and time that the incoming payment will expire. */
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Maximum amount to be received for this incoming payment. */
  incomingAmount?: InputMaybe<AmountInput>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Unique identifier of the wallet address under which the incoming payment will be created. */
  walletAddressId: Scalars['String']['input'];
};

export type CreateIncomingPaymentWithdrawalInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Unique identifier of the incoming payment to withdraw liquidity from. */
  incomingPaymentId: Scalars['String']['input'];
  /** Interval in seconds after a pending transfer's created at which it may be posted or voided. Zero denotes a no timeout single-phase posted transfer. */
  timeoutSeconds: Scalars['BigInt']['input'];
};

export type CreateOrUpdatePeerByUrlInput = {
  /** Unique identifier of the asset associated with the peering relationship. */
  assetId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** A webhook event will notify the Account Servicing Entity if peer liquidity falls below this value. */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** Amount of liquidity to deposit for the peer. */
  liquidityToDeposit?: InputMaybe<Scalars['BigInt']['input']>;
  /** Maximum packet amount that the peer accepts. */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']['input']>;
  /** Internal name for the peer, used to override auto-peering default names. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Peer's URL address, where auto-peering requests are accepted. */
  peerUrl: Scalars['String']['input'];
};

export type CreateOrUpdatePeerByUrlMutationResponse = {
  __typename?: 'CreateOrUpdatePeerByUrlMutationResponse';
  /** The peer created or updated based on a URL. */
  peer?: Maybe<Peer>;
};

export type CreateOutgoingPaymentFromIncomingPaymentInput = {
  /** Amount to send (fixed send). */
  debitAmount: AmountInput;
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Incoming payment URL to create the outgoing payment from. */
  incomingPayment: Scalars['String']['input'];
  /** Additional metadata associated with the outgoing payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Unique identifier of the wallet address under which the outgoing payment will be created. */
  walletAddressId: Scalars['String']['input'];
};

export type CreateOutgoingPaymentInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Additional metadata associated with the outgoing payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Unique identifier of the corresponding quote for that outgoing payment. */
  quoteId: Scalars['String']['input'];
  /** Unique identifier of the wallet address under which the outgoing payment will be created. */
  walletAddressId: Scalars['String']['input'];
};

export type CreateOutgoingPaymentWithdrawalInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Unique identifier of the outgoing payment to withdraw liquidity from. */
  outgoingPaymentId: Scalars['String']['input'];
  /** Interval in seconds after a pending transfer's created at which it may be posted or voided. Zero denotes a no timeout single-phase posted transfer. */
  timeoutSeconds: Scalars['BigInt']['input'];
};

export type CreatePeerInput = {
  /** Unique identifier of the asset associated with the peering relationship. */
  assetId: Scalars['String']['input'];
  /** Peering connection details. */
  http: HttpInput;
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Initial amount of liquidity to deposit for the peer. */
  initialLiquidity?: InputMaybe<Scalars['BigInt']['input']>;
  /** A webhook event will notify the Account Servicing Entity if peer liquidity falls below this value. */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** Maximum packet amount that the peer accepts. */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']['input']>;
  /** Internal name of the peer. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** ILP address of the peer. */
  staticIlpAddress: Scalars['String']['input'];
};

export type CreatePeerLiquidityWithdrawalInput = {
  /** Amount of liquidity to withdraw. */
  amount: Scalars['BigInt']['input'];
  /** Unique identifier of the withdrawal. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Unique identifier of the peer to create the withdrawal for. */
  peerId: Scalars['String']['input'];
  /** Interval in seconds after a pending transfer's created at which it may be posted or voided. Zero denotes a no timeout single-phase posted transfer. */
  timeoutSeconds: Scalars['BigInt']['input'];
};

export type CreatePeerMutationResponse = {
  __typename?: 'CreatePeerMutationResponse';
  /** The peer created by the mutation. */
  peer?: Maybe<Peer>;
};

export type CreateQuoteInput = {
  /** Amount to send (fixed send). */
  debitAmount?: InputMaybe<AmountInput>;
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Amount to receive (fixed receive). */
  receiveAmount?: InputMaybe<AmountInput>;
  /** Wallet address URL of the receiver. */
  receiver: Scalars['String']['input'];
  /** Unique identifier of the wallet address under which the quote will be created. */
  walletAddressId: Scalars['String']['input'];
};

export type CreateReceiverInput = {
  /** Date and time that the incoming payment expires for the receiver. */
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Maximum amount to be received for this incoming payment. */
  incomingAmount?: InputMaybe<AmountInput>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Receiving wallet address URL. */
  walletAddressUrl: Scalars['String']['input'];
};

export type CreateReceiverResponse = {
  __typename?: 'CreateReceiverResponse';
  /** The receiver object returned in the response. */
  receiver?: Maybe<Receiver>;
};

export type CreateWalletAddressInput = {
  /** Additional properties associated with the wallet address. */
  additionalProperties?: InputMaybe<Array<AdditionalPropertyInput>>;
  /** Unique identifier of the asset associated with the wallet address. This cannot be changed. */
  assetId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Public name associated with the wallet address. This is visible to anyone with the wallet address URL. */
  publicName?: InputMaybe<Scalars['String']['input']>;
  /** Wallet address URL. This cannot be changed. */
  url: Scalars['String']['input'];
};

export type CreateWalletAddressKeyInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Public key in JSON Web Key (JWK) format. */
  jwk: JwkInput;
  /** Unique identifier of the wallet address to associate with the key. */
  walletAddressId: Scalars['String']['input'];
};

export type CreateWalletAddressKeyMutationResponse = {
  __typename?: 'CreateWalletAddressKeyMutationResponse';
  /** The wallet address key that was created. */
  walletAddressKey?: Maybe<WalletAddressKey>;
};

export type CreateWalletAddressMutationResponse = {
  __typename?: 'CreateWalletAddressMutationResponse';
  /** The newly created wallet address. */
  walletAddress?: Maybe<WalletAddress>;
};

export type CreateWalletAddressWithdrawalInput = {
  /** Unique identifier of the withdrawal. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Interval in seconds after a pending transfer's created at which it may be posted or voided. Zero denotes a no timeout single-phase posted transfer. */
  timeoutSeconds: Scalars['BigInt']['input'];
  /** Unique identifier of the Open Payments wallet address to create the withdrawal for. */
  walletAddressId: Scalars['String']['input'];
};

export enum Crv {
  /** Elliptic curve `Ed25519`, used in EdDSA. */
  Ed25519 = 'Ed25519'
}

export type DeleteAssetInput = {
  /** Unique identifier of the asset to delete. */
  id: Scalars['ID']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteAssetMutationResponse = {
  __typename?: 'DeleteAssetMutationResponse';
  /** The asset that was deleted. */
  asset?: Maybe<Asset>;
};

export type DeletePeerInput = {
  /** Unique identifier of the peer to be deleted. */
  id: Scalars['ID']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
};

export type DeletePeerMutationResponse = {
  __typename?: 'DeletePeerMutationResponse';
  /** Indicates whether the peer deletion was successful. */
  success: Scalars['Boolean']['output'];
};

export type DepositAssetLiquidityInput = {
  /** Amount of liquidity to deposit. */
  amount: Scalars['BigInt']['input'];
  /** Unique identifier of the asset to deposit liquidity into. */
  assetId: Scalars['String']['input'];
  /** Unique identifier of the liquidity transfer. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
};

export type DepositEventLiquidityInput = {
  /** Unique identifier of the event to deposit liquidity into. */
  eventId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
};

export type DepositOutgoingPaymentLiquidityInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Unique identifier of the outgoing payment to deposit liquidity into. */
  outgoingPaymentId: Scalars['String']['input'];
};

export type DepositPeerLiquidityInput = {
  /** Amount of liquidity to deposit. */
  amount: Scalars['BigInt']['input'];
  /** Unique identifier of the liquidity transfer. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Unique identifier of the peer to deposit liquidity into. */
  peerId: Scalars['String']['input'];
};

export type Fee = Model & {
  __typename?: 'Fee';
  /** Unique identifier of the asset associated with the fee. */
  assetId: Scalars['ID']['output'];
  /** Basis points fee is a variable fee charged based on the total amount. Should be between 0 and 10000 (inclusive). 1 basis point = 0.01%, 100 basis points = 1%, 10000 basis points = 100%. */
  basisPoints: Scalars['Int']['output'];
  /** The date and time that this fee was created. */
  createdAt: Scalars['String']['output'];
  /** Amount of the flat, fixed fee to charge. */
  fixed: Scalars['BigInt']['output'];
  /** Unique identifier of the fee. */
  id: Scalars['ID']['output'];
  /** Type of fee, either sending or receiving. */
  type: FeeType;
};

export type FeeDetails = {
  /** Basis points fee is a variable fee charged based on the total amount. Should be between 0 and 10000 (inclusive). 1 basis point = 0.01%, 100 basis points = 1%, 10000 basis points = 100%. */
  basisPoints: Scalars['Int']['input'];
  /** Amount of the flat, fixed fee to charge. */
  fixed: Scalars['BigInt']['input'];
};

export type FeeEdge = {
  __typename?: 'FeeEdge';
  /** A cursor for paginating through the fees. */
  cursor: Scalars['String']['output'];
  /** A fee node in the list. */
  node: Fee;
};

export enum FeeType {
  /** The receiver is responsible for paying the fees. */
  Receiving = 'RECEIVING',
  /** The sender is responsible for paying the fees. */
  Sending = 'SENDING'
}

export type FeesConnection = {
  __typename?: 'FeesConnection';
  /** A list of fee edges, containing fee nodes and cursors for pagination. */
  edges: Array<FeeEdge>;
  /** Pagination information for fees. */
  pageInfo: PageInfo;
};

export type FilterString = {
  /** Array of strings to filter by. */
  in: Array<Scalars['String']['input']>;
};

export type Http = {
  __typename?: 'Http';
  /** Details of the outgoing connection for peering. */
  outgoing: HttpOutgoing;
};

export type HttpIncomingInput = {
  /** Array of authorization tokens accepted by this Rafiki instance. */
  authTokens: Array<Scalars['String']['input']>;
};

export type HttpInput = {
  /** Incoming connection details. */
  incoming?: InputMaybe<HttpIncomingInput>;
  /** Outgoing connection details. */
  outgoing: HttpOutgoingInput;
};

export type HttpOutgoing = {
  __typename?: 'HttpOutgoing';
  /** Authorization token to be presented to the peer's Rafiki instance. */
  authToken: Scalars['String']['output'];
  /** Connection endpoint of the peer. */
  endpoint: Scalars['String']['output'];
};

export type HttpOutgoingInput = {
  /** Authorization token to present at the peer's Rafiki instance. */
  authToken: Scalars['String']['input'];
  /** Connection endpoint of the peer. */
  endpoint: Scalars['String']['input'];
};

export type IncomingPayment = BasePayment & Model & {
  __typename?: 'IncomingPayment';
  /** Information about the wallet address of the Open Payments client that created the incoming payment. */
  client?: Maybe<Scalars['String']['output']>;
  /** The date and time that the incoming payment was created. */
  createdAt: Scalars['String']['output'];
  /** Date and time that the incoming payment will expire. After this time, the incoming payment will not accept further payments made to it. */
  expiresAt: Scalars['String']['output'];
  /** Unique identifier of the incoming payment. */
  id: Scalars['ID']['output'];
  /** The maximum amount that should be paid into the wallet address under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Current amount of liquidity available for this incoming payment. */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** The total amount that has been paid into the wallet address under this incoming payment. */
  receivedAmount: Amount;
  /** State of the incoming payment. */
  state: IncomingPaymentState;
  /** Unique identifier of the wallet address under which the incoming payment was created. */
  walletAddressId: Scalars['ID']['output'];
};

export type IncomingPaymentConnection = {
  __typename?: 'IncomingPaymentConnection';
  /** A list of incoming payment edges, containing incoming payment nodes and cursors for pagination. */
  edges: Array<IncomingPaymentEdge>;
  /** Pagination information for the incoming payments. */
  pageInfo: PageInfo;
};

export type IncomingPaymentEdge = {
  __typename?: 'IncomingPaymentEdge';
  /** A cursor for paginating through the incoming payments. */
  cursor: Scalars['String']['output'];
  /** An incoming payment node in the list. */
  node: IncomingPayment;
};

export type IncomingPaymentResponse = {
  __typename?: 'IncomingPaymentResponse';
  /** The incoming payment object returned in the response. */
  payment?: Maybe<IncomingPayment>;
};

export enum IncomingPaymentState {
  /** The payment is completed automatically once the expected `incomingAmount` is received or manually via an API call. */
  Completed = 'COMPLETED',
  /** The payment has expired before completion, and no further funds will be accepted. */
  Expired = 'EXPIRED',
  /** The payment is pending when it is initially created and has not started processing. */
  Pending = 'PENDING',
  /** The payment is being processed after funds have started clearing into the account. */
  Processing = 'PROCESSING'
}

export type Jwk = {
  __typename?: 'Jwk';
  /** Cryptographic algorithm used with the key. The only allowed value is `EdDSA`. */
  alg: Alg;
  /** Cryptographic curve that the key pair is derived from. The only allowed value is `Ed25519`. */
  crv: Crv;
  /** Unique identifier for the key. */
  kid: Scalars['String']['output'];
  /** Key type. The only allowed value is `OKP`. */
  kty: Kty;
  /** Base64 url-encoded public key. */
  x: Scalars['String']['output'];
};

export type JwkInput = {
  /** Cryptographic algorithm used with the key. The only allowed value is `EdDSA`. */
  alg: Alg;
  /** Cryptographic curve that the key pair is derived from. The only allowed value is `Ed25519`. */
  crv: Crv;
  /** Unique identifier for the key. */
  kid: Scalars['String']['input'];
  /** Key type. The only allowed value is `OKP`. */
  kty: Kty;
  /** Base64 url-encoded public key. */
  x: Scalars['String']['input'];
};

export enum Kty {
  /** Octet Key Pair (OKP) key type. */
  Okp = 'OKP'
}

export enum LiquidityError {
  /** The transfer has already been posted. */
  AlreadyPosted = 'AlreadyPosted',
  /** The transfer has already been voided. */
  AlreadyVoided = 'AlreadyVoided',
  /** The amount specified for the transfer is zero. */
  AmountZero = 'AmountZero',
  /** Insufficient balance to complete the transfer. */
  InsufficientBalance = 'InsufficientBalance',
  /** The provided ID for the transfer is invalid. */
  InvalidId = 'InvalidId',
  /** A transfer with the same ID already exists. */
  TransferExists = 'TransferExists',
  /** The specified asset could not be found. */
  UnknownAsset = 'UnknownAsset',
  /** The specified incoming payment could not be found. */
  UnknownIncomingPayment = 'UnknownIncomingPayment',
  /** The specified payment could not be found. */
  UnknownPayment = 'UnknownPayment',
  /** The specified peer could not be found. */
  UnknownPeer = 'UnknownPeer',
  /** The specified transfer could not be found. */
  UnknownTransfer = 'UnknownTransfer',
  /** The specified wallet address could not be found. */
  UnknownWalletAddress = 'UnknownWalletAddress'
}

export type LiquidityMutationResponse = {
  __typename?: 'LiquidityMutationResponse';
  /** Indicates whether the liquidity operation was successful. */
  success: Scalars['Boolean']['output'];
};

export type Model = {
  /** The date and time that the entity was created. */
  createdAt: Scalars['String']['output'];
  /** Unique identifier for the entity. */
  id: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Approves the incoming payment if the incoming payment is in the PENDING state */
  approveIncomingPayment: ApproveIncomingPaymentResponse;
  /** Cancel the incoming payment if the incoming payment is in the PENDING state */
  cancelIncomingPayment: CancelIncomingPaymentResponse;
  /** Cancel an outgoing payment. */
  cancelOutgoingPayment: OutgoingPaymentResponse;
  /** Create a new asset. */
  createAsset: AssetMutationResponse;
  /** Withdraw asset liquidity. */
  createAssetLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an internal Open Payments incoming payment. The receiver has a wallet address on this Rafiki instance. */
  createIncomingPayment: IncomingPaymentResponse;
  /** Withdraw incoming payment liquidity. */
  createIncomingPaymentWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create or update a peer using a URL. */
  createOrUpdatePeerByUrl: CreateOrUpdatePeerByUrlMutationResponse;
  /** Create an Open Payments outgoing payment. */
  createOutgoingPayment: OutgoingPaymentResponse;
  /** Create an Open Payments outgoing payment from an incoming payment. */
  createOutgoingPaymentFromIncomingPayment: OutgoingPaymentResponse;
  /** Withdraw outgoing payment liquidity. */
  createOutgoingPaymentWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create a new peer. */
  createPeer: CreatePeerMutationResponse;
  /** Withdraw peer liquidity. */
  createPeerLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an Open Payments quote. */
  createQuote: QuoteResponse;
  /** Create an internal or external Open Payments incoming payment. The receiver has a wallet address on either this or another Open Payments resource server. */
  createReceiver: CreateReceiverResponse;
  /** Create a new wallet address. */
  createWalletAddress: CreateWalletAddressMutationResponse;
  /** Add a public key to a wallet address that is used to verify Open Payments requests. */
  createWalletAddressKey?: Maybe<CreateWalletAddressKeyMutationResponse>;
  /** Withdraw liquidity from a wallet address received via Web Monetization. */
  createWalletAddressWithdrawal?: Maybe<WalletAddressWithdrawalMutationResponse>;
  /** Delete an asset. */
  deleteAsset: DeleteAssetMutationResponse;
  /** Delete a peer. */
  deletePeer: DeletePeerMutationResponse;
  /** Deposit asset liquidity. */
  depositAssetLiquidity?: Maybe<LiquidityMutationResponse>;
  /**
   * Deposit webhook event liquidity (deprecated).
   * @deprecated Use `depositOutgoingPaymentLiquidity`
   */
  depositEventLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Deposit outgoing payment liquidity. */
  depositOutgoingPaymentLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Deposit peer liquidity. */
  depositPeerLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Post liquidity withdrawal. Withdrawals are two-phase commits and are committed via this mutation. */
  postLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Revoke a public key associated with a wallet address. Open Payment requests using this key for request signatures will be denied going forward. */
  revokeWalletAddressKey?: Maybe<RevokeWalletAddressKeyMutationResponse>;
  /** Set the fee structure on an asset. */
  setFee: SetFeeResponse;
  /** If automatic withdrawal of funds received via Web Monetization by the wallet address are disabled, this mutation can be used to trigger up to **n** withdrawal events. */
  triggerWalletAddressEvents: TriggerWalletAddressEventsMutationResponse;
  /** Update an existing asset. */
  updateAsset: AssetMutationResponse;
  /** Update an existing incoming payment. */
  updateIncomingPayment: IncomingPaymentResponse;
  /** Update an existing peer. */
  updatePeer: UpdatePeerMutationResponse;
  /** Update an existing wallet address. */
  updateWalletAddress: UpdateWalletAddressMutationResponse;
  /** Void liquidity withdrawal. Withdrawals are two-phase commits and are rolled back via this mutation. */
  voidLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /**
   * Withdraw webhook event liquidity (deprecated).
   * @deprecated Use `createOutgoingPaymentWithdrawal, createIncomingPaymentWithdrawal, or createWalletAddressWithdrawal`
   */
  withdrawEventLiquidity?: Maybe<LiquidityMutationResponse>;
};


export type MutationApproveIncomingPaymentArgs = {
  input: ApproveIncomingPaymentInput;
};


export type MutationCancelIncomingPaymentArgs = {
  input: CancelIncomingPaymentInput;
};


export type MutationCancelOutgoingPaymentArgs = {
  input: CancelOutgoingPaymentInput;
};


export type MutationCreateAssetArgs = {
  input: CreateAssetInput;
};


export type MutationCreateAssetLiquidityWithdrawalArgs = {
  input: CreateAssetLiquidityWithdrawalInput;
};


export type MutationCreateIncomingPaymentArgs = {
  input: CreateIncomingPaymentInput;
};


export type MutationCreateIncomingPaymentWithdrawalArgs = {
  input: CreateIncomingPaymentWithdrawalInput;
};


export type MutationCreateOrUpdatePeerByUrlArgs = {
  input: CreateOrUpdatePeerByUrlInput;
};


export type MutationCreateOutgoingPaymentArgs = {
  input: CreateOutgoingPaymentInput;
};


export type MutationCreateOutgoingPaymentFromIncomingPaymentArgs = {
  input: CreateOutgoingPaymentFromIncomingPaymentInput;
};


export type MutationCreateOutgoingPaymentWithdrawalArgs = {
  input: CreateOutgoingPaymentWithdrawalInput;
};


export type MutationCreatePeerArgs = {
  input: CreatePeerInput;
};


export type MutationCreatePeerLiquidityWithdrawalArgs = {
  input: CreatePeerLiquidityWithdrawalInput;
};


export type MutationCreateQuoteArgs = {
  input: CreateQuoteInput;
};


export type MutationCreateReceiverArgs = {
  input: CreateReceiverInput;
};


export type MutationCreateWalletAddressArgs = {
  input: CreateWalletAddressInput;
};


export type MutationCreateWalletAddressKeyArgs = {
  input: CreateWalletAddressKeyInput;
};


export type MutationCreateWalletAddressWithdrawalArgs = {
  input: CreateWalletAddressWithdrawalInput;
};


export type MutationDeleteAssetArgs = {
  input: DeleteAssetInput;
};


export type MutationDeletePeerArgs = {
  input: DeletePeerInput;
};


export type MutationDepositAssetLiquidityArgs = {
  input: DepositAssetLiquidityInput;
};


export type MutationDepositEventLiquidityArgs = {
  input: DepositEventLiquidityInput;
};


export type MutationDepositOutgoingPaymentLiquidityArgs = {
  input: DepositOutgoingPaymentLiquidityInput;
};


export type MutationDepositPeerLiquidityArgs = {
  input: DepositPeerLiquidityInput;
};


export type MutationPostLiquidityWithdrawalArgs = {
  input: PostLiquidityWithdrawalInput;
};


export type MutationRevokeWalletAddressKeyArgs = {
  input: RevokeWalletAddressKeyInput;
};


export type MutationSetFeeArgs = {
  input: SetFeeInput;
};


export type MutationTriggerWalletAddressEventsArgs = {
  input: TriggerWalletAddressEventsInput;
};


export type MutationUpdateAssetArgs = {
  input: UpdateAssetInput;
};


export type MutationUpdateIncomingPaymentArgs = {
  input: UpdateIncomingPaymentInput;
};


export type MutationUpdatePeerArgs = {
  input: UpdatePeerInput;
};


export type MutationUpdateWalletAddressArgs = {
  input: UpdateWalletAddressInput;
};


export type MutationVoidLiquidityWithdrawalArgs = {
  input: VoidLiquidityWithdrawalInput;
};


export type MutationWithdrawEventLiquidityArgs = {
  input: WithdrawEventLiquidityInput;
};

export type OutgoingPayment = BasePayment & Model & {
  __typename?: 'OutgoingPayment';
  /** Information about the wallet address of the Open Payments client that created the outgoing payment. */
  client?: Maybe<Scalars['String']['output']>;
  /** The date and time that the outgoing payment was created. */
  createdAt: Scalars['String']['output'];
  /** Amount to send (fixed send). */
  debitAmount: Amount;
  /** Any error encountered during the payment process. */
  error?: Maybe<Scalars['String']['output']>;
  /** Unique identifier of the grant under which the outgoing payment was created. */
  grantId?: Maybe<Scalars['String']['output']>;
  /** Unique identifier of the outgoing payment. */
  id: Scalars['ID']['output'];
  /** Current amount of liquidity available for this outgoing payment. */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Additional metadata associated with the outgoing payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Corresponding quote for the outgoing payment. */
  quote?: Maybe<Quote>;
  /** Amount to receive (fixed receive). */
  receiveAmount: Amount;
  /** Wallet address URL of the receiver. */
  receiver: Scalars['String']['output'];
  /** Amount already sent. */
  sentAmount: Amount;
  /** State of the outgoing payment. */
  state: OutgoingPaymentState;
  /** Number of attempts made to send an outgoing payment. */
  stateAttempts: Scalars['Int']['output'];
  /** Unique identifier of the wallet address under which the outgoing payment was created. */
  walletAddressId: Scalars['ID']['output'];
};

export type OutgoingPaymentConnection = {
  __typename?: 'OutgoingPaymentConnection';
  /** A list of outgoing payment edges, containing outgoing payment nodes and cursors for pagination. */
  edges: Array<OutgoingPaymentEdge>;
  /** Pagination information for the outgoing payments. */
  pageInfo: PageInfo;
};

export type OutgoingPaymentEdge = {
  __typename?: 'OutgoingPaymentEdge';
  /** A cursor for paginating through the outgoing payments. */
  cursor: Scalars['String']['output'];
  /** An outgoing payment node in the list. */
  node: OutgoingPayment;
};

export type OutgoingPaymentFilter = {
  /** Filter for outgoing payments based on the receiver's details. */
  receiver?: InputMaybe<FilterString>;
  /** Filter for outgoing payments based on their state. */
  state?: InputMaybe<FilterString>;
  /** Filter for outgoing payments based on the wallet address ID. */
  walletAddressId?: InputMaybe<FilterString>;
};

export type OutgoingPaymentResponse = {
  __typename?: 'OutgoingPaymentResponse';
  /** The outgoing payment object returned in the response. */
  payment?: Maybe<OutgoingPayment>;
};

export enum OutgoingPaymentState {
  /** The payment has been canceled. */
  Cancelled = 'CANCELLED',
  /** The payment has been successfully completed. */
  Completed = 'COMPLETED',
  /** The payment has failed. */
  Failed = 'FAILED',
  /** The payment is reserving funds and will transition to `SENDING` once funds are secured. */
  Funding = 'FUNDING',
  /** The payment is in progress and will transition to `COMPLETED` upon success. */
  Sending = 'SENDING'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  /** The cursor used to fetch the next page when paginating forwards. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Indicates if there are more pages when paginating forwards. */
  hasNextPage: Scalars['Boolean']['output'];
  /** Indicates if there are more pages when paginating backwards. */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** The cursor used to fetch the next page when paginating backwards. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Payment = BasePayment & Model & {
  __typename?: 'Payment';
  /** Information about the wallet address of the Open Payments client that created the payment. */
  client?: Maybe<Scalars['String']['output']>;
  /** The date and time that the payment was created. */
  createdAt: Scalars['String']['output'];
  /** Unique identifier of the payment. */
  id: Scalars['ID']['output'];
  /** Current amount of liquidity available for this payment. */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Additional metadata associated with the payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** State of the payment, either `IncomingPaymentState` or `OutgoingPaymentState` according to payment type */
  state: Scalars['String']['output'];
  /** Type of payment, either incoming or outgoing. */
  type: PaymentType;
  /** Unique identifier of the wallet address under which the payment was created. */
  walletAddressId: Scalars['ID']['output'];
};

export type PaymentConnection = {
  __typename?: 'PaymentConnection';
  /** A list of payment edges, containing payment nodes and cursors for pagination. */
  edges: Array<PaymentEdge>;
  /** Pagination information for the payments. */
  pageInfo: PageInfo;
};

export type PaymentEdge = {
  __typename?: 'PaymentEdge';
  /** A cursor for paginating through the payments. */
  cursor: Scalars['String']['output'];
  /** A payment node in the list. */
  node: Payment;
};

export type PaymentFilter = {
  /** Filter for payments based on their type. */
  type?: InputMaybe<FilterString>;
  /** Filter for payments based on the wallet address ID. */
  walletAddressId?: InputMaybe<FilterString>;
};

export enum PaymentType {
  /** Represents an incoming payment. */
  Incoming = 'INCOMING',
  /** Represents an outgoing payment. */
  Outgoing = 'OUTGOING'
}

export type Peer = Model & {
  __typename?: 'Peer';
  /** Asset of peering relationship. */
  asset: Asset;
  /** The date and time when the peer was created. */
  createdAt: Scalars['String']['output'];
  /** Peering connection details. */
  http: Http;
  /** Unique identifier of the peer. */
  id: Scalars['ID']['output'];
  /** Current amount of peer liquidity available. */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** A webhook event will notify the Account Servicing Entity if liquidity falls below this value. */
  liquidityThreshold?: Maybe<Scalars['BigInt']['output']>;
  /** Maximum packet amount that the peer accepts. */
  maxPacketAmount?: Maybe<Scalars['BigInt']['output']>;
  /** Public name for the peer. */
  name?: Maybe<Scalars['String']['output']>;
  /** ILP address of the peer. */
  staticIlpAddress: Scalars['String']['output'];
};

export type PeerEdge = {
  __typename?: 'PeerEdge';
  /** A cursor for paginating through the peers. */
  cursor: Scalars['String']['output'];
  /** A peer node in the list. */
  node: Peer;
};

export type PeersConnection = {
  __typename?: 'PeersConnection';
  /** A list of edges representing peers and cursors for pagination. */
  edges: Array<PeerEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

export type PostLiquidityWithdrawalInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Unique identifier of the liquidity withdrawal to post. */
  withdrawalId: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Fetch a paginated list of accounting transfers for a given account. */
  accountingTransfers: AccountingTransferConnection;
  /** Fetch an asset by its ID. */
  asset?: Maybe<Asset>;
  /** Get an asset based on its currency code and scale if it exists. */
  assetByCodeAndScale?: Maybe<Asset>;
  /** Fetch a paginated list of assets. */
  assets: AssetsConnection;
  /** Fetch an Open Payments incoming payment by its ID. */
  incomingPayment?: Maybe<IncomingPayment>;
  /** Fetch an Open Payments outgoing payment by its ID. */
  outgoingPayment?: Maybe<OutgoingPayment>;
  /** Fetch a paginated list of outgoing payments by receiver. */
  outgoingPayments: OutgoingPaymentConnection;
  /** Fetch a paginated list of combined payments, including incoming and outgoing payments. */
  payments: PaymentConnection;
  /** Fetch a peer by its ID. */
  peer?: Maybe<Peer>;
  /** Get a peer based on its ILP address and asset ID if it exists. */
  peerByAddressAndAsset?: Maybe<Peer>;
  /** Fetch a paginated list of peers. */
  peers: PeersConnection;
  /** Fetch an Open Payments quote by its ID. */
  quote?: Maybe<Quote>;
  /** Retrieve an Open Payments incoming payment by receiver ID. The receiver's wallet address can be hosted on this server or a remote Open Payments resource server. */
  receiver?: Maybe<Receiver>;
  /** Fetch a wallet address by its ID. */
  walletAddress?: Maybe<WalletAddress>;
  /** Get a wallet address by its url if it exists */
  walletAddressByUrl?: Maybe<WalletAddress>;
  /** Fetch a paginated list of wallet addresses. */
  walletAddresses: WalletAddressesConnection;
  /** Fetch a paginated list of webhook events. */
  webhookEvents: WebhookEventsConnection;
};


export type QueryAccountingTransfersArgs = {
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAssetArgs = {
  id: Scalars['String']['input'];
};


export type QueryAssetByCodeAndScaleArgs = {
  code: Scalars['String']['input'];
  scale: Scalars['UInt8']['input'];
};


export type QueryAssetsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type QueryIncomingPaymentArgs = {
  id: Scalars['String']['input'];
};


export type QueryOutgoingPaymentArgs = {
  id: Scalars['String']['input'];
};


export type QueryOutgoingPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<OutgoingPaymentFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type QueryPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PaymentFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type QueryPeerArgs = {
  id: Scalars['String']['input'];
};


export type QueryPeerByAddressAndAssetArgs = {
  assetId: Scalars['String']['input'];
  staticIlpAddress: Scalars['String']['input'];
};


export type QueryPeersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type QueryQuoteArgs = {
  id: Scalars['String']['input'];
};


export type QueryReceiverArgs = {
  id: Scalars['String']['input'];
};


export type QueryWalletAddressArgs = {
  id: Scalars['String']['input'];
};


export type QueryWalletAddressByUrlArgs = {
  url: Scalars['String']['input'];
};


export type QueryWalletAddressesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type QueryWebhookEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WebhookEventFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};

export type Quote = {
  __typename?: 'Quote';
  /** The date and time that the quote was created. */
  createdAt: Scalars['String']['output'];
  /** Amount to send (fixed send). */
  debitAmount: Amount;
  /** Estimated exchange rate for this quote. */
  estimatedExchangeRate?: Maybe<Scalars['Float']['output']>;
  /** The date and time that the quote will expire. */
  expiresAt: Scalars['String']['output'];
  /** Unique identifier of the quote. */
  id: Scalars['ID']['output'];
  /** Amount to receive (fixed receive). */
  receiveAmount: Amount;
  /** Wallet address URL of the receiver. */
  receiver: Scalars['String']['output'];
  /** Unique identifier of the wallet address under which the quote was created. */
  walletAddressId: Scalars['ID']['output'];
};

export type QuoteConnection = {
  __typename?: 'QuoteConnection';
  /** A list of quote edges, containing quote nodes and cursors for pagination. */
  edges: Array<QuoteEdge>;
  /** Pagination information for quotes. */
  pageInfo: PageInfo;
};

export type QuoteEdge = {
  __typename?: 'QuoteEdge';
  /** A cursor for paginating through the quotes. */
  cursor: Scalars['String']['output'];
  /** A quote node in the list. */
  node: Quote;
};

export type QuoteResponse = {
  __typename?: 'QuoteResponse';
  /** The quote object returned in the response. */
  quote?: Maybe<Quote>;
};

export type Receiver = {
  __typename?: 'Receiver';
  /** Indicates whether the incoming payment has completed receiving funds. */
  completed: Scalars['Boolean']['output'];
  /** The date and time that the incoming payment was created. */
  createdAt: Scalars['String']['output'];
  /** Date and time that the incoming payment will expire. After this time, the incoming payment will not accept further payments made to it. */
  expiresAt?: Maybe<Scalars['String']['output']>;
  /** Unique identifier of the receiver (incoming payment URL). */
  id: Scalars['String']['output'];
  /** The maximum amount that should be paid into the wallet address under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** The total amount that has been paid into the wallet address under this incoming payment. */
  receivedAmount: Amount;
  /** The date and time that the incoming payment was last updated. */
  updatedAt: Scalars['String']['output'];
  /** Wallet address URL under which the incoming payment was created. */
  walletAddressUrl: Scalars['String']['output'];
};

export type RevokeWalletAddressKeyInput = {
  /** Internal unique identifier of the key to revoke. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
};

export type RevokeWalletAddressKeyMutationResponse = {
  __typename?: 'RevokeWalletAddressKeyMutationResponse';
  /** The wallet address key that was revoked. */
  walletAddressKey?: Maybe<WalletAddressKey>;
};

export type SetFeeInput = {
  /** Unique identifier of the asset id to add the fees to. */
  assetId: Scalars['ID']['input'];
  /** Fee values */
  fee: FeeDetails;
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Type of fee, either sending or receiving. */
  type: FeeType;
};

export type SetFeeResponse = {
  __typename?: 'SetFeeResponse';
  /** The fee that was set. */
  fee?: Maybe<Fee>;
};

export enum SortOrder {
  /** Sort the results in ascending order. */
  Asc = 'ASC',
  /** Sort the results in descending order. */
  Desc = 'DESC'
}

export enum TransferState {
  /** The accounting transfer is pending */
  Pending = 'PENDING',
  /** The accounting transfer is posted */
  Posted = 'POSTED',
  /** The accounting transfer is voided */
  Voided = 'VOIDED'
}

export enum TransferType {
  /** Represents a deposit transfer. */
  Deposit = 'DEPOSIT',
  /** Represents a generic transfer within Rafiki. */
  Transfer = 'TRANSFER',
  /** Represents a withdrawal transfer. */
  Withdrawal = 'WITHDRAWAL'
}

export type TriggerWalletAddressEventsInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of events being triggered (n). */
  limit: Scalars['Int']['input'];
};

export type TriggerWalletAddressEventsMutationResponse = {
  __typename?: 'TriggerWalletAddressEventsMutationResponse';
  /** The number of events that were triggered. */
  count?: Maybe<Scalars['Int']['output']>;
};

export type UpdateAssetInput = {
  /** Unique identifier of the asset to update. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** A webhook event will notify the Account Servicing Entity if liquidity falls below this new value. */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** New minimum amount of liquidity that can be withdrawn from the asset. */
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']['input']>;
};

export type UpdateIncomingPaymentInput = {
  /** Unique identifier of the incoming payment to update. */
  id: Scalars['ID']['input'];
  /** The new metadata object to save for the incoming payment. It will overwrite any existing metadata. */
  metadata: Scalars['JSONObject']['input'];
};

export type UpdatePeerInput = {
  /** New peering connection details. */
  http?: InputMaybe<HttpInput>;
  /** Unique identifier of the peer to update. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** A webhook event will notify the Account Servicing Entity if peer liquidity falls below this new value. */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** New maximum packet amount that the peer accepts. */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']['input']>;
  /** New public name for the peer. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New ILP address for the peer. */
  staticIlpAddress?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePeerMutationResponse = {
  __typename?: 'UpdatePeerMutationResponse';
  /** The peer that was updated. */
  peer?: Maybe<Peer>;
};

export type UpdateWalletAddressInput = {
  /** Additional properties associated with this wallet address. */
  additionalProperties?: InputMaybe<Array<AdditionalPropertyInput>>;
  /** Unique identifier of the wallet address to update. This cannot be changed. */
  id: Scalars['ID']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** New public name for the wallet address. This is visible to anyone with the wallet address URL. */
  publicName?: InputMaybe<Scalars['String']['input']>;
  /** New status to set the wallet address to, either active or inactive. */
  status?: InputMaybe<WalletAddressStatus>;
};

export type UpdateWalletAddressMutationResponse = {
  __typename?: 'UpdateWalletAddressMutationResponse';
  /** The updated wallet address. */
  walletAddress?: Maybe<WalletAddress>;
};

export type VoidLiquidityWithdrawalInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
  /** Unique identifier of the liquidity withdrawal to void. */
  withdrawalId: Scalars['String']['input'];
};

export type WalletAddress = Model & {
  __typename?: 'WalletAddress';
  /** Additional properties associated with the wallet address. */
  additionalProperties?: Maybe<Array<Maybe<AdditionalProperty>>>;
  /** Asset of the wallet address. */
  asset: Asset;
  /** The date and time when the wallet address was created. */
  createdAt: Scalars['String']['output'];
  /** Unique identifier of the wallet address. */
  id: Scalars['ID']['output'];
  /** List of incoming payments received by this wallet address */
  incomingPayments?: Maybe<IncomingPaymentConnection>;
  /** Current amount of liquidity available for this wallet address. */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** List of outgoing payments sent from this wallet address */
  outgoingPayments?: Maybe<OutgoingPaymentConnection>;
  /** Public name associated with the wallet address. This is visible to anyone with the wallet address URL. */
  publicName?: Maybe<Scalars['String']['output']>;
  /** List of quotes created at this wallet address */
  quotes?: Maybe<QuoteConnection>;
  /** The current status of the wallet, either active or inactive. */
  status: WalletAddressStatus;
  /** Wallet Address URL. */
  url: Scalars['String']['output'];
  /** List of keys associated with this wallet address */
  walletAddressKeys?: Maybe<WalletAddressKeyConnection>;
};


export type WalletAddressIncomingPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type WalletAddressOutgoingPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type WalletAddressQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};


export type WalletAddressWalletAddressKeysArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};

export type WalletAddressEdge = {
  __typename?: 'WalletAddressEdge';
  /** A cursor for paginating through the wallet addresses. */
  cursor: Scalars['String']['output'];
  /** A wallet address node in the list. */
  node: WalletAddress;
};

export type WalletAddressKey = Model & {
  __typename?: 'WalletAddressKey';
  /** The date and time that this wallet address key was created. */
  createdAt: Scalars['String']['output'];
  /** Unique internal identifier for the wallet address key. */
  id: Scalars['ID']['output'];
  /** The public key object in JSON Web Key (JWK) format. */
  jwk: Jwk;
  /** Indicator of whether the key has been revoked. */
  revoked: Scalars['Boolean']['output'];
  /** Unique identifier of the wallet address to associate with the key. */
  walletAddressId: Scalars['ID']['output'];
};

export type WalletAddressKeyConnection = {
  __typename?: 'WalletAddressKeyConnection';
  /** A list of wallet address key edges, containing wallet address key nodes and cursors for pagination. */
  edges: Array<WalletAddressKeyEdge>;
  /** Pagination information for wallet address keys. */
  pageInfo: PageInfo;
};

export type WalletAddressKeyEdge = {
  __typename?: 'WalletAddressKeyEdge';
  /** A cursor for paginating through the wallet address keys. */
  cursor: Scalars['String']['output'];
  /** A wallet address key node in the list. */
  node: WalletAddressKey;
};

export enum WalletAddressStatus {
  /** The default status of a wallet address. */
  Active = 'ACTIVE',
  /** The status after deactivating a wallet address. */
  Inactive = 'INACTIVE'
}

export type WalletAddressWithdrawal = {
  __typename?: 'WalletAddressWithdrawal';
  /** Amount to be withdrawn. */
  amount: Scalars['BigInt']['output'];
  /** Unique identifier for the withdrawal. */
  id: Scalars['ID']['output'];
  /** Details about the wallet address from which the withdrawal is made. */
  walletAddress: WalletAddress;
};

export type WalletAddressWithdrawalMutationResponse = {
  __typename?: 'WalletAddressWithdrawalMutationResponse';
  /** The wallet address withdrawal that was processed. */
  withdrawal?: Maybe<WalletAddressWithdrawal>;
};

export type WalletAddressesConnection = {
  __typename?: 'WalletAddressesConnection';
  /** A list of wallet address edges, containing wallet address nodes and cursors for pagination. */
  edges: Array<WalletAddressEdge>;
  /** Pagination information for the wallet addresses. */
  pageInfo: PageInfo;
};

export type WebhookEvent = Model & {
  __typename?: 'WebhookEvent';
  /** The date and time when the webhook event was created. */
  createdAt: Scalars['String']['output'];
  /** Stringified JSON data for the webhook event. */
  data: Scalars['JSONObject']['output'];
  /** Unique identifier of the webhook event. */
  id: Scalars['ID']['output'];
  /** Type of webhook event. */
  type: Scalars['String']['output'];
};

export type WebhookEventFilter = {
  /** Filter for webhook events based on their type. */
  type?: InputMaybe<FilterString>;
};

export type WebhookEventsConnection = {
  __typename?: 'WebhookEventsConnection';
  /** A list of webhook event edges, containing event nodes and cursors for pagination. */
  edges: Array<WebhookEventsEdge>;
  /** Pagination information for webhook events. */
  pageInfo: PageInfo;
};

export type WebhookEventsEdge = {
  __typename?: 'WebhookEventsEdge';
  /** A cursor for paginating through the webhook events. */
  cursor: Scalars['String']['output'];
  /** A webhook event node in the list. */
  node: WebhookEvent;
};

export type WithdrawEventLiquidityInput = {
  /** Unique identifier of the event to withdraw liquidity from. */
  eventId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. For more information, refer to [idempotency](https://rafiki.dev/apis/graphql/admin-api-overview/#idempotency). */
  idempotencyKey: Scalars['String']['input'];
};

export type CreateAssetMutationVariables = Exact<{
  input: CreateAssetInput;
}>;


export type CreateAssetMutation = { __typename?: 'Mutation', createAsset: { __typename?: 'AssetMutationResponse', asset?: { __typename?: 'Asset', id: string, code: string, scale: number } | null } };

export type GetAssetsQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAssetsQuery = { __typename?: 'Query', assets: { __typename?: 'AssetsConnection', edges: Array<{ __typename?: 'AssetEdge', cursor: string, node: { __typename?: 'Asset', code: string, createdAt: string, id: string, scale: number, withdrawalThreshold?: bigint | null } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetAssetQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetAssetQuery = { __typename?: 'Query', asset?: { __typename?: 'Asset', code: string, createdAt: string, id: string, scale: number, withdrawalThreshold?: bigint | null } | null };

export type CreateIncomingPaymentMutationVariables = Exact<{
  input: CreateIncomingPaymentInput;
}>;


export type CreateIncomingPaymentMutation = { __typename?: 'Mutation', createIncomingPayment: { __typename?: 'IncomingPaymentResponse', payment?: { __typename?: 'IncomingPayment', createdAt: string, metadata?: any | null, expiresAt: string, id: string, walletAddressId: string, state: IncomingPaymentState, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type GetIncomingPaymentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIncomingPaymentQuery = { __typename?: 'Query', incomingPayment?: { __typename?: 'IncomingPayment', id: string, walletAddressId: string } | null };

export type WithdrawLiquidityMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
}>;


export type WithdrawLiquidityMutation = { __typename?: 'Mutation', withdrawEventLiquidity?: { __typename?: 'LiquidityMutationResponse', success: boolean } | null };

export type DepositLiquidityMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
}>;


export type DepositLiquidityMutation = { __typename?: 'Mutation', depositEventLiquidity?: { __typename?: 'LiquidityMutationResponse', success: boolean } | null };

export type CreateOutgoingPaymentMutationVariables = Exact<{
  input: CreateOutgoingPaymentInput;
}>;


export type CreateOutgoingPaymentMutation = { __typename?: 'Mutation', createOutgoingPayment: { __typename?: 'OutgoingPaymentResponse', payment?: { __typename?: 'OutgoingPayment', createdAt: string, metadata?: any | null, error?: string | null, id: string, walletAddressId: string, receiver: string, state: OutgoingPaymentState, stateAttempts: number, quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, id: string, walletAddressId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, debitAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, debitAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sentAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type GetOutgoingPaymentsQueryVariables = Exact<{
  filter?: InputMaybe<OutgoingPaymentFilter>;
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetOutgoingPaymentsQuery = { __typename?: 'Query', outgoingPayments: { __typename?: 'OutgoingPaymentConnection', edges: Array<{ __typename?: 'OutgoingPaymentEdge', cursor: string, node: { __typename?: 'OutgoingPayment', id: string, walletAddressId: string, receiver: string, grantId?: string | null, state: OutgoingPaymentState, createdAt: string, sentAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetOutgoingPaymentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetOutgoingPaymentQuery = { __typename?: 'Query', outgoingPayment?: { __typename?: 'OutgoingPayment', id: string, walletAddressId: string, receiver: string, grantId?: string | null, state: OutgoingPaymentState, createdAt: string, sentAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null };

export type CreateQuoteMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;


export type CreateQuoteMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'QuoteResponse', quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, id: string, walletAddressId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, debitAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type GetQuoteQueryVariables = Exact<{
  quoteId: Scalars['String']['input'];
}>;


export type GetQuoteQuery = { __typename?: 'Query', quote?: { __typename?: 'Quote', id: string, walletAddressId: string, receiver: string, createdAt: string, expiresAt: string, debitAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number }, receiveAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number } } | null };

export type CreateReceiverMutationVariables = Exact<{
  input: CreateReceiverInput;
}>;


export type CreateReceiverMutation = { __typename?: 'Mutation', createReceiver: { __typename?: 'CreateReceiverResponse', receiver?: { __typename?: 'Receiver', createdAt: string, metadata?: any | null, expiresAt?: string | null, id: string, walletAddressUrl: string, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type GetReceiverQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetReceiverQuery = { __typename?: 'Query', receiver?: { __typename?: 'Receiver', completed: boolean, createdAt: string, expiresAt?: string | null, metadata?: any | null, id: string, walletAddressUrl: string, updatedAt: string, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null };

export type CreateWalletAddressKeyMutationVariables = Exact<{
  input: CreateWalletAddressKeyInput;
}>;


export type CreateWalletAddressKeyMutation = { __typename?: 'Mutation', createWalletAddressKey?: { __typename?: 'CreateWalletAddressKeyMutationResponse', walletAddressKey?: { __typename?: 'WalletAddressKey', id: string, walletAddressId: string, revoked: boolean, createdAt: string, jwk: { __typename?: 'Jwk', alg: Alg, crv: Crv, kid: string, kty: Kty, x: string } } | null } | null };

export type RevokeWalletAddressKeyMutationVariables = Exact<{
  input: RevokeWalletAddressKeyInput;
}>;


export type RevokeWalletAddressKeyMutation = { __typename?: 'Mutation', revokeWalletAddressKey?: { __typename?: 'RevokeWalletAddressKeyMutationResponse', walletAddressKey?: { __typename?: 'WalletAddressKey', id: string, revoked: boolean, walletAddressId: string, createdAt: string } | null } | null };

export type CreateWalletAddressMutationVariables = Exact<{
  input: CreateWalletAddressInput;
}>;


export type CreateWalletAddressMutation = { __typename?: 'Mutation', createWalletAddress: { __typename?: 'CreateWalletAddressMutationResponse', walletAddress?: { __typename?: 'WalletAddress', id: string, url: string, publicName?: string | null } | null } };

export type UpdateWalletAddressMutationVariables = Exact<{
  input: UpdateWalletAddressInput;
}>;


export type UpdateWalletAddressMutation = { __typename?: 'Mutation', updateWalletAddress: { __typename?: 'UpdateWalletAddressMutationResponse', walletAddress?: { __typename?: 'WalletAddress', id: string, url: string, publicName?: string | null } | null } };
