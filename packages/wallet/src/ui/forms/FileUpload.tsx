import { UploadSmile } from '@/components/icons/UploadSmile'
import { ComponentPropsWithoutRef, forwardRef, useId } from 'react'
import { FieldError } from './FieldError'
import Image from 'next/image'

type FileUploadProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'ref' | 'type'
> & {
  label?: string
  image?: string
  imageType?: string
  error?: string
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ label, image, imageType, error, ...props }, ref) => {
    const id = useId()
    return (
      <>
        <label
          htmlFor={id}
          className="flex w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-turqoise bg-white text-turqoise hover:border-orange hover:text-orange"
        >
          <div className="flex h-24 flex-col items-center justify-center pt-5 pb-6">
            {image ? (
              <Image
                alt="test"
                width={70}
                height={70}
                src={`data:${imageType};base64,${image}`}
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
