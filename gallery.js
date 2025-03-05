// This file handles the gallery functionality and integration with the database

export class TetrisGallery {
    constructor() {
        this.room = new WebsimSocket();
        this.games = [];
    }
    
    // Load all games from the database
    async loadGames() {
        try {
            this.games = this.room.collection('tetrisGame').getList();
            return this.games.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (error) {
            console.error("Error loading games:", error);
            return [];
        }
    }
    
    // Subscribe to real-time updates of the gallery
    subscribeToUpdates(callback) {
        return this.room.collection('tetrisGame').subscribe((games) => {
            this.games = games.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            callback(this.games);
        });
    }
    
    // Save a new game to the database
    async saveGame(gameData) {
        try {
            const newGame = await this.room.collection('tetrisGame').create({
                title: gameData.title,
                description: gameData.description,
                theme: gameData.theme,
                blockDescriptions: gameData.blockDescriptions,
                blockColors: gameData.blockColors,
                aiPersonality: gameData.aiPersonality,
                speedMultiplier: gameData.speedMultiplier,
                specialRule: gameData.specialRule,
                imageUrl: gameData.imageUrl
            });
            
            return newGame;
        } catch (error) {
            console.error("Error saving game:", error);
            throw error;
        }
    }
    
    // Get a specific game by ID
    getGameById(id) {
        return this.games.find(game => game.id === id);
    }
}

// Create a singleton instance
export const galleryInstance = new TetrisGallery();

