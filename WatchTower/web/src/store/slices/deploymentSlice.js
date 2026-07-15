import { createSlice } from '@reduxjs/toolkit';
import mockData from '../../data/mockData.json';

const initialState = {
  tenants: mockData.screens.deployment.tenants,
  hierarchy: {
    'T-001': mockData.screens.clients.list,
    'T-002': []
  }
};

const deploymentSlice = createSlice({
  name: 'deployment',
  initialState,
  reducers: {
    addTenant: (state, action) => {
      state.tenants.push(action.payload);
      state.hierarchy[action.payload.id] = [];
    },
    updateTenant: (state, action) => {
      const index = state.tenants.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tenants[index] = action.payload;
      }
    },
    toggleTenantStatus: (state, action) => {
      const tenant = state.tenants.find(t => t.id === action.payload);
      if (tenant) {
        tenant.status = tenant.status === 'Active' ? 'Suspended' : 'Active';
      }
    },
    addClientToHierarchy: (state, action) => {
      const { tenantId, client } = action.payload;
      if (!state.hierarchy[tenantId]) {
        state.hierarchy[tenantId] = [];
      }
      state.hierarchy[tenantId].push({
        ...client,
        subClients: client.subClients || []
      });
    },
    updateClientInHierarchy: (state, action) => {
      const { tenantId, client } = action.payload;
      if (state.hierarchy[tenantId]) {
        const clientIndex = state.hierarchy[tenantId].findIndex(c => c.id === client.id);
        if (clientIndex !== -1) {
          state.hierarchy[tenantId][clientIndex] = {
            ...state.hierarchy[tenantId][clientIndex],
            ...client
          };
        }
      }
    },
    addSiteToClient: (state, action) => {
      const { tenantId, clientId, site } = action.payload;
      const clientsList = state.hierarchy[tenantId];
      if (clientsList) {
        const client = clientsList.find(c => c.id === clientId);
        if (client) {
          if (!client.subClients) client.subClients = [];
          client.subClients.push({
            ...site,
            posts: site.posts || []
          });
        }
      }
    },
    updateSiteInClient: (state, action) => {
      const { tenantId, clientId, site } = action.payload;
      const clientsList = state.hierarchy[tenantId];
      if (clientsList) {
        const client = clientsList.find(c => c.id === clientId);
        if (client && client.subClients) {
          const siteIndex = client.subClients.findIndex(s => s.id === site.id);
          if (siteIndex !== -1) {
            client.subClients[siteIndex] = {
              ...client.subClients[siteIndex],
              ...site
            };
          }
        }
      }
    },
    addPostToSite: (state, action) => {
      const { tenantId, clientId, siteId, post } = action.payload;
      const clientsList = state.hierarchy[tenantId];
      if (clientsList) {
        const client = clientsList.find(c => c.id === clientId);
        if (client && client.subClients) {
          const site = client.subClients.find(s => s.id === siteId);
          if (site) {
            if (!site.posts) site.posts = [];
            site.posts.push(post);
          }
        }
      }
    },
    updatePostInSite: (state, action) => {
      const { tenantId, clientId, siteId, post } = action.payload;
      const clientsList = state.hierarchy[tenantId];
      if (clientsList) {
        const client = clientsList.find(c => c.id === clientId);
        if (client && client.subClients) {
          const site = client.subClients.find(s => s.id === siteId);
          if (site && site.posts) {
            const postIndex = site.posts.findIndex(p => p.id === post.id);
            if (postIndex !== -1) {
              site.posts[postIndex] = {
                ...site.posts[postIndex],
                ...post
              };
            }
          }
        }
      }
    }
  }
});

export const {
  addTenant,
  updateTenant,
  toggleTenantStatus,
  addClientToHierarchy,
  updateClientInHierarchy,
  addSiteToClient,
  updateSiteInClient,
  addPostToSite,
  updatePostInSite
} = deploymentSlice.actions;

export default deploymentSlice.reducer;
