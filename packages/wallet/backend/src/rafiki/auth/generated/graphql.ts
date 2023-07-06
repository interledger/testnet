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
  UInt8: { input: number; output: number; }
};

export type Access = Model & {
  __typename?: 'Access';
  /** Access action (create, read, list or complete) */
  actions: Array<Maybe<Scalars['String']['output']>>;
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Access id */
  id: Scalars['ID']['output'];
  /** Payment pointer of a sub-resource (incoming payment, outgoing payment, or quote) */
  identifier?: Maybe<Scalars['String']['output']>;
  /** Payment limits */
  limits?: Maybe<LimitData>;
  /** Access type (incoming payment, outgoing payment, or quote) */
  type: Scalars['String']['output'];
};

export type FilterString = {
  in: Array<Scalars['String']['input']>;
};

export type Grant = Model & {
  __typename?: 'Grant';
  /** Access details */
  access: Array<Access>;
  /** Payment pointer of the grantee's account */
  client: Scalars['String']['output'];
  /** Date-time of creation */
  createdAt: Scalars['String']['output'];
  /** Grant id */
  id: Scalars['ID']['output'];
  /** State of the grant */
  state: GrantState;
};

export type GrantEdge = {
  __typename?: 'GrantEdge';
  cursor: Scalars['String']['output'];
  node: Grant;
};

export type GrantFilter = {
  identifier?: InputMaybe<FilterString>;
};

export enum GrantState {
  /** grant was approved */
  Granted = 'GRANTED',
  /** grant request was created but grant was not approved yet */
  Pending = 'PENDING',
  /** grant was rejected */
  Rejected = 'REJECTED',
  /** grant was revoked */
  Revoked = 'REVOKED'
}

export type GrantsConnection = {
  __typename?: 'GrantsConnection';
  edges: Array<GrantEdge>;
  pageInfo: PageInfo;
};

export type LimitData = {
  __typename?: 'LimitData';
  /** Interval between payments */
  interval?: Maybe<Scalars['String']['output']>;
  /** Amount to receive */
  receiveAmount?: Maybe<PaymentAmount>;
  /** Payment pointer URL of the receiver */
  receiver?: Maybe<Scalars['String']['output']>;
  /** Amount to send */
  sendAmount?: Maybe<PaymentAmount>;
};

export type Model = {
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Revoke Grant */
  revokeGrant: RevokeGrantMutationResponse;
};


export type MutationRevokeGrantArgs = {
  input: RevokeGrantInput;
};

export type MutationResponse = {
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

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

export type PaymentAmount = {
  __typename?: 'PaymentAmount';
  /** [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217), e.g. `USD` */
  assetCode: Scalars['String']['output'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit */
  assetScale: Scalars['UInt8']['output'];
  value: Scalars['BigInt']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Fetch a grant */
  grant: Grant;
  /** Fetch a page of grants. */
  grants: GrantsConnection;
};


export type QueryGrantArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGrantsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<GrantFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type RevokeGrantInput = {
  grantId: Scalars['String']['input'];
};

export type RevokeGrantMutationResponse = MutationResponse & {
  __typename?: 'RevokeGrantMutationResponse';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type GetGrantsQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  filter?: InputMaybe<GrantFilter>;
}>;


export type GetGrantsQuery = { __typename?: 'Query', grants: { __typename?: 'GrantsConnection', edges: Array<{ __typename?: 'GrantEdge', cursor: string, node: { __typename?: 'Grant', id: string, client: string, state: GrantState, createdAt: string, access: Array<{ __typename?: 'Access', id: string, identifier?: string | null, createdAt: string, actions: Array<string | null>, type: string, limits?: { __typename?: 'LimitData', receiver?: string | null, interval?: string | null, sendAmount?: { __typename?: 'PaymentAmount', value: bigint, assetCode: string, assetScale: number } | null, receiveAmount?: { __typename?: 'PaymentAmount', value: bigint, assetCode: string, assetScale: number } | null } | null }> } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetGrantQueryVariables = Exact<{
  grantId: Scalars['ID']['input'];
}>;


export type GetGrantQuery = { __typename?: 'Query', grant: { __typename?: 'Grant', id: string, client: string, state: GrantState, createdAt: string, access: Array<{ __typename?: 'Access', id: string, identifier?: string | null, createdAt: string, actions: Array<string | null>, type: string, limits?: { __typename?: 'LimitData', receiver?: string | null, interval?: string | null, sendAmount?: { __typename?: 'PaymentAmount', value: bigint, assetCode: string, assetScale: number } | null, receiveAmount?: { __typename?: 'PaymentAmount', value: bigint, assetCode: string, assetScale: number } | null } | null }> } };

export type RevokeGrantMutationVariables = Exact<{
  grantId: Scalars['String']['input'];
}>;


export type RevokeGrantMutation = { __typename?: 'Mutation', revokeGrant: { __typename?: 'RevokeGrantMutationResponse', code: string, success: boolean, message: string } };
