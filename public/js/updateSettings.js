/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// export const updateData = async (name, email) => {
//   try {
//     const res = await axios({
//       method: 'PATCH',
//       url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
//       data: {
//         name: name,
//         email: email
//       }
//     });
//     if (res.data.status === 'success') {
//       showAlert(res.data.status, 'Datele contului dvs. au fost actualizate !');
//     }
//     //console.log(res);
//   } catch (err) {
//     //console.log(err.response);
//     showAlert('error', err.response.data.message);
//   }
// };

// generalizeaza si face o singura functie care sa faca update-ul la datele userului
// type poate fi : "password" sau "data"
export const updateSettings = async (data, type) => {
  try {
    // console.log('Data :', data);
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (res.data.status === 'success') {
      showAlert(res.data.status, 'Datele contului dvs. au fost actualizate!');
    }
    //console.log(res);
  } catch (err) {
    //console.log(err.response);
    showAlert('error', err.response.data.message);
  }
};
