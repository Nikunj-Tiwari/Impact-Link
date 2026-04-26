const XLSX = require('xlsx');
const workbook = XLSX.readFile('uploads/beneficiaries/beneficiary-1777197502879-430661894.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
console.log('Headers:', Object.keys(rows[0]).map(k => "'" + k + "'"));
console.log('First row:', rows[0]);
