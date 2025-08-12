import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';

interface GraphData {
  name: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: GraphData[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const maxValue = data.reduce((max, item) => Math.max(max, item.value), 0);
  const maxPercentage = (maxValue / total) * 100;
  const maxPercentageWithMargin =
    maxPercentage + 10 < 100 ? maxPercentage + 10 : 100;

  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(2),
  }));

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const minWidth = 350;
        const chartWidth = Math.max(containerWidth, minWidth);
        const barHeight = 60;
        const totalBars = data.filter((d) => d.value > 0).length;
        const minHeight = Math.max(totalBars * barHeight, 200);

        setDimensions({
          width: chartWidth,
          height: minHeight + 100,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || dimensions.width === 0) return;

    const svg = d3.select(chartRef.current);
    const margin = {
      top: 10,
      right: dimensions.width < 600 ? 40 : 60,
      bottom: 60,
      left: dimensions.width < 600 ? 80 : 140,
    };

    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sortedData = [...dataWithPercentage]
      .sort((a, b) => b.value - a.value)
      .filter((d) => d.value > 0);

    const x = d3
      .scaleLinear()
      .domain([0, maxPercentageWithMargin])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.name))
      .range([margin.top, height])
      .padding(0.25);

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(-(height - margin.top))
          .tickFormat(() => '')
      )
      .attr('color', 'gray')
      .attr('stroke-opacity', 0.3)
      .style('stroke-dasharray', '2,2')
      .selectAll('line')
      .attr('stroke', 'gray');

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', dimensions.width < 600 ? '13px' : '15px')
      .style('font-weight', '500')
      .style('fill', '#334155')
      .attr('dy', '1.5em');

    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + 50)
      .style('font-size', dimensions.width < 600 ? '15px' : '17px')
      .style('font-weight', '600')
      .style('fill', '#1e293b')
      .text('Porcentaje');

    const yAxisGroup = g.append('g').call(d3.axisLeft(y));

    yAxisGroup
      .selectAll('text')
      .style('font-size', dimensions.width < 600 ? '14px' : '16px')
      .style('font-weight', '600')
      .style('fill', '#1e293b')
      .each(function () {
        const text = d3.select(this);
        const textContent = text.text();
        const maxLength = dimensions.width < 600 ? 12 : 18;

        if (textContent.length > maxLength) {
          text.text(textContent.substring(0, maxLength - 3) + '...');
          // Add title attribute for tooltip
          text.append('title').text(textContent);
        }
      });

    g.selectAll('.bar')
      .data(sortedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d) => y(d.name) || 0)
      .attr('height', y.bandwidth())
      .attr('fill', (d) => d.color)
      .attr('x', 0)
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (d) => x(parseFloat(d.percentage)));

    g.selectAll('.percentage-label')
      .data(sortedData)
      .enter()
      .append('text')
      .attr('class', 'percentage-label')
      .attr('y', (d) => (y(d.name) || 0) + y.bandwidth() / 3)
      .attr('x', (d) => Math.max(x(parseFloat(d.percentage)) + 8, 30))
      .attr('dy', '.35em')
      .style('font-size', dimensions.width < 600 ? '15px' : '17px')
      .style('font-weight', '700')
      .style('fill', '#0f172a')
      .style('letter-spacing', '0.5px')
      .text((d) => `${d.percentage}%`);

    g.selectAll('.values-label')
      .data(sortedData)
      .enter()
      .append('text')
      .attr('class', 'values-label')
      .attr('y', (d) => (y(d.name) || 0) + (y.bandwidth() * 2) / 3)
      .attr('x', (d) => Math.max(x(parseFloat(d.percentage)) + 8, 30))
      .attr('dy', '.35em')
      .style('font-size', dimensions.width < 600 ? '13px' : '15px')
      .style('font-weight', '600')
      .style('fill', '#475569')
      .style('letter-spacing', '0.3px')
      .text((d) => `${d.value?.toLocaleString()} votos`);
  }, [dataWithPercentage, dimensions]);

  if (data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-slate-600">
        No hay datos
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        ref={chartRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ minWidth: '350px' }}
      />
    </div>
  );
};

export default BarChart;
