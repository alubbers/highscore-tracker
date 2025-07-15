/**
 * Google Cloud Storage service for persisting game data
 * Each game is stored as a separate JSON file in the bucket
 * This service handles all interactions with Google Cloud Storage
 */

import { Storage } from "@google-cloud/storage";
import { Game, GameFile, StorageConfig, ApiResponse } from "../types";

/**
 * @typedef {import('../types/index.js').Game} Game
 * @typedef {import('../types/index.js').GameFile} GameFile
 * @typedef {import('../types/index.js').StorageConfig} StorageConfig
 * @typedef {import('../types/index.js').ApiResponse} ApiResponse
 */

export class GoogleStorageService {
  storage = {};
  bucketName = "";
  bucket = {};

  /**
   * @param {StorageConfig} config - Configuration for storage
   */
  constructor(config) {
    // Initialize Google Cloud Storage client
    this.storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename, // Path to service account key file
    });

    this.bucketName = config.bucketName;
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Save a game to Google Cloud Storage
   * File name format: game-{gameId}.json
   * @param {Game} game - The game object to save
   * @returns {Promise<ApiResponse<boolean>>} with success/error status
   */
  async saveGame(game) {
    try {
      const fileName = `game-${game.id}.json`;
      const file = this.bucket.file(fileName);

      // Create the game file structure with version for future compatibility
      const gameFile = {
        game: game,
        version: "1.0",
      };

      // Convert to JSON and save to cloud storage
      const jsonData = JSON.stringify(gameFile, null, 2);

      await file.save(jsonData, {
        metadata: {
          contentType: "application/json",
          // Add metadata for easier management
          gameId: game.id,
          gameName: game.name,
          lastUpdated: new Date().toISOString(),
        },
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error saving game to storage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Load a game from Google Cloud Storage
   * @param {String} gameId - The ID of the game to load
   * @returns {Promise<ApiResponse<Game>>} Promise with the game data or error
   */
  async loadGame(gameId) {
    try {
      const fileName = `game-${gameId}.json`;
      const file = this.bucket.file(fileName);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return { success: false, error: "Game not found" };
      }

      // Download and parse the file
      const [contents] = await file.download();
      const gameFile = JSON.parse(contents.toString());

      // Convert date strings back to Date objects
      const game = this.deserializeGame(gameFile.game);

      return { success: true, data: game };
    } catch (error) {
      console.error("Error loading game from storage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * List all games in the storage bucket
   * @returns {Promise<ApiResponse<Array<{id: string, name: string, updatedAt: Date}>>>} Promise with array of game summaries
   */
  async listGames() {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: "game-",
        delimiter: ".json",
      });

      const games = [];

      for (const file of files) {
        try {
          // Extract game ID from filename
          const gameId = file.name.replace("game-", "").replace(".json", "");

          // Get file metadata
          const [metadata] = await file.getMetadata();

          games.push({
            id: gameId,
            name: metadata.metadata?.gameName || "Unknown Game",
            updatedAt: new Date(
              metadata.metadata?.lastUpdated || metadata.updated,
            ),
          });
        } catch (fileError) {
          console.warn(`Error processing file ${file.name}:`, fileError);
          // Continue processing other files
        }
      }

      // Sort by most recently updated
      games.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return { success: true, data: games };
    } catch (error) {
      console.error("Error listing games from storage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Delete a game from Google Cloud Storage
   * @param {String} gameId - The ID of the game to delete
   * @returns {Promise<boolean>} Promise with success/error status
   */
  async deleteGame(gameId) {
    try {
      const fileName = `game-${gameId}.json`;
      const file = this.bucket.file(fileName);

      // Check if file exists before trying to delete
      const [exists] = await file.exists();
      if (!exists) {
        return { success: false, error: "Game not found" };
      }

      await file.delete();
      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting game from storage:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Check if the storage bucket is accessible
   * @returns {Promise<ApiResponse<boolean>>} Promise with connection status
   */
  async testConnection() {
    try {
      const [exists] = await this.bucket.exists();
      if (!exists) {
        return { success: false, error: "Storage bucket does not exist" };
      }

      // Try to list files to ensure we have proper permissions
      await this.bucket.getFiles({ maxResults: 1 });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error testing storage connection:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Storage connection failed",
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
      scores: gameData.scores.map((score) => ({
        ...score,
        achievedAt: new Date(score.achievedAt),
      })),
    };
  }
}
