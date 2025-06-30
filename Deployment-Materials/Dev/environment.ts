import { Environment } from '@abp/ng.core';

const baseUrl = 'http://{0}.localhost:4200';

const oAuthConfig = {
  issuer: 'https://florafirebackdev.com',
  redirectUri: baseUrl,
  clientId: 'ClientPortal_App',
  responseType: 'code',
  scope: 'offline_access ClientPortal',
  requireHttps: false,
};

export const environment = {
  production: false,
  application: {
    baseUrl,
    name: 'ClientPortal',
  },
  oAuthConfig,
  apis: {
    default: {
      url: 'https://florafirebackdev.com',
      rootNamespace: 'MAS.FloraFire.ClientPortal',
    },
    AbpAccountPublic: {
      url: oAuthConfig.issuer,
      rootNamespace: 'AbpAccountPublic',
    },
    proxyGenerateLocal: {
      url: 'https://florafirebackdev.com',
    },
    proxyGenerateProd: {
      url: 'https://florafirebackdev.com',
    },
  },
} as Environment;
