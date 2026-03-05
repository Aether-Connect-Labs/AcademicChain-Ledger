
import { runFullStackVerify } from './verify_full_stack';

runFullStackVerify()
  .then((result) => {
    console.log("\n✅ FULL STACK VERIFICATION RESULT:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error("❌ VERIFICATION FAILED:", err);
  });
