import { z } from 'zod'

export const walletSchema = z.object({
  firstName: z.string({ required_error: 'First name is required' }),
  lastName: z.string({ required_error: 'Last name is required' }),
  email: z.string().email({ message: 'Email is required' }),
  address: z.string({ required_error: 'Address is required' }),
  city: z.string({ required_error: 'City is required' }),
  state: z.string({ required_error: 'State is required' }),
  country: z.string({ required_error: 'Country Code is required' }),
  zip: z.string({ required_error: 'Zipcode is required' }),

  phone: z.string().optional()
})
