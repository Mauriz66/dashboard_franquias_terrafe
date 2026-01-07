import {
  LayoutDashboard,
  Users,
  Kanban,
  Tags,
  Calendar,
  BarChart2,
  Settings,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
  { id: 'leads', icon: Users, label: 'Leads' },
  { id: 'tags', icon: Tags, label: 'Etiquetas' },
  { id: 'calendar', icon: Calendar, label: 'Calendário' },
  { id: 'reports', icon: BarChart2, label: 'Relatórios' },
];

const bottomItems = [
  { id: 'settings', icon: Settings, label: 'Configurações' },
  { id: 'help', icon: HelpCircle, label: 'Ajuda' },
];

function SidebarContent({ activeTab, onTabChange, onItemClick }: SidebarProps & { onItemClick?: () => void }) {
  const handleClick = (id: string) => {
    onTabChange(id);
    onItemClick?.();
  };

  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <Kanban className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground">LeadFlow</h2>
            <p className="text-xs text-muted-foreground">CRM Dashboard</p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Usuário
            </p>
            <p className="text-xs text-muted-foreground truncate">
              admin@empresa.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full bg-card">
              <SidebarContent
                activeTab={activeTab}
                onTabChange={onTabChange}
                onItemClick={() => setIsOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <SidebarContent activeTab={activeTab} onTabChange={onTabChange} />
    </aside>
  );
}
