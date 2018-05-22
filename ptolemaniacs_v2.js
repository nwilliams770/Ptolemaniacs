// To-Do:
// - line of rule functionality
    // - need to refactor text to change from display to add hidden class
    // - for line of rule, strip class, manually add and remove opacity for labels, cannot do transition for adding class
// - GROW out nodes, text and push text over on Rule, dbbl click
// - Create legend using built in d3
// - STYLING


// Philadelphoi
let width =1920,
  height = 1000;

let svg = d3.select("#chart")
            .append("svg")
            .attr("viewBox", "0 0 " + width + " " + height)
            .attr("preserveAspectRatio", "xMidYMid meet");
// const forceX = d3.forceX(width / 2).strength(0.015)
// const forceY = d3.forceY(height / 2).strength(0.015)
// defining our forceSimulation in a variable allows us to easily modify it on the fly

var repelForce = d3.forceManyBody().strength(-140).distanceMax(80).distanceMin(20);
var attractForce = d3.forceManyBody().strength(100).distanceMax(100).distanceMin(100);

let force = d3.forceSimulation()
              .force("charge", d3.forceManyBody().strength(-125))
              .force("center", d3.forceCenter(width / 2, height / 2))
              // .force("center", d3.forceCenter(width * 0.5, height / 2))
              .force("link", d3.forceLink().distance(75).id(function (d) { return d.index }))
              // .force('x', forceX)
              // .force('y', forceY)
              // .alphaDecay(0.01)
              // .force("attractForce", attractForce)
              // .force("repelForce", repelForce)



d3.json("data.json", function (error, json) {
  if (error) throw error;
  force
    .nodes(json.nodes)
    .force("link") 
    .links(json.links);

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
                  return (d.type === "rule" || d.type === "corule") ? `link link-${d.type} hidden` : `link link-${d.type}` })              
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
      .on("mouseover", mouseOver)
    .on("mouseleave", function (d) {
      //TO-DO: Wrap header in div, toggle that opacity on mouseover and leave to have transition
      const nodeCircle = d3.select(this).select("circle");      
      nodeCircle.style('fill', `${nodeCircle.attr("data-color")}`);
  });

  let circle = node.append('circle')
    .attr('r', 12)
    .style("fill", function (d) {
      if (d.generation <= 4) {
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

  function gatherNodeDetails(hoveredNode) {
    const currentNodeDetails = { parents: [],
                                children: [],
                                corulers: [],
                                spouses: [],
                                rule: {
                                  successor: [],
                                  predessor: []
                                }
                              };
    d3.selectAll(".link").each(function (d) {
      if (d.source.index === hoveredNode.index || d.target.index === hoveredNode.index) {
        switch (d.type) {
          case "child":
            if (d.source.index === hoveredNode.index) {
              currentNodeDetails["children"].push(d.target.name);
            } else {
              currentNodeDetails["parents"].push(d.source.name);
            }
            break;
          case "marriage":
            d.source.index === hoveredNode.index ? currentNodeDetails["spouses"].push(d.target.name) : currentNodeDetails["spouses"].push(d.source.name)
            break;
          case "corule":
            d.source.index === hoveredNode.index ? currentNodeDetails["corulers"].push(d.target.name) : currentNodeDetails["corulers"].push(d.source.name)
            break;
          case "rule":
            if (d.source.index === hoveredNode.index) {
              currentNodeDetails["rule"]["successor"].push(d.target.name);
            } else {
              currentNodeDetails["rule"]["predessor"].push(d.source.name);
            }
            break;
        }
      }
    })
    return currentNodeDetails;
  }

  function processNodeDetailHTML(currentNodeDetails) {
    const detailList = document.createElement("ul");

    for (let key in currentNodeDetails) {
      // continue if any of the details is empty
      if (currentNodeDetails[key].length <= 0) continue;
      if (key === "rule") continue;
      // if (key === "rule") {
      //   if (currentNodeDetails[key]["successor"].length === 0 && currentNodeDetails[key]["predessor"].length === 0) continue;
      // }


      let nodeDetail = document.createElement('li');
      let keyword = document.createElement("span");
      let detailEntry, keywordEntry;

      if (key === "children") {
        keywordEntry = currentNodeDetails[key].join(", ");
        detailEntry = "Sired ";
      } else if (key === "parents") {
        detailEntry = "Child of ";
        keywordEntry = `${currentNodeDetails[key][0]} and ${currentNodeDetails[key][1]}`;
      } else if (key === "spouses") {
        detailEntry = "Wed to ";
        keywordEntry = currentNodeDetails[key].join(", ");
      } else if (key === "corulers") {
        detailEntry = "Ruled alongside "
        keywordEntry = currentNodeDetails[key].join(", ");        
      } 

      keyword.appendChild(document.createTextNode(keywordEntry));
      nodeDetail.appendChild(document.createTextNode(detailEntry));
      nodeDetail.appendChild(keyword);
      detailList.appendChild(nodeDetail);
      appendNodeDetailHTML(detailList)
    }
  }

  function appendNodeDetailHTML(detailList) {
    const nodeDetailContainer = document.querySelector("#node-detail");  
    nodeDetailContainer.childNodes[0] ? nodeDetailContainer.replaceChild(detailList, nodeDetailContainer.childNodes[0]) : nodeDetailContainer.appendChild(detailList);
      // if (key !== "rule") {
      //   entry = `${key}: ${currentNodeDetails[key].join(", ")}`;
      // } else {
      //   entry = `Predecessor: ${currentNodeDetails[key]["predessor"]} Successor: ${currentNodeDetails[key]["successor"]}`;
      // }
      // nodeDetail.appendChild(document.createTextNode(entry));
  }

  function mouseOver(d) {
    welcomeMessage.style.display = "none";
    if (neighborNodesToggled) return;
    const currentNodeDetails = gatherNodeDetails(d);
    const nodeDetailHeader = document.querySelector("#node-detail-header");    
    nodeDetailHeader.innerHTML = `${d.name} (${d.lifespan})`;

    const nodeCircle = d3.select(this).select("circle");
    nodeCircle.attr('data-color', `${nodeCircle.style("fill")}`)
    nodeCircle.style('fill', 'yellowgreen');

    processNodeDetailHTML(currentNodeDetails);
  }

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
    if (murdersToggled) {
      node.style("fill", "red");
    } else {
      colorizeNodes();
    }
  }

  var toggleConnections = 1;

// NODE HIGHLIGHTING 
  let neighborNodesToggled = false,
      murdersToggled = false,
      corulesToggled = false,
      labelsToggled = false,
      ruleToggled = false;



  //Gather the neighbors
  function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
  }

  function showNeighborNodes() {

    // If we aren't showing neighbor nodes
    if (!neighborNodesToggled) {
      d = d3.select(this).node().__data__;
      //check if murdersToggled or corulesToggled and update accordingly
      if (murdersToggled || corulesToggled) {
        node.classed("hidden", function (o) {
          if (neighboring(d, o) || neighboring(o, d)) return false;
          if (murdersToggled && o.murdered) return false;
          if (corulesToggled && o.familial_ruler) return false;
          return true;
        })
        label.style("display", function (o) {
          if (neighboring(d, o) || neighboring(o, d)) return "inline";
        });
        link.classed("hidden", function (o) {
          if (o.type === "rule") return true;
          if (murdersToggled && (d.index == o.source.index || d.index == o.target.index)) return false;
          if (corulesToggled && o.type === "corule") return false;
          if (corulesToggled && (d.index == o.source.index || d.index == o.target.index)) return false; 
          return true;
        })
        neighborNodesToggled = true;
        return;
      }
      node.classed("dimmed", function (o) {
        return !(neighboring(d, o) || neighboring(o, d));
      });
      label.style("display", function (o) {
        return neighboring(d, o) | neighboring(o, d) ? "inline" : "";
      });
      link.filter(function (d) {
            return !(d.type === "rule" || d.type === "corule")})
          .classed("dimmed", function (o) {
            if (o.type !== "rule" || o.type !== "corule" ) {
              if (!(d.index == o.source.index || d.index == o.target.index)) {
              return true; 
            }
          }
      })
      neighborNodesToggled = true;
    } else {
      //Hide neighbor nodes, making sure we don't hide anything that should be visible!
      node.classed("dimmed", false);
      if (corulesToggled && murdersToggled) {
        node.classed("hidden", function (d) { return (d.familial_ruler && d.murdered) });
        link.classed("hidden", function (d) { return !(d.type === "corule") })
        label.style("display", function (d) { return (d.familial_ruler || d.murdered) ? "inline" : "none" })
        return;     
      } else if (corulesToggled) {
        node.classed("hidden", function (d) { return !d.familial_ruler })
        link.classed("hidden", function (d) { return !(d.type === "corule") })
        label.style("display", function (d) { return d.familial_ruler ? "inline" : "none"}) 
        return;
      } else if (murdersToggled) {
        node.classed("hidden", function (d) { return !d.murdered })
        link.classed("hidden", true);
        label.style("display", function (d) { return d.murdered ? "inline" : "none" })
        return;
      }
      link.classed("dimmed", false);
      label.style("display", "none");
      neighborNodesToggled = false;
    }
  }

  // ETC FUNCTIONALITY *****
  function updateButton(button) {
    if (!d3.select(button).classed("bttn-labels")) {
      let buttonLabel = labelsToggled ? "Hide Labels" : "Show Labels"
      labelButton.innerHTML = buttonLabel;
    }

    //********TO DO -- Add class to button to change color and made it 'active'
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

      // selected.selectAll("circle").attr("r", "15");
      // selected.selectAll("text").attr("dx", "1.5em")
      //                           .style("font", "20px helvetica");
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
      if (d.generation <= 4) {
        return "#abcb42";
      } else if (d.generation > 4 && d.generation < 7) {
        return "#feaf17";
      } else {
        return "#f35001";
      }
    });
  }


  function visitNodes(i) {
    let circles = d3.selectAll(".node circle").filter(function (d) {
      return d.rule === i;
    })
    let text = d3.selectAll(".node text").filter(function (d) {
      return d.rule === i;
    })
    
    circles.classed("ruler", true);
    circles.transition()
      .duration(50)
      .delay(750 * i)
      .style("fill", "pink");
    // text.transition()
    //   .duration(50)
    //   .delay(50 * i)
    //   .classed("hidden", false);   
  }

  function showLineOfRule() {
    if (murdersToggled || neighborNodesToggled || corulesToggled) return;
    updateButton(this);        
    if (!ruleToggled) {
      //hide all links
      link.classed("hidden", true);
      ruleToggled = true; 
      // reveal only rule links
      let links = d3.selectAll(".link-rule"); 
      links.classed("hidden", false);                   
      for (let i = 1; i < 16; i++) {
        visitNodes(i);
      }
    } else {
      colorizeNodes();      
      restoreLinks();
      ruleToggled = false;
    }
  }

  function toggleMenu () {
    let menu = document.querySelector("#menu");
    if (menu.classList.contains("menu-hidden")) {
      menu.classList.remove("menu-hidden");
      menu.classList.add("menu-show");
      menuButton.classList.remove("fa-bars");
      menuButton.classList.add("fa-angle-left");
    } else {
      menu.classList.remove("menu-show");      
      menu.classList.add("menu-hidden");
      menuButton.classList.remove("fa-angle-left");      
      menuButton.classList.add("fa-bars");
    }
  }

  const labelButton = document.querySelector(".bttn-labels");
  const murdersButton = document.querySelector(".bttn-murders");
  const corulesButton = document.querySelector(".bttn-corules");
  const lineOfRuleButton = document.querySelector(".bttn-rule");
  const menuButton = document.querySelector("#menu-icon");
  const welcomeMessage = document.querySelector("#welcome-container");

  murdersButton.addEventListener("click", showMurders);
  corulesButton.addEventListener("click", showCorules);
  labelButton.addEventListener("click", showLabels);
  lineOfRuleButton.addEventListener("click", showLineOfRule);
  menuButton.addEventListener("click", toggleMenu)
});

