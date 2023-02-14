import { FileUpload } from '@/ui/FileUpload'
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

const identificationSchema = z.object({
  idType: z.string()
})

export const IdentificationForm = () => {
  const identificationForm = useZodForm({
    schema: identificationSchema
  })

  const handleSubmit = identificationForm.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <Form form={identificationForm} onSubmit={handleSubmit}>
      <div className="flex justify-between">
        {idTypes.map((idType) => (
          <div key={idType.id} className="flex w-auto justify-center">
            <input
              required
              type="radio"
              id={idType.id}
              name="idType"
              className="peer hidden"
              value={idType.type}
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
      <div className="flex">
        <FileUpload label="Front side" />
        <FileUpload label="Back side" />
      </div>
    </Form>
  )
}
