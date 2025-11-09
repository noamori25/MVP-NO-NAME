# MVP Full-Stack Project

A minimal full-stack application with Vue.js 3 client and Node.js/Express server, both using TypeScript.

## Project Structure

```
MVP-NO-NAME/
├── client/          # Vue.js 3 frontend
└── server/          # Node.js/Express backend
```

## Setup

### Prerequisites
- Node.js (latest version)
- Yarn package manager

### Installation

1. Install client dependencies:
```bash
cd client
yarn install
```

2. Install server dependencies:
```bash
cd ../server
yarn install
```

## Running the Application

### Development Mode

1. Start the server:
```bash
cd server
yarn dev
```
Server will run on `http://localhost:3000`

2. Start the client (in a new terminal):
```bash
cd client
yarn dev
```
Client will run on `http://localhost:5173`

### Production Build

1. Build the server:
```bash
cd server
yarn build
yarn start
```

2. Build the client:
```bash
cd client
yarn build
```

## API Endpoints

- `GET /admins` - Returns an empty array `[]`

