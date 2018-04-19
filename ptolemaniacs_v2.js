// Philadelphoi
let width =1920,
  height = 1000;

let svg = d3.select("#chart")
            .append("svg")
            .attr("viewBox", "0 0 " + width + " " + height)
            .attr("preserveAspectRatio", "xMidYMid meet");

// defining our forceSimulation in a variable allows us to easily modify it on the fly
let force = d3.forceSimulation()
              .force("charge", d3.forceManyBody().strength(-125))
              .force("center", d3.forceCenter(width / 2, height / 2))
              .force("link", d3.forceLink().distance(75).id(function (d) { return d.index }))


d3.json("data.json", function (error, json) {
  if (error) throw error;
  force
    .nodes(json.nodes)
    .force("link") 
    .links(json.links);

  const header = document.querySelector('#label');

  const linkedByIndex = {};
  for (i = 0; i < json.nodes.length; i++) {
    linkedByIndex[i + "," + i] = 1;
  };

  json.links.forEach(function (d) {
    if (d.type === "child" || d.type === "marriage" || d.type === "corule") {
      linkedByIndex[d.source.index + "," + d.target.index] = 1;
    }
  });

// add directional markers
// taken from Mike Bostock example
  svg.append("defs").selectAll("marker")
      .data(["child"])      // Different link/path types can be defined here
      .enter().append("marker")    // This section adds in the arrows
      .attr("id", function(d) { return d;})
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "red");

  let link = svg.append("g").selectAll('.link')
                .data(json.links)
                .enter()
                .append("line")
                .attr("id", function (d) { return "link-" + d.index})
                .attr("class", function (d) { 
                  return (d.type === "rule" || d.type === "corule") ? `link-${d.type} hidden` : `link-${d.type}` })              
                .attr("marker-end", function (d) {
                  if (d.type === 'child') {
                    return "url(#child)";
                  }
                })
                .style("stroke", function (d) {
                  switch (d.type) {
                    case "child":
                      return "red";
                    case "marriage":
                      return "blue";
                    case "corule":
                      return "green";
                    case "rule":
                      return "purple";
                  }
                });

  let node = svg.selectAll(".node")
    .data(json.nodes)
    .enter().append("g")
    .attr("class", "node")
    .on('dblclick', showNeighborNodes)
    .call(d3.drag()
      .on("start", dragBegin)
      .on("drag", dragging)
      .on("end", dragEnded))
    .on("mouseover", function(d) {
      //TO-DO: Wrap header in div, toggle that opacity on mouseover and leave to have transition
      header.innerHTML = d.name;
      const nodeCircle = d3.select(this).select("circle");
      nodeCircle.attr('data-color', `${nodeCircle.style("fill")}`)
      nodeCircle.style('fill', 'yellowgreen');
      })
    .on("mouseleave", function (d) {
      //TO-DO: Wrap header in div, toggle that opacity on mouseover and leave to have transition
      const nodeCircle = d3.select(this).select("circle");      
      nodeCircle.style('fill', `${nodeCircle.attr("data-color")}`);
  });

  let circle = node.append('circle')
    .attr('r', 12)
    .style("fill", function (d) {
    if (d.generation < 4) {
      return "#abcb42";
    } else if (d.generation > 4 && d.generation < 7) {
      return "#feaf17";
    } else {
      return "#f35001";
    }
    });

  let label = node.append("text")
    .attr("dy", ".35em")
    .attr("dx", "1em")
    .attr("class", "text")
    .text(function (d) { return d.name; });


// our tick function, 
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
  })


// drag and drop funcs
// *** RENAME THESE
  function dragBegin(d) {
    if (!d3.event.active) force.alphaTarget(0.3).restart();
    d.fx = d.x, d.fy = d.y;
  }

  function dragging(d) {
    d.fx = d3.event.x, d.fy = d3.event.y;
  }

  function dragEnded(d) {
    if (!d3.event.active) force.alphaTarget(0);
    d.fx = null, d.fy = null;
  }

  var toggleConnections = 1;

// NODE HIGHLIGHTING 
  let neighborNodesToggled = false,
      murdersToggled = false,
      corulesToggled = false,
      labelsToggled = false;

  var toggleMurders = 1;
  var toggleCorules = 1;
  var toggleLabels = 1;
  var toggleRule = 1;


  //This function looks up whether a pair are neighbours
  function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
  }

  function showNeighborNodes() {
    if (toggleMurders === 0 || toggleCorules === 0) return;
    if (!neighborNodesToggled) {
      //Reduce the opacity of all but the neighbouring nodes
      d = d3.select(this).node().__data__;
      node.style("opacity", function (o) {
        return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
      });
      label.style("display", function (o) {
        return neighboring(d, o) | neighboring(o, d) ? "inline" : "";
      });

      link.style("opacity", function (o) {
        ((d.index == o.source.index | d.index == o.target.index) && (o.type !== "corule" && o.type !== "rule")) ? "1" : "0.1" 
      })
      //Reduce the op
      neighborNodesToggled = true;
    } else {
      //Put them back to opacity=1
      node.style("opacity", 1);
      link.style("opacity", function (d) {
        return (d.type === "corule" || d.type === "rule") ? "0" : "1"
      });           
      label.style("display", "none");
      neighborNodesToggled = false;
    }
  }

  // ETC FUNCTIONALITY *****

  function showHeader(node) {
    var parents = d3.selectAll('.node').filter(function (d) {
      console.log(node);
      return neighboring(d, node) || neighboring(node, d);
    })
    console.log(parents);
  }

  function updateButton(button) {
    if (!d3.select(button).classed("bttn-labels")) {
      let buttonLabel = labelsToggled ? "Hide Labels" : "Show Labels"
      labelButton.innerHTML = buttonLabel;
    }
    let newLabel = button.innerHTML;
    newLabel = newLabel.includes("Show") ? newLabel.replace("Show", "Hide") : newLabel.replace("Hide", "Show")
    button.innerHTML = newLabel;
  }
  
  function showMurders() {
    let selected = d3.selectAll(".node").filter(function (d) {
      return d.murdered;
    })
    let notSelected = d3.selectAll(".node").filter(function (d) {
      return !(d.murdered);
    })
    if (!murdersToggled) {
      if (corulesToggled) {
        selected.selectAll('circle').style('fill', 'red');        
        selected.classed("hidden", false)
        selected.selectAll('text').style('display', 'inline');
        murdersToggled = true;
        updateButton(this);
        return;
      }
      link.classed("hidden", true);      
      notSelected.classed("hidden", true);
      selected.selectAll('circle').style('fill', 'red');
      selected.selectAll('text').style('display', 'inline');
      murdersToggled = true;
      labelsToggled = true;
      // showLabels()

    } else {
      if (corulesToggled) {
        node.filter(function (d) {
          return (!d.familial_ruler) && d.murdered;
        }).classed("hidden", true);       
        selected.filter(function (d) {
          return (!d.familial_ruler) && d.murdered;
        }).selectAll("text").style("display", "none"); 
        colorizeNodes();      
        murdersToggled = false;
        updateButton(this);
        return;
      }
      restoreLinks();
      colorizeNodes();      
      notSelected.classed("hidden", false);
      selected.selectAll('text').style('display', 'none');
      labelsToggled = false;
      murdersToggled = false;
    }
    updateButton(this);    
  }

  function restoreLinks() {
    link.classed("hidden", function (d) {
      return (d.type === "corule" || d.type === "rule") ? true : false
    });    
  }



  function showCorules() {
    //TO-DO: refactor toggleRule to toggleRuling and only show corules once anim complete
    if ((corulesToggled && toggleRule === 0)) return;
    if (!corulesToggled) {
      
      if (murdersToggled) {
        const murdereCoruleLinks = d3.selectAll(".link-corule");
        const murdered = d3.selectAll(".node").filter(function (d) { return d.murdered });
        const corulers = d3.selectAll(".node").filter(function (d) { return d.familial_ruler && (!d.murdered)})
        murdered.each(function (murderedNode) {
          murdereCoruleLinks.each(function (coruleLink) {
            corulers.each(function (node) {
              //check if current link is connect to the murderedNode
              if (murderedNode.index === coruleLink.source.index || murderedNode.index === coruleLink.target.index) {
                // now check if the node neighbors the murderedNode by means of ANY link type
                if (neighboring(murderedNode, node) || neighboring(node, murderedNode)) {
                  if (node.index === coruleLink.source.index || node.index === coruleLink.target.index) {
                    d3.select(this).classed("hidden", false);
                    d3.select(this).select("text").style("display", "inline");                
                    d3.select(`#link-${coruleLink.index}`).classed("hidden", false);
                 }
                }
              }
            })
          })
        }) 
        updateButton(this);  
        corulesToggled = true;
        return;        
      }
      link.classed("hidden", function (d) {
        return d.type !== "corule"
      });
      const nonCorulers = node.filter(function (d) {
        return !d.familial_ruler;
      })
      toggleNodeOpacity(nonCorulers);
      node.selectAll("text").style("display", function (d) {
        return d.familial_ruler ? "inline" : "none"
      })
      corulesToggled = true;
      labelsToggled = true;
    } else {
      if (murdersToggled) {
        node.selectAll("text").style("display", function (d) {
          return !d.murdered ? "none" : "inline"
        })
        node.classed("hidden", function (d) { return !d.murdered});
        link.classed("hidden", true);
        updateButton(this);
        corulesToggled = false;
        return;
      }
      restoreLinks();      
      toggleNodeOpacity();
      node.selectAll("text").style("display", "none");
      corulesToggled = false;
      labelsToggled = false;
    }
    updateButton(this);            
  }

  function toggleNodeOpacity(nodeCircles) {
    nodeCircles = nodeCircles || d3.selectAll(".node");
    nodeCircles.classed("hidden", !(nodeCircles.classed("hidden")));
  }



  function showLabels() {
    updateButton(this);    
    if (!labelsToggled) {
      // select node text based on opacity of circles
      d3.selectAll(".node").each(function (d, i) {
        let currentNode = d3.select(this);
        let hidden = currentNode.select("circle").classed("hidden");
        if (!hidden) {
          currentNode.select("text").style("display", "inline");
        } 
      })
      labelsToggled = true;
    } else {
      d3.selectAll(".node text").style("display", "none");
      labelsToggled = false;
    }
  }

  function colorizeNodes() {
    d3.selectAll(".node circle").style("fill", function (d) {
      if (d.generation < 4) {
        return "#abcb42";
      } else if (d.generation > 4 && d.generation < 7) {
        return "#feaf17";
      } else {
        return "#f35001";
      }
    });
  }


  function visitNodes(i) {
    d3.selectAll(".link").transition()
      .duration(10)
      .style("opacity", "0");

    var links = d3.selectAll(".link.rule");
    links.transition().duration(10).style("opacity", "1");
    var circles = d3.selectAll(".node circle").filter(function (d) {
      return d.rule === i;
    })
    var text = d3.selectAll(".node text").filter(function (d) {
      return d.rule === i;
    })
    
    circles.transition()
      .duration(10 * i)
      .delay(100 * (i + 1))
      .style("fill", "pink");
    text.transition()
      .duration(10 * i)
      .delay(100 * (i + 1))
      .style("display", "inline");
  }

  function showLineOfRule() {
    if (toggleMurders === 0 || neighborNodesToggled) return;
    updateButton(this);        
    if (toggleRule === 1) {
      toggleRule = 0;         
      for (let i = 1; i < 16; i++) {
        visitNodes(i);
      }
    } else {
      colorizeNodes();      
      d3.selectAll(".link").style("opacity", function (d) {
        if (d.type === "child" || d.type === "marriage") {
          return "1";
        } else {
          return "0";
        }
      })
      d3.selectAll(".text").style("display", "none");
      toggleRule = 1;
    }

  }

  const labelButton = document.querySelector('.bttn-labels');
  const murdersButton = document.querySelector('.bttn-murders');
  const corulesButton = document.querySelector('.bttn-corules');
  const lineOfRuleButton = document.querySelector('.bttn-rule');

  murdersButton.addEventListener('click', showMurders);
  corulesButton.addEventListener('click', showCorules);
  labelButton.addEventListener('click', showLabels);
  lineOfRuleButton.addEventListener('click', showLineOfRule);
});

