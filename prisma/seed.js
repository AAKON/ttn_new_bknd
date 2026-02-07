const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const now = new Date();

async function seedPermissions() {
  const permissionNames = [
    'AccessDashboard',
    'AccessManagement-View',
    'AccessManagement-Edit',
    'UserManagement',
    'BusinessManager-View',
    'BusinessManager-Edit',
    'Company-View',
    'Company-Edit',
    'Blog-View',
    'Blog-Edit',
    'Pricing-View',
    'Pricing-Edit',
    'More-View',
    'More-Edit',
  ];

  for (const name of permissionNames) {
    await prisma.permissions.upsert({
      where: { name_guard_name: { name, guard_name: 'web' } },
      update: {},
      create: { name, guard_name: 'web', created_at: now, updated_at: now },
    });
  }
  console.log('  Permissions seeded (14)');
}

async function seedRoles() {
  const roleNames = ['administrator', 'user', 'buyer', 'seller', 'talent'];

  for (const name of roleNames) {
    await prisma.roles.upsert({
      where: { name_guard_name: { name, guard_name: 'web' } },
      update: {},
      create: { name, guard_name: 'web', created_at: now, updated_at: now },
    });
  }

  // Assign all permissions to administrator role
  const adminRole = await prisma.roles.findFirst({ where: { name: 'administrator' } });
  const allPermissions = await prisma.permissions.findMany();

  for (const perm of allPermissions) {
    try {
      await prisma.role_has_permissions.create({
        data: { role_id: adminRole.id, permission_id: perm.id },
      });
    } catch {
      // Already exists
    }
  }
  console.log('  Roles seeded (5) + admin permissions assigned');
}

async function seedUsers() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = [
    { first_name: 'Mr.', last_name: 'Admin', email: 'admin@admin.com', status: 'approved' },
    { first_name: 'John', last_name: 'Buyer', email: 'buyer@ttn.com', status: 'approved' },
    { first_name: 'Sarah', last_name: 'Seller', email: 'seller@ttn.com', status: 'approved' },
    { first_name: 'Mike', last_name: 'Talent', email: 'talent@ttn.com', status: 'approved' },
    { first_name: 'Jane', last_name: 'Doe', email: 'jane@ttn.com', status: 'approved' },
    { first_name: 'Ali', last_name: 'Khan', email: 'ali@ttn.com', status: 'approved' },
    { first_name: 'Emily', last_name: 'Chen', email: 'emily@ttn.com', status: 'pending' },
  ];

  const roleMap = {
    'admin@admin.com': 'administrator',
    'buyer@ttn.com': 'buyer',
    'seller@ttn.com': 'seller',
    'talent@ttn.com': 'talent',
    'jane@ttn.com': 'buyer',
    'ali@ttn.com': 'seller',
    'emily@ttn.com': 'user',
  };

  for (const u of users) {
    let user = await prisma.users.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.users.create({
        data: {
          uuid: uuidv4(),
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          password: hashedPassword,
          status: u.status,
          email_verified_at: u.status === 'approved' ? now : null,
          created_at: now,
          updated_at: now,
        },
      });
    }

    const roleName = roleMap[u.email];
    const role = await prisma.roles.findFirst({ where: { name: roleName } });
    if (role) {
      try {
        await prisma.$queryRawUnsafe(
          `INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`,
          role.id, user.id
        );
      } catch { /* Already exists */ }
    }
  }
  console.log('  Users seeded (7) + roles assigned');
}

async function seedLocations() {
  const existing = await prisma.locations.count();
  if (existing > 0) {
    console.log(`  Locations already exist (${existing}), skipping`);
    return;
  }

  const countries = {
    "AD": "Andorra", "AE": "United Arab Emirates", "AF": "Afghanistan",
    "AG": "Antigua and Barbuda", "AI": "Anguilla", "AL": "Albania",
    "AM": "Armenia", "AO": "Angola", "AQ": "Antarctica", "AR": "Argentina",
    "AS": "American Samoa", "AT": "Austria", "AU": "Australia", "AW": "Aruba",
    "AZ": "Azerbaijan", "BA": "Bosnia and Herzegovina", "BB": "Barbados",
    "BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria",
    "BH": "Bahrain", "BI": "Burundi", "BJ": "Benin", "BM": "Bermuda",
    "BN": "Brunei Darussalam", "BO": "Bolivia", "BR": "Brazil", "BS": "Bahamas",
    "BT": "Bhutan", "BW": "Botswana", "BY": "Belarus", "BZ": "Belize",
    "CA": "Canada", "CD": "Congo, Democratic Republic", "CF": "Central African Republic",
    "CG": "Republic of the Congo", "CH": "Switzerland", "CI": "Ivory Coast",
    "CK": "Cook Islands", "CL": "Chile", "CM": "Cameroon", "CN": "China",
    "CO": "Colombia", "CR": "Costa Rica", "CU": "Cuba", "CV": "Cape Verde",
    "CY": "Cyprus", "CZ": "Czech Republic", "DE": "Germany", "DJ": "Djibouti",
    "DK": "Denmark", "DM": "Dominica", "DO": "Dominican Republic", "DZ": "Algeria",
    "EC": "Ecuador", "EE": "Estonia", "EG": "Egypt", "ER": "Eritrea",
    "ES": "Spain", "ET": "Ethiopia", "FI": "Finland", "FJ": "Fiji",
    "FM": "Micronesia", "FR": "France", "GA": "Gabon", "GB": "United Kingdom",
    "GD": "Grenada", "GE": "Georgia", "GH": "Ghana", "GR": "Greece",
    "GT": "Guatemala", "GN": "Guinea", "GY": "Guyana", "HK": "Hong Kong",
    "HN": "Honduras", "HR": "Croatia", "HT": "Haiti", "HU": "Hungary",
    "ID": "Indonesia", "IE": "Ireland", "IL": "Israel", "IN": "India",
    "IQ": "Iraq", "IR": "Iran", "IS": "Iceland", "IT": "Italy",
    "JM": "Jamaica", "JO": "Jordan", "JP": "Japan", "KE": "Kenya",
    "KG": "Kyrgyzstan", "KH": "Cambodia", "KR": "South Korea", "KW": "Kuwait",
    "KZ": "Kazakhstan", "LA": "Laos", "LB": "Lebanon", "LK": "Sri Lanka",
    "LR": "Liberia", "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia",
    "LY": "Libya", "MA": "Morocco", "MD": "Moldova", "ME": "Montenegro",
    "MG": "Madagascar", "MK": "North Macedonia", "ML": "Mali", "MM": "Myanmar",
    "MN": "Mongolia", "MX": "Mexico", "MY": "Malaysia", "MZ": "Mozambique",
    "NA": "Namibia", "NG": "Nigeria", "NI": "Nicaragua", "NL": "Netherlands",
    "NO": "Norway", "NP": "Nepal", "NZ": "New Zealand", "OM": "Oman",
    "PA": "Panama", "PE": "Peru", "PG": "Papua New Guinea", "PH": "Philippines",
    "PK": "Pakistan", "PL": "Poland", "PT": "Portugal", "PY": "Paraguay",
    "QA": "Qatar", "RO": "Romania", "RS": "Serbia", "RU": "Russian Federation",
    "RW": "Rwanda", "SA": "Saudi Arabia", "SD": "Sudan", "SE": "Sweden",
    "SG": "Singapore", "SI": "Slovenia", "SK": "Slovakia", "SN": "Senegal",
    "SO": "Somalia", "TH": "Thailand", "TJ": "Tajikistan", "TN": "Tunisia",
    "TO": "Tonga", "TR": "Turkey", "TT": "Trinidad and Tobago", "TW": "Taiwan",
    "TZ": "Tanzania", "UA": "Ukraine", "UG": "Uganda", "US": "United States",
    "UY": "Uruguay", "UZ": "Uzbekistan", "VE": "Venezuela", "VN": "Vietnam",
    "ZA": "South Africa", "ZM": "Zambia", "ZW": "Zimbabwe",
  };

  const data = Object.entries(countries).map(([code, name]) => ({
    name,
    country_code: code,
    phone_code: null,
    flag_path: `flag/${code.toLowerCase()}.png`,
    created_at: now,
    updated_at: now,
  }));

  await prisma.locations.createMany({ data });
  console.log(`  Locations seeded (${data.length})`);
}

async function seedBusinessCategories() {
  const categories = [
    'Apparel & Garments',
    'Textiles & Fabrics',
    'Home Textiles',
    'Yarn & Fiber',
    'Denim',
    'Knitting & Hosiery',
    'Dyeing & Finishing',
    'Printing',
    'Accessories & Trims',
    'Leather & Footwear',
    'Non-Woven',
    'Technical Textiles',
    'Sustainable & Organic',
    'Packaging',
    'Machinery & Equipment',
  ];

  for (const name of categories) {
    const exists = await prisma.business_categories.findFirst({ where: { name } });
    if (!exists) {
      await prisma.business_categories.create({
        data: { name, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Business categories seeded (${categories.length})`);
}

async function seedBusinessTypes() {
  const types = [
    'Manufacturer',
    'Supplier',
    'Exporter',
    'Importer',
    'Wholesaler',
    'Retailer',
    'Trading Company',
    'Agent',
    'Buying House',
    'Service Provider',
  ];

  for (const name of types) {
    const exists = await prisma.business_types.findFirst({ where: { name } });
    if (!exists) {
      await prisma.business_types.create({
        data: { name, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Business types seeded (${types.length})`);
}

async function seedCertificates() {
  const certs = [
    'ISO 9001',
    'ISO 14001',
    'OEKO-TEX Standard 100',
    'GOTS (Global Organic Textile Standard)',
    'BSCI',
    'WRAP',
    'Sedex/SMETA',
    'SA8000',
    'GRS (Global Recycle Standard)',
    'BCI (Better Cotton Initiative)',
    'Fair Trade',
    'Bluesign',
  ];

  for (const name of certs) {
    const exists = await prisma.certificates.findFirst({ where: { name } });
    if (!exists) {
      await prisma.certificates.create({
        data: { name, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Certificates seeded (${certs.length})`);
}

async function seedProductCategories() {
  const categories = [
    'T-Shirts',
    'Polo Shirts',
    'Shirts',
    'Trousers & Pants',
    'Jeans & Denim',
    'Jackets & Outerwear',
    'Sweaters & Knitwear',
    'Activewear & Sportswear',
    'Underwear & Innerwear',
    'Socks & Hosiery',
    'Bed Linen',
    'Towels',
    'Curtains & Drapes',
    'Woven Fabrics',
    'Knitted Fabrics',
    'Cotton Yarn',
    'Synthetic Yarn',
    'Blended Yarn',
    'Zippers & Buttons',
    'Labels & Tags',
    'Packaging Materials',
    'Safety & Workwear',
  ];

  for (const name of categories) {
    const exists = await prisma.product_categories.findFirst({ where: { name } });
    if (!exists) {
      await prisma.product_categories.create({
        data: { name, product_count: 0, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Product categories seeded (${categories.length})`);
}

async function seedBlogTypes() {
  const types = [
    'Industry News',
    'Trends & Fashion',
    'Sustainability',
    'Technology',
    'Business Tips',
    'How-To Guides',
    'Case Studies',
    'Events',
  ];

  for (const name of types) {
    const exists = await prisma.blog_types.findFirst({ where: { name } });
    if (!exists) {
      await prisma.blog_types.create({
        data: { name, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Blog types seeded (${types.length})`);
}

async function seedCompliances() {
  const complianceNames = [
    'GDPR',
    'REACH',
    'CPSIA',
    'PROP 65',
    'AZO Free',
    'Formaldehyde Free',
    'Phthalate Free',
    'RoHS',
    'CPSC',
    'EN 71',
  ];

  for (const name of complianceNames) {
    const exists = await prisma.compliances.findFirst({ where: { name } });
    if (!exists) {
      await prisma.compliances.create({
        data: { name, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Compliances seeded (${complianceNames.length})`);
}

async function seedPricingPlans() {
  const plans = [
    {
      title: 'Basic',
      price: '0',
      bt_short_text: 'For small businesses getting started',
      type: 'monthly',
      benefits: JSON.stringify(['Company listing', 'Basic profile', '1 product listing', 'Email support']),
      services: JSON.stringify(['Company directory listing', 'Basic analytics']),
    },
    {
      title: 'Professional',
      price: '49',
      bt_short_text: 'For growing businesses',
      type: 'monthly',
      benefits: JSON.stringify(['Enhanced listing', 'Unlimited products', 'Priority in search', 'Sourcing proposals', 'Phone support', 'Analytics dashboard']),
      services: JSON.stringify(['Featured company listing', 'Advanced analytics', 'Lead generation tools', 'Priority customer support']),
    },
    {
      title: 'Enterprise',
      price: '149',
      bt_short_text: 'For large-scale operations',
      type: 'monthly',
      benefits: JSON.stringify(['Top placement', 'Unlimited everything', 'Dedicated account manager', 'Custom branding', 'API access', 'White-label solutions', 'Bulk operations']),
      services: JSON.stringify(['Premium placement', 'Full analytics suite', 'Custom integrations', 'Dedicated support team', 'Marketing campaigns', 'Verified badge']),
    },
    {
      title: 'Basic Annual',
      price: '0',
      bt_short_text: 'Free tier, billed annually',
      type: 'annual',
      benefits: JSON.stringify(['Company listing', 'Basic profile', '1 product listing', 'Email support']),
      services: JSON.stringify(['Company directory listing', 'Basic analytics']),
    },
    {
      title: 'Professional Annual',
      price: '470',
      bt_short_text: 'Save 20% with annual billing',
      type: 'annual',
      benefits: JSON.stringify(['Enhanced listing', 'Unlimited products', 'Priority in search', 'Sourcing proposals', 'Phone support', 'Analytics dashboard']),
      services: JSON.stringify(['Featured company listing', 'Advanced analytics', 'Lead generation tools', 'Priority customer support']),
    },
    {
      title: 'Enterprise Annual',
      price: '1430',
      bt_short_text: 'Save 20% with annual billing',
      type: 'annual',
      benefits: JSON.stringify(['Top placement', 'Unlimited everything', 'Dedicated account manager', 'Custom branding', 'API access', 'White-label solutions', 'Bulk operations']),
      services: JSON.stringify(['Premium placement', 'Full analytics suite', 'Custom integrations', 'Dedicated support team', 'Marketing campaigns', 'Verified badge']),
    },
  ];

  const existingCount = await prisma.pricings.count();
  if (existingCount > 0) {
    console.log(`  Pricing plans already exist (${existingCount}), skipping`);
    return;
  }

  for (const plan of plans) {
    await prisma.pricings.create({
      data: { ...plan, created_at: now, updated_at: now },
    });
  }
  console.log(`  Pricing plans seeded (${plans.length})`);
}

async function seedAbout() {
  const existing = await prisma.abouts.count();
  if (existing > 0) {
    console.log('  About already exists, skipping');
    return;
  }

  await prisma.abouts.create({
    data: {
      description: 'The Textile Network (TTN) is a leading B2B marketplace connecting textile manufacturers, suppliers, and buyers worldwide. Our platform enables businesses to discover verified partners, source quality products, and grow their global network in the textile and apparel industry.',
      partners: '500+',
      countries: '50+',
      listed_business: '2000+',
      factory_people: '100K+',
      global_audience: '1M+',
      mission: 'To connect the global textile industry through technology, making it easier for businesses of all sizes to find reliable partners and grow their trade.',
      vision: 'To become the world\'s largest and most trusted B2B textile network, driving transparency and efficiency across the entire textile supply chain.',
      created_at: now,
      updated_at: now,
    },
  });
  console.log('  About page seeded');
}

async function seedTeam() {
  const members = [
    { name: 'Ahmed Hassan', email: 'ahmed@ttn.com', designation: 'CEO & Founder' },
    { name: 'Sarah Williams', email: 'sarah.w@ttn.com', designation: 'Head of Operations' },
    { name: 'David Chen', email: 'david@ttn.com', designation: 'CTO' },
    { name: 'Fatima Zahra', email: 'fatima@ttn.com', designation: 'Head of Business Development' },
    { name: 'Raj Patel', email: 'raj@ttn.com', designation: 'Lead Designer' },
    { name: 'Maria Garcia', email: 'maria@ttn.com', designation: 'Marketing Manager' },
  ];

  for (const member of members) {
    const exists = await prisma.our_teams.findUnique({ where: { email: member.email } });
    if (!exists) {
      await prisma.our_teams.create({
        data: { ...member, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Team members seeded (${members.length})`);
}

async function seedPartners() {
  const existing = await prisma.partners.count();
  if (existing > 0) {
    console.log(`  Partners already exist (${existing}), skipping`);
    return;
  }

  const partners = [
    { link: 'https://example.com/partner1', type: 'marketing' },
    { link: 'https://example.com/partner2', type: 'marketing' },
    { link: 'https://example.com/partner3', type: 'marketing' },
    { link: 'https://example.com/partner4', type: 'b2b' },
    { link: 'https://example.com/partner5', type: 'b2b' },
    { link: 'https://example.com/partner6', type: 'b2b' },
  ];

  for (const partner of partners) {
    await prisma.partners.create({
      data: { ...partner, created_at: now, updated_at: now },
    });
  }
  console.log(`  Partners seeded (${partners.length})`);
}

async function seedSiteSettings() {
  const settings = [
    { key: 'terms_and_conditions', value: '<h2>Terms and Conditions</h2><p>Welcome to The Textile Network. By using our platform, you agree to these terms and conditions.</p><h3>1. Use of Service</h3><p>The Textile Network provides a B2B marketplace for the textile industry. You must be at least 18 years old and represent a legitimate business to use our services.</p><h3>2. Account Registration</h3><p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p><h3>3. Company Listings</h3><p>All company information must be accurate and up-to-date. We reserve the right to remove listings that violate our policies.</p><h3>4. Privacy</h3><p>Your privacy is important to us. Please review our Privacy Policy for details on how we collect and use your information.</p><h3>5. Limitation of Liability</h3><p>The Textile Network is not responsible for any transactions between buyers and sellers. We provide the platform but do not guarantee the quality of products or services offered.</p>' },
    { key: 'privacy_policy', value: '<h2>Privacy Policy</h2><p>This Privacy Policy describes how The Textile Network collects, uses, and protects your personal information.</p>' },
  ];

  for (const setting of settings) {
    const exists = await prisma.site_settings.findUnique({ where: { key: setting.key } });
    if (!exists) {
      await prisma.site_settings.create({
        data: { ...setting, created_at: now, updated_at: now },
      });
    }
  }
  console.log(`  Site settings seeded (${settings.length})`);
}

async function seedBlogs() {
  const existingCount = await prisma.blogs.count();
  if (existingCount > 0) {
    console.log(`  Blogs already exist (${existingCount}), skipping`);
    return;
  }

  const blogs = [
    {
      title: 'The Future of Sustainable Textiles in 2025',
      slug: 'future-of-sustainable-textiles-2025',
      author: 'Ahmed Hassan',
      short_description: 'Exploring how sustainability is reshaping the textile industry and what manufacturers need to know to stay competitive.',
      content: '<p>The textile industry is undergoing a massive transformation driven by sustainability concerns. From organic cotton to recycled polyester, manufacturers are finding innovative ways to reduce their environmental footprint.</p><h2>Key Trends</h2><ul><li>Circular fashion and closed-loop manufacturing</li><li>Bio-based and biodegradable materials</li><li>Water-saving dyeing technologies</li><li>Blockchain for supply chain transparency</li></ul><p>Companies that embrace these changes early will have a significant competitive advantage in the coming years.</p>',
      status: 'published',
      is_featured: true,
      meta_title: 'Future of Sustainable Textiles | TTN Blog',
      meta_description: 'Learn about the latest sustainability trends in the textile industry.',
      meta_keywords: 'sustainable textiles, eco-friendly, organic cotton, recycled polyester',
    },
    {
      title: 'How to Choose the Right Textile Supplier',
      slug: 'how-to-choose-right-textile-supplier',
      author: 'Sarah Williams',
      short_description: 'A comprehensive guide for buyers looking to find reliable and quality-focused textile suppliers for their business.',
      content: '<p>Finding the right textile supplier is crucial for any fashion or textile business. Here are the key factors to consider when evaluating potential partners.</p><h2>1. Quality Standards</h2><p>Always request samples before placing large orders. Check for certifications like ISO 9001 and OEKO-TEX.</p><h2>2. Production Capacity</h2><p>Ensure the supplier can handle your order volumes, both current and projected growth.</p><h2>3. Communication</h2><p>Responsive and clear communication is essential for a successful partnership.</p><h2>4. Compliance</h2><p>Verify that the supplier meets all relevant labor and environmental regulations.</p>',
      status: 'published',
      is_featured: true,
      meta_title: 'Choose the Right Textile Supplier | TTN Blog',
      meta_description: 'Guide to selecting reliable textile suppliers for your business.',
      meta_keywords: 'textile supplier, sourcing, quality, manufacturing partner',
    },
    {
      title: 'Digital Transformation in Textile Manufacturing',
      slug: 'digital-transformation-textile-manufacturing',
      author: 'David Chen',
      short_description: 'How Industry 4.0 technologies are revolutionizing textile production processes worldwide.',
      content: '<p>The textile industry is embracing digital transformation at an unprecedented pace. From AI-powered quality control to IoT-enabled supply chains, technology is reshaping every aspect of production.</p><h2>Smart Manufacturing</h2><p>Automated looms, robotic cutting systems, and AI-driven pattern matching are increasing efficiency while reducing waste.</p><h2>Supply Chain Visibility</h2><p>Real-time tracking and data analytics are giving brands unprecedented visibility into their supply chains.</p>',
      status: 'published',
      is_featured: false,
      meta_title: 'Digital Transformation in Textiles | TTN Blog',
      meta_description: 'Industry 4.0 technologies in textile manufacturing.',
      meta_keywords: 'digital transformation, Industry 4.0, smart manufacturing, textile technology',
    },
    {
      title: 'Understanding Textile Certifications: A Complete Guide',
      slug: 'understanding-textile-certifications-guide',
      author: 'Fatima Zahra',
      short_description: 'Breaking down the most important textile certifications and what they mean for manufacturers and buyers.',
      content: '<p>Textile certifications play a vital role in ensuring product quality, safety, and sustainability. Here is a breakdown of the most important ones.</p><h2>OEKO-TEX Standard 100</h2><p>Tests for harmful substances in textiles at every stage of production.</p><h2>GOTS</h2><p>The Global Organic Textile Standard ensures organic status from harvesting through manufacturing.</p><h2>BSCI</h2><p>Business Social Compliance Initiative focuses on improving working conditions in global supply chains.</p>',
      status: 'published',
      is_featured: false,
      meta_title: 'Textile Certifications Guide | TTN Blog',
      meta_description: 'Complete guide to textile industry certifications.',
      meta_keywords: 'OEKO-TEX, GOTS, BSCI, textile certifications, compliance',
    },
    {
      title: 'Top 10 Textile Trade Shows to Attend',
      slug: 'top-10-textile-trade-shows',
      author: 'Maria Garcia',
      short_description: 'Planning your trade show calendar? Here are the must-attend events for textile professionals.',
      content: '<p>Trade shows remain one of the best ways to discover new suppliers, trends, and technologies in the textile industry.</p><h2>Must-Attend Events</h2><ol><li>Texworld Paris</li><li>Premiere Vision</li><li>ITMA</li><li>Intertextile Shanghai</li><li>Heimtextil Frankfurt</li><li>Colombiatex</li><li>Bangladesh Denim Expo</li><li>Techtextil</li><li>India International Garment Fair</li><li>Magic Las Vegas</li></ol>',
      status: 'published',
      is_featured: true,
      meta_title: 'Top Textile Trade Shows | TTN Blog',
      meta_description: 'The best textile trade shows and events to attend.',
      meta_keywords: 'trade shows, textile events, Texworld, Premiere Vision, ITMA',
    },
    {
      title: 'Draft: Upcoming Features on TTN Platform',
      slug: 'upcoming-features-ttn-platform',
      author: 'David Chen',
      short_description: 'A sneak peek at the new features coming to The Textile Network platform.',
      content: '<p>We are excited to share some upcoming features that will enhance your experience on TTN.</p><p>Draft content - to be published soon.</p>',
      status: 'draft',
      is_featured: false,
      meta_title: 'Upcoming TTN Features',
      meta_description: 'New features coming to The Textile Network.',
      meta_keywords: 'TTN features, platform updates',
    },
  ];

  const blogTypes = await prisma.blog_types.findMany();

  for (let i = 0; i < blogs.length; i++) {
    const blog = await prisma.blogs.create({
      data: { ...blogs[i], created_at: now, updated_at: now },
    });

    // Assign 1-2 blog types to each blog
    if (blogTypes.length > 0) {
      const typeIndex = i % blogTypes.length;
      await prisma.blog_blog_types.create({
        data: { blog_id: blog.id, blog_type_id: blogTypes[typeIndex].id, created_at: now, updated_at: now },
      });
      if (i % 2 === 0 && blogTypes.length > 1) {
        const secondIndex = (typeIndex + 1) % blogTypes.length;
        await prisma.blog_blog_types.create({
          data: { blog_id: blog.id, blog_type_id: blogTypes[secondIndex].id, created_at: now, updated_at: now },
        });
      }
    }
  }
  console.log(`  Blogs seeded (${blogs.length}) with type assignments`);
}

async function seedCompanies() {
  const existingCount = await prisma.companies.count();
  if (existingCount > 0) {
    console.log(`  Companies already exist (${existingCount}), skipping`);
    return;
  }

  const seller = await prisma.users.findUnique({ where: { email: 'seller@ttn.com' } });
  const ali = await prisma.users.findUnique({ where: { email: 'ali@ttn.com' } });
  const admin = await prisma.users.findUnique({ where: { email: 'admin@admin.com' } });
  if (!seller || !ali || !admin) {
    console.log('  Skipping companies - required users not found');
    return;
  }

  const categories = await prisma.business_categories.findMany({ take: 5 });
  const locations = await prisma.locations.findMany({
    where: { country_code: { in: ['BD', 'CN', 'IN', 'TR', 'PK', 'VN'] } },
  });

  if (locations.length === 0 || categories.length === 0) {
    console.log('  Skipping companies - no locations or categories');
    return;
  }

  const companies = [
    {
      user_id: seller.id, created_by: seller.id, name: 'Dhaka Textile Mills',
      slug: 'dhaka-textile-mills', status: 'created_by_user',
      location_id: locations.find(l => l.country_code === 'BD')?.id || locations[0].id,
      business_category_id: categories[0]?.id,
      manpower: '500-1000', moto: 'Quality textiles from Bangladesh',
      about: 'Dhaka Textile Mills is a leading manufacturer of high-quality cotton and blended fabrics based in Dhaka, Bangladesh. With over 20 years of experience, we supply to major brands worldwide.',
      keywords: 'cotton,fabrics,textiles,bangladesh,woven',
      tags: 'cotton,woven,export',
    },
    {
      user_id: seller.id, created_by: seller.id, name: 'Shanghai Fabric Co.',
      slug: 'shanghai-fabric-co', status: 'created_by_user',
      location_id: locations.find(l => l.country_code === 'CN')?.id || locations[0].id,
      business_category_id: categories[1]?.id,
      manpower: '1000-5000', moto: 'Premium fabrics from China',
      about: 'Shanghai Fabric Co. specializes in producing premium synthetic and blended fabrics for the global fashion industry. Our state-of-the-art facility ensures consistent quality.',
      keywords: 'synthetic,fabrics,polyester,nylon,china',
      tags: 'synthetic,polyester,premium',
    },
    {
      user_id: ali.id, created_by: ali.id, name: 'Mumbai Garments International',
      slug: 'mumbai-garments-international', status: 'created_by_user',
      location_id: locations.find(l => l.country_code === 'IN')?.id || locations[0].id,
      business_category_id: categories[0]?.id,
      manpower: '200-500', moto: 'Sustainable fashion from India',
      about: 'Mumbai Garments International is a vertically integrated garment manufacturer focused on sustainable and organic clothing. We hold GOTS and Fair Trade certifications.',
      keywords: 'garments,organic,sustainable,india,apparel',
      tags: 'organic,sustainable,garments',
    },
    {
      user_id: ali.id, created_by: ali.id, name: 'Istanbul Denim Works',
      slug: 'istanbul-denim-works', status: 'created_by_user',
      location_id: locations.find(l => l.country_code === 'TR')?.id || locations[0].id,
      business_category_id: categories[4]?.id || categories[0]?.id,
      manpower: '500-1000', moto: 'Premium denim, made in Turkey',
      about: 'Istanbul Denim Works is a specialized denim manufacturer known for innovative washing techniques and sustainable production processes.',
      keywords: 'denim,jeans,turkey,washing,fabric',
      tags: 'denim,jeans,premium',
    },
    {
      user_id: admin.id, created_by: admin.id, name: 'Karachi Knit Export',
      slug: 'karachi-knit-export', status: 'created_by_admin',
      location_id: locations.find(l => l.country_code === 'PK')?.id || locations[0].id,
      business_category_id: categories[5]?.id || categories[1]?.id,
      manpower: '100-200', moto: 'Fine knitwear from Pakistan',
      about: 'Karachi Knit Export produces high-quality knitwear and hosiery products for international markets. We specialize in polo shirts, t-shirts, and activewear.',
      keywords: 'knitwear,hosiery,pakistan,polo,tshirt',
      tags: 'knitwear,hosiery,activewear',
    },
    {
      user_id: admin.id, created_by: admin.id, name: 'Hanoi Textile Group',
      slug: 'hanoi-textile-group', status: 'created_by_admin',
      location_id: locations.find(l => l.country_code === 'VN')?.id || locations[0].id,
      business_category_id: categories[2]?.id || categories[0]?.id,
      manpower: '1000-5000', moto: 'Vietnam\'s leading textile exporter',
      about: 'Hanoi Textile Group is one of Vietnam\'s largest integrated textile and garment manufacturers, serving major global brands with a focus on quality and sustainability.',
      keywords: 'vietnam,textile,garment,export,integrated',
      tags: 'integrated,export,large-scale',
    },
  ];

  const businessTypes = await prisma.business_types.findMany({ take: 4 });
  const certificates = await prisma.certificates.findMany({ take: 4 });

  for (let i = 0; i < companies.length; i++) {
    const company = await prisma.companies.create({
      data: {
        ...companies[i],
        view_count: Math.floor(Math.random() * 500) + 50,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    });

    // Add business contact
    await prisma.business_contacts.create({
      data: {
        company_id: company.id,
        email: `info@${companies[i].slug.replace(/-/g, '')}.com`,
        phone: '+1234567890',
        address: `${companies[i].name} HQ`,
        website: `https://${companies[i].slug}.com`,
        created_at: now,
        updated_at: now,
      },
    });

    // Add company overview
    await prisma.company_overviews.create({
      data: {
        company_id: company.id,
        moq: `${(i + 1) * 500} pieces`,
        lead_time: `${(i + 1) * 5 + 10}`,
        lead_time_unit: 'days',
        shipment_term: 'FOB',
        payment_policy: 'LC / TT',
        total_units: `${(i + 1) * 100}`,
        production_capacity: `${(i + 1) * 10000}`,
        production_capacity_unit: 'pieces/month',
        is_manufacturer: true,
        created_at: now,
        updated_at: now,
      },
    });

    // Add FAQs
    await prisma.company_faqs.create({
      data: {
        company_id: company.id,
        question: 'What is your minimum order quantity?',
        answer: `Our MOQ is typically ${(i + 1) * 500} pieces per style per color.`,
        created_at: now, updated_at: now,
      },
    });
    await prisma.company_faqs.create({
      data: {
        company_id: company.id,
        question: 'Do you offer sampling?',
        answer: 'Yes, we provide counter samples and pre-production samples before bulk production.',
        created_at: now, updated_at: now,
      },
    });

    // Add decision maker
    await prisma.decision_makers.create({
      data: {
        company_id: company.id,
        name: `Manager at ${companies[i].name}`,
        email: `manager@${companies[i].slug.replace(/-/g, '')}.com`,
        designation: 'General Manager',
        phone: '+1234567891',
        created_at: now,
        updated_at: now,
      },
    });

    // Add business type associations
    if (businessTypes.length > 0) {
      const typeIndex = i % businessTypes.length;
      await prisma.company_business_types.create({
        data: {
          company_id: company.id,
          business_type_id: businessTypes[typeIndex].id,
          created_at: now, updated_at: now,
        },
      });
    }

    // Add certificate associations (to some companies)
    if (certificates.length > 0 && i % 2 === 0) {
      const certIndex = i % certificates.length;
      await prisma.company_certificates.create({
        data: {
          company_id: company.id,
          certificate_id: certificates[certIndex].id,
          created_at: now, updated_at: now,
        },
      });
    }

    // Add category associations
    if (categories.length > 0) {
      await prisma.company_business_categories.create({
        data: {
          company_id: company.id,
          business_category_id: companies[i].business_category_id,
          created_at: now, updated_at: now,
        },
      });
    }

    // Add company client
    await prisma.company_clients.create({
      data: { company_id: company.id, created_at: now, updated_at: now },
    });
  }
  console.log(`  Companies seeded (${companies.length}) with contacts, overviews, FAQs, decision makers`);
}

async function seedSourcingProposals() {
  const existingCount = await prisma.sourcing_proposals.count();
  if (existingCount > 0) {
    console.log(`  Sourcing proposals already exist (${existingCount}), skipping`);
    return;
  }

  const buyer = await prisma.users.findUnique({ where: { email: 'buyer@ttn.com' } });
  const jane = await prisma.users.findUnique({ where: { email: 'jane@ttn.com' } });
  const admin = await prisma.users.findUnique({ where: { email: 'admin@admin.com' } });
  if (!buyer || !jane) {
    console.log('  Skipping proposals - required users not found');
    return;
  }

  const productCategories = await prisma.product_categories.findMany({ take: 6 });
  const locations = await prisma.locations.findMany({
    where: { country_code: { in: ['BD', 'CN', 'US', 'GB', 'DE'] } },
  });

  const proposals = [
    {
      user_id: buyer.id, title: 'Looking for Cotton T-Shirt Manufacturer',
      description: 'We are looking for a reliable cotton t-shirt manufacturer who can supply 10,000 pieces per month in various colors and sizes. Must have OEKO-TEX certification.',
      quantity: 10000, unit: 'pieces', price: 3.50, currency: 'USD',
      payment_method: 'letter_of_credit', company_name: 'Global Fashion Inc.',
      email: 'sourcing@globalfashion.com', phone: '+1234567890',
      status: 'approved', approved_by: admin?.id,
    },
    {
      user_id: buyer.id, title: 'Organic Cotton Fabric Sourcing',
      description: 'Seeking GOTS-certified organic cotton fabric suppliers. Need 5,000 meters of 150 GSM single jersey fabric in natural and pastel colors.',
      quantity: 5000, unit: 'meter', price: 8.00, currency: 'USD',
      payment_method: 'bank_transfer', company_name: 'EcoWear Brands',
      email: 'buy@ecowear.com', status: 'approved', approved_by: admin?.id,
    },
    {
      user_id: jane.id, title: 'Denim Fabric for Jeans Production',
      description: 'Looking for premium denim fabric suppliers. Need 12oz and 14oz indigo denim in 3000 meters. Stretch and rigid options needed.',
      quantity: 3000, unit: 'meter', price: 6.50, currency: 'USD',
      payment_method: 'letter_of_credit', company_name: 'Denim World',
      email: 'procurement@denimworld.com', status: 'approved', approved_by: admin?.id,
    },
    {
      user_id: jane.id, title: 'Sustainable Packaging Materials',
      description: 'Need biodegradable poly bags, recycled paper tags, and eco-friendly hangers for our garment packaging.',
      quantity: 50000, unit: 'pieces', price: 0.15, currency: 'USD',
      payment_method: 'bank_transfer', company_name: 'Green Pack Solutions',
      email: 'info@greenpack.com', status: 'pending',
    },
    {
      user_id: buyer.id, title: 'Knitwear Manufacturer for Winter Collection',
      description: 'Looking for knitwear manufacturer to produce 5000 pieces of sweaters and cardigans for the winter season. Need sampling within 2 weeks.',
      quantity: 5000, unit: 'pieces', price: 12.00, currency: 'EUR',
      payment_method: 'advance_payment', company_name: 'Nordic Wear',
      email: 'source@nordicwear.com', status: 'pending',
    },
  ];

  for (let i = 0; i < proposals.length; i++) {
    const proposal = await prisma.sourcing_proposals.create({
      data: {
        ...proposals[i],
        product_category_id: productCategories[i % productCategories.length]?.id || null,
        location_id: locations[i % locations.length]?.id || null,
        view_count: Math.floor(Math.random() * 200) + 20,
        approved_at: proposals[i].status === 'approved' ? now : null,
        created_at: now,
        updated_at: now,
      },
    });

    // Add comments to approved proposals
    if (proposals[i].status === 'approved') {
      const seller = await prisma.users.findUnique({ where: { email: 'seller@ttn.com' } });
      if (seller) {
        const comment = await prisma.proposal_comments.create({
          data: {
            sourcing_proposal_id: proposal.id,
            user_id: seller.id,
            comment: 'We can fulfill this order. Please check our company profile for details on our capabilities.',
            created_at: now, updated_at: now,
          },
        });

        // Add a reply
        await prisma.proposal_comment_replies.create({
          data: {
            proposal_comment_id: comment.id,
            user_id: proposals[i].user_id,
            reply: 'Thank you for your interest! Can you send us some samples?',
            created_at: now, updated_at: now,
          },
        });
      }
    }
  }
  console.log(`  Sourcing proposals seeded (${proposals.length}) with comments`);
}

async function seedProducts() {
  const companies = await prisma.companies.findMany({ take: 4 });
  if (companies.length === 0) {
    console.log('  Skipping products - no companies found');
    return;
  }

  const existingCount = await prisma.products.count();
  if (existingCount > 0) {
    console.log(`  Products already exist (${existingCount}), skipping`);
    return;
  }

  const productCategories = await prisma.product_categories.findMany({ take: 8 });
  if (productCategories.length === 0) {
    console.log('  Skipping products - no product categories found');
    return;
  }

  const productData = [
    { name: 'Premium Cotton T-Shirt', price_range: '2.50', price_max: '4.00', moq: '500' },
    { name: 'Polo Shirt - Classic Fit', price_range: '4.00', price_max: '6.50', moq: '300' },
    { name: '100% Cotton Woven Fabric', price_range: '3.00', price_max: '5.00', moq: '1000' },
    { name: 'Denim Fabric 12oz', price_range: '5.50', price_max: '7.00', moq: '500' },
    { name: 'Jersey Knit Fabric', price_range: '2.80', price_max: '4.50', moq: '800' },
    { name: 'Fleece Hoodie', price_range: '6.00', price_max: '9.00', moq: '200' },
    { name: 'Casual Trousers', price_range: '5.00', price_max: '8.00', moq: '300' },
    { name: 'Sports Shorts', price_range: '3.50', price_max: '5.50', moq: '500' },
    { name: 'Bed Sheet Set - 300TC', price_range: '8.00', price_max: '15.00', moq: '200' },
    { name: 'Bath Towel - Premium', price_range: '2.50', price_max: '5.00', moq: '500' },
    { name: 'Organic Cotton Yarn 30/1', price_range: '4.00', price_max: '5.50', moq: '100' },
    { name: 'Zipper - YKK Style', price_range: '0.10', price_max: '0.30', moq: '5000' },
  ];

  for (let i = 0; i < productData.length; i++) {
    const companyIndex = i % companies.length;
    const catIndex = i % productCategories.length;
    await prisma.products.create({
      data: {
        company_id: companies[companyIndex].id,
        product_category_id: productCategories[catIndex].id,
        name: productData[i].name,
        price_range: productData[i].price_range,
        price_max: productData[i].price_max,
        moq: productData[i].moq,
        created_by: companies[companyIndex].user_id,
        created_at: now,
        updated_at: now,
      },
    });
  }
  console.log(`  Products seeded (${productData.length})`);
}

async function seedContactMessages() {
  const existing = await prisma.contact_messages.count();
  if (existing > 0) {
    console.log(`  Contact messages already exist (${existing}), skipping`);
    return;
  }

  const messages = [
    { name: 'Robert Smith', email: 'robert@example.com', phone: '+1555123456', message: 'I am interested in listing my textile business on your platform.', lead_status: 'New' },
    { name: 'Lisa Wang', email: 'lisa@example.com', phone: '+8613912345678', message: 'Can you help us find cotton suppliers in Bangladesh?', lead_status: 'MQL' },
    { name: 'Marco Rossi', email: 'marco@example.com', phone: '+39123456789', message: 'Looking for a partnership opportunity for the European market.', lead_status: 'New' },
  ];

  for (const msg of messages) {
    await prisma.contact_messages.create({
      data: { ...msg, created_at: now, updated_at: now },
    });
  }
  console.log(`  Contact messages seeded (${messages.length})`);
}

async function seedNewsletters() {
  const existing = await prisma.news_letters.count();
  if (existing > 0) {
    console.log(`  Newsletter subscribers already exist (${existing}), skipping`);
    return;
  }

  const emails = [
    'newsletter1@example.com',
    'newsletter2@example.com',
    'newsletter3@example.com',
    'newsletter4@example.com',
    'newsletter5@example.com',
  ];

  for (const email of emails) {
    await prisma.news_letters.create({
      data: { email, created_at: now, updated_at: now },
    });
  }
  console.log(`  Newsletter subscribers seeded (${emails.length})`);
}

async function seedBusinessAds() {
  const existing = await prisma.business_ads.count();
  if (existing > 0) {
    console.log(`  Business ads already exist (${existing}), skipping`);
    return;
  }

  const ads = [
    { link: 'https://example.com/ad1' },
    { link: 'https://example.com/ad2' },
    { link: 'https://example.com/ad3' },
  ];

  for (const ad of ads) {
    await prisma.business_ads.create({
      data: { ...ad, created_at: now, updated_at: now },
    });
  }
  console.log(`  Business ads seeded (${ads.length})`);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('=== TTN Database Seeding ===\n');

  // 1. Foundation (roles, permissions, users)
  console.log('[1/16] Permissions...');
  await seedPermissions();
  console.log('[2/16] Roles...');
  await seedRoles();
  console.log('[3/16] Users...');
  await seedUsers();

  // 2. Taxonomy data
  console.log('[4/16] Locations...');
  await seedLocations();
  console.log('[5/16] Business Categories...');
  await seedBusinessCategories();
  console.log('[6/16] Business Types...');
  await seedBusinessTypes();
  console.log('[7/16] Certificates...');
  await seedCertificates();
  console.log('[8/16] Product Categories...');
  await seedProductCategories();
  console.log('[9/16] Compliances...');
  await seedCompliances();
  console.log('[10/16] Blog Types...');
  await seedBlogTypes();

  // 3. Content data
  console.log('[11/16] About...');
  await seedAbout();
  console.log('[12/16] Team...');
  await seedTeam();
  console.log('[13/16] Pricing Plans...');
  await seedPricingPlans();
  console.log('[14/16] Site Settings...');
  await seedSiteSettings();
  console.log('[15/16] Partners...');
  await seedPartners();
  console.log('[16/16] Business Ads...');
  await seedBusinessAds();

  // 4. Transactional data
  console.log('\n[Bonus] Blogs...');
  await seedBlogs();
  console.log('[Bonus] Companies...');
  await seedCompanies();
  console.log('[Bonus] Products...');
  await seedProducts();
  console.log('[Bonus] Sourcing Proposals...');
  await seedSourcingProposals();
  console.log('[Bonus] Contact Messages...');
  await seedContactMessages();
  console.log('[Bonus] Newsletter Subscribers...');
  await seedNewsletters();

  console.log('\n=== Seeding complete! ===');
  console.log('\nTest accounts (all password: 123456):');
  console.log('  Admin:  admin@admin.com');
  console.log('  Buyer:  buyer@ttn.com');
  console.log('  Seller: seller@ttn.com');
  console.log('  Talent: talent@ttn.com');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
