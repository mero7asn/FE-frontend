import React, { useState, useEffect } from 'react';
import { dropAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './AdminDrops.css';

const AdminDrops = () => {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    launchDate: '',
    status: 'upcoming',
    isPublished: true
  });

  useEffect(() => {
    loadDrops();
  }, []);

  const loadDrops = async () => {
    try {
      const { data } = await dropAPI.getAll();
      setDrops(data);
    } catch (error) {
      toast.error('Failed to load drops');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (drop) => {
    setIsEditing(true);
    setEditingId(drop._id);
    
    // Format date for datetime-local input
    const date = new Date(drop.launchDate);
    const formattedDate = date.toISOString().slice(0, 16);

    setFormData({
      title: drop.title,
      description: drop.description || '',
      launchDate: formattedDate,
      status: drop.status,
      isPublished: drop.isPublished ?? true
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this drop?')) return;
    try {
      await dropAPI.delete(id);
      toast.success('Drop deleted');
      loadDrops();
    } catch (error) {
      toast.error('Failed to delete drop');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        launchDate: new Date(formData.launchDate).toISOString()
      };

      if (editingId) {
        await dropAPI.update(editingId, payload);
        toast.success('Drop updated successfully');
      } else {
        await dropAPI.create(payload);
        toast.success('Drop created successfully');
      }
      
      resetForm();
      loadDrops();
    } catch (error) {
      toast.error('Failed to save drop');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      launchDate: '',
      status: 'upcoming',
      isPublished: true
    });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-drops">
      <div className="container">
        <h1>Drops Management</h1>
        
        <div className="drops-layout">
          <div className="drops-form-container">
            <h2>{isEditing ? 'Edit Drop' : 'Schedule New Drop'}</h2>
            <form onSubmit={handleSubmit} className="drops-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Launch Date *</label>
                <input
                  type="datetime-local"
                  value={formData.launchDate}
                  onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="sold-out">Sold Out</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Drop' : 'Schedule Drop'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="btn btn-outline">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="drops-list-container">
            <h2>Active and Upcoming Drops</h2>
            {drops.length === 0 ? (
              <p className="no-drops">No drops scheduled yet.</p>
            ) : (
              <div className="drops-list">
                {drops.map((drop) => (
                  <div key={drop._id} className={`drop-item-card ${drop.status}`}>
                    <div className="drop-item-header">
                      <h3>{drop.title}</h3>
                      <span className={`status-tag ${drop.status}`}>{drop.status}</span>
                    </div>
                    <p className="drop-date">
                      Launch: {new Date(drop.launchDate).toLocaleString()}
                    </p>
                    {drop.description && <p className="drop-desc">{drop.description}</p>}
                    
                    <div className="drop-item-actions">
                      <button onClick={() => handleEdit(drop)} className="btn-edit-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(drop._id)} className="btn-delete-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDrops;
