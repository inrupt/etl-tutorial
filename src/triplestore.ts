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

import debugModule from "debug";
import { fetch as crossFetch } from "cross-fetch";

import { SolidDataset, Thing } from "@inrupt/solid-client";
import { INRUPT_COMMON } from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { toNTriples } from "./solidDatasetUtil";
import { getCredentialStringOptional } from "./credentialUtil";
import { BlobWithMetadata } from "./solidPod";
import { APPLICATION_NAME } from "./applicationConstant";
import { pluralize } from "./util";

const debug = debugModule(`${APPLICATION_NAME}:triplestore`);

// We treat a missing value completely, or an empty (trimmed) string, as
// meaning no triplestore repository is being provided.
function noRepository(repoEndpointUpdate: string | null): boolean {
  return repoEndpointUpdate === null || repoEndpointUpdate.trim().length === 0;
}

export async function clearTriplestore(
  credential: SolidDataset
): Promise<string> {
  const repoEndpointUpdate = getCredentialStringOptional(
    credential,
    INRUPT_COMMON.triplestoreEndpointUpdate
  );

  if (noRepository(repoEndpointUpdate)) {
    const message =
      "Ignoring request to clear triplestore (we have no triplestore update endpoint).";
    debug(message);
    return Promise.resolve(message);
  }

  const namedGraph = getCredentialStringOptional(
    credential,
    INRUPT_COMMON.triplestoreNamedGraph,
    "default"
  ) as string;
  const command =
    namedGraph === "default" ? "CLEAR ALL" : `CLEAR GRAPH <${namedGraph}>`;

  // We have guard above against null or empty repo.
  return crossFetch(repoEndpointUpdate as string, {
    method: "POST",
    body: command,
    headers: {
      "Content-Type": "application/sparql-update",
    },
  })
    .then((res: Response) => {
      if (!res.ok) {
        const message = `Failed to clear Named Graph [${namedGraph}] from triplestore via SPARQL Update endpoint: [${repoEndpointUpdate}], got status [${res.status} - ${res.statusText}]`;
        debug(message);
        throw new Error(message);
      }

      const message = `Successfully cleared Named Graph [${namedGraph}] from triplestore via SPARQL Update endpoint: [${repoEndpointUpdate}].`;
      debug(message);
      return message;
    })
    .catch((error) => {
      const message = `Failed to clear Named Graph [${namedGraph}] from triplestore via SPARQL Update endpoint: [${repoEndpointUpdate}]. Error: [${error.message}].`;
      debug(message);
      throw new Error(message);
    });
}

export async function insertIntoTriplestoreNTriples(
  repoEndpointUpdate: string | null,
  namedGraph: string,
  insertStatement: string
): Promise<string> {
  if (noRepository(repoEndpointUpdate)) {
    const message =
      "We have no triplestore update endpoint - ignoring request to write triples.";
    debug(message);
    return Promise.resolve(message);
  }

  const graphWrappedInsertStatement =
    namedGraph === "default"
      ? insertStatement
      : `GRAPH <${namedGraph}> {
${insertStatement}        
}`;

  const fullBody = `prefix inrupt_common: <https://inrupt.com/vocab/common#>

INSERT DATA {
${graphWrappedInsertStatement}
}`;

  // This can be a handy debug message (it would be good as a TRACE-level
  // message!). It can be useful for detecting RDF triples that might be
  // missing RDF Object values.
  // debug(`Attempting to write to triplestore:\n${fullBody}`);

  // We have guard above against null or empty repo.
  return crossFetch(repoEndpointUpdate as string, {
    method: "POST",
    body: fullBody,
    headers: {
      "Content-Type": "application/sparql-update",
    },
  })
    .then((res: Response) => {
      if (!res.ok) {
        debug(`DATA ATTEMPTING TO LOAD:`);
        debug(fullBody);
        const message = `Failed to insert into Named Graph [${namedGraph}] in triplestore via SPARQL Update endpoint: [${repoEndpointUpdate}], got status [${res.status} - ${res.statusText}]`;
        debug(message);
        throw new Error(message);
      }

      return `Successfully inserted into Named Graph [${namedGraph}] in triplestore via SPARQL Update endpoint: [${repoEndpointUpdate}].`;
    })
    .catch((error) => {
      const message = `Failed to insert statements into Named Graph [${namedGraph}] of triplestore via SPARQL Update endpoint: [${repoEndpointUpdate}]. Error: [${error.message}].`;
      debug(message);
      throw new Error(message);
    });
}

export async function insertIntoTriplestoreResource(
  repoEndpointUpdate: string,
  namedGraph: string,
  resource: Thing
): Promise<string> {
  return insertIntoTriplestoreNTriples(
    repoEndpointUpdate,
    namedGraph,
    toNTriples(resource)
  );
}

export async function insertIntoTriplestoreResources(
  credential: SolidDataset,
  resources: Thing[],
  blobsWithMetadata: BlobWithMetadata[] | null = null
): Promise<string> {
  let repoEndpointUpdate: string | null;

  try {
    repoEndpointUpdate = getCredentialStringOptional(
      credential,
      INRUPT_COMMON.triplestoreEndpointUpdate
    );

    if (noRepository(repoEndpointUpdate)) {
      const plural = resources.length !== 1;
      const message = `Ignoring request to insert [${
        resources.length
      }] resource${
        plural ? "s" : ""
      } into triplestore (we have no triplestore update endpoint).`;
      debug(message);
      return await Promise.resolve(message);
    }

    const namedGraph = getCredentialStringOptional(
      credential,
      INRUPT_COMMON.triplestoreNamedGraph,
      "default"
    ) as string;

    debug(
      `Writing [${resources.length}] resources to triplestore in Named Graph [${namedGraph}].`
    );
    let written = 0;
    const responses = resources.map(async (resource): Promise<string> => {
      written += 1;
      debug(
        `Writing resource [${written}] of [${resources.length}] to triplestore...`
      );

      // We have guard above against null or empty repo.
      return insertIntoTriplestoreResource(
        repoEndpointUpdate as string,
        namedGraph,
        resource
      );
    });
    await Promise.all(responses);

    if (!blobsWithMetadata || blobsWithMetadata.length === 0) {
      debug(
        `No Blobs with metadata, so no Blob metadata resources to write to triplestore.`
      );
    } else {
      debug(
        `Looking for Blob metadata from [${blobsWithMetadata.length}] Blobs.`
      );

      const blobResponses = blobsWithMetadata.map(
        (blobWithMetadata): Promise<string> => {
          if (blobWithMetadata.metadata) {
            debug(`Inserting Blob metdata.`);
            // We have guard above against null or empty repo.
            return insertIntoTriplestoreResource(
              repoEndpointUpdate as string,
              namedGraph,
              blobWithMetadata.metadata
            );
          }
          debug(`Blob has no associated metdata.`);
          return Promise.resolve("No metadata associated with this Blob");
        }
      );
      await Promise.all(blobResponses);
    }
  } catch (error) {
    const message = `Error writing to triplestore. Error: ${error}`;
    debug(message);
    throw new Error(message);
  }

  const resourceText = pluralize("resource", resources);
  const message = `Successfully inserted [${resources.length}] ${resourceText} into triplestore via SPARQL Update endpoint: [${repoEndpointUpdate}].`;
  debug(message);
  return message;
}
