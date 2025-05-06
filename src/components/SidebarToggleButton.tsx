
import React from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

interface SidebarToggleButtonProps {
  blockHeader?: boolean;
}

const SidebarToggleButton = ({ blockHeader = false }: SidebarToggleButtonProps) => {
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === 'expanded';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`absolute left-4 top-4 z-20 md:left-6 md:top-6 bg-background/80 backdrop-blur-sm shadow-sm border ${blockHeader ? 'z-50' : 'z-20'}`}
      onClick={toggleSidebar}
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isExpanded ? (
        <PanelLeftClose className="h-5 w-5" />
      ) : (
        <PanelLeft className="h-5 w-5" />
      )}
    </Button>
  );
};

export default SidebarToggleButton;
