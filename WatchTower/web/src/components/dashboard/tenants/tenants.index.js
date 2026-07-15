import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePermissions } from '../../../hooks/usePermissions';
import { addTenant, toggleTenantStatus, updateTenant } from '../../../store/slices/deploymentSlice';
import './tenants.css';

export default function Tenants() {
  const dispatch = useDispatch();
  const { user } = usePermissions();

  // Load tenants from Redux
  const tenants = useSelector(state => state.deployment.tenants);
  const hierarchy = useSelector(state => state.deployment.hierarchy);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [modalData, setModalData] = useState({ name: '', email: '', phone: '', plan: 'Standard', status: 'Active' });

  // Access check
  if (user?.role !== 'ULTRA_SUPER_ADMIN') {
    return (
      <div style={{ marginLeft: 260, padding: 40, color: 'var(--text)' }}>
        <h2>Access Denied</h2>
        <p>You do not have the required permissions to view this system administration module.</p>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    setModalMode('add');
    setModalData({ name: '', email: '', phone: '', plan: 'Standard', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tenant) => {
    setModalMode('edit');
    setModalData(tenant);
    setIsModalOpen(true);
  };

  const handleSaveTenant = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newTenant = {
        id: `T-00${tenants.length + 1}`,
        name: modalData.name,
        email: modalData.email,
        phone: modalData.phone,
        plan: modalData.plan,
        status: 'Active'
      };
      dispatch(addTenant(newTenant));
    } else {
      dispatch(updateTenant(modalData));
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (tenantId, name) => {
    const confirmMessage = `Are you sure you want to change the status of ${name}?`;
    if (window.confirm(confirmMessage)) {
      dispatch(toggleTenantStatus(tenantId));
    }
  };

  // Filtered tenants list
  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalTenantsCount = tenants.length;
  const activeTenantsCount = tenants.filter(t => t.status === 'Active').length;
  const enterpriseCount = tenants.filter(t => t.plan === 'Enterprise').length;
  const platformMRR = activeTenantsCount * 450000; // Mock calculation based on standard rates

  return (
    <main className="tenants-main">
      <header className="tenants-header">
        <div className="tenants-title">
          <h1>Users & Tenants</h1>
          <p>Global platform governance and tenant provisioning</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAddModal}>
          + Provision Tenant
        </button>
      </header>

      {/* KPI Stats Box */}
      <div className="kpi-container">
        <div className="kpi-box">
          <div className="kpi-box-label">Total Tenants</div>
          <div className="kpi-box-value">{totalTenantsCount}</div>
          <div className="kpi-box-trend">📈 Global Scale</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-box-label">Active Tenants</div>
          <div className="kpi-box-value">{activeTenantsCount}</div>
          <div className="kpi-box-trend" style={{ color: '#2ECC71' }}>● 100% Operational</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-box-label">Enterprise Plans</div>
          <div className="kpi-box-value">{enterpriseCount}</div>
          <div className="kpi-box-trend">⚡ Dedicated Instances</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-box-label">Platform MRR</div>
          <div className="kpi-box-value">₹{(platformMRR / 100000).toFixed(1)}L</div>
          <div className="kpi-box-trend">💵 Projected Monthly</div>
        </div>
      </div>

      {/* Tenants Table Grid */}
      <div className="tenants-card">
        <div className="tenants-card-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Provisioned SaaS Tenants</h2>
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search tenant name or email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <table className="tenants-table">
          <thead>
            <tr>
              <th>Tenant ID</th>
              <th>Organization</th>
              <th>Subscription Plan</th>
              <th>Domain / Contact</th>
              <th>Clients Deployed</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map(t => {
              const clientsCount = hierarchy[t.id]?.length || 0;
              return (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>{t.id}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{t.name}</div>
                  </td>
                  <td>
                    <span className={`tier-badge ${t.plan.toLowerCase()}`}>{t.plan}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{t.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{t.phone}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{clientsCount}</td>
                  <td>
                    <span className="status-badge">
                      <span className={`status-dot ${t.status === 'Active' ? 'active' : 'suspended'}`}></span>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t.status}</span>
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ fontSize: 12, padding: '4px 8px' }}
                        onClick={() => handleOpenEditModal(t)}
                      >
                        Edit
                      </button>
                      <button 
                        className={`btn-secondary ${t.status === 'Active' ? 'btn-danger' : ''}`}
                        style={{ fontSize: 12, padding: '4px 8px', color: t.status === 'Active' ? 'var(--critical)' : '#2ECC71' }}
                        onClick={() => handleToggleStatus(t.id, t.name)}
                      >
                        {t.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Provisioning Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Provision New SaaS Tenant' : 'Edit Tenant Settings'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveTenant}>
              <div className="form-group">
                <label>Security Company Name</label>
                <input 
                  type="text" 
                  required 
                  value={modalData.name} 
                  onChange={e => setModalData({ ...modalData, name: e.target.value })} 
                  placeholder="e.g. Paramount Guard Force"
                />
              </div>
              <div className="form-group">
                <label>Primary Administrator Email</label>
                <input 
                  type="email" 
                  required 
                  value={modalData.email} 
                  onChange={e => setModalData({ ...modalData, email: e.target.value })} 
                  placeholder="e.g. admin@paramount.com"
                />
              </div>
              <div className="form-group">
                <label>Contact Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  value={modalData.phone} 
                  onChange={e => setModalData({ ...modalData, phone: e.target.value })} 
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <div className="form-group">
                <label>Subscription Tier</label>
                <select 
                  value={modalData.plan} 
                  onChange={e => setModalData({ ...modalData, plan: e.target.value })}
                >
                  <option>Basic</option>
                  <option>Standard</option>
                  <option>Full White Label</option>
                  <option>Enterprise</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Provision Instance' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
