const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, 'data.json');
const barChartOutputPath = path.resolve(__dirname, 'barChartData.json');

function getYear(dateString) {
    return new Date(dateString).getFullYear();
}

function processBarChartData() {
    const rawData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const processedData = [];

    // Create a nested structure: year -> discipline -> issue -> count
    const yearDisciplineIssueMap = {};

    rawData.forEach(entry => {
        const year = getYear(entry['Original Publication Date']);
        const disciplines = entry['Disciplines']; // Directly use the array of disciplines
        const issue = entry['EDI Primary Case Issues'];

        disciplines.forEach(discipline => {
            if (!yearDisciplineIssueMap[year]) {
                yearDisciplineIssueMap[year] = {};
            }
            if (!yearDisciplineIssueMap[year][discipline]) {
                yearDisciplineIssueMap[year][discipline] = {};
            }
            if (!yearDisciplineIssueMap[year][discipline][issue]) {
                yearDisciplineIssueMap[year][discipline][issue] = 1;
            } else {
                yearDisciplineIssueMap[year][discipline][issue]++;
            }
        });
    });

    // Convert the nested structure to a flat array suitable for charting
    Object.keys(yearDisciplineIssueMap).forEach(year => {
        Object.keys(yearDisciplineIssueMap[year]).forEach(discipline => {
            Object.keys(yearDisciplineIssueMap[year][discipline]).forEach(issue => {
                processedData.push({
                    year: parseInt(year, 10),
                    discipline: discipline,
                    issue: issue,
                    count: yearDisciplineIssueMap[year][discipline][issue]
                });
            });
        });
    });

    // Sort the data by year (numerically, now that year is a number)
    processedData.sort((a, b) => a.year - b.year);

    // Write the processed data to barChartData.json
    fs.writeFileSync(barChartOutputPath, JSON.stringify(processedData, null, 2), 'utf8');
    console.log('Bar chart data has been processed and saved!');

}

processBarChartData();
