# Worksheet for installing, configuring, debugging, and successfully running the ETL Tutorial

This worksheet attempts you walk you through the entire process of installing,
configuring, debugging, and successfully running the ETL Tutorial, from start to
finish.

You'll know you've successfully completed this entire process if you can
determine which famous comedian appears in our test user's sample passport
photo!

### References

Here are some useful links and reference you may find useful as you work your
way through this worksheet:

- PodSpaces registration: https://start.inrupt.com/
- Yopmail: https://yopmail.com/en/
- Password generator: https://passwordsgenerator.net/
- Broker: https://broker.pod.inrupt.com/

- PodPro: https://podpro.dev/
- Penny: https://penny.vincenttunru.com/
- PodBrowser: https://podbrowser.inrupt.com/

## Pre-requisites

1. Before we run through this process, first ensure you're on at least Node.js
   version 14.18:

   ```
   $ node --version
   v14.18.2

   $ npm --version
   6.14.15
   ```

2. Create a Pod to represent your particular instance of this ETL Tutorial
   application. We really only need a WebID, but the easiest way to get a WebID
   is simply to create a Pod.
3. Create a Pod for our test user. This will be the Pod into which we want our
   ETL tool to Load data Extracted from multiple 3rd-parties.

---

When creating Pods generally, it can be very helpful to keep a record of the
various pieces of credential information (for example in a password manager).
We provide a very simple credential template below, which you may find useful:

```
Test User Pod:
  username: <MY-NAME>BurnerUser1
  password: <Generated using https://passwordsgenerator.net/>
  email: <Generated using https://yopmail.com/>

  WebID: https://id.inrupt.com/<MY-NAME-LOWERCASE>burneruser1
  Storage: https://storage.inrupt.com/XXXXXXXX-YYYY-ZZZZ-AAAA-BBBBBBBBBBBB/

ETL Tutorial Pod:
  username: <MY-NAME>BurnerEtl1
  password: <Generated using https://passwordsgenerator.net/>
  email: <Generated using https://yopmail.com/>

  WebID: https://id.inrupt.com/<MY-NAME-LOWERCASE>burneretl1
  Storage: https://storage.inrupt.com/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/

  ClientID: <ETL_TUTORIAL_CLIENT_ID>
  ClientSecret: <ETL_TUTORIAL_CLIENT_SECRET>
```

---

## PHASE 1 - Basic code installation, and running tests.

Pull down the **_ETL Tutorial_** codebase:

```
git clone git@github.com:inrupt/etl-tutorial.git
```

Run the code generation phase for our local vocabularies (this will generate
local TypeScript source code providing convenient constants for all the terms
defined in the local vocabularies that we created to represent concepts from the
sample 3rd-party data sources we Extract from (e.g., for concepts like a
Passport, or a passport number, as might be defined by a government Passport
Office; or the concepts related to a person's hobbies):

```
npx @inrupt/artifact-generator generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noPrompt --force --publish npmInstallAndBuild
```

Now install (**_note_**: we use `ci` instead of `install` to ensure a
deterministic, repeatable installation):

```
npm ci
```

Now build the project (since this is a TypeScript codebase):

```
npm run build
```

Now run the unit test suite:

```
npm test
```

- We expect to see some red error output (as we test all our error handling, so
  this is normal and expected).
- All tests should pass.
- Branch code coverage should be 100% - i.e., green right across the board!

---

## PHASE 2 - Run ETL (without configuring anything yet)

Let's first run our ETL Tutorial without any commands, just to see what options
we have.

---

**_Note_**: We recommend using `ts-node` to run the remaining commands, as its
faster and more convenient. We generally don't recommend installing modules
globally as you'll have problems if multiple applications require modules, like
`ts-node`, to be globally installed, but with different versions, etc.

So instead we've provided `ts-node` as a dev dependency of this project, meaning
you can run it conveniently using `npx`, or less convenient by explicitly using
`./node_modules/.bin/ts-node`. All our examples below use `npx`.

Remember that using `ts-node` is completely optional, and if it doesn't install
or run correctly for you, simply replace all references below of `npx ts-node`
with the standard `node` instead.

---

So to view our options for running the ETL Tutorial, run:

```
npx ts-node src/index.ts
```

Now run with the 'runEtl' command, but no arguments yet...

```
npx ts-node src/index.ts runEtl
```

...and we see that there are two **_required_** arguments needed to run any ETL
job:

- etlCredentialResource - the filename of a local Linked Data resource (e.g.,
  a Turtle file) containing the required credentials we need for our ETL tool
  itself.
  This is required since our tool needs to have a valid Access Token that
  effectively identifies itself, so that it can then attempt to write data into
  the Pods of end users on their behalf (if those users explicitly granted it
  permission to do so, of course!).
- localUserCredentialResourceGlob - this is a file pattern that can contain
  wildcards (including for subdirectories) that tells our ETL tool what
  local filenames it should search for, expecting matching files to be user
  credential resources (e.g., Turtle files).
  These user credential resources are needed by our tool so that it can log into
  potentially multiple 3d-party data sources on behalf of that user to Extract
  relevant data that we then Transform into Linked Data, and Load into that
  user's Pod.

Run with our example Turtle configurations (note the use of a wildcard (e.g., an
asterisk `*`) in the file pattern for user credentials):

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential*.ttl"
```

---

**Note**: If we have no internet connection, we'll expect to see the following
(our code should really exit with a descriptive error message here instead!):

```
failed, reason: getaddrinfo ENOTFOUND api.company-information.service.gov.uk
```

---

## Successful ETL flow

We should see a lot of console output, much of it duplicated because our file
pattern contained a wildcard, and matched two local user credential resources.

### Run with one test user (just for less output)

From here on, there's no need to continue demonstrating the ETL processes
ability to execute across multiple users, so we'll replace the wildcard in the
user credential resource argument and just provide a single user's credentials
to reduce the amount of output we generate:

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

So walking through this console output slowly, we should see that our ETL
process starts by attempting to log into its own Identity Provider (IdP) as
specified in the local ETL credential resource we provided via the
`--etlCredentialResource` command-line argument. It successfully parses that
resource, but finds no credentials in there (since we haven't configured them
yet!), so it ignores the IdP login stage.

This is totally fine, as, for example, we may only wish our ETL process to
populate a Linked Data database (called a triplestore), and not attempt to write
to any user Pods at all.

Next our tool searches for local resources matching the file pattern we provided
for user credential resources via the `--localUserCredentialResourceGlob`
command-line argument, and it should find, and successfully parse, two such
local resources.

For each of the two user credential resources it finds it then:

- Attempts to clear out existing user data from the triplestore (but we
  haven't configured one yet, so this is ignored).
- Attempts to clear out existing user data from the current user's Pod (but we
  haven't configured them yet, so this is ignored).
- Creates a dummy ProfileDocument for this user. Even though we didn't attempt
  to get an Access Token (via the ETL tool logging into it's IdP), the code
  assumes that we **_may_** want to write a triplestore, and so it creates this
  dummy resource just in case.
- Creates a number of ETL Tutorial-specific resources, such as containers
  intended to contain all the data we expect we Load into a user's Pod.

The ETL process then attempts to connect to each of the multiple potential data
sources of user data, and for each one attempts to Extract relevant data for the
current user.

Data sources that Extract from local files, or from sample in-memory objects,
will work fine without any further configuration, but data sources that require
credentials to access real 3rd-party APIs will fail (since we haven't configured
their required credentials yet), and will therefore be ignored.

In each case, writing any successfully Extracted and Transformed resources will
not be written to user Pods or a triplestore at this stage, since we haven't
configured those yet!

## PHASE 2.5 (Optionally) load data into a triplestore and visualize it.

It can be **_extremely_** helpful to visualize the data we are Loading,
especially when developing data models for new data sources, which may go
through multiple phases of iteration.

Perhaps the most convenient way to do this is using a triplestore (see
[here](../VisualizePodData/VisualizeExamplePodData.png) for a screenshot of a
sample Pod with lots of highly inter-related personal data).

If you don't already have a triplestore, you can follow the very simple
instructions [here](../VisualizePodData/VisualizePodData.md) to install,
configure, load, and visualize sample Pod data yourself using a free triplestore
locally in **_less than 10 minutes_**.

Once you have a triplestore running (locally or remotely), you can populate
that right away using our ETL tool by simply editing just a single line of a
user's credential resource (or by editing your new local `.env` file - but see
the [Advanced Worksheet](./Worksheet-Advanced.md) for details on that approach).

So assuming that you do have GraphDB installed and running locally, and it's
listening on its default port of `7200`, **_and_** that you've already created a
new repository named `inrupt-etl-tutorial`:

```
# Use gedit, vim, VSCode, or any text editor to edit our sample user resource:
gedit ./resources/CredentialResource/User/example-user-credential-1.ttl
```

...and just uncommenting this line (editing it accordingly to match the port and
repository name in your trplestore):

```
INRUPT_TRIPLESTORE_ENDPOINT_UPDATE="http://localhost:7200/repositories/inrupt-etl-tutorial/statements"
```

Now re-run your ETL process:

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

- Our console output should show local data being Extracted and Transformed to
  Linked Data as before.
- **_But now_** we should also see that data Loaded as Resources from the
  Passport Office data source and the Hobby data source into the triplestore
  (our Companies House data source is still being ignored, as we haven't yet
  configured the necessary API credentials).
- To see this data in the triplestore, open GraphDB:
  - Make sure you select the `inrupt-etl-tutorial` repository (i.e., or
    whatever repository name you created and configured).
  - Simply visualize this node:
    `https://test.example.com/test-user/profile/card#me`
  - You should be able to intuitively navigate through the ETL-ed data.

Make a change, such as extending the passport expiry date, to the local Passport
data (e.g., in the JSON in `src/dataSource/clientPassportInMemory.ts`), and
re-run:

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

...and you should see your change reflected in the data now in the triplestore
when you refresh the visualization.

## PHASE 3 - (Optionally) configure Companies House API

Our ETL Tutorial also demonstrates accessing a real public 3rd-party API, in
this case the Company Search API from the Companies House in the UK.

To use this API, a developer needs to register to get an API Auth Token that
allows them to make API requests - see
[here](https://developer-specs.company-information.service.gov.uk/guides/authorisation)
for instructions on how to register.

For now, and for ease of demonstration, we're going to simply reuse a test Auth
Token provided by your instructor.

Edit our single user credentials resource again:

```
# Use gedit, vim, VSCode, or any text editor:
gedit ./resources/CredentialResource/User/example-user-credential-1.ttl
```

...and paste the provided token as the value of this triple (should be the last
line of the file):

```
  inrupt_3rd_party_companies_house_uk:authenticationHttpBasicToken "<PASTE_TOKEN_HERE>" .
```

Now re-run your ETL process:

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

- Now our console output should show local data being Extracted and Transformed
  to Linked Data as before.
- **_But now_** we should also see data Loaded as Resources from the Companies
  House data source too.
- If we configured a triplestore, we'll also see a new data source container
  containing multiple resources - one for the company search result, and a
  connected resource for that company's registered address (can you
  see which company was searched for, and where it's registered in the UK?)

## PHASE 4 - Registering our ETL Tutorial application

Now we'll Register your ETL Tutorial application with the Identity Provider
(IdP) you used to create its Pod. This registration process will provide us with
standard OAuth `ClientID` and `ClientSecret` values, which we can then use to
configure your ETL process to allow it to login automatically (i.e., without any
human intervention whatsoever).

**_Note_**: This is just the standard OAuth Client Credentials flow.

Go to:

```
https://login.inrupt.com/registration.html
```

Login with your **_ETL Tutorial_** username and password (do **_not_** use
your test user credentials by mistake!), and register your ETL Tutorial
instance with whatever name you like, e.g., `InruptEtlTutorial`.

Record the resulting `ClientID` and `ClientSecret` values (using a password
manager, or our simple credentials template from the pre-requisites section
above).

## PHASE 5 - Configure our ETL's `ClientId` and `ClientSecret` values

Now we simply edit our ETL Credentials resource to add the `ClientId` and
`ClientSecret` values.

```
# Use gedit, vim, VSCode, or any text editor:
gedit ./resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl
```

...and paste in our registration values into the respective values of their
corresponding triples:

```
  inrupt_common:clientId "<PASTE IN ETL TUTORIAL CLIENT ID>" ;
  inrupt_common:clientSecret "<PASTE IN ETL TUTORIAL CLIENT SECRET>" ;
```

Save the ETL credentials resource, and re-run your ETL process again
(**_note_**: we should expect failures!):

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

Now we should see a successful login by the ETL Tutorial application into its
Solid Pod. The login will result in our application's WebID being displayed in
the console output.

But later in the process, we should see that we fail to find a valid Storage
Root configuration for our test user. This is simply because we still haven't
configured our test users credentials - so let's do that now...

## PHASE 6 - Configure our test users WebID and StorageRoot

Edit our user credentials resource again:

```
# Use gedit, vim, VSCode, or any text editor:
gedit ./resources/CredentialResource/User/example-user-credential-1.ttl
```

This time we wish to add the values we received when we first created this test
user's Pod (and that we recorded in the credential template).

```
  solid:webId "https://id.inrupt.com/<YOUR-USERNAME-LOWERCASE>burneruser1" ;
  solid:storageRoot "https://storage.inrupt.com/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/" ;
```

Save our user credentials resource, and re-run your ETL process again
(**_note_**: we should **_still_** expect to see failures!):

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

This time we should see a different failure. This time it's a `403 Forbidden`
error, **_which is exactly what we should expect!_**

This test user has not yet granted permission for our ETL Tutorial application
to write to their Pod! So let's go do that now...

## PHASE 7 - Test user granting permission to our ETL Tutorial application

For this operation, we're going to use Inrupt's open-source PodBrowser tool.

In a **_new Incognito window_** (make sure you don't have any other Incognito
windows open, as session state is shared even for Incognito tabs, across browser
instances!), go to: `https://podbrowser.inrupt.com/`.

---

**_Note_**: Temporarily, you must **_NOT_** click the big 'Sign In' button here,
but instead click on the 'SIGN IN WITH OTHER PROVIDER', and enter the latest ESS
Broker URL of `https://login.inrupt.com`, then click 'GO'.

---

Log in as the test user you created earlier (be careful not to login as the ETL
Tutorial by mistake!).

---

Create a new `private` folder.

Click on the line of your new folder (don't click on the text of the folder
name, as that will navigate _into_ the `private` folder itself! If you do that,
simply click back to the parent container using the breadcrumbs just under the
`Files` heading).

On the right-hand side of the page you should see a big sidebar open up, and in
there an option for Sharing. Open that Sharing pane, and you'll see a section
for `Editors`.

Click `EDIT EDITORS`, then click `ADD WEBID`, and in the text box paste in the
**_ETL Tutorial's WebID_** (be careful to paste in the ETL Tutorial's WebID, and
not the test user's WebID!).

Click the `ADD` button, then the `SAVE EDITORS` button, confirm the action, and
we should see the ETL Tutorial application's WebID appear as an Editor of this
`private` container resource in our test user's Pod.

Finally, re-run your ETL process again. This time we should have no failures!

```
npx ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

## PHASE 8 - Navigate to the Loaded resources in the user's Pod

Now use [PodBrowser](https://podbrowser.inrupt.com/) to navigate our Loaded
resources - see if you can find, download, and view the test user's sample
Passport photo :) !

As a starting point, we should see containers for all the data sources we
successfully ETL'ed for this user here:

```
/private/inrupt/etl-tutorial/etl-run-1/dataSource/
```

## PHASE 9 - See the Linked Data (as Turtle) in the user's Pod

PodPro ([https://podpro.dev/](https://podpro.dev/)) is another really nice
open-source project for browsing the data in Pods, especially for developers as
it very nicely displays the contents of all Linked Data resources as Turtle.

Log into your test user's Pod using PodPro by clicking on the Login icon in the
bottom-left-hand-side of the page, and you'll need to paste in, or select, the
PodSpaces broker (i.e., `https://login.inrupt.com/`).

By navigating the resources and viewing the Linked Data triples, can you find
where our test user skydives as a hobby in Ireland?

## PHASE 10 - Congratulate yourself!

If you made it all the way through this worksheet, then congratulations!

You've certainly covered a lot of ground, and managed to install, run,
configure, debug, and successfully execute a sophisticated full End-to-End ETL
process resulting in the population of a user Pod from multiple 3rd-party data
sources.

Well done!
