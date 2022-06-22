# Worksheet for installing, configuring and running the ETL Tutorial

This worksheet attempts you walk you through the entire process of installing,
configuring, testing, and running the ETL Tutorial, from start to finish.

### References

Here are some useful links and resources you can use during this worksheet:

- PodSpaces registration: https://start.inrupt.com/
- Yopmail: https://yopmail.com/en/
- Password generator: https://passwordsgenerator.net/
- Broker: https://broker.pod.inrupt.com/

- PodPro: https://podpro.dev/
- Penny: https://penny.vincenttunru.com/
- PodBrowser: https://podbrowser.inrupt.com/

## PHASE 1 - Basic code installation, and running tests.

Ensure you're on a Node.js version > 14.18 (should be fine on v16 too, but we've
tested on v14):

```
$ node --version
v14.18.2

$ npm --version
6.14.15
```

Pull down the **_ETL Tutorial_** codebase:

```
git clone git@github.com:inrupt/etl-tutorial.git
```

Run the code generation phase for our local vocabularies:

```
npx @inrupt/artifact-generator generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noPrompt --force --publish npmInstallAndBuild
```

Now run:

```
npm ci
```

Now run the unit test suite:

```
npm test
```

- We expect to see error output (as we test all our error handling).
- All tests should pass.
- And branch code coverage should be 100%.

---

## PHASE 2 - Run ETL (without configuring anything yet)

Run without any commands...

```
ts-node src/index.ts
```

Run with the 'runEtl' command...

```
ts-node src/index.ts runEtl
```

...and we see that there are two **_required_** arguments needed to run an ETL
job:

- etlCredentialResource - the filename of a local Linked Data resource (e.g.,
  a Turtle file) containing the required credentials we need for our ETL tool
  itself.
  This is required since our tool needs to have a valid Access Token that
  identifies itself, so that it can then attempt to write data into the Pods of
  end users on their behalf.
- localUserCredentialResourceGlob - this is a file pattern that can contain
  wildcards (including for subdirectories) that tells our ETL tool what
  local filenames it should expect find individual user credential resources
  (e.g., Turtle files).
  These end user credential resources are needed by our tool so that it can log
  into multiple 3d-party data sources on behalf of the user to Extract the
  relevant data (then Transforming it into Linked Data, and Loading it into that
  user's Pod).

Run with our example Turtle configs (note the use of a wildcard in the file
pattern for user credentials):

```
ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential*.ttl"
```

If we have no internet connection, we'll expect to see the following (**Note**:
our code should exit with a descriptive error message here instead!):

```
failed, reason: getaddrinfo ENOTFOUND api.company-information.service.gov.uk
```

We should see a lot of console output, but the walking through it slowly, we
should see that our tool starts to attempt to log into it's identity provider
(IdP) by reading the local ETL credential resource we provided, successfully
parses that resource, but finds no credentials in there (since we haven't
configured them yet!), and so it ignores the IdP login stage (this is fine, as,
for example, we may only wish our ETL process to populate a triplestore, and not
attempt to write to any user Pods at all).

Next our tool searches for local resources matching the pattern we provided for
user credential resources, and it should find, and successfully parse, two such
resources.

For each of the two users resources it finds it:

- Attempts to clear out existing user data from the triplestore (but we
  haven't configured one yet, so this is ignored).
- Attempts to clear out existing user data from the current user's Pod (but we
  haven't configured them yet, so this is ignored).
- Creates a dummy ProfileDocument for this user (since we didn't attempt to
  get an Access Token (via the ETL tool logging into it's IdP), the code
  assumes that we **_may_** want to write a triplestore, and so it creates this
  dummy resource just in case).
- Creates a number of ETL Tutorial-specific resources, such as containers
  intended to contain all the data we expect we Load into the user's Pod

The ETL process then attempts to connect to the various potential data sources
of user data, and for each one attempts to Extract (sources reading from local
resources will work, but source requiring credentials to access real 3rd-party
APIs will fail (due to missing credentials), and will therefore be ignored).

In each case, writing any successfully Extracted and Transformed resources will
not be written to user Pods or a triplestore at this stage (since we haven't
configured those yet).

For here on, there's no need to demonstrate the ETL process for multiple users,
so we can replace our wildcard in the user resource argument, and just provide
a single user's credential resource to reduce the amount of output we generate:

```
ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

## PHASE 2.5 (Optional) load data into a triplestore and visualizing it.

It can be **_extremely_** helpful to visualize the data we are Loading,
especially when developing data models for new data sources, which may go
through multiple phases of iteration.

Perhaps the most convenient way to do this is using a triplestore (see
[here](../VisualizePodData/VisualizeExamplePodData.png) for a screenshot of a
sample Pod with lots of data).

If you don't already have a triplestore, you can follow the very simple
instructions [here](../VisualizePodData/VisualizePodData.md) to install and
configure a free triplestore locally in **_less than 10 minutes_**.

Once you have a triplestore running (locally or remotely), you can populate
that right away by simply editing just one line of a user's credential
resource (or by editing your new local `.env` file - but see appendix below for
details on that approach).

So assuming you do have GraphDB installed and running locally, and it's
listening on its default port of `7200`, **_and_** that you've already created a
new repository named `inrupt-etl-tutorial`:

```
# Use gedit, vim, VSCode, or any text editor to edit a sample user resource:
gedit ./resources/CredentialResource/User/example-user-credential-1.ttl
```

...and just uncommenting this line (or editing it accordingly to your port and
repository name):

```
INRUPT_TRIPLESTORE_ENDPOINT_UPDATE="http://localhost:7200/repositories/inrupt-etl-tutorial/statements"
```

Now re-run our ETL process again:

```
ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

- Now our console output should show local data being Extracted, Transformed
  to Linked Data as before.
- **_But now_** we should see that data Loaded as Resources from the Passport
  Office data source into the triplestore.
- Open GraphDB:
  - Make sure you select the `inrupt-etl-tutorial` repository (i.e., or
    whichever repository you configured).
  - Simply visualize this node:
    `https://example.com/generatedUser-1/storageRoot/private/inrupt/etl-tutorial/etl-run-1/dataSource/PassportOffice-UK/`
    - (You could also navigate to  
      `https://test.example.com/test-user/profile/card#me` to see the WebID and
      the ETL containers, but it's not yet fully wired up to the ETL data!).
  - You should be able to intuitively navigate through the ETL-ed data.

Make a change to the local Passport data (e.g., in the JSON in
`src/dataSource/clientPassportInMemory.ts`), and re-run the test:

```
npm run e2e-test-node-localExtract-TransformLoad
```

...and you should see your change when you refresh the visualization.

```
ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/registered-app-credential-etl-tutorial.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/user-cred*.ttl"
```

## PHASE 3 - Configure Companies House API

For this ETL Tutorial we demonstrate accessing a real public 3rd-party API, in
this case the Company Search API from the Companies House in the UK.

To use this API, a developer needs to register to get an API Auth Token that
allows them make API requests.

For now, and for ease of demonstration, we're going to simply reuse a test Auth
Token (which will be provided by your instructor).

Edit our single user credentials resource again:

```
# Use gedit, vim, VSCode, or any text editor to edit a sample user resource:
gedit ./resources/CredentialResource/User/example-user-credential-1.ttl
```

...and paste the token as the value of this triple (should be the last line of
the file):

```
  inrupt_3rd_party_companies_house_uk:authenticationHttpBasicToken "<PASTE_TOKEN_HERE>" .
```

Now re-run our ETL process again:

```
ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/example-user-credential-1.ttl"
```

- Now our console output should show local data being Extracted and Transformed
  to Linked Data as before.
- **_But now_** we should see that data Loaded as Resources from both the
  Passport Office and Companies House data sources into the triplestore.

## PHASE Appendix - Run End-2-End tests independently

**_Please Note_**: This section is currently undergoing a rewrite, so it is very
much a work-in-progress.

This entire section on End-2-End tests is optional - but it can be very helpful
during development, as it breaks down the various stages of the overall ETL
flow...

To run all our End-2-End tests using a single script (even though we may not have
configured anything yet!)

```
npm run e2e-test-node
```

(Tests should all pass - but output has no colour-coding.)

To run our first End-2-End test in isolation (ET and display) - output should be
fairly self-explanatory:

```
npm run e2e-test-node-ExtractTransform-display
```

- We haven't configured an auth token for the Companies House API.
- So we can't do anything for this data source.
- We can Extract Passport data though, 'cos it's just local JSON.
- This data is Transformed into 3 Resources.
- So we can successfully display our Extracted and Transformed Passport data.

---

To run our second End-2-End test in isolation (Local-extract and TL) - output
should be fairly self-explanatory:

```
npm run e2e-test-node-localExtract-TransformLoad
```

- We haven't configured our ETL Tutorial credentials yet, so we skip logging in.
- We haven't configured a triplestore yet, so we can't clear that.
- We haven't configured our ETL Tutorial credentials yet, so we can't test reading a private resource.
- We can Extract Passport data though, 'cos it's just local JSON.
- This data is Transformed into 3 Resources.
- We haven't configured a user Pod's storage, so there's nowhere to Load our 3 Resources yet.

## PHASE 2 - Creating our environment file, and (optionally) loading data into a triplestore, and visualizing it.

Now create a copy of the local file `/e2e/node/.env.example`, and name it
`/e2e/node/.env.test.local`:

```
cd ./e2e/node/
cp .env.example .env.test.local
```

## PHASE 2.5 (Optional) load data into a triplestore and visualizing it.

It can be **_extremely_** helpful to visualize the data we are Loading,
especially when developing data models for new data sources, which may go
through multiple phases of iteration.

Perhaps the most convenient way to do this is using a triplestore (see
[here](../VisualizePodData/VisualizeExamplePodData.png) for a screenshot of a
sample Pod with lots of data).

If you don't already have a triplestore, you can follow the very simple
instructions [here](../VisualizePodData/VisualizePodData.md) to install and
configure a free triplestore locally in **_less than 10 minutes_**.

Once you have a triplestore running (locally or remotely), you can populate
that right away by simply editing just one line of your new local `.env`
file.

```
# Or use vim, or VSCode, or whatever
gedit .env.test.local
```

...and just uncommenting this line (assuming you're running GraphDB locally,
on its default port of `7200`, and that you've created a new repository named
`inrupt-etl-tutorial`):

```
INRUPT_TRIPLESTORE_ENDPOINT_UPDATE="http://localhost:7200/repositories/inrupt-etl-tutorial/statements"
```

Now re-run the End-2-End load test from our project root:

```
cd ../..
npm run e2e-test-node-localExtract-TransformLoad
```

- Now our console output should show local data being Extracted, Transformed
  to Linked Data as before.
- **_But now_** we should see that data Loaded as Resources from both the
  Passport and Companies House data sources into the triplestore.
- Open GraphDB:
  - Make sure you select the `inrupt-etl-tutorial` repository (i.e., or
    whichever repository you configured your `.env.test.local` to Load data
    into).
  - Simply visualize this node:
    `https://different.domain.example.com/testStorageRoot/private/inrupt/etl-tutorial/etl-run-1/`
  - You should be able to intuitively navigate through the ETL-ed data.

Make a change to the local Passport data (e.g., in the JSON in
`src/dataSource/clientPassportInMemory.ts`), and re-run the test:

```
npm run e2e-test-node-localExtract-TransformLoad
```

...and you should see your change when you refresh the visualization.

**_Note:_** This test loads Companies House data from a local, hard-coded
JSON response (and not via the live API, which our other End-2-End test uses),
so we can't simply update the company ID to search for to Load those results
into our triplestore!

## PHASE 3 - Configuring our UK Companies House API auth token, and Extracting data from that API.

**NOTE: If you don't already have a UK Companies House API Auth Token - just
ask for a sample one.**

If you have a UK Companies House API auth token (from instructions provided
earlier), then simply uncomment and insert you token on this line of our
environment file `.env.test.local`:

```
INRUPT_SOURCE_COMPANIES_HOUSE_UK_HTTP_BASIC_TOKEN="<Generated token - see https://developer-specs.company-information.service.gov.uk/guides/authorisation>"
```

Re-run our End-2-End test again:

```
npm run e2e-test-node-ExtractTransform-display
```

- And this time we should see that we successfully extracted Unilever via the
  Companies House API.

To prove this really is extracting from the API, edit the test
`e2e/node/ExtractTransform-display.test.ts` to search for a different UK
company, setting:

```
const COMPANY_ID_TO_SEARCH = COMPANY_ID_MYSTERY;
```

...instead, and re-run the test again to see which UK company that really is!

## PHASE 4 - Creating Pods, registering our ETL Tutorial as an application.

Create a Pod for your first test user -
[https://signup.pod.inrupt.com/](https://signup.pod.inrupt.com/) (using a new
Incognito window can ease session clashes):

- Username (pick a unique username): **_<<RECORD_HERE_USERNAME>>_**
- EMail (use [https://yopmail.com/en/](https://yopmail.com/en/)): **_<<RECORD_HERE>>_**
- Password (use [https://passwordsgenerator.net/](https://passwordsgenerator.net/)): **_<<RECORD_HERE>>_**

- Your test user's WebID: https://pod.inrupt.com/**_<<RECORD_HERE_USERNAME>>_**/profile/card#me

Create a Pod for your ETL Tutorial app -
[https://signup.pod.inrupt.com/](https://signup.pod.inrupt.com/) (using a new
Incognito window can ease session clashes). Each instance of the ETL is
unique, so each needs its own WebID:

- Username (pick a unique username): **_<<RECORD_HERE_ETL_USERNAME>>_**
- EMail (use [https://yopmail.com/en/](https://yopmail.com/en/)): **_<<RECORD_HERE>>_**
- Password (use [https://passwordsgenerator.net/](https://passwordsgenerator.net/)): **_<<RECORD_HERE>>_**

- Your ETL Tutorial instance's WebID: https://pod.inrupt.com/**_<<RECORD_HERE_ETL_USERNAME>>_**/profile/card#me

Now you need to Register your ETL Tutorial instance with the Identity Provider
(IdP) you used to create its Pod (to give us OAuth `ClientID` and
`ClientSecret` values to allow your ETL process to login automatically (i.e.,
without any human intervention - this is just the standard OAuth Client
Credentials flow)).

Go to:

```
https://broker.pod.inrupt.com/registration.html
```

Login with your **_ETL Tutorial_** username and password (do **_not_** use
your test user credentials by mistake!), and register your ETL Tutorial
instance with whatever name you like, e.g., `InruptEtlTutorial`.

Record the resulting `ClientID` and `ClientSecret` values:

- ClientID: **_<<RECORD_HERE_ETL_CLIENT_ID>>_**
- ClientSecret: **_<<RECORD_HERE_ETL_CLIENT_SECRET>>_**

## PHASE 5 - Configuring our environment with Pods, granting access, and re-running the tests.

In our local environment file `/e2e/node/.env.test.local`, uncomment and
replace the values for (note usernames will always be _fully lower-case_ when
they appear as part of WebIDs):

```
SOLID_WEBID="https://pod.inrupt.com/<<RECORD_HERE_USERNAME>>/profile/card#me"
SOLID_STORAGE_ROOT="https://pod.inrupt.com/<<RECORD_HERE_USERNAME>>/"
```

Run our Load test (**_this should fail!_**):

```
npm run e2e-test-node-localExtract-TransformLoad
```

It should fail because our test user has not yet granted permission to the ETL
Tutorial process to write to their Pod.

See screenshot of how we're going to grant this permission
[here](docs/Worksheet/GivingEtlTutorialPermission.png).

Now use PodBrowser to login as your test user, and navigate to their
`/private` folder (create one if none are present).

Click on the line of this folder (not on the text of the folder name itself
(which will navigate into that folder)), you should see a right-hand sidebar
expand out.

Under `Sharing`, and `Editors`, add the WebID for your instance of the **_ETL
Tutorial_** process (not the test user's WebID):

```
https://pod.inrupt.com/<<RECORD_HERE_ETL_USERNAME>>/profile/card#me
```

Re-run our Load test (it should now succeed!):

```
npm run e2e-test-node-localExtract-TransformLoad
```

- Now all our tests should pass.
- And the data Loaded as resources into the user's Pod.

## PHASE 6 - Running the ETL Tutorial 'for real'!

Now we get to running the ETL process 'for real' (as opposed to running test
code).

Firstly, we recommend installing and using `ts-node` if you haven't already:

```
npm install -g ts-node typescript '@types/node'
```

Next, let's just run our ETL process without any commands (just to see the
command options we have):

```
ts-node src/index.ts
```

Now run with the main `runEtl` command, but no parameters (just to see the
parameters for this command, and which are mandatory):

```
ts-node src/index.ts runEtl
```

We can see that we need a minimum of two parameters:

```
--etlCredentialResource
--localUserCredentialResourceGlob
```

So instead of our local test environment file providing credentials, we now
configure real credential resources as local Linked Data resources, and point
these ETL parameters at those resources.

Notice that the first parameter above is a single file (for our ETL Tutorial's
credentials), whereas the second parameter is a glob - i.e., a filename
pattern that is intended to match potentially many, many local files
(including recursing into subdirectories too), where every matching file
stores the credentials for a single end user that we wish to ETL.

## PHASE 7 - Creating credential resources.

First, we create a single credential resource to hold our ETL Tutorial's
standard OAuth ClientID and ClientSecret values. We provide an example
resource for you to copy-and-edit:

```
# From the project root:

cd ./resources/CredentialResource/RegisteredApp/
cp example-registered-app-credential.ttl registered-app-credential-etl-tutorial.ttl

gedit registered-app-credential-etl-tutorial.ttl
```

- Now paste in the ETL Tutorial's `ClientID` and `ClientSecret` values into
  the values for the `inrupt_common:clientId` and `inrupt_common:clientSecret`
  properties respectively.

Second, we create a similar credential resource for our test user (and we'd
create one such resource per test user we wish to ETL).

We also provide an example resource for you to copy-and-edit:

```
# From the project root:

cd ./resources/CredentialResource/User
cp example-user-credential.ttl user-credential-<<RECORD_HERE_USERNAME>>.ttl

gedit user-credential-<<RECORD_HERE_USERNAME>>.ttl
```

- Now paste in the values for the following properties, keeping in mind that
  the intention here is to provide end-user-specific credentials for each data
  source that that user may (or may not) have an account for:
  ```
  solid:webId - the user's WebID: https://pod.inrupt.com/<<RECORD_HERE_USERNAME>>/profile/card#me
  solid:storageRoot - the storage root of the user's Pod: https://pod.inrupt.com/<<RECORD_HERE_USERNAME>>
  inrupt_3rd_party_companies_house_uk:authenticationHttpBasicToken - this is our UK Companies House API token (it'll be shared across all users we ETL)
  ```

## PHASE 8 - Run the ETL Tutorial for real real!

Finally we're ready to run the ETL Tutorial for real. We simply point it at
our ETL Tutorial credentials, and a file glob that matches all the user
credentials files we created, like so:

```
ts-node src/index.ts runEtl --etlCredentialResource "resources/CredentialResource/RegisteredApp/registered-app-credential-etl-tutorial.ttl" --localUserCredentialResourceGlob "resources/CredentialResource/User/user-cred*.ttl"
```

Hopefully, we should see successful output, saying something like:

```
Successfully completed ETL process for [1] user from [1] set of user credentials.
```

## PHASE 9 - Checking if it really worked - navigate into the user's Pod to see.

PodPro ([https://podpro.dev/](https://podpro.dev/)) is a nice open-source
project for browsing Pods, and it has a nice way of displaying the contents of
Linked Data resources.

You can also use PodBrowser (https://podbrowser.inrupt.com/) to browse the
Pod, but it doesn't display the contents of Linked Data resources yet, or
Penny (https://penny.vincenttunru.com/) which does show the contents, but not
as nicely formatted as PodPro.

So log into your test user's Pod using PodPro (you may need to click on the
Login icon in the bottom-left-hand-side of the page, and you WILL need to
paste in the Pod Spaces broker (i.e., `https://broker.pod.inrupt.com/` even
though, frustratingly, it does appear by default as the textbox's placeholder
value!).

Navigate to the resources that should now be in the user's Pod:

```
/private/inrupt/etl-tutorial/etl-run-1/dataSource/
```

...and you should see containers for all the data sources we ETL'ed for this
user!

Well done!
