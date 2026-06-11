export const orderStatuses = {
    pending: { label: 'En attente', variant: 'warning' },
    confirmed: { label: 'Confirmee', variant: 'success' },
    shipped: { label: 'Expediee', variant: 'info' },
    delivered: { label: 'Livree', variant: 'success' },
    cancelled: { label: 'Annulee', variant: 'danger' },
};

export const returnStatuses = {
    requested: { label: 'Demandee', variant: 'warning' },
    accepted: { label: 'Acceptee', variant: 'success' },
    refused: { label: 'Refusee', variant: 'danger' },
    refunded: { label: 'Remboursee', variant: 'info' },
};

export const getStatus = (map, key) => map[key] || { label: key || 'N/A', variant: 'secondary' };
