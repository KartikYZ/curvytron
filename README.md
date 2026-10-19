Curvytron
=========

A web multiplayer Tron game like with curves

> **Curvytron 2 is out!** Play the sequel at [curvytron2.com](https://curvytron2.com).

## Installation

* [Get your local Curvytron server in 1 minute!](doc/installation.md)

---

## Wanna help?

* [See how you can make the game better](doc/contribution.md)
* [Setup you development environment](doc/dev.md)

---

## We need to go deeper

* [Configuration reference](doc/configuration.md)
* [Setup Nginx proxy](doc/nginx-proxy.md)

## Running behind Modal Sticky Sessions

Set `CURVYTRON_LAUNCHER_URL` to a launcher that maps room names to [Modal Sticky Sessions](https://modal.com/docs/guide/sticky-sessions), so that every player in a room reaches the same server. When it is set:

* `/modal.js` exposes the launcher URL to the client.
* Creating a room from the lobby navigates to `<launcher>/room/<name>` instead of creating it on the current server.
* The room page shows `<launcher>/room/<name>` as its invite link.
* `PUT /rooms/:name` creates the room unless it already exists (`201` when created, `200` when it exists), so the launcher can open a room on the server that holds its session.

Without it, Curvytron behaves as upstream.
