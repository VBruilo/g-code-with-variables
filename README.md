# Parameterized G-Code

A TypeScript-based server for generating parameterized G-code for additive manufacturing. The project contains two components:

1. **Mock Config Server** – small Express server serving example configuration values.
2. **Parameterized G-Code Server** – the main application that creates final G-code and communicates with a PrusaLink printer.

## Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [Yarn](https://yarnpkg.com/) package manager

## Installation

```sh
yarn install
```

## Running the Servers

### Start the Mock Config Server

```sh
cd mock-config-server
node index.js
```
After starting, you should see:
```
Mock Config Server listening on port 3011
```

### Start the Main Server

From the repository root:
```sh
yarn dev
```

### Example Request

With both servers running, execute:
```sh
cd mock-config-server
node callPrint.js
```
This sends a request to the main server and demonstrates expected behaviour.

## Project Structure

```
mock-config-server/          # Express mock server
  index.js
  callPrint.js
  package.json
src/                         # Main server source
  config.ts                  # Environment configuration
  controller/                # Controllers
  helpers/                   # Handlebars Helpers
  routes/                    # API routes
  middleware/                # API Middleware
  services/                  # Business logic
  transformer/               # G-code transformation
  types/                     # Interfaces
  utilities/                 # Utilities Functions
  server.ts                  # Application entrypoint
parameterized_g-code/        # G-code templates and output
gcode/                      # G-code templates for logo or body
```

## Environment Variables

- `CONFIG_SERVER_URL` – configuration server base URL (default `http://localhost:3011`)
- `PRUSALINK_URL` – PrusaLink instance URL (default `http://192.168.12.20`)
- `PRUSALINK_API_KEY` – API key for PrusaLink (default `GGLfRCFkCEFXrEN`)

## API Endpoints

### `GET /api/printer/status`
Returns the mapped printer status. If the status was previously set via a
`PUT /api/printer/status` request, the stored value is returned instead of the
live value from PrusaLink.

Example response:
```json
{ "status": "ready-for-print" }
```

### `PUT /api/printer/status`
Starts either the calibration or shutdown sequence based on the provided
`status` body property. The value is then returned by subsequent
`GET /api/printer/status` calls.

Additional endpoints for starting, pausing and monitoring jobs are defined in [src/routes/controllerRoutes.ts](src/routes/controllerRoutes.ts).

## Testing

Run the unit tests with:

```sh
yarn test
```

## License

Released under the [MIT License](LICENSE).

