# Steam Achievements Webhook System

A microservice-based system that allows users to subscribe to Steam accounts and receive real-time notifications when achievements are unlocked in supported games.

## Overview

This system periodically polls the Steam Web API for user achievement data and sends notifications to subscribed clients through webhooks. It is composed of the following services:

- **subscription-service**: Manages subscriptions and webhook registrations.
- **polling-service**: Polls Steam for achievement data of games played by the user.
- **receiver-service**: Receives achievement notifications, it is the default callback url for the webhooks if none is provided to the subscription service.
- **PostgreSQL databases**: One database per service.

![Architecture Overview](/doc/img/steam-achievements.webp)

## Deployment

The system uses [docker](https://www.docker.com/) for deployment.

1. **Clone the repo**
    ```bash
    git clone https://github.com/daveidhg/steam-achievements.git
    cd steam-achievements

2. Create a .env file for each service based on the provided .env.example files. \
    Steam Web API key needs to be added to the .env of the polling-service. An API key can be created [here](https://steamcommunity.com/dev/apikey).

3. Start all services with Docker
    ```bash
    docker compose up --build

4. Test if services are running
    * [subscription-service](http://localhost:5000)
    * [polling-service](http://localhost:5001)
    * [receiver-service](http://localhost:5002) 


## API Documentation

### Subscription Service

**Base URL From Host Machine:** `http://localhost:5000` \
**Base URL Between Services:** `http://subscription-service:5000`

---

#### `POST /subscriptions`

Register a new subscription.

**Headers:**
- `apikey: your_api_key` - This is configured in .env

**Body:**
```json
{
    "steamid": "12345678901234567", 
    "callback_url": "http://example-receiver.com/achievements" 
}
```
`steamid` must be a 17-digit steamID64. \
`callback_url` is optional - defaults to `receiver-service`.

**Responses:**
- `200 OK` if the subscription is already registered
```json
{
    "message": "Subscription already exists, no action taken."
}
```


- `201 Created` if the subscription was successfully saved
```json
{
    "message": "Subscription registered"
}
```

- `400 Bad Request` if the steamid is missing or invalid, or the callback_url is invalid.

---

#### `DELETE /subscriptions`

Deletes a subscription

**Headers:**
- `apikey: your_api_key` - This is configured in .env

**Body:**
```json
{
    "steamid": "12345678901234567", 
    "callback_url": "http://example-receiver.com/achievements" 
}
```
`steamid` must be a 17-digit steamID64. \
`callback_url` is optional - defaults to `receiver-service`.

**Responses:**
- `200 OK` if the subscription is deleted (or did not exist)
```json
{
    "message": "Subscription deleted"
}
```

- `400 Bad Request` if the steamid or callback_url is missing or invalid

---

#### `GET /subscriptions` 
Retrieves all registered subscriptions

**Headers:**
- `apikey: your_api_key` - This is configured in .env

**Response:**
- `200 OK`
```json
{
    [
        {
            "id":1,
            "steamid":"12345678901234567",
            "callback_url":"http://receiver-service:5002/achievements",
            "created_at":"2025-07-07T17:44:11.427Z"
        },
        {   
            "id":2,
            "steamid":"12345678901234567",
            "callback_url":"http://example-receiver.com/achievements",
            "created_at":"2025-07-07T19:11:36.872Z"
        }
    ]
}
```

---
### Polling Service 

**Base URL From Host Machine:** `http://localhost:5001` \
**Base URL Between Services:** `http://polling-service:5001` \
*NOTE* This API is only meant to be used by the `subscription-service` to fill up the polling queue.

--- 
#### `POST /notify`
Adds an entry to the polling queue

**Headers:**
- `apikey: your_api_key` - This is configured in .env

**Body:**
```json
{
    "steamid": "12345678901234567",
    "callback_url": "http://receiver-service:5002/achievements",
    "initial": true
}
```
`steamid` must be a 17-digit steamID64. \
`callback_url` endpoint to send the webhook containing achievements. \
`initial` whether the subscription is new or not - new subscriptions go through all games, scheduled pollings check recently played games only.

**Responses:**
- `200 OK` if the requested steamid is already in queue.
```json
{ 
    "message": "Pending entry already exists" 
}
```

- `201 Created` if the steamid is put in the polling queue
```json
{
    "message": "Entry added to polling queue"
}
```

- `400 Bad Request` if the steamid or callback_url is missing
```json
{
    "error": "Missing steamid or callback_url"
}
```

--- 

### Receiver Service

**Base URL From Host Machine:** `http://localhost:5002` \
**Base URL Between Services:** `http://receiver-service:5002`

---

#### `POST /achievements` 
Stores achievements in the receiver database

**Body:**
```json 
{
    "steamid": "12345678901234567",
    "appid": "440",
    "achievements": [
        {
            "name": "Flamethrower",
            "unlocktime": 1451087373,
            "description": "Set five enemies on fire in 30 seconds.",
            "gameName": "Team Fortress 2"
        },
        {
            "name": "Nemesis",
            "unlocktime": 1526635333,
            "description": "Get five revenge kills.",
            "gameName": "Team Fortress 2"
        }
    ]
}
```

**Responses:**
- `201 Created` if the achievements were successfully stored
```json 
{
    "message": "Achievements received and stored"
}
```

- `400 Bad Request` if steamid, appid, or achievements are missing or invalid
```json
{
    "error": "Missing or invalid steamid, appid, or achievements" 
}
```

---

#### `GET /achievements`
Gets all achievements matching the set criteria

**Parameters:** \
`steamid` 17 digit steamID64 - *optional* \
`appid` id of the game you want to retrieve achievements from - *optional*

**Responses:**
- `200 OK`
```json
[
    {
        "id": 1,
        "steamid": "12345678901234567",
        "appid": "440",
        "game_name": "Team Fortress 2",
        "achievement_name": "Flamethrower",
        "unlock_time": "2015-12-25T23:49:33.000Z",
        "description": "Set five enemies on fire in 30 seconds."
    },
    {
        "id": 2,
        "steamid": "12345678901234567",
        "appid": "440",
        "game_name": "Team Fortress 2",
        "achievement_name": "Nemesis",
        "unlock_time": "2018-05-18T09:22:13.000Z",
        "description": "Get five revenge kills."
    }
]
```

- `400 Bad Request` if the steamid or appid is invalid
```json
{
    "error": "Invalid steamid format. It should be a 17-digit numeric string."
}

{
    "error": "Invalid appid format. It should be a numeric string."
}
```

- `404 Not Found` if the request found no achievements
```json
{
    "message": "No achievements found for the given criteria"
}
```
