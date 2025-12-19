// @ts-check
/// <reference lib="webworker" />

/**
 * @typedef {{
 *  total: PaymentCurrencyAmount,
 *  methodData: {
 *    supportedMethods: string;
 *    data: { walletAddress: string, message?: string };
 *  }[]
 *  paymentRequestOrigin: string,
 *  respondWith: (response: Promise<PaymentResponse['details']>) => void,
 *  openWindow: (url: string) => Promise<Window>
 * }} PaymentRequestEvent
 * @type {PaymentRequestEvent | null}
 */
let paymentRequestEvent = null;
/** @type {PromiseWithResolvers<PaymentResponse['details']>} */
let resolver;
/** @type {Window} */
let client;


const sw = /** @type {ServiceWorkerGlobalScope} */(/** @type {unknown} */  (self));

sw.addEventListener("install", function (event) {
  console.log("Hello world from the Service Worker 🤙", event);
});

/**
 * @param {string} type
 * @param {Record<string, unknown>} contents
 */
const postMessageToWindow = (type, contents = {}) => {
  if (client) client.postMessage({ type, ...contents });
}

sw.addEventListener('paymentrequest', async e => {
  const event = /** @type {PaymentRequestEvent} */ (/** @type {unknown} */( e));
  if (paymentRequestEvent) {
    // If there's an ongoing payment transaction, reject it.
    resolver.reject('only one payment request at a time is allowed');
  }
  // Preserve the event for future use
  paymentRequestEvent = event;

  console.log('Payment request received:', e);

  resolver = Promise.withResolvers();

  // Pass a promise that resolves when payment is done.
  event.respondWith(resolver.promise);
  // Open the checkout page.
  try {
    // Open the window and preserve the client
    client = await event.openWindow('/pay');
    console.log('Payment window opened:', client);
    if (!client) {
      throw 'Failed to open window';
    }
  } catch (err) {
    console.error('Failed to open payment window:', err);
    // Reject the promise on failure
    resolver.reject(err);
  };
});

// Received a message from the frontend
sw.addEventListener('message', async e => {
  console.log('Message received from frontend:', e.data);
  try {
    switch (e.data.type) {
      case 'WINDOW_IS_READY': {
        // `WINDOW_IS_READY` is a frontend's ready state signal
        if (!paymentRequestEvent) {
          throw 'No payment request event available';
        }
        const { total, methodData, paymentRequestOrigin } = paymentRequestEvent;
        postMessageToWindow(
          'PAYMENT_IS_READY',
          { total, methodData: methodData[0], paymentRequestOrigin }
        );
        break
      }
      case 'PAYMENT_AUTHORIZED': {
        // Resolve the payment request event promise with a payment response
        const response = {
          methodName: e.data.paymentMethod,
          details: { ...e.data.details },
        }
        resolver.resolve(response);
        paymentRequestEvent = null;
        break;
      }
      case 'CANCEL_PAYMENT': {
        resolver.resolve(null);
        paymentRequestEvent = null;
        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
});


sw.addEventListener('canmakepayment', e => {
  console.log('Can make payment event received:', e);
  e.respondWith(true);
});
