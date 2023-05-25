import { faker } from '@faker-js/faker'
import { logInSchema, signUpSchema } from '@/auth/validation'
import z from 'zod'

type LogInRequest = z.infer<typeof logInSchema>
export const mockLogInRequest = (
  overrides?: Partial<LogInRequest['body']>
): LogInRequest => ({
  body: {
    email: faker.internet.email(),
    password: faker.internet.password(),
    ...overrides
  }
})

type SignUpRequest = z.infer<typeof signUpSchema>
export const mockSignUpRequest = (
  overrides?: Partial<SignUpRequest['body']>
): SignUpRequest => {
  const result = mockLogInRequest()
  return {
    body: {
      ...result.body,
      confirmPassword: result.body.password,
      ...overrides
    }
  }
}
