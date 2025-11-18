// src/services/analytics/AnalyticsEvent.js
class AnalyticsEvent {
  constructor(eventType, eventData = {}) {
    this.eventId = this.generateEventId();
    this.timestamp = new Date().toISOString();
    this.eventType = eventType;
    this.eventData = eventData;
    this.sessionId = this.getSessionId();
    this.userId = this.getUserId();
    this.platform = this.getPlatformInfo();
    this.metadata = this.generateMetadata();
  }

  // Generar ID único para el evento
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtener ID de sesión persistente
  getSessionId() {
    let sessionId = sessionStorage.getItem('academicchain_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('academicchain_session_id', sessionId);
    }
    return sessionId;
  }

  // Obtener ID de usuario si está autenticado
  getUserId() {
    try {
      const userData = localStorage.getItem('academicchain_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.email || 'anonymous';
      }
    } catch (error) {
      console.warn('Error getting user ID:', error);
    }
    return 'anonymous';
  }

  // Obtener información de la plataforma
  getPlatformInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: {
        width: screen.width,
        height: screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Generar metadatos adicionales
  generateMetadata() {
    return {
      page: window.location.pathname,
      referrer: document.referrer,
      url: window.location.href,
      hash: window.location.hash,
      hostname: window.location.hostname,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE || 'development'
    };
  }

  // Enriquecer evento con datos específicos de Hedera
  enrichWithHederaData(hederaContext = {}) {
    this.hederaContext = {
      network: hederaContext.network || 'testnet',
      accountId: hederaContext.accountId,
      isConnected: hederaContext.isConnected || false,
      transactionCount: hederaContext.transactionCount || 0,
      gasUsed: hederaContext.gasUsed || 0,
      ...hederaContext
    };
    return this;
  }

  // Enriquecer evento con datos de la aplicación
  enrichWithAppData(appContext = {}) {
    this.appContext = {
      version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      institutionId: appContext.institutionId,
      userRole: appContext.userRole,
      permissions: appContext.permissions,
      ...appContext
    };
    return this;
  }

  // Validar el evento antes de enviarlo
  validate() {
    const required = ['eventId', 'timestamp', 'eventType', 'sessionId'];
    const missing = required.filter(field => !this[field]);
    
    if (missing.length > 0) {
      throw new Error(`Evento inválido. Campos faltantes: ${missing.join(', ')}`);
    }

    if (typeof this.eventType !== 'string' || this.eventType.length === 0) {
      throw new Error('eventType debe ser un string no vacío');
    }

    return true;
  }

  // Serializar evento para envío
  serialize() {
    return {
      eventId: this.eventId,
      timestamp: this.timestamp,
      eventType: this.eventType,
      eventData: this.eventData,
      sessionId: this.sessionId,
      userId: this.userId,
      platform: this.platform,
      metadata: this.metadata,
      hederaContext: this.hederaContext,
      appContext: this.appContext,
      // Campos calculados
      duration: this.calculateDuration(),
      performance: this.getPerformanceMetrics()
    };
  }

  // Calcular duración si es un evento de tipo fin
  calculateDuration() {
    if (this.eventType.endsWith('_end') && this.startTime) {
      return Date.now() - this.startTime;
    }
    return null;
  }

  // Obtener métricas de performance
  getPerformanceMetrics() {
    if (!window.performance) return null;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return null;

    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint()
    };
  }

  // Métricas específicas de performance
  getFirstPaint() {
    const entry = performance.getEntriesByName('first-paint')[0];
    return entry ? entry.startTime : null;
  }

  getFirstContentfulPaint() {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry ? entry.startTime : null;
  }

  // Método estático para crear eventos predefinidos
  static create(eventType, data = {}) {
    return new AnalyticsEvent(eventType, data);
  }

  // Eventos específicos del sistema
  static pageView(pageData = {}) {
    return new AnalyticsEvent('page_view', {
      pageTitle: document.title,
      ...pageData
    });
  }

  static userInteraction(interactionData = {}) {
    return new AnalyticsEvent('user_interaction', {
      element: interactionData.element,
      action: interactionData.action,
      value: interactionData.value,
      ...interactionData
    });
  }

  static hederaTransaction(txData = {}) {
    return new AnalyticsEvent('hedera_transaction', {
      transactionType: txData.type,
      transactionId: txData.transactionId,
      status: txData.status,
      cost: txData.cost,
      gasUsed: txData.gasUsed,
      ...txData
    });
  }

  static credentialOperation(operationData = {}) {
    return new AnalyticsEvent('credential_operation', {
      operation: operationData.operation, // 'issue', 'verify', 'revoke'
      credentialType: operationData.credentialType,
      institution: operationData.institution,
      studentCount: operationData.studentCount,
      ...operationData
    });
  }

  static errorEvent(errorData = {}) {
    return new AnalyticsEvent('error', {
      errorMessage: errorData.message,
      stackTrace: errorData.stack,
      component: errorData.component,
      severity: errorData.severity || 'error',
      ...errorData
    });
  }

  static performanceMetric(metricData = {}) {
    return new AnalyticsEvent('performance_metric', {
      metricName: metricData.name,
      value: metricData.value,
      unit: metricData.unit,
      threshold: metricData.threshold,
      ...metricData
    });
  }
}

export default AnalyticsEvent;