# Parameterized_G_Code
Bachelor Thesis. Generation and Usage of Parameterized G-code for Additive Manufacturing

# Parameterized G-Code Server

Dieses Projekt besteht aus zwei Hauptkomponenten:

1. **Mock Config Server**: Ein einfacher Express-Server, der Beispielkonfigurationswerte bereitstellt.
2. **Parameterized G-Code Server**: Der Hauptserver der Anwendung, der mit TypeScript läuft.

## Installation

Stelle sicher, dass du [Yarn](https://yarnpkg.com/) installiert hast.

1. Klone das Repository oder navigiere in das Projektverzeichnis.
2. Installiere die Abhängigkeiten mit:
   ```sh
   yarn install
   ```

## Server starten

### 1. Mock Config Server starten

Navigiere in den Ordner `mock-config-server` und starte den Server:

```sh
cd mock-config-server
node index.js
```

Nach dem erfolgreichen Start sollte im Terminal folgende Meldung erscheinen:

```
Mock Config Server listening on port 3001
```

### 2. Hauptserver starten

Navigiere zurück in den Hauptordner und starte den Hauptserver mit:

```sh
yarn dev
```

Nach einem erfolgreichen Start sollte eine entsprechende Meldung ausgegeben werden.

### 3. Beispielhafter Befehl ausführen

Nachdem beide Server laufen, kannst du einen Beispielbefehl ausführen:

```sh
cd mock-config-server
node callPrint.js
```

Dadurch wird eine Anfrage gesendet und das erwartete Verhalten getestet.

## Struktur des Projekts

```
/mock-config-server       # Mock Server mit Express
  ├── index.js            # Startpunkt für den Mock Server
  ├── callPrint.js        # Beispielaufruf für den Mock Server
  ├── package.json        # Abhängigkeiten für den Mock Server
/parameterized_g-code     # Hauptserver mit TypeScript
  ├── src
      ├── config          # Konfigurationsdateien
      ├── controller      # Steuerungslogik
      ├── routes          # API-Routen
      ├── transformer     # Verarbeitung von G-Code
  ├── server.ts           # Startpunkt des Hauptservers
  ├── package.json        # Abhängigkeiten für den Hauptserver
  ├── tsconfig.json       # TypeScript Konfiguration
```

## Voraussetzungen

- Node.js (empfohlen: die neueste LTS-Version)
- Yarn als Paketmanager

