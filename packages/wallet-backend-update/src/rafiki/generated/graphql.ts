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
  assetCode: Scalars['String'];
  assetScale: Scalars['UInt8'];
  value: Scalars['BigInt'];
};

export type AmountInput = {
  assetCode: Scalars['String'];
  assetScale: Scalars['UInt8'];
  value: Scalars['BigInt'];
};

export type Asset = Model & {
  __typename?: 'Asset';
  code: Scalars['String'];
  createdAt: Scalars['String'];
  id: Scalars['ID'];
  scale: Scalars['UInt8'];
  withdrawalThreshold?: Maybe<Scalars['BigInt']>;
};

export type AssetEdge = {
  __typename?: 'AssetEdge';
  cursor: Scalars['String'];
  node: Asset;
};

export type AssetInput = {
  code: Scalars['String'];
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
  code: Scalars['String'];
  scale: Scalars['UInt8'];
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
  description?: InputMaybe<Scalars['String']>;
  expiresAt?: InputMaybe<Scalars['String']>;
  externalRef?: InputMaybe<Scalars['String']>;
  incomingAmount?: InputMaybe<AmountInput>;
  paymentPointerId: Scalars['String'];
};

export type CreateOutgoingPaymentInput = {
  description?: InputMaybe<Scalars['String']>;
  externalRef?: InputMaybe<Scalars['String']>;
  paymentPointerId: Scalars['String'];
  quoteId: Scalars['String'];
};

export type CreatePaymentPointerInput = {
  assetId: Scalars['String'];
  publicName?: InputMaybe<Scalars['String']>;
  url: Scalars['String'];
};

export type CreatePaymentPointerKeyInput = {
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
  assetId: Scalars['String'];
  http: HttpInput;
  maxPacketAmount?: InputMaybe<Scalars['BigInt']>;
  name?: InputMaybe<Scalars['String']>;
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
  paymentPointerId: Scalars['String'];
  receiveAmount?: InputMaybe<AmountInput>;
  receiver: Scalars['String'];
  sendAmount?: InputMaybe<AmountInput>;
};

export type CreateReceiverInput = {
  description?: InputMaybe<Scalars['String']>;
  expiresAt?: InputMaybe<Scalars['String']>;
  externalRef?: InputMaybe<Scalars['String']>;
  incomingAmount?: InputMaybe<AmountInput>;
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
  outgoing: HttpOutgoing;
};

export type HttpIncomingInput = {
  authTokens: Array<Scalars['String']>;
};

export type HttpInput = {
  incoming?: InputMaybe<HttpIncomingInput>;
  outgoing: HttpOutgoingInput;
};

export type HttpOutgoing = {
  __typename?: 'HttpOutgoing';
  authToken: Scalars['String'];
  endpoint: Scalars['String'];
};

export type HttpOutgoingInput = {
  authToken: Scalars['String'];
  endpoint: Scalars['String'];
};

export type IncomingPayment = Model & {
  __typename?: 'IncomingPayment';
  createdAt: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  expiresAt: Scalars['String'];
  externalRef?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  incomingAmount?: Maybe<Amount>;
  paymentPointerId: Scalars['ID'];
  receivedAmount: Amount;
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
  alg: Alg;
  crv: Crv;
  kid: Scalars['String'];
  kty: Kty;
  x: Scalars['String'];
};

export type JwkInput = {
  alg: Alg;
  crv: Crv;
  kid: Scalars['String'];
  kty: Kty;
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
  /** Create asset */
  createAsset: AssetMutationResponse;
  /** Create liquidity withdrawal from asset */
  createAssetLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an internal Open Payments Incoming Payment */
  createIncomingPayment: IncomingPaymentResponse;
  /** Create an Open Payments Outgoing Payment */
  createOutgoingPayment: OutgoingPaymentResponse;
  /** Create payment pointer */
  createPaymentPointer: CreatePaymentPointerMutationResponse;
  /** Create payment pointer key */
  createPaymentPointerKey?: Maybe<CreatePaymentPointerKeyMutationResponse>;
  /** Create liquidity withdrawal from Open Payments payment pointer */
  createPaymentPointerWithdrawal?: Maybe<PaymentPointerWithdrawalMutationResponse>;
  /** Create peer */
  createPeer: CreatePeerMutationResponse;
  /** Create liquidity withdrawal from peer */
  createPeerLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Create an Open Payments Quote */
  createQuote: QuoteResponse;
  /** Create an external Open Payments Incoming Payment */
  createReceiver: CreateReceiverResponse;
  /** Delete peer */
  deletePeer: DeletePeerMutationResponse;
  /** Deposit webhook event liquidity */
  depositEventLiquidity?: Maybe<LiquidityMutationResponse>;
  /** Posts liquidity withdrawal */
  postLiquidityWithdrawal?: Maybe<LiquidityMutationResponse>;
  /** Revoke request signing key */
  revokePaymentPointerKey?: Maybe<RevokePaymentPointerKeyMutationResponse>;
  triggerPaymentPointerEvents: TriggerPaymentPointerEventsMutationResponse;
  /** Update asset withdrawal threshold */
  updateAssetWithdrawalThreshold: AssetMutationResponse;
  /** Update peer */
  updatePeer: UpdatePeerMutationResponse;
  /** Void liquidity withdrawal */
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
  createdAt: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  error?: Maybe<Scalars['String']>;
  externalRef?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  paymentPointerId: Scalars['ID'];
  quote?: Maybe<Quote>;
  receiveAmount: Amount;
  receiver: Scalars['String'];
  sendAmount: Amount;
  sentAmount: Amount;
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
  asset: Asset;
  createdAt: Scalars['String'];
  id: Scalars['ID'];
  incomingPayments?: Maybe<IncomingPaymentConnection>;
  outgoingPayments?: Maybe<OutgoingPaymentConnection>;
  publicName?: Maybe<Scalars['String']>;
  quotes?: Maybe<QuoteConnection>;
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
  createdAt: Scalars['String'];
  id: Scalars['ID'];
  jwk: Jwk;
  paymentPointerId: Scalars['ID'];
  revoked: Scalars['Boolean'];
};

export type PaymentPointerWithdrawal = {
  __typename?: 'PaymentPointerWithdrawal';
  amount: Scalars['BigInt'];
  id: Scalars['ID'];
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
  asset: Asset;
  createdAt: Scalars['String'];
  http: Http;
  id: Scalars['ID'];
  maxPacketAmount?: Maybe<Scalars['BigInt']>;
  name?: Maybe<Scalars['String']>;
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
  createdAt: Scalars['String'];
  expiresAt: Scalars['String'];
  highEstimatedExchangeRate: Scalars['Float'];
  id: Scalars['ID'];
  lowEstimatedExchangeRate: Scalars['Float'];
  maxPacketAmount: Scalars['BigInt'];
  minExchangeRate: Scalars['Float'];
  paymentPointerId: Scalars['ID'];
  receiveAmount: Amount;
  receiver: Scalars['String'];
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
  completed: Scalars['Boolean'];
  createdAt: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  externalRef?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  incomingAmount?: Maybe<Amount>;
  paymentPointerUrl: Scalars['String'];
  receivedAmount: Amount;
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
  count?: Maybe<Scalars['Int']>;
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type UpdateAssetInput = {
  id: Scalars['String'];
  withdrawalThreshold?: InputMaybe<Scalars['BigInt']>;
};

export type UpdatePeerInput = {
  http?: InputMaybe<HttpInput>;
  id: Scalars['String'];
  maxPacketAmount?: InputMaybe<Scalars['BigInt']>;
  name?: InputMaybe<Scalars['String']>;
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

export type WithdrawLiquidityMutationVariables = Exact<{
  eventId: Scalars['String'];
}>;


export type WithdrawLiquidityMutation = { __typename?: 'Mutation', withdrawEventLiquidity?: { __typename?: 'LiquidityMutationResponse', code: string, success: boolean, message: string, error?: LiquidityError | null } | null };

export type DepositLiquidityMutationVariables = Exact<{
  eventId: Scalars['String'];
}>;


export type DepositLiquidityMutation = { __typename?: 'Mutation', depositEventLiquidity?: { __typename?: 'LiquidityMutationResponse', code: string, success: boolean, message: string, error?: LiquidityError | null } | null };
export type CreateIncomingPaymentMutationVariables = Exact<{
  input: CreateIncomingPaymentInput;
}>;


export type CreateIncomingPaymentMutation = { __typename?: 'Mutation', createIncomingPayment: { __typename?: 'IncomingPaymentResponse', code: string, message?: string | null, success: boolean, payment?: { __typename?: 'IncomingPayment', createdAt: string, description?: string | null, expiresAt: string, externalRef?: string | null, id: string, paymentPointerId: string, state: IncomingPaymentState, incomingAmount?: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } | null, receivedAmount: { __typename?: 'Amount', assetCode: string, assetScale: number, value: bigint } } | null } };

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
