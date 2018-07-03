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
    }

    setHoverAnimation() {
        // get all lines
        let lines = d3.selectAll('.line');
        // get all containers
        let containers = d3.selectAll('.container').on('mouseover', function() {
            let containerBox = d3.select(this).node().getBBox();
            // check the lines that conected to the container
            let cLines = lines.filter(function(d, i) {
                let lineNode = d3.select(this);
                // checking the cors of the left side connection of the lines and the elements
                if (lineNode.attr('x1') <= (containerBox.x + containerBox.width) && containerBox.x <= lineNode.attr('x1'))
                    if (lineNode.attr('y1') <= (containerBox.y + containerBox.height + 5) && containerBox.y <= lineNode.attr('y1')) 
                        return this;
            
            }).attr('class','line-focus');
                        
        }).on('mouseout', function() {
            console.log('out')
        });
        // get all lines that conected to the contatiner
        // set the lines color to red
        // get all the containers that are conected on the other side of the lines
        // make the text inside the container red
    }
    
    connectLineElements(src,tar){
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
            this.connectLineElements(names.node().getBBox(),department.node().parentNode.getBBox());
            // get the directories
            let directory = directoriesElement.filter((dir) => {
                if (dir === d.Target.substring(1))
                    return dir;
            });
            // connect department to directory
            this.connectLineElements(department.node().parentNode.getBBox(),directory.node().getBBox())
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
