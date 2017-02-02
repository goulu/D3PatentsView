
var width = 1000,
    height = 750,
    radius = 5;
    
d3.select("div#chart1")
   .append("div")
   .classed("svg-container", true) //container class to make it responsive
   .append("svg")
   //responsive SVG needs these 2 attributes and no width and height attr
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox","0 0 " + width + " " + height)
   //class to make it responsive
   .classed("svg-content-responsive", true); 

var svg = d3.select("svg"),
    color = d3.scaleOrdinal(d3.schemeCategory20);

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "#f2f2f2");

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink(0.1))
    .force("charge", d3.forceManyBody().strength(-1))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(radius + 2)
        .strength(2)
        .iterations(100)
    );


d3.json("patents.json", function(error, graph) {
    if (error) throw error;

    var link = svg.append("g")
        .attr("class", "links")
        .attr("length", 1)
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .style("marker-end", "url(#suit)") // arrows
    ;

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("r", radius)
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
        node
            .attr("cx", function(d) {
                d.x=d.ox = (d.ox === undefined) ? d.x : d.ox; // constrain x
                return d.x = Math.max(radius, Math.min(width - radius, d.x));
            })
            .attr("cy", function(d) {
                return d.y = Math.max(radius, Math.min(height - radius, d.y));
            });
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

// http://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function wordWrapToStringList (text, maxLength) {
    var result = [], line = [];
    var length = 0;
    text.split(" ").forEach(function(word) {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(" "));
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });
    if (line.length > 0) {
        result.push(line.join(" "));
    }
    return result;
};
// tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-radius, 0])
    .html(function(d) {
        cpy = d.assignee.substr(0, d.assignee.indexOf(' '));
        date = d.date.substr(0, 4);
        title=wordWrapToStringList(d.title, 60).join('<br/>');
        return "US"+d.name + " " + cpy + " (" + date + ")</br>" + title + "</span>";
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