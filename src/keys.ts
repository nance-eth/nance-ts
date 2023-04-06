import 'dotenv/config';

export const keys = {
  PROVIDER_KEY: process.env.PROVIDER_KEY ?? '',
  INFURA_KEY: process.env.INFURA_KEY ?? '',
  INFURA_IPFS_ID: process.env.INFURA_IPFS_ID ?? '',
  INFURA_IPFS_SECRET: process.env.INFURA_IPFS_SECRET ?? '',
  DEEPL_KEY: process.env.DEEPL_KEY ?? '',
  PRIVATE_KEY: process.env.PRIVATE_KEY ?? '',
  GITHUB_KEY: process.env.GITHUB_KEY ?? '',
  DOLT_KEY: process.env.DOLT_KEY ?? '',
  STORAGE_KEY: process.env.NFT_STORAGE_KEY ?? '',
  TENDERLY_KEY: process.env.TENDERLY_KEY ?? '',
};

export const nanceAddress = process.env.PUBLIC_ADDRESS ?? '';
