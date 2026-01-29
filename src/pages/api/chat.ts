import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Mensaje requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Integrar DeepSeek API
    // Por ahora, respuestas predefinidas basadas en palabras clave
    const lowerMessage = message.toLowerCase();
    let reply = '';

    if (lowerMessage.includes('chatbot') || lowerMessage.includes('chat bot')) {
      reply = `Un chatbot con IA es un asistente virtual que puede atender a tus clientes 24/7.

Nuestros chatbots se integran con tus sistemas (ERP, CRM, bases de datos) para responder consultas sobre pedidos, facturas, productos y más.

**Beneficios:**
- Atención instantánea 24 horas
- Reduce carga del equipo de soporte
- Se integra con WhatsApp, web y otros canales

¿Te gustaría saber más sobre precios o ver una demo?`;
    } else if (lowerMessage.includes('precio') || lowerMessage.includes('cuesta') || lowerMessage.includes('coste')) {
      reply = `Nuestros precios varían según el servicio y la complejidad del proyecto:

**Chatbot IA**: desde 800€/mes
**Gestor Documental IA**: desde 600€/mes
**Automatización de procesos**: desde 500€/mes
**Wazuh/Ciberseguridad**: consultar según infraestructura

Todos incluyen: análisis previo, desarrollo personalizado, formación del equipo y soporte.

¿Quieres agendar una reunión gratuita para evaluar tu caso específico?`;
    } else if (lowerMessage.includes('wazuh') || lowerMessage.includes('seguridad') || lowerMessage.includes('ens')) {
      reply = `**Wazuh** es una plataforma SIEM open-source para:

- Detección de amenazas en tiempo real
- Cumplimiento normativo (ENS, GDPR)
- Monitorización de sistemas y logs
- Alertas de seguridad automatizadas

Es requisito para empresas que deben cumplir con el **Esquema Nacional de Seguridad (ENS)**.

Ofrecemos implementación completa, configuración y soporte continuo. También tenemos un curso intensivo para administradores.

¿Te interesa más información?`;
    } else if (lowerMessage.includes('automatiza') || lowerMessage.includes('automatización') || lowerMessage.includes('rpa')) {
      reply = `La **automatización inteligente** combina RPA con IA para:

- Procesar facturas automáticamente
- Generar informes sin intervención manual
- Responder emails repetitivos
- Sincronizar datos entre sistemas

**Ejemplo real:** Una empresa redujo 15 horas/semana en gestión documental.

Analizamos tus procesos y te mostramos exactamente qué puedes automatizar y cuánto ahorrarás.

¿Quieres una evaluación gratuita?`;
    } else if (lowerMessage.includes('reunión') || lowerMessage.includes('contacto') || lowerMessage.includes('hablar') || lowerMessage.includes('demo')) {
      reply = `¡Perfecto! Puedes agendar una reunión gratuita de 30 minutos donde:

1. Analizamos tus necesidades específicas
2. Te mostramos demos personalizadas
3. Preparamos una propuesta sin compromiso

👉 **[Agenda tu reunión aquí](/reunion)**

También puedes escribirnos a **info@aisecurity.es** o llamar al **722 67 48 74**.`;
    } else {
      reply = `Gracias por tu pregunta. En AI Security ofrecemos:

🤖 **Soluciones de IA:**
- Chatbots inteligentes
- Gestores documentales
- Automatización de procesos
- Atención telefónica con IA

🛡️ **Ciberseguridad:**
- Implementación de Wazuh/SIEM
- Cumplimiento ENS
- Administración de sistemas

¿Sobre qué te gustaría saber más? Puedes preguntarme sobre precios, funcionalidades o agendar una demo.`;
    }

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
