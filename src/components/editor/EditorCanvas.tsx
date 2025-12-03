import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameMap, EditorState, EditorTool, TileType, EntityType, TILE_PALETTE, ENTITY_PALETTE } from '@/types/editor';

interface EditorCanvasProps {
  map: GameMap;
  editorState: EditorState;
  onPaintTile: (x: number, y: number) => void;
  onEraseTile: (x: number, y: number) => void;
  onFillTiles: (x: number, y: number) => void;
  onPlaceEntity: (x: number, y: number) => void;
  onRemoveEntity: (x: number, y: number) => void;
  onZoom: (zoom: number) => void;
  onPan: (offset: { x: number; y: number }) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  map,
  editorState,
  onPaintTile,
  onEraseTile,
  onFillTiles,
  onPlaceEntity,
  onRemoveEntity,
  onZoom,
  onPan,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);

  // Get tile color
  const getTileColor = (tileType: TileType): string => {
    const tile = TILE_PALETTE.find(t => t.type === tileType);
    return tile?.color || 'transparent';
  };

  // Draw tile
  const drawTile = useCallback((
    ctx: CanvasRenderingContext2D,
    tileType: TileType,
    x: number,
    y: number,
    size: number
  ) => {
    if (tileType === TileType.Empty) return;

    const px = x * size;
    const py = y * size;

    switch (tileType) {
      case TileType.Ground:
        // Brown dirt with grass top
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(px, py, size, size);
        ctx.fillStyle = '#6B5744';
        ctx.fillRect(px, py + size - 8, size, 8);
        ctx.fillStyle = '#4A3728';
        ctx.fillRect(px, py, size, 4);
        // Add some texture
        ctx.fillStyle = '#9C8465';
        for (let i = 0; i < 3; i++) {
          const dotX = px + Math.random() * (size - 4);
          const dotY = py + 8 + Math.random() * (size - 16);
          ctx.fillRect(dotX, dotY, 3, 3);
        }
        break;

      case TileType.Wall:
        // Stone brick pattern
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(px, py, size, size);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, size / 2 - 2, size / 2 - 2);
        ctx.strokeRect(px + size / 2 + 1, py + 1, size / 2 - 2, size / 2 - 2);
        ctx.strokeRect(px + 1, py + size / 2 + 1, size / 2 - 2, size / 2 - 2);
        ctx.strokeRect(px + size / 2 + 1, py + size / 2 + 1, size / 2 - 2, size / 2 - 2);
        break;

      case TileType.Water:
        // Animated water effect
        const time = Date.now() / 1000;
        const gradient = ctx.createLinearGradient(px, py, px, py + size);
        gradient.addColorStop(0, '#38BDF8');
        gradient.addColorStop(0.5, '#0EA5E9');
        gradient.addColorStop(1, '#0284C7');
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, size, size);
        // Wave highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const waveOffset = Math.sin(time * 2 + x) * 4;
        ctx.fillRect(px, py + waveOffset, size, 4);
        break;

      case TileType.Spike:
        // Gray base with spike
        ctx.fillStyle = '#374151';
        ctx.fillRect(px, py + size / 2, size, size / 2);
        // Draw spike triangles
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.moveTo(px + 4, py + size);
        ctx.lineTo(px + size / 4, py + 4);
        ctx.lineTo(px + size / 2 - 4, py + size);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px + size / 2 + 4, py + size);
        ctx.lineTo(px + size * 3 / 4, py + 4);
        ctx.lineTo(px + size - 4, py + size);
        ctx.fill();
        break;

      case TileType.Lava:
        // Glowing lava
        const lavaGradient = ctx.createLinearGradient(px, py, px, py + size);
        lavaGradient.addColorStop(0, '#FCD34D');
        lavaGradient.addColorStop(0.3, '#F97316');
        lavaGradient.addColorStop(1, '#DC2626');
        ctx.fillStyle = lavaGradient;
        ctx.fillRect(px, py, size, size);
        // Bubbles
        ctx.fillStyle = '#FDE047';
        const bubbleY = py + 4 + Math.sin(Date.now() / 200 + x) * 4;
        ctx.beginPath();
        ctx.arc(px + size / 3, bubbleY + 8, 3, 0, Math.PI * 2);
        ctx.arc(px + size * 2 / 3, bubbleY + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }, []);

  // Draw entity
  const drawEntity = useCallback((
    ctx: CanvasRenderingContext2D,
    type: EntityType,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    switch (type) {
      case EntityType.Player:
        // Cute player character
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, width - 8, height - 8, 6);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + width / 3, y + height / 3, 4, 0, Math.PI * 2);
        ctx.arc(x + width * 2 / 3, y + height / 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(x + width / 3, y + height / 3, 2, 0, Math.PI * 2);
        ctx.arc(x + width * 2 / 3, y + height / 3, 2, 0, Math.PI * 2);
        ctx.fill();
        // Smile
        ctx.strokeStyle = '#065F46';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, y + height / 2, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();
        break;

      case EntityType.Slime:
        // Bouncy slime
        const bounceOffset = Math.sin(Date.now() / 300) * 2;
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.ellipse(centerX, y + height - 6 + bounceOffset, width / 2 - 2, height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX - 4, y + height / 2 + bounceOffset, 4, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(centerX - 5, y + height / 2 + bounceOffset, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 5, y + height / 2 + bounceOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EntityType.Bat:
        // Flying bat
        const flyOffset = Math.sin(Date.now() / 200) * 3;
        const wingAngle = Math.sin(Date.now() / 100) * 0.3;
        ctx.fillStyle = '#8B5CF6';
        // Body
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + flyOffset, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.save();
        ctx.translate(centerX, centerY + flyOffset);
        ctx.rotate(wingAngle);
        ctx.beginPath();
        ctx.ellipse(-10, 0, 8, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(-wingAngle * 2);
        ctx.beginPath();
        ctx.ellipse(10, 0, 8, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Eyes
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(centerX - 3, centerY - 2 + flyOffset, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 3, centerY - 2 + flyOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EntityType.Coin:
        // Spinning coin
        const spinScale = Math.abs(Math.sin(Date.now() / 200));
        ctx.fillStyle = '#EAB308';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width / 2 - 2, (height / 2 - 2) * (0.3 + spinScale * 0.7), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 2;
        ctx.stroke();
        // $ symbol
        if (spinScale > 0.5) {
          ctx.fillStyle = '#854D0E';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', centerX, centerY);
        }
        break;

      case EntityType.Door:
        // Wooden door
        const isOpen = false;
        ctx.fillStyle = isOpen ? 'rgba(139, 115, 85, 0.3)' : '#8B7355';
        ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
        if (!isOpen) {
          ctx.strokeStyle = '#5D4E37';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
          // Door handle
          ctx.fillStyle = '#CA8A04';
          ctx.beginPath();
          ctx.arc(x + width - 10, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case EntityType.Lever:
        // Lever mechanism
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(x + width / 3, y + height / 2, width / 3, height / 2);
        // Handle
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX, y + height / 2);
        ctx.lineTo(centerX - 6, y + 4);
        ctx.stroke();
        // Knob
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(centerX - 6, y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EntityType.Portal:
        // Swirling portal
        const portalTime = Date.now() / 500;
        ctx.save();
        ctx.translate(centerX, centerY);
        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width / 2);
        gradient.addColorStop(0, '#A855F7');
        gradient.addColorStop(0.5, '#7C3AED');
        gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
        ctx.fill();
        // Spiral
        ctx.strokeStyle = '#E9D5FF';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const spiralAngle = portalTime + (i * Math.PI * 2 / 3);
          const spiralR = 6 + i * 4;
          ctx.arc(0, 0, spiralR, spiralAngle, spiralAngle + Math.PI);
          ctx.stroke();
        }
        ctx.restore();
        break;

      case EntityType.WallBlock:
        // Solid wall block
        ctx.fillStyle = '#374151';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x + 2, y + 2, width - 4, 4);
        break;
    }
  }, []);

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { zoom, panOffset, gridVisible, activeLayerId } = editorState;
    const { width, height, tileSize, layers } = map;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw layers
    layers.forEach((layer) => {
      if (!layer.visible) return;

      // Draw tiles
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tile = layer.data[y][x];
          drawTile(ctx, tile, x, y, tileSize);
        }
      }

      // Draw entities
      layer.entities.forEach((entity) => {
        drawEntity(ctx, entity.type, entity.x, entity.y, entity.width, entity.height);
      });
    });

    // Draw grid
    if (gridVisible) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1 / zoom;

      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0);
        ctx.lineTo(x * tileSize, height * tileSize);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(width * tileSize, y * tileSize);
        ctx.stroke();
      }
    }

    // Draw hover tile
    if (hoverTile && !editorState.isPlaying) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2 / zoom;
      ctx.fillRect(hoverTile.x * tileSize, hoverTile.y * tileSize, tileSize, tileSize);
      ctx.strokeRect(hoverTile.x * tileSize, hoverTile.y * tileSize, tileSize, tileSize);
    }

    ctx.restore();
  }, [map, editorState, hoverTile, drawTile, drawEntity]);

  // Animation loop for entities
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Get tile position from mouse event
  const getTilePosition = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - editorState.panOffset.x) / editorState.zoom;
    const worldY = (mouseY - editorState.panOffset.y) / editorState.zoom;

    const tileX = Math.floor(worldX / map.tileSize);
    const tileY = Math.floor(worldY / map.tileSize);

    if (tileX >= 0 && tileX < map.width && tileY >= 0 && tileY < map.height) {
      return { x: tileX, y: tileY };
    }
    return null;
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editorState.isPlaying) return;

    // Middle click for panning
    if (e.button === 1 || editorState.tool === EditorTool.Pan) {
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      return;
    }

    // Left click for painting
    if (e.button === 0) {
      const pos = getTilePosition(e);
      if (!pos) return;

      switch (editorState.tool) {
        case EditorTool.Brush:
          setIsPainting(true);
          onPaintTile(pos.x, pos.y);
          break;
        case EditorTool.Eraser:
          setIsPainting(true);
          onEraseTile(pos.x, pos.y);
          break;
        case EditorTool.Fill:
          onFillTiles(pos.x, pos.y);
          break;
        case EditorTool.Entity:
          if (e.shiftKey) {
            onRemoveEntity(pos.x, pos.y);
          } else {
            onPlaceEntity(pos.x, pos.y);
          }
          break;
      }
    }

    // Right click for erasing
    if (e.button === 2) {
      const pos = getTilePosition(e);
      if (!pos) return;
      
      if (editorState.tool === EditorTool.Entity) {
        onRemoveEntity(pos.x, pos.y);
      } else {
        setIsPainting(true);
        onEraseTile(pos.x, pos.y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (editorState.isPlaying) return;

    const pos = getTilePosition(e);
    setHoverTile(pos);

    if (isPanning) {
      const dx = e.clientX - lastPanPosition.x;
      const dy = e.clientY - lastPanPosition.y;
      onPan({
        x: editorState.panOffset.x + dx,
        y: editorState.panOffset.y + dy,
      });
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isPainting && pos) {
      switch (editorState.tool) {
        case EditorTool.Brush:
          onPaintTile(pos.x, pos.y);
          break;
        case EditorTool.Eraser:
          onEraseTile(pos.x, pos.y);
          break;
      }
    }
  };

  const handleMouseUp = () => {
    setIsPainting(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    onZoom(editorState.zoom * delta);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-surface-0 overflow-hidden cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="w-full h-full"
      />
    </div>
  );
};
