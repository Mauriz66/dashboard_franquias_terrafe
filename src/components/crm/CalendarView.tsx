import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lead } from '@/types/lead';

interface CalendarViewProps {
  leads?: Lead[];
}

export function CalendarView({ leads = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const leadsWithMeetings = leads.filter(lead => lead.meeting);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const getMeetingsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leadsWithMeetings.filter(lead => lead.meeting?.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Get upcoming meetings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingMeetings = leadsWithMeetings
    .filter(lead => new Date(lead.meeting!.date) >= today)
    .sort((a, b) => new Date(a.meeting!.date).getTime() - new Date(b.meeting!.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day names header */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: startingDay }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const meetings = getMeetingsForDay(day);
              const hasMeetings = meetings.length > 0;

              return (
                <div
                  key={day}
                  className={cn(
                    'aspect-square p-1 rounded-lg border border-transparent transition-colors',
                    isToday(day) && 'border-primary bg-primary/5',
                    hasMeetings && 'bg-lead-qualified/10'
                  )}
                >
                  <div className={cn(
                    'text-sm text-center mb-1',
                    isToday(day) && 'font-bold text-primary'
                  )}>
                    {day}
                  </div>
                  {hasMeetings && (
                    <div className="space-y-0.5">
                      {meetings.slice(0, 2).map(lead => (
                        <div
                          key={lead.id}
                          className="text-xs truncate px-1 py-0.5 rounded bg-lead-qualified/20 text-lead-qualified"
                          title={`${lead.name} - ${lead.meeting!.time}`}
                        >
                          {lead.meeting!.time}
                        </div>
                      ))}
                      {meetings.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{meetings.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Próximas Reuniões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(lead => {
              const whatsappNumber = lead.phone.replace(/\D/g, '');
              const meetingDate = new Date(lead.meeting!.date);
              
              return (
                <div
                  key={lead.id}
                  className="p-4 rounded-lg bg-secondary/50 border border-border/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{lead.name}</h4>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {lead.status === 'qualificado' ? 'Qualificado' : lead.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {meetingDate.toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })} às {lead.meeting!.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{lead.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 gap-1">
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </Button>
                    {lead.meeting?.link && (
                      <Button asChild size="sm" className="flex-1 gap-1">
                        <a
                          href={lead.meeting.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Entrar
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma reunião agendada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
