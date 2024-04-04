
document.addEventListener('DOMContentLoaded', function() {
    // Set the dimensions and margins of the graph
    const margin = { top: 10, right: 10, bottom: 10, left: 10 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select("#sankey")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set the sankey diagram properties
    const sankey = d3.sankey()
        .nodeWidth(36)
        .nodePadding(40)
        .extent([[1, 1], [width - 1, height - 6]]);

    // Load the data
    d3.json('sankeyData.json').then(function(graph) {
        // Constructs a new Sankey generator with the default settings and computes the node and link positions
        sankey(graph);

        // add in the links
        const link = svg.append("g")
            .selectAll(".link")
            .data(graph.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .style("stroke-width", function(d) { return Math.max(1, d.width); })
            .sort(function(a, b) { return b.width - a.width; });

        // add in the nodes
        const node = svg.append("g")
            .selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", "node");

        // add the rectangles for the nodes
        node.append("rect")
            .attr("height", function(d) { return (d.y1 - d.y0) || 0; }) // Using safe accessor
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) { return d.color; })
            .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
            .append("title")
            .text(function(d) { return d.name + "\n" + "There could be a tooltip text here"; });

        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return ((d.y1 - d.y0) / 2) || 0; }) // Using safe accessor
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(function(d) { return d.name; })
            .filter(function(d) { return d.x0 < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        // Conditional logging to check for NaN values in the transform attribute
        node.attr("transform", function(d) {
            if (isNaN(d.x0) || isNaN(d.y0)) {
                console.error("Error with node data: NaN position", d);
                return ""; // Prevent setting invalid transform attribute
            }
            return "translate(" + (d.x0 || 0) + "," + (d.y0 || 0) + ")"; // Using safe accessor
        });
    }).catch(function(error) {
        console.error("Error loading the Sankey diagram data: ", error);
    });
});
