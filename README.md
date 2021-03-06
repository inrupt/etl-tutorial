# Inrupt ETL Tutorial

This repository contains code demonstrating how to Extract, Transform, and
Load (ETL) into user Pods from various data sources, including publicly
accessible 3rd-party data sources, local files, etc.

Developed by [Inrupt, inc](https://www.inrupt.com).

## Background

To aid in the understanding of Linked Data, which is the foundation for
everything in Solid, we first recommend reading the
[High-level overview of how Solid stores data](docs/LinkedDataOverview/LinkedData-HighLevel.md).

## Quick-start Worksheet

If you want a complete, start-to-finish run through of the entire process of
installing, configuring, testing, and running the ETL Tutorial, then you can
follow our detailed Worksheet instructions [here](docs/Worksheet/Worksheet.md).

The following instructions provide more background, and go into greater
detail.

## Install and Run

Since we may not yet wish to publicly publish any of the vocabularies we
develop for this tutorial (namely the vocabularies we create on behalf of
3rd-party data sources that don't yet provide RDF vocabularies themselves), we
first need to generate a local `npm` package that bundles together JavaScript
classes representing all the terms from all those vocabularies.

To do this, we run Inrupt's open-source
[Artifact Generator](https://github.com/inrupt/artifact-generator), pointing
it at our local configuration YAML file that references all the local
vocabularies we wish to use terms from, and that bundles together the
generated JavaScript classes that contain constants for all the terms from
each of those vocabularies (which are all located in the
[./resources/Vocab](./resources/Vocab) directory):

```script
npx @inrupt/artifact-generator generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noPrompt --force --publish npmInstallAndBuild
```

**Note:** If you have the Artifact Generator installed locally (e.g., for
faster execution), then you can run it directly:

```script
node ../SDK/artifact-generator/src/index.js generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noPrompt --force --publish npmInstallAndBuild
```

**Note**: during any ETL development, it's generally very common to continue
to re-run the Artifact Generator regularly, for example after any local
vocabulary changes or updates (we can also run it in 'file watcher' mode so
that it runs automatically on any local vocab file changes, which is really
convenient). So since it's a such a regular thing to run, it's generally a
good idea to clone and run the Artifact Generator locally (as that's much
faster than using `npx`).

Now install our ETL Tutorial as normal:

```script
npm install
```

Finally, execute the units tests to ensure everything is configured correctly:

Note: You can expect to see error output in the console, as we have **_100%
branch code coverage_**, meaning our tests deliberately force lots of error
situations so that we can test that our code correctly handles all these error
situations. What we expect to see is a completely green final Jest report,
with 100% coverage across the board.

```script
npm test
```

## End-2-End tests

We provide multiple forms of End-2-End tests to allow us demonstrate and test
different aspects of the overall ETL process in isolation. This clear
separation also allows us to understand the various different credentials we
generally need for an overall ETL process flow.

For all these tests, and indeed when running the actual ETL process 'for real',
we only need to create and edit a single local environment file to provide the
various credentials needed.

Note however, that all these End-2-End tests, and the ETL process itself, will
also all 'pass' without any such environment file at all, as the ETL code
treats loading into Pods or a triplestore as completely optional. So if no
credentials are provided at all, everything will still pass, but you'll see
lots of console output saying Extraction and Loading are being ignored!

### Overview of our End-2-End test suites

The End-2-End test suites we provide are described below, and you can safely
run them now without first creating the local environment file. But without
credentials, you should see the console output telling you various steps are
being 'ignored':

1. Extract, Transform, and display to console:
   ```script
   npm run e2e-test-node-ExtractTransform-display
   ```
   (Without any credentials, we'll see this test successfully Extract data
   from local copies of 3rd-party data, successfully transform that data into
   RDF, and then display that data to the console, but we'll see it ignore
   Extraction from 3rd-parties for which we **require** credentials.)
2. Load locally, Transform, and Load to Pods (and/or triplestore):
   ```script
   npm run e2e-test-node-localExtract-TransformLoad
   ```
   (Without any credentials, we'll see this test successfully Extract data
   from local copies of 3rd-party data, successfully transform that data into
   RDF, but then ignore all attempts to Load those resources into any Pod or
   triplestore.)

### Overview of test suites

Here we describe our test suites in a bit more detail...

#### 1. Extract, Transform, and display to console.

Tests that connect to each of our 3rd-party data sources to Extract data,
Transform that extracted data into RDF, and then just outputs some of that
data to the console (rather than Loading it anywhere!). This is to demonstrate
and test **_only_** the Extract and Transform stages of the ETL process, and
so for these tests we don't need to configure or setup anything to do with
Solid Pods or triplestores (since we deliberately don't attempt to 'Load' this
Extracted and Transformed data anywhere).

#### 2. Load locally, Transform, and Load to Pods (and/or triplestore).

Tests that read local copies of 3rd-party data (so in this case, we are
deliberately avoiding the need for any credentials to connect to any of our
3rd-party data sources). These tests Transform that local data into RDF, and
attempt to Load that data into a Solid Pod (and optionally a triplestore). In
other words, this is for demonstrating and testing **_only_** the
Transformation and Loading stages of the ETL process.

### Create a local-only environment file

To run our ETL Tutorial or execute our End-2-End tests for 'real' (i.e., where
we attempt to Extract real data from actual 3rd-parties, and/or Load data into
real Solid Pods or a triplestore), we need to provide real, valid credentials,
i.e., to allow our application to authenticate with the real APIs of our
3rd-party data sources, and/or to allow our application to write RDF data to
real user's Solid Pods (and/or, optionally, to a triplestore).

To allow us do all of this, we simply need to create and configure a single
local environment file, as follows:

1. Make a copy of the `./e2e/node/.env.example` file, naming your copy
   `./e2e/node/.env.test.local`.
2. Now we need to replace the example placeholder values with valid credential
   values, depending on what we wish to do (i.e., run one or more of the
   End-2-End tests, and/or the full ETL process itself).

We can now configure this local environment file in various ways, and re-run
our End-2-End test suites to understand all the variations of ETL possible.

### Loading into a triplestore

If you are already familiar with triplestores, then perhaps the easiest option
initially is to simply create a new repository in your favorite triplestore
and provide that repository's SPARQL update endpoint to our local environment
file.

If you are not already familiar with triplestores, you can safely ignore this
entire section (although registering, downloading, and running a free
triplestore can literally take less than 10 minutes - see detailed
instructions [here](./docs/VisualizePodData/VisualizePodData.md)).

#### Configuring your triplestore

For example, if your favored triplestore was
[Ontotext's GraphDB](https://www.ontotext.com/products/graphdb/), and you
created a default repository named `inrupt-etl-tutorial`, then you'd simply
need to add the following value to your `.env.test.local` environment file:

```
INRUPT_TRIPLESTORE_ENDPOINT_UPDATE="http://localhost:7200/repositories/inrupt-etl-tutorial/statements"
```

Now when you run the End-2-End tests to Load (there's little point in
re-running the 'only-display-to-console' test suite, since it deliberately
never attempts to Load any data anywhere anyway)...

```script
npm run e2e-test-node-localExtract-TransformLoad
```

...you should see console output informing you that our ETL process
successfully Loaded resources into your triplestore repository. If your
triplestore is not running, or you provided an incorrect SPARQL Update
endpoint, then this test suite should fail (for example, with
`connect ECONNREFUSED` errors).

Assuming the test suite passes, you should now be able to see and query the
Loaded data using your familiar triplestore tools (for example, simply running
a `select * where { ?s ?p ?o }` SPARQL query should show you all our ETL'ed
data - (if you like, you can turn off the 'Include inferred data in the
results' option (i.e., using the '>>' icon on the right-hand side of the
'SPARQL Query & Update' user interface) - this will reduce the noise of the
default inferred triples in all search results)).

**Note**: At this stage (i.e., by only configuring our triplestore via the ETL
environment file), all triples will be added directly to the `default` Named
Graph. For more information on how to populate Named Graphs-per-user Pod, see
later in this documentation.

If your triplestore supports visualizing triples (such as GraphDB), then our
data can already be intuitively inspected and navigated by starting at the
following test node, generated by default by our test suite if no Solid Pod
storage root was configured:
`https://different.domain.example.com/testStorageRoot/private/inrupt/etl-tutorial/etl-run-1/`

**Note**: One thing you might notice is that the triplestore does not contain
any Linked Data Platform (LDP) containment triples (e.g., no `ldp:contains` or
`ldp:BasicContainer`, etc., triples). This is because this test specifically
Loaded data into a raw triplestore, which has no inherent notion of LDP
containment. We'll see later that Loading the same resources into a Solid Pod
does result in these containment triples, since they'll have been created by
virtue of Solid servers also being LDP servers (as currently defined in the
Solid specification).

### Running just Extract and Transform

The test suite `e2e/node/ExtractTransform-display.test.ts` tests the
Extraction of data from each of our 3rd-party data sources; Transforms that
Extracted data into Linked Data, and then displays it to the console for
manual, visual verification (i.e., it deliberately does **_not_** attempt to
Load this Transformed data anywhere, such as a Solid Pod or a triplestore).

To execute this test suite, run this script from the root directory:

```script
npm run e2e-test-node-ExtractTransform-display
```

**Note**: We can still run these tests without any environment file at all,
but the code simply won't attempt any Extraction or Loading.

If the supplied credentials are all valid, you should see data displayed
on-screen, with colorful console output via the [debug](https://www.npmjs.com/package/debug)
library, from all data sources that have configured credentials. Data sources
without credentials are simply ignored, so these tests are convenient for
testing individual data sources in isolation (i.e., simply comment out the
credentials for the other data sources), or collectively.

### Running the ETL process 'for real'

To execute the entire ETL process 'for real' (i.e., hitting the 3rd-party APIs
and populating real Solid Pods (and optionally also a triplestore)), we run
the application from the command-line, and drive it via credential resources
stored as Linked Data.

For example, we can have user credential resources as local Turtle files (or
we could extend this to store these credentials as resources in user Pods),
one per user, configured with that user's API credentials for each of the
3rd-party data sources that that user has access to (each individual user may
have credentials for none, some, or all, of the data sources), and also
providing their Solid Pod credentials (such as their WebID and storage root,
and also the ETL process registration credentials (see
[below](#registering_the_etl_process_for_each_user))).

**_Note:_** We can also provide within these user-specific credential
resources a SPARQL Update endpoint URL for a triplestore, and also a Named
Graph IRI to use as that user's Pod in that triplestore. This allows us to
populate multiple user's data in a single triplestore instance, with each
user's Pod isolated by having its data in its own Named Graph. If no Named
Graph value is provided, then that user's data will be loaded into the
'default' graph of the triplestore, which would only be useful if running the
ETL for a single user (as loading multiple users would just result in each
user overwriting the data of the previously ETL'ed user).

## ETL Process

Our ETL process runs as an automated process - one that individual end users
need to specifically grant access to, to allow that process Load data into
their Pods for them. (Note: if an Enterprise provides their end users with
Pods, then that Pod provisioning phase can automate the granting of that
permission, so the actual end users may never need to take any specific action
here at all).

To allow the ETL process to be granted access to any Pod, it needs to have an
identifier (i.e., it needs a WebID). The easiest way to do this is simply to
create a new Pod for **_your_** ETL Tutorial process.

Note: [YopMail](https://yopmail.com/en/) is a very convenient, easy-to-use
tool that can be used to create 'burner' email addresses for creating
development or test accounts.

Note: [Secure Password Generator](https://passwordsgenerator.net/) is a very
convenient, easy-to-use tool that can be used to create secure 'burner'
passwords for creating development or test accounts.

### Registering the ETL process for each user

In order for the ETL process to populate any user's Pod, the ETL process must
first be registered. This simple registration process will generate standard
OAuth Client ID and Client Secret values that our ETL tool will use to
authenticate itself to allow it access individual user Pod's to Load their
respective data.

1. Go to `registration` endpoint of the user's Identity Provider. For example,
   for Pods registered with Inrupt's Pod Spaces, that would be:

   ```
   https://broker.pod.inrupt.com/registration.html
   ```

2. Login as the ETL tool user.
3. After successful login, the "Inrupt Application Registration" is
   redisplayed.
4. In the "Register an app" field, enter a descriptive name for our ETL
   application, and click "Register".
5. After registration, store the displayed `Client ID` and `Client Secret`
   values, which we'll need in the next step.

### Providing a Turtle credential file for the ETL application

Our ETL process needs credentials with which it can connect to user Pods, so
that (once authorized by each user) it can then load user-specific data into
those Pods.

The easiest way to provide these credentials is to use a local Turtle file. An
example Turtle file is provided here:
` resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl`.

For more detailed instructions, see the [README.md](resources/CredentialResource/RegisteredApp/README.md)
file in that directory.

### Providing a Turtle credential file per user

We can drive our ETL process using a credential resource per user, and the
easiest way to provide these resources is to use local Turtle files - one per
user (these could also be stored as resources within each user's individual
Pod!).

1. Make a copy of the example user credentials Turtle file
   `resources/CredentialResource/User/example-user-credential.ttl` in the same
   directory.
2. Rename the copied file using a simple naming convention such as
   `user-credential-<USER-NAME>.ttl`.
3. Repeat this process, once for each user, filling in that user's 3rd-party
   API and Solid Pod credentials as appropriate for each user (if a user
   doesn't have credentials for a particular data source simply leave out
   those credentials, or provide empty string values - the ETL tool will skip
   that data source for that user).

### Executing the ETL process

Make sure the project is successfully compiled to JavaScript:

```script
npm run build
```

...and then run it from the command line:

```script
node dist/index.js runEtl --etlCredentialResource <resources/CredentialResource/RegisteredApp/MY-REGISTERED-APP-CREDENTIAL-FILE.ttl> --localUserCredentialResourceGlob "resources/CredentialResource/User/user-credential-*.ttl"
```

**_Note_**: Make sure to enclose the directory and glob pattern matching the
naming convention you used to name your user credential files in double quote
characters, so that any wildcard characters (like asterisks or question marks)
will be interpreted correctly.

### Using `ts-node` to speed up running the ETL process repeatedly

Since this project is TypeScript, it can be very convenient to use `ts-node`
so that we don't have to repeatedly run the TypeScript compilation step. We
install `ts-node` globally, but of course you don't have to do this, you can
install it locally too, or you could choose to use `npx`:

```script
npm install -g ts-node typescript '@types/node'
```

Now the entire ETL process can be run for multiple users with just a single
command:

```script
ts-node src/index.ts runEtl --etlCredentialResource <resources/CredentialResource/RegisteredApp/MY-REGISTERED-APP-CREDENTIAL-FILE.ttl> --localUserCredentialResourceGlob "resources/UserCredentialResource/user*.ttl"
```

**_Note_**: Make sure to enclose the directory and glob pattern matching the
naming convention you used to name your user credential files in double quote
characters, so that any wildcard characters (like asterisks or question marks)
will be interpreted correctly.

### Running Extract, Transform, and Load (from local data only)

The next set of End-2-End tests run the full ETL process, and can populate
both real Solid Pods and a triplestore, but are fed from local copies of data
source API responses. These are convenient if we don't wish to continually be
hitting the 3rd-party data sources to retrieve information (e.g., some data
sources can have rate limits, or actually charge per API invocation).

Being able to run the entire ETL process from local copies of API responses is
very convenient during active development, or to run purely locally without
any need for an internet connection (e.g., to populate a locally running
triplestore, or Pods hosted on a locally running Solid server).

For these tests to run though, we need local copies of real API responses.
Currently, the tests are hard-coded to look for specifically named JSON files
in the directory `resources/test/RealData/RealApiResponse/` (see the imports
at the top of the test file `e2e/node/localExtract-TransformLoad.test.ts` for
the expected filenames).

To run these tests, execute this script from the root directory:

```script
npm run e2e-test-node-localExtract-TransformLoad
```

If the credentials you supplied are all valid, you should see data displayed
on-screen (with colorful console output via the
[debug](https://www.npmjs.com/package/debug) library) from all data sources
that have configured credentials.

## Publishing simulating events to a user Pod

The ETL application can publish simulated events to any user Pod, using the
command-line command `publishEvent`. Events are represented as JSON files,
with the format of the event being determined by the data source that produces
the event (e.g., Flume for water-usage or leak-related events, or Sense for
device or electricity-usage events like devices turning on or off).

There are a number of example event files provided in the directory
`./resources/test/DummyData/DummyEvent`.

We need to provide command-line switches with references to the ETL
application's credential resource, the targeted user's credential resource,
and the event filename:

```
ts-node src/index.ts publishEvent --etlCredentialResource <MY-REGISTERED-APP-CREDENTIAL-FILE.ttl> --userCredentialResource <USER-CREDENTIALS.ttl> --eventResource ../../resources/test/DummyData/DummyEvent/Flume/dummy-event-flume-leak.json
```

## Generating HTML documentation

The Inrupt [Artifact Generator](https://github.com/inrupt/artifact-generator)
integrates closely with a sophisticated open-source documentation-generating
tool named [Widoco](https://github.com/dgarijo/Widoco).

Widoco automatically generates a detailed website describing all the
information contained in a vocabulary (it can actually be configured to
generate a website per human-language, meaning if our vocabularies have
descriptive meta-data in English, French, Spanish, etc., Widoco can generate
websites in each of those languages).

**_Note_**: Widoco is a Java application, and requires Java version 8 or
higher to be installed on your machine. See
[here](https://github.com/inrupt/artifact-generator/blob/main/documentation/feature-overview.md#to-generate-human-readable-documentation-for-a-vocabulary-using-widoco)
for installation and setup guidance.

To tell the Artifact Generator to generate Widoco documentation, simply add
the following command-line switch:

```
--runWidoco
```

Websites will automatically be generated in the
`<OUTPUT DIRECTORY>/Generated/Widoco` directory (e.g., in
`./src/InruptTooling/Vocab/EtlTutorial/Generated/Widoco`).

Documentation can be generated in multiple human-languages, configured via the
Artifact Generator configuration file using the `widocoLanguages` field, and
providing 2-character languages codes with hyphen separators (e.g., `en-es-fr`
for English, Spanish, and French documentation).

For example usage, see our local configuration file here:
[vocab-etl-tutorial-bundle-all.yml](resources/Vocab/vocab-etl-tutorial-bundle-all.yml)).

If you successfully ran the Artifact Generator locally with the `--runWidoco`
switch, you should see the documentation for our local vocabularies
**in Spanish**
[here](src/InruptTooling/Vocab/EtlTutorial/Generated/Widoco/etl-tutorial/index-es.html).

## Postman collections to invoke APIs

Postman provides a very convenient means to quickly and easily make API calls,
and we've provided example Postman collections (version 2.1 format) in the
directory [./resources/Postman](./resources/Postman). Each collection provides
a number of sample API calls.

### Credentials provided by environment variables

We've been careful not to include any credentials in our Postman collections,
instead relying on environment variables. To see which environment variables
are required for the various data sources, see the example environment file we
provide for running our End-2-End tests [here](e2e/node/.env.example).

### Making Postman calls

The general approach for invoking 3rd-party APIs is to first request a fresh
access token, which generally requires providing identifying credentials, such
as a username and password. This access token is then generally provided as
the value of the HTTP `Authorization` header in all subsequent API calls.

Our collections automatically store the data-source-specific access token in
internal environment variables using the 'Tests' feature of Postman. For
example, for EagleView, open the `https://webservices-integrations.eagleview.com/Token`
request in Postman and look at the 'Tests' tab to see the code that copies the
access token from a successful authentication request into the `eagleViewAuthToken`
environment variable. This environment variable is then used in subsequent
EagleView calls, such as the
`https://webservices-integrations.eagleview.com/v2/Product/GetAvailableProducts`
request, where it is specified as the `Authorization` header value (look in
the 'Headers' tab) .

## Advanced Vocabulary Management

For details on how to efficiently update even remotely published vocabularies
from 3rd-parties, see
[Advanced Vocabulary management](docs/AdvancedVocabManagement/AdvancedVocabularyManagement.md).

## Contents

["_People think [Linked Data] is a pain because it is complicated._"](https://book.validatingrdf.com/bookHtml005.html)) - Dan Brickley (Google and Schema.org) and Libby Miller (BBC).

**Vocabularies:**

- Schema.org (from Google, Microsoft and Yahoo): [RDF](https://schema.org/docs/developers.html#defs)
- Inrupt: [Common Terms](https://github.com/inrupt/solid-common-vocab-rdf/blob/main/inrupt-rdf/Core/CopyOfVocab/inrupt-common.ttl)
- 3rd-parties: [Vocabulary per data source](./resources/Vocab/ThirdParty/CopyOfVocab)

**Generated artifacts:**

- After running the Artifact Generator command in the install instructions
  above, a series of artifacts will be generated in
  [./src/InruptTooling/Vocab/EtlTutorial](./src/InruptTooling/Vocab/EtlTutorial).
- You'll notice multiple 'forms' of generated artifacts here, for both Java
  and JavaScript (see
  [https://github.com/inrupt/artifact-generator/blob/main/documentation/multiple-forms-of-artifact.md]()
  for a detailed description of these various forms of artifact).
- Initially we'll use the simplest form (just term identifiers as simple
  strings), but we'll build up to demonstrate also using RDF library IRI
  forms, and finally to using the form that provides full programmatic access
  to all term meta-data (e.g., each term's labels and descriptions (available
  in multiple human languages), 'seeAlso' links, etc.).

**Generated documentation:**

- If you installed Widoco, and ran the Artifact Generator command from the
  install instructions above with the optional `--runWidoco` switch, the
  generator will also generate really nice HTML documentation for each of the
  vocabularies we use in this project (and do so in both English and Spanish).
- This documentation is in the form of an entire website per vocabulary, with
  each website generated under
  [./src/InruptTooling/Vocab/EtlTutorial/Generated/Widoco](./src/InruptTooling/Vocab/EtlTutorial/Generated/Widoco).
- To open any of these websites, browse to the `./index-en.html` file in the
  root of each directory.
  **_Note:_** Notice that the documentation is generated in both English and
  Spanish (language selection is available in the top-right-hand corner of the
  vocabulary webpage), as all our vocabularies describe themselves, and the
  terms they contain, in both of those languages (see our
  [Companies House vocabulary](./resources/Vocab/ThirdParty/CopyOfVocab/inrupt-3rd-party-companies-house-uk.ttl)
  vocabulary for instance).

**Postman Collections for API calls:**

- [Postman collections](./resources/Postman)
- We've been careful not to include any credentials in our Postman
  collections, instead relying environment variables to provide these.

**Extract, Transform, and Load (ETL):**

- TypeScript modules for external data sources (all under
  [./src/dataSource](./src/dataSource)):

  - Companies House UK
  - Local Passport data as JSON

- **_Note:_** We have 100% branch code coverage, which we plan to maintain
  throughout this project.

**Real-time data (example using Sense electricity monitor):**

- **_Note:_** Currently _NOT_ included - but we expect to add it soon!

- WebSocket client for Sense: [./src/websocket](./src/websocket)

- To run, you need to provide valid credentials for Sense in the End-2-End
  environment file (i.e., in your local `./e2e/node/.env.test.local` file,
  within which you provide credentials for all data sources), and then run:

  ```
  cd ./src/websocket/Sense
  npm i
  node index.js
  ```

  You should see a successful authentication to Sense, and then live updates
  every 500 milliseconds from the Sense monitor.

## References

**Vocabularies**

- Inrupt's vocabulary repository (**_public_**):
  [inrupt/solid-common-vocab-rdf](https://github.com/inrupt/solid-common-vocab-rdf)
- Inrupt's Artifact Generator (**_public_**) :
  [inrupt/artifact-generator](https://github.com/inrupt/artifact-generator)
- Inrupt's published artifacts:
- Java: Cloudsmith [SDK Development](https://cloudsmith.io/~inrupt/repos/sdk-development/packages/)
  (**_private_** - we intend to open-source, based on demand)
- JavaScript: [npmjs.org](https://www.npmjs.com/search?q=%40inrupt%2Fvocab-) (**_public_**)

**Utilities**

- Bash scripts to manage Artifact Generator configuration files (YAMLs) (**_public_**):
  [inrupt/solid-common-vocab-script](https://github.com/inrupt/solid-common-vocab-script)
- Widoco documentation-generation (integrated with Inrupt's Artifact Generator) (**_public_**):
  [Widoco](https://github.com/dgarijo/Widoco)

**Libraries**

- JavaScript:
  - Linked Data (RDF) library:
    [solid-client-js](https://github.com/inrupt/solid-client-js)
  - Solid Authentication Library:
    [solid-client-authn-js](https://github.com/inrupt/solid-client-authn-js)
- Java:
  - Linked Data (RDF) library: (**_private_** - we intend to open-source, based
    on demand)

## Potential Future Work

- Should probably only delete Containers for data sources that are being
  re-loaded (so if I want to re-run just for InsideMaps and leave all other
  creds empty). But then, how would I delete or remove entire data source
  Containers.

- Error handling - should the ETL tool exit when it encounters an error
  reading from a data source? Should it just fail for the current user, or the
  entire process?

- Investigate get local government public data, e.g., perhaps local areas
  publish their local water charge rates (so we could query that data in
  real-time to provide water charges based on the user's "census_tract"
  field).

- User preferences, for things like gallons vs liters, or feet vs meters.
  Ideally these should be accessible by any app accessing the Pod, but if not
  yet defined in the Pod, the user could stipulate they wish to create these
  Pod-wide preferences based on current preferences they may have set.

- Drive ETL process based on direct user input via the WebApp, to do things
  like:
  - Enter credentials for pre-defined data sources.
  - Detect discrepancies in preferences between data sources (e.g., user has
    set imperial as their Pod-wide choice, but the preference set within a
    specific data source is metric). Alert the user to this, and allow them to
    update their Pod-wide preference if they choose.

## Knowledge Transfer

- Runs as a new CLI option (i.e., `--runEod` (for 'Run End-of-Day')).
  - Mandatory param: `--etlCredentialResource`
  - Mandatory param: `--localUserCredentialResourceGlob`
  - Optional param: `--localUserCredentialResourceGlobIgnore`
  - Optional param: `--fromDate` (defaults to yesterday)
  - Optional param: `--toDate` (defaults to yesterday)
- Code is also called as part of the normal `--runEtl` process too for each
  user, and defaults to yesterday.

## Frequently Asked Questions

- Is it ok to create the same `Thing` or `Container` multiple times?

  - A: Yes.

- Should I extract API responses from multiple data sources and then do a single
  transform?

  - A: Its just personal choice really. Personally I don't think I would, as
    generally all data sources should be isolated from each other, and know
    nothing of each other. So I would perform the ETL for each source
    independently, and Load each data source's usage data into their own
    resources in the Pod.

- Where should we put partner credential secrets?

  - A: It may be easiest (and perhaps most appropriate) to simply add these
    credentials to the existing registered application credentials resource
    (e.g.,
    [here](resources/CredentialResource/RegisteredApp/example-registered-app-credential.ttl))
    Alternatively, I already added a placeholder partner-credential resource
    here:
    `resources/CredentialResource/Partner/example-partner-credential.ttl`, but
    the ETL tool would need to be extended to look for, read from, and use, any
    values from this resource.

- What is `owl:Property`?

  - A: It's a fairly common vocabulary practice to include simple metadata from
    OWL for things like Classes, Properties and NamedIndividuals, but it's
    certainly not required. I only included them in the vocabs for this project
    because the documentation tool [Widoco](https://github.com/dgarijo/Widoco)
    looks for them when generating its HTML documentation for vocabularies.

- How much code should be shared between one-off jobs and `runEtl`?

  - A: Just in general, I'd try and reuse code as much as possible. Commonly,
    EOD jobs run either reconciliation or aggregation functions, and so
    conceptually it can be very useful to run directly after all ETL jobs. It
    certainly makes sense in our case to run the EOD process directly after the
    initial ETL so that the user can immediately see yesterday's usage
    statistics as soon as their Pod is created (as opposed to having to wait
    until the following day to allow the EOD job to run that night).

- What are the relationships between resources, datasets, containers, and
  things?

  - A: 'Resource' is the most general term we use to refer to any 'entity' in a
    Solid Pod, so it could be a Container, an RDF resource or a binary blob.

    A 'Dataset' is the formal name for a collection of RDF quads, and really
    Solid Pods are made up of **only** either RDF Datasets, or binary Blobs.

    'Containers' are simply RDF Datasets that logically 'contain' other
    Resources. They themselves are always RDF Datasets, and the name basically
    comes from the W3C standard of Linked Data Platform (but that standard
    should just be seen as a guide - i.e., Solid took initial inspiration from
    that standard, but may move away from formally requiring compliance with
    that standard).

    A 'Thing' is simply a collection of RDF triples where all the triples have
    the exact same RDF Subject IRI. It can be a convenient conceptual model when
    working with RDF, as we often wish to read or write a number of properties
    of a single 'thing' or entity at once.

- When should we call `getThing` as opposed to `getSolidDataset`?
  - A: We use `getThing` to extract a very specific collection of triples from
    an RDF Dataset (i.e., from a SolidDataset), where all the triples in that
    collection have the exact same RDF Subject IRI value (which is the IRI value
    we pass as the 2nd parameter to the `getThing` function). This is useful
    because a single Dataset can contain any number of triples with differing
    RDF Subject values (i.e., a single Dataset can have triples describing
    multiple 'things').

## Changelog

See [the release notes](https://github.com/inrupt/etl-tutorial/blob/main/CHANGELOG.md).

## License

MIT ?? [Inrupt](https://inrupt.com)
