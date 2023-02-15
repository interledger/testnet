import { UploadSmile } from '@/components/Icons/UploadSmile'

type FileUploadProps = {
  label?: string
}

export const FileUpload = ({ label }: FileUploadProps) => {
  return (
    <label
      htmlFor="dropzone-file"
      className="my-5 mr-5 flex w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-turqoise bg-white hover:border-brand-orange"
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadSmile />
        <span className="text-md pt-2 font-light text-brand-turqoise">
          {label}
        </span>
      </div>
      <input id="dropzone-file" type="file" className="hidden" />
    </label>
  )
}
