import {stringToPath} from '@cosmjs/crypto'

export default {
    port: 8000, // http port
    db: {
        path: "./db/faucet.db" // save request states
    },
    project: {
        name: "Mantrachain",
        logo: "",
        deployer: `<a href="#">Limechain</a>`,
    },
    captcha:
    {
        enabled: false,
        siteKey: "6Ldz38IpAAAAAAvHwzJa8UjnsYND9EKSDS-j9vuY",
        siteSecret: "6Ldz38IpAAAAAG2OjztKp5twAStcwUyTGyZQMEzM" //this is not secure.
    },
    pow: {
        enabled: false,
        difficulty: 4
    },
    blockchains: [
        {
            name: "mantrachain-devnet-9001",
            endpoint: {
                // make sure that CORS is enabled in rpc section in config.toml
                // cors_allowed_origins = ["*"]
                rpc_endpoint: "https://dev-chain.mantra.finance:26657/",
            },
            sender: {
                mnemonic: "captain roast forget tree cliff common peasant unhappy reflect hole they essence trash paper slab carpet engine exist urge bulk kite trade rocket kid",
                option: {
                    hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
                    prefix: "mantra"
                }
            },
            tx: {
                amount: {
                    denom: "uom",
                    amount: "500000"
                },
                fee: {
                    amount: [
                        {
                            amount: "20",
                            denom: "uom"
                        }
                    ],
                    gas: "200000"
                },
            },
            limit: {
                // how many times each wallet address is allowed in a window(24h)
                address: 10,
                // how many times each ip is allowed in a window(24h),
                // if you use proxy, double check if the req.ip is return client's ip.
                ip: 10
            }
        },

    ]
}