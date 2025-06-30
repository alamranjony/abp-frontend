import { Environment } from '@abp/ng.core';

const baseUrl = 'https://{0}.florafirestaging.com';

const oAuthConfig = {
  issuer: 'https://{0}.florafirebackstaging.com/',
  redirectUri: baseUrl,
  clientId: 'ClientPortal_App',
  responseType: 'code',
  scope: 'offline_access ClientPortal',
  requireHttps: true,
};

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'ClientPortal',
  },
  oAuthConfig,
  apis: {
    default: {
      url: 'https://{0}.florafirebackstaging.com',
      rootNamespace: 'MAS.FloraFire.ClientPortal',
    },
    AbpAccountPublic: {
      url: oAuthConfig.issuer,
      rootNamespace: 'AbpAccountPublic',
    },
  },
} as Environment;
