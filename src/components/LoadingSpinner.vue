<template>
    <div class="loading-wrapper" v-if="loading">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p class="loading-text">{{ text || '加载中...' }}</p>
        </div>
    </div>
</template>

<script setup>
defineProps({
    loading: {
        type: Boolean,
        default: true
    },
    text: {
        type: String,
        default: ''
    }
});
</script>

<style scoped>
.loading-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.loading-spinner {
    text-align: center;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

.loading-text {
    color: #2c3e50;
    font-size: 16px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>