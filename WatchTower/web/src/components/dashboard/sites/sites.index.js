import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  addClientToHierarchy,
  addSiteToClient,
  addPostToSite,
  updateClientInHierarchy,
  updateSiteInClient,
  updatePostInSite
} from '../../../store/slices/deploymentSlice';
import './sites.css';

export default function Sites() {
  const dispatch = useDispatch();
  const { user, hasScopeAccess } = usePermissions();
  
  // Load data from Redux
  const tenants = useSelector(state => state.deployment.tenants);
  const hierarchy = useSelector(state => state.deployment.hierarchy);

  // Setup local scope based on user's role
  const isSuperadmin = user?.role === 'ULTRA_SUPER_ADMIN';
  const initialTenantId = isSuperadmin ? tenants[0]?.id : 'T-001';
  
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId);
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const tenantClients = (hierarchy[selectedTenantId] || []).filter(client => hasScopeAccess('CLIENT', [client.id]));

  // Navigation states
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedNode, setSelectedNode] = useState(null); // { type: 'client'|'site'|'post', id, data, parentData }

  // Modal control states
  const [activeModal, setActiveModal] = useState(null); // 'client' | 'site' | 'post'
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [modalData, setModalData] = useState({});

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleNodeClick = (type, data, parentData = null) => {
    setSelectedNode({ type, id: data.id, data, parentData });
  };

  const openAddModal = (type, parentData = null) => {
    setModalMode('add');
    if (type === 'client') {
      setModalData({ name: '', contractType: 'Per Guard Per Month', guards: '', billingRate: '', slaTarget: '95', contactPerson: '' });
    } else if (type === 'site') {
      setModalData({ name: '', location: '', contactPerson: '', parentClientId: parentData?.id });
    } else if (type === 'post') {
      setModalData({ name: '', locationCoords: '18.5204° N, 73.8567° E', parentSiteId: parentData?.id, parentClientId: parentData?.parentClientId });
    }
    setActiveModal(type);
  };

  const openEditModal = (type, data, parentData = null) => {
    setModalMode('edit');
    setModalData({ ...data, parentData });
    setActiveModal(type);
  };

  const handleModalSave = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      if (activeModal === 'client') {
        const newClient = {
          id: `CL-${Math.floor(100 + Math.random() * 900)}`,
          name: modalData.name,
          contractType: modalData.contractType,
          guards: parseInt(modalData.guards || 0),
          billingRate: parseInt(modalData.billingRate || 0),
          slaTarget: modalData.slaTarget + '%',
          status: 'Active',
          contactPerson: modalData.contactPerson,
          sites: []
        };
        dispatch(addClientToHierarchy({ tenantId: selectedTenantId, client: newClient }));
        // Auto-select the newly added client
        setSelectedNode({ type: 'client', id: newClient.id, data: newClient });
      } else if (activeModal === 'site') {
        const newSite = {
          id: `ST-${Math.floor(100 + Math.random() * 900)}`,
          name: modalData.name,
          location: modalData.location,
          contactPerson: modalData.contactPerson,
          posts: []
        };
        dispatch(addSiteToClient({ tenantId: selectedTenantId, clientId: modalData.parentClientId, site: newSite }));
        // Expand client node
        setExpandedNodes(prev => ({ ...prev, [modalData.parentClientId]: true }));
        // Auto-select site
        setSelectedNode({ type: 'site', id: newSite.id, data: newSite, parentData: { id: modalData.parentClientId } });
      } else if (activeModal === 'post') {
        const newPost = {
          id: `PT-${Math.floor(100 + Math.random() * 900)}`,
          name: modalData.name,
          locationCoords: modalData.locationCoords
        };
        dispatch(addPostToSite({
          tenantId: selectedTenantId,
          clientId: modalData.parentClientId,
          siteId: modalData.parentSiteId,
          post: newPost
        }));
        // Expand site node
        setExpandedNodes(prev => ({ ...prev, [modalData.parentSiteId]: true }));
        setSelectedNode({ type: 'post', id: newPost.id, data: newPost, parentData: { id: modalData.parentSiteId, clientId: modalData.parentClientId } });
      }
    } else {
      // Edit mode
      if (activeModal === 'client') {
        dispatch(updateClientInHierarchy({ tenantId: selectedTenantId, client: modalData }));
        setSelectedNode(prev => ({ ...prev, data: modalData }));
      } else if (activeModal === 'site') {
        dispatch(updateSiteInClient({ tenantId: selectedTenantId, clientId: modalData.parentData.id, site: modalData }));
        setSelectedNode(prev => ({ ...prev, data: modalData }));
      } else if (activeModal === 'post') {
        dispatch(updatePostInSite({
          tenantId: selectedTenantId,
          clientId: modalData.parentData.clientId,
          siteId: modalData.parentData.id,
          post: modalData
        }));
        setSelectedNode(prev => ({ ...prev, data: modalData }));
      }
    }
    setActiveModal(null);
  };

  return (
    <main className="sites-main">
      <header className="sites-header">
        <div className="sites-title">
          <h1>Sites & Posts</h1>
          <p>Deployment hierarchy and operational zones</p>
        </div>
        
        {isSuperadmin && (
          <div className="dash-controls">
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'flex', alignItems: 'center', marginRight: 8 }}>Browsing Tenant:</span>
            <select
              className="dash-search"
              style={{ borderRadius: 8, width: 220 }}
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setSelectedNode(null);
                setExpandedNodes({});
              }}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Stepper Breadcrumbs */}
      {selectedNode && (
        <div className="breadcrumb-container">
          <span className="breadcrumb-item">{selectedTenant?.name}</span>
          <span className="breadcrumb-separator">/</span>
          {selectedNode.type === 'client' && (
            <span className="breadcrumb-item active">{selectedNode.data.name}</span>
          )}
          {selectedNode.type === 'site' && (
            <>
              <span className="breadcrumb-item">{selectedNode.parentData?.name || 'Client'}</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item active">{selectedNode.data.name}</span>
            </>
          )}
          {selectedNode.type === 'post' && (
            <>
              <span className="breadcrumb-item">{selectedNode.parentData?.clientName || 'Client'}</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item">{selectedNode.parentData?.name || 'Site'}</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item active">{selectedNode.data.name}</span>
            </>
          )}
        </div>
      )}

      <div className="sites-layout">
        {/* Left Column: Interactive Tree Structure */}
        <div className="tree-card">
          <div className="tree-title">
            <span>Organizational Tree</span>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => openAddModal('client')}>
              + Add Client
            </button>
          </div>

          <div className="tree-container">
            {/* Level 1: Tenant Node */}
            <div className="tree-node">
              <div 
                className={`node-header ${!selectedNode ? 'active' : ''}`}
                onClick={() => setSelectedNode(null)}
              >
                <span className="node-arrow expanded">▶</span>
                <span className="node-icon">🏢</span>
                <span className="node-label">{selectedTenant?.name}</span>
                <span className="node-badge" style={{ color: 'var(--beacon)' }}>Tenant</span>
              </div>

              <div className="node-children">
                {/* Level 2: Clients */}
                {tenantClients.map(client => {
                  const isClientExpanded = expandedNodes[client.id];
                  const isClientSelected = selectedNode?.type === 'client' && selectedNode?.id === client.id;
                  
                  return (
                    <div key={client.id} className="tree-node">
                      <div 
                        className={`node-header ${isClientSelected ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeClick('client', client);
                        }}
                      >
                        <span 
                          className={`node-arrow ${isClientExpanded ? 'expanded' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNode(client.id);
                          }}
                        >
                          ▶
                        </span>
                        <span className="node-icon">💼</span>
                        <span className="node-label">{client.name}</span>
                        <span className="node-badge">Client</span>
                      </div>

                      {isClientExpanded && (
                        <div className="node-children">
                          {/* Level 3: Sites */}
                          {client.subClients?.filter(site => hasScopeAccess('SITE', [site.id])).map(site => {
                            const isSiteExpanded = expandedNodes[site.id];
                            const isSiteSelected = selectedNode?.type === 'site' && selectedNode?.id === site.id;
                            
                            return (
                              <div key={site.id} className="tree-node">
                                <div 
                                  className={`node-header ${isSiteSelected ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNodeClick('site', site, client);
                                  }}
                                >
                                  <span 
                                    className={`node-arrow ${isSiteExpanded ? 'expanded' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNode(site.id);
                                    }}
                                  >
                                    ▶
                                  </span>
                                  <span className="node-icon">📍</span>
                                  <span className="node-label">{site.name}</span>
                                  <span className="node-badge">Site</span>
                                </div>

                                {isSiteExpanded && (
                                  <div className="node-children">
                                    {/* Level 4: Posts */}
                                    {site.posts?.map(post => {
                                      const isPostSelected = selectedNode?.type === 'post' && selectedNode?.id === post.id;
                                      
                                      return (
                                        <div key={post.id} className="tree-node">
                                          <div 
                                            className={`node-header ${isPostSelected ? 'active' : ''}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleNodeClick('post', post, { id: site.id, name: site.name, clientId: client.id, clientName: client.name });
                                            }}
                                            style={{ paddingLeft: 24 }}
                                          >
                                            <span className="node-icon" style={{ color: 'var(--text-muted)' }}>🛡️</span>
                                            <span className="node-label">{post.name}</span>
                                            <span className="node-badge">Post</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <button 
                                      className="btn-secondary" 
                                      style={{ alignSelf: 'flex-start', margin: '4px 0 4px 24px', fontSize: 11, padding: '4px 8px' }}
                                      onClick={() => openAddModal('post', { id: site.id, parentClientId: client.id })}
                                    >
                                      + Add Post
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <button 
                            className="btn-secondary" 
                            style={{ alignSelf: 'flex-start', margin: '4px 0 4px 24px', fontSize: 11, padding: '4px 8px' }}
                            onClick={() => openAddModal('site', client)}
                          >
                            + Add Site
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Details card */}
        <div className="detail-card">
          {!selectedNode ? (
            <div>
              <div className="detail-title">Tenant Details</div>
              <div className="info-row"><span className="info-label">Tenant ID</span><span className="info-value">{selectedTenant?.id}</span></div>
              <div className="info-row"><span className="info-label">Organization Name</span><span className="info-value">{selectedTenant?.name}</span></div>
              <div className="info-row"><span className="info-label">Subscription Tier</span><span className="info-value" style={{ color: 'var(--beacon)' }}>{selectedTenant?.plan}</span></div>
              <div className="info-row"><span className="info-label">Primary Email</span><span className="info-value">{selectedTenant?.email}</span></div>
              <div className="info-row"><span className="info-label">Contact Number</span><span className="info-value">{selectedTenant?.phone}</span></div>
              <div className="info-row"><span className="info-label">Status</span><span className="info-value"><span className="status-dot st-active"></span> {selectedTenant?.status}</span></div>
              
              <div style={{ marginTop: 32 }}>
                <h4 style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>Platform-wide Overview</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Clients Registered</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--beacon)', marginTop: 4 }}>{tenantClients.length}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Deployment Sites</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--beacon)', marginTop: 4 }}>
                      {tenantClients.reduce((acc, curr) => acc + (curr.subClients?.length || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="detail-title">
                <span>{selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Details</span>
                <div>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', marginRight: 8 }} onClick={() => openEditModal(selectedNode.type, selectedNode.data, selectedNode.parentData)}>
                    Edit
                  </button>
                </div>
              </div>

              {selectedNode.type === 'client' && (
                <div>
                  <div className="info-row"><span className="info-label">Client ID</span><span className="info-value">{selectedNode.data.id}</span></div>
                  <div className="info-row"><span className="info-label">Name</span><span className="info-value">{selectedNode.data.name}</span></div>
                  <div className="info-row"><span className="info-label">Contract Type</span><span className="info-value">{selectedNode.data.contractType}</span></div>
                  <div className="info-row"><span className="info-label">SLA Target</span><span className="info-value">{selectedNode.data.slaTarget}</span></div>
                  <div className="info-row"><span className="info-label">Contact Person</span><span className="info-value">{selectedNode.data.contactPerson}</span></div>
                  
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>Sites Registered ({selectedNode.data.subClients?.length || 0})</h4>
                      <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openAddModal('site', selectedNode.data)}>
                        + Add Site
                      </button>
                    </div>
                    {selectedNode.data.subClients && selectedNode.data.subClients.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedNode.data.subClients.map(s => (
                          <div key={s.id} className="node-header" style={{ border: '1px solid var(--line)', background: 'var(--bg)' }} onClick={() => handleNodeClick('site', s, selectedNode.data)}>
                            <span>📍</span>
                            <span style={{ flexGrow: 1 }}>{s.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.posts?.length || 0} posts</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--faint)' }}>
                        No sites deployed under this client yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedNode.type === 'site' && (
                <div>
                  <div className="info-row"><span className="info-label">Site ID</span><span className="info-value">{selectedNode.data.id}</span></div>
                  <div className="info-row"><span className="info-label">Site Name</span><span className="info-value">{selectedNode.data.name}</span></div>
                  <div className="info-row"><span className="info-label">Location / Address</span><span className="info-value">{selectedNode.data.location || 'Pune, MH'}</span></div>
                  <div className="info-row"><span className="info-label">Contact Person</span><span className="info-value">{selectedNode.data.contactPerson || 'N/A'}</span></div>
                  
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>Posts Configured ({selectedNode.data.posts?.length || 0})</h4>
                      <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openAddModal('post', { id: selectedNode.data.id, parentClientId: selectedNode.parentData.id })}>
                        + Add Post
                      </button>
                    </div>
                    {selectedNode.data.posts && selectedNode.data.posts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedNode.data.posts.map(p => (
                          <div key={p.id} className="node-header" style={{ border: '1px solid var(--line)', background: 'var(--bg)' }} onClick={() => handleNodeClick('post', p, { id: selectedNode.data.id, name: selectedNode.data.name, clientId: selectedNode.parentData.id })}>
                            <span>🛡️</span>
                            <span style={{ flexGrow: 1 }}>{p.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--faint)' }}>ID: {p.id}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--line)', borderRadius: 12, color: 'var(--faint)' }}>
                        No posts configured for this site yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedNode.type === 'post' && (
                <div>
                  <div className="info-row"><span className="info-label">Post ID</span><span className="info-value">{selectedNode.data.id}</span></div>
                  <div className="info-row"><span className="info-label">Post Name</span><span className="info-value">{selectedNode.data.name}</span></div>
                  <div className="info-row"><span className="info-label">GPS Coordinates</span><span className="info-value" style={{ fontFamily: 'monospace' }}>{selectedNode.data.locationCoords || '18.5204° N, 73.8567° E'}</span></div>
                  <div className="info-row"><span className="info-label">Status</span><span className="info-value" style={{ color: 'var(--beacon)' }}>Active Patrol Zone</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unified Modal Overlay */}
      {activeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? `Add New ${activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}` : `Edit ${activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}`}</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleModalSave}>
              {activeModal === 'client' && (
                <>
                  <div className="form-group">
                    <label>Client Organization Name</label>
                    <input 
                      type="text" 
                      required 
                      value={modalData.name || ''} 
                      onChange={e => setModalData({ ...modalData, name: e.target.value })} 
                      placeholder="e.g. ICICI Bank"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contract Type</label>
                    <select 
                      value={modalData.contractType || ''} 
                      onChange={e => setModalData({ ...modalData, contractType: e.target.value })}
                    >
                      <option>Per Guard Per Month</option>
                      <option>Per Guard Per Day</option>
                      <option>Per Shift</option>
                      <option>Attendance-Based</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Target Guard Headcount</label>
                    <input 
                      type="number" 
                      value={modalData.guards || ''} 
                      onChange={e => setModalData({ ...modalData, guards: e.target.value })} 
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="form-group">
                    <label>Base Billing Rate (INR)</label>
                    <input 
                      type="number" 
                      value={modalData.billingRate || ''} 
                      onChange={e => setModalData({ ...modalData, billingRate: e.target.value })} 
                      placeholder="e.g. 15000"
                    />
                  </div>
                  <div className="form-group">
                    <label>SLA Target (%)</label>
                    <input 
                      type="number" 
                      min="80" 
                      max="100" 
                      value={modalData.slaTarget || ''} 
                      onChange={e => setModalData({ ...modalData, slaTarget: e.target.value })} 
                      placeholder="e.g. 95"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input 
                      type="text" 
                      value={modalData.contactPerson || ''} 
                      onChange={e => setModalData({ ...modalData, contactPerson: e.target.value })} 
                      placeholder="Representative Name"
                    />
                  </div>
                </>
              )}

              {activeModal === 'site' && (
                <>
                  <div className="form-group">
                    <label>Site Name</label>
                    <input 
                      type="text" 
                      required 
                      value={modalData.name || ''} 
                      onChange={e => setModalData({ ...modalData, name: e.target.value })} 
                      placeholder="e.g. Pune Branch"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location / Address</label>
                    <input 
                      type="text" 
                      value={modalData.location || ''} 
                      onChange={e => setModalData({ ...modalData, location: e.target.value })} 
                      placeholder="e.g. MG Road, Pune"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input 
                      type="text" 
                      value={modalData.contactPerson || ''} 
                      onChange={e => setModalData({ ...modalData, contactPerson: e.target.value })} 
                      placeholder="Representative Name"
                    />
                  </div>
                </>
              )}

              {activeModal === 'post' && (
                <>
                  <div className="form-group">
                    <label>Post Name</label>
                    <input 
                      type="text" 
                      required 
                      value={modalData.name || ''} 
                      onChange={e => setModalData({ ...modalData, name: e.target.value })} 
                      placeholder="e.g. ATM Gate"
                    />
                  </div>
                  <div className="form-group">
                    <label>GPS Coordinates</label>
                    <input 
                      type="text" 
                      value={modalData.locationCoords || ''} 
                      onChange={e => setModalData({ ...modalData, locationCoords: e.target.value })} 
                      placeholder="e.g. 18.5204° N, 73.8567° E"
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
