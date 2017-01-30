var w = 1200,
    h = 1200,
    r = 6,
    z = d3.scale.category20c();

var force = d3.layout.force()
    .gravity(0.06)
    .charge(-200)
    .linkDistance(20)
    .size([w,h]);

//Append a SVG to the body of the html page. Assign this SVG as an object to svg
var svg = d3.select("body").append("svg")
  .attr("width", w)
  .attr("height", h);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    var cpy = d.assignee.substr(0, d.assignee.indexOf(' '));
    var date = d.date.substr(0, 4);
    return d.name + " " + cpy + " (" + date + ")</br>" + d.title + "</span>";
  })
  
svg.call(tip);

//Read the data from the mis element 
var mis = document.getElementById('mis').innerHTML;
graph = JSON.parse(mis);

//Creates the graph data structure out of the json data
force.nodes(graph.nodes)
  .links(graph.links)
  .start();

//Create all the line svgs but without locations yet
var link = svg.selectAll(".link")
  .data(graph.links)
  .enter().append("line")
  .attr("class", "link")
  .style("marker-end", "url(#suit)") //Added 
;

//Toggle stores whether the highlighting is on
var toggle = 0;
//Create an array logging what is connected to what
var linkedByIndex = {};
for (i = 0; i < graph.nodes.length; i++) {
  linkedByIndex[i + "," + i] = 1;
};
graph.links.forEach(function(d) {
  linkedByIndex[d.source.index + "," + d.target.index] = 1;
});
//This function looks up whether a pair are neighbours
function neighboring(a, b) {
  return linkedByIndex[a.index + "," + b.index];
}

function connectedNodes() {
  if (toggle == 0) {
    //Reduce the opacity of all but the neighbouring nodes
    d = d3.select(this).node().__data__;
    node.style("opacity", function(o) {
      return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
    });
    link.style("opacity", function(o) {
      return d.index == o.source.index | d.index == o.target.index ? 1 : 0.1;
    });
    //Reduce the op
    toggle = 1;
  } else {
    //Put them back to opacity=1
    node.style("opacity", 1);
    link.style("opacity", 1);
    toggle = 0;
  }
}

var url='https://www.google.com/patents/US';

//Do the same with the circles for the nodes - no 
var node = svg.selectAll(".node")
  .data(graph.nodes)
  .enter().append("circle")
  .attr("class", "node")
  .attr("r", 8)
  .attr("ox", function(d) {return d.ox= (d.ox === undefined) ? 5*d.x : d.ox;})
  .style("fill", function(d) {
    return z(d.assignee);
  })
  .call(force.drag)
  .on('mouseover', tip.show)
  .on('mouseout', tip.hide)
  .on('click', connectedNodes)
  .on("dblclick",function(d){window.open(url+d.name, '_blank')});


//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
force.on("tick", function() {
        
  link.attr("x1", function(d) {
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

    node.attr("cx", function(d) { return  d.ox = (d.ox === undefined) ? d.x : d.ox;})
        .attr("cy", function(d) { return d.y = Math.max(r, Math.min(h - r, d.y)); });
});

//---Insert-------
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
//---End Insert---
