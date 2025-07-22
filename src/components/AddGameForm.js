"use strict";

/**
 * AddGameForm component for creating new games
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
  ButtonGroup,
} from "react-bootstrap";
import Header from "./Header.js";
import SuccessToast from "./SuccessToast.js";

/**
 * @typedef {import('../stores/GameStore.js').GameStore} GameStore
 */

/**
 * @typedef {Object} AddGameFormProps
 * @property {GameStore} store - The game store instance
 */

/**
 * AddGameForm component allows users to create new games
 * Validates input and provides feedback during creation process
 * @param {AddGameFormProps} props - Component props
 * @returns {JSX.Element} The rendered AddGameForm component
 */
export const AddGameForm = observer(({ store }) => {
  // Form state - using local state instead of store to avoid affecting global state
  /** @type {[{name: string, description: string, isTimeBased: boolean}, React.Dispatch<React.SetStateAction<{name: string, description: string, isTimeBased: boolean}>>]} */
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isTimeBased: false,
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
  const [createdGameName, setCreatedGameName] = useState("");

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
  };

  /**
   * Validate form data
   * @returns {{[key: string]: string}} Object with validation errors, empty if valid
   */
  const validateForm = () => {
    /** @type {{[key: string]: string}} */
    const newErrors = {};

    // Validate game name
    if (!formData.name.trim()) {
      newErrors.name = "Game name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Game name must be at least 2 characters long";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Game name must be less than 50 characters";
    }

    // Check if game name already exists
    const existingGame = store.games.find(
      (game) => game.name.toLowerCase() === formData.name.trim().toLowerCase(),
    );
    if (existingGame) {
      newErrors.name = "A game with this name already exists";
    }

    // Validate description (optional but has length limit)
    if (formData.description.trim().length > 200) {
      newErrors.description = "Description must be less than 200 characters";
    }

    return newErrors;
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
      // Create game using store
      const gameId = await store.createGame(
        formData.name.trim(),
        formData.description.trim(),
        formData.isTimeBased,
      );

      if (gameId) {
        // Success - capture game name before reset, then reset form and show success toast
        setCreatedGameName(formData.name.trim());
        setFormData({
          name: "",
          description: "",
          isTimeBased: false,
        });
        setShowSuccessToast(true);
      }
    } catch (error) {
      // Error is handled by the store and displayed in the main app
      console.error("Error creating game:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Header
        viewName="addGame"
        gameCount={store.gamesCount}
        playerCount={store.playerCount}
        hasError={store.hasError}
        error={store.error}
        isLoading={store.isLoading}
      />
      <div className="App">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Add New Game</h2>
        </div>

        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  {/* Game Name Field */}
                  <Form.Group className="mb-3">
                    <Form.Label>Game Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter game name"
                      value={formData.name}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      isInvalid={!!errors.name}
                      maxLength={50}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Choose a unique name for your game (2-50 characters)
                    </Form.Text>
                  </Form.Group>

                  {/* Game Description Field */}
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter game description (optional)"
                      value={formData.description}
                      onChange={(e) =>
                        handleFieldChange("description", e.target.value)
                      }
                      isInvalid={!!errors.description}
                      maxLength={200}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Optional description of the game (max 200 characters)
                    </Form.Text>
                  </Form.Group>

                  {/* Game Type Selection */}
                  <Form.Group className="mb-4">
                    <Form.Label>Game Type</Form.Label>
                    <div className="mt-2">
                      <ButtonGroup className="w-100">
                        <Button
                          variant={
                            !formData.isTimeBased
                              ? "success"
                              : "outline-success"
                          }
                          onClick={() =>
                            handleFieldChange("isTimeBased", false)
                          }
                          className="text-start"
                        >
                          <div>
                            <strong>Score-Based</strong>
                            <br />
                            <small>
                              Higher scores are better (e.g., points, kills)
                            </small>
                          </div>
                        </Button>
                        <Button
                          variant={
                            formData.isTimeBased ? "info" : "outline-info"
                          }
                          onClick={() => handleFieldChange("isTimeBased", true)}
                          className="text-start"
                        >
                          <div>
                            <strong>Time-Based</strong>
                            <br />
                            <small>
                              Lower times are better (e.g., race times,
                              speedruns)
                            </small>
                          </div>
                        </Button>
                      </ButtonGroup>
                    </div>
                    <Form.Text className="text-muted">
                      Choose how scores should be ranked in this game
                    </Form.Text>
                  </Form.Group>

                  {/* Information Alert */}
                  <Alert variant="info" className="mb-4">
                    <Alert.Heading>Game Settings</Alert.Heading>
                    <p className="mb-0">
                      {formData.isTimeBased ? (
                        <>
                          <strong>Time-Based Game:</strong> Lower values will be
                          ranked higher. Perfect for racing games, speedruns, or
                          any competition where faster completion is better.
                        </>
                      ) : (
                        <>
                          <strong>Score-Based Game:</strong> Higher values will
                          be ranked higher. Perfect for arcade games, sports, or
                          any competition where accumulating points is the goal.
                        </>
                      )}
                    </p>
                  </Alert>

                  {/* Submit Buttons */}
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button
                      variant="outline-secondary"
                      href="/"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Creating Game...
                        </>
                      ) : (
                        "Create Game"
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
                <h6>Tips for Creating Games:</h6>
                <ul className="mb-0">
                  <li>Use descriptive names that clearly identify the game</li>
                  <li>Add a description to help players understand the game</li>
                  <li>Choose the correct game type for proper score ranking</li>
                  <li>
                    You can add players and scores after creating the game
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Success Toast Notification */}
        <SuccessToast
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          title="Game Created!"
          message={`"${createdGameName}" has been successfully created. You can now add scores to it.`}
        />
      </div>
    </Container>
  );
});
