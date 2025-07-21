"use strict";

/**
 * AddScoreForm component for adding new scores to games
 * Uses React Bootstrap form components with validation
 * Integrates with MobX store for state management
 */

import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Card,
  Container,
  Form,
  Button,
  Alert,
  Row,
  Col,
  InputGroup,
  Badge,
} from "react-bootstrap";
import Header from "./Header.js";
import SuccessToast from "./SuccessToast.js";

/**
 * @typedef {import('../types/index.js').Game} Game
 * @typedef {import('../types/index.js').Player} Player
 * @typedef {import('../stores/GameStore.js').GameStore} GameStore
 */

/**
 * @typedef {Object} AddScoreFormProps
 * @property {Game[]} games - Array of available games
 * @property {Player[]} players - Array of available players
 * @property {() => void} onScoreAdded - Callback when score is successfully added
 * @property {() => void} onCancel - Callback when form is cancelled
 * @property {GameStore} store - The game store instance
 */

/**
 * AddScoreForm component allows users to add new scores to existing games
 * Validates input and provides feedback during score addition process
 * @param {AddScoreFormProps} props - Component props
 * @returns {JSX.Element} The rendered AddScoreForm component
 */
export const AddScoreForm = observer(
  ({ games, players, onScoreAdded, onCancel, store }) => {
    // Form state - using local state instead of store to avoid affecting global state
    /** @type {[{gameId: string, playerId: string, playerName: string, isNewPlayer: boolean, scoreValue: string, notes: string}, React.Dispatch<React.SetStateAction<{gameId: string, playerId: string, playerName: string, isNewPlayer: boolean, scoreValue: string, notes: string}>>]} */
    const [formData, setFormData] = useState({
      gameId: "",
      playerId: "",
      playerName: "",
      isNewPlayer: false,
      scoreValue: "",
      notes: "",
    });

    // Form validation state
    /** @type {[{[key: string]: string}, React.Dispatch<React.SetStateAction<{[key: string]: string}>>]} */
    const [errors, setErrors] = useState({});

    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Toast notification state
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [successMessage, setSuccessMessage] = useState("");

    // Get selected game
    const selectedGame = games.find((g) => g.id === formData.gameId);

    /**
     * Handle form field changes
     * @param {string} field - Field name to update
     * @param {string | boolean} value - New value for the field
     */
    const handleFieldChange = (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }

      // Special handling for game selection
      if (field === "gameId") {
        // Reset player selection when game changes
        setFormData((prev) => ({
          ...prev,
          gameId: value,
          playerId: "",
          playerName: "",
          isNewPlayer: false,
        }));
      }

      // Special handling for player selection
      if (field === "playerId") {
        const selectedPlayer = players.find((p) => p.id === value);
        setFormData((prev) => ({
          ...prev,
          playerId: value,
          playerName: selectedPlayer ? selectedPlayer.name : "",
          isNewPlayer: false,
        }));
      }
    };

    /**
     * Handle new player toggle
     */
    const handleNewPlayerToggle = () => {
      setFormData((prev) => ({
        ...prev,
        isNewPlayer: !prev.isNewPlayer,
        playerId: "",
        playerName: "",
      }));
    };

    /**
     * Validate form data
     * @returns {{[key: string]: string}} Object with validation errors, empty if valid
     */
    const validateForm = () => {
      /** @type {{[key: string]: string}} */
      const newErrors = {};

      // Validate game selection
      if (!formData.gameId) {
        newErrors.gameId = "Please select a game";
      }

      // Validate player selection or new player name
      if (formData.isNewPlayer) {
        if (!formData.playerName.trim()) {
          newErrors.playerName = "Player name is required";
        } else if (formData.playerName.trim().length < 2) {
          newErrors.playerName =
            "Player name must be at least 2 characters long";
        } else if (formData.playerName.trim().length > 30) {
          newErrors.playerName = "Player name must be less than 30 characters";
        }
      } else {
        if (!formData.playerId) {
          newErrors.playerId = "Please select a player or create a new one";
        }
      }

      // Validate score value
      if (!formData.scoreValue.trim()) {
        newErrors.scoreValue = "Score value is required";
      } else {
        const scoreNum = parseFloat(formData.scoreValue);
        if (isNaN(scoreNum)) {
          newErrors.scoreValue = "Score must be a valid number";
        } else if (scoreNum < 0) {
          newErrors.scoreValue = "Score cannot be negative";
        } else if (scoreNum > 999999999) {
          newErrors.scoreValue = "Score is too large";
        }
      }

      // Validate notes (optional but has length limit)
      if (formData.notes.trim().length > 100) {
        newErrors.notes = "Notes must be less than 100 characters";
      }

      return newErrors;
    };

    /**
     * Format score value for display
     * @param {string} value - Score value
     * @param {boolean} isTimeBased - Whether this is a time-based game
     * @returns {string} Formatted score string
     */
    const formatScorePreview = (value, isTimeBased) => {
      const num = parseFloat(value);
      if (isNaN(num)) return value;

      if (isTimeBased) {
        // Format as time (assuming seconds)
        const minutes = Math.floor(num / 60);
        const seconds = (num % 60).toFixed(2);
        return minutes > 0
          ? `${minutes}:${seconds.padStart(5, "0")}`
          : `${seconds}s`;
      } else {
        // Format as regular score
        return num.toLocaleString();
      }
    };

    /**
     * Handle form submission
     * @param {React.FormEvent} e - Form event
     */
    const handleSubmit = async (e) => {
      e.preventDefault();

      // Validate form
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        let playerId = formData.playerId;
        let playerName = formData.playerName;

        // If new player, add them to the store first
        if (formData.isNewPlayer) {
          playerId = store.addPlayer(formData.playerName.trim());
          playerName = formData.playerName.trim();
        }

        // Add score using store
        const success = await store.addScore(
          formData.gameId,
          playerId,
          playerName,
          parseFloat(formData.scoreValue),
          formData.notes.trim() || undefined,
        );

        if (success) {
          // Success - capture success info before reset, then reset form and show success toast
          const gameName = selectedGame?.name || "Unknown Game";
          const displayValue = selectedGame?.isTimeBased
            ? `${formData.scoreValue}s`
            : formData.scoreValue;
          setSuccessMessage(
            `Score of ${displayValue} added to "${gameName}" for ${playerName}!`,
          );

          setFormData({
            gameId: "",
            playerId: "",
            playerName: "",
            isNewPlayer: false,
            scoreValue: "",
            notes: "",
          });
          setShowSuccessToast(true);
          onScoreAdded();
        }
      } catch (error) {
        // Error is handled by the store and displayed in the main app
        console.error("Error adding score:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    /**
     * Handle cancel button click
     */
    const handleCancel = () => {
      // Reset form state
      setFormData({
        gameId: "",
        playerId: "",
        playerName: "",
        isNewPlayer: false,
        scoreValue: "",
        notes: "",
      });
      setErrors({});
      onCancel();
    };

    // Show message if no games exist
    if (games.length === 0) {
      return (
        <div className="text-center py-5">
          <Alert variant="warning">
            <Alert.Heading>No Games Available</Alert.Heading>
            <p>You need to create at least one game before adding scores.</p>
            <Button variant="primary" href="#add-game">
              Create Your First Game
            </Button>
          </Alert>
        </div>
      );
    }

    return (
      <Container>
        <Header viewName="addScore" />
        <div className="App">
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Add New Score</h2>
              <Button variant="outline-secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>

            <Row className="justify-content-center">
              <Col xs={12} md={8} lg={6}>
                <Card>
                  <Card.Body>
                    <Form onSubmit={handleSubmit}>
                      {/* Game Selection */}
                      <Form.Group className="mb-3">
                        <Form.Label>Select Game *</Form.Label>
                        <Form.Select
                          value={formData.gameId}
                          onChange={(e) =>
                            handleFieldChange("gameId", e.target.value)
                          }
                          isInvalid={!!errors.gameId}
                        >
                          <option value="">Choose a game...</option>
                          {games.map((game) => (
                            <option key={game.id} value={game.id}>
                              {game.name}{" "}
                              {game.isTimeBased
                                ? "(Time-Based)"
                                : "(Score-Based)"}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.gameId}
                        </Form.Control.Feedback>
                      </Form.Group>

                      {/* Selected Game Info */}
                      {selectedGame && (
                        <Alert variant="info" className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{selectedGame.name}</strong>
                              {selectedGame.description && (
                                <div className="small">
                                  {selectedGame.description}
                                </div>
                              )}
                            </div>
                            <Badge
                              bg={selectedGame.isTimeBased ? "info" : "success"}
                            >
                              {selectedGame.isTimeBased
                                ? "Time-Based"
                                : "Score-Based"}
                            </Badge>
                          </div>
                        </Alert>
                      )}

                      {/* Player Selection */}
                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <Form.Label>Player *</Form.Label>
                          <Form.Check
                            type="switch"
                            id="new-player-switch"
                            label="New Player"
                            checked={formData.isNewPlayer}
                            onChange={handleNewPlayerToggle}
                          />
                        </div>

                        {formData.isNewPlayer ? (
                          <Form.Control
                            type="text"
                            placeholder="Enter new player name"
                            value={formData.playerName}
                            onChange={(e) =>
                              handleFieldChange("playerName", e.target.value)
                            }
                            isInvalid={!!errors.playerName}
                            maxLength={30}
                          />
                        ) : (
                          <Form.Select
                            value={formData.playerId}
                            onChange={(e) =>
                              handleFieldChange("playerId", e.target.value)
                            }
                            isInvalid={!!errors.playerId}
                          >
                            <option value="">Choose a player...</option>
                            {players.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </Form.Select>
                        )}

                        <Form.Control.Feedback type="invalid">
                          {errors.playerName || errors.playerId}
                        </Form.Control.Feedback>
                      </Form.Group>

                      {/* Score Value */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Score Value *
                          {selectedGame && (
                            <span className="text-muted">
                              {selectedGame.isTimeBased
                                ? " (in seconds)"
                                : " (points)"}
                            </span>
                          )}
                        </Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={
                              selectedGame?.isTimeBased
                                ? "Enter time in seconds"
                                : "Enter score"
                            }
                            value={formData.scoreValue}
                            onChange={(e) =>
                              handleFieldChange("scoreValue", e.target.value)
                            }
                            isInvalid={!!errors.scoreValue}
                          />
                          {formData.scoreValue && selectedGame && (
                            <InputGroup.Text>
                              {formatScorePreview(
                                formData.scoreValue,
                                selectedGame.isTimeBased,
                              )}
                            </InputGroup.Text>
                          )}
                        </InputGroup>
                        <Form.Control.Feedback type="invalid">
                          {errors.scoreValue}
                        </Form.Control.Feedback>
                        {selectedGame && (
                          <Form.Text className="text-muted">
                            {selectedGame.isTimeBased
                              ? "Enter the time in seconds (e.g., 95.5 for 1:35.50)"
                              : "Enter the score value (e.g., 1000, 15.5)"}
                          </Form.Text>
                        )}
                      </Form.Group>

                      {/* Notes */}
                      <Form.Group className="mb-4">
                        <Form.Label>Notes (Optional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Add any notes about this score..."
                          value={formData.notes}
                          onChange={(e) =>
                            handleFieldChange("notes", e.target.value)
                          }
                          isInvalid={!!errors.notes}
                          maxLength={100}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.notes}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Optional notes about this score (max 100 characters)
                        </Form.Text>
                      </Form.Group>

                      {/* Submit Buttons */}
                      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button
                          variant="outline-secondary"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={
                            isSubmitting ||
                            !formData.gameId ||
                            !formData.scoreValue
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Adding Score...
                            </>
                          ) : (
                            "Add Score"
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Form Help */}
            <Row className="justify-content-center mt-4">
              <Col xs={12} md={8} lg={6}>
                <Card bg="light">
                  <Card.Body>
                    <h6>Tips for Adding Scores:</h6>
                    <ul className="mb-0">
                      <li>
                        Select the correct game first to see the score format
                      </li>
                      <li>
                        For time-based games, enter times in seconds (e.g., 95.5
                        for 1:35.50)
                      </li>
                      <li>
                        Create new players on the fly or select from existing
                        ones
                      </li>
                      <li>
                        Add notes to remember special achievements or conditions
                      </li>
                      <li>
                        Check the preview to ensure your score looks correct
                      </li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Success Toast Notification */}
        <SuccessToast
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          title="Score Added!"
          message={successMessage}
        />
      </Container>
    );
  },
);
