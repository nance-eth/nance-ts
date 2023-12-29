import axios from 'axios';

const API_V1 = 'https://api.guild.xyz/v1';
const ACCESS = 'guild/access';

type GuildxyzAccess = {
  roleId: number;
  access: boolean;
  requirements: {
    requirementId: number;
    access: boolean;
    amount: number
  }
};

const fetcher = async <T>(req: string): Promise<T> => {
  try {
    const res = await axios.get(req);
    const json = await res.data;
    return json;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getAddressRoles = async (address: string, guildId: number | string) => {
  const req = `${API_V1}/${ACCESS}/${guildId}/${address}`;
  const res = await fetcher<GuildxyzAccess[]>(req);
  // console.dir(res, { depth: null });
  return res;
};
