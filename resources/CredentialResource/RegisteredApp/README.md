# Registered Application Credentials directory

This directory contains credentials files for registered applications, such as
our ETL tutorial application.

## Create a Solid Pod for our ETL application

Our ETL tutorial application needs these credentials to log into its own Solid
Pod. Really, it just needs its own valid WebID. The easiest way to get a WebID
is simply to create a Pod.

## Register our ETL application with its Identity Provider

Once our application has a Solid Pod, it needs to be registered as an
application (or 'bot') with its Identity Provider (IdP), which will generate
`clientID` and `clientSecret` values that can then be pasted into a new local
credentials file in this directory.

For example, using PodSpaces this registration can be done here:

```
https://login.inrupt.com/registration.html
```

You'll be asked to login (as the ETL tutorial application itself, not as a human
user!), and then asked to provide a simple text name for the application to be
registered (you can provide any description here, e.g., "ETL Tutorial").

## Storing credentials in a local Turtle file

The generated `clientID` and `clientSecret` values can now be pasted into a new
credentials file in this directory, by first making a copy of the example file
`example-registered-app-credential.ttl`, and then pasting in the values as
appropriate.

## Using the credentials file when running the ETL application

The credentials Turtle file is then specified as a command-line parameter when
running the ETL tutorial application itself. For example, to run the entire ETL
process for all users with credential resources (e.g., Turtle files) in the
folder `./RealUsers`:

```
ts-node src/index.ts runEtl --etlCredentialResource <MY-REGISTERED-APP-CREDENTIAL-FILE.ttl> --localUserCredentialResourceGlob "./RealUsers/USER-CREDENTIALS-*.ttl"
```
