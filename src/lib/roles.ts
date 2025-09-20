
export const USER_ROLES = ["Super Admin", "Admin", "Level-1", "Level-2", "Level-3"] as const;
export type UserRole = typeof USER_ROLES[number];

export const MAIN_TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'development', label: 'Development' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'company-profile', label: 'Company Profile' },
    { id: 'notification-templates', label: 'Notification Templates' },
    { id: 'cash-book', label: 'Cash Book' },
    { id: 'income-expenses', label: 'Income & Expenses' },
    { id: 'stocks', label: 'Stocks' },
    { id: 'staff', label: 'Staff'},
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'customers', label: 'Customers' },
    { id: 'purchase-orders', label: 'Purchase Orders' },
    { id: 'quotations', label: 'Quotations' },
    { id: 'sale-orders', label: 'Sale Orders' },
    { id: 'users', label: 'Users' },
] as const;

export type MainTab = typeof MAIN_TABS[number]['id'];

export type AuthProfile = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    accessOptions: MainTab[];
};
    
