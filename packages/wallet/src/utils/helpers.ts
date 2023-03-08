import $axios from '@/lib/axios'

/** `getObjectKeys` should be used only when we have additional knowledge.
 * If we know that a specific object doesn't have extra properties, the literal
 * type assertion can be safely used.
 */
export const getObjectKeys = Object.keys as <T extends object>(
  obj: T
) => Array<keyof T>

/** `fetchCountries` gets list of countries from Rapyd */
export const fetchCountries = async () => {
  try {
    const response = await $axios.get('/countries')
    return response.data.data
  } catch (e) {
    console.log(e)
  }
}

/** `fetchDocuments` gets list of approoved documents by countries from Rapyd */
export const fetchDocuments = async () => {
  try {
    const response = await $axios.get('/documents')
    return response.data.data
  } catch (e) {
    console.log(e)
  }
}
