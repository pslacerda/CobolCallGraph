(function(d3) {
    var generator = {
        width : 1000,
        height: 800,
        searchedText: false,
        circle: {},
        path: {},
        text: {},

        setSearchInput: function(selector) {
            var that = this;
            that.input = d3.select(selector)[0][0];
            d3.select(selector).on('keypress', function() {
                that.searchedText = that.input.value;
                that.tick();
            });
        },
        draw: function (nodes, links) {
            this.force = d3.layout.force()
                .nodes(d3.values(nodes))
                .links(links)
                .size([this.width, this.height])
                .linkDistance(150)
                .charge(-300)
                .on("tick", this.tick)
                .start();
            
            this.svg = d3.select("#drawarea").append("svg")
                .attr("width", this.width)
                .attr("height", this.height);
            
            // Per-type markers, as they don't inherit styles.
            this.svg.append("defs").selectAll("marker")
                .data(['1', '2', '3'])
                .enter()
                .append("marker")
                .attr("id", function(d) { return d; })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 15)
                .attr("refY", -1.5)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");
            
            this.path = this.svg.append("g").selectAll("path")
                .data(this.force.links())
                .enter().append("path")
                .attr("class", function(d) { return "link " + d.type; })
                .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
            
            this.circle = this.svg.append("g").selectAll("circle")
                .data(this.force.nodes())
                .enter().append("circle")
                .attr("r", 6)
                .attr("data", function(d) { return d.id;})
                .call(this.force.drag);
            
            this.text = this.svg.append("g").selectAll("text")
                .data(this.force.nodes())
                .enter().append("text")
                .attr("x", 8)
                .attr("y", ".31em")
                .text(function(d) { return d.name; });
        },

        transform: function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        },
        linkArc: function (d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        },
        tick: function () {
          var that = generator;
          that.path.attr("d", generator.linkArc);
          that.circle.attr("transform", generator.transform);
          that.text.attr("transform", generator.transform);
            var cssClass = '';
          if (that.searchedText) {
              that.circle.attr("class", function(d) { 
                  return d.name.toUpperCase().indexOf(that.searchedText.toUpperCase()) > -1 ?"selected":"unselected";
              }).attr("transform", generator.transform);
          } else {
              that.circle.attr("class", "unselected").attr("transform", generator.transform);
          }
        } // tick
    };

    window.d3generator = generator;
})(d3);
