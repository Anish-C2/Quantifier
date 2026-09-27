# Quantifier — Q-OS Exhibition

An offline, hash-routed quantum computing exhibition.

Live: https://anish-c2.github.io/Quantifier/

## How to present

Open the site on a laptop or kiosk. Use **← →** or the on-screen **PREV / NEXT** buttons to walk visitors through the halls. Every hall has a stable URL.

| Hall | Hash route |
|---|---|
| Opening hall | `#/overview` |
| The qubit | `#/qubits` |
| Superposition | `#/superposition` |
| Quantum gates | `#/gates` |
| Entanglement | `#/entanglement` |
| Interference | `#/interference` |
| Deutsch algorithm | `#/deutsch` |
| Grover search lab | `#/grover` |
| Classical vs quantum | `#/compare` |
| Notation wall | `#/notation` |
| Q-MAZE | `#/maze` |

Example: `https://anish-c2.github.io/Quantifier/#/entanglement`

## What actually runs

Everything is a **local browser simulation**. No quantum hardware, no network accounts, no API keys.

- 1- and 2-qubit labs use a small complex state-vector engine.
- Grover uses the original Q-OS amplitude amplification on a 5-digit toy space (17 qubits / 100,000 valid states).
- Classical mode is an independent SHA-256 brute-force on 4 digits so the live runner stays responsive.
- Q-MAZE is the original maze laboratory, now a real page (`maze.html`) instead of an inline string.

## Files

- `index.html` — exhibition shell, routing, and all halls
- `maze.html` — Q-MAZE laboratory
- `README.md` — this note
