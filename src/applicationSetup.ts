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

import {
  INRUPT_COMMON,
  ETL_TUTORIAL,
  SOLID,
  // eslint-disable-next-line import/no-unresolved
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import {
  buildThing,
  getLiteralAll,
  getSolidDataset,
  SolidDataset,
  Thing,
  ThingBuilder,
} from "@inrupt/solid-client";
import { Session } from "@inrupt/solid-client-authn-node";
import { FOAF, RDF, RDFS } from "@inrupt/vocab-common-rdf-rdfdatafactory";

import debugModule from "debug";
import {
  getUserCredentialStringMandatory,
  getCredentialStringOptional,
} from "./credentialUtil";
import {
  buildDataset,
  deleteRecursively,
  getThingOfTypeMandatoryOne,
} from "./solidDatasetUtil";
import { clearTriplestore } from "./triplestore";
import {
  APPLICATION_NAME,
  APPLICATION_LABEL,
  APPLICATION_FIRST_LEVEL_OF_HIERARCHY,
  APPLICATION_ENTRYPOINT,
} from "./applicationConstant";
import { pluralize } from "./util";

const debug = debugModule(`${APPLICATION_NAME}:applicationSetup`);

// These default values can be useful if we wanted to populate a triplestore
// even if no Solid Pod details are provided at all.
const DEFAULT_WEBID = "https://test.example.com/test-user/profile/card#me";
export const DEFAULT_STORAGE_ROOT =
  "https://different.domain.example.com/testStorageRoot/";

// For users that do not provide a Pod storage root, we need to generate user-unique
// values.
let generatedUserId = 1;

// Object used to return wiring-up information for Data Source containers.
export interface DataSourceContainerObject {
  dataSourceContainerIri: string;
  dataSourceContainerBuilder: ThingBuilder<Thing>;
  resources: Thing[];
}

export async function initiateApplication(
  credential: SolidDataset,
  session: Session
): Promise<string> {
  // Clear out all data from our triplestore.
  await clearTriplestore(credential);

  let applicationEntrypointIri: string;

  if (session.info.isLoggedIn) {
    const storageRoot = getUserCredentialStringMandatory(
      credential,
      SOLID.storageRoot
    );

    // Attempt to fetch the root resource for our application.
    applicationEntrypointIri = `${storageRoot}${APPLICATION_ENTRYPOINT}`;

    const fetchedRootResource = await getSolidDataset(
      applicationEntrypointIri,
      {
        fetch: session.fetch,
      }
    ).catch((error) => {
      if (error.response.status === 404) {
        debug(
          `${APPLICATION_LABEL} root resource not found in Pod at [${applicationEntrypointIri}] - so nothing to clear out.`
        );
      } else {
        const message = `Error (apart from '404 - Not Found') attempting to retrieve root ${APPLICATION_LABEL} resource from Pod at [${applicationEntrypointIri}] - error: [${error}]`;
        debug(message);
        throw new Error(message);
      }
    });

    if (fetchedRootResource) {
      debug(
        `Found resource at [${applicationEntrypointIri}] - about to recursively delete...`
      );
      await deleteRecursively(fetchedRootResource, {
        fetch: session.fetch,
      }).catch((error) => {
        const message = `Failed to recursively delete ${APPLICATION_LABEL} resources from Pod at [${applicationEntrypointIri}] - error: [${error}]`;
        debug(message);
        throw new Error(message);
      });

      debug(
        `Deleted all previous ${APPLICATION_LABEL} data, ready to reload from data sources.`
      );
    } else {
      debug(
        `${APPLICATION_LABEL} not already installed in Pod - ready to load from data sources.`
      );
    }
  } else {
    debug(
      `Ignoring clear-out of existing ETL data from user Pod  (ETL tool did not log into it's identity provider, as we have no Access Token needed to attempt to access private data in any user's Pod).`
    );
    const storageRoot = getCredentialStringOptional(
      credential,
      SOLID.storageRoot,
      DEFAULT_STORAGE_ROOT
    ) as string;

    applicationEntrypointIri = `${storageRoot}${APPLICATION_ENTRYPOINT}`;
  }

  return applicationEntrypointIri;
}

export async function createWebIdProfileDocumentIfNeeded(
  credential: SolidDataset,
  session: Session,
  applicationEntrypointIri: string
): Promise<SolidDataset[]> {
  const resources = [];

  // We only need to create a WebID profile document if the user has not
  // providing a Solid Pod (e.g., maybe we're just populating a triplestore).
  // But if they have provided a Pod, then we could consider adding a link to
  // our application entrypoint...
  if (session.info.isLoggedIn) {
    debug(
      `No need to create a WebID profile document - user already has a Solid Pod.`
    );
  } else {
    const webId = getCredentialStringOptional(
      credential,
      SOLID.webId,
      DEFAULT_WEBID
    ) as string;

    const description = `No Solid Pod credentials were provided, so generating profile document for test user (with WebID [${webId}]).`;

    resources.push(
      buildDataset(
        buildThing({ url: webId })
          .addIri(RDF.type, FOAF.Person)
          .addStringEnglish(RDFS.label, "Generated test user")
          .addStringEnglish(RDFS.comment, description)
          // Wire up this user's profile document to our application's data
          // entrypoint...
          .addIri(ETL_TUTORIAL.etlTutorial, applicationEntrypointIri)
          .build()
      )
    );
    debug(description);
  }

  return resources;
}

export async function createApplicationResources(
  credential: SolidDataset,
  applicationEntrypointIri: string
): Promise<SolidDataset[]> {
  const resources = [];

  debug(`Creating resources specific to [${APPLICATION_LABEL}]...`);
  const detailThing = getThingOfTypeMandatoryOne(
    credential,
    INRUPT_COMMON.DataHierarchyFirst
  );

  const labels = getLiteralAll(detailThing, RDFS.label);
  const comments = getLiteralAll(detailThing, RDFS.comment);

  const etlRunContainer = `${applicationEntrypointIri}${APPLICATION_FIRST_LEVEL_OF_HIERARCHY}etl-run-1/`;

  resources.push(
    buildDataset(
      buildThing({ url: applicationEntrypointIri })
        .addIri(RDF.type, ETL_TUTORIAL.EtlTutorial)
        // Wire up this instance to it's container...
        .addIri(INRUPT_COMMON.dataHierarchyFirst, etlRunContainer)
        .build()
    )
  );

  const etlRunContainerBuilder = buildThing({ url: etlRunContainer })
    .addIri(RDF.type, INRUPT_COMMON.DataHierarchyFirst)
    .addStringEnglish(RDFS.label, "ETL process 1")
    .addStringEnglish(
      RDFS.comment,
      "Container for the first ETL process instance."
    );

  labels.forEach((literal) =>
    etlRunContainerBuilder.addLiteral(RDFS.label, literal)
  );
  comments.forEach((literal) =>
    etlRunContainerBuilder.addLiteral(RDFS.comment, literal)
  );

  resources.push(buildDataset(etlRunContainerBuilder.build()));

  // Create a container for all notifications for our application (regardless
  // of ETL run instance, or data source).
  const notificationContainerIri = `${applicationEntrypointIri}notification/`;
  resources.push(
    buildDataset(
      buildThing({ url: notificationContainerIri })
        .addIri(RDF.type, INRUPT_COMMON.NotificationContainer)
        .addStringEnglish(RDFS.label, `Notification container`)
        .addStringEnglish(
          RDFS.comment,
          `Container for all notifications for ${APPLICATION_LABEL}, regardless of ETL run or data source.`
        )
        .build()
    )
  );

  const resourceText = pluralize("resource", resources);
  debug(
    `...created [${resources.length}] [${APPLICATION_LABEL}] specific ${resourceText}.`
  );
  return resources;
}

export function makeDataSourceContainerBuilder(
  dataSourceContainerIri: string,
  dataSource: string
): ThingBuilder<Thing> {
  return buildThing({ url: dataSourceContainerIri })
    .addIri(RDF.type, INRUPT_COMMON.DataSourceContainer)
    .addStringEnglish(RDFS.label, `${dataSource} container`)
    .addStringEnglish(
      RDFS.comment,
      `Detailed data extracted from [${dataSource}].`
    );
}

/**
 * Note: For future work - it would be nicer if this function took in an
 * "Authenticated Response" parameter (that contained whatever this function
 * needs) as opposed to the original credentials.
 *
 * @param dataSource A simple label for the data source we're working with.
 * @param credential A dataset holding the user credentials.
 */
export function wireUpDataSourceContainer(
  dataSource: string,
  credential: SolidDataset
): DataSourceContainerObject {
  const resources = [];

  // Provide a default storage root in case this user has not provided any
  // Solid Pod credentials.
  // This is useful if loading only to a triplestore, as we need some base IRI
  // for all the triples in this user's data.
  const storageRoot = getCredentialStringOptional(
    credential,
    SOLID.storageRoot,
    `https://example.com/generatedUser-${generatedUserId}/storageRoot/`
  );
  generatedUserId += 1;

  // Based on the Pod root, we can know where our app is, and where this
  // ETL run should store its data.
  const etlRunContainer = `${storageRoot}${APPLICATION_ENTRYPOINT}${APPLICATION_FIRST_LEVEL_OF_HIERARCHY}etl-run-1/`;

  const dataSourceContainerIri = `${etlRunContainer}dataSource/${dataSource}/`;

  // We need to iterate over many resources, adding each to our container,
  // so just create the builder.
  const dataSourceContainerBuilder = makeDataSourceContainerBuilder(
    dataSourceContainerIri,
    dataSource
  );

  // We re-create the same overall ETL Run resource here.
  // This is just to allow us add the triple connecting this run to our
  // data source's overall container, as we assume it's already been added
  // (i.e., by the first data source), hence no other triples needed.
  resources.push(
    buildThing({ url: etlRunContainer })
      .addIri(INRUPT_COMMON.dataSource, dataSourceContainerIri)
      .build()
  );

  return {
    dataSourceContainerIri,
    dataSourceContainerBuilder,
    resources,
  };
}
