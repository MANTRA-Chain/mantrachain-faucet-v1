importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js');

self.onmessage = function(e) {
    const { nonce, difficulty } = e.data;
    let solution = 0;
    let hash;
    let attempts = 0;
    const maxAttempts = 10000000; // For progress calculation
    const target = '0'.repeat(difficulty);

    self.postMessage({ type: 'progress', progress: 0});
    do {
        hash = CryptoJS.SHA256(nonce + solution).toString(CryptoJS.enc.Hex);

        if (hash.startsWith(target)) {            
            self.postMessage({ type: 'solved', solution });
            break;
        }

        if (attempts % 100000 === 0) { // Update progress every 100 attempts
            self.postMessage({ type: 'progress', progress: Math.round((attempts/maxAttempts) * 100) });
            if(attempts === maxAttempts)
                attempts = 0;
        }

        solution++;
        attempts++;
    } while (true);
};
