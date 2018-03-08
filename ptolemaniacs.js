let width = 1920,
    height = 1000;

const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

const simulation = d3.forceSimulation()
  .force("link", d3.forceLink())
  .force("charge", d3.forceManyBody())
  // .strength(-800).distanceMin(5).distanceMax(300))
  // .force("link", d3.forceLink().id(function (d) { return d.index }))
  .force("center", d3.forceCenter(width / 2 , height / 2));
  // .force("y", d3.forceY(0.001))
  // .force("x", d3.forceX(0.001));

d3.json("data.json", function (error, json) {
  if (error) throw error;
  // force
  //   .nodes(json.nodes)
  //   .force("link")
  //   .links(json.links);

  // converting json.nodes to array\
  // must add bilinks for curved links
  let nodes = json.nodes,
      links = json.links,
      bilinks = [];

  links.forEach(function(link) {
    let s = nodes[link.source],
        t = nodes[link.target],
        i = {},
        type = link.type;
    nodes.push(i);
    links.push({source: s, target: i}, {source: i, target: t});
    bilinks.push([s, i, t, type]);
  });

  let link = svg.selectAll(".link")
    .data(bilinks)
    .enter().append("path")
    .attr("class", "link")
      .style("stroke", function (d) {
        switch (d.pop()) {
          case "child":
            return "red";
          case "marriage":
            return "blue";
        }
      });

  let node = svg.selectAll(".node")
    .data(nodes.filter(function (d) { return d.name; }))
    .enter().append("circle")
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
    });
        // .call(d3.drag()
        //   .on("start", dragBegin)
        //   .on("drag", dragging)
        //   .on("end", dragEnded));
  node.append("title")
    .text(function (d) { return d.name; });


  let label = node.append("text")
    .attr("dx", 20)
    .attr("dy", ".35em")
    .attr("class", "text")
    .text(function (d) { return d.name; });
  
  simulation
    .nodes(nodes)
    .on("tick", ticked);
  simulation
    .force("link")
    .links(links);
  



  function ticked() {
    link.attr("d", positionLink);
    node.attr("transform", positionNode);
  }

function positionLink(d) {
  return "M" + d[0].x + "," + d[0].y
    + "S" + d[1].x + "," + d[1].y
    + " " + d[2].x + "," + d[2].y;
}

function positionNode(d) {
  return "translate(" + d.x + "," + d.y + ")";
}

  // simulation.on("tick", function () {
  //   link.attr("x1", function (d) {
  //     return d.source.x;
  //   })
  //     .attr("y1", function (d) {
  //       return d.source.y;
  //     })
  //     .attr("x2", function (d) {
  //       return d.target.x;
  //     })
  //     .attr("y2", function (d) {
  //       return d.target.y;
  //     });
  //   node.attr("transform", function (d) {
  //     return "translate(" + d.x + "," + d.y + ")";
  //   });
  // });
  
});



