"use strict";

/**
 * MobX Store for managing game state and operations
 * This store handles all game-related state management using MobX observables
 * and provides methods for CRUD operations on games and scores
 */

import { makeAutoObservable, runInAction } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { SortOrder } from "../types/index.js";

/**
 * @typedef {import('../types/index.js').Game} Game
 * @typedef {import('../types/index.js').Score} Score
 * @typedef {import('../types/index.js').Player} Player
 * @typedef {import('../types/index.js').ScoreFilter} ScoreFilter
 * @typedef {import('../types/index.js').ApiResponse} ApiResponse
 * @typedef {import('../services/MemoryStorageService.js').StorageService} StorageService
 */

export class GameStore {
  /**
   * @param {StorageService} storageService - Storage service instance
   */
  constructor(storageService) {
    // Observable state - MobX will track changes to these properties
    /** @type {Game[]} */
    this.games = [];

    /** @type {Game | null} */
    this.currentGame = null;

    /** @type {Player[]} */
    this.players = [];

    /** @type {boolean} */
    this.isLoading = false;

    /** @type {string | null} */
    this.error = null;

    // Storage service instance
    /** @type {StorageService} */
    this.storageService = storageService;

    // Make all properties observable and methods actions
    makeAutoObservable(this);

    // Initialize with sample data for development
    this.initializeSampleData();
  }

  /**
   * Initialize store with sample data for development/testing
   * This would typically be replaced with loading from storage
   */
  initializeSampleData() {
    // Create sample players
    /** @type {Player} */
    const player1 = {
      id: uuidv4(),
      name: "Alice",
      createdAt: new Date(),
    };

    /** @type {Player} */
    const player2 = {
      id: uuidv4(),
      name: "Bob",
      createdAt: new Date(),
    };

    this.players = [player1, player2];

    // Create sample game
    /** @type {Game} */
    const sampleGame = {
      id: uuidv4(),
      name: "Racing Game",
      description: "Best lap times",
      isTimeBased: true,
      scores: [
        {
          id: uuidv4(),
          playerId: player1.id,
          playerName: player1.name,
          value: 95.5, // 95.5 seconds
          isTime: true,
          achievedAt: new Date(),
          notes: "Perfect run!",
        },
        {
          id: uuidv4(),
          playerId: player2.id,
          playerName: player2.name,
          value: 98.2, // 98.2 seconds
          isTime: true,
          achievedAt: new Date(),
          notes: "Good attempt",
        },
      ],
    };

    this.games = [sampleGame];
  }

  /**
   * Load all games from storage
   * Updates the observable games array
   * @returns {Promise<void>}
   */
  async loadGames() {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await this.storageService.listGames();
      if (!response.success) {
        this.setError(response.error || "Failed to load games");
        return;
      }

      // Load each game's full data
      /** @type {Game[]} */
      const loadedGames = [];
      for (const gameSummary of response.data || []) {
        const gameResponse = await this.storageService.loadGame(gameSummary.id);
        if (gameResponse.success && gameResponse.data) {
          loadedGames.push(gameResponse.data);
        }
      }

      runInAction(() => {
        this.games = loadedGames;
      });
    } catch (error) {
      this.setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Create a new game
   * @param {string} name - Game name
   * @param {string} description - Game description
   * @param {boolean} isTimeBased - Whether lower scores are better
   * @returns {Promise<string | null>} Game ID if successful, null otherwise
   */
  async createGame(name, description, isTimeBased) {
    try {
      this.setLoading(true);
      this.setError(null);

      /** @type {Game} */
      const newGame = {
        id: uuidv4(),
        name,
        description,
        isTimeBased,
        scores: [],
      };

      // Save to storage
      const response = await this.storageService.saveGame(newGame);
      if (!response.success) {
        this.setError(response.error || "Failed to save game");
        return null;
      }

      // Update local state
      runInAction(() => {
        this.games.push(newGame);
      });

      return newGame.id;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : "Unknown error");
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Add a score to a game
   * @param {string} gameId - ID of the game
   * @param {string} playerId - ID of the player
   * @param {string} playerName - Name of the player
   * @param {number} value - Score value
   * @param {string} [notes] - Optional notes
   * @returns {Promise<boolean>} True if successful
   */
  async addScore(gameId, playerId, playerName, value, notes) {
    try {
      this.setLoading(true);
      this.setError(null);

      const game = this.games.find((g) => g.id === gameId);
      if (!game) {
        this.setError("Game not found");
        return false;
      }

      /** @type {Score} */
      const newScore = {
        id: uuidv4(),
        playerId,
        playerName,
        value,
        isTime: game.isTimeBased,
        achievedAt: new Date(),
        notes,
      };

      // Update game with new score
      const updatedGame = {
        ...game,
        scores: [...game.scores, newScore],
      };

      // Save to storage
      const response = await this.storageService.saveGame(updatedGame);
      if (!response.success) {
        this.setError(response.error || "Failed to save score");
        return false;
      }

      // Update local state
      runInAction(() => {
        const gameIndex = this.games.findIndex((g) => g.id === gameId);
        if (gameIndex !== -1) {
          this.games[gameIndex] = updatedGame;
        }
      });

      return true;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : "Unknown error");
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Delete a game
   * @param {string} gameId - ID of the game to delete
   * @returns {Promise<boolean>} True if successful
   */
  async deleteGame(gameId) {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await this.storageService.deleteGame(gameId);
      if (!response.success) {
        this.setError(response.error || "Failed to delete game");
        return false;
      }

      // Update local state
      runInAction(() => {
        this.games = this.games.filter((g) => g.id !== gameId);
        if (this.currentGame?.id === gameId) {
          this.currentGame = null;
        }
      });

      return true;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : "Unknown error");
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Set the current game being viewed
   * @param {string | null} gameId - ID of the game to select
   */
  setCurrentGame(gameId) {
    this.currentGame = gameId
      ? this.games.find((g) => g.id === gameId) || null
      : null;
  }

  /**
   * Add a new player to the system
   * @param {string} name - Player name
   * @returns {string} Player ID
   */
  addPlayer(name) {
    /** @type {Player} */
    const newPlayer = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
    };

    this.players.push(newPlayer);
    return newPlayer.id;
  }

  /**
   * Get sorted scores for a game
   * @param {string} gameId - ID of the game
   * @param {keyof typeof SortOrder} sortOrder - How to sort the scores
   * @param {ScoreFilter} [filter] - Optional filter criteria
   * @returns {Score[]} Array of sorted scores
   */
  getScores(gameId, sortOrder = SortOrder.BEST_FIRST, filter) {
    const game = this.games.find((g) => g.id === gameId);
    if (!game) return [];

    /** @type {Score[]} */
    let scores = [...game.scores];

    // Apply filters
    if (filter) {
      if (filter.playerId) {
        scores = scores.filter((s) => s.playerId === filter.playerId);
      }
      if (filter.dateFrom) {
        scores = scores.filter((s) => s.achievedAt >= filter.dateFrom);
      }
      if (filter.dateTo) {
        scores = scores.filter((s) => s.achievedAt <= filter.dateTo);
      }
    }

    // Sort scores
    switch (sortOrder) {
      case SortOrder.BEST_FIRST:
        scores.sort((a, b) =>
          game.isTimeBased ? a.value - b.value : b.value - a.value,
        );
        break;
      case SortOrder.WORST_FIRST:
        scores.sort((a, b) =>
          game.isTimeBased ? b.value - a.value : a.value - b.value,
        );
        break;
      case SortOrder.NEWEST_FIRST:
        scores.sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());
        break;
      case SortOrder.OLDEST_FIRST:
        scores.sort((a, b) => a.achievedAt.getTime() - b.achievedAt.getTime());
        break;
    }

    // Apply limit
    if (filter?.limit) {
      scores = scores.slice(0, filter.limit);
    }

    return scores;
  }

  /**
   * Get the best score for a player in a game
   * @param {string} gameId - ID of the game
   * @param {string} playerId - ID of the player
   * @returns {Score | null} Best score or null if none found
   */
  getBestScore(gameId, playerId) {
    const game = this.games.find((g) => g.id === gameId);
    if (!game) return null;

    const playerScores = game.scores.filter((s) => s.playerId === playerId);
    if (playerScores.length === 0) return null;

    // For time-based games, lower is better; for score-based, higher is better
    return playerScores.reduce((best, current) => {
      if (game.isTimeBased) {
        return current.value < best.value ? current : best;
      } else {
        return current.value > best.value ? current : best;
      }
    });
  }

  /**
   * Get leaderboard for a game
   * @param {string} gameId - ID of the game
   * @param {number} [limit=10] - Maximum number of entries to return
   * @returns {Array<{player: Player, bestScore: Score}>} Leaderboard entries
   */
  getLeaderboard(gameId, limit = 10) {
    const game = this.games.find((g) => g.id === gameId);
    if (!game) return [];

    /** @type {Array<{player: Player, bestScore: Score}>} */
    const leaderboard = [];

    // Get best score for each player
    this.players.forEach((player) => {
      const bestScore = this.getBestScore(gameId, player.id);
      if (bestScore) {
        leaderboard.push({ player, bestScore });
      }
    });

    // Sort by best score
    leaderboard.sort((a, b) => {
      if (game.isTimeBased) {
        return a.bestScore.value - b.bestScore.value;
      } else {
        return b.bestScore.value - a.bestScore.value;
      }
    });

    return leaderboard.slice(0, limit);
  }

  // Helper actions for updating loading and error states
  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.isLoading = loading;
  }

  /**
   * Set error state
   * @param {string | null} error - Error message or null
   */
  setError(error) {
    this.error = error;
  }

  // Computed properties (getters) - MobX will cache these automatically
  /** @returns {number} Number of games */
  get gameCount() {
    return this.games.length;
  }

  /** @returns {number} Number of players */
  get playerCount() {
    return this.players.length;
  }

  /** @returns {boolean} Whether there's an error */
  get hasError() {
    return this.error !== null;
  }
}
