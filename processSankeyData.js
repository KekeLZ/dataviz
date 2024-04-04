const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, 'data.json');
const sankeyOutputPath = path.resolve(__dirname, 'sankeyData.json');

function getYear(dateString) {
    const date = new Date(dateString);
    return date.getFullYear(); // This already returns a number
}

function processSankeyData() {
    const rawData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const nodes = [{ name: 'All Cases' }];
    const links = [];
    const issuesMap = {};
    const cumulativeCounts = {};

    rawData.forEach(entry => {
        const year = getYear(entry['Original Publication Date']);
        const issue = entry['EDI Primary Case Issues'] || 'No EDI Primary Case';

        // For Sankey: Map issue to index
        if (!issuesMap[issue]) {
            issuesMap[issue] = nodes.length;
            nodes.push({ name: issue });
            cumulativeCounts[issue] = {};
        }

        // Track cumulative count of issues by year
        if (!cumulativeCounts[issue][year]) {
            cumulativeCounts[issue][year] = 1;
        } else {
            cumulativeCounts[issue][year]++;
        }
    });

    // Convert cumulative counts to links for Sankey
    Object.keys(cumulativeCounts).forEach(issue => {
        const issueIndex = issuesMap[issue];
        let totalCount = 0;

        Object.keys(cumulativeCounts[issue]).sort((a, b) => a - b).forEach(year => {
            totalCount += cumulativeCounts[issue][year];
            links.push({
                source: 0, // index of 'All Cases' node
                target: issueIndex, // index of the current issue node
                value: totalCount, // cumulative count
                year: parseInt(year, 10) // Ensure the year is a number
            });
        });
    });

    // Write the processed data to sankeyData.json
    fs.writeFileSync(sankeyOutputPath, JSON.stringify({ nodes, links }, null, 2), 'utf8');
    console.log('Sankey chart data has been processed and saved!');
}

processSankeyData();
