# Serverless hoepel.app back-end

These Firebase functions power the back end of `hoepel.app`.

## Configuration

Set these keys using `firebase functions:config`.

```
{
  "cloudbuild": {
    "slackwebhook": "https://hooks.slack.com/services/..."
  },
  "mailgun": {
    "apikey": "...",
    "domain": "..."
  }
}
```

## Run functions locally

First, get the config:

```
firebase functions:config:get > .runtimeconfig.json
```

Get a service account key and export it:

```
export GOOGLE_APPLICATION_CREDENTIALS=key.json
```

Then, serve using Firebase emulator:

```
firebase emulators:start --only functions
```

## Enabling CORS on GCP buckets

`cors.json`:

```
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Then run:

```
gsutil cors set cors.json gs://hoepel-app.appspot.com
```

