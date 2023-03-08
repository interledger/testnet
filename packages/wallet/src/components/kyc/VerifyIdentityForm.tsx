import { userService, verifyIdentitySchema } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Button } from '@/ui/Button'
import { FieldError } from '@/ui/forms/FieldError'
import { FileUpload } from '@/ui/forms/FileUpload'
import { Form } from '@/ui/forms/Form'
import { getObjectKeys } from '@/utils/helpers'
import { useRouter } from 'next/router'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { useKYCFormContext } from './context'

export const VerifyIdentityForm = () => {
  const [openDialog, closeDialog] = useDialog()

  const { idTypes } = useKYCFormContext()
  const router = useRouter()

  // DEV TESTING => default files are used
  // const [frontIDFile, setFrontIDFile] = useState('')
  // const [selfieFile, setSelfieFile] = useState('')

  // ToDO figure out how to show/hide backSide ID if required
  // const [backIDFile, setBackIDFile] = useState('')
  // const [isBackRequired, setIsBackRequired] = useState(false)

  // DEV TESTING => default files are used
  // const handleFileOnChange = (event: SyntheticEvent<HTMLInputElement>) => {
  //   const target = event.currentTarget
  //   const fileName = target.value.slice(target.value.lastIndexOf('\\') + 1)
  //   if (target.name === 'selfie') {
  //     setSelfieFile(fileName)
  //   } else if (target.name === 'frontSideID') {
  //     setFrontIDFile(fileName)
  //   }
  //    else {
  //     setBackIDFile(fileName)
  //   }
  // }

  // ToDO figure out how to show/hide backSide ID if required
  // const handleIdTypeChange = (isBackRequired: boolean) => {
  //   setIsBackRequired(isBackRequired)
  // }

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
      <span className="font-semibold text-pink">
        Test data is used in development mode!
      </span>
      <div>
        <div className="flex justify-between">
          {idTypes.map((idType) => (
            <div key={idType.type} className="flex w-auto justify-center">
              <input
                type="radio"
                id={idType.type}
                className="peer hidden"
                value={idType.type}
                {...verifyIdentityForm.register('idType')}
                // DEV TESTING => always PA selected and disabled
                checked={idType.type === 'PA'}
                disabled={idType.type !== 'PA'}
                // ToDO figure out how to show/hide backSide ID if required
                // onChange={() => handleIdTypeChange(idType.isBackRequired)}
              />
              <label
                htmlFor={idType.type}
                className="min-w-[50px] cursor-pointer rounded-xl border border-turqoise bg-white p-2 text-center text-base font-light text-turqoise shadow-md peer-checked:border-orange peer-checked:text-orange sm:min-w-[100px]"
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
          <FileUpload
            label="Selfie image"
            // DEV TESTING => default selfie is sent to verify
            isDisabled={true}
            // {...verifyIdentityForm.register('selfie', {
            //   onChange: handleFileOnChange
            // })}
            // error={verifyIdentityForm.formState.errors.selfie?.message}
          />
          {/* <span className="text-sm font-light text-orange">{selfieFile}</span> */}
          <span className="text-sm font-light text-orange">
            testSelfie.jpeg
          </span>
        </div>
        <div className="my-5">
          <FileUpload
            label="Front side ID"
            // DEV TESTING => default document is sent to verify
            isDisabled={true}
            // {...verifyIdentityForm.register('frontSideID', {
            //   onChange: handleFileOnChange
            // })}
            // error={verifyIdentityForm.formState.errors.frontSideID?.message}
          />
          {/* <span className="text-sm font-light text-orange">{frontIDFile}</span> */}
          <span className="text-sm font-light text-orange">
            testFrontId.jpeg
          </span>
        </div>
        {/* ToDO figure out how to show/hide backSide ID if required
        {isBackRequired && (
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
        )} */}
      </div>
      <Button aria-label="Verify Account" type="submit">
        Verify Account
      </Button>
    </Form>
  )
}
