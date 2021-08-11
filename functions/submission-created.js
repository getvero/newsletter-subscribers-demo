const crypto = require("crypto");
const fetch = require("node-fetch");
const airtable = require('airtable');

// // Setup Airtable
const AT_API_KEY = process.env.AT_API_KEY;
const AT_BASE = process.env.AT_BASE;
const AT_SUBSCRIPTION_TABLE = process.env.AT_SUBSCRIPTION_TABLE;
const AT_CONFIRMATION_TABLE = process.env.AT_CONFIRMATION_TABLE;

// Setup cipher stuff
const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.CIPHER_ENCRYPTION_KEY;

// Setup Vero if using that for emails
const VERO_AUTH_TOKEN = process.env.VERO_AUTH_TOKEN;

// Encrypts the subscriber email
function encrypt(text) {
  init_vector = crypto.randomBytes(16);
  cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), init_vector);
  encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return init_vector.toString('hex') + ':' + encrypted.toString('hex');
}

// Saves the user to Airtable
function save_user(email) {
  // The Promise is really important here. Lambda functions (which Netlify runs behind the scenes)
  // will terminate soon as a the code "returns". A promise tells the code to wait until it gets
  // a response, at which point it can return that response/result.
  return new Promise((resolve, reject) => {
    airtable.configure({apiKey: AT_API_KEY});
    base = airtable.base(AT_BASE);

    base(AT_SUBSCRIPTION_TABLE).create([{"fields": {"Email": email_address}}], function(err, records) {
      if (err) {
        reject(err);
        return;
      }
      console.log('Should resolve records')
      resolve(records);
    })
  })
}

// Send confirmation email via your preferred service. Here we use Vero Workflows, but you could
// use any automated service.
function send_confirmation_email(email_address, confirmation_url) {
  return new Promise((resolve, reject) => {
    request_body = {
      auth_token: VERO_AUTH_TOKEN,
      identity: {
        email: email_address
      },
      event_name: 'Preference subscribed',
      data: {
        confirmation_url: confirmation_url
      }
    }

    try {
      fetch('https://api.getvero.com/api/v2/events/track', {
        method: 'POST',
        body: JSON.stringify(request_body),
        headers: {'Content-Type': 'application/json'}
      }).then(res => {
        resolve(res.json());
      });
    } catch (err) {
      reject(err);
      return;
    }
  })
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
  submission_path = event.path;
  submission_payload = JSON.parse(event.body).payload;
  form_name = submission_payload.form_name;

  // Handle our newsletter subscription
  if(form_name == "newsletter-subscribe" || submission_path == "/preference-subscription-thanks/") {
    email_address = submission_payload.email;

    // Generate a secure confirmation URL using the email
    encrypted_email_address = encrypt(email_address);
    confirmation_url = "/preference-confirmation/" + encrypted_email_address;

    // Log so we can see it run
    console.log(email_address);
    console.log(confirmation_url)

    // Setup promises
    save_user = save_user(email_address);
    send_confirmation_email = send_confirmation_email(email_address, confirmation_url);

    // Now let's save the user to Airtable and, if that's successful, send the confirmation
    // email and, if that's successful, return the function as complete!
    return save_user
    .then((records) => {
      records.forEach((record) => {
        console.log(record.getId());
      });
      return send_confirmation_email
      .then((response) => {
        return {
          statusCode: 200,
          body: "Form successfully submitted."
        }
      })
      .catch(err => error_handler(err));
    })
    .catch(err => error_handler(err));
  }
}