<template>
    <div class="overview-container">
        <h1 class="page-title">校园水电能耗总览</h1>

        <!-- 数据卡片区域 -->
        <div class="data-cards">
            <div class="card">
                <h3>总用电量</h3>
                <div class="card-value">{{ totalElectric }} <span>kWh</span></div>
                <!-- <div class="card-trend up">↑ 5.2%</div> -->
            </div>
            <div class="card">
                <h3>总用水量</h3>
                <div class="card-value">{{ totalWater }} <span>吨</span></div>
                <!-- <div class="card-trend down">↓ 3.1%</div> -->
            </div>
            <div class="card">
                <h3>建筑物数量</h3>
                <div class="card-value">{{ buildingsCount }}</div>
            </div>
        </div> <!-- 切换按钮 -->
        <div class="chart-controls">
            <div class="time-selector">
                <button :class="{ active: timeRange === 'daily' }" @click="timeRange = 'daily'">日数据</button>
                <button :class="{ active: timeRange === 'monthly' }" @click="timeRange = 'monthly'">月数据</button>
            </div>
            <div v-if="timeRange === 'daily'" class="month-selector">
                <label>选择月份：</label>
                <select v-model="selectedMonth">
                    <option v-for="(month, index) in monthNames" :key="index" :value="index">{{ month }}</option>
                </select>
            </div>
            <div class="type-selector">
                <button :class="{ active: chartType === 'electric' }" @click="chartType = 'electric'">用电量</button>
                <button :class="{ active: chartType === 'water' }" @click="chartType = 'water'">用水量</button>
            </div>
        </div>

        <!-- 趋势图表 -->
        <div class="chart-container">
            <div class="loading-overlay" v-if="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
            <div id="trend-chart" class="chart"></div>
        </div>

        <!-- 各建筑能耗占比 -->
        <h2 class="section-title">各教学楼能耗占比</h2>
        <div class="charts-row">
            <div class="chart-container half">
                <div class="loading-overlay" v-if="loadingBuildings">
                    <div class="spinner"></div>
                    <p>加载中...</p>
                </div>
                <div id="electric-pie-chart" class="chart"></div>
            </div>
            <div class="chart-container half">
                <div class="loading-overlay" v-if="loadingBuildings">
                    <div class="spinner"></div>
                    <p>加载中...</p>
                </div>
                <div id="water-pie-chart" class="chart"></div>
            </div>
        </div>

        <!-- 建筑物列表 -->
        <h2 class="section-title">各教学楼能耗数据</h2>
        <div class="table-container">
            <div class="loading-overlay" v-if="loadingBuildings">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
            <table class="buildings-table">
                <thead>
                    <tr>
                        <th>教学楼</th>
                        <th>用电量 (kWh)</th>
                        <th>用水量 (吨)</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="building in buildings" :key="building.id">
                        <td>{{ building.name }}</td>
                        <td>{{ building.electric }}</td>
                        <td>{{ building.water }}</td>
                        <td>
                            <router-link :to="`/details?id=${building.id}`" class="view-button">详情</router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { ref, computed, onMounted, watch, onActivated, onBeforeUnmount, nextTick } from 'vue';
import { mockApi } from '../api/mockApi';

// 状态变量
const buildings = ref([]);
const dailyTrends = ref({ electric: [], water: [] });
const monthlyTrends = ref({ electric: [], water: [] });
const timeRange = ref('monthly');  // 默认显示月数据
const chartType = ref('electric');
const loading = ref(true);
const loadingBuildings = ref(true);
const selectedMonth = ref(new Date().getMonth());  // 默认为当前月份
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 图表实例
let trendChart = null;
let electricPieChart = null;
let waterPieChart = null;

// 清理图表实例
const disposeCharts = () => {
    if (trendChart) {
        trendChart.dispose();
        trendChart = null;
    }
    if (electricPieChart) {
        electricPieChart.dispose();
        electricPieChart = null;
    }
    if (waterPieChart) {
        waterPieChart.dispose();
        waterPieChart = null;
    }
};

// 计算属性
const totalElectric = computed(() => {
    return buildings.value.reduce((sum, building) => sum + building.electric, 0);
});

const totalWater = computed(() => {
    return buildings.value.reduce((sum, building) => sum + building.water, 0);
});

const buildingsCount = computed(() => buildings.value.length);

// 加载数据的方法
const loadBuildingsData = async () => {
    loadingBuildings.value = true;
    try {
        buildings.value = await mockApi.getBuildings();
        await nextTick();
        renderPieCharts();
    } catch (error) {
        console.error('加载建筑数据失败:', error);
    } finally {
        loadingBuildings.value = false;
    }
};

const loadTrendsData = async () => {
    loading.value = true;
    try {
        const [daily, monthly] = await Promise.all([
            mockApi.getDailyTrends(selectedMonth.value),
            mockApi.getMonthlyTrends()
        ]);
        dailyTrends.value = daily;
        monthlyTrends.value = monthly;
        await nextTick();
        renderTrendChart();
    } catch (error) {
        console.error('加载趋势数据失败:', error);
    } finally {
        loading.value = false;
    }
};

// 渲染趋势图表
const renderTrendChart = () => {
    const chartDom = document.getElementById('trend-chart');
    if (!chartDom) return;

    if (trendChart) {
        trendChart.dispose();
    }
    trendChart = echarts.init(chartDom);

    const data = timeRange.value === 'daily' ? dailyTrends.value : monthlyTrends.value;
    const seriesName = chartType.value === 'electric' ? '用电量' : '用水量';
    const seriesData = chartType.value === 'electric' ? data.electric : data.water;

    // 根据选择的时间范围生成x轴数据
    let xAxisData;
    if (timeRange.value === 'monthly') {
        xAxisData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    } else {
        // 生成选定月份的天数
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][selectedMonth.value];
        xAxisData = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
    } const option = {
        title: {
            text: `${timeRange.value === 'daily' ? monthNames[selectedMonth.value] : '全年'}${chartType.value === 'electric' ? '用电量' : '用水量'}趋势`,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: `{a} <br/>{b}: {c} ${chartType.value === 'electric' ? 'kWh' : '吨'}`
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: {
                lineStyle: {
                    color: '#999'
                }
            },
            axisTick: {
                alignWithLabel: true
            }
        },
        yAxis: {
            type: 'value',
            name: chartType.value === 'electric' ? 'kWh' : '吨',
            nameLocation: 'end',
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#999'
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#eee',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: seriesName,
                data: seriesData,
                type: 'line',
                smooth: true,
                symbolSize: 8,
                itemStyle: {
                    color: chartType.value === 'electric' ? '#3498db' : '#2ecc71'
                },
                lineStyle: {
                    width: 3
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: chartType.value === 'electric' ? 'rgba(52, 152, 219, 0.5)' : 'rgba(46, 204, 113, 0.5)'
                        },
                        {
                            offset: 1,
                            color: chartType.value === 'electric' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)'
                        }
                    ])
                }
            }
        ]
    };

    trendChart.setOption(option);

    // 窗口大小改变时重新调整图表大小
    window.addEventListener('resize', () => {
        if (trendChart) {
            trendChart.resize();
        }
    });
};

// 渲染饼图
const renderPieCharts = () => {
    if (buildings.value.length === 0) return;

    // 电力饼图
    const electricPieChartDom = document.getElementById('electric-pie-chart');
    if (electricPieChartDom) {
        if (electricPieChart) {
            electricPieChart.dispose();
        }
        electricPieChart = echarts.init(electricPieChartDom);
        const electricData = buildings.value.map(building => ({
            name: building.name,
            value: building.electric
        }));

        const electricOption = {
            title: {
                text: '用电量占比',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b} : {c} kWh ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'center'
            },
            series: [
                {
                    name: '用电量',
                    type: 'pie',
                    radius: '55%',
                    center: ['60%', '50%'],
                    data: electricData,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        electricPieChart.setOption(electricOption);
    }

    // 水量饼图
    const waterPieChartDom = document.getElementById('water-pie-chart');
    if (waterPieChartDom) {
        if (waterPieChart) {
            waterPieChart.dispose();
        }
        waterPieChart = echarts.init(waterPieChartDom);
        const waterData = buildings.value.map(building => ({
            name: building.name,
            value: building.water
        }));

        const waterOption = {
            title: {
                text: '用水量占比',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b} : {c} 吨 ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'center'
            },
            series: [
                {
                    name: '用水量',
                    type: 'pie',
                    radius: '55%',
                    center: ['60%', '50%'],
                    data: waterData,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        waterPieChart.setOption(waterOption);
    }

    // 窗口大小改变时重新调整图表大小
    window.addEventListener('resize', () => {
        if (electricPieChart) {
            electricPieChart.resize();
        }
        if (waterPieChart) {
            waterPieChart.resize();
        }
    });
};

// 监听图表类型、时间范围和选择的月份变化，重新加载或渲染图表
watch([chartType], () => {
    renderTrendChart();
});

watch([timeRange], () => {
    loadTrendsData();
});

watch([selectedMonth], () => {
    if (timeRange.value === 'daily') {
        loadTrendsData();
    }
});

// 组件被激活时重新加载数据
onActivated(async () => {
    await Promise.all([loadBuildingsData(), loadTrendsData()]);
});

// 组件卸载前清理图表实例
onBeforeUnmount(() => {
    disposeCharts();
});

// 页面挂载时加载数据
onMounted(async () => {
    await Promise.all([loadBuildingsData(), loadTrendsData()]);
});
</script>

<style scoped>
.overview-container {
    width: 100%;
}

.page-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: #2c3e50;
    border-left: 4px solid #3498db;
    padding-left: 12px;
}

.section-title {
    font-size: 1.4rem;
    margin: 1.5rem 0;
    color: #2c3e50;
    border-left: 4px solid #3498db;
    padding-left: 12px;
}

.data-cards {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.card {
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    flex: 1;
    min-width: 200px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.card h3 {
    font-size: 0.9rem;
    color: #7f8c8d;
    margin-bottom: 10px;
}

.card-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 5px;
}

.card-value span {
    font-size: 1rem;
    color: #7f8c8d;
}

.card-trend {
    font-size: 0.9rem;
    font-weight: 600;
}

.card-trend.up {
    color: #e74c3c;
}

.card-trend.down {
    color: #2ecc71;
}

.chart-controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 10px;
}

.time-selector,
.type-selector,
.month-selector {
    display: flex;
    gap: 10px;
    align-items: center;
}

.month-selector select {
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    font-size: 0.9rem;
}

.chart-controls button {
    padding: 8px 16px;
    background-color: #f5f7fa;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
}

.chart-controls button.active {
    background-color: #3498db;
    color: white;
    border-color: #3498db;
}

.chart-container {
    position: relative;
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 30px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    min-height: 400px;
}

.chart-container.half {
    width: calc(50% - 10px);
    min-height: 300px;
}

.charts-row {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.chart {
    width: 100%;
    height: 100%;
    min-height: 300px;
}

.buildings-table {
    width: 100%;
    border-collapse: collapse;
}

.buildings-table th,
.buildings-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.buildings-table th {
    background-color: #f8f9fa;
    color: #2c3e50;
    font-weight: 600;
}

.buildings-table tr:hover {
    background-color: #f5f7fa;
}

.view-button {
    display: inline-block;
    padding: 6px 12px;
    background-color: #3498db;
    color: white;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.9rem;
    transition: background-color 0.3s;
}

.view-button:hover {
    background-color: #2980b9;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    z-index: 10;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #eee;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.table-container {
    position: relative;
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
}

@media (max-width: 768px) {
    .chart-container.half {
        width: 100%;
    }

    .data-cards {
        flex-direction: column;
    }

    .charts-row {
        flex-direction: column;
    }
}
</style>