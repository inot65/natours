/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    if (res.data.status === 'success') {
      showAlert(res.data.status, 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    //console.log(res);
  } catch (err) {
    //console.log(err.response);
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    });
    // console.log(res);
    if (res.data.status === 'success') {
      // important, reincarcam mai jos o pagina de pe server
      location.reload(true);
    }
  } catch (err) {
    //console.log(err.response);
    showAlert('error', 'Error logging oyt ! Try again.');
  }
};
