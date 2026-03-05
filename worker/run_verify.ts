import { runFullStackVerify } from './src/verify_full_stack';

runFullStackVerify().then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error(err);
});
