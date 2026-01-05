import { PromiseWithResolvers } from "../helpers/index.js";

export interface CreateCredentialResult {}

function createCredential(rpid: string): Promise<CreateCredentialResult> {
  const { promise, resolve, reject } =
    PromiseWithResolvers<CreateCredentialResult>();

  return promise;
}

export { createCredential };
