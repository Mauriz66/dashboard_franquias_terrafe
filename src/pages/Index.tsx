import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/crm/Sidebar';
import { Header } from '@/components/crm/Header';
import { StatsCards } from '@/components/crm/StatsCards';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { AddLeadModal } from '@/components/crm/AddLeadModal';
import { DashboardView } from '@/components/crm/DashboardView';
import { LeadsTableView } from '@/components/crm/LeadsTableView';
import { TagsView } from '@/components/crm/TagsView';
import { CalendarView } from '@/components/crm/CalendarView';
import { ReportsView } from '@/components/crm/ReportsView';
import { SettingsView } from '@/components/crm/SettingsView';
import { HelpView } from '@/components/crm/HelpView';
import { useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const { toast } = useToast();
  
  const { 
    leads, 
    updateLead, 
    deleteLead, 
    duplicateLead, 
    updateLeadStatus,
    addNote,
    addLead,
  } = useLeads();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + K = Search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // Alt + shortcuts for navigation
      if (e.altKey) {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            setActiveTab('dashboard');
            toast({ title: 'Dashboard', description: 'Alt+D' });
            break;
          case 'k':
            e.preventDefault();
            setActiveTab('kanban');
            toast({ title: 'Kanban', description: 'Alt+K' });
            break;
          case 'l':
            e.preventDefault();
            setActiveTab('leads');
            toast({ title: 'Leads', description: 'Alt+L' });
            break;
          case 'n':
            e.preventDefault();
            setIsAddModalOpen(true);
            toast({ title: 'Novo Lead', description: 'Alt+N' });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView leads={leads} />;
      case 'kanban':
        return (
          <>
            <StatsCards leads={leads} />
            <KanbanBoard 
              leads={leads}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              sourceFilter={sourceFilter}
              onUpdateLead={updateLead}
              onUpdateLeadStatus={updateLeadStatus}
              onDeleteLead={deleteLead}
              onDuplicateLead={duplicateLead}
              onAddNote={addNote}
            />
          </>
        );
      case 'leads':
        return (
          <LeadsTableView 
            leads={leads}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            sourceFilter={sourceFilter}
            onUpdateLead={updateLead}
            onDeleteLead={deleteLead}
            onDuplicateLead={duplicateLead}
            onAddNote={addNote}
          />
        );
      case 'tags':
        return <TagsView leads={leads} />;
      case 'calendar':
        return <CalendarView leads={leads} />;
      case 'reports':
        return <ReportsView leads={leads} />;
      case 'settings':
        return <SettingsView />;
      case 'help':
        return <HelpView />;
      default:
        return <DashboardView leads={leads} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onAddLead={() => setIsAddModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
        />
        
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {renderContent()}
        </div>
      </main>

      <AddLeadModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onAdd={addLead}
      />
    </div>
  );
};

export default Index;
