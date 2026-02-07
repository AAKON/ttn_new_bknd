const prisma = require('../config/database');
const { success, error } = require('../utils/response');

const submitContact = async (req, res, next) => {
  try {
    const { name, company_name, email, phone, message, interest, business_category_id, company_id } = req.body;

    await prisma.contact_messages.create({
      data: {
        name: name || null,
        company_name: company_name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
        interest: interest || null,
        business_category_id: business_category_id ? BigInt(business_category_id) : null,
        company_id: company_id ? BigInt(company_id) : null,
        lead_status: 'New',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return success(res, null, 'Message sent successfully');
  } catch (err) {
    next(err);
  }
};

const submitCompanyReport = async (req, res, next) => {
  try {
    const { company_id, name, email, phone, message } = req.body;

    await prisma.company_reports.create({
      data: {
        company_id: BigInt(company_id),
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return success(res, null, 'Report submitted successfully');
  } catch (err) {
    next(err);
  }
};

const submitCompanyEmail = async (req, res, next) => {
  try {
    const { company_id, email, subject, message } = req.body;

    await prisma.email_for_companies.create({
      data: {
        company_id: BigInt(company_id),
        email: email || null,
        subject: subject || null,
        message: message || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return success(res, null, 'Email submitted successfully');
  } catch (err) {
    next(err);
  }
};

const submitNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existing = await prisma.news_letters.findFirst({
      where: { email, deleted_at: null },
    });

    if (existing) {
      return success(res, null, 'Already subscribed');
    }

    await prisma.news_letters.create({
      data: {
        email,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return success(res, null, 'Subscribed successfully');
  } catch (err) {
    next(err);
  }
};

const submitCompanyClaim = async (req, res, next) => {
  try {
    const { company_id, message } = req.body;

    await prisma.company_claims.create({
      data: {
        company_id: BigInt(company_id),
        user_id: req.user.id,
        message: message || null,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return success(res, null, 'Claim submitted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitContact,
  submitCompanyReport,
  submitCompanyEmail,
  submitNewsletter,
  submitCompanyClaim,
};
