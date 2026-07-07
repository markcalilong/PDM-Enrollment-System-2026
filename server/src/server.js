const app = require("./app");
const { env, logEnvStatus } = require("./config/env");

// Report (and enforce, in production) env configuration before booting.
logEnvStatus();

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
