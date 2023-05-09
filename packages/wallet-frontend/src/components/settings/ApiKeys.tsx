import { CopyButton } from '@/ui/CopyButton'
import { Input } from '@/ui/forms/Input'

export const ApiKeys = () => {
  return (
    <>
      <div className="mb-5">
        <h3 className="text-2xl text-turqoise">API Keys</h3>
      </div>
      <div className="flex w-full flex-col space-y-10 px-10">
        <div className="flex items-center space-x-10">
          <div className="flex-1">
            <Input
              type="password"
              value={'MY_SUPER_SECRET_API_KEY_1'}
              readOnly
              label="KEY"
            />
          </div>
          <CopyButton
            value="MY_SUPER_SECRET_API_KEY_1"
            aria-label="copy api key"
            className="mt-auto"
          />
        </div>
        <div className="flex items-center space-x-10">
          <div className="flex-1">
            <Input
              type="password"
              value={'MY_SUPER_SECRET_API_KEY_2'}
              readOnly
              label="KEY"
            />
          </div>
          <CopyButton
            value="MY_SUPER_SECRET_API_KEY_2"
            aria-label="copy api key"
            className="mt-auto"
          />
        </div>
      </div>
    </>
  )
}
