<template>
    <div class="details-container">
        <div v-if="!buildingData">
            <div class="loading-container" v-if="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
            <div class="no-data" v-else>
                <h2>未找到建筑物数据</h2>
                <router-link to="/" class="back-link">返回总览</router-link>
            </div>
        </div>

        <template v-else>
            <div class="header">
                <h1 class="page-title">{{ buildingData.name }} - 能耗详情</h1>
                <router-link to="/" class="back-link">返回总览</router-link>
            </div>

            <!-- 数据卡片区域 -->
            <div class="data-cards">
                <div class="card">
                    <h3>本月用电量</h3>
                    <div class="card-value">{{ calculateMonthlyTotal('electric') }} <span>kWh</span></div>
                    <!-- <div class="card-comparison">
                        比上月 {{ calculateMonthlyComparison('electric') > 0 ? '+' : '' }}{{
                            calculateMonthlyComparison('electric') }}%
                    </div> -->
                </div>
                <div class="card">
                    <h3>本月用水量</h3>
                    <div class="card-value">{{ calculateMonthlyTotal('water') }} <span>吨</span></div>
                    <!-- <div class="card-comparison">
                        比上月 {{ calculateMonthlyComparison('water') > 0 ? '+' : '' }}{{
                            calculateMonthlyComparison('water') }}%
                    </div> -->
                </div>
                <div class="card">
                    <h3>本月电费预估 ¥0.6/kWh</h3>
                    <div class="card-value">¥{{ calculateElectricCost() }}</div>
                </div>
                <div class="card">
                    <h3>本月水费预估 ¥4/吨</h3>
                    <div class="card-value">¥{{ calculateWaterCost() }}</div>
                </div>
            </div> <!-- 数据选择器 -->
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
                    <button :class="{ active: dataType === 'electric' }" @click="dataType = 'electric'">用电量</button>
                    <button :class="{ active: dataType === 'water' }" @click="dataType = 'water'">用水量</button>
                </div>
            </div> <!-- 趋势图表 -->
            <div class="chart-container">
                <div class="loading-overlay" v-if="chartLoading">
                    <div class="spinner"></div>
                    <p>加载中...</p>
                </div>
                <div id="trend-chart" class="chart"></div>
            </div>

            <!-- 数据分析区域 -->
            <h2 class="section-title">能耗分析报告</h2>
            <div class="analysis-container">
                <div class="analysis-card">
                    <h3>能耗特点</h3>
                    <p>{{ buildingData.name }}在{{ getTimeRangeName }}期间{{ dataType === 'electric' ? '用电' : '用水' }}总体呈现{{
                        getTrend }}趋势。</p>
                    <p>{{ getAnalysisContent }}</p>
                </div>
                <div class="analysis-card">
                    <h3>节能建议</h3>
                    <div>
                        <p>根据近期数据分析，建议采取以下措施：</p>
                        <ul>
                            <li v-if="dataType === 'electric'">优化照明系统，避免不必要的能源浪费</li>
                            <li v-if="dataType === 'electric'">调整空调温度设置，减少高峰期用电</li>
                            <li v-if="dataType === 'electric'">检查电器设备是否存在待机能耗问题</li>
                            <li v-if="dataType === 'water'">检查水管系统，排除潜在漏水隐患</li>
                            <li v-if="dataType === 'water'">优化用水时间分布，避免高峰期集中用水</li>
                            <li v-if="dataType === 'water'">考虑安装节水设备，提高用水效率</li>
                        </ul>
                    </div>

                </div>
            </div>

            <!-- 报告生成区域 -->
            <h2 class="section-title">能耗报告</h2>
            <div class="report-container">
                <div class="form-group">
                    <label>报告标题</label>
                    <input type="text" v-model="reportTitle" placeholder="输入报告标题">
                </div>
                <div class="form-group">
                    <label>报告类型</label>
                    <select v-model="reportType">
                        <option value="daily">日报告</option>
                        <option value="monthly">月报告</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>报告备注</label>
                    <textarea v-model="reportNotes" placeholder="输入报告备注内容"></textarea>
                </div>
                <button class="submit-button" @click="submitReport" :disabled="isSubmitting">
                    <span v-if="isSubmitting">生成中...</span>
                    <span v-else>生成报告</span>
                </button>

                <div class="success-message" v-if="submitSuccess">
                    {{ submitMessage }}
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { ref, computed, onMounted, watch, onActivated, onBeforeUnmount, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { mockApi } from '../api/mockApi';

// 路由参数
const route = useRoute();
const buildingId = computed(() => Number(route.query.id) || 0);

// 状态变量
const buildingData = ref(null);
const loading = ref(true);
const chartLoading = ref(true); // 图表加载状态
const timeRange = ref('daily');
const dataType = ref('electric');
const isSubmitting = ref(false);
const submitSuccess = ref(false);
const submitMessage = ref('');
const selectedMonth = ref(new Date().getMonth());  // 默认为当前月份
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const monthlyDailyData = ref({ electric: [], water: [] });

// 报告表单数据
const reportTitle = ref('');
const reportType = ref('monthly');
const reportNotes = ref('');

// 计算属性
const getTimeRangeName = computed(() => {
    return timeRange.value === 'daily' ? '每日' : '每月';
});

const getTrend = computed(() => {
    if (!buildingData.value) return '';

    const data = getData();
    if (!data || data.length < 2) return '平稳';

    // 简单计算趋势：比较最后三个数据点与前三个数据点的平均值
    const l = data.length;
    const recentAvg = (data[l - 1] + data[l - 2] + data[l - 3]) / 3;
    const earlierAvg = (data[0] + data[1] + data[2]) / 3;

    const diff = recentAvg - earlierAvg;
    if (Math.abs(diff) / earlierAvg < 0.05) return '平稳';
    return diff > 0 ? '上升' : '下降';
});

const getAnalysisContent = computed(() => {
    if (!buildingData.value) return '';

    const trend = getTrend.value;
    const type = dataType.value === 'electric' ? '用电' : '用水';

    if (trend === '上升') {
        return `${type}量呈现上升趋势，可能是由于季节变化或使用量增加导致。建议加强${type}管理，避免不必要的浪费。`;
    } else if (trend === '下降') {
        return `${type}量呈现下降趋势，节能措施取得成效。继续保持良好习惯，可进一步优化${type}效率。`;
    } else {
        return `${type}量保持相对稳定，表明该建筑物${type}情况较为规律。可通过进一步分析发现优化空间。`;
    }
});

// 根据当前选择获取数据
const getData = () => {
    if (!buildingData.value) return [];

    if (timeRange.value === 'daily') {
        // 使用按月的日数据
        return dataType.value === 'electric'
            ? monthlyDailyData.value.electric
            : monthlyDailyData.value.water;
    } else {
        return dataType.value === 'electric'
            ? buildingData.value.monthlyElectric
            : buildingData.value.monthlyWater;
    }
};

// 计算本月总用量
const calculateMonthlyTotal = (type) => {
    if (!buildingData.value || !monthlyDailyData.value) return 0;

    const data = type === 'electric'
        ? monthlyDailyData.value.electric
        : monthlyDailyData.value.water;

    // 使用选定月份的数据总和
    return data.reduce((sum, v) => sum + v, 0);
};


// 计算电费预估
const calculateElectricCost = () => {
    const total = calculateMonthlyTotal('electric');
    // 假设电费单价为0.6元/kWh
    return (total * 0.6).toFixed(2);
};

// 计算水费预估
const calculateWaterCost = () => {
    const total = calculateMonthlyTotal('water');
    // 假设水费单价为4元/吨
    return (total * 4).toFixed(2);
};

let myChart = null;

// 清理图表实例
const disposeChart = () => {
    if (myChart) {
        myChart.dispose();
        myChart = null;
    }
};

// 渲染趋势图
const renderChart = () => {
    if (!buildingData.value) return;

    const chartDom = document.getElementById('trend-chart');
    if (!chartDom) return;

    // 显示加载中状态
    chartLoading.value = true;

    // 清理已存在的图表实例
    disposeChart();

    myChart = echarts.init(chartDom);
    const data = getData(); let xAxisData;
    if (timeRange.value === 'daily') {
        // 生成特定月份的日期标签
        const daysInMonth = data.length;
        xAxisData = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
    } else {
        xAxisData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    } const option = {
        title: {
            text: `${buildingData.value.name} ${timeRange.value === 'daily' ? monthNames[selectedMonth.value] : '全年'}${dataType.value === 'electric' ? '用电' : '用水'}量`,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: `{b} <br/>${dataType.value === 'electric' ? '用电量' : '用水量'}: {c} ${dataType.value === 'electric' ? 'kWh' : '吨'}`
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
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
            name: dataType.value === 'electric' ? 'kWh' : '吨',
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
                name: dataType.value === 'electric' ? '用电量' : '用水量',
                type: 'line',
                stack: 'Total',
                data: data,
                smooth: true,
                symbol: 'emptyCircle',
                symbolSize: 6,
                showSymbol: true,
                lineStyle: {
                    width: 3,
                    color: dataType.value === 'electric' ? '#3498db' : '#2ecc71'
                },
                itemStyle: {
                    color: dataType.value === 'electric' ? '#3498db' : '#2ecc71'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: dataType.value === 'electric' ? 'rgba(52, 152, 219, 0.5)' : 'rgba(46, 204, 113, 0.5)'
                        },
                        {
                            offset: 1,
                            color: dataType.value === 'electric' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)'
                        }
                    ])
                },
                markPoint: {
                    data: [
                        { type: 'max', name: '最大值' },
                        { type: 'min', name: '最小值' }
                    ]
                },
                markLine: {
                    data: [
                        { type: 'average', name: '平均值' }
                    ]
                }
            }
        ]
    }; myChart.setOption(option);

    // 窗口大小改变时重新调整图表大小
    window.addEventListener('resize', () => {
        myChart.resize();
    });

    // 隐藏加载中状态
    chartLoading.value = false;
};

// 提交报告
const submitReport = async () => {
    if (!buildingData.value || isSubmitting.value) return;

    if (!reportTitle.value) {
        alert('请输入报告标题');
        return;
    }

    isSubmitting.value = true;
    submitSuccess.value = false;

    try {
        const reportData = {
            buildingId: buildingId.value,
            buildingName: buildingData.value.name,
            title: reportTitle.value,
            type: reportType.value,
            notes: reportNotes.value,
            dataType: dataType.value,
            timeRange: timeRange.value,
            timestamp: new Date().toISOString()
        };

        const result = await mockApi.submitReport(reportData);
        submitSuccess.value = true;
        submitMessage.value = result.message;

        // 重置表单
        reportTitle.value = '';
        reportNotes.value = '';
    } catch (error) {
        console.error('提交报告失败:', error);
        submitSuccess.value = true;
        submitMessage.value = '提交报告失败，请稍后再试';
    } finally {
        isSubmitting.value = false;

        // 3秒后隐藏成功消息
        setTimeout(() => {
            submitSuccess.value = false;
        }, 3000);
    }
};

// 加载建筑物详细数据
const loadBuildingData = async () => {
    loading.value = true;
    buildingData.value = null;

    try {
        if (!buildingId.value) {
            loading.value = false;
            return;
        }

        // 加载建筑基本数据
        const data = await mockApi.getBuildingDetails(buildingId.value);
        buildingData.value = data;

        // 加载建筑特定月份日数据
        await loadMonthlyDailyData();

        // 渲染图表
        if (data) {
            // 使用 nextTick 确保 DOM 已更新
            await nextTick();
            renderChart();
        }
    } catch (error) {
        console.error('加载建筑物数据失败:', error);
    } finally {
        loading.value = false;
    }
};

// 加载特定月份的日数据
const loadMonthlyDailyData = async () => {
    try {
        if (!buildingId.value) return;

        // 显示加载状态
        chartLoading.value = true;

        const data = await mockApi.getBuildingDailyDataByMonth(buildingId.value, selectedMonth.value);
        if (data) {
            monthlyDailyData.value = data;
        }
    } catch (error) {
        console.error('加载月份日数据失败:', error);
    } finally {
        // 数据加载完成后会在renderChart中隐藏加载状态
        // 如果出现错误但没有调用renderChart，这里也确保隐藏加载状态
        if (!buildingData.value) {
            chartLoading.value = false;
        }
    }
};

// 在组件被缓存重新激活时重新加载数据
onActivated(() => {
    loadBuildingData();
});

// 组件卸载前清理图表实例
onBeforeUnmount(() => {
    disposeChart();
});

// 监听数据类型和时间范围变化，重新渲染图表
watch([dataType], () => {
    if (buildingData.value) {
        renderChart();
    }
});

// 当时间范围改变时，如果是日数据则加载特定月份数据
watch([timeRange], async () => {
    if (buildingData.value) {
        if (timeRange.value === 'daily') {
            await loadMonthlyDailyData();
        }
        renderChart();
    }
});

// 监听月份变化，重新加载数据
watch([selectedMonth], async () => {
    if (buildingData.value && timeRange.value === 'daily') {
        await loadMonthlyDailyData();
        renderChart();
    }
});

// 立即监听路由参数变化，重新加载数据
watch(buildingId, () => {
    loadBuildingData();
}, { immediate: true });
</script>

<style scoped>
.details-container {
    width: 100%;
}

.loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #eee;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

.loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-title {
    font-size: 1.8rem;
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

.back-link {
    padding: 8px 16px;
    background-color: #f5f7fa;
    color: #2c3e50;
    border-radius: 4px;
    text-decoration: none;
    transition: all 0.3s;
}

.back-link:hover {
    background-color: #e9ecef;
}

.no-data {
    text-align: center;
    padding: 40px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.no-data h2 {
    margin-bottom: 20px;
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

.card-comparison {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color, #333);
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

.chart {
    width: 100%;
    height: 100%;
    min-height: 360px;
}

.analysis-container {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.analysis-card {
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    flex: 1;
    min-width: 300px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.analysis-card h3 {
    font-size: 1.2rem;
    color: #2c3e50;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
}

.analysis-card p {
    margin-bottom: 15px;
    line-height: 1.6;
}

.analysis-card ul {
    padding-left: 20px;
}

.analysis-card li {
    margin-bottom: 8px;
    line-height: 1.5;
}

.report-container {
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
}

.form-group textarea {
    min-height: 100px;
    resize: vertical;
}

.submit-button {
    padding: 12px 24px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

.submit-button:hover {
    background-color: #2980b9;
}

.submit-button:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
}

.success-message {
    margin-top: 15px;
    padding: 10px;
    background-color: #d5f5e3;
    color: #27ae60;
    border-radius: 4px;
    text-align: center;
}

@media (max-width: 768px) {
    .data-cards {
        flex-direction: column;
    }

    .analysis-container {
        flex-direction: column;
    }
}
</style>