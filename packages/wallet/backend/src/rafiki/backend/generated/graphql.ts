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

export enum Alg {
  EdDsa = 'EdDSA'
}

export type Amount = {
  __typename?: 'Amount';
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  assetCode: Scalars['String']['output'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  assetScale: Scalars['UInt8']['output'];
  value: Scalars['BigInt']['output'];
};

export type AmountInput = {
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  assetCode: Scalars['String']['input'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  assetScale: Scalars['UInt8']['input'];
  value: Scalars['BigInt']['input'];
};

export type Asset = Model & {
  __typename?: 'Asset';
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  code: Scalars['String']['output'];
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Fetch a page of asset fees */
  fees?: Maybe<FeesConnection>;
  /** Asset id */
  id: Scalars['ID']['output'];
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Account Servicing Entity will be notified via a webhook event if liquidity falls below this value */
  liquidityThreshold?: Maybe<Scalars['BigInt']['output']>;
  /** The receiving fee structure for the asset */
  receivingFee?: Maybe<Fee>;
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  scale: Scalars['UInt8']['output'];
  /** The sending fee structure for the asset */
  sendingFee?: Maybe<Fee>;
  /** Minimum amount of liquidity that can be withdrawn from the asset */
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
  cursor: Scalars['String']['output'];
  node: Asset;
};

export type AssetMutationResponse = MutationResponse & {
  __typename?: 'AssetMutationResponse';
  asset?: Maybe<Asset>;
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type AssetsConnection = {
  __typename?: 'AssetsConnection';
  edges: Array<AssetEdge>;
  pageInfo: PageInfo;
};

export type BasePayment = {
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  walletAddressId: Scalars['ID']['output'];
};

export type CreateAssetInput = {
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  code: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Account Servicing Entity will be notified via a webhook event if liquidity falls below this value */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  scale: Scalars['UInt8']['input'];
  /** Minimum amount of liquidity that can be withdrawn from the asset */
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']['input']>;
};

export type CreateAssetLiquidityWithdrawalInput = {
  /** Amount of withdrawal. */
  amount: Scalars['BigInt']['input'];
  /** The id of the asset to create the withdrawal for. */
  assetId: Scalars['String']['input'];
  /** The id of the withdrawal. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
};

export type CreateIncomingPaymentInput = {
  /** Expiration date-time */
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Maximum amount to be received */
  incomingAmount?: InputMaybe<AmountInput>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Id of the wallet address under which the incoming payment will be created */
  walletAddressId: Scalars['String']['input'];
};

export type CreateOrUpdatePeerByUrlInput = {
  /** Asset id of peering relationship */
  assetId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Account Servicing Entity will be notified via a webhook event if peer liquidity falls below this value */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** Amount of liquidity to deposit for peer */
  liquidityToDeposit?: InputMaybe<Scalars['BigInt']['input']>;
  /** Maximum packet amount that the peer accepts */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']['input']>;
  /** Peer's internal name for overriding auto-peer's default naming */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Peer's URL address at which the peer accepts auto-peering requests */
  peerUrl: Scalars['String']['input'];
};

export type CreateOrUpdatePeerByUrlMutationResponse = MutationResponse & {
  __typename?: 'CreateOrUpdatePeerByUrlMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  peer?: Maybe<Peer>;
  success: Scalars['Boolean']['output'];
};

export type CreateOutgoingPaymentInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Additional metadata associated with the outgoing payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Id of the corresponding quote for that outgoing payment */
  quoteId: Scalars['String']['input'];
  /** Id of the wallet address under which the outgoing payment will be created */
  walletAddressId: Scalars['String']['input'];
};

export type CreatePeerInput = {
  /** Asset id of peering relationship */
  assetId: Scalars['String']['input'];
  /** Peering connection details */
  http: HttpInput;
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Initial amount of liquidity to deposit for peer */
  initialLiquidity?: InputMaybe<Scalars['BigInt']['input']>;
  /** Account Servicing Entity will be notified via a webhook event if peer liquidity falls below this value */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** Maximum packet amount that the peer accepts */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']['input']>;
  /** Peer's internal name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Peer's ILP address */
  staticIlpAddress: Scalars['String']['input'];
};

export type CreatePeerLiquidityWithdrawalInput = {
  /** Amount of withdrawal. */
  amount: Scalars['BigInt']['input'];
  /** The id of the withdrawal. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the peer to create the withdrawal for. */
  peerId: Scalars['String']['input'];
};

export type CreatePeerMutationResponse = MutationResponse & {
  __typename?: 'CreatePeerMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  peer?: Maybe<Peer>;
  success: Scalars['Boolean']['output'];
};

export type CreateQuoteInput = {
  /** Amount to send (fixed send) */
  debitAmount?: InputMaybe<AmountInput>;
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Amount to receive (fixed receive) */
  receiveAmount?: InputMaybe<AmountInput>;
  /** Wallet address URL of the receiver */
  receiver: Scalars['String']['input'];
  /** Id of the wallet address under which the quote will be created */
  walletAddressId: Scalars['String']['input'];
};

export type CreateReceiverInput = {
  /** Expiration date-time */
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Maximum amount to be received */
  incomingAmount?: InputMaybe<AmountInput>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Receiving wallet address URL */
  walletAddressUrl: Scalars['String']['input'];
};

export type CreateReceiverResponse = {
  __typename?: 'CreateReceiverResponse';
  code: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  receiver?: Maybe<Receiver>;
  success: Scalars['Boolean']['output'];
};

export type CreateWalletAddressInput = {
  /** Asset of the wallet address */
  assetId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Public name associated with the wallet address */
  publicName?: InputMaybe<Scalars['String']['input']>;
  /** Wallet Address URL */
  url: Scalars['String']['input'];
};

export type CreateWalletAddressKeyInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Public key */
  jwk: JwkInput;
  walletAddressId: Scalars['String']['input'];
};

export type CreateWalletAddressKeyMutationResponse = MutationResponse & {
  __typename?: 'CreateWalletAddressKeyMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  walletAddressKey?: Maybe<WalletAddressKey>;
};

export type CreateWalletAddressMutationResponse = MutationResponse & {
  __typename?: 'CreateWalletAddressMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  walletAddress?: Maybe<WalletAddress>;
};

export type CreateWalletAddressWithdrawalInput = {
  /** The id of the withdrawal. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the Open Payments wallet address to create the withdrawal for. */
  walletAddressId: Scalars['String']['input'];
};

export enum Crv {
  Ed25519 = 'Ed25519'
}

export type DeletePeerInput = {
  id: Scalars['ID']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
};

export type DeletePeerMutationResponse = MutationResponse & {
  __typename?: 'DeletePeerMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DepositAssetLiquidityInput = {
  /** Amount of liquidity to deposit. */
  amount: Scalars['BigInt']['input'];
  /** The id of the asset to deposit liquidity. */
  assetId: Scalars['String']['input'];
  /** The id of the transfer. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
};

export type DepositEventLiquidityInput = {
  /** The id of the event to deposit into. */
  eventId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
};

export type DepositOutgoingPaymentLiquidityInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the outgoing payment to deposit into. */
  outgoingPaymentId: Scalars['String']['input'];
};

export type DepositPeerLiquidityInput = {
  /** Amount of liquidity to deposit. */
  amount: Scalars['BigInt']['input'];
  /** The id of the transfer. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the peer to deposit liquidity. */
  peerId: Scalars['String']['input'];
};

export type Fee = Model & {
  __typename?: 'Fee';
  /** Asset id associated with the fee */
  assetId: Scalars['ID']['output'];
  /** Basis points fee. 1 basis point = 0.01%, 100 basis points = 1%, 10000 basis points = 100% */
  basisPoints: Scalars['Int']['output'];
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Fixed fee */
  fixed: Scalars['BigInt']['output'];
  /** Fee id */
  id: Scalars['ID']['output'];
  /** Type of fee (sending or receiving) */
  type: FeeType;
};

export type FeeDetails = {
  /** Basis points fee. Should be between 0 and 10000 (inclusive). 1 basis point = 0.01%, 100 basis points = 1%, 10000 basis points = 100% */
  basisPoints: Scalars['Int']['input'];
  /** A flat fee */
  fixed: Scalars['BigInt']['input'];
};

export type FeeEdge = {
  __typename?: 'FeeEdge';
  cursor: Scalars['String']['output'];
  node: Fee;
};

export enum FeeType {
  /** Receiver pays the fees */
  Receiving = 'RECEIVING',
  /** Sender pays the fees */
  Sending = 'SENDING'
}

export type FeesConnection = {
  __typename?: 'FeesConnection';
  edges: Array<FeeEdge>;
  pageInfo: PageInfo;
};

export type FilterString = {
  in: Array<Scalars['String']['input']>;
};

export type Http = {
  __typename?: 'Http';
  /** Outgoing connection details */
  outgoing: HttpOutgoing;
};

export type HttpIncomingInput = {
  /** Array of auth tokens accepted by this Rafiki instance */
  authTokens: Array<Scalars['String']['input']>;
};

export type HttpInput = {
  /** Incoming connection details */
  incoming?: InputMaybe<HttpIncomingInput>;
  /** Outgoing connection details */
  outgoing: HttpOutgoingInput;
};

export type HttpOutgoing = {
  __typename?: 'HttpOutgoing';
  /** Auth token to present at the peering Rafiki instance */
  authToken: Scalars['String']['output'];
  /** Peer's connection endpoint */
  endpoint: Scalars['String']['output'];
};

export type HttpOutgoingInput = {
  /** Auth token to present at the peering Rafiki instance */
  authToken: Scalars['String']['input'];
  /** Peer's connection endpoint */
  endpoint: Scalars['String']['input'];
};

export type IncomingPayment = BasePayment & Model & {
  __typename?: 'IncomingPayment';
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Date-time of expiry. After this time, the incoming payment will not accept further payments made to it. */
  expiresAt: Scalars['String']['output'];
  /** Incoming Payment id */
  id: Scalars['ID']['output'];
  /** The maximum amount that should be paid into the wallet address under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** The total amount that has been paid into the wallet address under this incoming payment. */
  receivedAmount: Amount;
  /** Incoming payment state */
  state: IncomingPaymentState;
  /** Id of the wallet address under which this incoming payment was created */
  walletAddressId: Scalars['ID']['output'];
};

export type IncomingPaymentConnection = {
  __typename?: 'IncomingPaymentConnection';
  edges: Array<IncomingPaymentEdge>;
  pageInfo: PageInfo;
};

export type IncomingPaymentEdge = {
  __typename?: 'IncomingPaymentEdge';
  cursor: Scalars['String']['output'];
  node: IncomingPayment;
};

export type IncomingPaymentResponse = {
  __typename?: 'IncomingPaymentResponse';
  code: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  payment?: Maybe<IncomingPayment>;
  success: Scalars['Boolean']['output'];
};

export enum IncomingPaymentState {
  /** The payment is either auto-completed once the received amount equals the expected `incomingAmount`, or it is completed manually via an API call. */
  Completed = 'COMPLETED',
  /** If the payment expires before it is completed then the state will move to EXPIRED and no further payments will be accepted. */
  Expired = 'EXPIRED',
  /** The payment has a state of PENDING when it is initially created. */
  Pending = 'PENDING',
  /** As soon as payment has started (funds have cleared into the account) the state moves to PROCESSING */
  Processing = 'PROCESSING'
}

export type Jwk = {
  __typename?: 'Jwk';
  /** Cryptographic algorithm family used with the key. The only allowed value is `EdDSA`. */
  alg: Alg;
  /** Curve that the key pair is derived from. The only allowed value is `Ed25519`. */
  crv: Crv;
  /** Key id */
  kid: Scalars['String']['output'];
  /** Key type. The only allowed value is `OKP`. */
  kty: Kty;
  /** Base64 url-encoded public key. */
  x: Scalars['String']['output'];
};

export type JwkInput = {
  /** Cryptographic algorithm family used with the key. The only allowed value is `EdDSA`. */
  alg: Alg;
  /** Curve that the key pair is derived from. The only allowed value is `Ed25519`. */
  crv: Crv;
  /** Key id */
  kid: Scalars['String']['input'];
  /** Key type. The only allowed value is `OKP`. */
  kty: Kty;
  /** Base64 url-encoded public key. */
  x: Scalars['String']['input'];
};

export enum Kty {
  Okp = 'OKP'
}

export enum LiquidityError {
  AlreadyPosted = 'AlreadyPosted',
  AlreadyVoided = 'AlreadyVoided',
  AmountZero = 'AmountZero',
  InsufficientBalance = 'InsufficientBalance',
  InvalidId = 'InvalidId',
  TransferExists = 'TransferExists',
  UnknownAsset = 'UnknownAsset',
  UnknownIncomingPayment = 'UnknownIncomingPayment',
  UnknownPayment = 'UnknownPayment',
  UnknownPeer = 'UnknownPeer',
  UnknownTransfer = 'UnknownTransfer',
  UnknownWalletAddress = 'UnknownWalletAddress'
}

export type LiquidityMutationResponse = MutationResponse & {
  __typename?: 'LiquidityMutationResponse';
  code: Scalars['String']['output'];
  error?: Maybe<LiquidityError>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Model = {
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create an asset */
  createAsset: AssetMutationResponse;
  /** Withdraw asset liquidity */
  createAssetLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an internal Open Payments Incoming Payment. The receiver has a wallet address on this Rafiki instance. */
  createIncomingPayment: IncomingPaymentResponse;
  /** Create a peer using a URL */
  createOrUpdatePeerByUrl: CreateOrUpdatePeerByUrlMutationResponse;
  /** Create an Open Payments Outgoing Payment */
  createOutgoingPayment: OutgoingPaymentResponse;
  /** Create a peer */
  createPeer: CreatePeerMutationResponse;
  /** Withdraw peer liquidity */
  createPeerLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an Open Payments Quote */
  createQuote: QuoteResponse;
  /** Create an internal or external Open Payments Incoming Payment. The receiver has a wallet address on either this or another Open Payments resource server. */
  createReceiver: CreateReceiverResponse;
  /** Create a wallet address */
  createWalletAddress: CreateWalletAddressMutationResponse;
  /** Add a public key to a wallet address that is used to verify Open Payments requests. */
  createWalletAddressKey?: Maybe<CreateWalletAddressKeyMutationResponse>;
  /** Withdraw liquidity from a wallet address received via Web Monetization. */
  createWalletAddressWithdrawal?: Maybe<WalletAddressWithdrawalMutationResponse>;
  /** Delete a peer */
  deletePeer: DeletePeerMutationResponse;
  /** Deposit asset liquidity */
  depositAssetLiquidity?: Maybe<LiquidityMutationResponse>;
  /**
   * Deposit webhook event liquidity
   * @deprecated Use `depositOutgoingPaymentLiquidity`
   */
  depositEventLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Deposit outgoing payment liquidity */
  depositOutgoingPaymentLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Deposit peer liquidity */
  depositPeerLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Post liquidity withdrawal. Withdrawals are two-phase commits and are committed via this mutation. */
  postLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Revoke a public key associated with a wallet address. Open Payment requests using this key for request signatures will be denied going forward. */
  revokeWalletAddressKey?: Maybe<RevokeWalletAddressKeyMutationResponse>;
  /** Set the fee on an asset */
  setFee: SetFeeResponse;
  /** If automatic withdrawal of funds received via Web Monetization by the wallet address are disabled, this mutation can be used to trigger up to n withdrawal events. */
  triggerWalletAddressEvents: TriggerWalletAddressEventsMutationResponse;
  /** Update an asset */
  updateAsset: AssetMutationResponse;
  /** Update a peer */
  updatePeer: UpdatePeerMutationResponse;
  /** Update a wallet address */
  updateWalletAddress: UpdateWalletAddressMutationResponse;
  /** Void liquidity withdrawal. Withdrawals are two-phase commits and are rolled back via this mutation. */
  voidLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /**
   * Withdraw webhook event liquidity
   * @deprecated Use `withdrawOutgoingPaymentLiquidity, withdrawIncomingPaymentLiquidity, or createWalletAddressWithdrawal`
   */
  withdrawEventLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Withdraw incoming payment liquidity */
  withdrawIncomingPaymentLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Withdraw outgoing payment liquidity */
  withdrawOutgoingPaymentLiquidity?: Maybe<LiquidityMutationResponse>;
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


export type MutationCreateOrUpdatePeerByUrlArgs = {
  input: CreateOrUpdatePeerByUrlInput;
};


export type MutationCreateOutgoingPaymentArgs = {
  input: CreateOutgoingPaymentInput;
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


export type MutationWithdrawIncomingPaymentLiquidityArgs = {
  input: WithdrawIncomingPaymentLiquidityInput;
};


export type MutationWithdrawOutgoingPaymentLiquidityArgs = {
  input: WithdrawOutgoingPaymentLiquidityInput;
};

export type MutationResponse = {
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type OutgoingPayment = BasePayment & Model & {
  __typename?: 'OutgoingPayment';
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Amount to send (fixed send) */
  debitAmount: Amount;
  error?: Maybe<Scalars['String']['output']>;
  /** Outgoing payment id */
  id: Scalars['ID']['output'];
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Additional metadata associated with the outgoing payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Quote for this outgoing payment */
  quote?: Maybe<Quote>;
  /** Amount to receive (fixed receive) */
  receiveAmount: Amount;
  /** Wallet address URL of the receiver */
  receiver: Scalars['String']['output'];
  /** Amount already sent */
  sentAmount: Amount;
  /** Outgoing payment state */
  state: OutgoingPaymentState;
  stateAttempts: Scalars['Int']['output'];
  /** Id of the wallet address under which this outgoing payment was created */
  walletAddressId: Scalars['ID']['output'];
};

export type OutgoingPaymentConnection = {
  __typename?: 'OutgoingPaymentConnection';
  edges: Array<OutgoingPaymentEdge>;
  pageInfo: PageInfo;
};

export type OutgoingPaymentEdge = {
  __typename?: 'OutgoingPaymentEdge';
  cursor: Scalars['String']['output'];
  node: OutgoingPayment;
};

export type OutgoingPaymentResponse = {
  __typename?: 'OutgoingPaymentResponse';
  code: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  payment?: Maybe<OutgoingPayment>;
  success: Scalars['Boolean']['output'];
};

export enum OutgoingPaymentState {
  /** Successful completion */
  Completed = 'COMPLETED',
  /** Payment failed */
  Failed = 'FAILED',
  /** Will transition to SENDING once payment funds are reserved */
  Funding = 'FUNDING',
  /** Paying, will transition to COMPLETED on success */
  Sending = 'SENDING'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  /** Paginating forwards: the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Paginating forwards: Are there more pages? */
  hasNextPage: Scalars['Boolean']['output'];
  /** Paginating backwards: Are there more pages? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** Paginating backwards: the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Payment = BasePayment & Model & {
  __typename?: 'Payment';
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Payment id */
  id: Scalars['ID']['output'];
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Additional metadata associated with the payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Either the IncomingPaymentState or OutgoingPaymentState according to type */
  state: Scalars['String']['output'];
  /** Type of payment */
  type: PaymentType;
  /** Id of the wallet address under which this payment was created */
  walletAddressId: Scalars['ID']['output'];
};

export type PaymentConnection = {
  __typename?: 'PaymentConnection';
  edges: Array<PaymentEdge>;
  pageInfo: PageInfo;
};

export type PaymentEdge = {
  __typename?: 'PaymentEdge';
  cursor: Scalars['String']['output'];
  node: Payment;
};

export type PaymentFilter = {
  type?: InputMaybe<FilterString>;
  walletAddressId?: InputMaybe<FilterString>;
};

export enum PaymentType {
  Incoming = 'INCOMING',
  Outgoing = 'OUTGOING'
}

export type Peer = Model & {
  __typename?: 'Peer';
  /** Asset of peering relationship */
  asset: Asset;
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Peering connection details */
  http: Http;
  /** Peer id */
  id: Scalars['ID']['output'];
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Account Servicing Entity will be notified via a webhook event if peer liquidity falls below this value */
  liquidityThreshold?: Maybe<Scalars['BigInt']['output']>;
  /** Maximum packet amount that the peer accepts */
  maxPacketAmount?: Maybe<Scalars['BigInt']['output']>;
  /** Peer's public name */
  name?: Maybe<Scalars['String']['output']>;
  /** Peer's ILP address */
  staticIlpAddress: Scalars['String']['output'];
};

export type PeerEdge = {
  __typename?: 'PeerEdge';
  cursor: Scalars['String']['output'];
  node: Peer;
};

export type PeersConnection = {
  __typename?: 'PeersConnection';
  edges: Array<PeerEdge>;
  pageInfo: PageInfo;
};

export type PostLiquidityWithdrawalInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the liquidity withdrawal to post. */
  withdrawalId: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Fetch an asset */
  asset?: Maybe<Asset>;
  /** Fetch a page of assets. */
  assets: AssetsConnection;
  /** Fetch an Open Payments incoming payment */
  incomingPayment?: Maybe<IncomingPayment>;
  /** Fetch an Open Payments outgoing payment */
  outgoingPayment?: Maybe<OutgoingPayment>;
  /** Fetch a page of combined payments */
  payments: PaymentConnection;
  /** Fetch a peer */
  peer?: Maybe<Peer>;
  /** Fetch a page of peers. */
  peers: PeersConnection;
  /** Fetch an Open Payments quote */
  quote?: Maybe<Quote>;
  /** Get an local or remote Open Payments Incoming Payment. The receiver has a wallet address on either this or another Open Payments resource server. */
  receiver?: Maybe<Receiver>;
  /** Fetch a wallet address */
  walletAddress?: Maybe<WalletAddress>;
  /** Fetch a page of wallet addresses. */
  walletAddresses: WalletAddressesConnection;
  /** Fetch a page of webhook events */
  webhookEvents: WebhookEventsConnection;
};


export type QueryAssetArgs = {
  id: Scalars['String']['input'];
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
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Amount to send (fixed send) */
  debitAmount: Amount;
  /** Date-time of expiration */
  expiresAt: Scalars['String']['output'];
  /** Upper bound of probed exchange rate */
  highEstimatedExchangeRate: Scalars['Float']['output'];
  /** Quote id */
  id: Scalars['ID']['output'];
  /** Lower bound of probed exchange rate */
  lowEstimatedExchangeRate: Scalars['Float']['output'];
  /** Maximum value per packet allowed on the possible routes */
  maxPacketAmount: Scalars['BigInt']['output'];
  /** Aggregate exchange rate the payment is guaranteed to meet */
  minExchangeRate: Scalars['Float']['output'];
  /** Amount to receive (fixed receive) */
  receiveAmount: Amount;
  /** Wallet address URL of the receiver */
  receiver: Scalars['String']['output'];
  /** Id of the wallet address under which this quote was created */
  walletAddressId: Scalars['ID']['output'];
};

export type QuoteConnection = {
  __typename?: 'QuoteConnection';
  edges: Array<QuoteEdge>;
  pageInfo: PageInfo;
};

export type QuoteEdge = {
  __typename?: 'QuoteEdge';
  cursor: Scalars['String']['output'];
  node: Quote;
};

export type QuoteResponse = {
  __typename?: 'QuoteResponse';
  code: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  quote?: Maybe<Quote>;
  success: Scalars['Boolean']['output'];
};

export type Receiver = {
  __typename?: 'Receiver';
  /** Describes whether the incoming payment has completed receiving funds. */
  completed: Scalars['Boolean']['output'];
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Date-time of expiry. After this time, the incoming payment will accept further payments made to it. */
  expiresAt?: Maybe<Scalars['String']['output']>;
  /** Incoming payment URL */
  id: Scalars['String']['output'];
  /** The maximum amount that should be paid into the wallet address under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** The total amount that has been paid into the wallet address under this incoming payment. */
  receivedAmount: Amount;
  /** Date-time of last update */
  updatedAt: Scalars['String']['output'];
  /** Wallet address URL under which the incoming payment was created */
  walletAddressUrl: Scalars['String']['output'];
};

export type RevokeWalletAddressKeyInput = {
  /** Internal id of key */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
};

export type RevokeWalletAddressKeyMutationResponse = MutationResponse & {
  __typename?: 'RevokeWalletAddressKeyMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  walletAddressKey?: Maybe<WalletAddressKey>;
};

export type SetFeeInput = {
  /** Asset id to add the fee to */
  assetId: Scalars['ID']['input'];
  /** Fee values */
  fee: FeeDetails;
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Type of fee (sending or receiving) */
  type: FeeType;
};

export type SetFeeResponse = MutationResponse & {
  __typename?: 'SetFeeResponse';
  code: Scalars['String']['output'];
  fee?: Maybe<Fee>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export enum SortOrder {
  /** Choose ascending order for results. */
  Asc = 'ASC',
  /** Choose descending order for results. */
  Desc = 'DESC'
}

export type TransferMutationResponse = MutationResponse & {
  __typename?: 'TransferMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type TriggerWalletAddressEventsInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of events being triggered (n). */
  limit: Scalars['Int']['input'];
};

export type TriggerWalletAddressEventsMutationResponse = MutationResponse & {
  __typename?: 'TriggerWalletAddressEventsMutationResponse';
  code: Scalars['String']['output'];
  /** Number of events triggered */
  count?: Maybe<Scalars['Int']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type UpdateAssetInput = {
  /** Asset id */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Account Servicing Entity will be notified via a webhook event if liquidity falls below this new value */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** New minimum amount of liquidity that can be withdrawn from the asset */
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']['input']>;
};

export type UpdatePeerInput = {
  /** New peering connection details */
  http?: InputMaybe<HttpInput>;
  /** Peer id */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Account Servicing Entity will be notified via a webhook event if peer liquidity falls below this new value */
  liquidityThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  /** New maximum packet amount that the peer accepts */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']['input']>;
  /** Peer's new public name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Peer's new ILP address */
  staticIlpAddress?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePeerMutationResponse = MutationResponse & {
  __typename?: 'UpdatePeerMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  peer?: Maybe<Peer>;
  success: Scalars['Boolean']['output'];
};

export type UpdateWalletAddressInput = {
  /** ID of wallet address to update */
  id: Scalars['ID']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** New public name for wallet address */
  publicName?: InputMaybe<Scalars['String']['input']>;
  /** New status to set the wallet address to */
  status?: InputMaybe<WalletAddressStatus>;
};

export type UpdateWalletAddressMutationResponse = MutationResponse & {
  __typename?: 'UpdateWalletAddressMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  walletAddress?: Maybe<WalletAddress>;
};

export type VoidLiquidityWithdrawalInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the liquidity withdrawal to void. */
  withdrawalId: Scalars['String']['input'];
};

export type WalletAddress = Model & {
  __typename?: 'WalletAddress';
  /** Asset of the wallet address */
  asset: Asset;
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Wallet address id */
  id: Scalars['ID']['output'];
  /** List of incoming payments received by this wallet address */
  incomingPayments?: Maybe<IncomingPaymentConnection>;
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** List of outgoing payments sent from this wallet address */
  outgoingPayments?: Maybe<OutgoingPaymentConnection>;
  /** Public name associated with the wallet address */
  publicName?: Maybe<Scalars['String']['output']>;
  /** List of quotes created at this wallet address */
  quotes?: Maybe<QuoteConnection>;
  /** Status of the wallet address */
  status: WalletAddressStatus;
  /** Wallet Address URL */
  url: Scalars['String']['output'];
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

export type WalletAddressEdge = {
  __typename?: 'WalletAddressEdge';
  cursor: Scalars['String']['output'];
  node: WalletAddress;
};

export type WalletAddressKey = Model & {
  __typename?: 'WalletAddressKey';
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Internal id of key */
  id: Scalars['ID']['output'];
  /** Public key */
  jwk: Jwk;
  /** Indicator whether the key has been revoked */
  revoked: Scalars['Boolean']['output'];
  /** Id of the wallet address to which this key belongs to */
  walletAddressId: Scalars['ID']['output'];
};

export enum WalletAddressStatus {
  /** Default status */
  Active = 'ACTIVE',
  /** Status after deactivating */
  Inactive = 'INACTIVE'
}

export type WalletAddressWithdrawal = {
  __typename?: 'WalletAddressWithdrawal';
  /** Amount to withdraw */
  amount: Scalars['BigInt']['output'];
  /** Withdrawal Id */
  id: Scalars['ID']['output'];
  /** Wallet address details */
  walletAddress: WalletAddress;
};

export type WalletAddressWithdrawalMutationResponse = MutationResponse & {
  __typename?: 'WalletAddressWithdrawalMutationResponse';
  code: Scalars['String']['output'];
  error?: Maybe<LiquidityError>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  withdrawal?: Maybe<WalletAddressWithdrawal>;
};

export type WalletAddressesConnection = {
  __typename?: 'WalletAddressesConnection';
  edges: Array<WalletAddressEdge>;
  pageInfo: PageInfo;
};

export type WebhookEvent = Model & {
  __typename?: 'WebhookEvent';
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Stringified JSON data */
  data: Scalars['JSONObject']['output'];
  /** Event id */
  id: Scalars['ID']['output'];
  /** Type of event */
  type: Scalars['String']['output'];
};

export type WebhookEventFilter = {
  type?: InputMaybe<FilterString>;
};

export type WebhookEventsConnection = {
  __typename?: 'WebhookEventsConnection';
  edges: Array<WebhookEventsEdge>;
  pageInfo: PageInfo;
};

export type WebhookEventsEdge = {
  __typename?: 'WebhookEventsEdge';
  cursor: Scalars['String']['output'];
  node: WebhookEvent;
};

export type WithdrawEventLiquidityInput = {
  /** The id of the event to withdraw from. */
  eventId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
};

export type WithdrawIncomingPaymentLiquidityInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the incoming payment to withdraw from. */
  incomingPaymentId: Scalars['String']['input'];
};

export type WithdrawOutgoingPaymentLiquidityInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the outgoing payment to withdraw from. */
  outgoingPaymentId: Scalars['String']['input'];
};

export type CreateAssetMutationVariables = Exact<{
  input: CreateAssetInput;
}>;


export type CreateAssetMutation = { __typename?: 'Mutation', createAsset: { __typename?: 'AssetMutationResponse', code: string, success: boolean, message: string, asset?: { __typename?: 'Asset', id: string, code: string, scale: number } | null } };

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


export type CreateIncomingPaymentMutation = { __typename?: 'Mutation', createIncomingPayment: { __typename?: 'IncomingPaymentResponse', code: string, message?: string | null, success: boolean, payment?: { __typename?: 'IncomingPayment', createdAt: string, metadata?: any | null, expiresAt: string, id: string, walletAddressId: string, state: IncomingPaymentState, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type WithdrawLiquidityMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
}>;


export type WithdrawLiquidityMutation = { __typename?: 'Mutation', withdrawEventLiquidity?: { __typename?: 'LiquidityMutationResponse', code: string, success: boolean, message: string, error?: LiquidityError | null } | null };

export type DepositLiquidityMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
}>;


export type DepositLiquidityMutation = { __typename?: 'Mutation', depositEventLiquidity?: { __typename?: 'LiquidityMutationResponse', code: string, success: boolean, message: string, error?: LiquidityError | null } | null };

export type CreateOutgoingPaymentMutationVariables = Exact<{
  input: CreateOutgoingPaymentInput;
}>;


export type CreateOutgoingPaymentMutation = { __typename?: 'Mutation', createOutgoingPayment: { __typename?: 'OutgoingPaymentResponse', code: string, message?: string | null, success: boolean, payment?: { __typename?: 'OutgoingPayment', createdAt: string, metadata?: any | null, error?: string | null, id: string, walletAddressId: string, receiver: string, state: OutgoingPaymentState, stateAttempts: number, quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, highEstimatedExchangeRate: number, id: string, lowEstimatedExchangeRate: number, maxPacketAmount: bigint, minExchangeRate: number, walletAddressId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, debitAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, debitAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sentAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type CreateQuoteMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;


export type CreateQuoteMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'QuoteResponse', code: string, message?: string | null, quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, highEstimatedExchangeRate: number, id: string, lowEstimatedExchangeRate: number, maxPacketAmount: bigint, minExchangeRate: number, walletAddressId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, debitAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type GetQuoteQueryVariables = Exact<{
  quoteId: Scalars['String']['input'];
}>;


export type GetQuoteQuery = { __typename?: 'Query', quote?: { __typename?: 'Quote', id: string, walletAddressId: string, receiver: string, maxPacketAmount: bigint, minExchangeRate: number, lowEstimatedExchangeRate: number, highEstimatedExchangeRate: number, createdAt: string, expiresAt: string, debitAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number }, receiveAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number } } | null };

export type CreateReceiverMutationVariables = Exact<{
  input: CreateReceiverInput;
}>;


export type CreateReceiverMutation = { __typename?: 'Mutation', createReceiver: { __typename?: 'CreateReceiverResponse', code: string, message?: string | null, success: boolean, receiver?: { __typename?: 'Receiver', createdAt: string, metadata?: any | null, expiresAt?: string | null, id: string, walletAddressUrl: string, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type CreateWalletAddressKeyMutationVariables = Exact<{
  input: CreateWalletAddressKeyInput;
}>;


export type CreateWalletAddressKeyMutation = { __typename?: 'Mutation', createWalletAddressKey?: { __typename?: 'CreateWalletAddressKeyMutationResponse', code: string, message: string, success: boolean, walletAddressKey?: { __typename?: 'WalletAddressKey', id: string, walletAddressId: string, revoked: boolean, createdAt: string, jwk: { __typename?: 'Jwk', alg: Alg, crv: Crv, kid: string, kty: Kty, x: string } } | null } | null };

export type RevokeWalletAddressKeyMutationVariables = Exact<{
  input: RevokeWalletAddressKeyInput;
}>;


export type RevokeWalletAddressKeyMutation = { __typename?: 'Mutation', revokeWalletAddressKey?: { __typename?: 'RevokeWalletAddressKeyMutationResponse', code: string, message: string, success: boolean, walletAddressKey?: { __typename?: 'WalletAddressKey', id: string, revoked: boolean, walletAddressId: string, createdAt: string } | null } | null };

export type CreateWalletAddressMutationVariables = Exact<{
  input: CreateWalletAddressInput;
}>;


export type CreateWalletAddressMutation = { __typename?: 'Mutation', createWalletAddress: { __typename?: 'CreateWalletAddressMutationResponse', code: string, success: boolean, message: string, walletAddress?: { __typename?: 'WalletAddress', id: string, url: string, publicName?: string | null } | null } };

export type UpdateWalletAddressMutationVariables = Exact<{
  input: UpdateWalletAddressInput;
}>;


export type UpdateWalletAddressMutation = { __typename?: 'Mutation', updateWalletAddress: { __typename?: 'UpdateWalletAddressMutationResponse', code: string, success: boolean, message: string } };
