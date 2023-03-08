import ky, { HTTPError } from 'ky'

let refreshing = false

export const _ky = ky.extend({
  prefixUrl: 'http://localhost:3003',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  hooks: {
    beforeError: [
      (error) => {
        const { response } = error
        if (response && response.body) {
          error.name = 'GitHubError'
          error.message = `${response.body.message} (${response.status})`
        }

        return error
      }
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          if (request.url === '/login') {
            return response
          }
          if (!refreshing) {
            refreshing = true
            try {
              await ky('refresh', options)
              refreshing = false
              await ky(request, options)
            } catch (e) {
              const error = e as HTTPError
              refreshing = false
              if (
                typeof window !== 'undefined' &&
                error.response.status === 401
              ) {
                window.location.href = '/auth'
                return
              }
              console.error('Failed to refresh the access token.')
              return response
            }
          }
        }
        return response
      }
    ]
  }
})
