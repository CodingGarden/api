# Coding Garden API

An API for the Coding Garden YouTube / Twitch channel.

## Endpoints

-   `GET /patreon/pledges`
-   `GET /youtube/members`
-   `GET /youtube/stats`

## Configuration

```sh
npm install
cp .env.sample .env # update accordingly
```

Copy `src/services/youtube/members.config.sample.js` to `src/services/youtube/members.config.js` and update accordingly. Needed values can be found by inspecting network traffic in the YouTube Dashboard: https://studio.youtube.com/channel/channel-id-here/monetization/memberships.

```sh
cp src/services/youtube/members.config.sample.js src/services/youtube/members.config.js
```

## Lint

```sh
npm run lint
```

## Development

```sh
npm run dev
```

## Docker

For ease of use, there is a docker-compose file container MongoDB and the NodeJS server.
follow the same configuration steps then run

```sh
docker-compoose up
```

To get things up and running.
the docker-compose file is set with hot-reloading for dev.

Run `docker-compose down` to stop everything
