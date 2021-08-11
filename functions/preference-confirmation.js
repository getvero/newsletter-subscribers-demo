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

// Save user to Airtable
const save_user = async (email) => {
  return new Promise((resolve, reject) => {
    airtable.configure({apiKey: AT_API_KEY});

    base = airtable.base(AT_BASE);
    base(AT_CONFIRMATION_TABLE).create({"Email": email}, err => {
      if (err) return reject(err);

      resolve();
    });
  });
};

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

exports.handler = async function(event, context) {
  encrypted_text = event.path.split("/").pop();

  // Try / catch would be nice
  email = decrypt(encrypted_text);

  await save_user(email);

  return {
    statusCode: 301,
    headers: {
      Location: '/preference-confirmation-thanks/'
    }
  }
}