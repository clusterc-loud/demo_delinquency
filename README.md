# Vitt Chetak Unified Platform

This is a unified repository for the Vitt Chetak project, combining Frontend, Backend, and Machine Learning services into a single modular architecture.

## Project Structure

- **frontend/**: React/Vite application for the user interface.
- **backend/**: Node.js/Express API with logic for authentication, data management, and integration.
- **ml-service/**: FastAPI-based Machine Learning service providing predictive models for credit health and fraud detection.
- **blockchain/**: Placeholder for blockchain-related contracts and configurations.
- **shared/**: Shared utilities and configurations across components.

## Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- MongoDB (running instance)

## Getting Started

### 1. Install Dependencies

Install dependencies for all components from the root directory:

```bash
npm install
npm run install:all
```

### 2. Configure Environment

Create a `.env` file in the root directory (or individual service directories) based on the `.env.example` files provided.

### 3. Run the Project

To start all services (Frontend, Backend, and ML) concurrently:

```bash
npm run dev
```

Individual service scripts:
- `npm run dev:frontend`: Starts Vite development server (default port 5173).
- `npm run dev:backend`: Starts Node/NPM backend (default port 3000).
- `npm run dev:ml`: Starts Python ML service (default port 8000).

## ML Integration

The backend interacts with the ML service via the `backend/services/mlService.js` module. By default, it communicates with `http://localhost:8000`.

## Architecture Principles

- **Separation of Concerns**: ML logic is decoupled from business logic.
- **Scalability**: Each service can be scaled independently.
- **Modular Design**: Clear directory structure for easy maintenance.
