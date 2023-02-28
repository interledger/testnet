import axios, { type AxiosError } from 'axios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAxiosError<T = any>(error: unknown): error is AxiosError<T> {
  return axios.isAxiosError(error)
}
