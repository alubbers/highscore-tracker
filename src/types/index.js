/**
 * Type definitions for the High Score Tracker application
 * These JSDoc typedefs define the structure of our data models
 */

/**
 * Represents a player in the system
 * @typedef {Object} Player
 * @property {string} id - Unique identifier for the player
 * @property {string} name - Display name of the player
 */

/**
 * Represents a single score entry
 * @typedef {Object} Score
 * @property {string} id - Unique identifier for the score
 * @property {string} playerId - ID of the player who achieved this score
 * @property {string} playerName - Name of the player who achieved this score
 * @property {number} value - The score value
 * @property {boolean} isTime - True if this is a time-based score (lower is better)
 * @property {Date} achievedAt - When the score was achieved
 * @property {string} [notes] - Optional notes about the score
 */

/**
 * Represents a game and its associated scores
 * @typedef {Object} Game
 * @property {string} id - Unique identifier for the game
 * @property {string} name - Display name of the game
 * @property {string} [description] - Optional description of the game
 * @property {boolean} isTimeBased - True if lower scores are better (like racing times)
 * @property {Score[]} scores - Array of all scores for this game
 */

/**
 * Represents the structure of a game file stored in Google Cloud Storage
 * @typedef {Object} GameFile
 * @property {Game} game - The game data
 * @property {string} version - File format version for future compatibility
 */

/**
 * Configuration for storage service
 * @typedef {Object} StorageConfig
 * @property {boolean} useLocalStorage - If true, use local file storage; if false, use Google Cloud Storage
 * @property {string} bucketName - Name of the storage bucket (for Google Cloud Storage)
 * @property {string} projectId - Google Cloud project ID (for Google Cloud Storage)
 * @property {string} [keyFilename] - Path to service account key file (for Google Cloud Storage)
 * @property {string} [localStoragePath] - Path for local file storage (defaults to './data')
 */

/**
 * API response wrapper for error handling
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success - Whether the operation was successful
 * @property {T} [data] - The response data if successful
 * @property {string} [error] - Error message if unsuccessful
 */

/**
 * Sort options for displaying scores
 * @readonly
 * @enum {string}
 */
export const SortOrder = {
  BEST_FIRST: "best_first",
  WORST_FIRST: "worst_first",
  NEWEST_FIRST: "newest_first",
  OLDEST_FIRST: "oldest_first",
};

/**
 * Filter options for scores
 * @typedef {Object} ScoreFilter
 * @property {string} [playerId] - Filter by specific player ID
 * @property {Date} [dateFrom] - Filter scores from this date onwards
 * @property {Date} [dateTo] - Filter scores up to this date
 * @property {number} [limit] - Maximum number of scores to return
 */

// Export empty object to make this a proper ES6 module
export {};
