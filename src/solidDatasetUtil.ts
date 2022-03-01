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

import { RDF } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  Url,
  UrlString,
  createSolidDataset,
  getIri,
  getIriAll,
  getStringNoLocaleAll,
  getThingAll,
  Iri,
  IriString,
  removeIri,
  setThing,
  SolidDataset,
  Thing,
  toRdfJsDataset,
  addLiteral,
  createThing,
  addIri,
  removeAll,
  deleteFile,
  deleteSolidDataset,
  getContainedResourceUrlAll,
  getSolidDataset,
  getSourceUrl,
  WithResourceInfo,
  fromRdfJsDataset,
} from "@inrupt/solid-client";
import debugModule from "debug";
import { DataFactory, NamedNode } from "rdf-data-factory";
import * as RDFJS from "rdf-js";
import Dataset from "@rdfjs/dataset";
import rdfParser from "rdf-parse";
import { ReadStream } from "fs";
import { APPLICATION_NAME } from "./applicationConstant";

const factory: RDFJS.DataFactory = new DataFactory();
const debug = debugModule(`${APPLICATION_NAME}:solidDatasetUtil`);

function toIriString(iri: Iri | IriString): IriString {
  return typeof iri === "string" ? iri : iri.value;
}

// Copied from `@inrupt/solid-client` because it's not yet exposed...

/*
 * @hidden Scopes are not yet consistently used in Solid and hence not
 * properly implemented in this library yet (the add*() and set*() functions
 * do not respect it yet), so we're not exposing these to developers at this
 * point in time.
 */
export interface GetThingOptions {
  /*
   * Which Named Graph to extract the Thing from.
   *
   * If not specified, the Thing will include Quads from all Named Graphs in the given
   * [[SolidDataset]].
   */
  scope?: Url | UrlString;
}

export function getThingAllOfType(
  solidDataset: SolidDataset,
  type: NamedNode | string,
  options: GetThingOptions = {}
): Thing[] {
  const graph =
    typeof options.scope !== "undefined"
      ? toIriString(options.scope)
      : "default";
  const thingsByIri = solidDataset.graphs[graph] ?? {};

  return Object.values(thingsByIri).filter((thing) => {
    return getIri(thing, RDF.type) === toIriString(type);
  });
}

export function getThingOfTypeMandatoryOne(
  dataset: SolidDataset,
  type: NamedNode | string,
  options?: GetThingOptions
): Thing {
  const things = getThingAllOfType(dataset, type, options);
  if (things.length === 0) {
    const message = `Mandatory request for only one thing of type [${toIriString(
      type
    )}]), but we couldn't find any values at all.`;
    debug(message);
    throw Error(message);
  }
  if (things.length !== 1) {
    const message = `Mandatory request for only one thing of type [${toIriString(
      type
    )}]), but we found [${things.length}] things of this type.`;
    debug(message);
    throw Error(message);
  }
  return things[0];
}

export function getStringNoLocaleMandatoryOne(
  thing: Thing,
  predicate: NamedNode | string
): string {
  const values = getStringNoLocaleAll(thing, predicate);
  if (values.length === 0) {
    const message = `Mandatory request for only one no-locale string value for predicate [${toIriString(
      predicate
    )}]), but we couldn't find any values at all.`;
    debug(message);
    throw Error(message);
  }
  if (values.length !== 1) {
    const message = `Mandatory request for only one no-locale string value for predicate [${toIriString(
      predicate
    )}]), but we found [${values.length}] values: [${values}].`;
    debug(message);
    throw Error(message);
  }

  return values[0];
}

export function getIriMandatoryOne(
  thing: Thing,
  predicate: NamedNode | string
): NamedNode {
  const values = getIriAll(thing, predicate);
  if (values.length === 0) {
    const message = `Mandatory request for only one IRI value for predicate [${toIriString(
      predicate
    )}]), but we couldn't find any values at all.`;
    debug(message);
    throw Error(message);
  }
  if (values.length !== 1) {
    const message = `Mandatory request for only one IRI value for predicate [${toIriString(
      predicate
    )}]), but we found [${values.length}] values: [${values}].`;
    debug(message);
    throw Error(message);
  }
  return factory.namedNode(values[0]);
}

export function getStringNoLocaleOptionalOne(
  thing: Thing,
  predicate: NamedNode | string,
  defaultIfNone?: string
): string | null {
  const values = getStringNoLocaleAll(thing, predicate);
  if (values.length === 0) {
    return defaultIfNone || null;
  }
  if (values.length !== 1) {
    const message = `Optional request for only one no-locale string value for predicate [${toIriString(
      predicate
    )}]), but we found [${values.length}] values: [${values}].`;
    debug(message);
    throw Error(message);
  }
  if (values[0].trim().length === 0) {
    return defaultIfNone || null;
  }

  return values[0];
}

export function getIriOptionalOne(
  thing: Thing,
  predicate: NamedNode | string
): NamedNode | null {
  const values = getIriAll(thing, predicate);
  if (values.length === 0) {
    return null;
  }
  if (values.length !== 1) {
    const message = `Optional request for only one IRI value for predicate [${toIriString(
      predicate
    )}]), but we found [${values.length}] values: [${values}].`;
    debug(message);
    throw Error(message);
  }

  return factory.namedNode(values[0]);
}

export function toNTriples(thing: Thing): string {
  const rdfjsDataset = toRdfJsDataset(setThing(createSolidDataset(), thing));

  let thingAsNTriples = "";
  for (const quad of rdfjsDataset) {
    const obj = quad.object;
    thingAsNTriples += `<${quad.subject.value}> <${quad.predicate.value}> `;
    if (obj.termType === "Literal") {
      if (obj.value === null || obj.value === undefined) {
        const message = `RDF Literal value was not provided, for Subject [${quad.subject.value}] and Predicate [${quad.predicate.value}]`;
        debug(message);
        throw new Error(message);
      }

      thingAsNTriples += `"${obj.value.toString().replace(/\n/g, "\\n")}"`;
      if (obj.language) {
        thingAsNTriples += `@${obj.language}`;
      } else {
        thingAsNTriples += `^^<${obj.datatype.value}>`;
      }
    } else {
      thingAsNTriples += `<${obj.value}>`;
    }
    thingAsNTriples += ` .\n`;
  }

  return thingAsNTriples;
}

export function buildDataset(thing: Thing): SolidDataset {
  return setThing(createSolidDataset(), thing);
}

export function mergeSolidDataset(
  first: SolidDataset,
  second: SolidDataset
): SolidDataset {
  const thingMap: Map<string, Thing> = new Map(
    getThingAll(first).map((element) => [element.url, element])
  );
  const rdfjsDataset = toRdfJsDataset(second);

  for (const quad of rdfjsDataset) {
    // First lookup result dataset for this quad's 'thing'.
    let lookupThing = thingMap.get(quad.subject.value);
    if (lookupThing === undefined) {
      lookupThing = createThing({ url: quad.subject.value });
    }

    const obj = quad.object;
    if (obj.termType === "Literal") {
      lookupThing = addLiteral(lookupThing, quad.predicate.value, obj);
    } else {
      lookupThing = addIri(lookupThing, quad.predicate.value, obj.value);
    }

    thingMap.set(quad.subject.value, lookupThing);
  }

  let result = createSolidDataset();
  for (const thing of thingMap.values()) {
    result = setThing(result, thing);
  }

  // // Working with RDF/JS Datasets won't work for updates, as we need the
  // // SolidDataset 'changelog' to be updated (so that when saving back to the
  // // Pod it knows to do a PATCH, and not a PUT - and I don't think we can do a
  // // PUT due to the containment triples (which need to be managed
  // // server-side))...
  // const thingsToAdd = getThingAll(second);
  // let result = first;
  // thingsToAdd.forEach((thing) => {
  //   const predicateIris = Object.keys(thing.predicates);
  //   if (predicateIris.length > 0) {
  //     for (const predicate of predicateIris) {
  //       const values = getTermAll(thing, predicate);
  //       values.forEach((value) => {
  //         const readableValue = internal_getReadableValue(value);
  //
  //         addStatement(thing.url, predicate, value);
  //       });
  //     }
  //   }
  //
  //   result = setThing(result, thing);
  // };

  return result;
}

export function removeTypeTriples(
  dataset: SolidDataset,
  predicate: Iri,
  types?: Iri[]
): SolidDataset {
  const things = getThingAll(dataset);
  let result = createSolidDataset();
  things.forEach((thing) => {
    if (types === undefined) {
      const removed = removeAll(thing, predicate);
      result = setThing(result, removed);
    } else {
      const typesAsString = types.map((type) => type.value);
      // Get the collection of rdf:type values for this thing...
      let thingTypes = getIriAll(thing, RDF.type);

      // ...filter out the types we were asked to remove.
      thingTypes = thingTypes.filter((el) => !typesAsString.includes(el));

      // If this thing has no rdf:type triples matching our list of types,
      // then remove all occurrences of this predicate.
      if (thingTypes.length === 0) {
        const removed = removeAll(thing, predicate);
        result = setThing(result, removed);
      } else {
        let removed = thing;
        types.forEach((type) => {
          removed = removeIri(removed, RDF.type, type);
        });
        result = setThing(result, removed);
      }
    }
  });

  return result;
}

type DeleteOptions = Parameters<typeof deleteSolidDataset>[1];
// We don't need this feature yet, so commenting out (to lessen our test
// coverage requirements, since the original doesn't have any tests at all!).
// type OwnOptions = {
//   onPrepareDelete?: (url: UrlString) => void;
// };

export async function deleteRecursively(
  dataset: SolidDataset & WithResourceInfo,
  options?: DeleteOptions
  // ownOptions: OwnOptions = {}
): Promise<void> {
  const containedResourceUrls = getContainedResourceUrlAll(dataset);
  const containedDatasets = await Promise.all(
    containedResourceUrls.map(async (resourceUrl) => {
      try {
        return await getSolidDataset(resourceUrl, options);
      } catch (e) {
        // The Resource might not have been a SolidDataset;
        // we can delete it directly:
        // if (typeof ownOptions.onPrepareDelete === "function") {
        //   ownOptions.onPrepareDelete(resourceUrl);
        // }
        await deleteFile(resourceUrl, options);
        debug(`Deleted Pod file [${resourceUrl}]...`);
        return null;
      }
    })
  );

  await Promise.all(
    containedDatasets.map(async (containedDataset) => {
      if (containedDataset === null) {
        return null;
      }
      // return await deleteRecursively(containedDataset, options, ownOptions);
      // eslint-disable-next-line @typescript-eslint/return-await
      return await deleteRecursively(containedDataset, options);
    })
  );
  // if (typeof ownOptions.onPrepareDelete === "function") {
  //   ownOptions.onPrepareDelete(getSourceUrl(dataset));
  // }
  const datasetIri = getSourceUrl(dataset);
  const result = await deleteSolidDataset(dataset, options);
  debug(`Deleted Pod resource [${datasetIri}]...`);
  return result;
}

export async function parseStreamIntoSolidDataset(
  resource: string,
  stream: ReadStream
): Promise<{ name: string; dataset: SolidDataset }> {
  return new Promise((resolve, reject) => {
    const dataset = Dataset.dataset();
    rdfParser
      .parse(stream, { path: resource })
      .on("data", (quad) => {
        dataset.add(quad);
      })
      .on("error", (error) => {
        const message = `Parsing error reading RDF resource [${resource}]. Error: [${error.message}].`;
        debug(message);
        reject(new Error(message));
      })
      .on("end", () => {
        debug(`Parsed [${dataset.size}] triples from resource [${resource}].`);
        const solidDataset = fromRdfJsDataset(dataset);
        resolve({ name: resource, dataset: solidDataset });
      });
  });
}
