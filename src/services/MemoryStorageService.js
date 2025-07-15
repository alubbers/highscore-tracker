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
    this.storage[game.id] = game;
  }

  /**
   * Load a game
   * @param {string} gameId - The ID of the game to load
   * @returns {Promise<ApiResponse<Game>>} Promise with the game data or error
   */
  async loadGame(gameId) {
    return this.storage[gameId];
  }

  /**
   * Delete a game
   * @param {string} gameId - The ID of the game to delete
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async deleteGame(gameId) {
    delete this.storage[gameId];
  }

  /**
   * List all games
   * @returns {Promise<ApiResponse<Array<{id: string, name: string}>>>} Promise with array of game summaries
   */
  async listGames() {
    return new Promise((resolve, reject) => {
      const gameList = [];
      if (!this.storage.empty) {
        this.storage.forEach((game, gameId) => {
          gameList.push({
            id: gameId,
            name: game.name,
          });
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
    if (this.useLocalStorage) {
      return this.testLocalConnection();
    } else {
      return this.testCloudConnection();
    }
  }

  /**
   * Test local storage connection
   * @returns {Promise<ApiResponse<boolean>>} Promise with connection status
   */
  async testLocalConnection() {
    try {
      if (this.isBrowser) {
        const testKey = "highscore-tracker-test";
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        return { success: true, data: true };
      } else {
        // In Node.js environment, you would implement file system test here
        console.warn("File system test not implemented in this version");
        return {
          success: false,
          error: "File system operations require server-side implementation",
        };
      }
    } catch (error) {
      console.error("Error testing local storage connection:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Local storage connection failed",
      };
    }
  }

  /**
   * Test Google Cloud Storage connection
   * @returns {Promise<ApiResponse<boolean>>} Promise with connection status
   */
  async testCloudConnection() {
    if (this.isBrowser) {
      return {
        success: false,
        error: "Google Cloud Storage cannot be used directly in browser",
      };
    }

    if (!this.storage || !this.bucket) {
      return {
        success: false,
        error: "Google Cloud Storage not initialized",
      };
    }

    try {
      const [exists] = await this.bucket.exists();
      if (!exists) {
        return { success: false, error: "Storage bucket does not exist" };
      }

      // Try to list files to ensure we have proper permissions
      await this.bucket.getFiles({ maxResults: 1 });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error testing cloud storage connection:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Cloud storage connection failed",
      };
    }
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
