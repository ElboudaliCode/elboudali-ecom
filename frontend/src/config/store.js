export const storeConfig = {
    name: import.meta.env.VITE_STORE_NAME || 'Elboudali Store',
    tagline: import.meta.env.VITE_STORE_TAGLINE || 'Marketplace Maroc',
    email: import.meta.env.VITE_STORE_EMAIL || 'contact@elboudali-store.com',
    phone: import.meta.env.VITE_STORE_PHONE || '+212 6 00 00 00 00',
    whatsapp: (import.meta.env.VITE_STORE_WHATSAPP || '212600000000').replace(/\D/g, ''),
    address: import.meta.env.VITE_STORE_ADDRESS || 'Casablanca, Maroc',
    legalName: import.meta.env.VITE_STORE_LEGAL_NAME || 'Elboudali Store',
    ice: import.meta.env.VITE_STORE_ICE || '',
    rc: import.meta.env.VITE_STORE_RC || '',
    supportHours: import.meta.env.VITE_STORE_SUPPORT_HOURS || 'Lun-Sam, 09:00-18:00',
};

export const whatsappUrl = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(
    `Bonjour ${storeConfig.name}, je veux plus d'informations.`
)}`;
