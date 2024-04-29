//import { expect, use  } from 'chai';
import {use, expect} from 'chai';
import chaiHttp from 'chai-http';
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' });
import createFaucet from '../faucet.js'; 
import config from './config.intergrationtests.js';

let chai = use(chaiHttp);


describe('Simultaneous Requests to /send', function() {
    it('should handle three simultaneous requests correctly', function(done) {
       
        const app = createFaucet(config);  // Make sure to await the creation of the app

        this.timeout(60000); // Adjust timeout for potential delays in processing
        
        const accounts = [
            "mantra1f088a52skn4t7lk8uhpq3nurtv6d7xjmuza0l0",
            "mantra1f088a52skn4t7lk8uhpq3nurtv6d7xjmuza0l0",
            "mantra1f088a52skn4t7lk8uhpq3nurtv6d7xjmuza0l0"
        ]
        
    
        // Create an array of promises for simultaneous requests
        const requests = accounts.map(id => {
            return chai.request(app)
                .post(`/send/mantrachain-devnet-9001/${id}`)
                .send({
                    nonce: '',
                    timestamp: '',
                    solution: '',
                    recaptchaResponse: ''
                });
        });

        // Use Promise.all to send them all at once
        Promise.all(requests)
            .then(responses => {
                console.log("all requests done");
                // Check each response to ensure they succeeded
                responses.forEach(response => {
                    expect(response).to.have.status(200);
                    expect(response.body).to.have.property('result');
                });
                done();
            })
            .catch(err => {
                done(err);
            }).finally( () =>{
                app.close();
            });
    });
});
