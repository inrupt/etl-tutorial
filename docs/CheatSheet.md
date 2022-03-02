# ETL Tutorial CheatSheet

This page offers a "_Quick Start_" introduction to Inrupt's ETL tutorial.

## 'Extras'

This repository includes:

- A very high-level overview of Linked Data, as a presentation with detailed
  accompanying prose [here](docs/LinkedDataOverview).
- A detailed description of options for Advanced Vocabulary Management, for
  developers to work more efficiently with evolving vocabs.
- One page of instructions to register for, download, install and run a free
  Linked Data database (i.e., a triplestore), load that database with dummy
  data representing a Solid Pod, and visualizing that data interactively.
  (Suitable for non-technical people, and should take less than 10 minutes
  _*in total*_.)

## Setup

Here we'll quickly run through setting up the project locally.

### Clone the repo

Get the ETL Tutorial repository:

```
  git clone git@github.com:inrupt/etl-tutorial.git
```

### Generate JavaScript constants from our local vocabularies:

- Run Inrupt's Artifact Generator:

  Once-off using `npx` (slower):

  ```
  npx @inrupt/artifact-generator generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noprompt --force --publish npmInstallAndBuild
  ```

  From local install:

  ```
  node ../SDK/artifact-generator/src/index.js generate --vocabListFile "resources/Vocab/vocab-etl-tutorial-bundle-all.yml" --outputDirectory "./src/InruptTooling/Vocab/EtlTutorial" --noprompt --force
  ```

### Run our unit tests

```
npm test
```

- 100% Branch code coverage.
- All runs locally, doesn't populate anything (e.g., Pod or triplestore).

## Running full End-2-End tests (using 3rd-party APIs, or loading to Pods)

You need to provide valid credentials for the actual End-2-Ends tests to run,
since they can make actual API calls to the 3rd-party data sources, and can
actually populate user Pods and triplestores.

**Note:** See the main README.md documentation for setting up the correct
credentials.

## Running parts of the actual ETL

We have End-to-End tests that allow us run specific parts of the ETL in
isolation.

### Extracts - Transforms - display to console

- `npm run e2e-ExtractTransform-display`
  - Extracts from real sources, Transforms to Linked Data, but only displays
    results to the console.

### Loads data from local files - Transforms - Loads

- `npm run e2e-local-TransformLoad`
  - Reads from _local_ sources, Transforms to Linked Data, and Loads to Pod
    and/or triplestore.

## Show D&B company search (US equivalent of Companies House in the UK):

- Browse to `https://www.dnb.com`:
  - Click in "Search box"
  - Search for "Unilever"

## Run for 'real'

- Display usage for entire tool:

  ```
  ts-node src/index
  ```

- Display usage for running the ETL process:

  ```
  ts-node src/index runEtl
  ```

  Only two _required_ options:

  - `--etlCredentialResource`
    - A Linked Data resource with credentials for the ETL tool itself (so that
      it can get an access token allowing it to `Write` to user Pods for which
      it's been granted write access).
  - `--localUserCredentialResourceGlob`
    - A Glob (wildcard filename pattern) to scan for local Linked Data files
      containing credentials for all the users ETL (and that can contain the
      credentials for those users access 3rd-party data sources on their
      behalf).

- Running it for real:

  ```
  ts-node src/index runEtl --etlCredentialResource ./resources/test/RealData/RealRegisteredAppCredentialResource/registered-app-credential-etl-tutorial.ttl --localUserCredentialResourceGlob "./resources/test/RealData/RealUserCredentialResource/user-credential-*.ttl"
  ```

## Visualize from the Triplestore

- Create a very simple 'Visual Graph' in your local GraphDB selecting the
  starting node of
  `https://pod.inrupt.com/pattestuserburner1/private/inrupt/etl-tutorial/etl-run-1/dataSource/CompaniesHouse-UK/00041424/`

## Navigate using Penny (allows us to View Turtle) or PodBrowser

- Browse to `https://penny.vincenttunru.com/`.
- Connect to the Pod Spaces at: `https://broker.pod.inrupt.com`.
- Login using the test user credentials.
- Click `Allow` to allow Penny access this test user's private resources.

## Simulate a real-time event (e.g., a Water Leak in the user's home):

_Note:_ To be added to this open-source code soon...

`ts-node src/index.ts publishEvent --etlCredentialResource resources/test/RealData/RealRegisteredAppCredentialResource/registered-app-credential-etl-tutorial.ttl --userCredentialResource resources/test/RealData/RealUserCredentialResource/user-credential-test-user.ttl --eventResource resources/test/DummyData/DummyEvent/Flume/dummy-event-flume-leak.json`

## Comunica to query Pod and public sources

- Browse to: `https://data.rubensworks.net/tmp/comunica-solid/`
- Login into Pod, e.g. `https://broker.pod.inrupt.com/`.
- Execute query, e.g.:
  ```
  SELECT *
  WHERE {
    ?s ?p ?o .
  }
  ```
