import * as d3 from 'd3';
import React, { Component } from 'react';
import dataSet from './data_set.csv';

export default class Graph extends Component {

    componentWillMount() {
        //load the data from csv
        d3.csv(dataSet).then((d) => {
            let cleanData = this.cleanData(d);
            this.setState({
                data: d,
                names: cleanData.names,
                departments: cleanData.departments,
                directories: cleanData.directories,
                textSpace: 30
            });
        });
    }
    // get the names,departments,directories without duplicate
    cleanData(data) {
        let names = {},
            departments = {},
            directories = {},
            output = { names: names, departments: departments, directories };

        data.forEach((d) => {
            names[d.Mitarbeitername] = null;
            departments[d.Abteilung] = null;
            directories[d.Target.substring(1)] = null;
        });
        return output;
    }

    getSvgHeight() {
        let max = 0,
            lengths = [Object.keys(this.state.names).length, Object.keys(this.state.departments).length, Object.keys(this.state.directories).length];

        lengths.forEach((length) => {
            if (max < length)
                max = length
        });
        return max + 1;
    }

    componentDidUpdate() {
        // set hight of svg
        d3.select('svg').attr('height', (this.state.textSpace + 1) * this.getSvgHeight());
        // render elements
        this.renderWorkerNames();
        this.renderDirectories();
        this.renderDepartments();
        // connect elements
        this.connectElements();
        // set animation
        this.setHoverAnimation();
        this.setClickAnimation();
    }

    isLineConnectedToElement(lineNode, containerBox) {
        // checking the cors of connection of the lines and the elements
        // if (lineNode.attr('x1') == (containerBox.x + containerBox.width) && containerBox.y == lineNode.attr('y1') ||
        //     lineNode.attr('x2') == (containerBox.x + containerBox.width) && containerBox.y == lineNode.attr('y2')
        //     )
        if((containerBox.y <= lineNode.attr('y1') && 
            lineNode.attr('y1') <= (containerBox.y + containerBox.height) && 
            containerBox.x <= lineNode.attr('x1') && 
            lineNode.attr('x1') <= (containerBox.x + containerBox.width))
            ||
            (containerBox.y <= lineNode.attr('y2') && 
            lineNode.attr('y2') <= (containerBox.y + containerBox.height) && 
            containerBox.x <= lineNode.attr('x2') && 
            lineNode.attr('x2') <= (containerBox.x + containerBox.width)))
                return true;
        return false;
    }

    setClickAnimation() {
        let lines = d3.selectAll('.line'),
            graph = this;

        d3.selectAll('.container').on('click', function() {
            // let connectElements = graph.getConnectedElements(d3.select(this).text()),
            //     clickedElement = this;
            let clickedElement = this;
            // hide all lines that are not connected
            lines.filter(function(){
                if(!graph.isLineConnectedToElement(d3.select(this),d3.select(clickedElement).node().getBBox()))
                    return this;
            }).each(function(){
                if(d3.select(this).classed('hide'))
                    d3.select(this).classed('hide',false)
                else
                    d3.select(this).classed('hide',true);
            })
            // // hide all the other elements
            // d3.selectAll('.container').classed('hide',true);
            // Object.values(connectElements).forEach(function(nodes){
            //     nodes.each(function(){
            //         d3.select(this).classed('hide',false);
            //     });
            // });
        });
        // hide all the
    }

    getConnectedElements(clickedElement) {
        let relatedData = [], 
            connectedElements = {
            names: [],
            departments: [],
            directories: [],
            relatedData: relatedData
        },
        names = d3.selectAll('.name'),
        departments = d3.selectAll('.department'),
        directories = d3.selectAll('.directory');
        
        console.log(departments)
        
        this.state.data.forEach((data) => {
            if (clickedElement.localeCompare(data.Mitarbeitername) == 0 ||
                clickedElement.localeCompare(data.Abteilung) == 0 ||
                clickedElement.localeCompare(data.Target) == 0
            )
                relatedData.push(data);
        });

        connectedElements.names = this.getElementFromData(names,relatedData.map((d) => { return d.Mitarbeitername}));
        connectedElements.departments = this.getElementFromData(departments,relatedData.map((d) => { return d.Abteilung}));
        connectedElements.directories = this.getElementFromData(directories,relatedData.map((d) => { return d.Target.substring(1)}));
        
        return connectedElements;
    }
    
    getElementFromData(elements,data){
        return elements.filter((d) => {
            // console.log(d)
            let found = false;
            // console.log(data)
            for(let i = 0; i < data.length; i++)
                if(d.localeCompare(data[i]) == 0){
                    found = true;
                    break;
                }
            if(found)
                return d;
        });
    }

    setHoverAnimation() {
        // get all lines
        let lines = d3.selectAll('.line');
        let graph = this;
        // get all containers
        let containers = d3.selectAll('.container').on('mouseover', function() {
            let containerBox = d3.select(this).node().getBBox();
            // check the lines that conected to the container
            let cLines = lines.filter(function(d, i) {
                let lineNode = d3.select(this);
                if (graph.isLineConnectedToElement(lineNode, containerBox))
                    return this;

            }).classed('line-focus', true);

        }).on('mouseout', function() { //set the hover red effect of the lines off
            let containerBox = d3.select(this).node().getBBox();
            // check the lines that conected to the container
            let cLines = lines.filter(function(d, i) {
                let lineNode = d3.select(this);
                if (graph.isLineConnectedToElement(lineNode, containerBox))
                    return this;

            }).classed('line-focus', false);
        });
    }

    connectLineElements(src, tar) {
        d3.select('svg')
            .append('line')
            .attr('x1', src.x + src.width)
            .attr('y1', src.y + (src.height / 2))
            .attr('x2', tar.x)
            .attr('y2', tar.y + tar.height)
            .attr('class', 'line');
    }

    connectElements() {
        let namesElement = d3.selectAll('.name'),
            departmentsElement = d3.selectAll('.department').select('text'),
            directoriesElement = d3.selectAll('.directory'),
            svg = d3.select('svg');
        // itrate over all data and check which name connect to which department
        this.state.data.forEach((d) => {
            // get the text element
            let names = namesElement.filter((n) => {
                if (n === d.Mitarbeitername)
                    return n;
            });
            // get the department element
            let department = departmentsElement.filter((dep) => {
                if (dep === d.Abteilung)
                    return dep;
            });
            // connect name to department
            this.connectLineElements(names.node().getBBox(), department.node().parentNode.getBBox());
            // get the directories
            let directory = directoriesElement.filter((dir) => {
                if (dir === d.Target.substring(1))
                    return dir;
            });
            // connect department to directory
            this.connectLineElements(department.node().parentNode.getBBox(), directory.node().getBBox())
        });
    }

    renderWorkerNames() {
        let space = (this.getSvgHeight() * this.state.textSpace) / Object.keys(this.state.names).length;

        d3.select('svg').selectAll('g').data(Object.keys(this.state.names))
            .enter()
            .append("text")
            .attr('class', 'name container')
            .attr('x', 5)
            .attr('y', (d, i) => {
                return (i + 1) * space;
            })
            .text((d) => { return d; });
    }

    renderDirectories() {
        d3.select('svg').selectAll('g').data(Object.keys(this.state.directories))
            .enter()
            .append("text")
            .attr('class', 'directory container')
            .attr('x', 900)
            .attr('y', (d, i = 0) => {
                return (i + 1) * this.state.textSpace;
            })
            .text((d) => { return d; });
    }

    renderDepartments() {
        let space = (this.getSvgHeight() * this.state.textSpace) / Object.keys(this.state.departments).length;
        // set groups of departments
        let groups = d3.select('svg').selectAll('g').data(Object.keys(this.state.departments))
            .enter()
            .append("g")
            .attr('class', 'department container')
            .attr('x', 450)
            .attr('y', (d, i) => {
                return (i + 1) * space;
            });
        // set the circles inside groups
        let departmentsCircle = groups.data(Object.keys(this.state.departments))
            .append("circle")
            .attr('class', 'departments-circle')
            .attr('cx', 450)
            .attr('cy', (d, i = 0) => {
                return (i + 1) * space;
            })
            .attr('r', 5);

        // set departments names near cirlces
        groups.data(Object.keys(this.state.departments))
            .append('text')
            .attr('y', (d, i) => {
                return (i + 1) * space;
            })
            .attr('x', 460)
            .text((d) => {
                return d;

            });
    }

    render() {
        return (
            <svg id="svg-container">
            </svg>
        );
    }

}
