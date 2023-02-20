import { Button } from '@/ui/Button'
import { FieldError } from '@/ui/forms/FieldError'
import { FileUpload } from '@/ui/forms/FileUpload'
import { Form, useZodForm } from '@/ui/forms/Form'
import { z } from 'zod'

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

const verifyIdentitySchema = z
  .object({
    idType: z.string({ invalid_type_error: 'Please select an ID Type' }),
    frontSideID: z.any(),
    selfie: z.any()
  })
  .superRefine(({ selfie, frontSideID }, ctx) => {
    if (selfie[0] === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please upload selfie',
        path: ['selfie']
      })
    } else if (frontSideID[0] === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please upload front of ID document',
        path: ['frontSideID']
      })
    }
  })

export const VerifyIdentityForm = () => {
  const verifyIdentityForm = useZodForm({
    schema: verifyIdentitySchema
  })

  const handleSubmit = verifyIdentityForm.handleSubmit((data) => {
    console.log(data)
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
                className="min-w-[50px] cursor-pointer rounded-xl border border-brand-turqoise bg-white p-2 text-center text-base font-light text-brand-turqoise shadow-md peer-checked:border-brand-orange peer-checked:text-brand-orange sm:min-w-[100px]"
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
            {...verifyIdentityForm.register('selfie')}
            error={verifyIdentityForm.formState.errors.selfie?.message}
          />
          <span className="text-sm font-light text-brand-orange">
            {verifyIdentityForm?.getValues('selfie')?.[0]?.name}
          </span>
        </div>
        <div className="my-5">
          <FileUpload
            label="Front side ID"
            {...verifyIdentityForm.register('frontSideID')}
            error={verifyIdentityForm.formState.errors.frontSideID?.message}
          />
          <span className="text-sm font-light text-brand-orange">
            {verifyIdentityForm?.getValues('frontSideID')?.[0]?.name}
          </span>
        </div>
      </div>
      <Button aria-label="Verify Account" type="submit">
        Verify Account
      </Button>
    </Form>
  )
}
