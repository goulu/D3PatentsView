var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(function(d) { return d.r + 0.5; }).iterations(20))
;
    

d3.json("patents.json", function(error, graph) {
    if (error) throw error;

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .style("marker-end",  "url(#suit)") // arrows
    ;

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
            .append("circle")
        .attr("r", 10)
        // ugly way to constrain X to the date. TODO : improve
        .attr("ox", function(d) {
            return d.ox = (d.ox === undefined) ? 2 * d.x : d.ox;
        })
        .attr("fill", function(d) {
            return color(d.assignee);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
                .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
//         .on('click', connectedNodes)
        .on("dblclick", function(d) {
            var url = 'https://www.google.com/patents/US';
            window.open(url + d.name, '_blank')
        });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
        link
            .attr("x1", function(d) {
                return d.source.ox;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.ox;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        node
            .attr("cx", function(d) {
                return d.ox = (d.ox === undefined) ? d.x : d.ox;
            })
            .attr("cy", function(d) {
                return d.y;
            });

    }
});

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        var cpy = d.assignee.substr(0, d.assignee.indexOf(' '));
        var date = d.date.substr(0, 4);
        return d.name + " " + cpy + " (" + date + ")</br>" + d.title + "</span>";
    })

svg.call(tip);

// arrows
svg.append("defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
    .enter().append("marker")
    .attr("id", function(d) {
        return d;
    })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
    .style("stroke", "#4679BD")
    .style("opacity", "0.6");

