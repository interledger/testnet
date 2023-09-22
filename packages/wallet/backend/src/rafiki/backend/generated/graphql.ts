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

export type AddAssetLiquidityInput = {
  /** Amount of liquidity to add. */
  amount: Scalars['BigInt']['input'];
  /** The id of the asset to add liquidity. */
  assetId: Scalars['String']['input'];
  /** The id of the transfer. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
};

export type AddPeerLiquidityInput = {
  /** Amount of liquidity to add. */
  amount: Scalars['BigInt']['input'];
  /** The id of the transfer. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the peer to add liquidity. */
  peerId: Scalars['String']['input'];
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
  /** Asset id */
  id: Scalars['ID']['output'];
  /** Available liquidity */
  liquidity?: Maybe<Scalars['BigInt']['output']>;
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  scale: Scalars['UInt8']['output'];
  /** Minimum amount of liquidity that can be withdrawn from the asset */
  withdrawalThreshold?: Maybe<Scalars['BigInt']['output']>;
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
  paymentPointerId: Scalars['ID']['output'];
};

export type CreateAssetInput = {
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  code: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
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
  /** Id of the payment pointer under which the incoming payment will be created */
  paymentPointerId: Scalars['String']['input'];
};

export type CreateOutgoingPaymentInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Additional metadata associated with the outgoing payment. */
  metadata?: InputMaybe<Scalars['JSONObject']['input']>;
  /** Id of the payment pointer under which the outgoing payment will be created */
  paymentPointerId: Scalars['String']['input'];
  /** Id of the corresponding quote for that outgoing payment */
  quoteId: Scalars['String']['input'];
};

export type CreatePaymentPointerInput = {
  /** Asset of the payment pointer */
  assetId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Public name associated with the payment pointer */
  publicName?: InputMaybe<Scalars['String']['input']>;
  /** Payment Pointer URL */
  url: Scalars['String']['input'];
};

export type CreatePaymentPointerKeyInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Public key */
  jwk: JwkInput;
  paymentPointerId: Scalars['String']['input'];
};

export type CreatePaymentPointerKeyMutationResponse = MutationResponse & {
  __typename?: 'CreatePaymentPointerKeyMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  paymentPointerKey?: Maybe<PaymentPointerKey>;
  success: Scalars['Boolean']['output'];
};

export type CreatePaymentPointerMutationResponse = MutationResponse & {
  __typename?: 'CreatePaymentPointerMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  paymentPointer?: Maybe<PaymentPointer>;
  success: Scalars['Boolean']['output'];
};

export type CreatePaymentPointerWithdrawalInput = {
  /** The id of the withdrawal. */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the Open Payments payment pointer to create the withdrawal for. */
  paymentPointerId: Scalars['String']['input'];
};

export type CreatePeerInput = {
  /** Asset id of peering relationship */
  assetId: Scalars['String']['input'];
  /** Peering connection details */
  http: HttpInput;
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
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
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Id of the payment pointer under which the quote will be created */
  paymentPointerId: Scalars['String']['input'];
  /** Amount to receive (fixed receive) */
  receiveAmount?: InputMaybe<AmountInput>;
  /** Payment pointer URL of the receiver */
  receiver: Scalars['String']['input'];
  /** Amount to send (fixed send) */
  sendAmount?: InputMaybe<AmountInput>;
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
  /** Receiving payment pointer URL */
  paymentPointerUrl: Scalars['String']['input'];
};

export type CreateReceiverResponse = {
  __typename?: 'CreateReceiverResponse';
  code: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  receiver?: Maybe<Receiver>;
  success: Scalars['Boolean']['output'];
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

export type DepositEventLiquidityInput = {
  /** The id of the event to deposit into. */
  eventId: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
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
  /** The maximum amount that should be paid into the payment pointer under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Id of the payment pointer under which this incoming payment was created */
  paymentPointerId: Scalars['ID']['output'];
  /** The total amount that has been paid into the payment pointer under this incoming payment. */
  receivedAmount: Amount;
  /** Incoming payment state */
  state: IncomingPaymentState;
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
  UnknownPaymentPointer = 'UnknownPaymentPointer',
  UnknownPeer = 'UnknownPeer',
  UnknownTransfer = 'UnknownTransfer'
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
  /** Add asset liquidity */
  addAssetLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Add peer liquidity */
  addPeerLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Create an asset */
  createAsset: AssetMutationResponse;
  /** Withdraw asset liquidity */
  createAssetLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an internal Open Payments Incoming Payment. The receiver has a payment pointer on this Rafiki instance. */
  createIncomingPayment: IncomingPaymentResponse;
  /** Create an Open Payments Outgoing Payment */
  createOutgoingPayment: OutgoingPaymentResponse;
  /** Create a payment pointer */
  createPaymentPointer: CreatePaymentPointerMutationResponse;
  /** Add a public key to a payment pointer that is used to verify Open Payments requests. */
  createPaymentPointerKey?: Maybe<CreatePaymentPointerKeyMutationResponse>;
  /** Withdraw liquidity from a payment pointer received via Web Monetization. */
  createPaymentPointerWithdrawal?: Maybe<PaymentPointerWithdrawalMutationResponse>;
  /** Create a peer */
  createPeer: CreatePeerMutationResponse;
  /** Withdraw peer liquidity */
  createPeerLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an Open Payments Quote */
  createQuote: QuoteResponse;
  /** Create an internal or external Open Payments Incoming Payment. The receiver has a payment pointer on either this or another Open Payments resource server. */
  createReceiver: CreateReceiverResponse;
  /** Delete a peer */
  deletePeer: DeletePeerMutationResponse;
  /** Deposit webhook event liquidity */
  depositEventLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Post liquidity withdrawal. Withdrawals are two-phase commits and are committed via this mutation. */
  postLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Revoke a public key associated with a payment pointer. Open Payment requests using this key for request signatures will be denied going forward. */
  revokePaymentPointerKey?: Maybe<RevokePaymentPointerKeyMutationResponse>;
  /** If automatic withdrawal of funds received via Web Monetization by the payment pointer are disabled, this mutation can be used to trigger up to n withdrawal events. */
  triggerPaymentPointerEvents: TriggerPaymentPointerEventsMutationResponse;
  /** Update an asset's withdrawal threshold. The withdrawal threshold indicates the MINIMUM amount that can be withdrawn. */
  updateAssetWithdrawalThreshold: AssetMutationResponse;
  /** Update a payment pointer */
  updatePaymentPointer: UpdatePaymentPointerMutationResponse;
  /** Update a peer */
  updatePeer: UpdatePeerMutationResponse;
  /** Void liquidity withdrawal. Withdrawals are two-phase commits and are rolled back via this mutation. */
  voidLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Withdraw webhook event liquidity */
  withdrawEventLiquidity?: Maybe<LiquidityMutationResponse>;
};


export type MutationAddAssetLiquidityArgs = {
  input: AddAssetLiquidityInput;
};


export type MutationAddPeerLiquidityArgs = {
  input: AddPeerLiquidityInput;
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


export type MutationCreateOutgoingPaymentArgs = {
  input: CreateOutgoingPaymentInput;
};


export type MutationCreatePaymentPointerArgs = {
  input: CreatePaymentPointerInput;
};


export type MutationCreatePaymentPointerKeyArgs = {
  input: CreatePaymentPointerKeyInput;
};


export type MutationCreatePaymentPointerWithdrawalArgs = {
  input: CreatePaymentPointerWithdrawalInput;
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


export type MutationDeletePeerArgs = {
  input: DeletePeerInput;
};


export type MutationDepositEventLiquidityArgs = {
  input: DepositEventLiquidityInput;
};


export type MutationPostLiquidityWithdrawalArgs = {
  input: PostLiquidityWithdrawalInput;
};


export type MutationRevokePaymentPointerKeyArgs = {
  input: RevokePaymentPointerKeyInput;
};


export type MutationTriggerPaymentPointerEventsArgs = {
  input: TriggerPaymentPointerEventsInput;
};


export type MutationUpdateAssetWithdrawalThresholdArgs = {
  input: UpdateAssetInput;
};


export type MutationUpdatePaymentPointerArgs = {
  input: UpdatePaymentPointerInput;
};


export type MutationUpdatePeerArgs = {
  input: UpdatePeerInput;
};


export type MutationVoidLiquidityWithdrawalArgs = {
  input: VoidLiquidityWithdrawalInput;
};


export type MutationWithdrawEventLiquidityArgs = {
  input: WithdrawEventLiquidityInput;
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
  error?: Maybe<Scalars['String']['output']>;
  /** Outgoing payment id */
  id: Scalars['ID']['output'];
  /** Additional metadata associated with the outgoing payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Id of the payment pointer under which this outgoing payment was created */
  paymentPointerId: Scalars['ID']['output'];
  /** Quote for this outgoing payment */
  quote?: Maybe<Quote>;
  /** Amount to receive (fixed receive) */
  receiveAmount: Amount;
  /** Payment pointer URL of the receiver */
  receiver: Scalars['String']['output'];
  /** Amount to send (fixed send) */
  sendAmount: Amount;
  /** Amount already sent */
  sentAmount: Amount;
  /** Outgoing payment state */
  state: OutgoingPaymentState;
  stateAttempts: Scalars['Int']['output'];
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
  /** Additional metadata associated with the payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Id of the payment pointer under which this payment was created */
  paymentPointerId: Scalars['ID']['output'];
  /** Either the IncomingPaymentState or OutgoingPaymentState according to type */
  state: Scalars['String']['output'];
  /** Type of payment */
  type: PaymentType;
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
  paymentPointerId?: InputMaybe<FilterString>;
  type?: InputMaybe<FilterString>;
};

export type PaymentPointer = Model & {
  __typename?: 'PaymentPointer';
  /** Asset of the payment pointer */
  asset: Asset;
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Payment pointer id */
  id: Scalars['ID']['output'];
  /** List of incoming payments received by this payment pointer */
  incomingPayments?: Maybe<IncomingPaymentConnection>;
  /** List of outgoing payments sent from this payment pointer */
  outgoingPayments?: Maybe<OutgoingPaymentConnection>;
  /** Public name associated with the payment pointer */
  publicName?: Maybe<Scalars['String']['output']>;
  /** List of quotes created at this payment pointer */
  quotes?: Maybe<QuoteConnection>;
  /** Status of the payment pointer */
  status: PaymentPointerStatus;
  /** Payment Pointer URL */
  url: Scalars['String']['output'];
};


export type PaymentPointerIncomingPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type PaymentPointerOutgoingPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type PaymentPointerQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type PaymentPointerEdge = {
  __typename?: 'PaymentPointerEdge';
  cursor: Scalars['String']['output'];
  node: PaymentPointer;
};

export type PaymentPointerKey = Model & {
  __typename?: 'PaymentPointerKey';
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Internal id of key */
  id: Scalars['ID']['output'];
  /** Public key */
  jwk: Jwk;
  /** Id of the payment pointer to which this key belongs to */
  paymentPointerId: Scalars['ID']['output'];
  /** Indicator whether the key has been revoked */
  revoked: Scalars['Boolean']['output'];
};

export enum PaymentPointerStatus {
  /** Default status */
  Active = 'ACTIVE',
  /** Status after deactivating */
  Inactive = 'INACTIVE'
}

export type PaymentPointerWithdrawal = {
  __typename?: 'PaymentPointerWithdrawal';
  /** Amount to withdraw */
  amount: Scalars['BigInt']['output'];
  /** Withdrawal Id */
  id: Scalars['ID']['output'];
  /** Payment pointer details */
  paymentPointer: PaymentPointer;
};

export type PaymentPointerWithdrawalMutationResponse = MutationResponse & {
  __typename?: 'PaymentPointerWithdrawalMutationResponse';
  code: Scalars['String']['output'];
  error?: Maybe<LiquidityError>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  withdrawal?: Maybe<PaymentPointerWithdrawal>;
};

export type PaymentPointersConnection = {
  __typename?: 'PaymentPointersConnection';
  edges: Array<PaymentPointerEdge>;
  pageInfo: PageInfo;
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
  /** Fetch a payment pointer */
  paymentPointer?: Maybe<PaymentPointer>;
  /** Fetch a page of payment pointers. */
  paymentPointers: PaymentPointersConnection;
  /** Fetch a page of combined payments */
  payments: PaymentConnection;
  /** Fetch a peer */
  peer?: Maybe<Peer>;
  /** Fetch a page of peers. */
  peers: PeersConnection;
  /** Fetch an Open Payments quote */
  quote?: Maybe<Quote>;
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
};


export type QueryIncomingPaymentArgs = {
  id: Scalars['String']['input'];
};


export type QueryOutgoingPaymentArgs = {
  id: Scalars['String']['input'];
};


export type QueryPaymentPointerArgs = {
  id: Scalars['String']['input'];
};


export type QueryPaymentPointersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PaymentFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPeerArgs = {
  id: Scalars['String']['input'];
};


export type QueryPeersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryQuoteArgs = {
  id: Scalars['String']['input'];
};


export type QueryWebhookEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WebhookEventFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type Quote = {
  __typename?: 'Quote';
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
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
  /** Id of the payment pointer under which this quote was created */
  paymentPointerId: Scalars['ID']['output'];
  /** Amount to receive (fixed receive) */
  receiveAmount: Amount;
  /** Payment pointer URL of the receiver */
  receiver: Scalars['String']['output'];
  /** Amount to send (fixed send) */
  sendAmount: Amount;
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
  /** The maximum amount that should be paid into the payment pointer under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Additional metadata associated with the incoming payment. */
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  /** Payment pointer URL under which the incoming payment was created */
  paymentPointerUrl: Scalars['String']['output'];
  /** The total amount that has been paid into the payment pointer under this incoming payment. */
  receivedAmount: Amount;
  /** Date-time of last update */
  updatedAt: Scalars['String']['output'];
};

export type RevokePaymentPointerKeyInput = {
  /** Internal id of key */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
};

export type RevokePaymentPointerKeyMutationResponse = MutationResponse & {
  __typename?: 'RevokePaymentPointerKeyMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  paymentPointerKey?: Maybe<PaymentPointerKey>;
  success: Scalars['Boolean']['output'];
};

export type TransferMutationResponse = MutationResponse & {
  __typename?: 'TransferMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type TriggerPaymentPointerEventsInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of events being triggered (n). */
  limit: Scalars['Int']['input'];
};

export type TriggerPaymentPointerEventsMutationResponse = MutationResponse & {
  __typename?: 'TriggerPaymentPointerEventsMutationResponse';
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
  /** New minimum amount of liquidity that can be withdrawn from the asset */
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']['input']>;
};

export type UpdatePaymentPointerInput = {
  /** ID of payment pointer to update */
  id: Scalars['ID']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** New public name for payment pointer */
  publicName?: InputMaybe<Scalars['String']['input']>;
  /** New status to set the payment pointer to */
  status?: InputMaybe<PaymentPointerStatus>;
};

export type UpdatePaymentPointerMutationResponse = MutationResponse & {
  __typename?: 'UpdatePaymentPointerMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  paymentPointer?: Maybe<PaymentPointer>;
  success: Scalars['Boolean']['output'];
};

export type UpdatePeerInput = {
  /** New peering connection details */
  http?: InputMaybe<HttpInput>;
  /** Peer id */
  id: Scalars['String']['input'];
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
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

export type VoidLiquidityWithdrawalInput = {
  /** Unique key to ensure duplicate or retried requests are processed only once. See [idempotence](https://en.wikipedia.org/wiki/Idempotence) */
  idempotencyKey: Scalars['String']['input'];
  /** The id of the liquidity withdrawal to void. */
  withdrawalId: Scalars['String']['input'];
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


export type CreateIncomingPaymentMutation = { __typename?: 'Mutation', createIncomingPayment: { __typename?: 'IncomingPaymentResponse', code: string, message?: string | null, success: boolean, payment?: { __typename?: 'IncomingPayment', createdAt: string, metadata?: any | null, expiresAt: string, id: string, paymentPointerId: string, state: IncomingPaymentState, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

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


export type CreateOutgoingPaymentMutation = { __typename?: 'Mutation', createOutgoingPayment: { __typename?: 'OutgoingPaymentResponse', code: string, message?: string | null, success: boolean, payment?: { __typename?: 'OutgoingPayment', createdAt: string, metadata?: any | null, error?: string | null, id: string, paymentPointerId: string, receiver: string, state: OutgoingPaymentState, stateAttempts: number, quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, highEstimatedExchangeRate: number, id: string, lowEstimatedExchangeRate: number, maxPacketAmount: bigint, minExchangeRate: number, paymentPointerId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sendAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sendAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sentAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type CreatePaymentPointerKeyMutationVariables = Exact<{
  input: CreatePaymentPointerKeyInput;
}>;


export type CreatePaymentPointerKeyMutation = { __typename?: 'Mutation', createPaymentPointerKey?: { __typename?: 'CreatePaymentPointerKeyMutationResponse', code: string, message: string, success: boolean, paymentPointerKey?: { __typename?: 'PaymentPointerKey', id: string, paymentPointerId: string, revoked: boolean, createdAt: string, jwk: { __typename?: 'Jwk', alg: Alg, crv: Crv, kid: string, kty: Kty, x: string } } | null } | null };

export type RevokePaymentPointerKeyMutationVariables = Exact<{
  input: RevokePaymentPointerKeyInput;
}>;


export type RevokePaymentPointerKeyMutation = { __typename?: 'Mutation', revokePaymentPointerKey?: { __typename?: 'RevokePaymentPointerKeyMutationResponse', code: string, message: string, success: boolean, paymentPointerKey?: { __typename?: 'PaymentPointerKey', id: string, revoked: boolean, paymentPointerId: string, createdAt: string } | null } | null };

export type CreatePaymentPointerMutationVariables = Exact<{
  input: CreatePaymentPointerInput;
}>;


export type CreatePaymentPointerMutation = { __typename?: 'Mutation', createPaymentPointer: { __typename?: 'CreatePaymentPointerMutationResponse', code: string, success: boolean, message: string, paymentPointer?: { __typename?: 'PaymentPointer', id: string, url: string, publicName?: string | null } | null } };

export type UpdatePaymentPointerMutationVariables = Exact<{
  input: UpdatePaymentPointerInput;
}>;


export type UpdatePaymentPointerMutation = { __typename?: 'Mutation', updatePaymentPointer: { __typename?: 'UpdatePaymentPointerMutationResponse', code: string, success: boolean, message: string } };

export type CreateQuoteMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;


export type CreateQuoteMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'QuoteResponse', code: string, message?: string | null, quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, highEstimatedExchangeRate: number, id: string, lowEstimatedExchangeRate: number, maxPacketAmount: bigint, minExchangeRate: number, paymentPointerId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sendAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type GetQuoteQueryVariables = Exact<{
  quoteId: Scalars['String']['input'];
}>;


export type GetQuoteQuery = { __typename?: 'Query', quote?: { __typename?: 'Quote', id: string, paymentPointerId: string, receiver: string, maxPacketAmount: bigint, minExchangeRate: number, lowEstimatedExchangeRate: number, highEstimatedExchangeRate: number, createdAt: string, expiresAt: string, sendAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number }, receiveAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number } } | null };

export type CreateReceiverMutationVariables = Exact<{
  input: CreateReceiverInput;
}>;


export type CreateReceiverMutation = { __typename?: 'Mutation', createReceiver: { __typename?: 'CreateReceiverResponse', code: string, message?: string | null, success: boolean, receiver?: { __typename?: 'Receiver', createdAt: string, metadata?: any | null, expiresAt?: string | null, id: string, paymentPointerUrl: string, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };
