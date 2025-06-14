import {useCallback, useEffect, useState} from 'react';
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

const RabbitPopulationCalculator = () => {
    const [parameters, setParameters] = useState({
        initialRabbits: 2, growthRate: 3.8, carryingCapacity: 1000, years: 50
    });

    const [populationData, setPopulationData] = useState([]);

    const calculatePopulation = useCallback(() => {
        const {initialRabbits, growthRate, carryingCapacity, years} = parameters;
        const data = [];
        let currentPopulation = initialRabbits;
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
            initialRabbits: 2, growthRate: 3.8, carryingCapacity: 1000, years: 50
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
        link.setAttribute("download", "rabbit_population_data.csv");
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

    return (<div className="min-h-screen bg-gray-900 text-gray-200">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-12">
                    <a href="https://github.com/NuclearMissile/logistic-react" rel="noreferrer noopener" target="_blank">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            Rabbit Population Calculator
                        </h1>
                    </a>

                    <p className="text-gray-400 text-lg">
                        Simulate rabbit population growth dynamics using logistic growth model
                    </p>
                </div>

                {/* Formula Card */}
                <div className="bg-gray-800 border border-gray-700 p-6 mb-8">
                    <div className="text-center text-gray-200">
                        <div className="text-base font-mono">
                            Next Population = Growth Rate × Current Population × (1 - Current Population / Carrying
                            Capacity)
                        </div>
                    </div>
                </div>

                {/* Controls Card */}
                <div className="bg-gray-800 border border-gray-700 p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        {/* Initial Rabbits */}
                        <div className="space-y-3">
                            <label className="block text-gray-200 font-medium">
                                Initial Rabbits
                            </label>
                            <input
                                type="number"
                                value={parameters.initialRabbits}
                                onChange={(e) => updateParameter('initialRabbits', e.target.value)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none"
                                min="1"
                                max="1000"
                            />
                        </div>

                        {/* Growth Rate */}
                        <div className="space-y-3">
                            <label className="block text-gray-200 font-medium">
                                Growth Rate
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                max="4.0"
                                step="0.005"
                                value={parameters.growthRate}
                                onChange={(e) => updateParameter('growthRate', e.target.value)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Carrying Capacity */}
                        <div className="space-y-3">
                            <label className="block text-gray-200 font-medium">
                                Carrying Capacity
                            </label>
                            <input
                                type="number"
                                value={parameters.carryingCapacity}
                                onChange={(e) => updateParameter('carryingCapacity', e.target.value)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none"
                                min="10"
                                max="10000"
                            />
                        </div>

                        {/* Years */}
                        <div className="space-y-3">
                            <label className="block text-gray-200 font-medium">
                                Simulation Years
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                value={parameters.years}
                                onChange={(e) => updateParameter('years', e.target.value)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={resetParameters}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors"
                        >
                            Reset
                        </button>

                        <button
                            onClick={exportData}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Results */}
                {<div className="bg-gray-800 border border-gray-700 p-8">
                    <h3 className="text-xl font-bold text-white mb-6">
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
                </div>}
            </div>
        </div>);
};

export default RabbitPopulationCalculator;