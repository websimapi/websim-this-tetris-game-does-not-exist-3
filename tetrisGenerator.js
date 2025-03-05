// This file handles the AI generation of Tetris game concepts

export async function generateTetrisConcept(theme, difficulty, blockStyle, specialFeature) {
    try {
        // Generate the game concept using LLM
        const gameConceptCompletion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a creative game designer specializing in unique Tetris variants. Create a detailed and imaginative concept for a Tetris game with the following parameters:
                    
                    1. Theme: ${theme || "Random theme (be creative)"}
                    2. Difficulty: ${difficulty}
                    3. Block Style: ${blockStyle || "Random block style (be creative)"}
                    4. Special Feature: ${specialFeature || "Random special feature (be creative)"}
                    
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
                    Theme: ${theme || "[randomly choose]"}
                    Difficulty: ${difficulty}
                    Block Style: ${blockStyle || "[randomly choose]"}
                    Special Feature: ${specialFeature || "[randomly choose]"}`
                }
            ],
            json: true
        });
        
        return JSON.parse(gameConceptCompletion.content);
    } catch (error) {
        console.error("Error generating Tetris concept:", error);
        throw error;
    }
}

export async function generateBackgroundImage(prompt) {
    try {
        const imageResult = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: "16:9"
        });
        
        return imageResult.url;
    } catch (error) {
        console.error("Error generating background image:", error);
        throw error;
    }
}

