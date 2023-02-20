import { UploadSmile } from '@/components/Icons/UploadSmile'
import { forwardRef, useId } from 'react'
import { FieldError } from './FieldError'

type FileUploadProps = {
  label?: string
  error?: any
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ label, error, ...props }, ref) => {
    const id = useId()

    return (
      <>
        <label
          htmlFor={id}
          className="flex w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-turqoise bg-white hover:border-brand-orange"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadSmile />
            <span className="text-md pt-2 font-light text-brand-turqoise">
              {label}
            </span>
          </div>
          <input id={id} ref={ref} type="file" className="hidden" {...props} />
        </label>
        <FieldError error={error} />
      </>
    )
  }
)

FileUpload.displayName = 'FileUpload'
