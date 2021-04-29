import Amplify, { PubSub } from 'aws-amplify';
import { API } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import { Auth } from 'aws-amplify';
import awsconfig from './aws-exports';
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

const publish = function (comando) {
  console.log(comando)
  PubSub.publish('inTopic', { "status": comando })

}
const statusLampada = function () {
  API.get('lampadaApi', '/lampada', {}).then(result => {
    console.log({result});
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
  resendCode, confirmation, login, subscribe, publish, statusLampada
}