class TetrisGame {
    constructor(gameData) {
        this.gameData = gameData;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('tetris-game');
        this.chatContainer = document.getElementById('tetris-chat');
        
        // Game settings
        this.rows = 20;
        this.cols = 10;
        this.blockSize = 30;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000; // Default drop speed in ms
        this.dropCounter = 0;
        this.lastTime = 0;
        this.aiCommentaryCounter = 0;
        
        // Tetromino colors from game data
        this.colors = gameData.blockColors || [
            '#FF0D72', '#0DC2FF', '#0DFF72', 
            '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
        ];
        
        // Speed multiplier based on difficulty
        this.speedMultiplier = gameData.speedMultiplier || 1;
        
        // Initialize game board
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        
        // Set up the canvas
        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        
        // Initialize tetromino shapes
        this.tetrominoes = [
            // I
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            // J
            [
                [2, 0, 0],
                [2, 2, 2],
                [0, 0, 0]
            ],
            // L
            [
                [0, 0, 3],
                [3, 3, 3],
                [0, 0, 0]
            ],
            // O
            [
                [4, 4],
                [4, 4]
            ],
            // S
            [
                [0, 5, 5],
                [5, 5, 0],
                [0, 0, 0]
            ],
            // T
            [
                [0, 6, 0],
                [6, 6, 6],
                [0, 0, 0]
            ],
            // Z
            [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0]
            ]
        ];
        
        // Player position
        this.player = {
            pos: { x: 0, y: 0 },
            matrix: null,
            score: 0
        };
        
        // Set up event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Add initial AI commentary
        this.addAIComment("Welcome to " + this.gameData.title + "! Let's see how long you last...");
        
        // Start the game
        this.reset();
        this.update();
    }
    
    // Create a new tetromino
    createPiece(type) {
        return this.tetrominoes[type];
    }
    
    // Draw a single block
    drawBlock(x, y, colorIndex) {
        const color = this.colors[colorIndex - 1] || '#FFF';
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
    }
    
    // Draw the board
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.drawBlock(x, y, value);
                }
            });
        });
        
        // Draw current piece
        if (this.player.matrix) {
            this.player.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(
                            x + this.player.pos.x,
                            y + this.player.pos.y,
                            value
                        );
                    }
                });
            });
        }
    }
    
    // Collision detection
    collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                   (board[y + o.y] &&
                    board[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Merge tetromino with the board
    merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    // Reset player state and create a new tetromino
    reset() {
        const pieces = 'IJLOSTZ';
        this.player.matrix = this.createPiece(pieces.indexOf(pieces[Math.floor(Math.random() * pieces.length)]));
        this.player.pos.y = 0;
        this.player.pos.x = Math.floor(this.cols / 2) - Math.floor(this.player.matrix[0].length / 2);
        
        // If we collide immediately, game over
        if (this.collide(this.board, this.player)) {
            this.gameOver = true;
            this.addAIComment("Game Over! Your final score: " + this.score);
        }
    }
    
    // Rotate tetromino
    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }
        
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }
    
    // Handle player rotation
    playerRotate(dir) {
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotate(this.player.matrix, dir);
        
        // Handle collision during rotation
        while (this.collide(this.board, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotate(this.player.matrix, -dir);
                this.player.pos.x = pos;
                return;
            }
        }
    }
    
    // Move player left or right
    playerMove(dir) {
        this.player.pos.x += dir;
        if (this.collide(this.board, this.player)) {
            this.player.pos.x -= dir;
        }
    }
    
    // Drop the player
    playerDrop() {
        this.player.pos.y++;
        if (this.collide(this.board, this.player)) {
            this.player.pos.y--;
            this.merge(this.board, this.player);
            this.reset();
            this.sweep();
            
            // Increment drop counter for AI commentary
            this.aiCommentaryCounter++;
            if (this.aiCommentaryCounter >= 5) {
                this.generateAICommentary();
                this.aiCommentaryCounter = 0;
            }
        }
        this.dropCounter = 0;
    }
    
    // Fast drop
    playerDropToBottom() {
        while (!this.collide(this.board, this.player)) {
            this.player.pos.y++;
        }
        this.player.pos.y--;
        this.merge(this.board, this.player);
        this.reset();
        this.sweep();
        this.dropCounter = 0;
        
        // Generate AI commentary on hard drop
        this.generateAICommentary();
    }
    
    // Clear completed lines
    sweep() {
        let linesCleared = 0;
        
        outer: for (let y = this.board.length - 1; y >= 0; --y) {
            for (let x = 0; x < this.board[y].length; ++x) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }
            
            // Clear the line and move everything down
            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            ++y;
            linesCleared++;
        }
        
        if (linesCleared > 0) {
            // Update score based on lines cleared
            this.lines += linesCleared;
            this.score += linesCleared * 100 * linesCleared; // Bonus for multiple lines
            
            // Level up every 10 lines
            this.level = Math.floor(this.lines / 10) + 1;
            
            // Generate AI commentary on line clear
            if (linesCleared >= 2) {
                this.generateAICommentary(linesCleared);
            }
        }
    }
    
    // Handle keyboard input
    handleKeyPress(e) {
        if (this.gameOver) return;
        
        if (e.key === 'p' || e.key === 'P') {
            this.paused = !this.paused;
            if (!this.paused) {
                this.lastTime = 0;
                this.update();
            }
            return;
        }
        
        if (this.paused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                this.playerMove(-1);
                break;
            case 'ArrowRight':
                this.playerMove(1);
                break;
            case 'ArrowDown':
                this.playerDrop();
                break;
            case 'ArrowUp':
                this.playerRotate(1);
                break;
            case ' ':
                this.playerDropToBottom();
                break;
        }
    }
    
    // Generate AI commentary based on game state
    async generateAICommentary(linesCleared = 0) {
        try {
            const commentary = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an AI commentator for a Tetris game with the following personality: ${this.gameData.aiPersonality}. 
                        Keep your comments short (1-2 sentences), witty, and themed around: ${this.gameData.theme}.
                        Current game state:
                        Score: ${this.score}
                        Level: ${this.level}
                        Lines cleared just now: ${linesCleared}`
                    },
                    {
                        role: "user",
                        content: "Generate a short, witty comment about the current game state."
                    }
                ]
            });
            
            this.addAIComment(commentary.content);
        } catch (error) {
            console.error("Error generating AI commentary:", error);
        }
    }
    
    // Add AI comment to the chat container
    addAIComment(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message ai';
        messageEl.textContent = text;
        this.chatContainer.appendChild(messageEl);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    // Main update loop
    update(time = 0) {
        if (this.gameOver || this.paused) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        
        // Calculate drop interval based on level and speed multiplier
        const currentDropInterval = this.dropInterval * Math.pow(0.8, this.level - 1) * this.speedMultiplier;
        
        if (this.dropCounter > currentDropInterval) {
            this.playerDrop();
        }
        
        this.draw();
        requestAnimationFrame(this.update.bind(this));
    }
}

// Initialize the game when a game is selected
window.addEventListener('loadTetrisGame', function (e) {
    const gameData = e.detail;
    new TetrisGame(gameData);
});

