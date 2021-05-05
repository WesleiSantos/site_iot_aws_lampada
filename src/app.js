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
  }).then(user => {
    console.log(user)
    $("#success-alert").removeClass("alert-warning").addClass("alert-success").html("sucesso!").fadeTo(3000, 1000).slideUp(1000, function () {
      $("#success-alert").slideUp(1000);
    })
  })
    .catch(err => {
      $("#success-alert").removeClass("alert-success").addClass("alert-warning").html("Error!").fadeTo(3000, 1000).slideUp(1000, function () {
        $("#success-alert").slideUp(1000);
      })
      console.log(err)
    });
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
  PubSub.publish('cmd/esp8266/house/lampada/atualizar_status', { "status": comando })
  //PubSub.publish('cmd/esp8266/house/lampada/req', { "status": comando })
}

const publish_tarifa = function (valor_tarifa) {
  console.log(valor_tarifa)
  PubSub.publish('cmd/esp8266/house/lampada/atualizar_tarifa', { "tarifa": valor_tarifa })
}

const publish_temporizador = function (status, dia, hora_inicio, quantidade_tempo) {
  console.log(status, dia, hora_inicio, quantidade_tempo)
  PubSub.publish('cmd/esp8266/house/lampada/atualizar_temporizador', { "status": status, "dia": dia, "hora_inicio": hora_inicio, "quantidade_tempo": quantidade_tempo })
}

let delay = 3000; //5 seconds
setInterval(function () {
  API.get('lampadaApi', '/lampada', {}).then(result => {
    let status_lampada = JSON.parse(`{"status":${result.data.Items[0].status}}`)
    let status_temporizador = JSON.parse(`{"status_temp":${result.data.Items[0].temporizador}}`)
    let dia = JSON.parse(`{"dia_temp":${result.data.Items[0].diaTemp}}`)
    let hora_inicio = JSON.parse(`{"hora_temp":${result.data.Items[0].horarioTemp}}`)
    let quantidade_tempo = JSON.parse(`{"quantidade_temp":${result.data.Items[0].quantidadeHorasTemp}}`)
    if (status_lampada.status == 0) {
      $("#status_lampada").removeClass("status_desligado").addClass("status_ligado")
    } else {
      $("#status_lampada").removeClass("status_ligado").addClass("status_desligado")
    }
    let dia_form = $("#dia_inicio")
    let hora_inicio_form = $("#hora_inicio")
    let quantidade_tempo_form = $("#quantidade_tempo")
    let button = $("#program_time")
    if (status_temporizador.status_temp == 1) {
      dia_form.prop('disabled', true).val(dia.dia_temp)
      hora_inicio_form.prop('disabled', true).val(hora_inicio.hora_temp)
      quantidade_tempo_form.prop('disabled', true).val(quantidade_tempo.quantidade_temp)
      button.val(1);
      button.html("Desativar")
    } else if (status_temporizador.status_temp == 0 && button.val() == 1) {
      dia_form.prop('disabled', false).val($("#dia_inicio option:first").val())
      hora_inicio_form.prop('disabled', false).val($("#hora_inicio option:first").val())
      quantidade_tempo_form.prop('disabled', false).val($("#quantidade_tempo option:first").val())
      button.val(0);
      button.html("Ativar")
    }
  }).catch(err => {
    console.log(err);
  })
}, delay);

setInterval(function () {
  // Obtém a data/hora atual
  var data = new Date()

  var hora = data.getHours()        // 0-23
  var minutos = data.getMinutes()       // 0-59
  var segundos = data.getSeconds()      // 0-59
  let tempoSegundos = (minutos*60)+segundos

  let mesCorreto = (hora+2)/2
  let diaCorreto = (hora + 2) % 2 == 0 ? Math.ceil((tempoSegundos / 240)) : Math.ceil((tempoSegundos / 240)) + 15
  let horarioCorreto = (tempoSegundos/10)%24
  $("#calendar").html(`${Math.trunc(horarioCorreto)}:00h ${diaCorreto}/${mesCorreto}`)
}, 9000)



const consutRelatorio = function (mes) {
  API.get('lampadaApi', `/lampada/relatorio/mes/${mes}`, {}).then((result) => {
    $("#table_relatorio>tbody").html('')
    $("#total_potencia").html(`Total potência: 0.00 Wh`)
    $("#total_custo").html(`Total custo: 0.00 R$`)
    let potencia_total = 0
    let custo_total = 0
    result.data.forEach(myFunction)
    function myFunction(item, index) {
      potencia_total += item.potenciaTotal
      custo_total += item.custoTotal
      let cols = `<tr>
            <th scope="row">${item.mes}</th>
            <td>${item.dia}</td>
            <td>${item.valorTarifa}</td>
            <td>${item.quantidadeHoras}</td>
            <td>${item.potenciaTotal.toFixed(2)}</td>
            <td>${item.custoTotal.toFixed(2)}</td>
        </tr>`
      $("#table_relatorio>tbody").append(cols)
    }
    $("#total_potencia").html(`Total potência: ${potencia_total.toFixed(2)} Wh`)
    $("#total_custo").html(`Total custo: ${custo_total.toFixed(2)} R$`)
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
  console.log("usuário", cognitoIdentityId);
  if (cognitoIdentityId.authenticated) {
    $("#user_label").html("Authenticated: true")
  } else {
    $("#user_label").html("Authenticated: false")
  }
});

export {
  resendCode, publish_temporizador, publish_lampada_status, confirmation, login, subscribe, publish_tarifa, consutRelatorio, lamp1, lamp2, clock, grafico, menu
}