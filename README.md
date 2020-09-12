# Coding Garden API

An API for the Coding Garden YouTube / Twitch channel.

## Endpoints

* `GET /patreon/pledges`
* `GET /youtube/members`
* `GET /youtube/stats`

## Configuration

```sh npm install cp .env.sample .env # update accordingly cp .env.sample .env # update accordingly --- See extra info below ``` Copy `src/services/youtube/members.config.sample.js` to `src/services/youtube/members.config.js` and update accordingly. Needed values can be found by inspecting network traffic in the YouTube Dashboard: https://studio.youtube.com/channel/channel-id-here/monetization/memberships. @@ -32,3 +32,24 @@ npm run lint ```sh npm run dev ``` ## Extra info NODE_ENV=                  <--- In what state the app should be build in -- production or development. PORT=                      <--- On what port the app should run. PATREON_ACCESS_TOKEN=      <--- You can get this token on https://www.patreon.com/portal/registration/register-clients PATREON_CAMPAIGN_ID=       <--- You can get this token on https://www.patreon.com/portal/registration/register-clients PATREON_WEBHOOK_SECRET=    <--- You can get this token on https://www.patreon.com/portal/registration/register-clients STREAMLABS_SOCKET_TOKEN=   <--- You cen get this info on  https://streamlabs.com/ TWITCH_CHANNEL_NAME=       <--- Your own channel name. TWITCH_CHANNEL_ID=         <--- Your own channel id. MONGO_URI=                 <--- Your MongoDB connection string. CLIENT_API_KEY=            <--- The client API key what you can use to connect to this API. TWITCH_REWARDS_TOKEN=      <--- Your rewards token from twitch. TWITCH_SUB_CLIENT_ID=      <--- Your client id from twitch. TWITCH_SUB_OAUTH_TOKEN=    <--- Your own OAUTH token -- WARNING! If the token is like this: oauth:-token- you need to set OAUTH_INCLUDED to true, otherwise set it to false! This is very important as it otherwise it wont work! TWITCH_SUB_REFRESH_TOKEN=  <--- Your own refresh token from twitch. Developing=                <--- Set this to true if NODE_ENV=development otherwise set it to false OAUTH_INCLUDED=            <--- Only set this to true if your TWITCH_SUB_OAUTH_TOKEN begins with oauth:-token-, otherwise set it to false