const Joi = require('joi');

const grievanceSchema = Joi.object({
  citizen_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  citizen_name: Joi.string().min(2).max(255).required(),
  summary: Joi.string().min(10).max(500).required(),
  description: Joi.string().min(20).max(2000).required(),
  language: Joi.string().valid('mr', 'hi', 'en').default('mr'),
  category: Joi.string().valid(
    'water', 'road', 'electricity', 'health', 'sanitation', 
    'women_child', 'police', 'revenue', 'education', 'other'
  ).required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  media_urls: Joi.array().items(Joi.string().uri()).max(10).default([]),
  tags: Joi.array().items(Joi.string().max(50)).max(20).default([])
});

const validateGrievance = (req, res, next) => {
  const { error, value } = grievanceSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.body = value;
  next();
};

const userSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  name: Joi.string().min(2).max(255).required(),
  language: Joi.string().valid('mr', 'hi', 'en').default('mr'),
  consent_flags: Joi.object().default({})
});

const validateUser = (req, res, next) => {
  const { error, value } = userSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.body = value;
  next();
};

const departmentSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  name_marathi: Joi.string().min(2).max(255).required(),
  name_hindi: Joi.string().min(2).max(255).optional(),
  district: Joi.string().min(2).max(100).required(),
  contact_whatsapp: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  contact_email: Joi.string().email().optional(),
  escalation_contact: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
});

const validateDepartment = (req, res, next) => {
  const { error, value } = departmentSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateGrievance,
  validateUser,
  validateDepartment
};
