/**
 * Call setup function on window load event
 */
window.onload = function(){
    setup();
};


/**
 * Global variables used throughout
 */
let hoverSafetyFlag = false;
let goalsScale;
let pointsScale;
let successScale;
let svgCanvas;
let mainCircle;
let outerCircle;
//setup the initial canvas view
function setupCanvas(){
    svgCanvas = d3.select("#vis")
        // .attr("width", "1700")
        // .attr("height", "1000")
        .attr("viewBox", "0 0 1700 1000")
        .attr("preserveAspectRatio","xMinYMin meet");
    //draw the circles 
    mainCircle = svgCanvas.append("circle")
        .attr("id", "ball")
        .attr("cx", 575)
        .attr("cy", 375)
        .attr("r", 350)
        .attr("stroke", "#38003c")
        .attr("stroke-width", "10")
        .attr("fill", "#ffffff");

    mainCircle
        //bounce transition removed for final submission due to bugs
        // .attr("transform", "translate(0,-1500)")
        // .transition()
        // .attr("transform", "translate(0,0)")
        .attr("opacity", 0)
        .transition()
        .attr("opacity", 1)
        .delay(500)
        .duration(5000)
        .ease(d3.easeLinear);

    outerCircle = svgCanvas.append("circle")
        .attr("id", "filter")
        .attr("cx", 575)
        .attr("cy", 375)
        .attr("r", 500)
        .attr("stroke", "#38003c")
        .attr("stroke-width", "2")
        .attr("stroke-dasharray","2")
        .attr("fill", "none");
    outerCircle
        .attr("opacity", 0)
        .transition()
        .attr("opacity", 1)
        .delay(2000)
        .duration(3000)
        .ease(d3.easeLinear);

    zoomCircle = svgCanvas.append("circle")
        .attr("id", "outer")
        .attr("cx", 575)
        .attr("cy", 375)
        .attr("r", 350)
        .attr("stroke", "#38003c")
        .attr("stroke-width", "10")
        .attr("fill", "#ffffff")
        .attr("fill-opacity", "0");

    zoomCircle
        //bounce animation removed for final submission due to bugs
        // .attr("transform", "translate(0,-1500)")
        // .transition()
        // .attr("transform", "translate(0,0)")
        .attr("opacity", 0)
        .transition()
        .attr("opacity", 1)
        .delay(500)
        .duration(5000)
        .ease(d3.easeLinear);
}

//calculate the point locations for scaled hexagons
function calculateScaledPoints(hex, sizeScale){
    console.log(hex.points);
    // adding 200 and 90 to x and y are magic numbers for positioning hexagons correctly
    let height = (Math.sqrt(3)/2);
    let radius = sizeScale(hex.averagepoints);
    console.log(hex.averagepoints + "averagepoints of " + hex.name);
    let xPoint = hex.x +200 ;
    let yPoint = hex.y +90;
    console.log("radius", radius);

    hex.topleftx = radius/2+xPoint - radius;
    hex.toplefty = -radius*height+yPoint + radius/4 - height;

    //hexagon point algorithm resource found in references
    let newPoint = "";
    newPoint += parseInt(radius+xPoint)+","+parseInt(yPoint);
    newPoint += " "+parseInt(radius/2+xPoint)+","+parseInt(radius*height+yPoint);
    newPoint += " "+parseInt(-radius/2+xPoint)+","+parseInt(radius*height+yPoint);
    newPoint += " "+parseInt(-radius+xPoint)+","+parseInt(yPoint);
    newPoint += " "+parseInt(-radius/2+xPoint)+","+parseInt(-radius*height+yPoint);
    newPoint += " "+parseInt(radius/2+xPoint)+","+parseInt(-radius*height+yPoint);

    console.log("hex points original", hex.points);
    console.log("new scaled", newPoint);
    hex.radius = radius;
    hex.points = newPoint;
}

//generate the radar diagram for each team on hover to compare to league averages
function alterspiderchart(team, index){
    Chart.defaults.global.defaultFontFamily = 'Poppins';
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Average Points', "Top 3 Finishes", ["Player Spending(Billions)"], "Years in League", ["Player Arrivals(Hundreds)"], "Goals Scored"],
            datasets: [{
                label: "League Averages",
                backgroundColor: 'rgba(234,255,4,0.1)',
                data: [parseInt(pointsScale(46)), 2.12, 382/50, 10.86, 5.5, 10.5]
            },
            {
                label: `${team.name}`,
                backgroundColor: 'rgba(0,255,133,0.1)',
                data: [(parseInt(pointsScale(team.averagepoints))), parseInt(team.top4finishes), (parseInt(team.expenditures)/100), parseInt(team.yearsinepl), (parseInt(team.arrivals)/50), (parseInt(goalsScale(team.averagegd)))]
            }]
        },
        options: {
            legend: {
                position: 'top',
                labels:{
                    fontSize: 30,
                    fontColor: 'rgba(56,0,60,0.9)'
                }

            },
            title: {
                display: true,
                text: 'Team Performance VS League Averages',
                fontSize:30,
                fontColor: 'rgba(56,0,60,0.9)',
            },
            scale: {
                gridLines:{
                    circular: true,
                    color: 'rgba(56,0,60,0.1)',
                },
                ticks: {

                    beginAtZero: true,
                    max: 30,
                    stepSize: 10,
                    fontSize:20,
                    //display: false
                },
                pointLabels: {
                    fontSize:30,
                    fontColor: 'rgba(56,0,60,0.9)'
                }
            },

        },
    });
    console.log(team);
}
//turn the string values of expenditures into integer values scaled according to thousands, millions, or billions
function parseExpenditures(stringVal){
    var amount = stringVal.charAt(stringVal.length-1);
    var intVal =  parseFloat(stringVal.slice(1,-1));
    switch (amount) {
        case "n":
            intVal = intVal * 1000;
            break;
        case "k":
            intVal = intVal / 1000;
    }
    return intVal;
}
//draw the names around the outer circle and add hover methods, generate radar diagram on hover
function drawRectangles(hexjson){
    let teams = hexjson.hexes;
    //magic numbers of circle x and y
    for (let i in teams){
        //magic numbers: 49 = number of teams
        //magic numbers: 575 = radius of outer circle
        //width and height randomly set
        let angle = ((i/(49/2)) * Math.PI);
        let elementX= 575 + ((630)*Math.sin(angle));
        // elementX = (elementX < 512) ? elementX - 200 : elementX + 50;
        let textAnchorEnd = "start";
        if (elementX < 543){textAnchorEnd = "end";}
        if (( 574 < elementX) && ( elementX < 616)){textAnchorEnd = "middle";}
        console.log(elementX);

        let elementY = 375 + ((520) * Math.cos(angle));
        if(elementY < -135.5){
            elementY = elementY - 20;
            if(elementX > 534 && elementX < 616){
                elementX = elementX + 45;
            }
        }
        if(elementY > 890){
            if(elementY >= 894){
                elementY = elementY + 10;
            }
            elementY = elementY + 20;

        }
        //convert the expenditures so they can be used as values
        teams[i].expendituresString = teams[i].expenditures;
        teams[i].expenditures = parseExpenditures(teams[i].expenditures);
        //Stubbed out opacity change transition which will add time, gives bugs so can't use
        let opacityChange = d3.transition()
        //     .duration(100)
        //     .ease(d3.easeLinear);
        //add all the team labels around the circle with correct hover interactions
        //greyed out by default and color when team icon or label is hovered on
        //on hover the detailed graph of the team is displayed
        let labelContainer = svgCanvas.append("text")
            .attr("id", `${teams[i].name}label`.replace(/ /g,''))
            .attr("class", "teamLabels")
            .attr("x", elementX)
            .attr("y", elementY)
            .text(teams[i].name)
            .attr("fill", "gray")
            .attr("fill-opacity", "0.3")
            .attr("text-anchor", function(){
                return textAnchorEnd;
             })
            .on('mouseover', function(d){
                if(!hoverSafetyFlag){
                    hoverSafetyFlag = true;
                    d3.select(this).attr("fill",'#38003c')
                        .attr("fill-opacity", "1");
                    d3.select(`#line${i}`).attr("visibility", "visible");
                    d3.select(`#zoom`)
                        .attr("class", "visible")
                        .style("fill-opacity", "1");
                    d3.selectAll(`#outer`)
                        .attr("r", 450);
                    d3.select(`#innerimage${i}`)
                        .style("opacity", "1");
                    alterspiderchart(teams[i],i);
                    d3.select("#myChart")
                        .attr("class", "visible")
                        .style("opacity", "1");
                    d3.select("#ball")
                        .style("opacity", "0");
                    console.log("hover");
                }
            })
            .on('mouseout', function(d){
                d3.select(this).attr("fill",'gray')
                    .attr("fill-opacity", "0.3");
                d3.select(`#line${i}`).attr("visibility", "hidden");
                d3.select(`#zoom`)
                    .attr("class", "invisible")
                    .style("fill-opacity", "0");
                d3.selectAll('.teamLabels')
                    .attr("fill",'gray')
                    .attr("fill-opacity", "0.3");
                d3.selectAll(`#outer`)
                    .attr("r", 350);
                for(let j=0; j<49; j++){
                    d3.select(`#innerimage${j}`)
                        .style("opacity", "0");
                }
                // d3.select(`#innerimage${i}`)
                //     .style("opacity", "0");
                d3.select("#myChart")
                    .attr("class", "invisible")
                    .style("opacity", "0");
                d3.select("#ball")
                    .style("opacity", "1");
                d3.select("#messageTwo")
                    .style("opacity", "0");
                console.log("hover");
                hoverSafetyFlag = false;
                // Selection.select("text").style({opacity:'1.0'});
             });
        labelContainer
            .attr("opacity", 0)
            .transition()
            .attr("opacity", 1)
            .delay(2000)
            .duration(3000)
            .ease(d3.easeLinear);
        //runs when the user clicks on the graph for a second time after clicking on the team logo
        let clickleave = d3.select("#myChart")
            .on("click", function(){
                d3.select(`#zoom`)
                    .attr("class", "invisible")
                    .style("fill-opacity", "0");
                d3.selectAll(`#outer`)
                    .attr("r", 350);
                d3.selectAll('.teamLabels')
                    .attr("fill",'gray')
                    .attr("fill-opacity", "0.3");
                for(let j=0; j<49; j++){
                    d3.select(`#innerimage${j}`)
                        .style("opacity", "0");
                }
                d3.select("#myChart")
                    .attr("class", "invisible")
                    .style("opacity", "0");
                d3.select("#ball")
                    .style("opacity", "1");
                d3.select("#messageTwo")
                    .style("opacity", "0");
                console.log("hover");
                hoverSafetyFlag = false;
            });
        //circle containing the radar graph which is hidden
        let zoomInCircle = svgCanvas.append("circle")
            .attr("id", "zoom")
            .attr("cx", 575)
            .attr("cy", 375)
            .attr("r", 350)
            .attr("stroke", "none")
            .attr("stroke-width", "0")
            .attr("fill", "#ffffff")
            .attr("class", "invisible")
            .attr("fill-opacity", "0");
        //team logo at the top of the circle
        let teamLogo = svgCanvas.append("svg:image")
            .attr("id", `innerimage${i}`)
            .attr("width",100)
            // .attr("height",200)
            .attr('x', 525)
            .attr('y', -110)
            .attr("xlink:href", "./images/" + teams[i].name + ".svg")
            .attr("opacity", "0");
        //stat to the left of the team logo
        let statOne = svgCanvas.append("text")
            .attr("id", `spending${i}`)
            .attr("x", 100)
            .attr("y", -50)
            .append('tspan')
            .attr("id", `spending${i}title`)
            .attr("x",375)
            .attr("dy",5)
            .attr("fill", "#38003c")
            .attr("opacity", "0")
            // .attr("fill-opacity", "0.3")
            .text('Player Spending')
            .append('tspan')
            .attr("id", `spending${i}amount`)
            .attr("x",405)
            .attr("dy",20)
            .text(teams[i].expendituresString)
            .attr("fill", "#38003c")
            .attr("opacity", "0");
            // .attr("fill-opacity", "0.3")
            // .attr("text-anchor", "middle");
        //stat to the right of the team logo
        let statTwo = svgCanvas.append("text")
            .attr("id", `points${i}`)
            .attr("x", 643)
            .attr("y", -50)
            .append('tspan')
            .attr("id", `points${i}title`)
            .attr("x",643)
            .attr("dy",5)
            .attr("fill", "#38003c")
            .attr("opacity", "0")
            // .attr("fill-opacity", "0.3")
            .text('Success Score')
            .append('tspan')
            .attr("id", `points${i}amount`)
            .attr("x",687)
            .attr("dy",18)
            .text(`${parseInt(successScale(teams[i].averagepoints))}/10`)
            .attr("fill", "#38003c")
            .attr("opacity", "0");

        let helperInfo = svgCanvas.append("text")
            .attr("id", `message`)
            .attr("x", 510)
            .attr("y", 80)
            .attr("fill", "#38003c")
            .attr("opacity", "0")
            .text('(Click For More Detail)');

        let helperInfoTwo = svgCanvas.append("text")
            .attr("id", `messageTwo`)
            .attr("x", 510)
            .attr("y", 100)
            .attr("fill", "#38003c")
            .attr("opacity", "0")
            // .attr("fill-opacity", "0.3")
            .text('(Click on Graph to Exit)')
    }
}
//initial visualization setup
function setup(){
    //read in the soccer player csv data
    d3.csv("stats_and_expenses.csv").then(function(data){
        setupCanvas();
        //read in the hexJson file
        d3.json("test2.hexjson").then(function(hexjson){
            console.log(hexjson);
            console.log(data);
            // Set the size and margins of the svg
            var margin = {top: 10, right: 10, bottom: 10, left: 10},
                width = 750 - margin.left - margin.right,
                height = 750 - margin.top - margin.bottom;
            // Create the svg element
            var svg = d3
                .select("#vis")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("overflow", "visible")
                .append("g");

            // Render the hexes
            var hexes = d3.renderHexJSON(hexjson, width, height);

            // Bind the hexes to g elements of the svg and position them
            var hexmap = svg
                .selectAll("g")
                .data(hexes)
                .enter()
                .append("g")
                .attr("transform", function(hex) {
                    // console.log(hex, "hexxxxx");
                    return "translate(" + 0 + "," + 20 + ")";
                });

            hexmap
                //bounce animation removed on final submission due to bugs
                // .attr("transform", "translate(0,-1500)")
                // .transition()
                // .attr("transform", "translate(0,20)")
                .attr("opacity", 0)
                .transition()
                .attr("opacity", 1)
                .delay(500)
                .duration(3000)
                .ease(d3.easeLinear);


            //create the size scale
            let sizeScale = d3.scalePow()
                .exponent(2)
                .domain([0, d3.max(data, function(d) { return parseInt(d.averagepoints); })])
                .range([20, 70]);
            //color scale code modified from Tutorial 5 sample template
            let colorScale = d3.scaleQuantize()
                .domain([d3.min(data, function(d) { return parseInt(d.averagepoints); }), d3.max(data, function(d) { return parseInt(d.averagepoints); })])
                .range(["#F7977A", "#FFF79A", "#FFF79A",  "#8be8ae" ]);
            //scale the goal differential values to fit in the radar chart
            goalsScale = d3.scaleLinear()
                .domain([d3.min(data, function(d) { return parseInt(d.averagegd); }), d3.max(data, function(d) { return parseInt(d.averagegd); })])
                .range([0, 30]);
            //scale the point values to fit in the radar chart
            pointsScale = d3.scaleLinear()
                .domain([d3.min(data, function(d) { return parseInt(d.averagepoints); }), d3.max(data, function(d) { return parseInt(d.averagepoints); })])
                .range([5, 30]);
            //scale the success values to be from 0-10
            successScale = d3.scaleLinear()
                .domain([d3.min(data, function(d) { return parseInt(d.averagepoints); }), d3.max(data, function(d) { return parseInt(d.averagepoints); })])
                .range([1, 10]);

            // Draw the polygons around each hex's centre
            hexmap
                .append("polygon")
                .attr("id", function(hex){return `hex${hex.id}`})
                .attr("points", function(hex) {calculateScaledPoints(hex, sizeScale); return hex.points;})

                .attr("fill", function(hex) {return colorScale(hex.averagepoints);})
                .attr("fill-opacity", 0.9)
                .on('click', function(hex){hexClick(hex);})
                .on('mouseover', function(hex){outerMouseOver(hex);})
                .on('mouseout', function(hex){outerMouseLeave(hex);});
            //add the team logo's to the hexagons
            hexmap.append("svg:image")
                .attr("width",function(hex) {return hex.radius})
                .attr('x', function(hex) {return hex.topleftx})
                .attr('y', function(hex) {return hex.toplefty})
                .on('click', function(hex){hexClick(hex);})
                .on('mouseover', function(hex){outerMouseOver(hex);})
                .on('mouseout', function(hex){outerMouseLeave(hex);})
                .attr("xlink:href", function(hex) {
                    return "./images/" + hex.name + ".svg";
                });
            //when the team logo or hexagon is hovered over display additional info
            function outerMouseOver(hex){
                console.log("hover");
                console.log(hex.name);
                d3.select(`#${hex.name}label`.replace(/ /g,''))
                    .attr("fill",'#38003c')
                    .attr("fill-opacity", "1");
                d3.select(`#hex${hex.id}`)
                    .attr("stroke", "#38003c")
                    .attr("stroke-width", "2");
                d3.select(`#innerimage${hex.id}`)
                    .style("opacity", "1");
                d3.select(`#spending${hex.id}`)
                    .style("opacity", "1");
                d3.select(`#spending${hex.id}title`)
                    .style("opacity", "1");
                d3.select(`#spending${hex.id}amount`)
                    .style("opacity", "1");
                d3.select(`#points${hex.id}`)
                    .style("opacity", "1");
                d3.select(`#points${hex.id}title`)
                    .style("opacity", "1");
                d3.select(`#points${hex.id}amount`)
                    .style("opacity", "1");
                d3.select(`#message`)
                    .style("opacity", "1");
            }
            //Hide the additional info when the hexagon or logo is no longer hovered over
            function outerMouseLeave(hex){
                d3.select(`#spending${hex.id}`)
                    .style("opacity", "0");
                d3.select(`#spending${hex.id}title`)
                    .style("opacity", "0");
                d3.select(`#spending${hex.id}amount`)
                    .style("opacity", "0");
                d3.select(`#points${hex.id}`)
                    .style("opacity", "0");
                d3.select(`#points${hex.id}title`)
                    .style("opacity", "0");
                d3.select(`#points${hex.id}amount`)
                    .style("opacity", "0");
                d3.select(`#hex${hex.id}`)
                    .attr("stroke", "none")
                    .attr("stroke-width", "0");
                d3.select(`#message`)
                    .style("opacity", "0");
                if(!hoverSafetyFlag){
                    d3.select(`#${hex.name}label`.replace(/ /g,''))
                        .attr("fill",'gray')
                        .attr("fill-opacity", "0.3");
                    d3.select(`#innerimage${hex.id}`)
                        .style("opacity", "0");
                    d3.select(`#messageTwo`)
                        .style("opacity", "0");
                }
            }
            //display the radar chart when the hexagon or team logo is clicked on
            function hexClick(hex){
                if(!hoverSafetyFlag){
                    hoverSafetyFlag = true;
                    d3.select(`#${hex.name}label`.replace(/ /g,''))
                        .attr("fill",'#38003c')
                        .attr("fill-opacity", "1");
                    d3.select(`#line${hex.id}`).attr("visibility", "visible");
                    d3.select(`#zoom`)
                        .attr("class", "visible")
                        .style("fill-opacity", "1");
                    d3.selectAll(`#outer`)
                        .attr("r", 450);
                    d3.select(`#innerimage${hex.id}`)
                        .style("opacity", "1");
                    alterspiderchart(hex,hex.id);
                    d3.select("#myChart")
                        .attr("class", "visible")
                        .style("opacity", "1");
                    d3.select("#ball")
                        .style("opacity", "0");
                    d3.select(`#messageTwo`)
                        .style("opacity", "1");
                    // d3.selectAll("polygon").attr("visibility", "hidden");
                    console.log("click");
                }
            }
            //draw the names around the outer circle
            drawRectangles(hexjson);
        });
    });

}
