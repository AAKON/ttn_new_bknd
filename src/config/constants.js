const UserRoles = {
  ADMINISTRATOR: 'administrator',
  USER: 'user',
  BUYER: 'buyer',
  SELLER: 'seller',
  TALENT: 'talent',
};

const CompanyStatus = {
  CREATED_BY_ADMIN: 'created_by_admin',
  CREATED_BY_USER: 'created_by_user',
  CLAIMED: 'claimed',
};

const ProposalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const BlogStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

const ClaimStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
};

const LeadStatus = {
  NEW: 'New',
  MQL: 'MQL',
  SQL: 'SQL',
  CONVERSION: 'Conversion',
  NOT_QUALIFIED: 'Not Qualified',
};

const PricingType = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
};

const PartnerType = {
  MARKETING: 'marketing',
  B2B: 'b2b',
};

const UserStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const ProposalUnit = {
  PIECES: 'pieces',
  KG: 'kg',
  METER: 'meter',
  YARD: 'yard',
  TON: 'ton',
  LITER: 'liter',
  BOX: 'box',
  CONTAINER: 'container',
};

const ProposalCurrency = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  CNY: 'CNY',
  INR: 'INR',
  BDT: 'BDT',
  AUD: 'AUD',
  CAD: 'CAD',
  CHF: 'CHF',
};

const PaymentMethod = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  LETTER_OF_CREDIT: 'letter_of_credit',
  PAYPAL: 'paypal',
  ESCROW: 'escrow',
  CREDIT_CARD: 'credit_card',
  ADVANCE_PAYMENT: 'advance_payment',
  PAYMENT_ON_DELIVERY: 'payment_on_delivery',
  OTHER: 'other',
};

const Permissions = {
  ACCESS_DASHBOARD: 'AccessDashboard',
  ACCESS_MANAGEMENT_VIEW: 'AccessManagement-View',
  ACCESS_MANAGEMENT_EDIT: 'AccessManagement-Edit',
  USER_MANAGEMENT: 'UserManagement',
  BUSINESS_MANAGER_VIEW: 'BusinessManager-View',
  BUSINESS_MANAGER_EDIT: 'BusinessManager-Edit',
  COMPANY_VIEW: 'Company-View',
  COMPANY_EDIT: 'Company-Edit',
  BLOG_VIEW: 'Blog-View',
  BLOG_EDIT: 'Blog-Edit',
  PRICING_VIEW: 'Pricing-View',
  PRICING_EDIT: 'Pricing-Edit',
  MORE_VIEW: 'More-View',
  MORE_EDIT: 'More-Edit',
};

module.exports = {
  UserRoles,
  CompanyStatus,
  ProposalStatus,
  BlogStatus,
  ClaimStatus,
  LeadStatus,
  PricingType,
  PartnerType,
  UserStatus,
  ProposalUnit,
  ProposalCurrency,
  PaymentMethod,
  Permissions,
};
