const axios = require('axios');
const logger = require('../utils/logger');
const { HubSpotAuth } = require('./hubspotAuthService');

class CRMService {
  constructor() {
    this.providers = {};
    this.initializeProviders();
  }

  initializeProviders() {
    // HubSpot CRM - Enhanced with OAuth and complete lead-to-deal flow
    if (process.env.HUBSPOT_CLIENT_ID || process.env.HUBSPOT_ACCESS_TOKEN) {
      this.providers.hubspot = {
        name: 'HubSpot',
        isConfigured: () => HubSpotAuth.isConfigured(),
        
        // Flujo completo: Contact → Company → Deal → Timeline Event
        syncLead: async (leadData) => {
          try {
            const results = {};
            
            // 1. Crear o actualizar contacto
            results.contact = await this.createHubSpotContact(leadData);
            
            // 2. Crear o actualizar compañía
            results.company = await this.createHubSpotCompany(leadData);
            
            // 3. Asociar contacto con compañía
            if (results.contact.success && results.company.success) {
              await this.associateContactWithCompany(
                results.contact.data.id, 
                results.company.data.id
              );
            }
            
            // 4. Crear deal (oportunidad)
            results.deal = await this.createHubSpotDeal(leadData, {
              contactId: results.contact.data?.id,
              companyId: results.company.data?.id
            });
            
            // 5. Crear evento en timeline (seguimiento)
            if (results.contact.success) {
              results.timeline = await this.createTimelineEvent(
                results.contact.data.id,
                leadData
              );
            }
            
            // 6. Agregar a lista de marketing (si está configurada)
            if (process.env.HUBSPOT_MARKETING_LIST_ID) {
              results.marketing = await this.addToMarketingList(
                leadData.email,
                process.env.HUBSPOT_MARKETING_LIST_ID
              );
            }
            
            return {
              success: Object.values(results).some(r => r?.success),
              results: results,
              provider: 'hubspot'
            };
            
          } catch (error) {
            logger.error('HubSpot complete sync error:', error);
            return { success: false, error: error.message, provider: 'hubspot' };
          }
        },
        
        createContact: async (contactData) => {
          return await this.createHubSpotContact(contactData);
        },
        
        createDeal: async (dealData) => {
          return await this.createHubSpotDeal(dealData);
        }
      };
    }

    // Salesforce CRM
    if (process.env.SALESFORCE_ACCESS_TOKEN && process.env.SALESFORCE_INSTANCE_URL) {
      this.providers.salesforce = {
        name: 'Salesforce',
        createLead: async (leadData) => {
          try {
            const response = await axios.post(
              `${process.env.SALESFORCE_INSTANCE_URL}/services/data/v58.0/sobjects/Lead/`,
              {
                FirstName: leadData.name.split(' ')[0],
                LastName: leadData.name.split(' ').slice(1).join(' ') || '',
                Email: leadData.email,
                Company: leadData.org,
                Phone: leadData.phone || '',
                Website: leadData.website || '',
                LeadSource: 'Website Demo',
                Status: 'Open - Not Contacted',
                Demo_Scheduled__c: leadData.demoTime,
                Timezone__c: leadData.timezone,
                Description: `Demo scheduled for ${leadData.demoTime} (${leadData.timezone})`
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.SALESFORCE_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            return { success: true, data: response.data, provider: 'salesforce' };
          } catch (error) {
            logger.error('Salesforce CRM Error:', error.response?.data || error.message);
            return { success: false, error: error.message, provider: 'salesforce' };
          }
        }
      };
    }

    // Pipedrive CRM
    if (process.env.PIPEDRIVE_API_TOKEN) {
      this.providers.pipedrive = {
        name: 'Pipedrive',
        createPerson: async (personData) => {
          try {
            const response = await axios.post(
              'https://api.pipedrive.com/v1/persons',
              {
                name: personData.name,
                email: [{ value: personData.email, primary: true }],
                phone: personData.phone ? [{ value: personData.phone, primary: true }] : [],
                org_id: await this.getOrCreateOrganization(personData.org),
                demo_scheduled: personData.demoTime,
                timezone: personData.timezone,
                label: 'demo-lead'
              },
              {
                params: { api_token: process.env.PIPEDRIVE_API_TOKEN }
              }
            );
            
            if (response.data.success) {
              await this.createDeal({
                title: `Demo AcademicChain - ${personData.org}`,
                person_id: response.data.data.id,
                org_id: response.data.data.org_id,
                stage_id: 1, // New lead stage
                value: 0,
                demo_time: personData.demoTime
              });
            }
            
            return { success: true, data: response.data, provider: 'pipedrive' };
          } catch (error) {
            logger.error('Pipedrive CRM Error:', error.response?.data || error.message);
            return { success: false, error: error.message, provider: 'pipedrive' };
          }
        },
        getOrCreateOrganization: async (orgName) => {
          try {
            const searchResponse = await axios.get(
              'https://api.pipedrive.com/v1/organizations/search',
              {
                params: {
                  api_token: process.env.PIPEDRIVE_API_TOKEN,
                  term: orgName,
                  fields: 'name'
                }
              }
            );
            
            if (searchResponse.data.data.items.length > 0) {
              return searchResponse.data.data.items[0].id;
            }
            
            const createResponse = await axios.post(
              'https://api.pipedrive.com/v1/organizations',
              {
                name: orgName,
                visible_to: 3
              },
              {
                params: { api_token: process.env.PIPEDRIVE_API_TOKEN }
              }
            );
            
            return createResponse.data.data.id;
          } catch (error) {
            logger.error('Pipedrive Org Error:', error.message);
            return null;
          }
        },
        createDeal: async (dealData) => {
          try {
            const response = await axios.post(
              'https://api.pipedrive.com/v1/deals',
              {
                title: dealData.title,
                person_id: dealData.person_id,
                org_id: dealData.org_id,
                stage_id: dealData.stage_id,
                value: dealData.value,
                demo_scheduled: dealData.demo_time,
                expected_close_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              },
              {
                params: { api_token: process.env.PIPEDRIVE_API_TOKEN }
              }
            );
            return response.data;
          } catch (error) {
            logger.error('Pipedrive Deal Error:', error.message);
            throw error;
          }
        }
      };
    }

    // Custom Webhook (for any other CRM)
    if (process.env.CRM_WEBHOOK_URL) {
      this.providers.webhook = {
        name: 'Webhook',
        sendData: async (crmData) => {
          try {
            const response = await axios.post(
              process.env.CRM_WEBHOOK_URL,
              {
                event: 'demo_scheduled',
                data: {
                  contact: {
                    name: crmData.name,
                    email: crmData.email,
                    company: crmData.org,
                    phone: crmData.phone,
                    demo_time: crmData.demoTime,
                    timezone: crmData.timezone
                  },
                  metadata: {
                    source: 'academicchain-demo-form',
                    timestamp: new Date().toISOString(),
                    booking_id: crmData.bookingId
                  }
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': process.env.CRM_WEBHOOK_AUTH ? `Bearer ${process.env.CRM_WEBHOOK_AUTH}` : undefined
                },
                timeout: 5000
              }
            );
            return { success: true, data: response.data, provider: 'webhook' };
          } catch (error) {
            logger.error('CRM Webhook Error:', error.message);
            return { success: false, error: error.message, provider: 'webhook' };
          }
        }
      };
    }
  }

  // Métodos específicos de HubSpot
  async createHubSpotContact(contactData) {
    try {
      const response = await HubSpotAuth.makeAuthenticatedRequest({
        method: 'post',
        url: 'https://api.hubapi.com/crm/v3/objects/contacts',
        data: {
          properties: {
            email: contactData.email,
            firstname: contactData.name.split(' ')[0],
            lastname: contactData.name.split(' ').slice(1).join(' ') || '',
            company: contactData.org,
            phone: contactData.phone || '',
            website: contactData.website || '',
            demo_scheduled: new Date().toISOString(),
            demo_time: contactData.demoTime,
            timezone: contactData.timezone,
            lead_source: 'Website Demo Form',
            lifecyclestage: 'lead',
            hs_lead_status: 'NEW',
            hs_pipeline: 'contacts-lifecycle-pipeline'
          }
        }
      });
      
      return { success: true, data: response.data, provider: 'hubspot' };
    } catch (error) {
      logger.error('HubSpot Contact Error:', error.response?.data || error.message);
      return { success: false, error: error.message, provider: 'hubspot' };
    }
  }

  async createHubSpotCompany(companyData) {
    try {
      const response = await HubSpotAuth.makeAuthenticatedRequest({
        method: 'post',
        url: 'https://api.hubapi.com/crm/v3/objects/companies',
        data: {
          properties: {
            name: companyData.org,
            domain: companyData.website || '',
            industry: 'Education Technology',
            hs_lead_status: 'NEW',
            numberofemployees: '1-10',
            annualrevenue: '0',
            hubspot_owner_id: process.env.HUBSPOT_OWNER_ID || ''
          }
        }
      });
      
      return { success: true, data: response.data, provider: 'hubspot' };
    } catch (error) {
      logger.error('HubSpot Company Error:', error.response?.data || error.message);
      return { success: false, error: error.message, provider: 'hubspot' };
    }
  }

  async createHubSpotDeal(dealData, associations = {}) {
    try {
      const response = await HubSpotAuth.makeAuthenticatedRequest({
        method: 'post',
        url: 'https://api.hubapi.com/crm/v3/objects/deals',
        data: {
          properties: {
            dealname: `Demo AcademicChain - ${dealData.org}`,
            dealstage: 'appointmentscheduled',
            amount: '0',
            pipeline: 'default',
            hubspot_owner_id: process.env.HUBSPOT_OWNER_ID || '',
            demo_scheduled_time: dealData.demoTime,
            timezone: dealData.timezone,
            dealtype: 'B2B',
            hs_priority: 'HIGH',
            hs_deal_stage_probability: '0.5'
          },
          associations: [
            {
              to: { id: associations.contactId },
              types: [{
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 3 // Contact to Deal association
              }]
            },
            {
              to: { id: associations.companyId },
              types: [{
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 279 // Company to Deal association
              }]
            }
          ]
        }
      });
      
      return { success: true, data: response.data, provider: 'hubspot' };
    } catch (error) {
      logger.error('HubSpot Deal Error:', error.response?.data || error.message);
      return { success: false, error: error.message, provider: 'hubspot' };
    }
  }

  async associateContactWithCompany(contactId, companyId) {
    try {
      await HubSpotAuth.makeAuthenticatedRequest({
        method: 'put',
        url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}`,
        data: {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 279 // Contact to Company association
        }
      });
      
      return { success: true, provider: 'hubspot' };
    } catch (error) {
      logger.error('HubSpot Association Error:', error.response?.data || error.message);
      return { success: false, error: error.message, provider: 'hubspot' };
    }
  }

  async createTimelineEvent(contactId, eventData) {
    try {
      const response = await HubSpotAuth.makeAuthenticatedRequest({
        method: 'post',
        url: 'https://api.hubapi.com/crm/v3/timeline/events',
        data: {
          eventTemplateId: 'demo_scheduled_event',
          objectId: contactId,
          tokens: {
            demo_time: eventData.demoTime,
            timezone: eventData.timezone,
            company_name: eventData.org,
            contact_name: eventData.name
          },
          extraData: {
            eventDate: Date.now(),
            eventType: 'DEMO_SCHEDULED'
          }
        }
      });
      
      return { success: true, data: response.data, provider: 'hubspot' };
    } catch (error) {
      logger.error('HubSpot Timeline Error:', error.response?.data || error.message);
      return { success: false, error: error.message, provider: 'hubspot' };
    }
  }

  async addToMarketingList(email, listId) {
    try {
      const response = await HubSpotAuth.makeAuthenticatedRequest({
        method: 'post',
        url: 'https://api.hubapi.com/contacts/v1/lists/${listId}/add',
        data: {
          emails: [email]
        }
      });
      
      return { success: true, data: response.data, provider: 'hubspot' };
    } catch (error) {
      logger.error('HubSpot Marketing List Error:', error.response?.data || error.message);
      return { success: false, error: error.message, provider: 'hubspot' };
    }
  }

  async syncToCRM(bookingData, bookingId) {
    const results = [];
    const crmData = {
      name: bookingData.name,
      email: bookingData.email,
      org: bookingData.org,
      demoTime: bookingData.startTime,
      timezone: bookingData.tz,
      bookingId: bookingId
    };

    // Execute all configured CRM providers
    for (const [providerName, provider] of Object.entries(this.providers)) {
      try {
        let result;
        
        switch (providerName) {
          case 'hubspot':
            result = await provider.createContact(crmData);
            if (result.success && result.data.id) {
              await provider.createDeal({
                company: crmData.org,
                demoTime: crmData.demoTime,
                timezone: crmData.timezone,
                contactId: result.data.id
              });
            }
            break;
          
          case 'salesforce':
            result = await provider.createLead(crmData);
            break;
          
          case 'pipedrive':
            result = await provider.createPerson(crmData);
            break;
          
          case 'webhook':
            result = await provider.sendData(crmData);
            break;
          
          default:
            result = { success: false, error: 'Unknown provider', provider: providerName };
        }

        results.push(result);
        
        if (result.success) {
          logger.info(`CRM sync successful to ${providerName}:`, {
            bookingId: bookingId,
            contact: crmData.email
          });
        } else {
          logger.warn(`CRM sync failed for ${providerName}:`, result.error);
        }

      } catch (error) {
        const errorResult = {
          success: false,
          error: error.message,
          provider: providerName
        };
        results.push(errorResult);
        logger.error(`CRM sync error for ${providerName}:`, error.message);
      }
    }

    return {
      success: results.some(r => r.success),
      results: results,
      timestamp: new Date().toISOString()
    };
  }

  getAvailableProviders() {
    return Object.keys(this.providers);
  }

  isConfigured() {
    return Object.keys(this.providers).length > 0;
  }
}

module.exports = new CRMService();