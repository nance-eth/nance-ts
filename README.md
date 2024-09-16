# Nance
> enabling communal decision making
> 
Nance is a governance platform for decentralized, token based communites. With the [nance-interface](https://github.com/nance-eth/nance-interface)

Nance allows your community members to:
1. create proposals
2. discuss them in your Discord
3. keep community members up-to-date on proposal edits
4. perform a react based poll in Discord
5. publish to your [Snapshot](https://snapshot.org/#/)
6. submit transactions to your [Safe Wallet](https://safe.global) (include [Juicebox](https://juicebox.money) project reconfigurations)
7. search through past proposals
8. and more!

When you use Nance all of your data is published and open on [DoltHub](https://dolthub.com), a version controlled mySQL database. This allows you to always access everything that Nance has access to, no CSV exports required!

We even keep our system database up-to-date on [DoltHub here](https://www.dolthub.com/repositories/nance/nance_sys) so you can use our config data if you'd like

_Note:
This repo contains both [nance-api](/src/api) and [nance-scheduler](/src/scheduler) (a [node-schedule](https://www.npmjs.com/package/node-schedule) based job runner). For production we run both of these services on [Railway](https://railway.app)._

## Self hosting API

In order to run your own instance of the nance-api you will need access to the following services:
* [Infura](https://www.infura.io) RPC key
* [Infura](https://www.infura.io) IPFS key
* [HostedDolt](https://hosted.doltdb.com) instance
* Wallet private key to upload proposals to Snapshot
* [Discord](https://discord.com/developers/docs/intro) bot key

We run the nance-api on [Railway](https://railway.app?referralCode=UAqXpP), you can deploy your own instance of it by clicking the button below and filling in the required environment variables

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/DqkfRY?referralCode=UAqXpP)

### API Usage
`npm run dev` --> launches local instance of API on port 3003

`npm run build:api` --> compiles api to javascript and copies required assets into `./dist`

`npm run start:api` --> runs compiled version of API

## Task Scheduler Usage
`npm run build:scheduler` --> compiles scheduler to javascript

`npm run start:scheduler` --> runs compiled version of scheduler

This will load a JSON formatted calendar for each organization from our [nance_sys DoltDB](https://www.dolthub.com/repositories/nance/nance_sys)
and schedule appropriate tasks.

## Local Database setup

`npm run db:setup`

run local db and launch API in dev mode

`npm run dev:db:local`

