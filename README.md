# nance

an automated governance system

## install

`npm install`

## config

requires a config file `./src/config/<name>/config.<name>.ts` and
an ics calendar file `./src/config/<name>/<name>.ics`

## run

`npm start`

OR

`export NODE_ENV='prod' && export CONFIG='<name>' && ts-node src/index.ts`

## API

development:

`npm run dev:api`

production:

`npm run build:api`

`npm run start:api`
