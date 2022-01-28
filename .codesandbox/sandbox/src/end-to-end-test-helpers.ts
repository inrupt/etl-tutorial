import { Session } from "@inrupt/solid-client-authn-browser";
import { sampleModuleFn } from "@inrupt/etl-tutorial";

export function getHelpers(podRoot: string, session: Session) {
  return {
    sampleModuleFn,
  };
}
