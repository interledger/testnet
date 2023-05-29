import { httpClient, SuccessResponse } from '@/lib/httpClient'
import { SelectOption } from '@/ui/forms/Select'

/**
 * `getObjectKeys` should be used only when we have additional knowledge.
 * If we know that a specific object doesn't have extra properties, the literal
 * type assertion can be safely used.
 */
export const getObjectKeys = Object.keys as <T extends object>(
  obj: T
) => Array<keyof T>

// Gets list of countries from Rapyd
export const fetchCountries = async (
  cookies?: string
): Promise<SelectOption[]> => {
  try {
    const response = await httpClient
      .get('countries', {
        headers: {
          ...(cookies ? { Cookie: cookies } : {})
        }
      })
      .json<SuccessResponse<SelectOption[]>>()
    return response?.data ?? []
  } catch (error) {
    console.log(error)
    return []
  }
}

export type Document = {
  type: string
  name: string
  isBackRequired: boolean
}

// Gets list of approved documents by countries from Rapyd
export const fetchDocuments = async (cookies?: string): Promise<Document[]> => {
  try {
    const response = await httpClient
      .get('documents', {
        headers: {
          ...(cookies ? { Cookie: cookies } : {})
        }
      })
      .json<SuccessResponse<Document[]>>()
    return response?.data ?? []
  } catch (error) {
    console.log(error)
    return []
  }
}

export const formatAmount = (value: number, scale = 2) => {
  return transformAmount(value, scale).toFixed(scale)
}

export const transformAmount = (value: number, scale = 2) => {
  return value * 10 ** -scale
}
