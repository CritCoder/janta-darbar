const moment = require('moment');

const generateTicketId = () => {
  const year = moment().format('YYYY');
  const month = moment().format('MM');
  const day = moment().format('DD');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `JD-MH-${year}${month}${day}-${random}`;
};

const generateOutwardNumber = (departmentCode) => {
  const year = moment().format('YYYY');
  const month = moment().format('MM');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${departmentCode}/${year}-${month}/${random}`;
};

const parseTicketId = (ticketId) => {
  const match = ticketId.match(/^JD-MH-(\d{4})(\d{2})(\d{2})-(\d{3})$/);
  
  if (!match) {
    return null;
  }
  
  return {
    year: match[1],
    month: match[2],
    day: match[3],
    sequence: match[4],
    date: moment(`${match[1]}-${match[2]}-${match[3]}`).toDate()
  };
};

const getDepartmentCode = (departmentName) => {
  const codes = {
    'Water Resources': 'WR',
    'Public Works': 'PW',
    'Electricity': 'EL',
    'Health': 'HL',
    'Sanitation': 'SN',
    'Women & Child Development': 'WC',
    'Police': 'PL',
    'Revenue': 'RV',
    'Education': 'ED'
  };
  
  return codes[departmentName] || 'GN';
};

module.exports = {
  generateTicketId,
  generateOutwardNumber,
  parseTicketId,
  getDepartmentCode
};
