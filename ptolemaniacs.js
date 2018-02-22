let width = 960,
    height = 500;

const svg = d3.select("#chart").append("svg")
      .attr("width", width * 6)
      .attr("height", height * 6);

let force = d3.forceSimulation()
  .force("charge", d3.forceManyBody().strength(-1500).distanceMin(10).distanceMax(3000))
  .force("link", d3.forceLink().id(function (d) { return d.index }))
  .force("center", d3.forceCenter(width * 3, height * 3))
  .force("y", d3.forceY(0.001))
  .force("x", d3.forceX(0.001));

d3.json("graph.json", function (error, json) {
  if (error) throw error;
  force
      .nodes(json.nodes)
      .force("link").links(json.links);
  
  let link = svg.selectAll('.link')
      .data(json.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", function (d) {
        switch (d.type) {
          case "child":
            return "red";
          case "marriage":
            return "blue";
        }
      });
  
  let node = svg.selectAll(".node")
      .data(json.nodes)
      .enter().append("g")
      .attr("class", "node")
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
  
  let circle = node.append('circle')
      .attr('r', 13);
  
  node.append("text")
    .attr("dx", 20)
    .attr("dy", ".35em")
    .text(function (d) { return d.name });

  force.on("tick", function () {
    link.attr("x1", function (d) {
      return d.source.x;
    })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
    node.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });
  
});

