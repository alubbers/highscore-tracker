/**
 * GameDetail component for displaying detailed view of a single game
 * Shows leaderboard, recent scores, and game statistics
 * Uses React Bootstrap components for mobile-friendly layout
 */

import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Card,
  Table,
  Button,
  Badge,
  Row,
  Col,
  ListGroup,
  ButtonGroup,
  Alert
} from 'react-bootstrap';
import { SortOrder } from '../types/index.js';

/**
 * @typedef {import('../types/index.js').Game} Game
 * @typedef {import('../stores/GameStore.js').GameStore} GameStore
 */

/**
 * @typedef {Object} GameDetailProps
 * @property {Game} game - The game to display details for
 * @property {GameStore} store - The game store instance
 * @property {() => void} onBack - Callback when back button is clicked
 */

/**
 * GameDetail component displays comprehensive information about a single game
 * Including leaderboard, recent scores, and statistics
 * @param {GameDetailProps} props - Component props
 * @returns {JSX.Element} The rendered GameDetail component
 */
export const GameDetail = observer(({ game, store, onBack }) => {
  /** @type {[keyof typeof SortOrder, React.Dispatch<React.SetStateAction<keyof typeof SortOrder>>]} */
  const [sortOrder, setSortOrder] = useState(SortOrder.BEST_FIRST);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showAllScores, setShowAllScores] = useState(false);

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
      return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`;
    } else {
      // Format as regular score with thousands separator
      return value.toLocaleString();
    }
  };

  /**
   * Get rank suffix for position numbers
   * @param {number} position - The position number
   * @returns {string} Rank suffix (st, nd, rd, th)
   */
  const getRankSuffix = (position) => {
    if (position >= 11 && position <= 13) return 'th';
    switch (position % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  /**
   * Get variant for rank badge based on position
   * @param {number} rank - The rank position
   * @returns {string} Bootstrap variant string
   */
  const getRankVariant = (rank) => {
    switch (rank) {
      case 1: return 'warning'; // Gold
      case 2: return 'secondary'; // Silver
      case 3: return 'dark'; // Bronze
      default: return 'outline-secondary';
    }
  };

  // Get scores based on current sort order
  const scores = store.getScores(game.id, sortOrder);
  const displayScores = showAllScores ? scores : scores.slice(0, 10);

  // Get leaderboard data
  const leaderboard = store.getLeaderboard(game.id, 10);

  // Calculate statistics
  const totalScores = game.scores.length;
  const uniquePlayers = new Set(game.scores.map(s => s.playerId)).size;
  const averageScore = totalScores > 0 ?
    game.scores.reduce((sum, score) => sum + score.value, 0) / totalScores : 0;

  return (
    <div>
      {/* Header with back button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="outline-secondary" onClick={onBack}>
          ← Back to Games
        </Button>
        <div className="text-end">
          <Badge bg={game.isTimeBased ? 'info' : 'success'}>
            {game.isTimeBased ? 'Time-Based' : 'Score-Based'}
          </Badge>
        </div>
      </div>

      {/* Game Header */}
      <Card className="mb-4">
        <Card.Body>
          <h1 className="mb-2">{game.name}</h1>
          {game.description && (
            <p className="text-muted mb-3">{game.description}</p>
          )}

          {/* Quick Stats */}
          <Row className="text-center">
            <Col xs={4}>
              <div className="h4 mb-0">{totalScores}</div>
              <small className="text-muted">Total Scores</small>
            </Col>
            <Col xs={4}>
              <div className="h4 mb-0">{uniquePlayers}</div>
              <small className="text-muted">Players</small>
            </Col>
            <Col xs={4}>
              <div className="h4 mb-0">{formatScore(averageScore, game.isTimeBased)}</div>
              <small className="text-muted">Average</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">🏆 Leaderboard</h5>
          </Card.Header>
          <ListGroup variant="flush">
            {leaderboard.map((entry, index) => (
              <ListGroup.Item key={entry.player.id} className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Badge
                    bg={getRankVariant(index + 1)}
                    className="me-3"
                    style={{ minWidth: '35px' }}
                  >
                    {index + 1}{getRankSuffix(index + 1)}
                  </Badge>
                  <div>
                    <div className="fw-bold">{entry.player.name}</div>
                    <small className="text-muted">
                      {entry.bestScore.achievedAt.toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold">
                    {formatScore(entry.bestScore.value, game.isTimeBased)}
                  </div>
                  {entry.bestScore.notes && (
                    <small className="text-muted">{entry.bestScore.notes}</small>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}

      {/* All Scores Section */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Scores</h5>
          <ButtonGroup size="sm">
            <Button
              variant={sortOrder === SortOrder.BEST_FIRST ? 'primary' : 'outline-primary'}
              onClick={() => setSortOrder(SortOrder.BEST_FIRST)}
            >
              Best First
            </Button>
            <Button
              variant={sortOrder === SortOrder.NEWEST_FIRST ? 'primary' : 'outline-primary'}
              onClick={() => setSortOrder(SortOrder.NEWEST_FIRST)}
            >
              Newest First
            </Button>
          </ButtonGroup>
        </Card.Header>

        {scores.length === 0 ? (
          <Card.Body className="text-center py-5">
            <Alert variant="info">
              <Alert.Heading>No Scores Yet</Alert.Heading>
              <p>Be the first to add a score to this game!</p>
              <Button variant="primary" href="#add-score">
                Add First Score
              </Button>
            </Alert>
          </Card.Body>
        ) : (
          <>
            <div className="table-responsive">
              <Table className="mb-0">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {displayScores.map((score, index) => (
                    <tr key={score.id}>
                      <td>
                        <Badge bg={getRankVariant(index + 1)}>
                          #{index + 1}
                        </Badge>
                      </td>
                      <td className="fw-bold">{score.playerName}</td>
                      <td>
                        <span className="fw-bold">
                          {formatScore(score.value, game.isTimeBased)}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {score.achievedAt.toLocaleDateString()}
                          <br />
                          {score.achievedAt.toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        {score.notes && (
                          <small className="text-muted">{score.notes}</small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Show More/Less Button */}
            {scores.length > 10 && (
              <Card.Footer className="text-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowAllScores(!showAllScores)}
                >
                  {showAllScores ? 'Show Less' : `Show All ${scores.length} Scores`}
                </Button>
              </Card.Footer>
            )}
          </>
        )}
      </Card>

      {/* Game Meta Information */}
      <Card className="mt-4">
        <Card.Body>
          <small className="text-muted">
            <strong>Created:</strong> {game.createdAt.toLocaleString()}
            {game.updatedAt.getTime() !== game.createdAt.getTime() && (
              <span> • <strong>Last Updated:</strong> {game.updatedAt.toLocaleString()}</span>
            )}
            <br />
            <strong>Game ID:</strong> {game.id}
          </small>
        </Card.Body>
      </Card>
    </div>
  );
});
