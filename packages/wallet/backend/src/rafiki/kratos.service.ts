import axios from 'axios'
import process from 'process'
import { Logger } from 'winston'
export class KratosService {
  private KRATOS_INSTANCE: string | undefined

  constructor(private logger: Logger) {
    this.KRATOS_INSTANCE = process.env.KRATOS_ADMIN_URL
    if (!this.KRATOS_INSTANCE) {
      logger.error('No Kratos instance found.')
    }
  }

  private getIdentityId = async (userEmail: string) => {
    try {
      const response = await axios.get(
        `${this.KRATOS_INSTANCE}/identities?credentials_identifier=${userEmail}`
      )
      if (response.data.length > 0 && response.data[0].id) {
        this.logger.debug(
          `User with email ${userEmail} exists on the system with the ID: ${response.data[0].id}`
        )
        return response.data[0].id
      }
      this.logger.debug(`No user with email ${userEmail} exists on the system`)
      return null
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Error retrieving identity ${userEmail}:`,
          error.response?.status,
          error.response?.data
        )
      } else {
        this.logger.error(
          `An unexpected error occurred while trying to retrieve the identity for ${userEmail}:`,
          error
        )
      }
    }
  }

  private createIdentity = async (userEmail: string) => {
    try {
      const response = await axios.post(
        `${this.KRATOS_INSTANCE}/identities`,
        {
          schema_id: 'default',
          traits: {
            email: userEmail
          },
          verifiable_addresses: [
            {
              value: userEmail,
              verified: true,
              via: 'email',
              status: 'completed'
            }
          ],
          credentials: {
            password: {
              config: {
                password: '123456'
              }
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      this.logger.debug(
        `Successfully created user ${userEmail} with ID ${response.data.id}`
      )
      return response.data.id
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Error creating identity for ${userEmail}:`,
          error.response?.status,
          error.response?.data
        )
      } else {
        this.logger.error(
          `An unexpected error occurred while trying to create an identity for ${userEmail}:`,
          error
        )
      }
    }
  }

  private createRecoveryLink = async (
    identityId: string,
    userEmail: string
  ) => {
    try {
      const response = await axios.post(
        `${this.KRATOS_INSTANCE}/recovery/link`,
        {
          expires_in: '12h',
          identity_id: identityId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data.recovery_link
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Error creating password for ${userEmail}:\n status:${error.response?.status}\nresponse:${error.response?.data}`
        )
      } else {
        this.logger.error(
          `An unexpected error occurred while trying to create an account recovery link for ${userEmail}:`,
          error
        )
      }
    }
  }

  public run = async (userEmail: string) => {
    let identityId = await this.getIdentityId(userEmail)
    const event = identityId === null ? 'Registration' : 'Recovery'
    if (event === 'Registration') {
      identityId = await this.createIdentity(userEmail)
    }
    const recoveryLink = await this.createRecoveryLink(identityId, userEmail)
    this.logger.info(`${event} Link for ${userEmail}: ${recoveryLink}`)
  }
}
