import {useCallback, useEffect, useState} from 'react';
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

const PopulationCalculator = () => {
    const [parameters, setParameters] = useState({
        initialPopulation: 2, growthRate: 3.8, carryingCapacity: 1000, years: 50
    });

    const [populationData, setPopulationData] = useState([]);

    const calculatePopulation = useCallback(() => {
        const {initialPopulation, growthRate, carryingCapacity, years} = parameters;
        const data = [];
        let currentPopulation = initialPopulation;
        data.push({year: 0, population: currentPopulation});

        for (let year = 1; year <= years; year++) {
            // Logistic growth model
            currentPopulation = growthRate * currentPopulation * (1 - currentPopulation / carryingCapacity);
            currentPopulation = Math.max(0, currentPopulation);

            data.push({
                year: year, population: Math.round(currentPopulation * 100) / 100
            });
        }

        setPopulationData(data);
    }, [parameters]);

    const resetParameters = () => {
        setParameters({
            initialPopulation: 2, growthRate: 3.8, carryingCapacity: 1000, years: 50
        });
        setPopulationData([]);
    };

    const exportData = () => {
        if (populationData.length === 0) {
            alert('Please calculate data first!');
            return;
        }

        let csvContent = "Year,Population\n";
        populationData.forEach(row => {
            csvContent += `${row.year},${row.population}\n`;
        });

        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "population_data.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const updateParameter = (key, value) => {
        setParameters(prev => ({
            ...prev, [key]: parseFloat(value) || parseInt(value) || 0
        }));
    };

    useEffect(() => {
        calculatePopulation();
    }, [calculatePopulation]);

    const CustomTooltip = ({active, payload, label}) => {
        if (active && payload && payload.length) {
            return (<div className="bg-gray-800 text-gray-200 p-3 border border-gray-600">
                <p className="font-medium">{`Year ${label}`}</p>
                <p className="text-blue-400">
                    {`Population: ${Math.round(payload[0].value).toLocaleString()}`}
                </p>
            </div>);
        }
        return null;
    };

    return (
        <div className="bg-gray-900 text-gray-200">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <a href="https://github.com/NuclearMissile/logistic-react" rel="noreferrer noopener"
                       target="_blank">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            Population Calculator
                        </h1>
                    </a>

                    <p className="text-gray-400 text-lg">
                        Simulate population growth dynamics using logistic growth model
                    </p>
                </div>

                {/* Controls Card */}
                <div className="bg-gray-800 border border-gray-700 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        {/* Initial Population */}
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Initial Population
                            </label>
                            <input
                                type="number"
                                value={parameters.initialPopulation}
                                onChange={(e) => updateParameter('initialPopulation', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                                min="1"
                                max="1000"
                            />
                        </div>

                        {/* Growth Rate */}
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Growth Rate
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                max="4.0"
                                step="0.1"
                                value={parameters.growthRate}
                                onChange={(e) => updateParameter('growthRate', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Carrying Capacity */}
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Carrying Capacity
                            </label>
                            <input
                                type="number"
                                value={parameters.carryingCapacity}
                                onChange={(e) => updateParameter('carryingCapacity', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                                min="100"
                                max="10000"
                            />
                        </div>

                        {/* Years */}
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Simulation Years
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                value={parameters.years}
                                onChange={(e) => updateParameter('years', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={resetParameters}
                            className="px-4 py-2 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors text-sm"
                        >
                            Reset Parameters
                        </button>

                        <button
                            onClick={exportData}
                            className="px-4 py-2 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors text-sm"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Results */}
                {<div className="bg-gray-800 border border-gray-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                        Population Growth Trend
                    </h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={populationData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                <XAxis
                                    dataKey="year"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickFormatter={(value) => Math.round(value).toLocaleString()}
                                />
                                <Tooltip content={<CustomTooltip/>}/>
                                <Line
                                    type="monotone"
                                    dataKey="population"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{fill: '#3B82F6', strokeWidth: 0, r: 3}}
                                    activeDot={{r: 5, stroke: '#3B82F6', strokeWidth: 2, fill: '#1F2937'}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                        <p>• Next Population = Growth Rate × Current Population × (1 - Current Population / Carrying
                            Capacity)</p>
                        <p>• The chart shows population changes over time based on the logistic growth model</p>
                        <p>• Different growth rates can lead to stable, oscillating, or chaotic population dynamics</p>
                        <p>• Hover over points to see exact population values for each year</p>
                    </div>
                </div>}
            </div>
        </div>
    );
};

export default PopulationCalculator;
