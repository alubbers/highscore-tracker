"use strict";

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AddGameForm } from "./components/AddGameForm.js";
import { AddScoreForm } from "./components/AddScoreForm.js";
import { GameList } from "./components/GameList.js";
import { GameStore } from "./stores/GameStore.js";
import { MemoryStorageService } from "./services/MemoryStorageService.js";

// Initialize storage service with environment variables
/** @type {StorageConfig} */
const storageConfig = {
  useLocalStorage: process.env.REACT_APP_USE_LOCAL_STORAGE === "true" || true, // Default to local storage
  bucketName: process.env.REACT_APP_STORAGE_BUCKET || "highscore-tracker-dev",
  projectId: process.env.REACT_APP_GCP_PROJECT_ID || "your-project-id",
  keyFilename: process.env.REACT_APP_GCP_KEY_FILE, // Path to service account key
  localStoragePath: process.env.REACT_APP_LOCAL_STORAGE_PATH || "./data",
};

// Create singleton instances
const storageService = new MemoryStorageService(storageConfig);
const gameStore = new GameStore(storageService);

const router = createBrowserRouter([
  {
    path: "/",
    element: <GameList store={gameStore} />,
  },
  {
    path: "/addGame",
    element: <AddGameForm store={gameStore} />,
  },
  {
    path: "/addScore/:id",
    element: <AddScoreForm store={gameStore} />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
      crossOrigin="anonymous"
    />
    <RouterProvider router={router} />
  </React.StrictMode>,
);
