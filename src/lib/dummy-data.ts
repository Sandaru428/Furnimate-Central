
export const initialCustomersData = [
  { id: 'CUST-001', name: 'Modern Designs LLC', email: 'contact@moderndesigns.com', phone: '555-111-2222' },
  { id: 'CUST-002', name: 'Home Comforts', email: 'support@homecomforts.net', phone: '555-333-4444' },
  { id: 'CUST-003', name: 'Urban Decor', email: 'hello@urbandecor.io', phone: '555-777-8888' },
  { id: 'CUST-004', name: 'Emily Davis', email: 'emily.d@email.com', phone: '555-555-6666' },
  { id: 'CUST-005', name: 'Johnathon Smith', email: 'j.smith@inbox.com', phone: '555-999-0000' },
];

export const initialSuppliersData = [
  { id: 'SUP-001', name: 'Timber Co.', contact: 'John Doe, 555-123-4567' },
  { id: 'SUP-002', name: 'Fabric Solutions', contact: 'Jane Smith, 555-987-6543' },
  { id: 'SUP-003', name: 'MetalWorks Inc.', contact: 'Bob Johnson, 555-456-7890' },
  { id: 'SUP-004', name: 'Finishing Touches', contact: 'Alice Williams, 555-321-9876' },
];

export const initialMasterData = [
  // Raw Materials
  { itemCode: 'WD-001', name: 'Oak Wood Plank', type: 'Raw Material', unitPrice: 25.00, stockLevel: 150 },
  { itemCode: 'FBR-003', name: 'Linen Fabric', type: 'Raw Material', unitPrice: 15.50, stockLevel: 300 },
  { itemCode: 'MTL-002', name: 'Steel Frame', type: 'Raw Material', unitPrice: 55.00, stockLevel: 80 },
  { itemCode: 'FNS-010', name: 'Matte Varnish', type: 'Raw Material', unitPrice: 12.00, stockLevel: 200 },
  { itemCode: 'WD-002', name: 'Walnut Plank', type: 'Raw Material', unitPrice: 35.00, stockLevel: 120 },

  // Finished Goods
  { itemCode: 'CH-001', name: 'Classic Oak Chair', type: 'Finished Good', unitPrice: 150.00, stockLevel: 50 },
  { itemCode: 'TBL-001', name: 'Modern Steel Desk', type: 'Finished Good', unitPrice: 450.00, stockLevel: 20 },
  { itemCode: 'SOF-001', name: 'Linen Sofa', type: 'Finished Good', unitPrice: 850.00, stockLevel: 15 },
  { itemCode: 'TBL-002', name: 'Walnut Coffee Table', type: 'Finished Good', unitPrice: 320.00, stockLevel: 30 },
];

export const initialPurchaseOrdersData = [
  {
    id: 'PO-001', supplierName: 'Timber Co.', date: '2024-05-10', totalAmount: 750, status: 'Paid',
    lineItems: [{ itemId: 'WD-001', quantity: 30, unitPrice: 25, totalValue: 750 }],
  },
  {
    id: 'PO-002', supplierName: 'Fabric Solutions', date: '2024-05-15', totalAmount: 775, status: 'Fulfilled',
    lineItems: [{ itemId: 'FBR-003', quantity: 50, unitPrice: 15.50, totalValue: 775 }],
  },
  {
    id: 'PO-003', supplierName: 'MetalWorks Inc.', date: '2024-06-02', totalAmount: 2200, status: 'Sent',
    lineItems: [{ itemId: 'MTL-002', quantity: 40, unitPrice: 55, totalValue: 2200 }],
  },
  {
    id: 'PO-004', supplierName: 'Timber Co.', date: '2024-06-20', totalAmount: 0, status: 'Draft',
    lineItems: [{ itemId: 'WD-002', quantity: 20 }],
  },
];

export const initialQuotationsData = [
  {
    id: 'QUO-001', customer: 'Modern Designs LLC', date: '2024-05-01', amount: 3000.00, status: 'Converted',
    lineItems: [{ itemId: 'CH-001', quantity: 20, unitPrice: 150, totalValue: 3000 }],
  },
  {
    id: 'QUO-002', customer: 'Home Comforts', date: '2024-05-18', amount: 850.00, status: 'Approved',
    lineItems: [{ itemId: 'SOF-001', quantity: 1, unitPrice: 850, totalValue: 850 }],
  },
  {
    id: 'QUO-003', customer: 'Urban Decor', date: '2024-06-05', amount: 1350.00, status: 'Sent',
    lineItems: [{ itemId: 'TBL-001', quantity: 3, unitPrice: 450, totalValue: 1350 }],
  },
  {
    id: 'QUO-004', customer: 'Johnathon Smith', date: '2024-06-22', amount: 640.00, status: 'Draft',
    lineItems: [{ itemId: 'TBL-002', quantity: 2, unitPrice: 320, totalValue: 640 }],
  },
];

export const initialSaleOrdersData = [
  {
    id: 'ORD-001', customer: 'Modern Designs LLC', date: '2024-05-06', amount: 3000.00, status: 'Paid', quotationId: 'QUO-001',
  },
];

export const initialPaymentsData = [
    // Expenses (from POs)
    { id: 'PAY-001', orderId: 'PO-001', date: '2024-05-20', amount: 750, method: 'Online', details: 'From City Bank to Supplier Bank', type: 'expense', description: 'Payment for PO-001' },
    // Incomes (from SOs)
    { id: 'PAY-002', orderId: 'ORD-001', date: '2024-05-15', amount: 1500, method: 'Card', details: 'Card ending in 1234', type: 'income', description: 'Payment for ORD-001' },
    { id: 'PAY-003', orderId: 'ORD-001', date: '2024-06-01', amount: 1500, method: 'Cheque', details: 'National Bank, #54321, dated 2024-06-01', type: 'income', description: 'Payment for ORD-001' },
    // Ad-hoc expenses
    { id: 'PAY-ADHOC-1', date: '2024-06-01', amount: 1200, method: 'Online', details: 'Ad-hoc expense', type: 'expense', description: 'June Office Rent' },
    { id: 'PAY-ADHOC-2', date: '2024-06-05', amount: 85, method: 'Cash', details: 'Ad-hoc expense', type: 'expense', description: 'Office Supplies' },
];
