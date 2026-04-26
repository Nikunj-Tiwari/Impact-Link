const XLSX = require('xlsx');
const workbook = XLSX.readFile('uploads/beneficiaries/beneficiary-1777197502879-430661894.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
const kavita = rows.find(r => r.Name === 'Kavita Choudhary');
console.log('Kavita row keys:', Object.keys(kavita).map(k => "'" + k + "'"));
console.log('Kavita row:', kavita);
