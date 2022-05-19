// Copyright 2022 Inrupt Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
// Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import fs, { ReadStream } from "fs";
import glob from "glob";
import { Arguments } from "yargs";

import debugModule from "debug";
import { Session } from "@inrupt/solid-client-authn-node";
import { SolidDataset, Thing } from "@inrupt/solid-client";
import {
  INRUPT_COMMON,
  SOLID,
  // eslint-disable-next-line import/no-unresolved
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { getCredentialStringOptional } from "./credentialUtil";
import { insertIntoTriplestoreResources } from "./triplestore";
import {
  createWebIdProfileDocument,
  initiateApplication,
  createApplicationResources,
} from "./applicationSetup";
import {
  BlobWithMetadata,
  CollectionOfResources,
  updateOrInsertResourceInSolidPod,
} from "./solidPod";
import { parseStreamIntoSolidDataset } from "./solidDatasetUtil";
import { APPLICATION_LABEL, APPLICATION_NAME } from "./applicationConstant";
import {
  companiesHouseUkExtractCompanyById,
  companiesHouseUkTransformCompany,
} from "./dataSource/clientCompaniesHouseUk";
import {
  passportLocalExtract,
  passportTransform,
} from "./dataSource/clientPassportInMemory";

const debug = debugModule(`${APPLICATION_NAME}:runEtl`);

// For tutorial purposes, we hard-code a UK company search for the biggest
// registered company in the UK - Unilever.
const COMPANY_ID_TO_SEARCH_FOR = "00041424";

export async function loadResources(
  dataSource: string,
  credential: SolidDataset,
  session: Session,
  resources: Thing[] | null,
  blobsWithMetadata: BlobWithMetadata[] | null = null
): Promise<string> {
  let result;
  if (resources === null) {
    result = `Source [${dataSource}] provided no resources at all (e.g., perhaps we didn't have credentials for a 3rd-party data source).`;
  } else if (resources.length === 0) {
    result = `Empty set of resources to load from: [${dataSource}].`;
  } else {
    await insertIntoTriplestoreResources(
      credential,
      resources,
      blobsWithMetadata
    );

    if (session.info.isLoggedIn) {
      const blobs = blobsWithMetadata ? `[${blobsWithMetadata.length}]` : `no`;
      debug(
        `Loading [${resources.length}] Linked Data resources and ${blobs} Blobs into user Pod with WebID [${session.info.webId}]...`
      );
      result = await updateOrInsertResourceInSolidPod(
        session,
        resources,
        blobsWithMetadata
      );
    } else {
      result = `Not logged into Pod, so nothing written for [${dataSource}].`;
    }
  }

  return result;
}

export async function loadResourcesAndBlobs(
  dataSource: string,
  credential: SolidDataset,
  session: Session,
  resourceCollection: CollectionOfResources | null
): Promise<string> {
  if (resourceCollection === null) {
    const message = `No Linked Data resources or Blobs to load from data source [${dataSource}]`;
    debug(message);
    return message;
  }

  return loadResources(
    dataSource,
    credential,
    session,
    resourceCollection.rdfResources,
    resourceCollection.blobsWithMetadata
  );
}

function rdfResourcesAsStreamLocal(
  argv: Arguments
): { name: string; stream: ReadStream }[] {
  const ignoringMessage = argv.localUserCredentialResourceGlobIgnore
    ? ` (while ignoring [${argv.localUserCredentialResourceGlobIgnore}])`
    : "";
  debug(
    `Looking for local Linked Data resources matching file pattern [${argv.localUserCredentialResourceGlob}]${ignoringMessage}...`
  );
  const matchingResourceFiles = glob
    .sync(
      argv.localUserCredentialResourceGlob as string,
      argv.localUserCredentialResourceGlobIgnore
        ? {
            ignore: (
              argv.localUserCredentialResourceGlobIgnore as string
            ).split(","),
          }
        : {}
    )
    .filter((match) => !fs.lstatSync(match).isDirectory());

  if (matchingResourceFiles.length === 0) {
    debug(
      `No local Linked Data resources found to match pattern [${argv.localUserCredentialResourceGlob}]${ignoringMessage}.`
    );
  }

  return matchingResourceFiles.map((resource) => {
    return { name: resource, stream: fs.createReadStream(resource) };
  });
}

export async function parseUserCredentialResources(
  argv: Arguments
): Promise<{ name: string; dataset: SolidDataset }[]> {
  let resources: { name: string; stream: ReadStream }[] = [];

  debug(
    `Scan for user credential resources (we expect to find 1 per user to ETL)...`
  );
  const localResources = rdfResourcesAsStreamLocal(argv);
  resources = resources.concat(localResources);

  // Future work - also read RDF credential resources directly from remote
  // URLs (would need read access), and from WebID's (lookup WebID, and
  // follow-your-nose to credential resource).
  //   const remoteResources = rdfResourcesAsStreamRemote(argv);
  //   resources = resources.concat(remoteResources);
  //   const webIdResources = rdfResourcesAsStreamWebId(argv);
  //   resources = resources.concat(webIdResources);

  const parsedDatasets = resources.map(
    (details): Promise<{ name: string; dataset: SolidDataset }> => {
      debug(
        `Found matching user credentials resource for ETL: [${details.name}]`
      );
      return parseStreamIntoSolidDataset(details.name, details.stream);
    }
  );

  return Promise.all(parsedDatasets);
}

async function etlDataSourcesForUser(
  session: Session,
  credentialDetails: {
    name: string;
    dataset: SolidDataset;
  }
): Promise<number> {
  try {
    // Prepare where we're going to load.
    const applicationEntrypointIri = await initiateApplication(
      credentialDetails.dataset,
      session
    );

    // Create a WebID profile document if needed (e.g., if we're loading into
    // a triplestore, as opposed to a Solid Pod).
    let result = await loadResources(
      "WebID profile document (only if needed, e.g., if writing to a non-Pod destination, such as a triplestore)",
      credentialDetails.dataset,
      session,
      await createWebIdProfileDocument(
        credentialDetails.dataset,
        session,
        applicationEntrypointIri
      )
    );
    debug(result);

    // Create our application-specific resources.
    result = await loadResources(
      `${APPLICATION_LABEL}`,
      credentialDetails.dataset,
      session,
      await createApplicationResources(
        credentialDetails.dataset,
        applicationEntrypointIri
      )
    );
    debug(result);

    //
    // Now ETL from each of our data sources...
    //
    result = await loadResourcesAndBlobs(
      "Companies House UK - Search",
      credentialDetails.dataset,
      session,
      companiesHouseUkTransformCompany(
        credentialDetails.dataset,
        await companiesHouseUkExtractCompanyById(
          credentialDetails.dataset,
          COMPANY_ID_TO_SEARCH_FOR
        )
      )
    );
    debug(result);

    result = await loadResourcesAndBlobs(
      "Passport office UK",
      credentialDetails.dataset,
      session,
      passportTransform(credentialDetails.dataset, await passportLocalExtract())
    );
    debug(result);

    return 1;
  } catch (error) {
    // Report our failure, but keep processing users - i.e., do not throw...
    const message = `Failed to complete ETL using credentials from [${credentialDetails.name}] - error: [${error}]`;
    debug(message);
    return 0;
  }
}

async function etlAllUsers(
  session: Session,
  parsedCredentials: { name: string; dataset: SolidDataset }[]
): Promise<number> {
  const plural = parsedCredentials.length === 1 ? "" : "s";
  debug(``);
  debug(
    `Found [${parsedCredentials.length}] user credential resource${plural} - running ETL for each user...`
  );

  // We deliberately want to run our ETL serially (for ease of debugging and
  // reporting).
  let successfullyProcessed = 0;
  for (let i = 0; i < parsedCredentials.length; i += 1) {
    const credentials = parsedCredentials[i];
    debug(``);
    debug(
      `Processing [${i + 1}] of [${
        parsedCredentials.length
      }] user credentials resource: [${credentials.name}]...`
    );

    // Do ETL for each data source...
    // eslint-disable-next-line no-await-in-loop
    successfullyProcessed += await etlDataSourcesForUser(session, credentials);
  }

  return Promise.resolve(successfullyProcessed);
}

export async function loginAsRegisteredApp(argv: Arguments): Promise<Session> {
  const session = new Session();

  const etlCredentialResource = argv.etlCredentialResource as string;
  debug(
    `Attempting to login as ETL tool using credentials from resource [${etlCredentialResource}] (to get an access token that should (if users consented) allow us write to user Pods)...`
  );

  let etlCredentialDetails: { name: string; dataset: SolidDataset };
  try {
    etlCredentialDetails = await parseStreamIntoSolidDataset(
      etlCredentialResource,
      fs.createReadStream(etlCredentialResource)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const message = `Failed to parse ETL credentials resource [${etlCredentialResource}]: [${error.message}].`;
    debug(message);
    return session;
  }

  const etlClientId = getCredentialStringOptional(
    etlCredentialDetails.dataset,
    INRUPT_COMMON.clientId
  );
  const etlClientSecret = getCredentialStringOptional(
    etlCredentialDetails.dataset,
    INRUPT_COMMON.clientSecret
  );
  const etlOidcIssuer = getCredentialStringOptional(
    etlCredentialDetails.dataset,
    SOLID.oidcIssuer
  );
  if (
    etlClientId === null ||
    etlClientSecret === null ||
    etlOidcIssuer === null
  ) {
    debug(
      `Ignoring Solid login - as our credential resource [${etlCredentialResource}] didn't contain all the information we need to authenticate with our ETL tool's Solid Pod (we got clientId [${etlClientId}], clientSecret [${etlClientSecret}], and oidcIssuer [${etlOidcIssuer}]).`
    );
  } else {
    try {
      await session.login({
        clientId: etlClientId,
        clientSecret: etlClientSecret,
        oidcIssuer: etlOidcIssuer,
      });
      debug(
        `...successfully logged in as registered app - WebID: [${session.info.webId}].`
      );
    } catch (error) {
      const message = `...failed to log into Solid Pod with credentials from [${etlCredentialResource}] - error: [${error}]`;
      debug(message);
      throw new Error(message);
    }
  }

  return session;
}

export async function runEtl(argv: Arguments): Promise<number> {
  try {
    const etlSession = await loginAsRegisteredApp(argv);

    const userCredentialDatasets = await parseUserCredentialResources(argv);

    const successfullyProcessed = await etlAllUsers(
      etlSession,
      userCredentialDatasets
    );

    await etlSession.logout();

    const processedPlural = successfullyProcessed === 1 ? "" : "s";
    const userPlural = userCredentialDatasets.length === 1 ? "" : "s";
    debug(
      `Successfully completed ETL process for [${successfullyProcessed}] user${processedPlural} from [${userCredentialDatasets.length}] set${userPlural} of user credentials.`
    );
    return successfullyProcessed;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const message = `ETL processing failed: [${error.message}].`;
    debug(message);
    return -1;
  }
}
