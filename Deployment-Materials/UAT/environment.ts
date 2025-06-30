import { Environment } from '@abp/ng.core';

const baseUrl = 'http://{0}.localhost:4200';

const oAuthConfig = {
  issuer: 'https://florafirebackstaging.com',
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
      url: 'https://florafirebackstaging.com',
      rootNamespace: 'MAS.FloraFire.ClientPortal',
    },
    AbpAccountPublic: {
      url: oAuthConfig.issuer,
      rootNamespace: 'AbpAccountPublic',
    },
    proxyGenerateLocal: {
      url: 'https://florafirebackstaging.com',
    },
    proxyGenerateProd: {
      url: 'https://florafirebackstaging.com',
    },
  },
} as Environment;
