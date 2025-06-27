# Parameterized G-Code

A TypeScript-based server for generating parameterized G-code for additive manufacturing. The application communicates with a PrusaLink printer to create final G-code files.


## Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [Yarn](https://yarnpkg.com/) package manager

## Installation

```sh
yarn install
```

## Running the Servers

### Start the Main Server

From the repository root:
```sh
yarn dev
```

## Project Structure

```
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
gcode/                      # G-code templates and outputs
```

## Environment Variables

- `CONFIG_SERVER_URL` – configuration server base URL (default `http://localhost:3011`)
- `PRUSALINK_URL` – PrusaLink instance URL (default `http://192.168.12.20`)
- `PRUSALINK_API_KEY` – API key for PrusaLink (default `GGLfRCFkCEFXrEN`)

## API Endpoints

### `GET /api/printer/status`
Returns the mapped printer status. If the status was previously set via a

`PUT /api/printer/status` request, that value is returned as long as the printer
is still executing the job triggered by the call. Once the job ID changes, the
live value from PrusaLink is served again.

Example response:
```json
{ "status": "ready-for-print" }
```

### `PUT /api/printer/status`
Starts either the calibration or shutdown sequence based on the provided
`status` body property. The chosen status is returned by `GET /api/printer/status`
until a new job ID is detected, at which point normal status reporting resumes.

Additional endpoints for starting, pausing and monitoring jobs are defined in [src/routes/controllerRoutes.ts](src/routes/controllerRoutes.ts).

## Testing

Run the unit tests with:

```sh
yarn test
```

## License

Released under the [MIT License](LICENSE).

