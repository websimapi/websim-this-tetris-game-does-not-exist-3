import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
    const [activeTab, setActiveTab] = useState('generator');
    const [tetrisGames, setTetrisGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [formData, setFormData] = useState({
        theme: '',
        difficulty: 'medium',
        blockStyle: '',
        specialFeature: ''
    });

    const room = new WebsimSocket();

    useEffect(() => {
        // Initialize and load existing Tetris games from the database
        loadGallery();
        
        // Subscribe to real-time updates
        const unsubscribe = room.collection('tetrisGame').subscribe((games) => {
            setTetrisGames(games.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        });
        
        return () => unsubscribe();
    }, []);

    const loadGallery = () => {
        const games = room.collection('tetrisGame').getList();
        setTetrisGames(games.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateTetrisGame = async () => {
        setIsGenerating(true);
        
        try {
            // Step 1: Generate the game concept using LLM
            const gameConceptCompletion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a creative game designer specializing in unique Tetris variants. Create a detailed and imaginative concept for a Tetris game with the following parameters:
                        
                        1. Theme: ${formData.theme || "Random theme (be creative)"}
                        2. Difficulty: ${formData.difficulty}
                        3. Block Style: ${formData.blockStyle || "Random block style (be creative)"}
                        4. Special Feature: ${formData.specialFeature || "Random special feature (be creative)"}
                        
                        Generate a JSON response following this schema:
                        {
                          "title": "Unique and catchy title for the game",
                          "description": "A brief 2-3 sentence description of the game concept",
                          "theme": "The theme of the game",
                          "blockDescriptions": ["Description of block 1", "Description of block 2", ... up to 7 blocks],
                          "blockColors": ["#hexcolor1", "#hexcolor2", ... up to 7 colors matching the theme],
                          "aiPersonality": "The personality and style of the AI commentator that will mock the player",
                          "speedMultiplier": Number between 0.7 and 1.5 based on difficulty,
                          "specialRule": "A unique special rule or mechanic for this Tetris variant",
                          "backgroundPrompt": "A detailed prompt to generate a background image for the game"
                        }`
                    },
                    {
                        role: "user",
                        content: `Create a unique Tetris game concept based on: 
                        Theme: ${formData.theme || "[randomly choose]"}
                        Difficulty: ${formData.difficulty}
                        Block Style: ${formData.blockStyle || "[randomly choose]"}
                        Special Feature: ${formData.specialFeature || "[randomly choose]"}`
                    }
                ],
                json: true
            });
            
            const gameConcept = JSON.parse(gameConceptCompletion.content);
            
            // Step 2: Generate the background image based on the concept
            const imageResult = await websim.imageGen({
                prompt: gameConcept.backgroundPrompt,
                aspect_ratio: "16:9"
            });
            
            // Step 3: Save the game data to the database
            const newGame = await room.collection('tetrisGame').create({
                title: gameConcept.title,
                description: gameConcept.description,
                theme: gameConcept.theme,
                blockDescriptions: gameConcept.blockDescriptions,
                blockColors: gameConcept.blockColors,
                aiPersonality: gameConcept.aiPersonality,
                speedMultiplier: gameConcept.speedMultiplier,
                specialRule: gameConcept.specialRule,
                imageUrl: imageResult.url,
                creatorName: room.party.client.username
            });
            
            setSelectedGame(newGame);
            setActiveTab('play');
            
        } catch (error) {
            console.error("Error generating Tetris game:", error);
            alert("Failed to generate Tetris game. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const playGame = (game) => {
        setSelectedGame(game);
        setActiveTab('play');
        
        // Notify the Tetris game component to initialize with the selected game data
        window.dispatchEvent(new CustomEvent('loadTetrisGame', { 
            detail: game 
        }));
    };

    return (
        <div className="container">
            <header className="app-header">
                <h1 className="app-title">This Tetris Game Does Not Exist</h1>
                <p className="app-description">Generate unique AI-powered Tetris games that never existed before</p>
            </header>
            
            <div className="tabs">
                <button 
                    className={`tab-button ${activeTab === 'generator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('generator')}
                >
                    Generate
                </button>
                <button 
                    className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('gallery');
                        loadGallery();
                    }}
                >
                    Gallery
                </button>
                {selectedGame && (
                    <button 
                        className={`tab-button ${activeTab === 'play' ? 'active' : ''}`}
                        onClick={() => setActiveTab('play')}
                    >
                        Play
                    </button>
                )}
            </div>
            
            {activeTab === 'generator' && (
                <section className="generator-section">
                    <h2>Generate Your Unique Tetris Game</h2>
                    <p>Fill the fields below to customize your Tetris game, or leave them empty for random generation.</p>
                    
                    <div className="form-group">
                        <label className="form-label" htmlFor="theme">Theme (optional)</label>
                        <input
                            type="text"
                            id="theme"
                            name="theme"
                            className="form-control"
                            placeholder="e.g., Cyberpunk, Medieval, Space, etc."
                            value={formData.theme}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label" htmlFor="difficulty">Difficulty</label>
                        <select
                            id="difficulty"
                            name="difficulty"
                            className="form-control"
                            value={formData.difficulty}
                            onChange={handleInputChange}
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="extreme">Extreme</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label" htmlFor="blockStyle">Block Style (optional)</label>
                        <input
                            type="text"
                            id="blockStyle"
                            name="blockStyle"
                            className="form-control"
                            placeholder="e.g., Neon, Pixel, Abstract, etc."
                            value={formData.blockStyle}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label" htmlFor="specialFeature">Special Feature (optional)</label>
                        <input
                            type="text"
                            id="specialFeature"
                            name="specialFeature"
                            className="form-control"
                            placeholder="e.g., Gravity Shifts, Exploding Blocks, etc."
                            value={formData.specialFeature}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <button 
                        className="generate-button" 
                        onClick={generateTetrisGame}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>Generating... <span className="loading-spinner"></span></>
                        ) : (
                            'Generate Tetris Game'
                        )}
                    </button>
                </section>
            )}
            
            {activeTab === 'gallery' && (
                <section className="gallery-section">
                    {tetrisGames.length === 0 ? (
                        <div className="no-games">
                            <h3>No games yet</h3>
                            <p>Be the first to generate a unique Tetris game!</p>
                        </div>
                    ) : (
                        tetrisGames.map(game => (
                            <div key={game.id} className="gallery-item">
                                <img 
                                    src={game.imageUrl} 
                                    alt={game.title}
                                    className="gallery-image"
                                />
                                <div className="gallery-content">
                                    <h3 className="gallery-title">{game.title}</h3>
                                    <p className="gallery-description">{game.description}</p>
                                    <div className="gallery-meta">
                                        <span>Created by: {game.username}</span>
                                        <span>Theme: {game.theme}</span>
                                    </div>
                                    <button 
                                        className="play-button"
                                        onClick={() => playGame(game)}
                                    >
                                        Play
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            )}
            
            {activeTab === 'play' && selectedGame && (
                <section className="tetris-section">
                    <h2>{selectedGame.title}</h2>
                    <p>{selectedGame.description}</p>
                    <div className="tetris-container">
                        <div id="tetris-game" className="tetris-game"></div>
                        <div className="tetris-sidebar">
                            <div className="tetris-info">
                                <h3>Game Info</h3>
                                <p><strong>Theme:</strong> {selectedGame.theme}</p>
                                <p><strong>Special Rule:</strong> {selectedGame.specialRule}</p>
                                <p><strong>Created by:</strong> {selectedGame.username}</p>
                            </div>
                            <div className="tetris-controls">
                                <h3>Controls</h3>
                                <p>🡄 🡆: Move left/right</p>
                                <p>🡇: Soft drop</p>
                                <p>🡅: Rotate</p>
                                <p>Space: Hard drop</p>
                                <p>P: Pause/Resume</p>
                            </div>
                            <div id="tetris-chat" className="tetris-chat">
                                <h3>AI Commentary</h3>
                                {/* AI chat messages will be added here dynamically */}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

