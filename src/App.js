"use strict";

/**
 * Main App component for the High Score Tracker
 * This is the root component that sets up the overall layout and routing
 * Uses React Bootstrap for responsive mobile-first design
 */

import React from "react";
import { observer } from "mobx-react-lite";
import { Container, Navbar, Nav, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import { GameList } from "./components/GameList.js";
import { GameDetail } from "./components/GameDetail.js";
import { AddGameForm } from "./components/AddGameForm.js";
import { AddScoreForm } from "./components/AddScoreForm.js";
import Header from "./components/Header.js";

/**
 * @typedef {import('./types/index.js').StorageConfig} StorageConfig
 */

/**
 * Main App component
 * Uses MobX observer to automatically re-render when store state changes
 * @param {Object} props - Component props
 * @param {GameStore} props.store - Game store instance
 * @returns {JSX.Element} The rendered App component
 */
const App = observer(({ store }) => {
  React.useEffect(() => {
    store.loadGames();
  }, []);

  return (
    <div className="App">
      <Header
        viewName="home"
        gameCount={store.gamesCount}
        playerCount={store.playerCount}
      />

      {/* Main Content */}
      <Container>
        {/* Error Alert */}
        {store.hasError && (
          <Alert variant="danger" className="mb-3">
            <Alert.Heading>Error</Alert.Heading>
            <p>{store.error}</p>
          </Alert>
        )}

        {/* Loading Indicator */}
        {store.isLoading && (
          <div className="d-flex justify-content-center mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Home content is the game list */}
        <GameList
          games={store.games}
          onGameSelect={(gameId) => store.setCurrentGame(gameId)}
          onDeleteGame={(gameId) => store.deleteGame(gameId)}
        />
      </Container>
    </div>
  );
});

export default App;
