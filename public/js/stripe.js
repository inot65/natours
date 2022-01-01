/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51K7O1CBAYScTBNRfwkxPF8HDVDId1tB4nF8ufvSKLx1rrRE91lk1aF0Bi6nJRi0vnjDb6JTdzHBpgpBmUG6plrit00JmDslUev'
); // folosim cheia PUBLICA aici

export const bookTour = async tourId => {
  try {
    // 1. get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    // 2. creat checckout form  + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
