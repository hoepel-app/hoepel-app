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
  },
  "environment": "production"
}
```

## Run functions locally

First, get the config:

```
$ firebase functions:config:get > .runtimeconfig.json
```

Get a service account key and place it in this directory as `key.json`.

Then, serve using Firebase emulator:

```
$ yarn shell
```

## Why functions are bundled before shipping them to Firebase

Webpack is used to bundle functions in `dist-webpack` with a minimal `package.json` file before deploying that folder to Firebase Functions. The reason is that Firebase Functions uses `package.json` to load dependencies on invocation. They cache heavily used packages, but if you use an obscure package or version, you may run into long cold start-up times. Also, it seems to have problems with packages that were recently (<15m ago) published to NPM, leading to non-deterministic behaviour (often only for a subset of functions, even when they depend on the same package!). This breaks a monorepo CI workflow, where packages are dependent on others in the same monorepo, and get published right before deployment.

Therefore, functions are bundled locally. Firebase is then asked to publish the bundled functions.

I'm not sure how versions are handled, since no lockfile is shipped (it wasn't before either). Could versions get out of sync compared to a local version?

Some packages are in the Webpack externals. They will be added as `dependencies` to the generated `package.json` and thus be loaded by the Functions runtime. This is done for packages that are very likely cached by the runtime (such as `firebase-*` packages) or packages that cause trouble with Webpack.

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
$ gsutil cors set cors.json gs://hoepel-app.appspot.com
```
