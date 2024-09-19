import { request as gqlRequest, gql } from "graphql-request";
import { keys } from "@/keys";

const hub = "https://hub.snapshot.org";

export const getAddressVotingPower = async (address: string, space: string): Promise<number> => {
  try {
    const query = gql`
    {
      vp (voter: "${address}", space: "${space}") {
        vp
      }
    }`;
    const { vp } = await gqlRequest(`${hub}/graphql`, query, {
      "x-api-key": keys.SNAPSHOT_API_KEY
    });
    return vp.vp;
  } catch (e) {
    console.error(e);
    return 0;
  }
};
