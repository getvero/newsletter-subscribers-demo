# Netlify + Airtable + Vero Newsletters template

You can use this template locally with the [Netlify CLI](https://docs.netlify.com/cli/get-started/) or in production with Netlify.

## The flow

Users fill out the newsletter subscription form. The form submission is handled automatically by Netlify. This will trigger a function (`submission-created.js`). This function [fires every time any form is submitted in Netlify](https://docs.netlify.com/functions/trigger-on-events/#available-triggers).

When submitted we store the submission in Airtable. We also generate a secure URL that can be emailed to the subscriber in order to get a double opt-in. In this demonstration we have left the email function blank (you can fill it in using your service of choice) and instead simply log the confirmation URL.

Once submitted, grab the confirmation URL, enter it in your browser and the double opt-in is complete!

## Setup API keys

You'll need to set the following environment (`ENV`) variables. If hosting in production on Netlify you can set `ENV` vars using the Netlify UI. If running locally you can add these to a `.env` file. This file isn't be checked in to Github for security reasons.

List of `ENV` vars you'll need:

- `VERO_AUTH_TOKEN`
- `CIPHER_ENCRYPTION_KEY`
- `AT_API_KEY`
- `AT_BASE`
- `AT_TABLE`


