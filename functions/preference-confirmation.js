const crypto = require("crypto");
const fetch = require("node-fetch");
const airtable = require('airtable');

// Setup Vero and Airtable
const VERO_AUTH_TOKEN = process.env.VERO_AUTH_TOKEN;
const AT_API_KEY = process.env.AT_API_KEY;
const AT_BASE = process.env.AT_BASE;
const AT_SUBSCRIPTION_TABLE = process.env.AT_SUBSCRIPTION_TABLE;
const AT_CONFIRMATION_TABLE = process.env.AT_CONFIRMATION_TABLE;

// Setup cipher stuff
const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.CIPHER_ENCRYPTION_KEY;

// Saves the user to Airtable
function save_user(email_address) {
  // The Promise is really important here. Lambda functions (which Netlify runs behind the scenes)
  // will terminate soon as a the code "returns". A promise tells the code to wait until it gets
  // a response, at which point it can return that response/result.
  return new Promise((resolve, reject) => {
    airtable.configure({apiKey: AT_API_KEY});
    base = airtable.base(AT_BASE);

    base(AT_CONFIRMATION_TABLE).create([{"fields": {"Email": email_address}}], function(err, records) {
      if (err) {
        reject(err);
        return;
      }
      console.log('Should resolve records')
      resolve(records);
    })
  })
}

// Decrypt secure URL
function decrypt(text){
  text_parts = text.split(':');
  init_vector = Buffer.from(text_parts.shift(), 'hex');
  encrypted_text = Buffer.from(text_parts.join(':'), 'hex');
  decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), init_vector);
  decrypted = decipher.update(encrypted_text);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

// Just means less repeated code
function error_handler(err) {
  console.error(err)
  return {
    statusCode: 500,
    body: "Oops! Something went wrong."
  }
}

exports.handler = async function(event, context) {
  // Decrypt the hash into the raw email address
  encrypted_text = event.path.split("/").pop();
  email = decrypt(encrypted_text);

  // Prepare the promise
  save_user_promise = save_user(email);

  // Save to Airtable and, if successful, return the function
  return save_user_promise
  .then(() => {
    return {
      statusCode: 301,
      headers: {
        Location: '/preference-confirmation-thanks/'
      }
    }
  })
  .catch(err => error_handler(err));
}