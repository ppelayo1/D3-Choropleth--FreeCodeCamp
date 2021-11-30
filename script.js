//constants
const URLS = {education:'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json',
              counties:'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'
};

const FILL_COLORS = {
        //colors taken from the free code camp heat map from lightest to darkest
        /*               3%        12%       21%       30%         39%        48%       57%       66%  */
        colors:['#ffffff','#e5f5e0','#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45','#006d2c','#00441b'],
        boundries: [3,12,21,30,39,48,57,66]
};

//CONSTANTS to control the heatMap, acts as a form of options as well
const CONSTANTS = {
    URLS:URLS,
    SVG_WRAPPER_ID:'#graphWrapper',
    HEIGHT:400,
    WIDTH:900,
    SCALE:{
        x:0.009,
        y:0.0035
    },
    COLORS:FILL_COLORS
};

//The heatMap class
class ChoroplethMap{
    constructor(dataSet){
        
        
        //instantiate class variables
        this._instantVar(dataSet);
        
        //build the toolTip
        this._buildToolTip();

        //build the graph
        this._buildGraph(this.geoJson);

        //Color Legend
        this._buildLegend();
    }
    
    //instantitate variables
    _instantVar(dataSet){
        this.education = dataSet.education[0];
        this.counties = dataSet.counties[0];
       
        //set the scales
        this.counties.transform.scale[0] = CONSTANTS.SCALE.x;
        this.counties.transform.scale[1] = CONSTANTS.SCALE.y;
        
        //convert and store the geoObject
        this.geoJson = topojson.feature(this.counties,this.counties.objects.counties).features;
    }
    
    //builds a toolTip, places a div on the body
    _buildToolTip(){
        d3.select('body')
        .append('div')
        .attr('id','tooltip')
        .style('opacity',0);
    }
    
    //Builds the graph
    _buildGraph(geoJson){
        
        
        //build the svg element
        let svg = d3.select('#graphWrapper')
            .append('svg')
            .attr('width',CONSTANTS.WIDTH)
            .attr('height',CONSTANTS.HEIGHT);

        //draw counties
        svg.selectAll('path')
            .data(geoJson)
            .enter()
            .append('path')
            .attr('fill',(d,i)=>this._getColorIndex(d.id))
            .attr('class','county')
            .attr('data-fips',d=>{return this.education[this._getGeoJsonIndex(d.id)].fips})
            .attr('data-education',d=>{return this.education[this._getGeoJsonIndex(d.id)].bachelorsOrHigher})
            .attr('d',d3.geoPath())
            .on('mouseover',addToolTip)
            .on('mouseout',removeToolTip);
        
        
        //needed for toolTip
        let educationArray = this.education;
        
        //adds the tool tip
        function addToolTip(d){
            let toolTip = d3.select('#tooltip');
            let xPos = d3.event.clientX;
            let yPos = d3.event.clientY;
            let leftPadding = 20;
            let id = d.id; //ID from the geoJson
            let index = 0;     //The index to count thru the education array
            let loop = true;
            let countyName = '';
            let bachelorsOrHigher;
            let state = '';
            
            //need to find the right index, and assign the needed values, fips is ID in the education array
            do{
               if(id == educationArray[index].fips){
                   countyName = educationArray[index].area_name;
                   bachelorsOrHigher = educationArray[index].bachelorsOrHigher;
                   state = educationArray[index].state;
                   loop = false;
               } 
            index++;
            }while(loop)
            
            toolTip.style('opacity',0.85);
            toolTip.attr('data-education',bachelorsOrHigher)
            toolTip.html(countyName + ', ' + state + ': ' + bachelorsOrHigher + '%');
            toolTip.style('left',d3.touches);
            toolTip.style('left',xPos + leftPadding + 'px');
            toolTip.style('top',yPos + 'px');
        }
        
        //removes the tool tip
        function removeToolTip(d,index){
            let toolTip = d3.select('#tooltip');
            toolTip.style('opacity',0);
        }  
    }
    
    //returns the index to use for a counties color
    _getColorIndex(countyID){
        //variables
        let loop = true;
        let i = 0;
        let color ='';
        
        //fips is the ID in the education array
        do{
            if(countyID == this.education[i].fips){
                loop = false;
                
                //find the color to use
                for(let j = 0; j < CONSTANTS.COLORS.boundries.length; j++){
                    let bachelorsOrHigher = Math.ceil(this.education[i].bachelorsOrHigher);
                    
                    if(j == 0){
                        if(bachelorsOrHigher < CONSTANTS.COLORS.boundries[j])
                            color = CONSTANTS.COLORS.colors[j];
                    }
                    if(j > 0){
                        if(bachelorsOrHigher >= CONSTANTS.COLORS.boundries[j - 1] && bachelorsOrHigher < CONSTANTS.COLORS.boundries[j]){
                            color = CONSTANTS.COLORS.colors[j];
                        }
                    }
                }
            }
            i++;
        }while(loop)
            return color;
    }
    
    
    
    //Builds the legend for the chart
    _buildLegend(){
        let svg = d3.select('svg');
        let legend = svg.append('g');

        legend.attr('id','legend');
        legend.attr('transform','translate(560,12)')
        legend.append('text').text('Temperature Key').attr('x',35);

        for(let i = 1; i < CONSTANTS.COLORS.colors.length;i++){
            legend.append('rect').attr('width',30).attr('height',10).attr('x',i * 30).attr('y',5).attr('fill',CONSTANTS.COLORS.colors[i]);
            if(CONSTANTS.COLORS.boundries.length > i){
                if(i==1){
                    legend.append('text').html(CONSTANTS.COLORS.boundries[i - 1] + '%').attr('x',i * 30 ).attr('y',25).style('font-size','8px').style('font-weight','bold');
                }
                legend.append('text').html(CONSTANTS.COLORS.boundries[i] + '%').attr('x',i * 30 + 25).attr('y',25).style('font-size','8px').style('font-weight','bold');
            }
        }
    }
    
    //finds the index that matches the educationArray with the inputed id for a geoJSON array
    _getGeoJsonIndex(id){
        //variables
        let index = 0;     //The index to count thru the education array
        let loop = true;
        
        //need to find the right index, and assign the needed values, fips is ID in the education array
        do{
           if(id == this.education[index].fips){
               loop = false;
           }else{
               index++;
           }
            
        }while(loop)
            
        return index;
    }

}

$(document).ready(function (){
    let choroplethMap;
    //xhttp calls
    let xhttp = {
        url:CONSTANTS.URLS.education,
        dataType:'json'
    };
    let xhttp2 = {
        url:CONSTANTS.URLS.counties,
        dataType:'json'
    };

    let callBack = function (educ,count) {
        let dataSet = {
            education:educ,
            counties:count
        };
         
        choroplethMap = new ChoroplethMap(dataSet);
    }

    //make the xhttp call
    $.when($.get(xhttp),$.get(xhttp2)).done(callBack);
});