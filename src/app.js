import Amplify, { PubSub } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import { Auth } from 'aws-amplify';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);


Auth.currentCredentials().then((info) => {
  const cognitoIdentityId = info.data.IdentityId;
});

Amplify.addPluggable(new AWSIoTProvider({
  aws_pubsub_region: 'us-east-1',
  aws_pubsub_endpoint: 'wss://a1u5p9d1s2ikgy-ats.iot.us-east-1.amazonaws.com/mqtt',
}));

PubSub.subscribe('myTopic',{ provider: 'AWSIoTProvider' }).subscribe({
  next: data => console.log('Message received', data),
  error: error => console.error(error),
  close: () => console.log('Done'),
});
