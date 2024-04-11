document.addEventListener('DOMContentLoaded', function () {
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    let svgSankey, sankey, sankeyData;
    let cumulativeTotals = {};
    let currentYear;
    let animationInterval;
    let yearLabel;

    async function initSankeyChart() {
        svgSankey = d3.select("#sankey")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(40)
            .size([width, height]);

        try {
            const response = await fetch('sankeyData.json');
            sankeyData = await response.json();

            // Check if the sankeyData has the links property
            if (!sankeyData || !sankeyData.links) {
                throw new Error("Sankey data is not properly formatted or is missing 'links' property.");
            }

            // Initialize cumulative totals for each node
            sankeyData.nodes.forEach(node => {
                cumulativeTotals[node.name] = 0;
            });

            // Set up the year label at the bottom left after sankeyData is confirmed to be loaded
            yearLabel = svgSankey.append("text")
                .attr("class", "yearLabel")
                .attr("x", margin.left) // Move to the left side
                .attr("y", height + margin.top - 10) // Move to the bottom, with a slight offset
                .attr("text-anchor", "start") // Start the text at the beginning of the x position
                .text(`Year: ${d3.min(sankeyData.links, d => d.year)}`);

            animateSankey();
        } catch (error) {
            console.error('Error loading the Sankey chart data:', error);
            displayErrorMessage('An error occurred while loading the Sankey chart data. Please try again later.');
        }
    }


    function displayErrorMessage(message) {
        const errorMessageContainer = document.createElement('div');
        errorMessageContainer.style.color = 'red';
        errorMessageContainer.textContent = message;
        document.body.appendChild(errorMessageContainer);
    }

    function updateSankey(yearlyData) {
        // Update the cumulative totals by counting occurrences
        yearlyData.forEach(d => {
            const targetNodeName = sankeyData.nodes[d.target].name;
            if (!cumulativeTotals.hasOwnProperty(targetNodeName)) {
                cumulativeTotals[targetNodeName] = 0;
            }
            cumulativeTotals[targetNodeName]++;
        });

        const graph = {
            nodes: sankeyData.nodes.map(d => ({ ...d })),
            links: yearlyData.map(d => {
                const sourceNodeName = sankeyData.nodes[d.source].name;
                const targetNodeName = sankeyData.nodes[d.target].name;
                return {
                    ...d,
                    source: sankeyData.nodes.findIndex(node => node.name === sourceNodeName),
                    target: sankeyData.nodes.findIndex(node => node.name === targetNodeName),
                    value: d.value
                };
            })
        };

        // Apply the sankey layout
        sankey(graph);

        // Debugging: Check the node positions
        console.log("Updated graph nodes with layout:", graph.nodes);
        graph.nodes.forEach((node, i) => {
            if (node.x0 === undefined || node.y0 === undefined) {
                console.error(`Node ${i} (${node.name}) does not have position properties.`);
            }
        });

        // Continue with the rest of the updateSankey function
        svgSankey.selectAll(".node")
            .attr("transform", function(d) {
                return "translate(" + (isNaN(d.x0) ? 0 : d.x0) + "," + (isNaN(d.y0) ? 0 : d.y0) + ")";
            });

        const link = svgSankey.selectAll(".link")
            .data(graph.links, d => `${d.source.name}-${d.target.name}-${d.year}`);

        /*
        link.enter()
            .append("path")
            .attr("class", "link")
            .merge(link)
            .transition()
            .duration(750)
            .attr("d", d3.sankeyLinkHorizontal())
            .style("stroke-width", d => Math.max(1, d.width));

        link.exit().remove();
*/
        const node = svgSankey.selectAll(".node")
            .data(graph.nodes, d => d.name);

        const nodeEnter = node.enter()
            .append("g")
            .attr("class", "node");

        nodeEnter.append("rect")
            .merge(node.select("rect"))
            .transition()
            .duration(750)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", sankey.nodeWidth())
            .style("fill", d => d.color);

        nodeEnter.append("text")
            .merge(node.select("text"))
            .attr("x", -6)
            .attr("y", d => (d.y1 - d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            // Correct the text to show cumulative totals
            .text(d => `${d.name} (${cumulativeTotals[d.name]})`)
            .filter(d => d.x0 < width / 2)
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");


        node.exit().remove();
        // Process each link to create animated dots
        yearlyData.forEach(link => {
            const sourceNode = graph.nodes[link.source];
            const targetNode = graph.nodes[link.target];
            const numDots = link.value;

            // Debugging: Log the positions of the source and target nodes
            console.log('Creating dot for source node position:', sourceNode.x0, sourceNode.y0);
            console.log('Animating dot towards target node position:', targetNode.x0, targetNode.y0);

            // Create dots for each case in the link
            for (let i = 0; i < numDots; i++) {
                const dot = svgSankey.append("circle")
                    .classed("dot", true)
                    .attr("r", 5)
                    .attr("transform", `translate(${sourceNode.x0 + sankey.nodeWidth() / 2}, ${sourceNode.y0 + (sourceNode.y1 - sourceNode.y0) * Math.random()})`)
                    .style("fill", sourceNode.color);

                dot.transition()
                    .duration(1000)
                    .attrTween("transform", function() {
                        const xInterpolate = d3.interpolateNumber(sourceNode.x0, targetNode.x0);
                        const yInterpolate = d3.interpolateNumber(sourceNode.y0, targetNode.y0);
                        return function(t) {
                            // Use the interpolation functions to calculate the intermediate positions
                            const x = xInterpolate(t) - sankey.nodeWidth() / 2;
                            const y = yInterpolate(t);
                            return `translate(${x}, ${y})`;
                        };
                    })
                    .remove(); // Optionally remove the dot after transition
            }
        });
    }

    function animateSankey() {
        const years = d3.range(d3.min(sankeyData.links, d => d.year), d3.max(sankeyData.links, d => d.year) + 1);
        let currentYearIndex = 0;
        animationInterval = setInterval(function () {
            currentYear = years[currentYearIndex];
            yearLabel.text(`Year: ${currentYear}`); // Update the year label
            const yearlyData = sankeyData.links.filter(link => link.year === currentYear);
            if (yearlyData.length > 0) {
                updateSankey(yearlyData);
            } else {
                console.log(`Yearly data is empty or undefined for year: ${currentYear}`);
            }
            currentYearIndex++;
            if (currentYearIndex >= years.length) {
                clearInterval(animationInterval);
            }
        }, 1000);
    }

    initSankeyChart();
});