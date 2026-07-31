import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import './Contact.css';

const Contact = () => {
  const { t } = useLanguage();
  const whatsappNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '+1234567890';

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="contact-hero-inner container">
          <span className="contact-hero-kicker">{t('directSupport')}</span>
          <h1>{t('contactUs')}</h1>
          <p>{t('contactDesc')}</p>
        </div>
      </div>

      <div className="contact-body">
        <div className="container">
          <div className="contact-grid single">
            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi,%20I'd%20like%20to%20ask%20a%20question.`}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card whatsapp-card"
            >
              <div className="card-icon whatsapp-icon">
                <FaWhatsapp />
              </div>
              <h2>{t('whatsappChat')}</h2>
              <p>{t('whatsappDesc')}</p>
              <span className="btn contact-btn whatsapp-btn">{t('startChatting')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
