# Nance
> enabling communal decision making
> 
Nance is a governance platform for decentralized, token based communites. With the [nance-interface](https://github.com/nance-eth/nance-interface)

Nance allows your community members to:
1. create proposals
2. discuss them in your Discord
3. keep community members up-to-date on proposal edits
4. take an emoji vote in your Discord
5. publish to your [Snapshot](https://snapshot.org/#/)
6. submit transactions to your [Safe Wallet](https://safe.global) (include [Juicebox](https://juicebox.money) project reconfigurations)
7. search through past proposals
8. and more!

When you use Nance all of your data is published and open on [DoltHub](https://dolthub.com), a version controlled mySQL database. This allows you to always access everything that Nance has access to, no CSV exports required!

We even keep our system database up-to-date on [DoltHub here](https://www.dolthub.com/repositories/nance/nance_sys) so you can use our config data if you'd like

_Note:
This repo contains both [nance-api](/src/api) and [nance-auto](/src/index) (cronjobs based actions for your organization). We are slowly migrating all tasks into nance-api but for now there are still a few things that only run as cronjobs in nance-auto (requires a server or to be run locally)_

## Self hosting API

In order to run your own instance of the nance-api you will need access to the following services:
* [Infura](https://www.infura.io) RPC key
* [Infura](https://www.infura.io) IPFS key
* [HostedDolt](https://hosted.doltdb.com) instance
* Wallet private key to upload proposals to Snapshot
* [Discord](https://discord.com/developers/docs/intro) bot key

We run the nance-api on [Railway](https://railway.app?referralCode=UAqXpP), you can deploy your own instance of it by clicking the button below and filling in the required environment variables

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/DqkfRY?referralCode=UAqXpP)

### Other useful information
`npm run dev:api` --> launches local instance of API on port 3003

`npm run build:api` --> compiles to javascript and copies required assets into `./dist`

`npm run start:api` --> runs compiled version of API

## Self hosting cronjobs

In order to run the nance-auto cornjobs you will need to have a small server (we use a $18/month Droplet from  [Digital Ocean](https://m.do.co/c/cfc0fc4755c6))

Edit [process.json] with `CONFIG` set to your organizations name

```
git clone git@github.com:nance-eth/nance-ts.git
cd nance-ts
npm install
pm2 process.json
```

This will load the calendar ics file for the organization from the Dolt database and setup all the tasks for that organizations governance process.

## Database setup

tbd
