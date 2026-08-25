<script setup lang="ts">
defineProps<{ soDiem: number }>()
</script>

<template>
  <div class="map-stats">
    <span><b>{{ soDiem }}</b> điểm hiển thị</span>
    <span class="dot-sep">·</span>
    <span><b>124</b> xã, phường</span>
    <span class="dot-sep">·</span>
    <span class="stat-note">Dữ liệu điểm cứu trợ &amp; báo cáo hiện là dữ liệu minh hoạ cho đồ án, chưa nối với PostGIS thật.</span>
  </div>
</template>
