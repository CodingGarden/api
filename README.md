# Coding Garden API

An API for the Coding Garden YouTube / Twitch channel.

## Endpoints

* `GET /patreon/pledges`
* `GET /youtube/members`
* `GET /youtube/stats`

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
