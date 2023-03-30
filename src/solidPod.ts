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

// We need to explicitly import the Node.js implementation of 'Blob' here
// because it's not a global in Node.js (whereas it is global in the browser).
// We may also need to explicitly convert our usage of 'Blob' into a Buffer
// instead of using it as a 'Blob', because the Node.js 'Blob' implementation
// has no 'stream()' method, whereas the browser implementation does -
// otherwise using one instance where the other is expected will throw an
// error like this:
//   error TS2345: Argument of type 'Blob' is not assignable to parameter of type 'Blob | Buffer'.
//     Type 'import("buffer").Blob' is not assignable to type 'Blob'.
//       The types returned by 'stream()' are incompatible between these types.
//         Type 'unknown' is not assignable to type 'ReadableStream<any>'.
// Both the Node.js and the browser implementations of 'Blob' support the
// '.arrayBuffer()' method, and the `solid-client-js` functions that expect
// 'Blob's (like `overwriteFile()`) can accept both native 'Blob's and
// 'Buffer's, so always converting any 'Blob' instances we have into 'Buffer's
// allows those functions to work safely with both Node.js and browser
// 'Blob's.
// eslint-disable-next-line no-shadow
import { Blob } from "node:buffer";

import {
  createContainerAt,
  getSolidDataset,
  getThingAll,
  overwriteFile,
  saveSolidDatasetAt,
  SolidDataset,
} from "@inrupt/solid-client";
import { Session } from "@inrupt/solid-client-authn-node";
import { APPLICATION_NAME } from "./applicationConstant";

const debug = debugModule(`${APPLICATION_NAME}:solidPod`);

/**
 * Prefixes used for writing RDF in serializations that support prefixes, such
 * as Turtle. These prefixes simply make the resulting serialization easier
 * for humans to read.
 *
 * @type {{schema: string, void: string, rdf: string, owl: string, xsd: string, skos: string, dcterms: string, rdfs: string, time: string, vann: string}}
 */
export const RDF_PREFIXES = {
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  ldp: "http://www.w3.org/ns/ldp#",
  owl: "http://www.w3.org/2002/07/owl#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  dcterms: "http://purl.org/dc/terms/",
  schema: "https://schema.org/",
};

// Type that collects a binary Blob along with its URL and optionally an
// associated metadata resource that describes that Blob (e.g., the Blog might
// be an image file, or audio track, with the metadata resource describing
// aspects of that image or audio track).
export type BlobWithMetadata = {
  url: string;
  blob: Blob;
  // Having metadata associated with the Blob is optional.
  metadata?: SolidDataset;
};

// Type that represents a collection of resources. This collection can consist
// of Linked Data resources and/or binary Blob resource that may optionally
// have associated Linked Data metadata.
export type CollectionOfResources = {
  rdfResources: SolidDataset[];
  blobsWithMetadata: BlobWithMetadata[] | null;
};

export async function insertResourceInSolidPod(
  resourceIri: string,
  session: Session,
  resource: SolidDataset
): Promise<string> {
  try {
    await saveSolidDatasetAt(resourceIri, resource, {
      fetch: session.fetch,
      prefixes: RDF_PREFIXES,
      // PMcB: This is a feature request I've submitted to the SDK Team...
      // outputDiagnosticsOnError: false,
    });
    debug(`...leaf resource saved [${resourceIri}].`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const message = `Error inserted resource [${resourceIri}] into Solid Pod: [${error.message}].`;
    debug(message);
    throw new Error(message);
  }

  const message = `Successfully inserted resource [${resourceIri}] into Solid Pod.`;
  debug(message);
  return message;
}

// export async function updateOrInsertCollectionOfResourcesInSolidPod(
//   session: Session,
//   resources: CollectionOfResources
// ): Promise<string> {
//   return updateOrInsertResourceInSolidPod(
//     session,
//     resources.rdfResources,
//     resources.blobsWithMetadata
//   );
// }

/**
 *
 * @param session The authenticated session.
 * @param resources Collection of resources to write to the Pod.
 * @param blobsWithMetadata Optional - Collection of Blobs with associated metadata to write to the Pod (e.g., an image, or video file).
 */
export async function updateOrInsertResourceInSolidPod(
  session: Session,
  resources: SolidDataset[],
  blobsWithMetadata: BlobWithMetadata[] | null = null
): Promise<string> {
  const plural = resources.length !== 1;
  if (!session.info.isLoggedIn) {
    const message = `Ignoring request to write [${resources.length}] resource${
      plural ? "s" : ""
    } to Solid Pod (session is not logged in).`;
    debug(message);
    return Promise.resolve(message);
  }

  // // Sort our resources by length of their URLs, so that we can create
  // // containers before contained resources.
  // const sortedResources = resources.sort((a, b) => a.url.length - b.url.length);
  //
  // // Turn our Things into SolidDatasets.
  // const sortedDatasets = sortedResources.map((resource) => {
  //   const dataset: SolidDataset = setThing(createSolidDataset(), resource);
  //   return { resource, dataset };
  // });
  // Sort our resources by length of their URLs, so that we can create
  // containers before contained resources.
  const sortedResources = resources.sort((a, b) => {
    const aThings = getThingAll(a);
    const bThings = getThingAll(b);

    if (aThings.length !== 1 || bThings.length !== 1) {
      throw new Error(
        `Currently we don't support SolidDatasets with more than one Thing!`
      );
    }

    return aThings[0].url.length - bThings[0].url.length;
  });

  // Turn our Things into SolidDatasets.
  const sortedDatasets = sortedResources.map((resource) => {
    // const dataset: SolidDataset = setThing(createSolidDataset(), resource);
    // return { resource, dataset };
    const thing = getThingAll(resource)[0];
    return { resource: thing, dataset: resource };
  });

  // Now try and fetch each resource ('cos we'll potentially need to add
  // triples (deleting existing triples makes no sense for an ETL process)).
  const existingPodDatasets = await Promise.all(
    sortedDatasets.map(async ({ resource, dataset }) => {
      let existingPodDataset;
      try {
        debug(`Get resource: [${resource.url}]`);
        existingPodDataset = await getSolidDataset(resource.url, {
          fetch: session.fetch,
          // PMcB: This is a feature request I've submitted to the SDK Team...
          // outputDiagnosticsOnError: false,
        });
        debug(
          `The resource [${resource.url}] exists, and has [${
            Object.keys(resource.predicates).length
          }] triples.`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Ignore if a 404...
        debug(
          `Getting resource failed: [${resource.url}] - Error: [${error.message}].`
        );
      }

      return { resource, dataset, existingPodDataset };
    })
  );

  // for await (const { resource, dataset, existingPodDataset } of existingPodDatasets) {
  //   if (resource.url.endsWith("/")) {
  //     if (existingPodDataset) {
  //       try {
  //         const removeLdpTypesDataset = removeTypeTriples(
  //           existingPodDataset,
  //           LDP.contains
  //         );
  //
  //         const removedLdpDataset = removeTypeTriples(
  //           removeLdpTypesDataset,
  //           RDF.type,
  //           [LDP.BasicContainer, LDP.RDFSource, LDP.NonRDFSource]
  //         );
  //
  //         // Merge the existing resource with our specified resource.
  //         const mergedDataset = mergeSolidDataset(
  //           removedLdpDataset,
  //           dataset
  //         );
  //
  //         const changes = mergedDataset as WithChangeLog;
  //         const additions = changes.internal_changeLog.additions.length;
  //         const deletions = changes.internal_changeLog.deletions.length;
  //
  //         debug(
  //           `Updating container resource: [${resource.url}], with [${additions}] additions, and [${deletions}] deletions]...`
  //         );
  //
  //         await saveSolidDatasetAt(resource.url, mergedDataset, {
  //           fetch: session.fetch,
  //           outputDiagnosticsOnError: false,
  //         });
  // }

  // Create, or update, only the containers...
  // await Promise.all(
  //   existingPodDatasets
  //     .sort((a, b) => a.resource.url.length - b.resource.url.length)
  //     .map(async ({ resource, dataset, existingPodDataset }) => {

  for (let i = 0; i < existingPodDatasets.length; i += 1) {
    const { resource, dataset, existingPodDataset } = existingPodDatasets[i];

    if (resource.url.endsWith("/")) {
      if (existingPodDataset) {
        try {
          // const removeLdpTypesDataset = removeTypeTriples(
          //   existingPodDataset,
          //   LDP.contains
          // );
          //
          // const removedLdpDataset = removeTypeTriples(
          //   removeLdpTypesDataset,
          //   RDF.type,
          //   [LDP.BasicContainer, LDP.RDFSource, LDP.NonRDFSource]
          // );
          //
          // // Merge the existing resource with our specified resource.
          // const mergedDataset = mergeSolidDataset(removedLdpDataset, dataset);
          //
          // const changes = mergedDataset as WithChangeLog;
          // const additions = changes.internal_changeLog.additions.length;
          // const deletions = changes.internal_changeLog.deletions.length;
          //
          // debug(
          //   `Updating container resource: [${resource.url}], with [${additions}] additions, and [${deletions}] deletions]...`
          // );
          const mergedDataset = existingPodDataset;
          debug(`Updating container resource: [${resource.url}]...`);

          // eslint-disable-next-line no-await-in-loop
          await saveSolidDatasetAt(resource.url, mergedDataset, {
            fetch: session.fetch,
            prefixes: RDF_PREFIXES,
            // PMcB: This is a feature request I've submitted to the SDK Team...
            // outputDiagnosticsOnError: false,
          });
          debug(`...container resource updated [${resource.url}].`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          // Ignore if a 404...
          debug(
            `Error updating container resource [${resource.url}]: [${error.message}].`
          );
        }
      } else {
        try {
          debug(`Creating new Container: [${resource.url}]...`);
          // eslint-disable-next-line no-await-in-loop
          await createContainerAt(resource.url, {
            fetch: session.fetch,
            initialContent: dataset,
            // PMcB: This is a feature request I've submitted to the SDK Team...
            // outputDiagnosticsOnError: false,
          });
          debug(`...created as a Container: [${resource.url}].`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          // Ignore if a 404...
          debug(`Error creating container: [${error.message}].`);
        }
      }
    }
  }

  //     })
  // );

  // Create, or update, all leaf resources...
  // await Promise.all(
  //   existingPodDatasets
  //     .sort((a, b) => a.resource.url.length - b.resource.url.length)
  //     .map(async ({ resource, dataset, existingPodDataset }) => {

  for (let i = 0; i < existingPodDatasets.length; i += 1) {
    const { resource, dataset, existingPodDataset } = existingPodDatasets[i];

    try {
      if (!resource.url.endsWith("/")) {
        // let datasetToSave;
        // let operation;
        // if (existingPodDataset) {
        //   const removeLdpTypesDataset = removeTypeTriples(
        //     existingPodDataset,
        //     RDF.type,
        //     [LDP.BasicContainer, LDP.RDFSource, LDP.NonRDFSource]
        //   );
        //
        //   const removedLdpDataset = removeTypeTriples(
        //     removeLdpTypesDataset,
        //     LDP.contains
        //   );
        //
        //   datasetToSave = mergeSolidDataset(removedLdpDataset, dataset);
        //   operation = "Updating";
        // } else {
        //   datasetToSave = dataset;
        //   operation = "Creating";
        // }
        //
        // const changes = datasetToSave as WithChangeLog;
        // const additions = changes.internal_changeLog.additions.length;
        // const deletions = changes.internal_changeLog.deletions.length;
        // const changeMessage = existingPodDataset
        //   ? `[${additions}] additions, and [${deletions}] deletions]`
        //   : `[${additions}] triples`;
        //
        // debug(
        //   `[${operation}] leaf resource: [${resource.url}], with ${changeMessage}...`
        // );
        let operation;
        if (existingPodDataset) {
          operation = "Updating";
        } else {
          operation = "Creating";
        }
        const datasetToSave = existingPodDataset || dataset;
        debug(`[${operation}] leaf resource: [${resource.url}]...`);

        // eslint-disable-next-line no-await-in-loop
        await insertResourceInSolidPod(resource.url, session, datasetToSave);
        debug(`...leaf resource saved [${resource.url}].`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = `Error writing leaf resource to [${resource.url}]: [${error.message}].`;
      debug(message);
      // throw new Error(message);
    }
  }
  //     })
  // );

  let blobsWritten = 0;
  if (blobsWithMetadata !== null) {
    for (const { url, blob, metadata } of blobsWithMetadata) {
      try {
        // TODO: IRI of blob derived from URL param - but should be a separate
        //  explicit field... (and URL is currently used for the metadata
        //  resource, and *NOT* the blob, which should be the other way around
        //  (given the name of the data structure is BlobWith...)!
        // eslint-disable-next-line no-await-in-loop
        await overwriteFile(
          `${url}.jpeg`,
          // We need to explicitly convert our 'Blob' into a Buffer here (see
          // detailed comment on our 'import { Blob }' code above).
          // eslint-disable-next-line no-await-in-loop
          Buffer.from(await blob.arrayBuffer()),
          {
            contentType: blob.type,
            fetch: session.fetch,
          }
        );

        // Associated metadata is optional.
        if (metadata) {
          // eslint-disable-next-line no-await-in-loop
          await insertResourceInSolidPod(url, session, metadata);
        }

        blobsWritten += 1;
        debug(`Saved raw Blob to [${url}]`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const message = `Error writing raw Blob to [${url}]. Error: ${error}`;
        debug(message);
        // throw new Error(message);
      }
    }
  }

  const blobPlural = blobsWritten !== 1;
  return `Successfully inserted or updated [${resources.length}] resource${
    plural ? "s" : ""
  } and [${blobsWritten}] Blob${
    blobPlural ? "s" : ""
  } into Solid Pod with WebID: [${session.info.webId}].`;
}
