"use strict";

/**
 * Storage service for persisting game data
 * Supports both local file storage and Google Cloud Storage based on configuration
 */

/**
 * @typedef {import('../types/index.js').Game} Game
 * @typedef {import('../types/index.js').GameFile} GameFile
 * @typedef {import('../types/index.js').StorageConfig} StorageConfig
 * @typedef {import('../types/index.js').ApiResponse} ApiResponse
 */

export class MemoryStorageService {
  /**
   * @param {StorageConfig} config - Configuration for storage
   */
  constructor(config) {
    this.config = config;
    this.useLocalStorage = config.useLocalStorage;
    this.storage = {
      empty: true,
    };
  }

  /**
   * Save a game
   * @param {Game} game - The game object to save
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async saveGame(game) {
    if (this.storage.empty) {
      this.storage.empty = false;
    }
    console.log(`RATOUT 1: in saveGame, game: ${JSON.stringify(game)}`);
    this.storage[game.id] = game;

    return Promise.resolve({ success: true, data: true });
  }

  /**
   * Load a game
   * @param {string} gameId - The ID of the game to load
   * @returns {Promise<ApiResponse<Game>>} Promise with the game data or error
   */
  async loadGame(gameId) {
    return Promise.resolve({ success: true, data: this.storage[gameId] });
  }

  /**
   * Delete a game
   * @param {string} gameId - The ID of the game to delete
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async deleteGame(gameId) {
    delete this.storage[gameId];

    return Promise.resolve({ success: true, data: true });
  }

  /**
   * List all games
   * @returns {Promise<ApiResponse<Array<{id: string, name: string}>>>} Promise with array of game summaries
   */
  async listGames() {
    return new Promise((resolve, reject) => {
      const gameList = [];
      if (!this.storage.empty) {
        this.storage.forEach((game) => {
          console.log(
            `RATOUT 0: in listGames, checking this to see if it's a game: ${JSON.stringify(game)}`,
          );
          if (game.id) {
            gameList.push({
              id: game.id,
              name: game.name,
            });
          }
        });
      }
      resolve({ success: true, data: gameList });
    });
  }

  /**
   * Test storage connection
   * @returns {Promise<ApiResponse<boolean>>} Promise with connection status
   */
  async testConnection() {
    return Promise.resolve({ success: true, data: true });
  }

  /**
   * Helper method to deserialize game data from JSON
   * Converts date strings back to Date objects
   * @param {any} gameData - Raw game data from JSON
   * @returns {Game} Game object with proper Date types
   */
  deserializeGame(gameData) {
    return {
      ...gameData,
      scores: gameData.scores.map((score) => ({
        ...score,
        achievedAt: new Date(score.achievedAt),
      })),
    };
  }

  /**
   * Export all data as JSON (for backup/migration)
   * @returns {Promise<ApiResponse<string>>} Promise with JSON string of all data
   */
  async exportData() {
    const games = this.storage;
    const jsonData = JSON.stringify(games, null, 2);
    return { success: true, data: jsonData };
  }

  /**
   * Import data from JSON (for backup/migration)
   * @param {string} jsonData - JSON string containing game data
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async importData(jsonData) {
    const games = JSON.parse(jsonData);
    this.storage = games;
  }
}

export default MemoryStorageService;
