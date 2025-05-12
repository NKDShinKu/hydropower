<template>
    <nav class="navbar">
        <div class="logo">
            <img src="/hydropower.jpg" alt="Logo" class="logo-img" />
            <span class="logo-text">校园水电能耗可视化系统</span>
        </div>
        <div class="nav-links">
            <router-link to="/" class="nav-link">总览页</router-link>
            <router-link to="/details" class="nav-link">详情页</router-link>
        </div>
        <div class="date-time">
            <span>{{ currentDateTime }}</span>
        </div>
    </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const currentDateTime = ref('');

const updateDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentDateTime.value = `${year}年${month}月${day}日 ${hours}:${minutes}`;
};

onMounted(() => {
    updateDateTime();
    setInterval(updateDateTime, 60000); // 每分钟更新一次时间
});
</script>

<style scoped>
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 2rem;
    background-color: #2c3e50;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
}

.logo {
    display: flex;
    align-items: center;
}

.logo-img {
    height: 30px;
    margin-right: 10px;
}

.logo-text {
    font-size: 1.2rem;
    font-weight: bold;
}

.nav-links {
    display: flex;
    gap: 20px;
}

.nav-link {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.nav-link:hover,
.router-link-active {
    background-color: #375a7f;
}

.date-time {
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
        padding: 0.5rem;
    }

    .nav-links {
        margin: 10px 0;
    }

    .date-time {
        margin-top: 5px;
    }
}
</style>