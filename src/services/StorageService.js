/**
 * Browser-compatible Storage service for persisting game data
 * This version uses localStorage for development and mocks Google Cloud Storage functionality
 * In production, you would need to implement a backend API to handle Google Cloud Storage
 */

/**
 * @typedef {import('../types/index.js').Game} Game
 * @typedef {import('../types/index.js').GameFile} GameFile
 * @typedef {import('../types/index.js').StorageConfig} StorageConfig
 * @typedef {import('../types/index.js').ApiResponse} ApiResponse
 */

export class StorageService {
  /**
   * @param {StorageConfig} config - Configuration for storage (mocked in browser)
   */
  constructor(config) {
    this.bucketName = config.bucketName;
    this.projectId = config.projectId;
    this.keyFilename = config.keyFilename;

    // Use localStorage as a mock storage in the browser
    this.storageKey = "highscore-tracker-games";

    console.warn(
      "StorageService: Using localStorage mock for browser compatibility. In production, implement a backend API for Google Cloud Storage.",
    );
  }

  /**
   * Get all games from localStorage
   * @returns {Object<string, GameFile>} Games object with game IDs as keys
   */
  getGamesFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return {};
    }
  }

  /**
   * Save games to localStorage
   * @param {Object<string, GameFile>} games - Games object to save
   */
  saveGamesToStorage(games) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(games));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  /**
   * Save a game to localStorage (mocking Google Cloud Storage)
   * @param {Game} game - The game object to save
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async saveGame(game) {
    try {
      const games = this.getGamesFromStorage();

      // Create the game file structure with version for future compatibility
      /** @type {GameFile} */
      const gameFile = {
        game: game,
        version: "1.0",
      };

      games[game.id] = gameFile;
      this.saveGamesToStorage(games);

      return { success: true, data: true };
    } catch (error) {
      console.error("Error saving game to localStorage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Load a game from localStorage (mocking Google Cloud Storage)
   * @param {string} gameId - The ID of the game to load
   * @returns {Promise<ApiResponse<Game>>} Promise with the game data or error
   */
  async loadGame(gameId) {
    try {
      const games = this.getGamesFromStorage();
      const gameFile = games[gameId];

      if (!gameFile) {
        return { success: false, error: "Game not found" };
      }

      // Convert date strings back to Date objects
      const game = this.deserializeGame(gameFile.game);

      return { success: true, data: game };
    } catch (error) {
      console.error("Error loading game from localStorage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * List all games in localStorage (mocking Google Cloud Storage)
   * @returns {Promise<ApiResponse<Array<{id: string, name: string, updatedAt: Date}>>>} Promise with array of game summaries
   */
  async listGames() {
    try {
      const games = this.getGamesFromStorage();

      /** @type {Array<{id: string, name: string, updatedAt: Date}>} */
      const gameList = [];

      for (const [gameId, gameFile] of Object.entries(games)) {
        try {
          gameList.push({
            id: gameId,
            name: gameFile.game.name,
            updatedAt: new Date(gameFile.game.updatedAt),
          });
        } catch (fileError) {
          console.warn(`Error processing game ${gameId}:`, fileError);
          // Continue processing other games
        }
      }

      // Sort by most recently updated
      gameList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return { success: true, data: gameList };
    } catch (error) {
      console.error("Error listing games from localStorage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Delete a game from localStorage (mocking Google Cloud Storage)
   * @param {string} gameId - The ID of the game to delete
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async deleteGame(gameId) {
    try {
      const games = this.getGamesFromStorage();

      if (!games[gameId]) {
        return { success: false, error: "Game not found" };
      }

      delete games[gameId];
      this.saveGamesToStorage(games);

      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting game from localStorage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Check if localStorage is accessible (mocking storage connection test)
   * @returns {Promise<ApiResponse<boolean>>} Promise with connection status
   */
  async testConnection() {
    try {
      // Test localStorage access
      const testKey = "highscore-tracker-test";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);

      return { success: true, data: true };
    } catch (error) {
      console.error("Error testing localStorage connection:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "localStorage connection failed",
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
      createdAt: new Date(gameData.createdAt),
      updatedAt: new Date(gameData.updatedAt),
      scores: gameData.scores.map((/** @type {any} */ score) => ({
        ...score,
        achievedAt: new Date(score.achievedAt),
      })),
    };
  }

  /**
   * Clear all data from localStorage (for development/testing)
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async clearAllData() {
    try {
      localStorage.removeItem(this.storageKey);
      return { success: true, data: true };
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Export all data as JSON (for backup/migration)
   * @returns {Promise<ApiResponse<string>>} Promise with JSON string of all data
   */
  async exportData() {
    try {
      const games = this.getGamesFromStorage();
      const jsonData = JSON.stringify(games, null, 2);
      return { success: true, data: jsonData };
    } catch (error) {
      console.error("Error exporting data:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Import data from JSON (for backup/migration)
   * @param {string} jsonData - JSON string containing game data
   * @returns {Promise<ApiResponse<boolean>>} Promise with success/error status
   */
  async importData(jsonData) {
    try {
      const games = JSON.parse(jsonData);
      this.saveGamesToStorage(games);
      return { success: true, data: true };
    } catch (error) {
      console.error("Error importing data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid JSON data",
      };
    }
  }
}
