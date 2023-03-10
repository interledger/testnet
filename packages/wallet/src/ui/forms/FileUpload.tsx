import { UploadSmile } from '@/components/icons/UploadSmile'
import { testImageType, testImageVerifyIdentity } from '@/utils/mocks'
import { ComponentPropsWithoutRef, forwardRef, useId } from 'react'
import { FieldError } from './FieldError'
import Image from 'next/image'
import { USE_TEST_DATA_KYC } from '@/utils/constants'

type FileUploadProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'ref' | 'type'
> & {
  label?: string
  error?: string
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ label, error, ...props }, ref) => {
    const id = useId()

    return (
      <>
        <label
          htmlFor={id}
          className="flex w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-turqoise bg-white text-turqoise hover:border-orange hover:text-orange"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {USE_TEST_DATA_KYC ? (
              <Image
                alt="test"
                width={100}
                height={100}
                src={`data:${testImageType};base64,${testImageVerifyIdentity}`}
              />
            ) : (
              <>
                <UploadSmile />
                <span className="text-md pt-2 font-light">{label}</span>
              </>
            )}
          </div>
          <input id={id} ref={ref} type="file" className="hidden" {...props} />
        </label>
        <FieldError error={error} />
      </>
    )
  }
)

FileUpload.displayName = 'FileUpload'
