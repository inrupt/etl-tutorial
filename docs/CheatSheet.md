# ETL Tutorial 'CheatSheet'

This page offers a "_Quick Start_" introduction to Inrupt's ETL tutorial.

_*Note:*_ This page is intended for developers already familiar with the
operation and details of this repository, and to provide general guidelines for
quickly explaining the overall purpose and operation of ETL of data into Solid
Pods.

Each use-case will be different and unique to some degree, but this guide
attempts to offer general direction.

## Prerequisites

- As a minimum, we'd highly recommend being at least somewhat familiar with
  Turtle before attempting to understand, or even use, this project.

## 'Extras'

This repository also includes some _indirectly_ related material:

- A very high-level overview of Linked Data, as a presentation with slides, but
  also with detailed accompanying prose [here](./LinkedDataOverview).
- A detailed description of options for Advanced Vocabulary Management, for
  developers to work more efficiently with evolving vocabs once familiar and
  experienced with the basics.
- A single page of instructions to register for, download, install and run the
  free edition of a commercial Linked Data database (i.e., a triplestore); load
  that database with dummy data representing a Solid Pod; and then visualizing
  that Pod data interactively (and hopefully intuitively!).
  (Suitable for non-technical people, and should take less than **10 minutes**
  _*in total*_.)

## Setup

Here we'll quickly run through setting up, running the ETL process in various
ways, and finally visualizing the results of this project locally.

### Clone the repo

Clone the public ETL Tutorial repository from GitHub:

```
  git clone git@github.com:inrupt/etl-tutorial.git
```

### Generate JavaScript constants from our local vocabularies:

- Run Inrupt's [Artifact Generator](https://github.com/inrupt/artifact-generator)
  to generate local source-code from the local vocabularies this project defines
  for illustrative purposes:

  Once-off using `npx` (slower, but no local dependencies required):

  ```
  npx @inrupt/artifact-generator generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noPrompt --force --publish npmInstallAndBuild
  ```

  From local install (faster, but requires local Artifact Generator to be
  installed, in the example below in a subdirectory named 'SDK' a sibling
  directory named 'SDK'):

  ```
  node ../SDK/artifact-generator/src/index.js generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noPrompt --force
  ```

### Run the full unit test suite

```
npm test
```

- Ensures everything is _basically_ installed and setup correctly.
- Demonstrates that we have 100% branch code coverage (which we know doesn't
  '_prove_' anything in itself, but shows at least some commitment to
  maintaining some measurable measure of 'code quality'!).
- All tests run locally - they don't require any Web access (i.e., they don't
  invoke any online APIs), and they don't attempt to populate anything (e.g.,
  any Solid Pods or triplestores).

## Running full End-2-End tests (using 3rd-party APIs, or loading to Pods)

You need to provide valid credentials for the actual End-2-Ends tests to run,
since they can make actual API calls to the 3rd-party data sources, and can
actually populate user Pods and triplestores.

**Note:** See our main README.md documentation for registering your instance of
this ETL Tutorial application, and for setting up the correct credentials in a
local environments file.

### Running parts of the actual ETL

We have End-to-End tests that allow us run specific parts of the ETL in
isolation.

#### Extracts - Transforms - display to console

- `npm run e2e-test-node-ExtractTransform-display`
  - Extracts from real sources, Transforms to Linked Data, but only displays
    results to the console.

#### Loads data from local files - Transforms - Loads

- `npm run e2e-test-node-localExtract-TransformLoad`
  - Reads from _local_ sources, Transforms to Linked Data, and Loads to Pod
    and/or triplestore.

## Show D&B company search (US equivalent of Companies House in the UK):

- Browse to `https://www.dnb.com`:
  - Click in "Search box"
  - Search for "Unilever"

## Run for 'real'

- Display usage for entire tool (assume you have `ts-node` installed - if not,
  you can install it (globally) using `npm install -g ts-node`):

  ```
  ts-node src/index
  ```

- Display usage for running the ETL process:

  ```
  ts-node src/index runEtl
  ```

  This usage informs that there are only two _required_ options:

  - `--etlCredentialResource`
    - A Linked Data resource with credentials for the ETL tool itself (so that
      it can get an access token allowing it to `Write` to user Pods for which
      it's been granted write access).
  - `--localUserCredentialResourceGlob`
    - A Glob (wildcard filename pattern) to scan for local Linked Data files
      containing credentials for all the users to ETL (where each matching file
      can contain the credentials for a user for each 3rd-party data sources so
      on that our ETL tool can access that 3rd-party on that user's behalf).

- Running it for real:

  ```
  ts-node src/index runEtl --etlCredentialResource ./resources/test/RealData/RealRegisteredAppCredentialResource/registered-app-credential-etl-tutorial.ttl --localUserCredentialResourceGlob "./resources/test/RealData/RealUserCredentialResource/user-credential-*.ttl"
  ```

## Visualize from the Triplestore

- Create a very simple 'Visual Graph' in your local GraphDB selecting the
  starting node of
  `https://pod.inrupt.com/pattestuserburner1/private/inrupt/etl-tutorial/etl-run-1/dataSource/CompaniesHouse-UK/00041424/`

## Navigate using PodPro (which allows us to view resource contents as Turtle)

- Browse to `https://podpro.dev`.
- Connect to your Identity Provider, e.g., for a Pod on PodSpaces use:
  `https://login.inrupt.com`.
- Login using your test user credentials.
- Click `Allow` to allow PodPro access this test user's private resources.

## Simulate a real-time event (e.g., a Water Leak in the user's home)

_Note:_ To be added to this open-source code soon...

`ts-node src/index.ts publishEvent --etlCredentialResource resources/test/RealData/RealRegisteredAppCredentialResource/registered-app-credential-etl-tutorial.ttl --userCredentialResource resources/test/RealData/RealUserCredentialResource/user-credential-test-user.ttl --eventResource resources/test/DummyData/DummyEvent/Flume/dummy-event-flume-leak.json`

## Use Comunica to query Pod and public sources

- Browse to: `https://query.linkeddatafragments.org/`
- Login into Pod, e.g., for a Pod on PodSpaces use: `https://login.inrupt.com/`.
- Execute query, e.g.:
  ```
  SELECT *
  WHERE {
    ?s ?p ?o .
  }
  ```
