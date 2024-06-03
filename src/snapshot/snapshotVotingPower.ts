import { request as gqlRequest, gql } from "graphql-request";

const hub = "https://hub.snapshot.org";

export const getAddressVotingPower = async (address: string, space: string): Promise<number> => {
  try {
    const query = gql`
    {
      vp (voter: "${address}", space: "${space}") {
        vp
      }
    }`;
    const { vp } = await gqlRequest(`${hub}/graphql`, query);
    return vp.vp;
  } catch (e) {
    console.error(e);
    return 0;
  }
};
