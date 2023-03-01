import axios, { AxiosError } from 'axios'
import type { FieldPath } from 'react-hook-form'
import { input, ZodTypeAny } from 'zod/lib/types'

type BaseResponse = {
  message?: string
}

export type SuccessResponse<T = undefined> = BaseResponse & {
  success: true
  data?: T
}

export type ErrorResponse<T extends ZodTypeAny> = BaseResponse & {
  success: false
  errors?: Record<FieldPath<input<T>>, string>
}

const setupAxios = () => {
  let refreshing = false

  const _axios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  })

  _axios.interceptors.response.use(
    // On fulfilled
    (response) => response,
    // On rejected
    async (error: AxiosError) => {
      if (error.response && error.response?.status === 401 && error.config) {
        if (!refreshing) {
          refreshing = true
          try {
            await _axios.post('/refresh')
            refreshing = false
            return _axios(error.config)
          } catch (error) {
            refreshing = false
            console.error('Failed to refresh the access token.')
            return Promise.reject(error)
          }
        }
      }
      return Promise.reject(error)
    }
  )
  return _axios
}

const $axios = setupAxios()

export default $axios
