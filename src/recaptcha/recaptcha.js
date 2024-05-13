import axios from 'axios';



async function verifyRecaptcha(recaptchaResponse, secretKey, logger) {
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;
  
    try {
      const response = await axios.post(url);

      if(!response.data.success)
        logger.error('Recaptcha check returned false', response.data['error-codes'])

      return response.data.success;  // returns true if verification is successful
    } catch (error) {
      logger.error('Error verifying CAPTCHA', error);
      return false;  // return false if there's an error during verification
    }
  }
  
export default verifyRecaptcha;