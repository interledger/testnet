export class PricesService {
  getPrices() {
    return {
      base: 'USD',
      rates: {
        EUR: 1.1602,
        ZAR: 17.3782
      }
    }
  }
}
