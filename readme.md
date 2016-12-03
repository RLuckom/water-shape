![Travis CI Status Image](https://travis-ci.org/RLuckom/water-shape.svg)
Description
==================

Library for generating persistence layers, APIs and SDKs.

Requirements
============

Currently implemented:

        ├── api
        │   ├── demo-adapter.js -- in-memory persistence layer, can be used in tests or in browser
        │   └── request-adapter.js -- adapter that takes a request-style library and creates a dmi for network calls
        ├── persistence
        │   └── sqlite3-adapter.js -- sqlite3 persistence layer.
        └── server
            └── hapi-adapter.js -- server adapter.

Data Manipulation API
=====================

This core API must be implemented on any data access library so that domain-specific logic can be 
implemented once to run in all execution environments (server, client etc).


`<tableName>.save`: (Object instance, Function (err, data) callback) update or create a record of `instance`.

`<tableName>.update`: (Object instance, Function (err, data) callback) update the record of `instance`.

`<tableName>.delete`: (Object instance, Function (err, data) callback) delete the record of `instance`.

`<tableName>.deleteById`: (String | Number id,, Function (err, data) callback) delete the record identified by `id`.

`<tableName>.list`: (Function (err, data) callback) pass list of records to second param of `callback`.

`<tableName>.getById`: (String|Number id, Function (err, data) callback) pass record identified by `id` to second param of `callback`.

`<tableName>.search`: (Object instance, Function (err, data) callback) pass list of records matching populated fields of `instance` to second param of `callback`

Still deciding on the callback values for `save`, `update` and `delete` methods. The `update` methods *should* throw errors if the instances don't exist, but for now they're probably going to be copies of the `save` methods.

Data manipulation libraries may implement additional methods as appropriate to their execution environment, e.g. the api client library may implement `get`, `post`, `put` etc.
