import React from 'react';
import {
  Play,
  Square,
  Undo,
  Redo,
  Download,
  Save,
  Store,
  BarChart3,
  Rocket,
  LogIn,
  LogOut,
  Menu,
  Grid3X3,
  FileJson,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onSave: () => void;
  onNew: () => void;
  onImport: () => void;
  onOpenAssetStore: () => void;
  onOpenAnalytics: () => void;
  onOpenAuth: () => void;
  onOpenPublish: () => void;
  onOpenMapSettings: () => void;
  onBrowse: () => void;
  onMyMaps: () => void;
  onLogout: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  onTogglePlay,
  onUndo,
  onRedo,
  onExport,
  onSave,
  onNew,
  onImport,
  onOpenAssetStore,
  onOpenAnalytics,
  onOpenAuth,
  onOpenPublish,
  onOpenMapSettings,
  onBrowse,
  onMyMaps,
  onLogout,
  gridVisible,
  onToggleGrid,
  user,
}) => {
  return (
    <header className="h-14 bg-surface-1 border-b border-surface-2 flex items-center justify-between px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">R</span>
          </div>
          <span className="font-bold text-lg text-foreground">Rukkit</span>
        </div>

        {/* File Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Menu className="w-4 h-4 mr-2" />
              File
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-surface-1 border-surface-2">
            <DropdownMenuItem onClick={onNew} className="text-foreground hover:bg-surface-2">
              New Map
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-surface-2" />
            <DropdownMenuItem onClick={onImport} className="text-foreground hover:bg-surface-2">
              <FileJson className="w-4 h-4 mr-2" />
              Import JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport} className="text-foreground hover:bg-surface-2">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-surface-2" />
            <DropdownMenuItem onClick={onSave} className="text-foreground hover:bg-surface-2">
              <Save className="w-4 h-4 mr-2" />
              Save
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-surface-2" />
            <DropdownMenuItem onClick={onOpenMapSettings} className="text-foreground hover:bg-surface-2">
              <Settings className="w-4 h-4 mr-2" />
              Map Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick actions */}
        <div className="flex items-center gap-1 border-l border-surface-2 pl-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleGrid}
            className={`${gridVisible ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground hover:bg-surface-2`}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Center section - Play controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onTogglePlay}
          className={isPlaying 
            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
            : 'bg-primary hover:bg-primary/90 text-primary-foreground glow-primary'
          }
          size="sm"
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Play
            </>
          )}
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAssetStore}
          className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
        >
          <Store className="w-4 h-4 mr-2" />
          Assets
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAnalytics}
          className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBrowse}
          className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
        >
          Browse
        </Button>

        <div className="border-l border-surface-2 pl-2 ml-2 flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMyMaps}
                className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                My Maps
              </Button>
              <span className="text-sm text-muted-foreground">
                {user.email?.split('@')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAuth}
              className="text-muted-foreground hover:text-foreground hover:bg-surface-2"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
          <Button
            onClick={onOpenPublish}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>
    </header>
  );
};
