class GitHubSpaceInvaders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.score = 0;
        this.gameRunning = false;

        this.player = {
            x: 0,
            y: 0,
            width: 50,
            height: 30,
            speed: 5
        };

        this.bullets = [];
        this.commits = [];
        this.explosions = [];
        this.keys = {};

        this.lastMoveTime = 0;
        this.moveInterval = 800;
        this.direction = 1;
        this.dropDistance = 20;

        this.setupEventListeners();
        this.resizeCanvas();
        this.gameLoop();

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const header = document.querySelector('h1');
        const scoreBar = document.getElementById('score');
        const margin = 40;
        const offset = (header?.offsetHeight || 0) + (scoreBar?.offsetHeight || 0) + margin;
        this.canvas.width = window.innerWidth * 0.95;
        this.canvas.height = window.innerHeight - offset;

        if (this.player) {
            this.player.x = this.canvas.width / 2 - 25;
            this.player.y = this.canvas.height - 60;
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    async loadGitHubData(username) {
        try {
            const res = await fetch(`/api/contributions?user=${username}`);
            const weeks = await res.json();

            const commits = [];
            weeks.forEach((week, weekIndex) => {
                week.contributionDays.forEach((day, dayIndex) => {
                    commits.push({
                        week: weekIndex,
                        day: dayIndex,
                        count: day.contributionCount,
                        color: day.contributionCount > 0 ? day.color : '#EFF2F5'
                    });
                });
            });

            this.createCommitEnemies(commits);
            this.gameRunning = true;
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return false;
        }
    }

    createCommitEnemies(commits) {
        this.commits = [];
        const squareSize = 12;
        const spacing = 4;
        const startX = 50;
        const startY = 50;

        commits.forEach((commit) => {
            this.commits.push({
                x: startX + commit.week * (squareSize + spacing),
                y: startY + commit.day * (squareSize + spacing),
                width: squareSize,
                height: squareSize,
                count: commit.count,
                color: commit.color,
                alive: true
            });
        });
    }

    update() {
        if (!this.gameRunning) return;
        this.updatePlayer();
        this.updateBullets();
        this.updateCommits();
        this.updateExplosions();
        this.checkCollisions();
        this.checkGameEnd();
    }

    updatePlayer() {
        if (this.keys['ArrowLeft'] && this.player.x > 0) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) this.player.x += this.player.speed;
        if (this.keys['Space']) {
            this.shoot();
            this.keys['Space'] = false;
        }
    }

    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 10,
            speed: 7
        });
    }

    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
    }

    updateCommits() {
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveInterval) return;
        this.lastMoveTime = currentTime;

        const alive = this.commits.filter(c => c.alive);
        if (alive.length === 0) return;

        let leftMost = Math.min(...alive.map(c => c.x));
        let rightMost = Math.max(...alive.map(c => c.x + c.width));
        let shouldDrop = false;

        if (this.direction === 1 && rightMost >= this.canvas.width - 10) {
            shouldDrop = true;
            this.direction = -1;
        } else if (this.direction === -1 && leftMost <= 10) {
            shouldDrop = true;
            this.direction = 1;
        }

        this.commits.forEach(c => {
            if (c.alive) {
                if (shouldDrop) c.y += this.dropDistance;
                else c.x += this.direction * 15;
            }
        });

        if (shouldDrop && this.moveInterval > 200) this.moveInterval -= 50;
    }

    checkCollisions() {
        this.bullets = this.bullets.filter((b) => {
            for (let c of this.commits) {
                const isHitting =
                    c.alive &&
                    b.x < c.x + c.width &&
                    b.x + b.width > c.x &&
                    b.y < c.y + c.height &&
                    b.y + b.height > c.y;

                const isDestructible = c.color.toUpperCase() !== '#EFF2F5';

                if (isHitting && isDestructible) {
                    c.alive = false;
                    this.score += 1;
                    this.updateScore();
                    this.createExplosion(c.x + c.width / 2, c.y + c.height / 2);
                    return false;
                }
            }
            return true;
        });
    }

    createExplosion(x, y) {
        const shotSound = document.getElementById('shotSound');
        if (shotSound) {
            shotSound.currentTime = 0;
            shotSound.play().catch(() => {});
        }

        for (let i = 0; i < 12; i++) {
            this.explosions.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 2 + Math.random() * 2,
                life: 20 + Math.random() * 10
            });
        }
    }

    updateExplosions() {
        this.explosions = this.explosions.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
    }

    drawExplosions() {
        this.explosions.forEach(p => {
            this.ctx.fillStyle = '#40c463';
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            this.ctx.strokeStyle = '#2e7d32';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(p.x, p.y, p.size, p.size);
        });
    }

    checkGameEnd() {
        const alive = this.commits.filter(c => c.alive && c.color.toUpperCase() !== '#EFF2F5');
        if (alive.length === 0) {
            showModal('Parabéns!', '🎉 Você destruiu todos os commits!');
            this.gameRunning = false;
        }
        alive.forEach(c => {
            if (c.y + c.height > this.player.y - 50) {
                showModal('Game Over!', '☠ Os commits chegaram muito perto!');
                this.gameRunning = false;
            }
        });
    }

    render() {
        this.ctx.fillStyle = '#041C31';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawPlayer();
        this.drawCommits();
        this.drawBullets(); // tiros por cima dos commits
        this.drawExplosions();
        this.drawUI();
    }

    drawPlayer() {
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.fillStyle = '#79c0ff';
        this.ctx.fillRect(this.player.x + 20, this.player.y - 10, 10, 10);
    }

    drawBullets() {
        this.ctx.fillStyle = '#f85149';
        this.bullets.forEach(b => this.ctx.fillRect(b.x, b.y, b.width, b.height));
    }

    drawCommits() {
        const alive = this.commits.filter(c => c.alive);
        if (alive.length > 0) {
            const minX = Math.min(...alive.map(c => c.x)) - 10;
            const maxX = Math.max(...alive.map(c => c.x + c.width)) + 10;
            const minY = Math.min(...alive.map(c => c.y)) - 10;
            const maxY = Math.max(...alive.map(c => c.y + c.height)) + 10;
            this.ctx.fillStyle = '#EFF2F5';
            this.ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        }

        this.commits.forEach(c => {
            if (c.alive) {
                this.ctx.fillStyle = c.color || '#EFF2F5';
                this.ctx.fillRect(c.x, c.y, c.width, c.height);
                this.ctx.strokeStyle = '#d1d5da';
                this.ctx.strokeRect(c.x, c.y, c.width, c.height);
            }
        });
    }

    drawUI() {
        if (!this.gameRunning && this.commits.length === 0) {
            this.ctx.fillStyle = '#c9d1d9';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Load a GitHub user to get started!',
                this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.score}`;
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    reset() {
        this.score = 0;
        this.bullets = [];
        this.commits = [];
        this.explosions = [];
        this.gameRunning = false;
        this.updateScore();
        this.player.x = this.canvas.width / 2 - 25;
        this.player.y = this.canvas.height - 60;
    }
}

const game = new GitHubSpaceInvaders();

const usernameInput = document.getElementById('modalUsername');
const username = usernameInput.value.trim();

document.getElementById('playerName').textContent = `User: ${username}`;

function startGameFromModal() {
  const username = document.getElementById('modalUsername').value.trim();
  if (!username) {
    alert('Enter a username!');
    return;
  }

  document.getElementById('playerName').textContent = `User: ${username}`;
  document.getElementById('gameModal').classList.remove('visible');
  game.reset();
    game.loadGitHubData(username).then(success => {
      if (success) {
        document.getElementById('modalTitle').textContent = 'Tudo pronto!';
        document.getElementById('modalMessage').textContent = `🎮 Dados de ${username} carregados! Use ← → e ESPAÇO para jogar!`;
      } else {
        document.getElementById('modalTitle').textContent = 'Erro';
        document.getElementById('modalMessage').textContent = '❌ Não foi possível carregar os dados do GitHub.';
      }
    });

}

document.getElementById('modalUsername').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    startGameFromModal();
  }
});


document.getElementById('loadButton').addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        showModal('Aviso', 'Enter a username!');
        return;
    }
    game.reset();
    const success = await game.loadGitHubData(username);
    if (success) {
        document.getElementById('modalTitle').textContent = 'Tudo pronto!';
        document.getElementById('modalMessage').textContent = `🎮 Dados de ${username} carregados! Use ← → e ESPAÇO para jogar!`;
    } else {
        document.getElementById('modalTitle').textContent = 'Erro';
        document.getElementById('modalMessage').textContent = '❌ Não foi possível carregar os dados do GitHub.';
    }
});
