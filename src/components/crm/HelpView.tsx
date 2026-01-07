import { ExternalLink, MessageCircle, Mail, Book, Video, HelpCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Como adicionar um novo lead?',
    answer: 'Clique no botão "Novo Lead" no topo da página ou use o atalho de teclado Ctrl+N. Preencha as informações do lead no formulário e clique em "Cadastrar Lead".',
  },
  {
    question: 'Como mover um lead entre etapas do funil?',
    answer: 'No modo Kanban, basta arrastar e soltar o card do lead para a coluna desejada. A mudança é salva automaticamente.',
  },
  {
    question: 'Como agendar uma reunião com um lead?',
    answer: 'Abra os detalhes do lead clicando no card, vá até a seção "Próximos Passos" e adicione uma nova reunião com data, horário e link de agendamento.',
  },
  {
    question: 'Como criar etiquetas personalizadas?',
    answer: 'Acesse o menu "Etiquetas" na barra lateral. Clique em "Nova Etiqueta", escolha um nome e uma cor, e salve. A etiqueta estará disponível para todos os leads.',
  },
  {
    question: 'Como exportar meus dados?',
    answer: 'Vá em Relatórios e utilize o botão de exportar no canto superior direito. Você pode exportar em formato CSV ou PDF.',
  },
  {
    question: 'Como integrar com WhatsApp?',
    answer: 'O sistema já possui integração automática com WhatsApp. Ao clicar no ícone de WhatsApp em qualquer lead, uma nova conversa será aberta com o número do contato.',
  },
];

const resources = [
  {
    title: 'Documentação',
    description: 'Guias completos sobre todas as funcionalidades',
    icon: Book,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Vídeos Tutoriais',
    description: 'Aprenda com demonstrações em vídeo',
    icon: Video,
    color: 'bg-red-500/10 text-red-500',
  },
  {
    title: 'Central de Ajuda',
    description: 'Artigos e guias passo a passo',
    icon: HelpCircle,
    color: 'bg-purple-500/10 text-purple-500',
  },
];

export function HelpView() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">Central de Ajuda</h2>
        <p className="text-sm text-muted-foreground">
          Encontre respostas para suas dúvidas e aprenda a usar o sistema
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Suporte via Chat</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Converse com nossa equipe em tempo real
                </p>
                <Button className="mt-4 gap-2" size="sm">
                  Iniciar conversa
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Suporte por E-mail</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Resposta em até 24 horas úteis
                </p>
                <Button variant="outline" className="mt-4 gap-2" size="sm" asChild>
                  <a href="mailto:suporte@leadflow.com">
                    Enviar e-mail
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Recursos</CardTitle>
          <CardDescription>
            Materiais para ajudar você a aproveitar o máximo do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <button
                key={resource.title}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
              >
                <div className={`h-10 w-10 rounded-lg ${resource.color} flex items-center justify-center mb-3`}>
                  <resource.icon className="h-5 w-5" />
                </div>
                <h4 className="font-semibold group-hover:text-primary transition-colors">
                  {resource.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {resource.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Perguntas Frequentes</CardTitle>
          <CardDescription>
            Respostas rápidas para as dúvidas mais comuns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Não encontrou o que procurava?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Nossa equipe está pronta para ajudar você
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" className="gap-2" asChild>
                <a href="mailto:suporte@leadflow.com">
                  <Mail className="h-4 w-4" />
                  suporte@leadflow.com
                </a>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
