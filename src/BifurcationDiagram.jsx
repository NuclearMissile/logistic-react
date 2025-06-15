import {useMemo, useState} from 'react';
import {ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis} from 'recharts';

const BifurcationDiagram = () => {
    const [parameters, setParameters] = useState({
        minGrowthRate: 2.0,
        maxGrowthRate: 4.0,
        carryingCapacity: 1000,
        initialPopulation: 100,
        settlePeriods: 1000, // 稳定期，跳过前面的过渡期
        samplePeriods: 100   // 采样期，收集振荡值
    });

    // 计算双分岔图数据
    const bifurcationData = useMemo(() => {
        const data = [];
        const {
            minGrowthRate,
            maxGrowthRate,
            carryingCapacity,
            initialPopulation,
            settlePeriods,
            samplePeriods
        } = parameters;

        // 为了保持700+数据点的密度，计算步长
        const totalPoints = 1000;
        const stepSize = (maxGrowthRate - minGrowthRate) / totalPoints;

        for (let i = 0; i <= totalPoints; i++) {
            const growthRate = minGrowthRate + i * stepSize;

            // 对每个增长率，模拟种群动态
            let population = initialPopulation;

            // 稳定期 - 让系统达到稳定状态
            for (let t = 0; t < settlePeriods; t++) {
                population = growthRate * population * (1 - population / carryingCapacity);
                population = Math.max(0, population);
            }

            // 采样期 - 收集振荡的离散值
            const oscillationValues = new Set();
            for (let t = 0; t < samplePeriods; t++) {
                population = growthRate * population * (1 - population / carryingCapacity);
                population = Math.max(0, population);

                // 四舍五入到合理精度避免浮点误差
                const roundedPop = Math.round(population * 100) / 100;
                oscillationValues.add(roundedPop);
            }

            // 将每个振荡值作为单独的数据点
            oscillationValues.forEach(value => {
                data.push({
                    growthRate: Math.round(growthRate * 1000) / 1000,
                    population: value
                });
            });
        }

        return data;
    }, [parameters]);

    const updateParameter = (key, value) => {
        setParameters(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    const resetParameters = () => {
        setParameters({
            minGrowthRate: 2.0,
            maxGrowthRate: 4.0,
            carryingCapacity: 1000,
            initialPopulation: 100,
            settlePeriods: 1000,
            samplePeriods: 100
        });
    };

    // 自定义点渲染器 - 渲染为1像素半透明点
    const CustomDot = (props) => {
        const {cx, cy} = props;
        return (
            <circle
                cx={cx}
                cy={cy}
                r={0.5}
                fill="rgba(59, 130, 246, 0.6)"
                stroke="none"
            />
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Logistic Growth Bifurcation Diagram
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Visualize population oscillation patterns across different growth rates
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-gray-800 border border-gray-700 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Min Growth Rate
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="4.0"
                                value={parameters.minGrowthRate}
                                onChange={(e) => updateParameter('minGrowthRate', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Max Growth Rate
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="4.0"
                                value={parameters.maxGrowthRate}
                                onChange={(e) => updateParameter('maxGrowthRate', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Carrying Capacity
                            </label>
                            <input
                                type="number"
                                min="100"
                                max="10000"
                                value={parameters.carryingCapacity}
                                onChange={(e) => updateParameter('carryingCapacity', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Initial Population
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={parameters.initialPopulation}
                                onChange={(e) => updateParameter('initialPopulation', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Settle Periods
                            </label>
                            <input
                                type="number"
                                min="100"
                                max="2000"
                                value={parameters.settlePeriods}
                                onChange={(e) => updateParameter('settlePeriods', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Sample Periods
                            </label>
                            <input
                                type="number"
                                min="50"
                                max="500"
                                value={parameters.samplePeriods}
                                onChange={(e) => updateParameter('samplePeriods', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={resetParameters}
                            className="px-4 py-2 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors text-sm"
                        >
                            Reset Parameters
                        </button>
                        <div className="text-sm text-gray-400 flex items-center">
                            Data points: {bifurcationData.length.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Bifurcation Diagram */}
                <div className="bg-gray-800 border border-gray-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                        Bifurcation Diagram
                    </h3>
                    <div className="text-sm text-gray-400 mb-4">
                        X-axis: Growth Rate | Y-axis: Population Oscillation Values
                    </div>

                    <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart
                                data={bifurcationData}
                                margin={{top: 20, right: 20, bottom: 20, left: 0}}
                            >
                                <XAxis
                                    type="number"
                                    dataKey="growthRate"
                                    domain={[parameters.minGrowthRate, parameters.maxGrowthRate]}
                                    name="Growth Rate"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickFormatter={(value) => value.toFixed(1)}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="population"
                                    domain={[0, parameters.carryingCapacity]}
                                    name="Population"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickFormatter={(value) => Math.round(value).toLocaleString()}
                                />
                                <Scatter
                                    data={bifurcationData}
                                    shape={CustomDot}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                        <p>• Each point represents a discrete population value in the oscillation pattern</p>
                        <p>• Different growth rates show different behaviors: stable points, cycles, or chaos</p>
                        <p>• The diagram reveals period-doubling route to chaos in logistic dynamics</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BifurcationDiagram;