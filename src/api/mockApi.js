// 模拟 API 延迟
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟水电能耗数据
const buildingsData = [
  { id: 1, name: "教学楼A", electric: 48000, water: 1300 },
  { id: 2, name: "教学楼B", electric: 42000, water: 1100 },
  { id: 3, name: "教学楼C", electric: 36000, water: 950 },
  { id: 4, name: "教学楼D", electric: 31000, water: 870 },
  { id: 5, name: "教学楼E", electric: 27000, water: 800 },
];

// 模拟每月能耗趋势数据
const monthlyData = {
  electric: [
    4000, 3800, 4200, 4500, 4700, 4600, 5000, 5100, 4900, 5200, 5300, 5500,
  ],
  water: [110, 105, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160],
};

// 模拟每个建筑的详细数据
const buildingDetails = {};
// 为每个月生成日数据
const generateMonthlyDailyData = (month) => {
  // 根据月份确定天数
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  return Array.from(
    { length: daysInMonth },
    () => Math.floor(Math.random() * 50) + 10
  );
};

// 为每个月生成日水量数据
const generateMonthlyDailyWaterData = (month) => {
  // 根据月份确定天数
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  return Array.from(
    { length: daysInMonth },
    () => Math.floor(Math.random() * 15) + 5
  );
};

buildingsData.forEach((building) => {
  // 生成12个月的日用电数据
  const dailyElectricByMonth = {};
  const dailyWaterByMonth = {};

  for (let i = 0; i < 12; i++) {
    dailyElectricByMonth[i] = generateMonthlyDailyData(i);
    dailyWaterByMonth[i] = generateMonthlyDailyWaterData(i);
  }

  buildingDetails[building.id] = {
    name: building.name,
    dailyElectric: Array.from(
      { length: 30 },
      () => Math.floor(Math.random() * 50) + 10
    ),
    dailyWater: Array.from(
      { length: 30 },
      () => Math.floor(Math.random() * 15) + 5
    ),
    monthlyElectric: Array.from(
      { length: 12 },
      () => Math.floor(Math.random() * 200) + 100
    ),
    monthlyWater: Array.from(
      { length: 12 },
      () => Math.floor(Math.random() * 60) + 40
    ),
    // 新增按月日数据
    dailyElectricByMonth,
    dailyWaterByMonth,
  };
});

// 生成特定月份的日数据
const generateDailyDataForMonth = (month) => {
  // 根据月份确定天数
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];

  return {
    electric: Array.from(
      { length: daysInMonth },
      () => Math.floor(Math.random() * 50) + 10
    ),
    water: Array.from(
      { length: daysInMonth },
      () => Math.floor(Math.random() * 15) + 5
    ),
  };
};

// API 方法
export const mockApi = {
  // 获取所有建筑物基本数据
  async getBuildings() {
    await delay(800);
    return buildingsData;
  },

  // 获取每日能耗趋势数据（按月）
  async getDailyTrends(month = 0) {
    await delay(1000);
    return generateDailyDataForMonth(month);
  },

  // 获取每月能耗趋势数据
  async getMonthlyTrends() {
    await delay(1200);
    return monthlyData;
  },

  // 获取单个建筑的详细数据
  async getBuildingDetails(buildingId) {
    await delay(1500);
    return buildingDetails[buildingId] || null;
  },

  // 获取单个建筑的特定月份日数据
  async getBuildingDailyDataByMonth(buildingId, month = 0) {
    await delay(1200);
    const building = buildingDetails[buildingId];
    if (!building) return null;

    return {
      electric: building.dailyElectricByMonth[month] || [],
      water: building.dailyWaterByMonth[month] || [],
    };
  },

  // 模拟提交数据
  async submitReport(data) {
    await delay(2000);
    console.log("提交的报告数据:", data);
    return { success: true, message: "报告提交成功！" };
  },
};
