var width = 1920,
    height = 1000;

const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

const simulation = d3.forceSimulation()
  .force("link", d3.forceLink().distance(20).strength(0.3))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2 , height / 2));

d3.json("data.json", function (error, json) {
  if (error) throw error;

  // converting json.nodes to array\
  // must add bilinks for curved links
  var nodes = json.nodes,
      links = json.links,
      bilinks = [];

  links.forEach(function(link) {
    var s = nodes[link.source],
        t = nodes[link.target],
        i = {},
        type = link.type;
    nodes.push(i);
    links.push({source: s, target: i}, {source: i, target: t});
    bilinks.push([s, i, t, type]);
  });

  var link = svg.selectAll(".link")
    .data(bilinks)
    .enter().append("path")
    .attr("class", function (d) { return "link " + d.type; })
      .style("stroke", function (d) {
        switch (d.pop()) {
          case "child":
            return "red";
          case "marriage":
            return "blue";
        }
      });

  var node = svg.selectAll(".node")
    .data(nodes.filter(function (d) { return d.name; }))
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", 5)
    .style("fill", function (d) {
      switch (d.generation) {
        case 1:
          return "0052d4";
        case 2:
          return "0d61d9";
        case 3:
          return "1f77df";
        case 4:
          return "3490e7";
        case 5:
          return "49a9ee";
        case 6:
          return "5dbff5";
        case 7:
          return "6bcdf8";
        case 8:
          return "79d8fb";
        case 9:
          return "84dffb";
        case 10:
          return "96e9fb";
        case 11:
          return "9cebfb";
      }
    })
    // .on("mouseover", handleMouseOver)
    // .on("mouseout", handleMouseOut)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));


  node.append("text")
    .attr("dx", "20em")
    .attr("dy", ".35em")
    .attr("class", "text")
    .attr("fill", "pink")
    .attr("stroke", "red")
    .text(function (d) { return d.name; });
  
  simulation
    .nodes(nodes)
    .on("tick", ticked);
  simulation
    .force("link")
    .links(links);
  
// function handleMouseOver(d, i) {
//   d3.select(this).attr({fill: 'black'});
//   d3.select(this).append("text")
//   // .attr({
//   //   id: "t" + d.x + "-" + d.y + "-" + i,  // Create an id for text so we can select it later for removing on mouseout
//   // })
//   .attr("dx", 10)
//   .attr("dy", ".35em")
//   .attr("class", "text")
//   .text(function (d) { return d.name})
//   .style("stroke", "red");
// }

// function handleMouseOut(d, i) {
//   d3.select(this).attr({
//     fill: "pink",
//   });
//   d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
// }

function ticked() {
    link.attr("d", positionLink);
    node.attr("transform", positionNode);
    d3.selectAll("text").attr("x", function (d) {
      return d.x;
    })
      .attr("y", function (d) {
        return d.y;
      });
}

function positionLink(d) {
  return "M" + d[0].x + "," + d[0].y
    + "S" + d[1].x + "," + d[1].y
    + " " + d[2].x + "," + d[2].y;
}

function positionNode(d) {
  return "translate(" + d.x + "," + d.y + ")";
}

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x, d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x, d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null, d.fy = null;
  }
  
});



