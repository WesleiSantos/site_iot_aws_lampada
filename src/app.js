import Amplify, { PubSub } from 'aws-amplify';
import { API } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import { Auth } from 'aws-amplify';
import awsconfig from './aws-exports';
import './assets/css/style.css'
import lamp1 from './assets/images/Lamp1.jpg'
import lamp2 from './assets/images/Lamp2.jpg'
import clock from './assets/images/Clock.png'
import grafico from './assets/images/Grafico.png'
import menu from './assets/images/Menu.png'
Amplify.configure(awsconfig);

import $ from 'jquery';
window.jQuery = $;
window.$ = $;

/*const username = "weslei"
const password = "weslei200"
const email= "weslei200912@gmail.com"
const code = "972842"*/

const resendCode = function (username) {
  Auth.resendSignUp(username).then(() => {
    console.log('code resent successfully');
  }).catch(e => {
    console.log(e);
  });
}
const confirmation = function (username, code) {
  // After retrieveing the confirmation code from the user
  Auth.confirmSignUp(username, code, {
    // Optional. Force user confirmation irrespective of existing alias. By default set to True.
    forceAliasCreation: true
  }).then(data => console.log(data))
    .catch(err => console.log(err));
}

const login = function (username, password) {
  // For advanced usage
  // You can pass an object which has the username, password and validationData which is sent to a PreAuthentication Lambda trigger
  Auth.signIn({
    username, // Required, the username
    password, // Optional, the password
  }).then(user => console.log(user))
    .catch(err => console.log(err));
}

Amplify.addPluggable(new AWSIoTProvider({
  aws_pubsub_region: 'us-east-1',
  aws_pubsub_endpoint: 'wss://a1u5p9d1s2ikgy-ats.iot.us-east-1.amazonaws.com/mqtt',
}));

const subscribe = function () {
  PubSub.subscribe('myTopic', { provider: 'AWSIoTProvider' }).subscribe({
    next: data => console.log('Message received', data),
    error: error => console.error(error),
    close: () => console.log('Done'),
  })
}

const publish_lampada_status = function (comando) {
  console.log(comando)
  //PubSub.publish('cmd/esp8266/house/lampada/atualizar_status', { "status": comando }) 
  PubSub.publish('cmd/esp8266/house/lampada/req', { "status": comando })
}

const publish_tarifa = function (valor_tarifa) {
  console.log(valor_tarifa)
  PubSub.publish('cmd/esp8266/house/lampada/atualizar_tarifa', { "tarifa": valor_tarifa })
}

const publish_temporizador = function (status, dia, hora_inicio, quantidade_tempo) {
  console.log(status, dia, hora_inicio, quantidade_tempo)
  PubSub.publish('cmd/esp8266/house/lampada/atualizar_temporizador', { "status": status, "dia": dia, "hora_inicio": hora_inicio, "quantidade_tempo": quantidade_tempo })
}

let delay=5000; //5 seconds
setInterval(function(){
  API.get('lampadaApi', '/lampada', {}).then(result => {
    let status_lampada = JSON.parse(`{"status":${result.data.Items[0].status}}`)
    console.log(status_lampada)
    if (status_lampada.status == 0) {
      $("#status_lampada").html("ligada")
    } else {
      $("#status_lampada").html("desligada")
    }
  }).catch(err => {
    console.log(err);
  })
},delay);



const consutRelatorio = function (mes) {
  API.get('lampadaApi', `/lampada/relatorio/mes/${mes}`, {}).then((result) => {
    $("#table_relatorio>tbody").html('')
    result.data.forEach(myFunction)
    function myFunction(item, index) {
      console.log(item)
      let cols= `<tr>
            <th scope="row">${item.mes}</th>
            <td>${item.dia}</td>
            <td>${item.valorTarifa}</td>
            <td>${item.quantidadeHoras}</td>
            <td>${item.potenciaTotal}</td>
            <td>${item.custoTotal}</td>
        </tr>`
      $("#table_relatorio>tbody").append(cols)
    }
    console.log(result.data);
  }).catch(err => {
    console.log(err);
  })
}



/*API.get('lampadaApi', `/lampada/${id}`, {}).then((result) => {
  this.lampada = JSON.parse(result.body);
}).catch(err => {
  console.log(err);
})*/

/*Auth.signUp({
  username,
  password,
  attributes: {
    email,          // optional
},
validationData: []  //optional
  })
  .then(data => console.log(data))
  .catch(err => console.log(err));

// After retrieveing the confirmation code from the user
Auth.confirmSignUp(username, code, {
  // Optional. Force user confirmation irrespective of existing alias. By default set to True.
  forceAliasCreation: true    
}).then(data => console.log(data))
.catch(err => console.log(err));

Auth.resendSignUp(username).then(() => {
  console.log('code resent successfully');
}).catch(e => {
  console.log(e);
});

Auth.signOut()
    .then(data => console.log(data))
    .catch(err => console.log(err));

// By doing this, you are revoking all the auth tokens(id token, access token and refresh token)
// which means the user is signed out from all the devices
// Note: although the tokens are revoked, the AWS credentials will remain valid until they expire (which by default is 1 hour)
Auth.signOut({ global: true })
    .then(data => console.log(data))
    .catch(err => console.log(err));

Auth.currentCredentials().then((info) => {
  const cognitoIdentityId = info.data.IdentityId;
  console.log(cognitoIdentityId);
});
*/
Auth.currentCredentials().then((info) => {
  const cognitoIdentityId = info;
  console.log(cognitoIdentityId);
});

export {
  resendCode, publish_temporizador,publish_lampada_status, confirmation, login, subscribe, publish_tarifa, consutRelatorio, lamp1, lamp2, clock, grafico, menu
}