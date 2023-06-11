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
};

export type Access = Model & {
  __typename?: 'Access';
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Access id */
  id: Scalars['ID'];
  /** Payment pointer of a sub-resource (incoming payment, outgoing payment, or quote) */
  identifier?: Maybe<Scalars['String']>;
};

export type Grant = Model & {
  __typename?: 'Grant';
  /** Access details */
  access: Array<Access>;
  /** Payment pointer of the grantee's account */
  client: Scalars['String'];
  /** Date-time of creation */
  createdAt: Scalars['String'];
  /** Grant id */
  id: Scalars['ID'];
  /** Payment pointer of the resource owner's account */
  identifier: Scalars['String'];
  /** State of the grant */
  state: GrantState;
};

export type GrantEdge = {
  __typename?: 'GrantEdge';
  cursor: Scalars['String'];
  node: Grant;
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

export type Model = {
  createdAt: Scalars['String'];
  id: Scalars['ID'];
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
  code: Scalars['String'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

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

export type PaginationInput = {
  /** Paginating forwards: the cursor before the the requested page. */
  after?: InputMaybe<Scalars['String']>;
  /** Paginating backwards: the cursor after the the requested page. */
  before?: InputMaybe<Scalars['String']>;
  /** Paginating forwards: The first **n** elements from the page. */
  first?: InputMaybe<Scalars['Int']>;
  /** Paginating backwards: The last **n** elements from the page. */
  last?: InputMaybe<Scalars['Int']>;
};

export type Query = {
  __typename?: 'Query';
  /** Fetch a page of grants. */
  grants: GrantsConnection;
};


export type QueryGrantsArgs = {
  input?: InputMaybe<PaginationInput>;
};

export type RevokeGrantInput = {
  grantId: Scalars['String'];
};

export type RevokeGrantMutationResponse = MutationResponse & {
  __typename?: 'RevokeGrantMutationResponse';
  code: Scalars['String'];
  message: Scalars['String'];
  success: Scalars['Boolean'];
};

export type GetGrantsQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
}>;


export type GetGrantsQuery = { __typename?: 'Query', grants: { __typename?: 'GrantsConnection', edges: Array<{ __typename?: 'GrantEdge', cursor: string, node: { __typename?: 'Grant', id: string, identifier: string, client: string, state: GrantState, createdAt: string, access: Array<{ __typename?: 'Access', id: string, identifier?: string | null, createdAt: string }> } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type RevokeGrantMutationVariables = Exact<{
  grantId: Scalars['String'];
}>;


export type RevokeGrantMutation = { __typename?: 'Mutation', revokeGrant: { __typename?: 'RevokeGrantMutationResponse', code: string, success: boolean, message: string } };
