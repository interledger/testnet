import { UploadSmile } from '@/components/Icons/UploadSmile'
import { forwardRef, SyntheticEvent, useId, useState } from 'react'

type FileUploadProps = {
  label?: string
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ label, ...props }, ref) => {
    const [selectedFile, setSelectedFile] = useState('')

    const handleOnChange = (event: SyntheticEvent) => {
      const target = event.target as HTMLInputElement
      setSelectedFile(target.value.slice(target.value.lastIndexOf('\\') + 1))
    }

    const id = useId()

    return (
      <div className="my-5">
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
          <input
            id={id}
            ref={ref}
            type="file"
            className="hidden"
            {...props}
            onChange={handleOnChange}
          />
        </label>
        <span className="text-sm font-light text-brand-orange">
          {selectedFile}
        </span>
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'
