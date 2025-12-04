import React, { useRef, useEffect, useCallback } from 'react';
import { GameMap, TileType, EntityType, Entity, PHYSICS, Bullet } from '@/types/editor';

interface GameEngineProps {
  map: GameMap;
  onStop: () => void;
  onWin: () => void;
  onDeath: () => void;
}

interface GameEntity {
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  direction: number;
  isDead: boolean;
  health: number;
  maxHealth: number;
  properties?: Record<string, unknown>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface GameBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayerBullet: boolean;
}

export const GameEngine: React.FC<GameEngineProps> = ({
  map,
  onStop,
  onWin,
  onDeath,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    player: null as GameEntity | null,
    entities: [] as GameEntity[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    bullets: [] as GameBullet[],
    keys: {} as Record<string, boolean>,
    mousePos: { x: 0, y: 0 },
    score: 0,
    doorsOpen: false,
    gameOver: false,
    won: false,
    lastShootTime: 0,
    startPos: { x: 64, y: 64 },
  });

  // Initialize game
  const initGame = useCallback(() => {
    const state = gameStateRef.current;
    state.player = null;
    state.entities = [];
    state.particles = [];
    state.floatingTexts = [];
    state.bullets = [];
    state.score = 0;
    state.doorsOpen = false;
    state.gameOver = false;
    state.won = false;
    state.startPos = { x: 64, y: 64 };

    // Find all entities from map
    map.layers.forEach(layer => {
      layer.entities.forEach(entity => {
        // Handle Start entity - set spawn position
        if (entity.type === EntityType.Start) {
          state.startPos = { x: entity.x, y: entity.y };
          return;
        }

        const gameEntity: GameEntity = {
          type: entity.type,
          x: entity.x,
          y: entity.y,
          width: entity.width,
          height: entity.height,
          vx: 0,
          vy: 0,
          isGrounded: false,
          direction: 1,
          isDead: false,
          health: entity.type === EntityType.Slime || entity.type === EntityType.Bat ? 1 : 1,
          maxHealth: 1,
          properties: entity.properties,
        };

        if (entity.type === EntityType.Player) {
          state.player = gameEntity;
          state.player.health = 3;
          state.player.maxHealth = 3;
        } else {
          state.entities.push(gameEntity);
        }
      });
    });

    // Create default player if none exists
    if (!state.player) {
      state.player = {
        type: EntityType.Player,
        x: state.startPos.x,
        y: state.startPos.y,
        width: 28,
        height: 28,
        vx: 0,
        vy: 0,
        isGrounded: false,
        direction: 1,
        isDead: false,
        health: 3,
        maxHealth: 3,
      };
    } else {
      // Move player to start position if Start entity exists
      state.player.x = state.startPos.x;
      state.player.y = state.startPos.y;
    }
  }, [map]);

  // Spawn particles
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const state = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 1,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }, []);

  // Spawn floating text
  const spawnFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    gameStateRef.current.floatingTexts.push({
      x,
      y,
      text,
      life: 1,
      color,
    });
  }, []);

  // Shoot bullet
  const shootBullet = useCallback(() => {
    const state = gameStateRef.current;
    const { player, lastShootTime } = state;
    const now = Date.now();
    
    if (!player || now - lastShootTime < PHYSICS.SHOOT_COOLDOWN) return;
    
    state.lastShootTime = now;
    
    const bullet: GameBullet = {
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx: player.direction * PHYSICS.BULLET_SPEED,
      vy: 0,
      damage: 1,
      isPlayerBullet: true,
    };
    
    state.bullets.push(bullet);
    spawnParticles(bullet.x, bullet.y, '#FCD34D', 3);
  }, [spawnParticles]);

  // Check tile collision
  const getTileAt = useCallback((x: number, y: number): TileType => {
    const tileX = Math.floor(x / map.tileSize);
    const tileY = Math.floor(y / map.tileSize);

    if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) {
      return TileType.Wall;
    }

    for (const layer of map.layers) {
      const tile = layer.data[tileY]?.[tileX];
      if (tile === TileType.Ground || tile === TileType.Wall) {
        return tile;
      }
      if (tile === TileType.Spike || tile === TileType.Lava) {
        return tile;
      }
    }

    return TileType.Empty;
  }, [map]);

  // AABB collision check
  const checkAABB = useCallback((a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }, []);

  // Check if player is above entity (for stomping)
  const isStompingFrom = useCallback((player: GameEntity, entity: GameEntity): boolean => {
    const playerBottom = player.y + player.height;
    const entityTop = entity.y;
    const playerCenterX = player.x + player.width / 2;
    const entityLeft = entity.x;
    const entityRight = entity.x + entity.width;

    return (
      player.vy > 0 &&
      playerBottom >= entityTop &&
      playerBottom <= entityTop + 16 &&
      playerCenterX > entityLeft &&
      playerCenterX < entityRight
    );
  }, []);

  // Game update loop
  const update = useCallback(() => {
    const state = gameStateRef.current;
    if (state.gameOver || !state.player) return;

    const { keys, player, entities, particles, floatingTexts, bullets } = state;
    const { GRAVITY, FRICTION, PLAYER_SPEED, PLAYER_JUMP, MAX_FALL_SPEED, TILE_SIZE } = PHYSICS;

    // Player input
    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.vx = -PLAYER_SPEED;
      player.direction = -1;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      player.vx = PLAYER_SPEED;
      player.direction = 1;
    } else {
      player.vx *= FRICTION;
    }

    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.isGrounded) {
      player.vy = PLAYER_JUMP;
      player.isGrounded = false;
    }

    // Shooting with left mouse or J key
    if (keys['KeyJ'] || keys['MouseLeft']) {
      shootBullet();
    }

    // Apply gravity
    player.vy += GRAVITY;
    if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

    // Move player with collision
    const newX = player.x + player.vx;
    const newY = player.y + player.vy;

    // Horizontal collision
    const leftTile = getTileAt(newX, player.y + 2);
    const rightTile = getTileAt(newX + player.width, player.y + 2);
    
    if (leftTile === TileType.Ground || leftTile === TileType.Wall) {
      player.x = Math.ceil((newX) / TILE_SIZE) * TILE_SIZE;
      player.vx = 0;
    } else if (rightTile === TileType.Ground || rightTile === TileType.Wall) {
      player.x = Math.floor((newX + player.width) / TILE_SIZE) * TILE_SIZE - player.width;
      player.vx = 0;
    } else {
      player.x = newX;
    }

    // Vertical collision
    player.isGrounded = false;
    const bottomLeftTile = getTileAt(player.x + 2, newY + player.height);
    const bottomRightTile = getTileAt(player.x + player.width - 2, newY + player.height);
    const topLeftTile = getTileAt(player.x + 2, newY);
    const topRightTile = getTileAt(player.x + player.width - 2, newY);

    if (player.vy > 0 && (bottomLeftTile === TileType.Ground || bottomLeftTile === TileType.Wall ||
        bottomRightTile === TileType.Ground || bottomRightTile === TileType.Wall)) {
      player.y = Math.floor((newY + player.height) / TILE_SIZE) * TILE_SIZE - player.height;
      player.vy = 0;
      player.isGrounded = true;
    } else if (player.vy < 0 && (topLeftTile === TileType.Ground || topLeftTile === TileType.Wall ||
        topRightTile === TileType.Ground || topRightTile === TileType.Wall)) {
      player.y = Math.ceil(newY / TILE_SIZE) * TILE_SIZE;
      player.vy = 0;
    } else {
      player.y = newY;
    }

    // Check hazard tiles
    const hazardTiles = [
      getTileAt(player.x + player.width / 2, player.y + player.height),
      getTileAt(player.x + player.width / 2, player.y),
    ];
    if (hazardTiles.some(t => t === TileType.Spike || t === TileType.Lava)) {
      player.health--;
      spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#EF4444', 10);
      if (player.health <= 0) {
        state.gameOver = true;
        setTimeout(onDeath, 500);
        return;
      } else {
        // Knockback
        player.vy = PLAYER_JUMP * 0.5;
        player.x = state.startPos.x;
        player.y = state.startPos.y;
      }
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // Check bullet collision with tiles
      const bulletTile = getTileAt(bullet.x, bullet.y);
      if (bulletTile === TileType.Wall || bulletTile === TileType.Ground) {
        spawnParticles(bullet.x, bullet.y, '#FCD34D', 5);
        bullets.splice(i, 1);
        continue;
      }

      // Check bullet out of bounds
      if (bullet.x < 0 || bullet.x > map.width * map.tileSize || 
          bullet.y < 0 || bullet.y > map.height * map.tileSize) {
        bullets.splice(i, 1);
        continue;
      }

      // Check bullet collision with enemies
      if (bullet.isPlayerBullet) {
        for (const entity of entities) {
          if (entity.isDead) continue;
          if (entity.type !== EntityType.Slime && entity.type !== EntityType.Bat) continue;

          if (checkAABB({ x: bullet.x - 4, y: bullet.y - 4, width: 8, height: 8 }, entity)) {
            entity.health -= bullet.damage;
            spawnParticles(bullet.x, bullet.y, '#EF4444', 8);
            
            if (entity.health <= 0) {
              entity.isDead = true;
              spawnParticles(entity.x + entity.width / 2, entity.y + entity.height / 2, '#22C55E', 15);
              spawnFloatingText(entity.x + entity.width / 2, entity.y, '+100', '#22C55E');
              state.score += 100;
            }
            
            bullets.splice(i, 1);
            break;
          }
        }
      }
    }

    // Update entities
    entities.forEach(entity => {
      if (entity.isDead) return;

      // AI for enemies
      if (entity.type === EntityType.Slime || entity.type === EntityType.Bat) {
        // Simple patrol
        entity.x += entity.direction * 1.5;
        
        // Check for walls or edges
        const frontTile = getTileAt(
          entity.x + (entity.direction > 0 ? entity.width + 4 : -4),
          entity.y + entity.height / 2
        );
        const groundAhead = getTileAt(
          entity.x + (entity.direction > 0 ? entity.width : 0),
          entity.y + entity.height + 4
        );

        if (frontTile === TileType.Wall || frontTile === TileType.Ground ||
            (entity.type === EntityType.Slime && groundAhead === TileType.Empty)) {
          entity.direction *= -1;
        }

        // Bat floats
        if (entity.type === EntityType.Bat) {
          entity.y += Math.sin(Date.now() / 200 + entity.x) * 0.5;
        }

        // Check collision with player
        if (checkAABB(player, entity)) {
          if (isStompingFrom(player, entity)) {
            // Player stomps enemy
            entity.isDead = true;
            player.vy = PLAYER_JUMP * 0.6;
            spawnParticles(entity.x + entity.width / 2, entity.y + entity.height / 2, '#22C55E', 15);
            spawnFloatingText(entity.x + entity.width / 2, entity.y, '+100', '#22C55E');
            state.score += 100;
          } else {
            // Player takes damage
            player.health--;
            spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#EF4444', 10);
            spawnFloatingText(player.x + player.width / 2, player.y, '-1 HP', '#EF4444');
            
            // Knockback
            player.vx = (player.x < entity.x ? -1 : 1) * 8;
            player.vy = -6;
            
            if (player.health <= 0) {
              state.gameOver = true;
              setTimeout(onDeath, 500);
              return;
            }
          }
        }
      }

      // Coin collection
      if (entity.type === EntityType.Coin && !entity.isDead) {
        if (checkAABB(player, entity)) {
          entity.isDead = true;
          spawnParticles(entity.x + entity.width / 2, entity.y + entity.height / 2, '#EAB308', 10);
          spawnFloatingText(entity.x + entity.width / 2, entity.y, '+50', '#EAB308');
          state.score += 50;
        }
      }

      // Lever interaction
      if (entity.type === EntityType.Lever && keys['KeyE']) {
        if (checkAABB(player, { ...entity, width: entity.width + 20, height: entity.height + 20, x: entity.x - 10, y: entity.y - 10 })) {
          state.doorsOpen = !state.doorsOpen;
          keys['KeyE'] = false;
        }
      }

      // Door collision (only when closed)
      if (entity.type === EntityType.Door && !state.doorsOpen) {
        if (checkAABB(player, entity)) {
          if (player.x < entity.x) {
            player.x = entity.x - player.width;
          } else {
            player.x = entity.x + entity.width;
          }
          player.vx = 0;
        }
      }

      // Wall block collision
      if (entity.type === EntityType.WallBlock) {
        if (checkAABB(player, entity)) {
          const overlapX = Math.min(player.x + player.width - entity.x, entity.x + entity.width - player.x);
          const overlapY = Math.min(player.y + player.height - entity.y, entity.y + entity.height - player.y);

          if (overlapX < overlapY) {
            if (player.x < entity.x) {
              player.x = entity.x - player.width;
            } else {
              player.x = entity.x + entity.width;
            }
            player.vx = 0;
          } else {
            if (player.y < entity.y) {
              player.y = entity.y - player.height;
              player.vy = 0;
              player.isGrounded = true;
            } else {
              player.y = entity.y + entity.height;
              player.vy = 0;
            }
          }
        }
      }

      // Portal/End win condition
      if (entity.type === EntityType.Portal || entity.type === EntityType.End) {
        if (checkAABB(player, entity)) {
          state.won = true;
          state.gameOver = true;
          spawnParticles(entity.x + entity.width / 2, entity.y + entity.height / 2, '#A855F7', 30);
          spawnFloatingText(entity.x + entity.width / 2, entity.y - 20, 'Level Complete!', '#A855F7');
          setTimeout(onWin, 1000);
        }
      }
    });

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 1;
      ft.life -= 0.02;
      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
      }
    }
  }, [getTileAt, checkAABB, isStompingFrom, spawnParticles, spawnFloatingText, shootBullet, onDeath, onWin, map]);

  // Draw entity
  const drawEntity = useCallback((
    ctx: CanvasRenderingContext2D,
    entity: GameEntity
  ) => {
    const { type, x, y, width, height, direction } = entity;

    ctx.save();
    if (direction < 0) {
      ctx.translate(x + width, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }

    switch (type) {
      case EntityType.Player:
        // Body
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, width - 4, height - 4, 6);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + width / 3 + 2, y + height / 3, 4, 0, Math.PI * 2);
        ctx.arc(x + width * 2 / 3 + 2, y + height / 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(x + width / 3 + 3, y + height / 3, 2, 0, Math.PI * 2);
        ctx.arc(x + width * 2 / 3 + 3, y + height / 3, 2, 0, Math.PI * 2);
        ctx.fill();
        // Gun
        ctx.fillStyle = '#6B7280';
        ctx.fillRect(x + width - 4, y + height / 2 - 3, 12, 6);
        break;

      case EntityType.Slime:
        const bounceOffset = Math.sin(Date.now() / 300) * 2;
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height - 6 + bounceOffset, width / 2 - 2, height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(x + width / 2 - 5, y + height / 2 + bounceOffset, 2, 0, Math.PI * 2);
        ctx.arc(x + width / 2 + 5, y + height / 2 + bounceOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EntityType.Bat:
        const flyOffset = Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = '#8B5CF6';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2 + flyOffset, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(x + width / 2 - 3, y + height / 2 - 2 + flyOffset, 2, 0, Math.PI * 2);
        ctx.arc(x + width / 2 + 3, y + height / 2 - 2 + flyOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EntityType.Coin:
        if (!entity.isDead) {
          const spinScale = Math.abs(Math.sin(Date.now() / 200));
          ctx.fillStyle = '#EAB308';
          ctx.beginPath();
          ctx.ellipse(x + width / 2, y + height / 2, width / 2 - 2, (height / 2 - 2) * (0.3 + spinScale * 0.7), 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case EntityType.Door:
        const isOpen = gameStateRef.current.doorsOpen;
        ctx.fillStyle = isOpen ? 'rgba(139, 115, 85, 0.3)' : '#8B7355';
        ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
        if (!isOpen) {
          ctx.fillStyle = '#CA8A04';
          ctx.beginPath();
          ctx.arc(x + width - 10, y + height / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case EntityType.Lever:
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(x + width / 3, y + height / 2, width / 3, height / 2);
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const leverAngle = gameStateRef.current.doorsOpen ? 0.5 : -0.5;
        ctx.moveTo(x + width / 2, y + height / 2);
        ctx.lineTo(x + width / 2 + Math.sin(leverAngle) * 12, y + 4);
        ctx.stroke();
        ctx.fillStyle = gameStateRef.current.doorsOpen ? '#22C55E' : '#DC2626';
        ctx.beginPath();
        ctx.arc(x + width / 2 + Math.sin(leverAngle) * 12, y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EntityType.Portal:
        const portalTime = Date.now() / 500;
        const gradient = ctx.createRadialGradient(x + width / 2, y + height / 2, 0, x + width / 2, y + height / 2, width / 2);
        gradient.addColorStop(0, '#A855F7');
        gradient.addColorStop(0.5, '#7C3AED');
        gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EntityType.WallBlock:
        ctx.fillStyle = '#374151';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x + 2, y + 2, width - 4, 4);
        break;

      case EntityType.Start:
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('S', x + width / 2, y + height - 6);
        break;

      case EntityType.End:
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 8, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }, []);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const state = gameStateRef.current;
    const { player, entities, particles, floatingTexts, bullets, score } = state;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera follows player
    let offsetX = 0;
    let offsetY = 0;
    if (player) {
      offsetX = canvas.width / 2 - player.x - player.width / 2;
      offsetY = canvas.height / 2 - player.y - player.height / 2;
      
      const maxOffsetX = 0;
      const minOffsetX = canvas.width - map.width * map.tileSize;
      const maxOffsetY = 0;
      const minOffsetY = canvas.height - map.height * map.tileSize;
      
      offsetX = Math.min(maxOffsetX, Math.max(minOffsetX, offsetX));
      offsetY = Math.min(maxOffsetY, Math.max(minOffsetY, offsetY));
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Draw tiles
    map.layers.forEach(layer => {
      if (!layer.visible) return;

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = layer.data[y][x];
          if (tile === TileType.Empty) continue;

          const px = x * map.tileSize;
          const py = y * map.tileSize;

          switch (tile) {
            case TileType.Ground:
              ctx.fillStyle = '#8B7355';
              ctx.fillRect(px, py, map.tileSize, map.tileSize);
              ctx.fillStyle = '#4A3728';
              ctx.fillRect(px, py, map.tileSize, 4);
              break;
            case TileType.Wall:
              ctx.fillStyle = '#4B5563';
              ctx.fillRect(px, py, map.tileSize, map.tileSize);
              ctx.strokeStyle = '#374151';
              ctx.strokeRect(px + 2, py + 2, map.tileSize - 4, map.tileSize - 4);
              break;
            case TileType.Water:
              const waterGradient = ctx.createLinearGradient(px, py, px, py + map.tileSize);
              waterGradient.addColorStop(0, '#38BDF8');
              waterGradient.addColorStop(1, '#0284C7');
              ctx.fillStyle = waterGradient;
              ctx.fillRect(px, py, map.tileSize, map.tileSize);
              break;
            case TileType.Spike:
              ctx.fillStyle = '#374151';
              ctx.fillRect(px, py + map.tileSize / 2, map.tileSize, map.tileSize / 2);
              ctx.fillStyle = '#94A3B8';
              ctx.beginPath();
              ctx.moveTo(px + 4, py + map.tileSize);
              ctx.lineTo(px + map.tileSize / 4, py + 4);
              ctx.lineTo(px + map.tileSize / 2 - 4, py + map.tileSize);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(px + map.tileSize / 2 + 4, py + map.tileSize);
              ctx.lineTo(px + map.tileSize * 3 / 4, py + 4);
              ctx.lineTo(px + map.tileSize - 4, py + map.tileSize);
              ctx.fill();
              break;
            case TileType.Lava:
              const lavaGradient = ctx.createLinearGradient(px, py, px, py + map.tileSize);
              lavaGradient.addColorStop(0, '#FCD34D');
              lavaGradient.addColorStop(0.3, '#F97316');
              lavaGradient.addColorStop(1, '#DC2626');
              ctx.fillStyle = lavaGradient;
              ctx.fillRect(px, py, map.tileSize, map.tileSize);
              break;
          }
        }
      }
    });

    // Draw entities
    entities.forEach(entity => {
      if (!entity.isDead || entity.type === EntityType.Door || entity.type === EntityType.Lever || entity.type === EntityType.Portal || entity.type === EntityType.WallBlock || entity.type === EntityType.Start || entity.type === EntityType.End) {
        drawEntity(ctx, entity);
      }
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player
    if (player && !state.gameOver) {
      drawEntity(ctx, player);
    }

    // Draw particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw floating texts
    floatingTexts.forEach(ft => {
      ctx.globalAlpha = ft.life;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // Draw UI
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Health bar
    if (player) {
      ctx.fillStyle = '#374151';
      ctx.fillRect(20, 50, 100, 16);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(22, 52, (96 * player.health) / player.maxHealth, 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Inter';
      ctx.fillText(`HP: ${player.health}/${player.maxHealth}`, 25, 63);
    }

    // Instructions
    ctx.font = '14px Inter';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('WASD: Move | Space: Jump | J: Shoot | E: Interact | ESC: Exit', 20, canvas.height - 20);

    if (state.won) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#A855F7';
      ctx.font = 'bold 48px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#E9D5FF';
      ctx.font = '24px Inter';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }, [map, drawEntity]);

  // Game loop
  useEffect(() => {
    initGame();

    let animationId: number;
    const gameLoop = () => {
      update();
      render();
      animationId = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [initGame, update, render]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.code] = true;
      if (e.code === 'Escape') {
        onStop();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        gameStateRef.current.keys['MouseLeft'] = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        gameStateRef.current.keys['MouseLeft'] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onStop]);

  return (
    <div className="fixed inset-0 z-50 bg-surface-0">
      <canvas ref={canvasRef} className="w-full h-full" />
      <button
        onClick={onStop}
        className="absolute top-4 right-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
      >
        Exit Game
      </button>
    </div>
  );
};
