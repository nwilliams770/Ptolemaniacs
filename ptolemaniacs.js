let width = 960,
    height = 500;

const svg = d3.select("#chart").append("svg")
      .attr("width", width)
      .attr("height", height);

let force = d3.forceSimulation()
  .force("charge", d3.forceManyBody().strength(-700).distanceMin(100).distanceMax(1000))
  .force("link", d3.forceLink().id(function (d) { return d.index }))
  .force("center", d3.forceCenter(width / 2, height / 2))
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
      .attr("class", "link");
  
  let node = svg.selectAll(".node")
      .data(json.nodes)
      .enter().append("g")
      .attr("class", "node");
  
  let circle = node.append('circle')
      .attr('r', 13)

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

