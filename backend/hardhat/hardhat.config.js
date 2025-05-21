/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

// module.exports = {
//   solidity: "0.8.28",
// };
require('dotenv').config()
// export default config;
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      chainId: 8996,
      url: "http://127.0.0.1:8545",
      accounts: [
        process.env.DEPLOYER_ACCOUNT_KEY,
      ],
    }

  },
  paths: {
    artifacts: "./artifacts",
  }
};
