const createResponse = (result: unknown = undefined, message: string = '') => {
  return {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: message || 'SUCCESS'
      },
      result
    }
  }
}

export const AccountPaths = {
  '/accounts': {
    post: {
      operationId: 'create-account',
      tags: ['account'],
      description: '[Login 123](https://www.google.com)',
      parameters: [
        {
          name: 'name',
          in: 'formData',
          type: 'string',
          required: true
        },
        { name: 'assetId', in: 'formData', required: true, type: 'string' }
      ],
      responses: {
        200: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: createResponse({
                $ref: '#/components/schemas/Account'
              })
            }
          }
        },
        409: {
          description:
            'You can only have one account per asset. USD account already exists'
        },
        401: {
          description: 'Unauthorized'
        }
      }
    },
    get: {
      operationId: 'account-list',
      tags: ['account'],
      responses: {
        200: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: createResponse({
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Account'
                }
              })
            }
          }
        },
        401: {
          description: 'Unauthorized'
        }
      }
    }
  },
  '/accounts/{accountID}': {
    get: {
      operationId: 'getAccountById',
      tags: ['account'],
      description: '[Login 123](https://www.google.com)',
      parameters: [
        {
          name: 'accountId',
          in: 'path',
          description: 'ID of account to return',
          type: 'string',
          required: true
        }
      ],
      responses: {
        200: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: createResponse({
                $ref: '#/components/schemas/Account'
              })
            }
          }
        },
        401: {
          description: 'Unauthorized'
        }
      }
    }
  },
  '/accounts/fund': {
    post: {
      operationId: 'fund-account',
      tags: ['account'],
      description: '[Login 123](https://www.google.com)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  example: '1506db1f-7425-4e16-87e0-0a3195ad6c6a'
                },
                amount: {
                  type: 'integer',
                  format: 'int32',
                  example: 200
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: createResponse(undefined, 'Account funded')
            }
          }
        },
        400: {
          description: 'Account Id Not found'
        },
        401: {
          description: 'Unauthorized'
        }
      }
    }
  },
  '/accounts/withdraw': {
    post: {
      operationId: 'withdraw-account',
      tags: ['account'],
      description: '[Login 123](https://www.google.com)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  example: '1506db1f-7425-4e16-87e0-0a3195ad6c6a'
                },
                amount: {
                  type: 'integer',
                  format: 'int32',
                  example: 200
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: createResponse(undefined, 'Funds withdrawn')
            }
          }
        },
        400: {
          description: 'Account Id Not found'
        },
        401: {
          description: 'Unauthorized'
        }
      }
    }
  }
}

export const AccountSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      example: 'Work Account'
    },
    userId: {
      type: 'string',
      example: '7045bae4-e051-4ea8-b157-5d17d37a5ab6'
    },
    assetCode: {
      type: 'string',
      example: 'EUR'
    },
    assetId: {
      type: 'string',
      example: 'c286b5a3-e69d-42fc-9022-e0e8fa354a23'
    },
    integer: {
      type: 'integer',
      format: 'int64',
      example: 2
    },
    virtualAccountId: {
      type: 'string',
      example: 'issuing_f7f970011e5b9ec4af4a6015a371825e'
    },
    id: {
      type: 'string',
      example: 'c286b5a3-e69d-42fc-9022-e0e8fa354a23'
    },
    balance: {
      type: 'string',
      example: '0'
    }
  }
}
