const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function isExcelDate(value) {
    return !isNaN(value) && value > 0 && value < 2958466;
}

function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

function parseDate(date) {
    if (isExcelDate(date)) {
        return excelDateToJSDate(date);
    } else if (typeof date === 'string') {
        const isoMatch = date.match(/^\d{4}-\d{2}-\d{2}$/);
        if (isoMatch) {
            return new Date(date);
        }
        const dmyMatch = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dmyMatch) {
            return new Date(dmyMatch[3], dmyMatch[2] - 1, dmyMatch[1]);
        }
        const directConversion = new Date(date);
        if (!isNaN(directConversion.getTime())) {
            return directConversion;
        }
    }
    return null;
}

function convertExcelToJson() {
    const excelFilePath = path.resolve(__dirname, 'EDI Master 2023-11.xlsx');
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    let jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    jsonData = jsonData.map(row => {
        let date = row['Original Publication Date'];
        if (date) {
            const parsedDate = parseDate(date);
            if (parsedDate && !isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString().split('T')[0];
            } else {
                console.error('Invalid date found:', date);
                date = undefined;
            }
        }

        // Extract and handle the 'Disciplines' column, splitting if necessary
        const disciplines = row['Disciplines'] ? row['Disciplines'].split(';').map(d => d.trim()) : [];

        return {
            'EDI Primary Case Issues': row['EDI Primary Case Issues'] || 'Undefined',
            'Original Publication Date': date,
            'Disciplines': disciplines  // Add the 'Disciplines' field to the JSON
        };
    });

    jsonData = jsonData.filter(row => row['Original Publication Date'] !== undefined);

    const jsonFilePath = path.resolve(__dirname, 'data.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log('Excel file has been converted to JSON!');
}

convertExcelToJson();
