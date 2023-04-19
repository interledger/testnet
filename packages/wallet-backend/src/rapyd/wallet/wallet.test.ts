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

export { mockRapydWallet }
