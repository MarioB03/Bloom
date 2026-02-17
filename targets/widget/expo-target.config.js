/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "BloomWidget",
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.akemi01.bloom",
    ],
  },
};
