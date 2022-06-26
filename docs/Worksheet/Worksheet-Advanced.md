# Running End-2-End tests

Our End-2-End tests are completely optional - but these tests can be very
helpful during development, as they isolate different stages of the overall ETL
process, allowing you to focus on just those stages under test.

## Running all tests

To run all our End-2-End tests using a single script (even though we may not
have configured anything yet) run:

```
npm run e2e-test-node
```

All the tests should pass - but our output has no colour-coding, and so it can
be a little difficult to read and follow.

## PHASE 1 - Running tests independently

To run our first End-2-End test in isolation (that only Extracts and Transforms
without attempting to Load, only displaying some transformed data to the console
instead), run:

```
npm run e2e-test-node-ExtractTransform-display
```

The console output should be fairly self-explanatory:

- We haven't configured an auth token for the Companies House API.
- So we can't do anything for this data source.
- We can Extract Passport data though, 'cos it's just local JSON.
- This data is Transformed into 3 Resources.
- So we can successfully display our Extracted and Transformed Passport data.

---

To run our second End-2-End test in isolation (which performs Local data
extraction, and then Transformation into Linked Data and Loading), run:

```
npm run e2e-test-node-localExtract-TransformLoad
```

Output again should be fairly self-explanatory:

- We haven't configured our ETL Tutorial credentials yet, so we skip logging in.
- We haven't configured a triplestore yet, so we can't clear that.
- We haven't configured our ETL Tutorial credentials yet, so we can't test reading a private resource.
- We can Extract Passport data though, 'cos it's just local JSON.
- This data is Transformed into 3 Resources.
- We haven't configured a user Pod's storage, so there's nowhere to Load our 3 Resources yet.

## PHASE 2 - Creating our environment file

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
    `https://test.example.com/test-user/profile/card#me`
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

**_Note_**: If you don't already have a UK Companies House API Auth Token - just
ask your instructor for a sample one, or see
[here](https://developer-specs.company-information.service.gov.uk/guides/authorisation)
for instructions on how to register.

Once you have a UK Companies House API auth token, simply uncomment and insert
your token on this line of our environment file `.env.test.local`:

```
INRUPT_SOURCE_COMPANIES_HOUSE_UK_HTTP_BASIC_TOKEN="<Generated token - see https://developer-specs.company-information.service.gov.uk/guides/authorisation>"
```

Re-run the End-2-End test again:

```
npm run e2e-test-node-ExtractTransform-display
```

- And this time we should see that we successfully extracted Unilever via the
  Companies House API.

To prove this really is extracting from the API, edit the test
`e2e/node/ExtractTransform-display.test.ts` to search for a different UK
company by setting `COMPANY_ID_TO_SEARCH` to:

```
const COMPANY_ID_TO_SEARCH = COMPANY_ID_MYSTERY;
```

Re-run the test again. So what is the 'mystery' UK company...?

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
`/private` folder (create one if it's not present).

Click on the line of this folder (not on the text of the folder name itself
(which will navigate into that folder)), you should see a right-hand sidebar
expand out.

Under `Sharing`, and `Editors`, add the WebID for your instance of the **_ETL
Tutorial_** process (be careful not to add the test user's WebID by mistake!):

```
https://pod.inrupt.com/<<RECORD_HERE_ETL_USERNAME>>/profile/card#me
```

Re-run the Load test (it should now succeed!):

```
npm run e2e-test-node-localExtract-TransformLoad
```

- Now all our tests should pass.
- And the data should be Loaded as resources into the user's Pod.

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

Now run with the main `runEtl` command, but no parameters (just to see all the
allowed parameters for this command, and to see which are mandatory):

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

PodPro ([https://podpro.dev/](https://podpro.dev/)) is a really nice open-source
project for browsing Pods, and it has a nice way of displaying the contents of
Linked Data resources.

You can also use PodBrowser (https://podbrowser.inrupt.com/) to browse the
Pod, but it doesn't display the contents of Linked Data resources yet, or
Penny (https://penny.vincenttunru.com/) which does show the contents, but not
as nicely formatted as PodPro.

So log into your test user's Pod using PodPro (you may need to click on the
Login icon in the bottom-left-hand-side of the page, and you'll need to
paste in, or select, the PodSpaces broker (i.e., `https://login.inrupt.com/`).

Navigate to the resources that should now be in the user's Pod:

```
/private/inrupt/etl-tutorial/etl-run-1/dataSource/
```

...and you should see containers for all the data sources we ETL'ed for this
user.

Well done!
