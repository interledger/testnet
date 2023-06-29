export type Maybe<T> = T | null;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigInt: bigint;
  UInt8: number;
};

export type AddAssetLiquidityInput = {
  /** Amount of liquidity to add. */
  amount: Scalars['BigInt'];
  /** The id of the asset to add liquidity. */
  assetId: Scalars['String'];
  /** The id of the transfer. */
  id: Scalars['String'];
};

export type AddPeerLiquidityInput = {
  /** Amount of liquidity to add. */
  amount: Scalars['BigInt'];
  /** The id of the transfer. */
  id: Scalars['String'];
  /** The id of the peer to add liquidity. */
  peerId: Scalars['String'];
};

export enum Alg {
  EdDsa = 'EdDSA'
}

export type Amount = {
  __typename?: 'Amount';
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  assetCode: Scalars['String'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  assetScale: Scalars['UInt8'];
  value: Scalars['BigInt'];
};

export type AmountInput = {
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  assetCode: Scalars['String'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  assetScale: Scalars['UInt8'];
  value: Scalars['BigInt'];
};

export type Asset = Model & {
  __typename?: 'Asset';
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  code: Scalars['String'];
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Asset id */
  id: Scalars['ID'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  scale: Scalars['UInt8'];
  /** Minimum amount of liquidity that can be withdrawn from the asset */
  withdrawalThreshold?: Maybe<Scalars['BigInt']>;
};

export type AssetEdge = {
  __typename?: 'AssetEdge';
  cursor: Scalars['String'];
  node: Asset;
};

export type AssetInput = {
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  code: Scalars['String'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  scale: Scalars['UInt8'];
};

export type AssetMutationResponse = MutationResponse & {
  __typename?: 'AssetMutationResponse';
  asset?: Maybe<Asset>;
  code: Scalars['String'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type AssetsConnection = {
  __typename?: 'AssetsConnection';
  edges: Array<AssetEdge>;
  pageInfo: PageInfo;
};

export type CreateAssetInput = {
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  code: Scalars['String'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  scale: Scalars['UInt8'];
  /** Minimum amount of liquidity that can be withdrawn from the asset */
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']>;
};

export type CreateAssetLiquidityWithdrawalInput = {
  /** Amount of withdrawal. */
  amount: Scalars['BigInt'];
  /** The id of the asset to create the withdrawal for. */
  assetId: Scalars['String'];
  /** The id of the withdrawal. */
  id: Scalars['String'];
};

export type CreateIncomingPaymentInput = {
  /** Human readable description of the incoming payment. */
  description?: InputMaybe<Scalars['String']>;
  /** Expiration date-time */
  expiresAt?: InputMaybe<Scalars['String']>;
  /** A reference that can be used by external systems to reconcile this payment with their systems. E.g. an invoice number. */
  externalRef?: InputMaybe<Scalars['String']>;
  /** Maximum amount to be received */
  incomingAmount?: InputMaybe<AmountInput>;
  /** Id of the payment pointer under which the incoming payment will be created */
  paymentPointerId: Scalars['String'];
};

export type CreateOutgoingPaymentInput = {
  /** Human readable description of the outgoing payment. */
  description?: InputMaybe<Scalars['String']>;
  /** A reference that can be used by external systems to reconcile this payment with their systems. E.g. an invoice number. */
  externalRef?: InputMaybe<Scalars['String']>;
  /** Id of the payment pointer under which the outgoing payment will be created */
  paymentPointerId: Scalars['String'];
  /** Id of the corresponding quote for that outgoing payment */
  quoteId: Scalars['String'];
};

export type CreatePaymentPointerInput = {
  /** Asset of the payment pointer */
  assetId: Scalars['String'];
  /** Public name associated with the payment pointer */
  publicName?: InputMaybe<Scalars['String']>;
  /** Payment Pointer URL */
  url: Scalars['String'];
};

export type CreatePaymentPointerKeyInput = {
  /** Public key */
  jwk: JwkInput;
  paymentPointerId: Scalars['String'];
};

export type CreatePaymentPointerKeyMutationResponse = MutationResponse & {
  __typename?: 'CreatePaymentPointerKeyMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  paymentPointerKey?: Maybe<PaymentPointerKey>;
  success: Scalars['Boolean'];
};

export type CreatePaymentPointerMutationResponse = MutationResponse & {
  __typename?: 'CreatePaymentPointerMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  paymentPointer?: Maybe<PaymentPointer>;
  success: Scalars['Boolean'];
};

export type CreatePaymentPointerWithdrawalInput = {
  /** The id of the withdrawal. */
  id: Scalars['String'];
  /** The id of the Open Payments payment pointer to create the withdrawal for. */
  paymentPointerId: Scalars['String'];
};

export type CreatePeerInput = {
  /** Asset id of peering relationship */
  assetId: Scalars['String'];
  /** Peering connection details */
  http: HttpInput;
  /** Maximum packet amount that the peer accepts */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']>;
  /** Peer's internal name */
  name?: InputMaybe<Scalars['String']>;
  /** Peer's ILP address */
  staticIlpAddress: Scalars['String'];
};

export type CreatePeerLiquidityWithdrawalInput = {
  /** Amount of withdrawal. */
  amount: Scalars['BigInt'];
  /** The id of the withdrawal. */
  id: Scalars['String'];
  /** The id of the peer to create the withdrawal for. */
  peerId: Scalars['String'];
};

export type CreatePeerMutationResponse = MutationResponse & {
  __typename?: 'CreatePeerMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  peer?: Maybe<Peer>;
  success: Scalars['Boolean'];
};

export type CreateQuoteInput = {
  /** Id of the payment pointer under which the quote will be created */
  paymentPointerId: Scalars['String'];
  /** Amount to receive (fixed receive) */
  receiveAmount?: InputMaybe<AmountInput>;
  /** Payment pointer URL of the receiver */
  receiver: Scalars['String'];
  /** Amount to send (fixed send) */
  sendAmount?: InputMaybe<AmountInput>;
};

export type CreateReceiverInput = {
  /** Human readable description of the incoming payment. */
  description?: InputMaybe<Scalars['String']>;
  /** Expiration date-time */
  expiresAt?: InputMaybe<Scalars['String']>;
  /** A reference that can be used by external systems to reconcile this payment with their systems. E.g. an invoice number. */
  externalRef?: InputMaybe<Scalars['String']>;
  /** Maximum amount to be received */
  incomingAmount?: InputMaybe<AmountInput>;
  /** Receiving payment pointer URL */
  paymentPointerUrl: Scalars['String'];
};

export type CreateReceiverResponse = {
  __typename?: 'CreateReceiverResponse';
  code: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  receiver?: Maybe<Receiver>;
  success: Scalars['Boolean'];
};

export enum Crv {
  Ed25519 = 'Ed25519'
}

export type DeletePeerMutationResponse = MutationResponse & {
  __typename?: 'DeletePeerMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type Http = {
  __typename?: 'Http';
  /** Outgoing connection details */
  outgoing: HttpOutgoing;
};

export type HttpIncomingInput = {
  /** Array of auth tokens accepted by this Rafiki instance */
  authTokens: Array<Scalars['String']>;
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
  authToken: Scalars['String'];
  /** Peer's connection endpoint */
  endpoint: Scalars['String'];
};

export type HttpOutgoingInput = {
  /** Auth token to present at the peering Rafiki instance */
  authToken: Scalars['String'];
  /** Peer's connection endpoint */
  endpoint: Scalars['String'];
};

export type IncomingPayment = Model & {
  __typename?: 'IncomingPayment';
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Human readable description of the incoming payment. */
  description?: Maybe<Scalars['String']>;
  /** Date-time of expiry. After this time, the incoming payment will not accept further payments made to it. */
  expiresAt: Scalars['String'];
  /** A reference that can be used by external systems to reconcile this payment with their systems. E.g. an invoice number. */
  externalRef?: Maybe<Scalars['String']>;
  /** Incoming Payment id */
  id: Scalars['ID'];
  /** The maximum amount that should be paid into the payment pointer under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Id of the payment pointer under which this incoming payment was created */
  paymentPointerId: Scalars['ID'];
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
  cursor: Scalars['String'];
  node: IncomingPayment;
};

export type IncomingPaymentResponse = {
  __typename?: 'IncomingPaymentResponse';
  code: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  payment?: Maybe<IncomingPayment>;
  success: Scalars['Boolean'];
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
  kid: Scalars['String'];
  /** Key type. The only allowed value is `OKP`. */
  kty: Kty;
  /** Base64 url-encoded public key. */
  x: Scalars['String'];
};

export type JwkInput = {
  /** Cryptographic algorithm family used with the key. The only allowed value is `EdDSA`. */
  alg: Alg;
  /** Curve that the key pair is derived from. The only allowed value is `Ed25519`. */
  crv: Crv;
  /** Key id */
  kid: Scalars['String'];
  /** Key type. The only allowed value is `OKP`. */
  kty: Kty;
  /** Base64 url-encoded public key. */
  x: Scalars['String'];
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
  code: Scalars['String'];
  error?: Maybe<LiquidityError>;
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type Model = {
  createdAt: Scalars['String'];
  id: Scalars['ID'];
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
  id: Scalars['String'];
};


export type MutationDepositEventLiquidityArgs = {
  eventId: Scalars['String'];
};


export type MutationPostLiquidityWithdrawalArgs = {
  withdrawalId: Scalars['String'];
};


export type MutationRevokePaymentPointerKeyArgs = {
  id: Scalars['String'];
};


export type MutationTriggerPaymentPointerEventsArgs = {
  limit: Scalars['Int'];
};


export type MutationUpdateAssetWithdrawalThresholdArgs = {
  input: UpdateAssetInput;
};


export type MutationUpdatePeerArgs = {
  input: UpdatePeerInput;
};


export type MutationVoidLiquidityWithdrawalArgs = {
  withdrawalId: Scalars['String'];
};


export type MutationWithdrawEventLiquidityArgs = {
  eventId: Scalars['String'];
};

export type MutationResponse = {
  code: Scalars['String'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type OutgoingPayment = Model & {
  __typename?: 'OutgoingPayment';
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Human readable description of the outgoing payment. */
  description?: Maybe<Scalars['String']>;
  error?: Maybe<Scalars['String']>;
  /** A reference that can be used by external systems to reconcile this payment with their systems. E.g. an invoice number. */
  externalRef?: Maybe<Scalars['String']>;
  /** Outgoing payment id */
  id: Scalars['ID'];
  /** Id of the payment pointer under which this outgoing payment was created */
  paymentPointerId: Scalars['ID'];
  /** Quote for this outgoing payment */
  quote?: Maybe<Quote>;
  /** Amount to receive (fixed receive) */
  receiveAmount: Amount;
  /** Payment pointer URL of the receiver */
  receiver: Scalars['String'];
  /** Amount to send (fixed send) */
  sendAmount: Amount;
  /** Amount already sent */
  sentAmount: Amount;
  /** Outgoing payment state */
  state: OutgoingPaymentState;
  stateAttempts: Scalars['Int'];
};

export type OutgoingPaymentConnection = {
  __typename?: 'OutgoingPaymentConnection';
  edges: Array<OutgoingPaymentEdge>;
  pageInfo: PageInfo;
};

export type OutgoingPaymentEdge = {
  __typename?: 'OutgoingPaymentEdge';
  cursor: Scalars['String'];
  node: OutgoingPayment;
};

export type OutgoingPaymentResponse = {
  __typename?: 'OutgoingPaymentResponse';
  code: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  payment?: Maybe<OutgoingPayment>;
  success: Scalars['Boolean'];
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
  endCursor?: Maybe<Scalars['String']>;
  /** Paginating forwards: Are there more pages? */
  hasNextPage: Scalars['Boolean'];
  /** Paginating backwards: Are there more pages? */
  hasPreviousPage: Scalars['Boolean'];
  /** Paginating backwards: the cursor to continue. */
  startCursor?: Maybe<Scalars['String']>;
};

export type PaymentPointer = Model & {
  __typename?: 'PaymentPointer';
  /** Asset of the payment pointer */
  asset: Asset;
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Payment pointer id */
  id: Scalars['ID'];
  /** List of incoming payments received by this payment pointer */
  incomingPayments?: Maybe<IncomingPaymentConnection>;
  /** List of outgoing payments sent from this payment pointer */
  outgoingPayments?: Maybe<OutgoingPaymentConnection>;
  /** Public name associated with the payment pointer */
  publicName?: Maybe<Scalars['String']>;
  /** List of quotes created at this payment pointer */
  quotes?: Maybe<QuoteConnection>;
  /** Payment Pointer URL */
  url: Scalars['String'];
};


export type PaymentPointerIncomingPaymentsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type PaymentPointerOutgoingPaymentsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type PaymentPointerQuotesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type PaymentPointerKey = Model & {
  __typename?: 'PaymentPointerKey';
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Internal id of key */
  id: Scalars['ID'];
  /** Public key */
  jwk: Jwk;
  /** Id of the payment pointer to which this key belongs to */
  paymentPointerId: Scalars['ID'];
  /** Indicator whether the key has been revoked */
  revoked: Scalars['Boolean'];
};

export type PaymentPointerWithdrawal = {
  __typename?: 'PaymentPointerWithdrawal';
  /** Amount to withdraw */
  amount: Scalars['BigInt'];
  /** Withdrawal Id */
  id: Scalars['ID'];
  /** Payment pointer details */
  paymentPointer: PaymentPointer;
};

export type PaymentPointerWithdrawalMutationResponse = MutationResponse & {
  __typename?: 'PaymentPointerWithdrawalMutationResponse';
  code: Scalars['String'];
  error?: Maybe<LiquidityError>;
  message: Scalars['String'];
  success: Scalars['Boolean'];
  withdrawal?: Maybe<PaymentPointerWithdrawal>;
};

export type Peer = Model & {
  __typename?: 'Peer';
  /** Asset of peering relationship */
  asset: Asset;
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Peering connection details */
  http: Http;
  /** Peer id */
  id: Scalars['ID'];
  /** Maximum packet amount that the peer accepts */
  maxPacketAmount?: Maybe<Scalars['BigInt']>;
  /** Peer's public name */
  name?: Maybe<Scalars['String']>;
  /** Peer's ILP address */
  staticIlpAddress: Scalars['String'];
};

export type PeerEdge = {
  __typename?: 'PeerEdge';
  cursor: Scalars['String'];
  node: Peer;
};

export type PeersConnection = {
  __typename?: 'PeersConnection';
  edges: Array<PeerEdge>;
  pageInfo: PageInfo;
};

export type Query = {
  __typename?: 'Query';
  /** Fetch an asset */
  asset?: Maybe<Asset>;
  /** Fetch a page of assets. */
  assets: AssetsConnection;
  /** Fetch an Open Payments outgoing payment */
  outgoingPayment?: Maybe<OutgoingPayment>;
  /** Fetch a payment pointer */
  paymentPointer?: Maybe<PaymentPointer>;
  /** Fetch a peer */
  peer?: Maybe<Peer>;
  /** Fetch a page of peers. */
  peers: PeersConnection;
  /** Fetch an Open Payments quote */
  quote?: Maybe<Quote>;
};


export type QueryAssetArgs = {
  id: Scalars['String'];
};


export type QueryAssetsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type QueryOutgoingPaymentArgs = {
  id: Scalars['String'];
};


export type QueryPaymentPointerArgs = {
  id: Scalars['String'];
};


export type QueryPeerArgs = {
  id: Scalars['String'];
};


export type QueryPeersArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type QueryQuoteArgs = {
  id: Scalars['String'];
};

export type Quote = {
  __typename?: 'Quote';
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Date-time of expiration */
  expiresAt: Scalars['String'];
  /** Upper bound of probed exchange rate */
  highEstimatedExchangeRate: Scalars['Float'];
  /** Quote id */
  id: Scalars['ID'];
  /** Lower bound of probed exchange rate */
  lowEstimatedExchangeRate: Scalars['Float'];
  /** Maximum value per packet allowed on the possible routes */
  maxPacketAmount: Scalars['BigInt'];
  /** Aggregate exchange rate the payment is guaranteed to meet */
  minExchangeRate: Scalars['Float'];
  /** Id of the payment pointer under which this quote was created */
  paymentPointerId: Scalars['ID'];
  /** Amount to receive (fixed receive) */
  receiveAmount: Amount;
  /** Payment pointer URL of the receiver */
  receiver: Scalars['String'];
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
  cursor: Scalars['String'];
  node: Quote;
};

export type QuoteResponse = {
  __typename?: 'QuoteResponse';
  code: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  quote?: Maybe<Quote>;
  success: Scalars['Boolean'];
};

export type Receiver = {
  __typename?: 'Receiver';
  /** Describes whether the incoming payment has completed receiving funds. */
  completed: Scalars['Boolean'];
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Human readable description of the incoming payment. */
  description?: Maybe<Scalars['String']>;
  /** Date-time of expiry. After this time, the incoming payment will accept further payments made to it. */
  expiresAt?: Maybe<Scalars['String']>;
  /** A reference that can be used by external systems to reconcile this payment with their systems. E.g. an invoice number. */
  externalRef?: Maybe<Scalars['String']>;
  /** Incoming payment URL */
  id: Scalars['String'];
  /** The maximum amount that should be paid into the payment pointer under this incoming payment. */
  incomingAmount?: Maybe<Amount>;
  /** Payment pointer URL under which the incoming payment was created */
  paymentPointerUrl: Scalars['String'];
  /** The total amount that has been paid into the payment pointer under this incoming payment. */
  receivedAmount: Amount;
  /** Date-time of last update */
  updatedAt: Scalars['String'];
};

export type RevokePaymentPointerKeyMutationResponse = MutationResponse & {
  __typename?: 'RevokePaymentPointerKeyMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  paymentPointerKey?: Maybe<PaymentPointerKey>;
  success: Scalars['Boolean'];
};

export type TransferMutationResponse = MutationResponse & {
  __typename?: 'TransferMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type TriggerPaymentPointerEventsMutationResponse = MutationResponse & {
  __typename?: 'TriggerPaymentPointerEventsMutationResponse';
  code: Scalars['String'];
  /** Number of events triggered */
  count?: Maybe<Scalars['Int']>;
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type UpdateAssetInput = {
  /** Asset id */
  id: Scalars['String'];
  /** New minimum amount of liquidity that can be withdrawn from the asset */
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']>;
};

export type UpdatePeerInput = {
  /** New peering connection details */
  http?: InputMaybe<HttpInput>;
  /** Peer id */
  id: Scalars['String'];
  /** New maximum packet amount that the peer accepts */
  maxPacketAmount?: InputMaybe<Scalars['BigInt']>;
  /** Peer's new public name */
  name?: InputMaybe<Scalars['String']>;
  /** Peer's new ILP address */
  staticIlpAddress?: InputMaybe<Scalars['String']>;
};

export type UpdatePeerMutationResponse = MutationResponse & {
  __typename?: 'UpdatePeerMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  peer?: Maybe<Peer>;
  success: Scalars['Boolean'];
};

export type CreateAssetMutationVariables = Exact<{
  input: CreateAssetInput;
}>;


export type CreateAssetMutation = { __typename?: 'Mutation', createAsset: { __typename?: 'AssetMutationResponse', code: string, success: boolean, message: string, asset?: { __typename?: 'Asset', id: string, code: string, scale: number } | null } };

export type GetAssetsQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
}>;


export type GetAssetsQuery = { __typename?: 'Query', assets: { __typename?: 'AssetsConnection', edges: Array<{ __typename?: 'AssetEdge', cursor: string, node: { __typename?: 'Asset', code: string, createdAt: string, id: string, scale: number, withdrawalThreshold?: bigint | null } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetAssetQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetAssetQuery = { __typename?: 'Query', asset?: { __typename?: 'Asset', code: string, createdAt: string, id: string, scale: number, withdrawalThreshold?: bigint | null } | null };

export type CreateIncomingPaymentMutationVariables = Exact<{
  input: CreateIncomingPaymentInput;
}>;


export type CreateIncomingPaymentMutation = { __typename?: 'Mutation', createIncomingPayment: { __typename?: 'IncomingPaymentResponse', code: string, message?: string | null, success: boolean, payment?: { __typename?: 'IncomingPayment', createdAt: string, description?: string | null, expiresAt: string, externalRef?: string | null, id: string, paymentPointerId: string, state: IncomingPaymentState, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type WithdrawLiquidityMutationVariables = Exact<{
  eventId: Scalars['String'];
}>;


export type WithdrawLiquidityMutation = { __typename?: 'Mutation', withdrawEventLiquidity?: { __typename?: 'LiquidityMutationResponse', code: string, success: boolean, message: string, error?: LiquidityError | null } | null };

export type DepositLiquidityMutationVariables = Exact<{
  eventId: Scalars['String'];
}>;


export type DepositLiquidityMutation = { __typename?: 'Mutation', depositEventLiquidity?: { __typename?: 'LiquidityMutationResponse', code: string, success: boolean, message: string, error?: LiquidityError | null } | null };

export type CreateOutgoingPaymentMutationVariables = Exact<{
  input: CreateOutgoingPaymentInput;
}>;


export type CreateOutgoingPaymentMutation = { __typename?: 'Mutation', createOutgoingPayment: { __typename?: 'OutgoingPaymentResponse', code: string, message?: string | null, success: boolean, payment?: { __typename?: 'OutgoingPayment', createdAt: string, description?: string | null, error?: string | null, externalRef?: string | null, id: string, paymentPointerId: string, receiver: string, state: OutgoingPaymentState, stateAttempts: number, quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, highEstimatedExchangeRate: number, id: string, lowEstimatedExchangeRate: number, maxPacketAmount: bigint, minExchangeRate: number, paymentPointerId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sendAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sendAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sentAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type CreatePaymentPointerMutationVariables = Exact<{
  input: CreatePaymentPointerInput;
}>;


export type CreatePaymentPointerMutation = { __typename?: 'Mutation', createPaymentPointer: { __typename?: 'CreatePaymentPointerMutationResponse', code: string, success: boolean, message: string, paymentPointer?: { __typename?: 'PaymentPointer', id: string, url: string, publicName?: string | null } | null } };

export type CreateQuoteMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;

export type CreatePaymentPointerKeyMutationVariables = Exact<{
  input: CreatePaymentPointerKeyInput;
}>;

export type CreatePaymentPointerKeyMutation = { __typename?: 'Mutation', createPaymentPointerKey: { __typename?: 'CreatePaymentPointerKeyMutationResponse', code: string, success: boolean, message: string, paymentPointerKey?: { __typename?: 'PaymentPointerKey', id: string, paymentPointerId: string, revoked: boolean, jwk?: { __typename?: 'jwk', alg: "EdDSA", crv: "Ed25519", kid: string, kty: "OKP", x: string } } | null } };

export type CreateQuoteMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'QuoteResponse', code: string, message?: string | null, quote?: { __typename?: 'Quote', createdAt: string, expiresAt: string, highEstimatedExchangeRate: number, id: string, lowEstimatedExchangeRate: number, maxPacketAmount: bigint, minExchangeRate: number, paymentPointerId: string, receiver: string, receiveAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint }, sendAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

export type GetQuoteQueryVariables = Exact<{
  quoteId: Scalars['String'];
}>;


export type GetQuoteQuery = { __typename?: 'Query', quote?: { __typename?: 'Quote', id: string, paymentPointerId: string, receiver: string, maxPacketAmount: bigint, minExchangeRate: number, lowEstimatedExchangeRate: number, highEstimatedExchangeRate: number, createdAt: string, expiresAt: string, sendAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number }, receiveAmount: { __typename?: 'Amount', value: bigint, assetCode: string, assetScale: number } } | null };
