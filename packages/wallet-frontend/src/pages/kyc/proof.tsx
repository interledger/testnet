import { HeaderLogo } from '@/components/HeaderLogo'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import AuthLayout from '@/components/layouts/AuthLayout'
import { userService, verifyIdentitySchema } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { FieldError } from '@/ui/forms/FieldError'
import { FileUpload } from '@/ui/forms/FileUpload'
import { Form } from '@/ui/forms/Form'
import { USE_TEST_DATA_KYC } from '@/utils/constants'
import { type Document, fetchDocuments, getObjectKeys } from '@/utils/helpers'
import { testImageVerifyIdentity, testImageType } from '@/utils/mocks'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { useState, SyntheticEvent } from 'react'

type IDVerificationPage = InferGetServerSidePropsType<typeof getServerSideProps>

const IDVerificationPage: NextPageWithLayout<IDVerificationPage> = ({
  documents
}) => {
  const [openDialog, closeDialog] = useDialog()
  const [isBackRequired, setIsBackRequired] = useState(false)
  const router = useRouter()

  const handleFileOnChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const reader = new FileReader()
    const target = event.currentTarget
    if (target.files && target.files.length > 0) {
      const file = target.files[0]
      reader.readAsDataURL(file)
      reader.onloadend = () => {
        let fileBase64 = reader.result?.toString() || ''
        fileBase64 = fileBase64.slice(fileBase64.indexOf('base64') + 7)
        if (target.name === 'faceImageUpload') {
          verifyIdentityForm.setValue('faceImage', fileBase64)
          verifyIdentityForm.setValue('faceImageType', file.type)
          verifyIdentityForm.trigger('faceImage')
        } else if (target.name === 'frontSideIDUpload') {
          verifyIdentityForm.setValue('frontSideImage', fileBase64)
          verifyIdentityForm.setValue('frontSideImageType', file.type)
          verifyIdentityForm.trigger('frontSideImage')
        } else {
          verifyIdentityForm.setValue('backSideImage', fileBase64)
          verifyIdentityForm.setValue('backSideImageType', file.type)
          verifyIdentityForm.trigger('backSideImage')
        }
      }
    }
  }

  const handleDocumentChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget
    setIsBackRequired(target.getAttribute('data-back-id') === 'true')
    if (!isBackRequired) {
      verifyIdentityForm.setValue('backSideImage', '')
      verifyIdentityForm.setValue('backSideImageType', '')
      verifyIdentityForm.trigger('backSideImage')
    }
  }

  const verifyIdentityForm = useZodForm({
    schema: verifyIdentitySchema,
    defaultValues: {
      ...(USE_TEST_DATA_KYC ? { documentType: 'PA' } : {})
    }
  })

  return (
    <>
      {USE_TEST_DATA_KYC && (
        <p className="my-2 font-semibold text-pink">
          For testing purposes Passport is selected, and images uploaded by
          default!
        </p>
      )}

      <Form
        form={verifyIdentityForm}
        onSubmit={async (data) => {
          const response = await userService.verifyIdentity(data)

          if (response.success) {
            openDialog(
              <SuccessDialog
                onClose={() => {
                  router.reload()
                  closeDialog()
                }}
                onSuccess={() => {
                  router.reload()
                }}
                content="Your identity has been verified."
                redirectText="Go to your account overview"
              />
            )
          } else {
            const { errors, message } = response
            verifyIdentityForm.setError('root', { message })

            if (errors) {
              getObjectKeys(errors).map((field) =>
                verifyIdentityForm.setError(field, { message: errors[field] })
              )
            }
          }
        }}
      >
        <div>
          <div className="grid grid-cols-3 gap-3">
            {documents.map((document) => (
              <div
                key={document.type}
                className="flex w-auto items-center justify-center"
              >
                <input
                  type="radio"
                  id={document.type}
                  className="peer hidden"
                  // TESTING => Use Passport as default value
                  value={USE_TEST_DATA_KYC ? 'PA' : document.type}
                  data-back-id={document.isBackRequired}
                  {...verifyIdentityForm.register('documentType', {
                    onChange: handleDocumentChange
                  })}
                />
                <label
                  htmlFor={document.type}
                  className={cx(
                    USE_TEST_DATA_KYC
                      ? document.name === 'Passport'
                        ? 'border-orange text-orange'
                        : 'border-turqoise text-turqoise'
                      : 'border-turqoise text-turqoise peer-checked:border-orange peer-checked:text-orange',
                    'w-[150px] cursor-pointer rounded-xl border  bg-white p-2 text-center text-base font-light shadow-md sm:min-w-[100px]'
                  )}
                >
                  {document.name}
                </label>
              </div>
            ))}
          </div>
          <FieldError
            error={verifyIdentityForm.formState.errors.documentType?.message}
          />
        </div>
        <div className="flex justify-evenly">
          <div className="my-5">
            <>
              <FileUpload
                label="Selfie image"
                onChange={handleFileOnChange}
                name="faceImageUpload"
                disabled={USE_TEST_DATA_KYC}
                image={
                  USE_TEST_DATA_KYC
                    ? testImageVerifyIdentity
                    : verifyIdentityForm.getValues('faceImage')
                }
                imageType={
                  USE_TEST_DATA_KYC
                    ? testImageType
                    : verifyIdentityForm.getValues('faceImageType')
                }
                error={verifyIdentityForm.formState.errors.faceImage?.message}
              />
              <input
                type="hidden"
                {...verifyIdentityForm.register('faceImage')}
                value={
                  USE_TEST_DATA_KYC
                    ? testImageVerifyIdentity
                    : verifyIdentityForm.getValues('faceImage')
                }
              />
              <input
                type="hidden"
                {...verifyIdentityForm.register('faceImageType')}
                value={
                  USE_TEST_DATA_KYC
                    ? testImageType
                    : verifyIdentityForm.getValues('faceImageType')
                }
              />
            </>
          </div>
          <div className="my-5">
            <>
              <FileUpload
                label="Front side ID"
                onChange={handleFileOnChange}
                name="frontSideIDUpload"
                disabled={USE_TEST_DATA_KYC}
                image={
                  USE_TEST_DATA_KYC
                    ? testImageVerifyIdentity
                    : verifyIdentityForm.getValues('frontSideImage')
                }
                imageType={
                  USE_TEST_DATA_KYC
                    ? testImageType
                    : verifyIdentityForm.getValues('frontSideImageType')
                }
                error={
                  verifyIdentityForm.formState.errors.frontSideImage?.message
                }
              />
              <input
                type="hidden"
                {...verifyIdentityForm.register('frontSideImage')}
                value={
                  USE_TEST_DATA_KYC
                    ? testImageVerifyIdentity
                    : verifyIdentityForm.getValues('frontSideImage')
                }
              />
              <input
                type="hidden"
                {...verifyIdentityForm.register('frontSideImageType')}
                value={
                  USE_TEST_DATA_KYC
                    ? testImageType
                    : verifyIdentityForm.getValues('frontSideImageType')
                }
              />
            </>
          </div>
          <div className="my-5">
            {isBackRequired && (
              <>
                <FileUpload
                  label="Back side ID"
                  onChange={handleFileOnChange}
                  name="backSideIDUpload"
                  image={verifyIdentityForm.getValues('backSideImage')}
                  imageType={verifyIdentityForm.getValues('backSideImage')}
                  error={
                    verifyIdentityForm.formState.errors.backSideImage?.message
                  }
                />
                <input
                  type="hidden"
                  {...verifyIdentityForm.register('backSideImage')}
                  value={verifyIdentityForm.getValues('backSideImage')}
                />
                <input
                  type="hidden"
                  {...verifyIdentityForm.register('backSideImageType')}
                  value={verifyIdentityForm.getValues('backSideImage')}
                />
              </>
            )}
          </div>
        </div>
        <Button
          aria-label="Verify Account"
          type="submit"
          loading={verifyIdentityForm.formState.isSubmitting}
        >
          Verify Account
        </Button>
      </Form>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  documents: Document[]
}> = async (ctx) => {
  const documents = await fetchDocuments(ctx.req.headers.cookie)
  return {
    props: {
      documents
    }
  }
}

IDVerificationPage.getLayout = function (page) {
  return (
    <AuthLayout image="Group" background="green">
      <HeaderLogo header="Complete KYC" type="kyc" />
      {page}
    </AuthLayout>
  )
}

export default IDVerificationPage
