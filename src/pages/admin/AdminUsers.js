import React, { useEffect, useState } from 'react';
import { authAPI, cmsAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdminUsers.css';
import { toast } from 'react-toastify';

const ALL_PERMISSIONS = [
  { category: 'Products', perms: ['products_create', 'products_edit', 'products_delete', 'products_view'] },
  { category: 'Orders', perms: ['orders_view', 'orders_update'] },
  { category: 'Drops', perms: ['drops_create', 'drops_edit', 'drops_delete'] },
  { category: 'Coupons', perms: ['coupons_create', 'coupons_edit', 'coupons_delete'] },
  { category: 'Banners', perms: ['banners_create', 'banners_edit', 'banners_delete'] },
  { category: 'Users', perms: ['users_manage', 'analytics_view', 'logs_view'] }
];

const AdminUsers = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Creation form state
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [newAdminPermissions, setNewAdminPermissions] = useState([]);
  
  // Announcement form state
  const [announcementEn, setAnnouncementEn] = useState('');
  const [announcementAr, setAnnouncementAr] = useState('');
  
  // Hero image form state
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [mobileImagePreview, setMobileImagePreview] = useState(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  
  // Modals & UI State
  const [selectedAdminForPerms, setSelectedAdminForPerms] = useState(null);
  const [logFilter, setLogFilter] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [usersRes, logsRes, announcementRes, heroImageRes] = await Promise.all([
        authAPI.getAdminUsers(),
        authAPI.getLogs(),
        cmsAPI.getAnnouncement(),
        cmsAPI.getHeroImage()
      ]);
      setAdmins(usersRes.data);
      setLogs(logsRes.data);
      if (announcementRes.data?.value) {
        setAnnouncementEn(announcementRes.data.value.textEn || '');
        setAnnouncementAr(announcementRes.data.value.textAr || '');
      }
      if (heroImageRes.data?.value) {
        setHeroImageUrl(heroImageRes.data.value.imageUrl || '');
        setHeroImagePreview(heroImageRes.data.value.imageUrl || null);
        setMobileImageUrl(heroImageRes.data.value.mobileImageUrl || '');
        setMobileImagePreview(heroImageRes.data.value.mobileImageUrl || null);
      }
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    setActionLoading(true);
    try {
      await cmsAPI.updateAnnouncement({
        textEn: announcementEn,
        textAr: announcementAr
      });
      toast.success('Announcement text updated successfully');
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to update announcement text');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHeroImageUpload = async (e, isMobile = false) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setHeroImageUploading(true);
    try {
      const { data } = await uploadAPI.uploadImages([file]);
      const uploadedUrl = data[0]?.url;
      if (uploadedUrl) {
        if (isMobile) {
          setMobileImageUrl(uploadedUrl);
          setMobileImagePreview(uploadedUrl);
        } else {
          setHeroImageUrl(uploadedUrl);
          setHeroImagePreview(uploadedUrl);
        }
        await cmsAPI.updateHeroImage({ 
          imageUrl: isMobile ? heroImageUrl : uploadedUrl, 
          mobileImageUrl: isMobile ? uploadedUrl : mobileImageUrl 
        });
        toast.success(`${isMobile ? 'Mobile' : 'Desktop'} hero image uploaded successfully`);
      }
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to upload hero image');
    } finally {
      setHeroImageUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveHeroImage = async (isMobile = false) => {
    try {
      if (isMobile) {
        setMobileImageUrl('');
        setMobileImagePreview(null);
      } else {
        setHeroImageUrl('');
        setHeroImagePreview(null);
      }
      await cmsAPI.updateHeroImage({ 
        imageUrl: isMobile ? heroImageUrl : '', 
        mobileImageUrl: isMobile ? '' : mobileImageUrl 
      });
      toast.success(`${isMobile ? 'Mobile' : 'Desktop'} hero image removed successfully`);
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to remove hero image');
    }
  };

  const updateRole = async (id, role) => {
    try {
      await authAPI.updateUserRole(id, { role });
      toast.success('Role updated');
      loadAdminData();
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to update role');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await authAPI.updateUserStatus(id, { status });
      toast.success('Status updated');
      loadAdminData();
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to update status');
    }
  };

  const updatePermissions = async () => {
    if (!selectedAdminForPerms) return;
    try {
      await authAPI.updateUserPermissions(selectedAdminForPerms._id, { permissions: selectedAdminForPerms.permissions });
      toast.success('Permissions updated');
      setSelectedAdminForPerms(null);
      loadAdminData();
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to update permissions');
    }
  };

  const handlePermissionToggle = (perm) => {
    setSelectedAdminForPerms(prev => {
      if (!prev) return null;
      const hasPerm = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: hasPerm 
          ? prev.permissions.filter(p => p !== perm)
          : [...prev.permissions, perm]
      };
    });
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user account? This cannot be undone.')) return;
    try {
      await authAPI.deleteUser(id);
      toast.success('User deleted');
      loadAdminData();
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to delete user');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await authAPI.createAdminUser({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: newAdminRole,
        permissions: newAdminPermissions
      });
      toast.success('Admin account created');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminRole('admin');
      setNewAdminPermissions([]);
      loadAdminData();
    } catch (error) {
      toast.error(error.displayMessage || 'Unable to create admin account');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPermName = (p) => p.replace(/_/g, ' ').replace(/(^|\s)\S/g, t => t.toUpperCase());

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(logFilter.toLowerCase()) ||
    (log.actor?.name || '').toLowerCase().includes(logFilter.toLowerCase()) ||
    (log.message || '').toLowerCase().includes(logFilter.toLowerCase())
  );

  const getActionColor = (action) => {
    if (action.includes('create') || action.includes('launch') || action === 'unban_user') return 'au-badge-green';
    if (action.includes('delete') || action === 'ban_user') return 'au-badge-red';
    return 'au-badge-blue';
  };

  const canViewLogs = user?.role === 'superadmin' || user?.permissions?.includes('logs_view');
  const isSuperAdmin = user?.role === 'superadmin';

  if (!isSuperAdmin && !canViewLogs) {
    return (
      <div className="au-page au-denied">
        <div className="container">
          <div className="au-denied-box">
            <span className="au-icon-large">🔒</span>
            <h1>Access Denied</h1>
            <p>Only super admin users or users with log view permissions can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="au-page">
      <div className="container">
        
        <header className="au-header">
          <div>
            <h1>{isSuperAdmin ? 'Super Admin Control Panel' : 'Security Audit Logs'}</h1>
            <p>{isSuperAdmin ? 'Manage system roles, oversee permissions, and monitor security audit logs.' : 'Monitor system events and activities.'}</p>
          </div>
        </header>

        {/* ── Section: Announcement Bar ── */}
        {isSuperAdmin && (
          <>
            <section className="au-card">
          <div className="au-card-header">
            <span className="au-card-icon">📢</span>
            <h2>Announcement Bar Text</h2>
            <p>Modify the moving banner displayed at the top of the store.</p>
          </div>
          <div className="au-announcement-form">
            <div className="au-input-group">
              <label>English Text</label>
              <input
                type="text"
                placeholder="Free delivery for orders over 2000 EGP"
                value={announcementEn}
                onChange={(e) => setAnnouncementEn(e.target.value)}
              />
            </div>
            <div className="au-input-group au-rtl">
              <label>Arabic Text (النص العربي)</label>
              <input
                type="text"
                placeholder="توصيل مجاني للطلبات الأكثر من ٢٠٠٠ جنيه"
                value={announcementAr}
                onChange={(e) => setAnnouncementAr(e.target.value)}
              />
            </div>
<button className="btn btn-primary" onClick={handleUpdateAnnouncement} disabled={actionLoading}>
               {actionLoading ? 'Saving...' : 'Update Announcement'}
             </button>
           </div>
         </section>

{/* ── Section: Hero Image ── */}
          <section className="au-card">
            <div className="au-card-header">
              <span className="au-card-icon">🎨</span>
              <h2>Hero Image</h2>
              <p>Upload a desktop and/or mobile image to display above the main hero text on the homepage.</p>
            </div>
            <div className="au-hero-image-form">
              {heroImagePreview && (
                <div className="au-hero-image-preview">
                  <label>Desktop Preview</label>
                  <img src={heroImagePreview} alt="Desktop hero preview" />
                </div>
              )}
              {mobileImagePreview && (
                <div className="au-hero-image-preview">
                  <label>Mobile Preview</label>
                  <img src={mobileImagePreview} alt="Mobile hero preview" />
                </div>
              )}
              <div className="au-hero-image-actions">
                <div className="au-input-group">
                  <label>Upload Desktop Hero Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleHeroImageUpload(e, false)}
                    disabled={heroImageUploading}
                  />
                </div>
                {heroImagePreview && (
                  <button 
                    className="btn btn-danger au-btn-sm" 
                    onClick={() => handleRemoveHeroImage(false)}
                    disabled={heroImageUploading}
                  >
                    Remove Desktop
                  </button>
                )}
              </div>
              <div className="au-hero-image-actions">
                <div className="au-input-group">
                  <label>Upload Mobile Hero Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleHeroImageUpload(e, true)}
                    disabled={heroImageUploading}
                  />
                </div>
                {mobileImagePreview && (
                  <button 
                    className="btn btn-danger au-btn-sm" 
                    onClick={() => handleRemoveHeroImage(true)}
                    disabled={heroImageUploading}
                  >
                    Remove Mobile
                  </button>
                )}
              </div>
            </div>
          </section>

         {/* ── Section: Admin Accounts Management ── */}
        <section className="au-card">
          <div className="au-card-header">
            <span className="au-card-icon">👥</span>
            <h2>Staff & Admin Accounts</h2>
            <p>Create new administrative users and assign system privileges.</p>
          </div>
          
          <form className="au-create-form" onSubmit={handleCreateAdmin}>
            <div className="au-form-grid">
              <div className="au-input-group">
                <label>Full Name</label>
                <input required type="text" placeholder="e.g. Jane Doe" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} />
              </div>
              <div className="au-input-group">
                <label>Email Address</label>
                <input required type="email" placeholder="jane@example.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
              </div>
              <div className="au-input-group">
                <label>Password</label>
                <input required type="password" placeholder="Secure password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
              </div>
              <div className="au-input-group">
                <label>Role</label>
                <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>

            {newAdminRole !== 'customer' && (
              <div className="au-permissions-select">
                <label>Initial Permissions:</label>
                <div className="au-perm-grid">
                  {ALL_PERMISSIONS.map(({ category, perms }) => (
                    <div key={category} className="au-perm-block">
                      <strong>{category}</strong>
                      {perms.map(perm => (
                        <label key={perm} className="au-checkbox-label">
                          <input
                            type="checkbox"
                            checked={newAdminPermissions.includes(perm)}
                            onChange={(e) => {
                              if (e.target.checked) setNewAdminPermissions([...newAdminPermissions, perm]);
                              else setNewAdminPermissions(newAdminPermissions.filter(p => p !== perm));
                            }}
                          />
                          {formatPermName(perm)}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="au-form-footer">
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>

          {loading ? (
            <div className="loading">Loading accounts...</div>
          ) : (
            <div className="au-table-wrapper">
              <table className="au-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role & Status</th>
                    <th>Permissions</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin._id}>
                      <td>
                        <div className="au-user-cell">
                          <div className="au-avatar">{admin.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <strong>{admin.name}</strong>
                            <span>{admin.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="au-role-status">
                          <span className={`au-role-badge au-role-${admin.role}`}>{admin.role}</span>
                          <span className={`au-status-badge au-status-${admin.status}`}>{admin.status}</span>
                        </div>
                      </td>
                      <td>
                        {admin.role === 'superadmin' ? (
                          <span className="au-perm-all">Full Access</span>
                        ) : (
                          <button 
                            className="btn btn-outline au-btn-sm"
                            onClick={() => setSelectedAdminForPerms({ _id: admin._id, name: admin.name, permissions: [...(admin.permissions || [])] })}
                          >
                            Edit Perms ({admin.permissions?.length || 0})
                          </button>
                        )}
                      </td>
                      <td className="au-date-cell">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="au-actions">
                          <select 
                            className="au-select-sm"
                            value={admin.role} 
                            onChange={(e) => updateRole(admin._id, e.target.value)}
                            disabled={admin._id === user._id || admin.role === 'superadmin'}
                          >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="customer">Customer</option>
                          </select>
                          <select 
                            className="au-select-sm"
                            value={admin.status} 
                            onChange={(e) => updateStatus(admin._id, e.target.value)}
                            disabled={admin._id === user._id || admin.role === 'superadmin'}
                          >
                            <option value="active">Active</option>
                            <option value="held">On Hold</option>
                            <option value="banned">Banned</option>
                          </select>
                          <button 
                            className="btn btn-danger au-btn-sm au-btn-icon"
                            onClick={() => deleteUser(admin._id)}
                            disabled={admin._id === user._id || admin.role === 'superadmin'}
                            title="Delete User"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
        )}

        {/* ── Section: Audit Logs ── */}
        <section className="au-card">
          <div className="au-card-header au-flex-header">
            <div>
              <span className="au-card-icon">🛡️</span>
              <h2>Security Audit Logs</h2>
              <p>Review the last 100 system events.</p>
            </div>
            <input 
              type="text" 
              placeholder="Filter logs..." 
              className="au-search"
              value={logFilter}
              onChange={e => setLogFilter(e.target.value)}
            />
          </div>
          
          <div className="au-logs-container">
            {filteredLogs.length === 0 ? (
              <div className="au-empty">No logs match your filter.</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log._id} className="au-log-item">
                  <div className="au-log-head">
                    <span className={`au-badge ${getActionColor(log.action)}`}>
                      {formatPermName(log.action)}
                    </span>
                    <span className="au-log-time">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="au-log-body">
                    <strong>{log.message}</strong>
                    <div className="au-log-meta">
                      <span>Actor: <strong>{log.actor?.name || log.actor?.email}</strong></span>
                      {log.targetUser && <span> • Target: {log.targetUser.name || log.targetUser.email}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Permissions Modal */}
      {selectedAdminForPerms && (
        <div className="au-modal-overlay" onClick={() => setSelectedAdminForPerms(null)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <div className="au-modal-header">
              <h3>Edit Permissions</h3>
              <p>Modifying access for <strong>{selectedAdminForPerms.name}</strong></p>
            </div>
            <div className="au-modal-body">
              <div className="au-perm-grid">
                {ALL_PERMISSIONS.map(({ category, perms }) => (
                  <div key={category} className="au-perm-block">
                    <strong>{category}</strong>
                    {perms.map(perm => (
                      <label key={perm} className="au-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedAdminForPerms.permissions.includes(perm)}
                          onChange={() => handlePermissionToggle(perm)}
                        />
                        {formatPermName(perm)}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="au-modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedAdminForPerms(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updatePermissions}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;