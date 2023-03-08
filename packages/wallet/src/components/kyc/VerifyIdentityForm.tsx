import { userService, verifyIdentitySchema } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Button } from '@/ui/Button'
import { FieldError } from '@/ui/forms/FieldError'
import { FileUpload } from '@/ui/forms/FileUpload'
import { Form } from '@/ui/forms/Form'
import { getObjectKeys } from '@/utils/helpers'
import { useRouter } from 'next/router'
import { SyntheticEvent, useState } from 'react'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { useKYCFormContext } from './context'

export const VerifyIdentityForm = () => {
  // set default values and documents for DEV mode
  const isDevMode = process.env.NODE_ENV === 'development'

  const [openDialog, closeDialog] = useDialog()
  const { idTypes } = useKYCFormContext()
  const [frontIDFile, setFrontIDFile] = useState('')
  const [selfieFile, setSelfieFile] = useState('')
  const [backIDFile, setBackIDFile] = useState('')
  const [isBackRequired, setIsBackRequired] = useState(false)
  const router = useRouter()

  const handleFileOnChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget
    const fileName = target.value.slice(target.value.lastIndexOf('\\') + 1)
    if (target.name === 'selfie') {
      setSelfieFile(fileName)
    } else if (target.name === 'frontSideID') {
      setFrontIDFile(fileName)
    } else {
      setBackIDFile(fileName)
    }
  }

  const handleIdTypeChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget
    setIsBackRequired(target.getAttribute('data-back-id') === 'true')
  }

  const verifyIdentityForm = useZodForm({
    schema: verifyIdentitySchema
  })

  return (
    <Form
      form={verifyIdentityForm}
      onSubmit={async (data) => {
        const response = await userService.verifyIdentity(data)

        if (!response) {
          openDialog(
            <ErrorDialog
              onClose={closeDialog}
              content="Something went wrong. Please try again"
            />
          )
          return
        }

        if (response.success) {
          openDialog(
            <SuccessDialog
              onClose={() => {
                closeDialog()
                router.push('/')
              }}
              content="Your identity has been veryfied."
              redirect="/"
              redirectText="Go to your account overview"
            />
          )
        } else {
          const { errors, message } = response

          if (errors) {
            getObjectKeys(errors).map((field) =>
              verifyIdentityForm.setError(field, { message: errors[field] })
            )
          }
          if (message) {
            verifyIdentityForm.setError('root', { message })
          }
        }
      }}
    >
      {isDevMode && (
        <span className="font-semibold text-pink">
          Test data is used in development mode!
        </span>
      )}
      <div>
        <div className="grid grid-cols-3 gap-3">
          {idTypes.map((idType) => (
            <div
              key={idType.type}
              className="flex w-auto items-center justify-center"
            >
              <input
                type="radio"
                id={idType.type}
                className="peer hidden"
                value={idType.type}
                data-back-id={idType.isBackRequired}
                {...verifyIdentityForm.register('idType', {
                  onChange: handleIdTypeChange
                })}
                // DEV MODE => Use Passport as default value
                checked={isDevMode && idType.type === 'PA'}
                disabled={isDevMode && idType.type !== 'PA'}
              />
              <label
                htmlFor={idType.type}
                className="w-[150px] cursor-pointer rounded-xl border border-turqoise bg-white p-2 text-center text-base font-light text-turqoise shadow-md peer-checked:border-orange peer-checked:text-orange sm:min-w-[100px]"
              >
                {idType.name}
              </label>
            </div>
          ))}
        </div>
        <FieldError
          error={verifyIdentityForm.formState.errors.idType?.message}
        />
      </div>
      <div className="flex justify-evenly">
        <div className="my-5">
          {!isDevMode && (
            <>
              <FileUpload
                label="Selfie image"
                {...verifyIdentityForm.register('selfie', {
                  onChange: handleFileOnChange
                })}
                error={verifyIdentityForm.formState.errors.selfie?.message}
              />
              <span className="text-sm font-light text-orange">
                {selfieFile}
              </span>
            </>
          )}
          {isDevMode && (
            <>
              <FileUpload isDisabled={true} label="Selfie image" />
              <span className="text-sm font-light text-orange">
                testSelfie.jpeg
              </span>
            </>
          )}
        </div>
        <div className="my-5">
          {!isDevMode && (
            <>
              <FileUpload
                label="Front side ID"
                {...verifyIdentityForm.register('frontSideID', {
                  onChange: handleFileOnChange
                })}
                error={verifyIdentityForm.formState.errors.frontSideID?.message}
              />
              <span className="text-sm font-light text-orange">
                {frontIDFile}
              </span>
            </>
          )}
          {isDevMode && (
            <>
              <FileUpload isDisabled={true} label="Front side ID" />
              <span className="text-sm font-light text-orange">
                testFrontId.jpeg
              </span>
            </>
          )}
        </div>
        {!isDevMode && isBackRequired && (
          <div className="my-5">
            <FileUpload
              label="Back side ID"
              {...verifyIdentityForm.register('backSideID', {
                onChange: handleFileOnChange
              })}
              error={verifyIdentityForm.formState.errors.backSideID?.message}
            />
            <span className="text-sm font-light text-orange">{backIDFile}</span>
          </div>
        )}
      </div>
      <Button aria-label="Verify Account" type="submit">
        Verify Account
      </Button>
    </Form>
  )
}
