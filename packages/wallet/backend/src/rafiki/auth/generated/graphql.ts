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
  /** The `UInt8` scalar type represents unsigned 8-bit whole numeric values, ranging from 0 to 255. */
  UInt8: { input: number; output: number; }
  /** The `UInt64` scalar type represents unsigned 64-bit whole numeric values. It is capable of handling values that are larger than the JavaScript `Number` type limit (greater than 2^53). */
  UInt64: { input: any; output: any; }
};

export type Access = Model & {
  __typename?: 'Access';
  /** Actions allowed with this access. */
  actions: Array<Maybe<Scalars['String']['output']>>;
  /** The date and time when the access was created. */
  createdAt: Scalars['String']['output'];
  /** Unique identifier of the access object. */
  id: Scalars['ID']['output'];
  /** Wallet address of the sub-resource (incoming payment, outgoing payment, or quote). */
  identifier?: Maybe<Scalars['String']['output']>;
  /** Limits for an outgoing payment associated with this access. */
  limits?: Maybe<LimitData>;
  /** Type of access (incoming payment, outgoing payment, or quote). */
  type: Scalars['String']['output'];
};

export type FilterFinalizationReason = {
  /** List of finalization reasons to include in the filter. */
  in?: InputMaybe<Array<GrantFinalization>>;
  /** List of finalization reasons to exclude in the filter. */
  notIn?: InputMaybe<Array<GrantFinalization>>;
};

export type FilterGrantState = {
  /** List of states to include in the filter. */
  in?: InputMaybe<Array<GrantState>>;
  /** List of states to exclude in the filter. */
  notIn?: InputMaybe<Array<GrantState>>;
};

export type FilterString = {
  /** Array of strings to filter by. */
  in?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type Grant = Model & {
  __typename?: 'Grant';
  /** Details of the access provided by the grant. */
  access: Array<Access>;
  /** Wallet address of the grantee's account. */
  client: Scalars['String']['output'];
  /** The date and time when the grant was created. */
  createdAt: Scalars['String']['output'];
  /** Specific outcome of a finalized grant, indicating whether the grant was issued, revoked, or rejected. */
  finalizationReason?: Maybe<GrantFinalization>;
  /** Unique identifier of the grant. */
  id: Scalars['ID']['output'];
  /** Current state of the grant. */
  state: GrantState;
  /** Unique identifier of the tenant associated with the grant. */
  tenantId: Scalars['ID']['output'];
};

export type GrantEdge = {
  __typename?: 'GrantEdge';
  /** A cursor for paginating through the grants. */
  cursor: Scalars['String']['output'];
  /** A grant node in the list. */
  node: Grant;
};

export type GrantFilter = {
  /** Filter grants by their finalization reason. */
  finalizationReason?: InputMaybe<FilterFinalizationReason>;
  /** Filter grants by their unique identifier. */
  identifier?: InputMaybe<FilterString>;
  /** Filter grants by their state. */
  state?: InputMaybe<FilterGrantState>;
};

export enum GrantFinalization {
  /** The grant was issued successfully. */
  Issued = 'ISSUED',
  /** The grant request was rejected. */
  Rejected = 'REJECTED',
  /** The grant was revoked. */
  Revoked = 'REVOKED'
}

export enum GrantState {
  /** The grant request has been approved. */
  Approved = 'APPROVED',
  /** The grant request has been finalized, and no more access tokens or interactions can be made. */
  Finalized = 'FINALIZED',
  /** The grant request is awaiting interaction. */
  Pending = 'PENDING',
  /** The grant request is processing. */
  Processing = 'PROCESSING'
}

export type GrantsConnection = {
  __typename?: 'GrantsConnection';
  /** A list of edges representing grants and cursors for pagination. */
  edges: Array<GrantEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

export type LimitData = {
  __typename?: 'LimitData';
  /** Amount to debit. */
  debitAmount?: Maybe<PaymentAmount>;
  /** Interval between payments. */
  interval?: Maybe<Scalars['String']['output']>;
  /** Amount to receive. */
  receiveAmount?: Maybe<PaymentAmount>;
  /** Wallet address URL of the receiver. */
  receiver?: Maybe<Scalars['String']['output']>;
};

export type Model = {
  /** The date and time when the model was created. */
  createdAt: Scalars['String']['output'];
  /** Unique identifier for the model. */
  id: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Revoke an existing grant. */
  revokeGrant: RevokeGrantMutationResponse;
};


export type MutationRevokeGrantArgs = {
  input: RevokeGrantInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  /** The cursor used to fetch the next page when paginating forward. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Indicates if there are more pages when paginating forward. */
  hasNextPage: Scalars['Boolean']['output'];
  /** Indicates if there are more pages when paginating backward. */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** The cursor used to fetch the next page when paginating backward. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaymentAmount = {
  __typename?: 'PaymentAmount';
  /** Should be an ISO 4217 currency code whenever possible, e.g. `USD`. For more information, refer to [assets](https://rafiki.dev/overview/concepts/accounting/#assets). */
  assetCode: Scalars['String']['output'];
  /** Difference in orders of magnitude between the standard unit of an asset and a corresponding fractional unit. */
  assetScale: Scalars['UInt8']['output'];
  /** The value of the payment amount. */
  value: Scalars['UInt64']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Fetch a specific grant by its ID. */
  grant: Grant;
  /** Fetch a paginated list of grants. */
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
  sortOrder?: InputMaybe<SortOrder>;
  tenantId?: InputMaybe<Scalars['ID']['input']>;
};

export type RevokeGrantInput = {
  /** Unique identifier of the grant to revoke. */
  grantId: Scalars['String']['input'];
};

export type RevokeGrantMutationResponse = {
  __typename?: 'RevokeGrantMutationResponse';
  /** Unique identifier of the revoked grant. */
  id: Scalars['ID']['output'];
};

export enum SortOrder {
  /** Sort the results in ascending order. */
  Asc = 'ASC',
  /** Sort the results in descending order. */
  Desc = 'DESC'
}

export type GetGrantsQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  filter?: InputMaybe<GrantFilter>;
}>;


export type GetGrantsQuery = { __typename?: 'Query', grants: { __typename?: 'GrantsConnection', edges: Array<{ __typename?: 'GrantEdge', cursor: string, node: { __typename?: 'Grant', id: string, client: string, state: GrantState, finalizationReason?: GrantFinalization | null, createdAt: string, access: Array<{ __typename?: 'Access', id: string, identifier?: string | null, createdAt: string, actions: Array<string | null>, type: string, limits?: { __typename?: 'LimitData', receiver?: string | null, interval?: string | null, debitAmount?: { __typename?: 'PaymentAmount', value: any, assetCode: string, assetScale: number } | null, receiveAmount?: { __typename?: 'PaymentAmount', value: any, assetCode: string, assetScale: number } | null } | null }> } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetGrantQueryVariables = Exact<{
  grantId: Scalars['ID']['input'];
}>;


export type GetGrantQuery = { __typename?: 'Query', grant: { __typename?: 'Grant', id: string, client: string, state: GrantState, finalizationReason?: GrantFinalization | null, createdAt: string, access: Array<{ __typename?: 'Access', id: string, identifier?: string | null, createdAt: string, actions: Array<string | null>, type: string, limits?: { __typename?: 'LimitData', receiver?: string | null, interval?: string | null, debitAmount?: { __typename?: 'PaymentAmount', value: any, assetCode: string, assetScale: number } | null, receiveAmount?: { __typename?: 'PaymentAmount', value: any, assetCode: string, assetScale: number } | null } | null }> } };

export type RevokeGrantMutationVariables = Exact<{
  grantId: Scalars['String']['input'];
}>;


export type RevokeGrantMutation = { __typename?: 'Mutation', revokeGrant: { __typename?: 'RevokeGrantMutationResponse', id: string } };
