const createWalletRequest = {
  firstName: 'rafiki',
  lastName: 'test',
  address: 'addresss',
  city: 'city',
  country: 'country',
  zip: '12345'
}

const verifyIdentityRequest = {
  documentType: 'PA',
  frontSideImage: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMk=',
  frontSideImageType: 'image/jpeg',
  faceImage: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMSEhUSEhIVFhUXGBoVGRgk=',
  faceImageType: 'image/jpeg',
  backSideImage: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMk=',
  backSideImageType: 'image/jpeg'
}

const mockRapydWallet: RapydWallet = {
  first_name: 'John',
  last_name: 'Doe',
  email: '',
  ewallet_reference_id: 'John-Doe-02152020',
  metadata: {
    merchant_defined: true
  },
  phone_number: '',
  type: 'person',
  contact: {
    phone_number: '+14155551311',
    email: 'johndoe@rapyd.net',
    first_name: 'John',
    last_name: 'Doe',
    mothers_name: 'Jane Smith',
    contact_type: 'personal',
    address: {
      name: 'John Doe',
      line_1: '123 Main Street',
      line_2: '',
      line_3: '',
      city: 'Anytown',
      state: 'NY',
      country: 'US',
      zip: '12345',
      phone_number: '+14155551111',
      metadata: {},
      canton: '',
      district: ''
    },
    identification_type: 'PA',
    identification_number: '1234567890',
    date_of_birth: '11/22/2000',
    country: 'US',
    nationality: 'FR',
    metadata: {
      merchant_defined: true
    }
  }
}

const mockVerifyIdentityResponse = {
  status: {
    error_code: '',
    status: 'SUCCESS',
    message: '',
    response_code: '',
    operation_id: '70d9e1a7-416d-45ab-bfee-95788f8d1bbb'
  },
  data: {
    id: 'kycid_6899d0a145c264bdb04fc7dc421a03f3',
    reference_id: '555'
  }
}

export {
  createWalletRequest,
  mockRapydWallet,
  verifyIdentityRequest,
  mockVerifyIdentityResponse
}
