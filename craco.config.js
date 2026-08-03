const path = require("path");
const { WebpackHealthPlugin } = require("./plugins/health-check/webpack-health-plugin");

module.exports = {
  webpack : {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    plugins: {
      add: [new WebpackHealthPlugin()]
    }
  }
};
