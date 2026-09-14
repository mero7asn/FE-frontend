import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { settingAPI } from '../services/api';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const [workModel, setWorkModel] = useState('whatsapp'); // 'whatsapp' | 'card_checkout'
  const [publicSettings, setPublicSettings] = useState({
    workModel: 'whatsapp',
    activeGateway: 'paymob',
    enableCOD: true,
    currency: 'EGP',
    shippingRate: 75,
    freeShippingThreshold: 2000
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await settingAPI.getPublicSettings();
      if (data) {
        setPublicSettings(data);
        if (data.workModel) {
          setWorkModel(data.workModel);
        }
      }
    } catch (err) {
      console.warn('Failed to load store public settings, falling back to defaults:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = {
    workModel,
    isCardModel: workModel === 'card_checkout',
    isWhatsAppModel: workModel === 'whatsapp',
    settings: publicSettings,
    loadingSettings: loading,
    refreshSettings: fetchSettings,
    setWorkModelDirect: (newModel) => setWorkModel(newModel)
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
