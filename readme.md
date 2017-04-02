![Travis CI Status Image](https://travis-ci.org/RLuckom/water-shape.svg)
Description
==================

Persistence and data access based on a simple schema.

Water-shape arose out of my desire for a simple way to autogenerate
database, server, and API clients in javascript. I started with an idea
for a very simple schema describing the data to be stored. I wanted the 
schema to be specific enough to be translated into a SQLite schema,
but simple enough to allow quick iteration. The best example of a schema
for reference is the [schema used in water-shape's test suite](https://github.com/RLuckom/water-shape/blob/master/spec/unit/testSchema.js). 

Water-shape the library is simply a collection of modules for turning
a water-shape schema object into a water-shape Data Manipulation Interface
(DMI) that can talk to a data store.

A water-shape DMI is simply a standardized tree-like object for CRUD 
operations on data. Its keys are the names of tables. Each key's value
is an object exposing asynchronous `save`, `update`, `delete`, `deleteByID`,
`list`, `getById`, and `search` functions. By calling 

       dmi.<tableName>.save(object, callback);

you save a record in the table, and are notified of success or failure
in `callback`.

On a server, the `sqlite-adapter` module can turn the schema into a file-
backed SQLite DMI object, and the `hapi-adapter` can use the schema and the
SQLite DMI to expose REST endpoints corresponding to the data represented
by the schema, backed by the database. On the client, the `request-adapter`
can take the schema and a base address and turn it into a DMI for use by
UI components.

The guarantee provided by water-shape is that, if your code is written
against water-shape DMI objects, *it doesn't matter what is actually backing
the DMI*. If you write a piece of code that uses the DMI to count how many
users you have in your `users` table, that code will run on the back-end,
where the DMI supplied might be an object accessing the database directly,
or on the front-end, where the DMI supplied is an object that makes REST
requests into a server. This allows you to write your utility code exactly
once, and not worry about maintaining separate libraries for separate
environments. This benefit is used in the tests for water-shape itself--the
core tests are implemented in [just one place](https://github.com/RLuckom/water-shape/blob/master/spec/unit/dataManipulationInterfaceTest.js), and run identically against
each kind of DMI.

Another benefit of consistent DMIs is the ability to create more sophisticated
behavior in a flexible, generic way. While working on my [bucket-brain](https://github.com/RLuckom/bucket-brain) project,
I wanted a way to query a sort of 'view' into the database without having to
make a ton of individual queries. Specifically, I wanted a JSON object that
selected a particular record and also included records referencing it in other
tables. So I wrote a module that takes the schema description of this `TREE` "table",
plus an existing DMI, and returns access methods for the data described in the 
schema description. Using this pattern, I also added the ability to include
validation logic in the schema itself, so that you can validate your data
identically wherever your code is running (subject to race conditions--obviously
front-end validation is best-effort only, to improve UX). I also added
optimizations for constructed tables in the API client layer; when the API
client is querying a `TREE` type table, it first tries to make a simple
`GET` request to the server. If the server knows about `TREE` tables, it will
be faster than the API client trying to make individual REST calls for each
piece of data required. If the server returns an error, the client falls back
on constructing the data one request at a time from the relevant tables.

This project is based around a simple specification for two kinds of JS objects;
the schema definition object and the output DMI. This design allows a huge amount
of extensibility in multiple dimensions:

 1. It would be easy to write a module that would construct a DMI based on a
    message queue, or a websocket, and all code written for a project would
    then work through a websocket or queue.
 2. It is easy to write custom types of data access based on CRUD operations;
    once they are implemented once, they are available in all environments.
 3. Any environment-specific optimization can be implemented only where it
    is relevant; the API client can try to be lazy where it would be more
    efficient for the DB to construct a view; you could also implement caching
    at any layer.

This is not enterprise, production-ready code. It works, and all success paths
are automatically tested by Travis on each check-in. But because I use it only
for my personal projects, I haven't seen fit to do all the work testing error
cases, writing documentation, etc. that I would if it was supporting a real
product. If I had been developing for a real product, I would not have written
this at all; I would have used an off-the-shelf, supported framework.

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
