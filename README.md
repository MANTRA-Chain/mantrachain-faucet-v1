# faucet

General Faucet for Cosmos SDK testnet. There are two versions: [Cosmos](https://github.com/ping.pub/faucet) and [Evmos](https://github.com/ping-pub/faucet/tree/evmos)

## Prerequisite

```sh
node -v
v16.15.0
```

# Installation

 - clone code:
 
 ```sh
 git clone https://github.com/ping-pub/faucet.git
 ```
 
 - setup configs, you have to change everything you need in `./config.js`
 ```js
 {
    "port": 80,  // http port 
    "db": {
        "path": "~/.faucet.db" // db for frequency checker(WIP)
    }, 
    "blockchain": {
        "rpc_endpoint": "https://rpc.sentry-02.theta-testnet.polypore.xyz"
    },
    "captcha": // see section on recapture below
    {
        "enabled": true,
        "siteKey": "<<INSERT SITE KEY>>", //shared with the user
        "siteSecret": "<<INSERT SITE SECRET>>" //not shared with the user. Server side only.
    },
    "pow": { // proof-of-work 
        "enabled": true,
        "difficulty": 6
    },
    "sender": {
        "mnemonic": "surround miss nominee dream gap cross assault thank captain prosper drop duty group candy wealth weather scale put",
        "option": {
            "hdPaths": ["m/44'/118'/0'/0/0"],
            "prefix": "cosmos"  //address prefix
        }
    },
    "tx": {
        "amount": {
            "denom": "uatom",
            "amount": "10000" // how many does tx send for each request.
          },
        "fee": {
            "amount": [
                {
                  "amount": "1000",
                  "denom":  "uatom"
                }
            ],
            "gas": "200000"
        },
        "frequency_in_24h": "1"
    },
    "project": {
        "testnet": "Ping Testnet", // What ever you want, recommend: chain-id, 
        "logo": "https://ping.pub/logo.svg",
        "deployer": ""
    },
    // request limitation
    limit: {
        // how many times each wallet address is allowed in a window(24h)
        address: 1, 
        // how many times each ip is allowed in a window(24h),
        // if you use proxy, double check if the req.ip returns client's ip.
        ip: 10 
    }
}
 ```
 
 - Run faucet
 ```sh
 node --es-module-specifier-resolution=node faucet.js
 ```
 
 # Test
 
 visit http://localhost:80 
 
 80 is default, you can edit it in the config.json
 
 # Donation

Your donation will help us make better products. Thanks in advance.

 - Address for ERC20: USDC, USDT, ETH
```
0x88BFec573Dd3E4b7d2E6BfD4D0D6B11F843F8aa1
```

 - You can donate any token in the Cosmos ecosystem: [here](https://ping.pub/coffee)
 
 
# Enable reCaptcha
Follow these steps to enable reCaptcha on the front and back end:

1. Register the Site with reCAPTCHA: Go to the [Google reCAPTCHA Admin console](https://www.google.com/recaptcha/admin/create), register thr site, and choose the type of reCAPTCHA. You'll receive a site key and a secret key after registration.
2. Update the `config.js` file with the following section:
```
export default {
    ... // existing config
    captcha:
    {
        enabled: true,
        siteKey: "<<INSERT SITE KEY>>", //shared with the user
        siteSecret: "<<INSERT SITE SECRET>>" //not shared with the user. Server side only.
    },
```
 
# Enable Proof-of-Work
The faucet has a simple implementation of a proof-of-work challenge to prevent abuse of the faucet.

To enable pow protection add the following to section to the config.js file.
> The difficulty is how many 0's the hash needs to start with. On a Macbook Pro M1, difficulty 6 typically takes around 20-80 seconds.
```
export default {
    ... // existing config
    pow: {
        enabled: true,
        difficulty: 6
    },
```

The nonce is saved to the database, when the nonce is verified it is removed from the database, the serverside will also perform a timestamp check. The time window is dynamically calculated based on the difficulty factor.