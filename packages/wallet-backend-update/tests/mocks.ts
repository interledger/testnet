import { faker } from '@faker-js/faker'
import { logInSchema, signUpSchema } from '@/auth/validation'
import z from 'zod'

type LogInRequest = z.infer<typeof logInSchema>
export const mockLogInRequest = (
  overrides?: Partial<LogInRequest>
): LogInRequest => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  ...overrides
})

type SignUpRequest = z.infer<typeof signUpSchema>
export const mockSignUpRequest = (
  overrides?: Partial<SignUpRequest>
): SignUpRequest => {
  const result = mockLogInRequest()
  return {
    ...result,
    confirmPassword: result.password,
    ...overrides
  }
}
