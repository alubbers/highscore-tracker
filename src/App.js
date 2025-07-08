/**
 * Main App component for the High Score Tracker
 * This is the root component that sets up the overall layout and routing
 * Uses React Bootstrap for responsive mobile-first design
 */

import React from "react";
import { observer } from "mobx-react-lite";
import { Container, Navbar, Nav, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import { GameStore } from "./stores/GameStore.js";
import { StorageService } from "./services/StorageService.js";
import { GameList } from "./components/GameList.js";
import { GameDetail } from "./components/GameDetail.js";
import { AddGameForm } from "./components/AddGameForm.js";
import { AddScoreForm } from "./components/AddScoreForm.js";

/**
 * @typedef {import('./types/index.js').StorageConfig} StorageConfig
 */

// Initialize storage service with environment variables
/** @type {StorageConfig} */
const storageConfig = {
  bucketName: process.env.REACT_APP_STORAGE_BUCKET || "highscore-tracker-dev",
  projectId: process.env.REACT_APP_GCP_PROJECT_ID || "your-project-id",
  keyFilename: process.env.REACT_APP_GCP_KEY_FILE, // Path to service account key
};

// Create singleton instances
const storageService = new StorageService(storageConfig);
const gameStore = new GameStore(storageService);

/**
 * Main App component
 * Uses MobX observer to automatically re-render when store state changes
 * @returns {JSX.Element} The rendered App component
 */
const App = observer(() => {
  /** @type {['games' | 'add-game' | 'add-score', React.Dispatch<React.SetStateAction<'games' | 'add-game' | 'add-score'>>]} */
  const [currentView, setCurrentView] = React.useState("games");

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showAddGame, setShowAddGame] = React.useState(false);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showAddScore, setShowAddScore] = React.useState(false);

  // Load games on component mount
  React.useEffect(() => {
    gameStore.loadGames();
  }, []);

  /**
   * Handle navigation between different views
   * @param {'games' | 'add-game' | 'add-score'} view - The view to navigate to
   */
  const handleNavigation = (view) => {
    setCurrentView(view);
    setShowAddGame(view === "add-game");
    setShowAddScore(view === "add-score");
  };

  /**
   * Handle successful game creation
   */
  const handleGameCreated = () => {
    setShowAddGame(false);
    setCurrentView("games");
  };

  /**
   * Handle successful score addition
   */
  const handleScoreAdded = () => {
    setShowAddScore(false);
    setCurrentView("games");
  };

  return (
    <div className="App">
      {/* Navigation Header */}
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
        <Container>
          <Navbar.Brand href="#home">🏆 High Score Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                href="#games"
                active={currentView === "games"}
                onClick={() => handleNavigation("games")}
              >
                Games
              </Nav.Link>
              <Nav.Link
                href="#add-game"
                active={currentView === "add-game"}
                onClick={() => handleNavigation("add-game")}
              >
                Add Game
              </Nav.Link>
              <Nav.Link
                href="#add-score"
                active={currentView === "add-score"}
                onClick={() => handleNavigation("add-score")}
                disabled={gameStore.games.length === 0}
              >
                Add Score
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Item>
                Games: {gameStore.gameCount} | Players: {gameStore.playerCount}
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container>
        {/* Error Alert */}
        {gameStore.hasError && (
          <Alert variant="danger" className="mb-3">
            <Alert.Heading>Error</Alert.Heading>
            <p>{gameStore.error}</p>
          </Alert>
        )}

        {/* Loading Indicator */}
        {gameStore.isLoading && (
          <div className="d-flex justify-content-center mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Content based on current view */}
        {currentView === "games" && (
          <>
            {gameStore.currentGame ? (
              <GameDetail
                game={gameStore.currentGame}
                store={gameStore}
                onBack={() => gameStore.setCurrentGame(null)}
              />
            ) : (
              <GameList
                games={gameStore.games}
                onGameSelect={(gameId) => gameStore.setCurrentGame(gameId)}
                onDeleteGame={(gameId) => gameStore.deleteGame(gameId)}
              />
            )}
          </>
        )}

        {currentView === "add-game" && (
          <AddGameForm
            onGameCreated={handleGameCreated}
            onCancel={() => setCurrentView("games")}
            store={gameStore}
          />
        )}

        {currentView === "add-score" && (
          <AddScoreForm
            games={gameStore.games}
            players={gameStore.players}
            onScoreAdded={handleScoreAdded}
            onCancel={() => setCurrentView("games")}
            store={gameStore}
          />
        )}
      </Container>

      {/* Footer */}
      <footer className="bg-light text-center text-muted py-3 mt-5">
        <Container>
          <small>
            High Score Tracker - Built with React, MobX, and React Bootstrap
          </small>
        </Container>
      </footer>
    </div>
  );
});

export default App;
