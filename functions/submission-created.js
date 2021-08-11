const crypto = require("crypto");
const fetch = require("node-fetch");
const airtable = require('airtable');

// Setup Airtable
const AT_API_KEY = process.env.AT_API_KEY;
const AT_BASE = process.env.AT_BASE;
const AT_SUBSCRIPTION_TABLE = process.env.AT_SUBSCRIPTION_TABLE;
const AT_CONFIRMATION_TABLE = process.env.AT_CONFIRMATION_TABLE;

// Setup cipher stuff
const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.CIPHER_ENCRYPTION_KEY;

// (Optional) Setup Vero if using that for emails
// const VERO_AUTH_TOKEN = process.env.VERO_AUTH_TOKEN;

function encrypt(text) {
  init_vector = crypto.randomBytes(16);
  cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), init_vector);
  encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return init_vector.toString('hex') + ':' + encrypted.toString('hex');
}

// Save user to Airtable
const save_user = async (email) => {
  return new Promise((resolve, reject) => {
    airtable.configure({apiKey: AT_API_KEY});

    base = airtable.base(AT_BASE);
    base(AT_SUBSCRIPTION_TABLE).create({"Email": email}, err => {
      if (err) return reject(err);

      resolve();
    });
  });
}

// Send confirmation email via your preferred service. Here we use Vero Workflows.
const send_confirmation_email = async (email_address, confirmation_url) => {
    body = {
      auth_token: VERO_AUTH_TOKEN,
      identity: {
        email: email_address
      },
      event_name: 'Preference subscribed',
      data: {
        confirmation_url: confirmation_url
      }
    }

    response = await fetch('https://api.getvero.com/api/v2/events/track', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'}
    });

    response = await response.json();
}

exports.handler = async function(event, context) {
  submission_path = event.path;
  submission_payload = JSON.parse(event.body).payload;

  // Handle our newsletter subscription
  if(submission_path == "/preference-subscription-thanks/") {
    email_address = submission_payload.email;

    // Save raw log to Airtable
    save_user(email_address);

    // Generate a secure confirmation URL using the email
    encrypted_email_address = encrypt(email_address);
    confirmation_url = "/preference-confirmation/" + encrypted_email_address;
    console.log(confirmation_url)

    // Send the confirmation email — commented out for the demo
    // send_confirmation_email(email_address, confirmation_url)

    return {
      statusCode: 301,
      headers: {
        Location: "/preference-subscription-thanks/"
      }
    }
  }
}