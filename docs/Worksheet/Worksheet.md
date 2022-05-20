# Worksheet for installing, configuring and running the ETL Tutorial

This detailed worksheet attempts you walk you through the entire process of
installing, configuring, testing, and running the ETL Tutorial, from start to
finish.

### References

Here are some useful links and resources you can use during this worksheet:

- PodSpaces registration: https://signup.pod.inrupt.com/
- Yopmail: https://yopmail.com/en/
- Password generator: https://passwordsgenerator.net/
- Broker: https://broker.pod.inrupt.com/

- PodPro: https://podpro.dev/
- Penny: https://penny.vincenttunru.com/
- PodBrowser: https://podbrowser.inrupt.com/

## PHASE 1 - Basic code installation, and running tests.

Ensure you're on Node.js version 14 (should be fine on v16 too, but we've tested on v14):

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
npx @inrupt/artifact-generator generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noprompt --force --publish npmInstallAndBuild
```

Now run:

```
npm ci
```

Now build the project:

```
npm run build
```

Now run the unit test suite:

```
npm test
```

- We expect to see error output (as we test all our error handling).
- All tests should pass.
- And branch code coverage should be 100%.

Now run our End-2-End tests (even though we haven't configured anything yet!)

```
npm run e2e-test-node
```

(Tests should all pass - but output has no colour-coding.)

Run our first End-2-End test in isolation (ET and display) - output should be
fairly self-explanatory:

```
npm run e2e-test-node-ExtractTransform-display
```

- We haven't configured an auth token for the Companies House API.
- So we can't do anything for this data source.
- We can Extract Passport data though, 'cos it's just local JSON.
- This data is Transformed into 3 Resources.
- So we can successfully display our Extracted and Transformed Passport data.

Run our second End-2-End test in isolation (Local-extract and TL) - output
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

## PHASE 2.5 - Optional - load data into a triplestore and visualizing it.

It can be **_extremely_** helpful to visualize the data we are Loading, and
one of the best ways to do this is using a triplestore (see
[here](../VisualizePodData/VisualizeExamplePodData.png) for a screenshot of a
sample Pod with lots of data.

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
`/private` folder.

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
