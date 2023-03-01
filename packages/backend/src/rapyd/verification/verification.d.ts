interface VerifyIdentityRequest {
  back_side_image?: string
  back_side_image_mime_type?: string
  contact: string // required
  country: string // required
  document_type: string // required
  ewallet: string // required
  face_image: string // required
  face_image_mime_type?: string
  front_side_image: string // required
  front_side_image_mime_type?: string
  reference_id: string //required
  request_type?: string
  send_callback?: boolean
}
