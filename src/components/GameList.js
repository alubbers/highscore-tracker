"use strict";

/**
 * GameList component for displaying all games in a mobile-friendly layout
 * Uses React Bootstrap cards and responsive grid system
 * Shows game information and provides action buttons for each game
 */

import React from "react";
import {
  Row,
  Col,
  Container,
  Card,
  Button,
  Badge,
  ListGroup,
} from "react-bootstrap";
import { GameStore } from "../stores/GameStore.js";
import Header from "./Header.js";

/**
 * @typedef {import('../types/index.js').Game} Game
 */

/**
 * @typedef {Object} GameListProps
 * @property {GameStore} store - The game store containing all games
 */

/**
 * GameList component displays all games in a responsive grid
 * Each game is shown as a card with key information and action buttons
 * @param {GameListProps} props - Component props
 * @returns {JSX.Element} The rendered GameList component
 */
export const GameList = ({ store }) => {
  const games = store.games;

  /**
   * Format score value based on game type
   * @param {number} value - The score value
   * @param {boolean} isTimeBased - Whether this is a time-based game
   * @returns {string} Formatted score string
   */
  const formatScore = (value, isTimeBased) => {
    if (isTimeBased) {
      // Format as time (assuming seconds)
      const minutes = Math.floor(value / 60);
      const seconds = (value % 60).toFixed(2);
      return minutes > 0
        ? `${minutes}:${seconds.padStart(5, "0")}`
        : `${seconds}s`;
    } else {
      // Format as regular score
      return value.toLocaleString();
    }
  };

  /**
   * Get the best score for a game
   * @param {Game} game - The game to get best score for
   * @returns {import('../types/index.js').Score | null} Best score or null if no scores
   */
  const getBestScore = (game) => {
    if (game.scores.length === 0) return null;

    return game.scores.reduce((best, current) => {
      if (game.isTimeBased) {
        return current.value < best.value ? current : best;
      } else {
        return current.value > best.value ? current : best;
      }
    });
  };

  /**
   * Handle delete game with confirmation
   * @param {string} gameId - ID of game to delete
   * @param {string} gameName - Name of game for confirmation
   */
  const handleDeleteGame = (gameId, gameName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${gameName}"? This action cannot be undone.`,
      )
    ) {
      onDeleteGame(gameId);
    }
  };

  let coreComponent = (
    <div className="text-center py-5">
      <h3 className="text-muted">No Games Yet</h3>
      <p className="text-muted">
        Create your first game to start tracking high scores!
      </p>
      <Button variant="primary" size="lg" href="/addGame">
        Add Your First Game
      </Button>
    </div>
  );

  // Show message if no games exist
  if (games.length > 0) {
    coreComponent = (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Games ({games.length})</h2>
          <Button variant="success" href="/addGame">
            Add New Game
          </Button>
        </div>

        <Row>
          {games.map((game) => {
            const bestScore = getBestScore(game);
            const totalScores = game.scores.length;
            const uniquePlayers = new Set(game.scores.map((s) => s.playerId))
              .size;

            return (
              <Col key={game.id} xs={12} md={6} lg={4} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{game.name}</h5>
                    <Badge bg={game.isTimeBased ? "info" : "success"}>
                      {game.isTimeBased ? "Time-Based" : "Score-Based"}
                    </Badge>
                  </Card.Header>

                  <Card.Body className="d-flex flex-column">
                    {/* Game Description */}
                    {game.description && (
                      <Card.Text className="text-muted">
                        {game.description}
                      </Card.Text>
                    )}

                    {/* Game Statistics */}
                    <ListGroup variant="flush" className="mb-3">
                      <ListGroup.Item className="d-flex justify-content-between px-0">
                        <span>Total Scores:</span>
                        <Badge bg="secondary">{totalScores}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between px-0">
                        <span>Players:</span>
                        <Badge bg="secondary">{uniquePlayers}</Badge>
                      </ListGroup.Item>
                      {bestScore && (
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span>Best Score:</span>
                          <div className="text-end">
                            <Badge bg="primary">
                              {formatScore(bestScore.value, game.isTimeBased)}
                            </Badge>
                            <div className="small text-muted">
                              by {bestScore.playerName}
                            </div>
                          </div>
                        </ListGroup.Item>
                      )}
                    </ListGroup>

                    {/* Action Buttons */}
                    <div className="mt-auto">
                      <div className="d-grid gap-2">
                        <Button
                          variant="primary"
                          onClick={() => onGameSelect(game.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteGame(game.id, game.name)}
                        >
                          Delete Game
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }

  return (
    <div className="App">
      <Header
        viewName="home"
        gameCount={store.gamesCount}
        playerCount={store.playerCount}
        hasError={store.hasError}
        error={store.error}
        isLoading={store.isLoading}
      />

      {/* Main Content */}
      <Container>{coreComponent}</Container>
    </div>
  );
};
