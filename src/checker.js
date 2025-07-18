
import { Level } from "level";

const WINDOW = 86400 * 1000 // milliseconds in a day
// const WINDOW = 20 * 1000 // 20s for test

export class FrequencyChecker {
    constructor(conf) {
        this.conf = conf
        this.db = new Level(conf.db.path, { valueEncoding: 'json' });
    }

    async check(key, limit) {
        return new Promise((resolve) => {
            this.db.get(key, function (err, value) {
                const now = Date.now()
                if (err || value && value.filter(x => now - x < WINDOW).length < limit) {
                    resolve(true)
                    // console.log(key, limit, value, true)
                } else {
                    resolve(false)
                    // console.log(key, limit, false)
                }
            });
        })
    }

    async checkIp(ip, chain) {
        const chainLimit = this.conf.blockchains.find(x => x.name === chain)
        return chainLimit ? this.check(ip, chainLimit.limit.ip) : Promise.resolve(false)
    }

    async checkAddress(address, chain) {
        const chainLimit = this.conf.blockchains.find(x => x.name === chain)
        return chainLimit ? this.check(address, chainLimit.limit.address) : Promise.resolve(false)
    }

    async checkPOW(nonce) {
        return new Promise((resolve) => {
            this.db.get(nonce, function (err, value) {
                const now = Date.now()
                if (err || !value) {
                    //console.log(nonce, value);
                    resolve(undefined);
                } else {
                    //console.log(nonce, value);
                    resolve(value);
                }
            });
        })
    }

    async remove(key) {
        const db = this.db
        const entry = await db.get(key);
        if (entry) {
            await db.del(key);
        } else {
            console.log(`${key} key not found. Cannot remove.`);
        }
    }

    async update(key) {
        const db = this.db
        db.get(key, function (err, history) {
            if (err) {
                db.put(key, [Date.now()])
            } else {
                history.push(Date.now())
                db.put(key, history)
            }
        });
    }

    async close() {
        await this.db.close();
    }
}
