import {stringToPath} from '@cosmjs/crypto'

export default {
    port: 8000, // http port
    db: {
        path: "./db/faucet.db" // save request states
    },
    project: {
        name: "Mantrachain",
        logo: "",
        deployer: `<a href="#">Limechain</a>`
    },
    web2: {
        enabled: true,
        home: './index.html'
    },
    discord: {
        enabled: false,
        appId: "",
        discordToken: "",
        publicKey: "",
        discordInvite: "https://discord.gg/",
        explorer: "https://explorer"
    },
    blockchains: [
        {
            name: "omstead_7888-1",
            endpoint: {
                // make sure that CORS is enabled in rpc section in config.toml
                // cors_allowed_origins = ["*"]
                rpc_endpoint: "https://rpc.omstead.io",
            },
            sender: {
                mnemonic: "beauty genre icon salmon receive year unique butter noble bench abandon acid tornado kite travel safe ocean keep enhance wife atom diesel dragon bright",
                option: {
                    hdPaths: [
                      stringToPath(
                        "m/44'/118'/0'/0/0"
                      )
                    ],
                    prefix: "mantra"
                }
            },
            tx: {
                amount: {
                    denom: "uom",
                    amount: "10000000"
                },
                fee: {
                    amount: [
                        {
                            amount: "2000",
                            denom: "uom"
                        }
                    ],
                    gas: "200000"
                },
            },
            limit: {
                // how many times each wallet address is allowed in a window(24h)
                address: 1,
                // how many times each ip is allowed in a window(24h),
                // if you use proxy, double check if the req.ip is return client's ip.
                ip: 10
            }
        },

    ]
}
