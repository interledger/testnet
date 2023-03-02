import { userService, verifyIdentitySchema } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { Button } from '@/ui/Button'
import { FieldError } from '@/ui/forms/FieldError'
import { FileUpload } from '@/ui/forms/FileUpload'
import { Form, useZodForm } from '@/ui/forms/Form'
import { getObjectKeys } from '@/utils/helpers'
import { SyntheticEvent, useState } from 'react'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { SuccessDialog } from '../dialogs/SuccessDialog'

// mock data, the list will come from Rapyd
const idTypes = [
  {
    id: '1',
    type: 'id',
    label: 'ID'
  },
  {
    id: '2',
    type: 'passport',
    label: 'Passport'
  },
  {
    id: '3',
    type: 'driverLicence',
    label: "Driver's licence"
  }
]

export const VerifyIdentityForm = () => {
  const [openDialog, closeDialog] = useDialog()
  const [frontIDFile, setFrontIDFile] = useState('')
  const [selfieFile, setSelfieFile] = useState('')

  const handleOnChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget
    const fileName = target.value.slice(target.value.lastIndexOf('\\') + 1)
    if (target.name === 'selfie') {
      setSelfieFile(fileName)
    } else {
      setFrontIDFile(fileName)
    }
  }

  const verifyIdentityForm = useZodForm({
    schema: verifyIdentitySchema
  })

  const handleSubmit = verifyIdentityForm.handleSubmit(async (data) => {
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
          onClose={closeDialog}
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
  })

  return (
    <Form form={verifyIdentityForm} onSubmit={handleSubmit}>
      <div>
        <div className="flex justify-between">
          {idTypes.map((idType) => (
            <div key={idType.id} className="flex w-auto justify-center">
              <input
                type="radio"
                id={idType.id}
                className="peer hidden"
                value={idType.type}
                {...verifyIdentityForm.register('idType')}
              />
              <label
                htmlFor={idType.id}
                className="min-w-[50px] cursor-pointer rounded-xl border border-turqoise bg-white p-2 text-center text-base font-light text-turqoise shadow-md peer-checked:border-orange peer-checked:text-orange sm:min-w-[100px]"
              >
                {idType.label}
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
          <FileUpload
            label="Selfie image"
            {...verifyIdentityForm.register('selfie', {
              onChange: handleOnChange
            })}
            error={verifyIdentityForm.formState.errors.selfie?.message}
          />
          <span className="text-sm font-light text-orange">{selfieFile}</span>
        </div>
        <div className="my-5">
          <FileUpload
            label="Front side ID"
            {...verifyIdentityForm.register('frontSideID', {
              onChange: handleOnChange
            })}
            error={verifyIdentityForm.formState.errors.frontSideID?.message}
          />
          <span className="text-sm font-light text-orange">{frontIDFile}</span>
        </div>
      </div>
      <Button aria-label="Verify Account" type="submit">
        Verify Account
      </Button>
    </Form>
  )
}
