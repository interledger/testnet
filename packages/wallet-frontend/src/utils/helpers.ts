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
export const fetchCountries = async (): Promise<SelectOption[]> => {
  try {
    const response = await httpClient
      .get('countries')
      .json<SuccessResponse<SelectOption[]>>()
    return response?.data ?? []
  } catch (error) {
    console.log(error)
    return []
  }
}

type DocumentType = {
  type: string
  name: string
  isBackRequired: boolean
}

// Gets list of approoved documents by countries from Rapyd
export const fetchDocuments = async (): Promise<DocumentType[]> => {
  try {
    const response = await httpClient
      .get('documents')
      .json<SuccessResponse<DocumentType[]>>()
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
